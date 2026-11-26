const assert=require('node:assert/strict');
const near=(a,b,message,tol=1e-5)=>assert(Math.abs(a-b)<tol,message+': '+a+' vs '+b);
(async()=>{
 const {CharacterAnimator}=await import('../src/lab/animator.js');
 const {createPose,createRigBinding,evaluateRig,skinCharacter,jointPosition,JOINTS}=await import('../src/lab/character-rig.js');
 const {characterPieces}=await import('../src/lab/character-model.js');
 const {geometry}=await import('../src/lab/renderer.js');
 const {windowEntryHands,sampleWindowEntry}=await import('../src/lab/animations/window-entry.js');
 const g=geometry(characterPieces()),binding=createRigBinding(g.groups),out=new Float32Array(g.vertices.length);
 assert.equal(g.groups.length,characterPieces().length);assert(binding.groups.every(g=>Number.isInteger(g.joint)),'Every model piece has an explicit joint');
 evaluateRig(binding,createPose());skinCharacter(g.vertices,out,binding);
 for(let i=0;i<g.vertices.length;i++)near(out[i],g.vertices[i],'Identity bind pose',2e-6);
 const animator=new CharacterAnimator();animator.advance(.1);evaluateRig(binding,animator.sample());skinCharacter(g.vertices,out,binding);
 for(let i=0;i<out.length;i+=16){assert([...out.slice(i,i+16)].every(Number.isFinite));near(Math.hypot(...out.slice(i+6,i+9)),1,'Skinned normals stay unit length');}
 // A planted foot stays at the same world location throughout stance, including strafing/backpedalling.
 for(const [forward,side]of [[1,0],[-1,0],[0,1],[Math.SQRT1_2,Math.SQRT1_2]]){
  const feet=[];
  for(const distance of [.04,.05]){animator.distance=distance;animator.forward=forward;animator.side=side;evaluateRig(binding,animator.sample('walk'));const foot=jointPosition(binding,'leftFoot');feet.push([foot[0]+distance*side,foot[1],foot[2]+distance*forward]);}
  for(let k=0;k<3;k++)near(feet[0][k],feet[1][k],'Stance foot locks to the floor');
 }
 const scene=new CharacterAnimator();for(let i=0;i<60;i++)scene.advance(1/60,{distance:1/60,forward:1});assert(scene.weight>.99);near(scene.distance,1,'Distance drives the gait');
 const phase=scene.snapshot().phase;for(let i=0;i<60;i++)scene.advance(1/60,{distance:0});assert.equal(scene.weight,0);near(scene.snapshot().phase,phase,'A wall cannot advance the stride');
 const before=scene.snapshot();scene.advance(.1,{distance:.1,paused:true});assert.deepEqual(scene.snapshot(),before,'Pause freezes all animation state');
 scene.advance(.1,{reduced:true});assert([...scene.sample('idle')].every(v=>v===0),'Reduced motion disables decorative idle motion');
 const rates=[];for(const hz of [30,60]){const a=new CharacterAnimator();for(let i=0;i<hz;i++)a.advance(1/hz,{distance:1/hz});rates.push(a.snapshot());}near(rates[0].distance,rates[1].distance,'Frame-independent stride');near(rates[0].weight,rates[1].weight,'Frame-independent blend');
 for(const t of [0,.2,.5,.8,1])assert([...sampleWindowEntry(t,createPose())].every(Number.isFinite));
 assert([...sampleWindowEntry(0,createPose())].every(v=>v===0));assert([...sampleWindowEntry(1,createPose())].every(v=>v===0));assert.equal(windowEntryHands(.4).length,2);
 // The authored climb must visibly lose height, regain it with more force,
 // and absorb landing. Check the actual rig, not only the phase labels.
 const climbJoints=t=>{evaluateRig(binding,sampleWindowEntry(t,createPose()));return Object.fromEntries(['root','leftFoot','rightFoot','leftHand','rightHand'].map(n=>[n,jointPosition(binding,n)]));};
 const firstPush=climbJoints(.39),slip=climbJoints(.46),secondPush=climbJoints(.65),landing=climbJoints(.87);
 assert(firstPush.root[1]-slip.root[1]>.14,'The failed climb actually loses height');
 assert(secondPush.root[1]-firstPush.root[1]>.18,'The second push gains visibly more height');
 assert(climbJoints(.37).leftFoot[1]-climbJoints(.37).rightFoot[1]>.08,'The first foot leads');
 assert(climbJoints(.71).rightFoot[1]>climbJoints(.71).leftFoot[1],'The other foot follows over the sill');
 assert(landing.root[1]<-.05,'The knees absorb landing');
 let previousClimb=null;
 for(let frame=0;frame<=1200;frame++){
  const pose=sampleWindowEntry(frame/1200,createPose());assert(pose.every(Number.isFinite));
  evaluateRig(binding,pose);
  const points=['leftHand','rightHand','leftFoot','rightFoot'].map(n=>jointPosition(binding,n));
  assert(points.flat().every(Number.isFinite));
  if(previousClimb)for(let i=0;i<points.length;i++)assert(Math.hypot(...points[i].map((v,k)=>v-previousClimb[i][k]))<.035,'No limb teleport between sampled poses');
  previousClimb=points;
 }
 const {sampleHop,hopPose}=await import('../src/lab/animations/hop.js');
 const {HOP_DURATION,HOP_COOLDOWN}=await import('../src/lab/hud-context.js');
 const air=hopPose(HOP_DURATION*.5);assert(air.lift>.1&&air.tuck>.03);
 const contact=hopPose(HOP_DURATION);assert.equal(contact.lift,0);assert(contact.squash>.02);
 assert.equal(hopPose(HOP_COOLDOWN).weight,0);
 assert.equal(hopPose(.18,true).weight,0,'Reduced motion omits expressive pose');
 for(const t of [0,.03,.09,.18,.27,.36,.44,.62]){
  const p=sampleHop(t,createPose(),{handsFree:true});
  assert([...p].every(Number.isFinite));
  evaluateRig(binding,p);skinCharacter(g.vertices,out,binding);assert(out.every(Number.isFinite));
 }
 const jumping=new CharacterAnimator();jumping.advance(.055,{hopAge:.18,equipment:'empty'});
 evaluateRig(binding,jumping.sample());assert(jointPosition(binding,'leftFoot')[1]>.15);
 jumping.advance(.055,{hopAge:HOP_COOLDOWN,equipment:'empty'});
 assert.equal(jumping.hopAge,HOP_COOLDOWN);
 await require('./animation-quality.cjs')();
 assert.equal(JOINTS.length,15);console.log('PASS animation: articulated bind pose, attachments, unit normals, planted feet in 4 directions, collision stops, smooth blends, 30/60 Hz, pause, reduced motion and reusable window clip');
})().catch(e=>{console.error(e);process.exitCode=1;});
