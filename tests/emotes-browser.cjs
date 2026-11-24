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
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:720},hasTouch:false,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.getByRole('button',{name:'Administración'}).click();
  await page.getByLabel('Código de acceso').fill('LP');
  await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();
  // The LP panel groups the mirror scene inside its closed advanced section.
  await page.getByText('Escenas y mecánicas aisladas',{exact:true}).click();
  await page.getByRole('button',{name:'Espejo',exact:true}).click();
  await page.locator('#lab-canvas').waitFor({timeout:25000});
  // Starting the embedded house may schedule app navigation; do not wait for
   // that unrelated document lifecycle. We explicitly wait for game readiness.
   await page.getByRole('button',{name:'Iniciar prueba'}).click({noWaitAfter:true});
   await page.waitForFunction(()=>!!window.__rescueHouse?.snapshot?.() &&
    window.__rescueHouse.snapshot().paused===false,null,{timeout:20000});
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
  await page.screenshot({path:'artifacts/desktop-emotes-open.png'});
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
  // Pointer lock hides the top bar by design; release with the real shortcut.
  if(await page.evaluate(()=>!!document.pointerLockElement)){
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>document.pointerLockElement===null);
  }
  await page.getByLabel('Ajustes de la casa').click();
  const lock=page.locator('#house-lock-mouse');
  if(await lock.isVisible()){
   await lock.click();
   await page.waitForTimeout(150);
   if(await page.evaluate(()=>!!document.pointerLockElement)){
    await page.keyboard.press('m');
    await menu.waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>document.pointerLockElement),null,
     'opening emote panel MUST release captured desktop mouse');
    await page.locator('#house-emotes [data-act="emote:stop"]').click();
   }
  }
  assert.deepEqual(errors,[],'no browser errors during mouse/emotes interactions');
  await context.close();
  console.log('PASS: real desktop mouse emote opening, HTML hidden visibility, buttons, M shortcut, Escape and mouse capture.');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
