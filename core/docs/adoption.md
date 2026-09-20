# Adoption and governance

## Deliverable layout

| Path | Purpose |
|---|---|
| `index.html` | Interactive system playground and reference entry |
| `motion.html`, `assets/motion-preview.js` | Dedicated motion playground with shared appearance preferences and adjustable replay |
| `assets/crystal.css` | Framework-independent CSS material/component primitives |
| `assets/crystal-theme.css` | Generated default Prism tokens, both modes |
| `assets/motion.css`, `assets/motion.js` | Motion primitives and shared Motion/GSAP browser adapter |
| `assets/crystal.js` | Pure token resolver, contrast calculation and CSS/JSON export |
| `assets/tokens.js` | Generated browser copy of canonical JSON |
| `assets/site.css`, `assets/site.js` | Reference-site layout and local demonstration behavior |
| `tokens/crystal.json` | Canonical editable palette, material and default configuration |
| `docs/*.md` | Editable specifications; adjacent HTML is generated |
| `docs/tokens.md`, `docs/catalogue.md` | **Generated** from the token sources — do not edit |
| `src/overview.md` | The site's index page, editable |
| `src/pages/*.html` | Editable body fragments for the Playground and motion studies |
| `tools/shell.py` | The only copy of the page header, side menu and footer |
| `reference/` | Immutable source copies and SHA-256 provenance |
| `tools/` | Rebuild, validation and packaging commands |
| `validation/` | Executed-check evidence and explicit limits |

**Every HTML file in the site is generated.** `index.html`, `playground.html`,
`motion.html`, the ten specification pages and the verification report are all written
by `tools/build.py` and `tools/report.py` through `tools/shell.py`. Edit the markdown,
the fragments under `src/pages/`, or the shell — never the HTML, which the next build
overwrites. Sections between `<!-- generated:NAME -->` markers inside a markdown file
are written by `tools/build-reference.cjs` and are overwritten too; the prose around
them is not.

The site uses relative local assets without fetching fonts or services. Review it through a loopback HTTP server; that path has been browser-tested. Direct file opening has not been browser-verified. Do not introduce an application/backend dependency to serve the documentation.

## Static CSS adoption

Copy `assets/crystal.css`, `assets/controls.css`, `assets/fonts/`, `assets/grain.svg`, and the theme CSS into the product. Preserve the primitive stylesheet’s relative asset paths. Load theme CSS before primitive CSS. The reference-site CSS/JS are not needed by a product.

```html
<link rel="stylesheet" href="crystal-theme.css">
<link rel="stylesheet" href="assets/crystal.css">
<link rel="stylesheet" href="assets/controls.css">
<section class="cr-plastic">
  <section class="cr-frost">
    <article class="cr-haze">Readable product content</article>
  </section>
  <nav class="cr-resin" aria-label="Product navigation">
    <!-- Place the product’s real navigation controls here. -->
  </nav>
</section>
```

Set `data-crystal-mode="dark"` or `"light"` on the root HTML element to select a mode. An export made with Auto selected also follows the OS preference unless explicitly overridden. Export CSS from the playground to capture the selected palette and material settings in both modes.

The product adapter supplies layout, padding and placement (at least 12px of inset for content on feathered fills): the snippet shows material assignment, not a complete application. Set `data-window-active="false"` on a foundation to select its neutral opaque inactive state; remove the attribute or set it to `"true"` to restore contextual tint. Wire this to supported host activation events where available. The browser study uses a manual switch and does not infer desktop activation or capture wallpaper.

The primitive stylesheet includes element-level typography, focus and box-sizing rules intended for a Crystal product root.

## Cascade layers

Crystal's stylesheets are organised into cascade layers, declared once at the top of the primitive stylesheet in precedence order:

```css
@layer crystal.reset, crystal.base, crystal.component, crystal.override;
```

| Layer | Holds | Who writes it |
| --- | --- | --- |
| `crystal.reset` | Element-level defaults for a Crystal product root | Crystal |
| `crystal.base` | The consuming page's own layout and typography, which Crystal's components win over | You |
| `crystal.component` | Crystal's controls and material surfaces | Crystal |
| `crystal.override` | Deliberate overrides that beat Crystal's components | You |

**An ordinary unlayered rule in your own stylesheet beats every layer.** Overriding Crystal no longer requires out-specifying it: `.cr-button { border-radius: 4px }` is enough. Use `crystal.override` when you want an override that still loses to your own unlayered rules, and `crystal.base` for page styles Crystal's components should win over.

If your page has inline `<style>` blocks that Crystal's components are expected to win over, declare them into `crystal.base`. Unlayered styles take precedence over all layers, which is usually what you want for product code and occasionally surprising for a page's own scaffolding. Review them when introducing Crystal into an existing application; scope these rules in your adapter if the page contains unrelated embedded products. `--cr-` variables are namespaced, but generic element selectors are not a CSS isolation boundary.

## Runtime adoption

Load `assets/tokens.js` before `assets/crystal.js`. The runtime exposes `window.Crystal`; it does not automatically choose preferences, render UI or write storage. The reference site's `site.js` handles those concerns only for this playground.

```js
const config = Crystal.normalize({ palette: 'fuchsia', mode: 'dark' });
const tokens = Crystal.resolve(config, 'dark');
for (const [name, value] of Object.entries(tokens)) {
  document.documentElement.style.setProperty(name, value);
}
document.documentElement.dataset.crystalMode = 'dark';
document.documentElement.dataset.effects = config.reduced ? 'opaque' : 'full';
document.documentElement.style.colorScheme = 'dark';
```

`Crystal.normalize` validates known keys and clamps numeric settings. `resolve(config, mode)` returns resolved CSS variables for an explicit light/dark mode. `exportCSS(config)` returns complete CSS for both modes. `exportJSON(config)` returns configuration plus resolved modes. `audit(config, mode)` reports the documented solid contrast pairs. JSON is a custom v1 schema; it is not a packaged native-theme adapter.

A product owns preference sync, account boundaries, device exceptions, migration, consent and secure persistence. Do not copy the playground’s global localStorage preference model into a multi-account product without designing those boundaries.

## Native products

Share color roles, typography relationships, radii, elevation hierarchy, status vocabulary and adaptation rules. Build real platform components and use supported native material APIs where appropriate. CSS shadows/blur values are visual references, not guaranteed equivalent compositor parameters. Verify real native accessibility, text scaling, keyboard/IME, input capture and performance on each target. No native adapter is included in this package.

## Named material API and compatibility

Use `.cr-plastic`, `.cr-frost`, `.cr-resin`, `.cr-haze`, `.cr-stone` and `.cr-mirage` for new integrations. The canonical JSON’s `materials` catalog records all six names, roles, inspirations and primitives. Named CSS variables include `--cr-plastic-inactive`, `--cr-frost-fill`, `--cr-resin-fill`, `--cr-haze-fill`, `--cr-stone-fill`, and `--cr-mirage-fill`, with matching blur/feather variables where applicable.

The prior `.cr-foundation`, `.cr-acrylic`, `.cr-glass` and `.cr-surface` selectors remain compatibility aliases. Existing `--cr-acrylic-*`, `--cr-glass-*`, `--cr-content-*` and `--cr-label-fill` variables remain in exports alongside their named equivalents. These legacy identifiers do not define extra materials. Original reference copies retain their historical names and provenance.

Font licensing notices are retained in `reference/ASSET-NOTICES.md` and the font’s license file; they are not a Sources documentation page.

## Product customization boundaries

Products may choose a palette, layout, iconography, density and supported material intensity. They should retain semantic state meanings, reading/focus requirements, material hierarchy and recognizable geometry. A materially different behavior or palette needs its own acceptance evidence; a new theme cannot silently change danger/success semantics.

Adopt one version per product, maintain a changelog for actual changes, and review a shared visual gallery before promoting a breaking token/behavior change. Deprecate renamed tokens before removal. Treat changes to accessibility, status meanings, token contracts and exported file formats as compatibility decisions.

## Versioning and the public contract

Crystal follows semantic versioning against a stated public contract. These are the things a version number promises:

- Token names in the DTCG source and the generated `--cr-*` custom properties
- Material primitive class names and the cascade layer names
- Component contracts in the catalogue: anatomy, states, semantics and the split between what Crystal supplies and what the product owns
- The headless core's function signatures and return values
- Exported file formats for CSS, JSON, TypeScript, Swift and Kotlin
- Icon identifiers in the manifest

Anything else — internal selectors, generated file ordering, the preview site — may change in a patch release.

**Deprecate before removing.** A deprecated name keeps working for at least one minor version, and the version that will remove it is named at the moment it is deprecated. Removal happens only in a major release. The legacy material vocabulary — `--cr-acrylic-*`, `--cr-glass-*`, `--cr-mica-*` and the `.cr-acrylic` and `.cr-glass` classes — is deprecated in 2.0.0 and will be removed in 3.0.0; they currently ship as aliases of the Frost, Resin and Plastic tokens.

Crystal publishes publicly to npm as **`@crystal-ui/core`**:

```sh
npm install @crystal-ui/core
```

Products pin a version, which is what makes one-version-per-product and a CI parity check enforceable. Every release after 2.0.0 is published from a tag by GitHub Actions through npm Trusted Publishing and carries a provenance attestation, so a consumer can verify the tarball came from `boomerbowser/crystal` and from the commit the tag names. 2.0.0 itself was published by hand and is the one version without an attestation — npm cannot attach a trusted publisher to a package that does not exist yet.

A specification bundle — the token files, the generated Swift and Kotlin exports and the parity contract — is attached to each GitHub release, for platform libraries that cannot install an npm package.

## Rebuild and validate

From the `crystal` repository:

```sh
npm ci
npm run build
npm test
```

`npm run build` regenerates everything the library generates rather than stores: the flat token file from the DTCG source, `tokens.js`, the exported theme, and the reference sections in `docs/`. `npm test` runs that build and then checks token contracts and contrast, recipe uniqueness, duration and travel bounds, the engine versions against the lockfile, documentation drift, and what the published package may contain. Node and nothing else — the library has no Python tooling.

The exported theme is produced by running the resolver, not by writing CSS. Any other method would be a second implementation of alias resolution, which is the divergence the token pipeline exists to prevent.

The documentation website is a separate repository, `crystal-preview`. It installs this package, renders the specification it installed, and runs the browser gates — pages, links, scrolling, interactions and the visual baselines — against what was published rather than against a working copy.

## Deploying the documentation website

The website is `crystal-preview`, a separate repository that installs this package. How it is deployed — the Vercel settings, the caching rules, the relative-path and clean-URL constraints — is documented there, because it is a fact about that site rather than about Crystal. Nothing in this package depends on it.

### User animation speed

`Crystal.normalize({ motionSpeed: 1 })` accepts a factor from 0.25 to 2. Resolved durations divide by that factor and cap each animation at 5000ms; reduced motion produces zero durations. CSS and JSON exports retain this preference. The playground and Motion page share it, including real dialog/backdrop timing. Products should target 0–2 seconds by default and expose reduced motion independently of speed.


### Motion engine dependencies

The motion runtime needs the engines and the recipe catalogue. `@crystal-ui/core` declares Motion 13.4.0 and GSAP 3.15.0 as dependencies and ships `engines.js`, which re-exports both; bundle it however your product bundles anything else. The recipes are `@crystal-ui/core/motion-recipes`. Ship `licenses/` with any bundle that includes the engines.

**The token resolver and the static material CSS do not need either library.** A product that uses Crystal's colour, materials and geometry without its motion installs nothing extra. See [component motion](motion-components.html) for the integration and cancellation contracts.

### Interaction surfaces and revised motion

Render the field shells in your component framework: a bare `<input>` cannot carry Crystal's focus ring, because the ring belongs to the shell around it and the input itself takes `outline: 0`. Compact information surfaces and ephemeral menus use `.cr-resin-haze`. Do not transplant the legacy solid button rules without this material layer. The 54-recipe catalogue declares material signatures and justified extended travel; the old 50px token describes compact motion only.

`controls.css` is **not** part of this package and never will be. It is the documentation site's own stylesheet, it styles bare elements, and exporting it once already caused a 32px chip to render 50px tall in Crystal React — D-9. `tools/verify-package.cjs` fails a tarball that contains it.
