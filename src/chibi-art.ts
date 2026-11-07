import type Phaser from 'phaser';
import {CHARACTERS,type CharacterId} from './characters';

// Original 32×40 pixel portraits for the new scene. Feet share an anchor.
export function buildChibi(scene:Phaser.Scene){
 for(const id of ['kitty','louis'] as CharacterId[])for(const dir of ['down','up','right'])for(let frame=0;frame<6;frame++)for(const shooting of [false,true]){
  const cv=document.createElement('canvas');cv.width=32;cv.height=40;const c=cv.getContext('2d')!;
  const rect=(color:string,x:number,y:number,w:number,h:number)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const ink='#493e51',skin=id==='kitty'?'#fff8e9':'#efbd99',shirt=id==='kitty'?'#e493b0':'#f7efe5',pants=id==='kitty'?'#d27d9f':'#bf5c65';
  const step=frame===1?2:frame===3?-2:0,feet=frame===2?1:frame===4?-1:0;
  // Shoes, legs and dress / shirt, followed by arms and large head.
  rect(ink,10+step,34,5,4);rect(ink,18-step,34,5,4);rect(pants,10+step,31,5,4);rect(pants,18-step,31,5,4);
  rect(ink,9,23,15,10);rect(shirt,10,24,13,8);rect(ink,6+feet,24,4,8);rect(ink,23-feet,24,4,8);
  rect(skin,7+feet,25,3,6);rect(skin,23-feet,25,3,6);
  if(id==='louis'){rect('#597c95',10,26,13,2);rect('#597c95',10,30,13,2);}
  if(shooting){rect(ink,23,21,6,5);rect(skin,24,22,5,3);}
  if(id==='kitty'){
   rect(ink,5,2,7,8);rect(ink,20,2,7,8);rect(skin,6,3,5,6);rect(skin,21,3,5,6);
  }
  rect(ink,5,7,23,16);rect(ink,7,5,19,20);rect(skin,6,8,21,14);rect(skin,8,6,17,18);
  if(id==='louis'){
   rect('#604535',6,6,21,5);rect('#604535',5,9,5,6);rect('#604535',9,4,15,5);rect('#816044',10,5,9,2);rect('#604535',18,10,7,2);
   if(dir==='up')rect('#604535',6,8,21,12);
  }
  if(dir!=='up'){
   const blink=frame===5;
   if(dir==='down'){rect(ink,11,13,2,blink?1:3);rect(ink,20,13,2,blink?1:3);rect(id==='kitty'?'#e3b55f':'#c97c75',15,18,3,2);}
   else{rect(ink,21,13,2,blink?1:3);rect(id==='kitty'?'#e3b55f':'#c97c75',25,18,2,2);}
   rect('#eaa0a4',8,18,3,1);if(dir==='down')rect('#eaa0a4',22,18,3,1);
  }
  if(id==='kitty'){rect('#be557b',21,5,7,5);rect('#e88da9',22,6,2,3);rect('#e88da9',26,6,2,3);rect('#f7c46b',24,6,2,2);}
  scene.textures.addCanvas(`chibi-${id}-${dir}-${frame}${shooting?'-shoot':''}`,cv);
 }
 // Optional 6×8 sheet of 32×40 frames; absent/invalid sheets retain the procedural fallback.
 for(const id of ['kitty','louis'] as CharacterId[]){const key=`chibi-${id}-sheet`;
  if(!CHARACTERS[id].chibiSpriteSheet||!scene.textures.exists(key))continue;
  const source=scene.textures.get(key).getSourceImage() as HTMLImageElement;
  if(source.width!==192||source.height!==320){console.warn(`${key}: expected 192×320 PNG; using generated art.`);continue;}
  const rows=['down','down-shoot','up','up-shoot','right','right-shoot','hurt','dead'];
  rows.forEach((row,y)=>{for(let f=0;f<(y<6?6:1);f++){
   const name=y>=6?`chibi-${id}-${row}`:`chibi-${id}-${row.replace('-shoot','')}-${f}${row.endsWith('-shoot')?'-shoot':''}`;
   const cv=document.createElement('canvas');cv.width=32;cv.height=40;cv.getContext('2d')!.drawImage(source,f*32,y*40,32,40,0,0,32,40);
   if(scene.textures.exists(name))scene.textures.remove(name);scene.textures.addCanvas(name,cv);
  }});
 }
}
