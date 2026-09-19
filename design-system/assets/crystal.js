/* Crystal. Pure token resolver + CSS exporter. No dependencies.
 *
 * Loadable two ways, and both matter. In a browser it is a script that reads
 * `window.CRYSTAL_TOKENS` and publishes `window.Crystal`. Under a module loader it
 * takes the flat token file directly and exports the same object.
 *
 * The second path exists because a platform library needs `resolve()` — turning a
 * palette, a mode and a set of preferences into the ~90 custom properties a
 * surface actually renders from. Without it a library can only load the generated
 * stylesheet, which carries one palette at `:root`; every per-scope palette and
 * mode it offered was decoration. CONTRACT §1 says to reuse this arithmetic
 * rather than reimplement it, and that is only possible if it can be imported. */
(function(root){
  'use strict';
  const data=root.CRYSTAL_TOKENS
    || (typeof module!=='undefined'&&module.exports?require('../tokens/crystal.json'):null);
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
    /* Coloured glass casts a coloured shadow. The light a material refracts is the light
       that reaches the surface beneath it, so the shadow carries the palette's companion
       hue rather than being neutral grey. The mix is on the colour only — the alpha of
       each layer is preserved exactly, because tinting a shadow must not also deepen it. */
    const mixInto=(base,tint,amount)=>{
      const [br,bg,bb]=base,[tr,tg,tb]=rgb(tint);
      const m=(a,b)=>Math.round(a+(b-a)*amount);
      return [m(br,tr),m(bg,tg),m(bb,tb)];
    };
    const SHADOW_TINT=dark?0.40:0.34;
    const base=dark?[0,0,0]:[39,24,68];
    const tinted=mixInto(base,p.companion,SHADOW_TINT);
    const ink=alpha=>`rgba(${tinted[0]}, ${tinted[1]}, ${tinted[2]}, ${alpha})`;
    const shadow=ink(dark?'.55':'.18');const contact=ink(dark?'.50':'.15');const highlight=dark?'rgba(255,255,255,.17)':'rgba(255,255,255,.85)';
    Object.assign(tokens,{
      '--cr-font':s.font==='manrope'?'Manrope, system-ui, sans-serif':'system-ui, sans-serif',
      '--cr-radius':s.radius+'px','--cr-space':s.density==='compact'?'14px':'20px',
      '--cr-reading':'16px','--cr-leading':'1.5',
      '--cr-foundation-muted':p.text,
      '--cr-mica-inactive':data.material.micaInactive[mode],
      '--cr-atmosphere-one':rgba(p.decorative,s.atmosphere/100*(dark?.29:.24)),
      '--cr-atmosphere-two':rgba(p.companion,s.atmosphere/100*(dark?.23:.19)),
      /* Plastic is opaque, so it cannot refract; it emits. This is the palette's own
         glow carried by the foundation, at the intensity the active scheme's atmosphere
         setting asks for — the base glow of the primary plus the scheme's tint. */
      '--cr-atmosphere-glow':rgba(p.glow,s.atmosphere/100*(dark?.18:.14)),
      '--cr-acrylic-fill':s.reduced?p.surface:rgba(p.surface,Math.min(.94,tint+.1)),
      '--cr-glass-fill':s.reduced?p.surface:rgba(p.surface,data.material.glassOpacity),
      '--cr-content-fill':s.reduced?p.surface:rgba(p.surface,data.material.contentOpacity),
      '--cr-content-own-base':p.contentOwnSurface||p.primarySoft,
      '--cr-content-own-fill':s.reduced?(p.contentOwnSurface||p.primarySoft):rgba(p.contentOwnSurface||p.primarySoft,data.material.contentOpacity),
      '--cr-content-feather':s.reduced?'0px':data.material.contentFeather+'px',
      /* How far the Haze content fill is held back from a Resin surface's own
         rim. The fill and its feather were always tokens; the inset was a
         literal in a stylesheet Crystal does not export, so a platform library
         could carry every Haze token and still paint no fill at all — which is
         exactly what Crystal React did on sixteen surfaces. A recipe that only
         one renderer knows is not a specification. */
      '--cr-haze-inset':data.component.haze.inset+'px',
      '--cr-content-muted':s.palette==='harbor'?p.text:p.muted,
      '--cr-content-own-text':s.palette==='harbor'?p.text:p.onPrimarySoft,
      '--cr-stone-feather':s.reduced?'0px':data.material.stoneFeather+'px',
      /* Scrollbars.
         The thumb is ink, not material. Painting it in the material's own
         surface colour is the mistake that made it invisible: a white thumb at
         62% over a white Frost panel is a white panel. So the Frost thumb is the
         palette's ink — it belongs to the panel the way the panel's own text
         does — and the Resin thumb is the palette's primary, because Resin is
         the floating control plane and a scrollbar there is a control. Both
         clear 3:1 against surface, surfaceAlt and canvas in every palette and
         both modes, which validate-tokens asserts.
         The track stays a faint channel so the panel shows through. */
      '--cr-scrollbar-width':data.component.scrollbar.width+'px',
      '--cr-scrollbar-thumb-min':data.component.scrollbar.thumbMinLength+'px',
      '--cr-scrollbar-inset':data.component.scrollbar.inset+'px',
      '--cr-scroll-fade':data.component.scrollArea.fadeDepth+'px',
      /* An overlay's pointer, and the widths past which an anchored surface stops
         being anchored to anything. */
      '--cr-overlay-arrow-size':data.component.overlayArrow.size+'px',
      '--cr-overlay-arrow-radius':data.component.overlayArrow.radius+'px',
      '--cr-overlay-max-width':data.component.overlay.maxWidth+'px',
      '--cr-overlay-tooltip-max-width':data.component.overlay.tooltipMaxWidth+'px',
      /* Focus, as two properties rather than as a recipe each platform retypes.
         Crystal's focus is a crisp 2px primary core at 3px offset inside a
         four-layer feathered halo, and it was written out longhand in
         `crystal.css` — which is fine for a stylesheet that can use `:focus-visible`
         on a native element, and no use at all to a library styling a shell that
         wraps one. Crystal React named these two properties and nothing defined
         them, so every field in it painted no focus ring whatever. Published here
         so there is one recipe, in one place, and CONTRACT §1 is kept. */
      /* The inner edge a control's well is drawn with. It lived only in
         `controls.css`, which is the preview's own layer and the one a library
         must not load — so Crystal React read it on a Card and a Slider and got
         nothing, and those two inset shadows have never painted. A value two
         components depend on belongs to the system. */
      '--cr-control-edge':rgba(p.outline,0.18),
      '--cr-focus-core':p.primary,
      '--cr-focus-core-width':'2px',
      '--cr-focus-core-offset':'3px',
      '--cr-focus-ring':[[6,2,46],[16,6,30],[30,12,17],[54,22,8]]
        .map(([blur,spread,pct])=>`0 0 ${blur}px ${spread}px ${rgba(p.primary,pct/100)}`).join(','),
      /* The spacing scale and the shell's geometry. Neither varies with palette,
         mode or density; they are published as custom properties so a product
         writing plain CSS reaches the same values the libraries compile against.
         `--cr-space` above is the density-aware padding step and is separate. */
      ...Object.fromEntries(Object.entries(data.spacing).map(([k,v])=>['--cr-spacing-'+k,v+'px'])),
      /* The type scale, derived here rather than in each platform library. Density
         tightens leading and never the size: shrinking text at higher density
         trades legibility for space, which Crystal does not do. */
      ...Object.fromEntries(Object.entries(data.typography.scale).flatMap(([step,v])=>{
        const lead=Math.round(v.leading*(s.density==='compact'?0.92:1)*1000)/1000;
        return [
          ['--cr-text-'+step+'-size',Math.round(data.typography.readingSize*v.ratio*100)/100+'px'],
          ['--cr-text-'+step+'-leading',String(lead)],
          ['--cr-text-'+step+'-tracking',v.tracking],
        ];
      })),
      ...Object.fromEntries(Object.entries(data.component.layout).map(
        ([k,v])=>['--cr-layout-'+k.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase(),v+'px'])),
      '--cr-scrollbar-frost-thumb':s.reduced?p.text:rgba(p.text,0.55),
      '--cr-scrollbar-resin-thumb':s.reduced?p.primary:rgba(p.primary,0.80),
      '--cr-scrollbar-track':s.reduced?p.surfaceAlt:rgba(p.outline,0.12),
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
      /* Resin's float, reconciled with the appearance that was actually blessed.
         `controls.css` carried a second, hand-written copy of this recipe —
         `inset 0 2px 1px, inset 0 -1px 1px, 0 5px 9px #080b2412, 0 16px 30px
         #080b2420` — and because the preview loads it, that copy is what the
         approved baseline shows and this token is what every platform library
         gets. They disagreed, so a library following Crystal's own token could
         not reproduce Crystal's own appearance.
         Two things were right on each side and both are kept. The rims are the
         blessed ones: 2px of light along the top where it catches, and a light
         edge returning underneath — a dark lower inset reads as an inner shadow
         rather than as glass. The elevation is this token's: tinted with the
         palette like every other Crystal shadow, and scaled by the elevation
         control, neither of which the literal did. The coefficients are the
         blessed distances divided by the default 125% elevation, so the default
         renders what was approved and the slider now moves it. */
      '--cr-shadow-float':`inset 0 2px 1px ${highlight}, inset 0 -1px 1px ${highlight}, 0 ${4*e}px ${7.2*e}px ${contact}, 0 ${12.8*e}px ${24*e}px ${shadow}`,
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
  const api=Object.freeze({normalize,resolve,contrast,exportCSS,exportJSON,audit,version:data.version});
  root.Crystal=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
