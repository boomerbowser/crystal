# Crystal: a shared visual language

Crystal 1.0 is an independent, reusable extension of Gather’s approved `crystal-03-balanced` design. It retains the material hierarchy and recognizable silhouettes while allowing stronger product color identities. Gather’s original proposal and application are not modified by this system.

## Governing hierarchy

**Plastic → Frost → Resin, from back to front, is Crystal’s defining invariant.** The user explicitly reaffirmed this priority on September 17, 2026. Product colors and layouts may vary; the hierarchy must remain recognizable. Plastic grounds the window, Frost forms the intermediate material layer, and Resin floats above it for functional controls. Haze reading wells live within the hierarchy for legibility; they are not a replacement theme or a competing fourth material identity.

Crystal names six materials: **Plastic, Frost, Resin, Haze, Stone, Mirage**. Haze fills reading surfaces; Stone protects labels within controls; Mirage separates modal decisions. The first three establish the main spatial hierarchy.

## Shared identity, product freedom

| Shared across products | A product may vary |
|---|---|
| Opaque colored foundation, 80% reading fills with feathered edges, selective Frost support, floating Resin controls | Curated brand palette, editorial imagery, name and product mark |
| Typography rhythm, focus behavior, semantic statuses, accessible interaction contracts | Navigation destinations, task density and information architecture |
| Paired shadows, defined contours, radius relationships and restrained highlights | Atmosphere intensity and depth within the documented ranges |
| Clear ownership/direction expressed through an optional asymmetric corner | Whether a product needs messages, a dock, or any particular component |

Visual continuity does not require every product to look like a messenger. Preserve the relationships between surfaces; adapt the components to the work. A data-intensive product can use flatter rows inside a lifted Haze panel. A media product can expose richer artwork around protected controls. Avoid copying Gather’s feature requirements into unrelated products.

## Foundation rules

1. The content is the most readable thing in the scene. Keep text itself opaque and crisp; content fills use 80% opacity with a feathered perimeter outside the reading area.
2. Use color in the atmosphere, selected surfaces and artwork. Do not cover every surface with the same accent fill.
3. Elevation describes a relationship: content above foundation, support above content, functional controls above the task, modal decisions above everything.
4. Put optical detail around the task: a defined rim, slight grain and a narrow highlight. Do not blur or texture every line of text.
5. Every meaningful state is recognizable without perceiving hue.
6. A fallback keeps the geometry and hierarchy. Reduced effects must not feel like a different product.

## Typography and reading

Manrope is the shared default, bundled locally under its accompanying SIL Open Font License. System UI is an intentional alternative for platform integration. Do not fetch font services just to render the system.

| Role | Size / line height | Weight | Use |
|---|---|---|---|
| Display | 36–50px / 1.08–1.2 | 750 | Product or section introduction; responsive |
| Page title | 28–32px / 1.2 | 750 | Primary task context |
| Section | 20–24px / 1.25 | 700 | Local hierarchy |
| Reading | 16px / 24px | 400–500 | Messages, documents, sustained reading |
| Control | 14–16px / 1.3–1.5 | 650–750 | Primary application controls |
| Supporting | 12–14px / 1.5–1.7 | 500–650 | Metadata and short labels, never a replacement for reading type |

Respect user scaling. Do not cap text zoom or hide overflow to conceal clipped labels. Aim for 45–75 characters per line for sustained prose. Compact density reduces spacing, not reading size.

## Geometry, spacing and responsive layout

Use a 4px base rhythm with 8, 12, 16, 20, 24, 32 and 48px spacing. The default content radius is 28px, adjustable between 14 and 28px. Supporting panels use content radius + 6px; input wells use content radius − 7px. Person avatars stay circular.

**Actions are fully rounded.** Every action control — primary, secondary, quiet and compact buttons, segmented options, dock destinations and navigation pills — uses a pill radius (`999px`) independent of the content-radius control, so the radius slider never turns an action into a rectangle. Card-shaped buttons are the deliberate exception: a button whose content is a layout with artwork (specimen cards, palette cards, library items) keeps the content radius so its artwork is not clipped into a lozenge. The distinction is behavioral, not tag-based — it depends on whether the control reads as an action or as a card.

An authored bubble uses 6 / R / R / R corners. A counterpart uses R / 6 / R / R; mirror the direction for RTL. Do not use asymmetric corners indiscriminately on controls.

The playground moves its inspector below the canvas under 850px and stacks components under 600px. These are demonstration breakpoints, not universal product breakpoints. Product layouts should adapt to content and input modality, preserving navigation and avoiding horizontal page scroll at 320 CSS pixels.

## Icons and motion

Use a coherent 24px icon grid, approximately 1.8px rounded strokes, visible labels for primary destinations, and accessible names for icon-only actions. The included SVGs are original simple line drawings. Do not rely on emoji as the only status or control vocabulary.

Press feedback is 120ms, state feedback 213.33ms, compact spatial entrances 293.33ms and exits 160ms. Expressive material journeys use 1000–1400ms, 5–30px ordinary travel (50px compact guidance; larger spatial compositions may exceed it), in-place Haze/Stone movement and 650ms departures. A saved user speed factor scales motion, with a five-second ceiling and immediate reduced-motion states. The [motion specification](motion.html) defines all six material signatures, easing, interruption and live examples. Use motion in response to user action; no continuous decorative motion is required. Reduced motion removes spatial effects while retaining immediate state feedback.

## System boundaries

This package implements a static reference site, theme resolver/exporter, CSS primitives and local preview interactions. It does not implement a complete component framework, production authentication, backend services, a native renderer or all application accessibility behavior. See [component scope](components.html) and [adoption](adoption.html).

The compact CSS timing tokens remain available for small state changes. The material-driven Resin press recipe uses 320ms for a complete compression/recovery sequence; hover light uses 700ms. These visual clocks never delay the actual action. The executable catalog lists the current duration of every recipe.
