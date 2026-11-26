const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url'),{performance}=require('node:perf_hooks');
(async()=>{
 const current=await import('../src/lab/emy-surface.js');
 const baseline=process.argv[2]?await import(pathToFileURL(path.resolve(process.argv[2])).href):null;
 const {createHouse}=await import('../src/lab/world.js');
 const {poseEmy}=await import('../src/lab/emy-cat.js');
 const cat=createHouse().emy;cat.x=cat.y=cat.z=cat.yaw=0;
 const a=current.emyTailSurface('walk',.11,42,0),b=current.emyTailSurface('sit',.77,42,.5);
 assert.equal(a.indices,b.indices,'Identical topology reused across poses');
 assert.notDeepEqual(a.vertices,b.vertices,'Animated vertex positions still change');
 let vertexChecks=0;
 const samples=[];
 for(const mode of ['walk','sit','groom','stretch','sleep','purr','alert']){
  for(const alarm of [0,.75]){
   cat.alarm=alarm;cat.earTurn=.2;cat.earFlatten=.1;
   poseEmy(cat,{mode,phase:.73,walking:mode==='walk',blend:1});
   for(const {box} of cat.parts){
    const mesh=box.emyTailMesh||current.emySurface(box);
    const x=new Float32Array(mesh.vertices.length),y=new Float32Array(mesh.vertices.length);
    current.writeEmySurface(x,0,box);
    if(baseline){
     baseline.writeEmySurface(y,0,box);
     assert.deepEqual(x,y,mode+' '+box.id+' exact float32 attributes');
     vertexChecks+=x.length/16;
    }
    samples.push({box,buffer:x});
   }
   if(baseline){
    const x=current.emyTailSurface(mode,.73,100,alarm),y=baseline.emyTailSurface(mode,.73,100,alarm);
    assert.deepEqual(x.vertices,y.vertices,mode+' tail vertices');
    assert.deepEqual(x.indices,y.indices,mode+' tail indices');
   }
  }
 }
 if(baseline){
  const last=samples.slice(-cat.parts.length);
  const measure=mod=>{const start=performance.now();for(let n=0;n<12;n++)for(const {box,buffer} of last)mod.writeEmySurface(buffer,0,box);return performance.now()-start;};
  measure(baseline);measure(current);
  console.log(JSON.stringify({vertexChecks,baselineMs:measure(baseline),optimizedMs:measure(current),note:'CPU writer microbenchmark on CI, not gameplay FPS'}));
 }
 console.log('PASS Emy exact geometry parity and cached tail indices');
})().catch(e=>{console.error(e);process.exitCode=1;});
