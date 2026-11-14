const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0,strictPort:true},logLevel:'silent'});
 let browser;
 try{
  await server.listen();
  const port=server.httpServer.address().port;
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  fs.mkdirSync('artifacts',{recursive:true});
  await page.goto('http://127.0.0.1:'+port+'/');
  await page.getByRole('button',{name:'Administración'}).click();
  await page.getByLabel('Código de acceso').fill('LP');
  await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();
  await page.getByRole('button',{name:'Presiona cualquier botón para iniciar'}).click();
  await page.getByRole('button',{name:'Pruebas',exact:true}).click();
  await page.getByRole('button',{name:/Contador y colores/}).click();
  await page.getByRole('heading',{name:/Hay momentos que/}).waitFor();
  await page.screenshot({path:'artifacts/cosmos-contador-iphone.png'});
  await page.getByRole('button',{name:/Simular desbloqueo/}).click();
  await page.getByRole('heading',{name:/Hay algo/}).waitFor();
  await page.getByRole('button',{name:/Toca para abrir/}).click();
  await page.getByRole('heading',{name:/Una Galaxia de/}).waitFor({timeout:10000});
  assert.equal(await page.locator('.cosmos-preview-controls,.cosmos-bottomline,.cosmos-decor-side,.cosmos-topbar').count(),0,'no old bottom or side bars in LP anywhere');
  await page.screenshot({path:'artifacts/video-reference-intro.png'});
  await page.getByRole('button',{name:/ENTRAR A NUESTRO UNIVERSO/}).click();
  const cinematicCanvas=page.locator('canvas.cosmos-video-canvas');
  await cinematicCanvas.waitFor();
  assert.equal(await page.getByText('Encendiendo nuestro universo').count(),0,'no loading card');
  assert.equal(await page.locator('.video-reference-loading-inner').count(),0,'full screen');
  await cinematicCanvas.evaluate(el=>{el.dataset.qaPersistent='yes';});
  const cinematicFrames=[
   [.42,'01-approach'],[.85,'02-radial-flight'],[1.20,'03-vortex-climax'],
   [1.54,'04-nucleus'],[1.92,'05-disk-unfold'],[2.35,'06-stardust-fountain'],
   [2.82,'07-heart-forms'],[3.58,'08-heart-complete'],[4.29,'09-orbit-reveal']
  ];
  for(const [second,slug] of cinematicFrames){
   await page.waitForFunction(threshold=>{
    const el=document.querySelector('canvas.cosmos-video-canvas');
    return Number(el?.getAttribute('data-cinematic-seconds')||0)>=threshold;
   },second,{timeout:16000});
   await page.screenshot({path:'artifacts/cinematic-'+slug+'.png'});
  }
  await page.screenshot({path:'artifacts/galaxy-arrival-1-tunnel.png'});
  await page.screenshot({path:'artifacts/galaxy-arrival-2-unfold.png'});
  await page.screenshot({path:'artifacts/galaxy-arrival-3-heart-rise.png'});
  await page.getByRole('button',{name:'Ajustes de la galaxia'}).waitFor({timeout:20000});
  await page.locator('canvas.cosmos-video-canvas[data-arrival-stage="explore"]').waitFor({timeout:20000});
  assert.equal(await cinematicCanvas.getAttribute('data-qa-persistent'),'yes','loading-to-galaxy must preserve the same canvas/camera');
  assert.equal(await page.locator('main.cosmos-galaxy button:visible').count(),1,'only the tiny gear is visible over the galaxy');
  await page.waitForTimeout(350);
  await page.screenshot({path:'artifacts/cosmos-galaxia-iphone.png'});

  const zoomBefore=Number(await cinematicCanvas.getAttribute('data-zoom-target'));
  await page.mouse.move(190,470);
  await page.mouse.wheel(0,-440);
  await page.waitForTimeout(180);
  const zoomAfterWheel=Number(await cinematicCanvas.getAttribute('data-zoom-target'));
  assert(zoomAfterWheel>zoomBefore,'mouse wheel zooms into the galaxy');
  await cinematicCanvas.evaluate(el=>{
   const rect=el.getBoundingClientRect();
   const fire=(type,id,x,y)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerType:'touch',pointerId:id,isPrimary:id===901,clientX:rect.left+x,clientY:rect.top+y}));
   fire('pointerdown',901,135,460);fire('pointerdown',902,225,460);
   fire('pointermove',901,97,460);fire('pointermove',902,263,460);
   fire('pointerup',901,97,460);fire('pointerup',902,263,460);
  });
  await page.waitForTimeout(180);
  const zoomAfterPinch=Number(await cinematicCanvas.getAttribute('data-zoom-target'));
  assert(zoomAfterPinch>zoomAfterWheel,'two-finger pinch expands the zoom');
  // The actual glowing heart, not the gear, must accept a tap.
  const heartCenter=await cinematicCanvas.evaluate(el=>({x:Number(el.dataset.heartX),y:Number(el.dataset.heartY)}));
  assert(Number.isFinite(heartCenter.x)&&Number.isFinite(heartCenter.y),'visible heart has a hit target');
  await page.mouse.click(heartCenter.x,heartCenter.y);
  await page.getByRole('dialog',{name:/Comenzamos nuestra aventura/}).waitFor();
  await page.getByRole('button',{name:'Seguir explorando'}).click();
  await page.getByRole('button',{name:'Ajustes de la galaxia'}).click();
  await page.getByRole('button',{name:/Amor de mi Vida/}).click();
  await page.getByRole('heading',{name:/Amor de mi Vida/}).waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({path:'artifacts/cosmos-recuerdo-iphone.png'});
  await page.getByRole('button',{name:/Abrir nuestra carta/}).click();
  await page.getByRole('button',{name:/Abrir sobre de carta/}).click();
  await page.getByText(/Aquí irá una carta/).waitFor();
  await page.getByRole('button',{name:/Volver a la galaxia/}).click();
  await page.getByRole('button',{name:'Ajustes de la galaxia'}).click();
  await page.getByRole('button',{name:/Continuar la historia/}).click();
  await page.getByRole('heading',{name:/A veces, hasta las estrellas/}).waitFor();
  await page.getByRole('button',{name:/Seguir la luz/}).click();
  await page.getByRole('heading',{name:/Y esto es solo/}).waitFor();
  await page.getByRole('button',{name:/Volver al panel de pruebas/}).click();
  await page.getByRole('heading',{name:'Pruebas'}).waitFor();
  await page.getByRole('button',{name:/Galaxia rosa del video/}).click();
  await page.locator('canvas.cosmos-video-canvas[data-arrival-stage="explore"]').waitFor({timeout:20000});
  await page.setViewportSize({width:932,height:430});
  await page.screenshot({path:'artifacts/cosmos-galaxia-horizontal.png'});
  // Verify that the new heart menu really opens the ORIGINAL Phaser 2D entry.
  await page.getByRole('button',{name:'Ajustes de la galaxia'}).click();
  await page.getByRole('button',{name:/Abrir corazón/}).click();
  await page.getByRole('dialog',{name:/Comenzamos nuestra aventura/}).waitFor();
  await page.getByRole('button',{name:/Comenzar juego 2D/}).click();
  await page.getByRole('heading',{name:/El jardín/}).waitFor({timeout:12000});
  assert.deepEqual(errors,[],'Sin errores JavaScript');
  await context.close();
  console.log('PASS: iPhone LP, contador, regalo, galaxia, recuerdo, carta, misterio, final y horizontal.');
 }finally{await browser?.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
