const assert=require('node:assert/strict');

module.exports=async()=>{
 const {interactionTarget}=await import('../src/lab/interactions.js');
 const {createHouse,setDoor,blocked,groundHeight}=await import('../src/lab/world.js');
 const {createEmyCompanion,requestRibbonKey,updateEmyCompanion,sendEmyToTrunk,initializeTrialEmy,trialEmyPose}=await import('../src/lab/emy-companion.js');
 const {createRescueObjectives,updateEmySenses,poseEscapeAmbush}=await import('../src/lab/emy-rescue.js');
 const {rescueProgress}=await import('../src/lab/rescue-progress.js');
 const {Pursuer}=await import('../src/lab/pursuer.js');
 const {captureHouseCheckpoint,restoreHouseCheckpoint}=await import('../src/lab/house-checkpoint.js');
 const {trialCheckpoint,trialStartPose,trialEmyStage}=await import('../src/lab/trial-checkpoint.js');
 const {progressStops}=await import('../src/lab/rescue-progress.js');
 for(const [index,stop] of progressStops.entries()){
  const w=createHouse(),ctx={world:w,s:{inventory:{notes:[]}},puzzle:{},events:{phase:'explore'},mirrorSafe:{},rc:{object:w.objects.find(o=>o.id==='rc-car')},rcTrap:{},pursuer:new Pursuer(w)};
  assert(restoreHouseCheckpoint(trialCheckpoint(index+1),ctx));
  // The final replay starts at the open exit so the player can trigger the actual ending.
  assert.equal(rescueProgress(ctx).percent,index===11?99:stop.percent);
  if(index===1)assert(ctx.s.inventory.key&&w.objects.find(o=>o.id==='dormitorio').locked);
  if(index===8)assert(ctx.s.inventory.masterKey&&!ctx.puzzle.rescued);
  if(index===11)assert(!w.objects.find(o=>o.id==='entrada').sealed);
  const step=index+1,pose=trialStartPose(step);
  if(pose&&!blocked(w.boxes,pose.x,pose.y,pose.z,.2,1.69))Object.assign(ctx.s,pose);
  const companion=createEmyCompanion(w.emy,{waiting:false});
  const expected=step>=8?'trunk':'following';
  assert.equal(trialEmyStage(step),expected);
  assert(initializeTrialEmy(companion,w,ctx.s,expected),'Valid Emy spawn for milestone '+step);
  assert.equal(companion.stage,expected);
  assert.equal(w.emy.hidden,step>=8);
  assert(w.emy.parts.every(part=>part.box.hiddenGeometry===(step>=8)));
  if(step<8){
   assert.equal(w.emy.y,ctx.s.y,'Same floor in milestone '+step);
   assert(Math.hypot(w.emy.x-ctx.s.x,w.emy.z-ctx.s.z)<=3.11,'Nearby companion in milestone '+step);
   assert(!blocked(w.boxes,w.emy.x,w.emy.y,w.emy.z,.24,.72),'No collision at milestone '+step);
  }
 }
 // Evaluate the actual TypeScript scenario table, not a duplicate list.
 const ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');
 const exports={},modules={'./rescue-progress.js':{progressStops},'./trial-checkpoint.js':{trialEmyStage}};
 const js=ts.transpileModule(fs.readFileSync('src/lab/house-trials.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(js,{exports,require:id=>{if(!modules[id])throw Error(id);return modules[id];}});
 for(const [id,trial] of Object.entries(exports.HOUSE_TRIALS)){
  if(trial.milestone)continue;
  const w=createHouse(trial.checkpoint??'interactions');
  const player={...w.spawn};
  if(trial.pose){const {floor,...pose}=trial.pose;Object.assign(player,pose,{y:floor*3.15});}
  if(trial.puzzleEntry==='rescue')setDoor(w.objects.find(o=>o.id==='dormitorio'),true);
  const stage=trial.emy??'following',cat=createEmyCompanion(w.emy,{waiting:false});
  assert(initializeTrialEmy(cat,w,player,stage),'Valid Emy spawn for isolated '+id);
  assert.equal(cat.cat.hidden,stage!=='following',id);
  if(stage==='following'){
   assert(trialEmyPose(w,player),'Walkable companion pose in '+id);
   assert.equal(cat.cat.y,player.y,'Correct floor in '+id);
   assert(!blocked(w.boxes,cat.cat.x,cat.cat.y,cat.cat.z,.24,.72),'Safe companion in '+id);
  }
 }
 const world=createHouse(),item=id=>world.objects.find(o=>o.id===id);
 for(const door of world.objects.filter(o=>o.kind==='door'))setDoor(door,true);
 const s={x:1.8,y:0,z:2.95,inventory:{notes:[]}},cat=createEmyCompanion(world.emy,{waiting:false});
 const vent=item('emy-vent'),key=item('key'),hunter=new Pursuer(world);
 const state={world,s,puzzle:{},events:{phase:'explore'},mirrorSafe:{},rcTrap:{}};
 const tracker=createRescueObjectives();
 let changes=0;tracker.addEventListener('change',()=>changes++);
 assert.equal(tracker.update(state).target,item('drawer'));
 s.inventory.screwdriver=true;assert.equal(tracker.update(state).target,vent);
 tracker.update(state);assert.equal(changes,2);
 const {removeVentCover,advanceVentCover}=await import('../src/lab/study-vent.js');
 assert(!requestRibbonKey(cat,vent,key));
 assert(!removeVentCover(vent,false));assert(removeVentCover(vent,false,'screwdriver'));assert(!removeVentCover(vent,false));
 advanceVentCover(vent,.3);assert(!requestRibbonKey(cat,vent,key));
 // Reloading during removal finishes detaching the cover but grants no key.
 const saved=captureHouseCheckpoint({...state,rc:{},batterySwap:null,pursuer:hunter});
 const resumedWorld=createHouse(),resumed={...state,world:resumedWorld,s:{inventory:{notes:[]}},rc:{},puzzle:{},pursuer:new Pursuer(resumedWorld)};
 restoreHouseCheckpoint(JSON.parse(JSON.stringify(saved)),resumed);
 assert.equal(resumedWorld.studyVent.coverAmount,1);assert(!resumed.puzzle.key);
 const {captureLoss}=await import('../src/lab/capture-lives.js');
 const retry=captureLoss(3,saved,null);
 restoreHouseCheckpoint(retry.checkpoint,resumed);
 assert.equal(resumed.s.lives,2);assert(resumedWorld.studyVent.unlatched&&!resumed.s.inventory.key);
 advanceVentCover(vent,3.2);assert.equal(vent.coverAmount,1);
 assert(vent.cover.every(({box})=>box.y<.15));
 tracker.update(state);assert.equal(changes,3);
 assert(requestRibbonKey(cat,vent,key));assert(!requestRibbonKey(cat,vent,key));
 const cues=[],stages=new Set();
 assert(vent.entrance.y>1.2);
 const {snapshotEmyCompanion}=await import('../src/lab/emy-companion.js');
 for(let i=0;i<900&&cat.stage==='fetch';i++){
  const cue=updateEmyCompanion(cat,1/30,{world,player:s});
  if(cue)cues.push(cue);
  stages.add(cat.fetch?.phase);
  if(['leap-in','leap-out','crawl'].includes(cat.fetch?.phase)){
   assert.equal(snapshotEmyCompanion(cat).y,0,'Airborne saves resume on the floor');
   if(cat.fetch.phase==='crawl')assert.equal(cat.cat.y,vent.entrance.y);
  }
  if(cat.fetch?.carrying){assert(key.carried);assert.equal(key.yaw,cat.cat.yaw);}
 }
 assert(stages.has('leap-in')&&stages.has('leap-out'));
 assert.equal(cat.cat.y,0);
 assert(cues.length>=4&&cues.slice(0,-1).every(cue=>cue==='scratch'));assert.equal(cues.at(-1),'delivered');assert.equal(cat.stage,'following');
 assert(Math.hypot(cat.cat.x-s.x,cat.cat.z-s.z)<.86);
 state.puzzle.key=true;assert.equal(tracker.update(state).target,item('dormitorio'));
 assert.equal(changes,4);
 assert(world.pianoSheet.concealed);assert.equal(world.piano.reward,item('red-key'));
 const master=item('master-key'),x=7.86,z=12.26,y=groundHeight(x,z,master.floor,true);
 assert(y<0&&!blocked(world.boxes,x,y,z,.2,1.7));
 const dx=master.x-x,dz=master.z-z;
 assert.equal(interactionTarget(world,{x,y:y+1.63,z,yaw:Math.atan2(dx,dz),pitch:Math.atan2(master.y-y-1.63,Math.hypot(dx,dz))}),master);
 const altarVisitor={...s,x:12.27,y:3.15,z:.8};
 const quietHunter={...hunter,active:false};
 // The old fixture tested fear from a different floor. The new fear is
 // local to Emy herself: she must not react to an altar she cannot sense.
 cat.cat.alarm=0;cat.cat.earFlatten=0;
 updateEmySenses(cat,altarVisitor,world,quietHunter,tracker.active,1/30,false);
 assert(cat.altarWait&&!cat.altarFear&&cat.cat.alarm===0,'Remote Kitty does not instantly frighten Emy');
 Object.assign(cat.cat,{x:9,y:3.15,z:3.6,yaw:Math.PI});
 for(let i=0;i<35;i++)updateEmySenses(cat,altarVisitor,world,quietHunter,tracker.active,1/30,false);
 const {poseEmy}=await import('../src/lab/emy-cat.js');
 cat.cat.age=1;poseEmy(cat.cat,{mode:'idle'});
 assert(cat.altarWait&&cat.cat.parts.find(p=>p.id==='coat').box.bristle>.95);
 assert(cat.cat.parts.some(p=>p.joint==='eye'&&p.box.emyPose.scale[1]>1.35));
 assert(cat.cat.earFlatten>.9,'Altar provokes ears laid back');
 const moodWorld=createHouse(),moodCat=createEmyCompanion(moodWorld.emy,{waiting:false});
 Object.assign(moodCat.cat,{x:5.95,y:0,z:8.1,yaw:0});
 const moodPlayer={x:5.95,y:0,z:9.4,hidden:null};
 moodWorld.objects.push({id:'qa-visible-prop',kind:'inspect',x:5.95,y:.6,z:8.9});
 const distant={active:true,mode:'chase',x:5.95,y:3.15,z:8.1};
 for(let i=0;i<60;i++)updateEmySenses(moodCat,moodPlayer,moodWorld,distant,null,1/30,false);
 assert.equal(moodCat.cat.alarm,0,'No fear from another floor');
 assert(moodCat.cat.curiosityTarget,'Curiosity observes an actual nearby visible object');
 const close={active:true,mode:'chase',x:5.95,y:0,z:7.1};
 for(let i=0;i<30;i++)updateEmySenses(moodCat,moodPlayer,moodWorld,close,null,1/30,false);
 assert(moodCat.cat.alarm>.85&&moodCat.cat.earFlatten>.8,'Nearby chase visibly frightens Emy');
 updateEmyCompanion(moodCat,.1,{world:moodWorld,player:moodPlayer,threat:close});
 const {geometry}=await import('../src/lab/renderer.js');
 const raised=geometry(moodCat.cat.parts.map(p=>p.box)).vertices;
 assert(raised.every(Number.isFinite),'Frightened pose keeps a finite mesh');
 for(let i=0;i<300;i++)updateEmySenses(moodCat,moodPlayer,moodWorld,{...close,active:false},null,1/30,false);
 assert(moodCat.cat.alarm<.02,'Fear fades naturally once danger is gone');

 world.lights.power.on=false;
 Object.assign(hunter,{mode:'search',x:cat.cat.x+.8,y:0,z:cat.cat.z});
 updateEmySenses(cat,s,world,hunter,tracker.active,.1,false);
 assert(cat.cat.alarm>0&&cat.cat.darkEyes);
 sendEmyToTrunk(cat);
 updateEmySenses(cat,s,world,hunter,tracker.active,.1,false);assert.equal(cat.cat.alarm,0);

 // An old save after Louis hid may have left the master key on the piano.
 restoreHouseCheckpoint({version:1,stage:'rc-setup',picked:['key'],safeOpened:true},{
  world,s,puzzle:state.puzzle,events:state.events,mirrorSafe:state.mirrorSafe,rc:{object:item('rc-car')},rcTrap:state.rcTrap,pursuer:hunter
 });
 assert(s.inventory.masterKey);assert(!world.pianoSheet.concealed);
 const shot={elapsed:0,kitty:{from:{x:5.8,z:12.42}}};
 cat.cat.hidden=true;
 assert(!poseEscapeAmbush(shot,cat.cat,hunter,false));
 shot.elapsed=2.2;assert(poseEscapeAmbush(shot,cat.cat,hunter,false));assert(cat.cat.y>.6);
 shot.elapsed=6.8;poseEscapeAmbush(shot,cat.cat,hunter,false);
 assert.equal(cat.cat.y,0);
 assert(cat.cat.z>14&&hunter.z>=12.25,
  'Emy runs past Kitty; attacker remains visible OUTSIDE the front wall during cinematic');
 assert(hunter.x>shot.kitty.from.x+.95,'Emy must physically deflect attacker sideways');
 // The route must remain ordered even when the safe is revisited or notes are skipped.
 const steps=[
  ['dormitorio',()=>state.puzzle.door=true],
  ['wardrobe',()=>state.events.phase='sleep'],
  ['mirror-note',()=>state.mirrorSafe.collected=true],
  ['dormitorio',()=>state.events.phase='evaded'],
  ['bath-mirror',()=>state.mirrorSafe.revealed=true],
  ['mirror-safe',()=>state.mirrorSafe.opened=true],
  ['piano-sheet',()=>state.world.pianoSheet.taken=true],
  ['piano',()=>state.world.piano.solved=true],
  ['red-key',()=>state.world.piano.reward.taken=true],
  ['hatch-rug',()=>state.world.hatchRug.aside=true],
  ['basement-hatch',()=>state.world.hatch.locked=false],
  ['master-key',()=>state.s.inventory.masterKey=true],
  ['rescue-louis',()=>state.puzzle.rescued=true],
  ['hide-kitchen',()=>state.events.phase='rc-setup'],
  ['rc-car',()=>state.s.inventory.rc=true],
  ['basement-hatch',()=>state.rcTrap.armed=true],
  ['basement-hatch',()=>state.rcTrap.closed=true],
  ['entrada',()=>state.events.phase='safe']
 ];
 Object.assign(state,{world:createHouse(),puzzle:{key:true},s:{inventory:{}},events:{phase:'explore'},mirrorSafe:{},rcTrap:{}});
 // Use a clean world for ordered progression after the legacy migration check.
 const routeWorld=state.world;
 assert.equal(rescueProgress({...state,puzzle:{}}).percent,0);
 let previous=0;
 for(const [id,advance] of steps){
  const objective=tracker.update(state);
  if(id==='bath-mirror')assert(objective.name.includes('espejo'));
  else assert.equal(objective.target,routeWorld.objects.find(o=>o.id===id));
  advance();
  const progress=rescueProgress(state);
  assert(progress.percent>=previous);previous=progress.percent;
  if(id==='hide-kitchen')assert.equal(previous,99);
  if(id==='entrada')assert.equal(previous,100);
 }
 assert.equal(tracker.update(state),null);
 console.log('PASS Emy retrieves and hands over the ribbon, senses power and danger, pauses in cover, returns at the exit; ordered rewards and old checkpoints.');
};
if(require.main===module)module.exports().catch(error=>{console.error(error);process.exitCode=1;});
