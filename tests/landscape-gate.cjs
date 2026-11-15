const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0,strictPort:true},logLevel:'silent'});
 let browser;
 try{
  await server.listen();
  const port=server.httpServer.address().port;
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('artifacts',{recursive:true});
  await page.goto('http://127.0.0.1:'+port+'/');
  const gate=page.getByRole('dialog',{name:/Gira tu teléfono/});
  await gate.waitFor({state:'visible',timeout:12000});
  assert.equal(await page.locator('.landscape-app-content').evaluate(el=>el.inert),true,
   'portrait phone disables interactions behind the blossom notice');
  assert.equal(await page.locator('.birthday-countdown').count(),1,
   'the countdown remains mounted behind the notice');
  await page.screenshot({path:'artifacts/blossom-turn-portrait.png'});

  await page.setViewportSize({width:844,height:390});
  await gate.waitFor({state:'hidden',timeout:7000});
  assert.equal(await page.locator('.landscape-app-content').evaluate(el=>el.inert),false);
  await page.getByRole('button',{name:'Administración'}).click();
  await page.getByLabel('Código de acceso').fill('LP');
  await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();
  assert.equal(await page.locator('.valeteamo-splash').count(),0,'picnic cover is absent before the test menu');
  assert.equal(await page.locator('.playtest-menu[data-admin-panel="lp"]').count(),1,'LP goes directly to the dark testing panel');
  await page.getByRole('button',{name:/Galaxia rosa del video/}).click();
  const canvas=page.locator('canvas.cosmos-video-canvas');
  await canvas.waitFor({timeout:9000});
  await canvas.evaluate(el=>{el.dataset.orientationPersistence='yes';});
  await page.locator('canvas.cosmos-video-canvas[data-arrival-stage="explore"]').waitFor({timeout:19000});
  const elapsed=Number(await canvas.getAttribute('data-cinematic-seconds'));
  await page.screenshot({path:'artifacts/blossom-landscape-galaxy.png'});

  await page.setViewportSize({width:390,height:844});
  await gate.waitFor({state:'visible',timeout:7000});
  assert.equal(await canvas.count(),1,'the same galaxy canvas remains mounted when rotating portrait');
  assert.equal(await canvas.getAttribute('data-orientation-persistence'),'yes');
  await page.screenshot({path:'artifacts/blossom-galaxy-portrait.png'});
  await page.setViewportSize({width:844,height:390});
  await gate.waitFor({state:'hidden',timeout:7000});
  assert.equal(await canvas.getAttribute('data-orientation-persistence'),'yes','no canvas remount on rotation');
  assert(Number(await canvas.getAttribute('data-cinematic-seconds'))>=elapsed,
   'galaxy animation did not restart when crossing orientations');
  await page.getByRole('button',{name:'Ajustes de la galaxia'}).click();
  await page.getByRole('button',{name:/Abrir corazón/}).click();
  await page.getByRole('dialog',{name:/Comenzamos nuestra aventura/}).waitFor();
  await page.getByRole('button',{name:/Comenzar juego 2D/}).click();
  await page.getByRole('button',{name:'Presiona cualquier botón para iniciar'}).click();
  const phaser=page.locator('.adventure-canvas canvas');
  await phaser.waitFor({timeout:25000});
  await page.locator('.story-prologue .prologue-guide').waitFor({timeout:12000});
  await phaser.evaluate(el=>{el.dataset.orientationPersistence='game';});
  await page.setViewportSize({width:390,height:844});
  await gate.waitFor({state:'visible',timeout:7000});
  assert.equal(await phaser.getAttribute('data-orientation-persistence'),'game');
  await page.setViewportSize({width:844,height:390});
  await gate.waitFor({state:'hidden',timeout:7000});
  assert.equal(await phaser.getAttribute('data-orientation-persistence'),'game',
   'the existing Phaser game is not destroyed and recreated on rotation');
  await page.locator('.story-prologue .prologue-guide').waitFor({timeout:8000});
  assert.deepEqual(errors,[],'no runtime errors in orientation transitions');
  await context.close();
  console.log('PASS: blossom portrait -> landscape, countdown, persistent galaxy, heart, active Phaser without scene remount.');
 }finally{await browser?.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
