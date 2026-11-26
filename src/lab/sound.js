// House-only recorded effects and music, with procedural fallback for missing clips.
import {scheduleTensionStep,TENSION_BEAT} from './tension-music.js';
import {HouseAtmosphere,playFoley} from './atmosphere.js';
import {spookyFoley} from './spooky-foley.js';
import {buildCaptureScream} from './capture-scream.js';
import {RecordedAudio} from './recorded-audio.js';
import {playEmoteRhythm} from './emote-audio.js';
import pianoReference from './audio/piano-reference.wav';
const PIANO_ROOTS=[0,4,7,12];
const KEY='valeteamo-lab-sound-v1';
export const MIX_CHANNELS=[
 ['master','Volumen maestro'],['ambient','Ambiente'],['music','Música de tensión'],['effects','Todos los efectos'],
 ['doors','Puertas y armario','door-open'],['steps','Pasos y escalera','stair'],['creaks','Crujidos de la casa','floor-groan'],
 ['objects','Objetos e interacciones','light'],['alerts','Mensajes y alertas','notification'],['emotes','Música de emotes','six-seven']
];
export const mixLimit=key=>key==='master'?3:MIX_CHANNELS.slice(4).some(([name])=>name===key)?2:1;
const defaults={muted:false,master:1,ambient:.40,effects:.68,music:.34,doors:1.8,steps:1,creaks:1,objects:1,alerts:1,emotes:1};
const captureLevels={'capture-bite':.60,'capture-swallow':.40,'capture-snare':.37,'capture-tug':.47,
 'capture-tear':.38,'capture-breath':.26,'capture-grab':.32,'capture-pulse':.15};
const effectChannel=kind=>{
 if(/^(door|closet|latch|unlock|trying|knock|keys|hatch)/.test(kind))return 'doors';
 if(['wood','stair','tile','grass','dirt','stone','footstep'].includes(kind))return 'steps';
 if(kind==='floor-groan'||kind==='house-creak')return 'creaks';
 return ['notification','alert','danger-alert'].includes(kind)?'alerts':'objects';
};
export class HouseSound {
 constructor(){let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}this.settings={...defaults};for(const key of Object.keys(defaults))if(saved?.[key]!==undefined)this.settings[key]=this.settingValue(key,saved[key]);this.context=null;this.ambientNodes=[];this.musicNodes=new Set();this.musicTimer=null;this.musicStep=0;this.tension=.55;this.paused=false;}
 save(){try{localStorage.setItem(KEY,JSON.stringify(this.settings))}catch{}}
 async start(){
  if(!this.context){
   const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
   this.context=new C();this.master=this.context.createGain();this.master.gain.value=.45*this.settings.master;
   const limiter=this.context.createDynamicsCompressor();limiter.threshold.value=-10;limiter.ratio.value=8;this.master.connect(limiter);limiter.connect(this.context.destination);
   this.roomBus=this.context.createGain();
   this.roomFilter=this.context.createBiquadFilter();this.roomFilter.type='lowpass';this.roomFilter.Q.value=.35;
   this.roomBus.connect(this.roomFilter);this.roomFilter.connect(this.master);
   this.updateRoomAcoustics(true);
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
 // First and loudest cue on confirmed visual discovery. Unlike regular foley,
 // this is NON-positional: walls, floors and camera distance cannot bury it.
 // Keep the existing master/effects/alerts/mute controls and output limiter.
 playDangerAlert(){
  const ctx=this.context;
  if(!ctx||this.paused||ctx.state!=='running'||this.settings.muted||!this.settings.alerts)return false;
  const now=ctx.currentTime;
  if(this.dangerLastAt!==undefined&&now-this.dangerLastAt<1.5)return false;
  this.dangerLastAt=now;
  const duck=[
   [this.musicBus,this.recordings?.buffers.has('ambient')?0:this.settings.music],
   [this.recordedMusicBus,this.settings.music],
   [this.recordedAmbientBus,this.settings.ambient]
  ];
  for(const [bus,normal] of duck){
   if(!bus)continue;
   bus.gain.cancelScheduledValues(now);
   bus.gain.setTargetAtTime(normal*.12,now,.018);
   bus.gain.setTargetAtTime(normal,now+1.35,.20);
  }
  // Strong, centred recording, independent of the pursuer's spatial distance.
  const voice=this.recordings?.kind('danger-alert',{gain:2.15,pan:0,output:this.channels.alerts});
  if(!voice){
   // Temporary immediate signal if the sound asset is still downloading.
   for(const [hz,delay] of [[540,0],[760,.11]]){
    const osc=ctx.createOscillator(),vol=ctx.createGain(),start=now+delay;
    osc.type='sawtooth';osc.frequency.setValueAtTime(hz,start);
    osc.frequency.exponentialRampToValueAtTime(hz*.73,start+.28);
    vol.gain.setValueAtTime(.0001,start);
    vol.gain.exponentialRampToValueAtTime(.36,start+.014);
    vol.gain.exponentialRampToValueAtTime(.0001,start+.40);
    osc.connect(vol);vol.connect(this.channels.alerts);
    osc.onended=()=>{osc.disconnect();vol.disconnect();};
    osc.start(start);osc.stop(start+.41);
   }
  }
  this.lastEffect='danger-alert';this.effectCount=(this.effectCount||0)+1;
  return true;
 }
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
   const sample=this.recordings?.clipBuffer('rc-motor'),gain=ctx.createGain();
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
 // Optional recorded loops (never synthetic fallback). A slot has at most
 // one active loop; fading an old one does not affect the next voice.
 sampleLoop(slot,id,level=0,rate=1){
  const ctx=this.context,buffer=id&&this.recordings?.clipBuffer(id);
  const enabled=!!buffer&&!!ctx&&!this.paused&&ctx.state==='running'&&!this.settings.muted&&level>0;
  this.polishLoops??=new Map();let voice=this.polishLoops.get(slot);
  if(voice&&(!enabled||voice.id!==id)){
   this.polishLoops.delete(slot);voice.gain.gain.setTargetAtTime(0,ctx.currentTime,.045);
   try{voice.source.stop(ctx.currentTime+.22);}catch{}voice=null;
  }
  if(!enabled)return;
  if(!voice){
   const source=ctx.createBufferSource(),gain=ctx.createGain();
   source.buffer=buffer;source.loop=true;gain.gain.value=0;source.playbackRate.value=rate;
   source.connect(gain);gain.connect(this.channels.objects);source.onended=()=>{source.disconnect();gain.disconnect();};
   source.start();voice={id,source,gain};this.polishLoops.set(slot,voice);
  }
  voice.gain.gain.setTargetAtTime(Math.min(.16,Math.max(0,level)),ctx.currentTime,.12);
  voice.source.playbackRate.setTargetAtTime(Math.max(.65,Math.min(1.5,rate)),ctx.currentTime,.09);
 }
 stopPolishLoops(){for(const slot of this.polishLoops?.keys()||[])this.sampleLoop(slot,null);}
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
  if(kind==='danger-alert'){this.playDangerAlert();return;}
  const ctx=this.context;if(!ctx||this.paused||ctx.state!=='running'||this.settings.muted)return;
  const output=this.channels[effectChannel(kind)];
  const distance=origin?Math.hypot(origin.x-listener.x,origin.y-listener.y,origin.z-listener.z):0;
  const atten=origin?1/(1+.15*distance*distance):1;
  const floorMask=origin&&Math.abs(origin.y-listener.y)>1.85?.55:1;
  const gain=.20*atten*floorMask*(occluded?.38:1)*Math.max(0,Math.min(1.5,level));
  if(gain<.0007)return;
  const yaw=listener.yaw||0,dx=origin?origin.x-listener.x:0,dz=origin?origin.z-listener.z:0;
  const stereo=Math.max(-.85,Math.min(.85,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(1,distance)));
  if(kind==='altar-hiss'&&this.atmosphere?.noise){
   // Short filtered breath from the existing noise buffer; no new asset.
   const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain(),pan=ctx.createStereoPanner();
   const at=ctx.currentTime;source.buffer=this.atmosphere.noise;source.loop=true;
   filter.type='bandpass';filter.frequency.setValueAtTime(4400,at);filter.frequency.exponentialRampToValueAtTime(1700,at+.42);filter.Q.value=.8;
   amp.gain.setValueAtTime(.0001,at);amp.gain.exponentialRampToValueAtTime(Math.max(.0002,gain*.7),at+.05);amp.gain.exponentialRampToValueAtTime(.0001,at+.46);
   pan.pan.value=stereo;source.connect(filter);filter.connect(amp);amp.connect(pan);pan.connect(output);
   this.sequenceNodes.add(source);source.start(at);source.stop(at+.48);
   source.onended=()=>{this.sequenceNodes.delete(source);source.disconnect();filter.disconnect();amp.disconnect();pan.disconnect();};
   this.lastEffect=kind;this.effectCount=(this.effectCount||0)+1;return;
  }
  if(kind==='altar-record'){
   // Original short, detuned locked-groove motif. No third-party recording,
   // no loop timer. Every voice is tracked and stopped on pause/teardown.
   const start=ctx.currentTime,amp=ctx.createGain(),pan=ctx.createStereoPanner();
   const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=860;filter.Q.value=.65;
   amp.gain.value=Math.min(.18,gain*.85);pan.pan.value=stereo;
   filter.connect(amp);amp.connect(pan);pan.connect(output);
   let pending=0;
   const voice=(hz,at,len,volume,type='triangle')=>{
    const osc=ctx.createOscillator(),envelope=ctx.createGain();pending++;
    osc.type=type;osc.frequency.setValueAtTime(hz,at);osc.frequency.linearRampToValueAtTime(hz*.94,at+len*.85);
    envelope.gain.setValueAtTime(.0001,at);envelope.gain.exponentialRampToValueAtTime(volume,at+.018);envelope.gain.exponentialRampToValueAtTime(.0001,at+len);
    osc.connect(envelope);envelope.connect(filter);this.sequenceNodes.add(osc);osc.start(at);osc.stop(at+len+.01);
    osc.onended=()=>{this.sequenceNodes.delete(osc);osc.disconnect();envelope.disconnect();if(--pending===0){filter.disconnect();amp.disconnect();pan.disconnect();}};
   };
   for(let i=0;i<3;i++){
    const at=start+i*1.12;voice(196,at+.08,.72,.42);voice(293.66,at+.39,.48,.28);
    voice(1130,at,.055,.35,'sawtooth');
   }
   this.lastEffect=kind;this.effectCount=(this.effectCount||0)+1;return;
  }
  if(kind==='clatter'){
   const material=origin?.material||'ceramic',surface=origin?.surface||'hard';
   const timbre=material==='glass'?1.32:material==='metal'?.78:material==='wood'?.55:1;
   const softness=surface==='soft'?.42:surface==='wood'?.78:1;
   // PROVISIONAL crash for falling glass/ceramic: sharp attack, low impact
   // and two bright rattles. No samples/downloads or unbounded timers.
   // It must be audible through nearby walls, without becoming global.
   const impact=Math.min(.8,.60/(1+.06*distance*distance)*
    (occluded?.68:1)*(floorMask*.75+.25)*Math.max(0,Math.min(1.5,level))*softness);
   const now=ctx.currentTime;
   for(const [i,hz] of [180,1250,1810,2560].entries()){
    const at=now+(i===0?0:i*.036),osc=ctx.createOscillator(),amp=ctx.createGain(),pan=ctx.createStereoPanner();
    osc.type=i===0?'triangle':'sine';
    osc.frequency.setValueAtTime(hz*timbre,at);
    osc.frequency.exponentialRampToValueAtTime(hz*timbre*(i===0?.61:.56),at+.14);
    amp.gain.setValueAtTime(.0001,at);
    amp.gain.exponentialRampToValueAtTime(Math.max(.0002,impact*(i===0?.8:1-i*.16)),at+.005);
    amp.gain.exponentialRampToValueAtTime(.0001,at+(i===0?.16:.21+i*.025));
    pan.pan.value=stereo;osc.connect(amp);amp.connect(pan);pan.connect(output);
    osc.onended=()=>{osc.disconnect();amp.disconnect();pan.disconnect();};
    osc.start(at);osc.stop(at+.30);
   }
   this.lastEffect=kind;this.effectCount=(this.effectCount||0)+1;return;
  }
  if(kind==='rc-horn'){
   // PROVISIONAL toy-car horn replaces the old barely audible dual beep.
   // Two close, slightly detuned tones form a short honk with a soft tail.
   const now=ctx.currentTime,level=Math.min(.85,gain*2.3);
   const mix=ctx.createGain(),filter=ctx.createBiquadFilter(),pan=ctx.createStereoPanner();
   filter.type='lowpass';filter.frequency.value=1600;pan.pan.value=stereo;
   mix.gain.setValueAtTime(.0001,now);
   mix.gain.exponentialRampToValueAtTime(Math.max(.0002,level),now+.026);
   mix.gain.setValueAtTime(Math.max(.0002,level),now+.30);
   mix.gain.exponentialRampToValueAtTime(.0001,now+.58);
   mix.connect(filter);filter.connect(pan);pan.connect(output);
   let ended=0;
   for(const hz of [355,446]){
    const oscillator=ctx.createOscillator(),part=ctx.createGain();
    oscillator.type='sawtooth';oscillator.frequency.setValueAtTime(hz,now);
    oscillator.frequency.linearRampToValueAtTime(hz*.98,now+.35);
    part.gain.value=.45;oscillator.connect(part);part.connect(mix);
    oscillator.onended=()=>{
     oscillator.disconnect();part.disconnect();
     if(++ended===2){mix.disconnect();filter.disconnect();pan.disconnect();}
    };
    oscillator.start(now);oscillator.stop(now+.61);
   }
   this.lastEffect=kind;this.effectCount=(this.effectCount||0)+1;return;
  }
  if(kind==='clock-tick'||kind==='tv-static'||kind==='scratch'){
   playFoley(ctx,output,this.atmosphere.noise,kind,gain*(kind==='clock-tick'?.82:1.7),stereo);
   this.lastEffect=kind;this.effectCount=(this.effectCount||0)+1;return;
  }
  if(this.recordings?.kind(kind,{gain:gain*(kind==='danger-alert'?.85:kind==='cat-purr'?.70:1.8),pan:stereo,output})){this.lastEffect=kind;this.effectCount=(this.effectCount||0)+1;return;}
  // Do not substitute artificial pitched tones for missing breathing recordings.
  if(kind==='kitty-breath-calm'||kind==='kitty-breath-fear'||kind==='rc-wheel-wood'||kind==='rc-wheel-tile'||kind==='rc-signal-loss'||kind==='inspect-cloth')return;
  if(kind==='house-creak')kind='floor-groan';
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
 setCaptureQuiet(quiet,occluded=false){
  if(this.captureQuiet===quiet&&this.captureOccluded===occluded)return;
  this.captureQuiet=quiet;
  this.captureOccluded=occluded;
  this.updateRoomAcoustics();
 }
 updateRoomAcoustics(immediate=false){
  if(!this.roomBus||!this.roomFilter)return;
  const {currentTime,sampleRate}=this.context;
  const occluded=this.captureQuiet&&this.captureOccluded;
  const level=occluded?.08:this.captureQuiet?.26:1;
  const cutoff=occluded?370:this.captureQuiet?1460:sampleRate*.48;
  for(const [parameter,target] of [[this.roomBus.gain,level],[this.roomFilter.frequency,cutoff]]){
   parameter.cancelScheduledValues(currentTime);
   if(immediate)parameter.setValueAtTime(target,currentTime);
   else parameter.setTargetAtTime(target,currentTime,this.captureQuiet?.12:.25);
  }
 }
 captureCue(kind,pan=0){
  const ctx=this.context;
  if(!ctx||ctx.state!=='running'||this.paused||this.settings.muted)return;
  if(kind==='capture-reveal'){
   this.captureScream??=buildCaptureScream(ctx);
   const source=ctx.createBufferSource(),gain=ctx.createGain(),stereo=ctx.createStereoPanner();
   source.buffer=this.captureScream;gain.gain.value=2.38;
   stereo.pan.value=pan;source.connect(gain);gain.connect(stereo);stereo.connect(this.channels.alerts);
   this.sequenceNodes.add(source);
   source.onended=()=>{source.disconnect();gain.disconnect();stereo.disconnect();this.sequenceNodes.delete(source);};
   source.start();
   return;
  }
  this.foleyVoices??=new Set();
  const level=captureLevels[kind];
  if(level===undefined)return;
  const voice=spookyFoley(ctx,this.channels.alerts,this.atmosphere.noise,kind,level,pan,v=>this.foleyVoices.delete(v));
  this.foleyVoices.add(voice);
 }
 // A small original music-box tune for the phone. Reuse the house audio
 // context and music bus; no autoplay, streaming or extra AudioContext.
 setPhoneMusic(enabled){this.phoneMusicWanted=!!enabled;this.stopPhoneMusic();if(enabled&&!this.paused){if(this.context?.state==='running')this.startPhoneMusic();else void this.start().then(()=>{if(this.phoneMusicWanted&&!this.paused)this.startPhoneMusic();});}return this.phoneMusicWanted;}
 startPhoneMusic(){
  if(!this.phoneMusicWanted||this.phoneMusicTimer!=null||!this.context||this.paused)return;
  const ctx=this.context,notes=[72,76,79,76,74,77,81,77,71,74,79,74,72,76,79,84];let next=ctx.currentTime+.03,index=0;
  const tick=()=>{if(this.context!==ctx||ctx.state!=='running'||this.paused)return;while(next<ctx.currentTime+.15){
   const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=440*Math.pow(2,(notes[index++%notes.length]-69)/12);gain.gain.setValueAtTime(.0001,next);gain.gain.exponentialRampToValueAtTime(.18,next+.012);gain.gain.exponentialRampToValueAtTime(.0001,next+.31);osc.connect(gain);gain.connect(this.recordedMusicBus||this.musicBus);osc.start(next);osc.stop(next+.33);(this.phoneMusicVoices??=new Set()).add(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();this.phoneMusicVoices?.delete(osc);};next+=.30;
  }};
  tick();this.phoneMusicTimer=window.setInterval(tick,75);
 }
 stopPhoneMusic(){if(this.phoneMusicTimer!=null){window.clearInterval(this.phoneMusicTimer);this.phoneMusicTimer=null;}for(const node of this.phoneMusicVoices||[])try{node.stop();}catch{}this.phoneMusicVoices?.clear();}
 pause(){this.stopPhoneMusic();this.paused=true;this.carEngine(null);this.rcMotor(0);this.stopPolishLoops();this.recordings?.pause(this.emoteVoice);this.stopMusic();for(const node of this.sequenceNodes||[])try{node.stop();}catch{}for(const voice of this.foleyVoices||[])voice.stop();this.atmosphere?.pause();try{if(this.context?.state==='running')void this.context.suspend().catch(()=>{});}catch{}}
 async resume(){
  const ctx=this.context;if(!ctx)return false;
  this.paused=false;
  try{
   await ctx.resume();
   if(this.context!==ctx)return false;
   if(this.paused){if(ctx.state==='running')await ctx.suspend();return false;}
   if(ctx.state!=='running')return false;
   this.atmosphere?.resume();this.startMusic();this.startPhoneMusic();this.recordings?.setMood(this.threat?'tension':'ambient');
   return true;
  }catch{return false;}
 }
 destroy(){this.phoneMusicWanted=false;this.stopPhoneMusic();this.stopPiano();this.stopEmote();this.pause();this.recordings?.destroy();this.atmosphere?.destroy();this.atmosphere=null;this.ambientNodes=[];if(this.context){void this.context.close().catch(()=>{});this.context=null;}}
}
