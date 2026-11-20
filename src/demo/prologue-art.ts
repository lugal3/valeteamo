import type Phaser from 'phaser';

// Luis y Louis son personas DISTINTAS en el rescate: el novio tiene pelo oscuro,
// gafas y tatuaje en el brazo izquierdo; Louis lleva otro sprite (Corazones).
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
 b(13+gait,59,9,2,'#d7d5dc');b(26-gait,59,9,2,'#d7d5dc');
 b(14+gait,55,7,2,p.pantsLight);b(27-gait,55,7,2,p.pantsLight);
 // Broad but short upper body + slim jeans = unmistakable chibi proportions.
 const bodyY=35+bob;
 b(13,bodyY,23,19,INK);
 b(15,bodyY+2,19,16,p.top);
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
 b(11,hy+4,27,29,INK);
 b(9,hy+9,31,21,INK);
 b(13,hy+2,23,32,INK);
 b(11,hy+12,29,17,p.skinShade);
 b(12,hy+10,27,19,p.skin);
 b(14,hy+7,23,24,p.skin);
 b(15,hy+13,20,14,p.skinLight);
 b(16,hy+29,17,3,p.skinShade);
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
 b(12,hy+4,28,10,INK);
 b(14,hy+1,23,10,p.hair);
 b(11,hy+9,30,6,p.hair);
 b(11,hy+14,7,8,p.hair);
 b(36,hy+12,5,8,p.hair);
 b(16,hy,19,5,p.hair);
 b(17,hy+2,13,2,p.hairLight);
 b(14,hy+7,9,3,p.hairLight);
 b(23,hy+9,13,4,p.hair);
 b(19,hy+12,11,5,p.hair);
 b(17,hy+12,4,8,p.hair);b(25,hy+12,4,7,p.hair);
 b(32,hy+11,4,8,p.hair);b(28,hy+14,3,2,p.hairLight);
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

// Louis keeps his established distinct identity/wardrobe; his walking and
// combat sprites are still produced by buildChibi + installReferenceCharacter.
// Historical Louis art is preserved unchanged; only Luis is redesigned.
function paintLouisPortrait():HTMLCanvasElement{
 const person:ProloguePerson='louis';
 const DARK='#30243f',SKIN='#f5c9a9',SHADOW='#c38b82',HIGHLIGHT='#ffead7';
 const canvas=document.createElement('canvas');canvas.width=48;canvas.height=64;
 const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 const block=(x:number,y:number,w:number,h:number,color:string)=>{
  c.fillStyle=color;c.fillRect(x,y,w,h);
 };
 const louis=person==='louis',hair=louis?'#4b302b':'#171b2d',
  hairLight=louis?'#795044':'#303746';
 // shoes and trousers
 block(12,57,12,4,DARK);block(26,57,12,4,DARK);
 block(13,45,10,13,louis?'#b6435c':'#303954');
 block(26,45,10,13,louis?'#b6435c':'#303954');
 block(13,51,10,2,louis?'#8b3348':'#273149');
 block(26,51,10,2,louis?'#8b3348':'#273149');
 block(12,59,12,3,'#221e34');block(25,59,13,3,'#221e34');
 // upper arms; from viewer right is the character's anatomical LEFT
 block(8,34,7,14,DARK);block(9,35,6,13,SKIN);
 block(35,34,7,14,DARK);block(35,35,6,13,SKIN);
 block(9,43,6,4,SHADOW);block(35,43,6,4,SHADOW);
 // anatomical LEFT arm tattoo of Luis, clearly visible on viewer's right
 if(!louis){
  block(36,37,4,2,'#333446');block(35,40,5,2,'#45405a');
  block(37,43,3,3,'#333446');block(35,46,5,1,'#32344c');
  block(38,35,2,3,'#333446');
 }
 block(13,32,23,17,DARK);
 block(15,34,19,13,louis?'#fff7f1':'#161d32');
 if(louis){
  for(let y=36;y<47;y+=4)block(15,y,19,2,'#455b8a');
  block(20,33,11,2,'#faf8f6');
 }else{
  block(18,34,12,4,'#1b2539'); // sleeveless black tank
  block(24,37,2,7,'#374460');
 }
 block(21,29,8,7,DARK);block(22,28,6,7,SKIN);
 // large chibi face
 block(10,9,30,25,DARK);
 block(12,10,26,23,SKIN);
 block(13,23,25,7,SHADOW);
 block(13,10,25,18,SKIN);
 block(16,27,4,2,'#eb9b9f');block(32,27,4,2,'#eb9b9f');
 // ears
 block(8,20,4,7,DARK);block(9,21,3,5,SKIN);
 block(39,20,4,7,DARK);block(39,21,3,5,SKIN);
 // eye whites + distinctive Louis blue irises, Luis warm brown
 block(16,20,8,5,'#fff5ea');block(29,20,7,5,'#fff5ea');
 block(19,21,3,4,louis?'#529ac0':'#5d453e');
 block(31,21,3,4,louis?'#529ac0':'#5d453e');
 block(20,22,1,2,'#1f233b');block(32,22,1,2,'#1f233b');
 block(18,21,1,1,HIGHLIGHT);block(31,21,1,1,HIGHLIGHT);
 // eyebrows
 block(16,18,9,2,hair);block(29,18,8,2,hair);
 // nose, smile
 block(26,25,2,2,SHADOW);
 block(22,29,8,1,'#9d5664');block(24,30,5,1,'#c47a82');
 // hair, shadowed swept bangs
 block(10,7,30,10,DARK);block(13,4,25,8,hair);
 block(11,10,30,4,hair);block(11,14,7,6,hair);
 block(34,12,6,7,hair);
 if(louis){
  block(9,11,11,5,hairLight);block(12,6,20,5,hairLight);
  block(18,8,19,4,hair);block(28,10,11,5,hairLight);
  block(15,14,16,4,hair); // iconic diagonal fringe
  block(24,16,9,3,hairLight);
  block(11,8,5,5,hairLight);block(33,5,4,7,hair);
 }else{
  block(12,6,24,7,hairLight);block(10,13,8,5,hair);
  block(13,8,25,7,hair);block(17,13,11,3,hairLight);
  // rectangular black spectacles; centers retain eye pupils
  block(14,19,11,2,'#171c2b');block(29,19,9,2,'#171c2b');
  block(14,19,2,8,'#171c2b');block(23,19,2,8,'#171c2b');
  block(29,19,2,8,'#171c2b');block(36,19,2,8,'#171c2b');
  block(25,21,4,2,'#171c2b');block(11,21,3,2,'#171c2b');
  block(38,21,3,2,'#171c2b');
  block(17,20,2,1,'#dde8ef');block(32,20,2,1,'#dde8ef');
 }
 return canvas;
}
export function paintProloguePerson(person:ProloguePerson):HTMLCanvasElement{
 return person==='luis'?paintLuisChibi('down','idle',0):paintLouisPortrait();
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
 return portraits;
}
