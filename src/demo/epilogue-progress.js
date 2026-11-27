// The epilogue belongs to the existing rescue save, not a second independent
// flag. A fresh game or an older house checkpoint cannot unlock a good ending.
import {RESCUE_SAVE_KEY,parseRescue} from './progression.js';
export const EPILOGUE_STAGES=Object.freeze(['outside','return-path','reunion','celebration','complete']);
export const EPILOGUE_START=Object.freeze({version:1,stage:'outside'});
export function parseEpilogue(raw){
 const rescue=parseRescue(raw);
 if(!rescue.rescued)return null;
 try{
  const record=JSON.parse(raw),v=record.epilogue;
  if(v?.version===1&&EPILOGUE_STAGES.includes(v.stage))return {version:1,stage:v.stage};
 }catch{}
 // Existing completed rescue saves resume at the new epilogue entrance.
 return {...EPILOGUE_START};
}
export function advanceEpilogue(state,next){
 if(!state||state.version!==1)return state;
 const index=EPILOGUE_STAGES.indexOf(state.stage);
 if(index<0||index===EPILOGUE_STAGES.length-1||EPILOGUE_STAGES[index+1]!==next)return state;
 return {version:1,stage:next};
}
// Snapshot lease: a reset, a newer tab, or a changed rescue record invalidates
// this writer. Tests use their own in-memory session and never call this API.
export function openEpilogueSave(storage=globalThis.localStorage){
 try{
  let raw=storage.getItem(RESCUE_SAVE_KEY),state=parseEpilogue(raw);
  if(!state)return undefined;
  return {
   get state(){return {...state};},
   advance(next){
    try{
     if(storage.getItem(RESCUE_SAVE_KEY)!==raw)return false;
     const advanced=advanceEpilogue(state,next);
     if(advanced===state)return false;
     const record={...JSON.parse(raw),epilogue:advanced};
     const encoded=JSON.stringify(record);
     storage.setItem(RESCUE_SAVE_KEY,encoded);
     raw=encoded;state=advanced;return true;
    }catch{return false;}
   }
  };
 }catch{return undefined;}
}

export function hasCompletedEpilogue(storage){try{return parseEpilogue((storage??globalThis.localStorage).getItem(RESCUE_SAVE_KEY))?.stage==='complete';}catch{return false;}}
