const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const net=require('node:net'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const reserve=net.createServer();
 await new Promise(resolve=>reserve.listen(0,'127.0.0.1',resolve));
 const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port,strictPort:true},plugins:[{name:'rc-finale-harness',configureServer(s){
  s.middlewares.use((req,res,next)=>{
   if(req.url!='/__rc')return next();
   res.setHeader('Content-Type','text/html; charset=utf-8');
   res.end('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/src/lab/lab.css"></head><body><button id="launch">Probar RC</button><script type="module">import {launchHouse} from "/src/lab/house.js";document.querySelector("#launch").onclick=()=>window.stopHouse=launchHouse(()=>{},"upstairs",{demo:true,trial:true,entry:"rescue",onRescue:()=>window.endingVisited=true});</script></body></html>');
  });
 }}]});
 await server.listen();
 const folder=path.resolve(process.env.RC_QA_DIR||'docs/capturas/rc-finale');
 fs.mkdirSync(folder,{recursive:true});
 let browser,page;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:960,height:540},hasTouch:true});
  page.setDefaultTimeout(90000);
  const errors=[];page.on('pageerror',error=>{errors.push(error.stack||error.message);console.error('PAGE ERROR:',error.message);});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:'+port+'/__rc');
  await page.click('#launch');
  await page.click('[data-act=start]');
  await page.waitForFunction(()=>window.__rescueHouse&&!window.__rescueHouse.snapshot().paused);
  const use=id=>page.evaluate(id=>window.__rescueHouse.interactWith(id),id);
  const rc=()=>page.evaluate(()=>window.__rescueHouse.rc());
  const story=()=>page.evaluate(()=>window.__rescueHouse.story());
  const louis=()=>page.evaluate(()=>window.__rescueHouse.louis());
  const shot=async name=>{if(!process.env.RC_QA_NO_SHOTS)await page.screenshot({path:path.join(folder,name+'.png')});};

  console.log('RC browser: collectible, pink tablet, third-person camera and controls');
  await use('rc-car');
  assert(await page.locator('[data-equip=rc]').isVisible(),'RC kit added to the inventory');
  await shot('01-rc-pickup');
  await page.evaluate(()=>window.__rescueHouse.setPose({x:10.0,y:3.15,z:4.2,yaw:Math.PI/2,pitch:0}));
  await page.keyboard.press('6');
  await page.locator('#house-use-phone').click();
  await page.waitForFunction(()=>window.__rescueHouse.rc().mode==='driving');
  await page.locator('#house-rc-hud').waitFor();
  await shot('02-rc-driving');
  const initial=await rc();
  await page.keyboard.down('w');await page.waitForTimeout(650);await page.keyboard.up('w');
  const after=await rc();
  assert(Math.hypot(after.position.x-initial.position.x,after.position.z-initial.position.z)>.15,'Car moves through 3D world using WASD');
  await page.locator('[data-act="rc:noise"]').click();
  assert((await rc()).noise>0,'Noise button emits a timed lure');
  await page.locator('[data-act="rc:stop"]').click();
  assert.equal((await rc()).mode,'parked');
  await shot('03-rc-stopped');

  console.log('RC browser: free Louis, climb basement steps, hide behind American-style kitchen bar');
  await use('rescue-louis');
  await page.waitForFunction(()=>window.__rescueHouse.louis()?.phase==='climb');
  await shot('04-louis-basement');
  await page.waitForFunction(()=>window.__rescueHouse.louis()?.phase==='hidden',null,{timeout:50000});
  assert.equal((await louis()).phase,'hidden');
  assert.equal((await story()).phase,'rc-setup');
  await shot('05-louis-kitchen');

  console.log('RC browser: unlock hatch and arm trap');
  await use('red-key');
  await use('hatch-rug');
  await page.waitForFunction(()=>window.__rescueHouse.amenities().rug>.95);
  await use('basement-hatch');
  await page.waitForFunction(()=>window.__rescueHouse.amenities().hatch>.92);
  await use('basement-hatch');
  assert.equal((await rc()).trap.armed,true,'Kitchen hatch trap is armed');

  console.log('RC browser: lure active pursuer into basement and activate trap');
  await page.keyboard.press('6');
  await page.locator('#house-use-phone').click();
  await page.waitForFunction(()=>window.__rescueHouse.rc().mode==='driving');
  await page.evaluate(()=>window.__rescueHouse.placeRC({x:8.55,y:-3,z:7,yaw:0}));
  await page.locator('[data-act="rc:noise"]').click();
  await page.waitForFunction(()=>window.__rescueHouse.rc().pursuer.mode==='rc-chase',null,{timeout:15000});
  await page.waitForFunction(()=>{const r=window.__rescueHouse.rc();return r.pursuer.y<-.55&&r.pursuer.z>4.35;},null,{timeout:85000});
  await page.locator('[data-act="rc:trap"]').click();
  assert.equal((await story()).phase,'escape');
  assert.equal((await rc()).trap.closed,true);
  assert.equal((await louis()).phase,'follow');
  await shot('06-pursuer-trapped');

  console.log('RC browser: Kitty and Louis escape using the physical front door');
  await page.evaluate(()=>window.__rescueHouse.setPose({x:5.95,y:0,z:11.30,yaw:0,pitch:0}));
  await page.keyboard.down('w');await page.waitForTimeout(1600);await page.keyboard.up('w');
  await page.getByRole('dialog',{name:/Kitty y Louis escaparon/}).waitFor({timeout:20000});
  await shot('07-final-cinematic');
  assert.equal((await story()).phase,'safe');
  assert.deepEqual(errors,[],'No page errors through complete RC finale');
  const gl=await page.locator('#lab-canvas').evaluate(canvas=>canvas.getContext('webgl').getError());
  assert.equal(gl,0,'No WebGL errors');
  await page.evaluate(()=>window.stopHouse());
  console.log('PASS RC browser: model/equip, placement, tablet, drive, audio lure, Louis climb/hide, hatch trap, enemy basement chase, playable ending');
 }catch(e){
  try{const state=await page?.evaluate(()=>({rc:window.__rescueHouse?.rc?.(),louis:window.__rescueHouse?.louis?.(),story:window.__rescueHouse?.story?.(),snapshot:window.__rescueHouse?.snapshot?.(),modal:document.querySelector('#lab-dialog')?.innerText}));console.log('RC_QA_FAILURE',JSON.stringify(state));await page?.screenshot({path:path.join(folder,'failure.png'),timeout:7000});}catch{}
  throw e;
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
