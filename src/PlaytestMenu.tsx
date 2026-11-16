import {useEffect,useState} from 'react';
import {HOUSE_TRIALS,type HouseTrial,type HouseTrialId} from './lab/house-trials';
import './playtest-menu.css';

type MenuAction='cosmos-countdown'|'cosmos-gift'|'cosmos-intro'|'cosmos-loading'|'cosmos-galaxy'|'house'|'rescue'|'arcade'|'classic'|'story'|HouseTrialId;
type MenuCard={id:MenuAction;title:string;description:string};
type AdvancedGroup={title:string;cards:MenuCard[]};
type Area={id:string;number:string;title:string;subtitle:string;cards:MenuCard[];advanced:AdvancedGroup[]};

const checkpoint=(id:HouseTrialId):MenuCard=>({id,...HOUSE_TRIALS[id]});
const areas:Area[]=[
 {
  id:'universo',number:'01',title:'Universo',
  subtitle:'El regalo, la formación de la galaxia y los recuerdos. Recorre la experiencia en orden.',
  cards:[
   {id:'cosmos-countdown',title:'Contador y colores',description:'Reloj, paleta y vista previa de la apertura.'},
   {id:'cosmos-loading',title:'Animación de partículas',description:'Viaje por el túnel y formación del corazón.'},
   {id:'cosmos-galaxy',title:'Galaxia rosa del video',description:'Corazón interactivo, recuerdos y navegación por el cosmos.'}
  ],
  advanced:[{title:'Escenas intermedias',cards:[
   {id:'cosmos-gift',title:'Regalo animado',description:'Apertura de la caja de regalo.'},
   {id:'cosmos-intro',title:'Inicio del video y personajes',description:'Presentación de los personajes y entrada al universo.'}
  ]}]
 },
 {
  id:'dos-d',number:'02',title:'2D',
  subtitle:'Aventura, rescate y juego original. Son modos independientes; no se reemplaza el clásico.',
  cards:[
   {id:'rescue',title:'Rescate · 2D → 3D',description:'Prólogo con el picnic, jardín, pistas, secuestro y transición a la casa.'},
   {id:'arcade',title:'2D · Corazones',description:'Prueba directa del combate y los proyectiles.'},
   {id:'classic',title:'Aventura clásica',description:'Las seis salas originales, con tienda, objetos y enemigos.'}
  ],
  advanced:[{title:'Narrativa',cards:[
   {id:'story',title:'Historia y preguntas',description:'Capítulos, fotografías, decisiones y recuerdos.'}
  ]}]
 },
 {
  id:'tres-d',number:'03',title:'3D',
  subtitle:'Casa, encuentros y puzzles. Los controles de diagnóstico quedan disponibles sin saturar la vista.',
  cards:[
   {id:'house',title:'Casa 3D',description:'Entrada por la ventana y recorrido completo por la casa.'},
   checkpoint('mirror'),checkpoint('bedroom'),checkpoint('arrival'),checkpoint('basement')
  ],
  advanced:[
   {title:'Cinemáticas y escondites',cards:[checkpoint('car'),checkpoint('wardrobe'),checkpoint('wake')]},
   {title:'Pistas y objetos',cards:[checkpoint('drawer'),checkpoint('safe'),checkpoint('mirror-note')]},
   {title:'Interacciones y sonido',cards:[checkpoint('battery'),checkpoint('power'),checkpoint('piano'),checkpoint('television')]}
  ]
 }
];

function TrialCard({item,onSelect}:{item:MenuCard;onSelect:(id:MenuAction)=>void}){
 return <button type="button" className="playtest-card" onClick={()=>onSelect(item.id)}
  aria-labelledby={`trial-${item.id}`} aria-describedby={`trial-${item.id}-description`}>
  <strong id={`trial-${item.id}`}>{item.title}</strong>
  <span className="playtest-arrow" aria-hidden="true">↗</span>
  <span className="playtest-description" id={`trial-${item.id}-description`}>{item.description}</span>
 </button>;
}

export function PlaytestMenu({onSelect,onExit}:{onSelect:(id:MenuAction)=>void;onExit:()=>void}){
 return <main className="playtest-menu" data-admin-panel="lp" aria-labelledby="playtest-title">
  <div className="playtest-shell">
   <header className="playtest-header">
    <div className="playtest-kicker"><span className="playtest-status" aria-hidden="true"/>VALETEAMO / LABORATORIO <span className="playtest-build">ACCESO LP</span></div>
    <div className="playtest-header-main">
     <div><h1 id="playtest-title">Pruebas</h1><p>Panel de control · Escenas organizadas por etapa de la experiencia.</p></div>
     <button type="button" className="playtest-back" onClick={onExit}>← Volver a Feliz cumpleaños</button>
    </div>
    <nav className="playtest-nav" aria-label="Secciones del laboratorio">
     {areas.map(area=><a key={area.id} href={`#lp-${area.id}`}><span>{area.number}</span>{area.title}</a>)}
    </nav>
   </header>
   {areas.map(area=><section key={area.id} id={`lp-${area.id}`} className="playtest-section" aria-labelledby={`lp-heading-${area.id}`}>
    <div className="playtest-section-heading">
     <span className="playtest-section-number" aria-hidden="true">{area.number} / 03</span>
     <div><h2 id={`lp-heading-${area.id}`}>{area.title}</h2><p>{area.subtitle}</p></div>
     <span className="playtest-section-count">{area.cards.length} accesos principales</span>
    </div>
    <div className="playtest-grid">
     {area.cards.map(item=><TrialCard key={item.id} item={item} onSelect={onSelect}/>)}
    </div>
    {area.advanced.map(extra=><details className="playtest-advanced" key={extra.title}>
     <summary><span>{extra.title}</span><span className="playtest-advanced-count">{extra.cards.length} escenas <i aria-hidden="true">⌄</i></span></summary>
     <div className="playtest-grid playtest-grid-advanced">{extra.cards.map(item=><TrialCard key={item.id} item={item} onSelect={onSelect}/>)}</div>
    </details>)}
   </section>)}
   <footer className="playtest-footer"><span>LP / ENTORNO DE PRUEBAS</span><span>Los motores 2D y 3D se cargan cuando eliges una experiencia.</span></footer>
  </div>
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
 // The house is rendered as a body-level WebGL layer. Never return an empty
 // React route: on real iOS the layer may be lost during a context/viewport
 // transition. This lightweight fallback remains behind the active 3D world.
 if(status==='ready')return <main className="playtest-menu" data-house-fallback>
  <div className="playtest-shell"><header className="playtest-header">
   <h1>Casa 3D</h1><p role="status">La escena se abrió fuera del panel.</p>
   <p>Si no puedes ver el mundo, vuelve al menú o abre el visor independiente de Lois.</p>
   <button type="button" className="playtest-back" onClick={onExit}>← Volver a pruebas</button>
   <a className="playtest-back" href="/lois-preview.html">Ver modelo 3D de Lois</a>
  </header></div>
 </main>;
 return <main className="playtest-menu"><div className="playtest-shell"><header className="playtest-header">
  <button type="button" className="playtest-back" onClick={onExit}>← Volver a pruebas</button>
  <h1>{trial.title}</h1>
  {status==='loading'?<p role="status">Preparando la escena…</p>:<p role="alert">No se pudo abrir esta prueba.</p>}
 </header></div></main>;
}
