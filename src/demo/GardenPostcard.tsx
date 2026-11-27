import {useEffect,useRef} from 'react';
import './garden-postcard.css';

// Frame the real renderer image. No reference to the 3D or cosmic scenes,
// no network request and no new persisted gameplay state.
export function makeGardenPostcard(image:HTMLImageElement,title:string):string{
 const w=960,h=650,canvas=document.createElement('canvas');
 canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d');if(!c)throw Error('Postal no disponible');
 c.fillStyle='#fbf1e5';c.fillRect(0,0,w,h);
 c.strokeStyle='#d0a1b0';c.lineWidth=2;c.strokeRect(11,11,w-22,h-22);
 c.fillStyle='#e4d5d2';c.fillRect(27,27,906,522);
 const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
 if(!iw||!ih)throw Error('La captura está vacía');
 const ratio=Math.min(906/iw,522/ih),rw=Math.round(iw*ratio),rh=Math.round(ih*ratio);
 c.imageSmoothingEnabled=false;c.drawImage(image,27+(906-rw)/2,27+(522-rh)/2,rw,rh);
 c.fillStyle='#8e5d77';c.textAlign='center';c.font='bold 25px Georgia,serif';c.fillText(title,w/2,589);
 c.fillStyle='#a47b8d';c.font='15px Georgia,serif';c.fillText('♡  Un recuerdo de ValeTeAmo  ♡',w/2,619);
 return canvas.toDataURL('image/png');
}
export function GardenPostcard({title,image,error,onClose}:{title:string;image:string;error:boolean;onClose:()=>void}){
 const box=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  const modal=box.current;
  if(modal&&!modal.open)modal.showModal();close.current?.focus();
  return()=>{modal?.close();previous?.focus();};
 },[]);
 useEffect(()=>{
  // No game shortcuts reach the underlying Phaser scene while reading.
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();onClose();}else if(e.key!=='Tab'){e.stopImmediatePropagation();}};
  window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);
 },[onClose]);
 return <dialog ref={box} className="garden-postcard" aria-labelledby="garden-postcard-title" onCancel={e=>{e.preventDefault();onClose();}}>
  <header><span>♡ Un recuerdo</span><button ref={close} type="button" onClick={onClose} aria-label="Cerrar postal">×</button></header>
  <h2 id="garden-postcard-title">{title}</h2>
  {image?<img src={image} alt={'Postal del juego: '+title}/>:<p role="status">{error?'No pudimos capturar este momento. Puedes cerrar e intentarlo otra vez.':'Preparando tu postal…'}</p>}
  <footer>{image&&<a href={image} download="ValeTeAmo-postal.png">Guardar imagen</a>}<button type="button" onClick={onClose}>Volver al jardín</button></footer>
 </dialog>;
}
