import {USER_AUDIO_SPRITE} from './audio/user-sprite-index.js';
const spriteURL=new URL('./audio/user-sprite.ogg',import.meta.url).href;
const spriteMP3URL=new URL('./audio/user-sprite.mp3',import.meta.url).href;
import sample0 from './audio/door-open.wav';
import sample1 from './audio/door-close.wav';
import sample2 from './audio/closet-close.wav';
import sample3 from './audio/unlock.wav';
import sample4 from './audio/trying-door.wav';
import sample5 from './audio/notification.wav';
import sample6 from './audio/light.wav';
import sample7 from './audio/wood-1.wav';
import sample8 from './audio/wood-2.wav';
import sample9 from './audio/wood-3.wav';
import sample10 from './audio/stair-1.wav';
import sample11 from './audio/stair-2.wav';
import sample12 from './audio/stair-3.wav';
import sample13 from './audio/ambient.wav';
import sample14 from './audio/tension.wav';
import sample15 from './audio/alert.wav';
import sample16 from './audio/preview-cat.wav';
import sample17 from './audio/preview-hatch-close.wav';
import sample18 from './audio/preview-power-cut.wav';
import sample19 from './audio/preview-rc-motor.wav';
import sample20 from './audio/upright-0.wav';
import sample21 from './audio/upright-4.wav';
import sample22 from './audio/upright-7.wav';
import sample23 from './audio/upright-12.wav';
const emoteURLs=import.meta.glob('./audio/emote-*.{mp3,ogg,wav}',{eager:true,query:'?url',import:'default'});
// Optional raw recordings: Vite includes only assets that actually exist.
const polishURLs=import.meta.glob('./audio/{kitty-breath-calm,kitty-breath-fear,house-creak,floor-groan,rc-wheel-wood,rc-wheel-tile,rc-signal-loss,rc-damage,inspect-cloth}.wav',{eager:true,query:'?url',import:'default'});
export const SAMPLE_URLS=Object.fromEntries([
 ...Object.entries(polishURLs).map(([path,url])=>[path.split('/').at(-1).replace(/\.[^.]+$/,''),url]),
 ...Object.entries(emoteURLs).map(([path,url])=>[path.split('/').at(-1).replace(/\.[^.]+$/,''),url]),
 ['door-open',sample0],
 ['door-close',sample1],
 ['closet-close',sample2],
 ['unlock',sample3],
 ['trying-door',sample4],
 ['notification',sample5],
 ['light',sample6],
 ['wood-1',sample7],
 ['wood-2',sample8],
 ['wood-3',sample9],
 ['stair-1',sample10],
 ['stair-2',sample11],
 ['stair-3',sample12],
 ['ambient',sample13],
 ['tension',sample14],
 ['alert',sample15],
 ['cat',sample16],
 ['hatch-close',sample17],
 ['power-cut',sample18],
 ['rc-motor',sample19],
 ['upright-0',sample20],
 ['upright-4',sample21],
 ['upright-7',sample22],
 ['upright-12',sample23]
]);
export class RecordedAudio{
 constructor(ctx,effects,music,ambient=music){this.ctx=ctx;this.effects=effects;this.music=music;this.ambient=ambient;this.buffers=new Map();this.voices=new Set();this.loops=new Map();this.offsets={};this.indices={};this.abort=new AbortController();this.dead=false;this.mood='ambient';this.played=0;this.errors=[];this.sprite=null;this.userBufferCache=new Map();}
 async load(){
  await Promise.all([
   ...Object.entries(SAMPLE_URLS).map(async([id,url])=>{
    try{const r=await fetch(url,{signal:this.abort.signal});if(!r.ok)throw Error('HTTP '+r.status);
      const data=await this.ctx.decodeAudioData(await r.arrayBuffer());if(!this.dead)this.buffers.set(id,data);
    }catch(e){if(!this.dead)this.errors.push(id+': '+e.message);}
   }),
   (async()=>{
    let failure=null;
    // Opus/Ogg is smaller; MP3 preserves support for older iOS/Safari.
    for(const url of [spriteURL,spriteMP3URL]){
     if(this.dead||this.abort.signal.aborted)break;
     try{
      const response=await fetch(url,{signal:this.abort.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      const data=await this.ctx.decodeAudioData(await response.arrayBuffer());
      if(!this.dead){this.sprite=data;this.spriteCodec=url===spriteURL?'opus':'mp3';}
      failure=null;break;
     }catch(e){failure=e;}
    }
    if(failure&&!this.dead)this.errors.push('user-sprite: '+failure.message);
   })()
  ]);
 }
 clipBuffer(id){
  const clip=USER_AUDIO_SPRITE[id];if(!clip||!this.sprite)return this.buffers.get(id)||null;
  if(this.userBufferCache.has(id))return this.userBufferCache.get(id);
  const sampleRate=this.sprite.sampleRate;
  const frames=Math.max(1,Math.floor(clip.duration*sampleRate));
  const offset=Math.round(clip.start*sampleRate);
  const buffer=this.ctx.createBuffer(this.sprite.numberOfChannels,frames,sampleRate);
  for(let ch=0;ch<this.sprite.numberOfChannels;ch++){
   buffer.getChannelData(ch).set(this.sprite.getChannelData(ch).subarray(offset,offset+frames));
  }
  this.userBufferCache.set(id,buffer);return buffer;
 }
 play(id,{gain=1,pan=0,rate=1,output=this.effects}={}){
  const clip=USER_AUDIO_SPRITE[id];
  const buffer=clip&&this.sprite?this.sprite:this.buffers.get(id);
  if(this.dead||!buffer||this.ctx.state!=='running'||this.voices.size>=18)return false;
  const source=this.ctx.createBufferSource(),vol=this.ctx.createGain(),stereo=this.ctx.createStereoPanner();source.buffer=buffer;source.playbackRate.value=rate;vol.gain.value=gain;stereo.pan.value=pan;source.connect(vol);vol.connect(stereo);stereo.connect(output);
  const voice={stop:()=>{source.onended=null;try{source.stop();}catch{}source.disconnect();vol.disconnect();stereo.disconnect();this.voices.delete(voice);}};source.onended=voice.stop;this.voices.add(voice);if(clip&&this.sprite){const trim=Math.max(0,Math.min(clip.leadIn||0,clip.duration-.05));source.start(0,clip.start+trim,clip.duration-trim);}
  else source.start();this.lastPlayed=id;this.played++;return voice;
 }
 kind(kind,options={}){
  let id=({'keys':'unlock',trying:'trying-door',knock:'trying-door',door:'door-open',cat:'cat-meow'})[kind]||kind;
  if(!this.sprite&&kind==='cat')id='cat';
  if(kind==='wood'||kind==='stair'){const i=this.indices[kind]||0;this.indices[kind]=(i+1)%3;id=kind+'-'+(i+1);}
  return this.play(id,options);
 }
 setMood(mood){this.mood=mood;if(this.dead||this.ctx.state!=='running')return;const audible=this.buffers.has(mood)?mood:'ambient';for(const id of ['ambient','tension']){
  const buffer=this.buffers.get(id);if(!buffer)continue;let loop=this.loops.get(id);
  if(!loop){const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(id==='ambient'?this.ambient:this.music);gain.gain.value=0;source.start(0,(this.offsets[id]||0)%buffer.duration);loop={source,gain,started:this.ctx.currentTime,offset:this.offsets[id]||0};this.loops.set(id,loop);}
  loop.gain.gain.setTargetAtTime(id===audible?(id==='ambient'?.20:.27):0,this.ctx.currentTime,.35);
 }}
 pause(preserve=null){for(const v of this.voices)if(v!==preserve)v.stop();for(const [id,l]of this.loops){this.offsets[id]=(l.offset+this.ctx.currentTime-l.started)%l.source.buffer.duration;try{l.source.stop();}catch{}l.source.disconnect();l.gain.disconnect();}this.loops.clear();}
 destroy(){this.dead=true;this.abort.abort();this.pause();this.buffers.clear();this.userBufferCache.clear();this.sprite=null;}
}
