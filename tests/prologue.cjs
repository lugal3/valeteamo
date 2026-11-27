const assert=require('node:assert/strict');
(async()=>{
 const story=await import('../src/demo/prologue-story.js');
 const {
  PROLOGUE_START,PROLOGUE_DIALOGUES,PROLOGUE_OBJECTIVES,PROLOGUE_SAVE_KEY,
  parsePrologue,advancePrologue,hurtPrologue,healPrologue,recordPrologueDiscovery
 }=story;
 assert(PROLOGUE_SAVE_KEY!== 'valeteamo-rescue-v2','new storyline save must not touch old rescue save');
 assert(PROLOGUE_SAVE_KEY!== 'valeteamo-story-v1','new storyline save must not overwrite earlier chapters');
 assert.equal(PROLOGUE_START.stage,'intro');
 const sequence=[
  ['churu','feed-cat'],['fed','cat-fed'],['arrived','meet-couple'],['met','defend'],
  ['victory','talk-louis'],['louis','walk-together'],['clearing','disappearance'],['abducted','ribbon'],
  ['ribbon','petals'],['petals','wheel'],['wheel','door'],
  ['locked','window'],['enter','house']
 ];
 let current={...PROLOGUE_START};
 for(const [event,expected] of sequence){
  const wrong=advancePrologue(current,'locked');
  if(current.stage!=='door')assert.deepEqual(wrong,current,'cannot skip stages by taking an arbitrary event');
  current=advancePrologue(current,event);
  assert.equal(current.stage,expected,'scene advances: '+expected);
  assert(PROLOGUE_OBJECTIVES[current.stage].length>0,'every stage has an objective');
 }
 assert.equal(current.clues,3);
 assert.equal(current.completed,true,'the window is the only route to the house');
 assert.deepEqual(parsePrologue(JSON.stringify(current)),current);
 assert.equal(current.fedGreyCat,true);
 assert.equal(current.metCouple,true);
 const visited=recordPrologueDiscovery(current,'quiet-grove');
 assert.equal(visited.stage,current.stage);
 assert.equal(visited.clues,current.clues);
 assert.equal(recordPrologueDiscovery(visited,'quiet-grove'),visited);
 assert.equal(recordPrologueDiscovery(visited,'not-a-real-place'),visited);
 assert.deepEqual(parsePrologue(JSON.stringify(visited)),visited);
 assert.deepEqual(parsePrologue(JSON.stringify({...visited,discoveries:['quiet-grove','quiet-grove','invalid']})).discoveries,['quiet-grove']);
 const old=parsePrologue(JSON.stringify({version:1,stage:'talk-louis',hp:4}));
 assert.equal(old.stage,'talk-louis','old saves keep the current checkpoint');
 assert.equal(old.fedGreyCat,false,'the migration cannot award an unfinished new event');
 assert.equal(advancePrologue(old,'louis').stage,'talk-luis','old saves can still finish the legacy meeting');
 assert.equal(parsePrologue(JSON.stringify({...PROLOGUE_START,stage:'feed-cat'})).stage,'feed-cat');
 assert.equal(parsePrologue(JSON.stringify({...PROLOGUE_START,stage:'disappearance'})).stage,
  'walk-together','an interrupted kidnapping must safely replay from the approach');
 assert.equal(parsePrologue('{broken').stage,'intro');
 assert.equal(parsePrologue(JSON.stringify({...PROLOGUE_START,stage:'nonsense'})).stage,'intro');
 assert.equal(parsePrologue(JSON.stringify({...PROLOGUE_START,stage:'window',clues:999})).clues,3,
  'cannot forge a nonsequential clue counter');
 assert.equal(hurtPrologue(PROLOGUE_START,3).hp,3);
 assert.equal(hurtPrologue(PROLOGUE_START,50).hp,0);
 assert.equal(healPrologue(hurtPrologue(PROLOGUE_START,5),3).hp,4);
 for(const key of ['couple','victory','luis','warning','abducted','ribbon','petals','wheel','locked','window']){
  assert(PROLOGUE_DIALOGUES[key].length>=1&&PROLOGUE_DIALOGUES[key].length<=2,
   key+' must remain a compact 1–2 line story beat');
 }
 const allLines=Object.values(PROLOGUE_DIALOGUES).flat();
 assert(allLines.length<=14,'short prologue, no additional mandatory dialogue scenes');
 assert(allLines.reduce((n,line)=>n+line.text.split(/\s+/).length,0)<=225,'brief script word budget');
 assert(!/3D|terror|secuestrador/i.test(PROLOGUE_OBJECTIVES.intro),'opening does not spoil genre shift');
 assert(PROLOGUE_DIALOGUES.couple.some(line=>line.speaker==='Luis'&&line.text.includes('teléfono')));
 assert(PROLOGUE_DIALOGUES.wheel.some(line=>line.text.includes('Luis')),'later phone support has an earlier narrative cause');
 const voices=allLines.map(v=>v.speaker);
 assert(voices.includes('Luis')&&voices.includes('Vale')&&voices.includes('Louis')&&voices.includes('Kitty'));
 assert.deepEqual(PROLOGUE_DIALOGUES.couple.map(line=>line.speaker),['Vale','Luis']);
 assert(PROLOGUE_DIALOGUES.warning.some(line=>line.speaker==='Louis'),
  'Louis must directly warn Kitty before being kidnapped');
 const records=new Map();
 const store={getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,v),removeItem:k=>records.delete(k)};
 const first=story.openPrologueSave(store),stale=story.openPrologueSave(store);
 assert.equal(first.save(advancePrologue(PROLOGUE_START,'churu')),true);
 assert.equal(stale.save(visited),false,'stale prologue must not replace newer stage');
 assert.equal(stale.reset(),false);
 assert.equal(first.reset(),true);
 const resumed=story.openPrologueSave(store);assert.equal(resumed.state.stage,'intro');
 assert.equal(resumed.save(visited),true);
 assert.equal(first.save(PROLOGUE_START),false,'old reset lease cannot erase another session');
 assert.equal(story.openPrologueSave({getItem(){throw Error('blocked');}}),undefined);
 const memory=story.journeyMemory(visited);
 assert(memory.fedEmy&&memory.metCouple);
 assert.deepEqual(memory.discoveries,['quiet-grove']);
 assert.match(story.journeyEcho(memory),/claro tranquilo/);
 assert.equal(story.journeyMemory(PROLOGUE_START).fedEmy,false);
 assert.deepEqual(story.journeyMemory({...visited,completed:false}).discoveries,[]);
 assert.deepEqual(story.journeyMemory({...visited,discoveries:['unknown','quiet-grove','quiet-grove']}).discoveries,['quiet-grove']);
 assert.equal(story.journeyEcho(story.journeyMemory()),'Vamos juntos. Nos están esperando.');
 const fs=require('node:fs');
 const app=fs.readFileSync('src/StoryApp.tsx','utf8');
 const countdown=fs.readFileSync('src/BirthdayCountdown.tsx','utf8');
 const bridge=fs.readFileSync('src/demo/RescueDemo.tsx','utf8');
 assert(app.includes("setScreen('rescue')"),'heart menu should open 2D narrative prologue');
 assert(app.includes("case 'classic':"),'classic mode must remain available and untouched');
 assert(countdown.includes("launchClassic?'rescue':null"),'public countdown should enter new 2D route');
 assert(countdown.includes("adminMode?'tests'"),'LP access should enter the test panel directly');
 assert(bridge.includes('<GardenPrologue'),'real Phaser 2D intro integrated into 3D rescue route');
 assert(bridge.includes("setMode('house')"),'the same route enters the old 3D house');
 const rescue2d=fs.readFileSync('src/demo/GardenPrologue.tsx','utf8');
 const arcade2d=fs.readFileSync('src/iso-game.ts','utf8');
 const host=fs.readFileSync('src/StoryGame.tsx','utf8');
 const control=fs.readFileSync('src/isometric.ts','utf8');
 assert(rescue2d.includes('<StoryGame')&&rescue2d.includes('story={story}'),
  'rescue story must be played by the same StoryGame that runs the original 2D Corazones');
 assert(!rescue2d.includes('new Engine.Game')&&!rescue2d.includes('class StoryGarden'),
  'rescue must NOT instantiate an independent Phaser engine');
 assert(host.includes("import('./iso-game')")&&host.includes('setProgress,story'),
  'the original 2D app must create one IsoAdventure with an optional story bridge');
 assert(arcade2d.includes('export class IsoAdventure extends Phaser.Scene')&&
  arcade2d.includes('if(this.story)')&&arcade2d.includes('this.drawFloor()'),
  'rescue must extend the original game class and use its actual floor');
 assert(arcade2d.includes('this.fitCamera(this.scale.width,this.scale.height)')&&
  arcade2d.includes('this.flower(u,v)')&&arcade2d.includes('this.spawnEnemy(p,false)'),
  'original camera, tile textures and combat sprites must be reused without duplication');
 assert(control.includes('screenVector')&&arcade2d.includes('screenVector(x,y)'),
  'story movement must use the unchanged Corazones projection');
 assert(bridge.includes('checkpointFor(entry)')&&!bridge.includes('class GardenScene'),
  'all 2D rescue checkpoints must use the original 2D Corazones engine');
 assert(bridge.includes('onRescue:')&&bridge.includes("setMode('house')"),
  'the 2D scenes must still connect to the original 3D house');
 const phone=fs.readFileSync('src/lab/phone-content.js','utf8');
 assert(phone.includes('Mi Luis ❤️'),'the boyfriend is the person sending messages later');
 console.log('PASS: coherent Acts I–II, three clues, protected classic mode, phone bridge and 3D transition.');
})().catch(e=>{console.error(e);process.exitCode=1;});
