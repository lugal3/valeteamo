module.exports=async page=>{
 const use=id=>page.evaluate(id=>window.__rescueHouse.interactWith(id),id);
 if(await page.evaluate(()=>window.__rescueHouse.emy().companion==='waiting')){
  await use('salon');
  await page.waitForFunction(()=>window.__rescueHouse.emy().companion==='following');
 }
 const studyOpen=await page.evaluate(()=>window.__rescueHouse.snapshot().doors.find(o=>o.id==='estudio').open);
 if(!studyOpen)await use('estudio');
 await use('emy-vent');
 await page.waitForFunction(()=>window.__rescueHouse.snapshot().puzzle.key,null,{timeout:90000});
 return {puzzle:(await page.evaluate(()=>window.__rescueHouse.snapshot())).puzzle};
};
