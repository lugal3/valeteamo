const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const server=await(await import('vite')).createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0},plugins:[{name:'gamepad-harness',configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url!='/__gamepad')return next();res.setHeader('Content-Type','text/html');res.end('<html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body><button id="launch">Entrar</button><script type="module">import {launchHouse} from "/src/lab/house.js";document.querySelector("#launch").onclick=()=>{window.stopHouse=launchHouse(()=>{},"ground",{demo:true,trial:true});};</script></body></html>');});}}]});
 await server.listen();let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.testPad={id:'QA Standard Controller',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.testPad]});
  });
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__gamepad');
  await page.click('#launch');await page.click('[data-act=start]');
  await page.waitForFunction(()=>!window.__rescueHouse.snapshot().paused);
  await page.evaluate(()=>window.__rescueHouse.setPose({x:6,y:0,z:8,yaw:0,pitch:0}));
  const press=async i=>{
   await page.evaluate(i=>{window.testPad.buttons[i]={pressed:true,value:1};},i);
   await page.waitForTimeout(200);
   await page.evaluate(i=>{window.testPad.buttons[i]={pressed:false,value:0};},i);
   await page.waitForTimeout(200);
  };
  await page.waitForTimeout(250);
  // A real game poll consumes the synthetic standard pad, not a DOM click.
  await press(8);
  await page.waitForFunction(()=>document.querySelector('#lab3d').dataset.inputMode==='gamepad'&&!!document.querySelector('#lab-dialog [data-pad-selected=true]'));
  assert((await page.evaluate(()=>window.__rescueHouse.snapshot())).paused);
  await press(1);
  await page.waitForFunction(()=>!window.__rescueHouse.snapshot().paused);
  const strip=await page.evaluate(()=>{const e=document.querySelector('#lab-focus'),r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,text:e.textContent};});
  assert(strip.text&&strip.top>innerHeightFallback()*.65&&strip.bottom<=390&&strip.height<60,'compact bottom strip '+JSON.stringify(strip));
  function innerHeightFallback(){return 390;}
  await press(5);
  await page.waitForFunction(()=>window.__rescueHouse.story().equipment==='phone');
  await press(3);
  await page.waitForFunction(()=>window.__rescueHouse.story().phoneOpen&&!!document.querySelector('.phone-screen main [data-pad-selected=true]'));
  const first=await page.evaluate(()=>document.activeElement.getAttribute('data-app'));
  await page.evaluate(()=>{window.testPad.axes[0]=.95;});
  await page.waitForTimeout(200);
  await page.evaluate(()=>{window.testPad.axes[0]=0;});
  await page.waitForTimeout(200);
  const after=await page.evaluate(()=>document.activeElement.getAttribute('data-app'));
  assert(first&&after&&first!==after,'phone stick changes visual selection');
  await press(1);
  await page.waitForFunction(()=>!window.__rescueHouse.story().phoneOpen);
  // Verify spatial focus, disabled buttons, repeat timing, and restoration
  // after a real DOM reconstruction independently of frame/render timing.
  const results=await page.evaluate(async()=>{
   const {createHouseMenu}=await import('/src/lab/gamepad-menu.js');
   const menu=createHouseMenu(),scope=document.createElement('section');document.body.append(scope);
   scope.style.cssText='position:fixed;top:20px;left:20px;z-index:9999;display:grid;grid-template-columns:100px 100px;gap:10px';
   const html='<button data-act="a">A</button><button data-act="b">B</button><button data-act="c">C</button><button data-act="d" disabled>D</button>';
   scope.innerHTML=html;
   const neutral={moveX:0,moveY:0,pressed:Array(17).fill(false),buttons:Array(17).fill(false)};
   const pad=(i)=>({...neutral,pressed:neutral.pressed.map((v,j)=>j===i)});
   const active=()=>document.activeElement.dataset.act;
   try{
    menu.step(scope,neutral,{now:0});const initial=active()==='a';
    menu.step(scope,pad(15),{now:1});const right=active()==='b';
    scope.innerHTML=html;menu.step(scope,neutral,{now:2});const restored=active()==='b';
    menu.step(scope,{...neutral,moveX:-.9},{now:3});const left=active()==='a';
    menu.step(scope,neutral,{now:4});
    menu.step(scope,pad(13),{now:5});const down=active()==='c';
    let count=0;scope.querySelector('[data-act=c]').onclick=()=>count++;
    menu.step(scope,pad(0),{now:6});const activated=count===1;
    menu.clear();const cleared=!scope.querySelector('[data-pad-selected]');
    return {initial,right,restored,left,down,activated,cleared};
   }finally{scope.remove();}
  });
  assert(Object.values(results).every(Boolean),JSON.stringify(results));
  assert.deepEqual(errors,[]);
  await page.evaluate(()=>window.stopHouse());console.log('PASS gamepad HUD, inventory, phone, spatial focus and redraw');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
