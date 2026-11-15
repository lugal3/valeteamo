const assert=require('node:assert/strict');
(async()=>{
 const story=await import('../src/demo/prologue-story.js');
 const {
  PROLOGUE_START,PROLOGUE_DIALOGUES,PROLOGUE_OBJECTIVES,PROLOGUE_SAVE_KEY,
  parsePrologue,advancePrologue,hurtPrologue,healPrologue
 }=story;
 assert(PROLOGUE_SAVE_KEY!== 'valeteamo-rescue-v2','new storyline save must not touch old rescue save');
 assert(PROLOGUE_SAVE_KEY!== 'valeteamo-story-v1','new storyline save must not overwrite earlier chapters');
 assert.equal(PROLOGUE_START.stage,'intro');
 const sequence=[
  ['begin','defend'],['victory','talk-louis'],['louis','talk-luis'],
  ['luis','walk-together'],['clearing','disappearance'],['abducted','ribbon'],
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
 assert.equal(parsePrologue(JSON.stringify(current)).stage,'house');
 assert.equal(parsePrologue('{broken').stage,'intro');
 assert.equal(parsePrologue(JSON.stringify({...PROLOGUE_START,stage:'nonsense'})).stage,'intro');
 assert.equal(parsePrologue(JSON.stringify({...PROLOGUE_START,stage:'window',clues:999})).clues,3,
  'cannot forge a nonsequential clue counter');
 assert.equal(hurtPrologue(PROLOGUE_START,3).hp,3);
 assert.equal(hurtPrologue(PROLOGUE_START,50).hp,0);
 assert.equal(healPrologue(hurtPrologue(PROLOGUE_START,5),3).hp,4);
 for(const key of ['intro','victory','luis','warning','abducted','ribbon','petals','wheel','locked','window']){
  assert(PROLOGUE_DIALOGUES[key].length>=2,key+' needs real lines of dialogue');
 }
 const voices=Object.values(PROLOGUE_DIALOGUES).flat().map(v=>v.speaker);
 assert(voices.includes('Luis')&&voices.includes('Louis')&&voices.includes('Kitty'));
 assert(PROLOGUE_DIALOGUES.luis.some(line=>line.text.includes('novio de Kitty') || line.text.includes('novio')),
  'Luis is established as the boyfriend, separate from kidnapped Louis');
 assert(PROLOGUE_DIALOGUES.warning.some(line=>line.speaker==='Louis'),
  'Louis must directly warn Kitty before being kidnapped');
 const fs=require('node:fs');
 const app=fs.readFileSync('src/StoryApp.tsx','utf8');
 const countdown=fs.readFileSync('src/BirthdayCountdown.tsx','utf8');
 const bridge=fs.readFileSync('src/demo/RescueDemo.tsx','utf8');
 assert(app.includes("setScreen('rescue')"),'heart menu should open 2D narrative prologue');
 assert(app.includes("case 'classic':"),'classic mode must remain available and untouched');
 assert(countdown.includes("initialRoute:'rescue'"),'public countdown should enter new 2D route');
 assert(bridge.includes('<GardenPrologue'),'real Phaser 2D intro integrated into 3D rescue route');
 assert(bridge.includes("setMode('house')"),'the same route enters the old 3D house');
 const phone=fs.readFileSync('src/lab/phone-content.js','utf8');
 assert(phone.includes('Mi Luis ❤️'),'the boyfriend is the person sending messages later');
 console.log('PASS: coherent Acts I–II, three clues, protected classic mode, phone bridge and 3D transition.');
})().catch(e=>{console.error(e);process.exitCode=1;});
