# Open issues — Crystal design system

Things noticed during Crystal 2.0 and the React library's implementation that are
not fixed. Each says what is wrong, why it matters, where it is, and what closing
it would take.

**Three entries are left.** D-4's remaining half is waiting on hardware, D-17
is a flake nobody can diagnose until it happens again with the evidence kept,
and D-19 is a gap in the motion chapter that a consumer has already had to work
around.
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

## D-19 · Crystal specifies three continuous activity indicators and publishes no vocabulary for one

*(Opened 23 September 2026, building Crystal React's feedback slice. Filed on the
tracker as [boomerbowser/crystal#1](https://github.com/boomerbowser/crystal/issues/1)
on 24 September 2026, because closing it is a decision rather than a change and
the decision wants somewhere public to be made.)*

**What is missing.** `core/tokens/catalogue/06-feedback.json` puts the motion of
three components on Crystal's side of the line:

- `loader` — "Crystal: Mark, **motion** and reduced-motion fallback", and
  "reduced motion replaces **spin** with a static, still-legible state".
- `skeleton` — "Haze fill with a slow **luminance sweep**"; "Crystal: Fill,
  **sweep**, reduced-motion fallback, resolve transition".
- `progress` — "Crystal: Track, fill, **indeterminate motion** and
  reduced-motion fallback".

`core/docs/motion.md` publishes fifty-four recipes and none of them is any of
those three. Every recipe Crystal has is a **finite, spring-fitted transition**
from one state to another — `busy` is explicitly "one cycle for an actual pending
operation", `attention` is "single finite cue… never flash or loop", and
`skeleton-resolve` describes the moment a skeleton is *replaced*, not the time it
spends waiting. The motion chapter also states outright that "no effects autoplay
or loop".

**Why that is a gap rather than a decision.** The two statements are both
Crystal's and they contradict each other: the catalogue asks three components to
spin, sweep and travel continuously, and the motion chapter says nothing loops
and provides nothing that does. A consumer cannot satisfy both, and the one
reading that is certainly wrong is "the catalogue means a spinner that does not
spin" — a loader with no motion is indistinguishable from a static glyph, which
is the state the catalogue reserves for *reduced motion*.

**What a consumer did about it.** `crystal-react` shipped all three on
23 September 2026. Each continuous indicator takes **one** duration — `--cr-flow`, Crystal's
own published 1200ms — and authors only the *shape* of the movement, which for a
travelling bar and a turning arc is determined by the geometry rather than
chosen. One period across all of them, not one per component: two indicators in
the same library ticking at different rates is the same drift as two renderers
doing it, only closer together. Each is multiplied by `--cr-motion-enabled` and
divided by `--cr-motion-speed` like everything else that moves there, and each
is removed under `prefers-reduced-motion: reduce`, where it becomes the static
legible state the catalogue asks for — and "static" there means *the whole
track*, because a travelling segment frozen two fifths along reports a
measurement nobody took. `Marquee` set this precedent earlier in the same
library, for the same reason.

**Why it should not stay there.** Two renderers that each pick their own spinner
period is exactly the drift `component.chart.stroke` and
`component.progress.ringStroke` were added to prevent, one release ago. The
durations above are a stand-in, not a specification.

**Closing it needs a decision from Meridian first**, because it changes what
Crystal's motion chapter claims: either a small class of **continuous** recipes
(an activity period and its easing, distinct from the fifty-four transitions, and
the sentence about looping qualified to exempt them), or a ruling that these
three components carry no continuous motion at all — in which case the catalogue
entries for `loader`, `skeleton` and `progress` need rewriting, and the three
components in `crystal-react` need their motion removed.
