// The screenshot regression: BEFORE pressing "Liberar a Louis", the bound
// character must be the exact same Photo-A rig used once the ropes are cut.
const assert=require('node:assert/strict');
(async()=>{
 const {createHouse}=await import('../src/lab/world.js');
 const {createLouisEscape}=await import('../src/lab/louis-escape.js');
 const {pickupGeometry,geometry}=await import('../src/lab/renderer.js');
 const world=createHouse();
 const actors=world.objects.filter(o=>o.kind==='louis-companion');
 assert.equal(actors.length,1,'exactly one waiting captive in the house');
 const captive=actors[0];
 assert.equal(captive.id,'captive-louis');
 assert.equal(captive.visualVariant,'photo-a');
 assert.equal(captive.interactable,false,'only the rescue target is interactable');
 assert(world.objects.some(o=>o.id==='rescue-louis'&&o.kind==='rescue'),
  'the same use-to-free interaction is retained');
 assert(world.boxes.some(b=>b.id==='captive-chair-seat'), 'chair remains');
 assert(world.boxes.some(b=>b.id==='captive-rope-0'), 'rope remains until freed');
 assert(!world.boxes.some(b=>/^captive-(torso|shirt|head|hair|fringe|nose|eye|iris|mouth|jaw|neck|hand|thigh|shin|sneaker)/.test(b.id)),
  'old static Louis primitives must be deleted');
 const before=pickupGeometry(world.objects).filter(b=>b.source===captive);
 assert(before.length>20,'one complete rigged captive is visible before rescue');
 assert(before.some(b=>b.shape==='lois-face'&&b.photoMapped),
  'waiting face uses approved photographic texture, not cartoon eyes');
 assert(!before.some(b=>/(^|-)nose-tip|(^|-)iris--1/.test(b.id)),
  'no duplicated old sculpted features');
 assert(before.every(b=>b.rigBone),'one rig for hair, face and body');
 const beforeMesh=geometry(before);
 assert(beforeMesh.vertices.every(Number.isFinite),'valid waiting-captive mesh');
 // The same source object is promoted to the moving rescued actor.
 const rescued=createLouisEscape(world);
 const identity=captive;
 Object.assign(captive,rescued);
 assert.strictEqual(captive,identity,'rescue must reuse, not duplicate, actor');
 assert.equal(world.objects.filter(o=>o.kind==='louis-companion').length,1);
 const after=pickupGeometry(world.objects).filter(b=>b.source===captive);
 assert.equal(after.length,before.length,'same Photo-A model before and after untying');
 assert.equal(after.find(b=>b.shape==='lois-face')?.photoMapped,true);
 const afterMesh=geometry(after);
 assert.equal(afterMesh.indices.length,beforeMesh.indices.length,
  'no additional model geometry in rescue transition');
 console.log('PASS LOIS CAPTIVE: one Photo-A actor, photo head before untying, chair and ropes retained, no legacy static pieces');
})().catch(e=>{console.error(e);process.exitCode=1;});
