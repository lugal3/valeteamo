import {lineBlocked,roomAt} from './world.js';

// Reachable targets only; hysteresis never retains an object through a wall.
export function interactionTarget(world,camera,previous=null){
 const direction={x:Math.sin(camera.yaw)*Math.cos(camera.pitch),y:Math.sin(camera.pitch),z:Math.cos(camera.yaw)*Math.cos(camera.pitch)};
 let best=null,bestScore=Infinity;
 for(const object of world.objects){
  if(object.taken||object.concealed||object.interactable===false)continue;
  // A shower inside the bathroom must never be used through the corridor wall.
  if(object.id==='hide-shower'&&roomAt(camera.x,camera.z,camera.y-1.1)!=='Baño')continue;
  const dx=object.x-camera.x,dy=object.y-camera.y,dz=object.z-camera.z;
  const distance=Math.hypot(dx,dy,dz),forward=dx*direction.x+dy*direction.y+dz*direction.z;
  if(forward<.18||distance>2.45)continue;
  const lateral=Math.sqrt(Math.max(0,distance*distance-forward*forward));
  const width=object.kind==='door'?.81:object.kind==='bed'?.83:object.kind==='light-switch'?.28:.57;
  if(lateral>width)continue;
  if(lineBlocked(world.boxes,camera,object,['door','safe','cupboard'].includes(object.kind)?object.box?.id||'door-'+object.id:''))continue;
  const score=lateral*.95+distance*.2-(previous?.id===object.id?.14:0);
  if(score<bestScore){best=object;bestScore=score;}
 }
 return best;
}

export function canApproachDoor(world,state,door){
 if(door.kind!=='door'||door.open||Math.abs(state.y-(door.y-1.1))>1.1)return false;
 // Start before a walking player enters an outward leaf's swept arc.
 if(Math.hypot(door.x-state.x,door.z-state.z)>2.0)return false;
 return !lineBlocked(world.boxes,{x:state.x,y:state.y+1.1,z:state.z},door,'door-'+door.id);
}
