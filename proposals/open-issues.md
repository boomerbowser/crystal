# Open issues — Crystal design system

Things noticed during Crystal 2.0 and the React library's implementation that are
deliberately not fixed yet. Each says what is wrong, why it matters, where it is,
and what closing it would take.

Nothing here is blocking. The two that were decisions for Meridian rather than
work — M-1 and M-2 — were answered on 18 September 2026 and are closed.

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

**Closed in the two halves it actually has.**

The lengths are `var()` references: the shell's maximum width and its three
gutters, the workbench's sidebar and the documentation column. All eighteen
frames are byte-identical afterwards, which is the point — the tokens were
derived from these numbers, so substituting them back changes nothing today and
means a token change reaches the preview tomorrow.

The breakpoints cannot be. `@media (max-width: 1150px)` will not take a custom
property, so they are checked instead: `core-contracts.cjs` fails any `@media`
width in `site.css` that is neither one of Crystal's four shell breakpoints nor
named in a short allowlist of component thresholds — the documentation shell's
own two, and the reference image strip's two. The allowlist is the point. Adding
to it is a decision somebody makes rather than a literal nobody notices. Proved
by moving 850 to 840 and watching the gate fail.

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

**Documented, not closable here.** Both are stated in `verify-scroll.mjs` and in
the capture README, where a reader meets them. Closing either needs hardware this
repository does not have: a real device, or a headless browser that paints
classic scrollbars. Left open deliberately rather than marked done.

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

**Closed as a rule rather than an edit.** Stripping `-webkit-backdrop-filter`
from this stylesheet would lose Safari, because nothing here runs autoprefixer to
put it back — the preview ships the CSS it is written in. The pair is correct
*here* and wrong in anything that builds, so what was needed was the distinction,
written where a library author looks: `libraries/CONTRACT.md`, "Write
`backdrop-filter` once", with the reproduction and an explicit note not to read
`crystal.css` as an example of it.

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

**Documented, not closable here.** The trade is written where somebody meeting it
would look — in `AppBar`'s own source, beside the passive scroll listener that
replaced the observer. It is a limitation of the preview browser, not a defect in
Crystal, and there is nothing here to repair.

## Decisions for Meridian

## M-1 · Should the preserved-source archive leave the repository?

Gather was removed from the design system's documentation and published site.
Four files remain in the repository as provenance: `reference/gather-*.md`,
`gather-crystal-recipes.json` and `provenance.json`. They are excluded from the
Vercel deployment by `.vercelignore`, so they are not published — but they are
still in the history and the working tree.

Removing them from the tree is a commit. Removing them from history is a rewrite,
which Meridian has given standing permission for when a reason is provided.

**Decided, 18 September 2026: the archive stays.** Meridian's answer is to keep
it. So there is nothing to remove from the tree and nothing to rewrite out of
history, and the four files stay where they are — excluded from the published
site by `.vercelignore` and present in the repository as provenance, which is
what they were kept for.

Closed.

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

**Reviewed and signed off in full, 18 September 2026.** Meridian has approved all
three families — spacing, breakpoints and layout — as Crystal tokens. They are
part of the system rather than provisional, and a platform library may rely on
them.

Closed.

## D-7 · The documentation build ran outside the gate that watches generated files

**Closed.**

`docs/materials.html` was stale for a commit — the markdown gained a section and
the published page did not — and neither gate could see it. `validate-docs.cjs`
reads the markdown and the tokens and never opens the HTML. The CI drift gate
runs `npm test`, and `npm test` built the tokens and the catalogue but not the
pages: comparing generated output against its source proves nothing for output
the build it runs never generates.

`npm test` and `npm run build` now run `tools/build.py`, the superset that
writes the tokens, the catalogue, the reference sections, the theme CSS and all
fourteen pages. The gate itself did not change; its reach grew to match its
name. Proved by reverting the page to the stale committed copy and running
`npm test`, which rewrote it.

The cost was one re-blessed baseline: restoring the paragraphs above the
Haze-in-Resin composition moved it a fraction of a pixel down the page, so every
glyph rasterised at a new sub-pixel offset. 17.8% of pixels differ and the two
images are the same picture. Recorded in
`validation/captures/2026-09-18-materials-page-rebuild/`, amplified difference
included.

## D-8 · A component token that never reaches the flat file is watched by nothing

**Severity: low today, and it is the shape of the problem rather than the size.**

The round-trip gate in `build-tokens.cjs` is the thing that makes a token value
hard to change by accident: it rebuilds the flat runtime file from the DTCG
source and fails if any value moved or disappeared. It compares flat against
flat. So it only ever sees a token that `flat.component` maps.

`component.indicator.*`, `component.action.*`, `component.card.radius` and
`component.focus.*` are not in that map. They reach a platform library through
`exports/crystal-tokens.{ts,swift,kt}` instead, which nothing compares against
anything. Removing `component.selection` this cycle proved it from the other
direction: two tokens vanished from the DTCG source and the gate printed
"Round trip verified: no token value changed."

That was the right outcome for a deliberate removal, and it would be the same
output for an accidental one.

**Closed by projecting the tier entire.** `flat.component` was a hand-written list
of the families the resolver happened to read; it is now a generic projection of
`tokens.component`, aliases dereferenced and dimensions unwrapped exactly as the
hand-written version did. Four families joined the flat file — `action`, `card`,
`focus` and `indicator` — announced by the gate as additions, with no value
changed and all eighteen frames identical. `assets/crystal.js` reads named keys,
so the generated theme CSS is byte-identical.

The alternative was gating the exports separately, and it is worse: a token no
runtime can read is a token somebody will write again by hand, which is the
divergence CONTRACT §1 exists to prevent.

Proved by planting two defects at once — deleting `component.focus.coreWidth`,
which the gate could not see before, and moving `component.chip.height` to 33px,
which it always could. Both failed the build in the same run.

## M-3 · The catalogue asks a tree for roles it cannot have

**A decision for Meridian. Nothing is broken; the catalogue line is.**

`tree-view` specifies `role=tree/treeitem/group`, and in the same entry
specifies "expand controls" in its anatomy and "indentation guides" in what
Crystal supplies. Those two requirements are not compatible.

A `treeitem` in the ARIA tree pattern is a **single navigable unit**. The whole
widget is one tab stop and the arrow keys move between items, which is what makes
a tree a tree — and it means an item must not contain independently focusable
widgets, because there is no key left to reach them with. A row with a disclosure
button in it has one.

`treegrid` is the pattern ARIA provides for exactly this case. Rows still carry
`aria-level`, `aria-expanded`, `aria-posinset` and `aria-setsize`; the arrow keys
still walk the visible rows; and the keyboard can additionally move into a row to
reach the control inside it. React Aria's `Tree` implements it, and implements
only it — the alternative in the same library, `NavigationTree`, is for a nested
set of links and drops selection entirely, which `tree-view` requires.

Crystal React ships the `treegrid`. Everything the catalogue asks for *by
behaviour* is present and verified: level, expansion, full arrow-key navigation,
selection by label weight. Only the role names differ.

**What Meridian decides:** whether the catalogue line becomes
`role=treegrid/row/gridcell`, or whether the disclosure comes out of the anatomy
so a plain `tree` becomes possible. The first is a documentation change and the
second is a design change, which is why it is not made here.

Left open, not closed.


## D-9 · Crystal exported one Resin shadow and rendered another

**Closed, with Meridian's approval to change whatever aesthetic parity needs.**

`--cr-shadow-float` is the exported token every platform library gets.
`controls.css` wrote its own copy of the same recipe, twice, and because the
preview loads it that copy is what the approved baseline shows. They disagreed on
rim depth, on the lower rim's colour, and on the elevation's colour and spread.

So a platform library that followed Crystal's tokens could not reproduce
Crystal's appearance, and the parity bar in `libraries/CONTRACT.md` could not be
met by following Crystal. It was Crystal React's material gate that found it,
after Meridian looked at that library's Storybook and said none of it looked like
Crystal.

This is D-1's hazard a second time. `controls.css` shaped the appearance that got
blessed and the exported surface said something else — the same file, for the
same reason, and the reason the export was withdrawn in the first place.

**One recipe now.** `controls.css` reads `var(--cr-shadow-float)` in both places,
and the token carries what each side had right: the blessed rims, and the
palette-tinted, elevation-responsive spread the literal never had. The
coefficients are the blessed distances over the default 125% elevation, so the
default renders what was approved and the elevation control — which did nothing
to a control's shadow before this — now moves it.

Twelve frames re-blessed, evidence in
`validation/captures/2026-09-19-one-resin-shadow/`. 1,788 contrast cases pass.

**What is still open is the shape of it.** `controls.css` holds eight more
hard-coded shadow literals — `#080b2426`, `#080b2433`, `#080b241c` and others —
each a value that does not tint with the palette and does not answer the
elevation control. They are preview-only, since the file is no longer exported,
so none of them can reach a platform library. But the two that just caused this
were preview-only too, right up until the baseline was captured from them.

## D-10 · `@crystal/core` is a folder inside a website, not a library

**Requested by Meridian, 19 September 2026. Recorded in detail; not started.**
**Severity: high. It is the common cause behind D-9, R-13 and R-14.**

### What it is today

`@crystal/core` version `2.0.0-alpha.1`, `"private": true`, published nowhere.
Its package root is `design-system/`, and that one directory is three things at
once:

- **The library.** `tokens/`, the resolver in `assets/crystal.js`, the headless
  core in `assets/core/`, `crystal.css`, `crystal-theme.css`, the icon set, the
  motion recipes, the catalogue, and the generated TypeScript, Swift and Kotlin
  exports. Sixteen export entry points. Two runtime dependencies, `gsap` and
  `motion`.
- **The documentation website.** `index.html`, `playground.html`, `motion.html`,
  eleven pages under `docs/`, and the scripts and stylesheets that drive them —
  `site.css`, `site.js`, `menu.js`, `docs.js`, `controls.css`, `controls.js`, the
  motion suite, the shaders.
- **The build and verification machinery.** `tools/`, `tests/`, `validation/`.

Vercel deploys it with `"outputDirectory": "design-system"`: the website *is* the
package directory, and `.vercelignore` exists to keep `tools/`, `src/` and
`package.json` out of the upload. Crystal React consumes it as
`file:../crystal-design-system/design-system` — a path on one contributor's disk.

### Why this is the shape of several defects rather than a preference

Every one of these is already in a tracker, and each is the same root cause seen
from a different angle.

**D-9 — the design system shipped one Resin shadow and rendered another.**
`controls.css` is website-only and unexported, and because the preview loads it,
it shaped the appearance that got *blessed* while `--cr-shadow-float` — the thing
every platform library actually receives — said something else. A library
following Crystal's own tokens could not reproduce Crystal's own appearance.
There is nothing structural stopping that recurring: eight more hard-coded shadow
literals remain in that file, and the only reason they are harmless today is that
no baseline has been captured from a composition that uses them.

**R-13 — Crystal React's materials had drifted and nothing compared them.**
Closing it needed a gate that renders the same material in two *running servers*
and diffs the computed style, because there is no artefact to compare against.
A library cannot ask "what is Crystal's Resin recipe?" — it can only ask a
browser what Crystal's website happened to paint.

**R-14 — a `file:` dependency, pre-bundled once and served stale for hours.**
Three investigations in one day. One began a wrong diagnosis of the theme
provider. One is what Meridian saw when they reported that Crystal's
specifications were absent from every component.

**There is no version contract.** Crystal React cannot say it targets Crystal
2.0.1; it resolves whatever is on the disk beside it. A change to a material
token reaches every library instantly and silently, with no range to pin, no
changelog entry to read and no way to stay on a known-good version while
upgrading deliberately.

**A consumer installs the documentation website.** `files` includes `docs/` — a
megabyte of generated HTML — and the whole 4.6MB of `assets/`, most of which is
the site: `site.css`, `menu.js`, `motion-suite.js`, the shader sources, the
fonts. A product that wants the token resolver downloads the specification pages.

**There is nothing for a non-JavaScript library to consume.** `libraries/` holds
`CONTRACT.md` and `parity.json` and no artefact. The Swift and Kotlin exports are
generated, and then they sit inside a package only npm can install. A Compose or
SwiftUI library has to copy them, which is the retyping CONTRACT §1 exists to
forbid.

### What Meridian asked for

1. `@crystal/core` becomes a **proper published library**, not a `file:` path.
2. It supplies **context and specifications to every Crystal component library**,
   not only the React one — so this class of drift stops recurring.
3. The **documentation website and its interactive previews** are updated to
   consume the new core, rather than being the same directory as it.
4. The **specifications** are updated to refer to the core library and to explain
   how it operates.
5. `@crystal/core` is **separated from the website's deployment repository**.
6. The steps only Meridian can take are **documented and raised with them** —
   see "What only Meridian can do", below.

### The shape this probably takes

Recorded as a starting point for a proposal, not as a decision.

**A package that is only the library.** Tokens in every generated form, the
resolver, the headless core, `crystal.css` and the generated theme, the icons,
the motion recipes, the catalogue and the parity manifest. No HTML, no `site.*`,
no `controls.*`, no `tools/`. The test of whether the boundary is right: *a
library that consumes this can render Crystal correctly with no browser and no
website.*

**`controls.css` is the boundary case and needs a decision.** It is the preview's
own stylesheet, it is not exported, and it shaped the blessed appearance. Either
its recipes belong in the library — in which case they stop being preview-only
and every literal in them has to become a token — or the baseline needs
re-capturing from compositions built only from exported surfaces. D-9 fixed the
one instance that had already bitten; the file is still the hazard.

**A specification artefact, not only prose.** What a Swift or Kotlin library can
consume is the reason this is not simply "publish the npm package". The
catalogue, the parity manifest, the token exports and the motion recipes are all
already data; they need to be published somewhere a non-npm toolchain can fetch
them and pin a version of them — a release asset, a second registry, or a
versioned URL. `libraries/CONTRACT.md` then cites the artefact rather than
describing it.

**Versioning against the contract.** The README already says Crystal follows
semantic versioning "against the public contract defined in the adoption
chapter". Once there is a published package that sentence becomes enforceable,
and the round-trip and material gates become the thing that decides whether a
change is a patch, a minor or a major.

**The website becomes a consumer.** It installs the library like any other
product and its interactive previews read the published resolver. That is the
structural fix for D-9: when the website can only reach what the library exports,
a preview-only stylesheet cannot shape a blessed appearance without becoming part
of the library first.

### What only Meridian can do

These are raised rather than done, because none of them is mine to decide or
authorise.

1. **Choose the package name and registry.** `@crystal` on the public npm
   registry is almost certainly taken by an unrelated project; the local pnpm
   store still holds a `@meridian/crystal` entry from an earlier attempt, which
   suggests this has already been considered once. The options are the public
   registry under a scope Meridian owns, GitHub Packages against the existing
   private repository, or a private registry. **This decision blocks everything
   else**, because it fixes the name every library imports.
2. **Create the repository, if the library is to live in its own.** Crystal React
   already needs a token to check Crystal out in CI; a third repository needs the
   same grant.
3. **Provision a publish token** as a repository secret, the way
   `CRYSTAL_HEAD_TOKEN` was provisioned. I will not handle the token value — the
   same rule as last time: I will give the exact `gh secret set` command and
   Meridian runs it.
4. **Decide whether the package is public or private.** It changes the registry,
   the token and whether the Swift and Kotlin artefacts can be fetched by a
   toolchain that cannot authenticate to npm.
5. **Update the Vercel project.** If the website moves, its root directory,
   output directory and build command all change, and the domain has to be
   pointed at the new project. If it stays, `outputDirectory` still changes,
   because `design-system/` will no longer be a servable directory.
6. **Decide the first published version.** `2.0.0-alpha.1` is the current
   `private` version and 2.0 is unreleased; whether the first publish is
   `2.0.0-alpha.2`, `2.0.0-rc.1` or `2.0.0` is a release decision.
7. **Confirm the deprecation path for `file:`.** Crystal React can move to a
   version range immediately after the first publish, but a range makes local
   development against an unpublished Crystal harder. A `pnpm` workspace or an
   overrides entry solves it; which one is a workflow preference.

### What closing it needs from me

A written proposal before any code, because this moves every consumer at once and
half of it is Meridian's decision. Then, in order: the package boundary and what
leaves it; the website converted to a consumer with its previews reading the
published resolver; the specifications rewritten to describe the core library and
how a platform library consumes it; the deployment separation; and a gate that a
released package contains no website.

Recorded in Crystal React's tracker as R-16, which is the same issue seen from
the consumer's side.
