import {setJoint} from '../character-rig.js';

export function sampleHoldFlashlight(time,out,{reduced=false}={}){
 out.fill(0);
 const breath=reduced?0:Math.sin(time*Math.PI*2/3.4);
 setJoint(out,'body',0,0,0,0,breath*.004,0);
 setJoint(out,'head',breath*.006,0,0);
 // Brazo derecho extendido apuntando linterna hacia adelante
 setJoint(out,'rightArm',-.68,.14,.12);
 setJoint(out,'rightForearm',-.38,0,0);
 setJoint(out,'rightHand',.08,0,0);
 // Brazo izquierdo suelto
 setJoint(out,'leftArm',.05,0,.08);
 return out;
}

