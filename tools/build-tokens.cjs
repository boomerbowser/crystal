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
const FLAT = path.join(ROOT, 'core/tokens/crystal.json');
const DTCG = path.join(ROOT, 'core/tokens/crystal.tokens.json');
/* Inside `core/`, because these files are the package's `.` export and ship
   with it. A bare `exports/` beside the tools is outside the library, and a
   build that writes there refreshes a copy nobody installs. */
const EXPORTS = path.join(ROOT, 'core/exports');

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

/* ------------------------------------------------- the chart series scale

   Six categorical colours per palette per mode, derived rather than picked.
   Picking them would mean seventy-two hexes nobody could check, and what has
   to be true of them is a measurement: every one clears 3:1 against both
   grounds of its mode, and no two are closer than a visible step apart. An
   algorithm can be held to that and a swatch cannot.

   This is the one place the pipeline computes a colour rather than copying one.
   The inputs are tokens (`component.chart.series*`), the output is asserted in
   `tests/core-contracts.cjs`, and the round-trip guard reports every value it
   adds.

   The construction: take the palette's own seed hue, turn half a step off it,
   step six times around the hue circle, and draw all six at one OKLab lightness
   and one chroma. All six share one lightness because a categorical scale must
   not imply an order, and a ramp does. Where sRGB cannot hold the chroma at a
   hue, the chroma is reduced for that hue alone; where a hue cannot clear the
   contrast floor at that lightness, the lightness moves for that hue alone,
   because the floor is a promise to a reader and the family resemblance is a
   preference.

   A series colour is for data marks and nothing else. It is never ink, never an
   action fill, and never a secondary colour; Crystal has none, and
   `docs/colors.md` says why. */

const OKLAB_M1 = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
];
const OKLAB_M2 = [
  [0.2104542553, 0.7936177850, -0.0040720468],
  [1.9779984951, -2.4285922050, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.8086757660],
];
const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toLinear = (v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : (((v / 255) + 0.055) / 1.055) ** 2.4);
const fromLinear = (v) => {
  const s = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(s * 255)));
};
const relativeLuminance = (hex) => {
  const [r, g, b] = channels(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrastRatio = (a, b) => {
  const [lo, hi] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => x - y);
  return (hi + 0.05) / (lo + 0.05);
};
const toOklab = (hex) => {
  const [r, g, b] = channels(hex).map(toLinear);
  const cone = OKLAB_M1.map((row) => row[0] * r + row[1] * g + row[2] * b)
    .map((v) => Math.cbrt(v));
  return OKLAB_M2.map((row) => row[0] * cone[0] + row[1] * cone[1] + row[2] * cone[2]);
};
/* The inverse, returning the linear channels too so the caller can ask whether
   the colour it wanted exists in sRGB at all, instead of taking the clipped
   one. */
const fromOklab = ([L, a, b]) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
  return {
    hex: '#' + linear.map(fromLinear).map((v) => v.toString(16).padStart(2, '0')).join(''),
    inGamut: linear.every((v) => v >= -0.001 && v <= 1.001),
  };
};
const seriesHue = (hex) => {
  const [, a, b] = toOklab(hex);
  return Math.atan2(b, a);
};
/* The most chroma sRGB will hold at this lightness and hue, never more than
   asked for. Bisection, because the sRGB solid's cross section has no closed
   formula. */
const fitChroma = (L, hue, want) => {
  const at = (C) => fromOklab([L, C * Math.cos(hue), C * Math.sin(hue)]);
  if (at(want).inGamut) return want;
  let lo = 0;
  let hi = want;
  for (let i = 0; i < 30; i += 1) {
    const mid = (lo + hi) / 2;
    if (at(mid).inGamut) lo = mid;
    else hi = mid;
  }
  return lo;
};
const seriesColour = (L, hue, chroma) => fromOklab([
  L, fitChroma(L, hue, chroma) * Math.cos(hue), fitChroma(L, hue, chroma) * Math.sin(hue),
]).hex;

function chartSeries(seed, roles, mode, policy) {
  const L0 = policy.lightness[mode];
  const chroma = policy.chroma;
  const floor = policy.contrast;
  /* Toward the ground, until it clears it. In light mode a mark gets darker; in
     dark mode it gets lighter. The 0.05 margin is a rounding guard: the
     contract test compares these values at two decimal places, and a value
     that lands exactly on 3.00 makes that comparison a coin toss. */
  const step = mode === 'light' ? -0.01 : 0.01;
  const grounds = [roles.surface, roles.canvas];
  const clears = (hex) => Math.min(...grounds.map((g) => contrastRatio(hex, g)));
  const out = {};
  for (let i = 0; i < policy.count; i += 1) {
    const hue = seriesHue(seed) + (policy.offset * Math.PI) / 180 + (i * 2 * Math.PI) / policy.count;
    let L = L0;
    let hex = seriesColour(L, hue, chroma);
    for (let guard = 0; clears(hex) < floor + 0.05 && guard < 80; guard += 1) {
      L += step;
      hex = seriesColour(L, hue, chroma);
    }
    if (clears(hex) < floor) {
      throw new Error(`No lightness clears ${floor}:1 for series ${i + 1} in ${mode}`);
    }
    out[`chartSeries${i + 1}`] = hex.toUpperCase();
  }
  return out;
}

/* ------------------------------------------------ the intensity ramp

   A heatmap cell and a calendar day carry a value by how strongly they are
   painted. The catalogue puts "scale construction, contrast floor at every step"
   on Crystal's side of the line for both. A cell is a ground with the value
   written on it, so the floor that applies is the text one: the ink on each
   step has to clear 4.5:1.

   So each step ships with its ink. Five steps from a near-ground tint to a strong
   one along the palette's own seed hue, and for each the better of the mode's two
   available inks: its body text, or the ink it puts on the action colour.

   The ink is chosen per step and changes partway along in some palettes. A ramp
   that spans light to dark has to change ink somewhere; one that did not would
   be too short to read as intensity. The constraint that binds is the gap, a
   mid-lightness where neither of a mode's inks reaches 4.5:1, and the far end
   is pulled back until no step falls in it. */

function intensityRamp(seed, roles, mode, steps) {
  const hue = seriesHue(seed);
  /* The near end is a tint of the ground rather than a colour on it: a heatmap's
     lowest bucket should read as "almost nothing here". */
  const near = mode === 'light' ? 0.955 : 0.225;
  const [chromaFrom, chromaTo] = mode === 'light' ? [0.02, 0.15] : [0.03, 0.14];
  const inks = [roles.text, roles.onPrimary];
  const bestInk = (hex) => inks.reduce((a, b) => (contrastRatio(b, hex) > contrastRatio(a, hex) ? b : a));

  const build = (far) => {
    const ramp = [];
    for (let i = 0; i < steps; i += 1) {
      const t = steps === 1 ? 1 : i / (steps - 1);
      const L = near + (far - near) * t;
      ramp.push(seriesColour(L, hue, chromaFrom + (chromaTo - chromaFrom) * t).toUpperCase());
    }
    return ramp;
  };

  /* The far end is pulled back until every step has an ink that clears 4.5:1.
     A constant far end works for five palettes out of six: Harbor's body ink
     is a soft grey rather than a near-black, and a ramp that ignored that
     would be unreadable in that palette. */
  let far = mode === 'light' ? 0.66 : 0.45;
  const step = mode === 'light' ? -0.01 : 0.01;
  let ramp = build(far);
  for (let guard = 0; guard < 60 && ramp.some((hex) => contrastRatio(bestInk(hex), hex) < 4.5); guard += 1) {
    far += step;
    ramp = build(far);
  }

  const out = {};
  ramp.forEach((hex, i) => {
    const ink = bestInk(hex);
    if (contrastRatio(ink, hex) < 4.5) {
      throw new Error(`No ink clears 4.5:1 on intensity step ${i + 1} in ${mode} (${hex})`);
    }
    out[`chartHeat${i + 1}`] = hex;
    out[`chartOnHeat${i + 1}`] = ink;
  });
  return out;
}

/* Gridlines and the axis rule. The axis is a boundary and takes the palette's
   boundary colour. A gridline is a reading aid behind the data and must not
   compete with it, so it is the body ink at the opacity a hairline needs to be
   followed and not read. Both are written as rgba colours rather than as an
   opacity for a consumer to apply, because a chart draws them on whatever
   material it was put on and an alpha is the only form that survives that. */
const gridInk = (hex, alpha) => `rgba(${channels(hex).join(', ')}, ${alpha})`;

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
      generatedFrom: 'core/tokens/crystal.json',
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

  /* semantic: the type scale.
     Crystal specifies a reading rhythm (Manrope at 16/24) and derives six steps
     from it here, so every platform reads the same scale. A scale derived
     inside one platform library is invisible to the others (CONTRACT §1).

     Ratios rather than sizes, because the derivation is the design decision. Each
     step is a multiple of the reading size, so moving `typography.readingSize`
     moves the whole scale instead of leaving six literals behind. The scale is
     modest: Crystal's hierarchy is carried by weight and material as much as by
     size, and a dramatic scale fights that.

     Leading tightens as size grows, because large text needs proportionally
     less to read as a block rather than a list of lines. Tracking tightens with
     it, because default tracking reads loose at display sizes. */
  const TYPE_SCALE = {
    display: { ratio: 2, leading: 1.1, tracking: '-0.055em' },
    title: { ratio: 1.5, leading: 1.2, tracking: '-0.04em' },
    heading: { ratio: 1.25, leading: 1.3, tracking: '-0.03em' },
    subheading: { ratio: 1.0625, leading: 1.45, tracking: '-0.01em' },
    body: { ratio: 1, leading: 1.5, tracking: '0' },
    caption: { ratio: 0.8125, leading: 1.45, tracking: '0' },
  };
  for (const [step, values] of Object.entries(TYPE_SCALE)) {
    set(out.semantic, `typography.scale.${step}.ratio`, leaf('number', values.ratio,
      `${step}: multiple of the reading size`));
    set(out.semantic, `typography.scale.${step}.leading`, leaf('number', values.leading,
      `${step}: line height as a multiple of its own size`));
    set(out.semantic, `typography.scale.${step}.tracking`, leaf('dimension', values.tracking,
      `${step}: letter spacing`));
  }

  /* semantic: spacing and breakpoints.
     The catalogue makes "the spacing scale" and "breakpoint behaviour"
     Crystal's obligation for every layout component, so both are tokens. A
     library with no token to read has to write the numbers itself, which is
     CONTRACT §1's definition of drift.

     The values are the ones the preview's own shell uses, named so something
     other than the preview can reach them. The spacing scale is the 4px rhythm
     the catalogue names, tied at two points to the reading rhythm: `md` is the
     16px reading size and `lg` is the 24px leading, which makes a `lg` gap
     exactly one blank line between blocks. The breakpoints are where the shell
     changes: 600, 850, 1150 and 1500. */
  for (const [step, value] of [['2xs', 4], ['xs', 8], ['sm', 12], ['md', 16], ['lg', 24], ['xl', 32], ['2xl', 48]]) {
    set(out.semantic, `spacing.${step}`, leaf('dimension', dim(value), `Spacing step ${step}`));
  }
  for (const [name, value] of [['sm', 600], ['md', 850], ['lg', 1150], ['xl', 1500]]) {
    set(out.semantic, `breakpoint.${name}`, leaf('dimension', dim(value),
      `Viewport width at which the ${name} layout begins`));
  }

  /* The material vocabulary was renamed Mica to Plastic, Acrylic to Frost and
     Glass to Resin. Both names still ship so existing adopters keep working;
     the removal version is named here, at the moment of deprecation. */
  out.$deprecated = {
    removedIn: '3.0.0',
    reason: 'Superseded by the named material vocabulary. Two names for one concept is a documentation and tooling problem that multiplies across platform libraries.',
    tokens: {
      '--cr-acrylic-fill': '--cr-frost-fill',
      '--cr-acrylic-blur': '--cr-frost-blur',
      '--cr-acrylic-saturation': '--cr-frost-saturation',
      '--cr-glass-fill': '--cr-resin-fill',
      '--cr-glass-blur': '--cr-resin-blur',
      '--cr-glass-saturation': '--cr-resin-saturation',
      '--cr-mica-inactive': '--cr-plastic-inactive',
      '--cr-content-fill': '--cr-haze-fill',
      '--cr-content-feather': '--cr-haze-feather',
      '--cr-label-fill': '--cr-stone-fill',
    },
    classes: { '.cr-acrylic': '.cr-frost', '.cr-glass': '.cr-resin' },
  };

  /* component: bindings that libraries implement against */
  set(out.component, 'action.radius', leaf('dimension', '999px',
    'Action controls are pill-shaped, independent of the content radius'));
  set(out.component, 'action.minTarget', leaf('dimension', '44px', 'Minimum interactive target'));
  /* The geometry of an action control, stated once. A value used by every
     action in the system is a token by definition, not a literal in each
     library that implements a button. */
  set(out.component, 'action.paddingBlock', leaf('dimension', '15px', 'Action control block padding'));
  set(out.component, 'action.paddingInline', leaf('dimension', '24px', 'Action control inline padding'));
  set(out.component, 'action.gap', leaf('dimension', '9px', 'Gap between an action\'s icon and its label'));
  set(out.component, 'action.disabledOpacity', leaf('number', 0.55, 'Opacity of a disabled control'));

  /* Scrollbars are a Crystal surface. There are two: a Frost scrollbar for
     panels and long reading surfaces, and a Resin one for floating control
     planes and compact scrollers, so a scrollbar belongs to the material it
     scrolls rather than to the operating system. */
  const sb = (flat.component && flat.component.scrollbar) || { width: 10, thumbMinLength: 32, inset: 2 };
  set(out.component, 'scrollbar.width', leaf('dimension', dim(sb.width), 'Scrollbar track width'));
  set(out.component, 'scrollbar.thumbMinLength', leaf('dimension', dim(sb.thumbMinLength),
    'Shortest a thumb may become, so a very long surface stays draggable'));
  set(out.component, 'scrollbar.inset', leaf('dimension', dim(sb.inset), 'Gap between the thumb and the track edge'));
  /* The scroll area's edge fade. It is a mask rather than a painted overlay, so
     the surrounding material shows through it instead of a colour approximating
     the material. The same value is the container's scroll padding, which is what
     keeps a focused element from ever resting underneath the fade. */
  const sa = (flat.component && flat.component.scrollArea) || { fadeDepth: 24 };
  set(out.component, 'scrollArea.fadeDepth', leaf('dimension', dim(sa.fadeDepth),
    'Depth of the scroll area edge fade, and the scroll padding that keeps focus clear of it'));
  /* The container, as the preview's own shell has always drawn it: a 1536px
     ceiling with gutters that step down at the breakpoints above, and a 920px
     reading column inside it. The gutter values are the catalogue's 18/26/44. */
  set(out.component, 'layout.containerMax', leaf('dimension', '1536px', 'Widest the page shell becomes'));
  set(out.component, 'layout.readingMax', leaf('dimension', '920px',
    'Widest a column of prose becomes, so a line stays a comfortable length'));
  set(out.component, 'layout.gutterCompact', leaf('dimension', '18px', 'Shell gutter below the sm breakpoint'));
  set(out.component, 'layout.gutterBase', leaf('dimension', '26px', 'Shell gutter between the sm and lg breakpoints'));
  set(out.component, 'layout.gutterWide', leaf('dimension', '44px', 'Shell gutter at the lg breakpoint and above'));
  /* The catalogue makes "minimum cell width" Crystal's obligation for the
     auto-flowing grid, so it is a token rather than a number each library picks.
     240px is a card that still holds a short heading and a line of supporting
     text; below it the two collide. */
  set(out.component, 'layout.minCellWidth', leaf('dimension', '240px',
    'Narrowest an auto-flowing grid cell becomes before the grid drops a column'));
  set(out.component, 'layout.sidebarWidth', leaf('dimension', '280px',
    'Default width of a shell\'s supporting panel: a two-word label plus an icon at comfortable density'));
  /* Icon sizes. `size` is what Crystal's own stylesheet draws an icon at;
     `action` is the larger one the catalogue specifies inside an icon button,
     where the icon is the only content and carries the whole meaning. Both are
     tokens so that every platform library can read them. */
  set(out.component, 'icon.size', leaf('dimension', '20px', 'An icon in running content or beside a label'));
  set(out.component, 'icon.action', leaf('dimension', '24px', 'The single icon inside an icon button'));
  /* The choice and range controls. The catalogue states these figures in prose
     ("26px box, 9px radius", "44x28px track", "8px track, 26px thumb"), which
     no platform library can read. A value stated in a sentence and implemented
     from memory is the drift CONTRACT §1 describes. */
  set(out.component, 'choice.boxSize', leaf('dimension', '26px', 'A checkbox box or a radio circle'));
  set(out.component, 'choice.boxRadius', leaf('dimension', '9px', 'The checkbox box corner; a radio is a circle'));
  set(out.component, 'switch.trackWidth', leaf('dimension', '44px', 'Switch track width'));
  set(out.component, 'switch.trackHeight', leaf('dimension', '28px', 'Switch track height'));
  set(out.component, 'slider.trackHeight', leaf('dimension', '8px', 'Slider track thickness'));
  set(out.component, 'slider.thumbSize', leaf('dimension', '26px', 'Slider thumb, padded to the target floor'));
  set(out.component, 'chip.height', leaf('dimension', '32px', 'A compact chip, inside a 44px target'));
  /* The pointer that ties an overlay to its trigger. It is a rotated square
     carrying the overlay's own material rather than a filled triangle: a
     diffusing surface and a flat shape of the same nominal colour do not match,
     and the mismatch lands where the eye is looking. The size and the corner
     are what make the join invisible, so they are tokens rather than a guess
     each platform library makes. */
  set(out.component, 'overlayArrow.size', leaf('dimension', '14px',
    'The side of the rotated square that points at an overlay\'s trigger'));
  set(out.component, 'overlayArrow.radius', leaf('dimension', '3px',
    'The arrow\'s tip radius, so a pointer is not a needle'));
  /* Reading widths for anchored surfaces. A popover holds arbitrary content and
     may be as wide as a short column; a tooltip is one or two lines and is capped
     at roughly sixty characters, which is the same measure the reading column
     uses and the reason neither number is arbitrary. */
  set(out.component, 'overlay.maxWidth', leaf('dimension', '480px',
    'How wide an anchored popover may grow before it stops being anchored to anything'));
  set(out.component, 'overlay.tooltipMaxWidth', leaf('dimension', '352px',
    'About sixty characters: a tooltip longer than this is documentation'));
  /* The well inside a field shell is tighter than the shell around it, so the two
     radii nest rather than sitting concentric. */
  set(out.component, 'field.wellInset', leaf('dimension', '7px',
    'How much tighter a well\'s radius is than the shell containing it'));
  set(out.component, 'card.radius', leaf('dimension', '{semantic.shape.contentRadius}',
    'Card-shaped buttons keep the content radius so artwork is not clipped'));
  set(out.component, 'focus.coreWidth', leaf('dimension', '2px', 'Crisp focus core, never blurred'));
  set(out.component, 'focus.coreOffset', leaf('dimension', '3px'));
  set(out.component, 'indicator.size', leaf('dimension', '20px', 'Circular state badge'));
  set(out.component, 'indicator.fieldSize', leaf('dimension', '24px'));
  /* One thickness for every line that marks a thing rather than bounding it: a
     hairline edge is 1px and belongs to the surface, this is heavier because it
     is a statement about one item among several. */
  set(out.component, 'indicator.lineWidth', leaf('dimension', '3px',
    "A line that marks: a drop target's rule, a selected swatch's ring, a quotation's leading rule"));
  /* A link's underline is the non-colour signal that it is a link, so it is
     present at rest and it has to clear the descenders it runs under. An
     underline through the tail of a "g" reads as a strikethrough. */
  set(out.component, 'anchor.underlineOffset', leaf('dimension', '4px',
    'How far a link\'s underline sits below the baseline, so a descender is not struck through'));
  /* Depth, as a length. One step per level, wide enough that the guide line for
     a level is distinguishable from the one beside it at a glance and narrow
     enough that a deep tree still fits a sidebar. */
  set(out.component, 'tree.indentStep', leaf('dimension', '20px',
    'How far one level of a tree is indented from its parent'));

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
      /* Derived, and last, so a hand-authored role of the same name wins.
         Nothing authors these today; the ordering means that if one is ever
         overridden for a palette that needs it, the override is what ships. */
      const chart = tokens.component.chart;
      Object.assign(entry.modes[mode], chartSeries(palette.seed.$value, entry.modes[mode], mode, {
        count: chart.seriesCount.$value,
        lightness: { light: chart.seriesLightness.light.$value, dark: chart.seriesLightness.dark.$value },
        chroma: chart.seriesChroma.$value,
        offset: chart.seriesHueOffset.$value,
        contrast: chart.seriesContrast.$value,
      }));
      Object.assign(entry.modes[mode], intensityRamp(
        palette.seed.$value, entry.modes[mode], mode, chart.intensitySteps.$value,
      ));
      entry.modes[mode].chartAxis = entry.modes[mode].outline;
      entry.modes[mode].chartGrid = gridInk(entry.modes[mode].text, mode === 'light' ? 0.12 : 0.16);
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
  /* Every component token, projected whole.

     The round-trip guard compares the rebuilt flat file against the committed
     one, so a token the projection skipped could change or vanish with the
     build still reporting "no token value changed". The whole tier is
     projected so that the guard covers all of it.

     Aliases are dereferenced, because a flat file holding
     `{semantic.shape.contentRadius}` asks every consumer to implement alias
     resolution a second time, which is the divergence CONTRACT §1 exists to
     prevent. Dimensions become numbers, matching how the resolver reads the
     other families. */
  const projectComponent = (node) => Object.fromEntries(
    Object.entries(node)
      .filter(([key]) => !key.startsWith('$'))
      .map(([key, child]) => [
        key,
        '$value' in child ? unpx(deref(tokens, child.$value)) : projectComponent(child),
      ]));
  flat.component = projectComponent(tokens.component);
  /* Spacing reaches CSS as custom properties because a product writing plain CSS
     against Crystal needs the same scale the libraries compile against. It does
     not vary with palette, mode or density; `--cr-space` is the density-aware
     padding step and is a different thing. */
  flat.spacing = Object.fromEntries(Object.entries(tokens.semantic.spacing)
    .map(([key, leafValue]) => [key, unpx(leafValue.$value)]));
  flat.typography.scale = Object.fromEntries(Object.entries(tokens.semantic.typography.scale)
    .map(([step, values]) => [step, {
      ratio: values.ratio.$value,
      leading: values.leading.$value,
      tracking: values.tracking.$value,
    }]));
  flat.schemaNote = 'Generated from core/tokens/crystal.tokens.json (W3C DTCG). Edit the DTCG source, not this file.';
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
  const banner = (c) => `${c} Crystal ${tokens.$meta.version} design tokens.\n${c} Generated from core/tokens/crystal.tokens.json. Do not edit by hand.\n`;
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
  /* Metadata. The guard exists to prove that no token value changed while the
     file was restructured; a version string is supposed to change and would
     otherwise make every release look like a regression. The exemption is
     narrow: two named metadata keys, nothing that participates in a colour,
     size or duration. */
  const strip = (o) => {
    const c = structuredClone(o);
    delete c.schemaNote;
    delete c.version;
    return canonical(c);
  };
  /* An addition is not a regression. A token that is new (absent from the
     committed flat file, present in the rebuilt one) is somebody deciding to
     name a value. A token whose value moved is a material specification
     changing under everybody, which is what this gate exists to catch. A token
     that disappeared is the same harm from the other direction, so it is fatal
     too. Treating additions as regressions would make every genuine addition
     fail the gate. */
  const changes = [];
  const additions = [];
  (function compare(a, b, trail) {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        compare(a[key], b[key], [...trail, key]);
      }
      return;
    }
    const where = trail.join('.');
    if (b === undefined) additions.push(`${where} = ${JSON.stringify(a)}`);
    else changes.push(`${where}: ${JSON.stringify(b)} -> ${JSON.stringify(a)}`);
  })(strip(rebuilt), strip(current), []);

  if (changes.length) {
    console.error('Round trip mismatch. A token value changed or disappeared:');
    for (const d of changes.slice(0, 40)) console.error('  ' + d);
    if (changes.length > 40) console.error(`  ...and ${changes.length - 40} more`);
    process.exit(1);
  }

  /* Announced. Naming a value is a design decision even when the number is not
     new, and it should be visible in the build log of the commit that does
     it. */
  if (additions.length) {
    console.log(`${additions.length} new token(s):`);
    for (const a of additions) console.log('  + ' + a);
  }

  fs.writeFileSync(FLAT, JSON.stringify(rebuilt, null, 2) + '\n');
  const count = platformExports(tokens);
  console.log(`Round trip verified: no token value changed. Emitted ${count} semantic/component tokens to TypeScript, Swift and Kotlin.`);
}
