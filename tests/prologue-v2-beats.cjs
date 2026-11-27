// V2 phase 08 — narrative phases and 3D handoff must not alter original scenes.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {PROLOGUE_ACTS,prologueAct,prologueProgress,HOUSE_HANDOFF_MS}=await import('../src/demo/prologue-beats.js');
 const {PROLOGUE_START,STAGES,advancePrologue,parsePrologue}=await import('../src/demo/prologue-story.js');
 assert.equal(PROLOGUE_ACTS.length,4);
 const covered=PROLOGUE_ACTS.flatMap(act=>act.stages);
 assert.deepEqual([...covered].sort(),[...STAGES].sort(),'each stage belongs to exactly one act');
 assert.equal(new Set(covered).size,covered.length);
 for(const stage of STAGES){
  const act=prologueAct(stage),p=prologueProgress(stage);
  assert(act.stages.includes(stage)&&p.step>0&&p.step<=p.total);
  assert(p.label&&p.title);
 }
 assert.equal(prologueAct('intro').id,'morning');
 assert.equal(prologueAct('disappearance').id,'abduction');
 assert.equal(prologueAct('ribbon').id,'dusk');
 assert.equal(prologueAct('window').id,'night');
 assert(HOUSE_HANDOFF_MS>=500&&HOUSE_HANDOFF_MS<=1000);
 let state={...PROLOGUE_START};
 for(const event of ['churu','fed','arrived','met','victory','louis','clearing','abducted','ribbon','petals','wheel','locked','enter'])
  state=advancePrologue(state,event);
 assert.equal(state.stage,'house');
 assert.equal(state.completed,true);
 assert.equal(parsePrologue(JSON.stringify(state)).stage,'house','handoff checkpoint survives reload');
 const component=fs.readFileSync('src/demo/GardenPrologue.tsx','utf8');
 const css=fs.readFileSync('src/demo/garden-prologue.css','utf8');
 assert(component.includes('<StoryGame'),'original Phaser 2D still drives the entire narrative');
 assert(component.includes('story={story}'),'original gameplay still connected');
 assert(component.includes("changed('enter');setHouseHandoff(true)"),'window event begins fade');
 assert(component.includes('window.setTimeout(onEnterHouse,HOUSE_HANDOFF_MS)'),'3D waits for curtain');
 assert(component.includes("if(reduced)onEnterHouse()"),'reduced-motion handoff is immediate');
 assert(component.includes('window.clearTimeout(timer)'),'unmount/reset cancels transition');
 assert(css.includes('.prologue-3d-handoff')&&css.includes('prefers-reduced-motion:reduce'));
 const classic=fs.readFileSync('src/iso-game.ts','utf8');
 assert(classic.includes('export class IsoAdventure extends Phaser.Scene'));
 const {dialogueGlyphs,dialogueDelay,dialogueVoice,dialogueWords}=await import('../src/demo/dialogue-feel.js');
 const {PROLOGUE_DIALOGUES}=await import('../src/demo/prologue-story.js');
 const glyphs=dialogueGlyphs('¡Hola, Kitty…!');
 assert.equal(dialogueGlyphs('e\u0301').length,1);
 assert(dialogueDelay(glyphs,6,'suspense')>dialogueDelay(glyphs,6,'calm'));
 assert(dialogueDelay(glyphs,6,'calm')>dialogueDelay(glyphs,3,'calm'));
 assert.equal(dialogueVoice(glyphs,0,'Kitty'),null);
 assert.notEqual(dialogueVoice(glyphs,1,'Kitty').frequency,dialogueVoice(glyphs,1,'Louis').frequency);
 assert.deepEqual(dialogueWords(glyphs).flat().map(g=>g.glyph),glyphs);
 assert(Object.values(PROLOGUE_DIALOGUES).flat().every(line=>line.tone));
 assert(component.includes('lettersRef.current<length')&&component.includes('event.stopPropagation();nextDialog();'));
 console.log('PASS live dialogue: graphemes, punctuation, character voices, semantic tones, stable wrapping and skip guard');
 console.log('PASS V2 phase 08: original 2D protected, act timeline complete, saved handoff and reduced-motion transition');
})().catch(e=>{console.error(e);process.exitCode=1});
