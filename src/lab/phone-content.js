import {deviceTime,formatPhoneTime} from './device-time.js';

const paths={
 music:'<path d="M10 18V5l10-2v13M10 9l10-2"/><ellipse cx="6.5" cy="18.5" rx="3.5" ry="2.5" fill="currentColor"/><ellipse cx="16.5" cy="16.5" rx="3.5" ry="2.5" fill="currentColor"/>',
 journal:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16M8 12h8M8 16h6"/>',
 weather:'<circle cx="9" cy="8" r="4" fill="#ffdf86" stroke="none"/><path d="M5 19a4 4 0 0 1 0-8 5 5 0 0 1 9-2 5 5 0 1 1 2 10z" fill="white" stroke="none"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 5v7l4 2"/>',
 calendar:'<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4m8-4v4M8 13h2m4 0h2m-8 4h2m4 0h2"/>',
 calculator:'<rect x="4" y="2" width="16" height="20" rx="3"/><path d="M7 5h10v4H7zM8 13h1m6 0h1m-8 4h1m6 0h1"/>',
 contacts:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2z"/>',
 heart:'<path d="M12 21 3 12C-2 5 7 0 12 7c5-7 14-2 9 5z" fill="currentColor" stroke="none"/>',
 settings:'<path d="M3 6h18M3 12h18M3 18h18"/><path d="M8 3v6m8 0v6m-7 0v6" stroke-width="3"/>',
 progress:'<path d="M5 20V4m0 1c5-4 9 4 15 0v9c-6 4-10-4-15 0"/>',
 maps:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15m6-12v15"/><path d="m5 12 4-2 6 3 4-2" stroke="#c3e6d0" stroke-width="2.2"/>',
 messages:'<path d="M20.8 11.6a8.8 8.8 0 0 1-13 7.7L3 20.6l1.3-4.7a8.8 8.8 0 1 1 16.5-4.3Z"/><path d="M8 7.4c-1.1.5-.8 2.3.7 4.3 1.4 2 4 3.8 5.8 3.4 1.2-.3 1.8-1.2 1.3-1.6l-2-1.2-.9.9c-1.5-.5-2.7-1.5-3.4-2.8l.7-.9-.8-2c-.1-.4-.8-.4-1.4-.1Z" fill="currentColor" stroke="none"/>',
 snake:'<path d="M4 7h12a3 3 0 0 1 0 6H8a3 3 0 1 0 0 6h12" stroke-width="3"/><circle cx="16.3" cy="6.7" r=".55" fill="#123620" stroke="#123620"/><path d="M4 7 2 5"/>',
 photos:'<g stroke="none" opacity=".84"><ellipse cx="12" cy="6.6" rx="3" ry="5" fill="#ef565d"/><ellipse cx="12" cy="6.6" rx="3" ry="5" fill="#ffad50" transform="rotate(60 12 12)"/><ellipse cx="12" cy="6.6" rx="3" ry="5" fill="#ffd850" transform="rotate(120 12 12)"/><ellipse cx="12" cy="6.6" rx="3" ry="5" fill="#6ec66a" transform="rotate(180 12 12)"/><ellipse cx="12" cy="6.6" rx="3" ry="5" fill="#65bcf3" transform="rotate(240 12 12)"/><ellipse cx="12" cy="6.6" rx="3" ry="5" fill="#ac72dc" transform="rotate(300 12 12)"/></g>',
 camera:'<path d="M3 7h4l1.7-2.5h6.6L17 7h4v12H3z" fill="#31343b" stroke="#31343b"/><circle cx="12" cy="13" r="3.4" stroke="#e5e9ef"/><path d="M18 9h1" stroke="#e5e9ef"/>'
};
export const phoneIcon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const asset=file=>`${import.meta.env.BASE_URL}sprites/${file}.png`;
export const gallerySprites=[
 {url:asset('kitty-reference-sheet'),label:'Kitty · poses'},
 {url:asset('louis-reference-sheet'),label:'Louis · poses'},
 {url:asset('kitty-walk-sheet'),label:'Kitty · caminata'},
 {url:asset('louis-walk-sheet'),label:'Louis · caminata'}
];
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const PHONE_PAGES=Object.freeze([
 [['photos','Fotos'],['maps','Mapas'],['journal','Diario'],['progress','Progreso'],['clock','Reloj'],['snake','Snake'],['calendar','Calendario'],['contacts','Contactos']],
 [['weather','Tiempo'],['calculator','Calculadora'],['heart','Recuerdos']]
]);
const appButton=([id,label],unread)=>`<button data-app="${id}"><span class="phone-app-icon ${id}">${phoneIcon(id)}${id==='messages'&&unread?'<i aria-label="Mensaje sin leer"></i>':''}</span><span>${label}</span></button>`;
export function phoneHome(unread,page=0){
 const index=Math.max(0,Math.min(PHONE_PAGES.length-1,page));
 return '<div class="phone-wallpaper-art" aria-hidden="true">♡</div><div class="phone-apps" data-home-page="'+index+'">'+PHONE_PAGES[index].map(app=>appButton(app,unread)).join('')+'</div>'+
 '<div class="phone-page-dots" role="group" aria-label="Páginas de aplicaciones">'+PHONE_PAGES.map((_,i)=>'<button data-home-page="'+i+'" aria-label="Página '+(i+1)+'" aria-current="'+(i===index?'page':'false')+'">●</button>').join('')+'</div>'+
 '<div class="phone-apps phone-dock-apps">'+[['messages','WhatsApp'],['camera','Cámara'],['settings','Ajustes'],['music','Música']].map(app=>appButton(app,unread)).join('')+'</div>';
}
export function phoneJournal(notes=[],objective=''){
 return '<article class="phone-journal"><small>DIARIO DE KITTY</small><h2>Mis pequeñas pistas ♡</h2><p>He venido a buscar a Lois. No quiero dejar ninguna pista atrás.</p>'+
 (objective?'<section><b>Mi siguiente paso</b><p>'+escape(objective)+'</p></section>':'')+
 (notes.length?notes.map(n=>'<section><b>'+escape(n.label||'Nota')+'</b><p>'+escape(n.text||'')+'</p></section>').join(''):'<section><b>Notas encontradas</b><p>Todavía no he anotado nada.</p></section>')+'</article>';
}
export function earlierMessages(date=deviceTime()){
 return [
  {from:'Mi Luis ❤️',text:'Vi las marcas de ruedas cerca de la casa. La puerta principal está cerrada; te estaré avisando si vuelve ese hombre.',time:formatPhoneTime(new Date(date.getTime()-4*3600000))},
  {from:'Tú',text:'Encontré la ventana entreabierta. Voy a buscar a Louis, quédate pendiente ❤️.',time:formatPhoneTime(new Date(date.getTime()-4*3600000+120000))}
 ];
}

export function phoneChat(messages,typing,timeFor,history){
 const bubble=(message,time)=>{
  const outgoing=message.from==='Tú';
  return `<p class="${outgoing?'outgoing':'incoming'}">${escape(message.text)} <span class="phone-message-meta"><time>${time}</time>${outgoing?'<span aria-label="Entregado"> ✓✓</span>':''}</span></p>`;
 };
 return `<div class="phone-chat"><span class="phone-chat-date">Hace varias horas</span>${history.map(message=>bubble(message,message.time)).join('')}${messages.length?'<span class="phone-chat-date">Ahora</span>':''}${messages.map(message=>bubble(message,timeFor(message))).join('')}${typing?'<p class="phone-typing">Escribiendo…</p>':''}</div><div class="phone-composer" aria-hidden="true"><span>☺</span><span>Mensaje</span><span>📎</span><b>🎙</b></div>`;
}
export function phoneNotice(message,time){
 return `<span class="phone-notice-icon">${phoneIcon('messages')}</span><span class="phone-notice-copy"><span class="phone-notice-app">WhatsApp <time>${time}</time></span><strong>${escape(message.from)}</strong><span>${escape(message.text)}</span></span>`;
}
