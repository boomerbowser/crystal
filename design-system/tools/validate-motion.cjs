const assert=require('node:assert/strict'),fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('tokens/motion-recipes.json','utf8')),ids=new Set();
for(const recipe of data.recipes){assert(!ids.has(recipe.id),'Duplicate recipe '+recipe.id);ids.add(recipe.id);assert(recipe.duration>0&&recipe.duration<=2000);assert(['Motion','GSAP'].includes(recipe.engine));assert(recipe.use&&recipe.reduced&&recipe.material&&recipe.signature);assert(recipe.keyframes.length>=2);for(const frame of recipe.keyframes){for(const match of (frame.transform||'').matchAll(/translate[XYZ]?\((-?[\d.]+)px/g))assert(Math.abs(Number(match[1]))<=50||recipe.travelException,recipe.id+' requires a documented large-travel exception');}}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8')),lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
assert.equal(pkg.dependencies.motion,'13.4.0');assert.equal(pkg.dependencies.gsap,'3.15.0');assert.equal(lock.packages['node_modules/motion'].version,pkg.dependencies.motion);assert.equal(lock.packages['node_modules/gsap'].version,pkg.dependencies.gsap);
assert(fs.statSync('assets/vendor/crystal-engines.js').size>1000,'Missing real engine bundle');
const result={recipes:ids.size,categories:new Set(data.recipes.map(r=>r.category)).size,engines:pkg.dependencies,staticContracts:'passed'};
fs.writeFileSync('validation/motion-static-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
