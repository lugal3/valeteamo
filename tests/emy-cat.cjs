const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
(async()=>{
 const ctx={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/demo/emy-feeding-state.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,ctx);
 const {advanceEmyFeeding:feed,EMY_MOUTH:m}=ctx.exports;
 assert.equal(feed(20,.1,false,m.x,m.y),20);assert.equal(feed(20,.1,true,0,0),20);
 assert.equal(feed(20,NaN,true,m.x,m.y),20);assert.equal(feed(20,-4,true,m.x,m.y),20);
 assert(feed(20,20,true,m.x,m.y)<22,'resuming a hidden tab cannot instantly finish');
 for(const hz of [30,60,120]){let p=0;for(let i=0;i<hz*8;i++)p=feed(p,1/hz,true,m.x,m.y);assert.equal(p,100);assert.equal(feed(p,1,true,m.x,m.y),100);}
 const {createHouse,blocked}=await import('../src/lab/world.js'),{updateUpstairsEmy,petEmy}=await import('../src/lab/emy-cat.js');
 const {geometry}=await import('../src/lab/renderer.js');
 for(const hz of [30,60]){
  const world=createHouse(),cat=world.emy,phases=new Set();
  const mesh=geometry(cat.parts.map(x=>x.box));assert(mesh.vertices.length/16<3500,'cat has a bounded mobile mesh');
  assert(cat.parts.every(p=>!p.box.solid),'Emy cannot block stairs or trap the player');
  for(let i=0;i<hz*150;i++){
   updateUpstairsEmy(cat,1/hz,{blocked:(...args)=>blocked(world.boxes,...args)});phases.add(cat.phase);
   assert(!blocked(world.boxes,cat.x,cat.y,cat.z,.24,.72),'Emy stays on clear upstairs floor');
   assert.equal(cat.y,3.15);assert(cat.x>4.8&&cat.x<7.2&&cat.z>2&&cat.z<9);
   assert(cat.parts.every(p=>[p.box.x,p.box.y,p.box.z,p.box.yaw,p.box.pitch,p.box.roll].every(Number.isFinite)));
  }
  for(const phase of ['walk','sit','groom','stretch','sleep'])assert(phases.has(phase),'observed '+phase);
  assert(petEmy(cat));updateUpstairsEmy(cat,.1);assert.equal(cat.phase,'purr');
  updateUpstairsEmy(cat,.1,{hidden:true});assert(cat.parts.every(p=>p.box.hiddenGeometry),'only one Emy is visible during the escape finale');
 }
 console.log('PASS Emy: held treat proximity, 30/60/120Hz feeding, upstairs route/collisions, five behaviors, pet reaction, bounded rig and finale visibility.');
})().catch(e=>{console.error(e);process.exitCode=1});
