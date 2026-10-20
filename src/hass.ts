/** The little of Home Assistant a card needs, so the unmaintained custom-card-helpers isn't a dependency. */

export interface HassEntity {
    entity_id: string;
    state: string;
    last_changed: string;
    attributes: Record<string, unknown>;
}

/** An entity as the frontend's registry hands it to cards: enough to find a device's other entities and what they are. */
export interface EntityRegistryEntry {
    entity_id: string;
    device_id?: string | null;
    platform?: string;
    translation_key?: string;
    hidden?: boolean;
}

export interface DeviceRegistryEntry {
    id: string;
    /** The integration's own name for the device, such as "Yuka-MNEXAMPLE1". */
    name?: string | null;
    name_by_user?: string | null;
}

export interface HomeAssistant {
    states: Record<string, HassEntity | undefined>;
    /** Empty for a moment while the page loads: the frontend fetches the registries separately from the states. */
    entities?: Record<string, EntityRegistryEntry | undefined>;
    devices?: Record<string, DeviceRegistryEntry | undefined>;
    language?: string;
    /**
     * `time_zone` is the user's choice between the browser's zone and the server's, `time_format` their choice of a 12- or
     * 24-hour clock, or the language's own, or the system's.
     */
    locale?: { language?: string; time_zone?: "local" | "server"; time_format?: "language" | "system" | "12" | "24" };
    config?: { time_zone?: string };
    /** A state in the user's language and number format, with its unit: "Telakoituna", "94 %". */
    formatEntityState: (entity: HassEntity) => string;
    /** A text from Home Assistant's translations by its key, or "" when there is none. */
    localize: (key: string) => string;
    callWS: <T>(message: Record<string, unknown>) => Promise<T>;
}

export interface LovelaceCardConfig {
    type: string;
    [key: string]: unknown;
}
