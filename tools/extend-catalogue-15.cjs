#!/usr/bin/env node
/* Fifteenth catalogue extension: the travelling selection pill (C-M3, D-37).
 *
 * Meridian ruled D-37 (a) on 2 October 2026: one `.cr-indicator.pill` behind
 * the selected segment of every strip, moved by a new critically damped recipe
 * between measured positions, on tabs, the segmented control, the dock, bottom
 * navigation and toggle button groups, with selection staying label weight.
 *
 * The strips that played `selection`, the squash where the new segment stands,
 * now play `selection-travel`: the fill that moves is the pill, so squashing a
 * segment the pill is still on its way to would be a second account of the same
 * change. Tabs keep `tab-in` on the panel. The button group keeps `press` and
 * gains the pill for the case where it is a toggle set; a group of actions has
 * no selection and draws no pill. The materials name the pill rather than a fill
 * on the segment, because the segment no longer paints one once the pill is
 * placed.
 *
 * Old values are quoted below. Idempotent; refuses to write on an unknown id,
 * an unknown surface or recipe, or a value that is neither the old one nor the
 * new one.
 *
 *   node tools/extend-catalogue-15.cjs --write
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
  ['dock', 'motion', ['selection'], ['selection-travel']],
  ['dock', 'material', 'Resin plane, Stone label backing, primary fill on the selected destination', 'Resin plane, Stone label backing, the primary pill behind the selected destination'],
  ['tabs', 'motion', ['tab-in'], ['tab-in', 'selection-travel']],
  ['tabs', 'material', 'Resin strip, primary fill on the selected tab', 'Resin strip, the primary pill behind the selected tab'],
  ['bottom-navigation', 'motion', ['selection'], ['selection-travel']],
  ['bottom-navigation', 'crystal', 'Material, geometry, selection by label weight, safe-area inset', 'Material, geometry, selection by label weight with the pill behind it, safe-area inset'],
  ['segmented-control', 'motion', ['selection'], ['selection-travel']],
  ['segmented-control', 'material', 'One Resin plane; primary fill on the selected segment', 'One Resin plane; the primary pill behind the selected segment'],
  ['button-group', 'motion', ['press'], ['press', 'selection-travel']],
  ['button-group', 'crystal', 'The shared plane and interior separation', 'The shared plane and interior separation; as a toggle set, the pill behind the pressed button'],
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
