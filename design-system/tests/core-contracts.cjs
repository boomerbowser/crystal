/* Contract tests for the Crystal headless core.
 *
 * These encode decisions, not implementation details. If one fails, a rule the
 * design system promises has changed — check the specification before the code.
 */
const assert = require('node:assert/strict');
const state = require('../assets/core/state.js');
const preferences = require('../assets/core/preferences.js');

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

check('selection resolves to the rail, not a badge glyph', () => {
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

const spring = require('../assets/core/spring.js');

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
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../assets/crystal.css'), 'utf8');
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
  const css = require('node:fs').readFileSync(require('node:path').join(__dirname, '../assets/crystal.css'), 'utf8');
  for (const rule of css.match(/[^{}]*:focus-visible[^{}]*\{[^}]*\}/g) ?? []) {
    if (!/outline:\s*2px solid var\(--cr-primary\)/.test(rule)) continue;
    assert.match(rule, /\[tabindex\]:focus-visible/,
      'the focus rule does not reach [tabindex]');
    return;
  }
  assert.fail('no focus rule found to check');
});

/* The preview's own layout is what the layout tokens were derived from, which is
   why nothing can drift *yet* — and why it will, the first time a token changes
   and the stylesheet does not. Lengths are var() references now. Breakpoints
   cannot be: `@media (max-width: 1150px)` will not take a custom property, and
   no amount of wishing makes it. So they are checked instead.

   Every width in a `@media` query in site.css must either be one of Crystal's
   four shell breakpoints or be named below as something else — a component's own
   threshold, which is a different kind of number and not Crystal's to own. The
   allowlist is the point: it is short, each entry says what it is, and adding to
   it is a decision somebody makes rather than a literal nobody notices. */
const COMPONENT_WIDTHS = new Map([
  [1000, 'the documentation shell narrows its sidebar before the marketing shell does'],
  [860, 'the documentation shell drops its sidebar'],
  [700, 'the reference image strip goes from three across to two'],
  [450, 'the reference image strip goes to one'],
]);

check('every breakpoint in site.css is a token or a named exception', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const here = path.join(__dirname, '..');
  const css = fs.readFileSync(path.join(here, 'assets/site.css'), 'utf8');
  const tokens = JSON.parse(fs.readFileSync(path.join(here, 'tokens/crystal.tokens.json'), 'utf8'));
  const shell = new Set(Object.values(tokens.semantic.breakpoint)
    .map((leaf) => Number.parseInt(leaf.$value, 10)));
  assert.equal(shell.size, 4, 'expected four shell breakpoints');

  const stray = [];
  for (const query of css.match(/@media[^{]*/g) ?? []) {
    for (const [, width] of query.matchAll(/(?:max|min)-width:\s*(\d+)px/g)) {
      const value = Number(width);
      if (shell.has(value) || COMPONENT_WIDTHS.has(value)) continue;
      stray.push(`${value}px in ${query.trim()}`);
    }
  }
  assert.deepEqual(stray, [], 'breakpoints that match neither a token nor a named exception');
});

/* -------------------------------------------------------------- report */

const failures = results.filter((r) => r.status === 'fail');
console.log(JSON.stringify({
  suite: 'headless core contracts',
  checks: results.length,
  failures: failures.map((f) => ({ name: f.name, detail: f.detail })),
}, null, 2));
if (failures.length) process.exit(1);
