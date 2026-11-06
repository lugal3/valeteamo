// All music and effects are original Web Audio synthesis, unlocked by Jugar.
export class Sound {
 ctx?:AudioContext;muted=false;timer?:number;step=0;lastHit=0;
 start(){try{this.ctx??=new AudioContext();void this.ctx.resume().catch(()=>{});if(!this.timer)this.timer=window.setInterval(()=>{const melody=[261.63,329.63,392,329.63,293.66,349.23,440,392];this.tone(melody[this.step++%8],.4,.022);if(this.step%4===1)this.tone(melody[(this.step-1)%8]/2,.65,.017);},460);}catch{}}
 resume(){try{void this.ctx?.resume().catch(()=>{});}catch{}}
 suspend(){try{void this.ctx?.suspend().catch(()=>{});}catch{}}
 tone(f=440,d=.1,v=.05,type:OscillatorType='sine'){try{if(!this.ctx||this.muted||this.ctx.state!=='running')return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+d);o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+d);}catch{}}
 hit(){const now=this.ctx?.currentTime??0;if(now-this.lastHit<.06)return;this.lastHit=now;this.tone(520,.08,.026,'triangle');this.tone(780,.06,.015);}
 destroy(){clearInterval(this.timer);void this.ctx?.close().catch(()=>{});}
}
