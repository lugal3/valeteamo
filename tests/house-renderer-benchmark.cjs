// Reproducible renderer comparison against the untouched starting commit.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const net=require('node:net');
const {chromium}=require('playwright');
(async()=>{
 const baseline=execFileSync('git',['show','9be9867:src/lab/renderer.js'],{encoding:'utf8'});
 const virtual=path.resolve('src/lab/renderer-baseline.js').replaceAll('\\','/');
 const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));
 const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port,strictPort:true},logLevel:'silent',plugins:[{name:'baseline-renderer',resolveId(id){if(id.endsWith('/renderer-baseline.js'))return virtual;},load(id){if(id===virtual)return baseline;}}]});
 await server.listen();let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const results=[];
  for(const version of ['baseline','current'])for(const quality of ['medium','low']){
   const page=await browser.newPage({viewport:{width:960,height:540}});await page.goto('http://127.0.0.1:'+port+'/');
   const result=await page.evaluate(async({version,quality})=>{
    document.body.innerHTML='<canvas style="width:960px;height:540px"></canvas>';
    const module=version==='baseline'?'/src/lab/renderer-baseline.js':'/src/lab/renderer.js';
    const {HouseRenderer}=await import(module),{createHouse}=await import('/src/lab/world.js');
    const renderer=new HouseRenderer(document.querySelector('canvas'),quality),world=createHouse();renderer.rebuild(world.boxes);
    const camera={x:5.95,y:1.63,z:8.65,yaw:Math.PI,pitch:0},samples=[],pixel=new Uint8Array(4);
    for(let i=0;i<16;i++){
     camera.yaw=Math.PI+Math.sin(i*.1)*.07;
     const start=performance.now();renderer.render(camera,true,i/60,true,{bob:0,action:0});
     renderer.gl.readPixels(0,0,1,1,renderer.gl.RGBA,renderer.gl.UNSIGNED_BYTE,pixel);
     if(i>3)samples.push(performance.now()-start);
     await new Promise(r=>requestAnimationFrame(r));
    }
    samples.sort((a,b)=>a-b);const result={version,quality,width:renderer.canvas.width,height:renderer.canvas.height,medianFrameMs:samples[Math.floor(samples.length/2)],p90FrameMs:samples[Math.floor(samples.length*.9)],readbackPixel:[...pixel]};
    renderer.destroy();return result;
   },{version,quality});
   results.push(result);console.log(JSON.stringify(result));await page.close();
  }
  const folder=path.resolve(process.env.HOUSE_QA_DIR||'docs/capturas/casa-3d');fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'rendimiento.json'),JSON.stringify({browser:browser.version(),gpu:'SwiftShader software, not physical mobile hardware',scenario:'Slow camera turn; synchronized pixel readback includes GPU completion',samplesPerCase:12,results},null,2)+'\n');
 }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
