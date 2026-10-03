# Components and interaction patterns

The package contains working CSS primitives and a bounded interactive reference. It is not a finished React/native component library. The table separates supplied implementation from adoption work so a visual specimen cannot be mistaken for a production service.

## Component contracts

| Component | Anatomy and states | Included / application responsibility |
|---|---|---|
| Foundation | Opaque canvas and contextual gradients; light/dark | `.cr-plastic`; product chooses composition |
| Haze content card | 80% fill, 1.95px feathered perimeter, radius, content depth | `.cr-haze`; use semantic article or button according to behavior |
| Frost panel | Frosted surround, grain, Haze reading wells | `.cr-frost`; app supplies menu/sheet behavior and focus |
| Resin toolbar | Single floating plane, protected label group, selected destination | `.cr-resin`, `.cr-dock` (a Resin pill, 9px padding, Haze perimeter, 7px when narrow), `.cr-dock-inner`; local preview switches actual scenes; app supplies routing |
| Stone label backing | 55% light / 60% dark, 1.95px feather, crisp text | `.cr-stone`; `.cr-dock-inner` shares the recipe |
| Mirage modal scrim | Dark tint with chromatic diffusion of the scene behind the active modal | `.cr-mirage` and dialog `::backdrop`; standalone paint requires real application modal behavior |
| Action | Resin shell with the neutral Haze reading fill, optical pressure and light; hover/pressed/focus/disabled | `.cr-button`. Real action and progress/error handling are app-owned |
| Primary action | The same control with its Haze reading fill in the primary colour and the tested ink on it | `.cr-button.primary`; `--cr-primary` on the fill, `--cr-on-primary` as the ink. Opt-in, so a button is emphatic only where an author chose it |
| Quiet action | The same shell with no reading fill, so the label sits directly on the material | `.cr-button.quiet`; same semantics as any action |
| Destructive action | Resin/Haze with independent danger boundary and explicit label | `.danger`; app supplies consequence-specific confirmation and recovery |
| Text field | Visible label, state badge, glowing focus ring, validation, helper/error association | `.cr-input`; working native form example; app supplies validation rules |
| Selection control | Explicit selected state plus text/mark | Native checkbox, radio and select, styled by `assets/crystal.css` as of 2.1.0, and the native switch (`input[type=checkbox][role=switch]`) as of 2.2.0; keyboard semantics must match the component |
| Navigation entry | No material of its own; pill hit area; selection by label weight; current location by a flat primary dot on `aria-current`, inside the entry's own padding so the label never moves | `.cr-nav-item`, `.stacked` for a rail. Routing and the current-page state are app-owned |
| Bare control | A control inside a coated surface: no fill, shadow, blur or pseudo-layers; target and focus ring kept | `.cr-bare`; the action itself is app-owned |
| Drag handle | Grip glyph, grab cursor, lift while held | `.cr-drag-handle` with `aria-grabbed` or `data-dragging`; pointer capture, keyboard drag and drop validation are app-owned |
| Resin panel | The Resin plane at the content radius | `.cr-resin.panel`; a floating window or wide control bar |
| Range control | Visible label/value, keyboard adjustable range | Native `input[type=range]`, styled by `assets/crystal.css` as of 2.1.0, including its RTL track direction; product limits require domain validation |
| Authored bubble | Haze, directional tight corner, optional author metadata | `.cr-bubble`, `.own`; app supplies content/Markdown semantics |
| Composer surround | Frost frame and softened content well around protected input controls | CSS composition; no rich-text editor or delivery service is implemented |
| Status badge | Independent ink/surface pair, symbol and visible label | `.cr-status` with `data-status`; 18px radius, 12px/18px padding, 36px floor, as the preview renders it; dynamic announcements are app-owned |
| Avatar | Circular image/initials, accessible identity when needed | Reference styling; app handles real identity, image failure and privacy |
| Dialog | 80% feathered surface over Mirage; title, body and named actions | Working native HTML dialog example; Escape/focus return; app owns transactions |
| Tooltip | Short supplemental text; never sole label | Frost (`.cr-frost`, R15e); working tooltip in the motion suite with focus, hover and Escape |
| Menu/popover | Frost panel with Haze rows; keyboard navigation and dismissal | `.cr-frost` (R15e); working local menu and popover in the motion suite; production adoption still requires testing |
| Drawer/sheet | Overlay support with label, close, focus management | Working modal inspector in the motion suite; app decides production modality |
| Table/list | Soft content panel, clear header relationships, explicit sort/filter states | Native table in contrast report; production data controls not implemented |
| Tabs | Labeled selected item with keyboard pattern matching actual semantics | Working ARIA tabs in the motion suite; scene navigation separately uses pressed buttons |
| Notification/toast | Clear result plus useful next action; Frost panel with Haze reading fill | `.cr-frost` (R15e); manually dismissed notification in the motion suite; production queue remains app-owned |
| Loading | Preserve layout, communicate pending work, no false success | Specification only; user-triggered work needs real lifecycle state |
| Empty/error/denied | Explain situation and a valid next step | Specification only; must reflect actual service/permission state |
| Chart/data visualization | Direct labels, pattern/shape, accessible equivalent | Specification only; brand palettes are not prevalidated chart palettes |

## Interaction and content rules

Every production control needs default, hover where meaningful, pressed, focus-visible, disabled, loading and error states as applicable. Disabled elements must not be the only explanation of unavailable functionality. Do not simulate success for an unimplemented action.

Primary application buttons are at least 44px high. Compact documentation controls may be smaller but must meet applicable target-size/spacing criteria; do not infer that every clickable element is 44px from the button class. Validate touch use as well as a desktop screenshot.

The selected destination carries its state by `aria-pressed` and by label weight; palette swatches, which cannot carry a weight change, use an inset ring gap. Functional statuses have words and distinct symbols. These cues survive color changes, and none of them is a check mark. A check means validated, never selected.

The preview product-name form performs a real local update with native validation; it does not save a brand to a remote service. Dialogs inspect actual specifications or exported tokens. The export buttons produce files from the current configuration. Fictional messages, avatars and library cards remain clearly labeled design content.

## Product patterns

**Navigation:** Use a floating toolbar when it improves the task. Keep the active destination labeled and avoid nested floating material planes. Side navigation may be more appropriate for dense tools. Do not require one product's destination set in unrelated products.

**Editing:** Give content a stable 80% reading fill with feathered edges and crisp text, then surround it with tools at an appropriate elevation. Native input controls retain protected backgrounds and explicit boundaries. Separate draft state from publication and communicate unsaved/error states accurately.

**Consequential actions:** Use a Haze dialog with explicit action names, clear consequences, safe dismissal where appropriate, and actual pending/failure handling. Decorative Resin must not obscure the decision.

**Long content:** Preserve reading size, anchor navigation and focus when sections change. Virtualization, Markdown rendering, selection and assistive behavior require application-specific implementation.

**Responsive adaptation:** Move secondary controls out of the primary task without removing access. Maintain safe areas and avoid floating controls covering the final content or keyboard-focused element.

## Framework/library strategy

Use the included semantic tokens and material primitives as a shared visual layer. Wrap real accessible primitives in each product framework; choose those libraries during product implementation based on current support, licensing and behavior. Do not rebuild complex focus/menu behavior only to achieve the surface style.

Maintain a production Storybook or equivalent gallery for actual components with interaction, accessibility and visual-regression stories. Native products need actual device galleries; screenshots of this web page do not count as native component coverage.

## Resin interaction and information surfaces

Buttons, action links, tabs, selectable controls and field shells use Resin as their interaction surface, with Haze reading protection inside a visible Resin perimeter. On the primary action that reading fill is the primary colour, and the perimeter is the ordinary glass rim: `--cr-primary` on the fill and `--cr-on-primary` as the ink. That is the palette's own tested pair, and it measures 4.74 to 10.31 against the rendered composite across all six palettes and both modes. The fill is opaque there where the neutral one is 80%, and that is the only deviation in this recipe. An 80% fill transmits a fifth of what is behind it. White over a light page is still white, so the neutral pad loses nothing. A mid-tone primary at 80% over the Resin shell composites to a washed-out lilac, at the luminance where neither a white nor a near-black label clears 4.5: 3.37 to 4.55 with `onPrimary` and 2.95 to 5.06 with `text`, failing in every light palette. The reading fill exists to make the label independent of the backdrop, so the primary fill is opaque.

**A quiet button has no reading fill.** It keeps the whole Resin shell (rim, float shadow and sheen) and drops the pad, so it is the only variant that is glass all the way through. Without the pad, a quiet label reads against the Resin fill and therefore against whatever is behind the control. On Crystal's own foundation the margin is wide: `--cr-text` over the Resin fill over canvas, surface, surface-alt and foundation measures 10.88 to 18.28 across all six palettes and both modes. A quiet button placed over artwork has no protected ground, so avoid that composition. The recipe is in `assets/crystal.css`, in `@layer crystal.component`: a Resin fill with a rim and a float shadow, a `::before` carrying the inset Haze fill at the material's feather, and a `::after` carrying the optical sheen from `--cr-control-color` and `--cr-control-light`. Both pseudo-elements are dropped under reduced transparency and under forced colours.

The recipe is not in `assets/controls.css`, which is the documentation site's stylesheet and is not in the package. The field shell is markup a product wraps around a native field, `<span class="cr-field-shell">` around the `<input>`, and it adds no semantics of its own. Labels, input values, validation and form submission remain native.

Small display elements that sit on content (labels, tags, badges and keyboard caps) use `.cr-resin-haze`. This is a reusable composition of existing materials, not a seventh material. Transient overlays (tooltips, toasts, menus, dropdowns, flyouts and popovers) are **Frost** (`.cr-frost`), at Meridian's direction (R15e). A surface that opens over content is an intermediate panel rather than a compact control, and its reading content sits on Haze inside it. Larger persistent components retain their structural material. Native OS popup internals are platform-owned; use an actual accessible custom component when full Crystal popup rendering is required.

Selected controls carry correct ARIA state and label weight; a circular badge marks activity or information, never selection. Disabled controls retain legible content but cannot activate. Opaque and forced-color modes replace decorative optics while preserving control boundaries. Motion uses material deformation and changing light, with crisp foreground text.

### Every component names its surface

The catalogue gives every one of its components a **surface**, which is the material composition it is made of, from the closed vocabulary in `tokens/surfaces.json`. Each surface is one recipe in `assets/crystal.css`. The build refuses a component naming a surface with no recipe, so the catalogue cannot specify a material Crystal has not published. The vocabulary is listed, with counts, at the top of the [catalogue](catalogue.html#surfaces). Four of its entries arrived in 2.2.0, because a consumer had reached for them and not found them:

| Surface | Recipe | What it is |
|---|---|---|
| Navigation entry | `.cr-nav-item`, `.stacked` for a rail | Furniture on the panel beneath it: no material of its own, pill hit area, 44px target, selection by label weight (650 to 800), and current location by a 6px primary dot on `aria-current` only. The dot never appears on `aria-selected` or `aria-pressed`, which are selection. The dot is flat (no material, no elevation) and sits in the entry's inline-start padding, so the label does not move. The recipe is lifted from this site's own side menu, which this page names as the reference implementation of selection. The catalogue added the dot (D-22). |
| Bare control | `.cr-bare` | A control inside a surface that already has a coat: a disclosure chevron, a chip's remove button, a sort header, a stepper's arrows or a dismiss button. Crystal paints every `<button>` by element in five layers; this removes all five and keeps the target and the focus ring. |
| Drag handle | `.cr-drag-handle` | A bare control with a grip and a lift while `aria-grabbed` or `data-dragging` is set. Pointer capture, the keyboard alternative and drop validation are the product's. |
| Resin panel | `.cr-resin.panel` | The Resin plane with the content radius instead of the pill, for a floating window or a wide control bar. |

Five more arrived in 2.3.0, each from a ruling of 29 September 2026 on something a consumer had reached for and not found:

| Surface | Recipe | What it is |
|---|---|---|
| Group | `.cr-group`, `.vertical` to stack | A new surface in the vocabulary. A button group and a split button are one Resin plane whose controls touch: one pill outside, the interior corners square against their neighbours, a hairline in `--cr-edge` between. The children keep their fill and give up their own elevation and diffusion, because the plane is the group's. A dock spaces its controls apart; a group does not. |
| Dock controls that are not buttons | `.cr-dock` | The dock reaches `[role=tab]` (selected by `aria-selected`), a `label` holding a radio (selected by `:checked`, its focus ring drawn on the label) and a link (current by `aria-current`), with the dock button's values. Every selector is inside `:where()`, so nothing a consumer already sits against changes specificity. |
| Dialog body | `.cr-dialog-body`, with `.cr-scroll-frost` | The dialog's surface does not scroll; its body does, so a tall dialog keeps its title in view and takes the edge fade without dissolving its own fill. Give the body `tabindex="0"` and a name when it scrolls, so a keyboard can reach and scroll it. A dialog written without a body still scrolls its surface. `position: fixed` applies to a native `dialog.cr-dialog` only, which the browser centres; on any other element the host positions the surface. |
| Recessed overlay | `.cr-haze.overlay` | A menu, popover or listbox opened inside a pane that is already lifted. On the page a transient overlay is Frost; inside a Haze dialog or a Frost panel it recesses into Haze, and plain Haze has no edge. This is a flat Haze fill with the `--cr-edge` rim and the content shadow, and no feather. |
| Count | `.cr-resin-haze.count` | The compact display sized for a count: a 20px circle that grows to a pill with its digits, filled to its own edge, with no block padding. With the tag's 8px Haze inset and 17px block padding a count badge is 55px tall. |

The media and text recipes of 2.4.0 add no surface. Each is a selector on a surface the vocabulary already has, so no platform gains a material; it gains the geometry. Each links to its specimen [below](#media-and-text).

| Recipe | Surface | What it is |
|---|---|---|
| [Media stage](#specimen-media-stage) `.cr-media` | none of its own | The picture's frame: the content radius, a `--cr-surface-alt` letterbox, and the aspect ratio the product sets in `--cr-media-aspect` (unset keeps the media's own; `16 / 9`, `4 / 3`, `1`, `9 / 16`), so the page does not jump when the first frame decodes. `--cr-media-fit` is `contain`, so nothing is cropped unless the product asks for `cover`. In full screen the radius goes to 0. |
| [Transport](#specimen-media-stage) `.cr-resin.transport` in `.cr-media-bar` | Resin plane | A Resin pill with 4px block and 12px inline padding around the 48px action targets, 58px tall with its rim. The bar is inset 12px from the stage, or the safe area in full screen, so the pill never meets the content radius. The time readouts are tabular, on their own Haze pills, in body ink. Below 420px of player width the bar wraps its trailing controls onto a second row. |
| [Caption cue](#specimen-media-stage) `.cr-media-caption`, `::cue` | Stone label backing | A cue is a label over a moving picture, so it sits on Stone, above the transport and never under it: 12px above the bar whether or not the bar is shown, so it does not jump when a pointer arrives. `.cr-media-caption` is the feathered backing for a library that renders cues itself; `::cue` gives the browser's own renderer the flat Stone fill, because it accepts no pseudo-element. |
| [Audio card](#specimen-media-audio) `.cr-haze.cr-media.audio` | Haze reading surface | The audio player has no picture, so the stage becomes a Haze card with the 20px card padding, holding the title, a secondary line and the transport. |
| [Selection toolbar](#specimen-text-marks) `.cr-frost.bar` | Frost panel | A transient overlay shaped as a row of controls: a pill with 4px padding, for the commonest marks over highlighted text. It is Frost because every transient overlay is (R15e). |
| [Prose and the editor](#specimen-text-editor) `.cr-prose`, `.cr-editor`, `.cr-editor-toolbar` | Field shell, when editing | One reading vocabulary for a document while it is written and after it is published: 24px between blocks, headings stepping down the type scale, muted list markers, a primary-soft rule on a quotation, checklists of native checkboxes, and marks that each differ in shape as well as colour. A field shell holding an editor becomes a column at the content radius. Its toolbar sits above the text on a fine pointer, and below it on a coarse one, clear of the on-screen keyboard; `.below` asks for that placement on any pointer. |

A native switch is a checkbox with a track, `<input type="checkbox" role="switch">`, styled by element like the checkbox and radio. The track reads `--cr-switch-track-width` and `-height`, the thumb is the opaque surface, and the on state is the primary-soft pair.

### Interaction surface geometry

Use a broad, luminous Resin rim with an 8px inset reading fill and diffuse paired shadows. Avoid thin dark perimeter strokes on ordinary action buttons; native text-entry fields retain a functional boundary and every control retains a visible keyboard focus ring. Standalone actions use generous padding and full pill geometry.

Toolbars, segmented controls and tab groups share one Resin/Haze surface. Their inactive actions have no separate bevel, backdrop filter or raised outline. Only the selected action gains a raised, strongly colored indicator, plus a non-color selection cue. Temporary menus follow the same shared-surface principle. The material motion suite is unchanged by this visual refinement.


## Material definition on small and nested surfaces

A small Resin control over a Haze reading well can lose the color and depth visible in the larger material studies. Keep the 20% Resin body and 80% inset Haze fill. Supply restrained contextual light under the Haze rather than increasing body opacity or painting the label. The control optical layer mixes glow at 12.6% and decorative color at 8.4% in light mode; dark mode uses 9.8% and 7% (a 30% reduction from the previous rim color opacity). On buttons and action links, inset the chromatic paint by 2px and feather that paint by 2px beneath Haze, so the color blends inward into the content fill. Keep the outer optical contour and all text crisp. Palette specimen colors and selection marks are not blurred. These values are local gradient maxima and leave the global atmosphere and material opacity unchanged. Do not increase saturation to compensate for every additional nested surface. The approved material studies remain the visual authority.

Use a luminous outer contour and soft paired shadows instead of a dark hairline around every control. Text fields have a circular Resin/Haze field-state badge within the Resin surround; keyboard focus still adds a full, clearly visible ring. Checkboxes and radios use contained selection marks, switches retain a contrast-bearing thumb, and sliders use a value-driven track and marked glass thumb. Keep labels and native semantics. Status badges use their semantic symbol and words, with the tested semantic ink/surface pair behind the symbol, rather than a colored perimeter stroke. Selection, errors and focus must remain distinguishable without color.

When adapting controls to different sizes, preserve enough exposed Resin to show the rim and enough protected Haze to keep text crisp. Do not blur the element or its foreground. Opaque, reduced-transparency and forced-color modes remain functional alternatives. Validate actual composed controls in both modes and at narrow widths. An isolated material swatch does not establish component fidelity.


## Rounded icon set

Use the local `assets/icons.svg` symbol library: `crystal`, `layers`, `document`, `directions`, `workspace`, `conversation`, `library`, `check`, `attention`, `alert`, `info`, `sparkle` and `chevron`. Icons use a 24px view box, 1.8px strokes, round caps and joins, and curved silhouettes. Documents, speech tails, books and geometric marks have rounded path geometry rather than merely rounded stroke joins. Keep icons sharp; do not apply material feathering to them.

```html
<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
  <use href="assets/icons.svg#conversation"></use>
</svg>
```

Icons next to text are decorative and hidden from assistive technology. Icon-only actions require an accessible name on the button and a full-sized interaction target. Status icons retain distinct shapes and adjacent words. Use `currentColor` so icons inherit tested foreground colors; do not reduce their opacity to simulate glass.


## Focus light and circular state badges

Focus uses an immediate 2px primary-color core at a 3px offset, surrounded by a broadly feathered halo. The halo is four graded layers of the primary color: 46% at 6px / 1px, 30% at 16px / 3px, 17% at 30px / 6px and 8% at 54px / 11px (blur / spread). The light falls off smoothly instead of ending on a hard edge. The spreads were halved from 2/6/12/22 at Meridian's request and the blur radii were left unchanged, so the ring thins without the falloff flattening.

**A focused control also lifts.** Beneath the halo sit two elevation layers: a directional 8px / 18px (offset / blur) at 30% of the primary color, and a broad 22px / 40px at 27% of the *decorative* color. The directional layer reuses the halo's second feather so the lift reads as the same light source; the broad one is decorative rather than primary so the shadow under a focused control carries the palette's own shadow hue instead of tinting the page purple. Focus changes the elevation shadow's hue without blurring any foreground.

In dark mode the feather alphas lift, to 56 / 38 / 22 / 11 against light's 46 / 30 / 17 / 8. A deep canvas swallows the falloff at the lighter values, so the ring reads as a hard edge with nothing around it. Blur, spread and the elevation layers are identical in both modes.

The four feather colors are published as `--cr-focus-feather-1` through `-4` and the broad shadow as `--cr-focus-shadow`, so a product can retint the falloff without restating the recipe. The single token `--cr-focus-ring` composes all six layers so every focusable surface shares one recipe. The core remains defined for visibility; text and icons are never blurred. Keyboard focus applies to all interactive elements. Text entry lights its Resin shell through `:focus-within`. Motion must neither delay nor remove the focus cue. Forced colors substitute a system Highlight outline and remove decorative shadows.

A `.cr-indicator` is a 20px circle painting an 80% Haze fill on an isolated layer with a 1px feather. It is Haze rather than Resin, for the reason given under [Indicators](#indicators). Field badges are 24px. Their foreground remains crisp and uses the tested body ink. They sit beside the content, never over text or a native select arrow. These are informational, non-interactive marks and are not click targets.

<!-- generated:focus-recipe -->

| Layer | Blur | Spread | Role |
|---|---|---|---|
| `outline: 2px solid var(--cr-focus-core)` at `outline-offset: 3px` | None | None | The crisp core. Never feathered, and the only part that survives forced colours. |
| Halo 1 | 6px | 1px | 46% of the primary colour |
| Halo 2 | 16px | 3px | 30% of the primary colour |
| Halo 3 | 30px | 6px | 17% of the primary colour |
| Halo 4 | 54px | 11px | 8% of the primary colour |
| Elevation 1 | 18px | None | 30% of the primary colour, offset 8px: the directional lift |
| Elevation 2 | 40px | None | 27% of the decorative colour, offset 22px: the broad lift |
<!-- /generated:focus-recipe -->

Every layer is read from `--cr-focus-ring` in the library's own exported theme, so this
table cannot disagree with what ships. The preview site's `assets/controls.css` is a
stylesheet the package does not contain, and the table must not be read from it. The core
is never feathered and the offset is never zero: a ring drawn *on* the border is hard to
tell from a hover state, and on a pill it reads as a thicker stroke rather than as focus.

A check mark is reserved for validation and information display: the status badges in `.cr-status` and a checkbox's own `:checked` indicator. It never marks a selected, pressed or focused control. Selection instead uses a heavier label weight, which changes no metric that would reflow the group. Round specimen swatches, which cannot carry a weight change, use an inset ring gap.  Ordinary prose links retain their link styling. Badges are `aria-hidden`: the real control supplies its accessible name, required/invalid/selected/busy state and error association. The visual symbol never gets appended to the control's text content. Native checkbox/radio indicators and functional labels remain intact. Small controls retain full-sized hit targets. Badges have solid, unblurred alternatives under reduced transparency and forced colors.

## Geometry

Crystal has exactly two control shapes, and what the control is decides which one applies.
How the control looks in a particular layout does not.

**Action controls are pill-shaped.** Buttons, icon buttons, segmented controls, chips,
menu entries and tabs use a fully rounded radius, as does anything else whose job is
"do this" or "go here". A pill is unambiguous at any size: it never reads as a card, a
field or a container.

**Card-shaped buttons keep the content radius.** A control that is a tappable object (a
project tile, a palette swatch card or a library item) keeps `--cr-radius` (28px by
default). These are the exception and they are recognisable, because the user is choosing
a thing and is not triggering an action.

There is no third shape: a button with an 8px or 12px radius is neither shape and is a
defect.

<div class="sample-row" markdown="1">
<button class="cr-button" type="button">Pill action</button>
<button class="cr-control" type="button">Pill control</button>
</div>

The pill radius is a token: `component.action.radius` resolves through
`semantic.shape.pill`. A component that writes `border-radius:999px` directly renders
correctly and does not follow any later change to the shape language. See
[Tokens](tokens.html).

## Focus

Focus is a crisp 2px primary core at 3px offset, inside a four-layer feathered halo.
There are six layers in total, and each has a role:

| Layer | Role |
| --- | --- |
| `outline: 2px solid var(--cr-focus-core)` at `outline-offset: 3px` | The crisp core. It shows focus at a glance and it survives forced colours. |
| `inset 0 2px 1px var(--cr-rim)` | Keeps the control's own top edge readable inside the ring. |
| 4 × feathered primary glows at 6/1, 16/3, 30/6 and 54/11 | The halo. Increasing blur at decreasing opacity, so the ring dissolves outward rather than ending on a hard edge. |

Each pair is blur radius / spread. The spread values were halved in September 2026 and the blur radii were left unchanged. Halving both produces a tighter ring with a harder edge, which is different from a thinner ring.

The core is never feathered. The offset is never zero, because a ring drawn *on* the
border is hard to distinguish from a hover state, and on a pill it reads as a thicker
stroke rather than as focus.

Tab to the entries in the side menu on this page to see the complete recipe on a real
control.

Focus is applied through `:focus-visible`, never `:focus`, so pointer users do not get a
ring they did not ask for. Any rule that resets `box-shadow` on a control must exclude the
focused state, or it reduces the recipe to a bare outline:

```css
/* Correct: the resting state only. */
.menu-item:not(:focus-visible){ box-shadow:none }
```

## Selection

**A check mark means validated or informational. It never means "selected".** This is
Crystal's most frequently violated rule, because a check is the reflexive choice for
selection in most systems.

Selection is expressed with **label weight**:

- the label at weight 800 instead of 650
- `aria-current="page"` for navigation, or `aria-selected` / `aria-pressed` as the control
  demands

The side menu on this page is the reference implementation.

Nothing is drawn beside the label to mark it. A leading mark is drawn inside the
control, so it offsets the label it is meant to mark and the selected item stops lining
up with the others. Selection must never rest on colour alone, and weight already meets
that obligation: it is typographic rather than chromatic, so it survives every palette,
dark mode and colour vision difference.

A check mark is a statement about a value: this field validated, this item is complete,
this option is confirmed. If it also means "this is the current tab",
then a list containing both validated items and a current item becomes unreadable, and a
screen reader's "checked" state stops corresponding to anything the user can act on.

Selection colour is never the only signal. This is WCAG 1.4.1 applied as a design rule
rather than as a post-hoc check.

### Selection in forced colours

A filled selected row is a defect in forced-colors mode. See
[forced colours](accessibility.html#forced-colours) for the reason and the correct
recipe. Selection becomes a `Highlight` ring, never a fill.

## Indicators

An indicator (the moving pill behind a selected segment, or the dock's active marker) is
Haze, not Resin. It sits above a surface that is frequently already translucent, and a
Resin indicator would be the nested-Resin failure.

```css
.cr-indicator{
  background:transparent;          /* the indicator paints through ::before */
  backdrop-filter:none;
}
.cr-indicator::before{
  inset:1px;
  background:var(--cr-haze-fill);
  filter:blur(var(--cr-haze-feather));
}
```

The feather is on the `::before` layer alone, so the label above it stays crisp.

## Media and text

These specimens are static: they show each recipe, and the behaviour (playback, captions, editing commands) is the engine's and the platform library's.

<div id="specimen-media-stage" class="cr-media" style="--cr-media-aspect: 16 / 9; max-width: 560px; margin-block: 16px">
  <div class="cr-media-caption"><span>The harbour at dusk.</span></div>
  <div class="cr-media-bar">
    <div class="cr-resin transport" role="group" aria-label="Transport specimen">
      <button type="button" class="cr-bare" aria-pressed="false">Play</button>
      <time>0:00</time>
      <input type="range" min="0" max="8" value="3" aria-label="Seek" style="flex: 1; min-width: 0">
      <time>0:08</time>
      <button type="button" class="cr-bare">Settings</button>
    </div>
  </div>
</div>

The stage at 16:9 with no picture loaded, which is its letterbox, the caption cue on Stone above the transport, and the transport inset 12px from the stage.

<div id="specimen-media-audio" class="cr-haze cr-media audio" style="max-width: 560px; margin-block: 16px">
  <div><p style="margin: 0; font-weight: 700">Episode 4: The long way round</p><p style="margin: 0; color: var(--cr-muted)">Harbour stories</p></div>
  <div class="cr-media-bar">
    <div class="cr-resin transport" role="group" aria-label="Audio transport specimen">
      <button type="button" class="cr-bare" aria-pressed="false">Play</button>
      <time>0:00</time>
      <input type="range" min="0" max="8" value="0" aria-label="Seek Episode 4" style="flex: 1; min-width: 0">
      <time>0:08</time>
    </div>
  </div>
</div>

The audio card: Haze, with the card padding, holding the title and the transport.

<div id="specimen-text-editor" class="cr-field-shell" style="max-width: 560px; margin-block: 16px">
  <div class="cr-editor-toolbar" role="toolbar" aria-label="Formatting specimen">
    <button type="button" class="cr-bare">Heading</button>
    <span role="separator" aria-orientation="vertical"></span>
    <button type="button" class="cr-bare" aria-label="Bold" aria-pressed="true"><b>B</b></button>
    <button type="button" class="cr-bare" aria-label="Italic" aria-pressed="false"><i>I</i></button>
    <button type="button" class="cr-bare" aria-label="Underline" aria-pressed="false"><u>U</u></button>
  </div>
  <div class="cr-editor" role="textbox" aria-multiline="true" aria-readonly="true" aria-label="Editor specimen">
    <h3>Before the meeting</h3>
    <ul class="checklist">
      <li><label><input type="checkbox" checked aria-label="Send the minutes"></label><p>Send the minutes</p></li>
      <li><label><input type="checkbox" aria-label="Confirm the venue"></label><p>Confirm the venue</p></li>
    </ul>
    <p>The <strong>pilot boat</strong> budget is <u>under review</u>, the fee is <s>£40</s> £45, and the depth at low tide is <del>3.9 m</del> <ins>4.2 m</ins>. Press <kbd>Alt</kbd> + <kbd>F10</kbd> for the toolbar.</p>
    <blockquote><p>A harbour is only as good as the water in it.</p></blockquote>
  </div>
</div>

The editor: a field shell holding the toolbar and the document. The checklist's mark is the native checkbox's own state, the one place a check means checked. A finished item recedes to the muted ink and is not struck through. An insertion is underlined and a deletion struck through, so neither rests on colour alone.

<div id="specimen-text-marks" style="display: grid; gap: 12px; justify-items: start; max-width: 560px; margin-block: 16px">
  <div class="cr-frost bar" role="toolbar" aria-label="Selection toolbar specimen">
    <button type="button" class="cr-bare" aria-label="Bold" aria-pressed="true"><b>B</b></button>
    <button type="button" class="cr-bare" aria-label="Italic" aria-pressed="false"><i>I</i></button>
    <button type="button" class="cr-bare">Link</button>
  </div>
  <div class="cr-haze cr-editor" style="padding: 16px" role="textbox" aria-multiline="true" aria-readonly="true" aria-label="Highlight specimen">
    <p>A <mark>highlighted phrase</mark> beside plain text. Select across both to see the selection.</p>
  </div>
</div>

**A highlight and a selection differ (D-34).** A highlight is `mark`, the primary-soft pair, as prose renders it. The editor's selection is a 28% primary tint under unchanged ink, so a highlighted word that is then selected still looks selected. The highlight measures 6.06:1 or better and the selection 7.63:1 or better in every palette and mode. A highlighted word that is then selected takes the action pair, primary with on-primary ink, 4.74:1 or better: the 28% tint over the highlight fell to 3.74:1 in Harbor (D-39).

## See it working

The [Playground](../playground.html#components) renders these controls live, and the side
menu on this page is the reference implementation of the selection pattern. Change the
palette in the Playground to confirm that focus follows the primary and that status
colours do not move.
