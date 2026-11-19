export const CAPTURE_TEAR=1.02,CAPTURE_REVEAL=1.68,CAPTURE_GRAB=2.22,CAPTURE_BITE=3.14,CAPTURE_SECONDS=3.89;

const mix=(a,b,t)=>a+(b-a)*t;
export const shotEase=(start,end,time)=>{
 const t=Math.max(0,Math.min(1,(time-start)/(end-start)));
 return t*t*(3-2*t);
};

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
 const reach=e(0,.30),lift=e(.06,.86),approach=e(.52,1.18);
 const recoil=e(1.44,1.75)*(1-e(1.87,2.24));
 const snare=e(2.12,2.43),tug=e(2.29,2.54),drag=e(2.49,2.88),swallow=e(2.86,3.32);
 const left=e(.96,1.48)*.27+e(1.41,2.04)*.73;
 const right=e(1.27,1.94)*.36+e(2.46,2.87)*.52;
 const clamp=e(3.13,3.40);
 const jaw=(e(1.28,1.62)*.14+e(1.61,1.97)*.51+.35*e(2.37,2.88))*(1-.91*clamp);
 const pulse=(e(.84,1.11)-e(1.19,1.30))*.6+e(1.48,1.89)*.4;
 const twitch=reduced?0:Math.sin(time*47+Math.sin(time*6))*(pulse+.45*snare*(1-drag));
 const glance=e(.74,1.32)*(1-e(1.46,1.71));
 const impact=(e(2.19,2.34)-e(2.35,2.54))+(e(2.87,3.01)-e(3.06,3.17))*.55;
 const radius=mix(Math.max(.78,distance),.505,approach)+recoil*.085-tug*.033-drag*(reduced?.063:.102)-swallow*(reduced?.119:.234);
 const turn=e(0,.44);
 const targetYaw=facing+Math.PI,turnDelta=Math.atan2(Math.sin(targetYaw-from.yaw),Math.cos(targetYaw-from.yaw));
 const orbit=reduced?0:Math.sin(Math.PI*approach)*.062-.087*recoil+.036*snare-.074*tug+.035*drag;
 const x=mix(from.x,actor.x+Math.sin(facing)*radius+Math.cos(facing)*orbit,reach);
 const z=mix(from.z,actor.z+Math.cos(facing)*radius-Math.sin(facing)*orbit,reach);
 const y=mix(from.y,actor.y+1.704,lift)+Math.sin(Math.PI*lift)*.22-(snare-drag)*.063-swallow*.157;
 const shake=reduced?0:twitch*.017+Math.sin(time*57)*impact*.058;
 const focusY=actor.y+1.700-.047*jaw-.130*swallow;
 const pitch=Math.atan2(focusY-y,Math.hypot(actor.x-x,actor.z-z));
 const yaw=turn<1?from.yaw+turnDelta*turn:Math.atan2(actor.x-x,actor.z-z);
 return {
  camera:{x,y,z,yaw:yaw+shake,pitch:mix(from.pitch,pitch,turn)+shake,
   roll:reduced?0:.065*Math.sin(Math.PI*lift)-.115*recoil+.13*tug-.096*drag-.14*swallow},
  actor:{...actor,facing,speed:0,captureReach:reach,captureLift:lift,captureFace:{left,right,jaw,bite:swallow,twitch,glance}},
  grasp:{time,reduced,snare,drag,swallow},
  grip:reach,
  light:mix(.61,.89,approach)-.13*e(1.1,1.6)+.20*impact-.45*swallow,
  dark:e(3.04,3.24)
 };
}
