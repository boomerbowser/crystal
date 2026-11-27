/* Prismata headless core: input modality, for focus rings that appear only when
 * they are needed.
 *
 * A focus ring is for a person who cannot see where a click landed: someone
 * moving through a page with the keyboard. Shown to someone who just clicked,
 * it is noise around the thing they are already looking at, and on a field or
 * a palette it stays for as long as they type. Browsers decide `:focus-visible`
 * per element, and they treat a text field, and an element focused by script
 * after a click (a listbox a select opens, a palette's field), as focus-visible
 * whatever put focus there.
 *
 * This records how the person is interacting, on the document element, as
 * `data-prismata-modality`: `pointer` after a pointer is pressed, `keyboard`
 * after a key that moves focus or navigates. Prismata's stylesheet draws no
 * focus ring while it is `pointer`. Typing in a text field, and a shortcut held
 * with a modifier, do not change it, so a field clicked into does not grow a
 * ring at the first letter. With no script the attribute is absent and every
 * ring is drawn, which is the accessible default.
 *
 * Loaded as a classic script it starts by itself. As a module, call `watch()`
 * once per document; it returns the function that stops it.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    (root.PrismataCore = root.PrismataCore || {}).modality = api;
    if (typeof document !== 'undefined') api.watch(document);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ATTRIBUTE = 'data-prismata-modality';
  const NAVIGATION = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Enter', ' ', 'Escape']);
  /* Keys that move focus wherever focus is, including out of a text field. */
  const ALWAYS = new Set(['Tab', 'F6', 'F10']);
  const TEXT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number', 'date', 'datetime-local', 'month', 'time', 'week', '']);

  function isTextEntry(target) {
    if (!target || target.nodeType !== 1) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    if (tag === 'TEXTAREA') return true;
    return tag === 'INPUT' && TEXT_TYPES.has((target.getAttribute('type') || '').toLowerCase());
  }

  /* What a key press says about how the person is interacting, or null if it
     says nothing (a letter typed, a shortcut). */
  function modalityForKey(event) {
    if (ALWAYS.has(event.key)) return 'keyboard';
    if (event.metaKey || event.ctrlKey || event.altKey) return null;
    if (!NAVIGATION.has(event.key)) return null;
    return isTextEntry(event.target) ? null : 'keyboard';
  }

  function watch(doc) {
    const target = doc || (typeof document !== 'undefined' ? document : null);
    if (!target || !target.documentElement) return function stop() {};
    const html = target.documentElement;
    const set = (value) => { if (html.getAttribute(ATTRIBUTE) !== value) html.setAttribute(ATTRIBUTE, value); };
    const onPointer = () => set('pointer');
    const onKey = (event) => { const value = modalityForKey(event); if (value) set(value); };
    target.addEventListener('pointerdown', onPointer, true);
    target.addEventListener('keydown', onKey, true);
    return function stop() {
      target.removeEventListener('pointerdown', onPointer, true);
      target.removeEventListener('keydown', onKey, true);
    };
  }

  return { ATTRIBUTE, watch, modalityForKey, isTextEntry };
});
