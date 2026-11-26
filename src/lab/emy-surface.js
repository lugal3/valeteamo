import {sculptSurface} from './emy-sculpt.js';
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
 if(s.asset)return box.emyMesh=sculptSurface(s);
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
 if(s.form==='nose'){
  for(let row=0;row<=r;row++)for(let col=0;col<=n;col++){
   const u=col/n,v=row/r,x=(u-.5)*s.w*Math.pow(1-v,.68),y=(.5-v)*s.h,z=s.d*(.25+.75*Math.sin(Math.PI*u)*Math.sin(Math.PI*v*.86));
   const shade=.86+.14*Math.sin(Math.PI*u),dx=Math.max(.0008,s.w*Math.pow(1-v,.68));
   const normal=norm([-s.d*.75*Math.PI*Math.cos(Math.PI*u)*Math.sin(Math.PI*v*.86)/dx,s.d*.75*.86*Math.PI*Math.sin(Math.PI*u)*Math.cos(Math.PI*v*.86)/s.h,1]);
   vertices.push(x,y,z,...s.color.map(c=>c*shade),...normal,u,v,0,64,1,0,0);
  }
  for(let y=0;y<r;y++)for(let x=0;x<n;x++){const a=y*(n+1)+x;indices.push(a,a+1,a+n+2,a,a+n+2,a+n+1);}
  return box.emyMesh={vertices:new Float32Array(vertices),indices};
 }
 if(s.form==='eye'||s.form==='concha'){
  // A curved almond cornea / triangular ear bowl, not a flattened eyeball.
  for(let row=0;row<=r;row++)for(let col=0;col<=n;col++){
   const u=col/n,v=row/r,x=(u-.5)*s.w;
   const envelope=s.form==='eye'?Math.pow(Math.sin(Math.PI*u),.70):1-v;
   const y=s.form==='eye'?(v-.5)*s.h*envelope+x*(s.side||1)*.12:(v-.5)*s.h;
   const xx=s.form==='concha'?x*(1-v)+s.side*v*.033:x;
   const bulge=s.form==='eye'?Math.sin(Math.PI*u)*Math.sin(Math.PI*v):Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*-.7;
   const z=s.form==='concha'?.014-.027*v+s.d*bulge:s.d*bulge;
   const normal=norm([-Math.cos(Math.PI*u)*s.d/s.w, -Math.cos(Math.PI*v)*s.d/s.h,1]);
   const pink=.72*Math.pow(Math.sin(Math.PI*u),.6)*Math.pow(Math.sin(Math.PI*v),.25);
   const c=s.form==='concha'?s.color.map((c,k)=>c*pink+[.43,.44,.43][k]*(1-pink)):s.color;
   vertices.push(xx,y,z,...c,...normal,u,v,0,64,1,0,0);
  }
  for(let y=0;y<r;y++)for(let x=0;x<n;x++){const a=y*(n+1)+x;indices.push(a,a+n+2,a+1,a,a+n+1,a+n+2);}
  if(s.form==='eye'&&s.color[1]>.6&&s.color[2]<.5)for(let i=11;i<vertices.length;i+=16)vertices[i]=21;
  if(s.uvOrigin)for(let i=0;i<vertices.length;i+=16){
   vertices[i+9]=((vertices[i]+s.uvOrigin[0])/.36+.5)*.5;vertices[i+10]=.5+((vertices[i+1]+s.uvOrigin[1])/.36+.5)*.5;
   vertices[i+3]=.94;vertices[i+4]=.98;vertices[i+5]=1.01;vertices[i+11]=20;
  }
  const baseIndexCount=indices.length;
  if(s.form==='concha')for(let j=0;j<42;j++){
   const t=(j+.5)/42,y=(t-.5)*s.h*.90,u=j%2?.20:.80,x=(u-.5)*s.w*(1-t)+s.side*t*.033,z=.017-.027*t;
   const offset=vertices.length/16,sign=j%2?1:-1,len=.012+.015*Math.sin(j*31)**2;
   for(const p of [[x,y,z],[x+.0004,y,z],[x+sign*len,y+len*.36,z+.003]])vertices.push(...p,.71,.72,.69,0,0,1,0,0,0,64,1,0,0);
   indices.push(offset,offset+1,offset+2,offset+2,offset+1,offset);
  }
  return box.emyMesh={vertices:new Float32Array(vertices),indices,baseIndexCount};
 }
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
 if(mode==='sit'||mode==='groom'||mode==='crouch'){
  const a=t*2.9,sway=mode==='crouch'?0:Math.sin(phase*1.05)*.018*t*t;
  return [.28*(1-Math.cos(a))*.5+sway,.10+.10*(1-t),-.30-Math.sin(a)*.22];
 }
 if(mode==='alert')return [.025*Math.sin(t*3+phase*2)*t,.30+.49*Math.sin(t*Math.PI*.64),-.35-.24*t];
 const sway=Math.sin(phase*1.8+t*1.3)*.035*t;
 return [sway+.06*Math.sin(t*Math.PI),.30+.27*t+(mode==='purr'?.09*t:0),-.35-.43*t+.07*Math.sin(t*Math.PI)];
}
// A continuous swept tube for the tail, with shared seam vertices and normals.
export function emyTailSurface(mode='walk',phase=0,fibres=0,alarm=0){
 const vertices=[],indices=[],rings=22,sides=10;
 for(let i=0;i<=rings;i++){
  const t=i/rings,p=tailPoint(t,mode,phase),a=tailPoint(Math.max(0,t-.001),mode,phase),b=tailPoint(Math.min(1,t+.001),mode,phase),dir=norm(b.map((v,k)=>v-a[k]));
  const right=norm([dir[2],0,-dir[0]]),up=norm([dir[1]*right[2],dir[2]*right[0]-dir[0]*right[2],-dir[1]*right[0]]);
  const radius=t===1?.00001:(.065*Math.pow(Math.sin(Math.PI*(.11+.88*t)),.55)+.004)*(1+.36*alarm);
  for(let j=0;j<=sides;j++){
   const u=j/sides,angle=u*Math.PI*2,normal=right.map((v,k)=>v*Math.cos(angle)+up[k]*Math.sin(angle));
   vertices.push(...p.map((v,k)=>v+normal[k]*radius),.89,.93,.97,...normal,.51+u*.48,.01+t*.48,20,64,...right);
  }
 }
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j;indices.push(a,a+sides+2,a+1,a,a+sides+1,a+sides+2);}
 const baseIndexCount=indices.length;
 let seed=402;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let j=0;j<fibres;j++){
  const t=.03+rand()*.94,a=rand()*Math.PI*2,p=tailPoint(t,mode,phase),b=tailPoint(Math.min(1,t+.001),mode,phase),dir=norm(b.map((v,k)=>v-p[k]));
  const right=norm([dir[2],0,-dir[0]]),up=norm([dir[1]*right[2],dir[2]*right[0]-dir[0]*right[2],-dir[1]*right[0]]),normal=right.map((v,k)=>v*Math.cos(a)+up[k]*Math.sin(a));
  const radius=(.065*Math.pow(Math.sin(Math.PI*(.11+.88*t)),.55)+.004)*(1+.36*alarm),len=(.025+rand()*.035)*(1+.35*alarm),offset=vertices.length/16,shade=1+rand()*.18;
  for(let row=0;row<3;row++)for(const side of row===2?[0]:[-1,1]){
   const f=row*.5,w=(1-f)*.0006*side,pt=p.map((v,k)=>v+normal[k]*(radius+.001+len*.32*Math.sin(f*Math.PI*.8))+dir[k]*len*f+right[k]*w);
   vertices.push(...pt,.89*shade,.93*shade,.97*shade,...normal,.51+a/(Math.PI*2)*.48,.01+t*.48,20,65,...right);
  }
  for(const tri of [[0,1,3],[0,3,2],[2,3,4]]){const ids=tri.map(i=>i+offset);indices.push(...ids,ids[2],ids[1],ids[0]);}
 }
 return {vertices:new Float32Array(vertices),indices,baseIndexCount};
}
export function writeEmySurface(out,start,box){
 const mesh=box.emySpec.form==='tail'?(box.emyTailMesh||emyTailSurface()):emySurface(box),v=mesh.vertices,p=box.emyPose;
 if(mesh.skin&&box.emyNormalSource!==box.emySkinFrames){
  box.emyNormalSource=box.emySkinFrames;
  box.emyNormalFrames=box.emySkinFrames.map(m=>{
   const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],a=m.slice(0,3),b=m.slice(3,6),c=m.slice(6,9),bc=cross(b,c),det=a.reduce((s,v,k)=>s+v*bc[k],0)||1;
   return [...bc,...cross(c,a),...cross(a,b)].map(v=>v/det);
  });
 }
 const s=p.scale||[1,1,1],a=rotateEmy([1,0,0],...p.rot),b=rotateEmy([0,1,0],...p.rot),c=rotateEmy([0,0,1],...p.rot);
 for(let i=0;i<v.length;i+=16){
  let px=v[i],py=v[i+1],pz=v[i+2],nnx=v[i+6],nny=v[i+7],nnz=v[i+8];
  // Each sculpted guard hair has seven vertices. Lift its tip away from
  // the flank and back while keeping both root vertices attached.
  if(box.bristle&&mesh.skin&&i/16>=mesh.baseCount&&py>.16){
   const row=Math.floor(((i/16-mesh.baseCount)%7)/2);
   const lift=.062*box.bristle*(row/3)**2;
   px+=nnx*lift;py+=(.45+Math.max(0,nny))*lift;pz+=nnz*lift;
  }
  if((box.earTurn||box.earFlatten)&&py>.09){
   const weight=Math.min(1,(py-.09)/.06),angle=(box.earTurn||0)*weight;
   const cs=Math.cos(angle),sn=Math.sin(angle),pivot=Math.sign(px)*.107,dx=px-pivot;
   px=pivot+cs*dx+sn*pz;pz=cs*pz-sn*dx;
   const nx=nnx;nnx=cs*nx+sn*nnz;nnz=cs*nnz-sn*nx;
   const fold=(box.earFlatten||0)*weight*.46,cf=Math.cos(fold),sf=Math.sin(fold),ey=py-.09;
   py=.09+cf*ey-sf*pz;pz=sf*ey+cf*pz;
   const ny=nny;nny=cf*ny-sf*nnz;nnz=sf*ny+cf*nnz;
  }
  if(mesh.skin&&box.emySkinFrames){
   const at=i/2;let x=0,y=0,z=0,nx=0,ny=0,nz=0;
   for(let k=0;k<8;k+=2){
    const w=mesh.skin[at+k+1];
    // Zero-weight influences contribute exactly nothing. Their matrices are
    // finite by construction; skip both position and normal multiplication.
    if(w===0)continue;
    const id=mesh.skin[at+k],m=box.emySkinFrames[id],n=box.emyNormalFrames[id];
    x+=(m[0]*px+m[3]*py+m[6]*pz+m[9])*w;y+=(m[1]*px+m[4]*py+m[7]*pz+m[10])*w;z+=(m[2]*px+m[5]*py+m[8]*pz+m[11])*w;
    nx+=(n[0]*nnx+n[3]*nny+n[6]*nnz)*w;ny+=(n[1]*nnx+n[4]*nny+n[7]*nnz)*w;nz+=(n[2]*nnx+n[5]*nny+n[8]*nnz)*w;
   }
   px=x;py=y;pz=z;nnx=nx;nny=ny;nnz=nz;
   // Soft contact compression for the long belly coat when crouching/curling.
   // Pads keep their skeletal supports; only the flexible skin is compressed.
   if(py<.018){const t=(py-.0005)/.003,derivative=1/(1+Math.exp(-t));py=.0005+.003*Math.log1p(Math.exp(t));nny/=Math.max(.025,derivative);}
  }
  const at=start+i,x=px*s[0],y=py*s[1],z=pz*s[2];
  // Copy only unchanged material attributes; normal and tangent slots
  // are fully written by the exact original transforms below.
  out[at+3]=v[i+3];out[at+4]=v[i+4];out[at+5]=v[i+5];
  out[at+9]=v[i+9];out[at+10]=v[i+10];out[at+11]=v[i+11];out[at+12]=v[i+12];
  if(box.emissive)out[at+12]=96;
  out[at]=p.pos[0]+a[0]*x+b[0]*y+c[0]*z;out[at+1]=p.pos[1]+a[1]*x+b[1]*y+c[1]*z;out[at+2]=p.pos[2]+a[2]*x+b[2]*y+c[2]*z;
  const nx=nnx/s[0],ny=nny/s[1],nz=nnz/s[2];
  const tx=a[0]*nx+b[0]*ny+c[0]*nz,ty=a[1]*nx+b[1]*ny+c[1]*nz,tz=a[2]*nx+b[2]*ny+c[2]*nz,len=Math.hypot(tx,ty,tz)||1;
  out[at+6]=tx/len;out[at+7]=ty/len;out[at+8]=tz/len;
  for(let k=0;k<3;k++)out[at+13+k]=a[k]*v[i+13]+b[k]*v[i+14]+c[k]*v[i+15];
 }
}
