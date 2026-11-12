const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),net=require('node:net'),{chromium}=require('playwright');
(async()=>{
 const folder=path.resolve(process.env.HOUSE_QA_DIR||'docs/capturas/nota-espejo');fs.mkdirSync(folder,{recursive:true});const reserve=net.createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));
 // Fast-forward the clocks for this fixture. The pursuit browser test covers the actual encounter.
 const html=`<html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="/src/lab/lab.css"><body><button id="launch">Entrar</button><script type="module">
  import {launchHouse} from '/src/lab/house.js';
  import {MirrorSafePuzzle} from '/src/lab/mirror-safe.js';
  import {HouseEvents} from '/src/lab/story-events.js';
  const mirrorAdvance=MirrorSafePuzzle.prototype.advance,storyAdvance=HouseEvents.prototype.advance;
  MirrorSafePuzzle.prototype.advance=function(dt,options){return mirrorAdvance.call(this,dt*120,options);};
  HouseEvents.prototype.advance=function(dt,hidden){this.twoActs=false;return storyAdvance.call(this,dt*120,hidden,{clear:true,visited:2});};
  document.querySelector('button').onclick=()=>{window.stopHouse=launchHouse(()=>{},'ground',{demo:true,trial:true});};
 </script></body></html>`;
 const server=await(await import('vite')).createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port,strictPort:true},plugins:[{name:'mirror-safe-harness',configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url!='/__safe')return next();res.setHeader('Content-Type','text/html');res.end(html);});}}]});await server.listen();let browser;const results=[];
 try{
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const viewport of [{width:960,height:540},{width:568,height:320}]){
   console.log('Mirror safe QA:',viewport.width);const context=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<700}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`http://127.0.0.1:${port}/__safe`);await page.click('#launch');await page.click('[data-act=start]');const state=()=>page.evaluate(()=>window.__rescueHouse.mirrorPuzzle()),use=(id,activate=true)=>page.evaluate(({id,activate})=>window.__rescueHouse.interactWith(id,activate),{id,activate}),shot=name=>page.screenshot({path:path.join(folder,viewport.width+'-'+name+'.png')});
   await page.evaluate(()=>window.__rescueHouse.setPose({x:8.35,y:0,z:5.55,yaw:Math.PI/2,pitch:0}));await page.waitForTimeout(150);assert(!(await state()).revealed,'Seeing a mirror without the note cannot disclose the code');
   assert(!(await use('dormitorio')).puzzle.door,'The bedroom stays locked until the key is found');
   await use('media-cabinet');await use('media-flashlight');await use('note-hall');await page.keyboard.press('Escape');await use('drawer');await use('key');
   const bedroom=await use('dormitorio');assert(bedroom.puzzle.door&&!bedroom.puzzle.symbol,'The key alone unlocks the bedroom');
   await page.waitForFunction(()=>window.__rescueHouse.story().phase==='evaded');
   assert.equal((await state()).safe.state,'closed');
   await use('mirror-note');assert.equal(await page.locator('[data-equip=paper]').getAttribute('aria-pressed'),'true');
   await page.keyboard.press('i');assert.equal(await page.locator('[data-act=read][data-id=mirror-note]').count(),0);await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Observar nota',exact:true}).click();
   const transform=await page.locator('.mirror-note-writing').evaluate(el=>getComputedStyle(el).transform);assert(transform.startsWith('matrix(-1,'),'The glyphs themselves are reflected');assert.equal(await page.locator('.mirror-note-reading').count(),0);const back=await page.getByRole('button',{name:'Volver',exact:true}).boundingBox();assert(back.y+back.height<=viewport.height,'The note fits with its return button');await shot('01-nota-invertida');const active=(await state()).activeSeconds;await page.waitForTimeout(650);assert.equal((await state()).activeSeconds,active,'Reading the note is paused');await page.keyboard.press('Escape');
   await page.waitForFunction(()=>window.__rescueHouse.mirrorPuzzle().hintShown);await page.waitForFunction(()=>document.querySelector('#lab-toast').textContent.includes('espejo del baño'));await shot('02-pista-demorada');
   // A wall / looking away cannot satisfy the mirror; the actual mirror render must be visible.
   await page.evaluate(()=>window.__rescueHouse.setPose({x:6,y:0,z:8,yaw:Math.PI/2,pitch:0}));await page.waitForTimeout(120);assert(!(await state()).revealed);
   await use('bano',false);
   const bathDoor=()=>page.evaluate(()=>window.__rescueHouse.snapshot().doors.find(d=>d.id==='bano'));
   await page.waitForTimeout(300);assert.equal((await bathDoor()).state,'closed','Walking into range does not open a door');
   await page.click('#lab-interact');await page.waitForFunction(()=>window.__rescueHouse.snapshot().doors.find(d=>d.id==='bano').state==='open');
   await page.keyboard.press('2');await page.keyboard.press('f');
   await page.keyboard.press('3');
   await page.evaluate(()=>window.__rescueHouse.setPose({x:8.35,y:0,z:5.55,yaw:Math.PI/2,pitch:0}));
   await page.waitForFunction(()=>window.__rescueHouse.snapshot().mirror.drawn&&!window.__rescueHouse.snapshot().flashlight&&window.__rescueHouse.mirrorPuzzle().noteLift===0&&window.__rescueHouse.amenities().notePresentation);
   assert.equal(await page.locator('[data-equip=phone]').getAttribute('aria-pressed'),'false');
   assert(await page.locator('#house-use-phone').isHidden());
   assert(!(await state()).revealed,'The code stays hidden in darkness');
   await page.evaluate(()=>window.__rescueHouse.setPose({x:8.35,y:0,z:5.55,yaw:-Math.PI/2,pitch:0}));
   if(viewport.width<700){await page.locator('[data-equip=flashlight]').tap();await page.locator('#house-light').tap();}else await use('switch-bano');
   await page.evaluate(()=>window.__rescueHouse.setPose({x:8.35,y:0,z:5.55,yaw:-Math.PI/2,pitch:0}));
   await page.waitForFunction(()=>window.__rescueHouse.mirrorPuzzle().noteLift===1);
   assert(!(await state()).revealed,'The note rises as soon as Kitty enters, even when facing away from the mirror');
   await page.evaluate(()=>window.__rescueHouse.setPose({x:8.35,y:0,z:5.55,yaw:Math.PI/2,pitch:0}));
   await page.waitForFunction(()=>window.__rescueHouse.mirrorPuzzle().revealed);await page.waitForFunction(()=>document.querySelector('#lab-toast').textContent.includes('1505'));assert(await page.locator('#lab-toast').isVisible());assert.equal(await page.locator('.phone-notice').isVisible(),false);await shot('03-lectura-espejo');
   await use('mirror-safe');await page.getByRole('dialog',{name:'Caja fuerte',exact:true}).waitFor();for(const n of ['0','0','0','0'])await page.click('[data-act="safe:'+n+'"]');await page.click('[data-act="safe:submit"]');assert(!(await state()).opened);assert((await page.locator('#safe-feedback').textContent()).includes('no coincide'));await shot('04-teclado');
   if(viewport.width<700){for(const n of ['1','5','0','5'])await page.click('[data-act="safe:'+n+'"]');await page.click('[data-act="safe:submit"]');}else{await page.keyboard.type('1508');await page.keyboard.press('Backspace');await page.keyboard.press('5');await page.keyboard.press('Enter');}
   await page.waitForFunction(()=>window.__rescueHouse.mirrorPuzzle().safe.state==='open');assert((await state()).opened);assert((await page.evaluate(()=>window.__rescueHouse.snapshot())).puzzle.symbol);await shot('05-caja-abierta');
   await page.keyboard.press('i');assert((await page.locator('[data-act=read][data-id=mirror-note]').textContent()).includes('resuelta'));await page.click('[data-act=read][data-id=mirror-note]');assert((await page.locator('.mirror-note-reading').textContent()).includes('1505'));await page.keyboard.press('Escape');
   const gl=await page.locator('#lab-canvas').evaluate(c=>c.getContext('webgl').getError());assert.equal(gl,0);assert.deepEqual(errors,[]);results.push({viewport,mirroredGlyphs:true,pausedHint:true,delayedHint:true,mirrorVisibility:true,wrongCode:true,keypad:true,bagReading:true,bedroomProgress:true,gl,errors});await page.evaluate(()=>window.stopHouse());await context.close();
  }
  fs.writeFileSync(path.join(folder,'verificacion.json'),JSON.stringify(results,null,2));console.log('PASS mirror safe browser: mirrored note, minute hint wiring, view-gated reveal, keyboard/touch keypad, contents and bedroom progression');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
