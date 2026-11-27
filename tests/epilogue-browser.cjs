const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
const {completeChapter,waitScene,stages}=require('./helpers/epilogue-walk.cjs');
const KEY='valeteamo-rescue-v2',PROLOGUE='valeteamo-story-acts-1-2-v1';
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});
 let browser;
 try{
  await server.listen();const url='http://127.0.0.1:'+server.httpServer.address().port+'/';
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:960,height:540},reducedMotion:'reduce'});
  page.setDefaultTimeout(30000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('artifacts',{recursive:true});
  const openLP=async()=>{await page.goto(url);await page.getByRole('button',{name:'Administración'}).click();await page.getByLabel('Código de acceso').fill('LP');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.locator('.lp-swagger').waitFor();};
  const read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
  await openLP();
  // A real save belongs to a different session. Direct LP epilogue must not touch it.
  const prior={version:2,phase:'house',heart:true,abducted:true,trail:true,house:true,rescued:false};
  await page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[KEY,prior]);
  await page.getByRole('button',{name:/Exterior · Amanecer/}).click();
  await completeChapter(page,'outside','artifacts');
  await page.getByRole('button',{name:'Salir',exact:true}).click();
  await page.locator('.lp-swagger').waitFor();
  assert.deepEqual(await read(),prior,'LP trial leaves the real unsuccessful rescue unchanged');
  // Record actual load-to-ready timings (development browser, not phone FPS).
  const timings=[];
  const measure=async stage=>{const ms=await page.locator('.adventure-wrap').getAttribute('data-scene-boot-ms');assert(ms!==null&&Number.isFinite(Number(ms))&&Number(ms)>=0);timings.push({stage,readyMs:Number(ms)});};
  // Fixture is intentionally a successful 3D save, not a claim that the 3D
  // was played here. The separate checkpoint suite verifies its real callback.
  const rescued={...prior,phase:'end',rescued:true};
  await page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[KEY,rescued]);
  const resume=async()=>{await openLP();await page.getByRole('button',{name:/Volver a Feliz cumpleaños/}).click();await page.getByRole('button',{name:/Continuar el rescate/}).click();};
  await resume();await waitScene(page,'outside');
  // Persist only the mute preference; use the actual HUD, no handler shortcut.
  if(await page.getByRole('button',{name:'Silenciar sonido'}).isVisible())await page.getByRole('button',{name:'Silenciar sonido'}).click();
  await page.getByRole('button',{name:'Activar sonido'}).waitFor();
  for(const stage of stages){
   await waitScene(page,stage);await measure(stage);
   await completeChapter(page,stage,'artifacts');
   const expected=stages[stages.indexOf(stage)+1]??'complete';
   assert.equal((await read()).epilogue.stage,expected);
   if(stage==='outside'){
    await page.getByRole('button',{name:'Activar sonido'}).waitFor();
    await resume();await waitScene(page,'return-path');
    await page.getByRole('button',{name:'Activar sonido'}).waitFor();
   }
  }
  await resume();await page.locator('.garden-epilogue[data-epilogue-stage="complete"][data-picnic-live="true"]').waitFor();
  await page.waitForFunction(()=>window.__valeEpilogue?.()?.ready);
  await page.getByRole('button',{name:'Regresar al universo'}).click();
  await page.locator('canvas.cosmos-video-canvas[data-arrival-stage="explore"]').waitFor({timeout:30000});
  assert.equal((await read()).epilogue.stage,'complete');
  assert.equal(await page.getByRole('button',{name:'Ajustes de la galaxia'}).count(),0,'return is public, no QA gear');
  fs.writeFileSync('artifacts/epilogue-load-timings.json',JSON.stringify(timings,null,2));
  assert.deepEqual(errors,[]);
  console.log('PASS epilogue: actual keyboard movement, companions, dialogue, candles, letter, real PNG, resume, save isolation and return');
 }finally{await browser?.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
