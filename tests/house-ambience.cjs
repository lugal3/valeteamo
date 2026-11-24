// V2 phase 05 — decorations must be visual-only and share the existing batch.
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {createHouse,HEIGHT}=await import('../src/lab/world.js');
 const {ENVIRONMENT_DECOR_IDS}=await import('../src/lab/house-ambient-details.js');
 const world=createHouse();
 assert.equal(ENVIRONMENT_DECOR_IDS.length,13,'bounded decorative budget');
 const unique=new Set(ENVIRONMENT_DECOR_IDS);
 assert.equal(unique.size,ENVIRONMENT_DECOR_IDS.length);
 const details=ENVIRONMENT_DECOR_IDS.map(id=>{
  const box=world.boxes.find(part=>part.id===id);
  assert(box,'missing room detail '+id);assert.equal(box.solid,false,'non-blocking '+id);
  assert.equal(box.castShadow,false,'no shadow updates for '+id);
  assert(!world.objects.some(o=>o.id===id),'cannot become a puzzle/interaction '+id);
  return box;
 });
 assert.equal(details.filter(b=>b.dynamic).length,0,'stay within saturated WebGL1 dynamic vertex budget');
 assert.equal(details.filter(b=>b.ambient==='curtain-sway').length,4);
 assert.equal(details.filter(b=>b.ambient==='floating-dust').length,3);
 assert(details.some(b=>b.y>HEIGHT),'details on upper floor');
 assert(details.some(b=>b.y<HEIGHT),'details on ground floor');
 for(const box of details)assert(box.x>=0&&box.x<=14&&box.z>=0&&box.z<=12,'inside home '+box.id);
 const renderer=fs.readFileSync('src/lab/renderer.js','utf8');
 assert(renderer.includes("box.ambient==='curtain-sway'"));
 assert(renderer.includes("box.ambient==='floating-dust'"));
 assert(renderer.includes('reduced?0:'),'future decorative motion respects reduced motion');
 assert(renderer.includes('this.dynamicBoxes=boxes.filter(b=>b.dynamic)'),'shared existing dynamic batch');
 console.log('PASS V2 phase 05: visual-only static decor, no extra colliders or dynamic vertex-budget pressure');
})().catch(e=>{console.error(e);process.exitCode=1});
