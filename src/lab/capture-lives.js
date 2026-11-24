// 3 hearts, plus the visible "0" state: FOUR captures total.
// On reaching 0 the FIRST time, Emy rescues Kitty and grants ONE last life.
// The next capture after that rescue is an alternate ending.
export const STARTING_LIVES=3;
export const LIFE_NOTICE_SECONDS=2.6;

export function checkpointLives(value){
 return Number.isInteger(value)&&value>=1&&value<=STARTING_LIVES?value:STARTING_LIVES;
}

export function captureLoss(current,safe,witnessed,emyRescueUsed=false){
 const lives=Math.max(0,checkpointLives(current)-1);
 const bonus=!!safe&&lives===0&&!emyRescueUsed;
 const next=bonus?1:lives;
 if(!next)return {lives:0,checkpoint:null,emyRescue:false,emyRescueUsed:true,ending:'captured'};
 const checkpoint={...safe,lives:next,emyRescueUsed:emyRescueUsed||bonus};
 if(witnessed&&checkpoint.hide===witnessed)delete checkpoint.hide;
 return {lives:next,checkpoint,emyRescue:bonus,emyRescueUsed:emyRescueUsed||bonus,ending:null};
}

export function lifeSlots(lives){
 // Three original hearts + the "0" last-chance indicator.
 return Array.from({length:STARTING_LIVES+1},(_,index)=>{
  const isZero=index===STARTING_LIVES;
  const state=isZero?(lives===0?'lost':'empty'):
   index<lives?'full':index===lives?'lost':'empty';
  return '<span class="kitty-life '+state+(isZero?' zero-slot':'')+
   '" aria-hidden="true"></span>';
 }).join('');
}
