#!/usr/bin/env node
/* Fourth catalogue extension: every entry names its surface, and every entry
 * that a motion family already covers claims the family's recipes.
 *
 * What was measured before this ran (28 September 2026):
 *
 *   - 285 entries; the only machine-readable link from an entry to a Crystal
 *     recipe was `motion`, and 237 entries had none. Whole categories — layout,
 *     charts, media, commerce, blocks — carried no motion at all, and a
 *     consumer that reads "where the catalogue assigns none, the component
 *     plays none" (Crystal React's plan, §4.1) therefore shipped 145
 *     components with no motion whatever.
 *   - `material` was prose. 102 entries named no material in it, and nothing
 *     tied the prose to a class in `crystal.css`, so a library could satisfy
 *     the catalogue's material sentence with any recipe it liked. Crystal
 *     React wrote 43 of its own.
 *   - The prose disagreed with the specification in five places, listed under
 *     PROSE below, each with what the specification actually says.
 *
 * What this does:
 *
 *   1. Adds `surface` to every entry, drawn from `core/tokens/surfaces.json`.
 *      The first surface is the entry's own outermost material; further ones
 *      are the compositions inside it, outer to inner. `build-catalogue.cjs`
 *      validates every one against the vocabulary and refuses a vocabulary
 *      entry whose recipe does not exist in `crystal.css`.
 *   2. Completes `motion` from the family table in `docs/motion-components.md`
 *      ("Component coverage and composition"). That table has said since 2.0
 *      that a date picker takes `menu-in/out`, `selection` and `page-in`, that
 *      a table row takes `list-in/out` and `highlight`, that a badge takes
 *      `attention`; the catalogue entries simply did not carry it. Every recipe
 *      named here already exists — nothing is invented, and the two motion
 *      gaps that need a decision (D-19 continuous indicators, R-21 chart mark
 *      enter) are deliberately left unassigned.
 *   3. Corrects the five material sentences that contradicted the specification.
 *
 * Idempotent: an entry that already carries the field is left alone unless the
 * value differs, and the old value is printed.
 *
 *   node tools/extend-catalogue-4.cjs --write
 */
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.resolve(__dirname, '../core/tokens/catalogue');
const SURFACES = require('../core/tokens/surfaces.json').surfaces.map((s) => s.id);
const RECIPES = new Set(require('../core/tokens/motion-recipes.json').recipes.map((r) => r.id));
const WRITE = process.argv.includes('--write');

/* ------------------------------------------------------------------ surfaces
   Outer to inner. A single string is shorthand for a one-element list. */
const SURFACE = {
  /* layout */
  'app-shell': ['plastic', 'frost', 'dock'], container: 'none', grid: 'none', 'simple-grid': 'none',
  stack: 'none', group: 'none', divider: 'none', 'aspect-ratio': 'none', 'scroll-area': 'none',
  center: 'none', space: 'none', 'app-bar': 'frost', masonry: 'none', 'overflow-list': ['none', 'frost'],
  /* navigation */
  anchor: 'none', 'nav-link': 'nav-item', 'nav-rail': ['frost', 'nav-item'], dock: 'dock',
  breadcrumbs: 'none', tabs: 'resin', pagination: 'control', stepper: ['control', 'haze'],
  burger: 'control', 'command-palette': ['mirage', 'dialog', 'field'], 'tree-view': 'haze',
  affix: 'resin', 'bottom-navigation': 'dock', 'navigation-menu': ['none', 'frost'],
  'table-of-contents': 'haze', menubar: ['none', 'frost'], submenu: 'frost',
  /* actions */
  button: 'control', 'icon-button': 'control', 'button-group': 'resin', 'split-button': 'resin',
  'floating-action': 'control', 'copy-button': 'control', 'close-button': 'control',
  'action-bar': 'resin', 'speed-dial': 'control',
  /* inputs */
  'text-input': 'field', textarea: 'field', 'number-input': 'field', 'password-input': 'field',
  'search-input': 'field', select: ['field', 'frost'], combobox: ['field', 'frost'],
  'multi-select': ['field', 'compact', 'frost'], checkbox: 'choice', 'checkbox-group': 'none',
  radio: 'choice', 'radio-group': 'none', switch: 'choice', slider: 'choice', 'range-slider': 'choice',
  'segmented-control': 'resin', rating: 'none', 'pin-input': 'field', 'tags-input': ['field', 'compact'],
  chip: 'control', 'color-input': 'field', 'date-input': 'field', 'date-picker': ['field', 'frost', 'haze'],
  'date-range-picker': ['field', 'frost', 'haze'], 'time-input': 'field', 'file-input': ['control', 'haze'],
  dropzone: 'haze', 'form-field': 'none', fieldset: 'haze', transfer: ['haze', 'control'],
  cascader: ['field', 'frost', 'haze'], mentions: ['frost', 'haze'], 'rich-text-surface': ['resin', 'haze'],
  'helper-text': 'none', autocomplete: ['field', 'frost'], 'native-select': 'field',
  'date-time-picker': ['field', 'frost'], 'month-picker': ['frost', 'haze'], 'year-picker': ['frost', 'haze'],
  'digital-clock': ['frost', 'haze'], 'angle-slider': 'none', knob: 'none', 'mask-input': 'field',
  'json-input': 'field', 'color-area': 'none', 'color-slider': 'none', 'color-wheel': 'none',
  'color-swatch': 'none', 'color-swatch-picker': 'none', 'token-field': ['field', 'compact'],
  upload: ['control', 'haze'], 'upload-zone': 'haze',
  /* data display */
  card: 'haze', table: 'table', 'data-table': 'table', list: 'haze', 'description-list': 'haze',
  avatar: 'none', 'avatar-group': 'none', badge: 'compact', 'status-badge': 'status', indicator: 'indicator',
  image: 'haze', timeline: ['indicator', 'haze'], accordion: 'haze', collapse: 'none', spoiler: 'none',
  carousel: ['control', 'haze'], statistic: 'haze', code: 'none', kbd: 'compact', 'theme-icon': 'none',
  'authored-bubble': 'bubble', caption: 'stone', calendar: ['frost', 'haze'], 'data-view': 'haze',
  'virtual-scroller': 'none', 'image-list': 'haze', 'organization-chart': 'haze', 'rolling-number': 'none',
  'image-compare': 'drag-handle', marquee: 'none', 'overlay-badge': 'haze', 'navigation-tree': 'haze',
  'resizable-table': 'table', 'stat-card': 'haze', 'kpi-tile': 'haze', 'trend-indicator': 'none',
  'delta-badge': 'haze',
  /* feedback */
  alert: 'haze', toast: 'frost', notification: 'frost', progress: 'none', 'ring-progress': 'none',
  loader: 'none', skeleton: 'haze', 'loading-overlay': 'mirage', 'empty-state': 'haze', result: 'haze',
  popconfirm: 'frost', tour: ['frost', 'mirage'], 'semi-circle-progress': 'none', 'meter-group': 'none',
  banner: 'haze',
  /* overlays */
  dialog: ['dialog', 'mirage'], drawer: ['frost', 'mirage'], menu: 'frost', 'context-menu': 'frost',
  popover: 'frost', 'hover-card': 'frost', tooltip: 'frost', scrim: 'mirage', portal: 'none',
  'floating-window': 'resin-panel', 'overlay-arrow': 'none',
  /* typography */
  title: 'none', text: 'none', blockquote: 'haze', mark: 'none', prose: 'none', highlight: 'haze',
  'number-formatter': 'none', display: 'none', heading: 'none', lead: 'none', 'prose-list': 'none',
  'code-block': 'haze', truncate: 'none', cite: 'none', abbreviation: 'none', 'text-balance': 'none',
  'gradient-text': 'none',
  /* utility */
  'visually-hidden': 'none', 'skip-link': 'haze', 'focus-trap': 'none', transition: 'none',
  'direction-provider': 'none', 'theme-provider': 'none', 'reduced-effects': 'none', resizable: 'drag-handle',
  watermark: 'none', 'qr-code': 'haze', 'click-away': 'none', 'animate-on-scroll': 'none', 'no-ssr': 'none',
  'global-styles': 'plastic', terminal: 'none', 'border-beam': 'none', pressable: 'none', focusable: 'none',
  'drag-handle': 'drag-handle', 'drop-indicator': 'haze', virtualizer: 'none',
  'shared-element-transition': 'none', toolbar: 'resin', 'router-provider': 'none', 'ssr-provider': 'none',
  /* charts */
  'chart-surface': 'haze', 'bar-chart': 'none', 'line-chart': 'none', 'area-chart': 'none', 'pie-chart': 'none',
  'donut-chart': 'none', 'scatter-chart': 'none', 'radar-chart': 'none', 'spark-line': 'none', gauge: 'none',
  heatmap: 'none', 'funnel-chart': 'none', 'chart-legend': 'haze', 'chart-tooltip': 'frost',
  'calendar-heatmap': 'none', treemap: 'none', sankey: 'none', 'candlestick-chart': 'none',
  'waterfall-chart': 'none', 'bullet-chart': 'none', 'box-plot': 'none', histogram: 'none', 'geo-map': 'none',
  'network-graph': 'none',
  /* media */
  'video-player': ['resin', 'haze'], 'audio-player': ['resin', 'haze'], 'media-controls': 'resin-panel',
  gallery: ['haze', 'mirage'], lightbox: 'mirage',
  /* commerce */
  price: 'none', 'price-range': 'none', 'discount-badge': 'haze', 'quantity-stepper': 'field',
  'variant-selector': 'haze', 'stock-indicator': 'none', 'product-card': 'haze',
  'product-gallery': ['haze', 'mirage'], 'cart-item': 'haze', 'cart-summary': 'haze', 'coupon-input': 'field',
  'checkout-steps': 'haze', 'payment-method': 'haze', 'address-form': 'field', 'order-summary': 'haze',
  'shipping-selector': 'haze', 'delivery-estimate': 'none', 'wishlist-button': 'control', review: 'haze',
  'rating-summary': 'haze', 'filter-panel': ['frost', 'haze'], 'sort-select': 'field',
  'compare-table': 'table', 'recently-viewed': 'none',
  /* screens */
  screen: ['plastic', 'frost'], 'page-header': 'frost', 'view-stack': 'none', 'master-detail': ['frost', 'haze'],
  'split-view': 'none', 'command-bar': 'resin', 'status-bar': 'stone', workspace: ['plastic', 'frost'],
  'focus-mode': 'none', 'empty-screen': 'haze', 'error-screen': 'haze', 'loading-screen': 'none',
  'offline-screen': 'haze', 'not-found-screen': 'haze', 'permission-screen': 'haze',
  /* blocks */
  'dashboard-shell': ['plastic', 'frost', 'control'], 'metrics-row': 'none', 'analytics-panel': 'haze',
  'data-table-block': ['table', 'frost'], 'crud-form-block': ['frost', 'haze'], 'settings-block': 'haze',
  'auth-block': ['plastic', 'haze'], 'profile-block': 'haze', 'activity-feed': 'haze',
  'notification-centre': ['frost', 'haze'], 'player-shell': ['resin', 'haze'], 'playlist-block': 'haze',
  'storefront-block': 'none', 'product-detail-block': 'none', 'checkout-block': ['frost', 'haze'],
  'cart-drawer': ['frost', 'haze'], 'pricing-block': 'haze', 'onboarding-block': ['frost', 'mirage'],
  'search-block': ['frost', 'haze'], 'editor-block': ['frost', 'haze'],
};

/* -------------------------------------------------------------------- motion
   Added to whatever the entry already claims; duplicates are collapsed. Every
   row is one of the families in docs/motion-components.md — the family is
   named so the mapping can be checked against the table rather than trusted. */
const FIELD = ['field-focus', 'field-invalid', 'field-valid'];         // Input, textarea, validation group
const MENU = ['menu-in', 'menu-out'];                                   // Dropdown / select / command menu
const POPOVER = ['popover-in', 'popover-out'];                          // Popover / hover card
const ROWS = ['list-in', 'list-out'];                                   // List / table row / card / grid cell
const DISCLOSE = ['accordion-in', 'accordion-out'];                     // Accordion / disclosure / tree group
const PICKER = [...MENU, 'selection', 'page-in'];                       // Calendar / date picker / combobox
const DRAG = ['drag-pickup', 'drag-settle'];                            // Reordering / drag-and-drop
const PAGE = ['page-in', 'page-out'];                                   // Page/view
const MOTION = {
  /* navigation */
  'nav-rail': ['selection', 'page-in'], pagination: ['selection'], stepper: ['selection', 'page-in'],
  'bottom-navigation': ['selection', 'page-in'], 'navigation-menu': MENU, 'table-of-contents': ['selection'],
  menubar: MENU, submenu: MENU,
  /* actions */
  'button-group': ['press'], 'close-button': ['press'], 'action-bar': ['press'], 'speed-dial': ['press', ...MENU],
  /* inputs */
  'number-input': FIELD, 'password-input': FIELD, 'search-input': FIELD, select: [...FIELD, ...MENU],
  'multi-select': [...FIELD, ...MENU, ...ROWS], 'range-slider': ['slider-step'], rating: ['selection'],
  'pin-input': FIELD, 'tags-input': [...FIELD, ...ROWS], chip: ['selection', 'press'], 'color-input': FIELD,
  'date-input': FIELD, 'date-picker': [...FIELD, ...PICKER], 'date-range-picker': [...FIELD, ...PICKER],
  'time-input': FIELD, 'file-input': [...ROWS, 'progress-change'], cascader: [...FIELD, ...MENU],
  mentions: MENU, autocomplete: [...FIELD, ...MENU], 'native-select': [...FIELD, ...MENU],
  'date-time-picker': [...FIELD, ...PICKER], 'month-picker': ['selection', 'page-in'],
  'year-picker': ['selection', 'page-in'], 'digital-clock': ['selection'], 'angle-slider': ['slider-step'],
  knob: ['slider-step'], 'mask-input': FIELD, 'json-input': FIELD, 'color-area': ['slider-step'],
  'color-slider': ['slider-step'], 'color-wheel': ['slider-step'], 'color-swatch': ['selection'],
  'color-swatch-picker': ['selection'], 'token-field': [...FIELD, ...ROWS], upload: [...ROWS, 'progress-change'],
  'upload-zone': DRAG,
  /* data display */
  card: ROWS, table: [...ROWS, 'highlight'], 'data-table': [...ROWS, 'highlight'], badge: ['highlight', 'attention'],
  timeline: ['list-in'], spoiler: DISCLOSE, statistic: ['highlight'], calendar: ['selection', 'page-in'],
  'data-view': ROWS, 'image-list': ['media-in'], 'organization-chart': DISCLOSE, 'image-compare': DRAG,
  'overlay-badge': ['attention'], 'navigation-tree': DISCLOSE, 'resizable-table': [...ROWS, 'highlight', 'resize-settle'],
  'stat-card': ['highlight'], 'kpi-tile': ['highlight'], 'trend-indicator': ['highlight'], 'delta-badge': ['highlight'],
  /* feedback */
  'ring-progress': ['progress-change', 'success'], 'semi-circle-progress': ['progress-change'],
  'meter-group': ['progress-change'], result: ['success'], tour: POPOVER, banner: ['toast-in', 'toast-out', 'attention'],
  /* overlays */
  'context-menu': MENU, 'hover-card': POPOVER, 'floating-window': ['drawer-in', 'drawer-out'],
  /* typography */
  highlight: ['highlight'],
  /* utility */
  'drag-handle': DRAG,
  /* charts — marks are R-21's, deliberately unassigned; the legend and tooltip are ordinary components */
  'chart-legend': ['selection'], 'chart-tooltip': ['tooltip-in', 'tooltip-out'],
  /* media */
  'video-player': ['media-in'], 'audio-player': ['media-in'], gallery: ['media-in', 'caption-in', 'selection'],
  lightbox: ['media-in', 'caption-in'],
  /* commerce */
  'quantity-stepper': ['slider-step'], 'variant-selector': ['selection'], 'payment-method': ['selection'],
  'shipping-selector': ['selection'], 'product-card': ROWS, 'cart-item': ROWS, review: ROWS,
  'discount-badge': ['attention'], 'coupon-input': FIELD, 'sort-select': [...FIELD, ...MENU], 'address-form': FIELD,
  'checkout-steps': ['selection', 'page-in'], 'wishlist-button': ['press', 'selection'],
  'product-gallery': ['media-in', 'selection'], 'recently-viewed': ['list-in'],
  /* screens */
  'master-detail': PAGE, 'split-view': ['resize-settle'], 'focus-mode': PAGE, 'empty-screen': ['empty-in'],
  'error-screen': ['page-in'], 'offline-screen': ['page-in'], 'not-found-screen': ['page-in'],
  'permission-screen': ['page-in'], 'loading-screen': ['skeleton-resolve'],
  /* blocks */
  'activity-feed': ROWS, 'notification-centre': ['toast-in', 'toast-out', ...ROWS], 'playlist-block': [...ROWS, 'reorder'],
  'onboarding-block': PAGE, 'search-block': [...MENU, ...ROWS], 'cart-drawer': ['drawer-in', 'drawer-out'],
};

/* --------------------------------------------------------------------- prose
   Each sentence contradicted the specification it sits under. The old text is
   kept here so the correction is a diff rather than an overwrite. */
const PROSE = {
  /* docs/components.md: "the side menu on this page is the reference implementation" of
     selection — and that menu is Plastic. crystal-preview's own comment: "Menu entries are
     Plastic, not Resin. Resin is reserved for surfaces that float above everything, and a
     sidebar entry is furniture. Thirteen floating capsules would be exactly the legibility
     noise the hierarchy exists to prevent." Was: "Resin shell with Haze fill". */
  'nav-link': 'None of its own: a navigation entry is furniture on the panel beneath it. Selection is label weight alone; hover and the current entry take the surface-alt fill',
  /* R15e, at Meridian's direction: tooltip, popover, menu and toast moved to Frost, and the
     preview has rendered them so since 17 September 2026. Was: "Resin with Stone label backing". */
  tooltip: 'Frost, as every transient overlay is (R15e); the text sits directly on the panel',
  /* Was: "Resin surface with Haze rows". */
  menu: 'Frost panel with Haze rows (R15e)',
  /* Was: "Resin with Haze reading fill". */
  popover: 'Frost panel with Haze reading fill (R15e)',
  /* Was: "Resin with Haze reading fill and the clearest floating shadow". */
  toast: 'Frost panel with Haze reading fill and the panel shadow (R15e); status accent from the semantic pair',
  /* Was: "Resin surface with Haze reading fill". */
  notification: 'Frost panel with Haze reading fill (R15e)',
  /* Was: "Resin popover with Haze reading fill". */
  popconfirm: 'Frost panel with Haze reading fill (R15e)',
  /* docs/components.md, Indicators: "an indicator is Haze, not Resin … a Resin indicator would
     be the nested-Resin failure by another name". Was: "Resin shell with a 3px-inset Haze fill
     and a 1px feather on that fill". */
  indicator: 'Haze: a 20px circle painting the Haze fill on an isolated layer with a 1px feather; no Resin, because it sits on surfaces that are often already translucent',
};

/* --------------------------------------------------------------------- apply */
const asList = (v) => (Array.isArray(v) ? v : [v]);
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
const seen = new Set();
const report = { surfaced: 0, motionAdded: 0, proseCorrected: 0, unchanged: 0 };
const problems = [];

for (const file of files) {
  const full = path.join(DIR, file);
  const category = JSON.parse(fs.readFileSync(full, 'utf8'));
  let changed = false;
  for (const c of category.components) {
    seen.add(c.id);
    if (!(c.id in SURFACE)) { problems.push(`${c.id}: no surface assigned`); continue; }
    const surface = asList(SURFACE[c.id]);
    for (const s of surface) if (!SURFACES.includes(s)) problems.push(`${c.id}: surface "${s}" is not in surfaces.json`);
    if (JSON.stringify(c.surface) !== JSON.stringify(surface)) {
      if (c.surface) console.log(`  ${c.id}: surface ${JSON.stringify(c.surface)} → ${JSON.stringify(surface)}`);
      c.surface = surface; changed = true; report.surfaced += 1;
    }
    if (MOTION[c.id]) {
      for (const r of MOTION[c.id]) if (!RECIPES.has(r)) problems.push(`${c.id}: recipe "${r}" does not exist`);
      const merged = [...new Set([...(c.motion || []), ...MOTION[c.id]])];
      if (JSON.stringify(merged) !== JSON.stringify(c.motion || [])) {
        c.motion = merged; changed = true; report.motionAdded += 1;
      }
    }
    if (PROSE[c.id] && c.material !== PROSE[c.id]) {
      console.log(`  ${c.id}: material "${c.material}" → "${PROSE[c.id]}"`);
      c.material = PROSE[c.id]; changed = true; report.proseCorrected += 1;
    }
  }
  /* Field order is part of the entry's readability: surface sits beside material. */
  category.components = category.components.map((c) => {
    const { id, name, anatomy, states, material, surface, geometry, semantics, crystal, product, motion, parity, ...rest } = c;
    return Object.fromEntries(Object.entries({ id, name, anatomy, states, material, surface, geometry, semantics, crystal, product, motion, parity, ...rest })
      .filter(([, v]) => v !== undefined));
  });
  if (changed && WRITE) fs.writeFileSync(full, JSON.stringify(category, null, 2) + '\n');
  if (!changed) report.unchanged += 1;
}

for (const id of Object.keys(SURFACE)) if (!seen.has(id)) problems.push(`surface map names "${id}", which is not in the catalogue`);
for (const id of Object.keys(MOTION)) if (!seen.has(id)) problems.push(`motion map names "${id}", which is not in the catalogue`);
for (const id of Object.keys(PROSE)) if (!seen.has(id)) problems.push(`prose map names "${id}", which is not in the catalogue`);

if (problems.length) {
  console.error('Refusing to write:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(JSON.stringify({ ...report, entries: seen.size, wrote: WRITE }, null, 2));
if (!WRITE) console.log('Dry run. Pass --write to apply.');
