/* Crystal headless core: the motion presets.
 *
 * A preset is the movement a *material* makes when it enters or leaves — Plastic
 * rising, Frost coming toward the viewer, Resin flowing in, Mirage washing across
 * the scene, and the shared dismissal. Unlike a recipe, a preset is not a stored
 * keyframe list: its geometry is computed from the travel, depth and feather
 * tokens, so changing a travel token changes every preset at once.
 *
 * Pure functions. No DOM access, no globals, no side effects: the caller measures
 * its own environment and passes the numbers in. That is what lets the web
 * runtime, a React library, a SwiftUI view and a Compose composable all produce
 * the same movement instead of four implementations that drift — which CONTRACT
 * §1 names as the reason to reuse the resolver's arithmetic rather than
 * reimplement it.
 *
 * What is deliberately NOT here: the decorative paint layers the web runtime adds
 * on top — animated box-shadow, border-radius and background-position. Those
 * cannot be composited, so each of them repaints every frame, and they are also
 * unportable. A platform that wants them adds them itself; the movement below is
 * the contract.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.CrystalCore = root.CrystalCore || {}).presets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** Which duration token each preset resolves against. */
  const DURATION_ROLE = {
    plastic: 'material',
    frost: 'material',
    resin: 'liquid',
    haze: 'material',
    stone: 'material',
    mirage: 'flow',
    'mirage-out': 'departure',
    dismiss: 'departure',
  };

  /** Presets that read as leaving rather than arriving, and so use the exit easing. */
  const EXITING = new Set(['dismiss', 'mirage-out']);

  /** Which travel token a preset moves by. */
  const TRAVEL_ROLE = { resin: 'floating', dismiss: 'exit' };

  const PRESETS = Object.keys(DURATION_ROLE);

  /* A fluid is incompressible: a deformation that loses area reads as rubber
     being crushed rather than liquid moving. Both axes are divided by the square
     root of the area, which conserves volume while preserving the deformation's
     aspect ratio exactly, so only the physical error is removed. */
  function squash(sx, sy) {
    const k = Math.sqrt(sx * sy);
    return `scale(${(sx / k).toFixed(4)},${(sy / k).toFixed(4)})`;
  }

  /** Where a Mirage wash begins, by the direction it flows from. */
  const ORIGINS = { left: '0% 65%', right: '100% 35%', top: '65% 0%', bottom: '35% 100%' };

  /**
   * Keyframes for one preset.
   *
   * @param {string} name        one of `presets`
   * @param {object} measured
   * @param {number} measured.travel   resolved travel distance in px
   * @param {number} measured.depth    resolved depth distance in px
   * @param {boolean} [measured.anchored]  a dismissal that fades rather than falls,
   *        which is what a surface anchored to the page does — a dialog, a Haze
   *        card, a Stone backing. An unanchored dismissal drops away.
   * @param {string} [measured.from]   flow direction for Mirage: left, right, top, bottom
   * @param {boolean} [measured.softFlow]  true when the host can register a custom
   *        property for the wash, which produces a softer edge than a clip path
   * @returns {{keyframes: object[], easing: 'enter'|'exit', duration: string}}
   */
  function presetKeyframes(name, measured) {
    if (!DURATION_ROLE[name]) throw new RangeError('Unknown Crystal preset: ' + name);
    const travel = Math.max(0, Number(measured && measured.travel) || 0);
    const depth = Math.max(0, Number(measured && measured.depth) || 0);
    const anchored = Boolean(measured && measured.anchored);
    const from = (measured && measured.from) || 'left';
    const softFlow = Boolean(measured && measured.softFlow);

    const result = {
      easing: EXITING.has(name) ? 'exit' : 'enter',
      duration: DURATION_ROLE[name],
      keyframes: [],
    };

    if (name === 'mirage' || name === 'mirage-out') {
      const origin = ORIGINS[from] || ORIGINS.left;
      if (softFlow) {
        const start = { opacity: 0, '--cr-flow-reach': '0%' };
        const end = { opacity: 1, '--cr-flow-reach': '100%' };
        result.keyframes = name === 'mirage' ? [start, end] : [end, start];
        return result;
      }
      const start = { opacity: 0, clipPath: `ellipse(0% 35% at ${origin})` };
      const middle = { opacity: 0.8, clipPath: `ellipse(70% 95% at ${origin})`, offset: 0.58 };
      const end = { opacity: 1, clipPath: `ellipse(150% 150% at ${origin})` };
      result.keyframes = name === 'mirage' ? [start, middle, end] : [end, start];
      return result;
    }

    if (name === 'plastic') {
      result.keyframes = [
        { transform: `translateY(${travel}px)`, opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 },
      ];
    } else if (name === 'frost') {
      result.keyframes = [
        { transform: 'perspective(700px) translateZ(0)', opacity: 0.5 },
        { transform: `perspective(700px) translateZ(${depth}px)`, opacity: 1, offset: 0.66 },
        { transform: 'perspective(700px) translateZ(0)', opacity: 1 },
      ];
    } else if (name === 'resin') {
      result.keyframes = [
        { transform: `translateY(${travel}px) ${squash(0.90, 1.10)} skewX(-3deg)`, opacity: 0 },
        { transform: `translateY(-6px) ${squash(1.045, 0.965)} skewX(1.5deg)`, opacity: 1, offset: 0.58 },
        { transform: `translateY(2px) ${squash(0.99, 1.015)} skewX(-.4deg)`, opacity: 1, offset: 0.82 },
        { transform: 'translateY(0) scale(1,1) skewX(0deg)', opacity: 1 },
      ];
    } else if (name === 'dismiss') {
      result.keyframes = anchored
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: `translateY(${travel}px)`, opacity: 0 },
        ];
    }
    /* `haze` and `stone` have no component movement of their own: their material
       signature is the feathered paint shifting while the text stays fixed, which
       is a paint-layer effect the caller adds. Returning no keyframes is the
       correct answer, not a gap. */

    return result;
  }

  /** The travel token a preset moves by: `travel-<role>`. */
  function travelRole(name) {
    return TRAVEL_ROLE[name] || 'panel';
  }

  return { presetKeyframes, travelRole, squash, PRESETS, DURATION_ROLE, EXITING, ORIGINS };
});
