// Demo-only progress, independent of the original birthday chapter save.
export const RESCUE_SAVE_KEY='valeteamo-rescue-v2';
export const RESCUE_VERSION=2;
export const START={version:RESCUE_VERSION,phase:'garden',heart:false,abducted:false,trail:false,house:false,rescued:false};
export function parseRescue(raw){
 try {const v=JSON.parse(raw);if(v?.version!==RESCUE_VERSION)return {...START};
 const heart=v.heart===true,abducted=heart&&v.abducted===true,trail=abducted&&v.trail===true,house=trail&&v.house===true,rescued=house&&v.rescued===true;
 return {version:RESCUE_VERSION,phase:rescued?'end':house?'house':trail?'trail':abducted?'abduction':heart?'heart':'garden',heart,abducted,trail,house,rescued};
 }catch{return {...START};}
}
export function advanceRescue(state,event){
 const s={...state};
 if(event==='heart'&&s.phase==='garden'){s.heart=true;s.phase='heart';}
 if(event==='abduction'&&s.heart&&s.phase==='heart'){s.abducted=true;s.phase='abduction';}
 if(event==='trail'&&s.abducted&&s.phase==='abduction'){s.trail=true;s.phase='trail';}
 if(event==='house'&&s.trail&&s.phase==='trail'){s.house=true;s.phase='house';}
 if(event==='rescue'&&s.house&&s.phase==='house'){s.rescued=true;s.phase='end';}
 return s;
}
export function loadRescue(){try{return parseRescue(localStorage.getItem(RESCUE_SAVE_KEY));}catch{return {...START};}}
export function saveRescue(s){try{localStorage.setItem(RESCUE_SAVE_KEY,JSON.stringify(s));return true;}catch{return false;}}
export function resetRescue(){try{localStorage.removeItem(RESCUE_SAVE_KEY);}catch{}}

export function openRescueHouseSave(){
 try{
  const storage=globalThis.localStorage;
  let raw=storage.getItem(RESCUE_SAVE_KEY);
  if(parseRescue(raw).phase!=='house')return;
  function write(record){
   try{
    // A newer checkpoint, a reset or the ending in another tab takes precedence.
    if(storage.getItem(RESCUE_SAVE_KEY)!==raw)return false;
    const next=JSON.stringify(record);
    if(next===raw)return false;
    storage.setItem(RESCUE_SAVE_KEY,next);
    raw=next;return true;
   }catch{return false;}
  }
  return {
   checkpoint:JSON.parse(raw).houseCheckpoint,
   save(checkpoint){
    const record=JSON.parse(raw);
    if(record.rescued===true)return false;
    if(checkpoint===null)delete record.houseCheckpoint;
    else record.houseCheckpoint=checkpoint;
    return write(record);
   },
   finish(){write(advanceRescue(parseRescue(raw),'rescue'));}
  };
 }catch{}
}
