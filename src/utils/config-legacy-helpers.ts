import {
  FlexSliderCardConfig,
  FlexSliderCardHandleConfig,
} from "../config/flex-slider-card-config-type";

export function createEmptyLegacyHandle(): FlexSliderCardHandleConfig {
  return { entity: "", text: "" };
}

export function hasConfiguredText(text?: string): text is string {
  return text !== undefined && text !== "";
}

export function getLegacyHandleText(
  config: FlexSliderCardConfig | undefined,
  index: number,
): string | undefined {
  const valuesBarText = index === 0
    ? config?.valuesbar?.mintext
    : config?.valuesbar?.maxtext;

  if (hasConfiguredText(valuesBarText)) {
    return valuesBarText;
  }

  const bubblesText = index === 0
    ? config?.bubbles?.mintext
    : config?.bubbles?.maxtext;

  if (hasConfiguredText(bubblesText)) {
    return bubblesText;
  }

  return undefined;
}

export function hasLegacyValuesBarTextConfig(config?: FlexSliderCardConfig): boolean {
  return (
    hasConfiguredText(config?.valuesbar?.mintext) ||
    hasConfiguredText(config?.valuesbar?.maxtext)
  );
}

export function hasLegacyBubblesTextConfig(config?: FlexSliderCardConfig): boolean {
  return (
    hasConfiguredText(config?.bubbles?.mintext) ||
    hasConfiguredText(config?.bubbles?.maxtext)
  );
}

export function hasLegacyEntityTextConfig(config?: FlexSliderCardConfig): boolean {
  return getLegacyHandleText(config, 0) !== undefined || getLegacyHandleText(config, 1) !== undefined;
}

export function hasLegacyEntityConfig(config?: FlexSliderCardConfig): boolean {
  return (
    config?.entity_min !== undefined ||
    config?.entity_max !== undefined ||
    hasLegacyEntityTextConfig(config)
  );
}

export function hasEntityTextConflict(config?: FlexSliderCardConfig): boolean {
  return (
    (hasConfiguredText(config?.entities?.[0]?.text) && getLegacyHandleText(config, 0) !== undefined) ||
    (hasConfiguredText(config?.entities?.[1]?.text) && getLegacyHandleText(config, 1) !== undefined)
  );
}

export function setLegacyHandle(
  handles: FlexSliderCardHandleConfig[],
  index: number,
  patch: Partial<FlexSliderCardHandleConfig>,
): void {
  while (handles.length <= index) {
    handles.push(createEmptyLegacyHandle());
  }

  handles[index] = {
    ...createEmptyLegacyHandle(),
    ...handles[index],
    ...patch,
  };
}

export function clearLegacyEntityTexts(config: FlexSliderCardConfig): void {
  if (config.valuesbar) {
    delete config.valuesbar.mintext;
    delete config.valuesbar.maxtext;
  }

  if (config.bubbles) {
    delete config.bubbles.mintext;
    delete config.bubbles.maxtext;
  }
}
