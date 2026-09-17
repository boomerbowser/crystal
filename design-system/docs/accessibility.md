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
