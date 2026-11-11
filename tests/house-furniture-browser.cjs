const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const playerStub=`
 window.tvCommands=[];
 window.YT={PlayerState:{ENDED:0,PLAYING:1},Player:function(frame,{events}){
  const target=this;
  this.loadVideoById=clip=>{window.tvCommands.push(clip);events.onStateChange({data:1,target});};
  this.destroy=()=>window.tvCommands.push('destroy');
  this.mute=()=>{};
  window.endTvClip=()=>events.onStateChange({data:0,target});
  window.failTvClip=()=>events.onError({data:101,target});
  setTimeout(()=>events.onReady({target}),0);
 }};
 window.onYouTubeIframeAPIReady();`;

(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});
 await server.listen();let browser;
 try{
  browser=await chromium.launch({args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://www.youtube.com/iframe_api',route=>route.fulfill({contentType:'text/javascript',body:playerStub}));
  await page.route('https://www.youtube-nocookie.com/embed/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Test TV</title>'}));
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/');
  await page.locator('.splash-start').waitFor();await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Pruebas',exact:true}).click();
  await page.getByRole('button',{name:/^Casa 3D/}).click();
  await page.locator('[data-act=start]').click();await page.locator('[data-act=skip-intro]').click();
  const use=(id,activate=true)=>page.evaluate(([id,activate])=>window.__rescueHouse.interactWith(id,activate),[id,activate]);
  const snapshot=()=>page.evaluate(()=>window.__rescueHouse.snapshot());
  const close=()=>page.keyboard.press('Escape');
  const shot=async name=>{
   if(!process.env.HOUSE_QA_DIR)return;
   fs.mkdirSync(process.env.HOUSE_QA_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.HOUSE_QA_DIR,name+'.png')});
  };

  await use('television',false);await page.getByRole('button',{name:'Encender tele',exact:true}).click();
  const frame=page.locator('.house-tv-screen iframe');
  assert.match(await frame.getAttribute('src'),/jyCmnvBbm8Q/);
  const bounds=await frame.boundingBox();assert(bounds.width>=200&&bounds.height>=200);
  await page.waitForFunction(()=>window.tvCommands?.length===1);
  await page.evaluate(()=>window.endTvClip());
  const clip={videoId:'jyCmnvBbm8Q',startSeconds:0,endSeconds:15};
  assert.deepEqual(await page.evaluate(()=>window.tvCommands),[clip,clip]);
  await page.evaluate(()=>window.failTvClip());
  await page.getByRole('link',{name:'Abrir en YouTube'}).waitFor();
  await page.getByRole('button',{name:'Apagar tele'}).click();assert.equal(await frame.count(),0);
  assert.equal(await page.evaluate(()=>window.tvCommands.at(-1)),'destroy');

  await use('bano');await use('switch-bano');
  await assert.rejects(use('bath-battery',false),/No line-of-sight/);
  await use('basin-cabinet',false);
  await page.getByRole('button',{name:'Abrir cajón',exact:true}).waitFor();
  await use('basin-cabinet');await use('bath-battery',false);await shot('lavamanos-abierto');
  await use('bath-battery');await use('bath-note');
  await page.getByRole('dialog',{name:'Papel bajo el lavamanos'}).waitFor();await close();
  await use('basin-cabinet');await use('bath-tap');
  await page.getByRole('button',{name:'Cerrar llave',exact:true}).waitFor();await use('bath-tap');
  assert(!(await snapshot()).puzzle.drawer,'The bathroom drawer does not advance the desk puzzle');

  await use('cocina');await use('kitchen-drawer');await use('pantry-note');await close();
  await use('fridge');await use('fridge-list');await page.getByRole('dialog',{name:'Lista en el refrigerador'}).waitFor();await close();
  await use('fridge');await assert.rejects(use('fridge-list',false),/No line-of-sight/);
  await use('lectura');await use('reading-cabinet');await use('reading-battery');
  await use('habitación');await use('switch-musica');await use('louis-altar',false);await shot('altar-de-louis');
  await use('louis-altar');await page.getByText(/Louis Tomlinson está en el centro/).waitFor();await close();
  await use('president-dossier');await page.getByText(/Friedrich Weiss, presidente alemán/).waitFor();await close();
  assert.equal(await page.locator('#lab-canvas').evaluate(c=>c.getContext('webgl').getError()),0);
  assert.deepEqual(errors,[]);
  console.log('PASS casa 3D: tele en bucle, lavamanos, cajones, refrigerador y altar en pantalla táctil emulada');
 }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
