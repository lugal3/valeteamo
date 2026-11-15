const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(path){
 const source=fs.readFileSync(path,'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
 }}).outputText;
 const context={exports:{},document:{createElement(type){
  assert.equal(type,'canvas');
  const ops=[];
  const c={fillStyle:'',font:'',imageSmoothingEnabled:true,
   fillRect(...args){ops.push(['rect',...args,this.fillStyle]);},
   beginPath(){},arc(...args){ops.push(['arc',...args]);},
   fill(){ops.push(['fill',this.fillStyle]);},
   fillText(...args){ops.push(['text',...args]);}};
  return {width:0,height:0,ops,getContext:()=>c};
 }}};
 vm.runInNewContext(js,context,{filename:path});
 return context.exports;
}
const van=load('src/demo/abduction-van.ts'),night=load('src/demo/night-house-layout.ts');
const T=van.ABDUCTION_TIMING;
const expected=['arrival','doors','disembark','approach','struggle',
 'load','board','close','escape','done'];
const times=[0,T.arrival,T.doors,T.disembark,T.approach,
 T.struggle,T.load,T.board,T.close,T.escape];
assert.deepEqual(times.slice(1).every((x,i)=>x>times[i]),true,
 'each cinematic beat has a real duration');
assert(T.escape>=7000&&T.escape<10500,'scene feels cinematic yet remains quick');
assert.deepEqual(times.map(time=>van.abductionPhaseAt(time)),
 ['arrival','disembark','approach','struggle','load','board','close','escape','done','done']
 .map((x,i)=>i===0?'arrival':x).slice(0,10),
 'all phase timestamps should be stable');
// Probe the INTERIOR of every beat; boundary tests above deliberately check exact transitions.
const starts=[0,T.arrival,T.doors,T.disembark,T.approach,
 T.struggle,T.load,T.board,T.close,T.escape];
const middles=expected.slice(0,-1).map((_,i)=>(starts[i]+starts[i+1])/2);
assert.deepEqual(Array.from(middles.map(t=>van.abductionPhaseAt(t))),expected.slice(0,-1));
const origin={u:40.1,v:4.3};
const start=van.abductionFrame(0,origin),
 stop=van.abductionFrame(T.arrival+50,origin),
 reach=van.abductionFrame((T.disembark+T.approach)/2,origin),
 struggle=van.abductionFrame((T.approach+T.struggle)/2,origin),
 loading=van.abductionFrame((T.struggle+T.load)/2,origin),
 escape=van.abductionFrame((T.close+T.escape)/2,origin),
 end=van.abductionFrame(T.escape,origin);
const dist=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
assert(dist(start.van,stop.van)>1,'van MUST physically drive into frame');
assert.equal(start.captorsVisible,false,'masked captors initially INSIDE the van');
assert.equal(van.abductionFrame(T.doors+20,origin).captorsVisible,true,
 'two captors physically disembark once the sliding door opens');
assert(reach.captorsVisible&&reach.doorOpen,'masked people leave the van on foot');
assert(dist(reach.fox,reach.rabbit)>.05,'fox and rabbit walk as two distinct characters');
assert(struggle.victimVisible,'victim remains on screen while captors grab him');
assert(loading.victimBehindVan&&dist(loading.victim,start.victim)>.2,
 'hostage is led toward door rather than scaled or faded out');
assert(escape.van.u>stop.van.u+1,'vehicle accelerates and physically escapes');
assert(!end.victimVisible&&!end.captorsVisible,'everyone leaves WITH the van');
assert.equal(end.phase,'done');
assert.equal(van.VAN_PLATE,'LUNA-07');
assert.equal(van.vanTexture(true),'rescue-van-open');
assert.equal(van.vanTexture(false),'rescue-van-closed');
assert(night.nightWalkable(van.VAN_NIGHT_POSITION),
 'night clue vehicle is on reachable street terrain, not outside the map');
assert(night.nightAutoRoute(night.NIGHT_HOUSE.start,van.VAN_NIGHT_POSITION).length>0,
 'player can reach the parked van via physical pathfinding');
const closed=van.paintRescueVan(false),open=van.paintRescueVan(true);
assert(closed.width===180&&closed.height===100);
assert(open.width===180&&open.height===100);
assert.notDeepEqual(Array.from(closed.ops),Array.from(open.ops),
 'sliding door needs a visibly different open sprite');
assert(closed.ops.some(o=>o[0]==='text'&&o[1]==='LUNA-07'),
 'visible license must match the neighborhood clue');
for(const animal of ['fox','rabbit'])for(const pose of ['idle','walk','grab']){
 const frames=[0,1,2].map(i=>van.paintMaskedCaptor(animal,pose,i));
 assert(frames.every(f=>f.width===44&&f.height===68));
 if(pose!=='idle')assert(new Set(frames.map(f=>JSON.stringify(f.ops))).size>1,
  'walking/grabbing mask sprites must really animate, not duplicate one image');
}
assert.notDeepEqual(van.paintMaskedCaptor('fox','walk',1).ops,
 van.paintMaskedCaptor('rabbit','walk',1).ops,
 'animal masks need recognizably separate fox/rabbit silhouettes');
const files={
 arcade:fs.readFileSync('src/iso-game.ts','utf8'),
 world:fs.readFileSync('src/demo/rescue-overworld.ts','utf8'),
 react:fs.readFileSync('src/demo/GardenPrologue.tsx','utf8'),
 dialogue:fs.readFileSync('src/demo/prologue-story.js','utf8')
};
for(const text of ['installRescueAbductionTextures(this)','updateStoryAbduction(dt)',
 'this.storyAbduction={elapsed:0','sprite.setFlipX(frame.phase',
 'this.updateStoryLouisArrival(dt)','storyVanInspected=true','nightAutoRoute(this.p,VAN_NIGHT_POSITION)'])
 assert(files.arcade.includes(text),'original Phaser must integrate van gameplay: '+text);
assert(files.world.includes('parkedVan=scene.add.image')&&
 files.world.includes("'☾  '+VAN_PLATE"),'same van used by the night house and physical clue');
assert(files.react.includes('Pista encontrada: LUNA-07'),
 'mobile clue should not require unnecessary RPG dialogues');
assert(!files.arcade.includes("this.add.image(x+52,y,'kuromi-0')"),
 'old vanishing Kuromi placeholder must be gone');
for(const stage of ['warning','abducted','ribbon','petals','wheel','locked','window']){
 const match=files.dialogue.match(new RegExp('\\b'+stage+':\\s*\\[([\\s\\S]*?)\\n\\s*\\]'));
 assert(match,'missing dialogue '+stage);
 assert((match[1].match(/speaker:/g)||[]).length<=2,
  'story should use very few quick dialogues, user will write details later: '+stage);
}
console.log('PASS: physical van kidnapping, fox/rabbit masks, 9 timed phases, LUNA-07 night clue, real route and brief story placeholders.');
