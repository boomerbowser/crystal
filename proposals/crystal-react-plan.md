# Crystal React

**The implementation plan is in the Crystal React repository**, at
`docs/implementation-plan.md`: a separate repo and a separate folder, as Meridian
directed. It is kept current, and it holds the requirements traced to the sections
that answer them, the architecture, all 174 components enumerated by slice, and the
gates.

There is one plan, and it is kept there because implementers work in the React
repository. A plan they cannot see while working goes stale.

What stays here is the record of how Crystal React relates to the design system.

## Why it is a separate repository

`libraries/README.md` always intended each platform library to be extracted into its own
repository. Crystal React is the first, at `boomerbowser/crystal-react`, consuming
`@crystal-ui/core` rather than vendoring it. The design system does not depend on it.

## What the design system had to provide

CONTRACT §1 tells a library to import Crystal's generated exports and reuse the resolver's
arithmetic. The package did not make that possible: it exported only `./core` pointing at
`state.js`, untyped. It now exports the following, with types where there is hand-written
code behind them: `core/state`, `core/preferences`, `core/spring`, `motion-recipes`,
`engines`, the shader directory, and `./flat` for the runtime defaults and palette list.

The package is `@crystal-ui/core`. Everything Crystal publishes sits under the `@crystal-ui`
scope; there is no `@meridian` scope.

## What the catalogue had to admit

`parity.json` was benchmarked against Mantine, Ant Design and MUI only. Meridian added
PrimeReact and MUI's X add-ons, which is where the real gaps were. The gap was computed:
every benchmark package was installed and enumerated. It was then curated, because MUI
composes from anatomy parts and date-library adapters, which are plumbing and not
components Crystal would name.

55 additions took the catalogue from 119 to 174. The largest single gap was that Crystal
named no charting surface at all while all four benchmarks ship one. `charts` is a new
category of fourteen. `tools/extend-catalogue.cjs` records the work and re-runs.

The first version of that tool was wrong. It edited `libraries/parity.json` directly.
That file is generated from `tokens/catalogue/`, so the next `npm test` silently reverted
all 55 additions, and the commit claiming 174 components was undone by its own test
suite. The tool now writes to the source, and 174 persists through a full build.

## Two components refused, with reasons

`terminal`: a shell emulator is an application, not a design-system component.
`border-beam`: Crystal specifies edge treatment as the Resin optical rim. A second,
unrelated mechanism for a moving border would contradict the material spec, and the ambient
tier that would have owned it is deferred (R22).
