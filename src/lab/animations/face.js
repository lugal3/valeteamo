import {ease} from './pose-tools.js';

const blinkStarts=[1.22,3.94,6.16,6.45,9.63];
const loopSeconds=12.48;

// Closure is sampled from the shot or character clock, so pause and seeking stay deterministic.
export function sampleBlink(time,{reduced=false,firstAt=blinkStarts[0]}={}){
 if(reduced)return 0;
 const clock=time+blinkStarts[0]-firstAt;
 const phase=((clock%loopSeconds)+loopSeconds)%loopSeconds;
 for(const start of blinkStarts){
  const age=phase-start;
  if(age>=0&&age<.19)return ease(age/.068)*ease((.19-age)/.102);
 }
 return 0;
}
