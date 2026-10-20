import type { LovelaceCardConfig } from "./hass";

/** The mower's companion entities the card can use, each found on its own or chosen in the editor. */
export const SLOTS = [
    "battery",
    "charging",
    "progress",
    "time_left",
    "elapsed",
    "error",
    "error_time",
    "rain",
    "positioning",
    "vision",
    "satellites",
    "blade_time",
    "blade_limit",
    "update",
    "mileage",
    "continue",
    "cancel",
    "picture",
] as const;

export type Slot = (typeof SLOTS)[number];

/** Written in place of an entity to turn a slot off, so what was found isn't used. */
export const NONE = "none";

export interface MowerStatusCardConfig extends LovelaceCardConfig {
    /** The lawn_mower entity. */
    entity: string;
    /** Replaces the device's name. */
    name?: string;
    /** A picture of the mower turns the card's picture layout on. False keeps the gauge layout even when one is found. */
    show_image?: boolean;
    /** A picture of its own: any address the browser can load, such as /local/mower.png. */
    image?: string;
    /** For a Mammotion mower: the white model's picture, where ha-mammotion-assets has one. */
    image_variant?: "default" | "white";
    /** False leaves out the cancel button, and Home Assistant's stop in its place. */
    show_cancel?: boolean;
    /** The blade limit for a mower that reports none of its own. */
    blade_warning_hours?: number;
    /** Only what differs from what the card finds by itself: an entity in place of the found one, or "none". */
    entities?: Partial<Record<Slot, string>>;
}

/** Something wrong with the mower, shown as a chip. The most severe come first. */
export interface Notice {
    id: "error" | "positioning" | "blade" | "rain" | "update";
    level: "red" | "amber" | "blue";
    /** Values for the chip's and the detail's texts. */
    values: Record<string, string>;
}
