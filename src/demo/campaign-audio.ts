// Share only the mute switch with the existing 3D mixer. Preserve individual
// volume channels and other settings. LP previews never call the writer.
const KEY='valeteamo-lab-sound-v1';
export function readCampaignMute(storage?:Storage):boolean{
 try{const value=JSON.parse((storage??window.localStorage).getItem(KEY)||'{}');return value?.muted===true;}catch{return false;}
}
export function writeCampaignMute(muted:boolean,storage?:Storage):boolean{
 try{
  const target=storage??window.localStorage;
  let value:unknown;
  try{value=JSON.parse(target.getItem(KEY)||'{}');}catch{value={};}
  const settings=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  target.setItem(KEY,JSON.stringify({...settings,muted}));return true;
 }catch{return false;}
}
