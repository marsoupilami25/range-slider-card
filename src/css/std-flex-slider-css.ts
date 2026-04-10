export const stdFlexSliderCardCss: string = `
  
  :host([std]) {
    display: block;
    height: 100%;
    --flex-slider-card-barvalues-font-size: 1rem;
  }
  
  .container.std {
    height: var(--flex-slider-height, 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }
  
  .container.std.no-title {
    padding-top: 5px;
    justify-content: center;
  }

  .container.std.no-values {
    padding-bottom: 5px;
  }

  .container.std .title {
    display: flex;
    height: 30px;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: var(--primary-text-color);
    /* border: 1px solid green; /* Debugging border */
  }

  .container.std .slider-with-values {
    width: var(--flex-slider-size, 90%);
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    margin-block: auto;
    /* border: 1px solid red; /* Debugging border */
  }
  
  /* ===== Vertical mode ===== */

  .container.std.vertical .slider-with-values {
    width: auto;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: flex-start;
  }

  .container.std.vertical .slider-container {
    height: 100%;
    width: auto;
  }

  .container.std.vertical flex-slider-card-slider {
    height: 100%;
    width: auto;
  }

`;
