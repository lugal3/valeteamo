import {emySkinFrames} from './emy-sculpt.js';
import {rotateEmy,emyTailSurface} from './emy-surface.js';
// Anatomical proportions from Emy's photos; silver long coat, tabby M,
// almond green eyes, pink nose, tall tufted ears and a continuous plume tail.
export const EMY_COLORS=Object.freeze({fur:[.45,.46,.47],dark:[.25,.26,.27],silver:[.60,.61,.60],ruff:[.64,.65,.62],ear:[.62,.43,.42],eye:[.61,.68,.35],nose:[.68,.42,.35]});
export function installEmyModel(add,{prefix='emy',hidden=false}={}){
 const parts=[],p=EMY_COLORS;
 const part=(id,pos,size,color,joint,extra={})=>{
  if(hidden&&!extra.asset)extra={...extra,segments:Math.max(4,Math.floor((extra.segments||14)*.5)),rings:Math.max(3,Math.floor((extra.rings||9)*.5))};
  const spec={w:size[0],h:size[1],d:size[2],color,...extra};
  const box=add(prefix+'-'+id,...pos,...size,'plaster',false,{shape:'emy-surface',color,dynamic:true,hiddenGeometry:hidden,castShadow:true,chibi:true,emySpec:spec,emyPose:{pos,rot:[0,0,0],scale:[1,1,1]}});
  parts.push({id,box,x:pos[0],y:pos[1],z:pos[2],joint,base:pos});
 };
 // A fused sculpt replaces the separate torso, joints, cheek and muzzle balls.
 part('coat',[0,0,0],[.40,.63,.85],p.fur,'skin',{asset:hidden?'coatLow':'coat',fibres:hidden?150:1650});
 part('head',[0,0,0],[.38,.43,.25],p.fur,'head',{asset:hidden?'headLow':'head',fibres:hidden?80:750});
 for(const side of [-1,1]){
  part('concha'+side,[side*.107,.131,0],[.077,.128,.003],p.ear,'head',{form:'concha',side,segments:16,rings:12});
  part('socket'+side,[side*.065,.018,.095],[.079,.046,.010],p.dark,'head',{form:'eye',side,segments:20,rings:10});
  part('iris'+side,[side*.065,.018,.102],[.073,.043,.009],p.eye,'eye',{form:'eye',side,segments:32,rings:14});
  part('lid'+side,[side*.065,.018,.108],[.081,.049,.007],p.fur,'lid',{form:'eye',side,fur:'head',uvOrigin:[side*.065,.018],segments:18,rings:10});
  part('closed-eye'+side,[side*.065,.018,.117],[.062,.002,.003],p.dark,'lid',{roll:side*.11,segments:12,rings:6});
  // Fine curved whiskers grow out of the fused muzzle rather than cheek balls.
  for(let n=0;n<6;n++)for(let j=0;j<4;j++){
   part('whisker'+side+n+'-'+j,[side*(.055+j*.031),-.066+(n-2.5)*.008+(j*j)*.0016*(n-2.5),.156-j*.009],[.037,.0007,.0007],[.73,.73,.69],'head',{segments:4,rings:3,roll:side*(n-2.5)*.09});
  }
 }
 part('nose',[0,-.046,.150],[.035,.025,.015],p.nose,'head',{form:'nose',segments:24,rings:14});
 for(const side of [-1,1])part('nostril'+side,[side*.010,-.048,.162],[.004,.0014,.001],[.25,.16,.15],'head',{segments:8,rings:5,roll:side*.25});
 part('philtrum',[0,-.063,.160],[.0018,.017,.002],p.dark,'head',{segments:8,rings:6});
 for(const side of [-1,1])part('mouth'+side,[side*.016,-.077,.156],[.029,.002,.002],p.dark,'head',{roll:side*.10,segments:10,rings:6});
 part('tongue',[0,-.086,.163],[.018,.025,.006],[.70,.34,.39],'tongue');
 part('tail',[0,0,0],[.55,.62,.9],p.silver,'tail',{form:'tail',fibres:hidden?100:520});
 return parts;
}
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
// Stance occupies 57% of a stride. The four offsets give a lateral-sequence
// walk: hind paw, forepaw on the same side, then the other pair.
const strideLength=.48, stance=.57;
function stridePhase(travel,front,side){
 return (travel/strideLength+(side===1?.5:0)+(front?.75:0))%1;
}
export function emyLandmarks(mode='idle',phase=0,walking=false,reduced=false,travel=phase*.55){
 const sit=['sit','groom','purr'].includes(mode),sleep=mode==='sleep',stretch=mode==='stretch',groom=mode==='groom',jump=mode==='jump',crouch=mode==='crouch',alert=mode==='alert';
 const motion=reduced?0:Math.sin(phase*8),bob=walking?Math.abs(motion)*.006:0;
 const breath=reduced?0:Math.sin(phase*2.25)*.004;
 const body=sleep?[0,.17+breath,-.12]:crouch?[0,.215,-.12]:stretch?[0,.30,-.13]:sit?[0,.32+breath,-.14]:[0,.31+bob+breath,-.12];
 const head=sleep?[.13,.205+breath,.12]:crouch?[0,.33,.26]:stretch?[0,.245,.35]:sit?[0,.585,.14]:[0,.52+bob,.26];
 const lick=reduced?0:.5+.5*Math.sin(phase*6.4),wash=reduced?0:.5+.5*Math.sin(phase*2.1);
 const headRot=sleep?[.10,-.75,-.35]:crouch?[.10,0,0]:alert?[-.12,0,0]:stretch?[.22+motion*.024,0,0]:groom?[.35+.24*lick,-.20-.20*wash,-.13-.12*wash]:mode==='purr'?[-.16,0,.17]:[0,0,0];
 const legs={};
 for(const front of [true,false])for(const side of [-1,1]){
  const key=(front?'front':'hind')+side;
  let hip=[side*.10,front?.36:.31,front?.11:-.30],paw=[side*.105,.030,front?.20:-.34];
  if(walking){
   const cycle=stridePhase(travel,front,side);
   const swing=Math.max(0,(cycle-stance)/(1-stance));
   const reach=strideLength*stance;
   paw[2]+=cycle<stance?reach/2-cycle*strideLength:reach*(swing*swing*(3-2*swing)-.5);
   paw[1]+=(reduced?.028:.065)*Math.sin(Math.PI*swing)**2;
  }
  if(sit){hip=[side*(front?.095:.115),front?.40:.17,front?.07:-.24];paw=[side*(front?.09:.14),.030,front?.20:-.20];}
  if(stretch){hip=[side*.10,front?.20:.37,front?.21:-.34];paw=[side*.12,.030,front?.48:-.43];}
  if(jump){hip=[side*.10,front?.37:.30,front?.12:-.30];paw=[side*.12,front?.18:.16,front?.42:-.22];}
  if(sleep){hip=[side*.08,.14,front?.07:-.28];paw=[side*.09,.030,front?.25:-.08];}
  if(crouch){hip=[side*.10,front?.24:.22,front?.11:-.28];paw=[side*.12,.030,front?.25:-.32];}
  if(groom&&front&&side===-1)paw=[-.065-.045*wash,.40+.14*wash,.24+.07*lick];
  if(mode==='purr'&&front&&side===1)paw=[.125,.13+Math.max(0,motion)*.015,.28];
  const knee=lerp(hip,paw,.5);knee[2]+=(front?-.035:.07);if(sit&&!front){knee[1]=.105;knee[2]=-.33;}
  legs[key]={hip,knee,paw};
 }
 return {body,head,headRot,legs,sit,sleep,stretch,groom,crouch,alert};
}
export function poseEmy(cat,{walking=false,reduced=false,mode='idle',phase=cat.age,activityAge=null,headYaw=0,blend=1,leap}={}){
 const previous=cat.lastFootRoot;
 const moved=previous?Math.hypot(cat.x-previous.x,cat.z-previous.z):0;
 cat.walkTravel=(cat.walkTravel||0)+(walking?moved:0);
 cat.lastFootRoot={x:cat.x,z:cat.z};
 const l=emyLandmarks(mode,phase,walking,reduced,cat.walkTravel);
 // Stretch begins and ends with a planted neutral stance, rather than a
 // sudden slide of all four paws. Other tasks keep their authored poses.
 if(mode==='stretch'&&activityAge!==null){
  const t=activityAge-15,amount=Math.min(1,Math.max(0,t/.72),Math.max(0,(3-t)/.65));
  const neutral=emyLandmarks('idle',phase,false,reduced,cat.walkTravel);
  for(const key of ['body','head','headRot'])l[key]=lerp(neutral[key],l[key],amount);
  for(const key of Object.keys(l.legs))for(const part of ['hip','knee','paw'])l.legs[key][part]=lerp(neutral.legs[key][part],l.legs[key][part],amount);
 }
 if(leap){
  const {compression,flight,airborne}=leap;
  l.body[1]-=.105*compression;l.head[1]-=.13*compression;
  l.headRot[0]+=.18*compression;
  for(const [name,leg] of Object.entries(l.legs)){
   const front=name.startsWith('front');
   leg.hip[1]-=.10*compression;leg.knee[1]-=.06*compression;
   if(airborne){
    const tuck=Math.sin(Math.PI*flight);
    leg.paw[1]+=(front?.13:.18)*tuck;
    leg.paw[2]+=(front?.18:-.08)*tuck;
    leg.knee[1]+=.065*tuck;
   }
  }
 }
 if(walking){
  const anchors=cat.footContacts??={};
  const sn=Math.sin(cat.yaw),cs=Math.cos(cat.yaw);
  for(const [key,leg] of Object.entries(l.legs)){
   const cycle=stridePhase(cat.walkTravel,key.startsWith('front'),key.endsWith('-1')?-1:1);
   if(cycle>=stance){delete anchors[key];continue;}
   const [x,y,z]=leg.paw;
   const anchor=anchors[key]??={x:cat.x+x*cs+z*sn,y:cat.y+y,z:cat.z-x*sn+z*cs};
   const dx=anchor.x-cat.x,dz=anchor.z-cat.z;
   const foot=[dx*cs-dz*sn,anchor.y-cat.y,dx*sn+dz*cs];
   for(let i=0;i<3;i++)leg.knee[i]+=(foot[i]-leg.paw[i])*.5;
   leg.paw=foot;
  }
  blend=1;
 }else cat.footContacts=null;
 const fear=cat.alarm||0;
 l.head[1]+=.035*fear;l.head[2]-=.060*fear;
 l.body[1]+=.075*fear;
 if(fear>.01&&!l.sleep){for(const leg of Object.values(l.legs)){leg.hip[1]+=.035*fear;leg.knee[1]+=.018*fear;}}
 const headRotation=[l.headRot[0]-.14*fear,l.headRot[1]+headYaw,l.headRot[2]];
 const blink=l.sleep||cat.age%4.6>4.42||(mode==='purr'&&Math.sin(phase*2.8)>.15),eyes=blink?.035:mode==='purr'?.65:1+.43*fear;
 const root=p=>{const v=rotateEmy(p,0,cat.yaw,0);return [cat.x+v[0],cat.y+v[1],cat.z+v[2]];};
 for(const part of cat.parts){
  const {box,joint,base}=part;let p=[...base],rot=[0,0,box.emySpec.roll||0],scale=[1,1,1];
  const turn=Math.round((cat.earTurn||0)*50)/50,alarm=Math.round((cat.alarm||0)*40)/40,flatten=Math.round((cat.earFlatten||0)*40)/40;
  if(part.id==='head'&&(box.earTurn!==turn||box.earFlatten!==flatten)){box.earTurn=turn;box.earFlatten=flatten;box.emyRevision=(box.emyRevision||0)+1;}
  if(joint==='eye'&&box.emissive!==!!cat.darkEyes){box.emissive=!!cat.darkEyes;box.emyRevision=(box.emyRevision||0)+1;}
  if(joint==='skin'){
   if(box.bristle!==alarm){box.bristle=alarm;box.emyRevision=(box.emyRevision||0)+1;}
   scale=[1+.32*alarm,1+.22*alarm,1+.035*alarm];
   p=[0,0,0];
   const next=emySkinFrames(l,rotateEmy),old=box.emySkinFrames;
   if(!old||next.some((f,i)=>f.some((v,k)=>Math.abs(v-old[i][k])>1e-6))){
    box.emySkinFrames=old&&blend<1?next.map((f,i)=>lerp(old[i],f,blend)):next;
    box.emyRevision=(box.emyRevision||0)+1;
   }
  }else if(['head','eye','lid','tongue'].includes(joint)){
   p=rotateEmy(base,...headRotation).map((v,i)=>v+l.head[i]);rot=[...headRotation];rot[2]+=box.emySpec.roll||0;
   if(part.id.startsWith('concha')){rot[1]+=turn;rot[0]+=.35*flatten;rot[2]+=(base[0]<0?1:-1)*.18*flatten;}
   if(joint==='eye')scale=blink?[.001,.001,.001]:[1,eyes,1];
   if(joint==='lid')scale=blink?[1,1,1]:[.001,.001,.001];
   if(joint==='tongue')scale=l.groom&&Math.sin(phase*6.4)>.10?[1,.65+.35*Math.sin(phase*6.4),1]:[.01,.01,.01];
  }else if(joint==='body-fur'){
   const local=base.map((v,i)=>v-[0,.31,-.12][i]);const pitch=l.sleep?.12:l.stretch?.25:l.sit?-.65:0;
   p=rotateEmy(local,pitch,0,0).map((v,i)=>v+l.body[i]);rot[0]=pitch;
  }else if(joint==='chest-fur'){
   const center=l.sleep?[.09,.17,.12]:l.stretch?[0,.18,.26]:l.sit?[0,.40,.12]:[0,.35,.22];
   p=base.map((v,i)=>v-[0,.35,.22][i]+center[i]);if(l.sleep)scale=[.9,.6,.9];
  }else if(joint==='body'){
   p=l.body;rot[0]=l.sleep?.12:l.stretch?.25:l.sit?-.65:0;
   scale=l.sleep?[1.1,.78,1.03]:l.stretch?[1,.88,1.22]:[1,1,1];
  }else if(joint==='pelvis')p=l.sleep?[-.055,.16,-.27]:l.stretch?[0,.34,-.33]:l.sit?[0,.16,-.26]:[0,.29,-.31];
  else if(joint==='shoulders')p=l.sleep?[.04,.17,.04]:l.stretch?[0,.20,.19]:l.sit?[0,.40,.06]:[0,.35,.09];
  else if(joint==='neck'||joint==='chest'){
   const chest=joint==='chest';p=l.sleep?[.09,.17,.12]:l.stretch?[0,chest?.18:.22,.26]:l.sit?[0,chest?.40:.49,.12]:base;
   if(l.sleep)scale=[.9,.65,.9];
  }else if(joint==='tail'){
   p=[0,0,0];
   const tailMode=alarm>.28?'alert':mode;
   const key=tailMode+':'+(['sleep','crouch'].includes(tailMode)||reduced?0:Math.floor(phase*12))+':'+alarm;
   if(box.emyTailMode!==mode){box.emyTailMode=mode;box.emyTailBlend=1;}
   if(key!==box.emyTailKey||box.emyTailBlend>.002){
   box.emyTailKey=key;box.emyTailBlend*=1-blend;box.emyTailRevision=(box.emyTailRevision||0)+1;
   const next=emyTailSurface(tailMode,reduced?0:phase,box.emySpec.fibres,alarm),old=box.emyTailMesh;
   if(old&&blend<1){for(let i=0;i<next.vertices.length;i+=16){for(let k=0;k<3;k++)next.vertices[i+k]=old.vertices[i+k]+(next.vertices[i+k]-old.vertices[i+k])*blend;}}
   box.emyTailMesh=next;
   }
  }else{
   const key=joint.replace(/-(upper|lower|paw|toe|joint)$/,''),leg=l.legs[key];
   if(leg){
    if(joint.endsWith('joint')){p=[...leg.knee];}
    else if(joint.endsWith('upper')||joint.endsWith('lower')){
     const upper=joint.endsWith('upper'),a=upper?leg.hip:leg.knee,b=upper?leg.knee:leg.paw;
     p=lerp(a,b,.5);const d=b.map((v,i)=>v-a[i]);scale[1]=Math.hypot(...d);
     // Ellipsoid's local Y aligns with this skeletal segment.
     rot=[Math.atan2(d[2],d[1]),0,-Math.atan2(d[0],Math.hypot(d[1],d[2]))];
    }else{p=[...leg.paw];if(joint.endsWith('toe')){p[2]+=.045;}}
   }
  }
  // Toe offsets retain the original spacing, without affecting the foot rig.
  if(joint.endsWith('-toe')){const side=joint.includes('-1')?-1:1;p[0]=l.legs[joint.slice(0,-4)].paw[0]+base[0]-side*.10;}
  const desired={pos:root(p),rot:[rot[0],rot[1]+cat.yaw,rot[2]],scale};
  const old=box.emyPose;
  box.emyPose=blend<1?{pos:lerp(old.pos,desired.pos,blend),rot:lerp(old.rot,desired.rot,blend),scale:lerp(old.scale,desired.scale,blend)}:desired;
  // Yaw wraps at ±pi. Blend across the seam without spinning the face or tail.
  if(blend<1){
   const turn=desired.rot[1]-old.rot[1];
   box.emyPose.rot[1]=old.rot[1]+Math.atan2(Math.sin(turn),Math.cos(turn))*blend;
  }
  if(['pos','rot','scale'].some(key=>box.emyPose[key].some((v,i)=>Math.abs(v-old[key][i])>1e-6)))box.emyRevision=(box.emyRevision||0)+1;
  [box.x,box.y,box.z]=box.emyPose.pos;[box.pitch,box.yaw,box.roll]=box.emyPose.rot;
  const spec=box.emySpec;box.w=spec.w*scale[0];box.h=joint==='tail'?.01:spec.h*scale[1];box.d=spec.d*scale[2];
  // Skin vertices are in skeleton space. Keep its broad-phase box above the
  // floor while the independent pose origin stays at the skeleton root.
  if(joint==='skin'){box.y=cat.y+.315;box.h=.63;}
 }
 cat.landmarks=l;cat.visualMode=mode;
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
 poseEmy(cat,{walking,reduced,mode:cat.phase,phase:cat.age,headYaw,blend:1-Math.exp(-dt*10)});
}
