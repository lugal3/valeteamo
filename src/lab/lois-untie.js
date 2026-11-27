// Continuous seated, freed and standing performance on the rescue clock.
const clamp=x=>Math.min(1,Math.max(0,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export const UNTIE_BEATS=Object.freeze({reach:.55,loosen:1.2,release:2.25,drop:2.82,stand:3.05,ready:4.40,finish:4.65});
export function sampleLoisUntie(age=0){
 const b=UNTIE_BEATS,t=Math.max(0,Math.min(b.finish,Number.isFinite(age)?age:0));
 const rise=ease((t-b.stand)/(b.ready-b.stand)),tied=1-ease((t-b.release)/.52);
 return {t,rise,seated:1-rise,tied,lean:ease((t-2.80)/.42)*(1-ease((t-3.75)/.55)),
 reach:ease(t/b.reach)*(1-ease((t-b.release)/.44)),loosen:ease((t-b.loosen)/(b.release-b.loosen)),
 fall:ease((t-b.release)/(b.drop-b.release)),
 stage:t<b.reach?'approach':t<b.loosen?'grasp':t<b.release?'loosen':t<b.stand?'free':t<b.ready?'stand':'ready'};
}
