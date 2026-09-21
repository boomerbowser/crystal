# Open issues — Crystal design system

Things noticed during Crystal 2.0 and the React library's implementation that are
not fixed. Each says what is wrong, why it matters, where it is, and what closing
it would take.

**Nothing here is blocking**, and nothing here is work that is simply outstanding.
What is left divides into three kinds:

- **Waiting on hardware.** D-4 and D-5 need a real device or a headless browser
  that paints classic scrollbars. Both are documented where a reader meets them,
  and neither can be closed in this repository.
- **Waiting on Meridian.** M-3 is a decision about what Crystal *should* be,
  not a defect against what it is. D-11's three divergences were the others and
  Meridian decided all three on 21 September 2026 — the library adopts, the
  preview does not drop — so that entry is closed.
- **Genuinely open.** D-13: the visual regression gate is red on nine frames and
  nothing was running it.

Closed entries are in [`closed-issues.md`](closed-issues.md), with the reasoning
intact — several are cited by name from the code they produced.

---

## D-4 · Two gates cannot see what they are named for

Both are stated in the source and in the capture README, so neither is a hidden
assumption — but neither is closed.

- **Scrollbar appearance has no visual gate.** Headless Chromium paints no
  scrollbar at all, so no reference frame contains one. What guards the two
  scrollbars is the contrast gate, across twelve palette-and-mode combinations —
  stronger than a screenshot in one respect and blind to geometry in another.
- **The phone leg of `verify-scroll` proves behaviour, not appearance.**
  Playwright's mobile emulation uses overlay scrollbars, where `scrollbar-gutter`
  is a no-op. What it proves is that swipes stop chaining.

`design-system/tools/verify-scroll.mjs`. Closing either needs a real device or a
browser that paints classic scrollbars headlessly.

**Documented, not closable here.** Both are stated in `verify-scroll.mjs` and in
the capture README, where a reader meets them. Closing either needs hardware this
repository does not have: a real device, or a headless browser that paints
classic scrollbars. Left open deliberately rather than marked done.

## D-5 · `IntersectionObserver` delivers nothing in the preview browser

While building Crystal React's `AppBar`, an `IntersectionObserver` created in the
in-app preview browser never fired — not even its initial callback, on a target
with real area and an explicit root. A freshly constructed observer in the page
console behaved the same way.

That may be an environment limitation rather than a browser one, but it means any
Crystal work that relies on `IntersectionObserver` cannot be verified where the
rest of the visual work is verified. `AppBar` uses a passive scroll listener
instead and says why in its source.

Worth knowing before `animate-on-scroll` or a virtualiser is reviewed the same way.

---

**Documented, not closable here.** The trade is written where somebody meeting it
would look — in `AppBar`'s own source, beside the passive scroll listener that
replaced the observer. It is a limitation of the preview browser, not a defect in
Crystal, and there is nothing here to repair.

## M-3 · The catalogue asks a tree for roles it cannot have

**A decision for Meridian. Nothing is broken; the catalogue line is.**

`tree-view` specifies `role=tree/treeitem/group`, and in the same entry
specifies "expand controls" in its anatomy and "indentation guides" in what
Crystal supplies. Those two requirements are not compatible.

A `treeitem` in the ARIA tree pattern is a **single navigable unit**. The whole
widget is one tab stop and the arrow keys move between items, which is what makes
a tree a tree — and it means an item must not contain independently focusable
widgets, because there is no key left to reach them with. A row with a disclosure
button in it has one.

`treegrid` is the pattern ARIA provides for exactly this case. Rows still carry
`aria-level`, `aria-expanded`, `aria-posinset` and `aria-setsize`; the arrow keys
still walk the visible rows; and the keyboard can additionally move into a row to
reach the control inside it. React Aria's `Tree` implements it, and implements
only it — the alternative in the same library, `NavigationTree`, is for a nested
set of links and drops selection entirely, which `tree-view` requires.

Crystal React ships the `treegrid`. Everything the catalogue asks for *by
behaviour* is present and verified: level, expansion, full arrow-key navigation,
selection by label weight. Only the role names differ.

**What Meridian decides:** whether the catalogue line becomes
`role=treegrid/row/gridcell`, or whether the disclosure comes out of the anatomy
so a plain `tree` becomes possible. The first is a documentation change and the
second is a design change, which is why it is not made here.

Left open, not closed.


## D-13 · The visual regression gate is red, and nothing was watching it

**Found 2026-09-20. Not fixed — and deliberately not blessed.**

`npm run verify:floor` fails on nine of its frames:

```
catalogue.png                          3191 px differ, worst delta 229; 2626 visible (>24)
playground-dark.png                   48997 px differ, worst delta  52; 11358 visible (>24)
playground-light.png                  30077 px differ, worst delta  18; none visible
playground-narrow.png                  8189 px differ, worst delta  19; none visible
playground-opaque.png                 29857 px differ, worst delta  18; none visible
playground-reduced-transparency.png   29995 px differ, worst delta  18; none visible
playground-rtl.png                    30053 px differ, worst delta  18; none visible
components-light.png                    647 px differ, worst delta  11; none visible
motion.png                             1656 px differ, worst delta  15; none visible
```

**It is not the restructure and it is not D-11.** The suite was run twice against
the same server, once with the corrected focus halo and once with the withdrawn
one restored, and the failures are identical to the pixel — the only movement
was five pixels on `playground-opaque`, which is antialiasing noise. That is the
expected result: the halo paints on `:focus-visible` and no baseline frame has
anything focused. Whatever this is, it predates today.

**Why nobody knew.** `.github/workflows/verify.yml` runs the scroll, interaction
and deployability gates. It does not run `verify:visual` or `verify:floor`. The
visual gate is manual, and a manual gate is one nobody runs. It has been red for
an unknown length of time — the baselines were last *touched* on 2026-09-20 by
the folder move, which only relocated the files, so the last real capture is
older than that and the git history no longer distinguishes them.

**Two different problems are hiding in that list.** Seven frames differ by a
maximum channel delta under 20 with **no pixel past the visible threshold** —
sub-threshold drift, most likely rendering-environment difference, and the kind
of thing a pixel baseline captured on one machine always eventually reports on
another. Two frames — `catalogue` and `playground-dark` — have thousands of
*visibly* changed pixels and worst deltas of 229 and 52. Those are not
antialiasing. On `playground-light` the differences cluster in the right-hand
control panel rather than scattering along glyph edges, which is also not what
environment drift looks like.

**Do not bless these baselines to make the gate green.** Blessing is how a real
regression becomes the new reference, and at least two of these frames have not
been explained. The entry is here rather than a fix because deciding what the
`catalogue` and `playground-dark` differences *are* needs the two images looked
at side by side, and because if part of it is environment drift then the answer
is a tolerance or a pinned browser, not a re-capture.

**Where it lives now.** The baselines, the frame set and the whole visual gate
moved to **crystal-preview** with the site they photograph — `validation/baselines/`
and `tools/verify-frames.mjs` there. This repository has neither, which is why
this entry stays here rather than moving with them: the finding is about
Crystal's appearance, and the decision about what those two frames show is
Crystal's to make.

**What to do, in order:** pin the capture environment (browser version is the
obvious candidate) so the question can be asked reproducibly; look at
`catalogue` and `playground-dark` before and after; then decide per frame. And
wire whichever variant survives into crystal-preview's CI, which now has a
browser job and does not run this gate in it — the specific way this went
unnoticed is that it was never asked.
