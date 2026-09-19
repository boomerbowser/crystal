const esbuild=require('esbuild'),fs=require('node:fs');
esbuild.buildSync({entryPoints:['core/engines.js'],bundle:true,format:'iife',globalName:'CrystalEngines',outfile:'assets/vendor/crystal-engines.js',minify:true,legalComments:'linked',target:['es2022']});
for(const name of ['motion','motion-dom','motion-utils','framer-motion','tslib']){
 const file=['LICENSE.md','LICENSE.txt'].find(f=>fs.existsSync(`node_modules/${name}/${f}`));
 if(file)fs.copyFileSync(`node_modules/${name}/${file}`,`core/licenses/${name}-LICENSE.txt`);
}
console.log('Bundled Motion 13.4.0 and GSAP 3.15.0 locally.');

const recipes=JSON.parse(fs.readFileSync('core/tokens/motion-recipes.json','utf8')).recipes;fs.writeFileSync('assets/motion-catalog.js','window.CRYSTAL_MOTION_RECIPES = '+JSON.stringify(recipes)+';\n');
