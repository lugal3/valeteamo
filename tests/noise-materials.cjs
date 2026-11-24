// ValeTeAmo V2 / Phase 06 — deterministic material and throw behavior.
const assert=require('node:assert/strict');
(async()=>{
 const {createHouse}=await import('../src/lab/world.js');
 const {THROWABLE_MATERIALS,propMaterial,surfaceMaterial,impactResponse,throwSpeed}=await import('../src/lab/noise-materials.js');
 const {installNoiseProps,grabNoiseProp,releaseNoiseProp,stepNoiseProps}=await import('../src/lab/noise-props.js');
 assert.equal(Object.keys(THROWABLE_MATERIALS).length,4);
 assert.equal(propMaterial('glass'),'glass');assert.equal(propMaterial('plate'),'ceramic');
 assert.equal(propMaterial('cup'),'ceramic');assert.equal(propMaterial('metal'),'metal');
 assert.equal(surfaceMaterial('carpet'),'soft');assert.equal(surfaceMaterial('wood'),'wood');
 const glassHard=impactResponse('glass','hard',7),glassSoft=impactResponse('glass','soft',7);
 assert(glassHard.alert>glassSoft.alert,'carpet absorbs noise');
 assert(glassHard.level>=glassSoft.level);
 assert(impactResponse('metal','hard',7).alert>impactResponse('wood','hard',7).alert,'metal louder');
 for(const form of ['glass','plate','cup','metal','wood']){
  for(const surface of ['hard','wood','metal','soft']){
   const a=impactResponse(form,surface,8);
   assert(Number.isFinite(a.level)&&a.level>=.9&&a.level<=1.5);
   assert(Number.isFinite(a.alert)&&a.alert>0&&a.alert<=1.7);
  }
 }
 assert.equal(throwSpeed(0),throwSpeed(.45));
 assert.equal(throwSpeed(100),throwSpeed(1.1));
 assert(throwSpeed(.55)<throwSpeed(1));
 const world=createHouse(),props=installNoiseProps(world);
 const glass=props[0],cup=props.find(p=>p.form==='cup');
 assert(grabNoiseProp(glass));
 assert(releaseNoiseProp(glass,{yaw:0,pitch:0},true,.55));
 assert(Math.abs(glass.flight.vz-throwSpeed(.55))<.00001);
 assert.equal(cup.form,'cup');
 const drop=props[1];
 Object.assign(drop,{x:5.9,y:1.45,z:10.5,floor:0,flight:{vx:0,vy:0,vz:0,ttl:1}});
 const heard=[];const pursuer={active:false,hearNoise:(point,strength)=>heard.push({point,strength})};
 let cues=[];
 for(let i=0;i<80;i++)cues.push(...stepNoiseProps([drop],.03,world,pursuer,null));
 assert.equal(cues.length,1,'one event per impact');
 assert.equal(cues[0].kind,'impact');
 assert(['hard','wood','metal','soft'].includes(cues[0].surface));
 assert.equal(cues[0].material,'ceramic');
 assert.equal(cues[0].at.material,'ceramic');
 assert.equal(heard.length,1);
 assert(Math.abs(heard[0].strength-cues[0].alert)<.00001,'AI uses true event volume');
 console.log('PASS V2 phase 06: bounded throws, materials, surface damping, one spatial impact and AI investigation');
})().catch(e=>{console.error(e);process.exitCode=1});
