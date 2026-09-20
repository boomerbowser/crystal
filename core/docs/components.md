# Components and interaction patterns

The package contains working CSS primitives and a bounded interactive reference. It is not a finished React/native component library. The table separates supplied implementation from adoption work so a visual specimen cannot be mistaken for a production service.

## Component contracts

| Component | Anatomy and states | Included / application responsibility |
|---|---|---|
| Foundation | Opaque canvas and contextual gradients; light/dark | `.cr-plastic`; product chooses composition |
| Haze content card | 80% fill, 1.95px feathered perimeter, radius, content depth | `.cr-haze`; use semantic article or button according to behavior |
| Frost panel | Frosted surround, grain, Haze reading wells | `.cr-frost`; app supplies menu/sheet behavior and focus |
| Resin toolbar | Single floating plane, protected label group, selected destination | `.cr-resin`, `.cr-dock`, `.cr-dock-inner`; local preview switches actual scenes; app supplies routing |
| Stone label backing | 55% light / 60% dark, 1.95px feather, crisp text | `.cr-stone`; `.cr-dock-inner` shares the recipe |
| Mirage modal scrim | Dark tint with chromatic diffusion of the scene behind the active modal | `.cr-mirage` and dialog `::backdrop`; standalone paint requires real application modal behavior |
| Primary action | Resin shell, Haze reading fill, optical pressure and light; hover/pressed/focus/disabled | `.cr-button`; real action and progress/error handling are app-owned |
| Secondary/quiet action | Resin shell with neutral Haze reading fill | `.secondary`, `.quiet`; same semantics as primary |
| Destructive action | Resin/Haze with independent danger boundary and explicit label | `.danger`; app supplies consequence-specific confirmation and recovery |
| Text field | Visible label, state badge, glowing focus ring, validation, helper/error association | `.cr-input`; working native form example; app supplies validation rules |
| Selection control | Explicit selected state plus text/mark | Native checkbox/select and preview button groups; keyboard semantics must match the component |
| Range control | Visible label/value, keyboard adjustable range | Native sliders in the lab; product limits require domain validation |
| Authored bubble | Haze, directional tight corner, optional author metadata | `.cr-bubble`, `.own`; app supplies content/Markdown semantics |
| Composer surround | Frost frame and softened content well around protected input controls | CSS composition; no rich-text editor or delivery service is implemented |
| Status badge | Independent ink/surface pair, symbol and visible label | `.cr-status` with `data-status`; dynamic announcements are app-owned |
| Avatar | Circular image/initials, accessible identity when needed | Reference styling; app handles real identity, image failure and privacy |
| Dialog | 80% feathered surface over Mirage; title, body and named actions | Working native HTML dialog example; Escape/focus return; app owns transactions |
| Tooltip | Short supplemental text; never sole label | Working Resin/Haze tooltip in the motion suite; focus, hover and Escape |
| Menu/popover | Supporting surface with keyboard navigation and dismissal | Working Resin/Haze local menu and popover in the motion suite; production adoption still requires testing |
| Drawer/sheet | Overlay support with label, close, focus management | Working modal inspector in the motion suite; app decides production modality |
| Table/list | Soft content panel, clear header relationships, explicit sort/filter states | Native table in contrast report; production data controls not implemented |
| Tabs | Labeled selected item with keyboard pattern matching actual semantics | Working ARIA tabs in the motion suite; scene navigation separately uses pressed buttons |
| Notification/toast | Clear result plus useful next action | Manually dismissed Resin/Haze notification in the motion suite; production queue remains app-owned |
| Loading | Preserve layout, communicate pending work, no false success | Specification only; user-triggered work needs real lifecycle state |
| Empty/error/denied | Explain situation and a valid next step | Specification only; must reflect actual service/permission state |
| Chart/data visualization | Direct labels, pattern/shape, accessible equivalent | Specification only; brand palettes are not prevalidated chart palettes |

## Interaction and content rules

Every production control needs default, hover where meaningful, pressed, focus-visible, disabled, loading and error states as applicable. Disabled elements must not be the only explanation of unavailable functionality. Do not simulate success for an unimplemented action.

Primary application buttons are at least 44px high. Compact documentation controls may be smaller but must meet applicable target-size/spacing criteria; do not infer that every clickable element is 44px from the button class. Validate touch use, not only a desktop screenshot.

The selected preview destination has both a circular check badge and a pressed state. Palette selections have a visible check. Functional statuses have words and distinct symbols. These cues survive color changes.

The preview product-name form performs a real local update with native validation; it does not save a brand to a remote service. Dialogs inspect actual specifications or exported tokens. The export buttons produce files from the current configuration. Fictional messages, avatars and library cards remain clearly labeled design content.

## Product patterns

**Navigation:** Use a floating toolbar when it improves the task. Keep the active destination labeled and avoid nested floating material planes. Side navigation may be more appropriate for dense tools. Do not require one product's destination set in unrelated products.

**Editing:** Give content a stable 80% reading fill with feathered edges and crisp text, then surround it with tools at an appropriate elevation. Native input controls retain protected backgrounds and explicit boundaries. Separate draft state from publication and communicate unsaved/error states honestly.

**Consequential actions:** Use a Haze dialog with explicit action names, clear consequences, safe dismissal where appropriate, and actual pending/failure handling. Decorative Resin must not obscure the decision.

**Long content:** Preserve reading size, anchor navigation and focus when sections change. Virtualization, Markdown rendering, selection and assistive behavior require application-specific implementation.

**Responsive adaptation:** Move secondary controls out of the primary task without removing access. Maintain safe areas and avoid floating controls covering the final content or keyboard-focused element.

## Framework/library strategy

Use the included semantic tokens and material primitives as a shared visual layer. Wrap real accessible primitives in each product framework; choose those libraries during product implementation based on current support, licensing and behavior. Do not rebuild complex focus/menu behavior only to achieve the surface style.

Maintain a production Storybook or equivalent gallery for actual components with interaction, accessibility and visual-regression stories. Native products need actual device galleries; screenshots of this web page do not count as native component coverage.

## Resin interaction and information surfaces

Use `assets/controls.css` after the base and layout styles. Buttons, action links, tabs, selectable controls and field shells use Resin as their interaction surface. The preview supplies Haze reading protection inside a visible Resin perimeter. `assets/controls.js` adds only a nonsemantic shell to native fields; labels, input values, validation and form submission remain native.

Small display elements (tooltips, toasts, labels, tags and badges) and temporary menus (secondary menus, dropdowns, flyouts and popovers) use `.cr-resin-haze`. This is a reusable composition of existing materials, not a seventh material. Larger persistent components retain their structural material. Native OS popup internals are platform-owned; use an actual accessible custom component when full Crystal popup rendering is required.

Selected controls retain circular symbol badges and correct ARIA state. Disabled controls retain legible content but cannot activate. Opaque and forced-color modes replace decorative optics while preserving control boundaries. Motion uses material deformation and changing light, with crisp foreground text.

### Interaction surface geometry

Use a broad, luminous Resin rim with an 8px inset reading fill and diffuse paired shadows. Avoid thin dark perimeter strokes on ordinary action buttons; native text-entry fields retain a functional boundary and every control retains a visible keyboard focus ring. Standalone actions use generous padding and full pill geometry.

Toolbars, segmented controls and tab groups share one Resin/Haze surface. Their inactive actions have no separate bevel, backdrop filter or raised outline. Only the selected action gains a raised, strongly colored indicator, plus a non-color selection cue. Temporary menus follow the same shared-surface principle. The material motion suite is unchanged by this visual refinement.


## Material definition on small and nested surfaces

A small Resin control over a Haze reading well can lose the color and depth visible in the larger material studies. Keep the 20% Resin body and 80% inset Haze fill. Supply restrained contextual light **under** the Haze rather than increasing body opacity or painting the label. The control optical layer mixes glow at 12.6% and decorative color at 8.4% in light mode; dark mode uses 9.8% and 7% (a 30% reduction from the previous rim color opacity). On buttons and action links, inset the chromatic paint by 2px and feather that paint by 2px beneath Haze, so the color blends inward into the content fill. Keep the outer optical contour and all text crisp. Palette specimen colors and selection marks are not blurred. These are local gradient maxima, not changes to the global atmosphere or material opacity. Do not increase saturation to compensate for every additional nested surface. The approved material studies remain the visual authority.

Use a luminous outer contour and soft paired shadows instead of a dark hairline around every control. Text fields have a circular Resin/Haze field-state badge within the Resin surround; keyboard focus still adds a full, clearly visible ring. Checkboxes and radios use contained selection marks, switches retain a contrast-bearing thumb, and sliders use a value-driven track and marked glass thumb. Keep labels and native semantics. Status badges use their semantic symbol and words, with the tested semantic ink/surface pair behind the symbol, rather than a colored perimeter stroke. Selection, errors and focus must remain distinguishable without color.

When adapting controls to different sizes, preserve enough exposed Resin to show the rim and enough protected Haze to keep text crisp. Do not blur the element or its foreground. Opaque, reduced-transparency and forced-color modes remain functional alternatives. Validate actual composed controls in both modes and at narrow widths; a beautiful isolated material swatch does not establish component fidelity.


## Rounded icon set

Use the local `assets/icons.svg` symbol library: `crystal`, `layers`, `document`, `directions`, `workspace`, `conversation`, `library`, `check`, `attention`, `alert`, `info`, `sparkle` and `chevron`. Icons use a 24px view box, 1.8px strokes, round caps and joins, and curved silhouettes. Documents, speech tails, books and geometric marks have rounded path geometry rather than merely rounded stroke joins. Keep icons sharp; do not apply material feathering to them.

```html
<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
  <use href="assets/icons.svg#conversation"></use>
</svg>
```

Icons next to text are decorative and hidden from assistive technology. Icon-only actions require an accessible name on the button and a full-sized interaction target. Status icons retain distinct shapes and adjacent words. Use `currentColor` so icons inherit tested foreground colors; do not reduce their opacity to simulate glass.


## Focus light and circular state badges

Focus uses an immediate 2px primary-color core at a 3px offset, surrounded by a broadly feathered halo. The halo is four graded layers of the primary color — 46% at 6px / 1px, 30% at 16px / 3px, 17% at 30px / 6px and 8% at 54px / 11px (blur / spread) — so the light falls off smoothly instead of ending on a hard edge. The spreads were halved from 2/6/12/22 at Meridian's request; the blur radii were deliberately left alone, so the ring thins without the falloff flattening. The single token `--cr-focus-ring` composes the halo so every focusable surface shares one recipe. The core remains defined for visibility; text and icons are never blurred. Keyboard focus applies to all interactive elements. Text entry lights its Resin shell through `:focus-within`. Motion must neither delay nor remove the focus cue. Forced colors substitute a system Highlight outline and remove decorative shadows.

A `.cr-indicator` is a 20px circular Resin surface with a 3px-inset 80% Haze fill and a 1px feather on that fill. Field badges are 24px. Their foreground remains crisp and uses the tested body ink. They sit beside the content, never over text or a native select arrow. These are informational, non-interactive marks, not small click targets.

<!-- generated:focus-recipe -->

| Layer | Blur | Spread | Role |
|---|---|---|---|
| `outline: 2px solid var(--cr-focus-core)` at `outline-offset: 3px` | — | — | The crisp core. Never feathered, and the only part that survives forced colours. |
| Halo 1 | 6px | 1px | 46% of the primary colour |
| Halo 2 | 16px | 3px | 30% of the primary colour |
| Halo 3 | 30px | 6px | 17% of the primary colour |
| Halo 4 | 54px | 11px | 8% of the primary colour |
<!-- /generated:focus-recipe -->

Each halo layer is read from `--cr-focus-ring` in `assets/controls.css`, so this table
cannot disagree with what ships. The core is never feathered and the offset is never
zero: a ring drawn *on* the border is hard to tell from a hover state, and on a pill it
reads as a thicker stroke rather than as focus.

A check mark is reserved for validation and information display — the status badges in `.cr-status` and a checkbox's own `:checked` indicator. It never marks a selected, pressed or focused control. Selection instead uses a heavier label weight, which changes no metric that would reflow the group. Round specimen swatches, which cannot carry a weight change, use an inset ring gap.  Ordinary prose links retain their link styling. Badges are `aria-hidden`: the real control supplies its accessible name, required/invalid/selected/busy state and error association. The visual symbol never gets appended to the control's text content. Native checkbox/radio indicators and functional labels remain intact. Small controls retain full-sized hit targets. Badges have solid, unblurred alternatives under reduced transparency and forced colors.

## Geometry

Crystal has exactly two control shapes, and which one applies is determined by what the
control *is*, not by how it looks best in a particular layout.

**Action controls are pill-shaped.** Buttons, icon buttons, segmented controls, chips,
menu entries, tabs — anything whose job is "do this" or "go here" — use a fully rounded
radius. A pill is unambiguous at any size: it never reads as a card, a field or a
container.

**Card-shaped buttons keep the content radius.** A control that is really a tappable
*object* — a project tile, a palette swatch card, a library item — keeps `--cr-radius`
(28px by default). These are the exception and they are recognisable: the user is choosing
a thing, not triggering an action.

There is no third option. A button with an 8px or 12px radius is neither shape and is a
defect, not a variant.

<div class="sample-row" markdown="1">
<button class="cr-button" type="button">Pill action</button>
<button class="cr-control" type="button">Pill control</button>
</div>

The pill radius is a token, not a literal: `component.action.radius` resolves through
`semantic.shape.pill`. A component that writes `border-radius:999px` directly works and
silently opts itself out of every future change to the shape language. See
[Tokens](tokens.html).

## Focus

Focus is a **crisp 2px primary core at 3px offset, inside a four-layer feathered halo**.
Six layers in total, and each one is doing a job:

| Layer | Role |
| --- | --- |
| `outline: 2px solid var(--cr-focus-core)` at `outline-offset: 3px` | The crisp core. This is what proves focus at a glance and what survives forced colours. |
| `inset 0 2px 1px var(--cr-rim)` | Keeps the control's own top edge readable inside the ring. |
| 4 × feathered primary glows at 6/1, 16/3, 30/6 and 54/11 | The halo. Increasing blur at decreasing opacity, so the ring dissolves outward rather than ending on a hard edge. |

Each pair is blur radius / spread. The spread values were halved in September 2026; the blur radii were deliberately left alone, because halving both produces a tighter ring with a harder edge, which is a different thing from a thinner one.

The core is never feathered. The offset is never zero — a ring drawn *on* the border is
hard to distinguish from a hover state, and on a pill it reads as a thicker stroke rather
than as focus.

Tab to the entries in the side menu on this page to see the complete recipe on a real
control.

Focus is applied through `:focus-visible`, never `:focus`, so pointer users do not get a
ring they did not ask for. Any rule that resets `box-shadow` on a control must exclude the
focused state, or it silently reduces the recipe to a bare outline:

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
control, so it offsets the very label it is meant to mark and the selected item stops
lining up with the others. The obligation such a mark would serve — that selection
never rests on colour alone — is already met by weight, which is typographic rather
than chromatic and survives every palette, dark mode and colour vision difference.

Why not a check: a check mark is a *statement about a value* — this field validated, this
item is complete, this option is confirmed. If it also means "this is the current tab",
then a list containing both validated items and a current item becomes unreadable, and a
screen reader's "checked" state stops corresponding to anything the user can act on.

Selection colour is never the only signal. A weight change is typographic, so it
survives the palette being changed, the mode being dark, and colour vision differences.
This is WCAG 1.4.1 applied as a design rule rather than as a post-hoc check.

### Selection in forced colours

A filled selected row is a defect in forced-colors mode — see
[forced colours](accessibility.html#forced-colours) for the reason and the correct
recipe. In short: selection becomes a `Highlight` ring, never a fill.

## Indicators

An indicator — the moving pill behind a selected segment, the dock's active marker — is
**Haze, not Resin**. It sits above a surface that is frequently already translucent, and a
Resin indicator would be the nested-Resin failure by another name.

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

## See it working

The [Playground](../playground.html#components) renders these controls live, and the side
menu on this page is the reference implementation of the selection pattern. Change the
palette in the Playground to confirm that focus follows the primary and that status
colours do not move.
