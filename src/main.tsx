import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Phaser from 'phaser';
import {Garden,Hud} from './game';
import {Sound} from './audio';
import {CONFIG as C,ROOMS} from './config';
import './style.css';
type IconName='coin'|'bomb'|'key'|'poop'|'head'|'pause'|'sound'|'mute'|'expand'|'shrink';
function Icon({name}:{name:IconName}){
 const paths:Record<IconName,string>={
 coin:'M5 2h6v2h2v8h-2v2H5v-2H3V4h2z M7 5v6h2V5z',
 bomb:'M3 2h3v1h4V2h3v4h-3v1h1v2h2v4h-2v2H5v-2H3V9h2V7h1V6H3z',
 key:'M3 2h5v2h2v4H8v2H6v4H4v-3H2V8h1z M5 4v3h2V4z',
 poop:'M7 1h2v3h2v2h1v3h2v4h-1v2H3v-2H2V9h2V6h2V4h1z M5 9v2h1V9z M10 9v2h1V9z',
 head:'M2 2h3l2 3h2l2-3h3v10h-2v2H4v-2H2z M5 7v2h1V7z M10 7v2h1V7z M7 10v2h2v-2z',
 pause:'M4 2h3v12H4z M10 2h3v12h-3z',
 sound:'M2 6h3l4-4v12l-4-4H2z M11 4h2v8h-2z M14 6h1v4h-1z',
 mute:'M2 6h3l4-4v12l-4-4H2z M11 5l4 5-1 1-4-5z M14 5l1 1-4 5-1-1z',
 expand:'M1 6V1h5v2H3v3z M10 1h5v5h-2V3h-3z M1 10h2v3h3v2H1z M13 10h2v5h-5v-2h3z',
 shrink:'M4 1h2v5H1V4h3z M10 1h2v3h3v2h-5z M1 10h5v5H4v-3H1z M10 10h5v2h-3v3h-2z'
 };
 return <svg className={`icon ${name}`} viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path fillRule="evenodd" d={paths[name]}/></svg>;
}
const heartPath='M1 3h2V1h3v2h4V1h3v2h2v6h-2v2h-2v2H9v2H7v-2H5v-2H3V9H1z';
function Hearts({hp}:{hp:number}){return <div className="hearts" aria-label={`${hp} de 6 puntos de vida`}>{['red','soul','dark'].map((type,i)=>{const fill=Math.max(0,Math.min(2,hp-i*2))/2;return <span key={type} className={`heart ${type}`} title={['Corazón rojo','Corazón de alma','Corazón oscuro'][i]}><svg viewBox="0 0 16 16"><path d={heartPath}/></svg><span style={{width:`${fill*100}%`}}><svg viewBox="0 0 16 16"><path d={heartPath}/></svg></span></span>})}</div>}
function Map({hud}:{hud?:Hud}){return <svg className="minimap" viewBox="0 0 49 50" aria-label="Mapa de seis salas en zigzag"><path d="M12 8H36V25H12V42H36" fill="none" stroke="#bcaa9d" strokeWidth="3"/>{ROOMS.map((r,i)=><rect key={i} x={5+r.x*24} y={2+r.y*17} width="14" height="12" rx="2" fill={i===hud?.roomIndex?'#b96c92':hud?.visited.includes(i)?'#fff3d7':'#d6c8b9'}/>)}</svg>}
function App(){
 const host=useRef<HTMLDivElement>(null),scene=useRef<Garden | undefined>(undefined),audio=useRef(new Sound());
 const [started,S]=useState(false),[paused,P]=useState(false),[muted,M]=useState(false),[hud,H]=useState<Hud>(),[end,E]=useState(''),[full,F]=useState(false),[canFull,CF]=useState(false),[fullNote,FN]=useState('');
 useEffect(()=>{CF(!!document.fullscreenEnabled&&typeof document.documentElement.requestFullscreen==='function');const f=()=>F(!!document.fullscreenElement);document.addEventListener('fullscreenchange',f);return()=>document.removeEventListener('fullscreenchange',f);},[]);
 useEffect(()=>{
  if(!started||!host.current)return;
  const s=new Garden(H,E,P,audio.current);scene.current=s;const el=host.current;
  const game=new Phaser.Game({type:Phaser.AUTO,parent:el,width:el.clientWidth,height:el.clientHeight,backgroundColor:'#f5e3d3',pixelArt:true,render:{antialias:false},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.NO_CENTER,expandParent:false},scene:s,input:{activePointers:4}});
  const blur=()=>s.setPaused(true),vis=()=>{if(document.hidden)blur()},resize=()=>{s.clearInput();if(innerHeight>innerWidth)blur();if(el.clientWidth>0&&el.clientHeight>0)game.scale.resize(el.clientWidth,el.clientHeight);};
  const observer=new ResizeObserver(resize);observer.observe(el);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',vis);window.addEventListener('orientationchange',blur);window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
  return()=>{observer.disconnect();window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',vis);window.removeEventListener('orientationchange',blur);window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);audio.current.destroy();game.destroy(true);scene.current=undefined;};
 },[started]);
 const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();FN('');}catch{FN('Pantalla completa no disponible. Puedes seguir jugando.');}};
 const restart=()=>{E('');scene.current?.restartRun()};
 return <main>{!started?<section className="welcome"><span className="eyebrow">UN PEQUEÑO REGALO · 04.12.2026</span><div className="welcome-bow" aria-hidden="true">🎀</div><h1>El jardín<br/><em>de los deseos</em></h1><p>Flores, estrellitas y una pequeña aventura para ti.</p><button className="primary" onClick={()=>{audio.current.start();S(true)}}>Entrar al jardín <span>✦</span></button><p className="instructions">En horizontal · izquierda: moverte · derecha: apuntar y disparar.<br/><span className="desktop-help">WASD + ratón o flechas · B bomba · Espacio activo · Esc pausa.<br/></span>Seis salas, un gran lazo y una escotilla al final.</p><details className="install"><summary>iPhone: jugar sin las barras de Safari</summary><p>En Safari, Compartir → Añadir a pantalla de inicio. Activa «Abrir como app web» si aparece y abre el icono. Es opcional; también funciona desde Safari.</p></details></section>:<>
 <div id="game" ref={host}/>
 <header className="hud"><div className="resources"><Hearts hp={hud?.hp??6}/><div className="counters"><span aria-label={`${hud?.coins??12} monedas`}><Icon name="coin"/>{hud?.coins??12}</span><span aria-label={`${hud?.bombs??5} bombas`}><Icon name="bomb"/>{hud?.bombs??5}</span><span aria-label={`${hud?.keys??1} llaves`}><Icon name="key"/>{hud?.keys??1}</span>{hud?.shield&&<span className="mantle-tag" title="Holy Mantle listo">✧</span>}</div></div>
 <div className="location"><Map hud={hud}/><span>{hud?.room}<small>EL JARDÍN DE LOS DESEOS</small></span></div>
 <nav><button onClick={()=>scene.current?.setPaused(!paused)} aria-label={paused?'Continuar':'Pausa'}><Icon name="pause"/></button><button aria-label={muted?'Activar sonido':'Silenciar sonido'} onClick={()=>{const m=!muted;M(m);audio.current.muted=m;audio.current.resume();}}><Icon name={muted?'mute':'sound'}/></button>{canFull&&<button aria-label={full?'Salir de pantalla completa':'Pantalla completa'} onClick={fullscreen}><Icon name={full?'shrink':'expand'}/></button>}</nav></header>
 {hud?.message&&<div className={`toast ${hud.state==='hurt'?'damage':''}`} role="status" key={hud.message}>{hud.message}</div>}
 {hud?.bossHp!==undefined&&<div className="boss-hud" aria-label={`Mega Kuromi: ${Math.ceil(hud.bossHp)} de ${C.bossHp} de vida`}><span>MEGA KUROMI</span><div><i style={{width:`${hud.bossHp/C.bossHp*100}%`}}/></div></div>}
 <div className="actions"><button aria-label="Colocar bomba" title="Bomba · B" onPointerDown={e=>{e.preventDefault();scene.current?.bomb()}}><Icon name="bomb"/><span>{hud?.bombs??5}</span><kbd>B</kbd></button><button aria-label="Usar objeto activo" aria-disabled={!hud?.charge} title={hud?.active==='head'?'Kitty Cat’s head · Espacio':'Pila adorable · Espacio'} className={hud?.charge?'charged':'empty'} onPointerDown={e=>{e.preventDefault();scene.current?.active()}}><Icon name={hud?.active==='head'?'head':'poop'}/><small>{hud?.charge?'LISTO':`${hud?.chargeRooms??1} SALA`}</small><kbd>␣</kbd><i className="charge-bar" style={{width:hud?.charge?'75%':'8%'}}/></button></div>
 {paused&&!end&&<div className="overlay"><span className="eyebrow">UN MOMENTO ENTRE LAS FLORES</span><h2>Una pequeña pausa</h2><button className="primary" onClick={()=>scene.current?.setPaused(false)}>Continuar</button><button onClick={restart}>Volver a empezar</button>{canFull&&<button onClick={fullscreen}>{full?'Salir de pantalla completa':'Pantalla completa'}</button>}<p>Dos dedos: izquierda mueve, derecha dispara.<br/>Bomba y activo están en la esquina inferior.</p><p className="small">En iPhone puedes abrirlo desde la pantalla de inicio<br/>para aprovechar el espacio sin barras de Safari.</p>{fullNote&&<p role="status">{fullNote}</p>}</div>}
 {end&&<div className="overlay"><span className="welcome-bow">{end==='win'?'🎀':'♡'}</span><h2>{end==='win'?'El jardín vuelve a florecer':'Un respiro, pequeña Kitty'}</h2><p>{end==='win'?'¡Feliz cumpleaños! Tu aventura está completa.':'Las flores te esperan para intentarlo otra vez.'}</p><button className="primary" onClick={restart}>Jugar otra vez</button></div>}
 <div className="rotate"><span>↻</span><h2>Gira tu iPhone</h2><p>El jardín te espera en horizontal.<br/>Tu partida está en pausa.</p></div>
 </>}</main>;
}
createRoot(document.getElementById('root')!).render(<App/>);

