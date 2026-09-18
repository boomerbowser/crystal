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

**Closed by removing the vector rather than the rules.** `./controls` is no longer
in `package.json`'s `exports`: `@crystal/core/controls` does not resolve, and the
preview reaches the file by relative path. CONTRACT §9's prohibition is now
mechanical instead of advisory, which matters because a rule nothing enforces is
a rule somebody will break — and somebody did.

Scoping the selectors was the other option and is worse. Fifteen bare `<button>`
elements in `playground.html` and `motion.html` depend on them, as does every bare
`input[type=checkbox|radio|range|file]` in the preview, so scoping is a
frame-wide re-blessing bought for a hazard that `@layer crystal.component`
already half-mitigates — a consumer's unlayered CSS outranks the file for any
property they declare. Half, because nobody writes a `::before` to cancel a
`::before` they did not know was coming.

What remains is the preview's own reliance on bare-element styling, which is
hygiene rather than a consumer hazard, and is not worth a frame-wide change.

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

**Closed.** `.cr-scroll-x` — a modifier that clips the block axis and releases the
gutter, which is the treatment `.cr-table-scroll` already gets by exclusion, made
available to anything reaching for one of the three classes directly.

The part that matters is the gate. `verify-scroll` now fails any container that
scrolls across but not down while still holding a gutter, so forgetting the
modifier is caught rather than silently costing 12px. Proved by planting the
defect — `scrollbar-gutter: stable` on `.cr-table-scroll` — and watching seven
containers across two viewports fail.

The condition is deliberately "scrolls across and not down", not "does not scroll
down yet": a short list that may grow is exactly what the gutter is for, and such
a list does not scroll across, so it cannot reach the branch.

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

## D-4b · `crystal.css` writes both `backdrop-filter` forms too

Crystal's own stylesheet pairs `backdrop-filter` with `-webkit-backdrop-filter` on
every material. That is safe **here**, because this preview ships hand-written CSS
that nothing minifies — the pair survives and both browsers get what they need.

It was fatal in Crystal React, where the same pair went through autoprefixer and
esbuild's CSS minifier: the two collapsed to the prefixed form alone, and Chromium
does not understand the WebKit alias. Frost and Resin rendered with no diffusion
at all, in every story, until it was found.

`design-system/assets/crystal.css`. Nothing is broken today. It is listed because
the moment this stylesheet is put through any build — a bundler, a minifier, a
CDN that optimises CSS — it acquires the same defect silently, and because a
platform library reading it as an example will copy the pattern.

## D-6 · Neither repository had continuous integration

**Closed.** `.github/workflows/verify.yml` here and in Crystal React. Every step
is a script that already existed; what changes is that they run on a clean
checkout before a change lands, rather than when somebody remembers.

Crystal's has two jobs: the token, contract and documentation gates, and the
browser ones — which start `tools/serve.py` first, because the preview is
verified served and not opened from the filesystem.

One gate is new: **a build must not change a committed file.** Generated output
that has drifted from its source makes every check beneath it evidence about the
wrong thing. The `date` in `validation/token-checks.json` is exempt, since it
records when the evidence was produced; the rest of that file is held to the rule.

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
