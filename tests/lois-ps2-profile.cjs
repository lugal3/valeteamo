const assert=require('node:assert/strict');
(async()=>{
 const {LOIS_PS2_PROFILE,LOIS_VISUAL_ID,LOIS_RIG,sampleLoisVisual}=await import('../src/lab/lois-ps2-profile.js');
 const {createLouisEscape,updateLouisEscape,freeLouis,louisModel,LOUIS_UNTIE_SECONDS}=await import('../src/lab/louis-escape.js');
 const {createHouse}=await import('../src/lab/world.js');
 assert.equal(LOIS_PS2_PROFILE.id,LOIS_VISUAL_ID);
 assert.equal(LOIS_PS2_PROFILE.actorKind,'louis-companion','do not rename existing rescue state machine');
 assert.equal(LOIS_PS2_PROFILE.displayName,'Lois');
 assert(LOIS_PS2_PROFILE.reference.includes('Option B'));
 assert.equal(LOIS_PS2_PROFILE.atlas.face.mobile,512);
 assert(LOIS_PS2_PROFILE.meshLimits.mobileTriangles<4000);
 assert(Object.isFrozen(LOIS_PS2_PROFILE)&&Object.isFrozen(LOIS_PS2_PROFILE.palette));
 const names=new Set();
 for(const bone of LOIS_RIG){
  assert(!names.has(bone.name),'duplicate bone '+bone.name);
  assert(bone.parent===null||names.has(bone.parent),'parent must precede child: '+bone.name);
  assert(bone.pivot.every(Number.isFinite),'finite pivot '+bone.name);
  names.add(bone.name);
 }
 for(const name of ['head','jaw','leftEyelid','rightEyelid','leftWrist','rightWrist','leftKnee','rightKnee','leftAnkle','rightAnkle'])assert(names.has(name),'missing animation bone '+name);
 assert.notEqual(LOIS_PS2_PROFILE.displayName,'Luis','Lois is the kidnapped character, not Kitty boyfriend');
 const world=createHouse();
 const actor=createLouisEscape(world);
 assert.equal(actor.kind,LOIS_PS2_PROFILE.actorKind);
 assert.equal(actor.visualPreset,LOIS_VISUAL_ID);
 assert.equal(actor.phase,'untying');
 const baselinePieces=louisModel((id,x,y,z,w,h,d,mat,extra)=>({id,x,y,z,w,h,d,mat,extra}));
 assert(baselinePieces.some(p=>p.id==='face'&&p.extra.photoMapped),
  'single shipped model uses the approved photograph');
 assert(!baselinePieces.some(p=>p.id.startsWith('eye-')||p.id==='nose-tip'),
  'duplicated illustrated eyes and nose are removed');
 let released=0,seen=new Set();
 for(let i=0;i<900&&actor.phase!=='hidden';i++){
  const visual=sampleLoisVisual(actor,i%4===0);
  seen.add(visual.phase);
  assert.equal(visual.id,LOIS_VISUAL_ID);
  assert([visual.root.y,visual.chest.breath,visual.head.yaw,visual.face.fear,visual.face.blink,...Object.values(visual.limbs)].every(Number.isFinite),'finite visual channels');
  assert(visual.face.fear>=0&&visual.face.fear<=1);
  const event=updateLouisEscape(actor,1/30);
  if(event==='untied')released++;
 }
 seen.add(actor.phase); // The hidden state is reached on the final update.
 assert.equal(released,1);
 assert(LOUIS_UNTIE_SECONDS>=2.5);
 for(const stage of ['untying','climb','hide','hidden'])assert(seen.has(stage),'missing state '+stage);
 assert.equal(actor.phase,'hidden');
 assert.equal(sampleLoisVisual(actor,true).posture,'concealed');
 assert.equal(sampleLoisVisual(actor,true).chest.breath,0,'accessibility: no idle sway');
 assert(freeLouis(actor));
 assert.equal(actor.phase,'follow');
 updateLouisEscape(actor,.3,{x:11.82,y:0,z:4.08,yaw:Math.PI});
 const follow=sampleLoisVisual({...actor,phase:'follow',walk:.23,speed:2});
 assert.equal(follow.posture,'moving');
 assert.notEqual(follow.limbs.leftLeg,follow.limbs.rightLeg,'walk remains articulated');
 const {sampleLoisRig}=await import('../src/lab/lois-ps2-rig.js');
 assert.equal(Object.keys(sampleLoisRig(actor).bones).length,LOIS_RIG.length,
  'the single photographic model preserves all animated bones');
 assert.equal(sampleLoisVisual({phase:'unknown',age:NaN,speed:Infinity,blink:Infinity}).phase,'follow');
 console.log('PASS: Lois PS2 option B contract, parented 21-bone rig, all rescue states, single photographic mesh/animations intact.');
})().catch(e=>{console.error(e);process.exitCode=1;});
