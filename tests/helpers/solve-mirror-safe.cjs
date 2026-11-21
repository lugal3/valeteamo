module.exports=async page=>{
 const state=await page.evaluate(()=>window.__rescueHouse?.mirrorPuzzle?.());if(!state||state.opened)return;
 const use=(id,activate=true)=>page.evaluate(({id,activate})=>window.__rescueHouse.interactWith(id,activate),{id,activate});
 if(!state.collected)await use('mirror-note');
 if(!await page.evaluate(()=>window.__rescueHouse.snapshot().doors.find(o=>o.id==='bano').open))await use('bano');
 await page.waitForFunction(()=>window.__rescueHouse.amenities().power);
 if(!await page.evaluate(()=>window.__rescueHouse.amenities().lights.includes('bano')))await use('switch-bano');
 await page.evaluate(()=>window.__rescueHouse.setPose({x:8.35,y:0,z:5.55,yaw:Math.PI/2,pitch:0}));
 await page.waitForFunction(()=>window.__rescueHouse.mirrorPuzzle().revealed);
 await use('mirror-safe');await page.getByRole('dialog',{name:'Caja fuerte',exact:true}).waitFor();await page.keyboard.type('1505');await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.__rescueHouse.mirrorPuzzle().opened&&window.__rescueHouse.mirrorPuzzle().safe.state==='open');
};
