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
  if(process.env.ALTAR_QA_ONLY==='1'){
   // Open the actual door, then start at the walkable corridor threshold.
   await page.evaluate(async()=>{
    const h=window.__rescueHouse;h.clearThreatFixture();
    if(!h.snapshot().doors.find(d=>d.id==='habitación').open)await h.interactWith('habitación');
    h.setPose({x:9,y:3.15,z:3.7,yaw:Math.PI,pitch:-.45});
    h.placeEmyAtThreshold();
   });
   await page.waitForFunction(()=>{const a=window.__rescueHouse.altar();return a.fear&&a.bristle>.9&&a.earFlatten>.85;},null,{timeout:45000});
   await shot(page,'altar-01-emy-erizada');
   // Real movement through the doorway, not a teleport into the room.
   await page.keyboard.down('w');
   try{await page.waitForFunction(()=>window.__rescueHouse.snapshot().position.z<2.75,null,{timeout:30000});}
   finally{await page.keyboard.up('w');}
   await page.waitForFunction(()=>{const h=window.__rescueHouse,a=h.altar(),c=h.emy();return a.inside&&a.waiting&&a.fear&&c.z>=3&&a.pulse>.8;},null,{timeout:45000});
   const waiting=await page.evaluate(()=>window.__rescueHouse.emy());
   assert(waiting.y>3&&waiting.z>=3,'Emy waits on the correct side of the real doorway');
   // Use the same contextual selection and interaction handler as gameplay.
   await page.evaluate(()=>window.__rescueHouse.interactWith('louis-altar',false));
   await shot(page,'altar-02-interior');
   await page.evaluate(()=>window.__rescueHouse.interactWith('record-player'));
   await page.waitForFunction(()=>window.__rescueHouse.altar().recorded,null,{timeout:10000});
   assert((await page.evaluate(()=>window.__rescueHouse.altar())).recordCooldown>0);
   await shot(page,'altar-03-tocadiscos');
   await page.evaluate(()=>window.__rescueHouse.setPose({x:9,y:3.15,z:3.7,yaw:0,pitch:0}));
   await page.keyboard.down('w');
   try{await page.waitForFunction(()=>window.__rescueHouse.snapshot().position.z>6.1,null,{timeout:30000});}
   finally{await page.keyboard.up('w');}
   await page.waitForFunction(()=>{const h=window.__rescueHouse,a=h.altar(),c=h.emy(),p=h.snapshot().position;return !a.waiting&&!a.fear&&c.alarm<.15&&Math.hypot(c.x-p.x,c.z-p.z)<2.5;},null,{timeout:45000});
   await shot(page,'altar-04-emy-vuelve');
   assert.deepEqual(errors,[]);
   await page.evaluate(()=>window.closeHouse());
   console.log('PASS altar browser: real doorway, raised fur, record interaction and return to following');
   return;
  }
  const skills=()=>page.evaluate(()=>window.__rescueHouse.emySkills());
  const interactEmy=()=>page.evaluate(()=>window.__rescueHouse.interactWith('emy-upstairs'));
  await page.evaluate(()=>window.__rescueHouse.interactWith('emy-upstairs',false));
  await page.waitForFunction(()=>!document.querySelector('#house-emy-name').hidden,null,{timeout:8000});
  await shot(page,'00-emy-etiqueta-temporal');
  await page.waitForFunction(()=>document.querySelector('#house-emy-name').hidden,null,{timeout:12000});
  assert(await page.locator('#lab-interact').isEnabled(),'The name disappearing cannot disable Emy interaction');
  await interactEmy();
  assert.equal((await skills()).menu,true,'Emy contextual menu must open');
  assert.equal(await page.locator('#house-emy-menu [data-act="emy:pet"]').count(),1,'Petting action still exists');
  assert.equal(await page.locator('#house-emy-menu [data-act="emy:scan"]').count(),1);
  assert.equal(await page.locator('#house-emy-menu [data-act="emy:map"]').count(),1);
  assert.equal(await page.locator('#house-emy-menu .emy-card').count(),4);
  assert.equal(await page.locator('#house-emy-menu .emy-close').count(),1);
  const cards=await page.locator('#house-emy-menu .emy-card').evaluateAll(items=>items.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  assert(Math.abs(cards[0].y-cards[1].y)<2&&Math.abs(cards[2].y-cards[3].y)<2&&cards[2].y>cards[0].y+40,'Four Emy cards must form a compact 2x2 grid: '+JSON.stringify(cards));
  assert(Math.abs(cards[0].w-cards[3].w)<2,'All four cards have equal width');
  await shot(page,'01-emy-acciones');
  // Position the threat while gameplay is paused by the menu, but keep the
  // camera looking at Emy until the wave has actually rendered.
  await page.evaluate(()=>window.__rescueHouse.placeThreat({x:8.1,y:0,z:6.2,yaw:Math.PI}));
  await page.locator('#house-emy-menu [data-act="emy:scan"]').click();
  const afterScan=await skills();
  assert(afterScan.scan>0&&afterScan.scanCooldown>0);
  // Observe the wave from the cat-facing pose first. Stage the occluded
  // target immediately afterwards, before taking any expensive screenshots.
  await page.waitForFunction(()=>!document.querySelector('#house-emy-wave').hidden&&window.__rescueHouse.emySkills().scanRendered,null,{timeout:12000});
  const before=await page.evaluate(()=>window.__rescueHouse.scanFrame());
  await page.evaluate(()=>{
   window.__rescueHouse.placeThreat({x:8.1,y:0,z:6.2,yaw:Math.PI});
   window.__rescueHouse.setPose({x:6.2,y:0,z:6.2,yaw:Math.PI/2,pitch:0});
  });
  try{
   await page.waitForFunction(previous=>{const f=window.__rescueHouse.scanFrame();return f&&f.sequence>previous&&Math.abs(f.camera.x-6.2)<.12&&Math.abs(f.camera.z-6.2)<.12;},before.sequence,{timeout:12000});
  }catch(error){
   console.log('SCAN_RENDER_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>({scan:window.__rescueHouse.emySkills(),frame:window.__rescueHouse.scanFrame(),snapshot:window.__rescueHouse.snapshot()}))));
   throw error;
  }
  await shot(page,'02b-contorno-secuestrador-tras-pared');
  await interactEmy();
  assert(await page.locator('#house-emy-menu [data-act="emy:scan"]').isDisabled(),'Scan cooldown disables the real action');
  await page.locator('#house-emy-menu [data-act="emy:map"]').click();
  const floorPlans=page.locator('#house-emy-map .house-emy-plan');
  assert.equal(await page.locator('#house-emy-map [role="tab"]').count(),3,'Exterior and both floors have explicit tabs');
  assert.equal(await page.locator('#house-emy-map [role="tab"][aria-selected="true"]').getAttribute('id'),'house-emy-tab--1');
  const miniature=page.locator('#house-emy-miniature svg');
  assert.match(await miniature.getAttribute('aria-label'),/Exterior/);
  await shot(page,'03-emy-exterior');
  const original=await miniature.innerHTML();
  await page.locator('[data-act="emy:view:right"]').click();
  assert.notEqual(await miniature.innerHTML(),original,'Real projected geometry changes when rotated');
  await page.locator('[data-act="emy:view:plus"]').click();
  await page.locator('[data-act="emy:view:reset"]').click();
  assert.equal(await miniature.innerHTML(),original,'Reset restores original geometry');
  if(!mobile){
   const r=await miniature.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);
   await page.mouse.down();await page.mouse.move(r.x+r.width/2+45,r.y+r.height/2-24,{steps:6});await page.mouse.up();
   assert.notEqual(await miniature.innerHTML(),original,'Dragging the real SVG rotates it');
   await page.locator('[data-act="emy:view:reset"]').click();
   assert.equal(await miniature.innerHTML(),original);
  }
  if(mobile){
   const host=page.locator('#house-emy-miniature'),r=await host.boundingBox();
   assert.equal(await host.evaluate(el=>getComputedStyle(el).touchAction),'none','Map opts out of native gestures without blocking room-list scroll');
   const cx=Math.round(r.x+r.width/2),cy=Math.round(r.y+r.height/2),delta=Math.round(Math.min(42,r.width*.16));
   const view=async()=> (await skills()).miniatureView;
   const baseline=await view();
   if(engine===chromium){
    // CDP delivers genuine multi-touch input, with the browser's implicit
    // capture, pointer-capture transfer and native click synthesis.
    const session=await page.context().newCDPSession(page);
    const point=(id,x,y)=>({id,x,y,radiusX:3,radiusY:3});
    const send=(type,touchPoints)=>session.send('Input.dispatchTouchEvent',{type,touchPoints});
    try{
     await send('touchStart',[point(1,cx-delta,cy)]);
     await send('touchStart',[point(1,cx-delta,cy),point(2,cx+delta,cy)]);
     for(const factor of [1.15,1.30,1.45]){
      await send('touchMove',[point(1,cx-delta*factor,cy),point(2,cx+delta*factor,cy)]);
      await page.waitForTimeout(55);
     }
     assert((await view()).zoom>baseline.zoom*1.2,'Native two-finger spread zooms in');
     for(const factor of [1.2,.9,.7]){
      await send('touchMove',[point(1,cx-delta*factor,cy),point(2,cx+delta*factor,cy)]);
      await page.waitForTimeout(55);
     }
     assert((await view()).zoom<baseline.zoom*.95,'Native pinch zooms out during same gesture');
     await send('touchEnd',[]);
     await page.waitForFunction(()=>window.__rescueHouse.emySkills().mapPointers===0);
     await send('touchStart',[point(3,cx,cy)]);
     for(const d of [12,24,36])await send('touchMove',[point(3,cx+d,cy-d*.35)]);
     await send('touchEnd',[]);
    }finally{await session.detach();}
   }else{
    // Playwright WebKit has no CDP multitouch API. Drive its real DOM
    // pointer handlers and emulate the capture loss from the old SVG child.
    const dispatch=async(type,id,x,y,oldChild=false)=>page.evaluate(({type,id,x,y,oldChild})=>{
     const host=document.querySelector('#house-emy-miniature');
     const target=oldChild?host.querySelector('polygon')||host:host;
     target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId:id,button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y}));
    },{type,id,x,y,oldChild});
    await dispatch('pointerdown',61,cx-delta,cy,true);
    await dispatch('pointerdown',62,cx+delta,cy,true);
    await dispatch('lostpointercapture',61,cx-delta,cy,true);
    await dispatch('lostpointercapture',62,cx+delta,cy,true);
    await dispatch('pointermove',61,cx-delta*1.4,cy);
    await dispatch('pointermove',62,cx+delta*1.4,cy);
    assert((await view()).zoom>baseline.zoom*1.2,'WebKit spread survives SVG child capture loss');
    await dispatch('pointermove',61,cx-delta*.7,cy);
    await dispatch('pointermove',62,cx+delta*.7,cy);
    assert((await view()).zoom<baseline.zoom*.95,'WebKit pinch reverses smoothly');
    await dispatch('pointerup',62,cx+delta*.7,cy);
    await dispatch('pointermove',61,cx-delta*.7+36,cy-12);
    await dispatch('pointerup',61,cx-delta*.7+36,cy-12);
   }
   const turned=await view();
   assert(Math.abs(turned.yaw-baseline.yaw)>.12&&Math.abs(turned.pitch-baseline.pitch)>.03,'Single-finger drag orbits and tilts');
   assert.equal((await skills()).mapPointers,0,'All gesture pointers released');
   assert.equal((await skills()).preview,null,'Gestures never preview or send Emy');
   await page.locator('[data-act="emy:view:reset"]').click();
   assert.deepEqual(await view(),baseline,'Accessible reset restores original view');
   console.log('PASS Emy mobile map: pinch in/out, orbit and pointer cleanup ('+ (engine===chromium?'native Chromium touch':'WebKit pointer events') +')');
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('#house-emy-map [data-act="emy:floor:0"]').click();
  assert.equal(await page.locator('.mini-roof-lift').count(),1,'Actual roof is animated with normal motion');
  assert.equal(await page.locator('.mini-upper-lift').count(),1);
  await shot(page,'03-emy-cubierta-apertura');
  await page.waitForFunction(()=>{const e=document.querySelector('.mini-roof-lift');return e&&Number(getComputedStyle(e).opacity)<.05;},null,{timeout:5000});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await floorPlans.count(),1,'Use a large readable floor plan instead of two tiny plans');
  assert.equal(await page.locator('#house-emy-map .house-emy-destination-list button').count(),6);
  assert.equal(await page.locator('#house-emy-miniature polygon[data-act="emy:room:study"]').count(),1,
   'Study must be selectable on the projected floor surface');
  assert.equal(await page.locator('#house-emy-map .house-emy-destination-list [data-act="emy:room:study"]').count(),1);
  assert.equal(await page.locator('#house-emy-miniature [data-marker="kitty"]').count(),1);
  assert.equal(await page.locator('#house-emy-miniature [data-marker="emy"]').count(),1);
  if((await skills()).scan>0)assert.equal(await page.locator('#house-emy-miniature [data-marker="threat"]').count(),1);
  assert.equal(await page.locator('#house-emy-map [data-act="emy:room:bedroom"]').count(),0);
  assert(await page.locator('#house-emy-miniature [data-furniture="sofa"]').count()>0);
  assert(await page.locator('#house-emy-miniature [data-door="estudio"]').count()>0);
  await shot(page,'03-emy-planta-baja');
  const details=await page.evaluate(()=>{
   const modal=document.querySelector('#house-emy-map'),map=modal.querySelector('.house-emy-plan'),
    list=modal.querySelector('.house-emy-destination-list'),
    footer=modal.querySelector('.house-emy-map-footer'),
    first=list.querySelector('button');
   return {mapWidth:map.getBoundingClientRect().width,mapHeight:map.getBoundingClientRect().height,
    listWidth:list.getBoundingClientRect().width,roomFont:parseFloat(getComputedStyle(first.querySelector('.house-emy-destination-name')).fontSize),
    footerBottom:footer.getBoundingClientRect().bottom,viewportHeight:innerHeight,
    modalRight:modal.getBoundingClientRect().right,modalLeft:modal.getBoundingClientRect().left,viewportWidth:innerWidth,
    navY:[...modal.querySelectorAll('.emy-map-nav button')].map(el=>el.getBoundingClientRect().y),
    controlHeight:Math.min(...[...modal.querySelectorAll('.mini-tools button')].map(el=>el.getBoundingClientRect().height))};
  });
  assert(details.mapWidth>=200&&details.mapHeight>=150,
   'Map must remain large enough to tap on a landscape mobile viewport: '+JSON.stringify(details));
  assert(details.modalLeft>=0&&details.modalRight<=details.viewportWidth+1,'Map stays inside both screen edges: '+JSON.stringify(details));
  assert(Math.abs(details.navY[0]-details.navY[1])<2,'Back and close stay side by side');
  if(mobile&&details.viewportHeight>=375&&details.viewportWidth>=761)assert(details.controlHeight>=44,'Touch rail retains 44px hit targets');
  assert(details.listWidth>=190&&details.roomFont>=12&&details.footerBottom<=details.viewportHeight+1,
   'Room names and confirmation must remain legible and on-screen: '+JSON.stringify(details));
  if(mobile){
   // A real short tap on a selectable polygon still previews the room.
   // Pick an actual visible hit point rather than the polygon's bounding center,
   // which can fall behind another depth-sorted face.
   const target=await page.evaluate(()=>{
    const el=document.querySelector('#house-emy-miniature polygon[data-act="emy:room:study"]'),r=el.getBoundingClientRect();
    for(let y=r.top+2;y<r.bottom-1;y+=3)for(let x=r.left+2;x<r.right-1;x+=3){
     if(document.elementFromPoint(x,y)===el)return {x,y};
    }
    return null;
   });
   assert(target,'Study has a real touchable polygon');
   await page.evaluate(()=>{window.__mapTapTrace=[];for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture','touchstart','touchend','touchcancel','click'])document.addEventListener(type,e=>{if(window.__mapTapTrace.length<40)window.__mapTapTrace.push({type,target:e.target?.tagName,act:e.target?.closest?.('[data-act]')?.dataset.act,pointerType:e.pointerType});},{capture:true});});
    await page.touchscreen.tap(target.x,target.y);
   try{await page.waitForFunction(()=>!!window.__rescueHouse.emySkills().preview,null,{timeout:15000,polling:100});}catch(error){console.error('MAP_TAP_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>({events:window.__mapTapTrace,skills:window.__rescueHouse.emySkills(),status:document.querySelector('#house-emy-map-status')?.textContent}))));throw error;}
   assert.match(await page.locator('#house-emy-map-status').innerText(),/Estudio/i);
   assert.equal((await skills()).stage,'following','Tap previews without sending');
  }
  const stairs=page.locator('#house-emy-map .house-emy-destination-list [data-act="emy:room:stairs"]');
  await stairs.scrollIntoViewIfNeeded();
  await stairs.click();
  assert.match(await page.locator('#house-emy-map-status').innerText(),/Vestíbulo de la escalera/);
  await shot(page,'03a-emy-escalera-seleccionada');
  await page.locator('#house-emy-map .house-emy-destination-list [data-act="emy:room:study"]').click();
  assert.equal(await page.locator('#house-emy-map-send').isEnabled(),true);
  assert.match(await page.locator('#house-emy-map-status').innerText(),/Estudio.*planta baja/i);
  assert((await skills()).preview?.seconds>0);
  assert.equal((await skills()).stage,'following','Preview does not send Emy');
  assert.equal(await page.locator('#house-emy-miniature .mini-route-track').count(),1);
  assert.match(await page.locator('#house-emy-map-status').innerText(),/aprox\. \d+ s/);
  await shot(page,'03b-emy-seleccion');
  await page.locator('#house-emy-map [data-act="emy:floor:1"]').click();
  assert.equal(await floorPlans.count(),1);
  assert.equal(await page.locator('#house-emy-map [role="tab"][aria-selected="true"]').getAttribute('id'),'house-emy-tab-1');
  assert.equal(await page.locator('#house-emy-map .house-emy-destination-list button').count(),4);
  assert.equal(await page.locator('#house-emy-map [data-act="emy:room:study"]').count(),0);
  assert.equal(await page.locator('#house-emy-miniature polygon[data-act="emy:room:bedroom"]').count(),0,'Locked bedroom is not clickable on the miniature');
  assert.equal(await page.locator('#house-emy-map .house-emy-destination-list [data-act="emy:room:bedroom"]').count(),1);
  assert.equal(await page.locator('#house-emy-map .house-emy-stair-void').count(),1,
   'The upper level must distinguish the open stairwell from walkable rooms');
  assert.equal(await page.locator('#house-emy-map .house-emy-destination-list [data-act="emy:room:bedroom"]').isDisabled(),true,
   'Do not send Emy through the story-locked bedroom door');
  assert.equal(await page.locator('#house-emy-map-send').isEnabled(),true,'Switching floors preserves the destination for inspecting a cross-floor route');
  assert(await page.locator('#house-emy-miniature [data-furniture="upper-bed"]').count()>0);
  assert(await page.locator('#house-emy-miniature [data-door="dormitorio"][data-door-state="locked"]').count()>0);
  await shot(page,'03c-emy-planta-alta');
  await page.locator('#house-emy-map .house-emy-destination-list [data-act="emy:room:reading"]').click();
  assert.match(await page.locator('#house-emy-map-status').innerText(),/Sala de lectura.*planta alta/i);
  assert.equal(await page.locator('#house-emy-map-send').isEnabled(),true);
  const planned=(await skills()).preview;
  assert(planned&&planned.waypoints.some(p=>p.y<.15)&&planned.goal.y>3);
  await shot(page,'03d-emy-destino-planta-alta');
  await page.locator('#house-emy-map [data-act="emy:floor:0"]').click();
  assert.deepEqual((await skills()).preview,planned);
  assert.equal(await page.locator('#house-emy-miniature .mini-route[data-route-floor="0"]').count(),1);
  await shot(page,'03d2-emy-ruta-tramo-inferior');
  await page.locator('#house-emy-map [data-act="emy:floor:1"]').click();
  await page.locator('#house-emy-map-send').click();
  const command=await skills();
  assert.equal(command.stage,'distract','Selecting a room and confirming commands Emy navigation');
  assert(command.distractCooldown>0,'Distraction has cooldown');
  assert(command.distraction?.goal&&command.distraction.goal.y>3,'Emy must reach a real upstairs waypoint');
  assert.deepEqual(command.distraction.goal,planned.goal,'The confirmation uses exactly the previewed destination');
  assert.equal(command.mapOpen,false,'The map must close after a successful order');
  // Physical interaction with the busy cat, not a remote call button.
  await interactEmy();
  assert.equal((await skills()).menu,true,'Busy Emy can be approached in person');
  assert.equal(await page.locator('#house-emy-stay-title').innerText(),'Sígueme');
  assert(await page.locator('[data-act="emy:map"]').isDisabled());
  assert(await page.locator('[data-act="emy:scan"]').isDisabled());
  const cooldownBefore=(await skills()).distractCooldown;
  await shot(page,'03e-emy-interrumpir-en-persona');
  await page.locator('#house-emy-stay').click();
  assert.equal((await skills()).stage,'following','Physical intervention cancels the distraction');
  assert((await skills()).distractCooldown>0&&Math.abs((await skills()).distractCooldown-cooldownBefore)<1,
   'The real distraction cooldown remains after early reunion');

  // Use the real phone application while a distraction cooldown is active.
  // It must not depend on Emy being available or expose the threat marker.
  await page.locator('[data-equip="phone"]').click();
  await page.locator('#house-use-phone').click();
  await page.locator('.phone-screen [data-app="maps"]').click();
  assert((await skills()).mapReadOnly);
  await page.locator('#house-emy-map [data-act="emy:floor:0"]').click();
  assert(await page.locator('#house-emy-map-send').isHidden());
  assert.equal(await page.locator('#house-emy-map [data-act^="emy:room:"]').count(),0);
  assert.equal(await page.locator('#house-emy-miniature [data-marker="threat"]').count(),0);
  await shot(page,'03f-mapas-telefono-consulta');
  // The scan injected a live pursuer into an otherwise peaceful explore
  // fixture. End the fixture while the read-only map is still paused,
  // only after verifying its marker. A real sighting deliberately closes
  // the phone; unrelated app tests must not race that gameplay event.
  const cleared=await page.evaluate(()=>window.__rescueHouse.clearThreatFixture());
  assert.equal(cleared.active,false);
  await page.locator('#house-emy-map [data-act="emy:map:back"]').click();
  await page.locator('.phone-apps[data-home-page="0"]').waitFor();
  assert(await page.locator('.phone-screen').isVisible());
  await shot(page,'03g-iphone-inicio');
  // A horizontal gesture goes through the shell's actual pointer handlers.
  await page.locator('.phone-shell').evaluate(el=>{
   const r=el.getBoundingClientRect(),y=r.top+r.height*.55;
   el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:619,pointerType:'touch',button:0,clientX:r.right-24,clientY:y}));
   el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:619,pointerType:'touch',button:0,clientX:r.left+24,clientY:y}));
  });
  assert(await page.locator('.phone-apps[data-home-page="1"] [data-app="weather"]').isVisible());
  await shot(page,'03h-iphone-segunda-pagina');
  await page.waitForTimeout(380); // suppress the accidental click from the swipe
  await page.locator('button[data-home-page="0"]').click();
  await page.evaluate(()=>window.__rescueHouse.setPose({x:5.95,y:0,z:8,yaw:0,pitch:0}));
  const phoneStart=await page.evaluate(()=>window.__rescueHouse.snapshot().position);
  await page.keyboard.down('w');
  try{await page.waitForFunction(z=>window.__rescueHouse.snapshot().position.z>z+.07,phoneStart.z,{timeout:12000});}
  finally{await page.keyboard.up('w');}
  assert(await page.locator('.phone-screen').isVisible(),'Movement must not close the device');
  const portrait=await page.locator('.phone-shell').boundingBox();
  assert(portrait.height>portrait.width,'Home is portrait');
  await page.locator('.phone-screen [data-app="camera"]').click();
  const shell=await page.locator('.phone-shell').boundingBox();
  assert(shell.width>shell.height,'Camera opens as a landscape device');
  assert(Math.abs(shell.width-portrait.height)<2&&Math.abs(shell.height-portrait.width)<2,'Same chassis must rotate without changing aspect ratio: '+JSON.stringify({portrait,shell}));
  assert(shell.x>=0&&shell.y>=0&&shell.x+shell.width<= (await page.evaluate(()=>innerWidth))+1&&shell.y+shell.height<=(await page.evaluate(()=>innerHeight))+1,'Landscape device stays inside the viewport');
  const cameraControls=await page.locator('.phone-camera-actions').evaluate(rail=>[...rail.querySelectorAll('button')].map(button=>{const r=button.getBoundingClientRect(),p=rail.closest('.phone-shell').getBoundingClientRect();return {inside:r.left>=p.left&&r.right<=p.right&&r.top>=p.top&&r.bottom<=p.bottom,width:r.width,height:r.height};}));
  assert(cameraControls.every(c=>c.inside&&c.width>=28&&c.height>=28),'All photo controls are reachable: '+JSON.stringify(cameraControls));
  assert(await page.locator('[data-photo="flash"]').getAttribute('aria-pressed')==='true');
  await page.waitForFunction(()=>{const c=document.querySelector('.phone-camera-view canvas');if(!c)return false;return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4!==3&&v>0);});
  await shot(page,'03i-iphone-camara-horizontal');
  await page.locator('[data-photo="take"]').click();
  await page.locator('.phone-camera-actions img').waitFor();
  await page.locator('[data-photo="flash"]').click();
  assert.equal(await page.locator('[data-photo="flash"]').getAttribute('aria-pressed'),'false');
  const firstPhoto=await page.locator('.phone-camera-actions img').getAttribute('src');
  await page.locator('[data-photo="take"]').click();
  await page.waitForFunction(prior=>document.querySelector('.phone-camera-actions img')?.getAttribute('src')!==prior,firstPhoto);
  await page.locator('.phone-camera-actions [data-app="photos"]').click();
  const restored=await page.locator('.phone-shell').boundingBox();
  assert(Math.abs(restored.width-portrait.width)<2&&Math.abs(restored.height-portrait.height)<2,'Photos restores the original portrait chassis');
  await page.waitForFunction(()=>{const i=document.querySelector('[data-photo-index="0"] img');return i?.naturalWidth>0&&Math.abs(i.naturalWidth/i.naturalHeight-16/9)<.02;});
  await shot(page,'03j-iphone-galeria');
  await page.locator('.phone-home-indicator').click();
  await page.locator('[data-app="journal"]').click();
  assert(await page.locator('.phone-journal').isVisible());
  await page.locator('.phone-home-indicator').click();
  await page.locator('[data-app="messages"]').click();
  await page.locator('[data-phone-hint]').click();
  assert((await page.locator('.phone-hint p').innerText()).length>0);
  await page.locator('.phone-home-indicator').click();
  await page.locator('[data-app="music"]').click();
  await page.locator('[data-phone-music]').click();
  assert.equal(await page.locator('[data-phone-music]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-phone-music]').click();
  assert.equal(await page.locator('[data-phone-music]').getAttribute('aria-pressed'),'false');
  await page.locator('.phone-home-indicator').click();
  await page.locator('[data-app="settings"]').click();
  const difficulty=page.getByLabel('Dificultad',{exact:true});
  assert.equal(await difficulty.inputValue(),'story','Default difficulty prioritizes story');
  await difficulty.selectOption('tense');
  await page.getByLabel('Ayuda adaptable tras perder vidas',{exact:true}).uncheck();
  const difficultyPrefs=await page.evaluate(()=>({settings:JSON.parse(localStorage.getItem('valeteamo-house-camera-v4')),pursuer:window.__rescueHouse.story().pursuer}));
  assert.equal(difficultyPrefs.settings.difficulty,'tense');
  assert.equal(difficultyPrefs.settings.adaptive,false);
  assert.equal(difficultyPrefs.pursuer.difficulty,'tense');
  await difficulty.selectOption('story');
  await page.getByLabel('Ayuda adaptable tras perder vidas',{exact:true}).check();
  await page.getByLabel('Mostrar instrucciones de objetivo',{exact:true}).check();
  await page.getByLabel('Mostrar avisos del perseguidor',{exact:true}).check();
  const savedPrefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('valeteamo-house-camera-v4')));
  assert(savedPrefs.hints&&savedPrefs.threatText,'Optional HUD hints are persisted independently');
  await page.getByLabel('Vibración (si el dispositivo la admite)',{exact:true}).uncheck();
  await page.getByLabel('HUD discreto',{exact:true}).uncheck();
  const v4=await page.evaluate(()=>JSON.parse(localStorage.getItem('valeteamo-house-camera-v4')));
  assert.equal(v4.haptics,false);assert.equal(v4.immersive,false);
  await page.getByLabel('Vibración (si el dispositivo la admite)',{exact:true}).check();
  await page.getByLabel('HUD discreto',{exact:true}).check();
  await page.getByLabel('Mostrar instrucciones de objetivo',{exact:true}).uncheck();
  await page.getByLabel('Mostrar avisos del perseguidor',{exact:true}).uncheck();
  // The phone setting must work in regular gameplay, not only admin trials.
  const fpsToggle=page.getByLabel('Mostrar FPS durante el juego',{exact:true});
  assert.equal(await fpsToggle.isChecked(),false,'FPS is opt-in');
  await fpsToggle.check();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('valeteamo-house-camera-v4')).showFPS),true);
  const fpsBadge=page.locator('#house-fps');
  assert(await fpsBadge.isHidden(),'Phone settings must not display paused FPS');
  await page.locator('.phone-screen [data-app="close"]').click();
  await page.waitForFunction(()=>{const el=document.querySelector('#house-fps');return el&&!el.hidden&&/^\d+ FPS$/.test(el.textContent);},null,{timeout:30000});
  assert.equal(await fpsBadge.evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  await shot(page,'phone-fps-enabled');
  const togglePhoneSettings=require('./helpers/toggle-phone-settings.cjs');
  await togglePhoneSettings(page);
  assert(await fpsToggle.isChecked(),'FPS selection persists after reopening phone');
  assert(await fpsBadge.isHidden());
  await fpsToggle.uncheck();
  await togglePhoneSettings(page);
  assert(await fpsBadge.isHidden(),'FPS hides immediately when disabled');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('valeteamo-house-camera-v4')).showFPS),false);
  const item='noise-glass-living';
  await page.evaluate(item=>window.__rescueHouse.interactWith(item),item);
  let objects=await page.evaluate(()=>window.__rescueHouse.noiseProps());
  assert(objects.find(p=>p.id===item).held,'The glass is held after interacting');
  // V3: the permanent action button is the only throwable control.
  const actionButton=page.locator('#lab-interact');
  await page.waitForFunction(()=>document.querySelector('#lab-interact small')?.textContent==='Lanzar',null,{timeout:8000});
  assert(await actionButton.isVisible()&&await actionButton.isEnabled());
  assert.equal(await actionButton.getAttribute('data-icon'),'throw');
  assert.equal(await actionButton.locator('.house-action-icon svg').count(),1);
  assert.equal(await page.locator('#house-noise-controls').count(),0);
  await page.waitForFunction(()=>document.querySelector('[data-equip="phone"]').disabled);
  assert(await page.locator('[data-equip="phone"]').isDisabled(),'A held throwable occupies the hands');
  await shot(page,'04-objeto-en-mano');
  await actionButton.click();
  objects=await page.evaluate(()=>window.__rescueHouse.noiseProps());
  assert(!objects.find(p=>p.id===item).held,'Released throwable no longer occupies the hand');
  await page.waitForFunction(()=>!document.querySelector('[data-equip="phone"]').disabled);
  await page.waitForFunction(id=>window.__rescueHouse.noiseProps().find(p=>p.id===id)?.spent,item,{timeout:8000});
  await shot(page,'05-objeto-lanzado');
  // V2 phase 02: actual keyboard movement (also supported on mobile),
  // speed and camera continuity, plus a checkpoint teleport across floors.
  await page.evaluate(()=>window.__rescueHouse.setPose({
   x:5.95,y:0,z:8.0,yaw:0,pitch:0
  }));
  const initial=await page.evaluate(()=>window.__rescueHouse.snapshot());
  assert.equal(initial.locomotion.cameraGround,0);
  // A hop changes only the rendered camera, never the collision body or floor.
  const hopButton=page.locator('#lab-hop');
  await page.waitForFunction(()=>!document.querySelector('#lab-hop').disabled,null,{timeout:8000});
  if(mobile)await hopButton.tap();
  else {
   await page.evaluate(()=>document.activeElement?.blur());
   await page.keyboard.press('Space');
  }
  await page.waitForFunction(()=>window.__rescueHouse.snapshot().hop.age<.62,null,{timeout:8000});
  await page.waitForFunction(()=>window.__rescueHouse.snapshot().hop.age>=.62,null,{timeout:8000});
  const landed=await page.evaluate(()=>window.__rescueHouse.snapshot());
  assert.deepEqual(landed.position,initial.position,'Hop must not move the collision body');
  assert.equal(landed.hop.offset,0,'Camera settles after the hop');
  assert.equal(landed.locomotion.cameraGround,0);
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
