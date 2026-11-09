import {createPose} from './character-rig.js';
import {sampleIdle} from './animations/idle.js';
import {sampleWalk,WALK_CYCLE} from './animations/walk.js';
import {sampleWindowEntry} from './animations/window-entry.js';
import {sampleCrouch} from './animations/crouch.js';
import {sampleHoldFlashlight} from './animations/hold-flashlight.js';
import {sampleHoldPhone} from './animations/hold-phone.js';
import {sampleListenDoor} from './animations/listen-door.js';
import {sampleHide} from './animations/hide.js';
import {sampleLookBehind} from './animations/look-behind.js';

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
  this.reset();
 }
 reset(){
  this.time=0;this.distance=0;this.weight=0;this.forward=1;this.side=0;
  this.reduced=false;this.evaluations=0;
 }
 // This lightweight bookkeeping runs with simulation. Bone poses are sampled
 // only by a visible consumer (mirror now, cinematic/full-body shots later).
 advance(dt,{distance=0,forward=1,side=0,paused=false,reduced=false}={}){
  if(paused)return;
  dt=Math.max(0,Math.min(.1,dt));
  if(!dt)return;
  this.time+=dt;this.reduced=reduced;
  distance=Math.max(0,Number.isFinite(distance)?distance:0);
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

  sampleIdle(this.time,this.idle,{reduced:this.reduced});
  if(clip==='idle'){this.pose.set(this.idle);return this.pose;}
  sampleWalk(this.distance,this.walk,{forward:this.forward,side:this.side,reduced:this.reduced});
  const weight=clip==='walk'?1:this.weight;
  for(let i=0;i<this.pose.length;i++)this.pose[i]=this.idle[i]*(1-weight)+this.walk[i]*weight;
  return this.pose;
 }
 snapshot(){
  return {state:this.weight>.05?'walk':'idle',time:this.time,distance:this.distance,phase:(this.distance/WALK_CYCLE)%1,weight:this.weight,forward:this.forward,side:this.side,evaluations:this.evaluations,reduced:this.reduced};
 }
}
