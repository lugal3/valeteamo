import Phaser from 'phaser';
import {CHARACTERS,type CharacterId} from './characters';
import {buildArt} from './art';
import {buildChibi} from './chibi-art';
import {installReferenceCharacter} from './reference-characters';
import {facingOf,type Facing} from './animation';
import {ISO,constrain,isoDistance,screenVector,toScreen,type IsoPoint} from './isometric';
import {rescueMixFor,Sound} from './audio';
import {RESCUE_FEEL,feelMotion,feelGait,feelCameraOffset,
 feelSurfaceAt,FEEL_FOOTSTEP,feelFacingToTarget,RESCUE_COMBAT,rescueFirstAttack,rescueAttackWarning,
 type FeelSurface} from './demo/rescue-game-feel';
import {storyBubble,storyboardBeat,kidnappingReaction,
 storyActorFacing,storyActorIdle,kidnappingFrameFocus,
 smoothCinematicFocus,attentiveFacing,companionReady,storyLightStep,type RescueEmotion} from './demo/rescue-performance';
import {ABDUCTION_TIMING,abductionFrame,captorFrame,captorTexture,
 installRescueAbductionTextures,vanTexture,VAN_NIGHT_POSITION,VAN_PLATE,
 type AbductionPhase} from './demo/abduction-van';
import {NIGHT_INTERACTION_RADIUS,NIGHT_WINDOW_INTERACTION_RADIUS,nightAutoRoute,nightNavigationDistance} from './demo/night-house-layout';
import {installProloguePeople,luisTextureKey,luisAnimationFrame,
 type LuisFacing,type LuisPose} from './demo/prologue-art';
import {LUIS_BEATS,makeLuisMotion,luisEntryPoint,luisPointOnPath,
 luisMotionIsBlocking,type LuisMotion} from './demo/luis-choreography';
import {CHURU_TEXTURE,greyCatTexture,installRescueIntroArt,valeTexture,valeTalkTexture} from './demo/rescue-intro-art';
import {installKittyMoments,kittySeatKey,KITTY_POSTCARD} from './demo/kitty-moments';
import type {PrologueStage,PrologueCharacter} from './demo/prologue-story.js';
import type {EpilogueChapter} from './demo/epilogue-route';
import {buildRescueOverworld,constrainRescue,darknessAt,STORY_POSITIONS,storyArrivalPoint,nearbyRescueLandmark,
 mapForStage,exitReady,RESCUE_SCENES,stepRescueFollower,
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
export type IsoStoryStage=PrologueStage;
export type StoryMoment={id:'emy'|'couple'|'louis'|'river'|'rest'|'flowers';label:string;title:string;point:IsoPoint};
export type IsoStoryBridge={
 stage:()=>IsoStoryStage;
 // Optional peaceful return mode, never used in the original story or arcade.
 epilogue?:EpilogueChapter;
 objective:(stage:IsoStoryStage)=>string;
 locked:()=>boolean;
 near:(label:string)=>void;
 discoveries?:()=>readonly string[];
 discover?:(id:string)=>void;
 moment?:(moment:StoryMoment|null)=>void;
 speaker?:()=>PrologueCharacter|undefined;
 speaking?:()=>boolean;
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
type PhotoActor=Phaser.GameObjects.Image|Phaser.GameObjects.Sprite;
type PhotoRestore={actor:PhotoActor;key:string;flip:boolean;angle:number;scaleX:number;scaleY:number};
const CHURU_POSITION={u:5.72,v:4.36};
const GREY_CAT_POSITION={u:18.12,v:4.87};
const meetingPoint=(target:IsoPoint,stage:IsoStoryStage):IsoPoint=>
 stage==='meet-couple'?{u:target.u+.82,v:target.v-.62}:target;


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
 storyVale?:StoryActor;storyValeShadow?:Phaser.GameObjects.Ellipse;storyHands?:Phaser.GameObjects.Graphics;
 storyChuru?:StoryActor;storyCatPoint:IsoPoint={...GREY_CAT_POSITION};
 storyCat?:StoryActor;storyFeeding?:{elapsed:number;done:()=>void};
 storyLouisWalk?:{from:{x:number;y:number};to:{x:number;y:number};elapsed:number;duration:number};
 storyAbduction?:{elapsed:number;origin:IsoPoint;phase:AbductionPhase;done:()=>void;
  van:Phaser.GameObjects.Image;fox:Phaser.GameObjects.Image;
  rabbit:Phaser.GameObjects.Image;dust:Phaser.GameObjects.Graphics};
 storyVanInspected=false;storyVanNear=false;
 storyLuisShadow?:Phaser.GameObjects.Ellipse;
 storyLuisMotion?:LuisMotion;storyLuisReady=false;storyLuisArriving=false;
 storyLuisFarewell=false;
 storyWorld?:RescueOverworld;storyDusk=0;private storyDuskReported=0;storyGuideStep=-1;
 private companionWaitAt:number|null=null;
 storyArea:RouteArea='sendero';storyMap:RescueMapId='morning_garden';storyExitPending=false;
 storyActionPressed=false;storyNear='';storyWalkTriggered=false;storyVictoryEmitted=false;
 storyOptional?:ReturnType<typeof nearbyRescueLandmark>;storyVisited=new Set<string>();
 storyClueHint?:Phaser.GameObjects.Text;
 storyMomentId='';storyPetUntil=0;storyRestUntil=0;storyMomentCooldown=0;
 private photoActors:PhotoRestore[]=[];private storyPhoto=false;
 private epilogueFlames?:Phaser.GameObjects.Graphics;
 private epilogueFollowers:{actor:StoryActor;point:IsoPoint;trail:IsoPoint[];kind:'louis'|'emy'|'luis'|'vale';facing:'up'|'down'|'left'|'right';walk:number}[]=[];
 private storyMixStage='';private storyMixMap='';private storyMixDark=NaN;private storyMixDialogue=false;
 storyPractice?:{point:IsoPoint;marker:Phaser.GameObjects.Graphics};storyPracticeDone=false;
 storyTarget:IsoPoint={u:22,v:4.5};
 houseRoute:IsoPoint[]=[];houseLastHint='';
 storyVelocity:IsoPoint={u:0,v:0};
 storyLookAhead={x:0,y:0};
 storyStepTravel=0;storyInteractUntil=0;
 storyFootprints:{x:number;y:number;at:number;kind:FeelSurface;side:number}[]=[];
 storyCompanionClock=0;storyFollowHeading={x:1,y:0};
 storyFollowTrail:IsoPoint[]=[];storyFollowCue=false;
 storyCompanionFacing:'left'|'right'|'up'|'down'='down';
 storyStageAt=0;storyBeatPlayed=false;storyTargetCuePlayed=false;
 storyDramaOffset={x:0,y:0};storyLouisFacing:'up'|'down'|'left'|'right'='down';
 storyBubbles:{sprite:Phaser.GameObjects.Text;at:number;anchor:'kitty'|'louis'|'luis'|'target'|'van'}[]=[];
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
   this.storyMap=this.story.epilogue?.map??mapForStage(this.story.stage());
   this.storyWorld=this.createStoryWorld(this.storyMap);
  }else this.drawFloor();
  this.shadow=this.add.ellipse(0,0,30,10,0x425c4c,.25);this.player=this.add.sprite(0,0,`chibi-${this.character}-down-0`).setOrigin(.5,.9).setScale(1.3);
  this.p={u:.7,v:.7};this.positionPlayer();this.fitCamera(this.scale.width,this.scale.height);this.scale.on('resize',(size:{width:number,height:number})=>this.fitCamera(size.width,size.height));this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,B,SPACE,ESC,E') as Record<string,Phaser.Input.Keyboard.Key>;
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.paused||this.pendingOffer||this.ended||this.wonAt)return;if(p.wasTouch){const stick={id:p.id,x:p.x,y:p.y,dx:0,dy:0};if(p.x<this.scale.width/2&&!this.left)this.left=stick;else if(p.x>=this.scale.width/2&&!this.right)this.right=stick;}else this.mouse=true;});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{for(const stick of [this.left,this.right])if(stick?.id===p.id){stick.dx=p.x-stick.x;stick.dy=p.y-stick.y;}});
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.left?.id===p.id)this.left=undefined;if(this.right?.id===p.id)this.right=undefined;if(!p.wasTouch)this.mouse=false;});
  this.input.on('gameout',()=>{if(!this.input.activePointer.isDown)this.clearInput();});this.game.canvas.addEventListener('pointercancel',this.cancel);
  this.input.keyboard!.on('keydown-B',()=>this.bomb());this.input.keyboard!.on('keydown-SPACE',()=>this.bomb());this.input.keyboard!.on('keydown-ESC',()=>{if(!this.storyPhoto&&!this.story?.locked())this.setPaused(!this.paused);});
  this.events.once('shutdown',()=>this.game.canvas.removeEventListener('pointercancel',this.cancel));
  if(this.story){
   if(!CHARACTERS.louis.chibiSpriteSheet)installReferenceCharacter(this,'louis');
   installProloguePeople(this);
   this.storyVisited=new Set(this.story.discoveries?.()??[]);
   installRescueIntroArt(this);
   if(this.character==='kitty')installKittyMoments(this);
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
  },map,!!this.story?.epilogue);
 }
 changeStoryMap(map:RescueMapId){
  if(!this.story||map===this.storyMap)return;
  this.storyWorld?.destroy();
  this.houseRoute=[];this.houseLastHint='';
  this.resetStoryFeel();this.clearStoryBubbles();
  this.storyDramaOffset={x:0,y:0};
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
  this.storyDusk=dusk;this.storyDuskReported=dusk;this.story.dusk(dusk);
 }
 checkStoryExit(){
  if(!this.story||this.storyExitPending)return false;
  const def=RESCUE_SCENES[this.storyMap],exit=def.exit;
  if(!exit||!exitReady(this.storyMap,this.storyStage))return false;
  if(this.p.u<exit.u||Math.abs(this.p.v-exit.v)>2.0)return false;
  this.storyExitPending=true;this.clearInput();
  this.story.travel(exit.to,()=>{
   this.changeStoryMap(exit.to);
   if(exit.to==='afternoon_meeting'&&this.storyStage==='cat-fed')this.story?.arrive();
  });
  return true;
 }
 // Cada capítulo tiene un terreno propio, una salida brillante y su iluminación.
 // La historia conserva los sprites del Corazones original; no recreamos el motor.
 setStoryStage(stage:IsoStoryStage,force=false){
  if(!this.story||(!force&&this.storyStage===stage))return;
  const previousCat={...this.storyCatPoint};
  const previousLouis=this.storyLouis?.active?
   {x:this.storyLouis.x,y:this.storyLouis.y}:undefined;
  this.endStoryPhoto();
  this.storyStage=stage;this.storyStageAt=this.clock;
  this.storyBeatPlayed=false;this.storyTargetCuePlayed=false;
  this.storyWalkTriggered=false;this.storyVictoryEmitted=false;this.companionWaitAt=null;
  this.storyActionPressed=false;this.storyNear='';this.storyOptional=undefined;this.storyClueHint=undefined;this.storyPractice=undefined;
  this.storyMomentId='';this.storyPetUntil=0;this.storyRestUntil=0;this.storyMomentCooldown=0;this.story?.moment?.(null);
  this.houseRoute=[];this.houseLastHint='';
  this.resetStoryFeel();this.clearStoryBubbles();
  for(const o of this.storyObjects){this.tweens.killTweensOf(o);o.destroy();}this.storyObjects=[];
  for(const e of this.enemies){e.s.destroy();e.shadow.destroy();}this.enemies=[];
  for(const shot of this.shots)shot.s.destroy();this.shots=[];
  for(const light of this.collectibles)light.s.destroy();this.collectibles=[];
  this.dangers=[];this.bursts=[];this.charm=undefined;this.pendingOffer=false;
  this.storyLouis=undefined;this.storyLuis=undefined;this.storyVillain=undefined;
  this.storyVale=undefined;this.storyValeShadow=undefined;this.storyHands=undefined;this.storyCat=undefined;this.storyChuru=undefined;this.storyFeeding=undefined;
  this.storyLouisWalk=undefined;this.storyAbduction=undefined;
  this.storyLuisShadow=undefined;this.storyLuisMotion=undefined;
  this.storyLuisReady=false;this.storyLuisArriving=false;this.storyLuisFarewell=false;
  this.story.near('');
  this.epilogueFollowers=[];this.epilogueFlames=undefined;
  if(this.story.epilogue){this.setupEpilogue(this.story.epilogue);return;}
  if(force)this.p=mapForStage(stage)===this.storyMap?storyArrivalPoint(stage):{...RESCUE_SCENES[this.storyMap].spawn};
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
   // Same turquoise expanding contour for every important 2D clue.
   // This is an overlay, never an invisible collider or teleport trigger.
   const ring=this.add.ellipse(xy.x,xy.y,isHouse?77:52,isHouse?31:22,
    isHouse?0xffe2ba:0xa4ffdc,.26).setDepth(xy.y+3);
   ring.setStrokeStyle(isHouse?3:2,isHouse?0xffe0b9:0xa6ffdf,.96);
   this.storyObjects.push(ring);
   if(!this.reducedMotion)this.tweens.add({targets:ring,alpha:.55,
    scaleX:1.17,scaleY:1.17,duration:950,yoyo:true,repeat:-1});
   const label=this.add.text(xy.x,xy.y-(isHouse?25:16),symbol,{
    fontFamily:'Georgia',fontSize:isHouse?'34px':'26px',color:'#fff4cf',
    stroke:'#764f78',strokeThickness:4
   }).setOrigin(.5,1).setDepth(xy.y+12);
   this.storyObjects.push(label);
  };
  this.storyTarget={...STORY_POSITIONS[stage]};
  if(stage==='intro'){
   marker('✧',CHURU_POSITION);
   const xy=toScreen(CHURU_POSITION);
   const tube=this.add.image(xy.x,xy.y-4,CHURU_TEXTURE).setOrigin(.5,.85)
    .setAngle(22).setDepth(xy.y+1);
   const cloth=this.add.ellipse(xy.x,xy.y+2,42,17,0xc66d8f,.88).setDepth(xy.y-1);
   this.storyObjects.push(cloth,tube);
   // A harmless optional heart target by the path, never a gate to the Churu.
   if(!this.storyPracticeDone){
    const point={u:3.7,v:4.85},p=toScreen(point),flower=this.add.graphics().setDepth(p.y+1);
    flower.fillStyle(0x8cab79,.9).fillEllipse(p.x,p.y+1,23,8);
    for(let i=0;i<5;i++)flower.fillStyle(0xe4a0bd).fillEllipse(p.x+Math.cos(i*Math.PI*2/5)*6,p.y-9+Math.sin(i*Math.PI*2/5)*6,8,8);
    flower.fillStyle(0xffedbd).fillCircle(p.x,p.y-9,4);
    this.storyObjects.push(flower);this.storyPractice={point,marker:flower};
   }
  }
  if(stage==='feed-cat'||(stage==='cat-fed'&&this.storyMap==='morning_garden')){
   if(stage==='feed-cat')marker('♡',GREY_CAT_POSITION);
   this.storyCatPoint=stage==='cat-fed'?previousCat:{...GREY_CAT_POSITION};
   const xy=toScreen(this.storyCatPoint);
   this.storyCat=this.add.image(xy.x,xy.y,greyCatTexture('idle',0)).setOrigin(.5,.9)
    .setScale(.95).setDepth(xy.y);
   this.storyObjects.push(this.storyCat);
   this.story.guide(stage==='feed-cat'?'Llevas el Churu en la mano. Emy se acercará al cruzar el puente.':'¡Emy está feliz! Kitty se despide. Sigue el sendero.');
   this.storyChuru=this.add.image(this.player.x+13,this.player.y-14,stage==='feed-cat'?CHURU_TEXTURE:'emy-kitty-wave').setScale(.48).setDepth(this.player.y+1);
   this.storyObjects.push(this.storyChuru);
  }
  if(stage==='defend'){
   // Kitty does NOT know Louis yet. She follows an audible cry through the
   // orchard; the boy and his attackers are revealed only after approaching.
   this.story.guide('¡Un grito al fondo del jardín! Sigue el camino hacia la voz…');
  }
  if(stage==='talk-louis'){
   // Louis approaches from the spot where Kitty protected him.
   const origin={u:this.storyTarget.u+1.6,v:this.storyTarget.v+.4};
   this.storyLouis=actor('louis',origin);
   const from=previousLouis??toScreen(origin);
   this.storyLouis.setPosition(from.x,from.y).setDepth(from.y);
   this.storyLouisWalk={from,to:toScreen(this.storyTarget),
    elapsed:0,duration:1300};
  }
  if(stage==='talk-luis'||stage==='meet-couple'){
   // Luis waits at the side-path entrance; Kitty sees him WALK INTO the clearing
   // before the interaction appears. Nobody materializes at the conversation spot.
   const meeting=meetingPoint(this.storyTarget,stage);
   const origin=constrainRescue(luisEntryPoint(meeting),this.storyMap);
   this.storyLuis=actor('luis',origin);
   const xy=toScreen(origin);
   this.storyLuisShadow=this.add.ellipse(xy.x,xy.y+2,31,9,0x534859,.23)
    .setDepth(xy.y-1);
   this.storyObjects.push(this.storyLuisShadow);
   if(stage==='meet-couple'){
    this.storyVale=this.add.image(xy.x-30,xy.y+2,valeTexture(false,0))
     .setOrigin(.5,.9).setScale(.87).setDepth(xy.y+2);
    this.storyHands=this.add.graphics().setDepth(xy.y+3);
    this.storyValeShadow=this.add.ellipse(xy.x-30,xy.y+4,25,8,0x534859,.20).setDepth(xy.y+1);
    this.storyObjects.push(this.storyVale,this.storyValeShadow,this.storyHands);
    this.story.guide('Luis y Vale caminan por el sendero de los cerezos. Acércate a saludarlos.');
   }else{
    const next=toScreen({u:35.3,v:6.3});
    this.storyLouis=actor('louis',{u:35.3,v:6.3});
    if(previousLouis){
     this.storyLouis.setPosition(previousLouis.x,previousLouis.y);
     this.storyLouisWalk={from:previousLouis,to:next,elapsed:0,
      duration:Math.max(900,Math.min(2900,Math.hypot(next.x-previousLouis.x,next.y-previousLouis.y)*8))};
    }
    this.story.guide('Luis viene por el camino entre los cerezos. Acércate a saludarlo.');
   }
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
  if(['ribbon','petals','wheel'].includes(stage)&&this.storyMap==='dusk_search'){
   this.drawPhysicalClue(stage);
  }
  if(['meet-couple','talk-louis'].includes(stage))marker('✧',this.storyTarget);
  if(stage==='door'||stage==='window')marker(stage==='door'?'⚿':'✧',this.storyTarget);
  const dark=darknessAt(this.p.u,stage,this.storyMap);
  if(force){this.storyDusk=dark;this.storyDuskReported=dark;this.story.dusk(dark);}
  // Music follows narrative tension and map, not an arbitrary coordinate.
  const eerie=this.storyMap==='dusk_search'||this.storyMap==='night_neighborhood'||
   stage==='disappearance'||dark>.30;
  this.audio.setTheme(stage==='defend'?'battle':eerie?'final':'garden');
  this.refreshStoryMix(stage,dark);
  if(stage==='ribbon'&&this.storyMap==='afternoon_meeting')
   this.story.guide('Busca el sendero brillante: las pistas continúan en el bosque ✧');
  if(stage==='door'&&this.storyMap==='dusk_search')
   this.story.guide('Sigue las luces: la casa está al otro lado de la salida ✧');
  this.sync();
 }
 // Peaceful return uses the normal camera, player movement and constrained
 // breadcrumb follower. No prologue events, combat, van or house navigation.
 private setupEpilogue(chapter:EpilogueChapter){
  this.p=constrainRescue(chapter.spawn,this.storyMap);
  this.storyTarget=constrainRescue(chapter.target,this.storyMap);
  this.positionPlayer();const at=toScreen(this.p);this.cameras.main.centerOn(at.x,at.y);
  const add=(kind:'louis'|'emy'|'luis'|'vale',point:IsoPoint,follow:boolean)=>{
   const p=constrainRescue(point,this.storyMap),xy=toScreen(p);
   const key=kind==='louis'?'chibi-louis-down-0':kind==='emy'?greyCatTexture('idle',0):kind==='luis'?luisTextureKey('down','idle',0):valeTexture(false,0);
   const actor=this.add.image(xy.x,xy.y,key).setOrigin(.5,.9).setScale(kind==='louis'?1.3:kind==='emy'?.72:kind==='luis'?.8:.87).setDepth(xy.y);
   this.storyObjects.push(actor);
   if(follow)this.epilogueFollowers.push({actor,point:p,trail:[],kind,facing:'down',walk:0});
   if(kind==='louis')this.storyLouis=actor;
   if(kind==='emy'){this.storyCat=actor;this.storyCatPoint=p;}
   if(kind==='luis')this.storyLuis=actor;
   if(kind==='vale')this.storyVale=actor;
   return actor;
  };
  add('louis',{u:this.p.u+.65,v:this.p.v+.38},true);
  add('emy',{u:this.p.u-.55,v:this.p.v-.38},true);
  if(chapter.couple){
   add('luis',{u:this.storyTarget.u-.55,v:this.storyTarget.v+.65},false);
   add('vale',{u:this.storyTarget.u-.98,v:this.storyTarget.v+.65},false);
  }
  const xy=toScreen(this.storyTarget);
  const ring=this.add.ellipse(xy.x,xy.y,76,31,0xffe9ad,.30).setStrokeStyle(2,0xfff4cb,.95).setDepth(xy.y-1);
  const heart=this.add.text(xy.x,xy.y-20,'♡',{fontFamily:'Georgia',fontSize:'29px',color:'#fff7df',stroke:'#a4758b',strokeThickness:3}).setOrigin(.5,1).setDepth(xy.y+4);
  this.storyObjects.push(ring,heart);
  if(chapter.next==='complete')this.decorateEpiloguePicnic();
  if(!this.reducedMotion)this.tweens.add({targets:ring,alpha:.60,scaleX:1.08,scaleY:1.08,duration:1050,yoyo:true,repeat:-1});
  this.storyDusk=chapter.light;this.storyDuskReported=chapter.light;this.story?.dusk(chapter.light);this.story?.map(chapter.map);this.story?.guide(chapter.objective);
  this.story?.area(this.storyWorld?.area(this.p.u)??'sendero');
  this.total=0;this.collected=0;this.audio.setTheme('garden');
  this.audio.setRescueMix({mood:'garden',music:.85,ambience:.65,birds:true});this.sync();
 }
 private decorateEpiloguePicnic(){
  const at=toScreen(this.storyTarget),g=this.add.graphics().setDepth(at.y-2);
  // In-world picnic blanket, cake and candles. Ground decoration only, not
  // a new collider across the existing walkable path.
  g.fillStyle(0x694a63,.18).fillEllipse(at.x,at.y-7,106,33);
  for(let y=0;y<5;y++)for(let x=0;x<9;x++){
   g.fillStyle((x+y)%2?0xe8b2c5:0xffe6d7,.94);
   g.fillRect(at.x-45+x*10,at.y-25+y*6,10,6);
  }
  const cake=this.add.graphics().setDepth(at.y+1);
  cake.fillStyle(0x765366,.25).fillEllipse(at.x,at.y-13,39,11);
  cake.fillStyle(0xfff0dc).fillEllipse(at.x,at.y-17,34,11);
  cake.fillStyle(0xcd829e).fillRoundedRect(at.x-13,at.y-36,26,18,4);
  cake.fillStyle(0xffe4d7).fillEllipse(at.x,at.y-36,26,8);
  cake.fillStyle(0xc65e85).fillRect(at.x-12,at.y-27,24,3);
  const flames=this.add.graphics().setDepth(at.y+2);this.epilogueFlames=flames;
  for(let x=-8;x<=8;x+=8){cake.fillStyle(0xfff0c1).fillRect(at.x+x-1,at.y-45,3,9);
   flames.fillStyle(0xffb45d).fillEllipse(at.x+x,at.y-47,4,7);
   flames.fillStyle(0xffeed1).fillEllipse(at.x+x,at.y-47,2,3);}
  const bunting=this.add.graphics().setDepth(at.y-6);
  bunting.lineStyle(3,0x92736b).lineBetween(at.x-58,at.y-9,at.x-58,at.y-77).lineBetween(at.x+58,at.y-9,at.x+58,at.y-77);
  bunting.lineStyle(1,0x9b7381).lineBetween(at.x-58,at.y-77,at.x,at.y-67).lineBetween(at.x,at.y-67,at.x+58,at.y-77);
  for(let i=0;i<8;i++){const x=at.x-52+i*14,y=at.y-76+10*(1-Math.abs(x-at.x)/58);
   bunting.fillStyle([0xeaa4ba,0xf4cf93,0xc2d4a7][i%3]).fillTriangle(x,y,x+10,y+1,x+5,y+12);}
  this.storyObjects.push(g,cake,bunting,flames);
 }
 blowEpilogueCandles(){
  if(!this.story?.epilogue||!this.epilogueFlames?.active||!this.epilogueFlames.visible)return;
  this.epilogueFlames.setVisible(false);
  if(!this.reducedMotion)this.tweens.add({targets:this.player,angle:-3,duration:180,yoyo:true});
  this.audio.tone(660,.25,.03);this.audio.tone(990,.45,.02);
 }
 private animateEpilogueTalk(){
  const speaker=this.story?.speaker?.(),talking=this.story?.speaking?.()??false,frame=this.reducedMotion?0:Math.floor(this.clock/160);
  if(this.storyLuis){const speaks=speaker==='Luis'&&talking;this.storyLuis.setTexture(luisTextureKey('down',speaks?'talk':'idle',speaks?frame%3:0));}
  if(this.storyVale)this.storyVale.setTexture(speaker==='Vale'&&talking?valeTalkTexture(frame%3):valeTexture(false,0));
  if(this.storyLouis)this.storyLouis.setTexture('chibi-louis-down-'+(speaker==='Louis'&&talking&&!this.reducedMotion?6+frame%2:0)).setFlipX(false);
  if(this.storyCat)this.storyCat.setTexture(greyCatTexture('love',frame%4));
 }
 private updateEpilogue(dt:number,chapter:EpilogueChapter){
  // Each companion retains a separate short trail and follows real walkable
  // samples. Distinct final spacing keeps their silhouettes readable.
  for(const follower of this.epilogueFollowers){
   const lead=follower.kind==='emy'?this.epilogueFollowers[0]?.point??this.p:this.p;
   const state=stepRescueFollower(follower.point,lead,follower.trail,dt,this.storyMap);
   follower.trail=state.trail;follower.point=state.position;
   const xy=toScreen(state.position),dx=xy.x-follower.actor.x,dy=xy.y-follower.actor.y;
   if(state.walking){follower.walk+=dt;follower.facing=feelFacingToTarget(dx,dy,follower.facing);}
   else follower.walk=0;
   const dir=follower.facing==='left'?'right':follower.facing;
   const frame=this.reducedMotion?0:state.walking?1+Math.floor(follower.walk/150)%4:storyActorIdle(this.clock+1570,false).frame;
   const key=follower.kind==='emy'?greyCatTexture(state.walking?'walk':'idle',this.reducedMotion?0:Math.floor((state.walking?follower.walk:this.clock)/180)%4):`chibi-louis-${dir}-${frame}`;
   follower.actor.setPosition(xy.x,xy.y).setDepth(xy.y).setFlipX(follower.facing==='left');
   if(this.textures.exists(key)&&follower.actor.texture.key!==key)follower.actor.setTexture(key);
   if(follower.kind==='emy')this.storyCatPoint=state.position;
  }
  const idle=luisAnimationFrame(this.clock,'idle',this.reducedMotion);
  this.storyLuis?.setTexture(luisTextureKey('down','idle',idle));
  this.storyVale?.setTexture(valeTexture(false,luisAnimationFrame(this.clock+710,'idle',this.reducedMotion)));
  const together=chapter.next!=='complete'||this.epilogueFollowers.every(f=>isoDistance(f.point,this.p)<2.5);
  const label=isoDistance(this.p,this.storyTarget)<1.25&&together?chapter.action:'';
  if(label!==this.storyNear){this.storyNear=label;this.story?.near(label);}
 }
 drawPhysicalClue(stage:IsoStoryStage){
  const xy=toScreen(this.storyTarget),clue=this.add.graphics().setDepth(xy.y+1);
  // Small ground-level props with recognizable silhouettes, no floating glyph.
  if(stage==='ribbon'){
   clue.fillStyle(0x302939,.36).fillEllipse(xy.x,xy.y+2,24,10);
   clue.lineStyle(4,0x78384e,1).strokeEllipse(xy.x,xy.y,19,10);
   clue.lineStyle(2,0xe6a2b4,1).strokeEllipse(xy.x,xy.y-1,17,8);
   clue.fillStyle(0xffe0ad).fillCircle(xy.x+7,xy.y-1,2.7);
  }else if(stage==='petals'){
   for(let i=0;i<9;i++){
    const px=xy.x+(i-4)*4,py=xy.y+Math.sin(i*1.7)*5;
    clue.fillStyle(i%2?0xe4a4b8:0xc17c96).fillEllipse(px,py,7,3);
   }
   clue.lineStyle(1,0x87637b,.65).lineBetween(xy.x-14,xy.y+4,xy.x+17,xy.y-3);
  }else{
   for(let i=0;i<6;i++)for(const side of [-1,1]){
    const px=xy.x+(i-3)*7,py=xy.y+(i-3)*3+side*7;
    clue.fillStyle(0x4a3c42,.7).fillEllipse(px,py,9,4);
    clue.lineStyle(1,0x9b827d,.7).lineBetween(px-3,py+1,px+3,py-1);
   }
  }
  this.storyObjects.push(clue);
  // A subtle glint remains invisible until either close by or help is needed.
  const hint=this.add.text(xy.x,xy.y-10,'✧',{fontFamily:'Georgia',fontSize:'16px',
   color:'#ffe2ad',stroke:'#76556d',strokeThickness:2}).setOrigin(.5,1).setDepth(xy.y+4).setAlpha(0);
  this.storyObjects.push(hint);this.storyClueHint=hint;
 }
 // Optional memories use existing actors and landmarks. There is no story
 // event, HP reward, forced wait or new checkpoint for any of these actions.
 availableStoryMoment():StoryMoment|null{
  if(!this.story||this.paused||this.story.locked()||this.storyExitPending||
   this.storyAbduction||this.storyFeeding||this.storyLouisWalk||
   luisMotionIsBlocking(this.storyLuisMotion)||this.enemies.length||
   !['intro','feed-cat','cat-fed','meet-couple','talk-louis','walk-together'].includes(this.storyStage))return null;
  const at=toScreen(this.p);
  const nearActor=(actor:StoryActor|undefined)=>!!actor?.active&&actor.visible&&actor.alpha>.65&&
   Math.hypot((actor.x-at.x)/41,(actor.y-at.y)/20)<1.85;
  if(this.storyCat&&nearActor(this.storyCat))return {id:'emy',label:'Acariciar a Emy',title:'Un ratito con Emy',point:{...this.storyCatPoint}};
  if(this.storyLuisReady&&nearActor(this.storyLuis)&&nearActor(this.storyVale))
   return {id:'couple',label:'Compartir un momento',title:'Con Luis y Vale',point:{...this.p}};
  if(nearActor(this.storyLouis))return {id:'louis',label:'Compartir un momento',title:'Un paseo con Louis',point:{...this.p}};
  const landmark=nearbyRescueLandmark(this.storyMap,this.p);
  if(!landmark)return null;
  if(landmark.id==='river-lookout')return {id:'river',label:'Contemplar el río',title:'Río de los pétalos',point:landmark.point};
  if(landmark.id==='quiet-grove')return {id:'rest',label:'Descansar',title:'Un instante en el jardín',point:landmark.point};
  if(['flower-nook','cherry-court'].includes(landmark.id))return {id:'flowers',label:'Disfrutar las flores',title:landmark.title,point:landmark.point};
  return null;
 }
 // Photograph only a moment already available in the actual scene. Actors
 // keep their exact world positions and are restored before gameplay resumes.
 beginStoryPhoto(moment:StoryMoment){
  const group=!!this.story?.epilogue&&this.story.epilogue.next==='complete'&&moment.id==='couple'&&!!this.storyNear;
  if(this.storyPhoto||(!group&&this.availableStoryMoment()?.id!==moment.id))return false;
  this.clearInput();this.storyPhoto=true;this.storyVelocity={u:0,v:0};this.storyStepTravel=0;
  const pose=(actor:PhotoActor|undefined,key:string)=>{
   if(!actor?.active||!actor.visible||!this.textures.exists(key))return;
   this.photoActors.push({actor,key:actor.texture.key,flip:actor.flipX,angle:actor.angle,scaleX:actor.scaleX,scaleY:actor.scaleY});
   actor.setTexture(key).setFlipX(false).setAngle(0);
  };
  pose(this.player,KITTY_POSTCARD);
  if(moment.id==='couple'){
   pose(this.storyLuis,luisTextureKey('down','wave',1));
   pose(this.storyVale,valeTalkTexture(0,'down'));
  }
  if(moment.id==='louis'||group)pose(this.storyLouis,'chibi-louis-down-6');
  if(moment.id==='emy'||group)pose(this.storyCat,greyCatTexture('love',0));
  if(moment.id==='river'||moment.id==='rest'){
   // Replace the waving pose, while retaining the original restore record.
   if(this.textures.exists(kittySeatKey(2)))this.player.setTexture(kittySeatKey(2));
  }
  return true;
 }
 endStoryPhoto(){
  for(const item of this.photoActors)if(item.actor.active)
   item.actor.setTexture(item.key).setFlipX(item.flip).setAngle(item.angle).setScale(item.scaleX,item.scaleY);
  this.photoActors=[];this.storyPhoto=false;this.clearInput();
 }
 enjoyStoryMoment(){
  const moment=this.availableStoryMoment();
  if(!moment||this.clock<this.storyMomentCooldown)return false;
  this.storyMomentCooldown=this.clock+900;
  const a=toScreen(this.p),b=toScreen(moment.point);
  if(Math.hypot(b.x-a.x,b.y-a.y)>2)this.facing=feelFacingToTarget(b.x-a.x,b.y-a.y,this.facing);
  this.storyInteractUntil=this.clock+RESCUE_FEEL.interactMs;
  this.storyVelocity={u:0,v:0};this.storyStepTravel=0;this.clearInput();
  if(moment.id==='emy'){
   this.storyPetUntil=this.clock+1100;
   if(!this.audio.playSample?.('cat',.1))this.audio.tone(720,.12,.018,'triangle');
  }else if(moment.id==='rest'||moment.id==='river')this.storyRestUntil=this.clock+1200;
  else if(moment.id==='louis')this.showStoryBubble('louis','affection');
  else if(moment.id==='couple')this.showStoryBubble('luis','affection');
  this.showStoryBubble('kitty','affection');this.burst(moment.point,0xf7c0d2);
  this.audio.tone(790,.11,.018,'triangle');
  return true;
 }
 storyInteract(){
  if(!this.story||this.story.locked()||luisMotionIsBlocking(this.storyLuisMotion)||!this.storyNear)return;
  if(this.story.epilogue){this.clearInput();this.story.interact(this.storyStage);return;}
  const optional=this.storyOptional;
  const interactionAt=optional?optional.point:this.storyVanNear?VAN_NIGHT_POSITION:
   this.storyStage==='intro'?CHURU_POSITION:this.storyStage==='feed-cat'?this.storyCatPoint:
   meetingPoint(this.storyTarget,this.storyStage);
  const foot=toScreen(this.p),target=toScreen(interactionAt);
  this.facing=feelFacingToTarget(target.x-foot.x,target.y-foot.y,this.facing);
  this.storyInteractUntil=this.clock+RESCUE_FEEL.interactMs;
  this.storyVelocity={u:0,v:0};this.storyStepTravel=0;
  this.showStoryBubble('kitty','discover');
  this.audio.tone(810,.085,.010,'sine');
  if(optional){
   // No new story stage, reward gate, modal or forced wait.
   this.storyVisited.add(optional.id);this.story.discover?.(optional.id);this.burst(optional.point,0xffd9b5);
   this.floatNote(optional.point,'♡','#bc6d91');
   this.story.guide(optional.message);this.audio.tone(740,.12,.018,'triangle');
   this.storyOptional=undefined;this.storyNear='';this.story.near('');return;
  }
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
  this.p=constrainRescue(this.storyTarget,this.storyMap);
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
   !['talk-luis','meet-couple'].includes(this.storyStage))return;
  this.storyLuisArriving=true;this.story?.near('');this.storyNear='';
  this.storyLuisMotion=makeLuisMotion('arriving',meetingPoint(this.storyTarget,this.storyStage));
  this.clearInput();
 }
 playStoryLuisFarewell(done:()=>void){
  if(!this.storyLuis?.active){done();return;}
  if(this.storyLuisFarewell)return;
  this.storyLuisFarewell=true;this.story?.near('');this.storyNear='';
  this.clearInput();
  const meeting=meetingPoint(this.storyTarget,this.storyStage);
  this.storyLuisMotion=makeLuisMotion('farewell-wave',meeting,done);
  this.showStoryBubble('luis','farewell');
  this.story?.guide(this.storyVale?'Luis y Vale se despiden y vuelven por el sendero.':
   'Luis se despide con la mano y vuelve caminando al sendero.');
  this.luisHeart(meeting);
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
  const meeting=meetingPoint(this.storyTarget,this.storyStage);
  if(completed==='arriving'){
   this.storyLuisMotion=makeLuisMotion('greeting',meeting);
   this.showStoryBubble('luis','affection');
   this.luisHeart(meeting);
  }else if(completed==='greeting'){
   this.storyLuisMotion=undefined;this.storyLuisReady=true;
   this.story.guide(this.storyVale?'Luis y Vale están aquí. Pulsa E o toca el botón para saludarlos.':
    'Acércate a Luis y pulsa E para hablar.');
  }else if(completed==='farewell-wave'){
   this.storyLuisMotion=makeLuisMotion('farewell-walk',meeting,done);
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
    // Face the current tangent of the curved path, not the overall chord.
    const previous=toScreen(luisPointOnPath({...motion,
     elapsed:Math.max(0,motion.elapsed-60)}));
    const next=toScreen(luisPointOnPath({...motion,
     elapsed:Math.min(motion.duration,motion.elapsed+60)}));
    dx=next.x-previous.x;dy=next.y-previous.y;
    facing=dy< -Math.abs(dx)*.9?'up':
     Math.abs(dx)>Math.abs(dy)*.55?'right':'down';
   }
  }else{
   facing=dy< -46&&Math.abs(dx)<27?'up':Math.abs(dx)>32?'right':'down';
   // Only the actual speaker animates speech; listeners keep their idle pose.
   if(this.story.speaker?.()==='Luis'&&(this.story.speaking?.()??true)){pose='talk';if(facing==='up')facing='down';}
  }
  const clock=motion?motion.elapsed:this.clock;
  const frame=luisAnimationFrame(clock,pose,this.reducedMotion);
  const texture=luisTextureKey(facing,pose,frame);
  if(npc.texture.key!==texture&&this.textures.exists(texture))npc.setTexture(texture);
  npc.setFlipX(facing==='right'&&dx<0);
  const vale=this.storyVale,hands=this.storyHands;
  if(!vale||!hands)return;
  const alpha=motion?.kind==='farewell-walk'?Math.min(1,(motion.duration-motion.elapsed)/320):1;
  // The two walkers share the route, but not a single rigid gait. Vale
  // stays beside Luis while her own step cycle and posture follow his pace.
  const walking=pose==='walk',offset=this.reducedMotion?0:walking?Math.sin(clock/160)*1.8:Math.sin(clock/1050)*.8;
  const valeFrame=luisAnimationFrame(clock+(walking?85:710),walking?'walk':'idle',this.reducedMotion);
  const valeSpeaking=!motion&&this.story.speaker?.()==='Vale'&&(this.story.speaking?.()??true);
  const valeFacing=valeSpeaking&&facing==='up'?'down':facing;
  const valeKey=valeSpeaking?valeTalkTexture(this.reducedMotion?0:Math.floor(clock/170)%3,valeFacing):valeTexture(walking,valeFrame,valeFacing);
  if(vale.texture.key!==valeKey&&this.textures.exists(valeKey))vale.setTexture(valeKey);
  vale.setPosition(npc.x-30+offset,npc.y+2).setDepth(npc.y+2).setAlpha(alpha)
   .setFlipX(facing==='right'&&dx<0)
   .setAngle(this.reducedMotion?0:walking?Math.sin(clock/160)*1.6:valeSpeaking?Math.sin(clock/230)*1.2:0);
  this.storyValeShadow?.setPosition(vale.x,vale.y+2).setDepth(vale.y-1).setAlpha(alpha);
  npc.setAlpha(alpha);this.storyLuisShadow?.setAlpha(alpha);
  npc.setAngle(this.reducedMotion?0:pose==='talk'?Math.sin(clock/160)*1.1:pose==='wave'?Math.sin(clock/230)*.7:0);
  hands.clear().setDepth(npc.y+3);
  hands.lineStyle(4,0x634257,alpha).lineBetween(vale.x+12,vale.y-10,npc.x-12,npc.y-10);
  hands.lineStyle(2,0xf6bf99,alpha).lineBetween(vale.x+12,vale.y-10,npc.x-12,npc.y-10);
 }
 playStoryFeeding(done:()=>void){
  if(!this.storyCat?.active){done();return;}
  this.storyFeeding={elapsed:0,done};
  this.storyInteractUntil=this.clock+2250;
  this.storyChuru?.setTexture('emy-kitty-wave');
  this.storyNear='';this.story?.near('');
  this.clearInput();
  if(!this.audio.playSample?.('churu',.12))this.audio.tone(554,.14,.025,'triangle');
 }
 updateStoryCat(dt:number){
  const cat=this.storyCat;
  if(!cat?.active)return;
  if(this.storyFeeding){
   const feeding=this.storyFeeding;
   feeding.elapsed+=dt;
   cat.setTexture(greyCatTexture('love',this.reducedMotion?0:Math.floor(feeding.elapsed/170)));
   this.storyChuru?.setPosition(this.player.x+15,this.player.y-26).setScale(.7).setAngle(this.reducedMotion?0:Math.sin(feeding.elapsed/110)*19).setDepth(this.player.y+2);
   if(feeding.elapsed>=2200){
    this.storyFeeding=undefined;
    feeding.done();
    if(!this.audio.playSample?.('cat',.14))this.audio.tone(784,.19,.03,'triangle');
   }
   return;
  }
  const elapsed=this.clock-this.storyStageAt,frame=this.reducedMotion?0:Math.floor(elapsed/280);
  const idleFrame=this.reducedMotion?0:elapsed%4200>4010?3:Math.floor(elapsed/360)%3;
  if(this.storyPetUntil>this.clock&&this.storyStage!=='cat-fed'){
   cat.setTexture(greyCatTexture('love',this.reducedMotion?0:Math.floor(this.clock/170)));
   cat.setAngle(this.reducedMotion?0:Math.sin(this.clock/190)*2);
   return;
  }
  if(this.storyStage==='cat-fed'){
   const distance=Math.min(1,Math.max(0,(elapsed-450)/2300));
   const start=this.storyCatPoint;
   const xy=toScreen(constrainRescue({u:start.u+4.5*distance,v:start.v-.65*distance},this.storyMap));
   cat.setPosition(xy.x,xy.y).setDepth(xy.y).setAlpha(Math.min(1,(1-distance)*5))
    .setTexture(greyCatTexture(distance>0?'love-walk':'love',frame));
   if(this.storyPetUntil>this.clock&&distance<.8)cat.setAngle(this.reducedMotion?0:Math.sin(this.clock/190)*2);else cat.setAngle(0);
   this.storyChuru?.setPosition(this.player.x+15,this.player.y-26).setAngle(this.reducedMotion?0:Math.sin(elapsed/110)*19).setDepth(this.player.y+2).setVisible(elapsed<1700);
  }else{
   // Only approach on the same bank: Emy never crosses the water/bridge.
   const close=this.p.u>16.1&&isoDistance(this.p,this.storyCatPoint)<4;
   const target=constrainRescue({u:this.p.u+.65,v:this.p.v+.25},this.storyMap);
   const dist=isoDistance(target,this.storyCatPoint),step=close?Math.min(dist,dt*.0015):0;
   if(dist>1e-5&&step>0){
    this.storyCatPoint={u:this.storyCatPoint.u+(target.u-this.storyCatPoint.u)*step/dist,v:this.storyCatPoint.v+(target.v-this.storyCatPoint.v)*step/dist};
   }
   const xy=toScreen(this.storyCatPoint);
   cat.setPosition(xy.x,xy.y).setDepth(xy.y).setFlipX(xy.x<this.player.x).setTexture(greyCatTexture(step>.005?'walk':'idle',step>.005?frame:idleFrame));
   cat.setAngle(this.reducedMotion?0:step>.005?Math.sin(elapsed/130)*1.2:Math.sin(elapsed/900)*.4);
   this.storyTarget={...this.storyCatPoint};
   this.storyChuru?.setPosition(this.player.x+(this.facing==='left'?-13:13),this.player.y-14).setDepth(this.player.y+1).setAngle(this.facing==='left'?-15:15);
  }
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
  const facing=storyActorFacing(motion.to.x-x,motion.to.y-y,this.storyLouisFacing);
  this.storyLouisFacing=facing;
  const key=`chibi-louis-${facing==='left'?'right':facing}-${1+Math.floor(this.clock/160)%4}`;
  if(this.textures.exists(key)&&npc.texture.key!==key)npc.setTexture(key);
  npc.setFlipX(facing==='left');
  if(motion.elapsed>=motion.duration){
   this.storyLouisWalk=undefined;
   const facing=this.storyLouisFacing==='left'?'right':this.storyLouisFacing;
   const idle=`chibi-louis-${facing}-0`;
   if(this.textures.exists(idle))npc.setTexture(idle);
  }
 }
 updateStoryAbduction(dt:number){
  const shot=this.storyAbduction;
  if(!shot)return;
  shot.elapsed=Math.min(ABDUCTION_TIMING.escape,shot.elapsed+dt);
  const frame=abductionFrame(shot.elapsed,shot.origin),prior=shot.phase;
  shot.phase=frame.phase;
  if(prior!==frame.phase){
   if(['doors','struggle'].includes(frame.phase)){
    const kitty=toScreen(this.p),what=toScreen(frame.phase==='struggle'?
     frame.victim:frame.van);
    this.facing=feelFacingToTarget(what.x-kitty.x,what.y-kitty.y,this.facing);
   }
   const reaction=kidnappingReaction(frame.phase,prior);
   if(reaction)this.showStoryBubble('kitty',reaction);
   if(frame.phase==='struggle')this.showStoryBubble('louis','fear');
   if(frame.phase==='escape')this.story?.guide('¡Louis!… Recuerda la media luna.');
   if(frame.phase==='doors')this.audio.tone(270,.17,.036,'sawtooth');
   if(frame.phase==='struggle'){
    if(!this.reducedMotion)this.cameras.main.shake(210,.0018);
    this.audio.tone(145,.14,.040,'triangle');
    this.story?.guide('¡Se llevan a Louis! Fíjate en la furgoneta.');
   }
   if(frame.phase==='close'&&!this.audio.playSample?.('van-door',.14))this.audio.tone(170,.18,.052,'square');
   if(frame.phase==='escape'&&!this.audio.playSample?.('van-away',.16))this.audio.tone(320,.3,.045,'sawtooth');
  }
  const v=toScreen(frame.van),key=vanTexture(frame.doorOpen);
  shot.van.setPosition(v.x,v.y).setDepth(v.y+10);
  if(shot.van.texture.key!==key)shot.van.setTexture(key);
  shot.van.setTint(frame.brake?0xffe2e2:0xffffff);
  // Suspension settles briefly on arrival; no changes to the scene timeline.
  const settle=shot.elapsed-ABDUCTION_TIMING.arrival;
  shot.van.setAngle(!this.reducedMotion&&settle>=0&&settle<320?Math.sin(settle/55)*1.35*(1-settle/320):0);
  for(const [sprite,point,mask] of [
   [shot.fox,frame.fox,'fox'],[shot.rabbit,frame.rabbit,'rabbit']
  ] as const){
   const p=toScreen(point);
   sprite.setVisible(frame.captorsVisible).setPosition(p.x,p.y).setDepth(p.y+4);
   const pose=frame.phase==='struggle'||frame.phase==='load'?'grab':
    ['disembark','approach','board'].includes(frame.phase)?'walk':'idle';
   const face=captorTexture(mask,pose,captorFrame(shot.elapsed,pose));
   if(sprite.texture.key!==face)sprite.setTexture(face);
   sprite.setAngle(!this.reducedMotion&&pose==='walk'?Math.sin(shot.elapsed/100+(mask==='fox'?0:Math.PI))*1.1:0);
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
    shot.dust.fillStyle(0x8d7c85,(1-t)*.12*frame.dust).fillEllipse(x+2,v.y+8-t*8,16+t*15,7+t*5);
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
  if(this.story.epilogue){this.updateEpilogue(dt,this.story.epilogue);return;}
  const stage=this.storyStage;
  const area=this.storyWorld?.area(this.p.u);
  if(area&&area!==this.storyArea){this.storyArea=area;this.story.area(area);}
  if(stage==='defend'&&!this.storyWalkTriggered){
   const distance=isoDistance(this.p,this.storyTarget);
   if(distance<5&&!this.storyTargetCuePlayed){
    this.storyTargetCuePlayed=true;
    this.story.guide('¡Auxilio! — Alguien pide ayuda tras los cerezos. ¡Acércate!');
    this.audio.storyHelpCry();
   }
   if(distance<2.2){
    this.storyWalkTriggered=true;
    const louisAt=toScreen({u:34.75,v:4.90});
    this.storyLouis=this.add.image(louisAt.x,louisAt.y,'chibi-louis-down-0')
     .setOrigin(.5,.9).setScale(1.3).setDepth(louisAt.y);
    this.storyObjects.push(this.storyLouis);
    this.showStoryBubble('louis','fear');
    for(const p of [{u:34.1,v:3.1},{u:35.6,v:5.75},{u:36.05,v:4.0}])
     this.spawnEnemy(p,false);
    this.audio.tone(460,.29,.055,'sawtooth');
    this.story.guide('¡Defiéndelo! Dispara corazones con las flechas o el joystick derecho.');
   }
  }
  if(stage==='intro'){
   const step=this.p.u>=9?2:this.p.u>=3?1:0;
   if(step!==this.storyGuideStep){
    this.storyGuideStep=step;
    const hints=[
     'Camina por el sendero · WASD o joystick izquierdo',
     'Hay un Churu sobre el paño rosa. Pulsa E o toca el botón para recogerlo.',
     'El Churu quedó junto al sendero, antes del puente de madera.'
    ];
    this.story.guide(hints[step]);
   }
  }
  if(stage==='walk-together'&&this.storyLouis){
   const npc=this.storyLouis,wx=(npc.x-ISO.originX)/(ISO.tileW/2),wy=(npc.y-ISO.originY)/(ISO.tileH/2);
   const current={u:(wx+wy)/2,v:(wy-wx)/2};
   // Follow Kitty's actual walkable breadcrumb trail, not an offset through a prop.
   const state=stepRescueFollower(current,this.p,this.storyFollowTrail,dt,this.storyMap);
   this.storyFollowTrail=state.trail;
   const xy=toScreen(state.position),dx=xy.x-npc.x,dy=xy.y-npc.y;
   npc.setPosition(xy.x,xy.y).setDepth(xy.y);
   if(state.walking){
    this.storyCompanionClock+=dt;
    this.storyCompanionFacing=attentiveFacing(dx,dy,this.storyCompanionFacing);
   }else{
    this.storyCompanionClock=0;
    const kitty=toScreen(this.p);
    this.storyCompanionFacing=attentiveFacing(kitty.x-xy.x,kitty.y-xy.y,this.storyCompanionFacing);
   }
   // A brief nonblocking reaction during the shared walk, not extra dialogue.
   if(!this.storyFollowCue&&this.clock-this.storyStageAt>1400&&isoDistance(this.p,state.position)<2){
    this.storyFollowCue=true;this.showStoryBubble('louis','affection');
   }
   const facing=this.storyCompanionFacing==='left'?'right':this.storyCompanionFacing;
   const frame=this.reducedMotion?0:state.walking?1+Math.floor(this.storyCompanionClock/150)%4:storyActorIdle(this.clock+1570,false).frame;
   const key=`chibi-louis-${facing}-${frame}`;
   if(this.textures.exists(key)&&npc.texture.key!==key)npc.setTexture(key);
   npc.setFlipX(this.storyCompanionFacing==='left');
   // Louis also has a tiny idle posture; he doesn't moonwalk in place.
   npc.setAngle(this.reducedMotion?0:state.walking?
    Math.sin(this.storyCompanionClock/160*Math.PI)*1.4:Math.sin(this.clock/950)*.4);
   const breath=state.walking?0:storyActorIdle(this.clock+1570,this.reducedMotion).breath;
   npc.setScale(1.3*(1+breath),1.3*(1-breath));
   const atClearing=isoDistance(this.p,this.storyTarget)<.98;
   if(!this.storyWalkTriggered&&atClearing){
    this.companionWaitAt??=this.clock;
    if(companionReady(isoDistance(this.p,state.position),this.clock-this.companionWaitAt)){
     this.storyWalkTriggered=true;this.story.clearing();
    }
   }else this.companionWaitAt=null;
  }
  const meeting=stage==='meet-couple'||stage==='talk-luis';
  if(meeting&&!this.storyLuisReady&&!this.storyLuisArriving&&
   isoDistance(this.p,this.storyTarget)<LUIS_BEATS.approachRadius)this.startLuisArrival();
  const labels:Partial<Record<IsoStoryStage,string>>={
   intro:'Recoger Churu','feed-cat':'Alimentar a Emy','meet-couple':'Saludar a Luis y Vale',
   'talk-louis':'Hablar con Louis','talk-luis':'Hablar con Luis',
   ribbon:'Examinar Pulsera',petals:'Examinar Pétalos',wheel:'Examinar Huellas',
   door:'Probar puerta',window:'Entrar por la ventana'
  };
  const canInteract=(!meeting||this.storyLuisReady)&&
   (stage!=='talk-louis'||!this.storyLouisWalk);
  const vanIsClose=this.storyMap==='night_neighborhood'&&
   ['door','window'].includes(stage)&&
   isoDistance(this.p,VAN_NIGHT_POSITION)<2.0;
  const radius=this.storyMap==='night_neighborhood'?
   (stage==='window'?NIGHT_WINDOW_INTERACTION_RADIUS:NIGHT_INTERACTION_RADIUS):1.15;
  const mainTarget=canInteract&&labels[stage]&&isoDistance(this.p,this.storyTarget)<radius?
   labels[stage]!:'';
  this.storyVanNear=!mainTarget&&vanIsClose;
  if(this.storyClueHint?.active){
   const distance=isoDistance(this.p,this.storyTarget),age=this.clock-this.storyStageAt;
   this.storyClueHint.setAlpha(distance<3? .8:age>12000?.65:0);
  }
  // First discovery is a physical, nonblocking expression beside the object.
  if(mainTarget&&!this.storyTargetCuePlayed&&
   ['ribbon','petals','wheel','door','window'].includes(stage)){
   this.storyTargetCuePlayed=true;
   this.showStoryBubble('target',stage==='door'?'uneasy':'discover');
  }
  // Mandatory story target and vehicle always win; no distractions during combat.
  const optional=!mainTarget&&!this.storyVanNear&&
   ['intro','feed-cat','cat-fed','meet-couple','walk-together','ribbon','petals','wheel'].includes(stage)?
   nearbyRescueLandmark(this.storyMap,this.p):undefined;
  this.storyOptional=optional&&!this.storyVisited.has(optional.id)?optional:undefined;
  const target=mainTarget||(this.storyVanNear?'Inspeccionar furgoneta':this.storyOptional?.action??'');
  if(target!==this.storyNear){
   this.storyNear=target;this.story.near(target);
   if(target&&this.storyMap==='night_neighborhood'){
    // Keep assisted walking until Kitty reaches the actual doorstep.
    // Proximity merely ENABLES interaction, not a premature route stop.
    this.burst(this.storyTarget,0xffdfb5);
    this.audio.tone(645,.13,.015);
   }
  }
  const moment=this.availableStoryMoment();
  const momentId=moment?.id??'';
  if(momentId!==this.storyMomentId){this.storyMomentId=momentId;this.story.moment?.(moment);}
  this.checkStoryExit();
 }
 // Small expressive glyphs are NOT RPG dialogue and cannot block input.
 showStoryBubble(anchor:'kitty'|'louis'|'luis'|'target'|'van',emotion:RescueEmotion){
  if(!this.story)return false;
  const position=this.storyBubbleAnchor(anchor);
  if(!position)return false;
  const cue=storyBubble(emotion);
  while(this.storyBubbles.length>=3)this.storyBubbles.shift()?.sprite.destroy();
  const node=this.add.text(position.x,position.y-53,cue.text,{
   fontFamily:'Georgia',fontSize:emotion==='fear'?'19px':'17px',
   fontStyle:'bold',color:cue.color,
   backgroundColor:'#51445a',padding:{x:7,y:3},
   stroke:'#3a3049',strokeThickness:2
  }).setOrigin(.5,1).setDepth(position.y+23).setAlpha(.95);
  this.storyBubbles.push({sprite:node,at:this.clock,anchor});
  return true;
 }
 storyBubbleAnchor(anchor:'kitty'|'louis'|'luis'|'target'|'van'){
  if(anchor==='kitty')return toScreen(this.p);
  if(anchor==='target')return toScreen(this.storyTarget);
  if(anchor==='van')return toScreen(VAN_NIGHT_POSITION);
  const sprite=anchor==='luis'?this.storyLuis:this.storyLouis;
  return sprite?.active&&sprite.visible?{x:sprite.x,y:sprite.y}:null;
 }
 clearStoryBubbles(){
  for(const bubble of this.storyBubbles)bubble.sprite.destroy();
  this.storyBubbles=[];
 }
 private refreshStoryMix(stage:IsoStoryStage,dark:number){
  const dialogue=!!this.story?.speaker?.();
  if(this.story?.epilogue){if(this.storyMixStage!=='epilogue'||this.storyMixDialogue!==dialogue){this.storyMixStage='epilogue';this.storyMixDialogue=dialogue;this.audio.setRescueMix({mood:'garden',music:dialogue?.27:.85,ambience:dialogue?.21:.65,birds:true});}return;}
  if(this.storyMixStage===stage&&this.storyMixMap===this.storyMap&&this.storyMixDark===dark&&this.storyMixDialogue===dialogue)return;
  this.storyMixStage=stage;this.storyMixMap=this.storyMap;this.storyMixDark=dark;this.storyMixDialogue=dialogue;
  this.audio.setRescueMix(rescueMixFor(stage,this.storyMap,dark,dialogue));
 }
 updateStoryPerformance(dt:number){
  if(!this.story)return;
  if(this.story.epilogue){if(this.story.locked())this.animateEpilogueTalk();return;}
  const speaker=this.story.speaker?.();
  if(speaker&&!this.storyAbduction&&!luisMotionIsBlocking(this.storyLuisMotion)){
   const actor=speaker==='Louis'?this.storyLouis:speaker==='Luis'?this.storyLuis:speaker==='Vale'?this.storyVale:undefined;
   if(actor?.active&&actor.visible){const kitty=toScreen(this.p);this.facing=attentiveFacing(actor.x-kitty.x,actor.y-kitty.y,this.facing);}
  }
  const beat=storyboardBeat(this.storyStage,this.clock-this.storyStageAt);
  if(beat&&!this.storyBeatPlayed){
   const target=this.storyStage==='talk-luis'?'luis':
    this.storyStage==='talk-louis'?'louis':
    ['ribbon','petals','wheel'].includes(this.storyStage)?'target':'kitty';
   this.showStoryBubble(target,beat);
   this.storyBeatPlayed=true;
  }
  // Maintain expressive idle while Kitty moves, while dialogue locks and
  // during story hints, without taking over scripted walks or the kidnapping.
  if(!this.storyLouisWalk&&!this.storyAbduction&&this.storyLouis?.active&&
   this.storyStage!=='walk-together'){
   const npc=this.storyLouis,kitty=toScreen(this.p);
   const speaker=this.story.speaker?.();
   const listenerTarget=speaker==='Luis'&&this.storyLuis?.visible?this.storyLuis:
    speaker==='Vale'&&this.storyVale?.visible?this.storyVale:kitty;
   const face=attentiveFacing(listenerTarget.x-npc.x,listenerTarget.y-npc.y,this.storyLouisFacing);
   this.storyLouisFacing=face;
   const idle=storyActorIdle(this.clock+1570,this.reducedMotion);
   const talking=this.story.speaker?.()==='Louis'&&(this.story.speaking?.()??true)&&!this.reducedMotion;
   const frame=talking?6+Math.floor(this.clock/160)%2:idle.frame;
   const visibleFace=talking&&face==='up'?'down':face;
   const texture=`chibi-louis-${visibleFace==='left'?'right':visibleFace}-${frame}`;
   if(this.textures.exists(texture)&&npc.texture.key!==texture)npc.setTexture(texture);
   npc.setFlipX(face==='left');
   npc.setAngle(idle.lean+(talking?Math.sin(this.clock/230)*.9:0));
   npc.setScale(1.3*(1+idle.breath),1.3*(1-idle.breath));
  }
  const remaining:IsoAdventure['storyBubbles']=[];
  for(const bubble of this.storyBubbles){
   const age=this.clock-bubble.at;
   if(age>=1200||!bubble.sprite.active){bubble.sprite.destroy();continue;}
   const p=this.storyBubbleAnchor(bubble.anchor);
   if(!p){bubble.sprite.destroy();continue;}
   bubble.sprite.setPosition(p.x,p.y-52-(this.reducedMotion?0:Math.sin(age/1200*Math.PI)*9))
    .setDepth(p.y+23)
    .setAlpha(Math.min(1,age/115)*(age>850?(1200-age)/350:1));
   remaining.push(bubble);
  }
  this.storyBubbles=remaining;
 }
 resetStoryFeel(){
  this.storyVelocity={u:0,v:0};
  this.storyLookAhead={x:0,y:0};
  this.storyStepTravel=0;this.storyInteractUntil=0;
  this.storyFootprints=[];
  this.storyCompanionClock=0;this.storyFollowHeading={x:1,y:0};
  this.storyFollowTrail=[];this.storyFollowCue=false;
  this.storyCompanionFacing='down';
  // Keep the current dramatic offset across a story beat; interpolate it
  // back to zero instead of abruptly recentering at the end of the kidnapping.
  this.cameras?.main?.setFollowOffset?.(
   -this.storyDramaOffset.x,-this.storyDramaOffset.y);
 }
 updateStoryCameraFeel(dt:number){
  this.storyLookAhead=feelCameraOffset(this.storyLookAhead,this.storyVelocity,dt,this.reducedMotion);
  // Preserve exactly the original zoom/follow formula; no camera shake or
  // dramatic forced pans during ordinary exploration.
  const abduction=this.storyAbduction,kitty=toScreen(this.p);
  const shot=abduction?abductionFrame(abduction.elapsed,abduction.origin):undefined;
  const target=shot?toScreen(['struggle','load'].includes(shot.phase)?
   shot.victim:shot.van):kitty;
  const focus=kidnappingFrameFocus(this.storyStage,shot?.phase,
   abduction?.elapsed??0,kitty,target,this.reducedMotion);
  this.storyDramaOffset=smoothCinematicFocus(this.storyDramaOffset,focus,dt,!abduction);
  this.cameras.main.setFollowOffset?.(
   -this.storyLookAhead.x-this.storyDramaOffset.x,
   -this.storyLookAhead.y-this.storyDramaOffset.y);
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
  const speaking=this.story?.speaker?.()==='Kitty'&&(this.story.speaking?.()??true)&&!this.reducedMotion;
  const frame=touch?0:gait.frame;
  const restAge=1200-(this.storyRestUntil-this.clock);
  const seatStep=restAge<150?0:restAge<300?1:restAge>1050?0:restAge>900?1:2;
  const seated=!moving&&!firing&&!hurt&&this.storyRestUntil>this.clock&&this.textures.exists(kittySeatKey(seatStep));
  const hurtKey=`chibi-${this.character}-hurt`;
  const texture=seated?kittySeatKey(this.reducedMotion?2:seatStep):hurt&&this.textures.exists(hurtKey)?hurtKey:
   `chibi-${this.character}-${dir}-${hurt?5:frame}${firing&&!hurt?'-shoot':''}`;
  this.positionPlayer();
  const duration=RESCUE_FEEL.interactMs,progress=touch?
   Math.min(1,(this.storyInteractUntil-this.clock)/duration):0;
  if(!this.reducedMotion){
   this.player.y-=gait.footLift+Math.sin((1-progress)*Math.PI)*2.3*(touch?1:0);
  }
  if(this.player.texture.key!==texture)this.player.setTexture(texture);
  const reach=touch&&!this.reducedMotion?Math.sin((1-progress)*Math.PI):0;
  const resting=seated?0:!moving&&this.storyRestUntil>this.clock&&!this.reducedMotion?Math.min(1,(this.storyRestUntil-this.clock)/220):0;
  this.player.setFlipX(!seated&&this.facing==='left')
   .setScale(1.3*(1+recoil*.06+gait.squash+reach*.033),
    1.3*(1-recoil*.08-gait.squash-reach*.055-resting*.075))
   .setAlpha(this.clock<this.inv?
    (this.reducedMotion?.7:Math.floor(this.clock/90)%2?.45:1):1)
   .setAngle(hurt&&!this.reducedMotion?Math.sin(this.clock/35)*10:
    this.reducedMotion?0:gait.lean+reach*(this.facing==='left'?-4:4)+(speaking?Math.sin(this.clock/140)*1.8:0));
  if(hurt)this.player.setTint(0xffa8bb);else this.player.clearTint();
 }
 fitCamera(width:number,height:number){if(width<=0||height<=0)return;
  const camera=this.cameras.main;
  // Preserve classic zoom; only the narrative scene gets a 12% closer framing.
  camera.setZoom(Math.min(width/800,height/450)*1.08);
  if(this.story&&this.player){
   // A modest narrative-only close-up improves character readability on phones.
   camera.setZoom(camera.zoom*1.12);
   camera.startFollow(this.player,false,.12,.12);
  }
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
 spawnEnemy(p:IsoPoint,boss:boolean,kind:'kuromi'|'cinna'='kuromi'){const xy=toScreen(p),shadow=this.add.ellipse(xy.x,xy.y,30,9,0x425c4c,.22).setDepth(xy.y-1),s=this.add.sprite(xy.x,xy.y,`${kind}-0`).setOrigin(.5,.85).setScale(boss?2.6:1.7).setDepth(xy.y);this.enemies.push({p:{...p},s,shadow,hp:boss?12:3,boss,kind,next:this.story?rescueFirstAttack(this.clock,this.enemies.length):1500+this.enemies.length*500,flash:0,phase:0});}
 sync(){const boss=this.enemies.find(e=>e.boss);this.report({hp:this.hp,objective:this.story?this.story.objective(this.storyStage):this.level===1?'Luces encontradas':this.level===2?'Travesuras resueltas':'Desafío final',complete:this.collected,total:this.total,bombs:this.bombs,shield:this.shield,offer:this.pendingOffer?{name:'Manto de pétalos',description:'Una burbuja bloquea el próximo golpe de este tramo. Puedes recogerla o dejarla aquí.'}:undefined,bossHp:boss?.hp,bossMax:boss?12:undefined});}
 clearInput(){this.left=this.right=undefined;this.mouse=false;if(this.keys)Object.values(this.keys).forEach(k=>k.reset());}
 setPaused(v:boolean){if(this.ended||this.wonAt)return;this.paused=v;this.clearInput();if(v)this.audio.suspend();else this.audio.resume();this.onPause(v);}
 positionPlayer(){const s=toScreen(this.p);this.player.setPosition(s.x,s.y).setDepth(s.y);this.shadow.setPosition(s.x,s.y+1).setDepth(s.y-1);}
 shoot(from:IsoPoint,du:number,dv:number,enemy=false){const xy=toScreen(from),s=this.add.text(xy.x,xy.y-9,enemy?'✦':'♥',{fontFamily:'Georgia',fontSize:enemy?'16px':'17px',color:enemy?'#a05c95':'#df6d91',stroke:'#fff5e4',strokeThickness:2}).setOrigin(.5);if(this.story&&!enemy){s.setColor('#e67fa4');s.setStroke('#fff2df',2);s.setShadow(0,2,'#85566d',1,false,true);}this.shots.push({p:{...from},du,dv,life:enemy?2500:1300,enemy,s});}
 burst(p:IsoPoint,color:number){const xy=toScreen(p);this.bursts.push({x:xy.x,y:xy.y,at:this.clock,color});if(this.bursts.length>28)this.bursts.shift();}
 floatNote(p:IsoPoint,label:string,color='#a46178'){const xy=toScreen(p),y=xy.y-55,s=this.add.text(xy.x,y,label,{fontFamily:'Georgia',fontSize:'14px',color,stroke:'#fff9ed',strokeThickness:3}).setOrigin(.5).setDepth(1100);this.notes.push({s,y,at:this.clock});if(this.notes.length>8)this.notes.shift()?.s.destroy();}
 damage(){if(this.clock<this.inv||this.ended||this.wonAt||this.dyingAt||this.pendingOffer)return;if(this.shield){this.shield=false;this.inv=this.clock+900;this.burst(this.p,0xffdf8a);this.floatNote(this.p,'¡Protegida!','#a67c3b');this.audio.tone(950,.22,.04);this.sync();return;}this.hp--;this.inv=this.clock+1300;this.burst(this.p,0xe485a3);this.floatNote(this.p,'− ♥');this.audio.tone(160,.15,.045,'triangle');if(!this.reducedMotion)this.cameras.main.shake(80,.002);this.sync();if(this.hp<=0){if(this.story){this.hp=6;this.inv=this.clock+900;this.story.health(this.hp);this.story.retry();this.setStoryStage('defend',true);}else{this.dyingAt=this.clock||1;this.clearInput();}}else this.story?.health(this.hp);}
 hitEnemy(e:Enemy,amount:number){if(!this.enemies.includes(e))return;e.hp-=amount;e.flash=this.clock+150;this.burst(e.p,e.kind==='cinna'?0x91c7d2:0xd68bad);this.audio.hit();if(e.hp<=0){this.floatNote(e.p,'✦');if(this.story&&!this.reducedMotion){this.burst(e.p,0xffd3a6);this.burst(e.p,0xffe8da);}e.s.destroy();e.shadow.destroy();this.enemies=this.enemies.filter(x=>x!==e);this.collected++;this.audio.tone(780,.16,.03);}this.sync();}
 bomb(){if(this.story?.locked()||this.storyPhoto||this.paused||this.pendingOffer||this.ended||this.wonAt||this.dyingAt||!this.bombs||this.level===1)return;this.bombs--;this.burst(this.p,0xffd584);for(const e of [...this.enemies])if(isoDistance(e.p,this.p)<2)this.hitEnemy(e,3);this.audio.tone(130,.25,.06,'triangle');if(!this.reducedMotion)this.cameras.main.shake(100,.003);this.sync();}
 chooseItem(accept:boolean){if(!this.pendingOffer||this.paused||!this.charm)return;this.pendingOffer=false;this.clearInput();if(accept){this.shield=true;this.burst(this.charm.p,0xffd584);this.floatNote(this.charm.p,'¡Manto listo!','#a67c3b');this.charm.s.destroy();this.charm=undefined;this.audio.tone(880,.22,.035);}else this.declinedCharm=true;this.sync();}
 update(_time:number,delta:number){
  if(this.storyPhoto||this.paused||this.pendingOffer||this.ended)return;const dt=Math.min(delta,40),seconds=dt/1000;this.clock+=dt;
  if(this.story){
   this.updateStoryPerformance(dt);
   // Continue light transitions during dialogue and scripted motion.
   if(!this.story.epilogue){
    const targetLight=darknessAt(this.p.u,this.storyStage,this.storyMap);
    this.storyDusk=storyLightStep(this.storyDusk,targetLight,dt,this.reducedMotion);
    if(Math.abs(this.storyDusk-this.storyDuskReported)>=.009||(this.storyDusk!==this.storyDuskReported&&this.storyDusk===targetLight)){
     this.storyDuskReported=this.storyDusk;this.story.dusk(this.storyDusk);
    }
   }
   // The scene clock, not an extra audio interval, controls narrative dynamics.
   // Dialogue ducks only music/ambience; real samples and clue effects stay audible.
   this.refreshStoryMix(this.storyStage,this.story.epilogue?this.storyDusk:this.storyDuskReported);
   const ecologyCue=this.storyWorld?.update(this.clock,this.storyDusk,this.p);
   if(ecologyCue&&!this.story.epilogue)this.audio.playRescueAmbience?.(ecologyCue.kind,ecologyCue.pan);
   if(ecologyCue&&this.story.epilogue)this.audio.playRescueAmbience?.(this.storyMap==='morning_garden'?'river':'birdsong',ecologyCue.pan);
   // Physical NPC and kidnapping motion keeps running during narrative locks.
   if(!this.story.epilogue){this.updateLuisCinematic(dt);
   this.animateStoryLuis();
   this.updateStoryCat(dt);
   this.updateStoryLouisArrival(dt);
   this.updateStoryAbduction(dt);}
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
  let moving=false;
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
   if(manual)this.storyRestUntil=0;
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
   moving=false;
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
     this.houseRoute=[]; // No story bridge in classic Corazones.
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
  const firing=!this.story?.epilogue&&Math.hypot(ax,ay)>.1&&this.level!==1;if(firing){this.facing=facingOf(ax,ay,this.facing);if(this.clock-this.last>300){this.last=this.clock;const aim=screenVector(ax,ay),length=Math.hypot(ax,ay);this.shotDir={x:ax/length,y:ay/length};this.shoot(this.p,aim.u*4,aim.v*4);this.audio.tone(700,.04,.015);}}
  const hurt=this.clock<this.inv&&this.clock>this.inv-300;
  const recoil=!this.reducedMotion&&this.last?Math.max(0,1-(this.clock-this.last)/100):0;
  if(this.story)this.renderStoryKitty(dt,firing,recoil,hurt);
  else {
   const frame=moving?1+Math.floor(this.moveClock/115)%4:this.clock%3600>3440?5:0,dir=this.facing==='left'?'right':this.facing;
   const hurtKey=`chibi-${this.character}-hurt`,texture=hurt&&this.textures.exists(hurtKey)?hurtKey:`chibi-${this.character}-${dir}-${hurt?5:frame}${firing&&!hurt?'-shoot':''}`;
   this.positionPlayer();if(!this.reducedMotion)this.player.y-=moving?Math.abs(Math.sin(this.moveClock/115*Math.PI))*2:Math.sin(this.clock/550)*.8;this.player.setTexture(texture).setFlipX(this.facing==='left').setScale(1.3*(1+recoil*.06),1.3*(1-recoil*.08)).setAlpha(this.clock<this.inv?(this.reducedMotion?.7:Math.floor(this.clock/90)%2?.45:1):1).setAngle(hurt&&!this.reducedMotion?Math.sin(this.clock/35)*10:moving&&!this.reducedMotion?Math.sin(this.moveClock/115*Math.PI)*3:0);
   if(this.clock<this.inv&&this.clock>this.inv-300)this.player.setTint(0xffa8bb);else this.player.clearTint();
  }
  for(const light of [...this.collectibles]){light.s.y=toScreen(light.p).y-12+(this.reducedMotion?0:Math.sin(this.clock/230)*3);if(isoDistance(light.p,this.p)<.48){this.burst(light.p,0xffd584);this.floatNote(light.p,'¡Una luz!','#a67c3b');light.s.destroy();this.collectibles=this.collectibles.filter(x=>x!==light);this.collected++;this.audio.tone(880,.18,.035);this.sync();}}
  if(this.charm){const d=isoDistance(this.charm.p,this.p);this.charm.s.y=toScreen(this.charm.p).y-12+(this.reducedMotion?0:Math.sin(this.clock/260)*3);if(d>.9)this.declinedCharm=false;if(d<.48&&!this.declinedCharm){this.pendingOffer=true;this.clearInput();this.audio.tone(660,.1,.025);this.sync();return;}}
  for(const e of [...this.enemies]){
   const du=this.p.u-e.p.u,dv=this.p.v-e.p.v,d=Math.hypot(du,dv)||1;
   if(d>1.2){
    const proposed={u:e.p.u+du/d*(e.boss?.45:.65)*seconds,v:e.p.v+dv/d*(e.boss?.45:.65)*seconds};
    e.p=this.story?constrainRescue(proposed,this.storyMap,e.p):constrain(proposed);
   }
   const xy=toScreen(e.p),bounce=this.reducedMotion?0:Math.abs(Math.sin(this.clock/250+e.phase))*2;e.s.setPosition(xy.x,xy.y-bounce).setDepth(xy.y).setTexture(`${e.kind}-${Math.floor(this.clock/160)%4}`).setFlipX(du-dv<0);e.shadow.setPosition(xy.x,xy.y).setDepth(xy.y-1);
   if(this.clock<e.flash)e.s.setTint(0xffc5d9);else if(this.clock>e.next-(this.story?RESCUE_COMBAT.warning:450))e.s.setTint(0xf2c1dd);else e.s.clearTint();
   if(d<.48)this.damage();if(this.dyingAt)return;
   if(this.clock>e.next){e.next=this.clock+(this.story?RESCUE_COMBAT.interval:e.boss?2100:2600);e.phase++;
    if(e.boss&&e.phase%2===0){for(const offset of [-.8,0,.8])this.dangers.push({p:constrain({u:this.p.u+offset,v:this.p.v}),at:this.clock+1150});}
    else{const count=e.boss?8:e.kind==='cinna'?3:1;for(let i=0;i<count;i++){const a=e.boss?i*Math.PI*2/count:Math.atan2(dv,du)+(i-(count-1)/2)*.24;this.shoot(e.p,Math.cos(a)*1.4,Math.sin(a)*1.4,true);}}
   }
  }
  for(const shot of [...this.shots]){shot.life-=dt;shot.p.u+=shot.du*seconds;shot.p.v+=shot.dv*seconds;const xy=toScreen(shot.p);shot.s.setPosition(xy.x,xy.y-9).setDepth(xy.y+1);
   if(this.story&&!shot.enemy&&!this.reducedMotion){const age=1300-shot.life;const pop=age<160?1+.16*Math.sin(Math.PI*age/160):1;shot.s.setScale(pop);}
   const maxU=this.story?RESCUE_SCENES[this.storyMap].maxU:ISO.size;
   const minU=this.story?RESCUE_SCENES[this.storyMap].minU:-.5;
   const maxV=this.story?16:ISO.size,minV=this.story?-6:-.5;
   let remove=shot.life<=0||shot.p.u<minU||shot.p.v<minV||shot.p.u>maxU||shot.p.v>maxV;
   if(shot.enemy&&isoDistance(shot.p,this.p)<.38){this.damage();remove=true;}
   if(!shot.enemy){const target=this.enemies.find(e=>isoDistance(e.p,shot.p)<(e.boss?.62:.43));if(target){this.hitEnemy(target,1);remove=true;}
    const practice=this.storyPractice;
    if(this.story&&practice&&!remove&&isoDistance(practice.point,shot.p)<.48){
     this.storyPracticeDone=true;this.storyPractice=undefined;practice.marker.clear();
     const p=toScreen(practice.point);practice.marker.fillStyle(0xffd5e4).fillCircle(p.x,p.y-9,6);
     this.burst(practice.point,0xf4a9c4);this.floatNote(practice.point,'¡Un corazón!');this.audio.tone(880,.14,.022,'triangle');remove=true;
    }
   }
   if(remove){shot.s.destroy();this.shots=this.shots.filter(x=>x!==shot);}if(this.dyingAt)return;
  }
  for(const zone of [...this.dangers])if(this.clock>=zone.at){if(isoDistance(zone.p,this.p)<.55)this.damage();this.burst(zone.p,0xc385b4);this.dangers=this.dangers.filter(z=>z!==zone);}if(this.dyingAt)return;
  const g=this.fx;g.clear();if(!this.reducedMotion&&!this.story){for(let i=0;i<12;i++){const t=this.clock*.012+i*53,x=100+(i*83)%600+Math.sin(t/30)*9,y=70+((i*41+t*.5)%290);g.fillStyle(i%2?0xfff2d5:0xf5c5d4,.3+Math.sin(t/18)*.12);g.fillRect(x,y,3,3);}for(let i=0;i<3;i++){const t=this.clock/1000+i*2.4,x=165+i*205+Math.sin(t*.38)*35,y=115+i*24+Math.cos(t*.8)*10,wing=Math.sin(t*9)>0?5:2;g.fillStyle(i===1?0xf4e4a8:0xeab3c5,.72);g.fillRect(x-wing-1,y-3,wing,5);g.fillRect(x+2,y-3,wing,5);g.fillStyle(0x8e7571,.65);g.fillRect(x,y-2,2,4);}}if(this.last&&this.clock-this.last<110){const p=toScreen(this.p);g.fillStyle(0xffdfb4,.9);g.fillCircle(p.x+this.shotDir.x*20,p.y-16+this.shotDir.y*14,3);}if(this.shield){const p=toScreen(this.p);g.lineStyle(2,0xffedb8,.85);g.strokeCircle(p.x,p.y-18,27);}for(const zone of this.dangers){const p=toScreen(zone.p),fraction=1-(zone.at-this.clock)/1150;g.fillStyle(0xc579a5,.15+fraction*.12);g.fillCircle(p.x,p.y,24);g.lineStyle(2,0xb66391,.8);g.strokeCircle(p.x,p.y,24);}
  if(this.story&&this.storyFootprints.length){
   this.storyFootprints=this.storyFootprints.filter(trace=>this.clock-trace.at<720);
   for(const trace of this.storyFootprints){
    const age=this.clock-trace.at,opacity=Math.max(0,1-age/720);
    const c=FEEL_FOOTSTEP[trace.kind].color;
    g.fillStyle(c,opacity*.38).fillEllipse(trace.x,trace.y,6,2.8);
    g.fillStyle(c,opacity*.22).fillEllipse(trace.x+trace.side*3,trace.y+2.1,3,2);
   }
  }
  if(this.story&&this.storyInteractUntil>this.clock){
   const progress=1-(this.storyInteractUntil-this.clock)/RESCUE_FEEL.interactMs;
   const target=toScreen(this.storyVanNear?VAN_NIGHT_POSITION:this.storyTarget);
   const alpha=this.reducedMotion?.2:Math.sin(progress*Math.PI)*.45;
   g.lineStyle(2,0xffd6b5,alpha).strokeEllipse(target.x,target.y,22+progress*18,10+progress*6);
  }
  if(this.story&&!this.reducedMotion){
   // Four tiny samples behind each friendly projectile. Pure rendering on
   // the existing FX buffer; positions, speed and collision remain unchanged.
   for(let index=0;index<Math.min(this.shots.length,32);index++){
    const shot=this.shots[index];if(shot.enemy)continue;
    const age=1300-shot.life;
    for(let j=1;j<=4;j++){
     if(age<j*32)continue;
     const p=toScreen({u:shot.p.u-shot.du*j*.032,v:shot.p.v-shot.dv*j*.032});
     g.fillStyle(j%2?0xffc5d6:0xffe7b9,.62-j*.12).fillCircle(p.x,p.y-9,3.4-j*.5);
    }
   }
  }
  this.bursts=this.bursts.filter(b=>this.clock-b.at<(this.story?460:380));
  for(const b of this.bursts){
   const duration=this.story?460:380,t=(this.clock-b.at)/duration;
   if(this.story&&!this.reducedMotion){
    const ease=1-Math.pow(1-t,2),r=5+ease*23;
    g.lineStyle(1.5,b.color,(1-t)*.84).strokeEllipse(b.x,b.y-5,r*2,r*1.35);
    for(let i=0;i<6;i++){
     const a=i*Math.PI/3+.24,x=b.x+Math.cos(a)*ease*27,y=b.y-7+Math.sin(a)*ease*18;
     const size=Math.max(1,3.5*(1-t));
     g.fillStyle(i%2?b.color:0xffe3bf,(1-t)*.9);
     g.fillRect(x-size,y-1,size*2,2).fillRect(x-1,y-size,2,size*2);
    }
    if(t<.24)g.fillStyle(0xfff2df,(1-t/.24)*.65).fillCircle(b.x,b.y-6,5*(1-t));
   }else{
    g.lineStyle(2,b.color,1-t);g.strokeCircle(b.x,b.y,this.reducedMotion?12:4+t*18);
    if(!this.reducedMotion){g.fillStyle(b.color,1-t);for(let i=0;i<4;i++){const a=i*Math.PI/2;g.fillRect(b.x+Math.cos(a)*t*18,b.y+Math.sin(a)*t*12,3,3);}}
   }
  }
  for(const e of this.enemies)if(this.clock>e.next-(this.story?RESCUE_COMBAT.warning:450)){const p=toScreen(e.p);const warn=this.story?rescueAttackWarning(this.clock,e.next):1;g.lineStyle(2,0xbd6994,.45+.35*warn);g.strokeCircle(p.x,p.y-12,e.boss?27:18);if(this.story){g.lineStyle(2,0xffdfb9,.6+.3*warn);g.strokeCircle(p.x,p.y-12,24-warn*6);}}for(const stick of [this.left,this.right])if(stick){const camera=this.cameras.main,p=camera.getWorldPoint(stick.x,stick.y),z=camera.zoom,n=Math.max(1,Math.hypot(stick.dx,stick.dy)/24);g.lineStyle(2/z,0x715a73,.28);g.strokeCircle(p.x,p.y,32/z);g.fillStyle(0x866779,.25);g.fillCircle(p.x+stick.dx/n/z,p.y+stick.dy/n/z,11/z);}
  if(this.story){
   this.updateStoryActors(dt);
   if(this.storyStage==='defend' && this.storyWalkTriggered && !this.storyVictoryEmitted && this.enemies.length===0){
    this.storyVictoryEmitted=true;this.story.victory();
   }
  }else if(this.collected>=this.total){this.wonAt=this.clock||1;this.clearInput();this.audio.tone(1046,.25,.035);}
 }
}
