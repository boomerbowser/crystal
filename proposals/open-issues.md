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
