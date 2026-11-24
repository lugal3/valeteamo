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
  assert.equal(await page.locator('#house-noise-controls button').count(),2);
  await shot(page,'04-objeto-en-mano');
  await page.locator('#house-noise-controls [data-act="noise:throw"]').click();
  objects=await page.evaluate(()=>window.__rescueHouse.noiseProps());
  assert(!objects.find(p=>p.id===item).held,'Released throwable no longer occupies the hand');
  await page.waitForFunction(id=>window.__rescueHouse.noiseProps().find(p=>p.id===id)?.spent,item,{timeout:8000});
  await shot(page,'05-objeto-lanzado');
  await page.evaluate(()=>window.closeHouse());
  assert.equal(await page.locator('#lab3d').count(),0,'All UI cleans up after leaving the house');
  assert.deepEqual(errors,[],'WebGL1 and Emy actions must not throw in a mobile viewport');
  console.log('PASS Emy browser QA ('+(mobile?'mobile':'desktop')+', '+(engine===webkit?'WebKit':'Chromium')+'): menu, scan & real 3D outline, floor selector, true upstairs distraction, throw, cleanup');
  await page.context().close();
 }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
