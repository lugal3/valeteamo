import {installEmyModel,poseEmy} from './emy-cat.js';
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
 poseEmy(cat,{walking,reduced,mode:walking?'walk':'idle',phase:cat.age});
}
