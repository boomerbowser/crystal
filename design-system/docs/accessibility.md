# Accessibility contract and validation

Crystal preserves the original project's strict accessibility intent. WCAG 2.2 is the current Recommendation verified from the W3C source on September 17, 2026; recheck the latest finalized standard at adoption and release. AA is this reusable system’s engineering baseline, not a claim that the entire package or a consuming application has been certified. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## Color and material requirements

Normal reading/control text must meet at least 4.5:1 against its actual background; applicable large text and essential non-text identification have 3:1 requirements. Use the standard's definitions and exceptions, not a blanket assumption that a decorative border must pass or that every large label qualifies.

No essential meaning depends solely on hue. Use visible words, circular symbol badges or other shapes alongside programmatic state. Screen-reader labels alone do not address a sighted user who cannot distinguish colors. Functional colors remain independent of the product theme. [W3C use-of-color explanation](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).

The live table checks ten defined solid color pairs per palette/mode. It does not sample every rendered pixel or arbitrary imported background. The automated report separately bounds Stone composites (including its feathered reading-area bound) against RGB corner backdrops and the supported foundation gradient contributions. Content fills are additionally tested at 80% and a conservative 79% reading-area bound; a minimum 12px inset keeps text out of the feathered perimeter. Consumers must test new imagery or layering, interactive states and actual devices.

## Interaction requirements

- Keyboard: all actions reachable and operable; focus visible, logical and not obscured by floating controls.
- Dialogs: correctly labeled; modal focus containment; Escape where appropriate; restore focus to the invoking control.
- Forms: persistent label, associated instructions/errors, native semantics, no placeholder-only labeling, useful validation.
- Text: support 200% text enlargement and applicable 400% zoom/reflow; do not hide overflow to mask failures.
- Touch: preserve target-size requirements and spacing; prefer 44px targets for primary actions.
- Motion/effects: honor reduced-motion, reduced-transparency where supported, explicit opaque mode and forced colors.
- Structure: meaningful landmarks/headings, list/table semantics, accessible names and visible state cues.
- RTL/localization: mirrored directional geometry, logical ordering, long translations and native reading direction.

## Test matrix for consumers

| Axis | Coverage |
|---|---|
| Theme | Every supported palette, light/dark/system, user preference restoration |
| Material | Default and extreme tint/atmosphere, opaque fallback, unsupported backdrop filtering |
| Layout | Narrow/wide, dense/comfortable, long text, zoom/reflow, safe areas |
| Inputs | Keyboard, touch, pointer, relevant assistive technologies |
| States | Focus, pressed, selected, disabled, pending, empty, invalid, denied, offline |
| Platform | Actual supported browser engines and native adapters, not just one screenshot |

Use automated scans as one part of review. Screen-reader journeys, focus recovery, content clarity, high zoom, mobile behavior and native accessibility APIs require direct testing. Runtime contrast exports are evidence about token pairs, not a complete conformance claim.

## What this delivery verifies

See the [verification report](../validation/report.html) for checks actually run, environments and limits. Proposed product tests above do not count as executed checks. The package includes no backend, no native material implementation and no production service stubs.

## Forced colours

Windows High Contrast — `forced-colors: active` in CSS — replaces the page's palette with
a small set of system colours the user has chosen: `Canvas`, `CanvasText`, `Highlight`,
`HighlightText`, `ButtonFace`, `ButtonText`, `LinkText`. Crystal honours that choice
rather than opting out of it.

### Selection is a ring, never a fill

This is the rule, and it comes from a real defect found in this system.

Chromium paints an opaque **text backplate** behind text runs in forced-colors mode: a
rectangle of `Canvas` drawn *above* the element's own background, so that text is
guaranteed to sit on the user's background colour. A selected control styled as a filled
row therefore renders as: your fill, then an opaque `Canvas` rectangle over it, then the
label. In the dark high-contrast palette `HighlightText` and `Canvas` are both black — so
the label disappears into the backplate and the control becomes a solid black block.

The fix is to stop filling and start ringing:

```css
@media (forced-colors: active){
  .menu-item[aria-current]{
    background:Canvas;                  /* agree with the backplate rather than fight it */
    color:CanvasText;
    outline:2px solid Highlight;        /* selection lives outside the text run */
    outline-offset:-3px;                /* inside the pill's own edge */
  }
}
```

An outline is not covered by the backplate, because the backplate only spans the text. The
negative offset draws the ring just inside the control's boundary so it reads as "this one"
rather than as a focus ring.

**`forced-color-adjust: none` is not the fix.** It works, and it does so by discarding the
palette the user deliberately chose — which is the entire point of the mode. It is
reserved for content whose meaning *is* its colour, such as a palette swatch.

Verified in both the light and dark high-contrast palettes. The captures and the defect
this rule came from are in
`validation/captures/2026-09-17-forced-colours/`.

## Reduced motion

`prefers-reduced-motion: reduce` is honoured by every one of the 59 motion recipes. Each
recipe declares its own `reduced` behaviour rather than being globally switched off,
because "no animation" and "no *movement*" are different requirements.

The contract is: **the semantic state change still happens, immediately; the decorative
travel does not.** A menu that opens still opens. A button that has been pressed still
shows it has been pressed. What is removed is the travel, the overshoot and the shader
layer. Reduced motion resolves to zero displacement regardless of the recipe's spring —
this is asserted by `tools/validate-motion.cjs`, not left to each implementation.

## Reduced transparency

`prefers-reduced-transparency: reduce` sets `data-effects="opaque"`, which replaces every
backdrop filter with a solid surface and a stronger border:

```css
[data-effects=opaque] :is(.cr-frost,.cr-acrylic),
[data-effects=opaque] :is(.cr-resin,.cr-glass){
  backdrop-filter:none;
  background:var(--cr-surface);
  border-color:var(--cr-outline);
}
```

The border strengthens deliberately. Translucency was carrying some of the edge
definition; removing it without compensating leaves surfaces that are technically opaque
and visually unbounded. Contrast is re-checked in this mode — a regression here was found
and fixed during verification, recorded in
`validation/captures/2026-09-17-rtl-and-reduced-effects/`.

## Target size

Every interactive control has a minimum target of **44 × 44 px**, including controls that
look smaller than that. A 24px icon button carries 44px of hit area; a menu entry is 44px
tall even where the label is 19px. This is a floor, not a target — it is not reduced on
dense layouts, because "dense" is a visual decision and the hand does not get more precise.

## Direction

Right-to-left is a verified axis, not an aspiration. Layout uses logical properties
throughout — `inset-inline-start`, `padding-inline-start`, `margin-inline-end` — so mirroring
is a direction change rather than a stylesheet. The selection rail, the menu indentation
and the focus offset all follow.

Physical properties are correct only where the meaning is physical: a light source is
above in both directions, so the Haze recess keeps `inset 0 1px` rather than becoming a
logical offset.

## Colour is never the only signal

Every state that is communicated with colour is also communicated another way:

| State | Colour | Second signal |
| --- | --- | --- |
| Selected | Primary rail | Position (leading rail) and label weight |
| Focused | Primary ring | A 2px outline at 3px offset |
| Error | Status red | Icon and message text |
| Validated | Status green | A check mark |
| Current page | Primary | `aria-current="page"` and weight |

Status colours are independent of the six brand palettes, so none of these signals changes
meaning when a product re-themes. See [Color](colors.html#status).

## Contrast

1,716 contrast cases are computed across all six palettes in both modes, including bounded
composites: Resin and Haze control labels are checked with the optical sheen beneath the
protective fill, against 80%/79% content composites and RGB-corner backdrops with the
fixed 20% Resin fill.

Normal text is held to 4.5:1. Essential non-text — focus rings, control boundaries, the
selection rail — uses its separate 3:1 threshold, which is the correct standard for those
elements rather than a relaxation for them.

The current run reports zero failures. What that does and does not establish is stated
plainly in the [verification report](../validation/report.html): it is evidence about this
reference package, not a claim of complete WCAG conformance for a product built with it.
