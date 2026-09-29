# Open issues — Crystal design system

Things noticed during Crystal 2.0 and the React library's implementation that are
not fixed. Each says what is wrong, why it matters, where it is, and what closing
it would take.

**No entries are open.** Every decision left on 29 September 2026 was put to
Meridian and ruled on ([`2026-09-29-rulings.md`](2026-09-29-rulings.md)), and
every ruling is built: D-4 closed on a Pixel 6 Pro, D-17 on the evidence of its
hunt, D-25 with the preview on 2.3.0.
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

