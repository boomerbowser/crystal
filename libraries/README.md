# Crystal component libraries

One sub-folder per platform. Each is intended to be extracted into its own repository, so each keeps its own package manifest, tests and release process.

No library has been implemented yet. This folder currently defines the convention only — it contains no packages, and nothing here should be described as available.

## Convention for a new library

A library sub-folder is named for its platform (for example `react`, `swiftui`, `compose`). It must:

- Consume Crystal's published tokens rather than redeclaring values. The canonical source is `design-system/tokens/crystal.json`.
- Implement the material hierarchy Plastic → Frost → Resin, plus Haze, Stone and Mirage, using platform-appropriate techniques. A CSS approximation is not a native optical specification.
- Preserve the documented focus, selection, geometry, motion and reduced-effects contracts. See the specification chapters in `design-system/docs/`.
- Ship its own accessibility and visual-regression evidence. Crystal's verification covers the design system package, not a library built on it.

Parity across libraries is a release requirement: a component present in one library is expected in the others, with the same states, semantics and token bindings.
