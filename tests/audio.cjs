// Exercise audio lifecycle using a deterministic Web Audio implementation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
let ticks=[],created=0,notes=0,cleared=[];
class AudioContextMock{
 constructor(){this.state='suspended';this.currentTime=1;created++;}
 resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
 createOscillator(){notes++;return {type:'',frequency:{value:0},connect(){},start(){},stop(){}};}
 createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
}
const code=ts.transpileModule(fs.readFileSync('src/audio.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const ctx={exports:{},window:{AudioContext:AudioContextMock,setInterval(fn){ticks.push(fn);return ticks.length;}},clearInterval:id=>cleared.push(id),Promise};vm.runInNewContext(code,ctx);
(async()=>{const sound=new ctx.exports.Sound();assert.equal(created,0);assert.equal(await sound.start(),true);assert.equal(created,1);assert.equal(ticks.length,1);ticks[0]();assert(notes>0);const n=notes;sound.muted=true;ticks[0]();assert.equal(notes,n);sound.muted=false;sound.setTheme('battle');assert.equal(sound.theme,'battle');sound.suspend();assert.equal(sound.ctx.state,'suspended');assert.equal(await sound.start(),true);assert.equal(created,1);assert.equal(ticks.length,1);sound.destroy();assert.equal(cleared.length,1);assert.equal(sound.ctx,undefined);assert.equal(await sound.start(),true);assert.equal(created,2);assert.equal(ticks.length,2);sound.destroy();console.log('PASS: audio gesture startup, mute, pause/resume, themes and cleanup.');})().catch(e=>{console.error(e);process.exitCode=1;});
