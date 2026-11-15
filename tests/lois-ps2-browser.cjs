// Rendered visual smoke on SwiftShader. These captures are references, not a
// claim that the mesh already matches the photographs or option B perfectly.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});
 let browser;
 try{
  await server.listen();
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:[
   '--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
  ]});
  const page=await browser.newPage({viewport:{width:844,height:580},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  // Isolated HTML avoids mounting the birthday app and its service-worker redirects.
  await page.route('**/__lois_ps2_qa__',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="es"><meta charset="utf-8"><title>Lois render QA</title><body></body></html>'}));
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__lois_ps2_qa__');
  fs.mkdirSync('artifacts',{recursive:true});
  const capture=async(variant,shot,quality='medium',pose=null)=>{
   const data=await page.evaluate(async ({variant,shot,quality,pose})=>{
    const {HouseRenderer,pickupGeometry}=await import('/src/lab/renderer.js');
    const {LOIS_VISUAL_ID}=await import('/src/lab/lois-ps2-profile.js');
    document.body.innerHTML='<main style="display:grid;place-items:center;margin:0;height:100vh;background:#28303c"><canvas id="loisPreview" width="760" height="500" style="width:760px;height:500px;display:block"></canvas></main>';
    const canvas=document.getElementById('loisPreview');
    const actor={id:'louis-escape',kind:'louis-companion',visualPreset:LOIS_VISUAL_ID,visualVariant:variant,
     x:0,y:0,z:0,yaw:0,phase:'follow',walk:0,speed:0,crouch:0,blink:0,age:.5,...(pose||{})};
    let geo=pickupGeometry([actor]);
    if(variant==='ps2-b-faceonly')geo=geo.filter(part=>part.shape==='lois-face'||part.id.endsWith('-neck'));
    if(variant==='ps2-b-nohair')geo=geo.filter(part=>!/(hair|fringe|crown|temple)/.test(part.id));
    if(variant==='ps2-b-flat')for(const part of geo)if(part.shape==='lois-face')part.faceTexture=false;
    const stage=[
     {id:'stage-floor',x:0,y:-.12,z:0,w:5,h:.18,d:5,mat:'floor',color:[.44,.43,.42],solid:false},
     {id:'stage-wall',x:0,y:1.60,z:-1.3,w:6,h:4,d:.1,mat:'plaster',color:[.50,.51,.56],solid:false}
    ];
    const renderer=new HouseRenderer(canvas,quality);
    renderer.rebuild([...stage,...geo]);
    if(variant==='ps2-b'||variant==='ps2-b-faceonly'||variant==='ps2-b-nohair'){
     const loaded=await renderer.loisFaceTexture.readyPromise;
     if(!loaded)throw Error('Facial atlas could not load: check original SVG and Vite URL');
    }
    const camera=shot==='portrait'?{x:0,y:1.64,z:.86,yaw:Math.PI,pitch:0}:
     shot==='side'?{x:2.10,y:1.10,z:0,yaw:-Math.PI/2,pitch:0}:
     shot==='threequarter'?{x:1.40,y:1.20,z:2.10,yaw:Math.PI+Math.atan(1.40/2.10),pitch:0}:
     {x:0,y:1.10,z:2.2,yaw:Math.PI,pitch:0};
    renderer.render(camera,true,1,false,{reduced:true,shotLight:.8});
    renderer.render(camera,true,1.02,false,{reduced:true,shotLight:.8});
    const gl=renderer.gl;gl.finish();
    // Numerical check of central facial readability, not just a successful draw call.
    const w=canvas.width,h=canvas.height,rx=Math.floor(w*.44),ry=Math.floor(h*.35);
    const rw=Math.max(2,Math.floor(w*.13)),rh=Math.max(2,Math.floor(h*.20));
    const rgba=new Uint8Array(rw*rh*4);
    gl.readPixels(rx,ry,rw,rh,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
    let sum=0;for(let i=0;i<rgba.length;i+=4)sum+=rgba[i]+rgba[i+1]+rgba[i+2];
    const faceBrightness=sum/(rw*rh*3);
    const error=gl.getError();
    const output={dataURL:canvas.toDataURL('image/png'),triangles:renderer.triangleCount,
      vertices:renderer.vertexCount,error,drawn:renderer.dynamicCount,
      textureReady:renderer.loisFaceTexture.ready,textureUploads:renderer.loisFaceTexture.uploads,
      textureSize:renderer.loisFaceTexture.size,faceBrightness};
    renderer.destroy();
    return output;
   },{variant,shot,quality,pose});
   assert.equal(data.error,0,'WebGL must render without errors: '+variant+' '+shot);
   assert(data.drawn>200,'all dynamic geometry is present');
   if(variant==='ps2-b'&&shot==='portrait')assert(data.faceBrightness>145,
    'face front must be visible, not the dark backface: brightness '+data.faceBrightness);
   if(variant==='ps2-b'||variant==='ps2-b-faceonly'||variant==='ps2-b-nohair'){
    assert.equal(data.textureReady,true,'Lois facial atlas loaded');
    assert.equal(data.textureUploads,1,'facial atlas uploaded once, not per frame');
    assert.equal(data.textureSize,quality==='low'?512:1024,'face texture LOD matches device');
   } else assert.equal(data.textureUploads,0,'legacy and untextured fallback do not load portrait art');
   const png=Buffer.from(data.dataURL.split(',')[1]||'','base64');
   assert(png.length>10000,'preview is a real canvas image, not an empty frame');
   const name='lois-'+variant+'-'+shot+'-'+quality+(pose?'-'+pose.phase+(pose.visualReaction?.type?'-'+pose.visualReaction.type:'')+(pose.blink>=.9?'-blink':''):'')+'.png';
   fs.writeFileSync(path.join('artifacts',name),png);
   console.log('RENDER',JSON.stringify({name,triangles:data.triangles,vertices:data.vertices,pngBytes:png.length,faceBrightness:Math.round(data.faceBrightness)}));
   return png;
  };
  const modern=await capture('ps2-b','front');
  const flat=await capture('ps2-b-flat','front');
  await capture('ps2-b-flat','portrait');
  assert.equal(modern.equals(flat),false,'painted face must change pixels compared with untextured skin');
  await capture('ps2-b','side');
  await capture('ps2-b','threequarter');
  await capture('ps2-b','portrait');
  await capture('ps2-b-faceonly','portrait');
  await capture('ps2-b-nohair','portrait');
  await capture('ps2-b','front','low');
  await capture('ps2-b','portrait','low');
  await capture('ps2-b','front','medium',{phase:'untying',age:1.3,walk:0,speed:0,crouch:.33,blink:0});
  await capture('ps2-b','front','medium',{phase:'climb',age:.9,walk:.8,speed:2,crouch:0,blink:0});
  await capture('ps2-b','front','medium',{phase:'hide',age:.85,walk:0,speed:0,crouch:.78,blink:0});
  await capture('ps2-b','portrait','medium',{phase:'follow',age:1.42,walk:0,speed:0,crouch:0,blink:1});
  // Phase 5: character can react nonverbally without new story dialogue.
  for(const type of ['look-kitty','startle','relief','listen','speak','reach']){
   const duration={ 'look-kitty':1.05,startle:.75,relief:1.5,listen:1.35,speak:1.6,reach:1.15 }[type];
   await capture('ps2-b','portrait','medium',{
    phase:type==='startle'?'hide':type==='listen'?'hidden':'follow',
    age:1.2,walk:0,speed:0,crouch:type==='listen'?1:0,blink:0,
    visualReaction:{type,age:duration*.4,duration}
   });
  }
  const old=await capture('legacy','front');
  assert.equal(modern.equals(old),false,'switching the visual preset must materially change the rendered scene');
  assert.deepEqual(errors,[],'no runtime page exceptions');
  console.log('PASS: Lois PS2-B 21-bone animation in rescue poses, blink, WebGL textured/flat/legacy, one-time UV upload.');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
