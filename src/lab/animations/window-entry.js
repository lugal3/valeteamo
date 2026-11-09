import {setJoint} from '../character-rig.js';
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
// The active first-person cinematic reuses these grip anchors. A full-body clip
// shares the same normalized timeline for a future external camera shot.
export function windowEntryHands(progress){
 const t=Math.max(0,Math.min(1,progress)),reach=ease((t-.12)/.14),release=ease((t-.62)/.12);
 return t>.12&&t<.74?[{x:1.73,y:.78+reach*.22,z:12.3-reach*.18+release*.2},{x:2.68,y:.76+reach*.24,z:12.3-reach*.18+release*.2}]:null;
}
export function sampleWindowEntry(progress,out){
 out.fill(0);const t=Math.max(0,Math.min(1,progress)),grip=ease((t-.12)/.20)*(1-ease((t-.70)/.26)),climb=ease((t-.35)/.17)*(1-ease((t-.65)/.22));
 setJoint(out,'body',-.20*climb,0,0,0,-.07*climb,0);setJoint(out,'head',.13*climb);
 setJoint(out,'leftArm',-1.30*grip);setJoint(out,'rightArm',-1.05*grip);
 setJoint(out,'leftForearm',-.18*grip);setJoint(out,'rightForearm',-.24*grip);
 setJoint(out,'leftLeg',-.85*climb);setJoint(out,'leftKnee',1.15*climb);
 setJoint(out,'rightLeg',-.40*climb);setJoint(out,'rightKnee',.65*climb);
 return out;
}
