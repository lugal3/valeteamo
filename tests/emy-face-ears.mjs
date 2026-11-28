import assert from 'node:assert/strict';
import {reviewCat,sampleReview,poses} from '../src/lab/review/face-review-model.js';
import {earPoint} from '../src/lab/review/face-ears.js';
import {emySurface} from '../src/lab/emy-surface.js';
for(const p of [[.107,.09,0],[-.107,.09,0],[0,.15,0],[.11,.10,.03]])assert.deepEqual(earPoint(p),p);
let exact=0,cases=0;
for(const low of [false,true])for(const variant of ['soft','refined']){
 const original=reviewCat(variant,low,true,true),candidate=reviewCat(variant,low,true,true,true);
 const a0=emySurface(original.parts.find(p=>p.id==='head').box).vertices,b0=emySurface(candidate.parts.find(p=>p.id==='head').box).vertices;
 let changed=0,protectedCount=0,max=0;
 for(let i=0;i<a0.length;i+=16){
  const d=Math.hypot(b0[i]-a0[i],b0[i+1]-a0[i+1],b0[i+2]-a0[i+2]);max=Math.max(max,d);changed+=+(d>1e-7);
  if(a0[i+1]<=.105||Math.abs(a0[i])<=.046){assert.deepEqual(a0.slice(i,i+16),b0.slice(i,i+16));protectedCount++;}
 }
 assert(changed>0&&max<.011);console.log('EAR_METRIC '+JSON.stringify({low,variant,changed,protectedCount,max}));
 for(const mode of poses)for(const alarm of [0,1]){
  const opts={mode,phase:.7,alarm,headYaw:.25};
  const a=sampleReview(original,opts),b=sampleReview(candidate,opts);
  assert.equal(a.count,b.count);assert.equal(a.triangles,b.triangles);assert.deepEqual(a.indices,b.indices);
  for(let i=0;i<a.parts.length;i++){
   const x=a.parts[i],y=b.parts[i];assert.equal(x.id,y.id);assert.deepEqual(original.parts[i].box.emyPose,candidate.parts[i].box.emyPose);
   if(x.id!=='head'&&!x.id.startsWith('concha')){assert.deepEqual(x.vertices,y.vertices,x.id);exact+=x.vertices.length/16;}else{assert(y.vertices.every(Number.isFinite));for(let k=0;k<y.vertices.length;k+=16)assert(Math.abs(Math.hypot(...y.vertices.slice(k+6,k+9))-1)<1e-4);}
  }cases++;
 }
}
console.log('PASS ears: '+cases+' pose/LOD/alarm cases, '+exact+' non-ear-part vertices exact; ear transforms unchanged');
