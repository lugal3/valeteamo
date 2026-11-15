import Phaser from 'phaser';
import {ISO,toScreen,type IsoPoint} from '../isometric';

// Cuatro mapas cargados POR SEPARADO dentro de IsoAdventure. Ningún mapa crea
// Phaser.Game, cámara, controles ni sprites: todo sigue siendo 2D Corazones.
export type RescueMapId='morning_garden'|'afternoon_meeting'|'dusk_search'|'night_neighborhood';
export type RouteArea='sendero'|'puente'|'jardin'|'bosque'|'vecindario'|'casa';
type Portal={u:number;v:number;to:RescueMapId;unlock:string};
type MapDefinition={id:RescueMapId;label:string;time:string;minU:number;maxU:number;
 spawn:IsoPoint;exit?:Portal};
export const RESCUE_SCENES:Record<RescueMapId,MapDefinition>={
 morning_garden:{id:'morning_garden',label:'Río de los pétalos',time:'Mañana luminosa',
  minU:0,maxU:22,spawn:{u:1.3,v:4.5},
  exit:{u:20.7,v:4.5,to:'afternoon_meeting',unlock:'intro'}},
 afternoon_meeting:{id:'afternoon_meeting',label:'Jardín de cerezos',time:'Tarde dorada',
  minU:23,maxU:45,spawn:{u:23.75,v:4.45},
  exit:{u:43.9,v:4.5,to:'dusk_search',unlock:'ribbon'}},
 dusk_search:{id:'dusk_search',label:'Bosque de las pistas',time:'Atardecer violeta',
  minU:46,maxU:64,spawn:{u:46.8,v:4.65},
  exit:{u:62.65,v:4.5,to:'night_neighborhood',unlock:'door'}},
 night_neighborhood:{id:'night_neighborhood',label:'Villa de los faroles',time:'Noche cerrada',
  minU:65,maxU:82,spawn:{u:65.7,v:4.45}}
};
export const RESCUE_ROUTE={maxU:82,bridgeStart:10,bridgeEnd:16,
 gardenStart:23,forestStart:46,neighborhoodStart:65,houseStart:72} as const;
export const RESCUE_MAP_ORDER:RescueMapId[]=['morning_garden','afternoon_meeting','dusk_search','night_neighborhood'];
export const STORY_POSITIONS={
 intro:{u:1.3,v:4.5},defend:{u:24.2,v:4.5},
 'talk-louis':{u:29.4,v:4.1},'talk-luis':{u:34.6,v:4.4},
 'walk-together':{u:38.4,v:4.5},disappearance:{u:40.8,v:4.5},
 ribbon:{u:48,v:4.9},petals:{u:53,v:3.8},wheel:{u:59.5,v:4.9},
 door:{u:77.7,v:8.9},window:{u:76.4,v:9.1},house:{u:76.4,v:9.1}
} satisfies Record<string,IsoPoint>;
export function mapForStage(stage:string):RescueMapId{
 if(['defend','talk-louis','talk-luis','walk-together','disappearance'].includes(stage))return 'afternoon_meeting';
 if(['ribbon','petals','wheel'].includes(stage))return 'dusk_search';
 if(['door','window','house'].includes(stage))return 'night_neighborhood';
 return 'morning_garden';
}
export function sceneForPosition(u:number):RescueMapId{
 return u<23?'morning_garden':u<46?'afternoon_meeting':u<65?'dusk_search':'night_neighborhood';
}
export function exitReady(map:RescueMapId,stage:string):boolean{
 const goal=RESCUE_SCENES[map].exit;
 if(!goal)return false;
 return map==='morning_garden'?stage==='intro':
  map==='afternoon_meeting'?['ribbon','petals','wheel','door','window','house'].includes(stage):
  ['door','window','house'].includes(stage);
}
export function storyArrivalPoint(stage:keyof typeof STORY_POSITIONS):IsoPoint{
 const p=STORY_POSITIONS[stage];
 return stage==='intro'?{...p}:RESCUE_SCENES[mapForStage(stage)].spawn;
}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function rescueArea(u:number):RouteArea{
 if(u<10)return 'sendero';
 if(u<16)return 'puente';
 if(u<46)return 'jardin';
 if(u<65)return 'bosque';
 if(u<72)return 'vecindario';
 return 'casa';
}
export function routeCenter(u:number){
 const map=sceneForPosition(u);
 if(map==='morning_garden'){
  if(u>=10&&u<16)return 4.45;
  return 4.5+Math.sin(u*.31)*.56;
 }
 if(map==='afternoon_meeting')return 4.4+Math.sin((u-23)*.33)*1.02+Math.cos((u-23)*.67)*.20;
 if(map==='dusk_search')return 4.6+Math.sin((u-46)*.50)*.82;
 return u>71?6.05+Math.sin(u*.25)*.3:4.45+Math.sin(u*.4)*.35;
}
export function routeLimits(u:number):{min:number;max:number}{
 const center=routeCenter(u),map=sceneForPosition(u);
 if(map==='morning_garden'){
  if(u>=10&&u<16)return {min:3.05,max:5.85};
  return {min:center-(u>16?3.8:2.9),max:center+(u>16?3.8:2.9)};
 }
 if(map==='afternoon_meeting'){
  // Prado amplio para el combate, dos sendas curvadas y claro de la aparición.
  const broad=u>=27&&u<=37?5.0:3.55;
  return {min:center-broad,max:center+broad};
 }
 if(map==='dusk_search'){
  const width=u>=51&&u<=57?4.2:3.1;
  return {min:center-width,max:center+width};
 }
 return {min:center-(u>=72?3.8:3.35),max:center+(u>=72?3.8:3.35)};
}
export function constrainRescue(p:IsoPoint,map:RescueMapId=sceneForPosition(p.u)):IsoPoint{
 const def=RESCUE_SCENES[map],u=clamp(p.u,def.minU+.35,def.maxU-.5),limit=routeLimits(u);
 return {u,v:clamp(p.v,limit.min+.20,limit.max-.20)};
}
export function darknessAt(u:number,stage:string,map:RescueMapId=sceneForPosition(u)):number{
 if(map==='morning_garden')return 0;
 if(map==='afternoon_meeting')return Math.max(stage==='disappearance'?.30:.09,
  .09+clamp((u-23)/22,0,1)*.18);
 if(map==='dusk_search')return .38+clamp((u-46)/18,0,1)*.15;
 return .68+clamp((u-65)/17,0,1)*.05;
}
export type RescueOverworld={map:RescueMapId;area:(u:number)=>RouteArea;
 update:(elapsed:number,night:number)=>void;destroy:()=>void;
 water:Phaser.GameObjects.Graphics;tiles:number};

function poly(g:Phaser.GameObjects.Graphics,c:number,pts:Array<[number,number]>,a=1){
 g.fillStyle(c,a);
 g.fillPoints(pts.map(([x,y])=>new Phaser.Geom.Point(x,y)),true);
}
function diamond(g:Phaser.GameObjects.Graphics,u:number,v:number,c:number,a=1){
 const p=toScreen({u,v}),w=ISO.tileW/2,h=ISO.tileH/2;
 poly(g,c,[[p.x,p.y-h],[p.x+w,p.y],[p.x,p.y+h],[p.x-w,p.y]],a);
}
function lamp(scene:Phaser.Scene,u:number,v:number){
 const p=toScreen({u,v}),g=scene.add.graphics().setDepth(p.y);
 g.fillStyle(0x716578).fillRect(p.x-3,p.y-89,6,89);
 g.fillStyle(0x484152).fillRect(p.x-10,p.y-96,20,6);
 g.fillStyle(0xf7dbac,.9).fillRect(p.x-8,p.y-115,16,21);
 g.fillStyle(0xfff3c8).fillRect(p.x-6,p.y-113,12,16);
 g.lineStyle(2,0xb4949d).strokeRect(p.x-8,p.y-115,16,21);
 const halo=scene.add.ellipse(p.x,p.y-104,64,60,0xffd9a3,.12).setDepth(p.y-1);
 return {g,halo};
}
function bench(scene:Phaser.Scene,u:number,v:number){
 const p=toScreen({u,v}),g=scene.add.graphics().setDepth(p.y);
 g.fillStyle(0x5b5060,.22).fillEllipse(p.x,p.y,38,9);
 g.fillStyle(0x826667).fillRect(p.x-19,p.y-14,38,6);
 g.fillStyle(0xbe9b8c).fillRect(p.x-19,p.y-23,38,6);
 g.fillStyle(0x775d6d).fillRect(p.x-14,p.y-9,4,9).fillRect(p.x+11,p.y-9,4,9);
}
function sign(scene:Phaser.Scene,u:number,v:number,title:string){
 const p=toScreen({u,v}),g=scene.add.graphics().setDepth(p.y);
 g.fillStyle(0x8c6b5e).fillRect(p.x-2,p.y-45,4,45);
 g.fillStyle(0xffe6d3).fillRect(p.x-30,p.y-54,60,26);
 g.lineStyle(2,0xc097a6).strokeRect(p.x-30,p.y-54,60,26);
 scene.add.text(p.x,p.y-41,title,{fontFamily:'monospace',fontSize:'10px',
  fontStyle:'bold',color:'#735c6f'}).setOrigin(.5).setDepth(p.y+1);
}
function house(scene:Phaser.Scene,u:number,v:number,main:boolean){
 const p=toScreen({u,v}),x=p.x,y=p.y;
 const g=scene.add.graphics().setDepth(y-4);
 const w=main?225:112,h=main?161:91,d=main?105:52,roof=main?53:29;
 // Based on src/lab/house-layout.js: 14×12 metres, 3.15m per floor,
 // west study/living (x<4.4), central hall (x≈5.9), east kitchen/bath,
 // south entry at x=5.9; south windows at x=2.2, upstairs 2.2/6.1/12.1.
 const left=x-w*.58,middle=x,front=x+w*.48;
 // South/west facade, two storeys and projecting east facade.
 poly(g,main?0xe2c6c4:0xdbcccc,[[left,y-h],[middle,y-h+d*.31],[middle,y+d*.31],[left,y]]);
 poly(g,main?0xb9b1c6:0xc5bfbd,[[middle,y-h+d*.31],[front,y-h-7],[front,y-7],[middle,y+d*.31]]);
 g.lineStyle(main?5:3,0xb38f9f).lineBetween(left,y-h*.45,middle,y-h*.45+d*.31);
 g.lineStyle(main?5:3,0x99879e).lineBetween(middle,y-h*.45+d*.31,front,y-h*.45-7);
 // Roof is a pitched gable as in world.js, not the former flat-box hut.
 poly(g,main?0x735b73:0x86758b,[[left-9,y-h],[x-9,y-h-roof],[front+10,y-h-11],[middle+2,y-h+d*.31+9]]);
 poly(g,main?0x5c4b69:0x74677d,[[left-9,y-h],[x-13,y-h-roof-5],[middle+2,y-h+d*.31+9]]);
 g.lineStyle(3,0xe2b4bd).lineBetween(left-9,y-h,middle+2,y-h+d*.31+9);
 // Vertical room divisions correspond to west wing / hallway / kitchen wing.
 if(main)for(const ratio of [.29,.53]){
  const xx=left+w*ratio;
  g.lineStyle(2,0xe7dbcb,.46).lineBetween(xx,y-h*.44+ratio*9,xx,y-h*.12+ratio*9);
 }
 const panes=main?[
  [-.44,-.27],[-.17,-.30],[.22,-.28],[.39,-.19],
  [-.44,-.72],[-.20,-.69],[.18,-.69],[.39,-.61]
 ]:[[-.40,-.28],[.24,-.25],[-.39,-.67],[.25,-.66]];
 for(let i=0;i<panes.length;i++){
  const [xx,yy]=panes[i],wx=x+xx*w,wy=y+yy*h+d*(xx<0?.16:.11),ww=main?19:13,hh=main?23:16;
  g.fillStyle(0x716b88).fillRect(wx,wy,ww,hh);
  g.fillStyle(main?0xf4d9b5:0xb9d9d8,.92).fillRect(wx+2,wy+2,ww-4,hh-4);
  g.fillStyle(0xf6e8d5).fillRect(wx+ww/2-1,wy,2,hh);
  g.fillStyle(0xf6e8d5).fillRect(wx,wy+hh/2,ww,2);
  g.fillStyle(0xd6a1b8).fillRect(wx-3,wy+hh,ww+6,3);
  // SOUTH-WEST first-floor window x≈2.2 is the OPEN intro window in
  // house-layout.js. The other south windows have barricade boards.
  if(main&&i===0){
   g.fillStyle(0x4d455a).fillRect(wx+3,wy+3,ww-6,hh-6);
   g.fillStyle(0xffe2af,.78).fillRect(wx+5,wy+5,ww-10,hh-11);
   g.fillStyle(0x8d6a72).fillRect(wx-7,wy,6,hh);
   g.fillStyle(0xa0787b).fillRect(wx+ww+1,wy,6,hh);
  }else if(main&&i===4){
   // Boarded upstairs bedroom as in the 3D façade.
   g.fillStyle(0x70545a).fillRect(wx-3,wy+5,ww+6,5);
   g.fillStyle(0x805e60).fillRect(wx-3,wy+15,ww+6,4);
   g.fillStyle(0xd8b69d).fillRect(wx+2,wy+7,3,2).fillRect(wx+ww-4,wy+17,3,2);
  }
 }
 if(main){
  // Hall entrance at about x=5.9 / 14 along south façade.
  const doorX=left+w*(5.9/14),doorY=y-30;
  g.fillStyle(0x986a79).fillRect(doorX-4,doorY-5,32,54);
  g.fillStyle(0x5b4459).fillRect(doorX,doorY,23,51);
  g.fillStyle(0xe8c486).fillCircle(doorX+18,doorY+27,3);
  g.fillStyle(0xcbb9ad).fillRect(doorX-10,doorY+48,45,6);
  // Distinct second-floor windows (bedroom, reading room, music room).
  g.fillStyle(0xe1afbb).fillRect(front-45,y-h*.48,50,7);
  for(let j=0;j<5;j++)g.fillStyle(0x756174).fillRect(front-42+j*11,y-h*.48-19,3,18);
  sign(scene,u-1.2,v-.6,'14 ♡');
 }else{
  g.fillStyle(0x755b67).fillRect(x-21,y-23,17,26);
  g.fillStyle(0xe7d5c0).fillRect(x-23,y+1,22,3);
 }
}
function drawBridge(scene:Phaser.Scene){
 const deck=scene.add.graphics().setDepth(1),rail=scene.add.graphics().setDepth(1600);
 for(let u=10;u<16;u++){
  for(let v=3;v<=6;v++){
   diamond(deck,u,v,(u+v)%2?0xc39d85:0xd7b39a);
   const p=toScreen({u,v});
   deck.lineStyle(1,0x907281,.22).lineBetween(p.x-25,p.y,p.x+25,p.y);
  }
  for(const v of [2.6,6.4]){
   const p=toScreen({u,v});
   rail.fillStyle(0x806c68).fillRect(p.x-3,p.y-24,6,26);
   rail.fillStyle(0xf5d7bc).fillRect(p.x-5,p.y-28,10,4);
  }
 }
}
export function buildRescueOverworld(scene:Phaser.Scene,ground:Phaser.GameObjects.Graphics,
 ornaments:{flower:(u:number,v:number)=>void;shrub:(u:number,v:number)=>void;
  tree:(u:number,v:number)=>void;mushroom:(u:number,v:number)=>void},
 map:RescueMapId='morning_garden'):RescueOverworld{
 const before=new Set(scene.children.list),cfg=RESCUE_SCENES[map],g=ground;
 g.clear();
 const back:Record<RescueMapId,number>={
  morning_garden:0xf1e9d7,afternoon_meeting:0xf2ddc3,
  dusk_search:0xb8afbd,night_neighborhood:0x6e7189};
 g.fillStyle(back[map]).fillRect(-1600,-1300,7200,4500);
 let tiles=0;
 const low=Math.floor(cfg.minU),high=Math.ceil(cfg.maxU);
 for(let u=low;u<=high;u++)for(let v=-4;v<=16;v++){
  const lim=routeLimits(u);
  const rag=((u*7+v*13)%9===0?-.45:0)+((u*11+v*3)%11===0?.36:0);
  const onLand=v>=Math.floor(lim.min-1.0+rag)&&v<=Math.ceil(lim.max+1.0+rag);
  const bridge=map==='morning_garden'&&u>=10&&u<16;
  if(bridge){
   if(v>=-3&&v<=13)diamond(g,u,v,(u*3+v*5)%4?0x80c9d0:0x6ab7c9);
   continue;
  }
  if(!onLand)continue;
  tiles++;
  const p=toScreen({u,v}),center=routeCenter(u),distance=Math.abs(v-center);
  let c=0xaec4a2;
  if(map==='morning_garden'){
   c=(u+v)%2?0xb5d3a5:0xd4dfb5;
   if(distance<1.25)c=(u+v)%2?0xf2e5c2:0xf8eacb;
  }else if(map==='afternoon_meeting'){
   c=(u+v)%2?0xc8bd96:0xe2c99f;
   if(distance<1.5)c=(u+v)%2?0xe7ceb3:0xf6ddbc;
   if(u>=27&&u<38&&distance>2.8)c=(u+v)%2?0xb6bd91:0xcbcda2;
  }else if(map==='dusk_search'){
   c=(u+v)%2?0x778e85:0x8da59c;
   if(distance<1.25)c=(u+v)%2?0xa49da9:0xbab1b1;
  }else{
   c=(u+v)%2?0x6e7d84:0x76868a;
   if(distance<1.75)c=(u+v)%2?0x9d9faa:0xb3aeb3;
   if(v>7.7)c=(u+v)%2?0x676d7b:0x777987;
   if(u>=71&&u<=81&&v>=6&&v<9.5)c=(u+v)%2?0x998d90:0xb2a49f;
  }
  diamond(g,u,v,c);
  if((u*7+v*13)%15===0){
   g.fillStyle(map==='morning_garden'?0xf4c0ce:0xe2bcbd,.52).fillRect(p.x+6,p.y+1,3,3);
  }
  if(map==='night_neighborhood'&&v>7.7&&u%4===0){
   g.fillStyle(0xded5b8,.57).fillRect(p.x-13,p.y-2,20,3);
  }
 }
 // Irregular shoulders: no single rectangular floor exposed to the player.
 for(let u=low+1;u<high;u+=2){
  const lim=routeLimits(u);
  for(const v of [lim.min-1,lim.max+1]){
   const p=toScreen({u,v});
   g.fillStyle(map==='night_neighborhood'?0x7a7e8b:0x8fac8f,.38).fillEllipse(p.x,p.y,45,11);
  }
 }
 const water=scene.add.graphics().setDepth(.5);
 const motes=scene.add.graphics().setDepth(1700);
 const portalGlow=scene.add.graphics().setDepth(1500);
 if(map==='morning_garden')drawBridge(scene);
 // Original Corazones flower/tree/mushroom functions are reused for each map.
 for(let u=low+2;u<high-1;u+=3){
  const lim=routeLimits(u),v=u%2?lim.min-.45:lim.max+.4;
  if(map==='morning_garden'){
   ornaments.flower(u,v);
   if(u%6===2)ornaments.shrub(u+.6,v+.4);
   if(u%7===2&&!(u>=9&&u<=16))ornaments.tree(u,lim.min-1.1);
  }else if(map==='afternoon_meeting'){
   ornaments.flower(u,v);
   if(u%5===0)ornaments.mushroom(u+.2,lim.max+.45);
   if(u%6===1)ornaments.tree(u,lim.min-1.1);
  }else if(map==='dusk_search'){
   ornaments.shrub(u,v);
   if(u%4===0)ornaments.tree(u,lim.max+1.0);
   if(u%5===0)ornaments.mushroom(u+1,lim.min-.3);
  }else{
   if(u%4===0)ornaments.shrub(u,lim.min-.5);
  }
 }
 if(map==='morning_garden'){
  sign(scene,8,1.3,'RÍO ♡');
  bench(scene,18,8.5);
 }else if(map==='afternoon_meeting'){
  bench(scene,28,9.8);bench(scene,36,.2);
  sign(scene,25,1,'CEREZOS');
  // An oval plaza gives room to approach people from different directions.
  const plaza=scene.add.graphics().setDepth(.8),p=toScreen({u:32,v:4.6});
  plaza.fillStyle(0xf7e0bb,.23).fillEllipse(p.x,p.y,230,115);
  plaza.lineStyle(4,0xd7b2a7,.34).strokeEllipse(p.x,p.y,215,102);
 }else if(map==='dusk_search'){
  sign(scene,49,.2,'SILENCIO');
  bench(scene,56,8.7);
  const creek=scene.add.graphics().setDepth(.4);
  for(let u=49;u<60;u++){
   const p=toScreen({u,v:routeLimits(u).max+.4});
   creek.fillStyle((u%2)?0x659ca5:0x7eacaf,.65).fillEllipse(p.x,p.y,85,17);
  }
 }else{
  sign(scene,68,.3,'VILLA');
  for(const u of [67,72,77,81])lamp(scene,u,1.8);
  for(const [u,v] of [[69,10.4],[74,10.3],[81,11]])house(scene,u,v,false);
  // Main house façade mirrors the actual double-storey 3D floorplan.
  house(scene,78.7,9.0,true);
  const sidewalk=scene.add.graphics().setDepth(.65);
  for(let u=69;u<=81;u++){
   const p=toScreen({u,v:7.5});
   sidewalk.lineStyle(2,0xe7ded0,.6).lineBetween(p.x-20,p.y,p.x+21,p.y);
  }
 }
 // A spatially legible exit: pearly luminous boundary leading to another map.
 if(cfg.exit){
  sign(scene,cfg.exit.u-1.1,cfg.exit.v-2.9,'➜');
  const p=toScreen(cfg.exit);
  scene.add.text(p.x,p.y-49,'✧  SIGUE  ✧',{fontFamily:'Georgia',fontSize:'15px',
   color:'#fff4d9',stroke:'#a3778b',strokeThickness:3}).setOrigin(.5).setDepth(p.y+4);
 }
 const created=scene.children.list.filter(x=>!before.has(x));
 const update=(elapsed:number,night:number)=>{
  const t=elapsed/1000;water.clear();motes.clear();portalGlow.clear();
  if(map==='morning_garden'){
   for(let u=10;u<16;u++)for(let v=-2;v<=12;v++){
    if(v>=3&&v<=6)continue;
    const p=toScreen({u,v}),x=p.x+Math.sin(t*1.5+u*.66+v*.9)*8;
    water.lineStyle(1,0xecfff7,.31+Math.sin(t*1.7+v)*.13).lineBetween(x-9,p.y+3,x+7,p.y+3);
    if((u+v)%4===0)water.fillStyle(0xfcffff,.3).fillRect(x+3,p.y-3,3,2);
   }
  }
  if(map==='dusk_search'||map==='night_neighborhood'){
   for(let i=0;i<24;i++){
    const u=cfg.minU+1+(i*.77)%(cfg.maxU-cfg.minU-2),
     v=routeLimits(u).max+(i%3)*.55,p=toScreen({u,v}),
     pulse=Math.pow(Math.sin(t*1.6+i*1.1),2);
    motes.fillStyle(i%4?0xf8e1ad:0xf4aebc,night*(.26+.42*pulse));
    motes.fillCircle(p.x+Math.sin(t*.5+i)*8,p.y-20+Math.cos(t*.76+i)*8,1.5);
   }
  }
  if(cfg.exit){
   const p=toScreen(cfg.exit),pulse=.45+Math.sin(t*2.1)*.16;
   portalGlow.fillStyle(0xfff6d8,.10+pulse*.15).fillEllipse(p.x,p.y-3,105,40);
   portalGlow.lineStyle(2,0xfff2c8,.33+pulse*.34).strokeEllipse(p.x,p.y-3,88,30);
   portalGlow.fillStyle(0xffeed7,.65).fillCircle(p.x,p.y-26+Math.sin(t*1.8)*5,3.2);
  }
 };
 update(0,darknessAt(cfg.spawn.u,'intro',map));
 return {map,area:rescueArea,water,tiles,update,
  destroy:()=>{for(const obj of created)if(obj.active)obj.destroy();g.clear();}};
}
