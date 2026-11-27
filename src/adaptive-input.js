// Common input session for either renderer.
export const EMPTY_PAD=Object.freeze({moveX:0,moveY:0,aimX:0,aimY:0,buttons:[],pressed:[]});
export function radialStick(x,y,dead=.18){
 x=Number.isFinite(x)?x:0;y=Number.isFinite(y)?y:0;const n=Math.hypot(x,y);
 if(n<=dead)return [0,0];const strength=Math.min(1,(n-dead)/(1-dead));return [x/n*strength,y/n*strength];
}
const profileKey=id=>'vt-pad-profile-v1:'+id;
export function validPadProfile(profile,pad){
 if(!profile||!pad||!Array.isArray(profile.axes)||profile.axes.length!==4||!Array.isArray(profile.buttons)||profile.buttons.length!==17)return false;
 const a=profile.axes;
 return new Set(a.map(x=>x?.index)).size===4&&a.every(x=>x&&Number.isInteger(x.index)&&x.index>=0&&x.index<pad.axes.length&&[1,-1].includes(x.sign)&&Number.isFinite(x.center)&&Math.abs(x.center)<.45)&&
 profile.buttons.every(x=>x===null||Number.isInteger(x)&&x>=0&&x<pad.buttons.length)&&new Set(profile.buttons.filter(x=>x!==null)).size===profile.buttons.filter(x=>x!==null).length&&[0,1,2,3,9].every(i=>profile.buttons[i]!==null);
}
export function samplePad(pad,previous=[],profile){
 if(!pad)return EMPTY_PAD;
 const custom=validPadProfile(profile,pad);
 if(!custom&&pad.mapping!=='standard')return EMPTY_PAD;
 const axis=i=>custom?(pad.axes[profile.axes[i].index]-profile.axes[i].center)*profile.axes[i].sign:pad.axes[i];
 const [moveX,moveY]=radialStick(axis(0),axis(1)),[aimX,aimY]=radialStick(axis(2),axis(3));
 const buttons=Array.from({length:17},(_,i)=>{const index=custom?profile.buttons[i]:i,b=index===null?null:pad.buttons[index];return !!b&&(b.pressed||b.value>.55);});
 return {moveX,moveY,aimX,aimY,buttons,pressed:buttons.map((v,i)=>v&&!previous[i])};
}
const active=p=>p.buttons.some(Boolean)||Math.hypot(p.moveX,p.moveY)>.22||Math.hypot(p.aimX,p.aimY)>.22;
export const initialInputMode=()=>typeof window!=='undefined'&&window.matchMedia('(any-pointer: fine)').matches?'keyboard':'touch';
export function createInputSession(root,onMode=()=>{}){
 let mode=initialInputMode(),index=null,previous=[],blocked=false,calibration=null;
 const profiles=new Map();
 function profile(p){if(!profiles.has(p.id)){let stored=null;try{stored=JSON.parse(localStorage.getItem(profileKey(p.id))||'null');}catch{}profiles.set(p.id,validPadProfile(stored,p)?stored:null);}return profiles.get(p.id);}
 const supported=p=>p.mapping==='standard'||!!profile(p);
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
  if(calibration)return EMPTY_PAD;
  const available=pads(),current=available.find(p=>p.index===index&&supported(p));
  const chosen=current??available.find(p=>supported(p)&&active(samplePad(p,[],profile(p))))??available.find(supported);
  if(!chosen){if(index!==null){index=null;previous=[];blocked=false;if(mode==='gamepad')switchMode(initialInputMode());}else if(!available.some(supported))blocked=false;return EMPTY_PAD;}
  if(index!==chosen.index){index=chosen.index;previous=[];}
  const sample=samplePad(chosen,previous,profile(chosen));previous=sample.buttons;
  if(blocked){if(!active(sample))blocked=false;return EMPTY_PAD;}
  if(sample.pressed.some(Boolean)||Math.hypot(sample.moveX,sample.moveY)>.22||Math.hypot(sample.aimX,sample.aimY)>.22)switchMode('gamepad');
  return mode==='gamepad'?sample:EMPTY_PAD;
 }
 function calibrate(){
  if(calibration)return;
  reset();
  const panel=document.createElement('dialog');panel.className='vt-pad-calibration';panel.setAttribute('aria-label','Calibrar mando');
  panel.innerHTML='<h2>Calibrar mando</h2><p data-pad-prompt>Conecta el mando y pulsa un botón.</p><p data-pad-progress></p><div><button data-pad-skip hidden>Omitir botón opcional</button><button data-pad-cancel>Cancelar</button></div>';
  root.append(panel);panel.showModal();
  const status=panel.querySelector('[data-pad-prompt]'),progress=panel.querySelector('[data-pad-progress]'),skip=panel.querySelector('[data-pad-skip]');
  const axisNames=['stick izquierdo hacia la derecha','stick izquierdo hacia abajo','stick derecho hacia la derecha','stick derecho hacia abajo'];
  const names=['X (cruz)','círculo','cuadrado','triángulo','L1','R1','L2','R2','SHARE','OPTIONS','L3','R3','cruceta arriba','cruceta abajo','cruceta izquierda','cruceta derecha','PS'];
  let chosen=null,centers=[],axes=[],buttons=Array(17).fill(null),step=-1,neutralSince=0,armed=false,raf=0,waiting=true;
  const required=new Set([0,1,2,3,9]);
  function close(){cancelAnimationFrame(raf);panel.close();panel.remove();calibration=null;reset();}
  calibration={close};
  panel.addEventListener('cancel',e=>{e.preventDefault();close();});
  panel.querySelector('[data-pad-cancel]').onclick=close;
  function next(){step++;armed=false;neutralSince=0;waiting=true;
   if(step===21){const p=pads().find(p=>p.index===chosen.index&&p.id===chosen.id),record={axes,buttons};
    if(validPadProfile(record,p)){profiles.set(p.id,record);try{localStorage.setItem(profileKey(p.id),JSON.stringify(record));}catch{}index=null;switchMode('gamepad');close();}else{status.textContent='No se pudo validar el perfil. Cancela y vuelve a intentarlo.';cancelAnimationFrame(raf);}return;}
   progress.textContent=(step+1)+' / 21';
   status.textContent='Suelta el mando. Después '+(step<4?'mueve '+axisNames[step]:'pulsa '+names[step-4])+'.';
   skip.hidden=step<4||required.has(step-4);
  }
  skip.onclick=()=>{if(step>=4&&!required.has(step-4))next();};
  const frame=now=>{
   raf=requestAnimationFrame(frame);
   if(document.hidden||!document.hasFocus()){armed=false;neutralSince=0;return;}
   if(!chosen){const p=pads().find(p=>p.buttons.some(b=>b.pressed));if(!p)return;chosen={id:p.id,index:p.index};centers=Array.from(p.axes);step=-1;next();return;}
   const p=pads().find(p=>p.id===chosen.id&&p.index===chosen.index);if(!p){status.textContent='Mando desconectado. Vuelve a conectarlo o cancela.';armed=false;neutralSince=0;return;}
   if(step>=21)return;
   const values=Array.from(p.axes,(v,i)=>v-(centers[i]||0)),down=p.buttons.map(b=>b.pressed||b.value>.55);
   const neutral=!down.some(Boolean)&&values.every(v=>Math.abs(v)<.25);
   if(!armed){if(!neutral){neutralSince=0;return;}if(!neutralSince)neutralSince=now;if(now-neutralSince<220)return;armed=true;waiting=false;}
   if(step<4){let best=-1;for(let i=0;i<values.length;i++)if(!axes.some(a=>a.index===i)&&Math.abs(values[i])>.65&&(best<0||Math.abs(values[i])>Math.abs(values[best])))best=i;
    if(best>=0){axes.push({index:best,sign:Math.sign(values[best]),center:centers[best]});next();}}
   else{const pressed=down.findIndex((b,i)=>b&&!buttons.includes(i));if(pressed>=0){buttons[step-4]=pressed;next();}}
  };
  raf=requestAnimationFrame(frame);
 }
 return {get calibrating(){return !!calibration;},calibrate,get mode(){return mode;},poll,reset,diagnostic:()=>pads().map(p=>({id:p.id,mapping:p.mapping||'sin mapeo estándar',axes:Array.from(p.axes).map(n=>Math.round(n*100)/100),buttons:p.buttons.map((b,i)=>b.pressed?i:null).filter(n=>n!==null)})),destroy(){calibration?.close();controller.abort();delete root.dataset.inputMode;}};
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
