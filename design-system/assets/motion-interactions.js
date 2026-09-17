/* Opt-in installer used by both Crystal preview pages. Returns a real cleanup function. */
(function(root){
 function bindFeedback(scope=document){
  const press=event=>{
   if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
   if(event.repeat||event.button>0)return;
   const button=event.target.closest?.('button');
   if(!button||button.disabled||button.getAttribute('aria-disabled')==='true')return;
   CrystalMotion.play(button,'press');
  };
  const hover=event=>{const control=event.target.closest?.('button');if(event.pointerType==='mouse'&&control&&!control.disabled&&!control.contains(event.relatedTarget))CrystalMotion.play(control,'hover');};
  scope.addEventListener('pointerover',hover);scope.addEventListener('pointerdown',press);scope.addEventListener('keydown',press);
  return ()=>{scope.removeEventListener('pointerover',hover);scope.removeEventListener('pointerdown',press);scope.removeEventListener('keydown',press);};
 }
 root.CrystalInteractions=Object.freeze({bindFeedback});
 bindFeedback();
})(window);
