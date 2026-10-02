# Captures: component recipes and the surface vocabulary, 28 September 2026

This file records what was captured, how, and what it was compared against.
Every image here is the specimen sheet at `../examples/index.html`, served over
loopback by `../examples/serve.cjs` on port 4321 and photographed by Playwright's
Chromium at 1280×900, device scale 1, after `document.fonts.ready`. The sheet loads
`core/assets/crystal-theme.css` and `core/assets/crystal.css` by relative path and
adds layout only, so the pictures show what a consumer of the library gets.

| File | What it shows |
|---|---|
| `sheet-light.png`, `sheet-dark.png` | The whole sheet: all 22 surfaces, both modes. |
| `controls-*.png` | The control surface: default, primary, quiet, danger, selected, disabled, and the **new** disabled link. |
| `choices-*.png` | Checkbox, radio, range, and the **new** native switch, on and off. |
| `nav-item-*.png` | Before/after: the catalogue's "Resin shell" navigation link (capsules) beside the **new** `.cr-nav-item`, plus the stacked rail. |
| `bare-*.png` | Before/after: a `<button style="background:transparent">` keeping the coat's other four layers, beside the **new** `.cr-bare`. |
| `overlays-*.png` | The same menu as the chapters described it (`.cr-resin-haze`) and as the approved site renders it (`.cr-frost`, R15e). |
| `dialog-*.png` | The real `<dialog class="cr-dialog">` open over its Mirage backdrop. |
| `*-forced-colours.png` | The navigation entry and the choices under `forced-colors: active`: the current entry is a Highlight ring, never a fill; the choices fall back to `appearance: auto`. |

## Compared against

The captures were compared against the four approved material studies in
`crystal-preview/website/reference/approved-crystal/` (material hierarchy, Plastic
foundation, Haze over Resin, layered materials), for the qualities AGENTS.md lists:
opacity and diffusion, transmitted colour, optical contours, elevation, feathered
Haze and Stone paint, crisp foregrounds. They were inspected by eye in both modes.

What the new recipes were checked for specifically:

- `.cr-nav-item` renders the documentation site's `.menu-item` as the site renders
  it (weight 650 to 800, surface-alt on hover and current, no coat), which the
  site's own override-layer comment describes and which `docs/components.md` names
  as the reference implementation of selection.
- `.cr-bare` leaves no fill, shadow, blur or pseudo-layer on the row's controls
  while the row itself (Haze) is unchanged. The left-hand "before" column shows
  what a transparent background alone leaves behind.
- The switch reads `--cr-switch-track-width`/`-height` from the theme; the thumb
  travels their difference.
- Nothing else on the sheet changed appearance from 2.1.0. The generated theme grew
  by five custom properties and by nothing else (`git diff core/assets/crystal-theme.css`).

## What these captures are not

These captures are not the visual gate. The gate's baselines live in
`crystal-preview`, are captured on its CI runner, and cover the documentation
site. The sheet here is a proposal's evidence, and its frames are not blessed
anywhere. They are also Chromium only, at one viewport, in the Prism palette the
default theme ships. The six-palette, two-density, two-direction evidence
CONTRACT §5 asks of a *library* is the library's to produce.

## The cascade under the three new recipes, measured

The first version of `.cr-bare`, `.cr-nav-item` and `.cr-drag-handle` was written
as a lone class. Crystal's element coat, `:is(button, a.cr-button, …)`, is
specificity (0,1,1) in the same layer, and a lone class is (0,1,0), so on a
`<button>` the coat won every property it set and bare kept three of its five
layers. This was caught in review and fixed by carrying the element compound in
each selector (`:is(button, a, [role=button], .cr-bare).cr-bare`, (0,2,0)). It
was then measured by planting six elements into the sheet's Haze card and
reading computed style (`capture-specimens.cjs --measure`, Chromium, light mode,
Prism):

| Planted | background | border | backdrop-filter | box-shadow | min-height | `::before` |
|---|---|---|---|---|---|---|
| bare `<button>` (the coat) | rgba(255,255,255,.2) | rgba(255,255,255,.85) | blur(20px) saturate(1.65) | the rim + float shadow | 48px | `""` / block |
| `<button class="cr-bare">` | transparent | transparent | none | none | **44px** | `""` / none |
| `<div class="cr-bare">` | transparent | transparent | none | none | 44px | none / none |
| `<button class="cr-bare cr-drag-handle">` | transparent, grip `radial-gradient(…)` | transparent | none | none | 44px | none |
| `<a class="cr-nav-item">` | transparent | transparent | none | none | 44px, weight 650 | none |
| `<button class="cr-nav-item">` | transparent | transparent | none | none | 44px, weight 650 | none |

A bare control is therefore bare on a `<button>` as well as on a `<div>`, the
drag handle's grip survives the coat's `background` shorthand, and a navigation
entry on either element is furniture. The 44px is the documented floor and is now
the measured target for these three. The ordinary action control stays at 48px.
The contract test asserts the compound is in the selector, because the regex it
started with passed on a rule that never won.
