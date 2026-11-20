// Emy's reusable low-poly rig. Shared by the upstairs pet and the existing
// garden finale; only the roaming instance exposes pet reactions for now.
export const EMY_COLORS=Object.freeze({fur:[.48,.49,.50],dark:[.29,.31,.33],silver:[.66,.67,.66],ruff:[.77,.77,.72],ear:[.64,.46,.44],eye:[.65,.73,.39],nose:[.72,.46,.38]});
export function installEmyModel(add,{prefix='emy',hidden=false}={}){
 const parts=[],p=EMY_COLORS;
 const part=(id,x,y,z,w,h,d,color,extra={})=>{
  const box=add(prefix+'-'+id,x,y,z,w,h,d,'plaster',false,{shape:'round',segments:6,rings:3,color,dynamic:true,hiddenGeometry:hidden,castShadow:true,...extra});
  parts.push({id,box,x,y,z,roll:extra.roll||0,pitch:extra.pitch||0});
 };
 part('body',0,.29,-.07,.31,.31,.54,p.fur);
 part('haunch-left',-.105,.21,-.23,.17,.27,.24,p.dark);
 part('haunch-right',.105,.21,-.23,.17,.27,.24,p.fur);
 part('ruff',0,.31,.16,.34,.34,.26,p.silver,{joint:'head'});
 part('bib',0,.265,.27,.22,.28,.10,p.ruff,{joint:'head'});
 for(const side of [-1,1]){
  for(let i=0;i<3;i++)part('ruff-tuft'+side+i,side*(.13+i*.015),.35-i*.053,.18+i*.018,.10,.13,.15,i%2?p.ruff:p.silver,{shape:'gable',roll:side*(.65+i*.2),joint:'head'});
  part('cheek'+side,side*.13,.425,.285,.14,.14,.16,p.silver,{joint:'head'});
  part('ear'+side,side*.102,.57,.24,.108,.195,.087,p.dark,{shape:'gable',roll:-side*.19,joint:'head'});
  part('ear-inner'+side,side*.102,.565,.284,.073,.134,.019,p.ear,{shape:'gable',roll:-side*.19,joint:'head'});
  part('ear-tip'+side,side*.116,.684,.237,.025,.055,.021,p.silver,{shape:'gable',roll:-side*.16,joint:'head'});
  for(const end of [-1,1])part('paw'+side+end,side*.103,.12,end>0?.16:-.24,.093,.21,.11,end>0?p.silver:p.fur,{joint:'paw',pawPhase:side*end,front:end>0});
 }
 part('head',0,.47,.252,.285,.255,.24,p.fur,{joint:'head'});
 part('bridge',0,.468,.373,.06,.14,.035,p.silver,{joint:'head'});
 part('muzzle',0,.405,.363,.20,.103,.09,p.ruff,{joint:'head'});
 part('chin',0,.37,.352,.12,.052,.068,p.silver,{joint:'head'});
 part('nose',0,.435,.416,.052,.034,.02,p.nose,{shape:'gable',roll:Math.PI,joint:'head'});
 for(const side of [-1,1]){
  part('brow'+side,side*.08,.521,.35,.105,.028,.025,p.dark,{roll:side*.22,joint:'head'});
  part('eye-rim'+side,side*.077,.488,.368,.094,.064,.023,p.dark,{joint:'head'});
  part('eye'+side,side*.077,.488,.384,.073,.050,.018,p.eye,{joint:'eye'});
  part('pupil'+side,side*.077,.488,.397,.013,.041,.009,[.12,.15,.15],{joint:'eye'});
  part('eye-glint'+side,side*.069,.501,.404,.013,.013,.008,[.9,.91,.80],{joint:'eye'});
  for(let i=0;i<3;i++)part('whisker'+side+i,side*.16,.410-i*.016,.395,.16,.004,.005,[.83,.83,.77],{shape:'box',roll:side*(i-1)*.13,joint:'head'});
  part('forehead-stripe'+side,side*.046,.555,.332,.025,.078,.012,p.dark,{roll:side*.28,joint:'head'});
 }
 part('forehead-middle',0,.56,.336,.018,.045,.013,p.dark,{joint:'head'});
 for(let i=0;i<5;i++)part('tail'+i,Math.sin(i*.38)*.08,.29+i*.039,-.35-i*.075,.13-i*.009,.14-i*.009,.19,p.silver,{joint:'tail',tail:i+1});
 return parts;
}
export function poseEmy(cat,{walking=false,reduced=false,mode='idle',phase=cat.age,headYaw=0}={}){
 const c=Math.cos(cat.yaw),s=Math.sin(cat.yaw),purr=mode==='purr',groom=mode==='groom',stretch=mode==='stretch',sleep=mode==='sleep';
 const blink=sleep||cat.age%4.6>4.39;
 for(const part of cat.parts){
  const {box,id,x,y,z,roll,pitch}=part;
  let lx=x,ly=y,lz=z,rx=pitch,rz=roll;
  if(box.joint==='head'||box.joint==='eye'){
   const nod=reduced?0:(groom?Math.sin(phase*7)*.02:purr?Math.sin(phase*4)*.008:Math.sin(phase*1.7)*.006);
   ly+=nod-(sleep?.16:0);lz+=stretch?.06:0;
   const hc=Math.cos(headYaw),hs=Math.sin(headYaw),depth=lz-.22;
   lx=x*hc+depth*hs;lz=.22-x*hs+depth*hc;
   if(box.joint==='eye'&&blink)rx=1.46;
  }
  if(box.pawPhase){
   const stride=walking&&!reduced?Math.sin(phase*9)*box.pawPhase:0;
   lz+=stride*.055;ly+=Math.max(0,stride)*.045;
   if((groom||purr)&&box.front&&x>0){ly+=.10+(reduced?0:Math.sin(phase*7)*.025);lz+=.05;rz=-.28;}
   if(stretch&&box.front){lz+=.09;rx=-.3;}
   if(sleep)ly=.115;
  }
  if(box.joint==='tail'){
   const sway=reduced?0:Math.sin(phase*(purr?4:1.8)+box.tail*.35);
   lx+=sway*.012*box.tail;ly+=purr?.025*box.tail:0;rz+=sway*.07;
  }
  if(id==='body'||id.startsWith('haunch'))ly-=(groom||mode==='sit'||sleep)?.07:stretch?.035:0;
  const bob=walking&&!reduced?Math.abs(Math.sin(phase*9))*.009:0;
  box.x=cat.x+lx*c+lz*s;box.z=cat.z-lx*s+lz*c;box.y=cat.y+ly+bob;
  box.yaw=-cat.yaw+(box.joint==='head'||box.joint==='eye'?-headYaw:0);box.roll=rz;box.pitch=rx;
 }
}
export const EMY_UPSTAIRS_ROUTE=Object.freeze([{x:6.05,z:8.4},{x:6.65,z:6.8},{x:5.85,z:5.4},{x:6.4,z:3.9},{x:5.65,z:2.5}]);
export function installUpstairsEmy(add,floor=3.15){
 const cat={parts:installEmyModel(add),age:0,x:6.05,y:floor,z:8.4,yaw:Math.PI,waypoint:1,direction:1,phase:'walk',phaseAge:0,cycle:0,reaction:0,hidden:false};
 poseEmy(cat);return cat;
}
export function petEmy(cat){if(cat.hidden)return false;cat.reaction=3.4;cat.phase='purr';cat.phaseAge=0;return true;}
export function updateUpstairsEmy(cat,delta,{player,blocked=()=>false,reduced=false,hidden=false}={}){
 const dt=Number.isFinite(delta)?Math.max(0,Math.min(.1,delta)):0;
 cat.hidden=hidden;
 for(const {box} of cat.parts)box.hiddenGeometry=hidden;
 if(hidden)return;
 cat.age+=dt;cat.phaseAge+=dt;
 const near=player&&Math.abs(player.y-cat.y)<.6&&Math.hypot(player.x-cat.x,player.z-cat.z)<1.4;
 let walking=false;
 if(cat.reaction>0){cat.reaction=Math.max(0,cat.reaction-dt);cat.phase='purr';if(!cat.reaction){cat.phase='walk';cat.phaseAge=0;}}
 else if(cat.phase==='walk'){
  const goal=EMY_UPSTAIRS_ROUTE[cat.waypoint],dx=goal.x-cat.x,dz=goal.z-cat.z,d=Math.hypot(dx,dz);
  if(d<.07){cat.phase=['sit','groom','stretch','sleep'][cat.cycle++%4];cat.phaseAge=0;}
  else if(!near){
   const step=Math.min(d,.38*dt),nx=cat.x+dx/d*step,nz=cat.z+dz/d*step;
   if(!blocked(nx,cat.y,nz,.24,.72)){cat.x=nx;cat.z=nz;cat.yaw=Math.atan2(dx,dz);walking=true;}
   else{cat.phase='sit';cat.phaseAge=0;cat.direction*=-1;}
  }
 }else if(cat.phaseAge>(cat.phase==='sleep'?6:3.8)){
  if(cat.waypoint===EMY_UPSTAIRS_ROUTE.length-1)cat.direction=-1;
  if(cat.waypoint===0)cat.direction=1;
  cat.waypoint=Math.max(0,Math.min(EMY_UPSTAIRS_ROUTE.length-1,cat.waypoint+cat.direction));cat.phase='walk';cat.phaseAge=0;
 }
 let headYaw=near?Math.atan2(player.x-cat.x,player.z-cat.z)-cat.yaw:0;
 headYaw=Math.atan2(Math.sin(headYaw),Math.cos(headYaw));headYaw=Math.max(-.65,Math.min(.65,headYaw));
 poseEmy(cat,{walking,reduced,mode:cat.phase,phase:cat.age,headYaw});
}
