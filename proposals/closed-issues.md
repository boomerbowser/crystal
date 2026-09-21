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

---

## D-11 · The library shipped a focus halo Meridian had withdrawn

**Found 2026-09-20. Fixed the same day.**

The focus halo's spreads were halved at Meridian's request — `2/6/12/22` to
`1/3/6/11`, blur radii deliberately unchanged so the ring thins without the
falloff flattening. The change was made in `website/assets/controls.css`, the
preview's own stylesheet, which overrides the library's.

So three things were true at once:

- **Crystal's site rendered the halved halo.** `controls.css` wins.
- **The specification documented the halved halo.** `build-reference.cjs`
  generates the focus-recipe table by reading `controls.css`, precisely so the
  table cannot be hand-transcribed and drift. It read the override.
- **The library shipped the withdrawn halo to every consumer.**
  `core/assets/crystal.js` still emitted `[[6,2,46],[16,6,30],[30,12,17],
  [54,22,8]]` into the exported theme, and the exported theme is what a consumer
  reads. Crystal React's focus ring has been visibly wider than Crystal's own
  for as long as that has been true.

Blur radii and alphas were identical throughout. Only the spread was behind,
which is why it survived: the ring was the right colour, the right softness and
the right shape, and simply too big.

**This is D-9 again.** D-9 was Crystal exporting one Resin shadow and rendering
another; the preview's stylesheet shaped the blessed appearance while the
exported token said something else. `verify-package.cjs` was built to stop the
preview's stylesheet *leaving the repository*. It cannot stop the preview's
stylesheet **overriding** the library inside it, which is the same failure
through a different door.

**Nothing caught it.** Crystal React's `verify-appearance`, `verify-theme` and
`verify-materials` were each run against the withdrawn value deliberately, and
all three passed. They assert that `--cr-focus-ring` is *defined* — the correct
check when the defect was that it was read by everything and defined by nothing,
and no check at all against a wrong number.

`tests/core-contracts.cjs` now compares the exported halo against the rendered
one, layer by layer, blur and spread. Reverting `crystal.js` turns it red with
the four pairs printed side by side.

**Still open, and Meridian's to decide:** the preview raises the feather's alpha
in dark mode (`56/38/22/11` against the library's `46/30/17/8`) to hold up
against a deep canvas. The library does not. Nobody has said which is correct,
so the contract compares geometry only and the divergence stands recorded rather
than frozen. Either the library should carry the dark-mode lift, or the preview
should stop applying it.

**A second divergence in the same property, found 20 September when the
repository split made it unavoidable.** `build-reference.cjs` generated the
focus-recipe table by reading the preview's `controls.css`. With the preview in
another repository it could not open the file at all, and reading the library's
own exported theme instead showed the table losing two rows:

| | halo layers | elevation layers |
|---|---|---|
| `controls.css`, which the site renders | 4 | 2 — `0 8px 18px` directional, `0 22px 40px` broad |
| the exported theme, which consumers read | 4 | none |

So a focused control in Crystal React gets the halo and **no elevation change at
all**, while a focused control on Crystal's own site lifts. Not a spread this
time — two whole layers.

**Three divergences are now named and none is decided:**

1. **The elevation layers.** Should `--cr-focus-ring` carry them, or is lifting
   on focus the site's own flourish? The prose in `components.md` described them
   as Crystal's behaviour, which is an argument that they are.
2. **The dark-mode feather alphas.** The site raises them to 56/38/22/11 against
   the library's 46/30/17/8, to hold the falloff against a deep canvas. The
   library does not.
3. **Everything else `controls.css` redefines — enumerated 21 September 2026.**
   It is smaller than feared in one direction and larger in the other.

   **Custom properties defined by both: three.** The library defines 142 across
   `crystal-theme.css` and `crystal.css`; `controls.css` defines 11; the
   intersection is `--cr-focus-core`, `--cr-focus-ring` and `--cr-outline`.

   | property | library | `controls.css` | verdict |
   |---|---|---|---|
   | `--cr-focus-core` | `#7338EF` / `#c8b1f9` | `var(--cr-primary)` | **not a divergence.** `--cr-primary` *is* `#7338EF` / `#c8b1f9`. Same value, spelled as a reference. Deleting it from the site changes nothing — unless a page sets `--cr-primary` locally, in which case the site's focus core follows it and the library's does not. |
   | `--cr-focus-ring` | four halo layers | the same four, **plus two elevation layers** | divergence (1) above. |
   | `--cr-outline` | `#624a9f` / `#bfa3f8`, globally | `var(--status-ink)`, **scoped to `.cr-status`** | **a third divergence, and new.** The library never narrows `--cr-outline` inside `.cr-status`. So a focused status chip outlines in its own status colour on Crystal's site, and in the generic outline colour in every consumer. `--status-ink` is the library's own property, set per `[data-status]`, so the site is not inventing a value — it is applying one the library defines and does not use here. |

   The other eight properties `controls.css` defines are its own and collide
   with nothing: `--cr-control-color`, `--cr-control-light`,
   `--cr-focus-feather-1` … `-4`, `--cr-focus-shadow`, `--cr-range-progress`.
   **Divergence (2) lives in those feather variables** — the library has no
   equivalent and inlines its alphas straight into `--cr-focus-ring`, which is
   why the dark-mode lift had nowhere to be compared.

   **The larger direction, and the first measurement of it was wrong.** An
   earlier pass here reported "50 declarations set by both, across 14 of
   Crystal's own classes". That number was produced by intersecting *class
   names* per stylesheet, which flattens every context: it counted a
   `@media (forced-colors: active)` override against a base rule, and
   `span.cr-status > span` against `.cr-status`. Its value-level companion
   claimed `.cr-button { background: Canvas !important }` and
   `.cr-status { border-radius: 50% }` were Crystal's, which they are not.
   **Do not use it.**

   Parsed properly with postcss, keying each declaration by its full context —
   enclosing at-rules, exact selector, property — the library sets 510
   declarations and `controls.css` sets 502, and **the number they share is
   zero**. Not one selector-and-property pair is set by both.

   That is not a clean bill of health; it relocates the question. `controls.css`
   wins by **cascade rather than by collision**: it styles compound selectors
   like `:is(button, a.cr-button, .cr-control, .cr-field-shell, …)` where the
   library styles a bare `.cr-button`, so the two never textually agree and the
   site's declaration still lands on the same element. A static diff cannot see
   that, and no amount of care with the parser will make it.

   **The only honest measure is computed style on a rendered element** — the
   same page with `controls.css` enabled and disabled, in both modes and with
   forced colours emulated, diffed over every element carrying a `cr-*` class.
   That is the experiment this item needs and it has not been run yet.

   **What to build once the values are compared**: the check this entry always
   wanted, in `tests/site-contracts.cjs` in crystal-preview — the site redefines
   no custom property and re-declares no material property the library already
   sets, with an explicit allow-list carrying a reason per entry. It cannot be
   written before (1) and (2) are decided, because it would freeze them.

Until (1) and (2) are decided, the contract compares geometry only and the first
four layers only. Freezing either divergence into a gate would be deciding it by
accident, which is how the spreads got out of step in the first place.

**Also fixed, 20 September:** the prose above the generated table still quoted
the withdrawn spreads — "46% at 6px blur / 2px spread, 30% at 16px / 6px …" —
long after the halo was halved, so the specification contradicted its own
generated table two lines below. `validate-docs.cjs` now requires every
blur/spread pair the theme exports to appear in that sentence, which turns red
four times over if the halo moves and the prose does not.

**Closed 21 September 2026. Meridian decided all three divergences the same
way: the library adopts, the preview does not drop.** Their reasoning is worth
keeping, because it generalises past this entry — the preview site *was* the
visual example Crystal's specifications were tested and measured against, so
where the two disagree the preview is the evidence and the library is the copy
that fell behind. Meridian also made it a standing rule for every component
library, not a ruling on this one.

**(1) The two elevation layers** are in `--cr-focus-ring`. It is six layers now:
the four-layer halo at 6/1, 16/3, 30/6, 54/11, then `0 8px 18px` directional and
`0 22px 40px` broad. The directional layer reuses the second feather so the lift
reads as the same light source; the broad one is `--cr-decorative` at 27% so the
shadow under a focused control carries the palette's shadow hue rather than
tinting the page.

**(2) The dark-mode lift** is carried: feather alphas 56/38/22/11 in dark against
46/30/17/8 in light, published as `--cr-focus-feather-1` … `-4` with
`--cr-focus-shadow` beside them. Naming them is half the fix — the divergence
could hide for as long as it did because the library baked its alphas into the
ring and there was no property to compare.

**(3) The third divergence was much larger than this entry thought, and two
earlier measurements of it were wrong.** The class-name intersection ("50
declarations across 14 classes") was withdrawn before the decision. Parsing both
stylesheets properly with postcss then showed *zero* shared
`(at-rule, selector, property)` keys — which was correct and still not the
answer, because `controls.css` wins by **cascade**, styling
`:is(button, a.cr-button, .cr-control, …)` where the library styles a bare
`.cr-button`. Measured where it can actually be measured — computed style on
rendered elements, both modes, `controls.css` on and off — the site changed
**246 distinct computed values across 13 Crystal-named classes**.

Five of those classes turned out not to exist in the library at all:
**`.cr-control`, `.cr-field-shell`, `.cr-indicator`, `.cr-resin-haze` and
`.cr-tag`**. `components.md` names them throughout — the indicator's 20px circle
with its 3px-inset 80% Haze fill, `.cr-resin-haze` as the composition small
display elements use — and instructed the reader to "use `assets/controls.css`",
a stylesheet the package has never contained. **The entire Resin interaction
surface was in that file**: the fill, the rim, the `::before` Haze layer, the
`::after` optical sheen, and the reduced-transparency and forced-colours
adaptations of all of it. So this was never only a focus halo. It is why
Crystal React had to rebuild the control surface in SCSS rather than consume it,
and it is D-9's root cause rather than another instance of it.

58 rules and 175 declarations were lifted into `assets/crystal.css` in
`@layer crystal.component` — the layer the preview used and the one the library's
own layer order already reserved. Selector lists were filtered to the Crystal
parts; the preview keeps its switches, segmented controls and range inputs.
`--cr-control-color` and `--cr-control-light` came with them, and
`.cr-status` now narrows `--cr-outline` to `var(--status-ink)` for the chip's
subtree. *(Corrected 21 September 2026: this entry said it made "a danger chip's
rim follow its status". It does not. `--cr-outline` is read by
`.cr-button.quiet`, `.cr-input`, `.cr-dialog`, the Frost/Resin border-color and
the two scrollbar rules, none of which can match inside a chip — every
`.cr-status` on the preview is a bare span holding an icon and a label — and the
chip's own rim comes from `--cr-rim`. The declaration renders nothing today. It
is kept because the preview carries it and a consumer may nest something that
reads it; it was described as a visible effect, and that was wrong.)*

**The adoption was verified by rendering, not by reading.** The site as it ships
— published 2.0.0 plus `controls.css` — against the site built on this library
with every lifted rule *removed* from `controls.css`: 10,534 computed values
compared across three pages in both modes, and six full-page screenshots with a
control focused so the halo and both lifts painted. **All six frames are
pixel-identical at zero tolerance.**

**That proof was sound and the conclusion drawn from it was too narrow.** It
compared the site with the lifted rules moved against the site with them in
place, and both sides kept `controls.css`. So it could show the lift was
*faithful* and could not show whether the lift was *complete* — whatever the
sheet still overrode, it overrode identically on both sides. A second pass
measured that directly, with the library fixed and the site's sheet as the only
variable, and found a great deal still there: a `.cr-table-scroll` carrying the
whole Resin surface over a library rule that gave it scrollbar colours and no
`overflow` at all; a `.cr-dock` as a Resin pill over a library rule that made it
a bare flex row; a status chip at 18px radius and 12px/18px padding over the
library's 9px and 5px/9px; and every native form control there is — checkbox,
radio, range, file button, select option, menu item — none of which the library
styled anywhere.

Classifying that residual by selector shape gave three different answers (29
declarations by subject, 151 by selector root, and still leaking: rules like
`:is(button[aria-pressed=true], …)` name no class at all yet the library claims
bare `button`). So the question was inverted to one that fails closed — a rule
is the preview's only if it names a class or id outside the `cr-` namespace —
and the partition it produces is generated rather than transcribed, so the two
sides cannot drift. **75 rules and 238 declarations** moved to the library, 50
stayed with the preview, 2 were dropped from both.

**Four things the second pass found that were not divergences but defects.**

- `.cr-button { padding: 10px 19px }` in `crystal.css`, against
  `component.action.paddingBlock: 15px` / `paddingInline: 24px` in
  `crystal.tokens.json`, `tokens.md`, crystal-react and the preview. The
  stylesheet matched nothing, including its own source of truth. `gap` was
  8px against a token of 9px. Nothing compared the hand-authored stylesheet to
  the token file — `build-tokens.cjs` and `build-reference.cjs` both read the
  tokens and neither reads `crystal.css` — so there was no gate to fail.
  `tests/core-contracts.cjs` now holds that comparison, and found the `gap`
  drift itself on its first run.
- `.cr-button.secondary`, `.quiet` and `.danger` carried fills from before the
  Resin surface existed. The component layer outranks the reset layer, so from
  the moment the surface was adopted all four button variants computed
  identically — measured, not inferred. For secondary and quiet that matches
  `components.md` ("same semantics as primary") and the fills were simply
  stale. For danger it deleted the "independent danger boundary" the same page
  requires, which is a regression the first pass introduced and did not notice.
  The boundary is restored in the component layer, where it wins.
- `.cr-dock button[aria-pressed=true]` drew an underline under a selected dock
  label. Selection is carried by label weight alone. It was already beaten by
  the preview's `text-decoration: none`, so it rendered nowhere and contradicted
  the specification everywhere it was read.
- The preview's `.cr-dock-inner` rule blanks `::before` for anything with that
  class, including `.cr-dock-inner.cr-stone` — the preview's own "Stone on
  Resin" specimen, which therefore renders with no Stone. That is filed, not
  adopted: `components.md` says `.cr-dock-inner` shares the Stone recipe and
  `materials.md` says a label on a Resin dock takes its own chip, and which of
  those two is right is Meridian's line to draw.

**How the second pass was checked.** Not by reading, and not only in the state
where nothing was adopted. `controls.css` was toggled on and off against a fixed
library across **16 pages x 7 states x 2 modes — 233,226 elements, every
longhand compared**: default, hover, keyboard focus, `[data-effects=opaque]`,
a 600px viewport, forced colours, and reduced transparency (Playwright exposes
`prefers-reduced-transparency`; it was asked, not assumed). **104 differences
remain on elements that belong to Crystal, and all 104 are accounted for**: 88
are the `.cr-dock-inner` exemption above and the geometry that cascades from it,
14 are `.export-controls .cr-button { padding-inline: 14px }` — the preview
placing a Crystal button inside its own furniture — and 2 are a `.cr-indicator`
inheriting `white-space: nowrap` from a `.tiny-button` around it. Both of those
were confirmed by reading the ancestor chain off the running page rather than
off the stylesheet.

**What changed on the preview, and it is exactly one thing.** The site as it
ships against the site on this library: every computed difference is either the
focus feather properties re-serialising (`color-mix(in srgb, #7338EF 46%,
transparent)` from the site's `:root` becoming `rgba(115, 56, 239, 0.46)` from
the library's theme — the same colour, inherited by all 1,134 elements, which is
why the raw count is 6,804), or one of two things that paint nothing: the
`gap` correction, which applies to thirteen `.cr-button`s that all have a single
child box, and a `text-underline-offset` left behind by the removed dock
underline, which never drew because the preview already set
`text-decoration: none` over it.

Five frames in both modes, with a control focused so the ring paints, then say
where the remaining pixels are: **one band, at the top left of every page, on
the focused skip link.** Its box, its rect and both its pseudo-elements are
identical. Its `box-shadow` is not:

```
shipped site   5 layers:  inset rim, then halo 6/16/30/54
this library   7 layers:  inset rim, then halo 6/16/30/54,
                          then 0 8px 18px and 0 22px 40px
```

**That is D-11's first divergence arriving.** Meridian's answer was to put the
two elevation layers in the library; the preview's `:root` override was what had
been holding them off, and removing that override is what makes them paint. The
only visible change this work makes to the documentation site is the change that
was asked for.

One thing that comparison caught and a stylesheet diff could not: written as
resolved `rgba()`, the sheen tints came back quantised to 8 bits — 0.126
serialising as 0.125 — for a worst channel delta of 2 across the playground.
`--cr-control-color` and `--cr-control-light` are therefore emitted as
`color-mix()`, which is also what keeps them tracking a product's overridden
`--cr-glow` and `--cr-decorative`. That is the only place this theme departs
from resolved values, and it is deliberate.

**Gates.** `tests/core-contracts.cjs` now holds the recipe: six layers with the
approved geometry in every mode, the feather alphas per mode, `--cr-focus-shadow`
at 27%, and the `var(--cr-focus-ring, …)` fallback in `crystal.css` matching the
exported theme. All three were proven by mutation. The earlier check compared
geometry only and the first four layers only, deliberately, so that running it
could not freeze an undecided divergence — that reason expired with the decision.
`tools/validate-docs.cjs` no longer skips the elevation layers with a bare
`continue`, and counts its own checks rather than declaring a total.

**Two corrections to this entry as it stood.** It claimed
`tests/core-contracts.cjs` compared the exported halo against the rendered one.
It did not — that check went to `crystal-preview/tests/site-contracts.cjs` with
the site in D-12 and this entry was never updated, so for a day the tracker named
a gate in a repository that did not have it. And the fix recorded on 20 September
was incomplete: `crystal.css` carried a `var(--cr-focus-ring, …)` fallback still
spelling the withdrawn spreads 2/6/12/22, because the fix went into the resolver
and nobody opened the stylesheet. A consumer loading `crystal.css` without the
generated theme got the withdrawn halo for a further day.

Shipped as **2.1.0** — new public custom properties and five components that were
specified but absent, which is a minor rather than a patch.

---

## D-13 · The visual regression gate is red, and nothing was watching it

**Found 2026-09-20. Not fixed — and deliberately not blessed.**

`npm run verify:floor` fails on nine of its frames:

```
catalogue.png                          3191 px differ, worst delta 229; 2626 visible (>24)
playground-dark.png                   48997 px differ, worst delta  52; 11358 visible (>24)
playground-light.png                  30077 px differ, worst delta  18; none visible
playground-narrow.png                  8189 px differ, worst delta  19; none visible
playground-opaque.png                 29857 px differ, worst delta  18; none visible
playground-reduced-transparency.png   29995 px differ, worst delta  18; none visible
playground-rtl.png                    30053 px differ, worst delta  18; none visible
components-light.png                    647 px differ, worst delta  11; none visible
motion.png                             1656 px differ, worst delta  15; none visible
```

**It is not the restructure and it is not D-11.** The suite was run twice against
the same server, once with the corrected focus halo and once with the withdrawn
one restored, and the failures are identical to the pixel — the only movement
was five pixels on `playground-opaque`, which is antialiasing noise. That is the
expected result: the halo paints on `:focus-visible` and no baseline frame has
anything focused. Whatever this is, it predates today.

**Why nobody knew.** `.github/workflows/verify.yml` runs the scroll, interaction
and deployability gates. It does not run `verify:visual` or `verify:floor`. The
visual gate is manual, and a manual gate is one nobody runs. It has been red for
an unknown length of time — the baselines were last *touched* on 2026-09-20 by
the folder move, which only relocated the files, so the last real capture is
older than that and the git history no longer distinguishes them.

**Two different problems are hiding in that list.** Seven frames differ by a
maximum channel delta under 20 with **no pixel past the visible threshold** —
sub-threshold drift, most likely rendering-environment difference, and the kind
of thing a pixel baseline captured on one machine always eventually reports on
another. Two frames — `catalogue` and `playground-dark` — have thousands of
*visibly* changed pixels and worst deltas of 229 and 52. Those are not
antialiasing. On `playground-light` the differences cluster in the right-hand
control panel rather than scattering along glyph edges, which is also not what
environment drift looks like.

**Do not bless these baselines to make the gate green.** Blessing is how a real
regression becomes the new reference, and at least two of these frames have not
been explained. The entry is here rather than a fix because deciding what the
`catalogue` and `playground-dark` differences *are* needs the two images looked
at side by side, and because if part of it is environment drift then the answer
is a tolerance or a pinned browser, not a re-capture.

**Where it lives now.** The baselines, the frame set and the whole visual gate
moved to **crystal-preview** with the site they photograph — `validation/baselines/`
and `tools/verify-frames.mjs` there. This repository has neither, which is why
this entry stays here rather than moving with them: the finding is about
Crystal's appearance, and the decision about what those two frames show is
Crystal's to make.

**What to do, in order:** pin the capture environment (browser version is the
obvious candidate) so the question can be asked reproducibly; look at
`catalogue` and `playground-dark` before and after; then decide per frame. And
wire whichever variant survives into crystal-preview's CI, which now has a
browser job and does not run this gate in it — the specific way this went
unnoticed is that it was never asked.

**Closed 21 September 2026. Each of the nine was looked at, which is what this
entry asked for and refused to skip.**

**`catalogue.png` — a real change, and correct.** All 2,626 visibly-changed
pixels fall in one 15px band at `y 461–475`, and the band is a single line of
prose: the chapter is generated from `core/tokens/catalogue/` where the baseline
says `tokens/catalogue/`. That is the restructure that moved the library into
`core/`. The worst channel delta of 229 is dark text on a light ground — which is
what a text change looks like, and is why "visibly different" was the right alarm
and the wrong conclusion.

**`playground-dark.png` — not a change.** 11,358 pixels past the threshold,
worst delta 52, **spread** across `x 404–1213, y 348–808` rather than clustered.
The two densest regions are the card-stack illustration behind the headline and
the segmented control; cropped and magnified, both are indistinguishable. Both
are multi-stop gradients on a near-black ground, which is where GPU rasterisation
dithers — and where a *fixed absolute* threshold of 24 corresponds to nothing
visible at all, because the same channel step that is obvious on a light field is
invisible at low luminance. The threshold is right for the other seventeen frames
and wrong for this one, so the frame was re-captured rather than the threshold
weakened for everything.

**The other seven** had no pixel past the threshold to begin with, worst deltas
11 to 19: the sub-threshold drift a pixel baseline captured on one machine always
eventually reports on another. This entry guessed that about seven of the nine
and was right.

**The entry's own instruction was followed in order.** Look at the two, decide
per frame, then wire the survivor into CI. What it did not anticipate is that the
proof the gate rests on had gone missing. `validation/baselines/README.md` and
`verify-frames.mjs` both cite `tests/visual-gate-contracts.py` as the reason the
400-pixel allowance is safe — "one black pixel on a grey field still fails with
the allowance set to a million" — and that file did not exist anywhere. It was
lost when the site moved to its own repository, so the safety argument for the
only gate that looks at Crystal's appearance rested on a test nobody could run.
It is restored, with four contracts, the fourth being the boundary itself: a
delta of 24 is forgiven and 25 is not, whatever the allowance says. Blessing
without that would have been blessing on an unbacked claim.

**And the gate is no longer manual**, which is the specific mechanism by which
this stayed red. It runs in `crystal-preview`'s browser job on every push, as
`verify:floor` — a runner has no GPU, so `--no-webgl` excludes the frames that
photograph WebGL output. That is a smaller gate than the one a person runs
locally and the largest this environment honestly supports. Blessing is refused
outright without WebGL2, so a green CI run can never quietly re-baseline
anything.

One thing worth knowing before reading a blessing commit's diff: `--bless`
re-captures the whole set rather than only the failing frames, so
`haze-in-resin.png` was replaced too and was never failing.
