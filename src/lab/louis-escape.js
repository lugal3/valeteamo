import {groundHeight} from './world.js';
import {navigate} from './navigation.js';
import {sampleBlink} from './animations/face.js';
import {LOIS_VISUAL_ID} from './lois-ps2-profile.js';
import {buildLoisPs2Model} from './lois-ps2-model.js';
import {startLoisReaction,advanceLoisReaction} from './lois-ps2-reactions.js';
import {KITCHEN_HIDE_APPROACH,KITCHEN_HIDE_SPOT} from './kitchen-hide-layout.js';
import {advanceLoisMotion} from './lois-motion.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const turnTowards=(current,target,dt,speed=7)=>{
 const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 const eased=delta*Math.min(1,Math.max(0,dt)*speed);
 return current+clamp(eased,-Math.max(0,dt)*4.8,Math.max(0,dt)*4.8);
};
export const LOUIS_UNTIE_SECONDS=3.25;
// Preserve the already tested basement climb, but once above ground go
// AROUND the north tip of the rotated bar into the actual hiding lane.
// Never pass through a collider or jump to a target behind the furniture.
const TUNNEL_ROUTE=Object.freeze([
 {x:8.55,z:13.74},{x:8.55,z:12.4},{x:8.55,z:10.2},
 {x:8.55,z:8.0},{x:8.55,z:5.6},{x:8.55,z:4.2},
 {x:8.55,z:2.65}
]);
const ROUTE=Object.freeze([...TUNNEL_ROUTE,...KITCHEN_HIDE_APPROACH]);
const FIRST_KITCHEN_WAYPOINT=TUNNEL_ROUTE.length;
// After the trap, walk back through the same real gap instead of trying to
// cut directly through the stone counter to follow Kitty.
export const LOUIS_EXIT_ROUTE=Object.freeze(
 KITCHEN_HIDE_APPROACH.slice(0,-1).reverse()
);
export const LOUIS_HIDING_SPOT=KITCHEN_HIDE_SPOT;
export const LOUIS_RESCUE_ROUTE=ROUTE;
export function createLouisEscape(world){
 const point=ROUTE[0],y=groundHeight(point.x,point.z,-3.55,true);
 return {kind:'louis-companion',id:'louis-escape',label:'Louis rescatado',visualPreset:LOIS_VISUAL_ID,visualVariant:'photo-a',x:point.x,y,z:point.z,yaw:Math.PI,phase:'untying',waypoint:1,age:0,step:0,crouch:.33,concealed:false,interactable:false,walk:0,speed:0,blink:0,visualReaction:null,untieBeat:0,world};
}
export function updateLouisEscape(louis,dt,kitty=null){
 if(!louis||dt<=0)return null;
 const before={x:louis.x,y:louis.y,z:louis.z};
 const cue=advanceLouisEscape(louis,dt,kitty);
 advanceLoisMotion(louis,dt,before,kitty);
 return cue;
}
function advanceLouisEscape(louis,dt,kitty){
 louis.age+=dt;
 advanceLoisReaction(louis,dt);
 louis.blink=sampleBlink(louis.age+.61,{reduced:false,firstAt:1.43});
 louis.speed=Math.max(0,louis.speed-dt*5);
 if(louis.phase==='follow')louis.crouch=Math.max(0,louis.crouch-dt*1.6);
 if(louis.phase==='untying'){
  louis.crouch=.33;
  // Three one-shot, rig-native emotional beats: notice Kitty's hands,
  // tense as the knot releases, then look up to recognize the rescuer.
  // Never spawn new meshes or overwrite the approved Photo-A texture.
  for(const [index,at,type] of [[1,.46,'reach'],[2,1.68,'startle'],[3,2.65,'look-kitty']]){
   if(louis.untieBeat<index&&louis.age>=at){
    louis.untieBeat=index;startLoisReaction(louis,type);
   }
  }
  if(louis.age>=LOUIS_UNTIE_SECONDS){louis.phase='climb';louis.age=0;louis.crouch=0;startLoisReaction(louis,'look-kitty');return 'untied';}
  return null;
 }
 if(louis.phase==='climb'){
  const target=ROUTE[louis.waypoint];
  if(!target){
   louis.phase='hide';louis.age=0;louis.crouch=0;
   // Last waypoint is the physical hiding spot; only correct sub-centimetre
   // positional drift to avoid a visible arrival teleport.
   if(Math.hypot(louis.x-LOUIS_HIDING_SPOT.x,louis.z-LOUIS_HIDING_SPOT.z)<.06){
    louis.x=LOUIS_HIDING_SPOT.x;louis.z=LOUIS_HIDING_SPOT.z;
   }
   // Keep walking orientation; turn toward the panel during the crouch,
   // instead of snapping 90 degrees on the arrival frame.
   louis.speed=0;
   startLoisReaction(louis,'startle');return 'arrived';
  }
  const dx=target.x-louis.x,dz=target.z-louis.z,d=Math.hypot(dx,dz);
  if(d<.055){louis.waypoint++;return null;}
  const step=Math.min(d,dt*2.10),distanceToMove=step/d;
  let moved=step;
  if(louis.waypoint>=FIRST_KITCHEN_WAYPOINT&&louis.y>-.12){
   // Same swept collision checks used by Kitty. This prevents the old
   // scripted walk from cutting through the newly rotated stone bar.
   const position={x:louis.x,y:louis.y,z:louis.z};
   moved=navigate(position,louis.world,dx*distanceToMove,dz*distanceToMove,1.64);
   louis.x=position.x;louis.y=position.y;louis.z=position.z;
  }else{
   louis.x+=dx*distanceToMove;louis.z+=dz*distanceToMove;
   louis.y=groundHeight(louis.x,louis.z,louis.y,true);
  }
  const facing=Math.atan2(dx,dz);
  const difference=Math.atan2(Math.sin(facing-louis.yaw),Math.cos(facing-louis.yaw));
  louis.yaw=turnTowards(louis.yaw,facing,dt,8);
  louis.walk+=moved;louis.speed=moved/Math.max(dt,.0001);
 }else if(louis.phase==='hide'){
  louis.crouch=Math.min(1,louis.age/1.1);
  const angle=Math.atan2(Math.sin(LOUIS_HIDING_SPOT.yaw-louis.yaw),
   Math.cos(LOUIS_HIDING_SPOT.yaw-louis.yaw));
  louis.yaw+=angle*Math.min(1,dt*7);
  if(louis.age>=1.5){louis.phase='hidden';louis.age=0;louis.concealed=true;startLoisReaction(louis,'listen');return 'hidden';}
 }else if(louis.phase==='follow'&&louis.exitRouteActive){
  const target=LOUIS_EXIT_ROUTE[louis.exitWaypoint||0];
  if(!target)louis.exitRouteActive=false;
  else{
   const dx=target.x-louis.x,dz=target.z-louis.z,d=Math.hypot(dx,dz);
   if(d<.065){louis.exitWaypoint++;return null;}
   const move=Math.min(d,dt*2.05),body={x:louis.x,y:louis.y,z:louis.z};
   const moved=navigate(body,louis.world,dx/d*move,dz/d*move,1.64);
   louis.x=body.x;louis.y=body.y;louis.z=body.z;
   const facing=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(facing-louis.yaw),Math.cos(facing-louis.yaw));
   louis.yaw=turnTowards(louis.yaw,facing,dt,8);
   louis.walk+=moved;louis.speed=moved/Math.max(dt,.0001);
   return null;
  }
 }
 if(louis.phase==='follow'&&kitty){
  // Follow Kitty's physical position, never an orbiting camera-relative point.
  const dx=kitty.x-louis.x,dz=kitty.z-louis.z,d=Math.hypot(dx,dz);
  const sameFloor=Math.abs(kitty.y-louis.y)<.7;
  louis.followMoving=sameFloor&&(louis.followMoving?d>1.05:d>1.42);
  if(louis.followMoving){
   const desired=Math.min(2.9,Math.max(.65,(d-1.0)*2.1));
   const speed=Math.min(desired,(louis.visualMotion?.speed??0)+dt*6.5);
   const step=Math.min(d-1.02,dt*Math.max(.18,speed)),body={x:louis.x,y:louis.y,z:louis.z};
   const moved=navigate(body,louis.world,dx/d*step,dz/d*step,1.60);
   louis.x=body.x;louis.y=body.y;louis.z=body.z;louis.walk+=moved;louis.speed=moved/Math.max(dt,.0001);
   louis.yaw=turnTowards(louis.yaw,Math.atan2(dx,dz),dt,7);
  }
 }
 return null;
}
export function freeLouis(louis){
 if(louis?.phase!=='hidden')return false;
 louis.phase='follow';louis.concealed=false;louis.speed=0;louis.age=0;louis.followMoving=false;louis.visualMotion=null;
 louis.exitRouteActive=true;louis.exitWaypoint=0;
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
 // Show the newly front-facing bar from the west/entrance side; Louis
 // walks around the north end before dropping behind its opaque panel.
 // The camera never travels inside the stone top or kitchen partition.
 const x=9.75,z=2.50,y=1.44;
 const dx=louis.x-x,dz=louis.z-z;
 const targetY=louis.phase==='hide'||louis.phase==='hidden'?louis.y+.82:louis.y+1.25;
 return {x,y,z,yaw:Math.atan2(dx,dz),pitch:Math.atan2(targetY-y,Math.hypot(dx,dz))};
}
// Only Photo-A is shipped in the 3D rescue. The old primitive head/body and
// louisPartPose fallback were unused in the live flow and inflated the JS
// bundle. Keep the existing actor identifiers and 21-bone rescue rig intact.
export function louisModel(piece,{quality='mobile'}={}){
 return buildLoisPs2Model(piece,{quality,photoMode:true});
}
