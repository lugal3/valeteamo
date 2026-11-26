// ValeTeAmo V2 phase 07: RC driving feel and camera without replacing physics.
const assert=require('node:assert/strict');
(async()=>{
 const {createRC,driveRC,advanceRCCamera,rcSignalStrength,rcCameraVibration,beepRC,stopRC,RC_SPEED}=await import('../src/lab/rc-car.js');
 const world={boxes:[],hatch:{amount:0}};
 const rc=createRC({x:5,y:.14,z:5,taken:false,interactable:false});
 rc.mode='driving';rc.y=0;
 const positions=[];
 for(let i=0;i<18;i++){driveRC(rc,world,{steer:0,throttle:1},1/60);positions.push(rc.driveSpeed);}
 assert(positions[0]>0&&positions[0]<RC_SPEED*.5,'acceleration must not instantly jump to max speed');
 for(let i=1;i<positions.length;i++)assert(positions[i]>=positions[i-1]-1e-7,'speed accelerates smoothly');
 for(let i=0;i<120;i++)driveRC(rc,world,{steer:0,throttle:1},1/60);
 assert(Math.abs(rc.driveSpeed-RC_SPEED)<.01,'full speed reached');
 const old=rc.driveSpeed;
 driveRC(rc,world,{steer:0,throttle:0},1/60);
 assert(rc.driveSpeed<old&&rc.driveSpeed>0,'coasts and brakes, does not stop instantly');
 for(let i=0;i<60;i++)driveRC(rc,world,{steer:0,throttle:-1},1/60);
 assert(rc.driveSpeed<-.2,'reverse available after controlled braking');
 const heading=rc.yaw;
 for(let i=0;i<25;i++)driveRC(rc,world,{steer:1,throttle:-.6},1/60);
 assert(Number.isFinite(rc.yaw)&&rc.yaw!==heading,'reverse steering remains responsive');
 assert(Number.isFinite(rc.roll)&&Math.abs(rc.roll)<=.14,'bounded chassis lean');
 assert(Math.abs(rc.tilt)<=.34&&Math.abs(rc.suspension)<=.016,'bounded grade and stair movement');
 assert.equal(rc.object.roll,rc.roll,'chassis lean reaches the actual model');
 assert.equal(rcSignalStrength(rc,rc),1);assert(rcSignalStrength(rc,{x:rc.x+12,y:rc.y+3.15,z:rc.z})<1);assert(rcSignalStrength(rc,{x:1000,y:100,z:1000})>=.30);
 assert(beepRC(rc)&&rc.noise===8,'original lure untouched');
 const goal={x:4,y:1,z:5,yaw:-3.12,pitch:-.2};
 const prev={x:3.8,y:1,z:4.9,yaw:3.12,pitch:-.3};
 const cam=advanceRCCamera(prev,goal,1/60);
 assert(Math.hypot(cam.x-goal.x,cam.z-goal.z)<Math.hypot(prev.x-goal.x,prev.z-goal.z),'camera approaches target');
 assert(Math.abs(cam.yaw-prev.yaw)<.1,'yaw crosses ±pi by shortest arc');
 assert.deepEqual(advanceRCCamera(prev,goal,1/60,true),goal,'reduced-motion camera snaps safely');
 assert.deepEqual(advanceRCCamera({...prev,x:100},goal,1/60),goal,'reset after teleports/recovery');
 assert.deepEqual(rcCameraVibration(goal,{suspension:.016},true),goal);
 assert(rcCameraVibration(goal,{suspension:.016}).y>goal.y);
 assert(stopRC(rc)&&rc.driveSpeed===0&&rc.velocity===0&&rc.object.roll===0&&rc.object.tilt===0,'stopping clears momentum and visible lean');
 console.log('PASS V2 phase 07: progressive throttle, braking, reverse, steering, horn, smooth camera and resets');
})().catch(e=>{console.error(e);process.exitCode=1});
