import type {IsoPoint} from '../isometric';
import type {RescueMapId} from './rescue-overworld';

// All calculations are *pure* and specific to the rescue story. The original
// Corazones 2D arcade continues to use its unchanged movement and animation.
export const RESCUE_FEEL={
 speed:2.1,                   // existing max speed in ISO tiles / second
 accelerationSeconds:.09,    // responsive acceleration on keyboard / touch
 decelerationSeconds:.115,   // enough weight but no slippery sliding
 cameraFollowSeconds:.25,
 cameraMaxX:22, cameraMaxY:11,
 footstepDistance:.56,
 interactMs:360,
 companionDeadZone:7,
 companionMaxPixelsPerSecond:160
} as const;
type Vector={x:number;y:number};
export type FeelSurface='grass'|'wood'|'stone'|'dirt'|'asphalt';
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const length=(p:IsoPoint)=>Math.hypot(p.u,p.v);
const normalized=(v:IsoPoint):IsoPoint=>{
 const size=length(v);
 return size>1e-6?{u:v.u/size,v:v.v/size}:{u:0,v:0};
};
export function feelMotion(previous:IsoPoint,intent:IsoPoint,power:number,dtMs:number):IsoPoint{
 const amount=clamp(power,0,1),direction=normalized(intent);
 const target={u:direction.u*RESCUE_FEEL.speed*amount,
  v:direction.v*RESCUE_FEEL.speed*amount};
 const moving=amount>.025;
 const dt=clamp(dtMs,0,65)/1000;
 const tau=moving?RESCUE_FEEL.accelerationSeconds:RESCUE_FEEL.decelerationSeconds;
 const a=1-Math.exp(-dt/tau);
 const result={u:mix(previous.u,target.u,a),v:mix(previous.v,target.v,a)};
 const speed=length(result);
 if(!moving&&speed<.025)return {u:0,v:0};
 if(speed>RESCUE_FEEL.speed){
  return {u:result.u*RESCUE_FEEL.speed/speed,
   v:result.v*RESCUE_FEEL.speed/speed};
 }
 return result;
}
export function feelGait(velocity:IsoPoint,walkingClock:number,clock:number,reducedMotion=false){
 const speed=clamp(length(velocity)/RESCUE_FEEL.speed,0,1);
 const walking=speed>.13;
 const frame=walking?1+Math.floor(walkingClock/(175-49*speed))%4:
  (Math.floor(clock/3910)%2===0?clock%3910>3720:clock%3910>3590)?5:0;
 const footLift=reducedMotion?0:walking?Math.abs(Math.sin(walkingClock/(175-49*speed)*Math.PI))*(.75+speed*1.25):
  Math.sin(clock/640)*.55;
 // Head / upper-body settle and tiny breathing, never warp sprites.
 const lean=reducedMotion?0:walking?
  Math.sin(walkingClock/(175-49*speed)*Math.PI)*1.5*speed:
  Math.sin(clock/1400)*.65;
 const squash=reducedMotion?0:walking?
  .017*Math.sin(walkingClock/(175-49*speed)*Math.PI):Math.sin(clock/880)*.008;
 return {frame,walking,speed,footLift,lean,squash};
}
export function feelCameraOffset(
 previous:Vector,velocity:IsoPoint,dtMs:number,reducedMotion=false
):Vector{
 if(reducedMotion)return {x:0,y:0};
 // ISO projection is (u-v)*41 x (u+v)*20. Only a small lookahead is allowed.
 const target={
  x:clamp((velocity.u-velocity.v)*9,-RESCUE_FEEL.cameraMaxX,RESCUE_FEEL.cameraMaxX),
  y:clamp((velocity.u+velocity.v)*3.2,-RESCUE_FEEL.cameraMaxY,RESCUE_FEEL.cameraMaxY)
 };
 const a=1-Math.exp(-clamp(dtMs,0,65)/1000/RESCUE_FEEL.cameraFollowSeconds);
 return {x:mix(previous.x,target.x,a),y:mix(previous.y,target.y,a)};
}
export function feelFacingToTarget(
 dx:number,dy:number,previous:'up'|'down'|'left'|'right'
):'up'|'down'|'left'|'right'{
 if(Math.hypot(dx,dy)<1)return previous;
 return Math.abs(dx)>Math.abs(dy)?dx>=0?'right':'left':dy>=0?'down':'up';
}
export function feelInteraction(remainingMs:number,dtMs:number){
 return Math.max(0,remainingMs-Math.max(0,dtMs));
}
export function feelSurfaceAt(map:RescueMapId,p:IsoPoint):FeelSurface{
 if(map==='morning_garden'){
  if(p.u>=9.9&&p.u<=16.15)return 'wood';
  return Math.abs(p.v-(4.5+Math.sin(p.u*.31)*.56))<.75?'dirt':'grass';
 }
 if(map==='afternoon_meeting')return 'grass';
 if(map==='dusk_search')return Math.abs(p.v-(4.6+Math.sin((p.u-46)*.5)*.82))<.95?'dirt':'grass';
 return p.v<5.95?'asphalt':p.v<7.1?'stone':p.u>=74?'stone':'grass';
}
export const FEEL_FOOTSTEP:Record<FeelSurface,{pitch:number;color:number;volume:number}>={
 grass:{pitch:190,color:0xb5c39c,volume:.0045},
 wood:{pitch:265,color:0xcfae8d,volume:.008},
 stone:{pitch:325,color:0xe3d4c7,volume:.007},
 dirt:{pitch:215,color:0xc8b6a3,volume:.005},
 asphalt:{pitch:170,color:0xa7a6b6,volume:.005}
};
export function feelCompanion(
 current:Vector,desired:Vector,dtMs:number,reducedMotion=false
):{position:Vector;walking:boolean;direction:'right'|'left'|'up'|'down'}{
 const dx=desired.x-current.x,dy=desired.y-current.y,distance=Math.hypot(dx,dy);
 if(distance<=RESCUE_FEEL.companionDeadZone)
  return {position:{...current},walking:false,direction:'down'};
 const gap=distance-RESCUE_FEEL.companionDeadZone;
 const response=1-Math.exp(-Math.max(0,dtMs)/180);
 const amount=Math.min(gap*response,RESCUE_FEEL.companionMaxPixelsPerSecond*
  Math.max(0,dtMs)/1000);
 const fraction=amount/Math.max(distance,1);
 const result={x:current.x+dx*fraction,y:current.y+dy*fraction};
 return {position:result,
  walking:!reducedMotion&&amount>.20,
  direction:Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up'};
}
