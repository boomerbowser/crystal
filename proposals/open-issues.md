# Open issues — Crystal design system

Things noticed during Crystal 2.0 and the React library's implementation that are
not fixed. Each says what is wrong, why it matters, where it is, and what closing
it would take.

**Nothing here is blocking**, and nothing here is work that is simply outstanding.
What is left divides into three kinds:

- **Waiting on hardware.** D-4 and D-5 need a real device or a headless browser
  that paints classic scrollbars. Both are documented where a reader meets them,
  and neither can be closed in this repository.
- **Waiting on Meridian.** M-3 and the three divergences recorded in D-11 are
  decisions about what Crystal *should* be, not defects against what it is. They
  are written so the decision can be made, not so it can be deferred.
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


## D-11 · The library shipped a focus halo Meridian had withdrawn

**Found 2026-09-20. Fixed the same day.**

The focus halo's spreads were halved at Meridian's request — `2/6/12/22` to
`1/3/6/11`, blur radii deliberately unchanged so the ring thins without the
falloff flattening. The change was made in `website/assets/controls.css`, the
preview's own stylesheet, which overrides the library's.

So three things were true at once:

- **Crystal's site rendered the halved halo.** `controls.css` wins.
- **The specification documented the halved halo.** `build-reference.cjs`
  generates the focus-recipe table by reading `controls.css`, precisely so the
  table cannot be hand-transcribed and drift. It read the override.
- **The library shipped the withdrawn halo to every consumer.**
  `core/assets/crystal.js` still emitted `[[6,2,46],[16,6,30],[30,12,17],
  [54,22,8]]` into the exported theme, and the exported theme is what a consumer
  reads. Crystal React's focus ring has been visibly wider than Crystal's own
  for as long as that has been true.

Blur radii and alphas were identical throughout. Only the spread was behind,
which is why it survived: the ring was the right colour, the right softness and
the right shape, and simply too big.

**This is D-9 again.** D-9 was Crystal exporting one Resin shadow and rendering
another; the preview's stylesheet shaped the blessed appearance while the
exported token said something else. `verify-package.cjs` was built to stop the
preview's stylesheet *leaving the repository*. It cannot stop the preview's
stylesheet **overriding** the library inside it, which is the same failure
through a different door.

**Nothing caught it.** Crystal React's `verify-appearance`, `verify-theme` and
`verify-materials` were each run against the withdrawn value deliberately, and
all three passed. They assert that `--cr-focus-ring` is *defined* — the correct
check when the defect was that it was read by everything and defined by nothing,
and no check at all against a wrong number.

`tests/core-contracts.cjs` now compares the exported halo against the rendered
one, layer by layer, blur and spread. Reverting `crystal.js` turns it red with
the four pairs printed side by side.

**Still open, and Meridian's to decide:** the preview raises the feather's alpha
in dark mode (`56/38/22/11` against the library's `46/30/17/8`) to hold up
against a deep canvas. The library does not. Nobody has said which is correct,
so the contract compares geometry only and the divergence stands recorded rather
than frozen. Either the library should carry the dark-mode lift, or the preview
should stop applying it.

**A second divergence in the same property, found 20 September when the
repository split made it unavoidable.** `build-reference.cjs` generated the
focus-recipe table by reading the preview's `controls.css`. With the preview in
another repository it could not open the file at all, and reading the library's
own exported theme instead showed the table losing two rows:

| | halo layers | elevation layers |
|---|---|---|
| `controls.css`, which the site renders | 4 | 2 — `0 8px 18px` directional, `0 22px 40px` broad |
| the exported theme, which consumers read | 4 | none |

So a focused control in Crystal React gets the halo and **no elevation change at
all**, while a focused control on Crystal's own site lifts. Not a spread this
time — two whole layers.

**Three divergences are now named and none is decided:**

1. **The elevation layers.** Should `--cr-focus-ring` carry them, or is lifting
   on focus the site's own flourish? The prose in `components.md` described them
   as Crystal's behaviour, which is an argument that they are.
2. **The dark-mode feather alphas.** The site raises them to 56/38/22/11 against
   the library's 46/30/17/8, to hold the falloff against a deep canvas. The
   library does not.
3. **Everything else `controls.css` redefines — enumerated 21 September 2026.**
   It is smaller than feared in one direction and larger in the other.

   **Custom properties defined by both: three.** The library defines 142 across
   `crystal-theme.css` and `crystal.css`; `controls.css` defines 11; the
   intersection is `--cr-focus-core`, `--cr-focus-ring` and `--cr-outline`.

   | property | library | `controls.css` | verdict |
   |---|---|---|---|
   | `--cr-focus-core` | `#7338EF` / `#c8b1f9` | `var(--cr-primary)` | **not a divergence.** `--cr-primary` *is* `#7338EF` / `#c8b1f9`. Same value, spelled as a reference. Deleting it from the site changes nothing — unless a page sets `--cr-primary` locally, in which case the site's focus core follows it and the library's does not. |
   | `--cr-focus-ring` | four halo layers | the same four, **plus two elevation layers** | divergence (1) above. |
   | `--cr-outline` | `#624a9f` / `#bfa3f8`, globally | `var(--status-ink)`, **scoped to `.cr-status`** | **a third divergence, and new.** The library never narrows `--cr-outline` inside `.cr-status`. So a focused status chip outlines in its own status colour on Crystal's site, and in the generic outline colour in every consumer. `--status-ink` is the library's own property, set per `[data-status]`, so the site is not inventing a value — it is applying one the library defines and does not use here. |

   The other eight properties `controls.css` defines are its own and collide
   with nothing: `--cr-control-color`, `--cr-control-light`,
   `--cr-focus-feather-1` … `-4`, `--cr-focus-shadow`, `--cr-range-progress`.
   **Divergence (2) lives in those feather variables** — the library has no
   equivalent and inlines its alphas straight into `--cr-focus-ring`, which is
   why the dark-mode lift had nowhere to be compared.

   **The larger direction, and the first measurement of it was wrong.** An
   earlier pass here reported "50 declarations set by both, across 14 of
   Crystal's own classes". That number was produced by intersecting *class
   names* per stylesheet, which flattens every context: it counted a
   `@media (forced-colors: active)` override against a base rule, and
   `span.cr-status > span` against `.cr-status`. Its value-level companion
   claimed `.cr-button { background: Canvas !important }` and
   `.cr-status { border-radius: 50% }` were Crystal's, which they are not.
   **Do not use it.**

   Parsed properly with postcss, keying each declaration by its full context —
   enclosing at-rules, exact selector, property — the library sets 510
   declarations and `controls.css` sets 502, and **the number they share is
   zero**. Not one selector-and-property pair is set by both.

   That is not a clean bill of health; it relocates the question. `controls.css`
   wins by **cascade rather than by collision**: it styles compound selectors
   like `:is(button, a.cr-button, .cr-control, .cr-field-shell, …)` where the
   library styles a bare `.cr-button`, so the two never textually agree and the
   site's declaration still lands on the same element. A static diff cannot see
   that, and no amount of care with the parser will make it.

   **The only honest measure is computed style on a rendered element** — the
   same page with `controls.css` enabled and disabled, in both modes and with
   forced colours emulated, diffed over every element carrying a `cr-*` class.
   That is the experiment this item needs and it has not been run yet.

   **What to build once the values are compared**: the check this entry always
   wanted, in `tests/site-contracts.cjs` in crystal-preview — the site redefines
   no custom property and re-declares no material property the library already
   sets, with an explicit allow-list carrying a reason per entry. It cannot be
   written before (1) and (2) are decided, because it would freeze them.

Until (1) and (2) are decided, the contract compares geometry only and the first
four layers only. Freezing either divergence into a gate would be deciding it by
accident, which is how the spreads got out of step in the first place.

**Also fixed, 20 September:** the prose above the generated table still quoted
the withdrawn spreads — "46% at 6px blur / 2px spread, 30% at 16px / 6px …" —
long after the halo was halved, so the specification contradicted its own
generated table two lines below. `validate-docs.cjs` now requires every
blur/spread pair the theme exports to appear in that sentence, which turns red
four times over if the halo moves and the prose does not.

---

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
