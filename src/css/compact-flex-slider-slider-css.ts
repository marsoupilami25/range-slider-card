export const compactFlexSliderSliderCardCss: string = `
  
  .slider-container.compact {
    width: 100%;
    height: var(--height);
    display: flex;
    justify-content: center;
    align-items: var(--align-items);
    padding-bottom: var(--padding);
    margin-top: var(--margin-top);
    /* outline: 1px solid green; /* Debugging border */
  }
    
  .slider.compact.noUi-target {
    height: 6px;
    background: color-mix(in srgb, var(--disabled-color) 30%, transparent);
    border-radius: 5px;
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

  .slider.compact .noUi-connects {
    border-radius: 5px;
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

  .slider.compact.dragonly .noUi-origin.display-reference-origin .noUi-tooltip {
    opacity: 1;
  }

  .slider.compact .noUi-origin.display-reference-origin .noUi-tooltip {
    background: var(--ha-card-background, var(--card-background-color, var(--primary-background-color)));
    color: var(--secondary-text-color);
    border-color: transparent;
    font-weight: 700;
  }
  
  .slider.compact .noUi-handle::before, .slider.compact .noUi-handle::after {
    display: none;
  }

  .slider.compact .noUi-origin.ghost-max-origin {
    pointer-events: none;
  }

  .slider.compact .noUi-origin.display-reference-origin {
    pointer-events: none;
  }

  .slider.compact .noUi-origin.ghost-max-origin .noUi-handle {
    opacity: 0;
    box-shadow: none;
    pointer-events: none;
  }

  .slider.compact .noUi-origin.display-reference-origin .noUi-handle {
    background: var(--disabled-color);
    border: 0;
    border-radius: 999px;
    box-shadow: none;
    pointer-events: none;
  }

  .slider.compact .noUi-origin.display-reference-origin .noUi-touch-area {
    background: transparent;
    box-shadow: none;
  }

  .slider.compact.noUi-horizontal .noUi-origin.display-reference-origin .noUi-handle {
    width: 4px;
    height: 9px;
    top: -2px;
    right: -2px;
  }

  .slider.compact.noUi-horizontal .noUi-origin.display-reference-origin .noUi-tooltip {
    top: -19px;
  }

  .slider.compact.noUi-horizontal .noUi-pips {
    top: +0px;
  }

  .slider.compact.noUi-horizontal .noUi-marker-large {
    background: var(--primary-color);
    width: 2px;
    height: 6px;
    transform: translateX(0px);
  }

  .slider.compact.noUi-horizontal .noUi-marker-normal {
    background: var(--divider-color);
    width: 1px;
    height: 4px;
    transform: translateX(0px);
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

  /* ===== Vertical mode ===== */

  .slider-container.compact.vertical {
    height: var(--height, 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    /* outline: 1px solid green; /* Debugging border */
  }

  .slider.std.noUi-vertical {
    width: 6px;
    height: 100%;
  }

  .slider.compact.noUi-vertical.noUi-target {
    width: 6px;
    height: 100%;
    border-radius: 5px;
    background: color-mix(in srgb, var(--disabled-color) 30%, transparent);
    border: none;
    box-shadow: none;
  }

  .slider.compact.noUi-vertical .noUi-base {
    width: 6px;
    height: 100%;
  }

  .slider.compact.noUi-vertical .noUi-connect {
    width: 6px;
    height: 100%;
    background: color-mix(in srgb, var(--primary-color) 30%, transparent);
  }

  .slider.compact.noUi-vertical .noUi-handle {
    width: 12px;
    height: 12px;
    left: -9px;
    bottom: -6px;
    right: auto;
    top: auto;
    background: var(--primary-color);
    border-width: 0px;
    border-radius: 10px;
    box-shadow: none;
  }

  .slider.compact.noUi-vertical .noUi-tooltip {
    top: 50%;
    transform: translate(0, -50%);
  }

  .slider.compact.noUi-vertical .noUi-origin.ghost-max-origin .noUi-handle {
    opacity: 0;
    box-shadow: none;
    pointer-events: none;
  }

  .slider.compact.noUi-vertical .noUi-origin.display-reference-origin .noUi-handle {
    width: 10px;
    height: 4px;
    left: -8px;
    right: auto;
    top: auto;
    bottom: -2px;
  }

  .slider.compact.noUi-vertical.mirrored .noUi-tooltip {
    left: 15px;
    right: auto;
    text-align: left;
  }

  .slider.compact.noUi-vertical .noUi-pips-vertical {
    left: 100%;
    padding-left: 5px;
    width: max-content;
    color: var(--primary-text-color);
  }

  .slider.compact.noUi-vertical.mirrored .noUi-pips-vertical {
    left: auto;
    right: 100%;
    padding-right: 10px;
  }

  .slider.compact.noUi-vertical .noUi-marker-large {
    background: var(--primary-color);
    height: 2px;
    width: 6px;
    transform: translateY(-1px);
  }

  .slider.compact.noUi-vertical .noUi-marker-normal {
    background: var(--divider-color);
    height: 1px;
    width: 4px;
    transform: translateY(-1px);
  }

  .slider.compact.noUi-vertical .noUi-marker-sub {
    display: none;
  }

  .slider.compact.noUi-vertical .noUi-value-vertical {
    transform: translateY(-65%);
    left: -12px;
    line-height: 1;
  }

  .slider.compact.noUi-vertical.noUi-rtl .noUi-value-vertical {
    transform: translateY(25%);
  }

  .slider.compact.noUi-vertical.mirrored .noUi-value-vertical {
    left: auto;
    right: 12px;
    text-align: right;
  }

  .slider.compact.noUi-vertical .noUi-value-large {
    font-size: 0.7rem;
    color: var(--primary-text-color);
  }

  .slider.compact.noUi-vertical .noUi-value-normal {
    display: none;
  }

`;
