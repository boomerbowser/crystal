/* Generate the parts of the documentation that are derivable from the sources.
 *
 * A token table transcribed by hand goes stale within a release. Everything
 * here is written from `tokens/`, `core/assets/shaders/` and the motion
 * recipes, so the documentation cannot disagree with what ships.
 *
 * Whole-file outputs are written directly. Sections inside a hand-written page
 * are delimited by <!-- generated:NAME --> ... <!-- /generated:NAME --> markers
 * so prose and generated tables can share one source file.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const spring = require(path.join(ROOT, 'core/assets/core/spring.js'));

const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const esc = s => String(s).replace(/\|/g, '\\|');

/* ---------- tokens ---------- */

function leaves(node, trail, out) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    const next = [...trail, key];
    if (value && value.$value !== undefined) out.push({ name: next.join('.'), token: value });
    else if (value && typeof value === 'object') leaves(value, next, out);
  }
}

function formatValue(v) {
  if (typeof v === 'object' && v !== null) return '`' + JSON.stringify(v) + '`';
  return '`' + v + '`';
}

const TIERS = {
  primitive: ['Primitive', 'Raw values. A component never references a primitive directly: a primitive is what a semantic token points at, so the meaning can be re-pointed without editing every use site.'],
  semantic: ['Semantic', 'What a value means: the surface a card sits on, the duration a control settles over. Components consume this tier and nothing below it.'],
  component: ['Component', 'Values that belong to one component family and would be wrong to reuse elsewhere. This tier exists so a component can be specific without inventing a private constant.'],
};

function tokensPage() {
  const tokens = read('core/tokens/crystal.tokens.json');
  const deprecated = tokens.$deprecated || {};
  const lines = [
    '# Tokens',
    '',
    'Every value Crystal ships, generated from `core/tokens/crystal.tokens.json`, the W3C',
    'Design Tokens (DTCG) source of truth. This page is written by',
    '`tools/build-reference.cjs`, and the next build overwrites any edit made here by hand.',
    'Edit the token file and run `npm run build`.',
    '',
    '## How the three tiers work',
    '',
    'Crystal resolves a value through three tiers, and the direction is one way only:',
    'a component reads a semantic token, a semantic token reads a primitive, and nothing',
    'reads upward. A palette swap is therefore a change to one tier, with no search',
    'across the codebase.',
    '',
    '```',
    'component.action.radius  →  semantic.shape.pill  →  primitive.distance.full',
    '```',
    '',
    '**A component that reads a primitive directly is a bug.** It works, and it opts that',
    'component out of every theme, mode and palette change made at the semantic tier.',
    '`tools/validate-tokens.cjs` checks the direction of every reference.',
    '',
  ];
  const all = [];
  leaves(tokens, [], all);
  for (const [tier, [label, blurb]] of Object.entries(TIERS)) {
    const rows = all.filter(t => t.name.startsWith(tier + '.'));
    if (!rows.length) continue;
    lines.push(`## ${label} tokens`, '', blurb, '', `${rows.length} tokens.`, '');
    // Group by the segment below the tier, so the tables stay readable.
    const groups = new Map();
    for (const row of rows) {
      const group = row.name.split('.')[1];
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(row);
    }
    for (const [group, items] of groups) {
      lines.push(`### ${label} · ${group}`, '',
        '| Token | Type | Value | Meaning |', '| --- | --- | --- | --- |');
      for (const { name, token } of items) {
        const note = deprecated[name] ? ` **Deprecated**: ${deprecated[name]}` : '';
        lines.push(`| \`${name}\` | ${token.$type || 'None'} | ${formatValue(token.$value)} | ${esc(token.$description || 'None')}${note} |`);
      }
      lines.push('');
    }
  }
  const dep = Object.entries(deprecated);
  if (dep.length) {
    lines.push('## Deprecations', '',
      'A deprecated token still resolves. Its name is kept, and listed here, only so',
      'adopters can migrate before it is removed.',
      '', '| Token | Replacement or reason |', '| --- | --- |');
    for (const [name, why] of dep) lines.push(`| \`${name}\` | ${esc(why)} |`);
    lines.push('');
  }
  return lines.join('\n');
}

/* ---------- motion recipes ---------- */

function recipeSection() {
  const motion = read('core/tokens/motion-recipes.json');
  const lines = [
    `All ${motion.recipes.length} recipes in ${new Set(motion.recipes.map(r => r.category)).size} categories, generated from \`core/tokens/motion-recipes.json\`. Damping ratio and`,
    'overshoot are derived from each recipe\'s spring by `core/assets/core/spring.js`, so a',
    'retuned spring cannot leave a stale number in this table.',
    '',
    'A damping ratio below 1 overshoots and settles back; exactly 1 is the fastest approach',
    'with no overshoot; above 1 crawls in without ever passing the target. Which one is',
    'correct is a material question; see the signature policy below.',
    '',
  ];
  const categories = [...new Set(motion.recipes.map(r => r.category))];
  for (const category of categories) {
    const rows = motion.recipes.filter(r => r.category === category);
    lines.push(`#### ${category}`, '',
      '| Recipe | Duration | Signature | Material | Damping ζ | Overshoot | Use | Reduced motion |',
      '| --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const r of rows) {
      /* A continuous recipe has no spring, because it has no rest position to
         settle to. Asking spring.js for its damping ratio would return the
         defaults' ratio and print physics the recipe does not have. */
      let zetaCell, over;
      if (!r.spring) {
        zetaCell = 'linear loop';
        over = 'None';
      } else {
        const peak = spring.peakOvershoot(r.spring);
        zetaCell = spring.dampingRatio(r.spring).toFixed(3);
        over = peak > 0.001 ? `${(peak * 100).toFixed(1)}%` : 'none';
      }
      const stagger = r.stagger ? ` Staggered ${r.stagger.step}ms per mark, up to ${r.stagger.maxMarks}.` : '';
      lines.push(`| \`${r.id}\`: ${esc(r.label)} | ${r.duration}ms | ${r.signature || 'None'} | ${r.material || 'None'} | ${zetaCell} | ${over} | ${esc((r.use || 'None') + stagger)} | ${esc(r.reduced || 'None')} |`);
    }
    lines.push('');
  }
  lines.push('**Spring policy.** ' + motion.springPolicy, '');
  lines.push('**Continuous policy.** ' + motion.continuousPolicy, '');
  lines.push('**Stagger policy.** ' + motion.staggerPolicy, '');
  lines.push('**Travel policy.** ' + motion.travelPolicy, '');
  lines.push('**Incompressibility.** ' + motion.incompressibility, '');
  return lines.join('\n');
}

/* ---------- shader contract ---------- */

function shaderSection() {
  const m = read('core/assets/shaders/manifest.json');
  const lines = [
    `Generated from \`core/assets/shaders/manifest.json\` (version ${m.version}).`,
    '',
    '**The contract is the uniform set, not the GLSL.** A platform that honours these',
    'uniforms has implemented Crystal\'s shader layer correctly, whether it does so in',
    'GLSL, Metal or AGSL. The `.frag` files in this repository are one implementation.',
    '',
    '### Uniforms', '',
    '| Uniform | Type | Meaning |', '| --- | --- | --- |',
  ];
  for (const [name, u] of Object.entries(m.uniforms)) {
    lines.push(`| \`${name}\` | ${u.type || 'None'} | ${esc(u.description || u.meaning || 'None')} |`);
  }
  lines.push('', '### Shaders', '');
  for (const s of m.shaders) {
    lines.push(`#### \`${s.id}\``, '',
      `- **Material**: ${s.material}`,
      `- **Signatures**: ${(s.signatures || []).join(', ') || 'None'}`,
      `- **Blend mode**: \`${s.blend}\``,
      `- **Degrades to**: ${s.degradesTo || 'the CSS approximation'}`,
      '', esc(s.claim || ''), '');
  }
  if (m.compositing) {
    lines.push('### Compositing', '');
    for (const [k, v] of Object.entries(m.compositing)) {
      lines.push(`**${k}**: ${typeof v === 'string' ? v : JSON.stringify(v)}`, '');
    }
  }
  if (m.opticalModel) {
    lines.push('### The optical model', '');
    for (const [k, v] of Object.entries(m.opticalModel)) {
      lines.push(`**${k}**: ${typeof v === 'string' ? v : JSON.stringify(v)}`, '');
    }
  }
  if (m.platformMapping) {
    lines.push('### Platform mapping', '', '| Platform | Shading language |', '| --- | --- |');
    for (const [k, v] of Object.entries(m.platformMapping)) lines.push(`| ${k} | ${esc(v)} |`);
    lines.push('');
  }
  return lines.join('\n');
}


/* ---------- the component recipe catalog ---------- */

function componentRecipeTable() {
  const motion = read('core/tokens/motion-recipes.json');
  const lines = ['| ID | Material / behavior | Engine | Base duration | Intended use |',
                 '|---|---|---|---|---|'];
  for (const r of motion.recipes) {
    const length = r.loop ? `${r.duration}ms per cycle, while pending` : `${r.duration}ms`;
    lines.push(`| \`${r.id}\` | ${r.material} / ${r.signature} | ${r.engine} | ${length} | ${esc(r.use || 'None')} |`);
  }
  return lines.join('\n');
}


/* ---------- values that live in the token file ---------- */

/* These tables are written from the numbers in `core/tokens/crystal.json`
   rather than transcribed, because a transcribed material recipe disagrees with
   the build sooner or later, and the material specification may never drift. */

function defaultsTable() {
  const tokens = read('core/tokens/crystal.tokens.json');
  const ranges = tokens.semantic.range;
  const label = {
    atmosphere: 'Color atmosphere', translucency: 'Frost base tint', elevation: 'Elevation',
    radius: 'Corner radius', motionSpeed: 'Motion speed',
  };
  const unit = { radius: 'px', motionSpeed: '\u00d7' };
  const lines = ['| Setting | Recommended default | Valid range |', '|---|---|---|'];
  for (const [key, token] of Object.entries(ranges)) {
    if (key.startsWith('$')) continue;
    const range = /range ([\d.]+)-([\d.]+)/.exec(token.$description || '');
    const u = unit[key] ?? '%';
    lines.push(`| ${label[key] || key} | ${token.$value}${u} | ${range ? `${range[1]}${u} to ${range[2]}${u}` : 'None'} |`);
  }
  const d = tokens.semantic.default;
  for (const [key, token] of Object.entries(d)) {
    if (key.startsWith('$')) continue;
    const words = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    lines.push(`| ${words[0].toUpperCase() + words.slice(1)} | \`${token.$value}\` | None |`);
  }
  return lines.join('\n');
}

function materialRecipeTable() {
  const r = read('core/tokens/crystal.json').material;
  const pct = v => `${Math.round(v * 100)}%`;
  const rows = [
    ['Plastic', 'Opaque. No backdrop filter at all.', 'None'],
    ['Frost', `${r.acrylicBlur}px blur, ${r.acrylicSaturation}% saturation`, `grain ${r.grainOpacity}`],
    ['Resin', `${r.glassBlur}px blur, ${r.glassSaturation}% saturation`, `fixed ${pct(r.glassOpacity)} fill, both modes`],
    ['Haze', `${pct(r.contentOpacity)} content fill`, `${r.contentFeather}px feather`],
    ['Stone', `${pct(r.labelVeil)} light / ${pct(r.labelVeilDark)} dark`, `${r.stoneFeather || r.contentFeather}px feather`],
    ['Mirage', `${r.mirageBlur}px blur, ${r.mirageSaturation}% saturation, ${r.mirageBrightness}% brightness`,
      `${r.mirageColor} at ${pct(r.mirageOpacity)}; ${pct(r.mirageFallbackOpacity)} without backdrop filtering`],
  ];
  return ['| Material | Diffusion | Fill |', '|---|---|---|']
    .concat(rows.map(([a, b, c]) => `| **${a}** | ${b} | ${c} |`)).join('\n');
}

function paletteTable() {
  const tokens = read('core/tokens/crystal.tokens.json');
  const lines = ['| Identity | Seed | Companion | Glow |', '|---|---|---|---|'];
  for (const [name, p] of Object.entries(tokens.primitive.palette)) {
    if (name.startsWith('$')) continue;
    const v = k => (p[k] && p[k].$value) ? `\`${p[k].$value}\`` : 'None';
    lines.push(`| ${name[0].toUpperCase() + name.slice(1)} | ${v('seed')} | ${v('companion')} | ${v('glow')} |`);
  }
  return lines.join('\n');
}

/* Read from the library's own exported theme, because this is the library's
   specification and it may only describe what the library ships. The preview
   site's `controls.css` overrides `--cr-focus-ring` and must not be the source
   (D-11), and it is not in this repository.

   Six layers since 21 September 2026. Meridian decided the library carries the
   two elevation layers, so they belong in this table. Layers are classified by
   their y-offset rather than counted by position: a halo layer is
   `0 0 blur spread` and an elevation layer is `0 Ny blur` with no spread, so
   reading the second and third numbers as blur and spread would report the
   lift as "blur 8, spread 18". */
function focusRecipeTable() {
  const css = fs.readFileSync(path.join(ROOT, 'core/assets/crystal-theme.css'), 'utf8');
  const ring = /--cr-focus-ring:\s*([^;]+);/.exec(css);
  if (!ring) throw new Error('core/assets/crystal-theme.css: no --cr-focus-ring to read');

  /* The ring names its colours rather than inlining them, so the alpha, which
     is what makes the falloff, has to be looked up. First occurrence of each:
     the theme carries a light block and a dark one, and this table documents
     the light. */
  const colour = (name) => {
    const m = new RegExp(`--${name}:\\s*([^;]+);`).exec(css);
    if (!m) throw new Error(`core/assets/crystal-theme.css: no --${name} to resolve`);
    return m[1].trim();
  };
  const alphaOf = (value) => {
    const ref = /var\(\s*--([a-z0-9-]+)/.exec(value);
    const resolved = ref ? colour(ref[1]) : value;
    const m = /rgba?\([^)]*?([\d.]+)\s*\)/.exec(resolved);
    if (!m) throw new Error(`unreadable focus colour: ${value}`);
    return Math.round(Number(m[1]) * 100);
  };

  const layers = ring[1].split(/,(?![^(]*\))/).map((s) => s.trim());
  if (layers.length !== 6) throw new Error(`expected six focus layers, read ${layers.length}`);

  const lines = ['| Layer | Blur | Spread | Role |', '|---|---|---|---|',
    '| `outline: 2px solid var(--cr-focus-core)` at `outline-offset: 3px` | None | None | The crisp core. Never feathered, and the only part that survives forced colours. |'];
  let halo = 0;
  let lift = 0;
  for (const layer of layers) {
    const feathered = /^0\s+0\s+([\d.]+\w*)\s+([\d.]+\w*)\s+(.+)$/.exec(layer);
    if (feathered) {
      const [, blur, spread, value] = feathered;
      halo += 1;
      lines.push(`| Halo ${halo} | ${blur} | ${spread} | ${alphaOf(value)}% of the primary colour |`);
      continue;
    }
    const elevated = /^0\s+([\d.]+\w*)\s+([\d.]+\w*)\s+(.+)$/.exec(layer);
    if (!elevated) throw new Error(`unreadable focus layer: ${layer}`);
    const [, offset, blur, value] = elevated;
    lift += 1;
    const role = lift === 1
      ? `${alphaOf(value)}% of the primary colour, offset ${offset}: the directional lift`
      : `${alphaOf(value)}% of the decorative colour, offset ${offset}: the broad lift`;
    lines.push(`| Elevation ${lift} | ${blur} | None | ${role} |`);
  }
  if (halo !== 4 || lift !== 2) {
    throw new Error(`expected four halo layers and two elevation layers, read ${halo} and ${lift}`);
  }
  return lines.join('\n');
}

function contrastFigures() {
  const checks = read('validation/token-checks.json');
  const text = checks.results.filter(r => r.minimum === 4.5).map(r => r.ratio);
  return [
    `${checks.checks.toLocaleString()} contrast cases are computed across all six palettes in both`,
    'modes, including bounded composites: Resin and Haze control labels are checked with the',
    'optical sheen beneath the protective fill, against content composites and RGB-corner',
    'backdrops with the fixed Resin fill.',
    '',
    '| Measure | Result |',
    '|---|---|',
    `| Cases computed | ${checks.checks.toLocaleString()} |`,
    `| Failures | ${checks.failures.length} |`,
    `| Lowest result of any kind | ${checks.minimum.toFixed(2)}:1 |`,
    `| Lowest normal-text result | ${Math.min(...text).toFixed(2)}:1 |`,
    `| Checks run | ${String(checks.date).slice(0, 10)} |`,
    '',
    'Normal text is held to 4.5:1. Essential non-text (focus rings, control boundaries,',
    'indicator lines) is held to the separate 3:1 threshold that applies to those elements.',
  ].join('\n');
}

function iconFigures() {
  const sprite = fs.readFileSync(path.join(ROOT, 'core/assets/icons.svg'), 'utf8');
  const ui = (sprite.match(/<symbol /g) || []).length;
  const manifest = read('core/assets/icons/manifest.json');
  const g = manifest.grid || {};
  const lines = ['| Source | Count | Licence |', '|---|---|---|'];
  for (const [name, s] of Object.entries(manifest.sources || {})) {
    /* The manifest records a path from the library root; this table lives in
       the library's own docs/, one level down. Package-relative, so the link
       resolves inside @crystal-ui/core wherever it is installed. The website's
       renderer maps it onto the site. */
    const notice = s.notice ? ` ([notice](../${s.notice.replace(/^core\//, '')}))` : '';
    lines.push(`| ${name} | ${s.count} | ${esc(s.license || 'None')}${notice} |`);
  }
  lines.push(`| **Total** | **${manifest.total}** | |`);
  lines.push('');
  lines.push(`One grid: \`${g.viewBox}\` view box, ${g.strokeWidth}px strokes, ` +
    `${g.linecap} caps and ${g.linejoin} joins, and \`currentColor\` so every icon inherits a ` +
    'tested foreground colour.');
  lines.push('');
  lines.push(`This site's own interface uses ${ui} of them, inlined as a sprite in ` +
    '`core/assets/icons.svg`; the full set is one file per icon under `core/assets/icons/`.');
  return lines.join('\n');
}

/* ---------- writing ---------- */

function replaceSection(file, name, body) {
  const full = path.join(ROOT, file);
  const text = fs.readFileSync(full, 'utf8');
  const open = `<!-- generated:${name} -->`;
  const close = `<!-- /generated:${name} -->`;
  const start = text.indexOf(open);
  const end = text.indexOf(close);
  if (start === -1 || end === -1) {
    throw new Error(`${file}: no ${open} ... ${close} region. Generated sections must be ` +
      `delimited so hand-written prose around them is never overwritten.`);
  }
  const next = text.slice(0, start + open.length) + '\n\n' + body + '\n' + text.slice(end);
  if (next !== text) fs.writeFileSync(full, next);
  return next !== text;
}

fs.writeFileSync(path.join(ROOT, 'core/docs/tokens.md'), tokensPage() + '\n');
const changed = [
  replaceSection('core/docs/motion.md', 'recipes', recipeSection()),
  replaceSection('core/docs/motion.md', 'shaders', shaderSection()),
  /* Generated from the recipe file, because a hand-maintained copy of it falls
     behind. */
  replaceSection('core/docs/motion-components.md', 'component-recipes', componentRecipeTable()),
  replaceSection('core/docs/materials.md', 'defaults', defaultsTable()),
  replaceSection('core/docs/materials.md', 'material-recipes', materialRecipeTable()),
  replaceSection('core/docs/colors.md', 'palettes', paletteTable()),
  replaceSection('core/docs/components.md', 'focus-recipe', focusRecipeTable()),
  replaceSection('core/docs/accessibility.md', 'contrast', contrastFigures()),
  replaceSection('core/docs/icons.md', 'icon-counts', iconFigures()),
];
console.log(`Generated core/docs/tokens.md and ${changed.length} reference sections.`);
