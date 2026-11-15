// Storyline contract for the unified 2D prologue. Separate save key: it cannot
// delete or overwrite the classic Phaser garden or the older rescue demo save.
export const PROLOGUE_SAVE_KEY='valeteamo-story-acts-1-2-v1';
export const PROLOGUE_VERSION=1;
export const PROLOGUE_START=Object.freeze({
 version:PROLOGUE_VERSION,stage:'intro',hp:6,clues:0,completed:false
});
export const STAGES=[
 'intro','defend','talk-louis','talk-luis','walk-together',
 'disappearance','ribbon','petals','wheel','door','window','house'
];
const EVENTS={
 intro:{begin:'defend'},
 defend:{victory:'talk-louis'},
 'talk-louis':{louis:'talk-luis'},
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
 const nextStage=EVENTS[state.stage]?.[event];
 if(!nextStage)return {...state};
 return {
  ...state,stage:nextStage,
  clues:CLUE_STAGE[event]??state.clues,
  hp:Math.min(6,Math.max(1,state.hp)),
  completed:nextStage==='house'
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
  if(source?.version!==PROLOGUE_VERSION||!STAGES.includes(source.stage))return {...PROLOGUE_START};
  // A reload during the short kidnapping cinematic must replay the approach,
  // not strand Kitty in a non-interactive in-between state.
  const stage=source.stage==='disappearance'?'walk-together':source.stage;
  const hp=Number(source.hp);
  const maxClues=stage==='ribbon'?0:stage==='petals'?1:stage==='wheel'?2:
   ['door','window','house'].includes(stage)?3:0;
  return {
   version:PROLOGUE_VERSION,stage,
   hp:Number.isFinite(hp)?Math.min(6,Math.max(1,Math.round(hp))):6,
   clues:maxClues,completed:source.stage==='house'
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

// Each line is a real, skippable RPG dialogue. The hero is Kitty; Luis is
// her boyfriend with glasses and a tattooed left arm; Louis is a DIFFERENT
// character (young, 1D-era hairstyle), who will be kidnapped.
export const PROLOGUE_DIALOGUES={
 intro:[
  {speaker:'Kitty',text:'¡Qué bonito el sendero, el puente y esas flores! Escuché gritos cerca del jardín…'},
  {speaker:'Kitty',text:'Ya aprendí: a la izquierda camino, a la derecha apunto y disparo. En PC uso WASD y las flechas o el mouse.'},
  {speaker:'Kitty',text:'¡Allí! Hay alguien entre los cerezos. ¡Tengo que ayudarlo!'}
 ],
 victory:[
  {speaker:'Louis',text:'¡Uf! Gracias por salvarme. Esas cosas salieron de los árboles y no dejaban de seguirme.'},
  {speaker:'Kitty',text:'¡Qué susto! ¿Estás bien? Yo soy Kitty.'},
  {speaker:'Louis',text:'Sí. Soy Louis. Me dedico a la música... aunque hoy prefiero no dar un concierto a esas sombras.'},
  {speaker:'Louis',text:'No quiero asustarte, pero he visto a un señor de traje observándome desde hace días. Siempre desaparece cuando lo miro.'},
  {speaker:'Kitty',text:'Ven conmigo. Mi novio Luis está cerca; seguro sabrá qué hacer.'}
 ],
 luis:[
  {speaker:'Luis',text:'¡Kitty! ♡ ¿Quién es nuestro nuevo amigo?'},
  {speaker:'Kitty',text:'Es Louis. Lo estaban atacando unas sombras y me contó que alguien lo sigue.'},
  {speaker:'Luis',text:'Soy Luis, con una sola «o». Yo soy el novio de Kitty; Louis es nuestro invitado. ¡Que no nos confundan!'},
  {speaker:'Louis',text:'Ja, gracias, Luis. El hombre tenía el pelo claro y llevaba un traje oscuro. Me dio mala espina.'},
  {speaker:'Luis',text:'Voy a revisar el sendero y estar pendiente del móvil. Kitty, te escribiré si encuentro algo.'},
  {speaker:'Kitty',text:'Vale. Louis, acompáñame hasta el claro y luego volvemos todos juntos.'}
 ],
 warning:[
  {speaker:'Louis',text:'¿Escuchaste eso? Los pájaros dejaron de cantar de golpe.'},
  {speaker:'Kitty',text:'Todo se ve tan tranquilo... Seguro fue el viento.'},
  {speaker:'Louis',text:'No, Kitty. Hay alguien detrás de nosotros. Reconozco esos pasos...'}
 ],
 abducted:[
  {speaker:'Kitty',text:'¡LOUIS! ¡No, no, no! ¡Desapareció delante de mí!'},
  {speaker:'Kitty',text:'Dejó algo brillante en el suelo. Tengo que seguir las pistas aunque el bosque se esté oscureciendo.'},
  {speaker:'Luis',text:'[Mensaje] Kitty, ¿estás bien? Vi unas huellas que van hacia las casas viejas. Te voy a ayudar.'}
 ],
 ribbon:[
  {speaker:'Kitty',text:'¡Es la pulsera de Louis! Estaba aquí cuando la sombra se lo llevó.'},
  {speaker:'Luis',text:'[Mensaje] Su pulsera tiene una flor grabada. Busca otras flores iguales en el sendero.'}
 ],
 petals:[
  {speaker:'Kitty',text:'Hay pétalos de cerezo incluso lejos de los árboles. Parece que alguien los fue dejando para marcar un camino.'},
  {speaker:'Luis',text:'[Mensaje] Estoy siguiendo el mapa. El camino desemboca en una casa grande. Ya está oscureciendo... ten cuidado.'}
 ],
 wheel:[
  {speaker:'Kitty',text:'Marcas recientes de ruedas... y ese dibujo de una flor en el suelo. Alguien llegó aquí hace poco.'},
  {speaker:'Luis',text:'[Mensaje] La señal de Louis se perdió cerca de esa casa. Yo vigilaré la entrada y te avisaré por el teléfono.'},
  {speaker:'Kitty',text:'No voy a dejarlo solo. Voy a buscar una forma de entrar.'}
 ],
 locked:[
  {speaker:'Kitty',text:'La puerta principal tiene una cerradura enorme. Está completamente cerrada.'},
  {speaker:'Luis',text:'[Mensaje] Da la vuelta a la casa. Vi una ventana entreabierta desde el camino.'}
 ],
 window:[
  {speaker:'Kitty',text:'Ahí está... ¡una ventana abierta! Si entro por aquí nadie me verá desde la puerta.'},
  {speaker:'Luis',text:'[Mensaje] Quédate atenta a mi teléfono. Si veo que vuelve el dueño de la casa, te avisaré.'},
  {speaker:'Kitty',text:'Voy a entrar por la ventana. Louis, aguanta un poquito más...'}
 ]
};
export const PROLOGUE_OBJECTIVES={
 intro:'Explora el sendero y cruza el puente hacia el jardín',
 defend:'Protege a Louis: derrota a las sombras con corazones',
 'talk-louis':'Habla con Louis entre los cerezos',
 'talk-luis':'Sigue el camino hasta Luis, tu novio',
 'walk-together':'Acompaña a Louis hasta el claro del bosque',
 disappearance:'¿Qué le ocurrió a Louis?',
 ribbon:'Busca la pulsera de Louis',
 petals:'Sigue los pétalos brillantes',
 wheel:'Investiga las huellas en la vereda del vecindario',
 door:'Comprueba la puerta principal',
 window:'Encuentra la ventana abierta',
 house:'Explora la casa en 3D'
};
