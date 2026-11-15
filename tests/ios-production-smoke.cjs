// Production-build smoke test for all entries that the iPhone can launch.
// Unlike Vite dev checks, this opens dist through vite.preview with WebKit.
const {preview}=require('vite');
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const server=await preview({configFile:false,preview:{host:'127.0.0.1',port:0,strictPort:true}});
 const port=server.httpServer.address().port;
 const url='http://127.0.0.1:'+port+'/';
 const scenes=[
  {button:'Contador y colores',ready:'.cosmos-experience'},
  {button:'Animación de partículas',ready:'.cosmos-experience'},
  {button:'Rescate · 2D → 3D',ready:'.valeteamo-splash'},
  {button:'Casa 3D',ready:'.rescue-demo'},
  {button:'Espejo',ready:'#lab3d'}
 ];
 try{
  for(const [engine,browserType] of [['Chromium',chromium],['WebKit Safari',webkit]]){
   const browser=await browserType.launch({headless:true,args:engine==='Chromium'?['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
   try{
    const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    for(const scene of scenes){
     const page=await context.newPage(),errors=[],responses=[];
     page.on('pageerror',e=>errors.push(e.stack||e.message));
     page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
     page.on('requestfailed',q=>errors.push('request failed: '+q.url()+' '+q.failure()?.errorText));
     page.on('response',r=>{if(r.status()>=400)responses.push(r.status()+' '+r.url())});
     try{
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.getByRole('button',{name:'Administración'}).click();
      await page.getByLabel('Código de acceso').fill('LP');
      await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();
      await page.locator('.playtest-menu[data-admin-panel="lp"]').waitFor();
      await page.getByRole('button',{name:scene.button,exact:true}).click();
      await page.locator(scene.ready).first().waitFor({timeout:20000});
      if(scene.button==='Espejo')await page.waitForFunction(()=>!!window.__rescueHouse,{timeout:18000});
      if(scene.button==='Casa 3D'){
       // Story entry uses the existing puzzle rescue and might mount 3D after splash.
       await page.waitForTimeout(1400);
      }
      assert.equal(responses.length,0,'production assets must return 200');
      assert(!errors.some(x=>/Failed to fetch dynamically imported module|importing a module script failed|SyntaxError|TypeError|ReferenceError|Shader:/.test(x)),
        'no runtime code loader / WebGL errors');
      console.log('PASS PRODUCTION',JSON.stringify({engine,scene:scene.button,ready:scene.ready,errors:errors.slice(0,3)}));
     }catch(e){
      const snapshot=await page.locator('body').innerText().catch(()=>'<unreadable>');
      console.error('FAIL PRODUCTION',JSON.stringify({engine,scene:scene.button,reason:String(e),url:page.url(),errors,responses,body:snapshot.slice(0,1300)}));
      throw e;
     }finally{await page.close();}
    }
    await context.close();
   }finally{await browser.close();}
  }
 }finally{await new Promise(resolve=>server.httpServer.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
