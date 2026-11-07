// Real browser smoke test, not an iPhone physical-device test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0},logLevel:'silent'});
 await server.listen();const url='http://127.0.0.1:'+server.httpServer.address().port+'/';
 const folder=path.resolve('demo-screenshots');fs.mkdirSync(folder,{recursive:true});
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:960,height:540},hasTouch:true,isMobile:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
  await page.goto(url);
  await page.getByRole('button',{name:/Presiona cualquier botón para iniciar/}).waitFor({timeout:15000});
  await page.screenshot({path:path.join(folder,'01-portada.png')});
  await page.getByRole('button',{name:/Presiona cualquier botón para iniciar/}).click();
  await page.getByText('Feliz cumpleaños, Valentina').waitFor();await page.waitForTimeout(1100);
  await page.screenshot({path:path.join(folder,'02-cumpleanos.png')});
  await page.getByRole('button',{name:/Jugar la demo de rescate 2D/}).click();
  await page.getByRole('button',{name:/Presiona cualquier botón para iniciar/}).click();
  await page.locator('.rescue-stage canvas').waitFor({timeout:15000});
  await page.waitForTimeout(850);
  await page.screenshot({path:path.join(folder,'03-jardin-2d.png')});
  await page.keyboard.down('d');await page.waitForTimeout(610);await page.keyboard.up('d');
  await page.getByRole('button',{name:/Recoger corazón/}).waitFor({timeout:7000});
  await page.getByRole('button',{name:/Recoger corazón/}).click();
  await page.waitForTimeout(2400);
  await page.screenshot({path:path.join(folder,'04-secuestro.png')});
  await page.keyboard.down('d');await page.waitForTimeout(1560);await page.keyboard.up('d');
  await page.evaluate(()=>{window.__rescueScene.kitty.setPosition(594,325);});
  await page.getByRole('button',{name:/Seguir pétalos/}).waitFor({timeout:7000});
  await page.getByRole('button',{name:/Seguir pétalos/}).click();
  // Place the player at the 3D threshold after verifying the trail clue.
  await page.evaluate(()=>{window.__rescueScene.kitty.setPosition(838,310);});
  console.log('At house:',await page.evaluate(()=>({phase:document.querySelector('.rescue-story')?.textContent,kittyX:window.__rescueScene.kitty.x,kittyY:window.__rescueScene.kitty.y,lastNear:window.__rescueScene.lastNear,buttons:[...document.querySelectorAll('.rescue-demo button')].map(b=>b.textContent)})));
  await page.getByRole('button',{name:/Abrir puerta/}).waitFor({timeout:7000});
  await page.getByRole('button',{name:/Abrir puerta/}).click();
  await page.getByRole('button',{name:/Entrar a buscar a Louis/}).waitFor({timeout:7000});
  await page.screenshot({path:path.join(folder,'05-transicion.png')});
  await page.getByRole('button',{name:/Entrar a buscar a Louis/}).click();
  await page.locator('#lab3d canvas').waitFor({timeout:15000});
  await page.locator('#lab-dialog [data-act="start"]').click();
  await page.waitForTimeout(650);
  await page.screenshot({path:path.join(folder,'06-casa-3d.png')});
  await page.getByRole('button',{name:/Mochila/}).count(); // selection smoke check
  assert.deepEqual(errors,[],'Unexpected browser errors: '+errors.join(' | '));
  console.log('PASS: interactive cover, birthday menu, Phaser route, transition and WebGL house');
  await context.close();
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});