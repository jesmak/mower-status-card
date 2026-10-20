import { describe, expect, it } from "vitest";

import type { HassEntity } from "../src/hass";
import { errorText, hasTask, lastMowingEnd, mainAction, mammotionPictures, minutesOf, notices } from "../src/mower";
import { NOW } from "./fixtures";

const plain = (state: HassEntity) => state.state;

function entity(
    state: string,
    attributes: Record<string, unknown> = {},
    lastChanged = new Date(NOW - 3_600_000).toISOString(),
): HassEntity {
    return { entity_id: "sensor.x", state, attributes, last_changed: lastChanged };
}

describe("the main button", () => {
    it("pauses while mowing, continues an unfinished task and otherwise starts a new one", () => {
        expect(mainAction("mowing", 15)).toBe("pause");
        expect(mainAction("paused", 15)).toBe("continue");
        expect(mainAction("returning", 15)).toBe("continue");
        expect(mainAction("error", 15)).toBe("continue");
        expect(mainAction("docked", 15)).toBe("start");
        expect(mainAction("unavailable", 15)).toBe("start");
    });

    it("docks a mower that can't pause, and keeps pause for one that can't dock either", () => {
        expect(mainAction("mowing", 1 + 4)).toBe("dock");
        expect(mainAction("mowing", 1)).toBe("pause");
    });

    it("counts a task as under way until the mower is docked", () => {
        expect(hasTask("paused")).toBe(true);
        expect(hasTask("docked")).toBe(false);
        expect(hasTask(undefined)).toBe(false);
    });
});

describe("minutesOf", () => {
    it("reads a duration in its own unit", () => {
        expect(minutesOf(entity("90", { unit_of_measurement: "s" }))).toBe(1.5);
        expect(minutesOf(entity("38", { unit_of_measurement: "min" }))).toBe(38);
        expect(minutesOf(entity("2.5", { unit_of_measurement: "h" }))).toBe(150);
        expect(minutesOf(entity("unknown"))).toBeNull();
    });
});

describe("errorText", () => {
    it("drops the source prefix and starts with a capital", () => {
        expect(errorText("mcu: robotti on jumissa", "fi")).toBe("Robotti on jumissa");
    });

    it("keeps a text whose start only looks like a prefix", () => {
        expect(errorText("Huomio: terä on jumissa", "fi")).toBe("Huomio: terä on jumissa");
    });

    it("reads an empty sensor as no error", () => {
        expect(errorText("unknown", "fi")).toBeNull();
        expect(errorText("None", "fi")).toBeNull();
        expect(errorText("", "fi")).toBeNull();
    });
});

describe("notices", () => {
    const quiet = {
        positioning: entity("Fix"),
        vision: entity("SIGNAL_GOOD"),
        blade_time: entity("12", { unit_of_measurement: "h" }),
        blade_limit: entity("100", { unit_of_measurement: "h" }),
        rain: entity("off"),
        update: entity("off"),
    };

    it("shows nothing while all is well", () => {
        expect(notices({ states: quiet, mowerState: "mowing", now: NOW, language: "fi", format: plain })).toEqual([]);
    });

    it("shows an error for 24 hours after its own time, and then no more", () => {
        const states = {
            ...quiet,
            error: entity("mcu: robotti on jumissa"),
            error_time: entity(new Date(NOW - 23 * 3_600_000).toISOString()),
        };
        expect(notices({ states, mowerState: "paused", now: NOW, language: "fi", format: plain })[0]).toMatchObject({
            id: "error",
            values: { text: "Robotti on jumissa" },
        });
        expect(notices({ states, mowerState: "paused", now: NOW + 2 * 3_600_000, language: "fi", format: plain })).toEqual([]);
    });

    it("shows an error with no time of its own only while the mower is in error, as its age is unknown", () => {
        const states = { ...quiet, error: entity("robotti on jumissa") };
        expect(notices({ states, mowerState: "docked", now: NOW, language: "fi", format: plain })).toEqual([]);
        expect(notices({ states, mowerState: "error", now: NOW, language: "fi", format: plain })).toEqual([
            { id: "error", level: "red", values: { text: "Robotti on jumissa", time: "" } },
        ]);
    });

    it("reads an error sensor's own word for no error as no error", () => {
        for (const word of ["no_error", "normal", "ok"]) {
            const states = { ...quiet, error: entity(word), error_time: entity(new Date(NOW - 60_000).toISOString()) };
            expect(notices({ states, mowerState: "paused", now: NOW, language: "fi", format: plain })).toEqual([]);
        }
    });

    it("shows an enum error as Home Assistant translates it", () => {
        const states = { ...quiet, error: entity("wheel_motor_blocked"), error_time: entity(new Date(NOW - 3_600_000).toISOString()) };
        const format = (state: HassEntity) => (state.state === "wheel_motor_blocked" ? "pyörän moottori jumissa" : state.state);
        expect(notices({ states, mowerState: "paused", now: NOW, language: "fi", format })[0].values.text).toBe("Pyörän moottori jumissa");
    });

    it("shows a generic error when the mower is in error with no fresh text", () => {
        expect(notices({ states: quiet, mowerState: "error", now: NOW, language: "fi", format: plain })).toEqual([
            { id: "error", level: "red", values: { text: "", time: "" } },
        ]);
    });

    it("shows weak positioning only while there is a task", () => {
        const states = { ...quiet, positioning: entity("Float"), satellites: entity("12") };
        expect(notices({ states, mowerState: "mowing", now: NOW, language: "fi", format: plain })).toEqual([
            { id: "positioning", level: "amber", values: { rtk: "Float", vision: "", generic: "", satellites: "12" } },
        ]);
        expect(notices({ states, mowerState: "docked", now: NOW, language: "fi", format: plain })).toEqual([]);
    });

    it("takes a binary sensor's on as weak positioning, with nothing more to say about it", () => {
        const states = { ...quiet, positioning: { ...entity("on"), entity_id: "binary_sensor.positioning_problem" } };
        expect(notices({ states, mowerState: "mowing", now: NOW, language: "fi", format: plain })).toEqual([
            { id: "positioning", level: "amber", values: { rtk: "", vision: "", generic: "1", satellites: "" } },
        ]);
    });

    it("leaves positioning alone while the mower charges in its dock in the middle of a task", () => {
        const states = { ...quiet, vision: entity("SIGNAL_NONE") };
        const ids = (mowerState: string, charging?: string) =>
            notices({
                states: charging ? { ...states, charging: entity(charging) } : states,
                mowerState,
                now: NOW,
                language: "fi",
                format: plain,
            }).map((notice) => notice.id);
        expect(ids("paused", "on")).toEqual([]);
        expect(ids("paused", "off")).toEqual(["positioning"]);
        // Without a charging sensor only mowing and returning count, as a paused mower may well be in its dock.
        expect(ids("paused")).toEqual([]);
        expect(ids("returning")).toEqual(["positioning"]);
    });

    it("watches positioning while mowing though a lagging charging sensor still says charging", () => {
        const states = { ...quiet, vision: entity("SIGNAL_NONE"), charging: entity("on") };
        expect(notices({ states, mowerState: "mowing", now: NOW, language: "fi", format: plain }).map((notice) => notice.id)).toEqual([
            "positioning",
        ]);
    });

    it("keeps the error's own text while the mower stays in error, however old it is", () => {
        const states = { ...quiet, error: entity("robotti on jumissa"), error_time: entity(new Date(NOW - 30 * 3_600_000).toISOString()) };
        expect(notices({ states, mowerState: "error", now: NOW, language: "fi", format: plain })[0].values.text).toBe("Robotti on jumissa");
        expect(notices({ states, mowerState: "docked", now: NOW, language: "fi", format: plain })).toEqual([]);
    });

    it("warns of the blades at the mower's own limit, or the card's when the mower has none", () => {
        const worn = { ...quiet, blade_time: entity("104.2", { unit_of_measurement: "h" }) };
        expect(notices({ states: worn, mowerState: "docked", now: NOW, language: "fi", format: plain })).toEqual([
            { id: "blade", level: "amber", values: { used: "104", limit: "100" } },
        ]);
        const noLimit = { ...worn, blade_limit: entity("0", { unit_of_measurement: "h" }) };
        expect(notices({ states: noLimit, mowerState: "docked", now: NOW, language: "fi", format: plain })).toEqual([]);
        expect(
            notices({ states: noLimit, mowerState: "docked", now: NOW, language: "fi", format: plain, bladeWarningHours: 80 })[0],
        ).toMatchObject({
            id: "blade",
            values: { limit: "80" },
        });
    });

    it("orders them by severity", () => {
        const states = {
            ...quiet,
            error: entity("robotti on jumissa"),
            error_time: entity(new Date(NOW - 3_600_000).toISOString()),
            rain: entity("on"),
            update: entity("on", { latest_version: "2.0", installed_version: "1.9" }),
            positioning: entity("Single"),
            charging: entity("off"),
        };
        expect(notices({ states, mowerState: "paused", now: NOW, language: "fi", format: plain }).map((notice) => notice.id)).toEqual([
            "error",
            "positioning",
            "rain",
            "update",
        ]);
    });
});

describe("lastMowingEnd", () => {
    it("is the last time the mower stopped mowing", () => {
        const rows = [
            { s: "docked", lu: 100 },
            { s: "mowing", lu: 200 },
            { s: "returning", lu: 300 },
            { s: "paused", lu: 400 },
            { s: "mowing", lu: 500 },
            { s: "returning", lu: 600, lc: 590 },
            { s: "docked", lu: 700 },
        ];
        expect(lastMowingEnd(rows)).toBe(590_000);
    });

    it("is null when there was no mowing in the history", () => {
        expect(lastMowingEnd([{ s: "docked", lu: 100 }])).toBeNull();
        expect(lastMowingEnd([])).toBeNull();
    });
});

describe("mammotionPictures", () => {
    it("knows the model by the device's own name, trying both file types", () => {
        expect(mammotionPictures("Yuka-MNEXAMPLE1", "default")).toEqual([
            "/hacsfiles/ha-mammotion-assets/dist/assets/dc_bg_main_car_yuka_mn.webp",
            "/hacsfiles/ha-mammotion-assets/dist/assets/dc_bg_main_car_yuka_mn.png",
        ]);
    });

    it("tries the white model first when asked, then the standard one", () => {
        expect(mammotionPictures("Yuka-MNEXAMPLE1", "white")[0]).toBe(
            "/hacsfiles/ha-mammotion-assets/dist/assets/dc_bg_main_car_yuka_mn_white.webp",
        );
        expect(mammotionPictures("Yuka-MNEXAMPLE1", "white")).toHaveLength(4);
    });

    it("takes the longest prefix that fits", () => {
        expect(mammotionPictures("Yuka-MVEXAMPLE1", "default")[0]).toContain("dc_bg_main_car_yuka_mn_231.");
        expect(mammotionPictures("Yuka-EXAMPLE1", "default")[0]).toContain("dc_bg_main_car_yuka.");
    });

    it("has nothing for a model without a picture, rather than another model's", () => {
        expect(mammotionPictures("Luba-VSEXAMPLE1", "default")).toEqual([]);
        expect(mammotionPictures("Spino-EXAMPLE1", "default")).toEqual([]);
        expect(mammotionPictures(undefined, "default")).toEqual([]);
    });
});
