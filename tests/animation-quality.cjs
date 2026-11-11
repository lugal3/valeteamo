const assert=require('node:assert/strict');
module.exports=async()=>{
 const {createPose,createRigBinding,evaluateRig,jointPosition,skinCharacter}=await import('../src/lab/character-rig.js');
 const {sampleEmote,EMOTES}=await import('../src/lab/animations/emotes.js'),{sampleWalk,footTarget}=await import('../src/lab/animations/walk.js');
 const {CharacterAnimator}=await import('../src/lab/animator.js'),{characterPieces}=await import('../src/lab/character-model.js'),{geometry}=await import('../src/lab/renderer.js'),{viewModelOffsets}=await import('../src/lab/viewmodel.js');
 const mesh=geometry(characterPieces('empty')),binding=createRigBinding(mesh.groups),vertices=new Float32Array(mesh.vertices.length),pose=createPose();
 const joints=(id,t)=>{evaluateRig(binding,sampleEmote(id,t,pose));return Object.fromEntries(['root','leftHand','rightHand','leftFoot','rightFoot'].map(name=>[name,jointPosition(binding,name)]));};
 const low=joints('six-seven',.35),high=joints('six-seven',.72);assert(low.leftHand[1]<low.rightHand[1]-.10&&high.leftHand[1]>high.rightHand[1]+.10,'6–7 swaps the raised palm');
 const horse=joints('gangnam',.8);assert(Math.abs(horse.leftHand[0]-horse.rightHand[0])<.13&&horse.leftHand[2]>.23&&horse.rightHand[2]>.23,'Horseback wrists meet in front of the chest');
 const rightLift=joints('gangnam',.92),leftLift=joints('gangnam',1.83);
 assert(rightLift.rightFoot[1]>.24&&leftLift.leftFoot[1]>.24,'The high knee switches sides');
 assert(Math.abs(rightLift.leftFoot[1]-.11)<.002&&Math.abs(leftLift.rightFoot[1]-.11)<.002,'The other shoe stays planted');
 assert(rightLift.leftHand[0]>rightLift.rightHand[0]&&rightLift.rightHand[1]>rightLift.leftHand[1]+.1,'The wrists cross at distinct heights');
 const leftStep=joints('six-seven',.49),rightStep=joints('six-seven',1.25);
 assert(leftStep.root[0]<-.07&&rightStep.root[0]>.07,'6–7 travels side to side');
 assert(leftStep.rightFoot[1]>.18&&rightStep.leftFoot[1]>.18,'The feet alternate the lateral step');
 const {sampleBlink}=await import('../src/lab/animations/face.js'),eyes=binding.groups.filter(group=>group.blinkY!==undefined);
 assert.equal(eyes.length,4,'Both eyes and their glints can blink');
 const blink=sampleBlink(1.30);assert(blink>.95);assert.equal(sampleBlink(1.30,{reduced:true}),0);assert.equal(sampleBlink(2),0);
 assert(sampleBlink(.33,{firstAt:.25})>.95,'A cinematic can cue the first blink relative to the cut');
 evaluateRig(binding,createPose());skinCharacter(mesh.vertices,vertices,binding,blink);
 for(const {start,end,blinkY} of eyes){
  for(let i=start*16;i<end*16;i+=16){
   assert(Math.abs(vertices[i+1]-(blinkY-.016*blink))<=Math.abs(mesh.vertices[i+1]-blinkY)*.15+1e-5);
   assert(Math.abs(Math.hypot(...vertices.slice(i+6,i+9))-1)<1e-5);
  }
 }
 for(const clip of EMOTES){
  let previous=null;
  for(let frame=0;frame<=Math.ceil(clip.duration*120);frame++){
   const t=Math.min(clip.duration,frame/120),p=sampleEmote(clip.id,t,pose);evaluateRig(binding,p);skinCharacter(mesh.vertices,vertices,binding);assert(vertices.every(Number.isFinite));
   let floor=Infinity;for(let i=1;i<vertices.length;i+=16)floor=Math.min(floor,vertices[i]);assert(floor>-.014,clip.id+' shoes cannot pass through the floor: '+floor);
   const hands=['leftHand','rightHand'].map(n=>jointPosition(binding,n));
   if(previous)for(let i=0;i<2;i++)assert(Math.hypot(...hands[i].map((v,k)=>v-previous[i][k]))<.065,clip.id+' has no discontinuous wrist teleport');previous=hands;
   if(clip.id==='gangnam'&&t>.38&&t<4.7){const feet=['leftFoot','rightFoot'].map(n=>jointPosition(binding,n));assert(Math.min(...feet.map(f=>f[1]))<.111,'A support foot stays planted');}
  }
 }
 for(const distance of [.01,.08,.13,.20,.26,.33,.40,.48]){
  evaluateRig(binding,sampleWalk(distance,pose));const f=footTarget(distance);if(f.stance){const foot=jointPosition(binding,'leftFoot');assert(Math.abs(foot[1]-.11)<1e-5);assert(Math.abs(foot[2]+distance-.13)<1e-5,'Hip sway must not slide the support foot');}
 }
 const a=new CharacterAnimator();a.startEmote('six-seven');for(let i=0;i<9;i++)a.advance(.1);const before=Array.from(a.sample());a.startEmote('gangnam');assert.deepEqual(Array.from(a.sample()),before,'Switching dances starts from the displayed pose');for(let i=0;i<8;i++)a.advance(.1);const dancing=Array.from(a.sample());a.advance(.01,{distance:.01});assert.equal(a.emote,null);assert(a.performing,'Walking returns gradually without delaying movement');assert(Math.max(...a.sample().map((v,i)=>Math.abs(v-dancing[i])))<.015);for(let i=0;i<20;i++)a.advance(.02,{distance:.02});assert(!a.performing);a.startEmote('gangnam');a.cancelEmote({immediate:true});assert(!a.performing,'Hiding/crouch can discard the dance immediately');
 const b=new CharacterAnimator();for(let i=0;i<30;i++)b.advance(1/60,{distance:2/60});const moving=b.speed;b.advance(1/60);assert(b.speed>0&&b.speed<moving&&b.acceleration<0,'The handheld object settles instead of stopping abruptly');
 const phone=new CharacterAnimator();for(let i=0;i<20;i++)phone.advance(.02,{distance:.02,equipment:'phone'});evaluateRig(binding,phone.sample('hold-phone'));assert(Math.abs(jointPosition(binding,'leftFoot')[2]-.005)>.025,'Holding the phone retains the leg gait');const held=Array.from(phone.sample('hold-phone'));phone.startEmote('six-seven');assert.deepEqual(Array.from(phone.sample('hold-phone')),held,'An emote blends from the actual phone pose');
 const {blendPose}=await import('../src/lab/animations/pose-tools.js');const seamA=createPose(),seamB=createPose();seamA[2]=Math.PI-.02;seamB[2]=-Math.PI+.02;blendPose(seamA,seamB,.5,pose);assert(Math.abs(pose[2])>3,'A rotation across ±π takes the short route');
 for(const from of EMOTES)for(const to of EMOTES){const actor=new CharacterAnimator();actor.equipment='empty';actor.startEmote(from.id);for(let i=0;i<12;i++)actor.advance(.1);evaluateRig(binding,actor.sample());let previous=jointPosition(binding,'rightHand');actor.startEmote(to.id);for(let i=0;i<40;i++){actor.advance(1/120);evaluateRig(binding,actor.sample());const hand=jointPosition(binding,'rightHand');assert(Math.hypot(...hand.map((v,k)=>v-previous[k]))<.08,'All emote pairs blend without wrist jumps');previous=hand;}}
 assert.deepEqual(viewModelOffsets(3,{reduced:true,speed:2,acceleration:1,walkWeight:1}),{x:0,y:0,z:0,pitch:0,roll:0});
 for(let i=0;i<400;i++){const o=viewModelOffsets(i/60,{speed:3,walkWeight:1,bob:i/9,acceleration:Math.sin(i)});assert(Math.abs(o.x)<.012&&Math.abs(o.y)<.016&&Math.abs(o.pitch)<.025&&Math.abs(o.roll)<.01,'First-person accents stay subtle');}
 console.log('PASS animation quality: alternating palms, horseback contact, dense finite/floor/continuity checks, planted gait, interrupt/switch blends and bounded handheld settling');
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1;});
