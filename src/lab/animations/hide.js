import {setJoint} from '../character-rig.js';

export function sampleHide(time,out,{reduced=false}={}){
 out.fill(0);
 const breath=reduced?0:Math.sin(time*Math.PI*2/4.0);
 // Postura fetal/recogida para el armario o bajo la cama
 setJoint(out,'root',0,0,0,0,-.38,0);
 setJoint(out,'body',.42,0,0,0,breath*.004,0);
 setJoint(out,'head',.32+breath*.006,0,0);
 // Rodillas flexionadas hacia el pecho
 for(const name of ['left','right']){
  setJoint(out,name+'Leg',-.88,0,0);
  setJoint(out,name+'Knee',1.62,0,0);
  setJoint(out,name+'Foot',-.74,0,0);
 }
 // Brazos abrazando el cuerpo
 setJoint(out,'leftArm',-.62,.36,.22);
 setJoint(out,'leftForearm',-.45,0,0);
 setJoint(out,'rightArm',-.62,-.36,-.22);
 setJoint(out,'rightForearm',-.45,0,0);
 return out;
}

