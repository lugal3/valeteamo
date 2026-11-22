// Start from the same save format as an actual player. Indices distinguish the two 99% milestones.
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
  emy:{stage:step>=8?'trunk':'following',x:3.4,y:0,z:2.4,yaw:0},battery:100,spares:1,lives:3};
}
