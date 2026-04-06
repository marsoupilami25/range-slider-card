[![GitHub release](https://img.shields.io/github/v/release/marsoupilami25/flex-slider-card?display_name=tag)](https://github.com/marsoupilami25/flex-slider-card/releases)
[![HACS validation](https://github.com/marsoupilami25/flex-slider-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/marsoupilami25/flex-slider-card/actions/workflows/hacs.yml)

# Flex Slider Card

A Home Assistant custom card to control two entities with a single range slider.

Supported domains:
- `input_number`
- `number`
- `input_datetime`

For `input_datetime`, the slider manages a single day from `00:00` to `23:59`.

![Example of a flex slider card](/assets/slider_example.png)

## Features

- Control `entity_min` and `entity_max` from one slider
- Standard and compact layouts   
![Standard format](/assets/standard.png)   
![Compact format](/assets/compact.png)   
- Optional title   
![With title](/assets/title.png)   
- Optional values bar   
![With values bar](/assets/valuesbar.png)   
- Optional bubbles   
![With bubbles](/assets/bubbles.png)   
- Optional tick marks   
![With title](/assets/ticks.png)   
- Left-to-right or right-to-left direction   
![Reversed direction](/assets/direction.png)   
- Uses the active Home Assistant theme
- Visual editor support   
![Visual editor](/assets/configuration.png)   
- `card-mod` compatible

## Version 2 note

Version `2.x` introduced the visual editor and changed the configuration format.  
Configurations from `1.x` are not backward compatible and must be recreated.

## Installation

### HACS

1. Install [HACS](https://hacs.xyz/) if it is not already available.
2. Go to HACS > Frontend.
3. Open the top-right menu, then select `Custom repositories`.
4. Add `https://github.com/marsoupilami25/flex-slider-card` as a frontend repository.
5. Search for `Flex Slider Card`.
6. Install it.
7. Restart Home Assistant if prompted.

![Add custom repository](/assets/custom_repo.png)

### Manual installation

1. Download `flex-slider-card.js` from the latest release:
   `https://github.com/marsoupilami25/flex-slider-card/releases`
2. Copy it to your Home Assistant `www` folder.
3. Add it as a dashboard resource:

```text
/local/flex-slider-card.js
```

4. Restart Home Assistant.

## Configuration

From version `2.x`, the card can be configured entirely from the visual editor.  
YAML configuration is still supported.

### Basic example

```yaml
type: custom:flex-slider-card
name: Heating schedule
entity_min: input_datetime.heating_start
entity_max: input_datetime.heating_end
format: std
valuesbaractive: true
bubblesactive: true
ticksactive: true
direction: ltr
step: 15
valuesbar:
  mintext: Start
  maxtext: End
bubbles:
  dragonly: true
ticks:
  majorticks: 5
  minorticks: 3
```

### Number example

```yaml
type: custom:flex-slider-card
name: Comfort range
entity_min: input_number.temperature_min
entity_max: input_number.temperature_max
min: 15
max: 25
step: 0.5
valuesbaractive: true
bubblesactive: true
valuesbar:
  unit: "%"
  digits: auto
bubbles:
  unit: "%"
  digits: auto
```

## Options

### Main options

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | string | No | hidden | Card title. If omitted, no title is shown |
| `format` | `std` \| `compact` | No | `std` | Card layout |
| `valuesbaractive` | boolean | No | `false` | Shows the values bar under the slider |
| `bubblesactive` | boolean | No | `false` | Shows value bubbles on slider handles |
| `ticksactive` | boolean | No | `false` | Shows tick marks under the slider |
| `direction` | `ltr` \| `rtl` | No | `ltr` | Slider direction |

### Entities Management

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `entity_min` | string | Yes | - | Entity used for the minimum handle |
| `entity_max` | string | Yes | - | Entity used for the maximum handle |
| `min` | number | No | `0` | Minimum slider value for number entities only |
| `max` | number | No | `100` | Maximum slider value for number entities only |
| `step` | number | No | `1` | Slider step. For `input_datetime`, it is rounded to an integer number of minutes |


### Domain behavior

| Domain | Supported | Notes |
|---|---|---|
| `number` | Yes | Uses configured `min`, `max`, and `step` |
| `input_number` | Yes | Uses configured `min`, `max`, and `step` |
| `input_datetime` | Yes | Range is always `00:00` to `23:59`; `min` and `max` are ignored |

`entity_min` and `entity_max` must use compatible domains.

### `valuesbar` options

Available when `valuesbaractive: true`.

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `mintext` | string | No | `""` | Text shown before the minimum value |
| `maxtext` | string | No | `""` | Text shown before the maximum value |
| `digits` | `auto` \| `manual` | No | `auto` | Number formatting mode for number entities |
| `nbdigits` | number | No | derived from `step` or `0` | Number of decimals when `digits: manual` |
| `unit` | string | No | `""` | Unit suffix |

### `bubbles` options

Available when `bubblesactive: true`.

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `mintext` | string | No | `""` | Text shown before the minimum bubble value |
| `maxtext` | string | No | `""` | Text shown before the maximum bubble value |
| `digits` | `auto` \| `manual` | No | `auto` | Number formatting mode for number entities |
| `nbdigits` | number | No | derived from `step` or `0` | Number of decimals when `digits: manual` |
| `unit` | string | No | `""` | Unit suffix |
| `dragonly` | boolean | No | `false` | Shows bubbles only while dragging |

### `ticks` options

Available when `ticksactive: true`.

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `digits` | `auto` \| `manual` | No | `auto` | Number formatting mode for number entities |
| `nbdigits` | number | No | derived from `step` or `0` | Number of decimals when `digits: manual` |
| `majorticks` | number | No | `4` | Number of labeled major ticks. Minimum: `2` |
| `minorticks` | number | No | `0` | Number of minor ticks between each major tick |

## card-mod

You can use `card-mod` for styling or debugging.

The card exposes two internal custom elements:
- `flex-slider-card-slider`
- `flex-slider-card-valuesbar`

Example:

```yaml
card_mod:
  style:
    flex-slider-card-slider$: |
      .slider-container.std {
        border: 2px solid red;
      }
```

## Troubleshooting

If the card does not appear in Home Assistant:

- Clear the browser cache or the Home Assistant app cache
- Verify that `/local/flex-slider-card.js` is added as a dashboard resource
- Make sure both configured entities exist and use compatible domains
- Check open issues or report a new one:
  https://github.com/marsoupilami25/flex-slider-card/issues

## Contributing

Issues and pull requests are welcome.
