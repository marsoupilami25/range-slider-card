import noUiSlider, { API as NoUiSliderAPI, PipsMode } from "nouislider";
import { FlexSliderCardConfigMngr } from "./config/flex-slider-card-config-mngr";
import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import nouiCss from "nouislider/dist/nouislider.css?inline";
import { stdFlexSliderSliderCardCss } from "./css/std-flex-slider-slider-css";
import { compactFlexSliderSliderCardCss } from "./css/compact-flex-slider-slider-css";
import { FlexSliderCardFormat } from "./config/flex-slider-card-config-type";
import { FlexSliderCardValuesBarMode, FlexSliderCardValuesBarSetModeCallback, FlexSliderCardValuesBarSetValueCallback } from "./flex-slider-card-valuesbar";
import { debuglog, minutesToTime } from "./utils/utils";
import { FlexSliderCardEntityType } from "./utils/entity-management";


// Extension de HTMLElement pour typer noUiSlider
export interface NoUiSliderElement extends HTMLElement {
  noUiSlider: NoUiSliderAPI;
}

@customElement("flex-slider-card-slider")
export class FlexSliderCardSlider extends LitElement {

  /****************************************************/
  /* private parameters                               */
  /****************************************************/

  @property({ attribute: false })
  public config!: FlexSliderCardConfigMngr;          // reference to the card configuration

  @property({ attribute: false })
  public sliderClass!: FlexSliderCardFormat;          // reference to the card configuration

  @property({ type: Number })
  public minvalue = 0;

  @property({ type: Number })
  public maxvalue = 100;

  private _slider!: NoUiSliderAPI;                   // reference to the noUiSlider instance
  private _userIsUpdating: boolean = false;                 // true when user is currently dragging the slider, false otherwise
  private _isSyncing: boolean = false;                         // true when the slider is being updated programmatically, false otherwise
  private _valuesBarSetMode: FlexSliderCardValuesBarSetModeCallback | null = null;
  private _valuesBarSetValue: FlexSliderCardValuesBarSetValueCallback | null = null;

  static override styles = css`
    ${unsafeCSS(nouiCss)}
    
    :host {
      display: block;
      width: 100%;
    }
    
    * {
      box-sizing: border-box;
    }
    
    .slider {
      width: 100%;
    }
    
    /* noUiSlider overrides */

    ${unsafeCSS(stdFlexSliderSliderCardCss)}
    ${unsafeCSS(compactFlexSliderSliderCardCss)}
    
  `;

  @query(".slider")
  private accessor _sliderElement!: NoUiSliderElement;

  /****************************************************/
  /* Public methods - Lit Element                     */
  /****************************************************/

  protected override firstUpdated(): void {
    if (!this.config) {
      throw new Error("Config not initialized");
    }

    const pipsValues = Array.from({ length: this.config.majorticks }, (_, i) => i * 100 / (this.config.majorticks - 1));
    const density = 100 / ((this.config.majorticks - 1) * (this.config.minorticks + 1));

    noUiSlider.create(this._sliderElement, {
      start: [this.minvalue, this.maxvalue],
      direction: this.config.direction,
      tooltips: [ 
        this.config.hasBubbles ? { to: (value) => this._sliderToBubbleMin(value) } : false,
        this.config.hasBubbles ? { to: (value) => this._sliderToBubbleMax(value) } : false,
      ],
      connect: true,
      range: {
        'min': this.config.min,
        'max': this.config.max
      },
      step: this.config.step,
      pips: this.config.hasTicks ? {
        mode: PipsMode.Positions,
        values: pipsValues,
        density: density,
        format: { to: (value) => this._sliderToPips(value) },
      } : undefined,
    });
    this._slider = this._sliderElement.noUiSlider;           // reference to the noUiSlider instance

    this._slider.on("start", (values: (number | string)[], handle: number) => {
      this._onStart(handle);
    });

    this._slider.on("change", (values: (number | string)[]) => {
      void this._onChange(values);
    });

    this._slider.on("update", (values: (number | string)[]) => {
      this._onUpdate(values);
    });

    this._slider.on("end", () => {
      this._onEnd();
    });
  }

  protected override updated(changedProps: Map<string, unknown>): void {
    if (!this._slider || this._userIsUpdating || this._isSyncing) return;

    if (changedProps.has("minvalue") || changedProps.has("maxvalue")) {
      this._slider.set([this.minvalue, this.maxvalue], false);
    }
  }

  protected override render() {
    const draggerClass = `${this.config.isDragOnlyBubbles ? "dragonly" : ""}`;
    
    let alignItems = "";
    let height = "";
    let padding = "";
    let marginTop = "";

    if (this.config.hasBubbles && this.config.hasTicks) {
      alignItems = "center";
      height = this.config.isStd ? "67px" : "49px";
      padding = this.config.isStd ? "0px" : "2px";
      marginTop = this.config.isStd ? "-1px" : "0px";
    } else if (this.config.hasBubbles) {
      alignItems = "flex-end";
      height = this.config.isStd ? "42px" : "30px";
      padding = this.config.isStd ? "0px" : "2px";
      marginTop = "0px";
    } else if (this.config.hasTicks) {
      alignItems = "flex-start";
      height = this.config.isStd ? "42px" : "28px";
      padding = this.config.isStd ? "0px" : "2px";
      marginTop = "0px";
    } else {
      alignItems = "center";
      height = this.config.isStd ? "21px" : "14px";
      padding = "0px";
      marginTop = "0px";
    }
    return html`
      <div
        class="slider-container ${this.sliderClass}" 
        style="
          --align-items: ${alignItems};
          --height: ${height};
          --padding: ${padding};
          --margin-top: ${marginTop};
        "
      > <div class="slider ${this.sliderClass} ${draggerClass}"></div>
      </div>
    `;
  }

  /****************************************************/
  /* Methods                                          */
  /****************************************************/
  public isUserUpdating(): boolean {
    return this._userIsUpdating;
  }

  public setCallbacks(setModeCallback: FlexSliderCardValuesBarSetModeCallback,
    setValueCallback: FlexSliderCardValuesBarSetValueCallback) {
    this._valuesBarSetMode = setModeCallback;
    this._valuesBarSetValue = setValueCallback;
  }

  /****************************************************/
  /* CallBacks                                        */
  /****************************************************/

  private _onStart(handle: number): void {
    debuglog(`slider start ${handle}`);
    this._userIsUpdating = true;
    this._valuesBarSetMode?.(FlexSliderCardValuesBarMode.USERUPDATE, handle);
  }

  private async _onChange(values: (number | string)[]): Promise<void> {
    debuglog("slider change");

    // noUiSlider renvoie souvent des strings → conversion recommandée
    const min = Number(values[0]);
    const max = Number(values[1]);

    this._isSyncing = true;
    try {
      await Promise.all([
        this.config.entities.min.setSliderValue(min),
        this.config.entities.max.setSliderValue(max)
      ]);
    } catch (error) {
      console.error("Error occurred while updating slider values:", error);
    } finally {
      this._isSyncing = false;
      if (this._userIsUpdating) return;
      this._valuesBarSetMode?.(FlexSliderCardValuesBarMode.DEFAULT);
    }
  }

  private _onUpdate(values: (number | string)[]): void {
    debuglog("slider update");
    const numbers: number[] = values.map(Number);
    this._valuesBarSetValue?.(numbers);
  }

  private _onEnd(): void {
    debuglog("slider end");
    this._userIsUpdating = false;
    if (this._isSyncing) return;
    this._valuesBarSetMode?.(FlexSliderCardValuesBarMode.DEFAULT);
  }

  /****************************************************/
  /* Private methods                                  */
  /****************************************************/

  private _sliderToPips(value: number): string {
    let valueToDisplay: string = "";

    if (this.config?.entitytype === FlexSliderCardEntityType.NUMBER) {
      valueToDisplay = Number(value).toFixed(Number(this.config.nbdigitsTicks));
    } else if (this.config?.entitytype === FlexSliderCardEntityType.TIME) {
      valueToDisplay = minutesToTime(value);
    } else {
      throw new Error("Unsupported entity type");
    }

    return valueToDisplay;
  }

  private _sliderToBubbleMin(value: number): string {
    let valueToDisplay: string = "";

    if (this.config?.entitytype === FlexSliderCardEntityType.NUMBER) {
      valueToDisplay = Number(value).toFixed(Number(this.config.nbdigitsBubbles));
    } else if (this.config?.entitytype === FlexSliderCardEntityType.TIME) {
      valueToDisplay = minutesToTime(value);
    } else {
      throw new Error("Unsupported entity type");
    }

    valueToDisplay = this.config.mintextBubbles + valueToDisplay + this.config.unitBubbles;

    return valueToDisplay;
  }

  private _sliderToBubbleMax(value: number): string {
    let valueToDisplay: string = "";

    if (this.config?.entitytype === FlexSliderCardEntityType.NUMBER) {
      valueToDisplay = Number(value).toFixed(Number(this.config.nbdigitsBubbles));
    } else if (this.config?.entitytype === FlexSliderCardEntityType.TIME) {
      valueToDisplay = minutesToTime(value);
    } else {
      throw new Error("Unsupported entity type");
    }

    valueToDisplay = this.config.maxtextBubbles + valueToDisplay + this.config.unitBubbles;

    return valueToDisplay;
  }
  
}
