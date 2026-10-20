import type { EntityRegistryEntry, HassEntity, HomeAssistant } from "../src/hass";

/** A made-up Mammotion mower, "Matti", with the entities and translation keys the integration gives a Yuka Mini. */
export const NOW = Date.parse("2026-07-15T12:00:00Z");

const DEVICE = "device-1";

interface Made {
    state: string;
    attributes?: Record<string, unknown>;
    translation_key?: string;
    last_changed?: string;
}

const ENTITIES: Record<string, Made> = {
    "lawn_mower.matti": { state: "docked", attributes: { friendly_name: "Matti Robottiruohonleikkuri", supported_features: 15 } },
    "sensor.matti_battery": {
        state: "94",
        attributes: { device_class: "battery", unit_of_measurement: "%" },
        translation_key: "battery_percent",
    },
    "binary_sensor.matti_charging": { state: "on", attributes: { device_class: "battery_charging" } },
    "sensor.matti_progress": { state: "0", attributes: { unit_of_measurement: "%" }, translation_key: "progress" },
    "sensor.matti_time_left": { state: "0", attributes: { unit_of_measurement: "min" }, translation_key: "left_time" },
    "sensor.matti_elapsed": { state: "0", attributes: { unit_of_measurement: "min" }, translation_key: "elapsed_time" },
    "sensor.matti_last_error": { state: "unknown", translation_key: "error_1_message" },
    "sensor.matti_last_error_time": { state: "unknown", attributes: { device_class: "timestamp" }, translation_key: "error_1_time" },
    "binary_sensor.matti_rain": { state: "off", attributes: { device_class: "moisture" }, translation_key: "rain_detected" },
    "sensor.matti_rtk": { state: "Fix", translation_key: "positioning_mode" },
    "sensor.matti_vision": { state: "SIGNAL_GOOD", translation_key: "visual_positioning_status" },
    "sensor.matti_satellites": { state: "30", translation_key: "gps_stars" },
    "sensor.matti_blade_time": { state: "12.5", attributes: { unit_of_measurement: "h" }, translation_key: "blade_used_time" },
    "sensor.matti_blade_limit": { state: "100", attributes: { unit_of_measurement: "h" }, translation_key: "blade_used_warn_time" },
    "update.matti_firmware": {
        state: "off",
        attributes: { device_class: "firmware", installed_version: "1.2.3", latest_version: "1.2.3" },
        translation_key: "update",
    },
    "sensor.matti_mileage": { state: "123.4", attributes: { unit_of_measurement: "km" }, translation_key: "maintenance_distance" },
    "button.matti_continue": { state: "unknown", translation_key: "continue_last_job" },
    "button.matti_cancel": { state: "unknown", translation_key: "cancel_task" },
};

/** The mower's Home Assistant, with any states changed, entities removed or the platform swapped. */
export function mockHass(
    changes: Record<string, Partial<Made> | null> = {},
    options: { platform?: string; deviceName?: string } = {},
): HomeAssistant {
    const states: Record<string, HassEntity> = {};
    const entities: Record<string, EntityRegistryEntry> = {};
    for (const [id, base] of Object.entries(ENTITIES)) {
        if (changes[id] === null) {
            continue;
        }
        const made = { ...base, ...changes[id] };
        states[id] = {
            entity_id: id,
            state: made.state,
            last_changed: made.last_changed ?? new Date(NOW - 3_600_000).toISOString(),
            attributes: { ...made.attributes },
        };
        entities[id] = {
            entity_id: id,
            device_id: DEVICE,
            platform: options.platform ?? "mammotion",
            translation_key: options.platform && options.platform !== "mammotion" ? undefined : made.translation_key,
        };
    }
    return {
        // Home Assistant's own formatting in short: a number rounded, with its unit.
        formatEntityState: (entity) => {
            const unit = entity.attributes.unit_of_measurement;
            const value = Number(entity.state);
            return `${Number.isFinite(value) && entity.state !== "" ? Math.round(value) : entity.state}${unit ? ` ${unit}` : ""}`;
        },
        callWS: async <T>() => ({}) as T,
        localize: () => "",
        language: "fi",
        locale: { language: "fi", time_zone: "server" },
        config: { time_zone: "Europe/Helsinki" },
        states,
        entities,
        devices: { [DEVICE]: { id: DEVICE, name: options.deviceName ?? "Yuka-MNEXAMPLE1", name_by_user: "Matti" } },
    };
}
