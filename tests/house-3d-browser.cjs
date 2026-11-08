// House-only regressions. CDP sends two real browser touch contacts; pose setup
// is DEV-only and is never used during the measured movement/rotation interval.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const net=require('node:net');
const {chromium}=require('playwright');
async function main(){
 const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));
 const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port,strictPort:true},logLevel:'silent'});
 await server.listen();const url='http://127.0.0.1:'+port+'/';
 const folder=path.resolve(process.env.HOUSE_QA_DIR||'docs/capturas/casa-3d');fs.mkdirSync(folder,{recursive:true});
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:960,height:540},hasTouch:true,isMobile:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.stack||e.message));
  page.on('console',m=>{if(m.type()==='error'&&/shader|WebGL|uniform/i.test(m.text()))errors.push(m.text());});
  await page.addInitScript(()=>{
   const Base=window.AudioContext;window.__houseContexts=[];
   window.AudioContext=class extends Base{constructor(...args){super(...args);window.__houseContexts.push(this);}};
  });
  const snap=()=>page.evaluate(()=>window.__rescueHouse.snapshot());
  const pose=async p=>{await page.evaluate(p=>window.__rescueHouse.setPose(p),p);await page.waitForTimeout(180);};
  const screenshot=name=>page.screenshot({path:path.join(folder,name+'.png')});
  await page.goto(url);
  const protectedSaves=await page.evaluate(()=>{
   const story=JSON.stringify({version:1,index:0,unlocked:0,character:'louis',muted:true,started:true,answers:{}});
   const rescue=JSON.stringify({version:2,phase:'trail',heart:true,abducted:true,trail:true,house:false,rescued:false});
   localStorage.setItem('valeteamo-story-v1',story);localStorage.setItem('valeteamo-rescue-v2',rescue);
   return {story,rescue};
  });
  await page.reload();await page.locator('.splash-start').waitFor();await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Pruebas',exact:true}).click();
  await page.getByRole('button',{name:/^Casa 3D/}).click();await page.locator('.splash-start').waitFor();await page.keyboard.press('Enter');
  await page.locator('#lab-dialog [data-act="start"]').click();
  await page.waitForFunction(()=>window.__rescueHouse&&!window.__rescueHouse.snapshot().paused);
  assert.equal(await page.locator('#lab3d .lab-hand-art,#lab3d .lab-paw').count(),0,'Only the real 3D hand is mounted');
  await screenshot('01-casa');

  console.log('3D: simultaneous browser touch movement and look');
  await pose({x:5.95,y:0,z:8.65,yaw:Math.PI,pitch:0});
  const rect=await page.locator('#lab-joystick .lab-stick-ring').boundingBox(),cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
  const before=await snap(),cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1},{x:690,y:260,id:2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx+15,y:cy-36,id:1},{x:790,y:260,id:2}]});
  await page.waitForTimeout(550);const two=await snap();
  assert(two.controls.look!==null&&two.controls.stick!==null,'Independent pointer capture for both fingers');
  const distance=Math.hypot(two.position.x-before.position.x,two.position.z-before.position.z);
  assert(distance>.12,'Joystick moves while looking: '+distance);assert(two.camera.yaw>before.camera.yaw+.1,'Right touch turns right');
  // Opening a modal while fingers remain down must cancel both controls.
  await page.keyboard.press('i');await page.getByRole('dialog',{name:'Mi mochila'}).waitFor();
  const paused=await snap();assert.equal(paused.controls.look,null);assert.equal(paused.controls.stick,null);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(350);assert.deepEqual((await snap()).position,paused.position);
  await screenshot('02-mochila');await page.keyboard.press('Escape');
  await page.waitForTimeout(400);const settled=await snap();
  assert.deepEqual(settled.position,paused.position,'Closing a modal does not resume old joystick input');
  assert(Math.abs(settled.camera.yaw-paused.camera.yaw)<.001,'No residual look after a modal');

  console.log('3D: rotation, focus, persistent settings and reset');
  await pose({x:5.95,y:0,z:8.65,yaw:Math.PI,pitch:0});
  await page.keyboard.down('w');await page.waitForTimeout(180);
  await page.setViewportSize({width:390,height:844});await page.locator('#lab-turn').waitFor({state:'visible'});
  const portrait=await snap();await page.keyboard.up('w');
  await page.setViewportSize({width:960,height:540});await page.waitForTimeout(400);
  assert.deepEqual((await snap()).position,portrait.position,'Rotation clears movement instead of replaying it');
  await page.keyboard.down('w');await page.waitForTimeout(120);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const blur=await snap();
  await page.keyboard.up('w');await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForTimeout(300);
  assert.deepEqual((await snap()).position,blur.position,'Focus recovery clears held keys');
  await page.locator('#lab-camera-settings summary').click();
  const sensitivity=page.locator('#lab-camera-settings [data-setting="sensitivity"]');
  await sensitivity.evaluate(el=>{el.value='1.25';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#lab-camera-settings [data-setting="invertX"]').check();
  await page.locator('#lab-camera-settings [data-setting="mute"]').check();
  await screenshot('03-ajustes');
  const settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('valeteamo-house-camera-v3')));
  assert.deepEqual(settings,{sensitivity:1.25,invertX:true});
  await page.locator('#lab-camera-settings [data-setting="invertX"]').uncheck();
  await page.locator('#lab-camera-settings [data-act="reset"]').click();
  assert.deepEqual((await snap()).position,{x:5.95,y:0,z:8.65});
  assert.equal((await snap()).cinematic,false);assert.equal((await snap()).paused,false);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.__rescueHouse.snapshot().reduceBob);
  assert((await snap()).reduceBob,'Reduced motion disables camera and hand sway');
  await page.emulateMedia({reducedMotion:'no-preference'});

  console.log('3D: occluded picking and doors');
  await pose({x:8.05,y:0,z:4.9,yaw:-Math.PI/2,pitch:Math.atan2(-.76,2.1)});
  assert.notEqual((await snap()).target,'note-hall','A nearby note across the partition is not a valid target');
  const notes=(await snap()).notes;await page.keyboard.press('e');assert.equal((await snap()).notes,notes);
  await pose({x:5.87,y:0,z:9.06,yaw:0,pitch:0});
  await page.waitForFunction(()=>window.__rescueHouse.snapshot().doors.find(d=>d.id==='entrada').open);
  await page.waitForTimeout(300);await page.keyboard.press('e');await page.waitForTimeout(450);
  assert.equal((await snap()).doors.find(d=>d.id==='entrada').open,false,'A manually closed door stays closed nearby');
  await page.keyboard.press('e');await page.waitForTimeout(300);
  await pose({x:5.87,y:0,z:9.76,yaw:0,pitch:0});await page.keyboard.press('e');
  assert((await snap()).doors.find(d=>d.id==='entrada').open,'Closing cannot trap the body inside the door');
  await pose({x:11.2,y:0,z:7.4,yaw:Math.atan2(.2,-2.35),pitch:-.12});
  await screenshot('04-vegetacion');

  // Use existing objects without changing the puzzle graph or the normal save.
  await page.evaluate(()=>window.__rescueHouse.interactWith('note-hall'));
  await page.getByRole('dialog',{name:'Nota doblada'}).waitFor();await screenshot('05-interaccion');
  await page.keyboard.press('Escape');
  await page.evaluate(()=>window.__rescueHouse.interactWith('drawer'));
  await page.evaluate(()=>window.__rescueHouse.interactWith('key'));
  await page.evaluate(()=>window.__rescueHouse.interactWith('drawer')); // close
  await page.evaluate(()=>window.__rescueHouse.interactWith('drawer')); // reopen
  await assert.rejects(page.evaluate(()=>window.__rescueHouse.interactWith('key')),/Not available/,'Opening an empty drawer never respawns the key');
  await page.locator('.lab-exit').click();await page.locator('#lab3d').waitFor({state:'detached'});
  await page.waitForFunction(()=>window.__houseContexts.every(c=>c.state==='closed'));

  console.log('3D: complete window shot, reduced-motion landing and repeated teardown');
  const launch=()=>page.evaluate(async()=>{const {launchHouse}=await import('/src/lab/house.js');window.__qaStop=launchHouse(()=>{},'ground',{demo:true});});
  await launch();await page.locator('#lab-window-intro:not(.lab-hidden)').waitFor();
  await screenshot('06-ventana');
  await page.waitForFunction(()=>!window.__rescueHouse.snapshot().cinematic,{timeout:25000});
  const landing=await snap();assert.deepEqual(landing.position,{x:10.2,y:0,z:9.38});
  assert(Math.abs(landing.camera.pitch+.045)<.001);
  await page.waitForTimeout(1800);const metrics=await snap();await screenshot('07-aterrizaje');
  await page.evaluate(()=>window.__qaStop());
  await page.emulateMedia({reducedMotion:'reduce'});await launch();
  assert.equal((await snap()).cinematic,false);assert.deepEqual((await snap()).position,landing.position);
  await page.evaluate(()=>window.__qaStop());await page.waitForFunction(()=>window.__houseContexts.every(c=>c.state==='closed'));
  assert.equal(await page.locator('#lab3d').count(),0);
  assert.deepEqual(await page.evaluate(()=>({story:localStorage.getItem('valeteamo-story-v1'),rescue:localStorage.getItem('valeteamo-rescue-v2')})),protectedSaves);
  assert.deepEqual(errors,[],'No JavaScript/shader errors');
  const result={browser:browser.version(),viewport:{width:960,height:540},renderer:'ANGLE / SwiftShader software GPU',simultaneousTouchDistanceMetres:distance,cameraTurnRadians:two.camera.yaw-before.camera.yaw,observedFps:metrics.fps,quality:metrics.quality,geometry:metrics.geometry,closedAudioContexts:await page.evaluate(()=>window.__houseContexts.filter(c=>c.state==='closed').length),protectedSavesUnchanged:true,errors};
  fs.writeFileSync(path.join(folder,'resultados.json'),JSON.stringify(result,null,2)+'\n');
  console.log('PASS house 3D:',JSON.stringify(result));
 }finally{await browser?.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
