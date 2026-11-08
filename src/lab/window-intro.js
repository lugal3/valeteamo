// Small authored camera shot: exterior -> open garden window -> landing indoors.
export const WINDOW_SHOT_SECONDS=3.45;
export const WINDOW_LANDING=Object.freeze({x:10.20,y:0,z:9.38,yaw:Math.PI,pitch:-.045,eye:1.63});
const clamp01=t=>Math.max(0,Math.min(1,Number(t)||0));
export const easeInOut=t=>{const v=clamp01(t);return v*v*(3-2*v);};
export function windowIntroCamera(progress){
 const t=clamp01(progress),ease=easeInOut(t);
 const y=1.79+(1.63-1.79)*ease+.06*Math.sin(t*Math.PI);
 const z=11.48+(WINDOW_LANDING.z-11.48)*ease;
 return {x:10.20+Math.sin(t*Math.PI)*.025,y,z,
   yaw:Math.PI+.015*Math.sin(t*2*Math.PI),pitch:-.06+.015*ease};
}
export function shouldPlayWindowIntro({demo=false,trial=false,checkpoint='ground',reducedMotion=false}={}){
 return !!demo&&!trial&&checkpoint==='ground'&&!reducedMotion;
}
