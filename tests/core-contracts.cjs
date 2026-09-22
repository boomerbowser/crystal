/* Contract tests for the Crystal headless core.
 *
 * These encode decisions, not implementation details. If one fails, a rule the
 * design system promises has changed — check the specification before the code.
 */
const assert = require('node:assert/strict');
const state = require('../core/assets/core/state.js');
const preferences = require('../core/assets/core/preferences.js');

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, status: 'pass' });
  } catch (error) {
    results.push({ name, status: 'fail', detail: error.message });
  }
}

/* ---------------------------------------------------------- indicators */

check('a check mark is never an indicator state', () => {
  assert.ok(!state.INDICATOR_ORDER.includes('check'));
  const every = [
    state.resolveIndicator({ pressed: true }),
    state.resolveIndicator({ selected: true }),
    state.resolveIndicator({ checked: true }),
    state.resolveIndicator({ current: 'page' }),
    state.resolveIndicator({ busy: true }),
  ];
  assert.ok(every.every((v) => v !== 'check'));
});

check('pressed, selected and checked all resolve to the selection kind', () => {
  assert.equal(state.resolveIndicator({ pressed: true }), 'selection');
  assert.equal(state.resolveIndicator({ selected: true }), 'selection');
  assert.equal(state.resolveIndicator({ checked: true }), 'selection');
});

check('activity outranks current location', () => {
  assert.equal(state.resolveIndicator({ busy: true, current: 'page' }), 'busy');
});

check('current location outranks selection', () => {
  assert.equal(state.resolveIndicator({ current: 'page', pressed: true }), 'current');
});

check('aria-current="false" is not a current location', () => {
  assert.equal(state.resolveIndicator({ current: 'false' }), null);
  assert.equal(state.resolveIndicator({ current: false }), null);
});

check('an unset control shows no indicator', () => {
  assert.equal(state.resolveIndicator({}), null);
  assert.equal(state.resolveIndicator(), null);
  assert.equal(state.resolveIndicator({ pressed: false }), null);
});

/* -------------------------------------------------------------- fields */

check('invalid outranks required and focused', () => {
  assert.equal(state.resolveFieldState({ invalid: true, required: true, focused: true }), 'invalid');
});

check('required outranks focused', () => {
  assert.equal(state.resolveFieldState({ required: true, focused: true }), 'required');
});

check('an untouched field is idle', () => {
  assert.equal(state.resolveFieldState({}), 'idle');
});

/* -------------------------------------------------------------- ranges */

check('range progress clamps outside its bounds', () => {
  assert.equal(state.rangeProgress({ value: 999, min: 0, max: 100 }), 100);
  assert.equal(state.rangeProgress({ value: -999, min: 0, max: 100 }), 0);
});

check('a zero-width range does not divide by zero', () => {
  assert.equal(state.rangeProgress({ value: 5, min: 5, max: 5 }), 0);
});

check('range progress handles a non-zero minimum', () => {
  assert.equal(state.rangeProgress({ value: 28, min: 14, max: 28 }), 100);
  assert.equal(state.rangeProgress({ value: 21, min: 14, max: 28 }), 50);
});

/* --------------------------------------------------------- preferences */

const DEFAULTS = {
  atmosphere: 90, translucency: 35, elevation: 125, radius: 28,
  motionSpeed: 1, mode: 'light', density: 'comfortable', font: 'manrope',
  reduced: false, reduceMotion: false,
};

check('every documented range clamps at both ends', () => {
  for (const [key, [min, max]] of Object.entries(preferences.RANGES)) {
    const low = preferences.normalisePreferences({ [key]: min - 1000 }, DEFAULTS);
    const high = preferences.normalisePreferences({ [key]: max + 1000 }, DEFAULTS);
    assert.equal(low[key], min, `${key} should clamp to ${min}`);
    assert.equal(high[key], max, `${key} should clamp to ${max}`);
  }
});

check('an unknown choice is rejected rather than accepted', () => {
  const result = preferences.normalisePreferences({ mode: 'sepia', density: 'roomy' }, DEFAULTS);
  assert.equal(result.mode, 'light');
  assert.equal(result.density, 'comfortable');
});

check('reduced motion resolves every duration to zero', () => {
  assert.equal(preferences.resolveDuration(1400, 1, true), 0);
  assert.equal(preferences.resolveDuration(120, 2, true), 0);
});

check('the duration ceiling holds at the slowest playback', () => {
  // The liquid recipe at 0.25x would be 5600ms; the contract caps it.
  assert.equal(preferences.resolveDuration(1400, 0.25, false), preferences.DURATION_CEILING);
});

check('ordinary durations scale with the speed preference', () => {
  assert.equal(preferences.resolveDuration(120, 2, false), 60);
  assert.equal(preferences.resolveDuration(120, 0.5, false), 240);
});

check('a missing or invalid speed falls back to 1x', () => {
  assert.equal(preferences.resolveDuration(120, undefined, false), 120);
  assert.equal(preferences.resolveDuration(120, 0, false), 120);
  assert.equal(preferences.resolveDuration(120, 'fast', false), 120);
});

/* ------------------------------------------------------------- springs */

const spring = require('../core/assets/core/spring.js');

check('a critically damped spring does not overshoot', () => {
  const critical = { stiffness: 180, damping: 2 * Math.sqrt(180), mass: 1 };
  assert.equal(spring.peakOvershoot(critical), 0);
  assert.equal(spring.overshoots(critical), false);
  assert.equal(spring.dampingRatio(critical).toFixed(6), '1.000000');
});

check('an underdamped spring overshoots, which is what reads as momentum', () => {
  const loose = { stiffness: 180, damping: 12, mass: 1 };
  assert.ok(spring.overshoots(loose));
  assert.ok(spring.peakOvershoot(loose) > 0.1);
});

check('critical damping is not NaN', () => {
  // The underdamped solution divides by omega*sqrt(1-zeta^2), which is zero
  // here. A single-formula implementation returns NaN at exactly the value a
  // designer is most likely to choose.
  const critical = { stiffness: 180, damping: 2 * Math.sqrt(180), mass: 1 };
  for (const t of [0, 0.05, 0.2, 1]) {
    assert.ok(Number.isFinite(spring.sampleSpring(critical, t)), `NaN at t=${t}`);
  }
});

check('a spring starts at rest and arrives at its target', () => {
  const s = { stiffness: 180, damping: 22, mass: 1 };
  assert.equal(spring.sampleSpring(s, 0), 0);
  assert.ok(Math.abs(1 - spring.sampleSpring(s, 5)) < 0.001);
});

check('a softer spring takes longer to settle', () => {
  const stiff = spring.settleTime({ stiffness: 400, damping: 30, mass: 1 });
  const soft = spring.settleTime({ stiffness: 60, damping: 14, mass: 1 });
  assert.ok(soft > stiff, `${soft} should exceed ${stiff}`);
});

check('a heavier mass takes longer to settle', () => {
  const light = spring.settleTime({ stiffness: 180, damping: 22, mass: 1 });
  const heavy = spring.settleTime({ stiffness: 180, damping: 22, mass: 3 });
  assert.ok(heavy > light, `${heavy} should exceed ${light}`);
});

check('settle time is bounded by the motion ceiling', () => {
  // A barely-moving spring must still terminate.
  assert.ok(spring.settleTime({ stiffness: 0.01, damping: 0.001, mass: 50 }) <= spring.MAX_SETTLE_MS);
});

check('an invalid spring falls back rather than producing NaN', () => {
  for (const bad of [undefined, {}, { stiffness: 0 }, { stiffness: -5, mass: 0 }, { mass: 'heavy' }]) {
    assert.ok(Number.isFinite(spring.settleTime(bad)), `NaN for ${JSON.stringify(bad)}`);
  }
});

check('the platform mapping round-trips the damping ratio', () => {
  const s = { stiffness: 180, damping: 22, mass: 1 };
  const platform = spring.toPlatform(s);
  assert.equal(platform.compose.dampingRatio, platform.swiftUI.dampingFraction);
  assert.ok(Math.abs(platform.compose.dampingRatio - spring.dampingRatio(s)) < 1e-4);
});

/* ------------------------------------------------- scrollbar mechanisms */

/* Crystal draws its two scrollbars through two mechanisms, and exactly one of
   them may reach any given browser. Chromium 121 and later ignore every
   `::-webkit-scrollbar` pseudo-element on a container whose `scrollbar-width` or
   `scrollbar-color` is not `auto` — which is every container Crystal styles. A
   webkit rule written outside the `@supports not (scrollbar-color:auto)` guard
   is therefore dead in the browser most people use and live in the one they do
   not, which is one specification rendering two ways.

   This is a source check because it cannot be a runtime one: a branch that did
   not apply leaves nothing in the computed style to look at. */
check('every webkit scrollbar rule sits behind the legacy guard', () => {
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../core/assets/crystal.css'), 'utf8');
  /* Comments name the pseudo-element in order to explain it. Blanked rather than
     deleted so the offsets below still point at the real line. */
  const css = source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
  const guard = css.indexOf('@supports not (scrollbar-color:auto){');
  assert.ok(guard !== -1, 'the legacy guard is missing entirely');

  /* Where the guarded block ends: the first line that closes it at column zero. */
  const end = css.indexOf('\n}\n', guard);
  assert.ok(end > guard, 'the legacy guard is not closed');

  const stray = [];
  for (const match of css.matchAll(/::-webkit-scrollbar/g)) {
    if (match.index < guard || match.index > end) {
      stray.push(css.slice(css.lastIndexOf('\n', match.index) + 1, css.indexOf('\n', match.index)).trim());
    }
  }
  assert.deepEqual(stray, [], 'webkit scrollbar rules outside the guard');
});

/* Crystal's focus is a crisp core inside a feathered halo, and it has to reach
   anything that can take focus — not only the native controls. A scroll area that
   holds nothing focusable becomes a tab stop so its content is reachable by
   keyboard, and before this it received the browser's default ring instead of
   Crystal's, on the one component whose whole reason for being focusable is
   accessibility. */
check('the focus halo reaches anything focusable, not only native controls', () => {
  const css = require('node:fs').readFileSync(require('node:path').join(__dirname, '../core/assets/crystal.css'), 'utf8');
  for (const rule of css.match(/[^{}]*:focus-visible[^{}]*\{[^}]*\}/g) ?? []) {
    if (!/outline:[^;]*var\(--cr-focus-core/.test(rule)) continue;
    assert.match(rule, /\[tabindex\]:focus-visible/,
      'the focus rule does not reach [tabindex]');
    return;
  }
  assert.fail('no focus rule found to check');
});



/* ------------------------------------------------------------- the halo */

/* The focus recipe, held to exactly what Meridian approved.
 *
 * D-11 recorded that this file "compares the exported halo against the rendered
 * one, layer by layer, blur and spread". It did not. That check went to
 * `crystal-preview/tests/site-contracts.cjs` with the site it photographs, and
 * the entry was never corrected — so for a day the tracker named a gate in this
 * repository that was not here. This is that gate, and it is written now
 * because the two divergences it would have had to stay silent about are
 * decided: the library carries the elevation layers and the dark-mode lift.
 *
 * Geometry *and* alpha, all six layers, both modes. The earlier check compared
 * geometry only and the first four layers only, deliberately, so that running it
 * could not freeze an undecided divergence into a gate. That reason has expired.
 */
const FOCUS = {
  halo: [[6, 1], [16, 3], [30, 6], [54, 11]],
  lift: [[8, 18], [22, 40]],
  alpha: { light: [46, 30, 17, 8], dark: [56, 38, 22, 11] },
  shadow: 27,
};

function focusBlocks() {
  const css = require('node:fs').readFileSync(
    require('node:path').join(__dirname, '../core/assets/crystal-theme.css'), 'utf8');
  /* The theme writes a light block and a dark one. Split on the ring so each
     block's feathers are read beside the ring that references them, rather than
     both resolving to the first definition in the file — which would have made
     the dark-mode alphas untestable in exactly the way that let them diverge. */
  const blocks = [];
  const re = /--cr-focus-ring:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(css))) {
    const before = css.slice(0, m.index);
    const start = before.lastIndexOf('{');
    /* The selector — and any `@media` wrapping it, which lands in the same
       slice — so the mode is read from what the block is *for* rather than
       inferred from the alphas it contains. Inferring from the alphas made a
       reverted dark value report itself as a wrong *light* block: a correct
       failure with a misleading name, and a misleading name on a gate is how
       the next person looks in the wrong file.

       Comments are stripped first. Without that, the file's own header — which
       says `Set data-crystal-mode="light" or "dark"` — falls inside the first
       block's slice and classifies `:root` as dark. */
    const head = before
      .slice(before.lastIndexOf('}', start) + 1, start)
      .replace(/\/\*[\s\S]*?\*\//g, '');
    blocks.push({
      ring: m[1].trim(),
      scope: css.slice(start, m.index),
      mode: /dark/.test(head) ? 'dark' : 'light',
    });
  }
  return blocks;
}

check('the focus ring is six layers with the approved geometry, in every mode', () => {
  const blocks = focusBlocks();
  assert.ok(blocks.length >= 2, `expected a light and a dark focus ring, found ${blocks.length}`);
  for (const { ring } of blocks) {
    const layers = ring.split(/,(?![^(]*\))/).map((l) => l.trim());
    assert.equal(layers.length, 6, `expected six focus layers, read ${layers.length}: ${ring}`);
    FOCUS.halo.forEach(([blur, spread], i) => {
      assert.match(layers[i], new RegExp(`^0\\s+0\\s+${blur}px\\s+${spread}px\\b`),
        `halo layer ${i + 1} should be 0 0 ${blur}px ${spread}px, read "${layers[i]}"`);
    });
    FOCUS.lift.forEach(([offset, blur], i) => {
      assert.match(layers[4 + i], new RegExp(`^0\\s+${offset}px\\s+${blur}px\\b`),
        `elevation layer ${i + 1} should be 0 ${offset}px ${blur}px, read "${layers[4 + i]}"`);
    });
  }
});

check('the feather alphas lift in dark mode and hold in light', () => {
  const seen = new Set();
  for (const { scope, mode } of focusBlocks()) {
    const alphas = [1, 2, 3, 4].map((n) => {
      const m = new RegExp(`--cr-focus-feather-${n}:\\s*rgba?\\([^)]*?([\\d.]+)\\s*\\)`).exec(scope);
      assert.ok(m, `no --cr-focus-feather-${n} beside this ring`);
      return Math.round(Number(m[1]) * 100);
    });
    assert.deepEqual(alphas, FOCUS.alpha[mode],
      `${mode} feather alphas should be ${FOCUS.alpha[mode].join('/')}, read ${alphas.join('/')}`);
    const shadow = /--cr-focus-shadow:\s*rgba?\([^)]*?([\d.]+)\s*\)/.exec(scope);
    assert.ok(shadow, 'no --cr-focus-shadow beside this ring');
    assert.equal(Math.round(Number(shadow[1]) * 100), FOCUS.shadow,
      `--cr-focus-shadow should be ${FOCUS.shadow}% of the decorative colour`);
    seen.add(mode);
  }
  assert.deepEqual([...seen].sort(), ['dark', 'light'],
    `expected both modes to be checked, saw ${[...seen].join(', ') || 'none'}`);
});

/* A consumer that loads `crystal.css` and not the generated theme still gets a
   focus ring, out of the `var(--cr-focus-ring, …)` fallback. It shipped the
   withdrawn spreads 2/6/12/22 for as long as D-11 was open *and one day after it
   was closed*, because the fix went into the resolver and nobody looked at the
   stylesheet. Same geometry or it is a second recipe. */
check('the stylesheet fallback is the same recipe as the exported theme', () => {
  const css = require('node:fs').readFileSync(
    require('node:path').join(__dirname, '../core/assets/crystal.css'), 'utf8');
  const m = /box-shadow:\s*var\(--cr-focus-ring,([\s\S]*?)\)\}/.exec(css);
  assert.ok(m, 'no --cr-focus-ring fallback in crystal.css');
  const geometry = [...m[1].matchAll(/0\s+(\d+px|0)\s+(\d+px)(?:\s+(\d+px))?/g)]
    .map((g) => [g[1], g[2], g[3]].filter(Boolean).join(' '));
  const want = [
    ...FOCUS.halo.map(([blur, spread]) => `0 ${blur}px ${spread}px`),
    ...FOCUS.lift.map(([offset, blur]) => `${offset}px ${blur}px`),
  ];
  assert.deepEqual(geometry, want,
    'the fallback in crystal.css is not the recipe the theme exports');
});

/* ------------------------------------------------- tokens vs stylesheet */

/* `crystal.css` is hand-authored; `crystal.tokens.json` is the source of truth.
   Nothing compared them, and for as long as nothing did, the stylesheet said a
   button is padded `10px 19px` while the tokens, the reference table, the
   preview site and crystal-react all said `15px 24px`. The binding is not
   systematic — a hand-authored sheet has no generated link to the token file —
   so the pairs are listed by hand, and a listed pair that cannot be found in
   the stylesheet fails rather than passing quietly. */
const TOKEN_BOUND = [
  { token: 'component.action.paddingBlock', rule: '.cr-button', prop: 'padding', part: 0 },
  { token: 'component.action.paddingInline', rule: '.cr-button', prop: 'padding', part: 1 },
  { token: 'component.action.radius', rule: '.cr-button', prop: 'border-radius' },
  { token: 'component.action.minTarget', rule: '.cr-button', prop: 'min-height' },
  { token: 'component.action.gap', rule: '.cr-button', prop: 'gap' },
];

check('the stylesheet honours the token values it is bound to', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const tokens = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../core/tokens/crystal.tokens.json'), 'utf8'));
  const css = fs.readFileSync(
    path.join(__dirname, '../core/assets/crystal.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const value = (dotted) => dotted.split('.').reduce((node, key) => {
    assert.ok(node && node[key], `no such token: ${dotted}`);
    return node[key];
  }, tokens).$value;

  for (const bound of TOKEN_BOUND) {
    /* The declaration as the reset layer writes it: `.cr-button{…}` exactly,
       not `.cr-button.danger` and not `.cr-dock .cr-button`. */
    const rule = new RegExp(`(?:^|[},])\\s*${bound.rule.replace('.', '\\.')}\\s*\\{([^{}]*)\\}`)
      .exec(css);
    assert.ok(rule, `${bound.rule} has no rule of its own in crystal.css`);
    const decl = new RegExp(`(?:^|;)\\s*${bound.prop}\\s*:([^;]*)`).exec(rule[1]);
    assert.ok(decl, `${bound.rule} does not set ${bound.prop}`);
    const parts = decl[1].trim().split(/\s+/);
    const actual = bound.part === undefined ? parts[0] : parts[bound.part];
    assert.equal(actual, value(bound.token),
      `${bound.rule} { ${bound.prop} } is ${actual}, but ${bound.token} is ${value(bound.token)}`);
  }
});

/* The button vocabulary: what is tinted, what is not, and what no longer exists.
 *
 * Three separate failures live here, and each has happened.
 *
 * The tint is *opt-in*. It used to be `:not(.secondary):not(.quiet):not(.danger)`
 * — a rule that had to enumerate every variant it was not meant to paint, and was
 * one forgotten modifier away from tinting the whole surface. Seventy-two
 * secondary buttons on the preview alone depended on that list being complete.
 *
 * `.secondary` is withdrawn. It named a second action colour and Crystal has no
 * such role: the palettes publish one action pair, and the companion and glow
 * hues are expressive paint that `docs/colors.md` says is never assumed to be
 * text-safe. A class that survives its own deletion in one file and not another
 * is how a withdrawn variant comes back.
 *
 * And a quiet button has no reading fill at all — a suppressed pseudo-element,
 * invisible in a diff of the rules that create it, because the base control rule
 * paints a `::before` on every button and one line stops it.
 */
check('the button vocabulary is primary, quiet, danger — and not secondary', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const css = fs.readFileSync(
    path.join(__dirname, '../core/assets/crystal.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  /* Every rule whose selector names `.cr-button`, in document order. */
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, selector, body]) => ({ selector: selector.trim(), body }))
    .filter(({ selector }) => /\.cr-button\b/.test(selector) && !selector.startsWith('@'));

  /* Withdrawn, and the comments that explain the withdrawal were stripped above,
     so a match here is a live rule rather than a mention of one. */
  const secondary = rules.find(({ selector }) => /\.secondary\b/.test(selector));
  assert.ok(!secondary,
    `${secondary?.selector} still exists; .secondary names an action colour Crystal does not define`);

  const fill = rules.filter(({ selector, body }) => /\.cr-button\.primary::before/.test(selector)
    && /background\s*:\s*var\(--cr-primary\)/.test(body));
  assert.equal(fill.length, 1,
    `expected exactly one rule painting the primary button's Haze fill in the primary colour, found ${fill.length}`);

  const ink = rules.filter(({ selector, body }) => /\.cr-button\.primary$/.test(selector)
    && /color\s*:\s*var\(--cr-on-primary\)/.test(body));
  assert.equal(ink.length, 1,
    `expected exactly one rule giving the primary button the tested ink for that fill, found ${ink.length}`);

  /* Opt-in. A tint that applies to anything *other* than `.primary` is the
     enumerate-the-exceptions shape coming back. */
  for (const { selector, body } of rules) {
    if (!/background\s*:\s*var\(--cr-primary\)/.test(body)) continue;
    assert.ok(/\.cr-button\.primary\b/.test(selector),
      `${selector} paints a button in the primary colour without asking for .primary`);
  }

  const quiet = rules.find(({ selector, body }) => /\.cr-button\.quiet::before/.test(selector)
    && /display\s*:\s*none/.test(body));
  assert.ok(quiet, 'a quiet button still paints the Haze reading fill every control gets');

  /* And the accident all of this replaced: nothing may put the solid primary
     back on the element, where it shows only as the ring of background left
     exposed around the inset fill. */
  const ring = rules.find(({ selector, body }) => /^\.cr-button(\.[a-z-]+)?$/.test(selector)
    && /background\s*:\s*var\(--cr-primary\)/.test(body));
  assert.ok(!ring, `${ring?.selector} paints the element in the solid primary again`);
});


/* -------------------------------------------------------------- report */

const failures = results.filter((r) => r.status === 'fail');
console.log(JSON.stringify({
  suite: 'headless core contracts',
  checks: results.length,
  failures: failures.map((f) => ({ name: f.name, detail: f.detail })),
}, null, 2));
if (failures.length) process.exit(1);
