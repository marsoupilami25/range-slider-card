import memoizeOne from "memoize-one";
import { HaFormSchema } from "../type/ha";

const baseSchema = memoizeOne((isNumber: boolean, isVertical: boolean): HaFormSchema[] => [
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
        name: "orientation",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "horizontal", label: "Horizontal" },
              { value: "vertical", label: "Vertical" },
            ],
          },
        },
        required: false,
      },
      ...(!isVertical ? [{
        name: "horizontalwidth",
        selector: {
          number: {
            mode: "slider",
            min: 10,
            max: 100,
            step: 5,
          },
        },
        required: false,
      }] : [{
        name: "verticalheight",
        selector: {
          number: {
            mode: "slider",
            min: 1,
            max: 12,
            step: 1,
          },
        },
        required: false,
      }]),
    ],
  },
  {
    type: "grid",
    name: "",
    schema: [
      {
        name: "valuesbaractive",
        selector: { boolean: {} },
        required: false,
        disabled: isVertical,
      },
      {
        name: "bubblesactive",
        selector: { boolean: {} },
        required: false,
      },
      {
        name: "ticksactive",
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
          {
            name: "direction",
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "ltr", label: "Left to Right" },
                  { value: "rtl", label: "Right to Left" },
                ],
              },
            },
            required: false,
          },
        ],
      },
    ],
  },
]);

const valuesBarSchema = memoizeOne((digitsValuesBar: string): HaFormSchema[] => [
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
            disabled: digitsValuesBar !== "manual",
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

const bubblesSchema = memoizeOne((digitsBubbles: string): HaFormSchema[] => [
  {
    type: "expandable",
    name: "bubbles",
    title: "Bubbles",
    icon: "mdi:format-list-bulleted",
    schema: [
      {
        type: "grid",
        schema: [
          {
            name: "dragonly",
            selector: { boolean: {} },
            required: false,
          },
          {
            name: "unit",
            selector: { text: {} },
          },
        ],
      },
      {
        type: "grid",
        schema: [
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
            disabled: digitsBubbles !== "manual",
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

const ticksSchema = memoizeOne((digitsTicks: string): HaFormSchema[] => [
  {
    type: "expandable",
    name: "ticks",
    title: "Tick Marks",
    icon: "mdi:format-list-bulleted",
    schema: [
      {
        type: "grid",
        schema: [
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
            disabled: digitsTicks !== "manual",
          },
        ],
      },
      {
        type: "grid",
        schema: [
          {
            name: "majorticks",
            selector: {
              number: {
                mode: "box",
                step: 1,
                min: 2,
              },
            },
            required: false,
          },
          {
            name: "minorticks",
            selector: {
              number: {
                mode: "box",
                step: 1,
                min: 0,
              },
            },
            required: false,
          },
        ],
      },
    ],
  }
]);

export const computeSchema = memoizeOne((hasValuesBar: boolean,
  hasBubbles: boolean,
  hasTicks: boolean,
  digitsValuesBar: string,
  digitsBubbles: string,
  digitsTicks: string,
  isNumber: boolean,
  isVertical: boolean): HaFormSchema[] => {

  const schema = [...baseSchema(isNumber, isVertical)];
  if (hasValuesBar) schema.push(...valuesBarSchema(digitsValuesBar));
  if (hasBubbles) schema.push(...bubblesSchema(digitsBubbles));
  if (hasTicks) schema.push(...ticksSchema(digitsTicks));
  return schema;
});
