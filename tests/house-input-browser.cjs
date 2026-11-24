const togglePhoneSettings=require('./helpers/toggle-phone-settings.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),net=require('node:net'),{chromium,webkit}=require('playwright');
(async()=>{
 const reserve=net.createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));
 // Optional historical module is served in memory; the working tree stays intact.
 const baseline=process.env.HOUSE_INPUT_BASELINE;assert(!baseline||/^[a-f0-9]{7,40}$/.test(baseline));
 const historical=baseline?require('node:child_process').execFileSync('git',['show',baseline+':src/lab/house.js'],{encoding:'utf8'}):null;
 const server=await(await import('vite')).createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port,strictPort:true},plugins:[{name:'input-harness',transform(code,id){if(historical&&id.replaceAll('\\','/').endsWith('/src/lab/house.js'))return {code:historical,map:null};},configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url!='/__input')return next();res.setHeader('Content-Type','text/html');res.end('<html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><link rel="stylesheet" href="/src/lab/lab.css"><body><button id="launch">Entrar</button><script type="module">import {launchHouse} from "/src/lab/house.js";document.querySelector("button").onclick=()=>{window.stopHouse=launchHouse(()=>{},"ground",{demo:true,trial:true});};</script></body></html>');});}}]});await server.listen();let browser;
 const results={},observe=!!process.env.HOUSE_INPUT_OBSERVE;
 const folder=path.resolve(process.env.HOUSE_INPUT_QA_DIR||'docs/capturas/movimiento');
 fs.mkdirSync(folder,{recursive:true});
 const expect=(name,ok,data)=>{results[name]={pass:!!ok,...data};if(!observe)assert(ok,name+': '+JSON.stringify(data));};
 try{
  const safari=process.env.HOUSE_INPUT_ENGINE==='webkit';
  browser=await (safari?webkit:chromium).launch({headless:true,args:safari?[]:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const mobile of safari?[true]:observe?[false]:[false,true]){
   const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:960,height:540},hasTouch:mobile,isMobile:mobile}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`http://127.0.0.1:${port}/__input`);await page.click('#launch');await page.click('[data-act=start]');
   const snap=()=>page.evaluate(()=>window.__rescueHouse.snapshot()),pose=()=>page.evaluate(()=>window.__rescueHouse.setPose({x:6,y:0,z:8,yaw:0,pitch:0}));await pose();const ring=await page.locator('.lab-stick-ring').boundingBox(),cx=ring.x+ring.width/2,cy=ring.y+ring.height/2;
   const advanceGame=async seconds=>{
    const end=(await snap()).animation.time+seconds;
    await page.waitForFunction(end=>window.__rescueHouse.snapshot().animation.time>=end,end);
   };
   if(!mobile){
    console.log('Input QA: physical keys and mouse releases');await page.keyboard.down('Shift');await page.keyboard.down('A');await page.keyboard.down('S');await page.waitForTimeout(140);await page.keyboard.up('Shift');await page.keyboard.up('a');await page.keyboard.up('s');await advanceGame(.52);let before=(await snap()).position;await advanceGame(.25);let after=(await snap()).position;let drift=Math.hypot(after.x-before.x,after.z-before.z);expect('pcShiftRelease',drift<.02,{drift});await pose();
    await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx-24,cy+24);let owned=(await snap()).controls.stick;await page.locator('#lab-joystick').dispatchEvent('pointermove',{pointerId:owned,pointerType:'mouse',buttons:0,clientX:cx-24,clientY:cy+24});let controls=(await snap()).controls;expect('pcMissedMouseUp',controls.stick===null&&controls.joystick.x===0&&controls.joystick.z===0,{controls});await page.mouse.up();await pose();
    await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx-24,cy+24);owned=(await snap()).controls.stick;await page.evaluate(id=>window.dispatchEvent(new PointerEvent('pointerup',{pointerId:id,pointerType:'mouse',button:0,buttons:0})),owned);controls=(await snap()).controls;expect('pcReleaseOutsideControl',controls.stick===null&&controls.joystick.x===0&&controls.joystick.z===0,{controls});await page.mouse.up();await pose();
    await page.mouse.move(cx,cy);await page.mouse.down({button:'right'});controls=(await snap()).controls;expect('pcRightButtonIgnored',controls.stick===null,{controls});await page.mouse.up({button:'right'});await page.keyboard.press('Escape');if(await page.locator('#lab-dialog [data-act=resume]').isVisible())await page.locator('#lab-dialog [data-act=resume]').click();await pose();
   }else if(!safari){
    console.log('Input QA: two fingers, partial release and interrupted touch');const cdp=await context.newCDPSession(page),look={x:700,y:200,id:2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1},look]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-24,y:cy+24,id:1},{...look,x:720}]});let controls=(await snap()).controls;expect('mobileTwoOwners',controls.stick!==null&&controls.look!==null&&controls.joystick.x<0&&controls.joystick.z>0,{controls});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:cx-24,y:cy+24,id:1}]});controls=(await snap()).controls;expect('mobileLiftWalkingFinger',controls.stick===null&&controls.look!==null&&controls.joystick.x===0&&controls.joystick.z===0,{controls});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pose();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1},look]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-24,y:cy+24,id:1},look]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[look]});controls=(await snap()).controls;expect('mobileLiftLookingFinger',controls.stick!==null&&controls.look===null&&controls.joystick.x<0&&controls.joystick.z>0,{controls});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await pose();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1},look]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-24,y:cy+24,id:1},look]});await page.evaluate(()=>{const look=document.querySelector('#lab-look');window.dispatchEvent(new TouchEvent('touchend',{touches:[new Touch({identifier:2,target:look,clientX:700,clientY:200})]}));});controls=(await snap()).controls;expect('mobileMissingPointerEnd',controls.stick===null&&controls.look!==null&&controls.joystick.x===0&&controls.joystick.z===0,{controls});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await pose();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1},look]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-24,y:cy+24,id:1},look]});const walkOwner=(await snap()).controls.stick;await page.evaluate(id=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:id,pointerType:'touch'})),walkOwner);controls=(await snap()).controls;expect('mobileCancelOutsideControl',controls.stick===null&&controls.look!==null,{controls});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await pose();
   }
   await page.keyboard.down('a');await page.keyboard.down('s');await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));});await page.keyboard.up('a');await page.keyboard.up('s');let controls=(await snap()).controls;expect((mobile?'mobile':'pc')+'FocusReset',controls.stick===null&&controls.look===null&&controls.joystick.x===0&&controls.joystick.z===0,{controls});
   await pose();await page.keyboard.down('w');await advanceGame(.22);let moved=(await snap()).position;expect((mobile?'mobile':'pc')+'CanMoveAfterRelease',Math.hypot(moved.x-6,moved.z-8)>.03,{moved});await page.evaluate(()=>{window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('pageshow'));});await page.keyboard.up('w');await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',code:'KeyW',repeat:true})));await advanceGame(.18);let before=(await snap()).position;await advanceGame(.18);let after=(await snap()).position;expect((mobile?'mobile':'pc')+'NeutralAfterPageResume',Math.hypot(after.x-before.x,after.z-before.z)<.02,{before,after});await page.keyboard.up('w');
   const aim=async id=>{
    await page.evaluate(id=>window.__rescueHouse.interactWith(id,false),id);
    await page.waitForFunction(id=>window.__rescueHouse.snapshot().target===id,id);
   };
   const shot=async(name)=>{
    if(!process.env.HOUSE_INPUT_QA_DIR||observe)return;
    if(safari){await page.screenshot({path:path.join(folder,name+'.png')});return;}
    const capture=await context.newCDPSession(page);
    const {data}=await capture.send('Page.captureScreenshot',{format:'png',fromSurface:true});
    await capture.detach();
    fs.writeFileSync(path.join(folder,name+'.png'),Buffer.from(data,'base64'));
   };
   if(!mobile){
    await page.evaluate(()=>window.__rescueHouse.interactWith('switch-estudio'));
    await page.waitForTimeout(300);
    await aim('drawer');await shot('pc-interaccion');await page.locator('#lab-interact').focus();await page.keyboard.press('Space');
    const opened=await page.waitForFunction(()=>window.__rescueHouse.snapshot().drawer.state==='open',null,{timeout:4000}).then(()=>true,()=>false);
    expect('pcSpaceActivatesFocusedButton',opened,{opened});
    await aim('note-hall');await page.mouse.move(480,250);await page.keyboard.press('r');
    const locked=await page.waitForFunction(()=>document.pointerLockElement?.id==='lab-canvas',null,{timeout:5000}).then(()=>true,()=>false);
    expect('pcNativePointerLock',locked,{locked});
    if(locked){
     // Move while captured, then re-aim at the note for a real canvas click.
     const yaw=(await snap()).camera.targetYaw;
     await page.evaluate(()=>{
      window.__v2MouseDeltas=[];
      window.__v2YawTimeline=[];
      document.addEventListener('mousemove',e=>{
       if(window.__v2MouseDeltas.length<30)window.__v2MouseDeltas.push({
        deltaX:e.movementX,deltaY:e.movementY,locked:!!document.pointerLockElement
       });
      },{capture:true});
      // Registered after the actual game's mousemove handler. It records
      // transient yaw changes even when headless Chromium emits matching
      // positive and negative deltas within a single mouse.move() call.
      document.addEventListener('mousemove',()=>{
       if(window.__v2YawTimeline.length<40)
        window.__v2YawTimeline.push(window.__rescueHouse.snapshot().camera.targetYaw);
      });
     });
     // Native pointer lock may coalesce a single hop under headless Chromium;
     // send multiple real mouse events before asserting rotation.
     await page.mouse.move(515,250,{steps:5});
     await page.mouse.move(542,261,{steps:5});
     const movedLook=await page.waitForFunction(yaw=>
      Math.abs(window.__rescueHouse.snapshot().camera.targetYaw-yaw)>.02||
      (window.__v2YawTimeline||[]).some(angle=>Math.abs(angle-yaw)>.02),yaw,{timeout:4000}).then(()=>true,()=>false);
     if(!movedLook)console.error('CAPTURED_LOOK_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>({
      deltas:window.__v2MouseDeltas,yaws:window.__v2YawTimeline,locked:document.pointerLockElement?.id,
      classes:document.querySelector('#lab3d')?.className,snapshot:window.__rescueHouse.snapshot()
     }))));
     expect('pcCapturedMouseLook',movedLook,{movedLook});
     await aim('note-hall');await page.mouse.down();await page.mouse.up();
     const openedNote=await page.locator('#lab-dialog [role=dialog]').waitFor({timeout:4000}).then(()=>true,()=>false);
     const cursorFree=await page.evaluate(()=>document.pointerLockElement===null);
     expect('pcCapturedClickOpensNoteAndFreesCursor',openedNote&&cursorFree,{openedNote,cursorFree});
     if(openedNote){
      await shot('pc-nota-cursor-libre');await page.keyboard.press('Escape');
      await page.keyboard.press('r');
      await page.waitForFunction(()=>document.pointerLockElement?.id==='lab-canvas');
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>document.pointerLockElement===null&&!window.__rescueHouse.snapshot().paused);
     }
     else await page.keyboard.press('r');
    }
   }else{
    await page.setViewportSize({width:390,height:844});
    await page.locator('#lab-turn').waitFor();
    const pausedAt=(await snap()).position;
    assert((await snap()).paused);
    await page.keyboard.down('w');await page.waitForTimeout(200);await page.keyboard.up('w');
    assert.deepEqual((await snap()).position,pausedAt);
    await page.setViewportSize({width:844,height:390});
    await page.waitForFunction(()=>!window.__rescueHouse.snapshot().paused);
    await page.evaluate(()=>window.__rescueHouse.interactWith('switch-estudio'));
    await page.waitForTimeout(300);
    await aim('drawer');await shot('movil-interaccion');await page.locator('#lab-interact').tap();
    await page.waitForFunction(()=>window.__rescueHouse.snapshot().drawer.state==='open');
   }
   if(!observe){
    await togglePhoneSettings(page);
    await page.getByLabel('Reducir movimiento',{exact:true}).check();
    await page.getByLabel('Subtítulos de sonidos',{exact:true}).uncheck();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#lab-camera-settings').getAttribute('open'),null);
    assert.deepEqual(await page.evaluate(()=>{
     const {motion,captions}=JSON.parse(localStorage.getItem('valeteamo-house-camera-v4'));
     return {motion,captions};
    }),{motion:true,captions:false});
   }
   if(safari){
    await page.locator('#lab-crouch').tap();
    const running=await page.waitForFunction(()=>window.__rescueHouse.snapshot().music.timer,null,{timeout:5000}).then(()=>true,()=>false);
    results.webkitAudioRunning={pass:running,state:(await snap()).sound??'unavailable'};
   }else if(!observe){
    await page.waitForFunction(()=>window.__rescueHouse.snapshot().music.timer);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    assert.equal((await snap()).music.timer,false,'Blur stops the audio schedule');
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(()=>window.__rescueHouse.snapshot().music.timer);
   }
   const gl=await page.locator('#lab-canvas').evaluate(c=>c.getContext('webgl').getError());expect((mobile?'mobile':'pc')+'NoRuntimeErrors',gl===0&&!errors.length,{gl,errors});await page.evaluate(()=>window.stopHouse());await context.close();
  }
  fs.writeFileSync(path.join(folder,observe?'antes.json':'despues.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));if(!observe)console.log('PASS input browser: desktop click and keyboard, cursor release, touch and orientation');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
