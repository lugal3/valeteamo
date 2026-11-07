// Dependency-free sanity tests for the new deterministic house and geometry.
const assert=require('node:assert/strict');
(async()=>{
 const {createHouse,HEIGHT,stairHeight,groundHeight,blocked,lineBlocked,setDoor,setDrawer}=await import('../src/lab/world.js');
 const g=createHouse('ground'),u=createHouse('upstairs');
 assert.equal(g.spawn.y,0);assert.equal(u.spawn.y,HEIGHT);
 assert(g.boxes.length>60);assert(g.objects.length>12);
 assert.equal(stairHeight(9.75,9.15),0);assert(Math.abs(stairHeight(9.75,4.55)-HEIGHT)<.0001);
 assert.equal(stairHeight(5,8),null);assert.equal(groundHeight(6,3,HEIGHT),HEIGHT);
 assert(blocked(g.boxes,-.02,0,5),'outside west wall solid');
 assert(!blocked(g.boxes,6,0,8.4),'entry corridor passable');
 assert(!blocked(g.boxes,6,HEIGHT,3.8),'upstairs landing passable');
 const door=g.objects.find(o=>o.id==='salon');
 assert(door&&!door.open&&door.box.solid);
 const before=door.box.z;setDoor(door,true);assert(door.open&&!door.box.solid&&door.box.z!==before);
 setDoor(door,false);assert(door.box.solid&&door.box.z===before);
 const drawer=g.objects.find(o=>o.id==='drawer');const pos=drawer.box.z;
 setDrawer(drawer,true);assert(drawer.box.z>pos);setDrawer(drawer,false);assert(drawer.box.z===pos);
 assert(lineBlocked(g.boxes,{x:5.5,y:1.5,z:2},{x:9.5,y:1.5,z:2.5}),'wall blocks cross-room interaction');
 assert(!lineBlocked(g.boxes,{x:5.5,y:1.5,z:7},{x:6.5,y:1.5,z:7}),'hallway line of sight free');
 const ids=g.objects.map(o=>o.id);assert.equal(new Set(ids).size,ids.length);
 for(const b of g.boxes)for(const key of ['x','y','z','w','h','d'])assert(Number.isFinite(b[key]),b.id+': '+key);
 console.log('PASS: 3D layout, floors, stairs, collisions, occlusion, doors/drawer and deterministic content');
})().catch(e=>{console.error(e);process.exitCode=1});
