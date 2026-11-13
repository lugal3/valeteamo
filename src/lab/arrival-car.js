import {easeInOut} from './window-intro.js';

export const CAR_ARRIVAL_SECONDS=2.8;
const route=[[17.1,22.2],[11.2,22.2],[10.15,19.3],[10.15,16.65]];

export function carArrivalPose(progress){
 const t=easeInOut(progress),u=1-t;
 const point=axis=>u**3*route[0][axis]+3*u*u*t*route[1][axis]+3*u*t*t*route[2][axis]+t**3*route[3][axis];
 const direction=axis=>u*u*(route[1][axis]-route[0][axis])+2*u*t*(route[2][axis]-route[1][axis])+t*t*(route[3][axis]-route[2][axis]);
 return {x:point(0),z:point(1),yaw:Math.atan2(direction(0),-direction(1))};
}

export function poseArrivalCar(car,progress){
 if(car.progress===progress)return;
 const {x,z,yaw}=carArrivalPose(progress),c=Math.cos(yaw),s=Math.sin(yaw);
 car.progress=progress;
 for(const part of car.parts){
  part.box.x=x+part.x*c-part.z*s;
  part.box.z=z+part.x*s+part.z*c;
  part.box.yaw=part.yaw+yaw;
 }
}

export function installArrivalCar(add){
 const parts=[],part=(id,x,y,z,w,h,d,mat,extra={})=>{
  const box=add('car-'+id,x,y,z,w,h,d,mat,id==='body',{dynamic:true,...extra});
  parts.push({box,x,z,yaw:box.yaw||0});
 };
 const shell={shape:'rounded-box',roundness:.24};
 const paint={...shell,color:[.21,.33,.39]};
 add('car-driveway',10.15,-.008,17.05,2.7,.026,7.8,'stone',false);
 part('body',0,.61,0,1.83,.63,3.84,'carpaint',paint);
 part('bonnet',0,.92,-1.10,1.76,.19,1.44,'carpaint',paint);
 part('boot',0,.91,1.39,1.74,.19,.94,'carpaint',paint);
 part('cabin',0,1.19,.24,1.51,.53,1.98,'glass',{...shell,color:[.15,.23,.31]});
 part('roof',0,1.48,.28,1.45,.14,1.75,'carpaint',paint);
 part('windshield',0,1.21,-.737,1.38,.44,.056,'glass',{...shell,pitch:-.20,color:[.23,.35,.43]});
 part('rear-glass',0,1.22,1.23,1.35,.40,.055,'glass',{...shell,color:[.17,.23,.31]});
 part('grille',0,.71,-1.931,.75,.235,.051,'dark',shell);
 for(let i=-3;i<=3;i++)part('grille-slat-'+i,i*.09,.72,-1.961,.022,.17,.015,'torchmetal');
 for(const side of [-1,1]){
  part('bumper-'+side,0,.46,side*1.90,1.74,.12,.13,'torchmetal',shell);
  part('headlight-'+side,side*.62,.76,-1.935,.35,.18,.052,'torchglass',{...shell,glow:true});
  part('tail-light-'+side,side*.64,.75,1.944,.33,.165,.049,'bow',{...shell,glow:true});
  part('mirror-'+side,side*.89,1.15,-.59,.25,.14,.23,'carpaint',paint);
  part('pillar-'+side,side*.755,1.22,.19,.043,.42,.11,'carpaint',paint);
  part('handle-'+side,side*.92,.86,.12,.035,.045,.17,'torchmetal',shell);
  for(const end of [-1,1]){
   part('wheel-'+side+end,side*.84,.35,end*1.17,.66,.66,.25,'dark',{shape:'cylinder',segments:14,yaw:Math.PI/2});
   part('hub-'+side+end,side*.973,.35,end*1.17,.36,.36,.032,'torchmetal',{shape:'cylinder',segments:10,yaw:Math.PI/2});
  }
 }
 part('plate',0,.58,1.98,.36,.12,.022,'cream',shell);
 const car={parts,progress:null};poseArrivalCar(car,0);return car;
}

export function arrivalCarCamera(progress){
 const car=carArrivalPose(progress),x=8.1,y=1.65,z=14.05;
 return {x,y,z,yaw:Math.atan2(car.x-x,car.z-z),pitch:Math.atan2(.91-y,Math.hypot(car.x-x,car.z-z))};
}
