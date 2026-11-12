import {DEFAULT_HUD,normalizeHUD,readHUD,writeHUD,hudRect} from './hud-layout.js';
import {formatPhoneTime} from './device-time.js';
import {phoneHome,phoneChat,phoneNotice,gallerySprites,earlierMessages} from './phone-content.js';
const dockIcon=kind=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${kind==='empty'?'<path d="M6 14c0-4 12-4 12 0 0 5-3 7-6 7s-6-2-6-7Z"/><ellipse cx="6" cy="7" rx="2" ry="3"/><ellipse cx="12" cy="5" rx="2" ry="3"/><ellipse cx="18" cy="7" rx="2" ry="3"/>':kind==='flashlight'?'<path d="m6 4 12 0-2 8v8H8v-8Z"/><path d="M7 8h10M10 16h4M10 2h4"/>':'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4M11 5h2"/>'}</svg>`;

export class PhoneUI{
 constructor(root,onEquip,onClose,{canUse=()=>true,canEquip=canUse,onEdit=()=>{},onPhoto=()=>{}}={}){
  this.root=root;this.open=false;this.app='home';this.last='';this.readCount=0;this.score=0;this.direction=[1,0];this.pending=[1,0];this.resetSnake();
  this.gallery=[...gallerySprites];this.selectedPhoto=null;this.photoCount=0;this.messageTimes=new WeakMap();this.messageCount=0;this.latestNotice=null;this.clockMinute=-1;this.history=earlierMessages();
  this.canUse=canUse;this.onEdit=onEdit;this.editing=false;this.preview=false;this.onPresentationChange=()=>{};
  try{this.layout=readHUD(window.localStorage);}catch{this.layout={...DEFAULT_HUD};}
  const host=document.createElement('div');host.className='house-equipment';host.innerHTML=`<nav class="house-hotbar" aria-label="Objetos equipados"><button data-equip="empty" aria-label="Mano vacía" title="1 · Mano vacía"><span></span><small>1</small></button><button data-equip="flashlight" aria-label="Equipar linterna" title="2 · Linterna"><span></span><small>2</small></button><button data-equip="phone" aria-label="Equipar teléfono" title="3 · Teléfono"><span></span><small>3</small><b class="phone-badge" hidden>●</b></button></nav><button class="phone-notice" type="button" hidden></button>
  <section class="phone-screen" hidden role="dialog" aria-modal="true" aria-label="Teléfono de Kitty"><div class="phone-shell" data-page="home"><div class="phone-status"><time></time><i aria-hidden="true"></i><svg viewBox="0 0 44 14" aria-hidden="true"><path fill="currentColor" d="M1 10h2v3H1zm4-3h2v6H5zm4-3h2v9H9zm4-3h2v12h-2zm8 3h17v6H21z"/><rect x="19" y="2" width="21" height="10" rx="2" stroke="currentColor" fill="none"/><path d="M42 5v4" stroke="currentColor"/></svg></div><header><button data-app="home" aria-label="Volver al inicio del teléfono">‹</button><b></b><button data-app="close" aria-label="Guardar teléfono">×</button></header><main tabindex="-1"></main><button class="phone-home-indicator" data-app="home" aria-label="Inicio del teléfono"></button></div></section>
  <section class="hud-editor" hidden role="dialog" aria-label="Editar controles"><h2>Coloca tu hotbar</h2><p>La casa queda en pausa mientras ajustas.</p><label>Anclaje <select data-hud="anchor"><option value="left">Izquierda</option><option value="right">Derecha</option><option value="bottom">Abajo</option><option value="top">Arriba</option></select></label><label>Tamaño <input data-hud="size" type="range" min="40" max="64" step="2"></label><label>Desplazar X <input data-hud="x" type="range" min="-180" max="180" step="1"></label><label>Desplazar Y <input data-hud="y" type="range" min="-120" max="120" step="1"></label><label>Opacidad <input data-hud="opacity" type="range" min=".25" max=".9" step=".05"></label><output class="hud-measure"></output><div><button data-layout="copy">Copiar ajuste</button><button data-layout="reset">Restablecer</button><button data-layout="preview">Vista previa</button><button data-layout="done">Listo</button></div><small class="hud-copy-status" role="status"></small></section><div class="hud-preview-tools" hidden><output></output><button data-layout="back">Volver al editor</button><button data-layout="done">Listo</button></div>`;root.append(host);this.host=host;
  const feed=root.querySelector('#house-messages');this.managedNotice=!!feed;if(feed){host.append(feed);feed.append(host.querySelector('.phone-notice'));}
  const nav=host.querySelector('.house-hotbar');nav.querySelector('[data-equip=empty]').remove();
  for(const [kind,label,key,icon] of [['key','Llave con lazo',4,'⚿'],['red-key','Llave roja',1,'⚿'],['paper','Nota',5,'▤']]){
   const button=document.createElement('button');button.type='button';button.dataset.equip=kind;button.setAttribute('aria-label',label);button.title=key+' · '+label;
   button.innerHTML='<span aria-hidden="true"></span><small>'+key+'</small>';button.querySelector('span').textContent=icon;nav.append(button);
  }
  host.addEventListener('click',e=>{
   const action=e.target.closest('[data-layout]')?.dataset.layout;if(action){this.layoutAction(action);return;}
   if(this.editing)return;
   const equip=e.target.closest('[data-equip]');if(equip){if(canEquip())onEquip(equip.dataset.equip);return;}
   if(!canUse())return;
   if(e.target.closest('.phone-notice')){onEquip('phone',false);this.show('messages');return;}
   const b=e.target.closest('[data-app]');if(b){if(b.dataset.app==='close'){this.close();onClose();}else{this.app=b.dataset.app;this.selectedPhoto=null;if(this.app==='snake')this.resetSnake();this.last='';}}
   if(e.target.closest('[data-photo=take]'))onPhoto();
   const photo=e.target.closest('[data-photo-index]');if(photo){this.selectedPhoto=this.gallery[Number(photo.dataset.photoIndex)];this.last='';}
   if(e.target.classList.contains('phone-screen')){this.close();onClose();}
   const d=e.target.closest('[data-dir]');if(d)this.turn(Number(d.dataset.dir));
  });
  for(const kind of ['flashlight','phone'])host.querySelector('[data-equip='+kind+'] span').innerHTML=dockIcon(kind);
  host.addEventListener('input',e=>{const key=e.target.dataset.hud;if(!key)return;this.layout=normalizeHUD({...this.layout,[key]:e.target.value});this.applyLayout();try{writeHUD(window.localStorage,this.layout);}catch{}});
  this.resize=()=>this.applyLayout();window.addEventListener('resize',this.resize);this.applyLayout();
 }
 applyLayout(){
  const nav=this.host.querySelector('.house-hotbar'),count=nav.querySelectorAll('button:not([hidden])').length;
  const rect=hudRect(this.layout,this.root.clientWidth,this.root.clientHeight,count);this.rect=rect;
  this.root.dataset.hotbarAnchor=this.layout.anchor;this.root.style.setProperty('--hud-slot',rect.slot+'px');this.root.style.setProperty('--hud-opacity',this.layout.opacity);
  Object.assign(nav.style,{left:rect.x+'px',top:rect.y+'px',width:rect.w+'px',height:rect.h+'px'});nav.classList.toggle('vertical',rect.vertical);
  const text=`X ${rect.x} · Y ${rect.y} · ${Math.round(rect.w)} × ${Math.round(rect.h)} px · botón ${Math.round(rect.slot)} px`;
  this.host.querySelector('.hud-measure').textContent=text;this.host.querySelector('.hud-preview-tools output').textContent=text;
  this.onPresentationChange();
 }
 edit(){this.close();this.editing=true;this.preview=false;this.previousEditFocus=document.activeElement;this.syncEditor();this.onEdit(true);this.host.querySelector('[data-hud=anchor]').focus();}
 syncEditor(){this.host.querySelector('.hud-editor').hidden=!this.editing||this.preview;this.host.querySelector('.hud-preview-tools').hidden=!this.editing||!this.preview;this.root.classList.toggle('house-hud-editing',this.editing);for(const f of this.host.querySelectorAll('[data-hud]'))f.value=this.layout[f.dataset.hud];this.applyLayout();}
 async layoutAction(action){
  if(action==='done'){this.editing=false;this.preview=false;this.syncEditor();this.onEdit(false);if(this.previousEditFocus?.isConnected)this.previousEditFocus.focus();}
  if(action==='preview'||action==='back'){this.preview=action==='preview';this.syncEditor();this.host.querySelector(this.preview?'.hud-preview-tools button':'[data-hud=anchor]').focus();}
  if(action==='reset'){this.layout={...DEFAULT_HUD};try{writeHUD(window.localStorage,this.layout);}catch{}this.syncEditor();}
  if(action==='copy'){const text=JSON.stringify({...this.layout,viewport:[this.root.clientWidth,this.root.clientHeight],rect:this.rect});try{await navigator.clipboard.writeText(text);this.host.querySelector('.hud-copy-status').textContent='Ajuste copiado. Puedes pegarlo junto a tu captura.';}catch{this.host.querySelector('.hud-copy-status').textContent=text;}}
 }
 equip(kind){for(const b of this.host.querySelectorAll('[data-equip]'))b.setAttribute('aria-pressed',String(b.dataset.equip===kind));if(kind!=='phone')this.close();}
 setInventory(inventory){
  const available={flashlight:inventory.torch,phone:true,key:inventory.key,'red-key':inventory.redKey,paper:!!inventory.pendingNote||inventory.notes.length>0};
  for(const button of this.host.querySelectorAll('[data-equip]'))button.hidden=!available[button.dataset.equip];
  this.applyLayout();
 }
 show(app='home'){
  if(!this.canUse()||this.editing||this.open)return;
  this.open=true;this.root.classList.add('house-phone-open');this.app=app;this.selectedPhoto=null;this.last='';this.previousFocus=document.activeElement;
  this.host.querySelector('.phone-screen').hidden=false;
  if(this.events)this.update(this.events,0);
  this.host.querySelector('[data-app=close]').focus();this.onPresentationChange();
 }
 close(){const wasOpen=this.open;this.open=false;this.root.classList.remove('house-phone-open');this.host.querySelector('.phone-screen').hidden=true;if(wasOpen&&this.previousFocus?.isConnected)this.previousFocus.focus();if(wasOpen)this.onPresentationChange();}
 resetSnake(){this.snake=[[4,6],[3,6],[2,6]];this.food=[9,6];this.direction=[1,0];this.pending=[1,0];this.clock=0;this.score=0;this.dead=false;}
 turn(index){const d=[[0,-1],[1,0],[0,1],[-1,0]][index];if(d[0]!==-this.direction[0]||d[1]!==-this.direction[1])this.pending=d;}
 key(key){const n={ArrowUp:0,w:0,ArrowRight:1,d:1,ArrowDown:2,s:2,ArrowLeft:3,a:3}[key];if(this.open&&this.app==='snake'&&n!==undefined)this.turn(n);}
 takePhoto(canvas){
  const image=document.createElement('canvas'),scale=Math.min(1,640/canvas.width);
  image.width=Math.round(canvas.width*scale);image.height=Math.round(canvas.height*scale);
  image.getContext('2d').drawImage(canvas,0,0,image.width,image.height);
  const photo={url:image.toDataURL('image/jpeg',.78),label:'Casa · '+formatPhoneTime()};
  this.gallery.unshift(photo);
  if(this.gallery.length>gallerySprites.length+8)this.gallery.splice(8,1);
  this.photoCount++;this.last='';
 }
 updateCamera(canvas,now){
  if(!this.open||this.app!=='camera'||now-(this.lastPreview||0)<125)return;
  const preview=this.host.querySelector('.phone-camera-view canvas');if(!preview)return;
  this.lastPreview=now;
  preview.getContext('2d').drawImage(canvas,0,0,preview.width,preview.height);
 }
 update(events,dt){
  this.events=events;
  const incoming=events.messages.filter(message=>message.from!=='Tú');
  this.messageCount=incoming.length;
  if(!this.messageCount)this.readCount=0;
  if(this.open&&this.app==='messages')this.readCount=this.messageCount;
  for(const message of events.messages)if(!this.messageTimes.has(message))this.messageTimes.set(message,formatPhoneTime());
  const latest=incoming.at(-1),unread=this.messageCount>this.readCount;
  this.host.querySelector('.phone-badge').hidden=!unread;
  const notice=this.host.querySelector('.phone-notice');
  if(!this.managedNotice)notice.hidden=!unread||this.open;
  if(latest&&latest!==this.latestNotice){notice.innerHTML=phoneNotice(latest,this.messageTimes.get(latest));this.latestNotice=latest;}
  if(!this.open)return;
  const minute=Math.floor(Date.now()/60000);
  if(this.clockMinute!==minute){this.clockMinute=minute;this.host.querySelector('.phone-status time').textContent=formatPhoneTime();}
  if(this.app==='messages')events.read();
  if(this.app==='snake'&&!this.dead){this.clock+=dt;if(this.clock>=.18){this.clock=0;this.direction=this.pending;const head=[this.snake[0][0]+this.direction[0],this.snake[0][1]+this.direction[1]],eat=head[0]===this.food[0]&&head[1]===this.food[1],body=eat?this.snake:this.snake.slice(0,-1);if(head.some(v=>v<0||v>=12)||body.some(p=>p[0]===head[0]&&p[1]===head[1]))this.dead=true;else{this.snake.unshift(head);if(eat){this.score++;const free=[];for(let x=0;x<12;x++)for(let y=0;y<12;y++)if(!this.snake.some(p=>p[0]===x&&p[1]===y))free.push([x,y]);if(free.length)this.food=free[Math.floor(Math.random()*free.length)];else this.dead=true;}else this.snake.pop();}}}
  const stamp=[this.app,events.messages.length,events.replyAt!==null,this.score,this.dead,this.photoCount].join('|');
  if(stamp!==this.last){this.last=stamp;this.renderApp(events,unread);}
  if(this.app==='snake'){const c=this.host.querySelector('canvas').getContext('2d');c.fillStyle='#222b29';c.fillRect(0,0,240,240);c.fillStyle='#f49cba';c.fillRect(this.food[0]*20+2,this.food[1]*20+2,16,16);c.fillStyle='#bad59e';for(const [x,y]of this.snake)c.fillRect(x*20+1,y*20+1,18,18);}
 }
 renderApp(events,unread){
  const shell=this.host.querySelector('.phone-shell'),main=shell.querySelector('main'),previous=shell.dataset.page;
  shell.dataset.page=this.app;
  shell.querySelector('header b').innerHTML={home:'',messages:'<span class="phone-avatar">L</span> Mi Luis ❤️',snake:'Snake · '+this.score,photos:'Fotos',camera:'Cámara'}[this.app];
  shell.querySelector('header [data-app=home]').hidden=this.app==='home';
  if(this.app==='home')main.innerHTML=phoneHome(unread);
  if(this.app==='messages'){
   main.innerHTML=phoneChat(events.messages,events.replyAt!==null,message=>this.messageTimes.get(message),this.history);
   const chat=main.querySelector('.phone-chat');chat.scrollTop=chat.scrollHeight;
  }
  if(this.app==='snake')main.innerHTML=`<canvas width="240" height="240" aria-label="Tablero de Snake"></canvas>${this.dead?'<button data-app="snake">Reintentar Snake</button>':''}<div class="snake-controls"><button data-dir="0" aria-label="Arriba">↑</button><button data-dir="3" aria-label="Izquierda">←</button><button data-dir="2" aria-label="Abajo">↓</button><button data-dir="1" aria-label="Derecha">→</button></div>`;
  if(this.app==='photos')main.innerHTML=this.selectedPhoto?`<button data-app="photos">‹ Todas las fotos</button><img class="phone-full-photo" src="${this.selectedPhoto.url}" alt="${this.selectedPhoto.label}">`:`<div class="phone-gallery">${this.gallery.map((photo,i)=>`<button data-photo-index="${i}"><img loading="lazy" src="${photo.url}" alt=""><span>${photo.label}</span></button>`).join('')}</div>`;
  if(this.app==='camera')main.innerHTML=`<div class="phone-camera-view"><canvas width="320" height="200" aria-label="Visor de la casa"></canvas></div><div class="phone-camera-actions"><button data-app="photos" aria-label="Abrir Fotos">${this.photoCount?`<img src="${this.gallery[0].url}" alt="">`:'▧'}</button><button data-photo="take" aria-label="Fotografiar la casa"></button></div>`;
  if(previous!==this.app)main.focus({preventScroll:true});
 }
 destroy(){window.removeEventListener('resize',this.resize);this.host.remove();}
}
