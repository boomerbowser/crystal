# Library material, upstreamed (R-28)

**Ruled by Meridian on 16 November 2026**, on Crystal React's R-28: *each
directory wears its surface; for future reference, the hand-written material
represents corrections and enhancements that the libraries they're in should be
updated to include in the standard, not treated as add-ons written for a
temporary purpose.* And: *when we ask for additions to the libraries, they
should be merged and migrated fully.*

This is the plan that ruling sets, and the measurement it starts from.

## The principle

A platform library's hand-written material is a statement of what Crystal's
vocabulary is missing. So the migration runs upstream first:

1. **Every difference becomes a named part of Crystal.** Where a library paints
   a surface differently from the class, the difference is grouped with its
   kind and published in `crystal.css`, `surfaces.json` and
   `surface-recipes.json` as a variant (a modifier class on the surface), with
   its reduced-transparency, opaque and forced-colours routes.
2. **The library wears the surface and the variant**, and deletes the rule it
   wrote. Its rendering does not change: the same measurement that found the
   difference must find none afterwards, element by element, in light and dark.
3. **The audit falls to zero.** `audit-recipes.mjs` in Crystal React counts
   hand-written `backdrop-filter` and material mixins; when this is done it
   counts none, and a check keeps it there.

The appearance the libraries ship is kept, which is what makes this a migration
rather than a redesign. Where a difference turns out to be a defect against the
approved baseline (a Frost panel without Frost's grain, say), that is recorded
beside it and put to Meridian rather than silently published as a variant.

## The measurement

`crystal-react`'s stylesheets were read for every rule that paints material by
hand: a non-`none` `backdrop-filter`, one of the library's material mixins, or
a Crystal fill token (`inventory.json`, 139 rules in 81 directories). Each
rule's element was then found in the built stories (pressing the story's first
trigger for an overlay) and compared, computed value by computed value, with a
twin element of the same tag and size wearing the Crystal surface the catalogue
names for it: background, backdrop filter, rim, radius, shadow, and both paint
layers (`measured.json`, 95 distinct elements, Chromium, light, 16 November
2026, @crystal-ui/core 2.6.0).

| Outcome | Elements | What happens |
|---|---|---|
| Duplicate of a class it already wears | 4 | Delete the rule. |
| Identical to a class it does not wear | 8 | Wear the class, delete the rule. |
| `field.shell`: layout, not material | 17 | The mixin paints nothing; it makes the shell fill its row and sets the field motion's origin. Both are enhancements: `.cr-field-shell` gains them. The audit stops counting it as material. |
| Different from the surface | 59 | Group, publish as variants, wear them (below). |
| To measure by hand | 7 | The three choices (checkbox, switch, slider thumb), which Crystal paints by element, and four elements no story shows at rest. |

### The differences, grouped

These are the kinds the 59 fall into, from `measured.json`. Each becomes one
variant, not 59.

- **Haze cards with an inset fill** (13: alert, empty state, result, chart
  surface, gallery thumb, product card, cart item, cart summary, order summary,
  review, rating summary, master-detail detail, analytics panel). No rim, the
  fill inset by `--cr-haze-inset`, no contact shadow on the fill.
- **Haze rows and placeholders** (5, plus 3 flush: list row, accordion row,
  image, table and statistic placeholders; carousel slide, data view item,
  organisation chart node). The fill on the element itself, flush to its edge.
- **Haze over Frost** (3: menu, toast, popover). Frost's grain kept on
  `::before` and the reading fill on `::after`, inset. Crystal 2.5.0's
  `.cr-haze.overlay` (C-S6) is the nearest part; whether it is the same
  composition is the first thing to measure.
- **Frost panels at the content radius** (8: navigation rail and menu panel,
  calendar, filter panel, banded page header, master-detail list, workspace
  pane, and the tooltip). 28px rather than Frost's 34px; several omit the grain
  layer, which is the defect question above.
- **Frost docked to an edge** (2: app shell sidebar, app bar). No radius, no rim,
  no panel shadow on the docked side.
- **Quiet and icon controls** (4: icon button quiet and default, the overlay
  arrow, the stepper's marker). Resin controls without the Resin coat, or with a
  circle radius.
- **Pinned Resin** (Affix) and **round Resin markers** (stepper, timeline, angle
  slider dial, resizable handle).
- **Opaque Mirage** (the scrims). Crystal's Mirage has reduced-transparency and
  forced-colours routes but no `[data-effects=opaque]` one; the library's five
  scrims add it, with Mirage's fallback fill.

## Phases

1. **Core 2.7.0** publishes the variants above and the two field-shell traits,
   each with its fallback routes and a contract check, and records which
   differences were put to Meridian as defects.
2. **Crystal React** wears them directory by directory, deleting each rule as
   its element measures identical; `verify:materials` and
   `verify:appearance` gain a row per variant, and the audit's hand-written
   counts reach zero and are held there.
3. **crystal-preview** shows each variant on the materials page.

## Every element

| Directory | Selector | Crystal surface | Outcome | Differs in |
|---|---|---|---|---|
| AppShell | .sidebar | cr-frost | enhancement to upstream | borderTopWidth, borderTopColor, borderTopLeftRadius, boxShadow |
| AppBar | .appBar | cr-frost | enhancement to upstream | borderTopWidth, borderTopColor, borderTopLeftRadius, boxShadow |
| NavRail | .rail | cr-frost | enhancement to upstream | borderTopLeftRadius |
| Pagination | .page, .arrow | cr-button | wear the class |  |
| Stepper | .step:not(:last-child)::after | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor, borderTopLeftRadius |
| Stepper | .marker | cr-resin | enhancement to upstream | borderTopLeftRadius |
| Stepper | .marker | cr-button | enhancement to upstream | backgroundColor, backdropFilter, borderTopColor, borderTopLeftRadius, boxShadow |
| Stepper | .stepper[data-shape='pill'] .control | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor, borderTopLeftRadius |
| Stepper | .stepper[data-shape='pill'] .marker | cr-button | enhancement to upstream | borderTopWidth, borderTopColor, borderTopLeftRadius |
| Burger | .burger | cr-button | wear the class |  |
| CommandPalette | .scrim | cr-mirage | wear the class |  |
| CommandPalette | .palette::before | cr-haze | enhancement to upstream | borderTopColor |
| CommandPalette | .field | cr-field-shell | layout, not material (field.shell) | boxShadow |
| Affix | .content[data-pinned] | cr-resin | enhancement to upstream | backgroundColor, backdropFilter, borderTopWidth, borderTopColor, borderTopLeftRadius, boxShadow |
| Affix | .content[data-pinned] | cr-resin | enhancement to upstream | backgroundColor, backdropFilter, borderTopWidth, borderTopColor, borderTopLeftRadius, boxShadow |
| NavigationMenu | .panel | cr-frost | enhancement to upstream | borderTopLeftRadius |
| NavigationMenu | .panel | cr-frost | enhancement to upstream | borderTopLeftRadius |
| TableOfContents | .toc::before | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| Menu | .popover[data-cr-overlay='frost'] | cr-haze | enhancement to upstream | backgroundColor, backdropFilter, borderTopColor, boxShadow |
| Button | .button | cr-button | duplicate of a class it wears |  |
| IconButton | .quiet | cr-button | enhancement to upstream | backgroundColor, backdropFilter, borderTopColor, boxShadow |
| IconButton | .iconButton:not(.quiet) | cr-button | enhancement to upstream | backgroundColor, backdropFilter, borderTopColor, boxShadow |
| FloatingAction | .floating | cr-haze | enhancement to upstream | borderTopLeftRadius |
| FloatingAction | :global([data-effects='opaque']) .floating | cr-button | wear the class |  |
| TextInput | .shell | cr-field-shell | layout, not material (field.shell) |  |
| Textarea | .shell | cr-field-shell | layout, not material (field.shell) |  |
| NumberInput | .shell | cr-field-shell | layout, not material (field.shell) |  |
| PasswordInput | .shell | cr-field-shell | layout, not material (field.shell) |  |
| SearchInput | .shell | cr-field-shell | layout, not material (field.shell) |  |
| Select | .shell | cr-field-shell | layout, not material (field.shell) |  |
| Combobox | .shell | cr-field-shell | layout, not material (field.shell) |  |
| MultiSelect | .shell | cr-field-shell | layout, not material (field.shell) |  |
| Checkbox | .box | element | to measure by hand |  |
| Switch | .track | element | to measure by hand |  |
| Slider | .thumb | element | to measure by hand |  |
| PinInput | .well | cr-field-shell | layout, not material (field.shell) |  |
| TagsInput | .shell | cr-field-shell | layout, not material (field.shell) |  |
| ColorPicker | .shell | cr-field-shell | layout, not material (field.shell) |  |
| DatePicker | .shell | cr-field-shell | layout, not material (field.shell) |  |
| Cascader | .shell | cr-field-shell | layout, not material (field.shell) |  |
| RichTextSurface | :global([data-effects='opaque']) .popover | cr-frost | enhancement to upstream | borderTopLeftRadius |
| ComboBox | .shell | cr-field-shell | layout, not material (field.shell) |  |
| AngleSlider | :global([data-effects='opaque']) .dial | cr-resin | enhancement to upstream | borderTopLeftRadius |
| Table | .placeholder | cr-haze | enhancement to upstream | backgroundColor, borderTopWidth, borderTopColor |
| Table | .shell | cr-table-scroll | duplicate of a class it wears |  |
| DataTable | .scroller | cr-table-scroll | duplicate of a class it wears |  |
| List | .row | cr-haze | enhancement to upstream | backgroundColor, borderTopWidth, borderTopColor |
| Image | .image | cr-haze | enhancement to upstream | backgroundColor, borderTopWidth, borderTopColor |
| Timeline | .marker | cr-resin | enhancement to upstream | backgroundColor, borderTopLeftRadius |
| Accordion | .row | cr-haze | enhancement to upstream | backgroundColor, borderTopWidth, borderTopColor |
| Carousel | .slide | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| Statistic | .placeholder | cr-haze | enhancement to upstream | backgroundColor, borderTopWidth, borderTopColor |
| Calendar | .panel | cr-frost | enhancement to upstream | borderTopLeftRadius |
| DataView | .item | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| ImageList | .caption | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor, borderTopLeftRadius |
| OrganizationChart | .node | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| Alert | .alert | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| Toast | .toast | cr-haze | enhancement to upstream | backgroundColor, backdropFilter, borderTopColor, boxShadow |
| LoadingOverlay | .scrim | cr-mirage | wear the class |  |
| EmptyState | .empty | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| Result | .result | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| Tour | .scrim | cr-mirage | to measure by hand |  |
| Tour | .panel | cr-frost | to measure by hand |  |
| Banner | .banner | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor, borderTopLeftRadius |
| Drawer | .scrim | cr-mirage | wear the class |  |
| Drawer | .panel | cr-frost | enhancement to upstream | borderTopColor, borderTopLeftRadius, boxShadow |
| Popover | .popover[data-cr-overlay='frost'] | cr-haze | enhancement to upstream | backgroundColor, backdropFilter, borderTopColor, boxShadow |
| Scrim | .scrim | cr-mirage | wear the class |  |
| FloatingWindow | .window | cr-resin panel | duplicate of a class it wears |  |
| OverlayArrow | .arrow[data-cr-overlay='frost'] | cr-button | enhancement to upstream | backgroundColor, backdropFilter, borderTopColor, borderTopLeftRadius, boxShadow |
| OverlayArrow | .arrow[data-cr-overlay='haze'] | cr-haze | enhancement to upstream | backgroundColor, backdropFilter, borderTopColor, borderTopLeftRadius, boxShadow |
| Highlight | .cue | cr-haze | to measure by hand |  |
| CodeBlock | .codeBlock::before | cr-haze | enhancement to upstream | borderTopColor |
| Resizable | .handle | cr-resin | enhancement to upstream | borderTopWidth, borderTopColor, borderTopLeftRadius, boxShadow |
| QrCode | .qrCode::before | cr-haze | to measure by hand |  |
| ChartSurface | .plot | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| ChartLegend | .entry | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor, borderTopLeftRadius |
| ChartTooltip | .tooltip | cr-frost | enhancement to upstream | borderTopLeftRadius |
| Gallery | .thumb | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| Lightbox | .scrim | cr-mirage | wear the class |  |
| QuantityStepper | .shell | cr-field-shell | layout, not material (field.shell) | borderTopLeftRadius |
| VariantSelector | .swatch | cr-haze | enhancement to upstream | borderTopColor, borderTopLeftRadius |
| ProductCard | .card | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| CartItem | .item | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| CartSummary | .summary | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| OrderSummary | .order | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| Review | .review | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| RatingSummary | .summary | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| FilterPanel | .panel | cr-frost | enhancement to upstream | borderTopLeftRadius |
| PageHeader | .banded | cr-frost | enhancement to upstream | borderTopLeftRadius |
| MasterDetail | .list | cr-frost | enhancement to upstream | borderTopLeftRadius |
| MasterDetail | .detail | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| Workspace | .pane | cr-frost | enhancement to upstream | borderTopLeftRadius |
| AnalyticsPanel | .panel | cr-haze | enhancement to upstream | borderTopWidth, borderTopColor |
| SearchBlock | .shell | cr-field-shell | layout, not material (field.shell) |  |
