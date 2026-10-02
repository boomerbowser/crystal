#!/usr/bin/env node
/* Ninth catalogue extension: the rulings of 2 October 2026.
 *
 * proposals/2026-10-02-rulings.md holds each question, its options and
 * Meridian's answer. Two of them change the catalogue here:
 *
 *   - D-30 (a): a library may ship an optional binding of an editing engine
 *     from its own entry point, with the engine an optional peer, and the
 *     format vocabulary is the contract the binding implements. The rich text
 *     surface's note says so (task C-T2).
 *   - D-32 (a): as D-28 did, motion assignments the component cannot play as
 *     written come off (task C-M2). They are the nine the ruling names, each
 *     found played by nothing in the proposal's F-5 once composition was
 *     credited: list-out on the transfer list, the data table and the
 *     resizable table; accordion-out on the tree view, the navigation tree, the
 *     organisation chart and the spoiler; page-out on master-detail; and
 *     list-in on the combobox. The
 *     proposal and the ruling call these "eleven"; the list they name is nine
 *     assignments, and with the menus' four and Crystal React's seven gaps it
 *     accounts for all twenty. The menubar and the split button keep menu-in and
 *     menu-out, and their notes say the menus are the product's children.
 *     Crystal React's seven gaps (the cascader's field states, the product
 *     gallery's media-in, the view stack's view-push-out, the playlist block's
 *     list motion) stay assigned and are Crystal React tasks.
 *
 * Old values are quoted below. Idempotent; refuses to write on an unknown id,
 * an unknown surface or recipe, or a value that is neither the old one nor the
 * new one.
 *
 *   node tools/extend-catalogue-9.cjs --write
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
  /* ------------------------------------------------------------ D-30 (a) */
  ['rich-text-surface', 'note',
    'Crystal specifies the surface and the format vocabulary. Do not rebuild a rich-text engine to obtain this appearance; bind an existing one. Whether a library may ship an optional binding of its own is D-30.',
    'Crystal specifies the surface and the format vocabulary. Do not rebuild a rich-text engine to obtain this appearance; bind an existing one. A library may ship an optional binding of an engine from its own entry point, with the engine an optional peer dependency, so a product that never imports the binding never installs or bundles the engine. The format vocabulary is the contract a binding implements: every block type and mark it offers renders as the surface and prose render it (D-30).'],

  /* ------------------------------------------------------------ D-32 (a) */
  ['transfer', 'motion',
    ['list-in', 'list-out'],
    ['list-in']],
  ['data-table', 'motion',
    ['list-in', 'list-out', 'highlight'],
    ['list-in', 'highlight']],
  ['resizable-table', 'motion',
    ['list-in', 'list-out', 'highlight', 'resize-settle'],
    ['list-in', 'highlight', 'resize-settle']],
  ['tree-view', 'motion',
    ['accordion-in', 'accordion-out'],
    ['accordion-in']],
  ['navigation-tree', 'motion',
    ['accordion-in', 'accordion-out'],
    ['accordion-in']],
  ['organization-chart', 'motion',
    ['accordion-in', 'accordion-out'],
    ['accordion-in']],
  ['spoiler', 'motion',
    ['accordion-in', 'accordion-out'],
    ['accordion-in']],
  ['master-detail', 'motion',
    ['page-in', 'page-out'],
    ['page-in']],
  ['combobox', 'motion',
    ['popover-in', 'popover-out', 'list-in'],
    ['popover-in', 'popover-out']],
  ['menubar', 'note',
    undefined,
    'Each menu the bar opens is the product\'s child, a menu entry of its own. The bar owns the triggers and their roving focus; menu-in and menu-out are played by the menu the product renders, not by the bar.'],
  ['split-button', 'note',
    undefined,
    'The menu the disclosure opens is the product\'s child, a menu entry of its own. The split button owns the two segments and the disclosure; menu-in and menu-out are played by the menu the product renders, not by the button.'],
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
