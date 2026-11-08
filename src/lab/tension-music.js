// An original minor ostinato and low pulse, synthesized locally after a gesture.
export const TENSION_BEAT=.54;
const pattern=[0,7,1,7,0,10,6,1,0,7,3,6,1,8,7,1];
export function scheduleTensionStep(ctx,destination,time,step,tension=.55,onVoice=()=>{}){
 const semitone=pattern[step%pattern.length],frequency=110*Math.pow(2,semitone/12),voices=[];
 function voice(frequency,delay,duration,peak,type='sine'){
  const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  osc.type=type;osc.frequency.value=frequency;filter.type='lowpass';filter.frequency.value=650+tension*850;
  const start=time+delay;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(peak,start+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(filter);filter.connect(gain);gain.connect(destination);osc.start(start);osc.stop(start+duration+.025);
  const v={osc,gain,filter};voices.push(v);onVoice(v);return v;
 }
 voice(frequency,0,.49,.075,'triangle');
 if(step%2===0){voice(55,0,.22,.075);voice(55,.14,.16,.035+tension*.025);}
 if(step%4===2)voice(frequency*4,.08,1.15,.020+tension*.014);
 return voices;
}
