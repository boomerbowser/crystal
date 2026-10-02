# Crystal component libraries

A component library implements Crystal for one platform. Each library has its own
repository, package manifest, tests and release process.

The first library is Crystal React (`@crystal-ui/react`, repository
`boomerbowser/crystal-react`). Its status is recorded in `status/web.json`, which
`tools/build-catalogue.cjs` merges into `parity.json`. A component is available on
a platform when that platform's record says `implemented`. A platform with no
record is `not-started` for every component.

## Requirements for a new library

The full contract is [`CONTRACT.md`](CONTRACT.md). In outline, a library must:

- Consume Crystal's published tokens and redeclare no value. The canonical source
  is `core/tokens/crystal.tokens.json`. The catalogue names every component's
  surface from `core/tokens/surfaces.json`, and a library implements each surface
  once.
- Implement the material hierarchy Plastic → Frost → Resin, plus Haze, Stone and
  Mirage, with techniques that suit the platform. A CSS approximation is not a
  native optical specification.
- Preserve the documented focus, selection, geometry, motion and reduced-effects
  contracts. They are in the specification chapters in `core/docs/`.
- Ship its own accessibility and visual-regression evidence. Crystal's
  verification covers the design system package and says nothing about a library
  built on it.

Parity across libraries is a release requirement. A component present in one
library is expected in the others, with the same states, semantics and token
bindings.
