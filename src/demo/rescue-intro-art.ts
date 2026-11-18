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

 // Vale uses an original, editable chibi placeholder while personal references are pending.
 for(const walking of [false,true])for(let frame=0;frame<4;frame++){
  sprite(valeTexture(walking,frame),43,58,b=>{
   const ink='#513650',hair='#624158',skin='#eeac89',light='#ffd7b0',dress='#658a88';
   const bob=frame===1||frame===3?1:0,step=walking?[2,0,-2,0][frame]:0;
   b(12,43+step,8,11,ink);b(23,43-step,8,11,ink);
   b(13,43+step,6,7,skin);b(24,43-step,6,7,skin);
   b(13,50+step,7,3,'#df8fa9');b(24,50-step,7,3,'#df8fa9');
   b(12,30+bob,19,13,ink);b(9,39+bob,25,9,ink);
   b(14,30+bob,15,12,dress);b(11,40+bob,21,6,dress);b(12,43+bob,19,2,'#a4bbaa');
   b(8,32+bob,6,12,ink);b(29,32+bob,7,12,ink);
   b(9,33+bob,4,8,skin);b(30,33+bob,5,9,skin);
   b(34,40+bob,4,4,light);
   b(10,7+bob,23,23,ink);b(7,12+bob,29,22,ink);b(8,11+bob,27,21,hair);
   b(12,13+bob,19,17,skin);b(14,15+bob,15,13,light);
   b(10,9+bob,22,6,hair);b(12,13+bob,7,4,hair);b(28,13+bob,4,7,hair);
   b(16,20+bob,2,frame===2&&!walking?1:3,ink);b(25,20+bob,2,frame===2&&!walking?1:3,ink);
   b(14,24+bob,3,2,'#f6a49e');b(27,24+bob,3,2,'#f6a49e');b(20,25+bob,3,1,'#aa5d69');
   b(29,10+bob,4,5,'#e791a8');b(28,12+bob,6,2,'#ffe0bd');
  });
 }
}
