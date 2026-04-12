import { COMPACT_TITLE_HEIGHT, COMPACT_CONTAINER_PADDING } from "../type/constants";

export const compactFlexSliderCardCss: string = `

  :host([compact]) {
    display: block;
    height: var(--flex-slider-height, 100%);
    --flex-slider-card-barvalues-font-size: 0.8rem;
  }

  .container.compact {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  .container.compact.no-title {
    padding-top: ${COMPACT_CONTAINER_PADDING}px;
    justify-content: center;
  }

  .container.compact.no-values {
    padding-bottom: ${COMPACT_CONTAINER_PADDING}px;
  }

  .container.compact .title {
    display: flex;
    height: ${COMPACT_TITLE_HEIGHT}px;
    min-height: ${COMPACT_TITLE_HEIGHT}px;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    color: var(--primary-text-color);
     outline: 1px solid blue; /* Debugging border */
  }

  .container.compact .slider-with-values {
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

  .container.compact.vertical .slider-with-values {
    width: auto;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: center;
  }

  .container.compact.vertical .slider-container {
    height: 100%;
    width: var(--flex-slider-vertical-slider-container-width, auto);
    display: flex;
    justify-content: var(--flex-slider-vertical-slider-justify-content, center);
  }

  .container.compact.vertical flex-slider-card-slider {
    height: 100%;
    width: auto;
    display: flex;
    align-items: center;
  }
    
`;
