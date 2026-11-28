const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
(async()=>{
 const {advanceHudDrag}=await import('../src/lab/movement-input.js');
 assert(!advanceHudDrag({x:0,y:0,dragged:false},3,4));assert(advanceHudDrag({x:0,y:0,dragged:false},8,0));assert(advanceHudDrag({x:0,y:0,dragged:true},0,0));
 const server=await(await import('vite')).createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0},plugins:[{name:'touch-hud',configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url!='/__touchhud')return next();res.setHeader('Content-Type','text/html');res.end('<html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="/src/lab/lab.css"><body><button id="launch">Entrar</button><script type="module">import {launchHouse} from "/src/lab/house.js";document.querySelector("#launch").onclick=()=>{window.stopHouse=launchHouse(()=>{},"ground",{demo:true,trial:true});};</script></body></html>');});}}]});
 await server.listen();
 try{for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,args:name==='Chromium'?['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  try{
   const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
   await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__touchhud');await page.click('#launch');await page.click('[data-act=start]');
   const button=page.locator('#lab-crouch'),snap=()=>page.evaluate(()=>window.__rescueHouse.snapshot());
   await button.waitFor();await page.waitForFunction(()=>!window.__rescueHouse.snapshot().paused);
   await page.evaluate(()=>window.__rescueHouse.setPose({x:6,y:0,z:8,yaw:0,pitch:0}));
   const original=await button.getAttribute('aria-pressed');
   const coords=await page.evaluate(()=>{const center=e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};};return {stick:center(document.querySelector('.lab-stick-ring')),button:center(document.querySelector('#lab-crouch'))};});
   const {stick,button:b}=coords;
   const dispatch=(selector,type,id,x,y)=>page.evaluate(({selector,type,id,x,y})=>{document.querySelector(selector).dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y}));},{selector,type,id,x,y});
   // Both engines exercise independently identified fingers. Synthetic
   // WebKit events are not evidence of physical iPhone input.
   await dispatch('#lab-joystick','pointerdown',41,stick.x,stick.y);
   await dispatch('#lab-joystick','pointermove',41,stick.x-22,stick.y+22);
   for(let i=0;i<3;i++){
    const id=42+i,before=await snap();
    await dispatch('#lab-crouch','pointerdown',id,b.x,b.y);
    await dispatch('#lab-crouch','pointermove',id,b.x-54,b.y-30);
    const during=await snap();
    assert(during.controls.stick===41&&during.controls.look===id&&during.controls.joystick.x<0,name+' independent owners');
    assert(Math.abs(during.camera.targetYaw-before.camera.targetYaw)>.08,name+' HUD drag rotates camera');
    await dispatch('#lab-crouch','pointermove',id,b.x,b.y);
    await dispatch('#lab-crouch','pointerup',id,b.x,b.y);
    // Simulate delayed compatibility click (e.g. Safari) after a drag.
    await page.evaluate(()=>document.querySelector('#lab-crouch').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1})));
    assert.equal(await button.getAttribute('aria-pressed'),original,name+' drag must not crouch');
    assert.equal((await snap()).controls.stick,41,name+' releasing look does not release walk');
   }
   // A secondary finger's stationary tap activates exactly once while walking.
   await dispatch('#lab-crouch','pointerdown',48,b.x,b.y);
   await dispatch('#lab-crouch','pointerup',48,b.x,b.y);
   await page.waitForFunction(original=>document.querySelector('#lab-crouch').getAttribute('aria-pressed')!==original,original);
   const toggled=await button.getAttribute('aria-pressed');
   await page.evaluate(()=>document.querySelector('#lab-crouch').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1})));
   assert.equal(await button.getAttribute('aria-pressed'),toggled,name+' secondary tap exactly once');
   assert.equal((await snap()).controls.stick,41,name+' tap retains left finger');
   await dispatch('#lab-joystick','pointerup',41,stick.x,stick.y);
   // Native tap, without a preceding drag, still works.
   await button.tap();await page.waitForFunction(toggled=>document.querySelector('#lab-crouch').getAttribute('aria-pressed')!==toggled,toggled);
   assert.equal((await snap()).controls.look,null);
   // One real Chromium multitouch sequence, including native click handling.
   if(name==='Chromium'){
    const cdp=await context.newCDPSession(page);
    const touch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
    const before=await snap(),pressed=await button.getAttribute('aria-pressed');
    await touch('touchStart',[{...stick,id:1},{...b,id:2}]);
    await touch('touchMove',[{x:stick.x-22,y:stick.y+22,id:1},{x:b.x-55,y:b.y-30,id:2}]);
    const current=await snap();assert(current.controls.stick!==null&&current.controls.look!==null);
    assert(Math.abs(current.camera.targetYaw-before.camera.targetYaw)>.08);
    await touch('touchEnd',[{...b,id:2}]);await touch('touchEnd',[]);await cdp.detach();
    assert.equal(await button.getAttribute('aria-pressed'),pressed,'native drag does not activate button');
   }
   assert.deepEqual(errors,[]);await page.evaluate(()=>window.stopHouse());console.log('PASS touch HUD '+name);
  }finally{await browser.close();}
 }}finally{await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});