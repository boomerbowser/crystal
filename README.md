# Crystal

Crystal is the shared design system for Meridian products. This repository is the
library — `@crystal-ui/core` on npm — together with the platform component
libraries built on top of it.

```sh
npm install @crystal-ui/core
```

## Layout

| Folder | Contents |
|---|---|
| [`core/`](core/) | Crystal itself, and the published package: the DTCG token source and every generated form of it, the resolver, the headless core, the stylesheets and the exported theme, ~1000 icons, the shader sources, Manrope, the TypeScript/Swift/Kotlin exports, the third-party licences, and the eleven specification chapters in [`core/docs/`](core/docs/). |
| [`libraries/`](libraries/) | One sub-folder per platform component library. Each is intended to become its own repository. |
| [`tools/`](tools/), [`tests/`](tests/), [`validation/`](validation/) | The build and the gates, and the records they write. Node only. |

Crystal is the base. A component library implements Crystal for a platform; it
does not fork the token or material definitions — the parity bar is
[`libraries/CONTRACT.md`](libraries/CONTRACT.md).

## The documentation website

The interactive preview, the specification pages as rendered HTML and the
verification evidence are a **separate repository**,
[`crystal-preview`](https://github.com/boomerbowser/crystal-preview). It installs
this package and renders the specification that ships inside it, which is what
stops the site's own stylesheet shaping an appearance the library does not
export.

## Build and check

```sh
npm ci
npm run build
npm test
```

`npm run build` regenerates what the library generates rather than stores. `npm
test` runs that build and then checks token contracts and contrast, recipe
uniqueness, duration and travel bounds, the engine versions against the
lockfile, documentation drift, and what the published package may contain.

## Working in this repository

Read [AGENTS.md](AGENTS.md) before making visual changes. The approved visual
baseline is the acceptance standard, the specification chapters have sections
generated from their token sources, and visual changes require before/after
captures in both modes.
