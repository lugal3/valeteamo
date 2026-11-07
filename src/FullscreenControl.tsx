import {useEffect,useRef,useState} from 'react';

/** The browser decides whether fullscreen is available; iPhone gets useful instructions. */
export function FullscreenControl({compact=false}:{compact?:boolean}){
 const [full,setFull]=useState(false),[help,setHelp]=useState(false),[note,setNote]=useState('');
 const standalone=(typeof window!=='undefined'&&window.matchMedia?.('(display-mode: standalone)').matches)||!!(navigator as Navigator&{standalone?:boolean}).standalone;
 const dialog=useRef<HTMLDivElement>(null);
 useEffect(()=>{const update=()=>setFull(!!document.fullscreenElement);document.addEventListener('fullscreenchange',update);update();return()=>document.removeEventListener('fullscreenchange',update);},[]);
 useEffect(()=>{if(!help)return;const before=document.activeElement as HTMLElement|null;dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();setHelp(false);}else if(e.key==='Tab'){e.preventDefault();dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();}};window.addEventListener('keydown',key,true);return()=>{window.removeEventListener('keydown',key,true);before?.focus();};},[help]);
 const toggle=async()=>{
  if(document.fullscreenElement){try{await document.exitFullscreen();setNote('');}catch{setNote('No se pudo salir de pantalla completa.');}return;}
  if(!document.fullscreenEnabled||typeof document.documentElement.requestFullscreen!=='function'){setHelp(true);return;}
  try{await document.documentElement.requestFullscreen();setNote('');}catch{setNote('El navegador no permitió la pantalla completa. Puedes continuar jugando.');setHelp(true);}
 };
 return <div className={`fullscreen-control ${compact?'compact':''}`}>
  <button type="button" className="fullscreen-button" onClick={toggle} aria-label={full?'Salir de pantalla completa':'Pantalla completa'} title={full?'Salir de pantalla completa':'Pantalla completa'}><span aria-hidden="true">{full?'⊠':'⛶'}</span>{!compact&&<small>{full?'Salir de pantalla completa':'Pantalla completa'}</small>}</button>
  {help&&<div className="fullscreen-help-backdrop"><div ref={dialog} className="fullscreen-help" role="dialog" aria-modal="true" aria-labelledby="fullscreen-help-title"><span className="story-kicker">MÁS ESPACIO PARA TU AVENTURA</span><h2 id="fullscreen-help-title">{standalone?'Ya estás jugando como app':'Abrir como app en iPhone'}</h2><p>{standalone?'El juego ya usa el modo de pantalla de inicio. El indicador superior del sistema puede seguir visible.':note||'Safari en iPhone no siempre permite ocultar las barras de una página desde el juego.'}</p>{!standalone&&<ol><li>Abre esta página en Safari.</li><li>Toca <b>Compartir</b> y elige <b>Añadir a pantalla de inicio</b>.</li><li>Abre el nuevo icono para jugar con más espacio.</li></ol>}<button className="story-button" onClick={()=>setHelp(false)}>Entendido</button></div></div>}
 </div>;
}
