import { debuglog } from "./utils/utils";
import { FlexSliderCardConfigMngr } from "./config/flex-slider-card-config-mngr";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

export enum FlexSliderCardValuesBarMode {
  DEFAULT = "default",
  USERUPDATE = "userupdate"
}

export type FlexSliderCardValuesBarSetModeCallback = (mode: FlexSliderCardValuesBarMode, handle?: number) => void;
export type FlexSliderCardValuesBarSetValueCallback = (values: number[]) => void;

@customElement("flex-slider-card-valuesbar")
export class FlexSliderCardValuesBar extends LitElement {

  /****************************************************/
  /* private parameters                               */
  /****************************************************/

  @property({ attribute: false }) 
  public config?: FlexSliderCardConfigMngr;
  @property({ attribute: false })
  public values: number[] = [0, 100];
  @property({ type: Boolean, reflect: true })
  public inactive = false;

  private _mode: FlexSliderCardValuesBarMode = FlexSliderCardValuesBarMode.DEFAULT;   // mode of the values bar, either "default" or "userupdate"
  private _handle: number | null = null;                                                      // index of the handle currently being updated by the user, null if no handle is being updated
  private _userModifiedValue: number | null = null;                                               // value currently being updated by the user, null if no value is being updated

  static override styles = css`
    * {
      box-sizing: border-box;
    }
    .valuesbar {
      display: flex;
      align-items: flex-start;
      width: 100%;
      color: var(--primary-text-color);
      font-size: var(--flex-slider-card-barvalues-font-size);
      /* outline: 1px solid green; /* Debugging border */
    }
    .valuesbar.large-text {
      font-size: calc(var(--flex-slider-card-barvalues-font-size) + var(--flex-slider-card-barvalues-font-size));
    }
    .valuesbar.reference {
      color: var(--secondary-text-color);
    }
    .valuesbar.single-handle {
      justify-content: center;
    }
    .valuesbar.multi-handle {
      justify-content: space-between;
    }
    .editing {
      color: var(--primary-color);
      font-style: italic;
    }
    :host([inactive]) .valuesbar,
    :host([inactive]) .valuesbar.reference,
    :host([inactive]) .editing {
      color: var(--disabled-text-color);
    }
  `;

  /****************************************************/
  /* Public methods - Lit Element                     */
  /****************************************************/

  protected override render() {
    debuglog("rendering values bar");
    
    if (!this.config || !this.config.entitiesExist()) {
      return nothing;
    }

    if (!this.config.hasValuesBar && !this.config.hasReferenceValuesBar) {
      return nothing;
    }

    if (this.config.hasReferenceValuesBar) {
      const valuesBarClass = `valuesbar single-handle reference${this.config.hasReferenceValuesBarTextLarge ? " large-text" : ""}`;
      return html`
        <div class=${valuesBarClass}>
          <span>${this._getReferenceValue()}</span>
        </div>
      `;
    }

    const handlesToDisplay = Array.from(
      { length: this.config.entityCount },
      (_, index) => index,
    );

    if (this.config.direction === "rtl") {
      handlesToDisplay.reverse();
    }

    const valuesBarClass = this.config.entityCount <= 1
      ? "valuesbar single-handle"
      : "valuesbar multi-handle";

    return html`
      <div class=${valuesBarClass}>
        ${handlesToDisplay.map((handle) => html`
          <span>
            <span class=${this._isEditing(handle) ? "editing" : ""}>
              ${this._getHandleValue(handle)}
            </span>
          </span>
        `)}
      </div>
    `;
    
  }

  /****************************************************/
  /* Public methods - Values Bar                      */
  /****************************************************/

  public setMode: FlexSliderCardValuesBarSetModeCallback = (mode, handle) => {
    this._mode = mode;
    this._handle = handle !== undefined ? handle : null;
    if (mode === FlexSliderCardValuesBarMode.USERUPDATE && handle === undefined) {
      throw new Error("Handle must be provided when mode is 'userupdate'");
    }
    if (mode === FlexSliderCardValuesBarMode.DEFAULT) {
      this._handle = null;
      this._userModifiedValue = null;
    }
    this.requestUpdate();
  };

  public setValue: FlexSliderCardValuesBarSetValueCallback = (values) => {
    if (this._mode !== FlexSliderCardValuesBarMode.USERUPDATE) {
      return;
    }
    if (this._handle != undefined) {
      this._userModifiedValue = values[this._handle];
    }
    this.requestUpdate();
  };

  /****************************************************/
  /* Private methods - Values Bar                     */
  /****************************************************/

  private _isEditing(handle: number): boolean {
    return (
      this._mode === FlexSliderCardValuesBarMode.USERUPDATE &&
      this._handle === handle
    );
  }
  private _getHandleValue(handle: number): string {
    if (!this.config) {
      throw new Error("Config not initialized");
    }

    if (this._mode === FlexSliderCardValuesBarMode.USERUPDATE &&
      this._userModifiedValue != undefined &&
      this._handle === handle) {
      return this.config.entities[handle].toText(
        this._userModifiedValue,
        this.config.nbdigitsValuesBar,
        this.config.unitValuesBar,
        this.config.showTextValuesBar,
      );
    }
    return this.config.entities[handle].toText(
      this.values[handle],
      this.config.nbdigitsValuesBar,
      this.config.unitValuesBar,
      this.config.showTextValuesBar,
    );
  }

  private _getReferenceValue(): string {
    if (!this.config) {
      throw new Error("Config not initialized");
    }

    return this.config.referenceEntity.toText(
      this.config.referenceEntity.sliderValue,
      this.config.nbdigitsValuesBar,
      this.config.referenceUnit,
      true,
    );
  }

}
