# Crystal design system

Open [the interactive playground](index.html). This independent package extends Gather’s approved Crystal styling into a product-neutral design system with five bolder palettes, the original Harbor mapping, light/dark modes, real local adjustments and CSS/JSON exports.

## Visual acceptance baseline

The [approved Crystal material studies](reference/approved-crystal/README.md) are the visual standard for all future work. Unexplained divergence is a defect, not an acceptable style variation. Capture the affected UI before and after any visual change, in both light and dark and at narrow widths, and compare it against those studies; passing token and contrast checks alone do not establish visual correctness.

## Defining hierarchy

**Plastic → Frost → Resin**, from back to front. Product palettes vary; this material order is Crystal’s shared identity. Haze reading wells sit within that hierarchy.

## Recommended defaults

Color atmosphere **90%**, Frost base tint **35%**, elevation **125%**, and corner radius **28px**. Resin stays at **20%** fill opacity. Haze uses **80%** fill with a **1.95px** feathered perimeter and crisp text. See the [material specification](docs/materials.html#recommended-defaults) for recipes and fallback behavior.

Stone retains 55% light / 60% dark opacity and shares Haze’s 1.95px feather. Mirage is the modal scrim. All six are explicit materials in the canonical catalog.

## Included

- Preserved original Gather specifications and token files with a SHA-256 provenance manifest.
- Eight editable specification chapters covering identity, typography/layout, color, materials/elevation, components/patterns, accessibility, adoption, material motion and component motion.
- Six full light/dark palettes, independent functional statuses, configurable atmosphere/tint/elevation/radius/density/font and reduced transparency.
- Three local product scenes; working dialog, token inspection, local name editing, preference persistence and downloads.
- Framework-independent CSS primitives and a dependency-free JavaScript token resolver/exporter. This is not a complete production component framework or native renderer.
- A dedicated [motion playground](motion.html) with six replayable material motions with 5–30px ordinary travel, up to 50px ordinary expressive depth, with documented exceptions for larger compositions, in-place Haze/Stone ripples, liquid light, moving feathered edges and directional Mirage entrances/exits, working scene/dialog transitions, saved animation speed across the preview (0.25–2×, five-second cap) and independent reduced-motion preferences.
- Motion 13.4.0 and GSAP 3.15.0 installed and bundled locally, with 54 component recipes, live component studies and real-engine browser contract checks. See [component motion](docs/motion-components.html).
- Resin/Haze interaction surfaces and compact information shells, including tooltips, toasts, labels, tags and temporary menus.
- Rebuild/validation tooling and actual verification results, separately labeled from product adoption requirements.

The source Gather proposal and application remain unchanged. Company branding is intentionally not invented; Crystal is the shared design-system name, and products supply their own names and marks.

## Open locally

Run `python3 tools/serve.py` from this folder and visit `http://127.0.0.1:4321/`. Direct file opening is not browser-verified. The preview has no backend and makes no required external asset requests. External reference links open their named documentation sites.

See [adoption](docs/adoption.html), [verification](validation/report.html), and [asset notices](reference/ASSET-NOTICES.md). The packaged ZIP is published as a release asset rather than kept in the repository; it contains the complete usable directory without local dependency environments. Rebuild it locally with `python3 tools/package.py`. No framework installation is needed to view it.
