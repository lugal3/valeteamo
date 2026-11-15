const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const source=fs.readFileSync('src/demo/luis-choreography.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const context={exports:{}};
vm.runInNewContext(js,context,{filename:'luis-choreography.ts'});
const {
 LUIS_BEATS,makeLuisMotion,luisEntryPoint,luisExitPoint,luisPointOnPath,luisMotionIsBlocking
}=context.exports;
const meeting={u:34.6,v:4.4},distance=(p,q)=>Math.hypot(p.u-q.u,p.v-q.v);
const origin=luisEntryPoint(meeting),exit=luisExitPoint(meeting);
assert(distance(origin,meeting)>3,'Luis visibly walks in from a separate area, not from Kitty');
assert(distance(exit,meeting)>3.4,'Luis truly walks off to the sendero before disappearing');
assert(exit.u<meeting.u,'farewell walks back toward the path, not into the next 2D map');
assert(LUIS_BEATS.approachRadius>=3.4);
assert(LUIS_BEATS.arriveMs>=1200&&LUIS_BEATS.arriveMs<=2500);
assert(LUIS_BEATS.leaveMs>=1200&&LUIS_BEATS.leaveMs<=2400);
assert(LUIS_BEATS.greetMs>=400&&LUIS_BEATS.farewellWaveMs>=400);
for(const kind of ['arriving','greeting','farewell-wave','farewell-walk']){
 const motion=makeLuisMotion(kind,meeting,()=>{});
 assert.equal(motion.kind,kind);
 assert.equal(motion.elapsed,0);
 assert(luisMotionIsBlocking(motion));
 const first=luisPointOnPath(motion);
 assert(distance(first,motion.from)<.001,'movement starts at the same actor position');
 motion.elapsed=motion.duration*.25;const a=luisPointOnPath(motion);
 motion.elapsed=motion.duration*.50;const mid=luisPointOnPath(motion);
 motion.elapsed=motion.duration*.75;const b=luisPointOnPath(motion);
 motion.elapsed=motion.duration;const last=luisPointOnPath(motion);
 assert(distance(last,motion.to)<.001,'end of shot arrives at actual interaction/exit point');
 if(kind==='arriving'||kind==='farewell-walk'){
  const d=distance(motion.from,motion.to);
  assert(distance(first,a)<distance(first,mid));
  assert(distance(first,mid)<distance(first,b));
  assert(distance(first,b)<d);
  // Curved three-anchor path rather than a robotic perfectly straight line.
  const curve=(mid.v-first.v)*(last.u-first.u)-(last.v-first.v)*(mid.u-first.u);
  assert(Math.abs(curve)>.13,'walking follows a discernible curved route');
 }else{
  assert(distance(first,mid)<.001,'greeting/wave pose stays grounded, no teleport');
 }
}
assert.equal(luisMotionIsBlocking(undefined),false);
const scene=fs.readFileSync('src/iso-game.ts','utf8'),react=fs.readFileSync('src/demo/GardenPrologue.tsx','utf8');
for(const needle of [
 "this.storyLuisMotion=makeLuisMotion('arriving'",
 "this.storyLuisMotion=makeLuisMotion('greeting'",
 "this.storyLuisMotion=makeLuisMotion('farewell-wave'",
 "this.storyLuisMotion=makeLuisMotion('farewell-walk'",
 "this.storyLuisReady=true",
 "this.story.near('');this.storyNear=''",
 "this.updateLuisCinematic(dt)",
 "luisMotionIsBlocking(this.storyLuisMotion)",
 "this.storyLuisShadow?.setPosition",
 "npc.setVisible(false)"
])assert(scene.includes(needle),'real original Phaser scene must implement: '+needle);
assert(react.includes("scene.playStoryLuisFarewell(()=>changed('luis'))"),
 'story cannot instantly delete Luis when dialogue closes');
assert(react.includes("luisBeat:()=>scene.storyLuisMotion?.kind"),
 'browser tests can verify actual arrival/departure');
assert(!source.includes('setTimeout')&&!source.includes('new Phaser.Game'),
 'motion must run in existing frame loop and original engine');
console.log('PASS: Luis walks into scene on a curved route, greets, blocks controls, waves and departs before the RPG stage changes.');
