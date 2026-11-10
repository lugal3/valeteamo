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
  let rootCache=null;
  if(process.env.HOUSE_PREVIEW_URL){const response=await context.request.head(new URL('/',url).href);rootCache=response.headers()['cache-control'];assert(rootCache?.includes('no-cache'),'Firebase root HTML must revalidate after deployments');}
  await page.goto(url);await page.locator('.splash-start').waitFor();await page.keyboard.press('Enter');
  await page.getByText('Feliz cumpleaños, Valentina').waitFor();
  await page.getByRole('button',{name:'Pruebas',exact:true}).click();
  await page.getByRole('button',{name:/^Casa 3D/}).click();
  await page.locator('#lab-dialog [data-act="start"]').click();
  const dock=await page.locator('.house-hotbar').boundingBox();
  assert(dock&&dock.width<70&&dock.height>dock.width,'Published HUD must be the compact lateral version');
  await page.getByRole('button',{name:'Agacharse',exact:true}).click();
  await page.getByRole('button',{name:'Levantarse',exact:true}).waitFor();
  await page.getByRole('button',{name:'Levantarse',exact:true}).click();
  await page.locator('#lab-camera-settings summary').click();
  await page.getByRole('button',{name:'Editar controles / hotbar',exact:true}).click();
  await page.getByRole('dialog',{name:'Editar controles',exact:true}).waitFor();
  await page.locator('[data-layout="done"]').first().click();
  await page.keyboard.press('3');await page.locator('.phone-expand').click();
  const phone=await page.locator('.phone-shell').boundingBox();
  assert(phone&&phone.width<300&&phone.height<390,'Published phone must have its own frame over the game');
  await page.keyboard.press('Escape');await page.keyboard.press('2');
  await page.locator('[data-act="mirror"]').click();
  await page.getByRole('button',{name:'Elegir emote',exact:true}).click();
  await page.locator('[data-act="emote:gangnam"]').click();
  await page.waitForFunction(()=>document.querySelector('#lab-toast')?.textContent.includes('Gangnam'));
  await page.waitForTimeout(400);
  const folder=path.resolve(process.env.HOUSE_QA_DIR||'docs/capturas/casa-3d');fs.mkdirSync(folder,{recursive:true});
  await page.screenshot({path:path.join(folder,process.env.HOUSE_PREVIEW_URL?'14-emote-firebase.png':'01-emote-compilado.png')});
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
  await page.screenshot({path:path.join(folder,process.env.HOUSE_PREVIEW_URL?'13-firebase.png':'00-compilacion-movil.png')});
  await page.locator('.lab-exit').click();await page.getByRole('heading',{name:'Elige dónde jugar',exact:true}).waitFor();
  assert.equal(await page.locator('#lab3d').count(),0);assert.deepEqual(errors,[]);
  const result={url,rootCache,viewport:{width:844,height:390},webgl:gl,devHooksAbsent:true,features:{lateralHotbar:true,crouch:true,hudEditor:true,phoneFrame:true,emote:true},dock,phone,errors};
  fs.writeFileSync(path.join(folder,process.env.HOUSE_PREVIEW_URL?'navegador-firebase.json':'navegador-compilado.json'),JSON.stringify(result,null,2));
  console.log('PASS production 3D:',JSON.stringify(result));
 }finally{await browser?.close();if(preview)await new Promise(r=>preview.httpServer.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
