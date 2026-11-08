const assert=require('node:assert/strict');
(async()=>{
 const m=await import('../src/lab/mirror.js');
 const {createHouse,blocked}=await import('../src/lab/world.js');
 const world=createHouse('mirror');assert(!blocked(world.boxes,world.spawn.x,world.spawn.y,world.spawn.z,.2,1.7));
 for(const p of [{x:8,y:1,z:5},{x:8.8,y:2,z:6}])assert.deepEqual(m.reflectPoint(m.reflectPoint(p)),p);
 const p=m.MIRROR_SPAWN,camera={...p,y:1.63,pitch:0};assert(m.mirrorVisible(camera));assert(!m.mirrorVisible({...camera,yaw:-Math.PI/2}));assert(!m.mirrorVisible({...camera,x:4}));
 const base=new Float32Array([.36,.7,.58,1,1,1,1,0,0,0,0,0,0,1,0,0]),out=new Float32Array(16);
 m.poseReflectedKitty(base,out,camera);assert.deepEqual([...out.slice(3,6)],[1,1,1],'Preserve avatar material colors');assert(Math.abs(out[0]-(2*m.MIRROR_PLANE-p.x-.58))<.00001);assert(Math.abs(out[2]-(p.z-.36))<.00001,'Right-hand torch is on the opposite side in reflection');
 const before=out[0];m.poseReflectedKitty(base,out,{...camera,x:camera.x+.2});assert(Math.abs(out[0]-before+.2)<.00001,'Approaching the mirror moves reflected avatar symmetrically');
 const pieces=m.kittyMirrorPieces();assert(pieces.some(p=>p.id.includes('torch-lens')));assert(pieces.some(p=>p.id.includes('bow-knot')));
 assert(m.reflectedBathroom(world.boxes).every(b=>!b.id.includes('mirror-kitty')&&!b.id.includes('bath-mirror')),'No recursive mirror');
 console.log('PASS mirror: symmetric pose, inverted torch, bathroom-only geometry, safe spawn and visibility budget');
})().catch(e=>{console.error(e);process.exitCode=1;});
