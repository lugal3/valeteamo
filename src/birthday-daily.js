// Visual schedule only. The public unlock remains the original timestamp.
export const DAILY_THEMES=Object.freeze([
 {id:'blossom',date:'27 NOV',name:'Pétalos y corazones',emblem:'✿ ♡ ✿',message:'Hay algo de ti en cada cosa bonita que imagino.'},
 {id:'constellation',date:'28 NOV',name:'Constelación',emblem:'✧ ⋆ ✦',message:'Lo que ves es solo una pequeña parte.'},
 {id:'letter',date:'29 NOV',name:'Carta secreta',emblem:'♡ ✉ ♡',message:'No se aceptan sobornos para adelantar el contador.'},
 {id:'garden',date:'30 NOV',name:'Jardín de recuerdos',emblem:'❀ ✿ ❀',message:'Qué suerte tener todavía tantas primeras veces por compartir.'},
 {id:'pixel',date:'01 DIC',name:'Aventura pixel',emblem:'♥ ✦ ♥',message:'Paciencia, señorita cumpleañera.'},
 {id:'aurora',date:'02 DIC',name:'Aurora de colores',emblem:'✧ ◇ ✧',message:'Preparando algo tan bonito como tú. Bueno, intentando.'},
 {id:'music',date:'03 DIC',name:'Una melodía',emblem:'♫ ♡ ♪',message:'Si las estrellas pudieran hablar, probablemente me delatarían.'},
 {id:'finale',date:'04 DIC',name:'La última noche',emblem:'✦ ♡ ✦',message:'Cuando el reloj marque cero, este universo será un poquito más tuyo.'}
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
