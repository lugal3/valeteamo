import Phaser from 'phaser';
import {CONFIG as C,ROOMS,ITEMS,PICKUPS} from './config';
import {CHARACTERS,CharacterId,SPRITE} from './characters';
import {buildArt} from './art';
import {drawGarden,drawDoor} from './garden-art';
import {Sound} from './audio';
import {Effects} from './effects';
import {clamp,confine,distance,doorPoint,remap,roomLayout,rayLength,Direction,Layout,Point} from './geometry';
import {Facing,PlayerState,facingOf,playerPose} from './animation';
export type ItemOffer={type:string,name:string,description:string,cost:number,affordable:boolean};
export type Hud={hp:number,coins:number,bombs:number,keys:number,active:string,charge:boolean,chargeRooms:number,room:string,roomIndex:number,visited:number[],message:string,shield:boolean,state:PlayerState,bossHp?:number,offer?:ItemOffer,character:CharacterId};
type Loot={s:Phaser.GameObjects.Container,type:keyof typeof PICKUPS,cost:number,visual?:Phaser.GameObjects.Sprite,born:number};
type SavedLoot={type:keyof typeof PICKUPS,cost:number,x:number,y:number};
type Mob={s:Phaser.GameObjects.Sprite,hp:number,type:string,next:number,phase:number,born:number,hitUntil:number,kx:number,ky:number};
type Shot={s:Phaser.GameObjects.Arc,vx:number,vy:number,life:number,enemy:boolean,damage:number,home:boolean};
type Stick={id:number,x:number,y:number,dx:number,dy:number};
export class Garden extends Phaser.Scene {
 audio:Sound;ui:(h:Hud)=>void;finish:(e:string)=>void;onPause:(p:boolean)=>void;
 g!:Phaser.GameObjects.Graphics;fx!:Phaser.GameObjects.Graphics;player!:Phaser.GameObjects.Sprite;
 effects=new Effects();layout:Layout=roomLayout(800,320);keys!:Record<string,Phaser.Input.Keyboard.Key>;
 room=0;clock=0;paused=false;ended=false;dyingAt=0;hp=C.hp;coins=C.coins;bombs=C.bombs;keyCount=C.keys;
 charge=true;roomsSinceUse=0;activeItem='poop';brim=false;mantle=false;shield=false;inv=0;hurtUntil=0;blockUntil=0;
 last=0;charging=0;gate=0;unlocked=false;hatchReady=false;message='';until=0;facing:Facing='down';state:PlayerState='idle';
 cleared=new Set<number>();visited=new Set<number>();mobs:Mob[]=[];shots:Shot[]=[];
 loot:Loot[]=[];pending?:Loot;declined=new Set<Loot>();piles:Phaser.GameObjects.Sprite[]=[];
 roomLoot=new Map<number,SavedLoot[]>();
 character:CharacterId;ready:()=>void;progress:(n:number)=>void;walkClock=0;stepAt=0;recoilUntil=0;roomEntered=0;
 bombList:{s:Phaser.GameObjects.Sprite,t:number}[]=[];zones:{x:number,y:number,t:number}[]=[];
 left?:Stick;right?:Stick;mouse=false;private cancel=()=>this.clearInput();
 constructor(ui:(h:Hud)=>void,finish:(e:string)=>void,onPause:(p:boolean)=>void=()=>{},audio=new Sound(),character:CharacterId='kitty',ready=()=>{},progress:(n:number)=>void=()=>{}){
  super('garden');this.ui=ui;this.finish=finish;this.onPause=onPause;this.audio=audio;this.character=character;this.ready=ready;this.progress=progress;
 }
 preload(){
  for(const [id,character]of Object.entries(CHARACTERS))if(character.spriteSheet)this.load.spritesheet(`${id}-sheet`,character.spriteSheet,{frameWidth:SPRITE.width,frameHeight:SPRITE.height});
  this.load.on('progress',(n:number)=>this.progress(60+n*20));
 }
 create(){
  buildArt(this);this.g=this.add.graphics();this.fx=this.add.graphics().setDepth(40);
  this.player=this.add.sprite(0,0,`${this.character}-down-0`).setScale(C.playerScale).setOrigin(.5,.6).setDepth(20);
  this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,B,SPACE,ESC') as Record<string,Phaser.Input.Keyboard.Key>;
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{
   if(this.paused||this.pending||this.ended||this.dyingAt)return;
   if(p.wasTouch){const s={id:p.id,x:p.x,y:p.y,dx:0,dy:0};if(p.x<this.scale.width/2&&!this.left)this.left=s;else if(p.x>=this.scale.width/2&&!this.right)this.right=s;}
   else this.mouse=true;
  });
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{for(const s of [this.left,this.right])if(s?.id===p.id){s.dx=p.x-s.x;s.dy=p.y-s.y;}});
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.left?.id===p.id)this.left=undefined;if(this.right?.id===p.id)this.right=undefined;if(!p.wasTouch)this.mouse=false;});
  this.game.canvas.addEventListener('pointercancel',this.cancel);this.input.on('gameout',()=>{if(!this.input.activePointer.isDown)this.clearInput()});
  this.input.keyboard!.on('keydown-B',()=>this.bomb());this.input.keyboard!.on('keydown-SPACE',()=>this.active());this.input.keyboard!.on('keydown-ESC',()=>this.setPaused(!this.paused));
  this.scale.on('resize',(size:{width:number,height:number})=>this.relayout(size.width,size.height));
  this.events.once('shutdown',()=>this.game.canvas.removeEventListener('pointercancel',this.cancel));
  this.relayout(this.scale.width,this.scale.height);this.enter(0,undefined,false);this.progress(100);this.ready();
 }
 relayout(width:number,height:number){
  if(width<1||height<1)return;const old=this.layout,next=roomLayout(width,height);this.layout=next;
  if(this.player){for(const s of [this.player,...this.mobs.map(m=>m.s),...this.shots.map(b=>b.s),...this.loot.map(l=>l.s),...this.piles,...this.bombList.map(b=>b.s),...this.zones]){
   const p=confine(remap(s,old,next),next,s===this.player?C.playerRadius:3);s.x=p.x;s.y=p.y;
  }}
  this.effects.resize(old,next);this.clearInput();this.cameras.main.setZoom(next.zoom).centerOn(next.cx,next.cy);if(this.g)this.draw();
 }
 clearInput(){this.left=this.right=undefined;this.mouse=false;this.charging=0;if(this.keys)Object.values(this.keys).forEach(k=>k.reset());}
 setPaused(p:boolean){if(this.ended)return;this.paused=p;this.clearInput();if(p)this.audio.suspend();else this.audio.resume();this.onPause(p);}
 restartRun(){this.hp=C.hp;this.coins=C.coins;this.bombs=C.bombs;this.keyCount=C.keys;this.charge=true;this.roomsSinceUse=0;this.inv=this.hurtUntil=this.blockUntil=this.last=this.dyingAt=this.walkClock=this.recoilUntil=0;this.pending=undefined;this.activeItem='poop';this.brim=this.mantle=this.unlocked=this.ended=false;this.state='idle';this.facing='down';this.player.setTexture(`${this.character}-down-0`).setAlpha(1).setAngle(0).setScale(C.playerScale).clearTint();this.cleared.clear();this.visited.clear();this.roomLoot.clear();this.setPaused(false);this.enter(0,undefined,false);}
 say(s:string,ms=4700){this.message=s;this.until=this.clock+ms;this.sync();}
 sync(){const item=this.pending;this.ui({hp:this.hp,coins:this.coins,bombs:this.bombs,keys:this.keyCount,active:this.activeItem,charge:this.charge,chargeRooms:Math.max(0,C.activeRooms-this.roomsSinceUse),room:ROOMS[this.room].name,roomIndex:this.room,visited:[...this.visited],message:this.message,shield:this.shield,state:this.state,bossHp:this.mobs.find(m=>m.type==='boss')?.hp,character:this.character,offer:item?{...PICKUPS[item.type],type:item.type,cost:item.cost,affordable:this.coins>=item.cost}:undefined});}
 enter(n:number,from?:Direction,saveCurrent=true){
  if(saveCurrent){const l=this.layout;this.roomLoot.set(this.room,this.loot.map(loot=>({type:loot.type,cost:loot.cost,x:(loot.s.x-l.left)/(l.right-l.left),y:(loot.s.y-l.top)/(l.bottom-l.top)})));}
  this.clearInput();[...this.mobs.map(m=>m.s),...this.shots.map(s=>s.s),...this.loot.map(l=>l.s),...this.piles,...this.bombList.map(b=>b.s)].forEach(s=>s.destroy());
  this.mobs=[];this.shots=[];this.loot=[];this.pending=undefined;this.declined.clear();this.piles=[];this.bombList=[];this.zones=[];this.effects.clear();this.room=n;this.roomEntered=this.clock;this.hatchReady=false;this.visited.add(n);this.shield=this.mantle;this.gate=this.clock+700;
  const l=this.layout,p=from?doorPoint(from,l,34):{x:l.cx,y:l.cy};this.player.setPosition(p.x,p.y);this.draw();
  const kind=ROOMS[n].kind,w=l.right-l.left,h=l.bottom-l.top;
  if(!this.cleared.has(n)){
   if(kind==='fight')for(let i=0;i<4;i++){
    let pos={x:l.left+w*(.36+(i%2)*.32),y:l.top+h*(i<2?.27:.72)};
    if(distance(pos,this.player)<92)pos={x:l.left+w*.75,y:l.top+h*(i%2?.72:.28)};
    this.spawn((i+n)%2?'kuromi':'cinna',pos.x,pos.y);
   }
   if(kind==='boss')this.spawn('boss',l.left+w*.72,l.cy);
   if(kind==='treasure'&&!this.roomLoot.has(n))this.drop('brim',l.cx,l.cy);
  }
  if(this.roomLoot.has(n)){for(const loot of this.roomLoot.get(n)!)this.drop(loot.type,l.left+loot.x*w,l.top+loot.y*h,loot.cost);}
  else if(kind==='shop'){if(this.activeItem!=='head')this.drop('head',l.cx-w*.15,l.cy,5);if(!this.mantle)this.drop('mantle',l.cx+w*.15,l.cy,7);}
  this.effects.ring(p.x,p.y,27,0xffe6c5);
  this.say(kind==='start'?`${CHARACTERS[this.character].name} · ¡Feliz cumpleaños, Valentina! Explora el jardín.`:kind==='shop'?'Acércate para ver cada regalo antes de comprar.':kind==='boss'?'Mega Kuromi · ¡Sigue las señales rosas!':ROOMS[n].name,3200);
 }
 draw(){drawGarden(this.g,this.layout,ROOMS[this.room].kind);}
 spawn(type:string,x:number,y:number){
  const p=confine({x,y},this.layout,type==='boss'?28:18);
  this.mobs.push({s:this.add.sprite(p.x,p.y,type==='cinna'?'cinna-0':'kuromi-0').setOrigin(.5,.6).setScale(type==='boss'?3.1:1.75).setDepth(15),hp:type==='boss'?C.bossHp:type==='cinna'?5:7,type,next:this.clock+1900+this.mobs.length*380,phase:0,born:this.clock,hitUntil:0,kx:0,ky:0});
  this.effects.ring(p.x,p.y,28,0xc19ab9);
 }
 drop(type:keyof typeof PICKUPS,x:number,y:number,cost=0){
  const p=confine({x,y},this.layout,24),s=this.add.container(p.x,p.y).setDepth(10);
  let visual:Phaser.GameObjects.Sprite|undefined;
  if(type in ITEMS){s.add(this.add.ellipse(0,12,34,9,0x65785e,.18));visual=this.add.sprite(0,0,type).setScale(1.8);s.add(visual);s.add(this.add.text(0,24,cost?`${cost} ✦`:'REGALO',{fontFamily:'monospace',fontSize:'9px',color:'#785268'}).setOrigin(.5));}
  else{s.add(this.add.circle(0,0,5,type==='coin'?0xe9bb56:type==='key'?0xd6c18c:0xdf8aa6));s.add(this.add.text(0,0,type==='coin'?'✦':type==='key'?'⚿':'♥',{fontSize:'9px',color:'#fff7e9'}).setOrigin(.5));}
  this.loot.push({s,type,cost,visual,born:this.clock});
 }
 bomb(){if(this.paused||this.pending||this.ended||this.dyingAt||this.bombs<=0)return;this.bombs--;this.bombList.push({s:this.add.sprite(this.player.x,this.player.y,'bomb').setScale(1.9).setDepth(12),t:this.clock+C.bombFuseMs});this.audio.tone(250,.15);this.sync();}
 active(){
  if(this.paused||this.pending||this.ended||this.dyingAt||!this.charge)return;this.charge=false;this.roomsSinceUse=0;
  if(this.activeItem==='head'){for(let i=0;i<4;i++)this.shoot(this.player.x,this.player.y,Math.cos(i*Math.PI/2)*130,Math.sin(i*Math.PI/2)*130,false,4,true);this.say('¡Estrellitas al rescate!',2200);}
  else{this.piles.push(this.add.sprite(this.player.x,this.player.y,'poop').setScale(1.9).setDepth(10));this.effects.burst(this.player.x,this.player.y,0xe3b3bb);this.say('Pila adorable · bloquea enemigos y sus balas.',2600);}
  this.audio.tone(620,.15);this.sync();
 }
 shoot(x:number,y:number,vx:number,vy:number,enemy:boolean,damage=1,home=false){this.shots.push({s:this.add.circle(x,y,home?5:enemy?3.5:3,enemy?0x9968a5:home?0xf1bd58:0xdb729b).setStrokeStyle(1.5,0xfff5e5).setDepth(18),vx,vy,enemy,damage,home,life:home?5000:enemy?6000:C.range/Math.max(1,Math.hypot(vx,vy))*1000});}
 hurt(source:Point=this.player){
  if(this.paused||this.pending||this.clock<this.inv||this.ended||this.dyingAt)return;
  if(this.shield){this.shield=false;this.inv=this.clock+750;this.blockUntil=this.clock+450;this.effects.ring(this.player.x,this.player.y,44,0xffefb2);this.effects.burst(this.player.x,this.player.y,0xf4d58e,13);this.audio.tone(880,.24,.045);this.audio.tone(1320,.3,.025);this.say('Holy Mantle · golpe bloqueado',2000);return;}
  this.hp--;this.inv=this.clock+C.invulnerabilityMs;this.hurtUntil=this.clock+300;this.cameras.main.shake(100,.003);this.effects.burst(this.player.x,this.player.y,0xe28ca8,12);this.audio.tone(150,.18,.06,'triangle');
  // No forced displacement of the player: walking and aiming stay responsive.
  this.facing=facingOf(source.x-this.player.x,source.y-this.player.y,this.facing);this.say('¡Ay! Un instante de protección.',1500);
  if(this.hp<=0){this.hp=0;this.dyingAt=this.clock||1;this.state='dead';this.clearInput();this.effects.ring(this.player.x,this.player.y,38,0xf2b1c9);this.sync();}
 }
 hit(m:Mob,damage:number,dx=m.s.x-this.player.x,dy=m.s.y-this.player.y){
  if(!m.s.active)return;m.hp-=damage;m.hitUntil=this.clock+130;
  const mag=Math.hypot(dx,dy)||1,push=m.type==='boss'?25:105;
  m.kx=dx/mag*push;m.ky=dy/mag*push;
  this.effects.burst(m.s.x,m.s.y,m.type==='cinna'?0x9fcdd6:0xc193be,damage>=9?12:6);this.audio.hit();
  if(m.hp<=0){this.effects.ring(m.s.x,m.s.y,m.type==='boss'?65:25,0xe9b9cf);this.effects.burst(m.s.x,m.s.y,0xd4a4c3,m.type==='boss'?30:14);this.drop('coin',m.s.x,m.s.y);m.s.destroy();this.mobs=this.mobs.filter(v=>v!==m);this.audio.tone(m.type==='boss'?330:660,.22,.045);}
  this.sync();
 }
 update(_t:number,delta:number){
  if(this.paused||this.pending||this.ended)return;const dt=Math.min(delta,40),sec=dt/1000;this.clock+=dt;this.effects.update(dt);
  if(this.dyingAt){const age=this.clock-this.dyingAt;this.player.setTexture(`${this.character}-dead`).setAngle(Math.min(75,age/8)).setScale(C.playerScale*(1+Math.sin(Math.min(1,age/650)*Math.PI)*.08)).setAlpha(Math.max(.15,1-age/850));this.renderFx();if(age>650){this.ended=true;this.finish('dead');}return;}
  const l=this.layout;
  let mx=+this.keys.D.isDown-+this.keys.A.isDown,my=+this.keys.S.isDown-+this.keys.W.isDown;
  if(this.left){const d=Math.hypot(this.left.dx,this.left.dy),strength=Math.max(0,d-C.moveDeadzone)/(32-C.moveDeadzone);mx=d?this.left.dx/d*strength:0;my=d?this.left.dy/d*strength:0;}let length=Math.hypot(mx,my);if(length>1){mx/=length;my/=length;}
  const pos=confine({x:this.player.x+mx*C.speed*sec,y:this.player.y+my*C.speed*sec},l,C.playerRadius);
  const moved=Math.hypot(pos.x-this.player.x,pos.y-this.player.y),moving=moved>.05;
  this.player.setPosition(pos.x,pos.y);this.walkClock=moving?this.walkClock+dt*Math.min(1,Math.hypot(mx,my)):0;
  if(moving&&this.walkClock-this.stepAt>225){this.stepAt=this.walkClock;this.effects.dust(this.player.x,this.player.y+12);this.audio.tone(150+(Math.floor(this.walkClock/225)%2)*18,.035,.006,'triangle');}
  if(!moving)this.stepAt=0;
  let ax=+this.keys.RIGHT.isDown-+this.keys.LEFT.isDown,ay=+this.keys.DOWN.isDown-+this.keys.UP.isDown;
  if(this.right){const aiming=Math.hypot(this.right.dx,this.right.dy)>C.aimDeadzone;ax=aiming?this.right.dx:0;ay=aiming?this.right.dy:0;}else if(this.mouse){const p=this.cameras.main.getWorldPoint(this.input.activePointer.x,this.input.activePointer.y);ax=p.x-this.player.x;ay=p.y-this.player.y;}
  length=Math.hypot(ax,ay);const firing=length>.12;if(firing){ax/=length;ay/=length;this.facing=facingOf(ax,ay,this.facing);
   if(this.brim){this.charging+=dt;if(this.charging>=C.beamChargeMs){this.charging=0;this.recoilUntil=this.clock+160;const reach=rayLength(this.player,ax,ay,l);this.effects.beam={x:this.player.x,y:this.player.y,dx:ax,dy:ay,length:reach,life:240};for(const m of [...this.mobs]){const dx=m.s.x-this.player.x,dy=m.s.y-this.player.y;if(dx*ax+dy*ay>0&&dx*ax+dy*ay<reach+22&&Math.abs(dx*ay-dy*ax)<(m.type==='boss'?30:20))this.hit(m,C.beamDamage,ax,ay);}this.audio.tone(115,.22,.045,'triangle');}}
   else if(this.clock-this.last>C.fireMs){this.last=this.clock;this.recoilUntil=this.clock+100;this.shoot(this.player.x+ax*12,this.player.y+ay*12,ax*C.shotSpeed,ay*C.shotSpeed,false,C.damage);this.effects.ring(this.player.x+ax*14,this.player.y+ay*14,8,0xffe9bb);this.audio.tone(720,.045,.014);}
  }else{this.charging=0;this.facing=facingOf(mx,my,this.facing);}
  const pose=playerPose(moving?this.walkClock:this.clock,moving,this.facing,firing,this.brim&&firing,this.clock<this.hurtUntil,false,this.character);
  this.player.setTexture(pose.texture).setFlipX(pose.flip).setAlpha(this.clock<this.inv?(Math.floor(this.clock/85)%2?.38:1):1);
  const hurt=Math.max(0,(this.hurtUntil-this.clock)/300),recoil=Math.max(0,(this.recoilUntil-this.clock)/100),stride=moving?Math.sin(this.walkClock/115*Math.PI):Math.sin(this.clock/500)*.25;
  this.player.setScale(C.playerScale*(1+hurt*.16+recoil*.06),C.playerScale*(1-hurt*.16-recoil*.05)).setAngle(hurt?Math.sin(hurt*Math.PI*4)*12:stride*2);
  if(hurt)this.player.setTint(0xffb8cb);else this.player.clearTint();
  for(const loot of this.loot)if(loot.visual)loot.visual.y=-3-Math.sin((this.clock-loot.born)/340)*3;
  if(pose.state!==this.state){this.state=pose.state;this.sync();}
  this.updateEnemies(sec);if(this.dyingAt){this.renderFx();return;}this.updateBombs();this.updateShots(dt);this.updateZones();if(this.dyingAt){this.renderFx();return;}this.checkClear();this.collect();if(!this.pending)this.checkDoors();
  if(this.message&&this.clock>this.until){this.message='';this.sync();}this.renderFx();
 }
 updateEnemies(sec:number){
  for(const m of [...this.mobs]){
   const age=this.clock-m.born,dx=this.player.x-m.s.x,dy=this.player.y-m.s.y,d=Math.hypot(dx,dy)||1;
   const baseScale=m.type==='boss'?3.1:1.75,pop=Math.min(1,.5+age/650),squash=this.clock<m.hitUntil?.13:Math.sin(this.clock/140+m.phase)*.025;m.s.setScale(baseScale*pop*(1+squash),baseScale*pop*(1-squash));m.s.setAlpha(Math.min(1,age/350));
   m.s.setTexture(`${m.type==='cinna'?'cinna':'kuromi'}-${Math.floor(this.clock/(m.type==='cinna'?180:140))%4}`).setFlipX(dx<0);
   const warning=this.clock>m.next-600;
   if(this.clock<m.hitUntil)m.s.setTint(0xffe0ec);else if(warning)m.s.setTint(0xeea8ce);else m.s.clearTint();
   if(age<650)continue;
   const speed=m.type==='kuromi'?34:m.type==='boss'?15:19;
   const vx=m.type==='cinna'?Math.cos(this.clock/650+m.phase)*29:dx/d*speed;
   const vy=m.type==='cinna'?Math.sin(this.clock/800+m.phase)*20:dy/d*speed;
   const next=confine({x:m.s.x+(vx+m.kx)*sec,y:m.s.y+(vy+m.ky)*sec},this.layout,m.type==='boss'?29:18);
   if(!this.piles.some(o=>distance(o,next)<24))m.s.setPosition(next.x,next.y);
   m.kx*=Math.exp(-14*sec);m.ky*=Math.exp(-14*sec);
   if(d<(m.type==='boss'?31:21))this.hurt(m.s);
   if(this.clock>m.next){m.next=this.clock+C.enemyAttackMs;m.phase++;
    if(m.type==='boss'&&m.phase%2===0){for(let i=0;i<3;i++){const p=confine({x:this.player.x+(i-1)*76,y:this.player.y},this.layout,C.eclipseRadius+3);this.zones.push({...p,t:this.clock+C.eclipseWarningMs});}this.say('Eclipse · ¡sal de los círculos!',1500);}
    else{const count=m.type==='boss'?10:m.type==='cinna'?3:1;for(let i=0;i<count;i++){const a=m.type==='boss'?i*Math.PI*2/count:Math.atan2(dy,dx)+(i-(count-1)/2)*.3,speed=C.enemyBulletSpeed*(m.type==='kuromi'?1.2:1);this.shoot(m.s.x,m.s.y,Math.cos(a)*speed,Math.sin(a)*speed,true);}this.effects.ring(m.s.x,m.s.y,20,0xd9a5cd);}
   }
  }
 }
 updateBombs(){for(const b of [...this.bombList]){
  const left=b.t-this.clock;b.s.setAlpha(Math.floor(this.clock/(left<450?65:130))%2?.55:1);
  if(left<=0){this.effects.ring(b.s.x,b.s.y,C.bombRadius,0xf3b0c7);this.effects.burst(b.s.x,b.s.y,0xe998b9,28);for(const m of [...this.mobs])if(distance(m.s,b.s)<C.bombRadius)this.hit(m,C.bombDamage,m.s.x-b.s.x,m.s.y-b.s.y);b.s.destroy();this.bombList=this.bombList.filter(v=>v!==b);this.audio.tone(85,.3,.1,'triangle');}
 }}
 updateShots(dt:number){for(const s of [...this.shots]){
  s.life-=dt;if(s.home&&this.mobs.length){const m=this.mobs.reduce((a,b)=>distance(a.s,s.s)<distance(b.s,s.s)?a:b);const a=Math.atan2(m.s.y-s.s.y,m.s.x-s.s.x);s.vx=Math.cos(a)*180;s.vy=Math.sin(a)*180;}
  s.s.x+=s.vx*dt/1000;s.s.y+=s.vy*dt/1000;const l=this.layout;
  let remove=s.life<0||s.s.x<l.left||s.s.x>l.right||s.s.y<l.top||s.s.y>l.bottom;
  if(s.enemy){if(distance(s.s,this.player)<C.playerRadius+3){this.hurt(s.s);remove=true;}if(this.piles.some(o=>distance(s.s,o)<19))remove=true;}
  else for(const m of [...this.mobs])if(distance(s.s,m.s)<(m.type==='boss'?27:16)){this.hit(m,s.damage,s.vx,s.vy);remove=true;break;}
  if(remove){const p=confine(s.s,l);this.effects.burst(p.x,p.y,s.enemy?0xc59abb:0xf1b8cf,3);s.s.destroy();this.shots=this.shots.filter(v=>v!==s);}
 }}
 collect(){
  if(this.pending||this.paused||this.dyingAt)return;
  for(const loot of this.loot){
   const d=distance(loot.s,this.player);if(d>42)this.declined.delete(loot);
   if(d>=21||this.declined.has(loot)||(loot.type==='heart'&&this.hp===C.hp))continue;
   this.pending=loot;this.clearInput();this.audio.tone(660,.1,.025);this.sync();return;
  }
 }
 chooseItem(accept:boolean){
  const loot=this.pending;if(!loot||this.paused||this.ended||this.dyingAt)return;
  if(accept&&loot.cost>this.coins){this.sync();return;}
  this.pending=undefined;this.clearInput();
  if(!accept){this.declined.add(loot);this.sync();return;}
  this.coins-=loot.cost;
  if(loot.type==='coin')this.coins++;else if(loot.type==='key')this.keyCount++;else if(loot.type==='heart')this.hp=Math.min(C.hp,this.hp+2);
  else{if(loot.type==='brim'){this.brim=true;this.cleared.add(3);}if(loot.type==='mantle'){this.mantle=true;this.shield=true;}if(loot.type==='head'){this.activeItem='head';this.charge=true;}}
  this.say(`${PICKUPS[loot.type].name} · ¡Es tuyo!`,2400);this.effects.ring(loot.s.x,loot.s.y,32,0xf0c969);this.effects.burst(loot.s.x,loot.s.y,0xf3ce87,16);loot.s.destroy();this.loot=this.loot.filter(v=>v!==loot);this.declined.delete(loot);this.audio.tone(880,.15,.035);this.audio.tone(1108,.23,.02);this.sync();
 }
 checkClear(){const kind=ROOMS[this.room].kind;if((kind==='fight'||kind==='boss')&&!this.mobs.length&&!this.cleared.has(this.room)){
  this.cleared.add(this.room);this.roomsSinceUse++;this.charge=this.roomsSinceUse>=C.activeRooms;this.shots.forEach(s=>s.s.destroy());this.shots=[];this.zones=[];
  const l=this.layout;this.drop('heart',l.cx,l.cy+32);
  if(kind==='fight'){this.drop('coin',l.cx-30,l.cy);this.drop('key',l.cx+30,l.cy);this.say('¡Sala limpia! Activo recargado.');}else this.say('¡Lo lograste! Pisa la escotilla dorada para bajar.',6500);this.sync();
 }}
 updateZones(){for(const z of [...this.zones])if(this.clock>=z.t){if(distance(this.player,z)<C.eclipseRadius+C.playerRadius/2)this.hurt(z);this.effects.ring(z.x,z.y,C.eclipseRadius,0xbf86b3);this.effects.burst(z.x,z.y,0xc395bb,12);this.zones=this.zones.filter(v=>v!==z);}}
 checkDoors(){
  const l=this.layout;if(ROOMS[this.room].kind==='boss'&&this.cleared.has(this.room)){
   const d=distance(this.player,{x:l.cx,y:l.cy});if(d>36)this.hatchReady=true;
   if(this.hatchReady&&d<18){this.ended=true;this.clearInput();this.audio.tone(1046,.4);this.finish('win');return;}
  }
  if(this.mobs.length||this.clock<this.gate)return;
  for(const dir of Object.keys(ROOMS[this.room].links) as Direction[]){if(distance(this.player,doorPoint(dir,l,C.playerRadius))>17)continue;
   const target=(ROOMS[this.room].links as Record<string,number>)[dir];
   if(target===3&&!this.unlocked){if(!this.keyCount){this.say('El tesoro necesita una llave.');return;}this.keyCount--;this.unlocked=true;}
   this.enter(target,({left:'right',right:'left',up:'down',down:'up'} as Record<Direction,Direction>)[dir]);break;
  }
 }
 renderFx(){
  const g=this.fx,l=this.layout;g.clear();
  // Quiet drifting pollen and a brief room-entry curtain; neither affects collisions.
  for(let i=0;i<11;i++){const x=l.left+((i*67+this.clock*.009)%(l.right-l.left)),y=l.top+((i*43+Math.sin(this.clock/1400+i)*8)%(l.bottom-l.top));g.fillStyle(0xfff9da,.3+Math.sin(this.clock/600+i)*.15);g.fillRect(x,y,2,2);}
  for(const dir of Object.keys(ROOMS[this.room].links) as Direction[]){const target=(ROOMS[this.room].links as Record<string,number>)[dir];drawDoor(g,dir,l,!!this.mobs.length,target===3&&!this.unlocked);}
  g.fillStyle(0x53684f,.14);g.fillEllipse(this.player.x,this.player.y+10,24,8);
  for(const m of this.mobs){g.fillStyle(0x53684f,.12);g.fillEllipse(m.s.x,m.s.y+12,m.type==='boss'?45:25,9);
   if(this.clock>m.next-600){g.lineStyle(1.5,0xc77da7,.8);g.strokeCircle(m.s.x,m.s.y,m.type==='boss'?33:21);}
  }
  for(const b of this.bombList){g.lineStyle(1,0xe4a4bc,.5);g.strokeCircle(b.s.x,b.s.y,12+(1-(b.t-this.clock)/C.bombFuseMs)*9);}
  for(const z of this.zones){const progress=1-(z.t-this.clock)/C.eclipseWarningMs;g.fillStyle(0xc083b0,.1+progress*.15);g.fillCircle(z.x,z.y,C.eclipseRadius);g.lineStyle(2,0xb779a9,.8);g.strokeCircle(z.x,z.y,C.eclipseRadius);g.strokeCircle(z.x,z.y,C.eclipseRadius*Math.max(.05,1-progress));}
  if(this.shield||this.clock<this.blockUntil){g.lineStyle(this.shield?1.5:3,0xffefbc,.85);g.strokeCircle(this.player.x,this.player.y,this.shield?22:24+(1-(this.blockUntil-this.clock)/450)*15);}
  if(this.charging){g.lineStyle(2,0xd977a5,.9);g.strokeCircle(this.player.x,this.player.y,17+this.charging/C.beamChargeMs*5);g.fillStyle(0xfff2dc);g.fillCircle(this.player.x,this.player.y-23,2+this.charging/C.beamChargeMs*3);}
  if(ROOMS[this.room].kind==='boss'&&this.cleared.has(this.room)){g.fillStyle(0x795a72);g.fillRoundedRect(l.cx-18,l.cy-16,36,32,3);g.lineStyle(3,0xe8bb68);g.strokeRoundedRect(l.cx-18,l.cy-16,36,32,3);for(let y=-9;y<=10;y+=8)g.lineBetween(l.cx-10,l.cy+y,l.cx+10,l.cy+y);}
  this.effects.draw(g);
  const curtain=1-(this.clock-this.roomEntered)/320;if(curtain>0){g.fillStyle(0xfff0df,curtain*.65);g.fillRect(0,0,l.width,l.height);}
  for(const s of [this.left,this.right])if(s){const p=this.cameras.main.getWorldPoint(s.x,s.y),z=l.zoom,d=Math.max(1,Math.hypot(s.dx,s.dy)/30);g.lineStyle(1.5/z,0x825d78,.2);g.strokeCircle(p.x,p.y,34/z);g.fillStyle(0x825d78,.12);g.fillCircle(p.x+s.dx/d/z,p.y+s.dy/d/z,13/z);}
 }
}
