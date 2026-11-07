// Two linked, non-consumable puzzles in the experimental rescue route.
export function createHousePuzzle(entry='house'){
 const quick=['drawer','lock','rescue'].includes(entry);
 const state={note:quick,drawer:entry==='lock'||entry==='rescue',key:entry==='lock'||entry==='rescue',symbol:entry==='lock'||entry==='rescue',door:entry==='rescue',rescued:false};
 return state;
}
export function puzzleEvent(state,event){
 const p={...state};
 if(event==='note')p.note=true;
 if(event==='drawer'&&p.note)p.drawer=true;
 if(event==='key'&&p.drawer)p.key=true;
 if(event==='symbol')p.symbol=true;
 if(event==='door'&&p.key&&p.symbol)p.door=true;
 if(event==='rescue'&&p.door)p.rescued=true;
 return p;
}
export function canOpenDrawer(p){return p.note;}
export function canOpenBedroom(p){return p.key&&p.symbol;}
export function canRescue(p){return p.door&&!p.rescued;}
export const PUZZLE_HINTS={
 note:'La nota habla de un cajón bajo el escritorio del estudio. Allí aguarda una llave con un lazo.',
 drawer:'Antes de abrir el cajón, lee la nota doblada del pasillo.',
 symbol:'El cuadro del salón muestra el símbolo del corazón: es la segunda pista para abrir el dormitorio.',
 bedroom:'La cerradura necesita una llave con lazo y conocer el símbolo secreto del cuadro del salón.',
 rescue:'La puerta del dormitorio está abierta. Acércate a Louis y pulsa Rescatar.'
};