module.exports=async page=>{
 const use=id=>page.evaluate(id=>window.__rescueHouse.interactWith(id),id);
 if(await page.evaluate(()=>window.__rescueHouse.emy().companion==='waiting')){
  await use('salon');
  await page.waitForFunction(()=>window.__rescueHouse.emy().companion==='following');
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
 await page.waitForFunction(()=>window.__rescueHouse.snapshot().puzzle.key,null,{timeout:90000});
 await page.locator('.house-hotbar').waitFor({state:'visible'});
 await page.locator('.house-hotbar [data-equip=key]').waitFor({state:'visible'});
 return {puzzle:(await page.evaluate(()=>window.__rescueHouse.snapshot())).puzzle};
};
