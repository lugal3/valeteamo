import assert from 'node:assert/strict';
import {reviewCat,sampleReview,poses} from '../src/lab/review/face-review-model.js';
import {candidateFace} from '../src/lab/review/face-anatomy.js';
import {refineMuzzle,muzzlePoint} from '../src/lab/review/face-muzzle.js';
function badNormals(m){const bad=[];for(let i=0;i<m.indices.length;i+=3){
 const [a,b,c]=m.indices.slice(i,i+3).map(v=>v*6),p=m.vertices;
 const x=[p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]],y=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]];
 if((x[1]*y[2]-x[2]*y[1])*p[a+3]+(x[2]*y[0]-x[0]*y[2])*p[a+4]+(x[0]*y[1]-x[1]*y[0])*p[a+5]>=1e-8)bad.push(i);
}return bad;}
for(const asset of ['head','headLow'])for(const variant of ['soft','refined']){
 const a=candidateFace(asset,variant),b=refineMuzzle(a);assert.deepEqual(a.indices,b.indices);
 let count=0,max=0;for(let i=0;i<a.vertices.length;i+=6){
  const p=a.vertices.slice(i,i+3),q=b.vertices.slice(i,i+3),delta=Math.hypot(...q.map((v,k)=>v-p[k]));count+=+(delta>1e-7);max=Math.max(max,delta);
  assert(Math.abs(Math.hypot(...b.vertices.slice(i+3,i+6))-1)<1e-5);
  if(p[1]>=-.018||p[2]<=.058)assert.deepEqual(p,q);
 }
 assert(max<.012&&count>0);const old=badNormals(a);assert(badNormals(b).every(i=>old.includes(i)));
 console.log('MUZZLE_METRIC '+JSON.stringify({asset,variant,count,max}));
}
for(const p of [[0,-.063,.160],[0,-.046,.150],[.016,-.077,.156]])assert.deepEqual(muzzlePoint(p),p);
let exact=0,cases=0;
for(const low of [false,true])for(const variant of ['soft','refined'])for(const mode of poses)for(const blink of [false,true]){
 const original=reviewCat(variant,low,true),candidate=reviewCat(variant,low,true,true);
 const opts={mode,phase:.7,alarm:.7,blink,headYaw:.25};
 const a=sampleReview(original,opts),b=sampleReview(candidate,opts);
 assert(b.count<=a.count+100&&b.count<=31060);assert(b.triangles<=48846);assert(b.indices.every(i=>i<b.count));
 for(let i=0;i<a.parts.length;i++){
  const x=a.parts[i],y=b.parts[i];assert.equal(x.id,y.id);assert.deepEqual(original.parts[i].base,candidate.parts[i].base);assert.deepEqual(original.parts[i].box.emyPose,candidate.parts[i].box.emyPose);
  if(x.id!=='head'&&x.id!=='nose'&&!x.id.startsWith('nostril')){assert.deepEqual(x.vertices,y.vertices,x.id);exact+=x.vertices.length/16;}else assert(y.vertices.every(Number.isFinite));
 }cases++;
}
console.log('PASS muzzle: '+cases+' pose/LOD/blink cases, '+exact+' non-muzzle vertices exact; attachments unchanged');
