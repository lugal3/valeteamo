const passBirthdayCountdown=require('./helpers/pass-birthday-countdown.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const {chromium}=require('playwright');
(async()=>{
 const {STAIR,HOUSE}=await import('../src/lab/world.js');
 const folder=path.resolve(process.env.HOUSE_QA_DIR||'docs/capturas/casa-v4');fs.mkdirSync(folder,{recursive:true});
 const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const server=await (await import('vite')).createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port,strictPort:true}});await server.listen();let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:960,height:540},hasTouch:true,isMobile:true});
  await context.addInitScript(()=>{const Base=window.AudioContext;window.__v4Contexts=[];window.AudioContext=class extends Base{constructor(...args){super(...args);this.qaAnalyser=this.createAnalyser();this.qaAnalyser.connect(this.destination);window.__v4Contexts.push(this);}createGain(){const gain=super.createGain(),connect=gain.connect.bind(gain);gain.connect=(target,...args)=>connect(target===this.destination?this.qaAnalyser:target,...args);return gain;}};});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const snap=()=>page.evaluate(()=>window.__rescueHouse.snapshot()),shot=name=>page.screenshot({path:path.join(folder,name+'.png')});
  const pose=async p=>{await page.evaluate(p=>window.__rescueHouse.setPose(p),p);await page.waitForTimeout(220);};
  await page.goto('http://127.0.0.1:'+port+'/');
  const saves=await page.evaluate(()=>{const story=JSON.stringify({version:1,index:0,unlocked:0,character:'louis',muted:true,started:true,answers:{}}),rescue=JSON.stringify({version:2,phase:'trail',heart:true,abducted:true,trail:true,house:false,rescued:false});localStorage.setItem('valeteamo-story-v1',story);localStorage.setItem('valeteamo-rescue-v2',rescue);return {story,rescue};});
  await page.reload();await passBirthdayCountdown(page);await page.locator('.splash-start').waitFor();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Pruebas',exact:true}).click();await page.getByRole('button',{name:/^Casa 3D/}).click();await page.locator('.splash-start').waitFor();await page.keyboard.press('Enter');await page.locator('#lab-dialog [data-act="start"]').click();
  await page.waitForFunction(()=>window.__rescueHouse&&!window.__rescueHouse.snapshot().paused);
  console.log('V4: room gallery and first person');
  const views=[
   ['01-pasillo',{x:5.95,y:0,z:8.65,yaw:Math.PI,pitch:0}],
   ['02-sala-estar',{x:3.7,y:0,z:8.8,yaw:-2.19,pitch:-.12}],
   ['03-estudio',{x:3.6,y:0,z:3.6,yaw:-2.9,pitch:-.24}],
   ['04-cocina',{x:8.3,y:0,z:3.5,yaw:2.77,pitch:-.16}],
   ['05-bano',{x:7.9,y:0,z:5.8,yaw:Math.PI/2,pitch:-.45}],
   ['06-escalera-lateral',{x:STAIR.centerX,y:0,z:STAIR.zBottom+.8,yaw:Math.PI,pitch:.15}],
   ['07-descansillo',{x:8.2,y:3.15,z:5.0,yaw:-.4,pitch:0}],
   ['08-dormitorio',{x:3.9,y:3.15,z:3.6,yaw:-2.5,pitch:-.1}],
   ['09-sala-musica',{x:8.1,y:3.15,z:2.4,yaw:2.53,pitch:-.1}],
   ['10-lectura',{x:3.6,y:3.15,z:8.8,yaw:-2.3,pitch:-.1}],
   ['11-jardin-casa',{x:5.9,y:0,z:15.5,yaw:Math.PI,pitch:.14}],
   ['12-vecindario',{x:5.9,y:0,z:HOUSE.depth+2,yaw:0,pitch:0}],
   ['19-casa-y-jardin-completo',{x:15.5,y:0,z:17.4,yaw:-2.49,pitch:.22}],
   ['20-auto',{x:7.5,y:0,z:12.3,yaw:.846,pitch:-.15}]
  ];
  for(const [name,p] of views){try{await pose(p);}catch(e){throw Error('Invalid gallery pose '+name+': '+e.message);}await shot(name);}
  if((await snap()).doors.find(d=>d.id==='estudio').state==='closed')await page.evaluate(()=>window.__rescueHouse.interactWith('estudio'));await page.waitForFunction(()=>window.__rescueHouse.snapshot().doors.find(d=>d.id==='estudio').open);const door=(await snap()).doors.find(d=>d.id==='estudio');assert(door.open&&door.solid&&Math.abs(door.yaw)>1,'Open leaf stays visible, rotated and physical');
  await pose({x:3.6,y:0,z:3.6,yaw:Math.PI,pitch:0});await shot('13-puerta-abierta');
  console.log('V4: physical stairs and grounded exit');
  await pose({x:STAIR.centerX,y:0,z:STAIR.zBottom+.8,yaw:Math.PI,pitch:0});await page.keyboard.down('w');await page.waitForFunction(z=>{const p=window.__rescueHouse.snapshot().position;return p.y>3.10&&p.z<z;},STAIR.zTop-.1,{timeout:25000});await page.keyboard.up('w');await shot('14-escalera-arriba');
  await page.keyboard.down('s');await page.waitForFunction(z=>{const p=window.__rescueHouse.snapshot().position;return p.y<.05&&p.z>z;},STAIR.zBottom+.15,{timeout:25000});await page.keyboard.up('s');
  if((await snap()).doors.find(d=>d.id==='entrada').state==='closed')await page.evaluate(()=>window.__rescueHouse.interactWith('entrada'));await page.waitForFunction(()=>window.__rescueHouse.snapshot().doors.find(d=>d.id==='entrada').open);await pose({x:5.9,y:0,z:HOUSE.depth-.8,yaw:0,pitch:0});await page.keyboard.down('w');await page.waitForFunction(z=>window.__rescueHouse.snapshot().position.z>z,HOUSE.depth+2.5,{timeout:15000});await page.keyboard.up('w');assert.equal((await snap()).position.y,0);await shot('15-salida-al-jardin');
  console.log('V4: wardrobe entry, louver view, pause, exit and reduced motion');
  await page.evaluate(()=>window.__rescueHouse.interactWith('wardrobe',false));await page.waitForFunction(()=>window.__rescueHouse.snapshot().target==='wardrobe');await page.locator('#lab-interact').click();
  await page.waitForFunction(()=>window.__rescueHouse.snapshot().poseTransition?.elapsed>.35);await shot('16-entrada-armario');
  await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Pausa',exact:true}).waitFor();const frozen=await snap();await page.waitForTimeout(320);assert.deepEqual((await snap()).view,frozen.view);assert.equal((await snap()).wardrobeAmount,frozen.wardrobeAmount);
  await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.waitForFunction(()=>{const s=window.__rescueHouse.snapshot();return s.hidden&&!s.poseTransition;},{timeout:15000});
  const hidden=await snap();assert.equal(hidden.handVisible,false);assert(Math.abs(hidden.view.x-.84)<.01&&Math.abs(hidden.wardrobeAmount-.035)<.005);await shot('17-mirar-rendijas');
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(1200);await page.keyboard.up('ArrowRight');assert((await snap()).camera.yaw<=Math.PI/2+.281,'Hidden keyboard look cannot rotate through cabinet walls');
  await page.keyboard.press('e');await page.waitForFunction(()=>{const s=window.__rescueHouse.snapshot();return !s.hidden&&!s.poseTransition;},{timeout:15000});assert(Math.abs((await snap()).position.x-2.25)<.01);await shot('18-salida-armario');
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.__rescueHouse.interactWith('wardrobe',false));await page.waitForFunction(()=>window.__rescueHouse.snapshot().target==='wardrobe');await page.locator('#lab-interact').click();assert((await snap()).hidden&&!(await snap()).poseTransition);await page.waitForTimeout(300);await page.keyboard.press('e');assert(!(await snap()).hidden&&!(await snap()).poseTransition);await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>window.__rescueHouse.interactWith('underbed',false));await page.waitForFunction(()=>window.__rescueHouse.snapshot().target==='underbed');await page.waitForTimeout(300);await page.locator('#lab-interact').click();await page.waitForFunction(()=>{const s=window.__rescueHouse.snapshot();return s.hidden&&!s.poseTransition;});assert.equal((await snap()).hideType,'underbed');assert(Math.abs((await snap()).view.y-3.43)<.01);await page.keyboard.press('e');await page.waitForFunction(()=>{const s=window.__rescueHouse.snapshot();return !s.hidden&&!s.poseTransition;});
  await page.evaluate(()=>window.__rescueHouse.interactWith('bed'));assert((await snap()).view.y>4.15,'Lying camera stays above the new mattress');await page.waitForTimeout(300);await page.keyboard.press('e');assert(Math.abs((await snap()).position.x-3.85)<.01);
  console.log('V4: tension music signal, independent volume, pause and cleanup');
  await page.locator('#lab-camera-settings > summary').click();
  for(const [key,value] of [['ambient','0'],['effects','0'],['music','.65']])await page.locator('#lab-camera-settings [data-setting="'+key+'"]').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
  await page.locator('.house-mixer > summary').click();await page.locator('#lab-camera-settings [data-setting="mute"]').uncheck();
  await page.getByRole('button',{name:'Probar Música de tensión',exact:true}).click();
  await page.waitForFunction(()=>{const c=window.__v4Contexts.at(-1);if(!c||c.state!=='running')return false;const a=new Float32Array(c.qaAnalyser.fftSize);c.qaAnalyser.getFloatTimeDomainData(a);return a.some(x=>Math.abs(x)>.0005);},{timeout:10000});
  const music=await snap();assert(music.music.timer&&music.music.voices<18&&music.music.scheduled>0);await page.locator('#lab-camera-settings > summary').click();await page.keyboard.press('Escape');assert.equal((await snap()).music.timer,false);await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.waitForFunction(()=>window.__rescueHouse.snapshot().music.timer);
  // Render an original, optional listening sample using exactly the runtime score.
  const pcm=await page.evaluate(async()=>{const {scheduleTensionStep,TENSION_BEAT}=await import('/src/lab/tension-music.js');const ctx=new OfflineAudioContext(1,22050*10.5,22050),bus=ctx.createGain();bus.gain.value=.55;bus.connect(ctx.destination);for(let i=0;i<16;i++)scheduleTensionStep(ctx,bus,.05+i*TENSION_BEAT,i,.65);const buffer=await ctx.startRendering(),data=buffer.getChannelData(0),bytes=new Uint8Array(data.length*2),view=new DataView(bytes.buffer);for(let i=0;i<data.length;i++)view.setInt16(i*2,Math.max(-32768,Math.min(32767,Math.round(data[i]*32767))),true);let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);});
  const data=Buffer.from(pcm,'base64'),header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+data.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(22050,24);header.writeUInt32LE(44100,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(data.length,40);fs.writeFileSync(path.join(folder,'musica-tension.wav'),Buffer.concat([header,data]));
  const final=await snap();await page.locator('#lab-camera-settings > summary').click();await page.locator('.lab-exit').click();await page.waitForFunction(()=>window.__v4Contexts.every(c=>c.state==='closed'));assert.equal(await page.locator('#lab3d').count(),0);
  assert.deepEqual(await page.evaluate(()=>({story:localStorage.getItem('valeteamo-story-v1'),rescue:localStorage.getItem('valeteamo-rescue-v2')})),saves);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(folder,'resultados.json'),JSON.stringify({browser:browser.version(),gpu:'SwiftShader software',roomsCaptured:views.length,physicalStairs:true,groundedExterior:true,openDoor:door,wardrobeView:hidden.view,handHiddenInWardrobe:!hidden.handVisible,underbedAndBedExit:true,musicSignal:true,music:music.music,geometry:final.geometry,normalSavesUnchanged:true,errors},null,2)+'\n');
  console.log('PASS V4:',JSON.stringify({rooms:views.length,wardrobe:true,music:true,geometry:final.geometry,errors}));
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
