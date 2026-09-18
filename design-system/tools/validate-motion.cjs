const assert=require('node:assert/strict'),fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('tokens/motion-recipes.json','utf8')),ids=new Set();
/* Every recipe must carry a spring whose settling time reproduces the authored
   duration. Duration stays the authority: the spring is fitted to it, so a
   disagreement means someone changed one without the other. */
const spring=require('../assets/core/spring.js');
const SPRING_TOLERANCE=0.15;

/* A fluid is incompressible. Squeeze it on one axis and it must expand on the
   other by exactly the reciprocal, or it is not liquid — it is rubber losing
   volume, which is precisely how the 1.x deformations read. */
const AREA_TOLERANCE=0.005;
/* A recipe whose keyframes are all identical occupies a duration and a spring and
   animates nothing. Eleven of the fifty-four shipped that way — [{opacity:1},{opacity:1}]
   placeholders that passed every check, because the only keyframe contract was that there
   were at least two of them. Counting keyframes is not the same as requiring movement.

   The test is that *some* keyframe differs, not that the first differs from the last: a
   pulse (press) and a shake (field-invalid) correctly return to where they started. */
const withoutOffset=frame=>{const{offset,...rest}=frame;return JSON.stringify(rest);};
for(const recipe of data.recipes){
  assert(recipe.spring,recipe.id+' has no spring; run tools/fit-springs.cjs --write');
  assert(new Set(recipe.keyframes.map(withoutOffset)).size>1,
    recipe.id+' has no movement: every keyframe is identical, so it animates nothing');
  const settle=spring.settleTime(recipe.spring);
  const drift=Math.abs(settle-recipe.duration)/recipe.duration;
  assert(drift<=SPRING_TOLERANCE,recipe.id+' spring settles in '+settle+'ms but is authored at '+recipe.duration+'ms');
  for(const frame of recipe.keyframes){
    for(const match of (frame.transform||'').matchAll(/scale\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g)){
      const area=Number(match[1])*Number(match[2]);
      assert(Math.abs(area-1)<=AREA_TOLERANCE,
        recipe.id+' deformation "'+match[0]+'" has area '+area.toFixed(4)+'; a fluid conserves volume');
    }
  }
assert(!ids.has(recipe.id),'Duplicate recipe '+recipe.id);ids.add(recipe.id);assert(recipe.duration>0&&recipe.duration<=2000);assert(['Motion','GSAP'].includes(recipe.engine));assert(recipe.use&&recipe.reduced&&recipe.material&&recipe.signature);assert(recipe.keyframes.length>=2);for(const frame of recipe.keyframes){for(const match of (frame.transform||'').matchAll(/translate[XYZ]?\((-?[\d.]+)px/g))assert(Math.abs(Number(match[1]))<=50||recipe.travelException,recipe.id+' requires a documented large-travel exception');}}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8')),lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
assert.equal(pkg.dependencies.motion,'13.4.0');assert.equal(pkg.dependencies.gsap,'3.15.0');assert.equal(lock.packages['node_modules/motion'].version,pkg.dependencies.motion);assert.equal(lock.packages['node_modules/gsap'].version,pkg.dependencies.gsap);
assert(fs.statSync('assets/vendor/crystal-engines.js').size>1000,'Missing real engine bundle');

/* The browser reads assets/motion-catalog.js, not the JSON. They are the same
   data through a generator, so they can silently diverge: correcting a recipe
   and forgetting `npm run build:motion` leaves the page serving the old
   motion while every source-level check passes. That happened once during the
   incompressibility work and was caught in the browser rather than here. */
const catalogText=fs.readFileSync('assets/motion-catalog.js','utf8');
const catalog=JSON.parse(catalogText.replace(/^window\.CRYSTAL_MOTION_RECIPES = /,'').replace(/;\s*$/,''));
assert.deepEqual(catalog,data.recipes,
  'assets/motion-catalog.js is stale; run: npm run build:motion');

const result={recipes:ids.size,categories:new Set(data.recipes.map(r=>r.category)).size,engines:pkg.dependencies,staticContracts:'passed'};
fs.writeFileSync('validation/motion-static-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
