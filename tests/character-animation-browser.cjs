const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const server=await (await import('vite')).createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});await server.listen();let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--no-zygote','--single-process','--in-process-gpu','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  fs.mkdirSync('/tmp/animation-qa',{recursive:true});
  const context=await browser.newContext({viewport:{width:960,height:540},hasTouch:true,isMobile:true,recordVideo:{dir:'/tmp/animation-qa',size:{width:960,height:540}}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const snap=()=>page.evaluate(()=>window.__rescueHouse.snapshot());
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/');await page.locator('.splash-start').waitFor();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Pruebas',exact:true}).click();await page.getByRole('button',{name:'Espejo',exact:true}).click();await page.locator('#lab-dialog [data-act="start"]').click();await page.waitForFunction(()=>window.__rescueHouse?.snapshot().mirror.drawn);
  await page.waitForTimeout(1700);const idle=await snap();assert.equal(idle.animation.state,'idle');assert.equal(idle.animation.distance,0);await page.screenshot({path:'/tmp/animation-qa/01-reposo.png'});
  await page.waitForTimeout(500);const breathing=await snap();assert(breathing.animation.evaluations>idle.animation.evaluations);assert.equal(breathing.animation.phase,idle.animation.phase);
  await page.keyboard.press('Escape');const paused=await snap();await page.waitForTimeout(400);assert.deepEqual((await snap()).animation,paused.animation);assert.equal((await snap()).mirror.uploads,paused.mirror.uploads);await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.evaluate(()=>window.__rescueHouse.setPose({x:8.1,y:0,z:5.55,yaw:Math.PI/2,pitch:-.05}));
  const walkStart=await snap();await page.keyboard.down('w');await page.waitForFunction(()=>window.__rescueHouse.snapshot().animation.weight>.7);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.keyboard.up('w');const walking=await snap();assert(walking.animation.distance>walkStart.animation.distance+.05);assert.equal(walking.animation.state,'walk');await page.screenshot({path:'/tmp/animation-qa/02-paso.png'});
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.keyboard.down('s');await page.waitForFunction(d=>window.__rescueHouse.snapshot().animation.distance>d+.08,walking.animation.distance);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.keyboard.up('s');await page.screenshot({path:'/tmp/animation-qa/03-paso-alternado.png'});await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.waitForTimeout(650);assert.equal((await snap()).animation.state,'idle');
  // Repeated short walks keep the whole character in view for the video evidence.
  await page.evaluate(()=>window.__rescueHouse.setPose({x:8.15,y:0,z:5.55,yaw:Math.PI/2,pitch:-.05}));
  for(const key of ['w','s','w','s']){await page.keyboard.down(key);await page.waitForTimeout(180);await page.keyboard.up(key);await page.waitForTimeout(180);}
  await page.evaluate(()=>window.__rescueHouse.setPose({x:9.6,y:0,z:5.55,yaw:Math.PI/2,pitch:0}));await page.keyboard.down('w');await page.waitForTimeout(800);const blocked=await snap();await page.waitForTimeout(350);const wall=await snap();await page.keyboard.up('w');assert.equal(wall.animation.distance,blocked.animation.distance,'Wall input cannot advance gait distance');assert(wall.animation.weight<.01);
  await page.evaluate(()=>window.__rescueHouse.setPose({x:8.35,y:0,z:5.55,yaw:-Math.PI/2,pitch:0}));await page.waitForTimeout(150);const away=await snap();assert.equal(away.mirror.drawn,false);await page.waitForTimeout(400);const awayAfter=await snap();assert.equal(awayAfter.animation.evaluations,away.animation.evaluations);assert.equal(awayAfter.animation.rigEvaluations,away.animation.rigEvaluations);assert.equal(awayAfter.mirror.uploads,away.mirror.uploads);assert(awayAfter.animation.time>away.animation.time);
  await page.evaluate(()=>window.__rescueHouse.setPose({x:8.35,y:0,z:5.55,yaw:Math.PI/2,pitch:0}));await page.waitForFunction(()=>window.__rescueHouse.snapshot().mirror.drawn);assert((await snap()).animation.evaluations>awayAfter.animation.evaluations);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);assert.equal((await snap()).animation.reduced,true);
  await page.locator('.lab-exit').click();await page.getByRole('button',{name:/^Casa 3D/}).click();await page.locator('#lab-dialog [data-act="start"]').click();assert.equal((await snap()).cinematic,false);await page.locator('.lab-exit').click();await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button',{name:/^Casa 3D/}).click();await page.locator('#lab-dialog [data-act="start"]').click();await page.waitForFunction(()=>window.__rescueHouse?.intro()?.phase==='climb');await page.screenshot({path:'/tmp/animation-qa/04-ventana.png'});await page.locator('#lab3d [data-act="skip-intro"]').click();await page.waitForFunction(()=>!window.__rescueHouse.snapshot().cinematic);
  assert.deepEqual(errors,[]);const video=page.video();await context.close();await video.saveAs('/tmp/animation-qa/animaciones.webm');console.log('PASS animation browser: idle breathing, real walking, wall stop, pause, visibility culling, return to mirror, reduced motion and shared window anchors');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
