const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const source=fs.readFileSync('src/demo/rescue-performance.ts','utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const ctx={exports:{}};vm.runInNewContext(code,ctx,{filename:'rescue-performance.ts'});
const P=ctx.exports;
const stages={
 'talk-louis':['uneasy',1230],'talk-luis':['affection',1800],
 'walk-together':['affection',2840],ribbon:['discover',480],
 petals:['discover',600],wheel:['uneasy',760],door:['uneasy',550],
 window:['discover',400]
};
for(const [stage,[emotion,t]] of Object.entries(stages)){
 assert.equal(P.storyboardBeat(stage,t),emotion,'one short acting cue for '+stage);
 assert.equal(P.storyboardBeat(stage,-1),null,'invalid time never triggers cues');
}
assert.equal(P.storyboardBeat('intro',400),null,'no intrusive tutorial dialogue');
assert.equal(P.storyboardBeat('defend',1000),null,'combat is unblocked');
for(const kind of ['notice','affection','uneasy','fear','discover','farewell']){
 const bubble=P.storyBubble(kind);
 assert(typeof bubble.text==='string'&&bubble.text.length<=2,'single emotive glyphs, not blocking conversations');
 assert(bubble.life>=900&&bubble.life<=1600,'glyph vanishes quickly');
 assert(/^#[0-9a-f]{6}$/.test(bubble.color));
}
assert(P.ACTING_LIMITS.maxBubbles<=3,'no speech bubble floods on phones');
assert(P.ACTING_LIMITS.focusMaxX<=85&&P.ACTING_LIMITS.focusMaxY<=45,
 'cinematic focus cannot hide Kitty or game route');
assert.equal(P.kidnappingReaction('doors','arrival'),'notice');
assert.equal(P.kidnappingReaction('struggle','approach'),'fear');
assert.equal(P.kidnappingReaction('load','struggle'),'fear');
assert.equal(P.kidnappingReaction('escape','close'),'uneasy');
assert.equal(P.kidnappingReaction('escape','escape'),null,'no repeated effects each frame');
const from={x:40,y:45},to={x:110,y:95};
const timeline=['arrival','doors','disembark','approach','struggle','load','board','close','escape'];
const offsets=timeline.map((phase,i)=>P.kidnappingFrameFocus('disappearance',phase,1900+i*500,from,to));
assert(offsets.every(o=>Number.isFinite(o.x)&&Number.isFinite(o.y) &&
 Math.abs(o.x)<=P.ACTING_LIMITS.focusMaxX&&Math.abs(o.y)<=P.ACTING_LIMITS.focusMaxY),
 'focus stays within strict bounds throughout capture');
assert(offsets[5].x>offsets[0].x,'frame expands focus during loading');
assert.deepEqual({...P.kidnappingFrameFocus('ribbon','struggle',5000,from,to)},{x:0,y:0},
 'no forced camera pans outside cinematic');
assert.deepEqual({...P.kidnappingFrameFocus('disappearance','load',5000,from,to,true)},{x:0,y:0},
 'reduce motion disables cinematic pan');
const converge=(hz)=>{
 let value={x:0,y:0};
 for(let i=0;i<hz;i++)value=P.smoothCinematicFocus(value,{x:75,y:40},1000/hz);
 return value;
};
const c30=converge(30),c60=converge(60),c120=converge(120);
assert(Math.abs(c30.x-c60.x)<.1&&Math.abs(c60.x-c120.x)<.1,
 'camera framing must be frame-independent at 30/60/120');
let release={x:70,y:40};
for(let i=0;i<160;i++)release=P.smoothCinematicFocus(release,{x:0,y:0},1000/60,true);
assert(Math.hypot(release.x,release.y)<.1,'cinematic camera returns to natural following');
for(const [dx,dy,name] of [[50,2,'right'],[-50,2,'left'],[1,-50,'up'],[1,50,'down']]){
 assert.equal(P.storyActorFacing(dx,dy),name,'characters actually face Kitty');
}
assert.equal(P.storyActorFacing(0,1,'left'),'left','no sudden orientation pop while idle');
const idle=P.storyActorIdle(1500);
assert.equal(idle.frame,0);assert(Math.abs(idle.lean)<1);
const blink=P.storyActorIdle(P.ACTING_LIMITS.blinkPeriodMs-75);
assert.equal(blink.frame,5,'Louis periodically blinks when standing still');
assert.deepEqual({...P.storyActorIdle(1200,true)},{frame:0,lean:0,breath:0},
 'reduce-motion NPC breathing and flutter are disabled');
const scene=fs.readFileSync('src/iso-game.ts','utf8');
for(const part of ['this.updateStoryPerformance(dt)','kidnappingReaction(frame.phase,prior)',
 'this.showStoryBubble(\'luis\',\'farewell\')',
 'storyActorIdle(this.clock,this.reducedMotion)','this.storyDramaOffset=smoothCinematicFocus',
 'this.showStoryBubble(\'target\',stage===\'door\'',
 'this.clearStoryBubbles()']){
 assert(scene.includes(part),'real Phaser story scene integrates: '+part);
}
assert(scene.includes("if(this.story){\n   this.updateStoryPerformance(dt)"),
 'never execute story cinematics in the original classic Corazones');
const story=fs.readFileSync('src/demo/prologue-story.js','utf8');
assert(!/dialogues\s*=\s*\[/.test(source),
 'animations must not invent RPG dialogue');
assert(story.includes("speaker:'Luis'")&&story.includes("speaker:'Louis'"),
 'Luis and Louis must remain two distinct actors');
console.log('PASS: short expressive cues, NPC-facing and blink, deterministic 30/60/120 camera limits, smooth post-capture release and story-only integration.');
