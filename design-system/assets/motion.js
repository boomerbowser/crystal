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
      add([{transform:'scale(1)',borderRadius:corner},{transform:`scale(${amplitude},.94)`,borderRadius:'40% 60% 52% 48% / 55% 43% 57% 45%',offset:.3},{transform:'scale(.985,1.025)',borderRadius:'56% 44% 46% 54% / 42% 58% 42% 58%',offset:.66},{transform:'scale(1)',borderRadius:corner}],'::before');
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
      resin:[{transform:`translateY(${travel}px) scale(.90,1.10) skewX(-3deg)`,opacity:0},{transform:'translateY(-6px) scale(1.045,.965) skewX(1.5deg)',opacity:1,offset:.58},{transform:'translateY(2px) scale(.99,1.015) skewX(-.4deg)',opacity:1,offset:.82},{transform:'translateY(0) scale(1,1) skewX(0deg)',opacity:1}],
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
  root.CrystalMotion=Object.freeze({play,layout,duration,recipes:Object.freeze(recipes),stop,stopAll,reduced,direction,presets:Object.freeze([...Object.keys(durationNames),...Object.keys(recipes)])});
})(window);
