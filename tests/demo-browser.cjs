// Real browser smoke test, not an iPhone physical-device test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0},logLevel:'silent'});
 await server.listen();const url='http://127.0.0.1:'+server.httpServer.address().port+'/';
 const folder=path.resolve('demo-screenshots');fs.mkdirSync(folder,{recursive:true});
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:960,height:540},hasTouch:true,isMobile:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
  await page.goto(url);
  await page.getByRole('button',{name:/Presiona cualquier botón para iniciar/}).waitFor({timeout:15000});
  await page.waitForFunction(()=>{const image=document.querySelector('.splash-frame img');return image?.complete&&image.naturalWidth>=1200&&image.currentSrc.includes('portada-v2.webp');});
  const assets=await page.evaluate(async()=>Promise.all(['001','005','014','019'].map(async id=>{const r=await fetch('/demo-assets/referencias/'+id+'.webp');return [id,r.status,r.headers.get('content-type')]})));
  for(const [id,status,mime] of assets){assert.equal(status,200,'Missing image '+id);assert(/image\/webp/.test(mime),'Incorrect MIME for '+id);}

  console.log('Play overlay hit-test:',await page.evaluate(()=>{
   const b=document.querySelector('.splash-start'),box=b.getBoundingClientRect();
   const el=document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
   return {rect:{x:box.x,y:box.y,w:box.width,h:box.height},target:el?.className,style:{z:getComputedStyle(b).zIndex,pointer:getComputedStyle(b).pointerEvents,display:getComputedStyle(b).display,position:getComputedStyle(b).position}};
  }));
  await page.screenshot({path:path.join(folder,'01-portada.png')});
  // The title image itself is a click-to-start surface, as it is for the player.
  await page.mouse.click(480,478);
  await page.getByText('Feliz cumpleaños, Valentina').waitFor();await page.waitForTimeout(1100);
  await page.screenshot({path:path.join(folder,'02-cumpleanos.png')});
  await page.getByRole('button',{name:/Jugar la demo de rescate 2D/}).click();
  await page.getByRole('button',{name:/Presiona cualquier botón para iniciar/}).click();
  await page.locator('.rescue-stage canvas').waitFor({timeout:15000});
  await page.waitForTimeout(850);
  await page.screenshot({path:path.join(folder,'03-jardin-2d.png')});
  await page.keyboard.down('d');await page.waitForFunction(()=>window.__rescueScene?.kitty?.x>160,{timeout:7000});await page.keyboard.up('d');
  await page.evaluate(()=>window.__rescueScene.kitty.setPosition(277,282));
  await page.getByRole('button',{name:/Recoger corazón/}).waitFor({timeout:7000});
  await page.getByRole('button',{name:/Recoger corazón/}).click();
  await page.waitForTimeout(2400);
  await page.screenshot({path:path.join(folder,'04-secuestro.png')});
  // Do not rely on wall-clock movement timing in a headless CI runner.
  await page.evaluate(()=>{window.__rescueScene.kitty.setPosition(594,325);});
  await page.getByRole('button',{name:/Seguir pétalos/}).waitFor({timeout:7000});
  await page.getByRole('button',{name:/Seguir pétalos/}).click();
  // Place the player at the 3D threshold after verifying the trail clue.
  await page.evaluate(()=>{window.__rescueScene.kitty.setPosition(838,310);});
  console.log('At house:',await page.evaluate(()=>({phase:document.querySelector('.rescue-story')?.textContent,kittyX:window.__rescueScene.kitty.x,kittyY:window.__rescueScene.kitty.y,lastNear:window.__rescueScene.lastNear,buttons:[...document.querySelectorAll('.rescue-demo button')].map(b=>b.textContent)})));
  await page.getByRole('button',{name:/Abrir puerta/}).waitFor({timeout:7000});
  await page.getByRole('button',{name:/Abrir puerta/}).click();
  await page.getByRole('button',{name:/Entrar a buscar a Louis/}).waitFor({timeout:7000});
  await page.screenshot({path:path.join(folder,'05-transicion.png')});
  await page.getByRole('button',{name:/Entrar a buscar a Louis/}).click();
  await page.locator('#lab3d canvas').waitFor({timeout:15000});
  await page.locator('#lab-dialog [data-act="start"]').click();
  await page.waitForTimeout(650);
  await page.screenshot({path:path.join(folder,'06-casa-3d.png')});
  // Development-only movement setup checks the real collision shapes and picking rays.
  // This is not equivalent to physically walking every corridor or Safari verification.
  const use=async id=>await page.evaluate(id=>window.__rescueHouse.interactWith(id),id);
  let p=await use('dormitorio');assert.equal(p.puzzle.door,false,'Cannot open locked bedroom early');
  p=await use('drawer');assert.equal(p.puzzle.drawer,false,'Must read the note first');
  p=await use('note-hall');assert(p.puzzle.note,'Hall note found');
  p=await use('drawer');assert(p.puzzle.drawer,'Drawer opens after note');
  p=await use('key');assert(p.puzzle.key,'Key acquired');
  p=await use('picture-stain');assert(p.puzzle.symbol,'Picture clue examined');
  await page.screenshot({path:path.join(folder,'07-pista-cuadro.png')});
  p=await use('dormitorio');assert(p.puzzle.door,'Bedroom unlocked with two clues');
  p=await use('rescue-louis');assert(p.puzzle.rescued,'Louis rescue reached');
  await page.screenshot({path:path.join(folder,'08-rescate.png')});
  await page.locator('#lab-dialog [data-act="finish"]').click();
  await page.getByRole('heading',{name:/Louis está a salvo/}).waitFor({timeout:7000});
  await page.screenshot({path:path.join(folder,'09-final.png')});
  assert.deepEqual(errors,[],'Unexpected browser errors: '+errors.join(' | '));
  console.log('PASS: birthday, 2D kidnapping, 3D puzzle interactions, rescue ending and WebGL');
  await context.close();
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});