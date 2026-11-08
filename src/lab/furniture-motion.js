import {poseFurniture,overlaps} from './world.js';
export const FURNITURE_SECONDS=.42;
const ease=t=>t*t*(3-2*t);
export function sweepClear(object,from,to,player){
 if(!player)return true;
 const start=object.amount||0,steps=Math.max(1,Math.ceil(Math.abs(to-from)*Math.abs(object.slideDistance)/.035));
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
 if(reducedMotion){poseFurniture(object,target);object.open=open;object.state=open?'open':'closed';return {started:true,complete:true};}
 object.motion={from,target,elapsed:0};object.state=open?'opening':'closing';
 return {started:true,complete:false};
}
export function updateFurniture(objects,delta,player=null){
 let changed=false;
 for(const object of objects){
  const motion=object.motion;if(!motion)continue;
  const elapsed=Math.min(FURNITURE_SECONDS,motion.elapsed+Math.max(0,Math.min(.1,delta)));
  const amount=motion.from+(motion.target-motion.from)*ease(elapsed/FURNITURE_SECONDS);
  if(!sweepClear(object,object.amount,amount,player))continue;
  motion.elapsed=elapsed;poseFurniture(object,amount);changed=true;
  if(elapsed>=FURNITURE_SECONDS){object.open=motion.target===1;object.state=object.open?'open':'closed';object.motion=null;poseFurniture(object,motion.target);}
 }
 return changed;
}
