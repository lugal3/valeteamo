// V2 Phase 09: clues must follow actual checkpoint progression without bypass.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {createHousePuzzle,puzzleEvent,housePuzzleHint,canOpenBedroom,canRescue}=await import('../src/demo/house-puzzles.js');
 let p=createHousePuzzle();
 assert(!canOpenBedroom(p)&&!canRescue(p));
 assert(housePuzzleHint(p).includes('nota'));
 p=puzzleEvent(p,'note');assert(housePuzzleHint(p).includes('cajón'));
 p=puzzleEvent(p,'drawer');assert(housePuzzleHint(p).includes('llave'));
 p=puzzleEvent(p,'door');assert(!p.door,'cannot open bedroom before key');
 p=puzzleEvent(p,'key');assert(canOpenBedroom(p));
 assert(housePuzzleHint(p).includes('cerradura'));
 assert(housePuzzleHint(p,'rescue').includes('dormitorio'));
 p=puzzleEvent(p,'door');assert(canRescue(p));
 assert(housePuzzleHint(p,'rescue').includes('cuerdas'));
 p=puzzleEvent(p,'rescue');assert(!canRescue(p));
 assert(housePuzzleHint(p,'rescue').includes('liberado'));
 for(const entry of ['drawer','lock','rescue']){
  const save=createHousePuzzle(entry);
  assert.equal(typeof housePuzzleHint(save,'rescue'),'string');
 }
 const house=fs.readFileSync('src/lab/house.js','utf8');
 assert(house.includes("say(housePuzzleHint(puzzle,'bedroom'),4)"));
 assert(house.includes("say(housePuzzleHint(puzzle,'rescue'),4)"));
 console.log('PASS V2 phase 09: contextual locked-door/rescue hints, no checkpoint bypass');
})().catch(e=>{console.error(e);process.exitCode=1;});
