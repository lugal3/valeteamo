import Phaser from 'phaser';
import {VAN_NIGHT_POSITION,VAN_PLATE,vanTexture} from './abduction-van';
import {createLivingEcology,type LivingWorld} from './rescue-ecology-render';
import type {AmbientCue} from './rescue-ecology';
import {ISO,toScreen,type IsoPoint} from '../isometric';
import {HOUSE_3D_REFERENCE,NIGHT_HOUSE,nightRouteCenter,nightRouteLimits,nightHouseBlocks,
 nightWalkable} from './night-house-layout';

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
  exit:{u:20.7,v:4.5,to:'afternoon_meeting',unlock:'cat-fed'}},
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
 intro:{u:5.4,v:4.65},'feed-cat':{u:17.6,v:5.05},'cat-fed':{u:20.7,v:4.5},
 'meet-couple':{u:28,v:4.45},defend:{u:33.15,v:4.85},
 'talk-louis':{u:34.45,v:4.1},'talk-luis':{u:35.75,v:4.4},
 'walk-together':{u:38.4,v:4.5},disappearance:{u:40.8,v:4.5},
 ribbon:{u:48,v:4.9},petals:{u:53,v:3.8},wheel:{u:59.5,v:4.9},
 door:NIGHT_HOUSE.door,window:NIGHT_HOUSE.window,house:NIGHT_HOUSE.window
} satisfies Record<string,IsoPoint>;
export function mapForStage(stage:string):RescueMapId{
 if(['meet-couple','defend','talk-louis','talk-luis','walk-together','disappearance'].includes(stage))return 'afternoon_meeting';
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
 return map==='morning_garden'?stage===goal.unlock:
  map==='afternoon_meeting'?['ribbon','petals','wheel','door','window','house'].includes(stage):
  ['door','window','house'].includes(stage);
}
export function storyArrivalPoint(stage:keyof typeof STORY_POSITIONS):IsoPoint{
 if(stage==='feed-cat')return {u:15.8,v:4.55};
 if(stage==='cat-fed')return {u:18.2,v:4.55};
 return {...RESCUE_SCENES[mapForStage(stage)].spawn};
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
 return nightRouteCenter(u);
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
 return nightRouteLimits(u);
}
export function constrainRescue(
 p:IsoPoint,map:RescueMapId=sceneForPosition(p.u),previous?:IsoPoint
):IsoPoint{
 const def=RESCUE_SCENES[map],u=clamp(p.u,def.minU+.35,def.maxU-.5),limit=routeLimits(u);
 const next={u,v:clamp(p.v,limit.min+.20,limit.max-.20)};
 if(map!=='night_neighborhood'||!nightHouseBlocks(next))return next;
 // Slide against the house wall instead of teleporting Kitty or trapping her.
 if(previous){
  const alongU={u:next.u,v:previous.v},alongV={u:previous.u,v:next.v};
  if(nightWalkable(alongU))return alongU;
  if(nightWalkable(alongV))return alongV;
  return {...previous};
 }
 return {u:next.u,v:clamp(Math.max(next.v,9.20),limit.min+.20,limit.max-.20)};
}
export function darknessAt(u:number,stage:string,map:RescueMapId=sceneForPosition(u)):number{
 if(map==='morning_garden')return 0;
 if(map==='afternoon_meeting')return Math.max(stage==='disappearance'?.30:.09,
  .09+clamp((u-23)/22,0,1)*.18);
 if(map==='dusk_search')return .38+clamp((u-46)/18,0,1)*.15;
 return .68+clamp((u-65)/17,0,1)*.05;
}
export type RescueOverworld={map:RescueMapId;area:(u:number)=>RouteArea;
 update:(elapsed:number,night:number,player?:IsoPoint)=>AmbientCue|null;
 destroy:()=>void;ecology:LivingWorld;
 water:Phaser.GameObjects.Graphics;tiles:number;
 parkedVan?:Phaser.GameObjects.Image};

function poly(g:Phaser.GameObjects.Graphics,c:number,pts:Array<[number,number]>,a=1){
 g.fillStyle(c,a);
 g.fillPoints(pts.map(([x,y])=>new Phaser.Geom.Point(x,y)),true);
}
function diamond(g:Phaser.GameObjects.Graphics,u:number,v:number,c:number,a=1){
 const p=toScreen({u,v}),w=ISO.tileW/2,h=ISO.tileH/2;
 poly(g,c,[[p.x,p.y-h],[p.x+w,p.y],[p.x,p.y+h],[p.x-w,p.y]],a);
}
// Deterministic hand-drawn terrain details: no random jitter between reloads,
// no image fetches or new textures, and no per-frame allocations.
function hashCell(u:number,v:number,salt=0):number{
 let n=Math.imul(u+173,374761393)^Math.imul(v+911,668265263)^Math.imul(salt+47,1274126177);
 n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
}
const TERRAIN_PALETTES:Record<RescueMapId,readonly number[]>={
 morning_garden:[0xb9d2a8,0xc8dbb0,0xd5e1bb,0xb2d1ab,0xcbdcac],
 afternoon_meeting:[0xb9bf91,0xcdc99b,0xddcca5,0xb2bb91,0xd8c49b],
 dusk_search:[0x7f958a,0x8da296,0x738e86,0x8b9d92,0x71877f],
 night_neighborhood:[0x73848b,0x687e87,0x7e878f,0x6c7684,0x7d8288]
};
function paintGroundTexture(g:Phaser.GameObjects.Graphics,u:number,v:number,
 p:{x:number;y:number},map:RescueMapId,onPath:boolean){
 const seed=hashCell(u,v,7),shade=hashCell(u,v,19);
 if(onPath){
  // Sand grain / cobbles are details ON the original isometric diamonds.
  if(seed>.18){
   g.fillStyle(map==='night_neighborhood'?0xe7d1c0:0xfff6df,.25+shade*.20);
   g.fillRect(p.x-13+seed*9,p.y-3,6+(u%3)*2,2);
  }
  if(seed>.65){
   g.fillStyle(map==='dusk_search'?0x665d79:0xb7a09d,.24);
   g.fillRect(p.x+7,p.y+5,4,2);
  }
  if(map==='night_neighborhood'&&seed>.32){
   // Uneven masonry seams hint at old, polished paving stones.
   g.lineStyle(1,0x736b81,.20);
   g.lineBetween(p.x-9,p.y-1,p.x+7,p.y+2);
  }
  return;
 }
 if(seed>.17){
  const grass=map==='night_neighborhood'?0xaeb6a4:
   map==='dusk_search'?0xc4baa0:map==='afternoon_meeting'?0x718d69:0x64956d;
  g.lineStyle(1,grass,map==='night_neighborhood'?.28:.40);
  g.lineBetween(p.x-10,p.y+3,p.x-11,p.y-3);
  g.lineBetween(p.x-10,p.y+3,p.x-6,p.y-1);
 }
 if(seed>.53){
  const fleck=map==='dusk_search'?0xc6a4c1:
   map==='night_neighborhood'?0xcbb1be:0xeeb1c6;
  g.fillStyle(fleck,.58);
  g.fillRect(p.x+10,p.y-1,3,2);
  g.fillRect(p.x+12,p.y-4,2,2);
 }
 if(shade>.80){
  g.fillStyle(map==='night_neighborhood'?0xbbb6ac:0xeee2bb,.42);
  g.fillEllipse(p.x-2,p.y+6,12,4);
 }
}
// Scenery deliberately sits on the shoulders, rather than blocking Kitty.
// All objects belong to the map's disposable scene collection.
function picketFence(scene:Phaser.Scene,u:number,v:number,planks=6){
 const p=toScreen({u,v}),g=scene.add.graphics().setDepth(p.y);
 g.fillStyle(0x5d5361,.13).fillEllipse(p.x,p.y,planks*13+8,12);
 for(let j=0;j<planks;j++){
  const x=p.x+(j-(planks-1)/2)*12;
  g.fillStyle(0xba9291).fillRect(x-2,p.y-21,5,20);
  g.fillStyle(0xeedac8).fillRect(x-2,p.y-23,5,4);
 }
 g.fillStyle(0xd1aea4).fillRect(p.x-planks*6,p.y-15,planks*12,4);
 g.fillStyle(0xb8908f).fillRect(p.x-planks*6,p.y-7,planks*12,3);
}
function cherryTree(scene:Phaser.Scene,u:number,v:number,dusk=false){
 const p=toScreen({u,v}),g=scene.add.graphics().setDepth(p.y);
 g.fillStyle(0x594e62,.22).fillEllipse(p.x,p.y,70,17);
 g.fillStyle(0x745c5d).fillRect(p.x-6,p.y-50,13,50);
 g.fillStyle(0x9b7374).fillRect(p.x-3,p.y-47,4,44);
 g.fillStyle(0x805c6e).fillRect(p.x-25,p.y-56,24,6);
 g.fillStyle(0x805c6e).fillRect(p.x+3,p.y-68,24,6);
 const palette=dusk?[0x9d759a,0xab829e,0xcda4b7,0xebbecd]:
  [0xdca1b9,0xe9b5c5,0xf0c6d4,0xffe0df];
 for(let k=0;k<17;k++){
  const angle=k*2.4,r=20+((k*7)%19);
  const x=p.x+Math.cos(angle)*r,y=p.y-77+Math.sin(angle)*r*.47;
  g.fillStyle(palette[k%palette.length],.95).fillEllipse(x,y,29+(k%3)*4,17+(k%4)*3);
 }
 for(let k=0;k<15;k++){
  const x=p.x+((k*37)%80)-40,y=p.y-94+((k*19)%42);
  g.fillStyle(k%2?0xffe5e2:0xe9a5bc,.83).fillRect(x,y,4,3);
 }
}
function gardenFeature(scene:Phaser.Scene,u:number,v:number,kind:'planter'|'rock'|'lantern'|'picnic'){
 const p=toScreen({u,v}),g=scene.add.graphics().setDepth(p.y);
 g.fillStyle(0x3d4452,.20).fillEllipse(p.x,p.y,50,12);
 if(kind==='rock'){
  g.fillStyle(0x9ba59b).fillEllipse(p.x-9,p.y-5,25,15);
  g.fillStyle(0xc9cfc0).fillEllipse(p.x-11,p.y-9,15,7);
  g.fillStyle(0x83988c).fillEllipse(p.x+11,p.y-4,16,10);
 }else if(kind==='planter'){
  g.fillStyle(0x996c70).fillRect(p.x-16,p.y-14,31,12);
  g.fillStyle(0xcd9892).fillRect(p.x-19,p.y-17,37,5);
  for(const dx of [-10,-1,8]){
   g.fillStyle(0x66986d).fillRect(p.x+dx,p.y-33,3,18);
   g.fillStyle(dx<0?0xfac9c9:0xf2b3d3).fillEllipse(p.x+dx,p.y-34,14,9);
   g.fillStyle(0xffe5a3).fillCircle(p.x+dx,p.y-34,2);
  }
 }else if(kind==='lantern'){
  g.fillStyle(0x877279).fillRect(p.x-3,p.y-38,6,38);
  g.fillStyle(0xf7d6ae).fillRect(p.x-10,p.y-53,20,17);
  g.fillStyle(0xfff4c6,.95).fillRect(p.x-7,p.y-50,14,10);
  g.fillStyle(0x736377).fillRect(p.x-13,p.y-56,26,4);
 }else{
  g.fillStyle(0x715563).fillRect(p.x-20,p.y-21,5,24);
  g.fillStyle(0x715563).fillRect(p.x+15,p.y-21,5,24);
  g.fillStyle(0xe7bbac).fillEllipse(p.x,p.y-23,58,23);
  g.fillStyle(0xffd9c9).fillEllipse(p.x,p.y-26,44,14);
  g.fillStyle(0xb57c91).fillRect(p.x-2,p.y-33,6,5);
  g.fillStyle(0xf8e7ca).fillCircle(p.x+13,p.y-27,4);
 }
}
function reeds(scene:Phaser.Scene,u:number,v:number){
 const p=toScreen({u,v}),g=scene.add.graphics().setDepth(p.y);
 for(let j=0;j<7;j++){
  const x=p.x+(j-3)*5,h=9+(j*7)%14;
  g.lineStyle(2,j%2?0x6f9b79:0x8db78f,.8);
  g.lineBetween(x,p.y,x-2+(j%3)*2,p.y-h);
  if(j%3===0)g.fillStyle(0xd2b7ae,.85).fillRect(x-4,p.y-h-4,4,7);
 }
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
// The real 3D entrance is on the SOUTH/front wall (z=12), with a ground
// window at x=2.2 and a door at x=5.9. Draw the playable house FRONT-ON,
// not as an angled box whose roof and side walls cover the interaction pads.
// All proportions and the two-storey rhythm derive from HOUSE_3D_REFERENCE.
// Crucially the door/window centers share the same projected ground baseline.
function frontalRescueHouse(scene:Phaser.Scene){
 const ground=toScreen(NIGHT_HOUSE.door),width=340;
 const left=ground.x-width*(HOUSE_3D_REFERENCE.frontDoorX/HOUSE_3D_REFERENCE.width);
 const top=ground.y-203,right=left+width,base=ground.y-8;
 const g=scene.add.graphics().setDepth(ground.y-125);
 const px=(realX:number)=>left+width*realX/HOUSE_3D_REFERENCE.width;
 // Dark foundation, sturdy level outlines, readable two-storey windows.
 g.fillStyle(0x5c5065,.9).fillRect(left-8,base-1,width+16,9);
 g.fillStyle(0xc6b6c9).fillRect(left,top,width,base-top);
 g.fillStyle(0xe9cdd2).fillRect(left+7,top+10,width-14,base-top-16);
 g.fillStyle(0x9c869d).fillRect(left,base-90,width,7);
 g.fillStyle(0xb6a0b2).fillRect(left-6,top-4,width+12,8);
 // Simple low-poly gable roof, not a rotated 3D box hiding the front window.
 poly(g,0x58435e,[[left-19,top+2],[left+width*.5,top-62],
  [right+19,top+2],[right+12,top+26],[left-12,top+26]]);
 poly(g,0x826682,[[left+width*.5,top-62],[right+19,top+2],
  [left+width*.5,top-6]]);
 g.lineStyle(4,0xefc5d5).lineBetween(left-19,top+3,left+width*.5,top-61);
 g.lineBetween(left+width*.5,top-61,right+19,top+3);
 // Soft brickwork: low contrast so the actual entrances are the focal point.
 for(let row=0;row<7;row++)for(let col=0;col<8;col++){
  const x=left+12+col*40+(row%2)*15,y=top+34+row*19;
  if(x>right-12||y>base-5)continue;
  g.lineStyle(1,0xffffff,.12).lineBetween(x,y,x+18,y);
 }
 const pane=(cx:number,cy:number,open=false)=>{
  g.fillStyle(0x756375).fillRect(cx-19,cy-27,38,56);
  g.fillStyle(open?0x332b49:0xbfc7bc).fillRect(cx-14,cy-22,28,45);
  if(open){
   // Open sash on left: Kitty enters from the FRONT patio.
   g.fillStyle(0xf3c8d7).fillRect(cx-18,cy-22,5,46);
   g.fillStyle(0xffe9a9,.18).fillRect(cx-11,cy-19,20,39);
  }else{
   g.fillStyle(0xe2e7da).fillRect(cx-1,cy-22,3,46);
   g.fillRect(cx-14,cy-1,29,3);
  }
  g.fillStyle(0xf1d5df).fillRect(cx-23,cy+28,46,5);
 };
 // Match the upstairs bedroom / landing / music windows in house-layout.js.
 for(const x of [2.2,6.1,12.1])pane(px(x),top+62,false);
 const windowX=px(HOUSE_3D_REFERENCE.openWindowX);
 pane(windowX,base-54,true);
 // A gentle cyan doorway hint marks a WINDOW rather than a hidden side wall.
 g.lineStyle(3,0xa9f9db,.92).strokeRect(windowX-21,base-83,42,59);
 const doorX=px(HOUSE_3D_REFERENCE.frontDoorX);
 g.fillStyle(0x765367).fillRect(doorX-27,base-84,54,81);
 g.fillStyle(0x342c43).fillRect(doorX-21,base-78,42,74);
 g.fillStyle(0xdfb79b).fillRect(doorX+12,base-40,5,5);
 g.fillStyle(0xc3adbd).fillRect(doorX-31,base-3,64,7);
 for(const lampX of [doorX-43,doorX+43]){
  g.fillStyle(0xfce5bb,.52).fillCircle(lampX,base-76,12);
  g.fillStyle(0xf5d4a0).fillRect(lampX-5,base-82,10,13);
 }
 // Exterior visual hint only; selected interaction and blocking remain
 // controlled by existing, tested Phaser pathfinding in night-house-layout.
 scene.add.text(left+width*.77,top+22,'CASA 14 ♡',{
  fontFamily:'monospace',fontSize:'13px',fontStyle:'bold',
  color:'#fff6e9',stroke:'#4b3a53',strokeThickness:4
 }).setOrigin(.5).setDepth(ground.y-110);
}
function house(scene:Phaser.Scene,u:number,v:number,main:boolean){
 if(main){frontalRescueHouse(scene);return;}
 const p=toScreen({u,v}),x=p.x,y=p.y;
 // A building must never paint OVER Kitty or the front-porch hotspot.
 // Decorative house layers are behind play-space; a collision footprint
 // prevents Kitty walking inside the facade as in the actual 3D geometry.
 const g=scene.add.graphics().setDepth(y-(main?145:100));
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
 // Soft hand-painted brick joints. They stay on the solid walls, never
 // in front of the window or doorway interaction points.
 for(let row=0;row<(main?6:3);row++){
  const seamY=y-17-row*(main?20:18);
  for(let col=0;col<5;col++){
   const sx=left+8+col*(w*.105)+(row%2)*9;
   g.lineStyle(1,0xffe2d5,main?.20:.14);
   g.lineBetween(sx,seamY,sx+13,seamY);
  }
 }
 // Shingle texture follows the sloped roof instead of drawing a flat square.
 for(let row=0;row<(main?7:4);row++){
  const yy=y-h-roof*.82+row*(main?10:8);
  for(let col=0;col<(main?9:5);col++){
   const xx=left+18+col*(w/(main?9:5))+(row%2)*7;
   g.lineStyle(2,row%2?0xe0b2b4:0x463f60,.24);
   g.lineBetween(xx,yy,xx+(main?14:10),yy+3);
  }
 }
 if(main){
  // Rain gutter, chimney, and roof vent mirror the lived-in 3D silhouette.
  g.fillStyle(0xb07f82).fillRect(x+39,y-h-roof*.78,22,26);
  g.fillStyle(0x5d4d67).fillRect(x+35,y-h-roof*.82,30,6);
  g.fillStyle(0xddb9b0).fillRect(x+43,y-h-roof*.70,5,16);
  g.fillStyle(0x9b8792).fillRect(front-28,y-h+4,18,7);
  g.fillStyle(0x594d60).fillRect(front-23,y-h+3,9,5);
 }
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
  const doorX=left+w*(HOUSE_3D_REFERENCE.frontDoorX/HOUSE_3D_REFERENCE.width),doorY=y-30;
  g.fillStyle(0x986a79).fillRect(doorX-4,doorY-5,32,54);
  g.fillStyle(0x5b4459).fillRect(doorX,doorY,23,51);
  g.fillStyle(0xe8c486).fillCircle(doorX+18,doorY+27,3);
  g.fillStyle(0xcbb9ad).fillRect(doorX-10,doorY+48,45,6);
  g.fillStyle(0xe8d7bd).fillRect(doorX-16,doorY+54,56,6);
  g.fillStyle(0xa39194).fillRect(doorX-20,doorY+61,64,5);
  // Two wall lamps flank the locked front entrance.
  for(const lampX of [doorX-17,doorX+35]){
   g.fillStyle(0x756079).fillRect(lampX-2,doorY+2,4,10);
   g.fillStyle(0xf5d1a3).fillRect(lampX-5,doorY-9,10,12);
   g.fillStyle(0xffefca).fillRect(lampX-3,doorY-7,6,8);
  }
  // Distinct second-floor windows (bedroom, reading room, music room).
  g.fillStyle(0xe1afbb).fillRect(front-45,y-h*.48,50,7);
  for(let j=0;j<5;j++)g.fillStyle(0x756174).fillRect(front-42+j*11,y-h*.48-19,3,18);
  // Climbing ivy below the kitchen wing; foliage uses flat pixel-art shapes.
  for(let i=0;i<11;i++){
   const ivyX=front-7+Math.sin(i*.77)*7,ivyY=y-6-i*9;
   g.fillStyle(i%2?0x738f81:0x91ab91,.83).fillRect(ivyX,ivyY,10,5);
   g.fillStyle(0x5b7e73,.74).fillRect(ivyX+4,ivyY-4,4,6);
  }
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
 let parkedVan:Phaser.GameObjects.Image|undefined;
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
   if(v>=-3&&v<=13){
    const p=toScreen({u,v}),n=hashCell(u,v,2);
    diamond(g,u,v,n>.62?0x8ed9d4:n>.30?0x73c5cd:0x65b5c7);
    // Little lily pads and flowers live far from the wooden crossing.
    if((v<2||v>7)&&n>.84){
     g.fillStyle(0x6e9d84,.68).fillEllipse(p.x-8,p.y+3,16,7);
     g.fillStyle(0xf7e0de,.94).fillRect(p.x-10,p.y+1,4,3);
    }
    if(n>.58){
     g.lineStyle(1,0xddf5e9,.22).lineBetween(p.x-21,p.y+2,p.x-8,p.y+2);
    }
   }
   continue;
  }
  if(!onLand)continue;
  tiles++;
  const p=toScreen({u,v}),center=routeCenter(u),distance=Math.abs(v-center);
  // Nonrepeating, seeded micro-palette avoids giant checkerboard squares.
  const grain=hashCell(u,v,3),variation=hashCell(u,v,4);
  const shades=TERRAIN_PALETTES[map];
  let c=shades[Math.floor(grain*shades.length)];
  const isPath=distance<1.38;
  const edge=distance>=1.38&&distance<2.15;
  if(map==='morning_garden'){
   if(isPath)c=variation>.65?0xffe8c2:variation>.28?0xf4e4c5:0xe9dbc0;
   else if(edge)c=variation>.5?0xd5d7ad:0xd9d9b5;
  }else if(map==='afternoon_meeting'){
   if(isPath)c=variation>.7?0xf1d4b6:variation>.26?0xe5caaa:0xddc2a4;
   else if(edge)c=variation>.5?0xc6bc99:0xcac2a2;
   if(u>=27&&u<=37&&distance>2.8&&variation>.34)c=0xb5bc94;
  }else if(map==='dusk_search'){
   if(isPath)c=variation>.55?0xbcb1b4:0xa69da9;
   else if(edge)c=0x9b9d97;
  }else{
   if(isPath)c=variation>.58?0xb0a8aa:0x989ba6;
   else if(edge)c=0x92979e;
   // Three distinct 3D-inspired outdoor materials: asphalt (street), stone
   // pavement and the front path, with a flowered forecourt in front of the wall.
   if(v>=4.4&&v<5.8)c=variation>.55?0x545d6f:0x626876;
   if(v>=5.8&&v<6.95)c=variation>.5?0xa49a9a:0xb7aaa7;
   if(u>=73.7&&u<=79.5&&v>=7.0&&v<=10.35)c=variation>.5?0xd4bfad:0xbda9a2;
   if(u>=76.1&&u<=81.5&&v>=9.2&&v<=11.4)c=variation>.5?0xdac0b0:0xcab4a5;
  }
  diamond(g,u,v,c);
  paintGroundTexture(g,u,v,p,map,isPath);
  if((u*7+v*13)%17===0){
   g.fillStyle(map==='morning_garden'?0xf4c0ce:0xe2bcbd,.52).fillRect(p.x+6,p.y+1,3,3);
  }
  if(map==='night_neighborhood'&&v>=4.4&&v<=5.8&&u%4===0){
   g.fillStyle(0xded5b8,.57).fillRect(p.x-13,p.y-2,20,3);
  }
  // Cobblestone seams on the residential street; walkway is kept visible.
  if(map==='night_neighborhood'&&v>=5.8&&v<=10.7&&variation>.72){
   g.lineStyle(1,0xa5a0a4,.25).lineBetween(p.x-11,p.y+5,p.x+10,p.y+5);
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
 const atmosphere=scene.add.graphics().setDepth(.7);
 const motes=scene.add.graphics().setDepth(1700);
 const portalGlow=scene.add.graphics().setDepth(1500);
 const reducedMotion=typeof window!=='undefined'&&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 // Capped deterministic emitter per map: no Phaser particles, no timers and
 // only three reusable Graphics buffers. Preserves mobile/iPhone performance.
 const particleCount=map==='morning_garden'?30:map==='afternoon_meeting'?40:
  map==='dusk_search'?31:25;
 const particles=Array.from({length:particleCount},(_,i)=>{
  const u=cfg.minU+.8+hashCell(i,7,2)*(cfg.maxU-cfg.minU-1.6);
  const limit=routeLimits(u);
  return {u,v:limit.min-1.4+hashCell(i,9,4)*(limit.max-limit.min+2.8),
   phase:hashCell(i,12,1),speed:.17+hashCell(i,8,3)*.19,
   wobble:hashCell(i,5,6)*Math.PI*2};
 });
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
  // Welcoming flowered path, cherry arch and riparian details.
  for(const [u,v] of [[3.1,1.1],[7.6,8.2],[18.4,9.4],[21.3,1.0]])
   cherryTree(scene,u,v);
  for(const [u,v] of [[9.6,2.2],[10.6,8.4],[12.3,1.6],[14.2,9.4],[15.5,1.6]])
   reeds(scene,u,v);
  picketFence(scene,4.2,9.2,5);picketFence(scene,6.8,9.6,4);
  gardenFeature(scene,3.7,8.7,'planter');gardenFeature(scene,18.2,.25,'picnic');
  gardenFeature(scene,7.4,1.5,'rock');gardenFeature(scene,19,1.2,'rock');
 }else if(map==='afternoon_meeting'){
  bench(scene,28,9.8);bench(scene,36,.2);
  sign(scene,25,1,'CEREZOS');
  // An oval plaza gives room to approach people from different directions.
  const plaza=scene.add.graphics().setDepth(.8),p=toScreen({u:29.3,v:4.6});
  plaza.fillStyle(0xf7e0bb,.23).fillEllipse(p.x,p.y,230,115);
  plaza.lineStyle(4,0xd7b2a7,.34).strokeEllipse(p.x,p.y,215,102);
  for(const [u,v] of [[26.1,-.1],[29,10.1],[35.2,-.4],[39.1,9.7],[42.3,0]])
   cherryTree(scene,u,v);
  for(const [u,v] of [[27.7,.8],[31.8,10.7],[35.8,9.8],[42.6,8.4]])
   gardenFeature(scene,u,v,'planter');
  gardenFeature(scene,32.5,11.1,'picnic');
  picketFence(scene,25.1,8.9,5);picketFence(scene,41.3,8.9,5);
  gardenFeature(scene,24.9,1.8,'rock');
 }else if(map==='dusk_search'){
  sign(scene,49,.2,'SILENCIO');
  bench(scene,56,8.7);
  const creek=scene.add.graphics().setDepth(.4);
  for(let u=49;u<60;u++){
   const p=toScreen({u,v:routeLimits(u).max+.4});
   creek.fillStyle((u%2)?0x659ca5:0x7eacaf,.65).fillEllipse(p.x,p.y,85,17);
  }
  for(const [u,v] of [[47,9.3],[51,-.5],[56,9.9],[61,.3]])
   cherryTree(scene,u,v,true);
  for(const [u,v] of [[49,9.9],[53,10],[57,9.9],[60,9.5]])
   reeds(scene,u,v);
  for(const [u,v] of [[50.1,-.1],[54,.5],[59,.6],[63,9.3]])
   gardenFeature(scene,u,v,'rock');
  gardenFeature(scene,60,9.2,'lantern');
 }else{
  sign(scene,68,.3,'VILLA');
  for(const u of [67,72,77,81])lamp(scene,u,1.8);
  // Neighboring houses stay across the ROAD, not on Kitty's way to the door.
  for(const [u,v] of [[68.2,2.9],[72.1,2.5],[81,3.7]])house(scene,u,v,false);
  // Main house façade mirrors the actual double-storey 3D floorplan.
  house(scene,NIGHT_HOUSE.center.u,NIGHT_HOUSE.center.v,true);
  // Same marked vehicle as in the filmed capture. Its wheels rest by
  // the curb, outside the 3D-faithful front entrance and navigable path.
  const vanPlace=toScreen(VAN_NIGHT_POSITION);
  scene.add.ellipse(vanPlace.x,vanPlace.y+3,154,25,0x202332,.28)
   .setDepth(vanPlace.y-2);
  parkedVan=scene.add.image(vanPlace.x,vanPlace.y,vanTexture(false))
   .setOrigin(.5,.88).setScale(.88).setDepth(vanPlace.y+4);
  scene.add.text(vanPlace.x,vanPlace.y-88,'☾  '+VAN_PLATE,{
   fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',
   color:'#ffe2c2',stroke:'#392a4b',strokeThickness:4
  }).setOrigin(.5).setDepth(vanPlace.y+17);
  const sidewalk=scene.add.graphics().setDepth(.65);
  for(const u of [67,72,77,81]){
   const light=toScreen({u,v:4.75});
   sidewalk.fillStyle(0xe0aa83,.16).fillEllipse(light.x,light.y,82,20);
   for(let i=0;i<3;i++){
    sidewalk.fillStyle(0xffd6a2,.23-i*.05)
     .fillRect(light.x-15+i*4,light.y-4+i*4,29-i*7,2);
   }
  }
  // Stone pavement and the 3D x=5.9 front-path / porch. Each paving stone is
  // placed on traversable ground so it visually teaches the actual route.
  for(let u=68;u<=81;u+=.65){
   const p=toScreen({u,v:6.15});
   sidewalk.lineStyle(2,0xf6e9d6,.51).lineBetween(p.x-19,p.y-2,p.x+21,p.y+2);
  }
  const paving=[NIGHT_HOUSE.sidewalk,NIGHT_HOUSE.gate,NIGHT_HOUSE.yard,
   NIGHT_HOUSE.porch,NIGHT_HOUSE.door,NIGHT_HOUSE.window];
  for(let i=0;i<paving.length-1;i++){
   const a=toScreen(paving[i]),b=toScreen(paving[i+1]);
   sidewalk.lineStyle(i===paving.length-2?6:13,0xf9dfbe,.48);
   sidewalk.lineBetween(a.x,a.y,b.x,b.y);
   sidewalk.lineStyle(2,0xe1bca3,.62);
   sidewalk.lineBetween(a.x,a.y,b.x,b.y);
  }
  for(const [u,v] of [[68.0,9.8],[71.4,10.8]])picketFence(scene,u,v,5);
  for(const [u,v] of [[71.1,9.8],[74.1,11.1],[80.6,11.35]])
   gardenFeature(scene,u,v,'planter');
  gardenFeature(scene,66.8,8.4,'rock');
  gardenFeature(scene,73.3,2.1,'lantern');
  gardenFeature(scene,80.3,3.0,'lantern');
  // The first clear sign points toward the porch rather than to an invisible
  // interaction hidden behind the building's graphic.
  sign(scene,NIGHT_HOUSE.gate.u,NIGHT_HOUSE.gate.v-1.0,'CASA ♡');
  const targets=scene.add.graphics().setDepth(toScreen(NIGHT_HOUSE.door).y+18);
  for(const [where,color] of [[NIGHT_HOUSE.door,0xffd69e],
    [NIGHT_HOUSE.window,0xf8a6d6]] as const){
   const p=toScreen(where);
   targets.fillStyle(color,.23).fillEllipse(p.x,p.y,76,26);
   targets.lineStyle(3,color,.85).strokeEllipse(p.x,p.y,58,20);
  }
  scene.add.text(toScreen(NIGHT_HOUSE.door).x,toScreen(NIGHT_HOUSE.door).y-30,
   'PUERTA',{fontFamily:'monospace',fontSize:'10px',fontStyle:'bold',
    color:'#fff5d9',stroke:'#4b3853',strokeThickness:3})
   .setOrigin(.5).setDepth(toScreen(NIGHT_HOUSE.door).y+18);
  scene.add.text(toScreen(NIGHT_HOUSE.window).x,toScreen(NIGHT_HOUSE.window).y-30,
   'VENTANA',{fontFamily:'monospace',fontSize:'10px',fontStyle:'bold',
    color:'#ffe7fa',stroke:'#4b3853',strokeThickness:3})
   .setOrigin(.5).setDepth(toScreen(NIGHT_HOUSE.window).y+18);
 }
 // Shared trail vocabulary at both ends of every chapter. The road keeps
 // going beyond the playable edge rather than ending against a flat void.
 // Decorative geometry only; existing portal coordinates and collision stay.
 const seam=scene.add.graphics().setDepth(.35);
 const links=[...(map==='morning_garden'?[]:[{u:cfg.minU+.35,v:cfg.spawn.v,dir:-1}]),
  ...(cfg.exit?[{u:cfg.exit.u,v:cfg.exit.v,dir:1}]:[])];
 for(const link of links){
  for(let i=0;i<8;i++){
   const u=link.u+link.dir*i*.56,v=link.v,point=toScreen({u,v});
   const fade=1-i/9;
   const color=map==='morning_garden'?0xf4e4c5:map==='afternoon_meeting'?0xe5caaa:
    map==='dusk_search'?0xbcb1b4:0x989ba6;
   seam.fillStyle(color,.85*fade).fillEllipse(point.x,point.y,76,36);
   for(const side of [-1,1]){
    const edge=toScreen({u,v:v+side*1.25});
    seam.fillStyle(map==='night_neighborhood'?0x9b9a9d:0xc4b6a1,.65*fade)
     .fillEllipse(edge.x,edge.y,11,6);
   }
  }
  // Repeated paired posts and pink ribbons form recognizable landmarks.
  for(const side of [-1,1]){
   const point=toScreen({u:link.u-link.dir*.75,v:link.v+side*2.35});
   const post=scene.add.graphics().setDepth(point.y);
   post.fillStyle(0x5c5362,.19).fillEllipse(point.x,point.y,24,8);
   post.fillStyle(0x987b78).fillRect(point.x-3,point.y-33,6,33);
   post.fillStyle(0xf0d9bf).fillRect(point.x-5,point.y-36,10,5);
   post.fillStyle(0xce819f).fillRect(point.x-6,point.y-25,12,5);
   post.fillStyle(0xe8a9b7).fillTriangle(point.x+3,point.y-22,point.x+14,point.y-17,point.x+5,point.y-12);
  }
 }
 // A spatially legible exit: pearly luminous boundary leading to another map.
 if(cfg.exit){
  sign(scene,cfg.exit.u-1.1,cfg.exit.v-2.9,'➜');
  const p=toScreen(cfg.exit);
  scene.add.text(p.x,p.y-49,'✧  SIGUE  ✧',{fontFamily:'Georgia',fontSize:'15px',
   color:'#fff4d9',stroke:'#a3778b',strokeThickness:3}).setOrigin(.5).setDepth(p.y+4);
 }
 // Living flowers, small animals and lighting share the existing Phaser scene.
 const ecology=createLivingEcology(scene,map,cfg.minU,cfg.maxU,
  routeCenter,reducedMotion);
 const created=scene.children.list.filter(x=>!before.has(x));
 let lastVisualPaint=-Infinity;
 const update=(elapsed:number,night:number,player:IsoPoint=cfg.spawn):AmbientCue|null=>{
  // About 30 FPS for purely decorative redraw; game input and camera stay 60 FPS.
  if(elapsed-lastVisualPaint<30)return null;
  lastVisualPaint=elapsed;
  const visualT=reducedMotion?0:elapsed/1000;
  water.clear();atmosphere.clear();motes.clear();portalGlow.clear();
  if(map==='morning_garden'){
   for(let u=10;u<16;u++)for(let v=-2;v<=12;v++){
    if(v>=3&&v<=6)continue;
    const p=toScreen({u,v}),x=p.x+Math.sin(visualT*1.5+u*.66+v*.9)*8;
    water.lineStyle(1,0xecfff7,.31+Math.sin(visualT*1.7+v)*.13).lineBetween(x-9,p.y+3,x+7,p.y+3);
    if((u+v)%4===0)water.fillStyle(0xfcffff,.3).fillRect(x+3,p.y-3,3,2);
    if((u+v)%5===0){
     water.lineStyle(1,0xe5ffff,.16).strokeEllipse(x-3,p.y+5,20+(Math.sin(visualT+u)+1)*8,6);
    }
   }
   // Shimmering shallow reflections sit on the WATER, not over Kitty.
   for(let i=0;i<11;i++){
    const u=10+hashCell(i,7,2)*6,v=i%2?1.2:9.2,p=toScreen({u,v});
    const x=p.x+Math.sin(visualT*.9+i)*17;
    atmosphere.fillStyle(0xf3f7cf,.10+Math.pow(Math.sin(visualT*1.4+i),2)*.13);
    atmosphere.fillEllipse(x,p.y,20,5);
   }
  }
  if(map==='dusk_search'){
   // Ground fog drifts along the creek; it never blocks click targets.
   for(let i=0;i<8;i++){
    const u=48+i*1.85,p=toScreen({u,v:routeLimits(u).max+.4});
    atmosphere.fillStyle(0xd3d3da,.045+Math.pow(Math.sin(visualT*.38+i),2)*.04);
    atmosphere.fillEllipse(p.x+Math.sin(visualT*.22+i)*17,p.y-9,120,15);
   }
  }
  if(map==='night_neighborhood'){
   // Warm halos on the sidewalk complement the 3D house's lit windows.
   for(const u of [67,72,77,81]){
    const p=toScreen({u,v:1.8});
    atmosphere.fillStyle(0xffdcac,.10+Math.sin(visualT*.9+u)*.025);
    atmosphere.fillEllipse(p.x,p.y,95,26);
   }
  }
  // Same particle budget on every phone: morning butterflies/petals,
  // afternoon blossom drift, dusk leaves, night fireflies.
  for(let i=0;i<particles.length;i++){
   const particle=particles[i],base=toScreen(particle);
   const life=(particle.phase+visualT*particle.speed)%1;
   const swing=Math.sin(visualT*1.45+particle.wobble)*13;
   const x=base.x+swing+(life-.5)*12;
   const y=base.y-30+life*49+Math.sin(visualT*.5+particle.wobble)*5;
   const alpha=.22+.53*Math.sin(life*Math.PI);
   if(map==='night_neighborhood'){
    const pulse=Math.pow(Math.sin(visualT*2+i*1.4),2);
    motes.fillStyle(i%3?0xffe0ac:0xf3c1da,(alpha+.15*pulse)*(.55+night*.36));
    motes.fillCircle(x,y,1.3+(i%5===0?1.5:0));
   }else if(map==='dusk_search'){
    motes.fillStyle(i%3?0xc9a0ad:0xe5c5d7,alpha*.6);
    motes.fillEllipse(x,y,3.5,2);
    if(i%7===0){motes.fillStyle(0xf5dea9,alpha*.55);motes.fillCircle(x+4,y-2,1.5);}
   }else{
    const petal=map==='morning_garden'?0xf6bdce:0xe8a1bb;
    motes.fillStyle(i%4===0?0xffe7cc:petal,alpha);
    motes.fillEllipse(x,y,4+(i%3),2.4+(i%2));
    if(map==='morning_garden'&&i%11===0){
     motes.fillStyle(0xf6e8b2,alpha*.9).fillCircle(x+2,y-1,2);
    }
   }
  }
  if(cfg.exit){
   const p=toScreen(cfg.exit),pulse=.36+Math.sin(visualT*2.1)*.10;
   portalGlow.fillStyle(0xfff6d8,.10+pulse*.15).fillEllipse(p.x,p.y-3,105,40);
   portalGlow.lineStyle(2,0xfff2c8,.33+pulse*.34).strokeEllipse(p.x,p.y-3,88,30);
   portalGlow.fillStyle(0xffeed7,.65).fillCircle(p.x,p.y-26+Math.sin(visualT*1.8)*5,3.2);
  }
  return ecology.update(elapsed,player,night);
 };
 update(0,darknessAt(cfg.spawn.u,'intro',map),cfg.spawn);
 return {map,area:rescueArea,water,tiles,parkedVan,update,ecology,
  destroy:()=>{for(const obj of created)if(obj.active)obj.destroy();g.clear();}};
}
