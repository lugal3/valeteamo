// Smoke test for the actual built site, also usable against Firebase after deploy.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const net=require('node:net');
const {chromium}=require('playwright');
(async()=>{
 let preview,browser,url=process.env.HOUSE_PREVIEW_URL;
 try{
  if(!url){
   const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));
   const port=reservation.address().port;await new Promise(r=>reservation.close(r));
   preview=await (await import('vite')).preview({configFile:false,preview:{host:'127.0.0.1',port,strictPort:true}});
   url='http://127.0.0.1:'+port+'/';
  }
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.locator('.splash-start').waitFor();await page.keyboard.press('Enter');
  await page.getByText('Feliz cumpleaños, Valentina').waitFor();
  await page.getByRole('button',{name:'Pruebas',exact:true}).click();
  await page.getByRole('button',{name:/^Casa 3D/}).click();
  await page.locator('#lab-dialog [data-act="start"]').click();
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  await page.getByRole('dialog',{name:'Pausa',exact:true}).waitFor();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.locator('#lab-camera-settings summary').click();
  await page.getByRole('checkbox',{name:'Silenciar la casa'}).check();
  await page.getByRole('button',{name:'Reiniciar casa',exact:true}).click();
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>typeof window.__rescueHouse),'undefined','DEV diagnostic hooks must be absent from production');
  assert.equal(await page.locator('.lab-hand-art,.lab-paw').count(),0);
  const gl=await page.locator('#lab-canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl');return {error:gl.getError(),width:canvas.width,height:canvas.height};});
  assert.equal(gl.error,0);assert(gl.width>0&&gl.height>0);
  const folder=path.resolve(process.env.HOUSE_QA_DIR||'docs/capturas/casa-3d');fs.mkdirSync(folder,{recursive:true});
  await page.screenshot({path:path.join(folder,process.env.HOUSE_PREVIEW_URL?'13-firebase.png':'00-compilacion-movil.png')});
  await page.locator('.lab-exit').click();await page.getByRole('heading',{name:'Elige dónde jugar',exact:true}).waitFor();
  assert.equal(await page.locator('#lab3d').count(),0);assert.deepEqual(errors,[]);
  console.log('PASS production 3D:',JSON.stringify({url,viewport:{width:844,height:390},webgl:gl,devHooksAbsent:true,errors}));
 }finally{await browser?.close();if(preview)await new Promise(r=>preview.httpServer.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
