# Crystal platform library contract

What it means for a library to be "a Crystal library". Five requirements, so five libraries do not drift into five design systems that happen to share a colour.

Crystal is the base. A library implements Crystal for a platform; it does not fork the token or material definitions.

## 1. Consume generated tokens. Never redeclare a value.

The canonical source is `design-system/core/tokens/crystal.tokens.json`, a W3C DTCG file. Generated exports for TypeScript, Swift and Kotlin are emitted from it into `design-system/core/exports/`. A library imports those. A hard-coded `#7338EF`, `40px` or `1.95px` anywhere in a library is a defect, because it is a value that can no longer be changed centrally.

Derived values — elevation-scaled shadows, rgba composites, scaled motion durations — are computed, not stored. Reuse the resolver's arithmetic rather than reimplementing it; two implementations of the same formula will diverge.

## 2. Implement all six materials with platform-appropriate techniques.

Plastic → Frost → Resin, plus Haze, Stone and Mirage. The **qualities** are the contract, not the CSS recipe numbers: opacity, diffusion, colour transmission, perimeter definition, feathering, elevation and foreground clarity. A CSS approximation is not a native optical specification, and a native renderer is not obliged to reach the same result the same way.

What must survive on every platform: the material order, visibly distinct material behaviour, contextual colour, optical rims, elevation, feathered Haze and Stone paint, and crisp foregrounds. Text, icons, hit areas and focus rings are never blurred.

## 3. Implement the full catalogue.

`parity.json` lists every component Crystal specifies, with per-platform status. A component present in one library is expected in the others, with the same states, semantics and token bindings. Parity is measured against Mantine, Ant Design and MUI, named per component in the catalogue so the claim is checkable.

Crystal specifies appearance. Products bring their own accessible primitives — focus management, menu keyboard behaviour, date arithmetic, rich-text engines. Do not rebuild complex behaviour to obtain a surface style; wrap a maintained primitive and dress it.

## 4. Preserve the behavioural contracts.

- **Focus** is a crisp 2px core at 3px offset inside a four-layer feathered halo. Never delayed, never blurred, never replaced by a state badge.
- **Selection** is label weight. A check mark means validated or informational and never marks a selected, pressed or focused control.
- **Geometry**: action controls are pills, independent of the content radius. Card-shaped buttons keep the content radius.
- **Motion** follows the documented timings, easings and travel limits, with a hard five-second ceiling. Interactions, data and focus respond immediately even mid-transition.
- **Reduced motion** removes spatial change and keeps state feedback. **Reduced transparency** and **forced colours** remove diffusion while preserving shapes, readable pairs and hierarchy.
- **Status colours** are independent of brand palettes and are never redefined by them. Meaning is carried by words; symbol and colour reinforce.

## 5. Ship your own evidence.

Crystal's verification covers the design-system package: token contrast, static integrity, motion contracts and visual comparison of the reference preview. It says nothing about a library built on it.

Each library ships its own accessibility and visual-regression evidence, covering every component across the six palettes, both modes, both densities, full and reduced effects, and both text directions. Native clients require real device review; an HTML specimen is not evidence about a native renderer.

Record intentional platform compromises with actual device captures and review them. Never resolve a rendering or performance problem by silently substituting flat styling: reduce costly effects on supporting surfaces first, keeping palette, silhouette, contour, readable text and depth hierarchy.

## 6. Honour the motion physics, not the keyframes.

Crystal's motion is specified as a damped harmonic oscillator. Every recipe in
`design-system/core/tokens/motion-recipes.json` carries a `spring` block with
`stiffness`, `damping` and `mass`, plus a `platform` block that pre-computes the
parameterisation each platform actually exposes. Use it; do not re-derive it,
because two libraries deriving the same spring slightly differently is exactly
the drift this contract exists to prevent.

| Platform | API | Source of values |
|---|---|---|
| Web | Motion / GSAP spring, or `linear()` sampled from the core | `spring.stiffness`, `spring.damping`, `spring.mass` |
| Apple | `.spring(response:dampingFraction:)` | `spring.platform.swiftUI` |
| Android | `spring(dampingRatio:stiffness:)` | `spring.platform.compose` |

Three rules travel with it.

**Duration remains the authority.** Each spring is fitted to a reviewed
duration, and `tools/validate-motion.cjs` asserts the derived settling time
still matches within 15%. If you change one, change both.

**Damping expresses the material claim.** It is chosen by `signature`, not per
component: `inertia` overshoots about 12% because momentum is what it asserts,
and `feather` overshoots 0.1% because a soft edge that bounces is wrong. A
library that flattens every spring to one house curve has discarded the
signature system.

**Deformations conserve volume.** Every `scale(sx, sy)` satisfies `sx·sy = 1`.
This is not a stylistic preference: a shape that loses area while deforming
reads as rubber being crushed rather than liquid moving, which is precisely the
defect corrected in 2.0 across seventeen keyframes. If your platform expresses
deformation differently, preserve the invariant, not the syntax.

## 7. Treat the optical layer as an enhancement.

`design-system/core/assets/shaders/manifest.json` is the portable artefact; the GLSL
files are one implementation of it. Honour the **uniform contract**, not the
source.

| Platform | Shading language | Notes |
|---|---|---|
| Web | GLSL ES 3.00 on WebGL2 | As authored |
| Apple | Metal Shading Language | Uniforms become one constant buffer, declared order preserved |
| Android | AGSL via `RuntimeShader` | GLSL-derived; bodies transfer with signature changes only |

Non-negotiable properties:

- **Never required.** Every material must render completely with no shader at
  all. Each entry declares a `degradesTo`; a platform that cannot meet the
  contract degrades as declared rather than approximating it differently, since
  a divergent approximation damages parity more than an honest absence.
- **During a motion, and never at rest.** Shaders paint while a motion a person
  started is in flight, and on no surface that is doing nothing. This rule was briefly
  rewritten to admit an ambient rest state; ambient was then withdrawn (§8), so it
  reads as it originally did. A reference frame photographs a surface at rest, which is
  only deterministic because nothing paints there.
- **Never above content.** The optical layer belongs between a material's
  background and its content. On the web this is a negative `z-index` inside an
  isolated stacking context; the principle is that verified text contrast is
  never traded for an effect, and it is verified by comparing the label's own
  pixels with the layer on and off.
- **Never a new colour.** Shaders take their tint from the resolved palette. An
  optical layer may redistribute light; it may not introduce colour the token
  set did not sanction.
- **Off when the user has asked for less.** Reduced motion, reduced transparency
  and forced colours each disable the layer outright.


## 8. Ambient motion is deferred.

Crystal 2.0 ships no ambient motion, and a library must not invent any. Materials are
still at rest when nothing is happening to them; a surface that moves on its own is not
Crystal until a later version says how.

It was specified, built and measured, and then withdrawn at Meridian's direction. The
work is not lost — `proposals/crystal-2.0-requests.md` R17 through R21 carry the
specification, the measurements and the reasons — but nothing in this release depends on
it, and a platform implementing Crystal 2.0 has nothing to implement here.

Two findings from that work are worth carrying forward, because they will apply again:

- **A rest state has two failure modes, not one.** It can be too strong — a Resin lens
  pinned at full press deformation embossed every control — and it can be too weak, which
  measured 2 on a scale where the emboss measured 81 and was invisible to a person. Any
  future ambient tier needs a floor as well as a ceiling.
- **Cost is not where it looks.** On the reference preview, ambient surfaces halved the
  frame rate, and that survived every variable tested: canvas resolution, blend mode,
  nested backdrop-filters and shader complexity. The same shader on more surfaces in a
  standalone page cost nothing. Whatever the cause is, it is structural rather than a
  matter of tuning, and it should be understood before the tier returns.

Motion that a person starts is unaffected. So is §7: the optical layer still runs for the
duration of an interaction.



### Write `backdrop-filter` once

Write the unprefixed property and let the build add the alias. Never write
`-webkit-backdrop-filter` by hand beside it.

The pair does not survive a normal CSS pipeline. Autoprefixer emits the alias,
and a minifier that sees two declarations it believes are equivalent keeps one —
the prefixed one, because it comes first. Chromium does not implement the WebKit
alias, so the material loses its diffusion and nothing reports an error: no
warning, no failed build, no missing file. Frost and Resin simply render as flat
translucent fills.

Crystal React shipped like that from its first component until slice G. Every
screenshot taken in between shows a Crystal without its materials. Reproduced
through the real pipeline rather than inferred:

```
/* written as a pair */        -> -webkit-backdrop-filter: blur(40px) saturate(125%)
/* written unprefixed only */  -> -webkit-backdrop-filter: …; backdrop-filter: …
```

Autoprefixer alone does not do this; running it over the same declaration keeps
both. It is autoprefixer *followed by* a minifier that is fatal.

Crystal's own `assets/crystal.css` writes the pair, and correctly: the preview
ships hand-written CSS that nothing minifies, and dropping the alias there would
lose Safari. Do not read it as an example. A stylesheet that goes through a build
is a different problem from one that does not.

### What not to load

`@crystal-ui/core/css` and `@crystal-ui/core/theme` are for everyone: the reset, the
materials, the scroll contract, and the resolved token values.

**`assets/controls.css` is the preview site's own control layer, and it is not
exported.** `@crystal-ui/core/controls` used to resolve; it no longer does, and the
preview loads the file by relative path instead. There is nothing here for a
library to obey, which is the point — the prohibition it replaces was obeyed
right up until it wasn't.

What made it dangerous: the file styles bare elements. `:is(button, a.cr-button)`
gives every button in the document a Resin background, a feathered `::before` and
a 48px minimum height, and bare `input[type=checkbox]`, `[type=radio]`,
`[type=range]` and `[type=file]` are styled the same way. That is exactly right
for a page that writes `<button class="cr-control">` and exactly wrong underneath
a library that ships its own controls. Loading both is two implementations of
every control fighting, which is §1's drift with a stylesheet instead of a value.

Crystal React loaded it in its Storybook for one release. A 32px chip rendered
50px tall, and every story was validated against styles a consumer of that
package would never have had — which is the worse half: the components were
fine, the evidence was not.

The file sits in `@layer crystal.component`, so unlayered CSS outranks it for any
property a consumer declares. That was never sufficient. Nobody writes a
`::before` to cancel a `::before` they did not know was coming.

A library that wants the resolved values in CSS takes `@crystal-ui/core/resolver`
and publishes them onto its own scope, which is what the provider does.

---

## 9. Scrolling is part of the system, not the browser's business.

A team member opened the deployed preview on a phone and reported that the tables would
not scroll. They did scroll; the swipe chained into the page underneath, and nothing on
screen said the table was scrollable, because a phone's scrollbar is an overlay that is
not there until you are already scrolling. Both halves of that are Crystal's to own.

**Every scroll container owes four things:**

- `overscroll-behavior: contain`, so a swipe that reaches the end stays in the thing
  being swiped. This is invisible with a mouse, which is how it reaches a phone.
- A stable gutter **where it scrolls vertically**, so content does not jump when the
  scrollbar appears. `scrollbar-gutter` reserves the inline edge only; on a
  horizontal-only scroller it reserves space against a scrollbar that never arrives.
  A centred surface such as a dialog takes `stable both-edges`.
- A Crystal scrollbar rather than the operating system's.
- Something actually there to scroll. A container styled as scrollable with nothing to
  scroll is a container whose overflow is a mistake.

**There are two scrollbars, and which one a surface takes follows the hierarchy.** Frost
— the palette's ink — for panels, side navigation, reading surfaces and dialogs, because
Frost is the intermediate surface and its scrollbar belongs to the panel the way the
panel's own text does. Resin — the palette's primary — for control planes, menus,
popovers and compact or horizontal scrollers, because Resin is the floating control plane
and a scrollbar there is a control. A dialog takes the Frost one: a dialog is Haze over
Mirage, not Resin.

**The thumb is ink, never the material's own surface colour.** Crystal's first attempt
read "the scrollbar belongs to the material" literally and painted the thumb in the
material's surface: white at 62% over a white Frost panel, contrast ratio 1.00. Both
thumbs clear **3:1** against every Crystal surface in all six palettes and both modes.

**One mechanism per engine.** Where a platform offers both a standard scrollbar API and
an older vendor one, a library implements exactly one of them per engine. On the web,
Chromium 121 and later ignore every `::-webkit-scrollbar` pseudo-element on a container
whose `scrollbar-width` or `scrollbar-color` is non-`auto`, so writing both leaves the
vendor rules dead in the browser most people use and live in the one they do not — which
is §1's drift by another route.

**The edge fade says there is more.** A scroll area fades its content where there is
content beyond the edge, at `--cr-scroll-fade`, on the scrolling axis. It is a mask
rather than a painted overlay: what an overlay would have to paint is the surrounding
material, and a colour approximating a translucent material over an unknown backdrop is
wrong at every edge except the one it was sampled at. The same value is the container's
scroll padding, so a focus ring can never come to rest underneath the fade — Crystal does
not blur focus, and fading one is the same defect by another route. A mask fades the
element's own fill and border too, so it belongs on the element that scrolls; a material
surface that also scrolls puts its material on a wrapper.

**A scrollable region that holds nothing focusable must be a tab stop**, or its content
is unreachable by keyboard. One that already holds something focusable must not be: an
unnecessary tab stop is its own annoyance. A named one is a region; an unnamed one is
not, because a landmark without a name is noise in a screen reader's landmark list.

**Two limits worth stating rather than discovering.** Mobile emulation in a headless
browser uses overlay scrollbars, where a gutter is a no-op and no thumb is painted, so an
emulated phone verifies behaviour and not appearance. And headless Chromium paints no
scrollbar at all, so a reference frame cannot photograph one — what guards the appearance
is the contrast gate, across every palette and mode, not a screenshot of two of them.
