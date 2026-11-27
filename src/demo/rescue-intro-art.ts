import type Phaser from 'phaser';

export const CHURU_TEXTURE='rescue-churu';
export const greyCatTexture=(pose:'idle'|'eat'|'walk'|'love'|'love-walk',frame:number)=>`rescue-grey-cat-${pose}-${frame%4}`;
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

 // Emy: long silver fur, pale chest ruff, green eyes and a large plume tail.
 for(const pose of ['idle','eat','walk','love','love-walk'] as const)for(let frame=0;frame<4;frame++){
  sprite(greyCatTexture(pose,frame),64,48,b=>{
   const ink='#44464c',fur='#85878a',shade='#62666d',bright='#b8bab7',ruff='#d2d0c5';
   const love=pose.startsWith('love'),walk=pose.includes('walk'),step=walk?[0,2,0,-2][frame]:0;
   const blink=pose==='idle'&&frame===3,nod=pose==='eat'?frame%2:0;
   // Raised bushy tail behind the body, visibly thicker than a shorthair cat.
   b(45,18,12,20,ink);b(50,9+frame%2,9,20,ink);b(53,5+frame%2,6,15,ink);
   b(48,18,7,16,fur);b(53,10+frame%2,4,17,bright);b(52,7,4,8,fur);
   b(23,22,28,19,ink);b(25,23,24,16,fur);b(30,26,16,12,shade);
   b(27+step,36,8,9,ink);b(42-step,35,8,10,ink);
   b(28+step,39,7,5,bright);b(43-step,38,6,6,fur);
   b(15,24+nod,19,19,bright);b(18,25+nod,13,19,ruff);
   b(13,29+nod,7,8,bright);b(27,31+nod,8,7,bright);b(19,41,5,4,bright);
   // Pointed tufted ears and fluffy cheeks around a dark tabby forehead.
   b(9,9+nod,26,23,ink);b(6,20+nod,31,9,ink);
   b(10,3+nod,6,13,ink);b(27,2+nod,6,13,ink);
   b(11,6+nod,4,9,'#b08b88');b(28,5+nod,3,9,'#b08b88');
   b(11,11+nod,22,17,fur);b(8,23+nod,27,7,bright);
   b(14,12+nod,4,5,shade);b(20,13+nod,4,4,shade);b(26,11+nod,3,6,shade);
   for(const x of [12,26]){
    if(love){b(x,19+nod,2,2,'#e2759a');b(x+3,19+nod,2,2,'#e2759a');b(x,21+nod,5,2,'#e2759a');b(x+1,23+nod,3,1,'#e2759a');}
    else{b(x,19+nod,5,blink?1:5,ink);if(!blink){b(x+1,20+nod,3,3,'#b3c280');b(x+2,19+nod,1,4,'#30373b');b(x+1,19+nod,1,1,'#f2efcf');}}
   }
   b(20,24+nod,4,2,'#bd8c7e');b(21,26+nod,2,1,ink);
   b(17,28+nod,10,1,shade);
   if(pose==='eat'){b(20,28+nod,4,3,'#e6a3ab');b(20,29+nod,4,1,'#f2bcc0');}
   b(4,25+nod,9,1,'#e4e1d5');b(3,28+nod,10,1,'#e4e1d5');
   b(32,25+nod,9,1,'#e4e1d5');b(32,28+nod,10,1,'#e4e1d5');
  });
 }
 sprite('emy-kitty-wave',18,22,b=>{
  b(4,3,10,16,'#ad99a9');b(2,7,14,10,'#ad99a9');
  b(5,4,8,14,'#fff8ed');b(3,8,12,8,'#fff8ed');b(4,16,10,3,'#e6d3de');
 });

 // Vale matches the reference card: long black hair, red top and dark trousers.
 // Keep the same texture keys, four-frame timing and foot anchor for the couple.
 for(const walking of [false,true])for(let frame=0;frame<4;frame++){
  sprite(valeTexture(walking,frame),43,58,b=>{
   const ink='#25252d',hair='#202126',shine='#37383d',skin='#e9b48f',light='#fbd4af',top='#b93d51';
   const bob=frame===1||frame===3?1:0,step=walking?[2,0,-2,0][frame]:0;
   // Long hair behind the shoulders, with rounded ends.
   b(7,12+bob,29,32,ink);b(4,25+bob,35,14,ink);
   b(5,33+bob,14,13,hair);b(25,32+bob,13,14,hair);
   b(7,15+bob,29,27,hair);b(8,43+bob,8,4,hair);b(28,43+bob,7,4,hair);
   b(7,28+bob,2,12,shine);b(34,27+bob,2,11,shine);
   // Dark pants and little black shoes, feet stay inside the existing frame.
   b(12,43+step,8,11,ink);b(23,43-step,8,11,ink);
   b(13,44+step,6,7,'#30333a');b(24,44-step,6,7,'#30333a');
   b(11,51+step,10,3,'#1c2026');b(23,51-step,10,3,'#1c2026');
   b(13,31+bob,18,15,ink);b(15,32+bob,14,12,top);
   b(15,41+bob,14,3,'#8f2e43');
   b(18,29+bob,7,5,skin);b(18,33+bob,7,1,'#782a3b');
   b(9,32+bob,5,12,ink);b(29,32+bob,5,12,ink);
   b(10,33+bob,3,10,skin);b(30,33+bob,3,10,skin);
   b(11,34+bob,2,6,light);b(30,34+bob,2,6,light);
   // Oversized chibi head and big dark eyes.
   b(9,5+bob,26,26,ink);b(5,10+bob,34,17,ink);
   b(8,24+bob,28,5,ink);b(12,29+bob,20,3,ink);
   b(9,13+bob,25,15,skin);b(11,16+bob,22,12,light);
   b(13,27+bob,18,3,light);b(17,30+bob,10,1,skin);
   const blink=frame===2&&!walking;
   b(14,19+bob,5,blink?1:6,ink);b(25,19+bob,5,blink?1:6,ink);
   if(!blink){b(15,19+bob,2,2,'#fff8ef');b(26,19+bob,2,2,'#fff8ef');}
   b(12,25+bob,4,2,'#efa0a0');b(29,25+bob,3,2,'#efa0a0');
   b(19,26+bob,6,1,'#925c62');b(20,27+bob,4,1,'#925c62');
   // Black fringe, no bow or hair accessory in the supplied reference.
   b(10,4+bob,25,10,hair);b(6,8+bob,32,10,hair);
   b(5,12+bob,5,11,hair);b(35,12+bob,4,12,hair);
   b(14,3+bob,16,3,hair);b(14,6+bob,11,2,shine);
   b(8,14+bob,5,9,hair);b(14,13+bob,4,7,hair);
   b(20,13+bob,4,7,hair);b(27,13+bob,5,8,hair);
   b(17,18+bob,2,3,hair);b(23,17+bob,2,3,hair);
   // White soles from the reference card, existing feet anchors.
   b(12,53+step,8,1,'#ddd6d0');b(24,53-step,8,1,'#ddd6d0');
  });
 }
}
