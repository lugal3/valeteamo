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
export function characterPieces(equipment='flashlight'){
 const parts=[];
 const add=(id,x,y,z,w,h,d,color=CHIBI.white,extra={})=>parts.push(chibiPiece('mirror-kitty-'+id,x,y,z,w,h,d,color,{joint:jointFor(id),...extra}));
 const segment=(id,from,to,width,color,joint)=>{
  const a=JOINTS[JOINT_INDEX[from]].pivot,b=JOINTS[JOINT_INDEX[to]].pivot,d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d),mid=a.map((v,i)=>(v+b[i])/2);
  add(id,...mid,width,length+.045,width,color,{joint,roll:-Math.asin(d[0]/length),pitch:Math.atan2(d[2],d[1])});
 };
 // Match the protected 2D reference: oversized ivory head, red bow, pink shirt, blue overalls.
 add('shirt',0,.72,0,.61,.58,.38,CHIBI.pink);
 add('overalls',0,.53,.025,.58,.48,.40,CHIBI.blue);
 add('bib',0,.72,.205,.35,.29,.055,CHIBI.blue);
 for(const side of [-1,1]){
  add('thigh'+side,side*.16,.345,.005,.20,.20,.22);
  add('leg'+side,side*.16,.20,.005,.19,.20,.21);
  add('shoe'+side,side*.16,.11,.065,.25,.18,.33);
  add('strap'+side,side*.17,.84,.191,.068,.24,.055,CHIBI.blue);
  add('button'+side,side*.17,.77,.24,.052,.053,.022,CHIBI.gold,{segments:12,rings:8});
  const limb=side<0?'left':'right';
  segment('sleeve'+side,limb+'Arm',limb+'Forearm',.205,CHIBI.pink,limb+'Arm');
  segment('arm'+side,limb+'Forearm',limb+'Hand',.155,CHIBI.white,limb+'Forearm');
  if(side<0||equipment==='empty'){
   const [x,y,z]=JOINTS[JOINT_INDEX[limb+'Hand']].pivot;
   add('paw'+side,x,y,z,.20,.17,.22);
   if(equipment==='empty')add('paw-thumb'+side,x-side*.072,y+.025,z+.035,.085,.09,.10);
  }
  add('ear'+side,side*.385,1.765,-.015,.34,.38,.30,CHIBI.white,{shape:'ear',segments:24,roll:-side*.18});
 }
 add('head',0,1.39,0,1.12,.87,.67,CHIBI.white,{segments:32,rings:18});
 for(const side of [-1,1]){
  add('eye'+side,side*.222,1.405,.309,.064,.102,.023,CHIBI.ink,{segments:16,rings:10});
  add('eye-glint'+side,side*.222-.010,1.43,.323,.014,.018,.006,[1,.98,.94],{segments:8,rings:6});
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
 return parts;
}
