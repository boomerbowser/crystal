/* Contract tests for the Crystal headless core.
 *
 * These encode decisions, not implementation details. If one fails, a rule the
 * design system promises has changed — check the specification before the code.
 */
const assert = require('node:assert/strict');
const state = require('../src/core/state.js');
const preferences = require('../src/core/preferences.js');

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

/* -------------------------------------------------------------- report */

const failures = results.filter((r) => r.status === 'fail');
console.log(JSON.stringify({
  suite: 'headless core contracts',
  checks: results.length,
  failures: failures.map((f) => ({ name: f.name, detail: f.detail })),
}, null, 2));
if (failures.length) process.exit(1);
