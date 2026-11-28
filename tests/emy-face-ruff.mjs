import assert from 'node:assert/strict';
import {reviewCat,sampleReview,poses} from '../src/lab/review/face-review-model.js';
import {neckMask,cheekMask,faceSilver} from '../src/lab/review/face-ruff.js';
import {emySurface} from '../src/lab/emy-surface.js';
let exact=0,cases=0;
for(const low of [false,true])for(const variant of ['soft','refined']){
 const original=reviewCat(variant,low,true,true,true),candidate=reviewCat(variant,low,true,true,true,true);
 for(const id of ['coat','head']){
  const a=emySurface(original.parts.find(p=>p.id===id).box),b=emySurface(candidate.parts.find(p=>p.id===id).box);
  assert.deepEqual(a.skin,b.skin);assert.deepEqual(a.indices,b.indices);assert.equal(a.vertices.length,b.vertices.length);
  const v=a.vertices,w=b.vertices,mask=id==='head'?cheekMask:neckMask;let changed=0,protectedCount=0,max=0;
  for(let i=0;i<a.baseCount*16;i+=16){
   assert.deepEqual(v.slice(i,i+3),w.slice(i,i+3));assert.deepEqual(v.slice(i+6,i+16),w.slice(i+6,i+16));
   if((id==='head'?faceSilver(Array.from(v.slice(i,i+3))):neckMask(Array.from(v.slice(i,i+3))))===0)assert.deepEqual(v.slice(i,i+16),w.slice(i,i+16));
  }
  for(let n=a.baseCount;n<v.length/16;n+=7){
   const i=n*16,p=[0,1,2].map(k=>(v[i+k]+v[i+16+k])*.5),local=mask(p);
   assert.deepEqual(v.slice(i,i+3),w.slice(i,i+3));assert.deepEqual(v.slice(i+16,i+19),w.slice(i+16,i+19));
   if(local===0){assert.deepEqual(v.slice(i,i+112),w.slice(i,i+112));protectedCount+=7;}
   else{
    for(let j=0;j<7;j++){const k=(n+j)*16,d=Math.hypot(w[k]-v[k],w[k+1]-v[k+1],w[k+2]-v[k+2]);max=Math.max(max,d);changed+=+(d>1e-7);}
   }
  }
  assert(changed>0&&max<.04);
  console.log('RUFF_METRIC '+JSON.stringify({id,low,variant,changed,protectedCount,max}));
 }
 for(const mode of poses)for(const alarm of [0,1]){
  const opts={mode,phase:.7,alarm,headYaw:.25};const a=sampleReview(original,opts),b=sampleReview(candidate,opts);
  assert.equal(a.count,b.count);assert.equal(a.triangles,b.triangles);assert.deepEqual(a.indices,b.indices);
  for(let i=0;i<a.parts.length;i++){const x=a.parts[i],y=b.parts[i];assert.equal(x.id,y.id);assert.deepEqual(original.parts[i].box.emyPose,candidate.parts[i].box.emyPose);
   if(x.id!=='head'&&x.id!=='coat'){assert.deepEqual(x.vertices,y.vertices,x.id);exact+=x.vertices.length/16;}else assert(y.vertices.every(Number.isFinite));
  }cases++;
 }
}
console.log('PASS ruff: '+cases+' pose/LOD/alarm cases; '+exact+' non-head/coat vertices exact; coat skin weights and all base geometry unchanged');
