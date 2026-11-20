// Smooth indexed feline surfaces; local vertices are cached once per part.
// The same writer is used by WebGL and the offline model review renders.
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
function tint(p,c,s){
 if(!s.fur)return c;
 const [x,y,z]=p,w=s.w,h=s.h,d=s.d;
 const hair=.008*Math.sin(y*52+x*31+z*43);
 let value=1+hair;
 if(s.fur==='head'){
  // Painted tabby M and dark outer eye masks, never protruding geometry.
  const front=Math.max(0,z/d*2),high=Math.max(0,Math.min(1,(y/h+.08)*3));
  const mark=Math.exp(-Math.pow((Math.abs(x)-.034-Math.abs(y)*.4)/.012,2));
  value-=.31*mark*front*high;
  value-=.15*Math.max(0,Math.sin(Math.abs(x)*92+y*21))*front*high;
 }else if(s.fur!=='ruff')value-=.065*Math.pow(Math.max(0,Math.sin(z*42+x*26)),5);
 return c.map(v=>Math.max(0,v*value));
}
export function emySurface(box){
 if(box.emyMesh)return box.emyMesh;
 const s=box.emySpec;
 if(s.form==='fuzz'){
  const vertices=[],indices=[];let seed=17;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<s.count;i++){
   const a=rand()*Math.PI*2,lat=Math.asin(rand()*1.8-.9),nx=Math.cos(a)*Math.cos(lat),ny=Math.sin(lat),nz=Math.sin(a)*Math.cos(lat);
   if(s.fur==='head'&&nz>.45&&ny<.55&&ny>-.55)continue;
   const p=[nx*s.w/2,ny*s.h/2,nz*s.d/2],normal=norm([nx/s.w,ny/s.h,nz/s.d]),side=norm([-nz,0,nx]),len=s.length*(.6+.5*rand()),width=.0009;
   const tip=[p[0]+normal[0]*len*.28,p[1]-len,p[2]+normal[2]*len*.28],offset=vertices.length/16;
   const color=s.color.map(c=>c*(.85+.25*rand()));
   for(const pt of [p.map((v,k)=>v-side[k]*width),p.map((v,k)=>v+side[k]*width),tip])vertices.push(...pt,...color,...normal,0,0,0,64,...side);
   indices.push(offset,offset+1,offset+2,offset+2,offset+1,offset);
  }
  return box.emyMesh={vertices:new Float32Array(vertices),indices};
 }
 const n=s.segments||14,r=s.rings||9,vertices=[],indices=[];
 for(let row=0;row<=r;row++)for(let col=0;col<=n;col++){
  const u=col/n,v=row/r,a=u*Math.PI*2,lat=(v-.5)*Math.PI;
  let p=[Math.cos(a)*Math.cos(lat)*s.w/2,Math.sin(lat)*s.h/2,Math.sin(a)*Math.cos(lat)*s.d/2];
  let normal=norm([p[0]/(s.w*s.w),p[1]/(s.h*s.h),p[2]/(s.d*s.d)]);
  if(s.form==='ear'||s.form==='lock'){
   // Broad ear root, convex shell and tapered rounded tip, no roof prisms.
   const radius=Math.pow(Math.sin(Math.PI*v),.65)*(1-.65*v);
   p=[Math.cos(a)*radius*s.w*.72,(v-.5)*s.h,Math.sin(a)*radius*s.d*.70];
   const radiusAt=t=>Math.pow(Math.max(0,Math.sin(Math.PI*t)),.65)*(1-.65*t);
   const slope=(radiusAt(Math.min(1,v+.0001))-radiusAt(Math.max(0,v-.0001)))/.0002;
   normal=norm([Math.cos(a)/(s.w*.72),-slope/s.h,Math.sin(a)/(s.d*.70)]);
   if(s.form==='lock'){p[1]*=-1;normal[1]*=-1;}
  }
  if(s.form==='almond'){p[1]*=1-.50*Math.abs(p[0]*2/s.w);}
  if(s.form==='nose')p[0]*=.7+.6*(p[1]/s.h+.5);
  if(s.fur==='ruff'){
   // Soft lobed fur volume; the lower chest tapers instead of forming spikes.
   const taper=.7+.3*(p[1]/s.h+.5);p[0]*=taper;
   const ripple=1+.025*Math.sin(a*11+v*13);p[0]*=ripple;p[2]*=ripple;
  }
  if(s.fur==='head')p[0]*=.92+.10*(p[1]/s.h+.5);
  const c=tint(p,s.color,s);
  vertices.push(...p,...c,...normal,u,v,0,64,-Math.sin(a),0,Math.cos(a));
 }
 for(let y=0;y<r;y++)for(let x=0;x<n;x++){const a=y*(n+1)+x,b=a+1,c=a+n+2,d=a+n+1;if(s.form==='lock')indices.push(a,c,b,a,d,c);else indices.push(a,b,c,a,c,d);}
 box.emyMesh={vertices:new Float32Array(vertices),indices};return box.emyMesh;
}
export function rotateEmy(v,rx=0,ry=0,rz=0){
 const cr=Math.cos(rz),sr=Math.sin(rz),cp=Math.cos(rx),sp=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry);
 const x=v[0]*cr-v[1]*sr,y=v[0]*sr+v[1]*cr,z=v[2];const yy=y*cp-z*sp,zz=y*sp+z*cp;
 return [x*cy+zz*sy,yy,-x*sy+zz*cy];
}
function tailPoint(t,mode,phase){
 if(mode==='sleep'){
  const a=-Math.PI*.4+t*Math.PI*1.55;
  return [.01+Math.sin(a)*.255,.09+Math.sin(t*Math.PI)*.012,-.10-Math.cos(a)*.32];
 }
 if(mode==='sit'||mode==='groom'){
  const a=t*2.9;return [.28*(1-Math.cos(a))*.5,.10+.10*(1-t),-.30-Math.sin(a)*.22];
 }
 const sway=Math.sin(phase*1.8+t*1.3)*.035*t;
 return [sway+.06*Math.sin(t*Math.PI),.30+.27*t+(mode==='purr'?.09*t:0),-.35-.43*t+.07*Math.sin(t*Math.PI)];
}
// A continuous swept tube for the tail, with shared seam vertices and normals.
export function emyTailSurface(mode='walk',phase=0){
 const vertices=[],indices=[],rings=22,sides=10;
 for(let i=0;i<=rings;i++){
  const t=i/rings,p=tailPoint(t,mode,phase),a=tailPoint(Math.max(0,t-.001),mode,phase),b=tailPoint(Math.min(1,t+.001),mode,phase),dir=norm(b.map((v,k)=>v-a[k]));
  const right=norm([dir[2],0,-dir[0]]),up=norm([dir[1]*right[2],dir[2]*right[0]-dir[0]*right[2],-dir[1]*right[0]]);
  const radius=t===1?.00001:.065*Math.pow(Math.sin(Math.PI*(.11+.88*t)),.55)+.004;
  for(let j=0;j<=sides;j++){
   const u=j/sides,angle=u*Math.PI*2,normal=right.map((v,k)=>v*Math.cos(angle)+up[k]*Math.sin(angle));
   const shade=.48+.10*Math.sin(angle)+.035*Math.sin(t*48);
   vertices.push(...p.map((v,k)=>v+normal[k]*radius),shade,shade*1.01,shade*1.02,...normal,u,t,0,64,...right);
  }
 }
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j;indices.push(a,a+sides+2,a+1,a,a+sides+1,a+sides+2);}
 return {vertices:new Float32Array(vertices),indices};
}
export function writeEmySurface(out,start,box){
 const mesh=box.emySpec.form==='tail'?(box.emyTailMesh||emyTailSurface()):emySurface(box),v=mesh.vertices,p=box.emyPose;
 const s=p.scale||[1,1,1],a=rotateEmy([1,0,0],...p.rot),b=rotateEmy([0,1,0],...p.rot),c=rotateEmy([0,0,1],...p.rot);
 for(let i=0;i<v.length;i+=16){
  const at=start+i,x=v[i]*s[0],y=v[i+1]*s[1],z=v[i+2]*s[2];
  for(let k=3;k<16;k++)out[at+k]=v[i+k];
  out[at]=p.pos[0]+a[0]*x+b[0]*y+c[0]*z;out[at+1]=p.pos[1]+a[1]*x+b[1]*y+c[1]*z;out[at+2]=p.pos[2]+a[2]*x+b[2]*y+c[2]*z;
  const nx=v[i+6]/s[0],ny=v[i+7]/s[1],nz=v[i+8]/s[2];
  const tx=a[0]*nx+b[0]*ny+c[0]*nz,ty=a[1]*nx+b[1]*ny+c[1]*nz,tz=a[2]*nx+b[2]*ny+c[2]*nz,len=Math.hypot(tx,ty,tz)||1;
  out[at+6]=tx/len;out[at+7]=ty/len;out[at+8]=tz/len;
  for(let k=0;k<3;k++)out[at+13+k]=a[k]*v[i+13]+b[k]*v[i+14]+c[k]*v[i+15];
 }
}
