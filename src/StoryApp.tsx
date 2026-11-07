import {useEffect,useRef,useState,type ComponentType} from 'react';
import {CHARACTERS,type CharacterId} from './characters';
import {CONTENT_IS_SAMPLE,STORY,type MemoryPhoto} from './story-content';
import {advance,goTo,initialProgress,readProgress,writeProgress,type StoryProgress} from './story-progress';
import {StoryGame} from './StoryGame';
import {Sound} from './audio';
import {FullscreenControl} from './FullscreenControl';
import {Splash} from './demo/Splash';
import {RescueDemo} from './demo/RescueDemo';
import './story.css';

function Portrait({character}:{character:CharacterId}){
 return <span className="kitty-reference-portrait" aria-hidden="true" style={{backgroundImage:`url(${new URL(`./sprites/${character}-reference-sheet.png`,document.baseURI).href})`}}/>;
}

function Photo({photo}:{photo:MemoryPhoto}){
 const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[photo.src]);
 return <div className="photo-frame"><div className="photo-inner">{photo.src&&!failed?<img src={photo.src} alt={photo.alt} loading="lazy" onError={()=>setFailed(true)}/>:<div className="photo-placeholder"><span aria-hidden="true">✿</span><strong>{failed?'No se pudo cargar la foto':'Tu foto aquí'}</strong><small>{failed?'Revisa la ruta de la imagen':'RECUERDO POR AÑADIR'}</small></div>}</div><p>{photo.caption}</p></div>;
}
function Memory({photos}:{photos:MemoryPhoto[]}){
 const [current,setCurrent]=useState(0),touchStart=useRef<number|null>(null);useEffect(()=>setCurrent(0),[photos]);const index=Math.min(current,photos.length-1);
 if(!photos.length)return null;
 return <div className="memory-gallery" onPointerDown={e=>{if(e.pointerType==='touch')touchStart.current=e.clientX;}} onPointerUp={e=>{if(touchStart.current!==null&&photos.length>1){const dx=e.clientX-touchStart.current;if(Math.abs(dx)>45)setCurrent((index+(dx<0?1:-1)+photos.length)%photos.length);}touchStart.current=null;}} onPointerCancel={()=>{touchStart.current=null;}}><Photo photo={photos[index]}/>{photos.length>1&&<div className="gallery-controls"><button aria-label="Foto anterior" onClick={()=>setCurrent((index-1+photos.length)%photos.length)}>←</button><span aria-live="polite">{String(index+1).padStart(2,'0')} <i/> {String(photos.length).padStart(2,'0')}</span><button aria-label="Foto siguiente" onClick={()=>setCurrent((index+1)%photos.length)}>→</button></div>}</div>;
}
function ComicDialog({close}:{close:()=>void}){
 const dialog=useRef<HTMLDivElement>(null),onClose=useRef(close);onClose.current=close;
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();onClose.current();}else if(e.key==='Tab'){e.preventDefault();dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();}};window.addEventListener('keydown',key,true);return()=>{window.removeEventListener('keydown',key,true);previous?.focus();};},[]);
 return <div className="comic-backdrop" onClick={e=>{if(e.target===e.currentTarget)close();}}><div className="comic-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="comic-title"><div className="comic-heading"><div><span className="story-kicker">UNA SORPRESA PARA TI ✦</span><h2 id="comic-title">jaja uno XD</h2></div><button className="comic-close" onClick={close} aria-label="Cerrar cómic">×</button></div><img src={new URL('./comics/jaja-uno-xd.png',document.baseURI).href} alt="Cuatro viñetas: Kitty encuentra una invitación, prepara una torta con Louis y ambos siguen unas luces para celebrar un cumpleaños con regalos."/><p>Una pequeña sorpresa, preparada con mucho cariño. ♡</p></div></div>;
}
export function StoryApp({ClassicApp}:{ClassicApp:ComponentType}){
 const container=useRef<HTMLDivElement>(null);
 const audio=useRef<Sound>(new Sound());
 const [progress,setProgress]=useState<StoryProgress>(()=>readProgress(STORY.length));
 const [screen,setScreen]=useState<'splash'|'cover'|'story'|'game'|'classic'|'rescue'|'tests'>('splash');
 const nextAfterSplash=useRef<'cover'|'rescue'>('cover');
 const [demoEntry,setDemoEntry]=useState<'garden'|'abduction'|'trail'|'house'|'drawer'|'lock'|'rescue'>('garden');
 const [demoTrial,setDemoTrial]=useState(false);const [saved,setSaved]=useState(progress.started);const [storageOK,setStorageOK]=useState(true);
 const [audioNotice,setAudioNotice]=useState('');
 const [comicOpen,setComicOpen]=useState(false);
 const chapter=STORY[progress.index];
 const answer=progress.answers[chapter.id]??null;
 useEffect(()=>{container.current?.scrollTo({top:0,behavior:'auto'});},[progress.index,screen]);
 useEffect(()=>{audio.current.setTheme(screen==='game'&&chapter.kind==='game'?(chapter.level===3?'final':chapter.level===2?'battle':'garden'):'story');},[progress.index,screen]);
 useEffect(()=>{const visibility=()=>{if(document.hidden)audio.current.suspend();};document.addEventListener('visibilitychange',visibility);const sound=audio.current;return()=>{document.removeEventListener('visibilitychange',visibility);sound.destroy();};},[]);
 const save=(next:StoryProgress)=>{setProgress(next);setSaved(next.started);setStorageOK(writeProgress(next));};
 const next=()=>{save(advance(progress,STORY.length));setScreen('story');};
 const back=()=>{if(progress.index===0)setScreen('cover');else{save(goTo(progress,progress.index-1));setScreen('story');}};
 const reset=()=>{if(!window.confirm('¿Quieres empezar la historia desde el principio? Se reiniciará el avance guardado en este dispositivo.'))return;save(initialProgress());setScreen('cover');};
 const select=(character:CharacterId)=>save({...progress,character});
 const tryAudio=()=>{audio.current.muted=false;void audio.current.start().then(ok=>{if(!audio.current.muted)setAudioNotice(ok?'':'El navegador bloqueó el audio. Toca Activar sonido y comprueba el volumen.');});};
 const toggleAudio=()=>{const muted=!progress.muted;audio.current.muted=muted;save({...progress,muted});setAudioNotice('');if(muted)audio.current.suspend();else tryAudio();};
 const unlockAudio=()=>{if(!progress.muted)tryAudio();};
 const openDemo=(entry:typeof demoEntry,trial:boolean)=>{setDemoEntry(entry);setDemoTrial(trial);nextAfterSplash.current='rescue';setScreen('splash');};
 if(screen==='splash')return <Splash muted={progress.muted} onStart={()=>{unlockAudio();setScreen(nextAfterSplash.current);}}/>;
 if(screen==='rescue')return <RescueDemo key={demoEntry+(demoTrial?'-trial':'-story')} entry={demoEntry} test={demoTrial} onExit={()=>setScreen('cover')}/>;
 if(screen==='tests')return <section className="rescue-test-menu" aria-label="Menú de pruebas"><div>
  <span>VALETEAMO · SOLO DESARROLLO</span><h1>Pruebas de la demo</h1><p>Estos accesos usan estados aislados; no cambian tu partida normal ni el regalo original.</p>
  <div className="rescue-test-grid">{([
   ['garden','Inicio 2D'],['abduction','Secuestro visible'],['trail','Pista y llegada a casa'],['house','Casa 3D'],['drawer','Pista del cajón'],['lock','Llave y dormitorio'],['rescue','Rescate']
  ] as [typeof demoEntry,string][]).map(([key,label])=><button key={key} onClick={()=>openDemo(key,true)}>{label} ↗</button>)}</div>
  <button className="back-to-birthday" onClick={()=>setScreen('cover')}>← Volver a Feliz cumpleaños</button></div>
 </section>;
 if(screen==='classic')return <><ClassicApp/><button className="classic-return" onClick={()=>{unlockAudio();setScreen('cover');}}>← Volver a la historia</button></>;
 if(screen==='game'&&chapter.kind==='game')return <StoryGame level={chapter.level} character={progress.character} muted={progress.muted} audio={audio.current} audioNotice={audioNotice} onUnlockAudio={unlockAudio} onToggleAudio={toggleAudio} onComplete={next} onExit={()=>{unlockAudio();setScreen('story');}}/>;
 return <div className="story-app" ref={container} onPointerDownCapture={unlockAudio} onKeyDownCapture={e=>{if((e.key==='Enter'||e.key===' ')&&(e.target as HTMLElement).closest('button'))unlockAudio();}} onClickCapture={e=>{const button=(e.target as HTMLElement).closest('button');if(button&&!button.disabled&&!button.classList.contains('sound-toggle'))audio.current.ui();}}>
  <div className="story-atmosphere" aria-hidden="true"><span>✿</span><span>✧</span><span>♡</span><span>✦</span><span>✿</span><span>✧</span><span>♡</span><span>✦</span></div>
  <header className="story-nav"><button className="story-brand" onClick={()=>setScreen('cover')} aria-label="Ir a la portada"><span>✿</span> EL JARDÍN DE LOS DESEOS</button><div><span className="nav-note">UN REGALO PARA VALE</span><button className="sound-toggle" aria-label={progress.muted?'Activar sonido':'Silenciar sonido'} onClick={toggleAudio}>{progress.muted?'♪ Activar sonido':'♪ Sonido activado'}</button><FullscreenControl compact/></div></header>
  {!storageOK&&<div className="storage-warning" role="status">El navegador no permite guardar el avance. Puedes jugar, pero al cerrar la página se perderá.</div>}
  {audioNotice&&<div className="audio-warning" role="status">{audioNotice}</div>}
  {screen==='cover'?<main className="story-cover">
   <div className="cover-copy"><span className="story-kicker"><i/> UN PEQUEÑO REGALO PARA TI <i/></span><p className="cover-greeting">Feliz cumpleaños, Valentina</p><h1>Un jardín lleno<br/><em>de deseos.</em></h1><p className="cover-lead">Una pequeña aventura para recorrer despacio, guardar momentos y celebrar todo lo bonito que está por venir.</p>
    <fieldset className="story-characters"><legend>¿QUIÉN TE ACOMPAÑA?</legend>{(Object.keys(CHARACTERS) as CharacterId[]).map(id=><button key={id} className={progress.character===id?'story-character selected':'story-character'} aria-pressed={progress.character===id} onClick={()=>select(id)}><Portrait character={id}/><span>{CHARACTERS[id].name}<small>{id==='kitty'?'UN LAZO DE AMOR':'UN POCO DE MÚSICA'}</small></span><b>{progress.character===id?'♥':'♡'}</b></button>)}</fieldset>
    <div className="cover-actions"><button className="story-button" onClick={()=>{unlockAudio();save({...progress,started:true});setScreen('story');}}>{saved?'Continuar la historia':'Abrir mi regalo'} <span>↗</span></button>{saved&&<button className="text-button" onClick={reset}>Empezar de nuevo</button>}</div>
    <p className="cover-footnote">UNA HISTORIA HECHA PARA TI <span>✦</span> A TU PROPIO RITMO</p>
   </div><div className="cover-art" aria-hidden="true"><div className="art-orbit orbit-a"/><div className="art-orbit orbit-b"/><div className="art-card"><div className="art-garland"><i/><i/><i/><i/><i/><i/><i/></div><span className="art-sun">✳</span><span className="art-star a">✦</span><span className="art-star b">✧</span><div className="art-hill hill-back"/><div className="art-hill hill-front"/><div className="art-path"/><div className="art-tree tree-a"><i/><b/></div><div className="art-tree tree-b"><i/><b/></div><div className="art-avatar"><Portrait character={progress.character}/></div><span className="art-flower f1">✿</span><span className="art-flower f2">✿</span><span className="art-flower f3">✿</span><span className="art-stamp">HECHO CON<br/>MUCHO AMOR <b>♡</b></span></div><p>UN LUGAR PARA LOS MOMENTOS BONITOS <span>01 / 07</span></p></div>
   <div className="rescue-cover-buttons"><button className="story-button rescue-new-link" onClick={()=>openDemo('garden',false)}>♥ Jugar la demo de rescate 2D → 3D</button><button className="rescue-test-link" onClick={()=>setScreen('tests')}>Pruebas</button></div>
   <button className="classic-link" onClick={()=>{audio.current.suspend();setScreen('classic');}}>Jugar la aventura clásica ↗</button>
  </main>:<main className="story-page"><div className="chapter-top"><button className="back-link" onClick={back}>← {progress.index===0?'Portada':'Anterior'}</button><span>UNA HISTORIA PARA VALE</span><span>{String(progress.index+1).padStart(2,'0')} / {String(STORY.length).padStart(2,'0')}</span></div>
   <div className="chapter-progress" role="progressbar" aria-label="Avance de la historia" aria-valuemin={1} aria-valuemax={STORY.length} aria-valuenow={progress.index+1} aria-valuetext={`Capítulo ${progress.index+1} de ${STORY.length}`}><i style={{width:`${(progress.index+1)/STORY.length*100}%`}}/></div>
   <div className={`chapter-layout chapter-${chapter.kind}`} key={chapter.id}><section className="chapter-copy"><span className="story-kicker">✦ {chapter.eyebrow}</span><h1>{chapter.title}<em>.</em></h1><p className="chapter-text">{chapter.text}</p>{CONTENT_IS_SAMPLE&&chapter.kind!=='game'&&<span className="sample-label">TEXTO DE MUESTRA · PERSONALIZABLE</span>}
    {chapter.kind==='question'&&<div className="answer-list">{chapter.answers.map((a,i)=><button key={i} className={answer===i?'chosen':''} aria-pressed={answer===i} onClick={()=>save({...progress,answers:{...progress.answers,[chapter.id]:i}})}><span>{String(i+1).padStart(2,'0')}</span>{a}<b>{answer===i?'♥':'↗'}</b></button>)}</div>}
    {chapter.kind==='letter'&&<><div className="letter-signature">{chapter.signature}<span>♡</span></div><button className="comic-invitation" onClick={()=>setComicOpen(true)}><span aria-hidden="true">✉</span><span><b>Una última sorpresa</b><small>Abre tu pequeño cómic</small></span><span aria-hidden="true">↗</span></button></>}
    <div className="chapter-actions">{chapter.kind==='game'?<button className="story-button" onClick={()=>{unlockAudio();setScreen('game');}}>Jugar este capítulo <span>↗</span></button>:chapter.kind==='letter'?<button className="story-button" onClick={()=>setScreen('cover')}>Volver al comienzo <span>♡</span></button>:<button className="story-button" onClick={next}>{chapter.kind==='question'&&answer===null?'Continuar sin responder':'Continuar'} <span>→</span></button>}
    {chapter.kind==='game'&&progress.unlocked>progress.index&&<button className="text-button" onClick={next}>Ya lo completé · Continuar →</button>}</div>
   </section><aside className="chapter-visual">{chapter.kind==='memory'?<Memory photos={chapter.photos}/>:chapter.kind==='game'?<div className="game-postcard"><span>✦</span><div className="postcard-hills"/><div className="postcard-avatar"><Portrait character={progress.character}/></div><div className="postcard-label"><small>UNA PEQUEÑA AVENTURA</small><strong>{chapter.title}</strong><i>← MOVER · APUNTAR →</i></div></div>:chapter.kind==='question'?<div className="question-art"><span>?</span><i>✳</i><small>UN MOMENTO<br/>PARA RECORDAR</small></div>:<div className="letter-art"><div className="finale-sparkles" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div><span>♡</span><i>PARA VALENTINA</i><b>✿</b></div>}</aside></div>
   <footer className="chapter-footer"><span>✿ &nbsp; EL JARDÍN DE LOS DESEOS</span><span>CON CARIÑO, PARA TI</span></footer>
  </main>}
  {comicOpen&&<ComicDialog close={()=>setComicOpen(false)}/>}
 </div>;
}
