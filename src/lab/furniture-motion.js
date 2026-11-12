import {poseFurniture,overlaps} from './world.js';
export const FURNITURE_SECONDS=.42;

const ease=t=>t*t*(3-2*t);

function doorEase(u,opening){
 if(!opening){
  const approach=.90,contact=.84;
  return u<contact?approach*ease(u/contact):approach+(1-approach)*ease((u-contact)/(1-contact));
 }
 if(u<.84){
  const s=u/.84;
  return 1.024*(s*s*(3-2*s));
 }
 const s=(u-.84)/.16;
 return 1.024-.024*(s*s*(3-2*s));
}

export function sweepClear(object,from,to,player){
 if(!player)return true;
 const start=object.amount||0,steps=Math.max(1,Math.ceil(Math.abs(to-from)*Math.abs(object.slideDistance||1)/.035));
 let clear=true;
 for(let i=0;i<=steps;i++){
  poseFurniture(object,from+(to-from)*i/steps);
  if([object.box,...(object.parts||[]).map(p=>p.box)].some(box=>overlaps(box,player.x,player.y,player.z,.18,player.crouched?1.04:1.64))){clear=false;break;}
 }
 poseFurniture(object,start);return clear;
}

export function animateFurniture(object,open,{player=null,reducedMotion=false}={}){
 if(object.motion)return {started:false,reason:'moving'};
 const target=open?1:0,from=object.amount||0;
 if(from===target)return {started:false,reason:'settled'};
 if(!sweepClear(object,from,target,player))return {started:false,reason:'blocked'};
 if(reducedMotion){
  poseFurniture(object,target);
  object.open=open;
  object.state=open?'open':'closed';
  return {started:true,complete:true};
 }
 object.motion={from,target,elapsed:0,speed:0};
 object.state=open?'opening':'closing';
 return {started:true,complete:false};
}

export function updateFurniture(objects,delta,player=null){
 let changed=false;
 const dt=Math.max(0,Math.min(.1,delta));
 for(const object of objects){
  const motion=object.motion;if(!motion)continue;
  const elapsed=Math.min(FURNITURE_SECONDS,motion.elapsed+dt);
  const u=elapsed/FURNITURE_SECONDS;
  const factor=object.kind==='door'?doorEase(u,motion.target===1):ease(u);
  const amount=motion.from+(motion.target-motion.from)*factor;
  if(!sweepClear(object,object.amount,amount,player))continue;
  const prevAmount=object.amount||0;
  motion.speed=dt>0?Math.abs(amount-prevAmount)/dt:0;
  motion.elapsed=elapsed;
  poseFurniture(object,amount);
  changed=true;
  if(elapsed>=FURNITURE_SECONDS){
   object.open=motion.target===1;
   object.state=object.open?'open':'closed';
   object.motion=null;
   poseFurniture(object,motion.target);
  }
 }
 return changed;
}
