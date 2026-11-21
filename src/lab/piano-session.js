import {guidePiano,posePianoCompartment,posePianoReward} from './house-additions.js';
import {ease} from './animations/pose-tools.js';
import {PIANO_PERFORMANCE} from './piano-performance.js';
import {PIANO_INTRO,PIANO_INTRO_END,PIANO_SHOW_END,PIANO_REVEAL_SECONDS,PIANO_PRACTICE,
 PIANO_NOTES,PIANO_PAGE_SIZE,pianoWindow,pianoStaff,pianoPerformanceView,pianoStandingView} from './piano-recital.js';

const clamp=value=>Math.max(0,Math.min(1,value));
export class PianoSession{
 constructor(object,dialog,sound,reward){
  Object.assign(this,{object,dialog,sound,reward,pressed:new Map(),hands:[null,null],handNotes:[2,9],strikes:[null,null],now:0,last:null});
  this.staff=dialog.querySelector('.piano-score');
  this.pageLabel=dialog.querySelector('.piano-page-label');
  this.keys=[...dialog.querySelectorAll('[data-act^="piano:"]')];
  this.line=dialog.querySelector('.piano-time i');
  this.result=dialog.querySelector('.piano-result');
  this.start(!object.scorePlaced?'free':object.solved?'practice':'intro');
 }
 stage(mode,label=''){
  this.dialog.dataset.pianoMode=mode;
  this.result.textContent=label;
 }
 start(mode){
  if(mode==='practice'&&!this.object.solved)return;
  this.sound.stopPiano();
  this.mode=mode;
  this.score=mode==='practice'?PIANO_PRACTICE:PIANO_INTRO;
  this.page=-1;this.index=0;this.deadline=0;
  this.stage(mode,mode==='free'?'Encuentra la partitura en la caja fuerte del dormitorio para iniciar el reto.':
   mode==='practice'?'Práctica guiada · Toca la primera nota':'Toca la nota iluminada y sigue la línea de tiempo');
  if(mode!=='free')this.guide();
 }
 guide(){
  const page=Math.floor(this.index/PIANO_PAGE_SIZE);
  if(this.page!==page){this.page=page;this.staff.innerHTML=pianoStaff(this.score,this.index);}
  this.pageLabel.textContent='Hoja '+(page+1)+' de '+Math.ceil(this.score.length/PIANO_PAGE_SIZE);
  const [,note]=this.score[this.index];
  this.staff.querySelector('[aria-current]')?.removeAttribute('aria-current');
  this.staff.querySelector('[data-score-note="'+this.index+'"]').setAttribute('aria-current','step');
  this.staff.setAttribute('aria-label','Partitura · '+(this.index+1)+' de '+this.score.length+' · '+PIANO_NOTES[note]);
  this.dialog.querySelector('.piano-keys [aria-current]')?.removeAttribute('aria-current');
  this.keys[note].setAttribute('aria-current','step');
  guidePiano(this.object,note,this.mode==='intro'?this.index%PIANO_PAGE_SIZE:-1,this.mode==='intro'?page:0);
 }
 reset(message){
  this.index=this.mode==='intro'?this.page*PIANO_PAGE_SIZE:0;this.deadline=0;
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
  this.strikes[hand]={at:this.now,from:this.hands[hand]};
  this.handNotes[hand]=note;
  this.keys[note].classList.add('pressed');
 }
 press(note,now){
  if(!['intro','practice','free'].includes(this.mode)||!this.object.keys[note])return;
  this.tick(now);
  if(this.expire())return;
  this.strike(note);
  this.sound.piano(note);
  if(this.mode==='free')return;
  const [time,expected]=this.score[this.index];
  if(note!==expected){
   this.reset('Nota equivocada · vuelve a la primera nota');return;
  }
  const next=this.score[++this.index];
  if(next){
   const turn=this.mode==='intro'&&this.index%PIANO_PAGE_SIZE===0;
   this.deadline=turn?0:this.now+pianoWindow(this.score,this.index);
   this.result.textContent=turn?'Primera hoja completa · Sigue con la segunda':'';
   this.guide();return;
  }
  guidePiano(this.object);
  if(this.mode==='practice'){
   this.complete('Pieza completa');return;
  }
  this.sound.pianoSegment(PIANO_INTRO_END,PIANO_SHOW_END,PIANO_INTRO_END-time);
  this.mode='performance';this.sourceTime=time;
  this.cue=PIANO_PERFORMANCE.findIndex(([at])=>at>=PIANO_INTRO_END);
  this.stage('lead','Kitty enlaza la melodía…');
 }
 expire(){
  if(!this.deadline||this.now<this.deadline)return false;
  this.reset('Se acabó el tiempo · vuelve a la primera nota');return true;
 }
 complete(label){
  this.mode='complete';
  this.stage('complete',label);
  this.dialog.querySelector('[data-act="close"]').focus({preventScroll:true});
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
  const audioTime=this.sourceTime<PIANO_SHOW_END?this.sound.pianoTime(PIANO_INTRO_END):null;
  this.sourceTime=audioTime??(this.sourceTime+dt);
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
   this.stage('reveal','Se abre el cajón secreto');
   this.sound.pianoReveal('drawer');
  }
  const reveal=time-PIANO_SHOW_END;
  posePianoCompartment(this.object,clamp((reveal-.14)/.66));
  posePianoReward(this.object,reveal,reduced);
  if(reveal>=.66&&!this.keySound){this.keySound=true;this.sound.pianoReveal('key');}
  if(reveal<PIANO_REVEAL_SECONDS)return;
  this.object.solved=true;posePianoReward(this.object);this.reward();
  return pianoStandingView(this.object);
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
   const key=object.keys[note],strike=this.strikes[side],age=strike?now-strike.at:1;
   const reach=reduced?1:ease(age/.105),accent=Math.sin(Math.PI*clamp(age/.19));
   const travel=strike?.from?key.z-strike.from.z:0;
   const target={x:key.x+.12-.022*accent,y:key.y+.058,z:key.z,
    flex:accent*.28,roll:reduced?0:Math.max(-.27,Math.min(.27,travel*.8))*accent};
   if(strike?.from&&!reduced){
    for(const axis of ['x','y','z'])target[axis]=strike.from[axis]+(target[axis]-strike.from[axis])*reach;
    target.y+=Math.sin(Math.PI*reach)*(.030+Math.min(Math.abs(travel),.28)*.16);
   }
   this.hands[side]=target;return target;
  });
  const reveal=automatic&&this.sourceTime>=PIANO_SHOW_END;
  const drawerTime=this.sourceTime-PIANO_SHOW_END;
  const pulling=reveal&&!reduced&&drawerTime<.73;
  if(pulling){
   const knob=object.compartment[2].box,reach=ease(drawerTime/.24),withdraw=ease((drawerTime-.53)/.20);
   hands[0]=null;
   hands[1]={x:knob.x+.06+(1-reach+withdraw)*.26,y:knob.y+.015-withdraw*.22,z:knob.z+.03,flex:.34,roll:-.22};
  }
  const seat={...object.seat,x:object.seat.x+.15,pitch:-.28};
  const view=automatic?pianoPerformanceView(object,this.sourceTime,reduced):seat;
  if(reveal&&!reduced){
   const standing=pianoStandingView(object),blend=ease((drawerTime-PIANO_REVEAL_SECONDS+.62)/.62);
   for(const axis of ['x','y','z','yaw','pitch'])view[axis]+=(standing[axis]-view[axis])*blend;
  }
  return {view,hands,actor:automatic&&!reveal,hideHands:reveal&&!pulling};
 }
 close(){
  this.sound.stopPiano();
  this.object.keys.forEach((key,i)=>key.y=this.object.keyHeights[i]);
  guidePiano(this.object);
  if(!this.object.solved)posePianoCompartment(this.object,0);
  posePianoReward(this.object);
  delete this.dialog.dataset.pianoMode;
 }
}
