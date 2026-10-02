/* Contract tests for the Crystal headless core.
 *
 * These encode decisions rather than implementation details. If one fails, a
 * rule the design system promises has changed: check the specification before
 * the code.
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
   `scrollbar-color` is not `auto`, and that is every container Crystal styles.
   A webkit rule written outside the `@supports not (scrollbar-color:auto)`
   guard is therefore dead in the browser most people use and live in the ones
   they do not, so one specification renders two ways.

   This is a source check because a branch that did not apply leaves nothing in
   the computed style for a runtime check to look at. */
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
   anything that can take focus, including elements that are not native
   controls. A scroll area that holds nothing focusable becomes a tab stop so
   its content is reachable by keyboard, and it must get Crystal's ring rather
   than the browser's default. */
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
 * D-11 records that this file "compares the exported halo against the rendered
 * one, layer by layer, blur and spread". The comparison with the rendered page
 * is in `crystal-preview/tests/site-contracts.cjs`, with the site it
 * photographs; this is the library's gate.
 *
 * It checks geometry and alpha, all six layers, in both modes. That is safe
 * because both divergences between the library and the preview are decided:
 * the library carries the elevation layers and the dark-mode lift.
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
     block's feathers are read beside the ring that references them. Otherwise
     both resolve to the first definition in the file and the dark-mode alphas
     are never tested. */
  const blocks = [];
  const re = /--cr-focus-ring:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(css))) {
    const before = css.slice(0, m.index);
    const start = before.lastIndexOf('{');
    /* The selector, and any `@media` wrapping it (which lands in the same
       slice), so the mode is read from what the block is for rather than
       inferred from the alphas it contains. Inferred from the alphas, a
       reverted dark value reports itself as a wrong light block, and the
       failure sends the reader to the wrong file.

       Comments are stripped first. Otherwise the file's own header, which
       says `Set data-crystal-mode="light" or "dark"`, falls inside the first
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
   focus ring, out of the `var(--cr-focus-ring, …)` fallback. The fallback must
   have the same geometry as the exported theme, or it is a second recipe. It
   kept the withdrawn spreads 2/6/12/22 after D-11 closed, because the fix went
   into the resolver and not the stylesheet. */
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
   Unchecked, the stylesheet padded a button `10px 19px` while the tokens, the
   reference table, the preview site and crystal-react all said `15px 24px`. A
   hand-authored sheet has no generated link to the token file, so the pairs
   are listed by hand, and a listed pair that cannot be found in the stylesheet
   fails. */
const TOKEN_BOUND = [
  { token: 'component.action.paddingBlock', rule: '.cr-button', prop: 'padding', part: 0 },
  { token: 'component.action.paddingInline', rule: '.cr-button', prop: 'padding', part: 1 },
  { token: 'component.action.radius', rule: '.cr-button', prop: 'border-radius' },
  { token: 'component.action.minTarget', rule: '.cr-button', prop: 'min-height' },
  { token: 'component.action.gap', rule: '.cr-button', prop: 'gap' },
];

/* Selectors that may carry a different value from the plain control, because a
   variant is allowed to differ. */
const VARIANT_MAY_DIFFER = [
  /\.cr-button\s*\.|\.cr-button\./,   /* .cr-button.danger and friends */
  /\.cr-dock/,                        /* the dock's own compact controls */
  /aria-(pressed|selected|current)/,  /* selection weight, not geometry */
  /* The 2.2.0 recipes that a <button> may wear instead of the action geometry.
     A bare control, a navigation entry and a drag handle are decided to differ
     from the action (44px floor, no pad, their own padding); see surfaces.json. */
  /\.cr-bare\b/, /\.cr-nav-item\b/, /\.cr-drag-handle\b/,
  /* A button inside a group (2.3.0, D-26): its interior corners square off
     against its neighbours and only the group's ends are round. That is the
     `group` surface, decided to differ from a lone action's pill. */
  /\.cr-group\b/,
];

/* Every rule that sets `prop` and could reach a `<button class="cr-button">`.
   Declaration order and layer are not resolved here. The assertion is the
   stricter "they all agree", which needs neither. */
function rulesReaching(css, prop) {
  const out = [];
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = rule.exec(css)) !== null) {
    const selector = match[1].trim().replace(/\s+/g, ' ');
    /* A pseudo-element is a different box. `::before` on a control is the Haze
       reading pad, and `border-radius: inherit` there is how the pad follows
       the control's radius. */
    if (/::(before|after|placeholder|selection|marker|backdrop)/.test(selector)) continue;
    const reaches = /cr-button/.test(selector) || /(?<![\w.#-])button(?![\w-])/.test(selector);
    if (!reaches) continue;
    const decl = new RegExp(`(?:^|;)\\s*${prop}\\s*:([^;]*)`).exec(match[2]);
    if (decl) out.push({ selector, value: decl[1].trim().split(/\s+/)[0] });
  }
  return out;
}

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

    /* And nothing later takes it back.
     *
     * The check above reads the first `.cr-button` rule, which is in
     * `crystal.reset`. A later layer wins regardless of specificity, so a rule
     * in `crystal.component` can leave that declaration dead: when
     * `:is(button,a.cr-button)` there set a different `min-height`, the token
     * disagreed with every button Crystal drew (D-20).
     *
     * So the pair is only honoured if every other rule that could apply to the
     * same element agrees. "Could apply" is approximated by hand, because a
     * text scan cannot resolve selectors: a rule naming `cr-button`, or one
     * selecting the bare `button` element, can reach a `<button class="cr-button">`.
     * A variant that really differs belongs in `VARIANT_MAY_DIFFER` with a
     * reason, so that the difference is recorded as a decision. */
    for (const other of rulesReaching(css, bound.prop)) {
      if (other.selector === bound.rule) continue;
      if (VARIANT_MAY_DIFFER.some((re) => re.test(other.selector))) continue;
      assert.equal(other.value, value(bound.token),
        `${other.selector} { ${bound.prop}: ${other.value} } overrides `
        + `${bound.rule}'s ${value(bound.token)} — the token is bound to a rule `
        + 'that does not render');
    }
  }
});



/* The button vocabulary: what is tinted, what is not, and what no longer exists.
 *
 * The tint is opt-in. A rule of the form `:not(.secondary):not(.quiet):not(.danger)`
 * has to enumerate every variant it must not paint, and one forgotten modifier
 * tints the whole surface. Seventy-two secondary buttons on the preview alone
 * depended on that list being complete.
 *
 * `.secondary` is withdrawn. It named a second action colour and Crystal has no
 * such role: the palettes publish one action pair, and the companion and glow
 * hues are expressive paint that `docs/colors.md` says is never assumed to be
 * text-safe. A withdrawn variant comes back when its class is deleted from one
 * file and survives in another.
 *
 * A quiet button has no reading fill at all. The base control rule paints a
 * `::before` on every button and one line suppresses it, which does not show in
 * a diff of the rules that create the fill.
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

  /* Opt-in. A tint that applies to anything other than `.primary` brings back
     the rule that enumerates its exceptions. */
  for (const { selector, body } of rules) {
    if (!/background\s*:\s*var\(--cr-primary\)/.test(body)) continue;
    assert.ok(/\.cr-button\.primary\b/.test(selector),
      `${selector} paints a button in the primary colour without asking for .primary`);
  }

  const quiet = rules.find(({ selector, body }) => /\.cr-button\.quiet::before/.test(selector)
    && /display\s*:\s*none/.test(body));
  assert.ok(quiet, 'a quiet button still paints the Haze reading fill every control gets');

  /* Nothing may put the solid primary back on the element itself, where it
     shows only as a ring of background exposed around the inset fill. */
  const ring = rules.find(({ selector, body }) => /^\.cr-button(\.[a-z-]+)?$/.test(selector)
    && /background\s*:\s*var\(--cr-primary\)/.test(body));
  assert.ok(!ring, `${ring?.selector} paints the element in the solid primary again`);
});


/* --------------------------------------------------- the chart series scale */

/* Six categorical colours per palette per mode, derived in `build-tokens.cjs`.
   These checks hold the properties a chart is allowed to rely on, whatever the
   derivation does. A palette added later, or a lightness moved to make a scale
   prettier, must pass them before it ships. */

const charts = (() => {
  const tokens = require('../core/tokens/crystal.json');
  const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const linear = (v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : (((v / 255) + 0.055) / 1.055) ** 2.4);
  const luminance = (hex) => {
    const [r, g, b] = channels(hex).map(linear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [lo, hi] = [luminance(a), luminance(b)].sort((x, y) => x - y);
    return (hi + 0.05) / (lo + 0.05);
  };
  /* Converted to OKLab for distance. A perceptual space puts a distance between
     two colours a reader can tell apart, and sRGB does not. */
  const oklab = (hex) => {
    const [r, g, b] = channels(hex).map(linear);
    const m = [
      [0.4122214708, 0.5363325363, 0.0514459929],
      [0.2119034982, 0.6806995451, 0.1073969566],
      [0.0883024619, 0.2817188376, 0.6299787005],
    ].map((row) => Math.cbrt(row[0] * r + row[1] * g + row[2] * b));
    return [
      [0.2104542553, 0.7936177850, -0.0040720468],
      [1.9779984951, -2.4285922050, 0.4505937099],
      [0.0259040371, 0.7827717662, -0.8086757660],
    ].map((row) => row[0] * m[0] + row[1] * m[1] + row[2] * m[2]);
  };
  const distance = (a, b) => Math.hypot(...oklab(a).map((v, i) => v - oklab(b)[i]));
  const every = [];
  for (const [id, palette] of Object.entries(tokens.palettes)) {
    for (const mode of ['light', 'dark']) {
      const roles = palette.modes[mode];
      const series = Array.from({ length: tokens.component.chart.seriesCount },
        (_, i) => roles[`chartSeries${i + 1}`]);
      every.push({ id, mode, roles, series });
    }
  }
  return { every, contrast, distance, luminance, tokens };
})();

check('every palette and mode carries the full series scale', () => {
  const want = charts.tokens.component.chart.seriesCount;
  assert.equal(charts.every.length, 12, 'six palettes in two modes');
  for (const { id, mode, series } of charts.every) {
    assert.equal(series.length, want, `${id} ${mode} has ${series.length} series colours`);
    assert.ok(series.every((hex) => /^#[0-9A-F]{6}$/.test(hex ?? '')),
      `${id} ${mode} has a series colour that is not a hex colour: ${series.join(' ')}`);
  }
});

/* A data mark is a graphical object that carries information, so WCAG 1.4.11
   applies to it. Both grounds, because a chart is drawn on a Haze fill over
   whatever it was put on, and the two opaque extremes that fill can sit over are
   the mode's surface and its canvas. */
check('every series colour clears 3:1 against both grounds of its mode', () => {
  const floor = charts.tokens.component.chart.seriesContrast;
  for (const { id, mode, roles, series } of charts.every) {
    series.forEach((hex, i) => {
      for (const ground of ['surface', 'canvas']) {
        const ratio = charts.contrast(hex, roles[ground]);
        assert.ok(ratio >= floor,
          `${id} ${mode} series ${i + 1} (${hex}) is ${ratio.toFixed(2)}:1 on ${ground}`);
      }
    });
  }
});

/* Stacked bars, pie segments and adjacent heatmap cells sit next to each other,
   so the series colours must be distinguishable from one another as well as
   from the ground. */
check('no two series colours in a scale are closer than a visible step', () => {
  const least = 0.10;
  for (const { id, mode, series } of charts.every) {
    for (let i = 0; i < series.length; i += 1) {
      for (let j = i + 1; j < series.length; j += 1) {
        const apart = charts.distance(series[i], series[j]);
        assert.ok(apart >= least,
          `${id} ${mode} series ${i + 1} and ${j + 1} are ${apart.toFixed(3)} apart in OKLab`);
      }
    }
  }
});

/* A series colour is for data marks, and it is never the action colour.
   `component.chart.seriesHueOffset` centres the ring of hues on the palette
   rather than starting it there, so that no slot lands on the seed hue at the
   lightness these are drawn at, which is where the primary already is. The
   closest any of the seventy-two comes to its palette's primary today is 0.050.

   The threshold here is deliberately far below that. The offset decides how
   near a series may come to the action colour, and a palette added later may
   come nearer. This check catches the collapse: somebody "simplifying" the
   first slot to `var(--cr-primary)`, which makes a chart's first series the
   colour of every button on its page, and which nothing else in this file
   would notice. */
check('no series colour is the action colour', () => {
  for (const { id, mode, roles, series } of charts.every) {
    series.forEach((hex, i) => {
      assert.ok(charts.distance(hex, roles.primary) >= 0.02,
        `${id} ${mode} series ${i + 1} (${hex}) is the action colour ${roles.primary}`);
    });
  }
});

/* Both sides read the same flat token file, so this cannot show that the order
   is right. It shows that the scale is published, under the name a stylesheet
   indexes with `var(--cr-chart-series-#{$i})`, and that it stops where the
   token says. Without the digit rule in `camelToKebab`, every one of these
   becomes `--cr-chart-series1`, which resolves to nothing in every chart in
   every consumer and throws no error. */
check('the series scale is published as --cr-chart-series-N, and ends', () => {
  const crystal = require('../core/assets/crystal.js');
  for (const { id, mode, series } of charts.every) {
    const resolved = crystal.resolve({ palette: id }, mode);
    series.forEach((hex, i) => {
      assert.equal(resolved[`--cr-chart-series-${i + 1}`], hex,
        `${id} ${mode} publishes --cr-chart-series-${i + 1} as `
        + `${resolved[`--cr-chart-series-${i + 1}`]}, not ${hex}`);
    });
    assert.equal(resolved[`--cr-chart-series-${series.length + 1}`], undefined,
      'the scale ends where the token says it ends');
  }
});

/* ------------------------------------------------------ the intensity ramp */

/* A heatmap cell and a calendar day are grounds rather than marks: the value
   is written on them. So the text floor applies, and it applies to every step.
   A ramp with an unreadable middle bucket hides the values a reader is trying
   to compare. */

check('every intensity step ships an ink that clears 4.5:1 on it', () => {
  const steps = charts.tokens.component.chart.intensitySteps;
  for (const { id, mode, roles } of charts.every) {
    for (let i = 1; i <= steps; i += 1) {
      const ground = roles[`chartHeat${i}`];
      const ink = roles[`chartOnHeat${i}`];
      assert.ok(ground && ink, `${id} ${mode} has no step ${i}`);
      const ratio = charts.contrast(ink, ground);
      assert.ok(ratio >= 4.5,
        `${id} ${mode} step ${i}: ${ink} on ${ground} is ${ratio.toFixed(2)}:1`);
    }
    assert.equal(roles[`chartHeat${steps + 1}`], undefined, 'the ramp ends where the token says');
  }
});

/* Consecutive steps must be distinguishable. Steps a reader cannot tell apart
   make the scale shorter than it claims to be. */
check('consecutive intensity steps are distinguishable', () => {
  const steps = charts.tokens.component.chart.intensitySteps;
  for (const { id, mode, roles } of charts.every) {
    for (let i = 1; i < steps; i += 1) {
      const apart = charts.distance(roles[`chartHeat${i}`], roles[`chartHeat${i + 1}`]);
      assert.ok(apart >= 0.05,
        `${id} ${mode} steps ${i} and ${i + 1} are ${apart.toFixed(3)} apart in OKLab`);
    }
  }
});

/* The ramp is monotone in lightness, in the direction its mode reads. A scale
   that brightened and then dimmed would have two buckets a reader would read as
   the same amount. */
check('the intensity ramp moves one way', () => {
  const steps = charts.tokens.component.chart.intensitySteps;
  for (const { id, mode, roles } of charts.every) {
    for (let i = 1; i < steps; i += 1) {
      const from = charts.luminance(roles[`chartHeat${i}`]);
      const to = charts.luminance(roles[`chartHeat${i + 1}`]);
      const forward = mode === 'light' ? to < from : to > from;
      assert.ok(forward, `${id} ${mode} step ${i + 1} reverses the ramp`);
    }
  }
});

/* ----------------------------------------------------- surfaces and recipes */

/* A component is specified in a surface, and a surface is implemented by a
   recipe. These checks hold the two together. A surface named in the vocabulary
   with no rule in the stylesheet can be read by only one renderer (D-9, R-15
   and D-11 were each this defect), and a catalogue entry naming a surface
   outside the vocabulary names a material Crystal never defined. */
const surfaces = require('../core/tokens/surfaces.json').surfaces;
const catalogue = require('node:fs').readdirSync(require('node:path').join(__dirname, '../core/tokens/catalogue'))
  .filter((f) => f.endsWith('.json')).sort()
  .flatMap((f) => require(require('node:path').join(__dirname, '../core/tokens/catalogue', f)).components);
const stylesheet = require('node:fs').readFileSync(
  require('node:path').join(__dirname, '../core/assets/crystal.css'), 'utf8');
const stylesheetCode = stylesheet.replace(/\/\*[\s\S]*?\*\//g, '');

check('every surface in the vocabulary has a recipe in crystal.css', () => {
  for (const s of surfaces) {
    for (const selector of [s.class, ...(s.also || [])]) {
      if (!selector) continue;
      const tokens = selector.startsWith('.') ? selector.split('.').filter(Boolean).map((t) => '.' + t) : [selector];
      for (const token of tokens) {
        assert.ok(stylesheetCode.includes(token), `surface ${s.id}: ${token} has no rule`);
      }
    }
  }
});

check('every catalogue entry names a surface from the vocabulary', () => {
  const ids = new Set(surfaces.map((s) => s.id));
  for (const c of catalogue) {
    assert.ok(Array.isArray(c.surface) && c.surface.length, `${c.id} names no surface`);
    for (const s of c.surface) assert.ok(ids.has(s), `${c.id} names surface "${s}", which is not in the vocabulary`);
  }
});

/* The recipes are published as values so a platform with no selectors can
   reproduce them. The generated file has to be current, cover the whole
   vocabulary, name only tokens Crystal defines, and agree with the stylesheet
   when the stylesheet is read by a different method. */
check('every surface publishes its recipe as token references, and the file is current', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { buildSurfaceRecipes } = require('../tools/build-surface-recipes.cjs');
  const file = path.join(__dirname, '../core/tokens/surface-recipes.json');
  const onDisk = fs.readFileSync(file, 'utf8');
  assert.equal(onDisk, buildSurfaceRecipes(), 'core/tokens/surface-recipes.json is stale: run node tools/build-surface-recipes.cjs');
  const recipes = JSON.parse(onDisk).surfaces;

  assert.deepEqual(recipes.map((r) => r.id), surfaces.map((s) => s.id), 'the recipes do not cover the vocabulary in order');
  for (const s of surfaces) {
    const r = recipes.find((x) => x.id === s.id);
    assert.equal(r.selector, s.class, `${s.id}: recipe selector differs from surfaces.json`);
    if (s.class === null) assert.equal(r.kind, 'none', `${s.id}: a surface with no class is not marked as having none`);
    for (const sel of s.also || []) assert.ok(r.also && r.also[sel], `${s.id}: no recipe for ${sel}`);
  }

  const defined = new Set();
  for (const sheet of ['crystal-theme.css', 'crystal.css']) {
    const text = fs.readFileSync(path.join(__dirname, '../core/assets', sheet), 'utf8');
    for (const m of text.matchAll(/(--cr-[-\w]+)\s*:/g)) defined.add(m[1]);
  }
  for (const r of recipes) {
    for (const token of r.tokens) assert.ok(defined.has(token), `${r.id} references ${token}, which no stylesheet defines`);
    for (const m of JSON.stringify(r).matchAll(/var\(\s*(--cr-[-\w]+)/g)) {
      assert.ok(r.tokens.includes(m[1]), `${r.id} uses ${m[1]} without listing it in tokens`);
    }
  }

  /* An independent reading: find the rule by its literal selector and take the
     declaration with a regular expression. */
  const componentLayer = stylesheetCode.indexOf('@layer crystal.component {');
  const rule = (selector) => {
    /* Anchored at a rule boundary, so a selector is not found inside a longer
       list. A selector written `.x {` in the expanded style is looked up in
       the component layer, where the recipes the cascade keeps are authored. */
    const code = /^\S+ \{$/.test(selector) ? stylesheetCode.slice(componentLayer) : stylesheetCode;
    selector = selector.replace(/ \{$/, '');
    const at = code.search(new RegExp('(?<=^|[}\\s])' + selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{'));
    assert.ok(at !== -1, `no rule for ${selector}`);
    return code.slice(code.indexOf('{', at) + 1, code.indexOf('}', at));
  };
  const decl = (selector, property) => {
    const m = rule(selector).match(new RegExp(`(?:^|[;\\s])${property}\\s*:\\s*([^;]+?)\\s*(?:;|$)`));
    assert.ok(m, `${selector} declares no ${property}`);
    return m[1].replace(/\s+/g, ' ');
  };
  const blurOf = (value) => value.match(/blur\(((?:[^()]|\([^()]*\))*)\)/)[1];
  const recipe = (id) => recipes.find((r) => r.id === id);
  const coat = ':is(button,a.cr-button,.cr-control,.cr-field-shell,.cr-resin-haze,.cr-status)';

  /* The planes paint on the element itself. */
  const planes = {
    resin: { fill: ':is(.cr-resin,.cr-glass)', blur: ':is(.cr-resin,.cr-glass)', radius: ':is(.cr-resin,.cr-glass)' },
    frost: { fill: ':is(.cr-frost,.cr-acrylic),:is(.cr-resin,.cr-glass)', blur: ':is(.cr-frost,.cr-acrylic),:is(.cr-resin,.cr-glass)', radius: ':is(.cr-frost,.cr-acrylic),:is(.cr-resin,.cr-glass)' },
    dock: { fill: '.cr-dock {', blur: '.cr-dock {', radius: '.cr-dock {' },
    group: { fill: '.cr-group {', blur: '.cr-group {', radius: '.cr-group {' },
    field: { fill: coat, blur: coat, radius: '.cr-field-shell {' },
  };
  for (const [id, where] of Object.entries(planes)) {
    const r = recipe(id);
    for (const field of ['fill', 'blur', 'radius']) assert.ok(r[field] !== null, `${id}: ${field} did not resolve`);
    assert.equal(r.fill, decl(where.fill, 'background'), `${id}: fill`);
    assert.equal(r.blur, blurOf(decl(where.blur, 'backdrop-filter')), `${id}: blur`);
    assert.equal(r.radius, decl(where.radius, 'border-radius'), `${id}: radius`);
  }

  /* Haze and Stone are feathered paint: the element is transparent and the
     fill is on an isolated ::before, which is the layer a platform reproduces. */
  const feathered = {
    haze: { layer: ':is(.cr-haze,.cr-surface)::before,.cr-well::before,.cr-bubble::before,.cr-content-fill::before,.cr-dialog::before', radius: ':is(.cr-haze,.cr-surface)' },
    stone: { layer: '.cr-stone::before,.cr-dock-inner::before', radius: null },
    dock: { layer: '.cr-dock::before {', radius: '.cr-dock {' },
    group: { layer: '.cr-group::before {', radius: '.cr-group {' },
    field: { layer: coat + '::before', radius: '.cr-field-shell {' },
  };
  for (const [id, where] of Object.entries(feathered)) {
    const r = recipe(id);
    assert.ok(r.haze, `${id}: no feathered paint layer`);
    assert.equal(r.haze.layer, '::before', `${id}: the feathered paint is not on ::before`);
    assert.equal(r.haze.fill, decl(where.layer, 'background'), `${id}: feathered fill`);
    assert.equal(r.haze.feather, blurOf(decl(where.layer, 'filter')), `${id}: feather`);
    assert.equal(r.layers['::before'].background, r.haze.fill, `${id}: layer and haze disagree`);
    if (where.radius) assert.equal(r.radius, decl(where.radius, 'border-radius'), `${id}: radius`);
  }
  assert.equal(recipe('haze').fill, 'transparent', 'haze: the element itself must not paint the reading fill');
  assert.equal(recipe('stone').fill, 'transparent', 'stone: the element itself must not paint the label backing');
  /* Stone sets no radius of its own; the record must say so rather than invent one. */
  assert.ok(!/border-radius/.test(rule('.cr-stone,.cr-dock-inner')), 'stone gained a radius: update this check');
  assert.equal(recipe('stone').radius, null, 'stone: a radius the stylesheet does not set');

  /* The adaptations come through as overrides. */
  assert.equal(recipe('resin').fallbacks.opaque.declarations.background, 'var(--cr-surface)', 'resin: opaque fallback');
  assert.equal(recipe('resin').fallbacks.reducedTransparency.declarations['backdrop-filter'], 'none', 'resin: reduced transparency');
  assert.equal(recipe('haze').fallbacks.forcedColors.layers['::before'].display, 'none', 'haze: forced colours drop the feathered layer');
});

check('every motion id the catalogue claims is a recipe or a material preset', () => {
  const recipes = new Set(require('../core/tokens/motion-recipes.json').recipes.map((r) => r.id));
  const presets = new Set(require('../core/assets/core/presets.js').PRESETS);
  for (const c of catalogue) {
    for (const id of c.motion || []) {
      assert.ok(recipes.has(id) || presets.has(id), `${c.id} claims "${id}", which is neither`);
    }
  }
});

/* A rule authored in `crystal.reset` that the component layer also reaches may
   never render (D-20 and D-21). The recipes added for the catalogue live in the
   component layer only. */
check('the catalogue recipes are authored in the component layer, never the reset layer', () => {
  const reset = stylesheetCode.slice(0, stylesheetCode.indexOf('@layer crystal.component {'));
  for (const selector of ['.cr-bare', '.cr-nav-item', '.cr-drag-handle', '[role=switch]', '.panel']) {
    assert.ok(!reset.includes(selector), `${selector} has a rule in the reset layer`);
    assert.ok(stylesheetCode.includes(selector), `${selector} has no rule at all`);
  }
});

const block = (selector) => {
  const at = stylesheetCode.indexOf(selector + ' {');
  assert.ok(at !== -1, `no rule for ${selector}`);
  return stylesheetCode.slice(at, stylesheetCode.indexOf('}', at));
};

/* Crystal paints the Resin coat by element, in five layers. Measured across 488
   Crystal React stories, eighteen controls that had declared themselves
   transparent were transparent in exactly one of the five. A bare control
   removes all five. */
check('a bare control takes off every layer of the coat and keeps the target', () => {
  const bare = block(':is(button, a, [role=button], .cr-bare).cr-bare');
  /* The coat is (0,1,1) and lives in the same layer; a lone class never wins. */
  for (const selector of [':is(button, a, [role=button], .cr-bare).cr-bare', ':is(button, a, [role=link], .cr-nav-item).cr-nav-item', ':is(button, [role=button], .cr-drag-handle).cr-drag-handle']) {
    assert.ok(stylesheetCode.includes(selector + ' {'), `${selector} does not carry the element compound that outranks the coat`);
  }
  assert.match(bare, /background:\s*transparent/);
  assert.match(bare, /backdrop-filter:\s*none/);
  assert.match(bare, /min-inline-size:\s*44px/);
  assert.match(block('.cr-bare:not(:focus-visible)'), /box-shadow:\s*none/);
  const pseudo = stylesheetCode.slice(stylesheetCode.indexOf('.cr-bare::before'));
  assert.match(pseudo.slice(0, pseudo.indexOf('}')), /content:\s*none/);
});

/* The reference implementation of selection, exported: label weight, with
   nothing drawn beside the label. */
check('a navigation entry is selected by label weight and never by a mark', () => {
  const current = block('.cr-nav-item:is([aria-current]:not([aria-current=false]),[aria-selected=true],[aria-pressed=true])');
  assert.match(current, /font-weight:\s*800/);
  assert.ok(!/content:/.test(current), 'the current entry draws something');
  const rest = block(':is(button, a, [role=link], .cr-nav-item).cr-nav-item');
  assert.match(rest, /font-weight:\s*650/);
  assert.match(rest, /background:\s*transparent/, 'an entry is furniture, not a Resin capsule');
  assert.match(rest, /backdrop-filter:\s*none/);
});

/* D-22: current location is a dot and selection is weight; they are two
   indicators. The dot is keyed on aria-current alone, because a selected or
   pressed entry is selection and must not gain it. It is flat (no shadow, no
   blur, no material), and it sits inside the entry's own inline-start padding
   so the label never moves. */
check('a navigation entry marks its current location with a flat dot inside its padding', () => {
  const selector = '.cr-nav-item:is([aria-current]:not([aria-current=false]))::before';
  const dot = block(selector);
  assert.match(dot, /content:\s*''/, 'the current entry draws no dot');
  assert.match(dot, /position:\s*absolute/, 'a dot in the flow would move the label');
  assert.match(dot, /background:\s*var\(--cr-primary\)/);
  assert.ok(!/box-shadow|backdrop-filter|filter:/.test(dot), 'the dot carries material or elevation');
  const start = Number(/inset-inline-start:\s*(\d+)px/.exec(dot)?.[1]);
  const size = Number(/width:\s*(\d+)px/.exec(dot)?.[1]);
  const rest = block(':is(button, a, [role=link], .cr-nav-item).cr-nav-item');
  const padding = Number(/padding:\s*\d+px\s+(\d+)px/.exec(rest)?.[1]);
  assert.ok(start + size < padding, `the dot ends at ${start + size}px and the label starts at ${padding}px`);
  for (const selection of ['[aria-selected', '[aria-pressed']) {
    assert.ok(!selector.includes(selection), `the dot is keyed on ${selection}, which is selection`);
  }
});

/* The stylesheet reads the geometry the package publishes, so the two cannot
   part: the token in the theme, the literal only as the fallback. */
check('the switch and the choice box read their published tokens', () => {
  const theme = require('node:fs').readFileSync(
    require('node:path').join(__dirname, '../core/assets/crystal-theme.css'), 'utf8');
  for (const name of ['--cr-switch-track-width', '--cr-switch-track-height', '--cr-choice-box-size', '--cr-choice-box-radius', '--cr-action-disabled-opacity']) {
    assert.ok(theme.includes(name + ':'), `${name} is not exported by the theme`);
    assert.ok(stylesheetCode.includes(`var(${name}`), `${name} is exported and nothing reads it`);
  }
  const tokens = require('../core/tokens/crystal.tokens.json').component;
  assert.match(theme, new RegExp(`--cr-switch-track-width:\\s*${tokens.switch.trackWidth.$value}`));
  assert.match(theme, new RegExp(`--cr-choice-box-size:\\s*${tokens.choice.boxSize.$value}`));
});

/* The rulings of 29 September 2026 (proposals/2026-09-29-rulings.md), each
   checked at the point a later edit could undo it without notice. How they look
   is checked in a browser by proposals/2026-09-29-rulings/examples/verify.mjs;
   these hold the text of the decision. */
check('the rulings of 29 September 2026 hold in the stylesheet', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const motionCss = fs.readFileSync(path.join(__dirname, '../core/assets/motion.css'), 'utf8');
  /* D-21: the reset hover that never rendered stays deleted. */
  assert.ok(!/\.cr-button:hover\s*\{[^}]*brightness/.test(stylesheetCode),
    'the reset layer brightens a hovered .cr-button again, which crystal.component erases (D-21)');
  /* 4.4: the preview's class is the preview's. */
  assert.ok(!/tiny-button/.test(stylesheetCode + motionCss), '.tiny-button is back in the library');
  /* D-29: fixed only centres a native dialog. */
  assert.ok(/dialog\.cr-dialog\s*\{\s*position:\s*fixed/.test(stylesheetCode), 'dialog.cr-dialog is not fixed');
  assert.ok(!/(^|[},\s])\.cr-dialog\s*\{\s*position:\s*fixed/.test(stylesheetCode),
    '.cr-dialog is fixed on every element again, which leaves a non-dialog host off-centre (D-29)');
  /* D-25: the body scrolls, a body-less dialog still does. */
  assert.ok(/\.cr-dialog:has\(> \.cr-dialog-body\)\s*\{[^}]*overflow:\s*visible/.test(stylesheetCode), 'a dialog with a body scrolls its surface');
  assert.ok(/\.cr-dialog-body\s*\{[^}]*overflow:\s*auto/.test(stylesheetCode), '.cr-dialog-body does not scroll');
  /* D-26: the dock reaches its other controls without raising specificity. */
  assert.ok(/\.cr-dock :where\(\[role=tab\], a, label:has\(input\[type=radio\]\)\)/.test(stylesheetCode),
    'the dock no longer reaches tabs, links and radio labels, or does so outside :where()');
  /* The new recipes exist. */
  for (const recipe of ['.cr-group', '.cr-group.vertical', ':is(.cr-haze,.cr-surface).overlay', '.cr-resin-haze.count']) {
    assert.ok(stylesheetCode.includes(recipe + ' {') || stylesheetCode.includes(recipe + '{'), `${recipe} has no rule`);
  }
  /* D-27: the glyphs reach any field shell. */
  assert.ok(!/span\.cr-field-shell(:[\w-]+(\([^)]*\))?)*>\.cr-indicator/.test(stylesheetCode),
    'the field glyphs are keyed on span.cr-field-shell again, which a div shell never matches (D-27)');
});

/* The media and text recipes of 2 October 2026. Each was a place where every
   platform invented its own geometry; these hold the numbers the proposal
   measured, so a later edit that moves one has to say so. */
check('the media and text recipes hold their geometry and their rules', () => {
  /* Comments are stripped from stylesheetCode, so the block is found by its first rule. */
  const start = stylesheetCode.indexOf('.cr-media {');
  assert.ok(start !== -1, 'the media and text block is missing');
  const media = stylesheetCode.slice(start);
  const rule = (selector) => {
    const at = media.indexOf(selector + ' {');
    assert.ok(at !== -1, `no rule for ${selector}`);
    return media.slice(at, media.indexOf('}', at));
  };
  /* The transport is inset from the stage, so the pill never meets the
     content radius; 4px block and 12px inline padding around 48px targets. */
  const bar = rule('.cr-media-bar');
  assert.ok(/inset-inline:\s*var\(--cr-spacing-sm\)/.test(bar) && /inset-block-end:\s*var\(--cr-spacing-sm\)/.test(bar), 'the transport is not inset 12px from the stage');
  const transport = rule(':is(.cr-resin,.cr-glass).transport');
  assert.ok(/min-height:\s*58px/.test(transport), 'the transport is not the 48px target plus its padding and rim');
  assert.ok(/padding:\s*var\(--cr-spacing-2xs\) var\(--cr-spacing-sm\)/.test(transport), 'the transport lost its padding');
  /* The readouts are labels over moving pictures and sit on Haze. */
  assert.ok(/background:\s*var\(--cr-haze-fill\)/.test(rule(':is(.cr-resin,.cr-glass).transport :where(time, output, .time)')), 'the time readouts lost their Haze fill');
  /* A caption is Stone and sits above the transport. */
  const caption = media.slice(media.indexOf('.cr-media-caption > *::before {'));
  assert.ok(/var\(--cr-stone-fill\)/.test(caption.slice(0, 300)), 'the caption is not on Stone');
  assert.ok(/inset-block-end:\s*calc\(var\(--cr-media-transport/.test(rule('.cr-media-caption')), 'the caption no longer clears the transport');
  /* The audio card hands its background back to the surface it wears. */
  assert.ok(/background:\s*revert-layer/.test(rule('.cr-media.audio')), 'the audio player paints the letterbox over its Haze card');
  /* Selection is weight, a done item is not struck through, and a checklist's
     marker is the native control. */
  assert.ok(!/content:\s*['"]\\?2713|content:\s*['"]✓/.test(media), 'a check glyph is drawn in the media and text recipes');
  const done = media.slice(media.indexOf('[data-checked=true]'), media.indexOf('[data-checked=true]') + 300);
  assert.ok(!/line-through/.test(done), 'a finished checklist item is struck through');
  /* The touch toolbar clears the keyboard. */
  assert.ok(/inset-block-end:\s*env\(keyboard-inset-height/.test(media), 'the touch toolbar no longer clears the on-screen keyboard');
  /* The editor's frame outranks the shell's inline layout: a zero-specificity
     rule lost to it and centred the toolbar at a 20px radius. */
  const frame = rule('.cr-field-shell:has(> .cr-editor)');
  assert.ok(/flex-direction:\s*column/.test(frame) && /border-radius:\s*var\(--cr-radius\)/.test(frame) && /align-items:\s*stretch/.test(frame),
    'the editor frame is not a stretched column at the content radius');
  assert.ok(!/:where\(\.cr-field-shell:has\(> \.cr-editor\)\)/.test(media), 'the editor frame is back inside :where() and loses to the shell');
  /* Every new surface selector is registered in the vocabulary. */
  const also = new Set(surfaces.flatMap((s) => s.also || []));
  for (const cls of ['.cr-resin.transport', '.cr-media-caption', '.cr-frost.bar', '.cr-editor']) {
    assert.ok(also.has(cls), `${cls} is not in surfaces.json`);
  }
  /* Authored in the component layer only. */
  const reset = stylesheetCode.slice(0, stylesheetCode.indexOf('@layer crystal.component {'));
  for (const cls of ['.cr-media', '.cr-editor', '.cr-prose', '.transport']) {
    assert.ok(!reset.includes(cls), `${cls} has a rule in the reset layer`);
  }
});

/* -------------------------------------------------------------- report */

const failures = results.filter((r) => r.status === 'fail');
console.log(JSON.stringify({
  suite: 'headless core contracts',
  checks: results.length,
  failures: failures.map((f) => ({ name: f.name, detail: f.detail })),
}, null, 2));
if (failures.length) process.exit(1);
