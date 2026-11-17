const assert=require('node:assert/strict');
(async()=>{
 const {START,RESCUE_SAVE_KEY,advanceRescue,parseRescue,openRescueHouseSave}=await import('../src/demo/progression.js');
 const {createHousePuzzle,puzzleEvent,canOpenDrawer,canOpenBedroom,canRescue}=await import('../src/demo/house-puzzles.js');
 const unchanged=advanceRescue(START,'house');assert.equal(unchanged.house,false);
 let state=advanceRescue(START,'heart');assert.equal(state.phase,'heart');
 state=advanceRescue(state,'abduction');state=advanceRescue(state,'trail');state=advanceRescue(state,'house');
 assert.equal(state.phase,'house');assert.equal(state.rescued,false);
 for(const event of ['heart','abduction','trail','house'])assert.deepEqual(advanceRescue(state,event),state);
 const legacy=state;
 state=advanceRescue(state,'rescue');assert.equal(state.phase,'end');assert(state.rescued);
 for(const event of ['heart','abduction','trail','house','rescue'])assert.deepEqual(advanceRescue(state,event),state);
 assert.equal(parseRescue('broken').phase,'garden');
 assert.equal(parseRescue(JSON.stringify({...START,heart:false,abducted:true,house:true})).house,false);
 const storage=new Map([[RESCUE_SAVE_KEY,JSON.stringify(legacy)]]);
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
  getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)
 }});
 const current=openRescueHouseSave(),stale=openRescueHouseSave(),checkpoint={version:1,stage:'explore',picked:['key']};
 assert.equal(current.checkpoint,undefined,'A legacy house save has no interior checkpoint');
 current.save(checkpoint);
 assert.deepEqual(openRescueHouseSave().checkpoint,checkpoint);
 stale.save(null);stale.finish();
 assert.deepEqual(openRescueHouseSave().checkpoint,checkpoint,'A stale tab cannot erase or finish a newer save');
 current.save(null);
 assert.deepEqual(JSON.parse(storage.get(RESCUE_SAVE_KEY)),legacy);
 current.finish();current.save(checkpoint);
 assert.deepEqual(JSON.parse(storage.get(RESCUE_SAVE_KEY)),state,'Finishing drops the interior checkpoint');
 delete globalThis.localStorage;
 let puzzle=createHousePuzzle();assert(!canOpenDrawer(puzzle));assert(!canOpenBedroom(puzzle));assert(!canRescue(puzzle));
 puzzle=puzzleEvent(puzzle,'drawer');assert.equal(puzzle.drawer,false,'Cannot bypass note');
 puzzle=puzzleEvent(puzzle,'note');puzzle=puzzleEvent(puzzle,'drawer');assert.equal(puzzle.drawer,true);
 puzzle=puzzleEvent(puzzle,'key');assert.equal(puzzle.key,true);assert(!canOpenBedroom(puzzle));
 puzzle=puzzleEvent(puzzle,'symbol');assert(canOpenBedroom(puzzle));puzzle=puzzleEvent(puzzle,'door');assert(canRescue(puzzle));
 puzzle=puzzleEvent(puzzle,'rescue');assert(puzzle.rescued);
 console.log('PASS: staged rescue, linked puzzles, lock requirements and corrupted-save recovery');
})().catch(e=>{console.error(e);process.exitCode=1});
