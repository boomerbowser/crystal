# Adoption and governance

## Deliverable layout

| Path | Purpose |
|---|---|
| `index.html` | Interactive system playground and reference entry |
| `motion.html`, `assets/motion-preview.js` | Dedicated motion playground with shared appearance preferences and adjustable replay |
| `assets/prismata.css` | Framework-independent CSS material/component primitives |
| `assets/prismata-theme.css` | Generated default Prism tokens, both modes |
| `assets/motion.css`, `assets/motion.js` | Motion primitives and shared Motion/GSAP browser adapter |
| `assets/prismata.js` | Pure token resolver, contrast calculation and CSS/JSON export |
| `assets/tokens.js` | Generated browser copy of canonical JSON |
| `assets/site.css`, `assets/site.js` | Reference-site layout and local demonstration behavior |
| `tokens/prismata.json` | Canonical editable palette, material and default configuration |
| `docs/*.md` | Editable specifications; adjacent HTML is generated |
| `docs/tokens.md`, `docs/catalogue.md` | Generated from the token sources; do not edit |
| `src/overview.md` | The site's index page, editable |
| `src/pages/*.html` | Editable body fragments for the Playground and motion studies |
| `tools/shell.py` | The only copy of the page header, side menu and footer |
| `reference/` | Immutable source copies and SHA-256 provenance |
| `tools/` | Rebuild, validation and packaging commands |
| `validation/` | Executed-check evidence and explicit limits |

**Every HTML file in the site is generated.** `index.html`, `playground.html`,
`motion.html`, the ten specification pages and the verification report are all written
by `tools/build.py` and `tools/report.py` through `tools/shell.py`. Edit the markdown,
the fragments under `src/pages/`, or the shell. Never edit the HTML, which the next build
overwrites. Sections between `<!-- generated:NAME -->` markers inside a markdown file
are written by `tools/build-reference.cjs` and are overwritten too; the prose around
them is not.

The site uses relative local assets without fetching fonts or services. Review it through a loopback HTTP server; that path has been browser-tested. Direct file opening has not been browser-verified. Do not introduce an application/backend dependency to serve the documentation.

## Static CSS adoption

Copy `assets/prismata.css`, `assets/fonts/`, `assets/grain.svg`, and the theme CSS into the product. Preserve the primitive stylesheet’s relative asset paths. Load theme CSS before primitive CSS. The reference-site CSS/JS are not needed by a product.

`assets/prismata.css` carries the Resin interaction surface, the components built on it (`.pr-control`, `.pr-field-shell`, `.pr-indicator`, `.pr-resin-haze` and `.pr-tag`), the dock, the table and its scroller, and every native form control: checkbox, radio, switch, range, file button, select option and menu item. As of 2.2.0 it also carries the four recipes the catalogue needed and consumers could not obtain before: `.pr-nav-item` (a navigation entry, selected by label weight), `.pr-bare` (a control with no Resin coat, for controls inside a surface that already has one), `.pr-drag-handle`, and `.pr-resin.panel` (the Resin plane with the content radius). Before 2.1.0 it carried none of the control surface. There is no second stylesheet to copy: the package has never contained `assets/controls.css`.

Every component in the catalogue names the surface it is made of, from the closed vocabulary in `tokens/surfaces.json` (exported as `@prismata/core/surfaces`). A library implements each surface once, as a class, a mixin or a native view, and every component made of it inherits the implementation. The catalogue chapter lists the vocabulary with the `prismata.css` recipe behind each entry.

```html
<link rel="stylesheet" href="prismata-theme.css">
<link rel="stylesheet" href="assets/prismata.css">
<section class="pr-plastic">
  <section class="pr-frost">
    <article class="pr-haze">Readable product content</article>
  </section>
  <nav class="pr-resin" aria-label="Product navigation">
    <!-- Place the product’s real navigation controls here. -->
  </nav>
</section>
```

Set `data-prismata-mode="dark"` or `"light"` on the root HTML element to select a mode. An export made with Auto selected also follows the OS preference unless explicitly overridden. Export CSS from the playground to capture the selected palette and material settings in both modes.

The product adapter supplies layout, padding and placement (at least 12px of inset for content on feathered fills): the snippet shows material assignment only. Set `data-window-active="false"` on a foundation to select its neutral opaque inactive state; remove the attribute or set it to `"true"` to restore contextual tint. Wire this to supported host activation events where available. The browser study uses a manual switch and does not infer desktop activation or capture wallpaper.

The primitive stylesheet includes element-level typography, focus and box-sizing rules intended for a Prismata product root.

## Cascade layers

Prismata's stylesheets are organised into cascade layers, declared once at the top of the primitive stylesheet in precedence order:

```css
@layer prismata.reset, prismata.base, prismata.component, prismata.override;
```

| Layer | Holds | Who writes it |
| --- | --- | --- |
| `prismata.reset` | Element-level defaults for a Prismata product root | Prismata |
| `prismata.base` | The consuming page's own layout and typography, which Prismata's components win over | You |
| `prismata.component` | Prismata's controls and material surfaces | Prismata |
| `prismata.override` | Deliberate overrides that beat Prismata's components | You |

**An ordinary unlayered rule in your own stylesheet beats every layer.** Overriding Prismata does not require out-specifying it: `.pr-button { border-radius: 4px }` is enough. Use `prismata.override` when you want an override that still loses to your own unlayered rules, and `prismata.base` for page styles Prismata's components should win over.

If your page has inline `<style>` blocks that Prismata's components are expected to win over, declare them into `prismata.base`. Unlayered styles take precedence over all layers, which is usually what you want for product code and occasionally surprising for a page's own scaffolding. Review them when introducing Prismata into an existing application; scope these rules in your adapter if the page contains unrelated embedded products. `--pr-` variables are namespaced, but generic element selectors are not a CSS isolation boundary.

## Runtime adoption

Load `assets/tokens.js` before `assets/prismata.js`. The runtime exposes `window.Prismata`; it does not automatically choose preferences, render UI or write storage. The reference site's `site.js` handles those concerns only for this playground.

```js
const config = Prismata.normalize({ palette: 'fuchsia', mode: 'dark' });
const tokens = Prismata.resolve(config, 'dark');
for (const [name, value] of Object.entries(tokens)) {
  document.documentElement.style.setProperty(name, value);
}
document.documentElement.dataset.prismataMode = 'dark';
document.documentElement.dataset.effects = config.reduced ? 'opaque' : 'full';
document.documentElement.style.colorScheme = 'dark';
```

`Prismata.normalize` validates known keys and clamps numeric settings. `resolve(config, mode)` returns resolved CSS variables for an explicit light/dark mode. `exportCSS(config)` returns complete CSS for both modes. `exportJSON(config)` returns configuration plus resolved modes. `audit(config, mode)` reports the documented solid contrast pairs. JSON is a custom v1 schema; it is not a packaged native-theme adapter.

A product owns preference sync, account boundaries, device exceptions, migration, consent and secure persistence. Do not copy the playground’s global localStorage preference model into a multi-account product without designing those boundaries.

## Native products

Share color roles, typography relationships, radii, elevation hierarchy, status vocabulary and adaptation rules. Build real platform components and use supported native material APIs where appropriate. CSS shadows/blur values are visual references, not guaranteed equivalent compositor parameters. Verify real native accessibility, text scaling, keyboard/IME, input capture and performance on each target. No native adapter is included in this package.

### Surface recipes as values

`core/tokens/surfaces.json` names the `prismata.css` selector that implements each surface. A SwiftUI or Compose library cannot wear a selector, so the recipe behind each one is also published as data: `tokens/surface-recipes.json`, exported as `@prismata/core/surface-recipes`. It has one record per surface, in vocabulary order. Each record gives the fill, blur, saturation, rim, shadow, radius and padding the stylesheet resolves for an element that wears only that selector. Each value is written as the stylesheet writes it: a token reference such as `var(--pr-resin-fill)`, a literal such as `999px`, or an expression such as `calc(var(--pr-radius) + 6px)`. Resolve the tokens from the platform export (`exports/prismata-tokens.swift`, `.kt` or `.ts`) and every platform reaches the same values.

The platform guide in `libraries/CONTRACT.md` (§2) names the fallbacks a library must honour and works one record per material. Read a record in this order:

- `haze` is the feathered paint layer. Haze and Stone are painted on an isolated `::before` through a blur filter, so the element's own `fill` is often `transparent` and the reading fill is `haze.fill`, inset by `haze.inset` and feathered by `haze.feather`. Reproduce it as a separate layer behind the content. Text, icons and focus stay crisp.
- `layers` holds every pseudo-element the recipe paints, such as the Resin sheen on `::before` and `::after`.
- `fallbacks` lists what changes under `opaque`, `reducedTransparency`, `forcedColors` and `noBackdropFilter`. A branch lists only the declarations that change and take effect. `conditions` holds other conditional branches, such as narrow layouts.
- `shadowed` lists fallback declarations the cascade overrides, which therefore never render in the browser. `missing` names a material the surface claims that the recipe does not paint for that selector, and `why` says where it comes from instead: the selector is a part of a larger surface, or takes the value from what it is worn on. Do not copy a shadowed declaration, and draw a missing material as `why` describes it. A gap without a reason fails the contract tests.
- `tokens` lists every `--pr-*` property the record references.

States and variants (`:hover`, `.primary`, descendants such as `.pr-dock button`) are outside the record. The file is generated by `tools/build-surface-recipes.cjs` on every build and checked against the stylesheet by `tests/core-contracts.cjs`. Never edit it by hand.

## Component libraries

A component library implements Prismata for one platform, in its own repository, against the contract in `libraries/CONTRACT.md`. The record of which exist is `tokens/libraries.json`, exported as `@prismata/core/libraries`: one entry per platform Prismata's parity record names, with its status, its package and where its documentation is. A library's version is its package's own, so it is not recorded here; this site shows the version published when it was built.

<!-- generated:libraries -->

| Platform | Library | Status | Package | Documentation |
|---|---|---|---|---|
| React | Prismata React | Built (alpha) | [`@prismata/react`](https://www.npmjs.com/package/@prismata/react) | [Repository](https://github.com/boomerbowser/prismata-react); no website yet |
| React Native | Not yet named | Planned | Not yet published | Not yet |
| SwiftUI | Not yet named | Planned | Not yet published | Not yet |
| Jetpack Compose | Not yet named | Planned | Not yet published | Not yet |
<!-- /generated:libraries -->

## Named material API and compatibility

Use `.pr-plastic`, `.pr-frost`, `.pr-resin`, `.pr-haze`, `.pr-stone` and `.pr-mirage` for new integrations. The canonical JSON’s `materials` catalog records all six names, roles, inspirations and primitives. Named CSS variables include `--pr-plastic-inactive`, `--pr-frost-fill`, `--pr-resin-fill`, `--pr-haze-fill`, `--pr-stone-fill`, and `--pr-mirage-fill`, with matching blur/feather variables where applicable.

The prior `.pr-foundation`, `.pr-acrylic`, `.pr-glass` and `.pr-surface` selectors remain compatibility aliases. Existing `--pr-acrylic-*`, `--pr-glass-*`, `--pr-content-*` and `--pr-label-fill` variables remain in exports alongside their named equivalents. These legacy identifiers do not define extra materials. Original reference copies retain their historical names and provenance.

Font licensing notices are retained in `reference/ASSET-NOTICES.md` and the font’s license file; they are not a Sources documentation page.

## Product customization boundaries

Products may choose a palette, layout, iconography, density and supported material intensity. They should retain semantic state meanings, reading/focus requirements, material hierarchy and recognizable geometry. A materially different behavior or palette needs its own acceptance evidence; a new theme cannot silently change danger/success semantics.

Adopt one version per product, maintain a changelog for actual changes, and review a shared visual gallery before promoting a breaking token/behavior change. Deprecate renamed tokens before removal. Treat changes to accessibility, status meanings, token contracts and exported file formats as compatibility decisions.

## Versioning and the public contract

Prismata follows semantic versioning against a stated public contract. These are the things a version number promises:

- Token names in the DTCG source and the generated `--pr-*` custom properties
- Material primitive class names and the cascade layer names
- Component contracts in the catalogue: anatomy, states, semantics and the split between what Prismata supplies and what the product owns
- The headless core's function signatures and return values
- Exported file formats for CSS, JSON, TypeScript, Swift and Kotlin
- Icon identifiers in the manifest

Anything else (internal selectors, generated file ordering, the preview site) may change in a patch release.

**Deprecate before removing.** A deprecated name keeps working for at least one minor version, and the version that will remove it is named at the moment it is deprecated. Removal happens only in a major release. The legacy material vocabulary (`--pr-acrylic-*`, `--pr-glass-*`, `--pr-mica-*` and the `.pr-acrylic` and `.pr-glass` classes) is deprecated in 2.0.0 and will be removed in 3.0.0; they currently ship as aliases of the Frost, Resin and Plastic tokens.

Prismata publishes publicly to npm as `@prismata/core`:

```sh
npm install @prismata/core
```

Products pin a version, which makes one-version-per-product and a CI parity check enforceable. Every release after 2.0.0 is published from a tag by GitHub Actions through npm Trusted Publishing and carries a provenance attestation, so a consumer can verify the tarball came from `boomerbowser/prismata` and from the commit the tag names. 2.0.0 itself was published by hand and is the one version without an attestation, because npm cannot attach a trusted publisher to a package that does not exist yet.

A specification bundle (the token files, the generated Swift and Kotlin exports and the parity contract) is attached to each GitHub release, for platform libraries that cannot install an npm package.

## Rebuild and validate

From the `prismata` repository:

```sh
npm ci
npm run build
npm test
```

`npm run build` regenerates everything the library generates rather than stores: the flat token file from the DTCG source, `tokens.js`, the exported theme, and the reference sections in `docs/`. `npm test` runs that build and then checks token contracts and contrast, recipe uniqueness, duration and travel bounds, the engine versions against the lockfile, documentation drift, and what the published package may contain. The library needs Node and nothing else; it has no Python tooling.

The exported theme is produced by running the resolver and never by writing CSS. Any other method would be a second implementation of alias resolution, which is the divergence the token pipeline exists to prevent.

The documentation website is a separate repository, `prismata-preview`. It installs this package, renders the specification it installed, and runs the browser gates (pages, links, scrolling, interactions and the visual baselines) against what was published rather than against a working copy.

## Deploying the documentation website

The website is `prismata-preview`, a separate repository that installs this package. How it is deployed (the Vercel settings, the caching rules, the relative-path and clean-URL constraints) is documented there, because it concerns that site and not Prismata. Nothing in this package depends on it.

### User animation speed

`Prismata.normalize({ motionSpeed: 1 })` accepts a factor from 0.25 to 2. Resolved durations divide by that factor and cap each animation at 5000ms; reduced motion produces zero durations. CSS and JSON exports retain this preference. The playground and Motion page share it, including real dialog/backdrop timing. Products should target 0 to 2 seconds by default and expose reduced motion independently of speed.


### Motion engine dependencies

The motion runtime needs the engines and the recipe catalogue. `@prismata/core` declares Motion 13.4.0 and GSAP 3.15.0 as dependencies and ships `engines.js`, which re-exports both; bundle it however your product bundles anything else. The recipes are `@prismata/core/motion-recipes`. Ship `licenses/` with any bundle that includes the engines.

The token resolver and the static material CSS do not need either library. A product that uses Prismata's colour, materials and geometry without its motion installs nothing extra. See [component motion](motion-components.html) for the integration and cancellation contracts.

### Interaction surfaces and revised motion

Render the field shells in your component framework: a bare `<input>` cannot carry Prismata's focus ring, because the ring belongs to the shell around it and the input itself takes `outline: 0`. Compact information surfaces and ephemeral menus use `.pr-resin-haze`. Do not transplant the legacy solid button rules without this material layer. The 54-recipe catalogue declares material signatures and justified extended travel; the old 50px token describes compact motion only.

`controls.css` is not part of this package and never will be, but as of 2.1.0 the part of it you needed is. It is the documentation site's own stylesheet, and it carried a great deal that this specification describes and the library did not ship: in the library `.pr-indicator` and `.pr-resin-haze` had no rules, `.pr-table-scroll` did not scroll, and checkbox, radio, range and select had no styling.

Five components, the interaction surface and a further 75 rules moved from it into `assets/prismata.css`. The site keeps what is its own: its switches, its segmented controls and its colour swatches. What remains of `controls.css` is not exportable. It styles bare elements, and exporting it made a 32px chip render 50px tall in Prismata React (D-9). `tools/verify-package.cjs` fails a tarball that contains it.
