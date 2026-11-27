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
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1,recordVideo:{dir:'artifacts',size:{width:844,height:390}}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  fs.mkdirSync('artifacts',{recursive:true});
  await page.goto('http://127.0.0.1:'+port+'/');
  await page.getByRole('button',{name:'Administración'}).click();
  await page.getByLabel('Código de acceso').fill('LP');
  await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();
  const menu=page.locator('.lp-swagger[data-admin-panel="lp"]');
  await menu.waitFor();
  assert.equal(await menu.locator('.lp-tag').count(),5,'five operational groups');
  await page.screenshot({path:'artifacts/lp-swagger-horizontal.png'});
  await menu.getByRole('button',{name:'Contraer',exact:true}).click();
  assert.equal(await menu.locator('.lp-endpoint:visible').count(),0);
  await menu.getByRole('button',{name:'Expandir',exact:true}).click();
  await menu.getByLabel('Filtrar checkpoints').fill('alimentacion');
  await menu.getByRole('button',{name:/Emy · Alimentación/}).waitFor();
  await menu.getByLabel('Filtrar checkpoints').fill('ocho diseños');
  await menu.getByRole('button',{name:/Ocho diseños diarios/}).click();
  const styles=page.getByRole('navigation',{name:'Elegir diseño diario'});
  assert.equal(await styles.getByRole('button').count(),8);
  const dailyKeys=()=>page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('valeteamo-daily-v1:')).sort());
  const dailyBefore=await dailyKeys();
  await styles.getByRole('button',{name:'27 NOV'}).click();
  await page.getByRole('button',{name:/Toca las flores/}).click();
  await page.locator('.ed-flower.hit').waitFor();
  await styles.getByRole('button',{name:'28 NOV'}).click();
  await page.getByRole('button',{name:/Conecta las estrellas/}).click();
  assert((await page.locator('.ed-art polyline').getAttribute('points')).length>0);
  await styles.getByRole('button',{name:'29 NOV'}).click();
  await page.getByRole('button',{name:'Abrir carta',exact:true}).click();
  await page.getByRole('dialog',{name:'Una carta para Vale'}).waitFor();
  await page.getByRole('button',{name:'Cerrar carta'}).click();
  await styles.getByRole('button',{name:'30 NOV'}).click();
  await page.getByRole('button',{name:'Cultivar flor 1',exact:true}).click();
  await page.locator('.ed-plant.grown').waitFor();
  await styles.getByRole('button',{name:'01 DIC'}).click();
  const animatedHeart=page.getByRole('button',{name:'Atrapar corazón 1',exact:true});
  await animatedHeart.waitFor();
  const heartBounds=await animatedHeart.boundingBox();
  assert(heartBounds&&heartBounds.width>=44&&heartBounds.height>=44,'heart keeps a generous touch target');
  assert.equal(await animatedHeart.evaluate(el=>getComputedStyle(el).animationName),'none','button does not animate its hitbox');
  assert.equal(await animatedHeart.locator('.ed-heart-art').evaluate(el=>getComputedStyle(el).animationName),'ed-bob','visual bobbing is preserved');
  await animatedHeart.click();
  assert.equal(await page.locator('.ed-heart').count(),4);
  await styles.getByRole('button',{name:'02 DIC'}).click();
  const drawing=page.locator('canvas[aria-label="Lienzo para dibujar"]');
  await drawing.waitFor();
  const bounds=await drawing.boundingBox();
  assert(bounds&&bounds.width>40);
  await page.mouse.move(bounds.x+bounds.width*.3,bounds.y+bounds.height*.4);
  await page.mouse.down();
  await page.mouse.move(bounds.x+bounds.width*.7,bounds.y+bounds.height*.55,{steps:8});
  await page.mouse.up();
  assert(await drawing.evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)),'actual drawing changes pixels');
  await page.getByRole('button',{name:/Borrar estelas/}).click();
  assert(await drawing.evaluate(c=>!c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(v=>v!==0)),'clear removes drawing');
  await styles.getByRole('button',{name:'03 DIC'}).click();
  await page.locator('.ed-deck').waitFor();
  // Original generated silent WAV fixture; no external song or autoplay.
  const samples=16000,wav=Buffer.alloc(44+samples*2);
  wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40);
  await page.locator('.ed-audio-controls input[type=file]').setInputFiles({name:'prueba.wav',mimeType:'audio/wav',buffer:wav});
  await page.getByRole('button',{name:'Reproducir disco'}).click();
  await page.locator('.ed-deck.playing').waitFor();
  await page.getByRole('button',{name:'Pausar disco'}).click();
  await page.locator('.ed-deck:not(.playing)').waitFor();
  await styles.getByRole('button',{name:'04 DIC'}).click();
  await page.locator('[data-daily-theme="finale"]').waitFor();
  await page.getByRole('button',{name:/Enciende las estrellas/}).click();
  await page.locator('.ed-wish.lit').waitFor();
  assert.deepEqual(await dailyKeys(),dailyBefore,'preview interactions do not write public progress');
  assert.equal(await page.getByRole('button',{name:'Abrir mi sorpresa'}).count(),0,'visual preview cannot unlock gift');
  await styles.getByRole('button',{name:'27 NOV'}).click();
  await page.locator('[data-daily-theme="blossom"]').waitFor();
  await page.getByRole('button',{name:'Volver a pruebas',exact:true}).click();
  await menu.waitFor();
  await menu.getByRole('button',{name:/Experiencia completa/}).click();
  await page.getByText('LP · SIMULACIÓN T−10 s',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Abrir mi sorpresa'}).count(),0,'simulation starts locked');
  await page.getByRole('button',{name:'Abrir mi sorpresa'}).waitFor({timeout:14000});
  await page.getByRole('button',{name:'Volver a pruebas',exact:true}).click();
  await menu.waitFor();
  await menu.getByRole('button',{name:/Picnic · Celebración/}).click();
  await page.locator('.garden-epilogue[data-epilogue-stage="celebration"] .adventure-canvas canvas').waitFor({timeout:25000});
  await page.screenshot({path:'artifacts/lp-epilogue-checkpoint.png'});
  await page.getByRole('button',{name:'Salir',exact:true}).click();
  await menu.waitFor();
  const saveBefore=await page.evaluate(()=>['valeteamo-rescue-v2','valeteamo-story-acts-1-2-v1'].map(k=>localStorage.getItem(k)));
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
  await page.mouse.move(190,200);
  await page.mouse.wheel(0,-440);
  await page.waitForTimeout(180);
  const zoomAfterWheel=Number(await cinematicCanvas.getAttribute('data-zoom-target'));
  assert(zoomAfterWheel>zoomBefore,'mouse wheel zooms into the galaxy');
  await cinematicCanvas.evaluate(el=>{
   const rect=el.getBoundingClientRect();
   const fire=(type,id,x,y)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerType:'touch',pointerId:id,isPrimary:id===901,clientX:rect.left+x,clientY:rect.top+y}));
   fire('pointerdown',901,135,205);fire('pointerdown',902,225,205);
   fire('pointermove',901,97,205);fire('pointermove',902,263,205);
   fire('pointerup',901,97,205);fire('pointerup',902,263,205);
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
  // The fifth constellation owns the NEW reversible Robin/Starfire souvenir.
  await page.getByRole('button',{name:'Ajustes de la galaxia'}).click();
  await page.getByRole('button',{name:/Siempre juntos/}).click();
  await page.getByRole('heading',{name:/Siempre juntos/}).waitFor();
  await page.getByRole('button',{name:/Abrir nuestra carta/}).click();
  const postcard=page.locator('.cx-postcard-experience');
  await postcard.waitFor();
  assert.equal(await postcard.getAttribute('data-postcard-phase'),'sealed');
  await page.screenshot({path:'artifacts/postcard-sealed-envelope.png'});
  const postcardAsset=await page.request.get('http://127.0.0.1:'+port+'/experience/postcards/robin-starfire.webp');
  assert.equal(postcardAsset.status(),200,'the submitted Robin/Starfire image must be shipped with the app');
  assert((postcardAsset.headers()['content-type']||'').includes('image/webp'));
  await page.getByRole('button',{name:'Abrir sobre y sacar postal'}).click();
  await page.locator('.cx-postcard-experience[data-postcard-phase="inspecting"]').waitFor({timeout:5000});
  await page.waitForTimeout(900);
  await page.screenshot({path:'artifacts/postcard-front-3d.png'});
  const card=page.locator('.cx-postcard-object');
  const yawBefore=Number(await postcard.getAttribute('data-postcard-yaw'));
  await card.evaluate(el=>{
   const r=el.getBoundingClientRect();
   const fire=(type,id,x,y)=>el.dispatchEvent(new PointerEvent(type,{
    bubbles:true,pointerType:'touch',pointerId:id,isPrimary:true,clientX:r.left+x,clientY:r.top+y
   }));
   fire('pointerdown',47,30,30);
   fire('pointermove',47,95,54);
   fire('pointerup',47,95,54);
  });
  assert(Math.abs(Number(await postcard.getAttribute('data-postcard-yaw'))-yawBefore)>20,'drag rotates the actual 3D object');
  // Native iPhone two-finger pinch should increase zoom without triggering a flip.
  const zoomBeforePinch=Number(await postcard.getAttribute('data-postcard-zoom'));
  await card.evaluate(el=>{
   const r=el.getBoundingClientRect();
   const fire=(type,id,x,y)=>el.dispatchEvent(new PointerEvent(type,{
    bubbles:true,pointerType:'touch',pointerId:id,isPrimary:id===51,clientX:r.left+x,clientY:r.top+y
   }));
   fire('pointerdown',51,80,90);
   fire('pointerdown',52,120,90);
   fire('pointermove',51,55,90);
   fire('pointermove',52,150,90);
   fire('pointerup',51,55,90);
   fire('pointerup',52,150,90);
  });
  assert(Number(await postcard.getAttribute('data-postcard-zoom'))>zoomBeforePinch,'postcard supports two-finger zoom');
  await page.getByRole('button',{name:'Centrar postal'}).click();
  assert.equal(await postcard.getAttribute('data-postcard-zoom'),'1.00','the postcard returns to its original size');
  await page.getByRole('button',{name:'Voltear postal'}).click();
  await page.locator('.cx-postcard-experience[data-postcard-side="back"]').waitFor();
  await page.getByText(/Lorem ipsum dolor sit amet/).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({path:'artifacts/postcard-back-letter.png'});
  const initialZoom=Number(await postcard.getAttribute('data-postcard-zoom'));
  await page.getByRole('button',{name:'Acercar postal'}).click();
  assert(Number(await postcard.getAttribute('data-postcard-zoom'))>initialZoom,'postcard zoom button works');
  await page.getByRole('button',{name:'Centrar postal'}).click();
  assert.equal(await postcard.getAttribute('data-postcard-side'),'front','centering restores orientation');
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
  // The heart now opens the NEW unified story 2D; classic remains accessible from tests.
  await page.getByRole('button',{name:'Ajustes de la galaxia'}).click();
  await page.getByRole('button',{name:/Abrir corazón/}).click();
  await page.getByRole('dialog',{name:/Comenzamos nuestra aventura/}).waitFor();
  await page.getByRole('button',{name:/Comenzar juego 2D/}).click();
  await page.getByRole('button',{name:'Presiona cualquier botón para iniciar'}).waitFor();
  await page.screenshot({path:'artifacts/cosmos-to-2d-picnic.png'});
  await page.getByRole('button',{name:'Presiona cualquier botón para iniciar'}).click();
  await page.locator('.story-prologue .adventure-canvas canvas').waitFor({timeout:25000});
  await page.locator('.story-prologue .prologue-guide').waitFor({timeout:12000});
  assert.deepEqual(await page.evaluate(()=>['valeteamo-rescue-v2','valeteamo-story-acts-1-2-v1'].map(k=>localStorage.getItem(k))),saveBefore,'LP heart must not change real rescue saves');
  assert.deepEqual(errors,[],'Sin errores JavaScript');
  const video=page.video();
  await context.close();
  if(video){const videoFile=await video.path();fs.renameSync(videoFile,'artifacts/cosmos-cinematic-motion.webm');}
  console.log('PASS: iPhone LP, contador, regalo, galaxia, recuerdo, carta, misterio, final y horizontal.');
 }finally{await browser?.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
