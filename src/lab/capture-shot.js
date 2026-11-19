export const CAPTURE_BREATH=.61,CAPTURE_TEAR=1.07,CAPTURE_REVEAL=1.68,CAPTURE_GRAB=2.17,CAPTURE_SECOND_GRAB=2.36,CAPTURE_BITE=3.14,CAPTURE_SECONDS=3.89;

const mix=(a,b,t)=>a+(b-a)*t;
export const shotEase=(start,end,time)=>{
 const t=Math.max(0,Math.min(1,(time-start)/(end-start)));
 return t*t*(3-2*t);
};

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

export function captureFrame(from,actor,time,reduced){
 const e=(start,end)=>shotEase(start,end,time);
 const dx=from.x-actor.x,dz=from.z-actor.z,distance=Math.hypot(dx,dz);
 const facing=distance>.05?Math.atan2(dx,dz):actor.facing;
 const reach=e(0,.26),lift=e(.07,.79),approach=e(.63,1.31);
 const heldBreath=e(.53,.92)*(1-e(1.48,1.76));
 const snap=e(1.54,1.70)*(1-e(1.78,2.02));
 const recoil=e(1.44,1.75)*(1-e(1.87,2.24));
 const gripLeft=e(CAPTURE_GRAB-.043,CAPTURE_GRAB+.145);
 const gripRight=e(CAPTURE_SECOND_GRAB-.042,CAPTURE_SECOND_GRAB+.146);
 const snare=(gripLeft+gripRight)*.5,tug=e(2.36,2.60),drag=e(2.55,2.89),swallow=e(2.87,3.32);
 const left=e(1.04,1.47)*.21+e(1.52,1.73)*.61+e(1.75,2.02)*.18;
 const right=e(1.31,1.75)*.18+e(1.79,2.09)*.19+e(2.48,2.88)*.50;
 const clamp=e(3.13,3.40);
 const jaw=(e(1.32,1.47)*.16+e(1.59,1.81)*.52-.075*(e(1.88,2.01)-e(2.40,2.75))
  +.32*e(2.39,2.88))*(1-.91*clamp);
 const pulse=(e(.89,1.10)-e(1.25,1.42))*.37+e(1.50,1.70)*.28;
 const twitch=reduced?0:Math.sin(time*46+Math.sin(time*6))*(pulse+.50*snap+.38*snare*(1-drag));
 const glance=e(.56,.93)*(1-e(1.55,1.67));
 const impact=(e(2.34,2.45)-e(2.47,2.62))+(e(2.88,2.99)-e(3.05,3.17))*.55;
 const resistance=gripLeft-gripRight;
 const radius=mix(Math.max(.78,distance),.505,approach)+recoil*.091+heldBreath*.030
  -tug*.033-drag*(reduced?.063:.102)-swallow*(reduced?.119:.234);
 const turn=e(0,.44);
 const targetYaw=facing+Math.PI,turnDelta=Math.atan2(Math.sin(targetYaw-from.yaw),Math.cos(targetYaw-from.yaw));
 const orbit=reduced?0:Math.sin(Math.PI*approach)*.039-.046*recoil+.078*resistance-.040*snare+.023*drag;
 const x=mix(from.x,actor.x+Math.sin(facing)*radius+Math.cos(facing)*orbit,reach);
 const z=mix(from.z,actor.z+Math.cos(facing)*radius-Math.sin(facing)*orbit,reach);
 const y=mix(from.y,actor.y+1.704,lift)+Math.sin(Math.PI*lift)*.22-(snare-drag)*.063-swallow*.157;
 const shake=reduced?0:.024*kick(time,CAPTURE_GRAB)-.061*kick(time,CAPTURE_SECOND_GRAB)+.052*kick(time,2.93);
 const focusY=actor.y+1.705-.061*jaw-.122*swallow;
 const pitch=Math.atan2(focusY-y,Math.hypot(actor.x-x,actor.z-z));
 const yaw=turn<1?from.yaw+turnDelta*turn:Math.atan2(actor.x-x,actor.z-z);
 const gaze={
  x:(x-actor.x)*Math.cos(facing)-(z-actor.z)*Math.sin(facing),
  y:y-actor.y,
  z:(x-actor.x)*Math.sin(facing)+(z-actor.z)*Math.cos(facing)
 };
 return {
  camera:{x,y,z,yaw:yaw+shake,pitch:mix(from.pitch,pitch,turn)-shake*.63,
   roll:reduced?0:.065*Math.sin(Math.PI*lift)-.092*recoil-.16*resistance+.072*tug-.095*drag-.107*swallow},
  actor:{...actor,facing,speed:0,captureReach:reach,captureLift:lift,
   captureFace:{left,right,jaw,bite:swallow,twitch,glance,gaze,pressure:heldBreath,
    rupture:e(1.61,2.51),strain:resistance*.59+.53*tug}},
  grasp:{time,reduced,snare,drag,swallow,gripLeft,gripRight},
  grip:reach,
  key:[.50*Math.cos(facing)+.48*Math.sin(facing),.84,-.50*Math.sin(facing)+.48*Math.cos(facing)],
  light:mix(.56,.81,approach)-.15*heldBreath+.11*snap+.15*impact-.34*swallow,
  dark:e(3.04,3.24)
 };
}
