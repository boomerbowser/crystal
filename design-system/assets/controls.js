/* Preserve native fields and labels; add only a Resin material shell. */
(function(){
 const selector='select,textarea,input:not([type]),input[type=text],input[type=search],input[type=email],input[type=password],input[type=number],input[type=url]';
 function badge(parent,kind){const existing=parent.querySelector(':scope > .cr-indicator');if(existing){existing.dataset.kind=kind;return;}const indicator=document.createElement('span');indicator.className='cr-indicator';indicator.dataset.kind=kind;indicator.setAttribute('aria-hidden','true');parent.append(indicator);}
 function enhance(scope){
  for(const link of scope.querySelectorAll('nav a'))link.classList.add('cr-control');
  for(const field of scope.querySelectorAll(selector)){if(!field.parentElement.classList.contains('cr-field-shell')){const shell=document.createElement('span');shell.className='cr-field-shell';field.before(shell);shell.append(field);}badge(field.parentElement,'field');}
  /* Selection, current location and activity are distinct marks. A check is never
     one of them: it belongs to validation and information display only. */
  for(const control of scope.querySelectorAll('button[aria-pressed],button[aria-selected],button[aria-checked],a[aria-current],button[aria-busy],[role=tab]')){
   const kind=control.getAttribute('aria-busy')==='true'?'busy':(control.hasAttribute('aria-current')?'current':'selection');
   badge(control,kind);
  }
 }
 function updateRange(field){const min=Number(field.min||0),max=Number(field.max||100);const progress=max>min?Math.max(0,Math.min(100,(Number(field.value)-min)/(max-min)*100)):0;field.style.setProperty('--cr-range-progress',progress+'%');}
 function syncRanges(){document.querySelectorAll('input[type=range]').forEach(updateRange);}
 document.addEventListener('input',event=>{if(event.target.matches('input[type=range]'))updateRange(event.target);});
 document.addEventListener('change',syncRanges);
 document.addEventListener('reset',()=>requestAnimationFrame(syncRanges));
 enhance(document);syncRanges();
 const observer=new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'||r.addedNodes.length)){enhance(document);syncRanges();}});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed','aria-selected','aria-checked','aria-current','aria-busy']});
 window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
})();
