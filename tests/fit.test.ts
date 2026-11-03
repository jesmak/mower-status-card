import { describe, expect, it } from "vitest";

import { besideFits, besideNoTaller, buttonsFit } from "../src/fit";

describe("buttonsFit", () => {
    // A main button with 12 px padding on each side and a 20 px icon 8 px from its label, and two 46 px icon buttons
    // 8 px apart: 160 px besides the label.
    it.each<[string, number, number, boolean]>([
        ["with room to spare", 400, 200, true],
        ["exactly as wide as its room", 400, 240, true],
        ["within a measure's fraction of its room", 400, 240.005, true],
        ["a pixel wider than its room", 400, 241, false],
    ])("fits a label %s", (_name, width, label, fits) => {
        expect(buttonsFit(width, 52, label, 2)).toBe(fits);
    });

    it("counts only the icon buttons there are", () => {
        expect(buttonsFit(300, 52, 190, 1)).toBe(true);
        expect(buttonsFit(300, 52, 190, 2)).toBe(false);
    });
});

describe("besideFits", () => {
    it.each<[string, number[], boolean]>([
        ["no texts", [], true],
        ["every word within the room", [100, 268], true],
        ["one word a pixel over", [100, 269], false],
    ])("with %s", (_name, needs, fits) => {
        expect(besideFits(268, needs)).toBe(fits);
    });
});

describe("besideNoTaller", () => {
    it.each<[string, number, boolean]>([
        ["lower beside", 100, true],
        ["as tall either way", 120, true],
        ["within a measure's fraction", 120.005, true],
        ["a pixel taller beside", 121, false],
    ])("keeps texts beside when %s", (_name, beside, fits) => {
        expect(besideNoTaller(beside, 120)).toBe(fits);
    });
});
