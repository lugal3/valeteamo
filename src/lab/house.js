import {createHouse,HEIGHT,blocked,groundHeight,lineBlocked,setDoor,setDrawer} from './world.js';
import {HouseRenderer,pickupGeometry} from './renderer.js';
import {HouseSound} from './sound.js';
import {applyLookDelta,followLook,readCameraSettings,writeCameraSettings,DEFAULT_CAMERA_SETTINGS} from './camera-controls.js';
import {WINDOW_SHOT_SECONDS,WINDOW_LANDING,windowIntroCamera,shouldPlayWindowIntro} from './window-intro.js';
import {navigate,smoothAxis,getStairDirection} from './navigation.js';
import {interactionTarget,canApproachDoor} from './interactions.js';
import {animateFurniture,updateFurniture} from './furniture-motion.js';
import {createHousePuzzle,puzzleEvent,canOpenDrawer,canOpenBedroom,canRescue,PUZZLE_HINTS} from '../demo/house-puzzles.js';
import './house.css';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canStand=(state,world)=>!blocked(world.boxes,state.x,state.y,state.z,.2,1.69);
function cameraOf(s){
 if(s.hidden){const o=s.hidden;return {x:o.x,y:o.y,z:o.z,yaw:s.yaw,pitch:s.pitch};}
 const eye=s.lying?.64:s.eye;
 return {x:s.x,y:s.y+eye+(!s.crouched&&!s.lying&&!s.reduceBob?Math.sin(s.bob)*.024:0),z:s.z,yaw:s.yaw,pitch:s.pitch};
}
function closestObject(world,state,previous=null){
 if(state.hidden||state.lying)return null;
 return interactionTarget(world,cameraOf(state),previous);
}
const ctxRoom=(state)=>{
 if(getStairDirection(state)==='Escaleras')return 'escalera';
 if(state.y>HEIGHT*.52){
  if(state.x<4.45&&state.z<5.4)return 'dormitorio';
  if(state.x>7.55&&state.z<4.45)return 'habitación de recuerdos';
  return 'planta alta';
 }
 if(state.x<4.05)return state.z>6.4?'cocina':'estudio';
 return state.x>7.65?'salón':'pasillo';
};
export function launchHouse(onExit,checkpoint='ground',config={}){
 const demo=config.demo===true;
 const root=document.createElement('div');root.id='lab3d';root.innerHTML=`
 <canvas id="lab-canvas" aria-label="Escenario tridimensional interactivo de la casa"></canvas>
 <div class="lab-vignette" aria-hidden="true"></div>
 <div class="lab-window-intro lab-hidden" id="lab-window-intro" aria-label="Entrada cinematográfica por la ventana">
   <div class="lab-intro-top"></div>
   <div class="lab-intro-caption" id="lab-intro-caption">Una ventana entreabierta…</div>
   <button data-act="skip-intro" aria-label="Saltar la animación de entrada">Saltar intro ↗</button>
   <div class="lab-intro-bottom"></div>
 </div>
 <div class="lab-cross" aria-hidden="true">+</div>
 <div class="lab-top">
   <button data-act="exit" class="lab-exit">← ${demo?'Cumpleaños':'Pruebas'}</button>
   <div class="lab-title"><b>CASA DE LOS RECUERDOS</b><small id="lab-floor">PLANTA BAJA · EXPLORACIÓN</small></div>
   <details class="lab-camera-settings" id="lab-camera-settings"><summary aria-label="Ajustes de la casa">⚙ Ajustes</summary><div class="lab-camera-panel">
     <label>Velocidad de giro <input data-setting="sensitivity" aria-label="Sensibilidad de giro" type="range" min=".35" max="2" step=".05" value=".82"></label>
     <label class="lab-invert-label"><input data-setting="invertX" type="checkbox"> Invertir giro horizontal</label>
     <label>Calidad de imagen <select data-setting="quality" aria-label="Calidad gráfica"><option value="medium">Detalles (auto)</option><option value="low">Modo fluido</option></select></label>
     <small>Arrastra a la derecha para mirar a la derecha.</small>
     <label class="lab-preference"><input data-setting="bob" type="checkbox" checked> Balanceo al caminar</label>
     <label class="lab-preference"><input data-setting="mute" type="checkbox"> Silenciar la casa</label>
     <label>Ambiente <input data-setting="ambient" aria-label="Volumen de ambiente" type="range" min="0" max="1" step=".05" value=".4"></label>
     <label>Efectos <input data-setting="effects" aria-label="Volumen de efectos" type="range" min="0" max="1" step=".05" value=".68"></label>
     <button data-act="reset">Reiniciar casa</button>
     <small class="lab-settings-note">WASD: caminar · Flechas: mirar · E: usar · F: luz · I: mochila · Esc: pausa</small>
   </div></details>
   <button data-act="pause" aria-label="Pausar">Ⅱ</button>
 </div>
 <div class="lab-focus" id="lab-focus" role="status"></div>
  <div class="lab-objective" id="lab-objective">✿ Explora la casa · sigue las pistas</div>
  <div class="lab-compass" id="lab-compass" aria-hidden="true">N ↑</div>
 <div class="lab-toast" id="lab-toast" role="status" aria-live="polite"></div>
 <div class="lab-power ${demo?'lab-hidden':''}"><span>☼ LINTERNA</span><div class="lab-powerbar"><i id="lab-charge"></i></div><strong id="lab-charge-text">100%</strong></div>
 <div class="lab-joystick" id="lab-joystick" aria-label="Joystick izquierdo, arrastrar para caminar"><div class="lab-stick-ring"><div id="lab-stick" class="lab-stick-thumb">♡</div></div><span>CAMINAR</span></div>
 <div class="lab-look" id="lab-look" aria-label="Arrastrar para mirar"></div>
 <div class="lab-buttons">
  <button data-act="interact" id="lab-interact" hidden><span>🐾</span><small>USAR</small></button>
  <button data-act="crouch" id="lab-crouch" class="${demo?'lab-hidden':''}">♧<small>AGACHAR</small></button>
  <button data-act="flash">☼<small>LUZ</small></button>
  <button data-act="bag">▣<small>MOCHILA</small></button>
 </div>
 <div id="lab-turn" class="lab-turn"><div><span>↻</span><h2>Gira tu teléfono</h2><p>La casa se explora en horizontal. Tu lugar se conserva y el mundo queda en pausa.</p><button data-act="exit">Volver a pruebas</button></div></div>
 <div id="lab-dialog" class="lab-dialog lab-hidden"></div>
 <details id="lab-diagnostics" class="lab-diagnostics ${demo?'lab-hidden':''}"><summary>Diagnóstico / ajustes</summary>
  <div id="lab-metrics">Cargando…</div>
  <label>Sensibilidad de cámara <input data-setting="sensitivity" type="range" min=".45" max="2" step=".05" value="1"></label>
  <label><input data-setting="bob" type="checkbox" checked> Balanceo de cámara</label>
  <label>Calidad <select data-setting="quality"><option value="medium">Media · hasta 60 FPS</option><option value="low">Baja · hasta 30 FPS</option></select></label>
  <label>Ambiente <input data-setting="ambient" type="range" min="0" max="1" step=".05" value=".4"></label>
  <label>Efectos <input data-setting="effects" type="range" min="0" max="1" step=".05" value=".68"></label>
  <label><input data-setting="mute" type="checkbox"> Silenciar</label>
  <button data-act="reset">Reiniciar escenario</button>
 </details>`;
 document.body.appendChild(root);
 const $=id=>root.querySelector('#'+id),canvas=$('lab-canvas'),dialog=$('lab-dialog');
 const controller=new AbortController(),signal=controller.signal;
 let renderer,world,puzzle=createHousePuzzle(config.entry),sound=new HouseSound(),s,raf=0,last=0,lastPaint=0,fps=0,elapsed=0,toastUntil=0,lookPointer=null,stickPointer=null;
 let active=true,ready=false,hasFocus=true,focus=null,lookLast={x:0,y:0},paused=false,modal='',intro=true,contextLost=false;
 let lookTarget={yaw:Math.PI,pitch:0},cinematic=null,handAction=0,lastInteraction=-Infinity;
 const manuallyClosed=new Set(),reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const keys=new Set(),joystick={x:0,z:0},velocity={forward:0,side:0};
 const cameraSettings=(()=>{try{return readCameraSettings(window.localStorage)}catch{return {...DEFAULT_CAMERA_SETTINGS}}})();
 const options={sensitivity:cameraSettings.sensitivity,invertX:cameraSettings.invertX,bob:!reducedMotion.matches,quality:'medium'};
 const saveCamera=()=>{try{writeCameraSettings(window.localStorage,options)}catch{}};
 const points={ground:'Planta baja',upstairs:'Planta alta',sound:'Iluminación / sonido',interactions:'Interacciones'};
 const say=(text,seconds=2.4)=>{$('lab-toast').textContent=text;toastUntil=performance.now()+seconds*1000;};
 const isPortrait=()=>window.innerHeight>window.innerWidth;
 const isPaused=()=>!ready||paused||!!modal||!!cinematic||$('lab-camera-settings').open||isPortrait()||document.hidden||!hasFocus||contextLost;
 function resetInput(){
  keys.clear();joystick.x=joystick.z=0;velocity.forward=velocity.side=0;
  const pairs=[[$('lab-look'),lookPointer],[$('lab-joystick'),stickPointer]];
  lookPointer=stickPointer=null;
  for(const [element,pointer] of pairs)if(pointer!==null&&element?.hasPointerCapture(pointer))element.releasePointerCapture(pointer);
  if($('lab-stick'))$('lab-stick').style.transform='translate(0,0)';
  if(s)lookTarget={yaw:s.yaw,pitch:s.pitch};
 }
 const modalClose=()=>{modal='';dialog.classList.add('lab-hidden');dialog.innerHTML='';resetInput();if(ready&&!isPaused())sound.resume();};
 function showModal(title,body,actions=[['Cerrar','close']]){
  modal=title;dialog.classList.remove('lab-hidden');
  dialog.innerHTML=`<section class="lab-paper" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}"><div class="lab-paper-mark">✿ ♡ ✿</div><h2>${escapeHTML(title)}</h2><div class="lab-paper-body">${body}</div><div class="lab-paper-actions">${actions.map(([label,act])=>`<button data-act="${escapeHTML(act)}">${escapeHTML(label)}</button>`).join('')}</div></section>`;
  resetInput();sound.pause();dialog.querySelector('button')?.focus({preventScroll:true});
 }
 function rebuild(){renderer.rebuild([...world.boxes,...pickupGeometry(world.objects)]);}
 function finishWindowIntro(){
  cinematic=null;root.classList.remove('lab-intro-active');$('lab-window-intro').classList.add('lab-hidden');
  Object.assign(s,WINDOW_LANDING);s.eye=WINDOW_LANDING.eye;s.bob=0;
  resetInput();
  if(ready&&!isPaused())sound.resume();
  last=performance.now();say('Kitty entra con cuidado por la ventana…',2.5);
 }
 function beginWindowIntro(){
  resetInput();
  cinematic={elapsed:0};root.classList.add('lab-intro-active');$('lab-window-intro').classList.remove('lab-hidden');
  $('lab-intro-caption').textContent='Una ventana entreabierta…';
 }
 function reset(){
  cinematic=null;paused=false;manuallyClosed.clear();lastInteraction=-Infinity;handAction=0;
  root.classList.remove('lab-intro-active');$('lab-window-intro').classList.add('lab-hidden');$('lab-camera-settings').open=false;
  world=createHouse(checkpoint);puzzle=createHousePuzzle(config.entry);
  if(demo){
   const key=world.objects.find(o=>o.id==='key');key.taken=!puzzle.drawer||puzzle.key;
   setDrawer(world.objects.find(o=>o.id==='drawer'),puzzle.drawer);
   world.objects.find(o=>o.id==='note-hall').text=PUZZLE_HINTS.note;
   world.objects.find(o=>o.id==='picture-stain').text=PUZZLE_HINTS.symbol;
   const door=world.objects.find(o=>o.id==='dormitorio');if(puzzle.door)setDoor(door,true);
   world.objects.push({id:'rescue-louis',kind:'rescue',label:'Rescatar a Louis',x:3.1,y:HEIGHT+1.25,z:.97,taken:false});
   world.boxes.push({id:'louis-head',x:3.1,y:HEIGHT+1.13,z:.97,w:.45,h:.52,d:.37,mat:'cream',solid:false});
   world.boxes.push({id:'louis-bow',x:3.25,y:HEIGHT+1.38,z:.96,w:.2,h:.16,d:.2,mat:'pink',solid:false});
  }
  const p=world.spawn;
  s={x:p.x,z:p.z,y:p.y,yaw:p.yaw,pitch:0,eye:1.63,crouched:false,hidden:null,lying:false,bob:0,
    flashlight:demo,battery:100,reduceBob:!options.bob||reducedMotion.matches,inventory:{notes:[],batteries:p.items?.batteries||0,key:demo?puzzle.key:!!p.items?.key},distanceSteps:0};
  focus=null;lookTarget={yaw:s.yaw,pitch:s.pitch};modalClose();keys.clear();rebuild();say('Escenario reiniciado · '+(points[checkpoint]||'planta baja'));
 }
 const listener=()=>cameraOf(s);
 const play=(name,o=null)=>{
  const loc=listener(),source=o?{x:o.x,y:o.y,z:o.z}:null;
  const occluded=source?lineBlocked(world.boxes,loc,source,o?.kind==='door'?'door-'+o.id:''):false;
  sound.effect(name,source,{...loc,yaw:s.yaw},occluded);
 };
 function toggleFlash(){if(s.hidden||s.lying)return;
  sound.resume();
  if(!demo&&!s.flashlight&&s.battery<=0){say('La linterna no tiene batería. Abre la mochila.');return;}
  s.flashlight=!s.flashlight;play('light');say(s.flashlight?'Linterna encendida':'Linterna apagada');
  handAction=1;
 }
 function crouch(){if(s.hidden||s.lying)return;
  if(s.crouched&&!canStand(s,world)){say('No hay espacio suficiente para levantarte');return;}
  s.crouched=!s.crouched;play('click');say(s.crouched?'Agachada':'De pie');
 }
 function exitPose(){
  const pose=s.hidden||s.lying;if(!pose)return;
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
  if(o.kind==='door'){
   if(demo&&o.id==='dormitorio'&&!canOpenBedroom(puzzle)){say(PUZZLE_HINTS.bedroom,4);play('door',o);return;}
   if(o.locked&&!s.inventory.key){say('La puerta tiene un pequeño candado. Busca una llave.');play('door',o);return;}
    const opening=!o.open,result=animateFurniture(o,opening,{player:s,reducedMotion:reducedMotion.matches});
    if(!result.started){if(result.reason==='blocked')say('No puedes mover la puerta mientras estás en el paso.');return;}
    if(opening)manuallyClosed.delete(o.id);else manuallyClosed.add(o.id);
    if(demo&&o.id==='dormitorio'&&opening&&result.complete)puzzle=puzzleEvent(puzzle,'door');
    play('door',o);say(opening?'Abriendo puerta…':'Cerrando puerta…');
  }else if(o.kind==='drawer'){
   if(demo&&!canOpenDrawer(puzzle)){say(PUZZLE_HINTS.drawer);return;}
    const opening=!o.open,result=animateFurniture(o,opening,{player:s,reducedMotion:reducedMotion.matches});
    if(!result.started){if(result.reason==='blocked')say('Deja un poco de espacio delante del cajón.');return;}
    if(demo&&opening){puzzle=puzzleEvent(puzzle,'drawer');world.objects.find(k=>k.id==='key').taken=puzzle.key;say(puzzle.key?'Ya guardaste la llave en la mochila.':'Abriendo el cajón… una llave con un lazo.',3);}
    rebuild();play('drawer',o);if(!demo)say(opening?'Abriendo cajón…':'Cerrando cajón…');
  }else if(o.kind==='battery'){o.taken=true;s.inventory.batteries++;rebuild();play('pickup',o);say('Pila guardada en la mochila');}
  else if(o.kind==='key'){o.taken=true;s.inventory.key=true;if(demo)puzzle=puzzleEvent(puzzle,'key');rebuild();play('pickup',o);say('Llave con lazo obtenida');}
  else if(o.kind==='note'){o.taken=true;s.inventory.notes.push({id:o.id,label:o.label,text:o.text});if(demo&&o.id==='note-hall')puzzle=puzzleEvent(puzzle,'note');rebuild();play('note',o);showModal(o.label,`<p>${escapeHTML(o.text)}</p>`);}
  else if(o.kind==='picture'||o.kind==='inspect'){
   if(demo&&o.id==='picture-stain'){puzzle=puzzleEvent(puzzle,'symbol');say('Símbolo del corazón recordado.',3);}
   play('click',o);showModal(o.label,`<p>${escapeHTML(o.text)}</p>`);
  }else if(o.kind==='rescue'){
   if(!demo||!canRescue(puzzle)){say(PUZZLE_HINTS.rescue);return;}
   puzzle=puzzleEvent(puzzle,'rescue');play('pickup',o);
   showModal('¡Louis está a salvo!', '<p>Kitty encuentra a Louis. La puerta se abre, las luces se encienden y juntos regresan al jardín.</p>',[['Terminar la demo','finish']]);
  }
  else if(o.kind==='bed'){
   s.lying={returnX:o.returnX,returnZ:o.returnZ};s.x=o.x;s.z=o.z-.25;s.pitch=-.08;
   play('bed',o);say('Te has acostado. Pulsa USAR para levantarte.');
  }else if(o.kind==='hide'){
   const target=o.hideType==='underbed'?{x:2.0,y:HEIGHT+.48,z:3.45}:{x:.83,y:HEIGHT+1.25,z:4.24};
   s.hidden={...target,hideType:o.hideType,returnX:o.returnX,returnZ:o.returnZ,yaw:s.yaw};
   s.pitch=0;play('hide',o);say('Estás escondida. Pulsa USAR para salir.');
  }
 }
 function bag(){
  const notes=s.inventory.notes.map(n=>`<button class="lab-note" data-act="read" data-id="${escapeHTML(n.id)}">✉ ${escapeHTML(n.label)} ↗</button>`).join('')||'<p>Aún no hay notas guardadas.</p>';
  showModal('Mi mochila',`<p><b>⚿ Llave:</b> ${s.inventory.key?'Llave con lazo · abre el dormitorio':'Sin llave'}</p>${demo?'<p>☼ Linterna sin límite · F para encender o apagar.</p>':`<p><b>▣ Pilas:</b> ${s.inventory.batteries} · <b>Linterna:</b> ${Math.ceil(s.battery)}%</p>`}<div class="lab-note-list">${notes}</div>`,demo?[['Cerrar mochila','close']]:[['Recargar linterna','recharge'],['Cerrar mochila','close']]);
 }
 function recharge(){
  if(s.battery>=99.9){say('La linterna ya está llena');return;}
  if(s.inventory.batteries<1){say('No hay pilas en tu mochila');return;}
  s.inventory.batteries--;s.battery=Math.min(100,s.battery+55);play('pickup');say('Linterna recargada · '+Math.ceil(s.battery)+'%');bag();
 }
 function togglePause(){if(!ready||cinematic||contextLost)return;paused=!paused;if(paused){sound.pause();showModal('Pausa',`<p>El tiempo de la casa y sus sonidos se han detenido.</p>`,[['Continuar','resume'],['Volver a pruebas','exit']]);}else{modalClose();sound.resume();}}
 function runAction(act,node){
  if(act==='exit'){stop();onExit();return;}
  if(act==='finish'){config.onRescue?.();return;}
  if(act==='skip-intro'){if(cinematic)finishWindowIntro();return;}
  if((!ready||cinematic||contextLost)&&act!=='start')return;
  if(act==='close'){paused=false;modalClose();if(!isPaused())sound.resume();return;}
  if(act==='start'){intro=false;modalClose();ready=true;
   void sound.start().then(ok=>{if(!active)return;if(isPaused()&&!cinematic)sound.pause();if(!ok)say('Toca Luz o abre Ajustes para activar el sonido');});
   const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
   if(shouldPlayWindowIntro({demo,trial:config.trial,checkpoint,reducedMotion:reduce}))beginWindowIntro();
   else if(demo&&!config.trial&&checkpoint==='ground')finishWindowIntro();
   try{screen.orientation?.lock?.('landscape').catch(()=>{});}catch{}return;}
  if(act==='pause'){togglePause();return;}
  if(act==='resume'){paused=false;modalClose();sound.resume();return;}
  if(act==='recharge'){recharge();return;}
  if(act==='read'){const note=s.inventory.notes.find(n=>n.id===node.dataset.id);if(note)showModal(note.label,`<p>${escapeHTML(note.text)}</p>`,[['Volver a la mochila','bag']]);return;}
  if(act==='bag'){bag();return;}
  if(act==='reset'){reset();if(ready&&!isPaused())sound.resume();return;}
  if(isPaused())return;
  if(act==='interact')interact();if(act==='crouch')crouch();if(act==='flash')toggleFlash();
 }
 function autoOpenDoors(){
  if(!demo)return;
  let changed=false;
  for(const door of world.objects){
   if(manuallyClosed.has(door.id)){
    if(Math.hypot(door.x-s.x,door.z-s.z)>1.8)manuallyClosed.delete(door.id);
    else continue;
   }
   if(!canApproachDoor(world,s,door))continue;
   if(door.id==='dormitorio'&&!canOpenBedroom(puzzle))continue;
   if(door.locked&&!s.inventory.key)continue;
    const result=animateFurniture(door,true,{player:s,reducedMotion:reducedMotion.matches});if(!result.started)continue;changed=true;
    if(door.id==='dormitorio'&&result.complete)puzzle=puzzleEvent(puzzle,'door');
   play('door',door);say('La puerta se abre al acercarte',1.8);
  }
   // Moving meshes have their own buffers; static house geometry is preserved.
 }
 function updateControls(){
  const cam=cameraOf(s),target=closestObject(world,s,focus);focus=target;
  const label=s.hidden?'ESCONDIDA · USAR PARA SALIR':s.lying?'ACOSTADA · USAR PARA LEVANTARTE':target?`${target.label} · USAR`:'';
  $('lab-focus').textContent=label;
  $('lab-floor').textContent=(s.y>1.8?'PLANTA ALTA':'PLANTA BAJA')+' · '+ctxRoom(s).toUpperCase();
  root.classList.toggle('lab-flash-off',!s.flashlight);
  $('lab-compass').textContent=(Math.abs(Math.sin(s.yaw))>Math.abs(Math.cos(s.yaw))?(Math.sin(s.yaw)>0?'E':'O'):(Math.cos(s.yaw)>0?'S':'N'))+' ↑';
  $('lab-objective').textContent=demo?(puzzle.rescued?'♥ ¡Louis está a salvo!':!puzzle.note?'✉ Busca la nota del pasillo':!puzzle.key?'⚿ Abre el cajón del estudio y recoge la llave':!puzzle.symbol?'♡ Examina el cuadro del salón':!puzzle.door?'🚪 Sube y abre el dormitorio':'♡ Encuentra a Louis dentro del dormitorio'):'Explora libremente · E interactuar';
  if(getStairDirection(s)==='Escaleras')$('lab-objective').textContent+=' · ↑↓ Escaleras';
  $('lab-charge').style.width=s.battery+'%';$('lab-charge-text').textContent=Math.ceil(s.battery)+'%';
  const interactButton=$('lab-interact');interactButton.hidden=!target&&!s.hidden&&!s.lying;
  interactButton.disabled=!!target?.motion;
  root.querySelector('.lab-cross').classList.toggle('lab-target',!!target);
  interactButton.querySelector('small').textContent=s.hidden||s.lying?'Salir':!target?'Usar':target.kind==='door'?(target.open?'Cerrar puerta':'Abrir puerta'):target.kind==='key'?'Recoger llave':target.kind==='note'?'Leer nota':target.kind==='drawer'?(target.open?'Cerrar cajón':'Abrir cajón'):target.kind==='rescue'?'Rescatar':'Examinar';
  if(target?.motion)interactButton.querySelector('small').textContent=target.state==='opening'?'Abriendo…':'Cerrando…';
  interactButton.classList.toggle('lab-available',!!target||!!s.hidden||!!s.lying);
  $('lab-crouch').classList.toggle('lab-available',s.crouched);
  $('lab-diagnostics').querySelector('#lab-metrics').textContent=`${fps} FPS · x ${s.x.toFixed(1)} · z ${s.z.toFixed(1)} · altura ${s.y.toFixed(1)} m · ${options.quality} · batería ${Math.ceil(s.battery)}%`;
 }
 function tick(dt){
  if(isPaused())return;
  updateFurniture(world.objects,dt,s);
  if(demo&&!puzzle.door&&world.objects.find(o=>o.id==='dormitorio').open)puzzle=puzzleEvent(puzzle,'door');
  handAction=Math.max(0,handAction-dt*3.5);
  const turn=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0);
  lookTarget.yaw+=turn*dt*1.65;
  lookTarget.pitch=clamp(lookTarget.pitch+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt*1.12,-1.10,1.10);
  const follow=followLook(s,lookTarget,dt,20);s.yaw=follow.yaw;s.pitch=follow.pitch;
  let forward=(keys.has('w')||keys.has('W')?1:0)-(keys.has('s')||keys.has('S')?1:0)-joystick.z;
  let side=(keys.has('d')||keys.has('D')?1:0)-(keys.has('a')||keys.has('A')?1:0)+joystick.x;
  if(s.hidden||s.lying){forward=side=0;}
  const length=Math.hypot(forward,side);if(length>1){forward/=length;side/=length;}
  velocity.forward=smoothAxis(velocity.forward,forward,dt,12);
  velocity.side=smoothAxis(velocity.side,side,dt,12);
  const speed=s.crouched?1.05:2.60;
  const dx=(Math.sin(s.yaw)*velocity.forward+Math.cos(s.yaw)*velocity.side)*speed*dt;
  const dz=(Math.cos(s.yaw)*velocity.forward-Math.sin(s.yaw)*velocity.side)*speed*dt;
  const body=s.crouched?1.04:1.64;
  const moved=navigate(s,world,dx,dz,body);
  autoOpenDoors();
  s.eye+=( (s.crouched?1.03:1.63)-s.eye)*Math.min(1,dt*9);
  if(moved>.0001){s.bob+=moved*(s.crouched?5:8);s.distanceSteps+=moved;
   if(s.distanceSteps>.78){s.distanceSteps=0;play('footstep');}
  }
  if(s.flashlight&&!demo){s.battery=Math.max(0,s.battery-dt*.72);if(!s.battery){s.flashlight=false;play('light');say('La linterna se ha apagado. Necesitas una pila.');}}
  if(performance.now()>toastUntil)$('lab-toast').textContent='';
 }
 let statsAt=performance.now(),frameCount=0,slowSeconds=0;
 function frame(now){
  if(!active)return;raf=requestAnimationFrame(frame);
  const limit=(paused||!!modal||$('lab-camera-settings').open||isPortrait()||document.hidden||!hasFocus)?1000/15:options.quality==='low'?1000/30:1000/60;
  if(now-lastPaint<limit-2)return;
  const dt=Math.min(.055,Math.max(0,(now-last)/1000||0));last=now;lastPaint=now;
  if(!s||!renderer)return;
  let view=cameraOf(s),hand=true,torch=s.flashlight;
  if(cinematic){
   if(!isPortrait()&&!document.hidden&&hasFocus)cinematic.elapsed+=dt;
   const progress=Math.min(1,cinematic.elapsed/WINDOW_SHOT_SECONDS);
   view=windowIntroCamera(progress);hand=false;torch=true;
   $('lab-intro-caption').textContent=progress<.35?'Una ventana entreabierta…':progress<.72?'Kitty se cuela sin hacer ruido…':'Un nuevo mundo por explorar ♡';
   if(progress>=1){finishWindowIntro();view=cameraOf(s);hand=true;}
  }else{tick(dt);view=cameraOf(s);elapsed+=isPaused()?0:dt;}
  try{renderer.render(view,torch,elapsed,hand,{bob:s.bob,action:handAction,reduced:s.reduceBob});}catch(e){contextLost=true;showModal('Error de renderizado',`<p>${escapeHTML(String(e.message||e))}</p>`,[['Volver a pruebas','exit']]);}
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
 function pointerStick(e){if(!active||isPaused()||stickPointer!==null)return;stickPointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);moveStick(e);e.preventDefault();}
 function moveStick(e){
  if(e.pointerId!==stickPointer)return;
  const r=$('lab-stick').parentElement.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  const dx=e.clientX-cx,dy=e.clientY-cy,dist=Math.hypot(dx,dy);
  const radius=Math.max(28,r.width*.45),normalized=Math.min(1,dist/radius),deadzone=.13;
  const amount=normalized<=deadzone?0:(normalized-deadzone)/(1-deadzone);
  const curved=amount*amount*(3-2*amount);
  joystick.x=dist<.01?0:dx/dist*curved;joystick.z=dist<.01?0:dy/dist*curved;
  const drawn=Math.min(1,normalized)*r.width*.30;
  $('lab-stick').style.transform=`translate(${dist<.01?0:dx/dist*drawn}px,${dist<.01?0:dy/dist*drawn}px)`;
  e.preventDefault();
 }
 function endStick(e){if(e.pointerId!==stickPointer)return;stickPointer=null;joystick.x=0;joystick.z=0;$('lab-stick').style.transform='translate(0,0)';}
 function pointerLook(e){if(isPaused()||lookPointer!==null||e.target.closest('button,input,select,summary,.lab-diagnostics'))return;
  lookPointer=e.pointerId;lookLast={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();}
 function moveLook(e){if(isPaused()||e.pointerId!==lookPointer)return;const dx=e.clientX-lookLast.x,dy=e.clientY-lookLast.y;
  lookLast={x:e.clientX,y:e.clientY};
  lookTarget=applyLookDelta(lookTarget,dx,dy,options.sensitivity,options.invertX);
  if(s.hidden)lookTarget.yaw=clamp(lookTarget.yaw,s.hidden.yaw-.7,s.hidden.yaw+.7);
  e.preventDefault();}
 function endLook(e){if(e.pointerId===lookPointer)lookPointer=null;}
 const stick=$('lab-joystick'),look=$('lab-look');
 if(stick&&look){
  stick.addEventListener('pointerdown',pointerStick,{signal});stick.addEventListener('pointermove',moveStick,{signal});
  stick.addEventListener('pointerup',endStick,{signal});stick.addEventListener('pointercancel',endStick,{signal});
  look.addEventListener('pointerdown',pointerLook,{signal});look.addEventListener('pointermove',moveLook,{signal});
  look.addEventListener('pointerup',endLook,{signal});look.addEventListener('pointercancel',endLook,{signal});look.addEventListener('lostpointercapture',endLook,{signal});
  stick.addEventListener('lostpointercapture',endStick,{signal});
 }
 root.addEventListener('click',e=>{const button=e.target.closest('[data-act]');if(button){e.preventDefault();runAction(button.dataset.act,button);}}, {signal});
 $('lab-camera-settings')?.addEventListener('toggle',()=>{resetInput();if(isPaused())sound.pause();else sound.resume();},{signal});
 reducedMotion.addEventListener('change',()=>{if(s)s.reduceBob=reducedMotion.matches||!options.bob;if(cinematic&&reducedMotion.matches)finishWindowIntro();},{signal});
 root.addEventListener('input',e=>{
  const field=e.target,key=field.dataset.setting;if(!key)return;
  if(key==='quality'){options.quality=field.value;renderer.quality=field.value;root.querySelectorAll('[data-setting="quality"]').forEach(el=>{if(el!==field)el.value=field.value;});}
  if(key==='sensitivity'){options.sensitivity=Number(field.value);root.querySelectorAll('[data-setting="sensitivity"]').forEach(el=>{if(el!==field)el.value=field.value;});saveCamera();}
  if(key==='invertX'){options.invertX=field.checked;saveCamera();}
  if(key==='bob'){options.bob=field.checked;if(s)s.reduceBob=!field.checked||reducedMotion.matches;}
  if(key==='ambient')sound.set('ambient',Number(field.value));
  if(key==='effects')sound.set('effects',Number(field.value));
  if(key==='mute')sound.set('muted',field.checked);
  root.querySelectorAll('[data-setting="'+key+'"]').forEach(el=>{if(el!==field){if(field.type==='checkbox')el.checked=field.checked;else el.value=field.value;}});
 },{signal});
 window.addEventListener('keydown',e=>{
  if(!active)return;const focused=e.target?.tagName;
  if(['INPUT','SELECT','TEXTAREA'].includes(focused))return;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
  if(e.key==='Tab'&&modal){
   const buttons=[...dialog.querySelectorAll('button')],first=buttons[0],lastButton=buttons.at(-1);
   if((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===lastButton)){e.preventDefault();(e.shiftKey?lastButton:first)?.focus();}return;
  }
  if(!isPaused())keys.add(e.key);
  if(e.repeat)return;
  if(e.key==='Escape'){
   if($('lab-camera-settings').open){$('lab-camera-settings').open=false;resetInput();return;}
   if(modal){if(intro||contextLost)return;paused=false;modalClose();}else togglePause();return;
  }
  if(e.key==='e'||e.key==='E')runAction('interact');
  if(e.key==='f'||e.key==='F')runAction('flash');
  if(e.key==='c'||e.key==='C')runAction('crouch');
  if(e.key==='i'||e.key==='I')runAction('bag');
 },{signal});
 window.addEventListener('keyup',e=>keys.delete(e.key),{signal});
 window.addEventListener('blur',()=>{hasFocus=false;resetInput();sound.pause();},{signal});
 window.addEventListener('focus',()=>{hasFocus=true;last=performance.now();if(ready&&!isPaused())sound.resume();},{signal});
 document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden){resetInput();sound.pause();}else if(ready&&!isPaused())sound.resume();},{signal});
 window.addEventListener('resize',()=>{last=performance.now();resetInput();if(isPortrait())sound.pause();else if(ready&&!isPaused())sound.resume();},{signal});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;showModal('Gráficos interrumpidos','<p>El navegador perdió el contexto WebGL.</p>',[['Volver a pruebas','exit']]);},{signal});
 if(renderer){
  for(const key of ['ambient','effects'])root.querySelectorAll('[data-setting="'+key+'"]').forEach(el=>el.value=sound.settings[key]);
  root.querySelectorAll('[data-setting="mute"]').forEach(el=>el.checked=sound.settings.muted);
  root.querySelectorAll('[data-setting="bob"]').forEach(el=>el.checked=options.bob);
  root.querySelectorAll('[data-setting="sensitivity"]').forEach(el=>el.value=options.sensitivity);
  root.querySelector('[data-setting="invertX"]').checked=options.invertX;
  root.querySelectorAll('[data-setting="quality"]').forEach(el=>el.value=options.quality);
  if(demo&&!config.trial&&checkpoint==='ground')runAction('start');
  else showModal(demo?'Rescata a Louis':'Explora la casa',`<p>Modo ${escapeHTML(points[checkpoint]||'Planta baja')}. Camina con el joystick izquierdo, mira arrastrando a la derecha y pulsa USAR sobre objetos cercanos.</p><p>${demo?'Lee la nota del pasillo, busca el cajón del estudio y examina el cuadro del salón. Con la llave y el símbolo podrás entrar en el dormitorio. La linterna no se agota.':'Hay dos plantas, recuerdos, una linterna y secretos pequeños. Sin enemigo ni combate en esta prueba.'}</p>`,[['Entrar / activar sonido','start'],['Volver a pruebas','exit']]);
  raf=requestAnimationFrame(frame);
 }
 // Browser-only diagnostic hook: exercise real contextual picking and puzzle rules from
 // non-blocked player poses without altering the production build or saved game.
 if(import.meta.env.DEV&&demo){
  window.__rescueHouse={
   snapshot:()=>({puzzle:{...puzzle},position:{x:s?.x,y:s?.y,z:s?.z},camera:{yaw:s?.yaw,pitch:s?.pitch,targetYaw:lookTarget.yaw,invertX:options.invertX},cinematic:!!cinematic,quality:options.quality,fps,target:focus?.id??null,paused:isPaused(),controls:{look:lookPointer,stick:stickPointer,joystick:{...joystick}},reduceBob:s.reduceBob,flashlight:s.flashlight,notes:s.inventory.notes.length,drawer:(()=>{const o=world.objects.find(o=>o.id==='drawer');return {state:o.state,amount:o.amount,z:o.box.z,key:world.objects.find(o=>o.id==='key').z,contentsAvailable:world.objects.find(o=>o.id==='key').interactable,contentsConcealed:world.objects.find(o=>o.id==='key').concealed}})(),doors:world.objects.filter(o=>o.kind==='door').map(o=>({id:o.id,open:o.open,state:o.state,amount:o.amount})),sound:sound.context?.state,geometry:{vertices:renderer.vertexCount,triangles:renderer.triangleCount}}),
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
      if(closestObject(world,s,null)?.id===o.id){found=true;break;}
     }
    }
    if(!found)throw Error('No line-of-sight reachable pose for '+id);if(!activate){resetInput();return {position:{x:s.x,y:s.y,z:s.z}};}
    lastInteraction=-Infinity;resetInput();interact();if(o.motion)await new Promise(resolve=>{const check=()=>{if(!active||!o.motion)resolve();else requestAnimationFrame(check);};check();});return {puzzle:{...puzzle},position:{x:s.x,y:s.y,z:s.z}};
   }
  };
 }
 function stop(){if(!active)return;active=false;cancelAnimationFrame(raf);controller.abort();sound.destroy();renderer?.destroy();if(window.__rescueHouse)delete window.__rescueHouse;root.remove();}
 return stop;
}
