import assert from 'node:assert/strict';
import {reviewCat,sampleReview,poses} from '../src/lab/review/face-review-model.js';
import {EYE_PART} from '../src/lab/review/face-eyes.js';
let compared=0,changed=0;
for(const low of [false,true])for(const variant of ['soft','refined']){
 const baseline=reviewCat(variant,low),candidate=reviewCat(variant,low,true);
 for(const mode of poses)for(const blink of [false,true]){
  const opts={mode,phase:.7,alarm:.7,blink,headYaw:.25};
  const a=sampleReview(baseline,opts),b=sampleReview(candidate,opts);
  assert.equal(a.count,b.count);assert.equal(a.triangles,b.triangles);assert.deepEqual(a.indices,b.indices);
  for(let i=0;i<a.parts.length;i++){
   const x=a.parts[i],y=b.parts[i];assert.equal(x.id,y.id);
   assert.deepEqual(baseline.parts[i].base,candidate.parts[i].base);
   assert.deepEqual(baseline.parts[i].box.emyPose,candidate.parts[i].box.emyPose,'same transforms');
   if(!EYE_PART.test(x.id)){assert.deepEqual(x.vertices,y.vertices,x.id);compared+=x.vertices.length/16;}
   else{
    assert.notDeepEqual(x.vertices,y.vertices,x.id);changed+=y.vertices.length/16;
    assert(y.vertices.every(Number.isFinite));
    for(let k=0;k<y.vertices.length;k+=16)assert(Math.abs(Math.hypot(...y.vertices.slice(k+6,k+9))-1)<1e-4);
   }
  }
  if(blink||mode==='sleep'){
   assert(candidate.parts.find(p=>p.id==='iris1').box.emyPose.scale.every(x=>x===.001));
   assert(candidate.parts.find(p=>p.id==='lid1').box.emyPose.scale.every(x=>x===1));
  }
 }
}
const neutral=sampleReview(reviewCat('candidate',false,true),{mode:'idle'});
assert.deepEqual(neutral.vertices,sampleReview(reviewCat('original',false),{mode:'idle'}).vertices);
console.log('PASS eyes V2: 80 pose/blink/LOD cases; '+compared+' non-eye vertices exact, '+changed+' eye vertices validated');
