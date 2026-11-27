// Phase 10: real ending cue timeline; preserve the original finale state machine.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {ESCAPE_FINALE_CUES,WINDOW_ENTRY_CUES,collectCinematicCues}=await import('../src/lab/cinematic-cues.js');
 assert(ESCAPE_FINALE_CUES.length>=4);
 assert.deepEqual(ESCAPE_FINALE_CUES.map(c=>c.at),[...ESCAPE_FINALE_CUES].map(c=>c.at).sort((a,b)=>a-b));
 assert.equal(new Set(ESCAPE_FINALE_CUES.map(c=>c.id)).size,ESCAPE_FINALE_CUES.length);
 const allowed=new Set(['pursuer','emy','kitty',null]);
 assert(ESCAPE_FINALE_CUES.every(c=>allowed.has(c.source)&&c.caption&&c.sound&&c.at>0&&c.at<7.78));
 const play=new Set(),heard=[];
 const times=[0,.13,.29,.8,1.2,1.8,2.2,2.99,3.53,4.2,6.81,8];
 for(let i=1;i<times.length;i++)
  heard.push(...collectCinematicCues('escape',times[i-1],times[i],play));
 assert.deepEqual(heard.map(c=>c.id),ESCAPE_FINALE_CUES.map(c=>c.id));
 assert.equal(collectCinematicCues('escape',8,8,play).length,0,'no repeats while paused');
 assert.equal(collectCinematicCues('escape',8,0,play).length,0,'never rewind sound on scene reset');
 const skipped=collectCinematicCues('escape',0,10,new Set());
 assert.equal(skipped.length,ESCAPE_FINALE_CUES.length,'large frame jump must not miss events');
 // Window sound cues are deterministic at different frame rates and on resume.
 assert.equal(new Set(WINDOW_ENTRY_CUES.map(c=>c.id)).size,WINDOW_ENTRY_CUES.length);
 assert(WINDOW_ENTRY_CUES.every((cue,i)=>cue.at>0&&cue.at<10&&(!i||cue.at>WINDOW_ENTRY_CUES[i-1].at)));
 assert(WINDOW_ENTRY_CUES.filter(c=>c.sound==='cloth').length>=3,'Repeated sounds have independent contact IDs');
 for(const hz of [15,30,60,120]){
  const played=new Set(),ids=[];
  for(let i=1;i<=hz*10;i++){
   ids.push(...collectCinematicCues('window',(i-1)/hz,i/hz,played).map(c=>c.id));
   assert.equal(collectCinematicCues('window',i/hz,i/hz,played).length,0);
  }
  assert.deepEqual(ids,WINDOW_ENTRY_CUES.map(c=>c.id),'Same sound sequence at '+hz+' Hz');
 }
 const {FINALE_BEATS,finaleStage,finaleThreat,finaleWeather,finaleEmyGoal,finaleLighting}=await import('../src/lab/escape-finale.js');
 const {createHouse,blocked,lineBlocked}=await import('../src/lab/world.js');
 const {poseEscapeAmbush}=await import('../src/lab/emy-rescue.js');
 const world=createHouse();
 const panes=world.boxes.filter(box=>box.weatherPane);
 const {geometry}=await import('../src/lab/renderer.js');
 const rainMesh=geometry(panes);
 assert.equal(rainMesh.vertices.length/16,panes.length*4,'Each rain pane shares four vertices across both windings');
 assert.equal(rainMesh.indices.length,panes.length*12);

 assert(panes.length>=10&&panes.length<=24,'Bounded actual window surfaces: '+panes.length);
 assert(panes.every(p=>!p.solid&&!p.castShadow&&Math.min(p.w,p.d)<=.002),'Weather does not block movement or cast shadows');
 const {captureBasis}=await import('../src/lab/capture-shot.js');
 const basis=captureBasis({yaw:Math.PI,pitch:-.21});
 const normal=basis.forward.map((v,i)=>-.61*v-.40*basis.right[i]+.74*basis.up[i]);
 assert.equal(finaleLighting(0,false,basis).room,0);
 assert.deepEqual(finaleLighting(0,false,basis).key,normal);
 const peak=finaleLighting(1.65,false,basis),last=finaleLighting(FINALE_BEATS.run,false,basis);
 assert(peak.pursuer>peak.room&&peak.room>.22&&peak.projection<1);
 assert.equal(finaleLighting(1.65,true,basis).projection,1);
 assert.deepEqual(last.key,normal,'No directional light jump at gameplay handoff');
 assert.equal(last.room,.22);assert.equal(last.pursuer,.22);assert.equal(last.projection,1);
 for(let i=0;i<=378;i++){
  const t=i/100,a=finaleLighting(t,false,basis),b=finaleLighting(t+.01,false,basis);
  assert([a.room,a.pursuer,a.projection,...a.key].every(Number.isFinite));
  assert(a.room>=0&&a.room<=.34&&a.pursuer>=0&&a.pursuer<=.62);
  assert(Math.abs(a.pursuer-b.pursuer)<.012,'No exposure flash at '+t);
  assert(Math.hypot(...a.key.map((v,k)=>v-b.key[k]))<.04,'Continuous direction');
 }
 assert(Math.abs(finaleWeather({elapsed:FINALE_BEATS.run,playable:false},{z:14.65}).dawn-finaleWeather({playable:true},{z:14.65}).dawn)<1e-8);
 const night=finaleWeather(null,{z:20}),threshold=finaleWeather({playable:false},{z:20});
 assert.deepEqual(night,threshold,'No premature dawn while the cutscene plays');
 const early=finaleWeather({playable:true},{z:14.65}),late=finaleWeather({playable:true},{z:17.7});
 assert(early.dawn>0&&early.dawn<late.dawn&&late.dawn>.99);
 assert(early.rain>late.rain&&late.rain<.01);
 assert.deepEqual(finaleWeather({playable:true},{z:14.65}),early,'No change when the player stands still');
 assert(late.sky.every((channel,i)=>channel>night.sky[i]));
 const shader=fs.readFileSync('src/lab/material-shaders.js','utf8'),renderer=fs.readFileSync('src/lab/renderer.js','utf8');
 assert(shader.includes('vStyle>111.5&&vStyle<112.5')&&shader.includes('streak<.32)discard'),'Rain is clipped to window fragments');
 assert(shader.includes('ambient+=outdoors*uDawn')&&shader.includes('step(-.04,world.y)'),'Dawn fill excludes enclosed rooms and basement');
 assert(renderer.includes('box.weatherPane?112')&&renderer.includes('motion.weather?.sky??NIGHT_SKY'),'Weather is wired into the actual world renderer');
 for(const startX of [4.7,5.95,7.1]){
  const shot={elapsed:0,kitty:{from:{x:startX,z:12.42}},camera:{x:startX,y:1.63,z:12.42,yaw:0,pitch:0},louisStride:0};
  const enemy={x:startX+.58,y:0,z:12.45,yaw:0};
  const opening=finaleStage(shot,enemy,false);
  assert.equal(opening.view.yaw,0,'Begin with the actual player view');
  assert.equal(opening.view.z,12.42);
  for(const t of [FINALE_BEATS.turnEnd,1.72,2.25,2.80,FINALE_BEATS.run]){
   shot.elapsed=t;poseEscapeAmbush(shot,world.emy,enemy,false);
   const stage=finaleStage(shot,enemy,false,world.emy),camera=stage.view;
   assert(camera.z>12.35&&!blocked(world.boxes,camera.x,0,camera.z,.18,1.7),'Camera remains on physical exterior path');
   assert(Object.values(camera).every(Number.isFinite),'Finite first-person view');
   if(t<FINALE_BEATS.lookOut){
    const dx=enemy.x-camera.x,dz=enemy.z-camera.z;
    assert(dx*Math.sin(camera.yaw)+dz*Math.cos(camera.yaw)>0,'Antagonist is in front of the lens after the reveal');
    assert(!lineBlocked(world.boxes,camera,{x:enemy.x,y:1.5,z:enemy.z}),'Clear view of antagonist on porch');
    assert(!lineBlocked(world.boxes,camera,{x:stage.louis.x,y:1.25,z:stage.louis.z}),'Louis not occluded by house walls');
   }
  }
  const ending=finaleStage(shot,enemy,false);
  assert(Math.abs(Math.sin(ending.view.yaw))<.001&&Math.cos(ending.view.yaw)>.99,'Handoff faces garden');
  assert(ending.view.z<17.7,'Cinematic alone cannot cross finish line');
 }
 // V3.2: evaluate the same rig and cat model used by the renderer.
 const {sampleLoisReaction}=await import('../src/lab/lois-ps2-reactions.js');
 const {sampleLoisRig}=await import('../src/lab/lois-ps2-rig.js');
 const actor={phase:'follow',age:0,speed:0,crouch:0,walk:0};
 const at=(age,reduced=false)=>sampleLoisReaction({...actor,visualReaction:{type:'finale-captive',age,duration:FINALE_BEATS.run}},reduced);
 assert(at(1.70).brace>.9&&at(1.70).resist>.9,'Louis visibly braces and resists during the hold');
 assert(at(2.25).recoil>.9,'Impact creates a distinct recoil');
 assert(at(2.95).recover>.9,'Louis regains his balance before running');
 for(const reduced of [false,true]){
  for(const t of [0,.68,1.7,2.25,2.95,3.78]){
   const reaction=at(t,reduced);
   assert(Object.values(reaction).filter(v=>typeof v==='number').every(Number.isFinite));
   const rig=sampleLoisRig({...actor,visualReaction:{type:'finale-captive',age:t,duration:FINALE_BEATS.run}},reduced);
   assert(Object.values(rig.bones).every(b=>[...b.rotation,...b.translation].every(Number.isFinite)));
  }
  const held=sampleLoisRig({...actor,visualReaction:{type:'finale-captive',age:1.7,duration:FINALE_BEATS.run}},reduced);
  const neutral=sampleLoisRig(actor,reduced);
  assert.notDeepEqual(held.bones.leftShoulder.rotation,neutral.bones.leftShoulder.rotation);
  assert.notDeepEqual(held.bones.leftShoulder.rotation,held.bones.rightShoulder.rotation,'Asymmetric arm performance');
  for(const k of ['brace','resist','recoil','recover','pulse'])assert.equal(Math.abs(at(FINALE_BEATS.run,reduced)[k]),0,'No residual pose at playable handoff');
 }
 for(const startX of [4.7,5.95,7.1]){
  const shot={elapsed:0,kitty:{from:{x:startX,z:12.42}},camera:{x:startX,y:1.63,z:12.42,yaw:0,pitch:0},louisStride:0};
  const enemy={x:startX+.58,y:0,z:12.45,yaw:0};
  const cat=world.emy;cat.hidden=true;
  let prior=null,appeared=0;
  const sample=t=>{
   shot.elapsed=t;
   if(poseEscapeAmbush(shot,cat,enemy,false))appeared++;
   assert([cat.x,cat.y,cat.z,cat.yaw].every(Number.isFinite));
   if(!cat.hidden){
    assert(cat.y>=0,'Emy never sinks under the garden');
    if(prior)assert(Math.hypot(cat.x-prior.x,cat.y-prior.y,cat.z-prior.z)<.35,'No root teleport at 30 Hz');
    prior={x:cat.x,y:cat.y,z:cat.z};
   }
  };
  for(let i=0;i<=113;i++)sample(i/30);
  sample(FINALE_BEATS.run);
  assert.equal(appeared,1,'Emy emerges only once');
  assert(Math.abs(cat.y)<.001&&Math.abs(cat.x-5.38)<.001&&Math.abs(cat.z-17.05)<.001,'Physical landing and continuous escape handoff');
  assert.equal(finaleStage(shot,enemy).louis.visualReaction,null,'Release authored pose at handoff');
  const guiding=finaleEmyGoal({x:startX,z:16.4}),rejoin=finaleEmyGoal({x:startX,z:17.7});
  assert(!guiding.rejoin&&rejoin.rejoin);
  assert(Math.hypot(rejoin.x-startX,rejoin.z-17.7)<1,'Return beside Kitty at sunrise');
 }
 // The cat follows a gravitational arc and makes contact before release.
 const {poseEmy}=await import('../src/lab/emy-cat.js');
 for(const reduced of [false,true]){
  const shot={elapsed:0,kitty:{from:{x:5.95,z:12.42}}},cat={x:0,y:0,z:0,yaw:0,age:0,parts:[],hidden:true},enemy={};
  const sample=t=>{shot.elapsed=t;poseEscapeAmbush(shot,cat,enemy,reduced);return cat.y;};
  sample(.96);const initialAge=cat.age;sample(1.24);
  assert(Math.abs(cat.age-initialAge-.28)<1e-9,'Blink clock advances with the cinematic');
  assert(reduced?cat.earTurn===0:cat.earTurn>.15,'Ear anticipation respects reduced motion');
  assert.equal(cat.darkEyes,false,'No indoor glowing eyes outdoors');
  assert.equal(sample(1.45),0);
  const h1=sample(1.61),h2=sample(1.77),h3=sample(1.93),h4=sample(2.09);
  assert(h2-h1>h3-h2&&h3-h2>h4-h3&&h4>.95,'Decelerates to the apex');
  const h5=sample(2.25),h6=sample(2.41),h7=sample(2.57),h8=sample(2.73);
  assert(h4-h5<h5-h6&&h5-h6<h6-h7&&h6-h7<h7-h8+1e-9,'Accelerates towards the ground');
  assert(Math.abs(h8)<1e-9,'Lands on the ground');
  sample(2.08);
  assert(cat.landmarks.legs['front-1'].paw[2]>cat.landmarks.legs.front1.paw[2],'Leading paw reaches contact first');
  poseEmy(cat,{mode:'idle',phase:0,reduced});const neutral=cat.landmarks.head[1];
  poseEmy(cat,{mode:'idle',phase:0,reduced,reunion:1});assert(cat.landmarks.head[1]>neutral+.04,'Relief gesture uses the original cat rig');
 }
 // Nearby Louis starts from his real transform and preserves animation age.
 const entryShot={elapsed:0,kitty:{from:{x:5.95,z:12.42}},camera:{x:5.95,y:1.63,z:12.42,yaw:0,pitch:0},
  louis:{from:{x:5.55,y:0,z:12.22,yaw:.3,crouch:.1}},louisStride:4,louisAge:20};
 const entryEnemy={x:6.53,z:12.37};
 const initial=finaleStage(entryShot,entryEnemy).louis;
 assert.equal(initial.x,5.55);assert.equal(initial.z,12.22);assert.equal(initial.age,20);
 assert.equal(initial.yaw,.3);assert.equal(initial.crouch,.1);
 entryShot.elapsed=.43;const moving=finaleStage(entryShot,entryEnemy).louis;
 assert(moving.speed>0&&moving.walk>4&&moving.age>20);
 const contactShot={elapsed:0,kitty:{from:{x:5.95,z:12.42}}};
 const contactCat={x:0,y:0,z:0,yaw:0,age:0,parts:[],hidden:true},contactEnemy={};
 const contactAt=t=>{contactShot.elapsed=t;poseEscapeAmbush(contactShot,contactCat,contactEnemy,false);return {x:contactCat.x,z:contactCat.z};};
 const incoming=contactAt(2.07),hit=contactAt(2.08),outgoing=contactAt(2.09);
 assert(hit.x>incoming.x,'Emy retains incoming momentum until paw contact');
 assert(Math.hypot(outgoing.x-hit.x,outgoing.z-hit.z)<.015,'Brief contact beat precedes rebound');
 const push=contactAt(2.30),away=contactAt(2.40);
 assert(Math.hypot(away.x-push.x,away.z-push.z)>.015,'Push-off visibly separates Emy after the grip');
 contactAt(2.08);
 const lm=contactCat.landmarks;
 assert(lm.legs['front-1'].paw[2]-lm.head[2]>.20,'Forepaw reaches well ahead of muzzle at contact');
 assert(Math.hypot(contactCat.x-contactEnemy.x,contactCat.z-contactEnemy.z)>.43,'Cat root does not overlap antagonist');
 const threat=finaleThreat({mode:'chase'},1.65,false);
 assert(threat.captureReach>.5&&threat.captureFace.left>0&&threat.captureFace.jaw>0,'Visible rig-native transformation during the grab');
 assert(finaleThreat({mode:'chase'},3.78,true).captureReach<.01,'Grasp released before control returns');
 const {pursuerPose}=await import('../src/lab/pursuer-model.js');
 const live={x:6,y:0,z:12.6,yaw:0,walk:0,speed:0,age:3.78,mode:'trapped'};
 for(const reduced of [false,true]){
  for(let i=0;i<=378;i++){
   const t=i/100,pose=pursuerPose(finaleThreat({...live,mode:t<2.1?'chase':'trapped'},t,reduced),reduced);
   assert(Object.values(pose).every(j=>Object.values(j).every(Number.isFinite)),'Every transformed joint including eyes is finite at '+t);
  }
  const before=pursuerPose(finaleThreat(live,2.07,reduced),reduced);
  const hit=pursuerPose(finaleThreat(live,2.23,reduced),reduced);
  assert(hit.chest.pitch<before.chest.pitch-.15,'Distinct chest recoil after contact');
  assert(hit['arm-1'].pitch-hit['arm1'].pitch>.35,'Asymmetric shoulder reaction');
  assert.deepEqual(pursuerPose(finaleThreat(live,FINALE_BEATS.run,reduced),reduced),pursuerPose(live,reduced),'No residual cinematic pose on gameplay handoff');
 }
 assert.equal(finaleThreat(live,3.78).captureReach,0,'No phantom grip');
 const left=finaleEmyGoal({x:5.899,z:18}),right=finaleEmyGoal({x:5.901,z:18});
 assert(Math.abs(left.x-right.x)<.01,'No side-switch teleport at the center of garden');

 const house=fs.readFileSync('src/lab/house.js','utf8');
 assert(house.includes("collectCinematicCues('escape',previousFinale,finalCutscene.elapsed,finalCutscene.cues)"));
 assert(house.includes("finalCutscene={elapsed:0,cues:new Set()"));
 assert(house.includes('caption(cue.caption)'),'subtitles respect the existing caption option');
 assert(house.includes("events.phase='safe'"),'original success gate still exists');
 assert(house.includes("poseEscapeAmbush(finalCutscene,world.emy,pursuer"),'real Emy and pursuer rigs used');
 assert(house.includes('shot.playable=true')&&house.includes('s.z>=17.7'),'Real player movement is required to finish');
 console.log('PASS V3.1 finale: once-only cues, finite first-person staging, unblocked porch framing, morph and playable handoff');
})().catch(e=>{console.error(e);process.exitCode=1;});
