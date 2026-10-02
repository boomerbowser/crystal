# Crystal platform library contract

This contract states what it means for a library to be "a Crystal library". It sets five requirements, so that five libraries do not drift into five design systems that share a colour.

Crystal is the base. A library implements Crystal for a platform; it does not fork the token or material definitions.

## 1. Consume generated tokens. Never redeclare a value.

The canonical source is `design-system/core/tokens/crystal.tokens.json`, a W3C DTCG file. Generated exports for TypeScript, Swift and Kotlin are emitted from it into `design-system/core/exports/`. A library imports those. A hard-coded `#7338EF`, `40px` or `1.95px` anywhere in a library is a defect, because it is a value that can no longer be changed centrally.

Derived values (elevation-scaled shadows, rgba composites, scaled motion durations) are computed, not stored. Reuse the resolver's arithmetic rather than reimplementing it, because two implementations of the same formula will diverge.

## 2. Implement all six materials with platform-appropriate techniques.

The six materials are Plastic → Frost → Resin, plus Haze, Stone and Mirage. The contract is their qualities, not the CSS recipe numbers: opacity, diffusion, colour transmission, perimeter definition, feathering, elevation and foreground clarity. The CSS recipe is an approximation and does not specify native optics, so a native renderer is not obliged to reach the same result the same way.

What must survive on every platform: the material order, visibly distinct material behaviour, contextual colour, optical rims, elevation, feathered Haze and Stone paint, and crisp foregrounds. Text, icons, hit areas and focus rings are never blurred.

## 3. Implement the full catalogue.

`parity.json` lists every component Crystal specifies, with per-platform status. A component present in one library is expected in the others, with the same states, semantics and token bindings. Parity is measured against Mantine, Ant Design and MUI, named per component in the catalogue so the claim is checkable.

Crystal specifies appearance. Products bring their own accessible primitives: focus management, menu keyboard behaviour, date arithmetic, rich-text engines. Do not rebuild complex behaviour to obtain a surface style. Wrap a maintained primitive and style it.

## 4. Preserve the behavioural contracts.

- **Focus** is a crisp 2px core at 3px offset inside a four-layer feathered halo. It is never delayed, never blurred and never replaced by a state badge.
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
parameterisation each platform exposes. Use it and do not re-derive it. Two
libraries that derive the same spring slightly differently have drifted, and
this contract exists to prevent that drift.

| Platform | API | Source of values |
|---|---|---|
| Web | Motion / GSAP spring, or `linear()` sampled from the core | `spring.stiffness`, `spring.damping`, `spring.mass` |
| Apple | `.spring(response:dampingFraction:)` | `spring.platform.swiftUI` |
| Android | `spring(dampingRatio:stiffness:)` | `spring.platform.compose` |

Three rules apply to it.

**Duration remains the authority.** Each spring is fitted to a reviewed
duration, and `tools/validate-motion.cjs` asserts the derived settling time
still matches within 15%. If you change one, change both.

**Damping expresses the material claim.** It is chosen by `signature`, not per
component: `inertia` overshoots about 12% because momentum is what it asserts,
and `feather` overshoots 0.1% because a soft edge that bounces is wrong. A
library that flattens every spring to one house curve has discarded the
signature system.

**Deformations conserve volume.** Every `scale(sx, sy)` satisfies `sx·sy = 1`.
A shape that loses area while deforming reads as rubber being crushed rather
than liquid moving. That defect was corrected in 2.0 across seventeen keyframes.
If your platform expresses deformation differently, preserve the invariant in
whatever syntax the platform uses.

## 7. Treat the optical layer as an enhancement.

`design-system/core/assets/shaders/manifest.json` is the portable artefact, and the
GLSL files are one implementation of it. Honour the uniform contract rather
than the GLSL source.

| Platform | Shading language | Notes |
|---|---|---|
| Web | GLSL ES 3.00 on WebGL2 | As authored |
| Apple | Metal Shading Language | Uniforms become one constant buffer, declared order preserved |
| Android | AGSL via `RuntimeShader` | GLSL-derived; bodies transfer with signature changes only |

Non-negotiable properties:

- **Never required.** Every material must render completely with no shader at
  all. Each entry declares a `degradesTo`. A platform that cannot meet the
  contract degrades as declared rather than approximating it differently,
  because a divergent approximation damages parity more than a declared absence
  does.
- **During a motion, and never at rest.** Shaders paint while a motion a person
  started is in flight, and on no surface that is doing nothing. The rule admits
  no ambient rest state, because ambient motion is withdrawn (§8). A reference
  frame photographs a surface at rest, and it is deterministic only because
  nothing paints there.
- **Never above content.** The optical layer belongs between a material's
  background and its content. On the web this is a negative `z-index` inside an
  isolated stacking context. Verified text contrast is never traded for an
  effect, and it is verified by comparing the label's own pixels with the layer
  on and off.
- **Never a new colour.** Shaders take their tint from the resolved palette. An
  optical layer may redistribute light; it may not introduce colour the token
  set did not sanction.
- **Off when the user has asked for less.** Reduced motion, reduced transparency
  and forced colours each disable the layer outright.


## 8. Ambient motion is deferred.

Crystal 2.0 ships no ambient motion, and a library must not invent any. Materials are
still at rest when nothing is happening to them. A surface that moves on its own is not
Crystal until a later version says how.

Ambient motion was specified, built and measured, and then withdrawn at Meridian's
direction. `proposals/crystal-2.0-requests.md` R17 through R21 carry the specification,
the measurements and the reasons. Nothing in this release depends on that work, and a
platform implementing Crystal 2.0 has nothing to implement here.

Two findings from that work will apply again:

- **A rest state has two failure modes.** It can be too strong: a Resin lens pinned at
  full press deformation embossed every control. It can be too weak: the weak state
  measured 2 on a scale where the emboss measured 81, and was invisible to a person. Any
  future ambient tier needs a floor as well as a ceiling.
- **The cost is structural.** On the reference preview, ambient surfaces halved the
  frame rate, and the loss remained under every variable tested: canvas resolution,
  blend mode, nested backdrop-filters and shader complexity. The same shader on more
  surfaces in a standalone page cost nothing. The cause is not identified. Tuning does
  not remove the cost, and the cause should be understood before the tier returns.

Motion that a person starts is unaffected. So is §7: the optical layer still runs for the
duration of an interaction.



### Write `backdrop-filter` once

Write the unprefixed property and let the build add the alias. Never write
`-webkit-backdrop-filter` by hand beside it.

The pair does not survive a normal CSS pipeline. Autoprefixer emits the alias,
and a minifier that sees two declarations it believes are equivalent keeps one:
the prefixed one, because it comes first. Chromium does not implement the WebKit
alias, so the material loses its diffusion. Nothing reports an error: there is
no warning, no failed build and no missing file. Frost and Resin render as flat
translucent fills.

Crystal React shipped in that state from its first component until slice G, and
every screenshot taken in that period shows a Crystal without its materials.
This output was reproduced through the real pipeline:

```
/* written as a pair */        -> -webkit-backdrop-filter: blur(40px) saturate(125%)
/* written unprefixed only */  -> -webkit-backdrop-filter: …; backdrop-filter: …
```

Autoprefixer alone does not do this: running it over the same declaration keeps
both. The unprefixed declaration is lost when a minifier runs after autoprefixer.

Crystal's own `assets/crystal.css` writes the pair, and that is correct there:
the preview ships hand-written CSS that nothing minifies, and dropping the alias
there would lose Safari. Do not read it as an example for a stylesheet that goes
through a build.

### What not to load

`@crystal-ui/core/css` and `@crystal-ui/core/theme` are for everyone: the reset, the
materials, the scroll contract, and the resolved token values.

**`assets/controls.css` is the preview site's own control layer, and it is not
exported.** `@crystal-ui/core/controls` no longer resolves, and the preview loads
the file by relative path. Removing the export replaces a prohibition on loading
the file, which was obeyed until it was broken, so a library has no rule to obey
here.

The file is dangerous to a library because it styles bare elements.
`:is(button, a.cr-button)` gives every button in the document a Resin
background, a feathered `::before` and a 48px minimum height, and bare
`input[type=checkbox]`, `[type=radio]`, `[type=range]` and `[type=file]` are
styled the same way. That is right for a page that writes
`<button class="cr-control">` and wrong underneath a library that ships its own
controls. Loading both puts two implementations of every control in conflict,
which is the drift §1 describes, with a stylesheet in place of a value.

Crystal React loaded it in its Storybook for one release. A 32px chip rendered
50px tall, and every story was validated against styles a consumer of that
package would never have had. The components were correct and the evidence for
them was not.

The file sits in `@layer crystal.component`, so unlayered CSS outranks it for any
property a consumer declares. That is not sufficient protection, because a
consumer does not write a `::before` to cancel a `::before` they do not know
about.

A library that wants the resolved values in CSS takes `@crystal-ui/core/resolver`
and publishes them onto its own scope, which is what the provider does.

---

## 9. Scrolling is part of the system.

On a phone, a swipe inside a scrollable table that does not meet this contract chains
into the page underneath. Nothing on screen says the table is scrollable, because a
phone's scrollbar is an overlay that is not there until you are already scrolling.
Crystal owns both problems.

**Every scroll container owes four things:**

- `overscroll-behavior: contain`, so a swipe that reaches the end stays in the thing
  being swiped. Its absence does not show with a mouse, so the defect is not caught
  before it reaches a phone.
- A stable gutter where it scrolls vertically, so content does not jump when the
  scrollbar appears. `scrollbar-gutter` reserves the inline edge only, so on a
  horizontal-only scroller it reserves space for a scrollbar that never appears.
  A centred surface such as a dialog takes `stable both-edges`.
- A Crystal scrollbar rather than the operating system's.
- Content to scroll. A container styled as scrollable with nothing to scroll has its
  overflow set by mistake.

**There are two scrollbars, and the material hierarchy decides which one a surface
takes.** The Frost scrollbar, in the palette's ink, is for panels, side navigation,
reading surfaces and dialogs, because Frost is the intermediate surface and its
scrollbar belongs to the panel the way the panel's own text does. The Resin scrollbar,
in the palette's primary, is for control planes, menus, popovers and compact or
horizontal scrollers, because Resin is the floating control plane and a scrollbar there
is a control. A dialog takes the Frost one, because a dialog is Haze over Mirage, not
Resin.

**The thumb is ink, never the material's own surface colour.** A thumb painted in the
material's surface, which is the literal reading of "the scrollbar belongs to the
material", is white at 62% over a white Frost panel, contrast ratio 1.00. Both thumbs
clear 3:1 against every Crystal surface in all six palettes and both modes.

**One mechanism per engine.** Where a platform offers both a standard scrollbar API and
an older vendor one, a library implements exactly one of them per engine. On the web,
Chromium 121 and later ignore every `::-webkit-scrollbar` pseudo-element on a container
whose `scrollbar-width` or `scrollbar-color` is non-`auto`, so writing both leaves the
vendor rules dead in the browser most people use and live in the one they do not. That
is the drift §1 describes.

**The edge fade says there is more.** A scroll area fades its content where there is
content beyond the edge, at `--cr-scroll-fade`, on the scrolling axis. It is a mask
rather than a painted overlay. An overlay would have to paint the surrounding material,
and a colour approximating a translucent material over an unknown backdrop is wrong at
every edge except the one it was sampled at. The same value is the container's scroll
padding, so a focus ring can never come to rest underneath the fade. Crystal does not
blur focus, and fading a focus ring is the same defect. A mask fades the element's own
fill and border too, so it belongs on the element that scrolls, and a material surface
that also scrolls puts its material on a wrapper.

**A scrollable region that holds nothing focusable must be a tab stop**, or its content
is unreachable by keyboard. One that already holds something focusable must not be,
because an unnecessary tab stop is an annoyance. A named one is a region; an unnamed one
is not, because a landmark without a name is noise in a screen reader's landmark list.

**Two limits on what a headless browser verifies.** Mobile emulation in a headless
browser uses overlay scrollbars, where a gutter is a no-op and no thumb is painted, so an
emulated phone verifies behaviour and not appearance. Headless Chromium paints no
scrollbar at all, so a reference frame cannot photograph one. The contrast gate guards
the appearance across every palette and mode, where a screenshot covers two of them.
