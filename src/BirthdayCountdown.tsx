import {useEffect,useRef,useState,type FormEvent,type ReactNode} from 'react';
import './birthday-countdown.css';

// Medianoche del 5 de diciembre de 2026 en Santiago de Chile.
const opensAt = Date.parse('2026-12-05T00:00:00-03:00');
const remaining = () => Math.max(0,Math.ceil((opensAt-Date.now())/1000));

export function BirthdayCountdown({children}:{children:ReactNode}){
 const [entered,setEntered]=useState(false);
 const [seconds,setSeconds]=useState(remaining);
 const [code,setCode]=useState('');
 const [invalid,setInvalid]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const locked=seconds>0&&!entered;

 useEffect(()=>{
  if(!locked)return;
  const refresh=()=>setSeconds(remaining());
  const timer=window.setInterval(refresh,250);
  document.addEventListener('visibilitychange',refresh);
  return ()=>{
   window.clearInterval(timer);
   document.removeEventListener('visibilitychange',refresh);
  };
 },[locked]);

 function openAdmin(){
  setCode('');
  setInvalid(false);
  dialog.current?.showModal();
 }

 function enterAdmin(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(code.trim().toUpperCase()==='LP'){
   dialog.current?.close();
   setEntered(true);
  }else setInvalid(true);
 }

 if(entered)return children;
 const parts=[
  ['Días',Math.floor(seconds/86400)],
  ['Horas',Math.floor(seconds/3600)%24],
  ['Minutos',Math.floor(seconds/60)%60],
  ['Segundos',seconds%60]
 ] as const;

 return <main className="birthday-countdown">
  <button className="birthday-admin-toggle" type="button" aria-label="Administración" aria-haspopup="dialog" onClick={openAdmin}>
   <span aria-hidden="true">⚙</span>
  </button>
  <section className="birthday-countdown-content" aria-labelledby="birthday-countdown-title">
   <h1 id="birthday-countdown-title">Feliz cumpleaños <em>Vale</em></h1>
   <p><time dateTime="2026-12-05">5 de diciembre</time></p>
   {seconds>0?<dl className="birthday-time" role="timer" aria-label="Tiempo para abrir el regalo">
    {parts.map(([label,value])=><div key={label}>
     <dt>{label}</dt><dd>{String(value).padStart(2,'0')}</dd>
    </div>)}
   </dl>:<button className="birthday-submit" type="button" onClick={()=>setEntered(true)}>Abrir mi sorpresa</button>}
  </section>
  <dialog ref={dialog} className="birthday-admin" aria-labelledby="birthday-admin-title">
   <form onSubmit={enterAdmin}>
    <div className="birthday-admin-header">
     <h2 id="birthday-admin-title">Administración</h2>
     <button type="button" className="birthday-admin-close" aria-label="Cerrar administración" onClick={()=>dialog.current?.close()}>×</button>
    </div>
    <label htmlFor="birthday-access-code">Código de acceso</label>
    <input id="birthday-access-code" type="password" autoFocus autoComplete="off" value={code}
     aria-invalid={invalid} aria-describedby={invalid?'birthday-code-error':undefined}
     onChange={event=>{setCode(event.target.value);setInvalid(false);}}/>
    {invalid&&<p id="birthday-code-error" role="alert">El código no es correcto.</p>}
    <button className="birthday-submit" type="submit">Entrar</button>
   </form>
  </dialog>
 </main>;
}
