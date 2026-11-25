// Browser QA for Emy menus, two-floor plan, and real throwable objects.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({
  configFile:false,logLevel:'silent',
  server:{host:'127.0.0.1',port:0},
  plugins:[{name:'emy-skill-fixture',configureServer(instance){
   instance.middlewares.use((request,response,next)=>{
    if(request.url!=='/__emy-ability-qa')return next();
    response.setHeader('Content-Type','text/html;charset=utf-8');
    response.end('<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"></head>'+
      '<body><script type="module">'+
      'import {launchHouse} from "/src/lab/house.js";'+
      'window.closeHouse=launchHouse(()=>{},"ground",{demo:true,checkpointStore:{'+
      'checkpoint:{version:2,stage:"explore",picked:[],ventOpen:false,powered:true,'+
      'emy:{stage:"following",x:5.1,y:0,z:10.65,yaw:3.14159}},'+
      'save(value){window.__lastEmySave=value;}}});'+
      '</script></body></html>');
   });
  }}]
 });
 let browser;
 const output=process.env.EMY_QA_DIR;
 async function shot(page,name){if(output){await fs.mkdir(output,{recursive:true});await page.screenshot({path:path.join(output,name+'.png')});}}
 try{
  await server.listen();
  const engine=process.env.EMY_QA_ENGINE==='webkit'?webkit:chromium;
  const mobile=process.env.EMY_QA_VIEWPORT!=='desktop';
  browser=await engine.launch({headless:true,args:engine===chromium?
   ['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  const page=await browser.newPage(mobile?
   {viewport:{width:844,height:390},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:1}:
   {viewport:{width:1280,height:720},isMobile:false,hasTouch:false,reducedMotion:'reduce',deviceScaleFactor:1});
  page.setDefaultTimeout(35000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.stack||error.message));
  page.on('console',entry=>{if(entry.type()==='error'&&/shader|webgl/i.test(entry.text()))errors.push(entry.text());});
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__emy-ability-qa');
  try{
   await page.waitForFunction(()=>!!window.__rescueHouse&&document.querySelector('#lab-canvas')?.width>300,null,{timeout:14000});
  }catch(error){
   const state=await page.evaluate(()=>({
    title:document.title,body:document.body.innerText.slice(0,1200),
    canvas:document.querySelector('#lab-canvas')?.width??null,
    root:document.querySelector('#lab3d')?.innerHTML.slice(0,500)??null,
    hasHarness:!!window.__rescueHouse,url:location.href
   }));
   console.error('EMY_BOOT_DIAGNOSTIC',JSON.stringify({state,errors}));
   await shot(page,'00-boot-failure');throw error;
  }
  if(await page.locator('#lab-dialog [data-act="start"]').isVisible())await page.locator('#lab-dialog [data-act="start"]').click();
  await page.waitForFunction(()=>window.__rescueHouse.snapshot().paused===false);
  await page.waitForFunction(()=>window.__rescueHouse?.userAudio?.().ready,null,{timeout:20000});
  const userAudio=await page.evaluate(()=>window.__rescueHouse.userAudio());
  assert(userAudio.duration>40,'The real nine-effect user audio sprite must decode in the browser');
  assert(['opus','mp3'].includes(userAudio.codec),'Browser must select Opus or compatible MP3');
  assert.deepEqual(userAudio.errors,[],'Fallback must not report unresolved user audio errors');
  const skills=()=>page.evaluate(()=>window.__rescueHouse.emySkills());
  const interactEmy=()=>page.evaluate(()=>window.__rescueHouse.interactWith('emy-upstairs'));
  await interactEmy();
  assert.equal((await skills()).menu,true,'Emy contextual menu must open');
  assert.equal(await page.locator('#house-emy-menu [data-act="emy:pet"]').count(),1,'Petting action still exists');
  assert.equal(await page.locator('#house-emy-menu [data-act="emy:scan"]').count(),1);
  assert.equal(await page.locator('#house-emy-menu [data-act="emy:map"]').count(),1);
  await shot(page,'01-emy-acciones');
  await page.locator('#house-emy-menu [data-act="emy:scan"]').click();
  const afterScan=await skills();
  assert(afterScan.scan>0&&afterScan.scanCooldown>0);
  await page.waitForFunction(()=>!document.querySelector('#house-emy-wave').hidden,{timeout:6000});
  await shot(page,'02-emy-escaneo-onda');
  // The exact animated 3D model must render behind the opaque bathroom wall,
  // not a 2D "last-known-position" marker.
  await page.evaluate(()=>{
   window.__rescueHouse.placeThreat({x:8.1,y:0,z:6.2,yaw:Math.PI});
   window.__rescueHouse.setPose({x:6.2,y:0,z:6.2,yaw:Math.PI/2,pitch:0});
  });
  await page.waitForFunction(()=>window.__rescueHouse.emySkills().scanRendered,null,{timeout:7000});
  await shot(page,'02b-contorno-secuestrador-tras-pared');
  await interactEmy();
  await page.locator('#house-emy-menu [data-act="emy:map"]').click();
  const floorPlans=page.locator('#house-emy-map .house-emy-plan');
  assert.equal(await page.locator('#house-emy-map [role="tab"]').count(),2,'Both floors must always have explicit tabs');
  assert.equal(await floorPlans.count(),1,'Use a large readable floor plan instead of two tiny plans');
  assert.equal(await page.locator('#house-emy-map .house-emy-destination-list button').count(),6);
  assert.equal(await page.locator('#house-emy-map [data-act="emy:room:study"]').count(),2,
   'Study must be selectable on the map and from a full-name destination list');
  assert.equal(await page.locator('#house-emy-map [data-act="emy:room:bedroom"]').count(),0);
  await shot(page,'03-emy-planta-baja');
  const details=await page.evaluate(()=>{
   const modal=document.querySelector('#house-emy-map'),map=modal.querySelector('.house-emy-plan'),
    list=modal.querySelector('.house-emy-destination-list'),
    footer=modal.querySelector('.house-emy-map-footer'),
    first=list.querySelector('button');
   return {mapWidth:map.getBoundingClientRect().width,mapHeight:map.getBoundingClientRect().height,
    listWidth:list.getBoundingClientRect().width,roomFont:parseFloat(getComputedStyle(first.querySelector('.house-emy-destination-name')).fontSize),
    footerBottom:footer.getBoundingClientRect().bottom,viewportHeight:innerHeight};
  });
  assert(details.mapWidth>=200&&details.mapHeight>=150,
   'Map must remain large enough to tap on a landscape mobile viewport: '+JSON.stringify(details));
  assert(details.listWidth>=190&&details.roomFont>=12&&details.footerBottom<=details.viewportHeight+1,
   'Room names and confirmation must remain legible and on-screen: '+JSON.stringify(details));
  const stairs=page.locator('#house-emy-map .house-emy-destination-list [data-act="emy:room:stairs"]');
  await stairs.scrollIntoViewIfNeeded();
  await stairs.click();
  assert.match(await page.locator('#house-emy-map-status').innerText(),/Vestíbulo de la escalera/);
  await shot(page,'03a-emy-escalera-seleccionada');
  await page.locator('#house-emy-map .house-emy-destination-list [data-act="emy:room:study"]').click();
  assert.equal(await page.locator('#house-emy-map-send').isEnabled(),true);
  assert.match(await page.locator('#house-emy-map-status').innerText(),/Estudio.*planta baja/i);
  await shot(page,'03b-emy-seleccion');
  await page.locator('#house-emy-map [data-act="emy:floor:1"]').click();
  assert.equal(await floorPlans.count(),1);
  assert.equal(await page.locator('#house-emy-map [role="tab"][aria-selected="true"]').getAttribute('id'),'house-emy-tab-1');
  assert.equal(await page.locator('#house-emy-map .house-emy-destination-list button').count(),4);
  assert.equal(await page.locator('#house-emy-map [data-act="emy:room:study"]').count(),0);
  assert.equal(await page.locator('#house-emy-map [data-act="emy:room:bedroom"]').count(),2);
  assert.equal(await page.locator('#house-emy-map .house-emy-stair-void').count(),1,
   'The upper level must distinguish the open stairwell from walkable rooms');
  assert.equal(await page.locator('#house-emy-map .house-emy-destination-list [data-act="emy:room:bedroom"]').isDisabled(),true,
   'Do not send Emy through the story-locked bedroom door');
  assert.equal(await page.locator('#house-emy-map-send').isDisabled(),true,'Switching floors clears the old selection');
  await shot(page,'03c-emy-planta-alta');
  await page.locator('#house-emy-map .house-emy-destination-list [data-act="emy:room:reading"]').click();
  assert.match(await page.locator('#house-emy-map-status').innerText(),/Sala de lectura.*planta alta/i);
  assert.equal(await page.locator('#house-emy-map-send').isEnabled(),true);
  await shot(page,'03d-emy-destino-planta-alta');
  await page.locator('#house-emy-map-send').click();
  const command=await skills();
  assert.equal(command.stage,'distract','Selecting a room and confirming commands Emy navigation');
  assert(command.distractCooldown>0,'Distraction has cooldown');
  assert(command.distraction?.goal&&command.distraction.goal.y>3,'Emy must reach a real upstairs waypoint');
  assert.equal(command.mapOpen,false,'The map must close after a successful order');
  const item='noise-glass-living';
  await page.evaluate(item=>window.__rescueHouse.interactWith(item),item);
  let objects=await page.evaluate(()=>window.__rescueHouse.noiseProps());
  assert(objects.find(p=>p.id===item).held,'The glass is held after interacting');
  // V3: the permanent action button is the only throwable control.
  const actionButton=page.locator('#lab-interact');
  await page.waitForFunction(()=>document.querySelector('#lab-interact small')?.textContent==='Lanzar',null,{timeout:8000});
  assert(await actionButton.isVisible()&&await actionButton.isEnabled());
  assert.equal(await page.locator('#house-noise-controls').count(),0);
  await shot(page,'04-objeto-en-mano');
  await actionButton.click();
  objects=await page.evaluate(()=>window.__rescueHouse.noiseProps());
  assert(!objects.find(p=>p.id===item).held,'Released throwable no longer occupies the hand');
  await page.waitForFunction(id=>window.__rescueHouse.noiseProps().find(p=>p.id===id)?.spent,item,{timeout:8000});
  await shot(page,'05-objeto-lanzado');
  // V2 phase 02: actual keyboard movement (also supported on mobile),
  // speed and camera continuity, plus a checkpoint teleport across floors.
  await page.evaluate(()=>window.__rescueHouse.setPose({
   x:5.95,y:0,z:8.0,yaw:0,pitch:0
  }));
  const initial=await page.evaluate(()=>window.__rescueHouse.snapshot());
  assert.equal(initial.locomotion.cameraGround,0);
  await page.keyboard.down('w');
  let moving;
  try{
   // Software WebGL1 may render only one frame in 320ms on CI desktop.
   // Measure actual simulated progress, not a fixed wall-clock wait.
   await page.waitForFunction(z=>window.__rescueHouse.snapshot().position.z>z+.05,
    initial.position.z,{timeout:12000});
   moving=await page.evaluate(()=>window.__rescueHouse.snapshot());
  }finally{await page.keyboard.up('w');}
  assert(moving.position.z>initial.position.z+.05,
   'Keyboard movement advances Kitty in an unobstructed corridor');
  assert(moving.locomotion.speed>2&&moving.locomotion.speed<=4.28,
   'Walking retains the bounded, smoothly blended speed model');
  // Software WebGL can render only one frame in 350 ms. Observe actual
  // converged input state instead of assuming a fixed wall-clock cadence.
  await page.waitForFunction(()=>{
   const v=window.__rescueHouse?.snapshot()?.locomotion;
   return v&&Math.hypot(v.forward,v.side)<.03;
  },null,{timeout:8000});
  const stopped=await page.evaluate(()=>window.__rescueHouse.snapshot());
  assert(Math.hypot(stopped.locomotion.forward,stopped.locomotion.side)<.03,
   'After enough rendered frames, releasing controls brakes to rest without drift');
  if(mobile){
   // Dispatch a real PointerEvent through the joystick's actual handlers.
   // The left stick has a deadzone, analog range and a sprint threshold;
   // verify hysteresis and release state without changing player coordinates.
   const dragged=await page.evaluate(()=>{
    const control=document.querySelector('#lab-joystick');
    const r=control.querySelector('.lab-stick-ring').getBoundingClientRect();
    const x=r.left+r.width/2,y=r.top+r.height/2;
    const send=(type,clientX,buttons)=>control.dispatchEvent(new PointerEvent(type,{
     bubbles:true,cancelable:true,pointerId:713,pointerType:'touch',isPrimary:true,
     button:0,buttons,clientX,clientY:y
    }));
    send('pointerdown',x,1);
    send('pointermove',x+r.width*.58,1);
    return window.__rescueHouse.snapshot().controls.joystick;
   });
   assert(dragged.x>.8&&dragged.sprint===true,
    'A purposeful iPhone thumb extension should activate analogue movement and sprint');
   await page.evaluate(()=>document.querySelector('#lab-joystick').dispatchEvent(
    new PointerEvent('pointerup',{bubbles:true,pointerId:713,pointerType:'touch',button:0,buttons:0})));
   const released=await page.evaluate(()=>window.__rescueHouse.snapshot().controls.joystick);
   assert.equal(released.sprint,false,'Lift finger cancels sprint immediately');
   assert.equal(released.x,0,'Lift finger cancels joystick translation');
  }
  await page.evaluate(()=>window.__rescueHouse.setPose({
   x:2.3,y:3.15,z:3.85,yaw:0,pitch:0
  }));
  const upstairs=await page.evaluate(()=>window.__rescueHouse.snapshot());
  assert.equal(upstairs.locomotion.cameraGround,3.15,
   'Changing floor resets visual ground height, not a camera clipping tween');
  assert(Math.abs(upstairs.view.y-upstairs.position.y-1.63)<.06,
   'Upstairs view stays above the actual floor at the correct head height');
  await shot(page,'06-kitty-movimiento-planta-alta');
  await page.evaluate(()=>window.closeHouse());
  assert.equal(await page.locator('#lab3d').count(),0,'All UI cleans up after leaving the house');
  assert.deepEqual(errors,[],'WebGL1 and Emy actions must not throw in a mobile viewport');
  console.log('PASS Emy browser QA ('+(mobile?'mobile':'desktop')+', '+(engine===webkit?'WebKit':'Chromium')+'): menu, scan & real 3D outline, floor selector, true upstairs distraction, throw, cleanup');
  await page.context().close();
 }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
