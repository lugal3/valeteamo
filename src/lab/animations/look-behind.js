import {setJoint} from '../character-rig.js';

export function sampleLookBehind(progress,out,{reduced=false}={}){
 out.fill(0);
 const p=Math.max(0,Math.min(1,progress));
 if(reduced&&p===0)return out;
 // Torso rota hacia la derecha sobre el hombro
 setJoint(out,'body',0,-.52*p,0);
 // Cabeza gira aún más para mirar hacia atrás
 setJoint(out,'head',-.07*p,-.82*p,.06*p);
 // Brazos compensan sutilmente el giro del torso
 setJoint(out,'leftArm',0,0,-.12*p);
 setJoint(out,'rightArm',0,0,.12*p);
 return out;
}

