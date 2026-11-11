const X=8.55,START=2.53,THROAT=4.15,LANDING=8.2,END=14.8;
export const HATCH=Object.freeze({x:X,minX:7.91,maxX:9.19,minZ:START,maxZ:THROAT,y:.023});
const SECTIONS=[[START,THROAT,.64],[THROAT,5.8,.69],[5.8,8.5,.59],[8.5,11.5,.49],[11.5,END,1.03]];
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const floor=z=>-2.08*clamp((z-START)/(THROAT-START),0,1)-1.47*clamp((z-THROAT)/(LANDING-THROAT),0,1);
const sectionAt=z=>SECTIONS.find(([,end])=>z<end)||SECTIONS.at(-1);
export const inHatch=(x,z,margin=0)=>x>HATCH.minX-margin&&x<HATCH.maxX+margin&&z>START-margin&&z<THROAT+margin;

// At the same X/Z, the kitchen and tunnel keep independent walking surfaces.
export function basementGround(x,z,y,open){
 const below=y<-.01;
 if(y>.15||(!below&&!open))return null;
 if(z<START)return below&&y<-.30?NaN:null;
 if(z>END||Math.abs(x-X)>sectionAt(z)[2])return below?NaN:null;
 return below||z<=THROAT?floor(z):null;
}

export function floorAroundHatch(add,id,y,height,left,right,near,far,mat,solid,extra={}){
 const cut=HATCH;
 for(const [name,x0,x1,z0,z1] of [
  ['west',left,cut.minX,near,far],['east',cut.maxX,right,near,far],
  ['north',cut.minX,cut.maxX,near,cut.minZ],['south',cut.minX,cut.maxX,cut.maxZ,far]
 ])add(id+'-'+name,(x0+x1)/2,y,(z0+z1)/2,x1-x0,height,z1-z0,mat,solid,{...extra,worldUV:true,walkSurface:true});
}

export function poseHatch(hatch,amount){
 hatch.amount=amount;
 const roll=-1.50*amount,c=Math.cos(roll),s=Math.sin(roll);
 for(const {box,x,y} of hatch.parts){
  const dx=x-HATCH.maxX,dy=y-HATCH.y;
  box.x=HATCH.maxX+dx*c-dy*s;box.y=HATCH.y+dx*s+dy*c;box.roll=roll;
 }
 // Its open leaf should block crossing sideways even while the player descends.
 hatch.guard.solid=amount>.92;
}

function installCaptive(add,obj){
 const y=floor(13.74),z=13.74,x=X;
 const part=(id,dx,dy,dz,w,h,d,mat,extra={},solid=false)=>add('captive-'+id,x+dx,y+dy,z+dz,w,h,d,mat,solid,{
  ...extra,...(dy>=.76&&!solid&&!id.startsWith('chair-')?{dynamic:true,ambient:'captive-breath'}:{})
 });
 const wood={color:[.39,.26,.17]},skin={color:[.79,.58,.47]},jacket={color:[.36,.40,.47]},denim={color:[.20,.27,.34]};
 const rounded={shape:'round',segments:8,rings:5},bevel={shape:'rounded-box',roundness:.21,segments:6,rings:3};
 part('chair-seat',0,.49,0,.52,.075,.52,'wood',wood,true);
 for(const side of [-1,1]){
  for(const fore of [-1,1])part('chair-leg-'+side+fore,side*.21,.23,fore*.19,.062,.46,.064,'wood',wood,true);
  part('chair-post-'+side,side*.213,.83,.222,.064,.72,.067,'wood',wood);
 }
 for(const h of [.73,.93,1.13])part('chair-back-'+h,0,h,.222,.48,.092,.066,'wood',wood);
 part('torso',0,.77,-.025,.40,.46,.255,'plaster',{...bevel,...jacket},true);
 part('shirt',0,.815,-.158,.215,.292,.022,'cream',{...bevel,color:[.71,.69,.62]});
 part('neck',0,1.00,-.046,.137,.16,.14,'paper',{...rounded,...skin});
 part('head',0,1.21,-.064,.305,.368,.297,'paper',{...rounded,...skin,roll:-.11});
 part('hair',.007,1.321,-.043,.319,.202,.297,'wood',{...rounded,color:[.22,.13,.10],roll:-.19});
 part('fringe',-.054,1.329,-.168,.237,.108,.139,'wood',{...rounded,color:[.27,.16,.105],roll:.31});
 part('nose',0,1.207,-.207,.065,.078,.061,'paper',{...rounded,...skin});
 part('jaw-shadow',0,1.107,-.175,.165,.061,.057,'paper',{...rounded,color:[.45,.30,.25]});
 part('mouth',0,1.115,-.201,.081,.012,.017,'bow',{color:[.41,.25,.22]});
 for(const side of [-1,1]){
  part('ear-'+side,side*.147,1.21,-.069,.054,.087,.057,'paper',{...rounded,...skin});
  part('brow-'+side,side*.067,1.262,-.194,.073,.016,.019,'wood',{roll:-side*.11,color:[.22,.13,.10]});
  part('eye-'+side,side*.064,1.237,-.193,.053,.024,.025,'cream',rounded);
  part('iris-'+side,side*.064,1.236,-.208,.023,.021,.012,'glass',{...rounded,color:[.26,.50,.61]});
  part('upper-arm-'+side,side*.20,.765,-.014,.13,.33,.145,'plaster',{...bevel,...jacket,roll:side*.09});
  part('sleeve-'+side,side*.134,.579,-.155,.133,.135,.277,'plaster',{...bevel,...jacket,yaw:side*.27});
  part('hand-'+side,side*.060,.584,-.290,.095,.079,.109,'paper',{...rounded,...skin});
  part('thigh-'+side,side*.108,.54,-.193,.164,.155,.37,'plaster',{...bevel,...denim});
  part('shin-'+side,side*.122,.263,-.355,.144,.43,.149,'plaster',{...bevel,...denim,pitch:.13});
  part('sneaker-'+side,side*.122,.077,-.441,.152,.132,.281,'cream',{...bevel,color:[.51,.49,.45]});
 }
 for(const [i,dy,dz,w] of [[0,.59,-.257,.28],[1,.61,-.262,.28],[2,.67,-.151,.436]]){
  part('rope-'+i,0,dy,dz,w,.023,.023,'trim',{color:[.55,.42,.27],roll:i===1?.06:-.035});
 }
 obj('rescue-louis','rescue','Louis Tomlinson',x,y+1.02,z-.35,{floor:y});
}

export function installBasement(add,obj,lights){
 const x=X,z=(START+THROAT)/2;
 const metal={color:[.31,.24,.20]},iron={color:[.25,.25,.23]};
 const lid=add('basement-hatch',x,HATCH.y,z,1.28,.064,THROAT-START,'wood',false,{...metal,dynamic:true});
 const parts=[lid];
 for(const offset of [-.53,.53])parts.push(add('hatch-strap-'+offset,x,.064,z+offset,1.20,.018,.072,'torchmetal',false,{...iron,dynamic:true}));
 for(const dx of [-.43,-.19])parts.push(add('hatch-handle-foot-'+dx,x+dx,.081,z,.045,.050,.070,'torchmetal',false,{dynamic:true}));
 parts.push(add('hatch-handle',x-.31,.109,z,.286,.041,.055,'brass',false,{dynamic:true}));
 for(const dz of [-.54,.54])add('hatch-hinge-'+dz,HATCH.maxX,.050,z+dz,.093,.082,.21,'torchmetal',false,iron);
 const guard=add('hatch-open-guard',HATCH.maxX,.60,z,.11,1.20,THROAT-START,'wood',false,{hiddenGeometry:true});
 const hatch=obj('basement-hatch','hatch','Trampilla del sótano',x-.31,.097,z,{concealed:true,open:false,amount:0,guard,parts:parts.map(box=>({box,x:box.x,y:box.y}))});

 const earth=[.47,.32,.24],dark=[.36,.25,.21];
 for(const [i,[from,to,half]] of SECTIONS.entries()){
  const middle=(from+to)/2,length=to-from,low=floor(to),high=floor(from);
  const wallTop=i===0?-.046:high+1.92,wallBottom=low-.26;
  for(const side of [-1,1])add('tunnel-earth-'+i+'-'+side,X+side*(half+.16),(wallBottom+wallTop)/2,middle,.32,wallTop-wallBottom,length+.025,'earth',true,{color:i%2?earth:dark,worldUV:true});
  if(i===0)continue;
  const pitch=Math.atan2(high-low,length);
  add('tunnel-floor-'+i,X,(low+high)/2-.115,middle,half*2+.12,.22,Math.hypot(length,high-low)+.045,'earth',false,{pitch,color:earth,worldUV:true});
  add('tunnel-ceiling-'+i,X,(low+high)/2+1.98,middle,half*2+.17,.17,Math.hypot(length,high-low)+.08,'earth',false,{pitch,color:dark,worldUV:true});
  const previous=SECTIONS[i-1][2];
  for(const side of [-1,1])add('tunnel-shoulder-'+i+'-'+side,X+side*(half+previous)/2,high+.87,from,Math.abs(half-previous)+.035,1.96,.19,'earth',true,{color:dark,worldUV:true});
 }
 for(let i=0;i<10;i++){
  const depth=(THROAT-START)/10,treadZ=START+(i+.5)*depth;
  add('basement-step-'+i,X,floor(START+(i+1)*depth)-.044,treadZ,1.28,.088,depth+.024,'wood',false,{color:[.42,.28,.20]});
 }
 add('tunnel-end',X,floor(END)+.95,END,2.38,2.28,.26,'earth',true,{color:dark,worldUV:true});
 for(const [i,at] of [4.44,5.65,6.84,8.37,9.7,11.61,13.03].entries()){
  const y=floor(at),half=sectionAt(at)[2],wood={color:[.39,.25,.16]};
  for(const side of [-1,1]){
   const px=X+side*(half-.059);
   add('tunnel-post-'+i+'-'+side,px,y+.87,at,.14,1.77,.17,'wood',true,wood);
   add('tunnel-brace-'+i+'-'+side,px-side*.062,y+1.65,at-.018,.081,.40,.16,'wood',false,{...wood,roll:side*.47});
   add('tunnel-iron-'+i+'-'+side,px,y+1.69,at-.102,.101,.108,.023,'torchmetal',false,iron);
   add('tunnel-bolt-'+i+'-'+side,px,y+1.69,at-.118,.041,.041,.026,'brass',false,{shape:'cylinder',segments:6});
  }
  add('tunnel-beam-'+i,X,y+1.86,at,half*2+.18,.16,.20,'wood',true,wood);
 }
 for(const [i,at] of [6.28,12.72].entries()){
  const y=floor(at),px=X+(i===0?-.36:.44);
  add('tunnel-lamp-'+i,px,y+1.74,at,.15,.21,.15,'dark',false,{shape:'rounded-box',roundness:.24});
  add('tunnel-lamp-glass-'+i,px,y+1.68,at,.122,.122,.122,'torchglass',false,{shape:'round',glow:true,color:[.93,.60,.26]});
  lights.fixtures.push({x:px,y:y+1.63,z:at,tile:lights.fixtures.length+1,circuit:{on:true},underground:true,strength:.33});
 }
 for(let i=0;i<20;i++){
  const at=4.35+i*.47,half=sectionAt(at)[2],dx=(i%2?1:-1)*(half-.09),size=.08+(i%4)*.019;
  add('tunnel-stone-'+i,X+dx,floor(at)+.029,at,size,.068,size*1.4,'earth',false,{shape:'round',segments:5,rings:3,color:i%3?dark:[.41,.39,.33]});
 }
 installCaptive(add,obj);
 return hatch;
}
