#!/usr/bin/env node
/* Sixth catalogue extension: the surfaces that disagreed with their own entries.
 *
 * D-23, ruled by Meridian on 28 September 2026: "fix the catalogue surfaces".
 * Crystal React measured every component against the class its catalogue surface
 * names, planted beside it in a browser, and found the surface field saying one
 * thing while the entry's own prose, its geometry, or the rendered component said
 * another. The rendering is the evidence — the documentation site's, and the
 * library's where the library had been measured against the site — so the surface
 * moves to what renders, and prose that contradicts it is corrected.
 *
 *   - Seven strips are docks, not Resin planes. Tabs, the segmented control, the
 *     toolbar, the command bar, the action bar, the button group and the split
 *     button render as Resin holding one Haze fill under their controls — measured
 *     identical to `.cr-dock` in every material property, and the strip mixin was
 *     measured from Crystal's own site. `.cr-resin` is a different composition: a
 *     plane with an optical sheen and no reading fill.
 *   - The resizable handle and the image comparison's thumb are Resin handles, as
 *     their own prose says. `drag-handle` is a grab-to-move grip, which on a 4px
 *     splitter adds padding and a dot grid and over photographs is a muted grip on
 *     no material.
 *   - The media controls are the Resin plane at its pill, as their geometry says,
 *     not the Resin panel.
 *   - The rich text surface is a field: a Resin shell around a Haze well, which is
 *     what `resin` + `haze` described, and it is edited like one.
 *   - The rail's prose said "Resin active destination" while its surface said
 *     `nav-item`; the entry is the navigation entry, with the location dot.
 *   - The dialog's geometry said the content radius and `.cr-dialog` draws the
 *     panel radius, which is what the documentation site renders.
 *   - The tooltip's 18px radius was prose only; it is a token now.
 *
 * Old values are quoted below. Idempotent; refuses to write on an unknown id, an
 * unknown surface, or a sentence that is neither the old one nor the new one.
 *
 *   node tools/extend-catalogue-6.cjs --write
 */
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.resolve(__dirname, '../core/tokens/catalogue');
const SURFACES = new Set(require('../core/tokens/surfaces.json').surfaces.map((s) => s.id));
const WRITE = process.argv.includes('--write');

/* [entry, the surface it had, the surface it has now] */
const SURFACE = [
  ['tabs', ['resin'], ['dock']],
  ['segmented-control', ['resin'], ['dock']],
  ['toolbar', ['resin'], ['dock']],
  ['command-bar', ['resin'], ['dock']],
  ['action-bar', ['resin'], ['dock']],
  ['button-group', ['resin'], ['dock']],
  ['split-button', ['resin'], ['dock']],
  ['resizable', ['drag-handle'], ['resin']],
  ['image-compare', ['drag-handle'], ['resin']],
  ['media-controls', ['resin-panel'], ['resin']],
  ['rich-text-surface', ['resin', 'haze'], ['field']],
];

/* [entry, field, the sentence it had, the sentence it has now] */
const PROSE = [
  ['nav-rail', 'material',
    'Frost panel, Resin active destination',
    'Frost panel; its destinations are navigation entries, the current one at weight 800 on the surface-alt fill with the location dot'],
  ['dialog', 'geometry',
    'Content radius; 12px minimum from content to the feathered edge',
    'Panel radius (the content radius plus 6px), as .cr-dialog draws it; 12px minimum from content to the feathered edge'],
  ['tooltip', 'geometry',
    '18px radius; compact padding',
    '18px radius (component.overlay.tooltipRadius); compact padding'],
];

const problems = [];
for (const [id, , now] of SURFACE) for (const s of now) if (!SURFACES.has(s)) problems.push(`${id}: surface "${s}" is not in surfaces.json`);

const seen = new Set();
const report = { surfaceCorrected: 0, proseCorrected: 0, alreadyApplied: 0 };
const writes = [];
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()) {
  const full = path.join(DIR, file);
  const category = JSON.parse(fs.readFileSync(full, 'utf8'));
  let changed = false;
  for (const c of category.components) {
    seen.add(c.id);
    for (const [id, was, now] of SURFACE) {
      if (id !== c.id) continue;
      const have = JSON.stringify(c.surface);
      if (have === JSON.stringify(now)) { report.alreadyApplied += 1; continue; }
      if (have !== JSON.stringify(was)) { problems.push(`${id}.surface is ${have}, neither ${JSON.stringify(was)} nor ${JSON.stringify(now)}`); continue; }
      console.log(`  ${id}: surface ${have} → ${JSON.stringify(now)}`);
      c.surface = now; changed = true; report.surfaceCorrected += 1;
    }
    for (const [id, field, was, now] of PROSE) {
      if (id !== c.id) continue;
      if (c[field] === now) { report.alreadyApplied += 1; continue; }
      if (c[field] !== was) { problems.push(`${id}.${field} is neither the sentence this corrects nor its correction: ${JSON.stringify(c[field])}`); continue; }
      console.log(`  ${id}.${field}: corrected`);
      c[field] = now; changed = true; report.proseCorrected += 1;
    }
  }
  if (changed) writes.push([full, category]);
}
for (const [id] of SURFACE) if (!seen.has(id)) problems.push(`surface map names "${id}", which is not in the catalogue`);
for (const [id] of PROSE) if (!seen.has(id)) problems.push(`prose map names "${id}", which is not in the catalogue`);

if (problems.length) {
  console.error('Refusing to write:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
if (WRITE) for (const [full, category] of writes) fs.writeFileSync(full, JSON.stringify(category, null, 2) + '\n');
console.log(JSON.stringify({ ...report, entries: seen.size, wrote: WRITE }, null, 2));
if (!WRITE) console.log('Dry run. Pass --write to apply.');
