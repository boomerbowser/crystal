# Open issues: Crystal design system

Things noticed during Crystal 2.0 and the React library's implementation that are
not fixed. Each entry says what is wrong, why it matters, where it is, and what
closing it would take.

<!-- rulings-summary -->
**Three entries are open**, D-36, D-37 and D-39, all from the media, text and recipe work of 2 October
2026 ([`2026-10-02-media-text-and-recipe-parity.md`](2026-10-02-media-text-and-recipe-parity.md)).
One waits on a ruling by Meridian; one is ruled ([`2026-10-02-rulings.md`](2026-10-02-rulings.md)) and open until built; D-36 is a defect with a fix specified. Every
decision left on 29 September 2026 was ruled on
([`2026-09-29-rulings.md`](2026-09-29-rulings.md)) and is built.
<!-- /rulings-summary -->

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

## D-39 · A selected highlight falls below 4.5:1 in Harbor

**What.** D-34 kept the highlight (`mark`, on-primary-soft ink on the
primary-soft fill) and the editor's selection (a 28% primary tint under
unchanged ink) as built, and both pass on their own: the highlight measures
6.06:1 or better and the selection 7.63:1 or better in every palette and mode
(C-T1 checks them). Where they meet, a highlighted word that is then selected,
the ink stays on-primary-soft and the tint composites over the primary-soft
fill. In five palettes that is 5.7:1 or better. In Harbor it is **4.34:1 in
light and 3.74:1 in dark**, under the 4.5:1 text minimum.

**Why it matters.** It lasts only while the text is selected, but a person
selects text to read it, copy it or format it, and Crystal holds all text to
4.5:1. A palette added later can fail the same way, because the composite
depends on how close a palette's primary is to its primary-soft.

**Options.** Each changes how a selected highlight looks; nothing else moves.

- (a) A selected highlight takes primary with on-primary ink, the action
  pair, which the resolver's audit already holds at 4.5:1 for every palette,
  including any added later. Lowest today 4.74:1. The selection inside a
  highlight is then stronger than elsewhere **(rec.)**.
- (b) The tint over a highlight drops to 16%. Lowest today 4.53:1. The
  smallest visible change, but the margin is thin and a new palette is not
  guaranteed to pass.
- (c) Keep as built and record Harbor as an exception.

**Where.** `core/assets/crystal.css` (`.cr-editor ::selection`), and a check in
`tools/validate-tokens.cjs` for whichever pair is chosen. Measured with the
same arithmetic as the token checks; the values above are for 28% and 16%
tints of each palette's primary over its primary-soft.

<!-- ruling:D-39 --><!-- /ruling:D-39 -->

## Closed most recently

| Closed | Entries | How |
|---|---|---|
| 2 October 2026 | D-30, D-31, D-32, D-33, D-34, D-35 | Built from Meridian's rulings of the same day. D-39 opened from D-34's measurements. |
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
