import type Phaser from 'phaser';

export const CHURU_TEXTURE='rescue-churu';
export const greyCatTexture=(pose:'idle'|'eat'|'walk',frame:number)=>`rescue-grey-cat-${pose}-${frame%2}`;
export const valeTexture=(walking:boolean,frame:number)=>`rescue-vale-${walking?'walk':'idle'}-${frame%4}`;

export function installRescueIntroArt(scene:Phaser.Scene){
 type Block=(x:number,y:number,w:number,h:number,color:string)=>void;
 const sprite=(key:string,width:number,height:number,paint:(b:Block)=>void)=>{
  if(scene.textures.exists(key))return;
  const texture=scene.textures.createCanvas(key,width,height);
  if(!texture)return;
  const ctx=texture.getContext();
  paint((x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);});
  texture.refresh();
 };

 sprite(CHURU_TEXTURE,28,38,b=>{
  const outline='#743552',wrapper='#d75d8a';
  b(6,3,16,31,outline);b(7,5,14,26,wrapper);b(8,6,2,20,'#fbaac1');
  b(7,5,14,3,'#ffdbe0');b(7,28,14,4,'#f6a7bd');
  b(8,11,12,12,'#fff0cb');b(10,15,8,5,'#f69786');b(13,13,2,3,'#f69786');
  b(11,16,2,2,'#78465d');b(16,16,2,2,'#78465d');b(11,25,8,2,'#ffdbe0');
 });

 for(const pose of ['idle','eat','walk'] as const)for(const frame of [0,1]){
  sprite(greyCatTexture(pose,frame),42,31,b=>{
   const ink='#3e3b53',fur='#9295aa',shade='#666982',bright='#c3c6d6';
   const nod=pose==='eat'?3+frame:0,step=pose==='walk'?frame*2:0;
   b(31,10-frame*2,5,12,ink);b(35,7-frame*2,5,8,ink);b(35,9-frame*2,3,6,shade);
   b(15,12,17,13,ink);b(17,11,13,13,fur);b(20,15,11,8,shade);b(20,12,8,4,bright);
   b(12+step,21,6,7,ink);b(25-step,21,7,7,ink);b(13+step,23,4,4,bright);b(26-step,23,5,4,fur);
   b(5,9+nod,16,15,ink);b(7,10+nod,12,12,fur);b(7,17+nod,11,5,bright);
   b(6,5+nod,4,7,ink);b(16,5+nod,4,7,ink);b(7,7+nod,2,4,'#daa9ba');b(17,7+nod,2,4,'#daa9ba');
   b(8,14+nod,2,pose==='eat'?1:3,ink);b(15,14+nod,2,pose==='eat'?1:3,ink);
   b(11,18+nod,3,2,'#9d617a');b(4,19+nod,4,1,bright);
   if(pose==='eat'){b(0,26,11,3,'#c55379');b(1,25,7,2,'#ffd2db');}
  });
 }

 // Vale matches the reference card: long black hair, red top and dark trousers.
 // Keep the same texture keys, four-frame timing and foot anchor for the couple.
 for(const walking of [false,true])for(let frame=0;frame<4;frame++){
  sprite(valeTexture(walking,frame),43,58,b=>{
   const ink='#25252d',hair='#202126',shine='#37383d',skin='#e9b48f',light='#fbd4af',top='#b93d51';
   const bob=frame===1||frame===3?1:0,step=walking?[2,0,-2,0][frame]:0;
   // Long hair behind the shoulders, with rounded ends.
   b(7,13+bob,29,30,ink);b(5,24+bob,33,15,ink);
   b(8,15+bob,27,27,hair);b(7,36+bob,9,8,hair);b(28,36+bob,8,8,hair);
   b(8,25+bob,2,12,shine);b(33,24+bob,2,13,shine);
   // Dark pants and little black shoes, feet stay inside the existing frame.
   b(12,43+step,8,11,ink);b(23,43-step,8,11,ink);
   b(13,44+step,6,7,'#30333a');b(24,44-step,6,7,'#30333a');
   b(11,51+step,10,3,'#1c2026');b(23,51-step,10,3,'#1c2026');
   b(12,30+bob,19,16,ink);b(14,31+bob,15,13,top);
   b(14,41+bob,15,3,'#8f2e43');
   b(18,29+bob,7,5,skin);b(18,33+bob,7,1,'#782a3b');
   b(9,32+bob,5,12,ink);b(29,32+bob,5,12,ink);
   b(10,33+bob,3,10,skin);b(30,33+bob,3,10,skin);
   b(11,34+bob,2,6,light);b(30,34+bob,2,6,light);
   // Oversized chibi head and big dark eyes.
   b(10,5+bob,23,26,ink);b(7,10+bob,29,17,ink);
   b(11,11+bob,21,18,skin);b(13,15+bob,17,13,light);
   b(16,28+bob,12,2,skin);
   const blink=frame===2&&!walking;
   b(14,19+bob,5,blink?1:6,ink);b(25,19+bob,5,blink?1:6,ink);
   if(!blink){b(15,19+bob,2,2,'#fff8ef');b(26,19+bob,2,2,'#fff8ef');}
   b(12,25+bob,4,2,'#efa0a0');b(29,25+bob,3,2,'#efa0a0');
   b(19,26+bob,6,1,'#925c62');b(20,27+bob,4,1,'#925c62');
   // Black fringe, no bow or hair accessory in the supplied reference.
   b(11,4+bob,21,10,hair);b(8,9+bob,27,8,hair);
   b(14,3+bob,15,3,hair);b(13,6+bob,15,2,shine);
   b(9,14+bob,5,9,hair);b(14,13+bob,4,6,hair);
   b(20,13+bob,4,5,hair);b(27,13+bob,5,8,hair);
  });
 }
}
