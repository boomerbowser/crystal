# @crystal-ui/core

Crystal is Meridian's design system. This package is the library: design tokens,
the material stylesheets, a token resolver, a headless state core, motion recipes,
icons, shaders and the specification.

It is framework independent. It is the base that platform component libraries are
built on, and it is not a component framework or a native renderer itself.

```sh
npm install @crystal-ui/core
```

## Using the stylesheets

Load the theme first, then the primitives.

```js
import '@crystal-ui/core/theme';
import '@crystal-ui/core/css';
```

```html
<section class="cr-plastic">
  <section class="cr-frost">
    <article class="cr-haze">Readable product content</article>
  </section>
  <nav class="cr-resin" aria-label="Product navigation">
    <!-- The product's navigation controls -->
  </nav>
</section>
```

Set `data-crystal-mode="dark"` or `"light"` on the root element to choose a mode.
The generated theme is the Prism palette in both modes. The resolver produces a
theme for any of the six palettes and any settings within the documented ranges.

## Materials

The material order is **Plastic → Frost → Resin**, from back to front. Products
change the palette. They do not change this order.

| Material | What it is |
|---|---|
| Plastic | The opaque foundation, tinted by the palette. |
| Frost | The intermediate panel: 40px blur, tint and fine grain. |
| Resin | The floating control plane: 20px blur, a fixed 20% fill and a defined rim. |
| Haze | The reading surface: an 80% fill with a 1.95px feathered edge and crisp text. |
| Stone | Label backing: 55% in light mode, 60% in dark, feathered like Haze. |
| Mirage | The scrim behind a modal. |

Recommended defaults: colour atmosphere 90%, Frost base tint 35%, elevation 125%,
corner radius 28px. Feathering applies to an isolated paint layer only. Text,
icons, hit areas and focus rings are never blurred.

## What the package exports

| Import | Contents |
|---|---|
| `@crystal-ui/core` | The generated token export for TypeScript. Swift and Kotlin exports are in `exports/`. |
| `@crystal-ui/core/tokens` | The token source, in W3C DTCG format. |
| `@crystal-ui/core/flat` | The flat token file, with the runtime defaults and the palette list. |
| `@crystal-ui/core/css` | `crystal.css`: the materials, the control surface and the component recipes. |
| `@crystal-ui/core/theme` | The generated default theme. |
| `@crystal-ui/core/resolver` | The token resolver, contrast calculation, and CSS and JSON export. |
| `@crystal-ui/core/core/state` | State derivation for indicators, fields and ranges. |
| `@crystal-ui/core/core/preferences` | Preference clamping and duration resolution. |
| `@crystal-ui/core/core/spring` | Spring physics: sampling, settling time and overshoot. |
| `@crystal-ui/core/core/presets` | Keyframes for the material motion presets, computed from tokens. |
| `@crystal-ui/core/motion-recipes` | The 59 motion recipes, each with its spring and per-platform values. |
| `@crystal-ui/core/engines` | The Motion and GSAP engine entry. |
| `@crystal-ui/core/icons` | The icon manifest. There are 1022 icons on a 24px grid. |
| `@crystal-ui/core/shaders/*` | The optical layer's shader sources and their manifest. |
| `@crystal-ui/core/catalogue` | The component catalogue: 284 components in 14 categories. |
| `@crystal-ui/core/surfaces` | The 23 surfaces a component can be made of, each with its recipe. |
| `@crystal-ui/core/docs/*` | The eleven specification chapters, as Markdown. |

`motion` and `gsap` are dependencies of this package. A consumer bundles them as
it prefers.

## Specification

The chapters in `docs/` are the specification. Start with `principles.md`,
`materials.md` and `components.md`. `adoption.md` covers how a product or a
library takes Crystal on, and `catalogue.md` lists every component with its
surface, states, semantics and motion.

The rendered site, the interactive playground and the verification evidence are
in [crystal-preview](https://github.com/boomerbowser/crystal-preview). The
approved material studies there are the visual standard. A rendering that departs
from them without an approved reason is a defect, and passing token and contrast
checks does not establish that a rendering is correct.

## Licences

Third-party licences are in `licenses/`.
