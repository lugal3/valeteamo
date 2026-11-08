// Original room tone and physical foley. One reusable noise buffer; bounded voices.
export function makeNoise(ctx){
 const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);let seed=7919;
 for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=seed/1073741824-1;}return buffer;
}
function transient(ctx,bus,noise,{kind,time=ctx.currentTime,level=.1,pan=0},onEnd=()=>{}){
 const start=Math.max(ctx.currentTime+.004,time),duration=kind==='creak'||kind==='window'?.65:kind==='cloth'?.36:.20;
 const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),stereo=ctx.createStereoPanner();
 source.buffer=noise;filter.type='bandpass';filter.frequency.value={creak:180,window:250,cloth:1300,grass:850,tile:1400,stone:900,wood:320,cricket:3300,drip:1800,latch:1700}[kind]||450;filter.Q.value=kind==='cricket'?10:kind==='creak'?3:.7;stereo.pan.value=pan;
 gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,level),start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
 source.connect(filter);filter.connect(gain);gain.connect(stereo);stereo.connect(bus);source.start(start,(start*1.37)%1);source.stop(start+duration+.02);
 const voice={source,stop(){try{source.stop();}catch{}source.disconnect();filter.disconnect();gain.disconnect();stereo.disconnect();}};
 source.onended=()=>{voice.stop();onEnd(voice);};return voice;
}
export class HouseAtmosphere{
 constructor(ctx,master){
  this.ctx=ctx;this.bus=ctx.createGain();this.bus.connect(master);this.noise=makeNoise(ctx);this.loops=[];this.voices=new Set();this.events=0;this.room='Recibidor y pasillo';this.outdoor=0;this.hidden=false;this.nextEvent=ctx.currentTime+3;this.paused=false;
  for(const [name,frequency,type] of [['wind',260,'lowpass'],['air',650,'bandpass']]){
   const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=this.noise;source.loop=true;filter.type=type;filter.frequency.value=frequency;gain.gain.value=name==='wind'?.012:.014;source.connect(filter);filter.connect(gain);gain.connect(this.bus);source.start();this.loops.push({name,source,filter,gain});
  }
  const source=ctx.createOscillator(),gain=ctx.createGain();source.type='sine';source.frequency.value=57.5;gain.gain.value=0;source.connect(gain);gain.connect(this.bus);source.start();this.loops.push({name:'fridge',source,gain});
 }
 setVolume(value){this.bus.gain.setTargetAtTime(value,this.ctx.currentTime,.10);}
 locate({room,outdoor,hidden}){
  this.room=room;this.outdoor=outdoor;this.hidden=hidden;const stamp=room+'|'+Math.round(outdoor*5)+'|'+hidden;if(stamp===this.stamp)return;this.stamp=stamp;
  for(const loop of this.loops){const level=loop.name==='wind'?.012+.075*outdoor:loop.name==='air'?(hidden?.008:.018)*(1-outdoor*.8):room==='Cocina y comedor'?.030:0;loop.gain.gain.setTargetAtTime(level,this.ctx.currentTime,.65);}
 }
 emit(kind,level=.13,pan=0,time=this.ctx.currentTime){
  if(this.paused||this.voices.size>=8)return;const voice=transient(this.ctx,this.bus,this.noise,{kind,level,pan,time},v=>this.voices.delete(v));this.voices.add(voice);this.events++;this.lastEvent=kind;
 }
 tick(){
  const now=this.ctx.currentTime;if(this.paused||now<this.nextEvent)return;this.nextEvent=now+4+Math.random()*5;
  const kind=this.outdoor>.6?'cricket':this.room==='Baño'?'drip':'creak';
  this.emit(kind,kind==='cricket'?.12:kind==='drip'?.075:this.hidden?.11:.075,(Math.random()-.5)*1.3);
  if(kind==='cricket'){this.emit(kind,.09,.55,now+.17);this.emit(kind,.06,.55,now+.34);}
 }
 pause(){this.paused=true;for(const voice of this.voices)voice.stop();this.voices.clear();}
 resume(){this.paused=false;this.nextEvent=this.ctx.currentTime+2.5;}
 destroy(){this.pause();for(const loop of this.loops){try{loop.source.stop();}catch{}loop.source.disconnect();loop.filter?.disconnect();loop.gain.disconnect();}this.loops=[];this.bus.disconnect();}
}
export function playFoley(ctx,destination,noise,kind,level,pan=0){
 return transient(ctx,destination,noise,{kind,level,pan});
}
