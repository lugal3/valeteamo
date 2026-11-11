import {CHIBI,chibiPiece,placePieces,torchModel,grippingPaw} from './chibi-model.js';
import {notePieces,phonePieces} from './equipment.js';
import {JOINTS,JOINT_INDEX} from './character-rig.js';
// Rest mesh is independent of the mirror and can be consumed by other cameras.
function jointFor(id){
 if(/^(head|ear|eye|whisker|nose|bow)/.test(id))return 'head';
 const side=id.endsWith('-1')?'left':'right';
 if(id.startsWith('thigh'))return side+'Leg';
 if(id.startsWith('leg'))return side+'Knee';
 if(id.startsWith('shoe'))return side+'Foot';
 if(id.startsWith('sleeve'))return side+'Arm';
 if(id.startsWith('arm'))return side+'Forearm';
 if(id.startsWith('paw'))return side+'Hand';
 return 'body';
}
const rose=[.998,.63,.68];
function cheekTint([x,y,z],color,head){
 if(z<=0)return color;
 const dx=(Math.abs(x)*2/head.w-.635)/.163,dy=(y*2/head.h+.18)/.128;
 const strength=.56*Math.exp(-dx*dx-dy*dy);
 return color.map((channel,i)=>channel+(rose[i]-channel)*strength);
}
export function characterPieces(equipment='flashlight'){
 const parts=[];
 const add=(id,x,y,z,w,h,d,color=CHIBI.white,extra={})=>parts.push(chibiPiece('mirror-kitty-'+id,x,y,z,w,h,d,color,{joint:jointFor(id),...extra}));
 const segment=(id,from,to,width,color,joint)=>{
  const a=JOINTS[JOINT_INDEX[from]].pivot,b=JOINTS[JOINT_INDEX[to]].pivot,d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d),mid=a.map((v,i)=>(v+b[i])/2);
  add(id,...mid,width,length+.045,width,color,{joint,roll:-Math.asin(d[0]/length),pitch:Math.atan2(d[2],d[1])});
 };
 add('shirt',0,.72,0,.556,.53,.35,CHIBI.pink);
 add('overalls',0,.517,.023,.525,.424,.367,CHIBI.blue);
 add('bib',0,.702,.184,.326,.263,.072,CHIBI.blue);
 add('bib-pocket',0,.672,.218,.129,.091,.024,[.29,.57,.74],{shape:'rounded-box',smooth:false,roundness:.39,segments:12,rings:8});
 for(const side of [-1,1]){
  add('thigh'+side,side*.16,.345,.005,.20,.20,.22);
  add('leg'+side,side*.16,.20,.005,.19,.20,.21);
  add('shoe'+side,side*.16,.11,.065,.25,.18,.33);
  add('strap'+side,side*.154,.824,.168,.059,.234,.064,CHIBI.blue);
  add('button'+side,side*.154,.762,.205,.050,.051,.025,CHIBI.gold,{segments:12,rings:8});
  const limb=side<0?'left':'right';
  segment('sleeve'+side,limb+'Arm',limb+'Forearm',.205,CHIBI.pink,limb+'Arm');
  segment('arm'+side,limb+'Forearm',limb+'Hand',.155,CHIBI.white,limb+'Forearm');
  if(side<0||equipment==='empty'){
   const [x,y,z]=JOINTS[JOINT_INDEX[limb+'Hand']].pivot;
   add('paw'+side,x,y,z,.20,.17,.22);
   if(equipment==='empty'){
    add('paw-thumb'+side,x-side*.072,y+.025,z+.035,.085,.09,.10);
    add('paw-pad'+side,x,y-.01,z+.099,.081,.068,.024,[.96,.70,.76],{segments:12,rings:8});
   }
  }
  add('ear'+side,side*.385,1.765,-.015,.34,.38,.30,CHIBI.white,{shape:'ear',segments:24,roll:-side*.18});
 }
 add('head',0,1.39,0,1.12,.87,.67,CHIBI.white,{segments:44,rings:26,vertexColor:cheekTint});
 for(const side of [-1,1]){
  const eyeY=1.405;
  add('eye'+side,side*.222,eyeY,.311,.069,.105,.026,CHIBI.ink,{segments:16,rings:10,blinkY:eyeY});
  add('eye-glint'+side,side*.222-.012,eyeY+.025,.324,.017,.018,.008,[1,.98,.94],{segments:8,rings:6,blinkY:eyeY});
  for(let i=0;i<3;i++){
   const x0=side*.458,x1=side*.646,y0=1.30+(i-1)*.065,y1=y0+(i-1)*.032;
   const dx=x1-x0,dy=y1-y0;
   add('whisker'+side+i,(x0+x1)/2,(y0+y1)/2,.224,.019,.019,Math.hypot(dx,dy),CHIBI.ink,{shape:'lathe',segments:8,pitch:-Math.atan2(dy,Math.abs(dx)),yaw:-side*Math.PI/2});
  }
 }
 add('nose',0,1.295,.329,.095,.066,.038,CHIBI.gold,{segments:20,rings:10});
 add('bow-left',.225,1.735,.269,.28,.245,.15,CHIBI.red,{roll:.35});
 add('bow-right',.445,1.75,.18,.265,.25,.17,CHIBI.red,{roll:-.35});
 add('bow-knot',.335,1.74,.297,.15,.15,.115,CHIBI.red,{segments:20,rings:12});
 // Identical rounded barrel, lens and grip in both the mirror and first-person hand.
 if(equipment!=='empty'){
  const held=equipment==='note'?notePieces(1.4):equipment==='phone'?phonePieces():[...torchModel(true),...grippingPaw()];
  parts.push(...placePieces(held,{x:equipment==='note'?.265:.365,y:1.145,z:.25,scale:.87,prefix:'mirror-kitty-'}).map(p=>({...p,joint:'rightHand'})));
 }
 // Scale the entire head around its center so the eyes, ears, whiskers and bow stay attached.
 const headY=y=>1.405+(y-1.39)*1.08;
 return parts.map(part=>part.joint==='head'?{
  ...part,x:part.x*1.13,y:headY(part.y),z:part.z*1.05,w:part.w*1.13,h:part.h*1.08,d:part.d*1.05,
  blinkY:part.blinkY===undefined?undefined:headY(part.blinkY)
 }:part);
}
