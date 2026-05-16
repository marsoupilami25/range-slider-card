import { html, css, LitElement, unsafeCSS, nothing, PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { stdFlexSliderCardCss } from "./css/std-flex-slider-css"
import { compactFlexSliderCardCss } from "./css/compact-flex-slider-css"
import { FlexSliderCardConfigMngr } from "./config/flex-slider-card-config-mngr";
import { FlexSliderCardConfig, flexSliderCardConfigStruct } from "./config/flex-slider-card-config-type";
import { checkConditionsMet } from "./conditional/flex-slider-card-validate-condition";
import { debuglog } from "./utils/utils";
import { HomeAssistant, LovelaceCard, LovelaceCardEditor } from "custom-card-helpers";
import "./flex-slider-card-valuesbar";
import "./flex-slider-card-slider";
import { FlexSliderCardValuesBar } from "./flex-slider-card-valuesbar";
import { FlexSliderCardSlider } from "./flex-slider-card-slider";
import { flexSliderCardConfigStub } from "./config/flex-slider-card-config-stub";
import { assert } from "superstruct";
import { getVersion } from "./utils/version";
import { CARD_HEIGHT_BASE, INTER_CARD } from "./type/constants";

// Styled console banner so your card is easy to spot in the browser console.
// Stays visible in production — useful for version-mismatch debugging in HA.
console.info(
  `%c  FLEX-SLIDER-CARD %c  v${getVersion()}  `,
  'color: black; font-weight: bold; background: violet',
  'color: violet; font-weight: bold',
);

// Registering with window.customCards makes your card appear in the Lovelace
// "Add Card" UI picker with a name and description. This array is shared by all
// custom cards on the page, so we guard with `|| []` before pushing.
interface WindowWithCustomCards extends Window {
  customCards?: Array<{ type: string; name: string; description: string; preview?: boolean }>;
}

const windowWithCustomCards = window as unknown as WindowWithCustomCards;
windowWithCustomCards.customCards ??= [];
if (!windowWithCustomCards.customCards.some((card) => card.type === "flex-slider-card")) {
  windowWithCustomCards.customCards.push({
  type: 'flex-slider-card',
  name: 'Flex Slider Card',
  description: 'Card to adjust entities with a single slider',
  });
}

type GridOptions =
  {
    rows?: number;
    min_rows?: number;
    max_rows?: number;
    columns?: number;
    min_columns?: number;
    max_columns?: number;
  };

@customElement("flex-slider-card")
export class FlexSliderCard extends LitElement implements LovelaceCard {

  /****************************************************/
  /* private parameters                               */
  /****************************************************/

  @property({ attribute: false })
  public hass!: HomeAssistant;
  @state()
  private _error?: string;
  @state()
  private _runtimeError?: string;
  @query('flex-slider-card-slider')
  private _slider!: FlexSliderCardSlider;
  @query('flex-slider-card-valuesbar')
  private _valuesBar?: FlexSliderCardValuesBar;

  private _firstUpdate: boolean = true;           // flag to indicate if it is the first update of the card
  private _config?: FlexSliderCardConfigMngr;        // reference to the card configuration
  private _dashboardType?: 'masonry' | 'sections'; // deduced from which sizing method HA calls
  private _hasDeferredEntityUpdate: boolean = false;
  private _lastAdaptiveStateConditionResult?: boolean;

  static override styles = css`
    * {
      box-sizing: border-box;
    }
    ha-card {
      height: 100%;
      position: relative;
    }
    .adaptive-state-led {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1px solid var(--divider-color);
      background: var(--disabled-text-color);
      box-shadow: 0 0 0 1px var(--card-background-color, var(--ha-card-background));
      pointer-events: none;
      z-index: 1;
    }
    .adaptive-state-led.is-on {
      border-color: var(--success-color);
      background: var(--success-color);
      box-shadow:
        0 0 0 1px var(--card-background-color, var(--ha-card-background)),
        0 0 8px var(--success-color);
    }
    .adaptive-state-led.is-off {
      opacity: 0.7;
    }
    ${unsafeCSS(stdFlexSliderCardCss)}
    ${unsafeCSS(compactFlexSliderCardCss)}
  `;

  /****************************************************/
  /* Public methods - Config Management               */
  /****************************************************/

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./config/flex-slider-card-config-editor");
    return document.createElement("flex-slider-card-config-editor") as LovelaceCardEditor;
  }

  public static getStubConfig(): FlexSliderCardConfig {
    return flexSliderCardConfigStub;
  }

  public setConfig(config: FlexSliderCardConfig): void {
    debuglog("setConfig");
    this._runtimeError = undefined;
    try {
      assert(config, flexSliderCardConfigStruct);
      this._config = new FlexSliderCardConfigMngr(config);
      this._lastAdaptiveStateConditionResult = undefined;
      this._error = undefined;
      if (this._config.isStd) {
        this.toggleAttribute("std", true);
        this.toggleAttribute("compact", false);
      } else if (this._config.isCompact) {
        this.toggleAttribute("std", false);
        this.toggleAttribute("compact", true);
      } else {
        throw new Error("Invalid format in setConfig");
      }
    } catch (error) {
      this._setError(error);
    }
  }



  /****************************************************/
  /* Public methods - Home Assistant                  */
  /****************************************************/

  constructor() {
    super();
    debuglog("constructor");
  }

  public connectedCallback(): void {
    super.connectedCallback();
    debuglog("connectedCallback");
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._initPrivateDisplayData();
    this._config?.reset();
    debuglog("disconnectedCallback");
  }

  public getCardSize(): number | Promise<number> {
    debuglog("getCardSize");
    this._dashboardType = 'masonry';
    if (!this._config) {
      return 1;
    }
    if (this._config.isVertical) {
      return this._config.sliderVerticalHeight ?? this._config.sliderVerticalHeightDefault;
    }
    const hasReferenceBubble = this._config.hasReferenceBubble;
    const valuesBarSize = this._getValuesBarSize();
    const size = 1 +
      (this._config.hasTitle ? 1 : 0) +
      valuesBarSize +
      ((this._config.hasBubbles || hasReferenceBubble) ? 1 : 0)
      + (this._config.hasTicks ? 1 : 0);

    if (this._config.isStd) {
      return size;
    } else if (this._config.isCompact) {
      return Math.round(size * 2 / 3);
    } else {
      throw new Error("Invalid format in getCardSize");
    }
  }

  public getGridOptions(): GridOptions {
    debuglog("getGridOptions");
    this._dashboardType = 'sections';
    if (!this._config) {
      return {};
    }

    if (this._config.isVertical) {
      if (this._shallForceHeight() || this._config.sliderVerticalHeight == null) {
        return {
          rows: 2,
          min_rows: this._config.sliderVerticalHeightDefault,
          max_columns: 12,
          min_columns: 1,
        };
      } else {
        const vh = this._config.sliderVerticalHeight;
        return {
          rows: vh,
          min_rows: vh,
          max_columns: 12,
          min_columns: 1,
        };
      }
    } else {
      const hasReferenceBubble = this._config.hasReferenceBubble;
      const valuesBarSize = this._getValuesBarSize();
      const size = 1 +
        (this._config.hasTitle ? 1 : 0) +
        valuesBarSize +
        ((this._config.hasBubbles || hasReferenceBubble) ? 1 : 0) +
        (this._config.hasTicks ? 1 : 0);

      if (this._config.isStd) {
        return {
          min_rows: Math.round(size / 2),
          min_columns: 6,
          max_columns: 12
        };
      } else if (this._config.isCompact) {
        return {
          min_rows: Math.round(size / 2.5),
          min_columns: 2,
          max_columns: 9
        };
      } else {
        throw new Error("Invalid format in getGridOptions");
      }
    }
  }

  /****************************************************/
  /* Public methods - Lit Element                     */
  /****************************************************/

  protected override shouldUpdate(changedProps: Map<string, unknown>): boolean {
    if (!this._config || 
      !this.hass || 
      !changedProps.has("hass")) { // if change does not come from hass change, we consider it is not an update triggered by HA and we do not check entities update to avoid blocking the update in case of error in the entities management
      return true;
    }

    try {
      this._config.update(this.hass);
      this._runtimeError = undefined;
    } catch (error) {
      this._runtimeError = this._getErrorMessage(error);
      return true;
    }

    const adaptiveStateConditionResult = this._getAdaptiveStateConditionResult();
    const adaptiveStateConditionChanged =
      adaptiveStateConditionResult !== this._lastAdaptiveStateConditionResult;
    this._lastAdaptiveStateConditionResult = adaptiveStateConditionResult;

    if (!this._config.entitiesExist()) {
      return true;
    }

    if (adaptiveStateConditionChanged) {
      return true;
    }

    if (this._firstUpdate || !this._config.entitiesIsUpdated()) {
      return this._firstUpdate;
    }

    if (this._slider?.isUserUpdating()) {
      this._hasDeferredEntityUpdate = true;
      return false;
    }

    return true;
  }

  protected override willUpdate(changedProps: Map<string, unknown>): void {
    if (changedProps.has("hass")) {
      this._firstUpdate = false;
    }
  }

  protected override firstUpdated(_changedProperties: PropertyValues): void {
    if (!this._config) {
      return;
    }
    if (this._config.hasValuesBar) {
      this._slider.setCallbacks(this._valuesBar!.setMode, this._valuesBar!.setValue);
    }
    this._applyCardMod();
  }

  protected override updated(changedProps: Map<string, unknown>): void {
    if (!this._config || this._error || this._runtimeError) {
      return;
    }

    const hasRenderedEntityUpdate =
      (changedProps.has("hass") || this._hasDeferredEntityUpdate) &&
      this._config.entitiesExist() &&
      !this._slider?.isUserUpdating();

    if (hasRenderedEntityUpdate) {
      this._config.entitiesSetBaseline();
      this._hasDeferredEntityUpdate = false;
    }

    const haCard = this.shadowRoot?.querySelector('ha-card');
    const borderHeight = haCard
      ? parseFloat(getComputedStyle(haCard).borderTopWidth) +
        parseFloat(getComputedStyle(haCard).borderBottomWidth)
      : 0;
    this.style.setProperty('--ha-card-border-total', `${borderHeight}px`);

    if (this._config.isVertical && this._shallForceHeight()) {
      const vh = this._config.sliderVerticalHeight ?? this._config.sliderVerticalHeightDefault;
      this.style.setProperty('--flex-slider-height', `${CARD_HEIGHT_BASE + (vh - 1) * (CARD_HEIGHT_BASE + INTER_CARD)}px`);
    } else {
      this.style.removeProperty('--flex-slider-height');
    }

  }

  protected override render() {
    const errorMessage = this._error ?? this._runtimeError;
    if (errorMessage) {
      return html`<ha-card><div class="card-content">${errorMessage}</div></ha-card>`;
    }

    if (!this._config) {
      return nothing;
    }

    if (!this._config.entitiesExist()) {
      return html`<ha-card><div class="card-content">Entities not found</div></ha-card>`;
    }

    const hasValuesBar = this._config.hasValuesBar || this._config.hasReferenceValuesBar;
    const hasTitle = this._config.hasTitle;
    const hasBubbles = this._config.hasBubbles;
    const hasReferenceBubble = this._config.hasReferenceBubble;
    const hasTicks = this._config.hasTicks;
    const name = this._config.title;
    const isStd = this._config.isStd;
    const isVertical = this._config.isVertical;
    const adaptiveStateConditionResult = this._getAdaptiveStateConditionResult();
    const reservesBubbleSpace = hasBubbles || hasReferenceBubble;
    const containerClass =
      `${isStd ? "std" : "compact"} ` +
      `${hasTitle ? "" : "no-title"} ` +
      `${hasValuesBar ? "" : "no-values"} ` +
      `${reservesBubbleSpace ? "has-bubbles " : ""}` +
      `${hasTicks ? "has-ticks " : ""}` +
      `${isVertical ? "vertical" : ""}`;
    const sliderClass = `${isStd ? "std" : "compact"}`;
    const values = this._config.hasReference
      ? [
          ...this._config.entities.map((entity) => entity.sliderValue),
          this._config.max,
          this._config.referenceEntity.sliderValue,
        ]
      : this._config.entities.map((entity) => entity.sliderValue);
    const horizontalWidth = isVertical ? "" : `--flex-slider-width: ${this._config.sliderHorizontalWidth}%`;
    const verticalSliderContainerStyle =
      isVertical && reservesBubbleSpace !== hasTicks
        ? `width: 100%; justify-content: ${
            reservesBubbleSpace
              ? (this._config.verticalLayout === 'mirrored' ? 'flex-start' : 'flex-end')
              : (this._config.verticalLayout === 'mirrored' ? 'flex-end' : 'flex-start')
          };`
        : "";

    return html`
      <ha-card>
        ${this._config.isAdaptative
          ? this._renderAdaptiveStateLed(adaptiveStateConditionResult === true)
          : nothing}
        <div class="container ${containerClass}">
          ${hasTitle ? html`<div class="title">${name}</div>` : nothing}
          <div class="slider-with-values" style="${horizontalWidth}">
            <div class="slider-container" style="${verticalSliderContainerStyle}">
              <flex-slider-card-slider
                .config=${this._config}
                .values=${values}
                .sliderClass=${sliderClass}
                .forceHeight=${this._shallForceHeight()}
                @user-update-state-changed=${this._handleUserUpdateStateChanged}
              ></flex-slider-card-slider>
            </div>
            ${hasValuesBar ? html`
                <flex-slider-card-valuesbar
                  .config=${this._config}
                  .values=${values}
                ></flex-slider-card-valuesbar>
              ` : nothing}
          </div>
        </div>
      </ha-card>
    `;
  }

  /****************************************************/
  /* Private methods                                  */
  /****************************************************/

  private _initPrivateDisplayData(): void {                           //parameters initialized by the constructor or when the card is disconnected
    this._firstUpdate = true;                                 // flag to indicate if it is the first update of the card
    this._dashboardType = undefined;
    this._hasDeferredEntityUpdate = false;
    this._runtimeError = undefined;
    this._lastAdaptiveStateConditionResult = undefined;
  }

  private _handleUserUpdateStateChanged(event: CustomEvent<{ isUserUpdating: boolean }>): void {
    if (!event.detail.isUserUpdating && this._hasDeferredEntityUpdate) {
      this.requestUpdate();
    }
  }

  private _renderAdaptiveStateLed(isOn: boolean) {
    return html`
      <span
        class="adaptive-state-led ${isOn ? "is-on" : "is-off"}"
        title=${isOn ? "Adaptive state condition is true" : "Adaptive state condition is false"}
        aria-hidden="true"
      ></span>
    `;
  }

  private _getAdaptiveStateConditionResult(): boolean | undefined {
    if (!this._config?.isAdaptative || !this.hass) {
      return undefined;
    }

    return checkConditionsMet(
      this._config.adaptiveStateConditions,
      this.hass,
      { entity_id: this._config.entities[0]?.entityId },
    );
  }

  private _getValuesBarSize(): number {
    if (!this._config?.hasValuesBar && !this._config?.hasReferenceValuesBar) {
      return 0;
    }

    return this._config.hasReferenceValuesBarTextLarge ? 2 : 1;
  }

  private _applyCardMod(): void {
    const config = this._config;

    if (!config?.config.card_mod) return;

    customElements.whenDefined("card-mod").then((cardMod: any) => {
      cardMod.applyToElement(
        this,
        "card",
        config.config.card_mod,
        { config },
        true,
        `type-${this.localName}`
      );
    });
  }

  private _shallForceHeight(): boolean {
    if (!this._config) {
      throw new Error("Invalid config in _shallForceHeight");
    }
    debuglog(`_shallForceHeight: dashboardType="${this._dashboardType}"`);
    const needsForced =
      this._config.isVertical && (
        this._dashboardType === undefined ||  // dashboard type is unknown in masonry editor
        this._dashboardType === 'masonry' ||
        ( this._dashboardType === 'sections' && 
          ( this._config.gridRows === null ||
            typeof this._config.gridRows === 'string'
          )
        )
      );
    return needsForced;
  }

  /****************************************************/
  /* Error Management                                 */
  /****************************************************/

  private _setError(error: unknown): void {
    debuglog("ERROR");
    this._error = this._getErrorMessage(error);
  }

  private _getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return "Unknown error " + String(error);
  }

}
