const assert=require('node:assert/strict');
(async()=>{
 const {START,advanceRescue,RESCUE_SAVE_KEY}=await import('../src/demo/progression.js');
 const {EPILOGUE_START,EPILOGUE_STAGES,parseEpilogue,advanceEpilogue,openEpilogueSave,hasCompletedEpilogue}=await import('../src/demo/epilogue-progress.js');
 const house=['heart','abduction','trail','house'].reduce(advanceRescue,START);
 const rescued=advanceRescue(house,'rescue');
 assert.equal(parseEpilogue(null),null);
 assert.equal(parseEpilogue('broken'),null);
 assert.equal(parseEpilogue(JSON.stringify({...house,epilogue:{version:1,stage:'complete'}})),null);
 assert.deepEqual(parseEpilogue(JSON.stringify(rescued)),EPILOGUE_START);
 assert.deepEqual(parseEpilogue(JSON.stringify({...rescued,epilogue:{version:999,stage:'complete'}})),EPILOGUE_START);
 let state={...EPILOGUE_START};
 assert.equal(advanceEpilogue(state,'complete'),state,'no skipping the epilogue');
 for(const stage of EPILOGUE_STAGES.slice(1)){state=advanceEpilogue(state,stage);assert.equal(state.stage,stage);}
 assert.equal(advanceEpilogue(state,'outside'),state,'no accidental rewind');
 const record=new Map([[RESCUE_SAVE_KEY,JSON.stringify(rescued)]]);
 const storage={getItem:k=>record.get(k)??null,setItem:(k,v)=>record.set(k,v)};
 const first=openEpilogueSave(storage),stale=openEpilogueSave(storage);
 assert(first.advance('return-path'));assert(!stale.advance('return-path'));
 assert.equal(openEpilogueSave(storage).state.stage,'return-path');
 assert(first.advance('reunion'));assert(first.advance('celebration'));assert(first.advance('complete'));
 assert.equal(JSON.parse(record.get(RESCUE_SAVE_KEY)).rescued,true);
 assert.equal(openEpilogueSave(storage).state.stage,'complete');assert(hasCompletedEpilogue(storage));
 record.delete(RESCUE_SAVE_KEY);assert.equal(hasCompletedEpilogue(storage),false);
 assert.equal(openEpilogueSave(storage),undefined);
 assert(!first.advance('outside'));
 console.log('PASS: epilogue sequential progression, rescue gate, legacy migration, reload, stale tab and reset');
})().catch(e=>{console.error(e);process.exitCode=1;});
