/* Crystal 1.0. Pure token resolver + CSS exporter. No dependencies. */
(function(root){
  'use strict';
  const data=root.CRYSTAL_TOKENS;
  if(!data) throw new Error('Load tokens.js before crystal.js');
  const camelToKebab=s=>s.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const rgba=(hex,alpha)=>`rgba(${rgb(hex).join(', ')}, ${Number(alpha.toFixed(3))})`;
  function luminance(hex){const c=rgb(hex).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
  function contrast(a,b){const [lo,hi]=[luminance(a),luminance(b)].sort((a,b)=>a-b);return (hi+.05)/(lo+.05);}
  function normalize(value={}){
    const source=value&&typeof value==='object'?value:{}; const state={...data.default};
    for(const [key,range] of Object.entries({atmosphere:[15,90],translucency:[35,85],elevation:[60,150],radius:[14,28],motionSpeed:[.25,2]})){
      if(Number.isFinite(source[key])) state[key]=Math.max(range[0],Math.min(range[1],source[key]));
    }
    if(Object.hasOwn(data.palettes,source.palette))state.palette=source.palette;
    if(['light','dark','system'].includes(source.mode))state.mode=source.mode;
    if(['comfortable','compact'].includes(source.density))state.density=source.density;
    if(['manrope','system'].includes(source.font))state.font=source.font;
    if(typeof source.reduced==='boolean')state.reduced=source.reduced;
    if(typeof source.reduceMotion==='boolean')state.reduceMotion=source.reduceMotion;
    return state;
  }
  function resolve(value={},mode='light'){
    const s=normalize(value);mode=mode==='dark'?'dark':'light';const p=data.palettes[s.palette].modes[mode];const e=s.elevation/100;const tint=s.translucency/100;const dark=mode==='dark';
    const ms=duration=>(s.reduceMotion?0:Math.round(Math.min(data.motion.maxDuration,duration/s.motionSpeed)*100)/100)+'ms';
    const tokens={};for(const [key,val] of Object.entries(p))tokens['--cr-'+camelToKebab(key)]=val;
    const shadow=dark?'rgba(0, 0, 0, .55)':'rgba(39, 24, 68, .18)';const contact=dark?'rgba(0, 0, 0, .50)':'rgba(39, 24, 68, .15)';const highlight=dark?'rgba(255,255,255,.17)':'rgba(255,255,255,.85)';
    Object.assign(tokens,{
      '--cr-font':s.font==='manrope'?'Manrope, system-ui, sans-serif':'system-ui, sans-serif',
      '--cr-radius':s.radius+'px','--cr-space':s.density==='compact'?'14px':'20px',
      '--cr-reading':'16px','--cr-leading':'1.5',
      '--cr-foundation-muted':p.text,
      '--cr-mica-inactive':data.material.micaInactive[mode],
      '--cr-atmosphere-one':rgba(p.decorative,s.atmosphere/100*(dark?.29:.24)),
      '--cr-atmosphere-two':rgba(p.companion,s.atmosphere/100*(dark?.23:.19)),
      '--cr-acrylic-fill':s.reduced?p.surface:rgba(p.surface,Math.min(.94,tint+.1)),
      '--cr-glass-fill':s.reduced?p.surface:rgba(p.surface,data.material.glassOpacity),
      '--cr-content-fill':s.reduced?p.surface:rgba(p.surface,data.material.contentOpacity),
      '--cr-content-own-base':p.contentOwnSurface||p.primarySoft,
      '--cr-content-own-fill':s.reduced?(p.contentOwnSurface||p.primarySoft):rgba(p.contentOwnSurface||p.primarySoft,data.material.contentOpacity),
      '--cr-content-feather':s.reduced?'0px':data.material.contentFeather+'px',
      '--cr-content-muted':s.palette==='harbor'?p.text:p.muted,
      '--cr-content-own-text':s.palette==='harbor'?p.text:p.onPrimarySoft,
      '--cr-stone-feather':s.reduced?'0px':data.material.stoneFeather+'px',
      '--cr-mirage-fill':rgba(data.material.mirageColor,s.reduced?data.material.mirageFallbackOpacity:data.material.mirageOpacity),
      '--cr-mirage-blur':s.reduced?'0px':data.material.mirageBlur+'px',
      '--cr-mirage-saturation':(s.reduced?100:data.material.mirageSaturation)+'%',
      '--cr-mirage-brightness':(s.reduced?100:data.material.mirageBrightness)+'%',
      '--cr-mirage-fallback-fill':rgba(data.material.mirageColor,data.material.mirageFallbackOpacity),
      '--cr-label-fill':s.reduced?p.surface:rgba(p.surface,dark?data.material.labelVeilDark:data.material.labelVeil),
      '--cr-acrylic-blur':s.reduced?'0px':data.material.acrylicBlur+'px','--cr-glass-blur':s.reduced?'0px':data.material.glassBlur+'px',
      '--cr-acrylic-saturation':data.material.acrylicSaturation+'%','--cr-glass-saturation':data.material.glassSaturation+'%','--cr-grain-opacity':String(data.material.grainOpacity),
      '--cr-edge':rgba(p.outline,dark?.34:.25),'--cr-rim':highlight,
      '--cr-shadow-content':`0 ${2*e}px ${3*e}px ${contact}, 0 ${7*e}px ${15*e}px ${shadow}`,
      '--cr-shadow-panel':`inset 0 1px 0 ${highlight}, 0 ${3*e}px ${5*e}px ${contact}, 0 ${14*e}px ${28*e}px ${shadow}`,
      '--cr-shadow-float':`inset 0 1px 1px ${highlight}, inset 0 -1px 1px ${contact}, 0 ${4*e}px ${7*e}px ${contact}, 0 ${20*e}px ${40*e}px ${shadow}`,
      '--cr-press':ms(data.motion.press),'--cr-state':ms(data.motion.state),'--cr-spatial':ms(data.motion.spatial),
      '--cr-exit':ms(data.motion.exit),'--cr-motion-enabled':s.reduceMotion?'0':'1',
      '--cr-travel-panel':data.motion.distance.panel+'px','--cr-travel-floating':data.motion.distance.floating+'px','--cr-travel-content':data.motion.distance.content+'px','--cr-travel-exit':data.motion.distance.exit+'px',
      '--cr-ease-enter':data.motion.easing.enter,'--cr-ease-settle':data.motion.easing.settle,'--cr-ease-exit':data.motion.easing.exit
    });
    for(const [name,pair] of Object.entries(data.status[mode])){tokens[`--cr-${name}-ink`]=pair.ink;tokens[`--cr-${name}-surface`]=pair.surface;}
    for(const name of ['material','liquid','flow','departure'])tokens['--cr-'+name]=ms(data.motion[name]);
    for(const name of ['depth','feather'])tokens['--cr-travel-'+name]=data.motion.distance[name]+'px';
    tokens['--cr-motion-max-travel']=data.motion.maxTravel+'px';
    tokens['--cr-motion-speed']=String(s.motionSpeed);
    tokens['--cr-motion-max-duration']=data.motion.maxDuration+'ms';
    // Named material exports, retaining legacy variables for existing adopters.
    const aliases={'plastic-inactive':'mica-inactive','plastic-fill':'canvas','frost-fill':'acrylic-fill','frost-blur':'acrylic-blur','frost-saturation':'acrylic-saturation','resin-fill':'glass-fill','resin-blur':'glass-blur','resin-saturation':'glass-saturation','haze-fill':'content-fill','haze-feather':'content-feather','haze-own-fill':'content-own-fill','stone-fill':'label-fill'};
    for(const [name,legacy] of Object.entries(aliases))tokens['--cr-'+name]=tokens['--cr-'+legacy];
    return tokens;
  }
  function exportCSS(value={}){
    const s=normalize(value);const rules=(mode,selector)=>`${selector} {\n  color-scheme: ${mode};\n${Object.entries(resolve(s,mode)).map(([k,v])=>`  ${k}: ${v};`).join('\n')}\n}`;
    const defaultMode=s.mode==='dark'?'dark':'light';
    return `/* Crystal ${data.version} · ${data.palettes[s.palette].name}\n   Generated from explicit semantic tokens. Pair with assets/crystal.css.\n   Set data-crystal-mode="light" or "dark" on <html> to override.\n   This token export is not an accessibility certification. */\n`+
      rules(defaultMode,':root')+'\n'+rules('light',':root[data-crystal-mode="light"]')+'\n'+rules('dark',':root[data-crystal-mode="dark"]')+
      (s.mode==='system'?'\n@media (prefers-color-scheme: dark) {\n'+rules('dark',':root:not([data-crystal-mode="light"])')+'\n}':'')+
      (s.reduceMotion?'\n*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } button:hover, button:active { transform: none !important; }\n':'')+
      (s.reduced?'\n:is(.cr-frost,.cr-acrylic)::before, :is(.cr-resin,.cr-glass)::before, :is(.cr-resin,.cr-glass)::after { display: none; }\n:is(.cr-frost,.cr-acrylic), :is(.cr-resin,.cr-glass) { backdrop-filter: none; -webkit-backdrop-filter: none; border-color: var(--cr-outline); }':'')+'\n';
  }
  function exportJSON(value={}){const state=normalize(value);return {system:'Crystal',version:data.version,materials:data.materials,motion:data.motion,configuration:state,resolved:{light:resolve(state,'light'),dark:resolve(state,'dark')},scope:'Theme configuration and resolved CSS variables. Requires component behavior and application-level accessibility verification.'};}
  function audit(value={},mode='light'){
    const t=resolve(value,mode);const pairs=[['Body / content','text','surface'],['Body / foundation','text','canvas'],['Supporting text / content','muted','surface'],['Primary label / action','on-primary','primary'],['Selected content','on-primary-soft','primary-soft'],['Input outline / content','outline','surface']];
    for(const name of ['success','attention','danger','info'])pairs.push([name[0].toUpperCase()+name.slice(1)+' status',name+'-ink',name+'-surface']);
    return pairs.map(([label,ink,bg])=>({label,foreground:t['--cr-'+ink],background:t['--cr-'+bg],ratio:contrast(t['--cr-'+ink],t['--cr-'+bg]),minimum:ink==='outline'?3:4.5}));
  }
  root.Crystal=Object.freeze({normalize,resolve,contrast,exportCSS,exportJSON,audit,version:data.version});
})(typeof window!=='undefined'?window:globalThis);
