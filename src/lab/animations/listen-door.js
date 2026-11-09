import {setJoint} from '../character-rig.js';

export function sampleListenDoor(time,out,{reduced=false}={}){
 out.fill(0);
 const breath=reduced?0:Math.sin(time*Math.PI*2/3.4);
 setJoint(out,'root',0,0,0,0,0,.06);
 // Cuerpo inclinado adelante y rotado ligeramente
 setJoint(out,'body',.14,.12,0,0,breath*.004,0);
 // Oreja pegada a la puerta
 setJoint(out,'head',.06,.36,-.14);
 // Mano izquierda apoyada en la superficie de la puerta
 setJoint(out,'leftArm',-.76,-.18,-.12);
 setJoint(out,'leftForearm',-.52,0,0);
 setJoint(out,'leftHand',.28,0,0);
 // Brazo derecho hacia abajo para mantener equilibrio
 setJoint(out,'rightArm',-.10,0,.12);
 return out;
}

