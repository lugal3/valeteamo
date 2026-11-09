// Original procedural foley. AudioContext-time scheduling, bounded by HouseSound.
// Every voice owns and releases all its sources, filters, envelopes and panner.
export function spookyFoley(ctx,bus,noise,kind,level,pan,onEnd=()=>{}){
 const nodes=[],sources=new Set(),stereo=ctx.createStereoPanner(),now=ctx.currentTime+.006;
 stereo.pan.value=Math.max(-.85,Math.min(.85,pan));stereo.connect(bus);nodes.push(stereo);
 let stopped=false;
 const voice={stop(){if(stopped)return;stopped=true;for(const s of sources){s.onended=null;try{s.stop();}catch{}}sources.clear();for(const n of nodes)n.disconnect();onEnd(voice);}};
 const finish=s=>{sources.delete(s);if(!sources.size)voice.stop();};
 function layer({at=0,duration=.3,f=160,to=f,amp=1,type='sine',q=2,noiseLayer=false,attack=.012}){
  const source=noiseLayer?ctx.createBufferSource():ctx.createOscillator(),gain=ctx.createGain(),start=now+at;
  if(noiseLayer){source.buffer=noise;const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.setValueAtTime(f,start);filter.frequency.exponentialRampToValueAtTime(Math.max(25,to),start+duration);filter.Q.value=q;source.connect(filter);filter.connect(gain);nodes.push(filter);}else{source.type=type;source.frequency.setValueAtTime(f,start);source.frequency.exponentialRampToValueAtTime(Math.max(25,to),start+duration);source.connect(gain);}
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,level*amp),start+Math.min(attack,duration*.4));gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  gain.connect(stereo);nodes.push(source,gain);sources.add(source);source.onended=()=>finish(source);source.start(start);source.stop(start+duration+.015);
 }
 const jitter=.94+Math.random()*.12;
 if(kind==='door-open'||kind==='door-close'||kind==='door'){
  const closing=kind==='door-close';
  layer({f:closing?510:270,to:closing?155:720,amp:.48,duration:.54,type:'triangle',attack:.045});
  layer({f:closing?730:430,to:closing?270:980,amp:.14,duration:.47,type:'sine',at:.035,attack:.05});
  layer({f:340*jitter,to:135,amp:1.1,duration:.55,noiseLayer:true,q:5});
  layer({at:closing?.39:0,f:closing?105:145,to:47,amp:closing?1.35:.45,duration:.19,type:'triangle'});
  layer({at:closing?.41:.025,f:1900,to:800,amp:.65,duration:.075,noiseLayer:true});
 }else if(kind==='floor-groan'){
  layer({f:128*jitter,to:67,amp:.65,duration:1.05,type:'triangle',attack:.17});
  layer({f:135*jitter,to:71,amp:.22,duration:.92,at:.065,attack:.2});
  layer({f:235,to:95,amp:.75,duration:.95,noiseLayer:true,q:6,attack:.11});
  layer({f:720,to:210,amp:.22,duration:.24,noiseLayer:true,q:4});
 }else if(kind==='stair'||kind==='wood'){
  layer({f:kind==='stair'?115:140,to:42,amp:kind==='stair'?1:.7,duration:.16,type:'triangle'});
  layer({f:kind==='stair'?260:420,to:125,amp:.9,duration:.18,noiseLayer:true,q:1.2});
  if(kind==='stair')layer({at:.055,f:390*jitter,to:165,amp:.25,duration:.34,type:'triangle',attack:.025});
 }else if(kind==='latch')layer({f:1750,to:650,amp:.8,duration:.12,noiseLayer:true,q:2.5});
 return voice;
}
