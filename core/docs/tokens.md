# Tokens

Every value Crystal ships, generated from `core/tokens/crystal.tokens.json` — the W3C
Design Tokens (DTCG) source of truth. This page is written by
`tools/build-reference.cjs`; editing it by hand is pointless, because the next build
overwrites it. Edit the token file and run `npm run build`.

## How the three tiers work

Crystal resolves a value through three tiers, and the direction is strictly one way:
a component reads a semantic token, a semantic token reads a primitive, and nothing
reads upward. That is what makes a palette swap a change to one tier rather than a
search across the codebase.

```
component.action.radius  →  semantic.shape.pill  →  primitive.distance.full
```

**A component that reads a primitive directly is a bug.** It works, and it silently
opts that component out of every theme, mode and palette change made at the semantic
tier. `tools/validate-tokens.cjs` checks the direction of every reference.

## Primitive tokens

Raw values. Never referenced by a component directly — a primitive is the thing a semantic token points at, so that the meaning can be re-pointed without editing every use site.

213 tokens.

### Primitive · palette

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `primitive.palette.prism.seed` | color | `#7338EF` | — |
| `primitive.palette.prism.companion` | color | `#EF48C6` | — |
| `primitive.palette.prism.glow` | color | `#52BDF3` | — |
| `primitive.palette.prism.light.canvas` | color | `#f9f6fe` | Foundation behind every surface |
| `primitive.palette.prism.light.surface` | color | `#ffffff` | Opaque reading surface |
| `primitive.palette.prism.light.surfaceAlt` | color | `#f2edfe` | Secondary reading surface |
| `primitive.palette.prism.light.text` | color | `#171130` | Body ink |
| `primitive.palette.prism.light.muted` | color | `#402e76` | Supporting ink |
| `primitive.palette.prism.light.primary` | color | `#7338EF` | Action colour |
| `primitive.palette.prism.light.onPrimary` | color | `#ffffff` | Ink on the action colour |
| `primitive.palette.prism.light.primarySoft` | color | `#e6dbfc` | Selected or authored container |
| `primitive.palette.prism.light.onPrimarySoft` | color | `#2b195a` | Ink on the soft container |
| `primitive.palette.prism.light.outline` | color | `#624a9f` | Functional boundary |
| `primitive.palette.prism.light.decorative` | color | `#7338EF` | Atmosphere and decorative light |
| `primitive.palette.prism.light.companion` | color | `#EF48C6` | Paired atmosphere colour |
| `primitive.palette.prism.light.glow` | color | `#52BDF3` | Highlight light |
| `primitive.palette.prism.dark.canvas` | color | `#120d26` | Foundation behind every surface |
| `primitive.palette.prism.dark.surface` | color | `#1d1730` | Opaque reading surface |
| `primitive.palette.prism.dark.surfaceAlt` | color | `#332756` | Secondary reading surface |
| `primitive.palette.prism.dark.text` | color | `#f7f3fe` | Body ink |
| `primitive.palette.prism.dark.muted` | color | `#dbcbfb` | Supporting ink |
| `primitive.palette.prism.dark.primary` | color | `#c8b1f9` | Action colour |
| `primitive.palette.prism.dark.onPrimary` | color | `#16102e` | Ink on the action colour |
| `primitive.palette.prism.dark.primarySoft` | color | `#331e65` | Selected or authored container |
| `primitive.palette.prism.dark.onPrimarySoft` | color | `#ebe3fd` | Ink on the soft container |
| `primitive.palette.prism.dark.outline` | color | `#bfa3f8` | Functional boundary |
| `primitive.palette.prism.dark.decorative` | color | `#7e48f0` | Atmosphere and decorative light |
| `primitive.palette.prism.dark.companion` | color | `#EF48C6` | Paired atmosphere colour |
| `primitive.palette.prism.dark.glow` | color | `#52BDF3` | Highlight light |
| `primitive.palette.fuchsia.seed` | color | `#C01993` | — |
| `primitive.palette.fuchsia.companion` | color | `#7C4DFF` | — |
| `primitive.palette.fuchsia.glow` | color | `#FF96DA` | — |
| `primitive.palette.fuchsia.light.canvas` | color | `#fcf5fa` | Foundation behind every surface |
| `primitive.palette.fuchsia.light.surface` | color | `#ffffff` | Opaque reading surface |
| `primitive.palette.fuchsia.light.surfaceAlt` | color | `#f9eaf5` | Secondary reading surface |
| `primitive.palette.fuchsia.light.text` | color | `#210d25` | Body ink |
| `primitive.palette.fuchsia.light.muted` | color | `#5b2356` | Supporting ink |
| `primitive.palette.fuchsia.light.primary` | color | `#C01993` | Action colour |
| `primitive.palette.fuchsia.light.onPrimary` | color | `#ffffff` | Ink on the action colour |
| `primitive.palette.fuchsia.light.primarySoft` | color | `#f4d6ec` | Selected or authored container |
| `primitive.palette.fuchsia.light.onPrimarySoft` | color | `#440f3d` | Ink on the soft container |
| `primitive.palette.fuchsia.light.outline` | color | `#813e7a` | Functional boundary |
| `primitive.palette.fuchsia.light.decorative` | color | `#C01993` | Atmosphere and decorative light |
| `primitive.palette.fuchsia.light.companion` | color | `#7C4DFF` | Paired atmosphere colour |
| `primitive.palette.fuchsia.light.glow` | color | `#FF96DA` | Highlight light |
| `primitive.palette.fuchsia.dark.canvas` | color | `#190a1e` | Foundation behind every surface |
| `primitive.palette.fuchsia.dark.surface` | color | `#241427` | Opaque reading surface |
| `primitive.palette.fuchsia.dark.surfaceAlt` | color | `#422144` | Secondary reading surface |
| `primitive.palette.fuchsia.dark.text` | color | `#fbf1f9` | Body ink |
| `primitive.palette.fuchsia.dark.muted` | color | `#efc3e3` | Supporting ink |
| `primitive.palette.fuchsia.dark.primary` | color | `#e6a5d5` | Action colour |
| `primitive.palette.fuchsia.dark.onPrimary` | color | `#1f0d23` | Ink on the action colour |
| `primitive.palette.fuchsia.dark.primarySoft` | color | `#4e1344` | Selected or authored container |
| `primitive.palette.fuchsia.dark.onPrimarySoft` | color | `#f6dff0` | Ink on the soft container |
| `primitive.palette.fuchsia.dark.outline` | color | `#e295cd` | Functional boundary |
| `primitive.palette.fuchsia.dark.decorative` | color | `#c52b9c` | Atmosphere and decorative light |
| `primitive.palette.fuchsia.dark.companion` | color | `#7C4DFF` | Paired atmosphere colour |
| `primitive.palette.fuchsia.dark.glow` | color | `#FF96DA` | Highlight light |
| `primitive.palette.cobalt.seed` | color | `#2758E8` | — |
| `primitive.palette.cobalt.companion` | color | `#6D47F2` | — |
| `primitive.palette.cobalt.glow` | color | `#48C6F0` | — |
| `primitive.palette.cobalt.light.canvas` | color | `#f5f7fe` | Foundation behind every surface |
| `primitive.palette.cobalt.light.surface` | color | `#ffffff` | Opaque reading surface |
| `primitive.palette.cobalt.light.surfaceAlt` | color | `#ecf0fd` | Secondary reading surface |
| `primitive.palette.cobalt.light.text` | color | `#0d1530` | Body ink |
| `primitive.palette.cobalt.light.muted` | color | `#263974` | Supporting ink |
| `primitive.palette.cobalt.light.primary` | color | `#2758E8` | Action colour |
| `primitive.palette.cobalt.light.onPrimary` | color | `#ffffff` | Ink on the action colour |
| `primitive.palette.cobalt.light.primarySoft` | color | `#d8e1fb` | Selected or authored container |
| `primitive.palette.cobalt.light.onPrimarySoft` | color | `#132458` | Ink on the soft container |
| `primitive.palette.cobalt.light.outline` | color | `#44579c` | Functional boundary |
| `primitive.palette.cobalt.light.decorative` | color | `#2758E8` | Atmosphere and decorative light |
| `primitive.palette.cobalt.light.companion` | color | `#6D47F2` | Paired atmosphere colour |
| `primitive.palette.cobalt.light.glow` | color | `#48C6F0` | Highlight light |
| `primitive.palette.cobalt.dark.canvas` | color | `#0b1025` | Foundation behind every surface |
| `primitive.palette.cobalt.dark.surface` | color | `#151a30` | Opaque reading surface |
| `primitive.palette.cobalt.dark.surfaceAlt` | color | `#252d55` | Secondary reading surface |
| `primitive.palette.cobalt.dark.text` | color | `#f2f5fe` | Body ink |
| `primitive.palette.cobalt.dark.muted` | color | `#c7d4f9` | Supporting ink |
| `primitive.palette.cobalt.dark.primary` | color | `#abbef6` | Action colour |
| `primitive.palette.cobalt.dark.onPrimary` | color | `#0d142d` | Ink on the action colour |
| `primitive.palette.cobalt.dark.primarySoft` | color | `#182962` | Selected or authored container |
| `primitive.palette.cobalt.dark.onPrimarySoft` | color | `#e1e8fc` | Ink on the soft container |
| `primitive.palette.cobalt.dark.outline` | color | `#9cb2f4` | Functional boundary |
| `primitive.palette.cobalt.dark.decorative` | color | `#3865ea` | Atmosphere and decorative light |
| `primitive.palette.cobalt.dark.companion` | color | `#6D47F2` | Paired atmosphere colour |
| `primitive.palette.cobalt.dark.glow` | color | `#48C6F0` | Highlight light |
| `primitive.palette.ion.seed` | color | `#007E97` | — |
| `primitive.palette.ion.companion` | color | `#3D45E5` | — |
| `primitive.palette.ion.glow` | color | `#36DCD1` | — |
| `primitive.palette.ion.light.canvas` | color | `#f4f9fa` | Foundation behind every surface |
| `primitive.palette.ion.light.surface` | color | `#ffffff` | Opaque reading surface |
| `primitive.palette.ion.light.surfaceAlt` | color | `#e8f3f6` | Secondary reading surface |
| `primitive.palette.ion.light.text` | color | `#081a25` | Body ink |
| `primitive.palette.ion.light.muted` | color | `#184757` | Supporting ink |
| `primitive.palette.ion.light.primary` | color | `#007E97` | Action colour |
| `primitive.palette.ion.light.onPrimary` | color | `#ffffff` | Ink on the action colour |
| `primitive.palette.ion.light.primarySoft` | color | `#d1e8ec` | Selected or authored container |
| `primitive.palette.ion.light.onPrimarySoft` | color | `#06303e` | Ink on the soft container |
| `primitive.palette.ion.light.outline` | color | `#34667c` | Functional boundary |
| `primitive.palette.ion.light.decorative` | color | `#007E97` | Atmosphere and decorative light |
| `primitive.palette.ion.light.companion` | color | `#3D45E5` | Paired atmosphere colour |
| `primitive.palette.ion.light.glow` | color | `#36DCD1` | Highlight light |
| `primitive.palette.ion.dark.canvas` | color | `#07141e` | Foundation behind every surface |
| `primitive.palette.ion.dark.surface` | color | `#111e27` | Opaque reading surface |
| `primitive.palette.ion.dark.surfaceAlt` | color | `#1d3445` | Secondary reading surface |
| `primitive.palette.ion.dark.text` | color | `#f0f7f9` | Body ink |
| `primitive.palette.ion.dark.muted` | color | `#bddde4` | Supporting ink |
| `primitive.palette.ion.dark.primary` | color | `#9ccdd6` | Action colour |
| `primitive.palette.ion.dark.onPrimary` | color | `#081924` | Ink on the action colour |
| `primitive.palette.ion.dark.primarySoft` | color | `#0a3646` | Selected or authored container |
| `primitive.palette.ion.dark.onPrimarySoft` | color | `#dbedf0` | Ink on the soft container |
| `primitive.palette.ion.dark.outline` | color | `#8ac4cf` | Functional boundary |
| `primitive.palette.ion.dark.decorative` | color | `#14889f` | Atmosphere and decorative light |
| `primitive.palette.ion.dark.companion` | color | `#3D45E5` | Paired atmosphere colour |
| `primitive.palette.ion.dark.glow` | color | `#36DCD1` | Highlight light |
| `primitive.palette.amethyst.seed` | color | `#8430C6` | — |
| `primitive.palette.amethyst.companion` | color | `#CE49B2` | — |
| `primitive.palette.amethyst.glow` | color | `#9198FF` | — |
| `primitive.palette.amethyst.light.canvas` | color | `#f9f6fc` | Foundation behind every surface |
| `primitive.palette.amethyst.light.surface` | color | `#ffffff` | Opaque reading surface |
| `primitive.palette.amethyst.light.surfaceAlt` | color | `#f4ecfa` | Secondary reading surface |
| `primitive.palette.amethyst.light.text` | color | `#19102b` | Body ink |
| `primitive.palette.amethyst.light.muted` | color | `#462b68` | Supporting ink |
| `primitive.palette.amethyst.light.primary` | color | `#8430C6` | Action colour |
| `primitive.palette.amethyst.light.onPrimary` | color | `#ffffff` | Ink on the action colour |
| `primitive.palette.amethyst.light.primarySoft` | color | `#e9daf5` | Selected or authored container |
| `primitive.palette.amethyst.light.onPrimarySoft` | color | `#30174d` | Ink on the soft container |
| `primitive.palette.amethyst.light.outline` | color | `#69478f` | Functional boundary |
| `primitive.palette.amethyst.light.decorative` | color | `#8430C6` | Atmosphere and decorative light |
| `primitive.palette.amethyst.light.companion` | color | `#CE49B2` | Paired atmosphere colour |
| `primitive.palette.amethyst.light.glow` | color | `#9198FF` | Highlight light |
| `primitive.palette.amethyst.dark.canvas` | color | `#130d22` | Foundation behind every surface |
| `primitive.palette.amethyst.dark.surface` | color | `#1e162c` | Opaque reading surface |
| `primitive.palette.amethyst.dark.surfaceAlt` | color | `#36254e` | Secondary reading surface |
| `primitive.palette.amethyst.dark.text` | color | `#f8f3fc` | Body ink |
| `primitive.palette.amethyst.dark.muted` | color | `#dfc9f0` | Supporting ink |
| `primitive.palette.amethyst.dark.primary` | color | `#cfaee9` | Action colour |
| `primitive.palette.amethyst.dark.onPrimary` | color | `#180f29` | Ink on the action colour |
| `primitive.palette.amethyst.dark.primarySoft` | color | `#391b56` | Selected or authored container |
| `primitive.palette.amethyst.dark.onPrimarySoft` | color | `#eee2f7` | Ink on the soft container |
| `primitive.palette.amethyst.dark.outline` | color | `#c6a0e5` | Functional boundary |
| `primitive.palette.amethyst.dark.decorative` | color | `#8e41cb` | Atmosphere and decorative light |
| `primitive.palette.amethyst.dark.companion` | color | `#CE49B2` | Paired atmosphere colour |
| `primitive.palette.amethyst.dark.glow` | color | `#9198FF` | Highlight light |
| `primitive.palette.harbor.seed` | color | `#4669B2` | — |
| `primitive.palette.harbor.companion` | color | `#8970B5` | — |
| `primitive.palette.harbor.glow` | color | `#72C4DF` | — |
| `primitive.palette.harbor.light.canvas` | color | `#faf8fe` | Foundation behind every surface |
| `primitive.palette.harbor.light.surface` | color | `#ffffff` | Opaque reading surface |
| `primitive.palette.harbor.light.surfaceAlt` | color | `#e7e7f1` | Secondary reading surface |
| `primitive.palette.harbor.light.text` | color | `#30323a` | Body ink |
| `primitive.palette.harbor.light.muted` | color | `#5c5f68` | Supporting ink |
| `primitive.palette.harbor.light.primary` | color | `#4b5e8b` | Action colour |
| `primitive.palette.harbor.light.onPrimary` | color | `#f9f8ff` | Ink on the action colour |
| `primitive.palette.harbor.light.primarySoft` | color | `#b8cbff` | Selected or authored container |
| `primitive.palette.harbor.light.onPrimarySoft` | color | `#2f436e` | Ink on the soft container |
| `primitive.palette.harbor.light.outline` | color | `#787a84` | Functional boundary |
| `primitive.palette.harbor.light.decorative` | color | `#4669B2` | Atmosphere and decorative light |
| `primitive.palette.harbor.light.companion` | color | `#8970B5` | Paired atmosphere colour |
| `primitive.palette.harbor.light.glow` | color | `#72C4DF` | Highlight light |
| `primitive.palette.harbor.dark.canvas` | color | `#0d0e12` | Foundation behind every surface |
| `primitive.palette.harbor.dark.surface` | color | `#111318` | Opaque reading surface |
| `primitive.palette.harbor.dark.surfaceAlt` | color | `#1d1f26` | Secondary reading surface |
| `primitive.palette.harbor.dark.text` | color | `#e4e5f0` | Body ink |
| `primitive.palette.harbor.dark.muted` | color | `#a9aab5` | Supporting ink |
| `primitive.palette.harbor.dark.primary` | color | `#b8c6ee` | Action colour |
| `primitive.palette.harbor.dark.onPrimary` | color | `#314060` | Ink on the action colour |
| `primitive.palette.harbor.dark.primarySoft` | color | `#445274` | Selected or authored container |
| `primitive.palette.harbor.dark.onPrimarySoft` | color | `#dae3ff` | Ink on the soft container |
| `primitive.palette.harbor.dark.outline` | color | `#73757f` | Functional boundary |
| `primitive.palette.harbor.dark.decorative` | color | `#4669B2` | Atmosphere and decorative light |
| `primitive.palette.harbor.dark.companion` | color | `#8970B5` | Paired atmosphere colour |
| `primitive.palette.harbor.dark.glow` | color | `#72C4DF` | Highlight light |
| `primitive.palette.harbor.dark.contentOwnSurface` | color | `#283c60` | — |

### Primitive · material

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `primitive.material.acrylicBlur` | dimension | `40px` | — |
| `primitive.material.acrylicSaturation` | number | `125` | — |
| `primitive.material.glassBlur` | dimension | `20px` | — |
| `primitive.material.glassSaturation` | number | `165` | — |
| `primitive.material.glassOpacity` | number | `0.2` | — |
| `primitive.material.grainOpacity` | number | `0.045` | — |
| `primitive.material.labelVeil` | number | `0.55` | — |
| `primitive.material.labelVeilDark` | number | `0.6` | — |
| `primitive.material.contentOpacity` | number | `0.8` | — |
| `primitive.material.contentFeather` | dimension | `1.95px` | — |
| `primitive.material.stoneFeather` | dimension | `1.95px` | — |
| `primitive.material.mirageColor` | color | `#111525` | — |
| `primitive.material.mirageOpacity` | number | `0.38` | — |
| `primitive.material.mirageBlur` | dimension | `28px` | — |
| `primitive.material.mirageSaturation` | number | `165` | — |
| `primitive.material.mirageBrightness` | number | `88` | — |
| `primitive.material.mirageFallbackOpacity` | number | `0.64` | — |
| `primitive.material.plasticInactive.light` | color | `#f1f1f3` | — |
| `primitive.material.plasticInactive.dark` | color | `#202126` | — |

### Primitive · duration

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `primitive.duration.press` | duration | `120ms` | — |
| `primitive.duration.state` | duration | `213.33ms` | — |
| `primitive.duration.spatial` | duration | `293.33ms` | — |
| `primitive.duration.exit` | duration | `160ms` | — |
| `primitive.duration.material` | duration | `1000ms` | — |
| `primitive.duration.liquid` | duration | `1400ms` | — |
| `primitive.duration.flow` | duration | `1200ms` | — |
| `primitive.duration.departure` | duration | `650ms` | — |
| `primitive.duration.maxDuration` | duration | `5000ms` | — |

### Primitive · distance

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `primitive.distance.panel` | dimension | `24px` | — |
| `primitive.distance.floating` | dimension | `30px` | — |
| `primitive.distance.content` | dimension | `0px` | — |
| `primitive.distance.exit` | dimension | `20px` | — |
| `primitive.distance.depth` | dimension | `50px` | — |
| `primitive.distance.feather` | dimension | `6px` | — |
| `primitive.distance.maxTravel` | dimension | `50px` | — |

### Primitive · easing

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `primitive.easing.enter` | cubicBezier | `cubic-bezier(0.22, 0.65, 0.22, 1)` | — |
| `primitive.easing.settle` | cubicBezier | `cubic-bezier(0.2, 0, 0.2, 1)` | — |
| `primitive.easing.exit` | cubicBezier | `cubic-bezier(0.4, 0, 0.6, 1)` | — |

## Semantic tokens

What a value *means*: the surface a card sits on, the duration a control settles over. Components consume this tier and nothing below it.

114 tokens.

### Semantic · material

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `semantic.material.frost.diffusion` | dimension | `{primitive.material.acrylicBlur}` | Frost backdrop diffusion |
| `semantic.material.frost.saturation` | number | `{primitive.material.acrylicSaturation}` | Frost backdrop saturation, percent |
| `semantic.material.frost.grain` | number | `{primitive.material.grainOpacity}` | Frost grain opacity |
| `semantic.material.resin.diffusion` | dimension | `{primitive.material.glassBlur}` | Resin backdrop diffusion |
| `semantic.material.resin.saturation` | number | `{primitive.material.glassSaturation}` | Resin backdrop saturation, percent |
| `semantic.material.resin.fill` | number | `{primitive.material.glassOpacity}` | Resin fill opacity, fixed by the material contract |
| `semantic.material.stone.fill.light` | number | `{primitive.material.labelVeil}` | Stone label backing, light mode |
| `semantic.material.stone.fill.dark` | number | `{primitive.material.labelVeilDark}` | Stone label backing, dark mode |
| `semantic.material.stone.feather` | dimension | `{primitive.material.stoneFeather}` | Stone feathered perimeter |
| `semantic.material.haze.fill` | number | `{primitive.material.contentOpacity}` | Haze content fill opacity |
| `semantic.material.haze.feather` | dimension | `{primitive.material.contentFeather}` | Haze feathered perimeter |
| `semantic.material.mirage.colour` | color | `{primitive.material.mirageColor}` | Mirage scrim colour |
| `semantic.material.mirage.opacity` | number | `{primitive.material.mirageOpacity}` | Mirage scrim opacity |
| `semantic.material.mirage.diffusion` | dimension | `{primitive.material.mirageBlur}` | Mirage chromatic diffusion |
| `semantic.material.mirage.saturation` | number | `{primitive.material.mirageSaturation}` | Mirage saturation, percent |
| `semantic.material.mirage.brightness` | number | `{primitive.material.mirageBrightness}` | Mirage brightness, percent |
| `semantic.material.mirage.fallback` | number | `{primitive.material.mirageFallbackOpacity}` | Mirage opacity without backdrop filtering |
| `semantic.material.plastic.inactive.light` | color | `{primitive.material.plasticInactive.light}` | Plastic neutral fallback, inactive window |
| `semantic.material.plastic.inactive.dark` | color | `{primitive.material.plasticInactive.dark}` | Plastic neutral fallback, inactive window |

### Semantic · feedback

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `semantic.feedback.light.success.ink` | color | `#175D38` | — |
| `semantic.feedback.light.success.surface` | color | `#E5F4EA` | — |
| `semantic.feedback.light.success.symbol` | string | `✓` | Carries meaning without colour. A check mark means validated or informational, never selected. |
| `semantic.feedback.light.success.label` | string | `Ready` | — |
| `semantic.feedback.light.attention.ink` | color | `#714B00` | — |
| `semantic.feedback.light.attention.surface` | color | `#FFF0CD` | — |
| `semantic.feedback.light.attention.symbol` | string | `△` | Carries meaning without colour. A check mark means validated or informational, never selected. |
| `semantic.feedback.light.attention.label` | string | `Review needed` | — |
| `semantic.feedback.light.danger.ink` | color | `#941D36` | — |
| `semantic.feedback.light.danger.surface` | color | `#FFE8EC` | — |
| `semantic.feedback.light.danger.symbol` | string | `!` | Carries meaning without colour. A check mark means validated or informational, never selected. |
| `semantic.feedback.light.danger.label` | string | `Action blocked` | — |
| `semantic.feedback.light.info.ink` | color | `#334155` | — |
| `semantic.feedback.light.info.surface` | color | `#E8EDF4` | — |
| `semantic.feedback.light.info.symbol` | string | `i` | Carries meaning without colour. A check mark means validated or informational, never selected. |
| `semantic.feedback.light.info.label` | string | `Information` | — |
| `semantic.feedback.dark.success.ink` | color | `#9BE2B3` | — |
| `semantic.feedback.dark.success.surface` | color | `#173525` | — |
| `semantic.feedback.dark.success.symbol` | string | `✓` | Carries meaning without colour. A check mark means validated or informational, never selected. |
| `semantic.feedback.dark.success.label` | string | `Ready` | — |
| `semantic.feedback.dark.attention.ink` | color | `#FFDA8A` | — |
| `semantic.feedback.dark.attention.surface` | color | `#3D2D0E` | — |
| `semantic.feedback.dark.attention.symbol` | string | `△` | Carries meaning without colour. A check mark means validated or informational, never selected. |
| `semantic.feedback.dark.attention.label` | string | `Review needed` | — |
| `semantic.feedback.dark.danger.ink` | color | `#FFB2C0` | — |
| `semantic.feedback.dark.danger.surface` | color | `#481C29` | — |
| `semantic.feedback.dark.danger.symbol` | string | `!` | Carries meaning without colour. A check mark means validated or informational, never selected. |
| `semantic.feedback.dark.danger.label` | string | `Action blocked` | — |
| `semantic.feedback.dark.info.ink` | color | `#D2DCEC` | — |
| `semantic.feedback.dark.info.surface` | color | `#263244` | — |
| `semantic.feedback.dark.info.symbol` | string | `i` | Carries meaning without colour. A check mark means validated or informational, never selected. |
| `semantic.feedback.dark.info.label` | string | `Information` | — |

### Semantic · motion

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `semantic.motion.duration.press` | duration | `{primitive.duration.press}` | — |
| `semantic.motion.duration.state` | duration | `{primitive.duration.state}` | — |
| `semantic.motion.duration.spatial` | duration | `{primitive.duration.spatial}` | — |
| `semantic.motion.duration.exit` | duration | `{primitive.duration.exit}` | — |
| `semantic.motion.duration.material` | duration | `{primitive.duration.material}` | — |
| `semantic.motion.duration.liquid` | duration | `{primitive.duration.liquid}` | — |
| `semantic.motion.duration.flow` | duration | `{primitive.duration.flow}` | — |
| `semantic.motion.duration.departure` | duration | `{primitive.duration.departure}` | — |
| `semantic.motion.duration.ceiling` | duration | `{primitive.duration.maxDuration}` | Hard ceiling for any single animation, including replay-rate adjustment |
| `semantic.motion.easing.enter` | cubicBezier | `{primitive.easing.enter}` | — |
| `semantic.motion.easing.settle` | cubicBezier | `{primitive.easing.settle}` | — |
| `semantic.motion.easing.exit` | cubicBezier | `{primitive.easing.exit}` | — |
| `semantic.motion.travel.panel` | dimension | `{primitive.distance.panel}` | — |
| `semantic.motion.travel.floating` | dimension | `{primitive.distance.floating}` | — |
| `semantic.motion.travel.content` | dimension | `{primitive.distance.content}` | — |
| `semantic.motion.travel.exit` | dimension | `{primitive.distance.exit}` | — |
| `semantic.motion.travel.depth` | dimension | `{primitive.distance.depth}` | — |
| `semantic.motion.travel.feather` | dimension | `{primitive.distance.feather}` | — |
| `semantic.motion.travel.max` | dimension | `{primitive.distance.maxTravel}` | — |

### Semantic · typography

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `semantic.typography.family` | fontFamily | `Manrope` | — |
| `semantic.typography.readingSize` | dimension | `16px` | — |
| `semantic.typography.readingLeading` | dimension | `24px` | — |
| `semantic.typography.scale.display.ratio` | number | `2` | display: multiple of the reading size |
| `semantic.typography.scale.display.leading` | number | `1.1` | display: line height as a multiple of its own size |
| `semantic.typography.scale.display.tracking` | dimension | `-0.055em` | display: letter spacing |
| `semantic.typography.scale.title.ratio` | number | `1.5` | title: multiple of the reading size |
| `semantic.typography.scale.title.leading` | number | `1.2` | title: line height as a multiple of its own size |
| `semantic.typography.scale.title.tracking` | dimension | `-0.04em` | title: letter spacing |
| `semantic.typography.scale.heading.ratio` | number | `1.25` | heading: multiple of the reading size |
| `semantic.typography.scale.heading.leading` | number | `1.3` | heading: line height as a multiple of its own size |
| `semantic.typography.scale.heading.tracking` | dimension | `-0.03em` | heading: letter spacing |
| `semantic.typography.scale.subheading.ratio` | number | `1.0625` | subheading: multiple of the reading size |
| `semantic.typography.scale.subheading.leading` | number | `1.45` | subheading: line height as a multiple of its own size |
| `semantic.typography.scale.subheading.tracking` | dimension | `-0.01em` | subheading: letter spacing |
| `semantic.typography.scale.body.ratio` | number | `1` | body: multiple of the reading size |
| `semantic.typography.scale.body.leading` | number | `1.5` | body: line height as a multiple of its own size |
| `semantic.typography.scale.body.tracking` | dimension | `0` | body: letter spacing |
| `semantic.typography.scale.caption.ratio` | number | `0.8125` | caption: multiple of the reading size |
| `semantic.typography.scale.caption.leading` | number | `1.45` | caption: line height as a multiple of its own size |
| `semantic.typography.scale.caption.tracking` | dimension | `0` | caption: letter spacing |

### Semantic · spacing

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `semantic.spacing.2xs` | dimension | `4px` | Spacing step 2xs |
| `semantic.spacing.xs` | dimension | `8px` | Spacing step xs |
| `semantic.spacing.sm` | dimension | `12px` | Spacing step sm |
| `semantic.spacing.md` | dimension | `16px` | Spacing step md |
| `semantic.spacing.lg` | dimension | `24px` | Spacing step lg |
| `semantic.spacing.xl` | dimension | `32px` | Spacing step xl |
| `semantic.spacing.2xl` | dimension | `48px` | Spacing step 2xl |

### Semantic · breakpoint

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `semantic.breakpoint.sm` | dimension | `600px` | Viewport width at which the sm layout begins |
| `semantic.breakpoint.md` | dimension | `850px` | Viewport width at which the md layout begins |
| `semantic.breakpoint.lg` | dimension | `1150px` | Viewport width at which the lg layout begins |
| `semantic.breakpoint.xl` | dimension | `1500px` | Viewport width at which the xl layout begins |

### Semantic · shape

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `semantic.shape.contentRadius` | dimension | `28px` | Default content radius; adjustable 14-28px |

### Semantic · range

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `semantic.range.atmosphere` | number | `90` | Default 90; valid range 15-90 |
| `semantic.range.translucency` | number | `35` | Default 35; valid range 35-85 |
| `semantic.range.elevation` | number | `125` | Default 125; valid range 60-150 |
| `semantic.range.radius` | number | `28` | Default 28; valid range 14-28 |
| `semantic.range.motionSpeed` | number | `1` | Default 1; valid range 0.25-2 |

### Semantic · default

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `semantic.default.palette` | string | `prism` | — |
| `semantic.default.mode` | string | `light` | — |
| `semantic.default.density` | string | `comfortable` | — |
| `semantic.default.font` | string | `manrope` | — |
| `semantic.default.reduced` | boolean | `false` | — |
| `semantic.default.reduceMotion` | boolean | `false` | — |

## Component tokens

Values that belong to one component family and would be wrong to reuse elsewhere. This tier exists so a component can be specific without inventing a private constant.

40 tokens.

### Component · action

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.action.radius` | dimension | `999px` | Action controls are pill-shaped, independent of the content radius |
| `component.action.minTarget` | dimension | `44px` | Minimum interactive target |
| `component.action.paddingBlock` | dimension | `15px` | Action control block padding |
| `component.action.paddingInline` | dimension | `24px` | Action control inline padding |
| `component.action.gap` | dimension | `9px` | Gap between an action's icon and its label |
| `component.action.disabledOpacity` | number | `0.55` | Opacity of a disabled control |

### Component · scrollbar

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.scrollbar.width` | dimension | `10px` | Scrollbar track width |
| `component.scrollbar.thumbMinLength` | dimension | `32px` | Shortest a thumb may become, so a very long surface stays draggable |
| `component.scrollbar.inset` | dimension | `2px` | Gap between the thumb and the track edge |

### Component · scrollArea

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.scrollArea.fadeDepth` | dimension | `24px` | Depth of the scroll area edge fade, and the scroll padding that keeps focus clear of it |

### Component · layout

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.layout.containerMax` | dimension | `1536px` | Widest the page shell becomes |
| `component.layout.readingMax` | dimension | `920px` | Widest a column of prose becomes, so a line stays a comfortable length |
| `component.layout.gutterCompact` | dimension | `18px` | Shell gutter below the sm breakpoint |
| `component.layout.gutterBase` | dimension | `26px` | Shell gutter between the sm and lg breakpoints |
| `component.layout.gutterWide` | dimension | `44px` | Shell gutter at the lg breakpoint and above |
| `component.layout.minCellWidth` | dimension | `240px` | Narrowest an auto-flowing grid cell becomes before the grid drops a column |
| `component.layout.sidebarWidth` | dimension | `280px` | Default width of a shell's supporting panel: a two-word label plus an icon at comfortable density |

### Component · icon

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.icon.size` | dimension | `20px` | An icon in running content or beside a label |
| `component.icon.action` | dimension | `24px` | The single icon inside an icon button |

### Component · choice

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.choice.boxSize` | dimension | `26px` | A checkbox box or a radio circle |
| `component.choice.boxRadius` | dimension | `9px` | The checkbox box corner; a radio is a circle |

### Component · switch

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.switch.trackWidth` | dimension | `44px` | Switch track width |
| `component.switch.trackHeight` | dimension | `28px` | Switch track height |

### Component · slider

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.slider.trackHeight` | dimension | `8px` | Slider track thickness |
| `component.slider.thumbSize` | dimension | `26px` | Slider thumb, padded to the target floor |

### Component · chip

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.chip.height` | dimension | `32px` | A compact chip, inside a 44px target |

### Component · overlayArrow

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.overlayArrow.size` | dimension | `14px` | The side of the rotated square that points at an overlay's trigger |
| `component.overlayArrow.radius` | dimension | `3px` | The arrow's tip radius, so a pointer is not a needle |

### Component · overlay

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.overlay.maxWidth` | dimension | `480px` | How wide an anchored popover may grow before it stops being anchored to anything |
| `component.overlay.tooltipMaxWidth` | dimension | `352px` | About sixty characters: a tooltip longer than this is documentation |

### Component · field

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.field.wellInset` | dimension | `7px` | How much tighter a well's radius is than the shell containing it |

### Component · card

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.card.radius` | dimension | `{semantic.shape.contentRadius}` | Card-shaped buttons keep the content radius so artwork is not clipped |

### Component · focus

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.focus.coreWidth` | dimension | `2px` | Crisp focus core, never blurred |
| `component.focus.coreOffset` | dimension | `3px` | — |

### Component · indicator

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.indicator.size` | dimension | `20px` | Circular state badge |
| `component.indicator.fieldSize` | dimension | `24px` | — |
| `component.indicator.lineWidth` | dimension | `3px` | A line that marks: a drop target's rule, a selected swatch's ring, a quotation's leading rule |

### Component · anchor

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.anchor.underlineOffset` | dimension | `4px` | How far a link's underline sits below the baseline, so a descender is not struck through |

### Component · tree

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.tree.indentStep` | dimension | `20px` | How far one level of a tree is indented from its parent |

### Component · haze

| Token | Type | Value | Meaning |
| --- | --- | --- | --- |
| `component.haze.inset` | dimension | `8px` | How far a Resin surface holds its Haze content fill back from its own rim, so the glass edge still reads while the label sits on a stable ground. The fill is feathered and therefore lives on an isolated layer behind the content; feathering an element that contains text blurs the text. A Resin strip uses the same inset and its pills carry no material of their own. |

## Deprecations

A deprecated token still resolves. It is listed here so adopters can migrate before
it is removed, which is the only reason to keep a name that no longer describes its
value.

| Token | Replacement or reason |
| --- | --- |
| `removedIn` | 3.0.0 |
| `reason` | Superseded by the named material vocabulary. Two names for one concept is a documentation and tooling problem that multiplies across platform libraries. |
| `tokens` | [object Object] |
| `classes` | [object Object] |

