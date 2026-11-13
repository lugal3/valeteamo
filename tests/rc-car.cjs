const assert=require('node:assert/strict');
(async()=>{
 const {createHouse,blocked,groundHeight,setDoor,HEIGHT}=await import('../src/lab/world.js');
 const {poseHatch}=await import('../src/lab/basement.js');
 const {Pursuer}=await import('../src/lab/pursuer.js');
 const rcModule=await import('../src/lab/rc-car.js');
 const {createLouisEscape,updateLouisEscape,freeLouis,louisModel,louisPartPose,LOUIS_UNTIE_SECONDS}=await import('../src/lab/louis-escape.js');
 const {interactionTarget}=await import('../src/lab/interactions.js');
 const {createRC,deployRC,driveRC,updateRC,stopRC,beepRC,crashRC,recoverRC,rcCamera,canTrapPursuer,rcCarModel}=rcModule;
 const world=createHouse(),kit=world.objects.find(o=>o.id==='rc-car');
 assert(kit&&kit.kind==='rc-car','A single collectible RC kit must exist beside the upstairs piano');
 assert(Math.hypot(kit.x-13.55,kit.z-3.99)<1.6);
 const rc=createRC(kit);
 assert.equal(rc.mode,'packed');
 let spawn=null;
 for(let x=9;x<13.1&&!spawn;x+=.5)for(let z=.6;z<3.4;z+=.4){
  const forward={x,y:HEIGHT,z:z+.75};
  if(!blocked(world.boxes,x,HEIGHT,z,.2,1.65)&&!blocked(world.boxes,forward.x,forward.y,forward.z,.22,.38)) {spawn={x,y:HEIGHT,z,yaw:0};break;}
 }
 assert(spawn,'Must have an unblocked upper-floor launch spot');
 assert(deployRC(rc,spawn,world),'Deploy succeeds on a clear upper floor');
 assert.equal(rc.mode,'deploying');updateRC(rc,.5);assert.equal(rc.mode,'deploying');
 updateRC(rc,.55);assert.equal(rc.mode,'driving');
 assert.equal(kit.taken,false);
 assert(rcCarModel((id,x,y,z,w,h,d)=>({id,x,y,z,w,h,d})).length>16);
 assert(rcCarModel((id,x,y,z,w,h,d)=>({id,x,y,z,w,h,d}),true).length>20);
 const old={x:rc.x,z:rc.z};driveRC(rc,world,{throttle:1,steer:0},.05);
 assert(Math.hypot(rc.x-old.x,rc.z-old.z)>0,'Car moves on valid floors');
 assert(Number.isFinite(rcCamera(rc,world).pitch));
 assert(beepRC(rc));assert.equal(rc.noise,8);updateRC(rc,.1);assert(rc.noise<8);
 assert(stopRC(rc));assert.equal(rc.mode,'parked');
 assert(deployRC(rc,spawn,world));updateRC(rc,1.01);
 const relocated=crashRC(rc,world);assert.equal(rc.mode,'disabled');assert.equal(kit.interactable,true);
 assert.equal(kit.x,relocated.x);assert(recoverRC(rc));assert.equal(rc.mode,'packed');assert(kit.taken);
 const tunnel=world.hatch;tunnel.open=true;poseHatch(tunnel,1);
 assert(canTrapPursuer({active:true,x:8.55,y:-2.5,z:7},tunnel,true));
 assert(!canTrapPursuer({active:true,x:8.55,y:0,z:3},tunnel,true));
 assert(!canTrapPursuer({active:true,x:8.55,y:-2.5,z:7},tunnel,false));
 const hunter=new Pursuer(world);hunter.start();hunter.nodes=null;
 const planned=hunter.plan({x:8.55,y:-3.55,z:12.4});
 if(!planned){
  const end=hunter.nodes.reduce((a,n)=>Math.hypot(n.x-8.55,(n.y+3.55)*2,n.z-12.4)<Math.hypot(a.x-8.55,(a.y+3.55)*2,a.z-12.4)?n:a,hunter.nodes[0]);
  const start=hunter.nodes.reduce((a,n)=>Math.hypot(n.x-hunter.x,(n.y-hunter.y)*2,n.z-hunter.z)<Math.hypot(a.x-hunter.x,(a.y-hunter.y)*2,a.z-hunter.z)?n:a,hunter.nodes[0]);
  const reachable=new Set([start.index]),queue=[start.index];for(const id of queue)for(const ni of hunter.nodes[id].neighbors)if(!reachable.has(ni)){reachable.add(ni);queue.push(ni);}
  console.log('RC_BASEMENT_ROUTE_DIAGNOSTIC',JSON.stringify({nodeReasons:[3.8,4.0,4.2,4.4,4.6].map(z=>{const y=groundHeight(8.6,z,-3.55,true);return {z,y,blocking:world.boxes.filter(box=>box.solid&&!box.walkSurface&&!(box.id.startsWith('floor-up-'))&&y<box.y+box.h/2-.02&&y+1.72>box.y-box.h/2+.02&&Math.max(0,Math.abs((8.6-box.x)*Math.cos(box.yaw||0)+(z-box.z)*Math.sin(box.yaw||0))-box.w/2)**2+Math.max(0,Math.abs(-(8.6-box.x)*Math.sin(box.yaw||0)+(z-box.z)*Math.cos(box.yaw||0))-box.d/2)**2<.16*.16).map(b=>b.id)};}),nodes:hunter.nodes.length,start,end,reachable:reachable.size,underground:hunter.nodes.filter(n=>n.y<-0.2).length,
   connectedUnderground:hunter.nodes.filter(n=>n.y<-0.2&&reachable.has(n.index)).length,
   nearby:hunter.nodes.filter(n=>Math.abs(n.x-8.6)<.45&&n.z>2.2&&n.z<5.8).map(n=>({x:n.x,y:n.y,z:n.z,connections:n.neighbors.length,reachable:reachable.has(n.index)})).slice(0,50)}));
 }
 assert(planned,'Enemy can plan a route into an OPEN basement');
 // Regression: a pursuer spawned at the real house entrance must follow a
 // continuously noisy toy, open available paths and descend the physical hatch.
 setDoor(world.objects.find(o=>o.id==='cocina'),true);
 const real=new Pursuer(world);
 real.start();real.nodes=null;
 const distantKitty={x:6.1,y:0,z:8.7,hidden:true};
 const noisyToy={active:true,noisy:true,x:8.55,y:-3.55,z:12.4,crouched:true,hidden:false};
 for(let i=0;i<600&&!(real.y<-.55&&real.z>4.35);i++){
  real.update(.05,distantKitty,()=>{},noisyToy);
  assert(Number.isFinite(real.x)&&Number.isFinite(real.y)&&Number.isFinite(real.z),'NPC position remains finite on basement route');
 }
 assert(real.y<-.55&&real.z>4.35,'NPC physically descends into the basement from its natural spawn');
 const louis=createLouisEscape(world);
 const model=louisModel((id,x,y,z,w,h,d,mat,extra)=>({id,x,y,z,w,h,d,mat,extra}));
 assert(model.length>55,'Louis face and body have layered, detailed geometry');
 for(const detail of ['fringe-0','fringe-4','iris--1','beard-chin','nose-tip','lid--1','jaw--1','upper-arm--1','hand-1'])
  assert(model.some(p=>p.id===detail),'Missing recognizable face/animation feature: '+detail);
 assert.equal(louis.phase,'untying','Rescue starts with a cinematic release, not an instant teleport');
 let releases=0;
 for(let i=0;i<800&&louis.phase!=='hidden';i++){
  const cue=updateLouisEscape(louis,.05);
  if(cue==='untied'){releases++;assert(louis.age<.051,'Untying cuts to the escape only after the full sequence');}
  assert(Number.isFinite(louis.x)&&Number.isFinite(louis.y)&&Number.isFinite(louis.z),'Cinematic positions remain finite');
 }
 assert.equal(releases,1,'The rope release must happen exactly once');
 assert(LOUIS_UNTIE_SECONDS>=2.5,'Untying must show more than a single frame');
 assert.equal(louis.phase,'hidden','Louis climbs from basement and hides by the kitchen bar');
 assert(louis.crouch>.99,'Louis crouches physically while hidden');
 const mock=(id)=>({id:'pickup-louis-escape-'+id,baseRoll:0,basePitch:0,baseYaw:0});
 const eye=mock('eye--1'),arm=mock('hand--1'),offset=[-.076,1.473,.158];
 let minBlink=1,maxBlink=0;
 for(let i=0;i<500;i++){
  const pose=louisPartPose({id:louis.id,phase:'hidden',age:i*.027,walk:0,speed:0,crouch:1},eye,offset);
  minBlink=Math.min(minBlink,pose.eyeScale);maxBlink=Math.max(maxBlink,pose.eyeScale);
  assert([pose.x,pose.y,pose.z,pose.roll,pose.yaw,pose.pitch].every(Number.isFinite));
 }
 assert(minBlink<.30&&maxBlink>.99,'Louis closes and opens both eyes during spontaneous blinks');
 const idle=louisPartPose({id:louis.id,phase:'follow',age:1,walk:.23,speed:0,crouch:0},arm,[-.3,.559,.111]);
 const walking=louisPartPose({id:louis.id,phase:'follow',age:1,walk:.23,speed:2.1,crouch:0},arm,[-.3,.559,.111]);
 assert.notEqual(walking.pitch,idle.pitch,'Following Kitty swings the arms instead of sliding');
 const hiding=louisPartPose({id:louis.id,phase:'hidden',age:1,walk:0,speed:0,crouch:1},arm,[-.3,.559,.111]);
 assert(hiding.y>idle.y+.2,'Louis brings his hand toward his mouth while hidden');
 assert(freeLouis(louis));assert.equal(louis.phase,'follow');
 updateLouisEscape(louis,.3,{x:11.8,y:0,z:4.08,yaw:Math.PI});
 assert(louis.crouch>0&&louis.crouch<1,'Louis rises progressively from the kitchen hiding posture');
 const corridor={x:7.33,y:1.64,z:6.65,yaw:Math.PI/2,pitch:-.4};
 const target=interactionTarget(world,corridor);
 assert.notEqual(target?.id,'hide-shower','Hallway cannot activate the shower hiding spot');
 console.log('PASS RC: single kit, deploy animation state, movement, noise, crash/recovery, hatch trap, basement enemy route, Louis kitchen cinematic, shower boundary');
})().catch(e=>{console.error(e);process.exitCode=1;});
