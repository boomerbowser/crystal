# Resin at rest: a lens pinned open

Meridian reported "another resin-on-resin issue where the neumorphic effects that
apply exclusively to Haze and Stone are applied directly to Resin", with an
embossed indent inside every Resin control and a fill leak on the Haze card.

It was neither Resin-on-Resin nor the Haze recess rule. Both were ruled out by
measurement before anything was changed: the recess selector matches exactly one
element on the whole site, and removing `.cr-stone` from the specimen left the
emboss untouched. Blocking `motion-shaders.js` removed it completely.

The cause is the ambient Resin shader added in 021e0a0. It was attached with
`progress: 1` — not a rest state but the peak of a press — so `edgeLens` painted
a full-strength band a fifth of the panel deep, with its own `rim * 0.13` dark
inner shade, permanently, on every Resin surface. `intensity: 2.2` had been
calibrated against Frost's alpha ceiling and drove Resin's `hard-light` layer
straight to its 0.72 clamp. A second fault compounded it: panel geometry was
measured in 0..1 uv, so on a 216x113 control the lens band was twice as deep
along the top edge as along the side and its contour could not follow the element.

## Why three gates were green

- `verify:visual` sets `data-ambient=off` on every frame, so no reference frame
  had ever contained an ambient surface.
- The material specimens sit far below the fold of every 1280x900 frame.
- `validate-motion` checks that recipes move. A shader is not a recipe.

## New frames

Both photograph the rest state with `data-ambient-clock` pinned at 6.5s, and both
clip to a specimen rather than the viewport.

| Frame | What it guards |
| --- | --- |
| `materials-at-rest` | Plastic, Frost and Resin side by side, each holding a Stone label. The regression is unmissable here: the Resin card's label became a glowing magenta well inside a multi-ring emboss while its two neighbours stayed clean. |
| `resin-dock-at-rest` | Resin and Frost in one composition with a Stone label inside the Resin frame. Guards that an optical rest layer stays at the rim and never reaches the surface a label is read on. |

## Measured, not judged by eye

`npm run audit:ambient` differences each surface against a still capture of
itself. Worst-channel delta:

| | rim mean | rim max | interior mean |
| --- | --- | --- | --- |
| as shipped in 021e0a0 | 48.73 | 81 | 9.35 |
| Resin at rest, now | 1.90 | 34 | 0.02 |
| Frost at rest, now | 1.51 | 26 | 0.80 |

Limits are interior mean 2.0, rim mean 8.0, rim max floor 6. Each has been shown
to fail on demand: reintroducing `progress: 1` trips the rim mean at 11–23, and a
first attempt at the fix that measured rim max 2 was invisible to a person and
trips the floor. The floor exists because the opposite failure is just as real.

Nothing about the material specification changed. The press response at
`progress: 1` is identical: the new `thickness` term resolves to the original
0.20 there, and the geometry correction only makes radius and band depth mean the
same thing on both axes.
