import type {IsoPoint} from '../isometric';

// Reusable scripted beats for Luis in the ORIGINAL Corazones scene.
// No independent engine/timers; scene.update drives this state machine.
export type LuisMotionKind='arriving'|'greeting'|'farewell-wave'|'farewell-walk';
export type LuisMotion={
 kind:LuisMotionKind;
 from:IsoPoint;to:IsoPoint;mid:IsoPoint;
 elapsed:number;duration:number;done?:()=>void;
};
export const LUIS_BEATS={
 approachRadius:3.9,
 arriveMs:1850,
 greetMs:650,
 farewellWaveMs:780,
 leaveMs:1750
} as const;
const point=(u:number,v:number):IsoPoint=>({u,v});
export function luisEntryPoint(meeting:IsoPoint):IsoPoint{
 // The side path is in view as Kitty approaches; he's not spawned on Kitty.
 return point(meeting.u+3.4,meeting.v+.25);
}
export function luisExitPoint(meeting:IsoPoint):IsoPoint{
 // He returns toward the sendero / phone signal, NOT forward with Kitty.
 return point(meeting.u-3.7,meeting.v+2.2);
}
export function makeLuisMotion(kind:LuisMotionKind,meeting:IsoPoint,done?:()=>void):LuisMotion{
 if(kind==='arriving'){
  return {kind,from:luisEntryPoint(meeting),to:{...meeting},
   mid:point(meeting.u+1.65,meeting.v-1.05),
   elapsed:0,duration:LUIS_BEATS.arriveMs,done};
 }
 if(kind==='farewell-walk'){
  return {kind,from:{...meeting},to:luisExitPoint(meeting),
   mid:point(meeting.u-1.35,meeting.v+1.1),
   elapsed:0,duration:LUIS_BEATS.leaveMs,done};
 }
 return {kind,from:{...meeting},to:{...meeting},mid:{...meeting},
  elapsed:0,duration:kind==='greeting'?LUIS_BEATS.greetMs:LUIS_BEATS.farewellWaveMs,done};
}
export function luisPointOnPath(motion:LuisMotion):IsoPoint{
 const t=Math.max(0,Math.min(1,motion.elapsed/Math.max(1,motion.duration)));
 // Ease in/out + a curved quadratic path (no NPC teleport, no direct straight line).
 const smooth=t*t*(3-2*t),i=1-smooth;
 return {u:i*i*motion.from.u+2*i*smooth*motion.mid.u+smooth*smooth*motion.to.u,
  v:i*i*motion.from.v+2*i*smooth*motion.mid.v+smooth*smooth*motion.to.v};
}
export function luisMotionIsBlocking(motion:LuisMotion|undefined):boolean{
 return !!motion;
}
