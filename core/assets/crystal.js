/* Crystal. Pure token resolver + CSS exporter. No dependencies.
 *
 * Loadable two ways. In a browser it is a script that reads
 * `window.CRYSTAL_TOKENS` and publishes `window.Crystal`. Under a module loader it
 * takes the flat token file directly and exports the same object.
 *
 * The second path exists because a platform library needs `resolve()`, which
 * turns a palette, a mode and a set of preferences into the ~90 custom
 * properties a surface renders from. Without it a library can only load the
 * generated stylesheet, which carries one palette at `:root`, so every per-scope
 * palette and mode it offered was decoration. CONTRACT §1 says to reuse this
 * arithmetic rather than reimplement it, which requires that it can be imported. */
(function(root){
  'use strict';
  const data=root.CRYSTAL_TOKENS
    || (typeof module!=='undefined'&&module.exports?require('../tokens/crystal.json'):null);
  if(!data) throw new Error('Load tokens.js before crystal.js');
  /* `chartSeries1` is `--cr-chart-series-1`, not `--cr-chart-series1`. The digit
     boundary is a word boundary here because Crystal already writes its numbered
     properties that way (`--cr-focus-feather-1` predates this), and a scale a
     stylesheet indexes with `var(--cr-chart-series-#{$i})` reads as one. No role
     name carried a digit before the series scale, so nothing renamed. */
  const camelToKebab=s=>s.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()).replace(/([a-z])(\d)/g,'$1-$2');
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
       hue instead of neutral grey. The mix is on the colour only. The alpha of each
       layer is preserved exactly, because tinting a shadow must not also deepen it. */
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
         setting asks for: the base glow of the primary plus the scheme's tint. */
      '--cr-atmosphere-glow':rgba(p.glow,s.atmosphere/100*(dark?.18:.14)),
      '--cr-acrylic-fill':s.reduced?p.surface:rgba(p.surface,Math.min(.94,tint+.1)),
      '--cr-glass-fill':s.reduced?p.surface:rgba(p.surface,data.material.glassOpacity),
      '--cr-content-fill':s.reduced?p.surface:rgba(p.surface,data.material.contentOpacity),
      '--cr-content-own-base':p.contentOwnSurface||p.primarySoft,
      '--cr-content-own-fill':s.reduced?(p.contentOwnSurface||p.primarySoft):rgba(p.contentOwnSurface||p.primarySoft,data.material.contentOpacity),
      '--cr-content-feather':s.reduced?'0px':data.material.contentFeather+'px',
      /* How far the Haze content fill is held back from a Resin surface's own
         rim. The fill and its feather are tokens, and the inset is published
         with them: a platform library that reads only the tokens could
         otherwise carry every Haze token and still paint no fill. */
      '--cr-haze-inset':data.component.haze.inset+'px',
      /* Control geometry: 26px boxes, a 44×28 track, .55 for a disabled
         control. The same numbers are published as tokens a platform library
         reads, and two statements of one value is the drift CONTRACT §1
         forbids, so `crystal.css` reads these and its literal is the fallback
         only. */
      '--cr-action-disabled-opacity':String(data.component.action.disabledOpacity),
      '--cr-choice-box-size':data.component.choice.boxSize+'px',
      '--cr-choice-box-radius':data.component.choice.boxRadius+'px',
      '--cr-switch-track-width':data.component.switch.trackWidth+'px',
      '--cr-switch-track-height':data.component.switch.trackHeight+'px',
      /* Chart geometry. A chart's colours vary with the palette and arrive with
         the other roles above; these do not vary at all. They are published
         here because the catalogue says "line weight follows the stroke scale"
         and "point size is a scale, not an arbitrary radius", and a scale
         left to each renderer becomes two scales. */
      '--cr-chart-stroke':data.component.chart.stroke+'px',
      '--cr-chart-hairline':data.component.chart.hairline+'px',
      '--cr-chart-point-min':data.component.chart.pointMin+'px',
      '--cr-chart-point-max':data.component.chart.pointMax+'px',
      '--cr-chart-bar-radius':data.component.chart.barRadius+'px',
      '--cr-chart-cell-gap':data.component.chart.cellGap+'px',
      '--cr-chart-ring-thickness':String(data.component.chart.ringThickness),
      '--cr-chart-fill-opacity':String(data.component.chart.fillOpacity),
      '--cr-chart-link-opacity':String(data.component.chart.linkOpacity),
      '--cr-chart-gauge-sweep':data.component.chart.gaugeSweep+'deg',
      '--cr-progress-ring-stroke':data.component.progress.ringStroke+'px',
      '--cr-content-muted':s.palette==='harbor'?p.text:p.muted,
      '--cr-content-own-text':s.palette==='harbor'?p.text:p.onPrimarySoft,
      '--cr-stone-feather':s.reduced?'0px':data.material.stoneFeather+'px',
      /* Scrollbars.
         The thumb is ink, not material. A thumb painted in the material's own
         surface colour is invisible: a white thumb at 62% over a white Frost
         panel is a white panel. The Frost thumb is the palette's ink, as the
         panel's own text is, and the Resin thumb is the palette's primary,
         because Resin is the floating control plane and a scrollbar there is a
         control. Both clear 3:1 against surface, surfaceAlt and canvas in every
         palette and both modes, which validate-tokens asserts.
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
         four-layer feathered halo. `crystal.css` writes it out longhand, which
         works for a stylesheet that can use `:focus-visible` on a native
         element and is no use to a library styling a shell that wraps one.
         Published here so there is one recipe, in one place, and CONTRACT §1
         is kept. */
      /* The inner edge a control's well is drawn with. A Card and a Slider both
         read it, so it belongs to the system; the preview's own `controls.css`
         is a layer a library must not load. */
      '--cr-control-edge':rgba(p.outline,0.18),
      /* The two tints the Resin control sheen is built from. Like
         `--cr-control-edge` above, they are published here so the sheen ships
         with the library and does not live only in the preview's
         `controls.css`. Adopted 21 September 2026 with the rest of D-11.

         `--cr-control-color` is the decorative tint that gives the control its
         body; `--cr-control-light` is the glow that lights its top-left corner.
         Both go down in dark mode, the opposite of the focus feathers. On a
         deep canvas the sheen is already reading against very little, and
         holding it at the light-mode strength makes a control look lit from
         inside rather than lit from above. */
      /* `color-mix` rather than a resolved `rgba`, the one place in this theme
         that departs from the convention, for two measured reasons. A resolved
         `rgba` alpha is quantised to 8 bits by the time a browser serialises it
         (0.126 comes back as 0.125), and an A/B of the site against this
         library put a worst channel delta of 2 on the playground's controls
         from that alone. And a mix keeps the tint tracking `--cr-glow` and
         `--cr-decorative`, so a product that retints either gets a sheen that
         follows, where a resolved value would not. The preview writes these as
         mixes, so a mix is also what makes the adoption exact. */
      '--cr-control-color':`color-mix(in srgb,var(--cr-decorative) ${dark?7:8.4}%,transparent)`,
      '--cr-control-light':`color-mix(in srgb,var(--cr-glow) ${dark?9.8:12.6}%,transparent)`,
      '--cr-focus-core':p.primary,
      '--cr-focus-core-width':'2px',
      '--cr-focus-core-offset':'3px',
      /* The four feather colours, `--cr-focus-feather-1` to `-4`, published
         rather than inlined into `--cr-focus-ring`. A named property can be
         compared by a gate, and a product can retint the falloff without
         restating the whole recipe (D-11).

         Dark mode lifts them: 56/38/22/11 against light's 46/30/17/8. Without
         the lift the falloff goes thin against a deep canvas. Meridian decided
         on 21 September 2026 that the library carries it. */
      ...Object.fromEntries((dark?[56,38,22,11]:[46,30,17,8])
        .map((pct,i)=>[`--cr-focus-feather-${i+1}`,rgba(p.primary,pct/100)])),
      /* The broad layer's colour, and the one part of focus that is not the
         primary: it is `--cr-decorative`, so the lift under a focused control
         carries the palette's own shadow hue instead of tinting everything
         purple. */
      '--cr-focus-shadow':rgba(p.decorative,0.27),
      /* Six layers: the four-layer halo, then two that lift.

         Spreads are 1/3/6/11, not 2/6/12/22: the halo was halved at Meridian's
         request, and 2/6/12/22 is the withdrawn recipe.

         The pair beneath, `0 8px 18px` directional and `0 22px 40px` broad, is
         the lift a focused control makes, which `components.md` describes as
         Crystal's own behaviour. Meridian decided on 21 September that the
         library carries them, so this is the whole recipe and the preview's
         copy is redundant.

         Written as `var()` references to the properties above, the shape the
         preview uses. It keeps the recipe readable at the point of use and
         lets the two be compared layer by layer. */
      '--cr-focus-ring':[
        ...[[6,1,1],[16,3,2],[30,6,3],[54,11,4]]
          .map(([blur,spread,n])=>`0 0 ${blur}px ${spread}px var(--cr-focus-feather-${n})`),
        /* The directional layer borrows the second feather instead of naming a
           fifth colour: a lift that is a shade of the halo above it reads as
           the same light source. */
        '0 8px 18px var(--cr-focus-feather-2)',
        '0 22px 40px var(--cr-focus-shadow)',
      ].join(','),
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
      /* The two inks the composed shadows are built from, exported so a one-off
         shadow can be made of Crystal's ink instead of a literal.

         Crystal's shadow ink is palette-tinted: the base violet mixed with the
         palette's companion, so a shadow in Ion is a different colour from a
         shadow in Fuchsia, and it darkens in dark mode. A literal cannot do
         either. `controls.css` carries eleven hard-coded `#080b24…` values, a
         fixed dark navy, and those eleven shadows are the one part of the
         preview that does not follow the palette. Naming the ink makes
         replacing them a substitution (D-9). */
      '--cr-shadow-contact':contact,
      '--cr-shadow-cast':shadow,
      '--cr-shadow-content':`0 ${2*e}px ${3*e}px ${contact}, 0 ${7*e}px ${15*e}px ${shadow}`,
      '--cr-shadow-panel':`inset 0 1px 0 ${highlight}, 0 ${3*e}px ${5*e}px ${contact}, 0 ${14*e}px ${28*e}px ${shadow}`,
      /* Resin's float, matching the approved baseline. The preview loads its
         own hand-written literal from `controls.css`, `inset 0 2px 1px, inset
         0 -1px 1px, 0 5px 9px #080b2412, 0 16px 30px #080b2420`, so that
         literal is what the approved baseline shows, and this token is what
         every platform library gets. The two must agree, or a library
         following the token cannot reproduce the approved appearance.
         The rims are the approved ones: 2px of light along the top where it
         catches, and a light edge returning underneath. A dark lower inset
         reads as an inner shadow instead of glass. The elevation is this
         token's: tinted with the palette like every other Crystal shadow, and
         scaled by the elevation control. The coefficients are the approved
         distances divided by the default 125% elevation, so the default renders
         what was approved and the slider moves it. */
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
