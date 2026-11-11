const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

async function verifyShadows(page,url){
 await page.route('**/__lights',route=>route.fulfill({contentType:'text/html',body:'<canvas style="width:820px;height:460px"></canvas>'}));
 await page.goto(new URL('/__lights',url).href);
 const result=await page.evaluate(async()=>{
  const {HouseRenderer}=await import('/src/lab/renderer.js');
  const {FLASH_REACH,SHADOW_TILE}=await import('/src/lab/lighting.js');
  const canvas=document.querySelector('canvas'),renderer=new HouseRenderer(canvas),gl=renderer.gl;
  const floor={id:'base',x:0,y:-.1,z:0,w:10,h:.2,d:12,mat:'plaster',solid:true};
  const door={id:'door-test',x:0,y:1.55,z:1.3,w:.18,h:3.1,d:5,mat:'wood',solid:true,dynamic:true};
  const bulb={x:-1.4,y:2.6,z:1.2,tile:1,circuit:{on:false}};
  const view={x:0,y:4.5,z:-5,yaw:0,pitch:-.58},pixel=new Uint8Array(4);
  function floorBrightness(x){
   const y=-view.y,z=1.2-view.z,c=Math.cos(view.pitch),s=Math.sin(view.pitch);
   const depth=y*s+z*c;
   const screenX=canvas.width/2+canvas.height*.65*x/depth;
   const screenY=canvas.height/2+canvas.height*.65*(y*c-z*s)/depth;
   gl.readPixels(Math.floor(screenX),Math.floor(screenY),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
   return (pixel[0]+pixel[1]+pixel[2])/3;
  }
  const samples=[];
  for(const [quality,height] of [['medium',2.6],['low',3.1]]){
   renderer.quality=quality;bulb.circuit.on=false;door.x=0;door.y=height/2;door.h=height;
   renderer.rebuild([floor,door,{id:'bulb',x:bulb.x,y:2.72,z:bulb.z,w:.12,h:.12,d:.12,mat:'paper',fixture:bulb}]);
   renderer.render(view,false,0);
   const off=[floorBrightness(-1),floorBrightness(1)];
   bulb.circuit.on=true;renderer.render(view,false,0);
   const closed=[floorBrightness(-1),floorBrightness(1)];
   door.x=3.6;renderer.render(view,false,0);
   samples.push({quality,off,closed,open:floorBrightness(1)});
  }
  const obstacle={...door,x:0,y:1.6,z:-2,w:2,d:.16};
  renderer.rebuild([floor,obstacle]);
  renderer.render({x:0,y:1.6,z:-4,yaw:0,pitch:0},true,0);
  gl.bindFramebuffer(gl.FRAMEBUFFER,renderer.shadows.target);
  gl.readPixels(SHADOW_TILE/2,SHADOW_TILE/2,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
  const flashDepth=(pixel[0]+pixel[1]/255)*FLASH_REACH/255;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  const error=gl.getError();
  renderer.destroy();
  return {samples,flashDepth,error};
 });
 for(const {quality,off,closed,open} of result.samples){
  assert(off[1]<25,quality+' keeps the unlit interior dark');
  assert(closed[0]>off[0]+20,quality+' renders light on the near side');
  assert(Math.abs(closed[1]-off[1])<4,quality+' blocks light behind a closed door '+JSON.stringify({off,closed,open}));
  assert(open>closed[1]+12,quality+' updates the shadow when the door moves');
 }
 assert(Math.abs(result.flashDepth-1.86)<.06,'The flashlight shadow map is active in low detail');
 assert.equal(result.error,0);
 console.log('PASS sombra de ampolleta y linterna',JSON.stringify(result.samples));
}

async function verifySwitches(page,url){
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(url);
 await page.locator('.splash-start').waitFor();await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Pruebas',exact:true}).click();
 await page.getByRole('button',{name:/^Casa 3D/}).click();
 await page.click('#lab-dialog [data-act=start]');await page.click('[data-act=skip-intro]');
 const meter=page.getByRole('meter',{name:'Batería de la linterna'});
 await meter.waitFor();assert.equal(await meter.getAttribute('aria-valuenow'),'100');
 await page.keyboard.press('f');
 await page.waitForFunction(()=>!window.__rescueHouse.snapshot().flashlight);
 const switches=await page.evaluate(async()=>{
  const {createHouse}=await import('/src/lab/world.js');
  return createHouse().objects.filter(o=>o.kind==='light-switch').map(o=>o.id);
 });
 const use=(id,activate=true)=>page.evaluate(([id,activate])=>window.__rescueHouse.interactWith(id,activate),[id,activate]);
 await use('switch-estudio',false);
 await page.getByRole('button',{name:'Encender luz',exact:true}).waitFor();
 await page.keyboard.press('e');
 await page.getByRole('button',{name:'Apagar luz',exact:true}).waitFor();
 const study={x:3.82,y:0,z:2.92,yaw:-1.28,pitch:.16};
 const pose=point=>page.evaluate(point=>window.__rescueHouse.setPose(point),point);
 const folder=process.env.HOUSE_QA_DIR;
 if(folder){
  fs.mkdirSync(folder,{recursive:true});await pose(study);
  await page.screenshot({path:path.join(folder,'estudio-encendido.png')});
 }
 await use('switch-estudio');await page.getByRole('button',{name:'Encender luz',exact:true}).waitFor();
 if(folder){
  await pose(study);await page.screenshot({path:path.join(folder,'estudio-apagado.png')});
 }
 assert.equal(await meter.getAttribute('aria-valuenow'),'100','The lamp alone uses no battery');
 await page.keyboard.press('f');
 await page.waitForFunction(()=>Number(document.querySelector('#house-charge').getAttribute('aria-valuenow'))<100);
 if(folder){
  await pose(study);await page.screenshot({path:path.join(folder,'estudio-linterna.png')});
  await use('note-hall',false);await page.screenshot({path:path.join(folder,'nota-papel.png')});
  await use('battery-hall',false);await page.screenshot({path:path.join(folder,'pila-modelo.png')});
 }
 await use('battery-hall');
 await page.keyboard.press('f');
 await page.waitForFunction(()=>!window.__rescueHouse.snapshot().flashlight);
 const remaining=await meter.getAttribute('aria-valuenow');
 await page.keyboard.press('i');
 const bag=page.getByRole('dialog',{name:'Mi mochila'});
 assert.match(await bag.textContent(),new RegExp('Linterna: '+remaining+'%.*Pilas de repuesto: 2'));
 await meter.waitFor({state:'hidden'});
 await bag.getByRole('button',{name:/^Usar pila/}).click();
 assert.match(await bag.textContent(),/Linterna: 100%.*Pilas de repuesto: 1/);
 await bag.getByRole('button',{name:'Cerrar mochila'}).click();
 await meter.waitFor();
 assert.equal(await meter.getAttribute('aria-valuenow'),'100');
 for(const id of switches)await use(id);
 await use('switch-escalera-1',false);
 await page.getByRole('button',{name:'Encender luz',exact:true}).waitFor();
 await pose({x:8.35,y:0,z:5.55,yaw:Math.PI/2,pitch:.15});
 await page.waitForFunction(()=>window.__rescueHouse.snapshot().mirror.drawn);
 if(folder)await page.screenshot({path:path.join(folder,'bano-encendido.png')});
 assert.equal(await page.locator('#lab-canvas').evaluate(canvas=>canvas.getContext('webgl').getError()),0);
 assert.deepEqual(errors,[]);
 console.log('PASS '+switches.length+' interruptores, escalera, espejo, consumo y recarga de la linterna');
}

(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});
 await server.listen();
 let browser;
 try{
  browser=await chromium.launch({args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const url='http://127.0.0.1:'+server.httpServer.address().port+'/';
  const page=await browser.newPage({viewport:{width:960,height:540}});
  await verifyShadows(page,url);
  await verifySwitches(page,url);
 }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
