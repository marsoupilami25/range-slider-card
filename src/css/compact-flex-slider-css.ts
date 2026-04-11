import { COMPACT_TITLE_HEIGHT, COMPACT_CONTAINER_PADDING } from "../type/constants";

export const compactFlexSliderCardCss: string = `

  :host([compact]) {
    display: block;
    height: 100%;
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
    /* outline: 1px solid blue; /* Debugging border */
  }

  .container.compact .slider-with-values {
    width: var(--flex-slider-width, 90%);
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    margin-block: auto;
    /* outline: 1px solid red; /* Debugging border */
  }

`;
