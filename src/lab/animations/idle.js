import {setJoint} from '../character-rig.js';

export function sampleIdle(time,out,{reduced=false}={}){
 out.fill(0);
 if(reduced)return out;
 const breath=Math.sin(time*Math.PI*2/3.4);
 const sway=Math.sin(time*Math.PI*2/4.8);
 // Sutil micro-parpadeo/asentimiento periódico cada ~3.5 s
 const blinkPhase=(time*0.28)%1;
 const blink=blinkPhase>0.93?Math.sin((blinkPhase-0.93)/0.07*Math.PI)*0.035:0;

 setJoint(out,'body',0,sway*.014,0,0,breath*.006,0);
 setJoint(out,'head',breath*.009+blink,0,-sway*.009);
 setJoint(out,'leftArm',0,0,breath*.009);
 setJoint(out,'rightHand',breath*.008,0,0);
 return out;
}
