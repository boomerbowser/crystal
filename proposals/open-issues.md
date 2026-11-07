# Open issues: Crystal design system

Things noticed during Crystal 2.0 and the React library's implementation that are
not fixed. Each entry says what is wrong, why it matters, where it is, and what
closing it would take.

<!-- rulings-summary -->
**Three entries are open**, D-37, D-40 and D-41, all from the media, text and recipe work of 2 October
2026 ([`2026-10-02-media-text-and-recipe-parity.md`](2026-10-02-media-text-and-recipe-parity.md)).
One waits on a ruling by Meridian; one is ruled ([`2026-10-02-rulings.md`](2026-10-02-rulings.md)) and open until built; D-40 is a defect with a fix specified. Every
decision left on 29 September 2026 was ruled on
([`2026-09-29-rulings.md`](2026-09-29-rulings.md)) and is built.
<!-- /rulings-summary -->

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

## D-40 · Three faults in the editor recipe

**What.** Found by Crystal React wearing `.cr-editor` and `.cr-editor-toolbar`
from 2.4.0 (R-T9), measured in Chromium on 7 November 2026, computed values:

1. `.cr-editor { min-height: calc(var(--cr-text-body-leading) * 4) }` multiplies
   a unitless leading (`1.5`), so the result is the number `6`, invalid for a
   length at computed-value time. A bare `.cr-editor` computes `min-height: 0px`:
   an empty editor collapses to its padding. The checklist's control offset,
   `calc((var(--cr-text-body-leading) - var(--cr-choice-box-size, 26px)) / 2)`,
   subtracts a length from a number and computes `margin-top: 0px` the same way.
2. On a fine pointer `.cr-editor-toolbar` is `position: sticky; inset-block-start: 0`
   with no background (`rgba(0, 0, 0, 0)`), so a document scrolled under it
   shows through the controls.
3. `.below` asks for "the touch placement on any pointer" but sets only the
   order, the inset and the rule; the touch placement's single scrolling row is
   in the `pointer: coarse` block alone. And there is no counterpart: a product
   that wants the toolbar above the text on a touch screen has to undo the
   coarse rule property by property.

**Why it matters.** The first is a value the recipe states and no renderer
draws. The second makes the toolbar unreadable over text on every desktop
editor that scrolls with the page. The third leaves two platforms to guess what
a placement means.

**Closing it.** Multiply by `1em` (`calc(var(--cr-text-body-leading) * 1em * 4)`,
and the same in the checklist offset), or publish the leading as a length. Give
the sticky toolbar the Haze fill Crystal React already paints under the bottom
toolbar, rounded to the well. Add `.above`, and either give `.below` the
touch row or say it is placement only. Crystal React keeps three local rules
for these meanwhile (`RichTextSurface.module.scss`: the 144px floor, the
toolbar kept in the flow, and the `top` placement undoing the coarse rule) and
drops them with this fix.

**Where.** `core/assets/crystal.css`. Task C-S7.

## D-41 · The body's leading is not `--cr-leading`

**What.** `crystal.css` sets `body { line-height: 1.6 }`; the theme publishes
`--cr-leading: 1.5` and `--cr-text-body-leading: 1.5`. Recipes that read the
token (`.cr-media-bar`, `.cr-media.audio`) set 24px lines on 16px text inside a
page whose inherited lines are 25.6px. Crystal React's audio card moved from
the inherited 1.6 to the token's 1.5 when it began wearing the recipe
(7 November 2026).

**Why it matters.** Two leadings for body text, one written and one published,
and which one a component gets depends on whether its recipe names the token.

**Options.** (a) The body takes the published 1.5 (`var(--cr-leading)`), which
the Swift and Kotlin exports already carry as a 24px reading leading
**(rec.)**. (b) The tokens move to 1.6, and the reading leading to 25.6px on
every platform. Changing the body moves every page's text; changing the token
moves every recipe that reads it. It is a visible change either way, so it is
Meridian's to choose.

**Where.** `core/assets/crystal.css`, `core/tokens/`. Task C-S8 once ruled.

<!-- ruling:D-41 --><!-- /ruling:D-41 -->

## Closed most recently

| Closed | Entries | How |
|---|---|---|
| 3 October 2026 | D-39 | By Meridian's ruling (a): a selected highlight takes the action pair. |
| 2 October 2026 | D-36 | Measured, fixed, and found two more surfaces than the static report. |
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
