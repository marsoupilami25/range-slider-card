[![GitHub release](https://img.shields.io/github/v/release/marsoupilami25/flex-slider-card?display_name=tag)](https://github.com/marsoupilami25/flex-slider-card/releases)
[![HACS validation](https://github.com/marsoupilami25/flex-slider-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/marsoupilami25/flex-slider-card/actions/workflows/hacs.yml)

# Flex Slider Card

A Home Assistant custom card that controls one or more entities from a single slider.

Supported domains:
- `input_number`
- `number`
- `input_datetime`

For `input_datetime`, only time-only entities are supported (`has_time: true`, `has_date: false`).
The slider always covers a single day from `00:00` to `23:59`.

![Example of a flex slider card](/assets/slider_example.png)

## Features

- One slider with 1..n handles   
![One handle](/assets/1handle.png)   
![n handles](/assets/nhandles.png)   
- Legacy 2-handle config from `2.x` still supported   
- configurable connections between handles   
![configurable connections](/assets/configurableconnect.png)   
- Standard and compact layouts   
![Standard format](/assets/standard.png)   
![Compact format](/assets/compact.png)   
- Horizontal and vertical orientations   
![vertical orientation](/assets/vertical.png)![vertical orientation](/assets/vertical2.png)   
- Optional title   
![With title](/assets/title.png)   
- Optional values bar   
![With values bar](/assets/valuesbar.png)   
- Optional bubbles   
![With bubbles](/assets/bubbles.png)   
- Optional tick marks   
![With ticks mark](/assets/ticks.png)   
- Left-to-right or right-to-left direction   
![Reversed direction](/assets/direction.png)   
- Uses the active Home Assistant theme   
![Home Assistant Theme](/assets/theme.png)   
- Visual editor support   
![Visual editor](/assets/configuration.png)   
- `card-mod` compatible   

## Version Notes

Version `2.x` introduced the visual editor and changed the configuration format.
Old `1.x` configurations are not backward compatible.

Version `3.x` adds multi-handle through major configuration update.
Nevertheless legacy keys such as `entity_min`, `entity_max`, `valuesbar.mintext`, and `bubbles.maxtext` are still accepted. The visual editor automatically upgrade the configuration to the new style when opened.

## Installation

### HACS

1. Install [HACS](https://hacs.xyz/) if needed.
2. Go to HACS > Frontend.
3. Open the top-right menu and choose `Custom repositories`.
4. Add `https://github.com/marsoupilami25/flex-slider-card` as a frontend repository.
5. Search for `Flex Slider Card`.
6. Install it.
7. Restart Home Assistant if prompted.

![Add custom repository](/assets/custom_repo.png)

### Manual Installation

1. Download `flex-slider-card.js` from the latest release:
   `https://github.com/marsoupilami25/flex-slider-card/releases`
2. Copy it into your Home Assistant `www` folder.
3. Add it as a dashboard resource:

```text
/local/flex-slider-card.js
```

4. Restart Home Assistant.

## Configuration

The card can be configured from the visual editor or with YAML.

### Basic example

```yaml
type: custom:flex-slider-card
name: Heating band
entities:
  - entity: input_number.heating_min
    text: Min
  - entity: input_number.heating_target
    text: Target
  - entity: input_number.heating_max
    text: Max
min: 18
max: 24
step: 0.5
valuesbaractive: true
bubblesactive: true
ticksactive: true
handlesbehavior: fixed
valuesbar:
  unit: C
  showtext: true
bubbles:
  unit: C
  showtext: true
ticks:
  majorticks: 4
  minorticks: 1
```

### Single-Handle Example

```yaml
type: custom:flex-slider-card
name: Comfort target
entities:
  - entity: input_number.temperature_target
min: 18
max: 30
step: 0.5
valuesbaractive: true
valuesbar:
  unit: C
```

### Time Example

```yaml
type: custom:flex-slider-card
name: Heating schedule
entities:
  - entity: input_datetime.heating_start
    text: Start
  - entity: input_datetime.heating_end
    text: End
valuesbaractive: true
bubblesactive: true
step: 15
direction: ltr
bubbles:
  dragonly: true
  showtext: true
```

Both `input_datetime` entities must be time-only (`has_time: true`, `has_date: false`).
For this domain, `min` and `max` are ignored and `step` is rounded to whole minutes.

### Vertical Example

```yaml
type: custom:flex-slider-card
name: Temperature band
entities:
  - entity: input_number.temperature_min
    text: Min
  - entity: input_number.temperature_max
    text: Max
min: 18
max: 30
step: 0.5
orientation: vertical
verticalheight: 3
verticallayout: mirrored
bubblesactive: true
ticksactive: true
bubbles:
  unit: C
  showtext: true
ticks:
  majorticks: 5
  minorticks: 2
```

## Options

### Main Options

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | string | No | hidden | Card title. If omitted, no title is shown |
| `format` | `std` \| `compact` | No | `std` | Card layout |
| `orientation` | `horizontal` \| `vertical` | No | `horizontal` | Slider orientation |
| `horizontalwidth` | number | No | `90` | Horizontal slider width in percent. Horizontal mode only. Min `10`, max `100` |
| `verticalheight` | number | No | auto | Vertical card height in dashboard rows. Vertical mode only. Min `2` for `std`, `1` for `compact`, max `12` |
| `valuesbaractive` | boolean | No | `false` | Shows the values bar. Ignored in vertical mode |
| `bubblesactive` | boolean | No | `false` | Shows value bubbles on handles |
| `ticksactive` | boolean | No | `false` | Shows tick marks |
| `verticallayout` | `standard` \| `mirrored` | No | `standard` | In vertical mode, moves bubbles and tick labels to the default side or the mirrored side |

### Slider Behavior

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `min` | number | No | `0` | Minimum slider value for `number` and `input_number` |
| `max` | number | No | `100` | Maximum slider value for `number` and `input_number` |
| `step` | number | No | `1` | Slider step. Must be `> 0`. For `input_datetime`, rounded to whole minutes |
| `direction` | `ltr` \| `rtl` | No | `ltr` | Slider direction |

### `bubbles` Options

Available when `bubblesactive: true`.

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `digits` | `auto` \| `manual` | No | `auto` | Number formatting mode |
| `nbdigits` | number | No | derived from `step` or `0` | Number of decimals when `digits: manual` |
| `unit` | string | No | `""` | Unit suffix |
| `showtext` | boolean | No | `false` | Prefixes the value with `entities[].text` when available |
| `dragonly` | boolean | No | `false` | Shows bubbles only while dragging |

Legacy `mintext` and `maxtext` are still accepted for backward compatibility.
They will be automatically converted to the new configuration style, using `entities[].text`, when the visual editor is opened.   
Note: if both `mintext` and `maxtext` exist in `bubbles` and `valuesbar`, `valuesbar` text values are selected.

### `ticks` Options

Available when `ticksactive: true`.

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `digits` | `auto` \| `manual` | No | `auto` | Number formatting mode |
| `nbdigits` | number | No | derived from `step` or `0` | Number of decimals when `digits: manual` |
| `majorticks` | number | No | `4` | Number of labeled major ticks. Minimum `2` |
| `minorticks` | number | No | `0` | Number of minor ticks between major ticks |

### `valuesbar` Options

Available when `valuesbaractive: true`.

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `digits` | `auto` \| `manual` | No | `auto` | Number formatting mode |
| `nbdigits` | number | No | derived from `step` or `0` | Number of decimals when `digits: manual` |
| `unit` | string | No | `""` | Unit suffix |
| `showtext` | boolean | No | `false` | Prefixes the value with `entities[].text` when available |

Legacy `mintext` and `maxtext` are still accepted for backward compatibility.
They will be automatically converted to the new configuration style, using `entities[].text`, when the visual editor is opened.   
Note: if both `mintext` and `maxtext` exist in `bubbles` and `valuesbar`, `valuesbar` text values are selected.

### Entities

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `handlesbehavior` | `fixed` \| `flexible` \| `unconstrained` | No | `fixed` | Defines how handles behave when they meet or cross |
| `entities` | array | Yes | - | List of handles to display. At least one entry is required |
| `entities[].entity` | string | Yes | - | Entity id in `domain.object_id` format |
| `entities[].text` | string | No | `""` | Optional label used by `showtext` in bubbles or values bar |
| `entities[].connectprevious` | boolean | No | auto | Draws the filled segment before this handle |
| `connectend` | boolean | No | `false` | Draws a connected segment after the last handle |

`handlesbehavior` modes:
- `fixed`: a handle cannot move past its neighbors
- `flexible`: moving one handle pushes adjacent handles to preserve ordering
- `unconstrained`: handles can cross and entity values are not forced to stay ordered

Rules:
- All configured entities must be unique.
- All configured entities must use compatible domains.
- `input_datetime` entities must all be time-only.
- When only one handle is configured, `connectprevious` defaults to `true`.
- With multiple handles, `connectprevious` defaults to `false` for the first handle and `true` for the others.

Legacy `entity_min` and `entity_max` are still accepted for backward compatibility.

### Domain Behavior

| Domain | Supported | Notes |
|---|---|---|
| `number` | Yes | Uses configured `min`, `max`, and `step` |
| `input_number` | Yes | Uses configured `min`, `max`, and `step` |
| `input_datetime` | Yes | Only time-only entities are supported. Range is always `00:00` to `23:59`; `min` and `max` are ignored |

## Vertical Mode

- Set `orientation: vertical` to render the slider vertically.
- `valuesbaractive` is automatically disabled in vertical mode.
- Use `verticalheight` to control height in rows.
- If `verticalheight` is omitted, the default visual height is `2` rows for `std` and `1` row for `compact`.
- Use `verticallayout: mirrored` to move vertical bubbles and tick labels to the opposite side.

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
- Make sure the configured entities exist and use compatible domains
- Check open issues or report a new one:
  https://github.com/marsoupilami25/flex-slider-card/issues

## Contributing

Issues and pull requests are welcome.
