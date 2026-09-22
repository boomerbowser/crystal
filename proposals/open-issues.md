# Open issues — Crystal design system

Things noticed during Crystal 2.0 and the React library's implementation that are
not fixed. Each says what is wrong, why it matters, where it is, and what closing
it would take.

**One entry is left, and it is waiting on hardware.** D-4's remaining half needs
a real phone: what a person's thumb meets on a device Playwright cannot emulate
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
