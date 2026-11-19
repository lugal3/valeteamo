import {segmentHitsBox} from './world.js';

export function captureTiming(attempt=0){
 const hold=[0,.12,-.08][attempt%3],firstSide=attempt%2===0?-1:1;
 const bite=3.12+hold;
 return {firstSide,breath:.50,tear:.93+hold,reveal:1.58+hold,grab:2.04+hold,lock:2.27+hold,
  bite,swallow:bite+.11,end:bite+.54,pulses:[.23,1.25+hold,bite-.50]};
}

const defaultTiming=captureTiming();

const mix=(a,b,t)=>a+(b-a)*t;
export const shotEase=(start,end,time)=>{
 const t=Math.max(0,Math.min(1,(time-start)/(end-start)));
 return t*t*(3-2*t);
};

export function capturePath(boxes,from){
 // The player's eye can start close to a wall, or inside the wardrobe.
 // Keep a near-plane margin wherever the starting position allows it.
 const colliders=boxes.filter(box=>box.solid&&!box.id.startsWith('step-')&&
  Math.hypot(box.x-from.x,box.z-from.z)<1.6+Math.hypot(box.w,box.d)*.5)
  .filter(box=>!segmentHitsBox(from,from,box))
  .map(box=>({box,padding:segmentHitsBox(from,from,box,.04)?0:.04}));
 const blocked=point=>colliders.some(({box,padding})=>segmentHitsBox(from,point,box,padding));
 return target=>{
  if(!blocked(target))return target;
  const pointAt=t=>({x:mix(from.x,target.x,t),y:mix(from.y,target.y,t),z:mix(from.z,target.z,t)});
  let low=0,high=1;
  for(let i=0;i<9;i++){
   const middle=(low+high)*.5;
   if(blocked(pointAt(middle)))high=middle;else low=middle;
  }
  return pointAt(low);
 };
}

function kick(time,contact){
 const after=Math.max(0,time-contact);
 return Math.sin(after*36)*Math.exp(-after*17);
}

export function captureBasis({yaw,pitch,roll=0}){
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const flat=[cy,0,-sy],vertical=[-sy*sp,cp,-cy*sp],forward=[sy*cp,sp,cy*cp];
 if(!roll)return {right:flat,up:vertical,forward};
 const c=Math.cos(roll),s=Math.sin(roll);
 return {right:flat.map((n,i)=>n*c+vertical[i]*s),up:vertical.map((n,i)=>n*c-flat[i]*s),forward};
}

export function captureFrame(from,actor,time,reduced,timing=defaultTiming,constrain=null){
 const e=(start,end)=>shotEase(start,end,time);
 const {firstSide,tear,reveal,grab,lock,bite}=timing;
 const dx=from.x-actor.x,dz=from.z-actor.z,distance=Math.hypot(dx,dz);
 const facing=distance>.05?Math.atan2(dx,dz):actor.facing;
 const reach=e(0,.26),lift=e(.07,.69),approach=e(.48,tear+.15);
 const heldBreath=e(.53,tear-.22)*(1-e(tear+.22,reveal));
 const snap=e(reveal-.13,reveal+.07)*(1-e(reveal+.13,reveal+.34));
 const recoil=e(reveal-.28,reveal+.07)*(1-e(reveal+.15,grab));
 const seize=e(.02,.17)*(1-e(.20,.44));
 const firstGrip=e(grab-.041,grab+.145),secondGrip=e(lock-.042,lock+.146);
 const gripLeft=firstSide<0?firstGrip:secondGrip,gripRight=firstSide<0?secondGrip:firstGrip;
 const snare=(gripLeft+gripRight)*.5,tug=e(lock,lock+.19),drag=e(lock+.09,bite-.23),swallow=e(bite-.42,bite+.05);
 const left=e(tear-.012,tear+.16)*.28+e(tear+.20,reveal+.16)*.62+e(reveal+.17,reveal+.39)*.10;
 const upper=e(tear+.12,tear+.34)*.17+e(reveal-.15,reveal+.20)*.83;
 const right=e(tear+.25,reveal+.04)*.09+e(reveal+.08,reveal+.32)*.15+e(lock+.14,bite-.31)*.35;
 const clamp=e(bite-.073,bite+.014);
 const jaw=(e(tear+.24,reveal-.14)*.15+e(reveal-.082,reveal+.16)*.54
  -.075*(e(reveal+.22,reveal+.35)-e(lock+.08,bite-.36))+.31*e(lock-.01,bite-.28))*(1-.95*clamp);
 const pulse=(e(tear-.18,tear)-e(tear+.12,tear+.30))*.37+e(reveal-.18,reveal+.03)*.23;
 const twitch=reduced?0:Math.sin(time*46+Math.sin(time*6))*(pulse+.50*snap+.38*snare*(1-drag));
 const focus=e(tear+.11,tear+.21),glance=1-focus;
 const impact=(e(lock-.025,lock+.09)-e(lock+.13,lock+.26))+(e(bite-.41,bite-.29)-e(bite-.20,bite-.085))*.55;
 const resistance=gripLeft-gripRight;
 const radius=mix(Math.max(.40,distance),.646,approach)-.036*seize+recoil*.062+heldBreath*.027
  -tug*.032-drag*.093-swallow*.185;
 const turn=e(0,.44);
 const targetYaw=facing+Math.PI,turnDelta=Math.atan2(Math.sin(targetYaw-from.yaw),Math.cos(targetYaw-from.yaw));
 const orbit=reduced?0:(-.036*seize*firstSide+Math.sin(Math.PI*approach)*.039-.046*recoil+.078*resistance-.028*snare)*(1-swallow);
 const target={
  x:mix(from.x,actor.x+Math.sin(facing)*radius+Math.cos(facing)*orbit,reach),
  z:mix(from.z,actor.z+Math.cos(facing)*radius-Math.sin(facing)*orbit,reach),
  y:mix(from.y,actor.y+1.724,lift)+Math.sin(Math.PI*lift)*(reduced?.048:.21)-.047*seize-(snare-drag)*.054-drag*.065-swallow*.089
 };
 const {x,y,z}=constrain?constrain(target):target;
 const shake=reduced?0:firstSide*(-.026*kick(time,grab)+.049*kick(time,lock))+.041*kick(time,bite-.29);
 const focusY=actor.y+1.717-.145*jaw-.051*swallow;
 const pitch=Math.atan2(focusY-y,Math.hypot(actor.x-x,actor.z-z));
 const yaw=turn<1?from.yaw+turnDelta*turn:Math.atan2(actor.x-x,actor.z-z);
 const gaze={
  x:(x-actor.x)*Math.cos(facing)-(z-actor.z)*Math.sin(facing)+firstSide*.051*glance,
  y:y-actor.y-.039*glance,
  z:(x-actor.x)*Math.sin(facing)+(z-actor.z)*Math.cos(facing)
 };
 return {
  camera:{x,y,z,yaw:yaw+shake,pitch:mix(from.pitch,pitch,turn)-shake*.63,
   roll:reduced?0:.049*Math.sin(Math.PI*lift)-firstSide*.052*seize-.080*recoil-.12*resistance+.062*tug-.066*drag-.087*swallow},
  actor:{...actor,facing,speed:0,captureReach:reach,captureLift:lift,
   captureFace:{left,right,upper,jaw,bite:swallow,clamp,twitch,glance,gaze,pressure:heldBreath,
    blink:e(.54,.59)*(1-e(.60,.69)),rupture:e(tear+.13,lock+.045),strain:resistance*.59+.53*tug}},
  grasp:{time,reduced,snare,drag,swallow,gripLeft,gripRight,timing},
  peripheral:seize*.11+heldBreath*.13+snare*.17+swallow*.29,
  projection:reduced?1:1+.045*heldBreath-.058*recoil+.085*swallow,
  key:[.69*Math.cos(facing)+.49*Math.sin(facing),.67,-.69*Math.sin(facing)+.49*Math.cos(facing)],
  light:reach*(mix(.53,.86,approach)-.12*heldBreath+.16*snap+.14*impact-.19*swallow),
  roomLight:.066*reach*(1-.65*swallow),
  lamp:1-e(.06,.26),
  dark:e(bite-.004,bite+.030)
 };
}
