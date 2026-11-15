const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

async function play(){
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0,strictPort:true},logLevel:'silent'});
 let browser;
 try{
  await server.listen();
  const base='http://127.0.0.1:'+server.httpServer.address().port+'/';
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('artifacts',{recursive:true});
  await page.goto(base);
  await page.getByRole('button',{name:'Administración'}).click();
  await page.getByLabel('Código de acceso').fill('LP');
  await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar'}).click();
  await page.getByRole('button',{name:'Presiona cualquier botón para iniciar'}).click();
  await page.getByRole('button',{name:'Pruebas',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:/Aventura clásica/}).count(),1,
   'Original 2D must stay selectable as a separate classic mode');
  // Confirm the actual original arcade still launches unchanged first.
  await page.getByRole('button',{name:/2D · Corazones/}).click();
  await page.locator('.adventure-canvas canvas').waitFor({timeout:16000});
  await page.getByRole('button',{name:'Salir',exact:true}).click();
  await page.getByRole('button',{name:/Rescate · 2D/}).click();

  const game=page.locator('.story-prologue');
  await game.waitFor({timeout:20000});
  await page.waitForFunction(()=>Boolean(window.__valePrologue?.scene()?.player?.texture),null,{timeout:15000});
  const realScene=await page.evaluate(()=>{
   const scene=window.__valePrologue.scene();
   return {key:scene.scene.key,zoom:scene.cameras.main.zoom,width:scene.scale.width,height:scene.scale.height,
    usingOriginalFloor:!!scene.floor,usingOriginalCharacter:scene.player.texture.key.startsWith('chibi-kitty-')};
  });
  assert.equal(realScene.key,'iso-adventure','rescue must be the ACTUAL Corazones Phaser class');
  assert.equal(realScene.zoom,Math.min(realScene.width/800,realScene.height/450)*1.08,
   'rescue must keep the IDENTICAL Corazones camera zoom formula');
  assert(realScene.usingOriginalFloor&&realScene.usingOriginalCharacter,
   'rescue must use the original diamond floor and Kitty sprite system');
  assert.equal(await game.getAttribute('data-prologue-stage'),'intro');
  const convo=page.getByRole('dialog',{name:'Conversación'});
  // Phase 2: actual browser rendering and bounded live content in ALL FOUR
  // maps, while preserving the scene's regular gameplay and transition flow.
  async function verifyLivingMap(map){
   await page.waitForFunction(id=>{
    const world=window.__valePrologue?.scene?.()?.storyWorld;
    return world?.map===id&&world?.ecology?.counts?.().updates>1;
   },map,{timeout:5000});
   const state=await page.evaluate(()=>{
    const world=window.__valePrologue.scene().storyWorld,stats=world.ecology.counts();
    return {map:world.map,stats};
   });
   assert.equal(state.map,map);
   assert.equal(state.stats.flora,18,
    'flora budget remains fixed in '+map);
   assert(state.stats.wildlife>=6&&state.stats.wildlife<=8,
    'animated wildlife remains finite in '+map);
   assert(state.stats.visibleWildlife>0,
    'at least one animated wildlife species must be near Kitty in '+map);
   assert(state.stats.updates>1,'living scenery is actually updating in '+map);
  }
  async function finishDialogue(){
   await convo.waitFor({state:'visible',timeout:13000});
   for(let n=0;n<48;n++){
    if(!await convo.isVisible())return;
    const button=convo.getByRole('button',{name:/Mostrar todo|Continuar/});
    await button.click();
   }
   throw Error('Conversation did not finish in 48 clicks');
  }
  async function step(stage,x,action){
   await game.locator('xpath=self::*[@data-prologue-stage="'+stage+'"]').waitFor({timeout:12000});
   await page.evaluate(([x,y])=>window.__valePrologue.teleport(x,y),[x,340]);
   if(action){
    if(stage==='talk-luis'){
     // A real approach from the side path: inspect position while walking,
     // not just presence of a static NPC suddenly spawned at the target.
     await page.waitForFunction(()=>window.__valePrologue?.luisBeat?.()==='arriving',
      null,{timeout:4500});
     const start=await page.evaluate(()=>window.__valePrologue.luisPosition());
     await page.screenshot({path:'artifacts/story-luis-entrance.png'});
     await page.waitForTimeout(440);
     const progress=await page.evaluate(()=>window.__valePrologue.luisPosition());
     assert(Math.hypot(progress.x-start.x,progress.y-start.y)>3,
      'Luis must PHYSICALLY move into the clearing, not just change walk frames');
     assert.equal(await page.getByRole('button',{name:/Hablar con Luis/}).count(),0,
      'conversation is unavailable until Luis reaches Kitty and finishes waving');
     await page.waitForFunction(()=>window.__valePrologue?.luisReady?.(),
      null,{timeout:6000});
    }
    const btn=page.getByRole('button',{name:action});
    await btn.waitFor({state:'visible',timeout:6000});
    if(['ribbon','petals','wheel'].includes(stage)){
     assert(await page.evaluate(()=>window.__valePrologue.scene().storyTargetCuePlayed),
      'physical clue discovery must have a one-time nonblocking reaction');
    }
    if(stage==='talk-luis'){
     const idleTexture=await page.evaluate(()=>window.__valePrologue.scene()?.storyLuis?.texture?.key);
     assert(/^story-person-luis-(down|up|right)-idle-\d$/.test(idleTexture??''),
      'Luis must use the redesigned chibi idle sprite in the original scene');
     await page.screenshot({path:'artifacts/story-luis-chibi-idle.png'});
    }
    await btn.click();
    if(stage==='talk-luis'){
     await page.waitForFunction(()=>{
      const key=window.__valePrologue?.scene()?.storyLuis?.texture?.key??'';
      return /story-person-luis-(down|up|right)-talk-\d$/.test(key);
     },null,{timeout:6000});
     await page.screenshot({path:'artifacts/story-luis-chibi-talking.png'});
    }
    await finishDialogue();
    if(stage==='talk-luis'){
     // Farewell is a distinct 2-beat animation: hand wave and exit walking,
     // with the next story stage blocked until Luis has left the screen.
     await page.waitForFunction(()=>window.__valePrologue?.luisBeat?.()==='farewell-wave',
      null,{timeout:5000});
     await page.screenshot({path:'artifacts/story-luis-wave-goodbye.png'});
     assert.equal(await page.evaluate(()=>window.__valePrologue.stage()),'talk-luis',
      'RPG must not skip directly to next chapter before farewell');
     await page.waitForFunction(()=>window.__valePrologue?.luisBeat?.()==='farewell-walk',
      null,{timeout:5000});
     const walking=await page.evaluate(()=>window.__valePrologue.luisPosition());
     await page.waitForTimeout(460);
     const leaving=await page.evaluate(()=>window.__valePrologue.luisPosition());
     assert(Math.hypot(leaving.x-walking.x,leaving.y-walking.y)>3,
      'farewell must move Luis back toward the path');
     await page.screenshot({path:'artifacts/story-luis-walking-away.png'});
    }
   }
  }
  const intro=await page.evaluate(()=>{
   const scene=window.__valePrologue.scene();
   return {area:window.__valePrologue.area(),npc:!!scene.storyLouis,
    river:!!scene.storyWorld?.water,stage:window.__valePrologue.stage()};
  });
  assert.equal(intro.area,'sendero','the story starts on the new path');
  assert.equal(await page.evaluate(()=>window.__valePrologue.map()),'morning_garden',
   'start in the independent bright morning map');
  assert.equal(await page.evaluate(()=>window.__valePrologue.dusk().alpha),0,
   'sunny starting world has no grey darkness overlay');
  assert.equal(intro.npc,false,'Kitty starts ALONE; NPCs appear after exploring');
  assert.equal(intro.river,true,'animated water must be built in the original Phaser scene');
  assert.equal(await convo.isVisible(),false,'no intrusive dialog until after the bridge');
  await verifyLivingMap('morning_garden');
  await page.screenshot({path:'artifacts/story-acts1-2-introduction.png'});
  // Reaching the luminous exit must trigger a real full-screen black fade.
  await page.evaluate(()=>window.__valePrologue.teleport(999));
  await game.locator('xpath=self::*[@data-transition="out"]').waitFor({timeout:5000});
  assert.equal(await page.evaluate(()=>window.__valePrologue.changing()),true,
   'Phaser input is gated while the screen fades');
  await page.waitForFunction(()=>window.__valePrologue.map()==='afternoon_meeting',null,{timeout:12000});
  await page.locator('.story-prologue[data-transition="none"]').waitFor({timeout:12000});
  assert.equal(await page.evaluate(()=>window.__valePrologue.world().map),'afternoon_meeting');
  await verifyLivingMap('afternoon_meeting');
  await page.screenshot({path:'artifacts/story-afternoon-map.png'});
  await finishDialogue();
  await game.locator('xpath=self::*[@data-prologue-stage="defend"]').waitFor({timeout:10000});
  // Original Corazones controls: WASD for movement, arrows for hearts.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(360);
  await page.keyboard.up('ArrowRight');
  // Same heart shooting mechanic style: enemy HP and heart projectiles
  await page.evaluate(()=>window.__valePrologue.defeatShadows());
  await game.locator('xpath=self::*[@data-prologue-stage="talk-louis"]').waitFor({timeout:11000});
  await step('talk-louis',710,/Hablar con Louis/);
  await game.locator('xpath=self::*[@data-prologue-stage="talk-luis"]').waitFor();
  await step('talk-luis',1218,/Hablar con Luis/);
  await game.locator('xpath=self::*[@data-prologue-stage="walk-together"]').waitFor();
  await page.screenshot({path:'artifacts/story-luis-and-louis.png'});
  await page.evaluate(()=>window.__valePrologue.teleport(1543,336));
  await game.locator('xpath=self::*[@data-prologue-stage="disappearance"]').waitFor({timeout:6000});
  await finishDialogue(); // one very short warning before the cinematic
  await page.waitForFunction(()=>window.__valePrologue.abduction().phase==='arrival',
   null,{timeout:3000});
  const vanStart=await page.evaluate(()=>window.__valePrologue.abduction());
  await page.screenshot({path:'artifacts/story-van-arrives.png'});
  assert(vanStart.van?.visible,'van must drive into the clearing on screen');
  await page.waitForFunction(()=>window.__valePrologue.abduction().phase==='disembark',
   null,{timeout:4500});
  const exit=await page.evaluate(()=>window.__valePrologue.abduction());
  assert(exit.captors?.fox&&exit.captors?.rabbit,
   'BOTH fox- and rabbit-masked kidnappers must visibly step out');
  await page.screenshot({path:'artifacts/story-two-animal-masks-leave-van.png'});
  await page.waitForFunction(()=>['struggle','load'].includes(
   window.__valePrologue.abduction().phase),null,{timeout:5500});
  const victimStart=vanStart.louis;
  await page.waitForFunction(()=>window.__valePrologue.abduction().phase==='load',
   null,{timeout:2000});
  // At the very FIRST loading frame the hostage is still beside the captor.
  // Measure actual traversal after part of the continuous walk-to-door beat.
  await page.waitForTimeout(480);
  const loading=await page.evaluate(()=>window.__valePrologue.abduction());
  const performance=await page.evaluate(()=>{
   const s=window.__valePrologue.scene();
   return {focus:{...s.storyDramaOffset},emotes:s.storyBubbles.length};
  });
  assert(Math.hypot(performance.focus.x,performance.focus.y)>1,
   'camera gently tracks the physical kidnapping without a sudden cut');
  assert(performance.emotes<=3,'nonblocking emotion glyphs stay finite on mobile');
  assert(Math.abs(performance.focus.x)<=84&&Math.abs(performance.focus.y)<=46,
   'camera focus is strictly bounded near Kitty');
  await page.screenshot({path:'artifacts/story-kidnapping-soft-camera-and-reactions.png'});
  assert(loading.louis?.visible,'Louis cannot vanish before entering the van');
  assert(Math.hypot(loading.louis.x-victimStart.x,
   loading.louis.y-victimStart.y)>8,'captors MUST physically move hostage to van');
  await page.screenshot({path:'artifacts/story-hostage-led-into-van.png'});
  await page.waitForFunction(()=>window.__valePrologue.abduction().phase==='escape',
   null,{timeout:5000});
  const vanEscape=await page.evaluate(()=>window.__valePrologue.abduction());
  assert(Math.hypot(vanStart.van.x-vanEscape.van.x,
   vanStart.van.y-vanEscape.van.y)>20,'vehicle must drive away, not disappear');
  await page.screenshot({path:'artifacts/story-van-escapes.png'});
  await convo.waitFor({state:'visible',timeout:9000});
  await page.screenshot({path:'artifacts/story-abduction-nightfall.png'});
  await finishDialogue(); // single rapid clue, no extra blocking exposition
  await game.locator('xpath=self::*[@data-prologue-stage="ribbon"]').waitFor();
  await page.waitForFunction(()=>{
   const s=window.__valePrologue.scene();
   return Math.hypot(s.storyDramaOffset.x,s.storyDramaOffset.y)<.4;
  },null,{timeout:4800});
  assert.equal(await page.evaluate(()=>window.__valePrologue.map()),'afternoon_meeting',
   'abduction stays in afternoon until Kitty finds the EXIT');
  await page.evaluate(()=>window.__valePrologue.exit());
  await page.waitForFunction(()=>window.__valePrologue.map()==='dusk_search',null,{timeout:12000});
  await page.locator('.story-prologue[data-transition="none"]').waitFor({timeout:12000});
  await verifyLivingMap('dusk_search');
  await page.screenshot({path:'artifacts/story-dusk-puzzles-map.png'});
  await step('ribbon',1578,/Examinar Pulsera/);
  await step('petals',1910,/Examinar Pétalos/);
  await step('wheel',2224,/Examinar Huellas/);
  await game.locator('xpath=self::*[@data-prologue-stage="door"]').waitFor();
  assert.equal(await page.evaluate(()=>window.__valePrologue.map()),'dusk_search');
  await page.evaluate(()=>window.__valePrologue.exit());
  await page.waitForFunction(()=>window.__valePrologue.map()==='night_neighborhood',null,{timeout:12000});
  await page.locator('.story-prologue[data-transition="none"]').waitFor({timeout:12000});
  await verifyLivingMap('night_neighborhood');
  await page.screenshot({path:'artifacts/story-night-neighborhood-map.png'});
  // Real iPhone-style usability: do not cheat by teleporting to the house.
  // Touch the actual guide button and walk from the street, past the gate,
  // around the solid front facade until the door becomes interactable.
  const houseCard=page.getByRole('complementary',{name:'Guía para llegar a la casa'});
  await houseCard.waitFor({state:'visible',timeout:6000});
  assert(await houseCard.getByText('Puerta principal').isVisible(),
   'player can identify the locked front door from the neighborhood');
  assert(await page.evaluate(()=>window.__valePrologue.van().parked),
   'the very SAME van must remain visibly parked near the final house');
  // Optional investigation is accessible without teleporting Kitty:
  // walk from the street, approach the vehicle and inspect its crescent plate.
  await houseCard.getByRole('button',{name:/Investigar furgoneta/}).click();
  await page.waitForFunction(()=>window.__valePrologue.van().near,
   null,{timeout:16000});
  await page.screenshot({path:'artifacts/story-van-parked-near-house.png'});
  await page.getByRole('button',{name:/Inspeccionar furgoneta/}).click();
  assert(await page.evaluate(()=>window.__valePrologue.van().inspected),
   'inspecting the van must record the clue without changing story stage');
  assert.equal(await page.evaluate(()=>window.__valePrologue.stage()),'door');
  await houseCard.getByText(/Pista encontrada: LUNA-07/).waitFor({timeout:4500});
  const beforeGuide=await page.evaluate(()=>window.__valePrologue.houseRoute().distance);
  assert(beforeGuide>3.0,'front door is not directly beside the street van');
  await houseCard.getByRole('button',{name:/Guiarme caminando/}).click();
  await page.waitForFunction(()=>window.__valePrologue.houseRoute().active,null,{timeout:5000});
  const starting=await page.evaluate(()=>window.__valePrologue.scene().p);
  await page.waitForTimeout(650);
  const moving=await page.evaluate(()=>window.__valePrologue.scene().p);
  assert(Math.hypot(moving.u-starting.u,moving.v-starting.v)>.25,
   'tapping the guide must physically walk Kitty, not teleport');
  await page.waitForFunction(()=>window.__valePrologue.houseRoute().distance<1.20,
   null,{timeout:28000}).catch(async(error)=>{
    const debug=await page.evaluate(()=>({
     player:window.__valePrologue.scene().p,
     route:window.__valePrologue.houseRoute(),
     target:window.__valePrologue.scene().storyTarget,
     near:window.__valePrologue.scene().storyNear
    }));
    throw Error('Assisted front path did not reach the actual door: '+JSON.stringify(debug),{cause:error});
   });
  await page.screenshot({path:'artifacts/story-night-guided-front-porch.png'});
  await page.waitForTimeout(360);
  const dusk=await page.evaluate(()=>window.__valePrologue.dusk());
  const night=await page.locator('.prologue-night').evaluate(element=>{
   const bounds=element.getBoundingClientRect();
   return {x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height,
    pointer:getComputedStyle(element).pointerEvents};
  });
  assert.equal(night.x,0);
  assert.equal(night.y,0);
  assert(night.width>=844&&night.height>=390,'night layer covers the ENTIRE viewport');
  assert.equal(night.pointer,'none','night does not eat desktop clicks');
  assert(dusk.alpha>.5&&dusk.fillAlpha===1,'night must visibly darken the garden; fillAlpha cannot be zero');
  await page.screenshot({path:'artifacts/story-three-clues-night.png'});
  const doorButton=page.getByRole('button',{name:/Probar puerta/});
  await doorButton.waitFor({state:'visible',timeout:7000});
  await doorButton.click();
  await finishDialogue();
  await game.locator('xpath=self::*[@data-prologue-stage="window"]').waitFor();
  await houseCard.getByText('Ventana abierta').waitFor({timeout:6000});
  // A second leg of navigation goes WEST toward the actual open 3D window.
  const windowDistance=await page.evaluate(()=>window.__valePrologue.houseRoute().distance);
  if(windowDistance>=1.35){
   await houseCard.getByRole('button',{name:/Guiarme caminando/}).click();
   await page.waitForFunction(()=>window.__valePrologue.houseRoute().distance<.9,null,{timeout:13000});
  }
  await page.screenshot({path:'artifacts/story-night-open-west-window.png'});
  await page.getByRole('button',{name:/Entrar por la ventana/}).click();
  await finishDialogue();
  await page.locator('#lab-canvas').waitFor({state:'visible',timeout:26000});
  await page.locator('.lab-window-intro:not(.lab-hidden)').waitFor({state:'visible',timeout:15000});
  await page.screenshot({path:'artifacts/story-to-house-3d.png'});
  assert.deepEqual(errors,[],'no runtime JS errors across FOUR separate 2D maps and the real 3D house');
  await context.close();
  console.log('PASS: 2D Corazones; animated van arrival/fox/rabbit/hostage/escape; LUNA-07 clue at house; walk-to door/window; real 3D.');
 }finally{await browser?.close();await server.close();}
}
play().catch(e=>{console.error(e);process.exitCode=1;});
