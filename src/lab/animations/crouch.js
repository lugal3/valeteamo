import {setJoint,axisJoint} from '../character-rig.js';
import {footTarget,WALK_CYCLE,LEG_LENGTH} from './walk.js';

export function sampleCrouch(distance,out,{walking=false,forward=1,side=0,reduced=false}={}){
 out.fill(0);
 const CROUCH_DROP=.24;
 setJoint(out,'root',0,0,0,0,-CROUCH_DROP,0);
 setJoint(out,'body',.22,0,0);
 setJoint(out,'head',-.18,0,0);

 if(!walking){
  // Postura de agachado estacionaria con rodillas dobladas
  for(const name of ['left','right']){
   setJoint(out,name+'Leg',.52,0,0);
   setJoint(out,name+'Knee',-1.04,0,0);
   setJoint(out,name+'Foot',.52,0,0);
  }
  setJoint(out,'leftArm',-.25,0,.15);
  setJoint(out,'rightArm',-.25,0,-.15);
  return out;
 }

 // Marcha agachada sigilosa
 const size=Math.hypot(forward,side)||1;
 forward/=size;side/=size;
 for(const [name,offset] of [['left',0],['right',.5]]){
  const f=footTarget(distance+offset*WALK_CYCLE);
  const height=.32-CROUCH_DROP-f.lift*.6;
  const facing=forward<-.001?-1:1;
  const travel=f.travel*facing*.75;
  const length=Math.min(LEG_LENGTH*2-.00001,Math.hypot(height,travel));
  const flex=Math.acos(length/(LEG_LENGTH*2));
  const angle=Math.atan2(travel,height);
  axisJoint(out,name+'Leg',angle+flex,forward*facing,side*facing);
  axisJoint(out,name+'Knee',-2*flex,forward*facing,side*facing);
  axisJoint(out,name+'Foot',flex-angle,forward*facing,side*facing);
 }
 const phase=distance/WALK_CYCLE*Math.PI*2;
 if(!reduced){
  setJoint(out,'body',.22+Math.sin(phase)*.015,Math.sin(phase)*.018,0);
 }
 setJoint(out,'leftArm',Math.sin(phase)*.14*forward-.2,0,Math.sin(phase)*.08*side+.1);
 setJoint(out,'rightArm',-Math.sin(phase)*.14*forward-.2,0,-Math.sin(phase)*.08*side-.1);
 return out;
}

