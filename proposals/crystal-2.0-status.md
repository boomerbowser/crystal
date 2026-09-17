# Crystal 2.0 — coverage and status

The working reference for this upgrade. Every item in [the proposal](crystal-2.0.md) maps to a task in [the plan](crystal-2.0-plan.md) and carries a status here. Nothing in the proposal may be quietly dropped: if an item is not going to be done, it says so and why.

**Statuses:** `done` · `in progress` · `not started` · `deferred` (with a reason)

Last updated 2026-09-17.

## Decisions taken

| Question | Decision | Taken by |
| --- | --- | --- |
| Which platform first | **Web.** It is cross-platform in itself, which makes it the cheapest place to prove the parity contract. | Meridian |
| Icon set size | **~1000.** Source a permissively licensed set aligned with Crystal's grid if one exists; draw in-house otherwise. | Meridian |
| Registry | **Publish, privately.** GitHub Packages under the repository's owner, `@meridian/crystal-*`, with the ZIP remaining a release asset for non-package consumers. Products pin a version, which is what makes "one version per product" and a CI parity check enforceable; vendoring can do neither. The cost is that every product needs registry auth in CI, which is accepted. Publishing itself stays a human-triggered release step. | Delegated, decided in-session |
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
| Retire the duplicate material vocabulary | 13 | not started |

### B. Distribution and specificity

| Proposal item | Task | Status |
| --- | --- | --- |
| Cascade layers | 4 | done — gate G2 passed, zero pixels changed |
| Remove the `:root body` specificity prefix | 4 | done — 144 removed |
| Headless core: state derivation | 5 | done — 18 contract tests |
| Headless core: preferences and motion | 6 | done |
| Declarative controls, no DOM mutation | 7 | not started — gate G3 |

### C. Component parity

| Proposal item | Task | Status |
| --- | --- | --- |
| Component catalogue at full parity (~110-120) | 10 | in progress |
| Close the eleven orphaned motion families | 10 | in progress |
| Table given a Crystal surface | — | done — found in review, not in the original proposal |
| Icon set expanded to ~1000 | 8 | not started — gate G4 |
| Icon integrity check and gallery | 9 | not started |

### D. Platform contract

| Proposal item | Task | Status |
| --- | --- | --- |
| Written parity contract | 11 | not started |
| Machine-readable parity manifest | 10, 11 | in progress — generated from the catalogue |

### E. Verification

| Proposal item | Task | Status |
| --- | --- | --- |
| Visual regression harness | 14 | in progress — `compare-captures.py` exists and gated task 4; the frame set and capture script remain |
| Right-to-left as a first-class axis | 15 | not started |
| Forced-colour and reduced-transparency evidence | 16 | not started |
| Keep the existing contrast and integrity checks | — | done — unchanged at 1716 checks, 0 failures |

### F. Governance

| Proposal item | Task | Status |
| --- | --- | --- |
| Semantic versioning against a stated public contract | 12 | not started |
| Changelog | 12 | not started |
| Deprecate before removal | 12, 13 | not started |
| ZIP as a release asset | — | done — published as the v1.0.1 asset |

## Gates

| Gate | Condition | Status |
| --- | --- | --- |
| G1 | Generated theme CSS byte-identical | passed |
| G2 | Preview renders identically under cascade layers | passed — caught and fixed one real regression |
| G3 | Preview runs on the headless core with zero DOM mutation | not reached |
| G4 | Icon set vendored, licensed, normalised, existing symbols intact | not reached |

## Notes carried forward

- The regression capture from gate G2 is kept deliberately as evidence: it is the clearest illustration that unlayered CSS beats every layer, which is the behaviour products rely on and the behaviour a page's own scaffolding must opt out of.
- `controls.js` mutating the DOM remains the blocking item for any framework library. Nothing downstream of gate G3 should be considered settled until it passes.
- The v1.0.1 release is the last 1.x artifact. 2.0 breaks the legacy vocabulary and the specificity contract.
