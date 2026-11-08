// A bounded geometric mirror: one small reflected bathroom and a low-poly avatar.
// No second scene render, reflected lights, recursive mirrors or texture downloads.
export const BATH_MIRROR=Object.freeze({id:'bath-mirror',x:9.86,y:1.48,z:5.55,w:.045,h:1.85,d:1.50,mat:'glass',solid:false});
export const MIRROR_PLANE=BATH_MIRROR.x-BATH_MIRROR.w/2-.001;
export const MIRROR_SPAWN=Object.freeze({x:8.35,y:0,z:5.55,yaw:Math.PI/2});
export function mirrorVisible(camera){return camera.x<MIRROR_PLANE&&camera.x>7.55&&camera.y<3&&camera.z>4.4&&camera.z<7.4&&Math.sin(camera.yaw)>.12;}
export function reflectPoint(p){return {...p,x:2*MIRROR_PLANE-p.x};}
export function kittyMirrorPieces(){
 const parts=[];
 const add=(id,x,y,z,w,h,d,mat='glove',shape='round',extra={})=>parts.push({id:'mirror-kitty-'+id,x,y,z,w,h,d,mat,shape,solid:false,glow:true,segments:8,rings:4,...extra});
 add('dress',0,.66,0,.58,.67,.37,'bow');add('bib',0,.79,.19,.28,.27,.025,'pink');
 for(const side of [-1,1]){
  add('leg'+side,side*.16,.22,0,.20,.29,.23);add('shoe'+side,side*.16,.09,.05,.25,.17,.34,'pink');
  add('arm'+side,side*.36,side===1?.94:.77,.035,.17,.40,.20);add('paw'+side,side*.36,side===1?1.08:.59,.08,.20,.20,.22);
  add('ear'+side,side*.28,1.73,0,.30,.35,.24,'glove','gable');
 }
 add('head',0,1.40,.015,.94,.71,.56);
 for(const side of [-1,1]){
  add('eye'+side,side*.19,1.40,.283,.065,.092,.024,'dark');
  for(let i=0;i<3;i++)add('whisker'+side+i,side*.40,1.30+i*.08,.244,.19,.019,.019,'dark','box',{yaw:side*(i-1)*.12});
 }
 add('nose',0,1.32,.305,.09,.058,.035,'brass');
 add('bow-left',-.34,1.70,.22,.27,.23,.12,'bow');add('bow-right',-.10,1.70,.25,.25,.22,.12,'bow');add('bow-knot',-.22,1.70,.30,.13,.13,.10,'bow');
 // The physical torch follows the right paw; its lens does not cast a reflected beam.
 add('torch',.36,1.16,.32,.14,.14,.42,'torchmetal','cylinder');
 add('torch-grip',.36,1.16,.21,.16,.16,.15,'dark','cylinder');
 add('torch-rim',.36,1.16,.55,.19,.19,.05,'brass','cylinder');
 add('torch-lens',.36,1.16,.58,.15,.15,.02,'torchglass','cylinder');
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
