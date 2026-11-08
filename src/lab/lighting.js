// A small CPU depth field bounds the flashlight without per-fragment ray loops
// or shadow-map passes. Decorative/non-solid meshes never block the light.
export const LIGHT_DEPTH_SIZE=16;
export const LIGHT_REACH=18;
export const LIGHT_SPREAD=1.2;
const AXES=[['x','w'],['y','h'],['z','d']];
export function rayDistance(boxes,origin,direction,reach=LIGHT_REACH){
 let nearest=reach;
 for(const box of boxes){
  if(!box.solid)continue;
  let near=0,far=nearest;
  for(const [axis,size] of AXES){
   const delta=direction[axis],offset=box[axis]-origin[axis],half=box[size]/2;
   if(Math.abs(delta)<1e-8){if(Math.abs(offset)>half){far=-1;break;}continue;}
   const a=(offset-half)/delta,b=(offset+half)/delta;
   near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
   if(near>far)break;
  }
  if(far>=near&&near>.015&&near<nearest)nearest=near;
 }
 return nearest;
}
export function lightDepthField(boxes,camera,right,up,forward,pixels=new Uint8Array(LIGHT_DEPTH_SIZE*LIGHT_DEPTH_SIZE)){
 const direction={x:0,y:0,z:0};
 for(let y=0;y<LIGHT_DEPTH_SIZE;y++)for(let x=0;x<LIGHT_DEPTH_SIZE;x++){
  const sx=((x+.5)/LIGHT_DEPTH_SIZE*2-1)*LIGHT_SPREAD,sy=((y+.5)/LIGHT_DEPTH_SIZE*2-1)*LIGHT_SPREAD;
  direction.x=forward[0]+sx*right[0]+sy*up[0];direction.y=forward[1]+sx*right[1]+sy*up[1];direction.z=forward[2]+sx*right[2]+sy*up[2];
  const length=Math.hypot(direction.x,direction.y,direction.z);
  direction.x/=length;direction.y/=length;direction.z/=length;
  pixels[y*LIGHT_DEPTH_SIZE+x]=Math.ceil(rayDistance(boxes,camera,direction)/LIGHT_REACH*255);
 }
 return pixels;
}
