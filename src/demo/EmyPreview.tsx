import {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {EmyFeeding} from './EmyFeeding';
import {GardenPrologue} from './GardenPrologue';
import {Sound} from '../audio';
import '../story.css';
import './emy-preview.css';
import {mountEmyPreview} from '../lab/emy-preview.js';

function Model(){
 const canvas=useRef<HTMLCanvasElement>(null),pet=useRef<()=>void>(()=>{}),[phase,setPhase]=useState('Cargando…');
 useEffect(()=>{
  if(!canvas.current)return;
  return mountEmyPreview(canvas.current,setPhase,callback=>{pet.current=callback;});
 },[]);

 return <div className="emy-model-preview"><canvas ref={canvas} aria-label="Modelo 3D animado de Emy en el piso de arriba"/><div className="emy-model-label"><strong>Emy · piso de arriba</strong><p role="status">{phase}</p><button onClick={()=>pet.current()}>Acariciar a Emy</button></div></div>;
}
function Preview(){
 const [mode,setMode]=useState<'menu'|'feed'|'model'|'garden'|'done'>('menu');
 const [audio]=useState(()=>new Sound());useEffect(()=>()=>audio.destroy(),[audio]);
 return <main className="emy-preview">
  {mode==='menu'&&<section className="emy-preview-menu"><img src="./sprites/emy-idle.png" alt="Emy"/><div><span>EMY</span><h1>Un ratito contigo</h1><p>Churu, cariño y una gatita curiosa.</p><button onClick={()=>{void audio.start();setMode('feed');}}>Alimentar a Emy</button><button onClick={()=>setMode('model')}>Ver modelo 3D</button><button onClick={()=>setMode('garden')}>Probar encuentro en el jardín 2D</button><small>Vista previa · no cambia tu partida</small></div></section>}
  {mode==='feed'&&<EmyFeeding audio={audio} onComplete={()=>setMode('done')} onCancel={()=>setMode('menu')}/>}
  {mode==='done'&&<section className="emy-preview-menu"><img src="./sprites/emy-love.png" alt="Emy feliz con ojos de corazón"/><div><h1>¡Emy está feliz!</h1><p>En el jardín, Kitty se despide mientras Emy se aleja.</p><button onClick={()=>setMode('menu')}>Volver</button></div></section>}
  {mode==='model'&&<><Model/><button className="emy-preview-back" onClick={()=>setMode('menu')}>Volver</button></>}
  {mode==='garden'&&<GardenPrologue test checkpoint="feed-cat" onExit={()=>setMode('menu')} onEnterHouse={()=>setMode('model')}/>}
 </main>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
