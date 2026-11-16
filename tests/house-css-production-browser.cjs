// Regression for a real report: #lab3d existed but z-index was "auto"
// and canvas backing buffer stayed 2x2, while the LP fallback obscured the 3D.
const assert=require('node:assert/strict');
const {preview}=require('vite');
const {chromium,webkit}=require('playwright');
(async()=>{
 const server=await preview({configFile:false,preview:{host:'127.0.0.1',port:0,strictPort:true}});
 try{
  const url='http://127.0.0.1:'+server.httpServer.address().port+'/';
  for(const [name,type] of [['Chromium',chromium],['Safari WebKit',webkit]]){
   const browser=await type.launch({headless:true,args:name==='Chromium'?
    ['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
   try{
    const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    for(const scene of ['Espejo','Casa 3D']){
     const page=await context.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(e.message));
     try{
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.getByRole('button',{name:'Administración'}).click();
      await page.getByLabel('Código de acceso').fill('LP');
      await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();
      await page.locator('.playtest-menu[data-admin-panel="lp"]').waitFor();
      await page.getByRole('button',{name:scene,exact:true}).click();
      await page.waitForFunction(()=>{
       const root=document.querySelector('#lab3d');
       const canvas=document.querySelector('#lab-canvas');
       return root&&canvas&&canvas.width>100&&canvas.height>100;
      },{timeout:18000});
      const result=await page.evaluate(()=>{
       const root=document.querySelector('#lab3d');
       const canvas=document.querySelector('#lab-canvas');
       const style=getComputedStyle(root),canvasStyle=getComputedStyle(canvas);
       const bounds=root.getBoundingClientRect(),rc=canvas.getBoundingClientRect();
       const front=document.elementFromPoint(innerWidth/2,innerHeight/2);
       return {zIndex:style.zIndex,position:style.position,canvasWidth:canvas.width,canvasHeight:canvas.height,
        clientWidth:canvas.clientWidth,clientHeight:canvas.clientHeight,
        canvasCSSWidth:canvasStyle.width,canvasCSSHeight:canvasStyle.height,
        rootBounds:{width:bounds.width,height:bounds.height},canvasBounds:{width:rc.width,height:rc.height},
        foregroundIs3D:root.contains(front),errors:document.querySelector('.lab-error')?.textContent||null};
      });
      assert.equal(result.position,'fixed','house must fill screen');
      assert.equal(result.zIndex,'9500','base lab stylesheet must set stacking order');
      assert(result.canvasWidth>100&&result.canvasHeight>100,'WebGL framebuffer must not remain 2x2');
      assert(result.canvasBounds.width>300&&result.canvasBounds.height>180,'canvas must occupy viewport');
      assert(result.foregroundIs3D,'3D should not be behind LP fallback');
      assert(!result.errors,'3D render error overlay');
      assert.deepEqual(errors,[],'no unhandled JavaScript errors');
      console.log('PASS HOUSE CSS PRODUCTION',JSON.stringify({name,scene,...result}));
     }catch(e){
      const snap=await page.evaluate(()=>({root:!!document.querySelector('#lab3d'),
       canvas:document.querySelector('#lab-canvas')?.outerHTML.slice(0,200),
       body:document.body?.innerText.slice(0,700)})).catch(()=>null);
      console.error('HOUSE CSS FAILURE',JSON.stringify({name,scene,errors,snap}));
      throw e;
     }finally{await page.close();}
    }
    await context.close();
   }finally{await browser.close();}
  }
 }finally{await new Promise(ok=>server.httpServer.close(ok));}
})().catch(e=>{console.error(e);process.exitCode=1;});
