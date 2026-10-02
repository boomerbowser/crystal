#!/usr/bin/env node
/* Eighth catalogue extension: media and text, 2 October 2026.
 *
 * proposals/2026-10-02-media-text-and-recipe-parity.md holds the findings and
 * the reasoning. Ten entries change. None is added or removed, so the catalogue
 * stays at 284 and no platform gains a component it must build; each of the ten
 * gains states, anatomy and semantics it was already expected to have in use.
 *
 *   - The players. A video player that cannot change its subtitle language, its
 *     audio track, its speed or its frame is not one a product can ship, so each
 *     of those becomes part of the anatomy, with its semantics: the choices are
 *     a menu of radio items whose selection is label weight (never a check
 *     mark), and every change is announced. The caption cue is Stone, which the
 *     vocabulary already says is "a caption on media", and the settings menu is
 *     Frost, as every transient overlay is (R15e). The audio player gains the
 *     Haze card it was specified with and never drew.
 *   - The text. The rich text surface gains Crystal's format vocabulary: the
 *     block types, the marks, the checklist, the selection toolbar and the touch
 *     placement of the toolbar. The engine stays the product's (D-30 asks
 *     whether that should change). Prose, the prose list and text gain the same
 *     vocabulary in read-only form, so a document reads the same after it is
 *     saved as while it is edited.
 *
 * Every field is replaced whole, and the old value is quoted, so a reader can
 * see exactly what changed. Idempotent; refuses to write on an unknown id, an
 * unknown surface or recipe, or a field that is neither the old value nor the
 * new one.
 *
 *   node tools/extend-catalogue-8.cjs --write
 */
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.resolve(__dirname, '../core/tokens/catalogue');
const SURFACES = new Set(require('../core/tokens/surfaces.json').surfaces.map((s) => s.id));
const RECIPES = new Set(require('../core/tokens/motion-recipes.json').recipes.map((r) => r.id));
const PRESETS = new Set(require('../core/assets/core/presets.js').PRESETS);
const WRITE = process.argv.includes('--write');

/* [entry, field, the value it had, the value it has now] */
const FIELDS = [
  /* ------------------------------------------------------------ video player */
  ['video-player', 'anatomy',
    'A video surface with Crystal transport controls.',
    'A media stage at a set aspect ratio holding the video, a caption cue above the transport, and the transport inset from the stage: play, skip, the scrubber with its two time readouts, mute and volume, then a settings menu (playback speed, subtitles and captions, audio track, quality), picture in picture and full screen.'],
  ['video-player', 'states',
    ['idle', 'playing', 'paused', 'buffering', 'ended', 'focus-visible'],
    ['idle', 'playing', 'paused', 'buffering', 'ended', 'focus-visible', 'captions-on', 'settings-open', 'picture-in-picture', 'full-screen']],
  ['video-player', 'material',
    'Resin control bar over the video; Haze fills behind readable labels',
    'Resin transport over the video with Haze fills behind its time readouts; Stone behind caption cues; Frost settings menu'],
  ['video-player', 'surface',
    ['resin', 'haze'],
    ['resin', 'haze', 'stone', 'frost']],
  ['video-player', 'geometry',
    'Control bar is a pill; every control reaches 44px.',
    'The stage keeps the content radius and the aspect ratio the product sets (16:9, 4:3, 1:1, 9:16 or the media\'s own). The transport is a pill inset 12px from the stage, or the safe area in full screen, with 4px block padding around its controls (58px with its rim); every control reaches the 48px action target. Caption cues sit above the transport, never under it. Below 420px the transport wraps its trailing controls onto a second row.'],
  ['video-player', 'semantics',
    'Native video element underneath. Controls are real buttons, captions are supported and their state is announced, and keyboard shortcuts do not trap focus.',
    'Native video element underneath. Controls are real buttons, captions are supported and their state is announced, and keyboard shortcuts do not trap focus. Speed, subtitle, audio-track and quality choices are menus of radio items (menuitemradio with aria-checked); the selected item is shown by label weight, never a check mark, and each change is announced in words. A choice the engine cannot make (an audio track list where the browser exposes none, picture in picture where it is unsupported) is not offered.'],
  ['video-player', 'crystal',
    'Control-bar material, transport geometry, the motion of showing and hiding controls',
    'Stage, transport and caption materials, transport geometry and insets, the settings menu, the motion of showing and hiding controls'],
  ['video-player', 'product',
    'Sources, captions, DRM, analytics',
    'Sources, caption and audio tracks, quality renditions and their switching (adaptive streaming), DRM, analytics'],
  ['video-player', 'motion',
    ['media-in'],
    ['media-in', 'menu-in', 'menu-out']],

  /* ------------------------------------------------------------ audio player */
  ['audio-player', 'anatomy',
    'An audio transport with scrubbing and volume.',
    'A Haze card holding the title and any secondary line (artist, episode, chapter), with the transport inset from its edge: play, skip, the scrubber with its two time readouts, mute and volume, and a settings menu for playback speed.'],
  ['audio-player', 'states',
    ['idle', 'playing', 'paused', 'buffering', 'ended', 'focus-visible'],
    ['idle', 'playing', 'paused', 'buffering', 'ended', 'focus-visible', 'settings-open']],
  ['audio-player', 'material',
    'Resin plane with Haze readable regions',
    'Haze card holding a Resin transport; Frost settings menu'],
  ['audio-player', 'surface',
    ['resin', 'haze'],
    ['haze', 'resin', 'frost']],
  ['audio-player', 'geometry',
    'Pill; the scrubber is a slider with a 44px thumb.',
    'The card keeps the content radius and the card padding (20px); the transport is a pill with 4px block padding around its controls; the scrubber is a slider with a 44px thumb.'],
  ['audio-player', 'motion',
    ['media-in'],
    ['media-in', 'menu-in', 'menu-out']],

  /* ---------------------------------------------------------- media controls */
  ['media-controls', 'anatomy',
    'The shared transport used by both players.',
    'The shared transport used by both players: play, skip, the scrubber between two time readouts, mute and volume, then the controls a player adds (settings, picture in picture, full screen).'],
  ['media-controls', 'geometry',
    'Pill; 44px targets throughout.',
    'Pill with 4px block and 12px inline padding around its 48px controls (58px tall with its rim), 4px between them. Time readouts are tabular and sit on Haze pills.'],
  ['media-controls', 'surface',
    ['resin'],
    ['resin', 'haze']],
  ['media-controls', 'material',
    'Resin plane',
    'Resin plane; Haze behind the time readouts'],

  /* ------------------------------------------------------------ player shell */
  ['player-shell', 'semantics',
    'Real media elements; captions and their state announced; transport reachable by keyboard.',
    'Real media elements; captions and their state announced; transport reachable by keyboard; speed, track and quality choices announced as they change.'],

  /* ------------------------------------------------------- rich text surface */
  ['rich-text-surface', 'anatomy',
    'A toolbar of formatting actions above an editable content surface.',
    'A formatting toolbar and an editable surface. The toolbar holds Crystal\'s format vocabulary in groups: the block type (paragraph, headings two to four, bulleted list, numbered list, checklist, quotation, code block), the marks (bold, italic, underline, strikethrough, inline code, highlight, link, subscript, superscript) and history (undo, redo). A selection toolbar of the commonest marks floats over highlighted text.'],
  ['rich-text-surface', 'states',
    ['idle', 'focus', 'selection-active', 'disabled', 'read-only'],
    ['idle', 'focus', 'selection-active', 'selection-toolbar-open', 'touch-keyboard-open', 'disabled', 'read-only']],
  ['rich-text-surface', 'material',
    'Resin toolbar, Haze editing surface',
    'Resin toolbar, Haze editing surface; Frost selection toolbar'],
  ['rich-text-surface', 'surface',
    ['field'],
    ['field', 'frost']],
  ['rich-text-surface', 'geometry',
    'Toolbar is a pill group; surface at content radius',
    'Toolbar controls are 48px pills in separated groups on the field shell\'s Haze well; the surface keeps the content radius and the card padding (20px). On a fine pointer the toolbar sits above the text; on a coarse pointer it sits below the text and sticks above the on-screen keyboard.'],
  ['rich-text-surface', 'semantics',
    'Toolbar actions use aria-pressed for active formatting; the editor exposes its own semantics',
    'Toolbar actions use aria-pressed for active formatting, and the block type is a single control naming the current type. A format changed by a keyboard shortcut while focus is in the text is announced politely. The editor exposes its own semantics: real headings, lists and checkboxes in the document, so a screen reader navigates it as it would the published page.'],
  ['rich-text-surface', 'crystal',
    'Toolbar and surface appearance, active-format treatment',
    'Toolbar and surface appearance, active-format treatment, the format vocabulary and its rendering (shared with prose), the selection toolbar, toolbar placement on touch'],
  ['rich-text-surface', 'product',
    'The entire editing engine, serialisation and paste handling',
    'The editing engine, serialisation and paste handling, and which parts of the format vocabulary a product offers'],
  ['rich-text-surface', 'note',
    'Crystal specifies the surface only. Do not rebuild a rich-text engine to obtain this appearance.',
    'Crystal specifies the surface and the format vocabulary. Do not rebuild a rich-text engine to obtain this appearance; bind an existing one. Whether a library may ship an optional binding of its own is D-30.'],
  ['rich-text-surface', 'motion',
    [],
    ['field-focus', 'field-invalid', 'field-valid', 'menu-in', 'menu-out']],

  /* ------------------------------------------------------------ editor block */
  ['editor-block', 'anatomy',
    'A rich text surface with toolbar, and save state.',
    'A rich text surface with its toolbar and selection toolbar, a save state in words, and the save action.'],

  /* ---------------------------------------------------------------- typography */
  ['prose', 'anatomy',
    'Long-form content with consistent rhythm across headings, lists, tables, code and media.',
    'Long-form content with consistent rhythm across headings, lists and checklists, quotations, tables, code and media, and the inline marks: links, emphasis, underline, strikethrough, insertions and deletions, highlights, inline code, keys, subscript and superscript.'],
  ['prose', 'semantics',
    'Anchor navigation must preserve focus when sections change',
    'Anchor navigation must preserve focus when sections change. Every mark differs in shape as well as colour (an insertion is underlined, a deletion struck through, a highlight filled), and each is its own element (ins, del, mark, u, s), so none rests on colour alone.'],
  ['prose-list', 'anatomy',
    'Ordered and unordered lists inside running text, with Crystal markers.',
    'Ordered and unordered lists inside running text, with Crystal markers, and checklists whose markers are checkboxes.'],
  ['prose-list', 'states',
    ['at-rest'],
    ['at-rest', 'checked', 'unchecked']],
  ['prose-list', 'semantics',
    'Real ul and ol so the count and nesting are announced.',
    'Real ul and ol so the count and nesting are announced. A checklist item\'s marker is a native checkbox, read-only when the list is, so its state is announced; a finished item recedes to the muted ink and is not struck through.'],
  ['text', 'states',
    ['default', 'muted', 'truncated', 'clamped'],
    ['default', 'muted', 'truncated', 'clamped', 'underlined', 'struck-through']],
  ['text', 'anatomy',
    'Body copy with size, weight, colour role and truncation options.',
    'Body copy with size, weight, colour role, decoration (underline, strikethrough) and truncation options.'],
];

const problems = [];
for (const [id, field, , now] of FIELDS) {
  if (field === 'surface') for (const s of now) if (!SURFACES.has(s)) problems.push(`${id}: surface "${s}" is not in surfaces.json`);
  if (field === 'motion') for (const r of now) if (!RECIPES.has(r) && !PRESETS.has(r)) problems.push(`${id}: motion "${r}" is neither a recipe nor a preset`);
}

const seen = new Set();
const report = { fieldsChanged: 0, alreadyApplied: 0 };
const writes = [];
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()) {
  const full = path.join(DIR, file);
  const category = JSON.parse(fs.readFileSync(full, 'utf8'));
  let changed = false;
  for (const c of category.components) {
    seen.add(c.id);
    for (const [id, field, was, now] of FIELDS) {
      if (id !== c.id) continue;
      /* A missing array field is the empty list, as the other tools read it. */
      const have = JSON.stringify(c[field] ?? (Array.isArray(was) ? [] : undefined));
      if (have === JSON.stringify(now)) { report.alreadyApplied += 1; continue; }
      if (have !== JSON.stringify(was)) { problems.push(`${id}.${field} is ${have}, neither the old nor the new value`); continue; }
      console.log(`  ${id}.${field} changed`);
      c[field] = now; changed = true; report.fieldsChanged += 1;
    }
  }
  if (changed) writes.push([full, category]);
}
for (const [id, field] of FIELDS) if (!seen.has(id)) problems.push(`${id}.${field}: "${id}" is not in the catalogue`);

if (problems.length) {
  console.error('Refusing to write:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
if (WRITE) for (const [full, category] of writes) fs.writeFileSync(full, JSON.stringify(category, null, 2) + '\n');
console.log(JSON.stringify({ ...report, entries: seen.size, wrote: WRITE }, null, 2));
if (!WRITE) console.log('Dry run. Pass --write to apply.');
