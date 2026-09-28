/* Build the component catalogue chapter and the parity manifest from one source.
 *
 * The catalogue is authored as data so every contract has the same shape and
 * none can be half-written. These assertions run on every build:
 *
 *   1. Every motion recipe family maps to a catalogue component. Crystal shipped
 *      animations for eleven components that had no contract; that must not recur.
 *   2. Every motion id a component claims exists — as a recipe in
 *      `motion-recipes.json` or as a material preset in `core/assets/core/presets.js`.
 *      Until 28 September 2026 this ran one way only, and `dialog` and `scrim`
 *      named three ids that were in neither file for a release.
 *   3. Every component names its surface, from the closed vocabulary in
 *      `core/tokens/surfaces.json`, and every surface in that vocabulary has a
 *      recipe in `core/assets/crystal.css`. A component cannot be specified in a
 *      material Crystal has not published a recipe for.
 *   4. Every component states what Crystal supplies and what the product owns.
 *      A contract missing either is a placeholder, and placeholders are how a
 *      catalogue comes to claim more than it specifies.
 *
 * Status is merged, never generated. `libraries/status/<platform>.json` is the
 * record a platform library keeps of what it has implemented; this file reads
 * it and writes the merge into `parity.json`. It used to regenerate every
 * status as `not-started`, which is why the manifest the README called "the
 * single source of truth for what exists" said 283 of 285 components did not
 * exist while a library had shipped 265 of them.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'core/tokens/catalogue');
const CHAPTER = path.join(ROOT, 'core/docs/catalogue.md');
/* Inside the repository. This used to resolve to `../libraries/parity.json`
   relative to the repository — a path left from the monorepo layout — so every
   build wrote the manifest to a directory beside the checkout and the committed
   file was never regenerated. AGENTS.md: a generator here may not write
   anything outside this repository. */
const MANIFEST = path.join(ROOT, 'libraries/parity.json');
const STATUS_DIR = path.join(ROOT, 'libraries/status');
const STYLESHEET = path.join(ROOT, 'core/assets/crystal.css');

/* Libraries Crystal's parity is measured against. Named explicitly so the claim
   is checkable rather than asserted. */
const BENCHMARKS = ['mantine', 'mui', 'antd'];

/* Platforms Crystal intends to ship libraries for. */
const PLATFORMS = ['web', 'react-native', 'swiftui', 'compose'];
const STATUS_VALUES = ['not-started', 'in-progress', 'implemented', 'not-applicable'];

function load() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) throw new Error(`No catalogue files in ${DIR}`);
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
}

function loadSurfaces() {
  const { surfaces } = JSON.parse(fs.readFileSync(path.join(ROOT, 'core/tokens/surfaces.json'), 'utf8'));
  const css = fs.readFileSync(STYLESHEET, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const problems = [];
  for (const s of surfaces) {
    for (const selector of [s.class, ...(s.also || [])]) {
      if (!selector) continue;
      /* A class selector must appear in the stylesheet as a selector, not as a
         word in a comment (comments are stripped above). An element selector is
         checked as written. `.cr-resin.panel` checks both tokens. */
      const tokens = selector.startsWith('.') ? selector.split('.').filter(Boolean).map((t) => '.' + t) : [selector];
      for (const token of tokens) {
        if (!css.includes(token)) problems.push(`surface "${s.id}" names ${selector}, and ${token} has no rule in crystal.css`);
      }
    }
  }
  return { surfaces, byId: new Map(surfaces.map((s) => [s.id, s])), problems };
}

function loadPresets() {
  /* The material presets live in the headless core, not in the recipe file:
     they are computed from tokens at play time. They are still motion a
     component may claim, so a claim is valid if the preset module exports it. */
  const presets = require(path.join(ROOT, 'core/assets/core/presets.js'));
  return new Set(presets.PRESETS);
}

function loadStatus(known) {
  const merged = {};
  const problems = [];
  if (!fs.existsSync(STATUS_DIR)) return { merged, problems };
  for (const file of fs.readdirSync(STATUS_DIR).filter((f) => f.endsWith('.json')).sort()) {
    const record = JSON.parse(fs.readFileSync(path.join(STATUS_DIR, file), 'utf8'));
    const platform = record.platform;
    if (!PLATFORMS.includes(platform)) { problems.push(`${file}: platform "${platform}" is not one of ${PLATFORMS.join(', ')}`); continue; }
    for (const [id, status] of Object.entries(record.components || {})) {
      if (!known.has(id)) problems.push(`${file}: "${id}" is not a catalogue component`);
      if (!STATUS_VALUES.includes(status)) problems.push(`${file}: "${id}" has status "${status}", not one of ${STATUS_VALUES.join(', ')}`);
      (merged[platform] ||= {})[id] = status;
    }
  }
  return { merged, problems };
}

function validate(categories, surfaces, presets) {
  const problems = [...surfaces.problems];
  const seen = new Set();
  const recipes = JSON.parse(fs.readFileSync(path.join(ROOT, 'core/tokens/motion-recipes.json'), 'utf8')).recipes;
  const recipeIds = new Set(recipes.map((r) => r.id));

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
      if (!Array.isArray(c.surface) || !c.surface.length) problems.push(`${where}: no surface — every component names what it is made of`);
      for (const s of c.surface || []) {
        if (!surfaces.byId.has(s)) problems.push(`${where}: surface "${s}" is not in surfaces.json`);
      }
      for (const id of c.motion || []) {
        if (!recipeIds.has(id) && !presets.has(id)) problems.push(`${where}: motion "${id}" is neither a recipe nor a material preset`);
      }
    }
  }

  /* Every motion recipe family must belong to a documented component. Material
     choreography animates a material, not a component; those recipes are
     specified in the materials chapter and are exempt by category. (An
     `Ambient` exemption used to sit beside this one. R22 withdrew the category
     and the exemption stayed, which would have let a recipe in a category that
     no longer exists pass unclaimed. It is gone.) */
  const MATERIAL_CATEGORIES = new Set(['Material compositions']);
  const claimed = new Set();
  for (const category of categories) {
    for (const c of category.components) for (const id of c.motion || []) claimed.add(id);
  }
  const orphans = recipes
    .filter((r) => !MATERIAL_CATEGORIES.has(r.category))
    .map((r) => r.id)
    .filter((id, i, all) => all.indexOf(id) === i && !claimed.has(id));

  return { problems, orphans, count: seen.size, ids: seen, recipeIds };
}

const esc = (text) => String(text)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Mirrors the slug the Markdown toc extension derives from heading text. */
const slug = (text) => text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

function coverage(categories, surfaces) {
  const perSurface = new Map(surfaces.surfaces.map((s) => [s.id, 0]));
  const perCategory = [];
  for (const category of categories) {
    let motion = 0;
    for (const c of category.components) {
      if (c.motion?.length) motion += 1;
      for (const s of c.surface) perSurface.set(s, perSurface.get(s) + 1);
    }
    perCategory.push({ name: category.name, total: category.components.length, motion });
  }
  return { perSurface, perCategory };
}

function chapter(categories, stats, surfaces) {
  const total = stats.count;
  const cov = coverage(categories, surfaces);
  const lines = [];
  lines.push('# Component catalogue');
  lines.push('');
  lines.push(`Crystal specifies **${total} components** across ${categories.length} categories. Parity is measured against the most fully-featured libraries in use — Mantine, Ant Design and MUI — rather than a shorter list Crystal finds convenient.`);
  lines.push('');
  lines.push('Crystal specifies appearance: anatomy, states, material, geometry and the semantics a correct implementation must expose. It does not ship focus management, menu keyboard behaviour, date arithmetic or a rich-text engine. Products bring their own accessible primitives and dress them in Crystal. Every entry states this split explicitly, so what the system owes you and what you owe the system are never in doubt.');
  lines.push('');
  lines.push('This chapter is generated from `core/tokens/catalogue/`. The same source generates the parity manifest in `libraries/parity.json`, so a component cannot appear in one and not the other.');
  lines.push('');
  lines.push('## Coverage');
  lines.push('');
  lines.push('| Category | Components | With motion |');
  lines.push('| --- | --- | --- |');
  for (const { name, total: n, motion } of cov.perCategory) {
    lines.push(`| [${name}](#${slug(name)}) | ${n} | ${motion} |`);
  }
  lines.push(`| **Total** | **${total}** | **${cov.perCategory.reduce((a, c) => a + c.motion, 0)}** |`);
  lines.push('');
  lines.push('## Surfaces');
  lines.push('');
  lines.push('Every component is made of one or more of these, named in its **Surface** row, outer to inner. The vocabulary is `core/tokens/surfaces.json`; each surface is implemented by the `crystal.css` recipe shown, and the build refuses a component naming a surface that has no recipe. A library implements the surface once and every component made of it inherits the implementation — which is what keeps two hundred components from becoming two hundred recipes.');
  lines.push('');
  lines.push('| Surface | Materials | Recipe | Components | Use |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const s of surfaces.surfaces) {
    const recipe = s.class ? `<code>${esc(s.class)}</code>` : '—';
    lines.push(`| <a id="surface-${s.id}"></a>**${esc(s.name)}** \`${s.id}\` | ${s.materials.length ? s.materials.join(' + ') : '—'} | ${recipe} | ${cov.perSurface.get(s.id)} | ${esc(s.use)} |`);
  }
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
      const surface = c.surface.map((id) => {
        const s = surfaces.byId.get(id);
        return `<a href="#surface-${id}">${esc(s.name)}</a>`;
      }).join(' → ');
      const rows = [
        ['States', esc(c.states.join(', '))],
        ['Material', esc(c.material)],
        ['Surface', surface],
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

function manifest(categories, stats, status) {
  return {
    $description:
      'Per-platform implementation status for every component Crystal specifies. Generated from ' +
      'core/tokens/catalogue/ with status merged from libraries/status/<platform>.json. A component present ' +
      'in one library is expected in the others, with the same states, semantics, surfaces and token bindings.',
    generated: 'tools/build-catalogue.cjs',
    benchmarks: BENCHMARKS,
    platforms: PLATFORMS,
    totals: { components: stats.count, categories: categories.length },
    statusValues: STATUS_VALUES,
    components: categories.flatMap((category) =>
      category.components.map((c) => ({
        id: c.id,
        name: c.name,
        category: category.id,
        surface: c.surface,
        ...(c.motion?.length ? { motion: c.motion } : {}),
        /* A component the catalogue has refused carries that refusal through to
           the manifest on every platform. Otherwise the platform's own record
           decides, and a platform with no record is honestly not-started. */
        status: Object.fromEntries(PLATFORMS.map((p) => [p,
          c.status === 'not-applicable' ? 'not-applicable' : (status[p]?.[c.id] || 'not-started')])),
        ...(c.why ? { why: c.why } : {}),
      }))),
  };
}

const categories = load();
const surfaces = loadSurfaces();
const presets = loadPresets();
const stats = validate(categories, surfaces, presets);
const status = loadStatus(stats.ids);

const problems = [...stats.problems, ...status.problems];
if (problems.length) {
  console.error('Catalogue is incomplete:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
if (stats.orphans.length) {
  console.error(`Motion recipes with no component contract (${stats.orphans.length}):`);
  console.error('  ' + stats.orphans.join(', '));
  console.error('Every animation must belong to a documented component.');
  process.exit(1);
}

fs.writeFileSync(CHAPTER, chapter(categories, stats, surfaces));
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest(categories, stats, status.merged), null, 2) + '\n');
/* The full specification in one file. parity.json carries per-platform status;
   this carries what each component actually IS — anatomy, states, material,
   surface, geometry, semantics, the Crystal/product split and the parity claim.
   A library needs the second to build a component and to document it, and
   reading fourteen files across a package boundary is not something a consumer
   should have to do. */
fs.writeFileSync(
  path.join(ROOT, 'core/tokens/catalogue.json'),
  JSON.stringify({
    $description: 'Crystal component catalogue, combined. Generated from core/tokens/catalogue/.',
    generated: new Date().toISOString().slice(0, 10),
    surfaces: surfaces.surfaces,
    categories: categories.map((category) => ({
      id: category.id, name: category.name, description: category.description,
      components: category.components,
    })),
  }, null, 2) + '\n',
);

const cov = coverage(categories, surfaces);
console.log(JSON.stringify({
  components: stats.count,
  categories: categories.length,
  withMotion: cov.perCategory.reduce((a, c) => a + c.motion, 0),
  surfaces: surfaces.surfaces.length,
  orphanedMotionRecipes: stats.orphans.length,
  statusRecords: Object.fromEntries(Object.entries(status.merged).map(([p, m]) => [p, Object.keys(m).length])),
  benchmarks: BENCHMARKS,
}, null, 2));
