const assert=require('node:assert/strict');
module.exports=async()=>{
 const {geometry,HouseRenderer,pickupGeometry}=await import('../src/lab/renderer.js'),{createHouse,setDoor,setDrawer}=await import('../src/lab/world.js');
 const world=createHouse(),key=world.objects.find(o=>o.id==='key');key.concealed=false;
 const boxes=[...world.boxes,...pickupGeometry(world.objects)].filter(b=>b.dynamic),mesh=geometry(boxes);let cursor=0;
 boxes.forEach((b,i)=>{assert.equal(mesh.ranges[i].start,cursor);cursor+=geometry([b]).vertices.length;assert.equal(mesh.ranges[i].end,cursor);});assert.equal(cursor,mesh.vertices.length);
 const {castsShadow}=await import('../src/lab/lighting.js');
 const renderer=Object.assign(Object.create(HouseRenderer.prototype),{gl:{ARRAY_BUFFER:0,bindBuffer(){},bufferSubData(){}},dynamicBoxes:boxes,dynamicRanges:mesh.ranges,dynamicOrigins:boxes.map(b=>[b.x,b.y,b.z,b.yaw||0,b.roll||0,b.pitch||0]),dynamicPositions:new Float32Array(boxes.length*6).fill(Infinity),dynamicTemplate:mesh.vertices,dynamicVertices:new Float32Array(mesh.vertices),dynamicCasters:boxes.map(castsShadow),fixtures:world.lights.fixtures,dirtyLampShadows:new Set()});
 for(const amount of [true,false,true,false]){
  world.objects.filter(o=>o.kind==='door').forEach(o=>setDoor(o,amount));setDrawer(world.objects.find(o=>o.id==='drawer'),amount);renderer.updateDynamic(0,{reduced:true});const fresh=geometry(boxes).vertices;
  for(let v=0;v<fresh.length;v+=16)for(const k of [0,1,2,6,7,8,13,14,15])assert(Math.abs(renderer.dynamicVertices[v+k]-fresh[v+k])<.0001,'Mesh transform matches collider '+v+' '+k);
 }
 const {HouseEvents}=await import('../src/lab/story-events.js'),s=new HouseEvents(),p={key:true,symbol:true,door:false};assert.equal(s.observe(p),'message');assert.equal(s.observe(p),null);s.read();s.advance(1,false);s.read();s.advance(1,false);assert.equal(s.messages.length,2);assert.equal(s.observe({...p,door:true}),'arrival');s.advance(4,false);assert.equal(s.phase,'hide');assert.equal(s.remaining,10);s.advance(10,false);assert.equal(s.phase,'failed');s.retry();s.advance(4,false);s.advance(10,true);assert.equal(s.phase,'safe');assert.equal(s.messages.length,2);
 const {mirrorVisible}=await import('../src/lab/mirror.js');const hall={x:6,y:1.63,z:5.8,yaw:Math.PI/2};assert(!mirrorVisible(hall,0));assert(mirrorVisible(hall,.5));assert(!mirrorVisible({...hall,y:4.8},1));
 console.log('PASS: variable mesh ranges, four furniture cycles, mirror hallway gate, idempotent phone/event timeline, both countdown outcomes');
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1;});
