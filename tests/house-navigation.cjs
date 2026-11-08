const assert=require('node:assert/strict');
(async()=>{
 const w=await import('../src/lab/world.js'),{navigate,PLAYER_RADIUS,smoothAxis,getStairDirection}=await import('../src/lab/navigation.js');
 const world=w.createHouse();for(const door of world.objects.filter(o=>o.kind==='door'))w.setDoor(door,true);
 let s={x:10.6,z:9.45,y:0};for(let i=0;i<90;i++)navigate(s,world,0,-.06);
 assert(s.z<4.55&&Math.abs(s.y-w.HEIGHT)<.02,'Stairwell reaches the actual upper landing');
 for(let i=0;i<90;i++)navigate(s,world,0,.06);assert(s.z>9.15&&s.y<.05,'Stairwell descends without jumps');
 for(const door of world.objects.filter(o=>o.kind==='door')){
  const y=door.box.y-1.1,horizontal=door.box.w>door.box.d;
  const start=horizontal?{x:door.origin.x,y,z:door.origin.z-.70}:{x:door.origin.x+(door.origin.x<6?.70:-.70),y,z:door.origin.z};
  const dx=horizontal?0:door.origin.x<6?-.05:.05,dz=horizontal?.05:0;
  for(let i=0;i<22;i++)navigate(start,world,dx,dz);
  assert(horizontal?start.z>door.origin.z+.2:door.origin.x<6?start.x<door.origin.x-.2:start.x>door.origin.x+.2,door.id+' has a physically passable doorway');
 }
 const hall={x:5.95,y:0,z:9.2};for(let i=0;i<130;i++)navigate(hall,world,0,-.06);assert(hall.z<1.5&&hall.y===0,'No staircase or furniture interrupts the central hall');
 const route={x:6,y:0,z:8.5};for(let i=0;i<42;i++)navigate(route,world,.06,0);for(let i=0;i<16;i++)navigate(route,world,0,.06);for(let i=0;i<35;i++)navigate(route,world,.06,0);for(let i=0;i<85;i++)navigate(route,world,0,-.06);
 assert(route.y>w.HEIGHT-.05,'The stair entrance is reachable from the hall without teleporting: '+JSON.stringify(route));
 assert.equal(w.groundHeight(6,12,w.HEIGHT),0,'Exterior ground never inherits upstairs altitude');
 assert(Number.isNaN(w.groundHeight(9.45,7,w.HEIGHT)),'The unsupported stairwell edge is not an invisible upstairs floor');
 const wallWorld={boxes:[{id:'thin-wall',x:2,y:1.5,z:0,w:.12,h:3,d:8,solid:true}]},fast={x:0,y:0,z:0};navigate(fast,wallWorld,9,1);assert(fast.x<1.8&&fast.z>.9);assert(!w.blocked(wallWorld.boxes,fast.x,fast.y,fast.z,PLAYER_RADIUS,1.64));
 assert(smoothAxis(0,1,.016)>0&&smoothAxis(0,1,.016)<1);assert.equal(getStairDirection({x:10.6,z:7,y:1.5}),'Escaleras');
 console.log('PASS V4: eight doorways, isolated stairs up/down, hall route, grounded exterior, support boundaries and swept collision');
})().catch(e=>{console.error(e);process.exitCode=1;});
