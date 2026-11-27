import {useEffect,useState,type CSSProperties} from 'react';
import {HOUSE_TRIALS,milestoneIds,type HouseTrial,type HouseTrialId} from './lab/house-trials';
import './playtest-menu.css';

export type MenuAction='daily-countdown'|'full-flow'|'2d-feeding'|'2d-abduction'|'2d-trail'|'epilogue-outside'|'epilogue-return-path'|'epilogue-reunion'|'epilogue-celebration'|'cosmos-countdown'|'cosmos-gift'|'cosmos-intro'|'cosmos-loading'|'cosmos-galaxy'|'house'|'rescue'|'arcade'|'classic'|'story'|HouseTrialId;
type MenuCard={id:MenuAction;title:string;description:string};
type AdvancedGroup={title:string;cards:MenuCard[]};
type Area={id:string;number:string;title:string;subtitle:string;cards:MenuCard[];advanced:AdvancedGroup[]};

const checkpoint=(id:HouseTrialId):MenuCard=>({id,...HOUSE_TRIALS[id]});
const areas:Area[]=[
 {id:'flujo',number:'00',title:'Flujo integral',subtitle:'Comprueba la experiencia real de principio a fin, con avance de rescate en memoria.',cards:[{id:'full-flow',title:'Experiencia completa · T−10 s',description:'Contador, regalo, universo, prólogo, casa, epílogo y retorno. Sin alterar la fecha ni el guardado del rescate.'}],advanced:[]},
 {
  id:'universo',number:'01',title:'Universo',
  subtitle:'El regalo, la formación de la galaxia y los recuerdos. Recorre la experiencia en orden.',
  cards:[
   {id:'daily-countdown',title:'Contador · Ocho diseños diarios',description:'Galería interactiva de los ocho días: flores, estrellas, carta, jardín, corazones, aurora, disco y última noche.'},
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
  advanced:[{title:'Checkpoints narrativos',cards:[
   {id:'2d-feeding',title:'Emy · Alimentación',description:'En el jardín, con Churu disponible para alimentar a Emy.'},
   {id:'2d-abduction',title:'Secuestro · Paseo con Louis',description:'Comienza antes de la escena; camina hasta el encuentro real.'},
   {id:'2d-trail',title:'Bosque · Búsqueda de pistas',description:'Tras el secuestro, sigue la pulsera y los demás indicios.'},
   {id:'story',title:'Historia y preguntas',description:'Capítulos, fotografías, decisiones y recuerdos.'}
  ]}]
 },
 {
  id:'tres-d',number:'03',title:'3D',
  subtitle:'Casa, encuentros y puzzles. Los controles de diagnóstico quedan disponibles sin saturar la vista.',
  cards:[
   {id:'house',title:'Casa 3D · 0% · Entrada',description:'Entrada por la ventana y recorrido completo por la casa.'},
   ...milestoneIds.map(checkpoint)
  ],
  advanced:[
   {title:'Checkpoints de encuentros y mecánicas',cards:[checkpoint('mirror'),checkpoint('bedroom'),checkpoint('arrival'),checkpoint('basement'),checkpoint('car'),checkpoint('wardrobe'),checkpoint('wake')]},
   {title:'Pistas y objetos',cards:[checkpoint('drawer'),checkpoint('safe'),checkpoint('mirror-note')]},
   {title:'Interacciones y sonido',cards:[checkpoint('battery'),checkpoint('power'),checkpoint('piano'),checkpoint('television')]}
  ]
 },
 {id:'epilogo',number:'04',title:'Epílogo',subtitle:'Regreso al jardín después del rescate. Cada checkpoint carga el escenario jugable completo.',cards:[
  {id:'epilogue-outside',title:'Exterior · Amanecer',description:'Salida de la casa con Louis y Emy, regreso al bosque.'},
  {id:'epilogue-return-path',title:'Bosque · Regreso',description:'Acompañantes, movimiento y transición al jardín.'},
  {id:'epilogue-reunion',title:'Cerezos · Reencuentro',description:'Encuentro y diálogo con Luis y Vale.'},
  {id:'epilogue-celebration',title:'Picnic · Celebración',description:'Torta, velas, carta, postal grupal y cierre.'}
 ],advanced:[]}
];

const ACCENTS:Record<string,string>={flujo:'#a3ce75',universo:'#a99be8','dos-d':'#6ec5ad','tres-d':'#e4b36d',epilogo:'#dca0bd'};
const normalize=(value:string)=>value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const matches=(item:MenuCard,q:string)=>[item.title,item.description,item.id].some(s=>normalize(s).includes(q));
function TrialCard({item,onSelect}:{item:MenuCard;onSelect:(id:MenuAction)=>void}){
 return <button type="button" className="playtest-card lp-endpoint" data-trial-id={item.id} onClick={()=>onSelect(item.id)}
  aria-labelledby={`trial-${item.id}`} aria-describedby={`trial-${item.id}-description`}>
  <span className="lp-method" aria-hidden="true">{item.id==='full-flow'?'RUN':'PLAY'}</span>
  <span className="lp-endpoint-copy"><strong id={`trial-${item.id}`}>{item.title}</strong><code>{item.id}</code><span className="playtest-description" id={`trial-${item.id}-description`}>{item.description}</span></span>
  <span className="lp-execute" aria-hidden="true">Abrir <span>↗</span></span>
 </button>;
}

export function PlaytestMenu({onSelect,onExit}:{onSelect:(id:MenuAction)=>void;onExit:()=>void}){
 const [query,setQuery]=useState(''),[closed,setClosed]=useState<string[]>([]),[advanced,setAdvanced]=useState(false);
 const q=normalize(query.trim());
 const filtered=areas.map(area=>({...area,cards:area.cards.filter(item=>matches(item,q)),advanced:area.advanced.map(group=>({...group,cards:group.cards.filter(item=>matches(item,q))})).filter(group=>group.cards.length)})).filter(area=>area.cards.length||area.advanced.length);
 const count=filtered.reduce((n,area)=>n+area.cards.length+area.advanced.reduce((sum,group)=>sum+group.cards.length,0),0);
 return <main className="playtest-menu lp-swagger" data-admin-panel="lp" aria-labelledby="playtest-title">
  <div className="playtest-shell">
   <header className="playtest-header">
    <div className="playtest-kicker"><span className="playtest-status" aria-hidden="true"/>VALETEAMO / LABORATORIO <span className="playtest-build">ACCESO LP · QA</span></div>
    <div className="playtest-header-main"><div><h1 id="playtest-title">Pruebas</h1><p>Explorador de checkpoints · Experiencia real, no reproducciones aisladas.</p></div><button type="button" className="playtest-back" onClick={onExit}>← Volver a Feliz cumpleaños</button></div>
    <div className="lp-environment"><span>ENTORNO</span><strong>Laboratorio local</strong><span>Rescate de prueba en memoria · fecha pública intacta</span></div>
    <nav className="playtest-nav" aria-label="Secciones del laboratorio">{areas.map(area=><a key={area.id} href={`#lp-${area.id}`} onClick={()=>{setQuery('');setClosed(old=>old.filter(x=>x!==area.id));}} style={{'--lp-accent':ACCENTS[area.id]} as CSSProperties}><span>{area.number}</span>{area.title}</a>)}</nav>
    <div className="lp-toolbar"><label htmlFor="lp-filter">Filtrar checkpoints</label><input id="lp-filter" type="search" placeholder="Ej. Emy, espejo, cumpleaños…" value={query} onChange={e=>setQuery(e.target.value)}/><span aria-live="polite">{count} accesos</span><button type="button" onClick={()=>{setQuery('');setClosed([]);setAdvanced(true);}}>Expandir</button><button type="button" onClick={()=>{setQuery('');setClosed(areas.map(a=>a.id));setAdvanced(false);}}>Contraer</button></div>
   </header>
   {!filtered.length&&<p role="status" className="lp-empty">No hay checkpoints que coincidan con tu búsqueda.</p>}
   {filtered.map(area=>{
    const isOpen=!!q||!closed.includes(area.id);
    return <section key={area.id} id={`lp-${area.id}`} className="playtest-section" style={{'--lp-accent':ACCENTS[area.id]} as CSSProperties} aria-labelledby={`lp-heading-${area.id}`}>
     <button type="button" className="lp-tag" aria-expanded={isOpen} aria-controls={`lp-body-${area.id}`} onClick={()=>{if(q){setQuery('');setClosed(old=>[...old.filter(x=>x!==area.id),area.id]);}else setClosed(old=>old.includes(area.id)?old.filter(x=>x!==area.id):[...old,area.id]);}}>
      <span className="lp-tag-number">{area.number}</span><span className="lp-tag-copy"><strong id={`lp-heading-${area.id}`}>{area.title}</strong><small>{area.subtitle}</small></span><span className="lp-tag-count">{area.cards.length+area.advanced.reduce((n,g)=>n+g.cards.length,0)}</span><span aria-hidden="true">{isOpen?'⌄':'›'}</span>
     </button>
     <div id={`lp-body-${area.id}`} hidden={!isOpen}>
      <div className="lp-endpoints">{area.cards.map(item=><TrialCard key={item.id} item={item} onSelect={onSelect}/>)}</div>
      {area.advanced.map(group=><details className="playtest-advanced" key={group.title+'-'+advanced+'-'+!!q} open={advanced||!!q||undefined}><summary><span>{group.title}</span><span className="playtest-advanced-count">{group.cards.length} checkpoints <i aria-hidden="true">⌄</i></span></summary><div className="lp-endpoints">{group.cards.map(item=><TrialCard key={item.id} item={item} onSelect={onSelect}/>)}</div></details>)}
     </div>
    </section>;
   })}
   <footer className="playtest-footer"><span>LP / ENTORNO DE PRUEBAS</span><span>Los checkpoints cargan el juego y sus condiciones reales.</span></footer>
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
   stop=launchHouse(onExit,trial.checkpoint??'interactions',{demo:true,trial:true,fieldTutorials:true,scenario:trial});
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
