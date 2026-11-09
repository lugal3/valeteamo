import {setJoint,axisJoint} from '../character-rig.js';
// One full cycle covers two 25 cm steps. Stance travels backward exactly as far
// as the collision-resolved player travels forward, instead of running on a timer.
export const WALK_CYCLE=.50,LEG_LENGTH=.16,HIP_DROP=.035;
export function footTarget(distance,offset=0){
 const u=((distance/WALK_CYCLE+offset)%1+1)%1;
 if(u<.5)return {travel:WALK_CYCLE*.25-u*WALK_CYCLE,phase:u,lift:0,stance:true};
 const t=(u-.5)*2,e=t*t*(3-2*t);
 return {travel:-WALK_CYCLE*.25+WALK_CYCLE*.5*e,phase:u,lift:Math.sin(t*Math.PI)*.065,stance:false};
}
export function sampleWalk(distance,out,{forward=1,side=0,reduced=false}={}){
 out.fill(0);const size=Math.hypot(forward,side)||1;forward/=size;side/=size;
 setJoint(out,'root',0,0,0,0,-HIP_DROP,0);
 for(const [name,offset] of [['left',0],['right',.5]]){
  // Use the offset cycle's travelled distance, preserving exact planted-foot speed.
  const f=footTarget(distance+offset*WALK_CYCLE),height=.32-HIP_DROP-f.lift;
  const facing=forward<-.001?-1:1,travel=f.travel*facing;
  const length=Math.min(LEG_LENGTH*2-.00001,Math.hypot(height,travel));
  const flex=Math.acos(length/(LEG_LENGTH*2)),angle=Math.atan2(travel,height);
  axisJoint(out,name+'Leg',angle+flex,forward*facing,side*facing);
  axisJoint(out,name+'Knee',-2*flex,forward*facing,side*facing);
  axisJoint(out,name+'Foot',flex-angle,forward*facing,side*facing);
 }
 const phase=distance/WALK_CYCLE*Math.PI*2;
 if(!reduced){setJoint(out,'body',0,Math.sin(phase)*.025,Math.sin(phase)*.015);setJoint(out,'head',-.012,0,-Math.sin(phase)*.009);}
 setJoint(out,'leftArm',Math.sin(phase)*.22*forward,0,Math.sin(phase)*.12*side);
 setJoint(out,'leftForearm',-.04,0,0);
 setJoint(out,'rightArm',Math.sin(phase)*.035,0,0);
 return out;
}
