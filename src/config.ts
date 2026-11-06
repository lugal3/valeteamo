export const CONFIG = {
  hp: 6, bombs: 5, keys: 1, coins: 12,
  speed: 114, damage: 1, range: 290, fireMs: 280, shotSpeed: 245,
  invulnerabilityMs: 1400, activeRooms: 1,
  roomArea: 92000, wallMargin: 18, // 38% of the previous 786×308 playable area.
  playerRadius: 10, playerScale: 1.65,
  bombDamage: 22, bombRadius: 92, bombFuseMs: 1500,
  beamChargeMs: 850, beamDamage: 9, beamWidth: 16,
  bossHp: 85, enemyBulletSpeed: 82, enemyAttackMs: 2700,
  eclipseRadius: 31, eclipseWarningMs: 1100,
};
export const ROOMS = [
 {name:'El jardín despierta',x:0,y:0,kind:'start',links:{right:1}},
 {name:'Sendero de las travesuras',x:1,y:0,kind:'fight',links:{left:0,down:3}},
 {name:'Nubes de azúcar',x:0,y:1,kind:'fight',links:{right:3,down:4}},
 {name:'Un pequeño tesoro',x:1,y:1,kind:'treasure',links:{up:1,left:2}},
 {name:'La boutique de My Melody',x:0,y:2,kind:'shop',links:{up:2,right:5}},
 {name:'El eclipse de Kuromi',x:1,y:2,kind:'boss',links:{left:4}}
] as const;
export const ITEMS = {
 brim:{name:'Brimstone',description:'Mantén la dirección: carga un rayo de amor que atraviesa enemigos.'},
 mantle:{name:'Holy Mantle',description:'Una burbuja bloquea el primer golpe de cada sala.'},
 head:{name:'Kitty Cat’s head',description:'Activo: cuatro estrellas perseguidoras. Se recarga al limpiar una sala.'}
};
