/* Make every deformation conserve volume.
 *
 * A fluid is incompressible: squeezed on one axis it expands on the other by
 * exactly the reciprocal. Seventeen keyframes across seven recipes broke that,
 * by as much as 13.75%, which is why the 1.x deformations read as rubber being
 * crushed rather than liquid moving. The geometry was wrong; no easing work
 * could have fixed it.
 *
 * The correction divides both axes by the square root of the area. That
 * conserves volume while preserving the deformation's aspect ratio exactly, so
 * the designed character of each movement is untouched and only the physical
 * error is removed. Keeping one axis and deriving the other would also conserve
 * volume, but it would change how the deformation looks, which the standing
 * constraint does not permit.
 *
 *   node tools/fix-incompressibility.cjs          report
 *   node tools/fix-incompressibility.cjs --write  correct the recipes
 */
const fs = require('node:fs');
const path = require('node:path');

const FILE = path.resolve(__dirname, '../tokens/motion-recipes.json');
const WRITE = process.argv.includes('--write');
const TOLERANCE = 0.005;

const round = (n) => Number(n.toFixed(4));

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const corrections = [];

for (const recipe of data.recipes) {
  for (const frame of recipe.keyframes) {
    if (!frame.transform) continue;
    frame.transform = frame.transform.replace(
      /scale\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g,
      (whole, sxRaw, syRaw) => {
        const sx = Number(sxRaw);
        const sy = Number(syRaw);
        const area = sx * sy;
        if (Math.abs(area - 1) <= TOLERANCE) return whole;
        const k = Math.sqrt(area);
        const nx = round(sx / k);
        const ny = round(sy / k);
        corrections.push({
          recipe: recipe.id,
          signature: recipe.signature,
          from: whole,
          to: `scale(${nx},${ny})`,
          areaBefore: round(area),
          areaAfter: round(nx * ny),
          aspectBefore: round(sx / sy),
          aspectAfter: round(nx / ny),
        });
        return `scale(${nx},${ny})`;
      },
    );
  }
}

if (WRITE && corrections.length) {
  data.incompressibility =
    'Deformations conserve volume: every scale(sx, sy) satisfies sx*sy = 1 within 0.005. ' +
    'Corrected by dividing both axes by the square root of the area, which preserves each ' +
    'deformation\'s aspect ratio exactly and removes only the compressibility error. ' +
    'Enforced by tools/validate-motion.cjs.';
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
}

const aspectDrift = corrections.filter((c) => Math.abs(c.aspectBefore - c.aspectAfter) > 0.001);

console.log(JSON.stringify({
  corrections: corrections.length,
  recipesAffected: [...new Set(corrections.map((c) => c.recipe))],
  worstAreaError: corrections.length
    ? round(Math.max(...corrections.map((c) => Math.abs(c.areaBefore - 1))) * 100) + '%'
    : '0%',
  aspectRatiosChanged: aspectDrift.length,
  wrote: WRITE,
  detail: corrections,
}, null, 2));

/* The correction is only legitimate if it left every aspect ratio alone. */
if (aspectDrift.length) {
  console.error('An aspect ratio changed; that is a redesign, not a correction.');
  process.exit(1);
}
