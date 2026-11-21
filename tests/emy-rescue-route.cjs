const assert=require('node:assert/strict');

module.exports=async()=>{
 const {interactionTarget}=await import('../src/lab/interactions.js');
 const {createHouse,setDoor,blocked,groundHeight}=await import('../src/lab/world.js');
 const {createEmyCompanion,requestRibbonKey,updateEmyCompanion,sendEmyToTrunk}=await import('../src/lab/emy-companion.js');
 const {createRescueObjectives,updateEmySenses,poseEscapeAmbush}=await import('../src/lab/emy-rescue.js');
 const {Pursuer}=await import('../src/lab/pursuer.js');
 const {restoreHouseCheckpoint}=await import('../src/lab/house-checkpoint.js');
 const world=createHouse(),item=id=>world.objects.find(o=>o.id===id);
 for(const door of world.objects.filter(o=>o.kind==='door'))setDoor(door,true);
 const s={x:2.2,y:0,z:1.5,inventory:{notes:[]}},cat=createEmyCompanion(world.emy,{waiting:false});
 const vent=item('emy-vent'),key=item('key'),hunter=new Pursuer(world);
 const state={world,s,puzzle:{},events:{phase:'explore'},mirrorSafe:{},rcTrap:{}};
 const tracker=createRescueObjectives();
 let changes=0;tracker.addEventListener('change',()=>changes++);
 assert.equal(tracker.update(state).target,vent);
 tracker.update(state);assert.equal(changes,1);
 assert(requestRibbonKey(cat,vent,key));assert(!requestRibbonKey(cat,vent,key));
 const cues=[];
 for(let i=0;i<900&&cat.stage==='fetch';i++){
  const cue=updateEmyCompanion(cat,1/30,{world,player:s});
  if(cue)cues.push(cue);
 }
 assert(cues.length>=4&&cues.slice(0,-1).every(cue=>cue==='scratch'));assert.equal(cues.at(-1),'delivered');assert.equal(cat.stage,'following');
 assert(Math.hypot(cat.cat.x-s.x,cat.cat.z-s.z)<.86);
 state.puzzle.key=true;assert.equal(tracker.update(state).target,item('dormitorio'));
 assert.equal(changes,2);
 assert(world.pianoSheet.concealed);assert.equal(world.piano.reward,item('red-key'));
 const master=item('master-key'),x=7.86,z=12.26,y=groundHeight(x,z,master.floor,true);
 assert(y<0&&!blocked(world.boxes,x,y,z,.2,1.7));
 const dx=master.x-x,dz=master.z-z;
 assert.equal(interactionTarget(world,{x,y:y+1.63,z,yaw:Math.atan2(dx,dz),pitch:Math.atan2(master.y-y-1.63,Math.hypot(dx,dz))}),master);
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
 assert.equal(cat.cat.y,0);assert(cat.cat.z>14&&hunter.z<12);
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
 for(const [id,advance] of steps){
  const objective=tracker.update(state);
  if(id==='bath-mirror')assert(objective.name.includes('espejo'));
  else assert.equal(objective.target,routeWorld.objects.find(o=>o.id===id));
  advance();
 }
 assert.equal(tracker.update(state),null);
 console.log('PASS Emy retrieves and hands over the ribbon, senses power and danger, pauses in cover, returns at the exit; ordered rewards and old checkpoints.');
};
if(require.main===module)module.exports().catch(error=>{console.error(error);process.exitCode=1;});
