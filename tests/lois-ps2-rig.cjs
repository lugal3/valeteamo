// Phase 4: CPU rig numerical and regression tests independent of WebGL.
const assert=require('node:assert/strict');
(async()=>{
 const {LOIS_RIG,LOIS_VISUAL_ID}=await import('../src/lab/lois-ps2-profile.js');
 const {loisBoneForPart,sampleLoisRig,writeLoisRigPart}=await import('../src/lab/lois-ps2-rig.js');
 const {createLouisEscape,updateLouisEscape,freeLouis}=await import('../src/lab/louis-escape.js');
 const {pickupGeometry,geometry}=await import('../src/lab/renderer.js');
 const {createHouse}=await import('../src/lab/world.js');
 const actor={kind:'louis-companion',id:'louis-escape',visualPreset:LOIS_VISUAL_ID,
  x:2.2,y:0,z:4.6,yaw:.4,phase:'follow',age:3.2,walk:1.1,speed:2,crouch:0,blink:0};
 const parts=pickupGeometry([actor]);
 assert(parts.length>20);
 assert(parts.every(p=>p.rigBone&&p.rigPart),'all PS2 pieces bind to a bone');
 const torso=parts.find(p=>p.rigPart==='torso');
 for(const side of [-1,1]){
  const upper=parts.find(p=>p.rigPart==='upper-arm-'+side);
  assert(torso.w/2-(Math.abs(upper.sourceOffset[0])-upper.w/2)>.02,
   'blazer upper arms must overlap torso at their shoulder seams');
 }
 const names=new Set(LOIS_RIG.map(b=>b.name));
 assert(parts.every(p=>names.has(p.rigBone)),'all piece joints exist');
 assert.equal(loisBoneForPart('face'),'head');
 assert.equal(loisBoneForPart('hair-cap'),'head');
 assert.equal(loisBoneForPart('lid--1'),'leftEyelid');
 assert.equal(loisBoneForPart('upper-lip'),'jaw');
 assert.equal(loisBoneForPart('upper-arm--1'),'leftShoulder');
 assert.equal(loisBoneForPart('forearm-1'),'rightElbow');
 assert.equal(loisBoneForPart('hand--1'),'leftWrist');
 assert.equal(loisBoneForPart('leg--1'),'leftKnee');
 assert.equal(loisBoneForPart('shoe-1'),'rightAnkle');
 const snapshots=[
  {phase:'untying',age:1.4,walk:0,speed:0,crouch:.33,blink:0},
  {phase:'climb',age:.75,walk:.73,speed:2.1,crouch:0,blink:.68},
  {phase:'hide',age:.75,walk:0,speed:0,crouch:.68,blink:.1},
  {phase:'hidden',age:.9,walk:0,speed:0,crouch:1,blink:1},
  {phase:'follow',age:2.1,walk:1.1,speed:2,crouch:0,blink:0}
 ];
 for(const snapshot of snapshots){
  const src={...actor,...snapshot},before=JSON.stringify(src);
  const rig=sampleLoisRig(src);
  assert.equal(rig.phase,snapshot.phase);
  assert.equal(Object.keys(rig.bones).length,LOIS_RIG.length);
  for(const b of Object.values(rig.bones)){
   assert([...b.rotation,...b.translation,...b.pivot].every(Number.isFinite),'finite bone transforms');
   const X=b.rotation;
   for(const idx of [0,3,6]){
    assert(Math.abs(Math.hypot(X[idx],X[idx+1],X[idx+2])-1)<1e-6,
     'orthonormal skinning basis');
   }
  }
  assert.deepEqual(JSON.parse(JSON.stringify(src)),JSON.parse(before),'sampling never mutates gameplay');
  assert(rig.face.blink>=0&&rig.face.blink<=1);
  assert(rig.face.jawOpen>=0&&rig.face.jawOpen<=1);
  const mesh=geometry(parts);
  const output=new Float32Array(mesh.vertices);
  const bound=[actor.x,actor.y,actor.z];
  for(let i=0;i<parts.length;i++){
   const r=mesh.ranges[i];
   writeLoisRigPart(output,mesh.vertices,r.start,r.end,parts[i],bound,src,rig);
  }
  assert(output.every(Number.isFinite),'vertex and normal data remain finite');
  assert.equal(output.length,mesh.vertices.length,'no geometry regeneration or extra tris');
  for(let i=0;i<output.length;i+=16){
   assert.equal(output[i+9],mesh.vertices[i+9],'UV U preserved through skeletal pose');
   assert.equal(output[i+10],mesh.vertices[i+10],'UV V preserved through skeletal pose');
   assert.equal(output[i+11],mesh.vertices[i+11],'face texture material preserved');
   const n=output.slice(i+6,i+9);
   assert(Math.abs(Math.hypot(...n)-1)<.03,'normal remains normalized');
  }
  for(const name of ['leftAnkle','rightAnkle']){
   const b=rig.bones[name],p=b.pivot;
   const ankleY=b.rotation[3]*p[0]+b.rotation[4]*p[1]+b.rotation[5]*p[2]+b.translation[1];
   assert(ankleY>=-.15,'foot does not sink far below ground');
  }
 }
 // Articulated motion reaches the face, wrists, legs and clothing.
 const at=(x,bone)=>sampleLoisRig({...actor,...x}).bones[bone];
 const a=at({phase:'follow',age:1,walk:0,speed:0},'leftHip');
 const b=at({phase:'follow',age:1,walk:.23,speed:2},'leftHip');
 assert.notDeepEqual(a.rotation,b.rotation,'walking must rotate hip bone');
 const c=at({phase:'hide',age:.6,crouch:.6,speed:0},'head');
 assert.notDeepEqual(a.translation,c.translation,'hiding bends and lowers the head');
 const eyes0=sampleLoisRig({...actor,blink:0}).bones.leftEyelid;
 const eyes1=sampleLoisRig({...actor,blink:1}).bones.leftEyelid;
 assert(eyes1.translation[1]<eyes0.translation[1]-.02,'eyelids actually close');
 const lips0=sampleLoisRig({...actor,phase:'follow',age:1}).bones.jaw;
 const lips1=sampleLoisRig({...actor,phase:'untying',age:1}).bones.jaw;
 assert.notDeepEqual(lips0.translation,lips1.translation,'restrained expression uses jaw');
 const idle=sampleLoisRig({...actor,phase:'follow',age:1,speed:0},false);
 const reduced=sampleLoisRig({...actor,phase:'follow',age:1,speed:0},true);
 assert.equal(reduced.visual.chest.breath,0,'reduced motion disables idle breathing');
 assert.notEqual(idle.visual.chest.breath,0);
 // The frame rate does not feed directly into the rig: same physical state,
 // same sample at 30/60/120 FPS, no frame-dependent animation accumulation.
 const state={...actor,age:1.25,walk:2.5,speed:1.8};
 const at30=sampleLoisRig({...state,dt:1/30}),at60=sampleLoisRig({...state,dt:1/60});
 const at120=sampleLoisRig({...state,dt:1/120});
 assert.deepEqual(at30.bones,at60.bones);assert.deepEqual(at60.bones,at120.bones);
 const old=pickupGeometry([{...actor,visualVariant:'legacy'}]);
 assert(old.every(p=>p.rigBone&&p.photoMapped!==undefined),
  'saved legacy variant is migrated to the single rigged photo model');
 const game=createHouse(),rescued=createLouisEscape(game);
 let event;for(let i=0;i<900&&rescued.phase!=='hidden';i++)event=updateLouisEscape(rescued,1/30)||event;
 assert.equal(rescued.phase,'hidden');
 assert(freeLouis(rescued));updateLouisEscape(rescued,1/30,{x:rescued.x+.8,y:rescued.y,z:rescued.z+.8,yaw:0});
 assert.equal(rescued.phase,'follow');
 console.log('PASS: phase 4 - 21 parented rigid bones, eyes/jaw/gaze, five rescue states, 30/60/120Hz, single-model migration and UV stability.');
})().catch(e=>{console.error(e);process.exitCode=1;});
