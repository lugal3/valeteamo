const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {preview}=require('vite');
const {chromium,webkit}=require('playwright');
(async()=>{
 assert(fs.existsSync('dist/lois-preview.html'),'standalone viewer must be built, not routed to React index');
 const server=await preview({configFile:false,preview:{host:'127.0.0.1',port:0,strictPort:true}});
 const origin='http://127.0.0.1:'+server.httpServer.address().port;
 fs.mkdirSync('artifacts',{recursive:true});
 try{
  for(const [name,engine] of [['Chromium',chromium],['Safari-WebKit',webkit]]){
   const browser=await engine.launch({headless:true,args:name==='Chromium'?
    ['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
   try{
    const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('requestfailed',r=>{if(/assets.*\.js/.test(r.url()))errors.push(r.url()+r.failure()?.errorText);});
    await page.goto(origin+'/lois-preview.html');
    await page.waitForFunction(()=>window.__loisReady||document.getElementById('lois-status')?.classList.contains('error'),{timeout:25000});
    const info=await page.evaluate(()=>{
     const canvas=document.getElementById('lois-canvas');
     return {ready:window.__loisReady===true,status:document.getElementById('lois-status').textContent,
      bytes:canvas.toDataURL('image/png').length,
      pixelBuffer:[canvas.width,canvas.height],
      texture:window.__loisPreview?.renderer.loisFaceTexture?.ready,
      gl:window.__loisPreview?.renderer.gl.getError()};
    });
    assert(info.ready,'standalone WebGL preview failed: '+JSON.stringify({info,errors}));
    assert.equal(info.texture,true,'PS2 portrait atlas present');
    assert.equal(info.gl,0);
    console.log('LOIS VIEWER INFO',JSON.stringify({name,info,errors}));
    await page.screenshot({path:'artifacts/lois-direct-'+name+'.png'});
    assert(info.bytes>5000,'canvas seems empty: '+JSON.stringify(info));
    await page.locator('[data-view="portrait"]').click();
    await page.locator('[data-motion="walk"]').click();
    await page.waitForTimeout(800);
    const moved=await page.evaluate(()=>({view:window.__loisPreview?.view(),
      motion:window.__loisPreview?.motion(),walk:window.__loisPreview?.actor.walk}));
    assert.equal(moved.view,'portrait');
    assert.equal(moved.motion,'walk');
    assert(moved.walk>0,'walking must animate skeleton');
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(300);
    assert(await page.locator('#lois-canvas').isVisible(),'portrait layout must preserve canvas');
    assert.deepEqual(errors,[], 'no viewer script errors');
    console.log('PASS LOIS DIRECT',JSON.stringify({name,info,moved}));

    // The main app must offer a separate HTML rescue entry, not hide the problem.
    await page.goto(origin+'/');
    await page.waitForSelector('#root');
    await page.evaluate(()=>{document.getElementById('root').replaceChildren();});
    await page.locator('#vale-blank-recovery').waitFor({state:'visible',timeout:12000});
    assert.equal(await page.locator('#vale-blank-recovery a[href="/lois-preview.html"]').count(),1);
    const diagnosis=await page.evaluate(()=>document.getElementById('vale-blank-report')?.textContent?.slice(0,250));
    assert(diagnosis,'blank root should provide a diagnosis without requiring console access');
    console.log('PASS BLANK WATCHDOG',JSON.stringify({name,diagnosis}));
    await page.close();
    await context.close();
   }finally{await browser.close();}
  }
 }finally{await new Promise(resolve=>server.httpServer.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
