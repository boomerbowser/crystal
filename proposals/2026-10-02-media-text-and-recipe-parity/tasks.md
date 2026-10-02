# Tasks: media, text and recipe parity

Rendered from `tasks.json` and `rulings.json` by `render-tasks.mjs`. Edit the JSON, or record a ruling on the board, not this file.
The proposal is [`../2026-10-02-media-text-and-recipe-parity.md`](../2026-10-02-media-text-and-recipe-parity.md); the board is [`examples/tasks.html`](examples/tasks.html); the rulings are recorded in [`../2026-10-02-rulings.md`](../2026-10-02-rulings.md).

47 tasks: 31 done, 11 ready, 4 blocked, 1 needs a ruling, 0 dropped.

IDs: `C-` is Crystal core (R release, S surfaces and recipes, M motion, I icons, D docs, T text), `R-` is Crystal React (M media, T text, A audit, motion and materials, Q documentation). Crystal React's implementation plan carries the `R-` tasks as Slice R.

| Status | Meaning |
|---|---|
| Done | Built and verified in this change; reviewable now. |
| Ready | Specified and unblocked; can start. |
| Blocked | Waits on another task or a release. |
| Needs a ruling | Waits on a decision by Meridian (open-issues.md). |
| Dropped | No longer wanted, by a ruling; kept so the record shows why. |

| Priority | Meaning |
|---|---|
| P0 | Ships with the next core release; correctness or accessibility. |
| P1 | The brief's own asks, or what makes them shippable. |
| P2 | Consistency and coverage the brief implies. |
| P3 | Worth doing; nothing waits on it. |

## Decisions

Each is Meridian's to make. Record a ruling on the board, served by `examples/serve.cjs`, or with `node apply-rulings.mjs ruling.json`; either writes the ruling to `rulings.json`, `../2026-10-02-rulings.md` and `../open-issues.md`, and re-renders this list.

| Decision | Task | State | Ruling |
|---|---|---|---|
| D-30 · An optional editor engine binding | C-T2 | Ruled | (a) A library may ship an optional binding from its own entry point, the engine an optional peer; the catalogue names the format vocabulary as the contract, by Meridian Digital on 2026-10-02 |
| D-31 · Material presets as entrances | C-M1 | Ruled | (a) They stay studies in 2.x, presets.js says so, and entrances are decided per surface in 3.0, by Meridian Digital on 2026-10-02 |
| D-32 · Twenty assignments no component plays | C-M2 | Ruled | (a) As D-28: take off the eleven the components cannot play, say in prose that the menubar's and split button's menus are the product's, and keep the rest as Crystal React tasks, by Meridian Digital on 2026-10-02 |
| D-33 · What "an intelligent cursor" means | – | Ruled | (a) That is what was meant, by Meridian Digital on 2026-10-02 |
| D-34 · Highlight and selection | C-T1 | Ruled | (a) Keep both as built, by Meridian Digital on 2026-10-02 |
| D-35 · The icon set drops the editor's glyphs | C-I1 | Ruled | (a) A named list of icons the vocabulary requires, kept whatever the cap, with every icon that leaves disclosed, by Meridian Digital on 2026-10-02 |
| D-37 · Selection that travels between segments | C-M3 | Ruled | (a) Specify a travelling pill for every strip: one .cr-indicator.pill behind the selected segment, moved by a new critically damped recipe between measured positions, on tabs, the segmented control, the dock, bottom navigation and toggle button groups; selection stays label weight, by Meridian Digital on 2026-10-02 |
| D-39 · A selected highlight falls below 4.5:1 in Harbor | C-T3 | Needs a ruling | – |

## Crystal (`@crystal-ui/core`)

| ID | Priority | Status | Task | Depends on |
|---|---|---|---|---|
| [C-R1](#c-r1) | P0 | Ready | Publish @crystal-ui/core 2.4.0 | – |
| [C-R2](#c-r2) | P2 | Done | Remove the backdrop blur that survives forced colours (D-36) | – |
| [C-S1](#c-s1) | P2 | Done | Resolve the partial surface recipes (F-2 items 3 to 9) | – |
| [C-S2](#c-s2) | P1 | Done | Platform guide for surface-recipes.json in CONTRACT.md | – |
| [C-S3](#c-s3) | P2 | Done | Measure before assigning, as a contract rule (re-evaluation rec. 1) | – |
| [C-S4](#c-s4) | P2 | Done | Check prose against surface in the build (re-evaluation rec. 3) | – |
| [C-S5](#c-s5) | P2 | Ready | Caption style in the media recipe | – |
| [C-M1](#c-m1) | P2 | Done | Material presets as entrances (D-31) | – |
| [C-M2](#c-m2) | P2 | Done | Rule on the 20 unplayed assignments (D-32) | – |
| [C-M3](#c-m3) | P2 | Ready | Selection motion for strips and groups (D-37) | – |
| [C-I1](#c-i1) | P1 | Done | Keep the icons the vocabulary needs (D-35) | – |
| [C-D1](#c-d1) | P1 | Done | Describe the media and text recipes in the specification chapters | – |
| [C-T1](#c-t1) | P2 | Done | Highlight and selection colours (D-34) | – |
| [C-T2](#c-t2) | P1 | Done | Engine binding policy for platform libraries (D-30) | – |
| [C-T3](#c-t3) | P0 | Needs a ruling | Selected highlight contrast (D-39) | – |

### C-R1

**Publish @crystal-ui/core 2.4.0.** Release, P0, ready.

Target: 2.4.0 on the registry with the media and text recipes, surface-recipes.json and the catalogue changes.

Done when:

- [ ] CHANGELOG entry under 2.4.0 lists every recipe, the catalogue changes and the new export
- [ ] npm test passes; crystal-theme.css byte-identical or the change explained
- [ ] verify-package: 19 exports, ./surface-recipes resolves
- [ ] The distributable ZIP regenerated

Where: `CHANGELOG.md, core/package.json`.

### C-R2

**Remove the backdrop blur that survives forced colours (D-36).** Accessibility, P2, done.

Target: .cr-status and the choice controls compute backdrop-filter: none under forced-colors: active.

Done when:

- [x] A check measures the computed style under emulated forced colours (Playwright emulateMedia), not the cascade read statically
- [x] Captured under forced-colors: active, both modes

Where: `core/assets/crystal.css, tests/core-contracts.cjs`.

### C-S1

**Resolve the partial surface recipes (F-2 items 3 to 9).** Recipes, P2, done.

Target: Every surface in surface-recipes.json resolves fully, or its record says why it cannot.

Done when:

- [x] .cr-button coats any element, or the vocabulary says it is element-keyed
- [x] .cr-stone has a radius or the record says it inherits
- [x] The dock's description and .cr-dock-inner agree on Stone or Haze
- [x] -webkit-backdrop-filter twins on .cr-dock and the choices; the choices' blur is a token

Where: `core/assets/crystal.css, core/tokens/surfaces.json`.

### C-S2

**Platform guide for surface-recipes.json in CONTRACT.md.** Recipes, P1, done.

Target: A SwiftUI or Compose library can implement every surface from the JSON and its token export alone.

Done when:

- [x] libraries/CONTRACT.md names the file, the fields and the fallbacks a platform must honour
- [x] One worked example per material

Where: `libraries/CONTRACT.md, core/docs/adoption.md`.

### C-S3

**Measure before assigning, as a contract rule (re-evaluation rec. 1).** Recipes, P2, done.

Target: A surface or motion enters the catalogue only after a component wearing it has been compared with the recipe in a browser.

Done when:

- [x] The rule is in libraries/CONTRACT.md
- [x] extend-catalogue tools cite the measurement for each assignment

Where: `libraries/CONTRACT.md`.

### C-S4

**Check prose against surface in the build (re-evaluation rec. 3).** Catalogue, P2, done.

Target: A material named in an entry's material or anatomy belongs to one of its surfaces.

Done when:

- [x] build-catalogue.cjs fails on a mismatch
- [x] The 27 entries that fail today are corrected, the four stale overlay anatomies first

Where: `tools/build-catalogue.cjs, core/tokens/catalogue/`.

### C-S5

**Caption style in the media recipe.** Recipes, P2, ready.

Target: .cr-media-caption publishes the reader's caption style (a larger size and a solid backing on --cr-surface), and the video player's entry names the caption-style choice, so every platform offers what Crystal React does since R-M12.

Done when:

- [ ] crystal.css carries the size and backing variants, with their forced-colours and reduced-transparency branches
- [ ] surface-recipes.json records them
- [ ] The video player entry names the choice in its anatomy and semantics

Where: `core/assets/crystal.css, core/tokens/catalogue/11-media.json`.

### C-M1

**Material presets as entrances (D-31).** Motion, P2, done, by the ruling on D-31.

Target: presets.js and motion.md both call the presets studies for 2.x, and the 3.0 plan lists entrances per surface as an open question.

Done when:

- [x] Meridian's ruling recorded
- [x] motion.md and presets.js say the same thing

Where: `core/docs/motion.md, core/assets/core/presets.js`.

### C-M2

**Rule on the 20 unplayed assignments (D-32).** Motion, P2, done, by the ruling on D-32.

Target: extend-catalogue-9.cjs takes off list-out on the transfer list, data table and resizable table, accordion-out on the four trees and the spoiler, page-out on master and detail, and list-in on the combobox, and says the menubar's and split button's menus are the product's.

Done when:

- [x] extend-catalogue-9.cjs applies the ruling
- [x] Crystal React's audit reports 0 unplayed, or each remaining one is a React task

Where: `core/tokens/catalogue/`.

### C-M3

**Selection motion for strips and groups (D-37).** Motion, P2, ready, by the ruling on D-37.

Target: crystal.css has .cr-indicator.pill, the strips draw selection on it rather than per item, motion-recipes.json has a critically damped selection-travel recipe driven by measured layout (instant under reduced motion), and extend-catalogue-9.cjs assigns it to tabs, segmented-control, dock, bottom-navigation and button-group, each measured on a component first. The preview is re-baselined with every changed frame disclosed.

Done when:

- [ ] Meridian's ruling recorded
- [ ] surfaces.json, crystal.css and motion-recipes.json say the same thing about the selected segment

Where: `core/assets/crystal.css, core/tokens/surfaces.json, core/tokens/motion-recipes.json`.

### C-I1

**Keep the icons the vocabulary needs (D-35).** Icons, P1, done, by the ruling on D-35.

Target: link, unlink, list, list-ordered, quote, undo, redo, subscript and heading-2 to heading-4 are in the set whatever the cap.

Done when:

- [x] build-icons.cjs has a named REQUIRED list
- [x] Every icon that leaves the set to make room is disclosed
- [x] Crystal React's formats.tsx uses the set for all glyphs

Where: `tools/build-icons.cjs`.

### C-D1

**Describe the media and text recipes in the specification chapters.** Docs, P1, done.

Target: components.md and materials.md describe the stage, transport, caption, audio card, prose and editor recipes.

Done when:

- [x] validate-docs passes
- [x] Each recipe links to its specimen

Where: `core/docs/components.md, core/docs/materials.md`.

### C-T1

**Highlight and selection colours (D-34).** Text, P2, done, by the ruling on D-34.

Target: Contrast checks for mark text on primary-soft in every palette and mode, and a note in the text chapter that selection and highlight differ.

Done when:

- [x] Ruling recorded
- [x] Contrast checks for mark text on its fill in all palettes

Where: `core/assets/crystal.css`.

### C-T2

**Engine binding policy for platform libraries (D-30).** Text, P1, done, by the ruling on D-30.

Target: rich-text-surface's note says a library may ship an optional engine binding from its own entry point, with the engine an optional peer, and that the format vocabulary is the contract.

Done when:

- [x] rich-text-surface's note updated to the ruling

Where: `core/tokens/catalogue/04-inputs.json`.

### C-T3

**Selected highlight contrast (D-39).** Text, P0, needs a ruling.

Target: A highlighted word that is selected keeps 4.5:1 in every palette and mode.

Done when:

- [ ] Ruling recorded
- [ ] A check in validate-tokens.cjs for the selected-highlight pair, seen failing on the current values first

Where: `core/assets/crystal.css, tools/validate-tokens.cjs`.

## crystal-preview

| ID | Priority | Status | Task | Depends on |
|---|---|---|---|---|
| [C-R3](#c-r3) | P1 | Blocked | Show the media and text recipes in the preview and re-baseline | C-R1 |

### C-R3

**Show the media and text recipes in the preview and re-baseline.** Release, P1, blocked.

Target: crystal-preview on 2.4.0, with specimens of the stage, transport, caption, audio card, editor and selection bar in the playground.

Done when:

- [ ] Baselines re-captured on the runner, every changed frame disclosed
- [ ] A browser gate measures backdrop-filter with forced colours emulated on every Crystal surface (D-36), seen failing on 2.3.1 and passing on 2.4.0

Where: `crystal-preview/website`. Depends on C-R1.

## Crystal React

| ID | Priority | Status | Task | Depends on |
|---|---|---|---|---|
| [R-M1](#r-m1) | P1 | Done | Playback rate and picture in picture on useMediaElement | – |
| [R-M2](#r-m2) | P1 | Done | useMediaTracks: caption, audio and video tracks | – |
| [R-M3](#r-m3) | P1 | Done | MediaSettings: speed, subtitles, audio, quality | – |
| [R-M4](#r-m4) | P1 | Done | VideoPlayer: aspect ratio, fit, settings, captions on Stone, picture in picture, full screen | – |
| [R-M5](#r-m5) | P1 | Done | AudioPlayer: the Haze card, subtitle, speed | – |
| [R-M6](#r-m6) | P1 | Done | MediaControls: transport padding, readouts on Haze, sliders inset by half a thumb | – |
| [R-M7](#r-m7) | P2 | Done | PlayerShell uses the player's own full screen | – |
| [R-M8](#r-m8) | P2 | Done | Real media fixtures for stories and gates | – |
| [R-M9](#r-m9) | P1 | Blocked | Wear the published media recipes and delete the copies | C-R1 |
| [R-M10](#r-m10) | P1 | Ready | Prove audio-track switching in Safari | – |
| [R-M11](#r-m11) | P3 | Done | Draw the first cue before playback starts | – |
| [R-M12](#r-m12) | P2 | Done | Caption appearance settings (size and backing) | – |
| [R-T1](#r-t1) | P1 | Done | RichTextSurface wears .cr-field-shell, carries the vocabulary, places the toolbar by pointer | – |
| [R-T2](#r-t2) | P1 | Done | The format vocabulary, exported from the main entry | – |
| [R-T3](#r-t3) | P1 | Done | RichTextEditor at @crystal-ui/react/editor | – |
| [R-T4](#r-t4) | P1 | Done | Text decorations and the edit elements | – |
| [R-T5](#r-t5) | P1 | Ready | Prove the touch toolbar on real devices | – |
| [R-T6](#r-t6) | P2 | Done | Mentions popover wears .cr-frost | – |
| [R-T7](#r-t7) | P2 | Done | EditorBlock offers the bound editor in a story | D-30 |
| [R-T8](#r-t8) | P3 | Ready | Screen-reader pass on the editor | – |
| [R-T9](#r-t9) | P1 | Blocked | Wear the published prose and editor recipes and delete the copies | C-R1 |
| [R-A0](#r-a0) | P1 | Done | Motion catalogue story | – |
| [R-A1](#r-a1) | P1 | Ready | Sort the hand-written material (re-evaluation rec. 6) | – |
| [R-A2](#r-a2) | P2 | Ready | Confirm the 105 entries whose surface is not worn in their own markup | – |
| [R-A3](#r-a3) | P2 | Done | Cascader plays the field recipes | – |
| [R-A4](#r-a4) | P2 | Done | Product gallery and playlist block play their assigned motion | – |
| [R-A5](#r-a5) | P3 | Done | The view stack plays view-push-out | – |
| [R-A9](#r-a9) | P2 | Ready | The Haze reading fill in the popover, the pop-confirm and the menu | – |
| [R-A10](#r-a10) | P2 | Ready | The Resin thumb on the colour area, slider and wheel | – |
| [R-Q1](#r-q1) | P2 | Ready | Documentation site from the surfaces (re-evaluation rec. 7, Slice Q) | C-R1 |
| [R-A8](#r-a8) | P2 | Blocked | The travelling selection pill on strips (D-37) | C-M3, C-R1 |

### R-M1

**Playback rate and picture in picture on useMediaElement.** Media, P1, done.

Target: Both read from the element and set on it.

Done when:

- [x] ratechange and the picture-in-picture events update state
- [x] Picture in picture offered only where document.pictureInPictureEnabled

Where: `src/media/useMediaElement.ts`.

### R-M2

**useMediaTracks: caption, audio and video tracks.** Media, P1, done.

Target: Tracks read from the element, one audio track at a time, a missing list offers nothing, Crystal draws captions.

Done when:

- [x] 5 unit tests against browser-shaped track lists
- [x] verify:behaviour: the cue is drawn and above the transport

Where: `src/media/useMediaTracks.ts`.

### R-M3

**MediaSettings: speed, subtitles, audio, quality.** Media, P1, done.

Target: Radio items, selection by weight, a submenu per choice when there are several, every change announced.

Done when:

- [x] menuitemradio with aria-checked; no glyph in a radio item
- [x] Speeds named in words ('1.5 times')
- [x] No control when there is nothing to choose

Where: `src/components/MediaControls/MediaSettings.tsx`.

### R-M4

**VideoPlayer: aspect ratio, fit, settings, captions on Stone, picture in picture, full screen.** Media, P1, done.

Target: The catalogue's video-player anatomy.

Done when:

- [x] Stage 16:9 before the first frame (verify:behaviour)
- [x] Overlays portal into the player in full screen
- [x] Shortcuts C, F, Shift+<, Shift+> answer only inside the player

Where: `src/components/VideoPlayer/`.

### R-M5

**AudioPlayer: the Haze card, subtitle, speed.** Media, P1, done.

Target: The catalogue's audio-player anatomy.

Done when:

- [x] cr-haze worn; transport inset by the card padding (verify:behaviour)
- [x] surface={false} for a player already on Haze

Where: `src/components/AudioPlayer/`.

### R-M6

**MediaControls: transport padding, readouts on Haze, sliders inset by half a thumb.** Media, P1, done.

Target: The .cr-resin.transport recipe.

Done when:

- [x] First control 12px inside the pill; thumb never over a readout (verify:behaviour)

Where: `src/components/MediaControls/`.

### R-M7

**PlayerShell uses the player's own full screen.** Media, P2, done.

Target: One full-screen control, announced however full screen is left.

Done when:

- [x] PlayerShell tests unchanged and passing

Where: `src/components/PlayerShell/`.

### R-M8

**Real media fixtures for stories and gates.** Media, P2, done.

Target: Every media story plays real media with no network.

Done when:

- [x] harbour.mp4 with two audio tracks; captions in two languages; episode.m4a

Where: `.storybook/fixtures/`.

### R-M9

**Wear the published media recipes and delete the copies.** Media, P1, blocked.

Target: VideoPlayer, AudioPlayer and MediaControls wear .cr-media, .cr-media-bar, .cr-resin.transport and .cr-media-caption.

Done when:

- [ ] src/media/coreRecipes.test.ts removed with the copies
- [ ] verify:appearance and verify:behaviour unchanged

Where: `src/components/VideoPlayer/, AudioPlayer/, MediaControls/`. Depends on C-R1.

### R-M10

**Prove audio-track switching in Safari.** Media, P1, ready.

Target: The audio group appears and switches the track in an engine with audioTracks.

Done when:

- [ ] A WebKit leg in verify:behaviour, or a recorded manual check with the harbour clip

Where: `scripts/verify-behaviour.mjs`.

### R-M11

**Draw the first cue before playback starts.** Media, P3, done.

Target: A cue active at 0:00 shows without a time update.

Done when:

- [x] Chromium's empty activeCues at load handled, for example by a one-time seek to currentTime on loadeddata

Where: `src/media/useMediaTracks.ts`.

### R-M12

**Caption appearance settings (size and backing).** Media, P2, done.

Target: A reader can enlarge captions and make the backing opaque, as broadcast caption rules require.

Done when:

- [x] A Captions style submenu; the choice persists
- [x] Opaque backing uses --cr-surface, not a new colour

Where: `src/components/MediaControls/MediaSettings.tsx`.

### R-T1

**RichTextSurface wears .cr-field-shell, carries the vocabulary, places the toolbar by pointer.** Text, P1, done.

Target: The rich-text-surface anatomy, engine-agnostic.

Done when:

- [x] Hand-written frame removed
- [x] Toolbar below and sticky on a coarse pointer, no horizontal page scroll at 375px (verify:behaviour)
- [x] field-focus, field-invalid, field-valid played

Where: `src/components/RichTextSurface/`.

### R-T2

**The format vocabulary, exported from the main entry.** Text, P1, done.

Target: A product binding any engine reads names, shortcuts and glyphs from one list.

Done when:

- [x] FORMAT_VOCABULARY, BLOCK_TYPES, MARKS, LISTS, STRUCTURE, HISTORY exported

Where: `src/components/RichTextSurface/formats.tsx`.

### R-T3

**RichTextEditor at @crystal-ui/react/editor.** Text, P1, done.

Target: Headings, lists, checklists, every mark, indent and outdent, undo and redo, a selection toolbar, Alt+F10, Markdown input rules, form value.

Done when:

- [x] 12 unit tests against the real engine
- [x] Main entry reaches no TipTap module
- [x] TipTap optional peers

Where: `src/editor/`.

### R-T4

**Text decorations and the edit elements.** Text, P1, done.

Target: Text renders u, s, ins, del, mark, kbd, code, sub, sup and a meaning-free decoration.

Done when:

- [x] Unit test
- [x] Values match the reading vocabulary

Where: `src/components/Text/`.

### R-T5

**Prove the touch toolbar on real devices.** Text, P1, ready.

Target: The toolbar stays above the keyboard on iOS Safari and Android Chrome.

Done when:

- [ ] Recorded on a phone of each kind, as D-4 was
- [ ] The visualViewport inset measured, not assumed

Where: `src/components/RichTextSurface/useKeyboardInset.ts`.

### R-T6

**Mentions popover wears .cr-frost.** Text, P2, done.

Target: The suggestion popover's hand-written Frost goes.

Done when:

- [x] verify:materials compares it with .cr-frost

Where: `src/components/RichTextSurface/RichTextSurface.module.scss`.

### R-T7

**EditorBlock offers the bound editor in a story.** Text, P2, done.

Target: The editor block shown with RichTextEditor, save state and announcements together.

Done when:

- [x] Story and unit test

Where: `src/components/EditorBlock/`. Depends on D-30.

### R-T8

**Screen-reader pass on the editor.** Text, P3, ready.

Target: VoiceOver and NVDA read the toolbar state, the block type, the checklist and the announcements as designed.

Done when:

- [ ] Recorded findings, each fixed or filed

Where: `src/editor/`.

### R-T9

**Wear the published prose and editor recipes and delete the copies.** Text, P1, blocked.

Target: Prose and RichTextSurface wear .cr-prose, .cr-editor and .cr-editor-toolbar; the selection toolbar wears .cr-frost.bar.

Done when:

- [ ] styles/_prose.scss retired or reduced to what core does not publish

Where: `src/styles/_prose.scss`. Depends on C-R1.

### R-A0

**Motion catalogue story.** Motion, P1, done.

Target: Every recipe and preset playable on demand, on its own material.

Done when:

- [x] 59 recipes, 8 presets; continuous recipes behind a pending toggle

Where: `src/motion/MotionCatalogue.stories.tsx`.

### R-A1

**Sort the hand-written material (re-evaluation rec. 6).** Materials, P1, ready.

Target: Each of the 29 directories with hand-written backdrop-filter and the 49 using material mixins either wears a surface or is filed upstream as a composition the vocabulary lacks.

Done when:

- [ ] audit-recipes.mjs reports the count falling
- [ ] verify:materials covers each surface worn

Where: `scripts/audit-recipes.mjs, src/components/`.

### R-A2

**Confirm the 105 entries whose surface is not worn in their own markup.** Materials, P2, ready.

Target: Each is either worn through a child (recorded) or fixed.

Done when:

- [ ] audit.json carries the reason per entry

Where: `scripts/audit-recipes.mjs`.

### R-A3

**Cascader plays the field recipes.** Motion, P2, done.

Target: field-focus, field-invalid and field-valid on the cascader's shell.

Done when:

- [x] Manifest credits all three

Where: `src/components/Cascader/`.

### R-A4

**Product gallery and playlist block play their assigned motion.** Motion, P2, done.

Target: media-in on the product gallery; list-in and list-out on the playlist block.

Done when:

- [x] Manifest credits them; verify:behaviour checks one each

Where: `src/components/ProductGallery/, PlaylistBlock/`.

### R-A5

**The view stack plays view-push-out.** Motion, P3, done.

Target: The view a push covers stays beneath the arrival and plays view-push-out before it unmounts; the stack had never made that movement, so crediting the recipe would have been false.

Done when:

- [x] recipesPlayedByNoComponent no longer lists it

Where: `src/components/ViewStack/`.

### R-A9

**The Haze reading fill in the popover, the pop-confirm and the menu.** Audit, P2, ready.

Target: Popover and Popconfirm content, and Menu rows, sit on the Haze reading fill their catalogue entries specify inside the Frost panel, measured against the .cr-haze recipe; core then assigns the haze surface and removes the three from UNMEASURED in build-catalogue.cjs.

Done when:

- [ ] Measured in the Storybook (computed ::before fill and feather) for each of the three
- [ ] A verify:materials row for each

Where: `src/components/Popover/, Popconfirm/, Menu/`.

### R-A10

**The Resin thumb on the colour area, slider and wheel.** Audit, P2, ready.

Target: The colour controls draw the Resin thumb their catalogue entries specify (today the thumb is the picked colour), measured against the .cr-resin recipe; core then assigns the resin surface and removes the three from UNMEASURED.

Done when:

- [ ] Measured in the Storybook for each of the three
- [ ] The picked colour stays visible inside the thumb

Where: `src/components/ColorPicker/`.

### R-Q1

**Documentation site from the surfaces (re-evaluation rec. 7, Slice Q).** Docs, P2, ready.

Target: One page per surface with its recipe values and every component made of it.

Done when:

- [ ] 23 pages generated from surface-recipes.json and the manifest

Where: `docs site (Slice Q)`. Depends on C-R1.

### R-A8

**The travelling selection pill on strips (D-37).** Motion, P2, blocked, by the ruling on D-37.

Target: Tabs, the segmented control, the dock, bottom navigation and toggle button groups render one selection pill from styles/_strip.scss, measured against the selected segment and moved by the new recipe when a person changes the selection; instant under reduced motion; label weight unchanged.

Done when:

- [ ] verify:behaviour checks the pill ends under the selected segment after a click and after the arrow keys, in both text directions
- [ ] verify:appearance unchanged at rest
- [ ] No movement on first render or when the selection changes programmatically without a person

Where: `src/styles/_strip.scss, src/components/Tabs/, SegmentedControl/, Dock/, BottomNavigation/, ButtonGroup/`. Depends on C-M3, C-R1.
