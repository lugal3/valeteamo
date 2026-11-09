import {setJoint} from '../character-rig.js';

export function sampleHoldPhone(time,out,{reduced=false}={}){
 out.fill(0);
 const breath=reduced?0:Math.sin(time*Math.PI*2/3.4);
 setJoint(out,'body',0,0,0,0,breath*.004,0);
 // Mirada hacia la pantalla sostenida delante del pecho.
 setJoint(out,'head',.12+breath*.005,-.08,.035);
 // Ajustes sobre el brazo flexionado del modelo, sin doblar dos veces el codo.
 setJoint(out,'rightArm',-.14,.12,.08);
 setJoint(out,'rightForearm',-.22,0,-.08);
 setJoint(out,'rightHand',.10,-.18,0);
 // Brazo izquierdo en reposo
 setJoint(out,'leftArm',.06,0,.08);
 return out;
}

