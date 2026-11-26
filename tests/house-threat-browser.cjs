const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');

(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0},plugins:[{
  name:'house-threat-fixture',
  configureServer(server){
   server.middlewares.use((request,response,next)=>{
    if(!request.url.startsWith('/__house-threat'))return next();
    response.setHeader('Content-Type','text/html');
    response.end(`<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body><script type="module">
      import {launchHouse} from '/src/lab/house.js';
      const deadline=new URLSearchParams(location.search).has('deadline');
      const key=deadline?'test-house-deadline':'test-house-threat';
      const checkpoint=JSON.parse(localStorage.getItem(key))??(deadline?{version:2,stage:'encounter',picked:['key','media-flashlight'],tutorials:['movement','threat'],lives:3}:{
       version:1,stage:'rest',picked:['key','media-flashlight'],pursuit:{phase:'hunt'},blackout:{until:3.5,left:0}
      });
      window.closeHouse=launchHouse(()=>{},'ground',{demo:true,fieldTutorials:deadline,checkpointStore:{
       checkpoint,save:value=>{localStorage.setItem(key,JSON.stringify(value));return true;}
      }});
     </script></body></html>`);
   });
  }
 }]});
 let browser,page,cdp;
 const evidence=process.env.HOUSE_THREAT_QA_DIR;
 const shot=async name=>{
  if(!evidence)return;
  const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  await fs.writeFile(path.join(evidence,name+'.png'),Buffer.from(data,'base64'));
 };
 try{
  await server.listen();
  if(evidence)await fs.mkdir(evidence,{recursive:true});
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:840,height:480},reducedMotion:'reduce'});
  page.setDefaultTimeout(45000);
  cdp=await page.context().newCDPSession(page);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const url='http://127.0.0.1:'+server.httpServer.address().port+'/__house-threat';
  const ready=async()=>{
   await page.waitForFunction(()=>window.__rescueHouse&&document.querySelector('#lab-canvas')?.width>300);
   if(process.env.EMY_THREAT_QA_LOW)await page.evaluate(()=>{
    const field=document.querySelector('#lab-camera-settings [data-setting="quality"]');
    if(field){field.value='low';field.dispatchEvent(new Event('input',{bubbles:true}));}
   });
  };
  const snapshot=()=>page.evaluate(()=>window.__rescueHouse.snapshot());
  const story=()=>page.evaluate(()=>window.__rescueHouse.story());
  const amenities=()=>page.evaluate(()=>window.__rescueHouse.amenities());
  const save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('test-house-threat')));
  const aim=id=>page.evaluate(id=>window.__rescueHouse.interactWith(id,false),id);
  const interact=()=>page.locator('#lab-interact').dispatchEvent('click');
  const aimAt=async id=>{
   await aim(id);
   await page.waitForFunction(id=>window.__rescueHouse.snapshot().target===id,id);
  };
  await page.goto(url);await ready();
  assert.equal((await story()).phase,'hunt');
  assert.equal((await story()).pursuer.active,true);
  assert.equal((await story()).pursuer.difficulty,'story');
  await page.evaluate(()=>{const field=document.querySelector('[data-setting="difficulty"]');field.value='tense';field.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal((await story()).pursuer.difficulty,'tense');
  await page.evaluate(()=>{const field=document.querySelector('[data-setting="difficulty"]');field.value='story';field.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal((await story()).pursuer.difficulty,'story');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('valeteamo-house-camera-v4')).difficulty),'story');

  await aimAt('underbed');await interact();
  assert.equal((await snapshot()).hidden,false,'The standing player cannot enter under the bed');
  await page.keyboard.press('c');
  await aimAt('underbed');
  assert.equal((await snapshot()).hidden,false,'Crouching and aiming must not hide Kitty');
  await shot('01-escondite-requiere-interaccion');
  await page.waitForTimeout(300);
  await interact();
  await page.waitForFunction(()=>{
   const snap=window.__rescueHouse.snapshot();
   return snap.hideType==='underbed'&&!snap.handVisible;
  });
  const tucked=await snapshot();
  const peek=page.locator('.house-hide-peek');await peek.waitFor();
  await page.keyboard.down('v');
  try{await page.waitForFunction(()=>window.__rescueHouse.snapshot().hidePeek>.9);const lean=await snapshot();assert.deepEqual(lean.position,tucked.position);assert.equal(lean.hideType,'underbed');assert(Math.hypot(lean.view.x-tucked.view.x,lean.view.z-tucked.view.z)>.15);}finally{await page.keyboard.up('v');}
  await page.waitForFunction(()=>window.__rescueHouse.snapshot().hidePeek<.02);
  assert.equal(tucked.handVisible,false);
  await page.keyboard.down('w');
  try{await page.waitForTimeout(350);}finally{await page.keyboard.up('w');}
  assert.deepEqual((await snapshot()).position,tucked.position);
  assert.equal((await save()).hide,'underbed');
  console.log('Threat QA: standing, crouching, intentional entry and blocked movement');

  await page.reload();await ready();
  const reloaded=await snapshot();
  assert.equal(reloaded.hideType,'underbed');
  assert.deepEqual(reloaded.view,tucked.view);
  assert.equal((await story()).phase,'hunt');assert.equal((await story()).pursuer.active,true);
  await shot('02-escondite-restaurado');
  await page.keyboard.press('e');
  await page.waitForFunction(()=>!window.__rescueHouse.snapshot().hidden);
  assert.equal((await save()).hide,undefined);
  assert.equal(await page.locator('#lab-crouch').getAttribute('aria-pressed'),'true');
  await page.keyboard.press('c');
  await aimAt('wardrobe');await page.waitForTimeout(300);await interact();
  await page.waitForFunction(()=>{
   const snap=window.__rescueHouse.snapshot();
   return snap.hideType==='wardrobe'&&!snap.handVisible;
  });
  assert.equal((await snapshot()).handVisible,false);
  const closet=await snapshot();await peek.waitFor();const point=await peek.boundingBox();
  await page.mouse.move(point.x+point.width/2,point.y+point.height/2);await page.mouse.down();
  try{await page.waitForFunction(()=>window.__rescueHouse.snapshot().hidePeek>.9);const lean=await snapshot();assert.deepEqual(lean.position,closet.position);assert.equal(lean.hideType,'wardrobe');assert.equal(lean.wardrobeAmount,closet.wardrobeAmount);await shot('03b-armario-asomarse');}finally{await page.mouse.up();}
  await page.waitForFunction(()=>window.__rescueHouse.snapshot().hidePeek<.02);
  await shot('03-armario');
  await page.waitForTimeout(300);await page.keyboard.press('e');
  await page.waitForFunction(()=>!window.__rescueHouse.snapshot().hidden);
  console.log('Threat QA: safe reload and exit from both hiding spots');

  await page.evaluate(()=>{
   const save=JSON.parse(localStorage.getItem('test-house-threat'));
   localStorage.setItem('test-house-threat',JSON.stringify({...save,stage:'basement',pursuit:{phase:'evaded'},blackout:{until:1.9,left:0}}));
  });
  await page.reload();await ready();
  assert.equal((await story()).phase,'evaded');
  assert((await story()).pursuer.active,'The pursuer remains active after the escape from pursuit');
  await page.evaluate(async()=>{
   const {STAIR}=await import('/src/lab/world.js');
   const pose={x:STAIR.xMin+.55,y:0,z:STAIR.zBottom+.28,yaw:Math.PI,pitch:.08};
   window.__rescueHouse.setPose(pose);return pose;
  });
  assert.equal((await amenities()).power,true,'An old blackout timer cannot trip the house supply');
  await aimAt('house-power');await interact();
  assert.equal((await amenities()).power,false);
  await shot('04-apagon-en-la-escalera');
  await page.waitForTimeout(5500);
  assert.equal((await amenities()).power,false,'A tripped breaker stays off');
  await aimAt('house-power');await interact();
  assert((await amenities()).lights.includes('recibidor'));
  assert.equal((await story()).pursuer.active,true);
  assert.equal(await page.locator('#lab-canvas').evaluate(canvas=>canvas.getContext('webgl').getError()),0);
  assert.deepEqual(errors,[]);
  await page.evaluate(()=>window.closeHouse());
  console.log('PASS house threat browser: explicit hiding, safe reload and exits, manual power restoration and continued patrol');

  // A focused campaign-like fixture bypasses the unrelated LP trial matrix.
  // Both attempts use the real scripted arrival, modal, pursuer and save path.
  await page.goto(url+'?deadline=1');await ready();
  const dismiss=page.locator('.field-overlay [data-field-close]');
  await page.waitForFunction(()=>window.__rescueHouse.story().tutorial==='hide',null,{timeout:90000});
  assert.equal((await story()).remaining,10);
  await page.waitForTimeout(400);
  assert.equal((await story()).remaining,10,'Tutorial reading genuinely pauses the ten-second clock');
  await dismiss.click();
  await page.locator('.field-countdown').waitFor();
  await page.keyboard.press('c');
  await aimAt('underbed');await interact();
  await page.waitForFunction(()=>window.__rescueHouse.snapshot().hideType==='underbed');
  await page.waitForFunction(()=>window.__rescueHouse.story().phase==='patrol',null,{timeout:90000});
  const arrived=await story();
  assert.equal(arrived.remaining,0);assert.equal(arrived.pursuer.y,3.15);
  assert.equal((await snapshot()).hidden,true);
  const success=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-house-deadline')));
  assert.equal(success.lives,3);assert(success.tutorials.includes('hide'));
  await shot('05-deadline-underbed-safe');
  await page.evaluate(saved=>localStorage.setItem('test-house-deadline',JSON.stringify({...saved,stage:'encounter',hide:undefined,pursuit:null})),success);
  await page.reload();await ready();
  await page.waitForFunction(()=>window.__rescueHouse.story().phase==='hide',null,{timeout:90000});
  assert.equal(await page.locator('.field-overlay:not([hidden])').count(),0,'No repeat on retry');
  await page.waitForFunction(()=>window.__rescueHouse.story().phase==='failed',null,{timeout:90000});
  const failed=await story();
  assert.equal(failed.remaining,0);assert.equal(failed.pursuer.y,3.15);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('test-house-deadline')).lives),2);
  await shot('06-deadline-immediate-capture');
  assert.deepEqual(errors,[]);
  await page.evaluate(()=>window.closeHouse());
  console.log('PASS real deadline: paused card, under-bed survival, upstairs at zero and exact one-life debit');
 }catch(error){
  try{console.log('THREAT_QA_FAILURE',await page?.evaluate(()=>({
   story:window.__rescueHouse?.story(),snapshot:window.__rescueHouse?.snapshot(),lights:window.__rescueHouse?.amenities()
  })));await shot('fallo');}catch{}
  throw error;
 }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
