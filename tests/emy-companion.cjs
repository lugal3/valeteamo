const assert=require('node:assert/strict');
(async()=>{
 const {createHouse,setDoor,lineBlocked}=await import('../src/lab/world.js');
 const {Pursuer}=await import('../src/lab/pursuer.js');
 const {petEmy,emyLandmarks}=await import('../src/lab/emy-cat.js');
 const {EMY_ENTRANCE_SECONDS,createEmyCompanion,beginEmyEntrance,emyEntranceCamera,sendEmyToTrunk,
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
 assert.equal(cues.filter(cue=>cue==='landed').length,1);
 assert.equal(companion.stage,'following');assert.equal(world.emy.y,0);
 assert(petEmy(world.emy));
 updateEmyCompanion(companion,1/60,{world,player});assert.equal(world.emy.phase,'purr');
 world.emy.reaction=0;
 const route=new Pursuer(world);Object.assign(route,player);
 assert(route.plan({x:2.3,y:3.15,z:3.85}));
 for(const point of route.path){Object.assign(player,{x:point.x,y:point.y,z:point.z});
  for(let i=0;i<14;i++)updateEmyCompanion(companion,1/60,{world,player});
 }
 Object.assign(player,{x:2.3,y:3.15,z:3.85});
 for(let i=0;i<60*60;i++)updateEmyCompanion(companion,1/60,{world,player});
 assert.equal(world.emy.y,3.15,'Emy climbs the stairs behind Kitty');
 assert(Math.hypot(world.emy.x-player.x,world.emy.z-player.z)<1.1);
 const enteringHide={objectId:'wardrobe',returnX:player.x,returnZ:player.z};
 for(let i=0;i<45&&companion.stage!=='hiding';i++)updateEmyCompanion(companion,1/60,{world,player,enteringHide});
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
 assert(checkedFit);
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
 console.log('PASS Emy companion: one-shot window jump, camera turn, two-floor follow, petting, shared hide, trunk route and restore.');
})().catch(error=>{console.error(error);process.exitCode=1});
