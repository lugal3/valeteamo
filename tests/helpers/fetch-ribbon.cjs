module.exports=async page=>{
 const use=id=>page.evaluate(id=>window.__rescueHouse.interactWith(id),id);
 if(await page.evaluate(()=>window.__rescueHouse.emy().companion==='waiting')){
  try{
   await page.waitForFunction(()=>!window.__rescueHouse.snapshot().paused,null,{timeout:30000});
   await use('salon');
   await page.waitForFunction(()=>window.__rescueHouse.emy().companion==='following',null,{timeout:90000});
  }catch(error){console.log('RIBBON_ENTRANCE_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>({emy:window.__rescueHouse.emy(),story:window.__rescueHouse.story(),snapshot:window.__rescueHouse.snapshot(),visibleOverlay:document.querySelector('.field-overlay:not([hidden])')?.textContent}))));throw error;}
 }
 const studyOpen=await page.evaluate(()=>window.__rescueHouse.snapshot().doors.find(o=>o.id==='estudio').open);
 if(!studyOpen)await use('estudio');
 if(!await page.evaluate(()=>window.__rescueHouse.emy().ventOpen)){
  if(!await page.locator('[data-equip=screwdriver]').isVisible()){
   if(!await page.evaluate(()=>window.__rescueHouse.snapshot().drawer.amount===1))await use('drawer');
   await use('screwdriver');
  }
  if(await page.locator('[data-equip=screwdriver]').getAttribute('aria-pressed')!=='true')await page.locator('[data-equip=screwdriver]').click();
  await use('emy-vent');
  await page.waitForFunction(()=>window.__rescueHouse.emy().ventOpen);
  await page.waitForTimeout(280);
 }
 await use('emy-vent');
 // The renderer caps simulation deltas to preserve collision accuracy.
 // Under software WebGL, 90 wall seconds may represent only 11 game seconds.
 // Keep an independent wall ceiling, and fail immediately for a real mission
 // failure or excessive simulated duration. Never alter the production clock.
 try{
  const started=await page.evaluate(()=>window.__rescueHouse.emy().fetch?.age);
  if(!Number.isFinite(started))throw Error('Ribbon mission did not start');
  const handle=await page.waitForFunction(started=>{
   const api=window.__rescueHouse;if(!api)return 'house-closed';
   if(api.snapshot().puzzle.key)return 'delivered';
   const emy=api.emy(),job=emy.fetch;
   if(!job||emy.companion!=='fetch')return 'mission-failed';
   if(job.age-started>75)return 'simulation-timeout';
   return false;
  },started,{timeout:360000,polling:500});
  const result=await handle.jsonValue();await handle.dispose();
  if(result!=='delivered')throw Error('Ribbon mission: '+result);
 }catch(error){console.log('RIBBON_FETCH_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>({emy:window.__rescueHouse.emy(),story:window.__rescueHouse.story(),snapshot:window.__rescueHouse.snapshot()}))));throw error;}
 await page.locator('.house-hotbar').waitFor({state:'visible'});
 await page.locator('.house-hotbar [data-equip=key]').waitFor({state:'visible'});
 return {puzzle:(await page.evaluate(()=>window.__rescueHouse.snapshot())).puzzle};
};
