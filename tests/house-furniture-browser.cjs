const passBirthdayCountdown=require('./helpers/pass-birthday-countdown.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});
 await server.listen();let browser;
 try{
  browser=await chromium.launch({args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),errors=[],posters=[];
  page.setDefaultTimeout(90000);page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(/poster-(titanes|archivo)\.jpg$/.test(response.url()))posters.push(response.status());});
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/');await passBirthdayCountdown(page);
  await page.locator('.splash-start').waitFor();await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Pruebas',exact:true}).click();
  await page.getByRole('button',{name:/^Casa 3D/}).click();
  await page.locator('[data-act=start]').click();await page.locator('[data-act=skip-intro]').click();
  const use=(id,activate=true)=>page.evaluate(([id,activate])=>window.__rescueHouse.interactWith(id,activate),[id,activate]);
  const snapshot=()=>page.evaluate(()=>window.__rescueHouse.snapshot());
  const amenities=()=>page.evaluate(()=>window.__rescueHouse.amenities());
  const pose=(x,z,yaw=0,pitch=0)=>page.evaluate(({x,z,yaw,pitch})=>window.__rescueHouse.setPose({x,y:0,z,yaw,pitch}),{x,z,yaw,pitch});
  const close=()=>page.keyboard.press('Escape');
  const shot=async name=>{
   if(!process.env.HOUSE_QA_DIR)return;
   fs.mkdirSync(process.env.HOUSE_QA_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.HOUSE_QA_DIR,name+'.png')});
  };

  assert(await page.locator('[data-equip=flashlight]').isHidden());
  assert(await page.locator('#house-lock-mouse').isHidden());
  await use('media-cabinet');await use('media-flashlight');
  assert(await page.locator('[data-equip=flashlight]').isVisible());
  await use('piano');await page.getByRole('dialog',{name:'Piano antiguo'}).waitFor();
  for(const letter of ['a','d','g','h','g','d','s','a'])await page.keyboard.press(letter);
  await page.getByText('Melodía completa',{exact:true}).waitFor();await shot('piano');await close();
  await use('hide-trunk');await page.waitForFunction(()=>window.__rescueHouse.snapshot().hideType==='trunk');
  await page.keyboard.press('e');await page.waitForFunction(()=>!window.__rescueHouse.snapshot().hidden);

  await use('television',false);await page.getByRole('button',{name:'Encender tele',exact:true}).click();
  await page.waitForFunction(()=>{const tv=window.__rescueHouse.amenities().television;return tv.on&&tv.duration===2&&tv.frame>1;});
  assert.equal(await page.evaluate(()=>window.__rescueHouse.story().audio.lastEffect),'tv-static');
  assert.equal(await page.locator('iframe').count(),0);
  await pose(1.64,7.83,.96,-.18);await shot('televisor-en-el-salon');
  await use('television');await page.waitForFunction(()=>!window.__rescueHouse.amenities().television.on);
  await use('television');await page.waitForFunction(()=>window.__rescueHouse.amenities().television.on);
  await use('picture-living-tour',false);await shot('poster-titanes');
  await pose(5.9,6.9);await page.waitForFunction(()=>!window.__rescueHouse.amenities().television.on);

  await pose(9.41,9.06,Math.PI,-.06);await shot('interruptor-general');
  await use('house-power');assert.equal((await amenities()).power,false);assert.deepEqual((await amenities()).lights,[]);
  await use('switch-recibidor');assert.deepEqual((await amenities()).lights,[]);
  await use('television');assert.equal((await amenities()).television.on,false);
  await use('house-power');assert.equal((await amenities()).power,true);assert((await amenities()).lights.includes('recibidor'));
  await pose(6.05,1.35,Math.PI,.19);
  const {clock}=await amenities();
  await page.waitForFunction(second=>window.__rescueHouse.amenities().clock.second>second,clock.second);
  assert.notDeepEqual((await amenities()).clock.hands,clock.hands);
  assert.equal(await page.evaluate(()=>window.__rescueHouse.story().audio.lastEffect),'clock-tick');await shot('reloj-del-pasillo');

  await page.keyboard.press('3');await page.keyboard.press('p');
  await page.getByRole('button',{name:'WhatsApp',exact:true}).click();
  await page.getByText('Hace varias horas').waitFor();await page.getByText(/Ten cuidado cuando llegues/).waitFor();
  assert.equal(await page.locator('.phone-composer').getAttribute('aria-hidden'),'true');await shot('telefono-chat-previo');
  await close();await page.keyboard.press('2');

  await pose(23.5,8);await page.keyboard.down('Shift');await page.keyboard.down('w');
  await page.waitForFunction(()=>window.__rescueHouse.amenities().sprinting);await page.getByRole('meter',{name:'Estamina'}).waitFor();
  await page.waitForFunction(()=>window.__rescueHouse.amenities().stamina===0,{},{timeout:18000});
  await page.keyboard.up('w');await page.keyboard.up('Shift');
  await page.waitForFunction(()=>window.__rescueHouse.amenities().stamina>1);
  await pose(23.5,10);const ring=await page.locator('.lab-stick-ring').boundingBox(),touchX=ring.x+ring.width/2,touchY=ring.y+ring.height/2;
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touchX,y:touchY}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchX,y:touchY-ring.width*.68}]});
  await page.waitForFunction(()=>window.__rescueHouse.amenities().sprinting);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  await page.waitForFunction(()=>!window.__rescueHouse.amenities().sprinting);

  await pose(10.39,6.83,Math.PI/2,-.23);await page.keyboard.press('c');
  await page.keyboard.down('w');await page.waitForFunction(()=>window.__rescueHouse.snapshot().position.x>10.98);await page.keyboard.up('w');
  await page.keyboard.press('c');assert.equal(await page.locator('#lab-crouch').getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Esconderse',exact:true}).click();
  await page.waitForFunction(()=>window.__rescueHouse.snapshot().hideType==='understairs');await shot('escondite-escalera');
  await page.getByRole('button',{name:'Salir',exact:true}).click();await page.waitForFunction(()=>!window.__rescueHouse.snapshot().hidden);

  await use('bano');await use('switch-bano');
  await use('hide-shower');await page.waitForFunction(()=>window.__rescueHouse.snapshot().hideType==='shower');
  await page.keyboard.press('e');await page.waitForFunction(()=>!window.__rescueHouse.snapshot().hidden);
  await assert.rejects(use('bath-battery',false),/No line-of-sight/);
  await use('basin-cabinet',false);
  await page.getByRole('button',{name:'Abrir cajón',exact:true}).waitFor();
  await use('basin-cabinet');await use('bath-battery',false);await shot('lavamanos-abierto');
  await use('bath-battery');await use('bath-note');
  await page.getByRole('dialog',{name:'Papel bajo el lavamanos'}).waitFor();await close();
  await use('basin-cabinet');await use('bath-tap');
  await page.getByRole('button',{name:'Cerrar llave',exact:true}).waitFor();await use('bath-tap');
  assert(!(await snapshot()).puzzle.drawer,'The bathroom drawer does not advance the desk puzzle');

  await use('cocina');await use('switch-cocina');
  await pose(10.20,4.09,Math.PI/2,-.09);await page.keyboard.press('c');
  await page.waitForFunction(()=>window.__rescueHouse.snapshot().target==='hide-kitchen');
  await page.keyboard.press('e');await page.waitForFunction(()=>window.__rescueHouse.snapshot().hideType==='kitchen');
  await page.keyboard.press('e');await page.waitForFunction(()=>!window.__rescueHouse.snapshot().hidden);
  await assert.rejects(use('basement-hatch',false),/No line-of-sight/);
  await use('hatch-rug');await page.waitForFunction(()=>window.__rescueHouse.amenities().rug===1);
  await use('basement-hatch');assert.equal((await amenities()).hatch,0);
  await use('red-key');assert(await page.locator('[data-equip=red-key]').isVisible());
  await use('basement-hatch',false);await page.getByRole('button',{name:'Abrir candado',exact:true}).click();
  await page.waitForFunction(()=>window.__rescueHouse.amenities().hatch===1);await shot('trampilla-revelada');
  assert(await page.locator('[data-equip=red-key]').isHidden());
  await use('basement-hatch');await page.waitForFunction(()=>window.__rescueHouse.amenities().hatch===0);
  await use('hatch-rug');await page.waitForFunction(()=>window.__rescueHouse.amenities().rug===0);
  await use('kitchen-drawer');await use('pantry-note');await close();
  await use('fridge');await use('fridge-list');await page.getByRole('dialog',{name:'Lista en el refrigerador'}).waitFor();await close();
  await use('fridge');await assert.rejects(use('fridge-list',false),/No line-of-sight/);
  await use('lectura');await use('reading-cabinet');await use('reading-battery');
  await use('habitación');await use('switch-musica');await use('louis-altar',false);await shot('altar-de-louis');
  await use('picture-archive',false);await shot('poster-archivo');
  await use('louis-altar');await page.getByText(/Louis Tomlinson está en el centro/).waitFor();await close();
  await use('altar-mechon');await page.getByText(/Mechón — L. T./).waitFor();await close();
  await use('altar-registro');await page.getByText(/31\/01\/2020/).waitFor();await close();
  await use('president-dossier');await page.getByText(/Friedrich Weiss, presidente alemán/).waitFor();await close();
  assert.equal(await page.locator('#lab-canvas').evaluate(c=>c.getContext('webgl').getError()),0);
  assert.deepEqual(errors,[]);
  assert.deepEqual(posters,[200,200]);
  console.log('PASS casa 3D: tele, corriente, reloj, carrera PC/táctil, escondite, trampilla, teléfono y muebles');
 }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
