import {JOINTS,JOINT_INDEX,setJoint} from '../character-rig.js';
import {ease,feet,limb} from './pose-tools.js';
import {DANCE_FRAMES,DANCE_RATE} from './what-is-love-frames.js';

const mix=(a,b,t)=>a+(b-a)*t;
const add=(a,b)=>a.map((value,i)=>value+b[i]);
const scale=(v,amount)=>v.map(value=>value*amount);
const blend=(a,b,weight)=>a.map((value,i)=>mix(value,b[i],weight));
const unit=v=>scale(v,1/(Math.hypot(...v)||1));
const pivot=name=>JOINTS[JOINT_INDEX[name]].pivot;
const lengthBetween=(a,b)=>Math.hypot(...pivot(a).map((value,i)=>value-pivot(b)[i]));
const sides=['left','right'].map((name,i)=>{
 const upper=name+'Arm',forearm=name+'Forearm',hand=name+'Hand';
 return {
  sign:i*2-1,upper,forearm,hand,leg:name+'Leg',knee:name+'Knee',shoe:name+'Foot',
  upperLength:lengthBetween(upper,forearm),lowerLength:lengthBetween(forearm,hand)
 };
});

function rotateX([x,y,z],angle){
 const c=Math.cos(angle),s=Math.sin(angle);
 return [x,c*y-s*z,s*y+c*z];
}
function rotateY([x,y,z],angle){
 const c=Math.cos(angle),s=Math.sin(angle);
 return [c*x+s*z,y,c*z-s*x];
}
function rotateZ([x,y,z],angle){
 const c=Math.cos(angle),s=Math.sin(angle);
 return [c*x-s*y,s*x+c*y,z];
}

function bodyLocal(point,[pitch,yaw,roll]){
 const center=pivot('body');
 const offset=point.map((value,i)=>value-center[i]);
 return add(center,rotateX(rotateY(rotateZ(offset,-roll),-yaw),-pitch));
}

function readSide(values,side){
 const [ux,uy,uz,fx,fy,fz,px,py,pz,tx,ty,tz,sx,sy,sz,shoePitch,shoeYaw]=values;
 const thigh=unit([tx,ty,tz]),shin=unit([sx,sy,sz]);
 const foot=add(pivot(side.leg),scale(add(thigh,shin),.16));
 return {upper:[ux,uy,uz],forearm:[fx,fy,fz],palm:[px,py,pz],thigh,foot,shoePitch,shoeYaw};
}

function poseArm(out,side,motion,contact,body,fold){
 const {upper,forearm,palm}=motion;
 const reach=add(scale(upper,side.upperLength),scale(forearm,side.lowerLength));
 let hand=blend(add(pivot(side.upper),reach),[-side.sign*.085,.79-side.sign*.033,.225],fold);
 const raised=ease((forearm[1]+.16)/1.1);
 const crossing=ease((.21-side.sign*hand[0])/.20);
 const shift=[-side.sign*.074*crossing,.075*raised,.035*crossing];
 hand=add(hand,shift);
 // Place the high gestures around Kitty's wide cheeks.
 hand[0]+=side.sign*Math.max(0,.53-side.sign*hand[0])*raised;
 hand[1]+=.13*raised;
 hand[2]=mix(hand[2],Math.max(.23,hand[2]),raised);
 let palmPose=[-.72*palm[2]-.36*Math.max(0,palm[1]),side.sign*.12,Math.asin(palm[0]*.85)];
 if(contact.weight){
  const target=bodyLocal(contact.point,body);
  hand=blend(hand,target,contact.weight);
  palmPose=blend(palmPose,[.62,-.12,-.26],contact.weight);
 }
 limb(out,side.upper,side.forearm,side.hand,hand,upper,palmPose,shift);
 out.set(shift,JOINT_INDEX[side.upper]*6+3);
}

export function sampleWhatIsLove(out,time,reduced){
 const frame=Math.max(0,Math.min(DANCE_FRAMES.length-1,time*DANCE_RATE));
 const index=Math.floor(frame),a=DANCE_FRAMES[index],b=DANCE_FRAMES[Math.min(index+1,DANCE_FRAMES.length-1)];
 const [x,yaw,pitch,twist,roll,headPitch,headYaw,headRoll,...channels]=a.map((value,i)=>mix(value,b[i],frame-index));
 const motion=sides.map((side,i)=>readSide(channels.slice(i*17,(i+1)*17),side));
 const heelFlick=reduced?0:ease((time-2.37)/.18)*ease((2.81-time)/.17);
 const touch=reduced?0:ease((time-2.40)/.17)*ease((2.81-time)/.15);
 const fold=.78*ease((1.03-time)/.23);
 const body=reduced?[0,0,0]:[mix(pitch,-.28,touch),twist,mix(roll,.33,touch)];
 let contactPoint;

 if(reduced)feet(out,{y:-.025});
 else{
  const lowest=Math.min(...motion.map(leg=>leg.foot[1]));
  const rootY=.11-lowest;
  setJoint(out,'root',0,yaw,0,x,rootY,0);
  for(const [i,side] of sides.entries()){
   const {foot,thigh,shoePitch,shoeYaw}=motion[i];
   const lift=ease((foot[1]-lowest-.012)/.09);
   const raised=i===0?heelFlick:0;
   const shoe=blend(foot,[-.28,.449,-.25],raised);
   const angle=mix(shoePitch*lift,.95,raised);
   const shoeTurn=mix(shoeYaw,0,raised);
   const height=.020+.06*Math.sin(angle)+Math.hypot(.09*Math.cos(angle),.165*Math.sin(angle));
   shoe[1]=Math.max(shoe[1],height-rootY);
   const kneeDirection=blend(thigh,[-.45,-.45,.85],raised);
   limb(out,side.leg,side.knee,side.shoe,shoe,kneeDirection,[angle,shoeTurn,0]);
   if(raised){
    contactPoint=add(shoe,rotateY(rotateX([-.075,.074,-.046],angle),shoeTurn));
   }
  }
 }

 setJoint(out,'body',...body);
 setJoint(out,'head',reduced?0:headPitch,reduced?0:headYaw,mix(headRoll,-.17,touch)*(reduced?.28:1));
 for(const [i,side] of sides.entries()){
  const contact=i===0?{weight:touch,point:contactPoint}:{weight:0};
  poseArm(out,side,motion[i],contact,body,fold);
 }
}
