import Phaser from 'phaser';
import {CHARACTERS,type CharacterId} from './characters';
import {buildArt} from './art';
import {buildChibi} from './chibi-art';
import {installReferenceCharacter} from './reference-characters';
import {facingOf,type Facing} from './animation';
import {ISO,constrain,isoDistance,screenVector,toScreen,type IsoPoint} from './isometric';
import {Sound} from './audio';

export type AdventureOffer={name:string,description:string};
export type AdventureHud={hp:number,objective:string,complete:number,total:number,bombs:number,shield:boolean,offer?:AdventureOffer,bossHp?:number,bossMax?:number};
type Enemy={p:IsoPoint,s:Phaser.GameObjects.Sprite,shadow:Phaser.GameObjects.Ellipse,hp:number,boss:boolean,kind:'kuromi'|'cinna',next:number,flash:number,phase:number};
type Shot={p:IsoPoint,du:number,dv:number,life:number,enemy:boolean,s:Phaser.GameObjects.Text};
type Burst={x:number,y:number,at:number,color:number};
type Danger={p:IsoPoint,at:number};
type Stick={id:number,x:number,y:number,dx:number,dy:number};
type FloatingNote={s:Phaser.GameObjects.Text,y:number,at:number};

export class IsoAdventure extends Phaser.Scene {
 player!:Phaser.GameObjects.Sprite;shadow!:Phaser.GameObjects.Ellipse;floor!:Phaser.GameObjects.Graphics;fx!:Phaser.GameObjects.Graphics;
 p:IsoPoint={u:0,v:0};keys!:Record<string,Phaser.Input.Keyboard.Key>;left?:Stick;right?:Stick;mouse=false;facing:Facing='down';
 enemies:Enemy[]=[];shots:Shot[]=[];collectibles:{p:IsoPoint,s:Phaser.GameObjects.Text}[]=[];
 charm?:{p:IsoPoint,s:Phaser.GameObjects.Text};pendingOffer=false;declinedCharm=false;shield=false;
 bursts:Burst[]=[];dangers:Danger[]=[];clock=0;last=0;inv=0;hp=6;bombs=2;paused=false;ended=false;wonAt=0;dyingAt=0;moveClock=0;lastStep=0;collected=0;total=0;shotDir={x:0,y:0};
 notes:FloatingNote[]=[];
 reducedMotion=typeof window!=='undefined'&&!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 private cancel=()=>this.clearInput();
 constructor(public level:1|2|3,public character:CharacterId,public report:(h:AdventureHud)=>void,public finish:(outcome:'win'|'dead')=>void,public onPause:(v:boolean)=>void,public audio:Sound,public ready:()=>void,public progress:(n:number)=>void=()=>{}){super('iso-adventure');}
 preload(){const path=CHARACTERS[this.character].chibiSpriteSheet;if(path)this.load.spritesheet(`chibi-${this.character}-sheet`,path,{frameWidth:32,frameHeight:40});else{this.load.image(`${this.character}-reference-source`,new URL(`./sprites/${this.character}-reference-sheet.png`,document.baseURI).href);this.load.image(`${this.character}-walk-source`,new URL(`./sprites/${this.character}-walk-sheet.png`,document.baseURI).href);}this.load.on('progress',(n:number)=>this.progress(60+n*30));}
 create(){
  buildArt(this);buildChibi(this);if(!CHARACTERS[this.character].chibiSpriteSheet)installReferenceCharacter(this,this.character);this.floor=this.add.graphics().setDepth(0);this.fx=this.add.graphics().setDepth(1000);this.drawFloor();
  this.shadow=this.add.ellipse(0,0,30,10,0x425c4c,.25);this.player=this.add.sprite(0,0,`chibi-${this.character}-down-0`).setOrigin(.5,.9).setScale(1.3);
  this.p={u:.7,v:.7};this.positionPlayer();this.fitCamera(this.scale.width,this.scale.height);this.scale.on('resize',(size:{width:number,height:number})=>this.fitCamera(size.width,size.height));this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,B,SPACE,ESC') as Record<string,Phaser.Input.Keyboard.Key>;
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.paused||this.pendingOffer||this.ended||this.wonAt)return;if(p.wasTouch){const stick={id:p.id,x:p.x,y:p.y,dx:0,dy:0};if(p.x<this.scale.width/2&&!this.left)this.left=stick;else if(p.x>=this.scale.width/2&&!this.right)this.right=stick;}else this.mouse=true;});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{for(const stick of [this.left,this.right])if(stick?.id===p.id){stick.dx=p.x-stick.x;stick.dy=p.y-stick.y;}});
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.left?.id===p.id)this.left=undefined;if(this.right?.id===p.id)this.right=undefined;if(!p.wasTouch)this.mouse=false;});
  this.input.on('gameout',()=>{if(!this.input.activePointer.isDown)this.clearInput();});this.game.canvas.addEventListener('pointercancel',this.cancel);
  this.input.keyboard!.on('keydown-B',()=>this.bomb());this.input.keyboard!.on('keydown-SPACE',()=>this.bomb());this.input.keyboard!.on('keydown-ESC',()=>this.setPaused(!this.paused));
  this.events.once('shutdown',()=>this.game.canvas.removeEventListener('pointercancel',this.cancel));
  if(this.level===1){for(const p of [{u:6,v:1},{u:2,v:6},{u:6,v:6}]){const xy=toScreen(p),s=this.add.text(xy.x,xy.y-12,'✦',{fontFamily:'Georgia',fontSize:'26px',color:'#ffe4a2',stroke:'#a66f7b',strokeThickness:2}).setOrigin(.5,1).setDepth(xy.y);this.collectibles.push({p,s});}this.total=3;}
  else{const list=this.level===2?[{u:5,v:2},{u:2,v:5},{u:6,v:6}]:[{u:5,v:5}];for(const [i,p] of list.entries())this.spawnEnemy(p,this.level===3,i===1?'cinna':'kuromi');this.total=list.length;}
  if(this.level>1){const p={u:3.4,v:3.4},xy=toScreen(p),s=this.add.text(xy.x,xy.y-12,'✧',{fontFamily:'Georgia',fontSize:'25px',color:'#ffe1a0',stroke:'#9a6c78',strokeThickness:2}).setOrigin(.5,1).setDepth(xy.y);this.charm={p,s};}
  this.sync();this.progress(100);this.ready();
 }
 fitCamera(width:number,height:number){if(width<=0||height<=0)return;this.cameras.main.setZoom(Math.min(width/800,height/450)*1.08).centerOn(400,225);}
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
 sync(){const boss=this.enemies.find(e=>e.boss);this.report({hp:this.hp,objective:this.level===1?'Luces encontradas':this.level===2?'Travesuras resueltas':'Desafío final',complete:this.collected,total:this.total,bombs:this.bombs,shield:this.shield,offer:this.pendingOffer?{name:'Manto de pétalos',description:'Una burbuja bloquea el próximo golpe de este tramo. Puedes recogerla o dejarla aquí.'}:undefined,bossHp:boss?.hp,bossMax:boss?12:undefined});}
 clearInput(){this.left=this.right=undefined;this.mouse=false;if(this.keys)Object.values(this.keys).forEach(k=>k.reset());}
 setPaused(v:boolean){if(this.ended||this.wonAt)return;this.paused=v;this.clearInput();if(v)this.audio.suspend();else this.audio.resume();this.onPause(v);}
 positionPlayer(){const s=toScreen(this.p);this.player.setPosition(s.x,s.y).setDepth(s.y);this.shadow.setPosition(s.x,s.y+1).setDepth(s.y-1);}
 shoot(from:IsoPoint,du:number,dv:number,enemy=false){const xy=toScreen(from),s=this.add.text(xy.x,xy.y-9,enemy?'✦':'♥',{fontFamily:'Georgia',fontSize:enemy?'16px':'17px',color:enemy?'#a05c95':'#df6d91',stroke:'#fff5e4',strokeThickness:2}).setOrigin(.5);this.shots.push({p:{...from},du,dv,life:enemy?2500:1300,enemy,s});}
 burst(p:IsoPoint,color:number){const xy=toScreen(p);this.bursts.push({x:xy.x,y:xy.y,at:this.clock,color});if(this.bursts.length>28)this.bursts.shift();}
 floatNote(p:IsoPoint,label:string,color='#a46178'){const xy=toScreen(p),y=xy.y-55,s=this.add.text(xy.x,y,label,{fontFamily:'Georgia',fontSize:'14px',color,stroke:'#fff9ed',strokeThickness:3}).setOrigin(.5).setDepth(1100);this.notes.push({s,y,at:this.clock});if(this.notes.length>8)this.notes.shift()?.s.destroy();}
 damage(){if(this.clock<this.inv||this.ended||this.wonAt||this.dyingAt||this.pendingOffer)return;if(this.shield){this.shield=false;this.inv=this.clock+900;this.burst(this.p,0xffdf8a);this.floatNote(this.p,'¡Protegida!','#a67c3b');this.audio.tone(950,.22,.04);this.sync();return;}this.hp--;this.inv=this.clock+1300;this.burst(this.p,0xe485a3);this.floatNote(this.p,'− ♥');this.audio.tone(160,.15,.045,'triangle');if(!this.reducedMotion)this.cameras.main.shake(80,.002);this.sync();if(this.hp<=0){this.dyingAt=this.clock||1;this.clearInput();}}
 hitEnemy(e:Enemy,amount:number){if(!this.enemies.includes(e))return;e.hp-=amount;e.flash=this.clock+150;this.burst(e.p,e.kind==='cinna'?0x91c7d2:0xd68bad);this.audio.hit();if(e.hp<=0){this.floatNote(e.p,'✦');e.s.destroy();e.shadow.destroy();this.enemies=this.enemies.filter(x=>x!==e);this.collected++;this.audio.tone(780,.16,.03);}this.sync();}
 bomb(){if(this.paused||this.pendingOffer||this.ended||this.wonAt||this.dyingAt||!this.bombs||this.level===1)return;this.bombs--;this.burst(this.p,0xffd584);for(const e of [...this.enemies])if(isoDistance(e.p,this.p)<2)this.hitEnemy(e,3);this.audio.tone(130,.25,.06,'triangle');if(!this.reducedMotion)this.cameras.main.shake(100,.003);this.sync();}
 chooseItem(accept:boolean){if(!this.pendingOffer||this.paused||!this.charm)return;this.pendingOffer=false;this.clearInput();if(accept){this.shield=true;this.burst(this.charm.p,0xffd584);this.floatNote(this.charm.p,'¡Manto listo!','#a67c3b');this.charm.s.destroy();this.charm=undefined;this.audio.tone(880,.22,.035);}else this.declinedCharm=true;this.sync();}
 update(_time:number,delta:number){
  if(this.paused||this.pendingOffer||this.ended)return;const dt=Math.min(delta,40),seconds=dt/1000;this.clock+=dt;
  this.notes=this.notes.filter(note=>{const age=this.clock-note.at;if(age>=850){note.s.destroy();return false;}note.s.y=note.y-(this.reducedMotion?0:age/45);note.s.setAlpha(Math.min(1,(850-age)/200));return true;});
  if(this.dyingAt){const age=this.clock-this.dyingAt,key=`chibi-${this.character}-dead`;if(this.textures.exists(key))this.player.setTexture(key);this.player.setAlpha(Math.max(.25,1-age/800));if(!this.reducedMotion)this.player.setAngle(Math.min(65,age/10));if(age>650){this.ended=true;this.finish('dead');}return;}
  if(this.wonAt){if(!this.reducedMotion)this.player.setAngle(Math.sin(this.clock/90)*8);if(this.clock-this.wonAt>850){this.ended=true;this.finish('win');}return;}
  let x=+this.keys.D.isDown-+this.keys.A.isDown,y=+this.keys.S.isDown-+this.keys.W.isDown;
  if(this.left){x=this.left.dx;y=this.left.dy;if(Math.hypot(x,y)<7)x=y=0;}
  const wantsMove=Math.hypot(x,y)>.1,move=screenVector(x,y),strength=this.left?Math.min(1,Math.hypot(x,y)/45):1;let moving=false;if(wantsMove){const next=constrain({u:this.p.u+move.u*2.1*seconds*strength,v:this.p.v+move.v*2.1*seconds*strength});moving=isoDistance(next,this.p)>.001;this.p=next;if(moving){this.moveClock+=dt*(.45+.55*strength);if(this.moveClock-this.lastStep>250){this.lastStep=this.moveClock;this.burst(this.p,0xf8e8ca);this.audio.tone(245,.04,.004,'triangle');}}else{this.moveClock=0;this.lastStep=0;}this.facing=facingOf(x,y,this.facing);}else{this.moveClock=0;this.lastStep=0;}
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
   if(d>1.2)e.p=constrain({u:e.p.u+du/d*(e.boss?.45:.65)*seconds,v:e.p.v+dv/d*(e.boss?.45:.65)*seconds});
   const xy=toScreen(e.p),bounce=this.reducedMotion?0:Math.abs(Math.sin(this.clock/250+e.phase))*2;e.s.setPosition(xy.x,xy.y-bounce).setDepth(xy.y).setTexture(`${e.kind}-${Math.floor(this.clock/160)%4}`).setFlipX(du-dv<0);e.shadow.setPosition(xy.x,xy.y).setDepth(xy.y-1);
   if(this.clock<e.flash)e.s.setTint(0xffc5d9);else if(this.clock>e.next-450)e.s.setTint(0xf2c1dd);else e.s.clearTint();
   if(d<.48)this.damage();if(this.dyingAt)return;
   if(this.clock>e.next){e.next=this.clock+(e.boss?2100:2600);e.phase++;
    if(e.boss&&e.phase%2===0){for(const offset of [-.8,0,.8])this.dangers.push({p:constrain({u:this.p.u+offset,v:this.p.v}),at:this.clock+1150});}
    else{const count=e.boss?8:e.kind==='cinna'?3:1;for(let i=0;i<count;i++){const a=e.boss?i*Math.PI*2/count:Math.atan2(dv,du)+(i-(count-1)/2)*.24;this.shoot(e.p,Math.cos(a)*1.4,Math.sin(a)*1.4,true);}}
   }
  }
  for(const shot of [...this.shots]){shot.life-=dt;shot.p.u+=shot.du*seconds;shot.p.v+=shot.dv*seconds;const xy=toScreen(shot.p);shot.s.setPosition(xy.x,xy.y-9).setDepth(xy.y+1);
   let remove=shot.life<=0||shot.p.u<-.5||shot.p.v<-.5||shot.p.u>ISO.size||shot.p.v>ISO.size;
   if(shot.enemy&&isoDistance(shot.p,this.p)<.38){this.damage();remove=true;}
   if(!shot.enemy){const target=this.enemies.find(e=>isoDistance(e.p,shot.p)<(e.boss?.62:.43));if(target){this.hitEnemy(target,1);remove=true;}}
   if(remove){shot.s.destroy();this.shots=this.shots.filter(x=>x!==shot);}if(this.dyingAt)return;
  }
  for(const zone of [...this.dangers])if(this.clock>=zone.at){if(isoDistance(zone.p,this.p)<.55)this.damage();this.burst(zone.p,0xc385b4);this.dangers=this.dangers.filter(z=>z!==zone);}if(this.dyingAt)return;
  const g=this.fx;g.clear();if(!this.reducedMotion){for(let i=0;i<12;i++){const t=this.clock*.012+i*53,x=100+(i*83)%600+Math.sin(t/30)*9,y=70+((i*41+t*.5)%290);g.fillStyle(i%2?0xfff2d5:0xf5c5d4,.3+Math.sin(t/18)*.12);g.fillRect(x,y,3,3);}for(let i=0;i<3;i++){const t=this.clock/1000+i*2.4,x=165+i*205+Math.sin(t*.38)*35,y=115+i*24+Math.cos(t*.8)*10,wing=Math.sin(t*9)>0?5:2;g.fillStyle(i===1?0xf4e4a8:0xeab3c5,.72);g.fillRect(x-wing-1,y-3,wing,5);g.fillRect(x+2,y-3,wing,5);g.fillStyle(0x8e7571,.65);g.fillRect(x,y-2,2,4);}}if(this.last&&this.clock-this.last<110){const p=toScreen(this.p);g.fillStyle(0xffdfb4,.9);g.fillCircle(p.x+this.shotDir.x*20,p.y-16+this.shotDir.y*14,3);}if(this.shield){const p=toScreen(this.p);g.lineStyle(2,0xffedb8,.85);g.strokeCircle(p.x,p.y-18,27);}for(const zone of this.dangers){const p=toScreen(zone.p),fraction=1-(zone.at-this.clock)/1150;g.fillStyle(0xc579a5,.15+fraction*.12);g.fillCircle(p.x,p.y,24);g.lineStyle(2,0xb66391,.8);g.strokeCircle(p.x,p.y,24);}
  this.bursts=this.bursts.filter(b=>this.clock-b.at<380);for(const b of this.bursts){const t=(this.clock-b.at)/380;g.lineStyle(2,b.color,1-t);g.strokeCircle(b.x,b.y,this.reducedMotion?12:4+t*18);if(!this.reducedMotion){g.fillStyle(b.color,1-t);for(let i=0;i<4;i++){const a=i*Math.PI/2;g.fillRect(b.x+Math.cos(a)*t*18,b.y+Math.sin(a)*t*12,3,3);}}}
  for(const e of this.enemies)if(this.clock>e.next-450){const p=toScreen(e.p);g.lineStyle(2,0xbd6994,.8);g.strokeCircle(p.x,p.y-12,e.boss?27:18);}for(const stick of [this.left,this.right])if(stick){const camera=this.cameras.main,p=camera.getWorldPoint(stick.x,stick.y),z=camera.zoom,n=Math.max(1,Math.hypot(stick.dx,stick.dy)/24);g.lineStyle(2/z,0x715a73,.28);g.strokeCircle(p.x,p.y,32/z);g.fillStyle(0x866779,.25);g.fillCircle(p.x+stick.dx/n/z,p.y+stick.dy/n/z,11/z);}
  if(this.collected>=this.total){this.wonAt=this.clock||1;this.clearInput();this.audio.tone(1046,.25,.035);}
 }
}
