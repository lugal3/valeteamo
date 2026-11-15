import Phaser from 'phaser';
import {CHARACTERS,type CharacterId} from './characters';
import {buildArt} from './art';
import {buildChibi} from './chibi-art';
import {installReferenceCharacter} from './reference-characters';
import {facingOf,type Facing} from './animation';
import {ISO,constrain,isoDistance,screenVector,toScreen,type IsoPoint} from './isometric';
import {Sound} from './audio';
import {RESCUE_FEEL,feelMotion,feelGait,feelCameraOffset,
 feelSurfaceAt,FEEL_FOOTSTEP,feelCompanion,feelFacingToTarget,
 type FeelSurface} from './demo/rescue-game-feel';
import {ABDUCTION_TIMING,abductionFrame,captorFrame,captorTexture,
 installRescueAbductionTextures,vanTexture,VAN_NIGHT_POSITION,VAN_PLATE,
 type AbductionPhase} from './demo/abduction-van';
import {NIGHT_INTERACTION_RADIUS,NIGHT_WINDOW_INTERACTION_RADIUS,nightAutoRoute,nightNavigationDistance} from './demo/night-house-layout';
import {installProloguePeople,luisTextureKey,luisAnimationFrame,
 type LuisFacing,type LuisPose} from './demo/prologue-art';
import {LUIS_BEATS,makeLuisMotion,luisEntryPoint,luisPointOnPath,
 luisMotionIsBlocking,type LuisMotion} from './demo/luis-choreography';
import {buildRescueOverworld,constrainRescue,darknessAt,STORY_POSITIONS,storyArrivalPoint,
 mapForStage,exitReady,RESCUE_SCENES,
 type RescueMapId,type RescueOverworld,type RouteArea} from './demo/rescue-overworld';

export type AdventureOffer={name:string,description:string};
export type AdventureHud={hp:number,objective:string,complete:number,total:number,bombs:number,shield:boolean,offer?:AdventureOffer,bossHp?:number,bossMax?:number};
type Enemy={p:IsoPoint,s:Phaser.GameObjects.Sprite,shadow:Phaser.GameObjects.Ellipse,hp:number,boss:boolean,kind:'kuromi'|'cinna',next:number,flash:number,phase:number};
type Shot={p:IsoPoint,du:number,dv:number,life:number,enemy:boolean,s:Phaser.GameObjects.Text};
type Burst={x:number,y:number,at:number,color:number};
type Danger={p:IsoPoint,at:number};
type Stick={id:number,x:number,y:number,dx:number,dy:number};
type FloatingNote={s:Phaser.GameObjects.Text,y:number,at:number};

// La historia es una extensión optativa de ESTA MISMA escena Phaser.
// Sin bridge, 2D Corazones conserva exactamente su juego, controles y cámara.
export type IsoStoryStage='intro'|'defend'|'talk-louis'|'talk-luis'|'walk-together'|
 'disappearance'|'ribbon'|'petals'|'wheel'|'door'|'window'|'house';
export type IsoStoryBridge={
 stage:()=>IsoStoryStage;
 objective:(stage:IsoStoryStage)=>string;
 locked:()=>boolean;
 near:(label:string)=>void;
 ready:()=>void;
 interact:(stage:IsoStoryStage)=>void;
 victory:()=>void;
 clearing:()=>void;
 health:(hp:number)=>void;
 retry:()=>void;
 arrive:()=>void;
 guide:(message:string)=>void;
 dusk:(value:number)=>void;
 area:(area:RouteArea)=>void;
 map:(map:RescueMapId)=>void;
 travel:(map:RescueMapId,commit:()=>void)=>void;
};
type StoryActor=Phaser.GameObjects.Image;


export class IsoAdventure extends Phaser.Scene {
 player!:Phaser.GameObjects.Sprite;shadow!:Phaser.GameObjects.Ellipse;floor!:Phaser.GameObjects.Graphics;fx!:Phaser.GameObjects.Graphics;
 p:IsoPoint={u:0,v:0};keys!:Record<string,Phaser.Input.Keyboard.Key>;left?:Stick;right?:Stick;mouse=false;facing:Facing='down';
 enemies:Enemy[]=[];shots:Shot[]=[];collectibles:{p:IsoPoint,s:Phaser.GameObjects.Text}[]=[];
 charm?:{p:IsoPoint,s:Phaser.GameObjects.Text};pendingOffer=false;declinedCharm=false;shield=false;
 bursts:Burst[]=[];dangers:Danger[]=[];clock=0;last=0;inv=0;hp=6;bombs=2;paused=false;ended=false;wonAt=0;dyingAt=0;moveClock=0;lastStep=0;collected=0;total=0;shotDir={x:0,y:0};
 notes:FloatingNote[]=[];
 reducedMotion=typeof window!=='undefined'&&!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 private cancel=()=>this.clearInput();
 storyStage:IsoStoryStage='intro';
 storyObjects:Phaser.GameObjects.GameObject[]=[];
 storyLouis?:StoryActor;storyLuis?:StoryActor;storyVillain?:StoryActor;
 storyLouisWalk?:{from:{x:number;y:number};to:{x:number;y:number};elapsed:number;duration:number};
 storyAbduction?:{elapsed:number;origin:IsoPoint;phase:AbductionPhase;done:()=>void;
  van:Phaser.GameObjects.Image;fox:Phaser.GameObjects.Image;
  rabbit:Phaser.GameObjects.Image;dust:Phaser.GameObjects.Graphics};
 storyVanInspected=false;storyVanNear=false;
 storyLuisShadow?:Phaser.GameObjects.Ellipse;
 storyLuisMotion?:LuisMotion;storyLuisReady=false;storyLuisArriving=false;
 storyLuisFarewell=false;
 storyWorld?:RescueOverworld;storyDusk=0;storyGuideStep=-1;
 storyArea:RouteArea='sendero';storyMap:RescueMapId='morning_garden';storyExitPending=false;
 storyActionPressed=false;storyNear='';storyWalkTriggered=false;storyVictoryEmitted=false;
 storyTarget:IsoPoint={u:22,v:4.5};
 houseRoute:IsoPoint[]=[];houseLastHint='';
 storyVelocity:IsoPoint={u:0,v:0};
 storyLookAhead={x:0,y:0};
 storyStepTravel=0;storyInteractUntil=0;
 storyFootprints:{x:number;y:number;at:number;kind:FeelSurface;side:number}[]=[];
 storyCompanionClock=0;storyFollowHeading={x:1,y:0};
 constructor(public level:1|2|3,public character:CharacterId,public report:(h:AdventureHud)=>void,public finish:(outcome:'win'|'dead')=>void,public onPause:(v:boolean)=>void,public audio:Sound,public ready:()=>void,public progress:(n:number)=>void=()=>{},public story?:IsoStoryBridge){super('iso-adventure');}
 preload(){const path=CHARACTERS[this.character].chibiSpriteSheet;if(path)this.load.spritesheet(`chibi-${this.character}-sheet`,path,{frameWidth:32,frameHeight:40});else{this.load.image(`${this.character}-reference-source`,new URL(`./sprites/${this.character}-reference-sheet.png`,document.baseURI).href);this.load.image(`${this.character}-walk-source`,new URL(`./sprites/${this.character}-walk-sheet.png`,document.baseURI).href);}if(this.story){
 this.load.image('louis-reference-source',new URL('./sprites/louis-reference-sheet.png',document.baseURI).href);
 this.load.image('louis-walk-source',new URL('./sprites/louis-walk-sheet.png',document.baseURI).href);
}
this.load.on('progress',(n:number)=>this.progress(60+n*30));}
 create(){
  buildArt(this);buildChibi(this);if(!CHARACTERS[this.character].chibiSpriteSheet)installReferenceCharacter(this,this.character);this.floor=this.add.graphics().setDepth(0);this.fx=this.add.graphics().setDepth(1000);
  if(this.story){
   installRescueAbductionTextures(this);
   this.storyMap=mapForStage(this.story.stage());
   this.storyWorld=this.createStoryWorld(this.storyMap);
  }else this.drawFloor();
  this.shadow=this.add.ellipse(0,0,30,10,0x425c4c,.25);this.player=this.add.sprite(0,0,`chibi-${this.character}-down-0`).setOrigin(.5,.9).setScale(1.3);
  this.p={u:.7,v:.7};this.positionPlayer();this.fitCamera(this.scale.width,this.scale.height);this.scale.on('resize',(size:{width:number,height:number})=>this.fitCamera(size.width,size.height));this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,B,SPACE,ESC,E') as Record<string,Phaser.Input.Keyboard.Key>;
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.paused||this.pendingOffer||this.ended||this.wonAt)return;if(p.wasTouch){const stick={id:p.id,x:p.x,y:p.y,dx:0,dy:0};if(p.x<this.scale.width/2&&!this.left)this.left=stick;else if(p.x>=this.scale.width/2&&!this.right)this.right=stick;}else this.mouse=true;});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{for(const stick of [this.left,this.right])if(stick?.id===p.id){stick.dx=p.x-stick.x;stick.dy=p.y-stick.y;}});
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.left?.id===p.id)this.left=undefined;if(this.right?.id===p.id)this.right=undefined;if(!p.wasTouch)this.mouse=false;});
  this.input.on('gameout',()=>{if(!this.input.activePointer.isDown)this.clearInput();});this.game.canvas.addEventListener('pointercancel',this.cancel);
  this.input.keyboard!.on('keydown-B',()=>this.bomb());this.input.keyboard!.on('keydown-SPACE',()=>this.bomb());this.input.keyboard!.on('keydown-ESC',()=>this.setPaused(!this.paused));
  this.events.once('shutdown',()=>this.game.canvas.removeEventListener('pointercancel',this.cancel));
  if(this.story){
   if(!CHARACTERS.louis.chibiSpriteSheet)installReferenceCharacter(this,'louis');
   installProloguePeople(this);
   this.setStoryStage(this.story.stage(),true);
  }
  else if(this.level===1){for(const p of [{u:6,v:1},{u:2,v:6},{u:6,v:6}]){const xy=toScreen(p),s=this.add.text(xy.x,xy.y-12,'✦',{fontFamily:'Georgia',fontSize:'26px',color:'#ffe4a2',stroke:'#a66f7b',strokeThickness:2}).setOrigin(.5,1).setDepth(xy.y);this.collectibles.push({p,s});}this.total=3;}
  else if(!this.story){const list=this.level===2?[{u:5,v:2},{u:2,v:5},{u:6,v:6}]:[{u:5,v:5}];for(const [i,p] of list.entries())this.spawnEnemy(p,this.level===3,i===1?'cinna':'kuromi');this.total=list.length;}
  if(this.level>1&&!this.story){const p={u:3.4,v:3.4},xy=toScreen(p),s=this.add.text(xy.x,xy.y-12,'✧',{fontFamily:'Georgia',fontSize:'25px',color:'#ffe1a0',stroke:'#9a6c78',strokeThickness:2}).setOrigin(.5,1).setDepth(xy.y);this.charm={p,s};}
  this.sync();this.progress(100);this.ready();this.story?.ready();
 }

 // Sólo sustituye el TERRENO. Sprite, Phaser.Scene, cámara y controles son los del arcade.
 createStoryWorld(map:RescueMapId){
  return buildRescueOverworld(this,this.floor,{
   flower:(u,v)=>this.flower(u,v),shrub:(u,v)=>this.shrub(u,v),
   tree:(u,v)=>this.tree(u,v),mushroom:(u,v)=>this.mushroom(u,v)
  },map);
 }
 changeStoryMap(map:RescueMapId){
  if(!this.story||map===this.storyMap)return;
  this.storyWorld?.destroy();
  this.houseRoute=[];this.houseLastHint='';
  this.resetStoryFeel();
  this.storyVanInspected=false;this.storyVanNear=false;
  this.storyMap=map;
  this.storyWorld=this.createStoryWorld(map);
  this.storyExitPending=false;this.storyGuideStep=-1;
  this.clearInput();
  this.p={...RESCUE_SCENES[map].spawn};this.positionPlayer();
  // Instant camera reposition happens under the full-screen black fade.
  const xy=toScreen(this.p);this.cameras.main.centerOn(xy.x,xy.y);
  if(this.storyStage!=='intro')this.setStoryStage(this.storyStage,true);
  this.story.map(map);this.story.area(this.storyWorld.area(this.p.u));
  const dusk=darknessAt(this.p.u,this.storyStage,map);
  this.storyDusk=dusk;this.story.dusk(dusk);
 }
 checkStoryExit(){
  if(!this.story||this.storyExitPending)return false;
  const def=RESCUE_SCENES[this.storyMap],exit=def.exit;
  if(!exit||!exitReady(this.storyMap,this.storyStage))return false;
  if(this.p.u<exit.u||Math.abs(this.p.v-exit.v)>2.0)return false;
  this.storyExitPending=true;this.clearInput();
  this.story.travel(exit.to,()=>{
   this.changeStoryMap(exit.to);
   if(exit.to==='afternoon_meeting'&&this.storyStage==='intro')this.story?.arrive();
  });
  return true;
 }
 // Cada capítulo tiene un terreno propio, una salida brillante y su iluminación.
 // La historia conserva los sprites del Corazones original; no recreamos el motor.
 setStoryStage(stage:IsoStoryStage,force=false){
  if(!this.story||(!force&&this.storyStage===stage))return;
  const previousLouis=this.storyLouis?.active?
   {x:this.storyLouis.x,y:this.storyLouis.y}:undefined;
  this.storyStage=stage;this.storyWalkTriggered=false;this.storyVictoryEmitted=false;
  this.storyActionPressed=false;this.storyNear='';
  this.houseRoute=[];this.houseLastHint='';
  this.resetStoryFeel();
  for(const o of this.storyObjects)o.destroy();this.storyObjects=[];
  for(const e of this.enemies){e.s.destroy();e.shadow.destroy();}this.enemies=[];
  for(const shot of this.shots)shot.s.destroy();this.shots=[];
  for(const light of this.collectibles)light.s.destroy();this.collectibles=[];
  this.dangers=[];this.bursts=[];this.charm=undefined;this.pendingOffer=false;
  this.storyLouis=undefined;this.storyLuis=undefined;this.storyVillain=undefined;
  this.storyLouisWalk=undefined;this.storyAbduction=undefined;
  this.storyLuisShadow=undefined;this.storyLuisMotion=undefined;
  this.storyLuisReady=false;this.storyLuisArriving=false;this.storyLuisFarewell=false;
  this.story.near('');
  if(force)this.p=storyArrivalPoint(stage);
  this.p=constrainRescue(this.p,this.storyMap);this.positionPlayer();
  this.story.map(this.storyMap);
  const startArea=this.storyWorld?.area(this.p.u);
  if(startArea){this.storyArea=startArea;this.story.area(startArea);}
  this.total=stage==='defend'?3:0;this.collected=0;
  const actor=(id:'louis'|'luis',p:IsoPoint)=>{
   const xy=toScreen(p);
   const name=id==='louis'?'chibi-louis-down-0':luisTextureKey('down','idle',0);
   const image=this.add.image(xy.x,xy.y,name).setOrigin(.5,.9)
    .setScale(id==='louis'?1.3:.8).setDepth(xy.y);
   this.storyObjects.push(image);return image;
  };
  const marker=(symbol:string,p:IsoPoint)=>{
   const xy=toScreen(p),isHouse=this.storyMap==='night_neighborhood';
   if(isHouse){
    const ring=this.add.ellipse(xy.x,xy.y,77,31,0xffe2ba,.26)
     .setDepth(xy.y+3);
    ring.setStrokeStyle(3,0xffe0b9,.96);
    this.storyObjects.push(ring);
    if(!this.reducedMotion)this.tweens.add({targets:ring,alpha:.42,
     scaleX:1.15,scaleY:1.15,duration:1050,yoyo:true,repeat:-1});
   }
   const label=this.add.text(xy.x,xy.y-(isHouse?25:16),symbol,{
    fontFamily:'Georgia',fontSize:isHouse?'34px':'26px',color:'#fff4cf',
    stroke:'#764f78',strokeThickness:4
   }).setOrigin(.5,1).setDepth(xy.y+12);
   this.storyObjects.push(label);
  };
  this.storyTarget={...STORY_POSITIONS[stage]};
  if(stage==='defend'){
   for(const p of [{u:24.6,v:3.4},{u:26.2,v:5.7},{u:28,v:4.2}])this.spawnEnemy(p,false);
   this.story.guide('Las sombras se acercan. ¡Apunta con las flechas, el mouse o el joystick derecho!');
  }
  if(stage==='talk-louis'){
   // Louis walks out of the garden after combat, never popping into existence.
   const origin={u:this.storyTarget.u+1.6,v:this.storyTarget.v+.4};
   this.storyLouis=actor('louis',origin);
   this.storyLouisWalk={from:toScreen(origin),to:toScreen(this.storyTarget),
    elapsed:0,duration:1300};
  }
  if(stage==='talk-luis'){
   // Luis waits at the side-path entrance; Kitty sees him WALK INTO the clearing
   // before the interaction appears. Nobody materializes at the conversation spot.
   const origin=constrainRescue(luisEntryPoint(this.storyTarget),this.storyMap);
   this.storyLuis=actor('luis',origin);
   const xy=toScreen(origin);
   this.storyLuisShadow=this.add.ellipse(xy.x,xy.y+2,31,9,0x534859,.23)
    .setDepth(xy.y-1);
   this.storyObjects.push(this.storyLuisShadow);
   const next=toScreen({u:35.3,v:6.3});
   this.storyLouis=actor('louis',{u:35.3,v:6.3});
   if(previousLouis){
    this.storyLouis.setPosition(previousLouis.x,previousLouis.y);
    this.storyLouisWalk={from:previousLouis,to:next,elapsed:0,
     duration:Math.max(900,Math.min(2900,Math.hypot(next.x-previousLouis.x,next.y-previousLouis.y)*8))};
   }
   this.story.guide('Luis viene por el camino entre los cerezos. ¡Acércate a saludarlo! ♡');
  }
  if(stage==='walk-together'){
   this.storyLouis=actor('louis',{u:35.5,v:4.6});
   if(previousLouis)this.storyLouis.setPosition(previousLouis.x,previousLouis.y)
    .setDepth(previousLouis.y);
   marker('✿',this.storyTarget);
  }
  if(stage==='disappearance'){
   // Preserve the ACTUAL follower's last position, not a fake spawn.
   this.storyLouis=actor('louis',{u:this.p.u+.32,v:this.p.v+.20});
   if(previousLouis)this.storyLouis.setPosition(previousLouis.x,previousLouis.y)
    .setDepth(previousLouis.y);
   this.story?.guide('Un motor se acerca por el camino…');
  }
  if(['ribbon','petals','wheel'].includes(stage)){
   marker(stage==='ribbon'?'✧':stage==='petals'?'✿':'⌁',this.storyTarget);
  }
  if(stage==='door'||stage==='window')marker(stage==='door'?'⚿':'✧',this.storyTarget);
  const dark=darknessAt(this.p.u,stage,this.storyMap);
  if(Math.abs(dark-this.storyDusk)>.01){this.storyDusk=dark;this.story.dusk(dark);}
  // Music follows narrative tension and map, not an arbitrary coordinate.
  const eerie=this.storyMap==='dusk_search'||this.storyMap==='night_neighborhood'||
   stage==='disappearance'||dark>.30;
  this.audio.setTheme(stage==='defend'?'battle':eerie?'final':'garden');
  if(stage==='ribbon'&&this.storyMap==='afternoon_meeting')
   this.story.guide('Busca el sendero brillante: las pistas continúan en el bosque ✧');
  if(stage==='door'&&this.storyMap==='dusk_search')
   this.story.guide('Sigue las luces: la casa está al otro lado de la salida ✧');
  this.sync();
 }
 storyInteract(){
  if(!this.story||this.story.locked()||luisMotionIsBlocking(this.storyLuisMotion)||!this.storyNear)return;
  const interactionAt=this.storyVanNear?VAN_NIGHT_POSITION:this.storyTarget;
  const foot=toScreen(this.p),target=toScreen(interactionAt);
  this.facing=feelFacingToTarget(target.x-foot.x,target.y-foot.y,this.facing);
  this.storyInteractUntil=this.clock+RESCUE_FEEL.interactMs;
  this.storyVelocity={u:0,v:0};this.storyStepTravel=0;
  this.audio.tone(810,.085,.010,'sine');
  if(this.storyVanNear){
   this.storyVanInspected=true;this.houseRoute=[];
   this.audio.ui();this.audio.tone(460,.19,.033,'triangle');
   this.burst(VAN_NIGHT_POSITION,0xffd5a2);
   this.floatNote(VAN_NIGHT_POSITION,VAN_PLATE,'#ffe7cb');
   this.story.guide('¡La misma furgoneta! Media luna y matrícula LUNA-07. Está junto a la casa…');
   this.storyWorld?.parkedVan?.setTint(0xffdfb2);
   return;
  }
  this.houseRoute=[];this.audio.ui();
  if(this.storyMap==='night_neighborhood'){
   this.burst(this.storyTarget,0xffd9b5);
   this.audio.tone(710,.16,.028,'triangle');
  }
  this.story.interact(this.storyStage);
 }
 startHouseGuide(){
  if(!this.story||this.storyMap!=='night_neighborhood'||
   !['door','window'].includes(this.storyStage)||this.story.locked())return false;
  if(this.houseRoute.length){this.houseRoute=[];this.story.guide('Guía pausada. Puedes seguir caminando con el joystick.');return false;}
  if(nightNavigationDistance(this.p,this.storyTarget)<(this.storyStage==='window'?NIGHT_WINDOW_INTERACTION_RADIUS:NIGHT_INTERACTION_RADIUS)){
   this.updateStoryActors(0);return false;
  }
  const path=nightAutoRoute(this.p,this.storyTarget);
  if(!path.length){
   this.story.guide('Acércate por la vereda; la casa tiene un pequeño sendero iluminado.');
   return false;
  }
  this.houseRoute=path;
  this.story.guide(this.storyStage==='door'?
   'Sigue las baldosas iluminadas hasta la puerta principal ♡':
   'Da la vuelta por el patio frontal hasta la ventana entreabierta ♡');
  this.audio.tone(770,.13,.016);
  return true;
 }
 startVanGuide(){
  if(!this.story||this.storyMap!=='night_neighborhood'||
   !['door','window'].includes(this.storyStage)||this.story.locked())return false;
  if(this.houseRoute.length){
   this.houseRoute=[];this.story.guide('Guía pausada. Puedes caminar libremente.');
   return false;
  }
  if(isoDistance(this.p,VAN_NIGHT_POSITION)<1.8){
   this.updateStoryActors(0);return false;
  }
  const route=nightAutoRoute(this.p,VAN_NIGHT_POSITION);
  if(!route.length){
   this.story.guide('Sigue la vereda: la furgoneta está junto a la calle.');
   return false;
  }
  this.houseRoute=route;
  this.audio.tone(650,.13,.014);
  this.story.guide('La misma furgoneta… Acércate para examinar la matrícula.');
  return true;
 }
 storyTeleportForTest(_unused:number){
  if(!this.story)return;
  const target=this.storyStage==='intro'?
   {...RESCUE_SCENES.morning_garden.exit!}:this.storyTarget;
  this.p=constrainRescue(target,this.storyMap);
  this.positionPlayer();this.updateStoryActors(0);
 }
 storyExitForTest(){
  if(!this.story)return;
  const exit=RESCUE_SCENES[this.storyMap].exit;
  if(!exit)return;
  this.p=constrainRescue(exit,this.storyMap);this.positionPlayer();
  this.updateStoryActors(0);
 }
 // A compact, deterministic 4-beat cinematic that lives inside the same
 // Phaser game loop. No timer, new renderer, or blocking dialog overlay.
 startLuisArrival(){
  if(!this.storyLuis||this.storyLuisArriving||this.storyLuisReady||
   this.storyStage!=='talk-luis')return;
  this.storyLuisArriving=true;this.story?.near('');this.storyNear='';
  this.storyLuisMotion=makeLuisMotion('arriving',this.storyTarget);
  this.clearInput();
 }
 playStoryLuisFarewell(done:()=>void){
  if(this.storyStage!=='talk-luis'||!this.storyLuis?.active){done();return;}
  if(this.storyLuisFarewell)return;
  this.storyLuisFarewell=true;this.story?.near('');this.storyNear='';
  this.clearInput();
  this.storyLuisMotion=makeLuisMotion('farewell-wave',this.storyTarget,done);
  this.story?.guide('Luis se despide con la mano y vuelve caminando al sendero ♡');
  this.luisHeart(this.storyTarget);
 }
 luisHeart(p:IsoPoint){
  const at=toScreen(p);
  const sparkle=this.add.text(at.x,at.y-53,'♡',{fontFamily:'Georgia',
   fontSize:'21px',color:'#ffdde8',stroke:'#a56e8e',strokeThickness:2})
   .setOrigin(.5).setDepth(at.y+14);
  this.storyObjects.push(sparkle);
  this.tweens.add({targets:sparkle,y:at.y-80,alpha:0,
   duration:this.reducedMotion?180:700,ease:'Sine.easeOut',
   onComplete:()=>sparkle.destroy()});
 }
 updateLuisCinematic(dt:number){
  const motion=this.storyLuisMotion,npc=this.storyLuis;
  if(!motion||!npc?.active||!this.story)return;
  motion.elapsed=Math.min(motion.duration,motion.elapsed+dt);
  const p=luisPointOnPath(motion),xy=toScreen(p);
  npc.setPosition(xy.x,xy.y).setDepth(xy.y);
  this.storyLuisShadow?.setPosition(xy.x,xy.y+2).setDepth(xy.y-1);
  if(motion.elapsed<motion.duration)return;
  const completed=motion.kind,done=motion.done;
  if(completed==='arriving'){
   this.storyLuisMotion=makeLuisMotion('greeting',this.storyTarget);
   this.luisHeart(this.storyTarget);
  }else if(completed==='greeting'){
   this.storyLuisMotion=undefined;this.storyLuisReady=true;
   this.story.guide('¡Luis te encontró! Acércate y presiona E para hablar ♡');
  }else if(completed==='farewell-wave'){
   this.storyLuisMotion=makeLuisMotion('farewell-walk',this.storyTarget,done);
  }else{
   // Stage will change only after Luis has visibly walked away.
   this.storyLuisMotion=undefined;
   npc.setVisible(false);this.storyLuisShadow?.setVisible(false);
   done?.();
  }
 }
 animateStoryLuis(){
  const npc=this.storyLuis;
  if(!npc?.active||!this.story)return;
  const motion=this.storyLuisMotion,kitty=toScreen(this.p);
  let dx=kitty.x-npc.x,dy=kitty.y-npc.y;
  let pose:LuisPose='idle',facing:LuisFacing='down';
  if(motion){
   pose=motion.kind==='arriving'||motion.kind==='farewell-walk'?'walk':'wave';
   if(pose==='walk'){
    const start=toScreen(motion.from),end=toScreen(motion.to);
    dx=end.x-start.x;dy=end.y-start.y;
    facing=dy< -38&&Math.abs(dx)<32?'up':Math.abs(dx)>28?'right':'down';
   }
  }else{
   facing=dy< -46&&Math.abs(dx)<27?'up':Math.abs(dx)>32?'right':'down';
   // During the RPG dialogue Luis keeps speaking (even while player input locks).
   if(this.storyStage==='talk-luis'&&this.story.locked())pose='talk';
  }
  const clock=motion?motion.elapsed:this.clock;
  const frame=luisAnimationFrame(clock,pose,this.reducedMotion);
  const texture=luisTextureKey(facing,pose,frame);
  if(npc.texture.key!==texture&&this.textures.exists(texture))npc.setTexture(texture);
  npc.setFlipX(facing==='right'&&dx<0);
 }
 playStoryAbduction(done:()=>void){
  // La furgoneta llega, los captores bajan con máscaras, sujetan a Louis,
  // lo suben por la puerta lateral y vuelven a escapar físicamente.
  if(this.storyAbduction)return;
  if(!this.storyLouis?.active){done();return;}
  this.clearInput();this.story?.near('');this.storyNear='';
  // Anchor the whole chase to Louis's REAL screen-space foot position, not
  // an invented spot near Kitty. This avoids the last visible 20–40px snap.
  const wx=(this.storyLouis.x-ISO.originX)/(ISO.tileW/2);
  const wy=(this.storyLouis.y-ISO.originY)/(ISO.tileH/2);
  const origin={u:(wx+wy)/2-.32,v:(wy-wx)/2-.20};
  const pose=abductionFrame(0,origin),vp=toScreen(pose.van);
  const van=this.add.image(vp.x,vp.y,vanTexture(false))
   .setOrigin(.5,.88).setScale(1.02).setDepth(vp.y+10);
  const createCaptor=(mask:'fox'|'rabbit')=>{
   const point=toScreen(mask==='fox'?pose.fox:pose.rabbit);
   return this.add.image(point.x,point.y,captorTexture(mask,'idle',0))
    .setOrigin(.5,.94).setScale(1.08).setDepth(point.y+4).setVisible(false);
  };
  const fox=createCaptor('fox'),rabbit=createCaptor('rabbit');
  const dust=this.add.graphics().setDepth(vp.y+12);
  this.storyObjects.push(van,fox,rabbit,dust);
  this.storyAbduction={elapsed:0,origin,phase:'arrival',done,van,fox,rabbit,dust};
  this.audio.tone(130,.24,.035,'sawtooth');
  this.story?.guide('Una furgoneta se detiene. ¡Dos figuras con máscaras de animales!');
 }
 updateStoryLouisArrival(dt:number){
  const motion=this.storyLouisWalk,npc=this.storyLouis;
  if(!motion||!npc?.active)return;
  motion.elapsed=Math.min(motion.duration,motion.elapsed+dt);
  const t=motion.elapsed/motion.duration,e=t*t*(3-2*t);
  const x=motion.from.x+(motion.to.x-motion.from.x)*e;
  const y=motion.from.y+(motion.to.y-motion.from.y)*e;
  npc.setPosition(x,y).setDepth(y);
  const key='chibi-louis-down-'+(1+Math.floor(this.clock/160)%4);
  if(this.textures.exists(key)&&npc.texture.key!==key)npc.setTexture(key);
  if(motion.elapsed>=motion.duration){
   this.storyLouisWalk=undefined;
   if(this.textures.exists('chibi-louis-down-0'))npc.setTexture('chibi-louis-down-0');
  }
 }
 updateStoryAbduction(dt:number){
  const shot=this.storyAbduction;
  if(!shot)return;
  shot.elapsed=Math.min(ABDUCTION_TIMING.escape,shot.elapsed+dt);
  const frame=abductionFrame(shot.elapsed,shot.origin),prior=shot.phase;
  shot.phase=frame.phase;
  if(prior!==frame.phase){
   if(frame.phase==='doors')this.audio.tone(270,.17,.036,'sawtooth');
   if(frame.phase==='struggle'){
    if(!this.reducedMotion)this.cameras.main.shake(210,.0018);
    this.audio.tone(145,.14,.040,'triangle');
    this.story?.guide('¡Se llevan a Louis! Fíjate en la furgoneta.');
   }
   if(frame.phase==='close')this.audio.tone(170,.18,.052,'square');
   if(frame.phase==='escape')this.audio.tone(320,.3,.045,'sawtooth');
  }
  const v=toScreen(frame.van),key=vanTexture(frame.doorOpen);
  shot.van.setPosition(v.x,v.y).setDepth(v.y+10);
  if(shot.van.texture.key!==key)shot.van.setTexture(key);
  shot.van.setTint(frame.brake?0xffe2e2:0xffffff);
  for(const [sprite,point,mask] of [
   [shot.fox,frame.fox,'fox'],[shot.rabbit,frame.rabbit,'rabbit']
  ] as const){
   const p=toScreen(point);
   sprite.setVisible(frame.captorsVisible).setPosition(p.x,p.y).setDepth(p.y+4);
   const pose=frame.phase==='struggle'||frame.phase==='load'?'grab':
    ['disembark','approach','board'].includes(frame.phase)?'walk':'idle';
   const face=captorTexture(mask,pose,captorFrame(shot.elapsed,pose));
   if(sprite.texture.key!==face)sprite.setTexture(face);
   sprite.setFlipX(frame.phase==='board'||frame.phase==='load');
  }
  const hostage=this.storyLouis;
  if(hostage?.active){
   const p=toScreen(frame.victim);
   hostage.setPosition(p.x,p.y).setDepth(frame.victimBehindVan?v.y+4:p.y+6)
    .setVisible(frame.victimVisible);
   const inMotion=frame.phase==='struggle'||frame.phase==='load';
   const image='chibi-louis-down-'+(inMotion?1+Math.floor(this.clock/140)%4:0);
   if(this.textures.exists(image)&&hostage.texture.key!==image)hostage.setTexture(image);
   hostage.setAngle(inMotion&&!this.reducedMotion?Math.sin(shot.elapsed/72)*4:0);
  }
  shot.dust.clear();
  if(frame.dust&&!this.reducedMotion){
   // Seis pequeñas nubes limitadas, sin crear nuevos emisores por fotograma.
   for(let i=0;i<6;i++){
    const t=(shot.elapsed/190+i*.19)%1,x=v.x-65+(i%3)*9-t*24;
    shot.dust.fillStyle(i%2?0xd9c9bf:0xf0dec7,(1-t)*.32*frame.dust)
     .fillEllipse(x,v.y+7-t*10,13+t*13,6+t*5);
   }
  }
  if(frame.phase==='done'){
   shot.dust.clear();this.storyAbduction=undefined;
   // Sólo al salir de cámara se permite continuar la misión.
   shot.done();
  }
 }
 updateStoryActors(dt:number){
  if(!this.story)return;
  const stage=this.storyStage;
  const area=this.storyWorld?.area(this.p.u);
  if(area&&area!==this.storyArea){this.storyArea=area;this.story.area(area);}
  const dusk=darknessAt(this.p.u,stage,this.storyMap);
  if(Math.abs(dusk-this.storyDusk)>.018){
   this.storyDusk=dusk;this.story.dusk(dusk);
  }
  if(stage==='intro'){
   // No-dialogue tutorial is spatial and limited to the daylight garden.
   const step=this.p.u>=16?3:this.p.u>=9?2:this.p.u>=4?1:0;
   if(step!==this.storyGuideStep){
    this.storyGuideStep=step;
    const hints=[
     'Camina por el sendero · WASD o joystick izquierdo',
     'Mira las flores · con las flechas o el mouse disparas corazones',
     'Escucha el río: sigue el camino y cruza el puente de madera',
     'Cuando aparezca ♡, usa E o el botón de interacción'
    ];
    this.story.guide(hints[step]);
   }
   this.checkStoryExit();
   return;
  }
  if(stage==='walk-together'&&this.storyLouis){
   const foot=toScreen(this.p),npc=this.storyLouis;
   npc.x+=(foot.x-35-npc.x)*Math.min(1,dt/300);
   npc.y+=(foot.y+7-npc.y)*Math.min(1,dt/300);
   const name='chibi-louis-down-'+(1+Math.floor(this.clock/115)%4);
   if(this.textures.exists(name))npc.setTexture(name);
   npc.setDepth(npc.y);
   if(!this.storyWalkTriggered&&isoDistance(this.p,this.storyTarget)<.98){
    this.storyWalkTriggered=true;this.story.clearing();
   }
  }
  if(stage==='talk-luis'&&!this.storyLuisReady&&!this.storyLuisArriving&&
   isoDistance(this.p,this.storyTarget)<LUIS_BEATS.approachRadius)this.startLuisArrival();
  const labels:Partial<Record<IsoStoryStage,string>>={
   'talk-louis':'Hablar con Louis','talk-luis':'Hablar con Luis',
   ribbon:'Examinar Pulsera',petals:'Examinar Pétalos',wheel:'Examinar Huellas',
   door:'Probar puerta',window:'Entrar por la ventana'
  };
  const canInteract=(stage!=='talk-luis'||this.storyLuisReady)&&
   (stage!=='talk-louis'||!this.storyLouisWalk);
  const vanIsClose=this.storyMap==='night_neighborhood'&&
   ['door','window'].includes(stage)&&
   isoDistance(this.p,VAN_NIGHT_POSITION)<2.0;
  const radius=this.storyMap==='night_neighborhood'?
   (stage==='window'?NIGHT_WINDOW_INTERACTION_RADIUS:NIGHT_INTERACTION_RADIUS):1.15;
  const mainTarget=canInteract&&labels[stage]&&isoDistance(this.p,this.storyTarget)<radius?
   labels[stage]!:'';
  this.storyVanNear=!mainTarget&&vanIsClose;
  const target=mainTarget||(this.storyVanNear?'Inspeccionar furgoneta':'');
  if(target!==this.storyNear){
   this.storyNear=target;this.story.near(target);
   if(target&&this.storyMap==='night_neighborhood'){
    // Keep assisted walking until Kitty reaches the actual doorstep.
    // Proximity merely ENABLES interaction, not a premature route stop.
    this.burst(this.storyTarget,0xffdfb5);
    this.audio.tone(645,.13,.015);
   }
  }
  this.checkStoryExit();
 }
 resetStoryFeel(){
  this.storyVelocity={u:0,v:0};
  this.storyLookAhead={x:0,y:0};
  this.storyStepTravel=0;this.storyInteractUntil=0;
  this.storyFootprints=[];
  this.storyCompanionClock=0;this.storyFollowHeading={x:1,y:0};
  this.cameras?.main?.setFollowOffset?.(0,0);
 }
 updateStoryCameraFeel(dt:number){
  this.storyLookAhead=feelCameraOffset(this.storyLookAhead,this.storyVelocity,dt,this.reducedMotion);
  // Preserve exactly the original zoom/follow formula; no camera shake or
  // dramatic forced pans during ordinary exploration.
  this.cameras.main.setFollowOffset?.(-this.storyLookAhead.x,-this.storyLookAhead.y);
 }
 storyFootfall(deltaDistance:number){
  this.storyStepTravel+=deltaDistance;
  if(this.storyStepTravel<RESCUE_FEEL.footstepDistance)return;
  this.storyStepTravel%=RESCUE_FEEL.footstepDistance;
  const ground=feelSurfaceAt(this.storyMap,this.p);
  const settings=FEEL_FOOTSTEP[ground];
  this.audio.tone(settings.pitch+(this.storyFootprints.length%3)*10,
   ground==='wood'?.07:.047,settings.volume,
   ground==='wood'?'triangle':'sine');
  if(!this.reducedMotion){
   const point=toScreen(this.p),side=this.storyFootprints.length%2?1:-1;
   this.storyFootprints.push({
    x:point.x-side*3,y:point.y+1,at:this.clock,kind:ground,side
   });
   if(this.storyFootprints.length>12)this.storyFootprints.shift();
  }
 }
 renderStoryKitty(dt:number,firing=false,recoil=0,hurt=false){
  const gait=feelGait(this.storyVelocity,this.moveClock,this.clock,this.reducedMotion);
  const moving=gait.walking;
  const dir=this.facing==='left'?'right':this.facing;
  const touch=this.storyInteractUntil>this.clock;
  const frame=touch?0:gait.frame;
  const hurtKey=`chibi-${this.character}-hurt`;
  const texture=hurt&&this.textures.exists(hurtKey)?hurtKey:
   `chibi-${this.character}-${dir}-${hurt?5:frame}${firing&&!hurt?'-shoot':''}`;
  this.positionPlayer();
  const duration=RESCUE_FEEL.interactMs,progress=touch?
   Math.min(1,(this.storyInteractUntil-this.clock)/duration):0;
  if(!this.reducedMotion){
   this.player.y-=gait.footLift+Math.sin((1-progress)*Math.PI)*2.3*(touch?1:0);
  }
  if(this.player.texture.key!==texture)this.player.setTexture(texture);
  const reach=touch&&!this.reducedMotion?Math.sin((1-progress)*Math.PI):0;
  this.player.setFlipX(this.facing==='left')
   .setScale(1.3*(1+recoil*.06+gait.squash+reach*.033),
    1.3*(1-recoil*.08-gait.squash-reach*.055))
   .setAlpha(this.clock<this.inv?
    (this.reducedMotion?.7:Math.floor(this.clock/90)%2?.45:1):1)
   .setAngle(hurt&&!this.reducedMotion?Math.sin(this.clock/35)*10:
    this.reducedMotion?0:gait.lean+reach*(this.facing==='left'?-4:4));
  if(hurt)this.player.setTint(0xffa8bb);else this.player.clearTint();
 }
 fitCamera(width:number,height:number){if(width<=0||height<=0)return;
  const camera=this.cameras.main;
  // Zoom IDENTICO al original; únicamente la historia sigue a Kitty al explorar.
  camera.setZoom(Math.min(width/800,height/450)*1.08);
  if(this.story&&this.player)camera.startFollow(this.player,false,.12,.12);
  else camera.centerOn(400,225);
 }
 drawFloor(){
  const g=this.floor;g.clear();const background=this.level===3?0xe2d4e0:this.level===2?0xe8e1d8:0xf1e5d2;
  g.fillStyle(background);g.fillRect(-900,-500,2600,1500);
  // Soft distant scenery fills wide and notched displays without stretching the arena.
  g.fillStyle(this.level===3?0xcfc4d1:0xdde0ca,.65);g.fillRect(-900,300,2600,650);
  for(let i=0;i<12;i++){const x=-300+i*145,y=55+(i%3)*46;g.fillStyle(0xfff8e9,.3);g.fillRect(x,y,28,8);g.fillRect(x+8,y-7,20,7);}
  const left=toScreen({u:0,v:7}),right=toScreen({u:7,v:0}),bottom=toScreen({u:7,v:7}),half=ISO.tileW/2,halfH=ISO.tileH/2;
  const L=new Phaser.Geom.Point(left.x-half,left.y),R=new Phaser.Geom.Point(right.x+half,right.y),B=new Phaser.Geom.Point(bottom.x,bottom.y+halfH);
  g.fillStyle(0x819d78);g.fillPoints([L,B,new Phaser.Geom.Point(B.x,B.y+15),new Phaser.Geom.Point(L.x,L.y+15)],true);
  g.fillStyle(0x6d8d71);g.fillPoints([B,R,new Phaser.Geom.Point(R.x,R.y+15),new Phaser.Geom.Point(B.x,B.y+15)],true);
  for(let u=0;u<ISO.size;u++)for(let v=0;v<ISO.size;v++){
   const p=toScreen({u,v}),w=ISO.tileW/2,h=ISO.tileH/2;
   const pts=[new Phaser.Geom.Point(p.x,p.y-h),new Phaser.Geom.Point(p.x+w,p.y),new Phaser.Geom.Point(p.x,p.y+h),new Phaser.Geom.Point(p.x-w,p.y)];
   const color=this.level===3?((u+v)%2?0xa7ae94:0xb9c1a3):this.level===2?((u+v)%2?0xaec4a2:0xc5d3b2):((u+v)%2?0xb8cda1:0xc9d9b0);
   g.fillStyle(color);g.fillPoints(pts,true);g.lineStyle(1,0x90aa89,.25);g.strokePoints(pts,true);
   if((u*13+v*7)%9===0){g.fillStyle(0xf2e7bd,.65);g.fillRect(p.x-2,p.y-1,4,2);}if((u*5+v*3)%11===0){g.fillStyle(0xf3c4ce,.8);g.fillRect(p.x+8,p.y+2,3,3);}
   if(this.level===2&&Math.abs(u-v)<1){g.fillStyle(0xf7e8c9,.6);g.fillEllipse(p.x,p.y,25,9);g.fillStyle(0xdecba9,.45);g.fillEllipse(p.x+3,p.y+1,12,3);}
   if(this.level===3&&(u===0||v===0||u===7||v===7)){g.lineStyle(2,0xc696b1,.65);g.strokePoints(pts,true);}
  }
  // Garden ornaments are decorative and sorted at their feet, so characters can pass in front and behind them.
  for(const [u,v] of [[0,3],[1,7],[4,0],[7,4],[3,7],[7,2],[.25,1.7],[2.2,6.8],[5.2,.2],[6.8,5.8]])this.flower(u,v);
  for(const [u,v] of [[.2,4.2],[2.8,.2],[6.8,3.2]])this.mushroom(u,v);
  for(const [u,v] of [[.2,2.2],[2.1,6.9],[5.4,.1],[6.9,5.2]])this.shrub(u,v);
  this.tree(.15,5.6);this.tree(5.8,.15);
  if(this.level===3){this.crystal(.3,3);this.crystal(3,.3);this.crystal(7,4);this.crystal(4,7);}
 }
 flower(u:number,v:number){const p=toScreen({u,v}),g=this.add.graphics().setDepth(p.y);g.fillStyle(0x688b69);g.fillRect(p.x-1,p.y-11,2,10);g.fillStyle(0xe8a5b6);g.fillRect(p.x-5,p.y-16,10,4);g.fillRect(p.x-2,p.y-19,4,10);g.fillStyle(0xf6d68a);g.fillRect(p.x-1,p.y-15,3,3);}
 mushroom(u:number,v:number){const p=toScreen({u,v}),g=this.add.graphics().setDepth(p.y);g.fillStyle(0x536d52,.18);g.fillEllipse(p.x,p.y,20,6);g.fillStyle(0xf5e5c9);g.fillRect(p.x-3,p.y-11,6,10);g.fillStyle(this.level===3?0xaa83ab:0xd78e9e);g.fillRect(p.x-9,p.y-15,18,6);g.fillRect(p.x-6,p.y-18,12,3);g.fillStyle(0xffe9de);g.fillRect(p.x-5,p.y-14,3,2);g.fillRect(p.x+3,p.y-16,2,2);}
 shrub(u:number,v:number){const p=toScreen({u,v}),g=this.add.graphics().setDepth(p.y);g.fillStyle(0x617d60,.18);g.fillEllipse(p.x,p.y,30,8);g.fillStyle(this.level===3?0x8b8e82:0x80a27a);g.fillRect(p.x-13,p.y-10,26,8);g.fillRect(p.x-9,p.y-14,17,4);g.fillStyle(0xa6bd91);g.fillRect(p.x-8,p.y-10,7,3);g.fillStyle(0xf3b9c3);g.fillRect(p.x+4,p.y-9,3,3);}
 tree(u:number,v:number){const p=toScreen({u,v}),g=this.add.graphics().setDepth(p.y);g.fillStyle(0x5b6750,.2);g.fillEllipse(p.x,p.y,48,14);g.fillStyle(0x8d6b5b);g.fillRect(p.x-4,p.y-30,8,30);g.fillStyle(this.level===3?0x8d7897:0x6b936f);g.fillRect(p.x-23,p.y-51,46,25);g.fillRect(p.x-16,p.y-62,32,12);g.fillStyle(this.level===3?0xb29bb2:0x94b381);g.fillRect(p.x-19,p.y-52,35,16);g.fillStyle(0xe7a9bc);g.fillRect(p.x-14,p.y-46,4,4);g.fillRect(p.x+8,p.y-53,4,4);}
 crystal(u:number,v:number){const p=toScreen({u,v}),g=this.add.graphics().setDepth(p.y);g.fillStyle(0x5b6750,.18);g.fillEllipse(p.x,p.y,28,8);g.fillStyle(0x98719e);g.fillPoints([new Phaser.Geom.Point(p.x,p.y-34),new Phaser.Geom.Point(p.x+10,p.y-19),new Phaser.Geom.Point(p.x+7,p.y-3),new Phaser.Geom.Point(p.x-7,p.y-3),new Phaser.Geom.Point(p.x-10,p.y-19)],true);g.fillStyle(0xd8b6d5);g.fillRect(p.x-3,p.y-26,4,17);}
 spawnEnemy(p:IsoPoint,boss:boolean,kind:'kuromi'|'cinna'='kuromi'){const xy=toScreen(p),shadow=this.add.ellipse(xy.x,xy.y,30,9,0x425c4c,.22).setDepth(xy.y-1),s=this.add.sprite(xy.x,xy.y,`${kind}-0`).setOrigin(.5,.85).setScale(boss?2.6:1.7).setDepth(xy.y);this.enemies.push({p:{...p},s,shadow,hp:boss?12:3,boss,kind,next:1500+this.enemies.length*500,flash:0,phase:0});}
 sync(){const boss=this.enemies.find(e=>e.boss);this.report({hp:this.hp,objective:this.story?this.story.objective(this.storyStage):this.level===1?'Luces encontradas':this.level===2?'Travesuras resueltas':'Desafío final',complete:this.collected,total:this.total,bombs:this.bombs,shield:this.shield,offer:this.pendingOffer?{name:'Manto de pétalos',description:'Una burbuja bloquea el próximo golpe de este tramo. Puedes recogerla o dejarla aquí.'}:undefined,bossHp:boss?.hp,bossMax:boss?12:undefined});}
 clearInput(){this.left=this.right=undefined;this.mouse=false;if(this.keys)Object.values(this.keys).forEach(k=>k.reset());}
 setPaused(v:boolean){if(this.ended||this.wonAt)return;this.paused=v;this.clearInput();if(v)this.audio.suspend();else this.audio.resume();this.onPause(v);}
 positionPlayer(){const s=toScreen(this.p);this.player.setPosition(s.x,s.y).setDepth(s.y);this.shadow.setPosition(s.x,s.y+1).setDepth(s.y-1);}
 shoot(from:IsoPoint,du:number,dv:number,enemy=false){const xy=toScreen(from),s=this.add.text(xy.x,xy.y-9,enemy?'✦':'♥',{fontFamily:'Georgia',fontSize:enemy?'16px':'17px',color:enemy?'#a05c95':'#df6d91',stroke:'#fff5e4',strokeThickness:2}).setOrigin(.5);this.shots.push({p:{...from},du,dv,life:enemy?2500:1300,enemy,s});}
 burst(p:IsoPoint,color:number){const xy=toScreen(p);this.bursts.push({x:xy.x,y:xy.y,at:this.clock,color});if(this.bursts.length>28)this.bursts.shift();}
 floatNote(p:IsoPoint,label:string,color='#a46178'){const xy=toScreen(p),y=xy.y-55,s=this.add.text(xy.x,y,label,{fontFamily:'Georgia',fontSize:'14px',color,stroke:'#fff9ed',strokeThickness:3}).setOrigin(.5).setDepth(1100);this.notes.push({s,y,at:this.clock});if(this.notes.length>8)this.notes.shift()?.s.destroy();}
 damage(){if(this.clock<this.inv||this.ended||this.wonAt||this.dyingAt||this.pendingOffer)return;if(this.shield){this.shield=false;this.inv=this.clock+900;this.burst(this.p,0xffdf8a);this.floatNote(this.p,'¡Protegida!','#a67c3b');this.audio.tone(950,.22,.04);this.sync();return;}this.hp--;this.inv=this.clock+1300;this.burst(this.p,0xe485a3);this.floatNote(this.p,'− ♥');this.audio.tone(160,.15,.045,'triangle');if(!this.reducedMotion)this.cameras.main.shake(80,.002);this.sync();if(this.hp<=0){if(this.story){this.hp=6;this.inv=this.clock+900;this.story.health(this.hp);this.story.retry();this.setStoryStage('defend',true);}else{this.dyingAt=this.clock||1;this.clearInput();}}else this.story?.health(this.hp);}
 hitEnemy(e:Enemy,amount:number){if(!this.enemies.includes(e))return;e.hp-=amount;e.flash=this.clock+150;this.burst(e.p,e.kind==='cinna'?0x91c7d2:0xd68bad);this.audio.hit();if(e.hp<=0){this.floatNote(e.p,'✦');e.s.destroy();e.shadow.destroy();this.enemies=this.enemies.filter(x=>x!==e);this.collected++;this.audio.tone(780,.16,.03);}this.sync();}
 bomb(){if(this.paused||this.pendingOffer||this.ended||this.wonAt||this.dyingAt||!this.bombs||this.level===1)return;this.bombs--;this.burst(this.p,0xffd584);for(const e of [...this.enemies])if(isoDistance(e.p,this.p)<2)this.hitEnemy(e,3);this.audio.tone(130,.25,.06,'triangle');if(!this.reducedMotion)this.cameras.main.shake(100,.003);this.sync();}
 chooseItem(accept:boolean){if(!this.pendingOffer||this.paused||!this.charm)return;this.pendingOffer=false;this.clearInput();if(accept){this.shield=true;this.burst(this.charm.p,0xffd584);this.floatNote(this.charm.p,'¡Manto listo!','#a67c3b');this.charm.s.destroy();this.charm=undefined;this.audio.tone(880,.22,.035);}else this.declinedCharm=true;this.sync();}
 update(_time:number,delta:number){
  if(this.paused||this.pendingOffer||this.ended)return;const dt=Math.min(delta,40),seconds=dt/1000;this.clock+=dt;
  if(this.story){
   this.storyWorld?.update(this.clock,this.storyDusk);
   // Physical NPC and kidnapping motion keeps running during narrative locks.
   this.updateLuisCinematic(dt);
   this.animateStoryLuis();
   this.updateStoryLouisArrival(dt);
   this.updateStoryAbduction(dt);
  }
  if(this.story && (this.story.locked()||luisMotionIsBlocking(this.storyLuisMotion)||
   !!this.storyAbduction)){
   this.storyVelocity=feelMotion(this.storyVelocity,{u:0,v:0},0,dt);
   this.updateStoryCameraFeel(dt);
   this.renderStoryKitty(dt);
   this.clearInput();return;
  }
  if(this.story && this.storyStage!==this.story.stage())this.setStoryStage(this.story.stage());
  if(this.story && this.keys.E?.isDown&&!this.storyActionPressed)this.storyInteract();
  if(this.story)this.storyActionPressed=!!this.keys.E?.isDown;
  this.notes=this.notes.filter(note=>{const age=this.clock-note.at;if(age>=850){note.s.destroy();return false;}note.s.y=note.y-(this.reducedMotion?0:age/45);note.s.setAlpha(Math.min(1,(850-age)/200));return true;});
  if(this.dyingAt){const age=this.clock-this.dyingAt,key=`chibi-${this.character}-dead`;if(this.textures.exists(key))this.player.setTexture(key);this.player.setAlpha(Math.max(.25,1-age/800));if(!this.reducedMotion)this.player.setAngle(Math.min(65,age/10));if(age>650){this.ended=true;this.finish('dead');}return;}
  if(this.wonAt){if(!this.reducedMotion)this.player.setAngle(Math.sin(this.clock/90)*8);if(this.clock-this.wonAt>850){this.ended=true;this.finish('win');}return;}
  if(this.story){
   // Kinetic movement applies exclusively to the rescue; the classic game
   // stays byte-identical in the else branch.
   let x=+this.keys.D.isDown-+this.keys.A.isDown,
    y=+this.keys.S.isDown-+this.keys.W.isDown;
   if(this.left){
    x=this.left.dx;y=this.left.dy;
    if(Math.hypot(x,y)<7)x=y=0;
   }
   const manual=Math.hypot(x,y)>.1;
   if(manual&&this.houseRoute.length)this.houseRoute=[];
   let guidePoint=this.houseRoute[0];
   if(guidePoint&&isoDistance(this.p,guidePoint)<.17){
    this.houseRoute.shift();guidePoint=this.houseRoute[0];
   }
   if(guidePoint){
    const from=toScreen(this.p),to=toScreen(guidePoint);
    x=to.x-from.x;y=to.y-from.y;
   }
   const intent=screenVector(x,y),strength=this.left&&!guidePoint?
    Math.min(1,Math.hypot(x,y)/45):Math.hypot(x,y)>.1?1:0;
   const previous={...this.p};
   const velocity=guidePoint?{...this.storyVelocity}:
    feelMotion(this.storyVelocity,intent,strength,dt);
   const step=guidePoint?
    Math.min(1,2.1*seconds/Math.max(.001,isoDistance(previous,guidePoint))):0;
   const destination=guidePoint?{
    u:previous.u+(guidePoint.u-previous.u)*step,
    v:previous.v+(guidePoint.v-previous.v)*step
   }:{u:previous.u+velocity.u*seconds,v:previous.v+velocity.v*seconds};
   const next=constrainRescue(destination,this.storyMap,previous);
   const traveled=isoDistance(previous,next);
   this.p=next;
   this.storyVelocity=seconds>0?{
    u:(next.u-previous.u)/seconds,v:(next.v-previous.v)/seconds
   }:{u:0,v:0};
   if(guidePoint&&isoDistance(this.p,guidePoint)<.18)this.houseRoute.shift();
   if(guidePoint&&traveled<.0001){
    this.houseRoute=[];
    this.story?.guide('Hay un muro cerca. Sigue las baldosas para rodear la casa.');
   }
   if(traveled>.0001){
    const speedRatio=Math.min(1,Math.hypot(this.storyVelocity.u,this.storyVelocity.v)/RESCUE_FEEL.speed);
    this.moveClock+=dt*(.4+.6*speedRatio);
    this.storyFootfall(traveled);
    if(Math.hypot(x,y)>.1)this.facing=facingOf(x,y,this.facing);
    const from=toScreen(previous),to=toScreen(next),direction={
     x:to.x-from.x,y:to.y-from.y};
    const magnitude=Math.hypot(direction.x,direction.y);
    if(magnitude>.1)this.storyFollowHeading={
     x:direction.x/magnitude,y:direction.y/magnitude
    };
   }else{
    this.storyStepTravel=0;
   }
   this.updateStoryCameraFeel(dt);
  }else{
   let x=+this.keys.D.isDown-+this.keys.A.isDown,y=+this.keys.S.isDown-+this.keys.W.isDown;
   if(this.left){x=this.left.dx;y=this.left.dy;if(Math.hypot(x,y)<7)x=y=0;}
   const manualMove=Math.hypot(x,y)>.1;
   if(manualMove&&this.houseRoute.length)this.houseRoute=[]; // Player always overrides guide.
   let guidePoint=this.houseRoute[0];
   if(guidePoint&&isoDistance(this.p,guidePoint)<.17){
    this.houseRoute.shift();guidePoint=this.houseRoute[0];
   }
   if(guidePoint){
    const src=toScreen(this.p),dst=toScreen(guidePoint);
    x=dst.x-src.x;y=dst.y-src.y;
   }
   const wantsMove=Math.hypot(x,y)>.1,move=screenVector(x,y);
   const strength=this.left&&!guidePoint?Math.min(1,Math.hypot(x,y)/45):1;
   let moving=false;
   if(wantsMove){
    const distance=guidePoint?isoDistance(this.p,guidePoint):0;
    const fraction=guidePoint?Math.min(1,2.1*seconds/Math.max(.001,distance)):0;
    const candidate=guidePoint?{
     u:this.p.u+(guidePoint.u-this.p.u)*fraction,
     v:this.p.v+(guidePoint.v-this.p.v)*fraction
    }:{
     u:this.p.u+move.u*2.1*seconds*strength,
     v:this.p.v+move.v*2.1*seconds*strength
    };
    const next=this.story?constrainRescue(candidate,this.storyMap,this.p):constrain(candidate);
    moving=isoDistance(next,this.p)>.001;this.p=next;
    if(guidePoint&&isoDistance(this.p,guidePoint)<.18)this.houseRoute.shift();
    if(guidePoint&&!moving){
     this.houseRoute=[];this.story?.guide('Hay una pared cerca. Sigue la vereda para rodear la casa.');
    }
    if(moving){
     this.moveClock+=dt*(.45+.55*strength);
     if(this.moveClock-this.lastStep>250){
      this.lastStep=this.moveClock;this.burst(this.p,0xf8e8ca);
      this.audio.tone(245,.04,.004,'triangle');
     }
    }else{this.moveClock=0;this.lastStep=0;}
    this.facing=facingOf(x,y,this.facing);
   }else{this.moveClock=0;this.lastStep=0;}
  }
  let ax=+this.keys.RIGHT.isDown-+this.keys.LEFT.isDown,ay=+this.keys.DOWN.isDown-+this.keys.UP.isDown;
  if(this.right){ax=this.right.dx;ay=this.right.dy;if(Math.hypot(ax,ay)<8)ax=ay=0;}else if(this.mouse){const point=toScreen(this.p),aim=this.cameras.main.getWorldPoint(this.input.activePointer.x,this.input.activePointer.y);ax=aim.x-point.x;ay=aim.y-point.y;}
  const firing=Math.hypot(ax,ay)>.1&&this.level!==1;if(firing){this.facing=facingOf(ax,ay,this.facing);if(this.clock-this.last>300){this.last=this.clock;const aim=screenVector(ax,ay),length=Math.hypot(ax,ay);this.shotDir={x:ax/length,y:ay/length};this.shoot(this.p,aim.u*4,aim.v*4);this.audio.tone(700,.04,.015);}}
  const frame=moving?1+Math.floor(this.moveClock/115)%4:this.clock%3600>3440?5:0,dir=this.facing==='left'?'right':this.facing;
  const hurt=this.clock<this.inv&&this.clock>this.inv-300,hurtKey=`chibi-${this.character}-hurt`,texture=hurt&&this.textures.exists(hurtKey)?hurtKey:`chibi-${this.character}-${dir}-${hurt?5:frame}${firing&&!hurt?'-shoot':''}`;
  const recoil=!this.reducedMotion&&this.last?Math.max(0,1-(this.clock-this.last)/100):0;
  this.positionPlayer();if(!this.reducedMotion)this.player.y-=moving?Math.abs(Math.sin(this.moveClock/115*Math.PI))*2:Math.sin(this.clock/550)*.8;this.player.setTexture(texture).setFlipX(this.facing==='left').setScale(1.3*(1+recoil*.06),1.3*(1-recoil*.08)).setAlpha(this.clock<this.inv?(this.reducedMotion?.7:Math.floor(this.clock/90)%2?.45:1):1).setAngle(hurt&&!this.reducedMotion?Math.sin(this.clock/35)*10:moving&&!this.reducedMotion?Math.sin(this.moveClock/115*Math.PI)*3:0);
  if(this.clock<this.inv&&this.clock>this.inv-300)this.player.setTint(0xffa8bb);else this.player.clearTint();
  for(const light of [...this.collectibles]){light.s.y=toScreen(light.p).y-12+(this.reducedMotion?0:Math.sin(this.clock/230)*3);if(isoDistance(light.p,this.p)<.48){this.burst(light.p,0xffd584);this.floatNote(light.p,'¡Una luz!','#a67c3b');light.s.destroy();this.collectibles=this.collectibles.filter(x=>x!==light);this.collected++;this.audio.tone(880,.18,.035);this.sync();}}
  if(this.charm){const d=isoDistance(this.charm.p,this.p);this.charm.s.y=toScreen(this.charm.p).y-12+(this.reducedMotion?0:Math.sin(this.clock/260)*3);if(d>.9)this.declinedCharm=false;if(d<.48&&!this.declinedCharm){this.pendingOffer=true;this.clearInput();this.audio.tone(660,.1,.025);this.sync();return;}}
  for(const e of [...this.enemies]){
   const du=this.p.u-e.p.u,dv=this.p.v-e.p.v,d=Math.hypot(du,dv)||1;
   if(d>1.2){
    const proposed={u:e.p.u+du/d*(e.boss?.45:.65)*seconds,v:e.p.v+dv/d*(e.boss?.45:.65)*seconds};
    e.p=this.story?constrainRescue(proposed,this.storyMap):constrain(proposed);
   }
   const xy=toScreen(e.p),bounce=this.reducedMotion?0:Math.abs(Math.sin(this.clock/250+e.phase))*2;e.s.setPosition(xy.x,xy.y-bounce).setDepth(xy.y).setTexture(`${e.kind}-${Math.floor(this.clock/160)%4}`).setFlipX(du-dv<0);e.shadow.setPosition(xy.x,xy.y).setDepth(xy.y-1);
   if(this.clock<e.flash)e.s.setTint(0xffc5d9);else if(this.clock>e.next-450)e.s.setTint(0xf2c1dd);else e.s.clearTint();
   if(d<.48)this.damage();if(this.dyingAt)return;
   if(this.clock>e.next){e.next=this.clock+(e.boss?2100:2600);e.phase++;
    if(e.boss&&e.phase%2===0){for(const offset of [-.8,0,.8])this.dangers.push({p:constrain({u:this.p.u+offset,v:this.p.v}),at:this.clock+1150});}
    else{const count=e.boss?8:e.kind==='cinna'?3:1;for(let i=0;i<count;i++){const a=e.boss?i*Math.PI*2/count:Math.atan2(dv,du)+(i-(count-1)/2)*.24;this.shoot(e.p,Math.cos(a)*1.4,Math.sin(a)*1.4,true);}}
   }
  }
  for(const shot of [...this.shots]){shot.life-=dt;shot.p.u+=shot.du*seconds;shot.p.v+=shot.dv*seconds;const xy=toScreen(shot.p);shot.s.setPosition(xy.x,xy.y-9).setDepth(xy.y+1);
   const maxU=this.story?RESCUE_SCENES[this.storyMap].maxU:ISO.size;
   const minU=this.story?RESCUE_SCENES[this.storyMap].minU:-.5;
   const maxV=this.story?16:ISO.size,minV=this.story?-6:-.5;
   let remove=shot.life<=0||shot.p.u<minU||shot.p.v<minV||shot.p.u>maxU||shot.p.v>maxV;
   if(shot.enemy&&isoDistance(shot.p,this.p)<.38){this.damage();remove=true;}
   if(!shot.enemy){const target=this.enemies.find(e=>isoDistance(e.p,shot.p)<(e.boss?.62:.43));if(target){this.hitEnemy(target,1);remove=true;}}
   if(remove){shot.s.destroy();this.shots=this.shots.filter(x=>x!==shot);}if(this.dyingAt)return;
  }
  for(const zone of [...this.dangers])if(this.clock>=zone.at){if(isoDistance(zone.p,this.p)<.55)this.damage();this.burst(zone.p,0xc385b4);this.dangers=this.dangers.filter(z=>z!==zone);}if(this.dyingAt)return;
  const g=this.fx;g.clear();if(!this.reducedMotion&&!this.story){for(let i=0;i<12;i++){const t=this.clock*.012+i*53,x=100+(i*83)%600+Math.sin(t/30)*9,y=70+((i*41+t*.5)%290);g.fillStyle(i%2?0xfff2d5:0xf5c5d4,.3+Math.sin(t/18)*.12);g.fillRect(x,y,3,3);}for(let i=0;i<3;i++){const t=this.clock/1000+i*2.4,x=165+i*205+Math.sin(t*.38)*35,y=115+i*24+Math.cos(t*.8)*10,wing=Math.sin(t*9)>0?5:2;g.fillStyle(i===1?0xf4e4a8:0xeab3c5,.72);g.fillRect(x-wing-1,y-3,wing,5);g.fillRect(x+2,y-3,wing,5);g.fillStyle(0x8e7571,.65);g.fillRect(x,y-2,2,4);}}if(this.last&&this.clock-this.last<110){const p=toScreen(this.p);g.fillStyle(0xffdfb4,.9);g.fillCircle(p.x+this.shotDir.x*20,p.y-16+this.shotDir.y*14,3);}if(this.shield){const p=toScreen(this.p);g.lineStyle(2,0xffedb8,.85);g.strokeCircle(p.x,p.y-18,27);}for(const zone of this.dangers){const p=toScreen(zone.p),fraction=1-(zone.at-this.clock)/1150;g.fillStyle(0xc579a5,.15+fraction*.12);g.fillCircle(p.x,p.y,24);g.lineStyle(2,0xb66391,.8);g.strokeCircle(p.x,p.y,24);}
  this.bursts=this.bursts.filter(b=>this.clock-b.at<380);for(const b of this.bursts){const t=(this.clock-b.at)/380;g.lineStyle(2,b.color,1-t);g.strokeCircle(b.x,b.y,this.reducedMotion?12:4+t*18);if(!this.reducedMotion){g.fillStyle(b.color,1-t);for(let i=0;i<4;i++){const a=i*Math.PI/2;g.fillRect(b.x+Math.cos(a)*t*18,b.y+Math.sin(a)*t*12,3,3);}}}
  for(const e of this.enemies)if(this.clock>e.next-450){const p=toScreen(e.p);g.lineStyle(2,0xbd6994,.8);g.strokeCircle(p.x,p.y-12,e.boss?27:18);}for(const stick of [this.left,this.right])if(stick){const camera=this.cameras.main,p=camera.getWorldPoint(stick.x,stick.y),z=camera.zoom,n=Math.max(1,Math.hypot(stick.dx,stick.dy)/24);g.lineStyle(2/z,0x715a73,.28);g.strokeCircle(p.x,p.y,32/z);g.fillStyle(0x866779,.25);g.fillCircle(p.x+stick.dx/n/z,p.y+stick.dy/n/z,11/z);}
  if(this.story){
   this.updateStoryActors(dt);
   if(this.storyStage==='defend' && !this.storyVictoryEmitted && this.enemies.length===0){
    this.storyVictoryEmitted=true;this.story.victory();
   }
  }else if(this.collected>=this.total){this.wonAt=this.clock||1;this.clearInput();this.audio.tone(1046,.25,.035);}
 }
}
