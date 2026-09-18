# Haze and Stone trace their edge

Meridian: "the ambient animations for Stone and Haze seem to be following the
'inward-outward' model we established for Resin (the fluctuating movements of
liquid), whilst we were specific in stating that edge effects for Stone and Haze
should trace around the edges like the Liquid Metal Button example."

**A note on the record, once.** R17 in the request log says the opposite in
Meridian's own words — "the animations should move from outwards to inwards (and
the other way around) **instead of** tracing around the edges" — and that is what
was built. The current instruction governs and is what is implemented; the log
now carries both so the next reader is not misled by either.

The distinction matters and is worth stating plainly: a lens breathing is Resin,
because Resin is a lens. Haze and Stone *are* their feathered edge, so their rest
state is light moving **along** that edge. Giving all three materials the same
gesture erased the difference the hierarchy exists to make.

## What changed

A conic gradient rotated about the surface centre, masked to a ring with
`mask-composite: exclude` so only the rim is lit and the surface being read is
never painted. Four new tokens, all generated: `material.trace.width` (1.5px),
`motion.duration.trace` (5200ms) and `motion.duration.traceStone` (7000ms), plus
`--cr-trace-light` resolved from the palette's own companion, so the trace is the
scheme's light rather than a second accent.

Stone traces slower and dimmer than Haze: a label backing is smaller and sits
closer to text, and the same speed there reads as agitation.

## Two contracts had to give, and both were narrowed rather than waived

- **The 2000ms ambient ceiling.** Crystal's 5000ms limit protects
  responsiveness — nobody may be stranded inside a transition — and an ambient
  loop is not a transition anybody waits for. Two seconds is right for a gesture
  that repeats in place; it is wrong for one that travels a full perimeter, which
  at that speed reads as a spinner. A recipe that declares itself travelling
  (`loop` with `direction: normal`) gets 8000ms. Everything else keeps 2000ms.
- **The spring contract.** Light circling a perimeter at constant speed has no
  displacement returning to rest, so a fitted spring would be a fiction. A
  travelling recipe carries no spring and must declare `easing: linear`.

The first attempt at that exemption used `continue`, which skipped **every**
remaining check for those two recipes — duration, engine, keyframe count, travel
limits. The recipe count fell from 60 to 58 and that is the only reason it was
noticed. The exemption is now scoped to the spring assertions alone.

## Haze and Stone left the Web Animations tier

Their rest state is CSS now, like Plastic's glow. This is not only a spec matter:
the previous implementation animated `transform` on a `::before` carrying
`filter: blur(1.95px)` and a box-shadow, which re-rasterises a blurred layer every
frame. Idle frame lateness with the optical layer disabled went from 17–29% to
**0%** after the change.

`CrystalMotion.ambientAll()` remains as an opt-in API for a product driving its
own surfaces; it no longer auto-wires anything.

## The capture hook now reaches CSS

`data-ambient-clock` froze only the optical layer, so a gate could pin half the
ambient state and photograph the other half at an arbitrary phase. A paused
animation with a negative `animation-delay` seeks to a chosen time, which is the
CSS equivalent of setting `currentTime`. The harness sets `--cr-ambient-clock`
alongside the attribute. Before this, `audit-ambient` measured the Haze trace as
travelling 2 — indistinguishable from not moving.

## Measured

| surface | rim max | rim mean | interior mean | travel |
| --- | --- | --- | --- | --- |
| Resin control plane | 34 | 1.90 | 0.60 | 11 |
| Resin floating dock | 27 | 2.24 | 1.26 | 13 |
| Resin stage dock | 25 | 1.49 | 0.00 | 7 |
| Frost study pane | 26 | 1.51 | 0.80 | 22 |
| Haze content fill | 134 | 0.49 | 0.00 | 134 |
| Stone label backing | 133 | 2.82 | 0.00 | 131 |

High max with a low mean is the correct signature for a trace: concentrated
light, not a wash. Interior mean 0.00 on both is the evidence that what moves is
the edge and not the fill — the rule Haze and Stone exist to keep.

## Frames

Six re-blessed, all looked at.

- `materials-at-rest`, `resin-dock-at-rest` — the trace itself, at the pinned clock.
- `playground-light`, `playground-dark`, `playground-narrow`, `playground-rtl` —
  58 pixels each at a worst delta of 27, on one line of small text inside a Frost
  panel. Sub-pixel antialiasing, deterministic run-to-run (two captures of the
  same build are byte-identical), and the text is crisp in both. Blessed after
  looking at the region, not on the strength of the number being small.

`display:none` rather than `opacity:0` when ambient is off: a transparent layer
still composites, and it shifted antialiasing across every Haze surface in frames
where the trace is not supposed to exist at all.
