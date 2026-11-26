import {trialCheckpoint,trialStartPose,trialEmyStage} from './trial-checkpoint.js';
import {removeVentCover,advanceVentCover,poseVentCover} from './study-vent.js';
import {HouseEvents} from './story-events.js';
import {HouseMessages} from './hud-messages.js';
import {captureHouseCheckpoint,restoreHouseCheckpoint} from './house-checkpoint.js';
import {PhoneUI} from './phone-ui.js';
import {FloorSounds} from './floor-sounds.js';
import {EMOTES} from './animations/emotes.js';
import {Pursuer} from './pursuer.js';
import {STARTING_LIVES,LIFE_NOTICE_SECONDS,captureLoss,lifeSlots} from './capture-lives.js';
import {captureFrame,capturePath,captureTiming} from './capture-shot.js';
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
import {navigate,getStairDirection} from './navigation.js';
import {KITTY_SPEED,advanceMoveIntent,advanceMoveSpeed,advanceCameraFloor,advanceEye,isOnStairs} from './locomotion-feel.js';
import {interactionTarget} from './interactions.js';
import {circuitPowered,housePowered,toggleCircuit,toggleHousePower,updatePowerLever} from './house-lights.js';
import {inHatch,poseHatch,poseHatchRug} from './basement.js';
import {posePianoCompartment,posePianoReward,setPianoScore,poseTrunk} from './house-additions.js';
import {PIANO_KEYS,pianoKeyboard} from './piano-recital.js';
import {PianoSession} from './piano-session.js';
import {HouseTelevision} from './television.js';
import {updateWallClock} from './wall-clock.js';
import {animateFurniture,updateFurniture,sweepClear} from './furniture-motion.js';
import {BATTERY_SWAP_SECONDS} from './viewmodel.js';
import {rescueProgress} from './rescue-progress.js';
import {poseEscapeAmbush,poseEmyLastChance,createRescueObjectives,updateEmySenses} from './emy-rescue.js';
import {collectCinematicCues} from './cinematic-cues.js';
import {rcControlHint,throwableHint,threatAccessibility,hopOffset,HOP_COOLDOWN,advanceHop} from './hud-context.js';
import {updateUpstairsEmy,petEmy} from './emy-cat.js';
import {createEmyAbilities,advanceEmyAbilities,activateEmyScan,createEmyNameCue,advanceEmyNameCue,roomChoices,roomDestinations,isEmyRoomLocked,emyFloorList} from './emy-abilities.js';
import {defaultMiniatureView,changeMiniatureView,miniatureSVG,miniatureMarkers} from './emy-miniature.js';
import {installNoiseProps,grabNoiseProp,holdNoiseProp,releaseNoiseProp,stepNoiseProps} from './noise-props.js';
import {previewEmyDistract,sendEmyDistract,commandEmyStay,rejoinEmyInPerson,requestRibbonKey,EMY_ENTRANCE_SECONDS,createEmyCompanion,beginEmyEntrance,emyEntranceCamera,sendEmyToTrunk,emyOccupiesHatch,updateEmyCompanion,snapshotEmyCompanion,restoreEmyCompanion,initializeTrialEmy} from './emy-companion.js';
import {createRC,syncRCObject,deployRC,driveRC,beepRC,updateRC,stopRC,crashRC,recoverRC,rcCamera,advanceRCCamera,rcDeploymentView,canTrapPursuer} from './rc-car.js';
import {createLouisEscape,updateLouisEscape,freeLouis,louisCamera} from './louis-escape.js';
import {createLoisShotDirector,advanceLoisShot,finishLoisShot} from './lois-ps2-cinematics.js';
import {createHousePuzzle,puzzleEvent,canOpenBedroom,canRescue,PUZZLE_HINTS,housePuzzleHint} from '../demo/house-puzzles.js';
import './lab.css'; // Required for #lab3d stacking, fixed fullscreen layout, canvas sizing and HUD.
import './house.css';
import './emy-skills.css';
import './capture-shot.css';
const FLASH_DRAIN=.24,FLASH_LOW=15,SPARE_CHARGE=55;
const SPRINT_SECONDS=4;
const CHECKPOINT_INTERACTIONS=new Set(['battery','drawer','door','flashlight','hatch','key','note','rc-car','rug','power-switch']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canStand=(state,world)=>!blocked(world.boxes,state.x,state.y,state.z,.2,1.69);
function cameraOf(s){
 if(s.poseCamera)return s.poseCamera;
 if(s.hidden){const o=s.hidden;return {x:o.x,y:o.y,z:o.z,yaw:s.yaw,pitch:s.pitch};}
 const eye=s.lying?1.02:s.eye;
 return {x:s.x,y:(s.cameraGround??s.y)+eye+(!s.crouched&&!s.lying&&!s.reduceBob?Math.sin(s.bob)*.024*(s.walkWeight||0):0),z:s.z,yaw:s.yaw,pitch:s.pitch};
}
function closestObject(world,state,previous=null){
 if(state.hidden||state.lying||state.poseCamera)return null;
 return interactionTarget(world,cameraOf(state),previous);
}
const ctxRoom=state=>getStairDirection(state)==='Escaleras'?'Escaleras':roomAt(state.x,state.z,state.y);
export function launchHouse(onExit,checkpoint='ground',config={}){
 const demo=config.demo===true;
 const exitLabel=config.trial?'Volver a pruebas':'Salir de la casa';
 const scenario=config.trial?config.scenario:null;
 const checkpointStore=demo&&!config.trial&&checkpoint==='ground'?config.checkpointStore:null;
 const animator=new CharacterAnimator();
 const root=document.createElement('div');root.id='lab3d';root.innerHTML=`
 <canvas id="lab-canvas" tabindex="-1" aria-label="Escenario tridimensional interactivo de la casa"></canvas>
 <div id="house-interest" class="house-interest" aria-hidden="true" hidden><i>✧</i><span>OBJETIVO</span></div>\n <div class="house-screw-glows" aria-hidden="true"><i class="house-vent-screw-glow" data-screw="0" hidden>✧</i><i class="house-vent-screw-glow" data-screw="1" hidden>✧</i><i class="house-vent-screw-glow" data-screw="2" hidden>✧</i><i class="house-vent-screw-glow" data-screw="3" hidden>✧</i></div>
 <div id="torch-outline" class="torch-silhouette" hidden><svg viewBox="0 0 40 20" aria-hidden="true"><path d="M3 6h10l7-4h6v16h-6l-7-4H3z" fill="none" stroke="#c4f3ff" stroke-width="2" transform="rotate(-20 16 10)"/></svg></div>
 <div class="lab-vignette" aria-hidden="true"></div>
 <div id="lab-capture" hidden>
  <div class="capture-dark"></div>
  <div id="capture-loss" hidden><h2>Te atraparon</h2><p></p></div>
  <div id="capture-caption" class="capture-caption" role="status"></div>
 </div>
 <div id="house-lives" hidden role="status"><div class="life-slots" aria-hidden="true"></div><strong></strong></div>
 <div class="lab-window-intro lab-hidden" id="lab-window-intro" aria-label="Entrada cinematográfica por la ventana">
   <div class="lab-intro-top"></div>
   <div class="lab-intro-caption" id="lab-intro-caption">Una ventana entreabierta…</div>
   <button data-act="pause" aria-label="Pausar entrada">Ⅱ Pausa</button>
   <button data-act="skip-intro" aria-label="Saltar la animación de entrada">Saltar intro ↗</button>
   <div class="lab-intro-bottom"></div>
 </div>
 <div class="lab-cross" aria-hidden="true">+</div>
 <div class="house-emy-wave" id="house-emy-wave" hidden aria-hidden="true"></div>
 <div id="house-emy-name" class="house-emy-name" aria-hidden="true" hidden>Emy ♡</div>
 <div class="house-emy-menu" id="house-emy-menu" hidden role="dialog" aria-modal="true" aria-label="Acciones de Emy">
  <header><strong>Emy ♡</strong><span>Tu pequeña compañera</span><button data-act="emy:close" class="emy-close" aria-label="Cerrar acciones de Emy">✕</button></header>
  <button class="emy-card pet" data-act="emy:pet"><i aria-hidden="true">♡</i><b>Acariciar</b><span>Dale un poquito de cariño ♡</span></button>
  <button class="emy-card stay" id="house-emy-stay" data-act="emy:stay" aria-pressed="false"><i id="house-emy-stay-icon" aria-hidden="true">Ⅱ</i><b id="house-emy-stay-title">Quédate aquí</b><span id="house-emy-stay-copy">Emy esperará en este lugar</span></button>
  <button class="emy-card scan" data-act="emy:scan"><i aria-hidden="true">◎</i><b>Escaneo</b><span>Detecta amenazas cercanas</span><small id="house-emy-scan-cd" hidden></small></button>
  <button class="emy-card distract" data-act="emy:map"><i aria-hidden="true">♫</i><b>Distracción</b><span>Envía a Emy a hacer ruido</span><small id="house-emy-distract-cd" hidden></small></button>
 </div>
 <div class="house-emy-map" id="house-emy-map" hidden role="dialog" aria-modal="true" aria-label="Mapa de distracción de Emy">
  <header class="house-emy-map-header">
   <div><span class="house-emy-map-kicker">EMY · PLAN DE DISTRACCIÓN</span><strong>Elige dónde hacer ruido</strong></div>
   <div class="emy-map-nav"><button data-act="emy:map:back" aria-label="Volver a acciones de Emy">←</button><button data-act="emy:close" aria-label="Cerrar plano de la casa">✕</button></div>
  </header>
  <div class="house-emy-floor-switch" role="tablist" aria-label="Seleccionar vista de la casa">
   <button id="house-emy-tab--1" role="tab" aria-controls="house-emy-map-rooms" aria-selected="true" data-act="emy:floor:-1">Exterior</button>
   <button id="house-emy-tab-0" role="tab" aria-controls="house-emy-map-rooms" aria-selected="false" data-act="emy:floor:0">01 · PLANTA BAJA <small>6 lugares</small></button>
   <button id="house-emy-tab-1" role="tab" aria-controls="house-emy-map-rooms" aria-selected="false" data-act="emy:floor:1">02 · PLANTA ALTA <small>4 lugares</small></button>
  </div>
  <p class="house-emy-intro">Arrastra para girar e inclinar · Pellizca o usa +/− · Elige un piso y una habitación</p>
  <div class="house-emy-map-rooms" id="house-emy-map-rooms" role="tabpanel" aria-labelledby="house-emy-tab-0"></div>
  <footer class="house-emy-map-footer">
   <p id="house-emy-map-status" role="status" aria-live="polite">Selecciona una habitación para enviar a Emy.</p>
   <button id="house-emy-map-send" data-act="emy:send" disabled>Enviar a Emy <span aria-hidden="true">➜</span></button>
  </footer>
 </div>
 <div id="house-mouse-status" class="house-mouse-status" hidden>Esc o R · Liberar ratón</div>
 <div class="lab-top">
   <details class="lab-camera-settings" id="lab-camera-settings"><summary aria-label="Ajustes de la casa">⚙</summary><div class="lab-camera-panel">
     <div class="house-menu-actions">
       <button data-act="pause">Pausa</button>
       <button id="house-lock-mouse" data-act="mouse" hidden>Capturar ratón</button>
       <button data-act="exit" class="lab-exit">← ${config.trial?'Pruebas':'Volver'}</button>
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
     <button data-act="bag">Inventario · pilas y notas</button>
      <button data-act="hud">Editar controles / hotbar</button>
     ${!config.trial?'':'<details><summary>Diagnóstico</summary><div id="lab-metrics"></div></details>'}
     <details class="lab-settings-note"><summary>Controles</summary><p>WASD para caminar, Mayús para correr y C para agacharte y Espacio para saltar. Arrastra para mirar o pulsa R para capturar el ratón. E interactúa, F usa el objeto equipado, I abre el inventario (también disponible en Ajustes) y Esc libera el ratón o pausa.</p><p>En pantalla táctil, mueve el joystick izquierdo y arrastra a la derecha para mirar. Puedes hacer ambos gestos a la vez.</p></details>
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
  <button data-act="interact" id="lab-interact" aria-keyshortcuts="E" hidden disabled><kbd aria-hidden="true">E</kbd><small>Interactuar</small></button>
  <button data-act="emotes" aria-label="Elegir emote" aria-controls="house-emotes" aria-expanded="false" hidden>☺<small>Emotes</small></button>
  
  <button data-act="flash" id="house-light">☼<small>Luz</small></button>
  <button data-act="phone" class="phone-expand" id="house-use-phone" aria-label="Usar teléfono" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/></svg><small>Usar</small></button>
  <button data-act="hop" id="lab-hop" aria-label="Saltar" aria-keyshortcuts="Space" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-5 5 5-5 5 5M5 21h14"/></svg><small>Saltar</small></button>
  <button data-act="crouch" id="lab-crouch" aria-label="Agacharse" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4" r="2"/><path d="m13 8-3 4 5 2-2 3h5m-8-5-4 5M7 21h10m-7-12-3 2"/></svg><small>Agachar</small></button>
 </div>
 <div class="house-emotes" id="house-emotes" hidden role="group" aria-label="Emotes"><span>En el espejo · moverte cancela</span>${EMOTES.map(e=>`<button data-act="emote:${e.id}">${e.key} · ${e.label}</button>`).join('')}<button data-act="emote:stop">Detener</button></div>
 <div class="house-rc-hud" id="house-rc-hud" hidden role="group" aria-label="Tablet de control RC">
  <div class="house-rc-display"><strong>Kitty RC</strong><span class="house-rc-keys">W/S acelerar · A/D girar</span><output id="house-rc-status" aria-live="off">Señal conectada</output><small id="house-rc-hint" class="house-control-hint"></small></div>
  <div class="house-rc-actions"><button data-act="rc:noise" aria-keyshortcuts="Q" aria-label="Tocar bocina del auto RC para atraer al secuestrador">📣 Bocina <kbd>Q</kbd></button><button data-act="rc:trap" id="rc-trap-button" aria-keyshortcuts="T" hidden>Cerrar escotilla <kbd>T</kbd></button><button data-act="rc:stop" aria-keyshortcuts="X Escape">Guardar <kbd>Esc</kbd></button></div>
 </div>
 <div class="house-rc-caption" id="house-rc-caption" hidden role="status"></div>
 <div id="lab-turn" class="lab-turn"><div><span>↻</span><h2>Gira tu teléfono</h2><p>La casa se explora en horizontal. Tu lugar se conserva y el mundo queda en pausa.</p><button data-act="exit">${exitLabel}</button></div></div>
 <div id="lab-dialog" class="lab-dialog lab-hidden"></div>`;
 document.body.appendChild(root);
 const events=new HouseEvents({pursuit:config.entry!=='rescue',twoActs:true,arrivalLead:CAR_ARRIVAL_SECONDS}),floorSounds=new FloorSounds();let pursuer=null,equipment='flashlight',equipmentAge=1,encounterCheckpoint=null,thirdView=null;
 const mirrorSafe=new MirrorSafePuzzle(),television=new HouseTelevision();
 let previousToolTarget=null,autoUseTarget=null,keyTurn=null;
 let safeInput='',activeSafe=null,noteLift=0,noteHold=0,notePresentation=false,capturePhoto=false,piano=null;
 const objectives=createRescueObjectives();
 let rc=null,louis=null,loisShotDirector=null,rcTrap={armed:false,closed:false},finalCutscene=null;
 let emyAbilities=createEmyAbilities(),emyNameCue=createEmyNameCue(),emyMenuOpen=false,emyMapFloor=-1,emyMapSelected='',miniatureView=defaultMiniatureView(),noiseProps=[],heldNoise=null;
 let resumed=false,lastSafeCheckpoint=null,captureShot=null,captureCount=0,lifeNoticeLeft=0;
 let equipmentBeforeNote='empty',batterySwap=null;
 const canUseHotbar=()=>ready&&!heldNoise&&!isSuspended()&&!cinematic&&!emyShot&&events.phase!=='arrival'&&events.phase!=='failed'&&events.phase!=='safe'&&rc?.mode!=='driving'&&rc?.mode!=='deploying';
 const phone=new PhoneUI(root,(kind,toggle=true)=>equip(kind,toggle),()=>resetInput(),{canEquip:canUseHotbar,canUse:()=>canUseHotbar()&&!notePresentation,onEdit:()=>{releaseMouse();resetInput();if(isSuspended())sound.pause();else sound.resume();},onPhoto:()=>{capturePhoto=true;},onMap:()=>openHouseMap(true)});phone.equip(equipment);
 const danger=document.createElement('div');danger.className='house-danger';danger.hidden=true;danger.setAttribute('role','status');root.querySelector('#house-messages').append(danger);
 const enableSound=document.createElement('button');enableSound.className='house-enable-sound';enableSound.textContent='Activar sonido';enableSound.hidden=true;root.querySelector('.house-mixer').before(enableSound);
 enableSound.addEventListener('click',async()=>{
  sound.set('muted',false);root.querySelectorAll('[data-setting="mute"]').forEach(el=>el.checked=false);
  if(await sound.start()&&active&&isSuspended()&&!captureRunning())sound.pause();
 });
 const $=id=>root.querySelector('#'+id),canvas=$('lab-canvas'),dialog=$('lab-dialog'),captureLayer=$('lab-capture'),captureCaption=$('capture-caption');
 const hudMessages=new HouseMessages(root);
 phone.onPresentationChange=()=>hudMessages.layout(phone.rect,phone.open);
 const controller=new AbortController(),signal=controller.signal;
 let rcViewSmoothed=null,hopAge=HOP_COOLDOWN,hopCancelled=false;
 let renderer,world,emyCompanion=null,emyShot=null,bathCircuit,puzzle=createHousePuzzle(config.entry),sound=new HouseSound(),s,raf=0,last=0,lastPaint=0,fps=0,elapsed=0,lookPointer=null,stickPointer=null;
 let active=true,ready=false,hasFocus=true,focus=null,lookLast={x:0,y:0},paused=false,modal='',intro=true,contextLost=false,stickPointerType=null,lookPointerType=null;
 let lookTarget={yaw:Math.PI,pitch:0},cinematic=null,poseTransition=null,handAction=0,clickAction=0,lastInteraction=-Infinity,audioPreview=false;
 const handDrift={x:0,y:0,vx:0,vy:0};
 const motionMedia=window.matchMedia('(prefers-reduced-motion: reduce)');
 const keys=new Set(),joystick={x:0,z:0,sprint:false},velocity={forward:0,side:0,speed:KITTY_SPEED.walk};
 const cameraSettings=(()=>{try{return readCameraSettings(window.localStorage)}catch{return {...DEFAULT_CAMERA_SETTINGS}}})();
 const options={...cameraSettings,bob:cameraSettings.bob??!motionMedia.matches,quality:'medium'};
 const reducedMotion={get matches(){return motionMedia.matches||options.motion===true;}};
 const saveCamera=()=>{try{writeCameraSettings(window.localStorage,options)}catch{}};
 const points={ground:'Planta baja',upstairs:'Planta alta',sound:'Iluminación / sonido',interactions:'Interacciones',mirror:'Espejo del baño'};
 const say=(text,seconds=2.4)=>hudMessages.say(text,seconds);
 const caption=text=>{if(options.captions!==false)hudMessages.describeSound(text);};
 const isPortrait=()=>window.innerHeight>window.innerWidth;
 const captureRunning=()=>captureShot&&hasFocus&&!document.hidden&&!isPortrait()&&!contextLost;
 const isSuspended=()=>!ready||paused||emyMenuOpen||!!modal||!!captureShot||phone.editing||$('lab-camera-settings').open||isPortrait()||document.hidden||!hasFocus||contextLost;
 const wakeShot=()=>events.phase==='lockdown'&&pursuer?.mode==='rising';
 const isPaused=()=>isSuspended()||!!cinematic||!!emyShot||!!poseTransition||events.phase==='car-preview'||wakeShot();
 const flashlightBeam=()=>!heldNoise&&s.flashlight&&batterySwap===null&&equipment==='flashlight'&&!s.hidden&&!s.lying&&!animator.performing&&!phone.open&&events.phase!=='arrival';
 const torchMarker=$('torch-outline');
 const desktop=window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
 const remoteInUse=()=>['driving','deploying'].includes(rc?.mode);
 const canLook=()=>!isPaused()&&!phone.open&&events.phase!=='arrival'&&!remoteInUse();
 const canHop=()=>canLook()&&!finalCutscene&&!loisShotDirector&&!s.hidden&&!s.lying&&!s.crouched&&!animator.performing&&$('house-emotes').hidden&&
  !['safe','failed','rc-rescue','ending'].includes(events.phase)&&!isOnStairs(s,getStairDirection,inHatch)&&
  !(world.hatch.open&&inHatch(s.x,s.z,.14))&&!blocked(world.boxes,s.x,s.y,s.z,.2,1.83);
 const mouseLocked=()=>document.pointerLockElement===canvas;
 function releaseMouse(){if(mouseLocked())document.exitPointerLock();}
 function lockMouse(){
  if(!desktop.matches||!canvas.requestPointerLock||!ready||cinematic||emyShot||phone.open||phone.editing||paused||modal||poseTransition||wakeShot()||isPortrait()||!hasFocus||contextLost||remoteInUse()||events.phase==='arrival')return;
  $('lab-camera-settings').open=false;resetInput();
  try{const request=canvas.requestPointerLock();request?.catch(()=>say('El navegador no permitió capturar el ratón'));}catch{say('El navegador no permitió capturar el ratón');}
 }
 function cancelEmote(options){animator.cancelEmote(options);sound.stopEmote();}
 function equip(kind,toggle=false,automatic=false){
  if(heldNoise)return;
  const inventory=s.inventory;
  if(notePresentation&&kind!=='flashlight')return;
  if(kind==='master-key'&&!inventory.masterKey||kind==='screwdriver'&&(!inventory.screwdriver||world.studyVent.unlatched)||kind==='rc'&&!inventory.rc||kind==='flashlight'&&!inventory.torch||kind==='key'&&!inventory.key||kind==='red-key'&&!inventory.redKey||kind==='paper'&&!inventory.notes.length&&!inventory.pendingNote)return;
  cancelEmote();equipment=toggle&&equipment===kind?'empty':kind;equipmentAge=0;phone.equip(notePresentation?'empty':equipment);if(!automatic)resetInput();
 }
 function releaseCapture(element,pointer){try{if(pointer!==null&&element?.hasPointerCapture(pointer))element.releasePointerCapture(pointer);}catch{}}
 function capture(element,pointer){try{element.setPointerCapture?.(pointer);}catch{}}
 function resetInput(){
  keys.clear();joystick.x=joystick.z=0;joystick.sprint=false;velocity.forward=velocity.side=0;velocity.speed=KITTY_SPEED.walk;
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
  showModal(scenario.title,`<p>${escapeHTML(scenario.description)}</p>`,[['Iniciar prueba','start'],[exitLabel,'exit']]);
 }
 function rebuild(){
  // Keep Emy's skinned meshes in the dynamic buffer while she waits outside
  // or hides, so the window jump and shared hide can reveal her without a rebuild.
  renderer.rebuild([...world.boxes.filter(box=>!box.hiddenGeometry||box.emySpec),...pickupGeometry(world.objects)]);
  renderer.setNoiseProps(noiseProps);
  renderer.updateVisibility();
 }
 function saveCheckpoint(){
  if(!demo||pursuer.caught||events.phase==='failed')return;
  lastSafeCheckpoint=captureHouseCheckpoint({world,s,puzzle,events,mirrorSafe,rc,rcTrap,batterySwap,pursuer,emy:emyCompanion&&snapshotEmyCompanion(emyCompanion)});
  if(lastSafeCheckpoint.hide&&lastSafeCheckpoint.hide===pursuer.witnessed)lastSafeCheckpoint.hide=undefined;
  checkpointStore?.save(lastSafeCheckpoint);
 }
 function finishWindowIntro(){
  poseFurniture(world.entryWindow,1);sound.setTension(.55);
  cinematic=null;root.classList.remove('lab-intro-active');$('lab-window-intro').classList.add('lab-hidden');
  Object.assign(s,WINDOW_LANDING);s.cameraGround=s.y;s.eye=WINDOW_LANDING.eye;s.bob=0;
  resetInput();
  if(ready&&!isPaused())sound.resume();
  saveCheckpoint();
  last=performance.now();say(s.inventory.torch?'Kitty entra con cuidado por la ventana…':'Hay una linterna sobre el mueble del descansillo, arriba.',4);
 }
 function beginWindowIntro(){
  resetInput();
  poseFurniture(world.entryWindow,0);sound.setTension(.32);
  cinematic={elapsed:0,cues:new Set()};root.classList.add('lab-intro-active');$('lab-window-intro').classList.remove('lab-hidden');
  $('lab-intro-caption').textContent='Una ventana entreabierta…';
 }
 function beginEmyShot(door){
  if(!emyCompanion||emyCompanion.stage!=='waiting')return false;
  const opening=animateFurniture(door,true,{player:s,reducedMotion:reducedMotion.matches});
  if(!opening.started)return false;
  beginEmyEntrance(emyCompanion);
  emyShot={elapsed:0,camera:cameraOf(s),door,jumped:false};
  phone.close();releaseMouse();resetInput();renderer.updateVisibility();play('door-open',door,.6);
  say('Kitty se gira al oír un ruido detrás de la ventana…',4);
  return true;
 }
 function finishEmyShot(){
  const door=emyShot?.door;emyShot=null;
  if(!door)return;
  if(door.motion)updateFurniture(world.objects,.1,s);
  resetInput();saveCheckpoint();say('¡Es Emy! Ha entrado de un salto y ahora te acompaña.',4);
 }
 function syncEmyInteraction(){
  const cat=world.emy,target=world.emyInteraction;
  Object.assign(target,{x:cat.x,y:cat.y+.38,z:cat.z,interactable:!cat.hidden&&(!emyCompanion||['following','stay','distract','distract-recover'].includes(emyCompanion.stage))&&cat.reaction<=0});
 }
 function reset(saved){
  const seed=!saved&&scenario?.milestone;
  if(seed)saved=trialCheckpoint(seed);
  previousToolTarget=null;autoUseTarget=null;keyTurn=null;
  lifeNoticeLeft=0;$('house-lives').hidden=true;
  television.sync(false,false);notePresentation=false;
  louis=null;loisShotDirector=null;rcTrap={armed:false,closed:false};finalCutscene=null;
  mapReadOnly=false;mapPreview=null;mapReveal=false;emyMenuOpen=false;emyAbilities=createEmyAbilities();emyNameCue=createEmyNameCue();$('house-emy-name').hidden=true;heldNoise=null;hopAge=HOP_COOLDOWN;hopCancelled=false;clearMiniatureInput();
  $('house-emy-menu').hidden=true;$('house-emy-map').hidden=true;$('house-emy-wave').hidden=true;
  releaseMouse();events.reset();mirrorSafe.reset();hudMessages.reset();phone.close();encounterCheckpoint=null;danger.hidden=true;
   root.querySelector('[data-act=emotes]').setAttribute('aria-expanded','false');
  batterySwap=null;equipmentBeforeNote='empty';
  animator.reset();sound.stopEmote();floorSounds.reset();if(phone.editing)void phone.layoutAction('done');$('house-emotes').hidden=true;cinematic=null;emyShot=null;poseTransition=null;paused=false;lastInteraction=-Infinity;handAction=0;clickAction=0;noteLift=0;noteHold=0;capturePhoto=false;
  sound.setTension(.55);
  root.classList.remove('lab-intro-active');$('lab-window-intro').classList.add('lab-hidden');$('lab-camera-settings').open=false;
  world=createHouse(checkpoint);noiseProps=installNoiseProps(world);
  puzzle=createHousePuzzle(scenario?.puzzleEntry??config.entry);pursuer=new Pursuer(world);sound.setThreat(false);
  // Every story trial uses the real companion controller, not the older
  // autonomous upstairs cat. Non-story lab previews keep their old behavior.
  emyCompanion=demo&&(checkpoint==='ground'||!!scenario)?createEmyCompanion(world.emy,{waiting:!scenario}):null;
  world.objects.find(o=>o.id==='emy-vent').interactable=!!emyCompanion&&!puzzle.key;
  if(emyCompanion){
   const drawer=world.objects.find(o=>o.id==='drawer'),key=world.objects.find(o=>o.id==='key');
   const tool=world.studyVent.tool;
   drawer.contents=[{object:tool,origin:{x:tool.x,z:tool.z}}];
   Object.assign(key,{x:world.studyVent.x,y:world.studyVent.entrance.y+.105,z:world.studyVent.entrance.z-world.studyVent.depth,concealed:false,interactable:false});
  }
  rc=createRC(world.objects.find(o=>o.id==='rc-car'));
  bathCircuit=world.lights.circuits.find(circuit=>circuit.id==='bano');
  poseFurniture(world.entryWindow,1);handDrift.x=handDrift.y=handDrift.vx=handDrift.vy=0;
  if(demo){
   const key=world.objects.find(o=>o.id==='key');key.taken=puzzle.key;
   setDrawer(world.objects.find(o=>o.id==='drawer'),puzzle.drawer);
   world.objects.find(o=>o.id==='note-hall').text=emyCompanion?'Vi un lazo rosa entre las rejillas del conducto del estudio. Solo cabría una gatita.':PUZZLE_HINTS.note;
   world.objects.find(o=>o.id==='picture-stain').text='En el barniz se refleja la hoja del dormitorio. Las cifras se leen al derecho en el reflejo.';
   const door=world.objects.find(o=>o.id==='dormitorio');if(puzzle.door){setDoor(door,true);door.locked=false;}
  }
  const p=world.spawn;
  const torchAvailable=!demo||checkpoint!=='ground'||['drawer','lock','rescue'].includes(config.entry);
  equipment=torchAvailable?'flashlight':'empty';
  s={lives:STARTING_LIVES,emyRescueUsed:false,x:p.x,z:p.z,y:p.y,cameraGround:p.y,yaw:p.yaw,pitch:0,eye:1.63,crouched:false,hidden:null,lying:false,bob:0,
    flashlight:torchAvailable&&demo,battery:100,stamina:SPRINT_SECONDS,sprinting:false,exhausted:false,recoveryDelay:0,reduceBob:!options.bob||reducedMotion.matches,inventory:{notes:[],batteries:p.items?.batteries??Number(demo),key:demo?puzzle.key&&!puzzle.door:!!p.items?.key,redKey:false,masterKey:false,torch:torchAvailable,rc:false},distanceSteps:0};
  world.landingTorch=world.objects.find(o=>o.id==='media-flashlight');
  world.landingTorch.taken=torchAvailable;
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
  if(world.studyVent.unlatched||puzzle.key)world.studyVent.tool.taken=true;
  if(puzzle.key){world.studyVent.interactable=false;world.studyVent.unlatched=true;poseVentCover(world.studyVent,1);}
  resumed=!!restored;
  if(restored)({louis,equipment,encounterCheckpoint}=restored);
  if(seed){
   const start=trialStartPose(seed);
   if(start&&!blocked(world.boxes,start.x,start.y,start.z,.2,1.69))Object.assign(s,start);
  }
  // Restored checkpoints and isolated trial teleports must never smooth the
  // camera up from the old floor through a ceiling.
  s.cameraGround=s.y;
  if(emyCompanion){
   if(scenario&&(seed||!restored)){
    const stage=scenario.emy??(scenario.events==='car'?'waiting':trialEmyStage(scenario.milestone));
    // Place Emy AFTER restoring the player's milestone and final spawn pose.
    // The hatch-opening withdrawal and finale are not bypassed.
    if(!initializeTrialEmy(emyCompanion,world,s,stage)){
     const anchor=s.y>HEIGHT*.52?world.spawns.upstairs:world.spawns.interactions;
     initializeTrialEmy(emyCompanion,world,anchor,stage);
    }
   }else if(restored){
    const legacyExplored=!saved?.emy&&(saved.stage!=='explore'||saved.drawer||saved.picked?.length);
    const catSave=saved.version===1&&saved.emy?.stage?.startsWith('trunk')&&world.hatch.locked?{stage:'following'}:saved.emy;
    restoreEmyCompanion(emyCompanion,world.hatch.locked?(catSave??(legacyExplored?{stage:'following'}:null)):{stage:'trunk'},events.phase);
    // A trial retry restores Kitty at a checkpoint, not necessarily where
    // the cat was last walking. Rejoin only a saved following companion.
    if(scenario&&emyCompanion.stage==='following'&&!s.hidden)initializeTrialEmy(emyCompanion,world,s,'following');
   }
  }
  syncEmyInteraction();
  // Capture the actual initialized companion, not the pre-restore default.
  // Preserve the original checkpoint's narrative and life fields on retries.
  const emy=emyCompanion&&snapshotEmyCompanion(emyCompanion);
  lastSafeCheckpoint=restored?{...saved,emy}:captureHouseCheckpoint({world,s,puzzle,events,mirrorSafe,rc,rcTrap,batterySwap,pursuer,emy});
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
  const loc=listener(),source=o?{x:o.x,y:o.y,z:o.z,material:o.material,surface:o.surface}:null;
  const occluded=source?lineBlocked(world.boxes,loc,source,o?.kind==='door'?'door-'+o.id:''):false;
  sound.effect(name,source,{...loc,yaw:s.yaw},occluded,{level});
  if(name==='cat')caption(o===world.emy||o?.kind==='emy-cat'?'Maullido de Emy':'Maullido junto a la salida');
  if(name==='cat-purr')caption('Ronroneo de Emy');
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
  const transition=poseTransition;
  // Kitty's wardrobe animation is authoritative. Emy may be downstairs,
  // distracting, stuck or joining the closet, but none of those states may
  // stall the player's entrance or prolong exposure to the pursuer.
  transition.elapsed+=dt;
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
 function toolFor(target){
  if(!target)return;
  const bag=s.inventory;
  if(target.kind==='vent'&&!target.unlatched&&bag.screwdriver)return 'screwdriver';
  if(target.kind==='hatch'&&target.locked&&bag.redKey)return 'red-key';
  if(target.id==='dormitorio'&&target.locked&&bag.key)return 'key';
  if(target.id==='entrada'&&target.sealed&&events.phase==='escape'&&bag.masterKey)return 'master-key';
  if(target.kind==='piano'&&world.pianoSheet.taken&&!target.scorePlaced)return 'paper';
 }
 function refreshEmyMenu(){
  for(const [act,id,left] of [['emy:scan','house-emy-scan-cd',emyAbilities.scanCooldown],['emy:map','house-emy-distract-cd',emyAbilities.distractCooldown]]){
   const badge=$(id),button=badge.closest('button');
   button.disabled=left>0;badge.hidden=left<=0;badge.textContent=left>0?Math.ceil(left)+' s':'';
  }
  const stage=emyCompanion?.stage,staying=['stay','distract','distract-recover'].includes(stage),busy=['distract','distract-recover'].includes(stage),stay=$('house-emy-stay');
  if(emyCompanion?.stage!=='following'){
   const distract=$('house-emy-distract-cd');distract.closest('button').disabled=true;
   distract.hidden=false;distract.textContent=emyAbilities.distractCooldown>0?Math.ceil(emyAbilities.distractCooldown)+' s':staying?'Sígueme primero':'No disponible';
  }
  $('house-emy-stay-icon').textContent=staying?'↪':'Ⅱ';
  $('house-emy-stay-title').textContent=staying?'Sígueme':'Quédate aquí';
  $('house-emy-stay-copy').textContent=busy?'Interrumpe la orden; conserva la recarga':staying?'Vuelve a acompañar a Kitty':'Emy esperará en este lugar';
  stay.setAttribute('aria-pressed',String(staying));stay.disabled=!['following','stay','distract','distract-recover'].includes(stage);
  $('house-emy-menu').querySelector('[data-act="emy:pet"]').disabled=busy;
  if(busy)$('house-emy-scan-cd').closest('button').disabled=true;
 }
 function closeEmyMenu(){
  const backToPhone=mapReadOnly;mapReadOnly=false;mapPreview=null;mapReveal=false;
  emyMenuOpen=false;$('house-emy-menu').hidden=true;$('house-emy-map').hidden=true;clearMiniatureInput();
  resetInput();if(!isSuspended())sound.resume();
  if(backToPhone&&ready&&!isSuspended()&&!s.hidden&&equipment==='phone'){phone.show('home');return;}
  // Return focus to the game action instead of retaining a hidden dialog card.
  if(ready&&!isSuspended())requestAnimationFrame(()=>{
   if(!active||isSuspended()||emyMenuOpen)return;
   const action=$('lab-interact');(action.hidden||action.disabled?canvas:action).focus({preventScroll:true});
  });
 }
 function interact(){
  // Throw is a distinct action from pickup: do not swallow an intentional
  // press of the newly enabled action button during the pickup debounce.
  if(heldNoise&&!s.hidden&&!s.lying){runAction('noise:throw');return;}
  const now=performance.now();if(now-lastInteraction<260)return;lastInteraction=now;handAction=1;
  if(s.hidden||s.lying){exitPose();return;}
  const o=closestObject(world,s,focus);if(!o){say('Acércate a un objeto y míralo para interactuar');return;}
  const tool=toolFor(o);
  if(tool&&tool!==equipment)equip(tool);
  if(o.kind==='vent'){
   if(!o.unlatched&&equipment!=='screwdriver'){say(s.inventory.screwdriver?'Equipa el destornillador para quitar los tornillos.':'La rejilla tiene cuatro tornillos. Revisa el cajón del escritorio.');return;}
   if(removeVentCover(o,reducedMotion.matches,equipment)){
    equip('empty');
    if(o.coverAmount===1){s.inventory.screwdriver=false;phone.setInventory(s.inventory);}
    play('latch',o);saveCheckpoint();return;
   }
   if(o.coverAmount<1)return;
   if(emyCompanion?.stage!=='following'){say('Por aquí cabe Emy. Vuelve con ella.');return;}
   const key=world.objects.find(o=>o.id==='key');
   if(requestRibbonKey(emyCompanion,o,key)){o.interactable=false;play('cat',world.emy,.55);}
   return;
  }
  if(o.kind==='emy-cat'){
   if(Math.hypot(s.x-o.x,s.z-o.z)>1.45||Math.abs(s.y-world.emy.y)>1.5){say('Acércate un poco a Emy');return;}
   emyMenuOpen=true;releaseMouse();resetInput();sound.pause();$('house-emy-menu').hidden=false;
   $('house-emy-map').hidden=true;$('house-emy-name').hidden=true;refreshEmyMenu();
   $('house-emy-menu').querySelector('button.emy-card:not(:disabled)')?.focus({preventScroll:true});
   return;
  }else if(o.kind==='noise-prop'){
   if(batterySwap!==null){say('Termina de cambiar la pila antes de recoger el objeto.');return;}
   if(grabNoiseProp(o)){heldNoise=o;previousToolTarget=null;autoUseTarget=null;cancelEmote({immediate:true});play('pickup',o);say(o.label.replace('Recoger','Recogiste')+'. '+throwableHint(!desktop.matches),3);}
   return;
  }else if(o.kind==='light-switch'){
   const on=toggleCircuit(o.circuit);play('click',o);
   say(on===null?'Sin corriente · revisa el interruptor general':on?'Luz encendida':'Luz apagada');
  }else if(o.kind==='power-switch'){
   const on=toggleHousePower(o);play(on?'latch':'power-cut',o,.85);
   if(!on){world.television.power.on=false;television.sync(false,false);}
   say(on?'Corriente restablecida':'Corriente cortada');
  }else if(o.kind==='rug'){
   if(o.hatch.amount>0||o.hatch.open){say('Cierra la trampilla antes de volver a cubrirla');return;}
   o.aside=!o.aside;o.hatch.concealed=true;play('cloth',o);
  }else if(o.kind==='hatch'){
   if(rcTrap.closed){say('El pestillo tiembla. Es hora de salir.');return;}
   if(o.amount!==Number(o.open))return;
   if(puzzle.rescued&&louis?.phase==='hidden'&&o.open&&!rcTrap.armed){
    rcTrap.armed=true;saveCheckpoint();say('Trampa preparada. Usa el auto para atraer al secuestrador al sótano y activa la escotilla.',7);play('latch',o);return;
   }
   if(rcTrap.armed&&!rcTrap.closed){say('La trampa está preparada. Espera a que el secuestrador baje y activa el cierre desde la tablet.',5);return;}
   if(s.y<-.04||inHatch(s.x,s.z,.14)){say('Apártate del borde para mover la trampilla');return;}
   if(o.locked){
    if(!s.inventory.redKey){play('latch',o);say('Candado rojo · busca la llave en el compartimento del piano',4);return;}
    keyTurn={kind:'red-key',time:0};o.locked=false;s.inventory.redKey=false;if(equipment==='red-key')equip('empty');phone.setInventory(s.inventory);
    for(const chain of o.chains)chain.hiddenGeometry=true;
    renderer.updateVisibility();play('latch',o);
   }
   o.open=!o.open;
   if(o.open&&emyCompanion&&!emyCompanion.stage.startsWith('trunk')&&sendEmyToTrunk(emyCompanion))caption('Emy busca refugio en el estudio mientras Kitty baja.');
   if(reducedMotion.matches&&(!o.open||!emyOccupiesHatch(emyCompanion)))poseHatch(o,Number(o.open));
   play(o.open?'door-open':'door-close',o,.85);
  }else if(o.kind==='tap'){
   o.on=!o.on;o.water.y=o.on?1.01:-100;play('click',o);say(o.on?'Llave de agua abierta':'Llave de agua cerrada');
  }else if(o.kind==='door'||o.kind==='cupboard'){
   if(o.id==='salon'&&!o.open&&emyCompanion?.stage==='waiting'&&beginEmyShot(o))return;
   if(o.id==='entrada'&&o.sealed&&events.phase==='escape'){
    if(!s.inventory.masterKey){say('Necesitas la llave maestra que cuelga junto a Louis.',5);play('latch',o);return;}
    const opened=animateFurniture(o,true,{player:s,reducedMotion:reducedMotion.matches});
    if(!opened.started){say('Retrocede un poco para abrir la puerta.');return;}
    keyTurn={kind:'master-key',time:0};o.sealed=false;
    // Let the trap buy time. Its latch gives way as Kitty unlocks the exit.
    world.hatch.open=true;poseHatch(world.hatch,1);play('latch',world.hatch);
    for(const box of world.boxes)if(box.id.startsWith('entry-padlock'))box.hiddenGeometry=true;
    renderer.updateVisibility();play('unlock',o);saveCheckpoint();say('La llave maestra abrió la salida.');
    return;
   }
   if(demo&&o.id==='dormitorio'&&!canOpenBedroom(puzzle)){say(housePuzzleHint(puzzle,'bedroom'),4);play('latch',o);return;}
   if(o.sealed||o.locked&&!s.inventory.key){say(o.sealed?'Cerró la puerta con un candado. Busca otra salida.':'La puerta tiene un pequeño candado. Busca una llave.');play('latch',o);return;}
    const opening=!o.open;if(pursuer.active&&!sweepClear(o,o.amount,opening?1:0,pursuer)){say('No puedes mover la puerta mientras alguien ocupa el paso.');return;}const result=animateFurniture(o,opening,{player:s,reducedMotion:reducedMotion.matches});
    if(!result.started){if(result.reason==='blocked')say('No puedes mover la puerta mientras estás en el paso.');return;}
    if(o.id==='dormitorio'&&opening&&o.locked){keyTurn={kind:'key',time:0};o.locked=false;s.inventory.key=false;if(equipment==='key')equip('empty');phone.setInventory(s.inventory);}
    if(demo&&o.id==='dormitorio'&&opening&&result.complete)puzzle=puzzleEvent(puzzle,'door');
    play(o.kind==='cupboard'?'drawer':opening?'door-open':'door-close',o);
    say(o.kind==='cupboard'?(opening?'Refrigerador abierto':'Refrigerador cerrado'):(opening?'Abriendo puerta…':'Cerrando puerta…'));
  }else if(o.kind==='drawer'){
   const keyDrawer=demo&&o.id==='drawer';
    const opening=!o.open,result=animateFurniture(o,opening,{player:s,reducedMotion:reducedMotion.matches});
    if(!result.started){if(result.reason==='blocked')say('Deja un poco de espacio delante del cajón.');return;}
    if(keyDrawer&&opening){puzzle=puzzleEvent(puzzle,'drawer');world.objects.find(k=>k.id==='key').taken=puzzle.key;say(puzzle.key?'Ya guardaste la llave en la mochila.':emyCompanion?'Los arañazos llegan hasta la rejilla del conducto.':'Abriendo el cajón… una llave con un lazo.',3);}
    else if(o.id==='landing-cabinet'&&opening&&!s.inventory.torch)say('Hay una linterna sobre el mueble.');
    else say(opening?'Abriendo cajón…':'Cerrando cajón…');
    play('drawer',o);
  }else if(o.kind==='battery'){o.taken=true;s.inventory.batteries++;renderer.updateVisibility();play('pickup',o);say('Pila guardada en la mochila');}
  else if(o.kind==='screwdriver'){o.taken=true;s.inventory.screwdriver=true;phone.setInventory(s.inventory);equip('screwdriver');renderer.updateVisibility();play('pickup',o);saveCheckpoint();return;}
  else if(o.kind==='flashlight'){o.taken=true;s.inventory.torch=true;s.flashlight=true;phone.setInventory(s.inventory);equip('flashlight');renderer.updateVisibility();play('pickup',o);say('Linterna guardada');}
  else if(o.kind==='key'){
   if(o.master){o.taken=true;s.inventory.masterKey=true;phone.setInventory(s.inventory);renderer.updateVisibility();play('pickup',o);say('Llave maestra guardada');saveCheckpoint();return;}
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
   if(demo&&(!scenario||scenario.milestone)&&rc.mode==='packed'&&!['rc-setup','escape'].includes(events.phase)){say('Podrás usar el auto cuando Louis esté a salvo detrás del mesón.');return;}
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
   if(demo&&!s.inventory.masterKey){say('La llave de la salida cuelga al lado de Louis. Llévala contigo.',4);return;}
   if(demo&&!canRescue(puzzle)){say(housePuzzleHint(puzzle,'rescue'),4);return;}
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
    showModal('¡Louis está a salvo!', '<p>Kitty le suelta las manos. Louis murmura: «Sabía que ibas a venir».</p>',[[config.onRescue?'Terminar el juego':exitLabel,config.onRescue?'finish':'exit']]);
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
  equip('paper');setPianoScore(instrument,true);
  sound.preparePiano();
  play('cloth',instrument);say('Kitty colocó la partitura en el atril.');
 }
 function openPiano(object){
  if(!['explore','evaded','escape'].includes(events.phase)){say('Ahora no conviene hacer ruido.');return;}
  placePianoScore();
  showModal('Piano antiguo',`<div class="piano-sheet-ui"><div class="piano-title">${object.scorePlaced?'Mia &amp; Sebastian’s Theme':'Piano libre'} <span class="piano-page-label"></span></div>
   <div class="piano-score" role="img" aria-label="Partitura"></div><div class="piano-time" aria-hidden="true"><i></i></div>
   <div class="piano-keys">${pianoKeyboard()}</div></div><output class="piano-result" aria-live="polite"></output>`,
   [['Levantarse','close']]);
  piano=new PianoSession(object,dialog,sound,saveCheckpoint);
  sound.preparePiano();
  s.poseCamera=object.seat;dialog.classList.add('house-piano-dialog');
 }
 function pianoRunning(){return !paused&&hasFocus&&!document.hidden&&!isPortrait()&&!contextLost&&!$('lab-camera-settings').open;}
 function playPiano(index){
  if(piano&&pianoRunning())piano.press(index,performance.now());
 }
 function showMirrorNote(back='close'){
  showModal('Nota con escritura extraña',`<div class="house-note-sheet mirror-note-paper"><span class="mirror-note-writing" aria-hidden="true">${SAFE_CODE}</span><span class="mirror-note-description">Cuatro cifras escritas al revés.</span></div>${mirrorSafe.revealed?`<p class="mirror-note-reading">Lectura del espejo: <strong>${SAFE_CODE}</strong></p>`:'<p>Las marcas parecen tener sentido desde otro punto de vista.</p>'}`,[['Volver',back]]);
  dialog.querySelector('.lab-paper').classList.add('mirror-note-modal');
 }
 function showSafe(object){
  if(object.motion){say('La caja se está abriendo…');return;}
  if(mirrorSafe.opened){showModal('Dentro de la caja fuerte',world.pianoSheet.taken?'<p>La caja está vacía.</p>':'<p>Dentro hay una partitura doblada.</p>');return;}
  activeSafe=object;safeInput='';
  showModal('Caja fuerte','<p class="safe-instruction">Introduce la combinación de cuatro cifras.</p><output id="safe-code" class="safe-code" aria-label="Combinación introducida" aria-live="polite">· · · ·</output><div class="safe-keypad" role="group" aria-label="Teclado de la caja fuerte">'+[1,2,3,4,5,6,7,8,9,'clear',0,'back'].map(n=>`<button data-act="safe:${n}"${n==='back'?' aria-label="Borrar última cifra"':n==='clear'?' aria-label="Borrar combinación"':''}>${n==='clear'?'C':n==='back'?'⌫':n}</button>`).join('')+'</div><p id="safe-feedback" class="safe-feedback" role="status"></p>',[['Abrir caja','safe:submit'],['Cerrar','close']]);
  dialog.querySelector('.lab-paper').classList.add('safe-paper');
 }
 function safeAction(action){
  if(modal!=='Caja fuerte'||!activeSafe)return;
  const feedback=$('safe-feedback');
  if(action==='submit'){
   if(safeInput.length!==4){feedback.textContent='Faltan cifras: la combinación tiene cuatro.';return;}
   if(demo&&(!scenario||scenario.milestone)&&!mirrorSafe.revealed){feedback.textContent='Primero descifra la nota frente al espejo del baño.';return;}
   const object=activeSafe,result=mirrorSafe.submit(safeInput,()=>animateFurniture(object,true,{player:s,reducedMotion:reducedMotion.matches}).started);
   if(result==='wrong'){safeInput='';feedback.textContent='La combinación no coincide. Puedes volver a intentarlo.';play('latch',object);}
   if(result==='blocked'){feedback.textContent='Deja un poco de espacio delante de la caja para abrirla.';return;}
   if(result==='opened'){
    if(demo)puzzle=puzzleEvent(puzzle,'symbol');
     world.pianoSheet.concealed=false;world.pianoSheet.interactable=true;renderer.updateVisibility();saveCheckpoint();
    modalClose();play('keys',object);say('Caja abierta · recoge la partitura',4);return;
   }
  }else{feedback.textContent='';if(action==='clear')safeInput='';else if(action==='back')safeInput=safeInput.slice(0,-1);else if(/^\d$/.test(action)&&safeInput.length<4)safeInput+=action;}
  $('safe-code').textContent=(safeInput+'····').slice(0,4).split('').join(' ');
 }
 function bag(){
  const notes=s.inventory.notes.map(n=>`<button class="lab-note" data-act="read" data-id="${escapeHTML(n.id)}">✉ ${escapeHTML(n.label)} ↗</button>`).join('')||'<p>Aún no hay notas guardadas.</p>';
  const actions=[['Cerrar mochila','close']];
  const charge=Math.ceil(s.battery);
  if(!heldNoise&&charge<100&&s.inventory.batteries>0)actions.unshift(['Usar pila (hasta +'+SPARE_CHARGE+'%)','recharge']);
  showModal('Mi mochila',`<p><b>Auto RC:</b> ${s.inventory.rc?'Auto y tablet listos':'Sin recoger'}</p><p><b>⚿ Llave:</b> ${s.inventory.key?'Llave con lazo · abre el dormitorio':'Sin llave con lazo'}</p>${s.inventory.masterKey?'<p><b>Llave maestra</b> · Abre la puerta principal</p>':''}<p><b>Linterna:</b> ${charge}% · <b>Pilas de repuesto:</b> ${s.inventory.batteries}</p><div class="lab-note-list">${notes}</div>`,actions);
 }
 function startBatterySwap(){
  if(heldNoise){say('Lanza primero el objeto que llevas.');return false;}
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
 function togglePause(){if(!ready||contextLost)return;phone.close();$('lab-camera-settings').open=false;paused=!paused;if(paused){sound.pause();showModal('Pausa',`<p>El tiempo de la casa y sus sonidos se han detenido.</p>`,[['Continuar','resume'],[exitLabel,'exit']]);}else{modalClose();sound.resume();}}
 const inBathroom=()=>roomAt(s.x,s.z,s.y)==='Baño';
 function useEquipment(){
  if(heldNoise){say('Lanza primero el objeto que llevas.');return;}
  if((s.hidden||s.lying)&&equipment!=='phone')return;
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
 function drawEmyMiniature(){
  const host=$('house-emy-miniature');if(!host||$('house-emy-map').hidden)return;
  const lockedIds=Object.keys(mapUnavailable);
  const markers=miniatureMarkers({x:s.x,y:s.y,z:s.z},{x:world.emy.x,y:world.emy.y,z:world.emy.z,hidden:world.emy.hidden},
   pursuer,!mapReadOnly&&emyAbilities.scan>0&&pursuer.active&&renderer.lastScanOutline);
  host.innerHTML=miniatureSVG(world,miniatureView,{floor:emyMapFloor,selectedId:emyMapSelected,lockedIds,markers,route:mapPreview,readOnly:mapReadOnly,reveal:mapReveal&&!reducedMotion.matches});mapReveal=false;
  const legend=$('house-emy-mini-legend');
  if(legend){
   const ids=new Set([...host.querySelectorAll('[data-marker]')].map(el=>el.dataset.marker));
   const entries=[['kitty','K','Kitty'],['emy','E','Emy'],['threat','!','Amenaza']].filter(([id])=>ids.has(id));
   const html=entries.map(([id,symbol,label])=>'<span class="mini-legend-item '+id+'"><b>'+symbol+'</b> '+label+'</span>').join('');
   if(legend.dataset.markers!==html){legend.dataset.markers=html;legend.innerHTML=html||'Toca o desliza la lista ↓';}
  }
 }
 const mapPointers=new Map();let mapDragged=false,mapSuppressUntil=0,mapRedraw=0,mapUnavailable={},mapRejected={},mapValidation=new Map(),mapPreview=null,mapReadOnly=false,mapReveal=false;
 function scheduleMiniature(){if(!mapRedraw)mapRedraw=requestAnimationFrame(()=>{mapRedraw=0;drawEmyMiniature();});}
 function clearMiniatureInput(){
  const ids=[...mapPointers.keys()];mapPointers.clear();
  for(const id of ids)releaseCapture(mapPanel,id);
  if(mapRedraw)cancelAnimationFrame(mapRedraw);mapRedraw=0;mapDragged=false;
 }
 const mapPanel=$('house-emy-map');
 mapPanel.addEventListener('pointerdown',e=>{
  if(!e.target.closest('#house-emy-miniature')||e.button!==0)return;
  if(!mapPointers.size)mapDragged=false;
  mapPointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});
  if(mapPointers.size>1){mapDragged=true;for(const id of mapPointers.keys())capture(mapPanel,id);}
 },{signal});
 mapPanel.addEventListener('pointermove',e=>{
  const p=mapPointers.get(e.pointerId);if(!p)return;
  if(e.pointerType==='mouse'&&!(e.buttons&1)){mapPointers.delete(e.pointerId);releaseCapture(mapPanel,e.pointerId);return;}
  const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(!mapDragged&&Math.hypot(e.clientX-p.startX,e.clientY-p.startY)<5)return;
  mapDragged=true;capture(mapPanel,e.pointerId);
  const other=[...mapPointers.entries()].find(([id])=>id!==e.pointerId)?.[1];
  miniatureView=other?changeMiniatureView(miniatureView,{zoom:Math.hypot(e.clientX-other.x,e.clientY-other.y)/Math.max(1,Math.hypot(p.x-other.x,p.y-other.y))}):
   changeMiniatureView(miniatureView,{yaw:dx*.009,pitch:-dy*.007});
  p.x=e.clientX;p.y=e.clientY;scheduleMiniature();e.preventDefault();
 },{signal});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,e=>{
  if(!mapPointers.has(e.pointerId))return;mapPointers.delete(e.pointerId);
  if(mapDragged)mapSuppressUntil=performance.now()+320;
 },{signal});
 mapPanel.addEventListener('wheel',e=>{
  if(!e.target.closest('#house-emy-miniature'))return;
  e.preventDefault();miniatureView=changeMiniatureView(miniatureView,{zoom:Math.exp(-e.deltaY*.0015)});drawEmyMiniature();
 },{signal,passive:false});
 function renderEmyMap(){
  const all=roomChoices(world.rooms),selected=all.find(r=>r.id===emyMapSelected)||null;
  // The house is paused during this dialog, so walkability can be reused
  // for the current visit instead of rescanning collision boxes per selection.
  if(!mapValidation.has(emyMapFloor)){
   const unavailable={};
   for(const r of all.filter(r=>r.floor===emyMapFloor)){
    if(isEmyRoomLocked(world,r))unavailable[r.id]='🔒 Puerta cerrada';
    else if(!roomDestinations(world,r).length)unavailable[r.id]='Sin espacio libre';
   }
   mapValidation.set(emyMapFloor,unavailable);
  }
  mapUnavailable={...mapValidation.get(emyMapFloor),...mapRejected};
  const lockedIds=Object.keys(mapUnavailable);
  const options={selectedId:emyMapSelected,lockedIds,disabledReasons:mapUnavailable};
  mapPanel.dataset.mode=mapReadOnly?'browse':'command';
  mapPanel.setAttribute('aria-label',mapReadOnly?'Mapas · casa de Kitty':'Mapa de distracción de Emy');
  mapPanel.querySelector('.house-emy-map-kicker').textContent=mapReadOnly?'MAPAS · CASA':'EMY · PLAN DE DISTRACCIÓN';
  mapPanel.querySelector('.house-emy-map-header strong').textContent=mapReadOnly?'Explora la casa':'Elige dónde hacer ruido';
  mapPanel.querySelector('[data-act="emy:map:back"]').setAttribute('aria-label',mapReadOnly?'Volver al teléfono':'Volver a acciones de Emy');
  for(const floor of [-1,0,1]){
   const tab=$('house-emy-tab-'+floor);
   tab.setAttribute('aria-selected',String(emyMapFloor===floor));
   tab.tabIndex=0; // Both floors remain reachable by keyboard and touch.
  }
  $('house-emy-map-rooms').setAttribute('aria-labelledby','house-emy-tab-'+emyMapFloor);
  const floorName=emyMapFloor<0?'EXTERIOR':emyMapFloor===0?'PLANTA BAJA':'PLANTA ALTA';
  const roomsHost=$('house-emy-map-rooms');
  const previousList=roomsHost.querySelector('.house-emy-destination-list');
  const sameFloor=roomsHost.dataset.floor===String(emyMapFloor),scroll=sameFloor?previousList?.scrollTop||0:0;
  mapReveal=!sameFloor&&emyMapFloor>=0;
  roomsHost.dataset.floor=String(emyMapFloor);
  roomsHost.innerHTML=
   '<div class="house-emy-map-layout">'+
    '<section class="house-emy-map-board" aria-label="Vista superior de '+floorName+'">'+
     '<div class="house-emy-map-board-title"><strong>'+floorName+'</strong><span>Miniatura 3D</span></div>'+
     '<div id="house-emy-miniature" class="house-emy-plan mini-3d"></div>'+
     '<div class="mini-tools" role="group" aria-label="Control de la miniatura">'+
     [['left','↶','Girar izquierda'],['right','↷','Girar derecha'],['up','↑','Inclinar arriba'],['down','↓','Inclinar abajo'],['plus','+','Acercar'],['minus','−','Alejar'],['reset','⌂','Restablecer vista']].map(([id,label,desc])=>'<button data-act="emy:view:'+id+'" aria-label="'+desc+'">'+label+'</button>').join('')+'</div>'+
    '</section>'+
    '<section class="house-emy-destination-panel" aria-label="Habitaciones de '+floorName+'">'+
     '<div class="house-emy-destination-head"><strong>Habitaciones y zonas</strong><small id="house-emy-mini-legend">Toca o desliza la lista ↓</small></div>'+
     (emyMapFloor<0?'<div class="mini-exterior-copy"><b>La casa de Kitty</b><p>Gira la miniatura y selecciona una planta para retirar la cubierta'+(mapReadOnly?'.': ' y elegir dónde enviar a Emy.')+'</p></div>':
      mapReadOnly?'<div class="house-emy-destination-list mini-readonly-list">'+all.filter(r=>r.floor===emyMapFloor).map(r=>'<div class="mini-readonly-room">'+escapeHTML(r.label)+'</div>').join('')+'</div>':
      '<div class="house-emy-destination-list">'+emyFloorList(world.rooms,emyMapFloor,options)+'</div>')+
    '</section>'+
   '</div>';
  drawEmyMiniature();
  const destinationList=roomsHost.querySelector('.house-emy-destination-list');if(destinationList)destinationList.scrollTop=scroll;
  $('house-emy-map-send').hidden=mapReadOnly;
  $('house-emy-map-send').disabled=mapReadOnly||!selected||!mapPreview||!!mapUnavailable[selected.id];
  const status=$('house-emy-map-status');
  if(mapReadOnly)status.textContent='Mapa de consulta · Verde: abierta · Ocre: cerrada · Rosa: bloqueada';
  else if(selected&&mapPreview)status.textContent='Destino: '+selected.label+' · '+(selected.floor?'planta alta':'planta baja')+' · aprox. '+mapPreview.seconds+' s'+
    (mapPreview.waypoints.some(p=>p.y<HEIGHT*.5)&&mapPreview.waypoints.some(p=>p.y>=HEIGHT*.5)?' · Ver ambos pisos':'')+' · 25 s de distracción';
  else status.textContent=emyMapFloor<0?'¿A qué piso quieres enviar a Emy?':'Selecciona una habitación en este piso.';
 }
 function openHouseMap(readOnly=false){
  if(readOnly){
   if(!phone.open||!canUseHotbar()||s.hidden||s.lying)return;
   phone.close();emyMenuOpen=true;releaseMouse();resetInput();sound.pause();
  }
  mapReadOnly=readOnly;mapPreview=null;mapReveal=false;
  emyMapFloor=-1;miniatureView=defaultMiniatureView();clearMiniatureInput();mapRejected={};mapValidation.clear();mapSuppressUntil=0;
  emyMapSelected='';$('house-emy-menu').hidden=true;$('house-emy-map').hidden=false;
  $('house-emy-map-rooms').dataset.floor='';
  renderEmyMap();$('house-emy-tab--1').focus({preventScroll:true});
 }
 function runAction(act,node){
  if(act.startsWith('emy:')){
   if(act==='emy:close'){
    closeEmyMenu();return;
   }
   if(!emyMenuOpen||!world||!s)return;
   if(mapReadOnly&&!['emy:map:back'].includes(act)&&!act.startsWith('emy:view:')&&!act.startsWith('emy:floor:'))return;
   if(act==='emy:stay'){
     const staying=['stay','distract','distract-recover'].includes(emyCompanion?.stage);
     const ok=staying?rejoinEmyInPerson(emyCompanion,world,s):commandEmyStay(emyCompanion);
     if(!ok){say('Acércate a Emy para cambiar su orden.');return;}
     closeEmyMenu();
     say(staying?'Emy vuelve a seguir a Kitty.':'Emy se quedará aquí hasta que le indiques que te siga.',3);
     resetInput();return;
    }
    if(act==='emy:pet'){
    if(emyCompanion&& !['following','stay'].includes(emyCompanion.stage))return;
    closeEmyMenu();
    if(world.emy.alarm>.55){say('Emy está alerta. Busca un lugar tranquilo primero.');return;}
    if(petEmy(world.emy)){resetInput();play('cat-purr',world.emy,.60);say('Emy ronronea y levanta su patita ♡',3);}
    return;
   }
   if(act==='emy:scan'){
    if(emyCompanion&& !['following','stay'].includes(emyCompanion.stage))return;
    if(emyAbilities.scanCooldown>0){say('Emy necesita descansar '+Math.ceil(emyAbilities.scanCooldown)+' s.');return;}
    closeEmyMenu();
    if(activateEmyScan(emyAbilities)){
     play('cat',world.emy,.9);
     say(pursuer.active?'Escaneo activo · sigue la silueta luminosa del secuestrador.':'Emy maúlla, pero todavía no hay amenazas activas.',4);
    }return;
   }
   if(act==='emy:map'){
    if(emyAbilities.distractCooldown>0){say('Emy necesita descansar '+Math.ceil(emyAbilities.distractCooldown)+' s.');return;}
    if(emyCompanion?.stage!=='following'){say('Indica primero a Emy que te siga.');return;}
    openHouseMap(false);return;
   }
   if(act==='emy:map:back'){
    if(mapReadOnly){closeEmyMenu();return;}
    mapPreview=null;emyMapSelected='';$('house-emy-map').hidden=true;$('house-emy-menu').hidden=false;clearMiniatureInput();refreshEmyMenu();
    $('house-emy-menu').querySelector('[data-act="emy:map"]').focus({preventScroll:true});return;
   }
   if(act.startsWith('emy:view:')){
    const delta={left:{yaw:-.3},right:{yaw:.3},up:{pitch:.15},down:{pitch:-.15},plus:{zoom:1.13},minus:{zoom:1/1.13}}[act.slice(9)];
    miniatureView=delta?changeMiniatureView(miniatureView,delta):defaultMiniatureView();drawEmyMiniature();return;
   }
   if(['emy:floor:-1','emy:floor:0','emy:floor:1'].includes(act)){
    emyMapFloor=Number(act.slice(10));clearMiniatureInput();
    renderEmyMap();
    $('house-emy-tab-'+emyMapFloor).focus({preventScroll:true});
    return;
   }
   if(act.startsWith('emy:room:')){
    const id=act.slice('emy:room:'.length);
    const room=roomChoices(world.rooms).find(r=>r.id===id&&r.floor===emyMapFloor);
    if(!room||mapUnavailable[room.id]||performance.now()<mapSuppressUntil&&node?.closest('#house-emy-miniature'))return;
    mapPreview=null;
    for(const goal of roomDestinations(world,room)){mapPreview=previewEmyDistract(emyCompanion,world,goal);if(mapPreview)break;}
    if(!mapPreview){mapRejected[room.id]='Ruta bloqueada';emyMapSelected='';renderEmyMap();$('house-emy-map-status').textContent='Emy no puede llegar a '+room.label+'. Abre el paso o elige otro lugar.';return;}
    emyMapSelected=room.id;renderEmyMap();
    $('house-emy-map-send').focus({preventScroll:true});
    return;
   }
   if(act==='emy:send'){
    const room=roomChoices(world.rooms).find(r=>r.id===emyMapSelected);
    if(!room||mapUnavailable[room.id]||isEmyRoomLocked(world,room)||emyAbilities.distractCooldown>0)return;
    if(!mapPreview)return;
    if(!sendEmyDistract(emyCompanion,world,mapPreview.goal)){
     mapPreview=null;mapRejected[room.id]='Ruta bloqueada';emyMapSelected='';renderEmyMap();
     $('house-emy-map-status').textContent='Emy no puede llegar a '+room.label+' con las puertas actuales. Abre el paso o elige otro destino.';
     return;
    }
    emyAbilities.distractCooldown=55;
    emyMapSelected='';closeEmyMenu();
    play('cat',world.emy,.6);say('Emy va hacia '+room.label+' (planta '+(room.floor?'alta':'baja')+'). Hará ruido durante 25 segundos al llegar.',5);
    resetInput();return;
   }
   return;
  }
  if(emyMenuOpen&&act!=='exit')return;
  if(act.startsWith('noise:')){
   if(act!=='noise:throw'||!heldNoise||!canLook()||finalCutscene||s.hidden||s.lying)return;
   const prop=heldNoise;
   if(!releaseNoiseProp(prop,cameraOf(s),true,1))return;
   heldNoise=null;lastInteraction=performance.now();handAction=1;
   play('cloth',prop,.5);say('¡Objeto lanzado!',2);return;
  }
  if((events.phase==='safe'||events.phase==='failed')&&!['retry-arrival','exit','reset','finish'].includes(act))return;
  if(act==='retry-arrival'){
   if(scenario?.events==='wake'){ready=false;intro=true;reset();showTrialStart();return;}
   paused=false;modalClose();Object.assign(s,encounterCheckpoint);s.hidden=null;s.lying=false;s.crouched=false;s.eye=1.63;s.poseCamera=null;poseTransition=null;
   pursuer.reset();poseFurniture(world.objects.find(o=>o.id==='wardrobe'),0);
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
    // The player hears the horn via the RC tablet even when Kitty is far away;
    // the pursuer still follows the actual RC coordinates from beepRC().
    play('rc-horn',null,1.10);
    say('¡Bocina RC! El secuestrador puede oírla y venir a investigar.',3);
   }return;
  }
  if(act==='rc:trap'){
   if(rc.mode!=='driving'||!canTrapPursuer(pursuer,world.hatch,rcTrap.armed)){say('Espera a que el secuestrador entre por completo al túnel.');return;}
   rcTrap.closed=true;rcTrap.armed=false;
   world.hatch.open=false;poseHatch(world.hatch,0);pursuer.mode='trapped';pursuer.path=[];
   stopRC(rc);equipment='rc';phone.equip('rc');
   const entrance=world.objects.find(o=>o.id==='entrada');entrance.sealed=true;entrance.locked=false;setDoor(entrance,false);
   for(const box of world.boxes)if(box.id.startsWith('entry-padlock'))box.hiddenGeometry=false;
   freeLouis(louis);events.phase='escape';sound.setThreat(false);resetInput();rebuild();saveCheckpoint();
   play('hatch-close',world.hatch);
   say(s.inventory.masterKey?'¡Atrapado! Abre la puerta principal con la llave maestra y sal con Louis.':'¡Atrapado! La llave maestra abre la puerta principal.',8);
   return;
  }
  if(act==='mouse'){phone.close();lockMouse();return;}
  if(act.startsWith('piano:')){playPiano(Number(act.slice(6)));return;}
  if(act==='skip-intro'){if(cinematic)finishWindowIntro();return;}
  if(act==='pause'){togglePause();return;}
  if(act==='resume'){paused=false;modalClose();sound.resume();return;}
  if((!ready||cinematic||contextLost)&&act!=='start')return;
  if(act==='close'){paused=false;modalClose();if(!isPaused())sound.resume();return;}
  if(act==='start'){intro=false;modalClose();ready=true;
   void sound.start().then(ok=>{if(!active)return;if(isPaused()&&!cinematic)sound.pause();if(!ok)say('Activa el sonido en Ajustes');});
   const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
    if(!resumed&&!scenario){
     if(shouldPlayWindowIntro({demo,trial:config.trial,checkpoint,reducedMotion:reduce}))beginWindowIntro();
     else if(demo&&checkpoint==='ground')finishWindowIntro();
    }
   try{screen.orientation?.lock?.('landscape').catch(()=>{});}catch{}return;}
  if(act==='recharge'){recharge();return;}
  if(act.startsWith('safe:')){safeAction(act.slice(5));return;}
  if(act==='read'){const note=s.inventory.notes.find(n=>n.id===node.dataset.id);if(note?.id==='mirror-note')showMirrorNote('bag');else if(note)showNote(note,'bag');return;}
  if(act==='bag'){
   if(remoteInUse()||captureShot||finalCutscene||poseTransition||modal&&!node?.closest('#lab-dialog'))return;
   phone.close();$('lab-camera-settings').open=false;bag();return;
  }
  if(act==='reset'){
   phone.close();
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
   if(heldNoise)return;
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
  if(act.startsWith('emote:')&&!heldNoise&&inBathroom()&&!notePresentation&&!noteLift){
   const id=act.slice(6);$('house-emotes').hidden=true;
   root.querySelector('[data-act=emotes]').setAttribute('aria-expanded','false');
   if(id==='stop'){cancelEmote();equipmentAge=0;return;}
   if(s.hidden||s.lying||s.crouched){say('Ponte de pie para hacer un emote.');return;}
   const emote=EMOTES.find(e=>e.id===id);
   if(emote&&animator.startEmote(id)){sound.emote(id,emote.duration);resetInput();}
   return;
  }
  if(act==='interact'&&!phone.open&&!finalCutscene){cancelEmote();interact();}
  if(act==='crouch')crouch();
  if(act==='hop'&&canHop()&&hopAge>=HOP_COOLDOWN){hopAge=0;hopCancelled=false;}
  if(act==='flash'||act==='phone')useEquipment();
 }
 function updateControls(){
  const target=closestObject(world,s,focus);focus=target;
  phone.nav.hidden=!!cinematic||!!captureShot||!!finalCutscene||wakeShot()||!!poseTransition||events.phase==='arrival'||events.phase==='car-preview';
  if(!heldNoise&&!isPaused()&&!phone.open&&!s.hidden&&!remoteInUse()&&events.phase!=='arrival'){
   const tool=toolFor(target);
   if(tool&&previousToolTarget!==target&&equipment!==tool)equip(tool,false,true);
   previousToolTarget=tool?target:null;
   const nearLock=tool&&['door','hatch'].includes(target.kind)&&Math.hypot(s.x-target.x,s.z-target.z)<1.45;
   if(!nearLock)autoUseTarget=null;
   else if(autoUseTarget!==target&&equipment===tool&&equipmentAge>.32&&performance.now()-lastInteraction>=260){
    autoUseTarget=target;
    interact();
   }
  }
  root.classList.toggle('house-carrying-noise',!!heldNoise);
  for(const button of phone.visibleSlots())if(button.disabled!==!!heldNoise)button.disabled=!!heldNoise;
  root.classList.toggle('lab-flash-off',!s.flashlight||!!heldNoise);
  $('house-light').hidden=!!heldNoise||equipment!=='flashlight'||!!s.hidden||!!s.lying;
  $('house-use-phone').hidden=!!heldNoise||!['phone','paper','rc'].includes(equipment)||notePresentation||!!noteLift||(equipment!=='phone'&&(!!s.hidden||!!s.lying));
  $('house-use-phone').setAttribute('aria-label',equipment==='rc'?'Usar auto RC':equipment==='paper'?'Observar nota':'Usar teléfono');
  $('house-use-phone').querySelector('small').textContent=equipment==='paper'?'Observar':'Usar';
  const canEmote=!heldNoise&&inBathroom()&&!notePresentation&&!noteLift;
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
   s.inventory.masterKey?'Abre la puerta con la llave maestra':'Recoge la llave maestra junto a Louis':
   world.greyCat.called?'Sigue a la gata gris':'Sal al jardín con Louis';
  const context={world,puzzle,mirrorSafe,events,s,rcTrap,louis};
  if(phone.open&&phone.app==='progress')phone.progress=rescueProgress(context);
  if(demo&&(!scenario||scenario.milestone)){
   const active=objectives.update(context);
   if(active)objective=active.name;
  }
  $('lab-objective').hidden=!!emyCompanion&&!scenario&&emyCompanion.stage==='following';
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
  const showAction=!isSuspended()&&!cinematic&&!emyShot&&!phone.open&&!remoteInUse()&&!finalCutscene&&!wakeShot()&&!['arrival','car-preview','safe','failed'].includes(events.phase);
  const throwing=!!heldNoise&&!s.hidden&&!s.lying;
  const hatchMoving=target?.kind==='hatch'&&target.amount!==Number(target.open);
  const canInteract=showAction&&!poseTransition&&(throwing||s.hidden||s.lying||!!target&&!target.motion&&!hatchMoving);
  interactButton.hidden=!showAction;
  interactButton.disabled=!canInteract;
  const vent=world.studyVent;
  const catAction=emyShot||vent.unlatched&&vent.coverAmount<1||['leap-in','crawl','leap-out'].includes(emyCompanion?.fetch?.phase);
  root.classList.toggle('house-emy-action',!!catAction&&!isSuspended()&&!phone.open);
  root.querySelector('.lab-cross').classList.toggle('lab-target',canInteract);
  let action=throwing?'Lanzar':s.hidden||s.lying?interactionLabel(null):target?.kind==='emy-cat'?'Acciones de Emy':target?.kind==='noise-prop'?'Recoger objeto':interactionLabel(target);
  if(poseTransition)action=poseTransition.entering?'Entrando…':'Saliendo…';
  else if(!throwing&&!s.hidden&&!s.lying&&(target?.motion||hatchMoving))action=target.state==='opening'||hatchMoving&&target.open?'Abriendo…':'Cerrando…';
  const actionLabel=interactButton.querySelector('small');
  if(actionLabel.textContent!==action)actionLabel.textContent=action;
  const focusLabel='';
  if($('lab-focus').textContent!==focusLabel)$('lab-focus').textContent=focusLabel;
  const remote=rc?.mode==='driving';
  const deploying=rc?.mode==='deploying';
  $('house-rc-hud').hidden=!remote;
  if(!remote)rcViewSmoothed=null;
  if(remote){
   const status=rc.noise>0?'📣 Señuelo activo · '+Math.ceil(rc.noise)+' s':'📶 Señal estable · '+Math.round(Math.abs(rc.velocity)*10)/10+' m/s';
   if($('house-rc-status').textContent!==status)$('house-rc-status').textContent=status;
   const help=rcControlHint(!desktop.matches,rc.noise,canTrapPursuer(pursuer,world.hatch,rcTrap.armed));
   if($('house-rc-hint').textContent!==help)$('house-rc-hint').textContent=help;
   $('rc-trap-button').hidden=!canTrapPursuer(pursuer,world.hatch,rcTrap.armed);
   interactButton.hidden=true;
  }
  const announce=deploying||louis&&(['untying','climb','hide'].includes(louis.phase)||(louis.phase==='hidden'&&louis.age<1.6))||!!finalCutscene;
  $('house-rc-caption').hidden=!announce;
  if(announce)$('house-rc-caption').textContent=finalCutscene?(finalCutscene.elapsed<1.5?'¡El secuestrador descubre a Kitty!':finalCutscene.elapsed<3.3?'¡Emy salta para salvarla!':'¡Corred hacia el jardín!'):louis?.phase==='untying'?'Kitty desata las cuerdas mientras Louis espera en silencio…':louis?.phase==='hidden'?'Louis se agacha tras la barra americana y mira alrededor…':louis&&['climb','hide'].includes(louis.phase)?'Louis sube del sótano y busca refugio tras la barra americana…':rc.elapsed<.53?'Colocando el autito…':'Conectando la tablet…';
  root.classList.toggle('house-rc-deploying',deploying);
  root.classList.toggle('house-rc-driving',remote);
  interactButton.classList.toggle('lab-available',canInteract);
  $('lab-hop').hidden=!showAction;
  $('lab-hop').disabled=!canHop()||hopAge<HOP_COOLDOWN;
  $('lab-crouch').classList.toggle('lab-available',s.crouched);
  $('lab-crouch').setAttribute('aria-pressed',String(s.crouched));$('lab-crouch').setAttribute('aria-label',s.crouched?'Levantarse':'Agacharse');$('lab-crouch').querySelector('small').textContent=s.crouched?'Levantar':'Agachar';
  if(config.trial&&$('lab-camera-settings').open)$('lab-metrics').textContent=`${fps} FPS · ${ctxRoom(s)} · altura ${s.y.toFixed(1)} m · rumbo ${Math.round((s.yaw*180/Math.PI%360+360)%360)}°`;
 }
 function interactionLabel(target){
  if(s.hidden)return 'Salir del escondite';
  if(s.lying)return 'Levantarse';
  if(!target)return 'Interactuar';
  if(target===world.pianoSheet)return 'Recoger partitura';
  switch(target.kind){
   case 'door':return target.id==='entrada'&&target.sealed&&events.phase==='escape'?'Abrir con llave maestra':target.open?'Cerrar puerta':'Abrir puerta';
   case 'screwdriver':return 'Recoger destornillador';
   case 'vent':return !target.unlatched?(s.inventory.screwdriver?'Desatornillar rejilla':'Examinar tornillos'):target.coverAmount<1?'Retirando la tapa…':'Enviar a Emy al conducto';
   case 'drawer':return target.open?'Cerrar cajón':'Abrir cajón';
   case 'key':return target.master?'Recoger llave maestra':'Recoger llave';
   case 'note':return 'Leer nota';
   case 'rescue':return 'Liberar a Louis';
   case 'hide':return target.requiresCrouch&&!s.crouched?'Agáchate primero':target.label;
   case 'battery':return 'Recoger pila';
   case 'flashlight':return 'Recoger linterna';
   case 'piano':return target.solved?'Practicar pieza completa':'Tocar el piano';
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
  if(hatch.amount!==hatchTarget&&(!hatch.open||!emyOccupiesHatch(emyCompanion))){
   poseHatch(hatch,reducedMotion.matches?hatchTarget:clamp(hatch.amount+Math.sign(hatchTarget-hatch.amount)*dt/.64,0,1));
  }
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
  // Movement intent is analogue and frame-rate independent. The room geometry,
  // stairs and collision checks still run through the original swept navigator.
  const movementLocked=!!(s.hidden||s.lying||phone.open||events.phase==='arrival'||events.phase==='safe'||events.phase==='failed');
  const intent=movementLocked?{forward:0,side:0}:advanceMoveIntent(velocity,forward,side,dt);
  velocity.forward=intent.forward;velocity.side=intent.side;
  const wantsSprint=joystick.sprint||keys.has('ShiftLeft')||keys.has('ShiftRight');
  if(!wantsSprint)s.exhausted=false;
  const steepSteps=isOnStairs(s,getStairDirection,inHatch);
  const sprint=wantsSprint&&length>.08&&!steepSteps&&!s.crouched&&!s.exhausted&&s.stamina>0;
  const targetSpeed=s.crouched?KITTY_SPEED.crouch:steepSteps?KITTY_SPEED.stairs:sprint?KITTY_SPEED.run:KITTY_SPEED.walk;
  velocity.speed=advanceMoveSpeed(velocity.speed,targetSpeed,dt);
  // Entering stairs or a crawlspace is safety-critical: clamp immediately.
  // Leaving them can accelerate smoothly without a dangerous speed burst.
  if(steepSteps||s.crouched)velocity.speed=Math.min(velocity.speed,targetSpeed);
  const dx=(Math.sin(s.yaw)*intent.forward+Math.cos(s.yaw)*intent.side)*velocity.speed*dt;
  const dz=(Math.cos(s.yaw)*intent.forward-Math.sin(s.yaw)*intent.side)*velocity.speed*dt;
  const body=s.crouched?1.04:1.64;
  const moved=movementLocked?0:navigate(s,world,dx,dz,body);
  s.cameraGround=reducedMotion.matches?s.y:advanceCameraFloor(s.cameraGround,s.y,dt);
  if(events.phase==='escape'&&!world.objects.find(o=>o.id==='entrada').sealed&&louis?.phase==='follow'&&s.z>12.35&&s.x>4.6&&s.x<7.2){
   const ground=0,walk=2.70;
   finalCutscene={elapsed:0,cues:new Set(),
    kitty:{from:{x:s.x,z:s.z},to:{x:5.56,z:14.05},ground,walk,stand:0},
    louis:{from:{x:clamp(s.x+.36,5.35,6.45),z:s.z-.19},to:{x:6.23,z:13.95},ground,walk,stand:0},
    louisStride:louis.walk};
   world.emy.hidden=true;for(const {box} of world.emy.parts)box.hiddenGeometry=true;
   renderer.updateVisibility();events.phase='ending';resetInput();
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
  s.eye=advanceEye(s.eye,s.crouched,dt);
  if(moved>.0001)s.bob+=moved*(s.crouched?5:8);
  for(const cue of floorSounds.advance(dt,s,moved))play(cue.kind,cue.origin?{...cue.origin,y:cue.origin.y+.25}:null,cue.level);
 }
 let statsAt=performance.now(),frameCount=0,slowSeconds=0;
 function showLives(lives){
  const notice=$('house-lives');
  notice.querySelector('.life-slots').innerHTML=lifeSlots(lives);
  notice.querySelector('strong').textContent=lives===1?(s.emyRescueUsed?'¡Última vida! Emy te salvó':'Te queda una vida'):lives===0?'0 vidas · Emy, ¡ayuda!':'Te quedan '+lives+' vidas';
  notice.hidden=false;lifeNoticeLeft=LIFE_NOTICE_SECONDS;
 }
 function beginCapture(){
  if(captureShot)return;
  // Save the debit immediately so reloading during the cinematic cannot undo it.
  const loss=captureLoss(s.lives,lastSafeCheckpoint,pursuer.witnessed,s.emyRescueUsed);
  s.lives=loss.lives;s.emyRescueUsed=loss.emyRescueUsed;lastSafeCheckpoint=loss.checkpoint;
  checkpointStore?.save(loss.checkpoint);
  const from=cameraOf(s);
  const hiding=world.objects.find(object=>object.id===(s.hidden?.objectId||poseTransition?.object.id));
  if(hiding?.wardrobeLeaves){poseFurniture(hiding,1);renderer.updateVisibility();}
  captureShot={from,loss,actor:pursuer.snapshot(),elapsed:0,timing:captureTiming(captureCount++),
   constrain:capturePath(world.boxes,from),lamp:flashlightBeam(),
   kitty:{x:s.x,y:s.y,z:s.z,yaw:s.yaw},attacker:{...pursuer.snapshot()}};
  phone.close();releaseMouse();resetInput();sound.stopEmote();
  $('house-emotes').hidden=true;
  $('lab-camera-settings').open=false;
  sound.carEngine(null);sound.rcMotor(0);
  $('capture-loss').hidden=true;captureLayer.style.removeProperty('--capture-dark');
  captureLayer.hidden=false;root.classList.add('house-capture-active');
  captureCaption.textContent=options.captions!==false?(loss.emyRescue?'[Emy escucha el peligro y corre hacia Kitty]':'[El secuestrador te agarra]'):'';
  sound.setCaptureQuiet(!loss.emyRescue);
  if(!loss.emyRescue)sound.captureCue('capture-grab');
  else showLives(0);
 }
 function renderEmyLastChance(delta){
  const shot=captureShot,previous=shot.elapsed;
  if(captureRunning())shot.elapsed+=delta;
  if(poseEmyLastChance(shot,world.emy,pursuer,reducedMotion.matches))renderer.updateVisibility();
  if(previous<.55&&shot.elapsed>=.55){
   play('cat',null,1.4);
   if(options.captions!==false)captureCaption.textContent='[¡Emy salta para alejar al secuestrador!]';
  }
  if(previous<1.45&&shot.elapsed>=1.45)play('cloth',null,.9);
  const marker=Math.min(1,Math.max(0,(shot.elapsed-1.55)/.65));
  captureLayer.style.setProperty('--capture-edge',String(.17+.08*marker));
  captureLayer.style.setProperty('--capture-dark','0');
  // Side-on master shot: Kitty, the attacking Emy and the pursuer in-frame.
  // Check walls and floor; never send the spectator camera into a cabinet.
  const subject={x:(shot.kitty.x+pursuer.x)/2,y:shot.kitty.y+1.0,z:(shot.kitty.z+pursuer.z)/2};
  const optionsCamera=[
   {x:shot.kitty.x+2.4,y:shot.kitty.y+2.05,z:shot.kitty.z+2.5},
   {x:shot.kitty.x-2.4,y:shot.kitty.y+2.05,z:shot.kitty.z+2.5},
   {x:shot.kitty.x+2.1,y:shot.kitty.y+2.05,z:shot.kitty.z-2.5},
   {x:shot.kitty.x-2.1,y:shot.kitty.y+2.05,z:shot.kitty.z-2.5}
  ];
  const safe=optionsCamera.find(c=>!blocked(world.boxes,c.x,c.y-.2,c.z,.16,.2)&&
   !lineBlocked(world.boxes,c,subject));
  const camera=safe||shot.from,dx=subject.x-camera.x,dz=subject.z-camera.z;
  const view={...camera,yaw:Math.atan2(dx,dz),pitch:Math.atan2(subject.y-camera.y,Math.max(.1,Math.hypot(dx,dz)))};
  try{
   renderer.render(view,0,elapsed+shot.elapsed,false,{
    reduced:reducedMotion.matches,shotLight:.34,pursuer:pursuer.snapshot(),
    thirdPerson:{x:shot.kitty.x,y:shot.kitty.y,z:shot.kitty.z,
     yaw:shot.kitty.yaw,walk:0,speed:0},television});
  }catch(error){interruptGraphics('Error en el rescate de Emy',String(error.message||error));return;}
  if(shot.elapsed<3.35)return;
  const restore=shot.loss.checkpoint,messages=events.messages;
  captureShot=null;captureLayer.hidden=true;$('capture-loss').hidden=true;
  root.classList.remove('house-capture-active');
  sound.setCaptureQuiet(false);
  reset(restore);events.messages=messages;
  if(pursuer.active)pursuer.cooldown();
  saveCheckpoint();showLives(1);
  say('¡Emy te ha salvado! Te regaló una última oportunidad. Escapa con Louis.',6);
  last=performance.now();
 }
 function renderCapture(delta){
  if(captureShot?.loss.emyRescue){renderEmyLastChance(delta);return;}
  const shot=captureShot,previous=shot.elapsed,timing=shot.timing;
  if(captureRunning())shot.elapsed+=delta;
  if(shot.elapsed>=timing.end){
   const {lives,checkpoint:restore}=shot.loss;
   const defeat=$('capture-loss');
   if(defeat.hidden){
    defeat.querySelector('p').textContent=lives?'Volverás al último punto seguro.':'Final alternativo · esta vez Emy ya no pudo salvarte.';
    defeat.hidden=false;captureLayer.style.setProperty('--capture-dark','1');
    captureCaption.textContent='';
    if(!lives)showLives(0);
   }
   if(shot.elapsed<timing.end+(lives?1.35:LIFE_NOTICE_SECONDS))return;
   captureShot=null;captureLayer.hidden=true;defeat.hidden=true;root.classList.remove('house-capture-active');
   sound.setCaptureQuiet(false);
   if(lives){
    const messages=events.messages;
    reset(restore);events.messages=messages;
    if(['patrol','hunt'].includes(events.phase))pursuer.cooldown();
    saveCheckpoint();showLives(lives);
   }else{
    // Genuine second ending; do NOT auto-restart or erase the story decision.
    events.phase='failed';s.emyRescueUsed=true;
    checkpointStore?.save(null);
    showModal('Final 2 · La casa se queda en silencio',
     '<p>Kitty agotó sus oportunidades. Emy ya la había rescatado una vez, pero esta vez el secuestrador la atrapó.</p><p>Louis sigue esperando. Puedes comenzar de nuevo para cambiar el desenlace.</p>',
     [['Volver a intentarlo desde el principio','reset'],['Salir','exit']]);
   }
   last=performance.now();
   return;
  }
  const reduced=reducedMotion.matches;
  const shotFrame=captureFrame(shot.from,shot.actor,shot.elapsed,reduced,timing,shot.constrain);
  const style=captureLayer.style;
  style.setProperty('--capture-edge',.49+shotFrame.peripheral);
  style.setProperty('--capture-falloff',`${92-38*shotFrame.peripheral}%`);
  style.setProperty('--capture-dark',shotFrame.dark);
  const crossed=time=>previous<time&&shot.elapsed>=time;
  if(timing.pulses.some(crossed))sound.captureCue('capture-pulse');
  if(crossed(timing.breath)){
   sound.captureCue('capture-breath',timing.firstSide*.49);
   if(options.captions!==false)captureCaption.textContent='[Respira muy cerca]';
  }
  if(crossed(timing.tear))sound.captureCue('capture-tear',.32);
  if(crossed(timing.reveal)){
   sound.captureCue('capture-reveal',.12);
   if(options.captions!==false)captureCaption.textContent='[Alarido]';
  }
  if(crossed(timing.grab)){
   sound.captureCue('capture-snare',timing.firstSide*.42);
   sound.setCaptureQuiet(true,true);
   if(options.captions!==false)captureCaption.textContent='[Las patas se cierran sobre ti]';
  }
  if(crossed(timing.lock))sound.captureCue('capture-tug',-timing.firstSide*.38);
  if(crossed(timing.bite)){
   sound.captureCue('capture-bite');
   captureCaption.textContent='';
  }
  if(crossed(timing.swallow))sound.captureCue('capture-swallow');
  if(shotFrame.dark===1)return;
  try{
   renderer.render(shotFrame.camera,shot.lamp?shotFrame.lamp:0,elapsed+shot.elapsed,false,{shotLight:shotFrame.roomLight,
    pursuerLight:shotFrame.light,pursuerKey:shotFrame.key,captureProjection:shotFrame.projection,
    reduced,pursuer:shotFrame.actor,grasp:shotFrame.grasp,television});
  }catch(e){interruptGraphics('Error de renderizado',String(e.message||e));}
 }
 function updateStory(delta){
  if(!demo||isSuspended()||cinematic||emyShot||finalCutscene)return;
  if(events.phase==='car-preview'){
   events.time+=delta;poseArrivalCar(world.car,clamp(events.time/CAR_ARRIVAL_SECONDS,0,1));
   if(world.car.progress===1){events.phase='explore';say('Auto estacionado');}
   return;
  }
  if(scenario&&!scenario.milestone&&scenario.events!=='arrival'&&scenario.events!=='wake')return;
  const finalPhase=['rc-rescue','rc-setup','escape','ending'].includes(events.phase);
  if(config.entry==='rescue'&&!finalPhase)return;
  const power=world.lights.power;
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
   const deferredDoorSounds=[];
   const pursuitSignals=pursuer.update(Math.min(.055,delta),{x:s.x,y:s.y,z:s.z,crouched:s.crouched,flashlight:flashlightBeam(),dark:!housePowered(power),hidden:!!s.hidden&&!poseTransition,entering:!!poseTransition?.entering,hideId:hiding?.id,hideExit:hiding?{x:poseTransition?.outside.x??s.hidden?.returnX??hiding.returnX,y:s.y,z:poseTransition?.outside.z??s.hidden?.returnZ??hiding.returnZ}:null},door=>{if(door.id!=='entrada'&&!door.sealed&&!door.locked&&!door.motion&&sweepClear(door,door.amount,1,pursuer)){const result=animateFurniture(door,true,{player:s,reducedMotion:reducedMotion.matches});if(result.started)deferredDoorSounds.push(door);}},decoy);
   // Priority: start the loud chase warning BEFORE any footstep, door, UI or capture cue.
   if(pursuitSignals.includes('spotted')){sound.playDangerAlert();phone.close();}
   for(const door of deferredDoorSounds)play('door-open',door);
   for(const signal of pursuitSignals){
    if(signal==='cut-power'&&power.on){toggleHousePower(world.lights.meter);play('power-cut',world.lights.meter);saveCheckpoint();}
    if(signal==='caught'&&['evaded','rc-setup'].includes(events.phase)){events.phase='failed';beginCapture();return;}
    if(signal==='step')play(pursuer.y>.1&&pursuer.y<HEIGHT-.1?'stair':'wood',pursuer,.8);
    if(signal==='stood')play('wood',pursuer,.9);
    if(signal==='rc-hit'){
     const pos=crashRC(rc,world);s.inventory.rc=false;equipment='empty';
     phone.setInventory(s.inventory);phone.equip('empty');resetInput();rebuild();
     play('alert',pursuer,1.1);
     say('El secuestrador golpeó el auto. Se perdió la señal; lo dejó en otro lugar de la casa ('+Math.round(pos.x)+', '+Math.round(pos.z)+'). Ve a recuperarlo.',7);
    }
    if(signal==='investigate'&&emyCompanion?.stage!=='following')say('Notó movimiento. Busca cobertura.',2.5);
    if(signal==='spotted'&&emyCompanion?.stage!=='following')say('Te vio. Gira una esquina para perderlo.',3);
    if(signal==='lost'&&emyCompanion?.stage!=='following')say('Perdió de vista a Kitty y revisará la última zona. Sigue escondida.',3);
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
   if(cue==='wake'){
    phone.close();resetInput();pursuer.wake();sound.sequence('notification',true);sound.setThreat(true);
    say('¡El mensaje lo despertó!',3);
   }
   if(cue==='hunt'){pursuer.resumeSearch();saveCheckpoint();}
   if(cue==='evaded'){pursuer.settleUpstairs();sound.setThreat(false);sound.sequence('notification');saveCheckpoint();say('Se alejó. Ya puedes examinar la nota del dormitorio con calma.',5);}
   if(cue==='failed'&&pursuer.caught){beginCapture();return;}
   if(cue==='safe'||cue==='failed'){phone.close();resetInput();play('alert',pursuer,.55);showModal(cue==='safe'?'Estás a salvo':'Te descubrieron',cue==='safe'?'<p>Te quedas en silencio.</p>':'<p>El perseguidor te alcanzó o vio dónde te escondías.</p><p>Retomas desde el último momento seguro con la llave y las pistas.</p>',cue==='safe'?[[exitLabel,'exit']]:[['Reintentar','retry-arrival'],['Salir','exit']]);}
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
  if(hopAge<HOP_COOLDOWN){
   const hop=advanceHop(hopAge,hopCancelled,isSuspended()?0:shotDelta,canHop());
   hopAge=hop.age;hopCancelled=hop.cancelled;
  }
  updateHiding(dt);
  if(lifeNoticeLeft>0&&!captureShot){
   if(!isSuspended())lifeNoticeLeft=Math.max(0,lifeNoticeLeft-shotDelta);
   if(!lifeNoticeLeft)$('house-lives').hidden=true;
  }
  // Let Kitty get her bearings after respawning before resuming the patrol.
  if(!lifeNoticeLeft)updateStory(shotDelta);
  if(captureShot){torchMarker.hidden=true;renderCapture(shotDelta);return;}
  if(!isSuspended()&&!finalCutscene){
   advanceVentCover(world.studyVent,shotDelta);
   if(world.studyVent.coverAmount===1&&s.inventory.screwdriver){
    s.inventory.screwdriver=false;
    if(equipment==='screwdriver')equip('empty');
    phone.setInventory(s.inventory);
   }
   if(emyShot||poseTransition)updateFurniture(world.objects,shotDelta,s);
   const wasHidden=world.emy.hidden;
   if(emyCompanion){
    const enteringHide=poseTransition?.entering?{objectId:poseTransition.object.id,returnX:poseTransition.outside.x,returnZ:poseTransition.outside.z}:null;
    updateEmySenses(emyCompanion,s,world,pursuer,objectives.active,shotDelta,flashlightBeam());
    const cue=updateEmyCompanion(emyCompanion,emyShot&&reducedMotion.matches?shotDelta*3:shotDelta,{world,player:s,enteringHide,reduced:reducedMotion.matches,finale:world.greyCat.active,threat:pursuer,distractCooldown:emyAbilities.distractCooldown});
    if(cue==='scratch')play('scratch',world.emy,.8);
    if(cue==='distract-noise'){
     play('cat',world.emy,.95);caption('Emy está maullando para distraer al secuestrador');
     pursuer.hearNoise({x:world.emy.x,y:world.emy.y,z:world.emy.z},1.5);
    }
    if(cue==='distract-rest')say('Emy terminó la distracción. Descansará hasta que se recargue su habilidad.',4);
    if(cue==='distract-done')say(s.hidden||enteringHide?'Emy terminó y se mantiene a cubierto.':'Emy vuelve contigo.',4);
    if(cue==='distract-failed'){emyAbilities.distractCooldown=0;say('Emy no logró llegar. Puedes intentarlo de nuevo.',4);}
    if(cue==='delivered'){
     world.objects.find(o=>o.id==='key').taken=true;
     puzzle={...puzzle,key:true};s.inventory.key=true;equip('key',false,true);handAction=1;
     phone.setInventory(s.inventory);renderer.updateVisibility();play('pickup',world.emy);say('Emy te entrega la llave con lazo.');saveCheckpoint();
    }
    if(cue==='jump'&&emyShot&&!emyShot.jumped){emyShot.jumped=true;play('cat',world.emy,.6);play('cloth',world.entryWindow.box,.45);}
    if(cue==='touchdown')play('land',world.emy,.45);
    if(cue==='landed'&&emyShot)finishEmyShot();
    if(cue==='entering-trunk'&&s.hidden?.objectId!=='hide-trunk')poseTrunk(world.objects.find(o=>o.id==='hide-trunk').lid,emyCompanion.lidAmount);
    if(cue==='trunk'){
     poseTrunk(world.objects.find(o=>o.id==='hide-trunk').lid,0);
     say('Emy se ocultó en el baúl. Se quedará allí en silencio.',4);saveCheckpoint();
    }
   }else updateUpstairsEmy(world.emy,shotDelta,{player:s,reduced:reducedMotion.matches,
    hidden:world.greyCat.active,blocked:(x,y,z,r,h)=>blocked(world.boxes,x,y,z,r,h)});
   syncEmyInteraction();
   const cat=world.emy;
    // Refresh only on opening; game time is paused during the dialog.
   if(wasHidden!==cat.hidden)renderer.updateVisibility();
  }

  if(!isPaused()){
   advanceEmyAbilities(emyAbilities,shotDelta);
   if(heldNoise)holdNoiseProp(heldNoise,cameraOf(s));
   for(const noiseCue of stepNoiseProps(noiseProps,shotDelta,world,pursuer,world.emy)){
    if(noiseCue.kind==='stun'){play('clatter',noiseCue.at,noiseCue.level);say('¡Impacto! El secuestrador quedó aturdido unos segundos.',3);}
    else if(noiseCue.kind==='evade'){play('cat',world.emy,.6);say('¡Emy esquivó el objeto!',2.5);}
    else if(noiseCue.kind==='impact'){play('clatter',noiseCue.at,noiseCue.level);caption('Un objeto cayó e hizo ruido.');}
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
  }else if(emyShot){
   emyShot.elapsed=emyCompanion.entranceAge;
   view=emyEntranceCamera(emyShot.camera,emyShot.elapsed/EMY_ENTRANCE_SECONDS,reducedMotion.matches,world.emy);
   hand=false;torch=false;
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
  const pet=world.emy;
  if(pet.reaction>0&&(distance>.012||s.sprinting||pursuer.mode==='chase'||pet.alarm>.55||s.hidden||remoteInUse()))pet.reaction=0;
  if(pet.reaction>0&&!pet.hidden&&!s.hidden&&!poseTransition&&!phone.open&&!emyShot&&!cinematic&&!piano&&!finalCutscene&&!isSuspended()&&Math.abs(s.y-pet.y)<.45&&Math.hypot(s.x-pet.x,s.z-pet.z)<1.5){
   const age=3.4-pet.reaction;
   const reach=Math.min(1,age/.34,pet.reaction/.34);
   const stroke=(1-Math.cos(age*Math.PI*2))*.5;
   // Render-only crouch and gentle downward glance. Movement, collision,
   // pursuer perception and the saved player pose remain unchanged.
   if(!reducedMotion.matches){
    const lowered=view.y-.44*reach,dx=pet.x-view.x,dz=pet.z-view.z;
    const aim=Math.atan2(pet.y+.48-lowered,Math.max(.25,Math.hypot(dx,dz)));
    const yaw=Math.atan2(dx,dz),turn=Math.atan2(Math.sin(yaw-view.yaw),Math.cos(yaw-view.yaw));
    view={...view,y:lowered,yaw:view.yaw+turn*.32*reach,pitch:view.pitch+(aim-view.pitch)*.42*reach};
   }
   const startX=view.x+.18*Math.cos(view.yaw),startZ=view.z-.18*Math.sin(view.yaw);
   const contact=pet.landmarks.head;
   const along=contact[2]+.08-stroke*.15;
   introHands=[null,{x:startX+(pet.x+Math.sin(pet.yaw)*along-startX)*reach,
    y:view.y-.32+(pet.y+contact[1]+.12-view.y+.32)*reach,
    z:startZ+(pet.z+Math.cos(pet.yaw)*along-startZ)*reach,flex:-.25,curl:.18}];
   hand=false;
  }
  if(intro&&demo&&checkpoint==='ground'&&!scenario){view=windowIntroCamera(0);hand=false;torch=false;}
  if(!isPaused())placePianoScore();
  const instrument=world.piano;
  if(instrument.solved&&instrument.compartmentAmount<1&&!paused)
   posePianoCompartment(instrument,reducedMotion.matches?1:Math.min(1,instrument.compartmentAmount+shotDelta/.48));
  let thirdPerson=null,actorTime,actorWalk,actorPiano,shotLight=0;
  if(piano){
   const standing=piano.advance(now,pianoRunning(),reducedMotion.matches);
   if(standing){
    const y=piano.object.floor;
    if(!blocked(world.boxes,standing.x,y,standing.z,.2,1.69)){
     Object.assign(s,{x:standing.x,y,z:standing.z,yaw:standing.yaw,pitch:standing.pitch,eye:1.63,crouched:false});
    }
    modalClose();
    focus=closestObject(world,s);
    view=cameraOf(s);
   }else{
    const pose=piano.pose(reducedMotion.matches);
    view=pose.view;hand=false;torch=false;shotLight=.40;
    if(pose.actor){
     thirdPerson=piano.object.seat;
     actorPiano={instrument:piano.object,hands:pose.hands};actorTime=piano.sourceTime;
    }else if(!pose.hideHands)introHands=pose.hands;
   }
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
   rcViewSmoothed=advanceRCCamera(rcViewSmoothed,rcCamera(rc,world),dt,reducedMotion.matches);
    view=rcViewSmoothed;hand=false;torch=true;shotLight=rc.y<0?.23:.08;
  }
  if(finalCutscene){
   const previousFinale=finalCutscene.elapsed;
   if(!isSuspended())finalCutscene.elapsed+=shotDelta;
   for(const cue of collectCinematicCues('escape',previousFinale,finalCutscene.elapsed,finalCutscene.cues)){
    const source=cue.source==='pursuer'?pursuer:cue.source==='emy'?world.emy:
     cue.source==='kitty'?s:null;
    play(cue.sound,source,cue.level);
    caption(cue.caption);
   }
   // Three deliberate cinematic beats instead of one fixed camera:
   // the pursuer approaches Kitty, Emy leaps in from the side, then they run.
   const time=finalCutscene.elapsed,escapeTime=Math.max(0,time-3.48);
   const t=Math.min(1,escapeTime/4.3),showChase=time>=3.35;
   if(poseEscapeAmbush(finalCutscene,world.emy,pursuer,reducedMotion.matches))renderer.updateVisibility();
   actorWalk=wardrobeWalk(escapeTime,finalCutscene.kitty);
   const companion=wardrobeWalk(Math.max(0,escapeTime-.18),finalCutscene.louis);
   if(reducedMotion.matches)actorWalk.stride=0;
   Object.assign(louis,{x:companion.x,y:0,z:companion.z,yaw:companion.yaw,
    walk:finalCutscene.louisStride+companion.distance,speed:companion.stride*.88});
   // Keep the camera OUTSIDE the south wall and aim at the actors'
   // current positions, not at a constant point below the front porch.
   const attacker=t<.5?pursuer:world.emy;
   const focus={
    x:showChase?(actorWalk.x+louis.x+world.emy.x)/3:(finalCutscene.kitty.from.x+attacker.x)/2,
    y:showChase?1.00:1.23,
    z:showChase?(actorWalk.z+louis.z+world.emy.z)/3:
     (finalCutscene.kitty.from.z+attacker.z)/2
   };
   const close=time<1.55,attack=time>=1.55&&time<3.35;
   const x=close?8.10:attack?8.15:7.80-Math.sin(t*Math.PI)*.35;
   const y=close?2.13:attack?2.29:2.27;
   const z=close?16.40:attack?15.92:16.65+1.0*t;
   const dx=focus.x-x,dz=focus.z-z;
   view={x,y,z,yaw:Math.atan2(dx,dz),
    pitch:Math.atan2(focus.y-y,Math.max(.1,Math.hypot(dx,dz)))};
   thirdPerson=actorWalk;hand=false;torch=false;shotLight=.45;
   if(time>=7.78&&events.phase==='ending'){
    events.phase='safe';
    showModal('Final 1 · ¡Kitty y Louis escaparon!',
     '<p>El secuestrador intenta alcanzar a Kitty, pero Emy salta para detenerlo. Kitty y Louis aprovechan y escapan por el jardín, juntos.</p><p>Rescate completado · 100%</p>',
     [[config.onRescue?'Ver final':exitLabel,config.onRescue?'finish':'exit']]);
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
  }else if(poseTransition?.walk&&poseTransition.elapsed>0&&poseTransition.entryElapsed<HIDE_SECONDS*.63){
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
  // Render-only hop: the collision body, focus, AI and save coordinates are unchanged.
  if(hopAge<HOP_COOLDOWN&&!hopCancelled&&!thirdPerson&&!carShot&&canHop())view={...view,y:view.y+hopOffset(hopAge,reducedMotion.matches)};
  sound.carEngine(carShot&&!isSuspended()?world.car.progress:null);
  sound.rcMotor(rc?.mode==='driving'&&!isPaused()?rc.velocity:0);
  root.classList.toggle('house-arrival',events.phase==='arrival'||events.phase==='car-preview'||wakeShot()||!!actorWalk);
  root.classList.toggle('house-cutaway',carShot||wakeShot()||!!actorWalk);
  const chasing=pursuer.mode==='chase',
   investigating=['investigate','trail-search','noise-investigate'].includes(pursuer.mode),
   resting=pursuer.mode==='patrol-rest';
  danger.hidden=!['arrival','hide','patrol','hunt'].includes(events.phase)&&!(events.phase==='evaded'&&(chasing||investigating));
  if(emyCompanion?.stage==='following'&&!scenario&&['patrol','hunt','evaded'].includes(events.phase)&&!chasing&&!investigating)danger.hidden=true;
  danger.dataset.level=chasing?'chase':investigating?'watch':'search';
   danger.setAttribute('aria-label',threatAccessibility(danger.dataset.level));
  const arrivalCaption=options.captions!==false&&events.time<CAR_ARRIVAL_SECONDS?'Se acerca un motor':'Alguien intenta entrar';
  const threatText=events.phase==='hide'?'Escóndete · '+Math.ceil(events.remaining)+' s':
   events.phase==='arrival'?arrivalCaption:
   chasing?'Te persigue · rompe la línea de visión':
   pursuer.mode==='trail-search'?'Busca donde te vio por última vez':
   pursuer.mode==='noise-investigate'?'Investiga un ruido cercano':
   investigating?'Sospecha de Kitty · busca cobertura':
   resting?'Se detuvo a descansar':
   pursuer.mode==='cooldown'?'Se aleja · avanza con cuidado':
   s.hidden?'Sigue patrullando · espera a que se aleje':'Está patrullando';
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
  if(keyTurn&&!isPaused()){keyTurn.time+=shotDelta;if(keyTurn.time>=.52)keyTurn=null;}
  const visualEquipment=heldNoise?'empty':keyTurn?keyTurn.kind:raisedNote||equipment==='paper'&&(s.inventory.pendingNote??s.inventory.notes.at(-1))?.id==='mirror-note'?'note':notePresentation?'empty':equipment,noteRaise=noteLift*noteLift*(3-2*noteLift);
  if(roomAt(s.x,s.z,s.y)!=='Sala de estar')world.television.power.on=false;
  television.sync(world.television.power.on&&housePowered(world.lights.power),!isPaused()&&!phone.open);
  if(updateWallClock(world.clock)&&!isPaused()&&Math.hypot(s.x-world.clock.x,s.y,s.z-world.clock.z)<4.5)play('clock-tick',world.clock,.55);
  const torchItem=world.landingTorch;
  torchMarker.hidden=true;
  if(torchItem&&!torchItem.taken&&!s.inventory.torch&&!phone.open&&!isPaused()&&!thirdPerson&&!remoteInUse()&&!s.hidden&&
   Math.hypot(torchItem.x-view.x,torchItem.y-view.y,torchItem.z-view.z)<3&&
   !lineBlocked(world.boxes,view,torchItem)){
   const dx=torchItem.x-view.x,dy=torchItem.y-view.y,dz=torchItem.z-view.z;
   const flat=dx*Math.sin(view.yaw)+dz*Math.cos(view.yaw);
   const depth=flat*Math.cos(view.pitch)+dy*Math.sin(view.pitch);
   if(depth>.12){
    const scale=.65*canvas.clientHeight/depth;
    const x=canvas.clientWidth/2+(dx*Math.cos(view.yaw)-dz*Math.sin(view.yaw))*scale;
    const y=canvas.clientHeight/2-(dy*Math.cos(view.pitch)-flat*Math.sin(view.pitch))*scale;
    if(x>0&&x<canvas.clientWidth&&y>0&&y<canvas.clientHeight){
     torchMarker.hidden=false;Object.assign(torchMarker.style,{left:x+'px',top:y+'px',width:clamp(.3*scale,15,50)+'px'});
    }
   }
  }
  // A projected glow points at the real interaction object. In the study,
  // the objective graph goes DRAWER → SCREWDRIVER → FOUR VENT SCREWS.
  // Never make an inaccessible object look clickable: respect taken and
  // concealed states, camera facing and visibility through closed doors.
  const nameTag=$('house-emy-name'),catTarget=world.emyInteraction;
  const canShowName=!isPaused()&&!phone.open&&!heldNoise&&!finalCutscene&&!thirdPerson&&!carShot&&!loisShotDirector&&!remoteInUse();
  const lookingAtEmy=canShowName&&catTarget?.interactable&&Math.hypot(s.x-catTarget.x,s.z-catTarget.z)<=2.45&&closestObject(world,s,focus)===catTarget;
  const showName=advanceEmyNameCue(emyNameCue,shotDelta,!!lookingAtEmy,!isPaused(),canShowName);
  let nameVisible=false;
  if(showName){
   const dx=catTarget.x-view.x,dy=catTarget.y+.28-view.y,dz=catTarget.z-view.z;
   const fwd=dx*Math.sin(view.yaw)+dz*Math.cos(view.yaw),side=dx*Math.cos(view.yaw)-dz*Math.sin(view.yaw);
   const depth=fwd*Math.cos(view.pitch)+dy*Math.sin(view.pitch);
   if(depth>.15){const scale=.65*canvas.clientHeight/depth,px=canvas.clientWidth/2+side*scale,py=canvas.clientHeight/2-(dy*Math.cos(view.pitch)-fwd*Math.sin(view.pitch))*scale;
    if(px>0&&px<canvas.clientWidth&&py>0&&py<canvas.clientHeight){nameVisible=true;nameTag.style.left=px+'px';nameTag.style.top=py+'px';}
   }
  }
  if(nameTag.hidden===nameVisible)nameTag.hidden=!nameVisible;
  const sparkle=$('house-interest');
  const candidate=!isPaused()&&!phone.open&&!cinematic&&!finalCutscene?
   (focus?.interactable&&!focus.taken&&!focus.concealed?focus:objectives.active?.target):null;
  if(candidate&&candidate.kind!=='emy-cat'&&!(candidate===torchItem&&!torchMarker.hidden)&&candidate.interactable!==false&&!candidate.taken&&!candidate.concealed&&
   Math.abs((candidate.floor??candidate.y??0)-s.y)<2.3){
   const dx=candidate.x-view.x,dy=(candidate.y??s.y)+.16-view.y,dz=candidate.z-view.z;
   const forward=dx*Math.sin(view.yaw)+dz*Math.cos(view.yaw),side=dx*Math.cos(view.yaw)-dz*Math.sin(view.yaw);
   const depth=forward*Math.cos(view.pitch)+dy*Math.sin(view.pitch);
   const dist=Math.hypot(dx,dy,dz);
   const hidden=lineBlocked(world.boxes,view,{x:candidate.x,y:candidate.y??0,z:candidate.z},candidate.kind==='door'?'door-'+candidate.id:'');
   if(depth>.18&&dist<6&&!hidden){
    const factor=.65*canvas.clientHeight/depth;
    const px=canvas.clientWidth/2+side*factor,py=canvas.clientHeight/2-(dy*Math.cos(view.pitch)-forward*Math.sin(view.pitch))*factor;
    if(px>=0&&px<=canvas.clientWidth&&py>=0&&py<=canvas.clientHeight){
     sparkle.hidden=false;
     sparkle.style.left=px+'px';sparkle.style.top=py+'px';
     sparkle.style.setProperty('--interest-scale',String(clamp(1.35/dist,.65,.95)));
     sparkle.dataset.focused=String(candidate===focus&&dist<2.4);
     sparkle.querySelector('span').textContent=candidate.id==='screwdriver'?'DESTORNILLADOR':
      candidate.kind==='vent'?'TORNILLOS':candidate.kind==='drawer'?'ABRIR CAJÓN':'INTERACTUAR';
    }else sparkle.hidden=true;
   }else sparkle.hidden=true;
  }else sparkle.hidden=true;
  // After finding the screwdriver, highlight all four ACTUAL brass screws
  // on the vent mesh, rather than a guessed dot on the wall.
  const screws=world.studyVent.cover.filter(part=>part.box.id.startsWith('vent-cover-screw'));
  const pointScrews=!!s.inventory.screwdriver&&!world.studyVent.unlatched&&
   !isPaused()&&!phone.open&&Math.abs(s.y)<.7&&roomAt(s.x,s.z,s.y)==='Estudio';
  for(const [index,node] of [...root.querySelectorAll('.house-vent-screw-glow')].entries()){
   const screw=screws[index]?.box;
   if(!pointScrews||!screw){node.hidden=true;continue;}
   const dx=screw.x-view.x,dy=screw.y-view.y,dz=screw.z-view.z;
   const fwd=dx*Math.sin(view.yaw)+dz*Math.cos(view.yaw);
   const side=dx*Math.cos(view.yaw)-dz*Math.sin(view.yaw);
   const depth=fwd*Math.cos(view.pitch)+dy*Math.sin(view.pitch);
   const meters=Math.hypot(dx,dy,dz);
   if(depth<=.15||meters>3){node.hidden=true;continue;}
   const factor=.65*canvas.clientHeight/depth;
   const px=canvas.clientWidth/2+side*factor;
   const py=canvas.clientHeight/2-(dy*Math.cos(view.pitch)-fwd*Math.sin(view.pitch))*factor;
   node.hidden=px<0||px>canvas.clientWidth||py<0||py>canvas.clientHeight;
   if(!node.hidden){node.style.left=px+'px';node.style.top=py+'px';}
  }
  const outdoor=s.y<-.12?0:view.x<0||view.x>HOUSE.width||view.z<0||view.z>HOUSE.depth?1:Math.max(0,1-Math.min(view.x,HOUSE.width-view.x,view.z,HOUSE.depth-view.z)/1.5)*.22;
  sound.locate({room:roomAt(view.x,view.z,s.y),outdoor,hidden:!!s.hidden,powered:housePowered(world.lights.power)});
  try{
   const wave=$('house-emy-wave');
   if(emyAbilities.wave>0&&!world.emy.hidden){
    const dx=world.emy.x-view.x,dy=world.emy.y+.43-view.y,dz=world.emy.z-view.z;
    const forward=dx*Math.sin(view.yaw)+dz*Math.cos(view.yaw),side=dx*Math.cos(view.yaw)-dz*Math.sin(view.yaw);
    const depth=forward*Math.cos(view.pitch)+dy*Math.sin(view.pitch);
    if(depth>.15){
     const factor=.65*canvas.clientHeight/depth;
     const radius=(1.1-emyAbilities.wave)*160;
     wave.hidden=false;
     Object.assign(wave.style,{left:(canvas.clientWidth/2+side*factor)+'px',top:(canvas.clientHeight/2-(dy*Math.cos(view.pitch)-forward*Math.sin(view.pitch))*factor)+'px',width:Math.max(12,radius*2)+'px',height:Math.max(12,radius*2)+'px',opacity:String(Math.min(.42,emyAbilities.wave/2.3))});
    }else wave.hidden=true;
   }else wave.hidden=true;
   renderer.render(view,torch,elapsed,hand,{rcView:rc?.mode==='driving'&&!!rc,scanOutline:emyAbilities.scan>0&&pursuer.active,bob:s.bob,action:handAction,clickAction,speed:animator.speed,acceleration:animator.acceleration,walkWeight:animator.weight,reduced:s.reduceBob,swayX:handDrift.x,swayY:handDrift.y,introHands,animator,feetY:s.y,crouched:s.crouched,equipment:visualEquipment,keyTurn:keyTurn?.time,noteRaise,batterySwap,tabletLift,equipLift:raisedNote?-.52*(1-noteRaise):reducedMotion.matches?0:-.22*Math.pow(1-Math.min(1,equipmentAge/.3),2),bathDoorAmount:world.objects.find(o=>o.id==='bano').amount,thirdPerson,actorTime,actorWalk,actorPiano,shotLight,pursuer:finalCutscene?{...pursuer.snapshot(),captureReach:Math.min(1,finalCutscene.elapsed/.8)*Math.max(0,Math.min(1,(2.45-finalCutscene.elapsed)/.35)),captureLift:0,captureFace:{jaw:0,bite:0,twitch:0,left:0,right:0,glance:0}}:pursuer.snapshot(),television});
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
  if(emyMenuOpen)closeEmyMenu();
  captureLayer.hidden=true;
  renderer?.destroy({keepCanvas:true});
  showModal(title,`<p>${escapeHTML(message)}</p>`,[[exitLabel,'exit']]);
 }
 try{renderer=new HouseRenderer(canvas,options.quality);reset(checkpointStore?.checkpoint);}catch(e){
  root.innerHTML=`<section class="lab-error" role="alert"><h2>No se pudo abrir la casa 3D</h2><p>${escapeHTML(String(e.message||e))}</p><button data-act="exit">${exitLabel}</button></section>`;
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
  // A modest extra pull beyond the thumb's normal radius activates sprint;
  // hysteresis prevents flicker while steering near the edge on iPhone.
  joystick.sprint=stickPointerType==='touch'&&dist>r.width*(joystick.sprint?.47:.53);
  const radius=Math.max(28,r.width*.45),normalized=Math.min(1,dist/radius),deadzone=.11;
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
  // The look surface covers the canvas on PC. Under pointer lock some
  // browsers still dispatch the primary click to that overlay instead of
  // the canvas. Both are game-world clicks; HTML controls stay excluded.
  else if((e.target===canvas||e.target===look)&&mouseLocked()&&canLook()&&e.button===0)
   runAction('interact');
 },{signal});
 function unlockSound(){
  if(isPaused()||sound.settings.muted||sound.context?.state==='running')return;
  void sound.start().then(ok=>{if(ok&&active&&isPaused()&&!cinematic&&!captureRunning())sound.pause();});
 }
 function endAudioPreview(){
  if(!audioPreview)return;
  audioPreview=false;sound.stopEmote();sound.pause();
 }
 function suspendPianoClock(){if(piano)piano.last=null;}
 function resumeHouseAudio(){if(piano&&pianoRunning())sound.resumePiano();else if(captureRunning()||!isSuspended())sound.resume();}
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
 root.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')root.classList.remove('house-keyboard');},true);
 window.addEventListener('keydown',e=>{
  if(!active||e.altKey||e.ctrlKey||e.metaKey||e.isComposing)return;
  if(captureShot&&!contextLost){e.preventDefault();return;}
  root.classList.add('house-keyboard');
  if(e.isTrusted&&!e.repeat)unlockSound();
  const focused=e.target?.tagName;
  if(emyMenuOpen){
   if(e.key==='Escape'){e.preventDefault();closeEmyMenu();}
   else if(e.key==='Tab'){
    const panel=$('house-emy-map').hidden?$('house-emy-menu'):$('house-emy-map');
    const items=[...panel.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length);
    if(items.length&&(!panel.contains(document.activeElement)||(!e.shiftKey&&document.activeElement===items.at(-1))||(e.shiftKey&&document.activeElement===items[0]))){e.preventDefault();(e.shiftKey?items.at(-1):items[0]).focus();}
   }
   return;
  }
  if(e.key==='Escape'&&mouseLocked()){e.preventDefault();releaseMouse();return;}
  if(e.key==='Escape'&&rc?.mode==='driving'&&!isPaused()){e.preventDefault();runAction('rc:stop');return;}
  if(phone.editing){if(e.key==='Escape'){e.preventDefault();void phone.layoutAction('done');}else if(e.key==='Tab'){const panel=phone.host.querySelector(phone.preview?'.hud-preview-tools':'.hud-editor'),items=[...panel.querySelectorAll('button,input,select')];if(!panel.contains(document.activeElement)||(!e.shiftKey&&document.activeElement===items.at(-1))||(e.shiftKey&&document.activeElement===items[0])){e.preventDefault();(e.shiftKey?items.at(-1):items[0]).focus();}}return;}
  if(['INPUT','SELECT','TEXTAREA'].includes(focused)&&e.key!=='Escape')return;
  // Preserve Space activation for keyboard-focused controls and dialogs, but
  // a pointer-clicked gameplay button must not steal the jump key.
  if(e.key===' '&&['BUTTON','SUMMARY','A'].includes(focused)&&
   (!e.target.closest('.lab-buttons')||e.target.matches(':focus-visible')))return;
  if(piano&&e.key!=='Tab'){
   const note=PIANO_KEYS.indexOf(e.key.toLowerCase());
   if(note!==-1){e.preventDefault();if(!e.repeat)playPiano(note);return;}
   if(e.key==='Escape'){e.preventDefault();modalClose();return;}
  }
  if(modal==='Caja fuerte'&&e.key!=='Tab'){if(/^\d$/.test(e.key)){e.preventDefault();safeAction(e.key);}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();safeAction(e.key==='Delete'?'clear':'back');}else if(e.key==='Enter'){e.preventDefault();safeAction('submit');}else if(e.key==='Escape'){e.preventDefault();modalClose();}return;}
  if((events.phase==='safe'||events.phase==='failed')&&!['Tab','Enter',' '].includes(e.key)){e.preventDefault();return;}
  if(/^[1-9]$/.test(e.key)&&!isPaused()&&!phone.open&&events.phase!=='arrival'){
   const slot=phone.visibleSlots()[Number(e.key)-1];
   if(slot){if(!e.repeat&&!remoteInUse())equip(slot.dataset.equip,true);return;}
  }
  if(rc?.mode==='driving'&&!e.repeat&&['q','x','t'].includes(e.key.toLowerCase())){
   e.preventDefault();runAction({q:'rc:noise',x:'rc:stop',t:'rc:trap'}[e.key.toLowerCase()]);return;
  }
  if(e.key.toLowerCase()==='r'&&!e.repeat&&canLook()){if(mouseLocked())releaseMouse();else lockMouse();return;}
  if(phone.open){if(phone.app==='settings'&&e.key!=='Escape')return;if(e.key==='Escape'){e.preventDefault();phone.close();resetInput();}else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.preventDefault();phone.key(e.key);}else if(e.key==='Tab'){const b=[...root.querySelectorAll('.phone-screen button')],first=b[0],last=b.at(-1);if((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last)){e.preventDefault();(e.shiftKey?last:first).focus();}}return;}
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
   if(emyMenuOpen){e.preventDefault();runAction('emy:close');return;}
   if(!$('house-emotes').hidden){$('house-emotes').hidden=true;root.querySelector('[data-act=emotes]').setAttribute('aria-expanded','false');resetInput();return;}
   if($('lab-camera-settings').open){$('lab-camera-settings').open=false;resetInput();return;}
   if(modal){if(intro||contextLost)return;paused=false;modalClose();}else togglePause();return;
  }
  if(e.key==='g'||e.key==='G')runAction('noise:throw');
  if(e.key==='e'||e.key==='E')runAction('interact');
  if(e.key==='f'||e.key==='F')runAction('flash');
  if(e.key==='c'||e.key==='C')runAction('crouch');
  if(e.code==='Space'||e.key===' ')runAction('hop');
  if(e.key==='i'||e.key==='I')runAction('bag');
 },{signal});
 window.addEventListener('keyup',e=>{const key=movementKey(e);if(key)keys.delete(key);},{signal,capture:true});
 window.addEventListener('blur',()=>{hasFocus=false;clearMiniatureInput();releaseMouse();resetInput();suspendPianoClock();sound.pause();},{signal});
 window.addEventListener('focus',()=>{hasFocus=true;resetInput();last=performance.now();resumeHouseAudio();},{signal});
 window.addEventListener('pagehide',()=>{hasFocus=false;clearMiniatureInput();releaseMouse();resetInput();suspendPianoClock();sound.pause();},{signal});
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
   if(captureShot){captureLayer.hidden=false;resumeHouseAudio();}
   if(!ready)startHouse();
   last=statsAt=performance.now();lastPaint=0;frameCount=0;
   raf=requestAnimationFrame(frame);
   if(ready)say('Gráficos recuperados');
  }catch(e){interruptGraphics('Error de renderizado',String(e.message||e));}
 },{signal});
 function startHouse(){
  if(scenario)showTrialStart();
  else if(demo&&!config.trial&&checkpoint==='ground')runAction('start');
  else showModal(demo?'Rescata a Louis':'Explora la casa',`<p>Modo ${escapeHTML(points[checkpoint]||'Planta baja')}. Camina con el joystick izquierdo, mira arrastrando a la derecha y pulsa USAR sobre objetos cercanos.</p><p>${demo?'Busca el lazo en el estudio y llama a Emy. La nota del pasillo contiene una pista. La linterna está sobre el mueble del descansillo.':'Hay dos plantas, recuerdos, una linterna y secretos pequeños.'}</p><p>Enciende las luces para ahorrar carga. Puedes cambiar la pila desde la mochila.</p>`,[['Entrar / activar sonido','start'],[exitLabel,'exit']]);
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
   amenities:()=>({power:housePowered(world.lights.power),lights:world.lights.circuits.filter(circuitPowered).map(c=>c.id),
    battery:{charge:s.battery,spares:s.inventory.batteries,swap:batterySwap},
    television:{on:television.powered,time:television.video.currentTime,duration:television.video.duration,frame:renderer.tvFrame},
    clock:{second:world.clock.second,hands:world.clock.hands.map(({hand})=>hand.roll)},
    rug:world.hatchRug.amount,hatch:world.hatch.amount,stamina:s.stamina,sprinting:s.sprinting,notePresentation}),
   story:()=>({pursuer:pursuer.snapshot(),samples:{loaded:sound.recordings?.buffers.size||0,played:sound.recordings?.played||0,last:sound.recordings?.lastPlayed,errors:sound.recordings?.errors||[]},phase:events.phase,time:events.time,remaining:events.remaining,messages:events.messages.map(m=>({...m})),equipment,phoneOpen:phone.open,hud:{...phone.layout,rect:phone.rect,editing:phone.editing},floorSounds:{steps:floorSounds.steps,triggers:floorSounds.triggers},audio:{lastEffect:sound.lastEffect,effects:sound.effectCount||0,voices:sound.foleyVoices?.size||0}}),
   userAudio:()=>({ready:!!sound.recordings?.sprite,codec:sound.recordings?.spriteCodec||null,
    duration:sound.recordings?.sprite?.duration||0,
    errors:sound.recordings?.errors.filter(error=>error.startsWith('user-sprite'))||[]}),
   rc:()=>({projection:renderer.lastProjection,mode:rc.mode,elapsed:rc.elapsed,position:{x:rc.x,y:rc.y,z:rc.z,yaw:rc.yaw},noise:rc.noise,crashes:rc.crashes,driveSpeed:rc.driveSpeed,steerAngle:rc.steerAngle,inventory:!!s.inventory.rc,trap:{...rcTrap},pursuer:{x:pursuer.x,y:pursuer.y,z:pursuer.z,mode:pursuer.mode}}),
   louis:()=>louis?{x:louis.x,y:louis.y,z:louis.z,phase:louis.phase,waypoint:louis.waypoint,age:louis.age,walk:louis.walk,speed:louis.speed,crouch:louis.crouch,reaction:louis.visualReaction?.type??null,cameraPhase:loisShotDirector?.phase??null}:null,
   emy:()=>({x:world.emy.x,y:world.emy.y,z:world.emy.z,phase:world.emy.phase,reaction:world.emy.reaction,hidden:world.emy.hidden,mood:emyCompanion?.mood,alarm:world.emy.alarm||0,refuge:emyCompanion?.refuge?{...emyCompanion.refuge}:null,companion:emyCompanion?.stage,stay:emyCompanion?.stage==='stay',ventOpen:world.studyVent.coverAmount===1,entrance:emyShot?.elapsed,trunk:emyCompanion?.stage==='trunk'}),
   emySkills:()=>({scanRendered:!!renderer?.lastScanOutline,scan:emyAbilities.scan,scanCooldown:emyAbilities.scanCooldown,distractCooldown:emyAbilities.distractCooldown,
    wave:emyAbilities.wave,stay:emyCompanion?.stage==='stay',menu:emyMenuOpen,mapOpen:!$('house-emy-map').hidden,mapReadOnly,preview:mapPreview?{goal:{...mapPreview.goal},seconds:mapPreview.seconds,waypoints:mapPreview.waypoints.map(p=>({...p}))}:null,stage:emyCompanion?.stage,
    distraction:emyCompanion?.distraction?{remaining:emyCompanion.distraction.remaining,arrived:emyCompanion.distraction.arrived,
      goal:{...emyCompanion.distraction.goal}}:null}),
   noiseProps:()=>noiseProps.map(p=>({id:p.id,x:p.x,y:p.y,z:p.z,held:p.held,spent:p.spent,flight:!!p.flight})),
   greyCat:()=>({active:world.greyCat.active,x:world.greyCat.x,z:world.greyCat.z,called:world.greyCat.called}),
   // DEV-only placement for screenshotting the exact outline behind a wall.
   placeThreat:(pose)=>{
    const y=groundHeight(pose.x,pose.z,pose.y??0,world.hatch?.amount>.92);
    if(!Number.isFinite(y)||Math.abs(y-(pose.y??0))>.12||blocked(world.boxes,pose.x,y,pose.z,.16,1.72))
     throw Error('Unsafe pursuer test pose');
    if(!pursuer.active)pursuer.start();
    Object.assign(pursuer,{x:pose.x,y,z:pose.z,yaw:pose.yaw??0,facing:pose.yaw??0,mode:'search',awareness:0,lost:10,path:[],replan:1});
    return pursuer.snapshot();
   },
   // DEV-only route harness for deterministic test setup; not in the production build.
   placeRC:(pose)=>{if(rc.mode!=='driving')throw Error('RC must be deployed first');const y=groundHeight(pose.x,pose.z,pose.y??rc.y,world.hatch?.amount>.92);if(!Number.isFinite(y)||blocked(world.boxes,pose.x,y,pose.z,.155,.38))throw Error('Blocked RC test position');rc.x=pose.x;rc.y=y;rc.z=pose.z;rc.yaw=pose.yaw??rc.yaw;rc.noise=0;syncRCObject(rc);return {x:rc.x,y:rc.y,z:rc.z};},
   intro:()=>cinematic?{elapsed:cinematic.elapsed,...windowIntroState(cinematic.elapsed/WINDOW_SHOT_SECONDS),camera:windowIntroCamera(cinematic.elapsed/WINDOW_SHOT_SECONDS)}:null,
   atmosphere:()=>({room:sound.atmosphere?.room,outdoor:sound.atmosphere?.outdoor,events:sound.atmosphere?.events,voices:sound.atmosphere?.voices.size,loops:sound.atmosphere?.loops.length,lastEvent:sound.atmosphere?.lastEvent,muted:sound.settings.muted,volume:sound.settings.ambient}),
   snapshot:()=>({puzzle:{...puzzle},hop:{age:hopAge,offset:hopCancelled?0:hopOffset(hopAge,reducedMotion.matches)},position:{x:s?.x,y:s?.y,z:s?.z},locomotion:{...velocity,eye:s?.eye,cameraGround:s?.cameraGround,stairs:s?getStairDirection(s):''},camera:{yaw:s?.yaw,pitch:s?.pitch,targetYaw:lookTarget.yaw,invertX:options.invertX},cinematic:!!cinematic,quality:options.quality,fps,target:focus?.id??null,paused:isPaused(),controls:{look:lookPointer,stick:stickPointer,joystick:{...joystick}},reduceBob:s.reduceBob,flashlight:s.flashlight,notes:s.inventory.notes.length,drawer:(()=>{const o=world.objects.find(o=>o.id==='drawer');return {state:o.state,amount:o.amount,z:o.box.z,key:world.objects.find(o=>o.id==='key').z,contentsAvailable:world.objects.find(o=>o.id==='key').interactable,contentsConcealed:world.objects.find(o=>o.id==='key').concealed}})(),doors:world.objects.filter(o=>o.kind==='door').map(o=>({id:o.id,open:o.open,state:o.state,amount:o.amount,x:o.box.x,z:o.box.z,yaw:o.box.yaw,solid:o.box.solid})),handVisible:renderer.lastShowHand,hidden:!!s.hidden,hideType:s.hidden?.hideType,poseTransition:poseTransition?{entering:poseTransition.entering,elapsed:poseTransition.elapsed}:null,view:cameraOf(s),wardrobeAmount:world.objects.find(o=>o.id==='wardrobe').amount,music:{scheduled:sound.musicStep,voices:sound.musicNodes.size,timer:sound.musicTimer!==null,volume:sound.settings.music},sound:sound.context?.state,mirror:{supported:renderer.mirrorSupported,drawn:renderer.mirrorDrawn,vertices:renderer.kittyVertices?.length/16,uploads:renderer.mirrorUploads},animation:{...animator.snapshot(),rigEvaluations:renderer.characterBinding?.evaluations},geometry:{vertices:renderer.vertexCount,triangles:renderer.triangleCount}}),
   setPose:(pose)=>{if(blocked(world.boxes,pose.x,pose.y,pose.z,.2,1.7))throw Error('Blocked test pose');Object.assign(s,pose);s.cameraGround=s.y;
    // QA-only teleports must move the interpolation target too, otherwise
    // the camera drifts away from the intended puzzle while tests interact.
    if(Number.isFinite(pose.yaw))lookTarget.yaw=pose.yaw;
    if(Number.isFinite(pose.pitch))lookTarget.pitch=pose.pitch;
    resetInput();focus=null;},
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
      // Use the candidate floor for the QA raycast, even after a basement teleport.
      // A stale cameraGround made obtainable items look blocked by invisible walls.
      s.x=x;s.y=y;s.z=z;s.cameraGround=y;s.yaw=Math.atan2(o.x-x,o.z-z);
      s.pitch=Math.atan2(o.y-(y+s.eye),Math.hypot(o.x-x,o.z-z));
      if(closestObject(world,s,null)?.id===o.id){
       if(['door','drawer','safe','cupboard'].includes(o.kind)&&!sweepClear(o,o.amount||0,o.open?0:1,s))continue;
       found=true;break;
      }
     }
    }
    if(!found)throw Error('No line-of-sight reachable pose for '+id);
    lookTarget.yaw=s.yaw;lookTarget.pitch=s.pitch;
    if(!activate){resetInput();return {position:{x:s.x,y:s.y,z:s.z}};}
    lastInteraction=-Infinity;resetInput();interact();if(o.motion)await new Promise(resolve=>{const check=()=>{if(!active||!o.motion)resolve();else requestAnimationFrame(check);};check();});return {puzzle:{...puzzle},position:{x:s.x,y:s.y,z:s.z}};
   }
  };
 }
 function stop(){if(!active)return;active=false;clearMiniatureInput();releaseMouse();cancelAnimationFrame(raf);controller.abort();television.destroy();phone.destroy();sound.destroy();renderer?.destroy();if(window.__rescueHouse)delete window.__rescueHouse;root.remove();}
 return stop;
}
