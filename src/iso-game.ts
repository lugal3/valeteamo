import Phaser from 'phaser';
import {CHARACTERS,type CharacterId} from './characters';
import {buildArt} from './art';
import {buildChibi} from './chibi-art';
import {installReferenceKitty} from './kitty-reference';
import {facingOf,type Facing} from './animation';
import {ISO,constrain,isoDistance,screenVector,toScreen,type IsoPoint} from './isometric';
import {Sound} from './audio';

export type AdventureHud={hp:number,objective:string,complete:number,total:number,bombs:number};
type Enemy={p:IsoPoint,s:Phaser.GameObjects.Sprite,shadow:Phaser.GameObjects.Ellipse,hp:number,boss:boolean,next:number,flash:number};
type Shot={p:IsoPoint,du:number,dv:number,life:number,enemy:boolean,s:Phaser.GameObjects.Arc};
type Stick={id:number,x:number,y:number,dx:number,dy:number};

export class IsoAdventure extends Phaser.Scene {
 player!:Phaser.GameObjects.Sprite;shadow!:Phaser.GameObjects.Ellipse;floor!:Phaser.GameObjects.Graphics;fx!:Phaser.GameObjects.Graphics;
 p:IsoPoint={u:0,v:0};keys!:Record<string,Phaser.Input.Keyboard.Key>;left?:Stick;right?:Stick;mouse=false;facing:Facing='down';
 enemies:Enemy[]=[];shots:Shot[]=[];collectibles:{p:IsoPoint,s:Phaser.GameObjects.Text}[]=[];
 clock=0;last=0;inv=0;hp=6;bombs=2;paused=false;ended=false;wonAt=0;dyingAt=0;moveClock=0;collected=0;total=0;
 reducedMotion=typeof window!=='undefined'&&!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 private cancel=()=>this.clearInput();
 constructor(public level:1|2|3,public character:CharacterId,public report:(h:AdventureHud)=>void,public finish:(outcome:'win'|'dead')=>void,public onPause:(v:boolean)=>void,public audio:Sound,public ready:()=>void,public progress:(n:number)=>void=()=>{}){super('iso-adventure');}
 preload(){const path=CHARACTERS[this.character].chibiSpriteSheet;if(path)this.load.spritesheet(`chibi-${this.character}-sheet`,path,{frameWidth:32,frameHeight:40});else if(this.character==='kitty')this.load.image('kitty-reference-source',new URL('./sprites/kitty-reference-sheet.png',document.baseURI).href);this.load.on('progress',(n:number)=>this.progress(60+n*30));}
 create(){
  buildArt(this);buildChibi(this);if(this.character==='kitty'&&!CHARACTERS.kitty.chibiSpriteSheet)installReferenceKitty(this);this.floor=this.add.graphics().setDepth(0);this.fx=this.add.graphics().setDepth(1000);this.drawFloor();
  this.shadow=this.add.ellipse(0,0,30,10,0x425c4c,.25);this.player=this.add.sprite(0,0,`chibi-${this.character}-down-0`).setOrigin(.5,.9).setScale(1.3);
  this.p={u:.7,v:.7};this.positionPlayer();this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,B,SPACE,ESC') as Record<string,Phaser.Input.Keyboard.Key>;
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.paused||this.ended||this.wonAt)return;if(p.wasTouch){const stick={id:p.id,x:p.x,y:p.y,dx:0,dy:0};if(p.x<400&&!this.left)this.left=stick;else if(p.x>=400&&!this.right)this.right=stick;}else this.mouse=true;});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{for(const stick of [this.left,this.right])if(stick?.id===p.id){stick.dx=p.x-stick.x;stick.dy=p.y-stick.y;}});
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.left?.id===p.id)this.left=undefined;if(this.right?.id===p.id)this.right=undefined;if(!p.wasTouch)this.mouse=false;});
  this.input.on('gameout',()=>{if(!this.input.activePointer.isDown)this.clearInput();});this.game.canvas.addEventListener('pointercancel',this.cancel);
  this.input.keyboard!.on('keydown-B',()=>this.bomb());this.input.keyboard!.on('keydown-SPACE',()=>this.bomb());this.input.keyboard!.on('keydown-ESC',()=>this.setPaused(!this.paused));
  this.events.once('shutdown',()=>this.game.canvas.removeEventListener('pointercancel',this.cancel));
  if(this.level===1){for(const p of [{u:6,v:1},{u:2,v:6},{u:6,v:6}]){const xy=toScreen(p),s=this.add.text(xy.x,xy.y-12,'✦',{fontFamily:'Georgia',fontSize:'26px',color:'#ffe4a2',stroke:'#a66f7b',strokeThickness:2}).setOrigin(.5,1).setDepth(xy.y);this.collectibles.push({p,s});}this.total=3;}
  else{const list=this.level===2?[{u:5,v:2},{u:2,v:5},{u:6,v:6}]:[{u:5,v:5}];for(const p of list)this.spawnEnemy(p,this.level===3);this.total=list.length;}
  this.sync();this.progress(100);this.ready();
 }
 drawFloor(){
  const g=this.floor;g.clear();g.fillStyle(this.level===3?0xe8dce3:0xf1e5d2);g.fillRect(0,0,800,450);
  for(let u=0;u<ISO.size;u++)for(let v=0;v<ISO.size;v++){
   const p=toScreen({u,v}),w=ISO.tileW/2,h=ISO.tileH/2;
   const pts=[new Phaser.Geom.Point(p.x,p.y-h),new Phaser.Geom.Point(p.x+w,p.y),new Phaser.Geom.Point(p.x,p.y+h),new Phaser.Geom.Point(p.x-w,p.y)];
   const color=this.level===3?((u+v)%2?0xb3b799:0xc4c9a7):((u+v)%2?0xb8cda1:0xc9d9b0);
   g.fillStyle(color);g.fillPoints(pts,true);g.lineStyle(1,0x90aa89,.25);g.strokePoints(pts,true);
   if((u*13+v*7)%9===0){g.fillStyle(0xf2e7bd,.65);g.fillRect(p.x-2,p.y-1,4,2);}
  }
  // Garden ornaments are decorative and sorted at their feet, so characters can pass in front and behind them.
  for(const [u,v] of [[0,3],[1,7],[4,0],[7,4]])this.flower(u,v);
  this.tree(.15,5.6);this.tree(5.8,.15);
 }
 flower(u:number,v:number){const p=toScreen({u,v}),g=this.add.graphics().setDepth(p.y);g.fillStyle(0x688b69);g.fillRect(p.x-1,p.y-11,2,10);g.fillStyle(0xe8a5b6);g.fillRect(p.x-5,p.y-16,10,4);g.fillRect(p.x-2,p.y-19,4,10);g.fillStyle(0xf6d68a);g.fillRect(p.x-1,p.y-15,3,3);}
 tree(u:number,v:number){const p=toScreen({u,v}),g=this.add.graphics().setDepth(p.y);g.fillStyle(0x5b6750,.2);g.fillEllipse(p.x,p.y,48,14);g.fillStyle(0x8d6b5b);g.fillRect(p.x-4,p.y-30,8,30);g.fillStyle(0x6b936f);g.fillRect(p.x-23,p.y-51,46,25);g.fillRect(p.x-16,p.y-62,32,12);g.fillStyle(0x94b381);g.fillRect(p.x-19,p.y-52,35,16);g.fillStyle(0xe7a9bc);g.fillRect(p.x-14,p.y-46,4,4);g.fillRect(p.x+8,p.y-53,4,4);}
 spawnEnemy(p:IsoPoint,boss:boolean){const xy=toScreen(p),shadow=this.add.ellipse(xy.x,xy.y,30,9,0x425c4c,.22).setDepth(xy.y-1),s=this.add.sprite(xy.x,xy.y,'kuromi-0').setOrigin(.5,.85).setScale(boss?2.3:1.55).setDepth(xy.y);this.enemies.push({p:{...p},s,shadow,hp:boss?12:3,boss,next:1500+this.enemies.length*500,flash:0});}
 sync(){this.report({hp:this.hp,objective:this.level===1?'Luces encontradas':this.level===2?'Travesuras resueltas':'Desafío final',complete:this.collected,total:this.total,bombs:this.bombs});}
 clearInput(){this.left=this.right=undefined;this.mouse=false;if(this.keys)Object.values(this.keys).forEach(k=>k.reset());}
 setPaused(v:boolean){if(this.ended||this.wonAt)return;this.paused=v;this.clearInput();if(v)this.audio.suspend();else this.audio.resume();this.onPause(v);}
 positionPlayer(){const s=toScreen(this.p);this.player.setPosition(s.x,s.y).setDepth(s.y);this.shadow.setPosition(s.x,s.y+1).setDepth(s.y-1);}
 shoot(from:IsoPoint,du:number,dv:number,enemy=false){const xy=toScreen(from),s=this.add.circle(xy.x,xy.y-9,enemy?4:5,enemy?0xa16595:0xf091aa).setStrokeStyle(1,0xfff4e4);this.shots.push({p:{...from},du,dv,life:enemy?2500:1300,enemy,s});}
 damage(){if(this.clock<this.inv||this.ended||this.wonAt||this.dyingAt)return;this.hp--;this.inv=this.clock+1300;this.audio.tone(160,.15,.045,'triangle');if(!this.reducedMotion)this.cameras.main.shake(80,.002);this.sync();if(this.hp<=0){this.dyingAt=this.clock||1;this.clearInput();}}
 hitEnemy(e:Enemy,amount:number){if(!this.enemies.includes(e))return;e.hp-=amount;e.flash=this.clock+150;this.audio.hit();if(e.hp<=0){e.s.destroy();e.shadow.destroy();this.enemies=this.enemies.filter(x=>x!==e);this.collected++;this.sync();this.audio.tone(780,.16,.03);}}
 bomb(){if(this.paused||this.ended||this.wonAt||this.dyingAt||!this.bombs||this.level===1)return;this.bombs--;for(const e of [...this.enemies])if(isoDistance(e.p,this.p)<2)this.hitEnemy(e,3);this.audio.tone(130,.25,.06,'triangle');if(!this.reducedMotion)this.cameras.main.shake(100,.003);this.sync();}
 update(_time:number,delta:number){
  if(this.paused||this.ended)return;const dt=Math.min(delta,40),seconds=dt/1000;this.clock+=dt;
  if(this.dyingAt){const age=this.clock-this.dyingAt,key=`chibi-${this.character}-dead`;if(this.textures.exists(key))this.player.setTexture(key);this.player.setAlpha(Math.max(.25,1-age/800));if(!this.reducedMotion)this.player.setAngle(Math.min(65,age/10));if(age>650){this.ended=true;this.finish('dead');}return;}
  if(this.wonAt){if(!this.reducedMotion)this.player.setAngle(Math.sin(this.clock/90)*8);if(this.clock-this.wonAt>850){this.ended=true;this.finish('win');}return;}
  let x=+this.keys.D.isDown-+this.keys.A.isDown,y=+this.keys.S.isDown-+this.keys.W.isDown;
  if(this.left){x=this.left.dx;y=this.left.dy;if(Math.hypot(x,y)<7)x=y=0;}
  const moving=Math.hypot(x,y)>.1,move=screenVector(x,y);if(moving){this.p=constrain({u:this.p.u+move.u*2.1*seconds,v:this.p.v+move.v*2.1*seconds});this.moveClock+=dt;this.facing=facingOf(x,y,this.facing);}else this.moveClock=0;
  let ax=+this.keys.RIGHT.isDown-+this.keys.LEFT.isDown,ay=+this.keys.DOWN.isDown-+this.keys.UP.isDown;
  if(this.right){ax=this.right.dx;ay=this.right.dy;if(Math.hypot(ax,ay)<8)ax=ay=0;}else if(this.mouse){const point=toScreen(this.p);ax=this.input.activePointer.x-point.x;ay=this.input.activePointer.y-point.y;}
  const firing=Math.hypot(ax,ay)>.1&&this.level!==1;if(firing){this.facing=facingOf(ax,ay,this.facing);if(this.clock-this.last>300){this.last=this.clock;const aim=screenVector(ax,ay);this.shoot(this.p,aim.u*4,aim.v*4);this.audio.tone(700,.04,.015);}}
  const frame=moving?1+Math.floor(this.moveClock/115)%4:this.clock%3600>3440?5:0,dir=this.facing==='left'?'right':this.facing;
  const hurt=this.clock<this.inv&&this.clock>this.inv-300,hurtKey=`chibi-${this.character}-hurt`,texture=hurt&&this.textures.exists(hurtKey)?hurtKey:`chibi-${this.character}-${dir}-${hurt?5:frame}${firing&&!hurt?'-shoot':''}`;
  this.positionPlayer();this.player.setTexture(texture).setFlipX(this.facing==='left').setAlpha(this.clock<this.inv&&Math.floor(this.clock/90)%2?.45:1).setAngle(hurt&&!this.reducedMotion?Math.sin(this.clock/35)*10:moving&&!this.reducedMotion?Math.sin(this.moveClock/115*Math.PI)*3:0);
  if(this.clock<this.inv&&this.clock>this.inv-300)this.player.setTint(0xffa8bb);else this.player.clearTint();
  for(const light of [...this.collectibles]){light.s.y=toScreen(light.p).y-12+Math.sin(this.clock/230)*3;if(isoDistance(light.p,this.p)<.48){light.s.destroy();this.collectibles=this.collectibles.filter(x=>x!==light);this.collected++;this.audio.tone(880,.18,.035);this.sync();}}
  for(const e of [...this.enemies]){
   const du=this.p.u-e.p.u,dv=this.p.v-e.p.v,d=Math.hypot(du,dv)||1;
   if(d>1.2)e.p=constrain({u:e.p.u+du/d*(e.boss?.45:.65)*seconds,v:e.p.v+dv/d*(e.boss?.45:.65)*seconds});
   const xy=toScreen(e.p);e.s.setPosition(xy.x,xy.y).setDepth(xy.y).setTexture(`kuromi-${Math.floor(this.clock/160)%4}`).setFlipX(du-dv<0);e.shadow.setPosition(xy.x,xy.y).setDepth(xy.y-1);
   if(this.clock<e.flash)e.s.setTint(0xffc5d9);else if(this.clock>e.next-450)e.s.setTint(0xf2c1dd);else e.s.clearTint();
   if(d<.48)this.damage();if(this.dyingAt)return;
   if(this.clock>e.next){e.next=this.clock+(e.boss?1900:2600);const count=e.boss?8:1;for(let i=0;i<count;i++){const a=e.boss?i*Math.PI*2/count:Math.atan2(dv,du);this.shoot(e.p,Math.cos(a)*1.4,Math.sin(a)*1.4,true);}}
  }
  for(const shot of [...this.shots]){shot.life-=dt;shot.p.u+=shot.du*seconds;shot.p.v+=shot.dv*seconds;const xy=toScreen(shot.p);shot.s.setPosition(xy.x,xy.y-9).setDepth(xy.y+1);
   let remove=shot.life<=0||shot.p.u<-.5||shot.p.v<-.5||shot.p.u>ISO.size||shot.p.v>ISO.size;
   if(shot.enemy&&isoDistance(shot.p,this.p)<.38){this.damage();remove=true;}
   if(!shot.enemy){const target=this.enemies.find(e=>isoDistance(e.p,shot.p)<(e.boss?.62:.43));if(target){this.hitEnemy(target,1);remove=true;}}
   if(remove){shot.s.destroy();this.shots=this.shots.filter(x=>x!==shot);}if(this.dyingAt)return;
  }
  const g=this.fx;g.clear();for(const e of this.enemies)if(this.clock>e.next-450){const p=toScreen(e.p);g.lineStyle(2,0xbd6994,.8);g.strokeCircle(p.x,p.y-12,e.boss?27:18);}for(const stick of [this.left,this.right])if(stick){g.lineStyle(2,0x715a73,.28);g.strokeCircle(stick.x,stick.y,32);g.fillStyle(0x866779,.25);const n=Math.max(1,Math.hypot(stick.dx,stick.dy)/24);g.fillCircle(stick.x+stick.dx/n,stick.y+stick.dy/n,11);}
  if(this.collected>=this.total){this.wonAt=this.clock||1;this.clearInput();this.audio.tone(1046,.25,.035);}
 }
}
