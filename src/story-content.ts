// Personaliza estos textos y añade fotografías cuando estén disponibles.
// Los ejemplos son marcadores; no representan recuerdos reales.
export type MemoryPhoto={src:string|null,alt:string,caption:string};
export type Chapter =
 | {id:string,kind:'memory',eyebrow:string,title:string,text:string,photos:MemoryPhoto[]}
 | {id:string,kind:'question',eyebrow:string,title:string,text:string,answers:string[]}
 | {id:string,kind:'game',eyebrow:string,title:string,text:string,level:1|2|3}
 | {id:string,kind:'letter',eyebrow:string,title:string,text:string,signature:string};

// Cambia a false cuando hayas sustituido todos los textos de muestra.
export const CONTENT_IS_SAMPLE=true;

export const STORY:Chapter[] = [
 {id:'recuerdo-1',kind:'memory',eyebrow:'CAPÍTULO 01 · UN PEQUEÑO COMIENZO',title:'Una página para nosotros',text:'Hay momentos que merecen un lugar especial. Este jardín empieza con una página reservada para uno de ellos.\n\nMira con calma: cada paso de esta aventura guarda una pequeña sorpresa.',photos:[
  {src:null,alt:'Primera fotografía pendiente',caption:'Foto y descripción por añadir'},
  {src:null,alt:'Segunda fotografía pendiente',caption:'Otro momento por añadir'}]},
 {id:'jardin',kind:'game',eyebrow:'PRIMERA AVENTURA',title:'El jardín de las luces',text:'Encuentra tres luces para abrir el siguiente recuerdo.',level:1},
 {id:'pregunta',kind:'question',eyebrow:'CAPÍTULO 02 · UNA PAUSA JUNTOS',title:'Una pregunta para ti',text:'Si pudieras guardar una cosa bonita en este jardín, ¿cuál elegirías? No hay respuestas incorrectas y también puedes seguir sin responder.',answers:['Una sorpresa','Un recuerdo bonito','Una razón para sonreír']},
 {id:'sendero',kind:'game',eyebrow:'SEGUNDA AVENTURA',title:'El sendero de las estrellas',text:'Despeja el sendero de pequeñas travesuras para seguir adelante.',level:2},
 {id:'recuerdo-2',kind:'memory',eyebrow:'CAPÍTULO 03 · OTRO MOMENTO',title:'Más páginas para llenar',text:'El jardín sigue creciendo con cada recuerdo que decidimos guardar. Aquí hay otra página esperándote.\n\nTodavía queda una última luz por encontrar.',photos:[
  {src:null,alt:'Fotografía del segundo recuerdo pendiente',caption:'Foto y descripción por añadir'},
  {src:null,alt:'Otra fotografía pendiente',caption:'Otro momento por añadir'}]},
 {id:'final-juego',kind:'game',eyebrow:'ÚLTIMA AVENTURA',title:'Una luz para el final',text:'Supera el último desafío del jardín y descubre tu carta.',level:3},
 {id:'carta',kind:'letter',eyebrow:'UNA CARTA PARA TI',title:'Feliz cumpleaños, Valentina',text:'Hoy el jardín se llena de deseos para ti. Ojalá este nuevo año traiga momentos que te hagan sonreír, aventuras bonitas y mucha calma cuando la necesites.\n\nGracias por llegar hasta el final de este pequeño paseo. Esta carta es un espacio para escribirte algo que venga directamente del corazón.',signature:'Firma por personalizar'}
];
