// Real pointer input, respecting the player's actual grab offset.
// Do not mutate React state or bypass the feeding mechanic.
const assert=require('node:assert/strict');
module.exports=async function feedEmy(page){
 const panel=page.getByRole('dialog',{name:'Un Churu para Emy',exact:true});
 await panel.waitFor();
 const stage=panel.locator('.emy-stage'),tube=panel.locator('.emy-churu');
 await tube.waitFor({state:'visible'});
 const drag=await stage.evaluate(el=>{
  const button=el.querySelector('.emy-churu'),guide=el.querySelector('.emy-mouth-guide');
  const r=el.getBoundingClientRect(),b=button.getBoundingClientRect(),mouth=guide.getBoundingClientRect();
  // Rotated buttons have a bounding rectangle with empty corners. Pick a point
  // that genuinely hits the button or one of its descendants.
  let grip;
  for(const fy of [.5,.35,.65,.2,.8])for(const fx of [.5,.35,.65,.2,.8]){
   const x=b.x+b.width*fx,y=b.y+b.height*fy;
   if(!grip&&button.contains(document.elementFromPoint(x,y)))grip={x,y};
  }
  if(!grip)throw Error('Churu has no reachable pointer target');
  const tip={x:r.x+r.width*parseFloat(button.style.left)/100,y:r.y+r.height*parseFloat(button.style.top)/100};
  return {grip,target:{x:grip.x+mouth.x+mouth.width/2-tip.x,y:grip.y+mouth.y+mouth.height/2-tip.y}};
 });
 await page.mouse.move(drag.grip.x,drag.grip.y);
 await page.mouse.down();
 try{
  await page.mouse.move(drag.target.x,drag.target.y,{steps:12});
  await page.waitForFunction(()=>document.querySelector('.emy-feeding')?.dataset.eating==='true',null,{timeout:5000});
  await page.waitForFunction(()=>Number(document.querySelector('.emy-feeding')?.dataset.progress)>=100,null,{timeout:60000});
  assert.equal(await page.getByRole('progressbar',{name:'Emy alimentada'}).getAttribute('aria-valuenow'),'100');
 }finally{await page.mouse.up();}
 await panel.waitFor({state:'hidden',timeout:6000});
};
