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

  /* semantic: the type scale.
     Crystal specified a reading rhythm — Manrope at 16/24 — and no scale, so the
     React library derived six steps of its own. Six ratios living in one platform
     library is a type scale the other platforms cannot see, which is CONTRACT §1
     again: the derivation belongs here, where every platform reads it.

     Ratios rather than sizes, because the derivation is the design decision. Each
     step is a multiple of the reading size, so moving `typography.readingSize`
     moves the whole scale instead of leaving six literals behind. The scale is
     deliberately modest: Crystal's hierarchy is carried by weight and material as
     much as by size, and a dramatic scale fights that.

     Leading tightens as size grows — large text needs proportionally less to read
     as a block rather than a list of lines — and tracking tightens with it,
     because default tracking reads loose at display sizes. */
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
     Neither existed as a token, and the layout tier cannot be built without
     both — the catalogue makes "the spacing scale" and "breakpoint behaviour"
     Crystal's obligation for every layout component, and a library with no
     token to read has to write the numbers itself, which is CONTRACT §1's
     definition of drift.

     These are not new design decisions. They are the values the preview's own
     shell already uses, named so something other than the preview can reach
     them: the spacing scale is the 4px rhythm the catalogue names, tied at two
     points to the reading rhythm so it is not an arbitrary ladder — `md` is the
     16px reading size and `lg` is the 24px leading, which makes a `lg` gap
     exactly one blank line between blocks. The breakpoints are where the shell
     already changes: 600, 850, 1150 and 1500. */
  for (const [step, value] of [['2xs', 4], ['xs', 8], ['sm', 12], ['md', 16], ['lg', 24], ['xl', 32], ['2xl', 48]]) {
    set(out.semantic, `spacing.${step}`, leaf('dimension', dim(value), `Spacing step ${step}`));
  }
  for (const [name, value] of [['sm', 600], ['md', 850], ['lg', 1150], ['xl', 1500]]) {
    set(out.semantic, `breakpoint.${name}`, leaf('dimension', dim(value),
      `Viewport width at which the ${name} layout begins`));
  }

  /* The material vocabulary was renamed Mica -> Plastic, Acrylic -> Frost and
     Glass -> Resin. Both names still ship so existing adopters keep working;
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
  /* The geometry of an action control, stated once. These were literals inside
     controls.css and inside every library that reimplemented a button; a value
     used by every action in the system is a token by definition. */
  set(out.component, 'action.paddingBlock', leaf('dimension', '15px', 'Action control block padding'));
  set(out.component, 'action.paddingInline', leaf('dimension', '24px', 'Action control inline padding'));
  set(out.component, 'action.gap', leaf('dimension', '9px', 'Gap between an action\'s icon and its label'));
  set(out.component, 'action.disabledOpacity', leaf('number', 0.55, 'Opacity of a disabled control'));

  /* Scrollbars are a Crystal surface, not browser furniture. Two of them: a Frost
     scrollbar for panels and long reading surfaces, and a Resin one for floating
     control planes and compact scrollers, so a scrollbar belongs to the material
     it scrolls rather than to the operating system. */
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
  /* Icon sizes. `size` is what Crystal's own stylesheet has always drawn an icon
     at; `action` is the larger one the catalogue specifies inside an icon button,
     where the icon is the only content and carries the whole meaning. Both were
     literals — one in the reset, one in prose — which is a size no platform
     library could read. */
  set(out.component, 'icon.size', leaf('dimension', '20px', 'An icon in running content or beside a label'));
  set(out.component, 'icon.action', leaf('dimension', '24px', 'The single icon inside an icon button'));
  /* The choice and range controls. Every one of these figures was already in the
     catalogue as prose — "26px box, 9px radius", "44x28px track", "8px track,
     26px thumb" — which is a specification no platform library can read. A value
     stated in a sentence and implemented from memory is the drift CONTRACT §1
     describes, and it is worse than an untokenised value because it looks
     specified. */
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
     and the mismatch lands exactly where the eye is looking. Named here because
     the size and the corner are what make the join invisible, and a platform
     library guessing at them would guess differently. */
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
  /* Component-level values the runtime resolver needs. Until now the flat file
     carried only primitives and semantics, so anything set on out.component was
     invisible to assets/crystal.js — which meant a component token could be
     defined and unreachable, and the only way to use it was to write the number
     again somewhere else. */
  flat.component = {
    scrollbar: {
      width: unpx(tokens.component.scrollbar.width.$value),
      thumbMinLength: unpx(tokens.component.scrollbar.thumbMinLength.$value),
      inset: unpx(tokens.component.scrollbar.inset.$value),
    },
    scrollArea: {
      fadeDepth: unpx(tokens.component.scrollArea.fadeDepth.$value),
    },
    icon: {
      size: unpx(tokens.component.icon.size.$value),
      action: unpx(tokens.component.icon.action.$value),
    },
    choice: {
      boxSize: unpx(tokens.component.choice.boxSize.$value),
      boxRadius: unpx(tokens.component.choice.boxRadius.$value),
    },
    switch: {
      trackWidth: unpx(tokens.component.switch.trackWidth.$value),
      trackHeight: unpx(tokens.component.switch.trackHeight.$value),
    },
    slider: {
      trackHeight: unpx(tokens.component.slider.trackHeight.$value),
      thumbSize: unpx(tokens.component.slider.thumbSize.$value),
    },
    chip: { height: unpx(tokens.component.chip.height.$value) },
    overlayArrow: {
      size: unpx(tokens.component.overlayArrow.size.$value),
      radius: unpx(tokens.component.overlayArrow.radius.$value),
    },
    overlay: {
      maxWidth: unpx(tokens.component.overlay.maxWidth.$value),
      tooltipMaxWidth: unpx(tokens.component.overlay.tooltipMaxWidth.$value),
    },
    field: { wellInset: unpx(tokens.component.field.wellInset.$value) },
    layout: Object.fromEntries(Object.entries(tokens.component.layout)
      .map(([key, leafValue]) => [key, unpx(leafValue.$value)])),
  };
  /* Spacing reaches CSS as custom properties because a product writing plain CSS
     against Crystal needs the same scale the libraries compile against. It does
     not vary with palette, mode or density — `--cr-space` is the density-aware
     padding step and is a different thing. */
  flat.spacing = Object.fromEntries(Object.entries(tokens.semantic.spacing)
    .map(([key, leafValue]) => [key, unpx(leafValue.$value)]));
  flat.typography.scale = Object.fromEntries(Object.entries(tokens.semantic.typography.scale)
    .map(([step, values]) => [step, {
      ratio: values.ratio.$value,
      leading: values.leading.$value,
      tracking: values.tracking.$value,
    }]));
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
  /* Metadata, not material. The guard exists to prove that no token *value*
     changed while the file was restructured; a version string is supposed to
     change and would otherwise make every release look like a regression. The
     exemption is deliberately narrow — two named metadata keys, nothing that
     participates in a colour, size or duration. */
  const strip = (o) => {
    const c = structuredClone(o);
    delete c.schemaNote;
    delete c.version;
    return canonical(c);
  };
  /* An addition is not a regression, and the guard used to treat them alike.
     A token that is new — absent from the committed flat file, present in the
     rebuilt one — is somebody deciding to name a value; a token whose value
     *moved* is a material specification changing under everybody, which is the
     thing this gate exists to catch. A token that disappeared is the same kind of
     harm from the other direction, so it is fatal too.

     Conflating them meant every genuine addition had to get past the gate rather
     than through it, which is how a gate stops being believed. */
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

  /* Announced rather than silent. Naming a value is a design decision even when
     the number is not new, and it should be visible in the build log of the
     commit that does it. */
  if (additions.length) {
    console.log(`${additions.length} new token(s):`);
    for (const a of additions) console.log('  + ' + a);
  }

  fs.writeFileSync(FLAT, JSON.stringify(rebuilt, null, 2) + '\n');
  const count = platformExports(tokens);
  console.log(`Round trip verified: no token value changed. Emitted ${count} semantic/component tokens to TypeScript, Swift and Kotlin.`);
}
