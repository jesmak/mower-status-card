import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "../src/mower-status-card";
import type { MowerStatusCard } from "../src/mower-status-card";
import type { MowerStatusCardConfig } from "../src/types";
import { NOW, mockHass } from "./fixtures";

// In a file of its own: the card remembers per page whether a model picture exists, and the tests here need it to ask.
// Each test has a model of its own, so none of them gets an answer cached by another.

const ASSETS = "/hacsfiles/ha-mammotion-assets/dist/assets";

async function card(deviceName: string, config: Partial<MowerStatusCardConfig> = {}): Promise<MowerStatusCard> {
    const element = document.createElement("mower-status-card");
    element.setConfig({
        type: "custom:mower-status-card",
        entity: "lawn_mower.matti",
        show_image: true,
        ...config,
    } as MowerStatusCardConfig);
    element.hass = mockHass({}, { deviceName });
    document.body.append(element);
    await settle(element);
    return element;
}

/** Lets the picture checks answer and the card draw what they found. */
async function settle(element: MowerStatusCard): Promise<void> {
    await element.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await element.updateComplete;
}

function shown(element: MowerStatusCard): string | null | undefined {
    return element.shadowRoot!.querySelector(".picture img")?.getAttribute("src");
}

function variant(element: MowerStatusCard, imageVariant?: MowerStatusCardConfig["image_variant"]): void {
    // Home Assistant hands an existing card its new configuration rather than building a new one.
    element.setConfig({ type: "custom:mower-status-card", entity: "lawn_mower.matti", show_image: true, image_variant: imageVariant });
}

describe("Mammotion's model pictures", () => {
    beforeEach(() => {
        vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
        document.body.innerHTML = "";
    });

    it("changes to the white model's picture on the same card when the variant changes", async () => {
        const standard = `${ASSETS}/dc_bg_main_car_luba_mn.webp`;
        const white = `${ASSETS}/dc_bg_main_car_luba_mn_white.png`;
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string) => ({ ok: url === standard || url === white })),
        );
        const element = await card("Luba-MNEXAMPLE1");
        expect(shown(element)).toBe(standard);

        variant(element, "white");
        await settle(element);
        expect(shown(element)).toBe(white);
    });

    it("keeps the white model's picture on screen while it looks for the standard one", async () => {
        const standard = `${ASSETS}/dc_bg_main_car_yuka_mn.webp`;
        const white = `${ASSETS}/dc_bg_main_car_yuka_mn_white.png`;
        let answer: ((ok: boolean) => void) | undefined;
        vi.stubGlobal(
            "fetch",
            vi.fn((url: string) =>
                url === standard ? new Promise((resolve) => (answer = (ok) => resolve({ ok }))) : Promise.resolve({ ok: url === white }),
            ),
        );
        const element = await card("Yuka-MNEXAMPLE1", { image_variant: "white" });
        expect(shown(element)).toBe(white);

        variant(element);
        await element.updateComplete;
        // The standard picture's check is still under way, and the white one stays rather than the gauge.
        expect(shown(element)).toBe(white);
        expect(answer).not.toBeUndefined();
        answer!(true);
        await settle(element);
        expect(shown(element)).toBe(standard);
    });

    it("asks again at the next search for a model picture that didn't answer", async () => {
        const standard = `${ASSETS}/dc_bg_main_car_luba_ld.webp`;
        let up = false;
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string) => ({ ok: up && url === standard })),
        );
        const element = await card("Luba-LDEXAMPLE1");
        expect(shown(element)).toBeUndefined();

        // Home Assistant is back, and the card looks for its picture again when its configuration changes.
        up = true;
        variant(element, "default");
        await settle(element);
        expect(shown(element)).toBe(standard);
    });

    it("gives way to the gauge when the model has no picture of the chosen variant", async () => {
        const white = `${ASSETS}/dc_bg_main_car_yuka_ml_white.png`;
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string) => ({ ok: url === white })),
        );
        const element = await card("Yuka-MLEXAMPLE1", { image_variant: "white" });
        expect(shown(element)).toBe(white);

        variant(element);
        await settle(element);
        expect(shown(element)).toBeUndefined();
        expect(element.shadowRoot!.querySelector(".ring")).not.toBeNull();
    });
});

describe("A picture of the mower's own", () => {
    let corners = 0;

    beforeEach(() => {
        // An 8 by 8 copy of the picture, opaque but for its four corners, whose alpha each test sets.
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
            drawImage: () => undefined,
            getImageData: () => {
                const data = new Uint8ClampedArray(8 * 8 * 4).fill(255);
                [0, 7, 56, 63].forEach((pixel) => (data[pixel * 4 + 3] = corners));
                return { data };
            },
        } as unknown as CanvasRenderingContext2D);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = "";
    });

    function picture(element: MowerStatusCard): HTMLElement {
        return element.shadowRoot!.querySelector(".picture")!;
    }

    async function load(element: MowerStatusCard): Promise<void> {
        element.shadowRoot!.querySelector(".picture img")!.dispatchEvent(new Event("load"));
        await element.updateComplete;
    }

    function image(element: MowerStatusCard, url: string): void {
        element.setConfig({ type: "custom:mower-status-card", entity: "lawn_mower.matti", show_image: true, image: url });
    }

    it("gets the model pictures' frame when it is a cut-out, transparent at its corners", async () => {
        corners = 0;
        const element = await card("Other-EXAMPLE1", { image: "/local/mower.png" });
        await load(element);
        expect(picture(element).classList.contains("framed")).toBe(true);
    });

    it("is shown without a frame when it has a background of its own", async () => {
        corners = 255;
        const element = await card("Other-EXAMPLE1", { image: "/local/mower.png" });
        await load(element);
        expect(picture(element).className).toBe("picture own");
    });

    it("is shown without a frame when it is a photo with rounded corners, only partly see-through there", async () => {
        corners = 200;
        const element = await card("Other-EXAMPLE1", { image: "/local/mower.png" });
        await load(element);
        expect(picture(element).className).toBe("picture own");
    });

    it("is framed though its file name has a space and a letter the browser encodes", async () => {
        corners = 0;
        const element = await card("Other-EXAMPLE1", { image: "/local/leikkuri pöytä.png" });
        await load(element);
        expect(picture(element).classList.contains("framed")).toBe(true);
    });

    it("keeps its frame when only its token changes, before the new address has loaded", async () => {
        corners = 0;
        const element = await card("Other-EXAMPLE1", { image: "/local/mower.png?token=1" });
        await load(element);
        image(element, "/local/mower.png?token=2");
        await element.updateComplete;
        expect(picture(element).classList.contains("framed")).toBe(true);
    });

    it("loses its frame when the picture at the same address turns out to have a background", async () => {
        corners = 0;
        const element = await card("Other-EXAMPLE1", { image: "/local/mower.png?token=1" });
        await load(element);
        corners = 255;
        image(element, "/local/mower.png?token=2");
        await element.updateComplete;
        await load(element);
        expect(picture(element).classList.contains("framed")).toBe(false);
    });
});
