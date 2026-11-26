const assert=require('node:assert/strict');
(async()=>{
 const w=await import('../src/lab/world.js');
 const {windowIntroCamera,windowIntroState,WINDOW_LANDING,shouldPlayWindowIntro,easeInOut}=await import('../src/lab/window-intro.js');
 const before=windowIntroCamera(0),after=windowIntroCamera(1);
 assert(before.z>10.8,'Starts outdoors');
 assert(after.z<w.HOUSE.depth,'Ends indoors');
 assert(after.z<before.z,'Travels through south window');
 assert(Math.abs(after.y-(WINDOW_LANDING.y+WINDOW_LANDING.eye))<.001);
 assert(Math.abs(after.pitch-WINDOW_LANDING.pitch)<.0001,'No pitch snap when the shot hands control back');
 assert.equal(easeInOut(0),0);assert.equal(easeInOut(1),1);
 assert(shouldPlayWindowIntro({demo:true,checkpoint:'ground'}));
 assert(shouldPlayWindowIntro({demo:true,checkpoint:'ground',trial:true}),'The first Casa 3D checkpoint also presents the window entrance');
 assert(!shouldPlayWindowIntro({demo:true,checkpoint:'ground',reducedMotion:true}));
 assert(!shouldPlayWindowIntro({demo:true,checkpoint:'upstairs'}));
 const house=w.createHouse('ground');
 assert(!w.blocked(house.boxes,WINDOW_LANDING.x,WINDOW_LANDING.y,WINDOW_LANDING.z,.155,1.64),'Window landing must be accessible');
 assert(!w.blocked(house.boxes,WINDOW_LANDING.x,1.4,w.HOUSE.depth,.12,.35),'Living-room window gap is physically open at camera height');
 for(let t=0;t<=1;t+=.005){const p=windowIntroCamera(t);assert(!w.blocked(house.boxes,p.x,p.y-.1,p.z,.08,.2),'Camera clears the sill, sash and furniture at '+t);}
 assert(windowIntroState(.4).hands?.length===2&&windowIntroState(.5).windowAmount===1,'Both hands grip after the sash opens');
 // The real first-person camera must show a failed climb, a more forceful
 // second attempt and a cushioned landing, without stop-and-go between keys.
 const first=windowIntroCamera(.39),slip=windowIntroCamera(.46),push=windowIntroCamera(.65),land=windowIntroCamera(.86);
 assert(first.y-slip.y>.20&&push.y-first.y>.10,'Readable loss of height and stronger second push');
 assert(push.z<slip.z&&land.y<WINDOW_LANDING.eye,'Cross the sill then absorb landing');
 assert.equal(windowIntroState(.45).phase,'slip');assert.equal(windowIntroState(.54).phase,'recover');
 const epsilon=.00001;
 for(const t of [.18,.32,.39,.46,.53,.65,.72,.86]){
  const a=windowIntroCamera(t-epsilon),b=windowIntroCamera(t),c=windowIntroCamera(t+epsilon);
  for(const k of ['x','y','z','pitch'])assert(Math.abs((b[k]-a[k])/epsilon-(c[k]-b[k])/epsilon)<.05,'Continuous camera velocity at '+t+' / '+k);
 }
 for(const t of [0,1]){
  const a=windowIntroCamera(t),b=windowIntroCamera(t===0?epsilon:1-epsilon);
  assert(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)/epsilon<.02,'Soft transition into and out of the shot');
 }
 const grip=windowIntroState(.35).hands;
 for(const t of [.39,.45,.53,.65,.70])for(let i=0;i<2;i++){
  const hand=windowIntroState(t).hands[i];
  assert(Math.hypot(hand.x-grip[i].x,hand.y-grip[i].y,hand.z-grip[i].z)<.0001,'Hands stay fixed to the frame through the failed push');
 }

 console.log('PASS: authored window shot, safe landing, real aperture and reduced-motion/test skipping');
})().catch(e=>{console.error(e);process.exitCode=1});
