const assert=require('node:assert/strict');
const near=(a,b,msg,tol=1e-9)=>assert(Math.abs(a-b)<tol,`${msg}: ${a} vs ${b}`);
(async()=>{
 const {applyLookDelta,followLook,MAX_PITCH,readCameraSettings,writeCameraSettings,
        DEFAULT_CAMERA_SETTINGS,SENSITIVITY_MIN,SENSITIVITY_MAX,SENSITIVITY_STEP,
        CAMERA_SETTINGS_KEY}=await import('../src/lab/camera-controls.js');

 // ── 1. Default value is 1.05 ────────────────────────────────────────────────
 assert.equal(DEFAULT_CAMERA_SETTINGS.sensitivity,1.05,'Default sensitivity must be 1.05');
 assert.equal(DEFAULT_CAMERA_SETTINGS.invertX,false,'Default invertX must be false');

 // ── 2. Clamp constants match applyLookDelta usage ───────────────────────────
 assert.equal(SENSITIVITY_MIN,0.35,'SENSITIVITY_MIN');
 assert.equal(SENSITIVITY_MAX,2.2, 'SENSITIVITY_MAX');
 assert.equal(SENSITIVITY_STEP,0.05,'SENSITIVITY_STEP');

 // ── 3. applyLookDelta: sign and invert ────────────────────────────────────
 const origin={yaw:1,pitch:0};
 assert(applyLookDelta(origin,80,0,1,false).yaw>origin.yaw,'Drag right must turn right');
 assert(applyLookDelta(origin,80,0,1,true).yaw<origin.yaw,'Invert must reverse horizontal');

 // ── 4. Pitch clamp ───────────────────────────────────────────────────────────
 let down={...origin},up={...origin};
 for(let i=0;i<10;i++){down=applyLookDelta(down,0,100);up=applyLookDelta(up,0,-100);}
 assert.equal(down.pitch,-MAX_PITCH,'Downward swipes clamp to floor');
 assert.equal(up.pitch,MAX_PITCH,  'Upward swipes clamp to ceiling');

 // ── 5. ±160 px input clamp is unchanged ─────────────────────────────────────
 // 300 px drag must produce same rotation as 160 px (clamped)
 const r160=applyLookDelta(origin,160,0,1).yaw-origin.yaw;
 const r300=applyLookDelta(origin,300,0,1).yaw-origin.yaw;
 near(r160,r300,'±160 px clamp: 300 px must equal 160 px');

 // ── 6. +28 % rotation at new default vs old default ────────────────────────
 // 300 px @ old=0.82 → clamped to 160 px; same for 300 px @ new=1.05.
 // Use 100 px (within clamp) so the ratio shows cleanly.
 const oldDelta=applyLookDelta(origin,100,0,0.82).yaw-origin.yaw;
 const newDelta=applyLookDelta(origin,100,0,1.05).yaw-origin.yaw;
 const ratio=newDelta/oldDelta;
 near(ratio,1.05/0.82,'New default gives ~28% more rotation than old',1e-6);

 // ── 7. followLook: frame-rate independent ───────────────────────────────────
 const target=applyLookDelta(origin,70,-35,.8);
 let at30={...origin},at60={...origin};
 for(let i=0;i<30;i++)at30=followLook(at30,target,1/30);
 for(let i=0;i<60;i++)at60=followLook(at60,target,1/60);
 assert(Math.abs(at30.yaw  -at60.yaw  )<1e-8,'Frame-rate independent yaw');
 assert(Math.abs(at30.pitch-at60.pitch)<1e-8,'Frame-rate independent pitch');
 const stable=followLook(target,target,1/30);assert.deepEqual(stable,target,'No drift after pointer release');

 // ── 8. readCameraSettings / writeCameraSettings: custom value preserved ─────
 const m=new Map(),store={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};
 assert(writeCameraSettings(store,{sensitivity:1.25,invertX:true}));
 assert.deepEqual(readCameraSettings(store),{sensitivity:1.25,invertX:true});

 // ── 9. Corrupted JSON → factory default ─────────────────────────────────────
 assert.deepEqual(readCameraSettings({getItem:()=>'{bad'}),
   {sensitivity:DEFAULT_CAMERA_SETTINGS.sensitivity,invertX:false},
   'Corrupted JSON returns new default 1.05');

 // ── 10. Migration: v3 key with OLD default (0.82) → treated as "never customised" ─
 const v3store={getItem:k=>{
   if(k==='valeteamo-house-camera-v3')return JSON.stringify({sensitivity:0.82,invertX:false});
   return null;
  },setItem:()=>{}};
 const migrated=readCameraSettings(v3store);
 assert.equal(migrated.sensitivity,DEFAULT_CAMERA_SETTINGS.sensitivity,
   'v3 with old default 0.82 migrates to new default 1.05');
 assert.equal(migrated.invertX,false,'invertX preserved as false in migration');

 // ── 11. Migration: v3 key with CUSTOM value → custom value preserved ─────────
 const v3custom={getItem:k=>{
   if(k==='valeteamo-house-camera-v3')return JSON.stringify({sensitivity:1.40,invertX:true});
   return null;
  },setItem:()=>{}};
 const customMigrated=readCameraSettings(v3custom);
 assert.equal(customMigrated.sensitivity,1.40,'Custom v3 sensitivity is preserved');
 assert.equal(customMigrated.invertX,true,'Custom v3 invertX:true is preserved');

 // ── 12. Migration: v3 key absent → factory default ───────────────────────────
 const emptyStore={getItem:()=>null,setItem:()=>{}};
 assert.deepEqual(readCameraSettings(emptyStore),
   {sensitivity:DEFAULT_CAMERA_SETTINGS.sensitivity,invertX:false},
   'Empty storage returns new default');

 // ── 13. v4 key takes priority over v3 ────────────────────────────────────────
 const bothKeys={getItem:k=>{
   if(k==='valeteamo-house-camera-v4')return JSON.stringify({sensitivity:1.60,invertX:false});
   if(k==='valeteamo-house-camera-v3')return JSON.stringify({sensitivity:0.82,invertX:true});
   return null;
  },setItem:()=>{}};
 const v4wins=readCameraSettings(bothKeys);
 assert.equal(v4wins.sensitivity,1.60,'v4 key wins over v3');
 assert.equal(v4wins.invertX,false,'v4 invertX takes priority');

 // ── 14. writeCameraSettings clamps to [SENSITIVITY_MIN, SENSITIVITY_MAX] ─────
 const clampStore={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};
 writeCameraSettings(clampStore,{sensitivity:5,invertX:false});
 assert.equal(readCameraSettings(clampStore).sensitivity,SENSITIVITY_MAX,'Write clamps to max 2.2');
 writeCameraSettings(clampStore,{sensitivity:0,invertX:false});
 assert.equal(readCameraSettings(clampStore).sensitivity,SENSITIVITY_MIN,'Write clamps to min 0.35');

 console.log('PASS camera v4: default 1.05, migration v3→v4, clamp ±160 px, +28% rotation, frame-rate independent, custom values preserved, invertX');
})().catch(e=>{console.error(e);process.exitCode=1});
