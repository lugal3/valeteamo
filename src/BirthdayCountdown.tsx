import {cloneElement,isValidElement,lazy,Suspense,useEffect,useRef,useState,type FormEvent,type ReactElement,type ReactNode} from 'react';
import './birthday-countdown.css';

const CosmosExperience=lazy(()=>import('./experience/CosmosExperience'));

// Medianoche del 5 de diciembre de 2026 en Santiago de Chile.
const opensAt = Date.parse('2026-12-05T00:00:00-03:00');
const remaining = () => Math.max(0,Math.ceil((opensAt-Date.now())/1000));

type Simulation={onExit:()=>void;onEnterGame:()=>void};
export function BirthdayCountdown({children,simulation}:{children:ReactNode;simulation?:Simulation}){
 const simulationTarget=useRef(Date.now()+10000);
 const getRemaining=()=>simulation?Math.max(0,Math.ceil((simulationTarget.current-Date.now())/1000)):remaining();
 const [entered,setEntered]=useState(false);
 const [launchClassic,setLaunchClassic]=useState(false);
 const [adminMode,setAdminMode]=useState(false);
 const [giftLaunched,setGiftLaunched]=useState(false);
 const [installOpen,setInstallOpen]=useState(false);
 const [seconds,setSeconds]=useState(getRemaining);
 const [code,setCode]=useState('');
 const [invalid,setInvalid]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const locked=seconds>0&&!entered;

 useEffect(()=>{
  if(!locked)return;
  const refresh=()=>setSeconds(getRemaining());
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
   setAdminMode(true);
   setEntered(true);
  }else setInvalid(true);
 }

 if(entered){
  const initialRoute=adminMode?'tests':launchClassic?'rescue':null;
  return initialRoute&&isValidElement(children)
   ?cloneElement(children as ReactElement<{initialRoute?:'classic'|'rescue'|'tests'}>,{initialRoute})
   :children;
 }
 if(giftLaunched)return <Suspense fallback={<main className="birthday-countdown" role="status">Abriendo el universo…</main>}><CosmosExperience preview={!!simulation} startAt="gift" onExit={simulation?.onExit??(()=>setEntered(true))} onEnterGame={simulation?.onEnterGame??(()=>{setLaunchClassic(true);setEntered(true);})}/></Suspense>;
 const parts=[
  ['Días',Math.floor(seconds/86400)],
  ['Horas',Math.floor(seconds/3600)%24],
  ['Minutos',Math.floor(seconds/60)%60],
  ['Segundos',seconds%60]
 ] as const;

 return <main className="birthday-countdown">
  <div className="blossom-turn-background" aria-hidden="true">
   <span className="blossom-glow blossom-glow-a"/><span className="blossom-glow blossom-glow-b"/>
   {Array.from({length:18},(_,i)=><i key={i} className="blossom-petal" style={{left:((i*41+9)%100)+'%',top:((i*67+8)%100)+'%',animationDelay:(-i*.41)+'s',animationDuration:(6+i%5)+'s'}}/>)}
  </div>
  {simulation?<button className="birthday-admin-toggle" type="button" onClick={simulation.onExit} aria-label="Volver a pruebas">←</button>:<button className="birthday-admin-toggle" type="button" aria-label="Administración" aria-haspopup="dialog" onClick={openAdmin}>
   <span aria-hidden="true">⚙</span>
  </button>}
  <section className="birthday-countdown-content" aria-labelledby="birthday-countdown-title">
   <div className="birthday-countdown-emblem" aria-hidden="true">✿ <span>♡</span> ✧</div>
   <span className="birthday-cosmic-label">{simulation?'LP · SIMULACIÓN T−10 s':'UNA AVENTURA PARA DOS · ♡'}</span>
   <h1 id="birthday-countdown-title">Feliz cumpleaños <em>Vale</em></h1>
   <p><time dateTime="2026-12-05">5 de diciembre</time> · El universo espera por ti</p>
   {seconds>0?<dl className="birthday-time" role="timer" aria-label="Tiempo para abrir el regalo">
    {parts.map(([label,value])=><div key={label}>
     <dt>{label}</dt><dd>{String(value).padStart(2,'0')}</dd>
    </div>)}
   </dl>:<button className="birthday-submit" type="button" onClick={()=>setGiftLaunched(true)}>Abrir mi sorpresa</button>}
   <div className="birthday-countdown-divider" aria-hidden="true"><i/>✿<i/></div>
   <button className="birthday-iphone-help" type="button" onClick={()=>setInstallOpen(v=>!v)} aria-expanded={installOpen}>✦ iPhone: cómo abrir sin las barras de Safari</button>
   {installOpen&&<div className="birthday-iphone-panel"><p>1. Abre este enlace en Safari.</p><p>2. Pulsa Compartir → Añadir a pantalla de inicio.</p><p>3. Si aparece, activa «Abrir como app web».</p><p>4. Abre el icono recién creado. La experiencia está diseñada para verse en horizontal. Gira tu iPhone para continuar.</p></div>}
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
