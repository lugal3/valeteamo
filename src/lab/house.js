import {HouseEvents} from './story-events.js';
import {HouseMessages} from './hud-messages.js';
import {captureHouseCheckpoint,restoreHouseCheckpoint,SAFE_REWARD} from './house-checkpoint.js';
import {PhoneUI} from './phone-ui.js';
import {FloorSounds} from './floor-sounds.js';
import {EMOTES} from './animations/emotes.js';
import {Pursuer} from './pursuer.js';
import {movementKey,releasedPointer,hasControlTouch} from './movement-input.js';
import {CharacterAnimator} from './animator.js';
import {BATH_MIRROR} from './mirror.js';
import {MirrorSafePuzzle,SAFE_CODE,MIRROR_HINT} from './mirror-safe.js';
import {HIDE_SECONDS,hiddenPose,hidingExit,hidingFrame} from './hiding.js';
import {STAND_SECONDS,wardrobeWalk} from './animations/wardrobe-entry.js';
import {CAR_ARRIVAL_SECONDS,arrivalCarCamera,poseArrivalCar} from './arrival-car.js';
import {BED_EXIT} from './pursuer-model.js';
import {createHouse,HEIGHT,HOUSE,blocked,groundHeight,lineBlocked,setDoor,setDrawer,poseFurniture,roomAt} from './world.js';
import {HouseRenderer,pickupGeometry} from './renderer.js';
import {HouseSound,MIX_CHANNELS,mixLimit} from './sound.js';
import {applyLookDelta,followLook,readCameraSettings,writeCameraSettings,DEFAULT_CAMERA_SETTINGS,SENSITIVITY_MIN,SENSITIVITY_MAX,SENSITIVITY_STEP} from './camera-controls.js';
import {WINDOW_SHOT_SECONDS,WINDOW_LANDING,windowIntroCamera,windowIntroState,shouldPlayWindowIntro} from './window-intro.js';
import {navigate,smoothAxis,getStairDirection} from './navigation.js';
import {interactionTarget} from './interactions.js';
import {circuitPowered,housePowered,toggleCircuit,toggleHousePower,updateBlackout,updatePowerLever} from './house-lights.js';
import {inHatch,poseHatch,poseHatchRug} from './basement.js';
import {posePianoCompartment,posePianoReward,setPianoScore,poseTrunk} from './house-additions.js';
import {PIANO_KEYS,pianoKeyboard} from './piano-recital.js';
import {PianoSession} from './piano-session.js';
import {HouseTelevision} from './television.js';
import {updateWallClock} from './wall-clock.js';
import {animateFurniture,updateFurniture,sweepClear} from './furniture-motion.js';
import {BATTERY_SWAP_SECONDS} from './viewmodel.js';
import {moveGreyCat,revealGreyCat} from './grey-cat.js';
import {createRC,syncRCObject,deployRC,driveRC,beepRC,updateRC,stopRC,crashRC,recoverRC,rcCamera,rcDeploymentView,canTrapPursuer} from './rc-car.js';
import {createLouisEscape,updateLouisEscape,freeLouis,louisCamera} from './louis-escape.js';
import {createLoisShotDirector,advanceLoisShot,finishLoisShot} from './lois-ps2-cinematics.js';
import {createHousePuzzle,puzzleEvent,canOpenBedroom,canRescue,PUZZLE_HINTS} from '../demo/house-puzzles.js';
import './lab.css'; // Required for #lab3d stacking, fixed fullscreen layout, canvas sizing and HUD.
import './house.css';
const FLASH_DRAIN=.24,FLASH_LOW=15,SPARE_CHARGE=55;
const SPRINT_SECONDS=4;
const CHECKPOINT_INTERACTIONS=new Set(['battery','drawer','door','flashlight','hatch','key','note','rc-car','rug']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canStand=(state,world)=>!blocked(world.boxes,state.x,state.y,state.z,.2,1.69);
function cameraOf(s){
 if(s.poseCamera)return s.poseCamera;
 if(s.hidden){const o=s.hidden;return {x:o.x,y:o.y,z:o.z,yaw:s.yaw,pitch:s.pitch};}
 const eye=s.lying?1.02:s.eye;
 return {x:s.x,y:s.y+eye+(!s.crouched&&!s.lying&&!s.reduceBob?Math.sin(s.bob)*.024*(s.walkWeight||0):0),z:s.z,yaw:s.yaw,pitch:s.pitch};
}
function closestObject(world,state,previous=null){
 if(state.hidden||state.lying||state.poseCamera)return null;
 return interactionTarget(world,cameraOf(state),previous);
}
const ctxRoom=state=>getStairDirection(state)==='Escaleras'?'Escaleras':roomAt(state.x,state.z,state.y);
export function launchHouse(onExit,checkpoint='ground',config={}){
 const demo=config.demo===true;
 const scenario=config.trial?config.scenario:null;
 const checkpointStore=demo&&!config.trial&&checkpoint==='ground'?config.checkpointStore:null;
 const animator=new CharacterAnimator();
 const root=document.createElement('div');root.id='lab3d';root.innerHTML=`
 <canvas id="lab-canvas" aria-label="Escenario tridimensional interactivo de la casa"></canvas>
 <div class="lab-vignette" aria-hidden="true"></div>
 <div class="lab-window-intro lab-hidden" id="lab-window-intro" aria-label="Entrada cinematográfica por la ventana">
   <div class="lab-intro-top"></div>
   <div class="lab-intro-caption" id="lab-intro-caption">Una ventana entreabierta…</div>
   <button data-act="pause" aria-label="Pausar entrada">Ⅱ Pausa</button>
   <button data-act="skip-intro" aria-label="Saltar la animación de entrada">Saltar intro ↗</button>
   <div class="lab-intro-bottom"></div>
 </div>
 <div class="lab-cross" aria-hidden="true">+</div>
 <div id="house-mouse-status" class="house-mouse-status" hidden>Esc o R · Liberar ratón</div>
 <div class="lab-top">
   <details class="lab-camera-settings" id="lab-camera-settings"><summary aria-label="Ajustes de la casa">⚙</summary><div class="lab-camera-panel">
     <div class="house-menu-actions">
       <button data-act="pause">Pausa</button>
       <button id="house-lock-mouse" data-act="mouse" hidden>Capturar ratón</button>
       <button data-act="exit" class="lab-exit">← ${config.trial?'Pruebas':demo?'Cumpleaños':'Pruebas'}</button>
     </div>
     <label>Velocidad de giro <input data-setting="sensitivity" aria-label="Sensibilidad de giro" type="range" min="${SENSITIVITY_MIN}" max="${SENSITIVITY_MAX}" step="${SENSITIVITY_STEP}" value="${DEFAULT_CAMERA_SETTINGS.sensitivity}"></label>
     <label class="lab-invert-label"><input data-setting="invertX" type="checkbox"> Invertir giro horizontal</label>
     <label>Calidad de imagen <select data-setting="quality" aria-label="Calidad gráfica"><option value="medium">Detalles (auto)</option><option value="low">Modo fluido</option></select></label>
     <label class="lab-preference"><input data-setting="bob" type="checkbox" checked> Balanceo al caminar</label>
     <label class="lab-preference"><input data-setting="motion" type="checkbox"> Reducir movimiento</label>
     <label class="lab-preference"><input data-setting="captions" type="checkbox" checked> Subtítulos de sonidos</label>
     <details class="house-mixer"><summary>Mezclador de sonido</summary>
       <label class="lab-preference"><input data-setting="mute" type="checkbox"> Silenciar la casa</label>
       ${MIX_CHANNELS.map(([key,label,preview])=>`<div class="mixer-row"><label><span>${label} <output data-level="${key}"></output></span><input data-setting="${key}" type="range" min="0" max="${mixLimit(key)}" step=".01" aria-label="${label}"></label><button data-act="audio:${preview||key}" aria-label="Probar ${label}">▶</button></div>`).join('')}
       <button data-act="copy-mix">Copiar mezcla</button>
       <textarea class="mixer-export" aria-label="Valores de la mezcla" readonly hidden></textarea>
       <small class="mixer-status" role="status"></small>
     </details>
     <button data-act="reset">${scenario?'Reiniciar prueba':'Reiniciar casa'}</button>
     <button data-act="hud">Editar controles / hotbar</button>
     ${demo?'':'<details><summary>Diagnóstico</summary><div id="lab-metrics"></div></details>'}
     <details class="lab-settings-note"><summary>Controles</summary><p>WASD para caminar, Mayús para correr y C para agacharte. Arrastra para mirar o pulsa R para capturar el ratón. E interactúa, F usa el objeto equipado, I abre la mochila y Esc libera el ratón o pausa.</p><p>En pantalla táctil, mueve el joystick izquierdo y arrastra a la derecha para mirar. Puedes hacer ambos gestos a la vez.</p></details>
   </div></details>
 </div>
 <div class="lab-focus" id="lab-focus" role="status" aria-live="polite"></div>
 <div class="house-messages" id="house-messages" hidden>
  <div class="lab-objective" id="lab-objective">Explora la casa</div>
  <div class="lab-toast" id="lab-toast" role="status" aria-live="polite"></div>
 </div>
 <div class="house-charge" id="house-charge" role="meter" aria-label="Batería de la linterna" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" hidden><span class="house-charge-cell" aria-hidden="true"><i id="lab-charge"></i></span><strong id="lab-charge-text" aria-hidden="true">100%</strong></div>
 <div class="house-stamina" id="house-stamina" role="meter" aria-label="Estamina" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" hidden><i aria-hidden="true"></i></div>
 <div class="lab-joystick" id="lab-joystick" aria-label="Joystick izquierdo, arrastrar para caminar"><div class="lab-stick-ring"><div id="lab-stick" class="lab-stick-thumb">♡</div></div></div>
 <div class="lab-look" id="lab-look" aria-label="Arrastrar para mirar"></div>
 <div class="lab-buttons">
  <button data-act="interact" id="lab-interact" aria-keyshortcuts="E" hidden><kbd aria-hidden="true">E</kbd><small>Usar</small></button>
  <button data-act="emotes" aria-label="Elegir emote" aria-controls="house-emotes" aria-expanded="false" hidden>☺<small>Emotes</small></button>
  <button data-act="bag">▣<small>Mochila</small></button>
  <button data-act="flash" id="house-light">☼<small>Luz</small></button>
  <button data-act="phone" class="phone-expand" id="house-use-phone" aria-label="Usar teléfono" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/></svg><small>Usar</small></button>
  <button data-act="crouch" id="lab-crouch" aria-label="Agacharse" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4" r="2"/><path d="m13 8-3 4 5 2-2 3h5m-8-5-4 5M7 21h10m-7-12-3 2"/></svg><small>Agachar</small></button>
 </div>
 <div class="house-emotes" id="house-emotes" hidden role="group" aria-label="Emotes"><span>En el espejo · moverte cancela</span>${EMOTES.map(e=>`<button data-act="emote:${e.id}">${e.key} · ${e.label}</button>`).join('')}<button data-act="emote:stop">Detener</button></div>
 <div class="house-rc-hud" id="house-rc-hud" hidden role="group" aria-label="Tablet de control RC">
  <div class="house-rc-display"><strong>Kitty RC</strong><span class="house-rc-keys">W/S acelerar · A/D girar</span><output id="house-rc-status" aria-live="off">Señal conectada</output></div>
  <div class="house-rc-actions"><button data-act="rc:noise" aria-keyshortcuts="Q">Señuelo <kbd>Q</kbd></button><button data-act="rc:trap" id="rc-trap-button" aria-keyshortcuts="T" hidden>Cerrar escotilla <kbd>T</kbd></button><button data-act="rc:stop" aria-keyshortcuts="X Escape">Guardar <kbd>Esc</kbd></button></div>
 </div>
 <div class="house-rc-caption" id="house-rc-caption" hidden role="status"></div>
 <div id="lab-turn" class="lab-turn"><div><span>↻</span><h2>Gira tu teléfono</h2><p>La casa se explora en horizontal. Tu lugar se conserva y el mundo queda en pausa.</p><button data-act="exit">Volver a pruebas</button></div></div>
 <div id="lab-dialog" class="lab-dialog lab-hidden"></div>`;
 document.body.appendChild(root);
 const events=new HouseEvents({pursuit:config.entry!=='rescue',twoActs:true,arrivalLead:CAR_ARRIVAL_SECONDS}),floorSounds=new FloorSounds();let pursuer=null,equipment='flashlight',equipmentAge=1,encounterCheckpoint=null,thirdView=null;
 const mirrorSafe=new MirrorSafePuzzle(),television=new HouseTelevision();
 let safeInput='',activeSafe=null,noteLift=0,noteHold=0,notePresentation=false,capturePhoto=false,piano=null;
 let rc=null,louis=null,loisShotDirector=null,rcTrap={armed:false,closed:false},finalCutscene=null;
 let resumed=false;
 let equipmentBeforeNote='empty',batterySwap=null;
 const canUseHotbar=()=>ready&&!isSuspended()&&!cinematic&&events.phase!=='arrival'&&events.phase!=='failed'&&events.phase!=='safe'&&rc?.mode!=='driving'&&rc?.mode!=='deploying';
 const phone=new PhoneUI(root,(kind,toggle=true)=>equip(kind,toggle),()=>resetInput(),{canEquip:canUseHotbar,canUse:()=>canUseHotbar()&&!notePresentation,onEdit:()=>{releaseMouse();resetInput();if(isSuspended())sound.pause();else sound.resume();},onPhoto:()=>{capturePhoto=true;}});phone.equip(equipment);
 const danger=document.createElement('div');danger.className='house-danger';danger.hidden=true;danger.setAttribute('role','status');root.querySelector('#house-messages').append(danger);
 const enableSound=document.createElement('button');enableSound.className='house-enable-sound';enableSound.textContent='Activar sonido';enableSound.hidden=true;root.querySelector('.house-mixer').before(enableSound);
 enableSound.addEventListener('click',async()=>{
  sound.set('muted',false);root.querySelectorAll('[data-setting="mute"]').forEach(el=>el.checked=false);
  if(await sound.start()&&active&&isSuspended())sound.pause();
 });
 const $=id=>root.querySelector('#'+id),canvas=$('lab-canvas'),dialog=$('lab-dialog');
 const hudMessages=new HouseMessages(root);
 phone.onPresentationChange=()=>hudMessages.layout(phone.rect,phone.open);
 const controller=new AbortController(),signal=controller.signal;
 let renderer,world,bathCircuit,puzzle=createHousePuzzle(config.entry),sound=new HouseSound(),s,raf=0,last=0,lastPaint=0,fps=0,elapsed=0,lookPointer=null,stickPointer=null;
 let active=true,ready=false,hasFocus=true,focus=null,lookLast={x:0,y:0},paused=false,modal='',intro=true,contextLost=false,stickPointerType=null,lookPointerType=null;
 let lookTarget={yaw:Math.PI,pitch:0},cinematic=null,poseTransition=null,handAction=0,clickAction=0,lastInteraction=-Infinity,audioPreview=false;
 const handDrift={x:0,y:0,vx:0,vy:0};
 const motionMedia=window.matchMedia('(prefers-reduced-motion: reduce)');
 const keys=new Set(),joystick={x:0,z:0,sprint:false},velocity={forward:0,side:0};
 const cameraSettings=(()=>{try{return readCameraSettings(window.localStorage)}catch{return {...DEFAULT_CAMERA_SETTINGS}}})();
 const options={...cameraSettings,bob:cameraSettings.bob??!motionMedia.matches,quality:'medium'};
 const reducedMotion={get matches(){return motionMedia.matches||options.motion===true;}};
 const saveCamera=()=>{try{writeCameraSettings(window.localStorage,options)}catch{}};
 const points={ground:'Planta baja',upstairs:'Planta alta',sound:'Iluminación / sonido',interactions:'Interacciones',mirror:'Espejo del baño'};
 const say=(text,seconds=2.4)=>hudMessages.say(text,seconds);
 const caption=text=>{if(options.captions!==false)hudMessages.describeSound(text);};
 const isPortrait=()=>window.innerHeight>window.innerWidth;
 const isSuspended=()=>!ready||paused||!!modal||phone.editing||$('lab-camera-settings').open||isPortrait()||document.hidden||!hasFocus||contextLost;
 const wakeShot=()=>events.phase==='lockdown'&&pursuer?.mode==='rising';
 const isPaused=()=>isSuspended()||!!cinematic||!!poseTransition||events.phase==='car-preview'||wakeShot();
 const flashlightBeam=()=>s.flashlight&&batterySwap===null&&equipment==='flashlight'&&!s.hidden&&!s.lying&&!animator.performing&&!phone.open&&events.phase!=='arrival';
 const desktop=window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
 const remoteInUse=()=>['driving','deploying'].includes(rc?.mode);
 const canLook=()=>!isPaused()&&!phone.open&&events.phase!=='arrival'&&!remoteInUse();
 const mouseLocked=()=>document.pointerLockElement===canvas;
 function releaseMouse(){if(mouseLocked())document.exitPointerLock();}
 function lockMouse(){
  if(!desktop.matches||!canvas.requestPointerLock||!ready||cinematic||phone.open||phone.editing||paused||modal||poseTransition||wakeShot()||isPortrait()||!hasFocus||contextLost||remoteInUse()||events.phase==='arrival')return;
  $('lab-camera-settings').open=false;resetInput();
  try{const request=canvas.requestPointerLock();request?.catch(()=>say('El navegador no permitió capturar el ratón'));}catch{say('El navegador no permitió capturar el ratón');}
 }
 function cancelEmote(options){animator.cancelEmote(options);sound.stopEmote();}
 function equip(kind,toggle=false){
  const inventory=s.inventory;
  if(notePresentation&&kind!=='flashlight')return;
  if(kind==='rc'&&!inventory.rc||kind==='flashlight'&&!inventory.torch||kind==='key'&&!inventory.key||kind==='red-key'&&!inventory.redKey||kind==='paper'&&!inventory.notes.length&&!inventory.pendingNote)return;
  cancelEmote();equipment=toggle&&equipment===kind?'empty':kind;equipmentAge=0;phone.equip(notePresentation?'empty':equipment);resetInput();
 }
 function releaseCapture(element,pointer){try{if(pointer!==null&&element?.hasPointerCapture(pointer))element.releasePointerCapture(pointer);}catch{}}
 function capture(element,pointer){try{element.setPointerCapture?.(pointer);}catch{}}
 function resetInput(){
  keys.clear();joystick.x=joystick.z=0;joystick.sprint=false;velocity.forward=velocity.side=0;
  const pairs=[[$('lab-look'),lookPointer],[$('lab-joystick'),stickPointer]];
  lookPointer=stickPointer=null;lookPointerType=stickPointerType=null;
  for(const [element,pointer] of pairs)releaseCapture(element,pointer);
  if($('lab-stick'))$('lab-stick').style.transform='translate(0,0)';
  if(s){lookTarget={yaw:s.yaw,pitch:s.pitch};s.sprinting=false;}
 }
 function closePiano(){
  if(!piano)return;
  piano.close();piano=null;s.poseCamera=null;
  dialog.classList.remove('house-piano-dialog');
 }
 const modalClose=()=>{closePiano();modal='';activeSafe=null;safeInput='';dialog.classList.add('lab-hidden');dialog.innerHTML='';resetInput();if(!isSuspended())sound.resume();};
 function showModal(title,body,actions=[['Cerrar','close']]){
  closePiano();
  modal=title;dialog.classList.remove('lab-hidden');
  $('house-messages').hidden=true;
  dialog.innerHTML=`<section class="lab-paper" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}"><div class="lab-paper-mark">✿ ♡ ✿</div><h2>${escapeHTML(title)}</h2><div class="lab-paper-body">${body}</div><div class="lab-paper-actions">${actions.map(([label,act])=>`<button data-act="${escapeHTML(act)}">${escapeHTML(label)}</button>`).join('')}</div></section>`;
  releaseMouse();resetInput();sound.pause();dialog.querySelector('button')?.focus({preventScroll:true});
 }
 function showTrialStart(){
  showModal(scenario.title,`<p>${escapeHTML(scenario.description)}</p>`,[['Iniciar prueba','start'],['Volver a pruebas','exit']]);
 }
 function rebuild(){renderer.rebuild([...world.boxes.filter(box=>!box.hiddenGeometry),...pickupGeometry(world.objects)]);}
 function saveCheckpoint(){
  if(checkpointStore)checkpointStore.save(captureHouseCheckpoint({world,s,puzzle,events,mirrorSafe,rc,rcTrap,batterySwap,pursuer}));
 }
 function finishWindowIntro(){
  poseFurniture(world.entryWindow,1);sound.setTension(.55);
  cinematic=null;root.classList.remove('lab-intro-active');$('lab-window-intro').classList.add('lab-hidden');
  Object.assign(s,WINDOW_LANDING);s.eye=WINDOW_LANDING.eye;s.bob=0;
  resetInput();
  if(ready&&!isPaused())sound.resume();
  saveCheckpoint();
  last=performance.now();say(s.inventory.torch?'Kitty entra con cuidado por la ventana…':'Hay una linterna en el cajón del descansillo, arriba.',4);
 }
 function beginWindowIntro(){
  resetInput();
  poseFurniture(world.entryWindow,0);sound.setTension(.32);
  cinematic={elapsed:0,cues:new Set()};root.classList.add('lab-intro-active');$('lab-window-intro').classList.remove('lab-hidden');
  $('lab-intro-caption').textContent='Una ventana entreabierta…';
 }
 function reset(saved){
  television.sync(false,false);notePresentation=false;
  louis=null;loisShotDirector=null;rcTrap={armed:false,closed:false};finalCutscene=null;
  releaseMouse();events.reset();mirrorSafe.reset();hudMessages.reset();phone.close();encounterCheckpoint=null;danger.hidden=true;
   root.querySelector('[data-act=emotes]').setAttribute('aria-expanded','false');
  batterySwap=null;equipmentBeforeNote='empty';
  animator.reset();sound.stopEmote();floorSounds.reset();if(phone.editing)void phone.layoutAction('done');$('house-emotes').hidden=true;cinematic=null;poseTransition=null;paused=false;lastInteraction=-Infinity;handAction=0;clickAction=0;noteLift=0;noteHold=0;capturePhoto=false;
  sound.setTension(.55);
  root.classList.remove('lab-intro-active');$('lab-window-intro').classList.add('lab-hidden');$('lab-camera-settings').open=false;
  world=createHouse(checkpoint);puzzle=createHousePuzzle(scenario?.puzzleEntry??config.entry);pursuer=new Pursuer(world);sound.setThreat(false);
  rc=createRC(world.objects.find(o=>o.id==='rc-car'));
  bathCircuit=world.lights.circuits.find(circuit=>circuit.id==='bano');
  poseFurniture(world.entryWindow,1);handDrift.x=handDrift.y=handDrift.vx=handDrift.vy=0;
  if(demo){
   const key=world.objects.find(o=>o.id==='key');key.taken=puzzle.key;
   setDrawer(world.objects.find(o=>o.id==='drawer'),puzzle.drawer);
   world.objects.find(o=>o.id==='note-hall').text=PUZZLE_HINTS.note;
   world.objects.find(o=>o.id==='picture-stain').text='El corazón del cuadro también aparece en la caja fuerte del dormitorio.';
   const door=world.objects.find(o=>o.id==='dormitorio');if(puzzle.door){setDoor(door,true);door.locked=false;}
  }
  const p=world.spawn;
  const torchAvailable=!demo||checkpoint!=='ground'||['drawer','lock','rescue'].includes(config.entry);
  equipment=torchAvailable?'flashlight':'empty';
  s={x:p.x,z:p.z,y:p.y,yaw:p.yaw,pitch:0,eye:1.63,crouched:false,hidden:null,lying:false,bob:0,
    flashlight:torchAvailable&&demo,battery:100,stamina:SPRINT_SECONDS,sprinting:false,exhausted:false,recoveryDelay:0,reduceBob:!options.bob||reducedMotion.matches,inventory:{notes:[],batteries:p.items?.batteries??Number(demo),key:demo?puzzle.key&&!puzzle.door:!!p.items?.key,redKey:false,masterKey:false,torch:torchAvailable,rc:false},distanceSteps:0};
  world.objects.find(o=>o.id==='media-flashlight').taken=torchAvailable;
  if(scenario){
   if(scenario.pose){
    const {floor,...pose}=scenario.pose;
    Object.assign(s,pose,{y:floor*HEIGHT});
   }
   s.battery=scenario.battery??100;
   if(scenario.crouched){s.crouched=true;s.eye=1.03;}
   if(scenario.circuit)toggleCircuit(world.lights.circuits.find(circuit=>circuit.id===scenario.circuit));
   if(scenario.note){
    const note=world.objects.find(o=>o.id==='mirror-note');
    note.taken=true;mirrorSafe.collect();
    s.inventory.pendingNote={id:note.id,label:note.label,text:note.text};
    equipmentBeforeNote=equipment;equipment='paper';
   }
   if(scenario.score){
    const sheet=world.pianoSheet;
    sheet.taken=true;s.inventory.notes.push({id:sheet.id,label:sheet.label,text:sheet.text});
   }
   if(scenario.events==='evaded'){
    events.phase='evaded';s.inventory.redKey=true;
    world.objects.find(o=>o.id==='red-key').taken=true;
   }
   if(scenario.events==='wake'){
    events.phase='sleep';events.notified=true;events.time=.75;pursuer.sleep();poseArrivalCar(world.car,1);
    encounterCheckpoint={x:2.39,y:HEIGHT,z:3.85,yaw:-Math.PI/2,pitch:-.46};
   }
   if(scenario.events==='car')events.phase='car-preview';
  }
  const restored=restoreHouseCheckpoint(saved,{world,s,puzzle,events,mirrorSafe,rc,rcTrap,pursuer});
  resumed=!!restored;
  if(restored)({louis,equipment,encounterCheckpoint}=restored);
  sound.setThreat(['patrol','hunt'].includes(events.phase));
  phone.setInventory(s.inventory);phone.equip(equipment);
  focus=null;lookTarget={yaw:s.yaw,pitch:s.pitch};modalClose();keys.clear();rebuild();
  if(resumed)say('Progreso de la casa recuperado');
  else if(!scenario)say('Escenario reiniciado · '+(points[checkpoint]||'planta baja'));
 }
 const listener=()=>cameraOf(s);
 const play=(name,o=null,level=1)=>{
  if(name==='door-close'&&o?.wardrobeLeaves)name='closet-close';
  if(name==='footstep'){const room=ctxRoom(s);name=s.x<0||s.x>HOUSE.width||s.z<0||s.z>HOUSE.depth?(Math.abs(s.x-5.9)<.9?'stone':'grass'):room==='Baño'||room==='Cocina y comedor'?'tile':'wood';}
  const loc=listener(),source=o?{x:o.x,y:o.y,z:o.z}:null;
  const occluded=source?lineBlocked(world.boxes,loc,source,o?.kind==='door'?'door-'+o.id:''):false;
  sound.effect(name,source,{...loc,yaw:s.yaw},occluded,{level});
  if(name==='cat')caption('Maullido junto a la salida');
  if(name==='floor-groan')caption('Cruje el suelo');
 };
 function toggleFlash(){if(s.hidden||s.lying||batterySwap!==null)return;
  sound.resume();
  if(!s.flashlight&&s.battery<=0){
   if(startBatterySwap())s.flashlight=true;
   else say('Sin carga · busca una pila o un interruptor.');
   return;
  }
  s.flashlight=!s.flashlight;play('light');say(s.flashlight?'Linterna encendida':'Linterna apagada');
  handAction=1;clickAction=1;
 }
 function crouch(){if(s.hidden||s.lying)return;
  cancelEmote({immediate:true});
  if(s.crouched&&!canStand(s,world)){say('No hay espacio suficiente para levantarte');return;}
  s.crouched=!s.crouched;play('click');say(s.crouched?'Agachada':'De pie');
 }
 function beginHiding(object,entering){
  cancelEmote({immediate:true});
  if(entering&&object.requiresCrouch&&!s.crouched){say('Agáchate para entrar al escondite');return;}
  const from=cameraOf(s),inside={...object.hideCamera},outside=hidingExit(world,object,s.y,s);
  if(!outside){say('Deja libre el espacio delante del escondite');return;}
  const transition={object,entering,from,inside,outside,elapsed:0,entryElapsed:0};
  const distance=Math.hypot(outside.x-from.x,outside.z-from.z);
  if(entering&&object.wardrobeLeaves&&canStand(s,world)&&!reducedMotion.matches&&(s.crouched||events.phase==='hide'||scenario?.crouched)){
   const camera={x:3.95,y:s.y+1.55,z:2.30};
   const pathClear=[.25,.5,.75,1].every(t=>!blocked(world.boxes,from.x+(outside.x-from.x)*t,s.y,from.z+(outside.z-from.z)*t,.18,1.65));
   if(pathClear&&!lineBlocked(world.boxes,camera,{...from,y:s.y+.92})&&!lineBlocked(world.boxes,camera,{...outside,y:s.y+.92})){
    transition.walk={from,to:outside,ground:s.y,stand:s.crouched?STAND_SECONDS:0,walk:Math.max(.48,distance/.97),camera};
   }
  }
  resetInput();poseTransition=transition;
  if(reducedMotion.matches)poseTransition.entryElapsed=HIDE_SECONDS;
  if(transition.walk){updateHiding(0);return;}
  play(object.wardrobeLeaves?'door-open':'cloth',object,.65);updateHiding(0);
 }
 function updateHiding(dt){
  if(!poseTransition||paused||modal||$('lab-camera-settings').open||isPortrait()||document.hidden||!hasFocus||contextLost)return;
  const transition=poseTransition;transition.elapsed+=dt;
  if(transition.walk){
   const action=wardrobeWalk(transition.elapsed,transition.walk);
   s.x=action.x;s.z=action.z;
   if(action.standing===1){s.crouched=false;s.eye=1.63;}
   if(transition.elapsed<transition.walk.stand+transition.walk.walk)return;
   transition.from={...transition.outside,y:s.y+1.63};
   if(!transition.approached){transition.approached=true;play('door-open',transition.object,.65);}
  }
  transition.entryElapsed=Math.min(HIDE_SECONDS,transition.entryElapsed+dt);
  const frame=hidingFrame({...transition,progress:transition.entryElapsed/HIDE_SECONDS,wardrobe:!!transition.object.wardrobeLeaves});
  s.poseCamera=frame.camera;if(transition.object.wardrobeLeaves)poseFurniture(transition.object,frame.doorAmount);
  if(transition.object.lid){const t=transition.entryElapsed/HIDE_SECONDS;poseTrunk(transition.object.lid,Math.sin(t*Math.PI));}
  if(transition.entryElapsed>=HIDE_SECONDS){
   if(transition.object.wardrobeLeaves)play('door-close',transition.object,.65);
   const {x,z,crouched,eye}=transition.outside;
   Object.assign(s,{x,z,crouched,eye});
   if(transition.entering){s.hidden=hiddenPose(transition.object,transition.outside);s.yaw=transition.inside.yaw;s.pitch=transition.inside.pitch;sound.setTension(.85);say(transition.object.wardrobeLeaves?'Dentro del armario · mira por las rendijas · E o Salir':'Escondida · E o Salir',4);}
   else{s.hidden=null;s.yaw=frame.camera.yaw;s.pitch=0;sound.setTension(.55);say('Has salido con cuidado');}
   s.poseCamera=null;poseTransition=null;resetInput();saveCheckpoint();if(!isPaused())sound.resume();
  }
 }
 function exitPose(){
  const pose=s.hidden||s.lying;if(!pose)return;
  if(s.hidden){const object=world.objects.find(o=>o.id===s.hidden.objectId);if(object){beginHiding(object,false);return;}}
  const position={x:pose.returnX,z:pose.returnZ};
  let free=null;
  for(const [dx,dz] of [[0,0],[.35,0],[-.35,0],[0,.35],[0,-.35],[.5,.5]]){
   const x=position.x+dx,z=position.z+dz;
   if(!blocked(world.boxes,x,s.y,z,.2,1.65)){free={x,z};break;}
  }
  if(!free){say('No hay espacio libre para salir');return;}
  s.x=free.x;s.z=free.z;s.hidden=null;s.lying=false;s.pitch=0;s.eye=s.crouched?1.03:1.63;
  play('hide');say('Has salido');
 }
 function interact(){
  const now=performance.now();if(now-lastInteraction<260)return;lastInteraction=now;handAction=1;
  if(s.hidden||s.lying){exitPose();return;}
  const o=closestObject(world,s,focus);if(!o){say('Acércate a un objeto y míralo para interactuar');return;}
  if(o.kind==='light-switch'){
   const on=toggleCircuit(o.circuit);play('click',o);
   say(on===null?'Sin corriente · revisa el interruptor general':on?'Luz encendida':'Luz apagada');
  }else if(o.kind==='power-switch'){
   const on=toggleHousePower(o);play('latch',o);
   if(!on)updateBlackout(world.lights.power,0,false);
   if(!on){world.television.power.on=false;television.sync(false,false);}
   say(on?'Corriente restablecida':'Corriente cortada');
  }else if(o.kind==='rug'){
   if(o.hatch.amount>0||o.hatch.open){say('Cierra la trampilla antes de volver a cubrirla');return;}
   o.aside=!o.aside;o.hatch.concealed=true;play('cloth',o);
  }else if(o.kind==='hatch'){
   if(o.amount!==Number(o.open))return;
   if(puzzle.rescued&&louis?.phase==='hidden'&&o.open&&!rcTrap.armed){
    rcTrap.armed=true;saveCheckpoint();say('Trampa preparada. Usa el auto para atraer al secuestrador al sótano y activa la escotilla.',7);play('latch',o);return;
   }
   if(rcTrap.armed&&!rcTrap.closed){say('La trampa está preparada. Espera a que el secuestrador baje y activa el cierre desde la tablet.',5);return;}
   if(s.y<-.04||inHatch(s.x,s.z,.14)){say('Apártate del borde para mover la trampilla');return;}
   if(o.locked){
    if(!s.inventory.redKey){play('latch',o);say('Candado rojo · busca la llave sobre la barra de la cocina',4);return;}
    o.locked=false;s.inventory.redKey=false;if(equipment==='red-key')equip('empty');phone.setInventory(s.inventory);
    for(const chain of o.chains)chain.hiddenGeometry=true;
    renderer.updateVisibility();play('latch',o);
   }
   o.open=!o.open;
   if(reducedMotion.matches)poseHatch(o,Number(o.open));
   play(o.open?'door-open':'door-close',o,.85);
  }else if(o.kind==='tap'){
   o.on=!o.on;o.water.y=o.on?1.01:-100;play('click',o);say(o.on?'Llave de agua abierta':'Llave de agua cerrada');
  }else if(o.kind==='door'||o.kind==='cupboard'){
   if(o.id==='entrada'&&o.sealed&&events.phase==='escape'){
    if(!s.inventory.masterKey){say('Necesitas la llave maestra del piano del descansillo.',5);play('latch',o);return;}
    const opened=animateFurniture(o,true,{player:s,reducedMotion:reducedMotion.matches});
    if(!opened.started){say('Retrocede un poco para abrir la puerta.');return;}
    o.sealed=false;
    for(const box of world.boxes)if(box.id.startsWith('entry-padlock'))box.hiddenGeometry=true;
    renderer.updateVisibility();play('unlock',o);saveCheckpoint();say('La llave maestra abrió la salida.');
    return;
   }
   if(demo&&o.id==='dormitorio'&&!canOpenBedroom(puzzle)){say('Busca la llave con lazo en el cajón del estudio.',4);play('latch',o);return;}
   if(o.sealed||o.locked&&!s.inventory.key){say(o.sealed?'Cerró la puerta con un candado. Busca otra salida.':'La puerta tiene un pequeño candado. Busca una llave.');play('latch',o);return;}
    const opening=!o.open;if(pursuer.active&&!sweepClear(o,o.amount,opening?1:0,pursuer)){say('No puedes mover la puerta mientras alguien ocupa el paso.');return;}const result=animateFurniture(o,opening,{player:s,reducedMotion:reducedMotion.matches});
    if(!result.started){if(result.reason==='blocked')say('No puedes mover la puerta mientras estás en el paso.');return;}
    if(o.id==='dormitorio'&&opening&&o.locked){o.locked=false;s.inventory.key=false;if(equipment==='key')equip('empty');phone.setInventory(s.inventory);}
    if(demo&&o.id==='dormitorio'&&opening&&result.complete)puzzle=puzzleEvent(puzzle,'door');
    play(o.kind==='cupboard'?'drawer':opening?'door-open':'door-close',o);
    say(o.kind==='cupboard'?(opening?'Refrigerador abierto':'Refrigerador cerrado'):(opening?'Abriendo puerta…':'Cerrando puerta…'));
  }else if(o.kind==='drawer'){
   const keyDrawer=demo&&o.id==='drawer';
    const opening=!o.open,result=animateFurniture(o,opening,{player:s,reducedMotion:reducedMotion.matches});
    if(!result.started){if(result.reason==='blocked')say('Deja un poco de espacio delante del cajón.');return;}
    if(keyDrawer&&opening){puzzle=puzzleEvent(puzzle,'drawer');world.objects.find(k=>k.id==='key').taken=puzzle.key;say(puzzle.key?'Ya guardaste la llave en la mochila.':'Abriendo el cajón… una llave con un lazo.',3);}
    else if(o.id==='landing-cabinet'&&opening&&!s.inventory.torch)say('La linterna brilla dentro del cajón.');
    else say(opening?'Abriendo cajón…':'Cerrando cajón…');
    play('drawer',o);
  }else if(o.kind==='battery'){o.taken=true;s.inventory.batteries++;renderer.updateVisibility();play('pickup',o);say('Pila guardada en la mochila');}
  else if(o.kind==='flashlight'){o.taken=true;s.inventory.torch=true;s.flashlight=true;phone.setInventory(s.inventory);equip('flashlight');renderer.updateVisibility();play('pickup',o);say('Linterna guardada');}
  else if(o.kind==='key'){
   if(o.master){collectMasterKey();return;}
   o.taken=true;if(o.red)s.inventory.redKey=true;else{s.inventory.key=true;if(demo)puzzle=puzzleEvent(puzzle,'key');}phone.setInventory(s.inventory);renderer.updateVisibility();play('pickup',o);say(o.label+' obtenida');
  }
  else if(o.kind==='note'){
   o.taken=true;
   const note={id:o.id,label:o.label,text:o.text};
   if(o.mirrored){
    mirrorSafe.collect();
    s.inventory.pendingNote=note;
    equipmentBeforeNote=equipment==='paper'?'empty':equipment;
    equip('paper');
    say('Nota equipada · puedes observarla en tu mano',4);
   }else{
    s.inventory.notes.push(note);
    if(demo&&o.id==='note-hall')puzzle=puzzleEvent(puzzle,'note');
    showNote(o);
   }
   phone.setInventory(s.inventory);renderer.updateVisibility();play('note',o);
  }
  else if(o.kind==='rc-car'){
   if(rc.mode==='packed'||recoverRC(rc)){
    rc.mode='packed';o.taken=true;o.interactable=false;s.inventory.rc=true;
    phone.setInventory(s.inventory);equip('rc');rebuild();play('pickup',o);
    say('Auto de carreras rosa y tablet guardados como un solo objeto. Pulsa USAR.',4);
   }
  }
  else if(o.kind==='piano')openPiano(o);
  else if(o.kind==='safe')showSafe(o);
  else if(o.kind==='television'){
   if(!housePowered(world.lights.power)){say('La tele no tiene corriente');return;}
   o.power.on=!o.power.on;
   television.sync(o.power.on,true);
   play(o.power.on?'tv-static':'click',world.television);
  }
  else if(o.kind==='picture'||o.kind==='inspect'){
   play('click',o);showModal(o.label,`<p>${escapeHTML(o.text)}</p>`);
  }else if(o.kind==='rescue'){
   if(demo&&!canRescue(puzzle)){say('No es seguro sacarlo todavía. Investiga el dormitorio primero.',4);return;}
   if(demo&&config.entry!=='rescue'&&events.phase!=='evaded'){say('Primero despista al perseguidor para que puedan salir.',4);return;}
   puzzle=puzzleEvent(puzzle,'rescue');o.taken=true;
   if(demo){
    // The waiting captive is ALREADY the rigged Photo-A companion.
    // Reuse that actor instead of spawning a second Louis during untying:
    // both phases draw the same face texture, rig and body mesh.
    const captive=world.objects.find(item=>item.id==='captive-louis');
    const rescued=createLouisEscape(world);
    louis=captive?Object.assign(captive,rescued):rescued;
    loisShotDirector=createLoisShotDirector();
    if(!captive)world.objects.push(louis);
    events.phase='rc-rescue';sound.setThreat(false);
    phone.close();resetInput();rebuild();play('cloth',o);play('pickup',o);
    say('Kitty se arrodilla junto a Louis para soltar las cuerdas. Mantén silencio…',4);
   }else{
    // Non-demo rescue still hides the captive, without leaving a ghost actor.
    const captive=world.objects.find(item=>item.id==='captive-louis');
    if(captive)captive.taken=true;
    for(const box of world.boxes)if(box.id.startsWith('captive-rope-'))box.hiddenGeometry=true;
    rebuild();phone.close();resetInput();pursuer.reset();sound.setThreat(false);
    if(!events.complete())events.phase='safe';
    play('cloth',o);play('pickup',o);
    showModal('¡Louis está a salvo!', '<p>Kitty le suelta las manos. Louis murmura: «Sabía que ibas a venir».</p>',[[config.onRescue?'Terminar el juego':'Volver a pruebas',config.onRescue?'finish':'exit']]);
   }
  }
  else if(o.kind==='bed'){
   s.lying={returnX:o.returnX,returnZ:o.returnZ};s.x=o.x;s.z=o.z-.25;s.pitch=-.08;
   play('bed',o);say('Te has acostado. Pulsa USAR para levantarte.');
  }else if(o.kind==='hide'){
   beginHiding(o,true);
  }
  if(CHECKPOINT_INTERACTIONS.has(o.kind))saveCheckpoint();
 }
 function showNote(note,back='close'){
  showModal(note.label,`<p class="house-note-sheet">${escapeHTML(note.text)}</p>`,[[back==='bag'?'Volver a la mochila':'Cerrar',back]]);
 }
 function placePianoScore(){
  const {piano:instrument,pianoSheet}=world;
  if(instrument.scorePlaced||!pianoSheet.taken||
   roomAt(s.x,s.z,s.y)!==roomAt(instrument.x,instrument.z,instrument.y)||
   Math.hypot(s.x-instrument.x,s.z-instrument.z)>1.95)return;
  setPianoScore(instrument,true);
  sound.preparePiano();
  play('cloth',instrument);say('Kitty colocó la partitura en el atril.');
 }
 function openPiano(object){
  if(!['explore','evaded','escape'].includes(events.phase)){say('Ahora no conviene hacer ruido.');return;}
  placePianoScore();
  showModal('Piano antiguo',`<div class="piano-sheet-ui"><div class="piano-title">${object.scorePlaced?'Mia &amp; Sebastian’s Theme':'Piano libre'} <span class="piano-page-label"></span></div>
   <div class="piano-score" role="img" aria-label="Partitura"></div><div class="piano-time" aria-hidden="true"><i></i></div>
   <div class="piano-keys">${pianoKeyboard()}</div></div><output class="piano-result" aria-live="polite"></output>`,
   [['Levantarse','close'],['Practicar pieza completa','piano-practice'],['Recoger llave maestra','piano-collect']]);
  piano=new PianoSession(object,dialog,sound,saveCheckpoint);
  sound.preparePiano();
  s.poseCamera=object.seat;dialog.classList.add('house-piano-dialog');
 }
 function pianoRunning(){return !paused&&hasFocus&&!document.hidden&&!isPortrait()&&!contextLost&&!$('lab-camera-settings').open;}
 function playPiano(index){
  if(piano&&pianoRunning())piano.press(index,performance.now());
 }
 function collectMasterKey(){
  const {piano:instrument}=world,key=instrument.reward;
  if(!instrument.solved||key.taken)return;
  key.taken=true;s.inventory.masterKey=true;
  posePianoReward(instrument);renderer.updateVisibility();saveCheckpoint();
  if(piano){
   piano.collectButton.hidden=true;
   piano.practiceButton.focus({preventScroll:true});
   piano.result.textContent='Llave maestra guardada · Abre la puerta principal';
   sound.pianoReveal('key');
  }else{play('pickup',key);say('Llave maestra guardada · Abre la puerta principal',5);}
 }
 function showMirrorNote(back='close'){
  showModal('Nota con escritura extraña',`<div class="house-note-sheet mirror-note-paper"><span class="mirror-note-writing" aria-hidden="true">${SAFE_CODE}</span><span class="mirror-note-description">Cuatro cifras escritas al revés.</span></div>${mirrorSafe.revealed?`<p class="mirror-note-reading">Lectura del espejo: <strong>${SAFE_CODE}</strong></p>`:'<p>Las marcas parecen tener sentido desde otro punto de vista.</p>'}`,[['Volver',back]]);
  dialog.querySelector('.lab-paper').classList.add('mirror-note-modal');
 }
 function showSafe(object){
  if(object.motion){say('La caja se está abriendo…');return;}
  if(mirrorSafe.opened){showModal('Dentro de la caja fuerte','<p>En el sobre está el símbolo del corazón.</p>');return;}
  activeSafe=object;safeInput='';
  showModal('Caja fuerte','<p class="safe-instruction">Introduce la combinación de cuatro cifras.</p><output id="safe-code" class="safe-code" aria-label="Combinación introducida" aria-live="polite">· · · ·</output><div class="safe-keypad" role="group" aria-label="Teclado de la caja fuerte">'+[1,2,3,4,5,6,7,8,9,'clear',0,'back'].map(n=>`<button data-act="safe:${n}"${n==='back'?' aria-label="Borrar última cifra"':n==='clear'?' aria-label="Borrar combinación"':''}>${n==='clear'?'C':n==='back'?'⌫':n}</button>`).join('')+'</div><p id="safe-feedback" class="safe-feedback" role="status"></p>',[['Abrir caja','safe:submit'],['Cerrar','close']]);
  dialog.querySelector('.lab-paper').classList.add('safe-paper');
 }
 function safeAction(action){
  if(modal!=='Caja fuerte'||!activeSafe)return;
  const feedback=$('safe-feedback');
  if(action==='submit'){
   if(safeInput.length!==4){feedback.textContent='Faltan cifras: la combinación tiene cuatro.';return;}
   const object=activeSafe,result=mirrorSafe.submit(safeInput,()=>animateFurniture(object,true,{player:s,reducedMotion:reducedMotion.matches}).started);
   if(result==='wrong'){safeInput='';feedback.textContent='La combinación no coincide. Puedes volver a intentarlo.';play('latch',object);}
   if(result==='blocked'){feedback.textContent='Deja un poco de espacio delante de la caja para abrirla.';return;}
   if(result==='opened'){
    if(demo)puzzle=puzzleEvent(puzzle,'symbol');
     s.inventory.notes.push({...SAFE_REWARD});phone.setInventory(s.inventory);saveCheckpoint();
    modalClose();play('keys',object);say('Caja abierta · símbolo del corazón obtenido',4);return;
   }
  }else{feedback.textContent='';if(action==='clear')safeInput='';else if(action==='back')safeInput=safeInput.slice(0,-1);else if(/^\d$/.test(action)&&safeInput.length<4)safeInput+=action;}
  $('safe-code').textContent=(safeInput+'····').slice(0,4).split('').join(' ');
 }
 function bag(){
  const notes=s.inventory.notes.map(n=>`<button class="lab-note" data-act="read" data-id="${escapeHTML(n.id)}">✉ ${escapeHTML(n.label)} ↗</button>`).join('')||'<p>Aún no hay notas guardadas.</p>';
  const actions=[['Cerrar mochila','close']];
  const charge=Math.ceil(s.battery);
  if(charge<100&&s.inventory.batteries>0)actions.unshift(['Usar pila (hasta +'+SPARE_CHARGE+'%)','recharge']);
  showModal('Mi mochila',`<p><b>Auto RC:</b> ${s.inventory.rc?'Auto y tablet listos':'Sin recoger'}</p><p><b>⚿ Llave:</b> ${s.inventory.key?'Llave con lazo · abre el dormitorio':'Sin llave con lazo'}</p>${s.inventory.masterKey?'<p><b>Llave maestra</b> · Abre la puerta principal</p>':''}<p><b>Linterna:</b> ${charge}% · <b>Pilas de repuesto:</b> ${s.inventory.batteries}</p><div class="lab-note-list">${notes}</div>`,actions);
 }
 function startBatterySwap(){
  if(batterySwap!==null||!s.inventory.torch||s.inventory.batteries<1||Math.ceil(s.battery)>=100||s.hidden||s.lying)return false;
  s.inventory.batteries--;
  batterySwap=0;
  play('click');say('Cambiando pila…');
  return true;
 }
 function recharge(){
  if(!startBatterySwap())return;
  modalClose();
  equip('flashlight');
 }
 function updateBatterySwap(dt){
  if(batterySwap===null||isPaused()||phone.open||events.phase==='arrival')return;
  const before=batterySwap;
  batterySwap+=dt;
  if(before<BATTERY_SWAP_SECONDS*.68&&batterySwap>=BATTERY_SWAP_SECONDS*.68)play('click');
  if(batterySwap<BATTERY_SWAP_SECONDS)return;
  s.battery=Math.min(100,s.battery+SPARE_CHARGE);
  batterySwap=null;
  saveCheckpoint();
  play('light');say('Pila cambiada · '+Math.ceil(s.battery)+'%');
 }
 function drainFlashlight(dt){
  const before=s.battery;
  s.battery=Math.max(0,before-dt*FLASH_DRAIN);
  if(!s.battery&&!startBatterySwap()){s.flashlight=false;play('light');say('La linterna se apagó · busca una pila o un interruptor.',5);}
  else if(before>FLASH_LOW&&s.battery<=FLASH_LOW)say('Batería baja · quedan '+FLASH_LOW+'%',4);
 }
 function togglePause(){if(!ready||contextLost)return;$('lab-camera-settings').open=false;paused=!paused;if(paused){sound.pause();showModal('Pausa',`<p>El tiempo de la casa y sus sonidos se han detenido.</p>`,[['Continuar','resume'],['Volver a pruebas','exit']]);}else{modalClose();sound.resume();}}
 const inBathroom=()=>roomAt(s.x,s.z,s.y)==='Baño';
 function useEquipment(){
  if(s.hidden||s.lying)return;
  if(equipment==='rc'){
   if(!deployRC(rc,s,world)){say('Necesitas un suelo libre para colocar el auto.');return;}
   cancelEmote({immediate:true});releaseMouse();resetInput();
   equipment='rc-tablet';equipmentAge=0;phone.equip('rc');
   rebuild();play('cloth');
   return;
  }
  if(equipment==='phone'&&!noteLift){releaseMouse();cancelEmote();phone.show();resetInput();}
  if(equipment==='paper'){const note=s.inventory.pendingNote??s.inventory.notes.at(-1);if(note?.id==='mirror-note')showMirrorNote();else if(note)showNote(note);}
  if(equipment==='flashlight')toggleFlash();
 }
 async function previewAudio(kind){
  const mixer=root.querySelector('.house-mixer');
  if(!await sound.start()||!active)return;
  if(!$('lab-camera-settings').open||!mixer.open){if(isSuspended())sound.pause();return;}
  audioPreview=true;
  sound.stopEmote();
  sound.recordings?.setMood(kind==='music'?'tension':kind==='ambient'?'ambient':sound.threat?'tension':'ambient');
  if(kind==='six-seven')sound.emote(kind,EMOTES.find(emote=>emote.id===kind).duration);
  else if(kind==='notification')sound.sequence(kind);
  else if(kind!=='ambient'&&kind!=='music')play(kind==='master'||kind==='effects'?'door-open':kind);
 }
 async function copyMix(){
  const field=root.querySelector('.mixer-export'),status=root.querySelector('.mixer-status');
  field.value=JSON.stringify(sound.settings,null,2);
  try{await navigator.clipboard.writeText(field.value);field.hidden=true;status.textContent='Mezcla copiada.';}
  catch{field.hidden=false;field.select();status.textContent='Copia los valores seleccionados.';}
 }
 function runAction(act,node){
  if((events.phase==='safe'||events.phase==='failed')&&!['retry-arrival','exit','reset','finish'].includes(act))return;
  if(act==='retry-arrival'){
   if(scenario?.events==='wake'){ready=false;intro=true;reset();showTrialStart();return;}
   paused=false;modalClose();Object.assign(s,encounterCheckpoint);s.hidden=null;s.lying=false;s.crouched=false;s.eye=1.63;s.poseCamera=null;poseTransition=null;
   pursuer.reset();poseFurniture(world.objects.find(o=>o.id==='wardrobe'),0);
   updateBlackout(world.lights.power,0,false);
   if(world.objects.find(o=>o.id==='entrada').sealed){
    events.phase='hunt';events.remaining=28;pursuer.resumeSearch();pursuer.cooldown();saveCheckpoint();resetInput();return;
   }
   events.retry();
   poseArrivalCar(world.car,0);
   world.objects.find(o=>o.id==='entrada').sealed=false;for(const box of world.boxes)if(box.id.startsWith('entry-padlock'))box.hiddenGeometry=true;
   world.entryWindow.latch.hiddenGeometry=true;poseFurniture(world.entryWindow,1);rebuild();sound.setThreat(true);resetInput();return;
  }
  if(act==='exit'){stop();onExit();return;}
  if(act==='finish'){config.onRescue?.();return;}
  if(act.startsWith('rc:')&&(rc?.mode!=='driving'||isPaused()))return;
  if(act==='rc:stop'){
   if(stopRC(rc)){equipment='rc';equipmentAge=0;phone.equip('rc');resetInput();say('Tablet guardada · el autito queda en el suelo. Pulsa USAR para conducir de nuevo.',4);}
   return;
  }
  if(act==='rc:noise'){
   if(beepRC(rc)){
    if(events.phase==='rc-setup'&&!pursuer.active)pursuer.start();
    play('rc-beep',rc);
   }return;
  }
  if(act==='rc:trap'){
   if(!canTrapPursuer(pursuer,world.hatch,rcTrap.armed)){say('Espera a que el secuestrador entre por completo al túnel.');return;}
   rcTrap.closed=true;rcTrap.armed=false;
   world.hatch.open=false;poseHatch(world.hatch,0);pursuer.mode='trapped';pursuer.path=[];
   stopRC(rc);equipment='rc';phone.equip('rc');
   const entrance=world.objects.find(o=>o.id==='entrada');entrance.sealed=true;entrance.locked=false;setDoor(entrance,false);
   for(const box of world.boxes)if(box.id.startsWith('entry-padlock'))box.hiddenGeometry=false;
    freeLouis(louis);revealGreyCat(world.greyCat);events.phase='escape';sound.setThreat(false);resetInput();rebuild();saveCheckpoint();
   play('hatch-close',world.hatch);
   say(s.inventory.masterKey?'¡Atrapado! Abre la puerta principal con la llave maestra y sal con Louis.':'¡Atrapado! La llave maestra del piano abre la puerta principal.',8);
   return;
  }
  if(act==='mouse'){lockMouse();return;}
  if(act.startsWith('piano:')){playPiano(Number(act.slice(6)));return;}
  if(act==='piano-practice'){if(pianoRunning())piano?.start('practice');return;}
  if(act==='piano-collect'){if(piano?.mode==='complete'&&pianoRunning())collectMasterKey();return;}
  if(act==='skip-intro'){if(cinematic)finishWindowIntro();return;}
  if(act==='pause'){togglePause();return;}
  if(act==='resume'){paused=false;modalClose();sound.resume();return;}
  if((!ready||cinematic||contextLost)&&act!=='start')return;
  if(act==='close'){paused=false;modalClose();if(!isPaused())sound.resume();return;}
  if(act==='start'){intro=false;modalClose();ready=true;
   void sound.start().then(ok=>{if(!active)return;if(isPaused()&&!cinematic)sound.pause();if(!ok)say('Activa el sonido en Ajustes');});
   const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
    if(!resumed){
     if(shouldPlayWindowIntro({demo,trial:config.trial,checkpoint,reducedMotion:reduce}))beginWindowIntro();
     else if(demo&&checkpoint==='ground')finishWindowIntro();
    }
   try{screen.orientation?.lock?.('landscape').catch(()=>{});}catch{}return;}
  if(act==='recharge'){recharge();return;}
  if(act.startsWith('safe:')){safeAction(act.slice(5));return;}
  if(act==='read'){const note=s.inventory.notes.find(n=>n.id===node.dataset.id);if(note?.id==='mirror-note')showMirrorNote('bag');else if(note)showNote(note,'bag');return;}
  if(act==='bag'){if(rc?.mode==='driving')return;bag();return;}
  if(act==='reset'){
   if(scenario){ready=false;intro=true;}
    checkpointStore?.save(null);
   reset();
   if(scenario)showTrialStart();
   else if(ready&&!isPaused())sound.resume();
   return;
  }
  if(act==='hud'&&ready&&!cinematic){$('lab-camera-settings').open=false;phone.edit();return;}
  if(act==='copy-mix'){void copyMix();return;}
  if(act.startsWith('audio:')){void previewAudio(act.slice(6));return;}
  if(isPaused())return;
  if(rc?.mode==='driving'||rc?.mode==='deploying')return;
  if(events.phase==='arrival'||events.phase==='safe'||events.phase==='failed')return;
  if(act==='emotes'){
   const enabled=inBathroom()&&!notePresentation&&!noteLift;
   const opening=enabled&&$('house-emotes').hidden;
   // En escritorio, pointer lock monopoliza el mouse. Soltarlo al abrir
   // permite clicks reales sobre los botones HTML del selector de emotes.
   if(opening)releaseMouse();
   resetInput();
   $('house-emotes').hidden=!opening;
   root.querySelector('[data-act=emotes]').setAttribute('aria-expanded',String(opening));
   if(opening)$('house-emotes').querySelector('button')?.focus({preventScroll:true});
   return;
  }
  if(act.startsWith('emote:')&&inBathroom()&&!notePresentation&&!noteLift){
   const id=act.slice(6);$('house-emotes').hidden=true;
   root.querySelector('[data-act=emotes]').setAttribute('aria-expanded','false');
   if(id==='stop'){cancelEmote();equipmentAge=0;return;}
   if(s.hidden||s.lying||s.crouched){say('Ponte de pie para hacer un emote.');return;}
   const emote=EMOTES.find(e=>e.id===id);
   if(emote&&animator.startEmote(id)){sound.emote(id,emote.duration);resetInput();}
   return;
  }
  if(act==='interact'){cancelEmote();interact();}
  if(act==='crouch')crouch();
  if(act==='flash'||act==='phone')useEquipment();
 }
 function updateControls(){
  const target=closestObject(world,s,focus);focus=target;
  root.classList.toggle('lab-flash-off',!s.flashlight);
  $('house-light').hidden=equipment!=='flashlight'||!!s.hidden||!!s.lying;
  $('house-use-phone').hidden=!['phone','paper','rc'].includes(equipment)||notePresentation||!!noteLift||!!s.hidden||!!s.lying;
  $('house-use-phone').setAttribute('aria-label',equipment==='rc'?'Usar auto RC':equipment==='paper'?'Observar nota':'Usar teléfono');
  $('house-use-phone').querySelector('small').textContent=equipment==='paper'?'Observar':'Usar';
  const canEmote=inBathroom()&&!notePresentation&&!noteLift;
  root.querySelector('[data-act=emotes]').hidden=!canEmote;
  if(!canEmote){$('house-emotes').hidden=true;
   root.querySelector('[data-act=emotes]').setAttribute('aria-expanded','false');}
  let objective=scenario?.objective??(config.entry==='mirror'?'Mira el reflejo':demo?(puzzle.rescued?'Louis está a salvo':!puzzle.key?'Recoge la llave del estudio':!puzzle.door?'Sube y abre el dormitorio':'Busca la trampilla de la cocina'):'Explora la casa');
  if(events.phase==='explore'&&demo&&!s.inventory.torch)objective='Busca la linterna en el descansillo';
  if(events.phase==='resting')objective='Espera a que termine la ronda';
  if(events.phase==='sleep')objective='El perseguidor duerme. Puedes salir.';
  if(events.phase==='lockdown')objective='Busca cobertura';
  if(events.phase==='evaded')objective=s.y<-.18&&!puzzle.rescued?'Sigue el túnel hasta Louis':'Busca la trampilla bajo el tapete';
  if(events.phase==='escape')objective=world.objects.find(o=>o.id==='entrada').sealed?
   s.inventory.masterKey?'Abre la puerta con la llave maestra':'Recoge la llave maestra del piano':
   world.greyCat.called?'Sigue a la gata gris':'Sal al jardín con Louis';
  if($('lab-objective').textContent!==objective)$('lab-objective').textContent=objective;
  const meter=$('house-charge'),charge=Math.ceil(s.battery);
  const hideMeters=isSuspended()||!!cinematic||events.phase==='arrival'||phone.open;
  meter.hidden=hideMeters||!s.inventory.torch;
  if(meter.getAttribute('aria-valuenow')!==String(charge)){
   meter.setAttribute('aria-valuenow',charge);meter.dataset.level=charge<=FLASH_LOW?'low':'normal';
   $('lab-charge').style.width=charge+'%';$('lab-charge-text').textContent=charge+'%';
  }
  const stamina=$('house-stamina'),reserve=Math.ceil(100*s.stamina/SPRINT_SECONDS);
  stamina.hidden=hideMeters||(!s.sprinting&&reserve>=100)||!!s.hidden||!!s.lying;
  if(stamina.getAttribute('aria-valuenow')!==String(reserve)){
   stamina.setAttribute('aria-valuenow',reserve);stamina.firstElementChild.style.width=reserve+'%';
  }
  root.classList.toggle('house-sprinting',s.sprinting&&!stamina.hidden);
  const interactButton=$('lab-interact');
  const canInteract=!!(target||s.hidden||s.lying||poseTransition)&&!isSuspended()&&!cinematic&&!phone.open&&!remoteInUse();
  interactButton.hidden=!canInteract;
  const hatchMoving=target?.kind==='hatch'&&target.amount!==Number(target.open);
  interactButton.disabled=!!target?.motion||hatchMoving||!!poseTransition;
  root.querySelector('.lab-cross').classList.toggle('lab-target',!!target);
  let action=interactionLabel(target);
  if(poseTransition)action=poseTransition.entering?'Entrando…':'Saliendo…';
  if(target?.motion||hatchMoving)action=target.state==='opening'||hatchMoving&&target.open?'Abriendo…':'Cerrando…';
  const actionLabel=interactButton.querySelector('small');
  if(actionLabel.textContent!==action)actionLabel.textContent=action;
  const focusLabel=canInteract&&mouseLocked()?(interactButton.disabled?action:'E o clic · '+action):'';
  if($('lab-focus').textContent!==focusLabel)$('lab-focus').textContent=focusLabel;
  const remote=rc?.mode==='driving';
  const deploying=rc?.mode==='deploying';
  $('house-rc-hud').hidden=!remote;
  if(remote){
   const status=rc.noise>0?'Señuelo activo · '+Math.ceil(rc.noise)+' s':'Señal conectada · '+Math.round(Math.abs(rc.velocity)*10)/10+' m/s';
   if($('house-rc-status').textContent!==status)$('house-rc-status').textContent=status;
   $('rc-trap-button').hidden=!canTrapPursuer(pursuer,world.hatch,rcTrap.armed);
   interactButton.hidden=true;
  }
  const announce=deploying||louis&&(['untying','climb','hide'].includes(louis.phase)||(louis.phase==='hidden'&&louis.age<1.6))||!!finalCutscene;
  $('house-rc-caption').hidden=!announce;
  if(announce)$('house-rc-caption').textContent=finalCutscene?'¡Libres! Kitty y Louis cruzan el jardín…':louis?.phase==='untying'?'Kitty desata las cuerdas mientras Louis espera en silencio…':louis?.phase==='hidden'?'Louis se agacha tras la barra americana y mira alrededor…':louis&&['climb','hide'].includes(louis.phase)?'Louis sube del sótano y busca refugio tras la barra americana…':rc.elapsed<.53?'Colocando el autito…':'Conectando la tablet…';
  root.classList.toggle('house-rc-deploying',deploying);
  root.classList.toggle('house-rc-driving',remote);
  interactButton.classList.toggle('lab-available',!!target||!!s.hidden||!!s.lying);
  $('lab-crouch').classList.toggle('lab-available',s.crouched);
  $('lab-crouch').setAttribute('aria-pressed',String(s.crouched));$('lab-crouch').setAttribute('aria-label',s.crouched?'Levantarse':'Agacharse');$('lab-crouch').querySelector('small').textContent=s.crouched?'Levantar':'Agachar';
  if(!demo&&$('lab-camera-settings').open)$('lab-metrics').textContent=`${fps} FPS · ${ctxRoom(s)} · altura ${s.y.toFixed(1)} m · rumbo ${Math.round((s.yaw*180/Math.PI%360+360)%360)}°`;
 }
 function interactionLabel(target){
  if(s.hidden)return 'Salir del escondite';
  if(s.lying)return 'Levantarse';
  if(!target)return 'Usar';
  if(target===world.pianoSheet)return 'Recoger partitura';
  switch(target.kind){
   case 'door':return target.id==='entrada'&&target.sealed&&events.phase==='escape'?'Abrir con llave maestra':target.open?'Cerrar puerta':'Abrir puerta';
   case 'drawer':return target.open?'Cerrar cajón':'Abrir cajón';
   case 'key':return target.master?'Recoger llave maestra':'Recoger llave';
   case 'note':return 'Leer nota';
   case 'rescue':return 'Liberar a Louis';
   case 'hide':return target.requiresCrouch&&!s.crouched?'Agáchate primero':target.label;
   case 'battery':return 'Recoger pila';
   case 'flashlight':return 'Recoger linterna';
   case 'piano':return 'Tocar el piano';
   case 'rc-car':return 'Recoger auto RC';
   case 'television':return target.power.on?'Apagar tele':'Encender tele';
   case 'power-switch':return target.power.on?'Cortar corriente':'Restablecer corriente';
   case 'rug':return target.aside?'Volver a cubrir':'Apartar tapete';
   case 'hatch':return target.open?'Cerrar trampilla':target.locked?'Abrir candado':'Abrir trampilla';
   case 'tap':return target.on?'Cerrar llave':'Abrir llave';
   case 'cupboard':return target.open?'Cerrar mueble':'Abrir mueble';
   case 'safe':return mirrorSafe.opened?'Ver contenido':'Introducir código';
   case 'light-switch':return !housePowered(world.lights.power)?'Sin corriente':target.circuit.on?'Apagar luz':'Encender luz';
   default:return target.label||'Examinar';
  }
 }
 function tick(dt){
  if(isPaused()||finalCutscene)return;
  updateFurniture(world.objects,dt,s);
  const louisCue=updateLouisEscape(louis,dt,s);
  if(louisCue==='untied'){
   for(const box of world.boxes)if(box.id.startsWith('captive-rope-'))box.hiddenGeometry=true;
   rebuild();play('cloth',louis);say('¡Las cuerdas cedieron! Louis sube con cuidado hacia la cocina.',5);
  }
  if(louisCue==='hidden'){
   events.phase='rc-setup';saveCheckpoint();say('Louis se escondió tras la barra de la cocina. Prepara la trampa en la escotilla.',6);
  }
  if(louis&&(['untying','climb','hide'].includes(louis.phase)||(louis.phase==='hidden'&&louis.age<1.6)))return;
  if(rc){
   updateRC(rc,dt);
   if(rc.mode==='driving'){
    const steer=Number(keys.has('d')||keys.has('ArrowRight'))-Number(keys.has('a')||keys.has('ArrowLeft'))+joystick.x;
    const throttle=Number(keys.has('w')||keys.has('ArrowUp'))-Number(keys.has('s')||keys.has('ArrowDown'))-joystick.z;
    driveRC(rc,world,{steer,throttle},dt);return;
   }
   if(rc.mode==='deploying')return;
  }
  updatePowerLever(world.lights.meter,reducedMotion.matches?1:dt);
  const hatch=world.hatch,hatchTarget=Number(hatch.open);
  if(hatch.amount!==hatchTarget)poseHatch(hatch,clamp(hatch.amount+Math.sign(hatchTarget-hatch.amount)*dt/.64,0,1));
  const rug=world.hatchRug,rugTarget=Number(rug.aside);
  if(rug.amount!==rugTarget)poseHatchRug(rug,reducedMotion.matches?rugTarget:clamp(rug.amount+Math.sign(rugTarget-rug.amount)*dt/.44,0,1));
  if(demo&&puzzle.key&&!puzzle.door&&world.objects.find(o=>o.id==='dormitorio').open)puzzle=puzzleEvent(puzzle,'door');
  handAction=Math.max(0,handAction-dt*3.5);
  clickAction=Math.max(0,clickAction-dt*6.0);
  const turn=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0);
  lookTarget.yaw+=turn*dt*1.65;
  lookTarget.pitch=clamp(lookTarget.pitch+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt*1.12,-1.10,1.10);
  if(s.hidden){const limit=s.hidden.hideType==='wardrobe'?.28:.6;lookTarget.yaw=clamp(lookTarget.yaw,s.hidden.yaw-limit,s.hidden.yaw+limit);lookTarget.pitch=clamp(lookTarget.pitch,-.14,.14);}
  const follow=followLook(s,lookTarget,dt,20);s.yaw=follow.yaw;s.pitch=follow.pitch;
  const targetDriftX=clamp(-(lookTarget.yaw-s.yaw)*.04,-.03,.03);
  const targetDriftY=clamp(-(lookTarget.pitch-s.pitch)*.03,-.02,.02);
  const springK=110,dampingC=16;
  const ax=(targetDriftX-handDrift.x)*springK-handDrift.vx*dampingC;
  const ay=(targetDriftY-handDrift.y)*springK-handDrift.vy*dampingC;
  handDrift.vx+=ax*dt;handDrift.x=clamp(handDrift.x+handDrift.vx*dt,-.04,.04);
  handDrift.vy+=ay*dt;handDrift.y=clamp(handDrift.y+handDrift.vy*dt,-.03,.03);
  let forward=Number(keys.has('w'))-Number(keys.has('s'))-joystick.z;
  let side=Number(keys.has('d'))-Number(keys.has('a'))+joystick.x;
  if(s.hidden||s.lying||phone.open||events.phase==='arrival'||events.phase==='safe'||events.phase==='failed'){forward=side=0;}
  const length=Math.hypot(forward,side);if(length>1){forward/=length;side/=length;}
  if(stickPointer===null)drawStick(side,-forward);
  velocity.forward=smoothAxis(velocity.forward,forward,dt,12);
  velocity.side=smoothAxis(velocity.side,side,dt,12);
  const wantsSprint=joystick.sprint||keys.has('ShiftLeft')||keys.has('ShiftRight');
  if(!wantsSprint)s.exhausted=false;
  const steepSteps=s.y<-.025&&inHatch(s.x,s.z);
  const sprint=wantsSprint&&length>.08&&!steepSteps&&!s.crouched&&!s.exhausted&&s.stamina>0;
  const speed=s.crouched?1.05:steepSteps?1.68:sprint?4.28:2.60;
  const dx=(Math.sin(s.yaw)*velocity.forward+Math.cos(s.yaw)*velocity.side)*speed*dt;
  const dz=(Math.cos(s.yaw)*velocity.forward-Math.sin(s.yaw)*velocity.side)*speed*dt;
  const body=s.crouched?1.04:1.64;
  const moved=navigate(s,world,dx,dz,body);
  if(events.phase==='escape'&&!world.objects.find(o=>o.id==='entrada').sealed&&louis?.phase==='follow'&&s.z>12.35&&s.x>4.6&&s.x<7.2){
   const ground=0,walk=2.70;
   finalCutscene={elapsed:0,
    kitty:{from:{x:s.x,z:s.z},to:{x:5.56,z:14.05},ground,walk,stand:0},
    louis:{from:{x:clamp(s.x+.36,5.35,6.45),z:s.z-.19},to:{x:6.23,z:13.95},ground,walk,stand:0},
    louisStride:louis.walk};
   events.phase='ending';resetInput();
   play('notification');
  }
  s.sprinting=sprint&&moved>.002;
  if(s.sprinting){
   s.stamina=Math.max(0,s.stamina-dt);s.recoveryDelay=.60;
   if(s.stamina===0)s.exhausted=true;
  }else{
   s.recoveryDelay=Math.max(0,s.recoveryDelay-dt);
   if(!s.recoveryDelay)s.stamina=Math.min(SPRINT_SECONDS,s.stamina+dt*.9);
  }
  s.eye+=( (s.crouched?1.03:1.63)-s.eye)*Math.min(1,dt*9);
  if(moved>.0001)s.bob+=moved*(s.crouched?5:8);
  for(const cue of floorSounds.advance(dt,s,moved))play(cue.kind,cue.origin?{...cue.origin,y:cue.origin.y+.25}:null,cue.level);
 }
 let statsAt=performance.now(),frameCount=0,slowSeconds=0;
 function updateStory(delta){
  if(!demo||isSuspended()||cinematic)return;
  if(events.phase==='car-preview'){
   events.time+=delta;poseArrivalCar(world.car,clamp(events.time/CAR_ARRIVAL_SECONDS,0,1));
   if(world.car.progress===1){events.phase='explore';say('Auto estacionado');}
   return;
  }
  if(scenario&&scenario.events!=='arrival'&&scenario.events!=='wake')return;
  const finalPhase=['rc-rescue','rc-setup','escape','ending'].includes(events.phase);
  if(config.entry==='rescue'&&!finalPhase)return;
  const power=world.lights.power;
  const blackoutCue=updateBlackout(power,delta,['patrol','hunt','evaded'].includes(events.phase));
  if(blackoutCue==='warning'){play('click',null,.42);say('La corriente está inestable.',2);}
  if(blackoutCue==='outage'){play('power-cut',null,.55);say('Corte breve de luz · sigue las luces de la escalera.',4);saveCheckpoint();}
  if(blackoutCue==='restored'){say('Volvió la luz.',2);saveCheckpoint();}
  const change=finalPhase?null:events.observe(puzzle);
  if(change==='message')sound.sequence('notification');
  if(change==='arrival'){
   sound.setThreat(true);
   cancelEmote();$('house-emotes').hidden=true;
   phone.close();resetInput();encounterCheckpoint={x:s.x,y:s.y,z:s.z,yaw:s.yaw,pitch:s.pitch};
   poseArrivalCar(world.car,0);
   thirdView=null;for(const [dx,dz]of [[1.4,1.4],[-1.4,1.4],[0,1.8],[0,-1.8]]){const camera={x:s.x+dx,y:s.y+1.8,z:s.z+dz};if(!blocked(world.boxes,camera.x,camera.y-.1,camera.z,.1,.2)&&!lineBlocked(world.boxes,camera,{x:s.x,y:s.y+1.2,z:s.z})){thirdView={...camera,yaw:Math.atan2(-dx,-dz),pitch:-.2};break;}}
   setDoor(world.objects.find(o=>o.id==='entrada'),false);
  }
  if(pursuer.active&&events.phase!=='rc-rescue'){
   const decoy=rc?.mode==='driving'&&(rc.noise>0||pursuer.canSee({x:rc.x,y:rc.y,z:rc.z,hidden:false,crouched:true,flashlight:false}))
    ?{active:true,noisy:rc.noise>0,x:rc.x,y:rc.y,z:rc.z,crouched:true,flashlight:false,hidden:false}:null;
   const hiding=s.hidden?world.objects.find(o=>o.id===s.hidden.objectId):poseTransition?.object;
   const previousMode=pursuer.mode;
   for(const signal of pursuer.update(Math.min(.055,delta),{x:s.x,y:s.y,z:s.z,crouched:s.crouched,flashlight:flashlightBeam(),dark:!housePowered(power),hidden:!!s.hidden&&!poseTransition,entering:!!poseTransition?.entering,hideId:hiding?.id,hideExit:hiding?{x:s.hidden?.returnX??hiding.returnX,y:s.y,z:s.hidden?.returnZ??hiding.returnZ}:null},door=>{if(door.id!=='entrada'&&!door.sealed&&!door.locked&&!door.motion&&sweepClear(door,door.amount,1,pursuer)){const result=animateFurniture(door,true,{player:s,reducedMotion:reducedMotion.matches});if(result.started)play('door-open',door);}},decoy)){
    if(signal==='step')play(pursuer.y>.1&&pursuer.y<HEIGHT-.1?'stair':'wood',pursuer,.8);
    if(signal==='stood')play('wood',pursuer,.9);
    if(signal==='rc-hit'){
     const pos=crashRC(rc,world);s.inventory.rc=false;equipment='empty';
     phone.setInventory(s.inventory);phone.equip('empty');resetInput();rebuild();
     play('alert',pursuer,1.1);
     say('El secuestrador golpeó el auto. Se perdió la señal; lo dejó en otro lugar de la casa ('+Math.round(pos.x)+', '+Math.round(pos.z)+'). Ve a recuperarlo.',7);
    }
    if(signal==='investigate')say('Notó movimiento. Busca cobertura.',2.5);
    if(signal==='spotted'){phone.close();play('alert',pursuer,.6);say('Te vio. Gira una esquina para perderlo.',3);}
    if(signal==='lost')say('Te perdió de vista. Puedes seguir con cuidado.',3);
    if(signal==='at-entry'){
     const door=world.objects.find(o=>o.id==='entrada');
     if(!door.sealed&&roomAt(s.x,s.z,s.y)!=='Jardín y vecindario'&&sweepClear(door,door.amount,0,s)){
      setDoor(door,false);door.sealed=true;for(const box of world.boxes)if(box.id.startsWith('entry-padlock'))box.hiddenGeometry=false;rebuild();
      play('door-close',door);play('latch',door);say('Cerró la puerta principal con un candado.',3);
     }
    }
   }
   if(pursuer.mode!==previousMode&&pursuer.mode==='patrol-rest')saveCheckpoint();
  }
  const storyDelta=events.phase==='hide'&&poseTransition?.entering&&poseTransition.object.wardrobeLeaves?0:delta;
  for(const cue of events.advance(storyDelta,!!s.hidden&&!poseTransition,{caught:pursuer.caught,clear:pursuer.lost>4&&pursuer.awareness<.1&&!pursuer.witnessed,visited:pursuer.visited,
   sleeping:pursuer.mode==='sleeping',leftBedroom:!poseTransition&&roomAt(s.x,s.z,s.y)!=='Dormitorio',entranceLocked:world.objects.find(o=>o.id==='entrada').sealed})){
   if(cue==='keys')sound.sequence('keys');if(cue==='knock')sound.sequence('trying');
   if(cue==='hide'){setDoor(world.objects.find(o=>o.id==='entrada'),false);poseFurniture(world.entryWindow,0);world.entryWindow.latch.hiddenGeometry=false;rebuild();play('latch',world.entryWindow.box);resetInput();phone.close();say('Cerró la ventana. ¡Escóndete en el armario!',4);}
   if(cue==='patrol'){pursuer.start();saveCheckpoint();say('Se oyen pasos hacia la escalera.',4);}
   if(cue==='resting')pursuer.goToBed();
   if(cue==='sleep'){sound.setThreat(false);saveCheckpoint();say('Se durmió. Ya es seguro salir.',4);}
   if(cue==='wake'){phone.close();resetInput();pursuer.wake();sound.sequence('notification',true);sound.setThreat(true);say('¡El mensaje lo despertó!',3);}
   if(cue==='hunt'){pursuer.resumeSearch();saveCheckpoint();}
   if(cue==='evaded'){pursuer.settleUpstairs();sound.setThreat(false);sound.sequence('notification');saveCheckpoint();say('Sube a revisar la planta alta. Busca la trampilla bajo el tapete de la cocina.',5);}
   if(cue==='safe'||cue==='failed'){phone.close();resetInput();play('alert',pursuer,.55);showModal(cue==='safe'?'Estás a salvo':'Te descubrieron',cue==='safe'?'<p>Te quedas en silencio.</p>':'<p>El perseguidor te alcanzó o vio dónde te escondías.</p><p>Retomas desde el último momento seguro con la llave y las pistas.</p>',cue==='safe'?[['Volver a pruebas','exit']]:[['Reintentar','retry-arrival'],['Salir','exit']]);}
  }
  if(events.phase==='arrival')poseArrivalCar(world.car,clamp(events.time/CAR_ARRIVAL_SECONDS,0,1));
 }
 function frame(now){
  if(!active||contextLost)return;raf=requestAnimationFrame(frame);
  const limit=(paused||!!modal&&!piano||$('lab-camera-settings').open||isPortrait()||document.hidden||!hasFocus)?1000/15:
   options.quality==='low'||piano&&piano.mode!=='performance'?1000/30:1000/60;
  if(now-lastPaint<limit-2)return;
  const shotDelta=Math.min(.1,Math.max(0,(now-last)/1000||0)),dt=Math.min(.055,shotDelta);last=now;lastPaint=now;
  if(!s||!renderer)return;
  updateHiding(dt);
  updateStory(shotDelta);
  const greyCat=world.greyCat;
  if(!isSuspended()&&greyCat.active){
   moveGreyCat(greyCat,shotDelta,!!finalCutscene,reducedMotion.matches);
   if(!greyCat.called&&s.y===0&&s.z>9.7&&Math.abs(s.x-5.9)<1.35){
    greyCat.called=true;
    play('cat',{x:greyCat.x,y:.35,z:greyCat.z},.95);
    say('Es la gatita del Churu. Nos espera junto a la salida.',4);
   }
  }
  updateBatterySwap(shotDelta);
  let view=cameraOf(s),hand=!s.hidden&&!s.lying&&!poseTransition&&!animator.performing&&!phone.open,torch=flashlightBeam(),introHands=null,distance=0;
  if(mouseLocked()&&!canLook())releaseMouse();
  if(cinematic){
   if(!paused&&!modal&&!isPortrait()&&!document.hidden&&hasFocus)cinematic.elapsed+=shotDelta;
   const progress=Math.min(1,cinematic.elapsed/WINDOW_SHOT_SECONDS);
   view=windowIntroCamera(progress);hand=false;torch=false;
   const shot=windowIntroState(progress);poseFurniture(world.entryWindow,shot.windowAmount);introHands=shot.hands;
   if(!paused&&!modal)for(const [at,name] of [[.16,'latch'],[.27,'window'],[.51,'cloth'],[.85,'land']])if(progress>=at&&!cinematic.cues.has(name)){cinematic.cues.add(name);play(name);}
   $('lab-intro-caption').textContent=progress<.18?'La ventana del jardín…':progress<.36?'Deslizo el pestillo despacio…':progress<.62?'Me apoyo y paso al otro lado…':progress<.86?'Con cuidado… sin hacer ruido.':'Ya estoy dentro.';
   if(progress>=1){finishWindowIntro();view=cameraOf(s);hand=true;}
  }else{
   const beforeX=s.x,beforeZ=s.z;tick(dt);view=cameraOf(s);elapsed+=isPaused()?0:dt;
   const dx=s.x-beforeX,dz=s.z-beforeZ;distance=Math.hypot(dx,dz);const divisor=distance||1;
   const wasEmote=animator.emote;
   animator.advance(dt,{distance,forward:(dx*Math.sin(s.yaw)+dz*Math.cos(s.yaw))/divisor,side:(dx*Math.cos(s.yaw)-dz*Math.sin(s.yaw))/divisor,paused:isPaused(),reduced:reducedMotion.matches,equipment,emoteElapsed:sound.emoteElapsed});
   const leftBathroom=wasEmote&&!inBathroom();
   if(leftBathroom)animator.cancelEmote();
   if(wasEmote&&!animator.emote){
    equipmentAge=0;
    if(leftBathroom||distance>.001)sound.stopEmote();
   }
   s.walkWeight=animator.weight;view=cameraOf(s);
   if(flashlightBeam()&&!isPaused())drainFlashlight(shotDelta);
   torch=flashlightBeam();
  }
  if(intro&&demo&&checkpoint==='ground'){view=windowIntroCamera(0);hand=false;torch=false;}
  if(!isPaused())placePianoScore();
  const instrument=world.piano;
  if(instrument.solved&&instrument.compartmentAmount<1&&!paused)
   posePianoCompartment(instrument,reducedMotion.matches?1:Math.min(1,instrument.compartmentAmount+shotDelta/.48));
  let thirdPerson=null,actorTime,actorWalk,actorPiano,shotLight=0;
  if(piano){
   piano.advance(now,pianoRunning(),reducedMotion.matches);
   const pose=piano.pose(reducedMotion.matches);
   view=pose.view;hand=false;torch=false;shotLight=.40;
   if(pose.actor){
    thirdPerson=piano.object.seat;
    actorPiano={instrument:piano.object,hands:pose.hands};actorTime=piano.sourceTime;
   }else if(!pose.hideHands)introHands=pose.hands;
  }
  if(louis&&(['untying','climb','hide'].includes(louis.phase)||(louis.phase==='hidden'&&louis.age<1.6))){
   if(!loisShotDirector)loisShotDirector=createLoisShotDirector();
   view=advanceLoisShot(loisShotDirector,louis.phase,louisCamera(louis),
    isSuspended()?0:shotDelta,reducedMotion.matches);
   hand=false;
   // Kitty's flashlight illuminates the otherwise unlit tunnel and Louis'
   // face throughout this framed scene; no global house lighting is altered.
   torch=true;
   if(louis.phase==='untying'){
    const t=louis.age||0,reach=Math.min(1,t/.7),knot=Math.sin(t*8)*.023;
    introHands=[-1,1].map(side=>({
     x:louis.x+side*(.22-.09*reach),
     y:louis.y+.58+.05*(1-reach)+knot,
     z:louis.z-.34+.16*reach
    }));
   }
  }else if(loisShotDirector){
   // Blend back into Kitty's normal camera after the kitchen hiding sequence.
   const exiting=finishLoisShot(loisShotDirector,view,isSuspended()?0:shotDelta,reducedMotion.matches);
   view=exiting.view;
   if(exiting.complete)loisShotDirector=null;
   else {hand=false;torch=true;}
  }
  let tabletLift;
  if(rc?.mode==='deploying'){
   const deployment=rcDeploymentView(rc,world,s,view,reducedMotion.matches);
   view=deployment.view;introHands=deployment.hands;tabletLift=deployment.tabletLift;
   hand=tabletLift!==null;torch=false;shotLight=s.y<0?.38:.16;
  }
  if(rc?.mode==='driving'){
   view=rcCamera(rc,world);hand=false;torch=true;shotLight=rc.y<0?.23:.08;
  }
  if(finalCutscene){
   if(!isSuspended())finalCutscene.elapsed+=shotDelta;
   const t=Math.min(1,finalCutscene.elapsed/4);
   actorWalk=wardrobeWalk(finalCutscene.elapsed,finalCutscene.kitty);
   const companion=wardrobeWalk(Math.max(0,finalCutscene.elapsed-.18),finalCutscene.louis);
   if(reducedMotion.matches)actorWalk.stride=0;
   Object.assign(louis,{x:companion.x,y:0,z:companion.z,yaw:companion.yaw,
    walk:finalCutscene.louisStride+companion.distance,speed:companion.stride*.88});
   const x=7.24+Math.sin(t*Math.PI)*.42,y=2.14,z=15.93+t*.82;
   view={x,y,z,yaw:Math.atan2(5.82-x,13.45-z),pitch:-.32};
   thirdPerson=actorWalk;hand=false;torch=false;shotLight=.36;
   if(t===1&&events.phase==='ending'){
    events.phase='safe';showModal('¡Kitty y Louis escaparon!', '<p>La gata gris les muestra el camino hacia el jardín. Louis y Kitty salen juntos.</p><p>Fin del rescate ♡</p>',[[config.onRescue?'Ver final':'Volver a pruebas',config.onRescue?'finish':'exit']]);
   }
  }
  const carShot=events.phase==='car-preview'||events.phase==='arrival'&&events.time<CAR_ARRIVAL_SECONDS;
  if(carShot){
   view=arrivalCarCamera(world.car.progress);hand=false;torch=false;shotLight=.22;
  }else if(events.phase==='arrival'){
   hand=false;phone.close();
   const inside=events.time-CAR_ARRIVAL_SECONDS,timeSinceCut=inside-2.9;
   if(inside>=1.65&&inside<2.9){view={x:2.32,y:1.59,z:10.38,yaw:.03,pitch:-.055};poseFurniture(world.entryWindow,1-clamp((inside-1.78)/.7,0,1));}
   else if(timeSinceCut<0||!thirdView)view={x:6.8,y:1.63,z:10.15,yaw:Math.atan2(5.9-6.8,12-10.15),pitch:0};
   else {thirdPerson=cameraOf(s);view=thirdView;actorTime=timeSinceCut;}
   const door=world.objects.find(o=>o.id==='entrada');poseFurniture(door,reducedMotion.matches?0:.02+.015*Math.sin(inside*45));
  }else if(wakeShot()){
   const x=3.88,y=HEIGHT+1.70,z=2.44;
   view={x,y,z,yaw:Math.atan2(BED_EXIT.x-.40-x,BED_EXIT.z-.19-z),pitch:-.16};hand=false;torch=false;shotLight=.18;
  }else if(poseTransition?.walk&&poseTransition.entryElapsed<HIDE_SECONDS*.63){
   const {walk,elapsed,entryElapsed,inside,outside}=poseTransition;
   actorWalk=wardrobeWalk(elapsed,walk);
   if(entryElapsed){
    const progress=entryElapsed/HIDE_SECONDS,step=clamp((progress-.22)/.42,0,1);
    const travel=step*step*(3-2*step),reach=Math.sin(Math.PI*clamp(progress/.61,0,1));
    actorWalk={...actorWalk,x:outside.x+(inside.x-outside.x)*travel,z:outside.z+(inside.z-outside.z)*travel,
     distance:actorWalk.distance+Math.hypot(inside.x-outside.x,inside.z-outside.z)*travel,stride:Math.sin(step*Math.PI),reach};
   }
   thirdPerson=actorWalk;
   const camera=walk.camera,dx=actorWalk.x-camera.x,dz=actorWalk.z-camera.z;
   view={...camera,yaw:Math.atan2(dx,dz),pitch:Math.atan2(s.y+1.01-camera.y,Math.hypot(dx,dz))};torch=false;shotLight=.15;
  }
  sound.carEngine(carShot&&!isSuspended()?world.car.progress:null);
  sound.rcMotor(rc?.mode==='driving'&&!isPaused()?rc.velocity:0);
  root.classList.toggle('house-arrival',events.phase==='arrival'||events.phase==='car-preview'||wakeShot()||!!actorWalk);
  root.classList.toggle('house-cutaway',carShot||wakeShot()||!!actorWalk);
  const chasing=pursuer.mode==='chase',investigating=pursuer.mode==='investigate',resting=pursuer.mode==='patrol-rest';
  danger.hidden=!['arrival','hide','patrol','hunt'].includes(events.phase)&&!(events.phase==='evaded'&&(chasing||investigating));
  danger.dataset.level=chasing?'chase':investigating?'watch':'search';
  const arrivalCaption=options.captions!==false&&events.time<CAR_ARRIVAL_SECONDS?'Se acerca un motor':'Alguien intenta entrar';
  const threatText=events.phase==='hide'?'Escóndete · '+Math.ceil(events.remaining)+' s':events.phase==='arrival'?arrivalCaption:chasing?'Te persigue · gira una esquina':investigating?'Busca cobertura':world.lights.power.blackout.left>0?'Corte de luz · sigue la escalera':resting?'Se detuvo a descansar':pursuer.mode==='cooldown'?'Se aleja · avanza con cuidado':s.hidden?'Sigue patrullando · espera a que se aleje':'Está patrullando';
  if(danger.textContent!==threatText)danger.textContent=threatText;
  root.classList.toggle('house-threat',!danger.hidden);
  if(!isSuspended())equipmentAge+=shotDelta;
  phone.update(events,isSuspended()?0:shotDelta);enableSound.hidden=!sound.settings.muted&&!!sound.context&&(sound.paused||sound.context.state==='running');
  const mirrorLit=torch||circuitPowered(bathCircuit);
  if(!isPaused()){
   if(noteHold>0)noteHold=Math.max(0,noteHold-dt);
   const canReadNote=events.phase==='explore'||events.phase==='evaded';
   const showNote=inBathroom()&&mirrorSafe.collected&&(!mirrorSafe.revealed||noteHold>0)&&canReadNote;
   if(showNote!==notePresentation){
    notePresentation=showNote;phone.equip(showNote?'empty':equipment);equipmentAge=0;
    if(showNote)cancelEmote({immediate:true});
   }
   const wantsNote=mirrorLit&&notePresentation;
   noteLift=reducedMotion.matches?Number(wantsNote):clamp(noteLift+(wantsNote?1:-1)*dt*2.6,0,1);
  }
  const raisedNote=noteLift>0&&!phone.open&&!cinematic&&events.phase!=='arrival'&&!s.hidden;
  const visualEquipment=raisedNote||equipment==='paper'&&(s.inventory.pendingNote??s.inventory.notes.at(-1))?.id==='mirror-note'?'note':notePresentation?'empty':equipment,noteRaise=noteLift*noteLift*(3-2*noteLift);
  if(roomAt(s.x,s.z,s.y)!=='Sala de estar')world.television.power.on=false;
  television.sync(world.television.power.on&&housePowered(world.lights.power),!isPaused()&&!phone.open);
  if(updateWallClock(world.clock)&&!isPaused()&&Math.hypot(s.x-world.clock.x,s.y,s.z-world.clock.z)<4.5)play('clock-tick',world.clock,.55);
  const outdoor=s.y<-.12?0:view.x<0||view.x>HOUSE.width||view.z<0||view.z>HOUSE.depth?1:Math.max(0,1-Math.min(view.x,HOUSE.width-view.x,view.z,HOUSE.depth-view.z)/1.5)*.22;
  sound.locate({room:roomAt(view.x,view.z,s.y),outdoor,hidden:!!s.hidden,powered:housePowered(world.lights.power)});
  try{
   renderer.render(view,torch,elapsed,hand,{bob:s.bob,action:handAction,clickAction,speed:animator.speed,acceleration:animator.acceleration,walkWeight:animator.weight,reduced:s.reduceBob,swayX:handDrift.x,swayY:handDrift.y,introHands,animator,feetY:s.y,crouched:s.crouched,equipment:visualEquipment,noteRaise,batterySwap,tabletLift,equipLift:raisedNote?-.52*(1-noteRaise):reducedMotion.matches?0:-.22*Math.pow(1-Math.min(1,equipmentAge/.3),2),bathDoorAmount:world.objects.find(o=>o.id==='bano').amount,thirdPerson,actorTime,actorWalk,actorPiano,shotLight,pursuer:pursuer.snapshot(),television});
   if(capturePhoto){capturePhoto=false;if(phone.open&&phone.app==='camera')phone.takePhoto(canvas);}
   phone.updateCamera(canvas,now);
  }catch(e){interruptGraphics('Error de renderizado',String(e.message||e));return;}
  const mirrorDistance=Math.hypot(view.x-BATH_MIRROR.x,view.z-BATH_MIRROR.z);
  const readingMirror=mirrorLit&&inBathroom()&&renderer.mirrorDrawn&&mirrorDistance<3&&Math.abs(view.pitch-Math.atan2(BATH_MIRROR.y-view.y,mirrorDistance))<.57&&!phone.open;
  const mirrorCue=mirrorSafe.advance(shotDelta,{active:!isPaused()&&!phone.open,mirror:readingMirror&&noteLift>=.95});
  if(mirrorCue==='hint')say(MIRROR_HINT,6);
  if(mirrorCue==='revealed'){
   noteHold=4;
   const note=s.inventory.pendingNote;
   if(note){
    s.inventory.notes.push({...note,label:'Nota del espejo · resuelta'});
    s.inventory.pendingNote=null;
    if(equipment==='paper'){
     equipment=equipmentBeforeNote;
     equipmentAge=0;
    }
    phone.setInventory(s.inventory);phone.equip('empty');
   }
   saveCheckpoint();
   play('pickup');
  }
  hudMessages.update({dt:isPaused()?0:shotDelta,blocked:isSuspended()||!!cinematic,danger:danger.hidden?'':danger.textContent,revelation:readingMirror&&mirrorSafe.collected&&mirrorSafe.revealed&&!mirrorSafe.opened?'En el espejo: '+SAFE_CODE+' · combinación de la caja fuerte':'',unread:phone.messageCount>phone.readCount,messageCount:phone.messageCount,phoneOpen:phone.open,dock:phone.rect});
  frameCount++;
  if(now-statsAt>1000){
   fps=Math.round(frameCount*1000/(now-statsAt));
   frameCount=0;statsAt=now;
   // One-way adaptive budget; avoid quality oscillations on slower mobile GPUs.
   if(ready&&!cinematic&&!isPaused()&&options.quality==='medium'){
    slowSeconds=fps<37?slowSeconds+1:0;
    if(slowSeconds>=3){
     options.quality='low';renderer.quality='low';
     root.querySelectorAll('[data-setting="quality"]').forEach(el=>el.value='low');
     say('Modo fluido activado para tu dispositivo',2.6);
    }
   }
  }
  updateControls();
 }
 function interruptGraphics(title,message){
  contextLost=true;cancelAnimationFrame(raf);raf=0;
  renderer?.destroy({keepCanvas:true});
  showModal(title,`<p>${escapeHTML(message)}</p>`,[['Volver a pruebas','exit']]);
 }
 try{renderer=new HouseRenderer(canvas,options.quality);reset(checkpointStore?.checkpoint);}catch(e){
  root.innerHTML=`<section class="lab-error" role="alert"><h2>No se pudo abrir la casa 3D</h2><p>${escapeHTML(String(e.message||e))}</p><button data-act="exit">Volver a pruebas</button></section>`;
  root.querySelector('[data-act="exit"]').addEventListener('click',()=>{stop();onExit();},{signal});
  return stop;
 }
 function pointerStick(e){if(!active||isPaused()||phone.open||events.phase==='arrival'||stickPointer!==null||e.button!==0)return;stickPointer=e.pointerId;stickPointerType=e.pointerType||'mouse';capture(e.currentTarget,e.pointerId);moveStick(e);e.preventDefault();}
 function drawStick(x,y){$('lab-stick').style.transform=`translate(${x*56}%,${y*56}%)`;}
 function moveStick(e){
  if(e.pointerId!==stickPointer)return;
  if(releasedPointer(e,stickPointerType)){endStick(e);return;}
  const r=$('lab-stick').parentElement.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  const dx=e.clientX-cx,dy=e.clientY-cy,dist=Math.hypot(dx,dy);
  joystick.sprint=stickPointerType==='touch'&&dist>r.width*(joystick.sprint?.53:.61);
  const radius=Math.max(28,r.width*.45),normalized=Math.min(1,dist/radius),deadzone=.13;
  const amount=normalized<=deadzone?0:(normalized-deadzone)/(1-deadzone);
  const curved=amount*amount*(3-2*amount);
  joystick.x=dist<.01?0:dx/dist*curved;joystick.z=dist<.01?0:dy/dist*curved;
  drawStick(dist<.01?0:dx/dist*normalized,dist<.01?0:dy/dist*normalized);
  e.preventDefault();
 }
 function endStick(e){if(e.pointerId!==stickPointer)return;const pointer=stickPointer;stickPointer=null;stickPointerType=null;joystick.x=0;joystick.z=0;joystick.sprint=false;releaseCapture($('lab-joystick'),pointer);$('lab-stick').style.transform='translate(0,0)';}
 function pointerLook(e){if(!canLook()||mouseLocked()||lookPointer!==null||e.button!==0)return;
  lookPointer=e.pointerId;lookPointerType=e.pointerType||'mouse';lookLast={x:e.clientX,y:e.clientY};capture(e.currentTarget,e.pointerId);e.preventDefault();}
 function moveLook(e){if(e.pointerId!==lookPointer)return;if(releasedPointer(e,lookPointerType)){endLook(e);return;}if(isPaused())return;const dx=e.clientX-lookLast.x,dy=e.clientY-lookLast.y;
  lookLast={x:e.clientX,y:e.clientY};
  aimLook(dx,dy);
  e.preventDefault();}
 function aimLook(dx,dy){
  lookTarget=applyLookDelta(lookTarget,dx,dy,options.sensitivity,options.invertX);
  if(s.hidden){const limit=s.hidden.hideType==='wardrobe'?.28:.6;lookTarget.yaw=clamp(lookTarget.yaw,s.hidden.yaw-limit,s.hidden.yaw+limit);lookTarget.pitch=clamp(lookTarget.pitch,-.14,.14);}
 }
 function endLook(e){if(e.pointerId!==lookPointer)return;const pointer=lookPointer;lookPointer=null;lookPointerType=null;releaseCapture($('lab-look'),pointer);}
 const stick=$('lab-joystick'),look=$('lab-look');
 function syncPointerMode(){
  root.classList.toggle('house-desktop',desktop.matches);
  $('house-lock-mouse').hidden=!desktop.matches||!canvas.requestPointerLock;
  const locked=mouseLocked();
  root.classList.toggle('house-mouse-locked',locked);
  $('house-mouse-status').hidden=!locked;
 }
 syncPointerMode();
 desktop.addEventListener('change',syncPointerMode,{signal});
 document.addEventListener('mousemove',e=>{if(mouseLocked()&&canLook())aimLook(e.movementX,e.movementY);},{signal});
 document.addEventListener('pointerlockchange',()=>{syncPointerMode();resetInput();if(!canLook())releaseMouse();},{signal});
 if(stick&&look){
  stick.addEventListener('pointerdown',pointerStick,{signal});stick.addEventListener('pointermove',moveStick,{signal});
  stick.addEventListener('pointerup',endStick,{signal});stick.addEventListener('pointercancel',endStick,{signal});
  look.addEventListener('pointerdown',pointerLook,{signal});look.addEventListener('pointermove',moveLook,{signal});
  look.addEventListener('pointerup',endLook,{signal});look.addEventListener('pointercancel',endLook,{signal});look.addEventListener('lostpointercapture',endLook,{signal});
  stick.addEventListener('lostpointercapture',endStick,{signal});
  // Capture-phase fallback also receives releases outside the original control.
  for(const type of ['pointerup','pointercancel'])window.addEventListener(type,e=>{endStick(e);endLook(e);},{signal,capture:true});
  window.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer&&releasedPointer(e,stickPointerType))endStick(e);if(e.pointerId===lookPointer&&releasedPointer(e,lookPointerType))endLook(e);},{signal,capture:true});
  window.addEventListener('mouseup',e=>{if(e.button!==0)return;if(stickPointerType==='mouse')endStick({pointerId:stickPointer});if(lookPointerType==='mouse')endLook({pointerId:lookPointer});},{signal,capture:true});
  for(const type of ['touchend','touchcancel'])window.addEventListener(type,e=>{if(stickPointerType==='touch'&&!hasControlTouch(e.touches,stick))endStick({pointerId:stickPointer});if(lookPointerType==='touch'&&!hasControlTouch(e.touches,look))endLook({pointerId:lookPointer});},{signal,capture:true,passive:true});
 }
 root.addEventListener('click',e=>{
  if(e.isTrusted)unlockSound();
  const button=e.target.closest('[data-act]');
  if(button){e.preventDefault();runAction(button.dataset.act,button);}
  else if(e.target===canvas&&mouseLocked()&&canLook()&&e.button===0)runAction('interact');
 },{signal});
 function unlockSound(){
  if(isPaused()||sound.settings.muted||sound.context?.state==='running')return;
  void sound.start().then(ok=>{if(ok&&active&&isPaused()&&!cinematic)sound.pause();});
 }
 function endAudioPreview(){
  if(!audioPreview)return;
  audioPreview=false;sound.stopEmote();sound.pause();
 }
 function suspendPianoClock(){if(piano)piano.last=null;}
 function resumeHouseAudio(){if(piano&&pianoRunning())sound.resumePiano();else if(!isSuspended())sound.resume();}
 $('lab-camera-settings')?.addEventListener('toggle',()=>{
  resetInput();endAudioPreview();suspendPianoClock();
  if($('lab-camera-settings').open)sound.pause();else resumeHouseAudio();
 },{signal});
 root.querySelector('.house-mixer')?.addEventListener('toggle',e=>{if(!e.target.open)endAudioPreview();},{signal});
 function syncMotion(){
  root.classList.toggle('house-motion-reduced',reducedMotion.matches);
  if(s)s.reduceBob=reducedMotion.matches||!options.bob;
  if(cinematic&&reducedMotion.matches)finishWindowIntro();
 }
 motionMedia.addEventListener('change',syncMotion,{signal});
 syncMotion();
 root.addEventListener('input',e=>{
  const field=e.target,key=field.dataset.setting;if(!key)return;
  if(key==='quality'){options.quality=field.value;renderer.quality=field.value;root.querySelectorAll('[data-setting="quality"]').forEach(el=>{if(el!==field)el.value=field.value;});}
  if(key==='sensitivity'){options.sensitivity=Number(field.value);root.querySelectorAll('[data-setting="sensitivity"]').forEach(el=>{if(el!==field)el.value=field.value;});saveCamera();}
  if(key==='invertX'){options.invertX=field.checked;saveCamera();}
  if(key==='bob'||key==='motion'||key==='captions'){
   options[key]=field.checked;saveCamera();syncMotion();
   if(key==='captions'&&!field.checked)hudMessages.clearSound();
  }
  if(MIX_CHANNELS.some(([channel])=>channel===key)){
   sound.set(key,Number(field.value));
   root.querySelector(`[data-level="${key}"]`).textContent=Math.round(sound.settings[key]*100)+'%';
  }
  if(key==='mute')sound.set('muted',field.checked);
  root.querySelectorAll('[data-setting="'+key+'"]').forEach(el=>{if(el!==field){if(field.type==='checkbox')el.checked=field.checked;else el.value=field.value;}});
 },{signal});
 window.addEventListener('keydown',e=>{
  if(!active||e.altKey||e.ctrlKey||e.metaKey||e.isComposing)return;
  if(e.isTrusted&&!e.repeat)unlockSound();
  const focused=e.target?.tagName;
  if(e.key==='Escape'&&mouseLocked()){e.preventDefault();releaseMouse();return;}
  if(e.key==='Escape'&&rc?.mode==='driving'&&!isPaused()){e.preventDefault();runAction('rc:stop');return;}
  if(phone.editing){if(e.key==='Escape'){e.preventDefault();void phone.layoutAction('done');}else if(e.key==='Tab'){const panel=phone.host.querySelector(phone.preview?'.hud-preview-tools':'.hud-editor'),items=[...panel.querySelectorAll('button,input,select')];if(!panel.contains(document.activeElement)||(!e.shiftKey&&document.activeElement===items.at(-1))||(e.shiftKey&&document.activeElement===items[0])){e.preventDefault();(e.shiftKey?items.at(-1):items[0]).focus();}}return;}
  if(['INPUT','SELECT','TEXTAREA'].includes(focused)&&e.key!=='Escape')return;
  if(e.key===' '&&['BUTTON','SUMMARY','A'].includes(focused))return;
  if(piano&&e.key!=='Tab'){
   const note=PIANO_KEYS.indexOf(e.key.toLowerCase());
   if(note!==-1){e.preventDefault();if(!e.repeat)playPiano(note);return;}
   if(e.key==='Escape'){e.preventDefault();modalClose();return;}
  }
  if(modal==='Caja fuerte'&&e.key!=='Tab'){if(/^\d$/.test(e.key)){e.preventDefault();safeAction(e.key);}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();safeAction(e.key==='Delete'?'clear':'back');}else if(e.key==='Enter'){e.preventDefault();safeAction('submit');}else if(e.key==='Escape'){e.preventDefault();modalClose();}return;}
  if((events.phase==='safe'||events.phase==='failed')&&!['Tab','Enter',' '].includes(e.key)){e.preventDefault();return;}
  if(['1','2','3','4','5','6'].includes(e.key)&&!isPaused()&&events.phase!=='arrival'){if(!e.repeat&&rc.mode!=='driving'&&rc.mode!=='deploying')equip([s.inventory.redKey?'red-key':'empty','flashlight','phone','key','paper','rc'][Number(e.key)-1],true);return;}
  if(rc?.mode==='driving'&&!e.repeat&&['q','x','t'].includes(e.key.toLowerCase())){
   e.preventDefault();runAction({q:'rc:noise',x:'rc:stop',t:'rc:trap'}[e.key.toLowerCase()]);return;
  }
  if(e.key.toLowerCase()==='r'&&!e.repeat&&canLook()){if(mouseLocked())releaseMouse();else lockMouse();return;}
  if(phone.open){if(e.key==='Escape'){e.preventDefault();phone.close();resetInput();}else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.preventDefault();phone.key(e.key);}else if(e.key==='Tab'){const b=[...root.querySelectorAll('.phone-screen button')],first=b[0],last=b.at(-1);if((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last)){e.preventDefault();(e.shiftKey?last:first).focus();}}return;}
  if((e.key==='p'||e.key==='P')&&equipment==='phone'){runAction('phone');return;}
  if(!e.repeat&&EMOTES.some(em=>em.key===e.key)){runAction('emote:'+EMOTES.find(em=>em.key===e.key).id);return;}
  if(!e.repeat&&(e.key==='m'||e.key==='M')){e.preventDefault();runAction('emotes');return;}
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
  if(e.key==='Tab'&&modal){
   const buttons=[...dialog.querySelectorAll('button,iframe,a[href]:not([hidden])')],first=buttons[0],lastButton=buttons.at(-1);
   if((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===lastButton)){e.preventDefault();(e.shiftKey?lastButton:first)?.focus();}return;
  }
  const key=movementKey(e);if(!isPaused()&&key&&(!e.repeat||keys.has(key)))keys.add(key);
  if(e.repeat)return;
  if(e.key==='Escape'){
   if(!$('house-emotes').hidden){$('house-emotes').hidden=true;root.querySelector('[data-act=emotes]').setAttribute('aria-expanded','false');resetInput();return;}
   if($('lab-camera-settings').open){$('lab-camera-settings').open=false;resetInput();return;}
   if(modal){if(intro||contextLost)return;paused=false;modalClose();}else togglePause();return;
  }
  if(e.key==='e'||e.key==='E')runAction('interact');
  if(e.key==='f'||e.key==='F')runAction('flash');
  if(e.key==='c'||e.key==='C')runAction('crouch');
  if(e.key==='i'||e.key==='I')runAction('bag');
 },{signal});
 window.addEventListener('keyup',e=>{const key=movementKey(e);if(key)keys.delete(key);},{signal,capture:true});
 window.addEventListener('blur',()=>{hasFocus=false;releaseMouse();resetInput();suspendPianoClock();sound.pause();},{signal});
 window.addEventListener('focus',()=>{hasFocus=true;resetInput();last=performance.now();resumeHouseAudio();},{signal});
 window.addEventListener('pagehide',()=>{hasFocus=false;releaseMouse();resetInput();suspendPianoClock();sound.pause();},{signal});
 window.addEventListener('pageshow',()=>{hasFocus=document.hasFocus();resetInput();last=performance.now();resumeHouseAudio();},{signal});
 document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden){resetInput();suspendPianoClock();sound.pause();}else resumeHouseAudio();},{signal});
 window.addEventListener('resize',()=>{last=performance.now();resetInput();if(isPortrait()){suspendPianoClock();sound.pause();}else resumeHouseAudio();},{signal});
 canvas.addEventListener('webglcontextlost',e=>{
  e.preventDefault();
  interruptGraphics('Gráficos interrumpidos','Si el navegador recupera los gráficos, podrás seguir desde aquí.');
 },{signal});
 canvas.addEventListener('webglcontextrestored',()=>{
  if(!active||!contextLost)return;
  try{
   renderer=new HouseRenderer(canvas,options.quality);
   rebuild();contextLost=false;paused=false;modalClose();
   if(!ready)startHouse();
   last=statsAt=performance.now();lastPaint=0;frameCount=0;
   raf=requestAnimationFrame(frame);
   if(ready)say('Gráficos recuperados');
  }catch(e){interruptGraphics('Error de renderizado',String(e.message||e));}
 },{signal});
 function startHouse(){
  if(scenario)showTrialStart();
  else if(demo&&!config.trial&&checkpoint==='ground')runAction('start');
  else showModal(demo?'Rescata a Louis':'Explora la casa',`<p>Modo ${escapeHTML(points[checkpoint]||'Planta baja')}. Camina con el joystick izquierdo, mira arrastrando a la derecha y pulsa USAR sobre objetos cercanos.</p><p>${demo?'Busca la llave en el cajón del estudio. La nota del pasillo contiene una pista. La linterna está en el cajón del descansillo.':'Hay dos plantas, recuerdos, una linterna y secretos pequeños.'}</p><p>Enciende las luces para ahorrar carga. Puedes cambiar la pila desde la mochila.</p>`,[['Entrar / activar sonido','start'],['Volver a pruebas','exit']]);
 }
 if(renderer){
  for(const [key] of MIX_CHANNELS){
   root.querySelectorAll('[data-setting="'+key+'"]').forEach(el=>el.value=sound.settings[key]);
   root.querySelector(`[data-level="${key}"]`).textContent=Math.round(sound.settings[key]*100)+'%';
  }
  root.querySelectorAll('[data-setting="mute"]').forEach(el=>el.checked=sound.settings.muted);
  root.querySelectorAll('[data-setting="bob"]').forEach(el=>el.checked=options.bob);
  root.querySelectorAll('[data-setting="sensitivity"]').forEach(el=>el.value=options.sensitivity);
  root.querySelector('[data-setting="invertX"]').checked=options.invertX;
  root.querySelector('[data-setting="motion"]').checked=options.motion===true;
  root.querySelector('[data-setting="captions"]').checked=options.captions!==false;
  root.querySelectorAll('[data-setting="quality"]').forEach(el=>el.value=options.quality);
  startHouse();
  raf=requestAnimationFrame(frame);
 }
 // Browser-only diagnostic hook: exercise real contextual picking and puzzle rules from
 // non-blocked player poses without altering the production build or saved game.
 if(import.meta.env.DEV&&demo){
  window.__rescueHouse={
   arrival:()=>({car:world.car.progress,wardrobe:poseTransition?.walk?wardrobeWalk(poseTransition.elapsed,poseTransition.walk):null,rising:wakeShot()}),
   mirrorPuzzle:()=>({...mirrorSafe.snapshot(),noteLift,safe:(()=>{const o=world.objects.find(o=>o.id==='mirror-safe');return {amount:o.amount,state:o.state};})()}),
   pianoPuzzle:()=>({picked:world.pianoSheet.taken,placed:world.piano.scorePlaced,solved:world.piano.solved,
    compartment:world.piano.compartmentAmount}),
   amenities:()=>({power:housePowered(world.lights.power),blackout:{...world.lights.power.blackout},lights:world.lights.circuits.filter(circuitPowered).map(c=>c.id),
    battery:{charge:s.battery,spares:s.inventory.batteries,swap:batterySwap},
    television:{on:television.powered,time:television.video.currentTime,duration:television.video.duration,frame:renderer.tvFrame},
    clock:{second:world.clock.second,hands:world.clock.hands.map(({hand})=>hand.roll)},
    rug:world.hatchRug.amount,hatch:world.hatch.amount,stamina:s.stamina,sprinting:s.sprinting,notePresentation}),
   story:()=>({pursuer:pursuer.snapshot(),samples:{loaded:sound.recordings?.buffers.size||0,played:sound.recordings?.played||0,last:sound.recordings?.lastPlayed,errors:sound.recordings?.errors||[]},phase:events.phase,time:events.time,remaining:events.remaining,messages:events.messages.map(m=>({...m})),equipment,phoneOpen:phone.open,hud:{...phone.layout,rect:phone.rect,editing:phone.editing},floorSounds:{steps:floorSounds.steps,triggers:floorSounds.triggers},audio:{lastEffect:sound.lastEffect,effects:sound.effectCount||0,voices:sound.foleyVoices?.size||0}}),
   rc:()=>({mode:rc.mode,elapsed:rc.elapsed,position:{x:rc.x,y:rc.y,z:rc.z,yaw:rc.yaw},noise:rc.noise,crashes:rc.crashes,inventory:!!s.inventory.rc,trap:{...rcTrap},pursuer:{x:pursuer.x,y:pursuer.y,z:pursuer.z,mode:pursuer.mode}}),
   louis:()=>louis?{x:louis.x,y:louis.y,z:louis.z,phase:louis.phase,waypoint:louis.waypoint,age:louis.age,walk:louis.walk,speed:louis.speed,crouch:louis.crouch,reaction:louis.visualReaction?.type??null,cameraPhase:loisShotDirector?.phase??null}:null,
   greyCat:()=>({active:world.greyCat.active,x:world.greyCat.x,z:world.greyCat.z,called:world.greyCat.called}),
   // DEV-only route harness for deterministic test setup; not in the production build.
   placeRC:(pose)=>{if(rc.mode!=='driving')throw Error('RC must be deployed first');const y=groundHeight(pose.x,pose.z,pose.y??rc.y,world.hatch?.amount>.92);if(!Number.isFinite(y)||blocked(world.boxes,pose.x,y,pose.z,.155,.38))throw Error('Blocked RC test position');rc.x=pose.x;rc.y=y;rc.z=pose.z;rc.yaw=pose.yaw??rc.yaw;rc.noise=0;syncRCObject(rc);return {x:rc.x,y:rc.y,z:rc.z};},
   intro:()=>cinematic?{elapsed:cinematic.elapsed,...windowIntroState(cinematic.elapsed/WINDOW_SHOT_SECONDS),camera:windowIntroCamera(cinematic.elapsed/WINDOW_SHOT_SECONDS)}:null,
   atmosphere:()=>({room:sound.atmosphere?.room,outdoor:sound.atmosphere?.outdoor,events:sound.atmosphere?.events,voices:sound.atmosphere?.voices.size,loops:sound.atmosphere?.loops.length,lastEvent:sound.atmosphere?.lastEvent,muted:sound.settings.muted,volume:sound.settings.ambient}),
   snapshot:()=>({puzzle:{...puzzle},position:{x:s?.x,y:s?.y,z:s?.z},camera:{yaw:s?.yaw,pitch:s?.pitch,targetYaw:lookTarget.yaw,invertX:options.invertX},cinematic:!!cinematic,quality:options.quality,fps,target:focus?.id??null,paused:isPaused(),controls:{look:lookPointer,stick:stickPointer,joystick:{...joystick}},reduceBob:s.reduceBob,flashlight:s.flashlight,notes:s.inventory.notes.length,drawer:(()=>{const o=world.objects.find(o=>o.id==='drawer');return {state:o.state,amount:o.amount,z:o.box.z,key:world.objects.find(o=>o.id==='key').z,contentsAvailable:world.objects.find(o=>o.id==='key').interactable,contentsConcealed:world.objects.find(o=>o.id==='key').concealed}})(),doors:world.objects.filter(o=>o.kind==='door').map(o=>({id:o.id,open:o.open,state:o.state,amount:o.amount,x:o.box.x,z:o.box.z,yaw:o.box.yaw,solid:o.box.solid})),handVisible:renderer.lastShowHand,hidden:!!s.hidden,hideType:s.hidden?.hideType,poseTransition:poseTransition?{entering:poseTransition.entering,elapsed:poseTransition.elapsed}:null,view:cameraOf(s),wardrobeAmount:world.objects.find(o=>o.id==='wardrobe').amount,music:{scheduled:sound.musicStep,voices:sound.musicNodes.size,timer:sound.musicTimer!==null,volume:sound.settings.music},sound:sound.context?.state,mirror:{supported:renderer.mirrorSupported,drawn:renderer.mirrorDrawn,vertices:renderer.kittyVertices?.length/16,uploads:renderer.mirrorUploads},animation:{...animator.snapshot(),rigEvaluations:renderer.characterBinding?.evaluations},geometry:{vertices:renderer.vertexCount,triangles:renderer.triangleCount}}),
   setPose:(pose)=>{if(blocked(world.boxes,pose.x,pose.y,pose.z,.2,1.7))throw Error('Blocked test pose');Object.assign(s,pose);resetInput();focus=null;},
   interactWith:async(id,activate=true)=>{
    const o=world.objects.find(o=>o.id===id&&!o.taken);if(!o)throw Error('Not available: '+id);
    const crouched=activate?!!o.requiresCrouch:s.crouched;
    modalClose();paused=false;ready=true;focus=null;s.hidden=null;s.lying=false;s.crouched=crouched;s.eye=crouched?1.03:1.63;s.pitch=0;
    const y=o.floor??(o.y>HEIGHT?HEIGHT:0);
    let found=false;
    for(const radius of [.65,.8,1.0,1.25,1.5,1.85,2.15]){
     if(found)break;
     for(let i=0;i<32;i++){
      const a=i*Math.PI*2/32,x=o.x+Math.cos(a)*radius,z=o.z+Math.sin(a)*radius;
      if(o.kind==='hatch'&&inHatch(x,z,.14))continue;
     if(blocked(world.boxes,x,y,z,.2,s.crouched?1.05:1.7))continue;
      s.x=x;s.y=y;s.z=z;s.yaw=Math.atan2(o.x-x,o.z-z);
      s.pitch=Math.atan2(o.y-(y+s.eye),Math.hypot(o.x-x,o.z-z));
      if(closestObject(world,s,null)?.id===o.id){
       if(['door','drawer','safe','cupboard'].includes(o.kind)&&!sweepClear(o,o.amount||0,o.open?0:1,s))continue;
       found=true;break;
      }
     }
    }
    if(!found)throw Error('No line-of-sight reachable pose for '+id);if(!activate){resetInput();return {position:{x:s.x,y:s.y,z:s.z}};}
    lastInteraction=-Infinity;resetInput();interact();if(o.motion)await new Promise(resolve=>{const check=()=>{if(!active||!o.motion)resolve();else requestAnimationFrame(check);};check();});return {puzzle:{...puzzle},position:{x:s.x,y:s.y,z:s.z}};
   }
  };
 }
 function stop(){if(!active)return;active=false;releaseMouse();cancelAnimationFrame(raf);controller.abort();television.destroy();phone.destroy();sound.destroy();renderer?.destroy();if(window.__rescueHouse)delete window.__rescueHouse;root.remove();}
 return stop;
}
