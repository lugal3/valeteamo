// Phase 6: isolated mobile-emulated WebGL stress + resource lifecycle QA.
// Uses software SwiftShader in CI: timings are *comparative*, not iPhone FPS.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});
 let browser;
 try{
  await server.listen();
  browser=await chromium.launch({headless:true,args:[
   '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
   '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
  ]});
  const context=await browser.newContext({viewport:{width:812,height:390},
   deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/__lois_stress__',route=>route.fulfill({
   status:200,contentType:'text/html',
   body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>'
  }));
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__lois_stress__');
  const result=await page.evaluate(async()=>{
   const {HouseRenderer,pickupGeometry}=await import('/src/lab/renderer.js');
   const {LOIS_VISUAL_ID}=await import('/src/lab/lois-ps2-profile.js');
   const canvas=document.createElement('canvas');
   canvas.style.cssText='width:812px;height:390px;';
   document.body.appendChild(canvas);
   const renderer=new HouseRenderer(canvas,'medium');
   const stage=[
    {id:'stage',x:0,y:-.1,z:0,w:4,h:.2,d:4,mat:'floor',color:[.40,.40,.4],solid:false},
    {id:'wall',x:0,y:1.4,z:-1.5,w:4,h:3,d:.1,mat:'plaster',color:[.43,.44,.46],solid:false}
   ];
   renderer.rebuild(stage);
   renderer.render({x:0,y:1.5,z:2.5,yaw:Math.PI,pitch:0},true,0,false,{reduced:false});
   if(renderer.loisFaceTexture.uploads!==0||renderer.loisFaceTexture.ready)
    throw Error('Unrelated scene must not download portrait texture');
   const actor={id:'louis-escape',kind:'louis-companion',visualPreset:LOIS_VISUAL_ID,
    x:0,y:0,z:0,yaw:0,phase:'follow',age:0,walk:0,speed:0,crouch:0,blink:0};
   renderer.rebuild([...stage,...pickupGeometry([actor])]);
   if(!await renderer.loisFaceTexture.readyPromise)throw Error('PS2 face atlas missing');
   if(renderer.loisFaceTexture.uploads!==1||renderer.loisFaceTexture.size!==1024)
    throw Error('Face texture must load once in medium');
   const triangles=renderer.triangleCount,vertices=renderer.vertexCount;
   const samples=[],metrics=[];
   const phases=['untying','climb','hide','hidden','follow'];
   for(let i=0;i<150;i++){
    const phase=phases[Math.floor(i/30)];
    actor.phase=phase;actor.age=(i%30)/30;
    actor.speed=phase==='climb'||phase==='follow'?1.5:0;
    actor.walk=i*.07;actor.crouch=phase==='hidden'?1:phase==='hide'?i%30/30:phase==='untying'?.33:0;
    actor.blink=i%18===0?1:0;
    const t0=performance.now();
    renderer.updateDynamic(i/60,{reduced:i%23===0});
    samples.push(performance.now()-t0);
    metrics.push({...renderer.loisRigMetrics});
    if(renderer.gl.getError()!==0)throw Error('GL error in animated pose '+i);
    if(renderer.vertexCount!==vertices||renderer.triangleCount!==triangles)
     throw Error('Animation must not rebuild geometry per frame');
   }
   const uploads=metrics.reduce((a,m)=>a+m.uploads,0);
   if(metrics.some(m=>m.samples!==1||m.uploads>1||m.bytes>400000))
    throw Error('GPU batch regression or CPU rig sampled more than once');
   if(metrics.some(m=>m.parts>60))throw Error('Rig piece count exceeds model');
   if(uploads>150)throw Error('More than one GPU upload per animated frame');
   // Identical pose must not upload again: hash cache in dynamic loop.
   renderer.updateDynamic(10,{reduced:false});
   const before={...renderer.loisRigMetrics};
   renderer.updateDynamic(10,{reduced:false});
   const steady={...renderer.loisRigMetrics};
   if(steady.uploads!==0||steady.bytes!==0)throw Error('Static pose still uploads mesh');
   const camera={x:0,y:1.3,z:2.35,yaw:Math.PI,pitch:0};
   renderer.render(camera,true,2,false,{reduced:false});
   const gl=renderer.gl;
   let error=gl.getError();
   if(error!==0)throw Error('Rendering after stress caused GL error '+error);
   renderer.quality='low';renderer.render(camera,true,2.1,false,{reduced:true});
   if(renderer.loisFaceTexture.size!==512||renderer.loisFaceTexture.uploads!==2)
    throw Error('Switching to low quality must upload 512px texture once');
   renderer.render(camera,true,2.2,false,{reduced:true});
   if(renderer.loisFaceTexture.uploads!==2)throw Error('Same quality reuploaded atlas');
   renderer.quality='medium';renderer.render(camera,true,2.3,false,{reduced:false});
   if(renderer.loisFaceTexture.size!==1024||renderer.loisFaceTexture.uploads!==3)
    throw Error('Switching to medium must restore 1024px atlas once');
   // Older saves must NOT introduce a second mesh/atlas in production.
   const old={...actor,visualVariant:'legacy'};
   renderer.rebuild([...stage,...pickupGeometry([old])]);
   renderer.updateDynamic(4,{reduced:true});
   if(renderer.loisRigMetrics.samples!==1)throw Error('Saved legacy selection must use Photo-A rig');
   if(renderer.loisFaceTexture.uploads!==3)throw Error('Migrated actor reloaded face texture');
   renderer.destroy();
   if(!renderer.loisFaceTexture.disposed)throw Error('GPU atlas must be released when exiting the house');
   // Reenter: resources should be initialized afresh rather than reused after destruction.
   const canvas2=document.createElement('canvas');canvas2.style.cssText=canvas.style.cssText;
   document.body.appendChild(canvas2);
   const second=new HouseRenderer(canvas2,'low');
   second.rebuild([...stage,...pickupGeometry([actor])]);
   if(!await second.loisFaceTexture.readyPromise)throw Error('Face must load on reentry');
   second.render(camera,true,1,false,{reduced:true});
   if(second.loisFaceTexture.uploads!==1||second.loisFaceTexture.size!==512)
    throw Error('Texture state leaked between sessions');
   const secondGlError=second.gl.getError();
   second.destroy();
   if(secondGlError!==0)throw Error('GPU error on house reentry '+secondGlError);
   samples.sort((a,b)=>a-b);
   const pick=q=>Math.round(samples[Math.min(samples.length-1,Math.floor(samples.length*q))]*100)/100;
   return {
    environment:'Chromium SwiftShader software; mobile viewport 812x390 DPR 2, not real iPhone',
    viewport:[812,390],triangleCount:triangles,vertexCount:vertices,
    animatedFrames:150,animatedRigEvaluations:metrics.reduce((a,m)=>a+m.samples,0),
    animatedGpuUploads:uploads,maxUploadsPerFrame:Math.max(...metrics.map(m=>m.uploads)),
    peakGpuBytesPerFrame:Math.max(...metrics.map(m=>m.bytes)),
    staticPoseGpuUploads:steady.uploads,
    timesMs:{median:pick(.5),p95:pick(.95)},
    textureBytes:{low:512*512*4,medium:1024*1024*4},
    textureUploadsPerQualityCycle:3,
    legacyMigration:true,reentry:true,glError:error
   };
  });
  assert.deepEqual(errors,[]);
  fs.mkdirSync('artifacts',{recursive:true});
  fs.writeFileSync(path.join('artifacts','lois-phase6-stress.json'),JSON.stringify(result,null,2)+'\n');
  console.log('PASS LOIS PHASE 6 MOBILE SWIFTSHADER STRESS',JSON.stringify(result));
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
