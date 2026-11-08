#!/usr/bin/env node
/* Thirteenth catalogue extension: the reader's caption style (C-S5).
 *
 * Crystal React has offered a caption style since R-M12: a larger size (1.25
 * or 1.5 times the cue's range) and a solid backing, kept for the reader
 * across players. `crystal.css` now publishes it on `.cr-media-caption` as
 * `.large`, `.larger` and `.solid` (recorded in surface-recipes.json), so the
 * video player's entry names the choice in its anatomy and its semantics and
 * every platform offers what Crystal React does.
 *
 * Old values are quoted below. Idempotent; refuses to write on an unknown id,
 * an unknown surface or recipe, or a value that is neither the old one nor the
 * new one.
 *
 *   node tools/extend-catalogue-13.cjs --write
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
  ['video-player', 'anatomy',
    "A media stage at a set aspect ratio holding the video, a caption cue above the transport, and the transport inset from the stage: play, skip, the scrubber with its two time readouts, mute and volume, then a settings menu (playback speed, subtitles and captions, audio track, quality), picture in picture and full screen.",
    "A media stage at a set aspect ratio holding the video, a caption cue above the transport, and the transport inset from the stage: play, skip, the scrubber with its two time readouts, mute and volume, then a settings menu (playback speed, subtitles and captions, caption style, audio track, quality), picture in picture and full screen."],
  ['video-player', 'semantics',
    "Native video element underneath. Controls are real buttons, captions are supported and their state is announced, and keyboard shortcuts do not trap focus. Speed, subtitle, audio-track and quality choices are menus of radio items (menuitemradio with aria-checked); the selected item is shown by label weight, never a check mark, and each change is announced in words. A choice the engine cannot make (an audio track list where the browser exposes none, picture in picture where it is unsupported) is not offered.",
    "Native video element underneath. Controls are real buttons, captions are supported and their state is announced, and keyboard shortcuts do not trap focus. The caption style (a larger size, 1.25 or 1.5 times, and a solid backing on the opaque surface) is the reader's: it is kept for every player the reader opens and drawn with `.cr-media-caption`'s `.large`, `.larger` and `.solid`. Speed, subtitle, caption-style, audio-track and quality choices are menus of radio items (menuitemradio with aria-checked); the selected item is shown by label weight, never a check mark, and each change is announced in words. A choice the engine cannot make (an audio track list where the browser exposes none, picture in picture where it is unsupported) is not offered."],
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
