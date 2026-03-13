import { FlexSliderCardEntity } from "./flex-slider-card-entity";

export class FlexSliderCardConfig  {
  
  constructor(config) {
    this._config = structuredClone(config);      // user configuration object
    this._entities = {};        // entities objects, with suffix as key ("min" and "max")
    this._entitytype = null;    // entity type: "number" or "time", depending on the domains of entity_min and entity_max

    this._checkFormat();
    this._checkTitle();
    this._checkEntities(); //warning: need to be call before _checkSlider because it needs to know the entity type
    this._checkSlider(); //warning: need to be call before _checkValuesBar because it sets default values for min, max and step
    this._checkValuesBar();
  }

  update(hass) {
    this._updateFormat(hass);
    this._updateTitle(hass);
    this._updateEntities(hass); 
    this._updateSlider(hass);
    this._updateValuesBar(hass);
  }

  reset() {
    this._resetFormat();
    this._resetTitle();
    this._resetEntities(); 
    this._resetSlider(); 
    this._resetValuesBar();
  }

  /****************************************************/
  /* format                                           */
  /****************************************************/

  _checkFormat() {
    if (this._config.format === undefined) {
      this._config.format = "std";
    }
    else if (this._config.format != "std" && this._config.format != "compact") {
      throw new Error("Invalid format '"+this._config.format+"'");
    }
  }

  _updateFormat(hass) {
    return;
  }

  _resetFormat() {
    return;
  }

  isCompact() {
    return this._config.format === "compact";
  }

  isStd() {
    return this._config.format === "std";
  }

  /****************************************************/
  /* title                                            */
  /****************************************************/

  _checkTitle() {
    if (this._config.name != undefined && typeof this._config.name !== "string") {
      throw new Error("Invalid name '"+this._config.name+"'");
    }

    if (this._config.name == undefined) {
      this._config.name = undefined;
    }
  }

  _updateTitle(hass) {
    return;
  }

  _resetTitle() {
    return;
  }

  hasTitle() {
    return this._config.name !== undefined;
  }

  get title() {
    return this._config.name || "";
  }

  /****************************************************/
  /* values bar                                       */
  /****************************************************/

  _checkValuesBar() {
    if (this._config.valuesbar != undefined && typeof this._config.valuesbar !== "boolean") {
      throw new Error("Invalid valuesbar '"+this._config.valuesbar+"'");
    }
    if (this._config.valuesbar == undefined) {
      this._config.valuesbar = false;
    }

    if (this._config.digits != undefined && 
      (typeof this._config.digits !== "number" || this._config.digits < 0) && 
      this._config.digits !== "auto") {
      throw new Error("Invalid digits '"+this._config.digits+"'");
    }
    if (this._config.digits == undefined) {
      this._config.digits = "auto";
    }
    if (this._config.digits === "auto") {
      this._config.digits = this.step.toString().split(".")[1]?.length || 0;
    }

    if (this._config.unit == undefined) {
      this._config.unit = "";
    }

    if (this._config.mintext != undefined && typeof this._config.mintext !== "string") {
      throw new Error("Invalid mintext '"+this._config.mintext+"'");
    }
    if (this._config.mintext == undefined) {
      this._config.mintext = "";
    }
    if (this._config.mintext !== "") {
      this._config.mintext = this._config.mintext + ": ";
    }

    if (this._config.maxtext != undefined && typeof this._config.maxtext !== "string") {
      throw new Error("Invalid maxtext '"+this._config.maxtext+"'");
    }
    if (this._config.maxtext == undefined) {
      this._config.maxtext = "";
    }
    if (this._config.maxtext !== "") {
      this._config.maxtext = this._config.maxtext + ": ";
    }

    this._valuesBar = null; // reference to the values bar object, if it is created
  }

  _updateValuesBar(hass) {
    return;
  }

  _resetValuesBar() {
    return;
  }

  hasValuesBar() {
    return this._config.valuesbar === true;
  }

  set valuesBar(valuesBar) {
    this._valuesBar = valuesBar;
  }

  get valuesBar() {
    return this._valuesBar;
  }
  
  get digits() {
    return this._config.digits;
  }

  get unit() {
    return this._config.unit;
  }

  get mintext() {
    return this._config.mintext;
  }

  get maxtext() {
    return this._config.maxtext;
  } 

  /****************************************************/
  /* slider                                           */
  /****************************************************/

  _checkSlider() {
    if (this._config.min != undefined && typeof this._config.min !== "number") {
      throw new Error("Invalid min '"+this._config.min+"'");
    }
    if (this._config.min == undefined) {
      this._config.min = 0;
    }
    
    if (this._config.max != undefined && typeof this._config.max !== "number") {
      throw new Error("Invalid max '"+this._config.max+"'");
    }
    if (this._config.max == undefined) {
      this._config.max = 100;
    }

    if (this._config.step != undefined && typeof this._config.step !== "number") {
      throw new Error("Invalid step '"+this._config.step+"'");
    }
    if (this._config.step == undefined) {
      this._config.step = 1;
    }

    if (this.entitytype === FlexSliderCardEntity.TYPE.TIME) {
      this._config.min = 0;
      this._config.max = 1439;
      this._config.step = Math.round(this._config.step);
    }

  }

  _updateSlider(hass) {
    return;
  }

  _resetSlider() {
    return;
  }

  get min() {
    return this._config.min;
  }

  get max() {
    return this._config.max;
  }

  get step() {
    return this._config.step; 
  }

  /****************************************************/
  /* entities                                         */
  /****************************************************/

  _isValidEntityId(entity) {
    if (typeof entity !== "string") {
      return false;
    }

    const entityRegex = /^[a-z0-9_]+\.[a-z0-9_]+$/;

    return entityRegex.test(entity);
  }

  _checkEntities() {
    
    if (!this._config.entity_min || !this._config.entity_max) {
      throw new Error("You need to define 'entity_min' and 'entity_max'");
    }

    if (!this._isValidEntityId(this._config.entity_min)) {
      throw new Error("Invalid entity min format. Expected domain.object_id");
    }

    if (!this._isValidEntityId(this._config.entity_max)) {
      throw new Error("Invalid entity max format. Expected domain.object_id");
    }

    this._entities.min = new FlexSliderCardEntity(this, "min");
    this._entities.max = new FlexSliderCardEntity(this, "max");

    this._entitytype = this._entities.min.entitytype;
    if (this._entities.max.entitytype != this._entitytype) {
      throw new Error("'entity_min' and 'entity_max' shall have compatible domains");
    }

  }

  _updateEntities(hass) {
    Object.values(this._entities).forEach(entity => entity.update(hass));
  }

  _resetEntities() {
    if (this.entitiesExist()) {
      this.entitiesResetBaseline();
    }
  }

  _getEntityConfig(suffix) {
    return this._config[`entity_${suffix}`];
  }

  get entitytype() {
    return this._entitytype;
  }

  get entities() {
    return this._entities;
  }

  entitiesExist() {
    return Object.values(this._entities).every(entity => entity.exists());
  }

  entitiesResetBaseline() {
    Object.values(this._entities).forEach(entity => entity.resetBaseline());
  }
  
  entitiesSetBaseline() {
    Object.values(this._entities).forEach(entity => entity.setBaseline());
  }

  entitiesIsUpdated() {
    return Object.values(this._entities).some(entity => entity.isupdated());
  }

}