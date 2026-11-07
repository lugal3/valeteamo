import type {CharacterId} from './characters';
export const SAVE_KEY='valeteamo-story-v1';
export type StoryProgress={version:1,index:number,unlocked:number,character:CharacterId,muted:boolean,started:boolean,answers:Record<string,number>};
export function initialProgress():StoryProgress{return {version:1,index:0,unlocked:0,character:'kitty',muted:true,started:false,answers:{}};}
export function parseProgress(raw:string|null,count:number):StoryProgress{
 const fallback=initialProgress();if(!raw||count<1)return fallback;
 try{const v=JSON.parse(raw);if(v?.version!==1||!Number.isInteger(v.index)||!Number.isInteger(v.unlocked))return fallback;
  const unlocked=Math.max(0,Math.min(count-1,v.unlocked));
  const entries=v.answers&&typeof v.answers==='object'&&!Array.isArray(v.answers)?Object.entries(v.answers):[];
  const answers=Object.fromEntries(entries.flatMap(([key,value])=>key.length<=80&&typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<100?[[key,value] as [string,number]]:[]));
  return {version:1,index:Math.max(0,Math.min(unlocked,v.index)),unlocked,character:v.character==='louis'?'louis':'kitty',muted:typeof v.muted==='boolean'?v.muted:true,started:v.started===true,answers};
 }catch{return fallback;}
}
export function advance(p:StoryProgress,count:number):StoryProgress{const index=Math.min(count-1,p.index+1);return {...p,index,unlocked:Math.max(p.unlocked,index)};}
export function goTo(p:StoryProgress,index:number):StoryProgress{return {...p,index:Math.max(0,Math.min(p.unlocked,index))};}
export function readProgress(count:number):StoryProgress{try{return parseProgress(localStorage.getItem(SAVE_KEY),count);}catch{return initialProgress();}}
export function writeProgress(progress:StoryProgress):boolean{try{localStorage.setItem(SAVE_KEY,JSON.stringify(progress));return true;}catch{return false;}}
