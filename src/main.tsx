import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import type Phaser from 'phaser';
import type {Garden,Hud,ItemOffer} from './game';
import {CHARACTERS,CharacterId} from './characters';
import {characterPreview} from './art';
import {Sound} from './audio';
import {CONFIG as C,ROOMS} from './config';
import './style.css';
import './birthday.css';
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
function ItemDialog({offer,choose}:{offer:ItemOffer,choose:(accept:boolean)=>void}){
 const dialog=useRef<HTMLDivElement>(null);
 useEffect(()=>{const before=document.activeElement as HTMLElement|null;dialog.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  const key=(e:KeyboardEvent)=>{if(e.repeat&&(e.key==='Enter'||e.key===' '))e.preventDefault();if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();choose(false);return;}
   if(e.key==='Tab'){const buttons=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);if(!buttons.length)return;const i=buttons.indexOf(document.activeElement as HTMLButtonElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}
   e.stopImmediatePropagation();};
  window.addEventListener('keydown',key,true);return()=>{window.removeEventListener('keydown',key,true);before?.focus();};
 },[choose]);
 return <div className="item-backdrop"><div ref={dialog} className="item-card" role="dialog" aria-modal="true" aria-labelledby="item-title" aria-describedby="item-description">
  <span className="eyebrow">UN HALLAZGO ENTRE LAS FLORES</span><span className={'item-emblem '+offer.type} aria-hidden="true">{({coin:'✦',key:'⚿',heart:'♥',brim:'♡',mantle:'✧',head:'★'} as Record<string,string>)[offer.type]}</span>
  <div className="item-copy"><h2 id="item-title">{offer.name}</h2><p id="item-description">{offer.description}</p><p className="item-price">{offer.cost?offer.cost+' monedas':'Un regalo para ti'}{!offer.affordable&&' · Te faltan monedas'}</p></div>
  <div className="item-choices"><button className="primary" disabled={!offer.affordable} onClick={()=>choose(true)}>{offer.cost?'Comprar':'Recoger'}</button><button onClick={()=>choose(false)}>Dejarlo aquí</button></div><small>El jardín espera mientras decides. Puedes volver por él.</small>
 </div></div>;
}
function App(){
 const host=useRef<HTMLDivElement>(null),scene=useRef<Garden|undefined>(undefined),audio=useRef(new Sound());
 const [started,S]=useState(false),[paused,P]=useState(false),[muted,M]=useState(false),[hud,H]=useState<Hud>(),[end,E]=useState(''),[full,F]=useState(false),[canFull,CF]=useState(false),[fullNote,FN]=useState('');
 const [character,selectCharacter]=useState<CharacterId>('kitty'),[loading,L]=useState(false),[progress,LP]=useState(0),[loadError,LE]=useState(''),[attempt,RA]=useState(0);
 const choose=React.useCallback((accept:boolean)=>scene.current?.chooseItem(accept),[]);
 useEffect(()=>{CF(!!document.fullscreenEnabled&&typeof document.documentElement.requestFullscreen==='function');const f=()=>F(!!document.fullscreenElement);document.addEventListener('fullscreenchange',f);return()=>document.removeEventListener('fullscreenchange',f);},[]);
 useEffect(()=>{
  if(!started||!host.current)return;
  const el=host.current;let cancelled=false,game:Phaser.Game|undefined,observer:ResizeObserver|undefined,complete:ReturnType<typeof setTimeout>|undefined;
  let blur=()=>{},vis=()=>{},resize=()=>{};L(true);LE('');LP(8);
  const boot=async()=>{try{
   const [{default:Engine},{Garden:Scene}]=await Promise.all([import('phaser'),import('./game')]);if(cancelled)return;LP(60);
   const ready=()=>{LP(100);complete=setTimeout(()=>{if(!cancelled)L(false);},400);};
   const s=new Scene(H,E,P,audio.current,character,ready,LP);scene.current=s;
   game=new Engine.Game({type:Engine.AUTO,parent:el,width:el.clientWidth,height:el.clientHeight,backgroundColor:'#f5e3d3',pixelArt:true,render:{antialias:false,roundPixels:true},scale:{mode:Engine.Scale.RESIZE,autoCenter:Engine.Scale.NO_CENTER,expandParent:false},scene:s,input:{activePointers:4}});
   blur=()=>s.setPaused(true);vis=()=>{if(document.hidden)blur();};resize=()=>{s.clearInput();if(innerHeight>innerWidth)blur();if(el.clientWidth>0&&el.clientHeight>0)game?.scale.resize(el.clientWidth,el.clientHeight);};
   observer=new ResizeObserver(resize);observer.observe(el);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',vis);window.addEventListener('orientationchange',blur);window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
  }catch(error){if(cancelled)return;LE('No se pudo abrir el jardín. Comprueba la conexión y vuelve a intentarlo.');console.error(error);}};
  void boot();
  return()=>{cancelled=true;clearTimeout(complete);observer?.disconnect();window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',vis);window.removeEventListener('orientationchange',blur);window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);game?.destroy(true);scene.current=undefined;};
 },[started,attempt]);
 useEffect(()=>()=>audio.current.destroy(),[]);
 const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();FN('');}catch{FN('Pantalla completa no disponible. Puedes seguir jugando.');}};
 const restart=()=>{E('');scene.current?.restartRun();};
 const returnToCover=()=>{S(false);P(false);E('');H(undefined);audio.current.suspend();};
 return <main>{!started?<section className="welcome">
  <div className="cover-sky" aria-hidden="true"><i/><i/><i/><span>✦</span><span>✦</span><span>✧</span></div>
  <div className="cover-content"><span className="eyebrow">UN PEQUEÑO REGALO · 04.12.2026</span><p className="birthday">Feliz cumpleaños Valentina</p>
  <div className="title-seal" aria-hidden="true">✿</div><h1>El jardín<br/><em>de los deseos</em></h1><p className="cover-subtitle">Seis pequeñas salas. Una aventura hecha para ti.</p>
  <fieldset className="character-select"><legend>ELIGE QUIÉN TE ACOMPAÑA</legend>{(Object.keys(CHARACTERS) as CharacterId[]).map(id=><button key={id} className={character===id?'character selected':'character'} aria-pressed={character===id} onClick={()=>selectCharacter(id)}><img src={characterPreview(id)} alt=""/><span>{CHARACTERS[id].name}<small>{id==='louis'?'ONE DIRECTION':'UN LAZO DE AMOR'}</small></span><b aria-hidden="true">{character===id?'♥':'♡'}</b></button>)}</fieldset>
  <button className="primary start-button" onClick={()=>{audio.current.start();L(true);S(true);}}>Comenzar aventura <span>✦</span></button>
  <p className="instructions">En horizontal · izquierda: moverte · derecha: disparar.<br/><span className="desktop-help">WASD + ratón o flechas · B bomba · Espacio activo · Esc pausa.<br/></span>Acércate a un objeto para leer y elegir si lo recoges.</p>
  <details className="install"><summary>iPhone: jugar sin las barras de Safari</summary><p>En Safari, Compartir → Añadir a pantalla de inicio. Activa «Abrir como app web» si aparece y abre el icono.</p></details></div><div className="cover-garden" aria-hidden="true"><span>✿</span><span>✿</span><span>✿</span><span>✿</span><span>✿</span></div>
 </section>:<>
 <div className="game-shell" inert={loading||paused||!!end||!!hud?.offer}>
 <div id="game" ref={host}/>
 <header className="hud"><div className="resources"><Hearts hp={hud?.hp??6}/><div className="counters"><span aria-label={(hud?.coins??12)+' monedas'}><Icon name="coin"/>{hud?.coins??12}</span><span aria-label={(hud?.bombs??5)+' bombas'}><Icon name="bomb"/>{hud?.bombs??5}</span><span aria-label={(hud?.keys??1)+' llaves'}><Icon name="key"/>{hud?.keys??1}</span>{hud?.shield&&<span className="mantle-tag" title="Holy Mantle listo">✧</span>}</div></div>
 <div className="location"><Map hud={hud}/><span>{hud?.room}<small>{CHARACTERS[character].name.toUpperCase()} · EL JARDÍN DE LOS DESEOS</small></span></div>
 <nav><button onClick={()=>scene.current?.setPaused(!paused)} aria-label={paused?'Continuar':'Pausa'}><Icon name="pause"/></button><button aria-label={muted?'Activar sonido':'Silenciar sonido'} onClick={()=>{const m=!muted;M(m);audio.current.muted=m;audio.current.resume();}}><Icon name={muted?'mute':'sound'}/></button>{canFull&&<button aria-label={full?'Salir de pantalla completa':'Pantalla completa'} onClick={fullscreen}><Icon name={full?'shrink':'expand'}/></button>}</nav></header>
 {hud?.message&&!hud.offer&&<div className={'toast '+(hud.state==='hurt'?'damage':'')} role="status" key={hud.message}>{hud.message}</div>}
 {hud?.bossHp!==undefined&&<div className="boss-hud" aria-label={'Mega Kuromi: '+Math.ceil(hud.bossHp)+' de '+C.bossHp+' de vida'}><span>MEGA KUROMI</span><div><i style={{width:((hud.bossHp/C.bossHp)*100)+'%'}}/></div></div>}
 <div className="actions"><button aria-label="Colocar bomba" title="Bomba · B" onPointerDown={e=>{e.preventDefault();scene.current?.bomb();}}><Icon name="bomb"/><span>{hud?.bombs??5}</span><kbd>B</kbd></button><button aria-label="Usar objeto activo" aria-disabled={!hud?.charge} title={hud?.active==='head'?'Kitty Cat’s head · Espacio':'Pila adorable · Espacio'} className={hud?.charge?'charged':'empty'} onPointerDown={e=>{e.preventDefault();scene.current?.active();}}><Icon name={hud?.active==='head'?'head':'poop'}/><small>{hud?.charge?'LISTO':(hud?.chargeRooms??1)+' SALA'}</small><kbd>␣</kbd><i className="charge-bar" style={{width:hud?.charge?'75%':'8%'}}/></button></div>
 </div>
 {hud?.offer&&!paused&&!end&&!loading&&<ItemDialog offer={hud.offer} choose={choose}/>}
 {paused&&!end&&!loading&&<div className="overlay"><span className="eyebrow">UN MOMENTO ENTRE LAS FLORES</span><h2>Una pequeña pausa</h2><button className="primary" onClick={()=>scene.current?.setPaused(false)}>Continuar</button><button onClick={restart}>Volver a empezar</button><button onClick={returnToCover}>Elegir personaje</button>{canFull&&<button onClick={fullscreen}>{full?'Salir de pantalla completa':'Pantalla completa'}</button>}<p>Dos dedos: izquierda mueve, derecha dispara.<br/>Bomba y activo están en la esquina inferior.</p>{fullNote&&<p role="status">{fullNote}</p>}</div>}
 {end&&<div className="overlay"><span className="welcome-bow">{end==='win'?'✿':'♡'}</span><h2>{end==='win'?'El jardín vuelve a florecer':'Un respiro, '+CHARACTERS[character].name}</h2><p>{end==='win'?'¡Feliz cumpleaños Valentina! Tu aventura está completa.':'Las flores te esperan para intentarlo otra vez.'}</p><button className="primary" onClick={restart}>Jugar otra vez</button><button onClick={returnToCover}>Elegir personaje</button></div>}
 <div className="rotate"><span>↻</span><h2>Gira tu teléfono</h2><p>El jardín te espera en horizontal.<br/>Tu partida está en pausa.</p></div>
 {loading&&<section className="loading-screen" aria-busy={!loadError} aria-label="Cargando el juego"><span className="eyebrow">UNA AVENTURA PARA VALENTINA</span><h2>El jardín<br/><em>de los deseos</em></h2><div className="loading-path"><img src={characterPreview(character)} alt={CHARACTERS[character].name}/><span>✿</span><span>✦</span></div>{loadError?<><p role="alert">{loadError}</p><button className="primary" onClick={()=>RA(v=>v+1)}>Reintentar</button><button onClick={returnToCover}>Volver a la portada</button></>:<><div className="loading-track" role="progressbar" aria-label="Preparando el jardín" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{width:progress+'%'}}/></div><p role="status">{progress<60?'Abriendo el libro de los deseos…':progress<100?'Preparando personajes y flores…':'¡Tu aventura está lista!'}</p><small>Un regalo pequeño, hecho con mucho amor.</small></>}</section>}
 </>}</main>;
}
createRoot(document.getElementById('root')!).render(<App/>);

