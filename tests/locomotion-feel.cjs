const assert=require('node:assert/strict');
(async()=>{
 const {advanceMoveIntent,advanceMoveSpeed,advanceCameraFloor,advanceEye,
  KITTY_SPEED,isOnStairs}=await import('../src/lab/locomotion-feel.js');
 const {followLook}=await import('../src/lab/camera-controls.js');
 const {createHouse,setDoor,blocked,STAIR,HEIGHT}=await import('../src/lab/world.js');
 const {navigate,getStairDirection,PLAYER_RADIUS}=await import('../src/lab/navigation.js');

 const near=(a,b,tol=.00001,msg='values differ')=>assert(Math.abs(a-b)<=tol,msg+': '+a+' vs '+b);
 // Driving movement with keyboard (full) and touch (analogue) must use exactly
 // the same time constants, and never move faster on a diagonal.
 const goal=[.65,.75],measure=(hz,f,s,sec)=>{
  let state={forward:0,side:0};
  for(let i=0;i<hz*sec;i++)state=advanceMoveIntent(state,f,s,1/hz);
  return state;
 };
 const at30=measure(30,...goal,1),at60=measure(60,...goal,1),at120=measure(120,...goal,1);
 near(at30.forward,at60.forward,1e-8,'frame rate forward 30/60');
 near(at60.side,at120.side,1e-8,'frame rate side 60/120');
 assert(Math.hypot(at120.forward,at120.side)<=1+1e-9,'Diagonal analogue intent must never accelerate above maximum');
 const diagonal=advanceMoveIntent({forward:0,side:0},1,1,1);
 assert(Math.hypot(diagonal.forward,diagonal.side)<=1,'W+D may not move √2 times faster');
 let reverse=advanceMoveIntent({forward:1,side:0},-1,0,1/60);
 assert(reverse.forward<1&&reverse.forward>0,'Reversing brakes through zero rather than instant sign-flip');
 for(let i=0;i<45;i++)reverse=advanceMoveIntent(reverse,-1,0,1/60);
 assert(reverse.forward<-.95,'Reversing eventually reaches full speed');
 let stop=advanceMoveIntent({forward:1,side:.20},0,0,1/60);
 for(let i=0;i<60;i++)stop=advanceMoveIntent(stop,0,0,1/60);
 assert.deepEqual(stop,{forward:0,side:0},'Keyboard and joystick release must settle to zero without drift');
 assert.deepEqual(advanceMoveIntent({forward:0,side:0},.009,.007,1/60),{forward:0,side:0},
  'A noisy neutral joystick cannot move Kitty');
 assert.deepEqual(advanceMoveIntent({forward:0,side:0},Number.NaN,Infinity,1/60),
  {forward:0,side:0},'Bad touch coordinates cannot contaminate movement');

 const speed=(hz,target,seconds)=>{
  let value=KITTY_SPEED.walk;
  for(let i=0;i<hz*seconds;i++)value=advanceMoveSpeed(value,target,1/hz);
  return value;
 };
 near(speed(30,KITTY_SPEED.run,.36),speed(60,KITTY_SPEED.run,.36),1e-8,
  'Sprint blend is frame-independent');
 assert(speed(60,KITTY_SPEED.run,.03)>KITTY_SPEED.walk);
 assert(speed(60,KITTY_SPEED.run,.03)<KITTY_SPEED.run,
  'Running must not instantly jump to full speed');
 assert(speed(60,KITTY_SPEED.crouch,.4)<1.2,'Crouch blend reaches intended controlled speed');
 let ground=0;
 for(let i=0;i<90;i++)ground=advanceCameraFloor(ground,.38,1/60);
 near(ground,.38,.001,'Camera eventually tracks ramp height');
 assert.equal(advanceCameraFloor(0,3.15,1/60),3.15,
  'Respawn and floor changes snap camera instead of drifting through ceilings');
 assert.equal(advanceCameraFloor(0,Number.NaN,.016),0,'Invalid floor samples cannot ruin the camera');
 const ground30=Array.from({length:15}).reduce(y=>advanceCameraFloor(y,.3,1/30),0);
 const ground60=Array.from({length:30}).reduce(y=>advanceCameraFloor(y,.3,1/60),0);
 near(ground30,ground60,1e-8,'Stair camera smoothing must be frame-independent');
 const eye30=Array.from({length:15}).reduce(y=>advanceEye(y,true,1/30),1.63);
 const eye60=Array.from({length:30}).reduce(y=>advanceEye(y,true,1/60),1.63);
 near(eye30,eye60,1e-8,'Crouching must be smooth on 30 and 60 Hz');
 assert(eye30>1.03&&eye30<1.63,'Crouching interpolates in between');

 // A yaw target across ±pi must turn by ~0.04 radians, not a full 6.24.
 const look=followLook({yaw:Math.PI-.02,pitch:0},{yaw:-Math.PI+.02,pitch:.1},.016);
 assert(look.yaw>Math.PI-.02,'Camera should choose shortest turn across angular seam');
 assert(look.yaw<Math.PI+.025,'Camera must not spin almost a full revolution');
 assert(look.pitch>0&&look.pitch<.1);

 // Real stairs/doors still use the original swept navigation.  Test both
 // directions, continuous camera height and the full collider volume.
 const house=createHouse();
 for(const door of house.objects.filter(o=>o.kind==='door'&&!o.locked))setDoor(door,true);
 const state={x:STAIR.centerX,z:STAIR.zBottom+.28,y:0};
 assert(isOnStairs(state,getStairDirection,()=>false),'Approaching stairs slows Kitty');
 let visualY=state.y,crossedSlope=false,lastVisualY=visualY;
 for(let i=0;i<130;i++){
  navigate(state,house,0,-.045);
  visualY=advanceCameraFloor(visualY,state.y,1/60);
  if(state.y>.40&&state.y<HEIGHT-.40)crossedSlope=true;
  assert(Math.abs(visualY-lastVisualY)<.27,'Ascending ramp must not teleport the camera');
  assert(!blocked(house.boxes,state.x,state.y,state.z,PLAYER_RADIUS,1.64),
   'Kitty must remain outside solid walls on stairs');
  lastVisualY=visualY;
 }
 assert(crossedSlope&&state.y>HEIGHT-.08,'Kitty must climb from floor zero to upstairs');
 for(let i=0;i<130;i++)navigate(state,house,0,.045);
 assert(state.y<.10,'Reverse stair descent must reach the ground without teleport');
 assert(!isOnStairs({x:5.7,y:0,z:4},getStairDirection,()=>false),
  'Normal hallway speed unaffected by stair limiter');
 assert(isOnStairs({x:5.8,y:-1,z:12},getStairDirection,()=>true),
  'Basement shaft also uses careful stair-like locomotion');

 // The original house entry/navigation tests stay mandatory and cover door
 // sweeps, furniture, the basement and the unsupported upstairs well.
 console.log('PASS V2 phase 02: 30/60/120Hz intent, reversal, safe braking, sprint blend, crouch, camera seam, two-floor stairs and collisions');
})().catch(e=>{console.error(e);process.exitCode=1});
