import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EntityRegistryEntry, HassEntity, HomeAssistant } from "../src/hass";
import "../src/mower-status-card";
import type { MowerStatusCard } from "../src/mower-status-card";
import { PRESETS, activityOf, detectSlots } from "../src/slots";
import type { MowerStatusCardConfig } from "../src/types";
import { NOW } from "./fixtures";

// A made-up Sunseeker mower, "Ville", with the states and translation keys the integration gives an older model.
const ENTITIES: Record<string, { state: string; attributes?: Record<string, unknown>; translation_key?: string }> = {
    "lawn_mower.ville": { state: "standby", attributes: { friendly_name: "Ville", supported_features: 7 } },
    "sensor.ville_akku": {
        state: "64",
        attributes: { device_class: "battery", unit_of_measurement: "%" },
        translation_key: "sunseeker_battery",
    },
    "sensor.ville_virhe": { state: "normal", translation_key: "sunseeker_error_text" },
    "sensor.ville_sadetunnistin": { state: "dry", translation_key: "sunseeker_rain_status" },
    "image.ville_leikkurikuva": {
        // The integration never sets the time its state is read from, so it stays unknown with a picture too.
        state: "unknown",
        attributes: { entity_picture: "/api/image_proxy/image.ville_leikkurikuva?token=x" },
        translation_key: "mower_robot_image",
    },
};

function sunseeker(changes: Record<string, Partial<{ state: string; attributes: Record<string, unknown> }>> = {}): HomeAssistant {
    const states: Record<string, HassEntity> = {};
    const entities: Record<string, EntityRegistryEntry> = {};
    for (const [id, base] of Object.entries(ENTITIES)) {
        const made = { ...base, ...changes[id] };
        states[id] = {
            entity_id: id,
            state: made.state,
            last_changed: new Date(NOW - 3_600_000).toISOString(),
            attributes: { ...made.attributes },
        };
        entities[id] = { entity_id: id, device_id: "device-2", platform: "sunseeker", translation_key: made.translation_key };
    }
    return {
        formatEntityState: (entity) => entity.state,
        callWS: async <T>() => ({}) as T,
        localize: () => "",
        language: "fi",
        locale: { language: "fi", time_zone: "server" },
        config: { time_zone: "Europe/Helsinki" },
        states,
        entities,
        devices: { "device-2": { id: "device-2", name: "Ville" } },
    };
}

async function card(state: HomeAssistant, config: Partial<MowerStatusCardConfig> = {}): Promise<MowerStatusCard> {
    const element = document.createElement("mower-status-card");
    element.setConfig({ type: "custom:mower-status-card", entity: "lawn_mower.ville", ...config } as MowerStatusCardConfig);
    element.hass = state;
    document.body.append(element);
    await element.updateComplete;
    return element;
}

function text(element: Element | null | undefined): string {
    return (element?.textContent ?? "").replace(/\s+/g, " ").trim();
}

describe("the Sunseeker preset", () => {
    beforeEach(() => {
        vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
        document.body.innerHTML = "";
    });

    it("reads Sunseeker's own states as Home Assistant's", () => {
        const preset = PRESETS.sunseeker;
        expect(activityOf(preset, "working")).toBe("mowing");
        expect(activityOf(preset, "on_the_way_home")).toBe("returning");
        expect(activityOf(preset, "charging_full")).toBe("docked");
        expect(activityOf(preset, "standby")).toBe("idle");
        expect(activityOf(preset, "offline")).toBe("unavailable");
        // An older Sunseeker puts its error's text in place of its state.
        expect(activityOf(preset, "Leikkuri on jumissa")).toBe("error");
        expect(activityOf(preset, "unavailable")).toBe("unavailable");
    });

    it("leaves another integration's states as they are", () => {
        expect(activityOf(PRESETS.mammotion, "idle")).toBe("idle");
        expect(activityOf(undefined, "working")).toBe("working");
    });

    it("finds the error, the rain sensor and the picture by Sunseeker's keys", () => {
        expect(detectSlots(sunseeker(), "lawn_mower.ville")).toMatchObject({
            battery: "sensor.ville_akku",
            error: "sensor.ville_virhe",
            rain: "sensor.ville_sadetunnistin",
            picture: "image.ville_leikkurikuva",
        });
    });

    it("pauses a working mower, and takes its normal error and dry rain sensor for nothing wrong", async () => {
        const element = await card(sunseeker({ "lawn_mower.ville": { state: "working" } }), { show_image: false });
        expect(text(element.shadowRoot!.querySelector(".buttons button"))).toBe("Tauko");
        expect(element.shadowRoot!.querySelector(".chips")).toBeNull();
    });

    it("shows a charging mower as charging once, though it has no charging sensor", async () => {
        const state = sunseeker({ "lawn_mower.ville": { state: "charging" } });
        // The integration's own word for its charging state, as Home Assistant formats it.
        state.formatEntityState = (entity) => (entity.state === "charging" ? "Lataa" : entity.state);
        const element = await card(state, { show_image: false });
        expect(text(element.shadowRoot!.querySelector(".state"))).toBe("Lataa");
        expect(element.shadowRoot!.querySelectorAll(".buttons button")[1].hasAttribute("disabled")).toBe(true);
    });

    it("says standby and idle in the card's own word, as a Mammotion mower does, and a more telling state in its own", async () => {
        const words: Record<string, string> = { standby: "Valmiustila", idle: "Valmiustila", stop: "Pysäytetty" };
        for (const [mowerState, expected] of [
            ["standby", "Valmiustilassa"],
            ["idle", "Valmiustilassa"],
            ["stop", "Pysäytetty"],
        ]) {
            const state = sunseeker({ "lawn_mower.ville": { state: mowerState } });
            // The integration's own words for its states, as Home Assistant formats them.
            state.formatEntityState = (entity) => words[entity.state] ?? entity.state;
            const element = await card(state, { show_image: false });
            expect(text(element.shadowRoot!.querySelector(".state"))).toBe(expected);
            element.remove();
        }
    });

    it("says standby in Home Assistant's word for idle in a language the card has no file for", async () => {
        const state = sunseeker({ "lawn_mower.ville": { state: "standby" } });
        state.language = "de";
        state.locale = { ...state.locale, language: "de" };
        state.formatEntityState = (entity) => (entity.state === "standby" ? "Bereitschaft" : entity.state);
        state.localize = (key) => (key === "component.lawn_mower.entity_component._.state.idle" ? "Untätig" : "");
        const element = await card(state, { show_image: false });
        expect(text(element.shadowRoot!.querySelector(".state"))).toBe("Untätig");
    });

    it("shows an older Sunseeker's error text, put in place of its state, as its error", async () => {
        const element = await card(sunseeker({ "lawn_mower.ville": { state: "Leikkuri on jumissa" } }), { show_image: false });
        expect(text(element.shadowRoot!.querySelector(".state"))).toBe("Virhe");
        expect(text(element.shadowRoot!.querySelector(".detail"))).toBe("Leikkuri on jumissa");
    });

    it("takes the rain sensor's wet for rain", async () => {
        const element = await card(sunseeker({ "sensor.ville_sadetunnistin": { state: "wet" } }), { show_image: false });
        expect(text(element.shadowRoot!.querySelector(".chip"))).toBe("Sataa");
    });

    it("tells when it last mowed, from a history in Sunseeker's words", async () => {
        const state = sunseeker();
        state.callWS = vi.fn().mockResolvedValue({
            "lawn_mower.ville": [
                { s: "working", lu: (NOW - 27 * 3_600_000) / 1000 },
                { s: "return", lu: (NOW - 26 * 3_600_000) / 1000 },
                { s: "standby", lu: (NOW - 25 * 3_600_000) / 1000 },
            ],
        }) as HomeAssistant["callWS"];
        const element = await card(state, { show_image: false });
        await Promise.resolve();
        await element.updateComplete;
        expect(text(element.shadowRoot!.querySelector(".lines"))).toContain("Leikkasi viimeksi eilen klo 13.00");
    });

    it("gives the gauge back when the picture doesn't load", async () => {
        const element = await card(sunseeker());
        element.shadowRoot!.querySelector(".picture img")!.dispatchEvent(new Event("error"));
        await element.updateComplete;
        expect(element.shadowRoot!.querySelector(".picture img")).toBeNull();
        expect(element.shadowRoot!.querySelector(".ring")).not.toBeNull();
    });

    it("keeps a failed picture failed when only its token changes", async () => {
        const element = await card(sunseeker());
        element.shadowRoot!.querySelector(".picture img")!.dispatchEvent(new Event("error"));
        await element.updateComplete;
        element.hass = sunseeker({
            "image.ville_leikkurikuva": {
                state: "unknown",
                attributes: { entity_picture: "/api/image_proxy/image.ville_leikkurikuva?token=y" },
            },
        });
        await element.updateComplete;
        expect(element.shadowRoot!.querySelector(".picture img")).toBeNull();
    });

    it("reads the history again once the registry, and with it the preset, has arrived", async () => {
        const state = sunseeker();
        const entities = state.entities;
        state.entities = undefined;
        state.callWS = vi.fn().mockResolvedValue({
            "lawn_mower.ville": [
                { s: "working", lu: (NOW - 27 * 3_600_000) / 1000 },
                { s: "standby", lu: (NOW - 26 * 3_600_000) / 1000 },
            ],
        }) as HomeAssistant["callWS"];
        const element = await card(state, { show_image: false });
        await Promise.resolve();
        element.hass = { ...state, entities };
        await element.updateComplete;
        await Promise.resolve();
        await element.updateComplete;
        expect(state.callWS).toHaveBeenCalledTimes(2);
        expect(text(element.shadowRoot!.querySelector(".lines"))).toContain("Leikkasi viimeksi eilen klo 13.00");
    });

    it("brings a failed picture back once its next token loads, and not before", async () => {
        const probes: Array<{ src: string; onload: (() => void) | null }> = [];
        vi.stubGlobal(
            "Image",
            class {
                src = "";
                onload: (() => void) | null = null;
                constructor() {
                    probes.push(this);
                }
            },
        );
        const element = await card(sunseeker());
        element.shadowRoot!.querySelector(".picture img")!.dispatchEvent(new Event("error"));
        await element.updateComplete;
        const rotated = "/api/image_proxy/image.ville_leikkurikuva?token=y";
        element.hass = sunseeker({ "image.ville_leikkurikuva": { state: "unknown", attributes: { entity_picture: rotated } } });
        await element.updateComplete;
        expect(element.shadowRoot!.querySelector(".picture img")).toBeNull();

        probes.find((probe) => probe.src === rotated)!.onload!();
        await element.updateComplete;
        expect(element.shadowRoot!.querySelector(".picture img")?.getAttribute("src")).toBe(rotated);
    });

    it("goes on to the integration's picture when the card's own doesn't load", async () => {
        const element = await card(sunseeker(), { image: "/local/typo.png" });
        element.shadowRoot!.querySelector(".picture img")!.dispatchEvent(new Event("error"));
        await element.updateComplete;
        expect(element.shadowRoot!.querySelector(".picture img")?.getAttribute("src")).toBe(
            "/api/image_proxy/image.ville_leikkurikuva?token=x",
        );
    });

    it("shows the integration's picture of the mower", async () => {
        const element = await card(sunseeker());
        expect(element.shadowRoot!.querySelector(".picture img")?.getAttribute("src")).toBe(
            "/api/image_proxy/image.ville_leikkurikuva?token=x",
        );
    });
});
