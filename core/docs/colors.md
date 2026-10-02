# Color architecture

Crystal separates expressive identity from functional meaning. The bolder palettes expand beyond the original muted range; they do not create an exemption from accessibility.

## What “outside status colors” means

WCAG does not reserve particular hues for errors, success, warnings, or information. Its use-of-color requirement addresses conveying meaning through color alone. Crystal instead treats separation as a system architecture choice: brand tokens may vary by product, while functional status tokens remain stable and have visible text and symbols. [W3C: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).

Prism, Fuchsia and Amethyst emphasize violet/magenta away from conventional traffic-light statuses. Cobalt and Ion provide blue/cyan alternatives. They are brand identities, not success or information indicators. The information status uses an independent neutral slate pair to avoid inheriting a product’s primary brand color.

## Product palettes

<!-- generated:palettes -->

| Identity | Seed | Companion | Glow |
|---|---|---|---|
| Prism | `#7338EF` | `#EF48C6` | `#52BDF3` |
| Fuchsia | `#C01993` | `#7C4DFF` | `#FF96DA` |
| Cobalt | `#2758E8` | `#6D47F2` | `#48C6F0` |
| Ion | `#007E97` | `#3D45E5` | `#36DCD1` |
| Amethyst | `#8430C6` | `#CE49B2` | `#9198FF` |
| Harbor | `#4669B2` | `#8970B5` | `#72C4DF` |
<!-- /generated:palettes -->

The seed is not automatically a text color. The canonical [token JSON](../tokens/crystal.json) defines paired light/dark values. The bold palette entries are authored sRGB mixtures; they do not use or claim conformity to Material’s tonal generator. Harbor retains mapped values from the original generated palette.

## Token layers

| Layer | Examples | Rule |
|---|---|---|
| Expressive | `decorative`, `companion`, `glow`, atmosphere stops | Decorative fields and artwork; never assumed to be text-safe |
| Semantic | `surface`, `text`, `primary`, `onPrimary`, `primarySoft`, `onPrimarySoft` | Use as matched foreground/background pairs |
| Functional | `success`, `attention`, `danger`, `info` ink/surface pairs | Independent of brand palette and mode-aware |
| Component/material | Resin fill, Stone backing, edge, shadows, radii | Derived from the chosen palette and settings |

### There is no secondary colour, and that is a decision

Crystal defines one action pair per palette: `primary` with `onPrimary`, and
`primarySoft` with `onPrimarySoft` for the container form. There is no
`secondary`, and nothing in the token set, the exported theme or the component
vocabulary names one.

A palette has more than one hue: each carries a seed, a companion and a glow, and
all three ship as `--cr-decorative`, `--cr-companion` and `--cr-glow`. None of
them carries an ink. They sit in the Expressive layer above because they have
never been given a tested foreground. The resolver consumes them in four places,
all of them paint and none of them ground: the three atmosphere stops and the
focus shadow.

The companion cannot be promoted by renaming it. As a solid reading fill it
fails the 4.5 floor with both candidate inks in a third of the matrix: Prism
dark 3.27 against white and 3.00 against the text ink, Amethyst dark 4.02 / 3.68,
Harbor 4.16 / 3.07 in light and 4.16 / 3.32 in dark. The other eight
palette-and-mode combinations clear it between 4.54 and 6.60, and eight of twelve
is too few to define a role. A secondary action colour would need its own tuned
tones and its own tested ink authored per palette per mode. That work has not
been done, and promotion does not replace it.

For components, the consequence is that **no variant may be named after it**. A
`.secondary` button existed until 22 September 2026 and was withdrawn for this
reason: the system does not define the colour the variant was named after.
Emphasis is carried by `.primary` being opt-in, by label weight, and by placement.

### The chart series scale, which is not that

Charts need several colours at once and a palette gives one. Crystal 2.1.0
therefore publishes a **series scale**: six categorical colours per palette per
mode, as `--cr-chart-series-1` through `--cr-chart-series-6`, alongside
`--cr-chart-axis` and `--cr-chart-grid`.

The series scale is not a secondary colour. A series colour is for data marks
only: a bar, a line, a segment, a cell. It is never ink, an action fill, a
surface or a state. It has no tested foreground, because nothing is ever set on
top of it. The companion lacks that property and cannot be given it by renaming.

They are derived in `tools/build-tokens.cjs` and not picked by hand, because
what has to be true of seventy-two colours is a measurement. Take the palette's
seed hue, turn half a step off it, step six times around the hue circle, and draw
all six at one OKLab lightness (0.55 light, 0.72 dark) and one chroma (0.18).
Then:

- Every one clears 3:1 against both the surface and the canvas of its mode. A
  data mark is a graphical object carrying information, so WCAG 1.4.11 applies.
  Where a hue cannot reach the floor at the stated lightness, its lightness moves
  until it does: the floor takes priority over the family resemblance.
- No two in a scale are closer than 0.10 in OKLab. Segments and stacked bars
  are adjacent to each other as well as to the ground.
- All six share one lightness: a categorical scale must not imply an order, and
  a ramp does.
- The ring is centred on the palette hue and does not start from it. A slot on
  the seed hue at these lightnesses is the palette's action colour, and people
  try to press a data mark that has the colour of every button on the page.

All four are asserted in `tests/core-contracts.cjs` for all twelve
palette-and-mode combinations.

Beside the series scale, Crystal 2.1.0 publishes an **intensity ramp**:
`--cr-chart-heat-1` through `--cr-chart-heat-5`, for a heatmap cell or a calendar
day, each with its own ink as `--cr-chart-on-heat-N`. A cell is a ground and not
a mark, because the value is written on it, so the floor that applies is the text
one, 4.5:1, and it applies to every step. The ink changes partway along the ramp
in some palettes, as a ramp spanning light to dark has to. The construction
guarantees that no step falls in the gap where neither of a mode's inks reaches
the floor. It is a search and not a constant because of Harbor: its body ink is a
soft grey rather than a near-black, and a ramp built for the other five would be
unreadable in Harbor.

Hue separation runs out at six, and a chart may have more series. **A seventh
series repeats the first colour and must differ by another channel**: a dash
pattern, a fill pattern, a marker shape. The rule applies at every count, not
only from the seventh series: colour is never the sole carrier of a series,
because six hues at sixty degrees do not survive dichromatic vision. Two of the
six also sit near the danger and success hues; they carry no such meaning, and a
chart that needs to say "bad" says it in words.

CSS variables use the `--cr-` namespace and kebab-case names. Source JSON uses camelCase keys and the explicit `Crystal token schema v1`; it is not advertised as a Design Tokens Community Group interchange schema.

## Functional meanings

| Meaning | Light ink / surface | Dark ink / surface | Required visible cue |
|---|---|---|---|
| Success | `#175D38` / `#E5F4EA` | `#9BE2B3` / `#173525` | Check plus context-specific wording |
| Attention | `#714B00` / `#FFF0CD` | `#FFDA8A` / `#3D2D0E` | Triangle plus issue/action wording |
| Danger | `#941D36` / `#FFE8EC` | `#FFB2C0` / `#481C29` | Exclamation plus explicit consequence |
| Information | `#334155` / `#E8EDF4` | `#D2DCEC` / `#263244` | Information symbol plus explanation |

Use context-specific phrases rather than “red item” or “green action.” Keep errors near the affected input and programmatically associated with it. Never reuse danger styling as ordinary brand decoration inside a status-heavy task.

## Atmosphere and contrast

Color atmosphere ranges from 15% to 90%, with a recommended default of 90%. This value controls a bounded decorative contribution to the opaque foundation; it is not whole-page opacity or text opacity. Frost base tint ranges from 35% to 85%, with a recommended default of 35%, with Frost receiving ten additional percentage points, capped at 94%. Resin is independent of that control and renders at a fixed 20% fill opacity. Stone, a separate 55% light / 60% dark fill with a 1.95px feather, protects Resin labels without turning the inner plane nearly opaque. Its safety depends on the supporting glass tint and optical sheen; test the full composite, not the veil alone. These are independent design choices, not copied vendor compositor constants.

Contrast calculations use sRGB relative luminance. Normal text pairs target at least 4.5:1; essential non-text identification targets at least 3:1 where applicable. The live table checks defined solid pairs. Transparent composites require additional verification against supported backdrop extremes. A high body-text ratio does not certify all UI states.

## Adding a company or product palette

Add a complete entry under `palettes` in the canonical JSON, including both modes. Use brand seeds for identity, then define readable semantic pairs, independent functional states and tested gradients. Run the token validation and inspect full tasks, not just swatches. Do not modify the immutable source copies in `reference/` to disguise a new palette as approved.

The controls deliberately offer curated presets rather than an unrestricted color picker; arbitrary colors would need new paired-token generation and composite validation. The design still supports new company palettes through explicit token authoring.

## Status

**Status colours are independent of brand palettes and are never redefined by them.**

The four statuses are `success`, `attention`, `danger` and `info`, set with a
`data-status` attribute. Each carries an icon as well as a colour.

Crystal ships six product palettes. Every one of them changes the primary, the companion,
the decorative and the glow. None of them changes what success, warning, error or
information look like.

The reason is that a status colour is a shared vocabulary. If error is red in one
Meridian product and magenta in another because magenta suited the palette, then red
stops meaning error and the user has to re-learn a safety signal per product. Brand
identity is expressed in the primary, and status colours are not used to express it.

<div class="feedback-grid">
<span class="cr-status" data-status="success"><span aria-hidden="true"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="../assets/icons.svg#check"/></svg></span>Ready</span>
<span class="cr-status" data-status="attention"><span aria-hidden="true"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="../assets/icons.svg#attention"/></svg></span>Needs review</span>
<span class="cr-status" data-status="danger"><span aria-hidden="true"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="../assets/icons.svg#alert"/></svg></span>Failed</span>
<span class="cr-status" data-status="info"><span aria-hidden="true"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="../assets/icons.svg#info"/></svg></span>Scheduled</span>
</div>

These render identically under all six palettes. Switch palettes in the
[Playground](../playground.html) to see that they do not change.

Status colours still respond to mode, because a red that is legible on a light canvas
is not the same red that is legible on a dark one. The pair is derived from the status
token and never from the active palette.

Status is never the only signal. Each status carries an icon and a text message; see
[colour is never the only signal](accessibility.html#colour-is-never-the-only-signal).

### What may and may not be re-pointed

| Token | Re-pointable by a product palette? |
| --- | --- |
| `semantic.material.primary` and its companions | Yes. This is what a palette is |
| `primitive.palette.*` seeds | Yes, by adding a palette |
| `semantic.feedback.*` | **No** |
| `component.focus.*` | No. Focus follows the primary automatically |

A product that needs a status colour changed has a semantics problem, which theming
does not solve. The answer is a new semantic token. An existing one is never redefined.
