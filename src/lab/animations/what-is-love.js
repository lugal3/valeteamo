import {JOINTS,JOINT_INDEX,setJoint} from '../character-rig.js';
import {curve,ease,feet,limb} from './pose-tools.js';
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

// Ground positions in clip space. A shoe holds its position between swings.
// Each step specifies lift-off, landing, landing x/z and maximum lift.
const steps=[
 [[-.24,.085],[
  [.38,.75,.10,.075,.105],
  [.81,1.06,-.24,.015,.085],
  [1.80,2.21,.12,.125,.115],
  [2.32,2.95,.105,.135,.04],
  [4.04,4.34,.115,.14,.05],
  [5.04,5.38,.005,.04,.055],
  [7.86,8.24,.075,.13,.16],
  [9.60,10,.045,.16,.15]
 ]],
 [[-.39,-.04],[
  [.04,.40,.225,-.04,.145],
  [1.98,2.24,.207,-.10,.055],
  [4.96,5.27,.26,-.015,.045],
  [8.12,8.48,.18,-.105,.075],
  [9.45,9.69,.24,-.085,.054]
 ]]
];

// Timings are relative to 00:48. Each cue has a blend weight and two hand targets.
const armCues=[
 [.85,0,[-.36,.75,.18],[.36,.75,.18]],
 [1.12,.96,[-.69,1.08,.27],[.57,1.21,.20]],
 [1.46,.90,[-.39,1.10,.34],[.57,1.16,.22]],
 [1.72,.96,[-.69,1.10,.27],[.54,1.16,.21]],
 [1.86,.62,[-.51,1.13,.23],[.44,1.08,.31]],
 [2.08,0,[-.40,.92,.20],[.40,1.02,.24]],
 // The near hand leads the wave before the arms alternate their heights.
 [2.93,.40,[-.44,.77,.12],[.44,.72,.13]],
 [3.17,.93,[-.34,1.04,.25],[.40,.74,.20]],
 [3.36,.94,[-.33,.99,.38],[.40,.74,.26]],
 [3.55,.93,[-.34,.97,.41],[.37,.68,.29]],
 [3.81,.93,[-.38,.70,.32],[.36,.99,.37]],
 [4.08,.96,[-.34,.99,.43],[.37,.72,.35]],
 [4.31,.94,[-.34,.84,.38],[.37,1.09,.41]],
 [4.68,.96,[-.34,1.26,.44],[.38,1.23,.40]],
 [4.94,.90,[-.35,1.20,.39],[.42,1.30,.32]],
 // Feet close as one hand settles near the temple.
 [5.18,.90,[-.13,.81,.27],[.48,1.28,.23]],
 [5.42,.91,[-.39,.75,.22],[.49,1.20,.23]],
 [5.65,.83,[-.52,.83,.20],[.53,.96,.19]],
 [5.92,.91,[-.57,.79,.20],[.57,.83,.19]],
 [6.15,.93,[-.54,.76,.24],[.55,.78,.23]],
 [6.40,.84,[-.56,.86,.18],[.52,.74,.20]],
 [6.67,.88,[-.55,.76,.21],[.57,.81,.19]],
 [6.94,.90,[-.54,.86,.21],[.56,.77,.21]],
 [7.23,.80,[-.49,.92,.23],[.54,.94,.23]],
 [7.54,.83,[-.57,1.16,.22],[.51,1.10,.23]],
 [7.79,.90,[-.54,1.27,.19],[.55,1.23,.19]],
 [8.04,.89,[-.51,1.27,.27],[.50,.83,.21]],
 [8.30,.88,[-.51,1.24,.26],[.40,.73,.21]],
 [8.58,.76,[-.49,1.06,.24],[.41,.74,.20]],
 [8.76,0,[-.41,.82,.19],[.43,.78,.19]]
];
// Angles of the pink pads during the wave, the alternating corners, and the outward push.
const palmCues=[
 [2.96,0,[0,0,0],[0,0,0]],
 [3.18,.94,[-.92,.28,.26],[-.20,-.12,-.30]],
 [3.34,.94,[.68,.46,.39],[-.30,-.38,-.27]],
 [3.55,.96,[1.12,.20,.18],[-.88,-.33,-.40]],
 [3.81,.96,[-.82,.38,.39],[.90,-.19,-.24]],
 [4.08,.96,[1.03,.24,.15],[-.84,-.40,-.34]],
 [4.31,.94,[-.38,.31,.27],[.85,-.23,-.22]],
 [4.68,.87,[-.57,.26,.12],[-.40,-.24,-.15]],
 [5.04,0,[0,0,0],[0,0,0]],
 [5.68,0,[0,0,0],[0,0,0]],
 [5.98,.92,[-.25,-.49,.44],[-.21,.49,-.42]],
 [6.30,.87,[-.05,-.63,.49],[-.26,.63,-.47]],
 [6.60,.92,[-.29,-.52,.41],[-.20,.53,-.43]],
 [6.92,.91,[-.11,-.58,.45],[-.13,.57,-.45]],
 [7.33,0,[0,0,0],[0,0,0]]
];
// The raised paw traces two lobes, a central notch, and the bottom point.
const heartStrokes=[
 [8.05,8.21,[-.55,.96,.30],[-.72,1.09,.29],[-.73,1.32,.30],[-.61,1.273,.30]],
 [8.21,8.32,[-.61,1.273,.30],[-.56,1.26,.30],[-.56,1.177,.31],[-.548,1.145,.31]],
 [8.32,8.46,[-.548,1.145,.31],[-.505,1.32,.32],[-.395,1.31,.32],[-.427,1.185,.33]],
 [8.46,8.61,[-.427,1.185,.33],[-.438,1.11,.33],[-.505,1.005,.32],[-.55,.96,.30]]
];
const weightShifts=[[5.55,0],[6.02,.024],[6.35,-.024],[6.72,.028],[7.09,-.031],[7.48,0]];
const bounceDips=[[5.57,0],[6.08,-.069],[6.27,-.013],[6.48,-.045],[6.71,-.015],[6.96,-.040],[7.33,0],
 [8.48,0],[8.92,-.056],[9.15,0],[9.47,-.043],[9.68,-.027],[9.86,-.058],[10,-.035]];
const sweepTurn=[[3.15,0],[3.8,.25],[4.8,.25],[5.32,0]];
const openingLean=[[.9,0],[1.15,.085],[1.48,-.04],[1.73,.078],[2,0]];
const pulse=(time,start,arrive,leave,end)=>ease((time-start)/(arrive-start))*ease((end-time)/(end-leave));

function sampleFoot([start,swings],time){
 let [x,z]=start;
 for(const [from,to,nextX,nextZ,lift] of swings){
  if(time<from)break;
  if(time<to){
   const phase=(time-from)/(to-from),travel=ease(phase);
   return [mix(x,nextX,travel),.11+lift*Math.sin(Math.PI*phase)**2,mix(z,nextZ,travel)];
  }
  x=nextX;
  z=nextZ;
 }
 return [x,.11,z];
}

function sampleCue(cues,time){
 const next=cues.findIndex(([at])=>at>time);
 if(next<1)return [0];
 const [from,weight,left,right]=cues[next-1], [to,nextWeight,nextLeft,nextRight]=cues[next];
 const t=ease((time-from)/(to-from));
 return [mix(weight,nextWeight,t),blend(left,nextLeft,t),blend(right,nextRight,t)];
}

function sampleHeart(time){
 const stroke=heartStrokes.find(([,end])=>time<end)??heartStrokes.at(-1);
 const [start,end,point,tangentOut,tangentIn,nextPoint]=stroke;
 const t=Math.max(0,Math.min(1,(time-start)/(end-start))),u=1-t;
 return point.map((value,i)=>u**3*value+3*u*u*t*tangentOut[i]+3*u*t*t*tangentIn[i]+t**3*nextPoint[i]);
}

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

function headLocalTarget(point,[pitch,yaw,roll]){
 return add(pivot('head'),rotateZ(rotateY(rotateX(point,pitch),yaw),roll));
}

function readSide(values,side){
 const [ux,uy,uz,fx,fy,fz,px,py,pz,tx,ty,tz,sx,sy,sz,shoePitch,shoeYaw]=values;
 const thigh=unit([tx,ty,tz]),shin=unit([sx,sy,sz]);
 const foot=add(pivot(side.leg),scale(add(thigh,shin),.16));
 return {upper:[ux,uy,uz],forearm:[fx,fy,fz],palm:[px,py,pz],thigh,foot,shoePitch,shoeYaw};
}

function poseArm(out,side,motion,{fold,cueWeight,cue,palmWeight,palmCue,gesture}){
 const {upper,forearm,palm}=motion;
 const reach=add(scale(upper,side.upperLength),scale(forearm,side.lowerLength));
 let hand=blend(add(pivot(side.upper),reach),[-side.sign*.085,.79-side.sign*.033,.225],fold);
 if(cueWeight)hand=blend(hand,cue,cueWeight);
 const raised=mix(ease((forearm[1]+.16)/1.1),ease((hand[1]-.91)/.32),cueWeight);
 const crossing=ease((.21-side.sign*hand[0])/.20);
 const reachingForward=ease((hand[2]-.24)/.16)*cueWeight;
 let shift=[-side.sign*.074*crossing,.094*raised,.035*crossing+.068*reachingForward];
 hand=add(hand,scale(shift,1-cueWeight));
 // Place the high gestures around Kitty's wide cheeks.
 hand[0]+=side.sign*Math.max(0,.53-side.sign*hand[0])*raised*(1-reachingForward);
 hand[1]+=.13*raised*(1-cueWeight);
 hand[2]=mix(hand[2],Math.max(.23,hand[2]),raised);
 let palmPose=[-.72*palm[2]-.36*Math.max(0,palm[1]),side.sign*.12,Math.asin(palm[0]*.85)];
 if(palmWeight)palmPose=blend(palmPose,palmCue,palmWeight);
 let elbow=blend(upper,[side.sign*.85,-.35,.22],cueWeight*raised);
 if(gesture){
  hand=blend(hand,gesture.target,gesture.weight);
  palmPose=blend(palmPose,gesture.palm,gesture.weight);
  if(gesture.shift)shift=blend(shift,gesture.shift,gesture.weight);
  if(gesture.elbow)elbow=blend(elbow,gesture.elbow,gesture.weight);
 }
 limb(out,side.upper,side.forearm,side.hand,hand,elbow,palmPose,shift);
 out.set(shift,JOINT_INDEX[side.upper]*6+3);
}

export function sampleWhatIsLove(out,time,reduced){
 const frame=Math.max(0,Math.min(DANCE_FRAMES.length-1,time*DANCE_RATE));
 const index=Math.floor(frame),a=DANCE_FRAMES[index],b=DANCE_FRAMES[Math.min(index+1,DANCE_FRAMES.length-1)];
 const [travel,trackedYaw,pitch,twist,roll,headPitch,headYaw,headRoll,...channels]=a.map((value,i)=>mix(value,b[i],frame-index));
 const motion=sides.map((side,i)=>readSide(channels.slice(i*17,(i+1)*17),side));
 const x=travel+curve(weightShifts,time);
 const heelFlick=reduced?0:pulse(time,2.37,2.55,2.64,2.81);
 const touch=reduced?0:pulse(time,2.40,2.57,2.66,2.81);
 const mouth=pulse(time,1.26,1.43,1.51,1.69);
 const temple=pulse(time,5.17,5.37,5.49,5.69);
 const heart=pulse(time,7.95,8.05,8.61,8.77);
 const yaw=mix(trackedYaw,.78,heart);
 const fold=.78*ease((1.03-time)/.23);
 const openChest=curve(sweepTurn,time);
 const body=reduced?[0,0,0]:[
  mix(mix(pitch,-.28,touch),-.07,heart),
  mix(twist-openChest,-.28,heart),
  mix(mix(roll+curve(openingLean,time),.33,touch),-.075,heart)
 ];
 const head=reduced?[0,0,headRoll*.28]:[
  mix(headPitch+.10*temple,-.14,heart),
  headYaw+openChest,
  mix(mix(headRoll,-.17,touch),-.26,heart)
 ];
 const [cueWeight,...wrists]=sampleCue(armCues,time);
 const [palmWeight,...palms]=sampleCue(palmCues,time);
 let contactPoint;

 if(reduced)feet(out,{y:-.025});
 else{
  const footTargets=steps.map(track=>{
   const [stageX,y,stageZ]=sampleFoot(track,time);
   return rotateY([stageX-x,y,stageZ],-yaw);
  });
  const pelvisLimit=Math.min(...footTargets.map(([footX,footY,footZ],i)=>{
   const [hipX,hipY,hipZ]=pivot(sides[i].leg);
   const reach=Math.sqrt(Math.max(0,.319**2-(footX-hipX)**2-(footZ-hipZ)**2));
   return footY-hipY+reach;
  }));
  const lowest=Math.min(...motion.map(leg=>leg.foot[1]));
  const rootY=Math.min(.11-lowest,pelvisLimit)+curve(bounceDips,time);
  setJoint(out,'root',0,yaw,0,x,rootY,0);
  for(const [i,side] of sides.entries()){
   const {thigh,shoePitch,shoeYaw}=motion[i];
   const foot=footTargets[i];
   const lift=ease((foot[1]-.122)/.09);
   const raised=i===0?heelFlick:0;
   const shoe=blend([foot[0],foot[1]-rootY,foot[2]],[-.30,.449,-.265],raised);
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
 setJoint(out,'head',...head);
 let leftGesture;
 if(mouth)leftGesture={
  weight:mouth,target:headLocalTarget([-.047,.153,.365],head),
  palm:[-.22,.29,.79],shift:[.105,.114,.108],elbow:[-.84,-.54,.18]
 };
 if(touch)leftGesture={weight:touch,target:bodyLocal(contactPoint,body),palm:[.62,-.12,-.26]};
 if(heart)leftGesture={
  weight:heart,target:sampleHeart(time),palm:[-.29,.35,-.31],
  shift:[-.03,.115,.094],elbow:[-.9,-.35,.25]
 };
 const rightGesture=temple?{
  weight:temple,target:headLocalTarget([.51,.25,.19],head),
  palm:[.12,-.95,-.63],shift:[-.024,.126,.071],elbow:[.92,-.32,.14]
 }:null;
 const gestures=[leftGesture,rightGesture];
 for(const [i,side] of sides.entries()){
  poseArm(out,side,motion[i],{fold,cueWeight,cue:wrists[i],palmWeight,palmCue:palms[i],gesture:gestures[i]});
 }
}
