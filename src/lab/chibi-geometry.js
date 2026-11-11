// Indexed surfaces with smooth analytic normals. Built once, then posed in reusable buffers.
// Used by chibi models and architectural prop lathe / torus / rounded-box primitives.
const unit=v=>{const length=Math.hypot(...v)||1;return v.map(n=>n/length);};
const sgnPow=(v,p)=>(v<0?-1:1)*Math.pow(Math.abs(v),p);

export const BEVEL_PROFILE=[[-.5,0],[-.5,.82],[-.475,.96],[-.435,1],[.435,1],[.475,.96],[.5,.82],[.5,0]];
const EAR_PROFILE=[[-.5,0],[-.47,.70],[-.34,.98],[-.12,.87],[.10,.63],[.29,.36],[.43,.13],[.48,.035],[.49,0]];

// Architectural lathe profiles (Fase 4)
export const BALUSTER_PROFILE=[[-.5,.36],[-.28,.50],[-.08,.32],[.12,.50],[.32,.32],[.5,.36]];
export const CUP_PROFILE=[[-.5,0],[-.46,.58],[-.38,.72],[.28,.84],[.46,.95],[.5,.90]];
export const CANDLE_PROFILE=[[-.5,.75],[-.45,.80],[-.38,.48],[.35,.48],[.44,.42],[.5,.12]];
export const CLOCK_PROFILE=[[-.5,.2],[-.4,.75],[-.25,.88],[.25,.88],[.4,.75],[.5,.2]];

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
  const tint=box.vertexColor?box.vertexColor(p,color,box):color;
  vertices.push(box.x+p[0],box.y+p[1],box.z+p[2],...tint,...n,u,v,0,style,...t);
 }
 for(let row=0;row<rings;row++)for(let col=0;col<segments;col++){
  const a=row*(segments+1)+col,b=a+1,c=a+segments+2,d=a+segments+1;
  if(!sphere&&box.shape!=='ear')indices.push(a,c,b,a,d,c);
  else indices.push(a,b,c,a,c,d);
 }
 return {vertices,indices};
}

export function torusSurface(box,color,style){
 const vertices=[],indices=[];
 const segments=box.segments||6,tubeSegments=box.tubeSegments||4;
 const majorR=box.majorRadius||(box.w-box.d)/2||box.w*.35;
 const minorR=box.tubeRadius||box.d/2;
 for(let i=0;i<=segments;i++){
  const u=i/segments,phi=u*Math.PI*2,cp=Math.cos(phi),sp=Math.sin(phi);
  for(let j=0;j<=tubeSegments;j++){
   const v=j/tubeSegments,theta=v*Math.PI*2,ct=Math.cos(theta),st=Math.sin(theta);
   const px=(majorR+minorR*ct)*cp,py=minorR*st,pz=(majorR+minorR*ct)*sp;
   const nx=ct*cp,ny=st,nz=ct*sp,tx=-sp,ty=0,tz=cp;
   vertices.push(box.x+px,box.y+py,box.z+pz,...color,nx,ny,nz,u,v,0,style,tx,ty,tz);
  }
 }
 for(let i=0;i<segments;i++)for(let j=0;j<tubeSegments;j++){
  const a=i*(tubeSegments+1)+j,b=a+1,c=a+tubeSegments+2,d=a+tubeSegments+1;
  indices.push(a,c,b,a,d,c);
 }
 return {vertices,indices};
}

export function roundedBoxSurface(box,color,style){
 const vertices=[],indices=[];
 const segments=box.segments||6,rings=box.rings||3;
 const p=box.roundness||0.32;
 for(let row=0;row<=rings;row++){
  const v=row/rings,lat=(v-0.5)*Math.PI,cl=Math.cos(lat),sl=Math.sin(lat);
  const scl=sgnPow(cl,p),ssl=sgnPow(sl,p);
  for(let col=0;col<=segments;col++){
   const u=col/segments,a=u*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);
   const sca=sgnPow(ca,p),ssa=sgnPow(sa,p);
   const px=sca*scl*box.w/2,py=ssl*box.h/2,pz=ssa*scl*box.d/2;
   const n=unit([px/(box.w*box.w),py/(box.h*box.h),pz/(box.d*box.d)]);
   const t=[-sa,0,ca];
   vertices.push(box.x+px,box.y+py,box.z+pz,...color,...n,u,v,0,style,...t);
  }
 }
 for(let row=0;row<rings;row++)for(let col=0;col<segments;col++){
  const a=row*(segments+1)+col,b=a+1,c=a+segments+2,d=a+segments+1;
  indices.push(a,b,c,a,c,d);
 }
 return {vertices,indices};
}
