import {characterPieces} from './character-model.js';
import {skinCharacter} from './character-rig.js';
export const kittyMirrorPieces=characterPieces;
// A bounded geometric mirror: one small reflected bathroom and a low-poly avatar.
// No second scene render, reflected lights, recursive mirrors or texture downloads.
export const BATH_MIRROR=Object.freeze({id:'bath-mirror',x:9.86,y:1.48,z:5.55,w:.045,h:1.85,d:1.50,mat:'glass',solid:false});
export const MIRROR_PLANE=BATH_MIRROR.x-BATH_MIRROR.w/2-.001;
export const MIRROR_SPAWN=Object.freeze({x:8.35,y:0,z:5.55,yaw:Math.PI/2});
export function mirrorVisible(camera){return camera.x<MIRROR_PLANE&&camera.x>7.55&&camera.y<3&&camera.z>4.4&&camera.z<7.4&&Math.sin(camera.yaw)>.12;}
export function reflectPoint(p){return {...p,x:2*MIRROR_PLANE-p.x};}
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
export function poseReflectedKitty(base,out,camera,motion={},binding=null){
 if(binding)skinCharacter(base,out,binding);else out.set(base);
 const c=Math.cos(camera.yaw),s=Math.sin(camera.yaw),crouch=motion.crouched?.68:1;
 const ground=motion.feetY??camera.y-1.63*crouch;
 for(let i=0;i<base.length;i+=16){
  const x=out[i],y=out[i+1],z=out[i+2];
  out[i]=2*MIRROR_PLANE-(camera.x+x*c+z*s);out[i+1]=ground+y*crouch;out[i+2]=camera.z-x*s+z*c;
  for(const k of [6,13]){const x=out[i+k],y=out[i+k+1]/crouch,z=out[i+k+2],length=Math.hypot(x,y,z)||1;out[i+k]=-(x*c+z*s)/length;out[i+k+1]=y/length;out[i+k+2]=(-x*s+z*c)/length;}
 }
 return out;
}
