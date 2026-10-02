#!/usr/bin/env node
/* Fifth catalogue extension: three rulings Meridian made on 28 September 2026.
 *
 *   D-19: continuous activity indicators. The catalogue asked `loader`,
 *         `skeleton` and `progress` to spin, sweep and travel, and the motion
 *         chapter published no recipe that loops. Meridian adopted three
 *         continuous recipes, `activity-turn`, `activity-travel` and
 *         `skeleton-sweep`, which report work that is genuinely pending and
 *         stop when it resolves. The three entries now claim them.
 *   R-21: a data mark arriving. `bar-chart`, `line-chart` and `pie-chart`
 *         asked for an enter or draw-on motion and no recipe existed. Meridian
 *         adopted `mark-in`: critically damped, because a mark that overshoots
 *         its value has shown a number that is not true, and staggered by
 *         index up to a ceiling. All three charts claim it, and `line-chart`'s
 *         "draw-on" becomes the enter motion. A stroke drawn along its length
 *         is a different recipe that nobody has asked for.
 *   R-22: the quantity stepper is not a spin button. The entry asked for the
 *         role. React Aria removes it, because a spinbutton cannot be focused
 *         with VoiceOver, and trading reachability for a role name is a
 *         regression of the accessible surface. Meridian ruled for the
 *         reachable control. `number-input` said the same thing about the same
 *         primitive and changes with it.
 *
 * The old sentences are quoted below, so the record says what each one was.
 * Idempotent, and refuses to write if an id or a recipe does not exist.
 *
 *   node tools/extend-catalogue-5.cjs --write
 */
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.resolve(__dirname, '../core/tokens/catalogue');
const RECIPES = new Set(require('../core/tokens/motion-recipes.json').recipes.map((r) => r.id));
const WRITE = process.argv.includes('--write');

/* Recipes each entry gains, merged into what it already claims. */
const MOTION = {
  loader: ['activity-turn'],
  /* A determinate bar plays progress-change; an indeterminate one travels, and an
     indeterminate ring turns. The entry covers both shapes. */
  progress: ['activity-travel', 'activity-turn'],
  skeleton: ['skeleton-sweep'],
  'bar-chart': ['mark-in'],
  'line-chart': ['mark-in'],
  'pie-chart': ['mark-in'],
};

/* [entry, field, the sentence it had, the sentence it has now] */
const PROSE = [
  ['line-chart', 'crystal',
    'Stroke scale, point geometry, draw-on motion',
    'Stroke scale, point geometry, enter motion (mark-in)'],
  ['quantity-stepper', 'semantics',
    'A spin button: the value is typable, and the bounds are announced when reached.',
    'A typable numeric field: the value is read as its text, and the bounds are announced when reached. '
      + 'Not role=spinbutton — a spin button cannot be focused with VoiceOver, so the role would put the control out of some readers\' reach.'],
  ['number-input', 'semantics',
    'Native number input or a text input with inputmode and role=spinbutton; arrow keys must step',
    'A text input with inputmode=numeric whose bounds are announced when reached; arrow keys must step. '
      + 'Not role=spinbutton, which VoiceOver cannot focus.'],
];

const problems = [];
for (const [id, recipes] of Object.entries(MOTION)) {
  for (const r of recipes) if (!RECIPES.has(r)) problems.push(`${id}: recipe "${r}" does not exist`);
}

const seen = new Set();
const report = { motionAdded: 0, proseCorrected: 0, alreadyApplied: 0 };
const writes = [];

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()) {
  const full = path.join(DIR, file);
  const category = JSON.parse(fs.readFileSync(full, 'utf8'));
  let changed = false;
  for (const c of category.components) {
    seen.add(c.id);
    if (MOTION[c.id]) {
      const merged = [...new Set([...(c.motion || []), ...MOTION[c.id]])];
      if (JSON.stringify(merged) !== JSON.stringify(c.motion || [])) {
        console.log(`  ${c.id}: motion ${JSON.stringify(c.motion || [])} → ${JSON.stringify(merged)}`);
        c.motion = merged; changed = true; report.motionAdded += 1;
      }
    }
    for (const [id, field, was, now] of PROSE) {
      if (id !== c.id) continue;
      if (c[field] === now) { report.alreadyApplied += 1; continue; }
      if (c[field] !== was) { problems.push(`${id}.${field} is neither the sentence this corrects nor its correction: ${JSON.stringify(c[field])}`); continue; }
      console.log(`  ${id}.${field}: corrected`);
      c[field] = now; changed = true; report.proseCorrected += 1;
    }
  }
  /* The field order extend-catalogue-4 established: motion sits before parity.
     An entry that had no motion would otherwise gain it at the end. */
  category.components = category.components.map((c) => {
    const { id, name, anatomy, states, material, surface, geometry, semantics, crystal, product, motion, parity, ...rest } = c;
    return Object.fromEntries(Object.entries({ id, name, anatomy, states, material, surface, geometry, semantics, crystal, product, motion, parity, ...rest })
      .filter(([, v]) => v !== undefined));
  });
  if (changed) writes.push([full, category]);
}

for (const id of Object.keys(MOTION)) if (!seen.has(id)) problems.push(`motion map names "${id}", which is not in the catalogue`);
for (const [id] of PROSE) if (!seen.has(id)) problems.push(`prose map names "${id}", which is not in the catalogue`);

if (problems.length) {
  console.error('Refusing to write:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
if (WRITE) for (const [full, category] of writes) fs.writeFileSync(full, JSON.stringify(category, null, 2) + '\n');
console.log(JSON.stringify({ ...report, entries: seen.size, wrote: WRITE }, null, 2));
if (!WRITE) console.log('Dry run. Pass --write to apply.');
