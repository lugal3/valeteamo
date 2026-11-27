// ValeTeAmo V2 phase 04: explicit companion stay and lightweight autonomous idles.
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {createHouse,setDoor}=await import('../src/lab/world.js');
 const {createEmyCompanion,commandEmyStay,releaseEmyStay,updateEmyCompanion,
  snapshotEmyCompanion,restoreEmyCompanion,sendEmyDistract,rejoinEmyInPerson}=await import('../src/lab/emy-companion.js');
 const world=createHouse(),emy=createEmyCompanion(world.emy,{waiting:false});
 const kitty={x:2.3,y:3.15,z:3.85,hidden:null};
 assert(commandEmyStay(emy),'available only during following');
 assert(!commandEmyStay(emy),'duplicate command must not reset stay');
 const start={x:emy.cat.x,y:emy.cat.y,z:emy.cat.z};
 const modes=new Set(),moods=new Set();
 for(let i=0;i<2100;i++){
  if(i===600)kitty.hidden={objectId:'wardrobe',returnX:2.3,returnZ:3.85};
  if(i===900)kitty.hidden=null;
  updateEmyCompanion(emy,1/60,{world,player:kitty});
  modes.add(emy.cat.visualMode);moods.add(emy.mood);
  assert.equal(emy.stage,'stay');
  assert.equal(emy.cat.x,start.x);
  assert.equal(emy.cat.y,start.y,'stay must never teleport across floors');
  assert.equal(emy.cat.z,start.z);
 }
 assert(modes.has('sit')&&modes.has('groom')&&modes.has('stretch')&&modes.has('sleep'),'idle behavior rotates sit/groom/stretch/rest');
 assert(moods.has('calm')&&moods.has('curious')&&moods.has('tired'));
 assert.equal(snapshotEmyCompanion(emy).stage,'stay','explicit command survives checkpoints');
 const saved=snapshotEmyCompanion(emy);
 const recoveredWorld=createHouse();
 const bedroom=recoveredWorld.objects.find(o=>o.id==='dormitorio');bedroom.locked=false;setDoor(bedroom,true);
 const recovered=createEmyCompanion(recoveredWorld.emy);
 restoreEmyCompanion(recovered,saved,'hunt');
 assert.equal(recovered.stage,'stay');
 assert.equal(recovered.cat.y,start.y);
 assert(releaseEmyStay(recovered));
 assert.equal(recovered.stage,'following');
 assert(!releaseEmyStay(recovered));
 let stairs=false;
 for(let i=0;i<4000;i++){
  updateEmyCompanion(recovered,1/60,{world:recoveredWorld,player:kitty});
  if(recovered.cat.y>1&&recovered.cat.y<2.6)stairs=true;
  if(recovered.cat.y>=3.05)break;
 }
 assert(stairs&&recovered.cat.y>=3.05,'follow must climb real stairs after release');
 const busyWorld=createHouse(),busy=createEmyCompanion(busyWorld.emy,{waiting:false});
 const goal={x:busy.cat.x+.04,y:0,z:busy.cat.z+.04};
 assert(sendEmyDistract(busy,busyWorld,goal));
 assert(!commandEmyStay(busy),'cannot override active distraction');
 assert.equal(busy.stage,'distract');
 assert(!rejoinEmyInPerson(busy,busyWorld,kitty),'Cannot cancel from another floor');
 const nearby={x:busy.cat.x+.75,y:busy.cat.y,z:busy.cat.z,eye:1.63,hidden:null};
 const cooldown=55;
 assert(rejoinEmyInPerson(busy,busyWorld,nearby),'Can stop an active order by physically approaching Emy');
 assert.equal(busy.stage,'following');assert.equal(busy.distraction,null);
 const abilities={distractCooldown:cooldown};
 assert(sendEmyDistract(busy,busyWorld,goal));
 let noise=0;
 for(let i=0;i<1600&&busy.stage==='distract';i++){
  const cue=updateEmyCompanion(busy,1/60,{world:busyWorld,player:kitty,distractCooldown:abilities.distractCooldown});
  if(cue==='distract-noise')noise++;
 }
 assert(noise>=13&&busy.stage==='following','Return immediately after 25 s, even with cooldown remaining');
 const at={x:busy.cat.x,z:busy.cat.z};
 for(let i=0;i<180;i++)updateEmyCompanion(busy,1/60,{world:busyWorld,player:kitty,distractCooldown:10});
 assert.equal(busy.stage,'following');
 assert(Math.hypot(busy.cat.x-at.x,busy.cat.z-at.z)>.1,'Walk back without a manual recall');
 assert.equal(abilities.distractCooldown,cooldown,'Recall does not change ability cooldown');
 const house=fs.readFileSync('src/lab/house.js','utf8');
 assert(house.includes('data-act="emy:stay"'));
 assert(house.includes("rejoinEmyInPerson(emyCompanion,world,s)"));
 assert(house.includes('distractCooldown:emyAbilities.distractCooldown'));
 console.log('PASS V2 phase 04: sit/groom/stretch, explicit stay, hide/floor separation, checkpoint and stair recovery');
})().catch(e=>{console.error(e);process.exitCode=1});
