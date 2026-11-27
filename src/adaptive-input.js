// Common input session for either renderer.
export const EMPTY_PAD=Object.freeze({moveX:0,moveY:0,aimX:0,aimY:0,buttons:[],pressed:[]});
export function radialStick(x,y,dead=.18){
 x=Number.isFinite(x)?x:0;y=Number.isFinite(y)?y:0;const n=Math.hypot(x,y);
 if(n<=dead)return [0,0];const strength=Math.min(1,(n-dead)/(1-dead));return [x/n*strength,y/n*strength];
}
export function samplePad(pad,previous=[]){
 if(!pad||pad.mapping!=='standard')return EMPTY_PAD;
 const [moveX,moveY]=radialStick(pad.axes[0],pad.axes[1]),[aimX,aimY]=radialStick(pad.axes[2],pad.axes[3]);
 const buttons=Array.from({length:17},(_,i)=>!!pad.buttons[i]&&(pad.buttons[i].pressed||pad.buttons[i].value>.55));
 return {moveX,moveY,aimX,aimY,buttons,pressed:buttons.map((v,i)=>v&&!previous[i])};
}
const active=p=>p.buttons.some(Boolean)||Math.hypot(p.moveX,p.moveY)>.22||Math.hypot(p.aimX,p.aimY)>.22;
export const initialInputMode=()=>typeof window!=='undefined'&&window.matchMedia('(any-pointer: fine)').matches?'keyboard':'touch';
export function createInputSession(root,onMode=()=>{}){
 let mode=initialInputMode(),index=null,previous=[],blocked=false;
 const controller=new AbortController(),signal=controller.signal;
 function switchMode(next){if(mode===next)return;mode=next;root.dataset.inputMode=mode;onMode(mode);}
 root.dataset.inputMode=mode;
 const keyboard=e=>{if(e.isComposing||e.ctrlKey||e.metaKey||e.altKey||e.repeat||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;blocked=true;switchMode('keyboard');};
 const pointer=e=>{blocked=true;switchMode(e.pointerType==='touch'||e.pointerType==='pen'?'touch':'keyboard');};
 window.addEventListener('keydown',keyboard,{capture:true,signal});
 root.addEventListener('pointerdown',pointer,{capture:true,signal});
 const reset=()=>{blocked=true;previous=[];};
 window.addEventListener('blur',reset,{signal});document.addEventListener('visibilitychange',reset,{signal});
 function pads(){try{return Array.from(navigator.getGamepads?.()??[]).filter(p=>p?.connected);}catch{return [];}}
 function poll(){
  if(document.hidden||!document.hasFocus()){reset();return EMPTY_PAD;}
  const available=pads(),current=available.find(p=>p.index===index&&p.mapping==='standard');
  const chosen=current??available.find(p=>p.mapping==='standard'&&active(samplePad(p)))??available.find(p=>p.mapping==='standard');
  if(!chosen){if(index!==null){index=null;previous=[];blocked=false;if(mode==='gamepad')switchMode(initialInputMode());}else if(!available.some(p=>p.mapping==='standard'))blocked=false;return EMPTY_PAD;}
  if(index!==chosen.index){index=chosen.index;previous=[];}
  const sample=samplePad(chosen,previous);previous=sample.buttons;
  if(blocked){if(!active(sample))blocked=false;return EMPTY_PAD;}
  if(sample.pressed.some(Boolean)||Math.hypot(sample.moveX,sample.moveY)>.22||Math.hypot(sample.aimX,sample.aimY)>.22)switchMode('gamepad');
  return mode==='gamepad'?sample:EMPTY_PAD;
 }
 return {get mode(){return mode;},poll,reset,diagnostic:()=>pads().map(p=>({id:p.id,mapping:p.mapping||'sin mapeo estándar',axes:Array.from(p.axes).map(n=>Math.round(n*100)/100),buttons:p.buttons.map((b,i)=>b.pressed?i:null).filter(n=>n!==null)})),destroy(){controller.abort();delete root.dataset.inputMode;}};
}
export function visibleButtons(root){return Array.from(root.querySelectorAll('button:not(:disabled),[role="button"]:not([aria-disabled="true"])')).filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('[hidden]'));}
export function padMenu(root,pad){
 const buttons=visibleButtons(root);if(!buttons.length)return false;const i=buttons.indexOf(document.activeElement);
 if(pad.pressed[12]||pad.pressed[14]||pad.pressed[13]||pad.pressed[15]){
  const dir=pad.pressed[12]||pad.pressed[14]?-1:1;
  buttons[i<0?(dir>0?0:buttons.length-1):(i+dir+buttons.length)%buttons.length].focus({preventScroll:true});
 }
 if(pad.pressed[0]){(buttons.includes(document.activeElement)?document.activeElement:buttons[0]).click();return true;}return false;
}
