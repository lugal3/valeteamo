// Optional companion abilities. Does not modify the story checkpoint schema.
import {HEIGHT,groundHeight,blocked} from './world.js';

export const EMY_SCAN_SECONDS=6;
export const EMY_SCAN_COOLDOWN=28;
export const EMY_DISTRACT_SECONDS=25;
export const EMY_DISTRACT_COOLDOWN=55;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function createEmyAbilities(){return {scan:0,scanCooldown:0,distractCooldown:0,wave:0};}
export function advanceEmyAbilities(state,dt){
 const step=clamp(Number.isFinite(dt)?dt:0,0,.1);
 state.scan=Math.max(0,state.scan-step);
 state.scanCooldown=Math.max(0,state.scanCooldown-step);
 state.distractCooldown=Math.max(0,state.distractCooldown-step);
 state.wave=Math.max(0,state.wave-step);
}
export function activateEmyScan(state){
 if(state.scanCooldown>0)return false;
 state.scan=EMY_SCAN_SECONDS;state.scanCooldown=EMY_SCAN_COOLDOWN;state.wave=1.1;
 return true;
}
export function roomChoices(rooms){
 return [
  ...rooms.filter(r=>r.id!=='music').map(r=>({...r})),
  {id:'hall-ground',label:'Recibidor y pasillo',floor:0,x0:4.5,x1:7.25,z0:2,z1:11},
  {id:'hall-upper',label:'Distribuidor y descansillo',floor:1,x0:4.5,x1:10.2,z0:3.3,z1:10.1},
  ...rooms.filter(r=>r.id==='music').map(r=>({...r}))
 ];
}
export function roomDestination(world,choice){
 if(!choice)return null;
 const y=choice.floor?HEIGHT:0,cx=(choice.x0+choice.x1)/2,cz=(choice.z0+choice.z1)/2;
 const offsets=[[0,0],[.55,0],[-.55,0],[0,.55],[0,-.55],[1,0],[-1,0],[0,1],[0,-1],[1.5,.5],[-1.5,-.5],[.7,1.2],[-.7,-1.2]];
 for(const [dx,dz] of offsets){
  const x=clamp(cx+dx,choice.x0+.34,choice.x1-.34),z=clamp(cz+dz,choice.z0+.34,choice.z1-.34);
  const floor=groundHeight(x,z,y,world.hatch?.amount>.92);
  if(!Number.isFinite(floor)||Math.abs(floor-y)>.2||blocked(world.boxes,x,floor,z,.25,.7))continue;
  return {x,y:floor,z};
 }
 return null;
}
export function emyFloorMap(rooms,floor){
 const available=roomChoices(rooms).filter(room=>room.floor===floor);
 // Same dimensions and coordinates as the house layout, never a decorative guess.
 const tiles=available.map(room=>{
  const left=100*room.x0/14,top=100*room.z0/12;
  const width=100*(room.x1-room.x0)/14,height=100*(room.z1-room.z0)/12;
  return '<button class="house-emy-room" data-act="emy:room:'+room.id+'" style="left:'+left+'%;top:'+top+'%;width:'+width+'%;height:'+height+'%" aria-label="Enviar Emy a '+room.label+'">'+room.label+'</button>';
 }).join('');
 return '<div class="house-emy-plan" role="group" aria-label="Habitaciones de la planta '+(floor+1)+'">'+tiles+'</div>';
}
