const togglePhoneSettings=require('./helpers/toggle-phone-settings.cjs');
// Regression for a real report: #lab3d existed but z-index was "auto"
// and canvas backing buffer stayed 2x2, while the LP fallback obscured the 3D.
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const passBirthdayCountdown=require('./helpers/pass-birthday-countdown.cjs');
(async()=>{
 const {preview}=await import('vite');
 const server=await preview({configFile:false,build:{outDir:process.env.HOUSE_PREVIEW_OUT||'dist'},
  preview:{host:'127.0.0.1',port:0,strictPort:true}});
 try{
  const url='http://127.0.0.1:'+server.httpServer.address().port+'/';
  for(const [name,type] of [['Chromium',chromium],['Safari WebKit',webkit]]){
   if(process.env.HOUSE_PRODUCTION_ENGINE&&type.name()!==process.env.HOUSE_PRODUCTION_ENGINE)continue;
   const browser=await type.launch({headless:true,args:name==='Chromium'?
    ['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
   try{
    const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const matrix=process.env.HOUSE_PRODUCTION_SCENE_MATRIX==='1';
    const scenes=['Espejo','Casa 3D'];
    if(matrix)scenes.push(
     'Dormitorio y rescate','Llegada del secuestrador','Trampilla y rescate',
     'Auto del secuestrador','Levantarse y entrar al armario','Despertar del secuestrador',
     'Cajón y pistas','Nota y caja fuerte','Leer la nota en el espejo','Cambio automático de pila',
     'Interruptor general','Piano del descansillo','Televisor y mando'
    );
    else scenes.push('WebGL bloqueado');
    for(const scene of scenes){
     const page=await context.newPage(),errors=[];
     page.setDefaultTimeout(60000);
     page.on('pageerror',e=>errors.push(e.message));
     try{
      const blocked=scene==='WebGL bloqueado';
      await page.addInitScript(blocked=>{
       if(blocked){
        const original=HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext=function(type,...args){
         if(this.id==='lab-canvas'&&type==='webgl')return null;
         return original.call(this,type,...args);
        };
       }
       const Audio=window.AudioContext??window.webkitAudioContext;
       window.testHouseAudio=[];
       if(Audio)window.AudioContext=class extends Audio{
        constructor(...args){super(...args);window.testHouseAudio.push(this);}
       };
      },blocked);
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.clock.setFixedTime(new Date('2026-11-16T15:00:00Z'));
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await passBirthdayCountdown(page);
      await page.locator('.playtest-menu[data-admin-panel="lp"]').waitFor();
      await page.locator('#lp-tres-d details').evaluateAll(groups=>groups.forEach(group=>{group.open=true;}));
      const entry=scene==='Casa 3D'||blocked
        ?page.getByRole('button',{name:/^Casa 3D(?:\s|·|$)/})
        :page.getByRole('button',{name:scene,exact:true});
      await entry.click();
      if(blocked){
       const fallback=page.locator('#lab3d .lab-error');
       await fallback.getByRole('heading',{name:'No se pudo abrir la casa 3D'}).waitFor();
       await fallback.getByRole('button',{name:'Volver a pruebas'}).click();
       await page.locator('#lab3d').waitFor({state:'detached'});
       await entry.waitFor();
       assert.deepEqual(errors,[]);
       console.log('PASS HOUSE WEBGL FALLBACK',name);
       continue;
      }
      await page.waitForFunction(()=>{
       const root=document.querySelector('#lab3d');
       const canvas=document.querySelector('#lab-canvas');
       return root&&canvas&&canvas.width>300&&canvas.height>150;
      },null,{timeout:90000});
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
      assert(result.canvasWidth>300&&result.canvasHeight>150,'The renderer must resize the default framebuffer to the visible layout');
      assert(result.canvasBounds.width>300&&result.canvasBounds.height>180,'canvas must occupy viewport');
      assert(result.foregroundIs3D,'3D should not be behind LP fallback');
      assert(!result.errors,'3D render error overlay');
      assert.deepEqual(errors,[],'no unhandled JavaScript errors');
      console.log('PASS HOUSE CSS PRODUCTION',JSON.stringify({name,scene,...result}));
      if(scene==='Casa 3D'&&!matrix){
       await page.locator('#lab-dialog [data-act=start]').click();
       if(name==='Chromium'){
        // Lose the context with the real phone Settings open: the interruption
        // modal must not be covered by a stale phone or leave its pause active.
        await togglePhoneSettings(page);
        await page.evaluate(()=>{
         const gl=document.querySelector('#lab-canvas').getContext('webgl');
         const extension=gl.getExtension('WEBGL_lose_context');
         if(!extension)throw Error('Chromium must expose WEBGL_lose_context for this test');
         window.testRestore=()=>extension.restoreContext();
         extension.loseContext();
        });
        await page.getByRole('dialog',{name:'Gráficos interrumpidos'}).waitFor();
        await page.evaluate(()=>window.testRestore());
        await page.getByRole('dialog',{name:'Gráficos interrumpidos'}).waitFor({state:'detached'});
        await page.waitForFunction(()=>{
         const c=document.querySelector('#lab-canvas'),gl=c.getContext('webgl');
         return !gl.isContextLost()&&c.width>100&&c.height>100;
        });
        assert.equal(await page.locator('#lab-canvas').evaluate(c=>c.getContext('webgl').getError()),0);
        assert.equal(await page.evaluate(()=>window.testHouseAudio.length),1,'Renderer recovery retains the audio instance');
        assert(await page.locator('.phone-screen').isHidden(),'Recovered graphics must not leave a stale phone overlay');
        assert(await page.locator('#lab-camera-settings').isHidden(),'Phone settings must release their pause on recovery');
        assert.equal(await page.locator('[data-equip=phone]').getAttribute('aria-pressed'),'true','Recovery preserves the selected equipment');
        // Observe actual frames with the phone equipped, rather than disabling
        // rendering or forcing clicks to make the production test pass.
        await page.evaluate(async()=>{
         const label=document.querySelector('#house-use-phone small'),node=label.firstChild;
         await new Promise(resolve=>{let frames=0;function tick(){if(++frames>=8)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);});
         if(label.firstChild!==node)throw Error('Equipment label was reconstructed during gameplay');
        });
        console.log('PASS HOUSE WEBGL RESTORE',name);
       }
       for(let entryNumber=0;entryNumber<2;entryNumber++){
        await togglePhoneSettings(page);
        await page.locator('.lab-exit').click();
        await page.locator('#lab3d').waitFor({state:'detached'});
        await page.waitForFunction(()=>window.testHouseAudio.every(ctx=>ctx.state==='closed'));
        if(entryNumber===0){
         await entry.click();
         await page.locator('#lab-dialog [data-act=start]').click();
         assert.equal(await page.locator('#lab3d canvas#lab-canvas').count(),1);
        }
       }
       assert.deepEqual(errors,[]);
       console.log('PASS HOUSE REENTRY',name);
      }
     }catch(e){
      const snap=await page.evaluate(()=>({root:!!document.querySelector('#lab3d'),
       canvas:document.querySelector('#lab-canvas')?.outerHTML.slice(0,200),
       body:document.body?.innerText.slice(0,700),
       phone:(()=>{
        const use=document.querySelector('#house-use-phone'),slot=document.querySelector('[data-equip=phone]'),screen=document.querySelector('.phone-screen');
        const r=use?.getBoundingClientRect(),hit=r?.width?document.elementFromPoint(r.x+r.width/2,r.y+r.height/2):null;
        return {selected:slot?.getAttribute('aria-pressed'),useHidden:use?.hidden,useLabel:use?.getAttribute('aria-label'),
         screenHidden:screen?.hidden,settingsOpen:document.querySelector('#lab-camera-settings')?.open,
         hit:hit?.outerHTML.slice(0,180),rootClass:document.querySelector('#lab3d')?.className,focused:document.hasFocus()};
       })()})).catch(()=>null);
      console.error('HOUSE CSS FAILURE',JSON.stringify({name,scene,errors,snap}));
      throw e;
     }finally{await page.close();}
    }
    await context.close();
   }finally{await browser.close();}
  }
 }finally{await new Promise(ok=>server.httpServer.close(ok));}
})().catch(e=>{console.error(e);process.exitCode=1;});
