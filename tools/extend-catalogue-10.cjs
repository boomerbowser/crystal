#!/usr/bin/env node
/* Tenth catalogue extension: prose that names a material its surfaces do not
 * have (task C-S4, the re-evaluation's recommendation 3).
 *
 * tools/build-catalogue.cjs now refuses an entry whose `material` or `anatomy`
 * names Plastic, Frost, Resin, Haze, Stone or Mirage when none of the entry's
 * surfaces is made of it. A token in a code span is a colour, not a material
 * claim, and is not read. Twenty-six entries failed. Twenty-two are corrected
 * here, 25 fields, against Crystal's own vocabulary and tokens, never against
 * what a library happens to draw, and a surface is assigned only where a
 * component wearing it was measured (C-S3). Six are listed in build-catalogue.cjs
 * as awaiting a measurement; the menu and the popover are in both sets, their
 * anatomy corrected here and their Haze awaiting:
 *
 *   - The four overlay anatomies, and the mentions list, still said Resin.
 *     Transient overlays are Frost (R15e), as their material fields already said.
 *   - A Frost overlay with a Haze reading fill is made of both surfaces, as the
 *     Frost surface's own description says ("reading content inside it sits on
 *     Haze"). The toast and the notification add `haze`, measured on a component
 *     that wears it. The pop-confirm, the menu and the popover say the same in
 *     their material, but no component has been measured wearing a Haze reading
 *     fill there (Crystal React's draws Haze only on the buttons' pads), so they
 *     keep `frost` until one has (C-S3); build-catalogue.cjs lists them.
 *   - The indicator has been Haze since 2.3.0 (D-27); its anatomy still said
 *     Resin, and its material said so in the negative.
 *   - The angle slider and the knob were `none` but draw a Resin dial, which is
 *     the Resin plane's "Resin handle over imagery or between regions", measured:
 *     they take `resin`. The knob's value arc is primary, as every other arc in
 *     the catalogue is. The three colour controls specify a Resin thumb that no
 *     component has been measured drawing (Crystal React's thumb is the picked
 *     colour), so they keep `none` until one has; build-catalogue.cjs lists them.
 *   - Charts named Haze for a colour. A series fill is the series colour at
 *     `--cr-chart-fill-opacity`, which core defines for it; a track, a band,
 *     a centre or a node fill is `--cr-haze-fill`, the Haze colour without the
 *     surface (an arc cannot be feathered), written as the token.
 *   - The rest named a material as context or as an option the vocabulary does
 *     not have: the app bar sits over the foundation; the timeline's markers are
 *     indicators; a drawer is Frost (the Frost surface lists drawers); the drag
 *     handle is the opaque surface with the float shadow while lifted.
 *
 * Old values are quoted below. Idempotent; refuses to write on an unknown id,
 * an unknown surface or recipe, or a value that is neither the old one nor the
 * new one.
 *
 *   node tools/extend-catalogue-10.cjs --write
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
  /* ------------------------------------------------- overlays are Frost (R15e) */
  ['toast', 'anatomy',
    'A transient floating Resin notification with a message and an optional single action.',
    'A transient floating Frost notification with a message and an optional single action.'],
  ['menu', 'anatomy',
    'A Resin popover of actions, with optional groups, separators and checkable items.',
    'A Frost popover of actions, with optional groups, separators and checkable items.'],
  ['popover', 'anatomy',
    'An anchored Resin surface holding arbitrary content, with optional arrow.',
    'An anchored Frost surface holding arbitrary content, with optional arrow.'],
  ['tooltip', 'anatomy',
    'Short supplemental text on a small Resin surface, anchored to its trigger.',
    'Short supplemental text on a small Frost surface, anchored to its trigger.'],
  ['mentions', 'material',
    'Resin popover with Haze rows over the field',
    'Frost popover with Haze rows over the field (R15e)'],

  /* ------------------------------------- a Frost overlay with a Haze reading fill
     Measured on 2 October 2026 in Crystal React's Storybook (dev server, so no
     minifier): Feedback/Toast and Feedback/Notification compute Frost's
     blur(40px) saturate(1.25) and paint a feathered 80% Haze layer on their
     own ::before. */
  ['toast', 'surface', ['frost'], ['frost', 'haze']],
  ['notification', 'surface', ['frost'], ['frost', 'haze']],

  /* ------------------------------------------------- the indicator is Haze (D-27) */
  ['indicator', 'anatomy',
    'A small circular Resin mark attached to a control, carrying state.',
    'A small circular Haze mark attached to a control, carrying state.'],
  ['indicator', 'material',
    'Haze: a 20px circle painting the Haze fill on an isolated layer with a 1px feather; no Resin, because it sits on surfaces that are often already translucent',
    'Haze: a 20px circle painting the Haze fill on an isolated layer with a 1px feather, and no coat of its own, because it sits on surfaces that are often already translucent'],

  /* --------------------------------------------- controls with a Resin handle
     Measured the same way: Inputs/Choice and range draws the angle slider's and
     the knob's dial at blur(20px) saturate(1.65) on the 20% Resin fill, the
     .cr-resin recipe. */
  ['angle-slider', 'surface', ['none'], ['resin']],
  ['knob', 'surface', ['none'], ['resin']],
  ['knob', 'material',
    'Resin body with a Haze value arc',
    'Resin body with a primary value arc'],
  ['color-swatch', 'material',
    'Haze chequerboard beneath a transparent colour',
    'A chequerboard beneath a transparent colour, so its alpha shows'],

  /* ---------------------------------------------------- charts name a colour */
  ['area-chart', 'material',
    'Haze fill beneath the line',
    'The series colour at `--cr-chart-fill-opacity` beneath the line'],
  ['radar-chart', 'material',
    'Haze fill inside each series polygon',
    'The series colour at `--cr-chart-fill-opacity` inside each series polygon'],
  ['donut-chart', 'material',
    'Haze centre fill',
    'A centre fill in `--cr-haze-fill`'],
  ['gauge', 'material',
    'Haze track with a primary arc',
    'A track in `--cr-haze-fill` with a primary arc'],
  ['semi-circle-progress', 'material',
    'Haze track with a primary arc',
    'A track in `--cr-haze-fill` with a primary arc'],
  ['meter-group', 'material',
    'Haze track with segment fills',
    'A track in `--cr-haze-fill` with segment fills'],
  ['bullet-chart', 'material',
    'Haze range bands',
    'Range bands in `--cr-haze-fill`'],
  ['network-graph', 'material',
    'Haze node fills',
    'Node fills in `--cr-haze-fill`'],

  /* ------------------------------------------------ context and stale options */
  ['app-bar', 'material',
    'Frost band over the Plastic foundation',
    'Frost band over the view\'s foundation'],
  ['timeline', 'material',
    'Resin markers on a Haze connector',
    'Indicator markers on a Haze connector'],
  ['drawer', 'material',
    'Mirage scrim, Frost or Resin panel by depth',
    'Mirage scrim and a Frost panel'],
  ['drag-handle', 'material',
    'Resin while lifted; Haze drop indicator',
    'No material of its own: the opaque surface with the float shadow while lifted, and a drop indicator in `--cr-haze-fill`'],
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
