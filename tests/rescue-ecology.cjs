const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const source=fs.readFileSync('src/demo/rescue-ecology.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
}}).outputText;
const context={exports:{},Math};vm.runInNewContext(js,context,{filename:'rescue-ecology.ts'});
const E=context.exports;
const maps=['morning_garden','afternoon_meeting','dusk_search','night_neighborhood'];
const ranges=[[0,22],[23,45],[46,64],[65,82]];
const counts=[];
for(let index=0;index<maps.length;index++){
 const map=maps[index],[min,max]=ranges[index];
 const center=u=>4.5+Math.sin(u*.3)*.4;
 const seeds=E.ecologySeeds(map,min,max,center);
 const again=E.ecologySeeds(map,min,max,center);
 assert.deepEqual(JSON.stringify(seeds),JSON.stringify(again),
  'all plants and animals must be seeded, no scene-reset jitter: '+map);
 assert.equal(seeds.flora.length,E.ECOLOGY_CAPS.flora);
 assert(seeds.wildlife.length>4&&seeds.wildlife.length<=E.ECOLOGY_CAPS.wildlife,
  'small finite wildlife budget on mobile '+map);
 assert(seeds.flora.every(item=>item.p.u>=min&&item.p.u<=max),
  'no decorative plants outside active chapter');
 assert(seeds.wildlife.every(item=>item.p.u>=min&&item.p.u<=max),
  'animals must exist in the right map');
 counts.push(seeds.wildlife.length);
 for(const flower of seeds.flora){
  const near=E.ecologyFloraFrame(flower,6000,flower.p),
   far=E.ecologyFloraFrame(flower,6000,{u:flower.p.u+50,v:flower.p.v+50});
  assert(Math.abs(near.lean)>Math.abs(far.lean)+.1,
   'flower bends away when Kitty approaches');
  const still=E.ecologyFloraFrame(flower,15000,flower.p,true);
  assert.equal(still.sway,0,'reduce motion removes scenery sway');
  assert.equal(still.lean,0,'reduce motion removes proximity bending');
 }
 for(const seed of seeds.wildlife){
  let state={alarm:0,heading:1};
  const idle=E.ecologyWildlifeStep(seed,state,1000,33,{u:seed.p.u+50,v:seed.p.v+50});
  state=idle.state;
  let reacted;
  for(let i=0;i<15;i++){
   reacted=E.ecologyWildlifeStep(seed,state,1100+i*33,33,seed.p);
   state=reacted.state;
  }
  assert(state.alarm>.6,'animal must react while Kitty is near '+seed.kind);
  assert(Math.abs(reacted.frame.x)>Math.abs(idle.frame.x)+2,
   'animal flees a short distance, not teleports or disappears');
  assert(Number.isFinite(reacted.frame.y)&&Number.isFinite(reacted.frame.lift));
  let previous=reacted.frame.x;
  for(let i=0;i<50;i++){
   const item=E.ecologyWildlifeStep(seed,state,1700+i*33,33,
    {u:seed.p.u+30,v:seed.p.v+30});
   assert(Math.abs(item.frame.x-previous)<12,
    'animals must return gradually without snapping even at 30 FPS');
   previous=item.frame.x;state=item.state;
  }
  assert(state.alarm<.23,'wildlife settles after Kitty has left');
  const stationary=E.ecologyWildlifeStep(seed,state,5500,33,seed.p,true);
  assert.equal(stationary.frame.wing,0,'reduced motion freezes wing-flapping');
 }
 const events=new Set();
 for(let n=1;n<12;n++){
  const evt=E.ecologyMicroEvent(map,n,min,max,center);
  assert.equal(evt.id,n);
  assert(evt.at.u>=min&&evt.at.u<=max);
  assert.deepEqual(JSON.stringify(evt),JSON.stringify(E.ecologyMicroEvent(map,n,min,max,center)),
   'environmental micro-event is deterministic');
  events.add(evt.kind);
 }
 assert(events.size>=2,'each map needs nonrepeating types of passive events');
 const cue=E.ecologyAmbientCue(map,12600,{u:min+5,v:4.5},min,max,center);
 assert(cue&&cue.scene===map);
 assert(cue.pan>=-.85&&cue.pan<=.85);
 assert.equal(E.ecologyAmbientCue(map,0,{u:min,v:0},min,max,center),null);
}
assert.deepEqual(counts,[7,7,7,6]);
const seed={id:2,p:{u:4,v:4.4},kind:'butterfly',phase:1,size:1.1};
const sample=hz=>{
 let state={alarm:0,heading:1},result;
 for(let i=0;i<hz;i++){
  result=E.ecologyWildlifeStep(seed,state,1000+(i+1)*1000/hz,
   1000/hz,seed.p);
  state=result.state;
 }
 return state.alarm;
};
assert(Math.abs(sample(30)-sample(60))<.005,
 'animal alarm response is frame-independent 30/60Hz');
assert(Math.abs(sample(60)-sample(120))<.005,
 'animal alarm response is frame-independent 60/120Hz');
assert(E.ecologyHash(3,6,7)>=0&&E.ecologyHash(3,6,7)<1);
assert(!source.includes('Math.random')&&!source.includes('setTimeout('),
 'ecosystem must not generate nondeterministic events or running timers');
assert(E.ECOLOGY_CAPS.wildlife<=8&&E.ECOLOGY_CAPS.flora<=18&&
 E.ECOLOGY_CAPS.particleMotes<=40,'mobile CPU/particle budget is finite');
const render=fs.readFileSync('src/demo/rescue-ecology-render.ts','utf8');
const world=fs.readFileSync('src/demo/rescue-overworld.ts','utf8');
const arcade=fs.readFileSync('src/iso-game.ts','utf8');
for(const token of ['ecologyWildlifeStep(item.seed','ecologyFloraFrame(item.seed',
 'ecologyMicroEvent(map','ecologyAmbientCue(map','ecologySeeds(map',
 'const dt=clamp(elapsed-previousElapsed,0,70)'])
 assert(render.includes(token),'animated Phaser renderer actually integrates '+token);
assert(render.includes("map==='night_neighborhood'")&&
 render.includes("map==='dusk_search'")&&
 render.includes("map==='afternoon_meeting'")&&
 render.includes("map==='morning_garden'"),
 'all four biomes need their own render atmosphere');
assert(world.includes('ecology=createLivingEcology(scene,map')&&
 world.includes('ecology.update(elapsed,player,night)'),
 'existing RescueOverworld must drive all graphics without a second renderer');
assert(arcade.includes('this.audio.playRescueAmbience?.('),
 'sounds are triggered by the actual story scene, not a perpetual timer');
assert(arcade.includes('if(this.story){\n   const ecologyCue='),
 'original classic Corazones must not instantiate or tick living ecology');
console.log('PASS phase 2: four deterministic living biomes, wildlife reactions/return at 30/60/120Hz, passive microevents, spatial audio cues, 8/18 creature/flora limits, reduced motion and classic protection.');
