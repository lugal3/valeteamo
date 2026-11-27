const assert=require('node:assert/strict');
(async()=>{
 const {createHouse,setDoor,blocked,groundHeight,HEIGHT}=await import('../src/lab/world.js');
 const {Pursuer}=await import('../src/lab/pursuer.js');
 const {createEmyAbilities,activateEmyScan,advanceEmyAbilities,createEmyNameCue,advanceEmyNameCue,roomChoices,roomDestination,roomDestinations,isEmyRoomLocked,emyFloorMap,emyFloorList}=await import('../src/lab/emy-abilities.js');
 const {installNoiseProps,grabNoiseProp,holdNoiseProp,releaseNoiseProp,stepNoiseProps}=await import('../src/lab/noise-props.js');
 const {createEmyCompanion,previewEmyDistract,sendEmyDistract,snapshotEmyCompanion,updateEmyCompanion}=await import('../src/lab/emy-companion.js');
 const tag=createEmyNameCue();
 assert(advanceEmyNameCue(tag,0,true),'First visible interaction shows name');
 for(let i=0;i<12;i++)advanceEmyNameCue(tag,.1,true);
 assert.equal(tag.left,0,'Label expires in one second');
 for(let i=0;i<1800;i++)advanceEmyNameCue(tag,.1,true);
 assert.equal(tag.cooldown,0);
 assert(!advanceEmyNameCue(tag,.1,true),'Continued looking never retriggers');
 assert(!advanceEmyNameCue(tag,.1,false));
 assert(advanceEmyNameCue(tag,.1,true),'New look after 180 seconds triggers');
 assert(!advanceEmyNameCue(tag,.1,true,false),'No name during a modal');
 assert(!advanceEmyNameCue(tag,.1,true),'A modal does not re-arm a cue');
 const beforeSuppression=tag.cooldown;
 assert(!advanceEmyNameCue(tag,.1,false,true,false),'Occupied hand suppresses the label');
 assert(tag.cooldown<beforeSuppression&&tag.looking,'Suppression counts play time but does not invent a look-away');
 const abilities=createEmyAbilities();
 assert(activateEmyScan(abilities));assert.equal(abilities.scan,6);assert(!activateEmyScan(abilities));
 advanceEmyAbilities(abilities,1/60);assert(abilities.scan<6&&abilities.wave<1.1);
 for(let i=0;i<6000;i++)advanceEmyAbilities(abilities,.1);
 assert.equal(abilities.scan,0);assert.equal(abilities.scanCooldown,0);
 assert(activateEmyScan(abilities));

 const world=createHouse();
 const {defaultMiniatureView,changeMiniatureView,miniatureProject,miniatureSVG,miniatureMarkers,layoutMiniaturePins,miniatureRouteSegments,miniatureFurniture}=await import('../src/lab/emy-miniature.js');
 const view=defaultMiniatureView(),turned=changeMiniatureView(view,{yaw:.5,pitch:.1,zoom:1.1});
 assert.notDeepEqual(miniatureProject([0,0,0],view),miniatureProject([0,0,0],turned));
 assert.equal(changeMiniatureView(view,{zoom:99,pitch:99}).zoom,1.65);
 assert.equal(changeMiniatureView(view,{zoom:0,pitch:-99}).pitch,.28);
 const exterior=miniatureSVG(world,view),rotated=miniatureSVG(world,turned);
 assert(exterior.includes('Exterior tridimensional')&&exterior.includes('<polygon'));
 assert.notEqual(exterior,rotated);
 assert(!exterior.includes('data-act="emy:room:'));
 const boxOf=svg=>svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
 const zoomed=miniatureSVG(world,changeMiniatureView(view,{zoom:1.25}));
 assert.deepEqual(boxOf(exterior),boxOf(zoomed),'Fit the default projection without cancelling the player zoom');
 assert(boxOf(exterior).every(Number.isFinite));
 const fakeThreat={active:true,x:7.9,y:0,z:5.1};
 const hiddenMarkers=miniatureMarkers({x:5.9,y:0,z:8},{x:5.1,y:0,z:8,hidden:false},fakeThreat,false);
 const visibleMarkers=miniatureMarkers({x:5.9,y:0,z:8},{x:5.1,y:0,z:8,hidden:false},fakeThreat,true);
 assert(hiddenMarkers.every(m=>m.id!=='threat'),'No threat coordinates in unscanned markers');
 const clustered=visibleMarkers.map(m=>({...m,x:5.9,z:8}));
 const pins=layoutMiniaturePins(clustered,p=>miniatureProject(p,view,0),0);
 assert.equal(pins.length,3);
 for(let i=0;i<pins.length;i++){
  assert.deepEqual(pins[i].anchor,miniatureProject([clustered[i].x,.12,clustered[i].z],view,0),'Actual marker coordinates never move');
  for(let j=0;j<i;j++)assert(Math.hypot(pins[i].badge.x-pins[j].badge.x,pins[i].badge.y-pins[j].badge.y)>=23,'Clustered badges remain legible');
 }
 assert(miniatureSVG(world,view,{floor:0,markers:clustered}).includes('<line x1='));

 const lowerMini=miniatureSVG(world,view,{floor:0,markers:hiddenMarkers});
 const scanMini=miniatureSVG(world,view,{floor:0,markers:visibleMarkers});
 assert(lowerMini.includes('data-marker="kitty"')&&lowerMini.includes('data-marker="emy"'));
 assert(!lowerMini.includes('data-marker="threat"')&&scanMini.includes('data-marker="threat"'));
 assert(lowerMini.includes('data-act="emy:room:study"')&&!lowerMini.includes('data-act="emy:room:bedroom"'));
 const upperMini=miniatureSVG(world,view,{floor:1,lockedIds:['bedroom'],markers:visibleMarkers});
 assert(upperMini.includes('house-emy-stair-void')&&!upperMini.includes('data-act="emy:room:bedroom"')&&!upperMini.includes('data-marker="threat"'));
 assert(emyFloorList(world.rooms,0,{lockedIds:['study'],disabledReasons:{study:'Ruta bloqueada'}}).includes('Ruta bloqueada'));
 assert(emyFloorList(world.rooms,0).includes('house-emy-destination-icon'));
 const stairPin={id:'kitty',label:'Kitty',color:'#fff',x:12,y:1.2,z:7.8};
 assert(miniatureSVG(world,view,{floor:0,markers:[stairPin]}).includes('data-marker="kitty"'),'Stair traversal has a real horizontal marker');
 // Furniture is sourced from the actual house rather than decorative
 // approximations at arbitrary positions.
 assert(miniatureFurniture(world,0).some(b=>b.id==='sofa'));
 assert(miniatureFurniture(world,1).some(b=>b.id==='upper-bed'));
 assert(lowerMini.includes('data-furniture="sofa"'));
 assert(upperMini.includes('data-furniture="upper-bed"'));
 assert(upperMini.includes('data-door="dormitorio" data-door-state="locked"'));
 assert(miniatureSVG(world,view,{floor:0,reveal:true}).includes('mini-roof-lift'));
 assert(miniatureSVG(world,view,{floor:0,reveal:true}).includes('mini-upper-lift'));
 assert(!lowerMini.includes('mini-cover-reveal'),'No repeated roof animation while rotating');
 const previewWorld=createHouse(),previewCat=createEmyCompanion(previewWorld.emy,{waiting:false});
 const previewRoom=roomChoices(previewWorld.rooms).find(r=>r.id==='reading');
 const beforePreview=snapshotEmyCompanion(previewCat);
 const plan=roomDestinations(previewWorld,previewRoom).map(p=>previewEmyDistract(previewCat,previewWorld,p)).find(Boolean);
 assert(plan&&plan.seconds>0&&plan.metres>0);
 assert.deepEqual(snapshotEmyCompanion(previewCat),beforePreview,'Preview cannot issue a command or move Emy');
 assert.equal(previewCat.distraction,undefined);
 assert(miniatureRouteSegments(plan.waypoints,0).length>0&&miniatureRouteSegments(plan.waypoints,1).length>0);
 assert(miniatureSVG(previewWorld,view,{floor:0,route:plan}).includes('data-route-floor="0"'));
 assert(miniatureSVG(previewWorld,view,{floor:1,route:plan}).includes('mini-route-goal'));
 assert(sendEmyDistract(previewCat,previewWorld,plan.goal));
 assert.deepEqual(previewCat.route,plan.route,'Confirmed route equals the preview at the same world state');
 const browse=miniatureSVG(world,view,{floor:0,markers:visibleMarkers,route:plan,readOnly:true});
 assert(!browse.includes('data-marker="threat"')&&!browse.includes('data-act="emy:room:')&&!browse.includes('mini-route-track'),'Phone map has no threat or command path');
 const choices=roomChoices(world.rooms);
 for(const name of ['Estudio','Sala de estar','Cocina y comedor','Baño','Dormitorio','Sala de lectura','Sala de música','Recibidor y pasillo','Distribuidor y descansillo']){
  assert(choices.some(room=>room.label===name),name+' exists in the two-floor command map');
 }
 const lower=emyFloorMap(world.rooms,0),upper=emyFloorMap(world.rooms,1);
 assert.equal(choices.filter(r=>r.floor===0).length,6,'Six clear ground-floor targets');
 assert.equal(choices.filter(r=>r.floor===1).length,4,'Four clear upstairs targets');
 assert(lower.includes('emy:room:study')&&upper.includes('emy:room:bedroom'));
 assert(!lower.includes('emy:room:bedroom'));
 assert(lower.includes('house-emy-stair-flight')&&upper.includes('house-emy-stair-void'),
  'Stairs and upstairs opening must be represented differently');
 assert(emyFloorList(world.rooms,0).includes('Recibidor y pasillo'));
 assert(emyFloorList(world.rooms,1).includes('Sala de música'));
 assert(isEmyRoomLocked(world,choices.find(r=>r.id==='bedroom')),'Locked story bedroom must not be available yet');
 for(const room of choices){
  const candidates=roomDestinations(world,room);
  assert(candidates.length>0,'Safe destination in '+room.id);
  const level=room.floor?3.15:0;
  for(const p of candidates)assert(Math.abs(p.y-level)<.18,'Correct floor for '+room.id);
  if(room.id==='stairs')assert(candidates.every(p=>p.z>9.9),'Never target the sloped stair treads as the ground floor');
 }
 const study=choices.find(room=>room.id==='study');
 const target=roomDestination(world,study);
 assert(target&&target.y===0,'Room waypoint should be on a navigable floor');
 for(const id of ['study','living','kitchen','bath','hall-ground','stairs','reading','hall-upper']){
  const room=choices.find(r=>r.id===id);
  const cat=createEmyCompanion(world.emy,{waiting:false});
  const reachable=roomDestinations(world,room).some(point=>sendEmyDistract(cat,world,point));
  assert(reachable,'Emy must find a route from the entrance to '+id+' on floor '+room.floor);
  assert.equal(cat.distraction.goal.y,room.floor?3.15:0,'Cross-floor route elevation for '+id);
 }


 // Emy's fear of the music room must also apply to tactical commands.
 const musicRoom=choices.find(r=>r.id==='music');
 const afraidCat=createEmyCompanion(world.emy,{waiting:false});
 const musicPoints=roomDestinations(world,musicRoom);
 assert(musicPoints.length,'The room remains physically accessible to Kitty');
 assert(musicPoints.every(point=>!previewEmyDistract(afraidCat,world,point)&&!sendEmyDistract(afraidCat,world,point)),'Emy refuses every music-room command');
 assert.equal(afraidCat.stage,'following');

 // The command's route must be physically traversable BOTH ways, not only
 // accepted by the path planner. Open ordinary doors as the game would while
 // walking; leave the story-locked bedroom closed.
 const walkWorld=createHouse();
 for(const door of walkWorld.objects.filter(o=>o.kind==='door'&&!o.locked))setDoor(door,true);
 const walker=createEmyCompanion(walkWorld.emy,{waiting:false});
 for(const [id,expectedFloor] of [['reading',3.15],['kitchen',0]]){
  const zone=roomChoices(walkWorld.rooms).find(r=>r.id===id);
  const accepted=roomDestinations(walkWorld,zone).some(point=>sendEmyDistract(walker,walkWorld,point));
  assert(accepted,'Route should start towards '+id);
  let arrived=false,intermediate=false;
  for(let frame=0;frame<2400;frame++){
   const cue=updateEmyCompanion(walker,1/30,{world:walkWorld,player:{x:5.9,y:0,z:10.65},reduced:true});
   if(walker.cat.y>1.0&&walker.cat.y<2.6)intermediate=true;
   if(walker.distraction?.arrived){arrived=true;break;}
   if(cue==='distract-failed')break;
  }
  assert(arrived,'Emy must physically arrive in '+id+' across the stairs');
  assert(intermediate,'Emy must traverse the sloped stairway rather than teleport');
  assert(Math.abs(walker.cat.y-expectedFloor)<.4,'Emy must finish on the requested floor of '+id);
  walker.stage='following';walker.distraction=null;walker.route=[];walker.trail=[];
 }
 // Verify that the near-wall arrival tolerance cannot start a distraction
 // through a partition, and a malformed/airborne destination costs nothing.
 const wallWorld=createHouse(),wallCat=createEmyCompanion(wallWorld.emy,{waiting:false});
 Object.assign(wallCat.cat,{x:4.72,y:0,z:3.6});
 assert(!sendEmyDistract(wallCat,wallWorld,{x:NaN,y:0,z:1}));
 assert(!sendEmyDistract(wallCat,wallWorld,{x:5,y:1,z:3.6}));
 assert.equal(wallCat.stage,'following');
 wallCat.stage='distract';wallCat.route=[];wallCat.distraction={goal:{x:4.17,y:0,z:3.6},remaining:25,arrived:false,nextNoise:0,nextPlan:Infinity,stuck:0};
 const blockedCue=updateEmyCompanion(wallCat,.016,{world:wallWorld,player:{x:5.9,y:0,z:10.65},reduced:true});
 assert.equal(blockedCue,null);assert(!wallCat.distraction.arrived,'No false arrival through study wall');
 const props=installNoiseProps(world);
 assert.equal(props.length,6);
 assert(props.every(p=>!world.boxes.includes(p.box)), 'noise objects use a separate WebGL1 batch, never the saturated main dynamic buffer');
 const glass=props[0];
 assert(grabNoiseProp(glass));assert(!grabNoiseProp(null));
 holdNoiseProp(glass,{x:5,y:1.6,z:8,yaw:0,pitch:0});
 assert.equal(glass.box.z,glass.z);
 assert(releaseNoiseProp(glass,{x:5,y:1.6,z:8,yaw:0},true));
 assert(glass.flight&&glass.flight.vz>0);
 const pursuer=new Pursuer(world);
 assert(!pursuer.hearNoise({x:1,y:0,z:1}),'dormant pursuer ignores sound');
 pursuer.mode='search';
 const nearbyNoise={x:pursuer.x+.5,y:pursuer.y,z:pursuer.z};
 assert(pursuer.hearNoise(nearbyNoise));
 assert.equal(pursuer.mode,'noise-investigate');
 assert.equal(pursuer.noiseGoal.x,nearbyNoise.x);
 const other=props[1];
 other.flight={vx:0,vy:0,vz:0,ttl:1};
 Object.assign(other,{x:pursuer.x,y:pursuer.y+1.0,z:pursuer.z});
 let cues=stepNoiseProps([other],.016,world,pursuer,null);
 assert(cues.some(cue=>cue.kind==='stun'));assert.equal(pursuer.mode,'stunned');
 pursuer.update(.5,{x:2,y:0,z:2,hidden:true});
 assert(pursuer.stunned>0);
 for(let i=0;i<4;i++)pursuer.update(.5,{x:2,y:0,z:2,hidden:true});
 assert.equal(pursuer.mode,'cooldown');
 const {pursuerPose}=await import('../src/lab/pursuer-model.js');
 const testActor={...pursuer.snapshot(),mode:'stunned',stunned:1.5,speed:0};
 const recoil=pursuerPose(testActor,true),neutral=pursuerPose({...testActor,mode:'search'},true);
 assert.notEqual(recoil.chest.pitch,neutral.chest.pitch,'An impact must visibly animate the existing 3D rig');
 const companion=createEmyCompanion(world.emy,{waiting:false});
 assert.equal(companion.stage,'following');
 const near=roomDestination(world,choices.find(room=>room.id==='living'));
 if(near&&sendEmyDistract(companion,world,near)){
  assert.equal(companion.stage,'distract');
  assert.equal(snapshotEmyCompanion(companion).stage,'following');
 }
 // A nearby distraction runs for 25 seconds, emits repeated noise and restores follow mode.
 const closeWorld=createHouse(),closeCat=createEmyCompanion(closeWorld.emy,{waiting:false});
 const closeGoal={x:closeCat.cat.x+.04,y:0,z:closeCat.cat.z+.04};
 assert(sendEmyDistract(closeCat,closeWorld,closeGoal));
 let rings=0,finished=false;
 for(let i=0;i<1650;i++){
  const cue=updateEmyCompanion(closeCat,1/60,{world:closeWorld,player:{x:5.1,y:0,z:10.65},distractCooldown:35});
  if(cue==='distract-noise')rings++;
  if(cue==='distract-done'){finished=true;break;}
 }
 assert(finished&&rings>=13,'Emy must distract for roughly 25 s and return to follow');
 assert.equal(closeCat.stage,'following');
 const {distractionEscapePoint}=await import('../src/lab/emy-companion.js');
 const chaseWorld=createHouse(),chaseCat=createEmyCompanion(chaseWorld.emy,{waiting:false});
 Object.assign(chaseCat.cat,{x:5.9,y:0,z:8.1,yaw:0});
 const foeCat=new Pursuer(chaseWorld);foeCat.start();Object.assign(foeCat,{x:5.9,y:0,z:9.2,mode:'noise-investigate',noiseSource:'emy',noiseRemaining:8});
 const lure={goal:{x:5.9,y:0,z:8.1},remaining:25,arrived:true,nextNoise:0,orbitSide:1};
 assert(distractionEscapePoint(chaseWorld,chaseCat.cat,lure,foeCat,{x:2,y:HEIGHT,z:2}),'Real collision-safe escape near enemy');
 chaseCat.stage='distract';chaseCat.distraction=lure;
 let travelled=0,minGap=Infinity;
 for(let i=0;i<180;i++){
  const previous={x:chaseCat.cat.x,z:chaseCat.cat.z};
  updateEmyCompanion(chaseCat,1/60,{world:chaseWorld,player:{x:2,y:HEIGHT,z:2,hidden:true},threat:foeCat});
  foeCat.trackEmyDistraction(chaseCat.cat);
  foeCat.update(1/60,{x:2,y:HEIGHT,z:2,hidden:true});
  travelled+=Math.hypot(chaseCat.cat.x-previous.x,chaseCat.cat.z-previous.z);
  minGap=Math.min(minGap,Math.hypot(foeCat.x-chaseCat.cat.x,foeCat.z-chaseCat.cat.z));
  assert(!blocked(chaseWorld.boxes,chaseCat.cat.x,chaseCat.cat.y,chaseCat.cat.z,.14,.62),'Avoid wall during evasive motion');
 }
 assert(travelled>.6,'Emy visibly evades rather than staying fixed');
 assert(minGap>.45,'Pursuer never stands directly on Emy: '+minGap);
 console.log('Distraction QA: movement '+travelled.toFixed(2)+' m; minimum separation '+minGap.toFixed(2)+' m');
 foeCat.endEmyDistraction();assert.notEqual(foeCat.mode,'noise-investigate');
 console.log('PASS Emy local pursuit: actual evasive movement, collision checks, and independent cooldown');
 // A thrown object near Emy triggers an actual collision-safe animated sidestep,
 // rather than instantly moving or replacing the cat model.
 const dodgeWorld=createHouse(),dodgeCat=createEmyCompanion(dodgeWorld.emy,{waiting:false});
 const dodgeProps=installNoiseProps(dodgeWorld),dodgeProp=dodgeProps[0];
 const start={x:dodgeCat.cat.x,y:dodgeCat.cat.y,z:dodgeCat.cat.z};
 Object.assign(dodgeProp,{x:start.x+.08,y:start.y+.38,z:start.z-.08,
  flight:{vx:0,vy:0,vz:1,ttl:1}});
 const dodgeCues=stepNoiseProps([dodgeProp],.016,dodgeWorld,null,dodgeCat.cat);
 assert(dodgeCues.some(cue=>cue.kind==='evade'),'Emy must detect an incoming throwable');
 assert(dodgeCat.cat.dodge,'Dodge must have an animated target pose');
 assert.equal(dodgeCat.cat.x,start.x,'Dodge starts at original location without teleport');
 for(let i=0;i<35;i++)updateEmyCompanion(dodgeCat,1/60,{world:dodgeWorld,player:start});
 assert(!dodgeCat.cat.dodge,'Dodge animation finishes cleanly');
 assert(Math.hypot(dodgeCat.cat.x-start.x,dodgeCat.cat.z-start.z)>.4,'Emy moves aside physically');
 // Two endings and Emy's one-use intervention must animate the REAL cat
 // and the REAL pursued actor, not a nonphysical overlay or frozen sprite.
 const {poseEmyLastChance,poseEscapeAmbush}=await import('../src/lab/emy-rescue.js');
 const finaleWorld=createHouse(),rescueCat=finaleWorld.emy;
 const foe={x:6.15,y:0,z:12.38,yaw:Math.PI,mode:'chase',speed:1.4,active:true};
 const {planEmyRescueShot,sampleEmergencyRescue,sampleRescuedKitty,EMY_RESCUE_BEATS,scoreRescueCamera}=await import('../src/lab/emy-emergency-shot.js');
 const {createPose}=await import('../src/lab/character-rig.js');
 const shot={elapsed:.20,kitty:{x:5.65,y:0,z:12.8,yaw:Math.PI},attacker:{...foe}};
 shot.stage=planEmyRescueShot(finaleWorld,shot.kitty,shot.attacker,{x:5.65,y:1.63,z:12.8,yaw:Math.PI,pitch:0});
 let prior;
 for(let i=0;i<=395;i++){
  const t=i/100,p=sampleEmergencyRescue(t,shot.stage),rig=sampleRescuedKitty(t,createPose());
  assert([...rig].every(Number.isFinite));
  assert([p.cat.x,p.cat.y,p.cat.z,p.foe.x,p.foe.y,p.foe.z,p.kitty.x,p.kitty.y,p.kitty.z].every(Number.isFinite));
  assert(p.cat.y>=shot.kitty.y-.001);
  if(prior)assert(Math.hypot(p.cat.x-prior.cat.x,p.cat.y-prior.cat.y,p.cat.z-prior.cat.z)<.10,'No discontinuous leap');
  prior=p;
 }
 assert.equal(sampleEmergencyRescue(0,shot.stage).foe.grip,0);
 assert(sampleEmergencyRescue(1,shot.stage).foe.grip>.95);
 assert.equal(sampleEmergencyRescue(2.3,shot.stage).foe.grip,0);
 // The independent forearm mesh must attach to the transformed elbow,
 // even at maximum grip and recoil. Recoil needs actual staggered footwork.
 let lifted=false,asymmetric=false;
 for(let i=0;i<=395;i++){
  const p=sampleEmergencyRescue(i/100,shot.stage).foe;
  const rig=pursuerPose({...foe,walk:0,speed:0,turnRate:0,age:0,mode:i/100>=EMY_RESCUE_BEATS.impact?'stunned':'chase',stunned:2*p.hit,rescueGrip:p.grip,rescueImpact:p.hit,rescueSide:shot.stage.side,rescueStep:p.step,rescueDistance:p.retreatDistance},true);
  for(const side of [-1,1]){
   const a=rig['arm'+side],f=rig['forearm'+side],d=.30;
   assert(Math.abs(f.x-((a.x||0)+d*Math.sin(a.roll||0)))<1e-6,'Elbow lateral attachment');
   assert(Math.abs(f.y-((a.y||0)+d*(1-Math.cos(a.roll||0)*Math.cos(a.pitch))))<1e-6,'Elbow vertical attachment');
   assert(Math.abs(f.z-((a.z||0)-d*Math.cos(a.roll||0)*Math.sin(a.pitch)))<1e-6,'Elbow forward attachment');
   lifted ||= rig['foot'+side].y>.035;
  }
  asymmetric ||= Math.abs(rig['foot-1'].z-rig.foot1.z)>.06;
 }
 assert(lifted&&asymmetric,'Recoil is a staggered step, not a root slide');
 assert(!shot.stage.compact,'Exterior stage must remain visible');
 const landed=sampleEmergencyRescue(2.34,shot.stage).cat,protectedCat=sampleEmergencyRescue(3.12,shot.stage).cat;
 assert.equal(landed.y,shot.kitty.y);assert.equal(protectedCat.y,shot.kitty.y);
 assert.equal(sampleEmergencyRescue(2.34,shot.stage).cat.airborne,false);
 assert(Math.hypot(protectedCat.x-shot.stage.safe.x,protectedCat.z-shot.stage.safe.z)<=Math.hypot(landed.x-shot.stage.safe.x,landed.z-shot.stage.safe.z)+1e-6,'Protective step moves toward Kitty');
 assert(Math.hypot(protectedCat.x-shot.stage.safe.x,protectedCat.z-shot.stage.safe.z)>=.38,'Emy does not overlap Kitty');
 // Regression: a large foreground Kitty head must lose to a clean angle.
 const synthetic={cat:{x:0,y:0,z:0},kitty:{x:0,y:0,z:-.55},foe:{x:.7,y:0,z:0}};
 const clean=scoreRescueCamera({boxes:[]},{x:1.8,y:1.65,z:0},Array(5).fill(synthetic),true);
 const obscured=scoreRescueCamera({boxes:[]},{x:0,y:1.65,z:-1.25},Array(5).fill(synthetic),true);
 assert(clean.penalty<obscured.penalty&&obscured.hiddenCritical===2,'Camera selection accounts for Kitty occluding Emy');
 const stages={wide:0,tight:0,closeup:0,occluded:0};
 const fixturePoints=[[5.65,0,12.8],[5.9,0,8.1],[9.75,0,3.34],[3.3,0,3.6],[5.74,HEIGHT,2.4],[2.39,HEIGHT,3.85],[6.9,HEIGHT,10.4],[9,HEIGHT,3.6]];
 for(const [x,y,z] of fixturePoints){
  if(blocked(finaleWorld.boxes,x,y,z,.19,1.65)||Math.abs(groundHeight(x,z,y)-y)>.12)continue;
  for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
   const k={x,y,z,yaw:angle},enemy={x:x+.78*Math.sin(angle),y,z:z+.78*Math.cos(angle),yaw:angle+Math.PI};
   const stage=planEmyRescueShot(finaleWorld,k,enemy,{x,y:y+1.63,z,yaw:angle,pitch:0});
   stages[stage.kind]++;
   if(stage.compact){assert.equal(stage.viewMode,'occluded');continue;}
   for(let frame=0;frame<=198;frame++){
    const p=sampleEmergencyRescue(frame/50,stage);
    assert(!blocked(finaleWorld.boxes,p.cat.x,p.cat.y,p.cat.z,.13,.38),'Rescue cat must avoid solid geometry: '+JSON.stringify({kind:stage.kind,p:p.cat}));
    assert(!blocked(finaleWorld.boxes,p.foe.x,p.foe.y,p.foe.z,.16,1.70),'Rescue actor must avoid walls');
    assert(!blocked(finaleWorld.boxes,p.kitty.x,p.kitty.y,p.kitty.z,.18,1.63),'Kitty recovery must avoid walls');
   }
  }
 }
 assert(stages.wide+stages.tight+stages.closeup>0,'At least one real visible stage required');
 console.log('PASS actual house rescue paths: '+JSON.stringify(stages));

 rescueCat.hidden=true;
 for(const {box} of rescueCat.parts)box.hiddenGeometry=true;
 assert(!poseEmyLastChance(shot,rescueCat,foe,true),'Emy stays hidden during the first threat beat');
 assert(rescueCat.hidden,'No teleport or premature rescue reveal');
 shot.elapsed=.85;
 assert(poseEmyLastChance(shot,rescueCat,foe,true),'The cat becomes visible when she launches herself');
 assert(!rescueCat.hidden&&rescueCat.parts.every(part=>!part.box.hiddenGeometry));
 const previous={x:rescueCat.x,z:rescueCat.z};
 shot.elapsed=2.1;poseEmyLastChance(shot,rescueCat,foe,true);
 assert.equal(foe.mode,'stunned','A rescue physically knocks the pursuer back');
 assert(Math.hypot(rescueCat.x-previous.x,rescueCat.z-previous.z)>.05,'Emy must move during her jump');
 const escapeShot={elapsed:0,kitty:{from:{x:5.65,z:12.8}}};
 poseEscapeAmbush(escapeShot,rescueCat,foe,true);
 assert(foe.z>=12.35,'Cinematic pursuer must stay OUTSIDE the opaque front house wall');
 console.log('PASS Emy abilities: scan cooldown, room map, thrown objects, cat rescue and finale staging');

})().catch(error=>{console.error(error);process.exitCode=1;});
