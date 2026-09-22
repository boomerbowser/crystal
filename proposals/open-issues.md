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
