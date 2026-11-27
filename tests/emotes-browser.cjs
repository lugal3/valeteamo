const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0,strictPort:true},logLevel:'silent'});
 let browser;
 try{
  await server.listen();
  const url='http://127.0.0.1:'+server.httpServer.address().port+'/';
  // Match the software WebGL configuration of the other 3D CI suites.
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1280,height:720},hasTouch:false,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.getByRole('button',{name:'Administración'}).click();
  await page.getByLabel('Código de acceso').fill('LP');
  await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();
  // The LP panel groups the mirror scene inside its closed advanced section.
  await page.getByText('Checkpoints de encuentros y mecánicas',{exact:true}).click();
  await page.getByRole('button',{name:'Espejo',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#lab-canvas')?.width>300&&!!window.__rescueHouse?.snapshot,null,{timeout:25000});
  // Keep a real mouse click and assert readiness. Save diagnostics on any
  // startup failure instead of force-clicking or skipping the scenario.
  try{
   await page.getByRole('button',{name:'Iniciar prueba'}).click({noWaitAfter:true});
   await page.waitForFunction(()=>window.__rescueHouse.snapshot().paused===false,null,{timeout:20000});
  }catch(error){
   fs.mkdirSync('artifacts',{recursive:true});
   const state=await page.evaluate(()=>({root:document.querySelector('#lab3d')?.className,dialog:document.querySelector('#lab-dialog')?.innerText,canvasWidth:document.querySelector('#lab-canvas')?.width,ready:window.__rescueHouse?.snapshot?.(),focused:document.hasFocus()})).catch(()=>null);
   console.error('EMOTES_START_DIAGNOSTIC',JSON.stringify({state,errors}));
   await page.screenshot({path:'artifacts/desktop-emotes-start-failure.png',timeout:10000}).catch(()=>{});
   throw error;
  }
  const toggle=page.getByRole('button',{name:'Elegir emote'});
  await toggle.waitFor({state:'visible',timeout:15000});
  const menu=page.locator('#house-emotes');
  // Regression: CSS display:flex cannot defeat the HTML hidden attribute.
  assert.equal(await menu.isVisible(),false,'hidden emote panel must NOT intercept desktop clicks');
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await toggle.click();
  await menu.waitFor({state:'visible',timeout:6000});
  assert.equal(await toggle.getAttribute('aria-expanded'),'true','the real mouse click opens menu');
  fs.mkdirSync('artifacts',{recursive:true});
  // A software-WebGL compositor can time out on screenshots even when
  // the menu is visible and interactive. Retain visual evidence if possible,
  // but never let an optional artifact prevent the remaining real clicks.
  try{
   await page.screenshot({path:'artifacts/desktop-emotes-open.png',timeout:15000});
  }catch(error){
   if(error.name!=='TimeoutError')throw error;
   console.warn('EMOTES_SCREENSHOT_TIMEOUT: interaction checks continue; PNG evidence unavailable.');
   fs.writeFileSync('artifacts/desktop-emotes-open-dom.json',JSON.stringify({
    visible:await menu.isVisible(),expanded:await toggle.getAttribute('aria-expanded'),
    menuText:await menu.innerText(),reason:error.message
   },null,2));
  }
  await page.locator('#house-emotes [data-act="emote:stop"]').click();
  assert.equal(await menu.isVisible(),false,'menu closes on desktop menu-button click');
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');

  // Keyboard access works for users who use mouse capture / pointer lock.
  await page.keyboard.press('m');
  await menu.waitFor({state:'visible'});
  await page.keyboard.press('Escape');
  assert.equal(await menu.isVisible(),false,'Escape closes without stale click interception');

  // When headless Chromium grants pointer lock, M must release it before
  // the interactive HTML emote choices can receive physical mouse clicks.
  // Use the supported desktop R shortcut. The settings bar can be
  // legitimately hidden during pointer lock and non-interactive moments.
  // The test is about the keyboard/mouse capture flow, not toolbar visibility.
  if(await page.evaluate(()=>!!document.pointerLockElement)){
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>document.pointerLockElement===null);
  }
  await page.keyboard.press('r');
  if(await page.waitForFunction(()=>!!document.pointerLockElement,null,{timeout:3000}).then(()=>true,()=>false)){
    await page.keyboard.press('m');
    await menu.waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>document.pointerLockElement),null,
     'opening emote panel MUST release captured desktop mouse');
    await page.locator('#house-emotes [data-act="emote:stop"]').click();
  }
  assert.deepEqual(errors,[],'no browser errors during mouse/emotes interactions');
  await context.close();
  console.log('PASS: real desktop mouse emote opening, HTML hidden visibility, buttons, M shortcut, Escape and mouse capture.');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
