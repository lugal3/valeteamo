// House-only recorded effects and music, with procedural fallback for missing clips.
import {scheduleTensionStep,TENSION_BEAT} from './tension-music.js';
import {HouseAtmosphere,playFoley} from './atmosphere.js';
import {spookyFoley} from './spooky-foley.js';
import {buildCaptureScream} from './capture-scream.js';
import {RecordedAudio} from './recorded-audio.js';
import {playEmoteRhythm} from './emote-audio.js';
const pianoReference=new URL('./audio/piano-reference.wav',import.meta.url).href;
const PIANO_ROOTS=[0,4,7,12];
const KEY='valeteamo-lab-sound-v1';
export const MIX_CHANNELS=[
 ['master','Volumen maestro'],['ambient','Ambiente'],['music','Música de tensión'],['effects','Todos los efectos'],
 ['doors','Puertas y armario','door-open'],['steps','Pasos y escalera','stair'],['creaks','Crujidos de la casa','floor-groan'],
 ['objects','Objetos e interacciones','light'],['alerts','Mensajes y alertas','notification'],['emotes','Música de emotes','six-seven']
];
export const mixLimit=key=>key==='master'?3:MIX_CHANNELS.slice(4).some(([name])=>name===key)?2:1;
const defaults={muted:false,master:1,ambient:.40,effects:.68,music:.34,doors:1.8,steps:1,creaks:1,objects:1,alerts:1,emotes:1};
const effectChannel=kind=>{
 if(/^(door|closet|latch|unlock|trying|knock|keys|hatch)/.test(kind))return 'doors';
 if(['wood','stair','tile','grass','dirt','stone','footstep'].includes(kind))return 'steps';
 if(kind==='floor-groan')return 'creaks';
 return ['notification','alert'].includes(kind)?'alerts':'objects';
};
export class HouseSound {
 constructor(){let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}this.settings={...defaults};for(const key of Object.keys(defaults))if(saved?.[key]!==undefined)this.settings[key]=this.settingValue(key,saved[key]);this.context=null;this.ambientNodes=[];this.musicNodes=new Set();this.musicTimer=null;this.musicStep=0;this.tension=.55;this.paused=false;}
 save(){try{localStorage.setItem(KEY,JSON.stringify(this.settings))}catch{}}
 async start(){
  if(!this.context){
   const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
   this.context=new C();this.master=this.context.createGain();this.master.gain.value=.45*this.settings.master;
   const limiter=this.context.createDynamicsCompressor();limiter.threshold.value=-10;limiter.ratio.value=8;this.master.connect(limiter);limiter.connect(this.context.destination);
   this.roomBus=this.context.createGain();this.roomBus.gain.value=this.captureQuiet ? .11 : 1;this.roomBus.connect(this.master);
   this.musicBus=this.context.createGain();this.musicBus.gain.value=this.settings.muted?0:this.settings.music;this.musicBus.connect(this.roomBus);
   this.effectsBus=this.context.createGain();this.effectsBus.gain.value=this.settings.muted?0:this.settings.effects;this.effectsBus.connect(this.master);this.sequenceNodes=new Set();
   this.recordedMusicBus=this.context.createGain();this.recordedMusicBus.gain.value=this.settings.muted?0:this.settings.music;this.recordedMusicBus.connect(this.roomBus);
   this.recordedAmbientBus=this.context.createGain();this.recordedAmbientBus.gain.value=this.settings.muted?0:this.settings.ambient;this.recordedAmbientBus.connect(this.roomBus);
   this.channels=Object.fromEntries(MIX_CHANNELS.slice(4).map(([name])=>{const gain=this.context.createGain();gain.gain.value=this.settings[name];gain.connect(this.effectsBus);return [name,gain];}));
   this.recordings=new RecordedAudio(this.context,this.effectsBus,this.recordedMusicBus,this.recordedAmbientBus);const ctx=this.context;void this.recordings.load().then(()=>{if(this.context===ctx){this.applySettings();if(!this.paused)this.recordings.setMood(this.threat?'tension':'ambient');}});
   this.startAmbience();
  }
  return this.resume();
 }
 startAmbience(){
  if(!this.context)return;const ctx=this.context;
  this.atmosphere=new HouseAtmosphere(ctx,this.roomBus);this.atmosphere.setVolume(this.settings.muted?0:this.settings.ambient);
 }
 locate(environment){this.atmosphere?.locate(environment);}
 startMusic(){
  if(!this.context||this.musicTimer!==null||this.paused)return;this.nextBeat=this.context.currentTime+.035;
  const schedule=()=>{const ctx=this.context;if(!ctx||ctx.state!=='running'||this.paused)return;
   // Skip missed beats after a stalled/background tab instead of stacking old notes.
   this.atmosphere?.tick();if(this.nextBeat<ctx.currentTime-.10)this.nextBeat=ctx.currentTime+.035;
   while(this.nextBeat<ctx.currentTime+.20){if(!this.recordings?.buffers.has('ambient'))scheduleTensionStep(ctx,this.musicBus,this.nextBeat,this.musicStep,this.tension,voice=>{this.musicNodes.add(voice);voice.osc.onended=()=>{voice.osc.disconnect();voice.filter.disconnect();voice.gain.disconnect();this.musicNodes.delete(voice);};});this.musicStep++;this.nextBeat+=TENSION_BEAT;}};
  schedule();this.musicTimer=window.setInterval(schedule,80);
 }
 stopMusic(){if(this.musicTimer!==null){window.clearInterval(this.musicTimer);this.musicTimer=null;}for(const voice of this.musicNodes){try{voice.osc.stop();voice.osc.disconnect();voice.filter.disconnect();voice.gain.disconnect();}catch{}}this.musicNodes.clear();}
 setTension(value){this.tension=Math.max(0,Math.min(1,value));}
 setThreat(value){if(this.threat===!!value)return;this.threat=!!value;if(!this.paused)this.recordings?.setMood(this.threat?'tension':'ambient');}
 applySettings(){
  const now=this.context.currentTime,volume=key=>this.settings.muted?0:this.settings[key];
  this.master.gain.setTargetAtTime(volume('master')*.45,now,.025);
  this.atmosphere?.setVolume(volume('ambient'));
  this.musicBus.gain.setTargetAtTime(this.recordings.buffers.has('ambient')?0:volume('music'),now,.06);
  this.recordedMusicBus.gain.setTargetAtTime(volume('music'),now,.06);
  this.recordedAmbientBus.gain.setTargetAtTime(volume('ambient'),now,.06);
  this.effectsBus.gain.setTargetAtTime(volume('effects'),now,.025);
  for(const [key,bus] of Object.entries(this.channels))bus.gain.setTargetAtTime(this.settings[key],now,.025);
  this.save();
 }
 settingValue(key,value){return key==='muted'?Boolean(value):Math.max(0,Math.min(mixLimit(key),Number(value)||0));}
 set(kind,value){this.settings[kind]=this.settingValue(kind,value);if(this.context)this.applySettings();else this.save();}
 emote(id,duration){
  this.stopEmote();
  if(!this.context||this.paused||this.context.state!=='running'||this.settings.muted)return;
  const output=this.channels.emotes;
  this.emoteStartedAt=this.context.currentTime;
  this.emoteVoice=this.recordings.play('emote-'+id,{gain:.66,output})||playEmoteRhythm(this.context,output,id,duration);
 }
 get emoteElapsed(){return this.emoteVoice?this.context.currentTime-this.emoteStartedAt:null;}
 stopEmote(){this.emoteVoice?.stop();this.emoteVoice=null;}
 carEngine(progress){
  const ctx=this.context;
  if(progress===null||!ctx||this.paused||ctx.state!=='running'||this.settings.muted){
   const voice=this.engine;
   if(!voice)return;
   this.engine=null;
   const now=ctx.currentTime;
   voice.gain.gain.setTargetAtTime(0,now,.038);voice.motor.stop(now+.18);
   return;
  }
  const now=ctx.currentTime;
  if(!this.engine){
   const motor=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
   motor.type='sawtooth';motor.frequency.value=42;filter.type='lowpass';filter.frequency.value=180;gain.gain.value=0;
   motor.connect(filter);filter.connect(gain);gain.connect(this.channels.objects);
   motor.onended=()=>{motor.disconnect();filter.disconnect();gain.disconnect();};
   motor.start();this.engine={motor,gain};
  }
  const motion=Math.sin(Math.PI*progress);
  this.engine.motor.frequency.setTargetAtTime(36+motion*17,now,.08);
  this.engine.gain.gain.setTargetAtTime((.028+motion*.068)*(1-.75*progress**5),now,.08);
 }
 rcMotor(speed){
  const ctx=this.context;
  if(speed<=0||!ctx||this.paused||ctx.state!=='running'||this.settings.muted){
   if(this.rcVoice){const {motor,gain}=this.rcVoice;this.rcVoice=null;gain.gain.setTargetAtTime(0,ctx.currentTime,.02);motor.stop(ctx.currentTime+.08);}
   return;
  }
  if(!this.rcVoice){
   const sample=this.recordings?.buffers.get('rc-motor'),gain=ctx.createGain();
   const motor=sample?ctx.createBufferSource():ctx.createOscillator();
   if(sample){motor.buffer=sample;motor.loop=true;motor.playbackRate.value=.8;}
   else motor.type='triangle';
   gain.gain.value=0;motor.connect(gain);gain.connect(this.channels.objects);
   motor.onended=()=>{motor.disconnect();gain.disconnect();};
   motor.start();this.rcVoice={motor,gain,sampled:!!sample};
  }
  const {motor,gain,sampled}=this.rcVoice;
  const power=Math.min(1,speed/2.5);
  if(sampled)motor.playbackRate.setTargetAtTime(.72+power*.62,ctx.currentTime,.055);
  else motor.frequency.setTargetAtTime(75+power*150,ctx.currentTime,.055);
  gain.gain.setTargetAtTime(sampled?.11+power*.11:.018+power*.032,ctx.currentTime,.055);
 }
 preparePiano(){
  if(!this.context||this.pianoLoading)return;
  const context=this.context,signal=this.recordings.abort.signal;
  this.pianoLoading=fetch(pianoReference,{signal})
   .then(response=>{if(!response.ok)throw Error('Piano audio unavailable');return response.arrayBuffer();})
   .then(bytes=>context.decodeAudioData(bytes))
   .then(buffer=>{if(!signal.aborted)this.pianoBuffer=buffer;})
   .catch(()=>{if(!signal.aborted)this.pianoLoading=null;});
 }
 stopPiano(){
  this.pianoToken=(this.pianoToken||0)+1;
  if(this.pianoVoice){this.pianoVoice.stop();this.pianoVoice=null;}
  for(const voice of this.pianoNotes||[])voice.stop();
  this.pianoNotes?.clear();
  this.pianoClock=null;
 }
 pianoSegment(start,end,delay=0){
  const context=this.context,token=this.pianoToken;
  if(!context||this.settings.muted)return;
  this.preparePiano();
  void context.resume().then(()=>{
   if(this.context!==context||context.state!=='running'||this.pianoToken!==token||this.settings.muted)return;
   const buffer=this.pianoBuffer;
   if(!buffer||start>=buffer.duration)return;
   const source=context.createBufferSource(),gain=context.createGain(),now=context.currentTime+delay;
   const duration=Math.min(end,buffer.duration)-start;
   source.buffer=buffer;source.connect(gain);gain.connect(this.channels.objects);
   gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(.75,now+Math.min(.065,duration*.25));
   gain.gain.setValueAtTime(.75,now+duration-Math.min(.045,duration*.3));
   gain.gain.linearRampToValueAtTime(.0001,now+duration);
   this.pianoVoice=source;
   this.pianoClock={offset:start,startedAt:now,end:start+duration};
   source.onended=()=>{
    if(this.pianoVoice===source)this.pianoVoice=null;
    source.disconnect();gain.disconnect();
   };
   source.start(now,start,duration);
  }).catch(()=>{});
 }
 pianoTime(offset){
  const clock=this.pianoClock;
  if(!this.pianoVoice||clock?.offset!==offset||this.context.currentTime<clock.startedAt)return null;
  return Math.min(clock.end,clock.offset+this.context.currentTime-clock.startedAt);
 }
 resumePiano(){if(this.context&&!this.settings.muted)void this.context.resume().catch(()=>{});}
 pianoReveal(stage){
  const ctx=this.context;
  if(!ctx||ctx.state!=='running'||this.settings.muted)return;
  const output=this.channels.objects;
  if(stage==='drawer'){
   playFoley(ctx,output,this.atmosphere.noise,'window',.18,-.13);
   this.recordings?.play('unlock',{gain:.32,pan:-.13,output});return;
  }
  for(const [i,frequency] of [784,1046.5,1318.5].entries()){
   const at=ctx.currentTime+i*.080,note=ctx.createOscillator(),gain=ctx.createGain();
   note.frequency.value=frequency;
   gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.12-i*.02,at+.009);
   gain.gain.exponentialRampToValueAtTime(.0001,at+.48);
   note.connect(gain);gain.connect(output);this.sequenceNodes.add(note);
   note.onended=()=>{note.disconnect();gain.disconnect();this.sequenceNodes.delete(note);};
   note.start(at);note.stop(at+.49);
  }
 }
 piano(index){
  const ctx=this.context,token=this.pianoToken;if(!ctx||this.settings.muted)return;
  const frequency=261.626*2**(index/12);
  const strike=()=>{
   if(this.context!==ctx||ctx.state!=='running'||this.settings.muted||token!==this.pianoToken)return;
   const at=ctx.currentTime;
   this.pianoNotes??=new Set();
   if(this.pianoNotes.size>=48)return;
   const root=PIANO_ROOTS.reduce((nearest,note)=>Math.abs(note-index)<Math.abs(nearest-index)?note:nearest);
   const sample=this.recordings?.buffers.get('upright-'+root);
   if(sample){
    const voice=ctx.createBufferSource(),gain=ctx.createGain();
    voice.buffer=sample;voice.playbackRate.value=2**((index-root)/12);
    gain.gain.value=.52;voice.connect(gain);gain.connect(this.channels.objects);
    this.pianoNotes.add(voice);
    voice.onended=()=>{voice.disconnect();gain.disconnect();this.pianoNotes.delete(voice);};
    voice.start(at);return;
   }
   for(const [multiple,level,decay] of [[1,.13,1.55],[2.005,.045,.84],[3.013,.024,.47],[4.026,.013,.25]]){
    const note=ctx.createOscillator(),gain=ctx.createGain();note.frequency.value=frequency*multiple;
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(level,at+.009);gain.gain.exponentialRampToValueAtTime(.0001,at+decay);
    note.connect(gain);gain.connect(this.channels.objects);this.pianoNotes.add(note);
    note.onended=()=>{note.disconnect();gain.disconnect();this.pianoNotes.delete(note);};note.start(at);note.stop(at+decay+.02);
   }
  };
  if(ctx.state==='running')strike();else void ctx.resume().then(strike).catch(()=>{});
 }
 // Simple location-dependent stereo and attenuation, including room/floor obstruction.
 effect(kind,origin,listener,occluded=false,{level=1}={}){
  const ctx=this.context;if(!ctx||this.paused||ctx.state!=='running'||this.settings.muted)return;
  const output=this.channels[effectChannel(kind)];
  const distance=origin?Math.hypot(origin.x-listener.x,origin.y-listener.y,origin.z-listener.z):0;
  const atten=origin?1/(1+.15*distance*distance):1;
  const floorMask=origin&&Math.abs(origin.y-listener.y)>1.85?.55:1;
  const gain=.20*atten*floorMask*(occluded?.38:1)*Math.max(0,Math.min(1.5,level));
  if(gain<.0007)return;
  const yaw=listener.yaw||0,dx=origin?origin.x-listener.x:0,dz=origin?origin.z-listener.z:0;
  const stereo=Math.max(-.85,Math.min(.85,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(1,distance)));
  if(kind==='clock-tick'||kind==='tv-static'){
   playFoley(ctx,output,this.atmosphere.noise,kind,gain*(kind==='clock-tick'?.82:1.7),stereo);
   this.lastEffect=kind;this.effectCount=(this.effectCount||0)+1;return;
  }
  if(this.recordings?.kind(kind,{gain:gain*1.8,pan:stereo,output})){this.lastEffect=kind;this.effectCount=(this.effectCount||0)+1;return;}
  if(kind==='hatch-close')kind='door-close';
  if(kind==='power-cut')kind='latch';
  if(['door','door-open','door-close','floor-groan','stair','wood','latch'].includes(kind)){
   this.foleyVoices??=new Set();if(this.foleyVoices.size>=12)return;
   const voice=spookyFoley(ctx,output,this.atmosphere.noise,kind,gain*(kind.startsWith('door')?2:kind==='floor-groan'?1.5:1),stereo,v=>this.foleyVoices.delete(v));this.foleyVoices.add(voice);this.lastEffect=kind;this.effectCount=(this.effectCount||0)+1;return;
  }
  if(['wood','tile','grass','dirt','stone','door','drawer','window','latch','cloth','land'].includes(kind)){
   const foley={door:'creak',drawer:'wood',land:'wood'}[kind]||kind;
   playFoley(ctx,output,this.atmosphere.noise,foley,gain*2,(Math.random()-.5)*.18);return;
  }
  const now=ctx.currentTime,vol=ctx.createGain(),pan=ctx.createStereoPanner();
  pan.pan.value=stereo;
  vol.connect(pan);pan.connect(output);
  const oscillator=ctx.createOscillator();oscillator.type=kind==='footstep'||kind==='cat'?'triangle':kind==='pickup'||kind==='rc-beep'?'sine':'sawtooth';
  const base={footstep:95,door:185,drawer:215,pickup:490,light:660,note:380,creak:78,click:425,hide:160,bed:120}[kind]||280;
  const variation=kind==='footstep'?(Math.random()-.5)*20:(Math.random()-.5)*8;
  const duration=kind==='cat'?.42:kind==='rc-beep'?.27:kind==='creak'?.34:kind==='footstep'?.12:.18;
  if(kind==='cat'){
   oscillator.frequency.setValueAtTime(615,now);
   oscillator.frequency.exponentialRampToValueAtTime(815,now+.11);
   oscillator.frequency.exponentialRampToValueAtTime(400,now+.37);
   this.lastEffect=kind;this.effectCount=(this.effectCount||0)+1;
  }else if(kind==='rc-beep'){
   oscillator.frequency.setValueAtTime(880,now);
   oscillator.frequency.setValueAtTime(1046.5,now+.15);
   this.lastEffect=kind;this.effectCount=(this.effectCount||0)+1;
  }else{
   oscillator.frequency.setValueAtTime(base+variation,now);
   oscillator.frequency.exponentialRampToValueAtTime(Math.max(30,(base+variation)*.7),now+.13);
  }
  vol.gain.setValueAtTime(.0001,now);vol.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),now+.012);
  vol.gain.exponentialRampToValueAtTime(.0001,now+duration);
  if(kind==='rc-beep'){
   vol.gain.exponentialRampToValueAtTime(.0001,now+.11);
   vol.gain.setValueAtTime(.0001,now+.145);
   vol.gain.exponentialRampToValueAtTime(Math.max(.0002,gain*.75),now+.165);
  }
  oscillator.connect(vol);oscillator.start(now);oscillator.stop(now+duration+.02);
  oscillator.onended=()=>{oscillator.disconnect();vol.disconnect();pan.disconnect();};
 }
 sequence(kind,loud=false){const ctx=this.context;if(!ctx||this.paused||ctx.state!=='running'||this.settings.muted)return;const output=this.channels[effectChannel(kind)];if(this.recordings?.kind(kind,{gain:kind==='notification'?(loud?.68:.30):.38,output}))return;for(let i=0;i<3;i++){const osc=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+i*(kind==='keys'?.11:.28);osc.type=kind==='keys'?'sine':'triangle';osc.frequency.setValueAtTime(kind==='keys'?1700+i*330:85,at);osc.frequency.exponentialRampToValueAtTime(kind==='keys'?1100:38,at+.12);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(kind==='keys'?.14:.50,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+.17);osc.connect(gain);gain.connect(output);osc.start(at);osc.stop(at+.2);this.sequenceNodes.add(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();this.sequenceNodes.delete(osc);};}}
 setCaptureQuiet(quiet){
  if(this.captureQuiet===quiet)return;
  this.captureQuiet=quiet;
  if(this.roomBus){
   const now=this.context.currentTime,gain=this.roomBus.gain;
   gain.cancelScheduledValues(now);
   gain.setTargetAtTime(quiet ? .11 : 1,now,quiet ? .16 : .27);
  }
 }
 captureCue(kind){
  const ctx=this.context;
  if(!ctx||ctx.state!=='running'||this.paused||this.settings.muted)return;
  this.captureScream??=buildCaptureScream(ctx);
  if(kind==='capture-reveal'){
   const source=ctx.createBufferSource(),gain=ctx.createGain();
   source.buffer=this.captureScream;gain.gain.value=2.38;
   source.connect(gain);gain.connect(this.channels.alerts);
   this.sequenceNodes.add(source);
   source.onended=()=>{source.disconnect();gain.disconnect();this.sequenceNodes.delete(source);};
   source.start();
   return;
  }
  this.foleyVoices??=new Set();
  const levels={'capture-bite':.60,'capture-snare':.43,'capture-tear':.34,'capture-breath':.26,'capture-grab':.32};
  const level=levels[kind];
  if(level===undefined)return;
  const voice=spookyFoley(ctx,this.channels.alerts,this.atmosphere.noise,kind,level,0,v=>this.foleyVoices.delete(v));
  this.foleyVoices.add(voice);
 }
 pause(){this.paused=true;this.carEngine(null);this.rcMotor(0);this.recordings?.pause(this.emoteVoice);this.stopMusic();for(const node of this.sequenceNodes||[])try{node.stop();}catch{}for(const voice of this.foleyVoices||[])voice.stop();this.atmosphere?.pause();try{if(this.context?.state==='running')void this.context.suspend().catch(()=>{});}catch{}}
 async resume(){
  const ctx=this.context;if(!ctx)return false;
  this.paused=false;
  try{
   await ctx.resume();
   if(this.context!==ctx)return false;
   if(this.paused){if(ctx.state==='running')await ctx.suspend();return false;}
   if(ctx.state!=='running')return false;
   this.atmosphere?.resume();this.startMusic();this.recordings?.setMood(this.threat?'tension':'ambient');
   return true;
  }catch{return false;}
 }
 destroy(){this.stopPiano();this.stopEmote();this.pause();this.recordings?.destroy();this.atmosphere?.destroy();this.atmosphere=null;this.ambientNodes=[];if(this.context){void this.context.close().catch(()=>{});this.context=null;}}
}
