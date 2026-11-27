// Visual schedule only. The public unlock remains the original timestamp.
export const DAILY_THEMES=Object.freeze([
 {id:'blossom',date:'27 NOV',name:'Pétalos y corazones',emblem:'✿ ♡ ✿',message:'Comienza una pequeña cuenta atrás para alguien muy especial. Cada día, una nueva sorpresa.'},
 {id:'constellation',date:'28 NOV',name:'Constelación',emblem:'✧ ⋆ ✦',message:'Entre tantas estrellas, hay una que hace que todo brille distinto. Ya falta un poquito menos.'},
 {id:'letter',date:'29 NOV',name:'Carta secreta',emblem:'♡ ✉ ♡',message:'Hay cosas bonitas que las palabras no alcanzan a contar. Una de ellas te espera el 5 de diciembre.'},
 {id:'garden',date:'30 NOV',name:'Jardín de recuerdos',emblem:'❀ ✿ ❀',message:'Los momentos pequeños también merecen celebrarse. Ojalá este día te regale una sonrisa.'},
 {id:'pixel',date:'01 DIC',name:'Aventura pixel',emblem:'♥ ✦ ♥',message:'Nuevo mes, nueva misión: llegar a tu cumpleaños. Hay una aventura preparada especialmente para ti.'},
 {id:'aurora',date:'02 DIC',name:'Aurora de colores',emblem:'✧ ◇ ✧',message:'Se acerca tu día. Que todo lo bonito que viene tenga espacio para sorprenderte.'},
 {id:'music',date:'03 DIC',name:'Una melodía',emblem:'♫ ♡ ♪',message:'Cada recuerdo tiene su propia melodía. Pronto comenzará una historia que podrás recorrer a tu ritmo.'},
 {id:'finale',date:'04 DIC',name:'La última noche',emblem:'✦ ♡ ✦',message:'Mañana es tu día. A las doce de la noche empieza algo hecho con mucho cariño. Feliz casi cumpleaños, Vale.'}
].map(Object.freeze));
const calendar=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'});
const first=Date.UTC(2026,10,27);
export function dailyThemeIndex(now=Date.now()){
 const parts=Object.fromEntries(calendar.formatToParts(now).map(p=>[p.type,p.value]));
 const day=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day));
 return Math.max(0,Math.min(7,Math.round((day-first)/86400000)));
}
export function previewSeconds(index){
 return (8-Math.max(0,Math.min(7,index)))*86400-12*3600;
}
