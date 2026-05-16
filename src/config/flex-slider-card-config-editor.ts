import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { css, html, LitElement, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  FlexSliderCardConfig,
  FlexSliderCardHandleConfig,
} from "./flex-slider-card-config-type";
import {
  clearLegacyEntityTexts,
  createEmptyLegacyHandle,
  getLegacyHandleText,
  hasEntityTextConflict,
  hasLegacyBubblesTextConfig,
  hasLegacyEntityConfig,
  hasLegacyValuesBarTextConfig,
  setLegacyHandle,
} from "../utils/config-legacy-helpers";
import { HaFormSchema } from "../type/ha";
import {
  adaptiveStateOptionsSchema,
  computeSchema,
  connectEndSchema,
  handleSchema,
  handlesBehaviorSchema,
} from "./flex-slider-card-config-form";
import { flexSliderCardConfigLabels } from "./flex-slider-card-config-labels";
import { FlexSliderCardEntityType, getEntityType } from "../utils/entity-management";
import "../conditional/flex-slider-card-condition-editor";
import type { Condition } from "../conditional/flex-slider-card-validate-condition";

@customElement("flex-slider-card-config-editor")
export class FlexSliderCardConfigEditor extends LitElement implements LovelaceCardEditor {

  /****************************************************/
  /* attributes                                       */
  /****************************************************/

  @state()
  private _config!: FlexSliderCardConfig;

  @state()
  private _error?: string;

  @state()
  private _activeTab: "config" | "entities" = "config";

  @property({ attribute: false })
  public hass!: HomeAssistant;

  /****************************************************/
  /* CSS                                              */
  /****************************************************/

  static override styles = css`
    :host {
      display: block;
    }

    .editor {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .tabs {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 0 12px;
    }

    .tab {
      border: 1px solid var(--divider-color);
      border-bottom: none;
      border-radius: 14px 14px 0 0;
      padding: 10px 16px 9px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease, transform 120ms ease;
      margin-bottom: -1px;
      position: relative;
      z-index: 0;
    }

    .tab[selected] {
      background: var(--card-background-color, var(--ha-card-background, white));
      color: var(--primary-text-color);
      border-color: var(--primary-color);
      z-index: 2;
    }

    .panel {
      border: 1px solid var(--divider-color);
      border-radius: 14px;
      padding: 16px;
      background: var(--card-background-color, var(--ha-card-background, white));
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .section-description {
      margin: 0;
      color: var(--secondary-text-color);
      font-size: 13px;
      line-height: 1.4;
    }

    .section-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .section-tools {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .handle-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .custom-expandable {
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      margin-top: 13px;
      overflow: hidden;
      background: var(--card-background-color, var(--ha-card-background, white));
    }

    .custom-expandable summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px;
      cursor: pointer;
      color: var(--primary-text-color);
      font-weight: 500;
      list-style: none;
    }

    .custom-expandable summary::-webkit-details-marker {
      display: none;
    }

    .custom-expandable-title {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .custom-expandable-arrow {
      color: var(--secondary-text-color);
      margin-right: -4px;
      transition: transform 120ms ease;
    }

    .custom-expandable[open] .custom-expandable-arrow {
      transform: rotate(180deg);
    }

    .custom-expandable-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 12px 12px;
    }

    .handle-card {
      padding: 0;
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

    .action-button[disabled] {
      opacity: 0.5;
      cursor: default;
    }

    .error {
      color: var(--error-color);
      font-size: 14px;
      line-height: 1.5;
    }
  `;

  /****************************************************/
  /* Public methods - Lit Element                     */
  /****************************************************/

  protected override render() {
    if (!this.hass || !this._config) {
      return nothing;
    }

    if (this._error) {
      return html`
        <div class="panel">
          <div class="error">${this._error}</div>
        </div>
      `;
    }

    const entities = this._config.entities ?? [];
    const selectedEntityType = this._getSelectedEntityType(entities);
    const isNumber = selectedEntityType !== FlexSliderCardEntityType.TIME;
    const isVertical = this._config.orientation === "vertical";
    const isCompact = this._config.format === "compact";
    const schema: HaFormSchema[] = computeSchema(
      this._config.valuesbaractive === true,
      this._config.bubblesactive === true,
      this._config.ticksactive === true,
      this._config.referenceactive === true,
      this._config.adaptivestateactive === true,
      this._config.reference?.bubble === true,
      this._config.reference?.valuesbar === true,
      this._config.valuesbar?.digits ?? "",
      this._config.bubbles?.digits ?? "",
      this._config.ticks?.digits ?? "",
      isNumber,
      isVertical,
      isCompact,
      selectedEntityType,
    );

    return html`
      <div class="editor">
        <div class="tabs" role="tablist" aria-label="Editor sections">
          <button
            class="tab"
            type="button"
            role="tab"
            ?selected=${this._activeTab === "config"}
            aria-selected=${String(this._activeTab === "config")}
            @click=${() => this._selectTab("config")}
          >
            Config
          </button>
          <button
            class="tab"
            type="button"
            role="tab"
            ?selected=${this._activeTab === "entities"}
            aria-selected=${String(this._activeTab === "entities")}
            @click=${() => this._selectTab("entities")}
          >
            Entities (${entities.length})
          </button>
        </div>

        <div class="panel">
          ${this._activeTab === "config"
            ? html`
                <section class="section">
                  <ha-form
                    .hass=${this.hass}
                    .data=${this._config}
                    .schema=${schema}
                    .computeLabel=${this._computeLabel}
                    @value-changed=${this._handleConfigChanged}
                  ></ha-form>
                  ${this._config.adaptivestateactive === true
                    ? this._renderAdaptiveStateEditor()
                    : nothing}
                </section>
              `
            : html`
                <section class="section">
                  <div class="section-header">
                    <p class="section-description">
                      Configure one or more entities. Every handle must use a compatible domain.
                    </p>
                    <div class="section-tools">
                      ${entities.length > 1
                        ? html`
                            <ha-form
                              .hass=${this.hass}
                              .data=${this._config}
                              .schema=${handlesBehaviorSchema}
                              .computeLabel=${this._computeLabel}
                              @value-changed=${this._handleConfigChanged}
                            ></ha-form>
                          `
                        : nothing}
                      <div class="section-actions">
                        <button
                          class="action-button icon-button"
                          type="button"
                          aria-label="Remove last entity"
                          ?disabled=${entities.length === 1}
                          @click=${this._removeLastHandle}
                        >
                          -
                        </button>
                        <button
                          class="action-button icon-button"
                          type="button"
                          aria-label="Add entity"
                          @click=${this._addHandle}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="handle-list">
                    ${entities.map((handleConfig, index) => html`
                      <div class="handle-card">
                        <ha-form
                          .hass=${this.hass}
                          .data=${handleConfig}
                          .schema=${this._getHandleSchema(index)}
                          .computeLabel=${this._computeHandleLabel(index)}
                          @value-changed=${(ev: CustomEvent) => this._handleHandleChanged(ev, index)}
                        ></ha-form>
                      </div>
                    `)}
                  </div>

                  <ha-form
                    .hass=${this.hass}
                    .data=${this._config}
                    .schema=${connectEndSchema}
                    .computeLabel=${this._computeLabel}
                    @value-changed=${this._handleConfigChanged}
                  ></ha-form>
                </section>
              `}
        </div>
      </div>
    `;
  }

  /****************************************************/
  /* Public methods - Config Management               */
  /****************************************************/

  public setConfig(config: FlexSliderCardConfig): void {
    // legacy entities configuration start
    const hasAnyLegacyEntityConfig = this._hasLegacyEntityConfig(config);
    const legacyEntityConflictError = this._getLegacyEntityConflictError(config);

    if (legacyEntityConflictError) {  
      this._error = legacyEntityConflictError;
      this._config = config;
      return;
    }
    this._error = undefined;

    const normalizedConfig = this._normalizeConfig(config);

    if (hasAnyLegacyEntityConfig) {
      this._config = normalizedConfig;
      fireEvent(this, "config-changed", { config: normalizedConfig });
      return;
    }
    // legacy entities configuration end
    this._config = normalizedConfig;
  }

  /****************************************************/
  /* Private methods - rendering                      */
  /****************************************************/

  private _computeLabel = (schema: HaFormSchema): string | undefined => {
    if (!("name" in schema)) return undefined;

    return flexSliderCardConfigLabels[schema.name];
  };

  private _computeHandleLabel = (index: number) => (schema: HaFormSchema): string | undefined => {
    if (!("name" in schema)) return undefined;
    if (schema.name === "entity") {
      return `Entity ${index + 1}`;
    }
    if (schema.name === "text") {
      return `Text ${index + 1}`;
    }

    return this._computeLabel(schema);
  };

  private _selectTab(tab: "config" | "entities"): void {
    this._activeTab = tab;
  }

  private _renderAdaptiveStateEditor(): TemplateResult {
    return html`
      <details class="custom-expandable">
        <summary>
          <span class="custom-expandable-title">
            <ha-icon icon="mdi:state-machine"></ha-icon>
            <span>Adaptative State</span>
          </span>
          <ha-icon class="custom-expandable-arrow" icon="mdi:chevron-down"></ha-icon>
        </summary>
        <div class="custom-expandable-content">
          <ha-form
            .hass=${this.hass}
            .data=${this._config.adaptivestate ?? {}}
            .schema=${adaptiveStateOptionsSchema}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._handleAdaptiveStateChanged}
          ></ha-form>
          <flex-slider-card-condition-editor
            .hass=${this.hass}
            .conditions=${this._config.adaptivestate?.conditions ?? []}
            @conditions-changed=${this._handleAdaptiveStateConditionsChanged}
          ></flex-slider-card-condition-editor>
        </div>
      </details>
    `;
  }

  /****************************************************/
  /* Private methods - config in rendering            */
  /****************************************************/

  private _handleConfigChanged = (ev: CustomEvent): void => {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }

    const nextConfig = structuredClone(ev.detail.value as FlexSliderCardConfig);
    if (nextConfig.orientation === "vertical") {
      nextConfig.valuesbaractive = false;
      if (nextConfig.reference) {
        nextConfig.reference.valuesbar = false;
        nextConfig.reference.valuesbartextlarge = false;
      }
    } else if (nextConfig.reference && nextConfig.reference.valuesbar !== true) {
      nextConfig.reference.valuesbartextlarge = false;
    }
    this._applyConfig(nextConfig);
  };

  private _handleHandleChanged(ev: CustomEvent, index: number): void {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }

    const nextConfig = this._cloneConfig();
    const entities = nextConfig.entities ?? [];
    entities[index] = this._normalizeHandle(ev.detail.value as FlexSliderCardHandleConfig);
    nextConfig.entities = entities;
    this._applyConfig(nextConfig);
  }

  private _handleAdaptiveStateChanged = (ev: CustomEvent): void => {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }

    const nextConfig = this._cloneConfig();
    const nextAdaptiveState = ev.detail.value as FlexSliderCardConfig["adaptivestate"];
    nextConfig.adaptivestate = {
      ...(nextConfig.adaptivestate ?? {}),
      ...(nextAdaptiveState ?? {}),
      conditions: nextConfig.adaptivestate?.conditions ?? [],
    };
    this._applyConfig(nextConfig);
  };

  private _handleAdaptiveStateConditionsChanged = (ev: CustomEvent<{ conditions: Condition[] }>): void => {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }

    const nextConfig = this._cloneConfig();
    nextConfig.adaptivestate = {
      ...(nextConfig.adaptivestate ?? {}),
      conditions: ev.detail.conditions,
    };
    this._applyConfig(nextConfig);
  };

  private _addHandle = (): void => {
    if (!this._config) {
      return;
    }

    const nextConfig = this._cloneConfig();
    const entities = nextConfig.entities ?? [];
    nextConfig.entities = [...entities, this._createEmptyHandle()];
    this._applyConfig(nextConfig);
  };

  private _removeLastHandle = (): void => {
    const currentEntities = this._config?.entities ?? [];
    if (!this._config || currentEntities.length === 1) {
      return;
    }

    const nextConfig = this._cloneConfig();
    nextConfig.entities = (nextConfig.entities ?? []).slice(0, -1);
    this._applyConfig(nextConfig);
  };

  /****************************************************/
  /* Private methods - config management              */
  /****************************************************/

  private _applyConfig(config: FlexSliderCardConfig): void {
    this._config = config;
    fireEvent(this, "config-changed", { config });
  }

  private _cloneConfig(): FlexSliderCardConfig {
    if (!this._config) {
      throw new Error("Editor config is not initialized");
    }

    return structuredClone(this._config);
  }

  /****************************************************/
  /* Private methods - handles management             */
  /****************************************************/

  private _normalizeHandle(handle?: FlexSliderCardHandleConfig): FlexSliderCardHandleConfig {
    const normalizedHandle: FlexSliderCardHandleConfig = {
      entity: handle?.entity ?? "",
      text: handle?.text ?? "",
    };

    if (handle?.connectprevious !== undefined) {
      normalizedHandle.connectprevious = handle.connectprevious;
    }

    return normalizedHandle;
  }

  private _normalizeReference(reference?: FlexSliderCardConfig["reference"]): FlexSliderCardConfig["reference"] {
    if (reference == null) {
      return undefined;
    }

    return {
      entity: reference.entity ?? "",
      text: reference.text ?? "",
      unit: reference.unit ?? "",
      bubble: reference.bubble ?? false,
      valuesbar: reference.valuesbar ?? false,
      valuesbartextlarge: reference.valuesbartextlarge ?? false,
    };
  }

  private _normalizeAdaptiveState(adaptiveState?: FlexSliderCardConfig["adaptivestate"]): FlexSliderCardConfig["adaptivestate"] {
    if (adaptiveState == null) {
      return undefined;
    }

    return {
      conditions: Array.isArray(adaptiveState.conditions)
        ? structuredClone(adaptiveState.conditions)
        : [],
      editablewhenlinkedinactive: adaptiveState.editablewhenlinkedinactive ?? false,
    };
  }

  private _getHandleSchema(index: number): HaFormSchema[] {
    const entityCount = this._config.entities?.length ?? 0;
    const excludedEntities = (this._config.entities ?? [])
      .map((handle, handleIndex) => handleIndex === index ? "" : handle.entity ?? "")
      .filter((entityId) => entityId !== "");

    return handleSchema.map((schema) => {
      if ("name" in schema && schema.name === "entity") {
        return {
          ...schema,
          selector: {
            ...schema.selector,
            entity: {
              ...schema.selector.entity,
              exclude_entities: excludedEntities,
            },
          },
        };
      }

      if (schema.type === "grid" && Array.isArray(schema.schema)) {
        return {
          ...schema,
          schema: schema.schema.map((fieldSchema) => {
            if (!("name" in fieldSchema) || fieldSchema.name !== "connectprevious") {
              return fieldSchema;
            }

            return {
              ...fieldSchema,
              default: this._getDefaultConnectPrevious(index, entityCount),
            };
          }),
        };
      }

      return schema;
    });
  }

  private _createEmptyHandle(): FlexSliderCardHandleConfig {
    return createEmptyLegacyHandle();
  }

  private _getDefaultConnectPrevious(index: number, entityCount: number): boolean {
    if (entityCount <= 1) {
      return true;
    }

    return index > 0;
  }

  /****************************************************/
  /* Private methods - entities management            */
  /****************************************************/

  private _getEntityType(entityId?: string): FlexSliderCardEntityType | undefined {
    if (!entityId) {
      return undefined;
    }

    try {
      return getEntityType(entityId);
    } catch {
      return undefined;
    }
  }

  private _getSelectedEntityType(handles: FlexSliderCardHandleConfig[]): FlexSliderCardEntityType | undefined {
    for (const handle of handles) {
      const entityType = this._getEntityType(handle.entity);
      if (entityType !== undefined) {
        return entityType;
      }
    }
    return undefined;
  }

  /****************************************************/
  /* Private methods - legacy config management       */
  /****************************************************/

  private _hasLegacyEntityConfig(config?: FlexSliderCardConfig): boolean {
    // legacy entities configuration start
    return hasLegacyEntityConfig(config);
    // legacy entities configuration end
  }

  private _getLegacyEntityConflictError(config?: FlexSliderCardConfig): string | undefined {
    // legacy entities configuration start
    if (config?.entity_min !== undefined && config?.entity_max === undefined) {
      return "Cannot use 'entity_min' without 'entity_max' in the editor configuration";
    }

    if (config?.entity_max !== undefined && config?.entity_min === undefined) {
      return "Cannot use 'entity_max' without 'entity_min' in the editor configuration";
    }

    if (config?.entity_min !== undefined && config.entities?.[0] !== undefined) {
      return "Cannot use both 'entity_min/entity_max' and 'entities' in the editor configuration";
    }

    if (hasEntityTextConflict(config)) {
      return "Cannot use both legacy 'mintext/maxtext' and 'entities[].text' in the editor configuration";
    }

    return undefined;
    // legacy entities configuration end
  }

  private _normalizeConfig(config?: FlexSliderCardConfig): FlexSliderCardConfig {
    const {
      // legacy entities configuration start
      entity_min,
      entity_max,
      // legacy entities configuration end
      ...rest
    } = (config ?? { type: "custom:flex-slider-card" }) as FlexSliderCardConfig;

    const entities = Array.isArray(config?.entities)
      ? config.entities.map((handle) => this._normalizeHandle(handle))
      : [];

    // legacy entities configuration start
    if (entity_min !== undefined) {
      setLegacyHandle(entities, 0, { entity: entity_min });
    }

    if (entity_max !== undefined) {
      setLegacyHandle(entities, 1, { entity: entity_max });
    }

    const minText = getLegacyHandleText(config, 0);
    if (minText !== undefined) {
      setLegacyHandle(entities, 0, { text: minText });
    }

    const maxText = getLegacyHandleText(config, 1);
    if (maxText !== undefined) {
      setLegacyHandle(entities, 1, { text: maxText });
    }
    // legacy entities configuration end

    if (entities.length === 0) {
      entities.push(this._createEmptyHandle());
    }

    const normalizedConfig: FlexSliderCardConfig = {
      ...rest,
      entities,
      reference: this._normalizeReference(config?.reference),
      adaptivestate: this._normalizeAdaptiveState(config?.adaptivestate),
    };

    if (hasLegacyValuesBarTextConfig(config)) {
      normalizedConfig.valuesbar = {
        ...normalizedConfig.valuesbar,
        showtext: true,
      };
    }

    if (hasLegacyBubblesTextConfig(config)) {
      normalizedConfig.bubbles = {
        ...normalizedConfig.bubbles,
        showtext: true,
      };
    }

    clearLegacyEntityTexts(normalizedConfig);

    return {
      ...normalizedConfig,
    };
  }

}
