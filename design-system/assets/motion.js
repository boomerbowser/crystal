/* Crystal material choreography. All effects are finite and cancellable. */
(function(root){
  'use strict';
  const media=matchMedia('(prefers-reduced-motion: reduce)'),active=new Map();
  const directions=['left','bottom','right','top'];let flowIndex=0;
  const durationNames={plastic:'material',frost:'material',resin:'liquid',haze:'material',stone:'material',mirage:'flow','mirage-out':'departure',dismiss:'departure'};
  function reduced(){return media.matches||getComputedStyle(document.documentElement).getPropertyValue('--cr-motion-enabled').trim()==='0';}
  function stop(element){const current=active.get(element);if(current){active.delete(element);element.dataset.crMotionState='cancelled';for(const animation of current)animation.cancel();}}
  function stopAll(){for(const element of active.keys())stop(element);}
  function direction(element,requested){const value=directions.includes(requested)?requested:directions[flowIndex++%4];element.dataset.flowDirection=value;element.dataset.flowSoft=String(typeof CSS!=='undefined'&&typeof CSS.registerProperty==='function');return value;}
  const recipes=Object.fromEntries((root.CRYSTAL_MOTION_RECIPES||[]).map(recipe=>[recipe.id,recipe]));
  /* A fluid is incompressible: a deformation that loses area reads as rubber
     being crushed, not liquid moving. Both axes are divided by the square root
     of the area, which conserves volume while preserving the deformation's
     aspect ratio exactly, so only the physical error is removed. The recipes in
     motion-recipes.json are corrected the same way and the contract is enforced
     by tools/validate-motion.cjs. */
  function squash(sx,sy){const k=Math.sqrt(sx*sy);return `scale(${(sx/k).toFixed(4)},${(sy/k).toFixed(4)})`;}

  function duration(base,rate=1){const css=getComputedStyle(document.documentElement);const speed=Number(css.getPropertyValue('--cr-motion-speed'))||1;return Math.min(5000,Math.max(0,base)/(Math.max(.25,Math.min(2,speed))*Math.max(.25,Math.min(2,rate))));}
  function opticalLayers(element,recipe,options,animations){
    if(document.documentElement.dataset.effects==='opaque'||matchMedia('(prefers-reduced-transparency: reduce)').matches||matchMedia('(forced-colors: active)').matches)return;
    const surface=element.closest('.cr-field-shell')||element;
    const add=(frames,pseudo)=>{if(getComputedStyle(surface,pseudo).content==='none')return;animations.push(CrystalEngines.frames(surface,frames,{...options,pseudoElement:pseudo,engine:'GSAP'}));};
    const signature=recipe.signature,corner=getComputedStyle(surface).borderRadius;
    if(signature==='feather'){
      if(getComputedStyle(surface,'::before').content==='none')animations.push(CrystalEngines.frames(surface,[{boxShadow:getComputedStyle(surface).boxShadow},{boxShadow:'0 0 14px 2px rgba(125,145,185,.32)',offset:.5},{boxShadow:getComputedStyle(surface).boxShadow}],{...options,engine:'GSAP'}));
      add([{transform:'translate(0,0)',borderRadius:corner},{transform:'translate(-4px,2px)',borderRadius:'35% 65% 42% 58% / 52% 42% 58% 48%',offset:.3},{transform:'translate(3px,-1px)',borderRadius:'58% 42% 62% 38% / 44% 58% 42% 56%',offset:.68},{transform:'translate(0,0)',borderRadius:corner}],'::before');
    }else if(['pressure','tension','coalesce','meniscus'].includes(signature)){
      const amplitude=signature==='coalesce'?1.045:1.02;
      add([{transform:'scale(1)',borderRadius:corner},{transform:squash(amplitude,.94),borderRadius:'40% 60% 52% 48% / 55% 43% 57% 45%',offset:.3},{transform:squash(.985,1.025),borderRadius:'56% 44% 46% 54% / 42% 58% 42% 58%',offset:.66},{transform:'scale(1)',borderRadius:corner}],'::before');
    }
    if(['pressure','tension','coalesce','meniscus','caustic','torsion','iris'].includes(signature)){
      add([{backgroundPosition:'130% 0',opacity:.35},{backgroundPosition:'40% 0',opacity:1,offset:.48},{backgroundPosition:'-45% 0',opacity:.55}],'::after');
    }
    if(signature==='refraction'){
      const light='linear-gradient(110deg, transparent 10%, rgba(255,255,255,.27) 45%, transparent 75%)';
      add([{backgroundImage:light,backgroundSize:'240% 100%',backgroundPosition:'120% 0',opacity:.12},{backgroundImage:light,backgroundSize:'240% 100%',backgroundPosition:'45% 0',opacity:.7,offset:.55},{backgroundImage:light,backgroundSize:'240% 100%',backgroundPosition:'-35% 0',opacity:0}],'::after');
    }
    if(signature==='inertia'||signature==='refraction')animations.push(CrystalEngines.frames(element,[{boxShadow:getComputedStyle(element).boxShadow},{boxShadow:'0 25px 42px rgba(8,12,30,.3)',offset:.55},{boxShadow:getComputedStyle(element).boxShadow}],{...options,engine:'GSAP'}));
  }
  function runComponent(element,name,frames,base,engine,options={}){
    if(!(element instanceof Element))throw new TypeError('CrystalMotion requires an element');
    /* `once` coalesces repeats of the SAME recipe on the same element. A continuous
       control fires its event many times a second, and restarting a 400ms animation on
       every one of them stops it partway and begins again — which is what makes a slider
       feel choppy. A different recipe still interrupts, because that is a different thing
       being expressed. Deliberate replays (the catalogue) simply omit the option. */
    if(options.once&&element.dataset.crMotionName===name&&element.dataset.crMotionState==='running')
      return Promise.resolve({status:'coalesced'});
    stop(element);element.dataset.crMotionName=name;element.dataset.crMotionEngine=engine;
    const recipe=recipes[name]||{};
    element.dataset.crMotionSignature=recipe.signature||'measured-layout';
    if(reduced()){element.dataset.crMotionState='instant';return Promise.resolve({status:'instant'});}
    const opts={duration:duration(base,options.rate),engine,easing:recipe.signature==='inertia'?'cubic-bezier(0.16, 0.7, 0.2, 1)':recipe.signature==='coalesce'?'cubic-bezier(0.34, 0.08, 0.24, 1)':'cubic-bezier(0.22, 0.65, 0.22, 1)'};
    const animations=[CrystalEngines.frames(element,frames,opts)];
    opticalLayers(element,recipe,opts,animations);
    active.set(element,animations);element.dataset.crMotionState='running';
    return Promise.all(animations.map(animation=>animation.finished.then(()=>true,error=>{if(error.name!=='AbortError')throw error;return false;}))).then(results=>{
      const status=results.every(Boolean)?'finished':'cancelled';
      if(active.get(element)===animations){active.delete(element);element.dataset.crMotionState=status;}return {status};
    },error=>{if(active.get(element)===animations)stop(element);throw error;});
  }
  function layout(element,previous,options={}){const next=element.getBoundingClientRect(),dx=previous.left-next.left,dy=previous.top-next.top;
    const distance=Math.hypot(dx,dy),within=distance<=(options.extended===false?50:Math.hypot(innerWidth,innerHeight));
    element.dataset.crMotionTravel=within?String(Math.round(distance)):'0';
    return runComponent(element,'layout',within?[{transform:`translate(${dx}px,${dy}px) scale(.98)`},{transform:'translate(0,0) scale(1)'}]:[{opacity:.65},{opacity:1}],Math.min(1200,380+distance*.65),'GSAP',options);
  }
  function play(element,name,options={}){
    if(recipes[name]){const recipe=recipes[name];return runComponent(element,name,recipe.keyframes,recipe.duration,recipe.engine,options);}

    if(!(element instanceof Element))throw new TypeError('CrystalMotion.play requires an element');
    if(!durationNames[name])throw new RangeError('Unknown Crystal motion: '+name);
    stop(element);element.dataset.crMotionName=name;
    if(reduced()||typeof element.animate!=='function'){element.dataset.crMotionState='instant';return Promise.resolve({status:'instant'});}
    const tokens=getComputedStyle(document.documentElement),read=(key,fallback)=>{const value=parseFloat(tokens.getPropertyValue('--cr-'+key));return Number.isFinite(value)?value:fallback;};
    const limit=Math.min(50,Math.max(0,read('motion-max-travel',50)));
    const travel=Math.min(limit,Math.max(0,read('travel-'+(name==='resin'?'floating':name==='dismiss'?'exit':'panel'),24)));
    const depth=Math.min(limit,Math.max(0,read('travel-depth',50))),feather=Math.min(6,Math.max(0,read('travel-feather',6)));
    const anchored=name==='haze'||name==='stone'||(name==='dismiss'&&element.matches('.cr-dialog,.cr-haze,.cr-surface,.cr-stone'));
    const rate=Number.isFinite(options.rate)?Math.max(.25,Math.min(2,options.rate)):1;
    const duration=Math.min(read('motion-max-duration',5000),read(durationNames[name],1000)/rate);
    const easing=tokens.getPropertyValue('--cr-ease-'+(name==='dismiss'||name==='mirage-out'?'exit':'enter')).trim()||'ease-in-out';
    const opts={duration,easing,fill:'none'},animations=[];
    const add=(frames,pseudoElement)=>{element.dataset.crMotionEngine=pseudoElement?'Motion + GSAP':'Motion';animations.push(CrystalEngines.frames(element,frames,{...opts,...(pseudoElement?{pseudoElement}:{} )}));};
    const frames={
      plastic:[{transform:`translateY(${travel}px)`,opacity:0},{transform:'translateY(0)',opacity:1}],
      frost:[{transform:'perspective(700px) translateZ(0)',opacity:.5},{transform:`perspective(700px) translateZ(${depth}px)`,opacity:1,offset:.66},{transform:'perspective(700px) translateZ(0)',opacity:1}],
      resin:[{transform:`translateY(${travel}px) ${squash(.90,1.10)} skewX(-3deg)`,opacity:0},{transform:`translateY(-6px) ${squash(1.045,.965)} skewX(1.5deg)`,opacity:1,offset:.58},{transform:`translateY(2px) ${squash(.99,1.015)} skewX(-.4deg)`,opacity:1,offset:.82},{transform:'translateY(0) scale(1,1) skewX(0deg)',opacity:1}],
      dismiss:anchored?[{opacity:1},{opacity:0}]:[{transform:'translateY(0)',opacity:1},{transform:`translateY(${travel}px)`,opacity:0}]
    };
    if(name==='mirage'||name==='mirage-out'){
      const from=direction(element,options.direction),origins={left:'0% 65%',right:'100% 35%',top:'65% 0%',bottom:'35% 100%'};
      const start={opacity:0,clipPath:`ellipse(0% 35% at ${origins[from]})`},end={opacity:1,clipPath:`ellipse(150% 150% at ${origins[from]})`};
      if(element.dataset.flowSoft==='true'){
        const softStart={opacity:0,'--cr-flow-reach':'0%'},softEnd={opacity:1,'--cr-flow-reach':'100%'};
        add(name==='mirage'?[softStart,softEnd]:[softEnd,softStart]);
      }else add(name==='mirage'?[start,{opacity:.8,clipPath:`ellipse(70% 95% at ${origins[from]})`,offset:.58},end]:[end,start]);
    }else if(frames[name])add(frames[name]);
    // Paint-only layers carry the rippling perimeter and changing light, behind crisp labels.
    const decorate=document.documentElement.dataset.effects!=='opaque'&&!matchMedia('(prefers-reduced-transparency: reduce)').matches&&!matchMedia('(forced-colors: active)').matches;
    if(decorate){
      try{
        if(name==='haze'||name==='stone'||(name==='dismiss'&&anchored)){
          const corner=Math.min(parseFloat(getComputedStyle(element).borderTopLeftRadius)||28,element.getBoundingClientRect().height/2);
          const edgeFrames=[
          {transform:'translate(0,0)',borderRadius:getComputedStyle(element).borderRadius},
          {transform:`translate(${name==='stone'?feather:-feather}px,0px)`,borderRadius:`${corner+feather}px ${Math.max(0,corner-feather/2)}px ${corner+feather/2}px ${corner}px`,offset:.30},
          {transform:`translate(${name==='stone'?-feather/2:feather/2}px,0px)`,borderRadius:`${corner}px ${corner+feather}px ${Math.max(0,corner-feather/2)}px ${corner+feather/2}px`,offset:.68},
          {transform:'translate(0,0)',borderRadius:getComputedStyle(element).borderRadius}
        ];
          add(edgeFrames,'::before');}
        if(name==='resin'){
          const light='linear-gradient(115deg, transparent 20%, rgba(255,255,255,.23) 43%, rgba(255,255,255,.06) 55%, transparent 72%)';
          add([{backgroundImage:light,backgroundSize:'220% 100%',backgroundPosition:'130% 0',opacity:.2},{backgroundImage:light,backgroundSize:'220% 100%',backgroundPosition:'45% 0',opacity:1,offset:.55},{backgroundImage:light,backgroundSize:'220% 100%',backgroundPosition:'-40% 0',opacity:0}],'::before');
          add([{boxShadow:'inset 2px -2px 2px rgba(255,255,255,.7)',borderRadius:'44% 56% 60% 40% / 55% 40% 60% 45%'},{boxShadow:'inset -2px 2px 2px rgba(255,255,255,.7)',borderRadius:'58% 42% 44% 56% / 42% 60% 40% 58%',offset:.55},{boxShadow:getComputedStyle(element,'::after').boxShadow,borderRadius:getComputedStyle(element).borderRadius}],'::after');
        }
        if(name==='frost'||name==='plastic')add([{boxShadow:'0 2px 4px rgba(10,15,32,.12)'},{boxShadow:'0 32px 52px rgba(10,15,32,.28)',offset:.66},{boxShadow:getComputedStyle(element).boxShadow}]);
      }catch{/* Optional pseudo-element effects fall back to the real component movement. */}
    }
    if(!animations.length){element.dataset.crMotionState='instant';return Promise.resolve({status:'instant'});}
    active.set(element,animations);element.dataset.crMotionState='running';
    return Promise.all(animations.map(animation=>animation.finished.then(()=>true,()=>false))).then(results=>{
      const status=results.every(Boolean)?'finished':'cancelled';
      if(active.get(element)===animations){active.delete(element);element.dataset.crMotionState=status;}
      return {status};
    });
  }
  media.addEventListener('change',()=>{if(reduced())stopAll();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});
  /* Ambient motion: what a surface does at rest.
   *
   * A capability, not a default — nothing here starts on its own. A host opts a surface
   * in, and the surface keeps cycling until it is stopped. This uses the native effect
   * directly rather than the engine adapter, because an ambient loop needs no clock,
   * no spring and no completion promise; it needs to repeat and to stop cleanly.
   *
   * Three rules from the specification are enforced here rather than left to callers:
   * reduced motion refuses outright, a surface that is not ambient-capable is refused,
   * and interaction pauses the loop — WCAG 2.2.2 requires that anything moving beyond
   * five seconds can be stopped, and an ambient loop never stops on its own. */
  const ambients=new Map();
  function ambient(element,name){
    if(!(element instanceof Element))throw new TypeError('CrystalMotion.ambient requires an element');
    const recipe=recipes[name];
    if(!recipe)throw new RangeError('Unknown Crystal motion: '+name);
    if(!recipe.loop)throw new RangeError(name+' is not an ambient recipe; ambient motion must declare loop');
    stopAmbient(element);
    if(reduced()||document.documentElement.dataset.ambient==='off'
      ||typeof element.animate!=='function'){element.dataset.crAmbientState='static';return null;}
    /* A recipe may declare the layer it paints on. Haze and Stone breathe at their
       boundary, which lives on the isolated paint layer — animating the element itself
       would move the text with it, and feathering never touches content. */
    const options={duration:recipe.duration,easing:'ease-in-out',iterations:Infinity,
      direction:'alternate',fill:'none'};
    if(recipe.layer)options.pseudoElement=recipe.layer;
    const effect=element.animate(recipe.keyframes,options);
    element.dataset.crAmbient=name;element.dataset.crAmbientState='running';
    effect.playbackRate=ambientRate;
    ambients.set(element,effect);
    return effect;
  }
  function stopAmbient(element){
    const effect=ambients.get(element);
    if(effect){effect.cancel();ambients.delete(element);}
    if(element instanceof Element){delete element.dataset.crAmbient;element.dataset.crAmbientState='stopped';}
  }
  /* Interaction ADDS energy; it does not silence the surface. A material that goes still
     the moment it is touched reads as broken rather than as calm, and it is the opposite
     of what the reference behaviour does — rest, faster on hover, faster still on press,
     decaying back. Ambient rate is what carries that.

     The one exception is text entry. A field being typed into is the single place where
     motion genuinely competes with the task, so ambient pauses there and nowhere else.
     WCAG 2.2.2 is satisfied by reduced motion and stopAmbient, not by stopping on every
     click. */
  /* This is the ONE rate table for ambient motion. The WebGL tier used to carry its own
     copy, which had already drifted: it dropped to zero on text focus and never restored
     on blur, so escaping a field left every shader frozen until the next click. The rate
     is broadcast instead, and assets/motion-shaders.js listens. A page that loads the
     shader tier without this file keeps the resting rate and simply never speeds up. */
  const REST_RATE=0.6, HOVER_RATE=1, PRESS_RATE=2.4;
  let ambientRate=REST_RATE, decay;
  const applyRate=rate=>{
    ambientRate=rate;
    for(const effect of ambients.values()){
      /* Zero means paused rather than stopped: the surface holds its position and
         resumes from it, which is what returning to a half-open state should look like. */
      if(rate===0)effect.pause();
      else{effect.play();effect.playbackRate=rate;}
    }
    root.dispatchEvent(new CustomEvent('crystal:ambient-rate',{detail:{rate}}));
  };
  const energise=rate=>{
    applyRate(rate);
    clearTimeout(decay);
    decay=setTimeout(()=>applyRate(REST_RATE),900);
  };
  root.addEventListener('pointerover',event=>{
    if(event.target instanceof Element&&event.target.closest('button,a,[role=button],.cr-control'))
      energise(HOVER_RATE);
  },{passive:true});
  root.addEventListener('pointerdown',()=>energise(PRESS_RATE),{passive:true});
  root.addEventListener('focusin',event=>{
    const field=event.target;
    const typing=field instanceof Element&&field.matches(
      'input:not([type=range],[type=checkbox],[type=radio],[type=button],[type=submit],[type=reset]),textarea,[contenteditable=true]');
    /* Text entry is not a decaying burst; it holds until the field is left. */
    clearTimeout(decay);
    applyRate(typing?0:REST_RATE);
  },{passive:true});
  root.addEventListener('focusout',()=>{clearTimeout(decay);applyRate(REST_RATE);},{passive:true});
  media.addEventListener('change',()=>{if(reduced())for(const element of [...ambients.keys()])stopAmbient(element);});

  /* Give every Haze and Stone surface its rest state as it comes into view.
     Haze and Stone are the two materials that ARE their feathered edge, so their rest
     motion is that edge travelling outward and back — never a colour or opacity change,
     which is the same edge merely getting fainter. They are opposed on purpose: Haze
     breathes outward, Stone draws inward, so a label backing and the content fill around
     it are never pulsing in unison.

     Unlike the WebGL tier there is no cap here. These are Web Animations on an existing
     paint layer, cheap enough to be everywhere, which is why the CSS tier is the floor
     the specification guarantees on every platform. */
  const AMBIENT_SURFACES=[['.cr-haze,.cr-surface','haze-settle'],['.cr-stone,.cr-dock-inner','stone-settle']];
  function ambientAll(scope=document){
    if(reduced()||document.documentElement.dataset.ambient==='off')return()=>{};
    if(typeof IntersectionObserver!=='function')return()=>{};
    const observer=new IntersectionObserver(entries=>{
      for(const record of entries){
        const name=AMBIENT_SURFACES.find(([selector])=>record.target.matches(selector))?.[1];
        if(!name)continue;
        if(record.isIntersecting)ambient(record.target,name);
        else stopAmbient(record.target);
      }
    },{rootMargin:'64px'});
    for(const [selector] of AMBIENT_SURFACES)
      for(const element of scope.querySelectorAll(selector))
        if(!element.closest('[data-cr-motion=manual]'))observer.observe(element);
    return()=>observer.disconnect();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>ambientAll());
  else ambientAll();

  root.CrystalMotion=Object.freeze({play,ambient,stopAmbient,ambientAll,ambientRate:()=>ambientRate,layout,duration,recipes:Object.freeze(recipes),stop,stopAll,reduced,direction,presets:Object.freeze([...Object.keys(durationNames),...Object.keys(recipes)])});
})(window);
