import {HEIGHT,STAIR,groundHeight} from './world.js';
// The opening is a choreographed walk, not a free AI patrol. The clock is
// the authoritative animation clock, so FPS/difficulty cannot add grace.
export const HIDE_DEADLINE=10;
export const BEDROOM_REFUGES=Object.freeze(['wardrobe','underbed']);
export function safeBedroomHide(hidden,transition){return !transition&&BEDROOM_REFUGES.includes(hidden?.objectId);}
export const ARRIVAL_ROUTE=Object.freeze([
 {x:5.8,z:11.2},{x:7.05,z:11.0},{x:10.1,z:10.85},{x:12,z:10.85},
 {x:12,z:STAIR.zBottom},{x:12,z:STAIR.zTop},{x:12,z:3.45,upper:true},{x:6.0,z:3.45,upper:true},{x:6.0,z:2.4,upper:true},{x:4.88,z:2.4,upper:true}
]);
const length=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
const total=ARRIVAL_ROUTE.slice(1).reduce((sum,p,i)=>sum+length(ARRIVAL_ROUTE[i],p),0);
export function arrivalPose(remaining){
 const elapsed=Math.max(0,Math.min(HIDE_DEADLINE,HIDE_DEADLINE-remaining));
 let distance=total*elapsed/HIDE_DEADLINE;
 for(let i=1;i<ARRIVAL_ROUTE.length;i++){
  const a=ARRIVAL_ROUTE[i-1],b=ARRIVAL_ROUTE[i],d=length(a,b);
  if(distance<=d||i===ARRIVAL_ROUTE.length-1){
   const t=Math.max(0,Math.min(1,distance/d)),x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
   // On the stairs use the upper ramp, not the low hiding nook beneath it.
   const y=b.upper?HEIGHT:x>=STAIR.xMin&&x<=STAIR.xMax?HEIGHT*Math.max(0,Math.min(1,(STAIR.zBottom-z)/(STAIR.zBottom-STAIR.zTop))):groundHeight(x,z,0,false);
   return {x,y,z,yaw:Math.atan2(b.x-a.x,b.z-a.z),walk:total*elapsed/HIDE_DEADLINE,speed:remaining>0?total/HIDE_DEADLINE:0,age:elapsed};
  }
  distance-=d;
 }
}
export function poseArrivingPursuer(actor,remaining){const pose=arrivalPose(remaining);Object.assign(actor,pose,{facing:pose.yaw,mode:'arrival-approach'});return pose;}
export function finishArrivingPursuer(actor){poseArrivingPursuer(actor,0);actor.mode='search';actor.route=2;actor.visited=1;actor.path=[];actor.replan=0;actor.clearSight();}
