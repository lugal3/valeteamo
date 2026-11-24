import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import type {Sound} from '../audio';
import {advanceEmyFeeding,churuInReach,EMY_MOUTH} from './emy-feeding-state';
import './emy-feeding.css';

// The modal controls only the treat. The cat stays anchored, with pre-rendered
// expressions and a tongue animation; the actual Phaser world remains paused.
export function EmyFeeding({audio,onComplete,onCancel}:{audio:Sound;onComplete:()=>void;onCancel:()=>void}){
 const [tip,setTip]=useState({x:.76,y:.68}),[progress,setProgress]=useState(0);
 const [holding,setHolding]=useState(false),[blink,setBlink]=useState(false);
 const [clock,setClock]=useState(0);
 const stage=useRef<HTMLDivElement>(null),tube=useRef<HTMLButtonElement>(null);
 const live=useRef({tip,progress:0,holding:false,done:false,lastSound:0});
 const drag=useRef<number|null>(null),completion=useRef(onComplete),cancel=useRef(onCancel);
 const reduced=useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 completion.current=onComplete;cancel.current=onCancel;
 const aim=(x:number,y:number)=>{const point={x:Math.max(.06,Math.min(.94,x)),y:Math.max(.12,Math.min(.84,y))};live.current.tip=point;setTip(point);};
 const hold=(value:boolean)=>{live.current.holding=value;setHolding(value);};
 const move=(e:ReactPointerEvent)=>{
  const r=stage.current?.getBoundingClientRect();if(!r)return;
  aim((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);
 };
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;tube.current?.focus();
  for(const pose of ['idle','blink','lick','love']){const image=new Image();image.src=`./sprites/emy-${pose}.png`;}
  let raf=0,last=performance.now(),finishTimer=0;
  const stop=()=>{live.current.holding=false;setHolding(false);drag.current=null;};
  const frame=(now:number)=>{
   const dt=(now-last)/1000;last=now;
   const s=live.current;
   if(!document.hidden&&!s.done){
    setClock(now);setBlink(now%4200>4010);
    // Never display 100% while the completion state is still 99.6%.
    // A player releasing the treat at the displayed 100% would leave the
    // Churu dialog stuck forever. Snap the final half-percent to done.
    const raw=advanceEmyFeeding(s.progress,dt,s.holding,s.tip.x,s.tip.y);
    const next=raw>=99.5?100:raw;
    if(next!==s.progress){
     s.progress=next;setProgress(next);
     if(now-s.lastSound>550){audio.tone(410+next*2,.07,.012,'sine');s.lastSound=now;}
    }
    if(next>=100){
     s.done=true;stop();
     if(!reduced.current)try{navigator.vibrate?.([35,45,70]);}catch{}
     audio.tone(660,.18,.025,'triangle');audio.tone(990,.3,.016);
     finishTimer=window.setTimeout(()=>{
      // Closing pop also works when the supplied sample has not loaded yet.
      audio.tone(350,.09,.02,'triangle');audio.tone(190,.12,.012);
      completion.current();
     },reduced.current?900:1550);
    }
   }
   raf=requestAnimationFrame(frame);
  };
  raf=requestAnimationFrame(frame);
  const key=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!live.current.done)cancel.current();}
   // Keep keyboard focus inside the fullscreen interaction.
   if(e.key==='Tab'){
    const buttons=stage.current?.parentElement?.querySelectorAll<HTMLButtonElement>('button');
    if(buttons?.length){e.preventDefault();const i=Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}
   }
  };
  const visibility=()=>{if(document.hidden)stop();};
  window.addEventListener('blur',stop);document.addEventListener('visibilitychange',visibility);
  window.addEventListener('keydown',key,true);
  return()=>{cancelAnimationFrame(raf);clearTimeout(finishTimer);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('keydown',key,true);previous?.focus();};
 },[audio]);
 const full=progress>=100,eating=holding&&churuInReach(tip.x,tip.y)&&!full;
 const expression=full?'love':blink?'blink':eating&&Math.floor(clock/150)%2?'lick':'idle';
 return <section className={'emy-feeding'+(full?' is-full':'')} role="dialog" aria-modal="true" aria-labelledby="emy-title" data-progress={Math.round(progress)} data-eating={eating}>
  <header><div><span>UN RATITO CON EMY</span><h2 id="emy-title">{full?'¡Emy te quiere!':'Un Churu para Emy'}</h2></div>
   <button type="button" onClick={onCancel} disabled={full} aria-label="Volver al jardín">Cerrar</button></header>
  <p className="emy-instruction" role="status">{full?'Gracias por cuidarla ♡':'Arrastra la punta del Churu hasta su boquita y mantenla cerca.'}</p>
  <div className="emy-stage" ref={stage}>
   <div className={'emy-pet'+(eating?' is-eating':'')}><img src={`./sprites/emy-${expression}.png`} alt="Emy, gatita gris de pelo largo y ojos verdes" draggable={false}/></div>
   {full&&<div className="emy-love" aria-hidden="true">♥　♡　♥</div>}
   {!full&&<span className={'emy-mouth-guide'+(eating?' is-eating':'')} style={{left:EMY_MOUTH.x*100+'%',top:EMY_MOUTH.y*100+'%'}} aria-hidden="true"/>}
   <button ref={tube} type="button" className={'emy-churu'+(full?' is-empty':'')} aria-label="Mover Churu: flechas; mantén espacio o Enter para alimentar" aria-describedby="emy-keys" disabled={full}
    style={{left:tip.x*100+'%',top:tip.y*100+'%','--remaining':String(1-progress/150)} as React.CSSProperties}
    onPointerDown={e=>{if(drag.current!==null||e.button!==0)return;e.preventDefault();e.stopPropagation();drag.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);hold(true);move(e);void audio.start();}}
    onPointerMove={e=>{if(drag.current===e.pointerId)move(e);}}
    onPointerUp={e=>{if(drag.current===e.pointerId){hold(false);drag.current=null;}}}
    onPointerCancel={()=>{hold(false);drag.current=null;}} onLostPointerCapture={()=>{hold(false);drag.current=null;}}
    onBlur={()=>hold(false)}
    onKeyDown={e=>{if(full)return;const d=.025;
     if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key)){e.preventDefault();e.stopPropagation();void audio.start();}
     const p=live.current.tip;
     if(e.key==='ArrowLeft')aim(p.x-d,p.y);if(e.key==='ArrowRight')aim(p.x+d,p.y);
     if(e.key==='ArrowUp')aim(p.x,p.y-d);if(e.key==='ArrowDown')aim(p.x,p.y+d);
     if(e.key===' '||e.key==='Enter')hold(true);
    }} onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();hold(false);}}}>
    <i className="emy-paste"/><span className="emy-wrapper"><b>Churu</b><small>♡</small></span><span className="emy-kitty-paw"/>
   </button>
  </div>
  <footer><div className="emy-meter" role="progressbar" aria-label="Emy alimentada" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{width:progress+'%'}}/></div><strong>{Math.floor(progress)}%</strong></footer>
  <p id="emy-keys" className="emy-keys">PC: mueve con las flechas y mantén espacio. En celular: arrastra y mantén el Churu.</p>
 </section>;
}
