# Crystal React implementation plan

> **For agentic workers:** implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `@crystal/react` — a comprehensive React component library implementing the full Crystal catalogue, at parity with Mantine, MUI (including the X add-ons), Ant Design and PrimeReact.

**Architecture:** React Aria Components supplies unstyled, accessible behaviour. Crystal supplies every value, material and motion. Styling is SCSS modules compiled through PostCSS — no CSS-in-JS — because React Aria exposes state as `data-*` attributes, which CSS can select directly. A theme provider carries palette, mode, density, direction, effects and motion speed; components read it through hooks and through CSS custom properties on a scope element.

**Tech stack:** React 19, TypeScript 5 (strict), React Aria Components 1.21, SCSS + PostCSS, Vite (library mode), Vitest + Testing Library + axe, Storybook 9, Changesets.

**Spec:** `libraries/CONTRACT.md` (the parity bar), `libraries/parity.json` (the catalogue), `design-system/docs/*.md` (the specification chapters).

**Repository:** its own, separate from the design system — `/home/oshun/Development/Proposals/crystal-react`, remote `boomerbowser/crystal-react`. It consumes `@meridian/crystal`; it does not vendor it.

## Global constraints

Every task inherits these. They are the contract, not preferences.

- **No hard-coded design values.** `#7338EF`, `40px`, `1.95px`, `28px` in library source is a defect (CONTRACT §1). Values arrive from generated tokens. A drift guard enforces this in CI.
- **Materials:** Plastic → Frost → Resin, plus Haze, Stone, Mirage. Resin never contains Resin; a surface above Resin is a Haze content fill.
- **Focus** is a crisp 2px core at 3px offset inside a four-layer feathered halo. **Selection is label weight** — never a rail, never a check mark.
- **Action controls are pills.** Card-shaped buttons keep the content radius.
- **Motion** honours the spring physics in `motion-recipes.json`, not the keyframes (CONTRACT §6). Hard ceiling 5000ms. Reduced motion removes spatial change and keeps state feedback.
- **Ambient motion is on by default** and low amplitude: it never paints the interior of a surface being read, and it is stoppable per surface and document-wide.
- **Status colours** are independent of brand palettes.
- Every component ships: types, SCSS, a story, a test, an axe check, and a `parity.json` status change. A component is not done until `parity.json` says so.

---

## Section A — The decision record

### Task 1: Choose the primitive library

- [x] **Step 1** — Assess Radix UI against React Aria for Crystal's actual catalogue, not in the abstract.

**Chosen: React Aria Components.** The decision is settled by coverage of the components Crystal has to ship. Every capability below was probed against the live registry:

| Capability the catalogue requires | React Aria | Radix |
| --- | --- | --- |
| Date picker, range, calendar | `react-aria-components` | no package |
| Time field, digital clock | yes | no package |
| Combobox / autocomplete | yes | no package |
| Table with sort, selection, resize | yes | no package |
| Tree view | yes | no package |
| Colour picker, area, slider, swatch | yes | no package |
| Number field | yes | no package |
| Tag group | yes | no package |
| Drag and drop | `@react-aria/dnd` | no package |
| Internationalised dates | `@internationalized/date` | none |

Radix is excellent at what it covers and is the better-known choice, but it covers roughly the overlay-and-form third of this catalogue. Building the other two-thirds by hand would violate CONTRACT §3 — *"Do not rebuild complex behaviour to obtain a surface style; wrap a maintained primitive and dress it."*

Three secondary reasons, each of which independently favours React Aria here:

- It exposes state as `data-*` attributes (`data-pressed`, `data-focus-visible`, `data-selected`), so Crystal's materials can be expressed in plain SCSS. Meridian's stated preference is SCSS over Emotion; this makes that preference free rather than a compromise.
- It is SSR-safe by design, which the Next.js / TanStack Start / React Router / Gatsby / Redwood requirement demands.
- Its locale and date handling is real internationalisation, which Crystal's right-to-left axis already tests for.

### Task 2: Decide how React consumes Crystal's motion

- [x] **Step 1** — `assets/motion.js` and `assets/motion-shaders.js` are IIFEs that attach to `window` and install document-wide listeners and observers. They cannot be imported, and a React library must not run a global `ambientAll()` that scans the document — React owns its own lifecycle.

**Chosen: export the physics, own the binding.** `@meridian/crystal` gains ESM entry points for the parts that are pure — `src/engines.js` is already ESM with named exports, and `assets/core/*.js` are pure functions. Crystal React imports those and implements its own `useMotion` / `useAmbient` hooks that attach per element through refs and clean up on unmount.

This satisfies CONTRACT §1 and §6: the arithmetic, the springs, the recipes and the state derivation are Crystal's and are never reimplemented. What React implements is the *binding* — which is genuinely different on a platform with a component lifecycle, and is exactly what §2 means by "platform-appropriate techniques".

---

## Section B — Scope

### Task 3: Make the catalogue admit the real target

- [x] **Step 1** — Compute the gap rather than estimate it: install Mantine, MUI, MUI X, Ant Design and PrimeReact and enumerate their component directories. `design-system/tools/extend-parity.cjs` records the result and is re-runnable.
- [x] **Step 2** — Curate. MUI composes from anatomy parts (`CardHeader`, `TableCell`, `StepLabel`, `ChartsAxis`) and date-library adapters (`AdapterDayjs`, `AdapterLuxon`); those are parts and plumbing, not catalogue entries.
- [x] **Step 3** — Add 55 components, taking the catalogue from 119 to **174**. The largest single gap was that Crystal named no charting surface at all while all four benchmarks ship one; `charts` is a new category of 14.
- [x] **Step 4** — Record refusals rather than omitting them. `terminal` and `border-beam` are `not-applicable` with a stated reason — the second because Crystal already specifies a travelling edge as the Resin optical rim and the Haze/Stone ambient edge, and a second unrelated mechanism would contradict the material spec.

**172 components to build.** That is the honest number and it is weeks of work, not one sitting. It is delivered in slices, and `parity.json` is the progress record.

---

## Section C — Foundation

Nothing downstream is trustworthy until this is proven, so it ends with a gate that exercises every tier on a real component.

### Task 4: Repository and build

- [ ] **Step 1** — `git init` at `/home/oshun/Development/Proposals/crystal-react`; remote `boomerbowser/crystal-react`, private.
- [ ] **Step 2** — `package.json` as `@crystal/react`: ESM + CJS, `sideEffects` declaring the SCSS, `exports` per entry point, React 18/19 peer range.
- [ ] **Step 3** — Vite library mode, `dts` for declarations, `preserveModules` so consumers tree-shake.
- [ ] **Step 4** — TypeScript strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`. No `any` in public types.
- [ ] **Step 5** — Consume `@meridian/crystal` by `file:` link until it is published; record that in the README so nobody mistakes it for a registry dependency.

### Task 5: Tokens into SCSS

- [ ] **Step 1** — Generate `_tokens.scss` from `crystal.tokens.json`. Hand-writing it would be a CONTRACT §1 defect on the first line.
- [ ] **Step 2** — Emit both: SCSS variables for compile-time arithmetic and media queries, and custom properties for anything that changes at runtime with the theme.
- [ ] **Step 3** — Port the drift guard: a test that fails on a literal colour, blur radius or radius in any `.scss` outside the generated file.

### Task 6: Theme

- [ ] **Step 1** — `CrystalProvider` wrapping `assets/core/preferences.js` — the normalisation, ranges and defaults already exist and must not be re-derived.
- [ ] **Step 2** — A typed theme object: palette, mode, density, direction, effects, motion speed, radius, atmosphere, elevation, Frost tint.
- [ ] **Step 3** — Hooks: `useCrystalTheme`, `useColorScheme`, `useTypography`, `useDensity`, `useDirection`, `useReducedEffects`, `useMotionSpeed`.
- [ ] **Step 4** — Nested providers scope to a subtree via custom properties, so a dark island inside a light page works without a second root.
- [ ] **Step 5** — SSR: no `window` at module scope, no hydration mismatch. A `<ColorSchemeScript />` for the pre-paint class, as Mantine and MUI both do.

### Task 7: Motion

- [ ] **Step 1** — `useMotion(ref, recipe, options)` calling Crystal's engine, cancelling on unmount, honouring `{ once }`.
- [ ] **Step 2** — `useAmbient(ref, recipe)` for the Web Animations tier, and `useOpticalAmbient(ref)` for the shader tier, both refusing under reduced motion and both stoppable.
- [ ] **Step 3** — Bind to state, not to events — the React equivalent of `motion-interactions.js`: `checked`, `aria-expanded`, `aria-invalid`, `open`, committed range values.
- [ ] **Step 4** — One rate table, read from context, matching the rest/hover/press behaviour the web preview already ships.
- [ ] **Step 5** — `data-ambient-clock` honoured, so a Storybook story or a visual test can freeze the rest state.

### Task 8: Testing, stories, and machine readability

- [ ] **Step 1** — Vitest + Testing Library + `vitest-axe`, with a shared `renderWithCrystal` helper.
- [ ] **Step 2** — Jest compatibility: ship a transform note and verify one suite runs under Jest, since the requirement names both.
- [ ] **Step 3** — Storybook 9 with a theme toolbar covering all six palettes, both modes, both densities, both directions, and reduced effects.
- [ ] **Step 4** — `llms.txt` plus a generated `component-manifest.json` — props, states, tokens, recipes per component — so an assistant can use the library without reading the source.

### Task 9: **GATE C.** One component per tier, proven.

- [ ] **Step 1** — `Button`: pill geometry, press recipe, Resin material, focus halo.
- [ ] **Step 2** — `Card`: Haze fill, `haze-settle` ambient actually running on a mounted component.
- [ ] **Step 3** — `Dialog`: Resin surface, Mirage scrim, shader ambient attached and detached with the dialog.
- [ ] **Step 4** — `TextInput`: `field-focus`, `field-invalid`, Haze fill inside a Resin shell.
- [ ] **Step 5** — Port `audit-ambient.mjs` to the library and prove the rest state is within contract on a mounted React tree. **If ambient does not fire on a mounted Card, nothing downstream is trustworthy and the foundation is not done.**

---

## Section D onward — the catalogue, in slices

Each slice: implement, story, test, axe, visual evidence, `parity.json` status, report. Order follows dependency, not the catalogue's own order.

- **D — Utility and layout** (30): providers, portal, focus trap, transition, direction, then the box model.
- **E — Typography and actions** (16): the text scale, then buttons in every shape.
- **F — Inputs, part one** (22): text, number, password, search, textarea, select, checkbox, radio, switch, slider, segmented.
- **G — Inputs, part two** (22): combobox, multi-select, tags, pin, colour, the six date and time components, file and dropzone, transfer, cascader, mentions, rich text.
- **H — Forms** (Task: the whole form system): `useCrystalForm` over React Aria's form integration, Standard Schema validation so zod, valibot and arktype all work untouched, submission state, and a mutation adapter that accepts any `mutate` function — TanStack Query shaped, not TanStack Query dependent.
- **I — Navigation** (15) and **overlays** (10).
- **J — Data display** (31), ending with the data table.
- **K — Charts** (14) on a shared `chart-surface`.
- **L — Feedback** (14).

### Final gate

- [ ] `parity.json` reports every component `implemented` for `web`, or `not-applicable` with a reason.
- [ ] Accessibility and visual evidence across six palettes, both modes, both densities, full and reduced effects, both directions — CONTRACT §5, which is a library obligation and is not covered by the design system's own verification.
- [ ] Framework smoke tests: Next.js, TanStack Start, React Router, Gatsby, Redwood.
