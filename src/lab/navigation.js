import {blocked,groundHeight,HEIGHT,STAIR} from './world.js';
import {sweepClear} from './furniture-motion.js';

/**
 * Small swept movement steps with separate axis collision. A small horizontal radius,
 * a continuous stair ramp, and recovery from a blocked position keep narrow passages
 * navigable on touch controls without passing through solid walls.
 */
export const PLAYER_RADIUS=.155;
export const PLAYER_HEIGHT=1.64;
export function navigate(state,world,dx,dz,body=PLAYER_HEIGHT){
 const distance=Math.hypot(dx,dz);
 const pieces=Math.max(1,Math.ceil(distance/.042));
 let moved=0;
 for(let i=0;i<pieces;i++){
  const tryMove=(nx,nz)=>{
   const ny=groundHeight(nx,nz,state.y);
   if(!Number.isFinite(ny)||Math.abs(ny-state.y)>.35)return false;
   if(blocked(world.boxes,nx,ny,nz,PLAYER_RADIUS,body))return false;
   // Reserve the remaining swing/slide while furniture moves, so the player
   // cannot enter its future path and leave both movement and animation stuck.
   if(world.objects?.some(o=>o.motion&&o.box&&!sweepClear(o,o.amount,o.motion.target,{x:nx,y:ny,z:nz,crouched:body<1.2})))return false;
   moved+=Math.hypot(nx-state.x,nz-state.z);
   state.x=nx;state.z=nz;state.y=ny;return true;
  };
  const sx=dx/pieces,sz=dz/pieces;
  if(!tryMove(state.x+sx,state.z+sz)){
   // A wall can stop one axis without blocking the other; normalize the speed
   // by the number of successful components rather than jumping through corners.
   const xFirst=Math.abs(sx)>=Math.abs(sz);
   if(xFirst){tryMove(state.x+sx,state.z);tryMove(state.x,state.z+sz);}
   else{tryMove(state.x,state.z+sz);tryMove(state.x+sx,state.z);}
  }
 }
 return moved;
}
export function getStairDirection(state){
 if(state.x>STAIR.xMin-.1&&state.x<STAIR.xMax+.1&&state.z>=STAIR.zTop-.2&&state.z<=STAIR.zBottom+.25)return state.y>=HEIGHT*.9?'Arriba':state.y<=.15?'Abajo':'Escaleras';
 return '';
}
export function smoothAxis(current,target,delta,response=10){
 return current+(target-current)*(1-Math.exp(-response*Math.min(.1,Math.max(0,delta))));
}
