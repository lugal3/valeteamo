const assert=require('node:assert/strict');
const stages=['outside','return-path','reunion','celebration'];
const keys=['w','a','s','d'];
const waitScene=async(page,stage)=>{
 await page.locator('.garden-epilogue[data-epilogue-stage="'+stage+'"]').waitFor({timeout:30000});
 await page.waitForFunction(()=>window.__valeEpilogue?.()?.ready,null,{timeout:30000});
 await page.getByRole('button',{name:'Pausar aventura'}).waitFor({timeout:30000});
};
async function walkToMarker(page){
 // Plan a route using the actual collision function, not scene mutation.
 // The player is moved only by browser keyboard events.
 const route=await page.evaluate(async()=>{
  const {constrainRescue}=await import('/src/demo/rescue-overworld.ts');
  const {p,target,map}=window.__valeEpilogue();
  const dist=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
  const free=q=>dist(constrainRescue(q,map),q)<1e-6;
  const clear=(a,b)=>{const count=Math.max(1,Math.ceil(dist(a,b)/.12));for(let i=0;i<=count;i++){const f=i/count;if(!free({u:a.u+(b.u-a.u)*f,v:a.v+(b.v-a.v)*f}))return false;}return true;};
  if(clear(p,target))return [target];
  const grid=.25,key=(u,v)=>u+','+v,start={u:Math.round(p.u/grid),v:Math.round(p.v/grid)};
  const q=[start],prev=new Map([[key(start.u,start.v),null]]);let found;
  for(let i=0;i<q.length&&i<18000;i++){
   const a=q[i],point={u:a.u*grid,v:a.v*grid};
   if(dist(point,target)<.6&&clear(point,target)){found=a;break;}
   for(const [du,dv] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const u=a.u+du,v=a.v+dv,k=key(u,v);
    if(prev.has(k)||!free({u:u*grid,v:v*grid}))continue;
    prev.set(k,a);q.push({u,v});
   }
  }
  if(!found)throw Error('No collision-safe epilogue route');
  const points=[target];for(let a=found;a;a=prev.get(key(a.u,a.v)))points.push({u:a.u*grid,v:a.v*grid});points.reverse();
  const out=[];let anchor=p;
  for(let i=0;i<points.length;){let j=points.length-1;while(j>i&&!clear(anchor,points[j]))j--;out.push(points[j]);anchor=points[j];i=j+1;}
  return out;
 });
 let held=new Set();
 const release=async()=>{for(const k of held)await page.keyboard.up(k);held.clear();};
 try{
  for(let index=0;index<route.length;index++){
   const goal=route[index],tolerance=index===route.length-1?.65:.28;
   let reached=false;
   for(let attempt=0;attempt<170;attempt++){
    const current=await page.evaluate(()=>window.__valeEpilogue());
    const du=goal.u-current.p.u,dv=goal.v-current.p.v;
    if(Math.hypot(du,dv)<tolerance){reached=true;break;}
    // Choose the closest of eight actual WASD directions in world-space.
    let best=-Infinity,desired=[];
    for(const x of [-1,0,1])for(const y of [-1,0,1]){
     if(!x&&!y)continue;
     const u=x/82+y/40,v=y/40-x/82;
     const score=(u*du+v*dv)/Math.hypot(u,v);
     if(score>best){best=score;desired=[...(x?[x>0?'d':'a']:[]),...(y?[y>0?'s':'w']:[])];}
    }
    for(const k of [...held])if(!desired.includes(k)){await page.keyboard.up(k);held.delete(k);}
    for(const k of desired)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
    await page.waitForFunction(clock=>window.__valeEpilogue()?.clock>=clock+100,current.clock,{timeout:12000});
   }
   assert(reached,'Kitty reached actual waypoint '+JSON.stringify(goal));
   await release();
  }
 }finally{await release();for(const key of keys)await page.keyboard.up(key);}
 await page.locator('.epilogue-action').waitFor({timeout:30000});
}
async function dialogue(page){
 await page.locator('.epilogue-action').click();
 const box=page.locator('.epilogue-dialog');
 await box.waitFor();
 for(let i=0;i<18&&await box.isVisible();i++){
  await box.getByRole('button',{name:/Mostrar todo|Continuar/}).click();
 }
 await box.waitFor({state:'hidden'});
}
async function completeChapter(page,stage,shots){
 await waitScene(page,stage);
 const snapshot=await page.evaluate(()=>window.__valeEpilogue());
 assert.equal(snapshot.enemies,0);assert.deepEqual(snapshot.companions,[true,true]);
 await walkToMarker(page);
 if(shots)await page.screenshot({path:shots+'/epilogue-'+stage+'.png'});
 await dialogue(page);
 if(stage==='celebration'){
  await page.getByRole('button',{name:/sopla las velas/}).click();
  await page.getByRole('button',{name:'Leer carta'}).click();
  await page.locator('.epilogue-letter').waitFor();
  await page.getByRole('button',{name:'Cerrar carta'}).click();
  await page.getByRole('button',{name:'Foto grupal'}).click();
  const postal=page.getByRole('dialog',{name:'Feliz cumpleaños, Vale'});
  await postal.locator('img').waitFor({timeout:10000});
  assert.match(await postal.locator('img').getAttribute('src'),/^data:image\/png;base64,/);
  assert.equal(await postal.getByRole('link',{name:'Guardar imagen'}).getAttribute('download'),'ValeTeAmo-postal.png');
  if(shots)await page.screenshot({path:shots+'/epilogue-postcard.png'});
  await postal.getByRole('button',{name:'Volver al jardín'}).click();
  await page.getByRole('button',{name:'Terminar aventura'}).click();
  await page.locator('[data-epilogue-stage="complete"]').waitFor({timeout:20000});
 }else await waitScene(page,stages[stages.indexOf(stage)+1]);
}
module.exports={completeChapter,waitScene,stages};
