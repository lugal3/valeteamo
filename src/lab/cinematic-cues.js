// Deterministic, frame-rate independent cue timeline for the physical 3D finale.
// No camera/actor positions, puzzle flags or audio contexts are modified here.
export const ESCAPE_FINALE_CUES=Object.freeze([
 Object.freeze({id:'threat',at:.28,sound:'floor-groan',source:'pursuer',level:.65,caption:'El secuestrador se acerca detrás de Kitty'}),
 Object.freeze({id:'emy-warning',at:1.70,sound:'cat',source:'emy',level:1.20,caption:'Emy salta para proteger a Kitty'}),
 Object.freeze({id:'impact',at:2.08,sound:'cloth',source:'pursuer',level:1,caption:'Emy alcanza al secuestrador'}),
 Object.freeze({id:'escape',at:3.52,sound:'wood',source:'kitty',level:.72,caption:'Kitty y Louis corren hacia el jardín'}),
 Object.freeze({id:'safe',at:6.80,sound:'notification',source:null,level:.65,caption:'La salida está cerca; Louis y Kitty siguen juntos'})
]);
export function collectCinematicCues(track,previous,elapsed,played=new Set()){
 const cues=track==='escape'?ESCAPE_FINALE_CUES:[];
 const lo=Number.isFinite(previous)?Math.max(0,previous):0;
 const hi=Number.isFinite(elapsed)?Math.max(0,elapsed):lo;
 if(hi<lo)return [];
 const result=[];
 for(const cue of cues){
  if(!played.has(cue.id)&&cue.at<=hi&&(cue.at>lo||lo===0)){
   played.add(cue.id);result.push(cue);
  }
 }
 return result;
}
