/* Publish each surface's recipe as values.
 *
 * `core/tokens/surfaces.json` ties every surface to a selector in
 * `core/assets/crystal.css`. A browser can wear a selector; SwiftUI and Compose
 * cannot, and a platform library that has to read the stylesheet to learn which
 * tokens a recipe uses will eventually read it wrong. This tool reads the
 * stylesheet the way a browser resolves it for an element that wears only the
 * surface's selector, and writes the result as token references:
 * `core/tokens/surface-recipes.json`. Every platform then resolves the same
 * recipe from its own exported tokens (`core/exports/crystal-tokens.*`).
 *
 * What the resolution does:
 *
 *   - Comments are stripped, then every style rule is collected with its cascade
 *     layer and the `@media`/`@supports`/`@container` conditions around it.
 *   - Selector lists are split, and `:is()`/`:where()` alias groups are
 *     expanded into plain alternatives for matching. Specificity is computed on
 *     the selector as written (`:is` and `:not` take their most specific
 *     argument, `:where` counts nothing), as the browser does.
 *   - A rule applies to a surface when its subject compound is a subset of the
 *     surface's compound and its ancestors are the surface's own, optionally
 *     behind `[data-effects=opaque]`. A rule that adds a state or a variant the
 *     surface selector does not name (`:hover`, `.primary`, `span.`) does not
 *     apply, because the element being described does not wear it.
 *   - Declarations are ordered by importance, layer (in the order line 8 of the
 *     stylesheet declares, reversed for `!important`), specificity and source
 *     order. The winner per property is the recipe.
 *   - A fallback branch lists only the declarations that win once its
 *     condition holds. A declaration the branch makes but which loses to the
 *     base recipe (a reset-layer fallback against a component-layer base, for
 *     instance) is reported under `shadowed`, because it never renders.
 *
 * The output is deterministic, so a rebuild with no source change is
 * byte-identical. `tests/core-contracts.cjs` regenerates it in memory and
 * compares it with the file on disk.
 *
 *   node tools/build-surface-recipes.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SURFACES = path.join(ROOT, 'core/tokens/surfaces.json');
const STYLESHEET = path.join(ROOT, 'core/assets/crystal.css');
const OUTPUT = path.join(ROOT, 'core/tokens/surface-recipes.json');

/* ------------------------------------------------------------- tokenising */

function stripComments(css) {
  let out = '';
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      const end = skipString(css, i);
      out += css.slice(i, end);
      i = end - 1;
    } else if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) throw new Error('unterminated comment in crystal.css');
      i = end + 1;
      out += ' ';
    } else {
      out += ch;
    }
  }
  return out;
}

function skipString(text, i) {
  const quote = text[i];
  for (let j = i + 1; j < text.length; j++) {
    if (text[j] === '\\') j++;
    else if (text[j] === quote) return j + 1;
  }
  throw new Error('unterminated string in crystal.css');
}

/* Index just past the `}` that closes the block opened at `open`. */
function matchBrace(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' || ch === "'") i = skipString(text, i) - 1;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return i + 1;
  }
  throw new Error('unbalanced braces in crystal.css');
}

/* Split on a separator that is not inside parentheses, brackets or strings. */
function splitTop(text, sep) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' || ch === "'") i = skipString(text, i) - 1;
    else if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === sep && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

function normaliseCondition(prelude) {
  return prelude
    .replace(/\s+/g, ' ')
    .replace(/^@(media|supports|container)\s*/, '@$1 ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s*:\s*/g, ':')
    .trim();
}

/* Collect every style rule with its layer and conditions, in source order. */
function parseStylesheet(css) {
  const code = stripComments(css);
  const rules = [];
  let layerOrder = null;

  function walk(text, layer, conditions) {
    let i = 0;
    while (i < text.length) {
      while (i < text.length && /\s/.test(text[i])) i++;
      if (i >= text.length) break;
      let j = i;
      let depth = 0;
      while (j < text.length) {
        const ch = text[j];
        if (ch === '"' || ch === "'") { j = skipString(text, j); continue; }
        if (ch === '(' || ch === '[') depth++;
        else if (ch === ')' || ch === ']') depth--;
        else if (depth === 0 && (ch === '{' || ch === ';' || ch === '}')) break;
        j++;
      }
      const prelude = text.slice(i, j).trim();
      if (j >= text.length || text[j] === '}') {
        if (prelude) throw new Error(`stray text in crystal.css: ${prelude.slice(0, 60)}`);
        i = j + 1;
        continue;
      }
      if (text[j] === ';') {
        const statement = prelude.match(/^@layer\s+(.+)$/);
        if (statement && !layerOrder) layerOrder = statement[1].split(',').map((s) => s.trim());
        i = j + 1;
        continue;
      }
      const end = matchBrace(text, j);
      const body = text.slice(j + 1, end - 1);
      if (prelude.startsWith('@')) {
        const name = prelude.match(/^@([\w-]+)/)[1];
        if (name === 'layer') {
          walk(body, prelude.replace(/^@layer\s*/, '').trim(), conditions);
        } else if (name === 'media' || name === 'supports' || name === 'container') {
          walk(body, layer, [...conditions, normaliseCondition(prelude)]);
        }
        /* @font-face, @keyframes and @property carry no surface recipe. */
      } else {
        if (body.includes('{')) throw new Error(`nested rule under ${prelude}; the recipe builder does not read CSS nesting`);
        const declarations = splitTop(body, ';').map((d) => {
          const colon = d.indexOf(':');
          if (colon === -1) throw new Error(`malformed declaration "${d}" in ${prelude}`);
          let property = d.slice(0, colon).trim();
          if (!property.startsWith('--')) property = property.toLowerCase();
          let value = d.slice(colon + 1).trim().replace(/\s+/g, ' ');
          const important = /!\s*important\s*$/i.test(value);
          if (important) value = value.replace(/\s*!\s*important\s*$/i, '');
          return { property, value, important };
        });
        rules.push({ selector: prelude.replace(/\s+/g, ' '), layer, conditions, declarations });
      }
      i = end;
    }
  }

  walk(code, null, []);
  if (!layerOrder) throw new Error('crystal.css declares no @layer order');
  return { rules, layerOrder };
}

/* -------------------------------------------------------------- selectors */

const LEGACY_PSEUDO_ELEMENTS = new Set(['before', 'after', 'first-line', 'first-letter']);

/* A complex selector as [{ combinator, simples }]. */
function parseComplex(text) {
  const out = [];
  let i = 0;
  let combinator = null;
  let simples = [];
  const flush = () => {
    if (simples.length) {
      out.push({ combinator: out.length ? combinator || ' ' : null, simples });
      simples = [];
      combinator = null;
    }
  };
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      flush();
      i++;
      continue;
    }
    if (ch === '>' || ch === '+' || ch === '~') {
      flush();
      combinator = ch;
      i++;
      continue;
    }
    if (ch === '[') {
      const end = text.indexOf(']', i);
      const inner = text.slice(i + 1, end).replace(/\s+/g, '').replace(/["']/g, '');
      simples.push({ kind: 'attr', text: `[${inner}]` });
      i = end + 1;
      continue;
    }
    if (ch === '.' || ch === '#') {
      const m = text.slice(i + 1).match(/^[-\w]+/);
      simples.push({ kind: ch === '.' ? 'class' : 'id', text: ch + m[0] });
      i += 1 + m[0].length;
      continue;
    }
    if (ch === '*') {
      simples.push({ kind: 'universal', text: '*' });
      i++;
      continue;
    }
    if (ch === ':') {
      const element = text[i + 1] === ':';
      const start = i + (element ? 2 : 1);
      const name = text.slice(start).match(/^[-\w]+/)[0].toLowerCase();
      i = start + name.length;
      let args = null;
      if (text[i] === '(') {
        let depth = 0;
        let j = i;
        for (; j < text.length; j++) {
          if (text[j] === '(') depth++;
          else if (text[j] === ')' && --depth === 0) break;
        }
        args = text.slice(i + 1, j).trim();
        i = j + 1;
      }
      if (element || LEGACY_PSEUDO_ELEMENTS.has(name)) {
        simples.push({ kind: 'pseudo-element', text: `::${name}${args !== null ? `(${args})` : ''}` });
      } else {
        const normalArgs = args === null ? null : splitTop(args, ',').map((a) => a.replace(/\s+/g, ' ')).join(',');
        simples.push({ kind: 'pseudo-class', name, args, text: `:${name}${normalArgs !== null ? `(${normalArgs})` : ''}` });
      }
      continue;
    }
    const m = text.slice(i).match(/^[-\w]+/);
    if (!m) throw new Error(`cannot read selector "${text}" at "${text.slice(i)}"`);
    simples.push({ kind: 'type', text: m[0].toLowerCase() });
    i += m[0].length;
  }
  flush();
  return out;
}

function specificity(complexText) {
  let a = 0, b = 0, c = 0;
  for (const compound of parseComplex(complexText)) {
    for (const s of compound.simples) {
      if (s.kind === 'id') a++;
      else if (s.kind === 'class' || s.kind === 'attr') b++;
      else if (s.kind === 'type' || s.kind === 'pseudo-element') c++;
      else if (s.kind === 'pseudo-class') {
        if (s.name === 'where') continue;
        if (['is', 'not', 'has', 'matches'].includes(s.name)) {
          let best = [0, 0, 0];
          for (const arg of splitTop(s.args, ',')) {
            const sp = specificity(arg);
            if (compareTuple(sp, best) > 0) best = sp;
          }
          a += best[0]; b += best[1]; c += best[2];
        } else {
          b++;
        }
      }
    }
  }
  return [a, b, c];
}

function compareTuple(x, y) {
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d;
  }
  return 0;
}

/* Expand `:is()` and `:where()` into plain alternatives. An argument with
   combinators of its own contributes its ancestors in front of the compound. */
function expandComplex(complex) {
  let alternatives = [[]];
  for (const compound of complex) {
    const compoundAlts = expandCompound(compound.simples);
    const next = [];
    for (const left of alternatives) {
      for (const alt of compoundAlts) {
        const joined = left.concat(alt.prefix.map((p, k) => ({
          combinator: k === 0 ? (left.length ? compound.combinator || ' ' : null) : p.combinator,
          simples: p.simples,
        })));
        joined.push({
          combinator: alt.prefix.length ? alt.joiner : (left.length ? compound.combinator || ' ' : null),
          simples: alt.simples,
        });
        next.push(joined);
      }
    }
    alternatives = next;
  }
  return alternatives;
}

function expandCompound(simples) {
  let alts = [{ prefix: [], joiner: null, simples: [] }];
  for (const s of simples) {
    if (s.kind === 'pseudo-class' && (s.name === 'is' || s.name === 'where' || s.name === 'matches')) {
      const options = splitTop(s.args, ',').flatMap((arg) => expandComplex(parseComplex(arg)));
      const next = [];
      for (const alt of alts) {
        for (const option of options) {
          const last = option[option.length - 1];
          const prefix = option.slice(0, -1);
          if (prefix.length && alt.prefix.length) continue; /* two ancestor chains in one compound: not used by Crystal */
          next.push({
            prefix: prefix.length ? prefix : alt.prefix,
            joiner: prefix.length ? last.combinator : alt.joiner,
            simples: alt.simples.concat(last.simples),
          });
        }
      }
      alts = next;
    } else {
      alts = alts.map((alt) => ({ ...alt, simples: alt.simples.concat([s]) }));
    }
  }
  return alts.map((alt) => ({ ...alt, simples: normaliseSimples(alt.simples) }));
}

function normaliseSimples(simples) {
  const seen = new Map();
  for (const s of simples) seen.set(s.text, s);
  let out = [...seen.values()];
  if (out.length > 1) out = out.filter((s) => s.kind !== 'universal');
  return out;
}

const compoundKey = (simples) => simples.map((s) => s.text).sort().join('');
const prefixKey = (compounds) =>
  compounds.map((c, k) => `${k ? c.combinator : ''}${compoundKey(c.simples)}`).join('|');

/* Split an expanded alternative into its ancestors, its subject compound and
   its pseudo-element. */
function anatomy(alternative) {
  const subject = alternative[alternative.length - 1];
  const pseudo = subject.simples.filter((s) => s.kind === 'pseudo-element');
  return {
    prefix: alternative.slice(0, -1),
    joiner: subject.combinator,
    simples: subject.simples.filter((s) => s.kind !== 'pseudo-element'),
    pseudoElement: pseudo.length ? pseudo.map((p) => p.text).join('') : null,
  };
}

/* -------------------------------------------------------------- matching */

const OPAQUE = '[data-effects=opaque]';

/* How a rule alternative reaches a target: null if it does not, else the
   pseudo-element it paints (or '' for the element) and whether it sits behind
   the opaque switch. */
function reach(rule, target) {
  if (!rule.simples.length) return null;
  if (rule.simples.every((s) => s.kind === 'universal')) return null;
  const targetSet = new Set(target.simples.map((s) => s.text));
  if (!rule.simples.every((s) => targetSet.has(s.text))) return null;

  let opaque = false;
  let prefix = rule.prefix;
  if (prefixKey(prefix) !== prefixKey(target.prefix) || (prefix.length && rule.joiner !== target.joiner)) {
    const head = prefix[0];
    const isOpaqueHead = head && head.simples.some((s) => s.text === OPAQUE)
      && head.simples.every((s) => s.text === OPAQUE || s.text === ':root' || s.text === 'html');
    if (!isOpaqueHead) return null;
    prefix = prefix.slice(1);
    if (prefixKey(prefix) !== prefixKey(target.prefix)) return null;
    if (prefix.length && rule.joiner !== target.joiner) return null;
    if (!prefix.length && rule.joiner !== ' ' && target.prefix.length === 0) return null;
    opaque = true;
  }

  if (target.pseudoElement) {
    if (rule.pseudoElement !== target.pseudoElement) return null;
    return { layer: '', opaque };
  }
  return { layer: rule.pseudoElement || '', opaque };
}

function bucketOf(opaque, conditions) {
  if (opaque && !conditions.length) return 'opaque';
  if (!opaque && conditions.length === 1) {
    const c = conditions[0];
    if (/prefers-reduced-transparency:reduce/.test(c)) return 'reducedTransparency';
    if (/forced-colors:active/.test(c)) return 'forcedColors';
    if (/^@supports not\b/.test(c) && /backdrop-filter/.test(c)) return 'noBackdropFilter';
  }
  if (!opaque && !conditions.length) return 'base';
  return 'condition:' + [...(opaque ? [OPAQUE] : []), ...conditions].join(' and ');
}

/* Every declaration that reaches the target, tagged with its cascade key. */
function candidatesFor(targetText, parsed) {
  const targets = splitTop(targetText, ',')
    .flatMap((t) => expandComplex(parseComplex(t)))
    .map(anatomy);
  const layerRank = (layer) => (layer === null ? parsed.layerOrder.length : parsed.layerOrder.indexOf(layer));
  for (const rule of parsed.rules) {
    if (rule.layer !== null && !parsed.layerOrder.includes(rule.layer)) {
      throw new Error(`rule ${rule.selector} sits in undeclared layer ${rule.layer}`);
    }
  }
  return targets.map((target) => {
    const found = [];
    parsed.rules.forEach((rule, ruleIndex) => {
      /* The most specific matching selector in the list is the one that counts. */
      const best = new Map();
      for (const complexText of splitTop(rule.selector, ',')) {
        const spec = specificity(complexText);
        for (const alt of expandComplex(parseComplex(complexText))) {
          const r = reach(anatomy(alt), target);
          if (!r) continue;
          const key = `${r.layer}\u0000${r.opaque}`;
          if (!best.has(key) || compareTuple(spec, best.get(key).spec) > 0) best.set(key, { ...r, spec });
        }
      }
      for (const hit of best.values()) {
        const bucket = bucketOf(hit.opaque, rule.conditions);
        rule.declarations.forEach((d, declIndex) => {
          const rank = layerRank(rule.layer);
          found.push({
            layer: hit.layer,
            bucket,
            property: d.property,
            value: d.value,
            key: [
              d.important ? 1 : 0,
              d.important ? parsed.layerOrder.length - rank : rank,
              ...hit.spec,
              ruleIndex,
              declIndex,
            ],
          });
        });
      }
    });
    return { text: targetText === '' ? '' : serialise(target), candidates: found };
  });
}

function serialise(target) {
  const parts = target.prefix.map((c, k) => `${k ? (c.combinator === ' ' ? ' ' : ` ${c.combinator} `) : ''}${c.simples.map((s) => s.text).join('')}`);
  let out = parts.join('');
  if (parts.length) out += target.joiner === ' ' ? ' ' : ` ${target.joiner} `;
  return out + target.simples.map((s) => s.text).join('') + (target.pseudoElement || '');
}

/* ------------------------------------------------------------ resolution */

function winners(candidates) {
  const byProperty = new Map();
  for (const c of candidates) {
    const current = byProperty.get(c.property);
    if (!current || compareTuple(c.key, current.key) > 0) byProperty.set(c.property, c);
  }
  return byProperty;
}

const sortObject = (map) => Object.fromEntries([...map].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

function resolve(candidates) {
  const layers = [...new Set(candidates.map((c) => c.layer))].sort();
  const buckets = [...new Set(candidates.map((c) => c.bucket))].filter((b) => b !== 'base').sort();
  const base = {};
  for (const layer of layers) {
    const w = winners(candidates.filter((c) => c.layer === layer && c.bucket === 'base'));
    base[layer] = new Map([...w].map(([p, c]) => [p, c]));
  }
  const branches = {};
  const shadowed = [];
  for (const bucket of buckets) {
    const branch = {};
    for (const layer of layers) {
      const inBranch = candidates.filter((c) => c.layer === layer && c.bucket === bucket);
      if (!inBranch.length) continue;
      const w = winners(candidates.filter((c) => c.layer === layer && (c.bucket === 'base' || c.bucket === bucket)));
      const overrides = new Map();
      for (const property of new Set(inBranch.map((c) => c.property))) {
        const win = w.get(property);
        if (win.bucket === bucket) {
          overrides.set(property, win.value);
          continue;
        }
        /* A branch that restates the value the base already has loses nothing. */
        const lost = winners(inBranch).get(property).value;
        if (lost !== win.value) {
          shadowed.push({ branch: bucket.replace(/^condition:/, ''), layer: layer || null, property, value: lost, by: win.value });
        }
      }
      if (overrides.size) branch[layer] = sortObject(overrides);
    }
    branches[bucket] = branch;
  }
  return { layers, base, branches, shadowed };
}

/* ------------------------------------------------------------ normalising */

const FALLBACKS = ['opaque', 'reducedTransparency', 'forcedColors', 'noBackdropFilter'];
const TRANSPARENT = new Set(['transparent', 'none', 'rgba(0,0,0,0)']);

function filterFunctions(value) {
  const out = {};
  const re = /([-\w]+)\(((?:[^()]|\((?:[^()]|\([^()]*\))*\))*)\)/g;
  let m;
  let rest = value;
  while ((m = re.exec(value))) {
    out[m[1]] = m[2].trim();
    rest = rest.replace(m[0], '');
  }
  return { functions: out, rest: rest.trim() };
}

function branchShape(branch) {
  if (!branch) return null;
  const out = {};
  if (branch['']) out.declarations = branch[''];
  const layers = Object.keys(branch).filter((l) => l).sort();
  if (layers.length) out.layers = Object.fromEntries(layers.map((l) => [l, branch[l]]));
  return Object.keys(out).length ? out : null;
}

function normalise(resolved) {
  const own = resolved.base[''] || new Map();
  const value = (p) => (own.has(p) ? own.get(p).value : null);
  const consumed = new Set();
  const take = (p) => { consumed.add(p); return value(p); };
  const diagnostics = [];

  /* Fill is whichever of `background` and `background-color` wins. */
  let fill = null;
  const bg = own.get('background');
  const bgc = own.get('background-color');
  if (bg && (!bgc || compareTuple(bg.key, bgc.key) > 0)) { fill = take('background'); }
  else if (bgc) { fill = take('background-color'); }

  let blur = null;
  let saturation = null;
  const backdrop = value('backdrop-filter');
  if (backdrop !== null) {
    const { functions, rest } = filterFunctions(backdrop);
    blur = functions.blur ?? null;
    saturation = functions.saturate ?? null;
    const extra = Object.keys(functions).filter((f) => f !== 'blur' && f !== 'saturate');
    if (!extra.length && !rest) consumed.add('backdrop-filter');
    const webkit = value('-webkit-backdrop-filter');
    if (webkit === backdrop) consumed.add('-webkit-backdrop-filter');
    else if (webkit === null && backdrop !== 'none') diagnostics.push('backdrop-filter has no -webkit-backdrop-filter twin, so Safari before 18 renders no diffusion');
  }

  let rim = null;
  if (own.has('border')) rim = take('border');
  else if (own.has('border-color')) rim = take('border-color');
  /* A `border-color` that cascades after the shorthand replaces its colour, so
     the rim the browser draws is the shorthand's width and style with that
     colour. */
  if (own.has('border') && own.has('border-color') && compareTuple(own.get('border-color').key, own.get('border').key) > 0) {
    const parts = splitTop(value('border'), ' ');
    const colour = value('border-color');
    if (parts.length === 3 && splitTop(colour, ' ').length === 1) {
      rim = `${parts[0]} ${parts[1]} ${colour}`;
      consumed.add('border-color');
      diagnostics.push(`rim composed from the border shorthand (${value('border')}) and border-color (${colour}), which cascades after it`);
    } else {
      diagnostics.push(`border-color (${colour}) cascades after the border shorthand and replaces its colour`);
    }
  }

  const shadow = take('box-shadow');
  const radius = take('border-radius');
  const padding = take('padding');

  let ownFeather = null;
  const filter = value('filter');
  if (filter !== null) {
    const { functions, rest } = filterFunctions(filter);
    if (functions.blur && Object.keys(functions).length === 1 && !rest) {
      ownFeather = functions.blur;
      consumed.add('filter');
    }
  }

  const layers = {};
  for (const layer of resolved.layers.filter((l) => l)) {
    const decls = resolved.base[layer];
    if (decls && decls.size) layers[layer] = sortObject(new Map([...decls].map(([p, c]) => [p, c.value])));
  }

  /* The feathered paint layer: a pseudo-element that draws a fill through a
     blur filter. Crystal paints Haze and Stone this way so the foreground stays
     crisp, and it is the layer a platform must reproduce. */
  let haze = null;
  for (const layer of Object.keys(layers).sort((a, b) => (a === '::before' ? -1 : b === '::before' ? 1 : a < b ? -1 : 1))) {
    const d = layers[layer];
    if (d.content === 'none' || d.display === 'none') continue;
    const layerFill = d.background ?? d['background-color'];
    if (!layerFill || TRANSPARENT.has(layerFill) || !d.filter) continue;
    const { functions } = filterFunctions(d.filter);
    if (!functions.blur) continue;
    haze = { layer, inset: d.inset ?? null, fill: layerFill, feather: functions.blur, radius: d['border-radius'] ?? null };
    break;
  }

  const extras = sortObject(new Map([...own].filter(([p]) => !consumed.has(p)).map(([p, c]) => [p, c.value])));
  const fallbacks = Object.fromEntries(FALLBACKS.map((f) => [f, branchShape(resolved.branches[f])]));
  const conditions = Object.fromEntries(Object.keys(resolved.branches)
    .filter((b) => b.startsWith('condition:'))
    .sort()
    .map((b) => [b.slice('condition:'.length), branchShape(resolved.branches[b])])
    .filter(([, v]) => v));

  return {
    fill,
    blur,
    saturation,
    rim,
    shadow,
    radius,
    padding,
    haze,
    feather: ownFeather ?? (haze ? haze.feather : null),
    extras,
    layers,
    fallbacks,
    conditions,
    shadowed: resolved.shadowed
      .sort((a, b) => (`${a.branch}${a.layer}${a.property}` < `${b.branch}${b.layer}${b.property}` ? -1 : 1)),
    diagnostics: diagnostics.sort(),
  };
}

function tokensIn(value, into = new Set()) {
  if (typeof value === 'string') {
    for (const m of value.matchAll(/var\(\s*(--cr-[-\w]+)/g)) into.add(m[1]);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) tokensIn(v, into);
  }
  return into;
}

/* What a surface's materials oblige its recipe to carry. A material named in
   surfaces.json with nothing in the recipe that paints it is a gap, either in
   the stylesheet or in the vocabulary. */
function missingFor(materials, recipe) {
  const missing = [];
  const allLayers = Object.values(recipe.layers);
  const paints = (v) => v && !TRANSPARENT.has(v);
  const anyFill = paints(recipe.fill) || allLayers.some((d) => paints(d.background) || paints(d['background-color']));
  const anyBlur = recipe.blur !== null || allLayers.some((d) => d['backdrop-filter'] && /blur\(/.test(d['backdrop-filter']));
  const needs = new Set(materials);
  if (['Frost', 'Resin', 'Mirage', 'Plastic'].some((m) => needs.has(m)) && !anyFill) missing.push('fill');
  if (['Frost', 'Resin', 'Mirage'].some((m) => needs.has(m)) && !anyBlur) missing.push('blur');
  if ((needs.has('Haze') || needs.has('Stone')) && !recipe.haze && !/--cr-(haze|stone|label)-/.test(recipe.fill || '')) missing.push('haze');
  if (['Frost', 'Resin', 'Haze', 'Stone'].some((m) => needs.has(m)) && recipe.radius === null) missing.push('radius');
  return missing;
}

function recipeFor(selector, materials, parsed) {
  const perTarget = candidatesFor(selector, parsed).map((t) => ({ text: t.text, recipe: normalise(resolve(t.candidates)) }));
  const first = JSON.stringify(perTarget[0].recipe);
  if (perTarget.every((t) => JSON.stringify(t.recipe) === first)) {
    const recipe = perTarget[0].recipe;
    return { selector, ...recipe, missing: missingFor(materials, recipe) };
  }
  /* A selector that expands to elements the stylesheet paints differently is
     published per element. */
  return {
    selector,
    alternatives: Object.fromEntries(perTarget.map((t) => [t.text, { ...t.recipe, missing: missingFor(materials, t.recipe) }])),
  };
}

/* ----------------------------------------------------------------- build */

function buildSurfaceRecipes() {
  const { surfaces } = JSON.parse(fs.readFileSync(SURFACES, 'utf8'));
  const parsed = parseStylesheet(fs.readFileSync(STYLESHEET, 'utf8'));

  const records = surfaces.map((s) => {
    const head = { id: s.id, name: s.name, materials: s.materials };
    if (s.class === null) {
      return { ...head, kind: 'none', selector: null, note: 'This surface has no material of its own. A component made of it inherits whatever it sits on, so there is no recipe to publish.', tokens: [] };
    }
    const kind = /^\.[-\w]+(\.[-\w]+)*$/.test(s.class) ? 'class' : 'element';
    const primary = recipeFor(s.class, s.materials, parsed);
    const also = Object.fromEntries((s.also || []).map((sel) => [sel, recipeFor(sel, s.materials, parsed)]));
    const record = { ...head, kind };
    if (kind === 'element') {
      record.note = 'Crystal paints this surface on native elements by element selector rather than a class. The recipe is what the stylesheet gives that element.';
    }
    Object.assign(record, primary);
    if (Object.keys(also).length) record.also = also;
    /* A recipe that cannot resolve every material it names says why, in the
       vocabulary's `partial` map, keyed by the selector (C-S1). */
    for (const [selector, why] of Object.entries(s.partial || {})) {
      const target = selector === s.class ? record : also[selector];
      if (!target) throw new Error(`surfaces.json: ${s.id}.partial names "${selector}", which is neither its class nor one of its also selectors`);
      target.why = why;
    }
    record.tokens = [...tokensIn({ primary, also })].sort();
    return record;
  });

  const document = {
    $description: [
      'GENERATED by tools/build-surface-recipes.cjs from core/tokens/surfaces.json and core/assets/crystal.css. Never edit it by hand: change the stylesheet or the vocabulary and rebuild. tests/core-contracts.cjs fails when this file is out of date.',
      'Each surface in surfaces.json has one record. Its recipe is what the stylesheet resolves for an element wearing only the surface selector, written as the stylesheet writes it: token references such as `var(--cr-resin-fill)`, literals such as `999px`, and expressions such as `calc(var(--cr-radius) + 6px)`. A platform resolves the tokens from its own export (core/exports/crystal-tokens.ts, .swift, .kt), so every platform reaches the same values.',
      'Fields: `fill` is the element\'s own background (the winner of `background` and `background-color`). `blur` and `saturation` are the arguments of `blur()` and `saturate()` in its `backdrop-filter`. `rim` is the border the browser draws: the `border` shorthand, with its colour replaced by a `border-color` that cascades after it (noted under `diagnostics`), or `border-color` alone when there is no shorthand. `shadow` is `box-shadow`, `radius` is `border-radius`, `padding` is the `padding` shorthand. `haze` is the feathered paint layer: a pseudo-element that draws a fill through a blur filter, which is how Crystal paints Haze and Stone so the foreground stays crisp. When `haze` is present the element\'s own `fill` is usually `transparent`, and the visible reading fill is `haze.fill`. `feather` is the blur of the feathered paint, on the element or on that layer. `extras` holds every other declaration on the element. `layers` holds every pseudo-element the recipe paints, keyed by its name.',
      '`fallbacks` holds the four adaptations: `opaque` under `[data-effects=opaque]`, `reducedTransparency` under `@media (prefers-reduced-transparency:reduce)`, `forcedColors` under `@media (forced-colors:active)`, and `noBackdropFilter` under `@supports not (backdrop-filter...)`. Each lists only the declarations that change and win, as `declarations` for the element and `layers` for pseudo-elements. A null branch changes nothing. `conditions` holds other conditional branches the same way, keyed by the condition. `shadowed` lists declarations a branch makes that lose to the base recipe in the cascade and therefore never render. `missing` names what the surface\'s materials oblige the recipe to carry and the stylesheet does not supply for this selector, and `why` says why it cannot (the selector is a part of the surface, or takes the value from what it is worn on).',
      'Rules that add a state or a variant the surface selector does not name (`:hover`, `.primary`, `span.cr-field-shell`, descendants such as `.cr-dock button`) are not part of a recipe, because the element described does not wear them. `tokens` lists every `--cr-*` custom property the record references. A selector that expands to elements the stylesheet paints differently, such as the checkbox and the radio, carries `alternatives`: one recipe per element, keyed by the element selector, in place of the top-level fields.',
    ].join(' '),
    layerOrder: parsed.layerOrder,
    surfaces: records,
  };
  return JSON.stringify(document, null, 2) + '\n';
}

/** Every selector whose recipe misses a material it names and gives no `why`. */
function unexplainedGaps(surfaces) {
  const gaps = [];
  const visit = (id, selector, recipe) => {
    if (!recipe) return;
    const missing = recipe.missing?.length ? recipe.missing
      : Object.values(recipe.alternatives || {}).flatMap((a) => a.missing);
    if (missing.length && !recipe.why) gaps.push(`${id} ${selector}: ${[...new Set(missing)].join(', ')}`);
  };
  for (const s of surfaces) {
    visit(s.id, s.selector, s);
    for (const [selector, recipe] of Object.entries(s.also || {})) visit(s.id, selector, recipe);
  }
  return gaps;
}

module.exports = { buildSurfaceRecipes, OUTPUT, parseStylesheet, specificity, unexplainedGaps };

if (require.main === module) {
  const text = buildSurfaceRecipes();
  fs.writeFileSync(OUTPUT, text);
  const { surfaces } = JSON.parse(text);
  const unexplained = unexplainedGaps(surfaces);
  console.log(`Wrote ${path.relative(ROOT, OUTPUT)}: ${surfaces.length} surfaces, ${unexplained.length} selector(s) with a material the recipe does not paint and no reason given.`);
}
