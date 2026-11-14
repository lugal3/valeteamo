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
   viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('artifacts',{recursive:true});

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
  await page.locator('canvas.cosmos-video-canvas[data-arrival-stage="star-tunnel"]').waitFor({timeout:14000});
  await page.screenshot({path:'artifacts/public-tunnel.png'});
  await page.locator('canvas.cosmos-video-canvas[data-arrival-stage="unfold"]').waitFor({timeout:14000});
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
  assert(heart.x>30&&heart.x<360&&heart.y>30&&heart.y<800,
   'heart is physically tappable in iPhone viewport');
  await page.mouse.click(heart.x,heart.y);
  await page.getByRole('dialog',{name:/Comenzamos nuestra aventura/}).waitFor();
  await page.screenshot({path:'artifacts/public-heart-2d-choice.png'});
  await page.getByRole('button',{name:/Comenzar juego 2D/}).click();
  await page.getByRole('heading',{name:/El jardín/}).waitFor({timeout:12000});
  await page.getByRole('button',{name:/Comenzar aventura/}).click();
  await page.locator('#game canvas').waitFor({timeout:25000});
  await page.locator('.loading-screen').waitFor({state:'hidden',timeout:30000});
  assert.equal(await page.locator('.game-shell').count(),1,'the real Phaser 2D scene is active');
  await page.screenshot({path:'artifacts/public-original-2d-game.png'});
  assert.deepEqual(errors,[],'No JavaScript exceptions in the locked → unlocked → 2D flow');
  await context.close();
  console.log('PASS: REAL public date boundary, unlock, gift, intro, tunnel, galaxy, heart, original Phaser 2D running.');
 }finally{await browser?.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
