import { cubicBezier } from 'motion';
import { animate } from 'motion/mini';
import { gsap } from 'gsap';

const cssName = name => name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
function easing(value){
  /* A continuous recipe travels at constant speed. Anything that is not a named
     curve used to fall through to the default ease, which made a loop surge and
     slow once per cycle — a spinner that breathes. */
  if(value==='linear')return t=>t;
  const match=/cubic-bezier\(([^)]+)\)/.exec(value||'');
  return match ? cubicBezier(...match[1].split(',').map(Number)) : cubicBezier(.22,.65,.22,1);
}
/* Timing a recipe can ask for beyond its duration: a delay (a staggered mark) and
   a repeat (a continuous indicator, which repeats until it is cancelled). Both are
   in milliseconds here, like the duration; each engine is given its own unit. */
const delaySeconds=options=>Math.max(0,Number(options.delay)||0)/1000;
const repeats=options=>options.repeat===Infinity?Infinity:Math.max(0,Math.floor(Number(options.repeat)||0));
function offsets(frames){
  const times=frames.map(frame=>frame.offset);times[0]??=0;times[times.length-1]??=1;
  let start=0;
  for(let end=1;end<times.length;end++)if(times[end]!=null){for(let i=start+1;i<end;i++)times[i]=times[start]+(times[end]-times[start])*(i-start)/(end-start);start=end;}
  return times;
}
// Shared cancellation contract: cancelling always settles `finished` and restores owned paint.
export function frames(element,keyframes,options){
  const {pseudoElement}=options;
  let settled=false,resolve,reject,control,effect;
  const finished=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const props=[...new Set(keyframes.flatMap(frame=>Object.keys(frame)))].filter(p=>p!=='offset');
  const saved=new Map(props.map(p=>[p,[element.style.getPropertyValue(cssName(p)),element.style.getPropertyPriority(cssName(p))]]));
  const restore=()=>{effect?.cancel();if(pseudoElement)return;for(const [p,[value,priority]]of saved){if(value)element.style.setProperty(cssName(p),value,priority);else element.style.removeProperty(cssName(p));}};
  const finish=()=>{if(settled)return;settled=true;control?.cancel?.();restore();resolve();};
  const cancel=()=>{if(settled)return;settled=true;control?.kill?.();control?.cancel?.();restore();reject(new DOMException('Animation cancelled','AbortError'));};
  try{
    if(pseudoElement||options.engine==='GSAP'){
      // GSAP owns the clock; the native effect paints the real pseudo-element (no DOM copy).
      effect=element.animate(keyframes,{...options,easing:'linear',fill:'both'});effect.pause();effect.currentTime=0;
      const clock={time:0};
      const repeat=repeats(options);
      control=gsap.timeline({onComplete:finish,delay:delaySeconds(options),repeat:repeat===Infinity?-1:repeat});
      control.to(clock,{time:options.duration,duration:options.duration/1000,ease:easing(options.easing),onUpdate:()=>{effect.currentTime=clock.time;}});
    }else{
      const values=Object.fromEntries(props.map(p=>[p,keyframes.map(frame=>frame[p]??getComputedStyle(element)[p])]));
      // The native Motion adapter has no retained visual-element render queue.
      // Wait for every property to commit before restoring the caller's paint.
      // Hybrid onComplete runs before its queued render, which could write opacity:0
      // back after dismiss cleanup and make the next dialog opening invisible.
      const bezier=/cubic-bezier\(([^)]+)\)/.exec(options.easing||'');
      const ease=options.easing==='linear'?'linear':bezier?bezier[1].split(',').map(Number):[.22,.65,.22,1];
      control=animate(element,values,{duration:options.duration/1000,ease,times:offsets(keyframes),delay:delaySeconds(options),repeat:repeats(options)});
      control.finished.then(finish,error=>{if(!settled){cancel();}});
    }
  }catch(error){settled=true;control?.kill?.();effect?.cancel();restore();reject(error);}
  return {finished,cancel,engine:pseudoElement||options.engine==='GSAP'?'GSAP':'Motion'};
}
export const versions=Object.freeze({motion:'13.4.0',gsap:'3.15.0'});
