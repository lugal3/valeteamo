// Preserve all puzzle gates, patrol objectives, RC behavior and endings.
export const DIFFICULTIES=Object.freeze({
 story:Object.freeze({label:'Historia',patrol:1.45,chase:2.45,sight:.78,awareness:.68,grace:1.25,lost:1.35,trail:4,cooldown:8,rest:1.45,stun:2.8}),
 normal:Object.freeze({label:'Equilibrado',patrol:1.85,chase:3.75,sight:1,awareness:1,grace:0,lost:2,trail:7,cooldown:5,rest:1,stun:2}),
 tense:Object.freeze({label:'Tensión',patrol:2.05,chase:4.05,sight:1.12,awareness:1.12,grace:0,lost:2.4,trail:8,cooldown:4,rest:.85,stun:1.65})
});
export const validDifficulty=value=>Object.hasOwn(DIFFICULTIES,value)?value:'story';
export function difficultyProfile(mode='story',adaptive=true,lives=3,rescued=false){
 const id=validDifficulty(mode),base=DIFFICULTIES[id];
 // Assistance is selected between attempts, never random or changed mid-chase.
 const level=adaptive?Math.min(2,Math.max(0,3-(Number.isFinite(lives)?lives:3),rescued?2:0)):0;
 return {...base,id,assistance:level,chase:base.chase*(1-.12*level),sight:base.sight*(1-.06*level),awareness:base.awareness*(1-.11*level),grace:base.grace+.60*level,lost:Math.max(.9,base.lost-.2*level),trail:Math.max(3,base.trail-level),cooldown:base.cooldown+2*level,rest:base.rest+.15*level,stun:Math.min(3,base.stun+.3*level)};
}
