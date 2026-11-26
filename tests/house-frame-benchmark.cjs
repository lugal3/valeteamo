// Same harness for the validated V3 checkout and the optimized checkout.
// Count only animation callbacks that actually submit WebGL world draws.
// This is a headless software-GPU benchmark, not physical iPhone FPS.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),output=process.argv[3]||'frame-benchmark.json';
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({root,configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0},plugins:[{name:'frame-bench-fixture',configureServer(s){
  s.middlewares.use((req,res,next)=>{
   if(req.url!=='/__frame-bench')return next();
   res.setHeader('Content-Type','text/html;charset=utf-8');
   res.end('<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><body><script type="module">import {launchHouse} from "/src/lab/house.js";window.closeHouse=launchHouse(()=>{},"ground",{demo:true,checkpointStore:{checkpoint:{version:2,stage:"explore",picked:[],ventOpen:false,powered:true,emy:{stage:"following",x:5.1,y:0,z:10.65,yaw:3.14159}},save(){}}});</script></body></html>');
  });
 }}]});
 let browser;
 try{
  await server.listen();
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const scenarios=[
   {name:'hall-emy',pose:{x:6,y:0,z:8,yaw:0,pitch:0}},
   {name:'mirror',pose:{x:8.35,y:0,z:5.55,yaw:Math.PI/2,pitch:0}},
   {name:'pursuer',pose:{x:6.2,y:0,z:6.2,yaw:Math.PI/2,pitch:0},threat:true}
  ],reports=[];
  for(const scene of scenarios){
   const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.addInitScript(()=>{
     const draw=WebGLRenderingContext.prototype.drawElements,raf=window.requestAnimationFrame.bind(window);
     let draws=0,active=false,frames=[];
     WebGLRenderingContext.prototype.drawElements=function(...args){if(this.canvas.id==='lab-canvas')draws++;return draw.apply(this,args);};
     window.requestAnimationFrame=cb=>raf(now=>{
      const before=draws,start=performance.now();cb(now);
      if(active&&draws>before)frames.push({now,cpu:performance.now()-start,draws:draws-before});
     });
     window.frameBench={start(){frames=[];active=true;},stop(){active=false;return frames.slice();}};
    });
    await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__frame-bench');
    await page.waitForFunction(()=>!!window.__rescueHouse&&document.querySelector('#lab-canvas')?.width>300,null,{timeout:60000});
    if(await page.locator('#lab-dialog [data-act=start]').isVisible())await page.locator('#lab-dialog [data-act=start]').click();
    await page.waitForFunction(()=>!window.__rescueHouse.snapshot().paused);
    await page.evaluate(scene=>{
     // Identical fixed existing quality preset for both versions, no adaptive
     // switch during the sample. No gameplay or geometry changes.
     const quality=document.querySelector('[data-setting="quality"]');quality.value='low';quality.dispatchEvent(new Event('input',{bubbles:true}));
     window.__rescueHouse.setPose(scene.pose);
     if(scene.threat)window.__rescueHouse.placeThreat({x:8.1,y:0,z:6.2,yaw:Math.PI});
    },scene);
    if(scene.name==='mirror')await page.waitForFunction(()=>window.__rescueHouse.snapshot().mirror.drawn,null,{timeout:30000});
    await page.waitForTimeout(1500);
    await page.evaluate(()=>window.frameBench.start());
    await page.waitForTimeout(8000);
    const result=await page.evaluate(()=>({frames:window.frameBench.stop(),snapshot:window.__rescueHouse.snapshot(),glError:document.querySelector('#lab-canvas').getContext('webgl').getError()}));
    const frames=result.frames,intervals=frames.slice(1).map((f,i)=>f.now-frames[i].now).filter(v=>v>0);
    assert(intervals.length>=5,'Not enough real painted frames: '+scene.name);
    assert.equal(result.snapshot.quality,'low');assert.equal(result.glError,0);assert.deepEqual(errors,[]);
    if(scene.name==='mirror')assert(result.snapshot.mirror.drawn,'Mirror actually rendered');
    const sorted=intervals.slice().sort((a,b)=>a-b),pct=(a,p)=>a.slice().sort((x,y)=>x-y)[Math.ceil(a.length*p)-1];
    const slow=sorted.slice(-Math.max(1,Math.ceil(sorted.length*.01))),avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
    const report={scene:scene.name,quality:'low',samples:intervals.length,fps:1000/avg(intervals),p95:pct(intervals,.95),p99:pct(intervals,.99),low1:1000/avg(slow),hitches:intervals.filter(v=>v>50).length,cpuP95:pct(frames.map(f=>f.cpu),.95),meanDraws:avg(frames.map(f=>f.draws)),geometry:result.snapshot.geometry,mirror:result.snapshot.mirror};
    reports.push(report);console.log(JSON.stringify(report));
   }finally{await page.close();}
  }
  await fs.writeFile(output,JSON.stringify({engine:'Chromium SwiftShader',viewport:'844x390 DPR 1',note:'Painted world callbacks; CPU submission, not GPU duration. Fixed low quality. Not device FPS.',scenarios:reports},null,2)+'\n');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
