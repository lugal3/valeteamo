const assert=require('node:assert/strict');
(async()=>{
 const {createHouse,blocked}=await import('../src/lab/world.js');
 const {hidePeekSupported,hideLookBounds,advanceHidePeek,hiddenCamera}=await import('../src/lab/hiding.js');
 const {pursuerShadowPieces,shadowRelevant,shadowNeedsUpdate}=await import('../src/lab/pursuer-shadow.js');
 const {geometry}=await import('../src/lab/renderer.js');
 const {posePursuer}=await import('../src/lab/pursuer-model.js');
 const world=createHouse();
 for(const id of ['wardrobe','underbed']){
  const object=world.objects.find(o=>o.id===id),hidden={...object.hideCamera,hideType:object.hideType,objectId:id};
  assert(hidePeekSupported(hidden));
  const base=hiddenCamera(hidden,hidden.yaw,0,0,0,true);
  let peek=0;
  for(let i=0;i<60;i++)peek=advanceHidePeek(peek,true,1/60);
  assert(peek>.99&&peek<=1);
  for(const direction of [-1,0,1])for(let step=0;step<=10;step++){
   const view=hiddenCamera(hidden,hidden.yaw+direction*2,0,step/10,0,true);
   assert(Math.hypot(view.x-base.x,view.z-base.z)<.32);
   assert(!blocked(world.boxes,view.x,view.y-.025,view.z,.025,.05),'Camera stays inside clear refuge: '+id+' '+JSON.stringify(view));
  }
  for(let i=0;i<60;i++)peek=advanceHidePeek(peek,false,1/60);
  assert(peek<.01);
  assert.deepEqual(hiddenCamera(hidden,hidden.yaw,0,0,0,true),base);
 }
 assert(!hidePeekSupported({hideType:'understairs'}));
 assert.equal(advanceHidePeek(0,true,0,true),1);
 assert.equal(advanceHidePeek(1,false,0,true),0);
 const pieces=pursuerShadowPieces(),mesh=geometry(pieces),posed=new Float32Array(mesh.vertices.length);
 assert(pieces.length<=16&&mesh.vertices.length/16<1000,'Keep caster geometry small');
 const actor={active:true,x:5.8,y:0,z:11,facing:0,yaw:0,walk:1,speed:1.1,age:1,mode:'search'};
 posePursuer(mesh.vertices,posed,mesh.groups,actor);
 assert([...posed].every(Number.isFinite),'Real posed caster produces finite geometry');
 assert(shadowRelevant({x:6,y:2.7,z:11},actor));
 assert(!shadowRelevant({x:6,y:5.8,z:11},actor),'No invalidation of floor above');
 assert(!shadowRelevant({x:20,y:2.7,z:11},actor),'No distant invalidation');
 const old={...actor,time:1,bedTime:0};
 assert(shadowNeedsUpdate(null,actor,1));
 assert(!shadowNeedsUpdate(old,{...actor,x:actor.x+.1},1.03));
 assert(shadowNeedsUpdate(old,{...actor,x:actor.x+.1},1.2));
 assert(shadowNeedsUpdate(old,null,1.03),'Remove stale shadow immediately');
 const {inspectionMesh,inspectionBounds,inspectionDefault,changeInspection,projectInspection}=await import('../src/lab/object-inspection.js');
 const objects=world.objects.filter(o=>['key','battery','note','flashlight','screwdriver','rc-car'].includes(o.kind)&&!o.mirrored);
 const kinds=new Set();
 for(const o of objects){
  const before=JSON.stringify(o),mesh=inspectionMesh(o);assert(mesh?.vertices.length&&mesh.indices.length,'Existing mesh: '+o.id);
  kinds.add(o.kind);assert.equal(JSON.stringify(o),before,'Inspection does not mutate world object');
  const bounds=inspectionBounds(mesh.vertices);assert(bounds.radius>0&&bounds.center.every(Number.isFinite));
  for(const change of [{},{dx:90,dy:-65,ratio:1.65},{dx:-200,dy:120,ratio:.5}]){
   const view=changeInspection(inspectionDefault(),change),projected=projectInspection(mesh,bounds,view,420,240);
   assert(projected.faces.length>0&&projected.pts.every(Number.isFinite));
   for(const face of projected.faces)assert(face.color.every(c=>Number.isInteger(c)&&c>=0&&c<=255));
   assert(projected.faces.every((face,i,all)=>i===0||face.z>=all[i-1].z),'Painter order');
  }
 }
 assert.equal(kinds.size,6,'Every supported object kind is backed by a real pickup model');
 assert.equal(inspectionMesh(world.objects.find(o=>o.id==='mirror-note')),null,'Mirror clue remains in its original restricted puzzle');
 assert.equal(changeInspection(inspectionDefault(),{ratio:99}).zoom,1.65);
 assert.equal(changeInspection(inspectionDefault(),{ratio:.01}).zoom,.75);
 assert.deepEqual(changeInspection(inspectionDefault(),{ratio:NaN}),inspectionDefault());
 const {openRescueHouseSave,RESCUE_SAVE_KEY}=await import('../src/demo/progression.js');
 const initial=JSON.stringify({version:2,phase:'house',heart:true,abducted:true,trail:true,house:true,rescued:false});
 let stored=initial;globalThis.localStorage={getItem:key=>key===RESCUE_SAVE_KEY?stored:null,setItem:(key,value)=>{stored=value;}};
 const save=openRescueHouseSave(),checkpoint={version:2,stage:'explore',picked:['key']};
 assert.equal(save.save(checkpoint),true,'Only a successful write shows the paw');
 assert.equal(save.save(checkpoint),false,'Identical state must not replay the paw');
 stored=initial;assert.equal(save.save({...checkpoint,lives:2}),false,'Do not overwrite a new tab/reset');
 delete globalThis.localStorage;
 console.log('PASS immersive polish: bounded peek, actual collision-free refuge camera, posed shadow proxy and real save result');
})().catch(e=>{console.error(e);process.exitCode=1});
