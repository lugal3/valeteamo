// Personaliza estos textos y añade fotografías cuando estén disponibles.
// Los ejemplos son marcadores; no representan recuerdos reales.
export type MemoryPhoto={src:string|null,alt:string,caption:string};
export type Chapter =
 | {id:string,kind:'memory',eyebrow:string,title:string,text:string,photos:MemoryPhoto[]}
 | {id:string,kind:'question',eyebrow:string,title:string,text:string,answers:string[]}
 | {id:string,kind:'game',eyebrow:string,title:string,text:string,level:1|2|3}
 | {id:string,kind:'letter',eyebrow:string,title:string,text:string,signature:string};

export const STORY:Chapter[] = [
 {id:'recuerdo-1',kind:'memory',eyebrow:'CAPÍTULO 01 · UN PEQUEÑO COMIENZO',title:'Una página para nosotros',text:'Este espacio espera tu primer recuerdo. Aquí podrás escribir unas palabras para Vale y añadir las fotos que quieras compartir.',photos:[
  {src:null,alt:'Primera fotografía pendiente',caption:'Foto y descripción por añadir'},
  {src:null,alt:'Segunda fotografía pendiente',caption:'Otro momento por añadir'}]},
 {id:'jardin',kind:'game',eyebrow:'PRIMERA AVENTURA',title:'El jardín de las luces',text:'Encuentra tres luces para abrir el siguiente recuerdo.',level:1},
 {id:'pregunta',kind:'question',eyebrow:'CAPÍTULO 02 · UNA PAUSA JUNTOS',title:'Una pregunta para ti',text:'Aquí irá una pregunta personal. Puedes cambiar las opciones o continuar sin responder.',answers:['Primera respuesta por personalizar','Segunda respuesta por personalizar','Tercera respuesta por personalizar']},
 {id:'sendero',kind:'game',eyebrow:'SEGUNDA AVENTURA',title:'El sendero de las estrellas',text:'Despeja el sendero de pequeñas travesuras para seguir adelante.',level:2},
 {id:'recuerdo-2',kind:'memory',eyebrow:'CAPÍTULO 03 · OTRO MOMENTO',title:'Más páginas para llenar',text:'Otro espacio para una fotografía, una fecha o una historia que quieras contarle a Vale.',photos:[
  {src:null,alt:'Fotografía del segundo recuerdo pendiente',caption:'Foto y descripción por añadir'},
  {src:null,alt:'Otra fotografía pendiente',caption:'Otro momento por añadir'}]},
 {id:'final-juego',kind:'game',eyebrow:'ÚLTIMA AVENTURA',title:'Una luz para el final',text:'Supera el último desafío del jardín y descubre tu carta.',level:3},
 {id:'carta',kind:'letter',eyebrow:'UNA CARTA PARA TI',title:'Feliz cumpleaños, Valentina',text:'Aquí irá tu carta para Vale. Sustituye este texto por tus propias palabras cuando tengas listo el mensaje.',signature:'Firma por personalizar'}
];
