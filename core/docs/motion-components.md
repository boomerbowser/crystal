# Component motion suite

[Open the live component studies](../motion.html#component-motion) · [Search all recipes](../motion.html#recipe-library) · [Run browser contracts](../motion-contracts.html)

Crystal ships 57 executable component recipes in nine families, the six material signatures, Mirage withdrawal, a modal dismissal, and a measured-layout helper. This is the animation foundation for future component libraries. The demonstration includes real local component behavior, but is not an audited production React, Rust or native component library. No remote operation is represented as implemented.

## Engine responsibilities

**Motion 13.4.0** runs component and material element keyframes: translation, opacity, scale and state feedback. **GSAP 3.15.0** timelines coordinate the paint-layer clocks for feathered edges, optical highlights and rims, plus selected component sequences. Recipes declare a material and a motion signature: pressure, coalescence, meniscus movement, caustic light, surface tension, feathering, refraction or inertia. Optical layers share the component’s cancellation group and never animate text blur. GSAP drives paused native effects when targeting actual pseudo-elements. It does not clone private page content or replace the material with a screenshot.

Both packages are installed with exact versions in `package.json`, resolved transitively in `package-lock.json`, and bundled locally as `assets/vendor/crystal-engines.js`. No runtime CDN is required. The pure token resolver remains independent of the engines. The preview’s native dialog backdrop keeps a CSS fallback with the same timing tokens. Frost unfolds in depth; Plastic settles with weight; Resin compresses and redistributes its light; Haze and Stone move through their perimeter. Five larger material studies have generously sized replay stages.

The engine bridge gives both libraries one cancellation contract: `finished` settles on completion or cancellation, and only properties owned by the effect are restored. Cancellation never leaves a promise waiting for a killed GSAP timeline. Material replay, component recipes, and layout changes all participate in `CrystalMotion.stop()` and `stopAll()`.

## Motion rules shared by every component

- Semantic state, selected values, routing decisions, modality and focus take effect immediately. A visual transition cannot authorize an action or fabricate success.
- Ordinary translation is 5–30px. 50px guides compact motion; documented larger compositions may exceed it. Haze and Stone content stays in place; only their feathered paint moves locally.
- Typical sequences stay under two seconds at 1×. Each animation is capped at five seconds after speed adjustment. Defaults for controls are substantially shorter than material studies.
- The saved 0.25–2× speed factor applies throughout the preview and both engines. OS or explicit reduced motion overrides it and presents the final semantic state immediately.
- No automatic carousel, endless shimmer, flashing error, or infinite decorative loop is included. A finite busy cue can end while an operation remains busy; its static status remains.
- Exits keep focus safe. Move focus out before hiding nonmodal content; keep native modality during a modal exit, then restore the trigger.
- Never animate a visible keyboard focus ring away. Hover is supplementary, and disabled controls do not animate.
- Adopters must cancel effects on unmount, suspend offscreen work, and run assistive-technology and platform-performance checks on their actual components.

## Interaction and compact-surface materials

All interaction surfaces use a 20% Resin body, visible illuminated rim and an inset 80% Haze reading fill where contrast needs protection. The preview uses the protected form consistently because its surroundings are adjustable. The reading fill is physically inset, so the Resin perimeter stays visible. Standalone actions keep a neutral Haze reading fill inside a broad Resin rim. Grouped actions share one Resin/Haze container: inactive items are transparent, and the selected item uses the tested primary/on-primary color pair as a raised indicator with a circular check badge. The group retains the surrounding material shell.

The same formula applies to **tooltips, toasts, display labels, tags and badges**, and **secondary menus, dropdowns, flyouts and popovers**. Use `.cr-resin-haze` for these shells; `.cr-tag` adds compact label geometry. This does not change large persistent Frost panels, Plastic foundations, Haze reading areas, or the standalone Stone material. Plain prose and ordinary form-label text do not need their own material container. Native OS option popups and file choosers retain platform drawing; the in-app menu and select trigger use Crystal.

## Component coverage and composition

| Component family | Recipes / composition | Required semantics and state |
|---|---|---|
| Button, icon button, action link | `press`, `hover` | Native activation; disabled state; visible focus |
| Toggle, checkbox, radio, segmented control, selectable chip | `selection`, `switch-on`, `switch-off`, `check` | Checked/pressed state and a non-color indicator |
| Slider, stepper, numeric output | `slider-step` | Native keyboard range interaction and current value |
| Input, textarea, validation group | `field-focus`, `field-invalid`, `field-valid`, `hint-in/out` | Real validation, associated error text, `aria-invalid` |
| Copy action, confirmation mark | `copy-confirm`, `success` | Play only after the actual action succeeds |
| Tab, navigation rail, bottom navigation | `selection`, `tab-in` | Selected semantics, roving tab stop, panel visibility |
| Page/view, wizard step, breadcrumb, pagination | `page-in/out`, `breadcrumb` | Router/history and focus managed by the host |
| Dialog / alert dialog | Haze + Mirage + `dismiss` | Native modality, initial focus, Escape, focus return |
| Drawer / inspector / sheet | `drawer-in/out` + Mirage | Native modality or an explicitly nonmodal panel contract |
| Dropdown / select / command menu | `menu-in/out` | Keyboard selection, dismissal and trigger state |
| Popover / hover card | `popover-in/out` | No accidental focus trap; close and outside dismissal |
| Tooltip | `tooltip-in/out` | Focus and hover access; `aria-describedby`; Escape |
| Accordion / disclosure / tree group | `accordion-in/out`, `icon-turn` | Expanded state, region relation, focus before collapse |
| List / table row / card / grid cell | `list-in/out`, `highlight` | Update actual collection data and announce meaningful changes |
| Reordering / sortable item / drag-and-drop | `layout()`, `reorder`, `drag-pickup`, `drag-settle` | Host owns pointer capture, drop validation and keyboard alternative |
| Resizable panel / split view | `resize-settle`, `layout()` | Host owns resize handles and keyboard bounds |
| Chat message / reaction / activity entry | `message-in`, `reaction`, `highlight` | Real local/remote data state; no forced scroll or replay on history |
| Toast / snackbar / banner | `toast-in/out`, `attention` | Persistent readable status; manual dismissal in this preview |
| Progress bar / transfer indicator | `progress-change`, `success` | Actual measured progress; never animate a fabricated success |
| Busy indicator / skeleton | `busy`, `skeleton-resolve` | Real pending/ready state, no inference from animation completion |
| Empty state / no-results panel | `empty-in` | Actual empty collection or search result |
| Image / video surface / lightbox | `media-in`, `caption-in`, Haze/Mirage if modal | Decode/readiness event, reserved layout space, media controls owned by host |
| Carousel / gallery / thumbnail strip | `carousel-next/previous`, `selection` | Explicit navigation, item count, descriptive text; no autoplay |
| Avatar / presence / badge / unread counter | `selection`, `highlight`, `attention` | Status text or accessible label; no color-only meaning |
| Calendar / date picker / combobox | `menu-in/out`, `selection`, `page-in` | Full keyboard/locale/date semantics supplied by the component library |

Mappings intentionally share recipes. Each new product component should select a behavior contract rather than invent another animation for a synonymous state. The suite does not implement a router, a production combobox, pointer dragging, a video player, or network services; it provides their usable motion primitives and exact integration responsibilities.

## Executable recipe catalog

Base times below are at 1×; the preview resolves the saved speed at playback. Every row has an executable recipe and a replay in the library.

<!-- generated:component-recipes -->

| ID | Material / behavior | Engine | Base duration | Intended use |
|---|---|---|---|---|
| `press` | resin / pressure | Motion | 320ms | Buttons, icon buttons and segmented controls. Disabled controls never animate. |
| `hover` | resin / caustic | Motion | 700ms | Fine-pointer affordance only; keyboard focus is immediate. |
| `selection` | resin / meniscus | Motion | 420ms | Selected chips, radios, toggles and navigation; set selected semantics first. |
| `switch-on` | resin / coalesce | Motion | 460ms | Animate the thumb after its checked state is applied. |
| `switch-off` | resin / coalesce | Motion | 460ms | Animate the thumb after its unchecked state is applied. |
| `check` | resin / iris | Motion | 340ms | Checkbox and radio indicators; retain a visible non-color state. |
| `slider-step` | stone / feather | Motion | 400ms | Range outputs, steppers and scrubber labels; value updates immediately. |
| `icon-turn` | resin / torsion | Motion | 440ms | Disclosure chevrons; parent expanded state is authoritative. |
| `copy-confirm` | resin / coalesce | Motion | 540ms | Only after clipboard write succeeds; retain textual confirmation. |
| `field-focus` | resin / caustic | Motion | 600ms | Supplementary focus response; never animate or delay the actual focus ring. |
| `field-invalid` | resin / tension | GSAP | 480ms | Single low-amplitude cue with persistent error text; never repeated shaking. |
| `field-valid` | resin / meniscus | Motion | 550ms | After real local validation; never imply a remote operation succeeded. |
| `hint-in` | resin / coalesce | Motion | 500ms | Inline help, character guidance and validation details. |
| `hint-out` | resin / meniscus | Motion | 500ms | Hide the help only after completion; do not remove focused content. |
| `tab-in` | frost / refraction | Motion | 650ms | Selected tab panels; apply aria-selected and hidden state synchronously. |
| `page-in` | plastic / inertia | Motion | 1050ms | New local view after routing is committed; preserve focus and history. |
| `page-out` | plastic / inertia | Motion | 760ms | Departing view only; never postpone route authorization or loading. |
| `view-push-in` | plastic / inertia | GSAP | 700ms | A view pushed onto a stack. It arrives from the inline-end edge, along the reading direction, so the movement says the stack went forward. Mirror it for a pop, and again for right-to-left. |
| `view-push-out` | plastic / inertia | GSAP | 700ms | The view a push covered. It travels a fraction of the incoming view's distance and stays behind it, so the two read as one stack rather than two independent slides; it is still there, which is what makes the back gesture legible. |
| `breadcrumb` | resin / coalesce | Motion | 500ms | New breadcrumb item; current-page semantics stay explicit. |
| `drawer-in` | frost / refraction | GSAP | 1000ms | Side sheets and inspector panels; establish modality first. |
| `drawer-out` | frost / refraction | GSAP | 650ms | Keep modal focus contained until dismissal completes. |
| `menu-in` | resin / coalesce | Motion | 620ms | Dropdowns, selects and command menus; keyboard behavior belongs to the component. |
| `menu-out` | resin / meniscus | Motion | 380ms | Close menus and restore trigger focus when appropriate. |
| `tooltip-in` | resin / meniscus | Motion | 420ms | Noninteractive descriptions on focus or hover; Escape dismisses. |
| `tooltip-out` | resin / meniscus | Motion | 420ms | Pointer and focus must both leave before hiding. |
| `popover-in` | resin / coalesce | Motion | 620ms | Nonmodal details with outside-click, Escape and focus handling. |
| `popover-out` | resin / meniscus | Motion | 380ms | Dismiss nonmodal details without trapping focus. |
| `accordion-in` | haze / feather | Motion | 650ms | Animate visible content after expanding; no scripted height measurement needed. |
| `accordion-out` | haze / feather | Motion | 650ms | Hide content after completion; return focus first if a child has focus. |
| `list-in` | haze / feather | Motion | 650ms | Real added messages, table rows, cards and collection items. |
| `list-out` | haze / feather | Motion | 440ms | Remove after completion; announce the actual change and keep focus valid. |
| `reorder` | plastic / inertia | GSAP | 500ms | Supplement DOM reordering; use layout() for measured bounded displacement. |
| `highlight` | haze / feather | Motion | 500ms | A brief update cue paired with actual content or announcement. |
| `message-in` | haze / feather | Motion | 650ms | Only on a new message; do not replay on virtualized history or steal scroll. |
| `reaction` | resin / coalesce | Motion | 680ms | Toggle the real reaction state and count before the response. |
| `toast-in` | resin / coalesce | Motion | 650ms | Live status text with a persistent dismiss button. |
| `toast-out` | resin / meniscus | Motion | 440ms | No timer required; manual dismissal preserves reading time. |
| `success` | stone / feather | GSAP | 600ms | Use after a successful operation with text and a recognizable mark. |
| `attention` | stone / feather | Motion | 500ms | Single finite cue for important text; never flash or loop. |
| `progress-change` | stone / feather | Motion | 500ms | Actual progress is set first; this animation does not fabricate completion. |
| `busy` | stone / feather | GSAP | 680ms | One cycle for an actual pending operation; keep a static busy label if it lasts longer. |
| `skeleton-resolve` | haze / feather | Motion | 650ms | Replace a skeleton only when real data arrives; no endless shimmer. |
| `empty-in` | resin / coalesce | Motion | 500ms | Shown only when the collection is actually empty. |
| `media-in` | frost / refraction | Motion | 900ms | After an image decodes or media becomes ready; reserve layout space. |
| `caption-in` | resin / coalesce | Motion | 500ms | Optional descriptive caption; text remains accessible in reduced motion. |
| `carousel-next` | frost / refraction | GSAP | 920ms | Explicit next/previous navigation; never autoplay. |
| `carousel-previous` | frost / refraction | GSAP | 920ms | Maintain item count and keyboard navigation. |
| `drag-pickup` | resin / tension | Motion | 500ms | Visual lift for a selected movable item; keyboard alternative required. |
| `drag-settle` | resin / coalesce | GSAP | 640ms | After a valid local move, with undo where data changes. |
| `resize-settle` | frost / refraction | Motion | 600ms | After measured layout size changes; never animate focus or hide handles. |
| `resin-confluence` | resin / coalesce | GSAP | 1600ms | Explicit material choreography for a large specimen; replay is a visual study, not an application action. |
| `frost-unfold` | frost / refraction | GSAP | 1900ms | Explicit material choreography for a large specimen; replay is a visual study, not an application action. |
| `plastic-settle` | plastic / inertia | GSAP | 1700ms | Explicit material choreography for a large specimen; replay is a visual study, not an application action. |
| `haze-tide` | haze / feather | GSAP | 1800ms | Explicit material choreography for a large specimen; replay is a visual study, not an application action. |
| `stone-contour` | stone / feather | GSAP | 1300ms | Explicit material choreography for a large specimen; replay is a visual study, not an application action. |
| `check-off` | plastic / iris | Motion | 300ms | Checkbox and radio indicators returning to unchecked. Paired with `check`; the iris closes toward the same point it opened from. |
<!-- /generated:component-recipes -->

## Runtime API

`controls.js` adds Resin shells around native text fields and selects while preserving their labels, validation and keyboard behavior; the shells' appearance is in `crystal.css` as of 2.1.0, and no longer needs the preview's own `controls.css`. Load scripts in this order: theme CSS, primitive CSS, motion CSS, `assets/vendor/crystal-engines.js`, `assets/motion-catalog.js`, then `assets/motion.js`. Load `tokens.js` and `crystal.js` first if resolving user preferences dynamically. `motion-interactions.js` optionally installs delegated button feedback; omit it when your component library owns gesture handling to avoid duplicate effects.

```js
// Apply real UI state before giving it visual feedback.
button.setAttribute('aria-pressed', 'true');
const result = await CrystalMotion.play(button, 'selection');
// result.status is finished, cancelled or instant.

// A real reorder, with measured motion that may exceed 50px.
const before = row.getBoundingClientRect();
list.insertBefore(row, row.previousElementSibling);
await CrystalMotion.layout(row, before);

// Cleanup on unmount or superseding intent.
CrystalMotion.stop(row);
CrystalMotion.stopAll();
```

`play(element, recipeId, {rate})` accepts all material and component recipe IDs. An additional replay rate is optional; the default uses the user's factor once, not twice. `duration(baseMilliseconds, rate)` resolves the same factor and cap. `recipes` exposes the catalog metadata. Unknown presets and invalid targets throw rather than reporting a fake completion.

`layout(element, previousRect)` compares the previous and current DOM position. Displacements up to the viewport diagonal use a GSAP-controlled inverse transform, with duration adapting to distance. Pass `{extended:false}` to retain the compact 50px/crossfade behavior. Offscreen-scale moves beyond the viewport diagonal crossfade. The final order is always the real DOM order. Layout animation is cosmetic and does not supply drag-and-drop behavior.

The engine bridge restores prior inline values and priorities for its owned properties. Consumers should avoid modifying the same animated property during an effect; stop it before changing that property. Component implementations should use a dedicated animated wrapper when they already own a nontrivial transform. Libraries must not let two engines compete for the same property.

## Live examples and interruption

The component page includes local validation and actual clipboard handling; keyboard tabs and menus; a disclosure protected against rapid open/close races; hover/focus tooltip; dismissible popover; native modal inspector sheet; collection insertion/removal/reordering; a local message log with reactions; manually dismissed notifications; actual browser SHA-256 computation; carousel studies; and decoding of a user-selected local image without uploading it.

Disclosure, popover, menu and toast closures use an intent counter so a stale completion cannot hide a reopened component. A removed item preserves focus. Tab changes cancel the previous panel. Modal dismissal contains focus until it ends. The sheet exit shares the 650ms departure clock with its Mirage backdrop. Tooltip display is tied to both hover (including the tooltip itself) and focus; Escape dismisses it. Files use object URLs that are revoked when replaced or the page exits.

The catalog replays visual recipes on isolated specimens; a menu recipe replay is not itself a menu implementation. The separate live examples demonstrate behavior where supplied. This separation prevents a replay sample from being mistaken for a production application feature.

## Packaging and validation

```sh
npm ci
npm run build
npm test
```

`npm run build` regenerates the token data, the exported theme and the reference sections in `docs/`. `npm test` runs that build and then checks token contracts and contrast, recipe uniqueness, duration and travel bounds, engine declarations against the lockfile, documentation drift, and what the published package may contain. It needs Node and nothing else — the library has no Python tooling.

The motion engines are bundled for a browser by the documentation website, not here: `@crystal-ui/core` ships `engines.js` and declares gsap and motion as dependencies, and a consumer bundles them as it prefers. The browser contract page that exercises the real engines — recipe completion, cancellation, supersession, property restoration, reduced motion, duration limits, stationary foregrounds and every material signature — lives in `crystal-preview` and runs against the published package. Its results are evidence for the exercised browser, not a full WCAG, native-renderer or cross-browser certification.

### Storybook and future component packages

For each actual component, add stories for default/hover/focus/pressed/selected/disabled/error/busy states as applicable; enter/exit; rapid reversal; long labels and RTL; narrow viewports; both color modes; opaque fallback; reduced motion; and 0.25×/1×/2× timing. Interaction tests must assert the real semantic result and focus behavior, not merely that an animation finished. Pin a known frame or use reduced motion for stable visual snapshots, then test motion separately.

The current package is framework-independent. Future React, Rust or native packages can map this catalog to platform engines while preserving the ordinary travel guidance and documented large-travel exceptions, the stationary Haze/Stone rule, timing relationships, material effects, cancellation and accessibility behavior. A production Storybook is a future component-library deliverable; it is not claimed as shipped by this static reference.

### Interaction surface geometry

Use a broad, luminous Resin rim with an 8px inset reading fill and diffuse paired shadows. Avoid thin dark perimeter strokes on ordinary action buttons; native text-entry fields retain a functional boundary and every control retains a visible keyboard focus ring. Standalone actions use generous padding and soft capsule geometry.

Toolbars, segmented controls and tab groups share one Resin/Haze surface. Their inactive actions have no separate bevel, backdrop filter or raised outline. Only the selected action gains a raised, strongly colored indicator, plus a non-color selection cue. Temporary menus follow the same shared-surface principle. The material motion suite is unchanged by this visual refinement.


## Completion and reusable overlays

The Motion adapter uses its native `motion/mini` entry point for the existing CSS keyframes; GSAP still coordinates pseudo-element paint. Wait for the complete property group before restoring the caller's inline values and priorities. Do not restore paint inside a per-property completion callback while another renderer can still commit final values. In particular, dismissal must never leave `opacity: 0` on a reusable dialog.

The runtime regression checks inspect restored styles after subsequent browser frames and exercise four real Mirage open/close cycles, including reduced motion and focus return. Main and motion previews share this adapter. Dialogs suppress incidental horizontal overflow caused by animated feather paint; long code content retains its own scroll container.
