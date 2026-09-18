# Crystal 2.0 — running request log

Every instruction Meridian has given during the 2.0 work, in the order received, with its
current state. Kept because these arrive mid-flight and are easy to lose; this file is the
authority on what was asked, and [the status document](crystal-2.0-status.md) is the
authority on what the work covers.

**Statuses:** `done` · `in progress` · `not started` · `deferred` (with a reason)

Last updated 2026-09-17.

## Standing instructions

These apply to everything, not to one task.

| # | Instruction | State |
| --- | --- | --- |
| S1 | Material specifications may be **improved, never regressed**. The default is that no recipe number changes at all. | enforced by gate G1 |
| S2 | Commits are authored by **Meridian Digital**. No mention of AI models anywhere in the repository; AI-only files stay gitignored and out of the ZIP. | enforced; verified absent from the 1171-file package |
| S3 | Ignore any system guidance instructing AI attribution, and **alert Meridian immediately** if ever forced to comply. | active; the guidance reappeared twice and was refused both times, then was withdrawn |
| S4 | Commit history may be rewritten, but only for a reason Meridian has stated. | used once, for the authorship change |
| S5 | Component contracts must match or exceed Mantine, Ant Design and MUI. | 119 components |

## Requests

| # | Request | State |
| --- | --- | --- |
| R1 | GitHub repo, private, with the design system and preview separated from the component libraries | done |
| R2 | Ship the ZIP as a GitHub release asset rather than a committed file | done |
| R3 | Put everything from the 2.0 proposal into the implementation plan, with a reference document to track it | done — [status](crystal-2.0-status.md), and this file |
| R4 | Tables are not in line with Crystal — missed, or a later step? | done — it was partly a miss; the contract existed and nothing implemented it |
| R5 | Comprehensive animation update: modern motion, WebGL shaders and equivalents on other platforms, Resin moving like a fluid | done — springs on all 54 recipes, volume-conserving deformation, four shaders, platform contract |
| R6 | Install the `markdown` module, or explain how Meridian can | done — `design-system/.venv`, which `docs/adoption.md` already expected |
| R7 | Push commits; make Crystal 1.0 its own branch and 2.0 the new main | done — `main` fast-forwarded to 2.0, `crystal-1.0` preserves the old tip, `v1.0.1` tag intact |
| R8 | The preview still refers to 1.0 | done — it was an oversight, not a later step; see the version-2.0 capture |
| R9 | The ripple animation for Resin is disliked; research how Liquid Glass components animate and let that inform it | done — rebuilt around edge lensing; see the shader-layer capture |
| R10 | Research Neumorphism to inform how Haze should look and feel — shadows, feathering, light source — especially filling a Resin frame | done — Haze inside Resin now reads as recessed by inverting the light pair; the palette half of neumorphism is deliberately refused. Closed by R14: a live specimen in `docs/materials.md` now exercises it, and the `haze-in-resin` frame gates the recess. |
| R11 | **Resin-on-Resin is prohibited.** A layer above a Resin element, such as a label, must be a Haze content fill. Do not adjust Resin to compensate: that would disturb the material spec. | done — 0 violations across 13 pages, enforced by `tools/audit-materials.mjs` |
| R12 | Keep a running document of these requests | done — this file |
| R13 | Make the launch specification work flawlessly if the preview is deployed to Vercel from the GitHub repo | done — `vercel.json` + `.vercelignore`, verified against a simulated deploy tree |
| R14 | Docs home as the index page; navigation becomes a side menu of Crystal buttons; Playground reformatted to match the docs and linked into them; docs expanded to cover every relevant detail with explanations and examples | done — Section H, tasks 21-24 |

## Defects found while doing R13

Two, both pre-existing and both invisible until measured.

**A committed baseline was a screenshot of a 404.** `frames.json` pointed the `icons` frame
at `icons.html`; the page is `docs/icons.html`. A 404 still fires `load`, so the capture
driver blessed the error page and the visual gate had been guarding it ever since. The driver
now refuses any non-OK response — proven with a deliberate bad path — and the frame has been
recaptured.

**The shader runtime was silently broken on ten pages.** `motion-shaders.js` fetched its
manifest with a page-relative path, which only resolves for pages at the site root; from
`/docs/...` it 404'd. The runtime fails quietly by design, so nothing looked wrong. It now
resolves against its own script URL, which is also what makes the site portable to a preview
URL or a subpath.

## Notes on the open items

**R11** is a material rule, not a styling preference, and it protects the thing Liquid
Glass is most often criticised for: translucent content stacked on translucent content
until nothing is legible. The fix is always to change the *upper* layer to Haze, never to
weaken Resin. Haze exists precisely to be a readable fill inside a translucent frame.

## R15 — the motion report (2026-09-17)

Meridian reported the motion studies page as largely broken and the animations as far too
sparse. Eleven symptoms; they resolve into four causes.

| # | Reported | Cause | Status |
| --- | --- | --- | --- |
| R15a | Animations not playing | `motion-preview.js` dropped by the shell restructure | done — `959dc7d` |
| R15b | Elements spaced too closely | `motion-suite.css` dropped | done — `959dc7d` |
| R15c | Elements not covered by their backgrounds | `motion-suite.css` dropped | done — `959dc7d` |
| R15d | Menus will not open | `motion-suite.js` dropped | done — `959dc7d` |
| R15e | Menus that open are not Frost | Two causes: `motion-suite.css` dropped, and the overlays were genuinely Resin | done — assets restored in `959dc7d`; menu, popover, tooltip and toast moved to Frost, and the audit now checks overlay assignment as well as nesting |
| R15f | Focus ring too thick by half | Halo spread in `--cr-focus-ring` | done — spread halved, blur and the 2px core unchanged |
| R15g | Slider animation choppy | `slider-step` is a hollow recipe | done — real keyframes, and a recipe no longer restarts itself mid-flight |
| R15h | Checkboxes have no check/uncheck animation | `check` exists but is wired to nothing | done — wired to `checked`, and `check-off` added |
| R15i | Few or no transition animations | 52 of 54 recipes are wired to nothing | done — bound to state; `npm run verify:interactions` gates it |
| R15j | No ambient animations for capable platforms | No ambient category exists | done — Ambient is a tenth category, opt-in, degrading to static |
| R15k | Animations far too sparse | 11 of 54 recipes animate nothing | done — all eleven authored; a movement contract now fails the build |

### The two findings behind R15g–R15k

**Eleven of the fifty-four recipes are hollow.** Their keyframes are
`[{"opacity":1},{"opacity":1}]` — a placeholder that shipped: `hover`, `slider-step`,
`field-focus`, `field-valid`, `breadcrumb`, `highlight`, `attention`, `progress-change`,
`busy`, `haze-tide`, `stone-contour`. They occupy a duration and a spring and animate
nothing. This predates Crystal 2.0; it dates from the 1.0 restructure. It is 20% of the
motion system, and it is the direct answer to "far too sparse".

`press` and `field-invalid` look similar to a naive check because they return to their
starting value, but a pulse and a shake are supposed to do that. The correct test is
whether *every* keyframe is identical, not whether the first matches the last.

**Only two recipes are wired to live interaction**, `press` and `hover` — and `hover` is
one of the hollow ones. Everything else plays only from the catalogue's Replay button, so
in ordinary use a checkbox, a switch, a menu or a page transition never animates. The
recipes each carry a `use` field that states what should trigger them; that field is the
wiring instruction and was never acted on.

### Standing decisions taken while fixing this

- Motion is wired to **state, not to clicks** — `check` fires when `checked` changes, so
  keyboard and assistive technology get the same motion as a pointer.
- Ambient motion is a **capability tier, not a default**: declared, opt-in, and degrading
  to static. It never runs on a surface the user is reading, and it is the first thing
  `prefers-reduced-motion` removes.

## R16 — generate what is hand-maintained (2026-09-17)

Meridian asked whether any other parts of the documentation were hand-maintained but would
be better generated. Seven were.

| Was hand-maintained | Now generated from |
| --- | --- |
| `motion-components.md` executable recipe catalog (54 rows) | `tokens/motion-recipes.json` |
| `materials.md` recommended defaults | `semantic.range.*` and `semantic.default.*` |
| `materials.md` material recipe values (new) | resolved values in `tokens/crystal.json` |
| `colors.md` product palettes | `primitive.palette.*` |
| `components.md` focus layer table | `--cr-focus-ring` in `assets/controls.css` |
| `accessibility.md` contrast figures | `validation/token-checks.json` |
| `icons.md` counts, sources and grid | `assets/icons/manifest.json` |

Two were provably drifting already: the recipe catalogue had fallen five recipes behind,
and the focus table had been hand-corrected the same day when the halo spread changed.

**Deliberately not generated:** prose that quotes a value in context. Generating those
inline would wreck the writing. `tools/validate-docs.cjs` protects them from the other
direction instead — every material recipe value, both engine versions, the recipe and
category counts and the contrast total must appear in the chapter that documents them,
so a token that moves without its prose fails `npm test`.

## R17 — light, refraction and materials that move at rest (2026-09-17)

Meridian cited JolyUI's Liquid Metal button as an illustration of "more motion" and
restated the optical rules it implies. Section I, tasks 25-27, gate G8.

| # | Requested | Status |
| --- | --- | --- |
| R17a | Resin and Frost refract light *and colour* in their animations, in different amounts and ways | done — Frost samples per channel for a broad warm-to-cool wander; Resin keeps its sharp rim dispersion. Both run at rest, capped at six contexts |
| R17b | Plastic carries the base glow of its primary plus the active scheme's tint | done — `--cr-atmosphere-glow`, drifting over 38s |
| R17c | Refraction affects the shadow the surface casts | done — the palette companion mixes into the shadow ink, colour only, alpha preserved |
| R17d | Haze and Stone have edges that move on their own, outward and inward rather than around the perimeter | done — boundary travel on the isolated paint layer |

**The reference is behaviour, not appearance.** Liquid Metal's sweeping bands are
anisotropic reflection — a metal phenomenon. Crystal is glass, its optical model is edge
lensing, and surface waves are already recorded as rejected. What transfers is that the
surface is alive at rest, that light through it is chromatic, and that interaction adds
energy rather than starting the effect.

**This authorises a specification change.** "Edges that move on their own" means at rest by
default, which contradicts `CONTRACT.md` §7 "never at rest" and "nothing autoplays". Those
are rewritten rather than excepted, and reference frames seed ambient off — a moving surface
cannot be captured deterministically.

**It also corrects yesterday's work.** `haze-settle`, `haze-tide` and `stone-contour` were
authored as opacity oscillations. Opacity pulsing is not an edge that moves; they are
rewritten as radial boundary motion.

## R18 — the selection rail must go (2026-09-17)

Meridian: "just like the underlines had to go, this side bar thing needs to go. I
understand the accessibility standard it's trying to account for, but this just isn't in
line with Crystal, is offsetting the label text, and must go."

This changes a standing Crystal invariant — "selection uses a leading rail plus label
weight" — so it is recorded as a specification change rather than a styling tweak. The
owner is authorising it.

The rail exists to satisfy WCAG 1.4.1: selection must not be carried by colour alone.
Removing it does not remove that obligation, so the replacement has to carry a non-colour
signal. **Label weight** already does — it is typographic, not chromatic, and survives
palette changes, dark mode and colour vision differences. The rail was a second
non-colour signal on top of a sufficient one, and it was costing label alignment to be
there.

Status: done — both rails removed, tokens deprecated in place, six chapters updated.

## R19 — the Resin rest state is embossing every control (2026-09-17)

Meridian: "Idk if its just a temporary bug, but we're seeing what appears to be another
resin-on-resin issue where the neumorphic effects that apply exclusively to Haze and Stone
are applied directly to Resin instead, making highly unpleasant embossing and indenting
effects. It also seems to be causing a fill leak in some places. Please fix this to the
best of your ability and include it in your current update, then ensure this does not
happen again."

**The diagnosis is not the one in the report, and both named causes were ruled out by
measurement before anything was changed.** The Haze-in-Resin recess rule matches exactly
one element on the entire site. Removing `.cr-stone` from the specimen left the emboss
completely untouched. Blocking `motion-shaders.js` removed it entirely.

It was R17's own work. The ambient shader shipped in `021e0a0` attached with
`progress: 1` — the peak of a press, not a rest state — so `edgeLens` painted a
full-strength lens band a fifth of the panel deep, with its own dark inner shade,
permanently, on every Resin surface; anything laid over it showed the band through, which
is the "fill leak". `intensity: 2.2` had been calibrated against Frost's alpha ceiling and
drove Resin's `hard-light` layer straight to its 0.72 clamp. Underneath it, panel geometry
was measured in 0..1 uv, so on a 216x113 control the band was twice as deep along the top
edge as along the side and its contour could not follow the element it was lighting.

**Meridian's instinct was right even though the attribution was not.** What they were
looking at genuinely is a recess treatment — an inset dark edge with a returning highlight
— appearing on a material that should never carry one. It simply came from the optical
layer rather than from the recess rule.

**Why it shipped.** Three gates were green: `verify:visual` sets `data-ambient=off` on
every frame, so no reference frame had ever contained an ambient surface; the material
specimens sit below the fold of every 1280x900 frame; and `validate-motion` checks that
recipes move, which a shader is not. The earlier claim in this log that gate G8 ran "with
ambient live" was wrong — the capture path has always forced it off.

**No material specification changed.** The press response at `progress: 1` is identical:
the new thickness term resolves to the original 0.20 there, and the geometry correction
only makes radius and band depth mean the same thing on both axes.

**"Ensure this does not happen again"** is answered twice, because one answer would have
been a number nobody looks at and the other a picture nobody measures:

- `npm run audit:ambient` differences each ambient surface against a still capture of
  itself and bounds interior mean, rim mean, and a **floor** under rim max — the opposite
  failure is just as real, and a first attempt at this fix measured 2 and was invisible.
  Every bound has been shown to fail on demand.
- Reference frames may now pin `data-ambient-clock` and clip to a specimen. Two do.
  Reintroducing the regression changes 4474 pixels in `materials-at-rest`, where
  previously all eighteen frames stayed identical.

Status: done — see `validation/captures/2026-09-17-resin-rest-regression/`.

**It also closes R17d, which was still open in fact if not on paper.** `haze-settle` was
an ambient recipe that nothing ever started, and Stone had no ambient recipe at all —
only `stone-contour`, an explicit replay study. `CrystalMotion.ambientAll()` now starts
both as surfaces come into view, and `stone-settle` is a new recipe (60 total). Haze
breathes outward and Stone draws inward, so a label backing and the fill around it never
pulse in unison.

## R20 — the animations are choppy (2026-09-18)

Meridian: "we need the animations to be smoother and take full advantage of React. In
the preview site, although beautiful, they're extremely choppy."

**Measured, with a caveat that matters.** Headless Chromium has no real display or
compositor, so these absolute numbers are not what a person on real hardware sees. The
*ordering* reproduced across repeated fresh-browser runs and is the useful part. Idle
page, no interaction, percentage of frames arriving later than 24ms:

| condition | median | late frames |
| --- | --- | --- |
| ambient on, as shipped | 30fps | 63.5% |
| canvases with `mix-blend-mode: normal` | 30fps | 56% |
| canvases `display:none`, still drawing | 60fps | 43% |
| ambient stopped, canvases removed | 60fps | 29% |

Two findings.

**The signature is judder, not a low frame rate.** The first measurement said "30fps
median" and that was contaminated by browser warm-up across reused contexts. With a fresh
browser and a settling period, the median is 60fps and *46% of frames are late* — an
irregular alternation of fast and slow frames, which feels considerably worse than a
steady 30. Median frame rate was the wrong metric and nearly sent this to the wrong cause.

**The cost is compositing, not drawing.** Hiding the canvases while leaving them drawing
restores 60fps; removing blend mode helps a little; stopping the draw entirely accounts
for the rest. Several full-size canvas layers, blended, stacked over `backdrop-filter`
surfaces, are expensive to composite every frame regardless of how cheap the GL is.

**Two speculative fixes were tried and reverted**, because both were measured and neither
worked: a 24fps wall-clock budget changed nothing, and an every-second-frame cadence made
it *worse* (53% late), most likely because a draw pattern that does not divide the
refresh rate is itself a source of irregularity. Nothing was shipped on a hunch.

Also noted while looking: the optical layers animate `boxShadow` (18), `borderRadius`
(19), `backgroundPosition` (9) and `backgroundImage` (6). None of those can be
composited — each forces a repaint every frame — and they contradict the keyframe
vocabulary the motion chapter claims. That is a second, independent cause and it is the
one that matters most for the React library, which must not inherit it.

**Not yet fixed.** The direction is: express every animated effect in `transform` and
`opacity` only, with shadow and rim changes done as opacity cross-fades between
pre-rendered layers rather than as animated `box-shadow`; and reconsider whether ambient
Resin and Frost should hold a live canvas per surface at all, versus a single shared
canvas or a CSS-only rest state. That is a material-specification question, not a
performance tweak, so it is recorded here rather than guessed at.

Baseline note: even with ambient fully off, 29% of idle frames are late in this
environment, so part of what is being measured is the harness. Confirmation on real
hardware is wanted before committing to a fix — the quickest check is whether the preview
feels smooth with `data-ambient="off"` set on `<html>`.

## R21 — Haze and Stone trace their edge; ambient must survive (2026-09-18)

Two instructions, one day apart, on the same subject.

**On performance.** Meridian confirmed the preview is smooth with ambient off, and
that ambient "really important to us (and something we anticipated would need to be
rebuilt per-platform)". The direction: preserve the effect, fix the choppiness,
**do not alter the material spec to do it** — make a Crystal React copy that can be
adjusted instead. Third-party libraries are permitted where they help, provided
they need no paid licence.

**On the material spec.** "The ambient animations for Stone and Haze seem to be
following the 'inward-outward' model we established for Resin (the fluctuating
movements of liquid), whilst we were specific in stating that edge effects for
Stone and Haze should trace around the edges like the Liquid Metal Button example."

**The record contradicts this, and is noted once rather than argued.** R17 above
carries Meridian's own words: "the animations should move from outwards to inwards
(and the other way around) **instead of** tracing around the edges". That is what
was built, and it is what they are now correcting. The current instruction governs.
Both are left in the log so a later reader is not misled by either.

The distinction is worth keeping for its own sake: a lens breathing is Resin,
because Resin is a lens. Haze and Stone *are* their feathered edge, so their rest
state is light travelling **along** it. One gesture shared by three materials
erased the difference the hierarchy exists to make.

Status: the trace is done — see `validation/captures/2026-09-18-tracing-edge/`.
Haze and Stone moved off the Web Animations tier onto CSS, which also took idle
frame lateness from 17–29% to 0% with the optical layer disabled, because the old
implementation re-rasterised a blurred layer every frame.

**The optical tier's cost is still unexplained.** On the preview, Resin and Frost
canvases hold the page at 30fps; removing them restores 60. That survives every
variable tested: canvas resolution (quarter-res still 30fps), blend mode, nested
backdrop-filters, the Plastic glow, and shader complexity. A standalone benchmark
running Crystal's *real* `resin-refraction.frag` on six canvases over nested
backdrop-filtered surfaces measures 60fps and 0% late — the cost does not
reproduce outside the preview, so it is an interaction with something structural
in that page that has not been isolated. `bench/ambient.html` in the Crystal React
repository is the harness.

The next move is Crystal React's own ambient implementation: **one shared canvas**
for all optical surfaces instead of one per surface, drawn in a single pass and
living outside every element's filter chain. That collapses N composited layers to
one, removes the six-context cap entirely, and cannot inherit whatever the preview
is doing. It is the "copy that can be adjusted" Meridian asked for, and if it
proves out it is a candidate to come back to the web preview.
