// Real pointer input: progress must come from holding the treat at the mouth.
module.exports=async function feedEmy(page){
 const panel=page.getByRole('dialog',{name:'Un Churu para Emy',exact:true});
 await panel.waitFor();
 const stage=await page.locator('.emy-stage').boundingBox(),tube=await page.locator('.emy-churu').boundingBox();
 if(!stage||!tube)throw new Error('Emy feeding stage is not visible');
 await page.mouse.move(tube.x+tube.width/2,tube.y+tube.height*.35);
 await page.mouse.down();
 await page.mouse.move(stage.x+stage.width*.49,stage.y+stage.height*.375,{steps:12});
 await page.waitForFunction(()=>Number(document.querySelector('.emy-feeding')?.dataset.progress)>=100,null,{timeout:60000});
 await page.mouse.up();
 await panel.waitFor({state:'hidden',timeout:6000});
};
