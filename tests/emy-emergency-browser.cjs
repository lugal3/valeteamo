const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0},plugins:[{
  name:'emergency-fixture',configureServer(server){server.middlewares.use((req,res,next)=>{
   if(!req.url.startsWith('/__emergency'))return next();
   res.setHeader('Content-Type','text/html');res.end(`<!doctype html><meta charset="utf-8"><script type="module">
    import {launchHouse} from '/src/lab/house.js';
    const checkpoint=JSON.parse(localStorage.getItem('emy-easy-checkpoint'))??{version:2,stage:'rest',picked:['key','media-flashlight'],pursuit:{phase:'hunt'},lives:3,tutorials:['movement','threat','hide','stealth']};
    window.closeHouse=launchHouse(()=>{},'ground',{demo:true,fieldTutorials:true,checkpointStore:{checkpoint,save(value){localStorage.setItem('emy-easy-checkpoint',JSON.stringify(value));return true}}});
   </script>`);
  });}
 }]});
 const folder=path.resolve(process.env.EMERGENCY_QA_DIR||'artifacts/v33-emergency');
 let browser,page;
 try{
  await fs.mkdir(folder,{recursive:true});await server.listen();
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:1,reducedMotion:'reduce'});
  page.setDefaultTimeout(90000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const cdp=await page.context().newCDPSession(page);
  const shot=async name=>{const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});await fs.writeFile(path.join(folder,name+'.png'),Buffer.from(data,'base64'));};
  const url='http://127.0.0.1:'+server.httpServer.address().port+'/__emergency';
  const ready=()=>page.waitForFunction(()=>window.__rescueHouse?.story().phase==='hunt'&&!window.__rescueHouse.snapshot().paused,null,{timeout:90000,polling:250});
  const save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('emy-easy-checkpoint')));
  const choose=async value=>{await page.evaluate(value=>{const field=document.querySelector('[data-setting="difficulty"]');field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));},value);assert.equal(await page.evaluate(()=>window.__rescueHouse.story().pursuer.difficulty),value);};
  const trigger=(times=[],floor='outside')=>page.evaluate(({times,floor})=>{
   const api=window.__rescueHouse;
   if(floor==='outside'){api.setPose({x:5.65,y:0,z:12.8,yaw:2.2,pitch:0});api.placeThreat({x:6.15,y:0,z:12.38,yaw:-.8});}
   else{
    const points=floor==='ground'?[[5.9,0,8.1],[9.75,0,3.34],[3.3,0,3.6]]:[[5.74,3.15,2.4],[2.39,3.15,3.85],[6.9,3.15,10.4],[9,3.15,3.6]];
    let placed=false;
    outer:for(const [x,y,z] of points)for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
     try{api.setPose({x,y,z,yaw:angle,pitch:0});api.placeThreat({x:x+.78*Math.sin(angle),y,z:z+.78*Math.cos(angle),yaw:angle+Math.PI});placed=true;break outer;}catch(error){if(!/Unsafe pursuer test pose|Blocked test pose/.test(String(error)))throw error;}
    }
    if(!placed)throw Error('No collision-safe interior test placement for '+floor);
   }
   return api.captureFixture(times);
  },{times,floor});
  const beats=[['01-preparacion',.96],['02-salto',1.42],['03-impacto',1.83],['04-aterrizaje',2.34],['05-proteccion',3.05]];
  await page.goto(url);await ready();await choose('easy');
  for(let attempt=1;attempt<=3;attempt++){
   if(attempt===3){await page.reload();await ready();assert.equal(await page.evaluate(()=>window.__rescueHouse.story().pursuer.difficulty),'easy');}
   const floor=['outside','ground','upper'][attempt-1];
   const result=await trigger(attempt===1?beats.map(([,t])=>t):[1.83,3.05],floor);assert.deepEqual(result,{lives:3,emyRescue:true,easy:true});
   assert.equal((await save()).lives,3);assert.equal((await save()).emyRescueUsed,false);
   await page.waitForFunction(()=>!window.__rescueHouse.emergencyRescue()&&!document.querySelector('#lab3d').classList.contains('house-capture-active'),null,{polling:250,timeout:90000});
   if(attempt===1){
    // Read each real WebGL frame inside its rendering callback, not by
    // taking blocking screenshots while the live timeline continues.
    const frames=await page.evaluate(()=>window.__rescueHouse.emergencyEvidence());
    assert.equal(frames.length,beats.length,'All five cinematic beats rendered');
    for(const [i,frame] of frames.entries()){
     const [name,t]=beats[i];assert.equal(frame.target,t);assert(frame.elapsed>=t&&frame.elapsed<=t+.101,'Rendered near the authored beat');
     assert(!frame.kind.includes('occluded'),'Open exterior should show rescue');assert(frame.pose.cat.y>=0);assert(frame.lifeNoticeHidden,'Life HUD must not obstruct Emy during the shot');
     assert(frame.frame.startsWith('data:image/png;base64,'));const image=Buffer.from(frame.frame.split(',')[1],'base64');assert(image.length>100);
     await fs.writeFile(path.join(folder,name+'.png'),image);
    }
    assert(frames[1].pose.cat.airborne,'Emy leaves the ground');assert(frames[2].pose.foe.hit>.5,'Attacker recoils at impact');
    assert(!frames[3].pose.cat.airborne,'Emy lands before protecting Kitty');
    await page.waitForFunction(()=>window.__rescueHouse.story().tutorial==='lives',null,{polling:250});
    await shot('06-guia-vidas');const close=page.locator('.field-overlay:not([hidden]) [data-field-close]');
    await close.waitFor({state:'visible'});const point=await close.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(el.disabled||!el.contains(document.elementFromPoint(x,y)))throw Error('Guide close is obstructed');return {x,y};});
    await page.mouse.click(point.x,point.y);await close.waitFor({state:'hidden'});
   }
   if(attempt!==1){
    const frames=await page.evaluate(()=>window.__rescueHouse.emergencyEvidence());assert.equal(frames.length,2);
    for(const [i,frame] of frames.entries()){
     assert(!frame.kind.includes('occluded'),'Interior fixture must show Emy');assert(frame.lifeNoticeHidden);
     assert.equal(frame.visibility?.hiddenCritical,0,'Kitty or a wall must not fully cover Emy at impact/protection');
     assert.equal(frame.pose.cat.airborne,i===0);assert(frame.pose.cat.y>=(floor==='upper'?3.15:0));
     await fs.writeFile(path.join(folder,floor+'-'+(i?'proteccion':'impacto')+'.png'),Buffer.from(frame.frame.split(',')[1],'base64'));
    }
   }
   assert.equal((await save()).lives,3);assert((await save()).picked.includes('key'));assert((await save()).tutorials.includes('lives'));
   console.log('PASS easy capture '+attempt+' '+floor+' no debit, same checkpoint, Emy rescue');
  }
  await choose('normal');
  const standard=await trigger();assert.deepEqual(standard,{lives:2,emyRescue:false,easy:false});assert.equal((await save()).lives,2);
  assert.equal(await page.locator('#lab-canvas').evaluate(canvas=>canvas.getContext('webgl').getError()),0);
  assert.deepEqual(errors,[]);console.log('PASS repeat rescue, reload preference, return to original difficulty and actual WebGL');
 }catch(error){try{console.error('EMERGENCY_QA',await page?.evaluate(()=>({shot:window.__rescueHouse?.emergencyRescue(),story:window.__rescueHouse?.story()})));}catch{}throw error;}
 finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
