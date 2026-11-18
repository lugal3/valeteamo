const assert=require('node:assert/strict');
const fs=require('node:fs');
const net=require('node:net');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const passBirthdayCountdown=require('./helpers/pass-birthday-countdown.cjs');

const RESCUE_KEY='valeteamo-rescue-v2';
const PROLOGUE_KEY='valeteamo-story-acts-1-2-v1';
const BIRTHDAY_KEY='valeteamo-story-v1';
const SHOTS=process.env.CHECKPOINT_QA_DIR;
const browserType=process.env.CHECKPOINT_QA_BROWSER==='webkit'?webkit:chromium;

async function run(){
 const {createServer}=await import('vite');
 const reserve=net.createServer();
 await new Promise((resolve,reject)=>reserve.once('error',reject).listen(0,'127.0.0.1',resolve));
 const {port}=reserve.address();
 await new Promise(resolve=>reserve.close(resolve));
 const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port,strictPort:true}});
 let browser;
 try{
  await server.listen();
  const url='http://127.0.0.1:'+server.httpServer.address().port+'/';
  browser=await browserType.launch({headless:true,args:browserType===chromium?
   ['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  const page=await browser.newPage({viewport:{width:960,height:540},reducedMotion:'reduce'});
  const screenshotSession=browserType===chromium?await page.context().newCDPSession(page):null;
  const errors=[];
  page.setDefaultTimeout(60000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.clock.setFixedTime(new Date('2026-11-16T15:00:00Z'));
  const read=key=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  const write=(key,value)=>page.evaluate(([key,value])=>localStorage.setItem(key,JSON.stringify(value)),[key,value]);
  const snapshot=()=>page.evaluate(()=>window.__rescueHouse.snapshot());
  const use=(id,activate=true)=>page.evaluate(([id,activate])=>window.__rescueHouse.interactWith(id,activate),[id,activate]);
  const stage=()=>page.evaluate(()=>window.__rescueHouse.story().phase);
  const checkpoint=async()=> (await read(RESCUE_KEY)).houseCheckpoint;
  const shot=async name=>{
   if(!SHOTS)return;
   fs.mkdirSync(SHOTS,{recursive:true});
   const filename=path.join(SHOTS,name+'.png');
   if(screenshotSession){
    const {data}=await screenshotSession.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
    fs.writeFileSync(filename,Buffer.from(data,'base64'));
   }else await page.screenshot({path:filename});
  };

  const openMenu=async()=>{
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await passBirthdayCountdown(page);
   await page.locator('.playtest-menu[data-admin-panel="lp"]').waitFor();
  };
  const continueRescue=async()=>{
   await page.getByRole('button',{name:/Volver a Feliz cumpleaños/}).click();
   await page.getByRole('button',{name:/Continuar el rescate/}).click();
  };
  const waitForHouse=async()=>{
   try{
    await page.waitForFunction(()=>!!window.__rescueHouse&&document.querySelector('#lab-canvas')?.width>300);
   }catch(error){
    console.log('HOUSE_RELOAD_FAILURE',JSON.stringify(await page.evaluate(()=>({
     body:document.body.innerText.slice(0,1400),save:localStorage.getItem('valeteamo-rescue-v2')
    }))),errors);
    throw error;
   }
   await page.locator('.story-prologue').waitFor({state:'detached'});
   assert.equal(await page.locator('#lab3d').count(),1);
   assert.equal(await page.locator('canvas').count(),1,'Only the WebGL house canvas remains');
  };
  const reloadHouse=async()=>{await openMenu();await continueRescue();await waitForHouse();};
  // A mounted canvas can still be awaiting the sprite loads. Navigate only
  // once the prologue is playable, so the test doesn't cancel those requests.
  const waitForPrologue=()=>page.waitForFunction(()=>Boolean(window.__valePrologue?.scene()?.player?.texture));

  await openMenu();
  const birthday={version:1,index:0,unlocked:0,character:'louis',muted:true,started:true,answers:{}};
  await write(BIRTHDAY_KEY,birthday);
  await write(PROLOGUE_KEY,{version:1,stage:'ribbon',hp:5,clues:0,completed:false});
  await continueRescue();
  await page.locator('.story-prologue[data-prologue-stage="ribbon"] canvas').waitFor();
  await waitForPrologue();
  assert.equal(await page.locator('#lab3d').count(),0);
  await shot('01-prologo-reanudado');

  await openMenu();
  const oldPrologue={version:1,stage:'house',hp:5,clues:3,completed:true};
  await write(PROLOGUE_KEY,oldPrologue);
  await continueRescue();
  await waitForHouse();
  assert.equal((await read(RESCUE_KEY)).phase,'house','A prologue saved during handoff reaches the house');
  assert.equal((await checkpoint()).stage,'explore');
  console.log('Checkpoint QA: normal house entry');

  await use('drawer');
  await use('key');
  assert.equal((await snapshot()).puzzle.note,false,'The study key needs no hall note');
  await use('landing-cabinet');
  await use('media-flashlight',false);
  await shot('00-linterna-dentro-del-cajon');
  await use('media-flashlight');
  assert.deepEqual(new Set((await checkpoint()).picked),new Set(['key','media-flashlight']));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await reloadHouse();
  assert.equal((await snapshot()).cinematic,false);
  assert.equal((await snapshot()).notes,0);
  assert.equal((await snapshot()).puzzle.key,true);
  assert(await page.locator('[data-equip=key]').isVisible());
  assert(await page.locator('[data-equip=flashlight]').isVisible());
  await assert.rejects(()=>use('key'),/Not available: key/);
  await shot('02-llave-y-linterna-tras-recarga');
  console.log('Checkpoint QA: study key and upstairs flashlight reloaded');
  await use('piano');
  await page.getByRole('dialog',{name:'Atril vacío'}).waitFor();
  await page.keyboard.press('Escape');
  await use('reading-cabinet');await use('piano-sheet');
  await page.keyboard.press('Escape');
  await use('piano',false);
  console.log('Checkpoint QA: approaching the piano with its score');
  await page.waitForFunction(()=>window.__rescueHouse.pianoPuzzle().placed);
  await use('piano');
  await page.getByRole('dialog',{name:'Piano antiguo'}).waitFor();
  await page.keyboard.press('s');
  await page.getByText(/Nota equivocada/).waitFor();
  await page.keyboard.press('w');
  await page.getByText(/Se acabó el tiempo/).waitFor();
  for(const key of ['w','t','y','h','y','t','s'])await page.keyboard.press(key);
  await page.locator('[data-piano-mode="recital"]').waitFor();
  assert.notEqual((await checkpoint()).pianoSolved,true,'The clue waits for the performance');
  await page.locator('[data-piano-mode="reveal"]').waitFor({timeout:50000});
  await page.getByText(/Melodía completa/).waitFor();
  await page.waitForFunction(()=>window.__rescueHouse.pianoPuzzle().compartment===1);
  assert.equal((await checkpoint()).pianoSolved,true);
  await shot('03-compartimento-del-piano');
  await page.keyboard.press('Escape');
  await use('piano');
  await page.locator('[data-piano-mode="practice"]').waitFor();
  assert.equal((await snapshot()).notes,2,'Practice does not award another clue');
  await page.keyboard.press('Escape');
  await page.evaluate(()=>window.__rescueHouse.setPose({x:6.9,y:3.15,z:10.4,yaw:-Math.PI/2,pitch:-.33}));
  await shot('04-atril-y-compartimento');
  await reloadHouse();
  assert.deepEqual(await page.evaluate(()=>window.__rescueHouse.pianoPuzzle()),
   {picked:true,placed:true,solved:true,compartment:1});
  assert.equal((await snapshot()).notes,2,'Score and compartment clue each persist once');
  console.log('PASS legacy handoff and inventory reload');

  await page.emulateMedia({reducedMotion:'reduce'});
  await use('cocina');
  await use('red-key');
  await use('hatch-rug');
  await page.waitForFunction(()=>window.__rescueHouse.amenities().rug===1);
  await use('basement-hatch');
  assert.equal((await checkpoint()).hatchUnlocked,true);
  await reloadHouse();
  assert.equal(await page.evaluate(()=>window.__rescueHouse.amenities().hatch),1);
  assert(await page.locator('[data-equip="red-key"]').isHidden());
  await assert.rejects(()=>use('red-key'),/Not available: red-key/);

  await use('dormitorio');
  assert.equal((await checkpoint()).stage,'encounter');
  await reloadHouse();
  assert.equal((await snapshot()).position.y,3.15);
  await page.waitForFunction(()=>window.__rescueHouse.story().phase==='arrival');
  assert(await page.locator('[data-equip=key]').isHidden(),'The bedroom already consumed the study key');

  const interior=await read(RESCUE_KEY);
  await write(RESCUE_KEY,{...interior,houseCheckpoint:{...interior.houseCheckpoint,stage:'rest'}});
  await reloadHouse();
  assert.equal(await stage(),'sleep');
  assert.equal(await page.evaluate(()=>window.__rescueHouse.story().pursuer.mode),'sleeping');
  await page.evaluate(()=>window.__rescueHouse.setPose({x:5.74,y:3.15,z:2.4,yaw:0,pitch:0}));
  await page.waitForFunction(()=>['lockdown','hunt'].includes(window.__rescueHouse.story().phase));
  console.log('PASS hatch, bedroom and pursuit reload');

  await write(RESCUE_KEY,{...interior,houseCheckpoint:{...interior.houseCheckpoint,stage:'basement'}});
  await reloadHouse();
  await use('mirror-safe');
  await page.waitForFunction(()=>document.querySelector('#lab-dialog[role="dialog"], #lab-dialog [role="dialog"]')?.getAttribute('aria-label')==='Caja fuerte');
  for(const digit of '1505')await page.keyboard.press(digit);
  await page.keyboard.press('Enter');
  assert.equal((await checkpoint()).safeOpened,true);
  await reloadHouse();
  assert.equal(await stage(),'evaded');
  const safe=await page.evaluate(()=>window.__rescueHouse.mirrorPuzzle());
  assert.equal(safe.opened,true);
  assert.equal(safe.safe.amount,1);
  assert.equal((await snapshot()).notes,3,'The reward appears once in the backpack');

  const beforeTrial=await read(RESCUE_KEY);
  await openMenu();
  await page.getByRole('button',{name:'Casa 3D',exact:true}).click();
  await page.locator('[data-act=start]').click();
  await waitForHouse();
  await use('note-hall');
  assert.deepEqual(await read(RESCUE_KEY),beforeTrial);
  assert.deepEqual(await read(PROLOGUE_KEY),oldPrologue);
  assert.deepEqual(await read(BIRTHDAY_KEY),birthday);
  console.log('PASS solved safe and trial isolation');

  const rcSave={...beforeTrial.houseCheckpoint,stage:'rc-setup',rcOwned:true,trapArmed:true};
  await write(RESCUE_KEY,{...beforeTrial,houseCheckpoint:rcSave});
  await reloadHouse();
  assert.equal(await stage(),'rc-setup');
  assert.equal(await page.evaluate(()=>window.__rescueHouse.louis().phase),'hidden');
  assert.equal(await page.evaluate(()=>window.__rescueHouse.rc().trap.armed),true);
  assert.equal(await page.evaluate(()=>window.__rescueHouse.story().pursuer.active),true);
  assert(await page.locator('[data-equip=rc]').isVisible());

  await write(RESCUE_KEY,{...beforeTrial,houseCheckpoint:{...rcSave,stage:'escape'}});
  await reloadHouse();
  assert.equal(await stage(),'escape');
  assert.equal(await page.evaluate(()=>window.__rescueHouse.louis().phase),'follow');
  assert.equal(await page.evaluate(()=>window.__rescueHouse.rc().trap.closed),true);
  assert.equal(await page.evaluate(()=>window.__rescueHouse.greyCat().active),true);
  assert.equal(await page.evaluate(()=>window.__rescueHouse.amenities().hatch),0);
  await page.evaluate(()=>window.__rescueHouse.setPose({x:5.95,y:0,z:11.30,yaw:0,pitch:0}));
  await page.keyboard.down('w');
  try{await page.waitForFunction(()=>['ending','safe'].includes(window.__rescueHouse.story().phase));}
  finally{await page.keyboard.up('w');}
  await page.getByRole('button',{name:'Ver final',exact:true}).click();
  await page.getByRole('heading',{name:'¡Louis está a salvo!'}).waitFor();
  assert.equal((await read(RESCUE_KEY)).phase,'end');
  assert.equal((await read(RESCUE_KEY)).houseCheckpoint,undefined);
  await page.getByRole('button',{name:'Volver a jugar',exact:true}).click();
  await page.locator('.story-prologue[data-prologue-stage="intro"]').waitFor();
  await waitForPrologue();
  assert.equal(await read(RESCUE_KEY),null);
  assert.equal(await read(PROLOGUE_KEY),null);
  console.log('PASS RC checkpoint and normal ending');

  await write(RESCUE_KEY,{...interior,houseCheckpoint:{version:99,stage:'escape',picked:['key']}});
  await reloadHouse();
  assert.equal(await stage(),'explore');
  assert.equal((await snapshot()).puzzle.key,false);
  assert.equal((await checkpoint()).version,1,'An unknown interior schema falls back to the window');
  await page.locator('#lab-camera-settings > summary').click();
  await page.getByRole('button',{name:'Reiniciar casa',exact:true}).click();
  assert.equal(await checkpoint(),undefined);
  assert.equal((await read(RESCUE_KEY)).phase,'house');
  assert.deepEqual(errors,[]);
  console.log('PASS house checkpoints: legacy handoff, one canvas, keys/safe/hatch, pursuit/RC recovery, trial isolation, escape, reset and corrupt save');
 }finally{await browser?.close();await server.close();}
}

run().catch(error=>{console.error(error);process.exitCode=1;});
