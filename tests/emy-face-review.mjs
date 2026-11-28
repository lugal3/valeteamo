import assert from 'node:assert/strict';
import {reviewCat,sampleReview,poses} from '../src/lab/review/face-review-model.js';
let checks=0;
for(const low of [false,true])for(const mode of poses)for(const alarm of [0,.7]){
 const opts={mode,phase:.7,alarm};
 const a=sampleReview(reviewCat('original',low),opts),b=sampleReview(reviewCat('candidate',low),opts);
 assert.deepEqual(a.vertices,b.vertices,mode+' geometry exact');assert.deepEqual(a.indices,b.indices);
 assert(a.count<32000&&a.triangles<50000);
 checks+=a.count;
}
console.log('PASS isolated studio parity: '+checks+' vertices across 40 pose/LOD cases');
