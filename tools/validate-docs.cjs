/* Catch documentation that has drifted from the sources it describes.
 *
 * Generated regions cannot drift, because `tools/build-reference.cjs` rewrites them.
 * Prose quotes values too: "an 80% content fill with a 1.95px feather", "Motion
 * 13.4.0". Generating those inline would damage the writing, so this asserts that
 * every value the prose quotes is still the value that ships.
 *
 * The check is one-directional: if a token says 40px, the chapter that documents that
 * material must contain "40px" somewhere. Change the token without touching the prose
 * and this fails. It cannot catch a quoted value in a sentence that has become wrong
 * for some other reason.
 */
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const doc = name => fs.readFileSync(path.join(ROOT, 'core/docs', name), 'utf8');

const failures = [];
/* Counted rather than declared, so the total always matches the checks that
   ran. The number is published in `validation/doc-drift-checks.json`. */
let checked = 0;
const expect = (where, needle, why) => {
  checked += 1;
  if (!doc(where).includes(needle)) failures.push(`docs/${where}: no mention of ${needle} — ${why}`);
};

/* Material recipe values. These are the numbers Crystal may never let drift. */
const m = read('core/tokens/crystal.json').material;
const pct = v => `${Math.round(v * 100)}%`;
for (const [needle, why] of [
  [`${m.acrylicBlur}px`, 'Frost diffusion (primitive.material.acrylicBlur)'],
  [`${m.acrylicSaturation}%`, 'Frost saturation'],
  [`${m.glassBlur}px`, 'Resin diffusion'],
  [`${m.glassSaturation}%`, 'Resin saturation'],
  [pct(m.glassOpacity), 'Resin fill, fixed by the material'],
  [pct(m.contentOpacity), 'Haze content fill'],
  [`${m.contentFeather}px`, 'Haze feather'],
  [pct(m.labelVeil), 'Stone fill, light mode'],
  [pct(m.labelVeilDark), 'Stone fill, dark mode'],
  [`${m.mirageBlur}px`, 'Mirage diffusion'],
]) expect('materials.md', needle, why);

/* Engine versions, stated in two chapters. */
/* Read from the published manifest, because the documentation quotes the
   versions a consumer installs, which can differ from the workspace's. */
const pkg = read('core/package.json');
for (const where of ['adoption.md', 'motion-components.md']) {
  expect(where, `Motion ${pkg.dependencies.motion}`, 'the pinned Motion version');
  expect(where, `GSAP ${pkg.dependencies.gsap}`, 'the pinned GSAP version');
}

/* Counts that prose states in words. */
const recipes = read('core/tokens/motion-recipes.json').recipes.length;
const categories = new Set(read('core/tokens/motion-recipes.json').recipes.map(r => r.category)).size;
expect('motion-components.md', `${recipes} executable component recipes`, 'the recipe count');
expect('accessibility.md', `${recipes} motion recipes`, 'the recipe count');
const words = { 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve' };
if (words[categories]) {
  expect('motion-components.md', `${words[categories]} families`, 'the category count');
}

/* The contrast figure, from the executed run rather than from memory. */
const checks = read('validation/token-checks.json');
expect('accessibility.md', checks.checks.toLocaleString(), 'the number of contrast cases actually computed');

/* The focus halo, quoted in prose. The generated table beneath it is built from
   the exported theme and cannot drift; the sentence above it is hand-written and
   once still described the withdrawn 2/6/12/22 spreads (D-11). Every
   blur/spread pair the theme exports must appear in the sentence. */
{
  const theme = fs.readFileSync(path.join(ROOT, 'core/assets/crystal-theme.css'), 'utf8');
  const ring = /--cr-focus-ring:\s*([^;]+);/.exec(theme);
  const layers = ring ? ring[1].split(/,(?![^(]*\))/) : [];
  if (layers.length === 0) {
    failures.push('core/assets/crystal-theme.css: no --cr-focus-ring to read, so the prose was not checked at all');
  }
  for (const layer of layers) {
    const halo = /^\s*0\s+0\s+(\d+)px\s+(\d+)px/.exec(layer);
    if (halo) {
      expect('components.md', `${halo[1]}px / ${halo[2]}px`,
        `a focus halo layer the theme exports (blur ${halo[1]}px, spread ${halo[2]}px)`);
      continue;
    }
    /* The two elevation layers are checked as well. They have a y-offset and
       no spread, so they are quoted as offset/blur. */
    const lift = /^\s*0\s+(\d+)px\s+(\d+)px/.exec(layer);
    if (lift) {
      expect('components.md', `${lift[1]}px / ${lift[2]}px`,
        `a focus elevation layer the theme exports (offset ${lift[1]}px, blur ${lift[2]}px)`);
      continue;
    }
    failures.push(`core/assets/crystal-theme.css: unreadable --cr-focus-ring layer "${layer.trim()}" — `
      + 'it is neither a halo nor an elevation layer, so nothing in the prose was held to it');
  }
}

const report = { suite: 'documentation drift', checks: checked, failures };
fs.writeFileSync(path.join(ROOT, 'validation/doc-drift-checks.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(failures.length ? 1 : 0);
