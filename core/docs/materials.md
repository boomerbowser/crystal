# Materials, depth and optical detail

**The defining order is Plastic → Frost → Resin, from back to front.** Plastic is the foundation, Frost the intermediate material layer, and Resin the highest functional control layer. Haze reading wells preserve legibility within this hierarchy. Crystal is a custom design system. It is not a vendor-certified combination of Microsoft and Apple systems.

## Visual acceptance requirement

The approved Crystal material studies define the intended appearance. Every implementation must preserve their distinct opacity and diffusion, transmitted color, optical contours, elevation, soft reading-fill edges and crisp text. If a component or material departs from those qualities without an approved reason, treat it as a defect. Check actual UI screenshots as well as tokens. Dark mode and alternate palettes must preserve the same relationships; documented accessibility fallbacks remain required.

## Recommended defaults

Use these settings as Crystal’s recommended starting point across products:

<!-- generated:defaults -->

| Setting | Recommended default | Valid range |
|---|---|---|
| Color atmosphere | 90% | 15% to 90% |
| Frost base tint | 35% | 35% to 85% |
| Elevation | 125% | 60% to 150% |
| Corner radius | 28px | 14px to 28px |
| Motion speed | 1× | 0.25× to 2× |
| Palette | `prism` | None |
| Mode | `light` | None |
| Density | `comfortable` | None |
| Font | `manrope` | None |
| Reduced | `false` | None |
| Reduce motion | `false` | None |
<!-- /generated:defaults -->

The canonical tokens, generated theme and playground’s **Reset** action use these values. Saved user preferences remain customizable. Frost’s existing recipe adds 10 percentage points to its base tint, so the recommended 35% base produces a 45% surface fill. Resin remains fixed at 20% fill opacity; opaque accessibility fallbacks take precedence.

## Material family and inspiration

Crystal has six first-class materials: Plastic, Frost, Resin, Haze, Stone, and Mirage. Each has its own named recipe and reusable primitive. Plastic → Frost → Resin is the main spatial stack. Haze and Stone are readable fills within components, and Mirage separates a modal from the rest of the interface.

| Crystal material | Previous name / inspiration | Crystal adaptation |
|---|---|---|
| Plastic | Microsoft Mica | Opaque contextual foundation, bounded product tint and neutral inactive state |
| Frost | Microsoft Acrylic | Diffusion, tint and grain tuned for Crystal’s intermediate surfaces |
| Resin | Apple Liquid Glass | Floating optical contours, 20% fill and authored web blur rather than native refraction |
| Haze | Solid content | 80% reading fill with a 1.95px feathered perimeter |
| Stone | Protected labels | 55% light / 60% dark backing, feathered like Haze, with crisp labels |
| Mirage | Smoke / modal scrim | Chromatic diffusion of the underlying scene, darkened behind a focused modal |

Plastic, Frost and Resin are based on and inspired by their respective platform materials, then adjusted to work together as Crystal. They are not vendor-certified implementations. Microsoft’s [Mica](https://learn.microsoft.com/en-us/windows/apps/design/style/mica) describes an opaque contextual base; [Acrylic](https://learn.microsoft.com/en-us/windows/apps/design/style/acrylic) combines tint, diffusion and texture; Apple’s [material guidance](https://developer.apple.com/design/human-interface-guidelines/materials) informs Resin’s floating functional role. Haze, Stone and Mirage are Crystal’s adaptations of content fills, readability veils and modal scrims.

## Material assignment

| Material | Web recipe | Where it belongs |
|---|---|---|
| Plastic | Opaque canvas with bounded product-color gradients; no backdrop blur | Root scene/window; one contextual foundation |
| Haze | 80% content fill, 1.95px feathered perimeter and shallow paired shadows; crisp foreground | Reading, structured lists, forms, messages, consequential decisions |
| Frost | Default 45% surface tint (35% base), 40px blur, 125% saturation, grain opacity .045 | Intermediate task frames, transient panels and overlays, with Haze reading/input surrounds |
| Resin | Fixed 20% surface tint, 20px blur, 165% saturation, defined rim, strongest floating shadow | One clustered navigation or control plane |
| Stone | 55% light / 60% dark fill with a 1.95px feather inside the Resin plane | Navigation labels and material comparison captions |
| Mirage | #111525 at 38% opacity; 28px backdrop blur, 165% saturation, 88% brightness; Haze decision surface above | Blocking decisions, focus managed by the dialog |

Resin renders at a fixed 20% fill opacity in both modes, independent of the Frost base tint control. Frost retains its existing recipe (45% fill from the recommended 35% base). Text, rims and shadows retain their opacity. Label protection is 55% in light mode and 60% in dark mode, with the dark backing strengthened to preserve contrast over bright backdrops at this lower glass opacity. Opaque accessibility fallbacks remain fully opaque. This deliberately differs from the original recipes preserved in `reference/`.

The persistent Frost task frame is a Crystal hybrid and does not claim strict Microsoft placement conformance. One frame can contain several softened content wells; avoid nesting independently blurred panes. All three live scenes show that same stack.

Do not apply opacity to an entire pane containing text. Do not stack backdrop blur on adjacent cards or every message; the content recipe feathers only its own background paint. Do not sample the desktop, capture other windows or duplicate private content into canvases to create a refraction effect. This implementation provides CSS blur, tint, texture, highlights and shadows; it does not implement native optical lensing.

## Material recipe values

This table lists the numbers every material resolves to, generated from
`tokens/crystal.json`. It is the authority: where the prose above describes a technique,
these are the values that technique uses.

<!-- generated:material-recipes -->

| Material | Diffusion | Fill |
|---|---|---|
| **Plastic** | Opaque. No backdrop filter at all. | None |
| **Frost** | 40px blur, 125% saturation | grain 0.045 |
| **Resin** | 20px blur, 165% saturation | fixed 20% fill, both modes |
| **Haze** | 80% content fill | 1.95px feather |
| **Stone** | 55% light / 60% dark | 1.95px feather |
| **Mirage** | 28px blur, 165% saturation, 88% brightness | #111525 at 38%; 64% without backdrop filtering |
<!-- /generated:material-recipes -->

## Haze: integrated reading surfaces

Haze is Crystal’s named content material, previously called Solid. Its normal recipe uses 80% fill opacity and a 1.95px edge feather, so the underlying Frost or Resin contributes color rather than ending abruptly at a sheet of blank fill. Plastic → Frost → Resin remains the governing hierarchy; a reading fill within a Resin component is part of that component.

The `.cr-haze`, `.cr-well`, `.cr-bubble`, `.cr-content-fill` and `.cr-dialog` primitives paint the fill on an isolated, non-interactive `::before` layer. Only that paint layer receives `filter: blur(1.95px)`; text, icons, selection, hit areas and focus outlines stay sharp and fully opaque. The broad interior remains at 80%, while the narrow perimeter feathers into its surroundings. Keep at least 12px of padding between readable content and the feathered edge, including around rounded corners. Do not clip the feather with an ancestor's overflow unless media requires the clip.

Neutral and tinted message surfaces both follow this recipe. The Harbor palette uses stronger supporting ink and a deeper authored-message fill to retain contrast with the added transparency. This is separate from the palette’s solid action/status colors. Actual input controls, status badges and consequential action buttons retain explicit boundaries and their protected color pairs; their surrounding content surface uses the softened fill. Stone retains its own label-backing opacity, separate from Haze.

The reference includes a content card over a Resin panel. Its appearance follows the palette and light/dark controls, and opaque fallback restores a 100% fill with no feather. Reduced-transparency preferences and forced colors also restore stable surfaces. Exported CSS and JSON include `--cr-haze-fill`, `--cr-haze-own-fill`, `--cr-haze-feather`, `--cr-haze-inset`, and the corresponding content foreground roles.

The contrast model tests 80% interior fill and a conservative 79% reading-area bound against RGB-corner backdrops in every palette and mode. It does not certify pixels along the intentionally fading perimeter; place no text in that perimeter and verify actual padding, imagery and layering in each product.

## Stone: protected labels

Stone is the lighter-density backing shown inside Resin controls. It has the same 1.95px background feather as Haze, with 55% opacity in light mode and 60% in dark mode. Haze remains 80%. The two recipes are independent.

`.cr-stone` paints `--cr-stone-fill` on an isolated `::before` layer with `--cr-stone-feather`; text and icons are neither blurred nor faded. The dock’s `.cr-dock-inner` uses the same recipe. Keep readable content at least 12px from the feathered perimeter, counting both group and button padding. Shapes, marks and labels continue to convey state beyond color. Reduced transparency restores an opaque, unfeathered backing; forced colors uses system colors.

Stone’s contrast model includes Resin’s 20% fill, optical highlights and a conservative one-percentage-point reduction in the label fill to cover the feather’s reading-area tail. The feathered perimeter itself is not a valid text area.

## Mirage: modal separation

Mirage is the named material formerly called Smoke. Its recipe blends the actual colors underneath into a dark, chromatic backdrop: 28px blur, then 165% saturation, then 88% brightness, followed by a 38% `#111525` tint. Broad diffusion merges shapes into color fields, and saturation preserves their color through the dark veil. No fixed brand gradient, hue rotation, screenshot capture or duplicate page render is used. A Haze modal sits above it and remains crisp. Mirage is not a content surface and must not carry ordinary reading text.

The working native dialog uses Mirage through `::backdrop`. `.cr-mirage` exposes the same paint recipe for application-owned overlay implementations; it does not itself implement modal behavior, positioning or focus management. Products must provide actual modality, keyboard containment, a named dialog, dismissal and focus return. The preview’s **Preview Mirage** button opens the real dialog. Reduced transparency removes diffusion and color filtering and uses a stronger 64% `#111525` scrim; the same scrim is the unsupported-filter fallback. Modal separation remains visible. The preview also includes a live artwork comparison: toggle Mirage to see the real underlying colors before and after the filter. Changing the palette changes the artwork and therefore the resulting chromatic blur.

## Plastic: Mica inspiration and adaptation

Plastic adapts Mica’s opacity, subtle contextual tint, light/dark awareness, and a neutral inactive-window fallback. The active/inactive study demonstrates those properties: the window remains fully opaque, and the context’s shapes do not pass through it. The browser uses a preselected product color impression; it does not access desktop wallpaper. Native implementations should use supported OS facilities for wallpaper influence and activation behavior.

The broader Frost/Resin study places vivid artwork above the Plastic foundation so blur can be inspected. That artwork is content. It does not claim that native Mica paints saturated wallpaper detail. The ordinary app preview keeps a restrained contextual base and puts stronger colors into accents and content. [Fluent material roles](https://fluent2.microsoft.design/material).

The reusable `.cr-plastic[data-window-active="false"]` state removes contextual gradients and uses the opaque `--cr-plastic-inactive` token: `#f1f1f3` in light mode and `#202126` in dark. These are Crystal fallback values, not vendor constants. The host supplies activation state; the preview uses an explicit switch. Active tint is bounded by the atmosphere control: the two gradient alpha maxima are 21.6%/17.1% in light mode and 26.1%/20.7% in dark, always composited over an opaque canvas.

## Frost: Acrylic inspiration and adaptation

Frost adapts Acrylic’s broad backdrop diffusion; the light version has milky tint, while the dark version has charcoal tint, with background color and large shapes still visible. The shared extension increases Frost diffusion to 40px, uses 125% saturation and fine grain at .045 opacity. Resin retains its sharper rim and 20px blur. These authored web values are visual targets, not extracted Microsoft constants.

The playground includes a layered, adjustable material study.

## Resin: Liquid Glass inspiration and adaptation

Resin adapts Liquid Glass’s rounded volume, visible backdrop color, a fine illuminated perimeter, smooth surfaces and floating separation. The refinement adds directional optical sheen and an inner rim, and reduces label backing from 92% to 55% in light mode and 60% in dark mode. Frost remains grainier and more broadly diffused; Resin remains the clearer top functional layer.

The text safety calculation includes the fixed 20% Resin tint, the label veil, and a bright optical highlight over extreme backdrops. Readability relies on tested foreground/background pairs and protected labels, not text shadows. Product layouts still require accessibility verification. The CSS implementation does not claim physical refraction.

## Elevation hierarchy

At 100% elevation, the reference geometry is shown below. The recommended default is 125%, which scales these shadow offsets and blur radii by 1.25:

| Surface | Contact shadow | Ambient shadow | Optical contour |
|---|---|---|---|
| Content | 0 2px 3px | 0 7px 15px | Fine edge |
| Supporting panel | 0 3px 5px | 0 14px 28px | Inset top highlight |
| Floating controls | 0 4px 7px | 0 20px 40px | Top highlight and lower inset contour |

Shadow colors adapt to mode. The elevation control scales offsets and blur from 60% to 150%; hierarchy remains ordered. Depth is a visual relationship and sets no z-index, so products must also manage their actual overlay stack and focus order. Dark mode uses contours and tonal separation alongside shadows.

## Fallbacks

Reduce transparency replaces supporting materials with opaque content surfaces, removes grain/blur, and restores a visible outline. CSS also honors reduced-transparency preferences where supported and falls back when backdrop filtering is unavailable. Reduced motion removes movement; forced colors use system colors and borders. None of these modes hides essential content.

Support claims must be verified on actual target browsers/devices. A native implementation should use supported compositor APIs where appropriate and adapt the custom hierarchy elsewhere. The browser preview does not prove native rendering, energy performance or accessibility parity.

## Performance and composition

Keep backdrop filters confined to a few bounded surfaces, avoid continuous blur animations, and avoid putting a scrolling text layer under numerous overlapping filters. A low-power mode can select the opaque recipe without changing geometry. Measure actual scroll/compositor behavior before setting device-specific budgets.

## Spacing and the layout shell

This section defines two scales as tokens. They name what Crystal's own shell already does, so something other than the preview can reach the values. Neither is a new design decision.

**The spacing scale** is the 4px rhythm, tied at two points to the reading rhythm: `md` is the 16px reading size and `lg` is the 24px leading, so a `lg` gap is exactly one blank line between blocks.

| Step | `2xs` | `xs` | `sm` | `md` | `lg` | `xl` | `2xl` |
|---|---|---|---|---|---|---|---|
| Value | 4px | 8px | 12px | 16px | 24px | 32px | 48px |

`--cr-space` is separate and stays. It is the density-aware padding step, 20px comfortable and 14px compact. The spacing scale does not vary with density, palette or mode.

**The breakpoints** are where the shell already changes: `sm` 600px, `md` 850px, `lg` 1150px, `xl` 1500px. They cannot be custom properties, because a custom property is not usable inside a media query. Libraries compile against them from the generated exports.

**The shell** is a 1536px ceiling with gutters that step down at those breakpoints: 44px at `lg` and above, 26px between `sm` and `lg`, and 18px below `sm`. Inside it is a 920px reading column, which keeps a line of prose a comfortable length.

## The type scale

Crystal specifies a reading rhythm, Manrope at 16/24, and the scale is derived from it. Each step is a ratio of the reading size, so changing `typography.readingSize` changes all six steps and no step is a literal.

| Step | Ratio | Size | Leading | Tracking |
|---|---|---|---|---|
| `display` | 2 | 32px | 1.1 | −0.055em |
| `title` | 1.5 | 24px | 1.2 | −0.04em |
| `heading` | 1.25 | 20px | 1.3 | −0.03em |
| `subheading` | 1.0625 | 17px | 1.45 | −0.01em |
| `body` | 1 | 16px | 1.5 | 0 |
| `caption` | 0.8125 | 13px | 1.45 | 0 |

The scale is modest, because Crystal's hierarchy is carried by weight and material as much as by size, and a dramatic scale competes with both.

Leading tightens as size grows, because large text needs proportionally less leading to read as a block rather than as a list of lines. Tracking tightens with it, because default tracking reads loose at display sizes.

The steps reach CSS as `--cr-text-<step>-size`, `-leading` and `-tracking`. Density tightens leading and never the size. Shrinking text at higher density trades legibility for space, so density tightens spacing and never changes a 44px target or a reading size.

**The level and the step are chosen separately.** A heading's level is its position in the document outline; its step is a design decision. A component where `level={2}` also means "medium" forces a choice between a correct outline and a correct appearance, and products reliably choose appearance.

## Scrolling

A scrollbar belongs to the material it scrolls. There are two scrollbars, and the hierarchy decides which one a surface takes.

| Class | Material | Thumb | Use it on |
|---|---|---|---|
| `.cr-scroll-frost` | Frost | palette ink at 55% | Panels, side navigation, long reading surfaces, and dialogs. Frost is the intermediate surface, so its scrollbar belongs to the panel the way the panel's own text does. |
| `.cr-scroll-resin` | Resin | palette primary at 80% | Floating control planes, menus, popovers, and compact or horizontal scrollers such as `.cr-table-scroll`. Resin is the control plane, so a scrollbar there is tinted like a control. |

`.cr-scroll` carries the behaviour both build on, and can be applied on its own to any scroll container:

- `overscroll-behavior: contain` stops scroll chaining, so a swipe that reaches the end of a scroller does not carry on into the page underneath. The effect shows on a phone and does not show with a mouse.
- `scrollbar-gutter: stable` keeps content from shifting when a vertical scrollbar appears. It is not applied to horizontal-only scrollers, where the gutter would reserve space for a scrollbar that never appears. A dialog takes `stable both-edges` so centred content stays centred.
- `touch-action: pan-x pan-y` leaves the browser's own gesture handling in place, so momentum and rubber-banding still feel native.

A horizontal scroller needs one more declaration. Setting `overflow-x: auto` makes `overflow-y` compute to `auto` as well, so a gutter is reserved for a vertical scrollbar that can never appear, and 12px is lost at the inline edge.

**Add `.cr-scroll-x` to say a scroller is horizontal-only.** CSS cannot work it out, so it has to be declared:

```html
<div class="cr-scroll-resin cr-scroll-x">…</div>
```

It clips the block axis and releases the gutter, which is the same treatment `.cr-table-scroll` gets by being excluded from the gutter rule. `verify-scroll` fails any container that scrolls across but not down while still holding a gutter, so a missing `.cr-scroll-x` is caught.

Both thumbs clear 3:1 against every Crystal surface in all six palettes and both modes; the token gate asserts it. Under reduced transparency and forced colors the thumb goes solid and takes the system or outline colour.

### Edge fades

A scroll area fades its content where there is more beyond the edge. The fade is 24px, on the scrolling axis, at whichever ends have content past them. A fade says "there is more this way" on a touch device, where the scrollbar is an overlay that appears only once you are scrolling.

The fade is a mask, not a painted overlay. An overlay would have to paint the surrounding material, and a colour approximating a translucent material over an unknown backdrop is wrong at every edge except the one it was sampled at. A mask lets the real material show through.

Set `data-cr-scroll` to `start`, `end` or `both`, which says which edges have content beyond them, together with `data-cr-scroll-axis` of `x` or `y`. `start` means the container is *at* its start, so only the far edge fades. Without the attribute nothing fades, so a container with no runtime driving it is unmasked rather than permanently faded at both ends. Start and end are logical: the horizontal gradient turns around in right-to-left.

A mask fades the whole element, its own fill and border included, so the fade belongs on the element that scrolls. A material surface that also scrolls puts its material on a wrapper. Otherwise the panel fades along with the content it holds.

The same token is the container's `scroll-padding`, which keeps the fade accessible. Browsers respect scroll padding when they scroll a newly focused element into view, so a focus ring never comes to rest underneath the fade. Crystal does not blur focus, and a faded focus ring would be the same defect. Forced colors removes the fade entirely.

A native scrollbar cannot carry the material itself: `backdrop-filter` has no effect on one, and the standard properties expose only two colours and a coarse width. A surface that needs the material in full uses the **scroll area** component, which draws its thumb as a real element.

## Acceptance

Inspect light/dark, every palette, strongest atmosphere, both Frost tint extremes, reduced effects, narrow layouts, long labels, text zoom, keyboard focus and relevant backdrop extremes. The material comparison board places all samples over the same saturated motif so differences remain visible. Compare silhouettes and depth relationships as well as pixel similarity.

## Resin with Haze: interactive and compact surfaces

Resin is the primary background for buttons and all interaction surfaces. Its body stays at 20% fill with the existing blur, saturation, illuminated rim and elevation. When contrast requires protection, put an 80% Haze reading fill inside that shell, with the existing 1.95px feather and an 8px visible Resin perimeter, exported as `--cr-haze-inset`. The inset is exported as a token, like the fill and its feather, so that no library retypes the number. Without the inset a library can carry every other Haze token and still paint no fill at all. Keep text sufficiently inset from the feather. The adjustable preview always uses this protected construction.

This same composition is required for small information displays that sit on content: labels, tags, badges and keyboard caps. Transient overlays (tooltips, toasts, menus, dropdowns, flyouts and popovers) are **Frost** (R15e). They open over content, so they are intermediate panels rather than compact controls, and their reading content sits on Haze inside them. The composition does not replace the structural Plastic → Frost → Resin hierarchy or turn every large component into Resin. Stone remains a named material with its own standalone specifications; compact UI labels choose Resin/Haze instead of an isolated Stone slab.

Optical highlights remain below the Haze reading fill, including during animation. They can cross the exposed Resin perimeter without bleaching the protected label background. Contrast models check this actual ordering across all six palettes, both modes and RGB-corner backdrops.

### Interaction surface geometry

Use a broad, luminous Resin rim with an 8px inset reading fill and diffuse paired shadows. Avoid thin dark perimeter strokes on ordinary action buttons; native text-entry fields retain a functional boundary and every control retains a visible keyboard focus ring. Standalone actions use generous padding and full pill geometry.

Toolbars, segmented controls and tab groups share one Resin/Haze surface. Their inactive actions have no separate bevel, backdrop filter or raised outline. Only the selected action gains a raised, strongly colored indicator, plus a non-color selection cue. Temporary menus follow the same shared-surface principle. The material motion suite is unchanged by this visual refinement.


## Material definition on small and nested surfaces

A small Resin control over a Haze reading well can lose the color and depth visible in the larger material studies. Keep the 20% Resin body and 80% inset Haze fill. Supply restrained contextual light under the Haze rather than increasing body opacity or painting the label. The control optical layer mixes glow at 12.6% and decorative color at 8.4% in light mode; dark mode uses 9.8% and 7% (a 30% reduction from the previous rim color opacity). On buttons and action links, inset the chromatic paint by 2px and feather that paint by 2px beneath Haze, so the color blends inward into the content fill. Keep the outer optical contour and all text crisp. Palette specimen colors and selection marks are not blurred. These values are local gradient maxima and leave the global atmosphere and material opacity unchanged. Do not increase saturation to compensate for every additional nested surface. The approved material studies remain the visual authority.

Use a luminous outer contour and soft paired shadows instead of a dark hairline around every control. Text fields have a circular Resin/Haze field-state badge within the Resin surround; keyboard focus still adds a full, clearly visible ring. Checkboxes and radios use contained selection marks, switches retain a contrast-bearing thumb, and sliders use a value-driven track and marked glass thumb. Keep labels and native semantics. Status badges use their semantic symbol and words, with the tested semantic ink/surface pair behind the symbol, rather than a colored perimeter stroke. Selection, errors and focus must remain distinguishable without color.

When adapting controls to different sizes, preserve enough exposed Resin to show the rim and enough protected Haze to keep text crisp. Do not blur the element or its foreground. Opaque, reduced-transparency and forced-color modes remain functional alternatives. Validate actual composed controls in both modes and at narrow widths. An isolated material swatch does not establish component fidelity.

## Light

Every material has an optical behaviour, and the behaviour follows from what the material
physically is. Each behaviour in this table is a rule.

| Material | What it does with light | Why |
| --- | --- | --- |
| **Plastic** | **Emits.** Carries its palette's glow over the atmosphere tint, drifting slowly. | Plastic is opaque, and an opaque material cannot bend light, so the foundation does not refract. |
| **Frost** | **Refracts broadly.** A slow, low-amplitude wander of colour temperature across the surface. | At 40px of diffusion nothing sharp survives. Light through frosted glass carries colour and loses shape, so Frost's refraction is chromatic and formless. |
| **Resin** | **Refracts sharply.** Dispersion concentrated at the rim, with the specular band tracking interaction. | At 20px, detail survives. Resin is the front layer and the one the user is closest to, so its optics are the most defined of the three. |
| **Haze** | **Breathes.** Its boundary travels outward and inward. | Haze is defined by its feathered edge, so the edge is what moves. A fill that pulses in opacity leaves the edge where it is and makes it fainter. |
| **Stone** | **Breathes, more tightly.** The same boundary motion at a shorter period. | Stone is a label backing, so its edge is smaller and closer to text. It moves less far and settles sooner. |
| **Mirage** | **Flows.** A slow current while a dialog is open. | The scrim is the only surface with nothing above it competing for attention. |

Resin and Frost differ in kind as well as in amount. Turning Resin's dispersion down
produces weak Resin and does not produce Frost. The diffusion radius decides which is
correct.

### Light reaches the shadow

The light a material refracts is the light that reaches the surface beneath it, so a
Crystal shadow is not neutral grey. The active palette's companion mixes into the shadow
ink at 34% in light mode and 40% in dark.

**The mix is on the colour only.** Each shadow layer keeps its authored alpha exactly,
because a tinted shadow must not also become heavier. Prism's content shadow moves from
`rgba(39,24,68,.15)` to `rgba(107,40,112,.15)`: the alpha is the same and the colour is
tinted.

### Motion at rest

**Deferred.** This subsection describes the ambient tier that Crystal 2.0 specified, built
and measured, and then withdrew at Meridian's direction (R22; §8 of the library contract).
It is kept as the record of what will return and is not a rule in force. **Nothing in 2.x
moves at rest.** The optical behaviours in the table above run only for the duration of a
motion a person started. Plastic's glow is a material property and stays. Its drift was
ambient and is withdrawn.

What was specified, for when it returns: these behaviours are the material's rest state. A
Crystal surface shows them before anyone touches it, and interaction adds energy to an
effect that is already running: the rest rate, faster on hover, faster still on press, then
decaying back.

The single exception is text entry. Motion competes with the task in a field that is being
typed into, so ambient motion pauses there and nowhere else.

Three rules bound the ambient tier. It runs on the rim and the fill and never on a surface
being read, for the same reason that Resin lenses at its edge and does not ripple through
its middle. It is the first thing `prefers-reduced-motion` removes, and it is removed
entirely. It is an enhancement on top of a complete floor: with the shader layer
unavailable and ambient disabled, every page renders exactly its reference baseline, and
gate G8 proves it.


## Resin never contains Resin

**A Resin surface may not contain another Resin surface.** When something has to sit on
top of a Resin element (a label, a badge, a nested control or a content area), that upper
layer becomes a Haze content fill. This is a hard rule, and it is the one adopters break
most often.

### Why

Resin is a backdrop filter: it samples what is behind it, blurs at 20px and saturates to
165%. A second Resin surface nested inside the first samples the already blurred output of
the outer one. The result is a blur of a blur. Contrast collapses, edge definition
disappears, and any text on the inner surface sits on a smeared field that changes as the
page scrolls behind it.

This is a repeatedly documented failure of translucent interface materials: stacked
translucency looks good in a static mock and is illegible in use. Crystal changes what the
upper layer is made of. Softening Resin would regress the material.

### The fix is always the upper layer

| Situation | Wrong | Right |
| --- | --- | --- |
| A label on a Resin dock | Give the label its own Resin chip | Give it a Haze content fill, or Stone if the backdrop is unknown |
| A control inside a Resin bar | `.cr-resin` on the control | Plastic control, no backdrop filter |
| A content area in a Resin panel | Nested `.cr-resin` | `.cr-haze` recessed into the frame |

Never weaken the outer Resin to make a nested one legible. Resin's parameters are fixed
at 20px blur, 165% saturation and a 20% fill, and they do not change to accommodate a
composition that should not exist.

### How it is enforced

The rule is enforced in CSS, which corrects a mistake where it occurs:

```css
/* Any control inside a Resin surface loses its own backdrop filter and gets its
   own stacking context, so it composites against the frame instead of resampling it. */
:is(.cr-resin,.cr-glass,.cr-resin-haze) :is(button,a.cr-button,.cr-button,.cr-control){
  backdrop-filter:none;
  -webkit-backdrop-filter:none;
  isolation:isolate;
}
```

It is also checked. `npm run audit:materials` loads every page in the site, reads the
*computed* backdrop filter of every element, classifies each surface by its blur radius
against the live `--cr-resin-blur` and `--cr-frost-blur` tokens, and fails on any Resin
nested inside Resin. The audit classifies by radius and not by "has a backdrop filter",
because Resin inside Frost is the intended hierarchy and must not be flagged.

This page has no live counter-example. A rendered Resin-on-Resin specimen would break the
rule on the page that specifies it, and the audit, which reads these pages like any other,
would fail the build. The failure is described in words, and only the correct composition
is rendered.

### The correct composition, live

Haze is the readable fill inside a translucent frame. It is recessed, because a raised
fill that floats above its own frame reads as a separate object and no longer as the
frame's content:

<div id="haze-in-resin-demo" class="cr-resin" style="padding:18px;max-width:420px" markdown="1">
<div class="cr-haze" style="padding:14px 16px;border-radius:14px" markdown="1">
This paragraph sits on a Haze content fill inside a Resin frame. The fill is 80% opaque
with a 1.95px feather, and it is recessed into the frame with an inset shadow.
</div>
</div>

The recess is a single pair of inset shadows: a dark inner top edge and a light inner
bottom edge. Neumorphic surfaces express recession this way under a consistent light
source. Crystal's light source is above, so the shadow is at the top and the highlight at
the bottom. Inverting that pair makes a surface read as raised:

```css
:is(.cr-resin,.cr-glass,.cr-resin-haze) :is(.cr-haze,.cr-surface,.cr-well,.cr-content-fill){
  box-shadow:inset 0 1px 2px rgba(39,24,68,.15),  /* light source is above */
             inset 0 -1px 0 var(--cr-rim);
}
```

Crystal takes the recession model from neumorphism and rejects its palette. Neumorphism
tints the surface, the highlight and the shadow from one near-identical hue, so nothing
has enough contrast to be found or read. Crystal keeps the neumorphic geometry and its own
contrast: the fill is 80% opaque, and the text on it is checked against the same ratios as
text anywhere else.

### Feathering never touches content

Haze's 1.95px feather applies to an isolated paint layer only. Text, icons, hit areas and
focus rings stay crisp, because a feathered glyph is blurred and is not legible. The
feather softens the edge of the fill against the frame behind it and does nothing else.

## Media and text compositions

The media and text recipes of 2.4.0 compose the materials above and add none. The [components chapter](components.html#media-and-text) has each recipe's values and a specimen.

- **The media stage is a frame, not a material.** It clips the picture to the content radius and letterboxes it in `--cr-surface-alt`, so it follows the palette and mode.
- **The transport is a Resin plane over the picture.** Its controls give up their own diffusion, because Resin never contains Resin. Its time readouts are labels read through a 20% fill over moving pictures, so each sits on its own Haze pill.
- **A caption cue is Stone,** which exists for a label over an unknown or moving backdrop. The cue keeps its crisp text over a feathered backing and sits above the transport, never under it.
- **The audio card is Haze.** With no picture, the player is a reading surface holding a title and the transport.
- **The selection toolbar is Frost,** because every transient overlay is (R15e). It takes a pill silhouette because it holds a row of controls, not a paragraph.
- **The editor is the field shell:** a Resin surround with the Haze well the document is written on. Prose has no material of its own and reads on whatever surface holds it.

Under reduced transparency and in opaque mode the caption's backing becomes the opaque surface; under forced colours the cue, the readouts and the stage take system colours with a CanvasText border.

## See it working

The [Playground](../playground.html#foundations) renders the full hierarchy live, with
atmosphere, Frost tint, elevation and content radius adjustable. The
[supporting materials section](../playground.html#supporting-materials) shows Haze, Stone
and Mirage in the compositions each is intended for.
