import assert from 'node:assert/strict';
import {installUpstairsEmy,poseEmy} from '../src/lab/emy-cat.js';
import {emySurface} from '../src/lab/emy-surface.js';
import {applyReviewAppearance,sampleReview,reviewCat} from '../src/lab/review/face-review-model.js';
const add=(id,x,y,z,w,h,d,material,solid,extra)=>({id,x,y,z,w,h,d,material,solid,...extra});
const fresh=()=>installUpstairsEmy(add,3.15);
for(const variant of ['soft','refined']){
 const a=fresh(),b=fresh(),original=sampleReview(a,{mode:'idle'});applyReviewAppearance(b,variant);
 const updated=sampleReview(b,{mode:'idle'});
 assert(updated.count<=original.count);assert(updated.triangles<=original.triangles);
 for(let i=0;i<a.parts.length;i++){
  assert.deepEqual(a.parts[i].base,b.parts[i].base);assert.deepEqual(a.parts[i].box.emyPose,b.parts[i].box.emyPose);
  assert.equal(a.parts[i].box.id,b.parts[i].box.id);
  if(a.parts[i].id==='tail'||a.parts[i].id.startsWith('whisker')||a.parts[i].id==='philtrum'||a.parts[i].id==='tongue')assert.deepEqual(original.parts[i].vertices,updated.parts[i].vertices);
 }
 const iris=b.parts.find(p=>p.id==='iris1').box;assert.equal(emySurface(iris).vertices[11],21.25);
 assert.equal(emySurface(a.parts.find(p=>p.id==='iris1').box).vertices[11],21);
 const c=fresh();applyReviewAppearance(c,'original');assert.deepEqual(sampleReview(c,{mode:'idle'}).vertices,original.vertices);
 console.log('PREVIEW_ACTOR '+JSON.stringify({variant,vertices:updated.count,triangles:updated.triangles}));
}
console.log('PASS candidate applied before allocation; real actor anchors and original appearance preserved');
