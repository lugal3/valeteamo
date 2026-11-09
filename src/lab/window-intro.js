import {windowEntryHands} from './animations/window-entry.js';
// Approach, open the sash, grip the sill, climb through and land behind the sofa.
export const WINDOW_SHOT_SECONDS=6.2;
export const WINDOW_LANDING=Object.freeze({x:2.20,y:0,z:11.0,yaw:Math.PI,pitch:-.045,eye:1.63});
const clamp01=t=>Math.max(0,Math.min(1,Number(t)||0));
export const easeInOut=t=>{const v=clamp01(t);return v*v*(3-2*v);};
const keys=[
 [0,2.35,1.68,14.5,.04], [.18,2.25,1.62,12.95,-.18],
 [.36,2.25,1.88,12.72,-.40], [.56,2.2,2.02,12.30,-.38],
 [.72,2.2,1.85,11.65,-.25], [.86,2.2,1.46,11.12,-.10], [1,2.2,1.63,11,-.045]
];
export function windowIntroCamera(progress){
 const t=clamp01(progress),i=keys.findIndex((k,n)=>n<keys.length-1&&t<=keys[n+1][0]),a=keys[Math.max(0,i)],b=keys[Math.max(0,i)+1],f=easeInOut((t-a[0])/(b[0]-a[0]));
 return {x:a[1]+(b[1]-a[1])*f,y:a[2]+(b[2]-a[2])*f,z:a[3]+(b[3]-a[3])*f,yaw:Math.PI,pitch:a[4]+(b[4]-a[4])*f};
}
export function windowIntroState(progress){
 const t=clamp01(progress);
 return {windowAmount:easeInOut((t-.14)/.24),phase:t<.18?'approach':t<.36?'open':t<.62?'climb':t<.86?'land':'settle',
  hands:windowEntryHands(t)};
}
export function shouldPlayWindowIntro({demo=false,checkpoint='ground',reducedMotion=false}={}){
 return !!demo&&checkpoint==='ground'&&!reducedMotion;
}
