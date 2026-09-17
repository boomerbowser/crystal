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
