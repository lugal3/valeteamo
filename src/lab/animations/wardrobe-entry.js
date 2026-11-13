import {arm,ease,blendPose} from './pose-tools.js';
import {sampleCrouch} from './crouch.js';
import {sampleIdle} from './idle.js';
import {sampleWalk} from './walk.js';

export const STAND_SECONDS=.66;

export function wardrobeWalk(elapsed,{from,to,ground,stand,walk}){
 const progress=ease((elapsed-stand)/walk);
 const distance=Math.hypot(to.x-from.x,to.z-from.z);
 return {
  x:from.x+(to.x-from.x)*progress,y:ground+1.63,z:from.z+(to.z-from.z)*progress,
  yaw:Math.atan2(to.x-from.x,to.z-from.z),pitch:0,
  distance:distance*progress,standing:stand?ease(elapsed/stand):1,
  stride:ease(progress/.19)*ease((1-progress)/.22)
 };
}

export function sampleWardrobeWalk(action,out,scratch){
 sampleIdle(0,out,{handsFree:true});
 if(action.standing<1){
  sampleCrouch(0,scratch);
  return blendPose(scratch,out,action.standing,out);
 }
 if(action.stride){
  sampleWalk(action.distance,scratch,{handsFree:true});
  blendPose(out,scratch,action.stride,out);
 }
 if(action.reach)arm(out,'right',[.35,.68+action.reach*.10,.08+action.reach*.23],[0,.20,0],action.reach);
 return out;
}
