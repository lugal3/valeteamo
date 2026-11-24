// Regression: priority discovery warning, provisional RC horn/camera and falling prop noise.
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 // HouseSound imports Vite's import.meta.glob audio assets; load it through
 // the same Vite transform used by the actual game, not through bare Node ESM.
 const {createServer}=await import('vite');
 const vite=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true}});
 let HouseSound;
 try{({HouseSound}=await vite.ssrLoadModule('/src/lab/sound.js'));}
 finally{await vite.close();}
 const {createRC,beepRC,updateRC,rcCamera,RC_PROJECTION,RC_CAMERA_DISTANCE}=await import('../src/lab/rc-car.js');
 const {createHouse}=await import('../src/lab/world.js');
 const {Pursuer}=await import('../src/lab/pursuer.js');
 const {installNoiseProps,grabNoiseProp,releaseNoiseProp,stepNoiseProps}=await import('../src/lab/noise-props.js');

 // Test the real recorded cue path with a mocked browser audio graph. It must
 // be loud, central, immediate, independent of the pursuer's distance,
 // and must lower the music for the first 1.35 seconds of the chase.
 const sound=new HouseSound(),schedule=[],played=[];
 const bus=name=>({gain:{
  cancelScheduledValues(at){schedule.push({name,kind:'cancel',at});},
  setTargetAtTime(value,at,timeConstant){schedule.push({name,kind:'gain',value,at,timeConstant});}
 }});
 sound.context={state:'running',currentTime:10};
 sound.musicBus=bus('music');sound.recordedMusicBus=bus('tension');sound.recordedAmbientBus=bus('ambient');
 sound.channels={alerts:bus('alerts'),objects:bus('objects')};
 sound.recordings={buffers:new Map([['ambient',{}]]),kind:(kind,options)=>{
  played.push({kind,options});return {stop(){}};
 }};
 assert(sound.playDangerAlert(),'A confirmed sighting starts the warning');
 assert.equal(played.length,1);
 assert.equal(played[0].kind,'danger-alert');
 assert(played[0].options.gain>=2,'Dedicated warning is much louder than ordinary spatial foley');
 assert.equal(played[0].options.pan,0,'Warning stays centred even from distant floors');
 assert.equal(played[0].options.output,sound.channels.alerts);
 for(const name of ['tension','ambient']){
  assert(schedule.some(event=>event.name===name&&event.kind==='gain'&&event.value<.1),
   'Music and ambience duck promptly on discovery: '+name);
  assert(schedule.some(event=>event.name===name&&event.kind==='gain'&&event.at>11),
   'Music returns after the first impact of warning: '+name);
 }
 assert(!sound.playDangerAlert(),'Do not stack duplicate discovery alerts on the same frame');
 sound.context.currentTime=12;
 assert(sound.playDangerAlert(),'A new encounter can replay the warning');
 sound.settings.muted=true;
 sound.context.currentTime=14;
 assert(!sound.playDangerAlert(),'Respect the player's mute setting');
 sound.settings.muted=false;
 sound.context.currentTime=16;
 sound.effect('danger-alert',{x:100,y:6,z:100},{x:0,y:0,z:0,yaw:0},true);
 assert.equal(played.at(-1).kind,'danger-alert','An occluded warning must never be distance-attenuated');

 // Audible RC horn is only the player's preview; the AI still hears the
 // real RC coordinates and retains its existing eight-second decoy window.
 const world=createHouse(),rc=createRC({x:5,y:.14,z:5});
 rc.mode='driving';
 assert(beepRC(rc));assert.equal(rc.noise,8);
 assert.equal(rc.beeps,1);
 const camera=rcCamera(rc,{boxes:[]});
 assert(Math.hypot(camera.x-rc.x,camera.z-rc.z)>=2.0,
  'RC camera backs up for a larger overview of the floor');
 assert(RC_PROJECTION<=1.05&&RC_PROJECTION>=.95,'Wider projection remains usable on mobile');
 assert(RC_CAMERA_DISTANCE>=2,'RC camera distance is larger than the old 1.55 metres');
 updateRC(rc,1);
 assert.equal(rc.noise,7,'The original timed decoy behaviour remains intact');
 const pursuer=new Pursuer(world);
 pursuer.mode='search';
 pursuer.update(.05,{x:2,y:0,z:2,hidden:true},()=>{},
  {active:true,noisy:true,x:rc.x,y:rc.y,z:rc.z,crouched:true,hidden:false});
 assert.equal(pursuer.mode,'rc-chase','The RC horn genuinely distracts the kidnapper');

 // Dropping a prop, not just throwing it, emits one crash at the exact
 // impact location and makes the pursuer investigate that position.
 const props=installNoiseProps(world),glass=props[0];
 assert(grabNoiseProp(glass));
 Object.assign(glass,{x:5.8,y:1.6,z:10.7,floor:0});
 Object.assign(glass.box,{x:glass.x,y:glass.y,z:glass.z});
 assert(releaseNoiseProp(glass,{x:5.8,y:1.6,z:10.7,yaw:0,pitch:0},false));
 assert.equal(glass.flight.vx,0);assert.equal(glass.flight.vz,0);
 pursuer.mode='search';pursuer.x=11;pursuer.z=6;pursuer.y=0;
 let impacts=[];
 for(let i=0;i<100;i++)impacts.push(...stepNoiseProps([glass],.03,world,pursuer,null));
 const impact=impacts.find(cue=>cue.kind==='impact');
 assert(impact,'The fallen glass must produce an impact sound cue');
 assert(impact.level>=.9,'The impact has an audible strength');
 assert.equal(pursuer.mode,'noise-investigate','A dropped object makes the kidnapper investigate');
 assert(Math.abs(pursuer.noiseGoal.x-impact.at.x)<.001);
 assert(Math.abs(pursuer.noiseGoal.z-impact.at.z)<.001);
 assert.equal(impacts.filter(cue=>cue.kind==='impact').length,1,'Do not repeat a crash every frame');

 // The UI/engine must play the warning before door and footstep audio. The
 // RC horn follows the Q button and only widens the car's camera.
 const house=fs.readFileSync('src/lab/house.js','utf8');
 const audio=fs.readFileSync('src/lab/sound.js','utf8');
 const renderer=fs.readFileSync('src/lab/renderer.js','utf8');
 assert(house.indexOf("if(pursuitSignals.includes('spotted')){sound.playDangerAlert()")>=0);
 assert(house.indexOf("if(pursuitSignals.includes('spotted')){sound.playDangerAlert()")<
        house.indexOf("for(const door of deferredDoorSounds)"),
  'First sound in sighting is the danger cue, before doors and footsteps');
 assert(house.includes("play('rc-horn',null"),'Honk is audible through the tablet even from far away');
 assert(house.includes("play('clatter',noiseCue.at,noiseCue.level)"),
  'All impact events play the provisional falling-object noise');
 assert(renderer.includes('(motion.rcView?1.02:1.30)'),
  'Wider field of view affects RC only');
 assert(audio.includes("if(kind==='rc-horn')")&&audio.includes("if(kind==='clatter')"),
  'Generated horn and crash are bundled, without adding heavyweight audio files');
 console.log('PASS RC/danger polish: discovery-first mix, muted fallback, wider camera, decoy and drop-to-noise AI');
})().catch(error=>{console.error(error);process.exitCode=1;});
