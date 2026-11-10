import {setJoint} from '../character-rig.js';
import {arm,feet} from './pose-tools.js';
// One full cycle covers two 25 cm steps. Stance travels backward exactly as far
// as the collision-resolved player travels forward, instead of running on a timer.
export const WALK_CYCLE=.50,LEG_LENGTH=.16,HIP_DROP=.035;
export function footTarget(distance,offset=0){
 const u=((distance/WALK_CYCLE+offset)%1+1)%1;
 if(u<.5)return {travel:WALK_CYCLE*.25-u*WALK_CYCLE,phase:u,lift:0,stance:true};
 // Hermite swing enters/leaves stance at its actual travelling speed.
 const t=(u-.5)*2,e=-4*t*t*t+6*t*t-t;
 return {travel:-WALK_CYCLE*.25+WALK_CYCLE*.5*e,phase:u,lift:Math.sin(t*Math.PI)*.065,stance:false};
}
export function sampleWalk(distance,out,{forward=1,side=0,reduced=false,handsFree=false}={}){
 out.fill(0);const size=Math.hypot(forward,side)||1;forward/=size;side/=size;
 const phase=distance/WALK_CYCLE*Math.PI*2,targets={x:reduced?0:-Math.sin(phase)*.012,y:-HIP_DROP+(reduced?0:(1-Math.cos(phase*2))*.003)};
 for(const [name,offset] of [['left',0],['right',.5]]){
  const f=footTarget(distance+offset*WALK_CYCLE);
  targets[name]=[(name==='left'?-.16:.16)+f.travel*side,.11+f.lift,.005+f.travel*forward];
 }
 feet(out,targets);
 if(!reduced){setJoint(out,'body',.025*forward,Math.sin(phase)*.035,-side*.025+Math.sin(phase)*.018);setJoint(out,'head',-.015*forward,-Math.sin(phase)*.018,-Math.sin(phase)*.010);}
 setJoint(out,'leftArm',Math.sin(phase)*.26*forward,0,.035+Math.sin(phase)*.10*side);
 setJoint(out,'leftForearm',-.04,0,0);
 if(handsFree)arm(out,'right',[.375,.56,.06+Math.sin(phase)*.07*forward],[0,0,-.05]);
 else setJoint(out,'rightArm',Math.sin(phase)*.045,0,0);
 return out;
}
