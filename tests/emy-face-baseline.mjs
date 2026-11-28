import assert from 'node:assert/strict';
import {EMY_SCULPT} from '../src/lab/assets/emy/sculpt.js';
import {EMY_FACE_CANDIDATE} from '../src/lab/assets/emy/face-candidate.js';
for(const id of ['head','headLow']){
 assert.deepEqual(EMY_FACE_CANDIDATE[id],EMY_SCULPT[id],id+' baseline candidate initially exact');
 assert.notEqual(EMY_FACE_CANDIDATE[id],EMY_SCULPT[id]);
}
console.log('PASS independent unchanged head and LOD baseline copies');
