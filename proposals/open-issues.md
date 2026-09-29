# Open issues — Crystal design system

Things noticed during Crystal 2.0 and the React library's implementation that are
not fixed. Each says what is wrong, why it matters, where it is, and what closing
it would take.

**Seven entries are left.** D-4's remaining half is waiting on hardware, D-17
is a flake nobody can diagnose until it happens again with the evidence kept,
D-21 is a hover treatment the stylesheet specifies and layer order erases —
Meridian's to rule on, with a recommendation in §4.3 of
[`2026-09-28-component-recipes.md`](2026-09-28-component-recipes.md) — D-25
holds three findings from Crystal React's surface sweep, D-26 two things the
dock surface names that `.cr-dock` does not yet draw, D-27 two small marks
whose recipes do not reach the element a consumer has, and D-28 motion the
catalogue assigns that no component can play as written.
D-22, D-23 and D-24 closed on 28 September 2026, each by Meridian's ruling: the
navigation entry draws its location dot, the catalogue's surfaces match what
renders, and the field shell is adopted as written.
D-19 closed on 28 September 2026: Meridian adopted three continuous recipes for
work that is genuinely pending, and the motion chapter now says a loop by any
other name is refused. The reasoning is in [`closed-issues.md`](closed-issues.md).
D-20 closed on 24 September 2026: Meridian chose 48px, the value Crystal has
always rendered, so the token moved up to meet the stylesheet rather than the
stylesheet down to meet the token. The reasoning is in
[`closed-issues.md`](closed-issues.md).
D-18 closed on 23 September 2026 — its premise was wrong, and the reasoning is in
[`closed-issues.md`](closed-issues.md).

D-4's remaining half needs a real phone: what a person's thumb meets on a device Playwright cannot emulate
is not something this repository can answer. It is documented where a reader
meets it.

Everything else closed on 21 and 22 September 2026, and the reasoning is in
[`closed-issues.md`](closed-issues.md) rather than summarised away:

- **D-11**, the three divergences between the library and the preview — Meridian
  decided all three: the library adopts, the preview does not drop.
- **D-13**, the visual gate red on nine frames with nobody running it — every
  frame looked at and decided, and the gate put in CI.
- **D-15**, which was the half of D-13's remedy that did not survive the day:
  the baselines were machine-specific, so the gate could not run on a runner.
  Closed by capturing the baselines *on* the runner, which is where they are
  compared.
- **M-3**, **D-5** and **D-16**, and the half of **D-4** that turned out to be a
  fact about a Playwright flag rather than about browsers.

Closed entries are in [`closed-issues.md`](closed-issues.md), with the reasoning
intact — several are cited by name from the code they produced.

---

## D-4 · The phone leg of `verify-scroll` proves behaviour, not appearance

*(Halved 22 September 2026. This issue held two claims; the first was wrong and
its half is closed. What is left is the one below, and it is now demonstrated
rather than asserted.)*

**The claim that was wrong.** D-4 said: "Headless Chromium paints no scrollbar at
all, so no reference frame contains one," and concluded that closing it needed
"a browser that paints classic scrollbars headlessly." That is a fact about a
flag, not a browser. Playwright pushes `--hide-scrollbars` whenever `headless` is
true:

```
arm A  default headless                          scrollbar 0px
arm B  ignoreDefaultArgs: ['--hide-scrollbars']   scrollbar 15px
arm C  ignore it, then pass it back explicitly    scrollbar 15px
```

Arm C looks like a contradiction and is not: `ignoreDefaultArgs` filters the
final argument list, so it strips the flag again even when it is passed by hand.
Flag present, no scrollbar; flag absent, a classic 15px one. `crystal-preview`
now has `scrollbar-resin` and `scrollbar-frost` frames that opt out of the flag,
and both were mutated at the resolver and watched go red — the Resin thumb from
80% to 50%, the Frost thumb from ink to primary, each failing its own frame and
only its own frame.

**What remains, and it is real.** Playwright's mobile emulation uses overlay
scrollbars, where `scrollbar-gutter` is a no-op — and it does so independently of
the flag, which is what the first claim got wrong about itself:

```
desktop, flag dropped            scrollbar 15px, scrollbar-gutter:stable
mobile emulation, flag dropped   scrollbar  0px, scrollbar-gutter:stable
```

So the phone leg of `verify-scroll` proves that swipes stop chaining, and cannot
prove that a gutter reserves space, because on that device nothing ever reserves
space. Closing this needs a real device. It is stated in `verify-scroll.mjs` and
in the capture README where a reader meets it.

**Documented, not closable here.** Left open deliberately rather than marked done.

---

## D-17 · `forced-colours-dark` differs on the runner about one run in two

*(Opened 22 September 2026.)*

**What happened.** The first push to `crystal-preview` after the visual gate went
into CI failed on one frame:

```
FAIL forced-colours-dark.png: 287 of 1152000 pixels differ (0.0249%),
worst channel delta 229; 231 pixel(s) changed visibly (delta over 24)
```

Re-running the same job on the same commit, with no change of any kind, passed
23 of 23. So the frame is nondeterministic on the runner.

**Why it matters more than 287 pixels.** A gate that fails at random is a gate
people learn to re-run rather than read, and the next real regression arrives
looking exactly like this one. It is also the failure mode D-15 was closed to
prevent — "capture where you compare" fixed *systematic* disagreement between
the desk and the runner, and this is the residual *random* kind.

**What is ruled out.** The commit that first showed it changed only class names
on buttons — `cr-button secondary` to `cr-button`, `cr-button` to `cr-button
primary`. Neither class has a rule in the 2.0.0 the site installs, neither
appears in any of the site's three stylesheets, and the same build is 23 of 23
identical against the desk baselines. The markup is not the cause.

**What is not yet known.** Which 287 pixels. The gate captured to a temporary
directory the process deleted on its way out, so the first failure it ever
produced left nothing to look at — which is itself now fixed: `verify-frames`
takes `--keep`, and the CI job uploads `actual-` and `expected-` for every
differing frame on failure.

**It does not reproduce on the desk.** 23 September 2026: the frame was captured
eight times, each in a fresh browser context with the frame's own settings
(`forcedColors: 'active'`, `colorScheme: 'dark'`, `deviceScaleFactor: 1`, 1280×900,
900ms settle), and each compared against the first with
`tools/compare-captures.py --tolerance 2 --max-differing 400` — the gate's own
comparison, at the gate's own tolerance. Seven of seven came back SAME. Eight
captures is not a proof of determinism, but it does say the nondeterminism is not
cheaply available here, so the artifact from the runner remains the way in.

**Two of the three candidates are now ruled out by measuring the baseline**
(`validation/baselines-ci/forced-colours-dark.png`, 1,152,000 pixels):

- *The atmosphere gradient's dither.* There is no gradient left to dither.
  92.03% of the frame is pure black and 2.98% is pure white; the intermediate
  greys are 3.46%, and they are spread over a bounding box of 44,0–1235,877 —
  that is glyph anti-aliasing across the whole frame, not a shaded region with
  banding seams in it. A seam moving one quantisation step would also be a *small*
  delta, and 231 of the 287 pixels crossed the gate's visible threshold of 24.
- *The Manrope fallback resolving differently.* A different typeface moves every
  glyph edge. There are 39,828 anti-aliased glyph pixels in this frame; 287 is
  0.7% of them. A font swap cannot be that small.

**What the magnitude does say.** In a frame that is 95% two pure tones, 231
pixels changing by up to 229 is one small thing drawn or not drawn at full
contrast — for scale, the string `15.78:1` in this frame is 187 pixels of ink
above that same threshold. And whatever it is, **it does not reflow**: if the
thing that changed had altered any inline box's width, the text after it would
have moved and the count would be in the thousands. So the candidate is something
painted in place — a caret, a focus ring, a hover or pressed state, a glyph
substitution of equal advance — and not a piece of content arriving late. (Worth
knowing while reading the artifact: `#contrast-metric` is the only readout in
this region whose shipped markup, `—`, differs from what `site.js` renders. It is
therefore the one element a half-rendered page would betray — and it would betray
it by reflowing the label beside it, which is not this.)

**Closing it needs** the next occurrence with the artifact `verify-frames --keep`
now writes and the CI job now uploads: `actual-forced-colours-dark.png` beside
`expected-`, differenced, to say *where* the 287 pixels are. The three sentences
above are what that image has to be read against.

---

## D-21 · Crystal specifies a hover treatment for its button that layer order erases

**Found 24 September 2026, by Crystal React's R-19 sweep, and it is D-20's
sibling.**

`controls.css` writes a hover treatment for the action button:

    .cr-button:hover { box-shadow: var(--cr-shadow-content); filter: brightness(1.04) }

That rule is in `@layer crystal.reset`. Two rules in `@layer crystal.component`
land on the same element:

    :is(button, a.cr-button, .cr-control, …) { box-shadow: var(--cr-shadow-float) }
    :is(button, a.cr-button):hover           { background: var(--cr-resin-fill); filter: none }

A later layer wins regardless of specificity, so the component layer takes both
halves: `filter: none` cancels the brightness lift, and the resting
`--cr-shadow-float` outranks the hover `--cr-shadow-content` even though the
hover rule is more specific. **Crystal's button has no hover treatment at all.**
Measured in a browser, a `.cr-button` and a bare `<button>` are identical at rest
and on hover, in every one of `background`, `filter` and `box-shadow`.

This is the same defect as D-20 — a rule authored in `crystal.reset` that the
component layer erases, published and rendering nothing — and it was found the
same way, by planting Crystal's own element beside a consumer's and diffing the
computed style.

**Which of the two is wanted is Meridian's call, and they are different designs.**
`crystal.component` says the resting state of a Resin control already *is* the
floating state, so there is nowhere further to lift; on that reading the reset
rule is stale and should go. `crystal.reset` says a pressable control brightens
and settles toward the surface when the pointer is over it; on that reading the
component rule needs a hover clause and the treatment should move into it. What
is not wanted is the present state, where the stylesheet says one thing and
renders the other.

**Crystal React has stopped compensating for it.** The library had
`filter: brightness(1.04)` on `[data-hovered]`, attributed in a comment to
"the one Crystal writes for its own filled button" — which is the reset rule,
the one that does not render. The R-19 sweep deleted it, so the library now
matches what Crystal renders rather than what Crystal says. If the reset rule is
restored to life, the library inherits it with no change.

## D-25 · Three findings from the surface sweep that are not surface questions

*(Opened 28 September 2026, split from D-23 and D-24 when those were ruled.)*

- **A dialog that scrolls its own surface.** `.cr-dialog` sets `overflow: auto` on the
  surface. Crystal's edge-fade rule is the argument against it — a mask fades an element's
  own fill and border along with its content, so a surface that scrolls dissolves itself —
  and a title that scrolls out of a tall dialog takes its context with it. Crystal React
  scrolls the body inside a surface that does not, and keeps doing so until this is ruled.
- **An overlay inside a pane has no Crystal recipe with a visible boundary.** On the page an
  overlay is `.cr-frost`. Inside a Haze pane it recesses into Haze, and `.cr-haze` has no
  edge and no shadow, so a menu drawn that way over a Haze dialog cannot be told apart from
  the dialog. Crystal React keeps its own recessed Haze there, with an edge and the content
  shadow.
- **The documentation site vendors Crystal 2.0.0**, two releases behind, so Crystal React's
  material-parity gate compares against a Crystal that no longer ships.

## D-26 · The dock surface names controls `.cr-dock` cannot reach, and a grouping it does not draw

*(Opened 28 September 2026, by Crystal React's adoption of the corrected surfaces.)*

D-23 named nine components as the `dock` surface. Two things stop a consumer
wearing `.cr-dock` for all of them as written:

- **The dock's controls are keyed on `button`.** `.cr-dock button`, its selected
  rule `:is([aria-pressed=true],[aria-selected=true])`, its focus rule and its
  forced-colours ring reach only a `<button>`. A tab is commonly
  `[role=tab]` on another element, a segmented control is commonly radio inputs
  inside labels, and a dock or bottom-navigation destination is a link carrying
  `aria-current`. None of them is reached. Crystal React restates the dock-button
  values on those three and compares them with a planted `.cr-dock button` in a
  gate — correct today, and a second copy. Closing it: extend the dock's control
  selector to `[role=tab]`, a label holding a radio (`label:has(input[type=radio])`,
  selected by `:checked`), and `a` (selected by `aria-current`), in a way that
  does not raise the specificity of the existing `button` rules consumers
  already sit against.
- **A button group and a split button are docks whose segments touch.** The
  catalogue asks for "interior corners square against neighbours" and "a hairline
  between the two targets". `.cr-dock` spaces its buttons 4px apart inside 9px of
  padding and rounds each one to a pill, so wearing it would mean overriding the
  class back. Crystal React keeps its own grouped geometry and restates the dock's
  material, now with the rim it lacked. Closing it: a grouped variant of the dock
  — no padding or gap, the children square inside and the pill outside, and a
  hairline in `--cr-edge` between them — or a ruling that a group is a different
  surface.

## D-27 · Two small marks the compact and indicator recipes do not reach

*(Opened 28 September 2026, by Crystal React's per-surface check.)*

- **A count badge is `compact`, and `.cr-resin-haze` is sized for a tag.** Its
  Haze pad is inset by `--cr-haze-inset`, 8px, and its block padding is a tag's
  17px. On a 20px count badge the first leaves a pad a few pixels across with the
  digit mostly outside it, and the second makes the badge 55px tall. Crystal
  React releases both on its badge and fills to the badge's own edge; its gate
  names the inset as the one allowed difference. Closing it: a compact size for
  counts — the inset scaled to the mark, no block padding — or a ruling that a
  count badge is a different surface.
- **The indicator's field glyphs are keyed on `span.cr-field-shell`.** ○ idle,
  ● focused, * required and ! invalid are drawn only when `.cr-indicator` is a
  child of a `span` field shell. A field shell that holds a label, a textarea or
  a row of chips is a block, and a consumer writes it as a `div` — every one in
  Crystal React is — so the glyphs never reach it. Closing it: key those rules on
  `.cr-field-shell` whatever its element, or on a `data-` attribute the field
  sets, without disturbing the `span` form's own padding rule. Crystal React's
  `Indicator` waits on this (its R-25).

## D-28 · Motion the catalogue assigns that no component can play as written

*(Opened 28 September 2026, by Crystal React binding every assignment in 2.2.0.)*

Crystal React now plays the motion the catalogue gives its components, bound to
state and checked in a browser. A few assignments cannot be honoured by any
implementation, because of what the catalogue says rather than what a library
does. Each wants either a narrower assignment or a ruling:

- **`page-in` and `page-out` on navigation** — NavLink, the rail, the dock, the
  bottom bar, the stepper, checkout steps. These recipes mark "a new local view
  after routing is committed"; the navigation does not render that view, the
  product does. The navigation's own motion is `selection`, which it plays. The
  assignment belongs to the view, or to a routing surface the catalogue does not
  have.
- **`busy` on progress and the loader** — "one cycle for an actual pending
  operation". D-19 gave pending work continuous recipes (`activity-turn`,
  `activity-travel`), which these play; a one-shot cycle beside a loop is two
  answers to one question. `activity-turn` on a *linear* progress bar is the same
  question: it plays `activity-travel`.
- **`resin-confluence` on the floating action** — the recipe's own text is "a
  visual study, not an application action".
- **`reaction` on the authored bubble** — the entry's anatomy has no reactions to
  toggle.
- **`slider-step` on the colour area, slider and wheel** — the recipe is for
  "range outputs, steppers and scrubber labels", and these controls have no
  readout; the thumb is the only thing that moves, and its position is the
  value. Either the entries gain an output, or the recipe comes off them.

