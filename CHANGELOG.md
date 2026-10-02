# Changelog

Notable changes to Crystal. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and Crystal follows [semantic versioning](https://semver.org/) against the public contract defined in the adoption chapter.

## [2.4.0] - 2026-10-02

Media and text recipes, and every surface's recipe as values, from the
proposal of 2 October 2026 (`proposals/2026-10-02-media-text-and-recipe-parity.md`),
and the rulings of the same day (`proposals/2026-10-02-rulings.md`).
`crystal-theme.css` is byte-identical. The travelling selection pill (D-37) is
ruled and follows in a later minor version.

### Added

- **Each surface's recipe as values.** `core/tokens/surface-recipes.json`,
  exported as `@crystal-ui/core/surface-recipes`, gives every surface's fill,
  blur, saturation, rim, shadow, radius, padding, feathered layer,
  pseudo-element layers and four fallbacks as token references, generated from
  `crystal.css` by `tools/build-surface-recipes.cjs`, so a SwiftUI or Compose
  library can implement a surface without reading a stylesheet. A contract
  check fails when it is stale or names a token that does not exist.
- **Media recipes.** `.cr-media` (the stage: content radius, letterbox,
  `--cr-media-aspect`, `--cr-media-fit`), `.cr-media-bar` (the transport
  inset 12px, or the safe area in full screen), `.cr-resin.transport` (4px and
  12px padding around the 48px targets, tabular readouts on Haze pills,
  wrapping below 420px), `.cr-media-caption` and `.cr-media video::cue` (the
  cue on Stone, above the transport), and `.cr-haze.cr-media.audio` (the
  audio card).
- **Text recipes.** `.cr-prose` and `.cr-editor` share one reading vocabulary
  with the values Crystal React's `Prose` renders, plus checklists, `u`, `s`,
  `ins`, `del`, `kbd`, `sub` and `sup`; the editor has the primary caret and a
  28% primary selection that stays distinct from a highlight.
  `.cr-field-shell:has(> .cr-editor)` is the editor's frame;
  `.cr-editor-toolbar` sits above the text on a fine pointer and below it,
  sticky above `keyboard-inset-height`, on a coarse one or with `.below`.
- **`.cr-frost.bar`**, a transient overlay shaped as a row of controls: the
  selection toolbar.
- Four `also` registrations in `surfaces.json`: `.cr-resin.transport`,
  `.cr-media-caption`, `.cr-frost.bar`, `.cr-editor`. The vocabulary stays at
  23 surfaces.
- **Eleven icons the format vocabulary requires** (D-35): `heading-2`,
  `heading-3`, `heading-4`, `link`, `unlink`, `list`, `list-ordered`, `quote`,
  `subscript`, `undo` and `redo`, kept by a named list whatever the slice of
  Lucide picks. The manifest lists them under `required`; the set is 1022
  icons. The build reports every icon that arrives or leaves against the
  committed manifest and refuses a removal outside a major release, because
  icon identifiers are public contract.
- **A reason for every partial recipe.** `surfaces.json` gains a `partial` map,
  copied into each `surface-recipes.json` record as `why`, for a selector that
  cannot resolve every material it names (a part of a larger surface, or a
  value taken from what it is worn on). A contract check fails on a gap
  without one.
- **36 contrast checks** for text marks (D-34): the highlight's ink on its
  fill, and body ink under the editor's selection on the surface and on Haze,
  at 4.5:1 in every palette and mode. 1,824 cases.
- **The media and text recipes in the specification.** `docs/components.md`
  describes each recipe with a live specimen and says how a highlight and a
  selection differ; `docs/materials.md` says which material each composition
  uses.

### Changed

- **Catalogue.** `tools/extend-catalogue-8.cjs` changes 38 fields across ten
  entries and adds none (284). The video player gains its stage, settings menu
  (speed, subtitles, audio track, quality, as radio items with selection by
  weight), captions on Stone, picture in picture and full screen; the audio
  player its Haze card and speed menu; the media controls their geometry; the
  rich text surface the format vocabulary, the selection toolbar and touch
  placement; prose, the prose list and text the read-only vocabulary.
- **Catalogue, from the rulings of 2 October** (`tools/extend-catalogue-9.cjs`).
  The rich text surface's note allows an optional engine binding from a
  library's own entry point, with the format vocabulary as the contract
  (D-30). Nine motion assignments no component can play come off: `list-out`
  on the transfer list, the data table and the resizable table;
  `accordion-out` on the tree view, the navigation tree, the organisation
  chart and the spoiler; `page-out` on master-detail; `list-in` on the
  combobox. The menubar and the split button say their menus are the
  product's children (D-32).
- **Catalogue prose agrees with its surfaces** (`tools/extend-catalogue-10.cjs`).
  `tools/build-catalogue.cjs` refuses an entry whose material or anatomy names
  a material none of its surfaces is made of. 26 entries failed, and 22 are
  corrected: the overlay anatomies say Frost (R15e), the toast and the
  notification add `haze`, the indicator's anatomy says Haze, the angle slider and the knob
  take `resin`, and charts name the token they colour with. A surface is
  assigned only where a component wearing it was measured; six entries whose
  prose specifies a material no component draws yet are listed as awaiting a
  measurement.
- **The combobox's and the cascader's popovers are Frost** (R15e), as their
  surfaces already said (`tools/extend-catalogue-11.cjs`).
- **The vocabulary.** The navigation entry has no material of its own, and the
  dock is Resin, Haze and Stone, which is what `.cr-dock-inner` paints.
  `.cr-button` is element-keyed (it coats a `button` or an `a`; `.cr-control`
  coats any element). The editor's selection is described as the 28% primary
  tint it is, not primary-soft.
- **The material presets are studies in 2.x** (D-31). `presets.js` and the
  motion chapter both say that `plastic`, `frost`, `resin`, `haze`, `stone`
  and the five compositions are assigned to no entry; `mirage`, `mirage-out`
  and `dismiss` are the entrances and exits, on the dialog and its scrim.

### Fixed

- **Materials keep their diffusion through a consumer's minifier (D-38).**
  `crystal.css` wrote `backdrop-filter` before `-webkit-backdrop-filter` in 23
  rules. lightningcss, which Vite 8 minifies CSS with, keeps only the last of
  the two, so a minified build kept the WebKit alias alone, which Chromium
  ignores, and Frost, Resin and Mirage rendered flat. The alias now comes
  first in every rule. No declaration changed, and `crystal-theme.css` is
  byte-identical.
- **Forced colours remove every control surface's backdrop blur** (D-36). The
  status badge, the tag, the count, the checkbox, the radio and the switch
  kept `blur(20px)` under forced colours, measured in Chromium; the reset now
  names them and is important, as the reset layer's material resets are.
- **Safari before 18 diffuses the dock and the choices, and honours every
  reset.** Twelve rules wrote `backdrop-filter` without its `-webkit-` form; each
  now writes the alias first. The choices read `--cr-resin-blur`, which
  resolves to the 20px they wrote. Computed values in Chromium are unchanged.
- **A checklist's checkbox stays 26px inside an editor's field shell.** The
  shell's 44px text-entry floor reached it, stretching the box into a pill
  11px below its line.

## [2.3.1] - 2026-09-29

A patch release for one scroll container that broke Crystal's own contract.

### Fixed

- **A dialog's code block keeps a stable gutter.** `.cr-dialog pre` scrolls
  down past 300px. It had the scroll contract's containment, gesture handling
  and Frost scrollbar but no stable gutter, so on a desktop its text moved 10px
  when its scrollbar appeared. The scroll gate missed it because it opened
  dialogs empty, and a phone did not show it because an overlay scrollbar takes
  no room. The device leg of the gate on a Pixel 6 Pro was the first to open a
  dialog with code in it, and it reported the container's
  `scrollbar-gutter: auto` (D-4). Measured on desktop Chromium with classic
  scrollbars: 10px before, 0px after.

## [2.3.0] - 2026-09-29

A minor release that builds the rulings Meridian made on 28 and 29 September.
They answer every decision left open in either tracker and are recorded in
`proposals/2026-09-29-rulings.md`.

A navigation entry marks where the reader is with a dot as well as weight. The
catalogue's surfaces say what renders, and a button group is now a surface of
its own. The dock reaches tabs, radio labels and links as well as buttons. A
dialog scrolls its body and no longer scrolls its surface. An overlay inside a
pane has a recipe with an edge, and a count badge has a size. Motion no
component could play comes off the catalogue, and the two recipes that this
left orphaned are withdrawn. The catalogue is 284 components and the motion
vocabulary is 59 recipes.

A reader of the stylesheet sees two things change: the dot on `aria-current`,
and a dialog written with the new body. Everything else is a new recipe,
reached only by the markup that asks for it.

### Added

- **A navigation entry marks its current location with a dot** (D-22, ruled on
  28 September). The catalogue has always said "current location is a dot;
  selection within a set is label weight", and `.cr-nav-item` drew no dot.
  It now draws a flat 6px primary mark on `aria-current` only. `aria-selected`
  and `aria-pressed` are selection and never take the mark. The mark sits
  inside the entry's own inline-start padding, so the label does not move, and
  it carries no material, shadow or blur. It sits above the icon when stacked,
  is mirrored right to left, and is `Highlight` under forced colours.
- `component.overlay.tooltipRadius`, 18px: the tooltip's radius, which the
  catalogue stated only as prose.

- **The `group` surface, `.cr-group`** (D-26, ruled 29 September). A button
  group and a split button are one Resin plane whose controls touch: a single
  pill outside, square interior corners, a hairline in `--cr-edge` between. The
  children keep their fill and give up their own elevation and diffusion.
  `.vertical` stacks them. Both entries move from `dock` to `group`.
- **The dock reaches controls that are not buttons** (D-26). `[role=tab]`
  (selected by `aria-selected`), a `label` holding a radio (selected by
  `:checked`, its focus ring drawn on the label) and a link (current by
  `aria-current`) take the dock button's values, with their own narrow-screen and
  forced-colours branches. Every selector is inside `:where()`, so no existing
  rule's specificity moves.
- **`.cr-dialog-body`** (D-25). When a dialog has a body, the body scrolls and
  the surface does not. The body takes `.cr-scroll-frost` for the scroll
  contract, the Frost scrollbar and the edge fade, so a tall dialog keeps its
  title in view and the fade no longer dissolves the surface. A dialog written
  without a body scrolls its surface as before.
- **The recessed overlay, `.cr-haze.overlay`** (D-25). A menu or popover opened
  inside a pane that is already lifted recesses into Haze, which has no edge.
  This recipe is a flat Haze fill with the `--cr-edge` rim and the content
  shadow, with its three fallbacks.
- **A count size, `.cr-resin-haze.count`** (D-27). A 20px circle that becomes a
  pill as its digits need, filled to its own edge, with no block padding. The
  tag-sized compact display made a count badge 55px tall.

### Changed

- **`position: fixed` is for a native `dialog.cr-dialog` only** (D-29, ruled
  29 September). The browser centres a modal `<dialog>` by giving it `inset: 0`
  and auto margins. Any other element that wore the class kept its static
  position, with its top-left corner at the middle of the screen, which is how
  Crystal React's dialogs shipped off-centre. On a non-dialog host the class
  now supplies the material only, and the host positions it.
- **The indicator's field glyphs reach any `.cr-field-shell`** (D-27). They
  used to reach a `span` only. A shell holding a label, a textarea or a row of
  chips is a `div`, and never received ○, ●, * or !. A block shell with an
  indicator makes the same 40px of room the inline one always has.
- **Motion no component could play comes off the catalogue** (D-28, ruled 29
  September): `page-in`/`page-out` from the six navigation entries, which keep
  `selection`; `busy` from progress and the loader, and `activity-turn` from the
  linear progress bar, which plays `activity-travel`; `resin-confluence` from the
  floating action; `reaction` from the authored bubble; `slider-step` from the
  colour area, slider and wheel. Recorded in `tools/extend-catalogue-7.cjs` with
  the old values.
- **The catalogue is 284 components** (D-29). The virtualizer was listed twice;
  `virtual-scroller` is removed and `virtualizer`, whose semantics are the
  complete ones, remains.
- **The catalogue's surfaces match what renders** (D-23, ruled on 28 September).
  Tabs, the segmented control, the toolbar, the command bar, the action bar, the
  button group and the split button are `dock`, not `resin`: each measures
  identical to `.cr-dock`, Resin holding one Haze fill under its controls. The
  resizable handle and the image comparison's thumb are `resin`, as their own
  prose said, not the grab-to-move `drag-handle`. The media controls are `resin`
  at the pill, and the rich text surface is a `field`. The `resin` and `dock`
  descriptions in `surfaces.json` now say which is which. The rail's prose, the
  dialog's radius and the tooltip's radius agree with their surfaces and
  recipes. Recorded in `tools/extend-catalogue-6.cjs` with the old values.
- `docs/accessibility.md` states how the field shell's rim is treated (D-24,
  ruled on 28 September): measured at 1.06:1, decorative, the field identified by
  its shell, its well and its label. The "colour is never the only signal"
  table says the same of the current page: a primary dot, which is a mark rather
  than a tint, and the label's weight.

### Removed

- **The `busy` and `reaction` recipes are withdrawn** (D-28). Once their
  assignments came off, no component claimed either, and the build refuses a
  recipe no component claims. `busy` is superseded by D-19's continuous
  indicators; no component has reactions to toggle. Either returns with a
  component that needs it. The motion vocabulary is 59 recipes.
- **The reset layer's button hover** (D-21, ruled 29 September). It brightened
  and lowered a hovered `.cr-button` in `crystal.reset`, and `crystal.component`
  erased both halves, so it never rendered. The resting Resin control already is
  the floating state; the `hover` caustic is the pointer affordance. Nothing that
  renders changes.
- **`.tiny-button` from `motion.css`** (4.4). It is the documentation site's
  class, and the site now carries its own transition for it.

### Fixed

- The `dock` surface's description said a strip's selected segment takes the
  primary-soft fill. It takes the primary fill, as the tab and segmented-control
  entries say, as `.cr-dock button:is([aria-pressed=true],[aria-selected=true])`
  draws it, and as the documentation site renders a selected tab. The wrong
  sentence was written from Crystal React's strip rather than from Crystal, in
  the same change that corrected the surfaces.

## [2.2.0] - 2026-09-28

A minor release that makes the catalogue checkable. Every component names its
surface from a closed vocabulary of 22, and every surface has a recipe in the
stylesheet, including four that the catalogue had specified and no consumer
could obtain. The entries now carry the motion that the specification always
assigned. Three decisions Meridian made on 28 September close the gaps that
had been left open for a decision: continuous indicators for pending work, a
data mark arriving, and a number field that stays reachable. Nothing that reads
the stylesheet changes appearance. One published value changes: an action
control's minimum target is now published as the 48px it has always rendered.

### Added

- **Continuous indicators, for work that is genuinely pending** (D-19, ruled by
  Meridian on 28 September). `activity-turn` (a loader, or an indeterminate
  progress ring), `activity-travel` (an indeterminate bar) and `skeleton-sweep`
  (the skeleton's luminance sweep) are the only recipes that repeat. They run
  while the work they report is pending and stop when it resolves. All three
  travel linearly at one period, `motion.flow`, and carry no spring. Reduced
  motion leaves the whole track or fill, static. The motion chapter's "no
  effects autoplay or loop" names the exception. `tools/validate-motion.cjs`
  refuses a loop by any other name, a loop at any other period, and a loop that
  rocks instead of travelling. `loader`, `progress` and `skeleton` claim them.
  Closes [#1](https://github.com/boomerbowser/crystal/issues/1).

- **`mark-in`, a data mark arriving** (Crystal React's R-21, ruled on 28
  September). A bar, series or segment grows from its baseline when a chart first
  appears. It takes 500ms, staggered 24ms per mark up to 24 marks, and past that
  the marks arrive all together. It declares `overshoot: "never"` and is fitted
  critically damped, because a mark that overshoots its value has shown a
  number that is not true. That declaration and the new `stagger` field are
  validated, and a staggered sequence is held to the same 2000ms ceiling as a
  single transition. `bar-chart`, `line-chart` and `pie-chart` claim it.

- **The browser runtime plays both.** `core/assets/motion.js` and
  `core/engines.js` played every recipe once on an ease curve. A continuous
  recipe now repeats at constant speed until `stop()`. It runs without the
  optical layers, because a feathered edge that ripples for as long as
  something is loading would be ambient motion. A staggered recipe takes
  `{ index, count }` and waits its turn. Measured in a browser against the
  bundled engine, and against the previous runtime, which gives one cycle on the
  default curve and no stagger.

- **Every component names its surface.** `core/tokens/surfaces.json` is a closed
  vocabulary of 22 material compositions, each tied to the `crystal.css` recipe
  that implements it: Plastic, Frost, Haze, the Resin plane and panel, the
  control, the field shell, compact display, Stone, Mirage, the dialog,
  indicator, status badge, bubble, table, dock, navigation entry, bare control,
  drag handle, the native selection controls, native furniture, and none. All
  285 catalogue entries carry a `surface` field drawn from it, outer to inner.
  `tools/build-catalogue.cjs` refuses an entry naming a surface the vocabulary
  lacks, and a vocabulary entry whose recipe the stylesheet lacks. The
  vocabulary is exported as `@crystal-ui/core/surfaces` and listed with counts
  at the top of the catalogue chapter. Before this, the only machine-readable
  link from a component to a recipe was `motion`. `material` was prose that 102
  entries left empty of any material name, and a library could satisfy it with
  any recipe it liked. Crystal React wrote 43 of its own.

- **Four recipes the catalogue specified and no consumer could obtain.** Crystal
  React found each one by reaching for it and rebuilding it locally under a
  comment saying Crystal had none. `.cr-nav-item` is a navigation entry selected
  by label weight, lifted from the documentation site's side menu, which
  `components.md` has always called the reference implementation of selection
  and which lived only in the site's stylesheet. `.cr-bare` is a control that
  must not wear the Resin coat, because it sits inside a surface that already
  has one. Crystal paints every `<button>` by element in five layers, and
  `background: transparent` took off one. The other two are `.cr-drag-handle`
  and `.cr-resin.panel`.

  The release also adds the native switch,
  `input[type=checkbox][role=switch]`, styled by element beside the checkbox
  and radio, and a disabled state for action links, control spans and entries,
  which had none. All are in `@layer crystal.component`, each with
  reduced-transparency and forced-colours clauses, and each held by
  `tests/core-contracts.cjs`.

- **114 more catalogue entries claim the motion the specification assigns
  them.** The family table in `motion-components.md` has said since 2.0 that a
  date picker takes `menu-in/out`, `selection` and `page-in`, a table row takes
  `list-in/out` and `highlight`, and a badge takes `attention`. The entries did
  not carry it, so a consumer that plays "what the catalogue assigns" shipped
  145 components with no motion. Every recipe claimed already existed. 162 of
  285 entries now carry motion. The two gaps that need a decision, D-19's
  continuous indicators and R-21's chart mark enter, are left empty for that
  reason. `tools/extend-catalogue-4.cjs` is the record.

- **Parity status is merged from each platform's record.**
  `libraries/status/<platform>.json` is the record a platform library keeps,
  and the build merges it into `libraries/parity.json`. It is no longer
  regenerated. The web record is seeded from Crystal React's own
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
  `role=spinbutton`. The accessible primitive underneath removes that role,
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
  Stone. All are corrected. `.cr-resin-haze` is for display elements that sit
  on content: tags, badges, labels and keyboard caps. The old sentences are
  quoted in `tools/extend-catalogue-4.cjs`.

- The catalogue's `nav-link` was "Resin shell with Haze fill"; the reference
  implementation is Plastic, and the site's own comment says why ("thirteen
  floating capsules would be exactly the legibility noise the hierarchy exists
  to prevent"). Its `indicator` was "Resin shell"; `components.md` says an
  indicator is Haze, not Resin. Both now agree with the specification.

- `components.md` and `motion-components.md` each said a selected item carries
  "a circular check badge". A check mark means validated, never selected. It is
  Crystal's most frequently violated rule, and its own chapters violated it.
  `materials.md`'s "Motion at rest" is marked deferred, with the reason, and no
  longer reads as a rule in force. The runtime paragraph in
  `motion-components.md` named four scripts that belong to the documentation
  site and are not in the package.

### Fixed

- **`catalogue.json` carried the day it was built**, as `generated`. A
  committed generated file that depends on the calendar fails both workflows'
  check that a build changes nothing, on any run after midnight UTC. That is
  what failed CI on 24 September, for a commit made at 21:18 in New York. The
  file now carries `version`, the release it ships in. Nothing in this
  repository, Crystal React or the documentation site read `generated`. A
  consumer that did should read `version`. Proved by rebuilding with the clock
  moved three days forward: only the evidence timestamp changes.

- The publish workflow exempted the token evidence's timestamp and not the
  "Checks run" row that quotes it in `docs/accessibility.md`. `verify.yml`
  already exempted that row. `publish.yml` did not, so a release tagged on a
  later day than its commit would have been refused.

- The recipe table in the motion chapter asked `spring.js` for the damping
  ratio of every recipe, including any without a spring. For those it returns
  the defaults' ratio, and the table would have printed physics a loop does not
  have. A recipe with no spring is shown as a linear loop.

- **`tools/build-catalogue.cjs` wrote the parity manifest outside the
  repository**, to `../libraries/parity.json`, a path left from the monorepo
  layout. The committed file was never regenerated, and every build broke the
  rule that a generator may not touch anything outside the repository. It
  writes inside the repository now.

- The catalogue's motion references were never checked against the recipes.
  `dialog` and `scrim` named `mirage`, `mirage-out` and `dismiss`, which exist
  as material presets in `core/presets` and not as recipes. The orphan check
  ran only the other way. Both directions are checked now, and a preset name is
  a valid claim. The exemption for an `Ambient` recipe category, withdrawn in
  R22, is gone with the category.

- The comment introducing the component layer in `crystal.css` said the reset
  rules "are unlayered and therefore beat these". They are in `crystal.reset`
  and lose. That is the mechanism behind D-20 and D-21, and the comment
  described it backwards.

- **The action control's minimum target is 48px, and the token now says so.**
  It has been 48px in every Crystal page since the control surface was adopted.
  The component layer's `:is(button,a.cr-button)` set it, and a later layer
  wins regardless of specificity, so the `.cr-button` rule in `crystal.reset`
  that said 44px never rendered for anything. The package published
  `component.action.minTarget` as 44px, and that is the value platform
  libraries consume. Crystal React read it correctly and drew its buttons four
  pixels shorter than the preview, and nobody noticed.

  The token moves to 48px. The rendering does not move to 44px, because a
  target may be improved and never regressed, and 48px is what people have been
  pressing. The floor remains 44px. The target is above it and must stay above
  it.

  **For consumers:** a library that consumed `action.minTarget` grows its action
  controls by 4px and matches Crystal for the first time. Nothing that reads
  the stylesheet changes.

- **`tests/core-contracts.cjs` was green on a rule that did not render.** It
  bound each geometry token to the first `.cr-button` rule it found, which is
  the reset-layer one, and did not check whether a later layer took the value
  back. It now requires every other rule that could reach the same element to
  agree. Pseudo-elements are excluded, because a `::before` is a different box
  and `border-radius: inherit` on the reading pad follows the control. Variant
  selectors are listed explicitly, so a variant that differs has to be recorded
  as a decision.

  The new check was run against the original defect, and failed on it, before
  it was trusted.

## [2.1.0] - 2026-09-24

A minor release in two halves. The first changes what the stylesheet renders:
2.0.0 shipped a control surface whose variant signals had been silently
outranked, and this release restores each one. The second adds the vocabulary
charts need. Crystal named chart components in its catalogue and published
nothing a chart could be drawn with.

### Added

- **The chart series scale.** Six categorical colours per palette per mode, as
  `--cr-chart-series-1` through `--cr-chart-series-6`, with `--cr-chart-axis` and
  `--cr-chart-grid` beside them. They are derived from the palette's own seed
  hue, and every one of the seventy-two clears 3:1 against both the surface and
  the canvas of its mode, with no two in a scale closer than a visible step.
  `docs/colors.md` sets out the construction and the limits of the scale: a
  series colour is for data marks only, it is never ink or an action fill, and
  it is not a secondary colour.

  This is the first time the pipeline computes a colour. Until now it copied
  each one. As with the other derived values, the inputs are tokens
  (`component.chart.series*`) and the outputs are asserted in
  `tests/core-contracts.cjs` across all twelve palette-and-mode combinations.
- **The intensity ramp.** `--cr-chart-heat-1` to `--cr-chart-heat-5` for a
  heatmap cell or a calendar day, each with the ink that reads on it as
  `--cr-chart-on-heat-N`. A cell is a ground and not a mark, so it is held to
  the text floor, and every step meets it.
- **Chart geometry.** `--cr-chart-stroke`, `--cr-chart-hairline`,
  `--cr-chart-point-min`, `--cr-chart-point-max`, `--cr-chart-bar-radius`,
  `--cr-chart-cell-gap`, `--cr-chart-ring-thickness`, `--cr-chart-fill-opacity`,
  `--cr-chart-link-opacity` and `--cr-chart-gauge-sweep`. The catalogue has said
  "line weight follows the stroke scale" and "point size is a scale, not an
  arbitrary radius" since 2.0. Neither scale existed, and without one each
  renderer makes its own.
- **The pushed-view recipes.** `view-push-in` and `view-push-out`, in the
  Navigation family. The catalogue has said since 2.0 that a view stack's views
  "enter and leave along the reading direction". The nearest recipe Crystal
  published was `page-in`, which is a view arriving forward on the block axis.
  A stack that used it said "new location" where it meant "one step deeper".

  There are two recipes and not four, because a pop is a push mirrored and
  right-to-left is a push mirrored again. The reorientation a consumer already
  has points an authored movement, and a second copy of a movement is a second
  fitted spring to keep in step with the first. The departing view travels a
  fraction of the arriving one's distance and stays behind it. That makes the
  two read as one stack, and makes a back gesture legible before it has been
  made.

- **`--cr-progress-ring-stroke`.** One value for a circular progress ring and for
  the gauge arc the catalogue says matches it, so the two cannot drift.

**For consumers:** the generated theme CSS gains values and changes none. A
palette added after this release meets the four assertions in
`tests/core-contracts.cjs` before it ships; there is no manual step.

### Removed

- **The `.secondary` button variant.** It named a second action colour, and
  Crystal has no such role: the palettes publish one action pair, and the
  companion and glow hues are expressive paint that is never assumed to be
  text-safe. The companion cannot be promoted either. As a solid reading fill
  it fails the 4.5 floor with both candidate inks in four of the twelve
  palette-and-mode combinations. `docs/colors.md` now states the decision.
  Markup using `.cr-button.secondary` renders as an ordinary action, which is
  what it already looked like. A caller that meant "the emphatic one" should
  use `.cr-button.primary`.

### Changed

- **The primary tint is opt-in, on `.cr-button.primary`.** A bare `.cr-button` is
  the neutral action. The rule used to read
  `:not(.secondary):not(.quiet):not(.danger)`. It had to enumerate every variant
  it was not meant to paint, and one forgotten modifier would have tinted the
  whole surface. The reset layer's `background:var(--cr-primary)` and
  `color:var(--cr-on-primary)` on `.cr-button` are removed with it. They had not
  rendered since the Resin surface was adopted, and they would now be wrong as
  well as dead.
- **The primary action's reading fill is the primary colour.** `crystal.reset`
  asks for `background:var(--cr-primary)` on `.cr-button`, and the Resin control
  rule in `crystal.component` has outranked it since the surface was adopted.
  The colour survived only as the ring of element background left exposed
  around the inset Haze fill, with white `onPrimary` text sitting on a white
  fill. `.cr-button` with no modifier now paints its `::before` in
  `--cr-primary` and takes `--cr-on-primary` as its ink. That is the palette's
  own tested pair, 4.74 to 10.31 against the rendered composite across all six
  palettes and both modes. The perimeter is the ordinary Resin rim.
  `.secondary`, `.quiet` and `.danger` keep the neutral reading fill, so the
  primary fill reads as primary.

  The fill is opaque there where the neutral one is 80%, and that is the one
  deliberate deviation in the recipe. An 80% fill transmits a fifth of what is
  behind it. White over a light page is still white, so the neutral pad loses
  nothing. A mid-tone primary at 80% over the Resin shell composites to a
  washed-out lilac, at the luminance where neither a white nor a near-black
  label clears 4.5 (3.37 to 4.55 with `onPrimary`, 2.95 to 5.06 with `text`,
  failing in every light palette). The reading ground exists to make the label
  independent of the backdrop, so the primary one is opaque.
- **A quiet button has no Haze reading fill.** `.cr-button.quiet` keeps the whole
  Resin shell (rim, float shadow and sheen) and drops the pad, so it is the
  only variant that is glass all the way through. Primary is tinted, secondary
  is the neutral pad, and quiet is neither. The pad is what makes a label's
  contrast independent of the backdrop, so a quiet label now reads against the
  material: 10.88 to 18.28 on Crystal's own foundation across all six palettes
  and both modes, and unprotected over artwork.
- **The destructive boundary is back.** `.cr-button.danger` had the same problem
  and now carries the independent danger boundary `components.md` requires.
- **The control surface is the library's.** A second adoption pass moved the rest
  of the preview's control rules into `@layer crystal.component`, so a consumer
  of the package renders what the preview renders. Before, it rendered the
  preview minus the site's own stylesheet.
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
2.0.0 intended and did not render, and both improve contrast. A product that had
compensated for the flat primary in its own stylesheet should re-check it, and
any visual baseline that contains a button needs re-blessing.

## [2.0.0] - 2026-09-20

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

## [1.0.1] - 2026-09-17

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
