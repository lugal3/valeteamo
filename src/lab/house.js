import {HouseEvents} from './story-events.js';
import {HouseMessages} from './hud-messages.js';
import {PhoneUI} from './phone-ui.js';
import {FloorSounds} from './floor-sounds.js';
import {EMOTES} from './animations/emotes.js';
import {Pursuer} from './pursuer.js';
import {movementKey,releasedPointer,hasControlTouch} from './movement-input.js';
import {CharacterAnimator} from './animator.js';
import {BATH_MIRROR} from './mirror.js';
import {MirrorSafePuzzle,SAFE_CODE,MIRROR_HINT} from './mirror-safe.js';
import {HIDE_SECONDS,hidingFrame} from './hiding.js';
import {createHouse,HEIGHT,HOUSE,blocked,groundHeight,lineBlocked,setDoor,setDrawer,poseFurniture,roomAt} from './world.js';
import {HouseRenderer,pickupGeometry} from './renderer.js';
import {HouseSound,MIX_CHANNELS} from './sound.js';
import {applyLookDelta,followLook,readCameraSettings,writeCameraSettings,DEFAULT_CAMERA_SETTINGS,SENSITIVITY_MIN,SENSITIVITY_MAX,SENSITIVITY_STEP} from './camera-controls.js';
import {WINDOW_SHOT_SECONDS,WINDOW_LANDING,windowIntroCamera,windowIntroState,shouldPlayWindowIntro} from './window-intro.js';
import {navigate,smoothAxis,getStairDirection} from './navigation.js';
import {interactionTarget} from './interactions.js';
import {toggleCircuit} from './house-lights.js';
import {turnOnTelevision} from './television.js';
import {animateFurniture,updateFurniture,sweepClear} from './furniture-motion.js';
import {createHousePuzzle,puzzleEvent,canOpenDrawer,canOpenBedroom,canRescue,PUZZLE_HINTS} from '../demo/house-puzzles.js';
import './house.css';
const FLASH_DRAIN=.24,FLASH_LOW=15,SPARE_CHARGE=55;
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
 <div class="lab-top">
   <details class="lab-camera-settings" id="lab-camera-settings"><summary aria-label="Ajustes de la casa">⚙</summary><div class="lab-camera-panel">
     <div class="house-menu-actions">
       <button data-act="pause">Pausa</button>
       <button data-act="exit" class="lab-exit">← ${config.trial?'Pruebas':demo?'Cumpleaños':'Pruebas'}</button>
     </div>
     <label>Velocidad de giro <input data-setting="sensitivity" aria-label="Sensibilidad de giro" type="range" min="${SENSITIVITY_MIN}" max="${SENSITIVITY_MAX}" step="${SENSITIVITY_STEP}" value="${DEFAULT_CAMERA_SETTINGS.sensitivity}"></label>
     <label class="lab-invert-label"><input data-setting="invertX" type="checkbox"> Invertir giro horizontal</label>
     <label>Calidad de imagen <select data-setting="quality" aria-label="Calidad gráfica"><option value="medium">Detalles (auto)</option><option value="low">Modo fluido</option></select></label>
     <label class="lab-preference"><input data-setting="bob" type="checkbox" checked> Balanceo al caminar</label>
     <details class="house-mixer"><summary>Mezclador de sonido</summary>
       <label class="lab-preference"><input data-setting="mute" type="checkbox"> Silenciar la casa</label>
       ${MIX_CHANNELS.map(([key,label,preview],i)=>`<div class="mixer-row"><label><span>${label} <output data-level="${key}"></output></span><input data-setting="${key}" type="range" min="0" max="${i<4?1:2}" step=".01" aria-label="${label}"></label><button data-act="audio:${preview||key}" aria-label="Probar ${label}">▶</button></div>`).join('')}
       <button data-act="copy-mix">Copiar mezcla</button>
       <textarea class="mixer-export" aria-label="Valores de la mezcla" readonly hidden></textarea>
       <small class="mixer-status" role="status"></small>
     </details>
     <button data-act="reset">Reiniciar casa</button>
     <button data-act="hud">Editar controles / hotbar</button>
     ${demo?'':'<details><summary>Diagnóstico</summary><div id="lab-metrics"></div></details>'}
     <small class="lab-settings-note">WASD · Caminar / Flechas · Mirar / E · Interactuar / F · Usar objeto / I · Mochila / Esc · Pausa</small>
   </div></details>
 </div>
 <div class="lab-focus" id="lab-focus" role="status"></div>
 <div class="house-messages" id="house-messages" hidden>
  <div class="lab-objective" id="lab-objective">✿ Explora la casa · sigue las pistas</div>
  <div class="lab-toast" id="lab-toast" role="status" aria-live="polite"></div>
 </div>
 <div class="house-charge" id="house-charge" role="meter" aria-label="Batería de la linterna" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" hidden><span class="house-charge-cell" aria-hidden="true"><i id="lab-charge"></i></span><strong id="lab-charge-text" aria-hidden="true">100%</strong></div>
 <div class="lab-joystick" id="lab-joystick" aria-label="Joystick izquierdo, arrastrar para caminar"><div class="lab-stick-ring"><div id="lab-stick" class="lab-stick-thumb">♡</div></div></div>
 <div class="lab-look" id="lab-look" aria-label="Arrastrar para mirar"></div>
 <div class="lab-buttons">
  <button data-act="interact" id="lab-interact" hidden><small>Usar</small></button>
  <button data-act="emotes" aria-label="Elegir emote" hidden>☺<small>Emotes</small></button>
  <button data-act="bag">▣<small>Mochila</small></button>
  <button data-act="flash" id="house-light">☼<small>Luz</small></button>
  <button data-act="phone" class="phone-expand" id="house-use-phone" aria-label="Usar teléfono" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/></svg><small>Usar</small></button>
  <button data-act="crouch" id="lab-crouch" aria-label="Agacharse" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4" r="2"/><path d="m13 8-3 4 5 2-2 3h5m-8-5-4 5M7 21h10m-7-12-3 2"/></svg><small>Agachar</small></button>
 </div>
 <div class="house-emotes" id="house-emotes" hidden role="group" aria-label="Emotes"><span>En el espejo · moverte cancela</span>${EMOTES.map(e=>`<button data-act="emote:${e.id}">${e.key} · ${e.label}</button>`).join('')}<button data-act="emote:stop">Detener</button></div>
 <div id="lab-turn" class="lab-turn"><div><span>↻</span><h2>Gira tu teléfono</h2><p>La casa se explora en horizontal. Tu lugar se conserva y el mundo queda en pausa.</p><button data-act="exit">Volver a pruebas</button></div></div>
 <div id="lab-dialog" class="lab-dialog lab-hidden"></div>`;
 document.body.appendChild(root);
 const events=new HouseEvents({pursuit:config.entry!=='rescue'}),floorSounds=new FloorSounds();let pursuer=null,equipment='flashlight',equipmentAge=1,encounterCheckpoint=null,thirdView=null;
 const mirrorSafe=new MirrorSafePuzzle();let safeInput='',activeSafe=null,noteLift=0,noteHold=0,capturePhoto=false;
 const phone=new PhoneUI(root,equip,()=>resetInput(),{canUse:()=>ready&&!isSuspended()&&!cinematic&&events.phase!=='arrival'&&events.phase!=='failed'&&events.phase!=='safe',onEdit:()=>{resetInput();if(isSuspended())sound.pause();else sound.resume();},onPhoto:()=>{capturePhoto=true;}});phone.equip(equipment);
 const danger=document.createElement('div');danger.className='house-danger';danger.hidden=true;danger.setAttribute('role','status');root.querySelector('#house-messages').append(danger);
 const enableSound=document.createElement('button');enableSound.className='house-enable-sound';enableSound.textContent='Activar sonido';enableSound.hidden=true;root.querySelector('.house-mixer').before(enableSound);
 enableSound.addEventListener('click',()=>{sound.set('muted',false);root.querySelectorAll('[data-setting="mute"]').forEach(el=>el.checked=false);void sound.start();});
 const $=id=>root.querySelector('#'+id),canvas=$('lab-canvas'),dialog=$('lab-dialog');
 const hudMessages=new HouseMessages(root);
 phone.onPresentationChange=()=>hudMessages.layout(phone.rect,phone.open);
 const controller=new AbortController(),signal=controller.signal;
 let renderer,world,bathCircuit,puzzle=createHousePuzzle(config.entry),sound=new HouseSound(),s,raf=0,last=0,lastPaint=0,fps=0,elapsed=0,lookPointer=null,stickPointer=null;
 let active=true,ready=false,hasFocus=true,focus=null,lookLast={x:0,y:0},paused=false,modal='',intro=true,contextLost=false,stickPointerType=null,lookPointerType=null;
 let lookTarget={yaw:Math.PI,pitch:0},cinematic=null,poseTransition=null,handAction=0,clickAction=0,lastInteraction=-Infinity,audioPreview=false;
 const handDrift={x:0,y:0,vx:0,vy:0};
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const keys=new Set(),joystick={x:0,z:0},velocity={forward:0,side:0};
 const cameraSettings=(()=>{try{return readCameraSettings(window.localStorage)}catch{return {...DEFAULT_CAMERA_SETTINGS}}})();
 const options={sensitivity:cameraSettings.sensitivity,invertX:cameraSettings.invertX,bob:!reducedMotion.matches,quality:'medium'};
 const saveCamera=()=>{try{writeCameraSettings(window.localStorage,options)}catch{}};
 const points={ground:'Planta baja',upstairs:'Planta alta',sound:'Iluminación / sonido',interactions:'Interacciones',mirror:'Espejo del baño'};
 const say=(text,seconds=2.4)=>hudMessages.say(text,seconds);
 const isPortrait=()=>window.innerHeight>window.innerWidth;
 const isSuspended=()=>!ready||paused||!!modal||phone.editing||$('lab-camera-settings').open||isPortrait()||document.hidden||!hasFocus||contextLost;
 const isPaused=()=>isSuspended()||!!cinematic||!!poseTransition;
 const flashlightBeam=()=>s.flashlight&&equipment==='flashlight'&&!s.hidden&&!s.lying&&!animator.performing&&!phone.open&&events.phase!=='arrival';
 function cancelEmote(options){animator.cancelEmote(options);sound.stopEmote();}
 function equip(kind){cancelEmote();equipment=kind;equipmentAge=0;phone.equip(kind);resetInput();}
 function releaseCapture(element,pointer){try{if(pointer!==null&&element?.hasPointerCapture(pointer))element.releasePointerCapture(pointer);}catch{}}
 function capture(element,pointer){try{element.setPointerCapture?.(pointer);}catch{}}
 function resetInput(){
  keys.clear();joystick.x=joystick.z=0;velocity.forward=velocity.side=0;
  const pairs=[[$('lab-look'),lookPointer],[$('lab-joystick'),stickPointer]];
  lookPointer=stickPointer=null;lookPointerType=stickPointerType=null;
  for(const [element,pointer] of pairs)releaseCapture(element,pointer);
  if($('lab-stick'))$('lab-stick').style.transform='translate(0,0)';
  if(s)lookTarget={yaw:s.yaw,pitch:s.pitch};
 }
 let stopTelevision=null;
 function closeTelevision(){stopTelevision?.();stopTelevision=null;}
 const modalClose=()=>{closeTelevision();modal='';activeSafe=null;safeInput='';dialog.classList.add('lab-hidden');dialog.innerHTML='';resetInput();if(!isSuspended())sound.resume();};
 function showModal(title,body,actions=[['Cerrar','close']]){
  closeTelevision();
  modal=title;dialog.classList.remove('lab-hidden');
  $('house-messages').hidden=true;
  dialog.innerHTML=`<section class="lab-paper" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}"><div class="lab-paper-mark">✿ ♡ ✿</div><h2>${escapeHTML(title)}</h2><div class="lab-paper-body">${body}</div><div class="lab-paper-actions">${actions.map(([label,act])=>`<button data-act="${escapeHTML(act)}">${escapeHTML(label)}</button>`).join('')}</div></section>`;
  resetInput();sound.pause();dialog.querySelector('button')?.focus({preventScroll:true});
 }
 function rebuild(){renderer.rebuild([...world.boxes,...pickupGeometry(world.objects)]);}
 function finishWindowIntro(){
  poseFurniture(world.entryWindow,1);sound.setTension(.55);
  cinematic=null;root.classList.remove('lab-intro-active');$('lab-window-intro').classList.add('lab-hidden');
  Object.assign(s,WINDOW_LANDING);s.eye=WINDOW_LANDING.eye;s.bob=0;
  resetInput();
  if(ready&&!isPaused())sound.resume();
  last=performance.now();say('Kitty entra con cuidado por la ventana…',2.5);
 }
 function beginWindowIntro(){
  resetInput();
  poseFurniture(world.entryWindow,0);sound.setTension(.32);
  cinematic={elapsed:0,cues:new Set()};root.classList.add('lab-intro-active');$('lab-window-intro').classList.remove('lab-hidden');
  $('lab-intro-caption').textContent='Una ventana entreabierta…';
 }
 function reset(){
  events.reset();mirrorSafe.reset(['lock','rescue'].includes(config.entry));hudMessages.reset();phone.close();equipment='flashlight';phone.equip(equipment);encounterCheckpoint=null;danger.hidden=true;
  animator.reset();sound.stopEmote();floorSounds.reset();if(phone.editing)void phone.layoutAction('done');$('house-emotes').hidden=true;cinematic=null;poseTransition=null;paused=false;lastInteraction=-Infinity;handAction=0;clickAction=0;noteLift=0;noteHold=0;capturePhoto=false;
  sound.setTension(.55);
  root.classList.remove('lab-intro-active');$('lab-window-intro').classList.add('lab-hidden');$('lab-camera-settings').open=false;
  world=createHouse(checkpoint);puzzle=createHousePuzzle(config.entry);pursuer=new Pursuer(world);sound.setThreat(false);
  bathCircuit=world.lights.circuits.find(circuit=>circuit.id==='bano');
  if(mirrorSafe.opened){poseFurniture(world.objects.find(o=>o.id==='mirror-safe'),1);world.objects.find(o=>o.id==='mirror-note').taken=true;}
  poseFurniture(world.entryWindow,1);handDrift.x=handDrift.y=handDrift.vx=handDrift.vy=0;
  if(demo){
   const key=world.objects.find(o=>o.id==='key');key.taken=puzzle.key;
   setDrawer(world.objects.find(o=>o.id==='drawer'),puzzle.drawer);
   world.objects.find(o=>o.id==='note-hall').text=PUZZLE_HINTS.note;
   world.objects.find(o=>o.id==='picture-stain').text='El corazón del cuadro también aparece en la caja fuerte del salón. Su contenido guarda la segunda pista del dormitorio.';
   const door=world.objects.find(o=>o.id==='dormitorio');if(puzzle.door)setDoor(door,true);
   world.objects.push({id:'rescue-louis',kind:'rescue',label:'Rescatar a Louis',x:3.1,y:HEIGHT+1.25,z:.97,taken:false});
   world.boxes.push({id:'louis-head',x:3.1,y:HEIGHT+1.13,z:.97,w:.45,h:.52,d:.37,mat:'cream',solid:false});
   world.boxes.push({id:'louis-bow',x:3.25,y:HEIGHT+1.38,z:.96,w:.2,h:.16,d:.2,mat:'pink',solid:false});
  }
  const p=world.spawn;
  s={x:p.x,z:p.z,y:p.y,yaw:p.yaw,pitch:0,eye:1.63,crouched:false,hidden:null,lying:false,bob:0,
    flashlight:demo,battery:100,reduceBob:!options.bob||reducedMotion.matches,inventory:{notes:[],batteries:p.items?.batteries??Number(demo),key:demo?puzzle.key:!!p.items?.key},distanceSteps:0};
  focus=null;lookTarget={yaw:s.yaw,pitch:s.pitch};modalClose();keys.clear();rebuild();say('Escenario reiniciado · '+(points[checkpoint]||'planta baja'));
 }
 const listener=()=>cameraOf(s);
 const play=(name,o=null,level=1)=>{
  if(name==='door-close'&&o?.wardrobeLeaves)name='closet-close';
  if(name==='footstep'){const room=ctxRoom(s);name=s.x<0||s.x>HOUSE.width||s.z<0||s.z>HOUSE.depth?(Math.abs(s.x-5.9)<.9?'stone':'grass'):room==='Baño'||room==='Cocina y comedor'?'tile':'wood';}
  const loc=listener(),source=o?{x:o.x,y:o.y,z:o.z}:null;
  const occluded=source?lineBlocked(world.boxes,loc,source,o?.kind==='door'?'door-'+o.id:''):false;
  sound.effect(name,source,{...loc,yaw:s.yaw},occluded,{level});
 };
 function toggleFlash(){if(s.hidden||s.lying)return;
  sound.resume();
  if(!s.flashlight&&s.battery<=0){say('Sin carga · cambia la pila en la mochila o busca un interruptor.');return;}
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
  const from=cameraOf(s),inside={...object.hideCamera},outside={x:object.returnX,y:s.y+1.63,z:object.returnZ,yaw:inside.yaw+Math.PI,pitch:0};
  if(blocked(world.boxes,outside.x,s.y,outside.z,.18,1.64)){say('Deja libre el espacio delante del escondite');return;}
  resetInput();poseTransition={object,entering,from,inside,outside,elapsed:0};
  if(reducedMotion.matches)poseTransition.elapsed=HIDE_SECONDS;
  play(object.wardrobeLeaves?'door-open':'cloth',object,.65);updateHiding(0);
 }
 function updateHiding(dt){
  if(!poseTransition||paused||modal||$('lab-camera-settings').open||isPortrait()||document.hidden||!hasFocus||contextLost)return;
  const transition=poseTransition;transition.elapsed=Math.min(HIDE_SECONDS,transition.elapsed+dt);
  const frame=hidingFrame({...transition,progress:transition.elapsed/HIDE_SECONDS,wardrobe:!!transition.object.wardrobeLeaves});
  s.poseCamera=frame.camera;if(transition.object.wardrobeLeaves)poseFurniture(transition.object,frame.doorAmount);
  if(transition.elapsed>=HIDE_SECONDS){
   if(transition.object.wardrobeLeaves)play('door-close',transition.object,.65);
   if(transition.entering){s.hidden={...transition.inside,objectId:transition.object.id,hideType:transition.object.hideType,returnX:transition.outside.x,returnZ:transition.outside.z};s.yaw=transition.inside.yaw;s.pitch=transition.inside.pitch;sound.setTension(.85);say(transition.object.wardrobeLeaves?'Dentro del armario · mira por las rendijas · USAR para salir':'Bajo la cama · USAR para salir',4);}
   else{s.hidden=null;s.x=transition.outside.x;s.z=transition.outside.z;s.yaw=frame.camera.yaw;s.pitch=0;sound.setTension(.55);say('Has salido con cuidado');}
   s.poseCamera=null;poseTransition=null;resetInput();if(!isPaused())sound.resume();
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
   const on=toggleCircuit(o.circuit);play('click',o);say(on?'Luz encendida':'Luz apagada');
  }else if(o.kind==='tap'){
   o.on=!o.on;o.water.y=o.on?1.01:-100;play('click',o);say(o.on?'Llave de agua abierta':'Llave de agua cerrada');
  }else if(o.kind==='door'||o.kind==='cupboard'){
   if(demo&&o.id==='dormitorio'&&!canOpenBedroom(puzzle)){say(puzzle.key?'La segunda pista está dentro de la caja fuerte del salón.':'Busca la llave con lazo en el cajón del estudio.',4);play('latch',o);return;}
   if(o.locked&&!s.inventory.key){say('La puerta tiene un pequeño candado. Busca una llave.');play('latch',o);return;}
    const opening=!o.open;if(pursuer.active&&!sweepClear(o,o.amount,opening?1:0,pursuer)){say('No puedes mover la puerta mientras alguien ocupa el paso.');return;}const result=animateFurniture(o,opening,{player:s,reducedMotion:reducedMotion.matches});
    if(!result.started){if(result.reason==='blocked')say('No puedes mover la puerta mientras estás en el paso.');return;}
    if(demo&&o.id==='dormitorio'&&opening&&result.complete)puzzle=puzzleEvent(puzzle,'door');
    play(o.kind==='cupboard'?'drawer':opening?'door-open':'door-close',o);
    say(o.kind==='cupboard'?(opening?'Refrigerador abierto':'Refrigerador cerrado'):(opening?'Abriendo puerta…':'Cerrando puerta…'));
  }else if(o.kind==='drawer'){
   const keyDrawer=demo&&o.id==='drawer';
   if(keyDrawer&&!canOpenDrawer(puzzle)){say(PUZZLE_HINTS.drawer);return;}
    const opening=!o.open,result=animateFurniture(o,opening,{player:s,reducedMotion:reducedMotion.matches});
    if(!result.started){if(result.reason==='blocked')say('Deja un poco de espacio delante del cajón.');return;}
    if(keyDrawer&&opening){puzzle=puzzleEvent(puzzle,'drawer');world.objects.find(k=>k.id==='key').taken=puzzle.key;say(puzzle.key?'Ya guardaste la llave en la mochila.':'Abriendo el cajón… una llave con un lazo.',3);}
    else say(opening?'Abriendo cajón…':'Cerrando cajón…');
    play('drawer',o);
  }else if(o.kind==='battery'){o.taken=true;s.inventory.batteries++;rebuild();play('pickup',o);say('Pila guardada en la mochila');}
  else if(o.kind==='key'){o.taken=true;s.inventory.key=true;if(demo)puzzle=puzzleEvent(puzzle,'key');rebuild();play('pickup',o);say('Llave con lazo obtenida');}
  else if(o.kind==='note'){o.taken=true;s.inventory.notes.push({id:o.id,label:o.label,text:o.text});if(demo&&o.id==='note-hall')puzzle=puzzleEvent(puzzle,'note');rebuild();play('note',o);if(o.mirrored){mirrorSafe.collect();showMirrorNote();}else showNote(o);}
  else if(o.kind==='safe')showSafe(o);
  else if(o.kind==='television'){
   if(events.phase==='hide'||events.phase==='hunt'){say('La tele puede esperar. Busca un escondite.');return;}
   showModal('Televisor',`<div class="house-tv-screen"></div>`,[['Apagar tele','close']]);
   dialog.querySelector('.lab-paper').classList.add('house-tv');
   o.power.on=true;
   const stopPlayer=turnOnTelevision(dialog.querySelector('.house-tv-screen'),{muted:sound.settings.muted});
   stopTelevision=()=>{stopPlayer();o.power.on=false;};
  }
  else if(o.kind==='picture'||o.kind==='inspect'){
   play('click',o);showModal(o.label,`<p>${escapeHTML(o.text)}</p>`);
  }else if(o.kind==='rescue'){
   if(events.notified&&config.entry!=='rescue'&&events.phase!=='evaded'){say('Primero despista al perseguidor: armario, cama o rompe su línea de visión.');return;}
   if(!demo||!canRescue(puzzle)){say(PUZZLE_HINTS.rescue);return;}
   puzzle=puzzleEvent(puzzle,'rescue');play('pickup',o);
   if(events.complete()){phone.close();resetInput();pursuer.reset();sound.setThreat(false);showModal('Tramo superado','<p>Has despistado al perseguidor y encontrado a Louis.</p><p>Fin de este tramo de la casa. La historia continuará.</p>',[['Volver a pruebas','exit']]);return;}
   showModal('¡Louis está a salvo!', '<p>Kitty encuentra a Louis. La puerta se abre, las luces se encienden y juntos regresan al jardín.</p>',[['Terminar la demo','finish']]);
  }
  else if(o.kind==='bed'){
   s.lying={returnX:o.returnX,returnZ:o.returnZ};s.x=o.x;s.z=o.z-.25;s.pitch=-.08;
   play('bed',o);say('Te has acostado. Pulsa USAR para levantarte.');
  }else if(o.kind==='hide'){
   beginHiding(o,true);
  }
 }
 function showNote(note,back='close'){
  showModal(note.label,`<p class="house-note-sheet">${escapeHTML(note.text)}</p>`,[[back==='bag'?'Volver a la mochila':'Cerrar',back]]);
 }
 function showMirrorNote(back='close'){
  showModal('Nota con escritura extraña',`<div class="house-note-sheet mirror-note-paper"><span class="mirror-note-writing" aria-hidden="true">${SAFE_CODE}</span><span class="mirror-note-description">Cuatro cifras escritas al revés.</span></div>${mirrorSafe.revealed?`<p class="mirror-note-reading">Lectura del espejo: <strong>${SAFE_CODE}</strong></p>`:'<p>Las marcas parecen tener sentido desde otro punto de vista.</p>'}`,[['Volver',back]]);
  dialog.querySelector('.lab-paper').classList.add('mirror-note-modal');
 }
 function showSafe(object){
  if(object.motion){say('La caja se está abriendo…');return;}
  if(mirrorSafe.opened){showModal('Dentro de la caja fuerte','<p>En el sobre está el símbolo del corazón. Con la llave con lazo ya puedes abrir el dormitorio.</p>');return;}
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
    s.inventory.notes.push({id:'safe-heart',label:'Sobre de la caja fuerte',text:'El símbolo del corazón es la segunda pista del dormitorio. Usa también la llave con lazo.'});
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
  showModal('Mi mochila',`<p><b>⚿ Llave:</b> ${s.inventory.key?'Llave con lazo · abre el dormitorio':'Sin llave'}</p><p><b>Linterna:</b> ${charge}% · <b>Pilas de repuesto:</b> ${s.inventory.batteries}</p><div class="lab-note-list">${notes}</div>`,actions);
 }
 function recharge(){
  if(Math.ceil(s.battery)>=100||s.inventory.batteries<1)return;
  s.inventory.batteries--;s.battery=Math.min(100,s.battery+SPARE_CHARGE);bag();
 }
 function drainFlashlight(dt){
  const before=s.battery;
  s.battery=Math.max(0,before-dt*FLASH_DRAIN);
  if(!s.battery){s.flashlight=false;play('light');say('La linterna se apagó · usa una pila de la mochila o enciende una luz.',5);}
  else if(before>FLASH_LOW&&s.battery<=FLASH_LOW)say('Batería baja · quedan '+FLASH_LOW+'%',4);
 }
 function togglePause(){if(!ready||contextLost)return;$('lab-camera-settings').open=false;paused=!paused;if(paused){sound.pause();showModal('Pausa',`<p>El tiempo de la casa y sus sonidos se han detenido.</p>`,[['Continuar','resume'],['Volver a pruebas','exit']]);}else{modalClose();sound.resume();}}
 const inBathroom=()=>roomAt(s.x,s.z,s.y)==='Baño';
 function useEquipment(){
  if(s.hidden||s.lying)return;
  if(equipment==='phone'&&!noteLift){cancelEmote();phone.show();resetInput();}
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
  if((events.phase==='safe'||events.phase==='failed')&&!['retry-arrival','exit','reset'].includes(act))return;
  if(act==='retry-arrival'){paused=false;modalClose();Object.assign(s,encounterCheckpoint);s.hidden=null;s.lying=false;s.crouched=false;s.eye=1.63;s.poseCamera=null;poseTransition=null;pursuer.reset();poseFurniture(world.objects.find(o=>o.id==='wardrobe'),0);events.retry();sound.setThreat(true);resetInput();return;}
  if(act==='exit'){stop();onExit();return;}
  if(act==='finish'){config.onRescue?.();return;}
  if(act==='skip-intro'){if(cinematic)finishWindowIntro();return;}
  if(act==='pause'){togglePause();return;}
  if(act==='resume'){paused=false;modalClose();sound.resume();return;}
  if((!ready||cinematic||contextLost)&&act!=='start')return;
  if(act==='close'){paused=false;modalClose();if(!isPaused())sound.resume();return;}
  if(act==='start'){intro=false;modalClose();ready=true;
   void sound.start().then(ok=>{if(!active)return;if(isPaused()&&!cinematic)sound.pause();if(!ok)say('Activa el sonido en Ajustes');});
   const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
   if(shouldPlayWindowIntro({demo,trial:config.trial,checkpoint,reducedMotion:reduce}))beginWindowIntro();
   else if(demo&&checkpoint==='ground')finishWindowIntro();
   try{screen.orientation?.lock?.('landscape').catch(()=>{});}catch{}return;}
  if(act==='recharge'){recharge();return;}
  if(act.startsWith('safe:')){safeAction(act.slice(5));return;}
  if(act==='read'){const note=s.inventory.notes.find(n=>n.id===node.dataset.id);if(note?.id==='mirror-note')showMirrorNote('bag');else if(note)showNote(note,'bag');return;}
  if(act==='bag'){bag();return;}
  if(act==='reset'){reset();if(ready&&!isPaused())sound.resume();return;}
  if(act==='hud'&&ready&&!cinematic){$('lab-camera-settings').open=false;phone.edit();return;}
  if(act==='copy-mix'){void copyMix();return;}
  if(act.startsWith('audio:')){void previewAudio(act.slice(6));return;}
  if(isPaused())return;
  if(events.phase==='arrival'||events.phase==='safe'||events.phase==='failed')return;
  if(act==='emotes'&&inBathroom()&&!noteLift){$('house-emotes').hidden=!$('house-emotes').hidden;resetInput();return;}
  if(act.startsWith('emote:')&&inBathroom()&&!noteLift){
   const id=act.slice(6);$('house-emotes').hidden=true;
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
  const label=s.hidden?'ESCONDIDA · USAR PARA SALIR':s.lying?'ACOSTADA · USAR PARA LEVANTARTE':target?`${target.label} · USAR`:'';
  $('lab-focus').textContent=label;
  root.classList.toggle('lab-flash-off',!s.flashlight);
  $('house-light').hidden=equipment!=='flashlight'||!!s.hidden||!!s.lying;
  $('house-use-phone').hidden=equipment!=='phone'||!!noteLift||!!s.hidden||!!s.lying;
  const canEmote=inBathroom()&&!noteLift;
  root.querySelector('[data-act=emotes]').hidden=!canEmote;
  if(!canEmote)$('house-emotes').hidden=true;
  $('lab-objective').textContent=config.entry==='mirror'?'◇ Prueba de espejo':demo?(puzzle.rescued?'♥ ¡Louis está a salvo!':!puzzle.note?'✉ Busca la nota del pasillo':!puzzle.key?'⚿ Abre el cajón del estudio y recoge la llave':!puzzle.symbol?(!mirrorSafe.collected?'✉ Busca la nota del escritorio':mirrorSafe.revealed?'◇ Abre la caja fuerte del salón':mirrorSafe.hintShown?'◇ Prueba el espejo del baño':'✉ Descifra la nota de escritura extraña'):!puzzle.door?'🚪 Sube y abre el dormitorio':'♡ Encuentra a Louis dentro del dormitorio'):'Explora libremente · E interactuar';
  if(events.phase==='hide')$('lab-objective').textContent='Busca un escondite · armario o bajo la cama';
  if(events.phase==='hunt')$('lab-objective').textContent='Evita su mirada · escóndete sin que te vea entrar';
  if(events.phase==='evaded')$('lab-objective').textContent='El paso está libre · encuentra a Louis en el dormitorio';
  if(getStairDirection(s)==='Escaleras')$('lab-objective').textContent+=' · ↑↓ Escaleras';
  const meter=$('house-charge'),charge=Math.ceil(s.battery);
  meter.hidden=isSuspended()||!!cinematic||events.phase==='arrival'||phone.open;
  if(meter.getAttribute('aria-valuenow')!==String(charge)){
   meter.setAttribute('aria-valuenow',charge);meter.dataset.level=charge<=FLASH_LOW?'low':'normal';
   $('lab-charge').style.width=charge+'%';$('lab-charge-text').textContent=charge+'%';
  }
  const interactButton=$('lab-interact');interactButton.hidden=!target&&!s.hidden&&!s.lying;
  interactButton.disabled=!!target?.motion||!!poseTransition;
  root.querySelector('.lab-cross').classList.toggle('lab-target',!!target);
  interactButton.querySelector('small').textContent=s.hidden||s.lying?'Salir':!target?'Usar':target.kind==='door'?(target.open?'Cerrar puerta':'Abrir puerta'):target.kind==='key'?'Recoger llave':target.kind==='note'?'Leer nota':target.kind==='drawer'?(target.open?'Cerrar cajón':'Abrir cajón'):target.kind==='rescue'?'Rescatar':'Examinar';
  if(target?.kind==='hide')interactButton.querySelector('small').textContent=target.hideType==='wardrobe'?'Entrar en armario':'Esconderse';
  if(target?.kind==='battery')interactButton.querySelector('small').textContent='Recoger pila';
  if(target?.kind==='television')interactButton.querySelector('small').textContent='Encender tele';
  if(target?.kind==='tap')interactButton.querySelector('small').textContent=target.on?'Cerrar llave':'Abrir llave';
  if(target?.kind==='cupboard')interactButton.querySelector('small').textContent=target.open?'Cerrar refrigerador':'Abrir refrigerador';
  if(target?.kind==='safe')interactButton.querySelector('small').textContent=mirrorSafe.opened?'Ver contenido':'Introducir código';
  if(target?.kind==='light-switch')interactButton.querySelector('small').textContent=target.circuit.on?'Apagar luz':'Encender luz';
  if(poseTransition)interactButton.querySelector('small').textContent=poseTransition.entering?'Entrando…':'Saliendo…';
  if(target?.motion)interactButton.querySelector('small').textContent=target.state==='opening'?'Abriendo…':'Cerrando…';
  interactButton.classList.toggle('lab-available',!!target||!!s.hidden||!!s.lying);
  $('lab-crouch').classList.toggle('lab-available',s.crouched);
  $('lab-crouch').setAttribute('aria-pressed',String(s.crouched));$('lab-crouch').setAttribute('aria-label',s.crouched?'Levantarse':'Agacharse');$('lab-crouch').querySelector('small').textContent=s.crouched?'Levantar':'Agachar';
  if(!demo&&$('lab-camera-settings').open)$('lab-metrics').textContent=`${fps} FPS · ${ctxRoom(s)} · altura ${s.y.toFixed(1)} m · rumbo ${Math.round((s.yaw*180/Math.PI%360+360)%360)}°`;
 }
 function tick(dt){
  if(isPaused())return;
  updateFurniture(world.objects,dt,s);
  if(demo&&!puzzle.door&&world.objects.find(o=>o.id==='dormitorio').open)puzzle=puzzleEvent(puzzle,'door');
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
  const speed=s.crouched?1.05:2.60;
  const dx=(Math.sin(s.yaw)*velocity.forward+Math.cos(s.yaw)*velocity.side)*speed*dt;
  const dz=(Math.cos(s.yaw)*velocity.forward-Math.sin(s.yaw)*velocity.side)*speed*dt;
  const body=s.crouched?1.04:1.64;
  const moved=navigate(s,world,dx,dz,body);
  s.eye+=( (s.crouched?1.03:1.63)-s.eye)*Math.min(1,dt*9);
  if(moved>.0001)s.bob+=moved*(s.crouched?5:8);
  for(const cue of floorSounds.advance(dt,s,moved))play(cue.kind,cue.origin?{...cue.origin,y:cue.origin.y+.25}:null,cue.level);
 }
 let statsAt=performance.now(),frameCount=0,slowSeconds=0;
 function updateStory(delta){
  if(!demo||config.entry==='rescue'||isSuspended()||cinematic)return;
  const change=events.observe(puzzle);
  if(change==='message')sound.sequence('notification');
  if(change==='arrival'){
   sound.setThreat(true);
   cancelEmote();$('house-emotes').hidden=true;
   phone.close();resetInput();encounterCheckpoint={x:s.x,y:s.y,z:s.z,yaw:s.yaw,pitch:s.pitch};
   thirdView=null;for(const [dx,dz]of [[1.4,1.4],[-1.4,1.4],[0,1.8],[0,-1.8]]){const camera={x:s.x+dx,y:s.y+1.8,z:s.z+dz};if(!blocked(world.boxes,camera.x,camera.y-.1,camera.z,.1,.2)&&!lineBlocked(world.boxes,camera,{x:s.x,y:s.y+1.2,z:s.z})){thirdView={...camera,yaw:Math.atan2(-dx,-dz),pitch:-.2};break;}}
   setDoor(world.objects.find(o=>o.id==='entrada'),false);
  }
  if(pursuer.active){
   const hiding=s.hidden?world.objects.find(o=>o.id===s.hidden.objectId):poseTransition?.object;
   for(const signal of pursuer.update(Math.min(.055,delta),{x:s.x,y:s.y,z:s.z,crouched:s.crouched,flashlight:flashlightBeam(),hidden:!!s.hidden&&!poseTransition,entering:!!poseTransition?.entering,hideId:hiding?.id,hideExit:hiding?{x:hiding.returnX,y:s.y,z:hiding.returnZ}:null},door=>{if(!door.motion&&sweepClear(door,door.amount,1,pursuer)){const result=animateFurniture(door,true,{player:s,reducedMotion:reducedMotion.matches});if(result.started)play('door-open',door);}})){
    if(signal==='step')play(pursuer.y>.1&&pursuer.y<HEIGHT-.1?'stair':'wood',pursuer,.8);
    if(signal==='spotted'){phone.close();sound.sequence('alert');say('¡Te ha visto! Corre y rompe su línea de visión.',3);}
    if(signal==='lost')say('Te ha perdido de vista. Busca un escondite.',3);
   }
  }
  for(const cue of events.advance(delta,!!s.hidden&&!poseTransition,{caught:pursuer.caught,clear:pursuer.lost>4&&pursuer.awareness<.1,visited:pursuer.visited})){
   if(cue==='keys')sound.sequence('keys');if(cue==='knock')sound.sequence('trying');
   if(cue==='hide'){setDoor(world.objects.find(o=>o.id==='entrada'),false);resetInput();phone.close();say('¡Escóndete rápido! Tienes 10 segundos.',4);}
   if(cue==='hunt'){setDoor(world.objects.find(o=>o.id==='entrada'),true);play('door-open',world.objects.find(o=>o.id==='entrada'));pursuer.start();say('Ha entrado. Se oyen pasos hacia la escalera.',4);}
   if(cue==='evaded'){pursuer.retreat();sound.setThreat(false);sound.sequence('notification');say('Se aleja. Ahora busca a Louis en el dormitorio.',5);}
   if(cue==='safe'||cue==='failed'){phone.close();resetInput();sound.sequence('alert');showModal(cue==='safe'?'Estás a salvo':'Te descubrieron',cue==='safe'?'<p>Te quedas en silencio.</p>':'<p>El perseguidor te alcanzó o vio dónde te escondías.</p><p>Al reintentar conservarás la llave y las pistas de esta sesión.</p>',cue==='safe'?[['Volver a pruebas','exit']]:[['Reintentar desde la llegada','retry-arrival'],['Salir','exit']]);}
  }
 }
 function frame(now){
  if(!active)return;raf=requestAnimationFrame(frame);
  const limit=(paused||!!modal||$('lab-camera-settings').open||isPortrait()||document.hidden||!hasFocus)?1000/15:options.quality==='low'?1000/30:1000/60;
  if(now-lastPaint<limit-2)return;
  const shotDelta=Math.min(.1,Math.max(0,(now-last)/1000||0)),dt=Math.min(.055,shotDelta);last=now;lastPaint=now;
  if(!s||!renderer)return;
  updateHiding(dt);
  updateStory(shotDelta);
  let view=cameraOf(s),hand=!s.hidden&&!s.lying&&!poseTransition&&!animator.performing&&!phone.open,torch=flashlightBeam(),introHands=null,distance=0;
  if(cinematic){
   if(!paused&&!modal&&!isPortrait()&&!document.hidden&&hasFocus)cinematic.elapsed+=shotDelta;
   const progress=Math.min(1,cinematic.elapsed/WINDOW_SHOT_SECONDS);
   view=windowIntroCamera(progress);hand=false;torch=true;
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
  let thirdPerson=null,actorTime;
  if(events.phase==='arrival'){
   hand=false;phone.close();
   const timeSinceCut=events.time-2.9;
   if(timeSinceCut<0||!thirdView)view={x:6.8,y:1.63,z:10.15,yaw:Math.atan2(5.9-6.8,12-10.15),pitch:0};
   else {thirdPerson=cameraOf(s);view=thirdView;actorTime=timeSinceCut;}
   const door=world.objects.find(o=>o.id==='entrada');poseFurniture(door,reducedMotion.matches?0:.02+.015*Math.sin(events.time*45));
  }
  root.classList.toggle('house-arrival',events.phase==='arrival');
  danger.hidden=!['arrival','hide','hunt'].includes(events.phase);danger.dataset.level=pursuer.mode==='chase'?'chase':pursuer.awareness>.1?'watch':'search';danger.textContent=events.phase==='hide'?'¡ESCÓNDETE! '+Math.ceil(events.remaining)+' s':events.phase==='arrival'?'Alguien está intentando entrar…':pursuer.mode==='chase'?'¡TE PERSIGUE! Rompe su línea de visión':pursuer.awareness>.1?'Te está mirando · busca cobertura':s.hidden?'No salgas todavía · está registrando la casa':'Está buscando · armario o bajo la cama';
  root.classList.toggle('house-threat',!danger.hidden);
  if(!isSuspended())equipmentAge+=shotDelta;
  phone.update(events,isSuspended()?0:shotDelta);enableSound.hidden=!sound.settings.muted&&!!sound.context&&(sound.paused||sound.context.state==='running');
  const mirrorLit=torch||bathCircuit.on;
  if(!isPaused()&&!phone.open){
   if(noteHold>0)noteHold=Math.max(0,noteHold-dt);
   const wantsNote=mirrorLit&&inBathroom()&&mirrorSafe.collected&&!mirrorSafe.opened&&(!mirrorSafe.revealed||noteHold>0)&&events.phase==='explore';
   noteLift=reducedMotion.matches?Number(wantsNote):clamp(noteLift+(wantsNote?1:-1)*dt*2.6,0,1);
  }
  const raisedNote=noteLift>0&&!phone.open&&!cinematic&&events.phase!=='arrival'&&!s.hidden;
  const visualEquipment=raisedNote?'note':equipment,noteRaise=noteLift*noteLift*(3-2*noteLift);
  const outdoor=view.x<0||view.x>HOUSE.width||view.z<0||view.z>HOUSE.depth?1:Math.max(0,1-Math.min(view.x,HOUSE.width-view.x,view.z,HOUSE.depth-view.z)/1.5)*.22;
  sound.locate({room:roomAt(view.x,view.z,view.y-1.6),outdoor,hidden:!!s.hidden});
  try{
   renderer.render(view,torch,elapsed,hand,{bob:s.bob,action:handAction,clickAction,speed:animator.speed,acceleration:animator.acceleration,walkWeight:animator.weight,reduced:s.reduceBob,swayX:handDrift.x,swayY:handDrift.y,introHands,animator,feetY:s.y,crouched:s.crouched,equipment:visualEquipment,noteRaise,equipLift:raisedNote?-.52*(1-noteRaise):reducedMotion.matches?0:-.22*Math.pow(1-Math.min(1,equipmentAge/.3),2),bathDoorAmount:world.objects.find(o=>o.id==='bano').amount,thirdPerson,actorTime,pursuer:pursuer.snapshot()});
   if(capturePhoto){capturePhoto=false;if(phone.open&&phone.app==='camera')phone.takePhoto(canvas);}
   phone.updateCamera(canvas,now);
  }catch(e){contextLost=true;showModal('Error de renderizado',`<p>${escapeHTML(String(e.message||e))}</p>`,[['Volver a pruebas','exit']]);}
  const mirrorDistance=Math.hypot(view.x-BATH_MIRROR.x,view.z-BATH_MIRROR.z);
  const readingMirror=mirrorLit&&inBathroom()&&renderer.mirrorDrawn&&mirrorDistance<3&&Math.abs(view.pitch-Math.atan2(BATH_MIRROR.y-view.y,mirrorDistance))<.57&&!phone.open;
  const mirrorCue=mirrorSafe.advance(shotDelta,{active:!isPaused()&&!phone.open,mirror:readingMirror&&noteLift>=.95});
  if(mirrorCue==='hint')say(MIRROR_HINT,6);
  if(mirrorCue==='revealed'){noteHold=4;play('pickup');}
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
 try{renderer=new HouseRenderer(canvas,options.quality);reset();}catch(e){
  root.innerHTML=`<section class="lab-error"><h2>No se pudo abrir la casa 3D</h2><p>${escapeHTML(String(e.message||e))}</p><button data-act="exit">Volver a pruebas</button></section>`;
 }
 function pointerStick(e){if(!active||isPaused()||phone.open||events.phase==='arrival'||stickPointer!==null||e.button!==0)return;stickPointer=e.pointerId;stickPointerType=e.pointerType||'mouse';capture(e.currentTarget,e.pointerId);moveStick(e);e.preventDefault();}
 function drawStick(x,y){$('lab-stick').style.transform=`translate(${x*56}%,${y*56}%)`;}
 function moveStick(e){
  if(e.pointerId!==stickPointer)return;
  if(releasedPointer(e,stickPointerType)){endStick(e);return;}
  const r=$('lab-stick').parentElement.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  const dx=e.clientX-cx,dy=e.clientY-cy,dist=Math.hypot(dx,dy);
  const radius=Math.max(28,r.width*.45),normalized=Math.min(1,dist/radius),deadzone=.13;
  const amount=normalized<=deadzone?0:(normalized-deadzone)/(1-deadzone);
  const curved=amount*amount*(3-2*amount);
  joystick.x=dist<.01?0:dx/dist*curved;joystick.z=dist<.01?0:dy/dist*curved;
  drawStick(dist<.01?0:dx/dist*normalized,dist<.01?0:dy/dist*normalized);
  e.preventDefault();
 }
 function endStick(e){if(e.pointerId!==stickPointer)return;const pointer=stickPointer;stickPointer=null;stickPointerType=null;joystick.x=0;joystick.z=0;releaseCapture($('lab-joystick'),pointer);$('lab-stick').style.transform='translate(0,0)';}
 function pointerLook(e){if(isPaused()||phone.open||events.phase==='arrival'||lookPointer!==null||e.button!==0||e.target.closest('button,input,select,summary,.lab-diagnostics,.phone-screen,.house-hotbar,.house-emotes'))return;
  lookPointer=e.pointerId;lookPointerType=e.pointerType||'mouse';lookLast={x:e.clientX,y:e.clientY};capture(e.currentTarget,e.pointerId);e.preventDefault();}
 function moveLook(e){if(e.pointerId!==lookPointer)return;if(releasedPointer(e,lookPointerType)){endLook(e);return;}if(isPaused())return;const dx=e.clientX-lookLast.x,dy=e.clientY-lookLast.y;
  lookLast={x:e.clientX,y:e.clientY};
  lookTarget=applyLookDelta(lookTarget,dx,dy,options.sensitivity,options.invertX);
  if(s.hidden){const limit=s.hidden.hideType==='wardrobe'?.28:.6;lookTarget.yaw=clamp(lookTarget.yaw,s.hidden.yaw-limit,s.hidden.yaw+limit);lookTarget.pitch=clamp(lookTarget.pitch,-.14,.14);}
  e.preventDefault();}
 function endLook(e){if(e.pointerId!==lookPointer)return;const pointer=lookPointer;lookPointer=null;lookPointerType=null;releaseCapture($('lab-look'),pointer);}
 const stick=$('lab-joystick'),look=$('lab-look');
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
 root.addEventListener('click',e=>{const button=e.target.closest('[data-act]');if(button){e.preventDefault();runAction(button.dataset.act,button);}}, {signal});
 function endAudioPreview(){
  if(!audioPreview)return;
  audioPreview=false;sound.stopEmote();sound.pause();
 }
 $('lab-camera-settings')?.addEventListener('toggle',()=>{resetInput();endAudioPreview();if(isSuspended())sound.pause();else sound.resume();},{signal});
 root.querySelector('.house-mixer')?.addEventListener('toggle',e=>{if(!e.target.open)endAudioPreview();},{signal});
 reducedMotion.addEventListener('change',()=>{if(s)s.reduceBob=reducedMotion.matches||!options.bob;if(cinematic&&reducedMotion.matches)finishWindowIntro();},{signal});
 root.addEventListener('input',e=>{
  const field=e.target,key=field.dataset.setting;if(!key)return;
  if(key==='quality'){options.quality=field.value;renderer.quality=field.value;root.querySelectorAll('[data-setting="quality"]').forEach(el=>{if(el!==field)el.value=field.value;});}
  if(key==='sensitivity'){options.sensitivity=Number(field.value);root.querySelectorAll('[data-setting="sensitivity"]').forEach(el=>{if(el!==field)el.value=field.value;});saveCamera();}
  if(key==='invertX'){options.invertX=field.checked;saveCamera();}
  if(key==='bob'){options.bob=field.checked;if(s)s.reduceBob=!field.checked||reducedMotion.matches;}
  if(MIX_CHANNELS.some(([channel])=>channel===key)){
   sound.set(key,Number(field.value));
   root.querySelector(`[data-level="${key}"]`).textContent=Math.round(sound.settings[key]*100)+'%';
  }
  if(key==='mute')sound.set('muted',field.checked);
  root.querySelectorAll('[data-setting="'+key+'"]').forEach(el=>{if(el!==field){if(field.type==='checkbox')el.checked=field.checked;else el.value=field.value;}});
 },{signal});
 window.addEventListener('keydown',e=>{
  if(!active)return;const focused=e.target?.tagName;
  if(phone.editing){if(e.key==='Escape'){e.preventDefault();void phone.layoutAction('done');}else if(e.key==='Tab'){const panel=phone.host.querySelector(phone.preview?'.hud-preview-tools':'.hud-editor'),items=[...panel.querySelectorAll('button,input,select')];if(!panel.contains(document.activeElement)||(!e.shiftKey&&document.activeElement===items.at(-1))||(e.shiftKey&&document.activeElement===items[0])){e.preventDefault();(e.shiftKey?items.at(-1):items[0]).focus();}}return;}
  if(['INPUT','SELECT','TEXTAREA'].includes(focused))return;
  if(modal==='Caja fuerte'&&e.key!=='Tab'){if(/^\d$/.test(e.key)){e.preventDefault();safeAction(e.key);}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();safeAction(e.key==='Delete'?'clear':'back');}else if(e.key==='Enter'){e.preventDefault();safeAction('submit');}else if(e.key==='Escape'){e.preventDefault();modalClose();}return;}
  if((events.phase==='safe'||events.phase==='failed')&&!['Tab','Enter',' '].includes(e.key)){e.preventDefault();return;}
  if(['1','2','3'].includes(e.key)&&!isPaused()&&events.phase!=='arrival'){equip(['empty','flashlight','phone'][Number(e.key)-1]);return;}
  if(phone.open){if(e.key==='Escape'){e.preventDefault();phone.close();resetInput();}else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.preventDefault();phone.key(e.key);}else if(e.key==='Tab'){const b=[...root.querySelectorAll('.phone-screen button')],first=b[0],last=b.at(-1);if((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last)){e.preventDefault();(e.shiftKey?last:first).focus();}}return;}
  if((e.key==='p'||e.key==='P')&&equipment==='phone'){runAction('phone');return;}
  if(!e.repeat&&EMOTES.some(em=>em.key===e.key)){runAction('emote:'+EMOTES.find(em=>em.key===e.key).id);return;}
  if(!e.repeat&&(e.key==='m'||e.key==='M')){runAction('emotes');return;}
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
  if(e.key==='Tab'&&modal){
   const buttons=[...dialog.querySelectorAll('button,iframe,a[href]:not([hidden])')],first=buttons[0],lastButton=buttons.at(-1);
   if((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===lastButton)){e.preventDefault();(e.shiftKey?lastButton:first)?.focus();}return;
  }
  const key=movementKey(e);if(!isPaused()&&key&&(!e.repeat||keys.has(key)))keys.add(key);
  if(e.repeat)return;
  if(e.key==='Escape'){
   if(!$('house-emotes').hidden){$('house-emotes').hidden=true;return;}
   if($('lab-camera-settings').open){$('lab-camera-settings').open=false;resetInput();return;}
   if(modal){if(intro||contextLost)return;paused=false;modalClose();}else togglePause();return;
  }
  if(e.key==='e'||e.key==='E')runAction('interact');
  if(e.key==='f'||e.key==='F')runAction('flash');
  if(e.key==='c'||e.key==='C')runAction('crouch');
  if(e.key==='i'||e.key==='I')runAction('bag');
 },{signal});
 window.addEventListener('keyup',e=>{const key=movementKey(e);if(key)keys.delete(key);},{signal,capture:true});
 window.addEventListener('blur',()=>{hasFocus=false;resetInput();sound.pause();},{signal});
 window.addEventListener('focus',()=>{hasFocus=true;resetInput();last=performance.now();if(!isSuspended())sound.resume();},{signal});
 window.addEventListener('pagehide',()=>{hasFocus=false;resetInput();sound.pause();},{signal});
 window.addEventListener('pageshow',()=>{hasFocus=document.hasFocus();resetInput();last=performance.now();if(!isSuspended())sound.resume();},{signal});
 document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden){resetInput();sound.pause();}else if(!isSuspended())sound.resume();},{signal});
 window.addEventListener('resize',()=>{last=performance.now();resetInput();if(isPortrait())sound.pause();else if(!isSuspended())sound.resume();},{signal});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;showModal('Gráficos interrumpidos','<p>El navegador perdió el contexto WebGL.</p>',[['Volver a pruebas','exit']]);},{signal});
 if(renderer){
  for(const [key] of MIX_CHANNELS){
   root.querySelectorAll('[data-setting="'+key+'"]').forEach(el=>el.value=sound.settings[key]);
   root.querySelector(`[data-level="${key}"]`).textContent=Math.round(sound.settings[key]*100)+'%';
  }
  root.querySelectorAll('[data-setting="mute"]').forEach(el=>el.checked=sound.settings.muted);
  root.querySelectorAll('[data-setting="bob"]').forEach(el=>el.checked=options.bob);
  root.querySelectorAll('[data-setting="sensitivity"]').forEach(el=>el.value=options.sensitivity);
  root.querySelector('[data-setting="invertX"]').checked=options.invertX;
  root.querySelectorAll('[data-setting="quality"]').forEach(el=>el.value=options.quality);
  if(demo&&!config.trial&&checkpoint==='ground')runAction('start');
  else showModal(demo?'Rescata a Louis':'Explora la casa',`<p>Modo ${escapeHTML(points[checkpoint]||'Planta baja')}. Camina con el joystick izquierdo, mira arrastrando a la derecha y pulsa USAR sobre objetos cercanos.</p><p>${demo?'Lee la nota del pasillo y busca el cajón del estudio. Otra nota guarda la combinación de la caja fuerte del salón. Con la llave y el símbolo de su interior podrás entrar en el dormitorio.':'Hay dos plantas, recuerdos, una linterna y secretos pequeños.'}</p><p>Enciende las luces para ahorrar carga. Puedes cambiar la pila desde la mochila.</p>`,[['Entrar / activar sonido','start'],['Volver a pruebas','exit']]);
  raf=requestAnimationFrame(frame);
 }
 // Browser-only diagnostic hook: exercise real contextual picking and puzzle rules from
 // non-blocked player poses without altering the production build or saved game.
 if(import.meta.env.DEV&&demo){
  window.__rescueHouse={
   mirrorPuzzle:()=>({...mirrorSafe.snapshot(),noteLift,safe:(()=>{const o=world.objects.find(o=>o.id==='mirror-safe');return {amount:o.amount,state:o.state};})()}),
   story:()=>({pursuer:pursuer.snapshot(),samples:{loaded:sound.recordings?.buffers.size||0,played:sound.recordings?.played||0,last:sound.recordings?.lastPlayed,errors:sound.recordings?.errors||[]},phase:events.phase,time:events.time,remaining:events.remaining,messages:events.messages.map(m=>({...m})),equipment,phoneOpen:phone.open,hud:{...phone.layout,rect:phone.rect,editing:phone.editing},floorSounds:{steps:floorSounds.steps,triggers:floorSounds.triggers},audio:{lastEffect:sound.lastEffect,effects:sound.effectCount||0,voices:sound.foleyVoices?.size||0}}),
   intro:()=>cinematic?{elapsed:cinematic.elapsed,...windowIntroState(cinematic.elapsed/WINDOW_SHOT_SECONDS),camera:windowIntroCamera(cinematic.elapsed/WINDOW_SHOT_SECONDS)}:null,
   atmosphere:()=>({room:sound.atmosphere?.room,outdoor:sound.atmosphere?.outdoor,events:sound.atmosphere?.events,voices:sound.atmosphere?.voices.size,loops:sound.atmosphere?.loops.length,lastEvent:sound.atmosphere?.lastEvent,muted:sound.settings.muted,volume:sound.settings.ambient}),
   snapshot:()=>({puzzle:{...puzzle},position:{x:s?.x,y:s?.y,z:s?.z},camera:{yaw:s?.yaw,pitch:s?.pitch,targetYaw:lookTarget.yaw,invertX:options.invertX},cinematic:!!cinematic,quality:options.quality,fps,target:focus?.id??null,paused:isPaused(),controls:{look:lookPointer,stick:stickPointer,joystick:{...joystick}},reduceBob:s.reduceBob,flashlight:s.flashlight,notes:s.inventory.notes.length,drawer:(()=>{const o=world.objects.find(o=>o.id==='drawer');return {state:o.state,amount:o.amount,z:o.box.z,key:world.objects.find(o=>o.id==='key').z,contentsAvailable:world.objects.find(o=>o.id==='key').interactable,contentsConcealed:world.objects.find(o=>o.id==='key').concealed}})(),doors:world.objects.filter(o=>o.kind==='door').map(o=>({id:o.id,open:o.open,state:o.state,amount:o.amount,x:o.box.x,z:o.box.z,yaw:o.box.yaw,solid:o.box.solid})),handVisible:renderer.lastShowHand,hidden:!!s.hidden,hideType:s.hidden?.hideType,poseTransition:poseTransition?{entering:poseTransition.entering,elapsed:poseTransition.elapsed}:null,view:cameraOf(s),wardrobeAmount:world.objects.find(o=>o.id==='wardrobe').amount,music:{scheduled:sound.musicStep,voices:sound.musicNodes.size,timer:sound.musicTimer!==null,volume:sound.settings.music},sound:sound.context?.state,mirror:{supported:renderer.mirrorSupported,drawn:renderer.mirrorDrawn,vertices:renderer.kittyVertices?.length/16,uploads:renderer.mirrorUploads},animation:{...animator.snapshot(),rigEvaluations:renderer.characterBinding?.evaluations},geometry:{vertices:renderer.vertexCount,triangles:renderer.triangleCount}}),
   setPose:(pose)=>{if(blocked(world.boxes,pose.x,pose.y,pose.z,.2,1.7))throw Error('Blocked test pose');Object.assign(s,pose);resetInput();focus=null;},
   interactWith:async(id,activate=true)=>{
    const o=world.objects.find(o=>o.id===id&&!o.taken);if(!o)throw Error('Not available: '+id);
    modalClose();paused=false;ready=true;s.hidden=null;s.lying=false;s.crouched=false;s.eye=1.63;s.pitch=0;
    const y=o.y>HEIGHT ? HEIGHT : 0;
    let found=false;
    for(const radius of [.65,.8,1.0,1.25,1.5,1.85,2.15]){
     if(found)break;
     for(let i=0;i<32;i++){
      const a=i*Math.PI*2/32,x=o.x+Math.cos(a)*radius,z=o.z+Math.sin(a)*radius;
      if(blocked(world.boxes,x,y,z,.2,1.7))continue;
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
 function stop(){if(!active)return;active=false;cancelAnimationFrame(raf);controller.abort();closeTelevision();phone.destroy();sound.destroy();renderer?.destroy();if(window.__rescueHouse)delete window.__rescueHouse;root.remove();}
 return stop;
}
