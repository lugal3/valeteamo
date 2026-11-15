/// <reference types="vite/client" />
import {useCallback,useEffect,useRef,useState} from 'react';
import type Phaser from 'phaser';
import {installReferenceCharacter} from '../reference-characters';
import {buildArt} from '../art';
import {buildChibi} from '../chibi-art';
import {facingOf,type Facing} from '../animation';
import {Sound} from '../audio';
import {drawRescueIsoWorld} from './rescue-iso-world';
import {installProloguePeople} from './prologue-art';
import {
 PROLOGUE_START,PROLOGUE_DIALOGUES,PROLOGUE_OBJECTIVES,
 advancePrologue,hurtPrologue,healPrologue,loadPrologue,
 savePrologue,resetPrologue,
 type PrologueState,type PrologueEvent,type PrologueLine
} from './prologue-story.js';
import {isPhonePortrait} from '../LandscapeGate';
import './garden-prologue.css';

type Dialog={lines:PrologueLine[];index:number};
type Enemy={body:Phaser.GameObjects.Sprite;hp:number;speed:number;hitAt:number;seed:number};
type Shot={shape:Phaser.GameObjects.Text;vx:number;vy:number;ttl:number};
const WORLD_W=2840,W=960,H=540;
const min=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const posForStage=(stage:string)=>{
 if(['intro','defend','talk-louis'].includes(stage))return 142;
 if(stage==='talk-luis')return 920;
 if(stage==='walk-together')return 1340;
 if(['disappearance','ribbon'].includes(stage))return 1530;
 if(stage==='petals')return 1800;
 if(stage==='wheel')return 2090;
 if(stage==='door')return 2350;
 return 2520;
};
const boundaries:Record<string,number>={
 intro:940,defend:940,'talk-louis':990,'talk-luis':1410,'walk-together':1730,
 disappearance:1730,ribbon:1840,petals:2130,wheel:2390,door:2610,window:2795,house:2795
};
const CLUES=[
 {x:1578,y:350,stage:'ribbon',label:'Pulsera de Louis',symbol:'✦'},
 {x:1910,y:346,stage:'petals',label:'Pétalos brillantes',symbol:'✿'},
 {x:2224,y:347,stage:'wheel',label:'Huellas de ruedas',symbol:'⌁'}
] as const;
export type PrologueCheckpoint='intro'|'walk-together'|'ribbon';
const checkpointState=(test:boolean,checkpoint:PrologueCheckpoint):PrologueState=>
 test?{...PROLOGUE_START,stage:checkpoint}:loadPrologue();
function getObjective(stage:PrologueState['stage']){return PROLOGUE_OBJECTIVES[stage];}
function storyLine(lines:PrologueLine[],i:number){return lines[Math.min(i,lines.length-1)];}

export function GardenPrologue({test=false,checkpoint='intro',onExit,onEnterHouse}:{test?:boolean;checkpoint?:PrologueCheckpoint;onExit:()=>void;onEnterHouse:()=>void}){
 const [run,setRun]=useState<PrologueState>(()=>checkpointState(test,checkpoint));
 const [dialog,setDialog]=useState<Dialog|null>(null);
 const [letters,setLetters]=useState(0);
 const [near,setNear]=useState('');
 const [enemyCount,setEnemyCount]=useState(3);
 const [muted,setMuted]=useState(false);
 const [error,setError]=useState('');
 const [portraits,setPortraits]=useState<Record<string,string>>({});
 const [restartKey,setRestartKey]=useState(0);
 const stageRef=useRef<HTMLDivElement>(null),sceneRef=useRef<Phaser.Scene|null>(null);
 const phaseRef=useRef(run),dialogRef=useRef<Dialog|null>(null),lockedRef=useRef(false);
 const dialogDone=useRef<null|(()=>void)>(null),nextDialogRef=useRef<()=>void>(()=>{});
 const fireRef=useRef<()=>void>(()=>{}),actRef=useRef<()=>void>(()=>{});
 const stickRef=useRef({x:0,y:0}),stickId=useRef<number|null>(null);
 const heldFire=useRef(false),transitioning=useRef(false);
 const audio=useRef(new Sound());
 useEffect(()=>()=>audio.current.destroy(),[]);
 useEffect(()=>{
  audio.current.setTheme(run.stage==='defend'?'battle':
   ['disappearance','ribbon','petals','wheel','door','window','house'].includes(run.stage)?'final':'garden');
 },[run.stage]);
 const changed=useCallback((event:PrologueEvent)=>{
  const next=advancePrologue(phaseRef.current,event);
  if(next.stage===phaseRef.current.stage)return next;
  phaseRef.current=next;setRun(next);
  if(!test)savePrologue(next);
  return next;
 },[test]);
 const hurt=useCallback(()=>{
  const next=hurtPrologue(phaseRef.current);
  phaseRef.current=next;setRun(next);
  // HP is temporary battle state, not a persistent checkpoint.
  return next.hp;
 },[]);
 const heal=useCallback(()=>{
  const next=healPrologue(phaseRef.current,3);
  phaseRef.current=next;setRun(next);
 },[]);
 const showDialog=useCallback((lines:PrologueLine[],done?:()=>void)=>{
  if(!lines.length){done?.();return;}
  lockedRef.current=true;heldFire.current=false;
  dialogDone.current=done??null;const start={lines,index:0};
  dialogRef.current=start;setLetters(0);setDialog(start);
 },[]);
 const nextDialog=useCallback(()=>{
  const active=dialogRef.current;if(!active)return;
  const line=storyLine(active.lines,active.index);
  if(letters<Array.from(line.text).length){setLetters(Array.from(line.text).length);return;}
  if(active.index+1<active.lines.length){
   const next={...active,index:active.index+1};
   dialogRef.current=next;setDialog(next);setLetters(0);return;
  }
  dialogRef.current=null;setDialog(null);setLetters(0);lockedRef.current=false;
  const done=dialogDone.current;dialogDone.current=null;done?.();
 },[letters]);
 nextDialogRef.current=nextDialog;
 useEffect(()=>{
  if(!dialog)return;
  const text=storyLine(dialog.lines,dialog.index).text;
  if(letters>=Array.from(text).length)return;
  const handle=window.setInterval(()=>setLetters(n=>Math.min(n+2,Array.from(text).length)),27);
  return()=>window.clearInterval(handle);
 },[dialog,letters]);
 useEffect(()=>{
  const handle=(e:KeyboardEvent)=>{
   if(!e.repeat)void audio.current.start();
   if(!dialogRef.current)return;
   if(['Enter',' ','e','E'].includes(e.key)){
    e.preventDefault();e.stopImmediatePropagation();nextDialogRef.current();
   }
  };
  window.addEventListener('keydown',handle,true);
  return()=>window.removeEventListener('keydown',handle,true);
 },[]);

 const updateStick=(el:HTMLElement,x:number,y:number)=>{
  const r=el.getBoundingClientRect(),dx=x-r.left-r.width/2,dy=y-r.top-r.height/2;
  const mag=Math.hypot(dx,dy),scale=Math.min(1,mag/(r.width*.35)),dz=.12;
  const amount=scale<dz?0:(scale-dz)/(1-dz),n=mag||1;
  stickRef.current={x:dx/n*amount,y:dy/n*amount};
  const thumb=el.querySelector<HTMLElement>('.prologue-stick-thumb');
  if(thumb)thumb.style.transform='translate('+dx/n*scale*22+'px,'+dy/n*scale*22+'px)';
 };
 const releaseStick=(el:HTMLElement)=>{
  stickId.current=null;stickRef.current={x:0,y:0};
  const thumb=el.querySelector<HTMLElement>('.prologue-stick-thumb');
  if(thumb)thumb.style.transform='translate(0,0)';
 };
 // If the visitor already reached the window on a previous session,
 // resume inside the existing 3D house instead of getting stuck in an empty
 // finished 2D world. The story window callback sets transitioning first,
 // so this hook never launches the house twice.
 useEffect(()=>{
  if(run.stage==='house'&&!test&&!transitioning.current){
   transitioning.current=true;onEnterHouse();
  }
 },[run.stage,test,onEnterHouse]);
 const restart=()=>{
  if(!test)resetPrologue();
  phaseRef.current=checkpointState(test,checkpoint);setRun({...phaseRef.current});
  lockedRef.current=false;dialogRef.current=null;dialogDone.current=null;transitioning.current=false;
  setDialog(null);setLetters(0);setNear('');setEnemyCount(3);setRestartKey(v=>v+1);
 };

 useEffect(()=>{
  if(!stageRef.current)return;
  let cancelled=false,game:Phaser.Game|undefined;
  const launch=async()=>{
   try{
    const {default:Engine}=await import('phaser');
    if(cancelled||!stageRef.current)return;
    class StoryGarden extends Engine.Scene{
     kitty!:Phaser.GameObjects.Sprite;
     louis!:Phaser.GameObjects.Image;
     luis!:Phaser.GameObjects.Image;
     shadow!:Phaser.GameObjects.Container;
     veil!:Phaser.GameObjects.Rectangle;
     enemies:Enemy[]=[];shots:Shot[]=[];
     keys!:Record<string,Phaser.Input.Keyboard.Key>;
     velocity={x:0,y:0};lastShot=0;lastHurt=0;fightOver=false;
     facing:Facing='down';shootingUntil=0;
     actionPressed=false;introRan=false;abductionRan=false;lastPrompt='';
     worldMoon!:Phaser.GameObjects.Arc;
     clueMarkers:Phaser.GameObjects.Container[]=[];
     constructor(){super('vale-story-prologue');}
     preload(){
      this.load.image('kitty-reference-source',new URL('./sprites/kitty-reference-sheet.png',document.baseURI).href);
      this.load.image('kitty-walk-source',new URL('./sprites/kitty-walk-sheet.png',document.baseURI).href);
      this.load.image('louis-reference-source',new URL('./sprites/louis-reference-sheet.png',document.baseURI).href);
      this.load.image('louis-walk-source',new URL('./sprites/louis-walk-sheet.png',document.baseURI).href);
     }
     create(){
      sceneRef.current=this;
      this.cameras.main.setBackgroundColor('#f1e5d2');
      this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,F') as Record<string,Phaser.Input.Keyboard.Key>;
      this.cameras.main.setBounds(0,0,WORLD_W,H);
      buildArt(this);buildChibi(this);
      this.worldMoon=drawRescueIsoWorld(this,WORLD_W);
      installReferenceCharacter(this,'kitty');
      installReferenceCharacter(this,'louis');
      const faces=installProloguePeople(this);
      const kittyFrame=this.textures.get('chibi-kitty-down-0').getSourceImage() as HTMLCanvasElement;
      const kittyAvatar=document.createElement('canvas');
      kittyAvatar.width=48;kittyAvatar.height=60;
      const kittyContext=kittyAvatar.getContext('2d')!;
      kittyContext.imageSmoothingEnabled=false;
      kittyContext.drawImage(kittyFrame,0,0,48,60);
      const louisFrame=this.textures.get('chibi-louis-down-0').getSourceImage() as HTMLCanvasElement;
      const louisAvatar=document.createElement('canvas');louisAvatar.width=48;louisAvatar.height=60;
      const louisContext=louisAvatar.getContext('2d')!;louisContext.imageSmoothingEnabled=false;
      louisContext.drawImage(louisFrame,0,0,48,60);
      setPortraits({...faces,kitty:kittyAvatar.toDataURL('image/png'),louis:louisAvatar.toDataURL('image/png')});
      this.kitty=this.add.sprite(posForStage(phaseRef.current.stage),337,'chibi-kitty-down-0').setOrigin(.5,.9).setScale(1.3).setDepth(337);
      this.louis=this.add.image(722,326,'chibi-louis-down-0').setOrigin(.5,.9).setScale(1.3).setDepth(326);
      this.luis=this.add.image(1220,326,'story-person-luis').setOrigin(.5,1).setScale(.87).setDepth(326);
      if(phaseRef.current.stage==='walk-together')this.louis.setPosition(this.kitty.x+52,this.kitty.y);
      this.add.text(722,247,'LOUIS',{fontFamily:'monospace',fontStyle:'bold',fontSize:'12px',color:'#71375c',stroke:'#ffeff5',strokeThickness:3}).setOrigin(.5).setDepth(326);
      this.add.text(1220,247,'LUIS ♡',{fontFamily:'monospace',fontStyle:'bold',fontSize:'12px',color:'#71375c',stroke:'#ffeff5',strokeThickness:3}).setOrigin(.5).setDepth(326);
      this.tweens.add({targets:[this.louis,this.luis],y:'-=3',duration:930,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
      this.cameras.main.startFollow(this.kitty,true,.12,.12,0,0);
      const fitCamera=(width:number,height:number)=>{
       if(width<=0||height<=0)return;
       const zoom=Math.min(width/800,height/450)*1.08;
       this.cameras.main.setZoom(zoom);
       if(this.veil)this.veil.setSize(Math.ceil(width/zoom)+2,Math.ceil(height/zoom)+2);
      };
      fitCamera(this.scale.width,this.scale.height);
      this.scale.on('resize',(size:{width:number;height:number})=>fitCamera(size.width,size.height));
      this.shadow=this.add.container(1620,315,[
       this.add.ellipse(0,0,92,128,0x271f48,.82),
       this.add.circle(-12,-24,3,0xff6ca8,1),this.add.circle(12,-24,3,0xff6ca8,1),
       this.add.ellipse(0,49,103,16,0x15142d,.23)
      ]).setDepth(337).setAlpha(0).setVisible(false);
      for(const item of CLUES){
       const sprite=this.add.container(item.x,item.y,[
        this.add.circle(0,0,31,0xffe4ab,.30),
        this.add.text(0,-2,item.symbol,{fontFamily:'Georgia',fontSize:'37px',color:'#fff0c0',stroke:'#c177ab',strokeThickness:4}).setOrigin(.5)
       ]).setVisible(false).setDepth(item.y+2);
       this.tweens.add({targets:sprite,y:item.y-9,duration:820,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
       this.clueMarkers.push(sprite);
      }
      // fixed-screen blue-violet dusk + deepening darkness, always a single scene
      this.veil=this.add.rectangle(0,0,W,H,0x1a2248,1).setOrigin(0).setScrollFactor(0).setDepth(8000).setAlpha(0);
      this.veil.setSize(Math.ceil(this.scale.width/this.cameras.main.zoom)+2,Math.ceil(this.scale.height/this.cameras.main.zoom)+2);
      // Normal alpha compositing gives a perceptible blue-violet night in Canvas
      // and WebGL. Multiply was too subtle on some mobile renderers.
      this.veil.setBlendMode(Engine.BlendModes.NORMAL);
      this.worldMoon.setDepth(8001);
      if(phaseRef.current.stage==='intro')showDialog(PROLOGUE_DIALOGUES.intro,()=>{changed('begin');this.spawnEnemies();});
      if(phaseRef.current.stage==='defend')this.spawnEnemies();
      if(['ribbon','petals','wheel','door','window'].includes(phaseRef.current.stage))this.louis.setVisible(false);
      this.syncWorld(phaseRef.current.stage);
      if(import.meta.env.DEV){
       (window as Window & {__valePrologue?:unknown}).__valePrologue={
        stage:()=>phaseRef.current.stage,position:()=>this.kitty.x,
        teleport:(x:number,y=340)=>{this.kitty.setPosition(min(x,30,WORLD_W-30),y);this.cameras.main.centerOn(x,y);},
        defeatShadows:()=>{for(const e of this.enemies){e.hp=0;e.body.destroy();}},
        interact:()=>actRef.current(),advanceDialog:()=>nextDialogRef.current(),
        health:()=>phaseRef.current.hp,
        dusk:()=>({alpha:this.veil.alpha,fillAlpha:this.veil.fillAlpha})
       };
      }
     }
     spawnEnemies(){
      if(this.enemies.length)return;
      // Enemigos, escala y frames reutilizados del arcade 2D Corazones.
      for(const [i,x,y] of [[0,535,292],[1,650,376],[2,800,324]] as const){
       const body=this.add.sprite(x,y,'kuromi-0')
        .setOrigin(.5,.85).setScale(1.7).setTint(0xb3a0cc).setDepth(y);
       this.enemies.push({body,hp:i===2?4:3,speed:38+i*8,hitAt:0,seed:i*1.4});
      }
      setEnemyCount(this.enemies.length);
     }
     syncWorld(stage:string){
      const twilight=['disappearance','ribbon','petals','wheel','door','window','house'].includes(stage);
      this.tweens.add({targets:this.veil,alpha:twilight?.60:0,duration:1800});
      this.tweens.add({targets:this.worldMoon,alpha:twilight?1:0,duration:2500});
      CLUES.forEach((item,i)=>this.clueMarkers[i].setVisible(item.stage===stage));
      if(twilight)this.louis.setVisible(false);
     }
     shoot(){
      const now=this.time.now;
      if(lockedRef.current||phaseRef.current.stage!=='defend'||now-this.lastShot<330)return;
      this.lastShot=now;this.shootingUntil=now+210;
      audio.current.tone(760,.09,.03,'triangle');
      const targets=this.enemies.filter(v=>v.hp>0);
      if(!targets.length)return;
      targets.sort((a,b)=>Engine.Math.Distance.Between(this.kitty.x,this.kitty.y,a.body.x,a.body.y)-
        Engine.Math.Distance.Between(this.kitty.x,this.kitty.y,b.body.x,b.body.y));
      const target=targets[0];
      const a=Math.atan2(target.body.y-this.kitty.y,target.body.x-this.kitty.x),speed=440;
      const shape=this.add.text(this.kitty.x,this.kitty.y-17,'♥',{fontFamily:'Georgia',fontSize:'17px',color:'#df6d91',stroke:'#fff5e4',strokeThickness:2}).setOrigin(.5).setDepth(900);
      this.shots.push({shape,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,ttl:1.5});
     }
     beginAbduction(){
      if(this.abductionRan||lockedRef.current)return;
      this.abductionRan=true;
      audio.current.tone(165,.45,.047,'sawtooth');
      changed('clearing');this.syncWorld('disappearance');
      showDialog(PROLOGUE_DIALOGUES.warning,()=>{
       this.shadow.setVisible(true).setAlpha(0).setScale(.1).setPosition(this.louis.x+110,this.louis.y+2);
       this.cameras.main.shake(700,.0025);
       this.tweens.add({targets:this.shadow,x:this.louis.x,y:this.louis.y,alpha:1,scale:1.12,duration:840,ease:'Quad.easeIn',
        onComplete:()=>{
         this.cameras.main.flash(260,254,197,226);
         this.tweens.add({targets:[this.louis,this.shadow],alpha:0,scale:.12,duration:740,ease:'Cubic.easeIn',
          onComplete:()=>{
           this.louis.setVisible(false);this.shadow.setVisible(false);
           showDialog(PROLOGUE_DIALOGUES.abducted,()=>{
            changed('abducted');this.syncWorld('ribbon');
           });
          }});
        }});
      });
     }
     interact(){
      if(lockedRef.current||transitioning.current)return;
      const stage=phaseRef.current.stage;
      const distance=(x:number,y:number)=>Engine.Math.Distance.Between(this.kitty.x,this.kitty.y,x,y);
      if(stage==='talk-louis'&&distance(this.louis.x,this.louis.y)<132){
       showDialog(PROLOGUE_DIALOGUES.victory,()=>{changed('louis');this.syncWorld('talk-luis');});return;
      }
      if(stage==='talk-luis'&&distance(this.luis.x,this.luis.y)<135){
       showDialog(PROLOGUE_DIALOGUES.luis,()=>{changed('luis');this.syncWorld('walk-together');});return;
      }
      const index=CLUES.findIndex(item=>item.stage===stage&&distance(item.x,item.y)<110);
      if(index>=0){
       const clue=CLUES[index];
       audio.current.ui();
       showDialog(PROLOGUE_DIALOGUES[clue.stage],()=>{
        changed(clue.stage==='ribbon'?'ribbon':clue.stage==='petals'?'petals':'wheel');
        this.syncWorld(phaseRef.current.stage);
       });return;
      }
      if(stage==='door'&&distance(2490,348)<155){
       showDialog(PROLOGUE_DIALOGUES.locked,()=>{changed('locked');this.syncWorld('window');});return;
      }
      if(stage==='window'&&distance(2680,320)<185){
       transitioning.current=true;
       showDialog(PROLOGUE_DIALOGUES.window,()=>{
        changed('enter');onEnterHouse();
       });
      }
     }
     update(_now:number,delta:number){
      if(!this.kitty||document.hidden||isPhonePortrait())return;
      const dt=Math.min(.045,delta/1000),stage=phaseRef.current.stage,keys=this.keys;
      if(!lockedRef.current&&stage==='walk-together'&&this.kitty.x>1500)this.beginAbduction();
      if(lockedRef.current){
       this.velocity.x*=.65;this.velocity.y*=.65;
       return;
      }
      // En Corazones: WASD mueve, flechas disparan en combate.
      // Fuera del combate las flechas también pueden mover a Kitty.
      const movementArrows=stage!=='defend';
      const left=Number(keys.A.isDown||(movementArrows&&keys.LEFT.isDown));
      const right=Number(keys.D.isDown||(movementArrows&&keys.RIGHT.isDown));
      const up=Number(keys.W.isDown||(movementArrows&&keys.UP.isDown));
      const down=Number(keys.S.isDown||(movementArrows&&keys.DOWN.isDown));
      let vx=right-left+stickRef.current.x,vy=down-up+stickRef.current.y;
      const length=Math.hypot(vx,vy);
      if(length>1){vx/=length;vy/=length;}
      const inertia=1-Math.exp(-12*dt);
      this.velocity.x+=(vx-this.velocity.x)*inertia;
      this.velocity.y+=(vy-this.velocity.y)*inertia;
      this.kitty.x=min(this.kitty.x+this.velocity.x*220*dt,42,boundaries[stage]??2780);
      this.kitty.y=min(this.kitty.y+this.velocity.y*195*dt,250,419);
      const moving=Math.hypot(this.velocity.x,this.velocity.y)>.12;
      this.facing=facingOf(this.velocity.x,this.velocity.y,this.facing);
      const frame=moving?1+Math.floor(this.time.now/115)%4:this.time.now%3600>3440?5:0;
      const shoot=this.time.now<this.shootingUntil;
      const texture='chibi-kitty-'+(this.facing==='left'?'right':this.facing)+'-'+frame+(shoot?'-shoot':'');
      if(this.textures.exists(texture))this.kitty.setTexture(texture);
      this.kitty.setFlipX(this.facing==='left').setDepth(this.kitty.y);
      this.louis.setDepth(this.louis.y);this.luis.setDepth(this.luis.y);
      if(stage==='walk-together'){
       const goalX=Math.max(723,Math.min(this.kitty.x+53,1585));
       this.louis.x+=(goalX-this.louis.x)*Math.min(1,dt*3.7);
       this.louis.y+=(this.kitty.y-this.louis.y)*Math.min(1,dt*3.5);
       const louisWalk='chibi-louis-down-'+(1+Math.floor(this.time.now/115)%4);
       if(this.textures.exists(louisWalk))this.louis.setTexture(louisWalk);
      }
      if(stage!=='walk-together'&&this.louis.texture.key!=='chibi-louis-down-0')this.louis.setTexture('chibi-louis-down-0');
      if(stage==='defend'){
       if(keys.SPACE.isDown||keys.F.isDown||keys.UP.isDown||keys.DOWN.isDown||
         keys.LEFT.isDown||keys.RIGHT.isDown||heldFire.current)this.shoot();
       for(const e of this.enemies){
        if(e.hp<=0)continue;
        const enemyFrame='kuromi-'+Math.floor((this.time.now+e.seed*100)/180)%4;
        if(this.textures.exists(enemyFrame))e.body.setTexture(enemyFrame);
        e.body.setDepth(e.body.y);
        const d=Math.hypot(this.kitty.x-e.body.x,this.kitty.y-e.body.y);
        if(d>51){
         e.body.x+=(this.kitty.x-e.body.x)/d*e.speed*dt;
         e.body.y+=(this.kitty.y-e.body.y)/d*e.speed*dt;
        }else if(this.time.now-this.lastHurt>1350){
         this.lastHurt=this.time.now;
         this.cameras.main.shake(95,.002);
         this.kitty.setTint(0xffa3ba);
         this.time.delayedCall(180,()=>this.kitty?.clearTint());
         audio.current.tone(170,.13,.04,'triangle');
         if(hurt()<=0){
          // Defeat is forgiving: restart ONLY the current tutorial encounter,
          // never erase the NPC introductions, rest of the save or classic game.
          heal();
          this.kitty.setPosition(142,337);
          for(const shadow of this.enemies)shadow.body.destroy();
          this.enemies=[];this.spawnEnemies();this.shots.forEach(v=>v.shape.destroy());this.shots=[];
          showDialog([{speaker:'Kitty',text:'¡Uff! Me quedé sin corazones. Voy a intentarlo otra vez; Louis todavía me necesita.'}]);
          return;
         }
        }
       }
       for(const shot of [...this.shots]){
        shot.shape.x+=shot.vx*dt;shot.shape.y+=shot.vy*dt;shot.ttl-=dt;
        for(const enemy of this.enemies){
         if(enemy.hp<=0)continue;
         if(Math.hypot(shot.shape.x-enemy.body.x,shot.shape.y-enemy.body.y)<31){
          enemy.hp--;audio.current.hit();
          this.tweens.add({targets:enemy.body,alpha:.45,duration:85,yoyo:true});
          if(enemy.hp<=0){
           audio.current.tone(880,.2,.035);
           this.tweens.add({targets:enemy.body,alpha:0,scale:.12,duration:290,onComplete:()=>enemy.body.destroy()});
          }
          shot.ttl=0;break;
         }
        }
        if(shot.ttl<=0||shot.shape.x<0||shot.shape.x>WORLD_W){shot.shape.destroy();this.shots.splice(this.shots.indexOf(shot),1);}
       }
       const living=this.enemies.filter(v=>v.hp>0).length;
       setEnemyCount(n=>n===living?n:living);
       if(living===0&&!this.fightOver){
        this.fightOver=true;
        this.shots.forEach(shot=>shot.shape.destroy());this.shots=[];
        this.time.delayedCall(360,()=>{changed('victory');this.syncWorld('talk-louis');});
       }
      }
      let prompt='';
      const distance=(x:number,y:number)=>Engine.Math.Distance.Between(this.kitty.x,this.kitty.y,x,y);
      if(stage==='talk-louis'&&distance(this.louis.x,this.louis.y)<132)prompt='Hablar con Louis';
      if(stage==='talk-luis'&&distance(this.luis.x,this.luis.y)<135)prompt='Hablar con Luis';
      for(const clue of CLUES)if(stage===clue.stage&&distance(clue.x,clue.y)<112)prompt='Examinar '+clue.label;
      if(stage==='door'&&distance(2490,348)<155)prompt='Probar puerta';
      if(stage==='window'&&distance(2680,320)<185)prompt='Entrar por la ventana';
      if(prompt!==this.lastPrompt){this.lastPrompt=prompt;setNear(prompt);}
      actRef.current=()=>this.interact();
      if(keys.E.isDown&&!this.actionPressed)this.interact();
      this.actionPressed=keys.E.isDown;
     }
    }
    game=new Engine.Game({
     type:Engine.AUTO,parent:stageRef.current!,width:Math.max(1,stageRef.current!.clientWidth),
     height:Math.max(1,stageRef.current!.clientHeight),transparent:false,
     pixelArt:true,render:{antialias:false,roundPixels:true},audio:{noAudio:true},
     scale:{mode:Engine.Scale.RESIZE,autoCenter:Engine.Scale.NO_CENTER,expandParent:false},
     input:{activePointers:4},scene:StoryGarden
    });
   }catch(e){if(!cancelled)setError(String(e));}
  };
  void launch();
  return()=>{
   cancelled=true;heldFire.current=false;sceneRef.current=null;
   if(import.meta.env.DEV)delete (window as Window & {__valePrologue?:unknown}).__valePrologue;
   game?.destroy(true);actRef.current=()=>{};fireRef.current=()=>{};
  };
 // The Phaser scene is intentionally long-lived. React updates DO NOT
 // remount it; only an explicit user-selected restart changes restartKey.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[restartKey]);

 // Expose only the shoot method from the live Phaser scene to touch UI.
 fireRef.current=()=>{
  const scene=sceneRef.current;
  if(scene&&'shoot' in scene)(scene as Phaser.Scene&{shoot:()=>void}).shoot();
 };
 const currentLine=dialog?storyLine(dialog.lines,dialog.index):null;
 const portrait=currentLine?.speaker==='Kitty'?portraits.kitty:
  currentLine?.speaker==='Luis'?portraits.luis:portraits.louis;
 return <main className="story-prologue" aria-label="Actos uno y dos: el jardín y la desaparición" data-prologue-stage={run.stage}
  onPointerDownCapture={()=>{void audio.current.start();}}>
  <div className="prologue-stage" ref={stageRef} aria-label="Jardín 2D interactivo"/>
  <div className="prologue-topbar">
   <div className="prologue-title">
    <span>{['intro','defend','talk-louis','talk-luis','walk-together'].includes(run.stage)?'ACTO I · EL JARDÍN':'ACTO II · LA DESAPARICIÓN'}</span>
    <strong>{getObjective(run.stage)}</strong>
   </div>
   <div className="prologue-top-right">
    <div className="prologue-health" aria-label={'Vida: '+run.hp+' de 6'}>
     {Array.from({length:6},(_,i)=><span key={i} aria-hidden="true" className={i<run.hp?'full':''}>♥</span>)}
    </div>
    {['ribbon','petals','wheel','door','window'].includes(run.stage)&&<span className="prologue-clue-count">{run.clues}/3 pistas</span>}
    <button type="button" className="prologue-audio" aria-label={muted?'Activar sonido':'Silenciar sonido'}
      onClick={()=>{const next=!muted;audio.current.muted=next;setMuted(next);if(!next)void audio.current.start();}}>
      {muted?'♪̸':'♪'}
     </button>
     <button type="button" onClick={onExit} className="prologue-exit" aria-label="Salir del prólogo">⚙ Salir</button>
   </div>
  </div>
  {run.stage==='defend'&&<div className="prologue-fight-score" role="status">Sombras restantes: {enemyCount} · Dispara corazones ♡</div>}
  {!dialog&&<div className="prologue-stick" aria-label="Joystick analógico para moverte"
   onPointerDown={e=>{stickId.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);updateStick(e.currentTarget,e.clientX,e.clientY);}}
   onPointerMove={e=>{if(stickId.current===e.pointerId)updateStick(e.currentTarget,e.clientX,e.clientY);}}
   onPointerUp={e=>{if(stickId.current===e.pointerId)releaseStick(e.currentTarget);}}
   onPointerCancel={e=>{if(stickId.current===e.pointerId)releaseStick(e.currentTarget);}}>
   <span className="prologue-stick-thumb">♡</span><small>CAMINAR</small>
  </div>}
  {!dialog&&run.stage==='defend'&&<button type="button" className="prologue-shoot"
   aria-label="Disparar corazones"
   onPointerDown={e=>{e.preventDefault();heldFire.current=true;fireRef.current();}}
   onPointerUp={()=>{heldFire.current=false;}}
   onPointerCancel={()=>{heldFire.current=false;}}
   onPointerLeave={()=>{heldFire.current=false;}}>♥ <small>DISPARAR</small></button>}
  {!dialog&&near&&<button type="button" className="prologue-interact" onClick={()=>actRef.current()}>{near} · E</button>}
  {currentLine&&dialog&&<div className="prologue-dialog-backdrop" role="dialog" aria-modal="true" aria-label="Conversación">
   <div className="prologue-dialog">
    <div className="prologue-portrait" aria-hidden="true">
     {portrait?<img src={portrait} alt=""/>:<span className="prologue-kitty-portrait">♡<small>Kitty</small></span>}
    </div>
    <div className="prologue-dialog-copy">
     <div className="prologue-speaker">{currentLine.speaker==='Luis'?'Luis · novio de Kitty':currentLine.speaker==='Louis'?'Louis · invitado': 'Kitty'}</div>
     <p aria-live="polite">{Array.from(currentLine.text).slice(0,letters).join('')}</p>
     <div className="prologue-dialog-counter">{dialog.index+1} / {dialog.lines.length}</div>
    </div>
    <button type="button" className="prologue-next" onClick={nextDialog} aria-label="Continuar diálogo">
     {letters<Array.from(currentLine.text).length?'Mostrar todo':'Continuar'} <span>▸</span>
    </button>
   </div>
  </div>}
  {!dialog&&<p className="prologue-help">Mover: joystick / WASD · Atacar: ♥ / flechas / Espacio · E: hablar</p>}
  {error&&<div className="prologue-error" role="alert">No se pudo abrir el prólogo: {error}
   <button onClick={restart}>Reintentar</button><button onClick={onExit}>Salir</button></div>}
  {test&&<button className="prologue-restart" onClick={restart}>↻ Reiniciar prólogo</button>}
 </main>;
}
