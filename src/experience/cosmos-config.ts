// Experiencia visual aislada del motor Phaser/WebGL de VALETEAMO.
// Todas las fechas, textos, colores y placeholders se editan aquí.
export const UNLOCK_AT = '2026-12-05T00:00:00-03:00';
export const UNLOCK_TIME_ZONE = 'America/Santiago';
export type CosmosScene = 'countdown'|'gift'|'intro'|'loading'|'galaxy'|'memory'|'letter'|'suspense'|'finale';
export type CosmosPalette = 'rosado'|'aurora'|'medianoche';
export type Quality = 'auto'|'suave'|'alta';
export interface GalaxyMemory {
 id:string;
 title:string;
 eyebrow:string;
 description:string;
 letter:string;
 image:string;
 pixelPortrait:string;
 x:number;
 y:number;
 z:number;
 tint:string;
}
export const PALETTES:Record<CosmosPalette,{pink:string;purple:string;blue:string;gold:string;dark:string}>={
 rosado:{pink:'#ff3198',purple:'#c03b92',blue:'#ff8ec9',gold:'#ffd2e6',dark:'#050104'},
 aurora:{pink:'#ffd0e4',purple:'#9a7de5',blue:'#73dfed',gold:'#fff0b9',dark:'#07141d'},
 medianoche:{pink:'#ed79ae',purple:'#7664da',blue:'#6a8dc8',gold:'#e7ca97',dark:'#080916'}
};
export const DEFAULT_PALETTE:CosmosPalette='rosado';
export const MEMORIES:GalaxyMemory[]=[
 {id:'primer-destello',title:'Amor de mi Vida',eyebrow:'CONSTELACIÓN 01',
 description:'Aquí aparecerá el primer recuerdo que quieras compartir.',letter:'Aquí irá una carta escrita por ti. Puedes editarla cuando tengas las palabras definitivas.',
 image:'',pixelPortrait:'',x:-1.32,y:-.18,z:.2,tint:'#ffabd1'},
 {id:'dos-estrellas',title:'Para ti',eyebrow:'CONSTELACIÓN 02',
 description:'Un espacio reservado para una fotografía especial.',letter:'Una carta pendiente de personalizar. Este texto es solamente un marcador.',
 image:'',pixelPortrait:'',x:-.54,y:.67,z:-.58,tint:'#ffdbad'},
 {id:'pequenos-mundos',title:'Para Siempre',eyebrow:'CONSTELACIÓN 03',
 description:'Una pequeña historia que podrás completar con fotos y palabras.',letter:'Aquí podrás contar una aventura, un momento o un detalle que no quieres olvidar.',
 image:'',pixelPortrait:'',x:.5,y:.22,z:-.48,tint:'#b5a3ff'},
 {id:'melodias',title:'Nuestra historia',eyebrow:'CONSTELACIÓN 04',
 description:'Un rincón para un recuerdo relacionado con la música.',letter:'Espacio reservado para una dedicatoria musical.',
 image:'',pixelPortrait:'',x:1.45,y:-.28,z:.06,tint:'#87d9ff'},
 {id:'cartas',title:'Siempre juntos',eyebrow:'CONSTELACIÓN 05',
 description:'Una carta que se abrirá como un sobre entre las estrellas.',letter:'Querida Vale: [escribe aquí tu carta definitiva].',
 image:'',pixelPortrait:'',x:-.2,y:-.72,z:.54,tint:'#ffb9f2'},
 {id:'lo-que-viene',title:'Lo que viene',eyebrow:'CONSTELACIÓN 06',
 description:'Un espacio para imaginar y recordar momentos nuevos.',letter:'Una página en blanco para todo lo que viene.',
 image:'',pixelPortrait:'',x:1.04,y:.72,z:.5,tint:'#ffe7a2'}
];
export function secondsUntil(dateNow:number=Date.now(),target:string=UNLOCK_AT):number {
 return Math.max(0,Math.ceil((Date.parse(target)-dateNow)/1000));
}
export function countdownParts(seconds:number){
 const safe=Math.max(0,Math.floor(seconds));
 return [
  {name:'DÍAS',value:Math.floor(safe/86400)},
  {name:'HORAS',value:Math.floor(safe/3600)%24},
  {name:'MINUTOS',value:Math.floor(safe/60)%60},
  {name:'SEGUNDOS',value:safe%60}
 ];
}
export const ASSET_GUIDE = {
 photos:'public/experience/photos/[id].webp · fotografía vertical 1200×1600',
 portraits:'public/experience/portraits/[id].png · sprite pixel art PNG transparente',
 sounds:'public/experience/audio/[scene].mp3 · música original o autorizada'
} as const;
