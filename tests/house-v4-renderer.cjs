// Comparable full-scene measurements, including the new outdoor geometry.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
 const reference=process.env.HOUSE_QA_REF,phase=reference?'before':'after',folder=path.resolve(process.env.HOUSE_QA_DIR||'docs/capturas/casa-v4/'+phase);fs.mkdirSync(folder,{recursive:true});
 const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const server=await (await import('vite')).createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port,strictPort:true},plugins:[{name:'v4-reference',load(id){if(!reference)return;const normalized=id.replaceAll('\\','/'),index=normalized.indexOf('/src/lab/');if(index<0||!normalized.endsWith('.js'))return;return execFileSync('git',['show',reference+':'+normalized.slice(index+1)],{encoding:'utf8'});},configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url!=='/__v4_render')return next();res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body style="margin:0"><canvas style="width:960px;height:540px;display:block"></canvas></body></html>');});}}]});
 await server.listen();let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/__v4_render');
  const geometry=await page.evaluate(async()=>{const {HouseRenderer,pickupGeometry}=await import('/src/lab/renderer.js'),{createHouse}=await import('/src/lab/world.js');window.qa={renderer:new HouseRenderer(document.querySelector('canvas')),world:createHouse()};qa.renderer.rebuild([...qa.world.boxes,...pickupGeometry(qa.world.objects)]);return {vertices:qa.renderer.vertexCount,triangles:qa.renderer.triangleCount};});
  const views=[['pasillo',{x:5.95,y:1.63,z:8.65,yaw:Math.PI,pitch:0}],['exterior',{x:15.5,y:1.63,z:17.4,yaw:-2.49,pitch:.22}]],metrics=[];
  for(const quality of ['medium','low'])for(const [name,camera] of views){
   await page.evaluate(({quality,camera})=>{qa.renderer.quality=quality;qa.renderer.render(camera,true,0,true,{reduced:true});},{quality,camera});
   await page.screenshot({path:path.join(folder,name+'-'+quality+'.png')});
   metrics.push(await page.evaluate(async({quality,name,camera})=>{const samples=[],pixel=new Uint8Array(4);for(let i=0;i<50;i++){const view={...camera,yaw:camera.yaw+Math.sin(i*.1)*.07},start=performance.now();qa.renderer.render(view,true,i/60,true,{reduced:true});const gl=qa.renderer.gl;gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);if(i>=10)samples.push(performance.now()-start);await new Promise(r=>requestAnimationFrame(r));}samples.sort((a,b)=>a-b);return {view:name,quality,width:qa.renderer.canvas.width,height:qa.renderer.canvas.height,medianMs:samples[20],p90Ms:samples[36],samples,glError:qa.renderer.gl.getError()};},{quality,name,camera}));
  }
  assert.deepEqual(errors,[]);assert(metrics.every(m=>m.glError===0));
  fs.writeFileSync(path.join(folder,'mediciones.json'),JSON.stringify({phase,reference:reference||'working-tree',browser:browser.version(),gpu:'SwiftShader software',viewport:{width:960,height:540},samplesPerView:40,warmupFrames:10,geometry,metrics,errors},null,2)+'\n');
  console.log('PASS V4 renderer '+phase+':',JSON.stringify({geometry,metrics:metrics.map(({samples,...m})=>m)}));await page.evaluate(()=>qa.renderer.destroy());
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
