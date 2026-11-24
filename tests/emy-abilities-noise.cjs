const assert=require('node:assert/strict');
(async()=>{
 const {createHouse}=await import('../src/lab/world.js');
 const {Pursuer}=await import('../src/lab/pursuer.js');
 const {createEmyAbilities,activateEmyScan,advanceEmyAbilities,roomChoices,roomDestination,roomDestinations,isEmyRoomLocked,emyFloorMap,emyFloorList}=await import('../src/lab/emy-abilities.js');
 const {installNoiseProps,grabNoiseProp,holdNoiseProp,releaseNoiseProp,stepNoiseProps}=await import('../src/lab/noise-props.js');
 const {createEmyCompanion,sendEmyDistract,snapshotEmyCompanion,updateEmyCompanion}=await import('../src/lab/emy-companion.js');
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
 assert.equal(choices.filter(r=>r.floor===0).length,6,'Six clear ground-floor targets');
 assert.equal(choices.filter(r=>r.floor===1).length,4,'Four clear upstairs targets');
 assert(lower.includes('emy:room:study')&&upper.includes('emy:room:bedroom'));
 assert(!lower.includes('emy:room:bedroom'));
 assert(lower.includes('house-emy-stair-flight')&&upper.includes('house-emy-stair-void'),
  'Stairs and upstairs opening must be represented differently');
 assert(emyFloorList(world.rooms,0).includes('Recibidor y pasillo'));
 assert(emyFloorList(world.rooms,1).includes('Sala de música'));
 assert(isEmyRoomLocked(world,choices.find(r=>r.id==='bedroom')),'Locked story bedroom must not be available yet');
 for(const room of choices){
  const candidates=roomDestinations(world,room);
  assert(candidates.length>0,'Safe destination in '+room.id);
  const level=room.floor?3.15:0;
  for(const p of candidates)assert(Math.abs(p.y-level)<.18,'Correct floor for '+room.id);
  if(room.id==='stairs')assert(candidates.every(p=>p.z>9.9),'Never target the sloped stair treads as the ground floor');
 }
 const study=choices.find(room=>room.id==='study');
 const target=roomDestination(world,study);
 assert(target&&target.y===0,'Room waypoint should be on a navigable floor');
 for(const id of ['study','living','kitchen','bath','hall-ground','stairs','reading','music','hall-upper']){
  const room=choices.find(r=>r.id===id);
  const cat=createEmyCompanion(world.emy,{waiting:false});
  const reachable=roomDestinations(world,room).some(point=>sendEmyDistract(cat,world,point));
  assert(reachable,'Emy must find a route from the entrance to '+id+' on floor '+room.floor);
  assert.equal(cat.distraction.goal.y,room.floor?3.15:0,'Cross-floor route elevation for '+id);
 }


 const props=installNoiseProps(world);
 assert.equal(props.length,6);
 assert(props.every(p=>!world.boxes.includes(p.box)), 'noise objects use a separate WebGL1 batch, never the saturated main dynamic buffer');
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
 const {pursuerPose}=await import('../src/lab/pursuer-model.js');
 const testActor={...pursuer.snapshot(),mode:'stunned',stunned:1.5,speed:0};
 const recoil=pursuerPose(testActor,true),neutral=pursuerPose({...testActor,mode:'search'},true);
 assert.notEqual(recoil.chest.pitch,neutral.chest.pitch,'An impact must visibly animate the existing 3D rig');
 const companion=createEmyCompanion(world.emy,{waiting:false});
 assert.equal(companion.stage,'following');
 const near=roomDestination(world,choices.find(room=>room.id==='living'));
 if(near&&sendEmyDistract(companion,world,near)){
  assert.equal(companion.stage,'distract');
  assert.equal(snapshotEmyCompanion(companion).stage,'following');
 }
 // A nearby distraction runs for 25 seconds, emits repeated noise and restores follow mode.
 const closeWorld=createHouse(),closeCat=createEmyCompanion(closeWorld.emy,{waiting:false});
 const closeGoal={x:closeCat.cat.x+.04,y:0,z:closeCat.cat.z+.04};
 assert(sendEmyDistract(closeCat,closeWorld,closeGoal));
 let rings=0,finished=false;
 for(let i=0;i<1650;i++){
  const cue=updateEmyCompanion(closeCat,1/60,{world:closeWorld,player:{x:5.1,y:0,z:10.65}});
  if(cue==='distract-noise')rings++;
  if(cue==='distract-done'){finished=true;break;}
 }
 assert(finished&&rings>=13,'Emy must distract for roughly 25 s and return to follow');
 assert.equal(closeCat.stage,'following');
 // A thrown object near Emy triggers an actual collision-safe animated sidestep,
 // rather than instantly moving or replacing the cat model.
 const dodgeWorld=createHouse(),dodgeCat=createEmyCompanion(dodgeWorld.emy,{waiting:false});
 const dodgeProps=installNoiseProps(dodgeWorld),dodgeProp=dodgeProps[0];
 const start={x:dodgeCat.cat.x,y:dodgeCat.cat.y,z:dodgeCat.cat.z};
 Object.assign(dodgeProp,{x:start.x+.08,y:start.y+.38,z:start.z-.08,
  flight:{vx:0,vy:0,vz:1,ttl:1}});
 const dodgeCues=stepNoiseProps([dodgeProp],.016,dodgeWorld,null,dodgeCat.cat);
 assert(dodgeCues.some(cue=>cue.kind==='evade'),'Emy must detect an incoming throwable');
 assert(dodgeCat.cat.dodge,'Dodge must have an animated target pose');
 assert.equal(dodgeCat.cat.x,start.x,'Dodge starts at original location without teleport');
 for(let i=0;i<35;i++)updateEmyCompanion(dodgeCat,1/60,{world:dodgeWorld,player:start});
 assert(!dodgeCat.cat.dodge,'Dodge animation finishes cleanly');
 assert(Math.hypot(dodgeCat.cat.x-start.x,dodgeCat.cat.z-start.z)>.4,'Emy moves aside physically');
 console.log('PASS Emy abilities: scan cooldown, floor-map rooms, throwable-noise, pursuer stun and distract checkpoint');
})().catch(error=>{console.error(error);process.exitCode=1;});
