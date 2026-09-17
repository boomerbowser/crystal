# Crystal

Crystal is the shared design system for Meridian products. This repository holds the design system and, alongside it, the platform component libraries built on top of it.

## Layout

| Folder | Contents |
|---|---|
| [`design-system/`](design-system/) | Crystal itself: tokens, CSS/JS primitives, the eight specification chapters, verification evidence, build tooling, and the interactive preview site. |
| [`libraries/`](libraries/) | One sub-folder per platform component library. Each is intended to become its own repository. |

Crystal is the base. A component library implements Crystal for a platform; it does not fork the token or material definitions.

## Run the interactive preview

```
python3 design-system/tools/serve.py
```

Then open `http://127.0.0.1:4321/`. Direct file opening is not browser-verified.

## Working in this repository

Read [AGENTS.md](AGENTS.md) before making visual changes. The approved visual baseline is the acceptance standard, several HTML pages are generated from their markdown and token sources, and visual changes require before/after captures in both modes.
