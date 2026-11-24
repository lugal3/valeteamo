const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
module.exports=async()=>{
 const {createHouse,blocked,setDoor}=await import('../src/lab/world.js'),{Pursuer}=await import('../src/lab/pursuer.js'),{animateFurniture,updateFurniture}=await import('../src/lab/furniture-motion.js'),{HouseEvents}=await import('../src/lab/story-events.js');
 const world=createHouse(),p=new Pursuer(world);setDoor(world.objects.find(o=>o.id==='entrada'),true);p.start();let highest=0;const hidden={x:2.2,y:3.15,z:3.8,hidden:true};
 for(let i=0;i<700;i++){updateFurniture(world.objects,.05,hidden);p.update(.05,hidden,d=>{if(!d.motion)animateFurniture(d,true,{player:hidden});});highest=Math.max(highest,p.y);assert(!blocked(world.boxes,p.x,p.y,p.z,.15,1.7),'NPC cannot cross walls');if(p.visited>=3)break;}
 assert(highest>3,'NPC actually climbs stairs');assert(p.visited>=3,'Search reaches the bedroom');assert(!p.caught,'Unseen hiding is safe');
 p.reset();p.mode='search';Object.assign(p,{x:6,y:3.15,z:2.8,yaw:-Math.PI/2});const visible={x:5.4,y:3.15,z:2.8,hidden:false};assert(p.canSee(visible));
 assert(!p.update(.05,visible).includes('caught'),'There is time to react even at close range');
 const sightCues=[];
 for(let i=0;i<60&&!p.caught;i++)sightCues.push(...p.update(.05,visible));
 assert(sightCues.includes('investigate')&&sightCues.includes('spotted')&&sightCues.includes('caught'),sightCues.join(', '));
 p.reset();p.mode='search';Object.assign(p,{x:6,y:3.15,z:2.8,yaw:-Math.PI/2});assert(!p.canSee({...visible,x:3,z:4.3}),'Walls occlude perception');
 p.update(.3,{...visible,entering:true,hideId:'wardrobe'});assert.equal(p.witnessed,'wardrobe');
 for(let i=0;i<30&&!p.caught;i++)p.update(.05,{...visible,hidden:true,hideId:'wardrobe'});
 assert(p.caught,'Observed hiding remains detectable at close range');
 p.reset();assert.equal(p.witnessed,null);assert.equal(p.caught,false);

 Object.assign(p,{x:6,y:3.15,z:2.8,yaw:-Math.PI/2});
 p.mode='investigate';p.modeTime=3;p.awareness=.99;
 assert(p.update(.05,visible).includes('spotted'));
 for(let i=0;i<45;i++)p.update(.05,hidden);
 assert.equal(p.mode,'trail-search','Breaking line of sight triggers a grounded last-seen search');
 assert(!p.caught,'A hidden Kitty must not be caught without visual evidence');
 for(let i=0;i<180;i++)p.update(.05,hidden);
 assert.equal(p.mode,'cooldown','A last-seen search must finish and release the pursuer');
 assert(!p.caught);
 const before=performance.now(),modes=new Set();let plans=0;
 const plan=p.plan.bind(p);p.plan=(...args)=>{plans++;return plan(...args);};
 p.settleUpstairs();const startingVisits=p.visited;
 for(let i=0;i<4800;i++){
  updateFurniture(world.objects,.05,hidden);
  p.update(.05,hidden,d=>{if(!d.motion&&!d.locked)animateFurniture(d,true,{player:hidden});});
  modes.add(p.mode);
  assert(p.active&&!blocked(world.boxes,p.x,p.y,p.z,.15,1.7),'The pursuer stays in the house and walks through legal positions');
 }
 assert(modes.has('patrol-rest')&&modes.has('search'));assert(p.visited-startingVisits>=8,'The patrol keeps making progress');
 const saved=p.checkpoint(),restored=new Pursuer(world);
 assert(restored.restorePatrol(saved,true));assert.equal(restored.mode,'cooldown');assert.equal(restored.x,saved.x);assert.equal(restored.route,saved.route);
 assert(!restored.restorePatrol({...saved,y:99},true));
 console.log('Patrol QA: 240 simulated seconds, '+(p.visited-startingVisits)+' stops, '+plans+' route plans, '+Math.round(performance.now()-before)+' ms wall time');

 const {housePowered,toggleHousePower}=await import('../src/lab/house-lights.js');
 const {meter,power}=world.lights;
 p.start();
 const patrol=()=>{updateFurniture(world.objects,.05,hidden);return p.update(.05,hidden,door=>{
  if(!door.motion&&!door.locked)animateFurniture(door,true,{player:hidden});
 });};
 for(let i=0;i<1800;i++)assert(!patrol().includes('cut-power'),'No detour before spotting Kitty');
 p.intruderSeen=true;
 let cut=false;
 for(let i=0;i<3600&&!cut;i++)cut=patrol().includes('cut-power');
 assert(cut,'After spotting Kitty the hunter can reach the breaker on foot');
 assert(Math.abs(p.y)<.2&&Math.hypot(p.x-meter.x,p.z-meter.z)<1);
 toggleHousePower(meter);
 for(let i=0;i<400;i++)assert(!patrol().includes('cut-power')&&!housePowered(power));
 toggleHousePower(meter);assert(housePowered(power));
 const s=new HouseEvents({pursuit:true});assert.equal(s.observe({key:true,symbol:false}),'message');s.read();s.advance(1,false);assert.equal(s.observe({key:true,symbol:false,door:true}),'arrival');s.advance(4,false);assert.equal(s.phase,'hide');s.advance(10,true);assert.equal(s.phase,'hunt');s.advance(30,true,{clear:true,visited:0});assert.equal(s.phase,'hunt','No completion before NPC visits upstairs');s.advance(.1,true,{clear:true,visited:2});assert.equal(s.phase,'evaded');assert(s.complete());assert.equal(s.phase,'safe');assert.equal(s.messages.length,3);
 s.retry();s.advance(4,false);s.advance(10,false);s.advance(.1,false,{caught:true});assert.equal(s.phase,'failed');assert(!s.complete());
 const manifest=JSON.parse(fs.readFileSync('src/lab/audio/manifest.json'));assert.equal(manifest.length,16);let total=0;
 for(const clip of manifest){const bytes=fs.readFileSync('src/lab/audio/'+clip.id+'.wav');assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),clip.sha256);assert(clip.peak<=.8);assert(clip.end>clip.start);total+=bytes.length;}
 assert(total<3000000);const open=manifest.find(c=>c.id==='door-open'),close=manifest.find(c=>c.id==='door-close');assert.equal(open.source,close.source);assert(open.end<close.start,'Opening and closing are distinct actions, not the same sound');
 const {pursuerPose,pursuerPieces,posePursuer,BED_EXIT,RISE_SECONDS}=await import('../src/lab/pursuer-model.js'),{geometry}=await import('../src/lab/renderer.js');
 const mesh=geometry(pursuerPieces()),vertices=new Float32Array(mesh.vertices.length);
 const actor={x:2,y:3.15,z:5,yaw:0,facing:.32,walk:0,speed:1.45,age:0,mode:'search'};
 const first=pursuerPose(actor)['foot-1'],next=pursuerPose({...actor,walk:.20})['foot-1'];
 assert.equal(next.y,0);assert(Math.abs(next.z+.20-first.z)<1e-8,'The planted foot cancels actor displacement');
 for(const mode of ['search','chase'])for(let i=0;i<32;i++){
  posePursuer(mesh.vertices,vertices,mesh.groups,{...actor,mode,walk:i*.053,age:i*.035});
  assert(vertices.every(Number.isFinite),'All posed mesh positions and normals are finite');
  for(let j=1;j<vertices.length;j+=16)assert(vertices[j]>=actor.y-.028,'Feet clear the floor through the gait cycle');
 }
 p.sleep();assert(!blocked(world.boxes,BED_EXIT.x,BED_EXIT.y,BED_EXIT.z,.16,1.72));
 const asleep=p.snapshot();p.wake();p.update(RISE_SECONDS*.5,hidden);
 assert.equal(p.mode,'rising');assert.equal(p.x,asleep.x,'NPC stands before starting the route');
 posePursuer(mesh.vertices,vertices,mesh.groups,p.snapshot());assert(vertices.every(Number.isFinite));
 posePursuer(mesh.vertices,vertices,mesh.groups,{...p.snapshot(),age:p.age+RISE_SECONDS*.5,bedTime:RISE_SECONDS});const upright=vertices.slice();
 assert(p.update(RISE_SECONDS*.5,hidden).includes('stood'));assert.equal(p.mode,'to-entry');
 posePursuer(mesh.vertices,vertices,mesh.groups,p.snapshot());
 assert(vertices.every((value,i)=>Math.abs(value-upright[i])<.00001),'Rise blends continuously into standing');
 const {captureBasis,captureFrame,capturePath,captureTiming}=await import('../src/lab/capture-shot.js');
 const {pursuerInterior}=await import('../src/lab/pursuer-face.js');
 const {captureGrasp,createTentacleMesh}=await import('../src/lab/pursuer-tentacles.js');
 const capture=geometry([...pursuerPieces(true),...pursuerInterior()]);
 const posedCapture=new Float32Array(capture.vertices.length),limbs=createTentacleMesh();
 assert(capture.vertices.length/16<65536,'The detailed face fits WebGL 1 indices');
 const eye={x:0,y:1.6,z:0},wall={id:'wall',x:0,y:1.6,z:.45,w:2,h:2,d:.1,solid:true};
 const constrain=capturePath([wall],eye);
 const obstructed=constrain({x:.12,y:1.9,z:.8});
 assert(obstructed.z>.34&&obstructed.z<.37,'Capture camera stays in front of the wall with space for the near plane');
 const free={x:0,y:1.7,z:-.4};
 assert.equal(constrain(free),free,'Clear capture camera travel is preserved');
 const from={x:2.16,y:4.78,z:5.61,yaw:Math.PI,pitch:0};
 for(const reduced of [false,true])for(let attempt=0;attempt<3;attempt++){
  const timing=captureTiming(attempt);
  const start=captureFrame(from,actor,0,reduced,timing);
  assert(Math.abs(start.camera.z-from.z)<1e-8&&start.lamp===1&&start.projection===1);
  const lift=captureFrame(from,actor,.30,reduced,timing);
  const raised=captureGrasp(lift.camera,captureBasis(lift.camera),lift.actor,lift.grasp,null);
  assert(raised.every(hand=>hand&&hand.curl>0),'Both hands brace before the limbs emerge');
  if(reduced)assert(lift.camera.roll===0&&lift.projection===1,'Reduced motion disables optical and roll effects');
  for(const time of [timing.tear+.19,timing.reveal+.1,timing.lock+.17,timing.bite-.08]){
   const frame=captureFrame(from,actor,time,reduced,timing);
   posePursuer(capture.vertices,posedCapture,capture.groups,frame.actor,reduced);
   const hands=captureGrasp(frame.camera,captureBasis(frame.camera),frame.actor,frame.grasp,limbs);
   assert(posedCapture.every(Number.isFinite)&&limbs.vertices.every(Number.isFinite),'Fracture, limbs and membranes stay finite through the full shot');
   if(time===timing.lock+.17)assert(hands.every(hand=>hand?.curl>.85),'Both paws are held once the grip closes');
  }
 }
 const {CAR_ARRIVAL_SECONDS,poseArrivalCar,arrivalCarCamera}=await import('../src/lab/arrival-car.js');
 const vehicleScene=new HouseEvents({arrivalLead:CAR_ARRIVAL_SECONDS});vehicleScene.observe({door:true});
 assert.deepEqual(vehicleScene.advance(CAR_ARRIVAL_SECONDS,false),[],'Door cues wait until the car arrives');
 assert(vehicleScene.advance(.46,false).includes('keys'));
 poseArrivalCar(world.car,1);const body=world.boxes.find(box=>box.id==='car-body');
 assert(blocked(world.boxes,body.x,0,body.z),'Car collision follows the body');
 const view=arrivalCarCamera(1);assert(Math.hypot(body.x-view.x,body.z-view.z)>2);
 poseArrivalCar(world.car,0);assert(!blocked(world.boxes,10.15,0,16.65),'Replaying resets car collision');
 console.log('PASS pursuit: physical stair/door navigation, LOS, witnessed/unseen hiding, retry/completion, 16 bounded separate audio cuts and hashes');
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1;});
