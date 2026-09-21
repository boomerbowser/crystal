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
**Nothing here is genuinely open.** D-13 — the visual gate red on nine frames
with nobody running it — was closed on 21 September 2026: every frame was looked
at and decided, and the gate now runs in `crystal-preview`'s CI. What is left is
the two kinds above, and neither is work this repository can do.

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
