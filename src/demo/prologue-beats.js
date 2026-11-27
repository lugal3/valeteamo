// UI-only chapters: no new gates, checkpoints, dialogues or forced waits.
export const PROLOGUE_ACTS=Object.freeze([
 Object.freeze({id:'morning',label:'CAPÍTULO I',title:'Un día especial',
  stages:['intro','feed-cat','cat-fed']}),
 Object.freeze({id:'meeting',label:'CAPÍTULO II',title:'Encuentros inesperados',
  stages:['meet-couple','defend']}),
 Object.freeze({id:'friend',label:'CAPÍTULO III',title:'Un nuevo amigo',
  stages:['talk-louis','talk-luis','walk-together']}),
 Object.freeze({id:'abduction',label:'INTERLUDIO',title:'La furgoneta LUNA-07',
  stages:['disappearance']}),
 Object.freeze({id:'dusk',label:'CAPÍTULO IV',title:'Tras las pistas',
  stages:['ribbon','petals','wheel']}),
 Object.freeze({id:'night',label:'CAPÍTULO V',title:'La casa',
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
