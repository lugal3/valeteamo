import {blocked,groundHeight,lineBlocked,overlaps,roomAt} from './world.js';

export const HIDE_SECONDS=1.45;
const EXIT_OFFSETS=[[0,0],[.35,0],[-.35,0],[0,.35],[0,-.35],[.55,.45],[.55,-.45],[-.55,.45],[-.55,-.45],[.8,0],[-.8,0],[0,.8],[0,-.8]];

export function hidingExit(world,object,floor,fallback=null){
 const crouched=!!object.requiresCrouch,eye=crouched?1.03:1.63;
 const anchor={x:object.returnX,y:floor+.45,z:object.returnZ};
 const passage=world.boxes.filter(box=>!overlaps(box,anchor.x,floor,anchor.z,.01,eye+.02));
 const candidates=EXIT_OFFSETS.map(([dx,dz])=>({x:anchor.x+dx,z:anchor.z+dz}));
 if(fallback)candidates.push(fallback);
 for(const {x,z} of candidates){
  if(!(Math.abs(groundHeight(x,z,floor,world.hatch?.amount>.92)-floor)<=.08)||
   roomAt(x,z,floor)!==roomAt(anchor.x,anchor.z,floor)||
   blocked(world.boxes,x,floor,z,.2,eye+.02)||
   lineBlocked(passage,anchor,{x,y:anchor.y,z}))continue;
  return {x,y:floor+eye,z,yaw:object.hideCamera.yaw+Math.PI,pitch:0,crouched,eye};
 }
 return null;
}

export function hiddenPose(object,outside){
 return {...object.hideCamera,objectId:object.id,hideType:object.hideType,returnX:outside.x,returnZ:outside.z};
}

const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
function mix(a,b,t){const f=smooth(t),angle=Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw));return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z:a.z+(b.z-a.z)*f,yaw:a.yaw+angle*f,pitch:a.pitch+(b.pitch-a.pitch)*f};}
export function hidingFrame({from,inside,outside,progress,entering=true,wardrobe=true}){
 const t=Math.max(0,Math.min(1,progress));
 if(!wardrobe)return {camera:mix(from,entering?inside:outside,t),doorAmount:0};
 if(entering){
  const approach={...outside,yaw:inside.yaw+Math.PI,pitch:0},backward={...inside,yaw:inside.yaw+Math.PI};
  if(t<.22)return {camera:mix(from,approach,t/.22),doorAmount:smooth(t/.22)};
  if(t<.64)return {camera:mix(approach,backward,(t-.22)/.42),doorAmount:1};
  if(t<.82)return {camera:mix(backward,inside,(t-.64)/.18),doorAmount:1};
  return {camera:{...inside},doorAmount:1-smooth((t-.82)/.18)*.965};
 }
 if(t<.22)return {camera:{...from},doorAmount:.035+smooth(t/.22)*.965};
 const forward={...outside,yaw:inside.yaw,pitch:0};
 if(t<.72)return {camera:mix(from,forward,(t-.22)/.5),doorAmount:1};
 return {camera:mix(forward,outside,(t-.72)/.28),doorAmount:1-smooth((t-.72)/.28)};
}

// A bounded camera-only lean within the original refuge. Never moves the
// collision body, opens a door or changes the AI's hidden/witnessed flags.
export function hidePeekSupported(hidden){return ['wardrobe','underbed'].includes(hidden?.hideType);}
export function hideLookBounds(hidden,peeking=false){
 return hidden?.hideType==='wardrobe'?{yaw:peeking?.65:.28,pitch:peeking?.28:.14}:
  {yaw:peeking&&hidden?.hideType==='underbed'?1.12:.6,pitch:peeking?.25:.14};
}
export function advanceHidePeek(amount,held,dt,reduced=false){
 const target=held?1:0;
 if(reduced)return target;
 return Math.max(0,Math.min(1,amount+(target-amount)*(1-Math.exp(-Math.max(0,Math.min(.1,dt))*11))));
}
export function hiddenCamera(hidden,yaw,pitch,peek=0,breath=0,reduced=false){
 const amount=hidePeekSupported(hidden)?Math.max(0,Math.min(1,peek)):0,range=hideLookBounds(hidden,amount>.1);
 const angle=Math.atan2(Math.sin(yaw-hidden.yaw),Math.cos(yaw-hidden.yaw));
 const facing=hidden.yaw+Math.max(-range.yaw,Math.min(range.yaw,angle));
 const lean=hidden.hideType==='wardrobe'?.24:.27;
 const lateral=Math.max(-.10,Math.min(.10,angle*.14))*amount;
 return {x:hidden.x+Math.sin(hidden.yaw)*lean*amount+Math.cos(hidden.yaw)*lateral,
 y:hidden.y+(hidden.hideType==='wardrobe'?.035:.025)*amount+(reduced?0:Math.sin(breath)*.009),
 z:hidden.z+Math.cos(hidden.yaw)*lean*amount-Math.sin(hidden.yaw)*lateral,
 yaw:facing,pitch:Math.max(-range.pitch,Math.min(range.pitch,pitch))};
}
