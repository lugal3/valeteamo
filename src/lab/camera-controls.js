// VALETEAMO V4 camera model — the user's drag direction is the viewing direction.
// No browser dependencies: identical math for desktop pointer, touchscreen and tests.
export const MAX_PITCH=1.10;
export const CAMERA_SETTINGS_KEY='valeteamo-house-camera-v4';
// Previous key and its factory default, used for one-time migration only.
const PREV_CAMERA_SETTINGS_KEY='valeteamo-house-camera-v3';
const PREV_DEFAULT_SENSITIVITY=0.82;
export const DEFAULT_CAMERA_SETTINGS=Object.freeze({sensitivity:1.05,invertX:false});
export const SENSITIVITY_MIN=0.35,SENSITIVITY_MAX=2.2,SENSITIVITY_STEP=0.05;
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function applyLookDelta(target,dx,dy,sensitivity=1,invertX=false){
 const sx=clamp(Number(sensitivity)||1,SENSITIVITY_MIN,SENSITIVITY_MAX);
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
  // v4 key takes priority.
  const v4=JSON.parse(storage?.getItem(CAMERA_SETTINGS_KEY)||'null');
  if(v4!==null){
   return {sensitivity:clamp(Number(v4?.sensitivity)||DEFAULT_CAMERA_SETTINGS.sensitivity,SENSITIVITY_MIN,SENSITIVITY_MAX),
     invertX:v4?.invertX===true};
  }
  // Migrate from v3: treat factory default (0.82) as "never customised" → use new default.
  const v3=JSON.parse(storage?.getItem(PREV_CAMERA_SETTINGS_KEY)||'null');
  const prevSens=Number(v3?.sensitivity);
  const sens=Number.isFinite(prevSens)&&Math.abs(prevSens-PREV_DEFAULT_SENSITIVITY)>1e-9
   ?clamp(prevSens,SENSITIVITY_MIN,SENSITIVITY_MAX)
   :DEFAULT_CAMERA_SETTINGS.sensitivity;
  return {sensitivity:sens,invertX:v3?.invertX===true};
 }catch{return {...DEFAULT_CAMERA_SETTINGS};}
}
export function writeCameraSettings(storage,settings){
 try{storage?.setItem(CAMERA_SETTINGS_KEY,JSON.stringify({sensitivity:clamp(settings.sensitivity,SENSITIVITY_MIN,SENSITIVITY_MAX),invertX:!!settings.invertX}));return true;}catch{return false;}
}
