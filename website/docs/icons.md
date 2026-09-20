# Icons

Crystal's icon set is one grid: a 24px view box, 1.8px strokes, round caps and joins, and `currentColor` so every icon inherits a tested foreground colour.

Icon files carry no stroke width, cap, join or colour of their own. Those come from the stylesheet, so the contract lives in one place and cannot drift across a thousand files. An icon that carries its own stroke is a defect, not a variant.

Thirteen symbols are original Crystal work and live in the sprite at `assets/icons.svg`: `crystal`, `layers`, `document`, `directions`, `workspace`, `conversation`, `library`, `check`, `attention`, `alert`, `info`, `sparkle` and `chevron`. They are authoritative and are never replaced by a sourced icon of the same name. The remainder are derived from Lucide under the ISC License and vendored into `assets/icons/`; see [asset notices](../reference/ASSET-NOTICES.md).

## Using an icon

Reference a sprite symbol, or inline a vendored file:

```html
<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
  <use href="assets/icons.svg#workspace"/>
</svg>
```

Icons beside text are decorative and hidden from assistive technology. An icon-only control needs an accessible name on the control itself and a full-sized interaction target. Do not reduce an icon's opacity to simulate glass, and do not apply material feathering to one: icons stay crisp.

## Gallery

<div id="icon-gallery" data-manifest="../core/assets/icons/manifest.json">
  <p class="stage-note">Enable JavaScript to search the icon set. The complete list is in <code>assets/icons/manifest.json</code>.</p>
</div>

<script src="../vendor/@crystal-ui/core/assets/icons.js" defer></script>

## The sets

<!-- generated:icon-counts -->

| Source | Count | Licence |
|---|---|---|
| crystal | 13 | Original work |
| lucide | 998 | ISC ([notice](../vendor/@crystal-ui/core/licenses/lucide-LICENSE.txt)) |
| **Total** | **1011** | |

One grid: `0 0 24 24` view box, 1.8px strokes, round caps and round joins, and `currentColor` so every icon inherits a tested foreground colour.

This site's own interface uses 13 of them, inlined as a sprite in `core/assets/icons.svg`; the full set is one file per icon under `core/assets/icons/`.
<!-- /generated:icon-counts -->
