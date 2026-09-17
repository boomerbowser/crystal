/* Crystal headless core: preferences and motion resolution.
 *
 * Pure functions. The clamps and the duration ceiling are contract, not
 * defensive coding: a product that lets a preference drift outside these ranges
 * is no longer rendering Crystal, and an animation that runs past the ceiling
 * breaks the responsiveness the motion specification promises.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.CrystalCore = root.CrystalCore || {}).preferences = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RANGES = {
    atmosphere: [15, 90],
    translucency: [35, 85],
    elevation: [60, 150],
    radius: [14, 28],
    motionSpeed: [0.25, 2],
  };

  const CHOICES = {
    mode: ['light', 'dark', 'system'],
    density: ['comfortable', 'compact'],
    font: ['manrope', 'system'],
  };

  const FLAGS = ['reduced', 'reduceMotion'];

  const DURATION_CEILING = 5000;

  const clamp = (value, [min, max]) => Math.max(min, Math.min(max, value));

  /* Merge an untrusted preference object onto defaults, keeping every value
     inside its documented range and every choice inside its documented set.
     Unknown keys are dropped rather than passed through. */
  function normalisePreferences(input, defaults) {
    const source = input && typeof input === 'object' ? input : {};
    const state = Object.assign({}, defaults);

    for (const [key, range] of Object.entries(RANGES)) {
      const value = Number(source[key]);
      if (Number.isFinite(value)) state[key] = clamp(value, range);
    }
    for (const [key, allowed] of Object.entries(CHOICES)) {
      if (allowed.includes(source[key])) state[key] = source[key];
    }
    for (const key of FLAGS) {
      if (typeof source[key] === 'boolean') state[key] = source[key];
    }
    if (source.palette && Object.prototype.hasOwnProperty.call(defaults.palettes || {}, source.palette)) {
      state.palette = source.palette;
    } else if (typeof source.palette === 'string' && !defaults.palettes) {
      state.palette = source.palette;
    }
    return state;
  }

  /* Resolved duration for one animation.
     Reduced motion resolves to zero: the state change still happens, the
     movement does not. Otherwise the base duration is divided by the speed
     preference and capped, so slowing playback cannot strand a user inside a
     long transition. At 0.25x the 1400ms liquid recipe would run 5600ms; it
     is capped at 5000ms instead. */
  function resolveDuration(base, motionSpeed, reduceMotion) {
    if (reduceMotion === true) return 0;
    const speed = Number.isFinite(Number(motionSpeed)) && Number(motionSpeed) > 0
      ? clamp(Number(motionSpeed), RANGES.motionSpeed)
      : 1;
    const duration = Number(base);
    if (!Number.isFinite(duration) || duration <= 0) return 0;
    return Math.round(Math.min(DURATION_CEILING, duration / speed) * 100) / 100;
  }

  return { normalisePreferences, resolveDuration, RANGES, CHOICES, DURATION_CEILING };
});
