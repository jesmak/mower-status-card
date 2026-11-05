/*
 * Whether a part fits where it is, from widths measured on the page in the layout's pixels. A part goes to a line of its
 * own only when it doesn't fit beside the rest, never at a fixed width.
 */

/** An icon button's width, and the gap between the buttons, as the card's styles give them. */
const ICON_BUTTON_PX = 46;
const BUTTON_GAP_PX = 8;

/**
 * Room for a measure read in fractions of a pixel, so a text exactly as wide as its room still fits, and a width
 * unscaled with floating-point noise counts as the whole pixels it is. Smaller than the 1/64 px a browser lays out in.
 */
const SLACK_PX = 0.01;

/**
 * Whether the main button fits beside the icon buttons with its label whole on one line: `width` is the row's, `fixed`
 * the main button's padding and its icon with the gap after it, `label` the label's width.
 */
export function buttonsFit(width: number, fixed: number, label: number, iconButtons: number): boolean {
    return fixed + label + iconButtons * (ICON_BUTTON_PX + BUTTON_GAP_PX) <= width + SLACK_PX;
}

/** Whether texts fit in the room beside a part with no word broken: each need is a text's longest word and where it starts. */
export function besideFits(room: number, needs: number[]): boolean {
    return needs.every((need) => need <= room + SLACK_PX);
}

/** Whether texts beside a part are no taller there than the part and the texts under it, as a fraction over isn't. */
export function besideNoTaller(beside: number, stacked: number): boolean {
    return beside <= stacked + SLACK_PX;
}
