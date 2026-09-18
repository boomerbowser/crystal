# Crystal 2.0 Implementation Plan

**Goal:** Turn Crystal from one hand-authored web preview into a versioned base that platform component libraries consume, without changing how Crystal looks.

**Architecture:** A DTCG token source becomes the single origin of truth; every stylesheet and platform export is generated from it. The stylesheet moves into cascade layers so consumers can override without out-specifying. Behaviour splits out of the DOM into a headless core, and the preview site is rebuilt as that core's first consumer. Components are specified, not implemented — products bring their own accessible primitives.

**Tech Stack:** W3C DTCG token format, Node generators (no new runtime deps), CSS cascade layers, Lucide ISC icons vendored and normalised, Python build/validation tooling already in the repo.

**Spec:** [crystal-2.0.md](crystal-2.0.md)

## Global constraints

- **Material specifications may only improve, never regress.** Any change to a material recipe requires before/after captures showing the improvement. The default position is that recipe numbers do not change at all.
- The visual identity is out of scope: Plastic → Frost → Resin, six materials, six palettes, Manrope 16/24, motion timings and the 5s ceiling all carry forward unchanged.
- The four approved baseline studies remain the acceptance standard.
- Stubbing is prohibited. Nothing unimplemented may be presented as working.
- Every gate is verified in a real browser in both light and dark, and at 390px.
- Accessibility adaptations — reduced motion, reduced transparency, forced colours — must survive every task.
- Commits are authored by Meridian Digital. No AI-tool references in tracked files.

## Gates

A gate is a point where the work stops if verification fails, because everything after it is built on top.

| Gate | Condition to pass |
|---|---|
| G1 after Task 2 | Generated `crystal-theme.css` is byte-identical to the 1.x file |
| G2 after Task 4 | Preview renders identically under cascade layers; six reference frames match |
| G3 after Task 7 | Preview runs on the headless core with zero DOM mutation |
| G4 after Task 9 | Icon set vendored, licensed, normalised, and every existing symbol still resolves |
| G5 after Task 17 | With spring physics disabled, every recipe reproduces its existing keyframes exactly; the twelve committed baselines still match |
| G6 after Task 19 | With WebGL2 unavailable, the preview renders exactly the committed baselines: a shader is an enhancement, never a requirement |

---

### Task 1: DTCG token source

**Files:**
- Create: `design-system/tokens/crystal.tokens.json`
- Create: `design-system/tools/build-tokens.cjs`
- Reference: `design-system/tokens/crystal.json` (the 1.x flat source, stays as generated output)

**Interfaces:**
- Produces: `crystal.tokens.json` with three tiers under `primitive`, `semantic`, `component`; each leaf `{ "$type", "$value", "$description" }`. Aliases use `{tier.path.name}` DTCG reference syntax.

- [ ] **Step 1:** Write `crystal.tokens.json`, deriving every value from `tokens/crystal.json`. Do not invent or round any value. Primitive tier carries raw colour/blur/duration values; semantic tier aliases primitives and names roles (`semantic.material.frost.diffusion` → `{primitive.blur.40}`); component tier aliases semantic.
- [ ] **Step 2:** Write `build-tokens.cjs`: resolve aliases, then emit the flat `--cr-*` CSS exactly as `crystal.js`'s `exportCSS()` does today.
- [ ] **Step 3:** Run it to a temp file and diff against the committed `assets/crystal-theme.css`.
- [ ] **Step 4:** Iterate until the diff is empty. **An empty diff is the proof that no material spec changed.**
- [ ] **Step 5:** Commit.

### Task 2: Wire the generator into the build — **GATE G1**

**Files:**
- Modify: `design-system/tools/build.py` (replace the inline node call that generates theme CSS)
- Modify: `design-system/package.json` (add `build:tokens`)

- [ ] **Step 1:** Point `build.py` at `build-tokens.cjs`.
- [ ] **Step 2:** Run `tools/build.py`; confirm `git diff --stat assets/crystal-theme.css` is empty.
- [ ] **Step 3:** Run `npm test` and `tools/validate.py`. Expect 1716 contrast checks, 0 failures; 0 integrity errors.
- [ ] **Step 4:** Capture the six reference frames; compare to `validation/captures/`.
- [ ] **Step 5:** Commit. **If the diff is not empty, stop and report rather than accepting the new values.**

### Task 3: Platform exports

**Files:**
- Modify: `design-system/tools/build-tokens.cjs`
- Create: `design-system/exports/crystal-tokens.ts`, `.swift`, `.kt` (generated)

- [ ] **Step 1:** Emit TypeScript (`as const` object + literal union type), Swift (`enum Crystal` with static lets), Kotlin (`object Crystal`) from the resolved semantic tier.
- [ ] **Step 2:** Assert in the generator that all three exports contain the same key count as the CSS output; fail the build otherwise.
- [ ] **Step 3:** Run the build; inspect each export for a spot-checked value against `crystal.json`.
- [ ] **Step 4:** Commit.

### Task 4: Cascade layers — **GATE G2**

**Files:**
- Modify: `design-system/assets/crystal.css`, `controls.css`, `site.css`

- [ ] **Step 1:** Declare `@layer crystal.reset, crystal.material, crystal.component, crystal.site, crystal.override;` once, at the top of `crystal.css`.
- [ ] **Step 2:** Wrap each stylesheet's rules in its layer.
- [ ] **Step 3:** Strip the `:root body` prefix everywhere it exists purely to win specificity (116 occurrences). Keep it only where it encodes a real ancestor requirement.
- [ ] **Step 4:** Reload the preview. Compare the six reference frames. Any difference is a regression to fix, not to accept.
- [ ] **Step 5:** Verify a plain unlayered rule in a consumer stylesheet now beats Crystal, by injecting one in the browser and confirming it wins.
- [ ] **Step 6:** Run `npm test` and `tools/validate.py`. Commit.

### Task 5: Headless core — state derivation

**Files:**
- Create: `design-system/src/core/state.js`
- Create: `design-system/tests/core-state.test.cjs`

**Interfaces:**
- Produces: `resolveIndicator({pressed, selected, checked, current, busy}) -> 'selection'|'current'|'busy'|null`; `resolveFieldState({required, invalid, focused, empty}) -> 'required'|'invalid'|'focused'|'idle'`; `rangeProgress({value, min, max}) -> number` (0–100).

- [ ] **Step 1:** Write failing tests covering: busy wins over current, current wins over selection, a check is never returned, invalid outranks required, range clamps outside its bounds, and a zero-width range does not divide by zero.
- [ ] **Step 2:** Run them; expect failure.
- [ ] **Step 3:** Implement `state.js` as pure functions — no DOM access of any kind.
- [ ] **Step 4:** Run tests; expect pass. Commit.

### Task 6: Headless core — preferences and export

**Files:**
- Create: `design-system/src/core/preferences.js`
- Modify: `design-system/tests/core-state.test.cjs`

**Interfaces:**
- Produces: `normalisePreferences(input) -> Preferences` (clamps atmosphere 15–90, tint 35–85, elevation 60–150, radius 14–28, motionSpeed 0.25–2); `resolveDuration(base, motionSpeed, reduceMotion) -> number` capped at 5000, returning 0 when reduced.

- [ ] **Step 1:** Write failing tests: every range clamps at both ends; `resolveDuration` caps at 5000; reduced motion returns 0; 0.25× on the 1400ms liquid recipe caps rather than returning 5600.
- [ ] **Step 2:** Run; expect failure. Implement. Run; expect pass.
- [ ] **Step 3:** Commit.

### Task 7: Declarative controls — **GATE G3**

**Files:**
- Rewrite: `design-system/assets/controls.js`
- Modify: `design-system/index.html`, `motion.html` (author the field shells and indicators in markup)

- [ ] **Step 1:** Write the field shell and indicator elements directly into the HTML, so no element is created at runtime.
- [ ] **Step 2:** Rewrite `controls.js` to only *read* state and set attributes/custom properties via the headless core. Remove `document.createElement`, `append`, `before`, and the `MutationObserver`.
- [ ] **Step 3:** Assert in the browser that `controls.js` creates no elements: count `.cr-indicator` and `.cr-field-shell` before and after scripts run; the counts must match.
- [ ] **Step 4:** Compare the six reference frames. Verify keyboard focus, selection rails, field badges and range fills all still behave.
- [ ] **Step 5:** Run `npm test`, `tools/validate.py`, and the real-engine motion contract checks in the browser. Commit.

### Task 8: Vendor and normalise the icon set

**Files:**
- Create: `design-system/tools/build-icons.cjs`
- Create: `design-system/assets/icons/*.svg` (generated, vendored)
- Create: `design-system/assets/icons/manifest.json`
- Create: `design-system/reference/licenses/lucide-LICENSE.txt`
- Modify: `design-system/assets/icons.svg` (core sprite)

- [ ] **Step 1:** Write `build-icons.cjs`: read `lucide-static/icons`, exclude brand marks and redundant variants, curate to ~1000, normalise each to Crystal's contract (24px viewBox, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.8"`, round caps/joins), strip the wrapper comment and class.
- [ ] **Step 2:** Copy the ISC licence into `reference/licenses/` and record it in `ASSET-NOTICES.md`.
- [ ] **Step 3:** Emit `manifest.json` with name, category and keywords per icon.
- [ ] **Step 4:** Keep Crystal's 13 original symbols authoritative — they are original work and must not be replaced by a sourced icon of the same name.
- [ ] **Step 5:** Run; verify count, spot-check five icons render, confirm the licence file exists. Commit.

### Task 9: Icon gallery and integrity check — **GATE G4**

**Files:**
- Modify: `design-system/tools/validate.py` (assert every `icons.svg` symbol referenced by any page exists)
- Create: an icon gallery section in the specification

- [ ] **Step 1:** Add the integrity assertion; run it and confirm it passes against current pages.
- [ ] **Step 2:** Deliberately break one reference; confirm the check fails. Restore it.
- [ ] **Step 3:** Add a searchable gallery to the components chapter, reading `manifest.json`.
- [ ] **Step 4:** Verify in the browser, both modes. Commit.

### Task 10: The component catalogue

Parity is measured against the most fully-featured libraries in use — Mantine, Ant Design and MUI — not against a shorter list Crystal finds convenient. That is roughly 110-120 components.

**Files:**
- Create: `design-system/tokens/catalogue/*.json` (one file per category)
- Create: `design-system/tools/build-catalogue.cjs`
- Create: `design-system/docs/catalogue.md` (generated)
- Create: `libraries/parity.json` (generated)

**Interfaces:**
- Produces: a catalogue entry per component with `id`, `name`, `anatomy`, `states`, `material`, `geometry`, `semantics`, `crystal` (what the system supplies), `product` (what the product owns), optional `motion` recipe ids, and `parity` references naming the equivalent in other libraries.

- [ ] **Step 1:** Author the catalogue as data, one JSON file per category, so every contract has the same shape and none can be half-written.
- [ ] **Step 2:** Each entry states what Crystal supplies and what the product owns, following the decision that Crystal specifies appearance and products bring their own accessible primitives.
- [ ] **Step 3:** Write the generator, emitting the specification chapter and the parity manifest from the same source.
- [ ] **Step 4:** Assert every motion recipe family maps to a catalogue entry. The eleven orphaned families must drop to zero.
- [ ] **Step 5:** Assert every catalogue entry carries a non-empty `crystal` and `product` statement, so no contract can be a placeholder.
- [ ] **Step 6:** Add the chapter to the specification navigation. Rebuild, validate, commit.

### Task 11: Parity manifest and platform contract

**Files:**
- Create: `libraries/parity.json`, `libraries/CONTRACT.md`

- [ ] **Step 1:** Write `parity.json`: every component, with per-library implementation status, defaulting to `"not-started"` — an honest empty state, not a stub.
- [ ] **Step 2:** Write `CONTRACT.md` with the five parity requirements from the spec.
- [ ] **Step 3:** Commit.

### Task 12: Governance

**Files:**
- Create: `CHANGELOG.md`
- Modify: `design-system/package.json` (publishConfig, files allowlist, version 2.0.0)
- Modify: `design-system/docs/adoption.md`

- [ ] **Step 1:** Write `CHANGELOG.md` in Keep a Changelog format, with 1.0.0, 1.0.1 and an Unreleased 2.0.0 section listing the breaking changes.
- [ ] **Step 2:** Add `publishConfig` targeting GitHub Packages, private, and a `files` allowlist. Do not publish — that is a release step for the team to trigger.
- [ ] **Step 3:** Document the versioning contract in the adoption chapter: what is public API, and the deprecate-then-remove rule.
- [ ] **Step 4:** Rebuild, validate, commit.

### Task 13: Deprecate the legacy material vocabulary

**Files:**
- Modify: `design-system/tools/build-tokens.cjs`, `design-system/assets/crystal.css`, `design-system/docs/adoption.md`

- [ ] **Step 1:** Emit `--cr-acrylic-*`, `--cr-glass-*` and `--cr-mica-*` as generated aliases of the Frost, Resin and Plastic tokens, marked deprecated in the token source.
- [ ] **Step 2:** Keep `.cr-acrylic` and `.cr-glass` as class aliases, documented as deprecated.
- [ ] **Step 3:** Record the removal version in the adoption chapter and the changelog. Deprecate before removal; never remove in the same version that deprecates.
- [ ] **Step 4:** Rebuild, confirm the theme CSS still contains both vocabularies, validate, commit.

### Task 14: Visual regression harness

**Files:**
- Modify: `design-system/tools/compare-captures.py`
- Create: `design-system/tools/capture-frames.mjs`, `design-system/validation/frames.json`

- [ ] **Step 1:** Define the frame set as data: page, scroll anchor, palette, mode, density, effects and viewport.
- [ ] **Step 2:** Write a capture script that drives a real browser over the frame set and writes PNGs.
- [ ] **Step 3:** Compare against committed baselines with `compare-captures.py`; exit non-zero on any difference.
- [ ] **Step 4:** Commit the baselines and document how to re-bless them deliberately.

### Task 15: Right-to-left as a verified axis

**Files:**
- Modify: `design-system/assets/*.css`, `design-system/tools/validate.py`, `design-system/docs/accessibility.md`

- [ ] **Step 1:** Audit every physical direction property and replace with logical properties where the meaning is directional.
- [ ] **Step 2:** Confirm the directional bubble corner, the selection rail, field badges and the range track all mirror.
- [ ] **Step 3:** Capture RTL frames in both modes and add them to the evidence.
- [ ] **Step 4:** Add an RTL row to the verification report. Commit.

### Task 16: Reduced-effect and forced-colour evidence

**Files:**
- Modify: `design-system/tools/report.py`, `design-system/validation/captures/`

- [ ] **Step 1:** Capture reduced transparency, reduced motion and forced colours for the playground and one specification page.
- [ ] **Step 2:** Add them to the report's evidence list, described as captures of the adaptations rather than as a conformance claim.
- [ ] **Step 3:** Commit.

### Task 17: Spring physics for every recipe

**Files:** `tokens/motion-recipes.json`, `assets/core/spring.js` (create),
`tools/validate-motion.cjs`, `tests/core-contracts.cjs`

- [ ] **Step 1** — Write `assets/core/spring.js` as pure derivation, no DOM: `settleTime({stiffness, damping, mass})` returning milliseconds to rest within 0.1%, and `sampleSpring(spec, t)` returning normalised displacement. Same UMD pattern as `state.js`.
- [ ] **Step 2** — Write the failing contract tests: a critically damped spring must not overshoot; an underdamped one must; settle time must rise as stiffness falls; reduced motion must resolve to zero regardless of spring.
- [ ] **Step 3** — Add `spring: {stiffness, damping, mass}` to all 54 recipes, chosen so the derived settle time matches the authored `duration` within 15%. Do not change `duration` or `keyframes`.
- [ ] **Step 4** — Extend `validate-motion.cjs` to assert every recipe has a spring and that derived settle time and authored duration agree within tolerance. Document that the authored bound (2000ms) and the runtime ceiling (5000ms, after the user speed factor) are different limits.
- [ ] **Step 5** — **GATE G5.** With springs disabled, every recipe renders exactly its existing keyframes. Prove with `npm run verify:visual` against committed baselines.

### Task 18: Make deformation incompressible

**Files:** `tokens/motion-recipes.json`, `tools/validate-motion.cjs`, `assets/motion.js`

- [ ] **Step 1** — Write the failing validator: every `scale(sx, sy)` in a recipe keyframe must satisfy `|sx·sy − 1| ≤ 0.005`. Expect 17 failures across 7 recipes.
- [ ] **Step 2** — Correct each one by dividing **both** axes by the square root of the area. This was changed during implementation: keeping the dominant axis and deriving the other also conserves volume, but it changes the deformation's aspect ratio, which alters the designed look rather than only the physics. Normalising by the square root conserves volume *and* preserves aspect ratio exactly, so the correction removes the compressibility error and nothing else. The tool asserts no aspect ratio moved.
- [ ] **Step 3** — Apply the same rule to the inline deformations in `assets/motion.js` (the Resin preset and the `::before` morphs).
- [ ] **Step 4** — Re-bless the affected baselines, recording in the capture README that the change is a deliberate material improvement with the before and after areas stated.

### Task 19: The shader layer

**Files:** `assets/shaders/*.frag` (create), `assets/shaders/manifest.json` (create), `assets/motion-shaders.js` (create), `docs/motion.md`

- [ ] **Step 1** — Author the uniform contract first, as `assets/shaders/manifest.json`: every shader declares the uniforms it consumes (`u_time`, `u_resolution`, `u_pressure`, `u_contact`, `u_tint`), its material, and its degradation path. The contract is the portable artefact; the GLSL is one implementation of it.
- [ ] **Step 2** — Write the fragment shaders: Resin refraction, Resin caustics, Frost displacement, Mirage flow.
- [ ] **Step 3** — Write `motion-shaders.js`: attach to a surface only when WebGL2 is available, `prefers-reduced-motion` is not set, and the element is visible. Never required for correctness — the CSS approximation remains the floor.
- [ ] **Step 4** — Prove degradation: with WebGL2 unavailable the page must render exactly the committed baselines. This is the gate that keeps the shader an enhancement.

### Task 20: Motion parity across platforms

**Files:** `libraries/CONTRACT.md`, `libraries/parity.json`, `tools/build-catalogue.cjs`

- [ ] **Step 1** — Extend the contract with a motion section: springs are the portable primitive, with the mapping to SwiftUI, Compose and Motion stated explicitly.
- [ ] **Step 2** — State the shader mapping — GLSL to Metal Shading Language and AGSL — and that the uniform contract, not the GLSL, is what a platform must honour.
- [ ] **Step 3** — Emit motion and shader parity into `parity.json` from the same source, so it cannot drift from the recipes.

---

## Section H — One site, one shell, complete documentation

The preview grew four independent copies of the page shell: `tools/build.py` (docs pages),
`tools/report.py` (verification), and the hand-authored `index.html` and `motion.html`.
That is why the top navigation points at `index.html#foundations` anchors the specification
pages do not have, and why the docs sidebar and the site navigation disagree about what the
site contains. The fix is not to restyle four copies. It is to leave one.

### Task 21: Unify the shell

**Files:** `tools/shell.py` (create), `tools/build.py`, `tools/report.py`,
`src/pages/*.html` (create), `index.html`, `playground.html`, `motion.html`

- [x] **Step 1** — Write `tools/shell.py` as the only place the header, navigation and footer
  exist. It is depth-aware: pages at the site root get `prefix=''`, pages in `docs/` get `'../'`.
- [x] **Step 2** — Move the body of the current `index.html` into `src/pages/playground.html`
  and the body of `motion.html` into `src/pages/motion.html`. These fragments are the hand-
  authored content; everything around them becomes generated.
- [x] **Step 3** — Generate `playground.html` and `motion.html` from those fragments.
- [x] **Step 4** — Have `report.py` import the same shell rather than carry its own copy.
- [x] **Step 5** — Prove it: `grep -rl 'site-nav' *.html docs/ validation/ tests/` returns nothing.
  A shell that still has a second copy has not been unified.

### Task 22: The side menu, built from Crystal's own controls

**Files:** `tools/shell.py`, `assets/site.css`

- [x] **Step 1** — Collapse the top navigation into the sidebar. The sidebar is the whole
  site index: Overview, Playground, the ten specification pages, Motion studies, Verification.
- [x] **Step 2** — Build the entries as Crystal pill controls, not bare links. Action controls
  are pill-shaped; the current `doc-nav a` uses a 10px radius, which violates that rule.
- [x] **Step 3** — The current page is marked with `aria-current="page"`, and marked visually
  with a rail and weight, never a check mark.
- [x] **Step 4** — Forced colours: the current entry is a `Highlight` ring, never a fill.
  A filled `--cr-primary-soft` row is the same defect already fixed on the segmented control —
  Chromium's text backplate paints `Canvas` over the label and the text disappears.
- [x] **Step 5** — The sidebar is Frost holding Plastic pills. Resin never appears here, and
  `npm run audit:materials` must report zero violations rather than the rule being asserted.

### Task 23: The documentation home becomes the index

**Files:** `docs/overview.md` (create), `tools/build.py`, `index.html`, `vercel.json`

- [x] **Step 1** — Write `docs/overview.md`: what Crystal is, the material hierarchy at a
  glance, and a card per specification section. Not a redirect — a real first page.
- [x] **Step 2** — Generate it to `index.html` at the site root.
- [x] **Step 3** — Preserve inbound `index.html#playground` links with a hash forward. Fragments
  never reach the server, so this cannot be a `vercel.json` redirect; it has to be two lines of
  script in the page.
- [x] **Step 4** — Cross-link both directions: every Playground section links to its
  specification, every specification section links back to the Playground that demonstrates it.
  `validate.py` already checks that every anchor exists, so a broken cross-link fails the build.

### Task 24: Documentation that contains the whole system

**Files:** `docs/*.md`, `tools/build-reference.cjs` (create)

- [x] **Step 1** — Generate what is derivable, so it cannot drift: the token reference from
  `tokens/crystal.tokens.json`, the motion recipe reference from `tokens/motion-recipes.json`
  with derived damping ratios and measured overshoot, and the shader contract from
  `assets/shaders/manifest.json`.
- [x] **Step 2** — Write the explanations that currently exist only in CSS comments and capture
  READMEs. Named gaps: Resin-never-inside-Resin and why; the Haze recess; the forced-colours
  text backplate; why not ripples; the six-layer focus recipe; the selection rail.
- [x] **Step 3** — Every rule gets a live specimen in the page, not a screenshot. The docs pages
  already load `crystal.css` and `controls.css`, so a specimen is real and is audited by
  `audit-materials.mjs` like any other composition.
- [x] **Step 4** — **GATE G7.** `validate.py` reports zero errors across the moved tree, every
  affected baseline is re-blessed with a README stating what moved and why, and the material
  audit is clean including the new specimens.

---

## Section I — Light, and materials that move at rest

Meridian pointed at JolyUI's Liquid Metal button as an illustration of what "more motion"
means, and restated the material rules it implies. The reference is instructive for
*behaviour*, not for appearance: its bands are anisotropic reflection, which is a metal
phenomenon. Crystal is glass. What transfers is that the surface is alive at rest, that
light through it is chromatic, and that interaction adds energy rather than starting the
effect.

The requested rules:

- **Resin and Frost** refract light *and colour* in their animations, in different amounts
  and different ways.
- **Plastic** carries the base glow of its primary colour plus the tint the active scheme
  gives it.
- Refraction **affects the shadow** a surface casts.
- **Haze and Stone** have edges that appear to move on their own, travelling outward and
  inward rather than tracing the perimeter.

### The structural decision

"Edges that appear to move on their own" means *at rest, by default*. That contradicts
three things this repository currently states: `libraries/CONTRACT.md` §7 "never at rest",
the motion memory's "nothing autoplays", and gate G6's pixel identity with WebGL2 absent.

This is Meridian authorising a specification change, so the rules are rewritten rather than
excepted:

- Ambient motion becomes the material's **declared rest state**, on by default wherever
  WebGL2, motion preference and transparency preference allow.
- Reference frames seed ambient **off**, the same way they seed palette and mode. A moving
  surface cannot be captured deterministically; this is a property of the gate, not a dodge.
- §7 is rewritten: a shader paints during a motion **or during ambient**, and reference
  frames capture ambient disabled.

### Task 25: The CSS floor

**Files:** `assets/crystal.js`, `assets/controls.css`, `tokens/motion-recipes.json`,
`tools/capture-frames.mjs`, `validation/frames.json`

- [x] **Step 1** — Rewrite `haze-settle`, `haze-tide` and `stone-contour`. They were
  authored as opacity oscillations, and opacity pulsing is not an edge that moves. They
  become radial breathing of the boundary — `clipPath: inset(N round R)` on the isolated
  paint layer with N travelling outward and inward. The recess shadow pair stays fixed,
  because the light source does not move, and the text above never moves at all.
- [x] **Step 2** — Plastic emits rather than refracts, because it is opaque. A soft radial
  bloom of `--cr-glow` over the existing atmosphere gradient, drifting slowly.
- [x] **Step 3** — Tint the shadow. Coloured glass casts a coloured shadow, so the palette's
  companion mixes into `--cr-shadow-*` in `crystal.js`. The generated theme CSS stops being
  byte-identical; that is deliberate and is recorded.
- [x] **Step 4** — Seed `ambient: false` in `preferencesFor()` so every frame captures a
  still surface, and say so in each frame's `why`.
- [x] **Step 5** — Re-bless all eighteen frames with one README and one reason.

### Task 26: The shader tier

**Files:** `assets/motion-shaders.js`, `assets/shaders/*.frag`, `assets/shaders/manifest.json`

- [x] **Step 1** — Ambient loop: Resin and Frost attach at rest, only while intersecting the
  viewport, released on `visibilitychange`, and hard-capped well under Chromium's ~16 live
  WebGL contexts. Haze, Stone and Plastic stay CSS, which is cheap enough to be everywhere.
- [x] **Step 2** — Frost refracts differently from Resin, and physics decides how. At 40px
  nothing sharp survives, so Frost's refraction is a slow, broad colour-temperature wander
  at low amplitude. Resin at 20px keeps detail, so its dispersion stays sharp and
  rim-concentrated. Light through frosted glass shows colour, not shape.
- [x] **Step 3** — Interaction adds energy instead of silencing it. `hush()` was written to
  pause ambient on any interaction; the reference rises from 0.6 at rest to 1 on hover and
  2.4 on press. Hover and press raise `u_intensity` and let it decay. Pausing is kept only
  for text entry, because a surface being read is the one place motion must not compete.
- [x] **Step 4** — No new uniform. `u_intensity` carries ambient energy; every uniform added
  is a contract change for three platforms.

### Task 27: Say it in the specification

**Files:** `docs/materials.md`, `libraries/CONTRACT.md`, `docs/motion.md`

- [x] **Step 1** — `materials.md` gains a **Light** section stating each material's optical
  behaviour as a rule: what refracts, what emits, what breathes, and what that does to the
  shadow.
- [x] **Step 2** — Rewrite CONTRACT §7 and extend §8. "Never at rest" becomes "during a
  motion or during ambient", with reference capture stated as the reason frames stay stable.
- [x] **Step 3** — **GATE G8.** With WebGL2 unavailable *and* ambient disabled, every page
  renders exactly the committed baselines. The CSS floor remains the floor: ambient is an
  enhancement on top of it, never a requirement.

---

## Section J — The rest state, corrected

Section I specified ambient motion and shipped it unlooked-at. See R19. The work here is
the correction and, more importantly, the two gates that make the class of fault visible.

### Task 28: A rest state that is actually at rest

- [x] **Step 1** — Ambient options per shader instead of one shared set. `progress: 1` is
  the peak of a press; Resin's rest progress is a shallow oscillation and its contact point
  is resolved per frame so the specular band travels around the rim.
- [x] **Step 2** — Panel geometry in units of the short side. In 0..1 uv a "corner radius"
  and a band "thickness" mean different distances on each axis, so the lens contour cannot
  follow a non-square element. `panelSpace()` in `_common.glsl`, set once per frame.
- [x] **Step 3** — Depth and width are one quantity: a shallow lens is a narrow one. At
  `progress: 1` the term resolves to the original 0.20, so the press response is unchanged.
- [x] **Step 4** — Parse the palette tint properly. `--cr-companion` is authored as hex and
  was being read by a bare digit scan; before that the code read `--cr-accent`, which no
  palette defines. It is the token `exportCSS` mixes the shadow tint from, so light and the
  shadow it casts agree.

### Task 29: Gates that can see ambient

- [x] **Step 1** — `tools/audit-ambient.mjs`: difference each ambient surface against a
  still capture of itself. Bound interior mean and rim mean, and put a **floor** under rim
  max — the invisible failure is as real as the embossing one.
- [x] **Step 2** — Prove each bound fails on demand by reintroducing the fault it describes.
- [x] **Step 3** — Frames may pin `data-ambient-clock` and clip to a specimen, because the
  material studies sit below the fold of every viewport frame. Two frames added.
- [x] **Step 4** — Prove the frames catch it: reintroducing the regression changes 4474
  pixels in `materials-at-rest` where all eighteen previous frames stayed identical.

### Task 30: Haze and Stone actually move

- [x] **Step 1** — `haze-settle` was an ambient recipe nothing started; Stone had none at
  all, only the `stone-contour` replay study. Add `stone-settle` (60 recipes).
- [x] **Step 2** — `CrystalMotion.ambientAll()` starts both as surfaces intersect. Haze
  breathes outward, Stone draws inward, so neighbouring fills never pulse in unison.
- [x] **Step 3** — One ambient rate table. The shader tier kept a second copy that had
  already drifted — zero on text focus, no blur handler — so leaving a field froze every
  shader until the next click. `motion.js` owns it and broadcasts it.
- [x] **Step 4** — Correct `docs/motion.md` and `CONTRACT.md` §8: Haze and Stone run on the
  animation tier, Plastic alone is CSS.
