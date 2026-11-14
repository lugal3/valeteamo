import {useEffect,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent,type WheelEvent as ReactWheelEvent,type KeyboardEvent as ReactKeyboardEvent} from 'react';
import './interactive-postcard.css';

const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
type Phase='sealed'|'opening'|'inspecting';
type Position={x:number;y:number};
type Props={photo:string;letter:string;title:string};

/**
 * CSS perspective scene: the same textured piece of paper physically rises
 * out of an envelope, then exposes separate front and reverse planes.
 * No WebGL dependency: works on iOS Safari and the installed PWA.
 */
export function InteractivePostcard({photo,letter,title}:Props){
 const [phase,setPhase]=useState<Phase>('sealed');
 const [yaw,setYaw]=useState(0);
 const [pitch,setPitch]=useState(-6);
 const [zoom,setZoom]=useState(1);
 const [loaded,setLoaded]=useState(true);
 const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 const pointers=useRef(new Map<number,Position>());
 const gesture=useRef<{pinchDistance:number;pinchZoom:number}|null>(null);
 const drag=useRef<{id:number;last:Position;start:Position}|null>(null);
 const suppressClick=useRef(false);
 useEffect(()=>()=>{if(timeout.current)clearTimeout(timeout.current);},[]);
 const open=()=>{
  if(phase!=='sealed')return;
  setPhase('opening');
  timeout.current=setTimeout(()=>setPhase('inspecting'),1250);
 };
 const rotate=()=>{
  if(phase!=='inspecting')return;
  if(suppressClick.current){suppressClick.current=false;return;}
  setYaw(y=>y+180);
 };
 const reset=()=>{setYaw(0);setPitch(-6);setZoom(1);};
 const setZoomBy=(v:number)=>setZoom(z=>clamp(z+v,.80,1.72));
 const onPointerDown=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if(phase!=='inspecting')return;
  try{e.currentTarget.setPointerCapture(e.pointerId);}catch{/* synthetic gestures in browser tests */}
  const position={x:e.clientX,y:e.clientY};
  pointers.current.set(e.pointerId,position);
  suppressClick.current=false;
  if(pointers.current.size===2){
   const [a,b]=[...pointers.current.values()];
   gesture.current={pinchDistance:Math.max(1,distance(a,b)),pinchZoom:zoom};
   drag.current=null;
  }else{
   drag.current={id:e.pointerId,start:position,last:position};
  }
 };
 const onPointerMove=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if(!pointers.current.has(e.pointerId))return;
  const p={x:e.clientX,y:e.clientY};
  pointers.current.set(e.pointerId,p);
  if(pointers.current.size>=2){
   const [a,b]=[...pointers.current.values()];
   if(!gesture.current)gesture.current={pinchDistance:Math.max(1,distance(a,b)),pinchZoom:zoom};
   setZoom(clamp(gesture.current.pinchZoom*distance(a,b)/gesture.current.pinchDistance,.80,1.72));
   suppressClick.current=true;
   return;
  }
  if(drag.current?.id!==e.pointerId)return;
  const prev=drag.current.last;
  drag.current.last=p;
  if(distance(p,drag.current.start)>5)suppressClick.current=true;
  setYaw(y=>y+(p.x-prev.x)*.59);
  setPitch(x=>clamp(x-(p.y-prev.y)*.37,-38,38));
 };
 const onPointerEnd=(e:ReactPointerEvent<HTMLDivElement>)=>{
  pointers.current.delete(e.pointerId);
  if(gesture.current){gesture.current=null;suppressClick.current=true;}
  drag.current=null;
 };
 const onWheel=(e:ReactWheelEvent<HTMLDivElement>)=>{
  if(phase!=='inspecting')return;
  e.preventDefault();
  setZoom(z=>clamp(z*Math.exp(-e.deltaY*.0011),.80,1.72));
 };
 const onKeyDown=(e:ReactKeyboardEvent<HTMLDivElement>)=>{
  if(phase!=='inspecting')return;
  if(e.key==='Enter'||e.key===' '){e.preventDefault();rotate();}
  else if(e.key==='ArrowLeft'){e.preventDefault();setYaw(y=>y-15);}
  else if(e.key==='ArrowRight'){e.preventDefault();setYaw(y=>y+15);}
  else if(e.key==='ArrowUp'){e.preventDefault();setPitch(p=>clamp(p+12,-38,38));}
  else if(e.key==='ArrowDown'){e.preventDefault();setPitch(p=>clamp(p-12,-38,38));}
  else if(e.key==='+'||e.key==='='){e.preventDefault();setZoomBy(.12);}
  else if(e.key==='-'){e.preventDefault();setZoomBy(-.12);}
 };
 const normalized=(yaw%360+360)%360;
 const side=normalized>90&&normalized<270?'back':'front';
 const transformStyle={'--card-yaw':yaw+'deg','--card-pitch':pitch+'deg','--card-zoom':zoom} as CSSProperties;
 return <div className="cx-postcard-experience" data-postcard-phase={phase} data-postcard-side={side} data-postcard-zoom={zoom.toFixed(2)} data-postcard-yaw={yaw.toFixed(2)} data-postcard-pitch={pitch.toFixed(2)} aria-label="Sorpresa: postal tridimensional">
  <div className="cx-postcard-scene" aria-label={phase==='sealed'?'Sobre cerrado':'Postal de Robin y Starfire'}>
   <div className="cx-postcard-envelope" aria-hidden="true">
    <div className="cx-postcard-envelope-back"/>
    <div className="cx-postcard-envelope-flap"/>
    <div className="cx-postcard-envelope-pocket"/>
    <span className="cx-postcard-envelope-seal">♥</span>
   </div>
   <div className="cx-postcard-object" style={transformStyle}
    role={phase==='inspecting'?'button':undefined} tabIndex={phase==='inspecting'?0:-1}
    aria-label="Postal 3D: arrastra para girar, toca para darle la vuelta"
    onClick={rotate} onKeyDown={onKeyDown} onPointerDown={onPointerDown}
    onPointerMove={onPointerMove} onPointerUp={onPointerEnd}
    onPointerCancel={onPointerEnd} onWheel={onWheel}>
    <div className="cx-postcard-rotation">
     <div className="cx-postcard-face cx-postcard-front">
      {loaded?<img src={photo} alt="Robin y Starfire abrazados sobre una terraza nocturna de ciudad, postal pixel art" draggable={false} onError={()=>setLoaded(false)}/>:<div className="cx-postcard-image-missing">♡ Nuestra postal</div>}
      <span className="cx-postcard-edge" aria-hidden="true"/>
     </div>
     <div className="cx-postcard-face cx-postcard-back">
      <div className="cx-postcard-back-inner">
       <span className="cx-postcard-back-stamp">PARA VALE ♡</span>
       <h2>{title}</h2>
       <p>{letter}</p>
       <span className="cx-postcard-back-signature">Con amor, siempre ♡</span>
      </div>
     </div>
    </div>
   </div>
   {phase==='sealed'&&<button className="cx-postcard-open" onClick={open} aria-label="Abrir sobre y sacar postal">✉ <span>Toca el sobre para descubrir nuestra postal</span></button>}
  </div>
  {phase==='opening'&&<p className="cx-postcard-status" role="status">Un recuerdo para ti… ♡</p>}
  {phase==='inspecting'&&<div className="cx-postcard-controls" aria-label="Controles de la postal">
   <p className="cx-postcard-instruction">Arrastra para girar · toca para voltear · pellizca para acercar</p>
   <div className="cx-postcard-button-row">
    <button type="button" onClick={()=>setYaw(v=>v+180)} aria-label="Voltear postal">↻ <span>Voltear</span></button>
    <button type="button" onClick={()=>setZoomBy(-.12)} aria-label="Alejar postal">−</button>
    <output aria-label="Ampliación de la postal">{Math.round(zoom*100)}%</output>
    <button type="button" onClick={()=>setZoomBy(.12)} aria-label="Acercar postal">+</button>
    <button type="button" onClick={reset} aria-label="Centrar postal">⌖ <span>Centrar</span></button>
   </div>
  </div>}
 </div>;
}
