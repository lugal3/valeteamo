// ValeTeAmo V2 / phase 01: hiding Kitty cannot depend on the cat's route.
// Real companion state machine, real 2-floor world and actual 25s distraction.
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {createHouse,blocked,lineBlocked,groundHeight,setDoor}=await import('../src/lab/world.js');
 const {poseHatch}=await import('../src/lab/basement.js');
 const {updateFurniture}=await import('../src/lab/furniture-motion.js');
 const {createEmyCompanion,sendEmyDistract,updateEmyCompanion,snapshotEmyCompanion,
  restoreEmyCompanion,findEmyRefuge,emyGroundHeight,sendEmyToTrunk,FOLLOW_RESUME}=await import('../src/lab/emy-companion.js');
 const world=createHouse();
 const wardrobe={objectId:'wardrobe',returnX:2.3,returnZ:3.85};
 const kitty={x:2.3,y:3.15,z:3.85,hidden:wardrobe};

 // Scenario 1: Kitty hides upstairs while Emy is still downstairs.
 // Emy searches only a small local radius for physical cover; Kitty never waits.
 const emy=createEmyCompanion(world.emy,{waiting:false});
 const before={x:emy.cat.x,y:emy.cat.y,z:emy.cat.z};
 let previous=before;
 for(let i=0;i<180;i++){
  assert.equal(updateEmyCompanion(emy,1/60,{world,player:kitty}),null);
  assert(Math.hypot(emy.cat.x-previous.x,emy.cat.z-previous.z)<=.026,'No teleport during local refuge search');
  assert(!blocked(world.boxes,emy.cat.x,emy.cat.y,emy.cat.z,.14,.62));
  previous={x:emy.cat.x,z:emy.cat.z};
  assert.equal(emy.stage,'hold','Emy must wait rather than travel to Kitty\'s wardrobe');
 }
 assert.equal(emy.cat.y,0,'Remote Emy must not teleport upstairs');
 assert(Math.hypot(emy.cat.x-before.x,emy.cat.z-before.z)<=2.26,'Emy uses only nearby cover');
 assert.equal(emy.cat.hidden,false,'Holding is not an invisible teleport to wardrobe');
 assert.equal(emy.cat.visualMode,'crouch','Quiet refuge crouches physically');
 assert.equal(snapshotEmyCompanion(emy).stage,'following','Transient hold saves as normal following');
 const restored=createEmyCompanion(createHouse().emy);
 restoreEmyCompanion(restored,snapshotEmyCompanion(emy),'hunt');
 assert.equal(restored.stage,'following','Old checkpoint schema stays compatible');

 // Scenario 2: once Kitty emerges, the original pursuit/navigation resumes.
 kitty.hidden=null;
 updateEmyCompanion(emy,1/60,{world,player:kitty});
 assert.equal(emy.stage,'following');
 assert.equal(emy.cat.y,0,'Rejoin should route through stairway instead of teleport');
 let climbed=false;
 for(let i=0;i<3600;i++){
  updateEmyCompanion(emy,1/60,{world,player:kitty});
  if(emy.cat.y>1.0&&emy.cat.y<2.6)climbed=true;
  if(emy.cat.y>=3.05)break;
 }
 assert(climbed&&emy.cat.y>=3.05,'Emy must use actual stairway to rejoin Kitty upstairs');

 // Scenario 3: Kitty hides again while Emy is distracting downstairs.
 kitty.hidden=wardrobe;
 // During the entire 25s noise period, Emy must not cancel her command.
 const second=createHouse(),decoy=createEmyCompanion(second.emy,{waiting:false});
 const goal={x:decoy.cat.x+.045,y:0,z:decoy.cat.z+.045};
 assert(sendEmyDistract(decoy,second,goal));
 let noiseCount=0,done=false;
 for(let i=0;i<1800;i++){
  const cue=updateEmyCompanion(decoy,1/60,{world:second,player:kitty});
  if(cue==='distract-noise')noiseCount++;
  if(cue==='distract-done'){done=true;break;}
  assert.equal(decoy.stage,'distract','A hidden Kitty cannot interrupt an active distraction');
 }
 assert(done&&noiseCount>=13,'Full 25s independent distraction with repeated maows');
 assert.equal(decoy.stage,'hold','After distraction Emy must stay silent away from wardrobe');
 const stayed={x:decoy.cat.x,y:decoy.cat.y,z:decoy.cat.z};
 for(let i=0;i<180;i++){
  assert.equal(updateEmyCompanion(decoy,1/60,{world:second,player:kitty}),null);
 }
 assert(Math.hypot(decoy.cat.x-stayed.x,decoy.cat.z-stayed.z)<=2.26);
 assert.equal(decoy.cat.y,0);
 kitty.hidden=null;
 updateEmyCompanion(decoy,1/60,{world:second,player:kitty});
 assert.equal(decoy.stage,'following','Return to Kitty once she leaves cover');

 // Actual under-table cover: a tabletop blocks the threat's sight while a
 // collision-free path exists beneath it. No world mutation in the real game.
 const coverWorld=createHouse();
 const shelter=createEmyCompanion(coverWorld.emy,{waiting:false});
 Object.assign(shelter.cat,{x:5.85,y:0,z:8.5,yaw:0});
 coverWorld.boxes.push({id:'qa-cover-table',solid:true,x:5.85,y:.84,z:9.55,w:1.25,h:.12,d:1.0});
 const threat={active:true,x:5.85,y:0,z:7.1};
 const localKitty={x:2.3,y:3.15,z:3.85,hidden:wardrobe};
 const refuge=findEmyRefuge(coverWorld,shelter.cat,localKitty,threat);
 assert(refuge,'Find a real screened floor point near furniture');
 assert(lineBlocked(coverWorld.boxes,{x:threat.x,y:1.5,z:threat.z},{x:refuge.x,y:.32,z:refuge.z}));
 const start={x:shelter.cat.x,z:shelter.cat.z};
 const path=[];
 for(let i=0;i<240;i++){
  updateEmyCompanion(shelter,1/60,{world:coverWorld,player:localKitty,threat});
  path.push({x:shelter.cat.x,z:shelter.cat.z});
  assert.equal(shelter.cat.y,0);
  assert(!blocked(coverWorld.boxes,shelter.cat.x,0,shelter.cat.z,.14,.62));
 }
 assert(Math.hypot(shelter.cat.x-start.x,shelter.cat.z-start.z)>.35,'Walk to actual cover instead of disappearing');
 assert(Math.hypot(shelter.cat.x-refuge.x,shelter.cat.z-refuge.z)<.16,'Reach selected local refuge');
 assert.equal(shelter.cat.visualMode,'crouch');
 assert.equal(shelter.cat.hidden,false);
 // Real geometry: the low nook has 1.08m clearance. The old human-sized
 // graph selected an inaccessible nearest node above it. Emy must emerge
 // from the actual west opening and reunite without a floor-height snap.
 const nookWorld=createHouse();
 for(const door of nookWorld.objects.filter(o=>o.kind==='door'&&!o.locked&&!o.sealed))setDoor(door,true);
 const nookCat=createEmyCompanion(nookWorld.emy,{waiting:false});
 const nookStart={x:11.72,y:0,z:6.82,yaw:-Math.PI/2};
 assert(!blocked(nookWorld.boxes,nookStart.x,0,nookStart.z,.16,.62),'Valid cat position in the real stair nook');
 assert(blocked(nookWorld.boxes,nookStart.x,0,nookStart.z,.16,1.72),'A human-sized graph cannot use this low refuge');
 Object.assign(nookCat.cat,nookStart);
 const nookHide={objectId:'understairs',returnX:10.38,returnZ:6.82};
 const nookKitty={x:10.38,y:0,z:6.82,hidden:nookHide};
 for(let i=0;i<120;i++){
  updateEmyCompanion(nookCat,1/30,{world:nookWorld,player:nookKitty,reduced:true});
  assert.equal(nookCat.stage,'hold');assert.equal(nookCat.cat.y,0);
 }
 nookKitty.hidden=null;Object.assign(nookKitty,{x:6.0,z:8.1});
 let emerged=false;
 for(let i=0;i<2400;i++){
  const before={x:nookCat.cat.x,y:nookCat.cat.y,z:nookCat.cat.z};
  updateEmyCompanion(nookCat,1/30,{world:nookWorld,player:nookKitty,reduced:true});
  updateFurniture(nookWorld.objects,1/30,nookKitty);
  assert(Math.hypot(nookCat.cat.x-before.x,nookCat.cat.z-before.z)<=.15,'Bounded continuous movement out of nook');
  assert.equal(nookCat.cat.y,0,'Do not climb onto the stair ramp from the nook');
  assert(!blocked(nookWorld.boxes,nookCat.cat.x,0,nookCat.cat.z,.16,.62));
  if(Math.hypot(nookCat.cat.x-nookKitty.x,nookCat.cat.z-nookKitty.z)<=FOLLOW_RESUME+.1){emerged=true;break;}
 }
 assert(emerged,'Emy must escape the real stair nook and return to Kitty');
 assert.equal(nookCat.stage,'following');

 // Opening the hatch supersedes a stay or active distraction. Even when
 // Kitty is underground, Emy has to walk to the study trunk, not descend.
 const basementWorld=createHouse();
 for(const door of basementWorld.objects.filter(o=>o.kind==='door'&&!o.locked&&!o.sealed))setDoor(door,true);
 const basementCat=createEmyCompanion(basementWorld.emy,{waiting:false});
 Object.assign(basementCat.cat,{x:8.55,y:0,z:2.2,yaw:0});
 assert(sendEmyDistract(basementCat,basementWorld,{x:8.55,y:0,z:2.2}));
 basementWorld.hatch.locked=false;basementWorld.hatch.open=true;poseHatch(basementWorld.hatch,1);
 const underground={x:8.55,y:groundHeight(8.55,6.3,-2,true),z:6.3,hidden:null};
 assert(Number.isNaN(emyGroundHeight(8.55,2.9,0,true)),'An above-ground Emy cannot enter the opened trapdoor');
 let trunk=false;
 for(let i=0;i<2400;i++){
  const cue=updateEmyCompanion(basementCat,1/30,{world:basementWorld,player:underground,reduced:true,distractCooldown:35});
  updateFurniture(basementWorld.objects,1/30,underground);
  assert(basementCat.cat.y>=-.01,'No accidental basement descent during withdrawal');
  assert.equal(basementCat.distraction,null,'Withdrawal clears active orders');
  if(cue==='trunk'){trunk=true;break;}
 }
 assert(trunk&&basementCat.cat.hidden,'Retire into the actual trunk even when Kitty descends immediately');
 Object.assign(underground,{x:8.55,y:0,z:2.2});
 for(let i=0;i<120;i++)updateEmyCompanion(basementCat,1/30,{world:basementWorld,player:underground,reduced:true});
 assert.equal(basementCat.stage,'trunk','Returning from the basement must not revive a retired companion');
 assert(basementCat.cat.hidden);
 assert(!sendEmyToTrunk(basementCat),'Repeated story trigger does not restart withdrawal');

 // A legacy underground cat can physically leave via the same slope.
 const oldWorld=createHouse();oldWorld.hatch.open=true;oldWorld.hatch.locked=false;poseHatch(oldWorld.hatch,1);
 for(const door of oldWorld.objects.filter(o=>o.kind==='door'&&!o.locked&&!o.sealed))setDoor(door,true);
 const oldCat=createEmyCompanion(oldWorld.emy,{waiting:false});
 const oldY=groundHeight(8.55,4.5,-2,true);
 Object.assign(oldCat.cat,{x:8.55,y:oldY,z:4.5,yaw:Math.PI});
 let climbedOut=false;
 for(let i=0;i<2400;i++){
  const before={x:oldCat.cat.x,y:oldCat.cat.y,z:oldCat.cat.z};
  updateEmyCompanion(oldCat,1/30,{world:oldWorld,player:underground,reduced:true});
  updateFurniture(oldWorld.objects,1/30,underground);
  if(oldCat.stage==='trunk-enter'||oldCat.stage==='trunk'){climbedOut=true;break;}
  assert(Math.abs(oldCat.cat.y-before.y)<.18,'No vertical teleport on hatch stairs');
  if(oldCat.cat.y>=-.01)climbedOut=true;
 }
 assert(climbedOut,'Legacy underground Emy can leave along the real tunnel slope');

 // Kitty's player animation in house.js has no seven-second cat dependency.
 const house=fs.readFileSync('src/lab/house.js','utf8');
 const section=house.slice(house.indexOf(' function updateHiding(dt){'),house.indexOf(' function exitPose(){'));
 assert(section.includes('transition.elapsed+=dt;')&&section.includes('HIDE_SECONDS'),
  'The regular wardrobe animation must remain intact');
 assert(!/catWait|catMovedAt|lastCatPosition/.test(section),
  'Kitty may not wait for Emy at any point during wardrobe entry');
 assert(!/emyCompanion\.stage/.test(section),
  'Player hiding must be driven by player state alone');

 console.log('PASS V2 phase 01: remote floor hiding, quiet hold, unhide stair path, full distraction and independent wardrobe timing');
})().catch(e=>{console.error(e);process.exitCode=1});
