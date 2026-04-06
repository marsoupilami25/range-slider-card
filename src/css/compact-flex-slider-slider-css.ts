export const compactFlexSliderSliderCardCss: string = `
  
  .slider-container.compact {
    width: 100%;
    height: var(--height);
    display: flex;
    justify-content: center;
    align-items: var(--align-items);
    padding-bottom: var(--padding);
    /* border: 1px solid green; /* Debugging border */
  }
    
  .slider.compact.noUi-target {
    height: 6px;
    background: color-mix(in srgb, var(--disabled-color) 30%, transparent);
    border-radius: 4px / 6px;
    border: none;
    box-shadow: none;
  }
  
  .slider.compact .noUi-base {
    height: 6px;
  }
  
  .slider.compact .noUi-connect {
    height: 6px;
    background: color-mix(in srgb, var(--primary-color) 30%, transparent);
  }
  
  .slider.compact.noUi-horizontal .noUi-handle {
    width: 12px;
    height: 12px;
    top: -3px;
    right: -6px;
    background: var(--primary-color);
    border-width: 0px;
    border-radius: 10px;
    box-shadow: none;
  }
  .slider.compact .noUi-tooltip {
    background: var(--disabled-color);
    color: var(--primary-text-color);
    border-radius: 6px;
    border: 1px solid var(--primary-color);
    padding: 0px 4px;
    font-size: 0.7rem;
    top: -18px;
    height: 15px;
    display: flex;
    align-items: center; 
  }

  .slider.compact.dragonly .noUi-tooltip {
    opacity: 0;
    transition: opacity 0.2s;
  }

  .slider.compact.dragonly .noUi-active .noUi-tooltip {
    opacity: 1;
  }
  
  .slider.compact .noUi-handle::before, .slider.compact .noUi-handle::after {
    display: none;
  }

  .slider.compact.noUi-horizontal .noUi-pips {
    top: +0px;
  }

  .slider.compact.noUi-horizontal .noUi-marker-large {
    background: var(--primary-color);
    width: 2px;
    height: 6px;
    transform: translateX(-1px);
  }

  .slider.compact.noUi-horizontal .noUi-marker-normal {
    background: var(--divider-color);
    width: 1px;
    height: 4px;
    transform: translateX(-1px);
  }

  .slider.compact.noUi-horizontal.noUi-rtl .noUi-marker-large {
    transform: translateX(1px);
  }

  .slider.compact.noUi-horizontal.noUi-rtl .noUi-marker-normal {
    transform: translateX(1px);
  }

  .slider.compact.noUi-horizontal .noUi-marker-sub {
    display: none;
  }

  .slider.compact.noUi-horizontal .noUi-value-horizontal {
    transform: translateX(-50%);
    top: +17px;
    line-height: 1;
  }

  .slider.compact.noUi-horizontal.noUi-rtl .noUi-value-horizontal {
    transform: translate(50%, 0);
  }

  .slider.compact.noUi-horizontal .noUi-value-large {
    font-size: 0.7rem;
    color: var(--primary-text-color);
  }

  .slider.compact.noUi-horizontal .noUi-value-normal {
    display: none;
  }
`;
