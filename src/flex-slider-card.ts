import { html, css, LitElement, unsafeCSS, nothing, PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { stdFlexSliderCardCss } from "./css/std-flex-slider-css"
import { compactFlexSliderCardCss } from "./css/compact-flex-slider-css"
import { FlexSliderCardConfigMngr } from "./config/flex-slider-card-config-mngr";
import { FlexSliderCardConfig, flexSliderCardConfigStruct } from "./config/flex-slider-card-config-type";
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
  customCards: Array<{ type: string; name: string; description: string; preview?: boolean }>;
}

(window as unknown as WindowWithCustomCards).customCards =
  (window as unknown as WindowWithCustomCards).customCards || [];
(window as unknown as WindowWithCustomCards).customCards.push({
  type: 'flex-slider-card',
  name: 'Flex Slider Card',
  description: 'Card to adjust entities with a single slider',
});

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
  @query('flex-slider-card-slider')
  private _slider!: FlexSliderCardSlider;
  @query('flex-slider-card-valuesbar')
  private _valuesBar?: FlexSliderCardValuesBar;

  private _firstUpdate: boolean = true;           // flag to indicate if it is the first update of the card
  private _config?: FlexSliderCardConfigMngr;        // reference to the card configuration
  private _dashboardType?: 'masonry' | 'sections'; // deduced from which sizing method HA calls

  static override styles = css`
    * {
      box-sizing: border-box;
    }
    ha-card {
      height: 100%;
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
    assert(config, flexSliderCardConfigStruct);
    try {
      this._config = new FlexSliderCardConfigMngr(config);
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
    const size = 1 +
      (this._config.hasTitle ? 1 : 0) +
      (this._config.hasValuesBar ? 1 : 0) +
      (this._config.hasBubbles ? 1 : 0)
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
      const size = 1 +
        (this._config.hasTitle ? 1 : 0) +
        (this._config.hasValuesBar ? 1 : 0) +
        (this._config.hasBubbles ? 1 : 0) +
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

  protected override willUpdate(changedProps: Map<string, unknown>): void {
    if (!this._config || !this.hass) {
      return;
    }

    if (this._firstUpdate || changedProps.has("hass")) {
      this._firstUpdate = false;
      this._config.update(this.hass);
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
    if (!this._config) {
      return;
    }
    if (changedProps.has("hass")) {
      this._config.entitiesSetBaseline();
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

    if (this._config.isVertical && this._config.hasBubbles !== this._config.hasTicks) {
      this.style.setProperty('--flex-slider-vertical-slider-container-width', '100%');
      this.style.setProperty(
        '--flex-slider-vertical-slider-justify-content',
        this._config.hasBubbles
          ? (this._config.verticalLayout === 'mirrored' ? 'flex-start' : 'flex-end')
          : (this._config.verticalLayout === 'mirrored' ? 'flex-end' : 'flex-start')
      );
    } else {
      this.style.removeProperty('--flex-slider-vertical-slider-container-width');
      this.style.removeProperty('--flex-slider-vertical-slider-justify-content');
    }
  }

    protected override render() {
    if (this._error) {
      return html`<ha-card><div class="card-content">${this._error}</div></ha-card>`;
    }

    if (!this._config) {
      return nothing;
    }

    if (!this._config.entitiesExist()) {
      return html`<ha-card><div class="card-content">Entities not found</div></ha-card>`;
    }

    const hasValuesBar = this._config.hasValuesBar;
    const hasTitle = this._config.hasTitle;
    const hasTicks = this._config.hasTicks;
    const name = this._config.title;
    const isStd = this._config.isStd;
    const isVertical = this._config.isVertical;
    const containerClass =
      `${isStd ? "std" : "compact"} ` +
      `${hasTitle ? "" : "no-title"} ` +
      `${hasValuesBar ? "" : "no-values"} ` +
      `${hasTicks ? "has-ticks " : ""}` +
      `${isVertical ? "vertical" : ""}`;
    const sliderClass = `${isStd ? "std" : "compact"}`;
    const minValue = this._config.entities.min.sliderValue;
    const maxValue = this._config.entities.max.sliderValue;
    const horizontalWidth = isVertical ? "" : `--flex-slider-width: ${this._config.sliderHorizontalWidth}%`;

    return html`
      <ha-card>
        <div class="container ${containerClass}">
          ${hasTitle ? html`<div class="title">${name}</div>` : nothing}
          <div class="slider-with-values" style="${horizontalWidth}">
            <div class="slider-container">
              <flex-slider-card-slider
                .config=${this._config}
                .minvalue=${minValue}
                .maxvalue=${maxValue}
                .sliderClass=${sliderClass}
                .forceHeight=${this._shallForceHeight()}
              ></flex-slider-card-slider>
            </div>
            ${hasValuesBar ? html`
                <flex-slider-card-valuesbar
                  .config=${this._config}
                  .minvalue=${minValue}
                  .maxvalue=${maxValue}
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

    if (error instanceof Error) {
      this._error = error.message;
      return;
    }

    this._error = "Unknown error " + String(error);
  }

}
