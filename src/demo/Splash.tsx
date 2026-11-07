import {useEffect,useRef,useState} from 'react';
import './splash.css';

export function Splash({onStart,muted}:{onStart:()=>void,muted:boolean}){
 const [hasPicture,setHasPicture]=useState(true),begun=useRef(false);
 const start=()=>{if(begun.current)return;begun.current=true;onStart();};
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{if(event.key==='Tab'||event.key==='Shift'||event.key==='Escape'||event.repeat)return;start();};
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[onStart]);
 return <main className="valeteamo-splash" onClick={start} onPointerDown={e=>{if(e.pointerType==='touch')start();}}>
  <div className="splash-frame">
   {hasPicture?<img src="./demo-assets/005-portada-valeteamo.webp" alt="Portada ilustrada: VALETEAMO, Kitty y otro gatito en un picnic junto al río" onError={()=>setHasPicture(false)}/>:<div className="splash-fallback" role="img" aria-label="Portada temporal del jardín, mientras se incorpora la ilustración original">
    <div className="splash-clouds" aria-hidden="true">☁　　 ☁</div><h1>VALETEAMO</h1><div className="splash-fallback-art" aria-hidden="true">✿ ♡ ✿</div><p>Un jardín, una sorpresa y una aventura juntos</p>
   </div>}
   <span className="splash-water" aria-hidden="true"/><span className="splash-leaf a" aria-hidden="true">✿</span><span className="splash-leaf b" aria-hidden="true">✦</span><span className="splash-leaf c" aria-hidden="true">❀</span>
  </div>
  <button className="splash-start" onClick={e=>{e.stopPropagation();start();}}>Presiona cualquier botón para iniciar <span>♡</span></button>
  <span className="splash-audio-hint">{muted?'Sonido desactivado':'El sonido comienza después del primer toque'}</span>
 </main>;
}