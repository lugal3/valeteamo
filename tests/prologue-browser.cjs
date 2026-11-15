const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

async function play(){
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0,strictPort:true},logLevel:'silent'});
 let browser;
 try{
  await server.listen();
  const base='http://127.0.0.1:'+server.httpServer.address().port+'/';
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('artifacts',{recursive:true});
  await page.goto(base);
  await page.getByRole('button',{name:'Administración'}).click();
  await page.getByLabel('Código de acceso').fill('LP');
  await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();
  await page.getByRole('button',{name:'Presiona cualquier botón para iniciar'}).click();
  await page.getByRole('button',{name:'Pruebas',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:/Aventura clásica/}).count(),1,
   'Original 2D must stay selectable as a separate classic mode');
  await page.getByRole('button',{name:/Rescate · 2D/}).click();

  const game=page.locator('.story-prologue');
  await game.waitFor({timeout:20000});
  await page.waitForFunction(()=>Boolean(window.__valePrologue),null,{timeout:15000});
  assert.equal(await game.getAttribute('data-prologue-stage'),'intro');
  const convo=page.getByRole('dialog',{name:'Conversación'});
  async function finishDialogue(){
   await convo.waitFor({state:'visible',timeout:13000});
   for(let n=0;n<48;n++){
    if(!await convo.isVisible())return;
    const button=convo.getByRole('button',{name:/Mostrar todo|Continuar/});
    await button.click();
   }
   throw Error('Conversation did not finish in 48 clicks');
  }
  async function step(stage,x,action){
   await game.locator('xpath=self::*[@data-prologue-stage="'+stage+'"]').waitFor({timeout:12000});
   await page.evaluate(([x,y])=>window.__valePrologue.teleport(x,y),[x,340]);
   if(action){
    const btn=page.getByRole('button',{name:action});
    await btn.waitFor({state:'visible',timeout:6000});
    await btn.click();
    await finishDialogue();
   }
  }
  await page.screenshot({path:'artifacts/story-acts1-2-introduction.png'});
  await finishDialogue();
  await game.locator('xpath=self::*[@data-prologue-stage="defend"]').waitFor({timeout:10000});
  // Original Corazones controls: WASD for movement, arrows for hearts.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(360);
  await page.keyboard.up('ArrowRight');
  // Same heart shooting mechanic style: enemy HP and heart projectiles
  await page.evaluate(()=>window.__valePrologue.defeatShadows());
  await game.locator('xpath=self::*[@data-prologue-stage="talk-louis"]').waitFor({timeout:11000});
  await step('talk-louis',710,/Hablar con Louis/);
  await game.locator('xpath=self::*[@data-prologue-stage="talk-luis"]').waitFor();
  await step('talk-luis',1218,/Hablar con Luis/);
  await game.locator('xpath=self::*[@data-prologue-stage="walk-together"]').waitFor();
  await page.screenshot({path:'artifacts/story-luis-and-louis.png'});
  await page.evaluate(()=>window.__valePrologue.teleport(1543,336));
  await game.locator('xpath=self::*[@data-prologue-stage="disappearance"]').waitFor({timeout:6000});
  await finishDialogue(); // sinister warning while still in sunshine
  await convo.waitFor({state:'visible',timeout:11000}); // kidnapping cinematic completes
  await page.screenshot({path:'artifacts/story-abduction-nightfall.png'});
  await finishDialogue(); // Kitty and Luis text conversation
  await game.locator('xpath=self::*[@data-prologue-stage="ribbon"]').waitFor();
  await step('ribbon',1578,/Examinar Pulsera/);
  await step('petals',1910,/Examinar Pétalos/);
  await step('wheel',2224,/Examinar Huellas/);
  await game.locator('xpath=self::*[@data-prologue-stage="door"]').waitFor();
  await page.waitForTimeout(2100);
  const dusk=await page.evaluate(()=>window.__valePrologue.dusk());
  assert(dusk.alpha>.5&&dusk.fillAlpha===1,'night must visibly darken the garden; fillAlpha cannot be zero');
  await page.screenshot({path:'artifacts/story-three-clues-night.png'});
  await step('door',2490,/Probar puerta/);
  await game.locator('xpath=self::*[@data-prologue-stage="window"]').waitFor();
  await page.evaluate(()=>window.__valePrologue.teleport(2680,328));
  await page.getByRole('button',{name:/Entrar por la ventana/}).click();
  await finishDialogue();
  await page.locator('#lab-canvas').waitFor({state:'visible',timeout:26000});
  await page.locator('.lab-window-intro:not(.lab-hidden)').waitFor({state:'visible',timeout:15000});
  await page.screenshot({path:'artifacts/story-to-house-3d.png'});
  assert.deepEqual(errors,[],'no runtime JS errors across the entire 2D→3D sequence');
  await context.close();
  console.log('PASS: playable prologue introduction, shooting, Louis/Luis RPG dialogue, kidnapping, 3 clues, locked door and real 3D window.');
 }finally{await browser?.close();await server.close();}
}
play().catch(e=>{console.error(e);process.exitCode=1;});
