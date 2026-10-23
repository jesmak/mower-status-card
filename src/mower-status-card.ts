/**
 * A dashboard card for a robotic lawn mower: its state, battery and the task under way, what is wrong with it as chips,
 * and its buttons. With a picture of the mower it shows the picture, without one a gauge.
 *
 * The card finds the mower's companion entities on its own device (src/slots.ts). What it makes of them, such as which
 * button leads and what counts as a problem, is in src/mower.ts.
 */
import { LitElement, css, html, nothing } from "lit";
import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import {
    CARD_VERSION,
    FEATURE_DOCK,
    FEATURE_PAUSE,
    FEATURE_START_MOWING,
    FEATURE_STOP,
    HISTORY_DAYS,
    MAMMOTION_ASSETS,
    TICK_MS,
} from "./const";
import "./editor";
import type { HassEntity, HomeAssistant } from "./hass";
import { browserLanguage, translate, translateOwn } from "./localize/localize";
import { hasTask, lastMowingEnd, lastMowingStart, mainAction, mammotionPictures, minutesOf, notices, numberOf } from "./mower";
import type { MainAction } from "./mower";
import { activityOf, domain, platformOf, presetOf, resolveSlots } from "./slots";
import type { Preset } from "./slots";
import type { MowerStatusCardConfig, Notice, Slot } from "./types";

console.info(
    `%c  MOWER-STATUS-CARD \n%c  ${CARD_VERSION}    `,
    "color: orange; font-weight: bold; background: black",
    "color: white; font-weight: bold; background: dimgray",
);

interface CardRegistration {
    type: string;
    name: string;
    description: string;
    documentationURL?: string;
    preview?: boolean;
}

const registry = window as unknown as { customCards?: CardRegistration[] };
registry.customCards = registry.customCards ?? [];
registry.customCards.push({
    type: "mower-status-card",
    name: translate(browserLanguage(), "common.name"),
    description: translate(browserLanguage(), "common.description"),
    documentationURL: "https://github.com/jesmak/mower-status-card",
    preview: true,
});

/**
 * Whether a picture answers, asked once per address for every card on the page. Only a picture that answered is
 * remembered, so one missing now, such as while Home Assistant restarts, is asked again at the card's next search.
 */
const pictureChecks = new Map<string, Promise<boolean>>();

function pictureExists(url: string): Promise<boolean> {
    if (!pictureChecks.has(url)) {
        const check = fetch(url, { method: "HEAD" }).then(
            (response) => response.ok,
            () => false,
        );
        pictureChecks.set(url, check);
        void check.then((found) => {
            if (!found) {
                pictureChecks.delete(url);
            }
        });
    }
    return pictureChecks.get(url)!;
}

/** The time of the error the user dismissed for a mower, kept in this browser only. Null when storage is refused. */
function storedDismissal(entityId: string): number | null {
    try {
        const stored = Number(localStorage.getItem(`mower-status-card.dismissed.${entityId}`));
        return stored > 0 ? stored : null;
    } catch {
        return null;
    }
}

interface Action {
    action: "perform-action";
    perform_action: string;
    target: { entity_id: string };
    confirmation?: { text: string };
}

@customElement("mower-status-card")
export class MowerStatusCard extends LitElement {
    @property({ attribute: false }) public hass?: HomeAssistant;
    @state() private config?: MowerStatusCardConfig;
    /** The chip whose text is open: an id, or null when the user closed it. */
    @state() private selected: string | null = null;
    @state() private picture: string | null = null;
    /** The addresses, without their tokens, of pictures of the mower's own that turned out transparent and get a frame. */
    @state() private framedPictures = new Set<string>();
    /** The addresses of pictures that didn't load, without their tokens. */
    private failedPictures = new Set<string>();
    /**
     * The end of the last mowing, or when the history read begins when there was no mowing in it. Undefined before the
     * history has been read, and when there is none, such as for a mower the recorder leaves out.
     */
    @state() private lastMowed?: { end: number } | { since: number };
    /** When the last mowing in the history started, which ends any error from before it. */
    @state() private lastStart: number | null = null;
    /** Dismissed errors by mower, for a browser that refuses to store them, such as in a private window. */
    @state() private dismissals = new Map<string, number>();
    private slots: Partial<Record<Slot, string>> = {};
    /** What the mower is doing, in Home Assistant's lawn_mower states, whatever words its integration uses. */
    private activity = "";
    private preset?: Preset;
    private notices: Notice[] = [];
    private seenNotices = new Set<string>();
    private pictureKey?: string;
    private historyKey?: string;
    private ticker?: ReturnType<typeof setInterval>;

    public static getConfigElement(): HTMLElement {
        return document.createElement("mower-status-card-editor");
    }

    /** Offers the first lawn mower there is when the card is added from the picker. */
    public static getStubConfig(hass?: HomeAssistant): Record<string, unknown> {
        return { entity: Object.keys(hass?.states ?? {}).find((id) => domain(id) === "lawn_mower") ?? "" };
    }

    public setConfig(config: MowerStatusCardConfig): void {
        if (!config || typeof config.entity !== "string" || domain(config.entity) !== "lawn_mower") {
            throw new Error(translate(browserLanguage(), "common.invalid_configuration"));
        }
        this.config = { ...config };
    }

    public getCardSize(): number {
        return 4;
    }

    /** In a sections view the card takes a whole section by default and is never narrower than half of one. */
    public getGridOptions(): Record<string, unknown> {
        return { columns: 12, min_columns: 6, rows: "auto" };
    }

    /** "Yesterday" and a day-old error age on their own, so the card redraws itself while it is on the page. */
    public connectedCallback(): void {
        super.connectedCallback();
        this.requestUpdate();
        this.ticker = setInterval(() => this.requestUpdate(), TICK_MS);
    }

    public disconnectedCallback(): void {
        super.disconnectedCallback();
        clearInterval(this.ticker);
    }

    protected shouldUpdate(changed: PropertyValues): boolean {
        const previous = changed.get("hass") as HomeAssistant | undefined;
        if (!this.config || !changed.has("hass") || !previous || changed.size > 1) {
            return true;
        }
        // Home Assistant hands the card every state change in the house; only the mower's own entities matter, and the
        // user's language, time format and time zone, the device's name, and Home Assistant's translations, which arrive
        // after the card has first drawn itself.
        if (
            previous.entities !== this.hass?.entities ||
            previous.devices !== this.hass?.devices ||
            previous.locale !== this.hass?.locale ||
            previous.config !== this.hass?.config ||
            previous.language !== this.hass?.language ||
            previous.localize !== this.hass?.localize ||
            previous.formatEntityState !== this.hass?.formatEntityState
        ) {
            return true;
        }
        return [this.config.entity, ...Object.values(this.slots)].some((id) => previous.states[id] !== this.hass?.states[id]);
    }

    protected willUpdate(): void {
        if (!this.hass || !this.config) {
            return;
        }
        this.slots = resolveSlots(this.hass, this.config);
        const mower = this.hass.states[this.config.entity];
        this.preset = presetOf(this.hass, this.config.entity);
        this.activity = activityOf(this.preset, mower?.state ?? "");
        const found = notices({
            states: this.slotStates(),
            mowerState: this.activity,
            // An integration's own word for an error, or an older Sunseeker's error text in place of its state.
            stateError: mower && this.activity === "error" && mower.state !== "error" ? this.hass.formatEntityState(mower) : undefined,
            now: Date.now(),
            language: this.language(),
            bladeWarningHours: this.config.blade_warning_hours,
            format: (entity) => this.hass!.formatEntityState(entity),
            lastStart: this.lastStart,
            // Another card of the same mower on the page may have dismissed a newer error since.
            dismissed: Math.max(storedDismissal(this.config.entity) ?? 0, this.dismissals.get(this.config.entity) ?? 0) || null,
        });
        // A notice not seen since the page was opened opens the most severe one, even after the user closed the box. One
        // that comes and goes, such as rain in showers, doesn't open it again.
        // An error is new when its time is, or its text when it has no time, the others when their kind is.
        const seenAs = (notice: Notice) => (notice.id === "error" ? `error|${notice.values.time || notice.values.text}` : notice.id);
        const ids = new Set(found.map((notice) => notice.id));
        const arrived = found.some((notice) => !this.seenNotices.has(seenAs(notice)));
        if (arrived || (this.selected !== null && !ids.has(this.selected as Notice["id"]))) {
            this.selected = arrived ? (found[0]?.id ?? null) : null;
        }
        found.forEach((notice) => this.seenNotices.add(seenAs(notice)));
        this.notices = found;
        this.findPicture(mower);
        this.readHistory(mower);
    }

    protected render(): TemplateResult | typeof nothing {
        if (!this.hass || !this.config) {
            return nothing;
        }
        const mower = this.hass.states[this.config.entity];
        if (!mower) {
            return html`<ha-card><div class="message">${this.text("common.no_entity", { entity: this.config.entity })}</div></ha-card>`;
        }
        const unavailable = this.activity === "unavailable";
        return html`
            <ha-card class=${unavailable ? "unavailable" : ""} lang=${this.language()}>
                ${this.picture ? this.pictureLayout(mower) : this.gaugeLayout(mower)} ${this.chips()} ${this.buttons(mower)}
                ${this.picture ? this.footer() : nothing}
            </ha-card>
        `;
    }

    /** Without a picture: a ring with the one number that matters now, the name and state beside it. */
    private gaugeLayout(mower: HassEntity): TemplateResult {
        const task = hasTask(this.activity);
        const progress = task ? numberOf(this.slotState("progress")) : null;
        const battery = numberOf(this.slotState("battery"));
        const ring =
            progress !== null
                ? {
                      value: progress,
                      label: this.text("common.done"),
                      color: this.activity === "mowing" ? "var(--success-color, #4caf50)" : "var(--primary-color)",
                  }
                : battery !== null
                  ? { value: battery, label: this.text("common.battery"), color: this.batteryColor(battery) }
                  : null;
        return html`
            <div class="gauge-top">
                <div class="ring" style="--value: ${ring?.value ?? 0}; --ring-color: ${ring?.color ?? "var(--primary-color)"}">
                    <div>
                        ${
                            ring
                                ? html`<b>${this.percent(ring.value)}</b><span>${ring.label}</span>`
                                : html`<ha-icon icon="mdi:robot-mower"></ha-icon>`
                        }
                    </div>
                </div>
                <div class="info">
                    <button class="name" @click=${() => this.moreInfo(this.config!.entity)}>${this.name()}</button>
                    <div class="state ${this.activity}">${this.stateText(mower)}</div>
                    <div class="lines">${this.lines(progress !== null)}</div>
                </div>
            </div>
        `;
    }

    /** The lines under the state in the gauge layout. */
    private lines(ringShowsProgress: boolean): TemplateResult[] {
        const lines: TemplateResult[] = [];
        const line = (icon: string, content: string | TemplateResult, muted = false) =>
            html`<div class=${muted ? "muted" : ""}><ha-icon icon=${icon}></ha-icon><span>${content}</span></div>`;
        const battery = this.slotState("battery") ? this.format("battery") : null;
        const elapsed = this.duration(minutesOf(this.slotState("elapsed")));
        if (this.activity === "mowing") {
            const left = this.duration(minutesOf(this.slotState("time_left")));
            if (left) {
                lines.push(line("mdi:timer-sand", this.text("common.time_left", { time: left })));
            }
            if (battery && ringShowsProgress) {
                lines.push(
                    line(
                        "mdi:battery-outline",
                        elapsed
                            ? this.text("common.battery_elapsed", { battery, elapsed })
                            : this.text("common.battery_value", { battery }),
                        true,
                    ),
                );
            } else if (elapsed) {
                // The ring shows the battery, so the time elapsed goes on a line of its own.
                lines.push(line("mdi:timer-outline", this.text("common.elapsed", { elapsed }), true));
            }
        } else if (hasTask(this.activity)) {
            if (battery && ringShowsProgress) {
                lines.push(line(this.batteryIcon(), this.text("common.battery_value", { battery })));
            }
        } else {
            const mowed = this.lastMowedText();
            if (mowed) {
                lines.push(line("mdi:history", mowed));
            }
        }
        if (this.slotState("mileage") && this.activity !== "mowing") {
            lines.push(line("mdi:map-marker-distance", this.text("common.mileage", { value: this.format("mileage") }), true));
        }
        return lines;
    }

    /** With a picture: the picture, and the state large beside it with the battery and the task under it. */
    private pictureLayout(mower: HassEntity): TemplateResult {
        const task = hasTask(this.activity);
        const progress = task ? numberOf(this.slotState("progress")) : null;
        const left = this.activity === "mowing" ? this.duration(minutesOf(this.slotState("time_left"))) : null;
        const elapsed = this.duration(minutesOf(this.slotState("elapsed")));
        const below =
            progress !== null
                ? elapsed && this.activity === "mowing"
                    ? this.text("common.progress_elapsed", { progress: this.percent(progress), elapsed })
                    : this.text("common.progress_done", { progress: this.percent(progress) })
                : task
                  ? null
                  : this.lastMowedText();
        return html`
            <div class="picture-top">
                <button class="picture ${this.pictureClass()}" @click=${() => this.moreInfo(this.config!.entity)}>
                    <img src=${this.picture!} alt=${this.name()} @load=${this.pictureLoaded} @error=${this.pictureFailed} />
                </button>
                <div class="info">
                    <div class="big-state ${this.activity}">${this.stateText(mower, false)}</div>
                    <div class="sub">
                        ${
                            this.slotState("battery")
                                ? html`<span
                                      ><ha-icon
                                          class="battery ${this.batteryIcon().includes("charging") ? "charging" : ""}"
                                          icon=${this.batteryIcon()}
                                      ></ha-icon
                                      >${this.format("battery")}${this.chargingNote()}</span
                                  >`
                                : nothing
                        }
                        ${left ? html`<span><ha-icon icon="mdi:timer-sand"></ha-icon>${this.text("common.time_left", { time: left })}</span>` : nothing}
                    </div>
                    ${
                        progress !== null
                            ? html`<div class="bar ${this.activity}"><i style="width: ${Math.min(100, Math.max(0, progress))}%"></i></div>`
                            : nothing
                    }
                    ${below ? html`<div class="below">${below}</div>` : nothing}
                </div>
            </div>
        `;
    }

    private footer(): TemplateResult {
        return html`<div class="footer">
            <button class="footer-name" @click=${() => this.moreInfo(this.config!.entity)}>${this.name()}</button>
            ${
                this.slotState("mileage") && this.activity !== "mowing"
                    ? html`<span>${this.text("common.mileage", { value: this.format("mileage") })}</span>`
                    : nothing
            }
        </div>`;
    }

    /** What is wrong, as chips. The selected one's text opens under them; selecting it again closes it. */
    private chips(): TemplateResult | typeof nothing {
        if (!this.notices.length) {
            return nothing;
        }
        const open = this.notices.find((notice) => notice.id === this.selected);
        return html`
            <div class="chips">
                ${this.notices.map(
                    (notice) => html`
                        <button
                            class="chip ${notice.level} ${notice.id === this.selected ? "selected" : ""}"
                            aria-expanded=${notice.id === this.selected}
                            @click=${() => (this.selected = notice.id === this.selected ? null : notice.id)}
                        >
                            <ha-icon icon=${NOTICE_ICONS[notice.id]}></ha-icon>${this.chipLabel(notice)}
                        </button>
                    `,
                )}
            </div>
            ${
                open
                    ? html`<div class="detail ${open.level}">
                          <span>${this.chipText(open)}</span>
                          ${
                              this.dismissible(open)
                                  ? html`<button class="dismiss" @click=${() => this.dismiss(open)}>${this.text("notice.dismiss")}</button>`
                                  : nothing
                          }
                      </div>`
                    : nothing
            }
        `;
    }

    /**
     * An error the mower is past but its sensor still reports, as Mammotion's low battery while it charges. One the
     * mower is still in stays. The dismissal is kept by the error's time.
     */
    private dismissible(notice: Notice): boolean {
        return notice.id === "error" && !!notice.values.time && this.activity !== "error";
    }

    private dismiss(notice: Notice): void {
        const entityId = this.config!.entity;
        this.dismissals = new Map(this.dismissals).set(entityId, Number(notice.values.time));
        try {
            localStorage.setItem(`mower-status-card.dismissed.${entityId}`, notice.values.time);
        } catch {
            // Kept for this page only, in dismissals.
        }
    }

    private chipLabel(notice: Notice): string {
        return this.text(`notice.${notice.id}`, notice.values);
    }

    private chipText(notice: Notice): string {
        const values = notice.values;
        switch (notice.id) {
            case "error": {
                if (!values.text) {
                    return this.text("notice.error_generic");
                }
                if (!values.time) {
                    return values.text;
                }
                const when = this.whenText(Number(values.time));
                return this.text("notice.error_text", {
                    when: when.charAt(0).toLocaleUpperCase(this.language()) + when.slice(1),
                    text: values.text,
                });
            }
            case "positioning":
                return [
                    values.generic ? this.text("notice.positioning_generic") : "",
                    values.rtk ? this.text("notice.positioning_rtk", { state: values.rtk }) : "",
                    values.vision ? this.text("notice.positioning_vision") : "",
                    values.satellites ? this.text("notice.positioning_satellites", { count: values.satellites }) : "",
                ]
                    .filter(Boolean)
                    .join(" ");
            default:
                return this.text(`notice.${notice.id}_text`, values);
        }
    }

    /** The big button, then Cancel and Dock as icons. A button the mower can't use is left out, one it can't use now is greyed. */
    private buttons(mower: HassEntity): TemplateResult {
        const unavailable = this.activity === "unavailable";
        const features = Number(mower.attributes.supported_features ?? 0);
        const main = mainAction(this.activity, features);
        const mainParts = {
            pause: { icon: "mdi:pause", enabled: !!(features & FEATURE_PAUSE) },
            dock: { icon: "mdi:home-import-outline", enabled: true },
            continue: { icon: "mdi:play-pause", enabled: !!this.slots.continue || !!(features & FEATURE_START_MOWING) },
            start: { icon: "mdi:play", enabled: !!(features & FEATURE_START_MOWING) },
        }[main];
        return html`
            <div class="buttons">
                <button class="button main ${main}" ?disabled=${unavailable || !mainParts.enabled} @click=${() => this.main(main)}>
                    <ha-icon icon=${mainParts.icon}></ha-icon>${this.text(this.mainLabel(main))}
                </button>
                ${
                    this.config!.show_cancel === false
                        ? nothing
                        : this.slots.cancel
                          ? this.stopButton("cancel", unavailable, () =>
                                this.perform("button.press", this.slots.cancel!, { text: this.text("action.cancel_confirm") }),
                            )
                          : features & FEATURE_STOP
                            ? this.stopButton("stop", unavailable, () =>
                                  this.perform("lawn_mower.stop", this.config!.entity, { text: this.text("action.stop_confirm") }),
                              )
                            : nothing
                }
                ${
                    features & FEATURE_DOCK && main !== "dock"
                        ? html`<button
                              class="button icon"
                              title=${this.text("action.dock")}
                              aria-label=${this.text("action.dock")}
                              ?disabled=${unavailable || this.activity === "docked" || this.charging()}
                              @click=${() => this.perform("lawn_mower.dock", this.config!.entity)}
                          >
                              <ha-icon icon="mdi:home-import-outline"></ha-icon>
                          </button>`
                        : nothing
                }
            </div>
        `;
    }

    /**
     * Cancel, through the integration's own cancel button, or Home Assistant's stop for a mower that has no such button.
     * Either asks first, and only while a task is under way.
     */
    private stopButton(kind: "cancel" | "stop", unavailable: boolean, press: () => void): TemplateResult {
        return html`<button
            class="button icon"
            title=${this.text(`action.${kind}`)}
            aria-label=${this.text(`action.${kind}`)}
            ?disabled=${unavailable || !hasTask(this.activity)}
            @click=${press}
        >
            <ha-icon icon="mdi:stop"></ha-icon>
        </button>`;
    }

    /** A mower with a continue button of its own works in tasks, as Mammotion's do. Any other just mows. */
    private mainLabel(action: MainAction): string {
        return action === "pause" || action === "dock" || this.slots.continue ? `action.${action}` : `action.${action}_mowing`;
    }

    private main(action: MainAction): void {
        const mower = this.config!.entity;
        if (action === "pause") {
            this.perform("lawn_mower.pause", mower);
        } else if (action === "dock") {
            this.perform("lawn_mower.dock", mower);
        } else if (action === "continue" && this.slots.continue) {
            this.perform("button.press", this.slots.continue);
        } else {
            this.perform("lawn_mower.start_mowing", mower);
        }
    }

    /** Through Home Assistant's own action handling, so a confirmation is its own dialog. */
    private perform(service: string, entityId: string, confirmation?: { text: string }): void {
        const tapAction: Action = { action: "perform-action", perform_action: service, target: { entity_id: entityId } };
        if (confirmation) {
            tapAction.confirmation = confirmation;
        }
        this.dispatchEvent(
            new CustomEvent("hass-action", {
                detail: { config: { entity: entityId, tap_action: tapAction }, action: "tap" },
                bubbles: true,
                composed: true,
            }),
        );
    }

    /**
     * The picture, the first of these that hasn't failed: the card's own, the integration's picture entity, the mower
     * entity's own, and Mammotion's model pictures when ha-mammotion-assets is there. An image entity's state says
     * nothing of its picture (Sunseeker's stays unknown whether there is one or not), so a picture is known to work only
     * once it loads.
     */
    private findPicture(mower: HassEntity | undefined): void {
        const config = this.config!;
        const device = this.device();
        const platform = platformOf(this.hass!, config.entity);
        const own = [
            config.image,
            this.slotState("picture")?.attributes.entity_picture as string | undefined,
            mower?.attributes.entity_picture as string | undefined,
        ].filter((url): url is string => !!url);
        const key = [config.show_image, ...own, config.image_variant, platform, device?.name].join("|");
        if (key === this.pictureKey) {
            return;
        }
        this.pictureKey = key;
        if (config.show_image === false) {
            this.picture = null;
            return;
        }
        const usable = (url: string) => !this.failedPictures.has(pictureAddress(url));
        const first = own.findIndex(usable);
        // A failed picture ahead of the one shown may work with its next token, as an image entity's comes every five
        // minutes and an integration's picture can fail while its cloud is slow.
        own.slice(0, first === -1 ? own.length : first).forEach((url) => this.retryPicture(url, key));
        if (first !== -1) {
            this.picture = own[first];
            return;
        }
        const models = (platform === "mammotion" ? mammotionPictures(device?.name, config.image_variant) : []).filter(usable);
        // A model picture shown stays until the search has found which model goes now, such as the standard one after the
        // white, so the card doesn't drop to the gauge in between. Anything else gives way at once.
        if (!isModelPicture(this.picture)) {
            this.picture = null;
        }
        void (async () => {
            for (const url of models) {
                if (await pictureExists(url)) {
                    // A search started meanwhile, or a picture ahead of the models that came back, goes first.
                    if (this.pictureKey === key && (this.picture === null || isModelPicture(this.picture))) {
                        this.picture = url;
                    }
                    return;
                }
            }
            // No model picture this time, such as for a Luba 2, which has none.
            if (this.pictureKey === key && isModelPicture(this.picture)) {
                this.picture = null;
            }
        })();
    }

    /** Loads a failed picture again in the background, and searches again once it loads, as it goes ahead of what is shown. */
    private retryPicture(url: string, key: string): void {
        const probe = new Image();
        probe.onload = () => {
            if (this.pictureKey === key) {
                this.failedPictures.delete(pictureAddress(url));
                this.pictureKey = undefined;
                this.requestUpdate();
            }
        };
        probe.src = url;
    }

    private pictureClass(): string {
        if (isModelPicture(this.picture)) {
            return "model";
        }
        return this.framedPictures.has(pictureAddress(this.picture!)) ? "own framed" : "own";
    }

    /** A picture of the mower's own that is transparent at its corners, a cut-out, gets the same frame as a model picture. */
    private pictureLoaded = (event: Event): void => {
        const img = event.target as HTMLImageElement;
        if (isModelPicture(this.picture)) {
            return;
        }
        const address = pictureAddress(img.src);
        const framed = hasTransparentCorners(img);
        if (framed !== this.framedPictures.has(address)) {
            const pictures = new Set(this.framedPictures);
            if (framed) {
                pictures.add(address);
            } else {
                pictures.delete(address);
            }
            this.framedPictures = pictures;
        }
    };

    /** A picture that doesn't load, such as a mistyped address, gives the card its gauge back rather than a broken image. */
    private pictureFailed = (): void => {
        if (this.picture) {
            this.failedPictures.add(pictureAddress(this.picture));
        }
        this.picture = null;
        // Searched again, so the next source, such as Mammotion's model picture, gets its turn.
        this.pictureKey = undefined;
    };

    /** Reads when the mower last started and stopped mowing, whenever its state changes. */
    private readHistory(mower: HassEntity | undefined): void {
        if (!mower || !this.hass) {
            return;
        }
        const entityId = this.config!.entity;
        // The platform too: the registry can arrive after the first states, and with it the preset that reads the history.
        const key = `${entityId}|${mower.state}|${mower.last_changed}|${platformOf(this.hass, entityId) ?? ""}`;
        if (key === this.historyKey) {
            return;
        }
        // Another mower's time would show until its own history arrives, so it goes first.
        if (!this.historyKey?.startsWith(`${entityId}|`)) {
            this.lastMowed = undefined;
            this.lastStart = null;
        }
        this.historyKey = key;
        const preset = this.preset;
        const activity = this.activity;
        this.hass
            .callWS<Record<string, Array<{ s: string; lu: number; lc?: number }>>>({
                type: "history/history_during_period",
                start_time: new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString(),
                entity_ids: [entityId],
                minimal_response: true,
                no_attributes: true,
                significant_changes_only: false,
            })
            .then(
                (history) => {
                    if (this.historyKey !== key) {
                        return;
                    }
                    // The integration's own words, such as Sunseeker's "working", as Home Assistant's.
                    const rows = (history[entityId] ?? []).map((row) => ({ ...row, s: activityOf(preset, row.s) }));
                    if (!rows.length) {
                        this.lastMowed = undefined;
                        this.lastStart = null;
                        return;
                    }
                    // The recorder writes its database every few seconds, so the change that started this read is often not
                    // in it yet. The state the card already has stands in for it.
                    if (rows[rows.length - 1].s !== activity) {
                        rows.push({ s: activity, lu: Date.parse(mower.last_changed) / 1000 });
                    }
                    const end = lastMowingEnd(rows);
                    this.lastMowed = end === null ? { since: rows[0].lu * 1000 } : { end };
                    this.lastStart = lastMowingStart(rows);
                },
                () => {
                    if (this.historyKey === key) {
                        this.lastMowed = undefined;
                        this.lastStart = null;
                    }
                },
            );
    }

    /** When it last mowed, or how long the history goes back without a mowing in it, so a shorter history isn't overstated. */
    private lastMowedText(): string | TemplateResult | null {
        if (!this.lastMowed) {
            return null;
        }
        if ("end" in this.lastMowed) {
            return this.markup("common.last_mowed", { when: this.whenMarkup(this.lastMowed.end) });
        }
        const days = Math.floor((Date.now() - this.lastMowed.since) / 86_400_000);
        // A day or less of history without mowing says nothing worth a line, and "over 1 days" isn't a sentence.
        return days >= 2 ? this.text("common.last_mowed_long_ago", { days: String(days) }) : null;
    }

    /** A moment as its day ("tänään", "ke 14.10.") and its time ("klo 15.18"), in the viewer's language. */
    private whenParts(time: number): { day: string; time: string } {
        const timeZone = this.timeZone();
        // The calendar day as a number, so "yesterday" holds on the 23- and 25-hour days of the clock changes too.
        const dayNumber = (value: number) => {
            const parts = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(
                value,
            );
            const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
            return Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000;
        };
        // "system" follows the browser's own locale, as Home Assistant itself does, not the language Home Assistant is in.
        const format = this.hass?.locale?.time_format;
        const hour12 =
            format === "12"
                ? true
                : format === "24"
                  ? false
                  : format === "system"
                    ? new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12
                    : undefined;
        const clock = new Intl.DateTimeFormat(this.language(), { timeZone, hour: "numeric", minute: "2-digit", hour12 }).format(time);
        const daysAgo = dayNumber(Date.now()) - dayNumber(time);
        const day =
            daysAgo === 0
                ? this.text("when.today")
                : daysAgo === 1
                  ? this.text("when.yesterday")
                  : new Intl.DateTimeFormat(this.language(), { timeZone, weekday: "short", day: "numeric", month: "numeric" }).format(time);
        return { day, time: this.text("when.time", { clock }) };
    }

    private whenText(time: number): string {
        return this.text("when.format", this.whenParts(time));
    }

    /**
     * The day and the time each stay whole, and the two together move to a line of their own before they part:
     * "Leikkasi viimeksi" / "ke 14.10. klo 15.18", and only then "ke 14.10." / "klo 15.18".
     */
    private whenMarkup(time: number): TemplateResult {
        const { day, time: clock } = this.whenParts(time);
        return html`<span class="when"
            >${this.markup("when.format", { day: html`<span class="whole">${day}</span>`, time: html`<span class="whole">${clock}</span>` })}</span
        >`;
    }

    /** "46 %" in Finnish, "46%" in English: each language's own way, as Home Assistant writes the battery. */
    private percent(value: number): string {
        return new Intl.NumberFormat(this.language(), { style: "percent", maximumFractionDigits: 0 }).format(value / 100);
    }

    private duration(minutes: number | null): string | null {
        if (minutes === null || minutes <= 0) {
            return null;
        }
        const total = Math.round(minutes);
        return total < 60
            ? this.text("duration.minutes", { minutes: String(total) })
            : this.text("duration.hours", { hours: String(Math.floor(total / 60)), minutes: String(total % 60) });
    }

    /** The mower's state in words, with a note on charging unless left out. */
    private stateText(mower: HassEntity, withCharging = true): string {
        const text = mower.state === "unavailable" ? this.text("common.unavailable") : this.stateWord(mower);
        return withCharging ? `${text}${this.chargingNote()}` : text;
    }

    private stateWord(mower: HassEntity): string {
        const preset = this.preset;
        // An integration with words of its own for its states keeps them, as they say more than the standard six. A state
        // its map doesn't name, such as an older Sunseeker's error text, reads as the standard state it stands for.
        if (preset?.states?.[mower.state] && !preset.plainStates?.includes(mower.state)) {
            return this.hass!.formatEntityState(mower);
        }
        // A standard state reads alike for every mower: in the card's own word where it has one, as Home Assistant hasn't
        // translated idle, returning and error into every language, else in Home Assistant's.
        return (
            translateOwn(this.language(), `state.${this.activity}`) ??
            (this.hass!.localize(`component.lawn_mower.entity_component._.state.${this.activity}`) || this.hass!.formatEntityState(mower))
        );
    }

    /** A mowing or returning mower isn't charging, whatever a lagging charging sensor says. Without a sensor, the preset's states tell. */
    private charging(): boolean {
        if (this.activity === "mowing" || this.activity === "returning") {
            return false;
        }
        return this.slotState("charging")?.state === "on" || this.chargingByState();
    }

    private chargingByState(): boolean {
        return !!this.preset?.chargingStates?.includes(this.hass?.states[this.config!.entity]?.state ?? "");
    }

    /** ", lataa" after a state or a battery, unless the state itself already says so, as Sunseeker's "Lataa" does. */
    private chargingNote(): string {
        return this.charging() && !this.chargingByState() ? `, ${this.text("common.charging")}` : "";
    }

    private batteryIcon(): string {
        const level = numberOf(this.slotState("battery"));
        if (level === null) {
            return "mdi:battery-unknown";
        }
        const step = Math.round(level / 10) * 10;
        if (this.charging()) {
            return step >= 100 ? "mdi:battery-charging-100" : `mdi:battery-charging-${Math.max(10, step)}`;
        }
        return step >= 100 ? "mdi:battery" : step < 10 ? "mdi:battery-outline" : `mdi:battery-${step}`;
    }

    private batteryColor(level: number): string {
        if (level < 15) {
            return "var(--error-color, #db4437)";
        }
        return level < 30 ? "var(--warning-color, #ffa600)" : "var(--primary-color)";
    }

    /** A slot's state with its unit, in the user's number format. */
    private format(slot: Slot): string {
        return this.hass!.formatEntityState(this.slotState(slot)!);
    }

    private name(): string {
        const device = this.device();
        return (
            this.config?.name ||
            device?.name_by_user ||
            device?.name ||
            String(this.hass?.states[this.config!.entity]?.attributes.friendly_name ?? this.config!.entity)
        );
    }

    private device() {
        const deviceId = this.hass?.entities?.[this.config!.entity]?.device_id;
        return deviceId ? this.hass?.devices?.[deviceId] : undefined;
    }

    private slotState(slot: Slot): HassEntity | undefined {
        const id = this.slots[slot];
        return id ? this.hass?.states[id] : undefined;
    }

    private slotStates(): Partial<Record<Slot, HassEntity>> {
        return Object.fromEntries(
            Object.keys(this.slots)
                .map((slot) => [slot, this.slotState(slot as Slot)])
                .filter(([, entity]) => !!entity),
        );
    }

    private moreInfo(entityId: string): void {
        this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
    }

    private timeZone(): string | undefined {
        return this.hass?.locale?.time_zone === "server" ? this.hass.config?.time_zone : undefined;
    }

    /** A text in the viewer's language, with `{name}` in it replaced, so a translation can put the value where it reads right. */
    private text(key: string, values: Record<string, string> = {}): string {
        return translate(this.language(), key).replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
    }

    /** Like text(), with markup in place of `{name}`. */
    private markup(key: string, values: Record<string, string | TemplateResult>): TemplateResult {
        const parts = translate(this.language(), key).split(/\{(\w+)\}/);
        return html`${parts.map((part, index) => (index % 2 ? (values[part] ?? `{${part}}`) : part))}`;
    }

    private language(): string {
        return this.hass?.locale?.language ?? this.hass?.language ?? browserLanguage();
    }

    static get styles(): CSSResultGroup {
        return css`
            ha-card {
                container-type: inline-size;
                padding: 14px;
                font-variant-numeric: tabular-nums;
            }

            button {
                font: inherit;
                color: inherit;
                background: none;
                border: 0;
                padding: 0;
                cursor: pointer;
                text-align: inherit;
            }

            ha-icon {
                --mdc-icon-size: 16px;
                flex: none;
            }

            .message {
                padding: 8px 2px;
                color: var(--secondary-text-color);
            }

            .info {
                min-width: 0;
            }

            .name {
                display: block;
                font-size: 17px;
                font-weight: 500;
                line-height: 1.3;
                overflow-wrap: anywhere;
            }

            .state {
                color: var(--secondary-text-color);
            }

            .state.mowing,
            .big-state.mowing {
                color: var(--success-color, #4caf50);
            }

            .state.error,
            .big-state.error {
                color: var(--error-color, #db4437);
            }

            /* The gauge layout. */
            .gauge-top {
                display: flex;
                gap: 14px;
                align-items: center;
            }

            .ring {
                --size: 92px;
                width: var(--size);
                height: var(--size);
                flex: none;
                border-radius: 50%;
                display: grid;
                place-items: center;
                background: conic-gradient(var(--ring-color) calc(var(--value) * 1%), var(--secondary-background-color) 0);
            }

            .ring > div {
                width: calc(var(--size) - 16px);
                height: calc(var(--size) - 16px);
                border-radius: 50%;
                background: var(--ha-card-background, var(--card-background-color));
                display: grid;
                place-content: center;
                text-align: center;
            }

            .ring b {
                display: block;
                font-size: 20px;
                font-weight: 500;
            }

            .ring span {
                font-size: 11px;
                color: var(--secondary-text-color);
            }

            .ring ha-icon {
                --mdc-icon-size: 32px;
                color: var(--secondary-text-color);
            }

            .lines {
                margin-top: 6px;
                font-size: 13px;
            }

            .lines div {
                display: flex;
                gap: 6px;
                align-items: flex-start;
            }

            .when {
                display: inline-block;
            }

            .whole {
                white-space: nowrap;
            }

            .lines ha-icon,
            .muted {
                color: var(--secondary-text-color);
            }

            /* The picture layout. */
            .picture-top {
                display: grid;
                grid-template-columns: 120px minmax(0, 1fr);
                gap: 12px;
                align-items: center;
            }

            .picture {
                width: 120px;
                height: 96px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Mammotion's model pictures have transparent margins of their own, so they fill a framed box. A cut-out of the
               mower's own gets the same box, with room around it. */
            .picture.model,
            .picture.framed {
                border-radius: 10px;
                overflow: hidden;
                background: radial-gradient(circle at 50% 60%, var(--divider-color), var(--secondary-background-color));
            }

            .picture.model img {
                width: 128px;
                margin-top: 8px;
            }

            /* Any other picture is shown whole, with no frame, as it may well have a background of its own. The rounded
               corners are the picture's own, and it sits in the middle of its box. */
            .picture.own img {
                max-width: 100%;
                max-height: 100%;
                border-radius: 10px;
            }

            .picture.framed img {
                max-width: 100px;
                max-height: 76px;
                border-radius: 0;
            }

            .unavailable .picture img {
                filter: grayscale(1) brightness(0.75);
            }

            /* A long state breaks where the language hyphenates it, never at any letter. */
            .big-state {
                font-size: 22px;
                font-weight: 500;
                line-height: 1.2;
                hyphens: auto;
                overflow-wrap: break-word;
            }

            .sub {
                display: flex;
                flex-wrap: wrap;
                gap: 4px 12px;
                margin-top: 4px;
                font-size: 13px;
            }

            .sub span {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            /* An upright battery is drawn 4 px inside its 16 px icon, and with its charging bolt 1 px, so the drawn battery is
               pulled into line with the texts under it, about 5 px from its number. */
            .sub ha-icon.battery {
                margin: 0 -3px 0 -4px;
            }

            .sub ha-icon.battery.charging {
                margin: 0 0 0 -1px;
            }

            .bar {
                height: 6px;
                margin-top: 8px;
                border-radius: 3px;
                overflow: hidden;
                background: var(--secondary-background-color);
            }

            .bar i {
                display: block;
                height: 100%;
                border-radius: 3px;
                background: var(--primary-color);
            }

            .bar.mowing i {
                background: var(--success-color, #4caf50);
            }

            .below {
                margin-top: 4px;
                font-size: 12px;
                color: var(--secondary-text-color);
            }

            /* The name takes the room the distance leaves, so a long one, such as a device's serial number, wraps rather than
               the distance. */
            .footer-name {
                flex: 1 1 0;
                min-width: 0;
                overflow-wrap: anywhere;
            }

            .footer {
                display: flex;
                gap: 8px;
                margin-top: 12px;
                font-size: 12px;
                color: var(--secondary-text-color);
            }

            /* Notices. */
            .chips {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 12px;
            }

            .chip {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 4px 10px;
                border: 1px solid transparent;
                border-radius: 999px;
                font-size: 12px;
                color: var(--notice);
                background: color-mix(in srgb, var(--notice) 18%, transparent);
            }

            .chip.selected {
                border-color: currentColor;
            }

            .chip.red,
            .detail.red {
                --notice: var(--error-color, #db4437);
            }

            .chip.amber,
            .detail.amber {
                --notice: var(--warning-color, #ffa600);
            }

            .chip.blue,
            .detail.blue {
                --notice: var(--info-color, #039be5);
            }

            /* An integration's error can come in steps, one per line. */
            .detail {
                display: flex;
                flex-wrap: wrap;
                align-items: baseline;
                gap: 6px 12px;
                white-space: pre-line;
                margin-top: 8px;
                padding: 9px 11px;
                border-radius: 8px;
                font-size: 13px;
                background: color-mix(in srgb, var(--notice) 15%, transparent);
                overflow-wrap: anywhere;
            }

            /* Beside a text short enough to share its line, else on a line of its own, at the right either way. */
            .dismiss {
                margin-left: auto;
                padding: 2px 10px;
                border: 1px solid currentColor;
                border-radius: 999px;
                font-size: 12px;
                color: var(--notice);
            }

            /* Buttons. */
            .buttons {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }

            .button {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                min-height: 44px;
                padding: 0 12px;
                border-radius: 10px;
                background: var(--secondary-background-color);
            }

            .button ha-icon {
                --mdc-icon-size: 20px;
            }

            .button.main {
                flex: 1;
                min-width: 0;
                background: var(--primary-color);
                color: var(--text-primary-color, #fff);
                font-weight: 500;
            }

            .button.main.pause {
                background: var(--success-color, #4caf50);
            }

            .button.icon {
                width: 46px;
                padding: 0;
            }

            .button:disabled {
                opacity: 0.35;
                cursor: default;
            }

            /* A narrow card: smaller ring and picture, so the texts keep their room, and the main button on a row of its own. */
            @container (max-width: 300px) {
                .buttons {
                    flex-wrap: wrap;
                }

                .button.main {
                    flex-basis: 100%;
                }

                .button.icon {
                    flex: 1;
                }

                .ring {
                    --size: 76px;
                }

                .ring b {
                    font-size: 17px;
                }

                .picture-top {
                    grid-template-columns: 72px minmax(0, 1fr);
                    gap: 10px;
                }

                .picture {
                    width: 72px;
                    height: 64px;
                }

                .picture.model img {
                    width: 80px;
                }

                .picture.framed img {
                    max-width: 60px;
                    max-height: 52px;
                }

                .big-state {
                    font-size: 17px;
                }
            }

            /* A very narrow card, a half of a phone's section: the ring or the picture on top, the texts below it at full width. */
            @container (max-width: 220px) {
                .gauge-top {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                }

                .picture-top {
                    grid-template-columns: minmax(0, 1fr);
                }

                /* Too narrow for the name and the distance side by side without breaking the name inside its words. */
                .footer {
                    flex-direction: column;
                    gap: 2px;
                }

                .button.main ha-icon {
                    display: none;
                }
            }
        `;
    }
}

const NOTICE_ICONS: Record<Notice["id"], string> = {
    error: "mdi:alert-circle-outline",
    positioning: "mdi:crosshairs-question",
    blade: "mdi:saw-blade",
    rain: "mdi:weather-pouring",
    update: "mdi:update",
};

/**
 * A picture's address without its token, written the same way whether it comes from the configuration or from an image's
 * src, which the browser has resolved and encoded, as a space or an ä in a file name is.
 */
function pictureAddress(url: string): string {
    try {
        const address = new URL(url, document.baseURI);
        return address.origin === location.origin ? address.pathname : `${address.origin}${address.pathname}`;
    } catch {
        return url.split(/[?#]/)[0];
    }
}

/** Whether a picture is one of Mammotion's model pictures from ha-mammotion-assets. */
function isModelPicture(url: string | null): boolean {
    return !!url?.startsWith(MAMMOTION_ASSETS);
}

/**
 * Whether a loaded picture is transparent in all four corners, as a cut-out is, read from a copy drawn at 8 by 8 pixels,
 * whose corner pixels come from near the picture's corners. A picture from another server can't be read, and counts as
 * not transparent.
 */
function hasTransparentCorners(img: HTMLImageElement): boolean {
    try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 8;
        const context = canvas.getContext("2d");
        if (!context) {
            return false;
        }
        context.drawImage(img, 0, 0, 8, 8);
        const { data } = context.getImageData(0, 0, 8, 8);
        // Clearly see-through, so a photo with rounded corners, only partly so in its corners' pixels, isn't taken for one.
        return [0, 7, 56, 63].every((pixel) => data[pixel * 4 + 3] < 128);
    } catch {
        return false;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "mower-status-card": MowerStatusCard;
    }
}
