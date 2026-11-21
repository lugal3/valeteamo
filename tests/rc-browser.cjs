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
   res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body><button id="launch">Probar RC</button><script type="module">
    import {launchHouse} from "/src/lab/house.js";
    const checkpoint={version:1,stage:"basement",pianoSolved:true,picked:["key","media-flashlight","piano-sheet"]};
    document.querySelector("#launch").onclick=()=>window.stopHouse=launchHouse(()=>{},"ground",{
      demo:true,checkpointStore:{checkpoint,save:()=>{}},onRescue:()=>window.endingVisited=true
    });
    </script></body></html>`);
  });
 }}]});
 await server.listen();
 const folder=path.resolve(process.env.RC_QA_DIR||'docs/capturas/rc-finale');
 fs.mkdirSync(folder,{recursive:true});
 let browser,page;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});
  page.setDefaultTimeout(60000);
  const errors=[];page.on('pageerror',error=>{errors.push(error.stack||error.message);console.error('PAGE ERROR:',error.message);});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:'+port+'/__rc');
  await page.click('#launch');
  await page.waitForFunction(()=>window.__rescueHouse&&!window.__rescueHouse.snapshot().paused);
  const use=(id,activate=true)=>page.evaluate(([id,activate])=>window.__rescueHouse.interactWith(id,activate),[id,activate]);
  const rc=()=>page.evaluate(()=>window.__rescueHouse.rc());
  const story=()=>page.evaluate(()=>window.__rescueHouse.story());
  assert.equal((await story()).pursuer.active,true,'The same pursuer is already patrolling before the lure');
  const louis=()=>page.evaluate(()=>window.__rescueHouse.louis());
  const shot=async name=>{if(!process.env.RC_QA_NO_SHOTS)await page.screenshot({path:path.join(folder,name+'.png')});};

  console.log('RC browser: collectible, pink tablet, third-person camera and controls');
  await use('cocina');await use('red-key');await use('hatch-rug');
  await page.waitForFunction(()=>window.__rescueHouse.amenities().rug===1);
  await use('basement-hatch');
  await page.waitForFunction(()=>window.__rescueHouse.amenities().hatch===1);
  await page.evaluate(()=>window.__rescueHouse.setPose({x:8.55,y:0,z:2.23,yaw:0,pitch:-.17}));
  await page.keyboard.down('w');
  try{await page.waitForFunction(()=>window.__rescueHouse.snapshot().position.y<-2.8);}
  finally{await page.keyboard.up('w');}
  // View the rotated bar FROM the doorway: its broad wooden front must
  // face the player, leaving a walking lane around the north end.
  await page.evaluate(()=>window.__rescueHouse.setPose({
   x:8.35,y:0,z:2.50,yaw:Math.PI/2,pitch:-.04
  }));
  await page.locator('[data-equip="flashlight"]').click();
  await page.waitForTimeout(180);
  await shot('03a-kitchen-facing-door-before-rescue');


  // User screenshot regression: before using the rope interaction, Louis
  // must ALREADY show the approved face, not the old static captive.
  await page.evaluate(()=>window.__rescueHouse.setPose({
   x:8.55,y:-3.55,z:12.35,yaw:0,pitch:0
  }));
  // The screenshot supplied by the user has Kitty's flashlight equipped.
  // Use the same illumination rather than mistaking a dark navy shirt for a
  // missing torso while reviewing the new captive pose in the real tunnel.
  await page.locator('[data-equip="flashlight"]').click();
  await page.waitForTimeout(220);
  await shot('03b-louis-captive-photo-before-untie');
  // Restore RC selection: the remainder of this test deploys the tablet
  // through its contextual button and must not stay in flashlight mode.


  console.log('RC browser: free Louis, climb basement steps, hide behind American-style kitchen bar');
  await use('master-key');await use('rescue-louis');
  await page.waitForFunction(()=>window.__rescueHouse.louis()?.phase==='untying');
  await shot('04a-louis-untying');
  await page.waitForFunction(()=>window.__rescueHouse.louis()?.phase==='climb',null,{timeout:60000});
  await shot('04-louis-basement');
  await page.waitForFunction(()=>window.__rescueHouse.louis()?.phase==='climb'&&
   window.__rescueHouse.louis().x>11.6&&window.__rescueHouse.louis().z<1.72,
   null,{timeout:90000});
  await shot('04b-louis-walks-around-north-end');
  await page.waitForFunction(()=>window.__rescueHouse.louis()?.phase==='hide',null,{timeout:60000});
  await shot('04c-louis-squatting-behind-counter');
  await page.waitForFunction(()=>window.__rescueHouse.louis()?.phase==='hidden',null,{timeout:60000});
  const hidden=await louis();
  assert.equal(hidden.phase,'hidden');
  assert(hidden.x>11.9&&Math.abs(hidden.z-2.97)<.08,
   'Louis has moved behind center of the bar, not clipped through its side');
  assert.equal(await story().then(x=>x.phase),'rc-setup');
  await shot('05-louis-hidden-behind-front-facing-kitchen');

  await use('rc-car',false);
  await shot('00-rc-en-la-cocina');
  await use('rc-car');
  assert((await rc()).position.y===0,'Kit waits above ground in the kitchen');
  assert(await page.locator('[data-equip=rc]').isVisible(),'RC kit added to the inventory');
  await shot('01-rc-pickup');
  await page.evaluate(()=>window.__rescueHouse.setPose({x:8.55,y:-3.55,z:9.8,yaw:0,pitch:0}));
  await page.emulateMedia({reducedMotion:'no-preference'});
  // Picking up and parking the kit already selects RC; pressing its slot again would toggle it off.
  await page.locator('#house-use-phone').click();
  await page.waitForFunction(()=>{
   const {mode,elapsed}=window.__rescueHouse.rc();
   return mode==='deploying'&&elapsed>.54&&elapsed<.94&&window.__rescueHouse.snapshot().handVisible;
  });
  await shot('01b-tablet-en-las-patas');
  await page.waitForFunction(()=>window.__rescueHouse.rc().mode==='driving');
  await page.locator('#house-rc-hud').waitFor();
  await page.keyboard.press('r');
  assert.equal(await page.evaluate(()=>document.pointerLockElement),null);
  await shot('02-rc-driving');
  const initial=await rc();
  await page.keyboard.down('w');
  try{await page.waitForFunction(({x,z})=>{
   const position=window.__rescueHouse.rc().position;
   return Math.hypot(position.x-x,position.z-z)>.15;
  },initial.position);}
  finally{await page.keyboard.up('w');}
  const after=await rc();
  assert(Math.hypot(after.position.x-initial.position.x,after.position.z-initial.position.z)>.15,'Car moves through 3D world using WASD');
  await page.locator('[data-act="rc:noise"]').click();
  assert((await rc()).noise>0,'Noise button emits a timed lure');
  await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal((await rc()).mode,'parked');
  await shot('03-rc-stopped');

  console.log('RC browser: arm opened hatch trap');
  await use('basement-hatch');
  assert.equal((await rc()).trap.armed,true,'Kitchen hatch trap is armed');

  console.log('RC browser: lure active pursuer into basement and activate trap');
  // Kitty must clear the kitchen doorway before the pursuer can swing it open.
  // In the real game the player can step aside; the test deliberately verifies this.
  await page.evaluate(()=>window.__rescueHouse.setPose({x:6.1,y:0,z:8.7,yaw:Math.PI,pitch:0}));
  // Picking up and parking the kit already selects RC; pressing its slot again would toggle it off.
  await page.locator('#house-use-phone').click();
  await page.waitForFunction(()=>window.__rescueHouse.rc().mode==='driving');
  await page.evaluate(()=>window.__rescueHouse.placeRC({x:8.55,y:-3.55,z:12.4,yaw:0}));
  await page.locator('[data-act="rc:noise"]').click();
  await page.waitForFunction(()=>window.__rescueHouse.rc().pursuer.mode==='rc-chase',null,{timeout:15000});
  // The toy emits a short beep, not an infinite signal. Keep calling it every few
  // seconds while the pursuer follows the full physical path and opens real doors.
  let descended=false;
  for(let attempt=0;attempt<18;attempt++){
   const state=await rc();
   if(state.pursuer.y<-.55&&state.pursuer.z>4.35){descended=true;break;}
   assert.equal(state.mode,'driving','RC must remain controllable while luring the pursuer: '+JSON.stringify(state));
   if(attempt)await page.locator('[data-act="rc:noise"]').click({timeout:3500});
   try{
    await page.waitForFunction(()=>{
     const r=window.__rescueHouse.rc();
     return r.pursuer.y<-.55&&r.pursuer.z>4.35;
    },null,{timeout:4400});
    descended=true;break;
   }catch(error){if(error.name!=='TimeoutError')throw error;}
  }
  assert(descended,'Pursuer must physically enter the basement');
  await page.locator('[data-act="rc:trap"]').click();
  assert.equal((await story()).phase,'escape');
  assert.equal((await rc()).trap.closed,true);
  assert.equal((await louis()).phase,'follow');
  assert.equal(await page.evaluate(()=>window.__rescueHouse.emy().hidden),true);
  await shot('06-pursuer-trapped');

  console.log('RC browser: Kitty and Louis escape using the physical front door');
  assert.equal((await page.evaluate(()=>window.__rescueHouse.snapshot())).doors.find(door=>door.id==='entrada').open,false);
  await use('entrada');
  await page.evaluate(()=>window.__rescueHouse.setPose({x:5.95,y:0,z:11.30,yaw:0,pitch:0}));

  // Frame time on headless SwiftShader varies; don't release W before Kitty
  // actually crosses the exterior trigger at z>12.35.
  await page.keyboard.down('w');
  try{await page.waitForFunction(()=>['ending','safe'].includes(window.__rescueHouse.story().phase),null,{timeout:15000});}
  finally{await page.keyboard.up('w');}
  await page.waitForFunction(()=>window.__rescueHouse.emy().z>14.1,null,{timeout:30000});
  await shot('06b-gata-guia-al-jardin');
  await page.getByRole('dialog',{name:/Kitty y Louis escaparon/}).waitFor({timeout:30000});
  assert((await louis()).z>13.8,'Louis walks into the garden during the closing shot');
  await shot('07-final-cinematic');
  assert.equal((await story()).phase,'safe');
  assert.deepEqual(errors,[],'No page errors through complete RC finale');
  const gl=await page.locator('#lab-canvas').evaluate(canvas=>canvas.getContext('webgl').getError());
  assert.equal(gl,0,'No WebGL errors');
  await page.evaluate(()=>window.stopHouse());
  console.log('PASS RC browser: model/equip, placement, tablet, drive, audio lure, Kitty untying, Louis climb/hide, hatch trap, enemy basement chase, playable ending');
 }catch(e){
  try{const state=await page?.evaluate(()=>({rc:window.__rescueHouse?.rc?.(),louis:window.__rescueHouse?.louis?.(),story:window.__rescueHouse?.story?.(),snapshot:window.__rescueHouse?.snapshot?.(),modal:document.querySelector('#lab-dialog')?.innerText}));console.log('RC_QA_FAILURE',JSON.stringify(state));await page?.screenshot({path:path.join(folder,'failure.png'),timeout:7000});}catch{}
  throw e;
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
