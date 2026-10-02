# Captures: media, text and recipe parity, 2 October 2026

What was captured, how, and what it was compared against.

## How

All captures were taken by Playwright's Chromium (the copy Crystal React
installs, 1.63) at device scale 1, after `networkidle` and a settle delay.

| Folder or file | Source | Viewport |
|---|---|---|
| `before/*.png` | Crystal React's Storybook (`pnpm storybook`, port 6006) at the working tree before this change: the copy rewrite of 1 October, with no media or text work. One Tab press after load, so hover- and focus-only chrome (the video transport) shows. | 760×520 |
| `after/*.png` | The same Storybook after this change, same stories where they still exist, plus the new ones. Videos are seeked to 3.2 s, so a caption cue is in the picture. | 760×520 |
| `after/*--phone.png` | The editor in a touch context (`hasTouch`, `isMobile`), so the toolbar takes its coarse-pointer placement. | 390×760 |
| `examples-*.png` | The pages in `../examples/`, served by `../examples/serve.cjs`, which load `core/assets/crystal-theme.css` and `core/assets/crystal.css` by relative path and add layout only. First screen of each page. | 1280×1000 |

The file name is the Storybook story id, then the colour scheme. Dark mode is
Storybook's `mode` global (`globals=mode:dark`), which is how a reviewer
switches it.

## What each pair shows

| Before | After | What changed |
|---|---|---|
| `media-audio-player--with-a-title` | same | The player gains its Haze card and padding; the play button no longer sits flush with the pill. |
| `media-video-player--with-captions` | same, and `--with-settings` | The stage holds 16:9; the transport is inset 12px; readouts on Haze; settings, picture in picture and full screen; the cue on Stone above the bar. The before frame shows the collapsed stage. |
| `media-media-controls--with-volume-and-skip` | same | Readouts on Haze pills in text ink; the scrubber's thumb no longer covers `0:00`. |
| `blocks-playershell--video`, `--audio` | same | The shell inherits both players' changes. |
| `inputs-richtextsurface--default` | same, and `inputs-richtexteditor--every-format` | The surface wears `.cr-field-shell` in place of its hand-written Resin; the bound editor shows the whole vocabulary. |
| `blocks-editorblock--at-rest` | same | The block inherits the surface's frame. |
| `typography-scale-and-prose--long-form` | same | `Prose` renders through the shared vocabulary mixin. The before and after are pixel-identical in both modes (ImageMagick `compare -metric AE`: 0 differing pixels), so the refactor changed nothing it already rendered. |
| (none) | `foundations-motion-catalogue--material-compositions` | The five compositions no component plays, on their materials. |

## Compared against

The approved Crystal visual baseline (`crystal-preview/website/reference/approved-crystal/`),
for the qualities AGENTS.md lists: distinct Plastic, Frost and Resin; transmitted
contextual colour; optical rims; elevation; feathered Haze and Stone paint; crisp
foregrounds. Inspected by eye in both modes. What was checked specifically:

- The transport is Resin with its rims and float shadow, and its readouts are
  Haze, crisp, over a moving picture.
- The caption is Stone: feathered at the edge, crisp text, above the bar.
- The settings menu is Frost (R15e) and its chosen item is weight and the
  selected fill, with no mark.
- The audio card is Haze with the card padding, and the transport sits on it as
  a control plane on a reading surface.
- The editor's frame is the field shell (Resin surround, Haze well); its toolbar
  controls are bare on the well, because Resin never contains Resin; checklist
  boxes are Crystal's selection control.
- The selection toolbar is Frost with a pill silhouette.

Measured rather than looked at: the stage's ratio, the transport's insets, the
readouts' fill, the thumb's position, the cue's position above the bar, the audio
card's padding, and the editor's touch layout and page width are all asserted in
Crystal React's `verify:behaviour`.

## Not captured

Forced colours, reduced transparency and the opaque effects mode for the new
recipes: each has its branch in `crystal.css`, and none was photographed. Safari
and Firefox. A real phone with a real on-screen keyboard (task R-T5).
