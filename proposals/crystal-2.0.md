# Crystal 2.0 — proposal

**Status:** proposal, not approved. Nothing here is shipped.
**Date:** 2026-09-17 · **Basis:** audit of Crystal 1.0 after the focus/selection/geometry/header fixes.

## Why 2.0

Crystal 1.0 is a design system with an interactive preview. Crystal 2.0 needs to be a **base that platform component libraries can be built on**, with complete parity against the design systems those libraries will be compared to.

Those are different jobs. 1.0 optimises for one hand-authored web preview: global element selectors, a JavaScript pass that rewrites the DOM, a flat token file, and a component catalogue sized to what the preview demonstrates. A React, SwiftUI or Compose library cannot consume any of that as-is. 2.0 is the work of separating **the design contract** from **one web implementation of it**.

The visual identity is not in scope for change. Plastic → Frost → Resin, the six materials, the palettes, the optical treatment and the approved baseline all carry forward unchanged.

---

## Audit findings

Ordered by how much each blocks the component-library plan.

### 1. The runtime mutates the DOM — blocks every framework library

`controls.js` wraps every text input in a generated `.cr-field-shell` element, appends indicator `<span>`s into buttons, adds classes to `nav a`, and keeps doing so through a `MutationObserver` on the whole body.

This works for a static page. It breaks in React, Vue, Svelte, SwiftUI and Compose, all of which own their subtrees and will fight or discard the injected nodes. Any library built on 1.0 would have to reimplement the field shell and indicators from scratch — at which point the shared "system" is only a stylesheet of colours.

**Severity: blocking.** Everything in the parity plan depends on fixing this first.

### 2. Specificity is a sledgehammer

`controls.css` uses the `:root body …` prefix **116 times**. That is deliberate — it was needed to win against `site.css` — but it makes the stylesheet nearly unoverridable by a consumer. The symptom is already visible in 1.0: `site.css` sets `.export-controls button{padding:9px 10px}` and loses to `:root body .cr-button`, so the export buttons wrapped to two lines until an equally specific override was added.

A product that adopts Crystal and wants a slightly tighter button has no clean way to express that.

### 3. Token architecture is single-tier, with duplicate vocabulary

88 CSS custom properties in one flat namespace, mixing raw material physics (`--cr-frost-blur`), brand colour (`--cr-decorative`), semantic roles (`--cr-danger-ink`) and component-ish values (`--cr-haze-own-fill`) at the same level.

The materials were renamed — Mica → Plastic, Acrylic → Frost, Glass → Resin — but **both vocabularies still ship**: `--cr-acrylic-blur` alongside `--cr-frost-blur`, `--cr-glass-fill` alongside `--cr-resin-fill`, `--cr-mica-inactive`, and the `.cr-acrylic` / `.cr-glass` class aliases. Two names for one concept is a documentation and tooling problem that multiplies across five libraries.

The token file states plainly: *"Crystal token schema v1, not a claim of DTCG format conformance."* Without the W3C Design Tokens format there is no clean path into Figma Variables, Style Dictionary, or any of the pipelines the platform teams will expect.

### 4. Component coverage is roughly half of parity

Crystal documents **24 component contracts**. The systems the libraries will be measured against — Material 3, Fluent 2, Carbon, Polaris, Spectrum — carry 40–60.

Absent entirely: accordion, breadcrumb, pagination, stepper, date/time picker, combobox / autocomplete, command palette, tree view, carousel, skeleton, chip / tag input, inline banner, empty state, progress indicator (specified but not built), segmented control (exists in the preview, undocumented), file upload, split button, toggle/switch (exists in motion, undocumented).

### 5. Motion is ahead of the component spec

The motion catalogue ships 54 recipes across 9 categories. **11 of those recipe families animate components that have no documented anatomy, states or contract**: `accordion`, `breadcrumb`, `carousel`, `skeleton`, `drag`, `reorder`, `caption`, `hint`, `copy`, `reaction`, `resize`.

So part of the parity work is already done — in the wrong layer. There are animations for components that do not exist. This is the cheapest gap to close, because the motion intent is already decided.

### 6. Supporting gaps

- **Icons:** 13 symbols. Parity systems ship 300–1000+. 13 will not dress a real product.
- **RTL:** partial. Directional bubble corners and the range track are mirrored; there is no systematic audit, and no RTL row in the verification evidence.
- **Verification:** strong on contrast (1716 checks) and static integrity (370 links), with **no visual regression harness**. A material can become visually indistinguishable while every automated check passes — which AGENTS.md already warns about but nothing currently detects.
- **No changelog, no published package, no deprecation record.** Governance is described in prose in the adoption chapter; there is no machine-readable release history to adopt against.

---

## Proposed changes

### A. Three-tier tokens, in DTCG format

Restructure into the standard three tiers, with the tier encoded in the name:

| Tier | Purpose | Example | Consumed by |
|---|---|---|---|
| Primitive | Raw values, no meaning | `color.violet.500`, `blur.40` | Semantic tier only |
| Semantic | Role in the system | `color.action.primary`, `material.frost.diffusion` | Libraries and products |
| Component | Per-component binding | `button.action.background`, `field.shell.radius` | Library internals only |

Publish the canonical token source in **W3C DTCG format**, and generate today's flat `--cr-*` CSS from it rather than hand-maintaining both. Add generated outputs for Swift, Kotlin and TypeScript from the same source, so no library retypes a value.

**Retire the legacy vocabulary.** Ship `--cr-acrylic-*`, `--cr-glass-*`, `--cr-mica-*`, `.cr-acrylic` and `.cr-glass` as deprecated aliases for one minor version with a documented removal date, then delete them. One material, one name.

### B. A headless core, and CSS a consumer can override

Split the current runtime in two:

- **Behaviour (headless):** field-state derivation, selection/current/busy resolution, range progress, preference persistence and export — as framework-agnostic functions that take state and return state. No DOM queries, no `MutationObserver`, no element creation.
- **Presentation:** each library renders its own markup and calls the headless core. The web library keeps the current DOM output, produced declaratively instead of by mutation.

Wrap the stylesheet in **cascade layers** — `@layer crystal.reset, crystal.material, crystal.component, crystal.override` — which lets the `:root body` prefixes come out entirely. Layer order, not specificity, decides who wins, and a product's own unlayered CSS beats all of it by default.

### C. Component parity, in three waves

Close the gap to ~48 documented components. Each gets the same contract the existing 24 have — anatomy, states, programmatic source, and an explicit statement of what the system supplies versus what the application owns.

- **Wave 1 — components that already have motion:** accordion, breadcrumb, carousel, skeleton, chip, drag-and-drop affordance, reorderable list, caption, hint, copy-confirm, reaction. Cheapest wave; the motion intent already exists.
- **Wave 2 — expected of any system:** pagination, stepper, combobox/autocomplete, switch, segmented control, progress (determinate and indeterminate), inline banner, empty state, split button, file upload.
- **Wave 3 — composite:** date/time picker, command palette, tree view, data table with sort/filter/selection.

Expand the icon set to a first tranche of ~120 on the existing 24px / 1.8px-stroke grid, chosen by actual product need rather than filling a matrix.

### D. A platform parity contract

Define, once, what "a Crystal library" means, so five libraries do not drift:

1. Consume generated tokens. Never redeclare a value.
2. Implement all six materials with platform-appropriate techniques. A CSS approximation is not a native optical specification — the *qualities* are the contract, not the recipe numbers.
3. Implement the full component catalogue. A component present in one library is required in the others, with the same states, semantics and token bindings.
4. Preserve the behavioural contracts: focus geometry, selection marks, pill-versus-card geometry, motion timings and ceilings, reduced motion, reduced transparency, forced colours.
5. Ship the library's own accessibility and visual-regression evidence. Crystal's verification covers the design-system package, not anything built on it.

Add a machine-readable parity manifest listing every component and the per-library implementation status, so gaps are visible rather than asserted.

### E. Verification that can catch a visual regression

- **Visual regression harness** over every component × 6 palettes × light/dark × comfortable/compact × full/reduced effects, with the approved baseline studies as anchor cases.
- **RTL as a first-class axis**, with its own evidence row.
- **Forced-colours and reduced-transparency captures** in the report, not only in prose.
- Keep the existing contrast and integrity checks; they are good and should stay.

### F. Governance

Adopt semantic versioning against a stated public contract (token names, class names, component contracts, exported file formats). Maintain a real `CHANGELOG.md`. Deprecate before removal, with the removal version named at deprecation time. Publish the ZIP as a GitHub Release asset rather than a committed binary.

---

## What does not change

The identity. Plastic → Frost → Resin and the six named materials; the recommended defaults (atmosphere 90%, Frost tint 35%, elevation 125%, radius 28px, Resin 20%, Haze 80% at 1.95px); the six palettes with independent status colours; Manrope at 16/24 reading rhythm; the motion timings and the 5s ceiling; and the four approved baseline studies as the acceptance standard.

2.0 changes how Crystal is **packaged, named, extended and verified**. It does not change how Crystal **looks**.

---

## Breaking changes

| Change | Who is affected | Migration |
|---|---|---|
| Legacy material aliases removed | Anyone using `.cr-acrylic`, `.cr-glass`, `--cr-acrylic-*`, `--cr-glass-*`, `--cr-mica-*` | Deprecation period with both names, then a codemod |
| Cascade layers replace `:root body` | Products that override Crystal by out-specifying it | Overrides get *simpler*; some may now win where they previously lost — needs a visual pass |
| DOM-mutating runtime removed | The preview site itself | Rewrite the preview against the declarative web library; treat it as the first consumer |
| Token names re-tiered | Anyone reading `--cr-*` directly | Generated compatibility shim for one major version |

---

## Sequencing

1. **Foundations** — DTCG token source, generated outputs, cascade layers, legacy aliases deprecated.
2. **Headless core** — extract behaviour; rebuild the preview site as the first consumer of the web library. This proves the split before any second platform starts.
3. **Parity wave 1** — the components that already have motion.
4. **First platform library** — one library, end to end, establishing the parity contract in practice.
5. **Waves 2–3 and remaining platforms**, in parallel once the contract is proven.

Step 2 is the real gate. If the preview site cannot be rebuilt on the headless core, no framework library will work either.

---

## Open decisions

1. **Which platform goes first?** The first library sets the parity contract. Web/React is lowest-risk; a native target would surface the "qualities, not recipes" problem earlier, when it is cheaper to solve.
2. **How far does the icon set go?** 120 is a working tranche, not a parity number. Commissioning 500+ original icons on the 24px grid is a significant standalone project.
3. **Does Crystal publish to a registry,** or stay vendored per product? Affects versioning, deprecation windows and whether the parity manifest can be enforced in CI.
4. **Composite components (Wave 3) — system or product?** Date pickers and data tables are where design systems usually over-reach. It may be better to specify their *appearance* and let products bring their own accessible primitives, as the adoption chapter already recommends for complex focus and menu behaviour.
