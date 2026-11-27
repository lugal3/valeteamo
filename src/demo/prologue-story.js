// Storyline contract for the unified 2D prologue. Separate save key: it cannot
// delete or overwrite the classic Phaser garden or the older rescue demo save.
export const PROLOGUE_SAVE_KEY='valeteamo-story-acts-1-2-v1';
export const PROLOGUE_VERSION=2;
export const PROLOGUE_START=Object.freeze({
 version:PROLOGUE_VERSION,stage:'intro',hp:6,clues:0,completed:false,fedGreyCat:false,metCouple:false
});
export const STAGES=[
 'intro','feed-cat','cat-fed','meet-couple','defend','talk-louis','talk-luis','walk-together',
 'disappearance','ribbon','petals','wheel','door','window','house'
];
const EVENTS={
 intro:{churu:'feed-cat'},
 'feed-cat':{fed:'cat-fed'},
 'cat-fed':{arrived:'meet-couple'},
 'meet-couple':{met:'defend'},
 defend:{victory:'talk-louis'},
 'talk-louis':{louis:'walk-together'},
 'talk-luis':{luis:'walk-together'},
 'walk-together':{clearing:'disappearance'},
 disappearance:{abducted:'ribbon'},
 ribbon:{ribbon:'petals'},
 petals:{petals:'wheel'},
 wheel:{wheel:'door'},
 door:{locked:'window'},
 window:{enter:'house'}
};
const CLUE_STAGE={ribbon:1,petals:2,wheel:3};
export function advancePrologue(state,event){
 const legacyLuis=state.stage==='talk-louis'&&event==='louis'&&!state.metCouple;
 const nextStage=legacyLuis?'talk-luis':EVENTS[state.stage]?.[event];
 if(!nextStage)return {...state};
 return {
  ...state,stage:nextStage,
  clues:CLUE_STAGE[event]??state.clues,
  hp:Math.min(6,Math.max(1,state.hp)),
  completed:nextStage==='house',
  fedGreyCat:state.fedGreyCat||event==='fed',
  metCouple:state.metCouple||event==='met'
 };
}
export function hurtPrologue(state,amount=1){
 return {...state,hp:Math.max(0,Math.min(6,state.hp-Math.max(0,amount)))};
}
export function healPrologue(state,amount=1){
 return {...state,hp:Math.min(6,state.hp+Math.max(0,amount))};
}
export function parsePrologue(raw){
 try{
  const source=JSON.parse(raw);
  if(![1,PROLOGUE_VERSION].includes(source?.version)||!STAGES.includes(source.stage))return {...PROLOGUE_START};
  // A reload during the short kidnapping cinematic must replay the approach,
  // not strand Kitty in a non-interactive in-between state.
  const stage=source.stage==='disappearance'?'walk-together':source.stage;
  const hp=Number(source.hp);
  const maxClues=stage==='ribbon'?0:stage==='petals'?1:stage==='wheel'?2:
   ['door','window','house'].includes(stage)?3:0;
  return {
   version:PROLOGUE_VERSION,stage,
   hp:Number.isFinite(hp)?Math.min(6,Math.max(1,Math.round(hp))):6,
   clues:maxClues,completed:source.stage==='house',
   fedGreyCat:source.version===PROLOGUE_VERSION&&source.fedGreyCat===true&&!['intro','feed-cat'].includes(stage),
   metCouple:source.version===PROLOGUE_VERSION&&source.metCouple===true&&!['intro','feed-cat','cat-fed','meet-couple'].includes(stage)
  };
 }catch{return {...PROLOGUE_START};}
}
export function loadPrologue(){
 try{return parsePrologue(localStorage.getItem(PROLOGUE_SAVE_KEY));}
 catch{return {...PROLOGUE_START};}
}
export function savePrologue(state){
 try{localStorage.setItem(PROLOGUE_SAVE_KEY,JSON.stringify(state));return true;}
 catch{return false;}
}
export function resetPrologue(){
 try{localStorage.removeItem(PROLOGUE_SAVE_KEY);}catch{}
}

// Short narrative prologue: warmth first, then the unexpected change of genre.
// No new mandatory stages or conversations. Luis and Vale are distinct from Louis.
export const PROLOGUE_DIALOGUES={
 couple:[
  {speaker:'Vale',tone:'warm',text:'¡Kitty! Qué lindo día. Oye… ¿escuchaste eso? Alguien pidió ayuda entre los cerezos.'},
  {speaker:'Luis',tone:'calm',text:'Vale y yo iremos al pueblo a buscar ayuda. Si ves algo, avísame; llevo mi teléfono.'}
 ],
 victory:[
  {speaker:'Louis',tone:'warm',text:'¡Uf, gracias! Soy Louis. Venía de ensayar para un concierto… no esperaba necesitar un rescate.'},
  {speaker:'Kitty',tone:'warm',text:'¡Soy Kitty! Ven, conozco un camino bonito. No tienes que caminar solo.'}
 ],
 luis:[
  {speaker:'Luis',tone:'calm',text:'Voy a revisar el camino y buscar ayuda. Tengo el teléfono a mano.'},
  {speaker:'Kitty',tone:'warm',text:'Cuídate. Louis y yo seguimos hacia el claro.'}
 ],
 warning:[
  {speaker:'Louis',tone:'suspense',text:'Kitty… espera. Esa furgoneta. La vi también cuando salí del ensayo.'}
 ],
 abducted:[
  {speaker:'Kitty',tone:'alarm',text:'¡Louis!… Una media luna, LUNA-07. Tengo que recordar esa matrícula.'}
 ],
 ribbon:[
  {speaker:'Kitty',tone:'suspense',text:'¡Su pulsera! La llevaba cuando nos conocimos. Estoy siguiendo el camino correcto.'}
 ],
 petals:[
  {speaker:'Kitty',tone:'suspense',text:'Los pétalos están aplastados… la furgoneta pasó por aquí.'}
 ],
 wheel:[
  {speaker:'Kitty',tone:'suspense',text:'Las huellas llegan al barrio. Le avisaré a Luis; quizá pueda vigilar desde fuera.'}
 ],
 locked:[
  {speaker:'Kitty',tone:'whisper',text:'LUNA-07… es aquí. La puerta está cerrada. Tiene que haber otra entrada.'}
 ],
 window:[
  {speaker:'Kitty',tone:'whisper',text:'La ventana está entreabierta. Louis, aguanta un poquito más.'}
 ]
};
export const PROLOGUE_OBJECTIVES={
 intro:'Busca el Churu junto al sendero',
 'feed-cat':'Lleva el Churu en la mano y alimenta a Emy al cruzar el puente',
 'cat-fed':'Continúa por el sendero hacia el jardín',
 'meet-couple':'Saluda a Luis y Vale entre los cerezos',
 defend:'Sigue el grito por los cerezos y ayuda al desconocido',
 'talk-louis':'Conoce al chico al que acabas de rescatar',
 'talk-luis':'Sigue el camino hasta Luis, tu novio',
 'walk-together':'Pasea con Louis por el jardín',
 disappearance:'¡Una furgoneta acaba de llevarse a Louis!',
 ribbon:'Busca la pulsera de Louis',
 petals:'Busca señales entre los pétalos',
 wheel:'Sigue las huellas de ruedas hasta la furgoneta',
 door:'Busca la furgoneta LUNA-07 y comprueba la entrada frontal',
 window:'Entra por la ventana abierta del FRENTE de la casa',
 house:'Entra con cuidado'
};
