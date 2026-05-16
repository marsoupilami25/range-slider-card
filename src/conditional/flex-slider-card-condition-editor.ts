import type { HomeAssistant } from "custom-card-helpers";
import { css, html, LitElement, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HaFormSchema } from "../type/ha";
import {
  checkConditionsMet,
  validateConditionalConfig,
  type AndCondition,
  type Condition,
  type NotCondition,
  type NumericStateCondition,
  type OrCondition,
  type ScreenCondition,
  type StateCondition,
  type TimeCondition,
  type ViewColumnsCondition,
} from "./flex-slider-card-validate-condition";

type EditableConditionType = Condition["condition"];
type ConditionPath = number[];

const CONDITION_TYPE_OPTIONS: Array<{ value: EditableConditionType; label: string; icon: string }> = [
  { value: "state", label: "State", icon: "mdi:state-machine" },
  { value: "numeric_state", label: "Numeric state", icon: "mdi:numeric" },
  { value: "time", label: "Time", icon: "mdi:calendar-clock" },
  { value: "screen", label: "Screen", icon: "mdi:responsive" },
  { value: "view_columns", label: "View columns", icon: "mdi:view-column-outline" },
  { value: "and", label: "AND", icon: "mdi:ampersand" },
  { value: "or", label: "OR", icon: "mdi:gate-or" },
  { value: "not", label: "Not", icon: "mdi:not-equal-variant" },
];

const WEEKDAYS_SHORT = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const WEEKDAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
const BREAKPOINT_VALUES = [0, 768, 1024, 1280, Infinity] as const;
const BREAKPOINTS = ["mobile", "tablet", "desktop", "wide"] as const;
const HIDDEN_CONDITION_ATTRIBUTES = new Set(["editable", "friendly_name"]);

type Breakpoint = (typeof BREAKPOINTS)[number];
type BreakpointSize = [number, number];
type StateConditionFormData = Omit<StateCondition, "state" | "state_not"> & {
  invert: "false" | "true";
  state?: StateCondition["state"];
};
type ScreenConditionFormData = {
  breakpoints: Breakpoint[];
};

const ENTITY_SCHEMA: HaFormSchema = { name: "entity", selector: { entity: {} } };
const STATE_VALUE_SCHEMA: HaFormSchema = {
  type: "grid",
  name: "",
  schema: [
    {
      name: "invert",
      required: true,
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { value: "false", label: "State is" },
            { value: "true", label: "State is not" },
          ],
        },
      },
    },
    {
      name: "state",
      selector: { state: {} },
      context: {
        filter_entity: "entity",
        filter_attribute: "attribute",
      },
    },
  ],
};
const NUMERIC_STATE_THRESHOLD_SCHEMA: HaFormSchema = {
  type: "grid",
  name: "",
  schema: [
    { name: "above", selector: { number: { step: "any", mode: "box" } } },
    { name: "below", selector: { number: { step: "any", mode: "box" } } },
  ],
};

function getConditionAttributeSchema(entityId: string | undefined, hass?: HomeAssistant): HaFormSchema {
  const attributeOptions = entityId
    ? Object.keys(hass?.states[entityId]?.attributes ?? {})
      .filter((attribute) => !HIDDEN_CONDITION_ATTRIBUTES.has(attribute))
      .map((attribute) => ({
        value: attribute,
        label: getAttributeLabel(attribute, entityId, hass),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
    : [];

  return {
    name: "attribute",
    selector: {
      select: {
        mode: "dropdown",
        custom_value: true,
        options: attributeOptions,
      },
    },
  };
}

function getAttributeLabel(attribute: string, entityId: string, hass?: HomeAssistant): string {
  const domain = entityId.split(".")[0];
  const localizeKeys = [
    `component.${domain}.entity_component._.state_attributes.${attribute}.name`,
    `component.${domain}.state_attributes.${attribute}.name`,
    `component.homeassistant.entity_component._.state_attributes.${attribute}.name`,
  ];

  for (const key of localizeKeys) {
    const label = hass?.localize(key);
    if (label) {
      return label;
    }
  }

  return attribute
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function getStateConditionSchema(entityId: string | undefined, hass?: HomeAssistant): HaFormSchema[] {
  return [
    ENTITY_SCHEMA,
    getConditionAttributeSchema(entityId, hass),
    STATE_VALUE_SCHEMA,
  ];
}

function getNumericStateConditionSchema(entityId: string | undefined, hass?: HomeAssistant): HaFormSchema[] {
  return [
    ENTITY_SCHEMA,
    getConditionAttributeSchema(entityId, hass),
    NUMERIC_STATE_THRESHOLD_SCHEMA,
  ];
}

const TIME_CONDITION_SCHEMA: HaFormSchema[] = [
  { name: "after", selector: { time: { no_second: true } } },
  { name: "before", selector: { time: { no_second: true } } },
  {
    name: "weekdays",
    selector: {
      select: {
        mode: "list",
        multiple: true,
        options: WEEKDAYS_SHORT.map((day) => ({
          value: day,
          label: WEEKDAY_LABELS[day],
        })),
      },
    },
  },
];

const SCREEN_CONDITION_SCHEMA: HaFormSchema[] = [
  {
    name: "breakpoints",
    selector: {
      select: {
        mode: "list",
        multiple: true,
        options: BREAKPOINTS.map((breakpoint) => {
          const value = BREAKPOINT_VALUES[BREAKPOINTS.indexOf(breakpoint)];
          return {
            value: breakpoint,
            label: value === 0 ? "Mobile" : `${capitalize(breakpoint)} (${value}px and up)`,
          };
        }),
      },
    },
  },
];

const VIEW_COLUMNS_CONDITION_SCHEMA: HaFormSchema[] = [
  {
    type: "grid",
    name: "",
    schema: [
      { name: "min", selector: { number: { mode: "box", min: 1 } } },
      { name: "max", selector: { number: { mode: "box", min: 1 } } },
    ],
  },
];

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function getBreakpointCombinations(): Breakpoint[][] {
  return BREAKPOINTS.reduce<Breakpoint[][]>(
    (combinations, breakpoint) => [
      ...combinations,
      ...combinations.map((combination) => [...combination, breakpoint]),
    ],
    [[]],
  ).filter((combination) => combination.length > 0);
}

function mergeConsecutiveRanges(ranges: BreakpointSize[]): BreakpointSize[] {
  if (ranges.length === 0) {
    return [];
  }

  const sortedRanges = [...ranges].sort((a, b) => a[0] - b[0]);
  const mergedRanges: BreakpointSize[] = [sortedRanges[0]];

  for (let index = 1; index < sortedRanges.length; index += 1) {
    const currentRange = sortedRanges[index];
    const previousRange = mergedRanges[mergedRanges.length - 1];

    if (currentRange[0] <= previousRange[1] + 1) {
      previousRange[1] = currentRange[1];
    } else {
      mergedRanges.push(currentRange);
    }
  }

  return mergedRanges;
}

function buildMediaQuery(size: BreakpointSize): string {
  const [min, max] = size;
  const query: string[] = [];
  if (min != null) {
    query.push(`(min-width: ${min}px)`);
  }
  if (max != null && max !== Infinity) {
    query.push(`(max-width: ${max - 1}px)`);
  }
  return query.join(" and ");
}

function computeBreakpointsKey(breakpoints: Breakpoint[]): string {
  return [...breakpoints].sort().join("_");
}

function computeBreakpointsMediaQuery(breakpoints: Breakpoint[]): string {
  const sizes = breakpoints.map<BreakpointSize>((breakpoint) => {
    const index = BREAKPOINTS.indexOf(breakpoint);
    return [BREAKPOINT_VALUES[index], BREAKPOINT_VALUES[index + 1] || Infinity];
  });

  return mergeConsecutiveRanges(sizes)
    .map((size) => buildMediaQuery(size))
    .filter((query) => query !== "")
    .join(", ");
}

const MEDIA_QUERY_MAP = new Map(
  getBreakpointCombinations().map((breakpoints) => [
    computeBreakpointsKey(breakpoints),
    computeBreakpointsMediaQuery(breakpoints),
  ]),
);
const MEDIA_QUERY_REVERSE_MAP = new Map(
  [...MEDIA_QUERY_MAP.entries()].map(([key, value]) => [
    value,
    key.split("_").filter(Boolean) as Breakpoint[],
  ]),
);

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
  private _openActionMenuPath?: string;

  @state()
  private _openConditionPaths?: string[];

  @state()
  private _clipboard?: Condition;

  @state()
  private _testingResults: Record<string, boolean> = {};

  private _testingTimeouts = new Map<string, number>();

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
      gap: 12px;
    }

    .condition-panel {
      position: relative;
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      background: var(--card-background-color, var(--ha-card-background, white));
    }

    .condition-panel.nested {
      border-radius: 8px;
    }

    .testing {
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      z-index: 1;
      overflow: hidden;
      max-height: 100px;
      border-top-right-radius: calc(var(--ha-card-border-radius, 12px) - 1px);
      border-top-left-radius: calc(var(--ha-card-border-radius, 12px) - 1px);
      padding: 4px 8px;
      background: var(--divider-color);
      color: var(--text-primary-color);
      font-size: var(--ha-font-size-m, 14px);
      font-weight: var(--ha-font-weight-bold, 700);
      line-height: 20px;
      text-align: center;
      text-transform: uppercase;
      pointer-events: none;
    }

    .testing.pass {
      background: var(--success-color);
    }

    .testing.error {
      background: var(--accent-color);
    }

    .condition-summary {
      display: grid;
      grid-template-columns: 32px minmax(0, 1fr) auto;
      align-items: center;
      min-height: 48px;
      padding: 0 4px 0 8px;
      color: var(--primary-text-color);
      cursor: pointer;
      list-style: none;
    }

    .condition-summary::-webkit-details-marker {
      display: none;
    }

    .condition-chevron {
      color: var(--secondary-text-color);
      transition: transform 120ms ease;
    }

    .condition-panel[open] > .condition-summary .condition-chevron {
      transform: rotate(90deg);
    }

    .condition-leading-icon {
      display: none;
      color: var(--secondary-text-color);
      opacity: 0.9;
    }

    .condition-title {
      min-width: 0;
      margin: 0;
      font: inherit;
      font-weight: inherit;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .condition-content {
      padding: 12px;
    }

    .condition-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }

    .condition-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
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
      min-height: 40px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
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
      gap: 12px;
    }

    .condition-actions {
      position: relative;
      display: inline-flex;
      justify-content: flex-end;
    }

    .icon-action-button {
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 50%;
      padding: 0;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
    }

    .icon-action-button:hover {
      background: var(--secondary-background-color);
    }

    .action-menu {
      position: absolute;
      top: 40px;
      right: 4px;
      z-index: 10;
      min-width: 160px;
      padding: 0;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color, var(--ha-card-background, white));
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px 0 rgba(0, 0, 0, 0.16));
      overflow: hidden;
    }

    .action-menu button,
    .add-menu-item {
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr);
      align-items: center;
      gap: 12px;
      width: 100%;
      border: none;
      padding: 12px 16px;
      background: transparent;
      color: var(--primary-text-color);
      font: inherit;
      text-align: left;
      cursor: pointer;
    }

    .action-menu button:hover,
    .add-menu-item:hover {
      background: var(--secondary-background-color);
    }

    .action-menu button.danger {
      color: var(--error-color);
    }

    .add-menu {
      position: relative;
      display: inline-block;
      width: fit-content;
    }

    .add-menu summary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 36px;
      box-sizing: border-box;
      border: none;
      border-radius: 6px;
      padding: 0 16px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
      list-style: none;
    }

    .add-menu summary::-webkit-details-marker {
      display: none;
    }

    .add-menu-panel {
      position: absolute;
      left: 0;
      bottom: calc(100% + 4px);
      z-index: 20;
      min-width: 220px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color, var(--ha-card-background, white));
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px 0 rgba(0, 0, 0, 0.16));
      overflow: hidden;
    }

    .nested-conditions .add-menu-panel {
      top: calc(100% + 4px);
      bottom: auto;
    }

    @media (min-width: 870px) {
      .condition-summary {
        grid-template-columns: 32px 32px minmax(0, 1fr) auto;
      }

      .condition-leading-icon {
        display: inline-flex;
      }
    }
  `;

  /****************************************************/
  /* Public methods - Lit Element                     */
  /****************************************************/

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearTestingResults();
  }

  protected override render(): TemplateResult {
    if (!this.hass) {
      return html``;
    }

    const conditions = this.conditions ?? [];

    return html`
      <div class="conditions-editor">
        <div class="conditions-list">
          ${conditions.map((condition, index) => this._renderCondition(condition, [index], false))}
        </div>
        ${this._renderAddConditionMenu([], "Add condition")}
      </div>
    `;
  }

  /****************************************************/
  /* Private methods - rendering                      */
  /****************************************************/

  private _renderCondition(condition: Condition, path: ConditionPath, nested: boolean): TemplateResult {
    const option = this._getConditionTypeOption(condition.condition);
    const pathKey = this._getPathKey(path);
    const isActionMenuOpen = this._openActionMenuPath === pathKey;
    const isOpen = this._openConditionPaths === undefined
      ? !nested && (this.conditions?.length ?? 0) === 1
      : this._openConditionPaths.includes(pathKey);
    const testingResult = this._testingResults[pathKey];

    return html`
      <details
        class="condition-panel ${nested ? "nested" : ""}"
        ?open=${isOpen}
        @toggle=${(ev: Event) => this._handleConditionToggle(ev, path)}
      >
        ${testingResult === undefined
          ? nothing
          : html`
              <div class="testing ${testingResult ? "pass" : "error"}">
                ${testingResult ? "Condition passes" : "Condition does not pass"}
              </div>
            `}
        <summary class="condition-summary">
          <ha-icon class="condition-chevron" icon="mdi:chevron-right"></ha-icon>
          <ha-icon class="condition-leading-icon" .icon=${option.icon}></ha-icon>
          <h3 class="condition-title">${option.label}</h3>
          <span class="condition-actions" @click=${this._stopPropagation}>
            <button
              class="icon-action-button"
              type="button"
              aria-label="Condition actions"
              @click=${(ev: Event) => this._toggleActionMenu(ev, path)}
            >
              <ha-icon icon="mdi:dots-vertical"></ha-icon>
            </button>
            ${isActionMenuOpen
              ? html`
                  <div class="action-menu">
                    <button type="button" @click=${() => this._testCondition(path)}>
                      <ha-icon icon="mdi:flask"></ha-icon>
                      <span>Test</span>
                    </button>
                    <button type="button" @click=${() => this._duplicateCondition(path)}>
                      <ha-icon icon="mdi:content-duplicate"></ha-icon>
                      <span>Duplicate</span>
                    </button>
                    <button type="button" @click=${() => this._copyCondition(path)}>
                      <ha-icon icon="mdi:content-copy"></ha-icon>
                      <span>Copy</span>
                    </button>
                    <button type="button" @click=${() => this._cutCondition(path)}>
                      <ha-icon icon="mdi:content-cut"></ha-icon>
                      <span>Cut</span>
                    </button>
                    <button class="danger" type="button" @click=${() => this._removeCondition(path)}>
                      <ha-icon icon="mdi:delete"></ha-icon>
                      <span>Delete</span>
                    </button>
                  </div>
                `
              : nothing}
          </span>
        </summary>
        <div class="condition-content">
          ${this._renderConditionFields(condition, path)}
        </div>
      </details>
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

  private _renderAddConditionMenu(parentPath: ConditionPath, label: string): TemplateResult {
    return html`
      <details class="add-menu">
        <summary>
          <ha-icon icon="mdi:plus"></ha-icon>
          <span>${label}</span>
        </summary>
        <div class="add-menu-panel">
          ${this._clipboard
            ? html`
                <button
                  class="add-menu-item"
                  type="button"
                  @click=${(ev: Event) => this._pasteConditionFromMenu(ev, parentPath)}
                >
                  <ha-icon icon="mdi:content-paste"></ha-icon>
                  <span>Paste</span>
                </button>
              `
            : nothing}
          ${CONDITION_TYPE_OPTIONS.map((option) => html`
            <button
              class="add-menu-item"
              type="button"
              @click=${(ev: Event) => this._addConditionFromMenu(ev, parentPath, option.value)}
            >
              <ha-icon .icon=${option.icon}></ha-icon>
              <span>${option.label}</span>
            </button>
          `)}
        </div>
      </details>
    `;
  }

  /****************************************************/
  /* Private methods - condition type rendering       */
  /****************************************************/

  private _renderStateCondition(condition: StateCondition, path: ConditionPath): TemplateResult {
    const mode = condition.state_not != null ? "state_not" : "state";
    const value = mode === "state_not" ? condition.state_not : condition.state;
    const data: StateConditionFormData = {
      condition: "state",
      entity: condition.entity,
      attribute: condition.attribute,
      invert: mode === "state_not" ? "true" : "false",
      state: value,
    };

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${getStateConditionSchema(condition.entity, this.hass)}
        .computeLabel=${this._computeStateLabel}
        @value-changed=${(ev: CustomEvent) => this._handleStateConditionChanged(ev, path)}
      ></ha-form>
    `;
  }

  private _renderNumericStateCondition(condition: NumericStateCondition, path: ConditionPath): TemplateResult {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${condition}
        .schema=${getNumericStateConditionSchema(condition.entity, this.hass)}
        .computeLabel=${this._computeNumericStateLabel}
        @value-changed=${(ev: CustomEvent) => this._handleNumericStateConditionChanged(ev, path)}
      ></ha-form>
    `;
  }

  private _renderTimeCondition(condition: TimeCondition, path: ConditionPath): TemplateResult {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${condition}
        .schema=${TIME_CONDITION_SCHEMA}
        .computeLabel=${this._computeTimeLabel}
        @value-changed=${(ev: CustomEvent) => this._handleTimeConditionChanged(ev, path)}
      ></ha-form>
    `;
  }

  private _renderScreenCondition(condition: ScreenCondition, path: ConditionPath): TemplateResult {
    const data: ScreenConditionFormData = {
      breakpoints: this._getBreakpointsFromMediaQuery(condition.media_query),
    };

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${SCREEN_CONDITION_SCHEMA}
        .computeLabel=${this._computeScreenLabel}
        @value-changed=${(ev: CustomEvent) => this._handleScreenConditionChanged(ev, path)}
      ></ha-form>
    `;
  }

  private _renderViewColumnsCondition(condition: ViewColumnsCondition, path: ConditionPath): TemplateResult {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${condition}
        .schema=${VIEW_COLUMNS_CONDITION_SCHEMA}
        .computeLabel=${this._computeViewColumnsLabel}
        @value-changed=${(ev: CustomEvent) => this._handleViewColumnsConditionChanged(ev, path)}
      ></ha-form>
    `;
  }

  private _renderLogicalCondition(condition: AndCondition | OrCondition | NotCondition, path: ConditionPath): TemplateResult {
    const conditions = condition.conditions ?? [];

    return html`
      <div class="nested-conditions">
        ${conditions.length === 0
          ? html`<p class="section-description">No nested condition configured.</p>`
          : conditions.map((nestedCondition, index) => this._renderCondition(nestedCondition, [...path, index], true))}
        ${this._renderAddConditionMenu(path, "Add nested condition")}
      </div>
    `;
  }

  /****************************************************/
  /* Private methods - form updates                   */
  /****************************************************/

  private _handleStateConditionChanged(ev: CustomEvent, path: ConditionPath): void {
    ev.stopPropagation();
    const data = ev.detail.value as StateConditionFormData;
    const stateValue = data.state;
    const nextCondition: StateCondition = {
      condition: "state",
      entity: this._emptyToUndefined(data.entity),
      attribute: this._emptyToUndefined(data.attribute),
      state: data.invert === "false" ? stateValue ?? "" : undefined,
      state_not: data.invert === "true" ? stateValue ?? "" : undefined,
    };

    this._replaceCondition(path, this._cleanStateCondition(nextCondition));
  }

  private _handleNumericStateConditionChanged(ev: CustomEvent, path: ConditionPath): void {
    ev.stopPropagation();
    const data = ev.detail.value as NumericStateCondition;
    this._replaceCondition(path, this._cleanNumericStateCondition({
      ...data,
      condition: "numeric_state",
    }));
  }

  private _handleTimeConditionChanged(ev: CustomEvent, path: ConditionPath): void {
    ev.stopPropagation();
    const data = ev.detail.value as TimeCondition;
    this._replaceCondition(path, this._cleanTimeCondition({
      ...data,
      condition: "time",
    }));
  }

  private _handleScreenConditionChanged(ev: CustomEvent, path: ConditionPath): void {
    ev.stopPropagation();
    const data = ev.detail.value as ScreenConditionFormData;
    this._replaceCondition(path, {
      condition: "screen",
      media_query: this._getMediaQueryFromBreakpoints(data.breakpoints ?? []),
    });
  }

  private _handleViewColumnsConditionChanged(ev: CustomEvent, path: ConditionPath): void {
    ev.stopPropagation();
    const data = ev.detail.value as ViewColumnsCondition;
    this._replaceCondition(path, this._cleanViewColumnsCondition({
      ...data,
      condition: "view_columns",
    }));
  }

  private _computeStateLabel = (schema: HaFormSchema): string => {
    switch (schema.name) {
      case "entity":
        return "Entity";
      case "attribute":
        return "Attribute";
      case "invert":
        return "";
      case "state":
        return "State";
      default:
        return "";
    }
  };

  private _computeNumericStateLabel = (schema: HaFormSchema): string => {
    switch (schema.name) {
      case "entity":
        return "Entity";
      case "attribute":
        return "Attribute";
      case "above":
        return "Above";
      case "below":
        return "Below";
      default:
        return "";
    }
  };

  private _computeTimeLabel = (schema: HaFormSchema): string => {
    switch (schema.name) {
      case "after":
        return "After";
      case "before":
        return "Before";
      case "weekdays":
        return "Weekdays";
      default:
        return "";
    }
  };

  private _computeScreenLabel = (schema: HaFormSchema): string => {
    return schema.name === "breakpoints" ? "Breakpoints" : "";
  };

  private _computeViewColumnsLabel = (schema: HaFormSchema): string => {
    switch (schema.name) {
      case "min":
        return "Minimum columns";
      case "max":
        return "Maximum columns";
      default:
        return "";
    }
  };

  /****************************************************/
  /* Private methods - conditions management          */
  /****************************************************/

  private _testCondition(path: ConditionPath): void {
    if (!this.hass) {
      return;
    }

    const conditions = this._cloneConditions();
    const condition = this._getConditionAtPath(conditions, path);
    const pathKey = this._getPathKey(path);
    const testingResult = validateConditionalConfig([condition])
      ? checkConditionsMet([condition], this.hass, {})
      : false;

    const existingTimeout = this._testingTimeouts.get(pathKey);
    if (existingTimeout !== undefined) {
      window.clearTimeout(existingTimeout);
    }

    this._testingResults = {
      ...this._testingResults,
      [pathKey]: testingResult,
    };
    this._openActionMenuPath = undefined;

    const timeout = window.setTimeout(() => {
      const { [pathKey]: _testingResult, ...nextTestingResults } = this._testingResults;
      this._testingResults = nextTestingResults;
      this._testingTimeouts.delete(pathKey);
    }, 2500);
    this._testingTimeouts.set(pathKey, timeout);
  }

  private _addConditionFromMenu(ev: Event, parentPath: ConditionPath, type: EditableConditionType): void {
    const menu = (ev.currentTarget as HTMLElement).closest("details");
    if (menu) {
      menu.open = false;
    }
    this._addCondition(parentPath, type);
  }

  private _pasteConditionFromMenu(ev: Event, parentPath: ConditionPath): void {
    const menu = (ev.currentTarget as HTMLElement).closest("details");
    if (menu) {
      menu.open = false;
    }
    if (!this._clipboard) {
      return;
    }
    this._insertCondition(parentPath, structuredClone(this._clipboard));
  }

  private _addCondition(parentPath: ConditionPath, type: EditableConditionType): void {
    this._insertCondition(parentPath, this._createDefaultCondition(type));
  }

  private _insertCondition(parentPath: ConditionPath, condition: Condition): void {
    const conditions = this._cloneConditions();
    let newConditionPath: ConditionPath;

    if (parentPath.length === 0) {
      conditions.push(condition);
      newConditionPath = [conditions.length - 1];
    } else {
      const parentCondition = this._getConditionAtPath(conditions, parentPath);
      if (!this._isLogicalCondition(parentCondition)) {
        return;
      }
      parentCondition.conditions = [
        ...(parentCondition.conditions ?? []),
        condition,
      ];
      newConditionPath = [...parentPath, parentCondition.conditions.length - 1];
    }

    this._openConditionPaths = this._getPathKeysWithAncestors(newConditionPath);
    this._openActionMenuPath = undefined;
    this._emitConditionsChanged(conditions);
  }

  private _duplicateCondition(path: ConditionPath): void {
    const conditions = this._cloneConditions();
    const condition = structuredClone(this._getConditionAtPath(conditions, path));
    const parentConditions = this._getParentConditionsAtPath(conditions, path);
    parentConditions.splice(path[path.length - 1] + 1, 0, condition);
    this._openActionMenuPath = undefined;
    this._emitConditionsChanged(conditions);
  }

  private _copyCondition(path: ConditionPath): void {
    const conditions = this._cloneConditions();
    this._clipboard = structuredClone(this._getConditionAtPath(conditions, path));
    this._openActionMenuPath = undefined;
  }

  private _cutCondition(path: ConditionPath): void {
    const conditions = this._cloneConditions();
    this._clipboard = structuredClone(this._getConditionAtPath(conditions, path));
    const parentConditions = this._getParentConditionsAtPath(conditions, path);
    parentConditions.splice(path[path.length - 1], 1);
    this._openActionMenuPath = undefined;
    this._openConditionPaths = undefined;
    this._emitConditionsChanged(conditions);
  }

  private _removeCondition(path: ConditionPath): void {
    const conditions = this._cloneConditions();
    const parentConditions = this._getParentConditionsAtPath(conditions, path);
    parentConditions.splice(path[path.length - 1], 1);
    this._openActionMenuPath = undefined;
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

  private _replaceCondition(path: ConditionPath, nextCondition: Condition): void {
    const conditions = this._cloneConditions();
    const parentConditions = this._getParentConditionsAtPath(conditions, path);
    parentConditions[path[path.length - 1]] = nextCondition;
    this._emitConditionsChanged(conditions);
  }

  /****************************************************/
  /* Private methods - event management               */
  /****************************************************/

  private _toggleActionMenu(ev: Event, path: ConditionPath): void {
    ev.stopPropagation();
    const pathKey = this._getPathKey(path);
    this._openActionMenuPath = this._openActionMenuPath === pathKey ? undefined : pathKey;
  }

  private _handleConditionToggle(ev: Event, path: ConditionPath): void {
    if (ev.target !== ev.currentTarget) {
      return;
    }

    const details = ev.currentTarget as HTMLDetailsElement;
    const pathKey = this._getPathKey(path);

    if (details.open) {
      this._openConditionPaths = this._getPathKeysWithAncestors(path);
      this._openActionMenuPath = undefined;
    } else if (this._openConditionPaths?.includes(pathKey)) {
      this._openConditionPaths = this._openConditionPaths.filter((openPathKey) =>
        openPathKey !== pathKey && !openPathKey.startsWith(`${pathKey}.`)
      );
    }
  }

  private _stopPropagation(ev: Event): void {
    ev.stopPropagation();
  }

  private _cloneConditions(): Condition[] {
    return structuredClone(this.conditions ?? []);
  }

  private _emitConditionsChanged(conditions: Condition[]): void {
    this._clearTestingResults();
    this.dispatchEvent(new CustomEvent("conditions-changed", {
      bubbles: true,
      composed: true,
      detail: { conditions },
    }));
  }

  private _clearTestingResults(): void {
    for (const timeout of this._testingTimeouts.values()) {
      window.clearTimeout(timeout);
    }
    this._testingTimeouts.clear();
    this._testingResults = {};
  }

  /****************************************************/
  /* Private methods - conditions path management     */
  /****************************************************/

  private _getPathKey(path: ConditionPath): string {
    return path.join(".");
  }

  private _getPathKeysWithAncestors(path: ConditionPath): string[] {
    return path.map((_, index) => this._getPathKey(path.slice(0, index + 1)));
  }

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

  private _emptyToUndefined(value: string | undefined): string | undefined {
    return value === "" ? undefined : value;
  }

  private _cleanStateCondition(condition: StateCondition): StateCondition {
    const nextCondition: StateCondition = { ...condition };

    if (!nextCondition.entity) {
      delete nextCondition.entity;
    }
    if (!nextCondition.attribute) {
      delete nextCondition.attribute;
    }
    if (nextCondition.state === undefined) {
      delete nextCondition.state;
    }
    if (nextCondition.state_not === undefined) {
      delete nextCondition.state_not;
    }

    return nextCondition;
  }

  private _cleanNumericStateCondition(condition: NumericStateCondition): NumericStateCondition {
    const nextCondition: NumericStateCondition = {
      ...condition,
      entity: this._emptyToUndefined(condition.entity),
      attribute: this._emptyToUndefined(condition.attribute),
      above: this._emptyNumberToUndefined(condition.above),
      below: this._emptyNumberToUndefined(condition.below),
    };

    if (!nextCondition.entity) {
      delete nextCondition.entity;
    }
    if (!nextCondition.attribute) {
      delete nextCondition.attribute;
    }
    if (nextCondition.above === undefined) {
      delete nextCondition.above;
    }
    if (nextCondition.below === undefined) {
      delete nextCondition.below;
    }

    return nextCondition;
  }

  private _cleanTimeCondition(condition: TimeCondition): TimeCondition {
    const nextCondition: TimeCondition = {
      ...condition,
      after: this._emptyToUndefined(condition.after),
      before: this._emptyToUndefined(condition.before),
      weekdays: condition.weekdays?.length ? condition.weekdays : undefined,
    };

    if (nextCondition.after === undefined) {
      delete nextCondition.after;
    }
    if (nextCondition.before === undefined) {
      delete nextCondition.before;
    }
    if (nextCondition.weekdays === undefined) {
      delete nextCondition.weekdays;
    }

    return nextCondition;
  }

  private _cleanViewColumnsCondition(condition: ViewColumnsCondition): ViewColumnsCondition {
    const nextCondition: ViewColumnsCondition = {
      ...condition,
      min: this._emptyNumberToUndefined(condition.min),
      max: this._emptyNumberToUndefined(condition.max),
    };

    if (nextCondition.min === undefined) {
      delete nextCondition.min;
    }
    if (nextCondition.max === undefined) {
      delete nextCondition.max;
    }

    return nextCondition;
  }

  private _emptyNumberToUndefined<T extends string | number | undefined>(value: T): T | undefined {
    return value === "" ? undefined : value;
  }

  private _getBreakpointsFromMediaQuery(mediaQuery: string | undefined): Breakpoint[] {
    return mediaQuery ? MEDIA_QUERY_REVERSE_MAP.get(mediaQuery) ?? [] : [];
  }

  private _getMediaQueryFromBreakpoints(breakpoints: Breakpoint[]): string {
    return MEDIA_QUERY_MAP.get(computeBreakpointsKey(breakpoints)) ?? "";
  }
}
