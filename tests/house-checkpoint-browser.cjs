const togglePhoneSettings=require('./helpers/toggle-phone-settings.cjs');
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
  const launchBrowser=()=>browserType.launch({headless:true,args:browserType===chromium?
   ['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  let page,screenshotSession;
  const errors=[];
  const freshPage=async()=>{
   if(browser)await browser.close();
    browser=await launchBrowser();
    page=await browser.newPage({viewport:{width:960,height:540},reducedMotion:'reduce'});
   screenshotSession=browserType===chromium?await page.context().newCDPSession(page):null;
   page.setDefaultTimeout(60000);
   page.on('pageerror',error=>errors.push(error.message));
   await page.clock.setFixedTime(new Date('2026-11-16T15:00:00Z'));
  };
  await freshPage();
  const read=key=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  const write=(key,value)=>page.evaluate(([key,value])=>localStorage.setItem(key,JSON.stringify(value)),[key,value]);
  const snapshot=()=>page.evaluate(()=>window.__rescueHouse.snapshot());
  const use=(id,activate=true)=>page.evaluate(([id,activate])=>window.__rescueHouse.interactWith(id,activate),[id,activate]);
  const stage=()=>page.evaluate(()=>window.__rescueHouse.story().phase);
  const field=()=>page.locator('.field-overlay:not([hidden])');
  const dismissField=async id=>{await page.waitForFunction(id=>window.__rescueHouse?.story().tutorial===id,id);assert((await snapshot()).paused,'Field tutorial really pauses the game');await clickTrialButton(field().locator('[data-field-close]'));await field().waitFor({state:'hidden'});};
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

  // Physical mouse input at an independently verified hit-tested button.
  // Avoid Playwright waiting for multiple stable animation frames on a
  // deliberately throttled five-FPS trial preview.
  const clickTrialButton=async locator=>{
   await locator.waitFor({state:'visible'});
   const point=await locator.evaluate(el=>{
    // Native immediate scroll, no Playwright animation-stability wait.
    // Verify the actual target is enabled and hit-testable before mouse input.
    el.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
    const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
    if(el.disabled||!el.contains(document.elementFromPoint(x,y)))throw Error('Trial button is not actually clickable');
    return {x,y};
   });
   await page.mouse.click(point.x,point.y);
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

  // Exercise the real LP route (not only a seeded checkpoint fixture).
  // Inspect the actor before pressing start, then verify the live piano trial.
  await openMenu();
  const trialCases=[...Array.from({length:12},(_,i)=>['hito-'+(i+1),i<7]),
   ...['mirror','drawer','safe','mirror-note','bedroom','arrival','wardrobe','wake','battery','power','piano','basement','television'].map(id=>[id,true]),['car',false]];
  for(const [index,[id,visible]] of trialCases.entries()){
   // Release the entire shared software GPU process between heavy previews.
    // Every card still uses the actual menu, physical click and exit.
    if(index>0){await freshPage();await openMenu();}
   const card=page.locator('button[aria-labelledby="trial-'+id+'"]');
   await card.waitFor({state:'attached'});
   if(!await card.isVisible())await card.evaluate(el=>{el.closest('details').open=true;});
   console.log('LP trial: '+id);
   try{
    // This is a React state transition, not a document navigation. Wait for
    // the real start card below instead of Playwright's unrelated navigation.
    await clickTrialButton(card);
    await page.locator('#lab-dialog [data-act="start"]').or(page.locator('#lab3d .lab-error')).or(page.getByRole('alert').filter({hasText:'No se pudo abrir esta prueba'})).waitFor({timeout:60000});
    const bootError=await page.locator('#lab3d .lab-error').count();
    if(bootError)throw Error(await page.locator('#lab3d .lab-error').innerText());
    // React can mount a new scene while the previous effect is cleaning up.
    // Do not eagerly resolve locator.innerText on a detached root just to
    // construct an assertion message. Wait for the new live harness instead.
    // Poll the mounted DOM/DEV API by timer, independently of throttled
    // requestAnimationFrame on the static software-WebGL preview.
    await page.waitForFunction(()=>Boolean(window.__rescueHouse&&document.querySelector('#lab3d #lab-dialog [data-act="start"]')),null,{timeout:60000,polling:250});
    assert.equal(await page.locator('#lab3d .lab-error').count(),0);
   }catch(error){
    console.log('LP_TRIAL_FAILURE',id,await page.evaluate(()=>({body:document.body.innerText.slice(0,1600),api:!!window.__rescueHouse,root:!!document.querySelector('#lab3d'),start:!!document.querySelector('#lab3d #lab-dialog [data-act="start"]'),visibility:document.visibilityState})),errors);
    throw error;
   }
   const state=await snapshot(),cat=await page.evaluate(()=>window.__rescueHouse.emy());
   assert.equal(cat.hidden,!visible,'LP '+id+' must have the correct initial visibility');
   assert.equal(cat.companion,visible?'following':id==='car'?'waiting':'trunk','LP '+id+' companion controller');
   assert.equal(cat.entrance,undefined,'No repeated window entrance in '+id);
   if(visible){
    assert(Math.abs(cat.y-state.position.y)<.13,'LP '+id+' must place Emy on Kitty’s floor');
    assert(Math.hypot(cat.x-state.position.x,cat.z-state.position.z)<=3.11,'LP '+id+' Emy nearby');
   }
   if(id==='piano'||id==='hito-1'){
    await page.locator('#lab-dialog [data-act="start"]').click();
    await page.waitForFunction(()=>!window.__rescueHouse.snapshot().paused);
    assert.equal((await page.evaluate(()=>window.__rescueHouse.emy())).hidden,false);
    await use('emy-upstairs');
    await dismissField('emy');
    assert((await page.evaluate(()=>window.__rescueHouse.story().tutorials)).includes('emy'),'LP uses the actual Emy guide');
    assert.equal((await page.evaluate(()=>window.__rescueHouse.emySkills())).menu,true,'Companion actions work in '+id);
    await shot('trial-'+id+'-emy-actions');
    await page.locator('#house-emy-menu [data-act="emy:close"]').click();
    await page.keyboard.press('Escape');
   }
   const exit=page.locator('#lab-dialog [data-act="exit"]');
   await exit.waitFor({state:'visible'});
   await clickTrialButton(exit);
   await page.waitForFunction(()=>!window.__rescueHouse&&!document.querySelector('#lab3d'),null,{polling:250,timeout:60000});
   await page.locator('.playtest-menu[data-admin-panel="lp"]').waitFor();
   console.log('PASS LP '+id+' — '+cat.companion);
  }
  console.log('PASS LP checkpoint companions: same-floor visible Emy before hatch, hidden at basement/escape, live actions and isolated car');

   await freshPage();await openMenu();
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
  await field().waitFor();await shot('00c-tutorial-movimiento');await dismissField('movement');
  assert((await checkpoint()).tutorials.includes('movement'));
  await page.locator('[data-equip=phone]').click();
  await page.getByRole('button',{name:'Usar teléfono',exact:true}).click();
  await dismissField('phone');
  await clickTrialButton(page.locator('button[data-home-page="1"]'));
  await page.locator('button[data-app=manual]').waitFor({state:'visible'});
  await clickTrialButton(page.locator('button[data-app=manual]'));
  assert.equal(await page.locator('[data-manual=movement]').count(),1);assert.equal(await page.locator('[data-manual=hide]').count(),0);
  await clickTrialButton(page.locator('[data-manual=movement]'));await dismissField('movement');
  await clickTrialButton(page.locator('.phone-shell [data-app=close]'));
  await page.waitForFunction(()=>!window.__rescueHouse.snapshot().paused,null,{timeout:30000});
  await require('./helpers/fetch-ribbon.cjs')(page);
  await dismissField('threat');
  assert.equal((await snapshot()).puzzle.note,false,'The study key needs no hall note');
  // Torch is on top of the landing cabinet; this drawer contains no quest item.
  // The rescue must not require opening an irrelevant drawer first.
  await use('media-flashlight',false);
  await shot('00-linterna-sobre-mueble');
  await use('media-flashlight');
  assert.deepEqual(new Set((await checkpoint()).picked),new Set(['key','media-flashlight','screwdriver']),
   'The vent screwdriver collected earlier must survive checkpoint saves too');
  if(SHOTS){
   // Capture the relocated Christmas tree from the open upstairs corridor.
   await page.evaluate(()=>window.__rescueHouse.setPose({x:5.65,y:3.15,z:2.8,yaw:Math.atan2(1.10,-1.925),pitch:-.12}));
   await page.waitForFunction(()=>window.__rescueHouse.snapshot().position.x===5.65);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await shot('00b-arbol-navideno-pasillo-esquina-a');
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  await reloadHouse();
  assert.equal((await snapshot()).cinematic,false);
  assert.equal(await field().count(),0,'Seen tutorials do not recur on reload');
  assert.equal((await snapshot()).notes,0);
  assert.equal((await snapshot()).puzzle.key,true);
  assert(await page.locator('[data-equip=key]').isVisible());
  assert(await page.locator('[data-equip=flashlight]').isVisible());
  await assert.rejects(()=>use('key'),/Not available: key/);
  await shot('02-llave-y-linterna-tras-recarga');
  console.log('Checkpoint QA: study key and upstairs flashlight reloaded');
  await use('piano');
  await page.locator('[data-piano-mode="free"]').waitFor();
  await page.keyboard.press('a');
  assert.equal(await page.locator('.piano-keys [aria-current]').count(),0);
  assert.equal(await page.locator('input[data-setting="master"]').getAttribute('max'),'3');
  await page.keyboard.press('Escape');
  await use('dormitorio');
  assert.equal((await checkpoint()).stage,'encounter');
  await reloadHouse();
  assert.equal((await snapshot()).position.y,3.15);
  await page.waitForFunction(()=>window.__rescueHouse.story().phase==='arrival');
  assert(await page.locator('[data-equip=key]').isHidden(),'The bedroom already consumed the study key');

  const interior=await read(RESCUE_KEY);
  await page.waitForFunction(()=>window.__rescueHouse.story().tutorial==='hide',null,{timeout:60000});
  assert.equal(await page.evaluate(()=>window.__rescueHouse.story().remaining),10);
  await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__rescueHouse.story().remaining),10,'Reading time is not survival time');
  await shot('02b-tutorial-escondite');await dismissField('hide');
  await page.locator('.field-countdown').waitFor();
  await use('wardrobe');
  await page.waitForFunction(()=>window.__rescueHouse.snapshot().hidden);
  // Wait for the actual survival outcome, not the software GPU's wall clock.
  const awaitHideOutcome=async expected=>{
   try{
    const result=await page.waitForFunction(()=>{
     const {phase}=window.__rescueHouse.story();
     return phase==='patrol'||phase==='failed'?phase:false;
    },null,{timeout:240000,polling:500});
    const actual=await result.jsonValue();await result.dispose();
    assert.equal(actual,expected,'Real ten-second hiding outcome');
   }catch(error){
    console.log('HIDE_DEADLINE_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>({story:window.__rescueHouse.story(),snapshot:window.__rescueHouse.snapshot(),emy:window.__rescueHouse.emy()}))));
    throw error;
   }
  };
  await awaitHideOutcome('patrol');
  assert.equal(await page.evaluate(()=>window.__rescueHouse.story().pursuer.y),3.15,'Pursuer has already climbed by the deadline');
  assert((await checkpoint()).tutorials.includes('hide'));
  await page.waitForFunction(()=>window.__rescueHouse.story().tutorial==='stealth');await shot('02c-tutorial-sigilo');await dismissField('stealth');
  const seen=(await checkpoint()).tutorials;assert(seen.includes('stealth'));
  await write(RESCUE_KEY,{...interior,houseCheckpoint:{...interior.houseCheckpoint,tutorials:seen}});
  await reloadHouse();
  await page.waitForFunction(()=>window.__rescueHouse.story().phase==='hide',null,{timeout:60000});
  assert.equal(await field().count(),0,'Hide tutorial does not repeat on retry');
  await awaitHideOutcome('failed');
  assert.equal(await page.evaluate(()=>window.__rescueHouse.story().pursuer.y),3.15);
  assert.equal((await checkpoint()).lives,2,'Exactly one life lost at zero');
  console.log('PASS field manual, paused reading, successful hiding and deadline capture');
  await write(RESCUE_KEY,{...interior,houseCheckpoint:{...interior.houseCheckpoint,tutorials:seen,stage:'rest'}});
  await reloadHouse();
  assert.equal(await stage(),'sleep');
  assert.equal(await page.evaluate(()=>window.__rescueHouse.story().pursuer.mode),'sleeping');
  await page.evaluate(()=>window.__rescueHouse.setPose({x:5.74,y:3.15,z:2.4,yaw:0,pitch:0}));
  await page.waitForFunction(()=>['lockdown','hunt'].includes(window.__rescueHouse.story().phase));
  console.log('PASS hatch, bedroom and pursuit reload');


  await write(RESCUE_KEY,{...interior,houseCheckpoint:{...interior.houseCheckpoint,stage:'basement'}});
  await reloadHouse();
  await require('./helpers/solve-mirror-safe.cjs')(page);
  await use('piano-sheet');
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
  await page.getByText('Hoja 2 de 2',{exact:true}).waitFor();
  assert.equal(await page.locator('[data-piano-mode="intro"]').count(),1);
  await page.keyboard.press('s');
  await page.getByText(/Nota equivocada/).waitFor();
  await page.getByText('Hoja 2 de 2',{exact:true}).waitFor();
  for(const key of ['j','j','h','y','h','y','t'])await page.keyboard.press(key);
  await page.locator('[data-piano-mode="recital"]').waitFor();
  assert.notEqual((await checkpoint()).pianoSolved,true,'The red key waits for the performance');
  // Reveal is a short animation and may be skipped between SwiftShader frames.
  // Assert the durable puzzle solution instead of a transient CSS mode.
  await page.waitForFunction(()=>window.__rescueHouse.pianoPuzzle().solved,null,
   {timeout:90000}).catch(async error=>{
    console.error('PIANO_QA_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>({
     mode:document.querySelector('[data-piano-mode]')?.getAttribute('data-piano-mode'),
     progress:window.__rescueHouse.pianoPuzzle(),
     scene:window.__rescueHouse.snapshot(),
     sound:window.__rescueHouse.story().samples
    }))));
    throw error;
   });
  await page.getByRole('dialog',{name:'Piano antiguo'}).waitFor({state:'hidden'});
  await page.waitForFunction(()=>window.__rescueHouse.pianoPuzzle().compartment===1);
  assert.equal((await checkpoint()).pianoSolved,true);
  await shot('03-compartimento-del-piano');
  assert(!(await checkpoint()).picked.includes('red-key'),'The reward can stay in the drawer');
  await page.waitForFunction(()=>window.__rescueHouse.snapshot().target==='red-key');
  await page.keyboard.press('e');
  assert((await checkpoint()).picked.includes('red-key'));
  await use('piano');
  await page.locator('[data-piano-mode="practice"]').waitFor();
  assert.equal((await snapshot()).notes,2,'Practice keeps only the found score');
  await page.keyboard.press('Escape');
  await page.evaluate(()=>window.__rescueHouse.setPose({x:6.9,y:3.15,z:10.4,yaw:-Math.PI/2,pitch:-.33}));
  await shot('04-atril-y-compartimento');
  await reloadHouse();
  assert.deepEqual(await page.evaluate(()=>window.__rescueHouse.pianoPuzzle()),
   {picked:true,placed:true,solved:true,compartment:1});
  assert.equal((await snapshot()).notes,2,'The score persists without a duplicate note reward');
  await assert.rejects(()=>use('red-key'),/Not available: red-key/);
  console.log('PASS legacy handoff and inventory reload');

  await page.emulateMedia({reducedMotion:'reduce'});
  await use('cocina');
  await use('hatch-rug');
  await page.waitForFunction(()=>window.__rescueHouse.amenities().rug===1);
  await use('basement-hatch');
  assert.equal((await checkpoint()).hatchUnlocked,true);
  await reloadHouse();
  assert.equal(await page.evaluate(()=>window.__rescueHouse.amenities().hatch),1);
  assert(await page.locator('[data-equip="red-key"]').isHidden());
  await assert.rejects(()=>use('red-key'),/Not available: red-key/);

  const beforeTrial=await read(RESCUE_KEY);
  await openMenu();
  await page.getByRole('button',{name:/^Casa 3D/}).click();
  await page.locator('[data-act=start]').click();
  await waitForHouse();
  await use('note-hall');
  assert.deepEqual(await read(RESCUE_KEY),beforeTrial);
  assert.deepEqual(await read(PROLOGUE_KEY),oldPrologue);
  assert.deepEqual(await read(BIRTHDAY_KEY),birthday);
  console.log('PASS solved safe and trial isolation');

  const rcSave={...beforeTrial.houseCheckpoint,stage:'rc-setup',picked:[...beforeTrial.houseCheckpoint.picked,'master-key'],rcOwned:true,trapArmed:true};
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
  assert.equal(await page.evaluate(()=>window.__rescueHouse.emy().hidden),true);
  assert.equal(await page.evaluate(()=>window.__rescueHouse.amenities().hatch),1);
  // Existing escape checkpoints already opened the door. New ones save the lock.
  assert.equal((await snapshot()).doors.find(door=>door.id==='entrada').open,true);
  await write(RESCUE_KEY,{...beforeTrial,houseCheckpoint:{...rcSave,stage:'escape',exitUnlocked:false,
   picked:rcSave.picked}});
  await reloadHouse();
  assert.equal((await snapshot()).doors.find(door=>door.id==='entrada').open,false);
  await use('entrada');
  assert.equal((await checkpoint()).exitUnlocked,true);
  await reloadHouse();
  assert.equal((await snapshot()).doors.find(door=>door.id==='entrada').open,true);
  await page.evaluate(()=>window.__rescueHouse.setPose({x:5.95,y:0,z:11.30,yaw:0,pitch:0}));
  await page.keyboard.down('w');
  try{await page.waitForFunction(()=>['ending','safe'].includes(window.__rescueHouse.story().phase));}
  finally{await page.keyboard.up('w');}
  // V3.1 has a playable garden escape after the directed ambush.
  // Reaching "ending" starts the scene; it does not complete the rescue.
  await page.waitForFunction(()=>window.__rescueHouse.finale()?.playable,null,{timeout:60000,polling:250});
  assert.equal(await stage(),'ending');
  await page.keyboard.down('w');
  try{await page.waitForFunction(()=>window.__rescueHouse.story().phase==='safe',null,{timeout:90000,polling:250});}
  finally{await page.keyboard.up('w');}
  await page.getByRole('dialog',{name:/Kitty y Louis escaparon/}).waitFor({timeout:30000});
  await page.getByRole('button',{name:'Ver final',exact:true}).click();
  const epilogue=require('./helpers/epilogue-walk.cjs');
  await epilogue.waitScene(page,'outside');
  const exterior=await page.evaluate(async()=>{const {NIGHT_HOUSE}=await import('/src/demo/night-house-layout.ts');return {spawn:window.__valeEpilogue().p,gate:NIGHT_HOUSE.gate};});
  assert(Math.hypot(exterior.spawn.u-exterior.gate.u,exterior.spawn.v-exterior.gate.v)<.2,'The 2D return begins at the exterior gate, not back at the front door');
  await page.locator('#lab3d').waitFor({state:'detached'});
  assert.equal((await read(RESCUE_KEY)).phase,'end');
  assert.equal((await read(RESCUE_KEY)).houseCheckpoint,undefined);
  for(const chapter of epilogue.stages)await epilogue.completeChapter(page,chapter,SHOTS);
  assert.equal((await read(RESCUE_KEY)).epilogue.stage,'complete');
  page.once('dialog',dialog=>dialog.accept());
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
  assert.equal((await checkpoint()).version,2,'An unknown interior schema falls back to the window');
  await dismissField('movement');
  await page.locator('[data-equip=phone]').click();await page.getByRole('button',{name:'Usar teléfono',exact:true}).click();await dismissField('phone');
  await togglePhoneSettings(page);
  await page.getByRole('button',{name:'Reiniciar casa',exact:true}).click();
  assert.equal(await checkpoint(),undefined);
  assert.equal((await read(RESCUE_KEY)).phase,'house');
  assert.deepEqual(errors,[]);
  console.log('PASS house checkpoints: legacy handoff, one canvas, keys/safe/hatch, pursuit/RC recovery, trial isolation, escape, reset and corrupt save');
 }finally{await browser?.close();await server.close();}
}

run().catch(error=>{console.error(error);process.exitCode=1;});
