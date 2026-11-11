import {deviceTime,formatPhoneTime} from './device-time.js';

const paths={
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
export function phoneHome(unread){
 return `<div class="phone-apps">${[['messages','WhatsApp'],['snake','Snake'],['photos','Fotos'],['camera','Cámara']].map(([id,label])=>`<button data-app="${id}"><span class="phone-app-icon ${id}">${phoneIcon(id)}${id==='messages'&&unread?'<i aria-label="Mensaje sin leer"></i>':''}</span><span>${label}</span></button>`).join('')}</div>`;
}
export function earlierMessages(date=deviceTime()){
 return [
  {from:'Mi Luis ❤️',text:'Ten cuidado cuando llegues. Si ves algo raro, avísame.',time:formatPhoneTime(new Date(date.getTime()-4*3600000))},
  {from:'Tú',text:'Sí. Te escribo cuando esté adentro.',time:formatPhoneTime(new Date(date.getTime()-4*3600000+120000))}
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
