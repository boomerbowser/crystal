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
- **Genuinely open.** D-15: the visual gate cannot run in CI, because the
  baselines are machine-specific.

D-13 — the visual gate red on nine frames with nobody running it — was closed on
21 September 2026: every frame was looked at and decided. Half of its remedy did
not survive the day, and D-15 is that half.

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

---

## D-15 · The visual baselines are machine-specific, so the gate cannot run in CI

**Found 21 September 2026, by trying it. Not fixed.**

D-13 closed with the gate wired into `crystal-preview`'s browser job, on the
argument that a manual gate is one nobody runs. That commit's own CI run failed
**16 of the 18 frames**:

```
docs-menu-forced-colours.png   46,058 pixels visibly changed, worst delta 255
icons.png                      25,866                        worst delta 229
playground-reduced-transp.png  12,297                        worst delta 192
overview-dark.png               7,531                        worst delta 230
docs-menu-light.png             7,098                        worst delta 229
catalogue.png                   5,075                        worst delta 229
…and ten more
```

The same frames pass locally at **zero tolerance**. The frames that fail hardest
are the text-heavy ones — the menu, the icon sheet, the overview — and the
deltas are at the extremes rather than in the middle, which is what glyph edges
look like when they land on different pixels. **A GitHub runner does not
rasterise type the way this machine does.** The comparison there measures the
font stack, not Crystal.

So the gate was taken back out within the hour, and the reasoning is recorded
because it is a real trade rather than a retreat: a gate that fails on every push
is worse than a manual one, because it teaches everybody to ignore a red mark.

**What this establishes** — D-13 suspected it about seven of its nine frames and
could not demonstrate it: **these baselines are machine-specific**, and a pixel
baseline is only meaningful in the environment that captured it.

**What closing it takes.** Capture where you compare. A second baseline set,
captured *by* a runner and committed from one — a `workflow_dispatch` job that
runs `capture-frames.mjs` and opens a pull request with the result, and a gate
that compares CI captures against CI baselines while a person keeps comparing
local captures against local ones. Two sets is not duplication here; it is the
only honest arrangement, because the two environments genuinely draw different
pixels and neither is wrong.

**Do not** reach for a larger tolerance instead. The deltas are 192–255. A
tolerance that forgives them forgives anything, and
`tests/visual-gate-contracts.py` exists precisely to prove the allowance cannot
grow to swallow a visible change.

**Until then the gate is manual**, which is the condition D-13 opened on. It is
at least now green, documented, and backed by the contract test that had gone
missing — so running it is worth something, and `npm run verify:visual` in
`crystal-preview` is the command.
---

## D-16 · Two specification pages disagree about `.cr-dock-inner`, and the preview blanks its own Stone specimen

**Found 21 September 2026, while measuring what `controls.css` still overrode
after the first adoption pass. Not fixed — the decision is Meridian's.**

The library and the preview render `.cr-dock-inner` differently, and each has a
page of this specification behind it.

| Page | What it says |
|---|---|
| `components.md` | *Stone label backing … `.cr-stone`; `.cr-dock-inner` shares the recipe* |
| `materials.md` | *`.cr-stone` paints `--cr-stone-fill` on an isolated `::before` layer … The dock's `.cr-dock-inner` uses the same recipe* |
| `materials.md`, the same page | *A label on a Resin dock → **Give the label its own Resin chip** → Give it a Haze content fill, or Stone if the backdrop is unknown* |

The library follows the first two: `.cr-dock-inner` is Stone-backed. The preview
follows the third: now that `.cr-dock` is a Resin pill, the inner is transparent
and its `::before` is switched off, because a Stone fill inside a Resin plane is
a second backing over the first.

Both readings are defensible and the material hierarchy does not settle it, so
the second adoption pass left the preview's rule where it is rather than
adopting it or deleting it. It is named in `crystal-preview`'s
`tests/site-contracts.cjs` `ALLOWED_RULES` with this issue as the reason, which
is the only rule in that file exempted on a decision rather than on ownership.

**The part that is not a matter of opinion.** The preview's rule is
`.cr-dock-inner::before { display: none }`, and it therefore also blanks
`.cr-dock-inner.cr-stone` — which is the markup of the preview's *own* Stone
specimen on `playground.html`:

```html
<div class="study-floating cr-resin">
  <div class="cr-dock-inner cr-stone"><span>Stone on Resin</span>…</div>
</div>
```

So the card captioned "Stone · label backing — 55% light / 60% dark fill, now
with the same 1.95px feather as Haze" currently demonstrates no Stone at all.
Measured on the running site, not inferred:

```
as the branch ships it    display:none   background:rgba(255,255,255,0.55)  filter:blur(1.95px)
with :not(.cr-stone)      display:block  background:rgba(255,255,255,0.55)  filter:blur(1.95px)
```

**The fix, verified before being written down**, is to narrow the preview's
selector to `.cr-dock-inner:not(.cr-stone)`. The fill and feather that come back
are exactly the ones `materials.md` specifies. It is *not* applied here, because
the specimen is on `playground.html` and six of the eighteen visual baselines
are playground frames; changing it means re-blessing them, and re-blessing needs
WebGL2 this machine does not have — see D-15. It is a one-selector change for
whoever has the hardware.

**Whichever way D-16 is decided**, the specimen fix stands on its own: a
documentation site that shows an empty card where a material should be is wrong
under either reading.
