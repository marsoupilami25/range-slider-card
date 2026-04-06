export const stdFlexSliderSliderCardCss: string = `

  .slider-container.std {
    width: 100%;
    height: var(--height);
    display: flex;
    justify-content: center;
    align-items: var(--align-items);
  }

  .slider.std.noUi-target {
    height: 16px;
    background: color-mix(in srgb, var(--disabled-color) 30%, transparent);
    border-radius: 10px / 16px;
    border: none;
    box-shadow: none;
    margin-top: var(--margin-top);
    /*border: 1px solid blue; /* Debugging border */
  }
  
  .slider.std .noUi-base {
    height: 16px;
    /* border: 1px solid green; /* Debugging border */
  }
  
  .slider.std .noUi-connect {
    height: 16px;
    background: color-mix(in srgb, var(--primary-color) 30%, transparent);
    /* border: 1px solid red; /* Debugging border */
  }
  
  .slider.std.noUi-horizontal .noUi-handle {
    width: 18px;
    height: 18px;
    top: -1px;
    right: -9px;
    background: var(--primary-text-color);
    border-width: 3px;
    border-style: solid;
    border-color: var(--primary-color);
    border-radius: 15px;
    box-shadow: none;
  }
  
  .slider.std .noUi-tooltip {
    background: var(--disabled-color);
    color: var(--primary-text-color);
    border-radius: 6px;
    border: 1px solid var(--primary-color);
    padding: 0px 4px;
    font-size: 1rem;
    top: -26px;
    height: 20px;
    display: flex;
    align-items: center; 
  }

  .slider.std.dragonly .noUi-tooltip {
    opacity: 0;
    transition: opacity 0.2s;
  }

  .slider.std.dragonly .noUi-active .noUi-tooltip {
    opacity: 1;
  }

  .slider.std .noUi-handle::before, .slider.std .noUi-handle::after {
    display: none;
  }

  .slider.std.noUi-horizontal .noUi-pips {
    top: +10px;
  }

  .slider.std.noUi-horizontal .noUi-marker-large {
    background: var(--primary-color);
    width: 3px;
    height: 8px;
    transform: translateX(-1px);
  }

  .slider.std.noUi-horizontal .noUi-marker-normal {
    background: var(--divider-color);
    width: 2px;
    height: 5px;
    transform: translateX(-1px);
  }

  .slider.std.noUi-horizontal .noUi-marker-sub {
    display: none;
  }

  .slider.std.noUi-horizontal .noUi-value-horizontal {
    transform: translateX(-50%);
    top: +19px;
    line-height: 1;
  }

  .slider.std.noUi-horizontal .noUi-value-large {
    font-size: 1rem;
    color: var(--primary-text-color);
  }

  .slider.std.noUi-horizontal .noUi-value-normal {
    display: none;
  }
`;
