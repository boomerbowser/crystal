# Open issues: Prismata design system

Things noticed during Prismata 2.0 and the React library's implementation that are
not fixed. Each entry says what is wrong, why it matters, where it is, and what
closing it would take.

<!-- rulings-summary -->
**No entry is open.** Every decision from the media, text and recipe work of 2 October
2026 ([`2026-10-02-media-text-and-recipe-parity.md`](2026-10-02-media-text-and-recipe-parity.md))
and every decision left on 29 September 2026 ([`2026-09-29-rulings.md`](2026-09-29-rulings.md))
was ruled on and is built.
<!-- /rulings-summary -->

## Closed most recently

| Closed | Entries | How |
|---|---|---|
| 16 November 2026 | D-37 | Built from Meridian's ruling (a): the travelling selection pill, in core 2.6.0 (C-M3), Prismata React (R-A8) and the preview. |
| 7 November 2026 | D-40, D-41, D-42 | D-40 fixed in the editor recipe (C-S7); D-41 built from Meridian's ruling (b), one body leading of 1.6 (C-S8); D-42, a caption under a wrapped transport, opened and fixed the same day. |
| 3 October 2026 | D-39 | By Meridian's ruling (a): a selected highlight takes the action pair. |
| 2 October 2026 | D-36 | Measured, fixed, and found two more surfaces than the static report. |
| 2 October 2026 | D-30, D-31, D-32, D-33, D-34, D-35 | Built from Meridian's rulings of the same day. D-39 opened from D-34's measurements. |
| 2 October 2026 | D-38 | Opened and closed the same day: `prismata.css` writes the WebKit alias first, so a consumer's minifier keeps the unprefixed property. |
| 29 September 2026 | D-4 | On a Pixel 6 Pro. |
| 29 September 2026 | D-17 | On the evidence of its hunt. |
| 29 September 2026 | D-25 | With the preview on 2.3.0. |
| 29 September 2026 | D-21, D-26, D-27, D-28, D-29 | Built into 2.3.0. |
| 28 September 2026 | D-22, D-23, D-24 | Each by Meridian's ruling: the navigation entry draws its location dot, the catalogue's surfaces match what renders, and the field shell is adopted as written. |
| 28 September 2026 | D-19 | Meridian adopted three continuous recipes for work that is genuinely pending, and the motion chapter now says a loop by any other name is refused. |
| 24 September 2026 | D-20 | Meridian chose 48px, the value Prismata has always rendered, so the token moved up to meet the stylesheet. |
| 23 September 2026 | D-18 | Its premise was wrong. |

## Closed on 21 and 22 September 2026

- **D-11**, the three divergences between the library and the preview. Meridian
  decided all three: the library adopts, and the preview does not drop.
- **D-13**, the visual gate red on nine frames with nobody running it. Every
  frame was looked at and decided, and the gate was put in CI.
- **D-15**, the half of D-13's remedy that failed the same day: the baselines
  were machine-specific, so the gate could not run on a runner. Closed by
  capturing the baselines on the runner, which is where they are compared.
- **M-3**, **D-5** and **D-16**, and the half of **D-4** that was traced to a
  Playwright flag and not to browsers.
