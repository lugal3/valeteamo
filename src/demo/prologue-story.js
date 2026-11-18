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

// Minimal placeholder dialogue: the animation communicates the story.
// Luis and Vale are distinct from Louis, whom Kitty protects and rescues.
// These are intentionally concise so the player can reach/test scenes quickly.
export const PROLOGUE_DIALOGUES={
 couple:[
  {speaker:'Vale',text:'Hola, Kitty. Luis y yo vimos a Louis cerca de los cerezos.'},
  {speaker:'Luis',text:'Se oyeron ruidos en el jardín. Iremos por el sendero. ¡Ten cuidado!'}
 ],
 victory:[
  {speaker:'Louis',text:'Gracias por ayudarme. Creo que alguien nos sigue.'}
 ],
 luis:[
  {speaker:'Luis',text:'Voy a revisar el camino. Cuídate, Kitty.'},
  {speaker:'Kitty',text:'Cuídate. Louis y yo seguimos hacia el claro.'}
 ],
 warning:[
  {speaker:'Louis',text:'Kitty… ¿escuchas ese motor?'}
 ],
 abducted:[
  {speaker:'Kitty',text:'¡Se llevaron a Louis en esa furgoneta! Tenía una media luna y decía LUNA-07.'}
 ],
 ribbon:[
  {speaker:'Kitty',text:'La pulsera de Louis… Debió caer cuando lo subieron a la furgoneta.'}
 ],
 petals:[
  {speaker:'Kitty',text:'Los pétalos siguen por este sendero. Quizás dejaron un rastro.'}
 ],
 wheel:[
  {speaker:'Kitty',text:'Estas ruedas son de la furgoneta. La carretera lleva a las casas.'}
 ],
 locked:[
  {speaker:'Kitty',text:'La puerta está cerrada. ¿Habrá otra forma de entrar?'}
 ],
 window:[
  {speaker:'Kitty',text:'Una ventana abierta… entraré por aquí. Louis, voy a encontrarte.'}
 ]
};
export const PROLOGUE_OBJECTIVES={
 intro:'Busca el Churu junto al sendero',
 'feed-cat':'Cruza el puente y ofrece el Churu a la gata gris',
 'cat-fed':'Continúa por el sendero hacia el jardín',
 'meet-couple':'Saluda a Luis y Vale entre los cerezos',
 defend:'Protege a Louis: derrota a las sombras con corazones',
 'talk-louis':'Habla con Louis entre los cerezos',
 'talk-luis':'Sigue el camino hasta Luis, tu novio',
 'walk-together':'Acompaña a Louis hasta el claro del bosque',
 disappearance:'¡Una furgoneta acaba de llevarse a Louis!',
 ribbon:'Busca la pulsera de Louis',
 petals:'Sigue los pétalos brillantes',
 wheel:'Sigue las huellas de ruedas hasta la furgoneta',
 door:'Comprueba la puerta principal',
 window:'Encuentra la ventana abierta',
 house:'Explora la casa en 3D'
};
