const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {createFrameSampler}=await import('../src/lab/frame-sampler.js');
 const {houseFrameLimit,houseRenderSize,createHouseBudget}=await import('../src/lab/frame-budget.js');
 assert.equal(houseFrameLimit({ready:true,paused:false,pianoPractice:false,quality:'low'}),60,'low visual quality does not cap gameplay at 30 FPS');
 assert.equal(houseFrameLimit({ready:false}),5);assert.equal(houseFrameLimit({ready:true,paused:true}),15);assert.equal(houseFrameLimit({ready:true,pianoPractice:true}),30);
 const full=houseRenderSize(844,390,3,'medium'),scaled=houseRenderSize(844,390,3,'medium',false,.70),low=houseRenderSize(844,390,3,'low');
 assert(scaled.width*scaled.height<full.width*full.height*.51);
 assert(low.width<full.width&&Math.abs(scaled.width/scaled.height-844/390)<.02);
 assert.deepEqual(houseRenderSize(844,390,3,'medium',true,.70),houseRenderSize(844,390,3,'medium',true,1),'capture resolution protected');
 const wide=houseRenderSize(3000,800,2,'medium');assert(wide.width<=1200&&Math.abs(wide.width/wide.height-3.75)<.02);
 const budget=createHouseBudget();let clock=0;
 const run=(seconds,fps,active=true)=>{let change=0;for(let i=0;i<seconds*fps;i++){clock+=1000/fps;const sample=budget.record(clock,active);if(sample?.changed)change++;}return change;};
 run(2,30);run(5,15,false);assert.equal(budget.state().scale,1);run(2,30);assert.equal(budget.state().scale,1);
 run(2,30);assert.equal(budget.state().scale,.85);run(4,60);assert.equal(budget.state().scale,.85);
 run(4,30);assert.equal(budget.state().scale,.70);run(4,30);assert.equal(budget.state().quality,'low');
 budget.select('low');run(12,30);assert.deepEqual(budget.state(),{quality:'low',scale:1,auto:false});
 budget.select('fixed');run(12,20);assert.deepEqual(budget.state(),{quality:'medium',scale:1,auto:false},'fixed quality never reduces resolution');
 budget.select('medium');assert.deepEqual(budget.state(),{quality:'medium',scale:1,auto:true});
 run(2,30);clock+=3000;budget.record(clock,true);run(2,30);assert.equal(budget.state().scale,1,'a stall discards prior partial window');
 const {createDirtyRanges,reflectVertexRange}=await import('../src/lab/dirty-ranges.js');
 const {reflectMesh}=await import('../src/lab/mirror.js');
 const ranges=createDirtyRanges(4,16);ranges.add(32,48);ranges.add(0,16);ranges.add(96,112);ranges.add(64,80);assert.deepEqual(ranges.drain(),[[0,112]]);
 const bounded=createDirtyRanges(2);bounded.add(0,16);bounded.add(64,80);bounded.add(128,144);assert.deepEqual(bounded.drain(),[[0,144]]);
 const source=Float32Array.from({length:160},(_,i)=>Math.sin(i)*4),target=new Float32Array(160),expected=reflectMesh(source.slice());
 reflectVertexRange(source,target,0,160,reflectMesh);assert.deepEqual(target,expected);
 source[32]=5;source[102]=7;reflectVertexRange(source,target,32,48,reflectMesh);reflectVertexRange(source,target,96,112,reflectMesh);assert.deepEqual(target,reflectMesh(source.slice()),'partial mirror matches full reflection byte-for-byte');
 const {buildStaticBatches,clipPlanes,batchOutside,visibleStaticRuns}=await import('../src/lab/static-visibility.js');
 const verts=new Float32Array(9*16);const coords=[[-1,-1,5],[1,-1,5],[0,1,5],[100,0,5],[101,0,5],[100,1,5],[-100,0,5],[-99,0,5],[0,1,5]];
 coords.forEach((p,i)=>verts.set(p,i*16));const idx=Uint16Array.from({length:9},(_,i)=>i);
 const batches=buildStaticBatches(verts,idx,3),basis={right:[1,0,0],up:[0,1,0],forward:[0,0,1]},origin={x:0,y:0,z:0};
 const planes=clipPlanes(basis,1,1);
 assert(!batchOutside(batches[0],origin,planes));assert(batchOutside(batches[1],origin,planes));assert(!batchOutside(batches[2],origin,planes),'triangle crossing viewport must survive');
 assert.deepEqual(visibleStaticRuns(batches,9,origin,basis,1,1),[[0,3],[6,9]]);
 assert.deepEqual(visibleStaticRuns(batches,9,origin,basis,1,1,{maxDraws:1}),[[0,9]],'draw overhead fallback');
 assert(!batchOutside(batches[1],{x:100,y:0,z:0},planes),'same geometry can cast a shadow from an offscreen lamp');
 // Conservative guard includes geometry just outside the mathematical edge.
 assert(!batchOutside({center:[5.01,0,5],half:[0,0,0]},origin,planes));
 const {segmentHitsBox}=await import('../src/lab/world.js');
 function original(from,to,box,padding=0){
  if(!box.solid)return false;
  if(box.yaw){const c=Math.cos(box.yaw),s=Math.sin(box.yaw),local=p=>({x:(p.x-box.x)*c+(p.z-box.z)*s,y:p.y,z:-(p.x-box.x)*s+(p.z-box.z)*c});return original(local(from),local(to),{...box,x:0,z:0,yaw:0},padding);}
  let low=0,high=1;
  for(const axis of ['x','y','z']){const center=box[axis],half=box[axis==='x'?'w':axis==='y'?'h':'d']/2+padding,start=from[axis],delta=to[axis]-start;if(Math.abs(delta)<1e-8){if(start<center-half||start>center+half)return false;continue;}const a=(center-half-start)/delta,c=(center+half-start)/delta;low=Math.max(low,Math.min(a,c));high=Math.min(high,Math.max(a,c));if(low>high)return false;}
  return high>.001&&low<.995;
 }
 let seed=734;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const point=()=>({x:random()*8-4,y:random()*6-3,z:random()*8-4});
 for(let i=0;i<12000;i++){const a=point(),b=i%7===0?{...a}:point(),box={...point(),w:random()*3,h:random()*3,d:random()*3,yaw:i%3===0?0:random()*Math.PI*2,solid:i%11!==0},padding=i%2===0?0:random()*.2;assert.equal(segmentHitsBox(a,b,box,padding),original(a,b,box,padding),'exact slab parity '+i);}
 const inside={center:[0,0,5],half:[0,0,0]},outside={center:[100,0,5],half:[0,0,0]};
 const fragmented=[{...inside,start:0,end:3},{...outside,start:3,end:6},{...inside,start:6,end:9},{...outside,start:9,end:39},{...inside,start:39,end:42},{...outside,start:42,end:45},{...inside,start:45,end:48}];
 assert.deepEqual(visibleStaticRuns(fragmented,48,origin,basis,1,1,{maxDraws:2}),[[0,9],[39,48]],'keep largest proven invisible gap while restoring smaller gaps');
 const s=createFrameSampler(5);
 assert.equal(s.report().samples,0);
 for(let i=0;i<=5;i++)s.record(i*20,4);
 assert.equal(s.report().fps,50);assert.equal(s.report().p95,20);
 s.record(180,12);assert.equal(s.report().hitches,1);assert.equal(s.report().p99,80);
 assert.equal(s.report().cpuP95,12);assert.equal(s.report().low1,12.5);
 s.pause();s.record(10000,1);assert.equal(s.report().hitches,1);
 s.record(10020,4);assert.equal(s.report().samples,5);
 s.reset();assert.equal(s.report().samples,0);
 const renderer=fs.readFileSync('src/lab/renderer.js','utf8');
 assert(renderer.includes('this.reflectedRevision!==this.dynamicRevision'));
 assert(renderer.includes('this.dynamicRevision++;metrics.uploads++'));
 assert(renderer.includes('this.preparePursuerMesh(name)'));
 const house=fs.readFileSync('src/lab/house.js','utf8');
 assert(house.includes('perfEnabled=false')&&house.includes('perfSampler.pause()'));
 assert(house.includes('requestIdleCallback')&&house.includes('cancelIdleCallback'));
 console.log('PASS bounded active-frame profiler, paused interval exclusion, exact mirror invalidation and unchanged mesh preparation');
})().catch(e=>{console.error(e);process.exitCode=1;});
