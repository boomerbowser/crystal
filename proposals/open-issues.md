# Open issues — Crystal design system

Things noticed during Crystal 2.0 and the React library's implementation that are
deliberately not fixed yet. Each says what is wrong, why it matters, where it is,
and what closing it would take.

Nothing here is blocking. Two of them are decisions for Meridian rather than work.

---

## D-1 · `controls.css` styles bare elements

**Severity: high for anyone consuming `@crystal/core/controls`.**

`:is(button, a.cr-button)` gives **every** `button` in the document a Resin
background, a feathered `::before` and a 48px minimum height. That is correct for
this preview, which writes `<button class="cr-control">` throughout and relies on
the bare selector to avoid repeating the class. It is wrong for any document that
also has buttons of its own.

Crystal React loaded it in its Storybook for one release and every story was
rendered against it: a 32px chip drew 50px tall, and the visual evidence for every
slice was taken against styles a consumer would never have had. That is now
forbidden in `libraries/CONTRACT.md` and warned about at the top of the file, so
the hazard is documented — but it is still a loaded gun in a published export.

`design-system/assets/controls.css`. Scoping the selectors to `.cr-control` and
`.cr-button` would remove the hazard and would change how every bare `<button>` in
the preview renders, which is a visual change across most frames. Worth doing
deliberately with the frames re-blessed, not as a side effect.

## D-2 · A horizontal `.cr-scroll-resin` still reserves a gutter it cannot use

`.cr-scroll-resin` carries `scrollbar-gutter: stable` because most Resin scrollers
are vertical. A horizontal one — which the documentation explicitly recommends it
for — sets `overflow-x: auto`, which makes `overflow-y` compute to `auto`, so the
browser reserves 12px at the inline edge for a vertical scrollbar that can never
appear.

`.cr-table-scroll` avoids this by being excluded from the gutter rule, and Crystal
React's `ScrollArea` avoids it with `overflow-y: hidden` on its horizontal axis.
A product that reaches for the class directly gets neither.

`design-system/assets/crystal.css`. Either document the pairing as a requirement
or split the class in two.

## D-3 · The preview's own layout is not on its own tokens

Crystal now has a spacing scale, breakpoints, a shell width and a reading column —
all of them named from values `assets/site.css` already used. The stylesheet still
holds the literals: `max-width: 920px`, `max-width: 1536px`, `@media (max-width:
1150px)` and about forty others.

Nothing is broken and nothing can drift *yet*, because the tokens were derived
from these numbers. They will drift the first time a token changes and the
stylesheet does not, and the preview is the thing the tokens are checked against.

`design-system/assets/site.css`. A mechanical replacement, but it touches every
frame, so it wants its own change and its own re-blessing.

## D-4 · Two gates cannot see what they are named for

Both are stated in the source and in the capture README, so neither is a hidden
assumption — but neither is closed.

- **Scrollbar appearance has no visual gate.** Headless Chromium paints no
  scrollbar at all, so no reference frame contains one. What guards the two
  scrollbars is the contrast gate, across twelve palette-and-mode combinations —
  stronger than a screenshot in one respect and blind to geometry in another.
- **The phone leg of `verify-scroll` proves behaviour, not appearance.**
  Playwright's mobile emulation uses overlay scrollbars, where `scrollbar-gutter`
  is a no-op. What it proves is that swipes stop chaining.

`design-system/tools/verify-scroll.mjs`. Closing either needs a real device or a
browser that paints classic scrollbars headlessly.

## D-5 · `IntersectionObserver` delivers nothing in the preview browser

While building Crystal React's `AppBar`, an `IntersectionObserver` created in the
in-app preview browser never fired — not even its initial callback, on a target
with real area and an explicit root. A freshly constructed observer in the page
console behaved the same way.

That may be an environment limitation rather than a browser one, but it means any
Crystal work that relies on `IntersectionObserver` cannot be verified where the
rest of the visual work is verified. `AppBar` uses a passive scroll listener
instead and says why in its source.

Worth knowing before `animate-on-scroll` or a virtualiser is reviewed the same way.

---

## Decisions for Meridian

## M-1 · Should the preserved-source archive leave the repository?

Gather was removed from the design system's documentation and published site.
Four files remain in the repository as provenance: `reference/gather-*.md`,
`gather-crystal-recipes.json` and `provenance.json`. They are excluded from the
Vercel deployment by `.vercelignore`, so they are not published — but they are
still in the history and the working tree.

Removing them from the tree is a commit. Removing them from history is a rewrite,
which Meridian has given standing permission for when a reason is provided.

**No action until Meridian says which.**

## M-2 · The spacing scale, breakpoints and type scale were added without review

Three token families entered Crystal because the component tiers could not be
built without them, and because the catalogue already assigns each to Crystal:
"the spacing scale", "breakpoint behaviour", the reading rhythm's steps.

Every value is one the preview already used — the scale is the 4px rhythm tied to
the 16/24 reading rhythm, the breakpoints are where the shell already changes, the
type scale's ratios were lifted from the React library and made portable. So
nothing changed appearance. But naming a value is a design decision even when the
number is not new, and these were made mid-slice rather than proposed.

Recorded so they can be reviewed as a set rather than found one at a time.
