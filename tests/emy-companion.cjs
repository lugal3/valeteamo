const assert=require('node:assert/strict');
(async()=>{
 const {createHouse,setDoor,lineBlocked}=await import('../src/lab/world.js');
 const {Pursuer}=await import('../src/lab/pursuer.js');
 const {petEmy,emyLandmarks}=await import('../src/lab/emy-cat.js');
 const {EMY_ENTRANCE_SECONDS,FOLLOW_STOP,FOLLOW_RESUME,createEmyCompanion,beginEmyEntrance,emyEntranceCamera,sendEmyToTrunk,
  updateEmyCompanion,snapshotEmyCompanion,restoreEmyCompanion}=await import('../src/lab/emy-companion.js');
 const world=createHouse();
 for(const id of ['salon','estudio','dormitorio'])setDoor(world.objects.find(o=>o.id===id),true);
 const player={x:5.3,y:0,z:7.1,yaw:2,hidden:null},companion=createEmyCompanion(world.emy);
 assert.equal(companion.stage,'waiting');assert(world.emy.parts.every(part=>part.box.hiddenGeometry));
 assert(beginEmyEntrance(companion));assert(!beginEmyEntrance(companion));
 const view={x:player.x,y:1.63,z:player.z,yaw:player.yaw,pitch:0};
 assert.equal(emyEntranceCamera(view,0).yaw,view.yaw);
 assert.equal(emyEntranceCamera(view,1).yaw,view.yaw);
 assert.notEqual(emyEntranceCamera(view,.5).yaw,view.yaw);
 assert.equal(emyEntranceCamera(view,.5,true).x,4.85);
 assert(!lineBlocked(world.boxes,emyEntranceCamera(view,.5),{x:2.2,y:1.6,z:12.2}),
  'the door is open and Kitty can see Emy through the doorway');
 const leap=emyLandmarks('jump');assert(leap.legs.front1.paw[1]>.15&&leap.legs.hind1.paw[1]>.1);
 const cues=[];
 for(let i=0;i<Math.ceil(EMY_ENTRANCE_SECONDS*60)+2;i++){
  const cue=updateEmyCompanion(companion,1/60,{world,player});if(cue)cues.push(cue);
 }
 assert.equal(cues.filter(cue=>cue==='jump').length,1);
 assert(cues.indexOf('touchdown')>cues.indexOf('jump')&&cues.indexOf('landed')>cues.indexOf('touchdown'));
 assert.equal(cues.filter(cue=>cue==='landed').length,1);
 assert.equal(companion.stage,'following');assert.equal(world.emy.y,0);
 // Reduced motion must keep the intended 3x entrance speed even at 10 FPS.
 for(const delta of [1/60,.1,.3]){
  const slowWorld=createHouse(),actor=createEmyCompanion(slowWorld.emy),signals=[];
  assert(beginEmyEntrance(actor));
  const bounded=Math.min(delta,.1),frames=Math.ceil(EMY_ENTRANCE_SECONDS/(bounded*3))+1;
  for(let i=0;i<frames&&actor.stage==='entrance';i++){
   const cue=updateEmyCompanion(actor,delta,{world:slowWorld,player,reduced:true});
   if(cue)signals.push(cue);
  }
  assert.equal(actor.stage,'following','Reduced entrance must finish at delta '+delta);
  assert.deepEqual(signals,['jump','touchdown','landed'],'Each cue occurs once in order');
  assert.equal(slowWorld.emy.y,0);
 }
 assert(petEmy(world.emy));
 updateEmyCompanion(companion,1/60,{world,player});assert.equal(world.emy.phase,'purr');
 world.emy.reaction=0;
 // Emy preserves a comfortable resting ring: circling close to her must not
 // turn her into a compass needle or make her shuffle after Kitty.
 const personalWorld=createHouse();
 for(const id of ['salon','estudio','dormitorio'])setDoor(personalWorld.objects.find(o=>o.id===id),true);
 const personalPlayer={x:7.17,y:0,z:8.1,yaw:0,hidden:null};
 const personal=createEmyCompanion(personalWorld.emy,{waiting:false});
 Object.assign(personal.cat,{x:5.95,y:0,z:8.1,yaw:.72});
 const settled={x:personal.cat.x,z:personal.cat.z,yaw:personal.cat.yaw};
 for(let i=0;i<120;i++){
  const a=i/120*Math.PI*2;
  personalPlayer.x=personal.cat.x+1.22*Math.cos(a);
  personalPlayer.z=personal.cat.z+1.22*Math.sin(a);
  updateEmyCompanion(personal,1/60,{world:personalWorld,player:personalPlayer});
 }
 assert(Math.hypot(personal.cat.x-settled.x,personal.cat.z-settled.z)<.0001,'Emy stays put while Kitty circles nearby');
 assert(Math.abs(personal.cat.yaw-settled.yaw)<.0001,'Emy does not constantly look at nearby Kitty');
 personalPlayer.x=5.95;personalPlayer.z=11.1;
 updateEmyCompanion(personal,1/60,{world:personalWorld,player:personalPlayer});
 assert(personal.chasing,'Emy resumes following once Kitty really moves away');
 for(let i=0;i<119;i++)updateEmyCompanion(personal,1/60,{world:personalWorld,player:personalPlayer});
 assert(personal.cat.z>settled.z+.25,'Emy closes the larger gap without hovering at Kitty’s heels');
 for(let i=0;i<180;i++)updateEmyCompanion(personal,1/60,{world:personalWorld,player:personalPlayer});
 const personalGap=Math.hypot(personal.cat.x-personalPlayer.x,personal.cat.z-personalPlayer.z);
 assert(personalGap>=FOLLOW_STOP-.06&&personalGap<=FOLLOW_RESUME+.05,'Natural resting distance, got '+personalGap);
 const route=new Pursuer(world);Object.assign(route,player);
 assert(route.plan({x:2.3,y:3.15,z:3.85}));
 for(const point of route.path){Object.assign(player,{x:point.x,y:point.y,z:point.z});
  for(let i=0;i<14;i++)updateEmyCompanion(companion,1/60,{world,player});
 }
 Object.assign(player,{x:2.3,y:3.15,z:3.85});
 for(let i=0;i<60*60;i++)updateEmyCompanion(companion,1/60,{world,player});
 assert.equal(world.emy.y,3.15,'Emy climbs the stairs behind Kitty');
 assert(Math.hypot(world.emy.x-player.x,world.emy.z-player.z)<=FOLLOW_RESUME+.06,'After climbing, stop at the new natural distance');
 const enteringHide={objectId:'wardrobe',returnX:player.x,returnZ:player.z};
 let sawEntry=false;
 for(let i=0;i<180&&companion.stage!=='hiding';i++){
  updateEmyCompanion(companion,1/60,{world,player,enteringHide});
  if(companion.stage==='closet-entry'){sawEntry=true;assert(!world.emy.hidden);}
 }
 assert(sawEntry,'Emy visibly crosses the wardrobe threshold before Kitty moves');
 assert.equal(player.hidden,null,'Emy takes cover during Kitty’s entry animation');
 player.hidden=enteringHide;
 assert.equal(companion.stage,'hiding');assert(world.emy.parts.every(part=>part.box.hiddenGeometry));
 player.hidden=null;updateEmyCompanion(companion,1/60,{world,player});
 assert.equal(companion.stage,'following');assert(world.emy.parts.every(part=>!part.box.hiddenGeometry));
 setDoor(world.objects.find(o=>o.id==='estudio'),false);
 const {updateFurniture}=await import('../src/lab/furniture-motion.js');
 assert(sendEmyToTrunk(companion));
 const {geometry}=await import('../src/lab/renderer.js');
 let checkedFit=false;
 for(let i=0;i<60*80&&companion.stage!=='trunk';i++){
  updateEmyCompanion(companion,1/60,{world,player});
  updateFurniture(world.objects,1/60,player);
  if(companion.stage==='trunk-enter'&&companion.entranceAge>2.1&&!checkedFit){
   const mesh=geometry(world.emy.parts.map(part=>part.box)).vertices;
   const lid=world.boxes.find(box=>box.id==='trunk-lid');
   for(let v=0;v<mesh.length;v+=16){
    assert(Math.abs(mesh[v]-lid.x)<.54&&Math.abs(mesh[v+2]-lid.z)<.39,'curled coat fits inside the trunk walls');
    assert(mesh[v+1]>=.149&&mesh[v+1]<lid.y-lid.h/2,'paws rest on the base and ears clear the closed lid');
   }
   checkedFit=true;
  }
 }
 assert(checkedFit,'Trunk approach: '+JSON.stringify({x:companion.cat.x,y:companion.cat.y,z:companion.cat.z,stage:companion.stage,route:companion.route.slice(0,8),target:companion.routeTarget,stuck:companion.stuck,studyDoor:world.objects.find(o=>o.id==='estudio').state}));
 assert.equal(companion.stage,'trunk','Emy uses the stairs and enters the study trunk');
 assert(world.emy.parts.every(part=>part.box.hiddenGeometry));
 // A planted foot should stay put even when the body turns over it.
 const {poseEmy}=await import('../src/lab/emy-cat.js');
 const rig=createHouse().emy;
 const contacts=new Map();
 let comparisons=0;
 for(let i=0;i<120;i++){
  rig.x+=.008*Math.sin(rig.yaw);
  rig.z+=.008*Math.cos(rig.yaw);
  rig.yaw+=.004;
  poseEmy(rig,{walking:true,mode:'walk',phase:i/60});
  for(const [key,leg] of Object.entries(rig.landmarks.legs)){
   const [x,y,z]=leg.paw,cs=Math.cos(rig.yaw),sn=Math.sin(rig.yaw);
   const foot=[rig.x+x*cs+z*sn,rig.y+y,rig.z-x*sn+z*cs];
   const old=contacts.get(key);
   if(old&&rig.footContacts[key]===old.anchor){
    assert(Math.hypot(...foot.map((v,j)=>v-old.foot[j]))<.00001,'no sliding during support');
    comparisons++;
   }
   if(rig.footContacts[key])contacts.set(key,{foot,anchor:rig.footContacts[key]});
   else contacts.delete(key);
  }
 }
 assert(comparisons>180);
 const saved=snapshotEmyCompanion(companion),loaded=createEmyCompanion(createHouse().emy);
 restoreEmyCompanion(loaded,saved,'hunt');
 assert.equal(loaded.stage,'trunk');assert(loaded.cat.parts.every(part=>part.box.hiddenGeometry));
 assert(!petEmy(loaded.cat),'a hidden cat cannot be petted');
 await require('./emy-rescue-route.cjs')();
 console.log('PASS Emy companion: one-shot window jump, camera turn, two-floor follow, petting, shared hide, trunk route and restore.');
})().catch(error=>{console.error(error);process.exitCode=1});
