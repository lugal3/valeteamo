import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import type Phaser from 'phaser';
import type {CharacterId} from './characters';
import type {AdventureHud,AdventureOffer,IsoAdventure,IsoStoryBridge} from './iso-game';
import {Sound} from './audio';
import {FullscreenControl} from './FullscreenControl';
import {isPhonePortrait} from './LandscapeGate';
import {createInputSession,initialInputMode,padMenu,EMPTY_PAD,type InputMode} from './adaptive-input.js';

function AdventureHearts({hp}:{hp:number}){return <span className="adventure-hearts" aria-label={`${hp} de 6 puntos de vida`}>{[0,1,2].map(i=><span className="adventure-heart" key={i}><span>♥</span><i style={{width:`${Math.max(0,Math.min(2,hp-i*2))*50}%`}}>♥</i></span>)}</span>;}
function OfferDialog({offer,choose}:{offer:AdventureOffer,choose:(value:boolean)=>void}){
 const dialog=useRef<HTMLDivElement>(null);
 useEffect(()=>{const before=document.activeElement as HTMLElement|null;dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();choose(false);return;}if(e.key==='Tab'){const buttons=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button')??[]),i=buttons.indexOf(document.activeElement as HTMLButtonElement);if(buttons.length){e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}}e.stopImmediatePropagation();};window.addEventListener('keydown',key,true);return()=>{window.removeEventListener('keydown',key,true);before?.focus();};},[choose]);
 return <div className="item-backdrop"><div ref={dialog} className="item-card" role="dialog" aria-modal="true" aria-labelledby="charm-title" aria-describedby="charm-description"><span className="eyebrow">UN HALLAZGO ENTRE LAS FLORES</span><span className="item-emblem mantle" aria-hidden="true">✧</span><div className="item-copy"><h2 id="charm-title">{offer.name}</h2><p id="charm-description">{offer.description}</p><p className="item-price">Un regalo para ti</p></div><div className="item-choices"><button className="primary" onClick={()=>choose(true)}>Recoger</button><button onClick={()=>choose(false)}>Dejarlo aquí</button></div><small>El jardín espera mientras decides. Puedes volver por él.</small></div></div>;
}

export function StoryGame({level,character,onComplete,onExit,muted,audio,audioNotice,onUnlockAudio,onToggleAudio,story,onSceneReady,epilogueUI,teachControls=false}:{level:1|2|3,character:CharacterId,onComplete:()=>void,onExit:()=>void,muted:boolean,audio:Sound,audioNotice:string,onUnlockAudio:()=>void,onToggleAudio:()=>void,story?:IsoStoryBridge,onSceneReady?:(scene:IsoAdventure|null)=>void,epilogueUI?:ReactNode;teachControls?:boolean}){
 const surface=useRef<HTMLDivElement>(null),host=useRef<HTMLDivElement>(null),scene=useRef<IsoAdventure|undefined>(undefined);
 const [hud,setHud]=useState<AdventureHud>(),[paused,setPaused]=useState(false),[loading,setLoading]=useState(true),[progress,setProgress]=useState(8),[error,setError]=useState(''),[dead,setDead]=useState(false),[attempt,retry]=useState(0);
 const [inputMode,setInputMode]=useState<InputMode>(initialInputMode),[controlHelp,setControlHelp]=useState(()=>{if(!teachControls)return false;try{return sessionStorage.getItem('vt-2d-controls-v1')!=='1';}catch{return true;}}),[padInfo,setPadInfo]=useState('');
 const helpRef=useRef(controlHelp);helpRef.current=controlHelp;
 const [sceneBootMs,setSceneBootMs]=useState<number|undefined>();
 const complete=useRef(onComplete);complete.current=onComplete;
 const portraitAutoPaused=useRef(false),userPaused=useRef(false),pausedActual=useRef(false);
 const markPaused=(value:boolean)=>{pausedActual.current=value;if(!value)userPaused.current=false;setPaused(value);};
 const pauseManually=()=>{userPaused.current=true;scene.current?.setPaused(true);};
 const resumeManually=()=>{userPaused.current=false;scene.current?.setPaused(false);};
 const closeHelp=()=>{setControlHelp(false);try{sessionStorage.setItem('vt-2d-controls-v1','1');}catch{}if(!isPhonePortrait()&&!document.hidden)resumeManually();};
 useEffect(()=>{if(controlHelp&&!loading&&!error)pauseManually();},[controlHelp,loading,error]);
 useEffect(()=>{
  if(!story||!surface.current)return;const root=surface.current.closest('main')??surface.current;
  const session=createInputSession(root,mode=>{scene.current?.clearInput();setInputMode(mode);});setInputMode(session.mode);
  let raf=0,lastDiagnostic=0;
  const frame=(now:number)=>{raf=requestAnimationFrame(frame);const pad=session.poll(),s=scene.current;if(!s)return;
   if(helpRef.current&&now-lastDiagnostic>200){lastDiagnostic=now;setPadInfo(session.diagnostic().map(p=>p.id+' · '+p.mapping+' · ejes '+p.axes.join(', ')+' · botones '+p.buttons.join(', ')).join('\n'));}
   const menu=Array.from(root.querySelectorAll<HTMLElement>('.adventure-controls-help,.prologue-dialog-backdrop,.epilogue-dialog,.emy-feeding,.item-backdrop,.adventure-overlay,[role="dialog"][aria-modal="true"]')).find(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
   if(menu){s.controllerInput=EMPTY_PAD;padMenu(menu,pad);return;}
   if(session.mode!=='gamepad'){s.controllerInput=EMPTY_PAD;return;}
   s.controllerInput=pad;
   if(pad.pressed[9]&&!s.story?.locked()){s.controllerInput=EMPTY_PAD;s.setPaused(!s.paused);return;}
   if(pad.pressed[2]){
    const focused=document.activeElement as HTMLElement|null;
    if(focused&&root.contains(focused)&&focused.matches('button:focus-visible')&&!focused.matches(':disabled'))focused.click();else s.storyInteract();
   }
   if(pad.pressed[3])root.querySelector<HTMLElement>('.prologue-moment button:not(:disabled),.epilogue-picnic-tools button:not(:disabled)')?.click();
   if(pad.pressed[12]||pad.pressed[13]||pad.pressed[14]||pad.pressed[15])padMenu(root,pad);
  };raf=requestAnimationFrame(frame);return()=>{cancelAnimationFrame(raf);session.destroy();};
 },[story!==undefined,attempt]);
 const choose=useCallback((value:boolean)=>scene.current?.chooseItem(value),[]);
 useEffect(()=>{
  if(!host.current)return;const el=host.current;let cancelled=false,game:Phaser.Game|undefined,observer:ResizeObserver|undefined,blur=()=>{},visibility=()=>{},orientation=()=>{};
  const startedAt=performance.now();
   if(import.meta.env.DEV)setSceneBootMs(undefined);
   setLoading(true);setProgress(8);setError('');setDead(false);markPaused(false);portraitAutoPaused.current=false;userPaused.current=false;
  const boot=async()=>{try{
   const [{default:Engine},{IsoAdventure:Adventure}]=await Promise.all([import('phaser'),import('./iso-game')]);if(cancelled)return;setProgress(60);
   const s=new Adventure(level,character,setHud,result=>{if(result==='win')complete.current();else setDead(true);},markPaused,audio,()=>{if(cancelled)return;if(import.meta.env.DEV)setSceneBootMs(Math.round(performance.now()-startedAt));setLoading(false);if(document.hidden){s.setPaused(true);}if(isPhonePortrait()){portraitAutoPaused.current=true;s.setPaused(true);}},setProgress,story);scene.current=s;onSceneReady?.(s);
   game=new Engine.Game({type:Engine.AUTO,parent:el,width:Math.max(1,el.clientWidth),height:Math.max(1,el.clientHeight),backgroundColor:'#f1e5d2',pixelArt:true,render:{antialias:false,roundPixels:true},audio:{noAudio:true},scale:{mode:Engine.Scale.NONE,autoCenter:Engine.Scale.NO_CENTER,expandParent:false},scene:s,input:{activePointers:4}});
   const handlePortrait=()=>{
    if(isPhonePortrait()){
     if(!userPaused.current){
      portraitAutoPaused.current=true;
      if(!pausedActual.current)s.setPaused(true);
     }
    }else if(portraitAutoPaused.current){
     portraitAutoPaused.current=false;
     if(!document.hidden&&!userPaused.current)s.setPaused(false);
    }
   };
   blur=()=>{s.clearInput();if(document.hidden||isPhonePortrait())s.setPaused(true);};
   visibility=()=>{if(document.hidden)blur();else handlePortrait();};
   orientation=()=>{s.clearInput();if(game&&el.clientWidth&&el.clientHeight)game.scale.resize(el.clientWidth,el.clientHeight);handlePortrait();};
   observer=new ResizeObserver(()=>{if(game&&el.clientWidth&&el.clientHeight)game.scale.resize(el.clientWidth,el.clientHeight);});observer.observe(el);
   window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);window.addEventListener('resize',orientation);window.addEventListener('orientationchange',orientation);
  }catch(e){if(!cancelled){setError('No pudimos abrir esta parte del jardín. Puedes volver a intentarlo.');console.error(e);}}};
  void boot();return()=>{cancelled=true;observer?.disconnect();window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',orientation);window.removeEventListener('orientationchange',orientation);game?.destroy(true);scene.current=undefined;onSceneReady?.(null);};
 },[level,character,attempt]);
 return <div ref={surface} className="adventure-wrap" data-input-mode={story?inputMode:undefined} data-scene-boot-ms={import.meta.env.DEV?sceneBootMs:undefined} onPointerDownCapture={()=>{if(!muted&&!paused)onUnlockAudio();}} onKeyDownCapture={e=>{if(!muted&&!paused&&(e.key==='Enter'||e.key===' ')&&(e.target as HTMLElement).closest('button'))onUnlockAudio();}} onClickCapture={e=>{const button=(e.target as HTMLElement).closest('button');if(button&&!button.disabled&&button.getAttribute('aria-label')!=='Silenciar sonido'&&button.getAttribute('aria-label')!=='Activar sonido')audio.ui();}}>
  <div className="adventure-canvas" ref={host} style={epilogueUI?{zIndex:0,isolation:'isolate'}:undefined}/>
  {!loading&&!error&&<><div className="adventure-hud"><button onClick={pauseManually} aria-label="Pausar aventura">Ⅱ</button><AdventureHearts hp={hud?.hp??6}/>{hud?.shield&&<span className="adventure-shield" title="Manto listo" aria-label="Manto listo">✧</span>}<span className="adventure-objective">{hud?.objective} {!story&&<b>{hud?.complete??0}/{hud?.total??3}</b>}</span><span className="adventure-hud-spacer"/><button onClick={onToggleAudio} aria-label={muted?'Activar sonido':'Silenciar sonido'}>{muted?'♪̸':'♪'}</button>{story&&<button aria-label="Controles y mando" onClick={()=>setControlHelp(true)}>?</button>}<FullscreenControl compact/><button onClick={onExit}>Salir</button></div>
   {!story&&hud?.bossHp!==undefined&&<div className="adventure-boss" aria-label={`Desafío final: ${Math.max(0,hud.bossHp)} de ${hud.bossMax} de vida`}><span>EL ECLIPSE DEL JARDÍN</span><div><i style={{width:`${Math.max(0,hud.bossHp)/(hud.bossMax||1)*100}%`}}/></div></div>}
   {level>1&&!story&&<button className="adventure-bomb" aria-label="Usar destello" onClick={()=>scene.current?.bomb()}>✦<small>{hud?.bombs??0}</small></button>}
   {(!story||inputMode==='gamepad')&&<div className="adventure-hint">{story?(inputMode==='gamepad'?'L · Mover   R · Corazones   □ · Interactuar':inputMode==='touch'?'Arrastra a los lados para mover y disparar':'WASD · Mover   Flechas / ratón · Corazones   E · Interactuar'):level===1?'Arrastra a la izquierda para moverte':'Izquierda: mover · derecha: disparar'} {!story&&<span>· WASD{level>1?' + flechas · B: destello':''}</span>}</div>}</>
  {epilogueUI&&!loading&&!paused&&!dead&&!error&&<div className="adventure-epilogue-ui" style={{position:'absolute',inset:0,zIndex:3,pointerEvents:'none'}}>{epilogueUI}</div>}
  {loading&&<div className="adventure-overlay"><div className="pixel-flower">✿</div><p role={error?'alert':'status'}>{error||'Preparando un pequeño mundo…'}</p>{error?<><button className="story-button" onClick={()=>retry(v=>v+1)}>Reintentar</button><button onClick={onExit}>Volver al capítulo</button></>:<div className="adventure-progress" role="progressbar" aria-label="Preparando el jardín" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${progress}%`}}/></div>}</div>}
  {audioNotice&&!loading&&<div className="adventure-audio-notice" role="status">{audioNotice}</div>}
  {controlHelp&&!loading&&!error&&<div className="adventure-overlay adventure-controls-help" role="dialog" aria-modal="true"><div className="adventure-manual"><span>MANUAL DE CAMPO · 01</span><h2>Controles del jardín</h2><div className="adventure-manual-tabs">{inputMode==='touch'?'TÁCTIL':inputMode==='gamepad'?'MANDO':'TECLADO Y RATÓN'}</div><div className="adventure-manual-grid"><p><b>{inputMode==='gamepad'?'L':inputMode==='touch'?'◉ Izquierda':'W A S D'}</b>Caminar</p><p><b>{inputMode==='gamepad'?'R':inputMode==='touch'?'◉ Derecha':'↑ ↓ ← →'}</b>Corazones</p><p><b>{inputMode==='gamepad'?'□ / X':inputMode==='touch'?'Tocar botón':'E'}</b>Interactuar</p><p><b>{inputMode==='gamepad'?'OPTIONS':inputMode==='touch'?'Ⅱ':'Esc'}</b>Pausa</p></div><small>El mando estándar cambia la interfaz al moverlo. Para probar un mando alternativo, pulsa sus botones.</small>{padInfo&&<pre className="adventure-pad-info">{padInfo}</pre>}<button className="story-button" onClick={closeHelp}>Entendido</button></div></div>}
  {paused&&!controlHelp&&!dead&&!loading&&<div className="adventure-overlay"><span className="story-kicker">UN MOMENTO DE CALMA</span><h2>Una pequeña pausa</h2><p>Tu aventura te espera aquí.</p><button className="story-button" onClick={resumeManually}>Continuar</button><button onClick={onExit}>Volver al capítulo</button></div>}
  {hud?.offer&&!paused&&!dead&&!loading&&<OfferDialog offer={hud.offer} choose={choose}/>}
  {dead&&!loading&&<div className="adventure-overlay"><span className="pixel-flower">♡</span><h2>Un pequeño respiro</h2><p>Puedes volver a intentarlo desde el inicio de esta aventura.</p><button className="story-button" onClick={()=>retry(v=>v+1)}>Intentarlo otra vez</button><button onClick={onExit}>Volver al capítulo</button></div>}
 </div>;
}
