import { minutesToTime } from "./utils";
import { FlexSliderCardEntity } from "./flex-slider-card-entity.js";

export class FlexSliderCardValuesBar {

  constructor(config, htmlelement) {
    this._config = config;                           // reference to the card configuration
    this._valueBarElement = htmlelement;             // reference to the DOM element of the values bar
  }

  update(values) {
    const mintext = this._config.mintext;
    const maxtext = this._config.maxtext;
    const unit = this._config.unit;
    const minVal = this._sliderToDisplay(values[0]);
    const maxVal = this._sliderToDisplay(values[1]);
    const minElement = this._valueBarElement.querySelector("#min-value");
    const maxElement = this._valueBarElement.querySelector("#max-value");
    minElement.textContent = `${mintext}${minVal}${unit}`;
    maxElement.textContent = `${maxtext}${maxVal}${unit}`;
  }

  _sliderToDisplay(value) {
    if (this._config.entitytype == FlexSliderCardEntity.TYPE.NUMBER) {
      return Number(value).toFixed(this._config.digits);
    }
    if (this._config.entitytype == FlexSliderCardEntity.TYPE.TIME) {
      return minutesToTime(value);
    }
  }

}