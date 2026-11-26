import {windowEntryHands,windowSashAmount} from './animations/window-entry.js';
// Approach, open the sash, grip the sill, climb through and land behind the sofa.
export const WINDOW_SHOT_SECONDS=10;
export const WINDOW_LANDING=Object.freeze({x:2.20,y:0,z:11.0,yaw:Math.PI,pitch:-.045,eye:1.63});
const clamp01=t=>Math.max(0,Math.min(1,Number(t)||0));
export const easeInOut=t=>{const v=clamp01(t);return v*v*(3-2*v);};
const keys=[
 [0,2.35,1.68,14.5,.04], [.18,3.10,1.62,13.08,-.18],
 [.27,3.10,1.65,13.08,-.23], [.32,2.72,1.72,12.96,-.28], [.39,2.25,1.91,12.72,-.40],
 [.46,2.25,1.68,12.85,-.29], [.53,2.25,1.65,12.85,-.25], [.65,2.2,2.02,12.30,-.38],
 [.72,2.2,1.85,11.65,-.25], [.86,2.2,1.46,11.12,-.10], [1,2.2,1.63,11,-.045]
];
// Monotone cubic Hermite slopes. The camera keeps moving through ordinary
// keys instead of braking to zero at every marker; genuine reversals (slip,
// recovery, landing) still ease to a stop. No overshoot outside authored keys.
const slopes=keys.map((key,i)=>key.slice(1).map((_,j)=>{
 if(i===0||i===keys.length-1)return 0;
 const k=j+1,prev=keys[i-1],next=keys[i+1],h0=key[0]-prev[0],h1=next[0]-key[0];
 const d0=(key[k]-prev[k])/h0,d1=(next[k]-key[k])/h1;
 if(d0*d1<=0)return 0;
 const w0=2*h1+h0,w1=h1+2*h0;
 return (w0+w1)/(w0/d0+w1/d1);
}));
export function windowIntroCamera(progress){
 const t=clamp01(progress),i=Math.max(0,keys.findIndex((k,n)=>n<keys.length-1&&t<=keys[n+1][0]));
 const a=keys[i],b=keys[i+1],span=b[0]-a[0],u=(t-a[0])/span,u2=u*u,u3=u2*u;
 const sample=j=>(2*u3-3*u2+1)*a[j]+(u3-2*u2+u)*span*slopes[i][j-1]+(-2*u3+3*u2)*b[j]+(u3-u2)*span*slopes[i+1][j-1];
 // Small head/neck gestures layer over the collision-tested translation:
 // footfalls on approach, effort during the climb, then checking the room.
 // Every gesture begins and ends at zero velocity, including at handoff.
 const bump=(from,to)=>{const q=clamp01((t-from)/(to-from));return Math.sin(Math.PI*q)**2;};
 const step=.013*bump(.025,.070)-.011*bump(.085,.135);
 const effort=-.022*bump(.35,.41)+.029*bump(.41,.49)-.014*bump(.57,.66);
 const settle=.018*bump(.855,.915)-.009*bump(.915,.97);
 const glance=.32*bump(.08,.37)-.075*bump(.89,.95)+.043*bump(.945,1);
 return {x:sample(1),y:sample(2),z:sample(3),yaw:Math.PI+glance,pitch:sample(4)+step+effort+settle};
}
// Restrained moonlit fill while Kitty is outside and on the sill. Fade
// entirely before normal gameplay; never brighten the full house permanently.
export function windowIntroLighting(progress){
 const t=clamp01(progress),open=easeInOut((t-.12)/.24),close=easeInOut((t-.72)/.28);
 return .10*open*(1-close);
}
export function windowIntroState(progress){
 const t=clamp01(progress);
 return {windowAmount:windowSashAmount(t),phase:t<.18?'approach':t<.36?'open':t<.43?'climb':t<.53?'slip':t<.62?'recover':t<.75?'climb':t<.86?'land':'settle',
  hands:windowEntryHands(t,windowIntroCamera(t))};
}
export function shouldPlayWindowIntro({demo=false,checkpoint='ground',reducedMotion=false}={}){
 return !!demo&&checkpoint==='ground'&&!reducedMotion;
}
