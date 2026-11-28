// Candidate-only phase 2. No topology changes, no new vertices.
import {EMY_FACE_CANDIDATE} from '../assets/emy/face-candidate.js';
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const offsets={soft:.017,refined:.030};
export function facePoint(p,variant){
 const [x,y,z]=p,amount=offsets[variant]||0;
 const lateral=smooth(.088,.170,Math.abs(x));
 const jaw=(1-smooth(.015,.067,y))*smooth(-.137,-.103,y);
 const forward=smooth(-.105,-.035,z);
 const eyeGuard=1-smooth(.028,.073,z)*smooth(-.043,-.012,y);
 return [x-Math.sign(x)*amount*lateral*jaw*forward*eyeGuard,y,z];
}
const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export function sculptFace(source,variant){
 if(!offsets[variant])return source;
 const v=source.vertices.slice(),step=.00001;
 for(let i=0;i<v.length;i+=6){
  const p=source.vertices.slice(i,i+3),n=source.vertices.slice(i+3,i+6),q=facePoint(p,variant);
  if(q.every((x,k)=>x===p[k]))continue;
  // Inverse transpose of the local deformation Jacobian.
  const J=[0,1,2].map(k=>{const a=p.slice(),b=p.slice();a[k]+=step;b[k]-=step;const A=facePoint(a,variant),B=facePoint(b,variant);return A.map((x,j)=>(x-B[j])/(2*step));});
  const cof=[cross(J[1],J[2]),cross(J[2],J[0]),cross(J[0],J[1])],det=dot(J[0],cof[0]);
  if(det<.35)throw Error('Non-invertible facial edit');
  const normal=norm([0,1,2].map(k=>cof.reduce((s,c,j)=>s+c[k]*n[j]/det,0)));
  for(let k=0;k<3;k++){v[i+k]=q[k];v[i+3+k]=normal[k];}
 }
 return {vertices:v,indices:source.indices};
}
const cache=new Map();
export function candidateFace(asset,variant='baseline'){
 const key=asset+':'+variant;
 if(!cache.has(key))cache.set(key,sculptFace(EMY_FACE_CANDIDATE[asset],variant));
 return cache.get(key);
}
