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

  private _mode: FlexSliderCardValuesBarMode = FlexSliderCardValuesBarMode.DEFAULT;   // mode of the values bar, either "default" or "userupdate"
  private _handle: number | null = null;                                                      // index of the handle currently being updated by the user, null if no handle is being updated
  private _userModifiedValue: number | null = null;                                               // value currently being updated by the user, null if no value is being updated

  static override styles = css`
    * {
      box-sizing: border-box;
    }
    .valuesbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
      color: var(--primary-text-color);
      font-size: var(--flex-slider-card-barvalues-font-size);
      /* outline: 1px solid green; /* Debugging border */
    }
    .editing {
      color: var(--primary-color);
      font-style: italic;
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

    if (!this.config.hasValuesBar) {
      return nothing;
    }

    const handlesToDisplay = this.config.entityCount <= 1
      ? [0]
      : this.config.direction === "ltr"
        ? [0, this.config.entityCount - 1]
        : [this.config.entityCount - 1, 0];

    return html`
      <div class="valuesbar">
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
      );
    }
    return this.config.entities[handle].toText(
      this.values[handle],
      this.config.nbdigitsValuesBar,
      this.config.unitValuesBar,
    );
  }

}
