export const stdFlexSliderSliderCardCss: string = `

  .slider-container.std {
    width: 100%;
    height: var(--height);
    display: flex;
    justify-content: center;
    align-items: var(--align-items);
    /* border: 1px solid green; /* Debugging border */
  }

  .slider.std.noUi-target {
    height: 16px;
    background: color-mix(in srgb, var(--disabled-color) 30%, transparent);
    border-radius: 10px / 16px;
    border: none;
    box-shadow: none;
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
  
  .slider.std .noUi-handle::before, .slider.std .noUi-handle::after {
    display: none;
  }
`;
