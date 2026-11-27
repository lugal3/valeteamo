import type Phaser from 'phaser';

// Luis y Louis son personas DISTINTAS en el rescate: el novio tiene pelo oscuro,
// gafas y tatuaje en el brazo izquierdo; Louis tiene su propio sprite narrativo.
// Luis sigue la referencia de la pareja: flequillo negro, gafas y camiseta verde.
// Este arte es pixel art 48x64, reutilizable en todas las escenas,
// sin imágenes ajenas, red ni spritesheets grandes en memoria.
export type ProloguePerson='luis'|'louis';
export type LuisFacing='down'|'right'|'up';
export type LuisPose='idle'|'walk'|'talk'|'wave';
export const LUIS_FACINGS=['down','right','up'] as const;
export const LUIS_FRAME_COUNTS={idle:4,walk:4,talk:3,wave:4} as const;
export const LUIS_SPRITE_WIDTH=48,LUIS_SPRITE_HEIGHT=64;

type Palette={
 ink:string;skin:string;skinLight:string;skinShade:string;hair:string;hairLight:string;
 top:string;topShade:string;pants:string;pantsLight:string;glass:string;eye:string;
};
const LUIS:Palette={
 ink:'#25252d',skin:'#e9b48f',skinLight:'#fbd4af',skinShade:'#ca8f76',
 hair:'#202126',hairLight:'#37383d',top:'#659c48',topShade:'#416d35',
 pants:'#262b31',pantsLight:'#3b4146',glass:'#22253a',eye:'#342c2c'
};
const INK=LUIS.ink;
export function luisTextureKey(facing:LuisFacing,pose:LuisPose,frame:number){
 const count=LUIS_FRAME_COUNTS[pose];
 const number=((Math.floor(frame)%count)+count)%count;
 return `story-person-luis-${facing}-${pose}-${number}`;
}
export function luisAnimationFrame(clock:number,pose:LuisPose,reducedMotion=false):number{
 if(reducedMotion)return 0;
 const time=Math.max(0,clock);
 if(pose==='idle'){
  const cycle=time%4300;
  // Idle: breathing and a deliberate double blink every ~4.3 seconds.
  return cycle>=4090?3:cycle>=2200?2:cycle>=1120?1:0;
 }
 return Math.floor(time/(pose==='walk'?135:pose==='talk'?220:180))%LUIS_FRAME_COUNTS[pose];
}

// All poses share one consistent foot baseline and silhouette. The player
// stays in the existing ISO/Phaser scene; phase 3 can use the walking and
// waving frames when staging Luis's actual entrance and departure.
export function paintLuisChibi(
 facing:LuisFacing='down',pose:LuisPose='idle',frame=0
):HTMLCanvasElement{
 const canvas=document.createElement('canvas');
 canvas.width=LUIS_SPRITE_WIDTH;canvas.height=LUIS_SPRITE_HEIGHT;
 const c=canvas.getContext('2d')!;
 c.imageSmoothingEnabled=false;
 const p=LUIS,side=facing==='right',back=facing==='up';
 const frameIndex=((Math.floor(frame)%LUIS_FRAME_COUNTS[pose])+LUIS_FRAME_COUNTS[pose])%LUIS_FRAME_COUNTS[pose];
 const walk=pose==='walk',talk=pose==='talk',wave=pose==='wave';
 const gait=walk?[0,3,0,-3][frameIndex]:0;
 const bob=walk?[0,-1,0,-2][frameIndex]:talk?[0,-1,1][frameIndex]:
  pose==='idle'&&frameIndex===2?-1:0;
 const blink=pose==='idle'&&frameIndex===3;
 const mouthOpen=talk&&frameIndex!==0;
 const armSwing=walk?[1,-2,0,2][frameIndex]:wave?[0,-2,2,1][frameIndex]:0;
 const waveUp=wave&&(frameIndex%3!==0);
 const b=(x:number,y:number,w:number,h:number,color:string)=>{
  c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);
 };
 // Feet: two shoes always grounded at y=61, including moving frames.
 b(12+gait,53,11,8,INK);b(25-gait,53,11,8,INK);
 b(14+gait,52,8,6,p.pants);b(27-gait,52,8,6,p.pants);
 b(12+gait,58,11,4,'#312d42');b(25-gait,58,11,4,'#312d42');
 b(13+gait,59,9,2,'#55505a');b(26-gait,59,9,2,'#55505a');
 b(14+gait,55,7,2,p.pantsLight);b(27-gait,55,7,2,p.pantsLight);
 // Broad but short upper body + slim jeans = unmistakable chibi proportions.
 const bodyY=35+bob;
 b(14,bodyY,21,19,INK);
 b(16,bodyY+2,17,16,p.top);
 b(15,bodyY+11,19,5,p.topShade);
 b(16,bodyY+17,18,2,'#222a3d');
 if(pose==='idle'&&frameIndex===1)b(16,bodyY+5,2,4,'#7dac58');
 b(20,bodyY,8,3,p.skinShade);
 b(21,bodyY-2,6,5,p.skin);
 // Plain green short-sleeved shirt, matching Luis on the reference card.
 b(9,bodyY+1,8,7,INK);b(10,bodyY+2,6,5,p.top);
 b(33,bodyY+1,8,7,INK);b(34,bodyY+2,6,5,p.top);
 b(17,bodyY+3,2,11,p.top);
 if(back)b(19,bodyY+3,12,2,p.topShade);
 else{b(20,bodyY+2,9,2,p.topShade);b(22,bodyY+2,5,1,p.skin);}
 // Anatomical left is viewer RIGHT when facing front; on the back it swaps.
 const tattooOnRight=!back,armLeftX=7+armSwing,armRightX=36-armSwing;
 const armY=bodyY+7;
 for(const [x,inkArm] of [[armLeftX,!tattooOnRight],[armRightX,tattooOnRight]] as const){
  const raised=waveUp&&x===armRightX&&!back;
  const ay=raised?bodyY-16:armY;
  const hh=raised?20:11;
  b(x-1,ay-1,9,hh+3,INK);
  b(x,ay,7,hh+1,p.skin);
  b(x+1,ay+1,3,Math.max(3,hh-7),p.skinLight);
  b(x,ay+hh-4,7,4,p.skinShade);
  if(raised){b(x-1,ay-6,9,7,INK);b(x,ay-5,7,5,p.skinLight);}
  if(inkArm){
   // Pixel-ink rose and vine, not a generic dark rectangle tattoo.
   const mid=ay+(raised?6:2);
   b(x+2,mid,3,2,'#46465d');b(x+1,mid+2,4,2,'#5a5364');
   b(x+3,mid+4,2,3,'#4d4b60');
   if(raised){b(x+1,mid+8,3,2,'#4d4b60');b(x+5,mid+10,2,3,'#5d5066');}

  }
 }
 // Hair/face have a much bigger chibi head, rounded pixel silhouette and
 // restrained shading. No scaling tricks that would distort other sprites.
 const hy=5+bob;
 // Broad, rounded head and soft cheeks from the card.
 b(6,hy+9,37,19,INK);
 b(8,hy+5,34,26,INK);
 b(11,hy+2,28,31,INK);
 b(15,hy+1,20,33,INK);
 b(8,hy+15,33,13,p.skinShade);
 b(10,hy+13,30,17,p.skin);
 b(13,hy+27,25,5,p.skin);
 b(14,hy+8,23,24,p.skin);
 b(13,hy+17,25,11,p.skinLight);
 b(16,hy+28,18,3,p.skinLight);
 b(18,hy+31,14,1,p.skinShade);
 // Visible ears and small piercings distinguish his side/front views.
 if(!back){
  b(9,hy+17,5,9,INK);b(10,hy+18,4,7,p.skin);
  b(38,hy+17,4,9,INK);b(38,hy+18,3,7,p.skin);
  b(40,hy+24,2,2,'#d2a9c6');
 }else{
  b(10,hy+9,30,23,p.hair);
  b(13,hy+28,24,5,p.hairLight);
 }
 if(!back){
  // Eyes and two real transparent-ish rectangular lenses with bridge and shine.
  if(side){
   b(29,hy+17,7,6,'#fff6e9');
   b(33,hy+18,2,4,blink?p.skinLight:p.eye);
   b(34,hy+18,1,2,blink?p.skinLight:'#201f34');
   if(blink)b(30,hy+20,6,2,INK);
   b(27,hy+15,11,2,p.glass);
   b(27,hy+16,2,9,p.glass);b(36,hy+16,2,9,p.glass);
   b(29,hy+25,8,2,p.glass);b(37,hy+18,4,2,p.glass);
   b(29,hy+17,2,1,'#faf0eb');
   b(37,hy+27,3,2,p.skinShade);
   b(35,hy+29,4,mouthOpen?3:1,mouthOpen?'#854957':'#955c64');
  }else{
   b(15,hy+18,9,7,'#fff4e5');
   b(28,hy+18,9,7,'#fff4e5');
   if(blink){
    b(17,hy+21,6,2,p.eye);b(30,hy+21,6,2,p.eye);
   }else{
    b(18,hy+18,5,7,p.eye);b(30,hy+18,5,7,p.eye);
    b(20,hy+19,1,2,'#241f35');b(32,hy+19,1,2,'#241f35');
    b(18,hy+19,2,1,'#fffefd');b(30,hy+19,2,1,'#fffefd');
   }
   // Warm blush, tiny nose, soft expression, clear spectacles.
   b(13,hy+25,6,2,'#efa0a0');b(33,hy+25,5,2,'#efa0a0');
   b(24,hy+25,2,2,p.skinShade);
   if(mouthOpen){b(22,hy+28,7,frameIndex===2?3:4,'#82495a');b(24,hy+30,3,1,'#edabb0');}
   else{b(22,hy+28,7,1,'#925c62');b(24,hy+29,4,1,'#d18886');}
   b(16,hy+17,8,2,p.glass);b(29,hy+17,7,2,p.glass);
   b(14,hy+18,2,9,p.glass);b(24,hy+18,2,9,p.glass);
   b(27,hy+18,2,9,p.glass);b(36,hy+18,2,9,p.glass);
   b(16,hy+26,8,2,p.glass);b(29,hy+26,7,2,p.glass);
   b(15,hy+25,2,2,p.glass);b(35,hy+25,2,2,p.glass);
   b(25,hy+20,3,2,p.glass);
   b(12,hy+20,2,2,p.glass);b(38,hy+20,3,2,p.glass);
   b(17,hy+19,1,1,'#fff7ed');b(30,hy+19,1,1,'#fff7ed');
  }
 }
 // Rounded black hair with long, separated bangs from the reference;
 // while the shine and fringe read correctly at 48px resolution.
 b(12,hy+2,28,11,INK);
 b(8,hy+5,35,11,p.hair);
 b(7,hy+9,36,10,p.hair);
 b(6,hy+13,4,8,p.hair);
 b(40,hy+12,3,10,p.hair);
 b(10,hy+15,7,8,p.hair);
 b(36,hy+14,5,9,p.hair);
 b(16,hy,19,5,p.hair);
 b(18,hy+2,10,2,p.hairLight);
 b(12,hy+7,7,3,p.hairLight);
 b(25,hy+5,8,2,p.hairLight);
 b(17,hy+13,5,7,p.hair);b(24,hy+12,5,8,p.hair);
 b(31,hy+12,5,8,p.hair);
 b(19,hy+17,2,4,p.hair);b(26,hy+18,2,3,p.hair);
 b(12,hy+15,4,6,'#222434');
 if(side){
  b(11,hy+9,20,5,p.hair);
  b(20,hy+13,12,4,p.hairLight);
  b(10,hy+16,5,9,p.hair);
 }else if(back){
  b(12,hy+16,27,13,p.hair);
  b(14,hy+23,22,6,p.hairLight);
  b(20,hy+27,10,4,p.hair);
  b(13,hy+11,5,17,p.hairLight);
 }
 // Static wave poses are reusable by the phase-3 entrance/exit controller.
 return canvas;
}

// Original pixel interpretation of Louis Tomlinson's 2012–13 look:
// diagonal brown fringe, blue eyes, Breton stripes and red trousers.
// This is a PROLOGUE-only texture set; the selectable classic Louis and
// every 3D model remain untouched. Same 32x40 size/foot anchor as the NPC.
export function paintStoryLouis(facing:LuisFacing='down',frame=0):HTMLCanvasElement{
 const canvas=document.createElement('canvas');canvas.width=32;canvas.height=40;
 const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 const ink='#302b34',hair='#4b302b',shade='#38272a',highlight='#89634a',
  skin='#e7ae8d',light='#f9d1af',shadow='#c88d75',blue='#5d91b3',
  shirt='#f5e9db',stripe='#344965',pants='#a54551';
 const back=facing==='up',side=facing==='right',walk=frame>0&&frame<5;
 const bob=walk?[0,-1,0,-1][frame-1]:0,step=walk?[1,2,-1,-2][frame-1]:0;
 const b=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 // Feet stay planted on the same baseline, with alternating stride.
 b(8+step,32,7,7,ink);b(17-step,32,7,7,ink);
 b(9+step,32,5,5,pants);b(18-step,32,5,5,pants);
 b(9+step,36,5,1,'#783744');b(18-step,36,5,1,'#783744');
 b(8+step,38,7,1,'#e6d9cc');b(17-step,38,7,1,'#e6d9cc');
 const y=23+bob;
 b(8,y,16,11,ink);b(9,y+1,14,9,shirt);
 for(const dy of [3,6,9])b(9,y+dy,14,1,stripe);
 b(13,y-2,6,4,shadow);b(14,y-2,4,3,skin);
 const swing=walk?[0,2,0,-2][frame-1]:0;
 b(5,y+1+swing,5,8,ink);b(22,y+1-swing,5,8,ink);
 b(6,y+2+swing,3,3,stripe);b(23,y+2-swing,3,3,stripe);
 b(6,y+5+swing,3,4,skin);b(23,y+5-swing,3,4,skin);
 b(23,y+7-swing,2,1,'#635562'); // small bracelet
 const h=2+bob;
 // Rounded stepped head contour, subtle cheek/jaw planes.
 b(8,h+2,16,20,ink);b(5,h+6,22,13,ink);b(7,h+19,18,3,ink);
 b(7,h+7,18,12,skin);b(9,h+17,14,4,light);
 b(8,h+10,16,8,light);b(11,h+20,10,1,shadow);
 b(4,h+12,4,5,ink);b(5,h+13,3,3,skin);
 b(24,h+12,4,5,ink);b(24,h+13,3,3,skin);
 if(back){
  b(6,h+5,20,14,hair);b(8,h+18,16,3,shade);b(10,h+7,10,2,highlight);
  b(8,h+10,3,7,'#60412f');b(19,h+9,3,7,'#60412f');
 }else if(side){
  b(22,h+13,6,4,skin);b(24,h+15,4,2,light);
  b(17,h+10,6,1,hair);b(17,h+12,6,4,'#fff0e3');
  b(20,h+12,3,4,frame===5?ink:blue);b(21,h+12,1,1,'#fff7e6');
  if(frame===5)b(17,h+13,6,2,ink);
  b(22,h+18,4,frame===7?3:1,'#9b5960');b(13,h+18,3,1,shadow);
 }else{
  // Narrow friendly blue eyes, asymmetric eyebrows and crooked smile.
  b(8,h+10,6,1,hair);b(18,h+9,6,1,hair);
  for(const x of [9,18]){
   b(x,h+12,6,4,'#fff0e3');b(x+2,h+12,3,4,blue);
   b(x+3,h+13,1,2,ink);b(x+2,h+12,1,1,'#ffffff');
   if(frame===5)b(x,h+13,6,2,ink);
  }
  b(15,h+15,2,2,shadow);b(8,h+17,3,1,'#e5a48f');b(22,h+17,3,1,'#e5a48f');
  b(12,h+18,8,1,'#9b5960');b(14,h+18,5,1,'#fff2df');b(15,h+19,4,1,'#b66d65');
  if(frame===7){b(14,h+18,5,3,'#824b58');b(15,h+20,3,1,'#d88f95');}
 }
 // The sweeping fringe descends on the viewer's left, not a bowl cut.
 b(8,h+1,16,4,shade);b(6,h+3,20,5,hair);b(5,h+6,22,4,hair);
 b(11,h,11,3,hair);b(17,h-1,6,3,hair);
 b(9,h+2,10,2,highlight);b(7,h+5,11,2,'#704b37');
 b(6,h+8,11,3,hair);b(6,h+10,7,3,shade);b(7,h+12,3,2,hair);
 b(13,h+7,7,2,hair);b(18,h+5,7,2,hair);
 b(24,h+7,3,5,shade);
 if(side){b(6,h+9,12,4,hair);b(7,h+13,5,5,shade);b(12,h+9,8,2,'#704b37');}
 if(back){b(7,h+8,18,11,hair);b(8,h+10,4,7,highlight);b(16,h+12,6,5,'#60412f');}
 return canvas;
}
export function paintProloguePerson(person:ProloguePerson):HTMLCanvasElement{
 return person==='luis'?paintLuisChibi('down','idle',0):paintStoryLouis();
}
export function installProloguePeople(scene:Phaser.Scene){
 const portraits:Record<ProloguePerson,string>={luis:'',louis:''};
 for(const id of ['luis','louis'] as const){
  const key='story-person-'+id;
  const canvas=paintProloguePerson(id);
  if(scene.textures.exists(key))scene.textures.remove(key);
  scene.textures.addCanvas(key,canvas);
  portraits[id]=canvas.toDataURL('image/png');
 }
 for(const facing of LUIS_FACINGS){
  for(const pose of ['idle','walk','talk','wave'] as LuisPose[]){
   for(let frame=0;frame<LUIS_FRAME_COUNTS[pose];frame++){
    const key=luisTextureKey(facing,pose,frame);
    if(scene.textures.exists(key))scene.textures.remove(key);
    scene.textures.addCanvas(key,paintLuisChibi(facing,pose,frame));
   }
  }
 }
 // This installer is invoked exclusively under if(this.story) in IsoAdventure.
 // Replace only this scene's Louis NPC frames; preserve the classic asset files.
 for(const facing of LUIS_FACINGS)for(let frame=0;frame<8;frame++){
  const key=`chibi-louis-${facing}-${frame}`;
  if(scene.textures.exists(key))scene.textures.remove(key);
  scene.textures.addCanvas(key,paintStoryLouis(facing,frame));
 }
 return portraits;
}
