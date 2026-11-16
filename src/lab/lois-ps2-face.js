// Photo-A anatomical head. One watertight parametric surface with a controlled
// cheek / jaw silhouette, not a photograph stretched over an oval sphere.
// Local UVs remain continuous and the model keeps the existing 21-bone head rig.
// Geometry is rebuilt on scene entry, never once per animation frame.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const gaussian=(x,y,cx,cy,sx,sy)=>{
 const dx=(x-cx)/sx,dy=(y-cy)/sy;
 return Math.exp(-.5*(dx*dx+dy*dy));
};
const normal3=(x,y,z)=>{const r=Math.hypot(x,y,z)||1;return [x/r,y/r,z/r];};
const band=(x,center,radius)=>Math.exp(-.5*((x-center)/radius)**2);

// Local x/y/z from UV. The seam is at the back of the head so the *front*
// occupies a continuous centered region of the eventual photographic UV atlas.
export function loisFacePoint(box,u,v){
 const theta=(u-.5)*Math.PI*2,phi=(v-.5)*Math.PI;
 const sin=Math.sin(theta),cos=Math.cos(theta),lat=Math.cos(phi),vertical=Math.sin(phi);
 const xBase=sin*lat*box.w*.5;
 const photo=!!box.photoMapped;
 // A real head is not a vertically squashed ellipse: broader cheekbones,
 // subtle mandibular angles, then a smaller chin. These smooth horizontal
 // contour bands add silhouette where it matters without adding eye/lip props.
 // The non-photo branch remains available ONLY as a numerical test baseline.
 const jaw=1-(photo?.19:.22)*clamp((-vertical-.16)/.70,0,1);
 const cheekWidth=photo?.055*band(vertical,-.12,.34):0;
 const jawCorner=photo?.037*band(vertical,-.53,.19):0;
 const chinTaper=photo?.056*clamp((-vertical-.78)/.20,0,1):0;
 const x=xBase*(jaw+cheekWidth+jawCorner-chinTaper);
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
 // The portrait texture already contains all facial features. Add small
 // structural cheekbone and lower-jaw volume beneath it (no duplicated
 // photographic nose/lips); keep the UV projection and rigid face intact.
 const photoCheekbones=(gaussian(x,y,-.113,-.030,.066,.080)+gaussian(x,y,.113,-.030,.066,.080))*.011;
 // The lower lip/chin must transition to a real under-jaw volume rather than
 // creating a sharp hanging tip at the photo's bottom. The chin shelf blends
 // smoothly into the jaw corners and is most pronounced on the frontal third.
 const chinShelf=photo?.014*band(vertical,-.65,.18)*band(x,0,.106):0;
 const jawPlane=photo?.008*band(vertical,-.48,.22)*band(Math.abs(x),.119,.067):0;
 const photoRelief=nose*.28+tip*.16+chin*.08+cheekL*.08+cheekR*.08+
  photoCheekbones+chinShelf+jawPlane;
 // Grow the rear skull in profile without changing the face photograph.
 // It keeps hair, ears and the forehead supported by a genuine cranial mass.
 const craniumBack=photo?Math.max(0,-cos)*lat*.019*band(vertical,.16,.57):0;
 const z=cos*lat*box.d*.5-craniumBack+
  front*(photo?photoRelief:(nose+tip+philtrum+upperLip+lowerLip+chin+cheekL+cheekR+browL+browR));
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
