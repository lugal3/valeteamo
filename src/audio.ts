// Original music and effects, synthesized locally. start() belongs in a user gesture.
export type MusicTheme='story'|'garden'|'battle'|'final';
const MELODIES:Record<MusicTheme,number[]>={
 story:[261.63,329.63,392,523.25,493.88,392,329.63,293.66,349.23,440,523.25,440,392,349.23,329.63,293.66],
 garden:[329.63,392,523.25,392,440,523.25,587.33,523.25,392,440,523.25,659.25,587.33,523.25,440,392],
 battle:[329.63,392,440,493.88,523.25,440,392,329.63,349.23,440,493.88,587.33,523.25,493.88,440,392],
 final:[261.63,329.63,392,493.88,523.25,659.25,587.33,493.88,440,523.25,587.33,659.25,783.99,659.25,523.25,392]
};
export class Sound {
 ctx?:AudioContext;muted=false;timer?:number;step=0;lastHit=0;theme:MusicTheme='story';
 setTheme(theme:MusicTheme){if(this.theme!==theme){this.theme=theme;this.step=0;}}
 start():Promise<boolean>{
  try{
   const AudioCtor=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   if(!AudioCtor)return Promise.resolve(false);
   if(!this.ctx||this.ctx.state==='closed')this.ctx=new AudioCtor();
   const context=this.ctx;
   const resumed=context.state==='running'?Promise.resolve():context.resume();
   if(this.timer===undefined)this.timer=window.setInterval(()=>this.playStep(),360);
   return resumed.then(()=>context.state==='running').catch(()=>false);
  }catch{return Promise.resolve(false);}
 }
 private playStep(){
  if(!this.ctx||this.muted||this.ctx.state!=='running')return;
  const melody=MELODIES[this.theme],index=this.step++%melody.length,note=melody[index];
  this.tone(note,.28,.035,'triangle');if(index%4===0){this.tone(note/2,.58,.022,'sine');this.tone(note*1.5,.33,.009,'sine');}
 }
 resume(){try{if(this.ctx?.state==='suspended')void this.ctx.resume().catch(()=>{});}catch{}}
 suspend(){try{if(this.ctx?.state==='running')void this.ctx.suspend().catch(()=>{});}catch{}}
 tone(f=440,d=.1,v=.05,type:OscillatorType='sine'){try{if(!this.ctx||this.muted||this.ctx.state!=='running')return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+d);o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+d);}catch{}}
 hit(){const now=this.ctx?.currentTime??0;if(now-this.lastHit<.06)return;this.lastHit=now;this.tone(520,.08,.026,'triangle');this.tone(780,.06,.015);}
 ui(){this.tone(660,.09,.018,'triangle');this.tone(990,.13,.009,'sine');}
 destroy(){if(this.timer!==undefined)clearInterval(this.timer);this.timer=undefined;const context=this.ctx;this.ctx=undefined;if(context&&context.state!=='closed')void context.close().catch(()=>{});}
}
