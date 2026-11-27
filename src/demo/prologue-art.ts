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
 const canvas=document.createElement('canvas');canvas.width=48;canvas.height=64;
 const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 const p=LUIS,side=facing==='right',back=facing==='up';
 const i=((Math.floor(frame)%LUIS_FRAME_COUNTS[pose])+LUIS_FRAME_COUNTS[pose])%LUIS_FRAME_COUNTS[pose];
 const walking=pose==='walk',talking=pose==='talk',waving=pose==='wave';
 const bob=walking?[0,-1,0,-2][i]:talking?[0,0,-1][i]:pose==='idle'&&i===2?-1:0;
 const blink=pose==='idle'&&i===3,step=walking?[0,2,0,-2][i]:0;
 const swing=walking?[0,-2,1,2][i]:0;
 const b=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const rows=(y:number,spans:readonly (readonly [number,number])[],color:string)=>spans.forEach(([x,w],j)=>b(x,y+j,w,1,color));
 // Compact green shirt and dark trousers. Feet anchor at y=61.
 const ink='#302c30',dark='#353238',sole='#494447',hair=p.hair,soft='#303033';
 const liftL=step<0?2:0,liftR=step>0?2:0;
 b(15,52-liftL,9,8,ink);b(24,52-liftR,9,8,ink);
 b(16,53-liftL,7,5,dark);b(25,53-liftR,7,5,dark);
 b(13,58-liftL,11,3,ink);b(24,58-liftR,11,3,ink);
 b(14,60-liftL,9,1,sole);b(25,60-liftR,9,1,sole);
 const y=37+bob;
 b(19,y-3,10,4,p.skinShade);b(20,y-3,8,3,p.skin);
 b(17,y-1,14,4,ink);b(15,y+1,18,15,ink);
 b(16,y+2,16,13,p.top);
 b(17,y+3,13,8,'#79a95a');
 b(17,y+13,14,2,'#53783e');
 if(back)b(20,y+2,8,2,'#6c964c');
 if(pose==='idle'&&i===1)b(18,y+4,2,4,'#84ae66');
 // Small, rounded hands; left-arm ink stays a tiny detail, not a dark sleeve.
 const raised=waving&&i!==0;
 for(const [x,offset,tattoo] of [[10,swing,back],[32,-swing,!back]] as const){
  const lift=raised&&x===32?-8:0,ay=y+4+offset+lift;
  if(lift){b(31,ay+6,5,8,ink);b(32,ay+6,3,7,p.skin);}
  b(x+1,ay,5,3,ink);b(x,ay+2,7,7,ink);
  b(x+1,ay+3,5,5,p.skin);b(x+2,ay+3,3,4,p.skinLight);
  b(x+2,ay+8,3,1,ink);
  if(tattoo)b(x+4,ay+3,1,2,'#46465d');
  if(raised&&x===32&&i===2)b(x+2,ay+2,2,1,p.skinLight);
 }
 // The front artwork is sampled from the aligned printed pixel art, then
 // cleaned to a limited palette. Do not reconstruct its face with rectangles.
 if(facing==='down'){
  c.clearRect(0,0,48,64);
  const bitmap=["0000000000011123211111133000000000","0000000000111111111111111113000000","0000000111111111111111111111130000","0000011122211111111111111111112000","0000121111111111111111111111111200","0001121112112222111111122111111200","0012221111111211111222111111111120","0132211111112112111221111111111120","0232111112211212111222211111111111","1321111112211212111122221111111112","1322111212211112111123211111111113","1311111112212111112223211111111113","2321331112211111114322211111111110","1221552331221131136432331211111110","1211464321221231134333541221111110","1111111111111111212233321211111110","1117777777122127377756422211111110","1177423417756427443266434421111145","1176642427688577244256746641211245","1176643317688677344357768511112545","1177777778888867222345686411126540","0224333388888886337776885221255400","0688833888888888833388888654444000","0068888888888869888888866653000000","0006888888699998888888866530000000","0000068888888888888886654300000000","0000000668888888886655430000000000","0000000004456666555543000000000000","0000000000004444333330000000000000","00000000000ABCCCCCCC00000000000000","0000000000AACCCCCCCCC0000000000000","0000000000BACCCCCCCACC000000000000","000000000ABACCCCCCCAADD00000000000","00000000DBACCCCCCCCCBD665000000000","000000066BACCCCCCCCCDD666000000000","000000066BACCCCCCCCCAB666500000000","000000055BACCCCCCCCCABD56500000000","00000000DBACCCCCCCAAABAB4000000000","000000000ABBBBBBBBBBBBA00000000000","0000000000EEFEFEFFFFE0000000000000","0000000000FEEEFFFFFEE0000000000000","0000000000FEEFFFFFFFE0000000000000","0000000000EFFFFFFFFFE0000000000000","0000000000FFFFFFFFFFF0000000000000","000000000FFFFFFFEFEFF0000000000000","000000000GGEEEEEGGGEFE000000000000","00000000FFFEEFEEEEEEFF000000000000","00000000GGGGGGGGGGGGGG000000000000"] as const;
  const palette=["","#282526","#343033","#3f393a","#c89775","#eab68c","#f8d2a5","#554b43","#ffe5bd","#a36e52","#7fa74e","#5e533d","#8db755","#709345","#403b39","#353232","#57504a"] as const;
  // Keep the reference's original proportions and the shared foot baseline.
  for(let row=0;row<bitmap.length;row++)for(let x=0;x<bitmap[row].length;x++){
   const color=palette[parseInt(bitmap[row][x],16)];
   if(!color)continue;
   const leg=walking&&row>=39?(x<16?liftL:liftR):0;
   b(x+7,row+13+(row<39?bob:-leg),1,1,color);
  }
  // Small pose edits to the bitmap, not a new facial silhouette.
  if(blink){b(11,31+bob,5,1,'#554b43');b(26,32+bob,5,1,'#554b43');}
  if(talking&&i>0){b(19,37+bob,4,i===2?2:1,'#a36e52');}
  if(pose==='idle'&&i===1)b(21,45,2,1,'#7fa74e');
  if(waving&&i!==0){
   b(29,46,3,4,'#709345');
   b(32,40,3,7,'#554b43');b(33,40,2,6,'#eab68c');
   b(32,38-(i===2?1:0),4,4,'#c89775');
   b(33,38-(i===2?1:0),2,3,'#ffe5bd');
  }
  return canvas;
 }
 // Photo-derived head: broad, rounded bowl silhouette, smooth dark crown.
 const h=2+bob;
 rows(h,[[15,16],[11,24],[8,30],[6,34],[5,36],[4,38],[3,40],[2,42],[2,43],[1,44],[1,45],[1,45],[1,45],[1,45],[1,45],[1,45],[1,45],[1,45],[1,45],[2,44],[2,44],[3,42],[3,42],[4,40],[5,38],[6,36],[7,34],[8,32],[9,30],[11,26],[13,22],[16,16],[19,10]],hair);
 // Lower face is a gently rounded peach arc, not a rectangular mask.
 if(!back){
  rows(h+14,[[12,25],[10,29],[8,33],[7,35],[6,37],[6,38],[5,39],[5,39],[5,39],[5,39],[6,37],[7,35],[8,33],[9,31],[11,27],[13,23],[16,17],[19,11]],p.skinShade);
  rows(h+15,[[13,23],[11,28],[9,31],[8,33],[7,35],[7,36],[6,37],[6,37],[6,37],[7,35],[8,33],[10,30],[12,26],[14,22],[17,16],[20,9]],p.skin);
  rows(h+19,[[10,28],[8,33],[8,34],[8,34],[9,33],[9,32],[10,31],[11,29],[12,27],[14,23],[16,19],[19,13],[21,9]],p.skinLight);
  rows(h+30,[[15,21],[17,17],[20,11],[22,7]],p.skinShade);
  rows(h+30,[[17,17],[19,13],[22,7]],p.skinLight);
  if(!side){
   // Clean dark rectangular frames with round lower corners, brown eyes.
   for(const x of [8,26]){
    b(x+2,h+17,11,2,p.glass);b(x,h+19,2,7,p.glass);
    b(x+12,h+19,2,7,p.glass);b(x+2,h+26,10,2,p.glass);
    b(x+1,h+25,2,2,p.glass);b(x+11,h+25,2,2,p.glass);
    if(blink){b(x+4,h+24,6,1,'#57423b');}
    else{b(x+4,h+20,6,5,'#4a3a35');b(x+4,h+22,2,2,'#fff2db');b(x+8,h+23,2,2,'#84634d');}
   }
   b(22,h+21,4,2,p.glass);
   b(23,h+27,2,1,'#d79e82');
   if(talking&&i>0){b(21,h+30,6,i===2?3:2,'#995e53');b(22,h+31,3,1,'#e0a48d');}
   else{b(21,h+30,6,1,'#a46f57');b(22,h+31,4,1,'#bd876b');}
  }else{
   b(27,h+18,12,2,p.glass);b(26,h+20,2,8,p.glass);b(38,h+20,2,8,p.glass);b(28,h+28,10,2,p.glass);b(15,h+21,12,2,p.glass);
   b(31,h+22,5,blink?1:5,'#4a3a35');if(!blink)b(31,h+22,2,1,'#fff2db');
   b(39,h+26,3,2,p.skin);b(34,h+30,5,talking&&i>0?2:1,'#a46f57');
  }
  // Solid sweeping black fringe, with a few small gaps from the card.
  // Leave a small peach forehead between the fringe and the upper glasses rim.
  rows(h+10,[[3,42],[3,42],[4,40],[4,40],[4,40]],hair);
  rows(h+15,[[5,7],[5,7],[5,5],[5,4],[6,3],[6,3],[7,2]],hair);
  rows(h+14,[[14,5],[15,4],[16,2]],hair);
  rows(h+14,[[21,5],[21,5],[22,2]],hair);
  rows(h+14,[[29,4],[30,3]],hair);
  rows(h+15,[[37,6],[39,4],[40,3],[41,2],[41,2],[41,2],[41,1]],hair);
  if(side){rows(h+16,[[6,14],[6,13],[7,12],[7,10],[8,9],[8,7],[9,5],[10,3]],hair);}
 }else{
  rows(h+18,[[3,42],[3,42],[4,40],[4,40],[5,38],[5,38],[6,36],[7,34],[8,32],[10,28],[13,22],[16,16],[19,10]],hair);
  b(18,h+29,12,1,soft);
 }
 // Minimal tone separation in the dark crown, no shiny rectangular streaks.
 rows(h+3,[[16,10],[12,12],[10,11],[9,8],[8,6],[8,4]],soft);
 rows(h+5,[[28,7],[29,8],[31,7],[33,5],[35,3]],'#29292d');
 if(back&&blink)b(20,h+28,5,1,soft);
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
 b(10,y+2,3,1,'#fff6e7');b(10,y+5,3,1,'#fff6e7');b(21,y+1,2,8,'#d4c7c3');
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
   b(x+3,h+13,1,2,ink);b(x+2,h+12,1,1,'#ffffff');b(x+2,h+15,2,1,'#8dc3de');
   if(frame===5)b(x,h+13,6,2,ink);
  }
  b(15,h+15,2,2,shadow);b(8,h+17,3,1,'#e5a48f');b(22,h+17,3,1,'#e5a48f');
  b(12,h+18,8,1,'#9b5960');b(14,h+18,5,1,'#fff2df');b(15,h+19,4,1,'#b66d65');
  if(frame===7){b(14,h+18,5,3,'#824b58');b(15,h+20,3,1,'#d88f95');}
 }
 // The sweeping fringe descends on the viewer's left, not a bowl cut.
 b(8,h+1,16,4,shade);b(6,h+3,20,5,hair);b(5,h+6,22,4,hair);
 b(11,h,11,3,hair);b(17,h-1,6,3,hair);
 // Swept, layered hair with tapered warm strands (2012–13 reference).
 const lock=(x:number,y:number,rows:number[],color:string)=>rows.forEach((width,i)=>b(x+Math.floor(i/2),y+i,width,1,color));
 lock(10,h+2,[8,12,10,7,4],highlight);
 lock(7,h+5,[8,10,8,5,3],'#704b37');
 lock(16,h+3,[9,9,7,5,3],'#a17b5b');
 lock(8,h+8,[6,5,4,3],'#5b392f');
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
