import {CAMERA_SETTINGS_KEY} from './camera-controls.js';

export const DEFAULT_HUD=Object.freeze({anchor:'bottom',size:44,x:0,y:0,opacity:.55});
const clamp=(v,a,b,f)=>Math.max(a,Math.min(b,Number.isFinite(Number(v))?Number(v):f));
export function normalizeHUD(v={}){
 v=v&&typeof v==='object'?v:{};
 return {anchor:['left','right','bottom','top'].includes(v.anchor)?v.anchor:DEFAULT_HUD.anchor,size:clamp(v.size,40,64,44),x:clamp(v.x,-180,180,0),y:clamp(v.y,-120,120,0),opacity:clamp(v.opacity,.25,.9,.55)};
}
export function hudRect(value,width,height,count=3){
 const v=normalizeHUD(value),vertical=v.anchor==='left'||v.anchor==='right';
 const slot=Math.min(v.size,Math.max(30,((vertical?height-92:width-30)-(count-1)*4)/count),Math.max(40,(height-92)/3-4));
 const length=slot*count+(count-1)*4,w=(vertical?slot:length)+14,h=(vertical?length:slot)+14;
 let x=v.anchor==='left'?12:v.anchor==='right'?width-w-12:(width-w)/2;
 let y=v.anchor==='top'?64:v.anchor==='bottom'?height-h-12:Math.max(70,(height-h)*.43);
 return {x:Math.round(Math.max(8,Math.min(width-w-8,x+v.x))),y:Math.round(Math.max(60,Math.min(height-h-8,y+v.y))),w,h,slot,vertical};
}
export function readHUD(storage){
 try{
  const settings=JSON.parse(storage?.getItem(CAMERA_SETTINGS_KEY)||'{}'),saved=settings.hud;
  if(!settings.hudVersion&&saved?.anchor==='left'&&Object.keys(DEFAULT_HUD).every(key=>key==='anchor'||saved[key]===DEFAULT_HUD[key]))return {...DEFAULT_HUD};
  return normalizeHUD(saved);
 }catch{return {...DEFAULT_HUD};}
}
export function writeHUD(storage,value){try{let old;try{old=JSON.parse(storage?.getItem(CAMERA_SETTINGS_KEY)||'{}');}catch{old={};}storage?.setItem(CAMERA_SETTINGS_KEY,JSON.stringify({...old,hud:normalizeHUD(value),hudVersion:2}));return true;}catch{return false;}}
