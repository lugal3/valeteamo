import {groundHeight} from './world.js';
import {navigate} from './navigation.js';

const ROUTE=Object.freeze([
 {x:8.55,z:13.74},{x:8.55,z:12.4},{x:8.55,z:10.2},
 {x:8.55,z:8.0},{x:8.55,z:5.6},{x:8.55,z:4.2},
 {x:8.55,z:2.65},{x:9.5,z:2.2},{x:10.4,z:2.8},
 {x:11.20,z:4.08},{x:11.82,z:4.08}
]);
export const LOUIS_HIDING_SPOT=Object.freeze({x:11.82,y:0,z:4.08});
export function createLouisEscape(world){
 const point=ROUTE[0],y=groundHeight(point.x,point.z,-3.55,true);
 return {kind:'louis-companion',id:'louis-escape',label:'Louis rescatado',x:point.x,y,z:point.z,yaw:Math.PI,phase:'climb',waypoint:1,age:0,step:0,crouch:0,concealed:false,interactable:false,walk:0,world};
}
export function updateLouisEscape(louis,dt,kitty=null){
 if(!louis||dt<=0)return null;
 louis.age+=dt;
 if(louis.phase==='climb'){
  const target=ROUTE[louis.waypoint];
  if(!target){louis.phase='hide';louis.age=0;return 'arrived';}
  const dx=target.x-louis.x,dz=target.z-louis.z,d=Math.hypot(dx,dz);
  if(d<.055){louis.waypoint++;return null;}
  const step=Math.min(d,dt*2.10);
  louis.x+=dx/d*step;louis.z+=dz/d*step;
  louis.y=groundHeight(louis.x,louis.z,louis.y,true);
  louis.yaw=Math.atan2(dx,dz);
  louis.walk+=step;
 }else if(louis.phase==='hide'){
  louis.crouch=Math.min(1,louis.age/1.1);
  if(louis.age>=1.5){louis.phase='hidden';louis.concealed=true;return 'hidden';}
 }else if(louis.phase==='follow'&&kitty){
  const behind={x:kitty.x-Math.sin(kitty.yaw)*.90,z:kitty.z-Math.cos(kitty.yaw)*.90};
  const dx=behind.x-louis.x,dz=behind.z-louis.z,d=Math.hypot(dx,dz);
  if(d>.55&&Math.abs(kitty.y-louis.y)<.7){
   const step=Math.min(d-.47,dt*3),body={x:louis.x,y:louis.y,z:louis.z};
   const moved=navigate(body,louis.world,dx/d*step,dz/d*step,1.60);
   louis.x=body.x;louis.y=body.y;louis.z=body.z;louis.walk+=moved;louis.yaw=Math.atan2(dx,dz);
  }
 }
 return null;
}
export function freeLouis(louis){
 if(louis?.phase!=='hidden')return false;
 louis.phase='follow';louis.concealed=false;louis.crouch=0;
 return true;
}
export function louisCamera(louis){
 return {x:louis.x-1.3,y:louis.y+1.48,z:louis.z+1.9,
  yaw:Math.atan2(1.3,-1.9),pitch:-.20};
}
export function louisModel(piece){
 const parts=[],add=(id,x,y,z,w,h,d,mat,color,extra={})=>parts.push(piece(id,x,y,z,w,h,d,mat,{color,...extra}));
 const skin=[.83,.62,.52],shade=[.70,.48,.41],hair=[.28,.17,.13],light=[.36,.23,.17],eye=[.29,.51,.68],shirt=[.69,.72,.75],jeans=[.25,.34,.44],shoe=[.93,.88,.81];
 const round={shape:'round',segments:12,rings:8},soft={shape:'rounded-box',roundness:.28,segments:8,rings:5};
 add('torso',0,.85,0,.45,.52,.29,'plaster',shirt,soft);
 add('collar',0,1.135,.04,.25,.09,.20,'cream',[.89,.84,.78],soft);
 add('neck',0,1.185,.045,.14,.20,.14,'paper',skin,round);
 add('face',0,1.44,0,.337,.39,.30,'paper',skin,round);
 add('jaw',0,1.315,.058,.263,.149,.215,'paper',skin,round);
 add('chin',0,1.28,.135,.17,.083,.10,'paper',skin,round);
 add('nose',0,1.408,.176,.073,.09,.091,'paper',skin,round);
 add('mouth',0,1.326,.188,.092,.014,.013,'bow',[.51,.26,.25],soft);
 add('lower-lip',0,1.302,.182,.08,.014,.013,'paper',shade,round);
 add('hair-back',0,1.578,-.035,.354,.245,.30,'wood',hair,round);
 add('quiff',-.045,1.646,.039,.297,.142,.27,'wood',light,{...round,roll:-.18});
 add('side-part',.123,1.589,.093,.123,.137,.155,'wood',hair,{...round,roll:-.33});
 add('fringe',-.105,1.58,.158,.12,.074,.099,'wood',hair,{...round,roll:.27});
 for(const side of [-1,1]){
  add('ear-'+side,side*.172,1.436,-.004,.06,.09,.058,'paper',skin,round);
  add('brow-'+side,side*.077,1.495,.145,.086,.016,.023,'wood',hair,{...round,roll:-side*.11});
  add('eye-'+side,side*.074,1.463,.154,.063,.034,.020,'cream',[.96,.94,.92],round);
  add('iris-'+side,side*.074,1.462,.168,.029,.029,.014,'glass',eye,round);
  add('pupil-'+side,side*.074,1.462,.180,.012,.023,.008,'dark',[.12,.17,.23],round);
  add('arm-'+side,side*.29,.88,.012,.15,.40,.17,'plaster',shirt,{...soft,roll:side*.09});
  add('hand-'+side,side*.30,.62,.075,.115,.15,.14,'paper',skin,round);
  add('thigh-'+side,side*.13,.47,.01,.18,.44,.22,'dark',jeans,soft);
  add('leg-'+side,side*.13,.19,.03,.16,.35,.20,'dark',jeans,soft);
  add('shoe-'+side,side*.13,.075,.105,.19,.13,.30,'cream',shoe,soft);
 }
 return parts;
}
