// Phase 10: real ending cue timeline; preserve the original finale state machine.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {ESCAPE_FINALE_CUES,collectCinematicCues}=await import('../src/lab/cinematic-cues.js');
 assert(ESCAPE_FINALE_CUES.length>=4);
 assert.deepEqual(ESCAPE_FINALE_CUES.map(c=>c.at),[...ESCAPE_FINALE_CUES].map(c=>c.at).sort((a,b)=>a-b));
 assert.equal(new Set(ESCAPE_FINALE_CUES.map(c=>c.id)).size,ESCAPE_FINALE_CUES.length);
 const allowed=new Set(['pursuer','emy','kitty',null]);
 assert(ESCAPE_FINALE_CUES.every(c=>allowed.has(c.source)&&c.caption&&c.sound&&c.at>0&&c.at<7.78));
 const play=new Set(),heard=[];
 const times=[0,.13,.29,.8,1.2,1.8,2.2,2.99,3.53,4.2,6.81,8];
 for(let i=1;i<times.length;i++)
  heard.push(...collectCinematicCues('escape',times[i-1],times[i],play));
 assert.deepEqual(heard.map(c=>c.id),ESCAPE_FINALE_CUES.map(c=>c.id));
 assert.equal(collectCinematicCues('escape',8,8,play).length,0,'no repeats while paused');
 assert.equal(collectCinematicCues('escape',8,0,play).length,0,'never rewind sound on scene reset');
 const skipped=collectCinematicCues('escape',0,10,new Set());
 assert.equal(skipped.length,ESCAPE_FINALE_CUES.length,'large frame jump must not miss events');
 const house=fs.readFileSync('src/lab/house.js','utf8');
 assert(house.includes("collectCinematicCues('escape',previousFinale,finalCutscene.elapsed,finalCutscene.cues)"));
 assert(house.includes("finalCutscene={elapsed:0,cues:new Set()"));
 assert(house.includes('caption(cue.caption)'),'subtitles respect the existing caption option');
 assert(house.includes("events.phase='safe'"),'original success gate still exists');
 assert(house.includes("poseEscapeAmbush(finalCutscene,world.emy,pursuer"),'real Emy and pursuer rigs used');
 console.log('PASS V2 phase 10: once-only spatial audio + captions, frame jumps, pause, existing finale');
})().catch(e=>{console.error(e);process.exitCode=1;});
