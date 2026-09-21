# Closed issues — Crystal design system

Everything here is done. It is kept rather than deleted because the reasoning is
referenced from the code it produced — `verify-package.cjs` cites D-9,
`crystal.js` cites D-11, `build-reference.cjs` cites D-11, `assemble-site.mjs`
and `AGENTS.md` cite D-12 — and because an entry that says *why* a rule exists
is what stops the rule being removed by someone who only sees its cost.

**Paths in these entries are as they were when each was written**, and the
repository has been rearranged twice since. `design-system/` no longer exists:
the library is `core/` here, and the documentation website is its own
repository, `crystal-preview`. Three checks moved with the site and are named in
their old homes below — the `site.css` breakpoint check and the focus-halo
comparison are in `tests/site-contracts.cjs` there, and the link, scroll,
interaction and visual gates are in its `tools/`. D-12 is the entry that
describes the move itself.

The live tracker is [`open-issues.md`](open-issues.md).

---

## D-1 · `controls.css` styles bare elements

**Severity: high for anyone consuming `@crystal-ui/core/controls`.**

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
in `package.json`'s `exports`: `@crystal-ui/core/controls` does not resolve, and the
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

**The remainder is now closed too.** `controls.css` held eleven more hard-coded
shadow literals — `#080b2426` ×4, `#080b2433` ×3, `#080b241c`, `#0002`, `#fffc`
and one `rgba(39,24,68,.15)`. Each was a fixed dark navy that does not tint with
the palette and does not answer the elevation control; they were preview-only,
but so were the two that caused this entry, right up until the baseline was
captured from them.

The resolver now exports the two inks the composed shadows are already built
from, `--cr-shadow-contact` and `--cr-shadow-cast`, so replacing a literal is a
substitution rather than an invention. Each was matched on alpha. Measured:
10,999 of 1,792,000 pixels differ, 0.6138%, worst channel delta 15 of 255, and
only on the controls that used a literal — the switch, the range, the checkbox,
the file button, the field shell's outer cast, the selected dock pill, the
indicator and the table hover. **The action buttons are pixel-identical**, which
is the check that this is the change it claims to be: they were already built
from `--cr-shadow-float`. Evidence in
`validation/captures/2026-09-19-shadow-ink-follows-the-palette/`.

Two literals remain and are a different question: `#ffffff30` and `#ffffff0a`,
the two white stops of the optical sheen gradient. They are highlight rather than
ink and they are white in every palette.

`validation/baselines/` has **not** been re-captured — the driver that walks
`frames.json` is still unwritten (crystal-2.0 plan, task 14), and those frames
were taken manually. Any frame showing a switch, a slider, a dock pill or a table
will differ by the amount above, and the capture README is the explanation that
belongs beside them when they are re-taken.

## D-10 · `@crystal-ui/core` is a folder inside a website, not a library

**Requested by Meridian, 19 September 2026.**
**Proposal written and the first two steps done, 19 September 2026. The rest is
sequenced behind an npm scope that does not exist yet — see "Where this stands".**
**Severity: high. It is the common cause behind D-9, R-13 and R-14.**

### What it is today

`@crystal-ui/core` version `2.0.0-alpha.1`, `"private": true`, published nowhere.
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

1. `@crystal-ui/core` becomes a **proper published library**, not a `file:` path.
2. It supplies **context and specifications to every Crystal component library**,
   not only the React one — so this class of drift stops recurring.
3. The **documentation website and its interactive previews** are updated to
   consume the new core, rather than being the same directory as it.
4. The **specifications** are updated to refer to the core library and to explain
   how it operates.
5. `@crystal-ui/core` is **separated from the website's deployment repository**.
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

### Answered by Meridian, 19 September 2026

Every open decision in this entry has been made. What follows replaces the list
of questions that stood here.

**1. Scope and registry: `@crystal-ui`, on the public npm registry.** Meridian had
verified a scope was free and had said so; this entry claimed it was "almost
certainly taken" anyway, which was a guess presented as near-fact. Worse, the
instruction was already recorded — Crystal React's `docs/requirements.md`,
18 September: *"There should be no @meridian/crystal. Crystal Design System
packages should be under the @crystal scope."* The `@meridian/crystal` entry in
the pnpm store, which this entry cited as evidence that the question had been
considered before, was the residue of the same mistake made once already.

**The check recorded here on 19 September was the wrong check**, and its
conclusion has since been overturned. What it asked was whether two *packages*
existed:

```
GET registry.npmjs.org/@crystal%2Fcore     404 {"error":"Not found"}
GET registry.npmjs.org/@crystal%2Freact    404 {"error":"Not found"}
GET registry.npmjs.org/-/v1/search?text=scope:crystal    total: 0
```

A 404 on `@crystal/core` proves that `@crystal/core` has never been published.
It proves nothing about the `@crystal` **scope**, because npm reserves scopes —
organisations and user scopes — independently of any package under them. A scope
can be held with nothing published in it, and then all three lines above still
read exactly as they do. The search line is no better: `scope:crystal` searches
published packages too. The check that answers the question is
`GET registry.npmjs.org/-/org/crystal` or `npm org ls crystal`, or simply
`https://www.npmjs.com/org/crystal` in a browser.

Meridian ran that check directly on 20 September: **`@crystal` is taken.** The
scope Meridian holds, and the one Crystal publishes under, is **`@crystal-ui`**.
Packages are `@crystal-ui/core` and `@crystal-ui/react`. The stale
`@meridian/crystal` name in `design-system/package-lock.json` is corrected.

This is the second npm-registry claim in this tracker that was wrong in the same
direction — an absence of evidence read as evidence of absence. The general form:
*a 404 answers only the exact question the URL asked.*

**2. The documentation and preview site gets its own repository: `crystal-preview`.**
Already created.

**3. `CRYSTAL_HEAD_TOKEN` is already set on `crystal-preview`** as a repository
secret holding a PAT.

**4. The `@crystal-ui/core` repository is `crystal`, and it is now public.**

**5. Meridian will re-base the Vercel project onto `crystal-preview`.**

**6. The first published version is `2.0.0`.** Not an alpha or a release
candidate — 2.0 ships as 2.0.0, and `2.0.0-alpha.1` is retired.

**7. Local development and publishing, left to this project's judgement,
"whichever is most conducive without introducing security vulnerabilities".**
The choice and its reasoning:

- **Consumers depend on a published range**, `"@crystal-ui/core": "^2.0.0"`. No
  `file:` and no `link:` in any committed manifest. A committed path is what
  produced R-14, and a package published while carrying one would ship a
  dependency that resolves to a directory on nobody else's machine.
- **Local work against an unpublished Crystal uses `pnpm link`**, which is a
  `node_modules` symlink rather than a copy — so an edit to Crystal is live, with
  no cache to clear, which is R-14's actual cure rather than its workaround
  (`optimizeDeps.force`). It is a working-copy state, never committed, and
  `pnpm unlink` returns to the published version.
- **Publishing uses npm Trusted Publishing (OIDC) from GitHub Actions, not a
  long-lived token.** This is the security answer: with OIDC there is no npm
  credential in the repository at all, so there is nothing to leak, rotate or
  scope. A granular automation token is the fallback only if trusted publishing
  cannot be enabled, and it would then want to be scoped to the single package
  with a short expiry.
- **`--provenance` on every publish**, which attests the tarball to the exact
  commit and workflow that built it. A consumer can then verify that the
  `@crystal-ui/core` they installed came from `boomerbowser/crystal` and not from
  someone who guessed a version number.
- **Owning the scope publicly is itself the mitigation for dependency
  confusion.** An unclaimed `@crystal-ui` scope with private libraries importing
  from it is the classic setup for that attack; publishing under a scope Meridian
  controls closes it.
- **Two release gates**, because both failure modes are silent: a published
  tarball must contain no `file:` or `link:` dependency, and must contain no
  website — no HTML, no `site.*`, no `controls.*`. The second is D-9's structural
  fix, since a preview-only stylesheet cannot shape a blessed appearance if it
  cannot leave the repository.

### What closing it needs from me

A written proposal before any code, because this moves every consumer at once and
half of it is Meridian's decision. Then, in order: the package boundary and what
leaves it; the website converted to a consumer with its previews reading the
published resolver; the specifications rewritten to describe the core library and
how a platform library consumes it; the deployment separation; and a gate that a
released package contains no website.

Recorded in Crystal React's tracker as R-16, which is the same issue seen from
the consumer's side.


### Where this stands, 19 September 2026

The proposal this entry asked for is
[`proposals/2026-09-19-crystal-core-as-a-library.md`](2026-09-19-crystal-core-as-a-library.md).
It answers the one decision this entry left open — what happens to
`controls.css` — and recommends promoting its *recipes* incrementally rather than
exporting or abandoning the file. R-15 is the worked example: one number became
`component.haze.inset`, `controls.css` reads the token, the Swift and Kotlin
exports picked it up for free, and the parity gate grew a `::before` comparison
that fails if a consumer stops painting it. Doing it in one sweep would mean
re-blessing every approved frame at once, which the change discipline exists to
prevent.

**Done, and reversible:**

- **The folders.** Requested again by Meridian on 19 September — *"separate the
  files that make up @crystal-ui/core from the preview website into different
  folders. That's part of what we meant originally."* `design-system/core/` is
  now the library and nothing else, with its own `package.json`; the rest of
  `design-system/` is the preview site and the machinery. A `files` array says
  what ships and stops nobody reaching across; a directory boundary does.

  `core/` sits **inside** the deploy root rather than beside it because Vercel
  serves `design-system/` as a static upload with no build step — a sibling
  folder would be unreachable and every page would 404 on the resolver. The
  site's own URLs are unchanged, and nothing about the published tarball moved:
  1,056 entries and 16 exports before and after.

  Two things surfaced that a path rewrite could not see. `tools/build-icons.cjs`
  built its output directory with `path.join(ROOT, 'assets/icons')`, so the first
  run after the move wrote 999 icons into a *second* directory and left the real
  one stale. And `gsap`/`motion` are `@crystal-ui/core`'s runtime contract but the
  preview's engine bundle is built from them, so both manifests must name them —
  `validate-motion.cjs` now treats `core/package.json` as the authority and fails
  if the workspace manifest or the lockfile disagrees, which turns a duplication
  into a checked invariant.

- **The boundary.** A published `@crystal-ui/core` was 2.18 MB across 1,097 files
  and **46% of it was the documentation website**. `files` now ships only the
  library: 1.2 MB, no HTML, no `site.*`, no `controls.*`, no preview motion
  suite, no `src/pages/`.
- **Version `2.0.0`, `private` removed**, and `publishConfig` corrected — it was
  still aimed at **GitHub Packages with `access: restricted`**, left from an
  earlier assumption, and would have published to the wrong registry entirely.
- **`tools/verify-package.cjs`**, in `npm test`, guarding three silent failures:
  a `file:` or `link:` dependency in a published manifest; a website in the
  tarball, which is this entry's structural fix; and an `exports` entry naming a
  file `files` does not ship, which fails at the *consumer's* build. Each proven
  to bite by planting it.
- **`.github/workflows/publish.yml`**: tag-triggered, npm Trusted Publishing so
  no credential exists in the repository at all, and `--provenance`. It also
  builds `crystal-spec-<version>.zip` as a release asset — the DTCG source, the
  flat tokens, the catalogue, the motion recipes, all three token exports,
  `parity.json` and `CONTRACT.md` — which is the half npm cannot carry, and the
  reason this is not simply "publish the package". A SwiftUI or Compose library
  cannot install one.

**Not done, and why.** Steps 3 to 6 of the proposal — the specifications
rewritten around the core library, the website converted to a consumer, the
repository split, and Crystal React moving to `"@crystal-ui/core": "^2.0.0"` — are
all gated on the `@crystal-ui` scope existing on npm and something having been
published to it. Committing a range that points at a version nobody can install
is worse than an honest `file:` path, so the path stays until then.

The repository split is also the one step that writes to `crystal-preview`, and
this session has never pushed to that remote. The commands are in §7 of the
proposal rather than run.

**What only Meridian can do** is §6 of the proposal: publish under the `@crystal-ui` scope,
enable Trusted Publishing for `boomerbowser/crystal` and
`.github/workflows/publish.yml`, push the website to `crystal-preview`, and
re-base the Vercel project. `CRYSTAL_HEAD_TOKEN` and the public `crystal`
repository are already in place and need nothing further.

---

## D-12 · Separating the library from the website, and what is left of it

**Done 2026-09-20.** `design-system/` is gone. `core/` is the library and
`website/` is the documentation site, as two folders at the repository root with
neither inside the other; `tools/`, `tests/` and `validation/` are machinery
belonging to neither.

**How the website reaches the library.** A browser cannot follow `../core/` out
of a deployed site, so `tools/assemble-site.mjs` copies the library into
`website/vendor/@crystal-ui/core/`, which is gitignored. That path is shaped
like `node_modules/@crystal-ui/core/` and **stays** — a static deployment
uploads `website/` and `node_modules` is not inside it. What changes when the
library is published is where the copy is read from, one constant in that
script.

Vercel therefore has a build command where it had none:
`node tools/assemble-site.mjs`, with `outputDirectory: "website"`. It is Node
built-ins only and takes no arguments, because `installCommand` is empty and
anything it needed installed would have to be installed there too.

**The specification ships in the package.** `core/docs/` holds the eleven
specification pages and `@crystal-ui/core/docs/*` exports them; the website
renders the copy it installed. Before this, `build-reference.cjs` — a library
generator reading the library's own token files — wrote into the website's
folder, which stops working entirely the day these are two repositories.

**Four defects the move exposed, none of them caused by it:**

1. `build-tokens.cjs` wrote the language exports to a bare `exports/` beside the
   tools rather than into the library. The package shipped one copy while every
   build refreshed another that nobody installed. They were still byte-identical
   apart from a header — a fork caught before it diverged.
2. `"./shaders/"` resolved for nothing. See the `verify-package.cjs` note below.
3. Both GitHub workflows still ran in `design-system/` after it ceased to exist,
   and had been pushed that way. `publish.yml` would have failed at `npm ci`, on
   a tag, in front of whoever cut it.
4. The browser job never built, so it served a site with no library in it — and
   what it reported was fifty-four scroll containers announcing
   `scrollbar-color: auto`, the exact shape of a deliberate regression in the
   scroll contract. `serve.py` now refuses to start without the library rather
   than serving a convincing ruin.

**`verify-package.cjs` had a rule for (2) and did not catch it.** It asked
whether the files were in the tarball. They all were. Shipping a file and
exporting it are different properties, and only the second is the one a consumer
depends on; it now resolves every subpath from a sandbox where the package sits
at its published name, and checks that what resolved is also shipped.

**What remains — the repository split.** `crystal-preview` exists, is
initialised and is connected to `/home/oshun/Development/Proposals/crystal-preview`.
The website has not been moved into it, and the move cannot simply be pushed,
because of an ordering constraint worth stating plainly:

> Vercel currently builds the site from the `crystal` repository. The moment
> `website/` is removed from `crystal` and pushed, the site is down — and
> `crystal-preview` cannot take over until `@crystal-ui/core` is installable,
> because a preview repository consuming the library by
> `file:../crystal-design-system/core` resolves to nothing on Vercel.

So the order is: publish `2.0.0` → push `crystal-preview` → re-base the Vercel
project onto it → *then* remove `website/` from `crystal`. Only the last step is
reversible cheaply, and only the first two are Meridian's alone.

**Also unresolved by the split:** `tools/` divides cleanly enough — the token,
catalogue, reference and icon builds and `verify-package.cjs` are the library's;
the page build, `shell.py`, `report.py`, `validate.py`, `serve.py` and the
browser gates are the website's — but three validators (`validate-tokens.cjs`,
`validate-motion.cjs`, `validate-docs.cjs`) check the library and write their
records into the website. They belong with the website, which is where the
records are published from; gating the library on its own side is a separate
piece of work. And `build.py` is two scripts in one: a library build and a site
render, currently sharing a file.

**One more, named rather than fixed:** Crystal React's material-parity gate
serves Crystal's preview from `../crystal-design-system/tools/serve.py`. After
the split that is a third checkout, and the gate needs to say so.

---

---

## D-14 · The documentation site's first deployment was blocked before it built

**Found 20 September 2026. Not fixable from here.**

The Vercel project was re-based onto `crystal-preview` and the first push to that
repository produced deployment `dpl_6KYJdLjbo8gxZX8ZULTHzb3dHfjH`, in state
**`BLOCKED`**. It never built: `createdAt`, `buildingAt` and `ready` are the same
instant, and the deployment has no build logs at all — the API returns
`not_found` for them, because there was no build.

Vercel's own error link on the deployment points at
`vercel.com/docs/deployments/troubleshoot-project-collaboration#account-configuration`,
which is the account-configuration section. This is a state the Vercel account is
in, not something the repository did: the commit is fine, CI on that commit is
green in both jobs, and the same configuration built successfully three times
from the `crystal` repository earlier the same day.

**Only Meridian can clear it**, from the Vercel dashboard. Until it is cleared
the published site is whatever the last `READY` deployment served, which is
`dpl_DawzarTyBmjXL4bMXjaCjqkfBB3b` — built from the **`crystal`** repository,
from commit `85c9c06`, and therefore from a copy of the website that no longer
exists in that repository. The live site is a snapshot of a deleted directory.
Nothing is broken for a reader, and nothing will update either.

**Unrelated and worth not confusing with it:** the project has Vercel
Authentication turned on, so every URL answers `302` to `vercel.com/sso-api`
for an unauthenticated request. That is deployment protection working as
configured, not a failure, and it is why the site cannot be checked with `curl`
from outside. It was left alone.

**What to check once it is cleared**, because it has never been exercised: the
build command is `node tools/assemble-site.mjs` and `installCommand` is
`npm ci --omit=dev`, so the deployment is the first thing that will prove the
library is installed from npm and copied into the site by the build rather than
found on disk. A `404` on `/vendor/@crystal-ui/core/assets/crystal.css` means the
build did not run; every page would render unstyled.

**Closed 21 September 2026 — cleared by Meridian, and the deployment it had
never exercised has now run.**

Meridian fixed the account-level git configuration and asked for a commit to be
pushed to `crystal-preview`. Deployment `dpl_49kwxpdt4qqmWCwgqv9y3gbw8YMt`, from
`crystal-preview@9fc6bf9`, is **`READY`** — the first production deployment ever
built from that repository, and the first built from the published package
rather than from a copy of the website on disk.

**What `READY` proves, and it is the thing this entry was waiting for.**
`vercel.json` sets `installCommand: "npm ci --omit=dev"` and
`buildCommand: "node tools/assemble-site.mjs"`, and that script exits `1` both
when it can find no library (neither `node_modules/@crystal-ui/core` nor a
sibling `core/`) and when any of `assets`, `tokens`, `licenses`, `docs` is
missing from the one it found. Vercel fails a deployment whose build command
exits non-zero. So a `READY` state is only reachable if `@crystal-ui/core@^2.0.0`
was installed **from the registry** — there is no sibling checkout on a Vercel
builder — and then copied into `website/vendor/@crystal-ui/core/`. The loop the
restructure was for is closed: the site is a consumer of the package.

**What it does not prove, stated because the distinction is the point of the
check.** This is evidence the file was *produced by the build*, not that it is
*served at that URL*. The remaining half —

```
/vendor/@crystal-ui/core/assets/crystal.css
```

— cannot be fetched from here: the API token can list deployments but is refused
on both build logs and deployment files, and the project's Vercel Authentication
answers `302` to `vercel.com/sso-api` for anything unauthenticated. A signed-in
browser is the only place left to confirm it, and a `404` there would still mean
the build did not run. Worth one look.

The blocked deployment `dpl_6KYJdLjbo8gxZX8ZULTHzb3dHfjH` remains in the
project's history in state `BLOCKED`. It is inert.
