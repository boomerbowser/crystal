# Crystal platform library contract

What it means for a library to be "a Crystal library". Five requirements, so five libraries do not drift into five design systems that happen to share a colour.

Crystal is the base. A library implements Crystal for a platform; it does not fork the token or material definitions.

## 1. Consume generated tokens. Never redeclare a value.

The canonical source is `design-system/tokens/crystal.tokens.json`, a W3C DTCG file. Generated exports for TypeScript, Swift and Kotlin are emitted from it into `design-system/exports/`. A library imports those. A hard-coded `#7338EF`, `40px` or `1.95px` anywhere in a library is a defect, because it is a value that can no longer be changed centrally.

Derived values — elevation-scaled shadows, rgba composites, scaled motion durations — are computed, not stored. Reuse the resolver's arithmetic rather than reimplementing it; two implementations of the same formula will diverge.

## 2. Implement all six materials with platform-appropriate techniques.

Plastic → Frost → Resin, plus Haze, Stone and Mirage. The **qualities** are the contract, not the CSS recipe numbers: opacity, diffusion, colour transmission, perimeter definition, feathering, elevation and foreground clarity. A CSS approximation is not a native optical specification, and a native renderer is not obliged to reach the same result the same way.

What must survive on every platform: the material order, visibly distinct material behaviour, contextual colour, optical rims, elevation, feathered Haze and Stone paint, and crisp foregrounds. Text, icons, hit areas and focus rings are never blurred.

## 3. Implement the full catalogue.

`parity.json` lists every component Crystal specifies, with per-platform status. A component present in one library is expected in the others, with the same states, semantics and token bindings. Parity is measured against Mantine, Ant Design and MUI, named per component in the catalogue so the claim is checkable.

Crystal specifies appearance. Products bring their own accessible primitives — focus management, menu keyboard behaviour, date arithmetic, rich-text engines. Do not rebuild complex behaviour to obtain a surface style; wrap a maintained primitive and dress it.

## 4. Preserve the behavioural contracts.

- **Focus** is a crisp 2px core at 3px offset inside a four-layer feathered halo. Never delayed, never blurred, never replaced by a state badge.
- **Selection** is label weight. A check mark means validated or informational and never marks a selected, pressed or focused control.
- **Geometry**: action controls are pills, independent of the content radius. Card-shaped buttons keep the content radius.
- **Motion** follows the documented timings, easings and travel limits, with a hard five-second ceiling. Interactions, data and focus respond immediately even mid-transition.
- **Reduced motion** removes spatial change and keeps state feedback. **Reduced transparency** and **forced colours** remove diffusion while preserving shapes, readable pairs and hierarchy.
- **Status colours** are independent of brand palettes and are never redefined by them. Meaning is carried by words; symbol and colour reinforce.

## 5. Ship your own evidence.

Crystal's verification covers the design-system package: token contrast, static integrity, motion contracts and visual comparison of the reference preview. It says nothing about a library built on it.

Each library ships its own accessibility and visual-regression evidence, covering every component across the six palettes, both modes, both densities, full and reduced effects, and both text directions. Native clients require real device review; an HTML specimen is not evidence about a native renderer.

Record intentional platform compromises with actual device captures and review them. Never resolve a rendering or performance problem by silently substituting flat styling: reduce costly effects on supporting surfaces first, keeping palette, silhouette, contour, readable text and depth hierarchy.

## 6. Honour the motion physics, not the keyframes.

Crystal's motion is specified as a damped harmonic oscillator. Every recipe in
`design-system/tokens/motion-recipes.json` carries a `spring` block with
`stiffness`, `damping` and `mass`, plus a `platform` block that pre-computes the
parameterisation each platform actually exposes. Use it; do not re-derive it,
because two libraries deriving the same spring slightly differently is exactly
the drift this contract exists to prevent.

| Platform | API | Source of values |
|---|---|---|
| Web | Motion / GSAP spring, or `linear()` sampled from the core | `spring.stiffness`, `spring.damping`, `spring.mass` |
| Apple | `.spring(response:dampingFraction:)` | `spring.platform.swiftUI` |
| Android | `spring(dampingRatio:stiffness:)` | `spring.platform.compose` |

Three rules travel with it.

**Duration remains the authority.** Each spring is fitted to a reviewed
duration, and `tools/validate-motion.cjs` asserts the derived settling time
still matches within 15%. If you change one, change both.

**Damping expresses the material claim.** It is chosen by `signature`, not per
component: `inertia` overshoots about 12% because momentum is what it asserts,
and `feather` overshoots 0.1% because a soft edge that bounces is wrong. A
library that flattens every spring to one house curve has discarded the
signature system.

**Deformations conserve volume.** Every `scale(sx, sy)` satisfies `sx·sy = 1`.
This is not a stylistic preference: a shape that loses area while deforming
reads as rubber being crushed rather than liquid moving, which is precisely the
defect corrected in 2.0 across seventeen keyframes. If your platform expresses
deformation differently, preserve the invariant, not the syntax.

## 7. Treat the optical layer as an enhancement.

`design-system/assets/shaders/manifest.json` is the portable artefact; the GLSL
files are one implementation of it. Honour the **uniform contract**, not the
source.

| Platform | Shading language | Notes |
|---|---|---|
| Web | GLSL ES 3.00 on WebGL2 | As authored |
| Apple | Metal Shading Language | Uniforms become one constant buffer, declared order preserved |
| Android | AGSL via `RuntimeShader` | GLSL-derived; bodies transfer with signature changes only |

Non-negotiable properties:

- **Never required.** Every material must render completely with no shader at
  all. Each entry declares a `degradesTo`; a platform that cannot meet the
  contract degrades as declared rather than approximating it differently, since
  a divergent approximation damages parity more than an honest absence.
- **During a motion, or during ambient.** Shaders paint while a motion is in flight
  and while a surface is in its ambient rest state (§8). They never paint on a surface
  that is doing neither. This rule read "never at rest" until Crystal 2.0; ambient
  motion made the rest state a state a material actually has, so the rule was rewritten
  rather than excepted. Reference frames capture ambient disabled — a moving surface
  cannot be photographed deterministically — and gate G8 proves that with both the
  shader layer and ambient unavailable, every page renders exactly its baseline.
- **Never above content.** The optical layer belongs between a material's
  background and its content. On the web this is a negative `z-index` inside an
  isolated stacking context; the principle is that verified text contrast is
  never traded for an effect, and it is verified by comparing the label's own
  pixels with the layer on and off.
- **Never a new colour.** Shaders take their tint from the resolved palette. An
  optical layer may redistribute light; it may not introduce colour the token
  set did not sanction.
- **Off when the user has asked for less.** Reduced motion, reduced transparency
  and forced colours each disable the layer outright.


## 8. Ambient motion is a capability tier, not a baseline.

Ambient motion is what a surface does at rest — the specular band drifting along a Resin
rim, a Haze fill breathing around its 80% value. The `Ambient` category in
`design-system/tokens/motion-recipes.json` carries the recipes; each declares `loop: true`,
and a recipe that loops is the only kind a platform may run continuously.

A platform is not required to implement this tier at all. A platform that does must honour
all four properties:

- **On by default for Resin and Frost; stoppable everywhere.** Ambient is a material's
  rest state, not a decision a page has to remember to make — a material that only comes
  alive when asked does not have a rest state. Resin and Frost start their own; Haze,
  Stone and Plastic carry theirs in CSS. A host can stop any single surface, and one
  document-level switch disables every ambient effect at once. On the web those are
  `CrystalMotion.stopAmbient(element)` / `CrystalShaders.stopAmbient(element)` and
  `data-ambient="off"`; a platform provides the equivalents under its own names.
- **Bounded by what the platform can hold.** A page has many material surfaces and a
  browser has few live GPU contexts — Chromium starts discarding them around sixteen. The
  web implementation caps ambient shaders at six and gives them only to surfaces on
  screen. A platform sets its own ceiling and says what it is; an ambient tier that
  exhausts the device is worse than none.
- **Rim and fill only, never a surface being read.** Motion in the middle of a surface
  competes with the text on it; motion at its boundary does not. This is the same argument
  that makes Resin lens at its edge rather than ripple through its centre. Text never
  moves, and an ambient recipe that would move text is wrong however subtle it is.
- **The first thing reduced motion removes.** Every ambient recipe declares
  `reduced: "None."` — not a shorter version, not a gentler one. WCAG 2.2.2 requires that
  anything moving for more than five seconds can be paused or stopped, and an ambient loop
  never stops on its own. A surface with ambient removed must be identical to one that
  never had it.
- **Yields to the user.** Interaction pauses every ambient loop; they resume once the page
  is quiet. A loop that keeps running under the pointer is competing with the task.

This does not relax §7. A shader still paints only while a motion is in flight — an
ambient loop *is* a motion, so the optical layer may drive it — and because ambient is off
until a surface opts in, a reference frame captured with ambient disabled is unchanged.
Gate G6 continues to hold for exactly that reason, not by exception.

Where a platform cannot honour the tier, ambient degrades to a static surface with no other
change. As with the shader layer, an honest absence preserves parity better than a
divergent approximation.
