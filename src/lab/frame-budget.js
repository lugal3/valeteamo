// Separate visual quality from frame cadence. No simulation state is modified.
export function houseFrameLimit({ready,paused,pianoPractice}){
 return !ready?5:paused?15:pianoPractice?30:60;
}
export function houseRenderSize(width,height,dpr,quality='medium',capture=false,adaptiveScale=1){
 width=Math.max(1,width);height=Math.max(1,height);
 const low=quality==='low',detailed=capture&&!low;
 const base=low?(capture?.70:.55):detailed?1.12:.80;
 // Preserve close-up quality; only ordinary gameplay uses adaptive density.
 const multiplier=capture?1:Math.min(1,Math.max(.70,Number(adaptiveScale)||1));
 const maxWidth=detailed?1600:1200,maxHeight=detailed?1000:760;
 const density=Math.min(Math.min(Number(dpr)||1,1.7)*base*multiplier,maxWidth/width,maxHeight/height);
 return {width:Math.min(maxWidth,Math.max(1,Math.round(width*density))),height:Math.min(maxHeight,Math.max(1,Math.round(height*density)))};
}
const stages=Object.freeze([{quality:'medium',scale:1},{quality:'medium',scale:.85},{quality:'medium',scale:.70},{quality:'low',scale:1}]);
// Three consecutive complete active seconds are required for each step.
// Pauses, cinematics, menus, background tabs and long stalls discard the
// measurement window, instead of treating their deliberate cap as GPU load.
export function createHouseBudget(){
 let index=0,manual=false,last=null,start=null,frames=0,slow=0;
 const state=()=>manual?{quality:'low',scale:1,auto:false}:{...stages[index],auto:true};
 function pause(){last=start=null;frames=slow=0;}
 return {
  state,pause,
  select(quality){manual=quality==='low';index=0;pause();return state();},
  record(now,active){
   if(!active||!Number.isFinite(now)){pause();return null;}
   if(last===null||now-last>250||now<=last){pause();last=start=now;return null;}
   last=now;frames++;
   const duration=now-start;
   if(duration<1000)return null;
   const fps=frames*1000/duration;
   frames=0;start=now;
   if(manual||index>=stages.length-1){slow=0;return {fps,changed:false,...state()};}
   slow=fps<45?slow+1:0;
   const changed=slow>=3;
   if(changed){index++;slow=0;}
   return {fps,changed,...state()};
  }
 };
}
