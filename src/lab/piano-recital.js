import {arm,ease,feet} from './animations/pose-tools.js';
import {setJoint} from './character-rig.js';
import {PIANO_PERFORMANCE} from './piano-performance.js';

export const PIANO_NOTES=['Do','Do♯','Re','Re♯','Mi','Fa','Fa♯','Sol','Sol♯','La','La♯','Si','Do agudo'];
export const PIANO_KEYS=['a','w','s','e','d','f','t','g','y','h','u','j','k'];
export const PIANO_WHITE=[0,2,4,5,7,9,11,12];
export const PIANO_INTRO_END=24;
export const PIANO_SHOW_END=63;
export const PIANO_REVEAL_SECONDS=2.55;
// Two seven-note phrases from the supplied recording.
export const PIANO_INTRO=[[16.035,1],[16.845,6],[17.285,8],[17.735,9],[18.085,8],[18.385,6],[18.785,2],
 [19.59,11],[21.39,11],[21.89,9],[22.24,8],[22.59,9],[22.89,8],[23.24,6]];
export const PIANO_PRACTICE=PIANO_PERFORMANCE.filter(([,right])=>right>=0).map(([time,right])=>[time,right]);
const scaleSteps=[0,0,1,1,2,3,3,4,4,5,5,6,7];
const SHARPS=new Set([1,3,6,8,10]);
export const PIANO_PAGE_SIZE=7;

export function pianoWindow(score,index){
 if(!index)return 0;
 return (score[index][0]-score[index-1][0])*1.45+.62;
}
export function pianoStaff(score,index){
 const first=Math.floor(index/PIANO_PAGE_SIZE)*PIANO_PAGE_SIZE;
 const items=score.slice(first,first+PIANO_PAGE_SIZE);
 const lines=Array.from({length:5},(_,i)=>'<line x1="14" y1="'+(23+i*7)+'" x2="254" y2="'+(23+i*7)+'"/>').join('');
 const notes=items.map(([,note],i)=>{
  const x=31+i*34,y=54-scaleSteps[note]*3.5;
  const ledger=y>=54?'<line x1="-8" y1="0" x2="8" y2="0"/>':'';
  return '<g data-score-note="'+(first+i)+'" transform="translate('+x+' '+y+')">'+ledger+
   (SHARPS.has(note)?'<text class="piano-sharp" x="-14" y="3">♯</text>':'')+
   '<ellipse rx="5" ry="3.5" transform="rotate(-18)"/><path d="M4 0v-17"/>'+
   '<text class="piano-note-name" x="0" y="'+(70-y)+'">'+PIANO_NOTES[note].replace(' agudo','↑')+'</text></g>';
 }).join('');
 return '<svg viewBox="0 0 268 76" preserveAspectRatio="none" aria-hidden="true">'+lines+notes+'</svg>';
}
export function pianoKeyboard(){
 return PIANO_NOTES.map((name,note)=>{
  const sharp=SHARPS.has(note);
  return '<button type="button" class="'+(sharp?'piano-black':'piano-white')+'" data-act="piano:'+note+
   '" style="--slot:'+(scaleSteps[note]+Number(sharp))+'" aria-label="'+name+' ('+PIANO_KEYS[note].toUpperCase()+')">'+name.replace(' agudo','↑')+
   '<small>'+PIANO_KEYS[note].toUpperCase()+'</small></button>';
 }).join('');
}
export function pianoPerformanceView(instrument,time,reduced){
 const {seat}=instrument;
 const animationTime=Math.max(0,time-PIANO_INTRO_END);
 const middle=reduced?0:ease(animationTime/5),wide=reduced?0:ease((animationTime-18)/11);
 if(time>=PIANO_SHOW_END){
  const panel=instrument.compartment[1].box,t=reduced?1:ease((time-PIANO_SHOW_END)/.65);
  const x=seat.x+.57-t*.02,y=instrument.floor+1.42-t*.20,z=panel.z+.50-t*.25;
  return pianoAim(x,y,z,panel.x+.06,panel.y+.08,panel.z);
 }
 return pianoAim(seat.x+1.55-middle*.69+wide*.14,seat.y+.86+middle*.13+wide*.10,seat.z-1.56-middle*.21+wide*.20,
  seat.x-.31,seat.y-.23,seat.z+.10);
}
function pianoAim(x,y,z,tx,ty,tz){
 return {x,y,z,yaw:Math.atan2(tx-x,tz-z),pitch:Math.atan2(ty-y,Math.hypot(tx-x,tz-z))};
}
export function pianoStandingView(instrument){
 const key=instrument.reward;
 return pianoAim(instrument.seat.x+.83,instrument.floor+1.63,key.z,key.x,key.y,key.z);
}
export function samplePianoPose(instrument,hands,out){
 out.fill(0);
 feet(out,{y:-.10,left:[-.16,.115,.23],right:[.16,.115,.23]});
 setJoint(out,'head',.10,0,0);
 const {seat}=instrument;
 for(const [side,{z,y,x,flex,roll}] of [['left',hands[0]],['right',hands[1]]]){
  arm(out,side,[z-seat.z,y-instrument.floor+.10,Math.max(.14,seat.x-x)],[.18+flex,0,roll],.58);
 }
 return out;
}
