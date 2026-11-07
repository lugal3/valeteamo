// Original pentatonic welcome motif. Starts ONLY in a direct player gesture.
// Keeps the page offline-capable; no third-party audio, autoplay or copyrighted tracks.
export function playWelcomeMelody(muted:boolean):void{
 if(muted||typeof window==='undefined')return;
 const Audio=window.AudioContext;
 if(!Audio)return;
 let context:AudioContext;
 try{context=new Audio()}catch{return;}
 const now=context.currentTime+.03;
 const master=context.createGain();master.gain.setValueAtTime(.0001,now);
 master.gain.exponentialRampToValueAtTime(.095,now+.05);
 master.gain.setValueAtTime(.095,now+2.35);
 master.gain.exponentialRampToValueAtTime(.0001,now+2.9);
 master.connect(context.destination);
 const melody=[
  [0,392,.19],[.20,440,.16],[.42,523.25,.21],[.70,587.33,.20],
  [1.00,659.25,.24],[1.33,523.25,.16],[1.57,587.33,.16],[1.83,784,.45]
 ];
 for(const [offset,freq,duration] of melody){
  const gain=context.createGain(),osc=context.createOscillator();
  osc.type='sine';osc.frequency.setValueAtTime(freq,now+offset);
  const t=now+offset;
  gain.gain.setValueAtTime(.0001,t);
  gain.gain.exponentialRampToValueAtTime(.35,t+.02);
  gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  osc.connect(gain);gain.connect(master);
  osc.start(t);osc.stop(t+duration+.03);
  osc.onended=()=>{try{osc.disconnect();gain.disconnect()}catch{}};
 }
 void context.resume().catch(()=>{});
 window.setTimeout(()=>{void context.close().catch(()=>{});},3300);
}
