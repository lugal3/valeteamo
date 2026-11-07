import {blocked,groundHeight,HEIGHT} from './world.js';

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
   if(Math.abs(ny-state.y)>.35)return false;
   if(blocked(world.boxes,nx,ny,nz,PLAYER_RADIUS,body))return false;
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
 if(state.x>8.52&&state.x<10.98&&state.z>=4.3&&state.z<=9.4)return state.y>=HEIGHT*.9?'Arriba':state.y<=.15?'Abajo':'Escaleras';
 return '';
}
export function smoothAxis(current,target,delta,response=10){
 return current+(target-current)*(1-Math.exp(-response*Math.min(.1,Math.max(0,delta))));
}
