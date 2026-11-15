const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0,strictPort:true},logLevel:'silent'});
 let browser;
 try{
  await server.listen();
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  fs.mkdirSync('artifacts',{recursive:true});
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/');
  await page.getByRole('button',{name:'Administración'}).click();
  await page.getByLabel('Código de acceso').fill('LP');
  await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();

  const panel=page.locator('.playtest-menu[data-admin-panel="lp"]');
  await panel.waitFor();
  assert.equal(await page.locator('.story-cover').count(),0,'LP must not land on the pink story cover');
  assert.deepEqual(await page.locator('.playtest-section-heading h2').allTextContents(),['Universo','2D','3D']);
  assert.equal(await page.locator('.playtest-grid:not(.playtest-grid-advanced) > .playtest-card').count(),11);
  assert.equal(await page.locator('.playtest-advanced').count(),5);
  assert.equal(await page.locator('canvas').count(),0,'no Phaser or 3D canvas should mount on the menu');
  const background=await panel.evaluate(node=>getComputedStyle(node).backgroundColor);
  assert.equal(background,'rgb(14, 17, 22)','LP panel uses dark graphite background');
  assert.equal(await page.getByRole('button',{name:'Cajón y pistas',exact:true}).isVisible(),false,
   'rare checkpoints are hidden until expanded');
  await page.locator('#lp-tres-d .playtest-advanced').nth(1).locator('summary').click();
  assert.equal(await page.getByRole('button',{name:'Cajón y pistas',exact:true}).isVisible(),true,
   'advanced checkpoints remain accessible');
  await page.screenshot({path:'artifacts/lp-admin-menu-dark-iphone.png',fullPage:true});

  await page.getByRole('button',{name:'Rescate · 2D → 3D',exact:true}).click();
  const splash=page.locator('.valeteamo-splash');
  await splash.getByRole('button',{name:'Presiona cualquier botón para iniciar'}).waitFor();
  assert.equal(await splash.locator('img[src="./demo-assets/portada-v2.webp"]').count(),1);
  await page.screenshot({path:'artifacts/lp-rescue-picnic.png'});
  await splash.getByRole('button',{name:'Presiona cualquier botón para iniciar'}).click();
  await page.locator('.story-prologue .adventure-canvas canvas').waitFor({timeout:25000});
  assert.deepEqual(errors,[],'LP menu and rescue transition must have no JavaScript errors');
  await context.close();
  console.log('PASS: LP -> dark ordered Universe/2D/3D panel; no eager engines; advanced checkpoints; 2D picnic.');
 }finally{await browser?.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
