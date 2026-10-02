# Open issues: Crystal design system

Things noticed during Crystal 2.0 and the React library's implementation that are
not fixed. Each entry says what is wrong, why it matters, where it is, and what
closing it would take.

<!-- rulings-summary -->
**Seven entries are open**, D-30 to D-36, all from the proposal of 2 October
2026 ([`2026-10-02-media-text-and-recipe-parity.md`](2026-10-02-media-text-and-recipe-parity.md)).
No wait on a ruling by Meridian; seven are ruled ([`2026-10-02-rulings.md`](2026-10-02-rulings.md)) and open until built;
D-36 is a small defect with a fix specified. Every
decision left on 29 September 2026 was ruled on
([`2026-09-29-rulings.md`](2026-09-29-rulings.md)) and is built.
<!-- /rulings-summary -->

## D-30 · An optional editor engine binding

**What.** The catalogue says the rich text surface's engine is the product's,
and Crystal React kept to that: `RichTextSurface` takes any engine. Meridian's
brief of 2 October asked for headings, lists, checklists, underline,
strikethrough and touch support, which an engine-agnostic surface cannot give
a product. Crystal React now also ships `RichTextEditor` from its own entry,
`@crystal-ui/react/editor`, binding TipTap 3 to Crystal's format vocabulary,
with TipTap as optional peer dependencies. The main entry reaches no TipTap
module.

**Why it matters.** Every platform library will meet the same request. If one
binds an engine and the others do not, "the rich text surface" means different
things on different platforms.

**Options.** (a) A library may ship an optional binding from its own entry
point, the engine an optional peer; the catalogue says so and names the format
vocabulary as the contract **(rec.)**. (b) Bindings live outside the libraries,
as separate packages. (c) No bindings; remove `@crystal-ui/react/editor`.

**Where.** `core/tokens/catalogue/04-inputs.json` (`rich-text-surface.note`),
Crystal React `src/editor/`. **Closing it:** the ruling, applied to the note;
for (c), deleting `src/editor/`, `src/editor.ts` and the `./editor` export,
which breaks nothing else. Task C-T2.

<!-- ruling:D-30 -->
**Ruled on 2026-10-02 by Meridian Digital: (a) A library may ship an optional binding from its own entry point, the engine an optional peer; the catalogue names the format vocabulary as the contract.** C-T2 becomes ready; unblocks R-T7. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). The entry stays open until the work is built (task C-T2).
<!-- /ruling:D-30 -->

## D-31 · Material presets as entrances

**What.** No component plays the `plastic`, `resin`, `haze` or `stone`
presets, and none plays the five material compositions. `presets.js` calls the
presets "the movement a material makes when it enters or leaves"; `motion.md`
calls them replay studies. They are now visible (Crystal React's motion
catalogue story, the proposal's `motion.html`), and nothing else changed.

**Options.** (a) They stay studies in 2.x; `presets.js` says so; entrances are
decided per surface in 3.0 against the approved baseline **(rec.)**. (b) Each
surface a person opens names its preset now: Frost for a side sheet, Resin for
a floating transport appearing, Plastic for a new view. (c) Withdraw the five
from the package.

**Where.** `core/assets/core/presets.js`, `core/docs/motion.md`. Task C-M1.

<!-- ruling:D-31 -->
**Ruled on 2026-10-02 by Meridian Digital: (a) They stay studies in 2.x, presets.js says so, and entrances are decided per surface in 3.0.** C-M1 becomes ready. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). The entry stays open until the work is built (task C-M1).
<!-- /ruling:D-31 -->

## D-32 · Twenty assignments no component plays

**What.** With composition credited, 20 of 338 motion assignments across 15
entries are played by nothing (proposal, F-5). Eleven cannot be played by the
component as written; two are the product's child menus; seven are gaps in
Crystal React.

**Options.** As D-28: (a) take off `list-out` on the transfer list, the data
table and the resizable table, `accordion-out` on the tree view, navigation
tree, organisation chart and spoiler, `page-out` on master and detail and
`list-in` on the combobox; say in prose that the menubar's and split button's
menus are the product's; keep the rest as Crystal React tasks **(rec.)**.
(b) Grow each component to play them.

**Where.** `core/tokens/catalogue/`. Task C-M2.

<!-- ruling:D-32 -->
**Ruled on 2026-10-02 by Meridian Digital: (a) As D-28: take off the eleven the components cannot play, say in prose that the menubar's and split button's menus are the product's, and keep the rest as Crystal React tasks.** C-M2 becomes ready. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). The entry stays open until the work is built (task C-M2).
<!-- /ruling:D-32 -->

## D-33 · What "an intelligent cursor" means

**What.** The brief asked for an intelligent cursor. Crystal React built this
reading of it: formatting state follows the caret; a gap cursor lets the caret
stop between two blocks that are not text; a drop cursor shows where a drag
lands; Markdown typed at the start of a line becomes its block; a format
changed by a shortcut is announced; Alt+F10 moves focus to the toolbar.

**Options.** (a) That is what was meant **(rec.)**. (b) It meant something
else, such as a caret drawn by Crystal or caret-following suggestions, to be
specified.

**Where.** Crystal React `src/editor/RichTextEditor.tsx`.

<!-- ruling:D-33 -->
**Ruled on 2026-10-02 by Meridian Digital: (a) That is what was meant.** Records the answer; no task changes. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). Nothing is left to build; the entry closes with the next tracker review.
<!-- /ruling:D-33 -->

## D-34 · Highlight and selection

**What.** `mark` and the editor's selection would both have been primary-soft,
so a highlighted word that is then selected would not look selected. The
selection is now a 28% primary tint under unchanged text, and `mark` keeps the
primary-soft pair that `Prose` renders.

**Options.** (a) Keep both as built **(rec.)**. (b) `mark` takes the attention
pair (the highlighter's yellow), a visible change to `Prose`.

**Where.** `core/assets/crystal.css`. Task C-T1.

<!-- ruling:D-34 -->
**Ruled on 2026-10-02 by Meridian Digital: (a) Keep both as built.** C-T1 becomes ready. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). The entry stays open until the work is built (task C-T1).
<!-- /ruling:D-34 -->

## D-35 · The icon set drops the editor's glyphs

**What.** `tools/build-icons.cjs` keeps the first 1000 icons alphabetically
after its filters, so `link`, `list`, `list-ordered`, `quote`, `redo`,
`subscript` and `undo` fall past the cap, and the `-digit` filter drops
`heading-2` to `heading-4`. Crystal React draws these six in place.

**Options.** (a) A named list of icons the vocabulary requires, kept whatever
the cap; disclose every icon that leaves to make room **(rec.)**. (b) Raise the
cap. (c) Leave each library to draw its own.

**Where.** `tools/build-icons.cjs`. Task C-I1.

<!-- ruling:D-35 -->
**Ruled on 2026-10-02 by Meridian Digital: (a) A named list of icons the vocabulary requires, kept whatever the cap, with every icon that leaves disclosed.** C-I1 becomes ready. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). The entry stays open until the work is built (task C-I1).
<!-- /ruling:D-35 -->

## D-36 · A backdrop blur survives forced colours

**What.** The surface-recipes generator, reading the cascade statically,
reported that under `forced-colors: active` the status badge keeps its rim
border and the choice controls keep their blur, rim and shadow, because the
forced-colours rules lose the cascade. Measured in Chromium with forced colours
emulated, most of that does not render: the browser's own forced-colours
adjustment draws the status border in a system colour, removes every shadow,
and the choices fall back to native controls. What survives is
`backdrop-filter` (`blur(20px) saturate(1.65)` on `.cr-status`, `blur(20px)`
on the checkbox, radio and switch), which the browser does not adjust.

**Why it matters.** Little, visually: a blur behind a system-coloured control.
It is a forced-colours declaration that does not do what it says, and the
next one that loses the same way may matter more.

**Fix.** Order the forced-colours `backdrop-filter: none` after the base rules
in the component layer, and add a check that measures the computed style under
emulated forced colours rather than reading the cascade. No aesthetic change.
Task C-R2.

The static report, and its correction by measurement, are in the proposal's
F-2.

Closed entries are in [`closed-issues.md`](closed-issues.md), with the reasoning
intact. Several are cited by name from the code they produced.

## D-37 · Selection that travels between segments

**What.** When the choice changes in tabs, a segmented control, the dock,
bottom navigation or a button group used as a toggle set, the old segment's
fill switches off and the new one's switches on. Crystal paints selection on
each item (`.cr-dock button[aria-pressed=true]` and the D-26 rules for tabs,
links and radio labels), so there is no one element that could travel. The only
motion is `selection`'s squash where the new item stands; tabs play `tab-in` on
the panel and nothing on the tab. `surfaces.json` describes `.cr-indicator` as
"the moving pill behind a selected segment", but `crystal.css` draws only the
20px circle and hides `data-kind=selection`, and none of the 59 recipes moves a
selection from one place to another. Crystal React plays everything the
catalogue assigns these components.

**Why it matters.** A selection that jumps gives no sense of where it went, on
the strips people use most. And the vocabulary promises a pill no renderer can
draw, the drift the re-evaluation of 29 September warns about. The rule that
nothing moves at rest allows a travelling pill, because a person starts it; it
is a visible change to every strip, so it needs Meridian's approval.

**Options.** (a) A travelling pill for every strip: one `.cr-indicator.pill`
behind the selected segment, moved by a new critically damped recipe between
measured positions (core's `layout()` measures them for the reorder recipe
today), instant under reduced motion, on tabs, the segmented control, the dock,
bottom navigation and toggle button groups, with selection still carried by
label weight **(rec.)**. (b) The same, on tabs and the segmented control only.
(c) Keep selection in place and take the moving pill out of `surfaces.json`.

**Where.** `core/assets/crystal.css`, `core/tokens/surfaces.json`,
`core/tokens/motion-recipes.json`; Crystal React `src/styles/_strip.scss`.
Task C-M3, and R-A8 under options (a) and (b).

<!-- ruling:D-37 -->
**Ruled on 2026-10-02 by Meridian Digital: (a) Specify a travelling pill for every strip: one .cr-indicator.pill behind the selected segment, moved by a new critically damped recipe between measured positions, on tabs, the segmented control, the dock, bottom navigation and toggle button groups; selection stays label weight.** C-M3 becomes ready; adds R-A8, The travelling selection pill on strips. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). The entry stays open until the work is built (task C-M3).
<!-- /ruling:D-37 -->

## Closed most recently

| Closed | Entries | How |
|---|---|---|
| 2 October 2026 | D-38 | Opened and closed the same day: `crystal.css` writes the WebKit alias first, so a consumer's minifier keeps the unprefixed property. |
| 29 September 2026 | D-4 | On a Pixel 6 Pro. |
| 29 September 2026 | D-17 | On the evidence of its hunt. |
| 29 September 2026 | D-25 | With the preview on 2.3.0. |
| 29 September 2026 | D-21, D-26, D-27, D-28, D-29 | Built into 2.3.0. |
| 28 September 2026 | D-22, D-23, D-24 | Each by Meridian's ruling: the navigation entry draws its location dot, the catalogue's surfaces match what renders, and the field shell is adopted as written. |
| 28 September 2026 | D-19 | Meridian adopted three continuous recipes for work that is genuinely pending, and the motion chapter now says a loop by any other name is refused. |
| 24 September 2026 | D-20 | Meridian chose 48px, the value Crystal has always rendered, so the token moved up to meet the stylesheet. |
| 23 September 2026 | D-18 | Its premise was wrong. |

## Closed on 21 and 22 September 2026

- **D-11**, the three divergences between the library and the preview. Meridian
  decided all three: the library adopts, and the preview does not drop.
- **D-13**, the visual gate red on nine frames with nobody running it. Every
  frame was looked at and decided, and the gate was put in CI.
- **D-15**, the half of D-13's remedy that failed the same day: the baselines
  were machine-specific, so the gate could not run on a runner. Closed by
  capturing the baselines on the runner, which is where they are compared.
- **M-3**, **D-5** and **D-16**, and the half of **D-4** that was traced to a
  Playwright flag and not to browsers.
