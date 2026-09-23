# Changelog

Notable changes to Crystal. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and Crystal follows [semantic versioning](https://semver.org/) against the public contract defined in the adoption chapter.

## [Unreleased] — 2.1.0

A minor release in two halves. What changed is what the stylesheet *renders*:
2.0.0 shipped a control surface whose variant signals had been silently
outranked, and this release puts each one back where it belongs. What is new is
the vocabulary charts need — Crystal named chart components in its catalogue and
published nothing a chart could be drawn with.

### Added

- **The chart series scale.** Six categorical colours per palette per mode, as
  `--cr-chart-series-1` through `--cr-chart-series-6`, with `--cr-chart-axis` and
  `--cr-chart-grid` beside them. They are derived from the palette's own seed
  hue, and every one of the seventy-two clears 3:1 against both the surface and
  the canvas of its mode, with no two in a scale closer than a visible step.
  `docs/colors.md` sets out the construction and, just as importantly, says what
  this is not: a series colour is for data marks only, it is never ink or an
  action fill, and it is not the secondary colour arriving by another door.

  This is the first time the pipeline computes a colour rather than copying one.
  It earns that the way the other derived values do — the inputs are tokens
  (`component.chart.series*`), and the outputs are asserted in
  `tests/core-contracts.cjs` across all twelve palette-and-mode combinations.
- **Chart geometry.** `--cr-chart-stroke`, `--cr-chart-hairline`,
  `--cr-chart-point-min`, `--cr-chart-point-max`, `--cr-chart-bar-radius`,
  `--cr-chart-cell-gap` and `--cr-chart-ring-thickness`. The catalogue has said
  "line weight follows the stroke scale" and "point size is a scale, not an
  arbitrary radius" since 2.0; neither scale existed, which is how two renderers
  end up with two of them.
- **`--cr-progress-ring-stroke`.** One value for a circular progress ring and for
  the gauge arc the catalogue says matches it, so the two cannot drift.

**For consumers:** the generated theme CSS gains 98 values and changes none. A
palette added after this release meets the four assertions in
`tests/core-contracts.cjs` before it ships; there is no manual step.

### Removed

- **The `.secondary` button variant.** It named a second action colour, and
  Crystal has no such role: the palettes publish one action pair, and the
  companion and glow hues are expressive paint that is never assumed to be
  text-safe. Promoting the companion is not available either — as a solid reading
  fill it fails the 4.5 floor with both candidate inks in four of the twelve
  palette-and-mode combinations. `docs/colors.md` now states the decision.
  Markup using `.cr-button.secondary` renders as an ordinary action, which is
  what it already looked like; a caller that meant "the emphatic one" wants
  `.cr-button.primary`.

### Changed

- **The primary tint is opt-in, on `.cr-button.primary`.** A bare `.cr-button` is
  the neutral action. The rule used to read
  `:not(.secondary):not(.quiet):not(.danger)` — it had to enumerate every variant
  it was *not* meant to paint, and was one forgotten modifier away from tinting
  the whole surface. The reset layer's `background:var(--cr-primary)` and
  `color:var(--cr-on-primary)` on `.cr-button` are gone with it: they had not
  rendered since the Resin surface was adopted, and would now be wrong as well as
  dead.
- **The primary action's reading fill is the primary colour.** `crystal.reset`
  asks for `background:var(--cr-primary)` on `.cr-button`, and the Resin control
  rule in `crystal.component` has outranked it since the surface was adopted — so
  the colour survived only as the ring of element background left exposed around
  the inset Haze fill, with white `onPrimary` text sitting on a white fill.
  `.cr-button` with no modifier now paints its `::before` in `--cr-primary` and
  takes `--cr-on-primary` as its ink: the palette's own tested pair, 4.74 to
  10.31 against the rendered composite across all six palettes and both modes.
  The perimeter is the ordinary Resin rim. `.secondary`, `.quiet` and `.danger`
  keep the neutral reading fill, which is what makes the primary one read as
  primary.

  The fill is opaque there where the neutral one is 80%, and that is the one
  deliberate deviation in the recipe. An 80% fill transmits a fifth of what is
  behind it — white over a light page is still white, so the neutral pad loses
  nothing, but a mid-tone primary at 80% over the Resin shell composites to a
  washed-out lilac at the luminance where neither a white nor a near-black label
  clears 4.5 (3.37–4.55 with `onPrimary`, 2.95–5.06 with `text`, failing in every
  light palette). A reading ground whose job is to make the label independent of
  the backdrop cannot be the one thing that depends on it.
- **A quiet button has no Haze reading fill.** `.cr-button.quiet` keeps the whole
  Resin shell — rim, float shadow, sheen — and drops the pad, which makes it the
  only variant that is glass all the way through: primary is tinted, secondary is
  the neutral pad, quiet is neither. The pad is what makes a label's contrast
  independent of the backdrop, so a quiet label now reads against the material:
  10.88 to 18.28 on Crystal's own foundation across all six palettes and both
  modes, and unprotected over artwork.
- **The destructive boundary is back.** `.cr-button.danger` had the same problem
  and now carries the independent danger boundary `components.md` requires.
- **The control surface is the library's.** A second adoption pass moved the rest
  of the preview's control rules into `@layer crystal.component`, so a consumer
  of the package renders what the preview renders rather than what it renders
  minus the site's own stylesheet.
- **Reset-layer geometry corrected** against what the preview has always
  rendered: `.cr-button` padding, gap, and the dock and status chip geometry.
  Three dead variant fills and a stale dock underline were removed.

### Added

- **Component geometry tokens** for the action control, bound to the stylesheet
  and checked: `tests/core-contracts.cjs` compares the exported value against the
  rule that is supposed to carry it.
- **A visual gate in CI**, against baselines captured on the runner rather than
  on a desk (D-15).

### Note for consumers

The primary and danger buttons change appearance. Both are corrections to signals
2.0.0 intended and did not render, and both are improvements in contrast rather
than trades against it — but a product that had compensated for the flat primary
in its own stylesheet should re-check it, and any visual baseline that contains a
button needs re-blessing.

## [Unreleased] — 2.0.0

Crystal 2.0 turns a design system with one web preview into a base that platform component libraries consume. The visual identity does not change: the material hierarchy, palettes, defaults, typography and motion timings all carry forward, and the generated theme CSS is byte-identical to 1.0.1.

### Added

- **DTCG token source.** `tokens/crystal.tokens.json` is now the authoring format, with primitive, semantic and component tiers. The flat runtime token file is generated from it, and the build asserts a value-level round trip on every run.
- **Platform exports.** Generated TypeScript, Swift and Kotlin token exports, so no library retypes a value.
- **Cascade layers.** `crystal.reset`, `crystal.base`, `crystal.component` and `crystal.override`. An ordinary unlayered rule in a consumer's stylesheet now beats Crystal without a specificity contest.
- **Headless core.** Pure state and preference derivation with no DOM access, shared by every platform, covered by 18 contract tests.
- **Component catalogue.** 119 components across nine categories, authored as data, with per-component parity references to Mantine, Ant Design and MUI.
- **Parity manifest and platform contract.** `libraries/parity.json` and `libraries/CONTRACT.md`.
- **Icon set.** 1011 icons on Crystal's 24px grid: 13 originals plus 998 derived from Lucide under the ISC License, vendored and normalised.
- **Table primitive.** `.cr-table` gives tables a Crystal surface; the contract existed but nothing implemented it.
- **Visual comparison tooling.** `tools/compare-captures.py` compares captures pixel by pixel and can gate a build.
- **Icon integrity check.** Every referenced sprite symbol and manifest icon must exist.

### Changed

- **Controls no longer mutate the DOM.** Field shells, indicators and navigation classes are authored in markup or emitted by the renderer that owns the control. `controls.js` only reads state and sets attributes. This was the blocking item for every framework library.
- **Focus rings are feathered** across four graded layers rather than a single hard-edged halo.
- **Selection is label weight alone.** A check mark now means validated or informational only, and nothing is drawn beside a label to mark it.
- **Action controls are pills**, independent of the content radius. Card-shaped buttons keep the content radius.
- **One shared header** across the playground, motion, specification and verification pages.

### Deprecated

- The legacy material vocabulary: `--cr-acrylic-*`, `--cr-glass-*`, `--cr-mica-*` and the `.cr-acrylic` and `.cr-glass` classes. They still ship as aliases of the Frost, Resin and Plastic tokens and will be **removed in 3.0.0**. Migrate to the named material vocabulary.

### Breaking

- Products that override Crystal by out-specifying it may now win where they previously lost, because layer order replaces the `:root body` prefix. Re-check overrides visually.
- Any consumer that relied on `controls.js` generating markup must author it instead.

## [1.0.1] — 2026-09-17

### Fixed

- Focus rings are feathered rather than hard-edged.
- Check marks no longer indicate selection; selection uses a leading rail and label weight.
- Action controls are pill-shaped; compact buttons moved from an 8px radius to a full pill with a compliant 44px target.
- One shared header and navigation across every page; only the playground previously carried the logo mark.

### Changed

- Repository restructured: `design-system/` holds Crystal and its preview site, `libraries/` holds platform component libraries.
- The packaged ZIP is published as a release asset rather than committed.

## [1.0.0]

Initial Crystal design system: six materials, six palettes, eight specification chapters, 54 motion recipes, token exports and an interactive preview.
