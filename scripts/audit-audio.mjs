// Full asset inventory; FFmpeg calculates true peak and integrated LUFS.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {USER_AUDIO_SPRITE} from '../src/lab/audio/user-sprite-index.js';
import {measurePCM,calibrationGain} from '../src/lab/audio-mastering.js';
const output=process.argv[2]||'artifacts/audio-mastering.json';
const walk=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]):[];
const assets=[...walk('src'),...walk('public')].filter(p=>/\.(wav|ogg|mp3|flac|m4a|opus|aac|webm)$/i.test(p));
const source=assets.map(file=>({id:path.basename(file,path.extname(file)),file}));
for(const codec of ['ogg','mp3'])for(const [id,clip] of Object.entries(USER_AUDIO_SPRITE))source.push({id,file:'src/lab/audio/user-sprite.'+codec,start:clip.start+(clip.leadIn||0),duration:clip.duration-(clip.leadIn||0)});
const report=[],failures=[];
const run=(args,maxBuffer=16*1024*1024)=>spawnSync('ffmpeg',['-hide_banner','-nostdin',...args],{maxBuffer});
for(const item of source){
 const input=['-i',item.file],trim=item.start===undefined?'':'atrim=start='+item.start+':duration='+item.duration+',';
 // Keep both channels; decoded PCM at 24 kHz for consistent RMS estimate.
 const pcm=run([...input,'-vn','-af',trim+'aresample=24000','-ac','2','-f','f32le','pipe:1'],256*1024*1024);
 const loud=run([...input,'-vn','-af',trim+'loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json','-f','null','-']);
 const json=loud.stderr?.toString().match(/\{\s*"input_i"[\s\S]*?\}/g)?.at(-1);
 if(pcm.status!==0||loud.status!==0||!json){failures.push({file:item.file,id:item.id,error:String(pcm.error||loud.error||loud.stderr?.toString().slice(-250))});continue;}
 const n=Math.floor(pcm.stdout.length/8),left=new Float32Array(n),right=new Float32Array(n);
 for(let i=0;i<n;i++){left[i]=pcm.stdout.readFloatLE(i*8);right[i]=pcm.stdout.readFloatLE(i*8+4);}
 const metrics=measurePCM({sampleRate:24000,length:n,duration:n/24000,numberOfChannels:2,getChannelData:ch=>ch?right:left});
 const values=JSON.parse(json),gain=calibrationGain(item.id,metrics);
 const row={...item,...metrics,integratedLUFS:values.input_i,truePeakDbTP:values.input_tp,loudnessRange:values.input_lra,gain,adjustedActiveDb:metrics.activeDb+20*Math.log10(gain)};
 report.push(row);
 console.log(JSON.stringify(row));
}
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({method:'FFmpeg loudnorm first pass (LUFS, dBTP); decoded stereo PCM 24kHz, active 40ms RMS percentile; isolated recordings, not physical device volume',report,failures},null,2)+'\n');
if(failures.length){console.error(JSON.stringify(failures));process.exitCode=1;}
