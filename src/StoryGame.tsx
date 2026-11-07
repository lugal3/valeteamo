import {useEffect,useRef,useState} from 'react';
import type Phaser from 'phaser';
import type {CharacterId} from './characters';
import type {AdventureHud,IsoAdventure} from './iso-game';
import {Sound} from './audio';

export function StoryGame({level,character,onComplete,onExit,muted}:{level:1|2|3,character:CharacterId,onComplete:()=>void,onExit:()=>void,muted:boolean}){
 const host=useRef<HTMLDivElement>(null),scene=useRef<IsoAdventure|undefined>(undefined);
 const [hud,setHud]=useState<AdventureHud>(),[paused,setPaused]=useState(false),[loading,setLoading]=useState(true),[progress,setProgress]=useState(8),[error,setError]=useState(''),[dead,setDead]=useState(false),[attempt,retry]=useState(0);
 const sound=useRef<Sound>(new Sound());const complete=useRef(onComplete);complete.current=onComplete;
 useEffect(()=>{sound.current.muted=muted;},[muted]);
 useEffect(()=>{
  if(!host.current)return;const el=host.current;let cancelled=false,game:Phaser.Game|undefined,observer:ResizeObserver|undefined,blur=()=>{},visibility=()=>{},orientation=()=>{};
  setLoading(true);setProgress(8);setError('');setDead(false);setPaused(false);sound.current.muted=muted;sound.current.start();
  const boot=async()=>{try{
   const [{default:Engine},{IsoAdventure:Adventure}]=await Promise.all([import('phaser'),import('./iso-game')]);if(cancelled)return;setProgress(60);
   const s=new Adventure(level,character,setHud,result=>{if(result==='win')complete.current();else setDead(true);},setPaused,sound.current,()=>{if(cancelled)return;setLoading(false);if(innerHeight>innerWidth)s.setPaused(true);},setProgress);scene.current=s;
   game=new Engine.Game({type:Engine.AUTO,parent:el,width:800,height:450,backgroundColor:'#f3e6d5',pixelArt:true,render:{antialias:false,roundPixels:true},scale:{mode:Engine.Scale.FIT,autoCenter:Engine.Scale.CENTER_BOTH},scene:s,input:{activePointers:4}});
   blur=()=>s.setPaused(true);visibility=()=>{if(document.hidden)blur();};orientation=()=>{s.clearInput();if(game&&el.clientWidth&&el.clientHeight)game.scale.setParentSize(el.clientWidth,el.clientHeight);if(innerHeight>innerWidth)blur();};
   observer=new ResizeObserver(()=>{if(game&&el.clientWidth&&el.clientHeight)game.scale.setParentSize(el.clientWidth,el.clientHeight);});observer.observe(el);
   window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);window.addEventListener('resize',orientation);window.addEventListener('orientationchange',orientation);
  }catch(e){if(!cancelled){setError('No pudimos abrir esta parte del jardín. Puedes volver a intentarlo.');console.error(e);}}};
  void boot();return()=>{cancelled=true;observer?.disconnect();window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',orientation);window.removeEventListener('orientationchange',orientation);game?.destroy(true);scene.current=undefined;sound.current.suspend();};
 },[level,character,attempt]);
 useEffect(()=>()=>sound.current.destroy(),[]);
 return <div className="adventure-wrap">
  <div className="adventure-canvas" ref={host}/>
  {!loading&&!error&&<><div className="adventure-hud"><button onClick={()=>scene.current?.setPaused(true)} aria-label="Pausar aventura">Ⅱ</button><span className="adventure-hearts" aria-label={`${hud?.hp??6} puntos de vida`}>{'♥'.repeat(Math.ceil((hud?.hp??6)/2))}</span><span className="adventure-objective">{hud?.objective} <b>{hud?.complete??0}/{hud?.total??3}</b></span><button onClick={onExit}>Salir</button></div>
   {level>1&&<button className="adventure-bomb" aria-label="Usar destello" onClick={()=>scene.current?.bomb()}>✦<small>{hud?.bombs??0}</small></button>}
   <div className="adventure-hint">Izquierda: mover · derecha: apuntar <span>· WASD + flechas · B: destello</span></div></>}
  {loading&&<div className="adventure-overlay"><div className="pixel-flower">✿</div><p role={error?'alert':'status'}>{error||'Preparando un pequeño mundo…'}</p>{error?<><button className="story-button" onClick={()=>retry(v=>v+1)}>Reintentar</button><button onClick={onExit}>Volver al capítulo</button></>:<div className="adventure-progress" role="progressbar" aria-label="Preparando el jardín" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${progress}%`}}/></div>}</div>}
  {paused&&!dead&&!loading&&<div className="adventure-overlay"><span className="story-kicker">UN MOMENTO DE CALMA</span><h2>Una pequeña pausa</h2><p>Tu aventura te espera aquí.</p><button className="story-button" onClick={()=>scene.current?.setPaused(false)}>Continuar</button><button onClick={onExit}>Volver al capítulo</button></div>}
  {dead&&!loading&&<div className="adventure-overlay"><span className="pixel-flower">♡</span><h2>Un pequeño respiro</h2><p>Puedes volver a intentarlo desde el inicio de esta aventura.</p><button className="story-button" onClick={()=>retry(v=>v+1)}>Intentarlo otra vez</button><button onClick={onExit}>Volver al capítulo</button></div>}
  {!loading&&<div className="adventure-rotate"><span>↻</span><h2>Gira tu teléfono</h2><p>Este tramo se juega mejor en horizontal.<br/>Tu aventura está en pausa.</p><button onClick={onExit}>Volver al capítulo</button></div>}
 </div>;
}
