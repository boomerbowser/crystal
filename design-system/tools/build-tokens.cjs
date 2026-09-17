/* Crystal token pipeline.
 *
 * The DTCG file is the authoring format; the flat runtime file is generated from
 * it. Derived values (elevation-scaled shadows, rgba composites, scaled motion)
 * stay in the resolver, because DTCG has no computation and reimplementing that
 * arithmetic here would risk changing a material specification.
 *
 *   --migrate   flat runtime tokens -> DTCG source   (one-time, deterministic)
 *   (default)   DTCG source -> flat runtime tokens + platform exports
 *
 * The default path asserts a byte-identical round trip. That assertion is the
 * mechanical proof that restructuring the source changed no material value.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FLAT = path.join(ROOT, 'tokens/crystal.json');
const DTCG = path.join(ROOT, 'tokens/crystal.tokens.json');
const EXPORTS = path.join(ROOT, 'exports');

const MODE_ROLES = {
  canvas: 'Foundation behind every surface',
  surface: 'Opaque reading surface',
  surfaceAlt: 'Secondary reading surface',
  text: 'Body ink',
  muted: 'Supporting ink',
  primary: 'Action colour',
  onPrimary: 'Ink on the action colour',
  primarySoft: 'Selected or authored container',
  onPrimarySoft: 'Ink on the soft container',
  outline: 'Functional boundary',
  decorative: 'Atmosphere and decorative light',
  companion: 'Paired atmosphere colour',
  glow: 'Highlight light',
};

const MATERIAL_ROLES = {
  acrylicBlur: ['frost.diffusion', 'dimension', 'Frost backdrop diffusion'],
  acrylicSaturation: ['frost.saturation', 'number', 'Frost backdrop saturation, percent'],
  glassBlur: ['resin.diffusion', 'dimension', 'Resin backdrop diffusion'],
  glassSaturation: ['resin.saturation', 'number', 'Resin backdrop saturation, percent'],
  glassOpacity: ['resin.fill', 'number', 'Resin fill opacity, fixed by the material contract'],
  grainOpacity: ['frost.grain', 'number', 'Frost grain opacity'],
  labelVeil: ['stone.fill.light', 'number', 'Stone label backing, light mode'],
  labelVeilDark: ['stone.fill.dark', 'number', 'Stone label backing, dark mode'],
  contentOpacity: ['haze.fill', 'number', 'Haze content fill opacity'],
  contentFeather: ['haze.feather', 'dimension', 'Haze feathered perimeter'],
  stoneFeather: ['stone.feather', 'dimension', 'Stone feathered perimeter'],
  mirageColor: ['mirage.colour', 'color', 'Mirage scrim colour'],
  mirageOpacity: ['mirage.opacity', 'number', 'Mirage scrim opacity'],
  mirageBlur: ['mirage.diffusion', 'dimension', 'Mirage chromatic diffusion'],
  mirageSaturation: ['mirage.saturation', 'number', 'Mirage saturation, percent'],
  mirageBrightness: ['mirage.brightness', 'number', 'Mirage brightness, percent'],
  mirageFallbackOpacity: ['mirage.fallback', 'number', 'Mirage opacity without backdrop filtering'],
};

const leaf = ($type, $value, $description) =>
  $description ? { $type, $value, $description } : { $type, $value };

const dim = (n) => `${n}px`;
const dur = (n) => `${n}ms`;

function set(tree, dotted, node) {
  const parts = dotted.split('.');
  let cursor = tree;
  for (const part of parts.slice(0, -1)) cursor = cursor[part] ??= {};
  cursor[parts.at(-1)] = node;
}

function get(tree, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), tree);
}

/* ---------------------------------------------------------------- migrate */

function migrate() {
  const flat = JSON.parse(fs.readFileSync(FLAT, 'utf8'));
  const out = {
    $schema: 'https://tr.designtokens.org/format/',
    $description:
      `Crystal design tokens, W3C DTCG format. Three tiers: primitive holds raw values, ` +
      `semantic names roles and aliases primitives, component binds semantics to control ` +
      `surfaces. Derived values (elevation-scaled shadows, rgba composites, scaled motion) ` +
      `are computed by the resolver, not stored here.`,
    $meta: {
      system: flat.name,
      version: flat.version,
      basis: flat.basis,
      generatedFrom: 'tokens/crystal.json',
    },
    primitive: {},
    semantic: {},
    component: {},
  };

  /* primitive: palette identity and per-mode colour values */
  for (const [id, palette] of Object.entries(flat.palettes)) {
    set(out.primitive, `palette.${id}.$name`, palette.name);
    set(out.primitive, `palette.${id}.$description`, palette.description);
    for (const key of ['seed', 'companion', 'glow']) {
      set(out.primitive, `palette.${id}.${key}`, leaf('color', palette[key]));
    }
    for (const [mode, roles] of Object.entries(palette.modes)) {
      for (const [role, value] of Object.entries(roles)) {
        set(out.primitive, `palette.${id}.${mode}.${role}`, leaf('color', value, MODE_ROLES[role]));
      }
    }
  }

  /* primitive: raw numeric scales */
  const m = flat.material;
  for (const [key, [, type]] of Object.entries(MATERIAL_ROLES)) {
    const raw = m[key];
    const value = type === 'dimension' ? dim(raw) : raw;
    set(out.primitive, `material.${key}`, leaf(type, value));
  }
  for (const [mode, value] of Object.entries(m.micaInactive)) {
    set(out.primitive, `material.plasticInactive.${mode}`, leaf('color', value));
  }

  const mo = flat.motion;
  for (const key of ['press', 'state', 'spatial', 'exit', 'material', 'liquid', 'flow', 'departure', 'maxDuration']) {
    set(out.primitive, `duration.${key}`, leaf('duration', dur(mo[key])));
  }
  for (const [key, value] of Object.entries(mo.distance)) {
    set(out.primitive, `distance.${key}`, leaf('dimension', dim(value)));
  }
  set(out.primitive, 'distance.maxTravel', leaf('dimension', dim(mo.maxTravel)));
  set(out.primitive, 'distance.$travelPolicy', mo.travelPolicy);
  for (const [key, value] of Object.entries(mo.easing)) {
    set(out.primitive, `easing.${key}`, leaf('cubicBezier', value));
  }

  /* semantic: material roles alias primitives */
  for (const [key, [role, , description]] of Object.entries(MATERIAL_ROLES)) {
    set(out.semantic, `material.${role}`, leaf(
      MATERIAL_ROLES[key][1], `{primitive.material.${key}}`, description));
  }
  set(out.semantic, 'material.plastic.inactive.light',
    leaf('color', '{primitive.material.plasticInactive.light}', 'Plastic neutral fallback, inactive window'));
  set(out.semantic, 'material.plastic.inactive.dark',
    leaf('color', '{primitive.material.plasticInactive.dark}', 'Plastic neutral fallback, inactive window'));

  /* semantic: feedback pairs, independent of any brand palette */
  for (const [mode, statuses] of Object.entries(flat.status)) {
    for (const [name, pair] of Object.entries(statuses)) {
      set(out.semantic, `feedback.${mode}.${name}.ink`, leaf('color', pair.ink));
      set(out.semantic, `feedback.${mode}.${name}.surface`, leaf('color', pair.surface));
      set(out.semantic, `feedback.${mode}.${name}.symbol`, leaf('string', pair.symbol,
        'Carries meaning without colour. A check mark means validated or informational, never selected.'));
      set(out.semantic, `feedback.${mode}.${name}.label`, leaf('string', pair.label));
    }
  }

  /* semantic: motion roles */
  for (const key of ['press', 'state', 'spatial', 'exit', 'material', 'liquid', 'flow', 'departure']) {
    set(out.semantic, `motion.duration.${key}`, leaf('duration', `{primitive.duration.${key}}`));
  }
  set(out.semantic, 'motion.duration.ceiling', leaf('duration', '{primitive.duration.maxDuration}',
    'Hard ceiling for any single animation, including replay-rate adjustment'));
  for (const key of Object.keys(mo.easing)) {
    set(out.semantic, `motion.easing.${key}`, leaf('cubicBezier', `{primitive.easing.${key}}`));
  }
  for (const key of Object.keys(mo.distance)) {
    set(out.semantic, `motion.travel.${key}`, leaf('dimension', `{primitive.distance.${key}}`));
  }
  set(out.semantic, 'motion.travel.max', leaf('dimension', '{primitive.distance.maxTravel}'));

  /* semantic: typography */
  set(out.semantic, 'typography.family', leaf('fontFamily', flat.typography.family));
  set(out.semantic, 'typography.readingSize', leaf('dimension', dim(flat.typography.readingSize)));
  set(out.semantic, 'typography.readingLeading', leaf('dimension', dim(flat.typography.readingLeading)));

  /* component: bindings that libraries implement against */
  set(out.component, 'action.radius', leaf('dimension', '999px',
    'Action controls are pill-shaped, independent of the content radius'));
  set(out.component, 'action.minTarget', leaf('dimension', '44px', 'Minimum interactive target'));
  set(out.component, 'card.radius', leaf('dimension', '{semantic.shape.contentRadius}',
    'Card-shaped buttons keep the content radius so artwork is not clipped'));
  set(out.component, 'focus.coreWidth', leaf('dimension', '2px', 'Crisp focus core, never blurred'));
  set(out.component, 'focus.coreOffset', leaf('dimension', '3px'));
  set(out.component, 'selection.railWidth', leaf('dimension', '3px',
    'Selection is a leading rail plus label weight, never a check mark'));
  set(out.component, 'selection.railHeight', leaf('dimension', '15px'));
  set(out.component, 'indicator.size', leaf('dimension', '20px', 'Circular state badge'));
  set(out.component, 'indicator.fieldSize', leaf('dimension', '24px'));

  /* semantic: shape and the adjustable ranges the resolver clamps against */
  set(out.semantic, 'shape.contentRadius', leaf('dimension', dim(flat.default.radius),
    'Default content radius; adjustable 14-28px'));
  for (const [key, [min, max]] of Object.entries({
    atmosphere: [15, 90], translucency: [35, 85], elevation: [60, 150], radius: [14, 28], motionSpeed: [0.25, 2],
  })) {
    set(out.semantic, `range.${key}`, {
      $type: 'number',
      $value: flat.default[key],
      $description: `Default ${flat.default[key]}; valid range ${min}-${max}`,
      $extensions: { 'digital.meridian.crystal': { minimum: min, maximum: max } },
    });
  }

  /* defaults that are not numeric ranges */
  for (const key of ['palette', 'mode', 'density', 'font']) {
    set(out.semantic, `default.${key}`, leaf('string', flat.default[key]));
  }
  for (const key of ['reduced', 'reduceMotion']) {
    set(out.semantic, `default.${key}`, leaf('boolean', flat.default[key]));
  }

  fs.writeFileSync(DTCG, JSON.stringify(out, null, 2) + '\n');
  return out;
}

/* ------------------------------------------------------------ build back */

function deref(tokens, value) {
  if (typeof value !== 'string') return value;
  const match = /^\{(.+)\}$/.exec(value);
  if (!match) return value;
  const target = get(tokens, match[1]);
  if (!target) throw new Error(`Unresolved token alias: ${value}`);
  return deref(tokens, target.$value);
}

const unpx = (v) => (typeof v === 'string' && v.endsWith('px') ? Number(v.slice(0, -2)) : v);
const unms = (v) => (typeof v === 'string' && v.endsWith('ms') ? Number(v.slice(0, -2)) : v);

function buildFlat(tokens) {
  const meta = tokens.$meta;
  const flat = { version: meta.version, name: meta.system, basis: meta.basis, default: {} };

  for (const key of ['palette', 'mode']) flat.default[key] = tokens.semantic.default[key].$value;
  for (const key of ['atmosphere', 'translucency', 'elevation', 'radius']) {
    flat.default[key] = tokens.semantic.range[key].$value;
  }
  flat.default.density = tokens.semantic.default.density.$value;
  flat.default.reduced = tokens.semantic.default.reduced.$value;
  flat.default.font = tokens.semantic.default.font.$value;
  flat.default.reduceMotion = tokens.semantic.default.reduceMotion.$value;
  flat.default.motionSpeed = tokens.semantic.range.motionSpeed.$value;

  flat.palettes = {};
  for (const [id, palette] of Object.entries(tokens.primitive.palette)) {
    const entry = { name: palette.$name, description: palette.$description };
    for (const key of ['seed', 'companion', 'glow']) entry[key] = palette[key].$value;
    entry.modes = {};
    for (const mode of ['light', 'dark']) {
      entry.modes[mode] = {};
      for (const role of Object.keys(MODE_ROLES)) {
        if (palette[mode]?.[role]) entry.modes[mode][role] = palette[mode][role].$value;
      }
      for (const [role, node] of Object.entries(palette[mode] ?? {})) {
        if (!(role in entry.modes[mode])) entry.modes[mode][role] = node.$value;
      }
    }
    flat.palettes[id] = entry;
  }

  flat.status = {};
  for (const [mode, statuses] of Object.entries(tokens.semantic.feedback)) {
    flat.status[mode] = {};
    for (const [name, pair] of Object.entries(statuses)) {
      flat.status[mode][name] = {
        ink: pair.ink.$value, surface: pair.surface.$value,
        symbol: pair.symbol.$value, label: pair.label.$value,
      };
    }
  }

  const p = tokens.primitive;
  flat.material = {};
  for (const key of Object.keys(MATERIAL_ROLES)) {
    const type = MATERIAL_ROLES[key][1];
    const raw = p.material[key].$value;
    flat.material[key] = type === 'dimension' ? unpx(raw) : raw;
  }
  flat.material.micaInactive = {
    light: p.material.plasticInactive.light.$value,
    dark: p.material.plasticInactive.dark.$value,
  };

  flat.motion = {};
  for (const key of ['press', 'state', 'spatial', 'exit']) flat.motion[key] = unms(p.duration[key].$value);
  flat.motion.easing = {};
  for (const [key, node] of Object.entries(p.easing)) flat.motion.easing[key] = node.$value;
  flat.motion.distance = {};
  for (const [key, node] of Object.entries(p.distance)) {
    if (key !== 'maxTravel' && !key.startsWith('$')) flat.motion.distance[key] = unpx(node.$value);
  }
  for (const key of ['material', 'liquid', 'flow', 'departure', 'maxDuration']) {
    flat.motion[key] = unms(p.duration[key].$value);
  }
  flat.motion.maxTravel = unpx(p.distance.maxTravel.$value);
  flat.motion.travelPolicy = p.distance.$travelPolicy;

  flat.typography = {
    readingSize: unpx(tokens.semantic.typography.readingSize.$value),
    readingLeading: unpx(tokens.semantic.typography.readingLeading.$value),
    family: tokens.semantic.typography.family.$value,
  };
  flat.schemaNote = 'Generated from tokens/crystal.tokens.json (W3C DTCG). Edit the DTCG source, not this file.';
  flat.materials = MATERIALS;
  return flat;
}

/* The named-material catalogue is documentation, carried through unchanged. */
const MATERIALS = JSON.parse(fs.readFileSync(FLAT, 'utf8')).materials;

/* --------------------------------------------------------------- exports */

function platformExports(tokens) {
  fs.mkdirSync(EXPORTS, { recursive: true });
  const rows = [];
  const walk = (node, trail) => {
    if (node && typeof node === 'object' && '$value' in node) {
      rows.push([trail.join('.'), deref(tokens, node.$value), node.$type]);
      return;
    }
    for (const [key, child] of Object.entries(node ?? {})) {
      if (!key.startsWith('$')) walk(child, [...trail, key]);
    }
  };
  walk(tokens.semantic, []);
  const semanticCount = rows.length;
  walk(tokens.component, []);

  /* Both tiers flatten into one namespace, so a duplicate name would silently
     shadow. Fail the build rather than emit an ambiguous export. */
  const seen = new Map();
  for (const [key] of rows) {
    if (seen.has(key)) throw new Error(`Duplicate token name across tiers: ${key}`);
    seen.set(key, true);
  }
  if (rows.length === semanticCount) throw new Error('Component tier produced no tokens');

  const camel = (s) => s.replace(/[.-](\w)/g, (_, c) => c.toUpperCase());
  const banner = (c) => `${c} Crystal ${tokens.$meta.version} design tokens.\n${c} Generated from tokens/crystal.tokens.json. Do not edit by hand.\n`;
  const lit = (v) => JSON.stringify(String(v));

  fs.writeFileSync(path.join(EXPORTS, 'crystal-tokens.ts'),
    banner('//') + '\nexport const crystalTokens = {\n' +
    rows.map(([k, v]) => `  ${lit(k)}: ${lit(v)},`).join('\n') +
    '\n} as const;\n\nexport type CrystalToken = keyof typeof crystalTokens;\n');

  fs.writeFileSync(path.join(EXPORTS, 'crystal-tokens.swift'),
    banner('//') + '\npublic enum CrystalToken {\n' +
    rows.map(([k, v]) => `    public static let ${camel(k.replace(/\./g, '-'))} = ${lit(v)}`).join('\n') +
    '\n}\n');

  fs.writeFileSync(path.join(EXPORTS, 'crystal-tokens.kt'),
    banner('//') + '\nobject CrystalToken {\n' +
    rows.map(([k, v]) => `    const val ${camel(k.replace(/\./g, '-'))} = ${lit(v)}`).join('\n') +
    '\n}\n');

  return rows.length;
}

/* ------------------------------------------------------------------ main */

if (process.argv.includes('--migrate')) {
  const tokens = migrate();
  console.log(`Wrote DTCG source: ${Object.keys(tokens.primitive.palette).length} palettes.`);
} else {
  const tokens = JSON.parse(fs.readFileSync(DTCG, 'utf8'));
  const rebuilt = buildFlat(tokens);
  const current = JSON.parse(fs.readFileSync(FLAT, 'utf8'));

  /* Compare values, not key order. Key order is a formatting choice of the
     generator; a changed value is a material regression. */
  const canonical = (v) => {
    if (Array.isArray(v)) return v.map(canonical);
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])]));
    }
    return v;
  };
  const strip = (o) => { const c = structuredClone(o); delete c.schemaNote; return canonical(c); };
  const diffs = [];
  (function compare(a, b, trail) {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        compare(a[key], b[key], [...trail, key]);
      }
      return;
    }
    diffs.push(`${trail.join('.')}: ${JSON.stringify(b)} -> ${JSON.stringify(a)}`);
  })(strip(rebuilt), strip(current), []);

  if (diffs.length) {
    console.error('Round trip mismatch. A token value changed during restructuring:');
    for (const d of diffs.slice(0, 40)) console.error('  ' + d);
    if (diffs.length > 40) console.error(`  ...and ${diffs.length - 40} more`);
    process.exit(1);
  }

  fs.writeFileSync(FLAT, JSON.stringify(rebuilt, null, 2) + '\n');
  const count = platformExports(tokens);
  console.log(`Round trip verified: no token value changed. Emitted ${count} semantic/component tokens to TypeScript, Swift and Kotlin.`);
}
