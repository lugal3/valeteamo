const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

async function verifyDesktop(){
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0,strictPort:true},logLevel:'silent'});
 let browser;
 try{
  await server.listen();
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('artifacts',{recursive:true});
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/');
  await page.getByRole('button',{name:'Administración'}).click();
  await page.getByLabel('Código de acceso').fill('LP');
  await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();
  await page.getByRole('button',{name:/Rescate · 2D/}).click();
  await page.getByRole('button',{name:'Presiona cualquier botón para iniciar'}).click();
  await page.locator('.story-prologue .adventure-canvas canvas').waitFor({timeout:22000});
  await page.waitForFunction(()=>!!window.__valePrologue?.scene()?.player);
  const scene=await page.evaluate(()=>{
   const s=window.__valePrologue.scene();
   return {key:s.scene.key,zoom:s.cameras.main.zoom,
    width:s.scale.width,height:s.scale.height,world:s.storyWorld.map,
    u:s.p.u,v:s.p.v};
  });
  assert.equal(scene.key,'iso-adventure','desktop uses original Phaser Corazones engine');
  assert.equal(scene.zoom,Math.min(scene.width/800,scene.height/450)*1.08,
   'desktop uses same original camera formula');
  assert.equal(scene.world,'morning_garden');
  const rect=await page.locator('.story-prologue .adventure-canvas canvas')
   .evaluate(x=>{const r=x.getBoundingClientRect();return {width:r.width,height:r.height}});
  assert(rect.width>600&&rect.height>300,'canvas scales correctly to desktop viewport');
  await page.screenshot({path:'artifacts/story-desktop-morning.png'});
  // Keyboard movement must remain fluid after new environment / cinematic code.
  await page.keyboard.down('d');
  await page.waitForTimeout(620);
  await page.keyboard.up('d');
  const moved=await page.evaluate(()=>window.__valePrologue.scene().p);
  assert(Math.hypot(moved.u-scene.u,moved.v-scene.v)>.10,'WASD must actually move Kitty in desktop map');
  const teleport=()=>page.evaluate(()=>window.__valePrologue.teleport(0));
  await teleport();
  await page.getByRole('button',{name:/Recoger Churu/}).waitFor();
  await page.keyboard.press('e',{delay:90});
  await page.locator('.story-prologue[data-prologue-stage="feed-cat"]').waitFor();
  await teleport();
  await page.getByRole('button',{name:/Alimentar a la gata gris/}).waitFor();
  await page.keyboard.press('e',{delay:90});
  await page.getByRole('button',{name:'Ofrecer Churu',exact:true}).press('Enter');
  await page.locator('.story-prologue[data-fed-grey-cat="true"]').waitFor();
  await page.evaluate(()=>window.__valePrologue.exit());
  await page.locator('.story-prologue[data-transition="out"]').waitFor({timeout:6000});
  await page.waitForFunction(()=>window.__valePrologue?.map?.()==='afternoon_meeting',
   null,{timeout:12000});
  await page.locator('.story-prologue[data-transition="none"]').waitFor({timeout:12000});
  await teleport();
  await page.getByRole('button',{name:/Saludar a Luis y Vale/}).waitFor({timeout:6000});
  await page.keyboard.press('e',{delay:90});
  await page.getByRole('dialog',{name:'Conversación'}).waitFor({timeout:15000});
  await page.screenshot({path:'artifacts/story-desktop-afternoon-dialog.png'});
  const dialog=page.getByRole('dialog',{name:'Conversación'});
  for(let i=0;i<30;i++){
   if(!await dialog.isVisible())break;
   await dialog.getByRole('button',{name:/Mostrar todo|Continuar/}).click();
  }
  await page.locator('.story-prologue[data-prologue-stage="defend"]').waitFor({timeout:12000});
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(470);
  await page.keyboard.up('ArrowRight');
  const fired=await page.evaluate(()=>({
   last:window.__valePrologue.scene().last,
   shots:window.__valePrologue.scene().shots.length
  }));
  assert(fired.last>0,'arrow key must still shoot hearts in the original arcade');
  assert.deepEqual(errors,[],'desktop 2D scene, keyboard movement and map exit have no runtime errors');
  await context.close();
  console.log('PASS: desktop 1280×720, original zoom, keyboard walking/hearts, glowing portal fade and correct next map.');
 }finally{await browser?.close();await server.close();}
}
verifyDesktop().catch(error=>{console.error(error);process.exitCode=1;});
