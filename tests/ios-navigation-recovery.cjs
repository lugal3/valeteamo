// Real production-bundle QA: mobile WebKit + Chromium, route transitions,
// rotation and a deliberately broken lazy JS chunk like after a Firebase deploy.
const {preview}=require('vite');
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const scenes=[
 {name:'Contador y colores',ready:'.cosmos-experience'},
 {name:'Animación de partículas',ready:'.cosmos-experience'},
 {name:'Rescate · 2D → 3D',ready:'.valeteamo-splash'},
 {name:'Casa 3D',ready:'#lab3d canvas'},
 {name:'Espejo',ready:'#lab3d canvas'}
];
const boot=async(page,url)=>{
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Administración'}).click();
 await page.getByLabel('Código de acceso').fill('LP');
 await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();
 await page.locator('.playtest-menu[data-admin-panel="lp"]').waitFor({timeout:16000});
};
(async()=>{
 const server=await preview({configFile:false,preview:{host:'127.0.0.1',port:0,strictPort:true}});
 const origin='http://127.0.0.1:'+server.httpServer.address().port+'/';
 const found=fs.readdirSync('dist/assets').filter(f=>/CosmosExperience.*\.js$/.test(f));
 assert(found.length===1,'must be able to simulate a missing hashed cosmos chunk: '+found.join(','));
 fs.mkdirSync('artifacts',{recursive:true});
 try{
  if(process.env.ONLY_FAILED_CHUNK!=='1')for(const [engine,typ] of [['Chromium',chromium],['Safari WebKit',webkit]]){
   const browser=await typ.launch({headless:true,args:engine==='Chromium'?
    ['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
   try{
    const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    for(const item of scenes){
     const page=await context.newPage(),errors=[],assetErrors=[];
     page.on('pageerror',e=>errors.push(e.message));
     page.on('requestfailed',r=>{if(/\.js(?:\?|$)/.test(r.url()))assetErrors.push(r.url()+' '+r.failure()?.errorText);});
     page.on('response',r=>{if(r.status()>=400&&/\.js(?:\?|$)/.test(r.url()))assetErrors.push(r.status()+' '+r.url());});
     try{
      await boot(page,origin);
      await page.getByRole('button',{name:item.name,exact:true}).click();
      await page.locator(item.ready).first().waitFor({timeout:25000});
      await page.waitForTimeout(950);
      assert.equal(await page.locator('[data-scene-recovery],#vale-crash-recovery').count(),0,'no error recovery should show on a working scene');
      assert.equal(assetErrors.length,0,'production lazy modules must load');
      assert.equal(errors.length,0,'no uncaught scene errors');
      if(item.name==='Contador y colores'){
       await page.setViewportSize({width:390,height:844});
       await page.locator('[data-orientation-gate="portrait"]').waitFor({state:'visible'});
       await page.setViewportSize({width:844,height:390});
       await page.waitForFunction(()=>document.querySelector('[data-orientation-gate]')?.getAttribute('data-orientation-gate')==='landscape');
       assert(await page.locator(item.ready).first().isVisible(),'scene survives iPhone rotation');
      }
      if(item.name==='Espejo'){
       assert.equal(await page.locator('#lab3d .lab-error').count(),0,'3D engine must initialize, not just mount a canvas');
      }
      console.log('PASS REAL SCENE',JSON.stringify({engine,route:item.name,canvas:await page.locator('#lab3d canvas').count()}));
     }catch(e){
      const body=await page.locator('body').innerText().catch(()=>'<no body>');
      await page.screenshot({path:'artifacts/ios-failed-'+engine.replace(/\W+/g,'-')+'-'+item.name.replace(/\W+/g,'-')+'.png'}).catch(()=>{});
      console.error('FAIL REAL SCENE',JSON.stringify({engine,route:item.name,message:String(e),errors,assetErrors,body:body.slice(0,1400)}));
      throw e;
     }finally{await page.close();}
    }
    await context.close();
   }finally{await browser.close();}
  }

  // Regression: Vite emits a lazy chunk request after clicking Cosmos.
  // Firebase's SPA rewrite can return index.html instead of a deleted .js.
  for(const [engine,typ] of [['Chromium',chromium],['Safari WebKit',webkit]]){
   const browser=await typ.launch({headless:true,args:engine==='Chromium'?
    ['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
   try{
    const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const page=await context.newPage();
    const events=[];
    page.on('pageerror',e=>events.push('pageerror: '+e.message));
    page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')events.push('console: '+m.text());});
    page.on('requestfailed',r=>events.push('requestfailed: '+r.url()+': '+r.failure()?.errorText));
    const chunk=found[0];
    let blocked=0;
    await page.route('**/assets/'+chunk,route=>{
     blocked++;
     return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>old chunk removed</title>'});
    });
    try{
     await boot(page,origin);
     await page.getByRole('button',{name:'Contador y colores',exact:true}).click();
     try{await page.waitForURL(u=>new URL(u).searchParams.has('_sceneRetry'),{timeout:8000});}
     catch(e){
      const diagnostic=await page.evaluate(()=>({
       url:location.href,body:document.body?.innerText?.slice(0,900),
       root:document.getElementById('root')?.innerHTML.slice(0,900),
       recovery:!!document.querySelector('[data-scene-recovery],#vale-crash-recovery')
      })).catch(()=>null);
      console.log('DIAG MISSING CHUNK',JSON.stringify({engine,chunk,blocked,events,diagnostic}));
      throw e;
     }
     assert.equal(new URL(page.url()).searchParams.get('_sceneRetry'),'1','one automatic cache-refresh retry');
     await boot(page,page.url());
     await page.getByRole('button',{name:'Contador y colores',exact:true}).click();
     await page.locator('[data-scene-recovery],#vale-crash-recovery').first().waitFor({state:'visible',timeout:16000});
     // WebKit may cache a rejected ES module within one browser context even
     // after document reload; a second network request is not guaranteed.
     assert(blocked>=1,'failed lazy module must actually have been requested');
     assert(await page.getByRole('button',{name:/Actualizar/}).first().isVisible(),'visible non-blank recovery action');
     await page.screenshot({path:'artifacts/ios-recovery-'+engine.replace(/\W+/g,'-')+'.png'});
     console.log('PASS MISSING CHUNK RECOVERY',JSON.stringify({engine,blocked,reloaded:true,recoveryVisible:true}));
    }finally{await page.close();await context.close();}
   }finally{await browser.close();}
  }
 }finally{await new Promise(resolve=>server.httpServer.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
