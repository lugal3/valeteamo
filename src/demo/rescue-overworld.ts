import Phaser from 'phaser';
import {ISO,toScreen,type IsoPoint} from '../isometric';

// No crea Phaser.Game ni una cámara: es el dibujo de terreno extendido para
// IsoAdventure. La escena original sigue siendo la dueña del input y sprites.
export const RESCUE_ROUTE={
 maxU:81,bridgeStart:12,bridgeEnd:20,gardenStart:21,forestStart:40,
 neighborhoodStart:55,houseStart:66
} as const;
export type RouteArea='sendero'|'puente'|'jardin'|'bosque'|'vecindario'|'casa';
export function rescueArea(u:number):RouteArea{
 return u<12?'sendero':u<20?'puente':u<40?'jardin':
  u<55?'bosque':u<66?'vecindario':'casa';
}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function routeCenter(u:number){
 if(u>=11&&u<21)return 4.45;
 return 4.45+Math.sin(u*.18)*.55+Math.sin(u*.47)*.12;
}
export function routeLimits(u:number):{min:number;max:number}{
 const center=routeCenter(u);
 if(u>=12&&u<20)return {min:3.05,max:5.85};
 if(u<11)return {min:center-2.4,max:center+2.4};
 if(u<23)return {min:center-3.25,max:center+3.25};
 if(u<40)return {min:center-4.5,max:center+4.5};
 if(u<55)return {min:center-3.2,max:center+3.25};
 if(u<66)return {min:center-3.5,max:center+3.55};
 return {min:center-3.3,max:center+3.4};
}
export function constrainRescue(p:IsoPoint):IsoPoint{
 const u=clamp(p.u,.35,RESCUE_ROUTE.maxU-.55),limits=routeLimits(u);
 return {u,v:clamp(p.v,limits.min+.2,limits.max-.2)};
}
export const STORY_POSITIONS={
 intro:{u:1.3,v:4.5},defend:{u:22.5,v:4.45},
 'talk-louis':{u:29.5,v:4.2},'talk-luis':{u:34.6,v:4.4},
 'walk-together':{u:38.0,v:4.2},disappearance:{u:44,v:4.5},
 ribbon:{u:48,v:4.9},petals:{u:53,v:3.8},wheel:{u:60.5,v:4.9},
 door:{u:73.2,v:4.4},window:{u:77.4,v:5.6},house:{u:77.4,v:5.6}
} satisfies Record<string,IsoPoint>;
export function storyArrivalPoint(stage:keyof typeof STORY_POSITIONS):IsoPoint{
 const p=STORY_POSITIONS[stage];
 return stage==='intro'?{...p}:{u:Math.max(.6,p.u-2),v:p.v};
}
export function darknessAt(u:number,stage:string):number{
 const crossing=clamp((u-24)/53,0,1);
 const stageFloor=stage==='disappearance'?.46:
  ['ribbon','petals','wheel','door','window','house'].includes(stage)?.55:0;
 return clamp(Math.max(crossing*.72,stageFloor),0,.73);
}

export type RescueOverworld={
 area:(u:number)=>RouteArea;
 update:(elapsed:number,night:number)=>void;
 water:Phaser.GameObjects.Graphics;
 tiles:number;
};

function poly(g:Phaser.GameObjects.Graphics,color:number,vertices:Array<[number,number]>,alpha=1){
 g.fillStyle(color,alpha);
 g.fillPoints(vertices.map(([x,y])=>new Phaser.Geom.Point(x,y)),true);
}
function diamond(g:Phaser.GameObjects.Graphics,p:IsoPoint,color:number,alpha=1){
 const xy=toScreen(p),w=ISO.tileW/2,h=ISO.tileH/2;
 poly(g,color,[[xy.x,xy.y-h],[xy.x+w,xy.y],[xy.x,xy.y+h],[xy.x-w,xy.y]],alpha);
}
function drawLamp(scene:Phaser.Scene,u:number,v:number){
 const p=toScreen({u,v}),g=scene.add.graphics().setDepth(p.y);
 g.fillStyle(0x6a6274).fillRect(p.x-3,p.y-85,6,85);
 g.fillStyle(0x4b455b).fillRect(p.x-10,p.y-90,20,6);
 g.fillStyle(0xffdfab).fillRect(p.x-8,p.y-108,16,18);
 g.fillStyle(0xfaf2c8).fillRect(p.x-5,p.y-106,9,12);
 g.lineStyle(2,0x9f8b91).strokeRect(p.x-8,p.y-108,16,18);
 return g;
}
function drawBench(scene:Phaser.Scene,u:number,v:number){
 const p=toScreen({u,v}),g=scene.add.graphics().setDepth(p.y);
 g.fillStyle(0x6b5c68,.2).fillEllipse(p.x,p.y,40,9);
 g.fillStyle(0x7a5c58).fillRect(p.x-19,p.y-15,38,6);
 g.fillStyle(0x9b7470).fillRect(p.x-19,p.y-24,38,6);
 g.fillStyle(0x705969).fillRect(p.x-14,p.y-9,4,9).fillRect(p.x+11,p.y-9,4,9);
 return g;
}
function drawSign(scene:Phaser.Scene,u:number,v:number,title:string){
 const p=toScreen({u,v}),g=scene.add.graphics().setDepth(p.y);
 g.fillStyle(0x8c6b5e).fillRect(p.x-2,p.y-47,4,46);
 g.fillStyle(0xf5e2c7).fillRect(p.x-29,p.y-53,58,26);
 g.lineStyle(2,0xb88a91).strokeRect(p.x-29,p.y-53,58,26);
 scene.add.text(p.x,p.y-40,title,{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',
  color:'#755c70',align:'center'}).setOrigin(.5).setDepth(p.y+1);
 return g;
}
function drawHouse(scene:Phaser.Scene,u:number,v:number,main:boolean){
 const foot=toScreen({u,v});
 const g=scene.add.graphics().setDepth(foot.y-5);
 const w=main?214:112,h=main?149:90,depth=main?110:58,roof=main?49:30;
 const x=foot.x,y=foot.y;
 const centerX=x-w*.06;
 // Massing roughly matches house-layout.js: 14x12m, two 3.15m storeys,
 // study/living on one wing, kitchen/bath on the other, rooms upstairs.
 poly(g,main?0xdcc9bf:0xe7ccca,[
  [centerX-w*.56,y-h],[centerX,y-h+depth*.31],[centerX,y+depth*.31],
  [centerX-w*.56,y]]);
 poly(g,main?0xb5a0b7:0xb1c4b4,[
  [centerX,y-h+depth*.31],[centerX+w*.51,y-h-5],
  [centerX+w*.51,y-5],[centerX,y+depth*.31]]);
 // visible floor band accurately indicates two occupied levels
 g.lineStyle(main?5:3,main?0xa58c9a:0x9b9b90,.96);
 g.lineBetween(centerX-w*.56,y-h*.46,centerX,y-h*.46+depth*.31);
 g.lineBetween(centerX,y-h*.46+depth*.31,centerX+w*.51,y-h*.46-5);
 // Two independent roof faces, with a strong gable and warm trim.
 poly(g,main?0x7e667d:0x8b839b,[
  [centerX-w*.63,y-h],[centerX-w*.03,y-h-roof],[centerX+w*.59,y-h-12],
  [centerX,y-h+depth*.31+7]]);
 poly(g,main?0x69556e:0x77718b,[
  [centerX-w*.63,y-h],[centerX-w*.07,y-h-roof-7],[centerX,y-h+depth*.31+7]]);
 g.lineStyle(4,0xd6b5ad).lineBetween(centerX-w*.63,y-h,centerX,y-h+depth*.31+7);
 // Projected windows: room silhouettes across ground and upper storeys.
 const windows=main?[
  [-.42,-.25],[-.2,.0],[.20,-.25],[.38,-.05],
  [-.42,-.64],[-.2,-.48],[.20,-.68],[.38,-.47]
 ]:[[-.36,-.27],[.28,-.27],[-.36,-.68],[.28,-.68]];
 for(const [u1,v1] of windows){
  const leftSide=u1<0;
  const wx=leftSide?centerX+u1*w:centerX+u1*w;
  const wy=y+v1*h+(leftSide?depth*.15:depth*.10);
  const ww=main?18:12,hh=main?21:16;
  g.fillStyle(0x6e7089).fillRect(wx,wy,ww,hh);
  g.fillStyle(0xa6cbd0).fillRect(wx+2,wy+2,ww-4,hh-4);
  g.fillStyle(0xe4f3e2).fillRect(wx+ww/2-1,wy,2,hh);
  g.fillStyle(0xf2e9ce).fillRect(wx,wy+hh/2,ww,2);
  g.fillStyle(0xdba5bc).fillRect(wx-3,wy+hh,ww+6,3);
 }
 // Main entrance on the near facade; separate from the side window entry.
 if(main){
  g.fillStyle(0x74586e).fillRect(centerX-47,y-31,28,47);
  g.fillStyle(0x4b4358).fillRect(centerX-42,y-28,19,44);
  g.fillStyle(0xe2b981).fillCircle(centerX-28,y-8,2.5);
  g.fillStyle(0xc9adb5).fillRect(centerX-56,y+15,45,7);
  g.fillStyle(0xaab4a7).fillRect(centerX+55,y-50,22,27);
  g.fillStyle(0xffdfae,.48).fillRect(centerX+58,y-47,16,20);
  // A plausible exterior second-floor balcony rather than a flat cube.
  g.fillStyle(0xc2a3ae).fillRect(centerX+44,y-h*.55,66,8);
  for(let k=0;k<5;k++)g.fillStyle(0x786b75).fillRect(centerX+48+k*12,y-h*.55-21,4,20);
  drawSign(scene,u-.5,v-1.2,'14 · ♡');
 }else{
  g.fillStyle(0x796579).fillRect(centerX-19,y-28,18,30);
  g.fillStyle(0xd3af9b).fillRect(centerX-21,y,23,4);
 }
 return g;
}
function drawBridge(scene:Phaser.Scene){
 const deck=scene.add.graphics().setDepth(1);
 const rail=scene.add.graphics().setDepth(1700);
 for(let u=12;u<20;u++){
  for(let v=3;v<=6;v++){
   diamond(deck,{u,v},(u+v)%2?0xb58b71:0xc7a18a);
   const p=toScreen({u,v});
   deck.lineStyle(1,0x7e6770,.22).lineBetween(p.x-25,p.y,p.x+25,p.y);
  }
  const both=[{u,v:2.6},{u,v:6.5}];
  for(const b of both){
   const p=toScreen(b);
   // posts/rope are one batch to preserve lightweight mobile rendering
   rail.fillStyle(0x755f5f).fillRect(p.x-3,p.y-25,6,28);
   rail.fillStyle(0xe1c7af).fillRect(p.x-4,p.y-29,8,5);
  }
 }
 // Rails shown above the deck without hiding Kitty.
 return [deck,rail];
}
export function buildRescueOverworld(scene:Phaser.Scene,ground:Phaser.GameObjects.Graphics,
 ornaments:{flower:(u:number,v:number)=>void;shrub:(u:number,v:number)=>void;
  tree:(u:number,v:number)=>void;mushroom:(u:number,v:number)=>void}):RescueOverworld{
 const g=ground;g.clear();
 // A generous solid world-coloured backdrop, never a viewport-sized rectangle.
 g.fillStyle(0xdeddd0).fillRect(-1900,-1200,6600,4400);
 let tiles=0;
 for(let u=0;u<=81;u++)for(let v=-6;v<=15;v++){
  const limits=routeLimits(u);
  const variability=((u*7+v*13)%9===0?-.55:0)+((u*11+v*3)%11===0?.38:0);
  const inLand=v>=Math.floor(limits.min-1.5+variability)&&v<=Math.ceil(limits.max+1.5+variability);
  const bridge=u>=12&&u<20;
  if(bridge){
   if(v>=-4&&v<=13)diamond(g,{u,v},((u*3+v*5)%4===0)?0x82bfcc:0x72afbf);
   if(v>=3&&v<=6)diamond(g,{u,v},(u+v)%2?0xb58b71:0xc7a18a);
   continue;
  }
  if(!inLand)continue;
  tiles++;
  const center=routeCenter(u),d=Math.abs(v-center),area=rescueArea(u);
  let color=(u+v)%2?0xaec4a2:0xc5d3b2; // exact existing Corazones level-2 palette
  if(d<1.15)color=(u+v)%3?0xe9dcbf:0xf0e4ca;
  if(area==='bosque')color=d<1.2?0xc8b7aa:(u+v)%2?0x8fac98:0xaac3a3;
  if(area==='vecindario'||area==='casa'){
   if(v>7.0)color=(u+v)%2?0x8c9399:0x999da2;
   else if(d<2.4)color=(u+v)%2?0xdbd1cb:0xe8dfd5;
   else color=(u+v)%2?0x98b9a2:0xacc2ae;
  }
  diamond(g,{u,v},color);
  const p=toScreen({u,v});
  if((u*7+v*13)%17===0&&area==='jardin'){
   g.fillStyle(0xeab6c1,.68).fillRect(p.x+6,p.y+3,4,3);
  }
  if((area==='vecindario'||area==='casa')&&v>=7&&u%7===0){
   g.fillStyle(0xe8dfbd,.55).fillRect(p.x-11,p.y-2,22,3);
  }
 }
 // Borders in irregular scallops, not a visible rectangular stage.
 for(let u=1;u<81;u+=2){
  const limits=routeLimits(u);
  for(const v of [limits.min-1,limits.max+1]){
   const p=toScreen({u,v});g.fillStyle(0x8ba58a,.32).fillEllipse(p.x,p.y,48,11);
  }
 }
 const wave=scene.add.graphics().setDepth(.5);
 drawBridge(scene);
 // Same existing decorative pixel-art helpers from IsoAdventure.
 for(let u=2;u<80;u+=3){
  const b=routeLimits(u),side=((u*7)%3===0?b.min-.3:b.max+.1);
  if(u<12||u>=20&&u<55){
   ornaments.flower(u,side);
   if(u%6===2)ornaments.shrub(u+.45,side+.4);
  }
  if(u>=21&&u<40&&u%5===2)ornaments.mushroom(u+1,side);
  if(u>=24&&u<52&&u%8===2)ornaments.tree(u,side+((u%2)?-.7:.7));
 }
 drawBench(scene,26,8.1);drawBench(scene,37,1.9);
 drawSign(scene,9,1.8,'RÍO ♡');drawSign(scene,58,1.6,'VILLA');
 for(const u of [57,63,69,76])drawLamp(scene,u,1.8);
 for(const [u,v] of [[57,10.2],[64,10.8],[81,9.7]])drawHouse(scene,u,v,false);
 drawHouse(scene,75.5,9.1,true);
 // Hanging fireflies and flowing water are redrawn in this same Phaser scene.
 const glow=scene.add.graphics().setDepth(1600);
 const update=(elapsed:number,night:number)=>{
  wave.clear();glow.clear();
  const t=elapsed/1000;
  for(let u=12;u<20;u++)for(let v=-3;v<=12;v++){
   if(v>=3&&v<=6)continue;
   const p=toScreen({u,v}),waveX=p.x+Math.sin(t*1.7+u*.62+v)*9;
   wave.lineStyle(1,0xdaf3e9,.32+Math.sin(t*2+v+u)*.12);
   wave.lineBetween(waveX-9,p.y+4,waveX+5,p.y+4);
   if((u+v)%4===0)wave.fillStyle(0xf3ffff,.22).fillRect(waveX+4,p.y-3,3,2);
  }
  if(night>.15){
   for(let i=0;i<30;i++){
    const u=28+i*1.7,v=routeLimits(u).max+(i%3)*.6,p=toScreen({u,v});
    const f=Math.sin(t*2+i*.91),floatY=Math.cos(t*.95+i*.62)*8;
    glow.fillStyle(i%4?0xf6e4b3:0xffbecd,Math.min(.68,night*.7)*(.45+.55*f*f));
    glow.fillRect(p.x+Math.sin(t*.45+i)*9,p.y-20+floatY,3,3);
   }
  }
 };
 update(0,0);
 return {area:rescueArea,update,water:wave,tiles};
}
