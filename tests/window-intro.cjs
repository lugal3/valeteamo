const assert=require('node:assert/strict');
(async()=>{
 const w=await import('../src/lab/world.js');
 const {windowIntroCamera,WINDOW_LANDING,shouldPlayWindowIntro,easeInOut}=await import('../src/lab/window-intro.js');
 const before=windowIntroCamera(0),after=windowIntroCamera(1);
 assert(before.z>10.8,'Starts outdoors');
 assert(after.z<9.5,'Ends indoors');
 assert(after.z<before.z,'Travels through south window');
 assert(Math.abs(after.y-(WINDOW_LANDING.y+WINDOW_LANDING.eye))<.001);
 assert.equal(easeInOut(0),0);assert.equal(easeInOut(1),1);
 assert(shouldPlayWindowIntro({demo:true,checkpoint:'ground'}));
 assert(!shouldPlayWindowIntro({demo:true,checkpoint:'ground',trial:true}));
 assert(!shouldPlayWindowIntro({demo:true,checkpoint:'ground',reducedMotion:true}));
 assert(!shouldPlayWindowIntro({demo:true,checkpoint:'upstairs'}));
 const house=w.createHouse('ground');
 assert(!w.blocked(house.boxes,WINDOW_LANDING.x,WINDOW_LANDING.y,WINDOW_LANDING.z,.155,1.64),'Window landing must be accessible');
 assert(!w.blocked(house.boxes,10.20,1.4,10.0,.12,.35),'Window gap must be physically open at camera height');
 console.log('PASS: authored window shot, safe landing, real aperture and reduced-motion/test skipping');
})().catch(e=>{console.error(e);process.exitCode=1});
