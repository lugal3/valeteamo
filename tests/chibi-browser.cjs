const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const server=await (await import('vite')).createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});await server.listen();let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--no-zygote','--single-process','--in-process-gpu','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:960,height:540},hasTouch:true,isMobile:true}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/');await page.locator('.splash-start').waitFor();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Pruebas',exact:true}).click();await page.getByRole('button',{name:'Espejo',exact:true}).click();await page.locator('#lab-dialog [data-act="start"]').click();
  await page.waitForFunction(()=>window.__rescueHouse?.snapshot().mirror.drawn);
  const snap=()=>page.evaluate(()=>window.__rescueHouse.snapshot());
  await page.waitForTimeout(2000);const initial=await snap();assert(initial.mirror.vertices<14000);
  const uploads=initial.mirror.uploads;await page.waitForTimeout(450);assert.equal((await snap()).mirror.uploads,uploads,'Idle avatar reuses its GPU buffer');
  fs.mkdirSync('/tmp/chibi-qa',{recursive:true});await page.screenshot({path:'/tmp/chibi-qa/01-espejo.png'});
  const ring=await page.locator('#lab3d .lab-stick-ring').boundingBox();assert(ring.width>=113,'Larger joystick at 540px height');
  const zone=await page.locator('#lab-joystick').boundingBox(),cx=zone.x+zone.width/2,cy=zone.y+zone.height/2;
  await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx-zone.width*.35,cy,{steps:6});await page.waitForTimeout(500);await page.mouse.up();await page.waitForTimeout(450);
  const moved=await snap();assert(moved.position.z>initial.position.z+.12,'Larger joystick still moves in the expected direction');assert(Math.abs(moved.camera.yaw-initial.camera.yaw)<.01,'Movement target does not steal look input');
  assert.equal(moved.controls.stick,null);assert.equal(moved.controls.joystick.x,0);
  await page.locator('#lab3d [data-act="mirror"]').click();
  await page.evaluate(()=>window.__rescueHouse.setPose({x:9.0,y:0,z:5.55,yaw:Math.PI/2,pitch:-.02}));await page.waitForTimeout(350);await page.screenshot({path:'/tmp/chibi-qa/02-espejo-cerca.png'});
  await page.evaluate(()=>window.__rescueHouse.setPose({x:8.35,y:0,z:5.55,yaw:1.22,pitch:0}));await page.waitForTimeout(350);await page.screenshot({path:'/tmp/chibi-qa/03-espejo-lateral.png'});
  await page.evaluate(()=>window.__rescueHouse.setPose({x:6,y:0,z:10.7,yaw:0,pitch:-.18}));await page.waitForTimeout(350);await page.screenshot({path:'/tmp/chibi-qa/04-mano-linterna.png'});
  const flashlight=(await snap()).flashlight;await page.locator('#lab3d [data-act="flash"]').click();await page.waitForTimeout(180);assert.notEqual((await snap()).flashlight,flashlight);await page.screenshot({path:'/tmp/chibi-qa/05-linterna-apagada.png'});await page.locator('#lab3d [data-act="flash"]').click();
  await page.setViewportSize({width:740,height:360});await page.waitForTimeout(250);const compact=await page.locator('#lab3d .lab-stick-ring').boundingBox();assert.equal(compact.width,90,'Larger 90px joystick on compact landscape');
  const joystick=await page.locator('#lab-joystick').boundingBox(),buttons=await page.locator('.lab-buttons').boundingBox();assert(joystick.x+joystick.width<buttons.x,'Thumb controls do not overlap');await page.screenshot({path:'/tmp/chibi-qa/06-controles-movil.png'});
  await page.setViewportSize({width:960,height:540});await page.locator('.lab-exit').click();await page.getByRole('button',{name:/^Casa 3D/}).click();await page.locator('#lab-dialog [data-act="start"]').click();await page.waitForFunction(()=>window.__rescueHouse?.intro()?.phase==='climb');await page.getByRole('button',{name:'Pausar entrada',exact:true}).click();await page.screenshot({path:'/tmp/chibi-qa/07-manos-ventana.png'});
  assert.deepEqual(errors,[]);console.log('PASS chibi browser: shaded mirror, idle GPU reuse, larger joystick drag/release, separate look input, light on/off, compact landscape, climbing paws and no JS errors');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
