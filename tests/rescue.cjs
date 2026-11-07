const assert=require('node:assert/strict');
(async()=>{
 const {START,advanceRescue,parseRescue}=await import('../src/demo/progression.js');
 const {createHousePuzzle,puzzleEvent,canOpenDrawer,canOpenBedroom,canRescue}=await import('../src/demo/house-puzzles.js');
 const unchanged=advanceRescue(START,'house');assert.equal(unchanged.house,false);
 let state=advanceRescue(START,'heart');assert.equal(state.phase,'heart');
 state=advanceRescue(state,'abduction');state=advanceRescue(state,'trail');state=advanceRescue(state,'house');
 assert.equal(state.phase,'house');assert.equal(state.rescued,false);
 state=advanceRescue(state,'rescue');assert.equal(state.phase,'end');assert(state.rescued);
 assert.equal(parseRescue('broken').phase,'garden');
 assert.equal(parseRescue(JSON.stringify({...START,heart:false,abducted:true,house:true})).house,false);
 let puzzle=createHousePuzzle();assert(!canOpenDrawer(puzzle));assert(!canOpenBedroom(puzzle));assert(!canRescue(puzzle));
 puzzle=puzzleEvent(puzzle,'drawer');assert.equal(puzzle.drawer,false,'Cannot bypass note');
 puzzle=puzzleEvent(puzzle,'note');puzzle=puzzleEvent(puzzle,'drawer');assert.equal(puzzle.drawer,true);
 puzzle=puzzleEvent(puzzle,'key');assert.equal(puzzle.key,true);assert(!canOpenBedroom(puzzle));
 puzzle=puzzleEvent(puzzle,'symbol');assert(canOpenBedroom(puzzle));puzzle=puzzleEvent(puzzle,'door');assert(canRescue(puzzle));
 puzzle=puzzleEvent(puzzle,'rescue');assert(puzzle.rescued);
 console.log('PASS: staged rescue, linked puzzles, lock requirements and corrupted-save recovery');
})().catch(e=>{console.error(e);process.exitCode=1});
