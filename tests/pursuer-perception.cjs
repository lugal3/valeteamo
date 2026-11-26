const assert=require('node:assert/strict');
(async()=>{
 const {canHearNoise,searchAroundLastSeen,TRAIL_SEARCH_SECONDS}=await import('../src/lab/pursuer-perception.js');
 const {Pursuer}=await import('../src/lab/pursuer.js');
 const {createHouse}=await import('../src/lab/world.js');
 const a={x:0,y:0,z:0};
 assert(canHearNoise(a,{x:3,y:0,z:0},.4),'Close impacts should be audible');
 assert(!canHearNoise(a,{x:30,y:0,z:0},2.5),'Noise can never reveal events across the entire map');
 assert(canHearNoise(a,{x:11,y:0,z:0},1,false),'Open door conducts a loud sound');
 assert(!canHearNoise(a,{x:11,y:0,z:0},1,true),'A solid wall significantly damps a sound');
 assert(canHearNoise(a,{x:5,y:3.15,z:2},1.5,true),'Emy loud distraction reaches the other floor');
 assert(!canHearNoise(a,{x:5,y:12,z:2},1.5,true),'Different heights still limit hearing');
 assert(!canHearNoise(a,{x:Infinity,y:0,z:0},1),'Invalid sources cannot enter the AI');

 const pts=searchAroundLastSeen({x:5,y:0,z:5},(x,z,y)=>y,
  (x,y,z)=>x<5.5);
 assert(pts.length>=2&&pts.every(p=>p.x<5.5&&p.y===0),'Search samples only reachable local positions');
 assert(pts.every(p=>Math.hypot(p.x-5,p.z-5)<1.1),'Search never uses a second unseen player position');
 const world=createHouse(),p=new Pursuer(world);
 assert(!p.hearNoise({x:6,y:0,z:11}),'Asleep or dormant pursuer ignores loud objects');
 p.mode='search';Object.assign(p,{x:6,y:3.15,z:2.8,yaw:-Math.PI/2,facing:-Math.PI/2});
 const visible={x:5.4,y:3.15,z:2.8,hidden:false,crouched:false,flashlight:false};
 assert(p.canSee(visible),'The real upstairs line-of-sight must remain functional');
 p.update(.05,visible);
 assert.deepEqual(p.lastSeen,{x:visible.x,y:visible.y,z:visible.z});
 const unseen={x:2.2,y:3.15,z:3.8,hidden:true,hideId:'wardrobe'};
 p.mode='chase';p.awareness=.9;p.modeTime=4;p.witnessed=null;
 let lostCues=[],searchFound=false,searchGoal=null;
 for(let i=0;i<100;i++){
  lostCues.push(...p.update(.05,unseen));
  if(p.mode==='trail-search'){
   searchFound=true;searchGoal={...p.lastSeen};break;
  }
 }
 assert(searchFound&&lostCues.includes('lost'),'Lost sight must transition to active last-seen search');
 assert.deepEqual(searchGoal,{x:visible.x,y:visible.y,z:visible.z},
  'The pursuer must search where Kitty was ACTUALLY seen, not her hidden current position');
 assert(p.trailRemaining>0&&p.trailRemaining<=TRAIL_SEARCH_SECONDS);
 assert(p.trailPoints.every(t=>Math.hypot(t.x-visible.x,t.z-visible.z)<=1.3),
  'Trail search is bounded around confirmed evidence');
 assert.equal(p.witnessed,null,'Unseen wardrobe is not automatically revealed');
 assert.equal(p.caught,false,'Kitty hiding out of sight is not caught');
 let resumed=false;
 for(let i=0;i<200;i++){
  p.update(.05,unseen);
  if(p.mode==='cooldown'||p.mode==='search'){resumed=true;break;}
 }
 assert(resumed,'Local search ends: it cannot track Kitty indefinitely');
 assert(!p.caught,'No false capture after the search expires');
 p.reset();p.mode='search';Object.assign(p,{x:6,y:3.15,z:2.8,yaw:-Math.PI/2,facing:-Math.PI/2});
 assert(!p.hearNoise({x:65,y:0,z:65},1.3),'Noise investigation has a finite radius');
 assert(p.hearNoise({x:6.5,y:3.15,z:2.8},1));
 assert.equal(p.mode,'noise-investigate');
 assert(p.awareness<.26,'A noise alone never becomes a confirmed visual pursuit');
 assert.equal(p.witnessed,null);
 // A real, close visual sighting overrides an RC honking next to the player.
 p.mode='rc-chase';p.awareness=.7;p.modeTime=5;
 const decoy={active:true,noisy:true,x:6.2,y:3.15,z:2.7,hidden:false,crouched:true};
 p.update(.05,visible,()=>{},decoy);
 assert.notEqual(p.mode,'rc-chase','A witnessed nearby Kitty takes priority over a decoy');
 assert(p.awareness>=.7);
 const {difficultyProfile}=await import('../src/lab/difficulty.js');
 const {pursuerPose}=await import('../src/lab/pursuer-model.js');
 const story=difficultyProfile('story',true,3),assisted=difficultyProfile('story',true,1),normal=difficultyProfile('normal',false,3),tense=difficultyProfile('tense',false,3);
 assert(story.chase<normal.chase&&normal.chase<tense.chase);
 assert(story.sight<normal.sight&&story.grace>normal.grace);
 assert(assisted.chase<story.chase&&assisted.cooldown>story.cooldown&&assisted.grace>story.grace);
 assert.deepEqual(difficultyProfile('story',false,1),difficultyProfile('story',false,3));
 assert.equal(difficultyProfile('invalid',false).id,'story');
 p.reset();p.setDifficulty(story);p.mode='investigate';p.awareness=.99;Object.assign(p,{x:6,y:3.15,z:2.8,yaw:-Math.PI/2,facing:-Math.PI/2});
 const started=p.update(.05,visible);
 assert(started.includes('spotted')&&p.captureGrace>1);
 p.update(.05,visible);assert(!p.caught,'Story mode provides reaction time even at close range');
 assert(!p.hearNoise({x:6.2,y:3.15,z:2.8},2),'Confirmed chase does not lose Kitty to an arbitrary sound');
 p.lost=1.1;p.witnessed=null;assert(p.hearNoise({x:6.2,y:3.15,z:2.8},2));
 assert.equal(p.mode,'noise-investigate');assert(p.awareness<.26);
 p.cooldown();assert.equal(p.modeTime,story.cooldown);
 p.update(.05,visible);assert.equal(p.mode,'cooldown','Story cooldown cannot instantly reacquire Kitty');
 const doorPose=pursuerPose({...p.snapshot(),doorReach:.22,turnRate:2,walk:.2,speed:0},false);
 assert(doorPose.arm1.pitch<-.7&&Number.isFinite(doorPose.head.yaw));
 console.log('PASS V2 phase 03: finite audio range/occlusion, cross-floor cat noise, sight-backed local search, fair hidden Kitty and RC priority');
})().catch(error=>{console.error(error);process.exitCode=1});
