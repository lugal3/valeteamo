import {useCallback,useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import {CosmosCanvas} from './CosmosCanvas';
import {VideoGalaxyCanvas} from './VideoGalaxyCanvas';
import {GalaxyCouple} from './ReferenceCharacters';
import {createPreviewBridge} from './game-bridge';
import {ASSET_GUIDE,DEFAULT_PALETTE,MEMORIES,PALETTES,UNLOCK_AT,countdownParts,secondsUntil,type CosmosPalette,type CosmosScene,type GalaxyMemory,type Quality} from './cosmos-config';
import './cosmos.css';
import './video-reference.css';

type Props={preview?:boolean;startAt?:CosmosScene;onExit:()=>void;onEnterGame?:()=>void};
function Particles(){return <div className="cosmos-sparks" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{left:((i*37+17)%100)+'%',top:((i*53+11)%100)+'%',animationDelay:(-i*.37)+'s',animationDuration:(3+i%5)+'s'}}/>)}</div>;}
function PhotoPlaceholder({label,portrait=false}:{label:string;portrait?:boolean}){
 return <div className={'cosmos-photo-placeholder'+(portrait?' portrait':'')} role="img" aria-label={'Espacio para '+label}>
  <GalaxyCouple className="cosmos-placeholder-couple"/>
  <div className="cosmos-photo-caption"><span aria-hidden="true">✧</span><strong>{label}</strong><small>IMAGEN POR AÑADIR</small></div>
 </div>;
}
function useAmbientSound(scene:CosmosScene){
 const context=useRef<AudioContext|null>(null);
 const oscillators=useRef<OscillatorNode[]>([]);
 const master=useRef<GainNode|null>(null);
 const [enabled,setEnabled]=useState(false);
 const toggle=useCallback(()=>{
  if(enabled){master.current?.gain.setTargetAtTime(0,context.current?.currentTime??0,.2);setEnabled(false);return;}
  try{
   if(!context.current){
    const ctx=new AudioContext(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
    filter.type='lowpass';filter.frequency.value=750;gain.gain.value=0;
    filter.connect(gain);gain.connect(ctx.destination);
    [110,164.81,220].forEach((freq,i)=>{
     const osc=ctx.createOscillator(),voice=ctx.createGain();osc.type=i===1?'triangle':'sine';osc.frequency.value=freq;
     voice.gain.value=i===0?.12:i===1?.055:.028;
     osc.connect(voice);voice.connect(filter);osc.start();oscillators.current.push(osc);
    });
    context.current=ctx;master.current=gain;
   }
   void context.current.resume();
   master.current?.gain.setTargetAtTime(.45,context.current.currentTime,.8);setEnabled(true);
  }catch{setEnabled(false);}
 },[enabled]);
 useEffect(()=>{
  if(!context.current)return;
  const frequency=scene==='suspense'?[82.4,116.5,123.5]:scene==='finale'?[130.81,164.81,261.63]:[110,164.81,220];
  oscillators.current.forEach((osc,i)=>osc.frequency.setTargetAtTime(frequency[i],context.current!.currentTime,.8));
 },[scene]);
 useEffect(()=>{
  const hidden=()=>{const ctx=context.current;if(!ctx)return;if(document.hidden)void ctx.suspend();else if(enabled)void ctx.resume();};
  document.addEventListener('visibilitychange',hidden);
  return ()=>document.removeEventListener('visibilitychange',hidden);
 },[enabled]);
 useEffect(()=>()=>{oscillators.current.forEach(osc=>{try{osc.stop();}catch{}});void context.current?.close();},[]);
 return {enabled,toggle};
}
export default function CosmosExperience({preview=false,startAt='countdown',onExit,onEnterGame}:Props){
 const [scene,setScene]=useState<CosmosScene>(startAt);
 const [palette,setPalette]=useState<CosmosPalette>(DEFAULT_PALETTE);
 const [quality,setQuality]=useState<Quality>('auto');
 const [clock,setClock]=useState(()=>secondsUntil());
 const [giftOpening,setGiftOpening]=useState(false);
 const [arrivalReady,setArrivalReady]=useState(false);
 const [gearOpen,setGearOpen]=useState(false);
 const [heartMenuOpen,setHeartMenuOpen]=useState(false);
 const [replaySignal,setReplaySignal]=useState(0);
 const [skipSignal,setSkipSignal]=useState(0);
 const [installOpen,setInstallOpen]=useState(false);
 const [letterOpen,setLetterOpen]=useState(false);
 const [selected,setSelected]=useState<GalaxyMemory>(MEMORIES[0]);
 const [seen,setSeen]=useState<string[]>([]);
 const timeout=useRef<number|undefined>(undefined);
 const {enabled:audioEnabled,toggle:toggleAudio}=useAmbientSound(scene);
 useEffect(()=>{
  const tick=()=>setClock(secondsUntil());
  const timer=window.setInterval(tick,1000);
  document.addEventListener('visibilitychange',tick);
  return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',tick);};
 },[]);
 useEffect(()=>()=>window.clearTimeout(timeout.current),[]);
 const colors=PALETTES[palette];
 const vars={'--cx-pink':colors.pink,'--cx-purple':colors.purple,'--cx-blue':colors.blue,'--cx-gold':colors.gold,'--cx-dark':colors.dark} as CSSProperties;
 const enterGame=useCallback(()=>{
  createPreviewBridge(()=>{(onEnterGame??onExit)();}).send({type:'OPEN_GAME',entry:'rescue-prologue',profile:preview?'demo':'birthday'});
 },[onEnterGame,onExit,preview]);
 const openGift=()=>{
  if(giftOpening)return;setGiftOpening(true);
  window.clearTimeout(timeout.current);
  timeout.current=window.setTimeout(()=>{setScene('intro');setGiftOpening(false);},1550);
 };
 const selectMemory=useCallback((memory:GalaxyMemory)=>{
  setHeartMenuOpen(false);
  setGearOpen(false);
  setSelected(memory);setSeen(v=>v.includes(memory.id)?v:[...v,memory.id]);setLetterOpen(false);setScene('memory');
 },[]);
 const parts=useMemo(()=>countdownParts(clock),[clock]);
 const isGalaxy=scene==='galaxy';
 const isVideoCosmos=scene==='loading'||scene==='galaxy';
 const arrivalComplete=useCallback(()=>{
  setArrivalReady(true);
  // Same live canvas continues when the loading scene turns into galaxy.
  setScene(current=>current==='loading'?'galaxy':current);
 },[]);
 const enterFromVideo=()=>{
  setHeartMenuOpen(false);
  setGearOpen(false);
  window.clearTimeout(timeout.current);
  setArrivalReady(false);
  setReplaySignal(n=>n+1);
  setScene('loading');
 };
 const skipVideo=()=>{
  setHeartMenuOpen(false);
  setGearOpen(false);
  setSkipSignal(n=>n+1);
  setArrivalReady(true);
  setScene('galaxy');
 };
 const openPreviewScene=(next:CosmosScene)=>{
  setHeartMenuOpen(false);
  setGearOpen(false);
  window.clearTimeout(timeout.current);setGiftOpening(false);
  if(next==='galaxy'||next==='loading'){
   setArrivalReady(false);
   setReplaySignal(n=>n+1);
  }
  setScene(next);
 };
 const replayTunnel=()=>{
  setHeartMenuOpen(false);
  setGearOpen(false);
  setArrivalReady(false);
  setReplaySignal(n=>n+1);
  setScene('loading');
 };
 const leave=()=>{setHeartMenuOpen(false);setGearOpen(false);window.clearTimeout(timeout.current);onExit();};
 return <main data-visual-version="directional-tunnel-v3" className={'cosmos-experience cosmos-'+scene+' cosmos-palette-'+palette} style={vars}>
  {!isVideoCosmos&&<CosmosCanvas interactive={false} quality={quality}/>}
  <VideoGalaxyCanvas visible={isVideoCosmos} interactive={isGalaxy&&arrivalReady}
   quality={quality} palette={palette} onSelect={selectMemory} onHeartSelect={()=>{setGearOpen(false);setHeartMenuOpen(true);}}
   onArrivalComplete={arrivalComplete} startCompleted={arrivalReady}
   replaySignal={replaySignal} skipSignal={skipSignal}/>
  <div className="cosmos-vignette" aria-hidden="true"/><Particles/>
  {preview&&<>
   {gearOpen&&<div className="cosmos-gear-dismiss" onClick={()=>setGearOpen(false)} aria-hidden="true"/>}
   <div className="cosmos-gear-wrap">
    <button type="button" className="cosmos-gear-button" onClick={()=>setGearOpen(v=>!v)}
     aria-label="Ajustes de la galaxia" aria-controls="cosmos-gear-panel" aria-expanded={gearOpen}
     title="Pruebas y opciones">
     <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.1 2.6h3.8l.6 2.1 1.9.8 1.9-1.1 2.7 2.7-1.1 1.9.8 1.9 2.1.6v3.8l-2.1.6-.8 1.9 1.1 1.9-2.7 2.7-1.9-1.1-1.9.8-.6 2.1h-3.8l-.6-2.1-1.9-.8-1.9 1.1-2.7-2.7 1.1-1.9-.8-1.9-2.1-.6v-3.8l2.1-.6.8-1.9-1.1-1.9 2.7-2.7 1.9 1.1 1.9-.8z"/><circle cx="12" cy="12" r="3.3"/></svg>
    </button>
    {gearOpen&&<aside id="cosmos-gear-panel" className="cosmos-gear-panel" aria-label="Controles y pruebas">
     <div className="cosmos-gear-panel-header"><strong>Universo</strong><button type="button" onClick={()=>setGearOpen(false)} aria-label="Cerrar opciones">×</button></div>
     <p>Arrastra para girar · pellizca o usa la rueda para acercarte.</p>
     <button onClick={replayTunnel}>↻ Repetir túnel y formación</button>
     <button onClick={()=>{setGearOpen(false);setHeartMenuOpen(true);}}>♡ Abrir corazón</button>
     {scene==='loading'&&<button onClick={skipVideo}>✧ Ir a la galaxia</button>}
     <div className="cosmos-gear-divider"/>
     <span className="cosmos-gear-subhead">Recuerdos</span>
     <div className="cosmos-gear-memory-list">
      {MEMORIES.map(memory=><button key={memory.id} onClick={()=>selectMemory(memory)}>{memory.title}{seen.includes(memory.id)?' · visto':''}</button>)}
     </div>
     <div className="cosmos-gear-divider"/>
     <button onClick={()=>{setGearOpen(false);setScene('suspense');}}>Continuar la historia</button>
     {preview&&<><span className="cosmos-gear-subhead">Pruebas</span><div className="cosmos-gear-scene-list">
      {(['countdown','gift','intro','loading','galaxy','suspense','finale'] as const).map(s=><button key={s} onClick={()=>openPreviewScene(s)}>{({countdown:'Contador',gift:'Regalo',intro:'Inicio',loading:'Túnel',galaxy:'Galaxia',suspense:'Misterio',finale:'Final'})[s]}</button>)}
     </div></>}
     <span className="cosmos-gear-subhead">Pantalla y sonido</span>
     <button onClick={toggleAudio}>{audioEnabled?'♪ Silenciar ambiente':'♪ Activar ambiente'}</button>
     <button onClick={()=>setInstallOpen(true)}>iPhone · Pantalla completa</button>
     <label className="cosmos-gear-label">Paleta
      <select aria-label="Paleta visual" value={palette} onChange={e=>setPalette(e.target.value as CosmosPalette)}><option value="rosado">Rosado</option><option value="aurora">Aurora</option><option value="medianoche">Medianoche</option></select>
     </label>
     <label className="cosmos-gear-label">Calidad
      <select aria-label="Calidad gráfica" value={quality} onChange={e=>setQuality(e.target.value as Quality)}><option value="auto">Automática</option><option value="suave">Ligera</option><option value="alta">Alta</option></select>
     </label>
     <button className="cosmos-gear-exit" onClick={leave}>← Volver al menú de pruebas</button>
    </aside>}
   </div>
  </>}


  {scene==='countdown'&&<section className="cosmos-content cosmos-countdown-content" aria-labelledby="cx-title">
   <span className="cosmos-kicker">✦ ALGO MÁGICO ESTÁ POR COMENZAR ✦</span>
   <h1 id="cx-title">Hay momentos que<br/><em>merecen un universo.</em></h1>
   <p className="cosmos-subtitle">Cada estrella guarda una historia. La nuestra empieza aquí.</p>
   <div className="cosmos-countdown-clock" role="timer" aria-label="Tiempo restante hasta el 5 de diciembre de 2026">
    {parts.map((p,i)=><div className="cosmos-number-card" key={p.name} style={{'--card-index':i} as CSSProperties}>
     <strong key={p.value}>{String(p.value).padStart(2,'0')}</strong><span>{p.name}</span>
    </div>)}
   </div>
   <div className="cosmos-countdown-footer"><span>05 DICIEMBRE 2026 · SANTIAGO</span><span className="cosmos-celestial-divider">✧</span><span>00:00 HRS</span></div>
   {preview?<button className="cosmos-cta" onClick={()=>setScene('gift')}>Simular desbloqueo <span>↗</span></button>:clock===0?<button className="cosmos-cta" onClick={()=>setScene('gift')}>Abrir la sorpresa <span>↗</span></button>:null}
   {preview&&<small className="cosmos-dev-label">MODO LP · EL CONTADOR REAL SIGUE FUNCIONANDO</small>}
  </section>}

  {scene==='gift'&&<section className="cosmos-content cosmos-gift-content" aria-labelledby="cx-gift-title">
   <span className="cosmos-kicker">CAPÍTULO I · UN REGALO DEL UNIVERSO</span>
   <h1 id="cx-gift-title">Hay algo <em>para ti.</em></h1>
   <p className="cosmos-subtitle">No es solo un regalo. Es un pequeño universo de recuerdos.</p>
   <button type="button" className={'cosmos-gift-object'+(giftOpening?' opening':'')} onClick={openGift} disabled={giftOpening} aria-label="Abrir la caja de regalo">
    <span className="cosmos-gift-aura"/><span className="cosmos-gift-orbit first"/><span className="cosmos-gift-orbit second"/>
    <span className="cosmos-gift-box"><span className="cosmos-gift-lid"/><span className="cosmos-gift-ribbon-v"/><span className="cosmos-gift-ribbon-h"/><span className="cosmos-gift-bow">♡</span></span>
    <span className="cosmos-gift-core">✦</span>
   </button>
   <button type="button" className="cosmos-cta" disabled={giftOpening} onClick={openGift}>{giftOpening?'Abriendo nuestro universo…':'Toca para abrir'} <span>✦</span></button>
   {giftOpening&&<button className="cosmos-skip" onClick={()=>{window.clearTimeout(timeout.current);setGiftOpening(false);setScene('intro');}}>Omitir animación</button>}
   <span className="cosmos-micro">UN PEQUEÑO INSTANTE DE MAGIA</span>
  </section>}

  {scene==='intro'&&<section className="video-reference-intro" aria-labelledby="video-reference-title">
   <div className="video-reference-intro-haze" aria-hidden="true"/>
   <div className="video-reference-intro-card">
    <span className="video-intro-tiny-heart" aria-hidden="true">♥</span>
    <h1 id="video-reference-title">Una Galaxia de<br/>Amor para Ti</h1>
    <GalaxyCouple/>
    <p>FELIZ CUMPLEAÑOS, MI VIDA</p>
    <button type="button" className="video-reference-enter" onClick={enterFromVideo}>ENTRAR A NUESTRO UNIVERSO <span>✧</span></button>
   </div>
   {preview&&<button type="button" className="video-reference-replay" onClick={()=>setScene('gift')}>← Volver al regalo</button>}
  </section>}

  {/* La llegada se dibuja sin recuadro de carga: deja el túnel completamente visible. */}

  {scene==='galaxy'&&arrivalReady&&<span className="cosmos-screenreader" aria-live="polite">Galaxia interactiva. Toca los corazones para descubrir recuerdos; engranaje para pruebas.</span>}
  {heartMenuOpen&&scene==='galaxy'&&arrivalReady&&<div className="cosmos-heart-backdrop" onClick={e=>{if(e.target===e.currentTarget)setHeartMenuOpen(false);}}>
   <section className="cosmos-heart-menu" role="dialog" aria-modal="true" aria-labelledby="cosmos-heart-menu-title">
    <span className="cosmos-heart-menu-icon" aria-hidden="true">♡</span>
    <h2 id="cosmos-heart-menu-title">¿Comenzamos nuestra aventura?</h2>
    <p>La historia continúa en el juego 2D original.</p>
    <button type="button" className="cosmos-heart-start" onClick={()=>{setHeartMenuOpen(false);enterGame();}}>Comenzar juego 2D <span aria-hidden="true">↗</span></button>
    <button type="button" className="cosmos-heart-continue" onClick={()=>setHeartMenuOpen(false)}>Seguir explorando</button>
   </section>
  </div>}

  {scene==='memory'&&<section className="cosmos-content cosmos-memory-content" aria-labelledby="cx-memory-title">
   <div className="cosmos-memory-shell">
    <div className="cosmos-polaroid">
     {selected.image?<img src={selected.image} alt={'Fotografía de '+selected.title} onError={e=>{e.currentTarget.style.display='none';e.currentTarget.parentElement?.classList.add('image-failed');}}/>:null}
     <PhotoPlaceholder label={'FOTO · '+selected.id}/>
     <span className="cosmos-polaroid-signature">♡ UN INSTANTE PARA GUARDAR</span>
    </div>
    <div className="cosmos-memory-copy">
     <span className="cosmos-kicker">{selected.eyebrow}</span>
     <h1 id="cx-memory-title">{selected.title}<em>.</em></h1>
     <p>{selected.description}</p>
     <div className="cosmos-memory-stamp">✦ RECUERDO PERSONALIZABLE</div>
     <button className="cosmos-cta" onClick={()=>{setLetterOpen(false);setScene('letter');}}>Abrir nuestra carta <span>✉</span></button>
     <button className="cosmos-link" onClick={()=>setScene('galaxy')}>← Volver a las estrellas</button>
    </div>
   </div>
  </section>}

  {scene==='letter'&&<section className="cosmos-content cosmos-letter-content" aria-labelledby="cx-letter-title">
   <span className="cosmos-kicker">UN MENSAJE ENTRE LAS ESTRELLAS</span>
   <h1 id="cx-letter-title">Una carta <em>para ti.</em></h1>
   {!letterOpen?<button type="button" className="cosmos-envelope" onClick={()=>setLetterOpen(true)} aria-label="Abrir sobre de carta"><span className="cosmos-envelope-top"/><span className="cosmos-envelope-heart">♥</span><span className="cosmos-envelope-hint">TOCA PARA ABRIR</span></button>:<div className="cosmos-letter-paper">
    <span>✦ PARA VALE ✦</span><h2>{selected.title}</h2><p>{selected.letter}</p><small>Texto provisional · edita cosmos-config.ts</small>
   </div>}
   <button className="cosmos-link" onClick={()=>setScene('galaxy')}>← Volver a la galaxia</button>
  </section>}

  {scene==='suspense'&&<section className="cosmos-content cosmos-suspense-content" aria-labelledby="cx-suspense-title">
   <span className="cosmos-suspense-eye" aria-hidden="true">◈</span>
   <span className="cosmos-kicker">CAPÍTULO III · ALGO CAMBIA EN EL CIELO</span>
   <h1 id="cx-suspense-title">A veces, hasta las estrellas<br/><em>guardan secretos.</em></h1>
   <p className="cosmos-subtitle">Una escena de misterio para una futura secuencia audiovisual. La música se podrá sustituir por archivos originales.</p>
   <button className="cosmos-cta" onClick={()=>setScene('finale')}>Seguir la luz <span>✦</span></button>
   <button className="cosmos-link" onClick={()=>setScene('galaxy')}>← Regresar a las constelaciones</button>
  </section>}

  {scene==='finale'&&<section className="cosmos-content cosmos-finale-content" aria-labelledby="cx-finale-title">
   <span className="cosmos-finale-sigil" aria-hidden="true">♡</span>
   <span className="cosmos-kicker">CAPÍTULO FINAL · POR AHORA</span>
   <h1 id="cx-finale-title">Y esto es solo <em>el comienzo.</em></h1>
   <p className="cosmos-subtitle">La siguiente aventura continúa en nuestro mundo. Esta puerta ya está preparada para conectar el juego existente.</p>
   <div className="cosmos-finale-actions">
    <button className="cosmos-cta" onClick={preview?onExit:enterGame}>{preview?'Volver al panel de pruebas':'Comenzar la aventura'} <span>↗</span></button>
    <button className="cosmos-link" onClick={()=>setScene('galaxy')}>Explorar otra vez ✧</button>
   </div>
  </section>}

  {installOpen&&<div className="cosmos-install-overlay" onClick={e=>{if(e.target===e.currentTarget)setInstallOpen(false);}}>
   <div className="cosmos-install-dialog" role="dialog" aria-modal="true" aria-labelledby="cosmos-install-title">
    <button className="cosmos-install-close" onClick={()=>setInstallOpen(false)} aria-label="Cerrar guía">✕</button>
    <span className="cosmos-kicker">PANTALLA COMPLETA EN IPHONE</span>
    <h2 id="cosmos-install-title">Llévame contigo ♡</h2>
    <p>Para disfrutar la experiencia sin la barra habitual del navegador:</p>
    <ol><li>Abre el enlace en <strong>Safari</strong>.</li><li>Toca el botón <strong>Compartir</strong> (cuadrado con flecha).</li><li>Elige <strong>Añadir a pantalla de inicio</strong>.</li><li>Si aparece, activa <strong>Abrir como app web</strong> y pulsa Añadir.</li><li>Abre el nuevo icono desde la pantalla de inicio.</li></ol>
    <p className="cosmos-install-note">La experiencia está pensada en vertical. El juego 2D/3D podrá solicitar horizontal cuando corresponda.</p>
    <button className="cosmos-cta" onClick={()=>setInstallOpen(false)}>Entendido ♡</button>
   </div>
  </div>}
  <span className="cosmos-screenreader" aria-live="polite">{scene==='galaxy'?'Mapa estelar abierto':scene==='memory'?'Recuerdo '+selected.title:''}</span>
  <div className="cosmos-hidden-instructions" aria-hidden="true">{ASSET_GUIDE.photos}</div>
 </main>;
}
