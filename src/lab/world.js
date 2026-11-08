// Deterministic, editable dollhouse layout. Metres: x/z horizontal, y upward.
import {HEIGHT,HOUSE,STAIR,WORLD_BOUNDS,ROOMS,roomAt,buildHouse} from './house-layout.js';
export {HEIGHT,HOUSE,STAIR,WORLD_BOUNDS,ROOMS,roomAt};
export const MATERIAL = {
  wallpaper: [0.75, 0.56, 0.65], wall2: [0.57, 0.61, 0.69], plaster: [0.68, 0.67, 0.72],
  wood: [0.47, 0.29, 0.30], floor: [0.48, 0.34, 0.38], tile: [0.38, 0.51, 0.52],
  velvet: [0.65, 0.33, 0.45], cream: [0.85, 0.76, 0.65], pink: [0.92, 0.59, 0.65],
  dark: [0.28, 0.24, 0.33], glass: [0.49, 0.63, 0.76], brass: [0.94, 0.68, 0.33],
  paper: [0.93, 0.84, 0.70], foliage: [0.43, 0.61, 0.43], carpet: [0.58, 0.37, 0.51],
  trim: [0.80, 0.60, 0.57], terracotta: [0.72, 0.42, 0.36], stem: [0.31, 0.43, 0.29],
  glove: [0.98, 0.88, 0.84], pawpad: [0.96, 0.54, 0.62], torchmetal: [0.39, 0.47, 0.57], torchglass: [1.0, 0.93, 0.64], bow: [0.84, 0.23, 0.36]
  ,grass:[.27,.39,.30],stone:[.55,.53,.51],asphalt:[.19,.22,.28],roof:[.27,.25,.32],carpaint:[.30,.50,.56]
};
export function createHouse(spawn='ground'){return buildHouse(spawn);}

export function stairHeight(x,z) {
  if(x>=STAIR.xMin&&x<=STAIR.xMax&&z>=STAIR.zTop&&z<=STAIR.zBottom)return HEIGHT*(STAIR.zBottom-z)/(STAIR.zBottom-STAIR.zTop);
  return null;
}
export function groundHeight(x,z,levelHint=0) {
  const stair=stairHeight(x,z); if(stair!==null) return stair;
  if(x<WORLD_BOUNDS.minX||x>WORLD_BOUNDS.maxX||z<WORLD_BOUNDS.minZ||z>WORLD_BOUNDS.maxZ)return NaN;
  if(x<0||x>HOUSE.width||z<0||z>HOUSE.depth)return 0;
  if(levelHint>HEIGHT*.52&&x>STAIR.wellX&&z>STAIR.zTop&&z<STAIR.wellZ)return NaN;
  return levelHint>HEIGHT*.52?HEIGHT:0;
}
export function overlaps(box, x, footY, z, radius=.19, bodyHeight=1.65) {
  // A slab is a walking surface/visual occluder, not a wall to trap a head at stair landings.
  if(!box.solid||box.id.startsWith('floor-up-'))return false;
  if(!(footY < box.y+box.h/2-.02 && footY+bodyHeight > box.y-box.h/2+.02))return false;
  const yaw=box.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw),rx=x-box.x,rz=z-box.z;
  const dx=Math.max(0,Math.abs(rx*c+rz*s)-box.w/2),dz=Math.max(0,Math.abs(-rx*s+rz*c)-box.d/2);
  return dx*dx+dz*dz<radius*radius-1e-10;
}
export function blocked(boxes,x,footY,z,radius=.19,bodyHeight=1.65) {
  return boxes.some(box=>overlaps(box,x,footY,z,radius,bodyHeight));
}
export function segmentHitsBox(from,to,box,padding=0) {
  if(!box.solid)return false;
  if(box.yaw){
   const c=Math.cos(box.yaw),s=Math.sin(box.yaw),local=p=>({x:(p.x-box.x)*c+(p.z-box.z)*s,y:p.y,z:-(p.x-box.x)*s+(p.z-box.z)*c});
   return segmentHitsBox(local(from),local(to),{...box,x:0,z:0,yaw:0},padding);
  }
  let low=0, high=1;
  for(const axis of ['x','y','z']) {
    const center=box[axis], half=box[axis==='x'?'w':axis==='y'?'h':'d']/2+padding;
    const start=from[axis], delta=to[axis]-start;
    if(Math.abs(delta)<1e-8) {if(start<center-half||start>center+half)return false;continue;}
    const a=(center-half-start)/delta, c=(center+half-start)/delta;
    low=Math.max(low,Math.min(a,c));high=Math.min(high,Math.max(a,c));
    if(low>high)return false;
  }
  return high>.001 && low<.995;
}
export function lineBlocked(boxes,from,to,ignore='') {
  return boxes.some(box=>box.id!==ignore && !box.id.startsWith('step-') && segmentHitsBox(from,to,box));
}
export function setDoor(obj,open) {
  if(obj.kind!=='door')return;
  obj.motion=null;poseFurniture(obj,open?1:0);obj.open=!!open;obj.state=open?'open':'closed';
}
export function setDrawer(obj,open) {
  if(obj.kind!=='drawer')return;
  obj.motion=null;poseFurniture(obj,open?1:0);obj.open=!!open;obj.state=open?'open':'closed';
}
export function poseFurniture(obj,amount){
 obj.amount=Math.max(0,Math.min(1,amount));
 if(obj.wardrobeLeaves){
  for(const leaf of obj.wardrobeLeaves){const angle=leaf.angle*obj.amount,c=Math.cos(angle),s=Math.sin(angle);for(const part of leaf.parts){const dx=part.origin.x-leaf.hinge.x,dz=part.origin.z-leaf.hinge.z;part.box.x=leaf.hinge.x+dx*c-dz*s;part.box.z=leaf.hinge.z+dx*s+dz*c;part.box.yaw=angle;}}
  return;
 }
 if(obj.hinge){
  const angle=obj.swingAngle*obj.amount,c=Math.cos(angle),s=Math.sin(angle),place=(box,origin)=>{const dx=origin.x-obj.hinge.x,dz=origin.z-obj.hinge.z;box.x=obj.hinge.x+dx*c-dz*s;box.z=obj.hinge.z+dx*s+dz*c;box.yaw=angle;};
  place(obj.box,obj.origin);obj.box.solid=obj.kind==='door';for(const part of obj.parts||[])place(part.box,part.origin);obj.x=obj.box.x;obj.z=obj.box.z;return;
 }
 const axis=obj.slideAxis,offset=obj.slideDistance*obj.amount;
 obj.box[axis]=obj.origin[axis]+offset;
 if(obj.kind==='door')obj.box.solid=obj.amount<.999;
 for(const part of obj.parts||[])part.box[axis]=part.origin[axis]+offset;
 if(obj.kind==='drawer'){
  obj.z=obj.box.z-.03;
  for(const item of obj.contents||[]){item.object[axis]=item.origin[axis]+offset;item.object.concealed=obj.amount<.03;item.object.interactable=obj.amount>=.999&&!obj.motion;}
 }
}
