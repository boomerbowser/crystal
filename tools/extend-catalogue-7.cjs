#!/usr/bin/env node
/* Seventh catalogue extension: the rulings of 29 September 2026.
 *
 * proposals/2026-09-29-rulings.md holds each question, its options and
 * Meridian's answer. Three of them change the catalogue:
 *
 *   - D-26 (b): a button group and a split button are not docks. Their segments
 *     touch — square inside, pill outside, a hairline between — which `.cr-dock`
 *     (4px gaps inside 9px of padding, a pill per control) does not draw. They
 *     are the new `group` surface, `.cr-group`.
 *   - D-28: five motion assignments no component can play as written come off.
 *     `page-in`/`page-out` mark a new view after routing, which the navigation
 *     does not render — it keeps `selection`, the motion it plays. `busy` is a
 *     one-shot cycle beside D-19's continuous indicators, two answers to one
 *     question; linear progress plays `activity-travel`, not the ring's
 *     `activity-turn`. `resin-confluence` describes itself as "a visual study,
 *     not an application action". The authored bubble has no reactions to
 *     toggle. The colour controls have no readout for `slider-step` to move.
 *   - D-29 (a): the virtualizer was listed twice. `virtual-scroller` goes;
 *     `virtualizer` stays, because its semantics are the complete ones — set
 *     counts across recycling *and* a focused row never dropped — and its
 *     parity already names both references. The catalogue is 284 components.
 *
 * Old values are quoted below. Idempotent; refuses to write on an unknown id,
 * an unknown surface or recipe, or a value that is neither the old one nor the
 * new one.
 *
 *   node tools/extend-catalogue-7.cjs --write
 */
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.resolve(__dirname, '../core/tokens/catalogue');
const SURFACES = new Set(require('../core/tokens/surfaces.json').surfaces.map((s) => s.id));
const RECIPES = new Set(require('../core/tokens/motion-recipes.json').recipes.map((r) => r.id));
const WRITE = process.argv.includes('--write');

/* [entry, the surface it had, the surface it has now] */
const SURFACE = [
  ['button-group', ['dock'], ['group']],
  ['split-button', ['dock'], ['group']],
];

/* [entry, the motion it had, the motion it has now] */
const MOTION = [
  ['nav-link', ['page-in', 'page-out'], ['selection']],
  ['nav-rail', ['selection', 'page-in'], ['selection']],
  ['dock', ['selection', 'page-in'], ['selection']],
  ['stepper', ['selection', 'page-in'], ['selection']],
  ['bottom-navigation', ['selection', 'page-in'], ['selection']],
  ['checkout-steps', ['selection', 'page-in'], ['selection']],
  ['progress', ['progress-change', 'busy', 'activity-travel', 'activity-turn'], ['progress-change', 'activity-travel']],
  ['loader', ['busy', 'activity-turn'], ['activity-turn']],
  ['floating-action', ['press', 'resin-confluence'], ['press']],
  ['authored-bubble', ['message-in', 'reaction'], ['message-in']],
  ['color-area', ['slider-step'], []],
  ['color-slider', ['slider-step'], []],
  ['color-wheel', ['slider-step'], []],
];

/* [entry, and the entry that keeps its place] */
const REMOVE = [
  ['virtual-scroller', 'virtualizer'],
];

const problems = [];
for (const [id, , now] of SURFACE) for (const s of now) if (!SURFACES.has(s)) problems.push(`${id}: surface "${s}" is not in surfaces.json`);
for (const [id, , now] of MOTION) for (const r of now) if (!RECIPES.has(r)) problems.push(`${id}: motion "${r}" is not a recipe`);

const seen = new Set();
const report = { surfaceCorrected: 0, motionCorrected: 0, removed: 0, alreadyApplied: 0 };
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
    for (const [id, was, now] of MOTION) {
      if (id !== c.id) continue;
      const have = JSON.stringify(c.motion ?? []);
      if (have === JSON.stringify(now)) { report.alreadyApplied += 1; continue; }
      if (have !== JSON.stringify(was)) { problems.push(`${id}.motion is ${have}, neither ${JSON.stringify(was)} nor ${JSON.stringify(now)}`); continue; }
      console.log(`  ${id}: motion ${have} → ${JSON.stringify(now)}`);
      c.motion = now; changed = true; report.motionCorrected += 1;
    }
  }
  const before = category.components.length;
  category.components = category.components.filter((c) => !REMOVE.some(([id]) => id === c.id));
  if (category.components.length !== before) {
    for (const [id, keeps] of REMOVE) console.log(`  ${id}: removed; ${keeps} keeps its place`);
    report.removed += before - category.components.length;
    changed = true;
  }
  if (changed) writes.push([full, category]);
}
for (const [id] of SURFACE) if (!seen.has(id)) problems.push(`surface map names "${id}", which is not in the catalogue`);
for (const [id] of MOTION) if (!seen.has(id)) problems.push(`motion map names "${id}", which is not in the catalogue`);
for (const [id, keeps] of REMOVE) {
  if (!seen.has(keeps)) problems.push(`"${id}" would be removed in favour of "${keeps}", which is not in the catalogue`);
  if (!seen.has(id)) report.alreadyApplied += 1;
}

if (problems.length) {
  console.error('Refusing to write:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
if (WRITE) for (const [full, category] of writes) fs.writeFileSync(full, JSON.stringify(category, null, 2) + '\n');
console.log(JSON.stringify({ ...report, entries: seen.size - report.removed, wrote: WRITE }, null, 2));
if (!WRITE) console.log('Dry run. Pass --write to apply.');
