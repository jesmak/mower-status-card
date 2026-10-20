/**
 * The card's visual editor: the mower, its name and picture, the blade limit, and the companion entities the card
 * found, each of which can be swapped or turned off. Only what differs from what was found is written.
 */
import { LitElement, css, html, nothing } from "lit";
import type { CSSResultGroup, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { HomeAssistant } from "./hass";
import { browserLanguage, translate } from "./localize/localize";
import { SLOT_DOMAINS, detectSlots, platformOf, slotChanges } from "./slots";
import { NONE, SLOTS } from "./types";
import type { MowerStatusCardConfig, Slot } from "./types";

interface SchemaEntry {
    name: string;
}

const DEFAULTS: Record<string, unknown> = {
    show_image: true,
    show_cancel: true,
    image_variant: "default",
};

function mainSchema(mammotion: boolean, text: (key: string) => string) {
    return [
        { name: "entity", required: true, selector: { entity: { domain: "lawn_mower" } } },
        { name: "name", selector: { text: {} } },
        {
            type: "expandable",
            name: "",
            flatten: true,
            title: text("editor.picture"),
            icon: "mdi:image-outline",
            schema: [
                { name: "show_image", selector: { boolean: {} } },
                { name: "image", selector: { text: {} } },
                ...(mammotion
                    ? [
                          {
                              name: "image_variant",
                              selector: {
                                  select: {
                                      mode: "dropdown",
                                      options: [
                                          { value: "default", label: text("editor.variant_default") },
                                          { value: "white", label: text("editor.variant_white") },
                                      ],
                                  },
                              },
                          },
                      ]
                    : []),
            ],
        },
        { name: "show_cancel", selector: { boolean: {} } },
        { name: "blade_warning_hours", selector: { number: { min: 0, max: 5000, step: 1, mode: "box", unit_of_measurement: "h" } } },
    ];
}

const SLOTS_SCHEMA = SLOTS.map((slot) => ({ name: slot, selector: { entity: { domain: SLOT_DOMAINS[slot] } } }));

@customElement("mower-status-card-editor")
export class MowerStatusCardEditor extends LitElement {
    @property({ attribute: false }) public hass?: HomeAssistant;
    @state() private config: MowerStatusCardConfig = { type: "custom:mower-status-card", entity: "" };

    public setConfig(config: MowerStatusCardConfig): void {
        this.config = { ...config };
    }

    protected render(): TemplateResult | typeof nothing {
        if (!this.hass) {
            return nothing;
        }
        const data = { ...DEFAULTS, ...this.config };
        const mammotion = !!this.config.entity && platformOf(this.hass, this.config.entity) === "mammotion";
        return html`
            <ha-form
                .hass=${this.hass}
                .data=${data}
                .schema=${mainSchema(mammotion, (key) => this.text(key))}
                .computeLabel=${(entry: SchemaEntry) => this.text(`editor.${entry.name}`)}
                .computeHelper=${(entry: SchemaEntry) => this.helper(entry.name)}
                @value-changed=${this.mainChanged}
            ></ha-form>
            ${this.config.entity ? this.slotsPanel() : nothing}
        `;
    }

    /** Each slot shows what is used: the found entity, the one chosen instead, or nothing when it was turned off. */
    private slotsPanel(): TemplateResult {
        const found = detectSlots(this.hass!, this.config.entity);
        const chosen: Partial<Record<Slot, string>> = { ...found };
        for (const [slot, entity] of Object.entries(this.config.entities ?? {}) as Array<[Slot, string]>) {
            chosen[slot] = entity === NONE ? "" : entity;
        }
        return html`
            <ha-expansion-panel outlined .header=${this.text("editor.entities")} .leftChevron=${true}>
                <ha-icon slot="leading-icon" icon="mdi:format-list-bulleted"></ha-icon>
                <p class="helper">${this.text("editor.entities_helper")}</p>
                <ha-form
                    .hass=${this.hass}
                    .data=${chosen}
                    .schema=${SLOTS_SCHEMA}
                    .computeLabel=${(entry: SchemaEntry) => this.text(`slot.${entry.name}`)}
                    @value-changed=${(event: CustomEvent<{ value: Partial<Record<Slot, string>> }>) => this.slotsChanged(found, event.detail.value)}
                ></ha-form>
            </ha-expansion-panel>
        `;
    }

    static get styles(): CSSResultGroup {
        return css`
            ha-expansion-panel {
                display: block;
                margin-top: 24px;
            }

            .helper {
                margin: 8px 0 16px;
                font-size: 12px;
                line-height: 1.4;
                color: var(--secondary-text-color);
            }
        `;
    }

    private mainChanged(event: CustomEvent<{ value: MowerStatusCardConfig }>): void {
        const config: MowerStatusCardConfig = { ...event.detail.value };
        // Another mower has entities, a model, a picture, a name and blades of its own, so what was set for the last one goes.
        if (config.entity !== this.config.entity) {
            delete config.entities;
            delete config.image_variant;
            delete config.image;
            delete config.name;
            delete config.blade_warning_hours;
        }
        for (const key of ["name", "image", "blade_warning_hours"] as const) {
            if (config[key] === "" || config[key] === undefined || config[key] === null || config[key] === 0) {
                delete config[key];
            }
        }
        // The defaults are shown in the form but left out of the configuration.
        for (const [key, value] of Object.entries(DEFAULTS)) {
            if (config[key] === value || config[key] === undefined || config[key] === null) {
                delete config[key];
            }
        }
        this.fire(config);
    }

    private slotsChanged(found: Partial<Record<Slot, string>>, chosen: Partial<Record<Slot, string>>): void {
        const config: MowerStatusCardConfig = { ...this.config };
        const changes = slotChanges(found, chosen, this.config.entities);
        if (Object.keys(changes).length) {
            config.entities = changes;
        } else {
            delete config.entities;
        }
        this.fire(config);
    }

    private fire(config: MowerStatusCardConfig): void {
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
    }

    private text(key: string): string {
        return translate(this.language(), key);
    }

    private helper(name: string): string | undefined {
        const key = `editor.${name}_helper`;
        const helper = translate(this.language(), key);
        return helper === key ? undefined : helper;
    }

    private language(): string {
        return this.hass?.locale?.language ?? this.hass?.language ?? browserLanguage();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "mower-status-card-editor": MowerStatusCardEditor;
    }
}
