#!/usr/bin/env node
/* Second catalogue extension: the capabilities, not just the names.
 *
 * Meridian's parity requirement was never only "a component with this name
 * exists" — it was the functionality that ships as an extension or add-on
 * elsewhere: click-and-drag, upload zones, media players, galleries, command
 * palettes, resizable tables, virtualisation. The first extension counted
 * components against four benchmark libraries and missed this, because counting
 * names against names cannot see a missing capability.
 *
 * Two sources this time:
 *
 *   1. React Aria's own component list, enumerated from the installed package.
 *      CONTRACT §3 says to wrap a maintained primitive rather than rebuild it, so
 *      a primitive React Aria ships that Crystal does not name is a gap by
 *      definition — Crystal would be leaving accessible behaviour on the floor.
 *   2. Meridian's named list: click-and-drag, File Input / Upload / UploadZone,
 *      Spotlight, floating action, navbar and submenu types, animated toasts and
 *      banners, alerts, loading and skeletons, pagination, portal, video and
 *      music players, gallery and carousel.
 *
 *   node tools/extend-catalogue-2.cjs          report
 *   node tools/extend-catalogue-2.cjs --write  apply
 */
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.resolve(__dirname, '../core/tokens/catalogue');
const WRITE = process.argv.includes('--write');

const R = 'Resin', H = 'Haze', F = 'Frost', S = 'Stone';
const c = (id, name, anatomy, states, material, geometry, semantics, crystal, product, parity) =>
  ({ id, name, anatomy, states, material, geometry, semantics, crystal, product, parity });

const ADDITIONS = {
  '02-navigation': [
    c('menubar', 'Menubar', 'A horizontal bar of menu triggers, each opening its own menu.',
      ['closed', 'open', 'focus-visible'], `Bar inherits; menus are ${F}`,
      'Triggers are pills; menus keep panel radius.',
      'Menubar semantics: arrows move between triggers, Home and End jump, typeahead selects.',
      'Materials, open and close motion, focus handling', 'Menu structure and actions',
      ['react-aria:Menu', 'primereact:menubar', 'antd:Menu']),
    c('submenu', 'Submenu', 'A menu opened from an item inside another menu.',
      ['closed', 'open', 'focus-visible'], `${F} panel`,
      'Offset from its parent item; flips at the viewport edge.',
      'The parent item carries aria-haspopup and aria-expanded; the submenu is reachable by arrow key and closes with Escape without closing its parent.',
      'Panel material, stagger, edge flipping', 'Nesting depth and content',
      ['react-aria:SubmenuTrigger', 'primereact:tieredmenu']),
  ],
  '04-inputs': [
    c('color-area', 'Colour area', 'A two-dimensional field for saturation and brightness.',
      ['at-rest', 'dragging', 'focus-visible', 'disabled'], `${R} thumb over the gradient field`,
      'Thumb reaches 44px including its hit area.',
      'Two linked sliders; each axis announces its own value and responds to arrow keys.',
      'Thumb material, focus ring, contrast of the thumb against any underlying colour',
      'Colour space and value', ['react-aria:ColorArea']),
    c('color-slider', 'Colour slider', 'One channel of a colour, as a track.',
      ['at-rest', 'dragging', 'focus-visible', 'disabled'], `${R} thumb on a gradient track`,
      'Matches the slider contract.',
      'role="slider" with the channel named and the value in that channel\'s units.',
      'Thumb and track material, focus ring', 'Which channel, and the colour space',
      ['react-aria:ColorSlider']),
    c('color-wheel', 'Colour wheel', 'Hue as a ring.',
      ['at-rest', 'dragging', 'focus-visible', 'disabled'], `${R} thumb on the hue ring`,
      'Ring thickness is a declared proportion of the radius.',
      'role="slider" in degrees, wrapping at 360.',
      'Thumb material, ring geometry, focus ring', 'Colour space',
      ['react-aria:ColorWheel']),
    c('color-swatch', 'Colour swatch', 'One colour, shown as a surface.',
      ['at-rest', 'selected', 'focus-visible'], `${H} chequerboard beneath a transparent colour`,
      'Content radius; selection is a ring, never a check mark.',
      'Carries the colour name as text, because colour cannot be the only carrier.',
      'Transparency treatment, selection ring, contrast', 'The colour and its name',
      ['react-aria:ColorSwatch']),
    c('color-swatch-picker', 'Colour swatch picker', 'A set of swatches, one selectable.',
      ['at-rest', 'selected', 'focus-visible'], 'Inherits from its swatches',
      'Grid gap follows the spacing scale.',
      'A listbox of swatches; arrow keys move, and the selected one is announced by name.',
      'Selection rendering, focus order', 'The palette offered',
      ['react-aria:ColorSwatchPicker']),
    c('token-field', 'Token field', 'A text field whose committed values become removable tokens.',
      ['at-rest', 'focus-visible', 'invalid', 'disabled'], `${H} field fill; tokens are ${H} chips`,
      'Field keeps the content radius; tokens are pills.',
      'Each token is removable by keyboard and announces its removal; the field keeps its own value.',
      'Token material, add and remove motion, focus return after removal',
      'What may be tokenised, and duplicate policy', ['react-aria:TokenField', 'mantine:PillsInput']),
    c('upload', 'Upload', 'A file input with progress, retry and per-file status.',
      ['idle', 'selecting', 'uploading', 'succeeded', 'failed', 'focus-visible'],
      `${R} control with ${H} file rows`,
      'Rows keep the content radius; the trigger is a pill.',
      'Progress is announced politely; a failure is announced assertively and is retryable by keyboard.',
      'Materials, progress rendering, status colour from the status tokens, retry affordance',
      'Transport, chunking, retry policy, accepted types',
      ['primereact:fileupload', 'antd:Upload']),
    c('upload-zone', 'Upload zone', 'A drop target that accepts files by drag, paste or browse.',
      ['idle', 'drag-over', 'uploading', 'rejected', 'focus-visible'], `${H} fill with a dashed rim`,
      'Content radius; the whole zone is a 44px-plus target.',
      'Dragging is never the only route: the zone is also a button, and paste works. Rejections say why.',
      'Drag-over material change, rejection surface, motion on drop',
      'Accepted types, size limits, transport',
      ['react-aria:DropZone', 'primereact:fileupload', 'antd:Upload.Dragger']),
  ],
  '05-data-display': [
    c('navigation-tree', 'Navigation tree', 'A tree whose items are navigation destinations rather than data.',
      ['at-rest', 'expanded', 'current', 'focus-visible'], `${H} rows`,
      'Indentation per level; rows reach 44px.',
      'A tree with aria-current on the active destination; expansion is announced.',
      'Row material, expansion motion, current marking by label weight',
      'The destination set and routing', ['react-aria:NavigationTree']),
    c('resizable-table', 'Resizable table', 'A table whose columns can be resized by pointer and keyboard.',
      ['at-rest', 'resizing', 'focus-visible'], 'Inherits the table surface',
      'The resizer is a 44px target that does not shift the column it borders.',
      'The resizer is a slider: arrow keys resize, and the new width is announced.',
      'Resizer affordance, focus ring, live layout while dragging',
      'Which columns resize, and persistence',
      ['react-aria:ResizableTableContainer', 'mui-x-data-grid:GridColumnResizer']),
  ],
  '06-feedback': [
    c('banner', 'Banner', 'A full-width message pinned to the top of a region.',
      ['hidden', 'shown', 'dismissed', 'focus-visible'], `${H} fill with a status accent`,
      'Full-bleed within its region; the dismiss control is a 44px pill.',
      'role="status" for information, role="alert" for urgency. Dismissal returns focus sensibly.',
      'Material, status colour from the status tokens, entry and exit motion',
      'Copy, urgency, and whether it persists', ['antd:Alert.Banner', 'mantine:Notification']),
  ],
  '07-overlays': [
    c('overlay-arrow', 'Overlay arrow', 'The pointer that ties a popover or tooltip to its trigger.',
      ['at-rest'], 'Inherits its overlay',
      'Follows the overlay radius; flips with placement.',
      'Decorative: hidden from assistive technology.',
      'That it matches the overlay material exactly, including under reduced effects',
      'Placement', ['react-aria:OverlayArrow']),
  ],
  '09-utility': [
    c('pressable', 'Pressable', 'Makes any element respond to press across pointer, keyboard and touch.',
      ['at-rest', 'pressed', 'focus-visible', 'disabled'], 'None of its own',
      'Enforces the 44px minimum target on whatever it wraps.',
      'Gives its child button semantics unless told otherwise; never swallows keyboard activation.',
      'That the press recipe plays and the focus ring appears', 'What the press does',
      ['react-aria:Pressable']),
    c('focusable', 'Focusable', 'Makes any element focusable with Crystal\'s focus ring.',
      ['at-rest', 'focus-visible', 'disabled'], 'None of its own',
      'Focus ring at the documented offset.',
      'Adds a tab stop without inventing a role.',
      'The focus recipe', 'Why the element is focusable', ['react-aria:Focusable']),
    c('drag-handle', 'Drag handle', 'Click-and-drag reordering and transfer, by pointer and by keyboard.',
      ['at-rest', 'dragging', 'drop-target', 'focus-visible'], `${R} while lifted; ${H} drop indicator`,
      'Handle is a 44px target; the lifted item keeps its own radius.',
      'Keyboard drag is required, not optional: Enter lifts, arrows move, Enter drops, Escape cancels. Every state is announced.',
      'Lift elevation, drop-indicator material, the motion of the lift and the settle',
      'What may be dragged where, and what a drop means',
      ['react-aria:useDragAndDrop', 'mui-x-tree-view:TreeItemDragAndDropOverlay']),
    c('drop-indicator', 'Drop indicator', 'Shows where a dragged item will land.',
      ['hidden', 'shown', 'invalid-target'], `${H} line or fill`,
      'Follows the gap between items rather than covering one.',
      'Announced as the drag moves, so a keyboard drag is followable without sight.',
      'Indicator material and motion', 'Valid targets', ['react-aria:DropIndicator']),
    c('virtualizer', 'Virtualizer', 'Renders only what is near the viewport, for lists, grids and tables.',
      ['at-rest', 'scrolling', 'loading'], 'None of its own',
      'Preserves scroll position and item size across recycling.',
      'Keeps aria-setsize and aria-posinset correct, and never drops focus when a focused row recycles.',
      'Scroll surface, focus retention', 'Row sizing strategy and data',
      ['react-aria:Virtualizer', 'primereact:virtualscroller']),
    c('shared-element-transition', 'Shared element transition', 'Carries one element between two views so it reads as the same object.',
      ['idle', 'transitioning'], 'Inherits',
      'The element keeps its own geometry through the transition.',
      'Removed entirely under reduced motion; never the only way a view change is signalled.',
      'Which recipes apply, and the reduced-motion contract', 'Which elements are shared',
      ['react-aria:SharedElementTransition']),
    c('toolbar', 'Toolbar', 'A grouped set of controls with one tab stop.',
      ['at-rest', 'focus-visible'], `${R} plane or inherits`,
      'Controls are pills; the group reaches 44px.',
      'role="toolbar": one tab stop, arrows move within, orientation declared.',
      'Material, grouping geometry, focus ring', 'Which controls, and their order',
      ['react-aria:Toolbar', 'mui:Toolbar']),
    c('router-provider', 'Router provider', 'Hands the library the host application\'s navigation function.',
      ['at-rest'], 'None', 'None.',
      'Every link and navigable item routes through the host router rather than reloading the page.',
      'That navigation is consistent across every component that links',
      'Which router, and how it navigates', ['react-aria:RouterProvider']),
    c('ssr-provider', 'SSR provider', 'Keeps generated ids stable across server and client.',
      ['at-rest'], 'None', 'None.',
      'Prevents hydration mismatches in ids that label and describe controls.',
      'That labelling survives hydration', 'Where it is mounted',
      ['react-aria:SSRProvider']),
  ],
  '11-media': [
    c('video-player', 'Video player', 'A video surface with Crystal transport controls.',
      ['idle', 'playing', 'paused', 'buffering', 'ended', 'focus-visible'],
      `${R} control bar over the video; ${H} fills behind readable labels`,
      'Control bar is a pill; every control reaches 44px.',
      'Native video element underneath. Controls are real buttons, captions are supported and their state is announced, and keyboard shortcuts do not trap focus.',
      'Control-bar material, transport geometry, the motion of showing and hiding controls',
      'Sources, captions, DRM, analytics', ['primereact:galleria', 'mui:CardMedia']),
    c('audio-player', 'Audio player', 'An audio transport with scrubbing and volume.',
      ['idle', 'playing', 'paused', 'buffering', 'ended', 'focus-visible'],
      `${R} plane with ${H} readable regions`,
      'Pill; the scrubber is a slider with a 44px thumb.',
      'A real audio element. The scrubber is a slider announcing time, not a progress bar.',
      'Material, scrubber geometry, time formatting', 'Sources, playlists, streaming',
      ['mantine:Audio']),
    c('media-controls', 'Media controls', 'The shared transport used by both players.',
      ['idle', 'playing', 'paused', 'buffering', 'focus-visible'], `${R} plane`,
      'Pill; 44px targets throughout.',
      'Each control is a button with a name; play and pause are one toggle with a pressed state.',
      'Materials, the press recipe on every control', 'Which controls appear',
      ['mui:CardActions']),
    c('gallery', 'Gallery', 'A set of media with a full-screen viewer.',
      ['at-rest', 'open', 'focus-visible'], `Thumbnails are ${H}; the viewer sits on a Mirage scrim`,
      'Thumbnails keep the content radius; the viewer is full-bleed within the scrim.',
      'The viewer is a dialog: focus is contained, Escape closes, and arrows move between items with position announced.',
      'Scrim material, thumbnail material, the transition between thumbnail and viewer',
      'The media set and its captions', ['primereact:galleria', 'mui:ImageList']),
    c('lightbox', 'Lightbox', 'A single media item enlarged over a scrim.',
      ['hidden', 'open', 'focus-visible'], 'Mirage scrim; the item sits above it',
      'The item keeps its own aspect; the scrim is full-bleed.',
      'A dialog. Zoom and pan are keyboard reachable, and closing returns focus to the thumbnail.',
      'Scrim material, the open and close motion', 'The item and its caption',
      ['primereact:image']),
  ],
};

const MEDIA_META = {
  id: 'media',
  name: 'Media',
  description: 'Video, audio and galleries. Crystal named none of these before, and they are the clearest case of the parity requirement being about capability rather than nomenclature: a design system without a transport control leaves every product to invent one, and each invention re-solves captions, scrubbing and keyboard transport differently.',
  components: [],
};

let added = 0;
const report = [];

for (const [file, entries] of Object.entries(ADDITIONS)) {
  const full = path.join(DIR, `${file}.json`);
  let doc;
  if (fs.existsSync(full)) doc = JSON.parse(fs.readFileSync(full, 'utf8'));
  else if (file === '11-media') doc = { ...MEDIA_META };
  else { console.error(`No catalogue file ${file}.json`); process.exit(1); }

  const have = new Set(doc.components.map((x) => x.id));
  const fresh = entries.filter((x) => !have.has(x.id));
  if (!fresh.length) continue;
  doc.components.push(...fresh);
  added += fresh.length;
  report.push(`${file}: +${fresh.length} -> ${doc.components.length}`);
  if (WRITE) fs.writeFileSync(full, JSON.stringify(doc, null, 2) + '\n');
}

if (!added) { console.log('The catalogue already carries every addition.'); process.exit(0); }
console.log(`${added} components to add:`);
for (const line of report) console.log('  ' + line);
console.log(WRITE ? '\nWritten. Run tools/build-catalogue.cjs to regenerate parity.json.' : '\nRe-run with --write to apply.');
