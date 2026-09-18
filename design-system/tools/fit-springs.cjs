/* Derive a spring for every motion recipe from its authored duration.
 *
 * The recipes already encode intent: how long a movement takes, and what it is
 * made of. This turns that intent into physics without changing it. Duration
 * stays the authority — the spring is fitted so its settling time reproduces
 * the duration that was already reviewed and approved — and the keyframes are
 * untouched. Nothing here may alter how a recipe looks with springs disabled.
 *
 * Damping is chosen by signature rather than per recipe, because the signature
 * is the material claim. "Inertia" that does not overshoot is not inertia, and
 * a "feather" that bounces is not a feather.
 *
 *   node tools/fit-springs.cjs          report the fit
 *   node tools/fit-springs.cjs --write  write springs into the recipes
 */
const fs = require('node:fs');
const path = require('node:path');
const spring = require('../assets/core/spring.js');

const FILE = path.resolve(__dirname, '../tokens/motion-recipes.json');
const WRITE = process.argv.includes('--write');

/* Damping ratio per signature. Below 1 the movement overshoots and reads as
   momentum; nearer 1 it arrives without bounce and reads as controlled. These
   are the material's character expressed as a number. */
const DAMPING = {
  inertia: 0.55,    // carries momentum; the overshoot IS the signature
  coalesce: 0.62,   // two bodies merging, with a rebound as they join
  pressure: 0.66,   // a control pushed and released
  torsion: 0.66,    // twisting release
  meniscus: 0.70,   // surface tension: resists, then snaps
  tension: 0.70,
  iris: 0.80,       // an aperture settling open
  refraction: 0.85, // light bending; almost no bounce
  caustic: 0.90,
  feather: 0.92,    // a soft edge must not bounce at all
};

const DEFAULT_DAMPING = 0.8;

/* Given a damping ratio and a target settling time, solve for the stiffness
   whose envelope decays to the rest threshold in that time, then refine by
   measurement. The closed form is a good first guess but the rest condition
   also tests velocity, so the exact answer is found by bisection. */
function fit(durationMs, zeta) {
  const targetMs = Math.max(1, durationMs);
  const seconds = targetMs / 1000;
  const guessOmega = -Math.log(spring.REST_DISPLACEMENT) / (zeta * seconds);

  const make = (omega) => ({
    stiffness: Number((omega * omega).toFixed(4)),
    damping: Number((2 * zeta * omega).toFixed(4)),
    mass: 1,
  });

  let low = guessOmega * 0.2;
  let high = guessOmega * 5;
  let best = make(guessOmega);

  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    const candidate = make(mid);
    const settle = spring.settleTime(candidate);
    best = candidate;
    if (settle > targetMs) low = mid;   // too slow: stiffen
    else high = mid;                    // too fast: soften
  }
  return best;
}

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const rows = [];
let worst = 0;

for (const recipe of data.recipes) {
  /* Travelling loops are linear by definition; fitting a spring to one would
     invent physics it does not have. */
  if (recipe.loop && recipe.direction === 'normal') { delete recipe.spring; continue; }
  const zeta = DAMPING[recipe.signature] ?? DEFAULT_DAMPING;
  const fitted = fit(recipe.duration, zeta);
  const settle = spring.settleTime(fitted);
  const driftPct = Math.abs(settle - recipe.duration) / recipe.duration * 100;
  worst = Math.max(worst, driftPct);

  rows.push({
    id: recipe.id,
    signature: recipe.signature,
    duration: recipe.duration,
    settle,
    driftPct: Number(driftPct.toFixed(2)),
    dampingRatio: zeta,
    overshoot: Number((spring.peakOvershoot(fitted) * 100).toFixed(1)),
  });

  if (WRITE) {
    recipe.spring = {
      ...fitted,
      dampingRatio: zeta,
      /* Recorded so a platform library does not have to re-derive it and
         drift. The web values remain authoritative. */
      platform: spring.toPlatform(fitted),
    };
  }
}

if (WRITE) {
  data.springPolicy =
    'Every recipe carries a spring fitted to its authored duration, which remains the ' +
    'authority. Damping ratio is chosen by signature: inertia and coalesce overshoot ' +
    'because momentum is their material claim, feather and caustic do not because a soft ' +
    'edge that bounces is wrong. Disabling springs must reproduce the keyframes exactly.';
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
}

console.log(JSON.stringify({
  recipes: rows.length,
  worstDriftPct: Number(worst.toFixed(2)),
  wrote: WRITE,
  sample: rows.slice(0, 6),
  overshootBySignature: Object.fromEntries(
    Object.keys(DAMPING).map((sig) => {
      const first = rows.find((r) => r.signature === sig);
      return [sig, first ? `${first.overshoot}%` : 'unused'];
    })),
}, null, 2));
