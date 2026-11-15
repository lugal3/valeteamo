import type Phaser from 'phaser';
import type {IsoPoint} from '../isometric';

// ORIGINAL story artwork, shared by the daylight kidnapping and the night
// neighborhood. The vehicle's crescent/LUNA-07 plate is an actual repeating clue.
export type AnimalMask='fox'|'rabbit';
export type CaptorPose='idle'|'walk'|'grab';
export type AbductionPhase='arrival'|'doors'|'disembark'|'approach'|
 'struggle'|'load'|'board'|'close'|'escape'|'done';
export const ABDUCTION_TIMING={
 arrival:1400,doors:1930,disembark:2920,approach:4080,
 struggle:4870,load:5940,board:6640,close:7140,escape:8900
} as const;
export const VAN_PLATE='LUNA-07';
export const VAN_NIGHT_POSITION:IsoPoint={u:73.9,v:5.15};

const ease=(t:number)=>{const s=Math.max(0,Math.min(1,t));return s*s*(3-2*s);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const pos=(a:IsoPoint,b:IsoPoint,t:number):IsoPoint=>({
 u:lerp(a.u,b.u,ease(t)),v:lerp(a.v,b.v,ease(t))
});
const at=(center:IsoPoint,du:number,dv:number):IsoPoint=>({u:center.u+du,v:center.v+dv});
const part=(time:number,start:number,end:number)=>(time-start)/Math.max(1,end-start);
export function abductionPhaseAt(time:number):AbductionPhase{
 const t=Math.max(0,time),v=ABDUCTION_TIMING;
 return t<v.arrival?'arrival':t<v.doors?'doors':
  t<v.disembark?'disembark':t<v.approach?'approach':
  t<v.struggle?'struggle':t<v.load?'load':
  t<v.board?'board':t<v.close?'close':t<v.escape?'escape':'done';
}
export type AbductionPose={
 phase:AbductionPhase;van:IsoPoint;victim:IsoPoint;
 fox:IsoPoint;rabbit:IsoPoint;
 doorOpen:boolean;victimVisible:boolean;captorsVisible:boolean;
 victimBehindVan:boolean;dust:number;brake:boolean;
};
export function abductionFrame(time:number,center:IsoPoint):AbductionPose{
 const v=ABDUCTION_TIMING,t=Math.max(0,time),phase=abductionPhaseAt(t);
 const arrival=at(center,5.2,-2.15);
 const stop=at(center,2.35,-.95);
 const escape=at(center,8.25,-4.55);
 const opening=at(center,2.03,-.72);
 const foxTarget=at(center,.53,-.13);
 const rabbitTarget=at(center,.04,.45);
 const victimBase=at(center,.32,.20);
 const boarding=at(center,1.94,-.68);
 const fStart=at(center,2.36,-.66);
 const rStart=at(center,2.23,-.39);
 let van=stop,fox=fStart,rabbit=rStart,victim=victimBase;
 if(t<v.arrival)van=pos(arrival,stop,t/v.arrival);
 else if(t>=v.close)van=pos(stop,escape,part(t,v.close,v.escape));
 if(t>=v.doors&&t<v.disembark){
  fox=pos(fStart,opening,part(t,v.doors,v.disembark));
  rabbit=pos(rStart,at(center,1.95,-.26),part(t,v.doors,v.disembark));
 }else if(t>=v.disembark&&t<v.approach){
  fox=pos(opening,foxTarget,part(t,v.disembark,v.approach));
  rabbit=pos(at(center,1.95,-.26),rabbitTarget,part(t,v.disembark,v.approach));
 }else if(t>=v.approach&&t<v.struggle){
  fox={...foxTarget};rabbit={...rabbitTarget};
  const w=Math.sin(part(t,v.approach,v.struggle)*Math.PI*7);
  victim={u:victimBase.u+w*.08,v:victimBase.v-w*.10};
 }else if(t>=v.struggle&&t<v.load){
  const progress=part(t,v.struggle,v.load);
  fox=pos(foxTarget,at(center,1.84,-.56),progress);
  rabbit=pos(rabbitTarget,at(center,1.76,-.24),progress);
  victim=pos(victimBase,boarding,progress);
 }else if(t>=v.load&&t<v.board){
  fox=pos(at(center,1.84,-.56),opening,part(t,v.load,v.board));
  rabbit=pos(at(center,1.76,-.24),at(center,1.96,-.40),part(t,v.load,v.board));
  victim=boarding;
 }else if(t>=v.board){
  fox=opening;rabbit=at(center,1.96,-.40);victim=boarding;
 }
 // The victim stays visible until physically loaded behind the OPEN van door.
 // No transparency shrink / teleport / Kuromi placeholder animation.
 return {
  phase,van,victim,fox,rabbit,
  doorOpen:t>=v.arrival&&t<v.close,
  victimVisible:t<v.close,
  captorsVisible:t>=v.doors&&t<v.board,
  victimBehindVan:t>=v.struggle+(v.load-v.struggle)*.67,
  dust:t<v.arrival?Math.min(1,t/v.arrival):t>=v.close&&t<v.escape?
   Math.min(1,part(t,v.close,v.escape)*2):0,
  brake:t>=v.arrival&&t<v.close
 };
}
export function captorFrame(time:number,pose:CaptorPose):number{
 return pose==='idle'?0:Math.floor(Math.max(0,time)/160)%3;
}
export function captorTexture(mask:AnimalMask,pose:CaptorPose,frame=0){
 return `rescue-captor-${mask}-${pose}-${((Math.floor(frame)%3)+3)%3}`;
}
export const vanTexture=(open:boolean)=>open?'rescue-van-open':'rescue-van-closed';

function makeCanvas(width:number,height:number){
 const canvas=document.createElement('canvas');
 canvas.width=width;canvas.height=height;
 const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 const rect=(x:number,y:number,w:number,h:number,color:string)=>{
  c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);
 };
 return {canvas,c,rect};
}
export function paintRescueVan(open=false):HTMLCanvasElement{
 const {canvas,c,rect:b}=makeCanvas(180,100);
 // Full-body silhouette with perspective, roof, doors, headlights and
 // recognisable plate; same pixel art used when it's parked by the 3D house.
 b(12,83,161,7,'#282836');
 b(21,88,143,4,'#454258');
 for(const wx of [45,141]){
  b(wx-17,73,36,18,'#252333');b(wx-12,71,27,21,'#292c39');
  b(wx-6,74,15,13,'#92949e');b(wx-3,76,9,9,'#3b4356');
  b(wx,79,3,3,'#d9b5b9');
 }
 b(13,40,157,38,'#343346');
 b(18,32,145,46,'#6c607b');
 b(28,24,112,11,'#8a7891');
 b(33,21,92,8,'#bbb0bf');
 b(27,35,135,7,'#b29db3');
 b(21,45,149,5,'#89748d');
 b(18,70,151,7,'#443e54');
 b(25,61,139,3,'#c6a7b2');
 // Windscreen / driver's cabin
 b(128,33,32,27,'#333d52');b(130,35,28,22,'#617581');
 b(135,35,4,20,'#a7bbc2');b(152,35,4,16,'#a6bbc8');
 b(160,43,7,17,'#80748e');
 b(168,58,6,11,'#d7b29c');
 b(167,62,7,3,'#fbddab');
 // Sliding side door, visibly OPEN for loading; no magical fade.
 if(open){
  b(39,42,71,31,'#282738');b(42,45,65,24,'#444459');
  b(103,40,36,32,'#b9a4b3');b(107,44,27,20,'#86738a');
  b(120,53,9,3,'#ede3dc');
  b(39,43,4,30,'#d3b8c3');
  b(43,71,66,3,'#b6a1a9');
 }else{
  b(40,42,69,30,'#baa2b7');
  b(42,44,64,26,'#907f97');
  b(50,43,54,4,'#ceb5c3');
  b(105,44,3,26,'#675a75');
  b(90,54,9,3,'#e5d0c8');
 }
 b(18,48,12,6,'#e9c3ba');b(18,56,13,8,'#693c5c');
 // Crescent and scratch: the same clue Kitty can identify on the parked van.
 c.fillStyle='#f6d3a5';c.beginPath();c.arc(71,51,9,0,Math.PI*2);c.fill();
 c.fillStyle='#907f97';c.beginPath();c.arc(76,47,9,0,Math.PI*2);c.fill();
 b(57,55,7,2,'#f7b9c3');b(64,56,5,2,'#f7b9c3');
 b(23,67,8,4,'#f9e0bb');
 b(156,66,12,5,'#ffe4b2');
 b(143,74,25,5,'#e0bfaa');b(150,74,12,3,'#795d78');
 c.font='bold 8px monospace';c.fillStyle='#fff4dc';c.fillText(VAN_PLATE,82,80);
 return canvas;
}
export function paintMaskedCaptor(mask:AnimalMask,pose:CaptorPose,frame:number):HTMLCanvasElement{
 const {canvas,rect:b}=makeCanvas(44,68);
 const index=((Math.floor(frame)%3)+3)%3;
 const walking=pose==='walk',grabbing=pose==='grab';
 const gait=walking?[0,-3,3][index]:0;
 const bob=walking?[0,-1,-2][index]:0;
 const sleeve=grabbing?[4,8,5][index]:walking?[0,2,-2][index]:0;
 const shift=bob;
 // Low, grounded shoes and animated legs
 b(10+gait,55,11,9,'#262c39');b(24-gait,55,11,9,'#262c39');
 b(11+gait,61,12,4,'#151e28');b(24-gait,61,12,4,'#151e28');
 b(11+gait,53,10,5,'#4b5361');b(25-gait,53,9,5,'#4b5361');
 b(12,34+shift,23,21,'#252b35');
 b(14,35+shift,18,19,'#46505c');
 b(19,37+shift,7,10,'#616778');
 b(20,47+shift,5,3,'#f1c6ab');
 b(10,38+shift,6,16,'#353942');b(31,38+shift,6,16,'#353942');
 b(9,51+shift,7,5,'#191e2b');b(30,51+shift,7,5,'#191e2b');
 if(sleeve){
  b(31,40+shift,7,16,'#29323a');
  b(34,40+shift-sleeve,7,15,'#414653');
  b(33,37+shift-sleeve,8,5,'#2e303b');
 }
 // Large, ORIGINAL animal masks. Fox orange pointy ears vs rabbit long ears.
 b(9,15+shift,27,24,'#262b39');
 if(mask==='fox'){
  b(7,8+shift,9,15,'#9e5c66');b(8,6+shift,7,15,'#e59c73');
  b(28,8+shift,9,15,'#9e5c66');b(30,6+shift,7,15,'#e59c73');
  b(8,18+shift,29,16,'#c7816d');
  b(11,16+shift,22,15,'#ecb181');
  b(12,25+shift,20,10,'#f3d9b6');
  b(20,29+shift,5,4,'#313548');
  b(13,21+shift,7,3,'#25293a');b(26,21+shift,7,3,'#25293a');
  b(17,25+shift,4,2,'#fff1da');b(26,25+shift,4,2,'#fff1da');
 }else{
  b(10,2+shift,10,21,'#ddd5da');b(24,0+shift,10,24,'#ddd5da');
  b(12,5+shift,5,16,'#d99ba9');b(27,4+shift,5,17,'#d99ba9');
  b(10,17+shift,25,19,'#c8c4d0');
  b(13,20+shift,19,17,'#f1e9e6');
  b(14,23+shift,6,3,'#292e40');b(25,23+shift,6,3,'#292e40');
  b(21,30+shift,4,3,'#bb839b');
  b(19,32+shift,8,2,'#685366');
 }
 b(8,35+shift,29,4,'#2c2e3d');
 return canvas;
}
export function installRescueAbductionTextures(scene:Phaser.Scene){
 for(const door of [false,true]){
  const key=vanTexture(door);
  if(!scene.textures.exists(key))scene.textures.addCanvas(key,paintRescueVan(door));
 }
 for(const mask of ['fox','rabbit'] as const)
  for(const pose of ['idle','walk','grab'] as const)
   for(let f=0;f<3;f++){
    const key=captorTexture(mask,pose,f);
    if(!scene.textures.exists(key))scene.textures.addCanvas(key,paintMaskedCaptor(mask,pose,f));
   }
}
