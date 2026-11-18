const APPROACH_SECONDS=1.3;
const FUR=[.48,.50,.59],SHADE=[.30,.32,.40],LIGHT=[.72,.74,.81],EAR=[.75,.49,.59];
const smooth=t=>t*t*(3-2*t);

export function installGreyCat(add){
 const parts=[];
 const part=(id,x,y,z,w,h,d,color,extra={})=>{
  const box=add('grey-cat-'+id,x,y,z,w,h,d,'plaster',false,{
   shape:'round',segments:8,rings:4,color,hiddenGeometry:true,dynamic:true,...extra
  });
  parts.push({box,x,y,z,roll:extra.roll||0});
 };
 part('back',0,.265,-.07,.285,.275,.52,FUR);
 part('chest',0,.26,.12,.26,.26,.28,LIGHT);
 part('head',0,.38,.244,.278,.24,.225,FUR);
 part('snout',0,.325,.339,.19,.101,.094,LIGHT);
 part('nose',0,.353,.383,.050,.029,.024,EAR);
 for(const side of [-1,1]){
  part('ear'+side,side*.092,.51,.24,.10,.16,.071,SHADE,{shape:'gable',roll:-side*.24});
  part('inner-ear'+side,side*.092,.505,.275,.066,.102,.020,EAR,{shape:'gable',roll:-side*.24});
  part('eye'+side,side*.076,.396,.339,.048,.057,.024,[.73,.63,.38]);
  part('pupil'+side,side*.076,.396,.350,.018,.041,.013,[.13,.125,.17]);
  for(const end of [-1,1])part('paw'+side+end,side*.091,.109,end>0?.13:-.215,.09,.206,.101,end>0?LIGHT:FUR,{pawPhase:side*end});
 }
 part('tail',0,.288,-.331,.082,.085,.24,SHADE,{tail:1});
 part('tail-tip',0,.373,-.452,.074,.19,.069,FUR,{tail:2});
 return {parts,age:0,active:false,x:4.64,y:0,z:13.72,yaw:Math.PI/2,exitAt:null,called:false};
}

export function revealGreyCat(cat){
 if(cat.active)return;
 cat.active=true;
 moveGreyCat(cat,0,false,false);
 for(const {box} of cat.parts)box.hiddenGeometry=false;
}

export function moveGreyCat(cat,delta,leaving,reduced){
 if(!cat.active)return;
 if(leaving&&cat.exitAt===null)cat.exitAt=Math.max(APPROACH_SECONDS,cat.age);
 cat.age+=delta;
 const approach=Math.min(1,cat.age/APPROACH_SECONDS);
 const escape=cat.exitAt===null?0:Math.max(0,Math.min(1,(cat.age-cat.exitAt)/2.65));
 const turning=smooth(Math.max(0,(approach-.70)/.30));
 cat.x=4.64+1.30*smooth(approach)-.21*smooth(escape);
 cat.z=13.72+1.68*smooth(escape);
 cat.yaw=Math.PI/2+Math.PI/2*turning-Math.PI*smooth(Math.min(1,escape*4));
 const walking=approach<1||escape>0&&escape<1;
 const step=(approach*1.3+escape*1.68)*26,activeMotion=Number(walking&&!reduced);
 const sway=reduced?0:Math.sin(cat.age*4),bob=activeMotion*Math.abs(Math.sin(step))*.022;
 const cos=Math.cos(cat.yaw),sin=Math.sin(cat.yaw);
 for(const {box,x,y,z,roll} of cat.parts){
  const paw=box.pawPhase?Math.sin(step)*box.pawPhase*activeMotion:0;
  const side=x+(box.tail?sway*.027*box.tail:0),front=z+paw*.055;
  box.x=cat.x+side*cos+front*sin;box.z=cat.z-side*sin+front*cos;
  box.y=y+(box.pawPhase?Math.max(0,paw)*.052:bob);
  box.yaw=-cat.yaw;box.roll=roll+(box.tail?sway*.15:0);
 }
}
