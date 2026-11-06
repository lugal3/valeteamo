export const CONFIG = { hp: 6, bombs: 5, keys: 1, coins: 12, speed: 155, damage: 1, range: 380, fireMs: 260, invulnerabilityMs: 1300, activeRooms: 1, bombDamage: 22 };
// Ruta lineal en zigzag. Los índices son estables para los sistemas de objetos.
export const ROOMS = [
 {name:'El jardín despierta',x:0,y:0,kind:'start',links:{right:1}},
 {name:'Sendero de las travesuras',x:1,y:0,kind:'fight',links:{left:0,down:3}},
 {name:'Nubes de azúcar',x:0,y:1,kind:'fight',links:{right:3,down:4}},
 {name:'Un pequeño tesoro',x:1,y:1,kind:'treasure',links:{up:1,left:2}},
 {name:'La boutique de My Melody',x:0,y:2,kind:'shop',links:{up:2,right:5}},
 {name:'El eclipse de Kuromi',x:1,y:2,kind:'boss',links:{left:4}}
] as const;
export const ITEMS = {brim:{name:'Brimstone',description:'Mantén el disparo: carga un rayo de amor que atraviesa enemigos.'},mantle:{name:'Holy Mantle',description:'Una burbuja bloquea el primer golpe de cada sala.'},head:{name:'Kitty Cat’s head',description:'Activo: invoca 4 estrellitas perseguidoras. Recarga al limpiar una sala.'}};
