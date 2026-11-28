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
  const context=await browser.newContext({
   viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('artifacts',{recursive:true});

  const themes=['blossom','constellation','letter','garden','pixel','aurora','music','finale'];
  await page.clock.setFixedTime(new Date('2026-11-27T15:00:00Z'));
  await page.goto('http://127.0.0.1:'+port+'/');
  const root=page.locator('main.birthday-countdown');
  const messages=new Set();
  for(let i=0;i<themes.length;i++){
   // Advance the same mounted page across Chilean civil midnights.
   await page.clock.setFixedTime(new Date(Date.UTC(2026,10,27+i,3)));
   await page.locator('main.birthday-countdown[data-daily-theme="'+themes[i]+'"]').waitFor();
   await page.waitForFunction(expected=>document.querySelector('.birthday-time dd')?.textContent===expected,String(8-i).padStart(2,'0'));
   assert.equal(await page.getByRole('timer').locator('dd').first().innerText(),String(8-i).padStart(2,'0'));
   assert.equal(await page.getByRole('button',{name:'Abrir mi sorpresa'}).count(),0);
   assert.equal(await page.locator('.daily-preview').count(),0,'public has no theme selector');
   messages.add(await root.locator('.daily-message p').innerText());
   assert.equal(await root.locator('.daily-particle').count(),32,'bounded themed particle field');
   assert.equal(await root.locator('.daily-art').count(),1,'individual decorative composition');
   if(i===0){assert.equal(await root.locator('.ed-falling-petal').count(),18);assert.equal(await root.locator('.ed-warm-spark').count(),14);}
   assert(await root.locator('.birthday-time').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'timer fits viewport');
   await page.screenshot({path:'artifacts/daily-'+(i+1)+'-'+themes[i]+'.png'});
  }
  assert.equal(messages.size,8,'eight distinct public messages');

  // Simulate Chilean midnight on Dec 5 without touching the project date,
  // production config, visitor storage, or actual server clock.
  await page.clock.setFixedTime(new Date('2026-12-05T02:59:58.000Z'));
  await page.goto('http://127.0.0.1:'+port+'/');
  await page.getByRole('timer',{name:/Tiempo para abrir el regalo/}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Abrir mi sorpresa'}).count(),0,
   'public visitor cannot open before Chilean midnight');
  assert.equal(await page.getByRole('button',{name:'Ajustes de la galaxia'}).count(),0,
   'LP test gear is not visible to public visitors');
  await page.screenshot({path:'artifacts/public-countdown-locked.png'});

  await page.clock.setFixedTime(new Date('2026-12-05T03:00:03.000Z'));
  await page.getByRole('button',{name:'Abrir mi sorpresa'}).waitFor({timeout:9000});
  await page.getByRole('button',{name:'Abrir mi sorpresa'}).click();
  await page.getByRole('heading',{name:/Hay algo/}).waitFor();
  await page.screenshot({path:'artifacts/public-gift-after-unlock.png'});

  await page.getByRole('button',{name:/Toca para abrir/}).click();
  await page.getByRole('heading',{name:/Una Galaxia de/}).waitFor({timeout:9000});
  await page.getByRole('button',{name:/ENTRAR A NUESTRO UNIVERSO/}).click();
  const canvas=page.locator('canvas.cosmos-video-canvas');
  await canvas.locator('xpath=..').waitFor();
  await page.waitForFunction(()=>Number(document.querySelector('canvas.cosmos-video-canvas')?.getAttribute('data-cinematic-seconds')||0)>=.85,null,{timeout:14000});
  await page.screenshot({path:'artifacts/public-tunnel.png'});
  await page.waitForFunction(()=>Number(document.querySelector('canvas.cosmos-video-canvas')?.getAttribute('data-cinematic-seconds')||0)>=1.92,null,{timeout:14000});
  await page.locator('canvas.cosmos-video-canvas[data-arrival-stage="explore"]').waitFor({timeout:18000});
  await page.screenshot({path:'artifacts/public-galaxy.png'});

  assert.equal(await page.locator('.cosmos-preview-controls').count(),0,
   'old LP bottom bar is not rendered in the public experience');
  assert.equal(await page.getByRole('button',{name:'Ajustes de la galaxia'}).count(),0,
   'no admin gear displayed on the unlocked public galaxy');
  assert.equal(await page.locator('.cosmos-bottomline,.cosmos-decor-side,.cosmos-topbar').count(),0,
   'no decorative bars surrounding the public galaxy');
  assert.equal(await page.locator('main.cosmos-galaxy button:visible').count(),0,
   'only the heart inside the canvas starts the public game');
  assert.equal(await page.locator('main.cosmos-galaxy').getAttribute('data-visual-version'),
   'directional-tunnel-v3');

  const heart=await canvas.evaluate(el=>({
   x:Number(el.dataset.heartX),y:Number(el.dataset.heartY),
   ready:el.dataset.heartSelectable
  }));
  assert.equal(heart.ready,'true');
  const view=await canvas.evaluate(el=>({width:el.clientWidth,height:el.clientHeight}));
  assert(heart.x>20&&heart.x<view.width-20&&heart.y>20&&heart.y<view.height-20,
   'heart remains physically tappable in the LANDSCAPE iPhone viewport');
  await page.mouse.click(heart.x,heart.y);
  await page.getByRole('dialog',{name:/Comenzamos nuestra aventura/}).waitFor();
  await page.screenshot({path:'artifacts/public-heart-2d-choice.png'});
  await page.getByRole('button',{name:/Comenzar juego 2D/}).click();
  const rescueCover=page.locator('.valeteamo-splash');
  await rescueCover.getByRole('button',{name:'Presiona cualquier botón para iniciar'}).waitFor();
  assert.equal(await rescueCover.locator('img[src="./demo-assets/portada-v2.webp"]').count(),1,'picnic cover belongs to 2D rescue entry');
  await page.screenshot({path:'artifacts/public-rescue-cover.png'});
  await rescueCover.getByRole('button',{name:'Presiona cualquier botón para iniciar'}).click();
  await page.locator('.story-prologue .adventure-canvas canvas').waitFor({timeout:25000});
  const manual=page.getByRole('dialog',{name:'Manual de controles del jardín'});
  await manual.waitFor({timeout:12000});await manual.getByRole('button',{name:'Entendido'}).click();
  await page.locator('.story-prologue .adventure-objective').waitFor({timeout:12000});
  assert.equal(await page.locator('.story-prologue').getAttribute('data-prologue-stage'),'intro');
  await page.screenshot({path:'artifacts/public-unified-story-prologue.png'});
  assert.deepEqual(errors,[],'No JavaScript exceptions in the locked → unlocked → 2D flow');
  await context.close();
  console.log('PASS: public birthday countdown, heart and NEW 2D rescue prologue; classic mode preserved in LP.');
 }finally{await browser?.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
