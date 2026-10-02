# Closed issues: Crystal design system

Everything here is done. The entries are kept because the code they produced
cites their reasoning: `verify-package.cjs` cites D-9, `crystal.js` cites D-11,
`build-reference.cjs` cites D-11, and `assemble-site.mjs` and `AGENTS.md` cite
D-12. An entry that says why a rule exists also stops the rule being removed by
someone who sees only its cost.

**Paths in these entries are as they were when each was written**, and the
repository has been rearranged twice since. `design-system/` no longer exists:
the library is `core/` here, and the documentation website is its own
repository, `crystal-preview`. Three checks moved with the site and are named in
their old homes below. The `site.css` breakpoint check and the focus-halo
comparison are in `tests/site-contracts.cjs` there, and the link, scroll,
interaction and visual gates are in its `tools/`. D-12 describes the move.

The live tracker is [`open-issues.md`](open-issues.md).

---

## D-1 · `controls.css` styles bare elements

**Severity: high for anyone consuming `@crystal-ui/core/controls`.**

`:is(button, a.cr-button)` gives every `button` in the document a Resin
background, a feathered `::before` and a 48px minimum height. That is correct for
this preview, which writes `<button class="cr-control">` throughout and relies on
the bare selector to avoid repeating the class. It is wrong for any document that
also has buttons of its own.

Crystal React loaded it in its Storybook for one release and every story was
rendered against it. A 32px chip drew 50px tall, and the visual evidence for every
slice was taken against styles a consumer would never have had. Loading it is now
forbidden in `libraries/CONTRACT.md` and warned about at the top of the file. The
hazard is documented, but the file is still a published export.

The file is `design-system/assets/controls.css`. Scoping the selectors to
`.cr-control` and `.cr-button` would remove the hazard. It would also change how
every bare `<button>` in the preview renders, which is a visual change across most
frames and needs its own change with the frames re-blessed.

**Closed.** The export was removed and the rules were kept. `./controls` is no
longer in `package.json`'s `exports`: `@crystal-ui/core/controls` does not resolve,
and the preview reaches the file by relative path. CONTRACT §9's prohibition was
advisory and is now mechanical. The advisory form had already been broken.

Scoping the selectors was the other option and is worse. Fifteen bare `<button>`
elements in `playground.html` and `motion.html` depend on them, as does every bare
`input[type=checkbox|radio|range|file]` in the preview, so scoping means
re-blessing frame-wide. `@layer crystal.component` already mitigates half of the
hazard: a consumer's unlayered CSS outranks the file for any property they
declare. It mitigates only half, because nobody writes a `::before` to cancel a
`::before` they did not know was coming.

What remains is the preview's own reliance on bare-element styling. That is a
matter of hygiene with no hazard to a consumer, and does not justify a frame-wide
change.

## D-2 · A horizontal `.cr-scroll-resin` still reserves a gutter it cannot use

`.cr-scroll-resin` carries `scrollbar-gutter: stable` because most Resin scrollers
are vertical. The documentation explicitly recommends the class for horizontal
scrollers as well. A horizontal one sets `overflow-x: auto`, which makes
`overflow-y` compute to `auto`, so the browser reserves 12px at the inline edge
for a vertical scrollbar that can never appear.

`.cr-table-scroll` avoids this by being excluded from the gutter rule, and Crystal
React's `ScrollArea` avoids it with `overflow-y: hidden` on its horizontal axis.
A product that uses the class directly gets neither.

The file is `design-system/assets/crystal.css`. The options were to document the
pairing as a requirement or to split the class in two.

**Closed.** `.cr-scroll-x` is a modifier that clips the block axis and releases
the gutter. `.cr-table-scroll` already gets that treatment by exclusion, and the
modifier makes it available to anything that uses one of the three classes
directly.

`verify-scroll` now fails any container that scrolls across but not down while
still holding a gutter. A forgotten modifier now fails the gate, where before it
cost 12px and nothing reported it. This was proved by planting the defect,
`scrollbar-gutter: stable` on `.cr-table-scroll`: seven containers across two
viewports failed.

The condition is "scrolls across and not down". It is not "does not scroll
down yet", because a short list that may grow is what the gutter is for. Such a
list does not scroll across, so it cannot reach the branch.

## D-3 · The preview's own layout is not on its own tokens

Crystal now has a spacing scale, breakpoints, a shell width and a reading column,
all of them named from values `assets/site.css` already used. The stylesheet still
holds the literals: `max-width: 920px`, `max-width: 1536px`, `@media (max-width:
1150px)` and about forty others.

Nothing is broken and nothing can drift yet, because the tokens were derived
from these numbers. They will drift the first time a token changes and the
stylesheet does not, and the preview is what the tokens are checked against.

The file is `design-system/assets/site.css`. The replacement is mechanical, but it
touches every frame, so it needs its own change and its own re-blessing.

**Closed**, in two parts.

The lengths are `var()` references: the shell's maximum width and its three
gutters, the workbench's sidebar and the documentation column. All eighteen
frames are byte-identical afterwards. The tokens were derived from these numbers,
so substituting them back changes nothing today, and a later token change now
reaches the preview.

The breakpoints cannot be `var()` references, because
`@media (max-width: 1150px)` will not take a custom property. They are checked
instead: `core-contracts.cjs` fails any `@media` width in `site.css` that is
neither one of Crystal's four shell breakpoints nor named in a short allowlist of
component thresholds. The allowlist holds the documentation shell's own two and
the reference image strip's two. Adding to it is a decision somebody has to make.
This was proved by moving 850 to 840: the gate failed.

## D-4b · `crystal.css` writes both `backdrop-filter` forms too

Crystal's own stylesheet pairs `backdrop-filter` with `-webkit-backdrop-filter` on
every material. That is safe here, because this preview ships hand-written CSS
that nothing minifies. The pair survives and both browsers get what they need.

In Crystal React the same pair went through autoprefixer and esbuild's CSS
minifier. The two collapsed to the prefixed form alone, and Chromium does not
understand the WebKit alias. Frost and Resin rendered with no diffusion at all,
in every story, until it was found.

The file is `design-system/assets/crystal.css`. Nothing is broken today. It is
listed for two reasons. If this stylesheet is put through any build (a bundler, a
minifier, a CDN that optimises CSS), it acquires the same defect with no warning.
A platform library reading it as an example will also copy the pattern.

**Closed** with a rule. The stylesheet was not edited. Stripping
`-webkit-backdrop-filter` from this stylesheet would lose Safari, because nothing
here runs autoprefixer to put it back: the preview ships the CSS it is written
in. The pair is correct here and wrong in anything that builds. That distinction
is now written where a library author looks: `libraries/CONTRACT.md`, "Write
`backdrop-filter` once", with the reproduction and an explicit note not to read
`crystal.css` as an example of it.

## D-6 · Neither repository had continuous integration

**Closed.** `.github/workflows/verify.yml` here and in Crystal React. Every step
is a script that already existed. The scripts now run on a clean checkout before
a change lands, where before they ran when somebody remembered.

Crystal's has two jobs. One runs the token, contract and documentation gates. The
other runs the browser gates and starts `tools/serve.py` first, because the
preview is verified served and not opened from the filesystem.

One gate is new: a build must not change a committed file. Generated output
that has drifted from its source makes every check beneath it evidence about the
wrong thing. The `date` in `validation/token-checks.json` is exempt, since it
records when the evidence was produced. The rest of that file is held to the rule.

## M-1 · Should the preserved-source archive leave the repository?

Gather was removed from the design system's documentation and published site.
Four files remain in the repository as provenance: `reference/gather-*.md`,
`gather-crystal-recipes.json` and `provenance.json`. `.vercelignore` excludes them
from the Vercel deployment, so they are not published, but they are still in the
history and the working tree.

Removing them from the tree is a commit. Removing them from history is a rewrite,
which Meridian has given standing permission for when a reason is provided.

**Decided, 18 September 2026: the archive stays.** Meridian's answer is to keep
it. Nothing is removed from the tree and nothing is rewritten out of history. The
four files stay where they are, excluded from the published site by
`.vercelignore` and present in the repository as provenance.

Closed.

## M-2 · The spacing scale, breakpoints and type scale were added without review

Three token families entered Crystal because the component tiers could not be
built without them, and because the catalogue already assigns each to Crystal:
"the spacing scale", "breakpoint behaviour", the reading rhythm's steps.

Every value is one the preview already used. The scale is the 4px rhythm tied to
the 16/24 reading rhythm, the breakpoints are where the shell already changes, and
the type scale's ratios were lifted from the React library and made portable.
Nothing changed appearance. Naming a value is still a design decision when the
number is not new, and these decisions were made mid-slice without a proposal.

They are recorded here so they can be reviewed as a set.

**Reviewed and signed off in full, 18 September 2026.** Meridian has approved all
three families (spacing, breakpoints and layout) as Crystal tokens. They are part
of the system and no longer provisional, and a platform library may rely on them.

Closed.

## D-7 · The documentation build ran outside the gate that watches generated files

**Closed.**

`docs/materials.html` was stale for a commit: the markdown gained a section and
the published page did not. Neither gate could see it. `validate-docs.cjs`
reads the markdown and the tokens and never opens the HTML. The CI drift gate
runs `npm test`, and `npm test` built the tokens and the catalogue but not the
pages. Comparing generated output against its source cannot cover output that the
build never generates.

`npm test` and `npm run build` now run `tools/build.py`, the superset that
writes the tokens, the catalogue, the reference sections, the theme CSS and all
fourteen pages. The gate itself did not change. It now covers the pages as well.
This was proved by reverting the page to the stale committed copy and running
`npm test`, which rewrote it.

The cost was one re-blessed baseline. Restoring the paragraphs above the
Haze-in-Resin composition moved it a fraction of a pixel down the page, so every
glyph rasterised at a new sub-pixel offset. 17.8% of pixels differ and the two
images are the same picture. Recorded in
`validation/captures/2026-09-18-materials-page-rebuild/`, amplified difference
included.

## D-8 · A component token that never reaches the flat file is watched by nothing

**Severity: low today.** The kind of gap matters more than its present size.

The round-trip gate in `build-tokens.cjs` makes a token value hard to change by
accident: it rebuilds the flat runtime file from the DTCG source and fails if any
value moved or disappeared. It compares flat against flat, so it sees only a
token that `flat.component` maps.

`component.indicator.*`, `component.action.*`, `component.card.radius` and
`component.focus.*` are not in that map. They reach a platform library through
`exports/crystal-tokens.{ts,swift,kt}` instead, which nothing compares against
anything. Removing `component.selection` this cycle showed the gap: two tokens
vanished from the DTCG source and the gate printed
"Round trip verified: no token value changed."

That was the right outcome for a deliberate removal. An accidental removal would
have produced the same output.

**Closed** by projecting the whole tier. `flat.component` was a hand-written list
of the families the resolver happened to read. It is now a generic projection of
`tokens.component`, with aliases dereferenced and dimensions unwrapped exactly as
the hand-written version did. Four families joined the flat file: `action`,
`card`, `focus` and `indicator`. The gate announced them as additions, with no
value changed and all eighteen frames identical. `assets/crystal.js` reads named
keys, so the generated theme CSS is byte-identical.

The alternative was gating the exports separately. It is worse, because a token
no runtime can read gets written again by hand, which is the divergence
CONTRACT §1 exists to prevent.

This was proved by planting two defects at once: deleting
`component.focus.coreWidth`, which the gate could not see before, and moving
`component.chip.height` to 33px, which it always could. Both failed the build in
the same run.

## D-9 · Crystal exported one Resin shadow and rendered another

**Closed, with Meridian's approval to change whatever aesthetic parity needs.**

`--cr-shadow-float` is the exported token every platform library gets.
`controls.css` wrote its own copy of the same recipe, twice, and because the
preview loads it that copy is what the approved baseline shows. They disagreed on
rim depth, on the lower rim's colour, and on the elevation's colour and spread.

A platform library that followed Crystal's tokens could not reproduce Crystal's
appearance, and the parity bar in `libraries/CONTRACT.md` could not be met by
following Crystal. Crystal React's material gate found it, after Meridian looked
at that library's Storybook and said none of it looked like Crystal.

This is D-1's hazard a second time. `controls.css` shaped the appearance that was
blessed and the exported surface said something else. It is the same file and the
same reason, and that reason is why the export was withdrawn.

**One recipe now.** `controls.css` reads `var(--cr-shadow-float)` in both places,
and the token carries what each side had right: the blessed rims, and the
palette-tinted, elevation-responsive spread that the literal never had. The
coefficients are the blessed distances over the default 125% elevation, so the
default renders what was approved. The elevation control, which did nothing to a
control's shadow before this, now moves it.

Twelve frames re-blessed, evidence in
`validation/captures/2026-09-19-one-resin-shadow/`. 1,788 contrast cases pass.

**The remainder is now closed too.** `controls.css` held eleven more hard-coded
shadow literals: `#080b2426` ×4, `#080b2433` ×3, `#080b241c`, `#0002`, `#fffc`
and one `rgba(39,24,68,.15)`. Each was a fixed dark navy that does not tint with
the palette and does not answer the elevation control. They were preview-only, and
so were the two that caused this entry, until the baseline was captured from
them.

The resolver now exports the two inks the composed shadows are already built
from, `--cr-shadow-contact` and `--cr-shadow-cast`, so each literal was replaced
by substitution and no new value was invented. Each was matched on alpha.
Measured: 10,999 of 1,792,000 pixels differ, 0.6138%, worst channel delta 15 of
255, and only on the controls that used a literal: the switch, the range, the
checkbox, the file button, the field shell's outer cast, the selected dock pill,
the indicator and the table hover. The action buttons are pixel-identical. They
were already built from `--cr-shadow-float`, so this is the check that the change
touched only the literals. Evidence in
`validation/captures/2026-09-19-shadow-ink-follows-the-palette/`.

Two literals remain and are a separate question: `#ffffff30` and `#ffffff0a`,
the two white stops of the optical sheen gradient. They are highlight, not ink,
and they are white in every palette.

`validation/baselines/` has not been re-captured. The driver that walks
`frames.json` is still unwritten (crystal-2.0 plan, task 14), and those frames
were taken manually. Any frame showing a switch, a slider, a dock pill or a table
will differ by the amount above. The capture README is the explanation that
belongs beside them when they are re-taken.

## D-10 · `@crystal-ui/core` is a folder inside a website, not a library

**Requested by Meridian, 19 September 2026.**
**Proposal written and the first two steps done, 19 September 2026. The rest is
sequenced behind an npm scope that does not exist yet. See "Where this stands".**
**Severity: high. It is the common cause behind D-9, R-13 and R-14.**

### What it is today

`@crystal-ui/core` version `2.0.0-alpha.1`, `"private": true`, published nowhere.
Its package root is `design-system/`, and that one directory is three things:

- **The library.** `tokens/`, the resolver in `assets/crystal.js`, the headless
  core in `assets/core/`, `crystal.css`, `crystal-theme.css`, the icon set, the
  motion recipes, the catalogue, and the generated TypeScript, Swift and Kotlin
  exports. Sixteen export entry points. Two runtime dependencies, `gsap` and
  `motion`.
- **The documentation website.** `index.html`, `playground.html`, `motion.html`,
  eleven pages under `docs/`, and the scripts and stylesheets that drive them:
  `site.css`, `site.js`, `menu.js`, `docs.js`, `controls.css`, `controls.js`, the
  motion suite, the shaders.
- **The build and verification machinery.** `tools/`, `tests/`, `validation/`.

Vercel deploys it with `"outputDirectory": "design-system"`, so the website is
the package directory, and `.vercelignore` exists to keep `tools/`, `src/` and
`package.json` out of the upload. Crystal React consumes it as
`file:../crystal-design-system/design-system`, a path on one contributor's disk.

### Why this is the shape of several defects rather than a preference

Each of these is already in a tracker, and each has this same root cause.

**D-9: the design system shipped one Resin shadow and rendered another.**
`controls.css` is website-only and unexported. Because the preview loads it, it
shaped the appearance that was blessed, while `--cr-shadow-float`, which every
platform library receives, said something else. A library following Crystal's
own tokens could not reproduce Crystal's own appearance. Nothing structural stops
that recurring. Eight more hard-coded shadow literals remain in that file, and
they are harmless today only because no baseline has been captured from a
composition that uses them.

**R-13: Crystal React's materials had drifted and nothing compared them.**
Closing it needed a gate that renders the same material in two running servers
and diffs the computed style, because there is no artefact to compare against.
A library cannot ask "what is Crystal's Resin recipe?". It can only ask a browser
what Crystal's website painted.

**R-14: a `file:` dependency, pre-bundled once and served stale for hours.**
Three investigations in one day. One began a wrong diagnosis of the theme
provider. One is what Meridian saw when they reported that Crystal's
specifications were absent from every component.

**There is no version contract.** Crystal React cannot say it targets Crystal
2.0.1. It resolves whatever is on the disk beside it. A change to a material
token reaches every library at once and unannounced, with no range to pin, no
changelog entry to read and no way to stay on a known-good version and upgrade
when it chooses.

**A consumer installs the documentation website.** `files` includes `docs/`, a
megabyte of generated HTML, and the whole 4.6MB of `assets/`, most of which is
the site: `site.css`, `menu.js`, `motion-suite.js`, the shader sources, the
fonts. A product that wants the token resolver downloads the specification pages.

**There is nothing for a non-JavaScript library to consume.** `libraries/` holds
`CONTRACT.md` and `parity.json` and no artefact. The Swift and Kotlin exports are
generated, and then they sit inside a package only npm can install. A Compose or
SwiftUI library has to copy them, which is the retyping CONTRACT §1 exists to
forbid.

### What Meridian asked for

1. `@crystal-ui/core` becomes a proper published library and stops being a
   `file:` path.
2. It supplies context and specifications to every Crystal component library,
   not only the React one, so this class of drift stops recurring.
3. The documentation website and its interactive previews are updated to
   consume the new core. Today they are the same directory as it.
4. The specifications are updated to refer to the core library and to explain
   how it operates.
5. `@crystal-ui/core` is separated from the website's deployment repository.
6. The steps only Meridian can take are documented and raised with them. See
   "What only Meridian can do", below.

### The shape this probably takes

This is recorded as a starting point for a proposal. It is not a decision.

**A package that is only the library.** Tokens in every generated form, the
resolver, the headless core, `crystal.css` and the generated theme, the icons,
the motion recipes, the catalogue and the parity manifest. No HTML, no `site.*`,
no `controls.*`, no `tools/`. The test of whether the boundary is right: *a
library that consumes this can render Crystal correctly with no browser and no
website.*

**`controls.css` is the boundary case and needs a decision.** It is the preview's
own stylesheet, it is not exported, and it shaped the blessed appearance. Either
its recipes belong in the library, in which case they stop being preview-only
and every literal in them has to become a token, or the baseline needs
re-capturing from compositions built only from exported surfaces. D-9 fixed the
one instance that had already caused a defect. The file is still the hazard.

**A specification artefact as well as prose.** This is more than
"publish the npm package", because a Swift or Kotlin library has to be able to
consume the result. The catalogue, the parity manifest, the token exports and the
motion recipes are all already data. They need to be published somewhere a
non-npm toolchain can fetch them and pin a version of them: a release asset, a
second registry, or a versioned URL. `libraries/CONTRACT.md` then cites the
artefact and no longer describes it.

**Versioning against the contract.** The README already says Crystal follows
semantic versioning "against the public contract defined in the adoption
chapter". Once there is a published package that sentence becomes enforceable,
and the round-trip and material gates decide whether a change is a patch, a minor
or a major.

**The website becomes a consumer.** It installs the library like any other
product and its interactive previews read the published resolver. That is the
structural fix for D-9: when the website can only reach what the library exports,
a preview-only stylesheet cannot shape a blessed appearance without becoming part
of the library first.

### Answered by Meridian, 19 September 2026

Every open decision in this entry has been made. What follows replaces the list
of questions that stood here.

**1. Scope and registry: `@crystal-ui`, on the public npm registry.** Meridian had
verified a scope was free and had said so. This entry still claimed it was "almost
certainly taken", which was a guess presented as near-fact. The instruction was
already recorded in Crystal React's `docs/requirements.md`, 18 September:
*"There should be no @meridian/crystal. Crystal Design System
packages should be under the @crystal scope."* This entry had cited the
`@meridian/crystal` entry in the pnpm store as evidence that the question had been
considered before. That entry was left over from an earlier instance of the same
mistake.

**The check recorded here on 19 September was the wrong check**, and its
conclusion has since been overturned. It asked whether two packages existed:

```
GET registry.npmjs.org/@crystal%2Fcore     404 {"error":"Not found"}
GET registry.npmjs.org/@crystal%2Freact    404 {"error":"Not found"}
GET registry.npmjs.org/-/v1/search?text=scope:crystal    total: 0
```

A 404 on `@crystal/core` proves that `@crystal/core` has never been published.
It proves nothing about the `@crystal` scope, because npm reserves scopes
(organisations and user scopes) independently of any package under them. A scope
can be held with nothing published in it, and then all three lines above still
read exactly as they do. The search line has the same limit: `scope:crystal`
searches published packages too. The check that answers the question is
`GET registry.npmjs.org/-/org/crystal` or `npm org ls crystal`, or
`https://www.npmjs.com/org/crystal` in a browser.

Meridian ran that check directly on 20 September: **`@crystal` is taken.** The
scope Meridian holds, and the one Crystal publishes under, is `@crystal-ui`.
Packages are `@crystal-ui/core` and `@crystal-ui/react`. The stale
`@meridian/crystal` name in `design-system/package-lock.json` is corrected.

This is the second npm-registry claim in this tracker that was wrong in the same
direction: finding nothing was read as proof that nothing existed. A 404 answers
only the exact question the URL asked.

**2. The documentation and preview site gets its own repository: `crystal-preview`.**
Already created.

**3. `CRYSTAL_HEAD_TOKEN` is already set on `crystal-preview`** as a repository
secret holding a PAT.

**4. The `@crystal-ui/core` repository is `crystal`, and it is now public.**

**5. Meridian will re-base the Vercel project onto `crystal-preview`.**

**6. The first published version is `2.0.0`.** It is not an alpha or a release
candidate: 2.0 ships as 2.0.0, and `2.0.0-alpha.1` is retired.

**7. Local development and publishing, left to this project's judgement,
"whichever is most conducive without introducing security vulnerabilities".**
The choice and its reasoning:

- **Consumers depend on a published range**, `"@crystal-ui/core": "^2.0.0"`. No
  `file:` and no `link:` in any committed manifest. A committed path is what
  produced R-14, and a package published while carrying one would ship a
  dependency that resolves to a directory on nobody else's machine.
- **Local work against an unpublished Crystal uses `pnpm link`**, which is a
  `node_modules` symlink and not a copy, so an edit to Crystal is live, with no
  cache to clear. That cures R-14, where `optimizeDeps.force` only worked around
  it. It is a working-copy state, never committed, and `pnpm unlink` returns to
  the published version.
- **Publishing uses npm Trusted Publishing (OIDC) from GitHub Actions, not a
  long-lived token.** This answers the security condition. With OIDC there is no
  npm credential in the repository at all, so there is nothing to leak, rotate or
  scope. A granular automation token is the fallback only if trusted publishing
  cannot be enabled, and it would then be scoped to the single package with a
  short expiry.
- **`--provenance` on every publish**, which attests the tarball to the exact
  commit and workflow that built it. A consumer can then verify that the
  `@crystal-ui/core` they installed came from `boomerbowser/crystal` and not from
  someone who guessed a version number.
- **Owning the scope publicly is itself the mitigation for dependency
  confusion.** An unclaimed `@crystal-ui` scope with private libraries importing
  from it is the classic setup for that attack. Publishing under a scope Meridian
  controls closes it.
- **Two release gates**, because both failure modes are silent: a published
  tarball must contain no `file:` or `link:` dependency, and must contain no
  website (no HTML, no `site.*`, no `controls.*`). The second is D-9's structural
  fix, since a preview-only stylesheet cannot shape a blessed appearance if it
  cannot leave the repository.

### What closing it needs from me

A written proposal comes before any code, because this moves every consumer at
once and half of it is Meridian's decision. Then, in order: the package boundary
and what leaves it; the website converted to a consumer with its previews reading
the published resolver; the specifications rewritten to describe the core library
and how a platform library consumes it; the deployment separation; and a gate
that a released package contains no website.

Recorded in Crystal React's tracker as R-16, which is the same issue seen from
the consumer's side.


### Where this stands, 19 September 2026

The proposal this entry asked for is
[`proposals/2026-09-19-crystal-core-as-a-library.md`](2026-09-19-crystal-core-as-a-library.md).
It answers the one decision this entry left open, which is what happens to
`controls.css`. It recommends promoting the file's recipes incrementally, and
recommends against both exporting the file and abandoning it. R-15 is the worked
example: one number became `component.haze.inset`, `controls.css` reads the
token, the Swift and Kotlin exports picked it up with no further work, and the
parity gate grew a `::before` comparison that fails if a consumer stops painting
it. Doing it in one sweep would mean re-blessing every approved frame at once,
which the change discipline exists to prevent.

**Done, and reversible:**

- **The folders.** Requested again by Meridian on 19 September: *"separate the
  files that make up @crystal-ui/core from the preview website into different
  folders. That's part of what we meant originally."* `design-system/core/` is
  now the library and nothing else, with its own `package.json`. The rest of
  `design-system/` is the preview site and the machinery. A `files` array says
  what ships and stops nobody reaching across. A directory boundary does stop
  them.

  `core/` sits inside the deploy root, not beside it, because Vercel serves
  `design-system/` as a static upload with no build step. A sibling folder would
  be unreachable and every page would 404 on the resolver. The site's own URLs
  are unchanged, and nothing about the published tarball moved: 1,056 entries and
  16 exports before and after.

  The move surfaced two things that a path rewrite could not see.
  `tools/build-icons.cjs` built its output directory with
  `path.join(ROOT, 'assets/icons')`, so the first run after the move wrote 999
  icons into a second directory and left the real one stale. And `gsap`/`motion`
  are `@crystal-ui/core`'s runtime contract but the preview's engine bundle is
  built from them, so both manifests must name them. `validate-motion.cjs` now
  treats `core/package.json` as the authority and fails if the workspace manifest
  or the lockfile disagrees, so the duplication is a checked invariant.

- **The boundary.** A published `@crystal-ui/core` was 2.18 MB across 1,097 files
  and 46% of it was the documentation website. `files` now ships only the
  library: 1.2 MB, no HTML, no `site.*`, no `controls.*`, no preview motion
  suite, no `src/pages/`.
- **Version `2.0.0`, `private` removed**, and `publishConfig` corrected. It was
  still aimed at GitHub Packages with `access: restricted`, left from an earlier
  assumption, and would have published to the wrong registry.
- **`tools/verify-package.cjs`**, in `npm test`, guarding three silent failures:
  a `file:` or `link:` dependency in a published manifest; a website in the
  tarball, which is this entry's structural fix; and an `exports` entry naming a
  file `files` does not ship, which fails at the consumer's build. Each was
  planted and each failed the check.
- **`.github/workflows/publish.yml`**: tag-triggered, with npm Trusted Publishing
  so no credential exists in the repository at all, and `--provenance`. It also
  builds `crystal-spec-<version>.zip` as a release asset: the DTCG source, the
  flat tokens, the catalogue, the motion recipes, all three token exports,
  `parity.json` and `CONTRACT.md`. That is the half npm cannot carry, and the
  reason this is more than "publish the package": a SwiftUI or Compose library
  cannot install one.

**Not done, and why.** Steps 3 to 6 of the proposal are the specifications
rewritten around the core library, the website converted to a consumer, the
repository split, and Crystal React moving to `"@crystal-ui/core": "^2.0.0"`. All
four are gated on the `@crystal-ui` scope existing on npm and something having
been published to it. A committed range that points at a version nobody can
install is worse than a `file:` path, so the path stays until then.

The repository split is also the one step that writes to `crystal-preview`, and
this session has never pushed to that remote. The commands are in §7 of the
proposal and have not been run.

**What only Meridian can do** is §6 of the proposal: publish under the `@crystal-ui` scope,
enable Trusted Publishing for `boomerbowser/crystal` and
`.github/workflows/publish.yml`, push the website to `crystal-preview`, and
re-base the Vercel project. `CRYSTAL_HEAD_TOKEN` and the public `crystal`
repository are already in place and need nothing further.

---

## D-12 · Separating the library from the website, and what is left of it

**Done 2026-09-20.** `design-system/` is gone. `core/` is the library and
`website/` is the documentation site, as two folders at the repository root with
neither inside the other. `tools/`, `tests/` and `validation/` are machinery and
belong to neither.

**How the website reaches the library.** A browser cannot follow `../core/` out
of a deployed site, so `tools/assemble-site.mjs` copies the library into
`website/vendor/@crystal-ui/core/`, which is gitignored. That path is shaped
like `node_modules/@crystal-ui/core/` and stays, because a static deployment
uploads `website/` and `node_modules` is not inside it. When the library is
published, what changes is where the copy is read from, which is one constant in
that script.

Vercel therefore has a build command where it had none:
`node tools/assemble-site.mjs`, with `outputDirectory: "website"`. The script
uses Node built-ins only and takes no arguments, because `installCommand` is
empty and anything it needed installed would have to be installed there too.

**The specification ships in the package.** `core/docs/` holds the eleven
specification pages and `@crystal-ui/core/docs/*` exports them. The website
renders the copy it installed. Before this, `build-reference.cjs`, a library
generator reading the library's own token files, wrote into the website's
folder. That stops working the day these are two repositories.

**Four defects the move exposed, none of them caused by it:**

1. `build-tokens.cjs` wrote the language exports to a bare `exports/` beside the
   tools and not into the library. The package shipped one copy while every
   build refreshed another that nobody installed. They were still byte-identical
   apart from a header, so the fork was caught before the copies diverged.
2. `"./shaders/"` resolved for nothing. See the `verify-package.cjs` note below.
3. Both GitHub workflows still ran in `design-system/` after it ceased to exist,
   and had been pushed that way. `publish.yml` would have failed at `npm ci`, on
   a tag.
4. The browser job never built, so it served a site with no library in it. What
   it reported was fifty-four scroll containers announcing
   `scrollbar-color: auto`, which is exactly what a deliberate regression in the
   scroll contract looks like. `serve.py` now refuses to start without the
   library.

**`verify-package.cjs` had a rule for (2) and did not catch it.** It asked
whether the files were in the tarball, and they all were. Shipping a file and
exporting it are different properties, and a consumer depends on the second. The
tool now resolves every subpath from a sandbox where the package sits at its
published name, and checks that what resolved is also shipped.

**What remains: the repository split.** `crystal-preview` exists, is
initialised and is connected to `/home/oshun/Development/Proposals/crystal-preview`.
The website has not been moved into it, and the move cannot be pushed in one
step, because of an ordering constraint:

> Vercel currently builds the site from the `crystal` repository. The moment
> `website/` is removed from `crystal` and pushed, the site is down — and
> `crystal-preview` cannot take over until `@crystal-ui/core` is installable,
> because a preview repository consuming the library by
> `file:../crystal-design-system/core` resolves to nothing on Vercel.

The order is: publish `2.0.0`, push `crystal-preview`, re-base the Vercel project
onto it, and only then remove `website/` from `crystal`. Only the last step is
reversible cheaply, and only the first two are Meridian's alone.

**Also unresolved by the split.** `tools/` divides cleanly enough. The token,
catalogue, reference and icon builds and `verify-package.cjs` are the library's.
The page build, `shell.py`, `report.py`, `validate.py`, `serve.py` and the
browser gates are the website's. But three validators (`validate-tokens.cjs`,
`validate-motion.cjs`, `validate-docs.cjs`) check the library and write their
records into the website. They belong with the website, which is where the
records are published from. Gating the library on its own side is a separate
piece of work. `build.py` is also two scripts in one file, a library build and a
site render.

**One more, named and not fixed.** Crystal React's material-parity gate
serves Crystal's preview from `../crystal-design-system/tools/serve.py`. After
the split that is a third checkout, and the gate needs to say so.

---

## D-14 · The documentation site's first deployment was blocked before it built

**Found 20 September 2026. Not fixable from here.**

The Vercel project was re-based onto `crystal-preview` and the first push to that
repository produced deployment `dpl_6KYJdLjbo8gxZX8ZULTHzb3dHfjH`, in state
**`BLOCKED`**. It never built: `createdAt`, `buildingAt` and `ready` are the same
instant, and the deployment has no build logs at all. The API returns
`not_found` for them, because there was no build.

Vercel's own error link on the deployment points at
`vercel.com/docs/deployments/troubleshoot-project-collaboration#account-configuration`,
which is the account-configuration section. The cause is a state the Vercel
account is in. The repository did not cause it: the commit is fine, CI on that
commit is green in both jobs, and the same configuration built successfully three
times from the `crystal` repository earlier the same day.

**Only Meridian can clear it**, from the Vercel dashboard. Until it is cleared
the published site is whatever the last `READY` deployment served, which is
`dpl_DawzarTyBmjXL4bMXjaCjqkfBB3b`. That deployment was built from the `crystal`
repository, from commit `85c9c06`, and therefore from a copy of the website that
no longer exists in that repository. Nothing is broken for a reader, and nothing
will update either.

**Unrelated, and not to be confused with it:** the project has Vercel
Authentication turned on, so every URL answers `302` to `vercel.com/sso-api`
for an unauthenticated request. That is deployment protection working as
configured, and it is why the site cannot be checked with `curl` from outside.
It was left alone.

**What to check once it is cleared**, because it has never been exercised: the
build command is `node tools/assemble-site.mjs` and `installCommand` is
`npm ci --omit=dev`, so the deployment is the first thing that will prove the
library is installed from npm and copied into the site by the build, and not
found on disk. A `404` on `/vendor/@crystal-ui/core/assets/crystal.css` means the
build did not run, and every page would render unstyled.

**Closed 21 September 2026.** Meridian cleared it, and the deployment that had
never been exercised has now run.

Meridian fixed the account-level git configuration and asked for a commit to be
pushed to `crystal-preview`. Deployment `dpl_49kwxpdt4qqmWCwgqv9y3gbw8YMt`, from
`crystal-preview@9fc6bf9`, is **`READY`**. It is the first production deployment
ever built from that repository, and the first built from the published package
and not from a copy of the website on disk.

**What `READY` proves.** This is what the entry was waiting for.
`vercel.json` sets `installCommand: "npm ci --omit=dev"` and
`buildCommand: "node tools/assemble-site.mjs"`, and that script exits `1` both
when it can find no library (neither `node_modules/@crystal-ui/core` nor a
sibling `core/`) and when any of `assets`, `tokens`, `licenses`, `docs` is
missing from the one it found. Vercel fails a deployment whose build command
exits non-zero. So a `READY` state is only reachable if `@crystal-ui/core@^2.0.0`
was installed from the registry, since there is no sibling checkout on a Vercel
builder, and then copied into `website/vendor/@crystal-ui/core/`. The site is now
a consumer of the package, which is what the restructure was for.

**What it does not prove.** `READY` is evidence that the file was produced by the
build. It is not evidence that the file is served at this URL:

```
/vendor/@crystal-ui/core/assets/crystal.css
```

The file cannot be fetched from here. The API token can list deployments but is
refused on both build logs and deployment files, and the project's Vercel
Authentication answers `302` to `vercel.com/sso-api` for anything
unauthenticated. A signed-in browser is the only place left to confirm it, and a
`404` there would still mean the build did not run. It needs one look.

The blocked deployment `dpl_6KYJdLjbo8gxZX8ZULTHzb3dHfjH` remains in the
project's history in state `BLOCKED`. It is inert.

---

## D-11 · The library shipped a focus halo Meridian had withdrawn

**Found 2026-09-20. Fixed the same day.**

The focus halo's spreads were halved at Meridian's request, from `2/6/12/22` to
`1/3/6/11`. The blur radii were left unchanged so that the ring thins without
the falloff flattening. The change was made in `website/assets/controls.css`,
the preview's own stylesheet, which overrides the library's.

That left three things true at once:

- Crystal's site rendered the halved halo, because `controls.css` wins.
- The specification documented the halved halo. `build-reference.cjs`
  generates the focus-recipe table by reading `controls.css`, so that the
  table cannot be transcribed by hand and drift. It read the override.
- The library shipped the withdrawn halo to every consumer.
  `core/assets/crystal.js` still emitted `[[6,2,46],[16,6,30],[30,12,17],
  [54,22,8]]` into the exported theme, which is what a consumer reads. Crystal
  React's focus ring was visibly wider than Crystal's own for as long as that
  was true.

Blur radii and alphas were identical throughout. Only the spread was behind.
The ring had the right colour, softness and shape and was too large, which is
why the defect survived.

This is the failure recorded in D-9. D-9 was Crystal exporting one Resin shadow
and rendering another: the preview's stylesheet shaped the blessed appearance
while the exported token said something else. `verify-package.cjs` was built to
stop the preview's stylesheet leaving the repository. It cannot stop the
preview's stylesheet overriding the library inside the repository.

No check caught it. As a test, Crystal React's `verify-appearance`,
`verify-theme` and `verify-materials` were each run against the withdrawn
value, and all three passed. They assert that `--cr-focus-ring` is defined.
That was the correct check when the defect was a property read by everything
and defined by nothing. It does not detect a wrong number.

`tests/core-contracts.cjs` now compares the exported halo against the rendered
one, layer by layer, blur and spread. Reverting `crystal.js` turns it red with
the four pairs printed side by side.

Still open, and Meridian's to decide: the preview raises the feather's alpha
in dark mode (`56/38/22/11` against the library's `46/30/17/8`) to hold up
against a deep canvas. The library does not. Nobody has said which is correct,
so the contract compares geometry only, and the divergence is recorded without
being frozen into a gate. Either the library should carry the dark-mode lift,
or the preview should stop applying it.

A second divergence in the same property was found on 20 September, when the
repository split exposed it. `build-reference.cjs` generated the focus-recipe
table by reading the preview's `controls.css`. With the preview in another
repository it could not open the file. Reading the library's own exported theme
instead showed the table losing two rows:

| | halo layers | elevation layers |
|---|---|---|
| `controls.css`, which the site renders | 4 | 2: `0 8px 18px` directional, `0 22px 40px` broad |
| the exported theme, which consumers read | 4 | none |

A focused control in Crystal React gets the halo and no elevation change,
while a focused control on Crystal's own site lifts. The first divergence was
a spread. This one is two whole layers.

Three divergences are now named and none is decided:

1. The elevation layers. Either `--cr-focus-ring` should carry them, or
   lifting on focus is the site's own addition. The prose in `components.md`
   described them as Crystal's behaviour, which is an argument that the ring
   should carry them.
2. The dark-mode feather alphas. The site raises them to 56/38/22/11 against
   the library's 46/30/17/8, to hold the falloff against a deep canvas. The
   library does not.
3. Everything else `controls.css` redefines, enumerated 21 September 2026.
   The overlap in custom properties is smaller than feared, and the overlap in
   what is rendered is larger.

   Custom properties defined by both: three. The library defines 142 across
   `crystal-theme.css` and `crystal.css`; `controls.css` defines 11; the
   intersection is `--cr-focus-core`, `--cr-focus-ring` and `--cr-outline`.

   | property | library | `controls.css` | verdict |
   |---|---|---|---|
   | `--cr-focus-core` | `#7338EF` / `#c8b1f9` | `var(--cr-primary)` | No divergence. `--cr-primary` is `#7338EF` / `#c8b1f9`, so this is the same value written as a reference. Deleting it from the site changes nothing, unless a page sets `--cr-primary` locally. In that case the site's focus core follows it and the library's does not. |
   | `--cr-focus-ring` | four halo layers | the same four, plus two elevation layers | Divergence (1) above. |
   | `--cr-outline` | `#624a9f` / `#bfa3f8`, globally | `var(--status-ink)`, scoped to `.cr-status` | A third divergence, and new. The library never narrows `--cr-outline` inside `.cr-status`. A focused status chip outlines in its own status colour on Crystal's site, and in the generic outline colour in every consumer. `--status-ink` is the library's own property, set per `[data-status]`. The site applies a value the library defines and does not use here. |

   The other eight properties `controls.css` defines are its own and collide
   with nothing: `--cr-control-color`, `--cr-control-light`,
   `--cr-focus-feather-1` … `-4`, `--cr-focus-shadow`, `--cr-range-progress`.
   Divergence (2) lives in those feather variables. The library has no
   equivalent and inlines its alphas straight into `--cr-focus-ring`, so the
   dark-mode lift had nothing to be compared against.

   The first measurement of the declarations set by both was wrong. An
   earlier pass here reported "50 declarations set by both, across 14 of
   Crystal's own classes". That number came from intersecting class names per
   stylesheet, which flattens every context: it counted a
   `@media (forced-colors: active)` override against a base rule, and
   `span.cr-status > span` against `.cr-status`. Its value-level companion
   claimed `.cr-button { background: Canvas !important }` and
   `.cr-status { border-radius: 50% }` were Crystal's, which they are not.
   **Do not use it.**

   Parsed with postcss, keying each declaration by its full context (enclosing
   at-rules, exact selector, property), the library sets 510 declarations and
   `controls.css` sets 502, and the number they share is zero. No
   selector-and-property pair is set by both.

   That result does not clear the stylesheet. `controls.css` wins by cascade:
   it styles compound selectors like
   `:is(button, a.cr-button, .cr-control, .cr-field-shell, …)` where the
   library styles a bare `.cr-button`, so the two never agree textually and the
   site's declaration still lands on the same element. A static diff cannot see
   that, however the stylesheets are parsed.

   The measure that can see it is computed style on a rendered element: the
   same page with `controls.css` enabled and disabled, in both modes and with
   forced colours emulated, diffed over every element carrying a `cr-*` class.
   This item needs that experiment, and it has not been run yet.

   What to build once the values are compared: the check this entry asks for,
   in `tests/site-contracts.cjs` in crystal-preview. It asserts that the site
   redefines no custom property and re-declares no material property the
   library already sets, with an explicit allow-list carrying a reason per
   entry. It cannot be written before (1) and (2) are decided, because it would
   freeze them.

Until (1) and (2) are decided, the contract compares geometry only and the first
four layers only. Freezing either divergence into a gate would decide it by
accident, which is how the spreads got out of step.

Also fixed on 20 September: the prose above the generated table still quoted
the withdrawn spreads, "46% at 6px blur / 2px spread, 30% at 16px / 6px …",
long after the halo was halved, so the specification contradicted its own
generated table two lines below. `validate-docs.cjs` now requires every
blur/spread pair the theme exports to appear in that sentence. It fails four
times if the halo moves and the prose does not.

**Closed 21 September 2026.** Meridian decided all three divergences the same
way: the library adopts, the preview does not drop. Their reasoning applies
beyond this entry. The preview site was the visual example Crystal's
specifications were tested and measured against, so where the two disagree the
preview is the evidence and the library is the copy that fell behind. Meridian
made it a standing rule for every component library, and not only a ruling on
this one.

**(1) The two elevation layers** are in `--cr-focus-ring`. It is six layers now:
the four-layer halo at 6/1, 16/3, 30/6, 54/11, then `0 8px 18px` directional and
`0 22px 40px` broad. The directional layer reuses the second feather so the lift
reads as the same light source. The broad one is `--cr-decorative` at 27%, so
the shadow under a focused control carries the palette's shadow hue and does
not tint the page.

**(2) The dark-mode lift** is carried: feather alphas 56/38/22/11 in dark against
46/30/17/8 in light, published as `--cr-focus-feather-1` … `-4` with
`--cr-focus-shadow` beside them. Naming them is part of the fix. The divergence
went unnoticed because the library baked its alphas into the ring and there was
no property to compare.

**(3) The third divergence** was much larger than this entry thought, and two
earlier measurements of it were wrong. The class-name intersection ("50
declarations across 14 classes") was withdrawn before the decision. Parsing both
stylesheets with postcss then showed zero shared
`(at-rule, selector, property)` keys. That was correct and did not answer the
question, because `controls.css` wins by cascade, styling
`:is(button, a.cr-button, .cr-control, …)` where the library styles a bare
`.cr-button`. Measured as computed style on rendered elements, in both modes,
with `controls.css` on and off, the site changed 246 distinct computed values
across 13 Crystal-named classes.

Five of those classes did not exist in the library:
`.cr-control`, `.cr-field-shell`, `.cr-indicator`, `.cr-resin-haze` and
`.cr-tag`. `components.md` names them throughout (the indicator's 20px circle
with its 3px-inset 80% Haze fill, `.cr-resin-haze` as the composition small
display elements use) and instructed the reader to "use `assets/controls.css`",
a stylesheet the package has never contained. The entire Resin interaction
surface was in that file: the fill, the rim, the `::before` Haze layer, the
`::after` optical sheen, and the reduced-transparency and forced-colours
adaptations of all of it. The defect was therefore larger than a focus halo. It
is why Crystal React had to rebuild the control surface in SCSS and could not
consume it, and it is the root cause of D-9, not another instance of it.

58 rules and 175 declarations were lifted into `assets/crystal.css` in
`@layer crystal.component`, the layer the preview used and the one the library's
own layer order already reserved. Selector lists were filtered to the Crystal
parts; the preview keeps its switches, segmented controls and range inputs.
`--cr-control-color` and `--cr-control-light` came with them, and
`.cr-status` now narrows `--cr-outline` to `var(--status-ink)` for the chip's
subtree. *(Corrected 21 September 2026: this entry said it made "a danger chip's
rim follow its status". It does not. `--cr-outline` is read by
`.cr-button.quiet`, `.cr-input`, `.cr-dialog`, the Frost/Resin border-color and
the two scrollbar rules, none of which can match inside a chip: every
`.cr-status` on the preview is a bare span holding an icon and a label, and the
chip's own rim comes from `--cr-rim`. The declaration renders nothing today. It
is kept because the preview carries it and a consumer may nest something that
reads it. Describing it as a visible effect was wrong.)*

The adoption was verified by rendering. The site as it ships (published 2.0.0
plus `controls.css`) was compared against the site built on this library with
every lifted rule removed from `controls.css`: 10,534 computed values compared
across three pages in both modes, and six full-page screenshots with a control
focused so the halo and both lifts painted. All six frames are pixel-identical
at zero tolerance.

**That proof supports a narrower claim than this entry made for it, and this
entry described it wrongly.** It is recorded above as "published 2.0.0
plus `controls.css`" against the new library. The capture script swapped
stylesheets inside the page and never swapped the vendored library, so both
sides ran on this library. The resolver gained the two elevation layers in the
same commit as the first adoption, so a comparison of 2.0.0 against 2.1.0 with
a control focused could not have come back identical, as the measurement
further down shows. The six frames proved that moving those rules changed
nothing, and that remains proven. They showed the lift was faithful. They could
not show whether it was complete, because both sides kept `controls.css`:
whatever the sheet still overrode, it overrode identically on both sides. A
second pass measured that directly, with the library fixed and the site's sheet
as the only variable, and found a great deal still there: a `.cr-table-scroll`
carrying the whole Resin surface over a library rule that gave it scrollbar
colours and no `overflow` at all; a `.cr-dock` as a Resin pill over a library
rule that made it a bare flex row; a status chip at 18px radius and 12px/18px
padding over the library's 9px and 5px/9px; and every native form control
(checkbox, radio, range, file button, select option, menu item), none of which
the library styled anywhere.

Classifying that residual by selector shape gave three different answers (29
declarations by subject, 151 by selector root, and still leaking: rules like
`:is(button[aria-pressed=true], …)` name no class at all yet the library claims
bare `button`). So the question was inverted to one that fails closed: a rule
is the preview's only if it names a class or id outside the `cr-` namespace.
The partition it produces is generated rather than transcribed, so the two
sides cannot drift. 75 rules and 238 declarations moved to the library, 50
stayed with the preview, and 2 were dropped from both.

**The second pass found four defects that were not divergences.**

- `.cr-button { padding: 10px 19px }` in `crystal.css`, against
  `component.action.paddingBlock: 15px` / `paddingInline: 24px` in
  `crystal.tokens.json`, `tokens.md`, crystal-react and the preview. The
  stylesheet matched nothing, including its own source of truth. `gap` was
  8px against a token of 9px. Nothing compared the hand-authored stylesheet to
  the token file, so there was no gate to fail: `build-tokens.cjs` and
  `build-reference.cjs` both read the tokens and neither reads `crystal.css`.
  `tests/core-contracts.cjs` now holds that comparison, and found the `gap`
  drift itself on its first run.
- `.cr-button.secondary`, `.quiet` and `.danger` carried fills from before the
  Resin surface existed. The component layer outranks the reset layer, so from
  the moment the surface was adopted all four button variants computed
  identically. That was measured. For secondary and quiet that matches
  `components.md` ("same semantics as primary") and the fills were stale. For
  danger it deleted the "independent danger boundary" the same page requires,
  a regression the first pass introduced and did not notice. The boundary is
  restored in the component layer, where it wins.
- `.cr-dock button[aria-pressed=true]` drew an underline under a selected dock
  label. Selection is carried by label weight alone. The preview's
  `text-decoration: none` already beat it, so it rendered nowhere, and it
  contradicted the specification wherever the stylesheet was read.
- The preview's `.cr-dock-inner` rule blanks `::before` for anything with that
  class, including `.cr-dock-inner.cr-stone`, the preview's own "Stone on
  Resin" specimen, which therefore renders with no Stone. That is filed and
  was not adopted: `components.md` says `.cr-dock-inner` shares the Stone
  recipe and `materials.md` says a label on a Resin dock takes its own chip,
  and Meridian decides which of the two is right.

**How the second pass was checked.** It was checked on rendered pages, and in
more states than the one where nothing was adopted. `controls.css` was toggled
on and off against a fixed library across 16 pages x 7 states x 2 modes:
233,226 elements, with every longhand compared. The states were default, hover,
keyboard focus, `[data-effects=opaque]`, a 600px viewport, forced colours, and
reduced transparency (Playwright exposes `prefers-reduced-transparency`, which
was confirmed by asking it). 104 differences remain on elements that belong to
Crystal, and all 104 are accounted for: 88 are the `.cr-dock-inner` exemption
above and the geometry that cascades from it, 14 are
`.export-controls .cr-button { padding-inline: 14px }`, where the preview
places a Crystal button inside its own furniture, and 2 are a `.cr-indicator`
inheriting `white-space: nowrap` from a `.tiny-button` around it. Both of those
were confirmed by reading the ancestor chain off the running page and not off
the stylesheet.

**What changed on the preview.** One thing changed. Comparing the site as it
ships against the site on this library, every computed difference is one of
three kinds. The first is the focus feather properties re-serialising, with
`color-mix(in srgb, #7338EF 46%,
transparent)` from the site's `:root` becoming `rgba(115, 56, 239, 0.46)` from
the library's theme. It is the same colour, inherited by all 1,134 elements,
which is why the raw count is 6,804. The other two paint nothing: the `gap`
correction, which applies to thirteen `.cr-button`s that all have a single
child box, and a `text-underline-offset` left behind by the removed dock
underline, which never drew because the preview already set
`text-decoration: none` over it.

Five frames in both modes, with a control focused so the ring paints, show
where the remaining pixels are: one band, at the top left of every page that
loaded, on the focused skip link. (Four pages loaded, not five. The capture
list asked for `/catalogue.html`, which this site does not have, because the
page is `docs/catalogue.html`. That frame was a 404 on both sides and its
"identical" verdict means nothing. The four that loaded all show the same
band.) The skip link's box, its rect and both its pseudo-elements are
identical. Its `box-shadow` differs:

```
shipped site   5 layers:  inset rim, then halo 6/16/30/54
this library   7 layers:  inset rim, then halo 6/16/30/54,
                          then 0 8px 18px and 0 22px 40px
```

That is D-11's first divergence arriving. The mechanism differs from the one
this entry first gave, which was that the preview's `:root` override had been
holding the layers off. `crystal-theme.css` contains no `@layer` at all, so
the unlayered theme outranks a `:root` sitting inside
`@layer crystal.component`, and the preview's override never won anything. The
theme itself changed: 2.0.0 exports a four-layer `--cr-focus-ring` and 2.1.0
exports six.

For Meridian: D-11's premise was that the preview had the two elevation layers
and the library did not. That was true of the preview's stylesheet and false
of its rendering. Neither the site nor the library painted those two layers
until 2.1.0. The divergence existed in the source and did not appear on
screen, which is why looking at the site never revealed it.

The only visible change this work makes to the documentation site is the change
that was asked for.

That comparison caught one thing a stylesheet diff could not. Written as
resolved `rgba()`, the sheen tints came back quantised to 8 bits, with 0.126
serialising as 0.125, for a worst channel delta of 2 across the playground.
`--cr-control-color` and `--cr-control-light` are therefore emitted as
`color-mix()`, which also keeps them tracking a product's overridden
`--cr-glow` and `--cr-decorative`. That is the only place this theme departs
from resolved values, and the departure is intended.

**Gates.** `tests/core-contracts.cjs` now holds the recipe: six layers with the
approved geometry in every mode, the feather alphas per mode, `--cr-focus-shadow`
at 27%, and the `var(--cr-focus-ring, …)` fallback in `crystal.css` matching the
exported theme. All three were proven by mutation. The earlier check compared
geometry only and the first four layers only, so that running it could not
freeze an undecided divergence. That reason expired with the decision.
`tools/validate-docs.cjs` no longer skips the elevation layers with a bare
`continue`, and counts its own checks instead of declaring a total.

**Two corrections to this entry as it stood.** It claimed
`tests/core-contracts.cjs` compared the exported halo against the rendered one.
That check went to `crystal-preview/tests/site-contracts.cjs` with the site in
D-12 and this entry was never updated, so for a day the tracker named a gate in
a repository that did not have it. The fix recorded on 20 September was also
incomplete: `crystal.css` carried a `var(--cr-focus-ring, …)` fallback still
spelling the withdrawn spreads 2/6/12/22, because the fix went into the
resolver and nobody opened the stylesheet. A consumer loading `crystal.css`
without the generated theme got the withdrawn halo for a further day.

Shipped as 2.1.0. It adds new public custom properties and five components that
were specified but absent, which makes it a minor release and not a patch.

---

## D-13 · The visual regression gate is red, and nothing was watching it

**Found 2026-09-20. Not fixed, and deliberately not blessed.**

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

**The cause is neither the restructure nor D-11.** The suite was run twice
against the same server, once with the corrected focus halo and once with the
withdrawn one restored, and the failures are identical to the pixel. The only
movement was five pixels on `playground-opaque`, which is antialiasing noise.
That is the expected result: the halo paints on `:focus-visible` and no
baseline frame has anything focused. The cause predates today.

**Why nobody knew.** `.github/workflows/verify.yml` runs the scroll, interaction
and deployability gates. It does not run `verify:visual` or `verify:floor`. The
visual gate is manual, and nobody ran it. It has been red for an unknown length
of time. The baselines were last touched on 2026-09-20 by the folder move,
which only relocated the files, so the last real capture is older than that and
the git history no longer distinguishes them.

**That list holds two different problems.** Seven frames differ by a maximum
channel delta under 20 with no pixel past the visible threshold. That is
sub-threshold drift, most likely a difference in rendering environment, which a
pixel baseline captured on one machine eventually reports on another. Two
frames, `catalogue` and `playground-dark`, have thousands of visibly changed
pixels and worst deltas of 229 and 52. Those are not antialiasing. On
`playground-light` the differences cluster in the right-hand control panel and
do not scatter along glyph edges, so that frame does not look like environment
drift either.

**Do not bless these baselines to make the gate green.** Blessing makes a real
regression the new reference, and at least two of these frames have not been
explained. This is an entry and not a fix for two reasons. Deciding what the
`catalogue` and `playground-dark` differences are needs the two images looked
at side by side. If part of it is environment drift, then the answer is a
tolerance or a pinned browser and not a re-capture.

**Where it lives now.** The baselines, the frame set and the whole visual gate
moved to crystal-preview with the site they photograph: `validation/baselines/`
and `tools/verify-frames.mjs` are there, and this repository has neither. The
entry stays here because the finding is about Crystal's appearance, and the
decision about what those two frames show is Crystal's to make.

**What to do, in order:** pin the capture environment (browser version is the
obvious candidate) so the question can be asked reproducibly; look at
`catalogue` and `playground-dark` before and after; then decide per frame. Then
wire whichever variant survives into crystal-preview's CI, which now has a
browser job and does not run this gate in it. The gate went unnoticed because
no job ran it.

**Closed 21 September 2026. Each of the nine frames was looked at, as this
entry required.**

**`catalogue.png`: a real change, and correct.** All 2,626 visibly-changed
pixels fall in one 15px band at `y 461–475`, and the band is a single line of
prose: the chapter is generated from `core/tokens/catalogue/` where the baseline
says `tokens/catalogue/`. That is the restructure that moved the library into
`core/`. The worst channel delta of 229 is dark text on a light ground, which
is what a text change looks like. The alarm "visibly different" was accurate,
and the difference is a correct change.

**`playground-dark.png`: not a change.** 11,358 pixels are past the threshold,
with a worst delta of 52, spread across `x 404–1213, y 348–808` and not
clustered. The two densest regions are the card-stack illustration behind the
headline and the segmented control; cropped and magnified, both are
indistinguishable. Both are multi-stop gradients on a near-black ground, which
is where GPU rasterisation dithers. A fixed absolute threshold of 24
corresponds to nothing visible there, because the same channel step that is
obvious on a light field is invisible at low luminance. The threshold is right
for the other seventeen frames and wrong for this one, so the frame was
re-captured. Weakening the threshold would have weakened it for every frame.

**The other seven** had no pixel past the threshold to begin with, and worst
deltas of 11 to 19. That is the sub-threshold drift a pixel baseline captured
on one machine eventually reports on another. This entry guessed that about
seven of the nine, and the guess was right.

**The entry's own instruction was followed in order:** look at the two, decide
per frame, then wire the survivor into CI. The entry did not anticipate that
the proof the gate rests on had gone missing. `validation/baselines/README.md`
and `verify-frames.mjs` both cite `tests/visual-gate-contracts.py` as the reason
the 400-pixel allowance is safe ("one black pixel on a grey field still fails
with the allowance set to a million"), and that file did not exist anywhere. It
was lost when the site moved to its own repository, so the safety argument for
the only gate that looks at Crystal's appearance rested on a test nobody could
run. It is restored, with four contracts. The fourth is the boundary itself: a
delta of 24 is forgiven and 25 is not, whatever the allowance says. Without it,
blessing would have rested on an unbacked claim.

**The gate is no longer manual.** Being manual is how it stayed red. It runs in
`crystal-preview`'s browser job on every push, as `verify:floor`. A runner has
no GPU, so `--no-webgl` excludes the frames that photograph WebGL output. That
is a smaller gate than the one a person runs locally, and the largest this
environment supports. Blessing is refused outright without WebGL2, so a green
CI run can never re-baseline anything.

Before reading a blessing commit's diff, know that `--bless` re-captures the
whole set, not only the failing frames. `haze-in-resin.png` was replaced too
and was never failing.

---

## M-3 · The catalogue asks a tree for roles it cannot have

**Closed 21 September 2026. The catalogue line was wrong, and it is fixed.**

`tree-view` specifies `role=tree/treeitem/group`, and in the same entry
specifies "expand controls" in its anatomy and "indentation guides" in what
Crystal supplies. Those two requirements are not compatible.

A `treeitem` in the ARIA tree pattern is a single navigable unit. The whole
widget is one tab stop and the arrow keys move between items. That defines the
pattern, and it means an item must not contain independently focusable widgets,
because there is no key left to reach them with. A row with a disclosure button
in it contains one.

`treegrid` is the pattern ARIA provides for this case. Rows still carry
`aria-level`, `aria-expanded`, `aria-posinset` and `aria-setsize`, the arrow
keys still walk the visible rows, and the keyboard can also move into a row to
reach the control inside it. React Aria's `Tree` implements `treegrid` and no
other pattern. The alternative in the same library, `NavigationTree`, is for a
nested set of links and drops selection entirely, and `tree-view` requires
selection.

Crystal React ships the `treegrid`. Every behaviour the catalogue asks for is
present and verified: level, expansion, full arrow-key navigation, selection by
label weight. Only the role names differ.

**What Meridian decides:** whether the catalogue line becomes
`role=treegrid/row/gridcell`, or whether the disclosure comes out of the anatomy
so a plain `tree` becomes possible. The first is a documentation change and the
second is a design change, which is why it is not made here.

Left open, not closed.

## The answer

The catalogue line becomes `role=treegrid/row/gridcell`. The disclosure control
stays in the anatomy.

This answer was inferred from what Meridian has already decided and was not
asked again, because the two standing rules both point the same way and
neither is ambiguous here:

- **Adopt, never drop.** Faced with a choice between keeping something and
  dropping it, keep it. The second option, taking the expand control out of the
  anatomy so a plain `tree` becomes possible, is the one that drops.
- **Specifications may be improved, never regressed.** Removing a control from a
  component's anatomy to make a role name fit regresses the specification to
  suit the documentation.
- The third D-11 answer said the docs should be updated to the values and
  specifications that were built and measured. Crystal React ships the
  `treegrid`, its tests assert it by name, and every behaviour the catalogue
  asked for (level, expansion, arrow-key navigation, selection by label
  weight) is present and verified. Only the role names in the catalogue were
  wrong.

`core/tokens/catalogue/02-navigation.json` now reads `role=treegrid/row/gridcell`
with `aria-expanded`, `aria-level`, `aria-posinset` and `aria-setsize`, and says
in the entry itself why it is not `role=tree`, so the next reader finds the
reasoning with the conclusion. `catalogue.json` and `core/docs/catalogue.md`
regenerate from it.

Nothing in Crystal React changes: it was already right, and the note in
`TreeView.test.tsx` that cites M-3 now cites a closed issue that agrees with it.

---

## D-5 · `IntersectionObserver` delivers nothing in the preview browser

While building Crystal React's `AppBar`, an `IntersectionObserver` created in the
in-app preview browser never fired. It did not deliver even its initial
callback, on a target with real area and an explicit root. A freshly
constructed observer in the page console behaved the same way.

That may be an environment limitation rather than a browser one, but it means any
Crystal work that relies on `IntersectionObserver` cannot be verified where the
rest of the visual work is verified. `AppBar` uses a passive scroll listener
instead and says why in its source.

Know this before `animate-on-scroll` or a virtualiser is reviewed the same way.

---

**Closed 22 September 2026. The limitation is real; the consequence drawn from
it was wrong.**

The observation stands: a fresh `IntersectionObserver` in the in-app preview
browser never fires, not even its initial callback. The sentence after it does
not stand: "it means any Crystal work that relies on
`IntersectionObserver` cannot be verified where the rest of the visual work is
verified."

The rest of the visual work is not verified in that browser. It is verified in
Playwright, in every case, in both repositories:

```
crystal-preview   capture-frames.mjs  verify-scroll.mjs  verify-interactions.mjs  audit-materials.mjs
crystal-react     verify-theme.mjs  verify-targets.mjs  verify-materials.mjs
                  verify-appearance.mjs  verify-behaviour.mjs
```

and in Playwright's Chromium the observer delivers its initial callback
correctly, with the right `isIntersecting` for a target held out of view:

```
IntersectionObserver: fired: 1 entry, isIntersecting=false
```

So the in-app preview browser is an authoring convenience with a gap in it, and
the gates run elsewhere, in Playwright. `AppBar`'s passive scroll listener
works and is not being changed. The note beside it should not be read as saying
that an observer could not be gated here. It could be.

This is the second claim in this tracker that turned out to be about the tool in
front of me and not about the world. D-4's scrollbar half was the first, in the
same sitting. In both cases an error message or an absence was read as a
statement about the environment, and the environment itself was not tested.

---

## D-16 · The preview suppresses Stone on `.cr-dock-inner` and blanks its own Stone specimen

**Found 21 September 2026. Fixed and closed 22 September 2026.**

*(Rewritten the same day. This entry first said two specification pages
disagreed about whether `.cr-dock-inner` is Stone, and that Meridian had to
choose. That was a misreading: the table in `materials.md` has the columns
**Situation | Wrong | Right**, and I read its "Wrong" column as a
recommendation. The pages do not disagree, and there is nothing for Meridian to
decide.)*

All three places the specification mentions this element say the same thing:

| Page | What it says |
|---|---|
| `components.md` | *Stone label backing … `.cr-stone`; `.cr-dock-inner` shares the recipe* |
| `materials.md` prose | *The dock's `.cr-dock-inner` uses the same recipe* |
| `materials.md` table | A label on a Resin dock. **Wrong:** give the label its own Resin chip. **Right:** give it a Haze content fill, **or Stone if the backdrop is unknown** |

The library follows all three: `.cr-dock-inner` is Stone-backed, and 2.1.0 keeps
it that way. The preview does not. `controls.css` carries

```css
.cr-dock-inner{background:transparent;padding:0;isolation:auto;}
.cr-dock-inner::before{display:none;}
```

which switches the Stone layer off. Because the second selector matches the
class and not the context, it also blanks `.cr-dock-inner.cr-stone`, the
markup of the preview's own Stone specimen on `playground.html`:

```html
<div class="study-floating cr-resin">
  <div class="cr-dock-inner cr-stone"><span>Stone on Resin</span>…</div>
</div>
```

So the card captioned "Stone · label backing — 55% light / 60% dark fill, now
with the same 1.95px feather as Haze" demonstrates no Stone. Measured on the
running site:

```
as the branch ships it    display:none   background:rgba(255,255,255,0.55)  filter:blur(1.95px)
with :not(.cr-stone)      display:block  background:rgba(255,255,255,0.55)  filter:blur(1.95px)
```

The fill and feather that come back are the ones `materials.md` specifies.

**Why it was not adopted or deleted.** The second adoption pass moves
everything that is Crystal's out of `controls.css`, and this rule is the one
thing left there that is about a Crystal component. Adopting it would put a
suppression of a documented material into the library. Deleting it restores
Stone on the preview's dock, which is a visual change on `playground.html` and
the docs shell, and six of the eighteen visual baselines are playground frames.
Re-blessing needs WebGL2 this machine does not have (D-15). So it stays,
named in `crystal-preview`'s `tests/site-contracts.cjs` `ALLOWED_RULES` with
this issue as its reason. It is the only rule in that file exempted for a
reason other than ownership.

**What to do**, for whoever has the hardware: narrow the selector to
`.cr-dock-inner:not(.cr-stone)` to fix the specimen with no other change, or
delete both rules to bring the preview back in line with the specification, and
re-capture the affected baselines either way.

## Fixed

Both rules are gone from `controls.css`, on `main` and on
`adopt-crystal-2.1.0`. The dock's `.cr-dock-inner` takes the library's Stone
recipe again, and the "Stone on Resin" specimen shows Stone.

**The blocker in this entry was not real.** It said re-blessing "needs WebGL2
this machine does not have (D-15)". `verify-frames.mjs` refuses only
`--bless` combined with `--no-webgl`, which would bless baselines captured with
WebGL2 deliberately blocked, and that is gate G8's business. It has never
refused to bless on a machine without WebGL2, and this machine has WebGL2: the
gate prints `"webgl2": "available"` on every run. I read a guard's error
message as a statement about the environment and did not read the guard's
condition. That is the same mistake as D-4's scrollbar half and D-5's, all
three in two sittings.

Eight baselines were re-blessed after looking at them, with the reason written
into `validation/baselines/README.md` as the procedure requires. Six normal
frames gain the protected label group; the two forced-colours frames change by
geometry alone, because the library keeps `.cr-dock-inner::before` hidden there
and removing the site's `padding:0` restores the library's `padding:3px`. Both
states were read off the running page before anything was blessed.

Removing the rule also made `crystal-preview`'s `ALLOWED_RULES` entry stale, and
the stale-exemption check reported it. That is the first time the check has
caught anything. `ALLOWED_RULES` is now empty, and the gate still goes red if
the suppression comes back.

---

## D-15 · The visual baselines are machine-specific, so the gate cannot run in CI

**Found 21 September 2026, by trying it. Fixed and closed 22 September 2026.**

D-13 closed with the gate wired into `crystal-preview`'s browser job, on the
argument that a manual gate is one nobody runs. That commit's own CI run failed
16 of the 18 frames:

```
docs-menu-forced-colours.png   46,058 pixels visibly changed, worst delta 255
icons.png                      25,866                        worst delta 229
playground-reduced-transp.png  12,297                        worst delta 192
overview-dark.png               7,531                        worst delta 230
docs-menu-light.png             7,098                        worst delta 229
catalogue.png                   5,075                        worst delta 229
…and ten more
```

The same frames pass locally at zero tolerance. The frames that fail hardest
are the text-heavy ones (the menu, the icon sheet, the overview), and the
deltas are at the extremes and not in the middle, which is what glyph edges
look like when they land on different pixels. A GitHub runner does not
rasterise type the way this machine does, so the comparison there measures the
font stack and not Crystal.

So the gate was taken back out within the hour. The reasoning: a gate that
fails on every push is worse than a manual one, because it teaches everybody to
ignore a red mark.

**What this establishes:** these baselines are machine-specific, and a pixel
baseline is only meaningful in the environment that captured it. D-13 suspected
this about seven of its nine frames and could not demonstrate it.

**What closing it takes.** Capture where you compare. That needs a second
baseline set, captured by a runner and committed from one: a
`workflow_dispatch` job that runs `capture-frames.mjs` and opens a pull request
with the result, and a gate that compares CI captures against CI baselines
while a person keeps comparing local captures against local ones. Two sets are
needed because the two environments draw different pixels and neither is
wrong.

**Do not** use a larger tolerance instead. The deltas are 192 to 255. A
tolerance that forgives them forgives anything, and
`tests/visual-gate-contracts.py` exists to prove the allowance cannot grow to
swallow a visible change.

**Until then the gate is manual**, which is the condition D-13 opened on. It is
now green, documented, and backed by the contract test that had gone missing,
so a run of it means something. The command is `npm run verify:visual` in
`crystal-preview`.

## Fixed: capture where you compare

The diagnosis was right and the conclusion drawn from it was too pessimistic.
"The baselines are machine-specific" does not mean a visual gate cannot run in
CI. It means a baseline is valid only for the renderer that produced it, and CI
was being given a baseline from another renderer.

There are now two sets:

- `validation/baselines` is the desk set, re-blessed by a person who looked at
  the images, as its README has always required.
- `validation/baselines-ci` is captured on the runner, by a
  `workflow_dispatch` job called *Capture runner baselines*, and committed.

`verify-frames.mjs` takes `--baselines <dir>`, `npm run verify:visual:ci` points
it at the runner set, and the `browser` job runs it. Both that job and the
capture workflow are pinned to `ubuntu-24.04` and not `ubuntu-latest`, because
a gate whose premise is "the renderer stays put" needs a fixed runner image.

**The measurement that closed it.** Comparing the two sets reproduces this
entry's numbers exactly: `docs-menu-forced-colours` 46,058 visible pixels,
`icons` 25,866, `playground-reduced-transparency` 12,297, `overview-dark` 7,531.
They are the same frames at the same magnitudes, measured a day later and from
the opposite direction, which confirms them. Against the runner's own set, the
same runner passes:

```
Scrolling, interactions, appearance and deployability: success
    The gate that proves the allowance cannot hide a change: success
    Appearance: success
```

**What it costs.** Two sets to keep in step, and a manual capture step when a
frame legitimately changes, which is written into
`validation/baselines-ci/README.md` beside the procedure. In return the gate
runs on every push, where the manual gate ran when somebody remembered. The
alternative considered and rejected was raising the tolerance until the desk
set passed on a runner, which would have left a gate that could no longer see a
real change.

**Still true:** these numbers are why a screenshot from one machine is not
evidence about another. The two sets are expected to differ permanently, and
neither is wrong.

---

## D-18 · The resizable table's keyboard path cannot be driven from a gate

**Opened 23 September 2026, building `resizable-table`. Closed the same day,
when the premise was found to be wrong.**

The entry said focus could not be driven into the resizer. Three ways of reaching
it from Playwright all left `aria-valuetext` at its initial value, so React
Aria's own state never moved. The entry concluded "this is about
reaching the control, not about the resize", and that conclusion was wrong.

**What is true.** Focus reaches the resizer. React Aria's `ColumnResizer` gates
its arrow keys on `editModeEnabled`, which is the table's
`isKeyboardNavigationDisabled`. `Enter` on a focused resizer calls `startResize`,
which turns off the grid's own arrow-key navigation and hands the arrows to the
resizer. Without that `Enter` the arrows arrive at the focused input, are not
`defaultPrevented`, and do nothing. That is the symptom the entry recorded and
misread as "focus never landed". React Aria announces the affordance: under
keyboard modality it describes the resizer with "press Enter to start resizing".
The keystroke cannot be guessed, and it was not guessed.

The original entry says `Enter` was tried "in case the resizer needs to be
engaged before arrow keys act, changes nothing". It was tried after the grid had
taken focus back, so the `Enter` went to the row. The resize needs focus on the
resizer and the `Enter` together, and each attempt had only one of them.

**How it was found.** Playwright could not answer the question, because every
failure looked the same from inside it: `aria-valuetext` was unchanged, and
nothing distinguished a control that had not been reached from one that had been
reached and had declined. Driving the real Storybook page through Claude in
Chrome, one key at a time with the DOM read between each, separated the two
cases. The resizer was `document.activeElement`, and `data-resizing` was absent.
Making that observation needed a tool that could pause between keystrokes.

**What now proves it.** `verify:behaviour` in `crystal-react` clicks the wrapper,
`[data-resizable-direction]`, presses `Enter`, then sends ten right-arrows. It
clicks the wrapper because the grid takes back a programmatic focus on a cell's
child, and the real input is a visually-hidden box the wrapper intercepts
pointers for. It asserts four things:

- the resizer reports `data-resizing` after the `Enter` (without this the three
  assertions below would measure keys sent to a control that never took them);
- the first column is drawn wider after the arrows than before;
- `aria-valuetext` changed and still reads in pixels;
- the width announced and the width drawn agree to within a pixel, under
  `table-layout: fixed`.

The last assertion was already there. React Aria applies each computed width to
its header cell as an inline style. Under `table-layout: auto` the browser may
override a width on a cell from the content, so a resizer can go on announcing a
width its column no longer has. The fixed layout that prevents this is React
Aria's own, set inline by `ResizableTableContainer`. For the same reason an
earlier attempt to guard that layout with a CSS rule guarded nothing: planting
`auto` in the stylesheet changed no computed value, because the inline style
outranks it.

**What the mistake cost.** One tracker entry told the next reader the control
was unreachable. An entry that says "cannot be driven" tells readers not to try,
and this one was written from three attempts that all lacked the same keystroke.
`read-the-guard-not-the-message` already records the lesson: "impossible" usually
describes the tool.

## D-20 · `action.minTarget` is published as 44px and every button renders 48px

**Found 24 September 2026, measuring for R-19 against the freshly published
2.1.0.** The defect is older than 2.1.0 and is not a regression in it. 2.1.0 is
the first version a consumer could measure it in.

Two rules in `assets/crystal.css` set the action control's target, and they
disagree:

    @layer crystal.reset     .cr-button              { min-height: 44px }
    @layer crystal.component :is(button,a.cr-button) { min-height: 48px }

The layer order is
`crystal.reset, crystal.base, crystal.component, crystal.override`, and a later
layer wins regardless of specificity. Every selector the reset declaration can
match is also matched by the component-layer rule, so the reset declaration
never renders for any element. A real `.cr-button` measures 48px in a browser.
This was confirmed by planting one into a page with 2.1.0 loaded and reading
`getComputedStyle`.

The package publishes `component.action.minTarget` as 44px, and that is the
value platform libraries consume. Crystal React reads it and renders its buttons
at 44px, so it does not match what Crystal's own stylesheet renders. That is how
this was found: a computed-style diff between the library's button and a planted
`.cr-button` differed on exactly two properties, and this was one of them. (The
other is `font-weight`: 700 in the library against 750 in core, from the same
pair of rules.)

**Why it matters.** It is not an accessibility failure, because 48px clears the
44px floor. It matters because the token and the rendering disagree, and the
token is the value that is published. Every platform library that follows the
contract and consumes the published value draws a control four pixels shorter
than the web preview, and is correct to do so.

It also means `tests/core-contracts.cjs` is green on a rule that never renders.
The 2.1.0 changelog says component geometry tokens are "bound to the
stylesheet and checked: `tests/core-contracts.cjs` compares the exported value
against the rule that is supposed to carry it", and the rule it compares against
is the one that never renders. The check reads a declaration and does not ask
whether anything downstream of it still applies.

**Where.** `core/assets/crystal.css`, the two rules above;
`core/tokens/crystal.tokens.json` at `component.action.minTarget`;
`tests/core-contracts.cjs` where the geometry assertions read the reset layer.

**What closing it takes.** This needs a decision from Meridian before a fix:

  1. Decide which value is Crystal. 44px is the published token and the
     documented floor. 48px is what every Crystal page has rendered.
  2. Make the other one agree. Either the token moves to 48px, or the
     component-layer rule moves to 44px and the reset rule is deleted as a
     duplicate.
  3. Make the contract test read the rule that renders instead of the first one
     it finds, so the two cannot diverge again. Plant it by changing one of them.

In either case the standing constraint applies: a material specification may be
improved, never regressed. Moving the rendered control from 48px to 44px reduces
a touch target. If 44px is chosen, the grounds should be that it is the
specification and still clears the floor.

---

**Closed 24 September 2026.** Meridian chose 48px.

The token `component.action.minTarget` moves from 44px to 48px, in the DTCG
source and in the flat runtime file. The round-trip gate treats a changed
material value as fatal, so the change had to be made explicitly in both files.
The reset-layer rule that said 44px and never rendered now says 48px, so the two
rules agree. All three platform exports and the reference table were
regenerated. `crystal-theme.css` is byte-identical, because this is component
geometry the stylesheet consumes and is not a theme property.

Moving the rendering down to 44px would have shrunk a touch target that people
have pressed at 48px since the control surface was adopted, and a material
specification may be improved and never regressed. 44px remains the floor
Crystal documents. 48px is above it and must stay above it.

**The check that missed it.** `tests/core-contracts.cjs` bound each geometry
token to the first `.cr-button` rule it found and did not check the rules that
came after. It now requires every other rule that could reach the same element
to agree. Pseudo-elements are excluded, because a `::before` is a different box,
and `border-radius: inherit` on the reading pad follows the control. The check
was planted on the original defect: restoring the 44px token beside the 48px
component rule fails it, with the sentence that would have saved two years.

One correction to the entry above: it attributed the `font-weight` difference to
the same pair of rules, and that was wrong. `font-weight: 750` is set once, in
the reset rule, and nothing overrides it. 750 is what Crystal renders. The React
library's 700 was a separate divergence and was fixed in that library.

## D-19 · Crystal specifies three continuous activity indicators and publishes no vocabulary for one

*(Opened 23 September 2026, building Crystal React's feedback slice. Filed on the
tracker as [boomerbowser/crystal#1](https://github.com/boomerbowser/crystal/issues/1)
on 24 September 2026, because closing it takes a decision, and the decision
needs a public place to be made.)*

**What is missing.** `core/tokens/catalogue/06-feedback.json` assigns the motion
of three components to Crystal:

- `loader`: "Crystal: Mark, **motion** and reduced-motion fallback", and
  "reduced motion replaces **spin** with a static, still-legible state".
- `skeleton`: "Haze fill with a slow **luminance sweep**"; "Crystal: Fill,
  **sweep**, reduced-motion fallback, resolve transition".
- `progress`: "Crystal: Track, fill, **indeterminate motion** and
  reduced-motion fallback".

`core/docs/motion.md` publishes fifty-four recipes and none of them is any of
those three. Every recipe Crystal has is a finite, spring-fitted transition from
one state to another. `busy` is explicitly "one cycle for an actual pending
operation", `attention` is "single finite cue… never flash or loop", and
`skeleton-resolve` describes the moment a skeleton is replaced and says nothing
about the time it spends waiting. The motion chapter also states that "no
effects autoplay or loop".

**Why that is a gap.** The two statements are both Crystal's and they
contradict each other: the catalogue asks three components to
spin, sweep and travel continuously, and the motion chapter says nothing loops
and provides nothing that does. A consumer cannot satisfy both, and the one
reading that is certainly wrong is "the catalogue means a spinner that does not
spin". A loader with no motion is indistinguishable from a static glyph, which
is the state the catalogue reserves for reduced motion.

**What a consumer did about it.** `crystal-react` shipped all three on
23 September 2026. Each continuous indicator takes one duration, `--cr-flow`,
which is Crystal's own published 1200ms, and authors only the shape of the
movement. For a travelling bar and a turning arc the geometry determines that
shape. All of them share one period, because two indicators in the same library
ticking at different rates is the same drift as two renderers doing it. Each is
multiplied by `--cr-motion-enabled` and divided by `--cr-motion-speed` like
everything else that moves there. Each is removed under
`prefers-reduced-motion: reduce`, where it becomes the static legible state the
catalogue asks for. There "static" means the whole track, because a travelling
segment frozen two fifths along reports a measurement nobody took. `Marquee` set
this precedent earlier in the same library, for the same reason.

**Why it should not stay there.** Two renderers that each pick their own spinner
period is the drift `component.chart.stroke` and
`component.progress.ringStroke` were added to prevent, one release ago. The
durations above are a stand-in for a specification Crystal has not published.

**Closing it needs a decision from Meridian first**, because it changes what
Crystal's motion chapter claims. One option is a small class of continuous
recipes: an activity period and its easing, distinct from the fifty-four
transitions, with the sentence about looping qualified to exempt them. The other
is a ruling that these three components carry no continuous motion at all, in
which case the catalogue entries for `loader`, `skeleton` and `progress` need
rewriting, and the three components in `crystal-react` need their motion
removed.

**Closed 28 September 2026, by Meridian's ruling on §4.1 of
[`2026-09-28-component-recipes.md`](2026-09-28-component-recipes.md): adopt what
the consumer renders, as a small class of continuous recipes.**

There are three recipes, in `core/tokens/motion-recipes.json`: `activity-turn`
(an indeterminate arc, for a loader or a progress ring), `activity-travel` (an
indeterminate bar) and `skeleton-sweep` (the skeleton's luminance sweep). All
three travel linearly at one period, `motion.flow`. That is the 1200ms Crystal
React had already chosen, and it is a published token, so "two indicators never
tick against each other" is a value a platform library reads. None carries a
spring, because a loop has no rest position to settle to. Under reduced motion
each becomes its whole track or fill, static.

**What keeps it from reopening the ambient tier.** The motion chapter's "no
effects autoplay or loop" is qualified to name the exception, and a tool
enforces the exception: `tools/validate-motion.cjs` refuses a looping recipe
that is not one of the three, a continuous recipe that does not travel, and one
at any period but `motion.flow`. Each rule was planted red before being trusted:
`press` made to loop, `activity-turn` at 1000ms, and `skeleton-sweep` set to
alternate. `continuousPolicy` in the recipe file says the same thing for a
platform library that reads data instead of chapters.

**The runtime had to learn it too.** `core/assets/motion.js` and
`core/engines.js` played every recipe once on an ease curve, so a continuous
recipe handed to them would have run a single cycle that surged and slowed. They
now repeat a continuous recipe until `stop()`, at constant speed, and leave out
the optical layers, because a feathered edge rippling for as long as something
is loading would be ambient motion. Measured in a browser against the bundled
engine: infinite iterations, linear, 1200ms. The same test against the previous
runtime gives one iteration on the default curve.

`loader`, `progress` and `skeleton` claim the recipes
(`tools/extend-catalogue-5.cjs` is the record). Crystal React binds them, which
closes the consumer's side.

## D-22 · The catalogue specifies a current-location dot that no recipe draws

*(Opened 28 September 2026, during Crystal React's R-24 sweep.)* `nav-link`'s
anatomy is "icon, label and current-location dot", with the dot among what
Crystal supplies, and the navigation category says "current location is a dot;
selection within a set is label weight". `.cr-nav-item` draws no dot, and neither
does the side menu it was lifted from. Crystal React keeps the dot the catalogue
asks for. Either the recipe gains the dot or the catalogue drops it.

**Closed 28 September 2026.** Meridian ruled that the recipe draws the dot,
respecting the material hierarchy. `.cr-nav-item` now draws a 6px primary dot on
`aria-current` only, and never on `aria-selected` or `aria-pressed`, which are
selection. The dot is absolutely positioned in the entry's own inline-start
padding, so the label does not move: measured, the label starts at the same
pixel at rest, current and selected. It is flat, with no material, shadow or
blur; stacked, it sits above the icon; right to left, it mirrors; under forced
colours it is `Highlight`. `tests/core-contracts.cjs` holds it, and was planted
red three ways: with the dot in the flow, over the label, and with a shadow.

## D-23 · The catalogue's surface field disagrees with its own prose and geometry

*(Opened 28 September 2026, during Crystal React's R-24 sweep; each measured.)*

- `nav-rail`: surface `[frost, nav-item]`, prose "Resin active destination".
  Crystal React follows the surface; the prose wants correcting.
- `resizable`, `image-compare`: surface `drag-handle`, prose "Resin handle".
  The drag-handle recipe is a grab-to-move grip. On a 4px splitter it adds 32px
  of padding and a dot grid, and over photographs it is a muted grip on no
  material. Crystal React wears neither; a splitter recipe or `resin` is wanted.
- `media-controls`: surface `resin-panel`, geometry "Pill".
- `tabs`, `segmented-control`, `toolbar`, `button-group`: surface `resin`, but
  measured, they render as `.cr-dock` (Resin with a Haze pad) in every material
  property, which is what their strip was measured from. `.cr-resin` is a
  different composition (sheen and optical rim, no pad).
- `dialog`: geometry "Content radius"; `.cr-dialog` draws the panel radius, and
  scrolls the surface itself, which Crystal's own edge-fade rule argues against.
- `tooltip`: geometry "18px radius", published only as prose. A token is wanted.

**Closed 28 September 2026.** Meridian ruled: fix the catalogue surfaces. The
change is recorded in `tools/extend-catalogue-6.cjs`, with the old values
quoted. Seven strips are `dock`, because each measured identical to `.cr-dock`:
tabs, the segmented control, the toolbar, the command bar, the action bar, the
button group and the split button. The vocabulary's `resin` and `dock`
descriptions say so now, `resin` being the plane with no reading fill of its
own. The resizable handle and the image comparison's thumb are `resin`, as their
prose said. The media controls are `resin` at the pill. The rich text surface is
a `field`. The rail's prose describes the navigation entry it is made of. The
dialog's geometry is the panel radius `.cr-dialog` draws. The tooltip's 18px is
the token `component.overlay.tooltipRadius`. Two items were not surface
questions, the dialog scrolling its own surface and overlays inside a pane, and
they moved to D-25.

## D-24 · The field shell's boundary measures 1.06:1

*(Opened 28 September 2026.)* `.cr-field-shell`'s border is the white rim.
Measured against the page it sits on: 1.06:1 in light mode and 1.63:1 in dark,
against the 3:1 `accessibility.md` states for control boundaries. The
documentation site renders fields that way. Crystal React's fields use
`--cr-outline` (6.55:1 / 8.83:1) and have not adopted the class, because doing so
regresses every form. The ruling is Meridian's: adopt the rim, or give the field
shell a boundary that meets the stated threshold.

**Closed 28 September 2026.** Meridian ruled that Crystal React adopts the field
shell as written, rim included. The measurement stands and is recorded where a
reader meets it: `docs/accessibility.md` now states that the rim measures 1.06:1
and 1.63:1, is treated as decorative, and that a field is identified by its
shell's fill and float shadow, its Haze well and its visible label. The token
checks cover none of those.

## D-21 · Crystal specifies a hover treatment for its button that layer order erases

**Ruled 29 September 2026:** delete the reset rule; Crystal's button has no hover lift, and the `hover` caustic is its pointer affordance. `.tiny-button` (4.4) moves to the preview. See [`2026-09-29-rulings.md`](2026-09-29-rulings.md).

**Found 24 September 2026, by Crystal React's R-19 sweep. It is the same kind
of defect as D-20.**

`controls.css` writes a hover treatment for the action button:

    .cr-button:hover { box-shadow: var(--cr-shadow-content); filter: brightness(1.04) }

That rule is in `@layer crystal.reset`. Two rules in `@layer crystal.component`
land on the same element:

    :is(button, a.cr-button, .cr-control, …) { box-shadow: var(--cr-shadow-float) }
    :is(button, a.cr-button):hover           { background: var(--cr-resin-fill); filter: none }

A later layer wins regardless of specificity, so the component layer takes both
halves: `filter: none` cancels the brightness lift, and the resting
`--cr-shadow-float` outranks the hover `--cr-shadow-content` even though the
hover rule is more specific. Crystal's button has no hover treatment. Measured
in a browser, a `.cr-button` and a bare `<button>` are identical at rest and on
hover, in every one of `background`, `filter` and `box-shadow`.

This is the same defect as D-20: a rule authored in `crystal.reset` that the
component layer erases, published and rendering nothing. It was found the same
way, by planting Crystal's own element beside a consumer's and diffing the
computed style.

**Which of the two is wanted is Meridian's call, and they are different designs.**
`crystal.component` says the resting state of a Resin control already is the
floating state, so there is nowhere further to lift. On that reading the reset
rule is stale and should go. `crystal.reset` says a pressable control brightens
and settles toward the surface when the pointer is over it. On that reading the
component rule needs a hover clause and the treatment should move into it. The
present state, where the stylesheet says one thing and renders the other, is not
wanted.

**Crystal React has stopped compensating for it.** The library had
`filter: brightness(1.04)` on `[data-hovered]`, attributed in a comment to
"the one Crystal writes for its own filled button". That is the reset rule,
which does not render. The R-19 sweep deleted it, so the library now matches
what Crystal renders. If the reset rule is made to render again, the library
inherits it with no change.

**Closed 29 September 2026.** Meridian ruled the component layer's reading
correct: the reset rule is deleted, Crystal's button has no hover lift, and the
`hover` caustic is its pointer affordance. Nothing that renders changed. The
other half of the proposal's 4.4 went with it: `.tiny-button`, the site's class,
left `motion.css`, and crystal-preview carries its transition. A contract in
`tests/core-contracts.cjs` refuses both returning, seen red against the
stylesheet of that morning.

## D-26 · The dock surface names controls `.cr-dock` cannot reach, and a grouping it does not draw

**Ruled 29 September 2026:** the dock's control rules extend to tabs, radio labels and links through `:where()`; a button group and a split button are a new surface, `group` (`.cr-group`). See [`2026-09-29-rulings.md`](2026-09-29-rulings.md).

*(Opened 28 September 2026, by Crystal React's adoption of the corrected surfaces.)*

D-23 named nine components as the `dock` surface. Two things stop a consumer
wearing `.cr-dock` for all of them as written:

- **The dock's controls are keyed on `button`.** `.cr-dock button`, its selected
  rule `:is([aria-pressed=true],[aria-selected=true])`, its focus rule and its
  forced-colours ring reach only a `<button>`. A tab is commonly
  `[role=tab]` on another element, a segmented control is commonly radio inputs
  inside labels, and a dock or bottom-navigation destination is a link carrying
  `aria-current`. None of them is reached. Crystal React restates the dock-button
  values on those three and compares them with a planted `.cr-dock button` in a
  gate. That is correct today, and it is a second copy. Closing it: extend the
  dock's control selector to `[role=tab]`, a label holding a radio
  (`label:has(input[type=radio])`, selected by `:checked`), and `a` (selected by
  `aria-current`), in a way that does not raise the specificity of the existing
  `button` rules consumers already sit against.
- **A button group and a split button are docks whose segments touch.** The
  catalogue asks for "interior corners square against neighbours" and "a hairline
  between the two targets". `.cr-dock` spaces its buttons 4px apart inside 9px of
  padding and rounds each one to a pill, so wearing it would mean overriding the
  class back. Crystal React keeps its own grouped geometry and restates the dock's
  material, now with the rim it lacked. Closing it: a grouped variant of the dock
  (no padding or gap, the children square inside and the pill outside, and a
  hairline in `--cr-edge` between them), or a ruling that a group is a different
  surface.

**Closed 29 September 2026, in 2.3.0.** The dock's control, selected, hover,
narrow-screen and forced-colours rules reach `[role=tab]`, a radio label and a
link, all inside `:where()`, so no existing selector's specificity moved. A
group is a surface of its own, `group`, which Meridian chose over a dock
variant. `.cr-group` is one Resin plane whose controls touch, pill outside,
square inside, a hairline between, with `.vertical`. `button-group` and
`split-button` name it. Measured in a browser on
`proposals/2026-09-29-rulings/examples`: a tab, a radio label and a link each
take a dock button's fill and height, and the group's corners, hairline and rim
hold. The same checks were red against the stylesheet of that morning.

## D-27 · Two small marks the compact and indicator recipes do not reach

**Ruled 29 September 2026:** a compact count size, `.cr-resin-haze.count`; the field glyphs keyed on `.cr-field-shell` whatever its element. See [`2026-09-29-rulings.md`](2026-09-29-rulings.md).

*(Opened 28 September 2026, by Crystal React's per-surface check.)*

- **A count badge is `compact`, and `.cr-resin-haze` is sized for a tag.** Its
  Haze pad is inset by `--cr-haze-inset`, 8px, and its block padding is a tag's
  17px. On a 20px count badge the first leaves a pad a few pixels across with the
  digit mostly outside it, and the second makes the badge 55px tall. Crystal
  React releases both on its badge and fills to the badge's own edge; its gate
  names the inset as the one allowed difference. Closing it: a compact size for
  counts (the inset scaled to the mark, no block padding), or a ruling that a
  count badge is a different surface.
- **The indicator's field glyphs are keyed on `span.cr-field-shell`.** ○ idle,
  ● focused, * required and ! invalid are drawn only when `.cr-indicator` is a
  child of a `span` field shell. A field shell that holds a label, a textarea or
  a row of chips is a block, and a consumer writes it as a `div`, as every one
  in Crystal React is, so the glyphs never reach it. Closing it: key those rules
  on `.cr-field-shell` whatever its element, or on a `data-` attribute the field
  sets, without disturbing the `span` form's own padding rule. Crystal React's
  `Indicator` waits on this (its R-25).

**Closed 29 September 2026, in 2.3.0.** `.cr-resin-haze.count` is the
compact display sized for a count: a 20px circle that grows to a pill, filled
to its own edge, no block padding, one line. The field glyphs are keyed on
`.cr-field-shell` whatever its element, and a block shell makes the same room
for the glyph as the inline one. Both were measured in a browser, and both were
red against the stylesheet of that morning. Crystal React's R-25 follows.

## D-28 · Motion the catalogue assigns that no component can play as written

**Ruled 29 September 2026:** all five assignments come off the catalogue. See [`2026-09-29-rulings.md`](2026-09-29-rulings.md).

*(Opened 28 September 2026, by Crystal React binding every assignment in 2.2.0.)*

Crystal React now plays the motion the catalogue gives its components, bound to
state and checked in a browser. A few assignments cannot be honoured by any
implementation, because of what the catalogue says. Each wants either a narrower
assignment or a ruling:

- **`page-in` and `page-out` on navigation**: NavLink, the rail, the dock, the
  bottom bar, the stepper, checkout steps. These recipes mark "a new local view
  after routing is committed". The product renders that view, and the
  navigation does not. The navigation's own motion is `selection`, which it
  plays. The assignment belongs to the view, or to a routing surface the
  catalogue does not have.
- **`busy` on progress and the loader**: "one cycle for an actual pending
  operation". D-19 gave pending work continuous recipes (`activity-turn`,
  `activity-travel`), which these play, and a one-shot cycle beside a loop
  answers the same question twice. `activity-turn` on a linear progress bar is
  the same question: it plays `activity-travel`.
- **`resin-confluence` on the floating action**: the recipe's own text is "a
  visual study, not an application action".
- **`reaction` on the authored bubble**: the entry's anatomy has no reactions to
  toggle.
- **`slider-step` on the colour area, slider and wheel**: the recipe is for
  "range outputs, steppers and scrubber labels", and these controls have no
  readout. The thumb is the only thing that moves, and its position is the
  value. Either the entries gain an output, or the recipe comes off them.

**Closed 29 September 2026, in 2.3.0.** Meridian ruled all five off, with none
honoured by growing a component. `tools/extend-catalogue-7.cjs` records the old
values: the six navigation entries keep `selection`; progress plays
`progress-change` and `activity-travel`, the loader `activity-turn`; the floating
action `press`; the authored bubble `message-in`; the colour controls nothing.
`busy` and `reaction` were then claimed by no component, and the build refuses
an unclaimed recipe, so a second question was asked and both were withdrawn.
The motion vocabulary is 59 recipes.

## D-29 · A component listed twice, and a dialog class that centres only a `<dialog>`

**Ruled 29 September 2026:** keep `virtualizer` and remove `virtual-scroller` (284 components); `position: fixed` keyed on `dialog.cr-dialog`. See [`2026-09-29-rulings.md`](2026-09-29-rulings.md).

*(Opened 29 September 2026, by Crystal React finishing its blocks.)*

Two findings from the last slice. Both are small, and both belong to Crystal and
not to the library:

- **The catalogue lists the virtualizer twice.** `virtual-scroller` in
  `05-data-display.json` ("a long list that renders only what is near the
  viewport", parity `primereact:virtualscroller`) and `virtualizer` in
  `09-utility.json` ("renders only what is near the viewport, for lists, grids
  and tables", parity `react-aria:Virtualizer` and the same primereact
  component). The states and the material are identical, and the utility entry's
  semantics (set counts across recycling, a focused row never dropped) are the
  data-display entry's with one clause added. Crystal React maps its one
  `Virtualizer` export to both ids and verifies the fuller set of promises in a
  browser, so parity reads correctly either way. But the catalogue's count of 285
  includes one component twice, and every other platform will build it twice or
  wonder why not. Closing it: keep `virtualizer` (its semantics are the complete
  ones and its parity names both references), remove `virtual-scroller`, and let
  the count become 284. That moves `libraries/parity.json` and the figure the
  documentation quotes, so it is Meridian's to decide.
- **`.cr-dialog { position: fixed }` centres only a native `<dialog>`.** The
  browser gives a modal `<dialog>` `inset: 0` and auto margins, and a fixed box
  with those is centred. Any other element that wears the class keeps its static
  position, and React Aria's dialog is a `section`. Its top-left corner is at the
  middle of the screen and, on a phone, half of it is past the right edge.
  Crystal React wore the class from 2.2.0 and every dialog shipped that way until
  a screenshot showed it. It now overrides the position and measures where the
  dialog opens. Closing it: key the rule on `dialog.cr-dialog`, or give the class
  the offsets and margins the browser supplies to a `<dialog>`, so that the class
  means the same thing on any element. The surfaces vocabulary already assumes
  the native element: it pairs the class with `.cr-dialog::backdrop`, which only
  a `<dialog>` has. Either is a change to generated CSS. The preview wears the
  class only on native `<dialog>` elements (the specification dialog and the
  suite drawer), so the first would render it exactly as it does now.

**Closed 29 September 2026, in 2.3.0.** `virtual-scroller` is removed and
`virtualizer` remains; the catalogue is 284 components, and `web.json` and
`parity.json` moved with it. `position: fixed` is keyed on `dialog.cr-dialog`:
a native modal dialog is centred as before, and on any other element the class
is the material. Measured: a native dialog opens centred at 1280x900, and a
`section.cr-dialog` is not fixed.

## D-17 · `forced-colours-dark` differs on the runner about one run in two

**Ruled 29 September 2026:** hunt it now, by dispatching the visual job repeatedly on the runner, and close on the evidence. See [`2026-09-29-rulings.md`](2026-09-29-rulings.md).

*(Opened 22 September 2026.)*

**What happened.** The first push to `crystal-preview` after the visual gate went
into CI failed on one frame:

```
FAIL forced-colours-dark.png: 287 of 1152000 pixels differ (0.0249%),
worst channel delta 229; 231 pixel(s) changed visibly (delta over 24)
```

Re-running the same job on the same commit, with no change of any kind, passed
23 of 23. So the frame is nondeterministic on the runner.

**Why it matters more than 287 pixels.** People learn to re-run a gate that
fails at random and stop reading it, and the next real regression arrives
looking like this one. It is also the failure mode D-15 was closed to prevent.
D-15's "capture where you compare" fixed systematic disagreement between the
desk and the runner, and this is the random disagreement that remains.

**What is ruled out.** The commit that first showed it changed only class names
on buttons: `cr-button secondary` to `cr-button`, and `cr-button` to
`cr-button primary`. Neither class has a rule in the 2.0.0 the site installs,
neither appears in any of the site's three stylesheets, and the same build is 23
of 23 identical against the desk baselines. The markup is not the cause.

**What is not yet known.** Which 287 pixels differ. The gate captured to a
temporary directory that the process deleted when it exited, so the first
failure it produced left nothing to look at. That is now fixed: `verify-frames`
takes `--keep`, and the CI job uploads `actual-` and `expected-` for every
differing frame on failure.

**It does not reproduce on the desk.** 23 September 2026: the frame was captured
eight times, each in a fresh browser context with the frame's own settings
(`forcedColors: 'active'`, `colorScheme: 'dark'`, `deviceScaleFactor: 1`, 1280×900,
900ms settle), and each compared against the first with
`tools/compare-captures.py --tolerance 2 --max-differing 400`, which is the
gate's own comparison at the gate's own tolerance. Seven of seven came back
SAME. Eight captures do not prove determinism, but they show the nondeterminism
is not cheap to reproduce here, so the artifact from the runner remains the way
to find it.

**Two of the three candidates are now ruled out by measuring the baseline**
(`validation/baselines-ci/forced-colours-dark.png`, 1,152,000 pixels):

- *The atmosphere gradient's dither.* There is no gradient left to dither.
  92.03% of the frame is pure black and 2.98% is pure white; the intermediate
  greys are 3.46%, and they are spread over a bounding box of 44,0 to 1235,877.
  That is glyph anti-aliasing across the whole frame, and not a shaded region
  with banding seams in it. A seam moving one quantisation step would also be a
  small delta, and 231 of the 287 pixels crossed the gate's visible threshold of
  24.
- *The Manrope fallback resolving differently.* A different typeface moves every
  glyph edge. There are 39,828 anti-aliased glyph pixels in this frame; 287 is
  0.7% of them. A font swap cannot be that small.

**What the magnitude does say.** In a frame that is 95% two pure tones, 231
pixels changing by up to 229 is one small thing drawn or not drawn at full
contrast. For scale, the string `15.78:1` in this frame is 187 pixels of ink
above that same threshold. Whatever it is, it does not reflow: if the thing that
changed had altered any inline box's width, the text after it would have moved
and the count would be in the thousands. So the candidate is something painted
in place (a caret, a focus ring, a hover or pressed state, a glyph substitution
of equal advance) and not a piece of content arriving late. (`#contrast-metric`
is the only readout in this region whose shipped markup, `—`, differs from what
`site.js` renders. It is therefore the one element that would show a
half-rendered page, and it would show it by reflowing the label beside it, which
did not happen here.)

**Closing it needs** the next occurrence with the artifact `verify-frames --keep`
now writes and the CI job now uploads: `actual-forced-colours-dark.png` beside
`expected-`, differenced, to say where the 287 pixels are. That image has to be
read against the three sentences above.

---

**Closed 29 September 2026, on the evidence of a hunt** (ruled that day: "hunt
it now"). The visual gate was run 20, 60, 60 and 60 times at once on the pinned
runner image, from a temporary workflow on a branch of crystal-preview.

The failure was not specific to that frame. Every select-text failure was the
playground's typeface `<select>`: 287 or 288 pixels, the word "Manrope" set
0.8px high inside a box that did not move, in `forced-colours-dark` and
`-light`, `playground-rtl` and `playground-reduced-transparency` alike. That is
the "something painted in place that does not reflow" this entry predicted:
Chromium lays a native select's text out itself and, one run in twenty, keeps a
layout from before the page settled.

| Round | Capture harness | Runs | Select text | Mid-transition |
|---|---|---|---|---|
| 1 | as it was | 20 | 1 | 0 |
| 2 | every font face loaded first | 60 | 5 frames in 4 runs | 0 |
| 3 | and every select laid out again | 60 | 0 | 1 |
| 4 | and every finite animation awaited | 42 | 0 | 0 |

Round three's one failure was different: a button's rim photographed a sub-pixel
into a transition in `focus-ring-light`. Round four waits for every finite
animation, bounded at three seconds, before the picture is taken. Both fixes are
in crystal-preview's `tools/capture-frames.mjs` (commit `a65821c`). That gives
102 runs without the select failure and 42 without the transition failure. Round
four's other eighteen jobs were not started: GitHub reported that the account's
recent payments had failed or its spending limit needed raising.

## D-4 · The phone leg of `verify-scroll` proves behaviour, not appearance

**Ruled 29 September 2026:** a real Android phone over ADB, as a device leg of `verify-scroll`; Meridian supplies the device. See [`2026-09-29-rulings.md`](2026-09-29-rulings.md).

**Built 29 September 2026, waiting on the phone.** crystal-preview's
`npm run verify:scroll:device` (`tools/verify-scroll-device.mjs`) runs the scroll
contract in Chrome on a connected Android phone and measures what emulation
cannot: whether content shifts when a scrollbar appears, as a container's
content width with its block overflow on and off. On desktop Chromium with
classic scrollbars that measurement reads 0 for a stable gutter and 15 without
one, so it discriminates. It closes this entry the first time it runs green on a
device. The phone needs USB debugging with this computer allowed, and Chrome's
"Enable command line on non-rooted devices" flag, which Playwright's Android
driver requires.

*(Halved 22 September 2026. This issue held two claims. The first was wrong and
its half is closed. The one below is left, and it has now been demonstrated.)*

**The claim that was wrong.** D-4 said: "Headless Chromium paints no scrollbar at
all, so no reference frame contains one," and concluded that closing it needed
"a browser that paints classic scrollbars headlessly." Headless Chromium can
paint them. Playwright pushes `--hide-scrollbars` whenever `headless` is
true:

```
arm A  default headless                          scrollbar 0px
arm B  ignoreDefaultArgs: ['--hide-scrollbars']   scrollbar 15px
arm C  ignore it, then pass it back explicitly    scrollbar 15px
```

Arm C is consistent with the other two: `ignoreDefaultArgs` filters the final
argument list, so it strips the flag again even when it is passed by hand. With
the flag present there is no scrollbar, and with it absent there is a classic
15px one. `crystal-preview` now has `scrollbar-resin` and `scrollbar-frost`
frames that opt out of the flag. Both were mutated at the resolver and seen to
go red: the Resin thumb from 80% to 50%, the Frost thumb from ink to primary,
each failing its own frame and only its own frame.

**What remains.** Playwright's mobile emulation uses overlay scrollbars, where
`scrollbar-gutter` is a no-op. It does so independently of the flag, which the
first claim had missed:

```
desktop, flag dropped            scrollbar 15px, scrollbar-gutter:stable
mobile emulation, flag dropped   scrollbar  0px, scrollbar-gutter:stable
```

So the phone leg of `verify-scroll` proves that swipes stop chaining, and cannot
prove that a gutter reserves space, because on that device nothing ever reserves
space. Closing this needs a real device. It is stated in `verify-scroll.mjs` and
in the capture README where a reader meets it.

**Documented, not closable here.** It was left open until a real device could
close it, and was not marked done.

---

**Closed 29 September 2026, on a Pixel 6 Pro.** Meridian ran
`verify:scroll:device` on the phone, and it passed. It passed on fifty-one
containers that all scrolled across, because on a phone the pages show no
vertical scroller at rest, so the shift question was never asked. The script now
fails closed on that, and opens the playground's specification dialog with the
exported CSS through the site's own control. The next run measured the dialog's
code block: 0px shift on the device, no failures. It also reported that block's
`scrollbar-gutter: auto`, which on a desktop moves its text 10px. That was fixed
in 2.3.1, and `verify-scroll` itself now opens and measures it.

## D-25 · Three findings from the surface sweep that are not surface questions

**Ruled 29 September 2026:** the dialog scrolls a `.cr-dialog-body` child; a recessed overlay recipe is authored for overlays inside a pane; the preview moves to the latest published core and is re-baselined. See [`2026-09-29-rulings.md`](2026-09-29-rulings.md).

**Built in 2.3.0:** `.cr-dialog-body` and `.cr-haze.overlay`, both measured in a browser. The third finding is built too, on crystal-preview's `adopt-crystal-2.3.0` branch: the site installs 2.3.0 from the registry, its tests, scroll, interaction and deploy gates pass, and the seven frames 2.3.0 changes are identified and explained in that commit. What remains is re-capturing the runner baselines with the capture workflow, then looking at every frame and merging. GitHub refused to start that workflow on 29 September because the account's recent payments failed or its spending limit needs raising. Crystal React's material gate already compares against the site on 2.3.0.

*(Opened 28 September 2026, split from D-23 and D-24 when those were ruled.)*

- **A dialog that scrolls its own surface.** `.cr-dialog` sets `overflow: auto` on the
  surface. Crystal's edge-fade rule is the argument against it: a mask fades an element's
  own fill and border along with its content, so a surface that scrolls dissolves itself.
  A title that scrolls out of a tall dialog also takes its context with it. Crystal React
  scrolls the body inside a surface that does not, and keeps doing so until this is ruled.
- **An overlay inside a pane has no Crystal recipe with a visible boundary.** On the page an
  overlay is `.cr-frost`. Inside a Haze pane it recesses into Haze, and `.cr-haze` has no
  edge and no shadow, so a menu drawn that way over a Haze dialog cannot be told apart from
  the dialog. Crystal React keeps its own recessed Haze there, with an edge and the content
  shadow.
- **The documentation site vendors Crystal 2.0.0**, two releases behind, so Crystal React's
  material-parity gate compares against a Crystal that no longer ships.

**Closed 29 September 2026.** The dialog body and the recessed overlay are in
2.3.0. The preview installs 2.3.0 from the registry; its runner baselines were
re-captured on the pinned image, five frames changing visibly, each explained in
crystal-preview's `website/verification/captures/2026-09-29-crystal-2.3.0/`;
its `main` passes CI on them. Crystal React's material gate compares against it.
The re-capture had been refused for a while that day: the repository was then
private, its jobs drew on the account's included Actions minutes, and GitHub
declines jobs with a payments-or-spending-limit message once those are used up.

## D-30 · An optional editor engine binding

**What.** The catalogue says the rich text surface's engine is the product's,
and Crystal React kept to that: `RichTextSurface` takes any engine. Meridian's
brief of 2 October asked for headings, lists, checklists, underline,
strikethrough and touch support, which an engine-agnostic surface cannot give
a product. Crystal React now also ships `RichTextEditor` from its own entry,
`@crystal-ui/react/editor`, binding TipTap 3 to Crystal's format vocabulary,
with TipTap as optional peer dependencies. The main entry reaches no TipTap
module.

**Why it matters.** Every platform library will meet the same request. If one
binds an engine and the others do not, "the rich text surface" means different
things on different platforms.

**Options.** (a) A library may ship an optional binding from its own entry
point, the engine an optional peer; the catalogue says so and names the format
vocabulary as the contract **(rec.)**. (b) Bindings live outside the libraries,
as separate packages. (c) No bindings; remove `@crystal-ui/react/editor`.

**Where.** `core/tokens/catalogue/04-inputs.json` (`rich-text-surface.note`),
Crystal React `src/editor/`. **Closing it:** the ruling, applied to the note;
for (c), deleting `src/editor/`, `src/editor.ts` and the `./editor` export,
which breaks nothing else. Task C-T2.

**Ruled on 2026-10-02 by Meridian Digital: (a) A library may ship an optional binding from its own entry point, the engine an optional peer; the catalogue names the format vocabulary as the contract.** C-T2 becomes ready; unblocks R-T7. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). The entry stays open until the work is built (task C-T2).

**Closed** on 2 October 2026 by C-T2. `tools/extend-catalogue-9.cjs` writes the ruling into the rich text surface's note: a library may ship an optional engine binding from its own entry point, the engine an optional peer, and the format vocabulary is the contract the binding implements. Crystal React's `@crystal-ui/react/editor` is that binding, as built.

## D-31 · Material presets as entrances

**What.** No component plays the `plastic`, `resin`, `haze` or `stone`
presets, and none plays the five material compositions. `presets.js` calls the
presets "the movement a material makes when it enters or leaves"; `motion.md`
calls them replay studies. They are now visible (Crystal React's motion
catalogue story, the proposal's `motion.html`), and nothing else changed.

**Options.** (a) They stay studies in 2.x; `presets.js` says so; entrances are
decided per surface in 3.0 against the approved baseline **(rec.)**. (b) Each
surface a person opens names its preset now: Frost for a side sheet, Resin for
a floating transport appearing, Plastic for a new view. (c) Withdraw the five
from the package.

**Where.** `core/assets/core/presets.js`, `core/docs/motion.md`. Task C-M1.

**Ruled on 2026-10-02 by Meridian Digital: (a) They stay studies in 2.x, presets.js says so, and entrances are decided per surface in 3.0.** C-M1 becomes ready. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). The entry stays open until the work is built (task C-M1).

**Closed** on 2 October 2026 by C-M1. `presets.js` and `motion.md` both say the five material presets and the five compositions are studies in 2.x, which no catalogue entry assigns; only `mirage`, `mirage-out` and `dismiss` are entrances and exits, on the dialog and its scrim. **Carried to 3.0:** which preset each surface a person opens enters with (Frost for a side sheet, Resin for a floating transport) is decided per surface, against the approved baseline. There is no 3.0 plan yet; this entry is where the question is recorded until there is.

## D-32 · Twenty assignments no component plays

**What.** With composition credited, 20 of 338 motion assignments across 15
entries are played by nothing (proposal, F-5). Eleven cannot be played by the
component as written; two are the product's child menus; seven are gaps in
Crystal React.

**Options.** As D-28: (a) take off `list-out` on the transfer list, the data
table and the resizable table, `accordion-out` on the tree view, navigation
tree, organisation chart and spoiler, `page-out` on master and detail and
`list-in` on the combobox; say in prose that the menubar's and split button's
menus are the product's; keep the rest as Crystal React tasks **(rec.)**.
(b) Grow each component to play them.

**Where.** `core/tokens/catalogue/`. Task C-M2.

**Ruled on 2026-10-02 by Meridian Digital: (a) As D-28: take off the eleven the components cannot play, say in prose that the menubar's and split button's menus are the product's, and keep the rest as Crystal React tasks.** C-M2 becomes ready. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). The entry stays open until the work is built (task C-M2).

**Closed** on 2 October 2026 by C-M2. `tools/extend-catalogue-9.cjs` takes off the assignments the ruling names, and gives the menubar and the split button notes saying their menus are the product's children. The ruling and the proposal called the removals "eleven"; the list they name is nine (list-out three times, accordion-out four times, page-out and list-in once each), and with the menus' four and Crystal React's seven gaps it accounts for all twenty. The seven gaps stay assigned and are Crystal React tasks R-A3 to R-A5.

## D-33 · What "an intelligent cursor" means

**What.** The brief asked for an intelligent cursor. Crystal React built this
reading of it: formatting state follows the caret; a gap cursor lets the caret
stop between two blocks that are not text; a drop cursor shows where a drag
lands; Markdown typed at the start of a line becomes its block; a format
changed by a shortcut is announced; Alt+F10 moves focus to the toolbar.

**Options.** (a) That is what was meant **(rec.)**. (b) It meant something
else, such as a caret drawn by Crystal or caret-following suggestions, to be
specified.

**Where.** Crystal React `src/editor/RichTextEditor.tsx`.

**Ruled on 2026-10-02 by Meridian Digital: (a) That is what was meant.** Records the answer; no task changes. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). Nothing is left to build; the entry closes with the next tracker review.

**Closed** on 2 October 2026 with the ruling. Nothing was left to build.

## D-34 · Highlight and selection

**What.** `mark` and the editor's selection would both have been primary-soft,
so a highlighted word that is then selected would not look selected. The
selection is now a 28% primary tint under unchanged text, and `mark` keeps the
primary-soft pair that `Prose` renders.

**Options.** (a) Keep both as built **(rec.)**. (b) `mark` takes the attention
pair (the highlighter's yellow), a visible change to `Prose`.

**Where.** `core/assets/crystal.css`. Task C-T1.

**Ruled on 2026-10-02 by Meridian Digital: (a) Keep both as built.** C-T1 becomes ready. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). The entry stays open until the work is built (task C-T1).

**Closed** on 2 October 2026 by C-T1 and C-D1. `tools/validate-tokens.cjs` checks the highlight (6.06:1 or better) and the editor selection on the surface and on Haze (7.63:1 or better) in every palette and mode, and the components chapter says the two differ. Measuring them found one composite that fails: a highlighted word that is then selected, under 4.5:1 in Harbor. That is D-39, open for Meridian.

## D-35 · The icon set drops the editor's glyphs

**What.** `tools/build-icons.cjs` keeps the first 1000 icons alphabetically
after its filters, so `link`, `list`, `list-ordered`, `quote`, `redo`,
`subscript` and `undo` fall past the cap, and the `-digit` filter drops
`heading-2` to `heading-4`. Crystal React draws these six in place.

**Options.** (a) A named list of icons the vocabulary requires, kept whatever
the cap; disclose every icon that leaves to make room **(rec.)**. (b) Raise the
cap. (c) Leave each library to draw its own.

**Where.** `tools/build-icons.cjs`. Task C-I1.

**Ruled on 2026-10-02 by Meridian Digital: (a) A named list of icons the vocabulary requires, kept whatever the cap, with every icon that leaves disclosed.** C-I1 becomes ready. Recorded in [`2026-10-02-rulings.md`](2026-10-02-rulings.md). The entry stays open until the work is built (task C-I1).

**Closed** on 2 October 2026 by C-I1. `tools/build-icons.cjs` keeps a named `REQUIRED` list whatever the slice picks, and the manifest lists it; the set is 1022 icons. Icon identifiers are public contract, so in 2.x no icon leaves to make room: the build reports every icon that arrives or leaves against the committed manifest and refuses a removal outside a major release. Crystal React draws the eleven from the set once it depends on the release that ships them.

## D-38 · Resin renders flat once a consumer minifies `crystal.css`

**What.** Crystal React's CI, the first run in three days that GitHub started,
failed `verify:theme` on the built stories: the command palette's field, a
`.cr-field-shell`, computed `backdrop-filter: none`. The dev server, which does
not minify, showed `blur(20px) saturate(1.65)`. Vite 8 minifies CSS with
lightningcss, and lightningcss reads `backdrop-filter` and
`-webkit-backdrop-filter` as one property and keeps the last declaration.
`crystal.css` wrote the unprefixed form first in 23 rules, so only the alias
survived, and Chromium does not implement the alias. Frost, Resin, Mirage, the
dock, the table scroller, the group and the bare and navigation controls all
lost their diffusion in any build that minifies with lightningcss. esbuild,
Vite 7's minifier, keeps both forms in either order, which is why nothing
reported it earlier.

**Why it matters.** D-4b predicted this and was closed on the premise that
nothing minifies `crystal.css`. That stopped being true when the library was
published: a consumer imports `@crystal-ui/core/css` into its own bundle.

**Closed** by order, built into the next release. Each of the 23 rules now writes
`-webkit-backdrop-filter` first and `backdrop-filter` last; every rule keeps
the same declarations, and `crystal-theme.css` is byte-identical. Minified by
lightningcss with Vite's default targets, the old stylesheet leaves 23 rules
with only the alias and the new one leaves none; esbuild keeps both forms. A
contract check, `every backdrop-filter is written after its -webkit- form`,
failed on all 23 rules before the change and passes after it.
`libraries/CONTRACT.md` says why the order matters.
