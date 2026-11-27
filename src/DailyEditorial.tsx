import {memo,useEffect,useRef,useState,type PointerEvent,type KeyboardEvent} from 'react';
import type {DailyTheme} from './birthday-daily.js';
import './birthday-editorial.css';
export const EDITORIAL:Record<string,{title:string;em:string;action:string;hint:string;total:number;done:string}>={
 blossom:{title:'Una pequeña',em:'espera.',action:'Toca las flores',hint:'Pétalos que revelan pequeños corazones.',total:8,done:'Todos los pequeños detalles llevan a ti.'},
 constellation:{title:'Un cielo',em:'para ti.',action:'Conecta las estrellas',hint:'Une los puntos de la constelación.',total:7,done:'Todas las estrellas encontraron su lugar.'},
 letter:{title:'Una carta',em:'sin abrir.',action:'Abrir el sobre',hint:'Rompe el sello para leer una nota.',total:1,done:'Una pequeña nota para ti.'},
 garden:{title:'Lo que',em:'florece.',action:'Cultiva el jardín',hint:'Toca las semillas para hacerlas crecer.',total:6,done:'Un jardín entero para ti.'},
 pixel:{title:'NUEVA',em:'MISIÓN_',action:'Atrapa los corazones',hint:'Pulsa los corazones del escenario.',total:5,done:'¡Misión cumplida!'},
 aurora:{title:'Pinta',em:'el cielo.',action:'Borrar estelas',hint:'Arrastra sobre la aurora.',total:0,done:''},
 music:{title:'Lado A.',em:'Para Vale.',action:'Elegir canción',hint:'Pon una canción que te guste.',total:0,done:''},
 finale:{title:'La última',em:'noche.',action:'Enciende las estrellas',hint:'Ilumina el cielo antes de medianoche.',total:6,done:'Pide un deseo. El resto puede esperar.'}
};
const FL=[[88,222],[130,185],[178,130],[230,67],[121,100],[292,145],[215,240],[320,109]];
const ST=[[76,185],[122,97],[206,135],[273,67],[328,166],[235,223],[152,233]];
const WI=[[200,68],[123,116],[277,116],[102,210],[298,210],[200,247]];
const Dust=memo(function Dust(){return <div className="ed-dust" aria-hidden="true">{Array.from({length:32},(_,i)=><i className="daily-particle" key={i} style={{left:(i*37+4)%100+'%',top:(i*61+11)%100+'%',animationDelay:-i*.7+'s',animationDuration:7+i%7+'s'}}/>)}</div>});
function keyboard(e:KeyboardEvent,fn:()=>void){if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}}
export function DailyEditorial({theme,preview,children}:{theme:DailyTheme;preview:boolean;children:React.ReactNode}){
 const info=EDITORIAL[theme.id], [hits,setHits]=useState<number[]>([]),[open,setOpen]=useState(false),[playing,setPlaying]=useState(false),[track,setTrack]=useState(''),[elapsed,setElapsed]=useState(0),[duration,setDuration]=useState(0),[volume,setVolume]=useState(.65),[error,setError]=useState('');
 const canvas=useRef<HTMLCanvasElement>(null),last=useRef<[number,number]|null>(null),audio=useRef<HTMLAudioElement>(null),file=useRef<HTMLInputElement>(null),url=useRef<string|null>(null),letter=useRef<HTMLDialogElement>(null);
 // Preview never persists. Public interactions are scoped to the edition only.
 const key='valeteamo-daily-v1:'+theme.id;
 useEffect(()=>{if(!preview)try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))setHits([...new Set(saved.filter(n=>Number.isInteger(n)&&n>=0&&n<info.total))] as number[]);}catch{}},[key,preview,info.total]);
 function hit(n:number){setHits(old=>{if(old.includes(n))return old;const next=[...old,n];if(!preview)try{localStorage.setItem(key,JSON.stringify(next));}catch{}return next;});}
 useEffect(()=>()=>{audio.current?.pause();if(url.current)URL.revokeObjectURL(url.current);},[]);
 function clear(){const c=canvas.current;c?.getContext('2d')?.clearRect(0,0,c.width,c.height);}
 function point(e:PointerEvent<HTMLCanvasElement>):[number,number]{const r=e.currentTarget.getBoundingClientRect();return [(e.clientX-r.left)*e.currentTarget.width/r.width,(e.clientY-r.top)*e.currentTarget.height/r.height];}
 function draw(e:PointerEvent<HTMLCanvasElement>){if(!last.current)return;const c=e.currentTarget.getContext('2d');if(!c)return;const p=point(e);c.strokeStyle='#b9f2cdaa';c.lineWidth=5;c.lineCap='round';c.shadowColor='#a1eec6';c.shadowBlur=14;c.beginPath();c.moveTo(...last.current);c.lineTo(...p);c.stroke();last.current=p;}
 function showLetter(){setOpen(true);hit(0);letter.current?.showModal();}
 async function play(){const a=audio.current;if(!a||!url.current){file.current?.click();return;}if(a.paused){try{await a.play();setError('');}catch{setError('No se pudo reproducir este archivo.');}}else a.pause();}
 function choose(f?:File){if(!f||!audio.current)return;audio.current.pause();if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(f);audio.current.src=url.current;audio.current.volume=volume;setTrack(f.name);setElapsed(0);setDuration(0);setError('');}
 function action(){if(theme.id==='letter'){showLetter();return;}if(theme.id==='music'){void play();return;}if(theme.id==='aurora'){clear();return;}const n=Array.from({length:info.total},(_,i)=>i).find(i=>!hits.includes(i));if(n!==undefined)hit(n);}
 const target=(n:number,label:string)=>({role:'button',tabIndex:0,'aria-label':label,'aria-pressed':hits.includes(n),onClick:()=>hit(n),onKeyDown:(e:KeyboardEvent)=>keyboard(e,()=>hit(n))});
 const time=(n:number)=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
 const complete=info.total>0&&hits.length===info.total;
 return <div className={'ed-layout ed-'+theme.id}>
  <Dust/>
  <div className="ed-top"><span>VALE / una cuenta atrás</span><span>{theme.date} 2026</span></div>
  <div className="ed-main">
   <div className="ed-copy">
    <div className="ed-eyebrow">5 de diciembre · 00:00</div>
    <h1 id="birthday-countdown-title">{info.title}<br/><em>{info.em}</em></h1>
    <div className="daily-message"><p>{theme.message}</p></div>
    {children}
    <button type="button" className="ed-action" onClick={action}>{theme.id==='music'&&track?(playing?'Pausar':'Reproducir'):info.action} ↗</button>
    {info.total>0&&theme.id!=='letter'&&<p className="ed-progress" role="status">{complete?info.done:hits.length?hits.length+' / '+info.total:''}</p>}
    {theme.id==='music'&&<div className="ed-audio-controls">
     <label>Elegir audio <input ref={file} type="file" accept="audio/*" onChange={e=>choose(e.target.files?.[0])}/></label>
     {track&&<><span className="ed-track">{track}</span><label>Reproducción <input aria-label="Posición de reproducción" type="range" min={0} max={duration||1} step=".1" value={elapsed} onChange={e=>{if(audio.current)audio.current.currentTime=Number(e.target.value);setElapsed(Number(e.target.value));}}/></label><span>{time(elapsed)} / {time(duration)}</span><label>Volumen <input type="range" min={0} max={1} step=".05" value={volume} onChange={e=>{setVolume(Number(e.target.value));if(audio.current)audio.current.volume=Number(e.target.value);}}/></label></>}
     {error&&<span role="alert">{error}</span>}
     <audio ref={audio} preload="metadata" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onTimeUpdate={e=>setElapsed(e.currentTarget.currentTime)} onLoadedMetadata={e=>setDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0)}/>
    </div>}
   </div>
   <div className="ed-object">
    <svg className="daily-art ed-art" viewBox="0 0 400 300" aria-hidden={theme.id==='letter'||theme.id==='aurora'||theme.id==='music'?true:undefined}>
     {theme.id==='blossom'&&<>
      <g className="ed-branch"><path d="M50 310Q50 160 255 8M85 310Q160 235 330 125M42 220Q130 175 125 70" fill="none" stroke="#694b48" strokeWidth="5"/>
      <g fill="#526650"><path d="M92 205q-75-20-35-55q40 15 35 55M172 138q-8-65 38-55q6 45-38 55M226 237q40-60 65-20q-11 40-65 20"/></g>
      {FL.map(([x,y],n)=><g key={n} transform={`translate(${x} ${y})`}><g className={'ed-flower '+(hits.includes(n)?'hit':'')} {...target(n,'Flor '+(n+1))}>{Array.from({length:5},(_,i)=><ellipse key={i} cy="-12" rx="9" ry="15" transform={`rotate(${i*72})`} fill={n%2?'#f7ded1':'#a55564'} stroke="#6f4c50" strokeWidth=".8"/>)}<circle r="6" fill="#e7b26f"/>{hits.includes(n)&&<text y="-20" textAnchor="middle" fill="#8d3e55" fontSize="22" className="ed-bloom">♡</text>}</g></g>)}</g>
     </>}
     {theme.id==='constellation'&&<>
      <g fill="none" stroke="#c4ac7950"><circle cx="200" cy="150" r="138"/><circle cx="200" cy="150" r="110"/><ellipse cx="200" cy="150" rx="177" ry="84" transform="rotate(-25 200 150)"/></g>
      {Array.from({length:34},(_,n)=><circle key={n} cx={(n*53+14)%400} cy={(n*71+33)%300} r={n%3===0?1.5:.6} fill="#ddd6c4" opacity=".6"/>)}
      <polyline points={hits.map(n=>ST[n].join(',')).join(' ')} fill="none" stroke="#d6bf93" strokeWidth="2"/>
      {ST.map(([x,y],n)=><g key={n} {...target(n,'Estrella '+(n+1))}><circle cx={x} cy={y} r="15" fill="transparent"/><circle className="ed-star-node" cx={x} cy={y} r={hits.includes(n)?8:5} fill="#e5c994"/><text x={x+10} y={y-8} fill="#b8b2a0" fontSize="9">0{n+1}</text></g>)}
      {complete&&<path d="M200 110c-45-55-104 10 0 92 104-82 45-147 0-92Z" fill="none" stroke="#e5c994" strokeWidth="2" className="ed-bloom"/>}
     </>}
     {theme.id==='garden'&&<><rect width="400" height="300" fill="#cbd6ba"/><path d="M0 210Q160 140 400 210V300H0Z" fill="#a0b08c"/><path d="M0 275Q155 180 400 255" stroke="#ded9b5" strokeWidth="35" fill="none"/>{Array.from({length:6},(_,n)=><g key={n} transform={`translate(${45+n*62} ${165+n%2*35})`} {...target(n,'Cultivar flor '+(n+1))}><ellipse cy="5" rx="24" ry="7" fill="#687c5b55"/><rect x="-28" y="-90" width="56" height="104" fill="transparent"/><g className={'ed-plant '+(hits.includes(n)?'grown':'')}><path d="M0 0V-70M0-25q-30-30-29-8q9 12 29 8M0-42q27-31 31-7q-6 15-31 7" stroke="#516c48" strokeWidth="4" fill="none"/><circle cy="-75" r="17" fill={n%2?'#d69c98':'#e7d197'}/><circle cy="-75" r="5" fill="#987c58"/></g></g>)}{hits.length>0&&<g className="ed-butterfly" fill="#c48986"><path d="M200 75q-28-24-22 8q20 14 22-8q28-24 22 8q-20 14-22-8"/></g>}</>}
     {theme.id==='pixel'&&<g shapeRendering="crispEdges"><rect width="400" height="300" fill="#313c50"/><rect y="220" width="400" height="80" fill="#384d47"/><rect y="220" width="400" height="6" fill="#9cbb82"/>{[[30,60],[270,106],[115,170]].map(([x,y])=><rect key={x} x={x} y={y} width="90" height="12" fill="#778c98"/>)}<g transform="translate(170 186)" fill="#f3e4d2"><path d="M0 0H8V-9H16V-2H32V-9H40V0H48V28H0Z"/><rect x="8" y="28" width="32" height="18" fill="#e6a0aa"/><rect x="8" y="11" width="5" height="5" fill="#352b38"/><rect x="35" y="11" width="5" height="5" fill="#352b38"/><rect x="22" y="16" width="5" height="3" fill="#c5a36c"/></g><text x="18" y="28" fill="#f6d6c6" fontFamily="monospace" fontSize="12">CORAZONES {hits.length}/5</text></g>}
     {theme.id==='aurora'&&<><defs><linearGradient id="ed-aur"><stop stopColor="#77c8a4" stopOpacity=".08"/><stop offset=".5" stopColor="#a5e1bc" stopOpacity=".75"/><stop offset="1" stopColor="#a5a7e0" stopOpacity=".12"/></linearGradient></defs><g className="ed-aurora-wave">{Array.from({length:12},(_,n)=><path key={n} d={`M-30 ${30+n*9}Q95 ${-30+n*15} 205 ${100+n*7}T430 ${50+n*9}`} stroke="url(#ed-aur)" strokeWidth="5" fill="none"/>)}</g><path d="M0 245L75 175 145 229 220 163 300 236 400 192V300H0Z" fill="#142126"/><path d="M0 275H400M0 285H400" stroke="#8cd5b930" strokeWidth="2"/></>}
     {theme.id==='finale'&&<><g fill="none" stroke="#c7a46b70"><path d="M55 275V120Q200-48 345 120V275M70 275V127Q200-25 330 127V275"/><circle cx="200" cy="157" r="82"/><circle cx="200" cy="157" r="69"/><path d="M200 81v152M124 157h152" strokeDasharray="2 5"/></g>{WI.map(([x,y],n)=><g key={n} transform={`translate(${x} ${y})`} {...target(n,'Encender estrella '+(n+1))}><circle r="20" fill="transparent"/><path className={'ed-wish '+(hits.includes(n)?'lit':'')} d="M0-12L3-3 12 0 3 3 0 12-3 3-12 0-3-3Z" fill="#7b6551" stroke="#d3b276"/></g>)}<path d="M200 123c-42-30-58 17 0 49 58-32 42-79 0-49Z" fill={complete?'#e4bd7c':'#9b714f'} opacity=".8"/></>}
    </svg>
    {theme.id==='letter'&&<><button className="ed-envelope" type="button" aria-label="Abrir carta" onClick={showLetter}><span className="ed-seal">♡</span></button><dialog ref={letter} className="ed-letter-dialog" onClose={()=>setOpen(false)} aria-label="Una carta para Vale"><button type="button" aria-label="Cerrar carta" onClick={()=>letter.current?.close()}>×</button>{open&&<article><h2>Para ti, Vale.</h2><p>Hay recuerdos que todavía no hemos vivido. Ojalá este encuentre un lugar especial entre ellos.</p><p>Con cariño, ♡</p></article>}</dialog></>}
    {theme.id==='pixel'&&[0,1,2,3,4].filter(n=>!hits.includes(n)).map(n=><button key={n} className="ed-heart" type="button" aria-label={'Atrapar corazón '+(n+1)} onClick={()=>hit(n)} style={{left:[15,72,44,85,25][n]+'%',top:[28,21,42,62,63][n]+'%'}}>♥</button>)}
    {theme.id==='aurora'&&<canvas ref={canvas} width="800" height="600" aria-label="Lienzo para dibujar" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);last.current=point(e);}} onPointerMove={draw} onPointerUp={()=>last.current=null} onPointerCancel={()=>last.current=null} onLostPointerCapture={()=>last.current=null}/>}
    {theme.id==='music'&&<div className={'ed-deck '+(playing?'playing':'')}><div className="ed-record"/><div className="ed-arm"/><button type="button" onClick={()=>void play()} aria-label={playing?'Pausar disco':'Reproducir disco'}>{playing?'Ⅱ':'▶'}</button></div>}
    <div className="ed-hint">{info.hint}</div>
   </div>
  </div>
  <div className="ed-bottom"><span>Pequeñas cosas, grandes recuerdos.</span><span>V ♡</span></div>
 </div>;
}
