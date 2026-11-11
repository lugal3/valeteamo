import {setJoint} from '../character-rig.js';
import {arm,feet,curve,ease} from './pose-tools.js';

export const EMOTES=Object.freeze([
 {id:'six-seven',label:'6–7',key:'6',duration:7.5},
 {id:'gangnam',label:'Gangnam',key:'7',duration:7},
 {id:'wave',label:'Saludar',key:'8',duration:2.4}
]);
const alternation=[[0,-1],[.10,-1],[.38,1],[.48,1],[.76,-1]];
const bounce=[[0,-.012],[.12,-.034],[.24,-.012]];
const leftHop=[[0,0],[.12,.055],[.24,0],[.36,.038],[.48,0],[.96,0]];
const rightHop=[[0,0],[.48,0],[.60,.055],[.72,0],[.84,.038],[.96,0]];
const weightShift=[[0,0],[.12,1],[.36,1],[.48,0],[.60,-1],[.84,-1],[.96,0]];
export function sampleEmote(id,time,out,{reduced=false,envelope=true}={}){
 out.fill(0);const clip=EMOTES.find(e=>e.id===id);if(!clip)return out;
 const weight=envelope?ease(time/.30)*ease((clip.duration-time)/.38):1;
 if(!weight)return out;
 if(id==='six-seven'){
  // Alternating palms have held accents, a travelling lift and a delayed head response.
  const t=Math.max(0,time-.30),beat=reduced?0:curve(alternation,t%.76),follow=reduced?0:curve(alternation,Math.max(0,t-.08)%.76);
  feet(out,{x:follow*.010,y:-.012});
  arm(out,'left',[-.385,.81+beat*.075,.245+beat*.012],[.10,0,-.10]);
  arm(out,'right',[.385,.81-beat*.075,.245-beat*.012],[.10,0,.10]);
  setJoint(out,'body',-.015,follow*.045,-follow*.018);
  setJoint(out,'head',-.025,-follow*.035,follow*.025);
 }else if(id==='gangnam'){
  // Repeat the horseback steps through the entire clip. Support shoes stay planted.
  const t=Math.max(0,time-.32),phase=reduced?0:t%.96,shift=reduced?0:curve(weightShift,phase),sink=reduced?-.025:curve(bounce,t%.24);
  feet(out,{x:shift*.014,y:sink,left:[-.185,.11+(reduced?0:curve(leftHop,phase)),.005],right:[.185,.11+(reduced?0:curve(rightHop,phase)),.005]});
  const pump=reduced?0:curve([[0,0],[.12,1],[.24,0]],t%.24);
  arm(out,'left',[-.047,.815-pump*.012,.245+pump*.010],[0,.15,-.25],true);
  arm(out,'right',[.047,.855-pump*.012,.245+pump*.010],[0,-.15,.25],true);
  // A short second phrase releases the right wrist into a lasso beside the head.
  const flourish=reduced?0:ease((time-2.75)/.30)*ease((4.65-time)/.30);
  if(flourish){const angle=(time-2.75)*Math.PI*4,target=[.047+flourish*(.49+.025*Math.cos(angle)),.855+flourish*(.13+.035*Math.sin(angle)),.245-flourish*.16];arm(out,'right',target,[.15,0,.25+flourish*.5*Math.sin(angle)],true);}
  setJoint(out,'body',.035+pump*.015,shift*.055,-shift*.025);
  setJoint(out,'head',-.025-pump*.012,-shift*.025,shift*.025);
 }else{
  const wave=reduced?0:curve([[0,-1],[.20,1],[.40,-1]],Math.max(0,time-.3)%.4);
  feet(out,{y:-.01});arm(out,'left',[-.37,.56,.08]);arm(out,'right',[.57,1.015,.10],[0,0,-.25+wave*.28]);setJoint(out,'head',-.015,0,-.045);
 }
 for(let i=0;i<out.length;i++)out[i]*=weight;
 return out;
}
