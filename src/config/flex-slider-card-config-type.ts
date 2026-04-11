import { LovelaceCardConfig } from "custom-card-helpers";
import { assign, union, literal, refine, number, object, optional, string, boolean, any } from "superstruct";
import { lovelaceCardConfigStruct } from "../type/ha";

export type FlexSliderCardFormat = "std" | "compact";
export function assertFlexSliderCardFormat(value: any): asserts value is FlexSliderCardFormat {
  if (!["std", "compact"].includes(value)) {
    throw new Error(`Invalid FlexSliderCardFormat: ${value}`);
  }
}
export const flexSliderCardFormatStruct = union([
  literal("std"),
  literal("compact"),
]);

export type FlexSliderCardDigits = "auto" | "manual";
export function assertFlexSliderCardDigits(value: any): asserts value is FlexSliderCardDigits {
  if (!["auto", "manual"].includes(value)) {
    throw new Error(`Invalid FlexSliderCardDigits: ${value}`);
  }
}
export const flexSliderCardDigitsStruct = union([
  literal("auto"),
  literal("manual"),
]);

export type FlexSliderCardDirection = "rtl" | "ltr";
export function assertFlexSliderCardDirection(value: any): asserts value is FlexSliderCardDirection {
  if (!["rtl", "ltr"].includes(value)) {
    throw new Error(`Invalid FlexSliderCardDirection: ${value}`);
  }
}
export const flexSliderCardDirectionStruct = union([
  literal("rtl"),
  literal("ltr"),
]);

export type FlexSliderCardOrientation = "horizontal" | "vertical";
export function assertFlexSliderCardOrientation(value: any): asserts value is FlexSliderCardOrientation {
  if (!["horizontal", "vertical"].includes(value)) {
    throw new Error(`Invalid FlexSliderCardOrientation: ${value}`);
  }
}
export const flexSliderCardOrientationStruct = union([
  literal("horizontal"),
  literal("vertical"),
]);

export type FlexSliderCardValuesBarConfig = {
  mintext?: string;
  maxtext?: string;
  digits?: FlexSliderCardDigits;
  nbdigits?: number;
  unit?: string;
};
export const flexSliderCardValuesBarConfigStruct = object({
  mintext: optional(string()),
  maxtext: optional(string()),
  digits: optional(flexSliderCardDigitsStruct),
  nbdigits: optional(number()),
  unit: optional(string()),
});

export type FlexSliderCardBubblesConfig = {
  mintext?: string;
  maxtext?: string;
  digits?: FlexSliderCardDigits;
  nbdigits?: number;
  unit?: string;
  dragonly?: boolean;
};
export const flexSliderCardBubblesConfigStruct = object({
  mintext: optional(string()),
  maxtext: optional(string()),
  digits: optional(flexSliderCardDigitsStruct),
  nbdigits: optional(number()),
  unit: optional(string()),
  dragonly: optional(boolean()),
});

export type FlexSliderCardTicksConfig = {
  digits?: FlexSliderCardDigits;
  nbdigits?: number;
  majorticks?: number;
  minorticks?: number;
};
export const flexSliderCardTicksConfigStruct = object({
  digits: optional(flexSliderCardDigitsStruct),
  nbdigits: optional(number()),
  majorticks: optional(number()),
  minorticks: optional(number()),
});

export type FlexSliderCardConfig = LovelaceCardConfig &
{
  /* display options */
  name?: string;
  format?: FlexSliderCardFormat;
  valuesbaractive?: boolean;
  bubblesactive?: boolean;
  valuesbar?: FlexSliderCardValuesBarConfig;
  bubbles?: FlexSliderCardBubblesConfig;
  direction?: FlexSliderCardDirection;
  orientation?: FlexSliderCardOrientation;
  ticksactive?: boolean;
  ticks?: FlexSliderCardTicksConfig;
  horizontalwidth?: number;
  verticalheight?: number;

 /* bahavioral */
  entity_min: string;
  entity_max: string;
  min?: number;
  max?: number;
  step?: number;

  /* card mod */
  card_mod?: Record<string, unknown>;
};
export const flexSliderCardConfigStruct = assign(
  lovelaceCardConfigStruct,
  object({
    /* display options */
    name: optional(string()),
    format: optional(flexSliderCardFormatStruct),
    valuesbaractive: optional(boolean()), 
    bubblesactive: optional(boolean()),
    valuesbar: optional(flexSliderCardValuesBarConfigStruct),
    bubbles: optional(flexSliderCardBubblesConfigStruct),
    direction: optional(flexSliderCardDirectionStruct),
    orientation: optional(flexSliderCardOrientationStruct),
    ticksactive: optional(boolean()),
    ticks: optional(flexSliderCardTicksConfigStruct),
    horizontalwidth: optional(number()),
    verticalheight: optional(number()),

    /* behavioral */
    entity_min: string(),
    entity_max: string(),
    min: optional(number()),
    max: optional(number()),
    step: optional(number()),

    /* card mod */
    card_mod: optional(any()),
  })
);
