# One shell, one side menu, and the documentation as the index

Meridian asked for four things: the documentation home to become the index page, the
navigation bar to become a side menu built from Crystal's own buttons, the Playground to be
reformatted in line with the documentation and to link directly into it, and the
specification pages to carry every relevant detail with explanations and examples.

Nine baselines were re-blessed and five new frames were added. Everything here is a
deliberate change; none of it is a material regression.

## Why the baselines moved

**The page shell existed in four copies.** `tools/build.py`, `tools/report.py`,
`index.html` and `motion.html` each carried their own header and navigation. They had
drifted: the top navigation pointed at `index.html#foundations` and `index.html#components`,
anchors that exist only on the Playground, so from any specification page half the
navigation was a jump to a different page's interior. The shell now lives only in
`tools/shell.py`, and `grep -rl site-nav` across the built site returns nothing.

**Nine frames moved from `index.html` to `playground.html`.** The Playground is no longer
the index; the documentation overview is. The frames themselves are unchanged in intent —
same anchors, same axes, same reasons — they simply follow the page to its new address.

**The rendered difference is the navigation.** Roughly 37% of pixels differ on the
Playground frames. That is the top navigation bar being replaced by a 236px side menu and
the content reflowing to the remaining width. The workbench, the inspector, the material
studies and the dock are unchanged.

## The material decision inside the menu

`.cr-control` is **Resin** by default — `background: var(--cr-resin-fill)` plus the
elevation shadow, an optical sheen on `::after` and an 80% Haze protective fill on
`::before`. That is correct for a floating action and wrong for navigation.

Resin is specified as the front layer, reserved for surfaces that float above everything.
A persistent sidebar entry is furniture, not a floating object, and thirteen Resin capsules
in a column is precisely the stacked-translucency noise the hierarchy exists to prevent.
The menu is therefore **Frost holding Plastic pills**: the pill geometry of `.cr-control` is
kept, and only the material is changed.

Worth recording: `npm run audit:materials` passed on the Resin version too, because Resin
inside Frost is the intended hierarchy. The audit catches *illegal* nesting; it cannot
catch *inappropriate* nesting. That judgment is not automatable and was made deliberately.

The overrides live in `@layer crystal.override` rather than `crystal.base`. `.cr-control`
is declared in `crystal.component`, and a base-layer rule cannot win against it whatever
its specificity — which is the point of layers, and the reason the block is separate
rather than merely later in the file.

## A regression caught during the work

The first version of the menu set `box-shadow: none` to remove Resin's elevation. Crystal's
focus recipe is a crisp 2px primary core at 3px offset **inside a four-layer feathered
halo**, and that halo is a box-shadow — so the blanket reset silently reduced focus on every
menu entry to a bare outline.

Corrected to `.menu-item:not(:focus-visible){ box-shadow:none }`. Verified by tabbing to a
menu entry in a real browser and reading the computed value: the inset rim, the four
feathered primary layers at 6/2, 16/6, 30/12 and 54/22, and the two elevation layers are all
present. Specifications may be improved, never regressed.

## New frames

The shell was new and entirely unguarded. Five frames were added:

| Frame | What it guards |
| --- | --- |
| `overview-light` | The new index page, the Frost menu panel, and the live material specimens |
| `overview-dark` | Frost and the rail resolve differently in dark; the only place all three materials appear together |
| `docs-menu-light` | A specification page with a current entry — the selection rail, and that entries stay Plastic |
| `docs-menu-forced-colours` | Selection as a `Highlight` ring rather than a fill |
| `docs-menu-narrow` | Below 860px the menu collapses behind its toggle, which must still reach 44px |

`docs-menu-forced-colours` is the important one. A filled current entry is erased by
Chromium's opaque `Canvas` text backplate — the same defect already fixed on the segmented
control. Without a frame, that fix was protected by nothing but the comment beside it.

## The audit stopped listing pages

`tools/audit-materials.mjs` held a hand-maintained list of thirteen pages. It had gone stale:
`playground.html` — the richest composition on the site, and the one most likely to violate
the stacking rule — was not in it, and neither was the generated token reference. The list is
now discovered from the filesystem, the same way `tools/validate.py` finds pages. Fifteen
pages checked, zero violations.

## Checks after the change

- `npm test` — 27 headless core contracts, 1,716 contrast cases with 0 failures, 54 recipes, 5 visual-gate contracts
- `tools/validate.py` — 16 pages, 631 local links and assets, 1,011 icons, 0 errors
- `npm run audit:materials` — 15 pages, 0 violations
- `npm run verify:visual` — 17 frames against re-blessed baselines
