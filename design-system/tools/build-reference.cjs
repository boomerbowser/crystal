/* Generate the parts of the documentation that are derivable from the sources.
 *
 * A token table transcribed by hand is a token table that is wrong within a
 * release. Everything here is written from `tokens/`, `assets/shaders/` and the
 * motion recipes, so the documentation cannot disagree with what ships.
 *
 * Whole-file outputs are written directly. Sections inside a hand-written page
 * are delimited by <!-- generated:NAME --> ... <!-- /generated:NAME --> markers
 * so prose and generated tables can share one source file.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const spring = require(path.join(ROOT, 'assets/core/spring.js'));

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
  primitive: ['Primitive', 'Raw values. Never referenced by a component directly — a primitive is the thing a semantic token points at, so that the meaning can be re-pointed without editing every use site.'],
  semantic: ['Semantic', 'What a value *means*: the surface a card sits on, the duration a control settles over. Components consume this tier and nothing below it.'],
  component: ['Component', 'Values that belong to one component family and would be wrong to reuse elsewhere. This tier exists so a component can be specific without inventing a private constant.'],
};

function tokensPage() {
  const tokens = read('tokens/crystal.tokens.json');
  const deprecated = tokens.$deprecated || {};
  const lines = [
    '# Tokens',
    '',
    'Every value Crystal ships, generated from `tokens/crystal.tokens.json` — the W3C',
    'Design Tokens (DTCG) source of truth. This page is written by',
    '`tools/build-reference.cjs`; editing it by hand is pointless, because the next build',
    'overwrites it. Edit the token file and run `python3 tools/build.py`.',
    '',
    '## How the three tiers work',
    '',
    'Crystal resolves a value through three tiers, and the direction is strictly one way:',
    'a component reads a semantic token, a semantic token reads a primitive, and nothing',
    'reads upward. That is what makes a palette swap a change to one tier rather than a',
    'search across the codebase.',
    '',
    '```',
    'component.action.radius  →  semantic.shape.pill  →  primitive.distance.full',
    '```',
    '',
    '**A component that reads a primitive directly is a bug.** It works, and it silently',
    'opts that component out of every theme, mode and palette change made at the semantic',
    'tier. `tools/validate-tokens.cjs` checks the direction of every reference.',
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
        const note = deprecated[name] ? ` **Deprecated** — ${deprecated[name]}` : '';
        lines.push(`| \`${name}\` | ${token.$type || '—'} | ${formatValue(token.$value)} | ${esc(token.$description || '—')}${note} |`);
      }
      lines.push('');
    }
  }
  const dep = Object.entries(deprecated);
  if (dep.length) {
    lines.push('## Deprecations', '',
      'A deprecated token still resolves. It is listed here so adopters can migrate before',
      'it is removed, which is the only reason to keep a name that no longer describes its',
      'value.', '', '| Token | Replacement or reason |', '| --- | --- |');
    for (const [name, why] of dep) lines.push(`| \`${name}\` | ${esc(why)} |`);
    lines.push('');
  }
  return lines.join('\n');
}

/* ---------- motion recipes ---------- */

function recipeSection() {
  const motion = read('tokens/motion-recipes.json');
  const lines = [
    'All 54 recipes, generated from `tokens/motion-recipes.json`. **Damping ratio** and',
    '**overshoot** are derived from each recipe\'s spring by `assets/core/spring.js`, not',
    'authored — so a spring that was retuned cannot leave a stale number behind in this table.',
    '',
    'A damping ratio below 1 overshoots and settles back; exactly 1 is the fastest approach',
    'with no overshoot; above 1 crawls in without ever passing the target. Which one is',
    'correct is a material question, not a taste question — see the signature policy below.',
    '',
  ];
  const categories = [...new Set(motion.recipes.map(r => r.category))];
  for (const category of categories) {
    const rows = motion.recipes.filter(r => r.category === category);
    lines.push(`#### ${category}`, '',
      '| Recipe | Duration | Signature | Material | Damping ζ | Overshoot | Use | Reduced motion |',
      '| --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const r of rows) {
      const zeta = spring.dampingRatio(r.spring);
      const peak = spring.peakOvershoot(r.spring);
      const over = peak > 0.001 ? `${(peak * 100).toFixed(1)}%` : 'none';
      lines.push(`| \`${r.id}\` — ${esc(r.label)} | ${r.duration}ms | ${r.signature || '—'} | ${r.material || '—'} | ${zeta.toFixed(3)} | ${over} | ${esc(r.use || '—')} | ${esc(r.reduced || '—')} |`);
    }
    lines.push('');
  }
  lines.push('**Spring policy.** ' + motion.springPolicy, '');
  lines.push('**Travel policy.** ' + motion.travelPolicy, '');
  lines.push('**Incompressibility.** ' + motion.incompressibility, '');
  return lines.join('\n');
}

/* ---------- shader contract ---------- */

function shaderSection() {
  const m = read('assets/shaders/manifest.json');
  const lines = [
    `Generated from \`assets/shaders/manifest.json\` (version ${m.version}).`,
    '',
    '**The contract is the uniform set, not the GLSL.** A platform that honours these',
    'uniforms has implemented Crystal\'s shader layer correctly, whether it does so in',
    'GLSL, Metal or AGSL. The `.frag` files in this repository are one implementation.',
    '',
    '### Uniforms', '',
    '| Uniform | Type | Meaning |', '| --- | --- | --- |',
  ];
  for (const [name, u] of Object.entries(m.uniforms)) {
    lines.push(`| \`${name}\` | ${u.type || '—'} | ${esc(u.description || u.meaning || '—')} |`);
  }
  lines.push('', '### Shaders', '');
  for (const s of m.shaders) {
    lines.push(`#### \`${s.id}\``, '',
      `- **Material** — ${s.material}`,
      `- **Signatures** — ${(s.signatures || []).join(', ') || '—'}`,
      `- **Blend mode** — \`${s.blend}\``,
      `- **Degrades to** — ${s.degradesTo || 'the CSS approximation'}`,
      '', esc(s.claim || ''), '');
  }
  if (m.compositing) {
    lines.push('### Compositing', '');
    for (const [k, v] of Object.entries(m.compositing)) {
      lines.push(`**${k}** — ${typeof v === 'string' ? v : JSON.stringify(v)}`, '');
    }
  }
  if (m.opticalModel) {
    lines.push('### The optical model', '');
    for (const [k, v] of Object.entries(m.opticalModel)) {
      lines.push(`**${k}** — ${typeof v === 'string' ? v : JSON.stringify(v)}`, '');
    }
  }
  if (m.platformMapping) {
    lines.push('### Platform mapping', '', '| Platform | Shading language |', '| --- | --- |');
    for (const [k, v] of Object.entries(m.platformMapping)) lines.push(`| ${k} | ${esc(v)} |`);
    lines.push('');
  }
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

fs.writeFileSync(path.join(ROOT, 'docs/tokens.md'), tokensPage() + '\n');
const changed = [
  replaceSection('docs/motion.md', 'recipes', recipeSection()),
  replaceSection('docs/motion.md', 'shaders', shaderSection()),
];
console.log(`Generated docs/tokens.md and ${changed.length} reference sections.`);
