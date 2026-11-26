// Phase 10: real ending cue timeline; preserve the original finale state machine.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {ESCAPE_FINALE_CUES,collectCinematicCues}=await import('../src/lab/cinematic-cues.js');
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
 const {FINALE_BEATS,finaleStage,finaleThreat,finaleWeather}=await import('../src/lab/escape-finale.js');
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
   const stage=finaleStage(shot,enemy,false),camera=stage.view;
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
 const threat=finaleThreat({mode:'chase'},1.65,false);
 assert(threat.captureReach>.5&&threat.captureFace.left>0&&threat.captureFace.jaw>0,'Visible rig-native transformation during the grab');
 assert(finaleThreat({mode:'chase'},3.78,true).captureReach<.01,'Grasp released before control returns');
 const house=fs.readFileSync('src/lab/house.js','utf8');
 assert(house.includes("collectCinematicCues('escape',previousFinale,finalCutscene.elapsed,finalCutscene.cues)"));
 assert(house.includes("finalCutscene={elapsed:0,cues:new Set()"));
 assert(house.includes('caption(cue.caption)'),'subtitles respect the existing caption option');
 assert(house.includes("events.phase='safe'"),'original success gate still exists');
 assert(house.includes("poseEscapeAmbush(finalCutscene,world.emy,pursuer"),'real Emy and pursuer rigs used');
 assert(house.includes('shot.playable=true')&&house.includes('s.z>=17.7'),'Real player movement is required to finish');
 console.log('PASS V3.1 finale: once-only cues, finite first-person staging, unblocked porch framing, morph and playable handoff');
})().catch(e=>{console.error(e);process.exitCode=1;});
