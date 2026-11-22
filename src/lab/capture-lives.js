// Only a living run can have a checkpoint. A third capture clears it instead.
export const STARTING_LIVES=3;
export const LIFE_NOTICE_SECONDS=2.6;

export function checkpointLives(value){
 return Number.isInteger(value)&&value>=1&&value<=STARTING_LIVES?value:STARTING_LIVES;
}

export function captureLoss(current,safe,witnessed){
 const lives=checkpointLives(current)-1;
 if(!lives)return {lives,checkpoint:null};
 const checkpoint={...safe,lives};
 if(witnessed&&checkpoint.hide===witnessed)delete checkpoint.hide;
 return {lives,checkpoint};
}

export function lifeSlots(lives){
 return Array.from({length:STARTING_LIVES},(_,index)=>{
  const state=index<lives?'full':index===lives?'lost':'empty';
  return '<span class="kitty-life '+state+'" aria-hidden="true"></span>';
 }).join('');
}
