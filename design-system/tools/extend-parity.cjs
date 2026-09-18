/* Extend parity.json with the components the four React benchmarks ship that
 * Crystal's catalogue did not yet name.
 *
 * The 119-component catalogue was measured against Mantine, Ant Design and MUI.
 * Meridian added PrimeReact and MUI's X add-ons, which is where the real gaps
 * are: an entire charting surface, the picker variants, and the data-presentation
 * components that ship as extensions elsewhere.
 *
 * The candidate list was computed, not guessed — every benchmark package was
 * installed and its component directories enumerated. What is NOT here is as
 * deliberate as what is: MUI composes from anatomy parts (CardHeader, TableCell,
 * StepLabel, ChartsAxis) and date-library adapters (AdapterDayjs, AdapterLuxon).
 * Those are parts and plumbing, not catalogue entries; Crystal names components.
 *
 *   node tools/extend-parity.cjs          report
 *   node tools/extend-parity.cjs --write  apply
 */
const fs = require('node:fs');
const path = require('node:path');

const FILE = path.resolve(__dirname, '../../libraries/parity.json');
const WRITE = process.argv.includes('--write');

/* id, name, category, and the benchmark that establishes the claim. */
const ADDITIONS = [
  // A charting surface. Crystal named none, and all four benchmarks ship one.
  ['chart-surface', 'Chart surface', 'charts', 'mui-x-charts'],
  ['bar-chart', 'Bar chart', 'charts', 'mui-x-charts, primereact'],
  ['line-chart', 'Line chart', 'charts', 'mui-x-charts, primereact'],
  ['area-chart', 'Area chart', 'charts', 'mantine'],
  ['pie-chart', 'Pie chart', 'charts', 'mui-x-charts, primereact'],
  ['donut-chart', 'Donut chart', 'charts', 'mantine'],
  ['scatter-chart', 'Scatter chart', 'charts', 'mui-x-charts'],
  ['radar-chart', 'Radar chart', 'charts', 'mui-x-charts, primereact'],
  ['spark-line', 'Spark line', 'charts', 'mui-x-charts, mantine'],
  ['gauge', 'Gauge', 'charts', 'mui-x-charts'],
  ['heatmap', 'Heatmap', 'charts', 'mui-x-charts'],
  ['funnel-chart', 'Funnel chart', 'charts', 'mui-x-charts'],
  ['chart-legend', 'Chart legend', 'charts', 'mui-x-charts'],
  ['chart-tooltip', 'Chart tooltip', 'charts', 'mui-x-charts'],

  // Picker variants that are separate components elsewhere.
  ['date-time-picker', 'Date and time picker', 'inputs', 'mui-x-date-pickers, primereact'],
  ['month-picker', 'Month picker', 'inputs', 'mui-x-date-pickers'],
  ['year-picker', 'Year picker', 'inputs', 'mui-x-date-pickers'],
  ['digital-clock', 'Digital clock', 'inputs', 'mui-x-date-pickers'],
  ['calendar', 'Calendar', 'data-display', 'mui-x-date-pickers, primereact'],

  // Inputs the benchmarks ship that Crystal had not named.
  ['angle-slider', 'Angle slider', 'inputs', 'mantine'],
  ['knob', 'Knob', 'inputs', 'primereact'],
  ['mask-input', 'Mask input', 'inputs', 'mantine, primereact'],
  ['json-input', 'JSON input', 'inputs', 'mantine'],
  ['autocomplete', 'Autocomplete', 'inputs', 'antd, mui'],
  ['native-select', 'Native select', 'inputs', 'mantine, mui'],

  // Data presentation.
  ['data-view', 'Data view', 'data-display', 'primereact'],
  ['virtual-scroller', 'Virtual scroller', 'data-display', 'primereact'],
  ['masonry', 'Masonry', 'layout', 'antd, mui'],
  ['image-list', 'Image list', 'data-display', 'mui, primereact'],
  ['organization-chart', 'Organization chart', 'data-display', 'primereact'],
  ['table-of-contents', 'Table of contents', 'navigation', 'mantine'],
  ['overflow-list', 'Overflow list', 'layout', 'mantine'],
  ['highlight', 'Highlight', 'typography', 'mantine'],
  ['number-formatter', 'Number formatter', 'typography', 'mantine'],
  ['rolling-number', 'Rolling number', 'data-display', 'mantine'],
  ['image-compare', 'Image compare', 'data-display', 'primereact'],
  ['marquee', 'Marquee', 'data-display', 'mantine'],

  // Navigation and chrome.
  ['app-bar', 'App bar', 'layout', 'mui'],
  ['bottom-navigation', 'Bottom navigation', 'navigation', 'mui'],
  ['navigation-menu', 'Navigation menu', 'navigation', 'primereact, antd'],
  ['tour', 'Tour', 'feedback', 'antd, primereact'],

  // Feedback and overlays.
  ['overlay-badge', 'Overlay badge', 'data-display', 'primereact'],
  ['semi-circle-progress', 'Semi-circle progress', 'feedback', 'mantine'],
  ['meter-group', 'Meter group', 'feedback', 'primereact'],
  ['floating-window', 'Floating window', 'overlays', 'mantine'],
  ['action-bar', 'Action bar', 'actions', 'mantine'],
  ['speed-dial', 'Speed dial', 'actions', 'mui, primereact'],

  // Utility.
  ['watermark', 'Watermark', 'utility', 'antd'],
  ['qr-code', 'QR code', 'utility', 'antd'],
  ['click-away', 'Click away', 'utility', 'mui'],
  ['animate-on-scroll', 'Animate on scroll', 'utility', 'primereact'],
  ['no-ssr', 'No SSR', 'utility', 'mui'],
  ['global-styles', 'Global styles', 'utility', 'mui, mantine'],
];

/* Named so the catalogue records the decision rather than silently omitting
   them. A Crystal library is not expected to ship these. */
const NOT_APPLICABLE = [
  ['terminal', 'Terminal', 'utility', 'primereact',
    'A shell emulator is an application, not a design-system component.'],
  ['border-beam', 'Border beam', 'utility', 'antd',
    'A travelling border highlight. Crystal already specifies this behaviour as the Resin optical rim and the Haze/Stone ambient edge; a second, unrelated mechanism would contradict the material spec.'],
];

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const existing = new Set(data.components.map((c) => c.id));
const platforms = data.platforms;

const blank = (status) => Object.fromEntries(platforms.map((p) => [p, status]));
const added = [];

for (const [id, name, category, benchmark] of ADDITIONS) {
  if (existing.has(id)) continue;
  data.components.push({ id, name, category, benchmark, status: blank('not-started') });
  added.push(id);
}
for (const [id, name, category, benchmark, why] of NOT_APPLICABLE) {
  if (existing.has(id)) continue;
  data.components.push({ id, name, category, benchmark, why, status: blank('not-applicable') });
  added.push(id + ' (not-applicable)');
}

data.benchmarks = ['mantine', 'mui', 'mui-x', 'antd', 'primereact'];
data.totals = { components: data.components.length };
const order = ['layout', 'navigation', 'actions', 'inputs', 'data-display', 'charts', 'feedback', 'overlays', 'typography', 'utility'];
data.components.sort((a, b) => (order.indexOf(a.category) - order.indexOf(b.category)) || a.id.localeCompare(b.id));

if (!added.length) { console.log('parity.json already carries every addition.'); process.exit(0); }
console.log(`${added.length} components to add, taking the catalogue to ${data.components.length}:`);
for (const id of added) console.log('  +', id);
if (WRITE) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
  console.log('\nWritten.');
} else {
  console.log('\nRe-run with --write to apply.');
}
