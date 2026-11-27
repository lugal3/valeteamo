const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const source=fs.readFileSync('src/demo/rescue-game-feel.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
}}).outputText;
const context={exports:{}};vm.runInNewContext(compiled,context,{filename:'rescue-game-feel.ts'});
const F=context.exports,close=(a,b,tol=.035)=>Math.abs(a-b)<tol;
const zero={u:0,v:0},right={u:1,v:0};
assert.equal(F.RESCUE_FEEL.speed,2.1,'old max speed unchanged');
let v=zero;const record=[];
for(let i=0;i<60;i++){
 v=F.feelMotion(v,right,1,1000/60);
 record.push(v.u);
 assert(Math.hypot(v.u,v.v)<=2.10001,'velocity must be clamped at all times');
}
assert(record[0]>.20&&record[0]<.55,'pressing a key responds on the very first frame');
assert(record[5]>record[0]&&record[5]<2.1,'acceleration is gradual');
assert(close(v.u,2.1,.005),'velocity reaches full 2.1 ISO tiles/s');
let negative=F.feelMotion(v,{u:-1,v:0},1,1000/60);
assert(negative.u<v.u,'turning around decelerates the old momentum right away');
for(let i=0;i<18;i++)negative=F.feelMotion(negative,{u:-1,v:0},1,1000/60);
assert(negative.u< -1,'reverse steering must be quick enough for narrow lanes');
const analog=F.feelMotion(zero,right,.3,200);
assert(analog.u>0&&analog.u<1,'weak mobile joystick moves slower than full tilt');
v=F.feelMotion(zero,right,1,500);
for(let i=0;i<40;i++)v=F.feelMotion(v,zero,0,1000/60);
assert(Math.hypot(v.u,v.v)<.02,'letting go eventually reaches total rest');
const integrate=hz=>{
 let value=zero,p=0;
 for(let i=0;i<hz;i++){
  value=F.feelMotion(value,right,1,1000/hz);
  p+=value.u/hz;
 }
 return {v:value.u,p};
};
const at30=integrate(30),at60=integrate(60),at120=integrate(120);
assert(close(at30.v,at60.v,.005)&&close(at60.v,at120.v,.005),
 'acceleration is frame-rate independent at 30/60/120 fps');
assert(Math.abs(at30.p-at60.p)<.04&&Math.abs(at60.p-at120.p)<.02,
 'travel after one second must be nearly identical on slow and fast devices');
const gait=F.feelGait({u:1.8,v:0},250,1000);
assert(gait.walking&&gait.frame>=1&&gait.frame<=4);
assert(gait.footLift>=0&&gait.footLift<=2.2);
const blink=F.feelGait(zero,0,3790);
assert.equal(blink.frame,5,'Kitty closes eyes periodically in idle');
assert.equal(F.feelGait(zero,0,2500).frame,0);
const reduced=F.feelGait({u:2,v:0},250,1000,true);
assert.equal(reduced.footLift,0);assert.equal(reduced.lean,0);
assert.equal(reduced.squash,0);
let camera={x:0,y:0};for(let i=0;i<120;i++)
 camera=F.feelCameraOffset(camera,{u:2.1,v:0},1000/60);
assert(camera.x>0&&camera.x<=F.RESCUE_FEEL.cameraMaxX);
assert(camera.y>0&&camera.y<=F.RESCUE_FEEL.cameraMaxY);
assert.deepEqual({...F.feelCameraOffset(camera,zero,20,true)},{x:0,y:0},
 'reduce motion disables camera anticipation');
for(const facing of ['right','left','down','up']){
 const coords={right:[12,0],left:[-12,0],down:[0,10],up:[0,-10]}[facing];
 assert.equal(F.feelFacingToTarget(...coords,'down'),facing,'Kitty turns toward interactable '+facing);
}
assert.equal(F.feelInteraction(360,150),210);
assert.equal(F.feelInteraction(50,100),0);
for(const [map,p,ground] of [
 ['morning_garden',{u:12,v:4.5},'wood'],
 ['morning_garden',{u:4,v:4.8},'dirt'],
 ['morning_garden',{u:4,v:6.4},'grass'],
 ['afternoon_meeting',{u:34,v:4.3},'grass'],
 ['dusk_search',{u:53,v:5.1},'dirt'],
 ['night_neighborhood',{u:68,v:5.0},'asphalt'],
 ['night_neighborhood',{u:73,v:6.5},'stone'],
 ['night_neighborhood',{u:79,v:10.1},'stone']
])assert.equal(F.feelSurfaceAt(map,p),ground,ground+' step for '+map);
for(const kind of ['grass','wood','stone','dirt','asphalt'])
 assert(F.FEEL_FOOTSTEP[kind].volume<.01,'footsteps stay subtle and non-fatiguing');
const follow=F.feelCompanion({x:0,y:0},{x:50,y:0},40);
assert(follow.walking&&follow.position.x>0&&follow.position.x<=6.401,
 'Louis follows with an upper speed bound and walking animation');
assert.equal(F.feelCompanion({x:45,y:0},{x:50,y:0},40).walking,false,
 'Louis must stop walking when already in comfortable distance');
const hold=F.feelCompanion({x:45,y:0},{x:50,y:0},40);
assert.equal(hold.position.x,45,'NPC must not slide when Kitty is stationary');
const still=F.feelCompanion({x:0,y:0},{x:90,y:0},33,true);
assert(still.position.x>0&&!still.walking,'reduce motion keeps positions correct but disables gait');
// Starting combat late in the story still grants the full warning interval.
for(const clock of [0,3000,120000]){
 const due=[0,1,2].map(i=>F.rescueFirstAttack(clock,i));
 assert(due[0]-clock>=1300&&due[2]-due[1]>=500);
 assert.equal(F.rescueAttackWarning(clock,due[0]),0);
 assert(F.rescueAttackWarning(due[0]-325,due[0])>.45);
 assert.equal(F.rescueAttackWarning(due[0],due[0]),1);
}
const original=fs.readFileSync('src/iso-game.ts','utf8').replace(/\r\n/g,'\n');
const story=fs.readFileSync('src/demo/GardenPrologue.tsx','utf8');
for(const key of ['feelMotion(this.storyVelocity','this.storyFootfall(traveled)',
 'updateStoryCameraFeel(dt)','renderStoryKitty(dt','stepRescueFollower(current,this.p,this.storyFollowTrail,dt,this.storyMap)',
 'RESCUE_FEEL.interactMs','if(this.story){\n   // Kinetic movement']){
 assert(original.includes(key),'rescue must integrate actual story game feel: '+key);
}
assert(original.includes('this.storyFollowTrail=state.trail')&&original.includes('const xy=toScreen(state.position)')&&original.includes('npc.setPosition(xy.x,xy.y)'),'actual NPC consumes the collision-aware world trajectory; full path behavior covered in rescue-world.cjs');
assert(original.includes('next:this.story?rescueFirstAttack(this.clock,this.enemies.length):1500+this.enemies.length*500'),'story timing relative to spawn and classic timing untouched');
assert(original.includes('constrainRescue(proposed,this.storyMap,e.p)'),'story shadows cannot cut through furniture');
assert(original.includes('this.storyPracticeDone=true')&&original.includes('this.storyPractice=undefined'),'optional heart practice reacts without advancing a story stage');
assert(original.includes('else {\n   const frame=moving?1+Math.floor(this.moveClock/115)%4'),
 'classic Corazones animation branch must retain original animation expressions');
assert(original.includes("camera.setZoom(Math.min(width/800,height/450)*1.08)"),
 'do not alter original camera zoom formula');
assert(story.includes("onClick={()=>sceneRef.current?.storyInteract()}"),
 'physical input remains connected to existing touch interaction');
console.log('PASS rescue game feel: responsive physics at 30/60/120 FPS, idle/blink, capped camera, material footsteps, bounded partner and protected classic Corazones.');
