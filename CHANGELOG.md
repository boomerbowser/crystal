# Changelog

Notable changes to Crystal. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and Crystal follows [semantic versioning](https://semver.org/) against the public contract defined in the adoption chapter.

## [Unreleased]

## [2.3.0] — 2026-09-29

A minor release of the three rulings Meridian made on 28 September. A navigation
entry now marks where the reader is with a dot as well as weight; the
catalogue's surfaces say what actually renders, so a consumer that adopts a
surface gets the element it was shown; and the field shell's decorative rim is
stated as decorative. The tooltip's radius becomes a token. The only change a
reader of the stylesheet will see is the dot on `aria-current`.

### Added

- **A navigation entry marks its current location with a dot** (D-22, ruled on
  28 September). The catalogue has always said "current location is a dot;
  selection within a set is label weight", and `.cr-nav-item` drew no dot.
  It does now: a flat 6px primary mark on `aria-current` only — never on
  `aria-selected` or `aria-pressed`, which are selection — positioned inside the
  entry's own inline-start padding so the label does not move by a pixel, and
  carrying no material, shadow or blur. Above the icon when stacked; mirrored
  right to left; `Highlight` under forced colours.
- `component.overlay.tooltipRadius`, 18px — the tooltip's radius, which the
  catalogue stated only as prose.

### Changed

- **The catalogue's surfaces match what renders** (D-23, ruled on 28 September).
  Tabs, the segmented control, the toolbar, the command bar, the action bar, the
  button group and the split button are `dock`, not `resin`: each measures
  identical to `.cr-dock`, Resin holding one Haze fill under its controls. The
  resizable handle and the image comparison's thumb are `resin`, as their own
  prose said, not the grab-to-move `drag-handle`; the media controls are `resin`
  at the pill; the rich text surface is a `field`. The `resin` and `dock`
  descriptions in `surfaces.json` now say which is which. The rail's prose, the
  dialog's radius and the tooltip's radius agree with their surfaces and
  recipes. Recorded in `tools/extend-catalogue-6.cjs` with the old values.
- `docs/accessibility.md` states how the field shell's rim is treated (D-24,
  ruled on 28 September): measured at 1.06:1, decorative, the field identified by
  its shell, its well and its label. The "colour is never the only signal"
  table says the same of the current page: a primary dot, which is a mark rather
  than a tint, and the label's weight.

### Fixed

- The `dock` surface's description said a strip's selected segment takes the
  primary-soft fill. It takes the primary fill, as the tab and segmented-control
  entries say, as `.cr-dock button:is([aria-pressed=true],[aria-selected=true])`
  draws it, and as the documentation site renders a selected tab. The wrong
  sentence was written from Crystal React's strip rather than from Crystal, in
  the same change that corrected the surfaces.

## [2.2.0] — 2026-09-28

A minor release that gives the catalogue something to be checked against. Every
component names its surface from a closed vocabulary of 22, and every surface
has a recipe in the stylesheet — including four the catalogue had specified and
no consumer could obtain. Motion that the specification always assigned is now
carried by the entries, and three decisions Meridian made on 28 September close
the gaps that were deliberately left: continuous indicators for pending work, a
data mark arriving, and a number field that stays reachable. Nothing that reads
the stylesheet changes appearance, except that an action control's minimum
target is published as the 48px it has always rendered.

### Added

- **Continuous indicators, for work that is genuinely pending** (D-19, ruled by
  Meridian on 28 September). `activity-turn` (a loader, or an indeterminate
  progress ring), `activity-travel` (an indeterminate bar) and `skeleton-sweep`
  (the skeleton's luminance sweep) are the only recipes that repeat. They run
  while the work they report is pending and stop when it resolves; all three
  travel linearly at one period, `motion.flow`, and carry no spring; reduced
  motion leaves the whole track or fill, static. The motion chapter's "no
  effects autoplay or loop" names the exception, and `tools/validate-motion.cjs`
  refuses a loop by any other name, at any other period, or one that rocks
  rather than travels. `loader`, `progress` and `skeleton` claim them. Closes
  [#1](https://github.com/boomerbowser/crystal/issues/1).

- **`mark-in`, a data mark arriving** (Crystal React's R-21, ruled on 28
  September). A bar, series or segment grows from its baseline when a chart first
  appears — 500ms, staggered 24ms per mark up to 24 marks, all together past that.
  It declares `overshoot: "never"` and is fitted critically damped, because a
  mark that overshoots its value has shown a number that is not true; that and
  the new `stagger` field are validated, and a staggered sequence is held to the
  same 2000ms ceiling as a single transition. `bar-chart`, `line-chart` and
  `pie-chart` claim it.

- **The browser runtime plays both.** `core/assets/motion.js` and
  `core/engines.js` played every recipe once on an ease curve. A continuous
  recipe now repeats at constant speed until `stop()`, without the optical
  layers — a feathered edge rippling for as long as something is loading would
  be ambient motion by another route — and a staggered one takes
  `{ index, count }` and waits its turn. Measured in a browser against the
  bundled engine, and against the previous runtime, which gives one cycle on the
  default curve and no stagger.

- **Every component names its surface.** `core/tokens/surfaces.json` is a closed
  vocabulary of 22 material compositions — Plastic, Frost, Haze, the Resin plane
  and panel, the control, the field shell, compact display, Stone, Mirage, the
  dialog, indicator, status badge, bubble, table, dock, navigation entry, bare
  control, drag handle, the native selection controls, native furniture, and
  none — each tied to the `crystal.css` recipe that implements it. All 285
  catalogue entries carry a `surface` field drawn from it, outer to inner, and
  `tools/build-catalogue.cjs` refuses an entry naming a surface the vocabulary
  lacks or a vocabulary entry whose recipe the stylesheet lacks. Exported as
  `@crystal-ui/core/surfaces`; listed with counts at the top of the catalogue
  chapter. Before this the only machine-readable link from a component to a
  recipe was `motion`, `material` was prose that 102 entries left empty of any
  material name, and a library could satisfy it with any recipe it liked —
  Crystal React wrote 43 of its own.

- **Four recipes the catalogue specified and no consumer could obtain**, each
  found by Crystal React reaching for it and rebuilding it locally under a
  comment saying Crystal had none: `.cr-nav-item` (a navigation entry, selected
  by label weight — lifted from the documentation site's side menu, which
  `components.md` has always called the reference implementation of selection
  and which lived only in the site's stylesheet), `.cr-bare` (a control that
  must not wear the Resin coat because it sits inside a surface that already
  has one; Crystal paints every `<button>` by element in five layers and
  `background: transparent` took off one), `.cr-drag-handle`, and
  `.cr-resin.panel`. Plus the native switch —
  `input[type=checkbox][role=switch]` — styled by element beside the checkbox
  and radio, and a disabled state for action links, control spans and entries,
  which had none. All in `@layer crystal.component`, each with reduced-
  transparency and forced-colours clauses, and each held by
  `tests/core-contracts.cjs`.

- **114 more catalogue entries claim the motion they were always owed.** The
  family table in `motion-components.md` has said since 2.0 that a date picker
  takes `menu-in/out`, `selection` and `page-in`, a table row `list-in/out` and
  `highlight`, a badge `attention`; the entries did not carry it, and a
  consumer that plays "what the catalogue assigns" therefore shipped 145
  components with no motion at all. Every recipe claimed already existed. 162
  of 285 entries now carry motion; the two gaps that need a decision — D-19's
  continuous indicators and R-21's chart mark enter — are deliberately still
  empty. `tools/extend-catalogue-4.cjs` is the record.

- **Parity status is merged, not regenerated.** `libraries/status/<platform>.json`
  is the record a platform library keeps; the build merges it into
  `libraries/parity.json`. The web record is seeded from Crystal React's own
  manifest: 265 implemented. The manifest used to be regenerated as `not-started`
  for every component on every build, so the file the README called "the single
  source of truth for what exists" said 283 of 285 did not.

- Five control tokens the package published and the stylesheet restated as
  literals now reach CSS: `--cr-action-disabled-opacity`, `--cr-choice-box-size`,
  `--cr-choice-box-radius`, `--cr-switch-track-width`, `--cr-switch-track-height`.
  The checkbox, radio and switch read them. The generated theme grows by these
  fifteen lines and changes in no other way.

### Changed

- **The quantity stepper is not a spin button, and neither is the number
  input** (Crystal React's R-22, ruled on 28 September). Both entries asked for
  `role=spinbutton`; the accessible primitive underneath removes it on purpose,
  because a spin button cannot be focused with VoiceOver, and trading
  reachability for a role name regresses the accessible surface. Both now
  describe a typable numeric field whose bounds are announced when reached.
  `line-chart`'s "draw-on motion" is the enter motion it now has. The old
  sentences are quoted in `tools/extend-catalogue-5.cjs`.

- **Transient overlays are Frost, and the specification now says so
  everywhere.** Meridian moved tooltip, popover, menu and toast to Frost on
  17 September 2026 (R15e), and the documentation site has rendered them so
  since. `materials.md`, `components.md` and `motion-components.md` still said
  those surfaces use `.cr-resin-haze`, and eight catalogue entries said Resin or
  Stone. All corrected; `.cr-resin-haze` is for display elements that sit *on*
  content — tags, badges, labels, keyboard caps. The old sentences are quoted
  in `tools/extend-catalogue-4.cjs`.

- The catalogue's `nav-link` was "Resin shell with Haze fill"; the reference
  implementation is Plastic, and the site's own comment says why ("thirteen
  floating capsules would be exactly the legibility noise the hierarchy exists
  to prevent"). Its `indicator` was "Resin shell"; `components.md` says an
  indicator is Haze, not Resin. Both now agree with the specification.

- `components.md` and `motion-components.md` each said a selected item carries
  "a circular check badge". A check mark means validated, never selected —
  Crystal's most frequently violated rule, violated by its own chapters.
  `materials.md`'s "Motion at rest" is marked deferred, with the reason, rather
  than reading as a rule in force. The runtime paragraph in
  `motion-components.md` named four scripts that are the documentation site's
  and not in the package.

### Fixed

- **`catalogue.json` carried the day it was built**, as `generated`. A
  committed generated file that depends on the calendar fails both workflows'
  check that a build changes nothing, on any run after midnight UTC — which is
  what failed CI on 24 September, for a commit made at 21:18 in New York. It
  carries `version` instead, the release it ships in. Nothing in this
  repository, Crystal React or the documentation site read `generated`; a
  consumer that did should read `version`. Proved by rebuilding with the clock
  moved three days forward: only the evidence timestamp changes.

- The publish workflow exempted the token evidence's timestamp and not the
  "Checks run" row that quotes it in `docs/accessibility.md`. `verify.yml` had
  learned that; `publish.yml` had not, so a release tagged on a later day than
  its commit would have been refused.

- The recipe table in the motion chapter asked `spring.js` for the damping
  ratio of every recipe, including any without a spring — which returns the
  defaults' ratio and would have printed physics a loop does not have. A recipe
  with no spring is shown as a linear loop.

- **`tools/build-catalogue.cjs` wrote the parity manifest outside the
  repository** — to `../libraries/parity.json`, a path left from the monorepo
  layout — so the committed file was never regenerated and the rule that a
  generator may not touch anything outside the repository was broken on every
  build. It writes inside the repository now.

- The catalogue's motion references were never checked against the recipes.
  `dialog` and `scrim` named `mirage`, `mirage-out` and `dismiss`, which exist
  as material presets in `core/presets` and not as recipes; the orphan check
  ran only the other way. Both directions are checked now, a preset name being
  a valid claim. The exemption for an `Ambient` recipe category, withdrawn in
  R22, is gone with the category.

- The comment introducing the component layer in `crystal.css` said the reset
  rules "are unlayered and therefore beat these". They are in `crystal.reset`
  and lose — which is D-20 and D-21's mechanism, described backwards at the
  place it happens.

- **The action control's minimum target is 48px, and now says so.** It has been
  48px in every Crystal page since the control surface was adopted — the
  component layer's `:is(button,a.cr-button)` set it, and a later layer wins
  regardless of specificity, so the `.cr-button` rule in `crystal.reset` that
  said 44px never rendered for anything. Meanwhile the package published
  `component.action.minTarget` as **44px**, and that is the value platform
  libraries consume: Crystal React read it and drew its buttons four pixels
  shorter than the preview, correctly and invisibly.

  The token moves to 48px rather than the rendering moving to 44px, because a
  target may be improved and never regressed, and 48px is what people have been
  pressing. The floor remains 44px; this is above it and must stay above it.

  **For consumers:** a library that consumed `action.minTarget` grows its action
  controls by 4px and thereby matches Crystal for the first time. Nothing that
  reads the stylesheet changes at all.

- **`tests/core-contracts.cjs` was green on a rule that did not render.** It
  bound each geometry token to the first `.cr-button` rule it found, which is
  the reset-layer one, and asked nothing about whether a later layer took the
  value back. It now requires every other rule that could reach the same element
  to agree, with pseudo-elements excluded — a `::before` is a different box, and
  `border-radius: inherit` on the reading pad follows the control rather than
  contradicting it — and with variant selectors listed explicitly, so that a
  variant which genuinely differs is a decision rather than an omission.

  Planted on the original defect before being believed.

## [2.1.0] — 2026-09-24

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
- **The intensity ramp.** `--cr-chart-heat-1` to `--cr-chart-heat-5` for a
  heatmap cell or a calendar day, each with the ink that reads on it as
  `--cr-chart-on-heat-N`. A cell is a ground rather than a mark, so the floor is
  the text one and it is met at every step.
- **Chart geometry.** `--cr-chart-stroke`, `--cr-chart-hairline`,
  `--cr-chart-point-min`, `--cr-chart-point-max`, `--cr-chart-bar-radius`,
  `--cr-chart-cell-gap`, `--cr-chart-ring-thickness`, `--cr-chart-fill-opacity`,
  `--cr-chart-link-opacity` and `--cr-chart-gauge-sweep`. The catalogue has said
  "line weight follows the stroke scale" and "point size is a scale, not an
  arbitrary radius" since 2.0; neither scale existed, which is how two renderers
  end up with two of them.
- **The pushed-view recipes.** `view-push-in` and `view-push-out`, in the
  Navigation family. The catalogue has said since 2.0 that a view stack's views
  "enter and leave along the reading direction", and the nearest thing Crystal
  published was `page-in`, which is a view arriving *forward* on the block axis —
  a different movement saying a different thing. A stack that used it said "new
  location" where it meant "one step deeper".

  Two recipes rather than four, because a pop is a push mirrored and
  right-to-left is a push mirrored again: the reorientation a consumer already
  has points an authored movement, and a second copy of a movement is a second
  fitted spring to keep in step with the first. The departing view travels a
  fraction of the arriving one's distance and stays behind it, which is what
  makes the two read as one stack rather than as two independent slides — and
  what makes a back gesture legible before it has been made.

- **`--cr-progress-ring-stroke`.** One value for a circular progress ring and for
  the gauge arc the catalogue says matches it, so the two cannot drift.

**For consumers:** the generated theme CSS gains values and changes none. A
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

## [2.0.0] — 2026-09-20

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
