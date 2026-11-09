import {setJoint} from '../character-rig.js';
export function sampleIdle(time,out,{reduced=false}={}){
 out.fill(0);if(reduced)return out;
 const breath=Math.sin(time*Math.PI*2/3.6),sway=Math.sin(time*Math.PI*2/5.2);
 setJoint(out,'body',0,sway*.014,0,0,breath*.005,0);
 setJoint(out,'head',breath*.009,0,-sway*.009);
 setJoint(out,'leftArm',0,0,breath*.009);
 setJoint(out,'rightHand',breath*.008,0,0);
 return out;
}
