const assert=require('node:assert/strict');
module.exports=async()=>{
 const {FloorSounds,CREAK_ZONES,floorSurface}=await import('../src/lab/floor-sounds.js');
 const {createHouse,blocked,HEIGHT}=await import('../src/lab/world.js');
 const world=createHouse();for(const z of CREAK_ZONES)assert(!blocked(world.boxes,z.x,z.y,z.z,.16,1.64),'Accessible sound zone '+z.id);
 const f=new FloorSounds(),p={x:5.9,y:0,z:8.8};
 assert.equal(f.advance(1,p,0).length,0,'Standing cannot generate steps or pressure sounds');
 assert(f.advance(.1,p,.2).some(c=>c.kind==='floor-groan'));assert(!f.advance(1,p,.3).some(c=>c.kind==='floor-groan'),'No loop while inside');
 f.advance(.1,{...p,z:10},.3);assert(!f.advance(.1,p,.3).some(c=>c.kind==='floor-groan'),'Cooldown on re-entry');
 f.advance(15,{...p,z:10},0);f.advance(.1,{...p,z:10},.1);assert(f.advance(.1,p,.1).some(c=>c.kind==='floor-groan'));
 f.reset();assert(!f.advance(.1,{...p,y:HEIGHT},.1).some(c=>c.kind==='floor-groan'),'Floors isolated');
 assert.equal(floorSurface({x:12,y:1,z:8}),'stair');assert.equal(floorSurface({x:8,y:0,z:2}),'tile');
 assert(f.advance(.1,{x:12,y:1,z:8},.4).some(c=>c.kind==='stair'));assert.equal(f.steps,1);
 const {DEFAULT_HUD,normalizeHUD,hudRect,readHUD,writeHUD}=await import('../src/lab/hud-layout.js');
 const {CAMERA_SETTINGS_KEY,writeCameraSettings,readCameraSettings}=await import('../src/lab/camera-controls.js');
 for(const [w,h]of [[844,390],[960,540],[1280,720]])for(const anchor of ['left','right','top','bottom'])for(const size of [40,52,64])for(const x of [-180,180]){const r=hudRect({anchor,size,x,y:120},w,h);assert(r.x>=8&&r.y>=60&&r.x+r.w<=w-8&&r.y+r.h<=h-8,'HUD remains on screen');}
 assert.deepEqual(normalizeHUD(null),DEFAULT_HUD);assert.deepEqual(readHUD({getItem:()=>'{bad'}),DEFAULT_HUD);
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};writeCameraSettings(storage,{sensitivity:1.2,invertX:true});writeHUD(storage,{anchor:'bottom',size:52});writeCameraSettings(storage,{sensitivity:1.8,invertX:false});assert.equal(readHUD(storage).anchor,'bottom');assert.equal(readCameraSettings(storage).sensitivity,1.8);assert.deepEqual([...map.keys()],[CAMERA_SETTINGS_KEY],'No new save key');
 const {CharacterAnimator}=await import('../src/lab/animator.js'),{EMOTES,sampleEmote}=await import('../src/lab/animations/emotes.js'),{createPose,evaluateRig,createRigBinding,skinCharacter}=await import('../src/lab/character-rig.js');
 const {geometry}=await import('../src/lab/renderer.js'),{characterPieces}=await import('../src/lab/character-model.js'),mesh=geometry(characterPieces('empty')),binding=createRigBinding(mesh.groups),out=new Float32Array(mesh.vertices.length);
 for(const e of EMOTES){assert([...sampleEmote(e.id,0,createPose())].every(v=>v===0));assert([...sampleEmote(e.id,e.duration,createPose())].every(v=>v===0));for(const t of [.2,.8,1.4]){const pose=sampleEmote(e.id,t,createPose());evaluateRig(binding,pose);skinCharacter(mesh.vertices,out,binding);assert(out.every(Number.isFinite));for(let i=0;i<out.length;i+=16)assert(Math.abs(Math.hypot(...out.slice(i+6,i+9))-1)<1e-5);}}
 const a=new CharacterAnimator();assert(a.startEmote('gangnam'));a.advance(.1);const time=a.emoteTime;a.advance(.1,{paused:true});assert.equal(a.emoteTime,time);a.advance(.1,{distance:.1});assert.equal(a.emote,null);a.startEmote('six-seven');for(let i=0;i<40;i++)a.advance(.1);assert.equal(a.emote,null);
 assert.deepEqual(sampleEmote('six-seven',.8,createPose(),{reduced:true}),sampleEmote('six-seven',1.2,createPose(),{reduced:true}));
 console.log('PASS sensations: sound-zone hysteresis/cooldown/floors, stair steps, HUD bounds/storage isolation, finite emote meshes, pause/cancel/reduced motion');
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1;});
