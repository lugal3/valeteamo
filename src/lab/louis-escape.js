import {groundHeight} from './world.js';
import {navigate} from './navigation.js';
import {sampleBlink} from './animations/face.js';
import {LOIS_VISUAL_ID} from './lois-ps2-profile.js';
import {buildLoisPs2Model} from './lois-ps2-model.js';
import {startLoisReaction,advanceLoisReaction} from './lois-ps2-reactions.js';
import {KITCHEN_HIDE_APPROACH,KITCHEN_HIDE_SPOT} from './kitchen-hide-layout.js';
import {advanceLoisMotion} from './lois-motion.js';
import {UNTIE_BEATS,sampleLoisUntie} from './lois-untie.js';
import {loisWristAnchors,poseLoisRopes} from './lois-ps2-rig.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const turnTowards=(current,target,dt,speed=7)=>{
 const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 const eased=delta*Math.min(1,Math.max(0,dt)*speed);
 return current+clamp(eased,-Math.max(0,dt)*4.8,Math.max(0,dt)*4.8);
};
export const LOUIS_UNTIE_SECONDS=UNTIE_BEATS.finish;
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
 return {kind:'louis-companion',id:'louis-escape',label:'Louis rescatado',visualPreset:LOIS_VISUAL_ID,visualVariant:'photo-a',x:point.x,y,z:point.z,yaw:Math.PI,phase:'untying',waypoint:1,age:0,step:0,crouch:.55,rescuePerformance:true,untieCues:new Set(),concealed:false,interactable:false,walk:0,speed:0,blink:0,visualReaction:null,untieBeat:0,world};
}
export function updateLouisEscape(louis,dt,kitty=null,gardenGoal=null){
 if(!louis||dt<=0)return null;
 const before={x:louis.x,y:louis.y,z:louis.z},wasUntying=louis.phase==='untying';
 const cue=advanceLouisEscape(louis,dt,kitty,gardenGoal);
 advanceLoisMotion(louis,dt,before,kitty);
 if(wasUntying&&louis.phase==='untying')poseLoisRopes(louis,louis.world.boxes);
 return cue;
}
function advanceLouisEscape(louis,dt,kitty,gardenGoal){
 louis.age+=dt;
 advanceLoisReaction(louis,dt);
 louis.blink=sampleBlink(louis.age+.61,{reduced:false,firstAt:1.43});
 louis.speed=Math.max(0,louis.speed-dt*5);
 if(louis.phase==='follow')louis.crouch=Math.max(0,louis.crouch-dt*1.6);
 if(louis.phase==='untying'){
  louis.crouch=.55*sampleLoisUntie(louis.age).seated;
  // Three one-shot, rig-native emotional beats: notice Kitty's hands,
  // tense as the knot releases, then look up to recognize the rescuer.
  // Never spawn new meshes or overwrite the approved Photo-A texture.
  for(const [index,at,type] of [[1,.46,'reach'],[2,1.68,'startle'],[3,2.65,'look-kitty']]){
   if(louis.untieBeat<index&&louis.age>=at){
    louis.untieBeat=index;startLoisReaction(louis,type);
   }
  }
  if(louis.age>=LOUIS_UNTIE_SECONDS){louis.phase='climb';louis.age=0;louis.crouch=0;louis.rescuePerformance=false;startLoisReaction(louis,'look-kitty');return 'untied';}
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
  const t=clamp(louis.age/1.1,0,1);louis.crouch=t*t*(3-2*t);
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
  const goal=gardenGoal??kitty,dx=goal.x-louis.x,dz=goal.z-louis.z,d=Math.hypot(dx,dz);
  const sameFloor=Math.abs(kitty.y-louis.y)<.7;
  const stop=gardenGoal ? .10 : 1.05,resume=gardenGoal ? .23 : 1.42;
  const chatting=louis.dialogueSpeaking&&Math.hypot(kitty.x-louis.x,kitty.z-louis.z)<1.85;
  louis.followMoving=sameFloor&&!chatting&&d>(louis.followMoving?stop:resume);
  if(louis.followMoving){
   const desired=clamp((d-stop)*2.4,.34,3.25);
   const speed=Math.min(desired,(louis.followSpeed??0)+dt*4.8);
   const step=Math.min(d-stop,dt*speed);
   const moved=navigate(louis,louis.world,dx/d*step,dz/d*step,1.60);
   louis.walk+=moved;louis.speed=moved/dt;louis.followSpeed=louis.speed;
   const faceKitty=gardenGoal&&d<.62;
   const heading=faceKitty?Math.atan2(kitty.x-louis.x,kitty.z-louis.z):Math.atan2(dx,dz);
   louis.yaw=turnTowards(louis.yaw,heading,dt,7);
  }else{
   louis.followSpeed=0;
   if(gardenGoal)louis.yaw=turnTowards(louis.yaw,Math.atan2(kitty.x-louis.x,kitty.z-louis.z),dt,4);
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
export function louisRescueHands(louis,reduced=false){
 const pose=sampleLoisUntie(louis.age),[a,b]=loisWristAnchors(louis,reduced);
 if(pose.t>=UNTIE_BEATS.release+.52)return null;
 const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2};
 return [-1,1].map(side=>{
  const contact=side===-1?a:b,grip=pose.reach,tug=(reduced?0:Math.sin(pose.t*10)*.024)*pose.loosen*pose.tied;
  return {x:mid.x+side*.24*(1-grip)+(contact.x-mid.x)*grip,y:contact.y*grip+mid.y*(1-grip)-.16*(1-grip)+.018+tug,
   z:contact.z*grip+mid.z*(1-grip)-.30*(1-grip)-.04,flex:-.27*grip,curl:.76*grip,roll:side*.16*grip};
 });
}
export function louisCamera(louis){
 // The old shoulder camera crossed the narrow tunnel wall and produced a
 // pitch-black shot. Keep the lens on the physical walkable tunnel ramp.
 if(louis.phase==='untying'){
  const shot=sampleLoisUntie(louis.age),[a,b]=loisWristAnchors(louis);
  const focus=1-shot.tied,x=louis.x+.15*(1-shot.rise),z=louis.z-1.18-.23*shot.rise,y=louis.y+1.08+.34*shot.rise;
  const tx=(a.x+b.x)/2,ty=(a.y+b.y)/2*(1-focus)+(louis.y+1.36+.28*shot.rise)*focus,tz=(a.z+b.z)/2*(1-focus)+louis.z*focus;
  return {x,y,z,yaw:Math.atan2(tx-x,tz-z),pitch:Math.atan2(ty-y,Math.hypot(tx-x,tz-z))};
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
