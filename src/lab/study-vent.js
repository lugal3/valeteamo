export const VENT_X=3.76, VENT_BASE=1.98, VENT_FACE=.13;

// The same tool geometry is used on the desk, in Kitty's hand and at each screw.
export function screwdriverModel(piece){
 return [
  piece('grip',0,0,.23,.075,.076,.16,'pink',{shape:'cylinder',segments:8,color:[.73,.32,.43]}),
  piece('rib',0,.036,.23,.022,.012,.12,'brass',{}),
  piece('collar',0,0,.145,.05,.05,.033,'brass',{shape:'cylinder'}),
  piece('shaft',0,0,.078,.016,.016,.12,'torchmetal',{}),
  piece('tip',0,0,.012,.024,.008,.025,'torchmetal',{})
 ];
}

export function installVentCover(add){
 const parts=[];
 const piece=(id,x,y,z,w,h,d,pitch=0,mat='torchmetal',screw=-1,extra={})=>{
  const box=add('vent-cover-'+id,VENT_X+x,VENT_BASE+.31+y,VENT_FACE+z,w,h,d,mat,false,{dynamic:true,pitch,...extra});
  parts.push({box,x,y,z,pitch,screw});
 };
 for(const side of [-1,1]){
  piece('side'+side,side*.38,0,0,.065,.59,.052);
  piece('edge'+side,0,side*.27,0,.72,.05,.052);
 }
 for(let i=0;i<6;i++)piece('louver'+i,0,-.20+i*.078,0,.71,.048,.07,-.38);
 for(let i=0;i<4;i++){
  const x=(i%2?1:-1)*.378,y=(i<2?1:-1)*.255;
  piece('screw'+i,x,y,.034,.048,.048,.018,0,'brass',i,{shape:'cylinder',segments:10});
  piece('slot'+i,x,y,.045,.031,.008,.003,0,'dark',i);
 }
 return parts;
}

const clamp=x=>Math.max(0,Math.min(1,x));
export function poseVentCover(vent,amount){
 vent.coverAmount=amount;
 const drop=clamp((amount-.76)/.24),t=drop*drop*(3-2*drop),angle=t*Math.PI/2,c=Math.cos(angle),s=Math.sin(angle);
 for(const {box,x,y,z,pitch,screw} of vent.cover){
  const turns=screw<0?0:clamp(amount/.19-screw);
  box.roll=turns*Math.PI*4;
  box.x=VENT_X+x-.52*t;
  box.y=(VENT_BASE+.31)*(1-t)+.065*t+y*c-z*s;
  box.z=VENT_FACE+.55*t+y*s+z*c+turns*.026;
  box.pitch=pitch+angle;
 }
 const index=Math.min(3,Math.floor(amount/.19)),phase=clamp(amount/.19-index);
 const next=Math.min(3,index+1),mix=clamp((phase-.80)/.20);
 const lateral=(index%2?1:-1)*(1-mix)+(next%2?1:-1)*mix;
 const vertical=(index<2?1:-1)*(1-mix)+(next<2?1:-1)*mix;
 for(const b of vent.driver||[]){
  const [x,y,z]=b.offset,roll=phase*Math.PI*4;
  b.x=VENT_X+lateral*.378+x*Math.cos(roll)-y*Math.sin(roll);
  b.y=amount>0&&amount<.76?VENT_BASE+.31+vertical*.255+x*Math.sin(roll)+y*Math.cos(roll):-100;
  b.z=VENT_FACE+.044+z+phase*.026+.10*Math.abs(2*phase-1)**6;
  b.roll=roll;
 }
}
export function removeVentCover(vent,reduced,equipped){
 if(vent.unlatched||equipped!=='screwdriver')return false;
 vent.unlatched=true;
 if(reduced)poseVentCover(vent,1);
 return true;
}
export function advanceVentCover(vent,dt){
 if(vent.unlatched&&vent.coverAmount<1)poseVentCover(vent,Math.min(1,vent.coverAmount+dt/3.4));
}
