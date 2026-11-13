import {useEffect,useState} from 'react';
import {HOUSE_TRIALS,type HouseTrial,type HouseTrialId} from './lab/house-trials';
import './playtest-menu.css';

type MenuAction='house'|'rescue'|'arcade'|'classic'|'story'|HouseTrialId;
type MenuCard={id:MenuAction;title:string;description:string};

const trialCard=(id:HouseTrialId):MenuCard=>({id,...HOUSE_TRIALS[id]});
const groups:{title:string;cards:MenuCard[]}[]=[
 {title:'Casa 3D',cards:[
  {id:'house',title:'Casa 3D',description:'Empieza con la entrada por la ventana. Explora las dos plantas y sigue el recorrido del rescate desde el principio.'},
  trialCard('bedroom'),trialCard('arrival'),trialCard('basement')
 ]},
 {title:'Cinemáticas y escondites',cards:[trialCard('car'),trialCard('wardrobe'),trialCard('wake')]},
 {title:'Pistas y animación',cards:[trialCard('drawer'),trialCard('safe'),trialCard('mirror-note'),trialCard('mirror')]},
 {title:'Objetos y sonido',cards:[trialCard('battery'),trialCard('power'),trialCard('piano'),trialCard('television')]},
 {title:'Otros recorridos',cards:[
  {id:'rescue',title:'Rescate · 2D → 3D',description:'Empieza en el jardín, sigue las pistas de la desaparición de Louis y entra a la casa.'},
  {id:'arcade',title:'2D · Corazones',description:'Abre directamente el desafío de Kitty con disparos y enemigos.'},
  {id:'classic',title:'Aventura clásica',description:'Abre el juego original de seis salas con tienda, objetos y combate.'},
  {id:'story',title:'Historia y preguntas',description:'Vuelve al capítulo actual de la historia de cumpleaños para revisar recuerdos, preguntas y desafíos.'}
 ]}
];

export function PlaytestMenu({onSelect,onExit}:{onSelect:(id:MenuAction)=>void;onExit:()=>void}){
 return <main className="playtest-menu" aria-labelledby="playtest-title">
  <header>
   <button type="button" className="playtest-back" onClick={onExit}>← Volver a Feliz cumpleaños</button>
   <h1 id="playtest-title">Pruebas</h1>
   <p>Elige una escena para probar una mecánica. Usa <strong>Ajustes → Reiniciar prueba</strong> para repetir un inicio rápido.</p>
  </header>
  {groups.map(({title,cards})=><section className="playtest-group" key={title} aria-label={title}>
   <h2>{title}</h2>
   <div className="playtest-grid">
    {cards.map(({id,title,description})=><button type="button" className="playtest-card" key={id}
     aria-labelledby={`trial-${id}`} aria-describedby={`trial-${id}-description`} onClick={()=>onSelect(id)}>
     <strong id={`trial-${id}`}>{title}</strong><span className="playtest-arrow" aria-hidden="true">↗</span>
     <span className="playtest-description" id={`trial-${id}-description`}>{description}</span>
    </button>)}
   </div>
  </section>)}
 </main>;
}

export function PlaytestHouse({id,onExit}:{id:HouseTrialId;onExit:()=>void}){
 const [status,setStatus]=useState<'loading'|'ready'|'failed'>('loading');
 const trial:HouseTrial=HOUSE_TRIALS[id];
 useEffect(()=>{
  let cancelled=false;
  let stop:(()=>void)|undefined;
  void import('./lab/house.js').then(({launchHouse})=>{
   if(cancelled)return;
   stop=launchHouse(onExit,trial.checkpoint??'interactions',{demo:true,trial:true,scenario:trial});
   setStatus('ready');
  }).catch(()=>{if(!cancelled)setStatus('failed');});
  return ()=>{cancelled=true;stop?.();};
 },[id,onExit,trial]);
 if(status==='ready')return null;
 return <main className="playtest-menu"><header>
  <button type="button" className="playtest-back" onClick={onExit}>← Volver a pruebas</button>
  <h1>{trial.title}</h1>
  {status==='loading'?<p role="status">Preparando la escena…</p>:<p role="alert">No se pudo abrir esta prueba.</p>}
 </header></main>;
}
