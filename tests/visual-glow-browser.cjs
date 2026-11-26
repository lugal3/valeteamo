// Real rendered visual comparison: legacy main glow vs V2 soft cue CSS.
// Both images show the SAME current 3D scene; only the marker stylesheet changes.
// This is not a screenshot of an older gameplay build.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const ORIGINAL_GLOW=`
#lab3d .house-interest{width:64px;height:64px;border:2px solid #a6ffdc;
 color:#e8fff4;text-shadow:0 0 9px #2bffbd,0 0 3px #0f3d34;
 box-shadow:inset 0 0 19px #30ffb75a,0 0 6px #a0ffdf,0 0 23px #55eac380;
 background:radial-gradient(circle,#4bffc021 0%,#4bffc00b 50%,transparent 72%);
}
#lab3d .house-interest i{font:normal 800 25px Georgia,serif}
#lab3d .house-interest span{font:800 10px/1.2 system-ui;padding:3px 7px;background:#1c3a35e8}
#lab3d .house-interest[data-focused="false"] span{display:block}
#lab3d .house-vent-screw-glow{width:24px;height:24px;border:2px solid #b9ffe7;
 background:radial-gradient(circle,#d5ffed77,transparent 72%);
 box-shadow:0 0 10px #9bffdc,0 0 17px #46cfad99;
 color:#fff7da;font:800 19px Georgia,serif}
#lab3d .torch-silhouette{filter:drop-shadow(0 0 3px #a6e9ff)}
#lab3d .house-emy-wave{border:3px solid rgba(119,255,222,.89);
 box-shadow:0 0 16px rgba(103,255,212,.5),inset 0 0 13px rgba(103,255,212,.21)}
`;
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0},plugins:[{
  name:'v2-glow-qa',configureServer(inst){
   inst.middlewares.use((req,res,next)=>{
    if(req.url!=='/__v2-glow')return next();
    res.setHeader('Content-Type','text/html;charset=utf-8');
    res.end('<!doctype html><html lang="es"><meta charset="utf-8">'+
     '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+
     '<body><script type="module">import {launchHouse} from "/src/lab/house.js";'+
     'window.closeHouse=launchHouse(()=>{},"ground",{demo:true,checkpointStore:{checkpoint:'+
     '{version:2,stage:"explore",picked:["screwdriver"],ventOpen:false,drawer:true},'+
     'save(){}}});</script></body></html>');
   });
  }
 }]});
 let browser;
 const dir=path.resolve(process.env.V2_GLOW_QA_DIR||'artifacts/v2-glow');
 fs.mkdirSync(dir,{recursive:true});
 try{
  await server.listen();
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  page.setDefaultTimeout(25000);
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__v2-glow');
  await page.waitForFunction(()=>!!window.__rescueHouse&&document.querySelector('#lab-canvas')?.width>300);
  if(await page.locator('#lab-dialog [data-act=start]').isVisible())await page.locator('#lab-dialog [data-act=start]').click();
  await page.waitForFunction(()=>!window.__rescueHouse.snapshot().paused);
  // Reach the real study vent without teleporting through solid furniture.
  await page.evaluate(()=>window.__rescueHouse.interactWith('emy-vent',false));
  await page.waitForFunction(()=>[...document.querySelectorAll('.house-vent-screw-glow')].some(n=>!n.hidden),null,{timeout:12000});
  const scene=()=>page.evaluate(()=>({
   target:window.__rescueHouse.snapshot().target,
   screws:[...document.querySelectorAll('.house-vent-screw-glow')].filter(n=>!n.hidden).length,
   markerWidth:getComputedStyle(document.querySelector('.house-vent-screw-glow')).width,
   interestWidth:getComputedStyle(document.querySelector('#house-interest')).width
  }));
  const old=await page.addStyleTag({content:ORIGINAL_GLOW});
  await page.screenshot({path:path.join(dir,'antes-estilo-main.png')});
  const before=await scene();
  await old.evaluate(e=>e.remove());
  await page.screenshot({path:path.join(dir,'despues-estilo-v2.png')});
  const after=await scene();
  assert.equal(before.markerWidth,'24px');assert.equal(after.markerWidth,'11px');
  assert.equal(before.interestWidth,'64px');assert.equal(after.interestWidth,'28px');
  assert(after.screws>=1);
  fs.writeFileSync(path.join(dir,'comparison.json'),JSON.stringify({before,after,notes:'Same V2 scene, legacy main CSS injected only for the before screenshot'},null,2));
  // Exercise seasonal objects through the real interaction raycast and game loop.
  const use=id=>page.evaluate(id=>window.__rescueHouse.interactWith(id),id);
  const holiday=()=>page.evaluate(()=>window.__rescueHouse.holiday());
  // Same walkable camera pose for both states: show the entire tree and
  // gifts rather than staring down at the switch. Inspect real rendered pixels.
  const treeView=async()=>{
   await page.evaluate(()=>{
    const x=5.65,z=2.8,y=3.15,dx=6.75-x,dz=.875-z;
    window.__rescueHouse.setPose({x,y,z,yaw:Math.atan2(dx,dz),pitch:Math.atan2(1.13-1.63,Math.hypot(dx,dz))});
   });
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  };
  const treeShot=async name=>{
   await treeView();
   const png=await page.screenshot({path:path.join(dir,name+'.png')});
   return page.evaluate(async data=>{
    const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();
    const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
    const {data:pixels}=ctx.getImageData(Math.floor(img.width*.37),Math.floor(img.height*.22),Math.floor(img.width*.26),Math.floor(img.height*.56));
    let total=0,bright=0;
    for(let i=0;i<pixels.length;i+=4){
     const l=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];total+=l;if(l>75)bright++;
    }
    return {luminance:total/(pixels.length/4),brightPixels:bright};
   },png.toString('base64'));
  };
  await use('holiday-tree-switch');assert.equal((await holiday()).powered,false);
  const treeOff=await treeShot('arbol-apagado');
  await use('holiday-tree-switch');assert.equal((await holiday()).powered,true);
  const treeOn=await treeShot('arbol-encendido');
  assert(treeOn.luminance>treeOff.luminance+.5,'Powered tree must visibly illuminate its own foliage: '+JSON.stringify({treeOff,treeOn}));
  fs.writeFileSync(path.join(dir,'tree-comparison.json'),JSON.stringify({treeOff,treeOn,notes:'Same camera, real WebGL screenshot, central tree region'},null,2));
  await use('house-power');assert.equal((await holiday()).powered,false);
  await use('house-power');assert.equal((await holiday()).powered,true);
  await use('plush-gift');
  await page.waitForFunction(()=>window.__rescueHouse.holiday().giftOpened);
  assert.deepEqual((await holiday()).plushes,['plush-gift']);
  await page.locator('#house-plush-toast').waitFor();
  await page.screenshot({path:path.join(dir,'regalo-1-de-3.png')});
  await use('plush-stairs');assert.equal((await holiday()).plushes.length,2);
  await use('plush-altar');assert.equal((await holiday()).plushes.length,3);
  await page.screenshot({path:path.join(dir,'coleccion-3-de-3.png')});
  assert.equal(await page.locator('#lab-canvas').evaluate(c=>c.getContext('webgl').getError()),0);
  console.log('PASS V2 glow comparison: real WebGL1 study, before/after marker widths, unobstructed scene',JSON.stringify({before,after}));
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
