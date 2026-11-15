import Phaser from 'phaser';
import {toScreen,type IsoPoint} from '../isometric';
import {NIGHT_HOUSE} from './night-house-layout';
import type {RescueMapId} from './rescue-overworld';
import {ECOLOGY_CAPS,ecologySeeds,ecologyFloraFrame,ecologyWildlifeStep,
 ecologyAmbientCue,ecologyMicroEvent,type AmbientCue,type WildlifeKind,
 type WildlifeState,type WildlifeFrame,type FloraSeed,type FloraFrame,
 type MicroEvent} from './rescue-ecology';

export type LivingWorld={
 update:(elapsed:number,player:IsoPoint,night:number)=>AmbientCue|null;
 counts:()=>{flora:number;wildlife:number;visibleWildlife:number;reactiveFlora:number;
  alarmedWildlife:number;activeMicroEvent:string;updates:number};
};
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

function paintFlower(g:Phaser.GameObjects.Graphics,seed:FloraSeed,
 frame:FloraFrame,reduced:boolean){
 g.clear();
 const {sway,lean}=frame,bend=sway+lean;
 const stem=seed.kind==='blossom'||seed.kind==='willow'?37:seed.kind==='ivy'?19:15;
 const height=stem*seed.size;
 const tipX=bend,tipY=-height,shade=seed.kind==='ivy'?0x6a9c89:
  seed.kind==='reed'?0x849e78:seed.kind==='grass'?0x739e78:0x7aa583;
 g.fillStyle(0x4a594e,.11).fillEllipse(0,2,18,5);
 g.lineStyle(seed.kind==='blossom'?3:2,shade,.78)
  .lineBetween(0,0,tipX,tipY);
 if(seed.kind==='blossom'){
  // Floating leaf clumps sway independently of static cherry-tree scenery.
  g.fillStyle(0xd998b9,.75).fillEllipse(tipX-10,tipY-3,25,15);
  g.fillStyle(0xffd9e4,.87).fillEllipse(tipX+4,tipY-12,22,15);
  g.fillStyle(0xeab1cb,.79).fillEllipse(tipX+12,tipY-2,20,12);
  g.fillStyle(0xffe9e5,.75).fillRect(tipX-7,tipY-9,3,3);
 }else if(seed.kind==='willow'){
  for(let i=0;i<4;i++){
   const off=(i-1.5)*7,gust=reduced?0:Math.sin(seed.phase+i*1.7+sway*.12)*2;
   g.lineStyle(2,i%2?0xa3bf91:0x7baf91,.75)
    .lineBetween(tipX+off,tipY,tipX+off+gust,tipY+15+(i%2)*4);
  }
  g.fillStyle(0x9ebd99,.65).fillEllipse(tipX,tipY-3,22,8);
 }else if(seed.kind==='grass'||seed.kind==='reed'){
  for(let i=0;i<4;i++){
   const x=(i-1.5)*5;
   g.lineStyle(2,i%2?0xb3b58e:0x84b693,.70)
    .lineBetween(x,1,x+bend*(.6+i*.16)+i*2-4,tipY+(i%3)*6);
  }
  if(seed.kind==='reed'){
   g.fillStyle(0xd9bba5,.80).fillRect(tipX-2,tipY-8,4,9);
  }
 }else if(seed.kind==='ivy'){
  for(let i=0;i<6;i++){
   const x=tipX+Math.sin(i+seed.phase)*7,y=tipY+(i%4)*5;
   g.fillStyle(i%2?0x82a98a:0x5f907d,.62).fillEllipse(x,y,13,7);
  }
 }else{
  const c=seed.id%3===0?0xf3a4b4:seed.id%3===1?0xe7b2cd:0xf7d5af;
  g.fillStyle(c,.83).fillEllipse(tipX,tipY-2,11*frame.open,9*frame.open);
  g.fillStyle(0xffe9b5,.90).fillCircle(tipX,tipY-2,2);
 }
 // Tiny rustle only when Kitty approaches; no additional particle allocations.
 if(Math.abs(lean)>1.2&&!reduced){
  g.fillStyle(0xe8d8b6,frame.glow*.55).fillRect(tipX+9,tipY+8,2,2);
 }
}
function animal(g:Phaser.GameObjects.Graphics,kind:WildlifeKind,
 frame:WildlifeFrame,seed:number){
 g.clear();
 const flap=frame.wing>0?1:0,shadow=kind==='sparrow'||kind==='owl'||
  kind==='moth'||kind==='butterfly'||kind==='crow'?0:.15;
 if(shadow)g.fillStyle(0x252f35,shadow).fillEllipse(0,1,20,5);
 if(kind==='butterfly'||kind==='moth'){
  const light=kind==='butterfly'?0xf6b8cf:0xc9b6cf,
   dark=kind==='butterfly'?0xe294bc:0x9a8ab4;
  g.fillStyle(dark,.92).fillEllipse(-7,-9-flap*2,flap?9:15,flap?14:9);
  g.fillStyle(light,.94).fillEllipse(7,-9-flap*2,flap?9:15,flap?14:9);
  g.fillStyle(0x725a72,.90).fillRect(-1,-11,3,9);
  g.lineStyle(1,0x655167,.82).lineBetween(0,-12,-3,-17);
  g.lineStyle(1,0x655167,.82).lineBetween(0,-12,3,-17);
  return;
 }
 if(kind==='sparrow'||kind==='crow'||kind==='owl'){
  const plumage=kind==='crow'?0x3d4055:kind==='owl'?0x9c8092:0xc6a08d;
  const highlight=kind==='crow'?0x77758c:kind==='owl'?0xdcc4b5:0xe7c7a4;
  const y=-11-frame.lift;
  g.fillStyle(plumage,.97).fillEllipse(0,y,17,11);
  const wingX=frame.wing>0?-12:-8;
  g.fillStyle(highlight,.83).fillEllipse(wingX,y-(flap?9:1),13,flap?7:11);
  g.fillStyle(0xffc48b,.90).fillRect(8,y,5,3);
  if(kind==='owl'){
   g.fillStyle(highlight,.95).fillRect(-9,y-9,5,6).fillRect(5,y-9,5,6);
   g.fillStyle(0xffe9c3).fillCircle(-4,y-2,3).fillCircle(5,y-2,3);
  }
  g.fillStyle(0x3c3540).fillRect(-4,y-3,2,2).fillRect(5,y-3,2,2);
  return;
 }
 // Small mammals are intentionally not full NPCs; they never block a path.
 const coat=kind==='rabbit'?0xe4cfd0:kind==='squirrel'?0xb98275:
  kind==='fox'?0xce927d:0x746779;
 const pale=kind==='rabbit'?0xffedf0:kind==='squirrel'?0xe4ae90:
  kind==='fox'?0xf3caaa:0xbb9eab;
 g.fillStyle(0x33313d,.14).fillEllipse(0,1,24,5);
 if(kind==='squirrel'||kind==='fox'){
  g.fillStyle(coat,.80).fillEllipse(-13,-15,kind==='fox'?19:14,17);
  g.fillStyle(pale,.70).fillRect(-18,-21,5,4);
 }else if(kind==='cat'){
  g.lineStyle(3,coat,.92).lineBetween(-10,-14,-18,-21+frame.wing*2);
 }
 g.fillStyle(coat,.96).fillEllipse(0,-10-frame.lift,23,15);
 g.fillStyle(pale,.92).fillEllipse(3,-10-frame.lift,11,8);
 g.fillStyle(coat,.99).fillEllipse(11,-18-frame.lift,13,12);
 if(kind==='rabbit'){
  g.fillStyle(coat,.96).fillRect(8,-34-frame.lift,5,16)
   .fillRect(15,-33-frame.lift,5,15);
  g.fillStyle(0xd5aab0).fillRect(10,-31-frame.lift,2,11)
   .fillRect(17,-29-frame.lift,2,10);
 }else{
  g.fillStyle(coat,.95).fillRect(6,-25-frame.lift,5,9)
   .fillRect(17,-26-frame.lift,5,10);
 }
 g.fillStyle(0x302b36,.92).fillRect(14,-19-frame.lift,2,2);
 g.fillStyle(0xe8a5ab,.90).fillRect(21,-15-frame.lift,2,2);
 g.fillStyle(coat,.93).fillRect(-6,-4,5,4).fillRect(6,-4,5,4);
 if(frame.alert>.4&&seed%2===0){
  g.fillStyle(0xf8ebc8,frame.alert*.65).fillRect(12,-30-frame.lift,2,3);
 }
}

export function createLivingEcology(
 scene:Phaser.Scene,map:RescueMapId,minU:number,maxU:number,
 center:(u:number)=>number,reducedMotion:boolean
):LivingWorld{
 const seeds=ecologySeeds(map,minU,maxU,center);
 const flora=seeds.flora.map(seed=>{
  const pos=toScreen(seed.p);
  return {seed,graphics:scene.add.graphics().setPosition(pos.x,pos.y)
   .setDepth(pos.y-1)};
 });
 const wildlife=seeds.wildlife.map(seed=>{
  const pos=toScreen(seed.p);
  return {seed,state:{alarm:0,heading:1} as WildlifeState,
   graphics:scene.add.graphics().setPosition(pos.x,pos.y)
    .setDepth(pos.y+1)};
 });
 // Two reusable, world-space buffers, never over player input/hotspots.
 const light=scene.add.graphics().setDepth(.78),micro=scene.add.graphics().setDepth(1702);
 let lastAudioPeriod=-1,lastMicroPeriod=-1;
 let event:MicroEvent|null=null,occurred=0,updates=0;
 let visibleWildlife=0,reactiveFlora=0,alarmedWildlife=0;
 let previousElapsed=0;
 const update=(elapsed:number,player:IsoPoint,night:number):AmbientCue|null=>{
  const dt=clamp(elapsed-previousElapsed,0,70);
  previousElapsed=elapsed;updates++;
  visibleWildlife=0;reactiveFlora=0;alarmedWildlife=0;
  for(const item of flora){
   const range=Math.abs(item.seed.p.u-player.u);
   item.graphics.setVisible(range<8.4);
   if(range>=8.4)continue;
   const f=ecologyFloraFrame(item.seed,elapsed,player,reducedMotion);
   if(Math.abs(f.lean)>1.1)reactiveFlora++;
   paintFlower(item.graphics,item.seed,f,reducedMotion);
  }
  for(const item of wildlife){
   const range=Math.abs(item.seed.p.u-player.u);
   item.graphics.setVisible(range<8.0);
   if(range>=8.0)continue;
   visibleWildlife++;
   const next=ecologyWildlifeStep(item.seed,item.state,elapsed,dt,player,reducedMotion);
   item.state=next.state;
   if(item.state.alarm>.25)alarmedWildlife++;
   const base=toScreen(item.seed.p);
   item.graphics.setPosition(base.x+next.frame.x,base.y+next.frame.y)
    .setDepth(base.y+next.frame.y+1)
    .setScale(item.seed.size); // Same reusable Graphics, no per-frame allocations.
   animal(item.graphics,item.seed.kind,next.frame,item.seed.id);
  }
  light.clear();micro.clear();
  const t=reducedMotion?0:elapsed/1000;
  if(map==='morning_garden'){
   // Golden dappled sunlight plus tiny circles on the RIVER bank.
   for(let i=0;i<5;i++){
    const u=10.25+i*1.15,pos=toScreen({u,v:i%2?8.2:1.6});
    light.fillStyle(0xfffae1,.06+.04*Math.pow(Math.sin(t*.65+i),2))
     .fillEllipse(pos.x+Math.sin(t*.9+i)*10,pos.y,78,16);
    const ripple=11+Math.sin(t*1.8+i*2)*5;
    light.lineStyle(1,0xe6f8ee,.16).strokeEllipse(pos.x,pos.y+3,ripple*2,ripple*.6);
   }
  }else if(map==='afternoon_meeting'){
   // Long golden stripes in a clearing, without masking the grass path.
   for(let i=0;i<6;i++){
    const u=25+i*3.3,pos=toScreen({u,v:center(u)+(i%2?2.7:-2.4)});
    light.fillStyle(0xffdfa5,.095+.027*Math.sin(t*.4+i))
     .fillEllipse(pos.x,pos.y+3,118,19);
    light.lineStyle(1,0xffe5bf,.15).lineBetween(pos.x-24,pos.y-4,pos.x+36,pos.y-9);
   }
  }else if(map==='dusk_search'){
   for(let i=0;i<8;i++){
    const u=48+i*1.8,pos=toScreen({u,v:center(u)+(i%2?3.3:-2.8)});
    light.fillStyle(0xdbc4dc,.035+.027*Math.sin(t*.35+i))
     .fillEllipse(pos.x+Math.sin(t*.28+i)*14,pos.y-6,119,18);
    if(i%2===0){
     light.fillStyle(0xffd59f,.13+.12*Math.pow(Math.sin(t*1.5+i),2))
      .fillCircle(pos.x+Math.sin(t+i)*17,pos.y-25,2.4);
    }
   }
  }else{
   const house=toScreen(NIGHT_HOUSE.center),x=house.x,y=house.y;
   // Flickering, drawn INSIDE existing windows. Curtains sway; one window
   // grows dim from time to time, without jump-scaring the player.
   const w=225,h=161,d=105;
   const windows:[number,number][]=[
    [-.44,-.27],[-.17,-.30],[.22,-.28],[.39,-.19],
    [-.44,-.72],[-.20,-.69]
   ];
   for(let i=0;i<Math.min(ECOLOGY_CAPS.glowWindows,windows.length);i++){
    const [xx,yy]=windows[i],wx=x+xx*w,wy=y+yy*h+d*(xx<0?.16:.11);
    const flicker=Math.pow(Math.sin(t*.41+i*1.7),2);
    const dark=i===3&&Math.floor(t/19)%3===1;
    const alpha=(dark?.035:.11+.06*flicker)*(.6+night*.4);
    light.fillStyle(i%2?0xffdfb6:0xfff4cd,alpha)
     .fillRect(wx+3,wy+3,13,17);
    light.fillStyle(0xc8a9ba,.23).fillRect(wx+5+Math.sin(t*.6+i)*2,wy+3,3,17);
   }
   for(let i=0;i<4;i++){
    const p=toScreen({u:67+i*4.5,v:1.8});
    light.fillStyle(0xffe4ad,.08+.05*Math.pow(Math.sin(t*.62+i),2))
     .fillEllipse(p.x,p.y-104,49,58);
    light.fillStyle(0xffd59e,.09).fillEllipse(p.x,p.y-2,101,22);
   }
   // Thin fog rolls *behind* the porch and front path.
   for(let i=0;i<5;i++){
    const u=68+i*2.7,p=toScreen({u,v:5.75});
    light.fillStyle(0xc6c6d6,.025+.013*Math.sin(t*.26+i))
     .fillEllipse(p.x+Math.sin(t*.19+i)*16,p.y,115,10);
   }
  }
  const microPeriod=Math.floor(elapsed/7600);
  if(microPeriod>0&&microPeriod!==lastMicroPeriod){
   event=ecologyMicroEvent(map,microPeriod,minU,maxU,center);
   lastMicroPeriod=microPeriod;occurred=elapsed;
  }
  if(event&&elapsed-occurred<2400&&!reducedMotion&&
   Math.abs(player.u-event.at.u)<8){
   const p=toScreen(event.at),life=(elapsed-occurred)/2400;
   const alpha=(1-life)*.25;
   if(event.kind==='gust'||event.kind==='flutter'){
    for(let i=0;i<4;i++){
     micro.fillStyle(event.kind==='gust'?0xece0cc:0xf7c3d5,alpha*(.8+i*.1))
      .fillEllipse(p.x-14+i*12+life*31,p.y-i*5-life*18,5,2.5);
    }
   }else if(event.kind==='ripples'){
    micro.lineStyle(1,0xd8f4ef,alpha*1.2)
     .strokeEllipse(p.x,p.y,26+life*42,6+life*10);
   }else if(event.kind==='glint'||event.kind==='window'){
    micro.lineStyle(1,0xffd7b5,alpha).lineBetween(p.x-12,p.y,p.x+12,p.y);
    micro.lineStyle(1,0xffe7cb,alpha).lineBetween(p.x,p.y-10,p.x,p.y+10);
   }
  }
  // Ambient events are independent of render frame rate and never start
  // during the first few seconds of an act or on every player movement.
  const audioPeriod=Math.floor(elapsed/ECOLOGY_CAPS.minAmbientGapMs);
  if(audioPeriod>0&&audioPeriod!==lastAudioPeriod){
   lastAudioPeriod=audioPeriod;
   return ecologyAmbientCue(map,elapsed,player,minU,maxU,center);
  }
  return null;
 };
 return {update,counts:()=>({
  flora:flora.length,wildlife:wildlife.length,visibleWildlife,
  reactiveFlora,alarmedWildlife,activeMicroEvent:event?.kind??'',
  updates
 })};
}
