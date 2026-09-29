# Open issues — Crystal design system

Things noticed during Crystal 2.0 and the React library's implementation that are
not fixed. Each says what is wrong, why it matters, where it is, and what closing
it would take.

**Two entries are left, each ruled on 29 September 2026 and waiting on
something outside this repository** — the questions, the options and the
answers are in [`2026-09-29-rulings.md`](2026-09-29-rulings.md). D-4 waits on
a phone to drive; D-25's last step on GitHub Actions being able to run again,
so the preview's runner baselines can be re-captured. D-17 closed the same day, on the evidence of its hunt.
D-21, D-26, D-27, D-28 and D-29 closed on 29 September 2026, built into 2.3.0;
their records are in [`closed-issues.md`](closed-issues.md).
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

**Ruled 29 September 2026:** a real Android phone over ADB, as a device leg of `verify-scroll`; Meridian supplies the device. See [`2026-09-29-rulings.md`](2026-09-29-rulings.md).

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

## D-25 · Three findings from the surface sweep that are not surface questions

**Ruled 29 September 2026:** the dialog scrolls a `.cr-dialog-body` child; a recessed overlay recipe is authored for overlays inside a pane; the preview moves to the latest published core and is re-baselined. See [`2026-09-29-rulings.md`](2026-09-29-rulings.md).

**Built in 2.3.0:** `.cr-dialog-body` and `.cr-haze.overlay`, both measured in a browser. The third finding is built too, on crystal-preview's `adopt-crystal-2.3.0` branch: the site installs 2.3.0 from the registry, its tests, scroll, interaction and deploy gates pass, and the seven frames 2.3.0 changes are identified and explained in that commit. What remains is re-capturing the runner baselines with the capture workflow — which GitHub refused to start on 29 September because the account's recent payments failed or its spending limit needs raising — then looking at every frame and merging. Crystal React's material gate already compares against the site on 2.3.0.

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

