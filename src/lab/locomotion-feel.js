// ValeTeAmo V2 / phase 02 — frame-rate-independent character locomotion.
// The real world still owns collisions, stairs and groundHeight (navigation.js).
// This module only smooths player intent/camera; never moves an actor directly.
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export const KITTY_SPEED=Object.freeze({walk:2.60,run:4.28,crouch:1.05,stairs:1.68});
export const MOTION_RESPONSE=Object.freeze({accelerate:13,reverse:19,brake:23,speed:9,eye:10,ground:13});
const EPS=.0002;
function blend(current,target,dt,response){
 const time=clamp(Number.isFinite(dt)?dt:0,0,.1);
 return current+(target-current)*(1-Math.exp(-Math.max(0,response)*time));
}
/** Smooth X/Z together, avoiding diagonal speed boosts on keyboard+stick.
 * Braking is faster than starting, reversing initially slows through zero.
 * A very small dead zone removes fractional key/joystick drifting at rest.
 */
export function advanceMoveIntent(current,forward,side,dt){
 const f=Number.isFinite(forward)?forward:0,z=Number.isFinite(side)?side:0;
 const magnitude=Math.hypot(f,z),scale=magnitude>1?1/magnitude:1;
 const target={forward:Math.abs(f)<.018?0:f*scale,side:Math.abs(z)<.018?0:z*scale};
 const cur={forward:Number(current?.forward)||0,side:Number(current?.side)||0};
 const dot=cur.forward*target.forward+cur.side*target.side;
 const response=Math.hypot(target.forward,target.side)<.025
  ?MOTION_RESPONSE.brake:dot<-.035?MOTION_RESPONSE.reverse:MOTION_RESPONSE.accelerate;
 let next={forward:blend(cur.forward,target.forward,dt,response),
  side:blend(cur.side,target.side,dt,response)};
 if(Math.hypot(target.forward,target.side)<.025&&Math.hypot(next.forward,next.side)<.007){
  return {forward:0,side:0};
 }
 const len=Math.hypot(next.forward,next.side);
 if(len>1){next.forward/=len;next.side/=len;}
 if(Math.abs(next.forward)<EPS)next.forward=0;
 if(Math.abs(next.side)<EPS)next.side=0;
 return next;
}
/** Smooth changes into/out of sprint and crouch rather than changing
 * stride duration and camera velocity in the same frame.
 */
export function advanceMoveSpeed(current,target,dt){
 const previous=Number.isFinite(current)?current:KITTY_SPEED.walk;
 const next=blend(previous,clamp(target,.5,KITTY_SPEED.run),dt,MOTION_RESPONSE.speed);
 return Math.abs(next-target)<.008?target:next;
}
/** Camera-only stair smoothing: the collider remains grounded immediately.
 * Snap on teleport/respawn and prevent render y becoming NaN.
 */
export function advanceCameraFloor(current,actual,dt){
 if(!Number.isFinite(actual))return Number.isFinite(current)?current:0;
 if(!Number.isFinite(current)||Math.abs(actual-current)>.72)return actual;
 const next=blend(current,actual,dt,MOTION_RESPONSE.ground);
 return Math.abs(next-actual)<.001?actual:next;
}
export function advanceEye(current,crouched,dt){
 const target=crouched?1.03:1.63;
 return blend(Number.isFinite(current)?current:target,target,dt,MOTION_RESPONSE.eye);
}
export function isOnStairs(state,getStairDirection,inHatch){
 // Slow slightly BEFORE feet reach the lip, not after the first ramp tick.
 // Geometry stays authoritative: these probes affect only speed, not collision.
 const edge=.12;
 return !!getStairDirection(state)||
  !!getStairDirection({...state,z:state.z-edge})||
  !!getStairDirection({...state,z:state.z+edge})||
  (state.y<-.025&&inHatch(state.x,state.z));
}
