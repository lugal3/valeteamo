const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const {execFileSync}=require('node:child_process');

(async()=>{
 const {createServer}=await import('vite');
 const baseline=process.env.HOUSE_EVENT_BASELINE;
 assert(!baseline||/^[a-f0-9]{7,40}$/.test(baseline),'Expected a Git revision');
 const source=new Map();
 if(baseline){
  for(const file of ['house.js','renderer.js','pursuer.js','basement.js','world.js']){
   source.set(path.resolve('src/lab',file).replaceAll('\\','/'),
    execFileSync('git',['show',baseline+':src/lab/'+file],{encoding:'utf8'}));
  }
 }
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0},plugins:[{
  name:'house-event-perf',enforce:'pre',
  load(id){return source.get(id.replaceAll('\\','/'))??null;},
  configureServer(server){
   server.middlewares.use((req,res,next)=>{
    if(req.url!=='/__event-perf')return next();
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(`<!doctype html><html><meta name="viewport" content="width=device-width, initial-scale=1"><body><button id="launch">Entrar</button>
     <script type="module">
     import {launchHouse} from '/src/lab/house.js';
     import {HouseRenderer} from '/src/lab/renderer.js';
     import {Pursuer} from '/src/lab/pursuer.js';
     const metrics={spans:[],frames:[],longTasks:[],draws:0,bytes:0};
     function watch(prototype,method,name){
      if(typeof prototype[method]!=='function')return;
      const original=prototype[method];
      prototype[method]=function(...args){
       if(!metrics.recording)return original.apply(this,args);
       const start=performance.now(),before=this.dynamicCount;
       try{return original.apply(this,args);}
       finally{
        const end=performance.now();
        const span={name,start,duration:end-start};
        if(method==='updateVisibility')Object.assign(span,{
         before,after:this.dynamicCount,mirror:this.mirrorMeshes[3].indices.length
        });
        metrics.spans.push(span);
        if(method==='render'){
         metrics.frames.push({start,duration:end-start,draws:metrics.draws});
         metrics.draws=0;
        }
       }
      };
     }
     const reset=Pursuer.prototype.reset;
     Pursuer.prototype.reset=function(){window.perfActor=this;return reset.call(this);};
     for(const method of ['rebuild','updateVisibility','prepareMirror','render','updateDynamic','updateShadows'])watch(HouseRenderer.prototype,method,'renderer.'+method);
     watch(Pursuer.prototype,'buildGraph','ai.buildGraph');
     watch(Pursuer.prototype,'plan','ai.plan');
     watch(Pursuer.prototype,'start','ai.start');
     for(const [method,key] of [['drawElements','draws'],['bufferData','bytes'],['bufferSubData','bytes']]){
      const original=WebGLRenderingContext.prototype[method];
      WebGLRenderingContext.prototype[method]=function(...args){
       if(metrics.recording)metrics[key]+=method==='drawElements'?1:
        (args[method==='bufferData'?1:2]?.byteLength||0);
       return original.apply(this,args);
      };
     }
     if(PerformanceObserver.supportedEntryTypes.includes('longtask')){
      new PerformanceObserver(list=>metrics.longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration,source:e.name})))).observe({type:'longtask'});
     }
     window.perfMetrics=metrics;
     document.querySelector('#launch').onclick=()=>{window.stopHouse=launchHouse(()=>{},'ground',{demo:true,trial:true});};
     </script></body></html>`);
   });
  }
 }]});
 const output=path.resolve(process.env.HOUSE_EVENT_QA_DIR||'artifacts/house-event-perf');
 let browser;
 try{
  await fs.mkdir(output,{recursive:true});
  await server.listen();
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const results=[];
  for(const scenario of ['key','hatch','pursuit','combined']){
   const page=await browser.newPage({viewport:{width:640,height:360},reducedMotion:'reduce'});
   page.setDefaultTimeout(90000);
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__event-perf');
    await page.click('#launch');
    await page.click('[data-act=start]');
    await page.locator('#lab-camera-settings > summary').click();
    await page.getByLabel('Calidad gráfica').selectOption('low');
    await page.keyboard.press('Escape');
    const cdp=await page.context().newCDPSession(page),traceEvents=[];
    cdp.on('Tracing.dataCollected',({value})=>{
     traceEvents.push(...value.filter(event=>event.name==='event:'+scenario||event.name==='end:'+scenario||/^(MinorGC|MajorGC)$/.test(event.name)));
    });
    await cdp.send('Tracing.start',{categories:'blink.user_timing,devtools.timeline,v8',transferMode:'ReportEvents'});
    const result=await page.evaluate(async scenario=>{
     const game=window.__rescueHouse,trace=window.perfMetrics;
     const use=id=>game.interactWith(id);
     if(scenario==='key'||scenario==='combined'){await use('switch-estudio');await use('drawer');}
     if(scenario==='hatch'||scenario==='combined'){await use('cocina');await use('red-key');await use('hatch-rug');}
     if(scenario==='pursuit')game.setPose({x:6,y:0,z:8,yaw:0,pitch:0});
     const until=async(count)=>{
      while(trace.frames.length<count)await new Promise(requestAnimationFrame);
     };
     const heapBefore=performance.memory?.usedJSHeapSize;
     trace.recording=true;
     await until(8);
     trace.bytes=0;
     const started=performance.now(),from=trace.frames.length;
     performance.mark('event:'+scenario);
     const actions=[];
     if(scenario==='key'||scenario==='combined')actions.push(use('key'));
     if(scenario==='hatch'||scenario==='combined')actions.push(use('basement-hatch'));
     if(scenario==='pursuit'||scenario==='combined')window.perfActor.start();
     await Promise.all(actions);
     const eventMs=performance.measure('trigger:'+scenario,'event:'+scenario).duration;
     await until(from+24);
     performance.mark('end:'+scenario);
     trace.recording=false;
     const ended=performance.now(),frames=trace.frames.slice(from),previous=trace.frames[from-1];
     const intervals=frames.map((frame,i)=>frame.start-(frames[i-1]||previous).start);
     const stats=values=>{
      const sorted=values.slice().sort((a,b)=>a-b),round=n=>Math.round(n*100)/100;
      return Object.fromEntries([.5,.95,.99,1].map(p=>[p===1?'max':'p'+Math.round(p*100),round(sorted[Math.ceil(p*sorted.length)-1])]));
     };
     const canvas=document.querySelector('#lab-canvas');
     return {scenario,eventMs,frames:frames.length,frameMs:stats(intervals),renderCpuMs:stats(frames.map(f=>f.duration)),
      drawCalls:stats(frames.map(f=>f.draws)),bufferBytes:trace.bytes,heapBefore,heapAfter:performance.memory?.usedJSHeapSize,
      timeline:trace.spans.filter(s=>s.start>=started).map(s=>({...s,start:s.start-started})),
      longTasks:trace.longTasks.filter(s=>s.start+s.duration>started&&s.start<ended).map(s=>({...s,start:s.start-started})),
      canvas:{width:canvas.width,height:canvas.height},key:game.snapshot().puzzle.key,
      hatch:game.amenities().hatch,pursuer:game.story().pursuer.active};
    },scenario);
    const ended=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
    await cdp.send('Tracing.end');await ended;
    const marker=traceEvents.find(e=>e.name==='event:'+scenario),end=traceEvents.find(e=>e.name==='end:'+scenario);
    result.gc=marker&&end?traceEvents.filter(e=>/GC$/.test(e.name)&&e.pid===marker.pid&&e.tid===marker.tid&&e.ts>=marker.ts&&e.ts<end.ts)
     .map(e=>({name:e.name,start:(e.ts-marker.ts)/1000,duration:(e.dur??0)/1000})):null;
    if(scenario==='key'||scenario==='combined')assert(result.key);
    if(scenario==='hatch'||scenario==='combined')assert.equal(result.hatch,1);
    if(scenario==='pursuit'||scenario==='combined')assert(result.pursuer);
    if(!baseline&&scenario!=='pursuit'){
     const visibility=result.timeline.filter(s=>s.name==='renderer.updateVisibility');
     assert.equal(visibility.length,scenario==='combined'?2:1);
     assert(visibility.every(s=>s.after<s.before&&s.after===s.mirror),'The main view and the mirror remove the same indices');
     assert(!result.timeline.some(s=>s.name==='renderer.rebuild'),'These interactions must reuse scene geometry');
    }
    assert.deepEqual(errors,[]);
    results.push(result);
    if(process.env.HOUSE_EVENT_QA_DIR){
     const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true});
     await fs.writeFile(path.join(output,scenario+'.png'),Buffer.from(data,'base64'));
    }
    console.log(JSON.stringify({...result,timeline:undefined,eventSpans:result.timeline.filter(s=>s.name==='renderer.rebuild'||s.name==='renderer.updateVisibility'||s.name.startsWith('ai.'))}));
   }finally{await page.close();}
  }
  await fs.writeFile(path.join(output,'events.json'),JSON.stringify({browser:browser.version(),renderer:'SwiftShader',baseline:baseline??null,results},null,2));
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
