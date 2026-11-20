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
 const {emySurface}=await import('../src/lab/emy-surface.js');
 const {emyLandmarks,poseEmy}=await import('../src/lab/emy-cat.js');
 const walk=emyLandmarks('walk',.5,true),sit=emyLandmarks('sit'),groom=emyLandmarks('groom',.7),stretch=emyLandmarks('stretch'),sleep=emyLandmarks('sleep');
 assert(sit.head[1]>walk.head[1]+.05,'sitting raises the neck and head');
 assert(groom.legs['front-1'].paw[1]>.4,'grooming raises a paw to the muzzle');
 assert(stretch.head[1]<walk.head[1]-.20&&stretch.legs.front1.paw[2]>.45,'stretch lowers chest and reaches front paws');
 assert(sleep.body[1]<walk.body[1]-.1&&sleep.head[1]<.23,'sleeping curls the entire body close to the floor');
 const review=createHouse().emy;
 for(const part of review.parts){
  if(part.box.emySpec.form==='fuzz')continue;
  const mesh=part.box.emyTailMesh||emySurface(part.box),v=mesh.vertices;
  for(let i=0;i<mesh.indices.length;i+=3){
   const [a,b,c]=mesh.indices.slice(i,i+3).map(n=>n*16),x=[v[b]-v[a],v[b+1]-v[a+1],v[b+2]-v[a+2]],y=[v[c]-v[a],v[c+1]-v[a+1],v[c+2]-v[a+2]];
   const dot=(x[1]*y[2]-x[2]*y[1])*v[a+6]+(x[2]*y[0]-x[0]*y[2])*v[a+7]+(x[0]*y[1]-x[1]*y[0])*v[a+8];
   assert(dot<1e-8,part.id+' outward smooth normals agree with WebGL clockwise winding');
  }
 }
 review.x=review.y=review.z=review.yaw=0;
 for(const mode of ['walk','sit','groom','stretch','sleep','purr']){
  review.age=.7;poseEmy(review,{mode,phase:.7,walking:mode==='walk'});
  const mesh=geometry(review.parts.map(p=>p.box));
  assert(mesh.indices.length/3<34000,'bounded smooth surface and fur triangle count');
  for(let i=0;i<mesh.vertices.length;i+=16){
   assert([...mesh.vertices.slice(i,i+16)].every(Number.isFinite),mode+' finite posed mesh');
   assert(mesh.vertices[i+1]>-.025,mode+' paws and coat remain above the floor');
   assert(Math.abs(Math.hypot(...mesh.vertices.slice(i+6,i+9))-1)<.002,mode+' unit normals after nonuniform skin scale');
  }
 }
 // Exercise the actual GPU writer against fresh geometry after every pose.
 const {HouseRenderer}=await import('../src/lab/renderer.js'),boxes=review.parts.map(p=>p.box),bind=geometry(boxes);
 const renderer=Object.assign(Object.create(HouseRenderer.prototype),{gl:{ARRAY_BUFFER:0,bindBuffer(){},bufferSubData(){}},dynamicBoxes:boxes,dynamicVisible:boxes.map(()=>true),dynamicRanges:bind.ranges,dynamicTemplate:bind.vertices,dynamicVertices:new Float32Array(bind.vertices),dynamicPositions:new Float32Array(boxes.length*6),dynamicOrigins:boxes.map(b=>[b.x,b.y,b.z,0,0,0]),fixtures:[],dirtyLampShadows:new Set()});
 for(const mode of ['walk','groom','stretch','sleep','sit','purr']){
  poseEmy(review,{mode,phase:1.1,walking:mode==='walk'});renderer.updateDynamic(1.1,{});
  const fresh=geometry(boxes).vertices;
  for(let i=0;i<fresh.length;i++)assert(Math.abs(fresh[i]-renderer.dynamicVertices[i])<.00001,mode+' actual renderer matches reference surface');
 }
 const full=createHouse();const all=geometry([...full.boxes,...(await import('../src/lab/renderer.js')).pickupGeometry(full.objects)].filter(b=>b.dynamic));
 assert(all.vertices.length/16<65536,'complete house including both Emy actors fits WebGL1 index buffers');
 for(const hz of [30,60]){
  const world=createHouse(),cat=world.emy,phases=new Set();
  const mesh=geometry(cat.parts.map(x=>x.box));assert(mesh.vertices.length/16<18000,'cat has a bounded mobile mesh');
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
