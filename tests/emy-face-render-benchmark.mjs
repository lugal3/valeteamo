// Matched real HouseRenderer frames. Not a physical-device FPS claim.
import {chromium} from 'playwright';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});let browser;
try{
 await server.listen();browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:'+server.httpServer.address().port+'/__emy-bench';
 await page.route(url,r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body style="margin:0"></body>'}));
 await page.goto(url);
 const results=await page.evaluate(async()=>{
  const {HouseRenderer,pickupGeometry}=await import('/src/lab/renderer.js');
  const {createHouse}=await import('/src/lab/world.js');
  const {poseEmy}=await import('/src/lab/emy-cat.js');
  const {applyReviewAppearance}=await import('/src/lab/review/face-review-model.js');
  const contexts=[],results=[];
  const median=a=>{const s=a.slice().sort((a,b)=>a-b),n=s.length;return (s[(n-1)>>1]+s[n>>1])/2;};
  try{
   for(const variant of ['original','soft','refined']){
    const world=createHouse(),cat=world.emy;
    applyReviewAppearance(cat,variant);cat.yaw=0;poseEmy(cat,{mode:'idle',phase:.7,reduced:true,blend:1});
    const canvas=document.createElement('canvas');canvas.style.cssText='position:absolute;inset:0;width:844px;height:390px;';document.body.append(canvas);
    const renderer=new HouseRenderer(canvas,'medium');contexts.push({variant,renderer,canvas,cat});
    renderer.rebuild([...world.boxes,...pickupGeometry(world.objects)]);
   }
   // All three texture loads have the same warm-up window.
   await new Promise(r=>setTimeout(r,1000));
   function render(ctx,phase){
    const {cat,renderer}=ctx,gl=renderer.gl;
    cat.age=phase;poseEmy(cat,{mode:'walk',phase,walking:true,reduced:true,blend:1});
    const camera={x:cat.x+.65,y:cat.y+.78,z:cat.z+1,yaw:Math.atan2(-.65,-1),pitch:-.29};
    let draws=0,indices=0;
    const draw=gl.drawElements;gl.drawElements=function(...args){draws++;indices+=args[1];return draw.apply(this,args);};
    try{
     const start=performance.now();renderer.render(camera,true,phase,false,{reduced:true,shotLight:.25});
     const cpu=performance.now()-start;
     const pixel=new Uint8Array(4);gl.readPixels(renderer.canvas.width>>1,renderer.canvas.height>>1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
     const sync=performance.now()-start;
     const error=gl.getError();if(error)throw Error('GL '+error+' '+ctx.variant);
     return {cpu,sync,draws,indices,dynamic:renderer.dynamicVertices.length/16,staticSubmitted:renderer.staticSubmitted,size:[renderer.canvas.width,renderer.canvas.height]};
    }finally{gl.drawElements=draw;}
   }
   for(const ctx of contexts)for(let i=0;i<3;i++)render(ctx,.1+i*.1);
   for(const candidate of contexts.slice(1)){
    const pairs=[];
    for(let i=0;i<6;i++){
     const pair={},phase=.7+i*.13;
     for(const ctx of i%2?[candidate,contexts[0]]:[contexts[0],candidate])pair[ctx.variant]=render(ctx,phase);
     pairs.push({before:pair.original,after:pair[candidate.variant]});
    }
    results.push({variant:candidate.variant,pairs,medianCpuBefore:median(pairs.map(p=>p.before.cpu)),medianCpuAfter:median(pairs.map(p=>p.after.cpu)),medianSyncBefore:median(pairs.map(p=>p.before.sync)),medianSyncAfter:median(pairs.map(p=>p.after.sync))});
   }
   return results;
  }finally{for(const {renderer,canvas} of contexts){renderer.destroy();canvas.remove();}}
 });
 for(const row of results){for(const p of row.pairs){
  assert.equal(p.before.dynamic,p.after.dynamic,'same dynamic vertex allocation');
  assert.equal(p.before.draws,p.after.draws,'same draw calls');
  assert.equal(p.before.indices,p.after.indices,'same submitted index count');
  assert.deepEqual(p.before.size,p.after.size);
 }console.log('EMY_RENDER_BENCH '+JSON.stringify(row));}
 assert.deepEqual(errors,[]);
 fs.mkdirSync('output/emy-face-baseline/house',{recursive:true});
 fs.writeFileSync('output/emy-face-baseline/house/performance.json',JSON.stringify({method:'6 alternating matched pairs per candidate, fixed medium, 844x390 DPR1 SwiftShader; synchronous readPixels timing includes GPU wait, not device FPS',results},null,2));
 console.log('PASS identical renderer allocations and draw/index budgets; timings reported, not asserted');
}finally{await browser?.close();await server.close();}
