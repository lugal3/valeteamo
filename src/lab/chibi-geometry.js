// Indexed surfaces with smooth analytic normals. Built once, then posed in reusable buffers.
// Used only by chibi models; world meshes, collision geometry and materials are unchanged.
const unit=v=>{const length=Math.hypot(...v)||1;return v.map(n=>n/length);};
export const BEVEL_PROFILE=[[-.5,0],[-.5,.82],[-.475,.96],[-.435,1],[.435,1],[.475,.96],[.5,.82],[.5,0]];
const EAR_PROFILE=[[-.5,0],[-.47,.70],[-.34,.98],[-.12,.87],[.10,.63],[.29,.36],[.43,.13],[.48,.035],[.49,0]];
export function smoothSurface(box,color,style){
 const vertices=[],indices=[],segments=box.segments||20;
 const profile=box.shape==='ear'?EAR_PROFILE:box.profile||BEVEL_PROFILE;
 const sphere=box.shape==='round',rings=sphere?(box.rings||12):profile.length-1;
 for(let row=0;row<=rings;row++)for(let col=0;col<=segments;col++){
  const u=col/segments,v=row/rings,a=u*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
  let p,n,t;
  if(sphere){
   const lat=(v-.5)*Math.PI,cl=Math.cos(lat),sl=Math.sin(lat);
   p=[c*cl*box.w/2,sl*box.h/2,s*cl*box.d/2];n=unit([c*cl/box.w,sl/box.h,s*cl/box.d]);t=[-s,0,c];
  }else{
   const [axis,r]=profile[row],prev=profile[Math.max(0,row-1)],next=profile[Math.min(rings,row+1)],slope=(next[1]-prev[1])/Math.max(.00001,next[0]-prev[0]);
   if(box.shape==='ear'){
    p=[c*r*box.w/2,axis*box.h,s*r*box.d/2];n=unit([c/box.w,-slope/(2*box.h),s/box.d]);t=[-s,0,c];
   }else{
    p=[c*r*box.w/2,s*r*box.h/2,axis*box.d];n=unit([c/box.w,s/box.h,-slope/(2*box.d)]);t=[-s,c,0];
   }
  }
  vertices.push(box.x+p[0],box.y+p[1],box.z+p[2],...color,...n,u,v,0,style,...t);
 }
 for(let row=0;row<rings;row++)for(let col=0;col<segments;col++){
  const a=row*(segments+1)+col,b=a+1,c=a+segments+2,d=a+segments+1;
  if(!sphere&&box.shape!=='ear')indices.push(a,c,b,a,d,c);
  else indices.push(a,b,c,a,c,d);
 }
 return {vertices,indices};
}
