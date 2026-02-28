class RangeSliderCard extends HTMLElement {
  
  static State = Object.freeze({
    DISCONNECTED: 0,
    CONNECTED: 1,
    INIT: 2,
    OPER: 3,
    ERROR: 4
  });

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._initInternal();
  }

  setConfig(config) {
    if (!config.entity_min || !config.entity_max) {
      this._state = RangeSliderCard.State.ERROR;
      throw new Error("You need to define 'entity_min' and 'entity_max'");
    }
    this.config = config;
  }

  connectedCallback() {
    if (this._state == RangeSliderCard.State.DISCONNECTED ) {
      this._state = RangeSliderCard.State.CONNECTED
      // console.log("CONNECTED");
    }
  }

  disconnectedCallback() {
    if (this._slider) {
      this._slider.destroy();
    }
    this._initInternal();
  }

  set hass(hass) {
    this._hass = hass;

    if (this._state == RangeSliderCard.State.CONNECTED && this.config) {
      this._init();
    }
    if (this._state == RangeSliderCard.State.OPER) {
      this._updateValuesDisplay().then();
    }
  }

  _initInternal() {
    // console.log("DISCONNECTED");
    this._state = RangeSliderCard.State.DISCONNECTED;
    this._userIsUpdating = false;
    this._slider = null;
    this._updateValuesDisplayInProgress = false;
    this._updateValuesDisplayRequestPending = false;
    this._sliderElement = null;
    this._lastmin = null;
    this._lastmax = null;
  }

  async _init() {
    this._state = RangeSliderCard.State.INIT;
    // console.log("INIT");
    if (this._create()) {
      this._updateValuesDisplay();
    } else {
      this._state = RangeSliderCard.State.ERROR;
      // console.log("ERROR");
    } 
  }

  _create() {
    const {
      entity_min,
      entity_max,
      name = "range Slider"
    } = this.config;

    const stateMin = this._hass.states[entity_min];
    const stateMax = this._hass.states[entity_max];

    if (!stateMin || !stateMax) {
      this.shadowRoot.innerHTML = `<p>Entities not found</p>`;
      return false;
    }

    this.shadowRoot.innerHTML = `
      <style>
        @import "https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/15.7.0/nouislider.min.css";
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
        }
        .slider {
          width: 90%;
          margin: 8px 0;
        }
        .values {
          display: flex;
          justify-content: space-between;
          width: 100%;
          font-size: 0.9rem;
        }
        .title {
          /* font-size: 1rem; */
          /* font-weight: bold; */
          margin-bottom: 8px;
          color: var(--primary-text-color);
        }
        #min-value {
          color: var(--primary-text-color);
        }
        #max-value {
          color: var(--primary-text-color);
        }
      </style>
      <div class="container">
        <div class="title">${name}</div>
        <div class="slider" id="slider"></div>
        <div class="values">
          <span id="min-value"></span>
          <span id="max-value"></span>
        </div>
      </div>
    `;
    this._sliderElement = this.shadowRoot.getElementById("slider");
    return true;
  }

  async _updateValuesDisplay() {
    if (this._updateValuesDisplayInProgress) {
      this._updateValuesDisplayRequestPending = true;
      return;
    }
    this._updateValuesDisplayInProgress = true;
    
    try {
      if (this._userIsUpdating) {
        return;
      }

      const { entity_min, entity_max, unit = "" } = this.config;

      const minState = this._hass.states[entity_min];
      const maxState = this._hass.states[entity_max];
      if (!minState || !maxState) return;

      const minValue = Number(minState.state);
      const maxValue = Number(maxState.state);

      if (!this._slider) {
        await this._initSlider(minValue, maxValue);
        this._lastmin = minValue;
        this._lastmax = maxValue;
      } else {
        if (minValue != this._lastmin || maxValue != this._lastmax) {
          // console.log("slider set");
          this._slider.set([minValue, maxValue], false);
          this._lastmin = minValue;
          this._lastmax = maxValue;
        }
      }
    } finally {
      this._updateValuesDisplayInProgress = false;
      if (this._updateValuesDisplayRequestPending) {
        this._updateValuesDisplayRequestPending = false;
        queueMicrotask(() => this._updateValuesDisplay()); // run again with last HA states
      }
    }
    if (this._state != RangeSliderCard.State.OPER) {
      this._state = RangeSliderCard.State.OPER;
      // console.log("OPER");
    }
    return;
  }

  async _initSlider( minAtInit, maxAtInit) {
    if (this._slider) return;

    const noUiSlider = await this._loadNoUiSlider();
    
    const {
      min = 0,
      max = 100,
      step = 1,
    } = this.config;

    noUiSlider.create(this._sliderElement, {
      start: [minAtInit, maxAtInit],
      connect: true,
      range: {
        min: min,
        max: max,
      },
      step: step,
    });

    this._slider = this._sliderElement.noUiSlider;

    this._slider.on('start', () => {
      // console.log("start");
      this._userIsUpdating = true;
    });

    this._slider.on('change', (values) => {
      // console.log("change");
      this._userIsUpdating = false;
      this._setEntities(values);
    });

    this._slider.on('update', (values) => {
      // console.log("update");
      const { unit = "" } = this.config;
      const minVal = Math.round(values[0]).toFixed(1);
      const maxVal = Math.round(values[1]).toFixed(1);

      const minElement = this.shadowRoot.getElementById("min-value");
      const maxElement = this.shadowRoot.getElementById("max-value");
  
      minElement.textContent = `Min: ${minVal}${unit}`;
      maxElement.textContent = `Max: ${maxVal}${unit}`;

      const minPercent = ((values[0] - min) / (max - min)) * 100;
      const maxPercent = ((max - values[1]) / (max - min)) * 100;
  
      minElement.style.left = `${minPercent}%`;
      maxElement.style.right = `${maxPercent}%`;
    });

    this._slider.on('end', () => {
      // console.log("end");
      this._userIsUpdating = false;
    });

  }

  _setEntities(values) {
    const { entity_min, entity_max } = this.config;

    const min = Math.round(values[0]);
    const max = Math.round(values[1]);

    this._hass.callService("number", "set_value", {
      entity_id: entity_min,
      value: min,
    });

    this._hass.callService("number", "set_value", {
      entity_id: entity_max,
      value: max,
    });
  }

  _loadNoUiSlider() {
    if (!window.noUiSlider) {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/15.7.0/nouislider.min.js";
        script.onload = () => resolve(window.noUiSlider);
        document.head.appendChild(script);
      });
    }
    return window.noUiSlider;
  }

  getCardSize() {
    return 2;
  }
}

customElements.define('range-slider-card', RangeSliderCard);