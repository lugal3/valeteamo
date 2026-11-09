import {setJoint} from '../character-rig.js';

export function sampleHoldPhone(time,out,{reduced=false}={}){
 out.fill(0);
 const breath=reduced?0:Math.sin(time*Math.PI*2/3.4);
 setJoint(out,'body',0,0,0,0,breath*.004,0);
 // Cabeza inclinada hacia la derecha escuchando el teléfono
 setJoint(out,'head',.06+breath*.005,.08,-.24);
 // Brazo derecho flexionado llevando el teléfono a la oreja
 setJoint(out,'rightArm',-1.28,.32,.42);
 setJoint(out,'rightForearm',-1.62,.18,.10);
 setJoint(out,'rightHand',-.20,0,0);
 // Brazo izquierdo en reposo
 setJoint(out,'leftArm',.06,0,.08);
 return out;
}

