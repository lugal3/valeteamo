import {groundHeight} from './world.js';
import {navigate} from './navigation.js';
import {sampleBlink} from './animations/face.js';
import {LOIS_VISUAL_ID} from './lois-ps2-profile.js';
import {buildLoisPs2Model} from './lois-ps2-model.js';
import {startLoisReaction,advanceLoisReaction} from './lois-ps2-reactions.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const LOUIS_UNTIE_SECONDS=3.25;
const ROUTE=Object.freeze([
 {x:8.55,z:13.74},{x:8.55,z:12.4},{x:8.55,z:10.2},
 {x:8.55,z:8.0},{x:8.55,z:5.6},{x:8.55,z:4.2},
 {x:8.55,z:2.65},{x:9.5,z:2.2},{x:10.4,z:2.8},
 {x:11.20,z:4.08},{x:11.82,z:4.08}
]);
export const LOUIS_HIDING_SPOT=Object.freeze({x:11.82,y:0,z:4.08});
export function createLouisEscape(world){
 const point=ROUTE[0],y=groundHeight(point.x,point.z,-3.55,true);
 return {kind:'louis-companion',id:'louis-escape',label:'Louis rescatado',visualPreset:LOIS_VISUAL_ID,visualVariant:'photo-a',x:point.x,y,z:point.z,yaw:Math.PI,phase:'untying',waypoint:1,age:0,step:0,crouch:.33,concealed:false,interactable:false,walk:0,speed:0,blink:0,visualReaction:null,world};
}
export function updateLouisEscape(louis,dt,kitty=null){
 if(!louis||dt<=0)return null;
 louis.age+=dt;
 advanceLoisReaction(louis,dt);
 louis.blink=sampleBlink(louis.age+.61,{reduced:false,firstAt:1.43});
 louis.speed=Math.max(0,louis.speed-dt*5);
 if(louis.phase==='follow')louis.crouch=Math.max(0,louis.crouch-dt*1.6);
 if(louis.phase==='untying'){
  louis.crouch=.33;
  if(louis.age>=LOUIS_UNTIE_SECONDS){louis.phase='climb';louis.age=0;louis.crouch=0;startLoisReaction(louis,'look-kitty');return 'untied';}
  return null;
 }
 if(louis.phase==='climb'){
  const target=ROUTE[louis.waypoint];
  if(!target){louis.phase='hide';louis.age=0;louis.yaw=Math.PI;startLoisReaction(louis,'startle');return 'arrived';}
  const dx=target.x-louis.x,dz=target.z-louis.z,d=Math.hypot(dx,dz);
  if(d<.055){louis.waypoint++;return null;}
  const step=Math.min(d,dt*2.10);
  louis.x+=dx/d*step;louis.z+=dz/d*step;
  louis.y=groundHeight(louis.x,louis.z,louis.y,true);
  louis.yaw=Math.atan2(dx,dz);
  louis.walk+=step;louis.speed=step/Math.max(dt,.0001);
 }else if(louis.phase==='hide'){
  louis.crouch=Math.min(1,louis.age/1.1);
  if(louis.age>=1.5){louis.phase='hidden';louis.age=0;louis.concealed=true;startLoisReaction(louis,'listen');return 'hidden';}
 }else if(louis.phase==='follow'&&kitty){
  const behind={x:kitty.x-Math.sin(kitty.yaw)*.90,z:kitty.z-Math.cos(kitty.yaw)*.90};
  const dx=behind.x-louis.x,dz=behind.z-louis.z,d=Math.hypot(dx,dz);
  if(d>.55&&Math.abs(kitty.y-louis.y)<.7){
   const step=Math.min(d-.47,dt*3),body={x:louis.x,y:louis.y,z:louis.z};
   const moved=navigate(body,louis.world,dx/d*step,dz/d*step,1.60);
   louis.x=body.x;louis.y=body.y;louis.z=body.z;louis.walk+=moved;louis.speed=moved/Math.max(dt,.0001);louis.yaw=Math.atan2(dx,dz);
  }
 }
 return null;
}
export function freeLouis(louis){
 if(louis?.phase!=='hidden')return false;
 louis.phase='follow';louis.concealed=false;louis.speed=0;louis.age=0;
 startLoisReaction(louis,'relief');
 return true;
}
export function louisCamera(louis){
 // The old shoulder camera crossed the narrow tunnel wall and produced a
 // pitch-black shot. Keep the lens on the physical walkable tunnel ramp.
 if(louis.phase==='untying'){
  const z=louis.z-1.18;
  const shot=clamp((louis.age||0)/LOUIS_UNTIE_SECONDS,0,1);
  const ease=shot*shot*(3-2*shot);
  // Open on Kitty's paws working the knot; finish on Louis' relieved face.
  return {x:louis.x,y:louis.y+1.24,z,yaw:0,pitch:-.34+.28*ease};
 }
 if(louis.phase==='climb'&&louis.y<-.18){
  const z=Math.max(2.63,louis.z-.73);
  const floor=groundHeight(8.55,z,louis.y,true);
  const y=Number.isFinite(floor)?floor+1.20:louis.y+1.25;
  const dz=louis.z-z;
  return {x:8.55,y,z,yaw:Math.atan2(louis.x-8.55,dz),pitch:Math.atan2(louis.y+1.42-y,Math.max(.1,dz))};
 }
 // Across the open kitchen, framed to show his face while he crouches
 // behind the American-style breakfast bar.
 const x=10.65,z=2.75,y=1.52;
 const dx=louis.x-x,dz=louis.z-z;
 return {x,y,z,yaw:Math.atan2(dx,dz),pitch:Math.atan2(louis.y+1.25-y,Math.hypot(dx,dz))};
}
// Only Photo-A is shipped in the 3D rescue. The old primitive head/body and
// louisPartPose fallback were unused in the live flow and inflated the JS
// bundle. Keep the existing actor identifiers and 21-bone rescue rig intact.
export function louisModel(piece,{quality='mobile'}={}){
 return buildLoisPs2Model(piece,{quality,photoMode:true});
}
