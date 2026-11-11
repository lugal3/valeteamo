const ids=['door-open','door-close','closet-close','unlock','trying-door','notification','light','wood-1','wood-2','wood-3','stair-1','stair-2','stair-3','ambient','tension','alert'];
const emoteURLs=import.meta.glob('./audio/emote-*.{mp3,ogg,wav}',{eager:true,query:'?url',import:'default'});
export const SAMPLE_URLS=Object.fromEntries([
 ...Object.entries(emoteURLs).map(([path,url])=>[path.split('/').at(-1).replace(/\.[^.]+$/,''),url]),
 ...ids.map(id=>[id,new URL(`./audio/${id}.wav`,import.meta.url).href])
]);
export class RecordedAudio{
 constructor(ctx,effects,music,ambient=music){this.ctx=ctx;this.effects=effects;this.music=music;this.ambient=ambient;this.buffers=new Map();this.voices=new Set();this.loops=new Map();this.offsets={};this.indices={};this.abort=new AbortController();this.dead=false;this.mood='ambient';this.played=0;this.errors=[];}
 async load(){await Promise.all(Object.entries(SAMPLE_URLS).map(async([id,url])=>{try{const r=await fetch(url,{signal:this.abort.signal});if(!r.ok)throw Error('HTTP '+r.status);const data=await this.ctx.decodeAudioData(await r.arrayBuffer());if(!this.dead)this.buffers.set(id,data);}catch(e){if(!this.dead)this.errors.push(id+': '+e.message);}}));}
 play(id,{gain=1,pan=0,rate=1,output=this.effects}={}){
  const buffer=this.buffers.get(id);if(this.dead||!buffer||this.ctx.state!=='running'||this.voices.size>=18)return false;
  const source=this.ctx.createBufferSource(),vol=this.ctx.createGain(),stereo=this.ctx.createStereoPanner();source.buffer=buffer;source.playbackRate.value=rate;vol.gain.value=gain;stereo.pan.value=pan;source.connect(vol);vol.connect(stereo);stereo.connect(output);
  const voice={stop:()=>{source.onended=null;try{source.stop();}catch{}source.disconnect();vol.disconnect();stereo.disconnect();this.voices.delete(voice);}};source.onended=voice.stop;this.voices.add(voice);source.start();this.lastPlayed=id;this.played++;return voice;
 }
 kind(kind,options={}){
  let id=({'keys':'unlock',trying:'trying-door',knock:'trying-door',door:'door-open'})[kind]||kind;
  if(kind==='wood'||kind==='stair'){const i=this.indices[kind]||0;this.indices[kind]=(i+1)%3;id=kind+'-'+(i+1);}
  return this.play(id,options);
 }
 setMood(mood){this.mood=mood;if(this.dead||this.ctx.state!=='running')return;const audible=this.buffers.has(mood)?mood:'ambient';for(const id of ['ambient','tension']){
  const buffer=this.buffers.get(id);if(!buffer)continue;let loop=this.loops.get(id);
  if(!loop){const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(id==='ambient'?this.ambient:this.music);gain.gain.value=0;source.start(0,(this.offsets[id]||0)%buffer.duration);loop={source,gain,started:this.ctx.currentTime,offset:this.offsets[id]||0};this.loops.set(id,loop);}
  loop.gain.gain.setTargetAtTime(id===audible?(id==='ambient'?.20:.27):0,this.ctx.currentTime,.35);
 }}
 pause(preserve=null){for(const v of this.voices)if(v!==preserve)v.stop();for(const [id,l]of this.loops){this.offsets[id]=(l.offset+this.ctx.currentTime-l.started)%l.source.buffer.duration;try{l.source.stop();}catch{}l.source.disconnect();l.gain.disconnect();}this.loops.clear();}
 destroy(){this.dead=true;this.abort.abort();this.pause();this.buffers.clear();}
}
