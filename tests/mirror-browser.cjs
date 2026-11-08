// Integration coverage for the simplified menu, independent audio and mirror renderer.
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const server=await (await import('vite')).createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});await server.listen();let browser;
 try{
  console.log('Launching browser');
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--no-zygote','--single-process','--in-process-gpu','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:960,height:540},hasTouch:true,isMobile:true}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{const Base=window.AudioContext;window.__audioContexts=[];window.AudioContext=class extends Base{constructor(...a){super(...a);window.__audioContexts.push(this);}};});
  await page.route('**/src/iso-game.ts*',async route=>{const response=await route.fetch(),body=await response.text();await route.fulfill({response,body:body.replace('buildArt(this);','globalThis.__testIso=this;buildArt(this);')});});
  console.log('Opening local app');await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/');await page.locator('.splash-start').waitFor();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.__audioContexts.some(c=>c.state==='running'));
  await page.getByRole('button',{name:'Pruebas',exact:true}).click();
  await page.waitForFunction(()=>window.__audioContexts.every(c=>c.state==='closed'));
  assert.equal(await page.locator('.rescue-main-trials>button').count(),3);
  const saves=await page.evaluate(()=>({story:localStorage.getItem('valeteamo-story-v1'),rescue:localStorage.getItem('valeteamo-rescue-v2')}));
  fs.mkdirSync('/tmp/valeteamo-qa',{recursive:true});await page.screenshot({path:'/tmp/valeteamo-qa/pruebas.png'});
  await page.setViewportSize({width:390,height:844});await page.getByRole('heading',{name:'Elige dónde jugar'}).scrollIntoViewIfNeeded();assert((await page.getByRole('heading',{name:'Elige dónde jugar'}).boundingBox()).y>=0);await page.getByRole('button',{name:'Espejo',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/valeteamo-qa/pruebas-movil.png'});await page.setViewportSize({width:960,height:540});
  await page.getByRole('button',{name:/^2D · Corazones/}).click();await page.waitForFunction(()=>window.__testIso?.keys&&window.__testIso.level===2);
  assert.equal(await page.evaluate(()=>window.__testIso.character),'kitty');
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__testIso.shots.some(s=>!s.enemy));await page.keyboard.up('ArrowRight');
  await page.screenshot({path:'/tmp/valeteamo-qa/2d-corazones.png'});await page.getByRole('button',{name:'Salir',exact:true}).click();
  await page.getByRole('button',{name:'Espejo',exact:true}).click();await page.locator('#lab-dialog [data-act="start"]').click();
  await page.waitForFunction(()=>window.__rescueHouse?.snapshot().mirror.drawn);
  const snap=()=>page.evaluate(()=>window.__rescueHouse.snapshot());
  const initial=await snap();assert(initial.mirror.supported);assert(initial.mirror.vertices>0);assert.equal(initial.cinematic,false);
  await page.waitForFunction(()=>window.__audioContexts.slice(0,-1).every(c=>c.state==='closed')&&window.__audioContexts.at(-1).state==='running');
  await page.waitForTimeout(2000);await page.screenshot({path:'/tmp/valeteamo-qa/espejo.png'});
  await page.locator('#lab-camera-settings summary').click();await page.locator('#lab-camera-settings [data-setting="quality"]').selectOption('low');await page.locator('#lab-camera-settings summary').click();await page.waitForFunction(()=>window.__rescueHouse.snapshot().quality==='low'&&window.__rescueHouse.snapshot().mirror.drawn);
  await page.keyboard.down('d');await page.waitForTimeout(350);await page.keyboard.up('d');await page.waitForTimeout(150);
  const moved=await snap();assert(Math.abs(moved.position.z-initial.position.z)>.2,'Strafing really moves the player');assert(moved.mirror.drawn);
  await page.screenshot({path:'/tmp/valeteamo-qa/espejo-lateral.png'});
  await page.locator('#lab3d [data-act="mirror"]').click();await page.waitForTimeout(150);assert(Math.abs((await snap()).position.z-5.55)<.01);
  await page.keyboard.down('w');await page.waitForTimeout(280);await page.keyboard.up('w');await page.waitForTimeout(150);assert((await snap()).position.x>initial.position.x+.2);
  await page.screenshot({path:'/tmp/valeteamo-qa/espejo-cerca.png'});
  await page.locator('#lab3d [data-act="mirror"]').click();await page.keyboard.down('ArrowLeft');await page.waitForTimeout(1500);await page.keyboard.up('ArrowLeft');await page.waitForTimeout(250);assert.equal((await snap()).mirror.drawn,false,'Mirror skips rendering when facing away');
  await page.locator('.lab-exit').click();await page.waitForFunction(()=>window.__audioContexts.every(c=>c.state==='closed'));
  const after=await page.evaluate(()=>({story:localStorage.getItem('valeteamo-story-v1'),rescue:localStorage.getItem('valeteamo-rescue-v2')}));assert.deepEqual(after,saves);
  // Combined rescue is one flow. Exit cleans its Phaser canvas before direct 3D.
  await page.getByRole('button',{name:/^Rescate · 2D/}).click();await page.locator('.rescue-demo canvas').waitFor();
  await page.getByRole('button',{name:'Volver a pruebas',exact:true}).click();
  await page.getByRole('button',{name:/^Casa 3D/}).click();await page.locator('#lab-dialog [data-act="start"]').click();
  await page.waitForFunction(()=>window.__rescueHouse?.intro()?.elapsed>.05);await page.locator('#lab3d [data-act="skip-intro"]').click();
  await page.waitForFunction(()=>!window.__rescueHouse.snapshot().cinematic);assert.equal(await page.locator('.rescue-demo canvas').count(),0);
  // Context loss restores the canvas fallback rather than leaving a broken input loop.
  await page.locator('#lab-canvas').evaluate(c=>c.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));await page.getByRole('dialog',{name:'Gráficos interrumpidos'}).waitFor();await page.getByRole('button',{name:'Volver a pruebas',exact:true}).click();
  assert.deepEqual(errors,[]);console.log('PASS browser: 3 main entries, animated Kitty hearts, mirrored avatar/torch, movement, culling, audio ownership, intro, context loss and unchanged saves');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
