// VALETEAMO V3 camera model — the user's drag direction is the viewing direction.
// No browser dependencies: identical math for desktop pointer, touchscreen and tests.
export const MAX_PITCH=1.10;
export const CAMERA_SETTINGS_KEY='valeteamo-house-camera-v3';
export const DEFAULT_CAMERA_SETTINGS=Object.freeze({sensitivity:0.82,invertX:false});
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function applyLookDelta(target,dx,dy,sensitivity=1,invertX=false){
 const sx=clamp(Number(sensitivity)||1,.35,2.2);
 const x=clamp(Number(dx)||0,-160,160);
 const y=clamp(Number(dy)||0,-160,160);
 return {yaw:target.yaw+(invertX?-1:1)*x*.00335*sx,
  pitch:clamp(target.pitch-y*.00335*sx,-MAX_PITCH,MAX_PITCH)};
}
export function followLook(current,target,delta,response=18){
 const amount=1-Math.exp(-Math.max(0,Number(response)||18)*clamp(delta,0,.1));
 return {yaw:current.yaw+(target.yaw-current.yaw)*amount,
  pitch:clamp(current.pitch+(target.pitch-current.pitch)*amount,-MAX_PITCH,MAX_PITCH)};
}
export function readCameraSettings(storage){
 try{
  const raw=JSON.parse(storage?.getItem(CAMERA_SETTINGS_KEY)||'null');
  return {sensitivity:clamp(Number(raw?.sensitivity)||DEFAULT_CAMERA_SETTINGS.sensitivity,.35,2.2),
    invertX:raw?.invertX===true};
 }catch{return {...DEFAULT_CAMERA_SETTINGS};}
}
export function writeCameraSettings(storage,settings){
 try{storage?.setItem(CAMERA_SETTINGS_KEY,JSON.stringify({sensitivity:clamp(settings.sensitivity,.35,2.2),invertX:!!settings.invertX}));return true;}catch{return false;}
}
