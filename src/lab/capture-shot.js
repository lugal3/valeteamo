export const CAPTURE_REVEAL = 1.64;
export const CAPTURE_BITE = 2.31;
export const CAPTURE_SECONDS = 3.03;

const mix = (a,b,t) => a+(b-a)*t;
const ease = (start,end,time) => {
 const t=Math.max(0,Math.min(1,(time-start)/(end-start)));
 return t*t*(3-2*t);
};

export function captureFrame(from,actor,time,reduced) {
 const dx=from.x-actor.x,dz=from.z-actor.z,distance=Math.hypot(dx,dz);
 const facing=distance>.05?Math.atan2(dx,dz):actor.facing;
 const reach=ease(0,.32,time),lift=ease(.09,.77,time),approach=ease(.55,1.24,time);
 const charge=ease(2.03,2.20,time),bite=ease(2.19,2.39,time),clampJaw=ease(2.32,2.47,time);
 const pullBack=ease(1.42,1.63,time)*(1-ease(1.63,1.80,time));
 const left=ease(1.02,1.50,time)*.36+ease(1.48,1.87,time)*.64;
 const right=ease(1.19,1.65,time)*.40+ease(1.58,1.95,time)*.60;
 const jaw=(ease(1.21,1.52,time)*.22+ease(1.53,1.80,time)*.56+.22*charge)*(1-.84*clampJaw);
 const twitch=reduced?0:Math.sin(time*44)*ease(1.13,1.50,time)*(.56+.44*Math.sin(time*11));
 const glance=ease(1.34,1.58,time)*(1-ease(1.61,1.72,time));
 const radius=mix(Math.max(.83,distance),.549,approach)+pullBack*.052-bite*(reduced?.08:.26);
 const turn=ease(0,.43,time);
 const targetYaw=Math.atan2(actor.x-from.x,actor.z-from.z);
 const turnDelta=Math.atan2(Math.sin(targetYaw-from.yaw),Math.cos(targetYaw-from.yaw));
 const orbit=reduced?0:Math.sin(Math.PI*approach)*.047+(right-left)*.027;
 const x=mix(from.x,actor.x+Math.sin(facing)*radius+Math.cos(facing)*orbit,reach);
 const z=mix(from.z,actor.z+Math.cos(facing)*radius-Math.sin(facing)*orbit,reach);
 const y=mix(from.y,actor.y+1.692,lift)+Math.sin(Math.PI*lift)*.13-bite*.074;
 const shake=reduced?0:.022*Math.sin(time*44)*Math.sin(Math.PI*reach)+.034*twitch*Math.sin(Math.PI*clampJaw);
 const focusY=actor.y+mix(1.695-.056*jaw,1.553,bite);
 const pitch=Math.atan2(focusY-y,Math.hypot(actor.x-x,actor.z-z));
 const yaw=turn<1?from.yaw+turnDelta*turn:Math.atan2(actor.x-x,actor.z-z);
 return {
  camera:{x,y,z,yaw:yaw+shake,pitch:mix(from.pitch,pitch,turn)+shake},
  actor:{...actor,facing,speed:0,captureReach:reach,captureLift:lift,captureFace:{left,right,jaw,bite,twitch,glance}},
  grip:ease(0,.32,time),
  light:.31+.57*approach+.14*charge,
  dark:ease(2.36,2.50,time)
 };
}
