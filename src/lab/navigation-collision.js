import {overlapsFootprint} from './world.js';

// Each query checks only the colliders whose padded footprint touches its cell.
// The narrow phase stays identical to navigation's swept collision checks.
export function indexNavigationColliders(boxes,radius,bodyHeight){
 const grid=new Map();
 for(const box of boxes){
  if(!box.solid||box.walkSurface||box.id.startsWith('floor-up-'))continue;
  const angle=box.yaw||0,cos=Math.cos(angle),sin=Math.sin(angle);
  const halfWidth=box.w*.5,halfDepth=box.d*.5;
  const halfX=Math.abs(cos)*halfWidth+Math.abs(sin)*halfDepth+radius;
  const halfZ=Math.abs(sin)*halfWidth+Math.abs(cos)*halfDepth+radius;
  const collider={x:box.x,z:box.z,cos,sin,halfWidth,halfDepth,
   bottom:box.y-box.h/2+.02,top:box.y+box.h/2-.02};
  for(let x=Math.floor(box.x-halfX);x<=Math.floor(box.x+halfX);x++){
   if(!grid.has(x))grid.set(x,new Map());
   const row=grid.get(x);
   for(let z=Math.floor(box.z-halfZ);z<=Math.floor(box.z+halfZ);z++){
    if(!row.has(z))row.set(z,[]);
    row.get(z).push(collider);
   }
  }
 }
 const radiusSquared=radius*radius;
 return (x,y,z)=>{
  const boxesAt=grid.get(Math.floor(x))?.get(Math.floor(z));
  if(!boxesAt)return false;
  for(const box of boxesAt){
   if(!(y<box.top&&y+bodyHeight>box.bottom))continue;
   const dx=x-box.x,dz=z-box.z;
   if(overlapsFootprint(dx*box.cos+dz*box.sin,-dx*box.sin+dz*box.cos,box.halfWidth,box.halfDepth,radiusSquared))return true;
  }
  return false;
 };
}
