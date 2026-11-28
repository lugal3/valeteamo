// Render the real HouseSound graph, with real decoded assets, in Chromium.
 // Offline context avoids OS volume, audio devices, and CPU scheduling bias.
 // Reference uses the game's own instrumental tension track; no external music.
import {createServer} from 'vite';
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'artifacts/audio-output');
const profiles=process.argv[4]==='legacy'?['legacy']:['balanced','clear'];
fs.mkdirSync(out,{recursive:true});
const ff=(args,input)=>{const r=spawnSync('ffmpeg',['-hide_banner','-nostdin','-y',...args],{input,maxBuffer:32*1024*1024});if(r.status!==0)throw Error(r.stderr?.toString());return r;};
const measure=(file,seconds)=>{const r=ff(['-i',file,...(seconds?['-t',String(seconds)]:[]),'-af','loudnorm=I=-14:TP=-1:LRA=11:print_format=json','-f','null','-']);const m=r.stderr.toString().match(/\{\s*"input_i"[\s\S]*?\}/g)?.at(-1);if(!m)throw Error('No LUFS for '+file);const j=JSON.parse(m);return {lufs:Number.isFinite(+j.input_i)?+j.input_i:null,truePeak:Number.isFinite(+j.input_tp)?+j.input_tp:null};};
const refs={};for(const level of [-14,-11]){
 const file=path.join(out,'reference-'+level+'.wav');
 // Normalize with actual FFmpeg loudnorm, then independently measure achieved level.
 ff(['-stream_loop','-1','-i',path.join(root,'src/lab/audio/tension.wav'),'-t','12','-af','loudnorm=I='+level+':TP=-1:LRA=11','-ar','48000','-ac','2',file]);
 refs[level]={file,...measure(file)};
}
const vite=await createServer({root,configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});
let browser;const results=[];
try{
 await vite.listen();const url='http://127.0.0.1:'+vite.httpServer.address().port+'/';
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 await page.route(url+'__audio-benchmark',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body>Offline HouseSound benchmark</body></html>'}));
 await page.goto(url+'__audio-benchmark');
 // Load all original audio through the same production Vite imports.
 await page.evaluate(async()=>{
  const {HouseSound}=await import('/src/lab/sound.js');
  const {RecordedAudio}=await import('/src/lab/recorded-audio.js');
  const load=RecordedAudio.prototype.load;
  RecordedAudio.prototype.load=function(){return this.readyForAudit=load.call(this);};
  RecordedAudio.prototype.setMood=function(){};
  window.renderHouseCue=async({profile,kind,distance,occluded,level,seconds})=>{
   const rate=48000,ctx=new OfflineAudioContext(2,Math.ceil((seconds+.35)*rate),rate);
   // OfflineAudioContext begins suspended but accepts scheduled sources before
   // rendering. Override only the public state guard in this isolated fixture.
   Object.defineProperty(ctx,'state',{configurable:true,get:()=> 'running'});
   const Native=window.AudioContext;window.AudioContext=function(){return ctx;};
   let sound;
   try{
    localStorage.clear();sound=new HouseSound();if(profile!=='legacy')sound.set('profile',profile);
    sound.resume=async()=>true;await sound.start();
    await sound.recordings.readyForAudit;
    if(sound.recordings.errors.length)throw Error(JSON.stringify(sound.recordings.errors));
    // Keep real synth/recorded effect paths and bus graph, isolate the event
    // from background loops. No change to master/category settings.
    sound.atmosphere.bus.gain.cancelScheduledValues(0);sound.atmosphere.bus.gain.setValueAtTime(0,0);
    if(kind==='capture-reveal')sound.captureCue(kind);
    else if(kind==='danger-alert')sound.playDangerAlert();
    else sound.effect(kind,{x:0,y:1.63,z:distance},{x:0,y:1.63,z:0,yaw:0},occluded,{level});
    const buffer=await ctx.startRendering();
    const n=Math.floor(seconds*rate),data=new Float32Array(n*2);
    const left=buffer.getChannelData(0),right=buffer.getChannelData(1);
    let peak=0,energy=0,active=[];
    for(let i=0;i<n;i++){data[2*i]=left[i];data[2*i+1]=right[i];peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));}
    for(let i=0;i<n;i+=1920){let sum=0,count=0;for(let j=2*i;j<Math.min(2*(i+1920),data.length);j++){sum+=data[j]**2;count++;}active.push(Math.sqrt(sum/Math.max(1,count)));energy+=sum;}
    active=active.filter(v=>v>Math.max(.0001,peak*.01778)).sort((a,b)=>a-b);
    const db=v=>20*Math.log10(Math.max(1e-8,v)),bytes=new Uint8Array(data.buffer);
    let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return {pcm:btoa(binary),peakDb:db(peak),rmsDb:db(Math.sqrt(energy/data.length)),activeDb:db(active[Math.floor((active.length-1)*.75)]||0),recording:sound.recordings.lastPlayed,settings:sound.settings};
   }finally{window.AudioContext=Native;}
  };
 });
 const cases=[
  {id:'danger',kind:'danger-alert',distance:0,level:1,seconds:1.72},
  {id:'capture',kind:'capture-reveal',distance:0,level:1,seconds:2},
  {id:'door-near',kind:'door-open',distance:1,level:1,seconds:1},
  {id:'door-wall',kind:'door-open',distance:3,occluded:true,level:1,seconds:1},
  {id:'hunter-step',kind:'wood',distance:2,level:.9,seconds:.5},
  {id:'kitty-step',kind:'wood',distance:0,level:.55,seconds:.5},
  {id:'light',kind:'light',distance:1,level:1,seconds:.5},
  {id:'emy',kind:'cat',distance:1,level:1,seconds:.6},
  {id:'rc',kind:'rc-horn',distance:0,level:1,seconds:.65}
 ];
 for(const profile of profiles)for(const scenario of cases){
  const data=await page.evaluate(p=>window.renderHouseCue(p),{profile,...scenario});
  const {pcm,...metrics}=data,raw=Buffer.from(pcm,'base64');
  const file=path.join(out,profile+'-'+scenario.id+'.wav');
  ff(['-f','f32le','-ar','48000','-ac','2','-i','pipe:0','-c:a','pcm_f32le',file],raw);
  const result={profile,id:scenario.id,...metrics,...measure(file)};
  assert(result.peakDb>-70,scenario.id+' silent');assert(result.peakDb<=.01,scenario.id+' sample clipping');
  // Evaluate the same window of actual music in each reference. Also calculate
  // a band-limited 300–4000 Hz RMS contrast as a phone-speaker proxy.
  const bands=(input,seconds)=>{const r=ff(['-i',input,'-t',String(seconds),'-af','highpass=f=300,lowpass=f=4000,volumedetect','-f','null','-']);return Number(r.stderr.toString().match(/mean_volume:\s*(-?[\d.]+) dB/)?.[1]??NaN);};
  const band=bands(file,scenario.seconds);result.bandRmsDb=band;
  result.reference={};
  for(const level of [-14,-11]){
   const ref=refs[level],window=measure(ref.file,scenario.seconds),refBand=bands(ref.file,scenario.seconds);
   result.reference[level]={actualLUFS:ref.lufs,windowLUFS:window.lufs,lufsContrast:result.lufs!==null&&window.lufs!==null?result.lufs-window.lufs:null,bandRmsContrast:band-refBand};
  }
  results.push(result);console.log('OUTPUT_CASE '+JSON.stringify(result));
 }
}finally{await browser?.close();await vite.close();}
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({method:'Actual HouseSound OfflineAudioContext output, isolated cues vs normalized tension track; no hardware SPL or external app capture',references:refs,results},null,2));
