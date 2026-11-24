// ValeTeAmo V2 / phase 01: hiding Kitty cannot depend on the cat's route.
// Real companion state machine, real 2-floor world and actual 25s distraction.
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {createHouse}=await import('../src/lab/world.js');
 const {createEmyCompanion,sendEmyDistract,updateEmyCompanion,snapshotEmyCompanion,
  restoreEmyCompanion}=await import('../src/lab/emy-companion.js');
 const world=createHouse();
 const wardrobe={objectId:'wardrobe',returnX:2.3,returnZ:3.85};
 const kitty={x:2.3,y:3.15,z:3.85,hidden:wardrobe};

 // Scenario 1: Kitty hides upstairs while Emy is still downstairs.
 // Emy waits silently in-place and Kitty is never forced to approach her.
 const emy=createEmyCompanion(world.emy,{waiting:false});
 const before={x:emy.cat.x,y:emy.cat.y,z:emy.cat.z};
 for(let i=0;i<60;i++){
  assert.equal(updateEmyCompanion(emy,1/60,{world,player:kitty}),null);
  assert.equal(emy.stage,'hold','Emy must wait rather than travel to Kitty\'s wardrobe');
 }
 assert.equal(emy.cat.y,0,'Remote Emy must not teleport upstairs');
 assert(Math.hypot(emy.cat.x-before.x,emy.cat.z-before.z)<.001,'Emy stays quiet in-place');
 assert.equal(emy.cat.hidden,false,'Holding is not an invisible teleport to wardrobe');
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

 // Scenario 3: distracting downstairs is independent of Kitty hiding upstairs.
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
 assert(Math.hypot(decoy.cat.x-stayed.x,decoy.cat.z-stayed.z)<.001);
 assert.equal(decoy.cat.y,0);
 kitty.hidden=null;
 updateEmyCompanion(decoy,1/60,{world:second,player:kitty});
 assert.equal(decoy.stage,'following','Return to Kitty once she leaves cover');

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
