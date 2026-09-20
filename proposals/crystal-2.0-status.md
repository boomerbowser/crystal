# Crystal 2.0 — coverage and status

The working reference for this upgrade. Every item in [the proposal](crystal-2.0.md) maps to a task in [the plan](crystal-2.0-plan.md) and carries a status here. Nothing in the proposal may be quietly dropped: if an item is not going to be done, it says so and why.

**Statuses:** `done` · `in progress` · `not started` · `deferred` (with a reason)

Last updated 2026-09-17.

Branch `crystal-2.0`, ahead of `main` and **not merged**. Merging, publishing to the registry and cutting a release are release decisions and are deliberately left to Meridian.

## Decisions taken

| Question | Decision | Taken by |
| --- | --- | --- |
| Which platform first | **Web.** It is cross-platform in itself, which makes it the cheapest place to prove the parity contract. | Meridian |
| Icon set size | **~1000.** Source a permissively licensed set aligned with Crystal's grid if one exists; draw in-house otherwise. | Meridian |
| Registry | **Publish, privately.** GitHub Packages under the repository's owner, `@crystal-ui/core-*`, with the ZIP remaining a release asset for non-package consumers. Products pin a version, which is what makes "one version per product" and a CI parity check enforceable; vendoring can do neither. The cost is that every product needs registry auth in CI, which is accepted. Publishing itself stays a human-triggered release step. | Delegated, decided in-session |
| Composite components | **Specify appearance; products bring their own accessible primitives.** Crystal defines anatomy, states, material and geometry. It does not ship focus management, menu keyboard behaviour or date arithmetic. | Meridian |

## Standing constraint

Material specifications may only improve, never regress. The default position is that no recipe number changes at all. Gate G1 exists to prove this mechanically: the generated theme CSS must stay byte-identical.

## Coverage

### A. Token architecture

| Proposal item | Task | Status |
| --- | --- | --- |
| Three-tier tokens | 1 | done |
| W3C DTCG format as the authoring source | 1 | done |
| Generated CSS from the token source | 2 | done — gate G1 passed, theme CSS byte-identical |
| TypeScript, Swift, Kotlin exports | 3 | done — 94 tokens, collision-guarded |
| Retire the duplicate material vocabulary | 13 | done — deprecated with removal named for 3.0.0; both vocabularies still ship |

### B. Distribution and specificity

| Proposal item | Task | Status |
| --- | --- | --- |
| Cascade layers | 4 | done — gate G2 passed, zero pixels changed |
| Remove the `:root body` specificity prefix | 4 | done — 144 removed |
| Headless core: state derivation | 5 | done — 18 contract tests |
| Headless core: preferences and motion | 6 | done |
| Declarative controls, no DOM mutation | 7 | done — gate G3 passed; zero elements created, zero observers |

### C. Component parity

| Proposal item | Task | Status |
| --- | --- | --- |
| Component catalogue at full parity (~110-120) | 10 | done — 119 components across 9 categories |
| Close the eleven orphaned motion families | 10 | done — zero orphans; material choreography exempted by category |
| Table given a Crystal surface | — | done — found in review, not in the original proposal |
| Headless core: state and preferences | 5, 6 | done — 18 contract tests |
| Icon set expanded to ~1000 | 8 | done — 1011 icons (998 Lucide ISC + 13 Crystal originals) |
| Icon integrity check and gallery | 9 | done — searchable gallery; integrity check proven to fire on a broken reference |

### D. Platform contract

| Proposal item | Task | Status |
| --- | --- | --- |
| Written parity contract | 11 | done — libraries/CONTRACT.md |
| Machine-readable parity manifest | 10, 11 | done — generated from the catalogue, 119 entries x 4 platforms |

### E. Verification

| Proposal item | Task | Status |
| --- | --- | --- |
| Visual regression harness | 14 | **done** — frame set as data (12 frames), `tools/capture-frames.mjs` drives a real browser over it, `tools/verify-frames.mjs` gates against 12 committed baselines, and the re-blessing procedure is documented. Proven deterministic: two independent runs compared identical on all 12. |
| Right-to-left as a first-class axis | 15 | done — primitives use logical properties; mirroring verified and captured |
| Forced-colour and reduced-transparency evidence | 16 | done — both axes captured, and each caught a real defect. Reduced transparency: white-on-white selected controls. Forced colours: the selected segment's label erased by Chromium's text backplate. |
| Keep the existing contrast and integrity checks | — | done — unchanged at 1716 checks, 0 failures |

### G. Motion (added after review, 2026-09-17)

| Proposal item | Task | Status |
| --- | --- | --- |
| Spring physics as the portable primitive | 17 | **done** — all 54 recipes carry a fitted spring; worst drift from the authored duration is 0.31%. Gate G5 passed. |
| Incompressible deformation (17 keyframes across 7 recipes) | 18 | **done** — 17 corrections across 9 recipes, worst area error 35.1%, every aspect ratio preserved exactly. |
| Shader layer with a portable uniform contract | 19 | not started |
| Motion and shader parity across platforms | 20 | not started |

### H. Material law (added after review, 2026-09-17)

| Proposal item | Task | Status |
| --- | --- | --- |
| Resin may never contain Resin; upper layers are Haze content fills | — | **done** — indicator converted from Resin to Haze, structural rule added, 0 violations across 13 pages |
| Automated material-stacking audit | — | **done** — `tools/audit-materials.mjs`, classifies by blur recipe so the intended Plastic → Frost → Resin hierarchy is not falsely reported |
| Haze informed by neumorphic shadow, feather and light-source practice | — | in progress |

### F. Governance

| Proposal item | Task | Status |
| --- | --- | --- |
| Semantic versioning against a stated public contract | 12 | done — public contract enumerated in the adoption chapter |
| Changelog | 12 | done — CHANGELOG.md, Keep a Changelog format |
| Deprecate before removal | 12, 13 | done — rule documented; the removal version is named at deprecation |
| ZIP as a release asset | — | done — published as the v1.0.1 asset |

## Gates

| Gate | Condition | Status |
| --- | --- | --- |
| G1 | Generated theme CSS byte-identical | passed |
| G2 | Preview renders identically under cascade layers | passed — caught and fixed one real regression |
| G3 | Preview runs on the headless core with zero DOM mutation | passed |
| G4 | Icon set vendored, licensed, normalised, existing symbols intact | passed |

## Notes carried forward

- Adding the reduced-transparency axis immediately caught a defect that four full-effects frames had missed: selected controls rendered white-on-white at 1:1 contrast. A visual gate is only as good as the states it covers.

- The harness needed a noise allowance and it was worth being careful about one. Captures are not bit-identical between runs: GPU rasterisation dithers gradients by a channel step or two, moving about a hundred pixels of one frame. The allowance forgives up to 400 pixels past a delta of 2, but `compare-captures.py` fails on **any** pixel past a delta of 24 regardless of the allowance, and `tests/visual-gate-contracts.py` proves it — one black pixel on a grey field still fails with the allowance set to a million. A percentage-changed threshold, the usual shortcut, would not have that property.

- The forced-colours axis then caught a second defect the same way, and a subtler one: the selected segment used `background: Highlight; color: HighlightText`, which is the conventional pairing and passes any contrast calculation you run on it. It still rendered an unreadable black block, because Chromium paints an opaque `Canvas` text backplate above the element's own background, and in the dark palette `HighlightText` and `Canvas` are both black. No arithmetic check could have found this; only looking at the pixels did. Both defects argue the same thing — the value of a visual gate is in the axes it covers, which is why the frame set is now data.

- The regression capture from gate G2 is kept deliberately as evidence: it is the clearest illustration that unlayered CSS beats every layer, which is the behaviour products rely on and the behaviour a page's own scaffolding must opt out of.
- The DOM-mutation blocker is cleared. `controls.js` now only reads state and sets attributes on elements that already exist, so a framework binding can replace it wholesale against the same headless core.
- The v1.0.1 release is the last 1.x artifact. 2.0 breaks the legacy vocabulary and the specificity contract.
