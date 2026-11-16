// PS2-B sculpted, closed facial surface. One contiguous elliptical mesh,
// including cheekbones, bridge of nose, tip, lips and chin. Not photo-textured yet.
// This module has zero DOM or WebGL dependency and builds once per model variant.
// Phase 3 uses face UV (u=.5 is frontal; the seam at u=0/1 is hidden behind the hair).
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const gaussian=(x,y,cx,cy,sx,sy)=>{
 const dx=(x-cx)/sx,dy=(y-cy)/sy;
 return Math.exp(-.5*(dx*dx+dy*dy));
};
const normal3=(x,y,z)=>{const r=Math.hypot(x,y,z)||1;return [x/r,y/r,z/r];};

// Local x/y/z from UV. The seam is at the back of the head so the *front*
// occupies a continuous centered region of the eventual photographic UV atlas.
export function loisFacePoint(box,u,v){
 const theta=(u-.5)*Math.PI*2,phi=(v-.5)*Math.PI;
 const sin=Math.sin(theta),cos=Math.cos(theta),lat=Math.cos(phi),vertical=Math.sin(phi);
 const xBase=sin*lat*box.w*.5;
 const jaw=1-.22*clamp((-vertical-.16)/.70,0,1);
 const x=xBase*jaw;
 const y=vertical*box.h*.5;
 const front=Math.max(0,cos)*Math.pow(Math.max(0,lat),.28);
 const nose=gaussian(x,y,0,-.041,.039,.075)*.067;
 const tip=gaussian(x,y,0,-.075,.054,.036)*.024;
 const philtrum=gaussian(x,y,0,-.118,.026,.020)*.006;
 const upperLip=gaussian(x,y,0,-.142,.063,.015)*.009;
 const lowerLip=gaussian(x,y,0,-.167,.064,.017)*.007;
 const chin=gaussian(x,y,0,-.192,.075,.035)*.021;
 const cheekL=gaussian(x,y,-.101,-.019,.047,.064)*.015;
 const cheekR=gaussian(x,y,.101,-.019,.047,.064)*.015;
 const browL=gaussian(x,y,-.091,.078,.069,.026)*.010;
 const browR=gaussian(x,y,.091,.078,.069,.026)*.010;
 // A photo must supply the facial anatomy: do not emboss a second nose/lips
 // on top of eyes and mouth that already exist in the image.
 const photoRelief=nose*.28+tip*.16+chin*.08+cheekL*.08+cheekR*.08;
 const z=cos*lat*box.d*.5+front*(box.photoMapped?photoRelief:(nose+tip+philtrum+upperLip+lowerLip+chin+cheekL+cheekR+browL+browR));
 return [box.x+x,box.y+y,box.z+z];
}
export function loisFaceSurface(box,color,style){
 const segments=Math.max(8,Math.round(box.segments||24));
 const rings=Math.max(6,Math.round(box.rings||14));
 const vertices=[],indices=[];
 const index=(row,col)=>row*(segments+1)+col;
 for(let row=0;row<=rings;row++){
  const v=row/rings;
  for(let col=0;col<=segments;col++){
   const u=col/segments;
   const p=loisFacePoint(box,u,v);
   const tiny=.0001;
   const pa=loisFacePoint(box,u-tiny,v),pb=loisFacePoint(box,u+tiny,v);
   const pc=loisFacePoint(box,u,v-tiny),pd=loisFacePoint(box,u,v+tiny);
   const tangent=normal3(pb[0]-pa[0],pb[1]-pa[1],pb[2]-pa[2]);
   const vy=[pd[0]-pc[0],pd[1]-pc[1],pd[2]-pc[2]];
   let nx=tangent[1]*vy[2]-tangent[2]*vy[1];
   let ny=tangent[2]*vy[0]-tangent[0]*vy[2];
   let nz=tangent[0]*vy[1]-tangent[1]*vy[0];
   if(Math.hypot(nx,ny,nz)<1e-7){
    const xx=p[0]-box.x,yy=p[1]-box.y,zz=p[2]-box.z;
    [nx,ny,nz]=normal3(xx/(box.w*box.w),yy/(box.h*box.h),zz/(box.d*box.d));
   }else [nx,ny,nz]=normal3(nx,ny,nz);
   // Subtle analytic complexion, not a replacement for the UV artwork in phase 3.
   // Keep the material shader in control of final lighting and colors.
   const x=p[0]-box.x,y=p[1]-box.y,front=Math.max(0,nz);
   const blush=.045*(gaussian(x,y,-.10,-.04,.058,.05)+gaussian(x,y,.10,-.04,.058,.05))*front;
   const jawShade=.045*clamp((-y-.10)/.16,0,1)*front;
   const tint=[color[0]*(1-blush-jawShade),color[1]*(1-blush*.6-jawShade),color[2]*(1-blush*.3-jawShade)];
   vertices.push(...p,...tint,nx,ny,nz,u,v,box.faceTexture===false?0:3,style,...tangent);
  }
 }
 for(let row=0;row<rings;row++){
  for(let col=0;col<segments;col++){
   const a=index(row,col),b=a+1,c=index(row+1,col+1),d=c-1;
   // Match the existing WebGL renderer's front-face convention (same as smoothSurface).
   // The earlier winding culled the entire face, leaving the dark hair shell visible.
   indices.push(a,c,b,a,d,c);
  }
 }
 return {vertices,indices};
}
