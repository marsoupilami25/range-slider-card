export const stdFlexSliderCardCss: string = `
  
  :host([std]) {
    display: block;
    height: 100%;
    --flex-slider-card-barvalues-font-size: 1rem;
    --flex-slider-card-barvalues-padding-bottom: 2px;
  }
  
  .container.std {
    min-height: 100%;
    height: 100%;
    padding-bottom: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }
  
  .container.std.no-title {
    padding-top: 5px;
    padding-bottom: 5px;
    justify-content: center;
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
    width: 90%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    margin-block: auto;
    /* border: 1px solid red; /* Debugging border */
  }
  
  .container.std .slider {
    width: 100%;
    height: 100%;
  }

  .container.std.no-title .values {
    font-size: 0.9rem;
  }

  /* ===== Vertical mode ===== */

  .container.std.vertical .slider-with-values {
    width: auto;
    height: 100%;
    min-height: 150px
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
