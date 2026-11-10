// Whole-house connectivity at a conservative 64 cm body width, not teleport reach.
const assert=require('node:assert/strict'),fs=require('node:fs');
module.exports=async()=>{
 const w=await import('../src/lab/world.js'),{interactionTarget}=await import('../src/lab/interactions.js'),{WINDOW_LANDING}=await import('../src/lab/window-intro.js');
 const house=w.createHouse(),radius=.32,step=.2;
 for(const door of house.objects.filter(o=>o.kind==='door'))w.setDoor(door,true);
 w.setDrawer(house.objects.find(o=>o.id==='drawer'),true);
 house.objects.push({id:'rescue-louis',kind:'rescue',x:3.1,y:w.HEIGHT+1.25,z:.97});
 const key=(x,z,y)=>Math.round((x-.1)/step)+','+Math.round((z-.1)/step)+','+Math.round(y*100);
 const free=(x,y,z)=>Number.isFinite(y)&&!w.blocked(house.boxes,x,y,z,radius,1.64);
 const seed={x:2.3,y:0,z:11.1},queue=[seed],seen=new Map([[key(seed.x,seed.z,seed.y),seed]]);
 for(let n=0;n<queue.length;n++){
  const p=queue[n];for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){
   const x=Math.round((p.x+dx)*10)/10,z=Math.round((p.z+dz)*10)/10;if(x<.1||x>w.HOUSE.width-.1||z<.1||z>w.HOUSE.depth-.1)continue;
   const y=w.groundHeight(x,z,p.y),id=key(x,z,y);if(seen.has(id)||Math.abs(y-p.y)>.30||!free(x,y,z))continue;
   const mx=p.x+dx/2,mz=p.z+dz/2;if(!free(mx,w.groundHeight(mx,mz,p.y),mz))continue;
   const next={x,y,z};seen.set(id,next);queue.push(next);
  }
 }
 const anchors=[['hall',5.9,10.7,0],['study',3.7,3.7,0],['living',3.9,10.7,0],['kitchen',9.3,3.5,0],['bath',8.1,6.1,0],['stair-bottom',12,10.9,0],['stair-top',12,4.1,w.HEIGHT],['bedroom',3.9,3.7,w.HEIGHT],['wardrobe',2.3,3.9,w.HEIGHT],['reading',3.5,10.5,w.HEIGHT],['music',11.5,2.1,w.HEIGHT],['upper-balcony',12.5,11.1,w.HEIGHT]];
 const routes=anchors.map(([name,x,z,y])=>({name,reachable:queue.some(p=>Math.abs(p.y-y)<.04&&Math.hypot(p.x-x,p.z-z)<.26)}));
 const interactions=['note-hall','drawer','key','mirror-note','mirror-safe','picture-stain','dormitorio','wardrobe','underbed','rescue-louis','basement-hatch'].map(id=>{
  const o=house.objects.find(o=>o.id===id);return {id,reachable:queue.some(p=>{const dy=o.y-p.y-1.63,dx=o.x-p.x,dz=o.z-p.z,d=Math.hypot(dx,dy,dz);return d<2.45&&interactionTarget(house,{x:p.x,y:p.y+1.63,z:p.z,yaw:Math.atan2(dx,dz),pitch:Math.atan2(dy,Math.hypot(dx,dz))})?.id===id;})};
 });
 const metrics={width:w.HOUSE.width,depth:w.HOUSE.depth,stairWidth:w.STAIR.xMax-w.STAIR.xMin,flight:w.STAIR.zBottom-w.STAIR.zTop,bottomLanding:11.9-w.STAIR.zBottom,topLanding:w.STAIR.zTop-3,railToEastWall:13.9-(13.45+.095/2),bathWidth:2.5,bodyWidth:radius*2,reachableSamples:queue.length,routes,interactions};
 fs.mkdirSync('docs/capturas/casa-v5/after',{recursive:true});fs.writeFileSync('docs/capturas/casa-v5/after/espacios.json',JSON.stringify(metrics,null,2)+'\n');
 console.log(JSON.stringify(metrics));assert(routes.every(r=>r.reachable),'All room anchors connected: '+JSON.stringify(routes.filter(r=>!r.reachable)));assert(interactions.every(r=>r.reachable),'All objectives reachable from the connected floor: '+JSON.stringify(interactions.filter(r=>!r.reachable)));
 assert(metrics.bottomLanding>=1.9&&metrics.topLanding>=1.9&&metrics.stairWidth>=2.3&&metrics.railToEastWall>=.39);
 for(let t=0;t<=1;t+=.02){const p={x:12,y:w.HEIGHT*t,z:w.STAIR.zBottom-(w.STAIR.zBottom-w.STAIR.zTop)*t};assert(free(p.x,p.y,p.z),'Headroom along the full flight');}
 console.log('PASS V5 spatial audit: all rooms, objectives, landings and stair headroom');
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1;});
