import {installEmyModel} from './emy-cat.js';
const APPROACH_SECONDS=1.3;
const smooth=t=>t*t*(3-2*t);

export function installGreyCat(add){
 const parts=installEmyModel(add,{prefix:'grey-cat',hidden:true});
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
