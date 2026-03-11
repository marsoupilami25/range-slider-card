import noUiSlider from "nouislider";
import { stdFlexSliderCardCss } from "./std-flex-slider-css.js"
import { compactFlexSliderCardCss } from "./compact-flex-slider-css.js"
import { FlexSliderCardConfig } from "./flex-slider-card-config.js";
import { minutesToTime } from "./utils.js";
import { debuglog } from "./utils.js";
import { FlexSliderCardEntity } from "./flex-slider-card-entity.js";

export class FlexSliderCard extends HTMLElement {
  
  /****************************************************/
  /* Public methods                                   */
  /****************************************************/

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initPrivateConfig();
    this._toDisconnectedState();
    debuglog("constructor");
  }
  
  setConfig(config) {
    debuglog("setConfig");
    try {
      this._config = new FlexSliderCardConfig(config);
    } catch (error) {
      this._toErrorState(error);
    }
  }
  
  connectedCallback() {
    debuglog("connectedCallback");
    this._toConnectedState();
  }
  
  disconnectedCallback() {
    debuglog("disconnectedCallback");
    this._toDisconnectedState();
  }
  
  set hass(hass) {
    debuglog("hass");
    this._hass = hass;
    if (this._state == FlexSliderCard._State.CONNECTED && this._config) {
      this._config.update(hass);
      this._init();
    }
    if (this._state == FlexSliderCard._State.OPER) {
      this._config.update(hass);
      this._updateValuesDisplay();
    }
  }

  getCardSize() {
    if (this._config.isStd()) {
      return 2;
    } else if (this._config.isCompact()) {
      return 1;
    } else {
          throw new Error("Invalid format in getCardSize");
    }
  }

  getGridOptions() {
    if (this._config.isStd()) {
      if (this._config.hasTitle() && this._config.hasValuesBar()) {
        return {
          rows: 2,
          min_rows: 2,
          min_columns: 6,
          max_columns: 12
        };
      } else {
        return {
          rows: 1,
          min_rows: 1,
          min_columns: 6,
          max_columns: 12
        };
      }
    } else if (this._config.isCompact()) {
      return {
        min_rows: 1,
        min_columns: 2,
        max_columns: 9
      };
    } else {
      throw new Error("Invalid format in getGridOptions");
    }
  }

  /****************************************************/
  /* Private parameters                               */
  /****************************************************/

  _initPrivateConfig() {        // parameters initialized by constructor
    this._config = null;         // user configuration object
  }
  
  _initPrivateDisplayData() {                           //parameters initialized by the constructor or when the card is disconnected
    debuglog("DISCONNECTED");
    this._userIsUpdating = false;                       //true when user is currently dragging the slider, false otherwise
    this._slider = null;                                // reference to the noUiSlider instance
    this._updateValuesDisplayInProgress = false;        // true when _updateValuesDisplay is currently running, false otherwise
    this._updateValuesDisplayRequestPending = false;    // true if a call to _updateValuesDisplay was requested while it was already running, false otherwise
    this._sliderElement = null;                         // reference to the DOM element in which the slider is created
    this._lastmin = null;                               // last value of entity_min for which the slider was updated. Used to avoid updating the slider when not necessary
    this._lastmax = null;                               // last value of entity_max for which the slider was updated. Used to avoid updating the slider when not necessary   
  }

  /****************************************************/
  /* Utilities                                        */
  /****************************************************/

  _debuglog(text) {
    if (this._activeDebug) console.log(text);
  }

  /****************************************************/
  /* State Management                                 */
  /****************************************************/

  static _State = Object.freeze({
    DISCONNECTED: 0,
    CONNECTED: 1,
    INIT: 2,
    OPER: 3,
    ERROR: 4
  });
  
  _toDisconnectedState() {
    if (this._slider) {
      this._slider.destroy();
    }
    this._initPrivateDisplayData();
    this._state = FlexSliderCard._State.DISCONNECTED;   // current state of the card is DISCONNECTED
  }

  _toConnectedState() {
    if (this._state == FlexSliderCard._State.DISCONNECTED) {
      this._state = FlexSliderCard._State.CONNECTED;
      debuglog("CONNECTED");
    } else {
      debuglog("Unexpected state when connecting: "+this._state);
      throw new Error("Unexpected state when connecting: "+this._state);
    }
  }

  _toErrorState(error) {
    this._state = FlexSliderCard._State.ERROR;
    debuglog("ERROR");
    throw new Error(error.message);
  } 

  /****************************************************/
  /* State Management                                 */
  /****************************************************/

  _init() {
    this._state = FlexSliderCard._State.INIT;
    debuglog("INIT");
    if (this._create()) {
      this._updateValuesDisplay();
    } else {
      this._state = FlexSliderCard._State.ERROR;
      debuglog("ERROR");
    }
  }
  
  _renderTemplate() {
    
    const valuesbar = this._config.hasValuesBar();
    const hasTitle = this._config.hasTitle();
    const name = this._config.title;

    let css = '';

    if (this._config.isStd()) {
      css = stdFlexSliderCardCss;
    } else if (this._config.isCompact()) {
      css = compactFlexSliderCardCss;
    } else {
      throw new Error("Invalid format in _renderTemplate method");
    }

    this.shadowRoot.innerHTML = `
      <style>
        ${css}
      </style>

      <div class="container ${hasTitle ? "" : "no-title"}">
        ${hasTitle ? `<div class="title">${name}</div>` : ""}
        <div class="slider-with-values">
          <div class="slider-container">
            <div class="slider" id="slider"></div>
          </div>
          ${valuesbar ? `
            <div class="values">
              <span id="min-value"></span>
              <span id="max-value"></span>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }
  
  _sliderToDisplay(value) {
    if (this._config.entitytype == FlexSliderCardEntity.TYPE.NUMBER) {
      return Number(value).toFixed(this._config.digits);
    }
    if (this._config.entitytype == FlexSliderCardEntity.TYPE.TIME) {
      return minutesToTime(value);
    }
  }
   
  _create() {
    if (!this._config.entitiesExist()) {
      this.shadowRoot.innerHTML = `<p>Entities not found</p>`;
      return false;
    }
    this._renderTemplate();
    this._sliderElement = this.shadowRoot.getElementById("slider");
    return true;
  }
  
  _updateValuesDisplay() {
    if (this._updateValuesDisplayInProgress) {
      this._updateValuesDisplayRequestPending = true;
      return;
    }
    this._updateValuesDisplayInProgress = true;
    try {
      if (this._userIsUpdating) {
        return;
      }
      const minValue = this._config.entities.min.value;
      const maxValue = this._config.entities.max.value;
      if (!this._slider) {
        this._initSlider(minValue, maxValue);
        this._config.entitiesSetBaseline();
      } else {
        if (this._config.entitiesIsUpdated()) {
          this._slider.set([minValue, maxValue], false);
          this._config.entitiesSetBaseline();
        }
      }
    } finally {
      this._updateValuesDisplayInProgress = false;
      if (this._updateValuesDisplayRequestPending) {
        this._updateValuesDisplayRequestPending = false;
        queueMicrotask(() => this._updateValuesDisplay());
      }
    }
    if (this._state != FlexSliderCard._State.OPER) {
      this._state = FlexSliderCard._State.OPER;
      debuglog("OPER");
    }
    return;
  }
  
  _initSlider(minAtInit, maxAtInit) {
    if (this._slider) return;
    let min = this._config.min;
    let max = this._config.max;
    let step = this._config.step;
    noUiSlider.create(this._sliderElement, {
      start: [minAtInit, maxAtInit],
      connect: true,
      range: {
        min,
        max
      },
      step
    });
    this._slider = this._sliderElement.noUiSlider;
    this._slider.on("start", () => {
      debuglog("start");
      this._userIsUpdating = true;
    });
    this._slider.on("change", (values) => {
      debuglog("change");
      this._userIsUpdating = false;
      this._setEntities(values);
    });
    this._slider.on("update", (values) => {
      debuglog("update");
      if (this._config.hasValuesBar()) {
        const mintext = this._config.mintext;
        const maxtext = this._config.maxtext;
        const unit = this._config.unit;
        const minVal = this._sliderToDisplay(values[0]);
        const maxVal = this._sliderToDisplay(values[1]);
        const minElement = this.shadowRoot.getElementById("min-value");
        const maxElement = this.shadowRoot.getElementById("max-value");
        minElement.textContent = `${mintext}${minVal}${unit}`;
        maxElement.textContent = `${maxtext}${maxVal}${unit}`;
     }
    });
    this._slider.on("end", () => {
      debuglog("end");
      this._userIsUpdating = false;
    });
  }
  
  _setEntities(values) {
    this._config.entities.min.value = values[0];
    this._config.entities.max.value = values[1];
  }
  
}

customElements.define('flex-slider-card', FlexSliderCard);