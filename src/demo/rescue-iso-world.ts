import type Phaser from 'phaser';

// El rescate usa el mismo lenguaje visual que el arcade 2D Corazones:
// baldosas romboidales 82×40, sprites pixelados, profundidad por los pies,
// flores y árboles dibujados en Phaser. No modifica IsoAdventure ni sus assets.
const TILE_W=82,TILE_H=40;
const diamond=(x:number,y:number)=>[
 {x,y:y-TILE_H/2},{x:x+TILE_W/2,y},
 {x,y:y+TILE_H/2},{x:x-TILE_W/2,y}
];

function cherry(scene:Phaser.Scene,x:number,y:number,variant:number){
 const g=scene.add.graphics().setDepth(y);
 const pink=variant%2===0?0xe8a8bb:0xe7b1c6;
 g.fillStyle(0x52654e,.16).fillEllipse(x,y,48,12);
 g.fillStyle(0x8b6b61).fillRect(x-5,y-49,10,49);
 g.fillStyle(0x654d58).fillRect(x-5,y-16,4,16);
 g.fillStyle(0xa27675).fillRect(x+1,y-43,3,28);
 // Copas escalonadas deliberadamente pixeladas, sin gradientes borrosos.
 for(const [dx,dy,w,h,color] of [
  [-26,-94,46,36,pink],[-12,-112,47,36,0xf7c7d5],
  [13,-87,36,39,0xf1b9cf],[-38,-78,30,22,0xf6c7d7],
  [7,-109,18,17,0xffdfdf],[-23,-112,16,13,0xfde5e6]
 ] as const){g.fillStyle(color).fillRect(x+dx,y+dy,w,h);}
 for(let j=0;j<6;j++){g.fillStyle(j%2?0xfff0eb:0xf2d0de).fillRect(x-27+(j*19)%61,y-103+(j*13)%45,4,4);}
}

function bush(scene:Phaser.Scene,x:number,y:number,n:number){
 const g=scene.add.graphics().setDepth(y);
 g.fillStyle(0x4c6850,.16).fillEllipse(x,y,36,9);
 g.fillStyle(n%2?0x729c77:0x80ad83).fillRect(x-14,y-14,28,14);
 g.fillStyle(0xa1c59c).fillRect(x-10,y-20,19,11);
 g.fillStyle(0x587e61).fillRect(x+5,y-11,10,8);
 g.fillStyle(0xffd8e0).fillRect(x-4,y-22,5,5);
 g.fillStyle(0xf7d8a9).fillRect(x-2,y-20,2,2);
}

function cottage(scene:Phaser.Scene){
 // Casa en perspectiva 2.5D, no fachada lateral: se distinguen los dos
 // muros, tejado en rombo, puerta frontal y ventana por donde inicia el 3D.
 const g=scene.add.graphics().setDepth(235);
 const polygon=(color:number,points:{x:number,y:number}[])=>{
  g.fillStyle(color);g.fillPoints(points,true);
 };
 polygon(0xb6a4ae,[{x:2428,y:248},{x:2602,y:307},{x:2602,y:447},{x:2428,y:385}]);
 polygon(0x8a7594,[{x:2602,y:307},{x:2793,y:240},{x:2793,y:379},{x:2602,y:447}]);
 polygon(0x624f72,[{x:2398,y:246},{x:2591,y:171},{x:2822,y:250},{x:2602,y:327}]);
 polygon(0x856a90,[{x:2417,y:249},{x:2591,y:188},{x:2806,y:251},{x:2602,y:310}]);
 g.lineStyle(4,0xd7b5c9,.85);
 g.strokePoints([{x:2398,y:246},{x:2591,y:171},{x:2822,y:250},{x:2602,y:327},{x:2398,y:246}],false);
 // Tejas y detalles geométricos.
 for(let i=0;i<7;i++){g.lineStyle(2,0xc59dbe,.38);g.lineBetween(2447+i*29,239+i*1.1,2627+i*25,301-i*6);}
 // Puerta: lateral izquierdo. Escalerita y aldaba con corazón.
 polygon(0x4c375d,[{x:2470,y:323},{x:2528,y:344},{x:2528,y:419},{x:2470,y:399}]);
 g.lineStyle(3,0xffdfce).strokePoints([{x:2470,y:323},{x:2528,y:344},{x:2528,y:419},{x:2470,y:399}],true);
 g.fillStyle(0xf2c585).fillCircle(2514,381,4);
 polygon(0xe7cdb7,[{x:2455,y:406},{x:2538,y:431},{x:2560,y:420},{x:2475,y:396}]);
 // Ventana azul con marco rosado, cara derecha.
 polygon(0x3d5b7b,[{x:2659,y:319},{x:2745,y:288},{x:2745,y:341},{x:2659,y:372}]);
 polygon(0x92c3d7,[{x:2666,y:326},{x:2737,y:301},{x:2737,y:335},{x:2666,y:360}]);
 g.lineStyle(4,0xffd6de).strokePoints([{x:2659,y:319},{x:2745,y:288},{x:2745,y:341},{x:2659,y:372}],true);
 g.lineStyle(2,0xffffff,.85).lineBetween(2701,314,2701,352);
 polygon(0xf9d8e9,[{x:2745,y:288},{x:2767,y:303},{x:2767,y:351},{x:2745,y:341}]);
 g.fillStyle(0xffe8e6).fillRect(2761,322,3,6);
 scene.add.text(2502,302,'PUERTA',{fontFamily:'monospace',fontSize:'13px',color:'#fff5e9',stroke:'#49334e',strokeThickness:4}).setOrigin(.5).setDepth(239);
 scene.add.text(2705,271,'VENTANA',{fontFamily:'monospace',fontSize:'13px',color:'#fff5e9',stroke:'#49334e',strokeThickness:4}).setOrigin(.5).setDepth(239);
}

// El mundo es más largo que la arena de Corazones para permitir la historia,
// pero el tileado, las proporciones y el sombreado siguen su estética.
export function drawRescueIsoWorld(scene:Phaser.Scene,width=2840){
 const floor=scene.add.graphics().setDepth(0);
 floor.fillStyle(0xf1e5d2).fillRect(0,0,width,540);
 floor.fillStyle(0xdfe4cf).fillRect(0,185,width,340);
 floor.fillStyle(0xd4d9c3,.7).fillRect(0,450,width,90);
 // Filas desplazadas de medios rombos: la misma proyección que isometric.ts.
 for(let row=0;row<18;row++){
  const y=184+row*(TILE_H/2);
  for(let col=-1;col<Math.ceil(width/TILE_W)+2;col++){
   const x=col*TILE_W+(row%2)*TILE_W/2;
   const path=Math.abs(y-345)<73;
   const color=path?((row+col)%2?0xe9d9b9:0xf2e5c9):((row+col)%2?0xb8cda1:0xc9d9b0);
   floor.fillStyle(color);floor.fillPoints(diamond(x,y),true);
   floor.lineStyle(1,0x90aa89,.22);floor.strokePoints(diamond(x,y),true);
   if((row*7+col*11)%23===0){floor.fillStyle(0xfff3d8,.85);floor.fillRect(x+8,y+1,4,3);}
   if((row*13+col*5)%27===0){floor.fillStyle(0xf1b6ca,.85);floor.fillRect(x-9,y-2,5,4);}
  }
 }
 for(let i=0;i<34;i++){
  const x=58+i*79,y=i%2?465:222;
  if(x>2310&&x<2840)continue;
  if(i%3===0)cherry(scene,x,y,i);
  else bush(scene,x,y,i);
 }
 // Flores pequeñas al borde del sendero, con el mismo tamaño que Corazones.
 for(let i=0;i<65;i++){
  const x=35+i*43,y=i%2?267:420;
  if(x>2390)continue;
  const flower=scene.add.graphics().setDepth(y);
  flower.fillStyle(0x678d65).fillRect(x-1,y-10,2,11);
  flower.fillStyle(i%3?0xe8a5b6:0xf5d18b).fillRect(x-5,y-15,10,4);
  flower.fillStyle(0xfce9ef).fillRect(x-2,y-18,4,10);
  flower.fillStyle(0xffdc7e).fillRect(x-1,y-14,3,3);
 }
 cottage(scene);
 const moon=scene.add.circle(2340,103,30,0xfaf4e8).setDepth(1).setAlpha(0);
 return moon;
}
