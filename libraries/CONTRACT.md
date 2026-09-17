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
- **Selection** is a leading rail plus label weight. A check mark means validated or informational and never marks a selected, pressed or focused control.
- **Geometry**: action controls are pills, independent of the content radius. Card-shaped buttons keep the content radius.
- **Motion** follows the documented timings, easings and travel limits, with a hard five-second ceiling. Interactions, data and focus respond immediately even mid-transition.
- **Reduced motion** removes spatial change and keeps state feedback. **Reduced transparency** and **forced colours** remove diffusion while preserving shapes, readable pairs and hierarchy.
- **Status colours** are independent of brand palettes and are never redefined by them. Meaning is carried by words; symbol and colour reinforce.

## 5. Ship your own evidence.

Crystal's verification covers the design-system package: token contrast, static integrity, motion contracts and visual comparison of the reference preview. It says nothing about a library built on it.

Each library ships its own accessibility and visual-regression evidence, covering every component across the six palettes, both modes, both densities, full and reduced effects, and both text directions. Native clients require real device review; an HTML specimen is not evidence about a native renderer.

Record intentional platform compromises with actual device captures and review them. Never resolve a rendering or performance problem by silently substituting flat styling: reduce costly effects on supporting surfaces first, keeping palette, silhouette, contour, readable text and depth hierarchy.
