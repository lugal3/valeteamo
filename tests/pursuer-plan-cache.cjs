// Regression: memoizing blocked cells must not alter the pursuit route.
const assert=require('node:assert/strict');
(async()=>{
 const {createHouse,blocked,setDoor}=await import('../src/lab/world.js');
 const {Pursuer,SEARCH_ROUTE}=await import('../src/lab/pursuer.js');
 const dist=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*2,a.z-b.z);
 const world=createHouse(),p=new Pursuer(world);
 const originalRoute=goal=>{
  p.buildGraph();
  const boxes=p.planningBoxes(),available=n=>!blocked(boxes,n.x,n.y,n.z,.16,1.72);
  const nearest=point=>{let best=null,d=Infinity;for(const n of p.nodes){const v=dist(n,point);if(v<d&&available(n)){best=n;d=v;}}return best;};
  const start=nearest(p),end=nearest(goal);if(!start||!end)return null;
  const open=new Set([start.index]),cost=new Map([[start.index,0]]),parent=new Map();let found=false;
  while(open.size){
   let id=null,best=Infinity;
   for(const i of open){const f=cost.get(i)+dist(p.nodes[i],end);if(f<best){best=f;id=i;}}
   open.delete(id);if(id===end.index){found=true;break;}
   for(const ni of p.nodes[id].neighbors){
    const n=p.nodes[ni];if(!available(n))continue;
    const value=cost.get(id)+dist(p.nodes[id],n);if(value>=(cost.get(ni)??Infinity))continue;
    cost.set(ni,value);parent.set(ni,id);open.add(ni);
   }
  }
  if(!found)return null;
  let at=end.index;const path=[];
  while(at!==start.index){path.unshift(p.nodes[at].index);at=parent.get(at);}
  path.unshift(start.index);return path;
 };
 const verify=()=>{
  for(const goal of SEARCH_ROUTE){
   const expected=originalRoute(goal),found=p.plan(goal);
   assert.equal(found,expected!==null,'Path availability must match the original search');
   assert.deepEqual(p.path.map(n=>n.index),expected||[],'Waypoint ordering must remain identical');
  }
 };
 verify();
 const entry=world.objects.find(o=>o.id==='entrada');
 assert(entry,'Entrance door fixture should exist');
 setDoor(entry,true);verify();
 setDoor(entry,false);verify();
 console.log('PASS pursuer route cache: original waypoint sequences preserved across door-state changes');
})().catch(e=>{console.error(e);process.exitCode=1;});
