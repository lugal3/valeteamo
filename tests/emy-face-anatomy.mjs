import assert from 'node:assert/strict';
import {reviewCat,sampleReview,poses} from '../src/lab/review/face-review-model.js';
import {candidateFace} from '../src/lab/review/face-anatomy.js';
import {EMY_FACE_CANDIDATE} from '../src/lab/assets/emy/face-candidate.js';
const width=m=>{let max=0;for(let i=0;i<m.vertices.length;i+=6)if(m.vertices[i+1]<.067&&m.vertices[i+2]>-.035)max=Math.max(max,Math.abs(m.vertices[i]));return max*2;};
function badWinding(m){
 const bad=[];for(let i=0;i<m.indices.length;i+=3){const [a,b,c]=m.indices.slice(i,i+3).map(n=>n*6),v=m.vertices;
 const x=[v[b]-v[a],v[b+1]-v[a+1],v[b+2]-v[a+2]],y=[v[c]-v[a],v[c+1]-v[a+1],v[c+2]-v[a+2]];
 if((x[1]*y[2]-x[2]*y[1])*v[a+3]+(x[2]*y[0]-x[0]*y[2])*v[a+4]+(x[0]*y[1]-x[1]*y[0])*v[a+5]>=1e-8)bad.push(i);}
 return bad;
}
for(const asset of ['head','headLow']){
 const source=EMY_FACE_CANDIDATE[asset],a=candidateFace(asset,'soft'),b=candidateFace(asset,'refined');
 assert(width(b)<width(a)&&width(a)<width(source));
 const baselineBad=badWinding(source);
 for(const [id,m] of [['soft',a],['refined',b]]){
  assert.deepEqual(m.indices,source.indices);assert.equal(m.vertices.length,source.vertices.length);
  let maxMove=0,changed=0;
  for(let i=0;i<m.vertices.length;i+=6){
   const p=source.vertices.slice(i,i+3),q=m.vertices.slice(i,i+3);
   const distance=Math.hypot(...q.map((x,k)=>x-p[k]));maxMove=Math.max(maxMove,distance);changed+=+(distance>1e-7);
   if(p[1]>=.067||p[2]<=-.105||Math.abs(p[0])<=.088)assert.deepEqual(q,p,'protected ear, neck, centre');
   assert(Math.abs(Math.hypot(...m.vertices.slice(i+3,i+6))-1)<.00001);
  }
  const bad=badWinding(m);assert(bad.every(i=>baselineBad.includes(i)),'no new winding/normal disagreement');
  assert(maxMove<.031&&changed>0);
  console.log('FACE_METRIC '+JSON.stringify({asset,id,widthBefore:width(source),widthAfter:width(m),maxMove,changed,baselineBad,bad}));
 }
}
for(const low of [false,true])for(const mode of poses)for(const variant of ['soft','refined']){
 const opts={mode,phase:.7,alarm:.7};
 const a=sampleReview(reviewCat('original',low),opts),b=sampleReview(reviewCat(variant,low),opts);
 for(let i=0;i<a.parts.length;i++)if(a.parts[i].id!=='head')assert.deepEqual(a.parts[i].vertices,b.parts[i].vertices,mode+' '+a.parts[i].id+' unchanged');
 assert(b.count<=a.count&&b.triangles<=a.triangles);assert(b.count<32000&&b.triangles<50000);
}
console.log('PASS two candidate shapes, body/face anchors unchanged in 40 pose/LOD cases');
