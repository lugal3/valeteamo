// VALETEAMO V2 / Phase 03: deterministic perception, never secret player coords.
// Helpers deliberately have no renderer or browser dependencies.
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export const TRAIL_SEARCH_SECONDS=7;
export function canHearNoise(listener,source,intensity=1,occluded=false){
 if(!listener||!source||![listener.x,listener.y,listener.z,source.x,source.y,source.z].every(Number.isFinite))return false;
 const strength=clamp(Number.isFinite(intensity)?intensity:1,.2,2.5);
 const horizontal=Math.hypot(listener.x-source.x,listener.z-source.z);
 const vertical=Math.abs(listener.y-source.y);
 // Footsteps, dishes and meows propagate further according to intensity.
 // Walls/closed doors dampen the event; different floors require a
 // physically louder event, but a deliberate cat distraction still carries.
 const distance=Math.hypot(horizontal,vertical*1.55);
 const range=(5.2+strength*7.3)*(occluded?.78:1);
 return distance<=range;
}
export function searchAroundLastSeen(point,ground,free){
 if(!point||![point.x,point.y,point.z].every(Number.isFinite))return [];
 const offsets=[[0,0],[.85,0],[0,.85],[-.85,0],[0,-.85]];
 const points=[];
 for(const [dx,dz] of offsets){
  const x=point.x+dx,z=point.z+dz;
  const y=ground(x,z,point.y);
  if(!Number.isFinite(y)||Math.abs(y-point.y)>.32||!free(x,y,z))continue;
  points.push({x,y,z});
 }
 return points;
}
