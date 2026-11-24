// Phase 09: no new character mesh, Photo-A, physical kitchen route or puzzle bypass.
const assert=require('node:assert/strict');
(async()=>{
 const {createHouse}=await import('../src/lab/world.js');
 const {createLouisEscape,updateLouisEscape,freeLouis,LOUIS_UNTIE_SECONDS}=await import('../src/lab/louis-escape.js');
 const {sampleLoisReaction}=await import('../src/lab/lois-ps2-reactions.js');
 const world=createHouse(),louis=createLouisEscape(world);
 assert.equal(louis.visualVariant,'photo-a');
 const beats=new Set();
 let untied=0;
 for(let frame=0;frame<160&&louis.phase==='untying';frame++){
  const cue=updateLouisEscape(louis,1/30);
  if(louis.visualReaction)beats.add(louis.visualReaction.type);
  if(cue==='untied')untied++;
 }
 assert.equal(untied,1,'untie sequence completes exactly once');
 assert(LOUIS_UNTIE_SECONDS>=3,'allow time for three distinct performance beats');
 for(const b of ['reach','startle','look-kitty'])assert(beats.has(b),'missing untie beat '+b);
 assert.equal(louis.untieBeat,3);
 const pose=sampleLoisReaction({...louis,visualReaction:{type:'look-kitty',age:.33,duration:1.05}});
 assert(pose.weight>0&&Number.isFinite(pose.gazeYaw),'real rig uses gaze response');
 let prev={x:louis.x,z:louis.z},arrival=0,hidden=0,maxStep=0;
 for(let i=0;i<1700&&louis.phase!=='hidden';i++){
  const cue=updateLouisEscape(louis,1/30);
  if(cue==='arrived')arrival++;
  if(cue==='hidden')hidden++;
  const step=Math.hypot(louis.x-prev.x,louis.z-prev.z);maxStep=Math.max(step,maxStep);
  assert(step<.10,'Louis never teleports along the rescue route');
  prev={x:louis.x,z:louis.z};
 }
 assert.equal(arrival,1);assert.equal(hidden,1);
 assert.equal(louis.phase,'hidden');assert(louis.crouch>.99);
 assert(freeLouis(louis));
 assert.equal(louis.phase,'follow');assert(louis.exitRouteActive);
 // Controlled turning, including the -PI/+PI angle seam.
 louis.exitRouteActive=false;louis.yaw=Math.PI-.02;
 const kitty={x:louis.x+.7,y:louis.y,z:louis.z+1.5,yaw:-Math.PI/2};
 const before=louis.yaw;
 updateLouisEscape(louis,1/60,kitty);
 const turn=Math.atan2(Math.sin(louis.yaw-before),Math.cos(louis.yaw-before));
 assert(Math.abs(turn)<.15,'following must not snap Louis to Kitty');
 assert(Number.isFinite(louis.yaw)&&Number.isFinite(louis.speed));
 console.log('PASS V2 phase 09: Photo-A preserved, three untie beats, physical route, crouch, smooth follow');
})().catch(e=>{console.error(e);process.exitCode=1;});
