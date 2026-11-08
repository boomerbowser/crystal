#!/usr/bin/env node
/* Fourteenth catalogue extension: the Resin thumb on the colour controls
 * (R-A10).
 *
 * The colour area, the colour slider and the colour wheel name "Resin thumb"
 * in their material, and until now their surface was `none`, held in
 * build-catalogue.cjs's UNMEASURED because no renderer drew the Resin thumb:
 * Crystal React's thumb was the picked colour (CONTRACT §3, measure before
 * assigning). Crystal React now draws it (crystal-react, branch
 * r-a10-resin-thumb). Measured on 7 November 2026 in Chromium against the built
 * stories on @crystal-ui/core 2.4.0, computed values, light and dark, on the
 * area, the hue slider and the wheel of "Inputs/Temporal, colour and files":
 * each thumb is `.cr-resin`, `rgba(255, 255, 255, 0.2)` light and
 * `rgba(29, 23, 48, 0.2)` dark, the rim at 0.85 and 0.17, the float shadow,
 * `blur(20px) saturate(1.65)`, with the picked colour as a disc inside it and
 * a dark hairline outside it so the thumb keeps an edge on any colour.
 *
 * Old values are quoted below. Idempotent; refuses to write on an unknown id,
 * an unknown surface or recipe, or a value that is neither the old one nor the
 * new one.
 *
 *   node tools/extend-catalogue-14.cjs --write
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
  ['color-area', 'surface', ['none'], ['resin']],
  ['color-slider', 'surface', ['none'], ['resin']],
  ['color-wheel', 'surface', ['none'], ['resin']],
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
