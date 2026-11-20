import {rotateEmy,emyTailSurface} from './emy-surface.js';
// Anatomical proportions from Emy's photos; silver long coat, tabby M,
// almond green eyes, pink nose, tall tufted ears and a continuous plume tail.
export const EMY_COLORS=Object.freeze({fur:[.45,.46,.47],dark:[.25,.26,.27],silver:[.60,.61,.60],ruff:[.64,.65,.62],ear:[.62,.43,.42],eye:[.61,.68,.35],nose:[.68,.42,.35]});
export function installEmyModel(add,{prefix='emy',hidden=false}={}){
 const parts=[],p=EMY_COLORS;
 const part=(id,pos,size,color,joint,extra={})=>{
  const spec={w:size[0],h:size[1],d:size[2],color,...extra};
  const box=add(prefix+'-'+id,...pos,...size,'plaster',false,{shape:'emy-surface',color,dynamic:true,hiddenGeometry:hidden,castShadow:true,chibi:true,emySpec:spec,emyPose:{pos,rot:[0,0,0],scale:[1,1,1]}});
  parts.push({id,box,x:pos[0],y:pos[1],z:pos[2],joint,base:pos});
 };
 part('body',[0,.31,-.12],[.29,.32,.55],p.fur,'body',{fur:'coat',segments:28,rings:18});
 part('pelvis',[0,.29,-.31],[.30,.30,.28],p.fur,'pelvis',{fur:'coat'});
 part('shoulders',[0,.35,.09],[.27,.31,.28],p.fur,'shoulders',{fur:'coat'});
 part('neck',[0,.43,.15],[.23,.25,.24],p.silver,'neck',{fur:'ruff'});
 part('chest',[0,.35,.22],[.28,.31,.20],p.ruff,'chest',{fur:'ruff',segments:26,rings:18});
 // All face parts are children of one moving head frame.
 part('head',[0,0,0],[.28,.25,.245],p.fur,'head',{fur:'head',segments:32,rings:22});
 part('throat',[0,-.095,.045],[.21,.13,.17],p.silver,'head',{fur:'ruff'});
 for(const side of [-1,1]){
  part('cheek'+side,[side*.105,-.045,.025],[.125,.16,.15],p.silver,'head',{fur:'ruff'});
  part('muzzle'+side,[side*.039,-.058,.122],[.092,.073,.071],p.ruff,'head');
  part('ear'+side,[side*.096,.120,-.016],[.128,.175,.068],p.fur,'head',{form:'ear'});
  part('ear-inner'+side,[side*.096,.127,.015],[.088,.124,.012],p.ear,'head',{form:'ear'});
  // Small silky tufts, not huge polygon spikes.
  for(let n=0;n<3;n++)part('ear-tuft'+side+n,[side*(.112+n*.006),.205+n*.007,-.015],[.009,.032,.006],p.silver,'head',{form:'ear',segments:8,rings:7});
  part('socket'+side,[side*.068,.018,.108],[.080,.040,.006],p.dark,'head',{form:'almond'});
  part('iris'+side,[side*.068,.018,.112],[.069,.033,.004],p.eye,'eye',{form:'almond',segments:24,rings:12});
  part('lid'+side,[side*.068,.018,.114],[.082,.042,.006],p.fur,'lid',{form:'almond'});
  part('closed-eye'+side,[side*.068,.018,.119],[.063,.0025,.003],p.dark,'lid');
  part('pupil'+side,[side*.068,.018,.115],[.009,.029,.002],[.07,.085,.07],'eye',{segments:12,rings:10});
  part('glint'+side,[side*.062,.026,.117],[.008,.008,.002],[.88,.90,.81],'eye',{segments:10,rings:8});
  // Curved thin whiskers: linked tapered capsules, no broad triangular cards.
  for(let n=0;n<4;n++)for(let j=0;j<3;j++){
   part('whisker'+side+n+'-'+j,[side*(.07+j*.040),-.060+(n-1.5)*.013+(j*j)*.002*(n-1.5),.155-j*.012],[.048,.0015,.0015],[.78,.78,.73],'head',{segments:10,rings:6,roll:side*(n-1.5)*.11});
  }
 }
 for(const side of [-1,1]){
  for(let n=0;n<5;n++)part('cheek-lock'+side+n,[side*(.10+n*.008),-.055-n*.017,.035+n*.004],[.032,.060,.018],n%2?p.silver:p.fur,'head',{form:'lock',roll:side*.34,segments:10,rings:9});
  for(let n=0;n<5;n++)part('bib-lock'+side+n,[side*(.025+n*.021),.31-(n%2)*.025,.305-n*.011],[.038,.080,.022],n%2?p.ruff:p.silver,'chest-fur',{form:'lock',roll:side*.18,segments:10,rings:9});
  for(let n=0;n<5;n++)part('flank-lock'+side+n,[side*.135,.29,-.33+n*.088],[.042,.085,.025],p.fur,'body-fur',{form:'lock',roll:side*.18,segments:10,rings:8});
 }
 part('head-fibres',[0,0,0],[.283,.254,.249],p.fur,'head',{form:'fuzz',fur:'head',count:120,length:.016});
 part('chest-fibres',[0,.35,.22],[.28,.31,.20],p.ruff,'chest',{form:'fuzz',count:120,length:.035});
 part('body-fibres',[0,.31,-.12],[.295,.325,.555],p.fur,'body',{form:'fuzz',count:160,length:.026});
 part('bridge',[0,-.008,.097],[.046,.092,.070],p.silver,'head');
 part('nose',[0,-.047,.155],[.037,.026,.018],p.nose,'head',{form:'nose',segments:20,rings:12});
 part('chin',[0,-.094,.128],[.092,.041,.060],p.silver,'head');
 for(const side of [-1,1])part('smile'+side,[side*.017,-.081,.152],[.031,.003,.004],p.dark,'head',{roll:side*.16,segments:10,rings:6});
 part('tongue',[0,-.092,.160],[.021,.034,.009],[.76,.40,.46],'tongue');
 for(const front of [true,false])for(const side of [-1,1]){
  const tag=(front?'front':'hind')+side;
  part(tag+'-upper',[side*.10,.25,front?.12:-.30],[front?.070:.105,1,front?.075:.12],p.fur,tag+'-upper',{fur:'coat',segments:14,rings:10});
  part(tag+'-lower',[side*.10,.13,front?.16:-.32],[.054,1,.055],p.fur,tag+'-lower',{fur:'coat',segments:12,rings:9});
  part(tag+'-joint',[side*.10,.20,front?.14:-.31],[.075,.075,.075],p.fur,tag+'-joint',{segments:12,rings:9});
  part(tag+'-paw',[side*.10,.04,front?.20:-.34],[.089,.058,.118],p.silver,tag+'-paw',{segments:16,rings:10});
  for(let toe=0;toe<2;toe++)part(tag+'-toe'+toe,[side*.10+(toe-.5)*.022,.045,front?.244:-.296],[.002,.016,.008],p.dark,tag+'-toe',{segments:8,rings:5});
 }
 part('tail',[0,0,0],[.55,.62,.9],p.silver,'tail',{form:'tail'});
 return parts;
}
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function emyLandmarks(mode='idle',phase=0,walking=false,reduced=false){
 const sit=['sit','groom','purr'].includes(mode),sleep=mode==='sleep',stretch=mode==='stretch',groom=mode==='groom';
 const motion=reduced?0:Math.sin(phase*8),bob=walking?Math.abs(motion)*.006:0;
 const body=sleep?[0,.17,-.12]:stretch?[0,.30,-.13]:sit?[0,.32,-.14]:[0,.31+bob,-.12];
 const head=sleep?[.13,.205,.12]:stretch?[0,.245,.35]:sit?[0,.585,.14]:[0,.52+bob,.26];
 const headRot=sleep?[.10,-.75,-.35]:stretch?[.22,0,0]:groom?[.48+motion*.06,-.28,-.16]:mode==='purr'?[-.16,0,.17]:[0,0,0];
 const legs={};
 for(const front of [true,false])for(const side of [-1,1]){
  const key=(front?'front':'hind')+side;
  let hip=[side*.10,front?.36:.31,front?.11:-.30],paw=[side*.105,.030,front?.20:-.34];
  if(walking){const stride=motion*side*(front?1:-1);paw[2]+=stride*.075;paw[1]+=Math.max(0,stride)*.047;}
  if(sit){hip=[side*(front?.095:.115),front?.40:.17,front?.07:-.24];paw=[side*(front?.09:.14),.030,front?.20:-.20];}
  if(stretch){hip=[side*.10,front?.20:.37,front?.21:-.34];paw=[side*.12,.030,front?.48:-.43];}
  if(sleep){hip=[side*.08,.14,front?.07:-.28];paw=[side*.09,.030,front?.25:-.08];}
  if(groom&&front&&side===-1)paw=[-.065,.46+motion*.012,.29];
  if(mode==='purr'&&front&&side===1)paw=[.125,.13+Math.max(0,motion)*.015,.28];
  const knee=lerp(hip,paw,.5);knee[2]+=(front?-.035:.07);if(sit&&!front){knee[1]=.105;knee[2]=-.33;}
  legs[key]={hip,knee,paw};
 }
 return {body,head,headRot,legs,sit,sleep,stretch,groom};
}
export function poseEmy(cat,{walking=false,reduced=false,mode='idle',phase=cat.age,headYaw=0,blend=1}={}){
 const l=emyLandmarks(mode,phase,walking,reduced),headRotation=[l.headRot[0],l.headRot[1]+headYaw,l.headRot[2]];
 const blink=l.sleep||cat.age%4.6>4.42,eyes=blink?.035:mode==='purr'?.50:1;
 const root=p=>{const v=rotateEmy(p,0,cat.yaw,0);return [cat.x+v[0],cat.y+v[1],cat.z+v[2]];};
 for(const part of cat.parts){
  const {box,joint,base}=part;let p=[...base],rot=[0,0,box.emySpec.roll||0],scale=[1,1,1];
  if(['head','eye','lid','tongue'].includes(joint)){
   p=rotateEmy(base,...headRotation).map((v,i)=>v+l.head[i]);rot=[...headRotation];rot[2]+=box.emySpec.roll||0;
   if(joint==='eye')scale=blink?[.001,.001,.001]:[1,eyes,1];
   if(joint==='lid')scale=blink?[1,1,1]:[.001,.001,.001];
   if(joint==='tongue')scale=l.groom?[1,.65+.35*Math.sin(phase*11),1]:[.01,.01,.01];
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
   const key=mode+':'+(['sleep','sit','groom'].includes(mode)||reduced?0:Math.floor(phase*30));
   if(box.emyTailMode!==mode){box.emyTailMode=mode;box.emyTailBlend=1;}
   if(key!==box.emyTailKey||box.emyTailBlend>.002){
   box.emyTailKey=key;box.emyTailBlend*=1-blend;box.emyTailRevision=(box.emyTailRevision||0)+1;
   const next=emyTailSurface(mode,reduced?0:phase),old=box.emyTailMesh;
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
  if(['pos','rot','scale'].some(key=>box.emyPose[key].some((v,i)=>Math.abs(v-old[key][i])>1e-6)))box.emyRevision=(box.emyRevision||0)+1;
  [box.x,box.y,box.z]=box.emyPose.pos;[box.pitch,box.yaw,box.roll]=box.emyPose.rot;
  const spec=box.emySpec;box.w=spec.w*scale[0];box.h=joint==='tail'?.01:spec.h*scale[1];box.d=spec.d*scale[2];
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
