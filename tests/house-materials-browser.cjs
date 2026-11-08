// Identical camera poses/resolutions before and after material work.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
(async()=>{
 const phase=process.env.HOUSE_QA_PHASE||'after',folder=path.resolve('docs/capturas/materiales-3d/'+phase);fs.mkdirSync(folder,{recursive:true});
 const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const {createServer}=await import('vite');
 const reference=process.env.HOUSE_QA_REF;
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port,strictPort:true},plugins:[{name:'material-qa',load(id){if(!reference)return;const normalized=id.replaceAll('\\','/'),index=normalized.indexOf('/src/lab/');if(index<0||!normalized.endsWith('.js'))return;return execFileSync('git',['show',reference+':'+normalized.slice(index+1)],{encoding:'utf8'});},configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url!=='/__material_qa')return next();res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body style="margin:0;background:#302b38"><canvas style="width:960px;height:540px;display:block"></canvas></body></html>');});}}]});
 await server.listen();let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/__material_qa');
  await page.evaluate(async()=>{
   const {HouseRenderer,pickupGeometry}=await import('/src/lab/renderer.js'),{createHouse,setDoor,setDrawer}=await import('/src/lab/world.js');
   window.qa={renderer:new HouseRenderer(document.querySelector('canvas')),world:createHouse(),pickupGeometry,setDoor,setDrawer};
   for(const door of qa.world.objects.filter(o=>o.kind==='door'))setDoor(door,true);
   qa.renderer.rebuild([...qa.world.boxes,...pickupGeometry(qa.world.objects)]);
  });
  const views=[
   ['01-pasillo',{x:5.95,y:1.63,z:8.65,yaw:Math.PI,pitch:0}],
   ['02-salon',{x:8.35,y:1.63,z:5.1,yaw:2.63,pitch:-.18}],
   ['03-escritorio',{x:3.3,y:1.5,z:1.65,yaw:-.4,pitch:-.32}],
   ['04-cajon-cerrado',{x:2.6,y:1.3,z:1.9,yaw:0,pitch:-.35}],
   ['05-dormitorio',{x:3.8,y:4.78,z:4.6,yaw:-2.5,pitch:-.22}],
   ['06-cocina',{x:3.3,y:1.63,z:9.25,yaw:-2.12,pitch:-.25}],
   ['07-vegetacion',{x:11.4,y:1.4,z:6.4,yaw:Math.PI,pitch:-.2}],
   ['08-ventana',{x:10.2,y:1.8,z:11.3,yaw:Math.PI,pitch:-.01}]
  ];
  for(const [name,camera] of views){
   await page.evaluate(camera=>{qa.renderer.render(camera,true,0,true,{bob:0,action:0,reduced:true});qa.camera=camera;},camera);
   await page.screenshot({path:path.join(folder,name+'.png')});
  }
  await page.evaluate(()=>{qa.setDrawer(qa.world.objects.find(o=>o.id==='drawer'),true);qa.renderer.rebuild([...qa.world.boxes,...qa.pickupGeometry(qa.world.objects)]);qa.renderer.render({x:2.6,y:1.6,z:1.9,yaw:0,pitch:-.55},true,0,false);});
  await page.screenshot({path:path.join(folder,'09-cajon-abierto.png')});
  if(phase==='after'){
   await page.evaluate(async()=>{const {animateFurniture,updateFurniture}=await import('/src/lab/furniture-motion.js');const drawer=qa.world.objects.find(o=>o.id==='drawer');qa.setDrawer(drawer,false);animateFurniture(drawer,true);updateFurniture(qa.world.objects,.1);updateFurniture(qa.world.objects,.1);qa.renderer.render({x:2.6,y:1.6,z:1.9,yaw:0,pitch:-.55},true,0,false);});
   await page.screenshot({path:path.join(folder,'10-cajon-abriendo.png')});
   const visible=await page.evaluate(()=>{
    const samples=[];for(const shape of [undefined,'round','cylinder'])for(const [x,y,z] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
     qa.renderer.rebuild([{id:'visibility',shape,x:0,y:1.5,z:0,w:1,h:1,d:1,mat:'cream'}]);
     qa.renderer.render({x:x*3,y:1.5+y*3,z:z*3,yaw:Math.atan2(-x,-z),pitch:Math.atan2(-y,Math.hypot(x,z))},true,0,false);
     const gl=qa.renderer.gl,pixel=new Uint8Array(4);gl.readPixels(Math.floor(qa.renderer.canvas.width/2),Math.floor(qa.renderer.canvas.height/2),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
     samples.push({shape:shape||'box',direction:[x,y,z],pixel:[...pixel]});
    }
    qa.renderer.rebuild([...qa.world.boxes,...qa.pickupGeometry(qa.world.objects)]);return samples;
   });
   assert(visible.every(s=>Math.abs(s.pixel[0]-36)+Math.abs(s.pixel[1]-28)+Math.abs(s.pixel[2]-48)>30),'Culling must preserve the six external views of boxes, paws and flashlight cylinders');
  }
  await page.evaluate(()=>{qa.setDrawer(qa.world.objects.find(o=>o.id==='drawer'),true);qa.renderer.rebuild([...qa.world.boxes,...qa.pickupGeometry(qa.world.objects)]);});
  const metrics=[];
  for(const quality of ['medium','low'])metrics.push(await page.evaluate(async quality=>{
   qa.renderer.quality=quality;const samples=[],pixel=new Uint8Array(4),camera={x:5.95,y:1.63,z:8.65,yaw:Math.PI,pitch:0};
   for(let i=0;i<75;i++){camera.yaw=Math.PI+Math.sin(i*.1)*.07;const start=performance.now();qa.renderer.render(camera,true,i/60,true,{bob:0,action:0});const gl=qa.renderer.gl;gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);if(i>=15)samples.push(performance.now()-start);await new Promise(r=>requestAnimationFrame(r));}
   samples.sort((a,b)=>a-b);return {quality,width:qa.renderer.canvas.width,height:qa.renderer.canvas.height,medianMs:samples[30],p90Ms:samples[54],samples,glError:qa.renderer.gl.getError()};
  },quality));
  assert.deepEqual(errors,[]);assert(metrics.every(m=>m.glError===0));
  fs.writeFileSync(path.join(folder,'mediciones.json'),JSON.stringify({phase,reference:reference||'working-tree',browser:browser.version(),gpu:'SwiftShader software',viewport:{width:960,height:540},samplesPerQuality:60,warmupFrames:15,metrics,errors},null,2)+'\n');
  await page.evaluate(()=>qa.renderer.destroy());
  if(phase==='after'){
   await page.evaluate(async()=>{
    const {materialPixels,MATERIAL_NAMES,ATLAS_SIZE,TILE_SIZE}=await import('/src/lab/materials.js'),packed=materialPixels().color;
    const atlas=document.createElement('canvas');atlas.width=atlas.height=ATLAS_SIZE;const a=atlas.getContext('2d'),data=a.createImageData(ATLAS_SIZE,ATLAS_SIZE);
    for(let i=0;i<packed.length;i+=4){data.data[i]=data.data[i+1]=data.data[i+2]=packed[i];data.data[i+3]=255;}a.putImageData(data,0,0);
    document.body.innerHTML='';const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;document.body.append(canvas);const g=canvas.getContext('2d');g.fillStyle='#f8edf0';g.fillRect(0,0,960,540);g.fillStyle='#473346';g.font='bold 22px system-ui';g.fillText('VALETEAMO · 16 materiales procedimentales',24,34);
    MATERIAL_NAMES.forEach((name,i)=>{const x=24+(i%8)*116,y=62+Math.floor(i/8)*230;g.drawImage(atlas,(i%4)*TILE_SIZE,Math.floor(i/4)*TILE_SIZE,TILE_SIZE,TILE_SIZE,x,y,104,168);g.font='12px system-ui';g.fillText(String(i).padStart(2,'0')+' · '+name,x,y+190);});
   });
   await page.screenshot({path:path.join(folder,'11-catalogo.png')});
  }
  console.log('PASS materials '+phase+': '+JSON.stringify(metrics.map(({samples,...m})=>m)));
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
