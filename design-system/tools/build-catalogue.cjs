/* Build the component catalogue chapter and the parity manifest from one source.
 *
 * The catalogue is authored as data so every contract has the same shape and
 * none can be half-written. Two assertions run on every build:
 *
 *   1. Every motion recipe family maps to a catalogue component. Crystal shipped
 *      animations for eleven components that had no contract; that must not recur.
 *   2. Every component states what Crystal supplies and what the product owns.
 *      A contract missing either is a placeholder, and placeholders are how a
 *      catalogue comes to claim more than it specifies.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..');
const DIR = path.join(ROOT, 'tokens/catalogue');
const CHAPTER = path.join(ROOT, 'docs/catalogue.md');
const MANIFEST = path.join(REPO, 'libraries/parity.json');

/* Libraries Crystal's parity is measured against. Named explicitly so the claim
   is checkable rather than asserted. */
const BENCHMARKS = ['mantine', 'mui', 'antd'];

/* Platforms Crystal intends to ship libraries for. Status starts at not-started
   for every one: an honest empty state, not a stub. */
const PLATFORMS = ['web', 'react-native', 'swiftui', 'compose'];

function load() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) throw new Error(`No catalogue files in ${DIR}`);
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
}

function validate(categories) {
  const problems = [];
  const seen = new Set();

  for (const category of categories) {
    for (const c of category.components) {
      const where = `${category.id}/${c.id}`;
      if (seen.has(c.id)) problems.push(`duplicate component id: ${c.id}`);
      seen.add(c.id);
      for (const field of ['name', 'anatomy', 'material', 'geometry', 'semantics', 'crystal', 'product']) {
        if (!c[field] || !String(c[field]).trim()) problems.push(`${where}: missing ${field}`);
      }
      if (!Array.isArray(c.states) || !c.states.length) problems.push(`${where}: no states listed`);
      if (!Array.isArray(c.parity) || !c.parity.length) problems.push(`${where}: no parity reference`);
    }
  }

  /* Every motion recipe family must belong to a documented component. */
  const recipes = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens/motion-recipes.json'), 'utf8')).recipes;
  const claimed = new Set();
  for (const category of categories) {
    for (const c of category.components) for (const id of c.motion || []) claimed.add(id);
  }
  /* Material choreography animates a material, not a component. Those recipes are
     specified in the materials chapter and are exempt by category rather than by
     inventing a component to absorb them. Ambient motion is exempt for the same
     reason and no other: it is what a Resin rim or a Haze fill does at rest, so it
     belongs to the material and any component made of that material inherits it. */
  const MATERIAL_CATEGORIES = new Set(['Material compositions', 'Ambient']);
  const orphans = recipes
    .filter((r) => !MATERIAL_CATEGORIES.has(r.category))
    .map((r) => r.id)
    .filter((id, i, all) => all.indexOf(id) === i && !claimed.has(id));

  return { problems, orphans, count: seen.size };
}

const esc = (text) => String(text)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Mirrors the slug the Markdown toc extension derives from heading text. */
const slug = (text) => text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

function chapter(categories, stats) {
  const total = stats.count;
  const lines = [];
  lines.push('# Component catalogue');
  lines.push('');
  lines.push(`Crystal specifies **${total} components** across ${categories.length} categories. Parity is measured against the most fully-featured libraries in use — Mantine, Ant Design and MUI — rather than a shorter list Crystal finds convenient.`);
  lines.push('');
  lines.push('Crystal specifies appearance: anatomy, states, material, geometry and the semantics a correct implementation must expose. It does not ship focus management, menu keyboard behaviour, date arithmetic or a rich-text engine. Products bring their own accessible primitives and dress them in Crystal. Every entry states this split explicitly, so what the system owes you and what you owe the system are never in doubt.');
  lines.push('');
  lines.push('This chapter is generated from `tokens/catalogue/`. The same source generates the parity manifest in `libraries/parity.json`, so a component cannot appear in one and not the other.');
  lines.push('');
  lines.push('## Coverage');
  lines.push('');
  lines.push('| Category | Components |');
  lines.push('| --- | --- |');
  for (const category of categories) {
    lines.push(`| [${category.name}](#${slug(category.name)}) | ${category.components.length} |`);
  }
  lines.push(`| **Total** | **${total}** |`);
  lines.push('');

  for (const category of categories) {
    lines.push(`## ${category.name}`);
    lines.push('');
    lines.push(category.description);
    lines.push('');
    for (const c of category.components) {
      lines.push(`### ${c.name}`);
      lines.push('');
      lines.push(c.anatomy);
      lines.push('');
      /* A two-column property table has nothing to put in a header, so it is
         emitted headerless as raw HTML rather than carrying an empty band. */
      const rows = [
        ['States', esc(c.states.join(', '))],
        ['Material', esc(c.material)],
        ['Geometry', esc(c.geometry)],
        ['Semantics', esc(c.semantics)],
        ['Crystal supplies', esc(c.crystal)],
        ['Product owns', esc(c.product)],
      ];
      if (c.motion?.length) rows.push(['Motion', c.motion.map((m) => `<code>${esc(m)}</code>`).join(', ')]);
      rows.push(['Parity', esc(c.parity.join(' · '))]);
      lines.push('<div class="cr-table-scroll"><table class="cr-table cr-table-properties"><tbody>');
      for (const [label, value] of rows) {
        lines.push(`<tr><th scope="row">${label}</th><td>${value}</td></tr>`);
      }
      lines.push('</tbody></table></div>');
      lines.push('');
      if (c.note) {
        lines.push(`> ${c.note}`);
        lines.push('');
      }
    }
  }
  return lines.join('\n') + '\n';
}

function manifest(categories, stats) {
  return {
    $description:
      'Per-platform implementation status for every component Crystal specifies. Generated from ' +
      'design-system/tokens/catalogue/. A component present in one library is expected in the others, ' +
      'with the same states, semantics and token bindings.',
    generated: 'design-system/tools/build-catalogue.cjs',
    benchmarks: BENCHMARKS,
    platforms: PLATFORMS,
    totals: { components: stats.count, categories: categories.length },
    statusValues: ['not-started', 'in-progress', 'implemented', 'not-applicable'],
    components: categories.flatMap((category) =>
      category.components.map((c) => ({
        id: c.id,
        name: c.name,
        category: category.id,
        /* A component the catalogue has refused carries that refusal through to
           the manifest. Regenerating it as not-started would quietly turn a
           decision back into a to-do, and the reason would be the first thing
           lost. */
        status: Object.fromEntries(PLATFORMS.map((p) => [p, c.status === 'not-applicable' ? 'not-applicable' : 'not-started'])),
        ...(c.why ? { why: c.why } : {}),
      }))),
  };
}

const categories = load();
const stats = validate(categories);

if (stats.problems.length) {
  console.error('Catalogue is incomplete:');
  for (const p of stats.problems) console.error('  ' + p);
  process.exit(1);
}
if (stats.orphans.length) {
  console.error(`Motion recipes with no component contract (${stats.orphans.length}):`);
  console.error('  ' + stats.orphans.join(', '));
  console.error('Every animation must belong to a documented component.');
  process.exit(1);
}

fs.writeFileSync(CHAPTER, chapter(categories, stats));
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest(categories, stats), null, 2) + '\n');

console.log(JSON.stringify({
  components: stats.count,
  categories: categories.length,
  orphanedMotionRecipes: stats.orphans.length,
  benchmarks: BENCHMARKS,
}, null, 2));
