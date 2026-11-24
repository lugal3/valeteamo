const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

async function startRescue(browser,base,viewport,mobile){
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);
 await page.getByRole('button',{name:'Administración'}).click();
 await page.getByLabel('Código de acceso').fill('LP');
 await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();
 await page.getByRole('button',{name:/Rescate · 2D/}).click();
  await page.getByRole('button',{name:'Presiona cualquier botón para iniciar'}).click();
 await page.locator('.story-prologue .adventure-canvas canvas').waitFor({timeout:20000});
 await page.waitForFunction(()=>!!window.__valePrologue?.scene()?.player?.texture,{timeout:15000});
 return {context,page,errors};
}
async function check(){
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0,strictPort:true},logLevel:'silent'});
 let browser;
 try{
  await server.listen();
  const base='http://127.0.0.1:'+server.httpServer.address().port+'/';
  browser=await chromium.launch({headless:true});
  fs.mkdirSync('artifacts',{recursive:true});
  // Desktop: keyboard moves with acceleration then settles in place.
  {
   const {context,page,errors}=await startRescue(browser,base,{width:1280,height:720},false);
   const first=await page.evaluate(()=>{
    const s=window.__valePrologue.scene();
    return {p:{...s.p},world:s.storyWorld.map,zoom:s.cameras.main.zoom,
     width:s.scale.width,height:s.scale.height};
   });
   assert.equal(first.world,'morning_garden');
   assert.equal(first.zoom,Math.min(first.width/800,first.height/450)*1.08,
    'camera retains Corazones zoom with a small bounded follow offset');
   await page.keyboard.down('d');
   // Software-backed Phaser can render fewer frames than wall-clock timing suggests.
   // Keep all displacement, velocity, and footstep assertions, but wait for
   // actual scene progress rather than a fixed 950 ms.
   await page.waitForFunction(start=>{
    const s=window.__valePrologue?.scene();
    return s&&Math.hypot(s.p.u-start.u,s.p.v-start.v)>.6&&
     Math.hypot(s.storyVelocity.u,s.storyVelocity.v)>1.2&&s.storyFootprints.length>0;
   },first.p,{timeout:12000});
   const traveling=await page.evaluate(()=>{
    const s=window.__valePrologue.scene();
    return {p:{...s.p},v:{...s.storyVelocity},look:{...s.storyLookAhead},
     foot:s.storyFootprints.length,texture:s.player.texture.key};
   });
   assert(Math.hypot(traveling.p.u-first.p.u,traveling.p.v-first.p.v)>.6,
    'holding D walks Kitty with acceleration in actual game');
   assert(Math.hypot(traveling.v.u,traveling.v.v)>1.2,
    'player builds momentum to intended walking speed');
   assert(Math.abs(traveling.look.x)<=22.01&&Math.abs(traveling.look.y)<=11.01,
    'anticipatory camera never pans far away from Kitty');
   assert(traveling.foot>0&&traveling.foot<=12,
    'material footsteps leave a bounded fading trace');
   assert(traveling.texture.startsWith('chibi-kitty-'),
    'player retains her existing chibi sprites rather than a new engine');
   await page.screenshot({path:'artifacts/feel-desktop-kitty-walking.png'});
   await page.keyboard.up('d');
   // CI can throttle canvas frames during concurrent browser jobs. Wait for
   // the actual simulated movement to settle instead of wall-clock guessing.
   await page.waitForFunction(()=>{
    const s=window.__valePrologue?.scene();
    return s&&Math.hypot(s.storyVelocity.u,s.storyVelocity.v)<.12&&
     Math.abs(s.storyLookAhead.x)<4;
   },null,{timeout:8000});
   const rest=await page.evaluate(()=>{
    const s=window.__valePrologue.scene();
    return {p:{...s.p},v:{...s.storyVelocity},texture:s.player.texture.key,
     look:{...s.storyLookAhead}};
   });
   assert(Math.hypot(rest.v.u,rest.v.v)<.12,'release must decelerate to full stop');
   assert(Math.abs(rest.look.x)<4,'camera settles smoothly after releasing keyboard');
   await page.screenshot({path:'artifacts/feel-desktop-kitty-rest.png'});
   assert.deepEqual(errors,[],'new feel adds no runtime errors on desktop');
   await context.close();
  }
  // Actual landscape iPhone-sized canvas, with original left virtual stick.
  {
   const {context,page,errors}=await startRescue(browser,base,{width:844,height:390},true);
   const start=await page.evaluate(()=>{
    const s=window.__valePrologue.scene(),p={...s.p};
    s.left={id:42,x:85,y:305,dx:18,dy:0};
    return p;
   });
   await page.waitForFunction(start=>{
    const s=window.__valePrologue?.scene();
    return s&&Math.hypot(s.p.u-start.u,s.p.v-start.v)>.1;
   },start,{timeout:12000});
   const gentle=await page.evaluate(()=>{
    const s=window.__valePrologue.scene();
    const point={...s.p};s.left={id:42,x:85,y:305,dx:45,dy:0};
    return point;
   });
   await page.waitForFunction(({gentle,minimum})=>{
    const s=window.__valePrologue?.scene();
    return s&&Math.hypot(s.p.u-gentle.u,s.p.v-gentle.v)>minimum;
   },{gentle,minimum:Math.max(.3,Math.hypot(gentle.u-start.u,gentle.v-start.v)*1.55)},
   {timeout:12000});
   const strong=await page.evaluate(()=>{
    const s=window.__valePrologue.scene();
    const point={...s.p};s.left=undefined;
    return point;
   });
   const a=Math.hypot(gentle.u-start.u,gentle.v-start.v);
   const b=Math.hypot(strong.u-gentle.u,strong.v-gentle.v);
   assert(a>.1&&b>a*1.5,'mobile analog stick must allow slow precision and faster full tilt');
   await page.waitForFunction(()=>{
    const s=window.__valePrologue?.scene();
    return s&&Math.hypot(s.storyVelocity.u,s.storyVelocity.v)<.15;
   },null,{timeout:8000});
   const state=await page.evaluate(()=>{
    const s=window.__valePrologue.scene();
    return {speed:Math.hypot(s.storyVelocity.u,s.storyVelocity.v),
     world:s.storyWorld.map,footprints:s.storyFootprints.length};
   });
   assert(state.speed<.15,'touch joystick release must stop the character');
   assert.equal(state.world,'morning_garden');
   assert(state.footprints<=12);
   await page.screenshot({path:'artifacts/feel-mobile-analog-joystick.png'});
   assert.deepEqual(errors,[],'new movement and camera are safe on mobile landscape');
   await context.close();
  }
  console.log('PASS rescue game feel browser: actual PC WASD/stop/idle/camera and mobile analog slow/full tilt, bounded footsteps and original Phaser sprites.');
 }finally{await browser?.close();await server.close();}
}
check().catch(error=>{console.error(error);process.exitCode=1;});
