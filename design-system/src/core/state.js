/* Crystal headless core: state derivation.
 *
 * Pure functions. No DOM access, no globals, no side effects. A web page, a
 * React component, a SwiftUI view and a Compose composable all need the same
 * answers to "which mark does this control show" and "how full is this range";
 * deriving that here is what lets libraries share behaviour instead of
 * reimplementing it and drifting.
 *
 * Usable as a plain <script> (attaches to CrystalCore) or via require().
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.CrystalCore = root.CrystalCore || {}).state = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* Indicator precedence. Activity outranks location, which outranks selection:
     a control that is busy should say so before it says where you are, and a
     control that is the current page should say that before it says it is
     selected. A check mark is deliberately absent — it means validated or
     informational, never "this one is selected". */
  const INDICATOR_ORDER = ['busy', 'current', 'selection'];

  function resolveIndicator(flags) {
    const f = flags || {};
    if (f.busy === true) return 'busy';
    if (f.current != null && f.current !== false && f.current !== 'false') return 'current';
    if (f.pressed === true || f.selected === true || f.checked === true) return 'selection';
    return null;
  }

  /* Field precedence. An invalid field must say so even while focused, and a
     required field must say so before it says it is merely idle. */
  function resolveFieldState(flags) {
    const f = flags || {};
    if (f.invalid === true) return 'invalid';
    if (f.required === true) return 'required';
    if (f.focused === true) return 'focused';
    return 'idle';
  }

  /* Range fill, clamped to 0-100. A zero-width range is a legitimate state
     (a single-value slider), not an error, and must not divide by zero. */
  function rangeProgress(range) {
    const r = range || {};
    const min = Number(r.min);
    const max = Number(r.max);
    const value = Number(r.value);
    if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(value)) return 0;
    if (max <= min) return 0;
    const ratio = ((value - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, ratio));
  }

  return { resolveIndicator, resolveFieldState, rangeProgress, INDICATOR_ORDER };
});
