const assert=require('node:assert/strict'),fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('core/tokens/motion-recipes.json','utf8')),ids=new Set();
/* Every recipe must carry a spring whose settling time reproduces the authored
   duration. Duration stays the authority: the spring is fitted to it, so a
   disagreement means someone changed one without the other. */
const spring=require('../core/assets/core/spring.js');
const SPRING_TOLERANCE=0.15;

/* A fluid is incompressible. Squeezed on one axis, it must expand on the other
   by exactly the reciprocal; otherwise it reads as rubber losing volume, as the
   1.x deformations did. */
const AREA_TOLERANCE=0.005;
/* A recipe whose keyframes are all identical occupies a duration and a spring and
   animates nothing. Eleven of the fifty-four once shipped as [{opacity:1},{opacity:1}]
   placeholders. Requiring at least two keyframes does not catch it, so this requires movement.

   The test is that some keyframe differs from the others. The first and last may match:
   a pulse (press) and a shake (field-invalid) correctly return to where they started. */
const withoutOffset=frame=>{const{offset,...rest}=frame;return JSON.stringify(rest);};
/* The one period every continuous indicator shares. It is a published token, so
   "two indicators never tick against each other" is checked against the value
   a platform library reads rather than against a number written here. */
const FLOW=JSON.parse(fs.readFileSync('core/tokens/crystal.json','utf8')).motion.flow;
assert(Number.isFinite(FLOW)&&FLOW>0,'motion.flow is missing from core/tokens/crystal.json');
/* Only these may repeat. A loop anywhere else is ambient motion (what a surface
   does at rest), which Meridian withdrew from 2.0. This check keeps it out. */
const CONTINUOUS=new Set(['activity-turn','activity-travel','skeleton-sweep']);
for(const id of CONTINUOUS)assert(data.recipes.some(r=>r.id===id&&r.loop),id+' is listed as continuous but no looping recipe has that id');
for(const recipe of data.recipes){
  /* A travelling loop moves at constant speed around a perimeter. There is no
     displacement returning to rest, so there is no spring to fit, and its
     easing is linear. Every other recipe is a damped oscillator and must carry
     its spring. */
  const travelling = recipe.loop && recipe.direction === 'normal';
  assert(new Set(recipe.keyframes.map(withoutOffset)).size>1,
    recipe.id+' has no movement: every keyframe is identical, so it animates nothing');
  if (recipe.loop) {
    assert(CONTINUOUS.has(recipe.id),
      recipe.id+' loops, and only a continuous indicator of pending work may: anything else that repeats is ambient motion');
    assert(travelling, recipe.id+' is continuous and must travel (direction "normal"), not rock back and forth at rest');
    assert.equal(recipe.duration,FLOW,
      recipe.id+' runs at '+recipe.duration+'ms; every continuous indicator shares motion.flow ('+FLOW+'ms)');
  }
  if (recipe.overshoot!==undefined) {
    assert.equal(recipe.overshoot,'never',recipe.id+' declares overshoot "'+recipe.overshoot+'"; the only declaration is "never"');
    assert(recipe.spring&&spring.peakOvershoot(recipe.spring)===0&&spring.dampingRatio(recipe.spring)>=1-1e-9,
      recipe.id+' shows data and must be critically damped; its spring overshoots. Run tools/fit-springs.cjs --write');
  }
  if (recipe.stagger!==undefined) {
    const {step,maxMarks}=recipe.stagger;
    assert(Number.isInteger(step)&&step>0, recipe.id+' stagger.step must be a positive whole number of milliseconds');
    assert(Number.isInteger(maxMarks)&&maxMarks>1, recipe.id+' stagger.maxMarks must be a whole number above 1');
    /* The whole sequence is the transition somebody waits through, so the last
       mark to arrive is held to the same ceiling as a single one. */
    assert(step*(maxMarks-1)+recipe.duration<=2000,
      recipe.id+' staggers '+maxMarks+' marks at '+step+'ms: the last arrives at '+(step*(maxMarks-1)+recipe.duration)+'ms, past the 2000ms ceiling');
  }
  if (travelling) {
    /* Exempt from the spring contract only. Every other rule below still
       applies, so this branch must not skip the rest of the loop. */
    assert(!recipe.spring, recipe.id+' is a travelling loop and must not carry a spring');
    assert(recipe.easing === 'linear', recipe.id+' travels, so its easing must be linear');
  } else {
    assert(recipe.spring, recipe.id+' has no spring; run tools/fit-springs.cjs --write');
    const settle=spring.settleTime(recipe.spring);
    const drift=Math.abs(settle-recipe.duration)/recipe.duration;
    assert(drift<=SPRING_TOLERANCE,recipe.id+' spring settles in '+settle+'ms but is authored at '+recipe.duration+'ms');
  }
  for(const frame of recipe.keyframes){
    for(const match of (frame.transform||'').matchAll(/scale\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g)){
      const area=Number(match[1])*Number(match[2]);
      assert(Math.abs(area-1)<=AREA_TOLERANCE,
        recipe.id+' deformation "'+match[0]+'" has area '+area.toFixed(4)+'; a fluid conserves volume');
    }
  }
assert(!ids.has(recipe.id),'Duplicate recipe '+recipe.id);ids.add(recipe.id);/* Crystal's 5000ms ceiling protects responsiveness: nobody may be stranded
   inside a transition. A loop never blocks an interaction or gates a state
   change, so nobody waits through it, and its limit is set by how it reads.
   Two seconds suits a gesture that repeats in place, like a breath. A gesture
   that travels a full perimeter at that speed reads as a spinner instead of
   light moving over a surface. A travelling recipe declares itself and gets
   the wider bound. */
const ceiling = recipe.loop && recipe.direction === 'normal' ? 8000 : 2000;
assert(recipe.duration>0&&recipe.duration<=ceiling,
  recipe.id+' duration '+recipe.duration+'ms exceeds the '+ceiling+'ms limit for its kind');assert(['Motion','GSAP'].includes(recipe.engine));assert(recipe.use&&recipe.reduced&&recipe.material&&recipe.signature);assert(recipe.keyframes.length>=2);for(const frame of recipe.keyframes){for(const match of (frame.transform||'').matchAll(/translate[XYZ]?\((-?[\d.]+)px/g))assert(Math.abs(Number(match[1]))<=50||recipe.travelException,recipe.id+' requires a documented large-travel exception');}}
/* The engine versions exist in three places and all three have to agree.
 *
 * `core/package.json` is the authority: gsap and motion are @crystal-ui/core's
 * runtime contract, and a consumer installs whatever it declares. The workspace
 * manifest needs them too, because `tools/sync-licences.cjs` copies their
 * licence notices out of `node_modules/` and into `core/licenses/`, which the
 * library ships. A notice for a version the library does not declare would be
 * the wrong notice. The lockfile is what gets installed.
 *
 * Two manifests naming the same version is the kind of duplication CONTRACT §1
 * covers. Both stay, and their agreement is a checked invariant: core states
 * the version, the workspace matches it, the lockfile resolves to it. Any one
 * of the three moving alone fails. */
const core=JSON.parse(fs.readFileSync('core/package.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8')),lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
for(const name of ['motion','gsap']){
  const declared=core.dependencies[name];
  assert(declared,`core/package.json does not declare ${name}`);
  assert.equal(pkg.devDependencies[name],declared,
    `the workspace builds the engine bundle from ${name} ${pkg.devDependencies[name]} while @crystal-ui/core ships ${declared}`);
  assert.equal(lock.packages['node_modules/'+name].version,declared,
    `the lockfile installs ${name} ${lock.packages['node_modules/'+name].version}, not the ${declared} @crystal-ui/core declares`);
}
/* The engine bundle and the browser's motion catalogue are built by the
   website, from this library's recipes, and are checked in crystal-preview
   where they are produced. This library guarantees the recipe data and the
   versions it declares, which is everything above. */
const result={recipes:ids.size,categories:new Set(data.recipes.map(r=>r.category)).size,engines:pkg.dependencies,staticContracts:'passed'};
fs.writeFileSync('validation/motion-static-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
