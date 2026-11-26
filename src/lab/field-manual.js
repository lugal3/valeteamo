// Small, single-topic blueprint overlays. No assets, network or canvas redraw.
export const TUTORIALS=Object.freeze([
 {id:'movement',title:'Primeros pasos',tone:'blue',rows:[['move','Moverse','W A S D','Joystick izquierdo'],['look','Mirar','Ratón / flechas','Arrastra a la derecha'],['run','Correr','Shift','Empuja el joystick'],['hand','Interactuar','E','Botón de acción'],['crouch','Agacharse / saltar','C / Espacio','Botones Agachar / Saltar']]},
 {id:'phone',title:'Tu teléfono',tone:'rose',rows:[['phone','Abrir teléfono','Equipa el teléfono · P','Equipa el teléfono · Usar'],['message','Mensajes','Lee los avisos de Luis','Lee los avisos de Luis'],['book','Manual de campo','Consulta tus tutoriales','Consulta tus tutoriales']]},
 {id:'threat',title:'No estás sola',tone:'red',rows:[['ear','Escucha','Los pasos revelan su cercanía','Los pasos revelan su cercanía'],['eye','Evita que te vea','Rompe la línea de visión','Rompe la línea de visión'],['crouch','Muévete con cuidado','C para agacharte','Agachar · evita correr']]},
 {id:'hide',title:'¡Escóndete!',tone:'red',rows:[['wardrobe','Armario','Mira y pulsa E','Mira y pulsa Interactuar'],['bed','Bajo la cama','C y luego E','Agachar y luego Interactuar'],['clock','10 segundos','Quédate oculta hasta que pase el peligro','Quédate oculta hasta que pase el peligro']]},
 {id:'emy',title:'Tu compañera Emy',tone:'violet',rows:[['heart','Acariciar','Acércate y pulsa E','Acércate e interactúa'],['cat','Esperar / seguir','Cambia su orden de cerca','Cambia su orden de cerca'],['scan','Escaneo','Detecta amenazas · 6 s','Detecta amenazas · 6 s'],['map','Distracción','Elige un lugar · arrastra / rueda','Elige un lugar · arrastra / pellizca']]},
 {id:'rc',title:'Auto RC',tone:'teal',rows:[['car','Conducir','W/S acelerar · A/D girar','Joystick para conducir'],['horn','Atrae al secuestrador','Q · bocina','Botón Bocina'],['map','Prepara una distracción','Llévalo lejos de Kitty','Llévalo lejos de Kitty'],['phone','Guardar tablet','X o Esc · recupera el auto si lo golpean','Guardar · recupera el auto si lo golpean']]}
]);
const icons={
 move:'<rect x="12" y="2" width="8" height="8" rx="1"/><rect x="2" y="12" width="8" height="8" rx="1"/><rect x="12" y="12" width="8" height="8" rx="1"/><rect x="22" y="12" width="8" height="8" rx="1"/><path d="M16 4v4m-2-2 2-2 2 2M4 16h4m-2-2-2 2 2 2M16 14v4m-2-2 2 2 2-2M24 16h4m-2-2 2 2-2 2"/>',
 stick:'<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="5"/><path d="M16 1v4m0 22v4M1 16h4m22 0h4"/>',
 look:'<rect x="10" y="3" width="12" height="24" rx="6"/><path d="M16 3v9m-6 0h12M2 15h5m-5 0 3-3m-3 3 3 3m20-3h5m-3-3 3 3-3 3"/>',
 touch:'<rect x="4" y="3" width="24" height="26" rx="4"/><path d="M13 22v-8a2 2 0 0 1 4 0v4l3 1 3 3m-10-13 3-3 3 3M9 13l-3 3 3 3m14-6 3 3-3 3"/>',
 run:'<circle cx="19" cy="5" r="3"/><path d="m17 10-5 7 7 3-2 9m-5-12-5 8H2m15-15 7 5 5-4M2 9h8M2 13h6"/>',
 hand:'<path d="M9 27 5 17q-1-3 2-3l5 4V5q0-4 4-3v12l3-1 4 2 3 3v9z"/><path d="M4 5h4m-2-2v4"/>',
 crouch:'<circle cx="21" cy="5" r="3"/><path d="m19 10-8 7 9 2-2 8M11 17l-5 8H2m17-15 7 5 4-2M3 29h26"/>',
 phone:'<rect x="8" y="2" width="16" height="28" rx="3"/><path d="M13 5h6m-5 22h4M11 10h4v4h-4zm6 0h4v4h-4zm-6 6h4v4h-4zm6 0h4v4h-4z"/>',
 message:'<path d="M3 5h26v19H13l-6 5v-5H3zM8 11h16M8 16h10"/>',
 book:'<path d="M16 7Q9 2 2 5v22q8-3 14 2 6-5 14-2V5q-7-3-14 2v22M6 11l6 2m-6 3 6 2m8-5 6-2m-6 7 6-2"/>',
 ear:'<path d="M9 18Q3 1 17 2q12 0 10 12-1 6-7 8-3 1-3 6-7 5-8-4m5-8q-4-9 4-9 7 3 0 9"/>',
 eye:'<path d="M2 16Q16 1 30 16 16 31 2 16z"/><circle cx="16" cy="16" r="5"/><path d="M3 29 29 3"/>',
 wardrobe:'<rect x="5" y="2" width="22" height="28" rx="1"/><path d="M16 2v28M13 13v5m6-5v5M8 6h5m6 0h5M8 9h5m6 0h5"/>',
 bed:'<path d="M3 5v24m26-13v13M3 22h26M3 15h8v-4H3m8 4h14q4 0 4 5M11 15v7M9 28h14" /><path d="m12 26 4-2 4 2-4 2z"/>',
 clock:'<circle cx="16" cy="17" r="12"/><path d="M16 17V8m0 9 6 3M12 2h8m-4 0v3"/>',
 heart:'<path d="M16 28 3 15Q-2 3 8 4q5 0 8 6 3-6 8-6 10-1 5 11z"/>',
 cat:'<path d="M4 14 4 3l9 6h6l9-6v11q6 15-12 15T4 14zM8 17h3m10 0h3m-10 5 2 2 2-2M2 20h4m20 0h4"/>',
 scan:'<circle cx="16" cy="16" r="13"/><circle cx="16" cy="16" r="8"/><circle cx="16" cy="16" r="2"/><path d="M16 16 26 6"/>',
 map:'<path d="M2 6 11 2l10 4 9-4v24l-9 4-10-4-9 4zM11 2v24M21 6v24M5 21l8-9 11 5" stroke-dasharray="3 2"/>',
 car:'<path d="m5 12 4-7h14l4 7 3 3v9H2v-9zm0 0h22M5 19h5m12 0h5M6 24v5m20-5v5"/>',
 horn:'<path d="M3 12h8l12-7v22l-12-7H3zM8 20l3 8h5l-3-8M26 10l4-3m-4 9h5m-5 6 4 3"/>'
};
const icon=name=>'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
const kitty='<svg viewBox="0 0 66 46" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 19 9 4 23 11Q32 7 43 11L56 4 57 19Q66 43 33 44 0 43 9 19Z"/><ellipse cx="22" cy="27" rx="2" ry="3"/><ellipse cx="44" cy="27" rx="2" ry="3"/><ellipse cx="33" cy="34" rx="4" ry="2"/><path d="M7 26 0 23m7 9H0m59-6 7-3m-7 9h7M44 12Q31 0 43 0l5 8Q62-3 63 8l-9 6z"/></svg>';
export function sanitizeTutorials(value){return TUTORIALS.map(t=>t.id).filter(id=>Array.isArray(value)&&value.includes(id));}
export function tutorialCardHTML(id,touch=false,history=false){
 const t=TUTORIALS.find(t=>t.id===id);if(!t)return '';
 return '<article class="field-card" data-tone="'+t.tone+'"><header><span>'+(history?'MANUAL DE CAMPO':'Ⅱ · JUEGO PAUSADO')+'</span><span>VT / '+String(TUTORIALS.indexOf(t)+1).padStart(2,'0')+'</span></header><h2 id="field-title">'+t.title+'</h2><div class="field-rows">'+t.rows.map(([sym,label,pc,mobile])=>'<div class="field-row">'+icon(touch&&sym==='move'?'stick':touch&&sym==='look'?'touch':sym)+'<div><strong>'+label+'</strong><span>'+(touch?mobile:pc)+'</span></div></div>').join('')+'</div><footer><span class="field-watermark">'+kitty+'</span><button type="button" data-field-close>'+(history?'Volver':'Entendido')+'</button></footer></article>';
}
export function createFieldManual(root,{touch,onClose,onSeen}){
 const layer=document.createElement('div');layer.className='field-overlay';layer.hidden=true;layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-labelledby','field-title');root.append(layer);
 let seen=new Set(),id=null,history=false,previous=null;
 function close(){if(!id)return;const completed=id;id=null;layer.hidden=true;root.classList.remove('field-open');if(!history){seen.add(completed);onSeen?.([...seen]);}if(previous?.isConnected&&previous.getClientRects().length)previous.focus({preventScroll:true});onClose?.();}
 layer.addEventListener('click',e=>{e.stopPropagation();if(e.target.closest('[data-field-close]'))close();});
 return {get active(){return id;},get seen(){return sanitizeTutorials([...seen]);},restore(value,merge=false){seen=new Set(sanitizeTutorials(merge?[...seen,...(value||[])]:value));},clear(){id=null;layer.hidden=true;root.classList.remove('field-open');},show(key,replay=false){if(id||!TUTORIALS.some(t=>t.id===key)||(!replay&&seen.has(key))||(replay&&!seen.has(key)))return false;id=key;history=replay;previous=document.activeElement;layer.innerHTML=tutorialCardHTML(key,touch(),replay);layer.hidden=false;root.classList.add('field-open');layer.querySelector('button').focus({preventScroll:true});return true;},close,key(e){if(!id)return false;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&['Escape','Enter',' '].includes(e.key))close();return true;}};
}
export function manualListHTML(seen){const ids=sanitizeTutorials(seen);return '<div class="field-history"><h3>Manual de campo</h3><p>Tutoriales descubiertos · '+ids.length+' / '+TUTORIALS.length+'</p>'+TUTORIALS.filter(t=>ids.includes(t.id)).map(t=>'<button data-manual="'+t.id+'">'+icon(t.rows[0][0])+'<span>'+t.title+'</span><b>›</b></button>').join('')+'</div>';}
