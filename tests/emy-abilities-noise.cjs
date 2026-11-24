const assert=require('node:assert/strict');
(async()=>{
 const {createHouse}=await import('../src/lab/world.js');
 const {Pursuer}=await import('../src/lab/pursuer.js');
 const {createEmyAbilities,activateEmyScan,advanceEmyAbilities,roomChoices,roomDestination,emyFloorMap}=await import('../src/lab/emy-abilities.js');
 const {installNoiseProps,grabNoiseProp,holdNoiseProp,releaseNoiseProp,stepNoiseProps}=await import('../src/lab/noise-props.js');
 const {createEmyCompanion,sendEmyDistract,snapshotEmyCompanion}=await import('../src/lab/emy-companion.js');
 const abilities=createEmyAbilities();
 assert(activateEmyScan(abilities));assert.equal(abilities.scan,6);assert(!activateEmyScan(abilities));
 advanceEmyAbilities(abilities,1/60);assert(abilities.scan<6&&abilities.wave<1.1);
 for(let i=0;i<6000;i++)advanceEmyAbilities(abilities,.1);
 assert.equal(abilities.scan,0);assert.equal(abilities.scanCooldown,0);
 assert(activateEmyScan(abilities));

 const world=createHouse();
 const choices=roomChoices(world.rooms);
 for(const name of ['Estudio','Sala de estar','Cocina y comedor','Baño','Dormitorio','Sala de lectura','Sala de música','Recibidor y pasillo','Distribuidor y descansillo']){
  assert(choices.some(room=>room.label===name),name+' exists in the two-floor command map');
 }
 const lower=emyFloorMap(world.rooms,0),upper=emyFloorMap(world.rooms,1);
 assert(lower.includes('emy:room:study')&&upper.includes('emy:room:bedroom'));
 assert(!lower.includes('emy:room:bedroom'));
 const study=choices.find(room=>room.id==='study');
 const target=roomDestination(world,study);
 assert(target&&target.y===0,'Room waypoint should be on a navigable floor');

 const props=installNoiseProps(world);
 assert.equal(props.length,6);
 const glass=props[0];
 assert(grabNoiseProp(glass));assert(!grabNoiseProp(null));
 holdNoiseProp(glass,{x:5,y:1.6,z:8,yaw:0,pitch:0});
 assert.equal(glass.box.z,glass.z);
 assert(releaseNoiseProp(glass,{x:5,y:1.6,z:8,yaw:0},true));
 assert(glass.flight&&glass.flight.vz>0);
 const pursuer=new Pursuer(world);
 assert(!pursuer.hearNoise({x:1,y:0,z:1}),'dormant pursuer ignores sound');
 pursuer.mode='search';
 assert(pursuer.hearNoise({x:2,y:0,z:2}));
 assert.equal(pursuer.mode,'noise-investigate');
 assert.equal(pursuer.noiseGoal.x,2);
 const other=props[1];
 other.flight={vx:0,vy:0,vz:0,ttl:1};
 Object.assign(other,{x:pursuer.x,y:pursuer.y+1.0,z:pursuer.z});
 let cues=stepNoiseProps([other],.016,world,pursuer,null);
 assert(cues.some(cue=>cue.kind==='stun'));assert.equal(pursuer.mode,'stunned');
 pursuer.update(.5,{x:2,y:0,z:2,hidden:true});
 assert(pursuer.stunned>0);
 for(let i=0;i<4;i++)pursuer.update(.5,{x:2,y:0,z:2,hidden:true});
 assert.equal(pursuer.mode,'cooldown');
 const companion=createEmyCompanion(world.emy,{waiting:false});
 assert.equal(companion.stage,'following');
 const near=roomDestination(world,choices.find(room=>room.id==='living'));
 if(near&&sendEmyDistract(companion,world,near)){
  assert.equal(companion.stage,'distract');
  assert.equal(snapshotEmyCompanion(companion).stage,'following');
 }
 console.log('PASS Emy abilities: scan cooldown, floor-map rooms, throwable-noise, pursuer stun and distract checkpoint');
})().catch(error=>{console.error(error);process.exitCode=1;});
