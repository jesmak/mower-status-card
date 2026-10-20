/**
 * Finds the mower's companion entities on its own device: battery, progress, errors, buttons and the rest.
 *
 * Two layers. Home Assistant's own standards find a few for any mower (a battery is a sensor with the battery device
 * class). An integration's preset finds the rest by the translation keys its entities carry, which stay put when a user
 * renames an entity. The configuration then holds only what differs from what was found.
 *
 * A preset can also tell what the integration's own states mean, for an integration that doesn't keep to Home
 * Assistant's lawn_mower states, as Sunseeker's doesn't.
 */
import type { HassEntity, HomeAssistant } from "./hass";
import { NONE, SLOTS } from "./types";
import type { MowerStatusCardConfig, Slot } from "./types";

/**
 * The domains a slot's entity can be in. A positioning slot also takes a binary sensor whose "on" means weak, and the
 * rain slot a sensor whose "wet" means rain.
 */
export const SLOT_DOMAINS: Record<Slot, string[]> = {
    battery: ["sensor"],
    charging: ["binary_sensor"],
    progress: ["sensor"],
    time_left: ["sensor"],
    elapsed: ["sensor"],
    error: ["sensor"],
    error_time: ["sensor"],
    rain: ["binary_sensor", "sensor"],
    positioning: ["sensor", "binary_sensor"],
    vision: ["sensor", "binary_sensor"],
    satellites: ["sensor"],
    blade_time: ["sensor"],
    blade_limit: ["sensor"],
    update: ["update"],
    mileage: ["sensor"],
    continue: ["button"],
    cancel: ["button"],
    picture: ["image"],
};

/** What any integration's entity is, by Home Assistant's own device classes and domains. */
const GENERIC: Partial<Record<Slot, (entity: HassEntity) => boolean>> = {
    battery: (entity) => domain(entity.entity_id) === "sensor" && entity.attributes.device_class === "battery",
    charging: (entity) => domain(entity.entity_id) === "binary_sensor" && entity.attributes.device_class === "battery_charging",
    rain: (entity) => domain(entity.entity_id) === "binary_sensor" && entity.attributes.device_class === "moisture",
    update: (entity) => domain(entity.entity_id) === "update",
};

/** Home Assistant's own lawn_mower states, which the card goes by. */
const STANDARD_STATES = new Set(["mowing", "docked", "paused", "returning", "idle", "error", "unavailable", "unknown"]);

export interface Preset {
    /** The translation key of each slot's entity. */
    slots: Partial<Record<Slot, string>>;
    /** The integration's own states as Home Assistant's: mowing, returning, paused, docked, idle, error or unavailable. */
    states?: Record<string, string>;
    /** What any other state of the integration's own is. */
    otherStates?: string;
    /** States in which the mower charges, for an integration with no charging sensor. */
    chargingStates?: string[];
    /** States that say no more than the standard one they map to, so the card names them in its own words. */
    plainStates?: string[];
}

/** Per integration. Mammotion's keys are the same for every model, and its states Home Assistant's own. */
export const PRESETS: Record<string, Preset> = {
    mammotion: {
        slots: {
            battery: "battery_percent",
            progress: "progress",
            time_left: "left_time",
            elapsed: "elapsed_time",
            error: "error_1_message",
            error_time: "error_1_time",
            rain: "rain_detected",
            positioning: "positioning_mode",
            vision: "visual_positioning_status",
            satellites: "gps_stars",
            blade_time: "blade_used_time",
            blade_limit: "blade_used_warn_time",
            update: "update",
            mileage: "maintenance_distance",
            continue: "continue_last_job",
            cancel: "cancel_task",
        },
    },
    sunseeker: {
        slots: {
            error: "sunseeker_error_text",
            rain: "sunseeker_rain_status",
            picture: "mower_robot_image",
        },
        states: {
            working: "mowing",
            mowing_border: "mowing",
            continue_mowing: "mowing",
            locating: "mowing",
            edge_confirming: "mowing",
            auto_mapping: "mowing",
            return: "returning",
            on_the_way_home: "returning",
            pause: "paused",
            return_pause: "paused",
            build_map_paused: "paused",
            charging: "docked",
            charging_full: "docked",
            standby: "idle",
            stop: "idle",
            sleep: "idle",
            remote_control: "idle",
            updating_firmware: "idle",
            enter_pin: "idle",
            unknown4: "idle",
            stuck: "error",
            offline: "unavailable",
        },
        // An older Sunseeker puts its error's text in place of its state.
        otherStates: "error",
        chargingStates: ["charging"],
        plainStates: ["standby"],
    },
};

/** The integration's preset, if the card has one. */
export function presetOf(hass: HomeAssistant, mower: string): Preset | undefined {
    return PRESETS[platformOf(hass, mower) ?? ""];
}

/** What a state of the mower means to the card, in Home Assistant's lawn_mower states. */
export function activityOf(preset: Preset | undefined, state: string): string {
    return preset?.states?.[state] ?? (STANDARD_STATES.has(state) ? state : (preset?.otherStates ?? state));
}

export function domain(entityId: string): string {
    return entityId.split(".")[0];
}

/** The integration the mower comes from, such as "mammotion". */
export function platformOf(hass: HomeAssistant, mower: string): string | undefined {
    return hass.entities?.[mower]?.platform;
}

/** The other entities on the mower's device, hidden ones last, so a found slot is one the user still sees. */
function deviceEntities(hass: HomeAssistant, mower: string): string[] {
    const deviceId = hass.entities?.[mower]?.device_id;
    if (!deviceId || !hass.entities) {
        return [];
    }
    return Object.values(hass.entities)
        .filter((entry) => !!entry && entry.device_id === deviceId && entry.entity_id !== mower)
        .sort((a, b) => Number(!!a?.hidden) - Number(!!b?.hidden) || a!.entity_id.localeCompare(b!.entity_id))
        .map((entry) => entry!.entity_id);
}

/** What the card finds by itself for each slot. */
export function detectSlots(hass: HomeAssistant, mower: string): Partial<Record<Slot, string>> {
    const entities = deviceEntities(hass, mower);
    const preset = presetOf(hass, mower)?.slots ?? {};
    const found: Partial<Record<Slot, string>> = {};
    for (const slot of SLOTS) {
        const key = preset[slot];
        const byKey = key
            ? entities.find((id) => SLOT_DOMAINS[slot].includes(domain(id)) && hass.entities?.[id]?.translation_key === key)
            : undefined;
        const generic = GENERIC[slot];
        const entity = byKey ?? (generic ? entities.find((id) => !!hass.states[id] && generic(hass.states[id]!)) : undefined);
        if (entity) {
            found[slot] = entity;
        }
    }
    return found;
}

/** The slots the card uses: what it found, with the configuration's changes on top. */
export function resolveSlots(hass: HomeAssistant, config: MowerStatusCardConfig): Partial<Record<Slot, string>> {
    const slots: Partial<Record<Slot, string>> = { ...detectSlots(hass, config.entity) };
    for (const [slot, entity] of Object.entries(config.entities ?? {}) as Array<[Slot, string]>) {
        if (!SLOTS.includes(slot)) {
            continue;
        }
        if (entity === NONE || !entity) {
            delete slots[slot];
        } else {
            slots[slot] = entity;
        }
    }
    return slots;
}

/**
 * What the editor writes: only the slots chosen differently from what was found, an emptied one as "none". A "none"
 * written earlier for a slot where nothing is found now stays, so editing another slot doesn't drop it.
 */
export function slotChanges(
    found: Partial<Record<Slot, string>>,
    chosen: Partial<Record<Slot, string>>,
    previous: Partial<Record<Slot, string>> = {},
): Partial<Record<Slot, string>> {
    const changes: Partial<Record<Slot, string>> = {};
    for (const slot of SLOTS) {
        const value = chosen[slot] || undefined;
        if (value === (found[slot] || undefined)) {
            if (!value && previous[slot] === NONE) {
                changes[slot] = NONE;
            }
            continue;
        }
        changes[slot] = value ?? NONE;
    }
    return changes;
}
