const assert=require('node:assert/strict');
(async()=>{
 const {createHouse}=await import('../src/lab/world.js');
 const {createLouisEscape,updateLouisEscape,louisRescueHands,louisCamera,LOUIS_UNTIE_SECONDS}=await import('../src/lab/louis-escape.js');
 const {sampleLoisRig,loisJointPoint,loisWristAnchors}=await import('../src/lab/lois-ps2-rig.js');
 const {sampleLoisUntie}=await import('../src/lab/lois-untie.js');
 const {collectCinematicCues,UNTIE_CUES}=await import('../src/lab/cinematic-cues.js');
 const world=createHouse(),captive=world.objects.find(o=>o.id==='captive-louis'),actor=createLouisEscape(world);
 assert.deepEqual([actor.x,actor.y,actor.z,actor.crouch],[captive.x,captive.y,captive.z,captive.crouch],'No teleport at rescue interaction');
 const hip=loisJointPoint(actor,sampleLoisRig(actor),'pelvis');
 assert(hip.y-actor.y>.43&&hip.y-actor.y<.63,'hips sit at chair-seat height');
 let last=hip.y,seen=new Set(),released=0,cues=[],maxDelta=0;
 for(let i=0;i<Math.ceil(LOUIS_UNTIE_SECONDS*60)+2&&actor.phase==='untying';i++){
  const prev=actor.age,cue=updateLouisEscape(actor,1/60),point=loisJointPoint(actor,sampleLoisRig(actor),'pelvis');
  maxDelta=Math.max(maxDelta,Math.abs(point.y-last));last=point.y;
  seen.add(sampleLoisUntie(cue==='untied'?LOUIS_UNTIE_SECONDS:actor.age).stage);
  cues.push(...collectCinematicCues('untie',prev,cue==='untied'?LOUIS_UNTIE_SECONDS:actor.age,actor.untieCues));
  if(cue==='untied'){released++;break;}
  assert(Object.values(louisCamera(actor)).every(Number.isFinite));
  if(actor.age>.6&&actor.age<1.9){
   const hands=louisRescueHands(actor),wrists=loisWristAnchors(actor);
   assert(hands.every(h=>wrists.some(w=>Math.hypot(h.x-w.x,h.y-w.y,h.z-w.z)<.09)),'Kitty paws meet actual wrist anchors');
  }
 }
 assert.equal(released,1);assert.equal(actor.phase,'climb');assert(maxDelta<.07,'continuous rise: '+maxDelta);
 assert(last-actor.y>.84,'stands before walking');assert(seen.has('loosen')&&seen.has('free')&&seen.has('stand'));
 assert.deepEqual(cues.map(c=>c.id),UNTIE_CUES.map(c=>c.id));
 console.log('PASS LOIS UNTIE',JSON.stringify({seconds:LOUIS_UNTIE_SECONDS,chairHip:hip.y-captive.y,standingHip:last-actor.y,maxFrameDelta:maxDelta,cues:cues.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
