// Original voice synthesized through moving resonators and a saturated motor.
// The buffer is built once per house and played through the alerts fader.
export function buildCaptureScream(ctx){
 const rate=24000,duration=.86;
 const buffer=ctx.createBuffer(1,Math.round(duration*rate),rate);
 const data=buffer.getChannelData(0);
 let phase=0,motor=0,seed=5167,previousNoise=0,body=0,edge=0;
 let formant1=0,formant2=0,high1=0,high2=0;
 const resonance=.94,resonanceHigh=.86,tau=Math.PI*2;
 for(let i=0;i<data.length;i++){
  const t=i/rate;
  const attack=Math.min(1,t/.010),release=Math.min(1,(duration-t)/.17);
  const profile=(.86+.14*Math.exp(-12*t))*Math.exp(-1.65*t);
  const upward=1-Math.exp(-38*t),breakup=Math.sin(tau*43*t)*.044;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const noise=seed/2147483648-1;
  const grit=(noise-previousNoise*.78)*.23;
  previousNoise=noise;
  phase+=tau*(326+247*upward-210*t)*(1+breakup)/rate;
  motor+=tau*(97+48*Math.exp(-19*t)-42*t)/rate;
  const pulse=Math.sin(phase+.45*Math.sin(motor))+.32*Math.sin(phase*2)-.29*Math.sin(phase*3);
  const formant=tau*(1030+350*upward-577*t)/rate;
  const hiss=tau*(2390-640*t+166*Math.sin(tau*7*t))/rate;
  body=(pulse+grit)*.075+2*resonance*Math.cos(formant)*formant1-resonance**2*formant2;
  edge=(.23*pulse+grit)*.33+2*resonanceHigh*Math.cos(hiss)*high1-resonanceHigh**2*high2;
  formant2=formant1;formant1=body;high2=high1;high1=edge;
  const growl=Math.sin(motor+.54*Math.sin(phase*.33))*(.32+.20*Math.exp(-11*t));
  const sputter=.77+.23*Math.sin(tau*51*t);
  data[i]=.95*attack*release*profile*Math.tanh(2.25*(.59*pulse+.73*body+1.15*edge+growl+grit)*sputter);
 }
 return buffer;
}
