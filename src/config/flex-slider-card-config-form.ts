import memoizeOne from "memoize-one";
import { HaFormSchema } from "../type/ha";

const baseSchema = memoizeOne((isNumber: boolean): HaFormSchema[] => [
  {
    name: "name",
    selector: { text: {} },
    required: false,
  },
  {
    name: "format",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "std", label: "Standard" },
          { value: "compact", label: "Compact" },
        ],
      },
    },
    required: false,
  },
  {
    type: "grid",
    name: "",
    schema: [
      {
        name: "valuesbaractive",
        selector: { boolean: {} },
        required: false,
      },
      {
        name: "bubbles",
        selector: { boolean: {} },
        required: false,
      },
    ],
  },
  {
    type: "expandable",
    title: "Behavior",
    icon: "mdi:tune",
    flattened: true,
    schema: [
      {
        type: "grid",
        name: "",
        schema: [
          {
            name: "entity_min",
            required: true,
            selector: {
              entity: {
                domain: ["number", "input_number", "input_datetime"],
              }
            },
          },
          {
            name: "entity_max",
            required: true,
            selector: {
              entity: {
                domain: ["number", "input_number", "input_datetime"],
              }
            },
          },
        ],
      },
      {
        type: "grid",
        name: "",
        schema: [
          {
            name: "min",
            selector: {
              number: { mode: "box" },
            },
            disabled: !isNumber,
          },
          {
            name: "max",
            selector: {
              number: { mode: "box" },
            },
            disabled: !isNumber,
          },
          {
            name: "step",
            selector: {
              number: {
                mode: "box",
                step: "any",
                min: 0,
              },
            },
            disabled: !isNumber,
          },
        ],
      },
    ],
  },
]);

const valuesBarSchema = memoizeOne((digits: string): HaFormSchema[] => [
  {
    type: "expandable",
    name: "valuesbar",
    title: "Values bar",
    icon: "mdi:format-list-bulleted",
    schema: [
      {
        type: "grid",
        schema: [
          {
            name: "unit",
            selector: { text: {} },
          },
          {
            name: "digits",
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "auto", label: "Auto" },
                  { value: "manual", label: "Manual" },
                ],
              },
            },
          },
          {
            name: "nbdigits",
            selector: {
              number: { mode: "box", min: 0 },
            },
            disabled: digits !== "manual",
          },
        ],
      },
      {
        type: "grid",
        schema: [
          {
            name: "mintext",
            selector: { text: {} },
          },
          {
            name: "maxtext",
            selector: { text: {} },
          },
        ],
      },
    ],
  }
]);

export const computeSchema = memoizeOne((hasValuesBar: boolean, digits: string, isNumber: boolean): HaFormSchema[] => {
  return hasValuesBar
    ? [...baseSchema(isNumber), ...valuesBarSchema(digits)]
    : [...baseSchema(isNumber)];
});