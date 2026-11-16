// Real kitchen navigation + rigging regression: counter faces the
// doorway, Louis goes around the free north end, and his photographic head
// stays underneath the solid counter when crouched (no face clipping).
const assert=require('node:assert/strict');
(async()=>{
 const {createHouse,blocked}=await import('../src/lab/world.js');
 const {createLouisEscape,updateLouisEscape,freeLouis,
  LOUIS_HIDING_SPOT,LOUIS_RESCUE_ROUTE,LOUIS_EXIT_ROUTE}=await import('../src/lab/louis-escape.js');
 const {KITCHEN_BAR,KITCHEN_HIDE_SPOT,KITCHEN_HIDE_APPROACH}=await import('../src/lab/kitchen-hide-layout.js');
 const {pickupGeometry,geometry}=await import('../src/lab/renderer.js');
 const {sampleLoisRig,writeLoisRigPart}=await import('../src/lab/lois-ps2-rig.js');
 const world=createHouse();
 const get=id=>world.boxes.find(b=>b.id===id);
 const top=get('kitchen-bar-top'),screen=get('kitchen-bar-screen'),key=world.objects.find(o=>o.id==='red-key');
 assert(top&&screen&&key,'counter and original red key retained');
 assert(top.d>top.w*2.5&&screen.d>screen.w*10,
  'front panel spans Z and faces the west-facing kitchen entrance');
 assert(Math.abs(top.x-KITCHEN_BAR.x)<1e-6);
 assert(Math.abs(top.z-KITCHEN_BAR.z)<1e-6);
 assert(top.solid&&screen.solid,'panel and countertop physically block crossing');
 assert(key.x>=top.x-top.w/2&&key.x<=top.x+top.w/2&&
  key.z>=top.z-top.d/2&&key.z<=top.z+top.d/2,
  'red puzzle key remains on top of rotated countertop');
 const hide=world.objects.find(o=>o.id==='hide-kitchen');
 assert(hide&&hide.x===KITCHEN_HIDE_SPOT.x&&hide.z===KITCHEN_HIDE_SPOT.z);
 assert(KITCHEN_HIDE_SPOT.x>top.x+top.w/2+.3,
  'Louis hides physically behind the east/back side of the counter');
 assert(KITCHEN_HIDE_APPROACH.some(p=>p.z<KITCHEN_BAR.northEnd-.22),
  'route must go around north end, not pass through front panel');
 // Treat Louis as a person with a nonzero physical radius and full height
 // throughout the approach. Sample every ~2cm, not just coarse waypoints.
 const floorPath=[{x:8.55,z:2.65},...KITCHEN_HIDE_APPROACH];
 for(let k=1;k<floorPath.length;k++){
  const a=floorPath[k-1],b=floorPath[k],length=Math.hypot(b.x-a.x,b.z-a.z);
  for(let i=0;i<=Math.ceil(length/.02);i++){
   const t=i/Math.ceil(length/.02),x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
   // Skip hatch-edge transition; it is a special open walking surface.
   if(k===1&&t<.55)continue;
   assert(!blocked(world.boxes,x,0,z,.155,1.64),
    'Louis route cannot clip furniture at segment '+k+' t='+t.toFixed(2)+' x='+x.toFixed(2)+' z='+z.toFixed(2));
  }
 }
 const actor=createLouisEscape(world);
 const dt=1/30;
 const events=[],trail=[];
 let hideStart=null,hiddenSample=null;
 for(let i=0;i<2200&&actor.phase!=='hidden';i++){
  const phaseBefore=actor.phase,yawBefore=actor.yaw;
  const cue=updateLouisEscape(actor,dt);
  if(phaseBefore==='hide'){
   const diff=Math.atan2(Math.sin(actor.yaw-yawBefore),Math.cos(actor.yaw-yawBefore));
   assert(Math.abs(diff)<.39,'Louis turns toward counter gradually, never snaps');
  }
  if(cue)events.push(cue);
  if(i%6===0)trail.push({x:actor.x,z:actor.z,phase:actor.phase});
  if(actor.phase==='hide'&&phaseBefore!=='hide')hideStart={x:actor.x,y:actor.y,z:actor.z};
 }
 assert.equal(actor.phase,'hidden','Louis completes full basement-to-bar path without stalling');
 assert.deepEqual(events,['untied','arrived','hidden']);
 assert(hideStart&&Math.hypot(hideStart.x-KITCHEN_HIDE_SPOT.x,hideStart.z-KITCHEN_HIDE_SPOT.z)<.06);
 assert(Math.hypot(actor.x-LOUIS_HIDING_SPOT.x,actor.z-LOUIS_HIDING_SPOT.z)<.01);
 assert(trail.some(p=>p.phase==='climb'&&p.z<KITCHEN_BAR.northEnd-.22&&p.x>10.5),
  'camera sees Louis walk around counter tip, not teleport behind it');
 assert(actor.crouch>=.99,'he must finish squatting behind the panel');
 assert(Math.abs(Math.atan2(Math.sin(actor.yaw-KITCHEN_HIDE_SPOT.yaw),
  Math.cos(actor.yaw-KITCHEN_HIDE_SPOT.yaw)))<.025,
  'he faces the wood panel before finishing the hide animation');
 // Actual skinned WebGL head and hair, including the new anatomical face.
 const parts=pickupGeometry([actor]),mesh=geometry(parts);
 const bind=[actor.x,actor.y,actor.z],output=new Float32Array(mesh.vertices);
 const rig=sampleLoisRig(actor);
 let headTop=-Infinity,headCount=0;
 for(let i=0;i<parts.length;i++){
  const range=mesh.ranges[i],part=parts[i];
  writeLoisRigPart(output,mesh.vertices,range.start,range.end,part,bind,actor,rig);
  if(part.rigBone==='head'){
   for(let v=range.start;v<range.end;v+=16){
    headTop=Math.max(headTop,output[v+1]);headCount++;
   }
  }
 }
 assert(headCount>200&&Number.isFinite(headTop),'photographic head and scalp are real visible geometry');
 assert(headTop<KITCHEN_BAR.top-.012,
  'hair/head clips above the breakfast bar: top '+headTop.toFixed(3));
 assert(actor.x>top.x+top.w/2+.3,'no head intersects countertop horizontally');
 // Leaving hiding must NOT pop the head up in one frame. Animate smooth rise
 // while restoring normal follow and the existing RC trap/cinematics.
 const heightAt=state=>sampleLoisRig(state).bones.head.translation[1];
 const before=heightAt(actor);
 assert(freeLouis(actor),'can stand up after RC trap');
 updateLouisEscape(actor,dt,{x:actor.x,y:actor.y,z:actor.z,yaw:0});
 const after=heightAt(actor);
 assert(Math.abs(after-before)<.10,'head rises smoothly, no instantaneous snap');
 assert.equal(actor.phase,'follow');
 assert(actor.exitRouteActive,'escaping Louis initially retraces the safe passage');
 const backTrail=[];
 for(let i=0;i<430&&actor.exitRouteActive;i++){
  updateLouisEscape(actor,dt,{x:8.5,y:0,z:2.0,yaw:0});
  if(i%5===0)backTrail.push({x:actor.x,z:actor.z});
  assert(!blocked(world.boxes,actor.x,actor.y,actor.z,.155,1.64),
   'Louis returning to Kitty must not cut through kitchen stone or wall');
 }
 assert(!actor.exitRouteActive,'Louis finishes rear-to-front path without stalling');
 assert(LOUIS_EXIT_ROUTE.length>=5,'exit path retains the walk around the bar');
 assert(Math.hypot(actor.x-LOUIS_EXIT_ROUTE.at(-1).x,
  actor.z-LOUIS_EXIT_ROUTE.at(-1).z)<.14,
  'Louis exits by north gap and returns to front of the bar');
 assert(output.every(Number.isFinite),'no NaN on all skinned geometry');
 console.log('PASS KITCHEN LOUIS HIDE',JSON.stringify({
  counterOrientation:'front-facing',routeSamples:trail.length,hide:{x:actor.x,z:actor.z},
  headTop:Number(headTop.toFixed(3)),stoneTop:KITCHEN_BAR.top,
  headRiseFirstFrame:Number((after-before).toFixed(4)),returnSamples:backTrail.length
 }));
})().catch(e=>{console.error(e);process.exitCode=1;});
