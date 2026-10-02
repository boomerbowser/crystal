# Crystal

Crystal is the design system for Meridian products. This repository holds the
library, published to npm as `@crystal-ui/core`, and the contract that platform
component libraries are built against.

```sh
npm install @crystal-ui/core
```

## Layout

| Folder | Contents |
|---|---|
| [`core/`](core/) | The published package. It holds the DTCG token source and every generated form of it, the resolver, the headless core, the stylesheets and the exported theme, 1011 icons, the shader sources, Manrope, the TypeScript, Swift and Kotlin exports, the third-party licences, and the eleven specification chapters in [`core/docs/`](core/docs/). |
| [`libraries/`](libraries/) | The contract for platform component libraries, the parity manifest, and each platform's status record. |
| [`tools/`](tools/), [`tests/`](tests/), [`validation/`](validation/) | The build, the checks, and the records the checks write. Node only. |
| [`proposals/`](proposals/) | Design proposals and the issue trackers. |

A component library implements Crystal for one platform and takes its tokens and
material definitions from this package. The requirements are in
[`libraries/CONTRACT.md`](libraries/CONTRACT.md). The first library is
[Crystal React](https://github.com/boomerbowser/crystal-react).

## The documentation website

The interactive preview, the rendered specification pages and the verification
evidence are in a separate repository,
[`crystal-preview`](https://github.com/boomerbowser/crystal-preview). The site
installs this package from npm and renders the specification that ships inside
it, so everything the site shows is something a consumer of the package also
receives.

## Build and check

```sh
npm ci
npm run build
npm test
```

`npm run build` regenerates the generated files: the flat tokens, the platform
exports, the theme, the catalogue chapter, the parity manifest and the generated
sections of the specification. `npm test` runs that build and then checks token
contracts and contrast, recipe uniqueness, duration and travel bounds, the engine
versions against the lockfile, documentation drift, and the contents of the
published package.

## Working in this repository

Read [AGENTS.md](AGENTS.md) before making visual changes. The approved visual
baseline is the acceptance standard. Some sections of the specification chapters
are generated from the token sources, so edit the source and rebuild. A visual
change needs before and after captures in both light and dark mode.
