/// <reference types="vite/client" />
import {useCallback,useEffect,useRef,useState} from 'react';
import type Phaser from 'phaser';
import {installReferenceCharacter} from '../reference-characters';
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
type Enemy={body:Phaser.GameObjects.Container;hp:number;speed:number;hitAt:number;seed:number};
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
function getObjective(stage:PrologueState['stage']){return PROLOGUE_OBJECTIVES[stage];}
function storyLine(lines:PrologueLine[],i:number){return lines[Math.min(i,lines.length-1)];}

export function GardenPrologue({test=false,onExit,onEnterHouse}:{test?:boolean;onExit:()=>void;onEnterHouse:()=>void}){
 const [run,setRun]=useState<PrologueState>(()=>test?{...PROLOGUE_START}:loadPrologue());
 const [dialog,setDialog]=useState<Dialog|null>(null);
 const [letters,setLetters]=useState(0);
 const [near,setNear]=useState('');
 const [enemyCount,setEnemyCount]=useState(3);
 const [error,setError]=useState('');
 const [portraits,setPortraits]=useState<Record<string,string>>({});
 const [restartKey,setRestartKey]=useState(0);
 const stageRef=useRef<HTMLDivElement>(null),sceneRef=useRef<Phaser.Scene|null>(null);
 const phaseRef=useRef(run),dialogRef=useRef<Dialog|null>(null),lockedRef=useRef(false);
 const dialogDone=useRef<null|(()=>void)>(null),nextDialogRef=useRef<()=>void>(()=>{});
 const fireRef=useRef<()=>void>(()=>{}),actRef=useRef<()=>void>(()=>{});
 const stickRef=useRef({x:0,y:0}),stickId=useRef<number|null>(null);
 const heldFire=useRef(false),transitioning=useRef(false);
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
 const restart=()=>{
  if(!test)resetPrologue();
  phaseRef.current={...PROLOGUE_START};setRun({...PROLOGUE_START});
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
     kitty!:Phaser.GameObjects.Image;
     louis!:Phaser.GameObjects.Image;
     luis!:Phaser.GameObjects.Image;
     shadow!:Phaser.GameObjects.Container;
     veil!:Phaser.GameObjects.Rectangle;
     enemies:Enemy[]=[];shots:Shot[]=[];
     keys!:Record<string,Phaser.Input.Keyboard.Key>;
     velocity={x:0,y:0};lastShot=0;lastHurt=0;fightOver=false;
     actionPressed=false;introRan=false;abductionRan=false;lastPrompt='';
     worldMoon!:Phaser.GameObjects.Arc;
     clueMarkers:Phaser.GameObjects.Container[]=[];
     constructor(){super('vale-story-prologue');}
     preload(){
      this.load.image('kitty-reference-source',new URL('./sprites/kitty-reference-sheet.png',document.baseURI).href);
     }
     create(){
      sceneRef.current=this;
      this.cameras.main.setBackgroundColor('#f5cbdc');
      this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,F') as Record<string,Phaser.Input.Keyboard.Key>;
      this.cameras.main.setBounds(0,0,WORLD_W,H);
      this.drawWorld();
      installReferenceCharacter(this,'kitty');
      const faces=installProloguePeople(this);setPortraits(faces);
      this.kitty=this.add.image(posForStage(phaseRef.current.stage),337,'chibi-kitty-down-0').setScale(2.5).setDepth(18);
      this.louis=this.add.image(722,326,'story-person-louis').setScale(1.83).setDepth(17);
      this.luis=this.add.image(1220,326,'story-person-luis').setScale(1.83).setDepth(17);
      this.add.text(713,253,'LOUIS',{fontFamily:'system-ui',fontStyle:'bold',fontSize:'13px',color:'#71375c',stroke:'#ffeff5',strokeThickness:4}).setOrigin(.5).setDepth(18);
      this.add.text(1220,253,'LUIS ♡',{fontFamily:'system-ui',fontStyle:'bold',fontSize:'13px',color:'#71375c',stroke:'#ffeff5',strokeThickness:4}).setOrigin(.5).setDepth(18);
      this.tweens.add({targets:[this.louis,this.luis],y:'-=3',duration:930,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
      this.cameras.main.startFollow(this.kitty,true,.12,.12,0,0);
      this.shadow=this.add.container(1620,315,[
       this.add.ellipse(0,0,92,128,0x271f48,.82),
       this.add.circle(-12,-24,3,0xff6ca8,1),this.add.circle(12,-24,3,0xff6ca8,1),
       this.add.ellipse(0,49,103,16,0x15142d,.23)
      ]).setDepth(22).setAlpha(0).setVisible(false);
      for(const item of CLUES){
       const sprite=this.add.container(item.x,item.y,[
        this.add.circle(0,0,31,0xffe4ab,.30),
        this.add.text(0,-2,item.symbol,{fontFamily:'Georgia',fontSize:'37px',color:'#fff0c0',stroke:'#c177ab',strokeThickness:4}).setOrigin(.5)
       ]).setVisible(false).setDepth(15);
       this.tweens.add({targets:sprite,y:item.y-9,duration:820,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
       this.clueMarkers.push(sprite);
      }
      // fixed-screen blue-violet dusk + deepening darkness, always a single scene
      this.veil=this.add.rectangle(0,0,W,H,0x1a2248,0).setOrigin(0).setScrollFactor(0).setDepth(80);
      this.veil.setBlendMode(Engine.BlendModes.MULTIPLY);
      if(phaseRef.current.stage==='intro')showDialog(PROLOGUE_DIALOGUES.intro,()=>changed('begin'));
      if(phaseRef.current.stage==='defend')this.spawnEnemies();
      if(['ribbon','petals','wheel','door','window'].includes(phaseRef.current.stage))this.louis.setVisible(false);
      this.syncWorld(phaseRef.current.stage);
      if(import.meta.env.DEV){
       (window as Window & {__valePrologue?:unknown}).__valePrologue={
        stage:()=>phaseRef.current.stage,position:()=>this.kitty.x,
        teleport:(x:number,y=340)=>{this.kitty.setPosition(min(x,30,WORLD_W-30),y);this.cameras.main.centerOn(x,y);},
        defeatShadows:()=>{for(const e of this.enemies)e.hp=0;},
        interact:()=>actRef.current(),advanceDialog:()=>nextDialogRef.current(),
        health:()=>phaseRef.current.hp
       };
      }
     }
     drawWorld(){
      const g=this.add.graphics().setDepth(0);
      g.fillStyle(0xffdce7).fillRect(0,0,WORLD_W,H);
      g.fillStyle(0xd1e5bf).fillRect(0,164,WORLD_W,H-164);
      g.fillStyle(0xbad8b2).fillRect(0,430,WORLD_W,110);
      g.fillStyle(0xffe7c7).fillRoundedRect(34,270,WORLD_W-50,173,70);
      g.fillStyle(0xf3d2b6).fillRoundedRect(74,300,WORLD_W-130,112,54);
      g.fillStyle(0xaacba6).fillRect(0,171,WORLD_W,8);
      // Blossom trees and floating petals create a consistent pink 2D daytime
      // palette. The latter part gradually becomes violet without a scene cut.
      for(let i=0;i<50;i++){
       const x=53+i*53+(i*13)%22;
       const y=i%3===0?122:i%2===0?175:474;
       const far=i%4===0;
       g.fillStyle(0x8a6b78).fillRoundedRect(x-7,y-16,14,53,4);
       g.fillStyle(0xf2a8c8).fillCircle(x,y-22,far?29:37);
       g.fillStyle(0xf7bed4).fillCircle(x-15,y-29,far?20:25);
       g.fillStyle(0xffd2e1).fillCircle(x+12,y-38,far?16:23);
       for(let j=0;j<3;j++){
        g.fillStyle(0xffe6ed).fillCircle(x+(j*17-18),y+(j%2?5:-15),2.5);
       }
      }
      for(let i=0;i<135;i++){
       const x=(i*91+77)%WORLD_W;
       const y=190+(i*67)%230;
       g.fillStyle(i%5===0?0xe8a3bb:0xfff3d3,.8);
       g.fillCircle(x,y,i%3===0?3:1.8);
      }
      for(let i=0;i<26;i++){
       const x=i*110+53,y=247+(i%3)*105;
       g.fillStyle(0xf5abc7).fillCircle(x,y,5);
       g.fillStyle(0xfce2ed).fillCircle(x+4,y+3,3);
      }
      // Fairy-tale -> nightmare: an unmistakably closed house and a visible
      // upper window that matches the 3D entry animation.
      g.fillStyle(0x66516f).fillRoundedRect(2420,143,365,327,12);
      g.fillStyle(0x3c3256).fillRoundedRect(2440,164,323,302,6);
      g.fillStyle(0x3a2b4e).fillTriangle(2396,167,2600,45,2810,167);
      g.fillStyle(0x7e5576).fillRect(2470,277,99,190);
      g.lineStyle(7,0xe3aac5).strokeRect(2470,277,99,190);
      g.fillStyle(0x3c2941).fillRect(2480,286,80,171);
      g.fillStyle(0xefa5c9).fillCircle(2548,385,5);
      g.fillStyle(0x9bd3df).fillRect(2653,208,89,106);
      g.lineStyle(9,0xe6bcd3).strokeRect(2653,208,89,106);
      g.lineStyle(5,0xfdf0f3).lineBetween(2695,208,2695,314);
      g.lineStyle(5,0xfdf0f3).lineBetween(2653,263,2742,263);
      g.fillStyle(0xffb7c7,.55).fillTriangle(2744,203,2794,183,2794,313);
      this.add.text(2581,128,'CASA DEL BOSQUE',{fontFamily:'Georgia',fontStyle:'bold',fontSize:'19px',color:'#ffe7f6',stroke:'#211d32',strokeThickness:3}).setOrigin(.5);
      this.add.text(2484,484,'PUERTA CERRADA',{fontFamily:'system-ui',fontSize:'14px',fontStyle:'bold',color:'#ffebf1',stroke:'#292034',strokeThickness:3}).setOrigin(.5);
      this.add.text(2693,328,'VENTANA ABIERTA',{fontFamily:'system-ui',fontSize:'14px',fontStyle:'bold',color:'#ffebf1',stroke:'#292034',strokeThickness:3}).setOrigin(.5);
      this.worldMoon=this.add.circle(2330,91,43,0xfaf5eb).setDepth(1).setAlpha(0);
      this.add.text(340,125,'EL JARDÍN DE LOS DESEOS',{fontFamily:'Georgia',fontSize:'35px',color:'#a96b97',stroke:'#fff7f3',strokeThickness:5}).setOrigin(.5);
      this.add.text(1520,113,'CLARO DE LOS CEREZOS',{fontFamily:'Georgia',fontSize:'27px',color:'#9c6091',stroke:'#ffeafa',strokeThickness:4}).setOrigin(.5);
     }
     spawnEnemies(){
      if(this.enemies.length)return;
      for(const [i,p] of [[0,535,292],[1,650,376],[2,800,324]] as const){
       const body=this.add.container(p[1],p[2],[
        this.add.ellipse(0,4,47,39,0x3d2e57,.9),
        this.add.ellipse(0,-10,30,28,0x57446e,.92),
        this.add.circle(-8,-11,3.2,0xffcfec),this.add.circle(8,-11,3.2,0xffcfec),
        this.add.ellipse(0,28,35,8,0x7c6181,.32)
       ]).setDepth(14);
       this.tweens.add({targets:body,scale:1.09,duration:660+i*140,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
       this.enemies.push({body,hp:i===2?4:3,speed:38+i*8,hitAt:0,seed:i*1.4});
      }
      setEnemyCount(this.enemies.length);
     }
     syncWorld(stage:string){
      const twilight=['disappearance','ribbon','petals','wheel','door','window','house'].includes(stage);
      this.tweens.add({targets:this.veil,alpha:twilight?.50:0,duration:1700});
      this.tweens.add({targets:this.worldMoon,alpha:twilight?1:0,duration:2500});
      CLUES.forEach((item,i)=>this.clueMarkers[i].setVisible(item.stage===stage));
      if(twilight)this.louis.setVisible(false);
     }
     shoot(){
      const now=this.time.now;
      if(lockedRef.current||phaseRef.current.stage!=='defend'||now-this.lastShot<330)return;
      this.lastShot=now;
      const targets=this.enemies.filter(v=>v.hp>0);
      if(!targets.length)return;
      targets.sort((a,b)=>Engine.Math.Distance.Between(this.kitty.x,this.kitty.y,a.body.x,a.body.y)-
        Engine.Math.Distance.Between(this.kitty.x,this.kitty.y,b.body.x,b.body.y));
      const target=targets[0];
      const a=Math.atan2(target.body.y-this.kitty.y,target.body.x-this.kitty.x),speed=440;
      const shape=this.add.text(this.kitty.x,this.kitty.y-22,'♥',{fontFamily:'Georgia',fontSize:'30px',color:'#f276ad',stroke:'#fff5e7',strokeThickness:3}).setOrigin(.5).setDepth(25);
      this.shots.push({shape,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,ttl:1.5});
     }
     beginAbduction(){
      if(this.abductionRan||lockedRef.current)return;
      this.abductionRan=true;
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
      const left=Number(keys.A.isDown||keys.LEFT.isDown);
      const right=Number(keys.D.isDown||keys.RIGHT.isDown);
      const up=Number(keys.W.isDown||keys.UP.isDown);
      const down=Number(keys.S.isDown||keys.DOWN.isDown);
      let vx=right-left+stickRef.current.x,vy=down-up+stickRef.current.y;
      const length=Math.hypot(vx,vy);
      if(length>1){vx/=length;vy/=length;}
      const inertia=1-Math.exp(-12*dt);
      this.velocity.x+=(vx-this.velocity.x)*inertia;
      this.velocity.y+=(vy-this.velocity.y)*inertia;
      this.kitty.x=min(this.kitty.x+this.velocity.x*248*dt,42,boundaries[stage]??2780);
      this.kitty.y=min(this.kitty.y+this.velocity.y*205*dt,225,431);
      if(Math.abs(vx)+Math.abs(vy)>.1)this.kitty.setTexture('chibi-kitty-down-'+(Math.floor(this.time.now/150)%5));
      else this.kitty.setTexture('chibi-kitty-down-0');
      if(stage==='walk-together'){
       const goalX=Math.max(723,Math.min(this.kitty.x+53,1585));
       this.louis.x+=(goalX-this.louis.x)*min(1,dt*3.7);
       this.louis.y+=(this.kitty.y-this.louis.y)*min(1,dt*3.5);
      }
      if(stage==='defend'){
       if(keys.SPACE.isDown||keys.F.isDown||heldFire.current)this.shoot();
       for(const e of this.enemies){
        if(e.hp<=0)continue;
        const d=Math.hypot(this.kitty.x-e.body.x,this.kitty.y-e.body.y);
        if(d>51){
         e.body.x+=(this.kitty.x-e.body.x)/d*e.speed*dt;
         e.body.y+=(this.kitty.y-e.body.y)/d*e.speed*dt;
        }else if(this.time.now-this.lastHurt>1350){
         this.lastHurt=this.time.now;
         this.cameras.main.shake(95,.002);
         this.kitty.setTint(0xffa3ba);
         this.time.delayedCall(180,()=>this.kitty?.clearTint());
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
          enemy.hp--;enemy.body.setTint?.(0xffaacc);
          this.tweens.add({targets:enemy.body,alpha:.45,duration:85,yoyo:true});
          if(enemy.hp<=0){
           this.tweens.add({targets:enemy.body,alpha:0,scale:.12,duration:290,onComplete:()=>enemy.body.destroy()});
          }
          shot.ttl=0;break;
         }
        }
        if(shot.ttl<=0||shot.shape.x<0||shot.shape.x>WORLD_W){shot.shape.destroy();this.shots.splice(this.shots.indexOf(shot),1);}
       }
       const living=this.enemies.filter(v=>v.hp>0).length;
       if(living!==enemyCount)setEnemyCount(living);
       if(living===0&&!this.fightOver){
        this.fightOver=true;
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
     type:Engine.AUTO,parent:stageRef.current!,width:W,height:H,transparent:false,
     pixelArt:true,render:{antialias:false,roundPixels:true},audio:{noAudio:true},
     scale:{mode:Engine.Scale.FIT,autoCenter:Engine.Scale.CENTER_BOTH},
     scene:StoryGarden
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
 const portrait= currentLine?.speaker==='Kitty'?null:
  currentLine?.speaker==='Luis'?portraits.luis:portraits.louis;
 return <main className="story-prologue" aria-label="Actos uno y dos: el jardín y la desaparición" data-prologue-stage={run.stage}>
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
  {!dialog&&<p className="prologue-help">Joystick / WASD para moverse · E para hablar · Espacio / ♥ para disparar</p>}
  {error&&<div className="prologue-error" role="alert">No se pudo abrir el prólogo: {error}
   <button onClick={restart}>Reintentar</button><button onClick={onExit}>Salir</button></div>}
  {test&&<button className="prologue-restart" onClick={restart}>↻ Reiniciar prólogo</button>}
 </main>;
}
