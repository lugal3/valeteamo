// V2 phase 08. UI-only act progression; does not change story checkpoints.
export const PROLOGUE_ACTS=Object.freeze([
 Object.freeze({id:'morning',label:'ACTO I',title:'Un día de recuerdos',
  stages:['intro','feed-cat','cat-fed','meet-couple','defend','talk-louis','talk-luis','walk-together']}),
 Object.freeze({id:'abduction',label:'INTERLUDIO',title:'La furgoneta LUNA-07',
  stages:['disappearance']}),
 Object.freeze({id:'dusk',label:'ACTO II',title:'Las pistas de Louis',
  stages:['ribbon','petals','wheel']}),
 Object.freeze({id:'night',label:'ACTO III',title:'La casa en la oscuridad',
  stages:['door','window','house']})
]);
export function prologueAct(stage){
 return PROLOGUE_ACTS.find(act=>act.stages.includes(stage))||PROLOGUE_ACTS[0];
}
export function prologueProgress(stage){
 const act=prologueAct(stage),index=act.stages.indexOf(stage);
 return {id:act.id,label:act.label,title:act.title,step:index+1,total:act.stages.length};
}
export const HOUSE_HANDOFF_MS=720;
