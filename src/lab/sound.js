// Soft, original procedural sounds. No external audio files or third-party tracks.
const KEY='valeteamo-lab-sound-v1';
const defaults={muted:false,ambient:.40,effects:.68};
export class HouseSound {
 constructor(){try{this.settings={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{this.settings={...defaults}}this.context=null;this.ambientNodes=[];this.paused=false;}
 save(){try{localStorage.setItem(KEY,JSON.stringify(this.settings))}catch{}}
 async start(){
  if(!this.context){
   const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
   this.context=new C();this.master=this.context.createGain();this.master.gain.value=.45;this.master.connect(this.context.destination);
   this.startAmbience();
  }
  try{await this.context.resume();this.paused=false;return this.context.state==='running';}catch{return false;}
 }
 startAmbience(){
  if(!this.context)return;const ctx=this.context;
  // Calm low drone and filtered room air, intentionally quiet and non-looping percussively.
  for(const [freq,gain] of [[65,.024],[98,.012],[131,.008]]){
   const osc=ctx.createOscillator(),low=ctx.createBiquadFilter(),vol=ctx.createGain();
   osc.type='sine';osc.frequency.value=freq;low.type='lowpass';low.frequency.value=380;
   vol.gain.value=this.settings.muted?0:gain*this.settings.ambient;
   osc.connect(low);low.connect(vol);vol.connect(this.master);osc.start();
   this.ambientNodes.push({osc,vol,gain});
  }
 }
 applySettings(){for(const {vol,gain} of this.ambientNodes)vol.gain.setTargetAtTime(this.settings.muted?0:gain*this.settings.ambient,this.context.currentTime,.09);this.save();}
 set(kind,value){this.settings[kind]=kind==='muted'?Boolean(value):Math.max(0,Math.min(1,Number(value)||0));if(this.context)this.applySettings();else this.save();}
 // Simple location-dependent stereo and attenuation, including room/floor obstruction.
 effect(kind,origin,listener,occluded=false){
  const ctx=this.context;if(!ctx||this.paused||ctx.state!=='running'||this.settings.muted)return;
  const distance=origin?Math.hypot(origin.x-listener.x,origin.y-listener.y,origin.z-listener.z):0;
  const atten=origin?1/(1+.15*distance*distance):1;
  const floorMask=origin&&Math.abs(origin.y-listener.y)>1.85?.55:1;
  const gain=.20*this.settings.effects*atten*floorMask*(occluded?.38:1);
  if(gain<.0007)return;
  const now=ctx.currentTime,vol=ctx.createGain(),pan=ctx.createStereoPanner();
  const yaw=listener.yaw||0,dx=origin?origin.x-listener.x:0,dz=origin?origin.z-listener.z:0;
  pan.pan.value=Math.max(-.85,Math.min(.85,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(1,distance)));
  vol.connect(pan);pan.connect(this.master);
  const oscillator=ctx.createOscillator();oscillator.type=kind==='footstep'?'triangle':kind==='pickup'?'sine':'sawtooth';
  const base={footstep:95,door:185,drawer:215,pickup:490,light:660,note:380,creak:78,click:425,hide:160,bed:120}[kind]||280;
  const variation=kind==='footstep'?(Math.random()-.5)*20:(Math.random()-.5)*8;
  oscillator.frequency.setValueAtTime(base+variation,now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(30,(base+variation)*.7),now+.13);
  const duration=kind==='creak'?.34:kind==='footstep'?.12:.18;
  vol.gain.setValueAtTime(.0001,now);vol.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),now+.012);
  vol.gain.exponentialRampToValueAtTime(.0001,now+duration);
  oscillator.connect(vol);oscillator.start(now);oscillator.stop(now+duration+.02);
  oscillator.onended=()=>{oscillator.disconnect();vol.disconnect();pan.disconnect();};
 }
 pause(){this.paused=true;try{if(this.context?.state==='running')void this.context.suspend();}catch{}}
 resume(){if(!this.context)return;this.paused=false;try{void this.context.resume().catch(()=>{})}catch{}}
 destroy(){this.paused=true;for(const {osc} of this.ambientNodes){try{osc.stop();osc.disconnect()}catch{}}this.ambientNodes=[];if(this.context){void this.context.close().catch(()=>{});this.context=null;}}
}
