import type Phaser from 'phaser';

// Original hand-drawn 48x64 pixel sprites. No copyrighted artist photos are
// embedded. Louis is a stylized tribute to the young One Direction-era look:
// swept brown fringe, blue eyes, white/navy stripe shirt and red trousers.
// Luis is the boyfriend: dark hair, glasses, sleeveless top, inked LEFT arm.
// Original Kitty artwork remains unchanged and is loaded from her reference.
export type ProloguePerson='luis'|'louis';
const DARK='#30243f',SKIN='#f5c9a9',SHADOW='#c38b82',HIGHLIGHT='#ffead7';
export function paintProloguePerson(person:ProloguePerson):HTMLCanvasElement{
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
export function installProloguePeople(scene:Phaser.Scene){
 const portraits:Record<ProloguePerson,string>={luis:'',louis:''};
 for(const id of ['luis','louis'] as const){
  const key='story-person-'+id;
  const canvas=paintProloguePerson(id);
  if(scene.textures.exists(key))scene.textures.remove(key);
  scene.textures.addCanvas(key,canvas);
  portraits[id]=canvas.toDataURL('image/png');
 }
 return portraits;
}
