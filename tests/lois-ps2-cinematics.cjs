const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {createHouse}=await import('../src/lab/world.js');
 const {createLouisEscape,updateLouisEscape,freeLouis,louisCamera}=await import('../src/lab/louis-escape.js');
 const {createLoisShotDirector,advanceLoisShot,finishLoisShot,loisShotLabel,LOIS_SCENE_TIMING}=await import('../src/lab/lois-ps2-cinematics.js');
 const {LOIS_REACTIONS,startLoisReaction,advanceLoisReaction,sampleLoisReaction}=await import('../src/lab/lois-ps2-reactions.js');
 const {sampleLoisRig}=await import('../src/lab/lois-ps2-rig.js');
 const valid=view=>['x','y','z','yaw','pitch'].every(k=>Number.isFinite(view?.[k]));
 const EPS=1e-8;
 const nearly=(a,b)=>Math.abs(a-b)<EPS;
 const world=createHouse();
 const actor=createLouisEscape(world);
 const director=createLoisShotDirector();
 const events=[];
 assert(!startLoisReaction(actor,'explode'),'unsupported reaction cannot trigger story');
 for(const name of ['look-kitty','listen','startle','relief','speak','reach'])
  assert(LOIS_REACTIONS[name]>0);
 const initial=louisCamera(actor),start=advanceLoisShot(director,'untying',initial,.05);
 assert(valid(start));assert.equal(director.phase,'untying');
 assert(nearly(start.x,initial.x),'cinema starts in a safe preset shot rather than flying through walls');
 const previousEvents=[];
 for(let i=0;i<1350&&actor.phase!=='hidden';i++){
  const cue=updateLouisEscape(actor,1/30);
  if(cue)events.push(cue);
  const camera=louisCamera(actor),view=advanceLoisShot(director,actor.phase,camera,1/30);
  assert(valid(view),'camera must remain finite in '+actor.phase);
  assert(actor.world===world,'animation never changes world identity');
  assert(actor.x>0&&actor.z>0&&actor.y>-5,'actor stays on designed rescue route');
  const rig=sampleLoisRig(actor);
  assert(Object.values(rig.face).filter(x=>typeof x==='number').every(Number.isFinite));
  assert(rig.face.jawOpen>=0&&rig.face.jawOpen<=.45);
  assert(rig.face.gazeYaw<1&&rig.face.gazeYaw>-1,'eye gaze bounded');
  if(actor.phase==='climb'&&actor.visualReaction?.type==='look-kitty')
   assert(rig.face.reaction==='look-kitty','liberation produces a natural look toward Kitty');
  if(actor.phase==='hide'&&actor.visualReaction?.type==='startle')
   assert(rig.face.reaction==='startle');
 }
 assert.deepEqual(events,['untied','arrived','hidden'],'same exact gameplay event sequence');
 assert.equal(actor.phase,'hidden');
 assert.equal(actor.concealed,true);
 assert.equal(actor.visualReaction?.type,'listen');
 const look=sampleLoisReaction({...actor,visualReaction:{type:'listen',age:.35,duration:1.35}});
 assert(look.weight>.8,'hiding reaction gently reaches its peak');
 assert(look.browLift>0);
 const base=sampleLoisRig({...actor,visualReaction:null});
 const startled=sampleLoisRig({...actor,visualReaction:{type:'startle',age:.25,duration:.75}});
 assert(startled.face.browLift>base.face.browLift,'brows react to danger');
 const talk=sampleLoisRig({...actor,visualReaction:{type:'speak',age:.5,duration:1.6}});
 assert(talk.face.jawOpen>base.face.jawOpen,'future speech hook articulates the mouth');
 const gesture=sampleLoisRig({...actor,visualReaction:{type:'reach',age:.35,duration:1.15}});
 assert.notDeepEqual(gesture.bones.leftShoulder.rotation,base.bones.leftShoulder.rotation,'future reach uses hands');
 assert(startLoisReaction(actor,'speak',.65));
 const faceBefore={...actor.visualReaction},coordBefore={x:actor.x,y:actor.y,z:actor.z};
 advanceLoisReaction(actor,.15);
 assert(actor.visualReaction.age>faceBefore.age);
 assert.deepEqual({x:actor.x,y:actor.y,z:actor.z},coordBefore,'reactions never move a character');
 for(let i=0;i<10;i++)advanceLoisReaction(actor,.15);
 assert.equal(actor.visualReaction,null,'reaction cleans itself up');
 assert(freeLouis(actor));
 assert.equal(actor.visualReaction.type,'relief');
 const saved={x:actor.x,y:actor.y,z:actor.z};
 const lookAhead=sampleLoisRig({...actor,visualReaction:{type:'look-kitty',age:.34,duration:1.05}});
 assert.notDeepEqual(lookAhead.bones.head.rotation,base.bones.head.rotation,'head orientation can acknowledge Kitty');
 assert.deepEqual(saved,{x:actor.x,y:actor.y,z:actor.z});
 const matching={x:director.view.x+.8,y:director.view.y,z:director.view.z+.5,yaw:director.view.yaw+.13,pitch:director.view.pitch};
 let returning=finishLoisShot(director,matching,1/60);
 assert.equal(returning.complete,false,'nearby camera handoff uses a transition');
 for(let i=0;i<80&&!returning.complete;i++)returning=finishLoisShot(director,matching,1/60);
 assert(returning.complete);
 assert(valid(returning.view));
 assert(nearly(returning.view.x,matching.x)&&nearly(returning.view.z,matching.z));
 const far=createLoisShotDirector();advanceLoisShot(far,'hidden',{x:11,y:1.5,z:4,yaw:Math.PI,pitch:0},.02);
 const distance=finishLoisShot(far,{x:8.55,y:-2,z:13.4,yaw:0,pitch:0},1/60);
 assert(distance.complete,'camera must cut instead of passing through thick floors');
 assert.equal(distance.view.y,-2);
 const reduced=createLoisShotDirector();
 const camA={x:0,y:1,z:0,yaw:Math.PI-.05,pitch:0},camB={x:0,y:1,z:0,yaw:-Math.PI+.05,pitch:0};
 advanceLoisShot(reduced,'untying',camA,.1);
 const short=advanceLoisShot(reduced,'climb',camB,.1,false);
 assert(Math.abs(short.yaw-camA.yaw)<.3,'yaw interpolation chooses shortest path across +/-pi');
 const noMotion=advanceLoisShot(reduced,'hide',camB,.03,true);
 assert(Math.abs(Math.atan2(Math.sin(noMotion.yaw-camB.yaw),Math.cos(noMotion.yaw-camB.yaw)))<EPS,
  'reduced-motion skips camera easings, allowing equivalent angles differing by 2π');
 for(const phase of ['untying','climb','hide','hidden','follow'])
  assert(typeof loisShotLabel(phase)==='string'&&LOIS_SCENE_TIMING[phase]>0);
 // Check real house placement and hooks, not simply isolated mathematical helpers.
 const house=fs.readFileSync(require('node:path').join(__dirname,'../src/lab/house.js'),'utf8');
 for(const line of ['createLoisShotDirector()','advanceLoisShot(loisShotDirector','finishLoisShot(loisShotDirector',
  'loisShotDirector=null'])assert(house.includes(line),'house needs actual camera integration: '+line);
 assert(house.includes('createLoisDialogue()')&&house.includes('syncLoisDialogue('),'real dialogue drives speech');
 console.log('PASS: phase 5 — smooth safe rescue cameras, same events, look/listen/startle/relief, facial speech/reach hooks, paused/reduced motion and physical route.');
})().catch(error=>{console.error(error);process.exitCode=1;});
