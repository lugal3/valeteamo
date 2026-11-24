// The hall note and mirror safe are optional clues in the rescue route.
export function createHousePuzzle(entry='house'){
 const quick=['drawer','lock','rescue'].includes(entry);
 const state={note:quick,drawer:entry==='lock'||entry==='rescue',key:entry==='lock'||entry==='rescue',symbol:entry==='lock'||entry==='rescue',door:entry==='rescue',rescued:false};
 return state;
}
export function puzzleEvent(state,event){
 const p={...state};
 if(event==='note')p.note=true;
 if(event==='drawer')p.drawer=true;
 if(event==='key'&&p.drawer)p.key=true;
 if(event==='symbol')p.symbol=true;
 if(event==='door'&&canOpenBedroom(p))p.door=true;
 if(event==='rescue'&&p.door)p.rescued=true;
 return p;
}
export function canOpenBedroom(p){return p.key;}
export function canRescue(p){return p.door&&!p.rescued;}
export const PUZZLE_HINTS={
 note:'La nota habla de un cajón bajo el escritorio del estudio. Allí aguarda una llave con un lazo.'
};

// V2 phase 09: contextual, spoiler-light guidance. The puzzle authority and
// event transitions above remain unchanged, including all old checkpoint saves.
export function housePuzzleHint(state,blockedAt='bedroom'){
 if(!state)return 'Explora la casa y busca pistas.';
 if(blockedAt==='rescue'){
  if(!state.key)return 'Antes de bajar al sótano, investiga el estudio y encuentra la llave con lazo.';
  if(!state.door)return 'La llave abre un dormitorio de la planta alta. Revisa esa habitación antes del rescate.';
  return state.rescued?'Louis ya ha sido liberado.':'Acércate a Louis y examina las cuerdas.';
 }
 if(state.key)return 'Tienes la llave con lazo. Prueba la cerradura del dormitorio.';
 if(state.drawer)return 'El cajón está abierto. Busca la llave entre sus objetos y el conducto del estudio.';
 if(state.note)return 'La nota señala el escritorio del estudio. Examina el cajón.';
 return 'Busca una nota cerca de la entrada; puede revelar dónde empezar.';
}
