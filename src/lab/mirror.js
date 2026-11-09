import {CHIBI,chibiPiece,placePieces,torchModel,grippingPaw} from './chibi-model.js';
// A bounded geometric mirror: one small reflected bathroom and a low-poly avatar.
// No second scene render, reflected lights, recursive mirrors or texture downloads.
export const BATH_MIRROR=Object.freeze({id:'bath-mirror',x:9.86,y:1.48,z:5.55,w:.045,h:1.85,d:1.50,mat:'glass',solid:false});
export const MIRROR_PLANE=BATH_MIRROR.x-BATH_MIRROR.w/2-.001;
export const MIRROR_SPAWN=Object.freeze({x:8.35,y:0,z:5.55,yaw:Math.PI/2});
export function mirrorVisible(camera){return camera.x<MIRROR_PLANE&&camera.x>7.55&&camera.y<3&&camera.z>4.4&&camera.z<7.4&&Math.sin(camera.yaw)>.12;}
export function reflectPoint(p){return {...p,x:2*MIRROR_PLANE-p.x};}
export function kittyMirrorPieces(){
 const parts=[];
 const add=(id,x,y,z,w,h,d,color=CHIBI.white,extra={})=>parts.push(chibiPiece('mirror-kitty-'+id,x,y,z,w,h,d,color,extra));
 // Match the protected 2D reference: oversized ivory head, red bow, pink shirt, blue overalls.
 add('shirt',0,.72,0,.61,.58,.38,CHIBI.pink);
 add('overalls',0,.53,.025,.58,.48,.40,CHIBI.blue);
 add('bib',0,.72,.205,.35,.29,.055,CHIBI.blue);
 for(const side of [-1,1]){
  add('leg'+side,side*.16,.235,.005,.20,.28,.22);
  add('shoe'+side,side*.16,.11,.065,.25,.18,.33);
  add('strap'+side,side*.17,.84,.191,.068,.24,.055,CHIBI.blue);
  add('button'+side,side*.17,.77,.24,.052,.053,.022,CHIBI.gold,{segments:12,rings:8});
  add('sleeve'+side,side*.32,.83,.005,.22,.24,.26,CHIBI.pink);
  if(side<0){add('arm'+side,-.36,.66,.02,.16,.28,.19);add('paw'+side,-.37,.54,.045,.20,.21,.22);}
  else add('arm'+side,.34,.91,.09,.16,.29,.19,CHIBI.white,{pitch:-.35});
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
 parts.push(...placePieces([...torchModel(true),...grippingPaw()],{x:.365,y:1.145,z:.25,scale:.87,prefix:'mirror-kitty-'}));
 return parts;
}
export function reflectedBathroom(boxes){
 const bath=boxes.filter(b=>!b.dynamic&&!b.id.includes('mirror')&&(b.id.startsWith('bath-')||/^(toilet-|basin|towel)/.test(b.id)));
 return [...bath,
  {id:'mirror-room-north',x:8.75,y:1.55,z:4.51,w:2.3,h:3.1,d:.05,mat:'wall2'},
  {id:'mirror-room-south',x:8.75,y:1.55,z:7.29,w:2.3,h:3.1,d:.05,mat:'wall2'},
  {id:'mirror-room-west',x:7.59,y:1.55,z:5.9,w:.05,h:3.1,d:2.8,mat:'wallpaper'},
  {id:'mirror-room-ceiling',x:8.75,y:3.08,z:5.9,w:2.3,h:.05,d:2.8,mat:'plaster'}
 ];
}
// Reflection is applied to vertices (including normals/tangents), not just centers.
// Winding must be reversed by the renderer because this transform has determinant -1.
export function reflectMesh(vertices){for(let i=0;i<vertices.length;i+=16){vertices[i]=2*MIRROR_PLANE-vertices[i];vertices[i+6]*=-1;vertices[i+13]*=-1;}return vertices;}
export function poseReflectedKitty(base,out,camera,motion={}){
 out.set(base);
 const c=Math.cos(camera.yaw),s=Math.sin(camera.yaw),bob=motion.reduced?0:Math.sin(motion.bob||0)*.018;
 const crouch=camera.y<1.3?.68:1;
 for(let i=0;i<base.length;i+=16){
  const x=base[i],y=base[i+1],step=motion.reduced||y>.4?0:Math.sin((motion.bob||0)+(x<0?Math.PI:0)),z=base[i+2]+step*.045;
  out[i]=2*MIRROR_PLANE-(camera.x+x*c+z*s);out[i+1]=camera.y-1.63*crouch+y*crouch+bob+Math.max(0,step)*.025;out[i+2]=camera.z-x*s+z*c;
  for(const k of [6,13]){out[i+k]=-(base[i+k]*c+base[i+k+2]*s);out[i+k+1]=base[i+k+1]/crouch;out[i+k+2]=-base[i+k]*s+base[i+k+2]*c;}
 }
 return out;
}
