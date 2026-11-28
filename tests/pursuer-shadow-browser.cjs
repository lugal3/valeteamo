// Real WebGL depth atlas regression, fixed camera/time, actual house and lights.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});
 const folder=path.resolve(process.env.V2_GLOW_QA_DIR||'artifacts/v32-shadows');
 let browser;
 try{
  await fs.mkdir(folder,{recursive:true});await server.listen();
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/__shadow-proof',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><style>body{margin:0}canvas{width:100vw;height:100vh;display:block}</style><canvas></canvas>'}));
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__shadow-proof');
  const result=await page.evaluate(async()=>{
   const {HouseRenderer}=await import('/src/lab/renderer.js');
   const {createHouse,blocked}=await import('/src/lab/world.js');
   const {SHADOW_TILE,SHADOW_GRID}=await import('/src/lab/lighting.js');
   const canvas=document.querySelector('canvas'),renderer=new HouseRenderer(canvas,'low'),gl=renderer.gl,world=createHouse();
   const lamp=world.lights.fixtures.find(l=>l.circuit.id==='recibidor');
   const actor={active:true,x:5.9,y:0,z:8.8,yaw:Math.PI,facing:Math.PI,walk:.4,speed:1,age:1,mode:'search'};
   const camera={x:5.9,y:1.63,z:8.1,yaw:Math.PI,pitch:-.48};
   if(blocked(world.boxes,actor.x,actor.y,actor.z,.16,1.72))throw Error('Unsafe shadow actor fixture');
   if(!lamp||!renderer.shadows.available)throw Error('Hall light or depth atlas unavailable');
   // Render actual house with only the receiving hall circuit on. Keep animation
   // and viewpoint fixed. Actor is behind camera, not in the visible frame.
   for(const c of world.lights.circuits)c.on=c===lamp.circuit;
   renderer.rebuild(world.boxes.filter(b=>!b.hiddenGeometry||b.emySpec));
   const tile=()=>{
    const pixels=new Uint8Array(SHADOW_TILE*SHADOW_TILE*4);
    gl.bindFramebuffer(gl.FRAMEBUFFER,renderer.shadows.target);
    gl.readPixels(lamp.tile%SHADOW_GRID*SHADOW_TILE,Math.floor(lamp.tile/SHADOW_GRID)*SHADOW_TILE,SHADOW_TILE,SHADOW_TILE,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);return pixels;
   };
   const draw=(actor,time)=>{renderer.render(camera,false,time,false,{reduced:true,pursuer:actor,feetY:0});return {tile:tile(),image:canvas.toDataURL('image/png'),count:renderer.pursuerShadowCaster?.count||0,passes:renderer.shadowPasses,error:gl.getError()};};
   const absent=draw(null,1),present=draw(actor,1),cachedPose=renderer.pursuerShadowPose;
   const steady=draw(actor,1),casterReused=renderer.pursuerShadowPose===cachedPose,removed=draw(null,1);
   let nearer=0,changed=0,residual=0;
   for(let i=0;i<absent.tile.length;i+=4){
    const a=absent.tile[i]*256+absent.tile[i+1],b=present.tile[i]*256+present.tile[i+1],c=removed.tile[i]*256+removed.tile[i+1];
    if(a-b>16)nearer++;if(a!==b)changed++;if(Math.abs(a-c)>16)residual++;
   }
   const summary={nearer,changed,residual,triangles:present.count/3,steadyPasses:steady.passes,casterReused,removedCount:removed.count,errors:[absent.error,present.error,steady.error,removed.error]};
   // Compare identical real frames and shadow atlases with and without
   // static culling; no scene, camera, lighting, time or quality changes.
   const batches=renderer.staticBatches,shadowBatches=renderer.shadowMeshes[0].batches;
   const pixels=()=>{const a=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
   const different=(a,b)=>{let n=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])n++;return n;};
   const parity=[];
   for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const view={...camera,yaw,pitch:0},motion={reduced:true,pursuer:actor,feetY:0};
    const frame=enabled=>{
     renderer.staticBatches=enabled?batches:null;renderer.shadowMeshes[0].batches=enabled?shadowBatches:null;
     renderer.lightPose='';renderer.dirtyLampShadows=new Set(renderer.fixtures);
     renderer.render(view,true,1,false,motion);
     return {image:pixels(),tile:tile(),submitted:renderer.staticSubmitted,draws:renderer.staticDrawCalls,error:gl.getError()};
    };
    const full=frame(false),optimized=frame(true);
    parity.push({yaw,changedPixels:different(full.image,optimized.image),changedShadowBytes:different(full.tile,optimized.tile),full:full.submitted,optimized:optimized.submitted,draws:optimized.draws,errors:[full.error,optimized.error]});
   }
   // Paired fixed-view samples, alternating A/B then B/A to reduce warm-up
   // bias. A one-pixel readback synchronizes the actual software GPU work.
   // Neither side changes quality, pose, animation, lights or camera.
   const paired=[],probe=new Uint8Array(4);
   renderer.quality='medium';
   for(const yaw of [0,Math.PI/2,-Math.PI/2]){
    const view={...camera,yaw,pitch:0},motion={reduced:true,pursuer:actor,feetY:0};
    const measure=enabled=>{
     renderer.staticBatches=enabled?batches:null;renderer.shadowMeshes[0].batches=enabled?shadowBatches:null;
     renderer.lightPose='';renderer.dirtyLampShadows=new Set(renderer.fixtures);
     const start=performance.now();
     renderer.render(view,true,1,false,motion);
     gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,probe);
     return {ms:performance.now()-start,indices:renderer.staticSubmitted,draws:renderer.staticDrawCalls};
    };
    measure(false);measure(true);
    const before=[],after=[];
    for(let i=0;i<6;i++){
     if(i%2===0){before.push(measure(false));after.push(measure(true));}
     else{after.push(measure(true));before.push(measure(false));}
    }
    const median=a=>{const sorted=a.map(x=>x.ms).sort((a,b)=>a-b);return (sorted[2]+sorted[3])/2;};
    paired.push({yaw,beforeMs:median(before),afterMs:median(after),beforeIndices:before[0].indices,afterIndices:after[0].indices,beforeDraws:before[0].draws,afterDraws:after[0].draws,samples:6});
   }
   summary.fixedQualityPaired=paired;
   summary.cullingParity=parity;
   renderer.destroy();return {summary,absent:absent.image,present:present.image,removed:removed.image};
  });
  for(const key of ['absent','present','removed'])await fs.writeFile(path.join(folder,'pursuer-shadow-'+key+'.png'),Buffer.from(result[key].split(',')[1],'base64'));
  await fs.writeFile(path.join(folder,'pursuer-shadow-proof.json'),JSON.stringify(result.summary,null,2));
  assert(result.summary.nearer>8,'Actor must contribute nearer depth to the real hall light: '+JSON.stringify(result.summary));
  assert(result.summary.triangles>0&&result.summary.triangles<2000);
  assert.equal(result.summary.removedCount,0);
  assert(result.summary.residual<3,'Removing actor must clear stale light depth');
  assert.equal(result.summary.casterReused,true,'Stationary caster should reuse its pose (other dynamic objects may still invalidate lights)');
  assert.deepEqual(result.summary.errors,[0,0,0,0]);assert.deepEqual(errors,[]);
  for(const frame of result.summary.cullingParity){assert.equal(frame.changedPixels,0,'Identical camera pixels '+JSON.stringify(frame));assert.equal(frame.changedShadowBytes,0,'Identical light atlas '+JSON.stringify(frame));assert(frame.optimized<=frame.full);assert.deepEqual(frame.errors,[0,0]);}
  console.log('PASS real pursuer shadow atlas: '+JSON.stringify(result.summary));
 }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
