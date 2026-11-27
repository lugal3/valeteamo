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
// Front master is the approved aligned card bitmap. All views use the same
// 33x48 proportions and palette, never the earlier oversized procedural head.
const LUIS_CARD=["0000000000011123211111133000000000","0000000000111111111111111113000000","0000000111111111111111111111130000","0000011122211111111111111111112000","0000121111111111111111111111111200","0001121112112222111111122111111200","0012221111111211111222111111111120","0132211111112112111221111111111120","0232111112211212111222211111111111","1321111112211212111122221111111112","1322111212211112111123211111111113","1311111112212111112223211111111113","2321331112211111114322211111111110","1221552331221131136432331211111110","1211464321221231134333541221111110","1111111111111111212233321211111110","1117777777122127377756422211111110","1177423417756427443266434421111145","1176642427688577244256746641211245","1176643317688677344357768511112545","1177777778888867222345686411126540","0224333388888886337776885221255400","0688833888888888833388888654444000","0068888888888869888888866653000000","0006888888699998888888866530000000","0000068888888888888886654300000000","0000000668888888886655430000000000","0000000004456666555543000000000000","0000000000004444333330000000000000","00000000000ABCCCCCCC00000000000000","0000000000AACCCCCCCCC0000000000000","0000000000BACCCCCCCACC000000000000","000000000ABACCCCCCCAADD00000000000","00000000DBACCCCCCCCCBD665000000000","000000066BACCCCCCCCCDD666000000000","000000066BACCCCCCCCCAB666500000000","000000055BACCCCCCCCCABD56500000000","00000000DBACCCCCCCAAABAB4000000000","000000000ABBBBBBBBBBBBA00000000000","0000000000EEFEFEFFFFE0000000000000","0000000000FEEEFFFFFEE0000000000000","0000000000FEEFFFFFFFE0000000000000","0000000000EFFFFFFFFFE0000000000000","0000000000FFFFFFFFFFF0000000000000","000000000FFFFFFFEFEFF0000000000000","000000000GGEEEEEGGGEFE000000000000","00000000FFFEEFEEEEEEFF000000000000","00000000GGGGGGGGGGGGGG000000000000"] as const;
const LUIS_CARD_COLORS=["","#282526","#343033","#3f393a","#c89775","#eab68c","#f8d2a5","#554b43","#ffe5bd","#a36e52","#7fa74e","#5e533d","#8db755","#709345","#403b39","#353232","#57504a"] as const;
export function paintLuisChibi(facing:LuisFacing='down',pose:LuisPose='idle',frame=0):HTMLCanvasElement{
 const canvas=document.createElement('canvas');canvas.width=48;canvas.height=64;
 const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 const i=((Math.floor(frame)%LUIS_FRAME_COUNTS[pose])+LUIS_FRAME_COUNTS[pose])%LUIS_FRAME_COUNTS[pose];
 const walk=pose==='walk',talk=pose==='talk',wave=pose==='wave';
 const bob=walk?[0,-1,0,-1][i]:talk?[0,0,-1][i]:pose==='idle'&&i===2?-1:0;
 const blink=pose==='idle'&&i===3;
 const b=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const raw=(x:number,y:number)=>LUIS_CARD[y]?.[x]??'0';
 const skin=(v:string)=>'45689'.includes(v);
 const rows=LUIS_CARD.map(row=>row.split(''));
 // The rear view preserves the outline of the printed head. Its color clusters
 // are taken from the upper crown, not the face.
 if(facing==='up'){
  for(let y=0;y<29;y++)for(let x=0;x<33;x++){
   if(raw(x,y)==='0')continue;
   if(y>12){const sample=raw(x,6+(y%6));rows[y][x]=sample==='2'||sample==='3'?sample:'1';}
  }
  for(let y=29;y<39;y++)for(let x=0;x<33;x++)if(rows[y][x]==='B')rows[y][x]='D';
 }
 // Side view: narrower crown, same foot anchor, one visible eye and temple.
 if(facing==='right'){
  for(let y=0;y<29;y++){
   const row=Array.from({length:33},()=> '0');
   for(let x=4;x<30;x++){
    const sx=Math.min(32,Math.floor((x-4)*33/26)),v=raw(sx,y);
    if(v==='0')continue;
    row[x]=y<13?v:(x<17&&y<25?'1':skin(v)?v:'1');
   }
   rows[y]=row;
  }
  const overlay=(y:number,x:number,v:string)=>{for(let j=0;j<v.length;j++)rows[y][x+j]=v[j];};
  overlay(15,21,'645111');overlay(16,20,'7665711');
  overlay(17,19,'777777776');overlay(18,15,'777766677785');
  overlay(19,20,'7688877856');overlay(20,20,'7687977856');
  overlay(21,20,'7777777756');overlay(22,20,'8888888656');
  overlay(23,21,'888888866');overlay(24,22,'88898886');
  overlay(25,23,'888865');overlay(26,23,'66554');
  // Narrow the torso without lengthening it; keep the green shirt and dark shoes.
  for(let y=29;y<48;y++){
   const row=Array.from({length:33},()=> '0');
   for(let x=10;x<=23;x++){const v=raw(Math.round(8+(x-10)*16/13),y);row[x]=v;}
   rows[y]=row;
  }
 }
 for(let y=0;y<rows.length;y++)for(let x=0;x<rows[y].length;x++){
  const color=LUIS_CARD_COLORS[parseInt(rows[y][x],36)];
  if(!color)continue;
  const leg=walk&&y>=39?((i===1&&x<16)||(i===3&&x>=16)?1:0):0;
  b(x+7,y+13+(y<39?bob:-leg),1,1,color);
 }
 // Small edits in the actual bitmap coordinate system.
 if(facing==='down'&&blink){b(12,32+bob,4,1,'#554b43');b(27,32+bob,4,1,'#554b43');}
 if(facing==='right'&&blink)b(30,32+bob,4,1,'#554b43');
 if(talk&&i>0&&facing!=='up')b(facing==='down'?19:32,37+bob,3,i===2?2:1,'#a36e52');
 if(pose==='idle'&&i===1)b(21,45,2,1,'#7fa74e');
 if(wave&&i!==0){
  // Sleeve and forearm connect to the original shoulder; no floating hand.
  b(28,46,3,4,'#709345');b(30,44,4,5,'#5e533d');
  b(32,40,3,7,'#554b43');b(33,40,2,6,'#eab68c');
  b(32,38-(i===2?1:0),4,4,'#c89775');b(33,38-(i===2?1:0),2,3,'#ffe5bd');
 }
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
