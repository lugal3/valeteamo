import {memo,useEffect,useRef,useState,type PointerEvent,type KeyboardEvent,type ReactNode} from 'react';
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
const FL=[[91,222],[146,177],[194,117],[255,47],[117,111],[280,169],[221,237],[344,107]];
const ST=[[76,185],[122,97],[206,135],[273,67],[328,166],[235,223],[152,233]];
const WI=[[200,68],[123,116],[277,116],[102,210],[298,210],[200,247]];
const Dust=memo(function Dust(){return <div className="ed-dust" aria-hidden="true">{Array.from({length:32},(_,i)=><i className="daily-particle" key={i} style={{left:(i*37+4)%100+'%',top:(i*61+11)%100+'%',animationDelay:-i*.7+'s',animationDuration:7+i%7+'s'}}/>)}</div>});
function keyboard(e:KeyboardEvent,fn:()=>void){if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}}
export function DailyEditorial({theme,preview,children}:{theme:DailyTheme;preview:boolean;children:ReactNode}){
 const info=EDITORIAL[theme.id],key='valeteamo-daily-v1:'+theme.id;
 const [hits,setHits]=useState<number[]>(()=>{if(!preview)try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))return [...new Set(saved.filter(n=>Number.isInteger(n)&&n>=0&&n<info.total))] as number[];}catch{}return [];}),[open,setOpen]=useState(false),[playing,setPlaying]=useState(false),[track,setTrack]=useState(''),[elapsed,setElapsed]=useState(0),[duration,setDuration]=useState(0),[volume,setVolume]=useState(.65),[error,setError]=useState('');
 const canvas=useRef<HTMLCanvasElement>(null),last=useRef<[number,number]|null>(null),audio=useRef<HTMLAudioElement>(null),file=useRef<HTMLInputElement>(null),url=useRef<string|null>(null),letter=useRef<HTMLDialogElement>(null);
 // Preview never persists. Public interactions are scoped to the edition only.
 useEffect(()=>{if(!preview)try{localStorage.setItem(key,JSON.stringify(hits));}catch{}},[hits,key,preview]);
 function hit(n:number){setHits(old=>old.includes(n)?old:[...old,n]);}
 useEffect(()=>{const player=audio.current;return()=>{player?.pause();if(player){player.removeAttribute('src');player.load();}if(url.current){URL.revokeObjectURL(url.current);url.current=null;}};},[]);
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
  {theme.id==='blossom'&&<div className="ed-petal-field" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} className="ed-falling-petal" style={{left:((i*37+5)%100)+'%',animationDelay:(-i*1.19)+'s',animationDuration:(10+i%8)+'s',width:(7+i%4*3)+'px',height:(12+i%4*4)+'px'}}/>)}{Array.from({length:14},(_,i)=><b key={i} className="ed-warm-spark" style={{left:((i*53+8)%100)+'%',top:((i*41+12)%100)+'%',animationDelay:-i*.37+'s'}}>{i%5===0?'♡':'✦'}</b>)}</div>}
  <div className="ed-top"><span>{preview?'LP / Vista previa · VALE':'VALE / una cuenta atrás'}</span><span>{theme.date} 2026</span></div>
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
      <defs>
       <radialGradient id="ed-flower-sky" cx="72%" cy="20%" r="90%"><stop stopColor="#fce0c7"/><stop offset=".5" stopColor="#dc9e9c"/><stop offset="1" stopColor="#a86173"/></radialGradient>
       <linearGradient id="ed-petal-pink" x1="0" y1="0" x2=".7" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#f4aeae"/><stop offset=".42" stopColor="#d96879"/><stop offset="1" stopColor="#9a344f"/></linearGradient>
       <radialGradient id="ed-petal-cream" cx="40%" cy="20%" r="90%"><stop stopColor="#fff3d9"/><stop offset=".7" stopColor="#f2c9b5"/><stop offset="1" stopColor="#d68a86"/></radialGradient>
       <linearGradient id="ed-wood"><stop stopColor="#53372f"/><stop offset=".5" stopColor="#a7765b"/><stop offset="1" stopColor="#634538"/></linearGradient>
       <linearGradient id="ed-leaf" x2="1" y2="1"><stop stopColor="#81916a"/><stop offset="1" stopColor="#3f5945"/></linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ed-flower-sky)"/>
      <g opacity=".15" fill="#fff1c8"><circle cx="331" cy="51" r="47"/><circle cx="331" cy="51" r="59" fill="none" stroke="#fff1c8"/><path d="M0 260Q90 188 155 256T305 248T400 215V300H0Z"/></g>
      <g className="ed-golden-orbit" fill="none" stroke="#fff2be" strokeWidth=".8" opacity=".65"><ellipse cx="205" cy="164" rx="191" ry="57" transform="rotate(-26 205 164)" strokeDasharray="1.5 4"/><ellipse cx="205" cy="164" rx="180" ry="65" transform="rotate(-26 205 164)" opacity=".5"/></g>
      <g className="ed-branch"><path d="M20 310Q91 240 160 177T289 26M73 273Q163 266 249 208T362 100M112 220Q108 153 116 95M160 177Q227 174 280 158" fill="none" stroke="#50362e" strokeWidth="7" strokeLinecap="round"/><path d="M20 307Q91 240 160 177T289 26M73 270Q163 266 249 208T362 100M112 217Q108 153 116 95M160 174Q227 174 280 158" fill="none" stroke="url(#ed-wood)" strokeWidth="4" strokeLinecap="round"/>
      {[[116,212,-34],[168,164,24],[233,211,35],[264,93,-35],[302,152,38],[91,251,-60]].map(([x,y,rot],n)=><g key={n} transform={`translate(${x} ${y}) rotate(${rot})`}><path d="M0 0Q-27-7-25-43Q12-35 0 0" fill="url(#ed-leaf)" stroke="#576447" strokeWidth=".6"/><path d="M0 0L-22-39M-10-16L-23-22M-14-24L-7-32" fill="none" stroke="#d2d09a" strokeWidth=".6" opacity=".6"/></g>)}
      {[[285,30],[304,19],[108,91],[124,81],[360,96],[373,82],[267,196],[52,269]].map(([x,y],n)=><g key={n} transform={`translate(${x} ${y}) rotate(${n%2?30:-22})`}><path d="M0 7v-14" stroke="#68533e" strokeWidth="2"/><path d="M0 0C-12-4-8-20 0-19C10-19 12-5 0 0Z" fill="url(#ed-petal-pink)" stroke="#a85763" strokeWidth=".6"/><path d="M-3-4L0 2 5-5" fill="#727a50"/></g>)}
      {FL.map(([x,y],n)=><g key={n} transform={`translate(${x} ${y})`}><g className={'ed-flower '+(hits.includes(n)?'hit':'')} {...target(n,'Flor '+(n+1))}><circle r="28" fill="transparent"/>{Array.from({length:5},(_,i)=><g key={i} transform={`rotate(${i*72+12})`}><path d="M0 3C-10-1-22-17-15-25C-9-32 0-28 2-26C13-33 22-20 15-11C9-3 4 1 0 3Z" fill={n%2?'url(#ed-petal-cream)':'url(#ed-petal-pink)'} stroke={n%2?'#e3ac99':'#b64e65'} strokeWidth=".6"/><path d="M0 0Q-3-12-8-23M1-1Q5-13 11-20" fill="none" stroke="#ffe4cb" opacity=".52" strokeWidth=".8"/></g>)}<circle r="7" fill="#c18b54"/>{Array.from({length:10},(_,i)=><g key={i} transform={`rotate(${i*36})`}><path d="M0 2V-9" stroke="#f5d19a" strokeWidth="1"/><circle cy="-9" r="1.7" fill="#ffe2a1"/></g>)}<circle r="3" fill="#9c6449"/>{hits.includes(n)&&<g className="ed-heart-burst"><text y="-35" textAnchor="middle" fill="#fff1d9" fontSize="22">♡</text><circle cx="-24" cy="-15" r="2" fill="#fff1b4"/><circle cx="23" cy="-24" r="2" fill="#fff1b4"/></g>}</g></g>)}</g>
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
    {theme.id==='pixel'&&[0,1,2,3,4].filter(n=>!hits.includes(n)).map(n=><button key={n} className="ed-heart" type="button" aria-label={'Atrapar corazón '+(n+1)} onClick={()=>hit(n)} style={{left:[15,72,44,85,25][n]+'%',top:[28,21,42,62,63][n]+'%'}}><span className="ed-heart-art" aria-hidden="true">♥</span></button>)}
    {theme.id==='aurora'&&<canvas ref={canvas} width="800" height="600" aria-label="Lienzo para dibujar" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);last.current=point(e);}} onPointerMove={draw} onPointerUp={()=>last.current=null} onPointerCancel={()=>last.current=null} onLostPointerCapture={()=>last.current=null}/>}
    {theme.id==='music'&&<div className={'ed-deck '+(playing?'playing':'')}><div className="ed-record"/><div className="ed-arm"/><button type="button" onClick={()=>void play()} aria-label={playing?'Pausar disco':'Reproducir disco'}>{playing?'Ⅱ':'▶'}</button></div>}
    <div className="ed-hint">{info.hint}</div>
   </div>
  </div>
  <div className="ed-bottom"><span>Pequeñas cosas, grandes recuerdos.</span><span>V ♡</span></div>
 </div>;
}
