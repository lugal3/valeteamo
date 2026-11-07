const assert=require('node:assert/strict');
(async()=>{
 const {START,advanceRescue,parseRescue}=await import('../src/demo/progression.js');
 const unchanged=advanceRescue(START,'house');assert.equal(unchanged.house,false);
 let state=advanceRescue(START,'heart');assert.equal(state.phase,'heart');
 state=advanceRescue(state,'abduction');state=advanceRescue(state,'trail');state=advanceRescue(state,'house');
 assert.equal(state.phase,'house');assert.equal(state.rescued,false);
 state=advanceRescue(state,'rescue');assert.equal(state.phase,'end');assert(state.rescued);
 assert.equal(parseRescue('broken').phase,'garden');
 assert.equal(parseRescue(JSON.stringify({...START,heart:false,abducted:true,house:true})).house,false);
 console.log('PASS: staged 2D / 3D rescue progression and corrupted-save recovery');
})().catch(e=>{console.error(e);process.exitCode=1});
