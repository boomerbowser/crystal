/* Vendor and normalise Crystal's icon set.
 *
 * Icons are content, not a build dependency: they are normalised once and
 * committed, so the package and every library get them without a package
 * manager. The source is a devDependency used only to produce them.
 *
 * Crystal's own thirteen symbols are original work and are authoritative. A
 * sourced icon never replaces one of them, even where the names collide.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'node_modules/lucide-static/icons');
const OUT = path.join(ROOT, 'core/assets/icons');
const MANIFEST = path.join(OUT, 'manifest.json');
const SPRITE = path.join(ROOT, 'core/assets/icons.svg');
const LICENSE_OUT = path.join(ROOT, 'core/licenses/lucide-LICENSE.txt');

const TARGET = 1000;

/* Crystal's original symbols. These are drawn for Crystal and stay in the
   sprite unchanged; the vendored set must never overwrite them. */
const ORIGINAL = ['crystal', 'layers', 'document', 'directions', 'workspace',
  'conversation', 'library', 'check', 'attention', 'alert', 'info', 'sparkle', 'chevron'];

/* Excluded wholesale: third-party marks carry their own trademark terms that a
   design system must not relicense, and directional/numeric variants multiply
   the set without adding vocabulary. */
const EXCLUDE_EXACT = new Set(['lucide', 'lucide-lab']);
const EXCLUDE_PATTERNS = [
  /^(brand-|logo-)/,
  /-(1|2|3|4|5|6|7|8|9|0)$/,
  /^(square|circle)-(arrow|chevron)-/,
  /-(dashed|dotted)$/,
];

/* Recognisable brand marks present in the source set. Listed explicitly rather
   than pattern-matched, because a pattern would also catch ordinary nouns. */
const BRANDS = new Set(['github', 'gitlab', 'chrome', 'codepen', 'codesandbox', 'figma',
  'framer', 'slack', 'trello', 'twitch', 'twitter', 'youtube', 'linkedin', 'facebook',
  'instagram', 'dribbble', 'bitcoin', 'apple', 'nfc', 'webhook', 'php', 'rss']);

/* Icons a Crystal vocabulary needs, kept whatever the slice below picks and
   whatever the exclusions say (D-35). These are the rich text surface's format
   vocabulary (the catalogue's `rich-text-surface` and `prose`) that the slice
   missed: the link, both lists, the quotation, subscript, history, and the
   three heading levels, which the numeric-suffix rule above would drop. A
   library draws these from the set, never by hand. */
const REQUIRED = ['heading-2', 'heading-3', 'heading-4', 'link', 'list', 'list-ordered',
  'quote', 'redo', 'subscript', 'undo', 'unlink'];

function isWanted(name) {
  if (EXCLUDE_EXACT.has(name) || BRANDS.has(name)) return false;
  return !EXCLUDE_PATTERNS.some((p) => p.test(name));
}

/* Reduce a sourced SVG to the path geometry only. Crystal's stylesheet supplies
   stroke width, caps, joins and currentColor, so carrying them per file would
   duplicate the contract in 1000 places and let them drift. */
function normalise(svg) {
  const inner = svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
  if (!inner) return null;
  if (/stroke-width|stroke=|fill="(?!none)/.test(inner)) {
    /* A shape carrying its own stroke or fill would ignore Crystal's contract. */
    return inner.replace(/\s(stroke-width|stroke|fill)="[^"]*"/g, '');
  }
  return inner;
}

function titleCase(name) {
  return name.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

if (!fs.existsSync(SOURCE)) {
  console.error(`Icon source not found: ${SOURCE}\nRun: npm install --save-dev lucide-static`);
  process.exit(1);
}

const available = fs.readdirSync(SOURCE)
  .filter((f) => f.endsWith('.svg'))
  .map((f) => f.replace(/\.svg$/, ''))
  .filter(isWanted)
  .sort();

/* Deterministic curation: take an evenly distributed slice of the alphabetical
   set so the result is reproducible and not biased toward early letters. */
const step = available.length / TARGET;
const chosen = step <= 1
  ? available
  : Array.from({ length: TARGET }, (_, i) => available[Math.floor(i * step)]);

const missing = REQUIRED.filter((n) => !fs.existsSync(path.join(SOURCE, `${n}.svg`)));
if (missing.length) {
  console.error(`Required icons not in the source set: ${missing.join(', ')}`);
  process.exit(1);
}
const selected = [...new Set([...chosen, ...REQUIRED])].filter((n) => !ORIGINAL.includes(n)).sort();

/* Icon identifiers in the manifest are public contract (adoption chapter), so
   an icon leaves the set only in a major version, and never silently. Every
   change against the committed manifest is reported; a removal is refused
   unless --allow-removals is passed for a major release. */
const previous = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).icons.filter((e) => e.source === 'lucide').map((e) => e.id)
  : [];
const leaving = previous.filter((n) => !selected.includes(n));
const arriving = previous.length ? selected.filter((n) => !previous.includes(n)) : [];
if (leaving.length && !process.argv.includes('--allow-removals')) {
  console.error(`Refusing to remove ${leaving.length} icon(s), which only a major version may do: ${leaving.join(', ')}`);
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const entries = [];
let skipped = 0;
for (const name of selected) {
  const raw = fs.readFileSync(path.join(SOURCE, `${name}.svg`), 'utf8');
  const inner = normalise(raw);
  if (!inner) { skipped += 1; continue; }
  const file = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>\n`;
  fs.writeFileSync(path.join(OUT, `${name}.svg`), file);
  entries.push({ id: name, name: titleCase(name), source: 'lucide', license: 'ISC' });
}

/* Crystal's originals are recorded in the manifest and read from the sprite. */
const spriteText = fs.readFileSync(SPRITE, 'utf8');
for (const name of ORIGINAL) {
  if (!spriteText.includes(`id="${name}"`)) {
    console.error(`Original symbol missing from the sprite: ${name}`);
    process.exit(1);
  }
  entries.push({ id: name, name: titleCase(name), source: 'crystal', license: 'original' });
}
entries.sort((a, b) => a.id.localeCompare(b.id));

fs.writeFileSync(MANIFEST, JSON.stringify({
  $description:
    'Crystal icon set. Every icon is a 24px view box with 1.8px strokes, round caps and ' +
    'joins, and currentColor, so it inherits tested foreground colours. Stroke width, caps ' +
    'and joins are supplied by the stylesheet and are deliberately absent from the files.',
  grid: { viewBox: '0 0 24 24', strokeWidth: 1.8, linecap: 'round', linejoin: 'round' },
  total: entries.length,
  required: REQUIRED,
  sources: {
    crystal: { count: entries.filter((e) => e.source === 'crystal').length, license: 'Original work' },
    lucide: { count: entries.filter((e) => e.source === 'lucide').length, license: 'ISC', notice: 'core/licenses/lucide-LICENSE.txt' },
  },
  icons: entries,
}, null, 2) + '\n');

/* Carry the upstream licence into the package. */
const licenseSource = path.join(ROOT, 'node_modules/lucide-static/LICENSE');
fs.mkdirSync(path.dirname(LICENSE_OUT), { recursive: true });
fs.copyFileSync(licenseSource, LICENSE_OUT);

console.log(JSON.stringify({
  available: available.length,
  vendored: entries.filter((e) => e.source === 'lucide').length,
  original: entries.filter((e) => e.source === 'crystal').length,
  total: entries.length,
  skipped,
  arriving,
  leaving,
}, null, 2));
