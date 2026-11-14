import {useEffect,useRef,useState,type ReactNode} from 'react';
import './landscape-gate.css';

/** One global overlay: the countdown, cosmos, postal and both Phaser scenes
 * stay mounted underneath so no route, camera or save data is lost on rotation.
 * iOS Safari cannot force device rotation; this gently asks the visitor.
 * Desktop browsers (fine pointer) remain fully usable at any window size.
 */
export function isPhonePortrait():boolean{
 return window.matchMedia('(orientation: portrait) and (pointer: coarse)').matches;
}

export function LandscapeGate({children}:{children:ReactNode}){
 const [portrait,setPortrait]=useState(isPhonePortrait);
 const notice=useRef<HTMLElement>(null);
 useEffect(()=>{
  const query=window.matchMedia('(orientation: portrait) and (pointer: coarse)');
  const sync=()=>setPortrait(query.matches);
  query.addEventListener?.('change',sync);
  window.addEventListener('resize',sync);
  window.addEventListener('orientationchange',sync);
  window.visualViewport?.addEventListener('resize',sync);
  sync();
  return()=>{
   query.removeEventListener?.('change',sync);
   window.removeEventListener('resize',sync);
   window.removeEventListener('orientationchange',sync);
   window.visualViewport?.removeEventListener('resize',sync);
  };
 },[]);
 useEffect(()=>{if(portrait)notice.current?.focus({preventScroll:true});},[portrait]);
 return <>
  <div className="landscape-app-content" inert={portrait} aria-hidden={portrait}>{children}</div>
  <section
   ref={notice}
   className="blossom-landscape-gate"
   role="dialog"
   aria-modal={portrait}
   aria-labelledby="blossom-rotate-title"
   aria-describedby="blossom-rotate-description"
   tabIndex={-1}
   hidden={!portrait}
   data-orientation-gate={portrait?'portrait':'landscape'}>
   <div className="blossom-turn-background" aria-hidden="true">
    <span className="blossom-glow blossom-glow-a"/>
    <span className="blossom-glow blossom-glow-b"/>
    {Array.from({length:18},(_,i)=><i key={i} className="blossom-petal"
     style={{left:((i*41+9)%100)+'%',top:((i*67+8)%100)+'%',
      animationDelay:(-i*.41)+'s',animationDuration:(6+i%5)+'s'}}/>)}
   </div>
   <div className="blossom-turn-card">
    <div className="blossom-turn-emblem" aria-hidden="true">
     <span className="blossom-turn-flower">✿</span>
     <span className="blossom-turn-device">
      <span className="blossom-turn-device-screen"><span>♡</span></span>
     </span>
     <span className="blossom-turn-sparkle">✧</span>
    </div>
    <span className="blossom-turn-eyebrow">UNA AVENTURA PARA DOS · ♡</span>
    <h2 id="blossom-rotate-title">Gira tu teléfono</h2>
    <p id="blossom-rotate-description">Para continuar nuestra aventura, coloca tu teléfono en <strong>horizontal</strong>.</p>
    <div className="blossom-turn-divider" aria-hidden="true"><i/> ✿ <i/></div>
    <p className="blossom-turn-footnote">Tu momento se conserva. Cuando lo gires, podrás seguir donde estabas.</p>
    <p className="blossom-turn-locknote">Si la pantalla no gira, desactiva el bloqueo de orientación en el Centro de control del iPhone.</p>
   </div>
   <div className="blossom-turn-caption" aria-hidden="true">VALETEAMO · HECHO CON AMOR</div>
  </section>
 </>;
}
