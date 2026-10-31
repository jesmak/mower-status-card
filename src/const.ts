/** Replaced at build time with the version in package.json. */
declare const __CARD_VERSION__: string;

export const CARD_VERSION = __CARD_VERSION__;

/** An error is a notice for this long after it happened, and then only history. */
export const ERROR_FRESH_MS = 24 * 3_600_000;

/** How far back the card looks for the end of the last mowing. Home Assistant keeps 10 days of history by default. */
export const HISTORY_DAYS = 10;

/** How often the card redraws itself between state changes, so "yesterday" and a day-old error age on their own. */
export const TICK_MS = 60_000;

/** A sections view's row and the gap under it. */
export const ROW_PX = 64;
export const ROW_GAP_PX = 8;

/** The lawn_mower entity's supported_features bits. */
export const FEATURE_START_MOWING = 1;
export const FEATURE_PAUSE = 2;
export const FEATURE_DOCK = 4;
export const FEATURE_STOP = 8;

/** Where HACS installs ha-mammotion-assets, whose pictures the card shows for a Mammotion mower when they are there. */
export const MAMMOTION_ASSETS = "/hacsfiles/ha-mammotion-assets/dist/assets";
