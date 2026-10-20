import { describe, expect, it } from "vitest";

import { detectSlots, resolveSlots, slotChanges } from "../src/slots";
import { mockHass } from "./fixtures";

const CONFIG = { type: "custom:mower-status-card", entity: "lawn_mower.matti" };

describe("detectSlots", () => {
    it("finds every slot of a Mammotion mower by its translation keys", () => {
        expect(detectSlots(mockHass(), "lawn_mower.matti")).toEqual({
            battery: "sensor.matti_battery",
            charging: "binary_sensor.matti_charging",
            progress: "sensor.matti_progress",
            time_left: "sensor.matti_time_left",
            elapsed: "sensor.matti_elapsed",
            error: "sensor.matti_last_error",
            error_time: "sensor.matti_last_error_time",
            rain: "binary_sensor.matti_rain",
            positioning: "sensor.matti_rtk",
            vision: "sensor.matti_vision",
            satellites: "sensor.matti_satellites",
            blade_time: "sensor.matti_blade_time",
            blade_limit: "sensor.matti_blade_limit",
            update: "update.matti_firmware",
            mileage: "sensor.matti_mileage",
            continue: "button.matti_continue",
            cancel: "button.matti_cancel",
        });
    });

    it("finds only what Home Assistant's own device classes tell for another integration", () => {
        expect(detectSlots(mockHass({}, { platform: "other_mower" }), "lawn_mower.matti")).toEqual({
            battery: "sensor.matti_battery",
            charging: "binary_sensor.matti_charging",
            rain: "binary_sensor.matti_rain",
            update: "update.matti_firmware",
        });
    });

    it("finds nothing for a mower that has no device", () => {
        const hass = mockHass();
        hass.entities!["lawn_mower.matti"]!.device_id = null;
        expect(detectSlots(hass, "lawn_mower.matti")).toEqual({});
    });
});

describe("resolveSlots", () => {
    it("puts the configuration's entity in place of the found one and leaves out a slot turned off", () => {
        const slots = resolveSlots(mockHass(), { ...CONFIG, entities: { rain: "binary_sensor.weather_station_rain", cancel: "none" } });
        expect(slots.rain).toBe("binary_sensor.weather_station_rain");
        expect(slots.cancel).toBeUndefined();
        expect(slots.battery).toBe("sensor.matti_battery");
    });
});

describe("slotChanges", () => {
    const found = { battery: "sensor.a", rain: "binary_sensor.b" };

    it("writes nothing when what is chosen is what was found", () => {
        expect(slotChanges(found, { ...found })).toEqual({});
    });

    it("writes a swapped entity and an emptied field as none", () => {
        expect(slotChanges(found, { battery: "sensor.c", rain: "" })).toEqual({ battery: "sensor.c", rain: "none" });
    });

    it("keeps a none written earlier for a slot where nothing is found", () => {
        expect(slotChanges(found, { ...found, battery: "sensor.c" }, { cancel: "none" })).toEqual({ battery: "sensor.c", cancel: "none" });
    });

    it("writes an entity for a slot nothing was found for", () => {
        expect(slotChanges(found, { ...found, progress: "sensor.p" })).toEqual({ progress: "sensor.p" });
    });
});
