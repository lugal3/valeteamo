// Exercise audio lifecycle using a deterministic Web Audio implementation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
let ticks=[],created=0,notes=0,cleared=[];
class AudioContextMock{
 constructor(){this.state='suspended';this.currentTime=1;created++;}
 resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
 createOscillator(){notes++;return {type:'',frequency:{value:0,setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},start(){},stop(){}};}
 createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
}
const code=ts.transpileModule(fs.readFileSync('src/audio.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const ctx={exports:{},window:{AudioContext:AudioContextMock,setInterval(fn){ticks.push(fn);return ticks.length;}},clearInterval:id=>cleared.push(id),Promise};vm.runInNewContext(code,ctx);
const profile=ctx.exports.rescueMixFor;
const daylight=profile('intro','morning_garden',0,false);
assert.equal(daylight.mood,'garden');assert(daylight.birds);
assert(profile('meet-couple','afternoon_meeting',.1,true).music<daylight.music*.5);
const interrupted=profile('disappearance','afternoon_meeting',.3,true);
assert.equal(interrupted.music,0);assert.equal(interrupted.ambience,0);
assert(!interrupted.birds);
const forest=profile('ribbon','dusk_search',.42,false);
assert(forest.music<daylight.music&&!forest.birds);
assert.equal(profile('door','night_neighborhood',.7,false).mood,'street');
assert.equal(profile('defend','afternoon_meeting',.1,false).mood,'battle');
(async()=>{const sound=new ctx.exports.Sound();assert.equal(created,0);assert.equal(await sound.start(),true);assert.equal(created,1);assert.equal(ticks.length,1);ticks[0]();assert(notes>0);const beforeUi=notes;sound.ui();assert.equal(notes,beforeUi+2,'button feedback plays two quiet notes');const ambienceBefore=notes;assert.equal(sound.playRescueAmbience('river',-.5),true);
 assert.equal(notes,ambienceBefore+2,'ambient river is a pair of very quiet synthesis tones');
 assert.equal(sound.playRescueAmbience('birdsong',.4),false,'ambient cooldown suppresses sound spam');
 sound.ctx.currentTime+=6;
 assert.equal(sound.playRescueAmbience('birdsong',.4),true,'birds come back after cooldown');
 const n=notes;sound.muted=true;ticks[0]();sound.ui();
 assert.equal(sound.playRescueAmbience('insects'),false,'mute suppresses optional rescue world ambience');
 assert.equal(notes,n,'mute suppresses music and button feedback');sound.muted=false;sound.setTheme('battle');assert.equal(sound.theme,'battle');sound.suspend();assert.equal(sound.ctx.state,'suspended');assert.equal(await sound.start(),true);assert.equal(created,1);assert.equal(ticks.length,1);sound.destroy();assert.equal(cleared.length,1);assert.equal(sound.ctx,undefined);assert.equal(await sound.start(),true);assert.equal(created,2);assert.equal(ticks.length,2);sound.destroy();console.log('PASS: audio gesture startup, UI feedback, mute, pause/resume, themes and cleanup.');})().catch(e=>{console.error(e);process.exitCode=1;});
