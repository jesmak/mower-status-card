/** What the card makes of the mower's states: whether a task is under way, which button leads, and what is wrong. */
import { ERROR_FRESH_MS, FEATURE_DOCK, FEATURE_PAUSE, MAMMOTION_ASSETS } from "./const";
import type { HassEntity } from "./hass";
import type { Notice, Slot } from "./types";

/** States in which a task has been started and not finished: it can be continued or cancelled. */
const TASK_STATES = new Set(["mowing", "paused", "returning", "error"]);

/** A sensor's way of saying it has nothing. */
const EMPTY = new Set(["", "unknown", "unavailable", "none", "null"]);

/** An error sensor's way of saying all is well, such as the "no_error" of Husqvarna's enum or Sunseeker's "normal". */
const NO_ERROR = new Set([...EMPTY, "no_error", "ok", "normal"]);

export type MainAction = "pause" | "dock" | "continue" | "start";

export function hasTask(state: string | undefined): boolean {
    return TASK_STATES.has(state ?? "");
}

/**
 * The big button: pause while mowing, or dock a mower that can't pause; continue an unfinished task; otherwise start.
 * `features` is the lawn_mower entity's supported_features.
 */
export function mainAction(state: string | undefined, features: number): MainAction {
    if (state === "mowing") {
        return features & FEATURE_PAUSE || !(features & FEATURE_DOCK) ? "pause" : "dock";
    }
    return hasTask(state) ? "continue" : "start";
}

export function numberOf(entity: HassEntity | undefined): number | null {
    if (!entity || EMPTY.has(entity.state.toLowerCase())) {
        return null;
    }
    const value = Number(entity.state);
    return Number.isFinite(value) ? value : null;
}

/** A duration sensor's value in minutes, whatever its unit. */
export function minutesOf(entity: HassEntity | undefined): number | null {
    const value = numberOf(entity);
    if (value === null) {
        return null;
    }
    const unit = String(entity?.attributes.unit_of_measurement ?? "min");
    const factor: Record<string, number> = { s: 1 / 60, min: 1, h: 60, d: 1440 };
    return value * (factor[unit] ?? 1);
}

/** An error as a person reads it: without the integration's source prefix ("mcu: "), starting with a capital. */
export function errorText(raw: string | undefined, language: string): string | null {
    const text = (raw ?? "").trim().replace(/^[a-z][\w-]{0,15}:\s+/, "");
    if (EMPTY.has(text.toLowerCase())) {
        return null;
    }
    return text.charAt(0).toLocaleUpperCase(language) + text.slice(1);
}

/**
 * When the error happened, from the integration's own time sensor, or null without one. Not from when the error's
 * text changed: Home Assistant resets that at every restart, which would make a week-old error new again.
 */
export function errorTime(time: HassEntity | undefined): number | null {
    const reported = time && !EMPTY.has(time.state.toLowerCase()) ? Date.parse(time.state) : NaN;
    return Number.isFinite(reported) ? reported : null;
}

/** The end of the last mowing in the mower's history (newest last), in milliseconds, or null when there is none. */
export function lastMowingEnd(rows: Array<{ s: string; lu: number; lc?: number }>): number | null {
    let end: number | null = null;
    for (let index = 1; index < rows.length; index++) {
        if (rows[index - 1].s === "mowing" && rows[index].s !== "mowing") {
            end = (rows[index].lc ?? rows[index].lu) * 1000;
        }
    }
    return end;
}

/** Device name prefixes to the stem of the picture ha-mammotion-assets has of the model. The longest prefix that fits wins. */
const MAMMOTION_MODELS: Array<[string, string | null]> = [
    ["Yuka-MN", "yuka_mn"],
    ["Yuka-MV", "yuka_mn_231"],
    ["Yuka-ML", "yuka_ml"],
    ["Yuka-VP", "yuka_vp"],
    ["Yuka-", "yuka"],
    ["Luba-VP", "luba_vp"],
    ["Luba-MN", "luba_mn"],
    ["Luba-LD", "luba_ld"],
    ["Luba-VA", "luba_442"],
    ["Luba-LA", "new_luba_la_432"],
    ["Luba-MB", "luba_mb"],
    ["Luba-HM", "new_pro"],
    // The Luba 2 has no picture there, and must not fall through to the Luba 1's.
    ["Luba-VS", null],
    ["Luba", "luba"],
];

/** The pictures to try for a Mammotion mower, the white model's first when asked for. Their file types vary. */
export function mammotionPictures(deviceName: string | null | undefined, variant: string | undefined): string[] {
    const model = MAMMOTION_MODELS.find(([prefix]) => (deviceName ?? "").startsWith(prefix));
    if (!model?.[1]) {
        return [];
    }
    const stems = variant === "white" ? [`${model[1]}_white`, model[1]] : [model[1]];
    return stems.flatMap((stem) => [".webp", ".png"].map((extension) => `${MAMMOTION_ASSETS}/dc_bg_main_car_${stem}${extension}`));
}

export interface NoticeInput {
    states: Partial<Record<Slot, HassEntity>>;
    mowerState: string | undefined;
    now: number;
    language: string;
    bladeWarningHours?: number;
    /** A state as the user reads it, so an enum error sensor shows its translation rather than its key. */
    format: (entity: HassEntity) => string;
    /** An error's text the integration put in place of the mower's state, as an older Sunseeker does. */
    stateError?: string;
}

/** Whether a positioning sensor says it is weak: Mammotion's own values, or "on" from a binary sensor of any integration. */
function weakPositioning(entity: HassEntity | undefined, bad: string[]): boolean {
    if (!entity) {
        return false;
    }
    return entity.entity_id.startsWith("binary_sensor.") ? entity.state === "on" : bad.includes(entity.state);
}

/** What is wrong, the most severe first. Nothing is a notice while it is fine. */
export function notices({ states, mowerState, now, language, bladeWarningHours, format, stateError }: NoticeInput): Notice[] {
    const found: Notice[] = [];

    const reported = states.error;
    const error = reported && !NO_ERROR.has(reported.state.toLowerCase()) ? errorText(format(reported), language) : null;
    // An error without a time of its own is shown only while the mower is in its error state, as its age is unknown.
    const errorAt = error ? errorTime(states.error_time) : null;
    // While the mower stays in error its error stays, however old. The text box carries its date.
    if (error && (mowerState === "error" || (errorAt !== null && now - errorAt < ERROR_FRESH_MS))) {
        found.push({ id: "error", level: "red", values: { text: error, time: errorAt === null ? "" : String(errorAt) } });
    } else if (mowerState === "error") {
        found.push({ id: "error", level: "red", values: { text: errorText(stateError, language) ?? "", time: "" } });
    }

    // Weak positioning matters only while the mower is out on the lawn. A task can be paused in the dock all night while
    // it charges, as Mammotion's are, and its camera sees nothing there after dark. Without a charging sensor, only
    // mowing and returning count.
    // A mowing or returning mower is out whatever its charging sensor says: Mammotion's lags ten minutes behind the start.
    const outside =
        mowerState === "mowing" ||
        mowerState === "returning" ||
        (!!states.charging && hasTask(mowerState) && states.charging.state !== "on");
    if (outside) {
        const rtkBad = weakPositioning(states.positioning, ["None", "Single", "Float"]);
        const visionBad = weakPositioning(states.vision, ["SIGNAL_NONE", "SIGNAL_BAD"]);
        if (rtkBad || visionBad) {
            // A binary sensor says only that something is wrong, so its chip says no more either.
            const rtkMode = rtkBad && states.positioning?.entity_id.startsWith("sensor.") ? states.positioning.state : "";
            found.push({
                id: "positioning",
                level: "amber",
                values: {
                    rtk: rtkMode,
                    vision: visionBad ? "1" : "",
                    generic: rtkBad && !rtkMode ? "1" : "",
                    satellites: numberOf(states.satellites)?.toString() ?? "",
                },
            });
        }
    }

    const used = minutesOf(states.blade_time);
    const ownLimit = minutesOf(states.blade_limit);
    const limit = ownLimit && ownLimit > 0 ? ownLimit : bladeWarningHours && bladeWarningHours > 0 ? bladeWarningHours * 60 : null;
    if (used !== null && limit !== null && used >= limit) {
        found.push({ id: "blade", level: "amber", values: { used: String(Math.floor(used / 60)), limit: String(Math.round(limit / 60)) } });
    }

    // A binary sensor is on in rain. A sensor of the integration's own, such as Sunseeker's, says "wet".
    if (states.rain?.state === "on" || states.rain?.state === "wet") {
        found.push({ id: "rain", level: "blue", values: {} });
    }

    if (states.update?.state === "on") {
        found.push({
            id: "update",
            level: "blue",
            values: {
                latest: String(states.update.attributes.latest_version ?? ""),
                installed: String(states.update.attributes.installed_version ?? ""),
            },
        });
    }
    return found;
}
