import {createPose,JOINT_INDEX} from './character-rig.js';
import {sampleIdle} from './animations/idle.js';
import {sampleWalk,WALK_CYCLE} from './animations/walk.js';
import {sampleWindowEntry} from './animations/window-entry.js';
import {sampleCrouch} from './animations/crouch.js';
import {sampleHoldFlashlight} from './animations/hold-flashlight.js';
import {sampleHoldPhone} from './animations/hold-phone.js';
import {sampleListenDoor} from './animations/listen-door.js';
import {sampleHide} from './animations/hide.js';
import {sampleLookBehind} from './animations/look-behind.js';
import {EMOTES,sampleEmote} from './animations/emotes.js';
import {ease,blendPose} from './animations/pose-tools.js';

export class CharacterAnimator{
 constructor(){
  this.idle=createPose();
  this.walk=createPose();
  this.crouchPose=createPose();
  this.flashlightPose=createPose();
  this.phonePose=createPose();
  this.listenPose=createPose();
  this.hidePose=createPose();
  this.lookBehindPose=createPose();
  this.pose=createPose();
  this.emotePose=createPose();this.transitionPose=createPose();
  this.reset();
 }
 reset(){
  this.time=0;this.distance=0;this.weight=0;this.forward=1;this.side=0;
  this.reduced=false;this.evaluations=0;this.emote=null;this.emoteTime=0;this.transition=null;this.equipment='flashlight';this.speed=0;this.acceleration=0;
 }
 get performing(){return !!this.emote||!!this.transition;}
 captureTransition(){this.transitionPose.set(this.sample(this.equipment==='phone'?'hold-phone':'locomotion'));this.transition={age:0,duration:this.reduced ? .10 : .22};}
 startEmote(id){if(!EMOTES.some(e=>e.id===id))return false;this.captureTransition();this.emote=id;this.emoteTime=0;return true;}
 cancelEmote({immediate=false}={}){if(immediate){this.transition=null;}else if(this.emote)this.captureTransition();this.emote=null;this.emoteTime=0;}
 // This lightweight bookkeeping runs with simulation. Bone poses are sampled
 // only by a visible consumer (mirror now, cinematic/full-body shots later).
 advance(dt,{distance=0,forward=1,side=0,paused=false,reduced=false,equipment=this.equipment,emoteElapsed=null}={}){
  if(paused)return;
  dt=Math.max(0,Math.min(.1,dt));
  if(!dt)return;
  this.time+=dt;this.reduced=reduced;this.equipment=equipment;
  if(this.transition){this.transition.age+=dt;if(this.transition.age>=this.transition.duration)this.transition=null;}
  distance=Math.max(0,Number.isFinite(distance)?distance:0);
  const speed=distance/dt;this.acceleration=Math.max(-1,Math.min(1,(speed-this.speed)*.35));this.speed+=(speed-this.speed)*(1-Math.exp(-dt*10));
  if(this.emote){
   if(distance>.001)this.cancelEmote();
   else{
    // Use playback time when a sound is running so dropped frames do not slow the dance.
    this.emoteTime=Number.isFinite(emoteElapsed)?Math.max(this.emoteTime,emoteElapsed):this.emoteTime+dt;
    if(this.emoteTime>=EMOTES.find(e=>e.id===this.emote).duration)this.cancelEmote();
   }
  }
  this.distance+=distance;
  const walking=distance/dt>.035;
  this.weight+=(Number(walking)-this.weight)*(1-Math.exp(-dt*16));
  if(this.weight<.001)this.weight=0;
  if(walking){
   const current=Math.atan2(this.side,this.forward),target=Math.atan2(side,forward),turn=Math.atan2(Math.sin(target-current),Math.cos(target-current)),angle=current+turn*(1-Math.exp(-dt*14));
   this.forward=Math.cos(angle);this.side=Math.sin(angle);
  }
 }
 sample(clip='locomotion',progress=0){
  this.evaluations++;
  if(clip==='window-entry')return sampleWindowEntry(progress,this.pose);
  if(clip!=='look-behind'&&(this.emote||this.transition)){
   // Capture, sample and blend only when a visible consumer requests a pose.
   this.basePose(clip,progress);
   if(this.emote){sampleEmote(this.emote,this.emoteTime,this.emotePose,{reduced:this.reduced,envelope:false});const e=EMOTES.find(e=>e.id===this.emote),weight=ease(this.emoteTime/.30)*ease((e.duration-this.emoteTime)/.38);blendPose(this.pose,this.emotePose,weight,this.pose);}
   if(this.transition)blendPose(this.transitionPose,this.pose,ease(this.transition.age/this.transition.duration),this.pose);
   return this.pose;
  }
  return this.basePose(clip,progress);
 }
 basePose(clip,progress){
  if(clip==='crouch'){
   sampleCrouch(this.distance,this.crouchPose,{walking:this.weight>.05,forward:this.forward,side:this.side,reduced:this.reduced});
   this.pose.set(this.crouchPose);return this.pose;
  }
  if(clip==='hold-flashlight'){
   sampleHoldFlashlight(this.time,this.flashlightPose,{reduced:this.reduced});
   this.pose.set(this.flashlightPose);return this.pose;
  }
  if(clip==='hold-phone'){
   sampleHoldPhone(this.time,this.phonePose,{reduced:this.reduced});
   sampleWalk(this.distance,this.walk,{forward:this.forward,side:this.side,reduced:this.reduced});
   for(const name of ['root','leftLeg','leftKnee','leftFoot','rightLeg','rightKnee','rightFoot']){const j=JOINT_INDEX[name]*6;for(let i=j;i<j+6;i++)this.phonePose[i]=this.phonePose[i]*(1-this.weight)+this.walk[i]*this.weight;}
   this.pose.set(this.phonePose);return this.pose;
  }
  if(clip==='listen-door'){
   sampleListenDoor(this.time,this.listenPose,{reduced:this.reduced});
   this.pose.set(this.listenPose);return this.pose;
  }
  if(clip==='hide'){
   sampleHide(this.time,this.hidePose,{reduced:this.reduced});
   this.pose.set(this.hidePose);return this.pose;
  }
  if(clip==='look-behind'){
   sampleLookBehind(progress,this.lookBehindPose,{reduced:this.reduced});
   this.pose.set(this.lookBehindPose);return this.pose;
  }

  sampleIdle(this.time,this.idle,{reduced:this.reduced,handsFree:this.equipment==='empty'});
  if(clip==='idle'){this.pose.set(this.idle);return this.pose;}
  sampleWalk(this.distance,this.walk,{forward:this.forward,side:this.side,reduced:this.reduced,handsFree:this.equipment==='empty'});
  const weight=clip==='walk'?1:this.weight;
  blendPose(this.idle,this.walk,weight,this.pose);
  return this.pose;
 }
 snapshot(){
  return {state:this.emote|| (this.weight>.05?'walk':'idle'),emote:this.emote,emoteTime:this.emoteTime,transition:this.transition?{...this.transition}:null,performing:this.performing,time:this.time,distance:this.distance,phase:(this.distance/WALK_CYCLE)%1,weight:this.weight,speed:this.speed,acceleration:this.acceleration,forward:this.forward,side:this.side,evaluations:this.evaluations,reduced:this.reduced};
 }
}
