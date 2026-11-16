// Standalone real PS2-B renderer: no React, no routing, no 2D engine and no
// additional WebGL contexts. Deliberately low resolution for iOS Safari.
import {HouseRenderer,pickupGeometry} from './lab/renderer.js';
import {LOIS_VISUAL_ID} from './lab/lois-ps2-profile.js';

const canvas=document.getElementById('lois-canvas');
const panel=document.getElementById('lois-stage');
const status=document.getElementById('lois-status');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const actor={id:'louis-escape',kind:'louis-companion',visualPreset:LOIS_VISUAL_ID,visualVariant:'photo-a',
 x:0,y:0,z:0,yaw:0,phase:'follow',age:.5,walk:0,speed:0,crouch:0,blink:0};
const stage=[
 {id:'preview-floor',x:0,y:-.12,z:0,w:14,h:.18,d:14,mat:'floor',color:[.44,.43,.42],solid:false},
 {id:'preview-wall',x:0,y:2,z:-3,w:20,h:8,d:.1,mat:'plaster',color:[.50,.51,.56],solid:false}
];
// Fixed reproducible angles for comparing the actual game mesh with the
// approved portrait (no enlarged face impostors or different asset variants).
// The bust framing includes the collar and both shoulders after the torso pass.
const cameras={
 front:()=>({x:0,y:1.11,z:2.2,yaw:Math.PI,pitch:0}),
 side:()=>({x:1.03,y:1.66,z:0,yaw:-Math.PI/2,pitch:0}),
 threequarter:()=>({x:.54,y:1.70,z:1.03,yaw:Math.PI+Math.atan(.54/1.03),pitch:0}),
 portrait:()=>({x:0,y:1.72,z:.91,yaw:Math.PI,pitch:0}),
 bust:()=>({x:.22,y:1.48,z:1.40,yaw:Math.PI+Math.atan(.22/1.40),pitch:0})
};
let renderer=null,frame=0,last=0,lastDraw=0,view='portrait',motion='idle',blinkUntil=0,stopped=false;
function error(message){
 stopped=true;cancelAnimationFrame(frame);
 status.hidden=false;status.className='error';
 status.textContent='No se pudo mostrar el modelo 3D: '+String(message).slice(0,240);
}
function size(){
 const rect=panel.getBoundingClientRect();
 // A high device-pixel-ratio iPhone can otherwise create expensive renderbuffers.
 const dpr=Math.min(1.25,window.devicePixelRatio||1);
 const w=Math.max(240,Math.min(920,Math.round(rect.width*dpr)));
 const h=Math.max(150,Math.min(650,Math.round(rect.height*dpr)));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
}
function setSelected(group,selected){
 for(const button of document.querySelectorAll('[data-'+group+']'))
  button.setAttribute('aria-pressed',String(button.getAttribute('data-'+group)===selected));
}
for(const button of document.querySelectorAll('[data-view]')){
 button.addEventListener('click',()=>{
  view=button.getAttribute('data-view');setSelected('view',view);
 });
}
for(const button of document.querySelectorAll('[data-motion]')){
 button.addEventListener('click',()=>{
  motion=button.getAttribute('data-motion');setSelected('motion',motion);
 });
}
document.getElementById('blink').addEventListener('click',()=>{blinkUntil=performance.now()+220;});
function animate(t){
 if(stopped)return;
 frame=requestAnimationFrame(animate);
 if(document.hidden||t-lastDraw<33)return;
 const dt=Math.max(0,Math.min(.05,(t-(last||t))/1000));
 last=t;lastDraw=t;
 actor.age+=dt;
 if(motion==='walk'){
  actor.phase='follow';actor.speed=1.6;actor.walk+=dt*2.8;actor.crouch=0;
 }else if(motion==='hide'){
  actor.phase='hide';actor.speed=0;actor.crouch=.77;
 }else if(motion==='untying'){
  actor.phase='untying';actor.speed=0;actor.crouch=.33;
 }else{
  actor.phase='follow';actor.speed=0;actor.crouch=0;
 }
 actor.blink=t<blinkUntil?1:0;
 try{renderer.render(cameras[view](),true,actor.age,false,{reduced:reduced.matches,shotLight:.8});}
 catch(err){error(err?.message||String(err));}
}
async function init(){
 try{
  size();
  renderer=new HouseRenderer(canvas,'low');
  renderer.rebuild([...stage,...pickupGeometry([actor])]);
  const ok=await renderer.loisFaceTexture.readyPromise;
  if(!ok)throw Error('No se pudo cargar la textura del rostro PS2.');
  renderer.render(cameras[view](),true,actor.age,false,{reduced:reduced.matches,shotLight:.8});
  if(renderer.gl.getError()!==renderer.gl.NO_ERROR)throw Error('WebGL devolvió un error de renderizado.');
  window.__loisReady=true;
  window.__loisPreview={actor,renderer,view:()=>view,motion:()=>motion};
  status.hidden=true;
  last=performance.now();
  frame=requestAnimationFrame(animate);
 }catch(err){error(err?.message||String(err));}
}
window.addEventListener('resize',size);
window.addEventListener('orientationchange',size);
window.addEventListener('pagehide',()=>{
 stopped=true;cancelAnimationFrame(frame);renderer?.destroy();
},{once:true});
canvas.addEventListener('webglcontextlost',event=>{
 event.preventDefault();error('Safari perdió el contexto WebGL. Prueba esta vista en el PC.');
});
init();
