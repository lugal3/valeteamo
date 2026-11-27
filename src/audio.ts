// Original music and rescue effects. start() belongs in a user gesture.
import type {AmbientKind} from './demo/rescue-ecology';
// 2D's legacy CommonJS smoke harness loads only .ts modules. Mirror the four
// 2D cue offsets here (the full nine-cue map belongs to 3D's user-sprite-index.js).
const RESCUE_AUDIO_SPRITE:Readonly<Record<string,Readonly<{start:number;duration:number}>>>={
 cat:{start:0,duration:.455125},
 churu:{start:6.155125,duration:7.008375},
 'van-door':{start:27.918333,duration:1.44},
 'van-away':{start:29.558333,duration:13}
};

export type MusicTheme='story'|'garden'|'battle'|'final';
const MELODIES:Record<MusicTheme,number[]>={
 story:[261.63,329.63,392,523.25,493.88,392,329.63,293.66,349.23,440,523.25,440,392,349.23,329.63,293.66],
 garden:[329.63,392,523.25,392,440,523.25,587.33,523.25,392,440,523.25,659.25,587.33,523.25,440,392],
 battle:[329.63,392,440,493.88,523.25,440,392,329.63,349.23,440,493.88,587.33,523.25,493.88,440,392],
 final:[261.63,329.63,392,493.88,523.25,659.25,587.33,493.88,440,523.25,587.33,659.25,783.99,659.25,523.25,392]
};
// Rescue-only mix. The classic mode continues to use the original melody,
// timer, note volumes and effects unless a narrative scene opts in.
export type RescueMood='garden'|'battle'|'unease'|'silence'|'forest'|'street';
export type RescueMix={mood:RescueMood;music:number;ambience:number;birds:boolean};
export function rescueMixFor(stage:string,map:string,dark:number,dialogue:boolean):RescueMix{
 const duck=dialogue?.32:1;
 if(stage==='disappearance')return {mood:'silence',music:0,ambience:0,birds:false};
 if(map==='night_neighborhood')return {mood:'street',music:.32*duck,ambience:.68*duck,birds:false};
 if(map==='dusk_search')return {mood:'forest',music:.25*duck,ambience:.62*duck,birds:false};
 if(['ribbon','petals','wheel','door','window','house'].includes(stage))
  return {mood:'forest',music:.20*duck,ambience:.40*duck,birds:false};
 if(stage==='defend')return {mood:'battle',music:.74*duck,ambience:.40*duck,birds:true};
 if(stage==='walk-together'&&dark>.17){
  const t=Math.max(0,Math.min(1,(dark-.17)/.04));
  return {mood:t>.55?'unease':'garden',music:(.86-.60*t)*duck,ambience:(1-.72*t)*duck,birds:t<.55};
 }
 return {mood:'garden',music:.90*duck,ambience:1*duck,birds:true};
}
const RESCUE_SCORE:Record<'unease'|'forest'|'street',readonly number[]>={
 unease:[329.63,0,311.13,0,246.94,0,0,0],
 forest:[130.81,0,0,0,146.83,0,0,0,138.59,0,0,0,0,0,0,0],
 street:[110,0,0,0,116.54,0,0,0,0,0,130.81,0,0,0,0,0]
};
export class Sound {
 ctx?:AudioContext;timer?:number;step=0;lastHit=0;lastAmbient=-100;theme:MusicTheme='story';
 private silent=false;
 private rescueMix?:RescueMix;
 private rescueMusicBus?:GainNode;
 private rescueAmbientBus?:GainNode;
 private rescueStep=0;
 private readonly samples=new Map<string,AudioBuffer>();
 private userSpriteReady=false;
 private readonly voices=new Set<AudioBufferSourceNode>();
 private loading?:AbortController;
 constructor(private readonly sampleUrls:Readonly<Record<string,string>>={},
  private readonly spriteUrl?:string,private readonly spriteFallbackUrl?:string){}
 get muted(){return this.silent;}
 set muted(value:boolean){this.silent=value;if(value)this.stopSamples();this.applyRescueGains(true);}
 private loadSamples(context:AudioContext){
  const entries=Object.entries(this.sampleUrls);
  if(!entries.length)return;
  const loading=new AbortController();
  this.loading=loading;
  for(const [kind,url] of entries){
   void fetch(url,{signal:loading.signal})
    .then(response=>{if(!response.ok)throw new Error('Audio unavailable');return response.arrayBuffer();})
    .then(bytes=>context.decodeAudioData(bytes))
    .then(buffer=>{if(!loading.signal.aborted&&!(this.userSpriteReady&&kind in RESCUE_AUDIO_SPRITE))this.samples.set(kind,buffer);})
    .catch(()=>{}); // The scene can still use its synthesized effect.
  }
  if(this.spriteUrl){
   void (async()=>{
    let sprite:AudioBuffer|undefined;
    for(const url of [this.spriteUrl,this.spriteFallbackUrl].filter((value):value is string=>!!value)){
     if(loading.signal.aborted)break;
     try{
      const response=await fetch(url,{signal:loading.signal});
      if(!response.ok)throw Error('Audio sprite fetch failed: '+response.status);
      sprite=await context.decodeAudioData(await response.arrayBuffer());
      break;
     }catch{} // Retry as MP3 when the current Safari/WebKit cannot decode Opus.
    }
    if(!sprite)return;
     if(loading.signal.aborted)return;
     this.userSpriteReady=true;
     for(const [kind,clip] of Object.entries(RESCUE_AUDIO_SPRITE)){
      if(!clip)continue;
      const offset=Math.round(clip.start*sprite.sampleRate),frames=Math.floor(clip.duration*sprite.sampleRate);
      const sample=context.createBuffer(sprite.numberOfChannels,frames,sprite.sampleRate);
      for(let channel=0;channel<sprite.numberOfChannels;channel++)
       sample.getChannelData(channel).set(sprite.getChannelData(channel).subarray(offset,offset+frames));
      this.samples.set(kind,sample);
     }
    })().catch(()=>{}); // Previously installed preview recordings remain as fallback.
  }
 }
 playSample(kind:string,volume:number):boolean{
  const context=this.ctx,buffer=this.samples.get(kind);
  if(!context||!buffer||this.muted||context.state!=='running'||this.voices.size>=6)return false;
  const source=context.createBufferSource(),gain=context.createGain();
  source.buffer=buffer;gain.gain.value=volume;
  source.connect(gain);gain.connect(context.destination);
  this.voices.add(source);
  source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();};
  source.start();
  return true;
 }
 private stopSamples(){
  for(const source of this.voices)source.stop();
  this.voices.clear();
 }
 setTheme(theme:MusicTheme){if(this.theme!==theme){this.theme=theme;this.step=0;}}
 setRescueMix(mix:RescueMix){
  const old=this.rescueMix;
  if(old&&old.mood===mix.mood&&old.birds===mix.birds&&
   Math.abs(old.music-mix.music)<.018&&Math.abs(old.ambience-mix.ambience)<.018)return;
  if(!old||old.mood!==mix.mood)this.rescueStep=0;
  this.rescueMix=mix;this.applyRescueGains(false);
 }
 private applyRescueGains(immediate:boolean){
  const ctx=this.ctx,mix=this.rescueMix;
  if(!ctx||!mix||ctx.state==='closed')return;
  if(!this.rescueMusicBus){this.rescueMusicBus=ctx.createGain();this.rescueMusicBus.gain.value=0;this.rescueMusicBus.connect(ctx.destination);}
  if(!this.rescueAmbientBus){this.rescueAmbientBus=ctx.createGain();this.rescueAmbientBus.gain.value=0;this.rescueAmbientBus.connect(ctx.destination);}
  const now=ctx.currentTime;
  for(const [node,target] of [[this.rescueMusicBus,mix.music],[this.rescueAmbientBus,mix.ambience]] as const){
   const param=node.gain,value=this.muted?0:target;
   if(typeof param.cancelAndHoldAtTime==='function')param.cancelAndHoldAtTime(now);
   else{const held=param.value;param.cancelScheduledValues(now);param.setValueAtTime(held,now);}
   if(immediate||this.muted)param.setValueAtTime(value,now);
   else param.setTargetAtTime(value,now,mix.mood==='silence'?.18:.45);
  }
 }
 private rescueNote(f:number,d:number,v:number,type:OscillatorType){
  const ctx=this.ctx,bus=this.rescueMusicBus;
  if(!ctx||!bus||this.muted||ctx.state!=='running'||f<=0)return;
  const o=ctx.createOscillator(),g=ctx.createGain(),at=ctx.currentTime;
  o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(.0001,at);
  g.gain.linearRampToValueAtTime(v,at+Math.min(.08,d/4));
  g.gain.exponentialRampToValueAtTime(.0001,at+d);
  o.connect(g);g.connect(bus);
  o.onended=()=>{o.disconnect();g.disconnect();};
  o.start(at);o.stop(at+d);
 }
 private playRescueStep(){
  const mix=this.rescueMix;
  if(!mix||mix.mood==='silence')return;
  const mood=mix.mood;
  if(mood==='garden'||mood==='battle'){
   const melody=MELODIES[mood],i=this.rescueStep++%melody.length,note=melody[i];
   this.rescueNote(note,.31,.035,'triangle');
   if(i%4===0){this.rescueNote(note/2,.60,.020,'sine');this.rescueNote(note*1.5,.34,.008,'sine');}
   else if(i%4===2)this.rescueNote(note*1.25,.24,.007,'sine');
   return;
  }
  const melody=RESCUE_SCORE[mood],i=this.rescueStep++%melody.length,note=melody[i];
  // Sparse, original motifs with real rests, not another upbeat melody.
  if(note){this.rescueNote(note,mood==='unease'?.7:1.15,.034,'sine');
   this.rescueNote(note*(mood==='unease'?1.5:2),.8,.009,'triangle');}
 }
 start():Promise<boolean>{
  try{
   const AudioCtor=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   if(!AudioCtor)return Promise.resolve(false);
   if(!this.ctx||this.ctx.state==='closed'){this.rescueMusicBus=undefined;this.rescueAmbientBus=undefined;this.ctx=new AudioCtor();this.loadSamples(this.ctx);this.applyRescueGains(false);}
   const context=this.ctx;
   const resumed=context.state==='running'?Promise.resolve():context.resume();
   if(this.timer===undefined)this.timer=window.setInterval(()=>this.playStep(),360);
   return resumed.then(()=>context.state==='running').catch(()=>false);
  }catch{return Promise.resolve(false);}
 }
 private playStep(){
  if(!this.ctx||this.muted||this.ctx.state!=='running')return;
  if(this.rescueMix){this.playRescueStep();return;}
  const melody=MELODIES[this.theme],index=this.step++%melody.length,note=melody[index];
  this.tone(note,.28,.035,'triangle');if(index%4===0){this.tone(note/2,.58,.022,'sine');this.tone(note*1.5,.33,.009,'sine');}else if(index%4===2)this.tone(note*1.25,.24,.007,'sine');
 }
 resume(){try{if(this.ctx?.state==='suspended')void this.ctx.resume().catch(()=>{});}catch{}}
 suspend(){this.stopSamples();try{if(this.ctx?.state==='running')void this.ctx.suspend().catch(()=>{});}catch{}}
 tone(f=440,d=.1,v=.05,type:OscillatorType='sine'){try{if(!this.ctx||this.muted||this.ctx.state!=='running')return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),start=this.ctx.currentTime;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.001,start);g.gain.linearRampToValueAtTime(v,start+Math.min(.012,d/4));g.gain.exponentialRampToValueAtTime(.001,start+d);o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(start+d);}catch{}}
 // Short, original voice-like distress call. This plays ONLY after Kitty
 // walks toward the orchard, before Louis/attackers become visible.
 // Two swept voiced formants, no asset download, 0.7s lifetime.
 storyHelpCry(){
  const ctx=this.ctx;
  if(!ctx||this.muted||ctx.state!=='running')return false;
  const at=ctx.currentTime;
  for(const [base,peak,formant,volume] of [
   [235,390,850,.13],[467,615,1490,.060]
  ]){
   const osc=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
   osc.type='sawtooth';osc.frequency.setValueAtTime(base,at);
   osc.frequency.exponentialRampToValueAtTime(peak,at+.20);
   osc.frequency.exponentialRampToValueAtTime(base*.92,at+.61);
   filter.type='bandpass';filter.frequency.value=formant;filter.Q.value=.65;
   gain.gain.setValueAtTime(.0001,at);
   gain.gain.exponentialRampToValueAtTime(volume,at+.075);
   gain.gain.setTargetAtTime(volume*.72,at+.20,.08);
   gain.gain.exponentialRampToValueAtTime(.0001,at+.70);
   osc.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
   osc.onended=()=>{osc.disconnect();filter.disconnect();gain.disconnect();};
   osc.start(at);osc.stop(at+.72);
  }
  return true;
 }
 // Organic, quiet location-specific ambience. Original oscillators only; no
 // sound files, external fetches, timers or audio-playback in render frames.
 // Calls come ONLY from the rescue world, never the classic Corazones mode.
 playRescueAmbience(kind:AmbientKind,pan=0):boolean{
  const ctx=this.ctx;
  if(!ctx||this.muted||ctx.state!=='running'||
   ctx.currentTime-this.lastAmbient<2.4)return false;
  const mix=this.rescueMix;
  if(mix&&(mix.ambience<.015||(kind==='birdsong'&&!mix.birds)))return false;
  this.lastAmbient=ctx.currentTime;
  const presets:Record<AmbientKind,readonly [number,number,number,OscillatorType][]>={
   river:[[155,.58,.0024,'sine'],[218,.38,.0014,'sine']],
   birdsong:[[975,.13,.0045,'sine'],[1210,.18,.0036,'sine']],
   breeze:[[173,.63,.0025,'sine'],[258,.47,.0012,'triangle']],
   insects:[[1630,.15,.0026,'sine'],[1970,.21,.0018,'sine']],
   'night-breeze':[[114,.72,.0028,'sine'],[183,.50,.0016,'triangle']],
   'distant-engine':[[92,.76,.0034,'triangle'],[136,.59,.0018,'sine']]
  };
  for(const [hz,duration,volume,wave] of presets[kind]){
   const oscillator=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime;
   const stereo=typeof ctx.createStereoPanner==='function'?ctx.createStereoPanner():undefined;
   oscillator.type=wave;oscillator.frequency.setValueAtTime(hz,start);
   oscillator.frequency.linearRampToValueAtTime(hz*(kind==='birdsong'?1.16:1.015),
    start+duration);
   gain.gain.setValueAtTime(.001,start);
   gain.gain.linearRampToValueAtTime(volume,start+Math.min(.08,duration/3));
   gain.gain.exponentialRampToValueAtTime(.001,start+duration);
   oscillator.connect(gain);
   const destination=this.rescueAmbientBus??ctx.destination;
   if(stereo){
    stereo.pan.setValueAtTime(Math.max(-.85,Math.min(.85,pan)),start);
    gain.connect(stereo);stereo.connect(destination);
   }else gain.connect(destination);
   oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();stereo?.disconnect();};
   oscillator.start(start);oscillator.stop(start+duration);
  }
  return true;
 }
 hit(){const now=this.ctx?.currentTime??0;if(now-this.lastHit<.06)return;this.lastHit=now;this.tone(520,.08,.026,'triangle');this.tone(780,.06,.015);}
 ui(){this.tone(660,.09,.018,'triangle');this.tone(990,.13,.009,'sine');}
 destroy(){
  if(this.timer!==undefined)clearInterval(this.timer);
  this.timer=undefined;
  this.loading?.abort();
  this.samples.clear();this.userSpriteReady=false;
  this.stopSamples();
  const context=this.ctx;
  this.ctx=undefined;
  this.rescueMusicBus?.disconnect();this.rescueAmbientBus?.disconnect();
  this.rescueMusicBus=undefined;this.rescueAmbientBus=undefined;this.rescueStep=0;
  this.lastAmbient=-100;
  if(context&&context.state!=='closed')void context.close().catch(()=>{});
 }
}
