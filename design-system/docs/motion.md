# Motion: material in movement

Crystal’s motion makes its materials recognizable: Plastic levitates, Frost emerges toward the viewer, Resin flows and catches light, Haze and Stone carry moving feathered edges, and Mirage washes across the scene. [Open the interactive motion studies](../motion.html).

## Timing and easing

The earlier 25% speed reduction is retained for small interaction tokens. The larger material journeys have their own longer timings so bounded travel and layered detail have time to resolve smoothly. The preview’s **1×** setting uses the defaults below.

| Token | Default | Use |
|---|---|---|
| `--cr-press` | 120ms | Small button press feedback |
| `--cr-state` | 213.33ms | Simple state transitions |
| `--cr-spatial` | 293.33ms | Compact product transitions |
| `--cr-exit` | 160ms | Compact departures |
| `--cr-material` | 1000ms | Plastic, Frost, Haze and Stone choreography |
| `--cr-liquid` | 1400ms | Resin deformation and traveling light |
| `--cr-flow` | 1200ms | Mirage arrival, including dialog backdrop |
| `--cr-departure` | 650ms | Modal dismissal and Mirage withdrawal |
| `--cr-ease-enter` | `cubic-bezier(0.22, 0.65, 0.22, 1)` | Progressive arrival, soft settling |
| `--cr-ease-settle` | `cubic-bezier(0.2, 0, 0.2, 1)` | Small control response |
| `--cr-ease-exit` | `cubic-bezier(0.4, 0, 0.6, 1)` | Smooth acceleration and departure |

Ordinary travel stays within **5–30px**, with **50px as the compact-motion guideline**, not a universal ceiling. Larger or longer spatial transitions may exceed it when the movement requires it: full-width sheets, view changes, measured reordering, gallery turns and large material compositions. Each authored exception records its purpose in `travelException`; do not apply large composition motion to a small button.

Haze and Stone retain **zero component translation** for their material signatures: their feathered paint shifts and changes contour while text stays fixed. Optical light can travel across an entire surface without moving its content. Small controls use liquid compression and surface tension rather than a generic upward lift.

The legacy `maxTravel: 50` token continues to bound the six compact material presets. Larger recipes explicitly define their travel and bypass that compact clamp. `layout()` uses the actual measured displacement up to the viewport diagonal, with `{extended:false}` available for a compact crossfade. Motion still respects the user speed factor, five-second duration ceiling, cancellation and reduced motion.

## Material signatures

| Material | Movement | Light and perimeter | Preview use |
|---|---|---|---|
| Plastic | Starts 24px below its resting position and smoothly rises to rest | A widening shadow reinforces the upward lift; foundation stays opaque once present | Replay study; never animate a whole app foundation for ordinary focus changes |
| Frost | Emerges from its resting plane to +50px toward the viewer, then settles back; no lateral shift or perspective tilt | Shadow expands at the nearest point; grain and diffusion remain constant | Replay study and scene entrance |
| Resin | 30px arrival, vertical stretch into horizontal compression, then a small damped settling motion | A highlight travels across the body; illuminated rim changes direction and contour | Resin specimen; reserve stronger deformation for compact controls, not dense reading content |
| Haze | Fixed component and label; movement stays within the surface | Background-only feathered contour drifts up to 6px and changes shape, then returns to the exact resting recipe | Reading surface study and Haze dialog entrance |
| Stone | Fixed component and label; movement stays within the surface | Feathered background ripples around its fixed center; label retains its own crisp paint | Label backing study; ordinary button presses still use the short press token |
| Mirage | Curved reveal spreads from left, right, top or bottom; withdrawal contracts toward an edge | Actual underlying colors continue to blend through its chromatic blur; no fabricated wallpaper or hue sweep | Entrance and exit specimens, native dialog backdrop |

Resin light is a temporary optical overlay, not a change to the 20% fill recipe. Haze and Stone start and end at rest; neither slides in, scales its content nor changes label opacity during replay. Their feathered backgrounds make one quiet outward-and-return cycle. They move the already feathered `::before` layer; their blur radius stays at 1.95px and their resting opacity stays unchanged. Foreground labels are not blurred. Component transforms move their children together; Resin’s small scale/skew deformation also affects its compact label. Avoid applying that preset to long-form text.

Mirage uses an expanding elliptical mask with a broad feathered front rather than physically simulated fluid. Registered CSS properties animate the reveal radius; engines without registration support use a curved clip-path fallback. The native dialog’s entrance begins at the chosen edge and its exit contracts toward the opposite edge. **Cycle directions** advances left → bottom → right → top; explicit direction choices make a study repeatable. Its fixed 28px chromatic filter continues to sample the real scene beneath the reveal.

## Working examples

Each Replay button runs a finite animation. **Replay Mirage exit** withdraws and hides the specimen; **Replay Mirage** brings it back. Animation speed ranges from 0.25× to 2× and applies to specimens, scene transitions, button feedback and modal/backdrop timings. It is saved as `motionSpeed` alongside appearance and included in CSS/JSON exports. Labels show the resolved duration. Each resolved duration is `min(5000ms, baseDuration / motionSpeed)`; reduced motion resolves it to zero. Default sequences should stay within 0–2 seconds. Five seconds is a hard ceiling, including any extra API replay-rate adjustment. At 0.25×, Resin would take 5.6 seconds and is capped at 5 seconds; other effects retain their own scaled timings. Interactions, data and focus respond immediately even during a long visual transition. Appearance and reduced-motion preferences are shared with the main playground. No effects autoplay or loop.

The native modal opens with Haze’s in-place edge motion, matching its content material, while Mirage reveals the backdrop. Its content stays fixed on entrance; dismissal fades it in place while its edge settles. Focus and modality take effect immediately. The 650ms default exit (scaled by the speed preference, capped at five seconds) finishes before the dialog closes and focus returns. Escape uses that same path; repeated dismissal requests do not stack.

## Interruption, accessibility and rendering

New playback cancels the previous animation group on that element, including paint-layer effects. Explicit reduced motion, OS reduced motion and document hiding cancel active JavaScript animations. Reduced motion presents states immediately without spatial travel, deformation, moving highlights, feather movement or backdrop reveals. It always takes precedence over the speed slider. Native CSS backdrop animations also honor reduced motion.

Reduced transparency and forced colors omit decorative light, shadow choreography and feather-layer movement. They retain their stable material fallback; motion preferences separately govern component movement. Keyboard focus remains immediate and visible. Disabled controls have no press movement, and hover lift is limited to fine pointers that support hover.

Animations never postpone routing or data availability. Changes in opacity are supplemental: they must never be the sole indication of an essential state. Full-page Mirage clipping can reveal an unobscured portion of the background during transition, but the dialog retains native modality throughout.

Transforms and opacity are the primary motion channels. Small specimen rim/shadow/background-position effects and directional masks/clip paths can require repainting; they are not guaranteed to run solely on the compositor. Backdrop blur, grain, saturation and feather radii remain constant. Benchmark actual devices before using many simultaneous effects, especially full-screen Mirage. Do not add permanent `will-change` hints. Screen-reader, zoom, native-renderer and cross-engine verification remain product adoption requirements.

## Adoption

Load the generated theme, `assets/crystal.css`, then `assets/motion.css`. Load `assets/vendor/crystal-engines.js`, `assets/motion-catalog.js`, then `assets/motion.js` before application code for the framework-independent browser adapter.

```js
// The application owns visibility, routing and focus.
const result = await CrystalMotion.play(panel, 'frost');
await CrystalMotion.play(scrim, 'mirage', { direction: 'left', rate: 1 });
// result.status: finished, cancelled, or instant.
CrystalMotion.stop(panel);
CrystalMotion.stopAll();
// Before showModal(), choose the CSS backdrop's direction:
CrystalMotion.direction(dialog, 'bottom');
```

Presets: `plastic`, `frost`, `resin`, `haze`, `stone`, `mirage`, `mirage-out`, `dismiss`. The optional `direction` accepts `left`, `right`, `top`, `bottom`; omission or `cycle` chooses the next direction. The adapter does not hide or remove targets; callers own exit completion. The playground implements the specimen’s hidden state explicitly.

GSAP controls paint-layer motion through Web Animations pseudo-element targeting on `::before` and `::after`. Engines without that support retain supported component movement and may omit the optional optical effects. Haze and Stone stay still in that fallback rather than substituting a sliding animation. Invalid targets or unknown presets produce errors; unavailable animation APIs return `instant`. Material selectors must supply the actual pseudo-element paints. Use Haze motion for Haze dialogs rather than reusing Resin’s deforming rim on them.

The canonical motion definitions live in `tokens/crystal.json`; CSS and JSON exports include both compact and expressive durations and travel values. Always include `motion.css` for native dialog backdrop choreography and accessibility overrides. The reference provides real visual behavior, not a native compositor or a physics simulation.


## Installed animation engines

Both engines are now installed, bundled locally and used by the runtime. [Motion’s animate API](https://motion.dev/docs/animate) drives element keyframes. [GSAP timelines](https://gsap.com/docs/v3/GSAP/Timeline/) control material paint-layer clocks and selected component sequences. Native Web Animations effects paint actual pseudo-elements under those GSAP clocks; CSS supplies the native dialog backdrop fallback.

See the [component motion suite](motion-components.html) for all 59 recipes, engine assignments, API contracts, live component behavior, test instructions and future component-library/Storybook coverage. [License notices](../reference/ASSET-NOTICES.md) accompany the local bundle.

The compact CSS timing tokens remain available for small state changes. The material-driven Resin press recipe uses 320ms for a complete compression/recovery sequence; hover light uses 700ms. These visual clocks never delay the actual action. The executable catalog lists the current duration of every recipe.

## Springs are the portable primitive

Every recipe carries a spring — `{stiffness, damping, mass}` — fitted so that its derived
settle time matches the authored duration within 15%. The authored duration remains the
authority; the spring is what makes the recipe portable, because a duration and a cubic
bezier do not survive being moved to SwiftUI or Compose, and a spring does.

`assets/core/spring.js` derives everything else from those three numbers, with no DOM and
no dependencies: damping ratio, sampled displacement, settle time, whether the recipe
overshoots and by how much. The generated table below is computed from it at build time,
which is why the numbers there cannot go stale.

### The three regimes

The damping ratio **ζ = c / (2√(km))** decides which closed form applies, and they are
genuinely different equations rather than one equation with a parameter:

| ζ | Regime | Behaviour |
| --- | --- | --- |
| ζ < 1 | Underdamped | Overshoots and oscillates back. Damped frequency ωd = ω√(1−ζ²). |
| ζ = 1 | Critically damped | The fastest approach with no overshoot. ωd is exactly zero, so the oscillatory form degenerates and a separate solution is required. |
| ζ > 1 | Overdamped | Approaches without ever crossing the target, more slowly than critical. |

Implementations that interpolate through ζ = 1 with the underdamped formula divide by a
damped frequency of zero. `sampleSpring` branches on the regime explicitly.

### Damping is chosen by signature, not by taste

Whether a movement overshoots is a claim about what the material *is*:

- **`inertia`** and **`coalesce`** overshoot, most of all — momentum is their entire claim.
  Mass that stops dead was never moving.
- **`feather`** and **`caustic`** do not overshoot. A soft edge that bounces is wrong: the
  signature is diffusion, and diffusion has no momentum to carry.
- Everything between is scaled accordingly.

The generated table shows measured peak overshoot per recipe. `feather` comes out at 0.1%
and `inertia` at 12.6% — the fitting produces the policy rather than being asserted
alongside it.

## Deformation is incompressible

Any `scale(sx, sy)` in a recipe must satisfy **sx · sy = 1** within 0.005. A surface that
squashes without spreading is a surface losing volume, and it reads as cheap because
nothing physical behaves that way.

Corrections divide **both** axes by the square root of the area. Keeping the dominant axis
and deriving the other also conserves volume, but it changes the deformation's aspect
ratio — which alters the designed look rather than only the physics. Normalising by √area
conserves volume *and* preserves aspect ratio exactly, so the correction removes the
compressibility error and nothing else. `tools/validate-motion.cjs` asserts both.

## Why Resin is not animated with ripples

An early model animated Resin as a surface wave — a ripple spreading from the contact
point. It was rejected, and the reasoning is recorded here because the rejected model is
the one people reach for first.

A ripple is a *surface* phenomenon: it says the material has a skin, that the skin was
disturbed, and that the disturbance is travelling across it. That is water in a dish. Resin
is not a skin; it is a solid, transparent body with optical depth. Its response to contact
is not a wave — it is a change in how it bends light.

What contemporary glass interfaces actually do, and what Crystal now does:

- **Edge lensing.** Refraction concentrates in a band just inside the boundary and falls
  off steeply, leaving the centre optically clear. The interior is shrunk and the edges
  stretched outward.
- **Specular tracking.** The highlight band moves with the interaction rather than
  spreading from it. Contact changes where the light is, not what the surface shape is.
- **Morphing.** The boundary itself changes shape. The lens follows the boundary, because
  the lens *is* the boundary.

The practical difference: a ripple animates the middle of a surface, where the user is
reading. Edge lensing animates the rim, where nothing is. The optical model is stated in
`assets/shaders/manifest.json` under `opticalModel`, including the rejected approach, so
that a platform port inherits the reasoning and not just the result.

## The shader layer is an enhancement, never a requirement

WebGL2 shaders are attached only when WebGL2 is available, `prefers-reduced-motion` is not
set, and the surface is visible. The CSS approximation is the floor, and it is what the
committed visual baselines are captured against — with WebGL2 unavailable, every page must
render exactly those baselines. That is the gate that keeps the shader optional rather
than load-bearing.

Two implementation notes that cost real time to find:

**Blend mode.** `screen` and `overlay` are both no-ops on a white backdrop — `overlay`
resolves to `1 − 2(1−b)(1−s)`, which is 1 whenever b = 1. Only `hard-light` produces
visible output on both white and dark backdrops.

**Stacking.** The shader canvas sits at `z-index:-1` inside an `isolation:isolate`
container, so it paints behind the content rather than over it. Verified by proving label
glyphs are pixel-identical with the shader on and off.


## Ambient motion

Ambient motion is what a surface does at rest — the specular band drifting along a Resin
rim, a Haze fill breathing around its 80% value. It is the tenth category and the newest,
and it is governed by three rules that are not negotiable.

**It is a rest state, not a decision.** Every ambient material starts its own motion as it
comes into view. Resin and Frost do it on the optical layer, through `CrystalShaders`; Haze
and Stone do it on the Web Animations tier, through `CrystalMotion.ambientAll()`, because
their rest state is their feathered edge travelling rather than light moving over them.
Plastic alone is pure CSS, a keyframed glow on the foundation itself. A material that only comes alive when asked
does not have a rest state. What *is* a decision is stopping it: any single surface can be
stopped, and `data-ambient="off"` on the document disables every ambient effect at once.

Most reference captures set that switch, because a moving surface cannot be photographed
deterministically. Doing it on *every* frame turned out to be a hole rather than a
convenience: it meant no reference frame had ever contained an ambient surface, and a
Resin rest state pinned at full press deformation shipped with every frame identical. A
frame may instead pin `data-ambient-clock` to a number of seconds, which freezes the
optical layer at that instant and makes its appearance as reviewable as anything else.
That attribute is a capture hook and nothing else; products have no reason to set it.

**It is still never load-bearing.** Where a platform cannot honour it, ambient degrades to
a static surface with no other change, exactly as the shader layer does. Gate G8 proves it:
with WebGL2 unavailable *and* ambient disabled, every page renders precisely its committed
baseline.

**It is bounded by what the device can hold.** A page has many material surfaces and a
browser has few live GPU contexts. Ambient shaders are capped at six and given only to
surfaces on screen; everything else keeps the CSS floor, which is complete on its own.

**It runs on the rim and the fill, never on a surface the user is reading.** This is the
edge-lensing argument again. Motion in the middle of a surface competes with the text on
it; motion at the boundary does not. Text never moves, and an ambient recipe that would
move text is wrong regardless of how subtle it is.

**It is the first thing `prefers-reduced-motion` removes.** Every ambient recipe declares
`reduced: "None."` — not a shortened version, not a gentler version. WCAG 2.2.2 requires
that anything moving for more than five seconds can be paused or stopped, and an ambient
loop by definition never stops on its own. A surface with ambient motion removed must be
identical to one that never had it.

On the web the tier is `CrystalMotion.ambient(element, recipe)` /
`CrystalMotion.stopAmbient(element)` for the CSS recipes and `CrystalShaders.ambientAll()` /
`CrystalShaders.stopAmbient(element)` for the shader ones. Reduced motion refuses outright
and marks the surface static, and a recipe that does not declare `loop` is refused.

**Interaction adds energy; it does not stop the surface.** Rest is 0.6, hover 1, press 2.4,
decaying back after 900ms — and for a shader that rate advances its clock rather than
brightening it, because faster light means the light moves quicker, not that there is more
of it. A material that goes still the moment it is touched reads as broken rather than as
calm.

The single exception is text entry. A field being typed into is the one place where motion
genuinely competes with the task, so ambient pauses on focus there and nowhere else.

The high tier belongs in the shader layer, where `u_time` is already a declared uniform.
The CSS keyframes below are the floor, not the ceiling. The platform obligations are in
`libraries/CONTRACT.md` §8.

## What triggers a recipe

A recipe that nothing triggers is a specification, not a behaviour. Crystal binds motion
to **state, not to clicks**:

| State change | Recipe |
| --- | --- |
| `checked` becomes true / false on a checkbox or radio | `check` / `check-off` |
| `checked` or `aria-checked` on a switch | `switch-on` / `switch-off` |
| A range commits a value | `slider-step`, on the linked `<output>` |
| A text field takes focus | `field-focus` |
| `aria-invalid` becomes true / returns to false | `field-invalid` / `field-valid` |
| `aria-expanded` flips on a control with `aria-controls` | `menu-in` / `menu-out` |
| A `<details>` opens or closes | `accordion-in` / `accordion-out` |
| A button is pressed or hovered | `press` / `hover` |

Binding to `pointerdown` instead of to the state would give a mouse user motion that a
keyboard user and a screen reader user never see. Binding to the state means every input
method produces the same motion, and a programmatic change produces it too.

Two guards matter in practice. A recipe never restarts itself while that same recipe is
already running on that element — restarting mid-flight is what makes a continuous control
feel choppy. And a page that drives a component itself marks that subtree
`data-cr-motion="manual"`, so the delegated wiring does not fire the same recipe twice.

`npm run verify:interactions` asserts all of this in a real browser against plain controls,
including that reduced motion still applies the state instantly.


## Recipe reference

<!-- generated:recipes -->

All 60 recipes in 10 categories, generated from `tokens/motion-recipes.json`. **Damping ratio** and
**overshoot** are derived from each recipe's spring by `assets/core/spring.js`, not
authored — so a spring that was retuned cannot leave a stale number behind in this table.

A damping ratio below 1 overshoots and settles back; exactly 1 is the fastest approach
with no overshoot; above 1 crawls in without ever passing the target. Which one is
correct is a material question, not a taste question — see the signature policy below.

#### Controls

| Recipe | Duration | Signature | Material | Damping ζ | Overshoot | Use | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `press` — Press and release | 320ms | pressure | resin | 0.660 | 6.3% | Buttons, icon buttons and segmented controls. Disabled controls never animate. | Apply the semantic state immediately; omit decorative movement. |
| `hover` — Light follows the surface | 700ms | caustic | resin | 0.900 | 0.2% | Fine-pointer affordance only; keyboard focus is immediate. | Apply the semantic state immediately; omit decorative movement. |
| `selection` — Selection settle | 420ms | meniscus | resin | 0.700 | 4.6% | Selected chips, radios, toggles and navigation; set selected semantics first. | Apply the semantic state immediately; omit decorative movement. |
| `switch-on` — Switch on | 460ms | coalesce | resin | 0.620 | 8.4% | Animate the thumb after its checked state is applied. | Apply the semantic state immediately; omit decorative movement. |
| `switch-off` — Switch off | 460ms | coalesce | resin | 0.620 | 8.4% | Animate the thumb after its unchecked state is applied. | Apply the semantic state immediately; omit decorative movement. |
| `check` — Checkmark confirmation | 340ms | iris | resin | 0.800 | 1.5% | Checkbox and radio indicators; retain a visible non-color state. | Apply the semantic state immediately; omit decorative movement. |
| `slider-step` — Value response | 400ms | feather | stone | 0.920 | none | Range outputs, steppers and scrubber labels; value updates immediately. | Apply the semantic state immediately; omit decorative movement. |
| `icon-turn` — Disclosure icon | 440ms | torsion | resin | 0.660 | 6.3% | Disclosure chevrons; parent expanded state is authoritative. | Apply the semantic state immediately; omit decorative movement. |
| `copy-confirm` — Copy confirmation | 540ms | coalesce | resin | 0.620 | 8.4% | Only after clipboard write succeeds; retain textual confirmation. | Apply the semantic state immediately; omit decorative movement. |
| `check-off` — Uncheck | 300ms | iris | plastic | 0.800 | 1.5% | Checkbox and radio indicators returning to unchecked. Paired with `check`; the iris closes toward the same point it opened from. | Apply the unchecked state immediately; omit the iris. |

#### Forms

| Recipe | Duration | Signature | Material | Damping ζ | Overshoot | Use | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `field-focus` — Field focus response | 600ms | caustic | resin | 0.900 | 0.2% | Supplementary focus response; never animate or delay the actual focus ring. | Apply the semantic state immediately; omit decorative movement. |
| `field-invalid` — Invalid field | 480ms | tension | resin | 0.700 | 4.6% | Single low-amplitude cue with persistent error text; never repeated shaking. | Apply the semantic state immediately; omit decorative movement. |
| `field-valid` — Valid field | 550ms | meniscus | resin | 0.700 | 4.6% | After real local validation; never imply a remote operation succeeded. | Apply the semantic state immediately; omit decorative movement. |
| `hint-in` — Help text reveal | 500ms | coalesce | resin | 0.620 | 8.4% | Inline help, character guidance and validation details. | Apply the semantic state immediately; omit decorative movement. |
| `hint-out` — Help text departure | 500ms | meniscus | resin | 0.700 | 4.6% | Hide the help only after completion; do not remove focused content. | Apply the semantic state immediately; omit decorative movement. |

#### Navigation

| Recipe | Duration | Signature | Material | Damping ζ | Overshoot | Use | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `tab-in` — Tab content arrival | 650ms | refraction | frost | 0.850 | 0.6% | Selected tab panels; apply aria-selected and hidden state synchronously. | Apply the semantic state immediately; omit decorative movement. |
| `page-in` — View arrival | 1050ms | inertia | plastic | 0.550 | 12.6% | New local view after routing is committed; preserve focus and history. | Apply the semantic state immediately; omit decorative movement. |
| `page-out` — View departure | 760ms | inertia | plastic | 0.550 | 12.6% | Departing view only; never postpone route authorization or loading. | Apply the semantic state immediately; omit decorative movement. |
| `breadcrumb` — Location update | 500ms | coalesce | resin | 0.620 | 8.4% | New breadcrumb item; current-page semantics stay explicit. | Apply the semantic state immediately; omit decorative movement. |

#### Overlays

| Recipe | Duration | Signature | Material | Damping ζ | Overshoot | Use | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `drawer-in` — Drawer arrival | 1000ms | refraction | frost | 0.850 | 0.6% | Side sheets and inspector panels; establish modality first. | Apply the semantic state immediately; omit decorative movement. |
| `drawer-out` — Drawer departure | 650ms | refraction | frost | 0.850 | 0.6% | Keep modal focus contained until dismissal completes. | Apply the semantic state immediately; omit decorative movement. |
| `menu-in` — Menu reveal | 620ms | coalesce | resin | 0.620 | 8.4% | Dropdowns, selects and command menus; keyboard behavior belongs to the component. | Apply the semantic state immediately; omit decorative movement. |
| `menu-out` — Menu dismissal | 380ms | meniscus | resin | 0.700 | 4.6% | Close menus and restore trigger focus when appropriate. | Apply the semantic state immediately; omit decorative movement. |
| `tooltip-in` — Tooltip arrival | 420ms | meniscus | resin | 0.700 | 4.6% | Noninteractive descriptions on focus or hover; Escape dismisses. | Apply the semantic state immediately; omit decorative movement. |
| `tooltip-out` — Tooltip departure | 420ms | meniscus | resin | 0.700 | 4.6% | Pointer and focus must both leave before hiding. | Apply the semantic state immediately; omit decorative movement. |
| `popover-in` — Popover arrival | 620ms | coalesce | resin | 0.620 | 8.4% | Nonmodal details with outside-click, Escape and focus handling. | Apply the semantic state immediately; omit decorative movement. |
| `popover-out` — Popover departure | 380ms | meniscus | resin | 0.700 | 4.6% | Dismiss nonmodal details without trapping focus. | Apply the semantic state immediately; omit decorative movement. |

#### Content

| Recipe | Duration | Signature | Material | Damping ζ | Overshoot | Use | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `accordion-in` — Disclosure reveal | 650ms | feather | haze | 0.920 | none | Animate visible content after expanding; no scripted height measurement needed. | Apply the semantic state immediately; omit decorative movement. |
| `accordion-out` — Disclosure close | 650ms | feather | haze | 0.920 | none | Hide content after completion; return focus first if a child has focus. | Apply the semantic state immediately; omit decorative movement. |
| `list-in` — Item insertion | 650ms | feather | haze | 0.920 | none | Real added messages, table rows, cards and collection items. | Apply the semantic state immediately; omit decorative movement. |
| `list-out` — Item removal | 440ms | feather | haze | 0.920 | none | Remove after completion; announce the actual change and keep focus valid. | Apply the semantic state immediately; omit decorative movement. |
| `reorder` — Reorder settle | 500ms | inertia | plastic | 0.550 | 12.6% | Supplement DOM reordering; use layout() for measured bounded displacement. | Apply the semantic state immediately; omit decorative movement. |
| `highlight` — Updated content | 500ms | feather | haze | 0.920 | none | A brief update cue paired with actual content or announcement. | Apply the semantic state immediately; omit decorative movement. |
| `message-in` — Message arrival | 650ms | feather | haze | 0.920 | none | Only on a new message; do not replay on virtualized history or steal scroll. | Apply the semantic state immediately; omit decorative movement. |
| `reaction` — Reaction response | 680ms | coalesce | resin | 0.620 | 8.4% | Toggle the real reaction state and count before the response. | Apply the semantic state immediately; omit decorative movement. |

#### Feedback

| Recipe | Duration | Signature | Material | Damping ζ | Overshoot | Use | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `toast-in` — Notification arrival | 650ms | coalesce | resin | 0.620 | 8.4% | Live status text with a persistent dismiss button. | Apply the semantic state immediately; omit decorative movement. |
| `toast-out` — Notification departure | 440ms | meniscus | resin | 0.700 | 4.6% | No timer required; manual dismissal preserves reading time. | Apply the semantic state immediately; omit decorative movement. |
| `success` — Success acknowledgement | 600ms | feather | stone | 0.920 | none | Use after a successful operation with text and a recognizable mark. | Apply the semantic state immediately; omit decorative movement. |
| `attention` — Attention cue | 500ms | feather | stone | 0.920 | none | Single finite cue for important text; never flash or loop. | Apply the semantic state immediately; omit decorative movement. |
| `progress-change` — Progress settle | 500ms | feather | stone | 0.920 | none | Actual progress is set first; this animation does not fabricate completion. | Apply the semantic state immediately; omit decorative movement. |
| `busy` — Finite busy cue | 680ms | feather | stone | 0.920 | none | One cycle for an actual pending operation; keep a static busy label if it lasts longer. | Apply the semantic state immediately; omit decorative movement. |
| `skeleton-resolve` — Loading content resolve | 650ms | feather | haze | 0.920 | none | Replace a skeleton only when real data arrives; no endless shimmer. | Apply the semantic state immediately; omit decorative movement. |
| `empty-in` — Empty-state reveal | 500ms | coalesce | resin | 0.620 | 8.4% | Shown only when the collection is actually empty. | Apply the semantic state immediately; omit decorative movement. |

#### Media

| Recipe | Duration | Signature | Material | Damping ζ | Overshoot | Use | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `media-in` — Media arrival | 900ms | refraction | frost | 0.850 | 0.6% | After an image decodes or media becomes ready; reserve layout space. | Apply the semantic state immediately; omit decorative movement. |
| `caption-in` — Caption reveal | 500ms | coalesce | resin | 0.620 | 8.4% | Optional descriptive caption; text remains accessible in reduced motion. | Apply the semantic state immediately; omit decorative movement. |
| `carousel-next` — Next item | 920ms | refraction | frost | 0.850 | 0.6% | Explicit next/previous navigation; never autoplay. | Apply the semantic state immediately; omit decorative movement. |
| `carousel-previous` — Previous item | 920ms | refraction | frost | 0.850 | 0.6% | Maintain item count and keyboard navigation. | Apply the semantic state immediately; omit decorative movement. |

#### Manipulation

| Recipe | Duration | Signature | Material | Damping ζ | Overshoot | Use | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `drag-pickup` — Lift to move | 500ms | tension | resin | 0.700 | 4.6% | Visual lift for a selected movable item; keyboard alternative required. | Apply the semantic state immediately; omit decorative movement. |
| `drag-settle` — Drop settle | 640ms | coalesce | resin | 0.620 | 8.4% | After a valid local move, with undo where data changes. | Apply the semantic state immediately; omit decorative movement. |
| `resize-settle` — Resize settle | 600ms | refraction | frost | 0.850 | 0.6% | After measured layout size changes; never animate focus or hide handles. | Apply the semantic state immediately; omit decorative movement. |

#### Material compositions

| Recipe | Duration | Signature | Material | Damping ζ | Overshoot | Use | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `resin-confluence` — Resin confluence | 1600ms | coalesce | resin | 0.620 | 8.4% | Explicit material choreography for a large specimen; replay is a visual study, not an application action. | Keep the resting material visible; omit choreography. |
| `frost-unfold` — Frost unfolds into depth | 1900ms | refraction | frost | 0.850 | 0.6% | Explicit material choreography for a large specimen; replay is a visual study, not an application action. | Keep the resting material visible; omit choreography. |
| `plastic-settle` — Plastic settles into place | 1700ms | inertia | plastic | 0.550 | 12.6% | Explicit material choreography for a large specimen; replay is a visual study, not an application action. | Keep the resting material visible; omit choreography. |
| `haze-tide` — Haze perimeter tide | 1800ms | feather | haze | 0.920 | none | Explicit material choreography for a large specimen; replay is a visual study, not an application action. | Keep the resting material visible; omit choreography. |
| `stone-contour` — Stone contour ripple | 1300ms | feather | stone | 0.920 | none | Explicit material choreography for a large specimen; replay is a visual study, not an application action. | Keep the resting material visible; omit choreography. |

#### Ambient

| Recipe | Duration | Signature | Material | Damping ζ | Overshoot | Use | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `resin-breathe` — Resin at rest | 2000ms | refraction | resin | 0.850 | 0.6% | The specular band on a Resin surface at rest. Applies to the rim layer only; the content above it never moves. | None. The surface is static. |
| `frost-drift` — Frost at rest | 2000ms | feather | frost | 0.920 | none | Slow drift of the Frost grain and tint on a panel that persists while content moves behind it. | None. The surface is static. |
| `haze-settle` — Haze at rest | 5200ms | feather | haze | 0.820 | 1.1% | Light travelling around the perimeter of a Haze content fill. Haze IS its feathered edge, so its rest motion is light moving ALONG that edge rather than the edge advancing and retreating — that gesture belongs to Resin, which is a lens breathing. On the web this is a conic gradient masked to the rim; a platform rotates its own edge light. | None. The edge holds still at its resting opacity. |
| `stone-settle` — Stone at rest | 7000ms | feather | stone | 0.820 | 1.1% | Light travelling around a Stone label backing, slower and dimmer than Haze because a label backing is smaller and sits closer to text. | None. The edge holds still at its resting opacity. |
| `mirage-current` — Mirage at rest | 2000ms | refraction | mirage | 0.850 | 0.6% | Slow current in the modal scrim while a dialog is open. Stops when the dialog closes. | None. The scrim is a flat fill. |

**Spring policy.** Every recipe carries a spring fitted to its authored duration, which remains the authority. Damping ratio is chosen by signature: inertia and coalesce overshoot because momentum is their material claim, feather and caustic do not because a soft edge that bounces is wrong. Disabling springs must reproduce the keyframes exactly.

**Travel policy.** 5–30px ordinary, 50px guidance; justified large transitions may exceed it. Haze and Stone paint moves locally while text stays fixed.

**Incompressibility.** Deformations conserve volume: every scale(sx, sy) satisfies sx*sy = 1 within 0.005. Corrected by dividing both axes by the square root of the area, which preserves each deformation's aspect ratio exactly and removes only the compressibility error. Enforced by tools/validate-motion.cjs.

<!-- /generated:recipes -->

## The shader contract

<!-- generated:shaders -->

Generated from `assets/shaders/manifest.json` (version 2.0.0).

**The contract is the uniform set, not the GLSL.** A platform that honours these
uniforms has implemented Crystal's shader layer correctly, whether it does so in
GLSL, Metal or AGSL. The `.frag` files in this repository are one implementation.

### Uniforms

| Uniform | Type | Meaning |
| --- | --- | --- |
| `u_time` | float | Seconds since the effect began, already divided by the user motion-speed factor. |
| `u_resolution` | vec2 | Canvas size, for aspect-correct sampling. |
| `u_progress` | float | Spring displacement from the headless core, not a linear ramp. This is what ties the optical layer to the same physics as the geometry. |
| `u_pressure` | float | Interaction intensity. 0 at rest; 1 at full press or drag. |
| `u_contact` | vec2 | Normalised contact point, the origin of a disturbance. Defaults to the centre. |
| `u_tint` | vec3 | Resolved material tint in linear sRGB, taken from the palette so shaders never introduce colour of their own. |
| `u_intensity` | float | Global attenuation. Products lower it; reduced transparency drives it to 0. |

### Shaders

#### `resin-refraction`

- **Material** — resin
- **Signatures** — refraction, meniscus, tension
- **Blend mode** — `hard-light`
- **Degrades to** — The existing CSS travelling-light sweep.

Resin bends and disperses light at its rim. A signed-distance field gives the lens profile; the lighting response is a specular band that tracks the direction of travel, a defined bright edge, and chromatic separation where the lens is steepest. The interior stays clear so content remains readable through the material.

#### `resin-caustics`

- **Material** — resin
- **Signatures** — caustic
- **Blend mode** — `screen`
- **Degrades to** — A static highlight at the resting opacity.

Light focused by a curved surface concentrates into bright curves. The curvature here is at the rim, so the caustics fall as sparse arcs along the boundary. Read from the same height field as the refraction shader, so the two agree by construction rather than by tuning.

#### `frost-displacement`

- **Material** — frost
- **Signatures** — feather, refraction
- **Blend mode** — `hard-light`
- **Degrades to** — The existing backdrop-filter blur and grain, unchanged.

Frost refracts colour, not shape. At 40px of diffusion nothing sharp survives the material, so the three channels sample the same field at slightly separated points and resolve into a slow warm-to-cool wander across the surface rather than a visible fringe. Resin, at 20px, keeps detail and disperses sharply at its rim instead: the diffusion radius decides which behaviour is correct, not taste. Turning Resin down does not produce Frost, it produces weak Resin.

#### `mirage-flow`

- **Material** — mirage
- **Signatures** — iris
- **Blend mode** — `screen`
- **Degrades to** — The existing clip-path ellipse reveal.

Mirage washes across a scene as a curved front. A flow field advects the front so its edge is organic rather than a geometric ellipse.

### Compositing

**element** — A transparent canvas positioned over the surface, never in the content flow.

**blend** — mix-blend-mode as declared per shader; the canvas carries no opaque pixels.

**note** — A web shader cannot sample the page behind it, so refraction is rendered as the lighting response to a computed surface normal rather than by displacing a backdrop. The eye reads normals and specular as refraction, and the technique degrades to nothing rather than to something wrong.

### The optical model

**basis** — Edge lensing, not surface waves.

**rationale** — Refraction is concentrated in a band just inside the boundary and falls off steeply, leaving the centre of a surface optically clear. This follows how contemporary glass interfaces behave: the interior is shrunk and the edges stretched outward, which is a displacement concentrated at the rim rather than a wave crossing the surface. A defined, light-catching edge is what separates glass from frosted plastic.

**rejected** — An earlier implementation radiated concentric ripples from the contact point. That is what water does when something is dropped into it, and it read as a pond rather than as a solid transparent material. Meridian rejected it on sight and they were right: glass does not oscillate, it bends light where it curves.

**specular** — The highlight tracks the direction of travel rather than sitting still. On a handset the reference for this is the gyroscope; on the web it is the motion's own direction, taken from the contact point. A highlight that does not move with the object reads as a painted-on gradient.

**morphing** — Shape-shifting between states is geometry, not optics, and is carried by the spring recipes: the coalesce and meniscus signatures describe surfaces merging and separating. The optical layer lights whatever shape the geometry produces.

### Platform mapping

| Platform | Shading language |
| --- | --- |
| web | GLSL ES 3.00 fragment shaders on WebGL2, as authored here. |
| apple | Metal Shading Language. Port mechanically; uniforms become a single constant buffer in the declared order. |
| android | AGSL via RuntimeShader. Uniforms map one to one; AGSL is GLSL-derived and the bodies transfer with signature changes only. |
| note | A platform that cannot meet the contract must degrade as declared per shader rather than approximate it differently, because a divergent approximation is worse for parity than an honest absence. |

<!-- /generated:shaders -->
