# Materials, depth and optical detail

**The defining order is Plastic → Frost → Resin, from back to front.** Plastic is the foundation, Frost the intermediate material layer, and Resin the highest functional control layer. Haze reading wells preserve legibility within this hierarchy. It is a custom design system derived from Gather, not a vendor-certified combination of Microsoft and Apple systems.

## Visual acceptance requirement

The approved Crystal material studies define the intended appearance, not merely inspiration. Every implementation must preserve their distinct opacity and diffusion, transmitted color, optical contours, elevation, soft reading-fill edges and crisp text. If a component or material departs from those qualities without an approved reason, treat it as a defect. Check actual UI screenshots as well as tokens. Dark mode and alternate palettes must preserve the same relationships; documented accessibility fallbacks remain required.

## Recommended defaults

Use these settings as Crystal’s recommended starting point across products:

| Setting | Recommended default |
|---|---|
| Color atmosphere | 90% |
| Frost base tint | 35% |
| Elevation | 125% |
| Corner radius | 28px |

The canonical tokens, generated theme and playground’s **Reset** action use these values. Saved user preferences remain customizable. Frost’s existing recipe adds 10 percentage points to its base tint, so the recommended 35% base produces a 45% surface fill. Resin remains fixed at 20% fill opacity; opaque accessibility fallbacks take precedence.

## Material family and inspiration

Crystal has **six first-class materials: Plastic, Frost, Resin, Haze, Stone, and Mirage**. Each has its own named recipe and reusable primitive. Plastic → Frost → Resin is the main spatial stack; Haze and Stone are readable fills within components, while Mirage separates a modal from the rest of the interface.

| Crystal material | Previous name / inspiration | Crystal adaptation |
|---|---|---|
| Plastic | Microsoft Mica | Opaque contextual foundation, bounded product tint and neutral inactive state |
| Frost | Microsoft Acrylic | Diffusion, tint and grain tuned for Crystal’s intermediate surfaces |
| Resin | Apple Liquid Glass | Floating optical contours, 20% fill and authored web blur rather than native refraction |
| Haze | Solid content | 80% reading fill with a 1.95px feathered perimeter |
| Stone | Protected labels | 55% light / 60% dark backing, feathered like Haze, with crisp labels |
| Mirage | Smoke / modal scrim | Chromatic diffusion of the underlying scene, darkened behind a focused modal |

Plastic, Frost and Resin are based in and inspired by their respective platform materials, then adjusted to work together as Crystal. They are not vendor-certified implementations. Microsoft’s [Mica](https://learn.microsoft.com/en-us/windows/apps/design/style/mica) describes an opaque contextual base; [Acrylic](https://learn.microsoft.com/en-us/windows/apps/design/style/acrylic) combines tint, diffusion and texture; Apple’s [material guidance](https://developer.apple.com/design/human-interface-guidelines/materials) informs Resin’s floating functional role. Haze, Stone and Mirage are Crystal’s adaptations of content fills, readability veils and modal scrims.

## Material assignment

| Material | Web recipe | Where it belongs |
|---|---|---|
| Plastic | Opaque canvas with bounded product-color gradients; no backdrop blur | Root scene/window; one contextual foundation |
| Haze | 80% content fill, 1.95px feathered perimeter and shallow paired shadows; crisp foreground | Reading, structured lists, forms, messages, consequential decisions |
| Frost | Default 45% surface tint (35% base), 40px blur, 125% saturation, grain opacity .045 | Intermediate task frames, transient panels and overlays, with Haze reading/input surrounds |
| Resin | Fixed 20% surface tint, 20px blur, 165% saturation, defined rim, strongest floating shadow | One clustered navigation or control plane |
| Stone | 55% light / 60% dark fill with a 1.95px feather inside the Resin plane | Navigation labels and material comparison captions |
| Mirage | #111525 at 38% opacity; 28px backdrop blur, 165% saturation, 88% brightness; Haze decision surface above | Blocking decisions, focus managed by the dialog |

Resin renders at a fixed 20% fill opacity in both modes, independent of the Frost base tint control. Frost retains its existing recipe (45% fill from the recommended 35% base). Text, rims and shadows retain their opacity. Label protection is 55% in light mode and 60% in dark mode, with the dark backing strengthened to preserve contrast over bright backdrops at this lower glass opacity. Opaque accessibility fallbacks remain fully opaque. This deliberately differs from the original Gather recipes preserved in `reference/gather-crystal-recipes.json`.

The persistent Frost task frame is an intentional Crystal hybrid, not a claim of strict Microsoft placement conformance. One frame can contain several softened content wells; avoid nesting independently blurred panes. All three live scenes show that same stack.

Do not apply opacity to an entire pane containing text. Do not stack backdrop blur on adjacent cards or every message; the content recipe feathers only its own background paint. Do not sample the desktop, capture other windows or duplicate private content into canvases to create a refraction effect. This implementation provides CSS blur, tint, texture, highlights and shadows; it does not implement native optical lensing.

## Haze: integrated reading surfaces

Haze is Crystal’s named content material, previously called Solid. Its normal recipe now uses **80% fill opacity** and a **1.95px edge feather**, so the underlying Frost or Resin contributes color rather than ending abruptly at a sheet of blank fill. Plastic → Frost → Resin remains the governing hierarchy; a reading fill within a Resin component is part of that component.

The `.cr-haze`, `.cr-well`, `.cr-bubble`, `.cr-content-fill` and `.cr-dialog` primitives paint the fill on an isolated, non-interactive `::before` layer. Only that paint layer receives `filter: blur(1.95px)`; text, icons, selection, hit areas and focus outlines stay sharp and fully opaque. The broad interior remains at 80%, while the narrow perimeter feathers into its surroundings. Keep at least **12px of padding** between readable content and the feathered edge, including around rounded corners. Do not clip the feather with an ancestor’s overflow unless deliberately necessary for media.

Neutral and tinted message surfaces both follow this recipe. The Harbor palette uses stronger supporting ink and a deeper authored-message fill to retain contrast with the added transparency. This is separate from the palette’s solid action/status colors. Actual input controls, status badges and consequential action buttons retain explicit boundaries and their protected color pairs; their surrounding content surface uses the softened fill. Stone retains its own label-backing opacity, separate from Haze.

The reference includes a content card over a Resin panel. Its appearance follows the palette and light/dark controls, and opaque fallback restores a 100% fill with no feather. Reduced-transparency preferences and forced colors also restore stable surfaces. Exported CSS and JSON include `--cr-haze-fill`, `--cr-haze-own-fill`, `--cr-haze-feather`, and the corresponding content foreground roles.

The contrast model tests 80% interior fill and a conservative 79% reading-area bound against RGB-corner backdrops in every palette and mode. It does not certify pixels along the intentionally fading perimeter; place no text in that perimeter and verify actual padding, imagery and layering in each product.

## Stone: protected labels

Stone is the lighter-density backing shown inside Resin controls. It now has the **same 1.95px background feather as Haze**, while retaining **55% opacity in light mode and 60% in dark mode**. Haze remains 80%; these recipes are deliberately independent.

`.cr-stone` paints `--cr-stone-fill` on an isolated `::before` layer with `--cr-stone-feather`; text and icons are neither blurred nor faded. The dock’s `.cr-dock-inner` uses the same recipe. Keep readable content at least 12px from the feathered perimeter, counting both group and button padding. Shapes, marks and labels continue to convey state beyond color. Reduced transparency restores an opaque, unfeathered backing; forced colors uses system colors.

Stone’s contrast model includes Resin’s 20% fill, optical highlights and a conservative one-percentage-point reduction in the label fill to cover the feather’s reading-area tail. The feathered perimeter itself is not a valid text area.

## Mirage: modal separation

Mirage is the named material formerly called Smoke. Its recipe blends the actual colors underneath into a dark, chromatic backdrop: **28px blur → 165% saturation → 88% brightness**, followed by a **38% `#111525` tint**. Broad diffusion merges shapes into color fields; saturation preserves their color through the dark veil. No fixed brand gradient, hue rotation, screenshot capture or duplicate page render is used. A Haze modal sits above it and remains crisp. Mirage is not a content surface and must not carry ordinary reading text.

The working native dialog uses Mirage through `::backdrop`. `.cr-mirage` exposes the same paint recipe for application-owned overlay implementations; it does not itself implement modal behavior, positioning or focus management. Products must provide actual modality, keyboard containment, a named dialog, dismissal and focus return. The preview’s **Preview Mirage** button opens the real dialog. Reduced transparency removes diffusion and color filtering and uses a stronger **64% `#111525` scrim**; the same scrim is the unsupported-filter fallback. Modal separation remains visible. The preview also includes a live artwork comparison: toggle Mirage to see the real underlying colors before and after the filter. Changing the palette changes the artwork and therefore the resulting chromatic blur.

## Plastic: Mica inspiration and adaptation

Plastic adapts Mica’s opacity, subtle contextual tint, light/dark awareness, and a neutral inactive-window fallback. The active/inactive study demonstrates those properties: the window remains fully opaque, and the context’s shapes do not pass through it. The browser uses a preselected product color impression; it does not access desktop wallpaper. Native implementations should use supported OS facilities for wallpaper influence and activation behavior.

The broader Frost/Resin study contains deliberately vivid **artwork above the Plastic foundation** so blur can be inspected. That artwork is content, not a claim that native Mica itself paints saturated wallpaper detail. The ordinary app preview keeps a restrained contextual base and puts stronger colors into accents and content. [Fluent material roles](https://fluent2.microsoft.design/material).

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

Shadow colors adapt to mode. The elevation control scales offsets and blur from 60–150%; hierarchy remains ordered. Depth is a visual relationship, not a z-index value. Products must also manage their actual overlay stack and focus order. Dark mode uses contours and tonal separation alongside shadows.

## Fallbacks

Reduce transparency replaces supporting materials with opaque content surfaces, removes grain/blur, and restores a visible outline. CSS also honors reduced-transparency preferences where supported and falls back when backdrop filtering is unavailable. Reduced motion removes movement; forced colors use system colors and borders. None of these modes hides essential content.

Support claims must be verified on actual target browsers/devices. A native implementation should use supported compositor APIs where appropriate and deliberately adapt the custom hierarchy elsewhere. The browser preview does not prove native rendering, energy performance or accessibility parity.

## Performance and composition

Keep backdrop filters confined to a few bounded surfaces, avoid continuous blur animations, and avoid putting a scrolling text layer under numerous overlapping filters. A low-power mode can select the opaque recipe without changing geometry. Measure actual scroll/compositor behavior before setting device-specific budgets.

## Acceptance

Inspect light/dark, every palette, strongest atmosphere, both Frost tint extremes, reduced effects, narrow layouts, long labels, text zoom, keyboard focus and relevant backdrop extremes. The material comparison board intentionally places all samples over the same saturated motif so differences remain visible. Compare silhouettes and depth relationships, not only pixel similarity.

## Resin with Haze: interactive and compact surfaces

Resin is the primary background for buttons and all interaction surfaces. Its body stays at 20% fill with the existing blur, saturation, illuminated rim and elevation. When contrast requires protection, put an 80% Haze reading fill inside that shell, with the existing 1.95px feather and an 8px visible Resin perimeter. Keep text sufficiently inset from the feather. The adjustable preview always uses this protected construction.

This same composition is required for small information displays—tooltips, toasts, labels, tags and badges—and temporary secondary menus, dropdowns, flyouts and popovers. It does not replace the structural Plastic → Frost → Resin hierarchy or turn every large component into Resin. Stone remains a named material with its own standalone specifications; compact UI labels now choose Resin/Haze instead of an isolated Stone slab.

Optical highlights remain below the Haze reading fill, including during animation. They can cross the exposed Resin perimeter without bleaching the protected label background. Contrast models check this actual ordering across all six palettes, both modes and RGB-corner backdrops.

### Interaction surface geometry

Use a broad, luminous Resin rim with an 8px inset reading fill and diffuse paired shadows. Avoid thin dark perimeter strokes on ordinary action buttons; native text-entry fields retain a functional boundary and every control retains a visible keyboard focus ring. Standalone actions use generous padding and full pill geometry.

Toolbars, segmented controls and tab groups share one Resin/Haze surface. Their inactive actions have no separate bevel, backdrop filter or raised outline. Only the selected action gains a raised, strongly colored indicator, plus a non-color selection cue. Temporary menus follow the same shared-surface principle. The material motion suite is unchanged by this visual refinement.


## Material definition on small and nested surfaces

A small Resin control over a Haze reading well can lose the color and depth visible in the larger material studies. Keep the 20% Resin body and 80% inset Haze fill. Supply restrained contextual light **under** the Haze rather than increasing body opacity or painting the label. The control optical layer mixes glow at 12.6% and decorative color at 8.4% in light mode; dark mode uses 9.8% and 7% (a 30% reduction from the previous rim color opacity). On buttons and action links, inset the chromatic paint by 2px and feather that paint by 2px beneath Haze, so the color blends inward into the content fill. Keep the outer optical contour and all text crisp. Palette specimen colors and selection marks are not blurred. These are local gradient maxima, not changes to the global atmosphere or material opacity. Do not increase saturation to compensate for every additional nested surface. The approved material studies remain the visual authority.

Use a luminous outer contour and soft paired shadows instead of a dark hairline around every control. Text fields have a circular Resin/Haze field-state badge within the Resin surround; keyboard focus still adds a full, clearly visible ring. Checkboxes and radios use contained selection marks, switches retain a contrast-bearing thumb, and sliders use a value-driven track and marked glass thumb. Keep labels and native semantics. Status badges use their semantic symbol and words, with the tested semantic ink/surface pair behind the symbol, rather than a colored perimeter stroke. Selection, errors and focus must remain distinguishable without color.

When adapting controls to different sizes, preserve enough exposed Resin to show the rim and enough protected Haze to keep text crisp. Do not blur the element or its foreground. Opaque, reduced-transparency and forced-color modes remain functional alternatives. Validate actual composed controls in both modes and at narrow widths; a beautiful isolated material swatch does not establish component fidelity.
