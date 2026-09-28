# Component recipes for the whole catalogue: the surface vocabulary

**Proposal, with the first release of it implemented. 28 September 2026.**
Companion: `crystal-react/docs/proposals/2026-09-28-adopting-crystal-2.2-recipes.md`,
the same change from the consumer's side. Visual evidence: `2026-09-28-component-recipes/`
beside this file — a specimen sheet that loads the real library, and captures of it
with a README saying what was compared.

Meridian's brief, 28 September: Crystal React is most of the way through its
catalogue, but "there aren't nearly enough component recipes to keep Crystal
consistent across platforms", "many animations are hidden", and "the material
hierarchy and composition seems to be inconsistent across Crystal React's
components". Update both projects to account for every shared component and every
React component; put the findings and the proposal where they belong; show the
team what is meant.

This document is in five parts: what was measured, what the proposal is, what has
been done under it, what only Meridian can decide, and the assumptions this work
proceeded under. Everything in part three is in the working tree of both
repositories, uncommitted and unpublished — the request did not ask for a commit,
and a publish is Meridian's.

---

## 1. What is wrong, measured

Both repositories were inventoried before anything was changed. The numbers are
from 28 September 2026, `crystal` at `338f007` and `crystal-react` at `00635bb`,
with `@crystal-ui/core@2.1.0` installed in the latter.

### 1.1 The catalogue specifies 285 components and Crystal implements 31 classes

`core/tokens/catalogue/` holds 285 entries. `core/assets/crystal.css` defines 31
`.cr-*` classes, of which fewer than half are component recipes; the rest are
material primitives, scroll utilities and aliases. The specification chapter,
`docs/components.md`, has a contract table of 27 rows, three of them marked
"specification only".

That gap is the one the brief names, and it is structural rather than a backlog:
**nothing in the catalogue tied an entry to a recipe.** The only machine-readable
link was `motion`, an array of recipe ids. The `material` field was prose —
"Resin shell with Haze fill", "Inherits", "None of its own" — and 102 of 285
entries named no material at all in it. A library could read every entry, satisfy
every sentence, and paint whatever it liked. Crystal React did: **43 of its
component stylesheets write a material recipe by hand** (blur, fill, feather),
22 of them with no material mixin at all, and 18 of its 229 component files put a
Crystal class on an element. Two tables and a data grid paint Resin with
`--cr-shadow-content`, which is the Haze shadow. A tooltip uses the Stone
*feather* — a 1.95px paint softening — as a backdrop *blur* radius. A chart
tooltip reaches for `--cr-acrylic-fill`, the alias, because nothing said which
surface a chart tooltip is.

### 1.2 The recipes a consumer had to invent

The R-19 sweep in Crystal React (24 September) stopped exactly where Crystal had
no recipe, and named the places: a navigation link (`NavLink` kept a weight of
550 because `.cr-button`'s 750 "would destroy it"), a nav rail item, a drag
handle, a floating Resin panel, and — the largest — the **bare control**.
Crystal paints the Resin coat on every `<button>` by element, in five layers
(fill, rim, float shadow, backdrop blur, and the two feathered pseudo-layers).
A control inside a surface that already has a coat must not wear a second one;
eighteen distinct controls and 127 instances across 488 stories had declared
`background: transparent` and were transparent in exactly one of the five. The
library closed it with a local mixin under a comment saying "Crystal has no
recipe for this, which is why it lives here rather than being adopted."

The specification's own reference implementation had the same shape. `docs/
components.md` says of selection: "the side menu on this page is the reference
implementation." That menu is styled in `crystal-preview`'s `site.css`, in the
site's `crystal.override` layer, with a comment explaining why it is Plastic and
not Resin — and the library exported none of it. D-9, R-15 and D-11 were each
this defect: a specification only one renderer can read.

### 1.3 Motion: 237 entries with none, and a consumer that plays what it is given

48 of 285 catalogue entries carried a `motion` field. Whole categories carried
none — layout (14), charts (24), media (5), commerce (24), blocks (20). Crystal
React's plan is explicit about the consequence: "where the catalogue assigns
none, the component plays none." **145 of its 229 components play no recipe at
all**, even through a child. Of the 48 entries the catalogue does assign motion,
about 20 play none of it — `dialog`, `menu`, `popover`, `tooltip`, `checkbox`,
`radio`, `slider`, `segmented-control`, `notification`, `breadcrumbs`, `dock`,
`nav-link` among them — and 27 of Crystal's 57 recipes are never played
anywhere. Every exit recipe except `accordion-out` and `toast-out` is unplayed.
`Dialog` set up its material-preset hook and never called it; its scrim faded on
a hand-written opacity ramp.

This is what "many animations are hidden" measures to. Most of it is not missing
recipes. The family table in `docs/motion-components.md` ("Component coverage and
composition") has said since 2.0 that a date picker takes `menu-in/out`,
`selection` and `page-in`, that a table row takes `list-in/out` and `highlight`,
that a badge takes `attention`. The entries did not carry it, so the consumer
that reads entries did not play it.

Three motion gaps are real and are decisions rather than omissions — §4.

### 1.4 The specification disagreed with itself, and with Meridian

- Meridian moved tooltip, popover, menu and toast to **Frost** on 17 September
  (R15e: "Menus that open are not Frost"), and the documentation site has
  rendered them so since. `materials.md`, `components.md` and
  `motion-components.md` still said those surfaces use `.cr-resin-haze`, and
  eight catalogue entries said Resin or Stone. Crystal React, reading the
  chapters, painted them Resin — the "inconsistent material composition" the
  brief describes was the library agreeing with the wrong half of the
  specification.
- `components.md` line 43 and `motion-components.md` §"Interaction and
  compact-surface materials" both said a selected item carries "a circular check
  badge". A check mark means validated, never selected — Crystal's most
  frequently violated rule, violated by its own chapters.
- `components.md` called `.cr-indicator` "a 20px circular Resin surface" in one
  section and "Haze, not Resin" in another; the catalogue's `indicator` entry
  said Resin. The CSS is Haze.
- `materials.md`'s "Light" and "Motion at rest" subsections still specified the
  ambient tier as the material's rest state, against §8 of the contract and R22.
- The catalogue's `nav-link` was "Resin shell with Haze fill". The reference
  implementation is Plastic, and the site's comment says why: "thirteen floating
  capsules would be exactly the legibility noise the hierarchy exists to prevent."

### 1.5 Machinery that guarded nothing

- **`tools/build-catalogue.cjs` wrote `parity.json` outside the repository**, to
  `../libraries/parity.json` beside the checkout — a path from the monorepo
  layout. The committed manifest was never regenerated, AGENTS.md's rule that a
  generator writes nothing outside the repository was broken on every build, and
  a stray copy sits at `/home/oshun/Development/Proposals/libraries/parity.json`
  (left in place; it is outside both repositories and is Meridian's to remove).
- The manifest regenerated **every status as `not-started`**. The README calls it
  "the single source of truth for what exists"; it said 283 of 285 components
  did not, while Crystal React's own manifest recorded 265 implemented.
- The motion check ran one way. Every recipe had to be claimed by an entry; no
  entry's claim had to exist. `dialog` and `scrim` claimed `mirage`, `mirage-out`
  and `dismiss`, which are material presets in `core/presets`, not recipes.
  Valid claims, never checked. The exemption for an `Ambient` category outlived
  the category by ten days.
- The comment introducing the component layer in `crystal.css` said the reset
  rules "are unlayered and therefore beat these". They are in `crystal.reset`
  and lose — the mechanism of D-20 and D-21, described backwards at the place it
  happens.
- Five control values the package published as tokens — the 26px choice box,
  its 9px radius, the 44×28 switch track, the .55 disabled opacity — were
  literals in the stylesheet and absent from the theme, so a library reading the
  tokens and a page reading the stylesheet could disagree by design.
- `motion.css` ships `.tiny-button`, a documentation-site class. Not changed
  here — the site still uses it and the class does no harm — but recorded.

---

## 2. The proposal

**Give every component a surface, and give every surface a recipe.**

Not 285 recipes. A component library that needs 285 recipes has 285 sources of
truth. The observation from the inventory is that the 285 entries are made of a
small number of *material compositions*, and that the compositions — not the
components — are what a platform library implements. A card, a list row, an
alert, a form section and a stat tile are one thing: the Haze reading surface. A
button, a chip, a pagination control and a wishlist button are one thing: the
Resin control with its Haze pad. Once each composition has one recipe, a
component is a composition plus geometry plus semantics, and two hundred
components stop being two hundred recipes.

### 2.1 A closed vocabulary

`core/tokens/surfaces.json` — 22 surfaces, each with the materials it is made of,
the `crystal.css` selector that implements it, and a sentence saying what it is
for. Exported as `@crystal-ui/core/surfaces`. The full list with counts is at the
top of the catalogue chapter; in brief:

| Surface | Recipe | Entries |
|---|---|---|
| `haze` reading surface | `.cr-haze` | 75 |
| `none` — inherits | — | 101 |
| `frost` panel, and every transient overlay | `.cr-frost` | 39 |
| `control` | `.cr-button`, `.cr-control` | 15 |
| `field` shell | `.cr-field-shell` | 30 |
| `resin` plane · `resin-panel` | `.cr-resin` · `.cr-resin.panel` | 13 · 2 |
| `compact` display | `.cr-resin-haze`, `.cr-tag` | 6 |
| `mirage` · `dialog` | `.cr-mirage` · `.cr-dialog` | 12 · 2 |
| `plastic` | `.cr-plastic` | 7 |
| `nav-item` **new** · `bare` **new** · `drag-handle` **new** | `.cr-nav-item` · `.cr-bare` · `.cr-drag-handle` | 2 · 0 · 3 |
| `choice` (checkbox, radio, switch, range) · `native` | element recipes | 5 · 0 |
| `stone` · `indicator` · `status` · `bubble` · `table` · `dock` | their classes | 2 · 2 · 1 · 1 · 4 · 3 |

(`bare` and `native` count zero because no catalogue *entry* is a bare control;
bare is what a control inside another entry wears. The vocabulary is for
components and for the parts of components alike.)

The vocabulary is small on purpose, and adding to it is deliberately expensive: a
new surface is a new composition for every platform library, so it arrives with a
recipe, both accessibility fallbacks, a contract row and a changelog entry, never
alone.

### 2.2 Every entry names its surface, and the build fails closed

Each of the 285 entries carries `surface`: a list, outer to inner, from the
vocabulary. `app-shell` is `[plastic, frost, dock]`; `date-picker` is `[field,
frost, haze]`; `card` is `[haze]`; `divider` is `[none]`. The build refuses an
entry with no surface, an entry naming a surface outside the vocabulary, and a
vocabulary entry whose selector has no rule in `crystal.css`. That last check is
the one that matters: **the catalogue can no longer specify a material Crystal has
not published a recipe for.** The D-9 shape becomes a build failure.

The catalogue chapter renders a **Surface** row per entry, linking to the
vocabulary table, and the parity manifest carries each component's surfaces so a
platform library can generate its own coverage report.

### 2.3 Motion is completed from the family table, not invented

The family table in `motion-components.md` is applied to the entries it already
describes. 114 entries gain `motion`; every recipe named already exists; 162 of
285 entries now carry motion. Charts' marks are deliberately still empty (R-21),
as are the three continuous indicators (D-19) — §4.

### 2.4 Status is merged, never regenerated

`libraries/status/<platform>.json` is the record a platform library keeps of what
it has implemented. The build merges it into `parity.json`; a component absent
from a platform's record is honestly `not-started` there. The web record is
seeded from Crystal React's own manifest at `00635bb`: 265 implemented. A
generator here may not read the other repository, so the record is data a person
updates when a slice ships, and the file says which build it came from.

### 2.5 The consumer wears the class

The second half of the R-19 sweep. Where Crystal has a recipe, a Crystal React
component wears Crystal's class and deletes its local copy, measured the way R-19
was: plant Crystal's element beside the library's, diff computed style to zero,
plant it red. Where Crystal has none, the recipe is authored here first. The
sequencing is in the companion document; it is two phases because the library
resolves `@crystal-ui/core` from npm and cannot wear a class the installed
stylesheet does not define.

---

## 3. What has been done

### 3.1 In `crystal` (this repository), for release as 2.2.0

- `core/tokens/surfaces.json`; `surface` on all 285 entries; `./surfaces` export;
  version 2.2.0 in `core/package.json`; the changelog's Unreleased section.
- `tools/extend-catalogue-4.cjs` — the record of the surface assignment, the 114
  motion completions and the eight material-prose corrections, with the old
  sentences quoted. Idempotent; refuses to write if any id is unknown or any
  recipe does not exist.
- `tools/build-catalogue.cjs` — validates surfaces against the vocabulary and the
  vocabulary against the stylesheet; validates motion claims against recipes and
  presets; merges status; writes inside the repository; drops the `Ambient`
  exemption; renders the Surface row and the vocabulary table.
- **Four recipes and a native control in `crystal.css`**, all in
  `@layer crystal.component`, each with reduced-transparency and forced-colours
  clauses, each extended by the Resin-in-Resin guard:
  - `.cr-nav-item` (+ `.stacked`) — lifted from `crystal-preview`'s `.menu-item`
    as it renders. Weight 650 → 800, surface-alt on hover and current, no coat.
  - `.cr-bare` — subtracts all five layers of the coat; keeps the 44px target,
    the pill hit area and the focus ring; an on state without a pad takes the
    weight half of the selection rule.
  - `.cr-drag-handle` — bare, with a grip in `currentColor` and a lift on
    `aria-grabbed` / `data-dragging`.
  - `.cr-resin.panel` — the Resin plane at the Frost panel's radius.
  - `input[type=checkbox][role=switch]` — track from the published tokens, opaque
    thumb, primary-soft when on, RTL travel.
  - A disabled state for `a.cr-button`, `.cr-control`, `.cr-nav-item`, `.cr-bare`
    and `.cr-drag-handle` via `aria-disabled`, which had none.
- `core/assets/crystal.js` exports `--cr-action-disabled-opacity`,
  `--cr-choice-box-size`, `--cr-choice-box-radius`, `--cr-switch-track-width`
  and `--cr-switch-track-height`; the checkbox, radio and switch read them. The
  generated theme grows by exactly these fifteen lines.
- Specification corrections: transient overlays are Frost, in all three chapters;
  the two "circular check badge" sentences; the indicator's material; the
  "Motion at rest" subsection marked deferred with the reason; the runtime
  paragraph that named four scripts the package does not contain; the contract
  table's new rows; the layer comment in `crystal.css`.
- `tests/core-contracts.cjs` — seven new checks: vocabulary ↔ stylesheet,
  catalogue ↔ vocabulary, motion claims ↔ recipes and presets, new recipes in
  the component layer only, the bare control's five subtractions, the navigation
  entry's weight-only selection, and the five exported tokens read by the
  stylesheet. 49 checks; `npm test` is green end to end: 1788 contrast checks,
  57 recipes, 24 documentation-drift checks, the package guard.
- The specimen sheet and its captures, `2026-09-28-component-recipes/`.

### 3.2 In `crystal-react`, against the installed 2.1.0 (phase A of the companion)

Everything the installed core already publishes and the library was not using:

- **Transient overlays are Frost.** `useOverlayMaterial()` returns `frost` on
  the page and `haze` inside any pane; the overlay mixin paints Frost; Tooltip,
  HoverCard, Toast and Notification follow. The tooltip's Stone-feather-as-blur
  is gone.
- **The dialog plays its catalogue motion.** A new `usePresetMotion` hook turns
  Crystal's material presets into Motion for React targets from the same core
  module; `Dialog`'s scrim plays `mirage` and `mirage-out`, its surface plays
  `dismiss`; `Drawer` and `CommandPalette` scrims play the wash. The unused
  `usePreset` scope in `Dialog` is gone.
- **Checkbox and radio play `check` and `check-off`**, bound to the value React
  Aria resolves, never on the mount that is not an arrival.
- **Menu, Popover, Tooltip and HoverCard play their arrivals** (`menu-in`,
  `popover-in`, `tooltip-in`).
- `src/styles/coreVersion.test.ts` — the R-20 pattern: passes on 2.1.x and fails
  the day 2.2.0 or `.cr-bare` is installed, pointing at phase B.
- R-24 in `docs/open-issues.md`. `pnpm typecheck` clean; `pnpm lint:tokens`
  clean; 373 test files, 1694 tests green.

### 3.3 What was left out, and why

- **Phase B of the consumer migration** — components wearing `cr-nav-item`,
  `cr-bare`, `cr-drag-handle`, `cr-resin panel` and the switch recipe, and the
  deletion of `bare-control`, `field.shell`'s restatement and the rest — cannot
  run until 2.2.0 is published and installed. Wearing a class the installed
  stylesheet lacks leaves a component unpainted. The guard test makes the day
  unmissable.
- **Exit motion on React Aria's overlays** (`menu-out`, `popover-out`,
  `tooltip-out`). React Aria unmounts a popover as it closes; holding it for an
  exit means `AnimatePresence` around React Aria's overlay lifecycle, a structural
  change written up in the companion rather than done in passing.
- **Binding the 114 newly-assigned recipes across the rest of the library.** The
  catalogue now says what each component owes; the companion lists every
  component with its recipes and the binding shape (`Arrival`, `ChoiceMotion`,
  state-bound effect). Done here for the overlays, the dialog family and the
  choices, where the brief's "hidden animations" measured largest.
- The three decisions below.

---

## 4. Decisions only Meridian can make

> **Ruled on 28 September 2026.** Adopted as recommended: **4.1** (D-19 — the three
> continuous recipes) and **4.2** (R-21 — `mark-in`), plus the quantity stepper's
> wording (Crystal React's R-22 — the entry now describes a typable numeric field, not a
> spin button). **4.3** (D-21) and **4.4** remain open. What was built from each ruling,
> and how it is checked, is in `CHANGELOG.md` and in D-19's closed entry.

Each has a recommended answer and, where it is a recipe, the JSON that would be
added. None has been implemented; each contradicts or extends something Meridian
has stated or is on record as owning.

### 4.1 D-19 — continuous activity indicators

The catalogue asks `loader`, `skeleton` and `progress` to spin, sweep and travel;
the motion chapter says nothing loops. Crystal React ships all three at one
period, `--cr-flow` (1200ms), removed under reduced motion. **Recommendation:**
adopt what the consumer renders, as a small class of *continuous* recipes,
distinct from the 57 transitions. `validate-motion.cjs` already admits a
travelling loop (`loop: true, direction: 'normal', easing: 'linear'`, no spring,
8000ms ceiling) — the schema survived the ambient withdrawal and fits exactly.

```json
{ "id": "activity-turn", "category": "Feedback", "label": "Indeterminate arc",
  "duration": 1200, "engine": "Motion", "loop": true, "direction": "normal", "easing": "linear",
  "keyframes": [{ "transform": "rotate(0deg)" }, { "transform": "rotate(360deg)" }],
  "material": "stone", "signature": "feather",
  "use": "A loader or indeterminate progress ring while an operation is genuinely pending. One period for every continuous indicator, so two in one view do not tick against each other.",
  "reduced": "Static, whole track visible; no partial segment, which reports a measurement nobody took." },
{ "id": "activity-travel", "category": "Feedback", "label": "Indeterminate bar",
  "duration": 1200, "engine": "Motion", "loop": true, "direction": "normal", "easing": "linear",
  "keyframes": [{ "transform": "translateX(-100%)" }, { "transform": "translateX(100%)" }],
  "travelException": "A travelling segment crosses its own track; the track is the bound.",
  "material": "stone", "signature": "feather",
  "use": "Indeterminate linear progress.", "reduced": "Static, whole track visible." },
{ "id": "skeleton-sweep", "category": "Content", "label": "Luminance sweep",
  "duration": 1200, "engine": "Motion", "loop": true, "direction": "normal", "easing": "linear",
  "keyframes": [{ "backgroundPosition": "200% 0" }, { "backgroundPosition": "-200% 0" }],
  "material": "haze", "signature": "feather",
  "use": "A skeleton while its data is genuinely loading; resolves with skeleton-resolve.",
  "reduced": "Static Haze fill." }
```

With it: the motion chapter's "No effects autoplay or loop" qualified to exempt a
continuous indicator that reports genuine pending work, and `loader`, `skeleton`
and `progress` claiming the ids. Alternative: rule that the three carry no
continuous motion, rewrite their entries, and have the consumer remove it.

### 4.2 R-21 — a mark arriving

`bar-chart`, `pie-chart` and `line-chart` ask for an enter or draw-on motion; no
recipe exists and none of 24 charts animate. **Recommendation:** one recipe a
chart composes, with a stated stagger and a ceiling on staggered marks, because a
chart is where motion is read as data and a bar that overshoots its value has
shown a number that is not true — so the damping ratio must be 1, no overshoot.

```json
{ "id": "mark-in", "category": "Content", "label": "Mark arriving",
  "duration": 500, "engine": "Motion",
  "keyframes": [{ "transform": "scaleY(0)", "opacity": 0 }, { "transform": "scaleY(1)", "opacity": 1 }],
  "material": "haze", "signature": "feather",
  "stagger": { "step": 24, "maxMarks": 24 },
  "use": "A data mark growing from its baseline when a chart first appears. Staggered by index up to 24 marks; past that every mark arrives together. transform-origin is the baseline.",
  "reduced": "Marks appear in place." }
```

`fit-springs.cjs --write` would fit a critically damped spring; `stagger` is a
new field the validator would have to learn. Draw-on for a line is a stroke
offset animation and is a second recipe if wanted.

### 4.3 D-21 — the button's hover

`crystal.reset` writes a hover (content shadow, brightness 1.04) that
`crystal.component` erases; Crystal's button has no hover treatment.
**Recommendation:** delete the reset rule. The component layer's reading — that
the resting state of a Resin control already *is* the floating state, so there is
nowhere further to lift — is the one the approved site has rendered throughout,
and the `hover` recipe (700ms caustic) is the pointer affordance Crystal actually
specifies. Crystal React has already stopped compensating.

### 4.4 Two smaller rulings

- **`nav-link`'s material** was changed here from "Resin shell with Haze fill" to
  the Plastic navigation entry, on the strength of the site's reference
  implementation and its comment. If Meridian wants navigation links as Resin
  capsules after all, the entry reverts and `.cr-nav-item` stays for the side
  menu and rail, which the site needs regardless.
- **`.tiny-button` in `motion.css`** is the site's class in the library's
  stylesheet. Removing it needs the site to carry its own transition first.

---

## 5. Assumptions this work proceeded under

Stated so they can be rejected without re-reading the work.

1. **The documentation site is the evidence when the chapters disagree with it**
   (adopt-never-drop, Meridian 21 September). Applied to transient overlays
   (Frost), to the navigation entry (Plastic), and to nothing else.
2. **Completing the catalogue's `motion` from the family table is not inventing
   motion.** Every recipe assigned already existed and was already documented as
   applying to that component family. If any assignment is wrong for a specific
   entry, `extend-catalogue-4.cjs` is the one place to change it.
3. **A surface is the outermost material of the component plus what is inside
   it**, listed outer to inner, and blocks and screens list their parts' surfaces
   rather than a surface of their own. Where the catalogue prose named a material
   the specification contradicts, the specification won and the prose was
   corrected with the old sentence quoted.
4. **New recipes are authored in the component layer only**, with both
   accessibility fallbacks, and never in `crystal.reset` — because D-20 and D-21.
5. **Material specifications are improved, never regressed.** No existing recipe
   number changed. The theme grew by five properties. Every existing specimen on
   the sheet renders as it did under 2.1.0, checked by eye in both modes against
   the four approved studies.
6. **Nothing was committed, tagged or published.** Both trees are dirty. Core's
   `npm test` and React's `pnpm typecheck`, `pnpm lint:tokens` and `pnpm test`
   are green on the dirty trees. Publishing 2.2.0 — `git tag v2.2.0 && git push
   origin v2.2.0`, then `npm stage approve` — is Meridian's, as before.
