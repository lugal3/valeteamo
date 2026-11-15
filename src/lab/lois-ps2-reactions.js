// Pure visual reactions for the Lois (Louis legacy actor) 3D NPC.
// They do not open UI, alter quests, spawn geometry, or move the character.
export const LOIS_REACTIONS=Object.freeze({
 'look-kitty':1.05,'listen':1.35,'startle':.75,'relief':1.5,
 'speak':1.6,'reach':1.15
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
const envelope=t=>{const x=clamp(t,0,1);return Math.sin(Math.PI*Math.min(1,x/.16)/2)*Math.sin(Math.PI*Math.min(1,(1-x)/.20)/2)};
export function startLoisReaction(actor,type,duration=LOIS_REACTIONS[type]){
 if(!actor||!Object.prototype.hasOwnProperty.call(LOIS_REACTIONS,type))return false;
 actor.visualReaction={type,age:0,duration:clamp(duration,.15,8)};
 return true;
}
export function advanceLoisReaction(actor,dt){
 const cue=actor?.visualReaction;
 if(!cue)return;
 if(!Number.isFinite(dt)||dt<=0)return;
 cue.age+=Math.min(.15,dt);
 if(cue.age>=cue.duration)actor.visualReaction=null;
}
export function sampleLoisReaction(actor={},reduced=false){
 const cue=actor?.visualReaction;
 const type=cue&&Object.prototype.hasOwnProperty.call(LOIS_REACTIONS,cue.type)?cue.type:null;
 if(!type)return {type:null,weight:0,gazeYaw:0,gazePitch:0,jawOpen:0,browLift:0,
  headYaw:0,headPitch:0,reach:0};
 const t=clamp(cue.age/Math.max(.15,cue.duration),0,1),w=envelope(t);
 const now=clamp(cue.age,0,8);
 const expressive=reduced?.72:1;
 return {
  type,weight:w,
  gazeYaw:(type==='look-kitty'?.31:type==='listen'?-.17:type==='startle'?.14:0)*w*expressive,
  gazePitch:(type==='listen'?.09:type==='startle'?.10:type==='relief'?-.075:0)*w*expressive,
  headYaw:(type==='look-kitty'?.21:type==='listen'?-.14:0)*w*expressive,
  headPitch:(type==='startle'?-.14:type==='relief'?.10:0)*w*expressive,
  browLift:(type==='startle'?.20:type==='relief'?.04:type==='listen'?.10:0)*w,
  jawOpen:(type==='speak'?(reduced?.11:.12+.15*Math.abs(Math.sin(now*13))):type==='startle'?.10:0)*w,
  reach:type==='reach'?w:0
 };
}
