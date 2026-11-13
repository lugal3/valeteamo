import {groundHeight} from './world.js';
import {navigate} from './navigation.js';
import {sampleBlink} from './animations/face.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const LOUIS_UNTIE_SECONDS=3.25;
const ROUTE=Object.freeze([
 {x:8.55,z:13.74},{x:8.55,z:12.4},{x:8.55,z:10.2},
 {x:8.55,z:8.0},{x:8.55,z:5.6},{x:8.55,z:4.2},
 {x:8.55,z:2.65},{x:9.5,z:2.2},{x:10.4,z:2.8},
 {x:11.20,z:4.08},{x:11.82,z:4.08}
]);
export const LOUIS_HIDING_SPOT=Object.freeze({x:11.82,y:0,z:4.08});
export function createLouisEscape(world){
 const point=ROUTE[0],y=groundHeight(point.x,point.z,-3.55,true);
 return {kind:'louis-companion',id:'louis-escape',label:'Louis rescatado',x:point.x,y,z:point.z,yaw:Math.PI,phase:'untying',waypoint:1,age:0,step:0,crouch:.33,concealed:false,interactable:false,walk:0,speed:0,blink:0,world};
}
export function updateLouisEscape(louis,dt,kitty=null){
 if(!louis||dt<=0)return null;
 louis.age+=dt;
 louis.blink=sampleBlink(louis.age+.61,{reduced:false,firstAt:1.43});
 louis.speed=Math.max(0,louis.speed-dt*5);
 if(louis.phase==='follow')louis.crouch=Math.max(0,louis.crouch-dt*1.6);
 if(louis.phase==='untying'){
  louis.crouch=.33;
  if(louis.age>=LOUIS_UNTIE_SECONDS){louis.phase='climb';louis.age=0;louis.crouch=0;return 'untied';}
  return null;
 }
 if(louis.phase==='climb'){
  const target=ROUTE[louis.waypoint];
  if(!target){louis.phase='hide';louis.age=0;louis.yaw=Math.atan2(10.65-louis.x,2.75-louis.z);return 'arrived';}
  const dx=target.x-louis.x,dz=target.z-louis.z,d=Math.hypot(dx,dz);
  if(d<.055){louis.waypoint++;return null;}
  const step=Math.min(d,dt*2.10);
  louis.x+=dx/d*step;louis.z+=dz/d*step;
  louis.y=groundHeight(louis.x,louis.z,louis.y,true);
  louis.yaw=Math.atan2(dx,dz);
  louis.walk+=step;louis.speed=step/Math.max(dt,.0001);
 }else if(louis.phase==='hide'){
  louis.crouch=Math.min(1,louis.age/1.1);
  if(louis.age>=1.5){louis.phase='hidden';louis.age=0;louis.concealed=true;return 'hidden';}
 }else if(louis.phase==='follow'&&kitty){
  const behind={x:kitty.x-Math.sin(kitty.yaw)*.90,z:kitty.z-Math.cos(kitty.yaw)*.90};
  const dx=behind.x-louis.x,dz=behind.z-louis.z,d=Math.hypot(dx,dz);
  if(d>.55&&Math.abs(kitty.y-louis.y)<.7){
   const step=Math.min(d-.47,dt*3),body={x:louis.x,y:louis.y,z:louis.z};
   const moved=navigate(body,louis.world,dx/d*step,dz/d*step,1.60);
   louis.x=body.x;louis.y=body.y;louis.z=body.z;louis.walk+=moved;louis.speed=moved/Math.max(dt,.0001);louis.yaw=Math.atan2(dx,dz);
  }
 }
 return null;
}
export function freeLouis(louis){
 if(louis?.phase!=='hidden')return false;
 louis.phase='follow';louis.concealed=false;louis.speed=0;louis.age=0;
 return true;
}
export function louisCamera(louis){
 // The old shoulder camera crossed the narrow tunnel wall and produced a
 // pitch-black shot. Keep the lens on the physical walkable tunnel ramp.
 if(louis.phase==='untying'){
  const z=louis.z-1.18;
  return {x:louis.x,y:louis.y+1.24,z,yaw:0,pitch:.10};
 }
 if(louis.phase==='climb'&&louis.y<-.18){
  const z=Math.max(2.63,louis.z-.73);
  const floor=groundHeight(8.55,z,louis.y,true);
  const y=Number.isFinite(floor)?floor+1.20:louis.y+1.25;
  const dz=louis.z-z;
  return {x:8.55,y,z,yaw:Math.atan2(louis.x-8.55,dz),pitch:Math.atan2(louis.y+1.42-y,Math.max(.1,dz))};
 }
 // Across the open kitchen, framed to show his face while he crouches
 // behind the American-style breakfast bar.
 const x=10.65,z=2.75,y=1.52;
 const dx=louis.x-x,dz=louis.z-z;
 return {x,y,z,yaw:Math.atan2(dx,dz),pitch:Math.atan2(louis.y+1.25-y,Math.hypot(dx,dz))};
}
// Stylized 2025-era Louis Tomlinson reference: narrow oval face, asymmetrical
// eyebrow-length chestnut fringe, cool blue-grey irises, straight nose and
// light beard shadow. Geometry is hand-built, not derived from a photo asset.
export function louisModel(piece){
 const parts=[],add=(id,x,y,z,w,h,d,mat,color,extra={})=>parts.push(piece(id,x,y,z,w,h,d,mat,{color,...extra}));
 const skin=[.85,.665,.565],warm=[.828,.647,.555],shadow=[.72,.55,.495],beard=[.76,.605,.535];
 const hair=[.225,.142,.116],hairLight=[.305,.196,.151],highlight=[.37,.257,.206];
 const iris=[.29,.535,.675],irisEdge=[.17,.365,.495],sclera=[.952,.943,.921];
 const jacket=[.36,.405,.46],shirt=[.83,.84,.81],jeans=[.245,.322,.416],shoe=[.91,.865,.81];
 const round={shape:'round',segments:12,rings:8},detail={shape:'round',segments:8,rings:5};
 const soft={shape:'rounded-box',roundness:.28,segments:8,rings:5};
 // Slim shoulders, relaxed casual outfit and narrower adult head silhouette.
 add('torso',0,.86,-.015,.445,.55,.31,'plaster',jacket,soft);
 add('shirt',0,.87,.148,.275,.40,.035,'cream',shirt,soft);
 add('collar',0,1.155,.075,.246,.085,.19,'cream',[.91,.88,.81],soft);
 add('neck',0,1.195,.026,.135,.19,.132,'paper',skin,round);
 add('face',0,1.468,-.018,.309,.438,.307,'paper',skin,round);
 add('forehead',0,1.552,.112,.256,.137,.123,'paper',skin,detail);
 for(const side of [-1,1]){
  add('cheek-'+side,side*.109,1.398,.068,.071,.097,.097,'paper',warm,detail);
  add('jaw-'+side,side*.073,1.314,.052,.112,.119,.118,'paper',skin,{...detail,roll:side*.14});
  add('stubble-cheek-'+side,side*.117,1.327,.117,.039,.058,.018,'paper',beard,detail);
  add('sideburn-'+side,side*.166,1.506,.016,.047,.126,.075,'wood',hair,detail);
 }
 add('chin',0,1.268,.083,.183,.094,.138,'paper',skin,round);
 add('beard-chin',0,1.292,.154,.123,.037,.016,'paper',beard,detail);
 add('nose-bridge',0,1.463,.154,.044,.132,.049,'paper',skin,{...detail,pitch:-.04});
 add('nose-tip',0,1.413,.181,.064,.043,.052,'paper',warm,detail);
 add('nostril-left',-.024,1.390,.205,.016,.009,.010,'paper',shadow,detail);
 add('nostril-right',.024,1.390,.205,.016,.009,.010,'paper',shadow,detail);
 add('philtrum',0,1.358,.167,.025,.033,.015,'paper',warm,detail);
 add('upper-lip',0,1.335,.177,.104,.011,.016,'bow',[.67,.445,.425],soft);
 add('lower-lip',0,1.321,.180,.113,.013,.019,'paper',[.77,.53,.48],soft);
 add('smile-corner-left',-.053,1.332,.172,.017,.008,.010,'paper',shadow,detail);
 add('smile-corner-right',.053,1.332,.172,.017,.008,.010,'paper',shadow,detail);
 // Layered messy fringe: longest asymmetrical strands skim the eyebrows.
 add('hair-back',0,1.627,-.051,.343,.246,.304,'wood',hair,round);
 add('hair-cap',-.02,1.716,-.012,.344,.136,.324,'wood',hairLight,soft);
 add('crown',.025,1.766,-.052,.303,.09,.234,'wood',hair,soft);
 for(const [i,x,y,z,w,h,roll] of [
  [0,-.137,1.648,.152,.083,.126,.23],[1,-.068,1.637,.176,.078,.139,.18],
  [2,.007,1.648,.183,.078,.135,-.12],[3,.078,1.655,.158,.084,.129,-.30],
  [4,.143,1.665,.085,.079,.105,-.38]
 ])add('fringe-'+i,x,y,z,w,h,.071,'wood',i%2?hair:hairLight,{...soft,roundness:.48,roll});
 for(const side of [-1,1]){
  add('temple-'+side,side*.162,1.579,.041,.080,.163,.148,'wood',hair,round);
  add('ear-'+side,side*.170,1.450,-.026,.061,.102,.058,'paper',skin,detail);
  add('ear-fold-'+side,side*.191,1.454,.001,.021,.055,.025,'paper',warm,detail);
  add('brow-'+side,side*.079,1.507,.166,.105,.025,.033,'wood',hair,{...round,roll:side*.11});
  add('eye-'+side,side*.076,1.468,.155,.076,.031,.020,'cream',sclera,round);
  add('iris-'+side,side*.076,1.468,.174,.033,.027,.010,'glass',iris,detail);
  add('iris-rim-'+side,side*.076,1.468,.182,.029,.026,.009,'glass',irisEdge,detail);
  add('pupil-'+side,side*.076,1.468,.188,.014,.018,.007,'dark',[.09,.135,.20],detail);
  add('glint-'+side,side*.076-.010,1.475,.195,.009,.009,.006,'cream',[1,1,.99],detail);
  add('lid-'+side,side*.076,1.490,.175,.081,.015,.024,'paper',skin,soft);
  add('under-eye-'+side,side*.076,1.444,.149,.075,.007,.014,'paper',warm,soft);
  add('upper-arm-'+side,side*.290,.925,-.003,.152,.335,.175,'plaster',jacket,{...soft,roll:side*.065});
  add('forearm-'+side,side*.298,.698,.056,.137,.247,.155,'plaster',jacket,soft);
  add('hand-'+side,side*.300,.559,.111,.108,.142,.132,'paper',skin,round);
  add('thigh-'+side,side*.125,.480,.006,.177,.444,.207,'dark',jeans,soft);
  add('leg-'+side,side*.125,.229,.039,.159,.347,.187,'dark',jeans,soft);
  add('shoe-'+side,side*.125,.078,.124,.185,.134,.264,'cream',shoe,soft);
 }
 // A few uneven highlights make the side-swept hairstyle legible in dim lighting.
 for(const [i,x,z] of [[0,-.12,.177],[1,-.015,.204],[2,.11,.165]])
  add('hair-highlight-'+i,x,1.706,z,.051,.045,.027,'wood',highlight,detail);
 return parts;
}

// Procedural local pose; no allocation of new geometry each frame.
// Box transforms are applied by HouseRenderer to the original dynamic mesh.
export function louisPartPose(source,box,offset,reduced=false){
 const prefix='pickup-'+source.id+'-';
 const id=box.id.startsWith(prefix)?box.id.slice(prefix.length):box.id;
 const phase=source.phase,clock=source.age||0;
 const step=Math.sin((source.walk||0)*7.2),other=Math.cos((source.walk||0)*7.2);
 const weight=clamp((source.speed||0)/1.75,0,1)*(phase==='climb'||phase==='follow'?1:0);
 const crouch=clamp(source.crouch||0,0,1);
 const untying=phase==='untying',hiding=phase==='hide'||phase==='hidden';
 const head=/^(face|forehead|cheek|jaw|stubble|sideburn|chin|beard|nose|nostril|philtrum|upper-lip|lower-lip|smile|hair|fringe|crown|temple|ear|brow|eye|iris|pupil|glint|lid|under-eye)/.test(id);
 let [x,y,z]=offset,roll=box.baseRoll||0,pitch=box.basePitch||0,yaw=box.baseYaw||0;
 const breathing=(reduced?0:.009*Math.sin(clock*2.1));
 if(head){
  y-=crouch*.43;y+=breathing;
  roll+=(reduced?0:.022*Math.sin(clock*.95))+(hiding?.07*Math.sin(clock*2):0);
  yaw+=(phase==='hidden'||phase==='hide'?Math.sin(clock*.83)*.20:0);
 }else if(id==='torso'||id==='shirt'||id==='collar'||id==='neck'){
  y-=crouch*.31;y+=breathing+Math.abs(other)*weight*.012;
  roll+=step*weight*.025;
 }else if(/^(upper-arm|forearm|hand)-/.test(id)){
  const side=id.endsWith('--1')?-1:1;
  const swing=step*weight*side;
  if(untying){
   x-=side*.11;y+=id.startsWith('hand')?.11:0;z+=.20;pitch=-.45+Math.sin(clock*3)*.045;
  }else if(hiding){
   x-=side*.11;y+=id.startsWith('hand')?.40:.18;z+=.19;pitch=-.68;
  }else{
   y-=crouch*.28;
   z+=swing*(id.startsWith('hand')?.13:.075);
   pitch+=swing*.35;
  }
 }else if(/^(thigh|leg|shoe)-/.test(id)){
  const side=id.endsWith('--1')?-1:1;
  if(untying){
   z+=.14;y+=id.startsWith('shoe')?.07:0;pitch=-.35;
  }else if(hiding){
   z+=id.startsWith('shoe')?.12:.16;
   y+=id.startsWith('shoe')?0:-crouch*.11;
   pitch+=id.startsWith('thigh')?-.53:.35;
  }else{
   z+=step*side*weight*(id.startsWith('shoe')?.12:.075);
   y+=Math.max(0,step*side)*weight*(id.startsWith('shoe')?.045:.017);
   pitch+=step*side*weight*.34;
  }
 }
 const blink=source.blink??sampleBlink(clock+.61,{reduced:false,firstAt:1.43});
 const eye=/^(eye|iris|iris-rim|pupil|glint)-/.test(id);
 if(id.startsWith('lid-'))y-=blink*.028;
 return {x,y,z,yaw,roll,pitch,eyeScale:eye?1-blink*.94:1,blink};
}
