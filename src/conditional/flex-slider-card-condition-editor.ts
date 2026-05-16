import type { HomeAssistant } from "custom-card-helpers";
import { css, html, LitElement, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { WeekdayShort } from "../frontend/datetime/weekday";
import type {
  AndCondition,
  Condition,
  NotCondition,
  NumericStateCondition,
  OrCondition,
  ScreenCondition,
  StateCondition,
  TimeCondition,
  ViewColumnsCondition,
} from "./flex-slider-card-validate-condition";

type EditableConditionType = Condition["condition"];
type ConditionPath = number[];
type ConditionsChangedEvent = CustomEvent<{ value?: Condition[]; conditions?: Condition[] }>;
type ConditionalCardConstructor = CustomElementConstructor & {
  getConfigElement?: () => Promise<unknown> | unknown;
};
type LovelaceCardHelpers = {
  createCardElement?: (config: Record<string, unknown>) => HTMLElement;
};
type HomeAssistantWindow = Window & {
  loadCardHelpers?: () => Promise<LovelaceCardHelpers>;
};

const CONDITION_TYPE_OPTIONS: Array<{ value: EditableConditionType; label: string; icon: string }> = [
  { value: "state", label: "State", icon: "mdi:toggle-switch-outline" },
  { value: "numeric_state", label: "Numeric state", icon: "mdi:numeric" },
  { value: "time", label: "Time", icon: "mdi:clock-outline" },
  { value: "screen", label: "Screen", icon: "mdi:monitor" },
  { value: "view_columns", label: "View columns", icon: "mdi:view-column-outline" },
  { value: "and", label: "All conditions", icon: "mdi:call-merge" },
  { value: "or", label: "Any condition", icon: "mdi:call-split" },
  { value: "not", label: "Not", icon: "mdi:close-circle-outline" },
];

const WEEKDAY_OPTIONS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
] as const;

@customElement("flex-slider-card-condition-editor")
export class FlexSliderCardConditionEditor extends LitElement {

  /****************************************************/
  /* attributes                                       */
  /****************************************************/

  @property({ attribute: false })
  public conditions: Condition[] = [];

  @property({ attribute: false })
  public hass?: HomeAssistant;

  @state()
  private _hasHaConditionsEditor = customElements.get("ha-card-conditions-editor") !== undefined;

  /****************************************************/
  /* CSS                                              */
  /****************************************************/

  static override styles = css`
    :host {
      display: block;
    }

    .conditions-editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 4px;
    }

    .conditions-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .conditions-title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .section-description {
      margin: 0;
      color: var(--secondary-text-color);
      font-size: 13px;
      line-height: 1.4;
    }

    .conditions-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .condition-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 12px;
      background: var(--secondary-background-color);
    }

    .condition-card.nested {
      background: var(--card-background-color, var(--ha-card-background, white));
    }

    .condition-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      gap: 10px;
    }

    .condition-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 10px;
    }

    .condition-type {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: end;
      gap: 8px;
    }

    .condition-icon {
      color: var(--secondary-text-color);
      padding-bottom: 8px;
    }

    .condition-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .condition-field label {
      color: var(--secondary-text-color);
      font-size: 12px;
      font-weight: 500;
    }

    .condition-field input,
    .condition-field select {
      box-sizing: border-box;
      width: 100%;
      min-height: 36px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      padding: 6px 8px;
      background: var(--card-background-color, var(--ha-card-background, white));
      color: var(--primary-text-color);
      font: inherit;
    }

    .weekdays {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      min-height: 36px;
    }

    .weekday {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--primary-text-color);
      font-size: 12px;
    }

    .nested-conditions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-left: 12px;
      border-left: 2px solid var(--divider-color);
    }

    .action-button {
      border: 1px solid var(--divider-color);
      border-radius: 999px;
      padding: 8px 14px;
      background: transparent;
      color: var(--primary-text-color);
      font: inherit;
      cursor: pointer;
    }

    .icon-button {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      font-size: 18px;
      line-height: 1;
    }

    .condition-button {
      border-radius: 6px;
      padding: 8px 12px;
    }
  `;

  /****************************************************/
  /* Public methods - Lit Element                     */
  /****************************************************/

  public override connectedCallback(): void {
    super.connectedCallback();
    this._loadHaConditionsEditor();
  }

  protected override render(): TemplateResult {
    const conditions = this.conditions ?? [];

    if (this._hasHaConditionsEditor) {
      return this._renderHaConditionsEditor(conditions);
    }

    return html`
      <div class="conditions-editor">
        <div class="conditions-header">
          <p class="conditions-title">External conditions</p>
          <button
            class="action-button condition-button"
            type="button"
            @click=${() => this._addCondition([])}
          >
            Add condition
          </button>
        </div>
        <div class="conditions-list">
          ${conditions.length === 0
            ? html`<p class="section-description">No condition configured.</p>`
            : conditions.map((condition, index) => this._renderCondition(condition, [index], false))}
        </div>
      </div>
    `;
  }

  /****************************************************/
  /* Private methods - rendering                      */
  /****************************************************/

  private _renderHaConditionsEditor(conditions: Condition[]): TemplateResult {
    return html`
      <ha-card-conditions-editor
        .hass=${this.hass}
        .conditions=${conditions}
        @value-changed=${this._handleHaConditionsChanged}
        @conditions-changed=${this._handleHaConditionsChanged}
      ></ha-card-conditions-editor>
    `;
  }

  private _renderCondition(condition: Condition, path: ConditionPath, nested: boolean): TemplateResult {
    const option = this._getConditionTypeOption(condition.condition);

    return html`
      <div class="condition-card ${nested ? "nested" : ""}">
        <div class="condition-row">
          <div class="condition-type">
            <ha-icon class="condition-icon" .icon=${option.icon}></ha-icon>
            <div class="condition-field">
              <label>Condition type</label>
              <select
                .value=${condition.condition}
                @change=${(ev: Event) => this._changeConditionType(path, (ev.target as HTMLSelectElement).value as EditableConditionType)}
              >
                ${CONDITION_TYPE_OPTIONS.map((conditionOption) => html`
                  <option value=${conditionOption.value}>${conditionOption.label}</option>
                `)}
              </select>
            </div>
          </div>
          <button
            class="action-button icon-button"
            type="button"
            aria-label="Remove condition"
            @click=${() => this._removeCondition(path)}
          >
            -
          </button>
        </div>
        ${this._renderConditionFields(condition, path)}
      </div>
    `;
  }

  private _renderConditionFields(condition: Condition, path: ConditionPath): TemplateResult {
    switch (condition.condition) {
      case "numeric_state":
        return this._renderNumericStateCondition(condition, path);
      case "time":
        return this._renderTimeCondition(condition, path);
      case "screen":
        return this._renderScreenCondition(condition, path);
      case "view_columns":
        return this._renderViewColumnsCondition(condition, path);
      case "and":
      case "or":
      case "not":
        return this._renderLogicalCondition(condition, path);
      case "state":
      default:
        return this._renderStateCondition(condition as StateCondition, path);
    }
  }

  /****************************************************/
  /* Private methods - condition type rendering       */
  /****************************************************/

  private _renderStateCondition(condition: StateCondition, path: ConditionPath): TemplateResult {
    const mode = condition.state_not != null ? "state_not" : "state";
    const value = mode === "state_not" ? condition.state_not : condition.state;

    return html`
      <div class="condition-fields">
        ${this._renderTextField("Entity", condition.entity ?? "", (value) => this._updateCondition(path, { entity: value || undefined }))}
        ${this._renderTextField("Attribute", condition.attribute ?? "", (value) => this._updateCondition(path, { attribute: value || undefined }))}
        <div class="condition-field">
          <label>Match mode</label>
          <select
            .value=${mode}
            @change=${(ev: Event) => this._changeStateMode(path, (ev.target as HTMLSelectElement).value as "state" | "state_not")}
          >
            <option value="state">State is</option>
            <option value="state_not">State is not</option>
          </select>
        </div>
        ${this._renderTextField("State", this._conditionValueToText(value), (nextValue) => this._updateStateValue(path, mode, nextValue))}
      </div>
    `;
  }

  private _renderNumericStateCondition(condition: NumericStateCondition, path: ConditionPath): TemplateResult {
    return html`
      <div class="condition-fields">
        ${this._renderTextField("Entity", condition.entity ?? "", (value) => this._updateCondition(path, { entity: value || undefined }))}
        ${this._renderTextField("Attribute", condition.attribute ?? "", (value) => this._updateCondition(path, { attribute: value || undefined }))}
        ${this._renderNumberField("Above", condition.above, (value) => this._updateCondition(path, { above: value }))}
        ${this._renderNumberField("Below", condition.below, (value) => this._updateCondition(path, { below: value }))}
      </div>
    `;
  }

  private _renderTimeCondition(condition: TimeCondition, path: ConditionPath): TemplateResult {
    const weekdays = condition.weekdays ?? [];

    return html`
      <div class="condition-fields">
        ${this._renderTextField("After", condition.after ?? "", (value) => this._updateCondition(path, { after: value || undefined }), "time")}
        ${this._renderTextField("Before", condition.before ?? "", (value) => this._updateCondition(path, { before: value || undefined }), "time")}
        <div class="condition-field">
          <label>Weekdays</label>
          <div class="weekdays">
            ${WEEKDAY_OPTIONS.map((weekday) => html`
              <label class="weekday">
                <input
                  type="checkbox"
                  .checked=${weekdays.includes(weekday.value)}
                  @change=${(ev: Event) => this._toggleWeekday(path, weekday.value, (ev.target as HTMLInputElement).checked)}
                >
                ${weekday.label}
              </label>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private _renderScreenCondition(condition: ScreenCondition, path: ConditionPath): TemplateResult {
    return html`
      <div class="condition-fields">
        ${this._renderTextField("Media query", condition.media_query ?? "", (value) => this._updateCondition(path, { media_query: value || undefined }))}
      </div>
    `;
  }

  private _renderViewColumnsCondition(condition: ViewColumnsCondition, path: ConditionPath): TemplateResult {
    return html`
      <div class="condition-fields">
        ${this._renderNumberField("Minimum columns", condition.min, (value) => this._updateCondition(path, { min: value }))}
        ${this._renderNumberField("Maximum columns", condition.max, (value) => this._updateCondition(path, { max: value }))}
      </div>
    `;
  }

  private _renderLogicalCondition(condition: AndCondition | OrCondition | NotCondition, path: ConditionPath): TemplateResult {
    const conditions = condition.conditions ?? [];

    return html`
      <div class="nested-conditions">
        ${conditions.length === 0
          ? html`<p class="section-description">No nested condition configured.</p>`
          : conditions.map((nestedCondition, index) => this._renderCondition(nestedCondition, [...path, index], true))}
        <button
          class="action-button condition-button"
          type="button"
          @click=${() => this._addCondition(path)}
        >
          Add nested condition
        </button>
      </div>
    `;
  }

  /****************************************************/
  /* Private methods - field rendering                */
  /****************************************************/

  private _renderTextField(
    label: string,
    value: string,
    onChange: (value: string) => void,
    type = "text",
  ): TemplateResult {
    return html`
      <div class="condition-field">
        <label>${label}</label>
        <input
          type=${type}
          .value=${value}
          @input=${(ev: Event) => onChange((ev.target as HTMLInputElement).value)}
        >
      </div>
    `;
  }

  private _renderNumberField(
    label: string,
    value: string | number | undefined,
    onChange: (value: number | undefined) => void,
  ): TemplateResult {
    return html`
      <div class="condition-field">
        <label>${label}</label>
        <input
          type="number"
          step="any"
          .value=${value == null ? "" : String(value)}
          @input=${(ev: Event) => {
            const inputValue = (ev.target as HTMLInputElement).value;
            onChange(inputValue === "" ? undefined : Number(inputValue));
          }}
        >
      </div>
    `;
  }

  /****************************************************/
  /* Private methods - conditions management          */
  /****************************************************/

  private _addCondition(parentPath: ConditionPath): void {
    const conditions = this._cloneConditions();

    if (parentPath.length === 0) {
      conditions.push(this._createDefaultCondition("state"));
    } else {
      const parentCondition = this._getConditionAtPath(conditions, parentPath);
      if (!this._isLogicalCondition(parentCondition)) {
        return;
      }
      parentCondition.conditions = [
        ...(parentCondition.conditions ?? []),
        this._createDefaultCondition("state"),
      ];
    }

    this._emitConditionsChanged(conditions);
  }

  private _removeCondition(path: ConditionPath): void {
    const conditions = this._cloneConditions();
    const parentConditions = this._getParentConditionsAtPath(conditions, path);
    parentConditions.splice(path[path.length - 1], 1);
    this._emitConditionsChanged(conditions);
  }

  /****************************************************/
  /* Private methods - conditions updates             */
  /****************************************************/

  private _changeConditionType(path: ConditionPath, type: EditableConditionType): void {
    const conditions = this._cloneConditions();
    const parentConditions = this._getParentConditionsAtPath(conditions, path);
    parentConditions[path[path.length - 1]] = this._createDefaultCondition(type);
    this._emitConditionsChanged(conditions);
  }

  private _updateCondition(path: ConditionPath, patch: Partial<Condition>): void {
    const conditions = this._cloneConditions();
    const condition = this._getConditionAtPath(conditions, path);
    Object.assign(condition, patch);
    this._emitConditionsChanged(conditions);
  }

  private _changeStateMode(path: ConditionPath, mode: "state" | "state_not"): void {
    const conditions = this._cloneConditions();
    const condition = this._getConditionAtPath(conditions, path) as StateCondition;
    const currentValue = condition.state ?? condition.state_not ?? "";

    delete condition.state;
    delete condition.state_not;
    condition[mode] = currentValue;

    this._emitConditionsChanged(conditions);
  }

  private _updateStateValue(path: ConditionPath, mode: "state" | "state_not", value: string): void {
    const parsedValue = value.includes(",")
      ? value.split(",").map((item) => item.trim()).filter((item) => item !== "")
      : value || undefined;
    this._updateCondition(path, { [mode]: parsedValue } as Partial<StateCondition>);
  }

  private _toggleWeekday(path: ConditionPath, weekday: WeekdayShort, checked: boolean): void {
    const conditions = this._cloneConditions();
    const condition = this._getConditionAtPath(conditions, path) as TimeCondition;
    const weekdays = new Set(condition.weekdays ?? []);

    if (checked) {
      weekdays.add(weekday);
    } else {
      weekdays.delete(weekday);
    }

    condition.weekdays = weekdays.size > 0 ? Array.from(weekdays) : undefined;
    this._emitConditionsChanged(conditions);
  }

  /****************************************************/
  /* Private methods - event management               */
  /****************************************************/

  private _handleHaConditionsChanged = (ev: ConditionsChangedEvent): void => {
    ev.stopPropagation();
    this._emitConditionsChanged(ev.detail.value ?? ev.detail.conditions ?? []);
  };

  private async _loadHaConditionsEditor(): Promise<void> {
    if (customElements.get("ha-card-conditions-editor")) {
      this._hasHaConditionsEditor = true;
      return;
    }

    try {
      const conditionalCard = await this._loadConditionalCardConstructor();
      await conditionalCard?.getConfigElement?.();
    } catch {
      // Keep the local fallback editor if Home Assistant cannot load its internal editor.
    }

    this._hasHaConditionsEditor = customElements.get("ha-card-conditions-editor") !== undefined;
  }

  private async _loadConditionalCardConstructor(): Promise<ConditionalCardConstructor | undefined> {
    const conditionalCard = customElements.get("hui-conditional-card") as ConditionalCardConstructor | undefined;
    if (conditionalCard) {
      return conditionalCard;
    }

    const loadCardHelpers = (window as HomeAssistantWindow).loadCardHelpers;
    if (!loadCardHelpers) {
      return undefined;
    }

    const helpers = await loadCardHelpers();
    helpers.createCardElement?.({
      type: "conditional",
      conditions: [],
      card: { type: "entities", entities: [] },
    });
    await customElements.whenDefined("hui-conditional-card");
    return customElements.get("hui-conditional-card") as ConditionalCardConstructor | undefined;
  }

  private _cloneConditions(): Condition[] {
    return structuredClone(this.conditions ?? []);
  }

  private _emitConditionsChanged(conditions: Condition[]): void {
    this.dispatchEvent(new CustomEvent("conditions-changed", {
      bubbles: true,
      composed: true,
      detail: { conditions },
    }));
  }

  /****************************************************/
  /* Private methods - conditions path management     */
  /****************************************************/

  private _getConditionAtPath(conditions: Condition[], path: ConditionPath): Condition {
    let currentConditions = conditions;
    let currentCondition: Condition | undefined;

    for (const index of path) {
      currentCondition = currentConditions[index];
      if (!currentCondition) {
        throw new Error("Condition path is invalid");
      }
      currentConditions = this._isLogicalCondition(currentCondition)
        ? currentCondition.conditions ?? []
        : [];
    }

    if (!currentCondition) {
      throw new Error("Condition path is empty");
    }
    return currentCondition;
  }

  private _getParentConditionsAtPath(conditions: Condition[], path: ConditionPath): Condition[] {
    if (path.length === 1) {
      return conditions;
    }

    const parentCondition = this._getConditionAtPath(conditions, path.slice(0, -1));
    if (!this._isLogicalCondition(parentCondition)) {
      throw new Error("Condition parent is not logical");
    }
    parentCondition.conditions ??= [];
    return parentCondition.conditions;
  }

  /****************************************************/
  /* Private methods - condition helpers              */
  /****************************************************/

  private _createDefaultCondition(type: EditableConditionType): Condition {
    switch (type) {
      case "numeric_state":
        return { condition: "numeric_state", entity: "", above: 0 };
      case "time":
        return { condition: "time", after: "00:00" };
      case "screen":
        return { condition: "screen", media_query: "(min-width: 768px)" };
      case "view_columns":
        return { condition: "view_columns", min: 1 };
      case "and":
      case "or":
      case "not":
        return { condition: type, conditions: [] } as AndCondition | OrCondition | NotCondition;
      case "state":
      default:
        return { condition: "state", entity: "", state: "" };
    }
  }

  private _isLogicalCondition(condition: Condition): condition is AndCondition | OrCondition | NotCondition {
    return condition.condition === "and" || condition.condition === "or" || condition.condition === "not";
  }

  private _getConditionTypeOption(type: EditableConditionType) {
    return CONDITION_TYPE_OPTIONS.find((option) => option.value === type) ?? CONDITION_TYPE_OPTIONS[0];
  }

  private _conditionValueToText(value: StateCondition["state"] | StateCondition["state_not"]): string {
    return Array.isArray(value) ? value.join(", ") : value ?? "";
  }
}
