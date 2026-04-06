export const stdFlexSliderCardCss: string = `
  
  :host([std]) {
    display: block;
    --flex-slider-card-barvalues-font-size: 1rem;
    --flex-slider-card-barvalues-padding-bottom: 2px;
  }
  
  .container.std {
    min-height: 100%;
    padding-bottom: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .container.std.no-title {
    padding-top: 5px;
    padding-bottom: 5px;
    justify-content: center;
  }

  .container.std .title {
    display: flex;
    height: 35px;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: var(--primary-text-color);
  }

  .container.std .slider-with-values {
    width: 90%;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
  }
  
  .container.std .slider {
    width: 100%;
  }

  .container.std.no-title .values {
    font-size: 0.9rem;
  }

`;
