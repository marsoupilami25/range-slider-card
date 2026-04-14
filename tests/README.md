In this folder are views to test the custom card.

You need to create the following entities:
- `input_number.inputnumbertestmin`
- `input_number.inputnumbertestmax`
- `input_datetime.inputheuretestmin`
- `input_datetime.inputheuretestmax`

Create the views copy/pasting the yaml in the yaml editor

Test files are prefixed to keep a stable directory order:
- horizontal tests first, then vertical tests
- `sections` before `masonry`
- base tests, then `bubbles`, then `ticks`, then `bubbles + ticks`

Short labels are used in card titles to keep them readable in narrow layouts.

Abbreviation legend:
- `Std`: standard format
- `Cmp`: compact format
- `no tit.`: without title
- `VB`: values bar enabled
- no `VB` or `VB2` label: values bar disabled
- `VB2`: values bar with `digits: manual` and `nbdigits: 2`
- `Bul`: bubbles enabled
- `Bul+Tk`: bubbles and ticks enabled
- `Bul vis.`: bubble visibility test
- `Tk`: ticks enabled
- `4/1`, `5/2`, `6/3`, etc.: `majorticks` / `minorticks`
- `inum`: `input_number` case
- `num`: `number` domain case
- `time`: `input_datetime` case
- `g off`: no explicit grid sizing
- `rA`: rows auto
- `r1`, `r2`, `r3`: grid rows `1`, `2`, `3`
- `hA`: automatic height
- `h1`, `h2`, `h3`: forced vertical height `1`, `2`, `3`
- `d0`, `d1`, `d2`: manual digits `0`, `1`, `2`
- `unit`: custom unit display test
- `W40`, `W50`, `W90`, `W100`: horizontal width percentage
- `RTL`: right-to-left direction
- `vlay`: vertical layout
- `std`: standard vertical layout
- `mir`: mirrored vertical layout
- `on`: enabled / always visible
- `drag`: visible during drag only
- `mod`: `card_mod` styling test
- `slider`: slider styling target
- `tip`: bubble tooltip styling target

Focused views are also available for specific options:
- `06_horizontal_masonry_horizontalwidth.yml`
- `09_horizontal_masonry_bubbles_dragonly.yml`
- `17_vertical_masonry_verticallayout.yml`
- `07_horizontal_masonry_card_mod.yml`

`07_horizontal_masonry_card_mod.yml` requires `card-mod` to be installed in the test environment.

Warning: two entities from `number` domain are used: `number.bureaucontrole_chauffagetempcftmin` and `number.bureaucontrole_chauffagetempcftmax`. They are used to test the `number` domain is working well but should be replaced by existing entities from `number` domain in the test environment.
