# Crystal component libraries

One sub-folder per platform. Each is intended to be extracted into its own repository, so each keeps its own package manifest, tests and release process.

The first library, Crystal React (`@crystal-ui/react`, repository `boomerbowser/crystal-react`), is implemented against this contract and recorded in `status/web.json`, which `tools/build-catalogue.cjs` merges into `parity.json`. A component is available on a platform when that platform's record says `implemented`; a platform with no record is `not-started` throughout.

## Convention for a new library

A library sub-folder is named for its platform (for example `react`, `swiftui`, `compose`). It must:

- Consume Crystal's published tokens rather than redeclaring values. The canonical source is `core/tokens/crystal.tokens.json`; every component's surface is named in the catalogue from `core/tokens/surfaces.json`, and a library implements each surface once.
- Implement the material hierarchy Plastic → Frost → Resin, plus Haze, Stone and Mirage, using platform-appropriate techniques. A CSS approximation is not a native optical specification.
- Preserve the documented focus, selection, geometry, motion and reduced-effects contracts. See the specification chapters in `core/docs/`.
- Ship its own accessibility and visual-regression evidence. Crystal's verification covers the design system package, not a library built on it.

Parity across libraries is a release requirement: a component present in one library is expected in the others, with the same states, semantics and token bindings.
