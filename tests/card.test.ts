import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HomeAssistant } from "../src/hass";
import "../src/mower-status-card";
import type { MowerStatusCard } from "../src/mower-status-card";
import type { MowerStatusCardConfig } from "../src/types";
import { NOW, mockHass } from "./fixtures";

async function card(state: HomeAssistant, config: Partial<MowerStatusCardConfig> = {}): Promise<MowerStatusCard> {
    const element = document.createElement("mower-status-card");
    element.setConfig({
        type: "custom:mower-status-card",
        entity: "lawn_mower.matti",
        show_image: false,
        ...config,
    } as MowerStatusCardConfig);
    element.hass = state;
    document.body.append(element);
    await element.updateComplete;
    return element;
}

function root(element: MowerStatusCard): ShadowRoot {
    return element.shadowRoot!;
}

function text(element: Element | null | undefined): string {
    return (element?.textContent ?? "").replace(/\s+/g, " ").trim();
}

function buttons(element: MowerStatusCard): HTMLButtonElement[] {
    return [...root(element).querySelectorAll<HTMLButtonElement>(".buttons button")];
}

describe("mower-status-card", () => {
    beforeEach(() => {
        vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        vi.unstubAllGlobals();
        vi.useRealTimers();
        document.body.innerHTML = "";
    });

    it("refuses a configuration without a lawn mower", () => {
        const element = document.createElement("mower-status-card");
        expect(() => element.setConfig({ type: "custom:mower-status-card", entity: "sensor.matti_battery" })).toThrow();
    });

    it("offers a new task at the dock, with cancel and dock greyed", async () => {
        const element = await card(mockHass());
        const [main, cancel, dock] = buttons(element);
        expect(text(main)).toBe("Aloita uusi tehtävä");
        expect(cancel.disabled).toBe(true);
        expect(dock.disabled).toBe(true);
        expect([text(root(element).querySelector(".ring b")), text(root(element).querySelector(".ring span"))]).toEqual(["94 %", "akku"]);
        expect(text(root(element).querySelector(".name"))).toBe("Matti");
        expect(text(root(element).querySelector(".state"))).toBe("docked, lataa");
    });

    it("shows the task's progress and time left while mowing, with pause leading", async () => {
        const element = await card(
            mockHass({
                "lawn_mower.matti": { state: "mowing" },
                "sensor.matti_progress": { state: "46" },
                "sensor.matti_time_left": { state: "38" },
                "sensor.matti_elapsed": { state: "32" },
                "binary_sensor.matti_charging": { state: "off" },
            }),
        );
        expect(text(buttons(element)[0])).toBe("Tauko");
        expect(buttons(element)[1].disabled).toBe(false);
        expect([text(root(element).querySelector(".ring b")), text(root(element).querySelector(".ring span"))]).toEqual(["46 %", "tehty"]);
        expect(text(root(element).querySelector(".lines"))).toContain("Noin 38 min jäljellä");
        expect(text(root(element).querySelector(".lines"))).toContain("Akku 94 %, 32 min kulunut");
    });

    it("continues an unfinished task with the integration's own button", async () => {
        const element = await card(mockHass({ "lawn_mower.matti": { state: "paused" } }));
        const fired = vi.fn();
        element.addEventListener("hass-action", (event) => fired((event as CustomEvent).detail));
        expect(text(buttons(element)[0])).toBe("Jatka tehtävää");
        buttons(element)[0].click();
        expect(fired).toHaveBeenCalledWith({
            config: {
                entity: "button.matti_continue",
                tap_action: { action: "perform-action", perform_action: "button.press", target: { entity_id: "button.matti_continue" } },
            },
            action: "tap",
        });
    });

    it("asks before cancelling a task", async () => {
        const element = await card(mockHass({ "lawn_mower.matti": { state: "paused" } }));
        const fired = vi.fn();
        element.addEventListener("hass-action", (event) => fired((event as CustomEvent).detail));
        buttons(element)[1].click();
        expect(fired.mock.calls[0][0].config.tap_action.confirmation).toEqual({ text: "Perutaanko keskeneräinen tehtävä?" });
    });

    it("opens the most severe notice's text, and closes it when its chip is chosen again", async () => {
        const element = await card(
            mockHass({
                "lawn_mower.matti": { state: "paused" },
                "sensor.matti_last_error": { state: "mcu: robotti on jumissa" },
                "sensor.matti_last_error_time": { state: new Date(NOW - 3_600_000).toISOString() },
                "binary_sensor.matti_rain": { state: "on" },
            }),
        );
        const chips = [...root(element).querySelectorAll<HTMLButtonElement>(".chip")];
        expect(chips.map(text)).toEqual(["Virhe", "Sataa"]);
        expect(text(root(element).querySelector(".detail span"))).toBe("Tänään klo 14.00. Robotti on jumissa");

        chips[1].click();
        await element.updateComplete;
        expect(text(root(element).querySelector(".detail"))).toBe("Sadeanturi havaitsee sadetta.");

        chips[1].click();
        await element.updateComplete;
        expect(root(element).querySelector(".detail")).toBeNull();
    });

    it("tells when the mower last mowed, from its history", async () => {
        const state = mockHass();
        const end = (NOW - 26 * 3_600_000) / 1000;
        state.callWS = vi.fn().mockResolvedValue({
            "lawn_mower.matti": [
                { s: "mowing", lu: end - 3600 },
                { s: "returning", lu: end },
                { s: "docked", lu: end + 300 },
            ],
        }) as HomeAssistant["callWS"];
        const element = await card(state);
        await Promise.resolve();
        await element.updateComplete;
        expect(text(root(element).querySelector(".lines"))).toContain("Leikkasi viimeksi eilen klo 13.00");
        // The day and the time each stay whole, in a box of their own that moves to the next line before they part.
        expect([...root(element).querySelectorAll(".when .whole")].map(text)).toEqual(["eilen", "klo 13.00"]);
    });

    function history(state: HomeAssistant, rows: Array<{ s: string; lu: number }>): void {
        state.callWS = vi.fn().mockResolvedValue({ "lawn_mower.matti": rows }) as HomeAssistant["callWS"];
    }

    async function settled(element: MowerStatusCard): Promise<void> {
        await Promise.resolve();
        await element.updateComplete;
    }

    it("counts the mowing that just ended though the history doesn't have it yet", async () => {
        const state = mockHass({ "lawn_mower.matti": { state: "docked", last_changed: new Date(NOW - 2 * 3_600_000).toISOString() } });
        history(state, [{ s: "mowing", lu: (NOW - 3 * 3_600_000) / 1000 }]);
        const element = await card(state);
        await settled(element);
        expect(text(root(element).querySelector(".lines"))).toContain("Leikkasi viimeksi tänään klo 13.00");
    });

    it("says nothing of the last mowing when the mower has no history at all", async () => {
        const state = mockHass();
        state.callWS = vi.fn().mockResolvedValue({}) as HomeAssistant["callWS"];
        const element = await card(state);
        await settled(element);
        expect(text(root(element).querySelector(".lines"))).not.toContain("Leikkasi");
    });

    it("says nothing of a history without mowing that is too short to tell anything", async () => {
        const state = mockHass();
        history(state, [{ s: "docked", lu: (NOW - 1.5 * 86_400_000) / 1000 }]);
        const element = await card(state);
        await settled(element);
        expect(text(root(element).querySelector(".lines"))).not.toContain("Leikkasi");
    });

    it("tells how far back a history without mowing goes, not more", async () => {
        const state = mockHass();
        history(state, [{ s: "docked", lu: (NOW - 5.5 * 86_400_000) / 1000 }]);
        const element = await card(state);
        await settled(element);
        expect(text(root(element).querySelector(".lines"))).toContain("Leikkasi viimeksi yli 5 päivää sitten");
    });

    it("writes the time as the user's profile asks", async () => {
        const state = mockHass();
        state.locale = { language: "en", time_zone: "server", time_format: "24" };
        state.language = "en";
        history(state, [
            { s: "mowing", lu: (NOW - 27 * 3_600_000) / 1000 },
            { s: "docked", lu: (NOW - 26 * 3_600_000) / 1000 },
        ]);
        const element = await card(state);
        await settled(element);
        expect(text(root(element).querySelector(".lines"))).toContain("Last mowed yesterday at 13:00");
    });

    it("knows yesterday on the night the clocks go back", async () => {
        vi.setSystemTime(Date.parse("2026-10-25T21:30:00Z"));
        const state = mockHass({ "lawn_mower.matti": { last_changed: "2026-10-24T21:00:00Z" } });
        history(state, [
            { s: "mowing", lu: Date.parse("2026-10-24T19:00:00Z") / 1000 },
            { s: "docked", lu: Date.parse("2026-10-24T20:00:00Z") / 1000 },
        ]);
        const element = await card(state);
        await settled(element);
        expect(text(root(element).querySelector(".lines"))).toContain("Leikkasi viimeksi eilen klo 23.00");
    });

    it("keeps a closed box closed when a notice it has seen comes back", async () => {
        const errorAt = new Date(NOW - 3_600_000).toISOString();
        const changes = (rain: string) => ({
            "lawn_mower.matti": { state: "paused" },
            "sensor.matti_last_error": { state: "robotti on jumissa" },
            "sensor.matti_last_error_time": { state: errorAt },
            "binary_sensor.matti_rain": { state: rain },
        });
        const element = await card(mockHass(changes("on")));
        root(element).querySelector<HTMLButtonElement>(".chip.selected")!.click();
        await element.updateComplete;
        expect(root(element).querySelector(".detail")).toBeNull();

        element.hass = mockHass(changes("off"));
        await element.updateComplete;
        element.hass = mockHass(changes("on"));
        await element.updateComplete;
        expect(root(element).querySelector(".detail")).toBeNull();

        element.hass = mockHass({ ...changes("on"), "update.matti_firmware": { state: "on" } });
        await element.updateComplete;
        expect(text(root(element).querySelector(".detail"))).toContain("Robotti on jumissa");
    });

    it("opens the box for a new error though an earlier one was seen and closed", async () => {
        const error = (text: string, minutesAgo: number) =>
            mockHass({
                "lawn_mower.matti": { state: "paused" },
                "sensor.matti_last_error": { state: text },
                "sensor.matti_last_error_time": { state: new Date(NOW - minutesAgo * 60_000).toISOString() },
            });
        const element = await card(error("robotti on jumissa", 120));
        root(element).querySelector<HTMLButtonElement>(".chip.selected")!.click();
        await element.updateComplete;
        element.hass = error("terä on jumissa", 5);
        await element.updateComplete;
        expect(text(root(element).querySelector(".detail"))).toContain("Terä on jumissa");
    });

    function lowBattery(mowerState: string, minutesAgo = 60): HomeAssistant {
        return mockHass({
            "lawn_mower.matti": { state: mowerState },
            "sensor.matti_last_error": { state: "mcu: akku on vähissä" },
            "sensor.matti_last_error_time": { state: new Date(NOW - minutesAgo * 60_000).toISOString() },
        });
    }

    it("dismisses an error the mower is past, in this browser, until a newer one comes", async () => {
        const element = await card(lowBattery("docked"));
        root(element).querySelector<HTMLButtonElement>(".dismiss")!.click();
        await element.updateComplete;
        expect(root(element).querySelector(".chip")).toBeNull();
        expect(root(element).querySelector(".detail")).toBeNull();
        expect(localStorage.getItem("mower-status-card.dismissed.lawn_mower.matti")).toBe(String(NOW - 3_600_000));

        document.body.innerHTML = "";
        const again = await card(lowBattery("docked"));
        expect(root(again).querySelector(".chip")).toBeNull();

        again.hass = lowBattery("docked", 5);
        await again.updateComplete;
        expect(text(root(again).querySelector(".detail span"))).toBe("Tänään klo 14.55. Akku on vähissä");
    });

    it("keeps a dismissal for the page when the browser refuses its storage", async () => {
        for (const method of ["getItem", "setItem"] as const) {
            vi.spyOn(Storage.prototype, method).mockImplementation(() => {
                throw new Error("refused");
            });
        }
        const element = await card(lowBattery("docked"));
        expect(text(root(element).querySelector(".detail span"))).toBe("Tänään klo 14.00. Akku on vähissä");
        root(element).querySelector<HTMLButtonElement>(".dismiss")!.click();
        await element.updateComplete;
        expect(root(element).querySelector(".chip")).toBeNull();
    });

    it("keeps a dismissal to the mower it was made for", async () => {
        localStorage.setItem("mower-status-card.dismissed.lawn_mower.pentti", String(NOW));
        const element = await card(lowBattery("docked"));
        expect(text(root(element).querySelector(".detail span"))).toBe("Tänään klo 14.00. Akku on vähissä");
    });

    it("offers no dismissal while the mower is in its error state, as the error is still on", async () => {
        localStorage.setItem("mower-status-card.dismissed.lawn_mower.matti", String(NOW));
        const element = await card(lowBattery("error"));
        expect(text(root(element).querySelector(".chip"))).toBe("Virhe");
        expect(text(root(element).querySelector(".detail span"))).toBe("Tänään klo 14.00. Akku on vähissä");
        expect(root(element).querySelector(".dismiss")).toBeNull();
    });

    it.each([
        { case: "started after the error", startedMinutesAgo: 30, shown: false },
        { case: "started before the error", startedMinutesAgo: 90, shown: true },
    ])("ends an error by mowing started since, not before: $case", async ({ startedMinutesAgo, shown }) => {
        const state = lowBattery("mowing");
        history(state, [
            { s: "docked", lu: (NOW - 3 * 3_600_000) / 1000 },
            { s: "mowing", lu: (NOW - startedMinutesAgo * 60_000) / 1000 },
        ]);
        const element = await card(state);
        await settled(element);
        expect(text(root(element).querySelector(".chip"))).toBe(shown ? "Virhe" : "");
    });

    it("doesn't call a mowing mower charging, though its charging sensor hasn't caught up", async () => {
        const element = await card(mockHass({ "lawn_mower.matti": { state: "mowing" } }));
        expect(text(root(element).querySelector(".state"))).toBe("mowing");
        expect(buttons(element)[2].disabled).toBe(false);
    });

    it("follows the browser's clock when the profile asks for the system's", async () => {
        const state = mockHass();
        state.locale = { language: "fi", time_zone: "server", time_format: "system" };
        history(state, [
            { s: "mowing", lu: (NOW - 27 * 3_600_000) / 1000 },
            { s: "docked", lu: (NOW - 26 * 3_600_000) / 1000 },
        ]);
        const hour12 = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12;
        const element = await card(state);
        await settled(element);
        expect(text(root(element).querySelector(".lines"))).toContain(hour12 ? "1.00 ip." : "klo 13.00");
    });

    it("greys the dock button while the mower charges", async () => {
        const element = await card(mockHass({ "lawn_mower.matti": { state: "paused" } }));
        expect(buttons(element)[2].disabled).toBe(true);
    });

    it("shows the time elapsed on its own when there is no progress for the ring", async () => {
        const element = await card(
            mockHass({ "lawn_mower.matti": { state: "mowing" }, "sensor.matti_elapsed": { state: "32" }, "sensor.matti_progress": null }),
        );
        expect(text(root(element).querySelector(".lines"))).toContain("32 min kulunut");
    });

    it("falls back to Mammotion's model picture when its own picture doesn't load, and to the gauge after that", async () => {
        const model = "/hacsfiles/ha-mammotion-assets/dist/assets/dc_bg_main_car_yuka_mn.webp";
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string) => ({ ok: url === model })),
        );
        const element = await card(mockHass(), { show_image: true, image: "/local/typo.png" });
        root(element).querySelector(".picture img")!.dispatchEvent(new Event("error"));
        await element.updateComplete;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await element.updateComplete;
        expect(root(element).querySelector(".picture img")?.getAttribute("src")).toBe(model);

        // When the model picture fails too, the card keeps its gauge rather than trying the two in turn.
        root(element).querySelector(".picture img")!.dispatchEvent(new Event("error"));
        await element.updateComplete;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await element.updateComplete;
        expect(root(element).querySelector(".picture img")).toBeNull();
        expect(root(element).querySelector(".ring")).not.toBeNull();
    });

    it("opens the mower from its name under the picture, and leaves the distance out while mowing", async () => {
        const element = await card(mockHass({ "lawn_mower.matti": { state: "mowing" } }), { show_image: true, image: "/local/mower.png" });
        const opened = vi.fn();
        element.addEventListener("hass-more-info", (event) => opened((event as CustomEvent).detail));
        root(element).querySelector<HTMLButtonElement>(".footer-name")!.click();
        expect(opened).toHaveBeenCalledWith({ entityId: "lawn_mower.matti" });
        expect(text(root(element).querySelector(".footer"))).toBe("Matti");
    });

    it("uses the picture layout when given a picture of its own", async () => {
        const element = await card(mockHass(), { show_image: true, image: "/local/mower.png" });
        expect(root(element).querySelector(".picture img")?.getAttribute("src")).toBe("/local/mower.png");
        expect(root(element).querySelector(".ring")).toBeNull();
        expect(text(root(element).querySelector(".footer"))).toBe("Matti 123 km yhteensä");
    });

    it("names idle in the card's own word where Home Assistant has none", async () => {
        const state = mockHass({ "lawn_mower.matti": { state: "idle" }, "binary_sensor.matti_charging": { state: "off" } });
        state.formatEntityState = (entity) => (entity.state === "idle" ? "Idle" : entity.state);
        const element = await card(state);
        expect(text(root(element).querySelector(".state"))).toBe("Valmiustilassa");
    });

    it("names returning and error in the card's own words where Home Assistant has none", async () => {
        for (const [mowerState, expected] of [
            ["returning", "Palaa telakkaan"],
            ["error", "Virhe"],
        ]) {
            const state = mockHass({ "lawn_mower.matti": { state: mowerState }, "binary_sensor.matti_charging": { state: "off" } });
            // Home Assistant's Finnish falls back to English for these.
            state.localize = (key) =>
                key.endsWith(`.state.${mowerState}`) ? mowerState.charAt(0).toUpperCase() + mowerState.slice(1) : "";
            const element = await card(state);
            expect(text(root(element).querySelector(".state"))).toBe(expected);
            element.remove();
        }
    });

    it("names idle in Home Assistant's word in a language the card has no file for", async () => {
        const state = mockHass({ "lawn_mower.matti": { state: "idle" }, "binary_sensor.matti_charging": { state: "off" } });
        state.language = "de";
        state.locale = { ...state.locale!, language: "de" };
        state.localize = (key) => (key === "component.lawn_mower.entity_component._.state.idle" ? "Untätig" : "");
        const element = await card(state);
        expect(text(root(element).querySelector(".state"))).toBe("Untätig");
    });

    it("speaks of mowing, not of tasks, for a mower without a continue button", async () => {
        const docked = await card(mockHass({ "button.matti_continue": null }));
        expect(text(buttons(docked)[0])).toBe("Aloita leikkuu");
        const paused = await card(mockHass({ "button.matti_continue": null, "lawn_mower.matti": { state: "paused" } }));
        const fired = vi.fn();
        paused.addEventListener("hass-action", (event) => fired((event as CustomEvent).detail));
        expect(text(buttons(paused)[0])).toBe("Jatka leikkuuta");
        buttons(paused)[0].click();
        expect(fired.mock.calls[0][0].config.tap_action.perform_action).toBe("lawn_mower.start_mowing");
    });

    it("docks from the main button while mowing when the mower can't pause", async () => {
        const element = await card(mockHass({ "lawn_mower.matti": { state: "mowing", attributes: { supported_features: 1 + 4 } } }));
        expect(text(buttons(element)[0])).toBe("Telakkaan");
        // The dock icon would only repeat it.
        expect(buttons(element)).toHaveLength(2);
    });

    it("leaves out the cancel button when the mower has no such button and can't stop", async () => {
        const element = await card(
            mockHass({ "button.matti_cancel": null, "lawn_mower.matti": { attributes: { supported_features: 7 } } }),
        );
        expect(buttons(element)).toHaveLength(2);
    });

    it("leaves out the cancel button, and the stop in its place, when show_cancel is false", async () => {
        const paused = { "lawn_mower.matti": { state: "paused" } };
        const withCancel = await card(mockHass(paused), { show_cancel: false });
        expect(buttons(withCancel).map((button) => button.title || text(button))).toEqual(["Jatka tehtävää", "Telakkaan"]);
        const withStop = await card(mockHass({ ...paused, "button.matti_cancel": null }), { show_cancel: false });
        expect(buttons(withStop).map((button) => button.title || text(button))).toEqual(["Jatka tehtävää", "Telakkaan"]);
    });

    it("falls back to the formatted state where neither the card nor Home Assistant has a word for it", async () => {
        const state = mockHass({ "lawn_mower.matti": { state: "idle" }, "binary_sensor.matti_charging": { state: "off" } });
        state.locale = { language: "de", time_zone: "server" };
        state.language = "de";
        state.formatEntityState = (entity) => (entity.state === "idle" ? "Untätig" : entity.state);
        const element = await card(state);
        expect(text(root(element).querySelector(".state"))).toBe("Untätig");
    });

    it("names the state anew when Home Assistant's translations arrive after the card has drawn itself", async () => {
        const state = mockHass({ "lawn_mower.matti": { state: "idle" }, "binary_sensor.matti_charging": { state: "off" } });
        state.locale = { language: "de", time_zone: "server" };
        state.language = "de";
        state.formatEntityState = (entity) => entity.state;
        const element = await card(state);
        expect(text(root(element).querySelector(".state"))).toBe("idle");

        element.hass = { ...state, localize: (key) => (key === "component.lawn_mower.entity_component._.state.idle" ? "Untätig" : "") };
        await element.updateComplete;
        expect(text(root(element).querySelector(".state"))).toBe("Untätig");
    });

    it("formats a value anew when Home Assistant replaces its formatter, as it does when the entity registry changes", async () => {
        const state = mockHass({ "sensor.matti_mileage": { state: "168.3" } });
        state.formatEntityState = (entity) => `${entity.state} km`;
        const element = await card(state);
        expect(text(root(element).querySelector(".lines"))).toContain("168.3 km");

        element.hass = { ...state, formatEntityState: (entity) => `${Math.round(Number(entity.state))} km` };
        await element.updateComplete;
        expect(text(root(element).querySelector(".lines"))).toContain("168 km");
    });

    it("stops through Home Assistant, asking first, a mower that can stop but has no cancel button", async () => {
        const element = await card(mockHass({ "button.matti_cancel": null, "lawn_mower.matti": { state: "paused" } }));
        const fired = vi.fn();
        element.addEventListener("hass-action", (event) => fired((event as CustomEvent).detail));
        expect(buttons(element)[1].title).toBe("Pysäytä");
        buttons(element)[1].click();
        expect(fired.mock.calls[0][0].config.tap_action).toEqual({
            action: "perform-action",
            perform_action: "lawn_mower.stop",
            target: { entity_id: "lawn_mower.matti" },
            confirmation: { text: "Pysäytetäänkö ruohonleikkuri?" },
        });
    });
});
