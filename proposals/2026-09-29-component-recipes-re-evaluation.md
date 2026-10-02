# Component recipes: a re-evaluation

29 September 2026. This reviews the proposal of 28 September,
[`2026-09-28-component-recipes.md`](2026-09-28-component-recipes.md), against what
both projects look like one day and three releases later. It adds to that proposal
and changes nothing in it.

The baseline it was measured against:

| | |
|---|---|
| `@crystal-ui/core` | 2.3.1, published |
| Crystal React | `ad7ef5c`, depending on core `^2.3.0` |
| crystal-preview | on core 2.3.0, baselines captured again |
| Catalogue | 284 components, 23 surfaces, 59 motion recipes |
| Open issues | none in either tracker |

## 1. What held

**The surface vocabulary.** Every catalogue entry names its surface, and the
build refuses a surface with no recipe. Crystal React reads the vocabulary from
the package, carries each component's surface in its manifest, and has one
appearance check per surface that compares a component with an element wearing
the surface's class. The vocabulary grew by one entry, `group`, which Meridian
ruled on 29 September (D-26).

**The four recipes.** `.cr-bare`, `.cr-nav-item`, `.cr-drag-handle` and
`.cr-resin.panel` shipped in 2.2.0 and Crystal React wears them. Its local
`bare-control` mixin is gone. 80 of its component files now put a Crystal class
on an element, where 18 did.

**The status record.** `libraries/parity.json` reports 282 components implemented
on the web and 2 not applicable, merged from `libraries/status/web.json`.

**The three decisions.** Meridian ruled on each, and each ruling matched the
recommendation. D-19 adopted the three continuous recipes under the names the
proposal drafted. R-21 adopted `mark-in`, critically damped. D-21 deleted the
reset layer's hover.

**The two phases.** Crystal React's version guard failed on the day 2.2.0 was
installed, as it was written to, and phase B ran that day.

## 2. What the proposal got wrong

Eight things. Seven were found by Crystal React measuring what it rendered against
what the catalogue said, and one in review before release.

| What the proposal did | What measuring showed | Record |
|---|---|---|
| Assigned surfaces from each entry's prose. | Eleven were wrong. Tabs, the segmented control, the toolbar, the command bar, the action bar, the button group and the split button measure identical to `.cr-dock`, and were listed as `resin`. The resizable handle and the image comparison's thumb are `resin`, and were listed as `drag-handle`. The media controls are a pill. The rich text surface is a field. | D-23 |
| Lifted `.cr-nav-item` from the site's side menu as it rendered. | The catalogue specifies a dot on the current location, and the side menu drew none. | D-22 |
| Completed `motion` from the family table, on the assumption that an existing recipe applied to its family invents nothing. | Some assignments cannot be played by any implementation. `page-in` was added to four navigation entries that do not render the view. `slider-step` was added to three colour controls that have no readout. | D-28 |
| Said overlay exits needed `AnimatePresence` around React Aria's overlay lifecycle. | React Aria holds an exiting overlay until its animations settle. The exits needed no new structure. | R-24 |
| Recommended wearing `.cr-field-shell`. | Its boundary measures 1.06:1 in light mode and 1.63:1 in dark, against the 3:1 the accessibility chapter states for a control boundary. Meridian ruled that the rim is decorative. | D-24 |
| Listed `.cr-dialog` as the dialog surface for any element. | `position: fixed` centres a native `<dialog>` only. On React Aria's `section` the dialog opened off centre. | D-29 |
| Listed the tag-sized compact display for every badge. | A count badge rendered 55px tall. | D-27 |
| Wrote the three new recipes as lone classes. | The element coat outranks a lone class inside the same layer, so a bare button kept three of its five layers. | Caught in review, fixed before 2.2.0 |

Seven of the eight have one cause. The assignment was made by reading a
description and was not checked against a rendering. The specimen sheet showed
each recipe on its own and never showed a catalogue component wearing it, so it
could not have caught any of them.

The proposal's third assumption said that where the catalogue's prose disagreed
with the specification, the specification won. It should have said that the
rendering decides, and that prose and specification are both corrected to match
it.

## 3. Where things stand

**Motion.** 162 catalogue entries carry motion, with 329 assignments between
them. Crystal React's manifest credits 273 of those, and 129 entries play
everything they are assigned. 18 entries play nothing they are assigned. Six
recipes are credited to no component: `view-push-out` and the five material
compositions.

Crystal React's tracker gives a reason for most of the 56 unplayed assignments
(R-24). They fall into three groups.

| Group | Examples | What it needs |
|---|---|---|
| The component cannot play it | `list-out` on the tables and the transfer list, `accordion-out` on the three trees, `page-out` on master and detail | The same ruling D-28 gave: take the assignment off, or say what the component must grow. |
| A child plays it | `field-*` on the JSON input through the text area, `media-in` on the product gallery through the lightbox, `menu-in` on the menubar through its menus | The manifest's scan to credit composition. No catalogue change. |
| Nothing records why | `highlight` on the stat card and the KPI tile, `press` on the button group and the wishlist button, the blocks | A binding, or a reason. |

**Materials in Crystal React.** Hand-written `backdrop-filter` lines fell from 34
to 20. The mixins that remain are `haze-fill` (26 uses), `frost` (9), `resin` (4)
and `field.shell` (16, layout only). Each remaining use is either a surface the
component should wear or a composition the vocabulary lacks. Nobody has sorted
them into those two groups yet.

**Catalogue prose.** 27 entries name a material in `material` or `anatomy` that
their surface list does not contain. Some are inner fills the surface list
leaves out, such as the Haze rows of a menu. Some are stale: the anatomy of the
menu, the popover, the tooltip and the toast still says Resin, and their surface
is Frost.

**Documentation.** Crystal React has no documentation website. Slice Q of its
plan is not started. Storybook is the review surface.

## 4. What the proposal did not address

The brief asked for recipes "to keep Crystal consistent across platforms". The
vocabulary ties each surface to a CSS selector. A SwiftUI or Compose library
cannot wear a selector. It has to read `crystal.css` and work out which tokens
the recipe uses, which is the position Crystal React was in before 2.2.0.

Each surface needs its recipe as values as well: the fill token, the blur and
saturation, the rim, the shadow, the radius, the inset and feather of its reading
fill, and its three fallbacks. The stylesheet already resolves all of these from
tokens, so the values can be generated and checked against the stylesheet.

## 5. Recommendations

In order.

1. **Measure before assigning.** A surface or a motion assignment enters the
   catalogue only after a component wearing it has been compared with the
   surface's class in a browser. Crystal React's per-surface appearance check
   does this for the web. The rule belongs in `libraries/CONTRACT.md`, so the
   next platform inherits it.
2. **Publish each surface's recipe as values.** Add them to `surfaces.json`,
   generated from the tokens, with a contract test that the stylesheet resolves
   to the same values. This is what makes the vocabulary usable off the web.
3. **Check prose against surface in the build.** A material named in an entry's
   `material` or `anatomy` must belong to one of the entry's surfaces. 27 entries
   fail today. Correct the four stale anatomies first. For the rest, decide
   whether an entry's surface list includes its inner fills, and apply the answer
   to every entry.
4. **Put the first group of unplayed assignments to Meridian** as D-28 was:
   `list-out` on three entries, `accordion-out` on four, `page-out` on one,
   `list-in` on the combobox, `field-*` on the cascader.
5. **Credit composition in the React manifest**, so that an assignment a child
   plays is counted as played.
6. **Sort Crystal React's remaining hand-written material** into surfaces to wear
   and compositions to propose, by the same measurement as phase B.
7. **Start Crystal React's documentation site from the surfaces.** One page for
   each of the 23 surfaces, showing the recipe and every component made of it,
   is 23 pages that cover the material side of all 282 components.

## 6. What this re-evaluation did not do

It changed no recipe, no catalogue entry and no component. The counts in section
3 come from the catalogue at `0fe9eed` and from the manifest Crystal React built
on 29 September. The manifest credits a recipe to a component by scanning source,
so a recipe played through a child is counted as unplayed.
