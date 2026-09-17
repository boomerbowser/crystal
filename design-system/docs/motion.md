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

See the [component motion suite](motion-components.html) for all 54 recipes, engine assignments, API contracts, live component behavior, test instructions and future component-library/Storybook coverage. [License notices](../reference/ASSET-NOTICES.md) accompany the local bundle.

The compact CSS timing tokens remain available for small state changes. The material-driven Resin press recipe uses 320ms for a complete compression/recovery sequence; hover light uses 700ms. These visual clocks never delay the actual action. The executable catalog lists the current duration of every recipe.
