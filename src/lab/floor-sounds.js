import {HOUSE,HEIGHT,STAIR,roomAt} from './house-layout.js';

// Session-only sound zones: no visible mesh, collision or saved-story state.
export const CREAK_ZONES=Object.freeze([
 {id:'hall-board',x:5.9,y:0,z:8.8,r:.7},
 {id:'living-board',x:3.8,y:0,z:9.5,r:.65},
 {id:'study-board',x:3,y:0,z:3.7,r:.6},
 {id:'landing-board',x:10.2,y:HEIGHT,z:4.1,r:.65},
 {id:'upper-hall-board',x:6,y:HEIGHT,z:6.5,r:.7}
]);
export function floorSurface(p){
 if(p.x>=STAIR.xMin&&p.x<=STAIR.xMax&&p.z>=STAIR.zTop&&p.z<=STAIR.zBottom)return 'stair';
 if(p.x<0||p.x>HOUSE.width||p.z<0||p.z>HOUSE.depth)return Math.abs(p.x-5.9)<.9?'stone':'grass';
 const room=roomAt(p.x,p.z,p.y);return room==='Baño'||room==='Cocina y comedor'?'tile':'wood';
}
export class FloorSounds{
 constructor(){this.reset();}
 reset(){this.time=0;this.distance=0;this.inside=new Set();this.last=new Map();this.lastCreak=-Infinity;this.steps=0;this.triggers=0;}
 advance(dt,p,moved){
  this.time+=Math.max(0,dt);const cues=[];
  if(!(moved>.0001))return cues;
  const surface=floorSurface(p),stride=surface==='stair'?.36:p.crouched?.84:.66;
  this.distance+=moved;
  if(this.distance>=stride){this.distance%=stride;this.steps++;cues.push({kind:surface==='stair'?'stair':surface,level:p.crouched?.42:1});}
  for(const zone of CREAK_ZONES){
   const d=Math.hypot(p.x-zone.x,p.z-zone.z),sameFloor=Math.abs(p.y-zone.y)<.35;
   if(!sameFloor||d>zone.r+.22){this.inside.delete(zone.id);continue;}
   if(d<=zone.r&&!this.inside.has(zone.id)){
    this.inside.add(zone.id);
    if(this.time-(this.last.get(zone.id)??-Infinity)<14||this.time-this.lastCreak<3)continue;
    this.last.set(zone.id,this.time);this.lastCreak=this.time;this.triggers++;cues.push({kind:'floor-groan',origin:zone,level:p.crouched?.65:1});
   }
  }
  return cues;
 }
}
