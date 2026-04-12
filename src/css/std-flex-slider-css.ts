import { STD_TITLE_HEIGHT, STD_CONTAINER_PADDING } from "../type/constants";

export const stdFlexSliderCardCss: string = `

  :host([std]) {
    display: block;
    height: var(--flex-slider-height, 100%);
    --flex-slider-card-barvalues-font-size: 1rem;
  }

  .container.std {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  .container.std.no-title {
    padding-top: ${STD_CONTAINER_PADDING}px;
    justify-content: center;
  }

  .container.std.no-values {
    padding-bottom: ${STD_CONTAINER_PADDING}px;
  }

  .container.std .title {
    display: flex;
    height: ${STD_TITLE_HEIGHT}px;
    min-height: ${STD_TITLE_HEIGHT}px;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: var(--primary-text-color);
    outline: 1px solid blue; /* Debugging border */
  }

  .container.std .slider-with-values {
    width: var(--flex-slider-width, 90%);
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    margin-block: auto;
    outline: 1px solid blue; /* Debugging border */
  }

  /* ===== Vertical mode ===== */

  .container.std.vertical .slider-with-values {
    width: 80%;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }

  .container.std.vertical .slider-container {
    height: 100%;
    width: var(--flex-slider-vertical-slider-container-width, auto);
    display: flex;
    justify-content: var(--flex-slider-vertical-slider-justify-content, center);
  }

  .container.std.vertical.has-ticks .slider-container,
  .container.std.vertical.has-bubbles .slider-container {
    height: 95%;
  }

  .container.std.vertical flex-slider-card-slider {
    height: 100%;
    width: auto;
    display: flex;
    align-items: center;
  }

`;
