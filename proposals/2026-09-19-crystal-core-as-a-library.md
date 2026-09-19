# `@crystal/core` as a published library

**Proposal. D-10 in `proposals/open-issues.md`, and R-16 in Crystal React's
tracker, which is the same issue from the consumer's side.**
**19 September 2026. Every decision in it has been made by Meridian; what
follows is the shape, the order, and the parts only they can do.**

D-10 says a proposal comes before any code, because this moves every consumer at
once. This is it.

---

## 1. What is wrong, measured

`design-system/` is simultaneously the library, the documentation website and the
build machinery. That is not a tidiness complaint — it is the common cause behind
three separate tracker entries, and it is measurable.

A published `@crystal/core` today would be **2.18 MB unpacked across 1,097
files**, and this is what a consumer would be installing:

| | size | is it the library? |
|---|---|---|
| `docs/` — 22 generated specification pages | **994 KB** | no, it is the website |
| `tokens/` — DTCG source, flat, catalogue, motion recipes | 549 KB | yes |
| `assets/site.css`, `site.js` | 49 KB | no |
| `assets/motion-suite.*`, `motion-preview.js`, `motion-catalog.js`, `motion-interactions.js`, `motion-shaders.js` | 87 KB | no, the preview's motion demos |
| `assets/controls.css`, `controls.js` | 32 KB | **no, and this one has already caused a defect** |
| `assets/crystal.{css,js,d.ts}`, `crystal-theme.css`, `motion.{css,js}`, `icons.*`, `tokens.js` | 122 KB | yes |
| `assets/core/`, `shaders/`, `fonts/`, `vendor/` | 261 KB | yes |
| `exports/` — the TypeScript, Swift and Kotlin token exports | 21 KB | yes |

**Forty-six per cent of the package is the documentation website.** A product
that wants the token resolver downloads the specification pages.

### The three defects this shape produced

**D-9.** `controls.css` is website-only and unexported, and because the preview
loads it, it shaped the appearance that was *blessed* — while
`--cr-shadow-float`, which is what every platform library actually receives, said
something different. A library following Crystal's tokens could not reproduce
Crystal's own appearance. Eight hard-coded shadow literals remain in that file.

**R-13.** Crystal React's materials had drifted and nothing compared them.
Closing it needed a gate that runs *two servers* and diffs computed styles,
because there is no artefact to compare against. A library cannot ask "what is
Crystal's Resin recipe?"; it can only ask a browser what Crystal's website
painted.

**R-14.** A `file:` dependency, pre-bundled once by Vite and then served stale.
Three investigations in one day; one started a wrong diagnosis of the theme
provider, and one is what Meridian saw when they reported that Crystal's
specifications were missing from every component.

R-15, closed today, is the fourth and the clearest. The Haze content fill's
*ingredients* were exported tokens and its *recipe* — "held back 8px from the
rim, on an isolated layer" — existed only as a literal in `controls.css`. Crystal
React could carry every Haze token, pass every token gate, and paint nothing on
sixteen surfaces. A specification only one renderer can read is not a
specification.

---

## 2. The boundary

**The test:** *a library that consumes this can render Crystal correctly with no
browser and no website.*

**Stays in the package.** `tokens/` in every generated form; the resolver
(`assets/crystal.js` + `.d.ts`); the headless core (`assets/core/`);
`crystal.css`, `crystal-theme.css`, `motion.css`, `motion.js`; the icon set and
its manifest; `assets/shaders/`, `assets/fonts/`; `exports/` for TypeScript,
Swift and Kotlin; `reference/licenses/`; `src/engines.js`.

**Leaves.** `docs/`, every `.html`, `site.css`, `site.js`, `menu.js`, `docs.js`,
`controls.css`, `controls.js`, `motion-preview.js`, `motion-suite.*`,
`motion-interactions.js`, `motion-shaders.js`, `motion-catalog.js`,
`assets/vendor/`, `tools/`, `tests/`, `validation/`.

### `controls.css` — the boundary case, and a recommendation

D-10 left this open. The recommendation, and the reasoning, since this is a
material-spec question and those are Meridian's:

`controls.css` is not one thing. It holds **genuine Crystal specification** — the
Resin control recipe, the Haze protective fill, the optical sheen, the strip
where the pills are bare, the forced-colours fallbacks — bound to **bare element
selectors**, `:is(button, a.cr-button, input[type=checkbox], …)`. The
specification is why the file matters. The bare selectors are why it cannot be
exported: it would give every button in a consumer's application a Resin
background and a 48px minimum height, which is exactly what happened the one time
it *was* exported, when a 32px chip rendered 50px tall in Crystal React.

Three options, and only one of them is a real fix:

1. **Leave it preview-only.** What we have. The hazard stays: the site can keep
   shaping a blessed appearance out of rules no consumer can reach.
2. **Export it as-is.** Re-creates the 2024 defect. Not viable.
3. **Promote the recipes, not the file.** Every composition in it that is
   genuine specification becomes either a token (as `component.haze.inset` did
   today) or a class-scoped rule in exported CSS; `controls.css` keeps only the
   bare-element *adapter* that lets the preview's own markup wear them.

**Recommended: (3), done incrementally and driven by the gates, not in one
sweep.** R-15 is the worked example and it took one token: the number moved into
`tokens/crystal.tokens.json`, `controls.css` now reads `var(--cr-haze-inset)`,
the Swift and Kotlin exports picked it up for free, and the parity gate grew a
`::before` comparison that fails if a consumer stops painting it. Eight shadow
literals remain (D-9's remainder) and each can take the same route.

Doing it in one sweep would mean re-blessing every approved frame at once, which
the change discipline exists to prevent. Doing it incrementally means each
promotion is one token, one gate, one reviewable diff.

---

## 3. What a non-JavaScript library consumes

This is the part that is not solved by "publish the npm package", and it is the
half of Meridian's request that says *"not just Crystal React, but all of
Crystal's component libraries"*.

A SwiftUI or Compose library cannot install an npm package. The Swift and Kotlin
exports are already generated and then stranded inside one. So every release also
publishes a **specification bundle as a GitHub release asset** on the `crystal`
repository, at a tagged version:

```
crystal-spec-2.0.0.zip
  tokens/crystal.tokens.json     the DTCG source
  tokens/crystal.json            flat
  tokens/catalogue.json          the component catalogue
  tokens/motion-recipes.json
  exports/crystal-tokens.swift
  exports/crystal-tokens.kt
  exports/crystal-tokens.ts
  libraries/parity.json          the machine-readable parity bar
  CONTRACT.md
```

A release asset rather than a second registry: it is versioned, immutable, fetchable
by any toolchain with `curl`, needs no new account or credential, and is produced by
the same workflow that publishes to npm, so the two cannot drift. `libraries/CONTRACT.md`
then cites the artefact instead of describing it.

---

## 4. Publishing

**npm Trusted Publishing (OIDC) from GitHub Actions.** No npm credential exists
in the repository at all, so there is nothing to leak, rotate or scope. A
granular automation token is the fallback *only* if trusted publishing cannot be
enabled on the account, and would then be scoped to the single package with a
short expiry.

**`--provenance` on every publish**, so a consumer can verify the tarball came
from `boomerbowser/crystal` at a known commit rather than from someone who
guessed a version number.

**Owning `@crystal` publicly is itself the mitigation** for dependency confusion.
An unclaimed scope that private libraries already import from is the textbook
setup for that attack.

**Two release gates, because both failure modes are silent:**

- **No `file:` or `link:` dependency in the published manifest.** A package
  published while carrying one ships a dependency resolving to a directory on
  nobody else's machine.
- **No website in the tarball.** No HTML, no `site.*`, no `controls.*`, no
  preview-only motion scripts. This is D-9's structural fix: a preview-only
  stylesheet cannot shape a blessed appearance if it cannot leave the repository.

Both are written and both were proven to fail before being trusted — see
`tools/verify-package.cjs`.

---

## 5. Order

1. **Package boundary and the two release gates.** Local, reversible, no
   consumer affected. *Done.*
1b. **The folders themselves.** *Done — Meridian asked for this explicitly:
   "separate the files that make up @crystal/core from the preview website into
   different folders. That's part of what we meant originally." The `files` array
   said what shipped; it did not stop anyone reaching across. Now
   `design-system/core/` holds the library and nothing else, with its own
   `package.json`, and the preview reaches it the way a consumer will — by a path
   into the package, not by sitting in the same directory.*

   `core/` is **inside** the deploy root rather than beside it, and that is a
   constraint rather than a preference: Vercel serves `design-system/` as a
   static upload with no build step, so a sibling folder would be unreachable and
   every page would 404 on the resolver. The same arrangement is what makes the
   eventual repository split a clean lift — `core/` goes to `crystal`, the rest
   goes to `crystal-preview`, and the pages swap `core/assets/…` for
   `node_modules/@crystal/core/assets/…` with one real install step.
2. **The publish workflow**, OIDC and provenance, plus the spec bundle. *Written;
   it cannot run until Meridian enables trusted publishing.*
3. **Specifications updated** to describe the core library and how a platform
   library consumes it.
4. **The website becomes a consumer**: it installs `@crystal/core` and its
   previews read the published resolver.
5. **The repository split**, which is the step with Meridian's hand in it.
6. **Crystal React moves to `"@crystal/core": "^2.0.0"`**, `pnpm link` for local
   work, and `optimizeDeps.force` retires — it is R-14's workaround, and a real
   dependency is its cure.

Steps 4 and 6 are gated on step 2 actually having published something. Until
then the `file:` dependency stays, because a committed range pointing at a
version that does not exist is worse than an honest path.

---

## 6. What only Meridian can do

| | |
|---|---|
| **Create the `@crystal` scope on npm** | First, and under whichever account or organisation should own it. Verified free on 19 September: `@crystal/core` and `@crystal/react` both 404, scope search returns 0. |
| **Publish 2.0.0 once, by hand** | npm cannot attach a trusted publisher to a package that does not exist yet, so the order matters and an earlier draft of this table had it backwards. From `design-system/`: `npm publish --access public`. |
| **Then enable Trusted Publishing** | npm → the `@crystal/core` package → *Settings* → *Publishing access* → add a trusted publisher: repository `boomerbowser/crystal`, workflow `.github/workflows/publish.yml`. Every version after the first comes from a tag and needs no credential. |
| **Re-base the Vercel project onto `crystal-preview`** | Already planned. The build settings change with it — see §7. |
| **Push the website to `crystal-preview`** | Prepared here, not pushed: this session has never written to that repository, and a first push to a new remote is not something to do unasked. The command is in §7. |
| **Decide whether `crystal-preview` publishes anything** | Recommendation: no. It is a site, it consumes `@crystal/core`, and it needs no package identity. |

`CRYSTAL_HEAD_TOKEN` is already set on `crystal-preview`, and the `crystal`
repository is already public. Neither needs anything further.

---

## 7. The split, concretely

The website's build currently deploys `design-system/` itself, with
`.vercelignore` keeping `tools/`, `src/` and `package.json` out of the upload.
After the split:

**`crystal-preview`** holds `index.html`, `playground.html`, `motion.html`,
`docs/`, and the preview's own assets — `site.css`, `site.js`, `menu.js`,
`docs.js`, `controls.css`, `controls.js`, the motion suite, `assets/vendor/`.
It declares `"@crystal/core": "^2.0.0"` and its pages load the resolver, the
theme and the icons from `node_modules/@crystal/core/…` rather than from a
sibling path.

**`crystal`** keeps the library, `tokens/`, `tools/`, `tests/` and `validation/`
— every gate stays with the thing it gates.

The generated pages are the wrinkle worth naming: `tools/build.py` generates
fourteen of them from Markdown in the `crystal` repository. Two honest options,
and this proposal recommends the first:

- **Generate in `crystal`, publish the HTML as a release asset, and have
  `crystal-preview` fetch it at build time.** The generator stays beside the
  specifications it reads, which is where the drift gate already lives, and the
  preview repository holds only what a person edits.
- Move `tools/build.py` and the Markdown to `crystal-preview`. Simpler to deploy
  and it moves the specification text away from the tokens it is checked
  against, which is the drift gate D-7 exists for.

---

## 8. What this proposal does not claim

It does not claim the split is finished. Steps 1 and 2 are done and reversible;
3 through 6 are sequenced behind an npm scope that does not exist yet, and
behind a first push to a repository this session has deliberately not written
to. The order above is chosen so that nothing is committed which points at a
version nobody can install.
