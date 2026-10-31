import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HomeAssistant } from "../src/hass";
import { browserLanguage, translate } from "../src/localize/localize";
import "../src/mower-status-card";
import type { MowerStatusCard } from "../src/mower-status-card";
import type { MowerStatusCardConfig } from "../src/types";
import { NOW, mockHass } from "./fixtures";

async function card(state: HomeAssistant, config: Partial<MowerStatusCardConfig> = {}, layout?: string): Promise<MowerStatusCard> {
    const element = document.createElement("mower-status-card");
    element.setConfig({
        type: "custom:mower-status-card",
        entity: "lawn_mower.matti",
        show_image: false,
        ...config,
    } as MowerStatusCardConfig);
    element.hass = state;
    element.layout = layout;
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

    it("refuses a height that isn't a positive number of pixels, and an unknown height mode, with an error about the height", () => {
        const element = document.createElement("mower-status-card");
        const config = (extra: Record<string, unknown>) =>
            ({ type: "custom:mower-status-card", entity: "lawn_mower.matti", ...extra }) as never;
        const error = translate(browserLanguage(), "common.invalid_height");
        expect(error).toMatch(/^Invalid height\./);
        for (const value of ["300px", 0, -10]) {
            expect(() => element.setConfig(config({ max_height: value }))).toThrow(error);
            expect(() => element.setConfig(config({ height: value }))).toThrow(error);
        }
        expect(() => element.setConfig(config({ height_mode: "tall" }))).toThrow(error);
        // Left empty in YAML, each is unset.
        expect(() => element.setConfig(config({ height_mode: null, height: null, max_height: null }))).not.toThrow();
    });

    it.each([
        ["its content", undefined, {}, ""],
        ["a fixed height", undefined, { height_mode: "fixed" as const, height: 300, max_height: 400 }, "height: 300px"],
        ["a maximum height", undefined, { max_height: 400 }, "max-height: 400px"],
        ["grid rows in a sections view", "grid", { height: 300, grid_options: { rows: 6 } }, "height: 100%"],
        ["the mode when the grid rows are automatic", "grid", { height: 300, grid_options: { rows: "auto" } }, "height: 300px"],
    ])("sizes itself by %s", async (_name, layout, extra, style) => {
        const element = await card(mockHass(), extra, layout);
        expect(root(element).querySelector("ha-card")!.getAttribute("style") ?? "").toBe(style);
    });

    // The least the card is held to, measured live at the narrowest its columns can be: a whole section in the narrow
    // layout, 11 columns or fewer in the very narrow one. Home Assistant holds rows set in the layout tab to the min_rows
    // given. The columns are Home Assistant's own part of the config, which the card's config type leaves out.
    const picture = { image: "/local/mower.png" };
    it.each<[string, Record<string, unknown>, number, number]>([
        // A picture of its own, so no search for a model picture is left running into the next test.
        ["with a picture, a whole section", { ...picture }, 275, 5],
        ["with a picture, 12 columns", { ...picture, grid_options: { columns: 12 } }, 275, 5],
        ["with a picture, full width", { ...picture, grid_options: { columns: "full" } }, 275, 5],
        ["with a picture, a section spanning two", { ...picture, grid_options: { columns: 24 } }, 275, 5],
        ["with a picture, 11 columns", { ...picture, grid_options: { columns: 11 } }, 351, 6],
        ["with a picture, 10 columns", { ...picture, grid_options: { columns: 10 } }, 351, 6],
        ["with a picture, half a section", { ...picture, grid_options: { columns: 6 } }, 351, 6],
        ["with a picture, fewer columns than the card allows", { ...picture, grid_options: { columns: 3 } }, 351, 6],
        ["with a picture, rows set but no columns", { ...picture, grid_options: { rows: 6 }, layout_options: { grid_columns: 2 } }, 275, 5],
        ["with a picture, a whole section in the older layout options", { ...picture, layout_options: { grid_columns: 4 } }, 275, 5],
        ["with a picture, 9 columns in the older layout options", { ...picture, layout_options: { grid_columns: 3 } }, 351, 6],
        ["with a picture, half a section in the older layout options", { ...picture, layout_options: { grid_columns: 2 } }, 351, 6],
        ["with the picture turned off, a whole section", { show_image: false }, 253, 5],
        ["with the picture turned off, 11 columns", { show_image: false, grid_options: { columns: 11 } }, 339, 6],
        ["with the picture turned off, 10 columns", { show_image: false, grid_options: { columns: 10 } }, 339, 6],
        ["with the picture turned off, half a section", { show_image: false, grid_options: { columns: 6 } }, 339, 6],
    ])("is never held lower than its status and buttons with a line of notices %s", async (_name, extra, minimum, rows) => {
        for (const [mode, style] of [
            [{ height_mode: "fixed", height: 100 }, `height: ${minimum}px`],
            [{ height_mode: "max", max_height: 100 }, `max-height: ${minimum}px`],
        ] as const) {
            const config = { show_image: undefined, ...extra, ...mode } as Partial<MowerStatusCardConfig>;
            const element = await card(mockHass(), config);
            expect(element.getGridOptions().min_rows).toBe(rows);
            expect(root(element).querySelector("ha-card")!.getAttribute("style")).toBe(style);
        }
    });

    it("counts on a picture it may find later from the data", async () => {
        // Not Mammotion's, so no search for a model picture is left running into the next test.
        const element = await card(mockHass({}, { platform: "demo" }), { show_image: undefined });
        expect(root(element).querySelector(".picture")).toBeNull();
        expect(element.getGridOptions().min_rows).toBe(5);
        element.setConfig({ ...element["config"]!, height_mode: "fixed", height: 100 } as MowerStatusCardConfig);
        await element.updateComplete;
        expect(root(element).querySelector("ha-card")!.getAttribute("style")).toBe("height: 275px");
    });

    it.each<[string, string | undefined, Partial<MowerStatusCardConfig>, boolean]>([
        ["on automatic rows", "grid", {}, false],
        ["held by rows", "grid", { grid_options: { rows: 6 } }, true],
        ["held to a height in a sections view", "grid", { height: 300 }, true],
        ["held up to a limit in a sections view", "grid", { max_height: 400 }, true],
        ["held by the older layout options' rows", "grid", { layout_options: { grid_rows: 6 } }, true],
        ["held to a height outside a sections view", undefined, { height: 300 }, true],
        ["held up to a limit outside a sections view", undefined, { max_height: 400 }, true],
        ["with rows but outside a sections view", undefined, { grid_options: { rows: 6 } }, false],
        ["in the auto mode outside a sections view", undefined, {}, false],
    ])("is marked held only while held %s", async (_name, layout, extra, held) => {
        const element = await card(mockHass(), extra, layout);
        expect(root(element).querySelector("ha-card")!.classList.contains("held")).toBe(held);
    });

    /**
     * Lays the card out as a browser would, as happy-dom lays nothing out: the card `height` tall, with 14 px of padding
     * and a 1 px border under its last part, which ends at `end` (by default where the card's height puts it), its
     * notices from 111 px down to `bottom` with 4 px of padding under them, and where their last element ends, or null
     * for no notices at all.
     */
    function laidOut(element: MowerStatusCard, height: number, bottom: number, last: number | null, end = height - 15): HTMLElement {
        const haCard = root(element).querySelector<HTMLElement>("ha-card")!;
        Object.defineProperty(haCard, "clientWidth", { value: 483, configurable: true });
        haCard.getBoundingClientRect = () => ({ top: 0, bottom: height, height }) as DOMRect;
        const parts = [...haCard.children].filter((part) => part.matches(".message, .buttons, .footer"));
        parts.at(-1)!.getBoundingClientRect = () => ({ bottom: end }) as DOMRect;
        // The message shown for a missing mower has no notices.
        const notices = root(element).querySelector<HTMLElement>(".notices");
        if (notices) {
            notices.getBoundingClientRect = () => ({ top: 111, bottom, height: bottom - 111 }) as DOMRect;
            const child = last === null ? null : document.createElement("div");
            if (child) child.getBoundingClientRect = () => ({ bottom: last }) as DOMRect;
            Object.defineProperty(notices, "lastElementChild", { value: child, configurable: true });
        }
        const cardStyle = { paddingLeft: "14px", paddingRight: "14px", paddingBottom: "14px", borderBottomWidth: "1px" };
        const noticesStyle = { paddingTop: "0px", paddingBottom: "4px", marginBottom: "0px" };
        vi.spyOn(window, "getComputedStyle").mockImplementation(
            (target) => (target === haCard ? cardStyle : noticesStyle) as unknown as CSSStyleDeclaration,
        );
        return haCard;
    }

    function fillRows(element: MowerStatusCard): void {
        (element as unknown as { fillRows(): void }).fillRows();
    }

    // A card is 64k − 8 px tall on k rows. The notices take what is added, which the measure leaves out.
    it.each<[string, string | undefined, Partial<MowerStatusCardConfig>, number, number, number | null, string]>([
        ["quiet, to the next row", "grid", {}, 208, 115, null, "min-height: 248px"],
        ["quiet, once filled, on the same row", "grid", {}, 248, 155, null, "min-height: 248px"],
        ["with notices, to the next row", "grid", {}, 360, 267, 263, "min-height: 376px"],
        ["with notices, once filled, on the same row", "grid", {}, 376, 283, 263, "min-height: 376px"],
        ["a notice shut, giving back a row", "grid", {}, 376, 283, 181, "min-height: 312px"],
        ["the notices gone, giving back two rows", "grid", {}, 376, 283, null, "min-height: 248px"],
        ["already on a row", "grid", {}, 248, 155, 151, "min-height: 248px"],
        // The name under a picture is the last part, so the measure ends at it.
        [
            "with a picture, to the next row",
            "grid",
            { show_image: undefined, image: "/local/mower.png" },
            236,
            115,
            null,
            "min-height: 248px",
        ],
        ["in the fixed mode with no height, which holds nothing", "grid", { height_mode: "fixed" }, 208, 115, null, "min-height: 248px"],
        ["not outside a sections view", undefined, {}, 208, 115, null, ""],
        ["not when held to a height", "grid", { height: 300 }, 300, 207, null, "height: 300px"],
        ["not when held up to a limit", "grid", { max_height: 400 }, 208, 115, null, "max-height: 400px"],
        ["not when held by rows", "grid", { grid_options: { rows: 6 } }, 376, 283, null, "height: 100%"],
        ["not when held by the older layout options' rows", "grid", { layout_options: { grid_rows: 6 } }, 376, 283, null, "height: 100%"],
    ])("ends on a whole row %s", async (_name, layout, extra, height, bottom, last, style) => {
        const element = await card(mockHass(), extra, layout);
        const haCard = laidOut(element, height, bottom, last);
        // With a picture the measure ends at the name under it, which must be there for the row to say so.
        const parts = [...haCard.children].filter((part) => part.matches(".message, .buttons, .footer"));
        expect(parts.at(-1)!.className).toBe("image" in extra ? "footer" : "buttons");
        fillRows(element);
        await element.updateComplete;
        expect(haCard.getAttribute("style") ?? "").toBe(style);
    });

    it("measures to its own last part, past anything else a theme puts after it", async () => {
        const element = await card(mockHass(), {}, "grid");
        const haCard = laidOut(element, 208, 115, null);
        // A theme's card-mod element, of no height, here at the end of the card.
        const added = document.createElement("card-mod");
        added.getBoundingClientRect = () => ({ bottom: 0 }) as DOMRect;
        haCard.append(added);
        fillRows(element);
        await element.updateComplete;
        expect(haCard.getAttribute("style")).toBe("min-height: 248px");
    });

    // The message has no notices to take what is added, so the card's own height says nothing of what the message needs.
    it.each<[string, string | undefined, Partial<MowerStatusCardConfig>, number, number, number, string]>([
        ["for a missing mower, to the next row", "grid", {}, 0, 48, 33, "min-height: 56px"],
        ["for a missing mower, once filled, on the same row", "grid", {}, 56, 56, 33, "min-height: 56px"],
        ["for a missing mower, giving back the rows the mower filled before it", "grid", {}, 376, 376, 105, "min-height: 120px"],
        ["for a missing mower, but not outside a sections view", undefined, {}, 0, 48, 33, ""],
        ["for a missing mower, but not when held to a height", "grid", { height: 300 }, 0, 300, 33, "height: 300px"],
        ["for a missing mower, but not when held up to a limit", "grid", { max_height: 400 }, 0, 48, 33, "max-height: 400px"],
        ["for a missing mower, but not when held by rows", "grid", { grid_options: { rows: 6 } }, 0, 376, 33, "height: 100%"],
        [
            "for a missing mower, but not when held by the older layout options' rows",
            "grid",
            { layout_options: { grid_rows: 6 } },
            0,
            376,
            33,
            "height: 100%",
        ],
        ["for a missing mower, in the fixed mode with no height", "grid", { height_mode: "fixed" }, 0, 48, 33, "min-height: 56px"],
    ])("ends on a whole row with only its message %s", async (_name, layout, extra, before, height, end, style) => {
        const element = await card(mockHass({ "lawn_mower.matti": null }), extra, layout);
        expect(root(element).querySelector(".message")).not.toBeNull();
        (element as unknown as { filled: number }).filled = before;
        await element.updateComplete;
        const haCard = laidOut(element, height, 0, null, end);
        fillRows(element);
        await element.updateComplete;
        expect(haCard.getAttribute("style") ?? "").toBe(style);
    });

    describe("measured when it may have changed", () => {
        let frames = new Map<number, FrameRequestCallback>();
        let nextFrame = 1;
        let observers: FakeObserver[] = [];

        class FakeObserver {
            public readonly observed = new Set<Element>();
            constructor(public readonly callback: () => void) {
                observers.push(this);
            }
            observe(target: Element) {
                this.observed.add(target);
            }
            unobserve(target: Element) {
                this.observed.delete(target);
            }
            disconnect() {
                this.observed.clear();
            }
        }

        beforeEach(() => {
            frames = new Map();
            observers = [];
            vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
                frames.set(nextFrame, callback);
                return nextFrame++;
            });
            vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
            vi.stubGlobal("ResizeObserver", FakeObserver);
        });

        /** Runs the frames due, and those their updates ask for, until the card asks for no more. */
        async function runFrames(element: MowerStatusCard): Promise<void> {
            while (frames.size) {
                const due = [...frames.values()];
                frames.clear();
                due.forEach((frame) => frame(0));
                await element.updateComplete;
            }
        }

        /** The observer of this card, which follows what is given to it. */
        function observerOf(haCard: Element): FakeObserver {
            return observers.find((observer) => observer.observed.has(haCard))!;
        }

        it("after it is drawn in a sections view", async () => {
            const element = await card(mockHass(), {}, "grid");
            const haCard = laidOut(element, 208, 115, null);
            await runFrames(element);
            expect(haCard.getAttribute("style")).toBe("min-height: 248px");
        });

        it("after the update that puts it in a sections view", async () => {
            const element = await card(mockHass(), {});
            await runFrames(element);
            const haCard = laidOut(element, 208, 115, null);
            expect(haCard.getAttribute("style") ?? "").toBe("");
            element.layout = "grid";
            await element.updateComplete;
            await runFrames(element);
            expect(haCard.getAttribute("style")).toBe("min-height: 248px");
        });

        it("after each update, such as a notice shut", async () => {
            const element = await card(mockHass(), {}, "grid");
            laidOut(element, 360, 267, 263);
            await runFrames(element);
            const haCard = laidOut(element, 376, 283, 181);
            element.requestUpdate();
            await element.updateComplete;
            await runFrames(element);
            expect(haCard.getAttribute("style")).toBe("min-height: 312px");
        });

        it("when its ha-card changes size with nothing else changed, such as a narrower card wrapping more", async () => {
            const element = await card(mockHass(), {}, "grid");
            laidOut(element, 208, 115, null);
            await runFrames(element);
            const haCard = laidOut(element, 301, 115, null);
            expect(frames.size).toBe(0);
            // The host is inline, so only the ha-card's box tells of a new size.
            const observer = observerOf(haCard);
            expect(observer).toBeDefined();
            expect(observer.observed.has(element)).toBe(false);
            observer.callback();
            await runFrames(element);
            expect(haCard.getAttribute("style")).toBe("min-height: 312px");
        });

        it("and lets go of its rows on the update that takes it out of a sections view", async () => {
            const element = await card(mockHass(), {}, "grid");
            const haCard = laidOut(element, 208, 115, null);
            await runFrames(element);
            expect(haCard.getAttribute("style")).toBe("min-height: 248px");
            element.layout = undefined;
            await element.updateComplete;
            await runFrames(element);
            expect(haCard.getAttribute("style") ?? "").toBe("");
        });

        it("following the ha-card of the mower once the message before it is gone", async () => {
            const element = await card(mockHass({ "lawn_mower.matti": null }), {}, "grid");
            const message = root(element).querySelector("ha-card")!;
            expect(observerOf(message)).toBeDefined();
            element.hass = mockHass();
            await element.updateComplete;
            const mower = root(element).querySelector("ha-card")!;
            expect(mower).not.toBe(message);
            expect(observerOf(mower)?.observed.has(message)).toBe(false);
        });

        /** The card laid out with `content` px of room for its content, inside its 14 px of padding on each side. */
        function measuredAt(element: MowerStatusCard, content: number): HTMLElement {
            const haCard = laidOut(element, 400, 115, null);
            Object.defineProperty(haCard, "clientWidth", { value: content ? content + 28 : 0, configurable: true });
            return haCard;
        }

        // A card inside another card has no columns in its config, so only the width it is measured to have tells how
        // little room it has. Its container queries switch at 300 and 220 px of content, and the width only ever raises
        // the minimum its columns give. The columns are Home Assistant's own part of the config.
        it.each<[string, Record<string, unknown>, string | undefined, number, string, number]>([
            ["in the very narrow layout", {}, undefined, 180, "height: 351px", 6],
            ["at the very narrow layout's edge", {}, undefined, 220, "height: 351px", 6],
            ["just past the very narrow layout", {}, undefined, 221, "height: 275px", 5],
            ["at the narrow layout's edge", {}, undefined, 300, "height: 275px", 5],
            ["wide, never lower than its columns promise", {}, undefined, 301, "height: 275px", 5],
            ["not measured yet", {}, undefined, 0, "height: 275px", 5],
            ["with the picture turned off, in the very narrow layout", { show_image: false }, undefined, 180, "height: 339px", 6],
            [
                "with the picture turned off, wide, never lower than its columns promise",
                { show_image: false },
                undefined,
                301,
                "height: 253px",
                5,
            ],
            ["up to a limit, in the very narrow layout", { height_mode: "max", max_height: 100 }, undefined, 180, "max-height: 351px", 6],
            ["of half a section, measured wide", { grid_options: { columns: 6 } }, undefined, 450, "height: 351px", 6],
            ["by rows in a sections view, in the very narrow layout", { grid_options: { rows: 5 } }, "grid", 180, "height: 100%", 6],
        ])("and held no lower than its measured width needs %s", async (_name, extra, layout, content, style, rows) => {
            const config = { image: "/local/mower.png", show_image: undefined, height_mode: "fixed", height: 100, ...extra };
            const element = await card(mockHass(), config as Partial<MowerStatusCardConfig>, layout);
            const haCard = measuredAt(element, content);
            await runFrames(element);
            expect(haCard.getAttribute("style")).toBe(style);
            expect(element.getGridOptions().min_rows).toBe(rows);
        });

        it("and keeps the minimum its width gave it while hidden", async () => {
            const element = await card(mockHass(), { image: "/local/mower.png", show_image: undefined, height: 100 });
            // Measured wide first, as a hidden card measured anyway would come out as the very narrow layout.
            const haCard = measuredAt(element, 400);
            await runFrames(element);
            expect(haCard.getAttribute("style")).toBe("height: 275px");
            measuredAt(element, 0);
            element.requestUpdate();
            await element.updateComplete;
            await runFrames(element);
            expect(haCard.getAttribute("style")).toBe("height: 275px");
        });

        it("measuring its width in the frame, never in the observer's callback", async () => {
            const element = await card(mockHass(), { image: "/local/mower.png", show_image: undefined, height: 100 });
            const haCard = measuredAt(element, 180);
            await runFrames(element);
            measuredAt(element, 400);
            observerOf(haCard).callback();
            await element.updateComplete;
            // Nothing has changed before the frame runs, so the card isn't resized while the observer is running.
            expect(haCard.getAttribute("style")).toBe("height: 351px");
            await runFrames(element);
            expect(haCard.getAttribute("style")).toBe("height: 275px");
        });

        it("following the ha-card of the message once the mower before it is gone", async () => {
            const element = await card(mockHass(), {}, "grid");
            const mower = root(element).querySelector("ha-card")!;
            expect(observerOf(mower)).toBeDefined();
            element.hass = mockHass({ "lawn_mower.matti": null });
            await element.updateComplete;
            const message = root(element).querySelector("ha-card")!;
            expect(message).not.toBe(mower);
            expect(observerOf(message)?.observed.has(mower)).toBe(false);
        });

        it("when its size changes after it has left the page and come back, as a dashboard changing views does", async () => {
            const element = await card(mockHass(), {}, "grid");
            laidOut(element, 208, 115, null);
            await runFrames(element);
            element.remove();
            document.body.append(element);
            await element.updateComplete;
            await runFrames(element);
            const haCard = laidOut(element, 301, 115, null);
            const observer = observerOf(haCard);
            expect(observer).toBeDefined();
            observer.callback();
            await runFrames(element);
            expect(haCard.getAttribute("style")).toBe("min-height: 312px");
        });
    });

    it.each<[string, (element: MowerStatusCard, haCard: HTMLElement) => void]>([
        ["leaving a sections view", (element) => (element.layout = undefined)],
        ["hidden", (_element, haCard) => Object.defineProperty(haCard, "clientWidth", { value: 0, configurable: true })],
    ])("lets go of its rows when %s", async (_name, change) => {
        const element = await card(mockHass(), {}, "grid");
        const haCard = laidOut(element, 208, 115, null);
        fillRows(element);
        await element.updateComplete;
        expect(haCard.getAttribute("style")).toBe("min-height: 248px");
        change(element, haCard);
        await element.updateComplete;
        fillRows(element);
        await element.updateComplete;
        expect(haCard.getAttribute("style") ?? "").toBe("");
    });

    /** The card's notices, taller than the room they have, as happy-dom lays nothing out. */
    async function overflowing(element: MowerStatusCard): Promise<HTMLElement> {
        const notices = root(element).querySelector(".notices") as HTMLElement;
        Object.defineProperty(notices, "scrollHeight", { value: 600, configurable: true });
        Object.defineProperty(notices, "clientHeight", { value: 200, configurable: true });
        element.requestUpdate();
        await element.updateComplete;
        return notices;
    }

    const RAIN = { "binary_sensor.matti_rain": { state: "on" } };

    it.each([
        ["held to a height", undefined, { height: 300 }, ["fade-bottom"]],
        ["held up to a limit", undefined, { max_height: 300 }, ["fade-bottom"]],
        ["held by rows in a sections view", "grid", { grid_options: { rows: 4 } }, ["fade-bottom"]],
        [
            "held to a height with automatic rows in a sections view",
            "grid",
            { height: 300, grid_options: { rows: "auto" } },
            ["fade-bottom"],
        ],
        ["held by the older layout options' rows in a sections view", "grid", { layout_options: { grid_rows: 4 } }, ["fade-bottom"]],
        ["never in auto", undefined, {}, []],
        ["never in auto with automatic rows in a sections view", "grid", { grid_options: { rows: "auto" } }, []],
        ["never by grid rows outside a sections view", undefined, { grid_options: { rows: 4 } }, []],
    ])("fades the bottom edge of the notices that run past it when %s", async (_name, layout, extra, expected) => {
        const notices = await overflowing(await card(mockHass(RAIN), extra, layout));
        expect(["fade-top", "fade-bottom"].filter((name) => notices.classList.contains(name))).toEqual(expected);
    });

    it("lets go of the notices' fade when the card goes from held to auto, and fades them again when held again", async () => {
        const element = await card(mockHass(RAIN), { height: 300 });
        const notices = await overflowing(element);
        expect([...notices.classList].filter((name) => name.startsWith("fade"))).toEqual(["fades", "fade-bottom"]);
        const config = { type: "custom:mower-status-card", entity: "lawn_mower.matti", show_image: false };
        element.setConfig(config as MowerStatusCardConfig);
        await element.updateComplete;
        expect([...notices.classList].filter((name) => name.startsWith("fade"))).toEqual([]);
        element.setConfig({ ...config, height: 300 } as MowerStatusCardConfig);
        await element.updateComplete;
        expect([...notices.classList].filter((name) => name.startsWith("fade"))).toEqual(["fades", "fade-bottom"]);
    });

    it.each([
        ["gauge", {}, ["gauge-top", "notices", "buttons"]],
        ["picture", { show_image: true, image: "/local/mower.png" }, ["picture-top", "notices", "buttons", "footer"]],
    ])("puts the notices between the status and the buttons, in the %s layout", async (_name, extra, parts) => {
        const element = await card(mockHass({ "binary_sensor.matti_rain": { state: "on" } }), {
            ...extra,
            height_mode: "fixed",
            height: 300,
        });
        const haCard = root(element).querySelector("ha-card")!;
        expect([...haCard.children].map((child) => child.classList[0])).toEqual(parts);
        expect(haCard.querySelector(".notices .chips")).not.toBeNull();
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
