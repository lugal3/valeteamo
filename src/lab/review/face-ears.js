// Candidate-only ear refinement. Same ear hinges, animation controller and topology.
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function earPoint(p){
 const [x,y,z]=p,ax=Math.abs(x);
 // Smooth, slightly taller ear tips, less angular outer silhouette.
 // The deformation is zero at and below the authored folding hinge.
 const w=smooth(.105,.188,y)*smooth(.046,.081,ax);
 const taper=smooth(.124,.168,ax);
 return [x-Math.sign(x)*.006*w*taper,y+.008*w,z+.003*w];
}
function mapVertex(v,i,origin){
 const p=[0,1,2].map(k=>v[i+k]+origin[k]),q=earPoint(p);
 if(q.every((x,k)=>x===p[k]))return;
 const step=.00001,n=Array.from(v.subarray(i+6,i+9));
 const J=[0,1,2].map(k=>{const a=p.slice(),b=p.slice();a[k]+=step;b[k]-=step;const A=earPoint(a),B=earPoint(b);return A.map((x,j)=>(x-B[j])/(2*step));});
 const cof=[cross(J[1],J[2]),cross(J[2],J[0]),cross(J[0],J[1])],det=J[0].reduce((a,x,k)=>a+x*cof[0][k],0);
 if(det<.35)throw Error('Ear mapping folded');
 const normal=norm([0,1,2].map(k=>cof.reduce((a,c,j)=>a+c[k]*n[j]/det,0)));
 for(let k=0;k<3;k++){v[i+k]=q[k]-origin[k];v[i+6+k]=normal[k];}
}
export function refineEar(part,mesh){
 if(part.id!=='head'&&!part.id.startsWith('concha'))return mesh;
 const v=new Float32Array(mesh.vertices),head=part.id==='head',origin=head?[0,0,0]:part.base;
 if(!head){
  const base=(part.box.emySpec.segments+1)*(part.box.emySpec.rings+1);
  // Reuse all 42 inner ear fibres. Keep both roots unchanged, turn the
  // tips upwards and gently inwards like the reference photographs.
  for(let i=base*16;i<v.length;i+=48){
   const x=v[i],y=v[i+1],z=v[i+2],j=(i/16-base)/3,tip=i+32;
   const dx=v[tip]-x,dy=v[tip+1]-y,dz=v[tip+2]-z;
   v[tip]=x+dx*.73;v[tip+1]=y+dy*1.65+.0025*Math.sin(j*.8)**2;v[tip+2]=z+dz*.85;
   for(let k=i;k<i+48;k+=16)v.set([.66,.68,.66],k+3);
  }
  for(let i=0;i<base*16;i+=16){
   // Muted rose at the center, grey cartilage rim, without dark pink slabs.
   const weight=Math.max(0,(v[i+3]-v[i+4])/.19);
   v[i+3]-=.035*weight;v[i+4]+=.018*weight;v[i+5]+=.022*weight;
  }
 }
 for(let i=0;i<v.length;i+=16)mapVertex(v,i,origin);
 return {...mesh,vertices:v};
}
