// Deterministic, frame-rate independent cue timeline for the physical 3D finale.
// No camera/actor positions, puzzle flags or audio contexts are modified here.
export const ESCAPE_FINALE_CUES=Object.freeze([
 Object.freeze({id:'threat',at:.28,sound:'floor-groan',source:'pursuer',level:1,caption:'Un golpe fuerte detrás de Kitty'}),
 Object.freeze({id:'emy-warning',at:1.30,sound:'cat',source:'emy',level:1.20,caption:'Emy se eriza y se prepara para saltar'}),
 Object.freeze({id:'impact',at:2.08,sound:'cloth',source:'pursuer',level:1,caption:'Emy alcanza al secuestrador'}),
 Object.freeze({id:'emy-land',at:2.73,sound:'grass',source:'emy',level:.55,caption:'Emy aterriza en el jardín'}),
 Object.freeze({id:'escape',at:3.52,sound:'wood',source:'kitty',level:.72,caption:'¡Corre hacia el jardín con Louis!'}),
 Object.freeze({id:'safe',at:6.80,sound:'notification',source:null,level:.65,caption:'Kitty, Louis y Emy están a salvo'})
]);
// Seconds on the same shot clock, with distinct IDs for repeated sounds.
export const WINDOW_ENTRY_CUES=Object.freeze([
 {id:'garden-step-left',at:.48,sound:'grass',source:'kitty',level:.42,caption:'Pasos suaves en el jardín'},
 {id:'garden-step-right',at:1.10,sound:'grass',source:'kitty',level:.38,caption:''},
 {id:'latch',at:1.86,sound:'latch',source:'window',level:.65,caption:'Cede el pestillo'},
 {id:'sash',at:2.10,sound:'window',source:'window',level:.72,caption:'Cruje la ventana'},
 {id:'grip',at:3.50,sound:'cloth',source:'window',level:.34,caption:''},
 {id:'slip',at:4.40,sound:'cloth',source:'window',level:.87,caption:'Kitty resbala'},
 {id:'push',at:6.15,sound:'wood',source:'window',level:.52,caption:''},
 {id:'release',at:7.65,sound:'cloth',source:'window',level:.36,caption:''},
 {id:'land',at:8.60,sound:'land',source:'kitty',level:.82,caption:'Kitty aterriza dentro'}
].map(Object.freeze));
export const UNTIE_CUES=Object.freeze([
 {id:'grasp-rope',at:.56,sound:'cloth',source:'louis',level:.32,caption:''},
 {id:'loosen-rope',at:1.28,sound:'cloth',source:'louis',level:.55,caption:''},
 {id:'release-knot',at:2.25,sound:'cloth',source:'louis',level:.84,caption:'Las cuerdas ceden.'},
 {id:'rope-floor',at:2.82,sound:'cloth',source:'louis',level:.44,caption:''},
 {id:'chair-rise',at:3.28,sound:'wood',source:'louis',level:.42,caption:'Louis se incorpora con cuidado.'}
].map(Object.freeze));
export function collectCinematicCues(track,previous,elapsed,played=new Set()){
 const cues=track==='escape'?ESCAPE_FINALE_CUES:track==='window'?WINDOW_ENTRY_CUES:track==='untie'?UNTIE_CUES:[];
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
