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
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/');
  fs.mkdirSync('artifacts',{recursive:true});
  const capture=async(variant,shot,quality='medium')=>{
   const data=await page.evaluate(async ({variant,shot,quality})=>{
    const {HouseRenderer,pickupGeometry}=await import('/src/lab/renderer.js');
    const {LOIS_VISUAL_ID}=await import('/src/lab/lois-ps2-profile.js');
    document.body.innerHTML='<main style="display:grid;place-items:center;margin:0;height:100vh;background:#28303c"><canvas id="loisPreview" width="760" height="500" style="width:760px;height:500px;display:block"></canvas></main>';
    const canvas=document.getElementById('loisPreview');
    const actor={id:'louis-escape',kind:'louis-companion',visualPreset:LOIS_VISUAL_ID,visualVariant:variant,
     x:0,y:0,z:0,yaw:shot==='side'?-Math.PI*.5:0,phase:'follow',walk:0,speed:0,crouch:0,blink:0,age:.5};
    const geo=pickupGeometry([actor]);
    const stage=[
     {id:'stage-floor',x:0,y:-.12,z:0,w:6,h:.18,d:6,mat:'floor',color:[.38,.36,.37],solid:false},
     {id:'stage-wall',x:0,y:1.60,z:-1.2,w:6,h:4,d:.1,mat:'plaster',color:[.42,.44,.48],solid:false}
    ];
    const renderer=new HouseRenderer(canvas,quality);
    renderer.rebuild([...stage,...geo]);
    const camera=shot==='side'?{x:2.6,y:1.2,z:0,yaw:-Math.PI/2,pitch:0}:
     shot==='threequarter'?{x:1.45,y:1.40,z:2.85,yaw:Math.PI+Math.atan(1.45/2.85),pitch:0}:
     {x:0,y:1.40,z:3,yaw:Math.PI,pitch:0};
    renderer.render(camera,true,1,false,{reduced:true});
    const gl=renderer.gl;gl.finish();
    const error=gl.getError();
    const output={dataURL:canvas.toDataURL('image/png'),triangles:renderer.triangleCount,
      vertices:renderer.vertexCount,error,drawn:renderer.dynamicCount};
    renderer.destroy();
    return output;
   },{variant,shot,quality});
   assert.equal(data.error,0,'WebGL must render without errors: '+variant+' '+shot);
   assert(data.drawn>200,'all dynamic geometry is present');
   const png=Buffer.from(data.dataURL.split(',')[1]||'','base64');
   assert(png.length>10000,'preview is a real canvas image, not an empty frame');
   const name='lois-'+variant+'-'+shot+'-'+quality+'.png';
   fs.writeFileSync(path.join('artifacts',name),png);
   console.log('RENDER',JSON.stringify({name,triangles:data.triangles,vertices:data.vertices,pngBytes:png.length}));
   return png;
  };
  const modern=await capture('ps2-b','front');
  await capture('ps2-b','side');
  await capture('ps2-b','threequarter');
  await capture('ps2-b','front','low');
  const old=await capture('legacy','front');
  assert.equal(modern.equals(old),false,'switching the visual preset must materially change the rendered scene');
  assert.deepEqual(errors,[],'no runtime page exceptions');
  console.log('PASS: PS2-B front/profile/three-quarter/low and legacy WebGL captures, reversible and error-free.');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
