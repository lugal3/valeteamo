import {useEffect,useRef,useState} from 'react';
import './splash.css';

function playWelcomeChime(){
 try{
  const context=new AudioContext();
  const gain=context.createGain();gain.gain.value=.055;gain.connect(context.destination);
  const notes=[523.25,659.25,783.99];
  for(let i=0;i<notes.length;i++){
   const now=context.currentTime+i*.115,osc=context.createOscillator(),envelope=context.createGain();
   osc.type='sine';osc.frequency.value=notes[i];
   envelope.gain.setValueAtTime(.0001,now);
   envelope.gain.exponentialRampToValueAtTime(.5,now+.025);
   envelope.gain.exponentialRampToValueAtTime(.0001,now+.37);
   osc.connect(envelope);envelope.connect(gain);osc.start(now);osc.stop(now+.4);
  }
  setTimeout(()=>{void context.close().catch(()=>{});},950);
 }catch{/* The game remains playable if a browser blocks audio. */}
}
export function Splash({onStart,muted}:{onStart:()=>void,muted:boolean}){
 const [hasPicture,setHasPicture]=useState(true),begun=useRef(false);
 const start=()=>{if(begun.current)return;begun.current=true;if(!muted)playWelcomeChime();onStart();};
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{if(event.key==='Tab'||event.key==='Shift'||event.key==='Escape'||event.repeat)return;start();};
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[onStart,muted]);
 return <main className="valeteamo-splash" onClick={start} onPointerDown={e=>{if(e.pointerType==='touch')start();}}>
  <div className="splash-frame">
   <div className="splash-backdrop" aria-hidden="true"/>
   {hasPicture?<img src="./demo-assets/portada-v2.webp" alt="VALETEAMO: Kitty y Louis comparten un picnic bajo los árboles junto a un sendero luminoso" onError={()=>setHasPicture(false)}/>:<div className="splash-fallback" role="img" aria-label="Portada temporal del jardín de Valeteamo">
    <div className="splash-clouds" aria-hidden="true">☁　　 ☁</div><h1>VALETEAMO</h1><div className="splash-fallback-art" aria-hidden="true">✿ ♡ ✿</div><p>Un jardín, una sorpresa y una aventura juntos</p>
   </div>}
   <div className="splash-particles" aria-hidden="true">
    {Array.from({length:22},(_,i)=><span key={i} className="splash-particle" style={{left:`${6+(i*47)%88}%`,top:`${10+(i*31)%78}%`,animationDelay:`${-(i*0.63)%8}s`,animationDuration:`${4.5+(i%5)*1.2}s`}}>{i%3===0?'✦':i%3===1?'✿':'·'}</span>)}
   </div>
   <span className="splash-water" aria-hidden="true"/>
   <button className="splash-start" aria-label="Presiona cualquier botón para iniciar" onClick={e=>{e.stopPropagation();start();}}><span className="splash-hidden">Presiona cualquier botón para iniciar</span></button>
  </div>
  <span className="splash-audio-hint">{muted?'Sonido desactivado':'Toca PLAY para comenzar ♡'}</span>
 </main>;
}