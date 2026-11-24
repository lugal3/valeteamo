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
export class Sound {
 ctx?:AudioContext;timer?:number;step=0;lastHit=0;lastAmbient=-100;theme:MusicTheme='story';
 private silent=false;
 private readonly samples=new Map<string,AudioBuffer>();
 private userSpriteReady=false;
 private readonly voices=new Set<AudioBufferSourceNode>();
 private loading?:AbortController;
 constructor(private readonly sampleUrls:Readonly<Record<string,string>>={},
  private readonly spriteUrl?:string,private readonly spriteFallbackUrl?:string){}
 get muted(){return this.silent;}
 set muted(value:boolean){this.silent=value;if(value)this.stopSamples();}
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
 start():Promise<boolean>{
  try{
   const AudioCtor=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   if(!AudioCtor)return Promise.resolve(false);
   if(!this.ctx||this.ctx.state==='closed'){this.ctx=new AudioCtor();this.loadSamples(this.ctx);}
   const context=this.ctx;
   const resumed=context.state==='running'?Promise.resolve():context.resume();
   if(this.timer===undefined)this.timer=window.setInterval(()=>this.playStep(),360);
   return resumed.then(()=>context.state==='running').catch(()=>false);
  }catch{return Promise.resolve(false);}
 }
 private playStep(){
  if(!this.ctx||this.muted||this.ctx.state!=='running')return;
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
   if(stereo){
    stereo.pan.setValueAtTime(Math.max(-.85,Math.min(.85,pan)),start);
    gain.connect(stereo);stereo.connect(ctx.destination);
   }else gain.connect(ctx.destination);
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
  this.samples.clear();
  this.stopSamples();
  const context=this.ctx;
  this.ctx=undefined;
  if(context&&context.state!=='closed')void context.close().catch(()=>{});
 }
}
