const assert=require('node:assert/strict');
(async()=>{
 const w=await import('../src/lab/world.js');
 const {navigate,PLAYER_RADIUS,smoothAxis,getStairDirection}=await import('../src/lab/navigation.js');
 const world=w.createHouse('ground');
 for(const id of ['entrada','salon','estudio','habitación','dormitorio'])w.setDoor(world.objects.find(o=>o.id===id),true);
 let s={x:9.75,z:9.40,y:0};
 for(let i=0;i<90;i++)navigate(s,world,0,-.06);
 assert(s.z<4.55,'Player must reach top of stairs, z='+s.z);
 assert(Math.abs(s.y-w.HEIGHT)<.02,'Player must arrive on upper floor, y='+s.y);
 assert(!w.blocked(world.boxes,s.x,s.y,s.z,PLAYER_RADIUS,1.64),'Upper floor reachable');
 for(let i=0;i<90;i++)navigate(s,world,0,.06);
 assert(s.z>9.15,'Player must descend stairs, z='+s.z);
 assert(s.y<.05,'Player must return to lower floor, y='+s.y);
 const entrances=[
  {name:'estudio',x:5.1,z:6.42,y:0,dx:-.06,steps:35,minX:3.9},
  {name:'salon',x:6.65,z:2.48,y:0,dx:.06,steps:36,maxX:8.0},
  {name:'dormitorio',x:5.25,z:2.52,y:w.HEIGHT,dx:-.05,steps:32,minX:4.4},
  {name:'habitación',x:6.65,z:2.52,y:w.HEIGHT,dx:.05,steps:32,maxX:7.8},
  {name:'entrada',x:5.87,z:8.75,y:0,dx:0,dz:.05,steps:30,minZ:10.0}
 ];
 for(const item of entrances){
  const player={x:item.x,y:item.y,z:item.z};
  for(let step=0;step<item.steps;step++)navigate(player,world,item.dx,item.dz||0);
  if(item.minX!==undefined)assert(player.x<item.minX,item.name+' doorway blocked x='+player.x);
  if(item.maxX!==undefined)assert(player.x>item.maxX,item.name+' doorway blocked x='+player.x);
  if(item.minZ!==undefined)assert(player.z>item.minZ,item.name+' doorway blocked z='+player.z);
 }
 let p={x:6.25,y:0,z:6.7};
 for(let i=0;i<30;i++)navigate(p,world,.07,0);
 assert(p.x>8.0,'Hallway to staircase should be navigable: '+p.x);
 assert(smoothAxis(0,1,.016)>0&&smoothAxis(0,1,.016)<1);
 assert.equal(getStairDirection({x:9.75,z:7,y:1.5}),'Escaleras');
 const wallWorld={boxes:[{id:'thin-wall',x:2,y:1.5,z:0,w:.12,h:3,d:8,solid:true}]};
 const fast={x:0,y:0,z:0};navigate(fast,wallWorld,9,1);
 assert(fast.x<1.8,'Swept steps must not tunnel through a thin wall during a long frame');
 assert(fast.z>.9,'Blocked diagonal movement slides along the free axis');
 assert(!w.blocked(wallWorld.boxes,fast.x,fast.y,fast.z,PLAYER_RADIUS,1.64));
 console.log('PASS house: passable hallway; stairs up/down; swept collision; smoothing');
})().catch(e=>{console.error(e);process.exitCode=1});
