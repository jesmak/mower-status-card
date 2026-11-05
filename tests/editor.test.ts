import { afterEach, describe, expect, it } from "vitest";

import "../src/editor";
import type { MowerStatusCardEditor } from "../src/editor";
import type { MowerStatusCardConfig } from "../src/types";
import { mockHass } from "./fixtures";

const SET = {
    type: "custom:mower-status-card",
    entity: "lawn_mower.matti",
    name: "Matti",
    image: "/local/mower.png",
    image_variant: "white",
    blade_warning_hours: 120,
    entities: { rain: "binary_sensor.weather_station_rain" },
    max_height: 400,
} as MowerStatusCardConfig;

let editor: MowerStatusCardEditor;

/** What the editor saves when Home Assistant's main form hands it `value`, which holds all of the form's data. */
async function save(config: MowerStatusCardConfig, value: Record<string, unknown>): Promise<unknown> {
    editor = document.createElement("mower-status-card-editor") as MowerStatusCardEditor;
    editor.setConfig(config);
    editor.hass = mockHass();
    document.body.append(editor);
    await editor.updateComplete;
    let saved: unknown;
    editor.addEventListener("config-changed", (event) => (saved = (event as CustomEvent).detail.config));
    editor.shadowRoot!.querySelector("ha-form")!.dispatchEvent(new CustomEvent("value-changed", { detail: { value } }));
    return saved;
}

afterEach(() => editor?.remove());

describe("the card's editor", () => {
    it("keeps only what differs from the defaults, and what the form doesn't show", async () => {
        const value = { ...SET, name: "", show_image: true, show_cancel: false, image_variant: "default", row_step: "full" };
        expect(await save(SET, value)).toEqual({
            type: "custom:mower-status-card",
            entity: "lawn_mower.matti",
            image: "/local/mower.png",
            blade_warning_hours: 120,
            entities: { rain: "binary_sensor.weather_station_rain" },
            max_height: 400,
            show_cancel: false,
        });
    });

    it("drops what was set for one mower when another is chosen", async () => {
        expect(await save(SET, { ...SET, entity: "lawn_mower.rosie", show_image: false, row_step: "half" })).toEqual({
            type: "custom:mower-status-card",
            entity: "lawn_mower.rosie",
            max_height: 400,
            show_image: false,
            row_step: "half",
        });
    });

    it("leaves the half-row step out of a card held to a fixed height", async () => {
        const fixed = { ...SET, height: 300 } as MowerStatusCardConfig;
        expect(await save(fixed, { ...fixed, row_step: "half" })).not.toHaveProperty("row_step");
    });
});
