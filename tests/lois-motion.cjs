// Actual motion controller and rig: no animation based on frame count or camera yaw.
const assert=require('node:assert/strict');
(async()=>{
 const {sampleLoisMotion,advanceLoisMotion}=await import('../src/lab/lois-motion.js');
 const {sampleLoisRig}=await import('../src/lab/lois-ps2-rig.js');
 const {createHouse}=await import('../src/lab/world.js');
 const {createLouisEscape,updateLouisEscape}=await import('../src/lab/louis-escape.js');
 const base={phase:'follow',age:1,walk:.21,speed:1.8,crouch:0,yaw:0,blink:0};
 const a=sampleLoisMotion(base),b=sampleLoisMotion({...base,walk:base.walk+.65});
 assert(Math.abs(a.stride+b.stride)<.001,'opposite foot stance every half cycle');
 assert(Math.abs(a.leftLift-b.rightLift)<.001&&Math.abs(a.rightLift-b.leftLift)<.001);
 assert.equal(sampleLoisMotion({...base,speed:0}).state,'watchful');
 assert.equal(sampleLoisMotion({...base,phase:'hidden',crouch:1}).state,'concealed');
 assert.equal(sampleLoisMotion({...base,visualReaction:{type:'speak'}}).state,'speaking');
 assert.equal(sampleLoisMotion({...base,phase:'climb',visualMotion:{phase:'climb',rawSpeed:1.8,speed:1.8,slope:.4}}).state,'ascending');
 const r1=sampleLoisRig(base),r2=sampleLoisRig({...base,walk:base.walk+.65});
 assert.notDeepEqual(r1.bones.leftHip.rotation,r2.bones.leftHip.rotation,'gait changes hip');
 assert.notDeepEqual(r1.bones.chest.rotation,r2.bones.chest.rotation,'counter-rotation in chest');
 const fake={...base,x:0,y:0,z:0,speed:0};
 for(let i=0;i<60;i++)advanceLoisMotion(fake,1/60,{x:0,y:0,z:0},{x:1,y:0,z:1});
 assert(fake.visualMotion.lookYaw<-.3&&fake.visualMotion.attention,'head acknowledges Kitty');
 const stair={...base,phase:'climb',x:0,y:0,z:0,walk:0};
 for(let i=0;i<60;i++){const previous={x:stair.x,y:stair.y,z:stair.z};stair.z+=.02;stair.y+=.012;stair.walk+=.02;advanceLoisMotion(stair,1/60,previous);}
 assert(stair.gaitPhase>stair.walk*Math.PI*2/1.30,'Ascending uses shorter, continuous strides');
 const before=sampleLoisRig(fake).bones.head.rotation;
 fake.visualMotion=null;
 assert.notDeepEqual(before,sampleLoisRig(fake).bones.head.rotation,'target influences actual head bone');
 const world=createHouse(),actor=createLouisEscape(world);
 Object.assign(actor,{phase:'follow',x:5.8,y:0,z:16.6,yaw:0,crouch:0,exitRouteActive:false,speed:0});
 const kitty={x:5.8,y:0,z:17.8,yaw:0};
 for(let i=0;i<120;i++){kitty.yaw+=.08;updateLouisEscape(actor,1/60,kitty);}
 assert(Math.hypot(actor.x-5.8,actor.z-16.6)<.01,'rotating stationary Kitty never makes Louis orbit');
 kitty.z=19.5;
 let peak=0;
 for(let i=0;i<180;i++){updateLouisEscape(actor,1/60,kitty);peak=Math.max(peak,actor.visualMotion.speed);}
 assert(peak>.7&&actor.z>17.5,'actual navigation still walks toward Kitty');
 assert(Math.hypot(actor.x-kitty.x,actor.z-kitty.z)>.95,'respects companion spacing');
 for(let i=0;i<120;i++)updateLouisEscape(actor,1/60,kitty);
 assert(actor.visualMotion.speed<.05&&sampleLoisMotion(actor).state==='watchful','settles into idle rather than walking in place');
 const {finaleLouisGoal,finaleEmyGoal,reunionView}=await import('../src/lab/escape-finale.js');
 for(const x of [3.85,5.9,7.8]){
  const player={x,y:0,z:17.75},mark=finaleLouisGoal(player),cat=finaleEmyGoal(player);
  Object.assign(actor,{x:6.3,y:0,z:14.9,yaw:0,followSpeed:0,visualMotion:null});
  for(let frame=0;frame<360;frame++)updateLouisEscape(actor,1/60,player,mark);
  assert(Math.hypot(actor.x-mark.x,actor.z-mark.z)<.24,'Reach the reunion from each side of the path');
  const heading=Math.atan2(player.x-actor.x,player.z-actor.z);
  assert(Math.cos(actor.yaw-heading)>.99,'Louis turns back to Kitty before the closing shot');
  assert(cat.rejoin&&Math.hypot(cat.x-actor.x,cat.z-actor.z)>.55,'Give Emy and Louis separate marks');
  const origin={...player,y:1.63,yaw:.8,pitch:0};
  assert.deepEqual(reunionView(origin,actor,cat,0,false),origin);
  const view=reunionView(origin,actor,cat,1.5,false);
  for(const subject of [actor,cat]){
   const toward=Math.atan2(subject.x-view.x,subject.z-view.z);
   assert(Math.cos(view.yaw-toward)>.87,'Both actors fit the closing frame');
  }
 }
 console.log('PASS LOIS MOTION',JSON.stringify({strideMetres:1.30,peakSpeed:peak,finalDistance:Math.hypot(actor.x-kitty.x,actor.z-kitty.z),state:sampleLoisMotion(actor).state}));
})().catch(e=>{console.error(e);process.exitCode=1;});
