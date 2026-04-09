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
    padding-top: 3px;
    justify-content: center;
  }

  .container.compact.no-values {
    padding-bottom: 3px;
  }

  .container.compact .title {
    display: flex;
    height: 20px;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    color: var(--primary-text-color);
    /* border: 1px solid blue; /* Debugging border */
  }
 
  .container.compact .slider-with-values {
    width: var(--flex-slider-size, 90%);
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    margin-block: auto;
    /* border: 1px solid red; /* Debugging border */
  }
   
`;
