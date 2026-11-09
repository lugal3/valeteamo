import {DEFAULT_HUD,normalizeHUD,readHUD,writeHUD,hudRect} from './hud-layout.js';
const dockIcon=kind=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${kind==='empty'?'<path d="M6 14c0-4 12-4 12 0 0 5-3 7-6 7s-6-2-6-7Z"/><ellipse cx="6" cy="7" rx="2" ry="3"/><ellipse cx="12" cy="5" rx="2" ry="3"/><ellipse cx="18" cy="7" rx="2" ry="3"/>':kind==='flashlight'?'<path d="m6 4 12 0-2 8v8H8v-8Z"/><path d="M7 8h10M10 16h4M10 2h4"/>':'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4M11 5h2"/>'}</svg>`;

export class PhoneUI{
 constructor(root,onEquip,onClose,{canUse=()=>true,onEdit=()=>{}}={}){
  this.root=root;this.open=false;this.app='home';this.last='';this.score=0;this.direction=[1,0];this.pending=[1,0];this.resetSnake();
  this.canUse=canUse;this.onEdit=onEdit;this.editing=false;this.preview=false;
  try{this.layout=readHUD(window.localStorage);}catch{this.layout={...DEFAULT_HUD};}
  const host=document.createElement('div');host.className='house-equipment';host.innerHTML=`<nav class="house-hotbar" aria-label="Objetos equipados"><button data-equip="empty" aria-label="Mano vacía" title="1 · Mano vacía"><span>✋</span><small>1</small></button><button data-equip="flashlight" aria-label="Equipar linterna" title="2 · Linterna"><span>🔦</span><small>2</small></button><button data-equip="phone" aria-label="Equipar teléfono" title="3 · Teléfono"><span>📱</span><small>3</small><b class="phone-badge" hidden>●</b></button></nav><button class="phone-expand" hidden>Ver teléfono</button><div class="phone-notice" role="status" hidden></div>
  <section class="phone-screen" hidden role="dialog" aria-label="Teléfono de Kitty"><div class="phone-shell"><div class="phone-status"><span>9:41</span><i aria-hidden="true"></i><span>LTE ▰</span></div><header><button data-app="home" aria-label="Inicio del teléfono">⌂</button><b>Mi teléfono</b><button data-app="close" aria-label="Guardar teléfono">×</button></header><main tabindex="-1"></main><div class="phone-home-indicator" aria-hidden="true"></div></div><p class="phone-warning">La casa sigue en movimiento.</p></section>
  <section class="hud-editor" hidden role="dialog" aria-label="Editar controles"><h2>Coloca tu hotbar</h2><p>La casa queda en pausa mientras ajustas.</p><label>Anclaje <select data-hud="anchor"><option value="left">Izquierda</option><option value="right">Derecha</option><option value="bottom">Abajo</option><option value="top">Arriba</option></select></label><label>Tamaño <input data-hud="size" type="range" min="40" max="64" step="2"></label><label>Desplazar X <input data-hud="x" type="range" min="-180" max="180" step="1"></label><label>Desplazar Y <input data-hud="y" type="range" min="-120" max="120" step="1"></label><label>Opacidad <input data-hud="opacity" type="range" min=".25" max=".9" step=".05"></label><output class="hud-measure"></output><div><button data-layout="copy">Copiar ajuste</button><button data-layout="reset">Restablecer</button><button data-layout="preview">Vista previa</button><button data-layout="done">Listo</button></div><small class="hud-copy-status" role="status"></small></section><div class="hud-preview-tools" hidden><output></output><button data-layout="back">Volver al editor</button><button data-layout="done">Listo</button></div>`;root.append(host);this.host=host;
  host.addEventListener('click',e=>{
   const action=e.target.closest('[data-layout]')?.dataset.layout;if(action){this.layoutAction(action);return;}
   if(this.editing||!canUse())return;
   const equip=e.target.closest('[data-equip]');if(equip){onEquip(equip.dataset.equip);return;}
   if(e.target.closest('.phone-expand')||e.target.closest('.phone-notice')){onEquip('phone');this.show();return;}
   const b=e.target.closest('[data-app]');if(b){if(b.dataset.app==='close'){this.close();onClose();}else{this.app=b.dataset.app;if(this.app==='snake')this.resetSnake();this.last='';}}
   if(e.target.classList.contains('phone-screen')){this.close();onClose();}
   const d=e.target.closest('[data-dir]');if(d)this.turn(Number(d.dataset.dir));
  });
  for(const button of host.querySelectorAll('[data-equip]'))button.querySelector('span').innerHTML=dockIcon(button.dataset.equip);
  host.addEventListener('input',e=>{const key=e.target.dataset.hud;if(!key)return;this.layout=normalizeHUD({...this.layout,[key]:e.target.value});this.applyLayout();try{writeHUD(window.localStorage,this.layout);}catch{}});
  this.resize=()=>this.applyLayout();window.addEventListener('resize',this.resize);this.applyLayout();
 }
 applyLayout(){
  const rect=hudRect(this.layout,this.root.clientWidth,this.root.clientHeight),nav=this.host.querySelector('.house-hotbar');this.rect=rect;
  this.root.dataset.hotbarAnchor=this.layout.anchor;this.root.style.setProperty('--hud-slot',rect.slot+'px');this.root.style.setProperty('--hud-opacity',this.layout.opacity);
  Object.assign(nav.style,{left:rect.x+'px',top:rect.y+'px',width:rect.w+'px',height:rect.h+'px'});nav.classList.toggle('vertical',rect.vertical);
  const expand=this.host.querySelector('.phone-expand'),below=rect.y+rect.h+6;
  const ex=rect.vertical?(this.layout.anchor==='left'?rect.x+rect.w+7:rect.x-111):rect.x+(rect.w-104)/2;
  const ey=rect.vertical?rect.y+rect.h-38:(below+34<this.root.clientHeight-8?below:rect.y-36);
  Object.assign(expand.style,{left:Math.min(this.root.clientWidth-112,Math.max(8,ex))+'px',top:ey+'px'});
  const text=`X ${rect.x} · Y ${rect.y} · ${Math.round(rect.w)} × ${Math.round(rect.h)} px · botón ${Math.round(rect.slot)} px`;
  this.host.querySelector('.hud-measure').textContent=text;this.host.querySelector('.hud-preview-tools output').textContent=text;
 }
 edit(){this.close();this.editing=true;this.preview=false;this.previousEditFocus=document.activeElement;this.syncEditor();this.onEdit(true);this.host.querySelector('[data-hud=anchor]').focus();}
 syncEditor(){this.host.querySelector('.hud-editor').hidden=!this.editing||this.preview;this.host.querySelector('.hud-preview-tools').hidden=!this.editing||!this.preview;this.root.classList.toggle('house-hud-editing',this.editing);for(const f of this.host.querySelectorAll('[data-hud]'))f.value=this.layout[f.dataset.hud];this.applyLayout();}
 async layoutAction(action){
  if(action==='done'){this.editing=false;this.preview=false;this.syncEditor();this.onEdit(false);if(this.previousEditFocus?.isConnected)this.previousEditFocus.focus();}
  if(action==='preview'||action==='back'){this.preview=action==='preview';this.syncEditor();this.host.querySelector(this.preview?'.hud-preview-tools button':'[data-hud=anchor]').focus();}
  if(action==='reset'){this.layout={...DEFAULT_HUD};try{writeHUD(window.localStorage,this.layout);}catch{}this.syncEditor();}
  if(action==='copy'){const text=JSON.stringify({...this.layout,viewport:[this.root.clientWidth,this.root.clientHeight],rect:this.rect});try{await navigator.clipboard.writeText(text);this.host.querySelector('.hud-copy-status').textContent='Ajuste copiado. Puedes pegarlo junto a tu captura.';}catch{this.host.querySelector('.hud-copy-status').textContent=text;}}
 }
 equip(kind){this.equipped=kind;for(const b of this.host.querySelectorAll('[data-equip]'))b.setAttribute('aria-pressed',String(b.dataset.equip===kind));this.host.querySelector('.phone-expand').hidden=kind!=='phone';if(kind!=='phone')this.close();}
 show(){if(!this.canUse()||this.editing)return;this.open=true;this.root.classList.add('house-phone-open');this.app='home';this.last='';this.previousFocus=document.activeElement;this.host.querySelector('.phone-screen').hidden=false;this.host.querySelector('[data-app=home]').focus();}
 close(){const wasOpen=this.open;this.open=false;this.root.classList.remove('house-phone-open');this.host.querySelector('.phone-screen').hidden=true;if(wasOpen&&this.previousFocus?.isConnected)this.previousFocus.focus();}
 resetSnake(){this.snake=[[4,6],[3,6],[2,6]];this.food=[9,6];this.direction=[1,0];this.pending=[1,0];this.clock=0;this.score=0;this.dead=false;}
 turn(index){const d=[[0,-1],[1,0],[0,1],[-1,0]][index];if(d[0]!==-this.direction[0]||d[1]!==-this.direction[1])this.pending=d;}
 key(key){const n={ArrowUp:0,w:0,ArrowRight:1,d:1,ArrowDown:2,s:2,ArrowLeft:3,a:3}[key];if(this.open&&this.app==='snake'&&n!==undefined)this.turn(n);}
 update(events,dt){
  const badge=this.host.querySelector('.phone-badge');badge.hidden=!events.notified||events.replied;const notice=this.host.querySelector('.phone-notice');notice.hidden=!events.notified||events.replied||this.open;notice.textContent='📩 Mi Luis ❤️ · Tienes un mensaje';
  if(!this.open)return;if(this.app==='messages')events.read();
  if(this.app==='snake'&&!this.dead){this.clock+=dt;if(this.clock>=.18){this.clock=0;this.direction=this.pending;const head=[this.snake[0][0]+this.direction[0],this.snake[0][1]+this.direction[1]],eat=head[0]===this.food[0]&&head[1]===this.food[1],body=eat?this.snake:this.snake.slice(0,-1);if(head.some(v=>v<0||v>=12)||body.some(p=>p[0]===head[0]&&p[1]===head[1]))this.dead=true;else{this.snake.unshift(head);if(eat){this.score++;const free=[];for(let x=0;x<12;x++)for(let y=0;y<12;y++)if(!this.snake.some(p=>p[0]===x&&p[1]===y))free.push([x,y]);if(free.length)this.food=free[Math.floor(Math.random()*free.length)];else this.dead=true;}else this.snake.pop();}}}
  const stamp=this.app+'|'+events.messages.length+'|'+(events.replyAt!==null)+'|'+this.score+'|'+this.dead;
  if(stamp!==this.last){this.last=stamp;const main=this.host.querySelector('main');main.innerHTML=this.app==='home'?`<div class="phone-apps"><button data-app="messages">💬<br>Mensajes</button><button data-app="snake">🐍<br>Snake</button><button data-app="photos">🌸<br>Galería</button><button data-app="camera">📷<br>Cámara</button></div>`:this.app==='messages'?`<h2>Mi Luis ❤️</h2><div class="phone-chat">${events.messages.map(m=>`<p class="${m.from==='Tú'?'outgoing':'incoming'}"><b>${m.from}</b><br>${m.text}</p>`).join('')||'<p>Aún no hay mensajes.</p>'}${events.replyAt!==null?'<p>Escribiendo…</p>':''}</div>`:this.app==='snake'?`<h2>Snake · ${this.score}</h2><canvas width="240" height="240" aria-label="Tablero de Snake"></canvas>${this.dead?'<p>Fin de partida</p><button data-app="snake">Reintentar Snake</button>':''}<div class="snake-controls"><button data-dir="0">↑</button><button data-dir="3">←</button><button data-dir="2">↓</button><button data-dir="1">→</button></div>`:'<h2>Sin conexión</h2><p>Esta aplicación todavía no está disponible.</p>';}
  if(this.app==='snake'){const c=this.host.querySelector('canvas').getContext('2d');c.fillStyle='#222b29';c.fillRect(0,0,240,240);c.fillStyle='#f49cba';c.fillRect(this.food[0]*20+2,this.food[1]*20+2,16,16);c.fillStyle='#bad59e';for(const [x,y]of this.snake)c.fillRect(x*20+1,y*20+1,18,18);}
 }
 destroy(){window.removeEventListener('resize',this.resize);this.host.remove();}
}
