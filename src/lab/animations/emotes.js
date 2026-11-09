import {setJoint} from '../character-rig.js';

export const EMOTES=Object.freeze([
 {id:'six-seven',label:'6–7',key:'6',duration:3.4},
 {id:'gangnam',label:'Gangnam',key:'7',duration:5.2},
 {id:'wave',label:'Saludar',key:'8',duration:2.4}
]);
const smooth=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function sampleEmote(id,time,out,{reduced=false}={}){
 out.fill(0);const clip=EMOTES.find(e=>e.id===id);if(!clip)return out;
 const weight=smooth(time/.24)*smooth((clip.duration-time)/.32),speed=id==='gangnam'?7.5:5.5;
 const beat=reduced?0:Math.sin(time*speed),swing=reduced?0:Math.cos(time*speed);
 if(id==='six-seven'){
  setJoint(out,'leftArm',-1.1+beat*.6,0,-.32);setJoint(out,'leftForearm',-.55,0,beat*.16);
  setJoint(out,'rightArm',.5-beat*.6,0,.35);setJoint(out,'rightForearm',.4,0,-beat*.16);
  setJoint(out,'leftHand',0,0,-.35);setJoint(out,'rightHand',0,0,.35);setJoint(out,'head',0,beat*.07,beat*.045);
 }else if(id==='gangnam'){
  // Rest arms have opposite directions; asymmetric rotations meet the wrists.
  setJoint(out,'leftArm',-.15,-.12,1.18,0,0,.09);setJoint(out,'leftForearm',-.15,0,.1);setJoint(out,'leftHand',0,0,.4);
  setJoint(out,'rightArm',.1,.1,1.55);setJoint(out,'rightForearm',0,0,.18);setJoint(out,'rightHand',0,0,-.25);
  setJoint(out,'body',.03,beat*.12,swing*.035);setJoint(out,'root',0,0,0,0,Math.abs(beat)*.035,0);
  setJoint(out,'leftLeg',beat*.12,0,-.10);setJoint(out,'rightLeg',-beat*.12,0,.10);
  setJoint(out,'leftKnee',Math.max(0,-beat)*-.2);setJoint(out,'rightKnee',Math.max(0,beat)*-.2);setJoint(out,'head',-.025,0,-swing*.06);
 }else{
  setJoint(out,'rightArm',-.5,0,-.6);setJoint(out,'rightForearm',-.35,0,-.15+beat*.25);setJoint(out,'rightHand',0,0,beat*.25);setJoint(out,'head',0,0,-.07);
 }
 for(let i=0;i<out.length;i++)out[i]*=weight;
 return out;
}
