import noUiSlider, { API as NoUiSliderAPI, PipsMode } from "nouislider";
import { FlexSliderCardConfigMngr } from "./config/flex-slider-card-config-mngr";
import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { fireEvent } from "custom-card-helpers";
import nouiCss from "nouislider/dist/nouislider.css?inline";
import { stdFlexSliderSliderCardCss } from "./css/std-flex-slider-slider-css";
import { compactFlexSliderSliderCardCss } from "./css/compact-flex-slider-slider-css";
import { FlexSliderCardFormat } from "./config/flex-slider-card-config-type";
import { FlexSliderCardValuesBarMode, FlexSliderCardValuesBarSetModeCallback, FlexSliderCardValuesBarSetValueCallback } from "./flex-slider-card-valuesbar";
import { debuglog, minutesToTime } from "./utils/utils";
import { FlexSliderCardEntityType } from "./utils/entity-management";
import { CARD_HEIGHT_BASE, INTER_CARD, COMPACT_CONTAINER_PADDING, COMPACT_TITLE_HEIGHT, STD_CONTAINER_PADDING, STD_TITLE_HEIGHT } from "./type/constants";

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
  public sliderClass!: FlexSliderCardFormat;

  @property({ type: Boolean })
  public forceHeight = false;          // reference to the card configuration

  @property({ attribute: false })
  public values: number[] = [0, 100];

  private _slider!: NoUiSliderAPI;                   // reference to the noUiSlider instance
  private _userIsUpdating: boolean = false;                 // true when user is currently dragging the slider, false otherwise
  private _isSyncing: boolean = false;                         // true when the slider is being updated programmatically, false otherwise
  private _isAdjustingHandles: boolean = false;
  private _valuesBarSetMode: FlexSliderCardValuesBarSetModeCallback | null = null;
  private _valuesBarSetValue: FlexSliderCardValuesBarSetValueCallback | null = null;

  private _emitUserUpdateStateChanged(isUserUpdating: boolean): void {
    this.dispatchEvent(new CustomEvent("user-update-state-changed", {
      detail: { isUserUpdating },
      bubbles: true,
      composed: true,
    }));
  }

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
    const tooltips = this.config.hasBubbles
      ? this.values.map((_, index) => ({
          to: (value: number) => this._sliderToBubble(value, index),
        }))
      : false;

    noUiSlider.create(this._sliderElement, {
      start: this.values,
      orientation: this.config.orientation,
      direction: this.config.direction,
      tooltips: tooltips,
      connect: this.config.connect,
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
      behaviour: 'unconstrained',
    });
    this._slider = this._sliderElement.noUiSlider;           // reference to the noUiSlider instance

    this._slider.on("start", (_values: (number | string)[], handle: number) => {
      this._onStart(handle);
    });

    this._slider.on("change", (values: (number | string)[]) => {
      void this._onChange(values);
    });

    this._slider.on("update", (values: (number | string)[], handle: number) => {
      this._onUpdate(values, handle);
    });

    this._slider.on("end", () => {
      this._onEnd();
    });
  }

  protected override updated(changedProps: Map<string, unknown>): void {
    if (!this._slider || this._userIsUpdating || this._isSyncing) return;

    if (changedProps.has("values")) {
      this._slider.set(this.values, false);
    }
  }

  protected override render() {
    const draggerClass = `${this.config.isDragOnlyBubbles ? "dragonly" : ""}`;
    const verticalLayoutClass = this.config.isVertical && this.config.verticalLayout === "mirrored"
      ? " mirrored"
      : "";

    if (this.config.isVertical) {
      let height: string;
      if (this.forceHeight || this.config.sliderVerticalHeight == null) {
        height = "100%";
      } else {
        const cardHeight = CARD_HEIGHT_BASE + (this.config.sliderVerticalHeight - 1) * (CARD_HEIGHT_BASE + INTER_CARD);
        const titleHeight = this.config.hasTitle ? (this.config.isStd ? STD_TITLE_HEIGHT : COMPACT_TITLE_HEIGHT) : 0;
        const paddingTop = this.config.hasTitle ? 0 : (this.config.isStd ? STD_CONTAINER_PADDING : COMPACT_CONTAINER_PADDING);
        const paddingBottom = this.config.hasValuesBar ? 0 : (this.config.isStd ? STD_CONTAINER_PADDING : COMPACT_CONTAINER_PADDING);
        height = `calc(${cardHeight - titleHeight - paddingTop - paddingBottom}px - var(--ha-card-border-total, 0px))`;
      }
      return html`
        <div
          class="slider-container ${this.sliderClass} vertical${verticalLayoutClass}"
          style="--height: ${height};"
        ><div class="slider ${this.sliderClass} ${draggerClass} vertical${verticalLayoutClass}"></div>
        </div>
      `;
    }

    let alignItems = "";
    let height = "";
    let padding = "";
    let marginTop = "";

    if (this.config.hasBubbles && this.config.hasTicks) {
      alignItems = "center";
      height = this.config.isStd ? "67px" : "50px";
      padding = this.config.isStd ? "0px" : "2px";
      marginTop = this.config.isStd ? "-1px" : "0px";
    } else if (this.config.hasBubbles) {
      alignItems = "flex-end";
      height = this.config.isStd ? "43px" : "32px";
      padding = this.config.isStd ? "1px" : "4px";
      marginTop = "0px";
    } else if (this.config.hasTicks) {
      alignItems = "flex-start";
      height = this.config.isStd ? "43px" : "28px";
      padding = this.config.isStd ? "0px" : "2px";
      marginTop = this.config.isStd ? "0px" : "2px";;
    } else {
      alignItems = "center";
      height = this.config.isStd ? "20px" : "14px";
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
    this._emitUserUpdateStateChanged(true);
    this._valuesBarSetMode?.(FlexSliderCardValuesBarMode.USERUPDATE, handle);
  }

  private async _onChange(values: (number | string)[]): Promise<void> {
    debuglog("slider change");

    const nextValues = values.map(Number);
    const currentValues = this.config.entities.map((entity) => entity.sliderValue);
    const changedIndexes = nextValues
      .map((value, index) => currentValues[index] === value ? -1 : index)
      .filter((index) => index !== -1);

    if (changedIndexes.length === 0) {
      this._valuesBarSetMode?.(FlexSliderCardValuesBarMode.DEFAULT);
      return;
    }

    this._isSyncing = true;
    try {
      if (this.config.handlesBehavior === "unconstrained") {
        await this._commitChangedValues(changedIndexes, nextValues);
      } else {
        await this._commitChangedValuesInOrder(currentValues, nextValues, changedIndexes);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Error occurred while updating slider values: ${String(error)}`;
      fireEvent(this, "hass-notification" as any, { message });
    } finally {
      this._isSyncing = false;
      if (this._userIsUpdating) return;
      this._valuesBarSetMode?.(FlexSliderCardValuesBarMode.DEFAULT);
    }
  }

  private _onUpdate(values: (number | string)[], handle: number): void {
    debuglog("slider update");
    const numbers: number[] = values.map(Number);

    if (!this._isAdjustingHandles) {
      const adjustedValues = this._getAdjustedHandleValues(numbers, handle);
      if (adjustedValues !== null) {
        this._isAdjustingHandles = true;
        try {
          adjustedValues.forEach((value, index) => {
            if (value !== numbers[index]) {
              this._slider.setHandle(index, value, false, false);
            }
          });
        } finally {
          this._isAdjustingHandles = false;
        }
        this._valuesBarSetValue?.(adjustedValues);
        return;
      }
    }

    this._valuesBarSetValue?.(numbers);
  }

  private _onEnd(): void {
    debuglog("slider end");
    this._userIsUpdating = false;
    this._emitUserUpdateStateChanged(false);
    if (this._isSyncing) return;
    this._valuesBarSetMode?.(FlexSliderCardValuesBarMode.DEFAULT);
  }

  /****************************************************/
  /* Private methods                                  */
  /****************************************************/

  private async _commitChangedValues(
    changedIndexes: number[],
    nextValues: number[],
  ): Promise<void> {
    for (const index of changedIndexes) {
      await this.config.entities[index].setSliderValue(nextValues[index]);
    }
  }

  private async _commitChangedValuesInOrder(
    currentValues: number[],
    nextValues: number[],
    changedIndexes: number[],
  ): Promise<void> {
    const workingValues = [...currentValues];
    const pendingIndexes = new Set(changedIndexes);

    while (pendingIndexes.size > 0) {
      let progressed = false;

      for (const index of Array.from(pendingIndexes)) {
        const leftValue = index === 0 ? Number.NEGATIVE_INFINITY : workingValues[index - 1];
        const rightValue = index === workingValues.length - 1 ? Number.POSITIVE_INFINITY : workingValues[index + 1];
        const targetValue = nextValues[index];

        if (leftValue <= targetValue && targetValue <= rightValue) {
          await this.config.entities[index].setSliderValue(targetValue);
          workingValues[index] = targetValue;
          pendingIndexes.delete(index);
          progressed = true;
        }
      }

      if (!progressed) {
        throw new Error("Unable to update entities while preserving non-decreasing handle order");
      }
    }
  }

  private _getAdjustedHandleValues(
    values: number[],
    handle: number,
  ): number[] | null {
    if (this.config.handlesBehavior === "unconstrained") {
      return null;
    }

    const nextValues = [...values];

    if (this.config.handlesBehavior === "flexible") {
      for (let index = handle + 1; index < nextValues.length; index += 1) {
        if (nextValues[index] < nextValues[index - 1]) {
          nextValues[index] = nextValues[index - 1];
        }
      }

      for (let index = handle - 1; index >= 0; index -= 1) {
        if (nextValues[index] > nextValues[index + 1]) {
          nextValues[index] = nextValues[index + 1];
        }
      }
    } else if (this.config.handlesBehavior === "fixed") {
      const leftBound = handle === 0 ? Number.NEGATIVE_INFINITY : nextValues[handle - 1];
      const rightBound = handle === nextValues.length - 1 ? Number.POSITIVE_INFINITY : nextValues[handle + 1];
      nextValues[handle] = Math.min(Math.max(nextValues[handle], leftBound), rightBound);
    }

    return nextValues;
  }

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

  private _sliderToBubble(value: number, handle: number): string {
    return this.config.entities[handle].toText(
      value,
      this.config.nbdigitsBubbles,
      this.config.unitBubbles,
      this.config.showTextBubbles,
    );
  }
  
}
