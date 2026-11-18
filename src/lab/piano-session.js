import {guidePiano,posePianoCompartment} from './house-additions.js';
import {PIANO_PERFORMANCE} from './piano-performance.js';
import {PIANO_INTRO,PIANO_INTRO_END,PIANO_SHOW_END,PIANO_REVEAL_SECONDS,PIANO_PRACTICE,PIANO_PRACTICE_END,
 PIANO_NOTES,pianoWindow,pianoStaff,pianoPerformanceView} from './piano-recital.js';

const clamp=value=>Math.max(0,Math.min(1,value));
export class PianoSession{
 constructor(object,dialog,sound,reward){
  Object.assign(this,{object,dialog,sound,reward,pressed:new Map(),hands:[null,null],handNotes:[2,9],now:0,last:null});
  this.staff=dialog.querySelector('.piano-score');
  this.keys=[...dialog.querySelectorAll('[data-act^="piano:"]')];
  this.line=dialog.querySelector('.piano-time i');
  this.result=dialog.querySelector('.piano-result');
  this.practiceButton=dialog.querySelector('[data-act="piano-practice"]');
  this.start(object.solved?'practice':'intro');
 }
 stage(mode,label=''){
  this.dialog.dataset.pianoMode=mode;
  this.result.textContent=label;
 }
 start(mode){
  if(mode==='practice'&&!this.object.solved)return;
  this.sound.stopPiano();
  this.mode=mode;
  this.completeView=null;
  this.score=mode==='practice'?PIANO_PRACTICE:PIANO_INTRO;
  this.page=-1;this.index=0;this.deadline=0;
  this.practiceButton.hidden=true;
  this.stage(mode,mode==='practice'?'Práctica guiada · Toca la primera nota':'Toca la nota iluminada y sigue la línea de tiempo');
  this.guide();
 }
 guide(){
  const page=Math.floor(this.index/7);
  if(this.page!==page){this.page=page;this.staff.innerHTML=pianoStaff(this.score,this.index);}
  const [,note]=this.score[this.index];
  this.staff.querySelector('[aria-current]')?.removeAttribute('aria-current');
  this.staff.querySelector('[data-score-note="'+this.index+'"]').setAttribute('aria-current','step');
  this.staff.setAttribute('aria-label','Partitura · '+(this.index+1)+' de '+this.score.length+' · '+PIANO_NOTES[note]);
  this.dialog.querySelector('.piano-keys [aria-current]')?.removeAttribute('aria-current');
  this.keys[note].setAttribute('aria-current','step');
  guidePiano(this.object,note,this.mode==='intro'?this.index:-1);
 }
 reset(message){
  this.index=0;this.deadline=0;
  this.result.textContent=message;
  this.guide();
 }
 tick(now){
  const dt=this.last===null?0:Math.max(0,(now-this.last)/1000);
  this.last=now;this.now+=dt;
  return dt;
 }
 strike(note,hand=note<5?0:1){
  this.pressed.set(note,this.now);
  this.handNotes[hand]=note;
  this.keys[note].classList.add('pressed');
 }
 press(note,now){
  if(!['intro','practice'].includes(this.mode)||!this.object.keys[note])return;
  this.tick(now);
  if(this.expire())return;
  this.strike(note);
  const [time,expected]=this.score[this.index];
  if(note!==expected){
   const sample=PIANO_PERFORMANCE.find(([,right])=>right===note%12)?.[0];
   if(sample!==undefined)this.sound.pianoSegment(sample,sample+.25,note,note===12?2:1);
   else {this.sound.stopPiano();this.sound.piano(note);}
   this.reset('Nota equivocada · vuelve a la primera nota');return;
  }
  const next=this.score[++this.index];
  if(next){
   this.sound.pianoSegment(time,next[0],note);
   this.deadline=this.now+pianoWindow(this.score,this.index);
   this.result.textContent='';this.guide();return;
  }
  guidePiano(this.object);
  if(this.mode==='practice'){
   this.sound.pianoSegment(time,PIANO_PRACTICE_END,note);
   this.complete('Pieza completa');return;
  }
  this.sound.pianoSegment(time,PIANO_SHOW_END,note);
  this.mode='performance';this.sourceTime=time;this.performanceStart=time;
  this.cue=PIANO_PERFORMANCE.findIndex(([at])=>at>time);
  this.stage('lead','Kitty enlaza la melodía…');
 }
 expire(){
  if(!this.deadline||this.now<this.deadline)return false;
  this.sound.stopPiano();
  this.reset('Se acabó el tiempo · vuelve a la primera nota');return true;
 }
 complete(label){
  this.mode='complete';
  this.stage('complete',label);
  this.practiceButton.hidden=false;
  this.practiceButton.focus({preventScroll:true});
 }
 advance(now,running,reduced){
  if(!running){this.last=null;return;}
  const dt=this.tick(now);
  if(this.mode==='intro'||this.mode==='practice'){
   this.expire();
   const remaining=this.deadline?clamp((this.deadline-this.now)/pianoWindow(this.score,this.index)):1;
   this.line.style.transform='scaleX('+remaining+')';
  }
  if(this.mode!=='performance')return;
  this.sourceTime=this.sound.pianoTime(this.performanceStart)??(this.sourceTime+dt);
  const time=this.sourceTime;
  if(time<PIANO_SHOW_END){
   while(this.cue>=0&&PIANO_PERFORMANCE[this.cue]?.[0]<=time){
    const [,right,left]=PIANO_PERFORMANCE[this.cue++];
    if(right>=0){this.strike(right,1);if(!this.sound.pianoBuffer)this.sound.piano(right);}
    if(left>=0)this.strike(left,0);
   }
   if(time>=PIANO_INTRO_END&&this.dialog.dataset.pianoMode!=='recital')this.stage('recital','Kitty toca el resto de la melodía…');
   return;
  }
  if(this.dialog.dataset.pianoMode!=='reveal'){
   this.stage('reveal','Se abre un compartimento');
   this.sound.pianoReveal();
  }
  const reveal=time-PIANO_SHOW_END;
  const lift=reduced?0:Math.sin(Math.PI*clamp((reveal-.48)/.81))*.14;
  posePianoCompartment(this.object,clamp((reveal-.14)/.66),lift);
  if(reveal<PIANO_REVEAL_SECONDS)return;
  this.object.solved=true;this.reward();
  this.completeView=pianoPerformanceView(this.object,time,true);
  this.complete('Melodía completa · Pista en la mochila.');
 }
 pose(reduced){
  const {object,now}=this;
  for(const [note,at] of this.pressed){
   const progress=clamp((now-at)/.19);
   object.keys[note].y=object.keyHeights[note]-Math.sin(progress*Math.PI)*.030;
   if(progress===1){this.pressed.delete(note);this.keys[note].classList.remove('pressed');}
  }
  const automatic=this.mode==='performance'&&this.sourceTime>=PIANO_INTRO_END;
  const hands=this.handNotes.map((note,side)=>{
   const key=object.keys[note],target={x:key.x+.12,y:key.y+.056,z:key.z};
   const previous=this.hands[side];
   if(automatic&&previous&&!reduced){
    for(const axis of ['x','y','z'])target[axis]=previous[axis]+(target[axis]-previous[axis])*.64;
   }
   this.hands[side]=target;return target;
  });
  const reveal=automatic&&this.sourceTime>=PIANO_SHOW_END;
  const seat={...object.seat,x:object.seat.x+.15,pitch:-.28};
  const view=automatic?pianoPerformanceView(object,this.sourceTime,reduced):this.completeView||seat;
  return {view,hands,actor:automatic&&!reveal,hideHands:reveal||!!this.completeView};
 }
 close(){
  this.sound.stopPiano();
  this.object.keys.forEach((key,i)=>key.y=this.object.keyHeights[i]);
  guidePiano(this.object);
  if(!this.object.solved)posePianoCompartment(this.object,0);
  delete this.dialog.dataset.pianoMode;
 }
}
