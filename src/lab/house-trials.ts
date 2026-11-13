export type HouseTrial={
 title:string;
 description:string;
 objective:string;
 checkpoint?:'mirror';
 pose?:{x:number;floor:0|1;z:number;yaw:number;pitch:number};
 puzzleEntry?:'drawer'|'lock'|'rescue';
 events?:'arrival'|'evaded'|'wake'|'car';
 crouched?:true;
 note?:true;
 circuit?:string;
 battery?:number;
};

export const HOUSE_TRIALS={
 mirror:{
  title:'Espejo',
  description:'En el baño, frente al espejo y con la linterna encendida. Mira el reflejo y abre Emotes para probar los bailes.',
  objective:'Mira el reflejo y prueba los emotes',
  checkpoint:'mirror'
 },
 drawer:{
  title:'Cajón y pistas',
  description:'En el estudio, con la pista del pasillo ya leída. Abre el cajón del escritorio y recoge la llave con lazo.',
  objective:'Abre el cajón del escritorio',
  pose:{x:2.03,floor:0,z:3.25,yaw:.72,pitch:-.80},puzzleEntry:'drawer'
 },
 safe:{
  title:'Nota y caja fuerte',
  description:'En el dormitorio, frente a la hoja invertida y con la caja cerrada. Recoge la nota, llévala al espejo y vuelve a introducir la combinación.',
  objective:'Recoge la nota y llévala al espejo',
  pose:{x:2.78,floor:1,z:1.76,yaw:1.85,pitch:-.58},puzzleEntry:'rescue'
 },
 'mirror-note':{
  title:'Leer la nota en el espejo',
  description:'En el baño iluminado y con la nota equipada. Mira el espejo hasta revelar las cifras y revisa la hoja resuelta en la mochila.',
  objective:'Mira la nota en el espejo',
  checkpoint:'mirror',note:true,circuit:'bano'
 },
 bedroom:{
  title:'Dormitorio y rescate',
  description:'Frente al dormitorio cerrado, con la llave con lazo. Usa la llave y prueba cómo empieza el encuentro al abrir la puerta.',
  objective:'Usa la llave con lazo en el dormitorio',
  pose:{x:5.74,floor:1,z:2.4,yaw:-Math.PI/2,pitch:-.18},puzzleEntry:'lock',events:'arrival'
 },
 arrival:{
  title:'Llegada del secuestrador',
  description:'En el dormitorio, cerca del armario. Tras la llegada tendrás diez segundos para esconderte. Si te descubre, puedes repetir el encuentro.',
  objective:'Escucha la llegada y prepara el escondite',
  pose:{x:2.39,floor:1,z:3.85,yaw:-Math.PI/2,pitch:-.46},puzzleEntry:'rescue',events:'arrival'
 },
 car:{
  title:'Auto del secuestrador',
  description:'Mira desde el jardín cómo el auto gira, entra y se estaciona frente a la casa. Al terminar puedes caminar a su alrededor.',
  objective:'Acércate al auto estacionado',
  pose:{x:8.1,floor:0,z:14.05,yaw:Math.atan2(2.05,2.60),pitch:-.23},events:'car'
 },
 wardrobe:{
  title:'Levantarse y entrar al armario',
  description:'Kitty empieza agachada en el dormitorio. Pulsa E o Usar para verla levantarse, caminar al armario y cerrar las puertas desde dentro.',
  objective:'Usa el armario para esconderte',
  pose:{x:3.15,floor:1,z:3.85,yaw:-Math.PI/2,pitch:0},crouched:true,circuit:'dormitorio'
 },
 wake:{
  title:'Despertar del secuestrador',
  description:'El secuestrador duerme en el dormitorio. Sal por la puerta abierta. El mensaje de Luis lo despierta y verás cómo se incorpora antes de bajar.',
  objective:'Sal del dormitorio para activar el mensaje de Luis',
  pose:{x:3.86,floor:1,z:2.4,yaw:Math.PI/2,pitch:0},puzzleEntry:'rescue',events:'wake',circuit:'dormitorio'
 },
 battery:{
  title:'Cambio automático de pila',
  description:'La linterna empieza encendida con menos del 1 % y una pila de repuesto. Espera unos segundos y observa el cambio y la carga en la mochila.',
  objective:'Espera el cambio automático de pila',
  pose:{x:6.15,floor:0,z:8.1,yaw:Math.PI,pitch:0},battery:.84
 },
 power:{
  title:'Interruptor general',
  description:'Frente al tablero, con la corriente activa. Córtala, prueba un interruptor de habitación y vuelve al tablero para restablecerla.',
  objective:'Usa el tablero para cortar la corriente',
  pose:{x:9.4,floor:0,z:9.18,yaw:Math.PI,pitch:-.13}
 },
 piano:{
  title:'Piano del descansillo',
  description:'En la planta alta, frente al piano. Siéntate y toca la partitura con las teclas del juego o con A, S, D, F, G, H, J y K.',
  objective:'Siéntate al piano y toca la partitura',
  pose:{x:11.55,floor:1,z:3.99,yaw:Math.PI/2,pitch:-.34},circuit:'escalera'
 },
 basement:{
  title:'Trampilla y rescate',
  description:'En la cocina con la llave roja y la persecución superada. Mueve el tapete, abre la trampilla y baja por el túnel para liberar a Louis.',
  objective:'Mueve el tapete y abre la trampilla con la llave roja',
  pose:{x:9.75,floor:0,z:3.34,yaw:-Math.PI/2,pitch:-.89},puzzleEntry:'rescue',circuit:'cocina',events:'evaded'
 },
 television:{
  title:'Televisor y mando',
  description:'En la sala de estar, mirando el mando sobre la mesa. Enciende la tele y sal de la sala para comprobar que se apaga.',
  objective:'Enciende la tele con el mando',
  pose:{x:2.94,floor:0,z:8.56,yaw:-.87,pitch:-.69},circuit:'salon'
 }
} as const satisfies Record<string,HouseTrial>;

export type HouseTrialId=keyof typeof HOUSE_TRIALS;
