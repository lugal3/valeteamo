// Start from the same save format as an actual player. Indices distinguish the two 99% milestones.
import {HEIGHT} from './world.js';
// The story withdrawal happens when the hatch opens, after the piano.
// The isolated car preview is handled by the scenario metadata.
export const trialEmyStage=step=>step>=8?'trunk':'following';
const starts={2:[5.74,HEIGHT,2.4,-Math.PI/2],4:[2.78,HEIGHT,1.76,1.85],5:[2.78,HEIGHT,1.76,1.85],6:[6.9,HEIGHT,10.4,-Math.PI/2],7:[6.9,HEIGHT,10.4,-Math.PI/2],9:[7.86,-3.55,12.26,.65],11:[5.9,0,10.9,0],12:[5.9,0,11.4,0]};
export function trialStartPose(step){
 const start=starts[step];if(!start)return null;
 const [x,y,z,yaw]=start;return {x,y,z,yaw,pitch:0};
}
export function trialCheckpoint(step){
 const picked=['media-flashlight'];
 if(step>=1)picked.push('screwdriver');
 if(step>=2)picked.push('key');
 if(step>=4)picked.push('mirror-note');
 if(step>=6)picked.push('piano-sheet');
 if(step>=8)picked.push('red-key');
 if(step>=9)picked.push('master-key');
 const stage=step>=11?'escape':step>=10?'rc-setup':step>=4?'basement':step===3?'encounter':'explore';
 return {version:2,stage,picked,ventOpen:step>=1,drawer:true,mirrorRevealed:step>=4,safeOpened:step>=5,pianoSolved:step>=7,
  rugAside:step>=8,hatchUnlocked:step>=8,hatchOpen:step>=8,rcOwned:step>=11,exitUnlocked:step>=12,
  emy:{stage:trialEmyStage(step)},battery:100,spares:1,lives:3};
}
