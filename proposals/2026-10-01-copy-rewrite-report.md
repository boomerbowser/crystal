# Crystal copy rewrite report

1 October 2026.

The public copy of Crystal, its preview site and Crystal React has been rewritten,
and every build and test suite passes. Nothing has been committed, tagged, pushed
or published, so the next steps below are the team's.

## Next steps

All changes sit uncommitted in the three local checkouts under
`~/Development/Proposals`.

- [ ] Review and commit the changes in `crystal-design-system` (79 files),
  `crystal-preview` (63 files) and `crystal-react` (902 files, almost all
  comment-only).
- [ ] Add the two re-evaluation documents and this report, which git does not
  track yet: [`2026-09-29-component-recipes-re-evaluation.md`](2026-09-29-component-recipes-re-evaluation.md)
  and this file in Crystal, and `docs/proposals/2026-09-29-adoption-re-evaluation.md`
  in Crystal React.
- [ ] Re-capture the preview's visual baselines on the CI runner. Three pages were
  rebuilt from rewritten text (`index.html`, `motion.html`, `playground.html`), so
  the visual gate will fail until then.
- [ ] Publish a core release. The rewritten specification chapters reach the
  website only from the published package, and the new npm README and package
  description appear on the next publish.
- [ ] Rebuild the preview after that release, so `website/assets/motion-catalog.js`
  picks up the rewritten motion text.
- [ ] Update the GitHub "About" descriptions of both repositories by hand if
  wanted. They were not changed, because they are public. The new npm package
  descriptions are ready to reuse.
- [ ] Decide whether text that ships inside products should get the same
  treatment. It was left alone (see [Decisions](#decisions)).

## What changed

The writing is now plain technical English: no em dashes in prose, no staged
"not X but Y" contrasts, no decorative bold, and comments that say what the code
does and why. Histories of how a defect was found stay in the trackers, changelogs
and proposals, not in code comments.

| Repository | What was rewritten |
| --- | --- |
| Crystal (`@crystal-ui/core`) | Repository and npm READMEs, package description and keywords, all eleven specification chapters, the changelog, every proposal and both issue trackers, the catalogue and token prose, and the comments in the stylesheets, scripts, type declarations, tools and tests. The documentation generators' output text was rewritten too. |
| crystal-preview | README, site page sources, verification capture notes, and the comments in the site's tools and assets. |
| Crystal React | README, package description, `llms.txt` template, requirements, both trackers and the implementation plan. Also the comments in all 284 components, their stories and tests, the shared styles and the build scripts, and every Storybook docs description. |

Quotations of Meridian, tracker identifiers such as D-19 and R-24, numbers, code
and link targets were kept exactly. Generated files were never edited by hand.
They were rebuilt from their sources.

## Checks

Every suite passed on 1 October 2026 after the final edits.

| Repository | Gate | Result |
| --- | --- | --- |
| Crystal | `npm test` | Passed: 51 contract checks, 1,788 contrast checks, 59 motion recipes, 24 documentation drift checks and the package contents check |
| Crystal | Theme stylesheet | `crystal-theme.css` byte-identical to the last commit |
| crystal-preview | `npm test` | Passed: 14 pages built, 1,788 contrast checks, 59 recipes, 20 drift checks, 983 local links and assets, 1,011 icons |
| Crystal React | `pnpm lint:tokens` | Passed: no hard-coded design values |
| Crystal React | `pnpm verify:stories` | Passed |
| Crystal React | `pnpm typecheck` | Passed |
| Crystal React | `pnpm exec vitest run` | Passed: 1,995 tests in 416 files |
| Crystal React | `pnpm build` | Passed: 284 components in the manifest, 282 implemented, 2 not applicable |

A separate checker compared every changed source file with its last commit,
ignoring comments. Only these files changed code, and each change was intended:

- The two core documentation generators, `build-catalogue` and `build-reference`,
  whose output text was rewritten.
- The keywords and description in core's `package.json`, and Crystal React's
  `build-manifest.mjs` template.
- Demo text shown in five React stories: Typography, AppShell, ScrollArea,
  Utilities and Collapse.

The run timestamps the suites write into `token-checks.json` in each repository
were reverted, so no file changed only by date.

## Decisions

- **Sixteen catalogue lines keep their committed wording.** The rewrite had cut
  phrases such as "not a bar" and "not a selection cue". In a specification line,
  that phrase rules out a specific wrong build, so cutting it weakened the rule.
  Crystal React also quotes these lines word for word. Edits that only replaced a
  dash were kept.
- **Six token descriptions were rewritten in the token source.** They describe
  chart tokens in `crystal.tokens.json`, which no other part of the work covered.
  Token values and the theme are unchanged.
- **Text that ships inside products was left alone.** Examples are the tags
  input's "That is the most you can add" message, `aria-label` templates and the
  dash shown in an empty table cell. Changing them would change what Crystal
  React's users see in their own products.
- **Sample content in stories was left alone.** An episode title or an offline
  error message can use a dash like any real product copy. Explanatory demo text
  was rewritten.
- **Bold appears only as a short lead-in to a paragraph.** It was removed inside
  quotations wherever the catalogue being quoted has none, so those quotations are
  now exact.
- **History moved out of code comments.** A comment keeps the rule, the reason
  and the tracker identifier. The story of how a problem was found lives in the
  closed-issues logs.
- **`AGENTS.md` cannot be shown as a diff.** It is not tracked by git. Its
  original can be recovered from the session transcripts if anyone wants a
  comparison.

## Factual errors corrected

Twenty-one comments and story descriptions stated something the code does not do.
Each was checked against the code and corrected. This is a separate finding from
the style work: the comments had drifted as the code changed.

| Repository | File | What it said | What the code does |
| --- | --- | --- | --- |
| Crystal React | `Progress.tsx` and its story | Crystal publishes no recipe for the moving bar | Plays Crystal's `activity-travel` recipe (D-19, 2.2.0) |
| Crystal React | `ViewStack.tsx` | Each view remembers its focused control and a pop restores it | Moves focus to the region of the view now on screen |
| Crystal React | `ViewStack.stories.tsx` | The library is pinned to core `^2.0.0` until 2.1.0 ships | Depends on core `^2.3.0` and requires the 2.1.0 recipes |
| Crystal React | `NavRail.tsx` and `NavRail.module.scss` | The active destination is Resin | Uses Crystal's navigation entry: weight 800 on the surface-alt fill, with the location dot |
| Crystal React | `List.tsx` | A removed row cannot play `list-out` | Keeps the row mounted in `AnimatePresence` until `list-out` finishes |
| Crystal React | `IconButton.module.scss` | Padding makes the 48px target | Padding is 0. The box itself is the target size |
| Crystal React | `Cascader.tsx` | A branch carries `aria-haspopup` | A branch carries visually hidden text, because React Aria does not forward that attribute |
| Crystal React | `Select.module.scss` | `field.trigger` gives the button its radius and fill | The shell classes on the same button give the radius and fill |
| Crystal React | `RatingSummary.tsx` | The count is in the accessible name | The count is in the headline sentence. The accessible name is the label |
| Crystal React | `Toast.stories.tsx` | One live region | Two live regions, one polite and one assertive |
| Crystal React | `TreeView.test.tsx` | Relies on React running effects bottom-up | The tree turns live on the first expand or collapse |
| Crystal React | `OverlayBadge.module.scss` and its story | Overhangs by half, or by a third | Overhangs by 35% |
| Crystal React | `MeterGroup.module.scss` | The legend is not optional | The legend is on by default and can be turned off |
| Crystal React | `Carousel.module.scss` | There is no `.step` rule | A `.step` rule exists in the forced-colours block |
| Crystal React | `AppShell.stories.tsx` | The app bar watches an IntersectionObserver | The app bar reads a passive scroll listener |
| Crystal React | `BottomNavigation.tsx` | The safe-area inset is padding | The safe-area inset is a bottom margin |
| Crystal React | `vitest.config.ts` | Four browser gates | Five browser gates |
| crystal-preview | `tools/capture-frames.mjs` | Ambient motion is a material's resting state | Ambient motion was withdrawn, and no stylesheet reads these attributes |
| crystal-preview | `tools/assemble-site.mjs` | Vercel runs no install step | Vercel runs `npm ci --omit=dev`, which installs `@crystal-ui/core` from npm |
| crystal-preview | `tools/validate.py` | The library's stylesheets are under `core/` | It reads the copy of `@crystal-ui/core` placed inside the website |
| crystal-preview | `website/assets/controls.css` | Enforced by `tools/audit-materials.cjs` | The file is `tools/audit-materials.mjs` |

## Re-evaluation of the 28 September proposal

The proposal held, but seven of its eight mistakes had one cause: surfaces and
motion were assigned by reading descriptions, not by measuring renderings. Two
documents record this, one per repository.

**Crystal**
([`2026-09-29-component-recipes-re-evaluation.md`](2026-09-29-component-recipes-re-evaluation.md)).
The surface vocabulary, the four recipes, the status record and both adoption
phases held. Eight things were wrong, each with its tracker record: eleven
surfaces mis-assigned (D-23), the navigation entry missing its location dot
(D-22), unplayable motion assignments (D-28), the overlay-exit advice (R-24), the
field shell's boundary contrast (D-24), the dialog surface off-centre on
non-dialog elements (D-29), the badge height (D-27), and lone-class recipes losing
to the element coat. It recommends:

1. Measure a surface or motion assignment against a rendering before it enters
   the catalogue.
2. Publish each surface's recipe as values in `surfaces.json`, so non-web
   platforms can use them.
3. Check catalogue prose against each entry's surface in the build. 27 entries
   name a material their surface lacks.
4. Put the first group of unplayed motion assignments to Meridian, as D-28 was.
5. Credit composition in the React manifest, so an assignment a child component
   plays counts.
6. Sort Crystal React's remaining hand-written material into surfaces.
7. Start Crystal React's documentation site from the surfaces.

**Crystal React** (`docs/proposals/2026-09-29-adoption-re-evaluation.md` in that
repository). The adoption guide was carried out in full:

| Measure | 28 September | 29 September |
| --- | --- | --- |
| Component files using a Crystal class | 18 | 80 |
| Hand-written `backdrop-filter` lines | 34 | 20 |
| `bare-control` mixin uses | 22 | removed |
| Crystal recipes played | 30 of 57 | 53 of 59 |
| Unit tests | 1,694 | 1,995 |

Still open: 56 of the catalogue's 329 motion assignments are not played,
composition is not credited in the manifest, some assignments have no recorded
reason, some material is still hand-written (26 Haze fills, 9 Frost, 4 Resin), and
the documentation website (slice Q) has not started.

## Dash counts

Em and en dashes fell from 5,410 to 282 across the tracked files. Every one left
is a quotation, a code string, data or a preserved reference copy.

| Repository | Files | Before | After | Where the rest are |
| --- | --- | --- | --- | --- |
| Crystal | Markdown | 1,165 | 65 | Parity placeholders in the generated catalogue, Meridian's quoted ruling, quotations in the closed-issues log |
| Crystal | JSON | 176 | 116 | Parity placeholders in catalogue data |
| Crystal | JavaScript and TypeScript | 214 | 20 | Failure messages printed by the validators |
| Crystal | CSS, HTML, YAML | 111 | 0 | None |
| crystal-preview | Markdown | 216 | 3 | Coordinate ranges inside code spans |
| crystal-preview | JavaScript | 68 | 10 | Failure messages, and motion text generated from the published core |
| crystal-preview | CSS, HTML, Python, YAML | 43 | 1 | The contrast readout's placeholder, which the page script replaces |
| Crystal React | Markdown | 636 | 1 | A quotation of the catalogue in the implementation plan |
| Crystal React | TypeScript and TSX | 2,285 | 64 | Product text, sample story content, quotations and empty-cell values |
| Crystal React | SCSS and YAML | 496 | 2 | `echo` strings in the CI workflow |

Crystal React's tracked Vitest output file holds 180 more. It is test output, not
copy.
