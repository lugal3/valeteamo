import {deviceTime} from './device-time.js';

export function installWallClock(add,x,y,z){
 const origin={x,y,z:z+.057};
 add('wall-clock-case',x,y,z,.70,.70,.095,'wood',false,{shape:'cylinder',segments:28});
 add('wall-clock-dial',x,y,z+.048,.603,.603,.016,'paper',false,{shape:'cylinder',segments:28,color:[.85,.78,.64]});
 for(let i=0;i<60;i++){
  const angle=i*Math.PI/30,major=i%5===0,radius=major?.251:.268;
  add('wall-clock-mark-'+i,x-Math.sin(angle)*radius,y+Math.cos(angle)*radius,z+.058,
   major?.018:.007,major?.052:.018,.007,'dark',false,{roll:angle});
 }
 const hands=[[.148,.024,'dark'],[.209,.017,'dark'],[.234,.009,'bow']].map(([length,width,mat],i)=>{
  const hand=add('wall-clock-hand-'+i,x,y+length/2,z+.069+i*.010,width,length,.009,mat,false,{dynamic:true});
  return {hand,length};
 });
 add('wall-clock-pin',x,y,z+.097,.038,.038,.012,'brass',false,{shape:'cylinder',segments:10});
 const clock={...origin,hands,second:-1};
 updateWallClock(clock);
 return clock;
}

export function updateWallClock(clock,date=deviceTime()){
 const second=Math.floor(date.getTime()/1000);
 if(second===clock.second)return false;
 clock.second=second;
 const minutes=date.getMinutes()+date.getSeconds()/60;
 const angles=[(date.getHours()%12+minutes/60)/12,minutes/60,date.getSeconds()/60];
 clock.hands.forEach(({hand,length},i)=>{
  const angle=angles[i]*Math.PI*2;
  hand.x=clock.x-Math.sin(angle)*length/2;
  hand.y=clock.y+Math.cos(angle)*length/2;
  hand.roll=angle;
 });
 return true;
}
