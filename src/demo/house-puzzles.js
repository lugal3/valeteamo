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
