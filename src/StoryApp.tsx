import {useEffect,useRef,useState,type ComponentType} from 'react';
import {CHARACTERS,type CharacterId} from './characters';
import {CONTENT_IS_SAMPLE,STORY,type MemoryPhoto} from './story-content';
import {advance,goTo,initialProgress,readProgress,writeProgress,type StoryProgress} from './story-progress';
import {StoryGame} from './StoryGame';
import {Sound} from './audio';
import {FullscreenControl} from './FullscreenControl';
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
export function StoryApp({ClassicApp}:{ClassicApp:ComponentType}){
 const container=useRef<HTMLDivElement>(null);
 const audio=useRef<Sound>(new Sound());
 const [progress,setProgress]=useState<StoryProgress>(()=>readProgress(STORY.length));
 const [screen,setScreen]=useState<'cover'|'story'|'game'|'classic'>('cover');const [saved,setSaved]=useState(progress.started);const [storageOK,setStorageOK]=useState(true);
 const [audioNotice,setAudioNotice]=useState('');
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
 if(screen==='classic')return <><ClassicApp/><button className="classic-return" onClick={()=>{unlockAudio();setScreen('cover');}}>← Volver a la historia</button></>;
 if(screen==='game'&&chapter.kind==='game')return <StoryGame level={chapter.level} character={progress.character} muted={progress.muted} audio={audio.current} audioNotice={audioNotice} onUnlockAudio={unlockAudio} onToggleAudio={toggleAudio} onComplete={next} onExit={()=>{unlockAudio();setScreen('story');}}/>;
 return <div className="story-app" ref={container} onPointerDownCapture={unlockAudio}>
  <header className="story-nav"><button className="story-brand" onClick={()=>setScreen('cover')} aria-label="Ir a la portada"><span>✿</span> EL JARDÍN DE LOS DESEOS</button><div><span className="nav-note">UN REGALO PARA VALE</span><button className="sound-toggle" aria-label={progress.muted?'Activar sonido':'Silenciar sonido'} onClick={toggleAudio}>{progress.muted?'♪ Activar sonido':'♪ Sonido activado'}</button><FullscreenControl compact/></div></header>
  {!storageOK&&<div className="storage-warning" role="status">El navegador no permite guardar el avance. Puedes jugar, pero al cerrar la página se perderá.</div>}
  {audioNotice&&<div className="audio-warning" role="status">{audioNotice}</div>}
  {screen==='cover'?<main className="story-cover">
   <div className="cover-copy"><span className="story-kicker"><i/> UN PEQUEÑO REGALO PARA TI <i/></span><p className="cover-greeting">Feliz cumpleaños, Valentina</p><h1>Un jardín lleno<br/><em>de deseos.</em></h1><p className="cover-lead">Una pequeña aventura para recorrer despacio, guardar momentos y celebrar todo lo bonito que está por venir.</p>
    <fieldset className="story-characters"><legend>¿QUIÉN TE ACOMPAÑA?</legend>{(Object.keys(CHARACTERS) as CharacterId[]).map(id=><button key={id} className={progress.character===id?'story-character selected':'story-character'} aria-pressed={progress.character===id} onClick={()=>select(id)}><Portrait character={id}/><span>{CHARACTERS[id].name}<small>{id==='kitty'?'UN LAZO DE AMOR':'UN POCO DE MÚSICA'}</small></span><b>{progress.character===id?'♥':'♡'}</b></button>)}</fieldset>
    <div className="cover-actions"><button className="story-button" onClick={()=>{unlockAudio();save({...progress,started:true});setScreen('story');}}>{saved?'Continuar la historia':'Abrir mi regalo'} <span>↗</span></button>{saved&&<button className="text-button" onClick={reset}>Empezar de nuevo</button>}</div>
    <p className="cover-footnote">UNA HISTORIA HECHA PARA TI <span>✦</span> A TU PROPIO RITMO</p>
   </div><div className="cover-art" aria-hidden="true"><div className="art-orbit orbit-a"/><div className="art-orbit orbit-b"/><div className="art-card"><span className="art-sun">✳</span><span className="art-star a">✦</span><span className="art-star b">✧</span><div className="art-hill hill-back"/><div className="art-hill hill-front"/><div className="art-path"/><div className="art-tree tree-a"><i/><b/></div><div className="art-tree tree-b"><i/><b/></div><div className="art-avatar"><Portrait character={progress.character}/></div><span className="art-flower f1">✿</span><span className="art-flower f2">✿</span><span className="art-flower f3">✿</span><span className="art-stamp">HECHO CON<br/>MUCHO AMOR <b>♡</b></span></div><p>UN LUGAR PARA LOS MOMENTOS BONITOS <span>01 / 07</span></p></div>
   <button className="classic-link" onClick={()=>{audio.current.suspend();setScreen('classic');}}>Jugar la aventura clásica ↗</button>
  </main>:<main className="story-page"><div className="chapter-top"><button className="back-link" onClick={back}>← {progress.index===0?'Portada':'Anterior'}</button><span>UNA HISTORIA PARA VALE</span><span>{String(progress.index+1).padStart(2,'0')} / {String(STORY.length).padStart(2,'0')}</span></div>
   <div className="chapter-progress" aria-label={`Capítulo ${progress.index+1} de ${STORY.length}`}><i style={{width:`${(progress.index+1)/STORY.length*100}%`}}/></div>
   <div className={`chapter-layout chapter-${chapter.kind}`} key={chapter.id}><section className="chapter-copy"><span className="story-kicker">✦ {chapter.eyebrow}</span><h1>{chapter.title}<em>.</em></h1><p className="chapter-text">{chapter.text}</p>{CONTENT_IS_SAMPLE&&chapter.kind!=='game'&&<span className="sample-label">TEXTO DE MUESTRA · PERSONALIZABLE</span>}
    {chapter.kind==='question'&&<div className="answer-list">{chapter.answers.map((a,i)=><button key={i} className={answer===i?'chosen':''} aria-pressed={answer===i} onClick={()=>save({...progress,answers:{...progress.answers,[chapter.id]:i}})}><span>{String(i+1).padStart(2,'0')}</span>{a}<b>{answer===i?'♥':'↗'}</b></button>)}</div>}
    {chapter.kind==='letter'&&<div className="letter-signature">{chapter.signature}<span>♡</span></div>}
    <div className="chapter-actions">{chapter.kind==='game'?<button className="story-button" onClick={()=>{unlockAudio();setScreen('game');}}>Jugar este capítulo <span>↗</span></button>:chapter.kind==='letter'?<button className="story-button" onClick={()=>setScreen('cover')}>Volver al comienzo <span>♡</span></button>:<button className="story-button" onClick={next}>{chapter.kind==='question'&&answer===null?'Continuar sin responder':'Continuar'} <span>→</span></button>}
    {chapter.kind==='game'&&progress.unlocked>progress.index&&<button className="text-button" onClick={next}>Ya lo completé · Continuar →</button>}</div>
   </section><aside className="chapter-visual">{chapter.kind==='memory'?<Memory photos={chapter.photos}/>:chapter.kind==='game'?<div className="game-postcard"><span>✦</span><div className="postcard-hills"/><div className="postcard-avatar"><Portrait character={progress.character}/></div><div className="postcard-label"><small>UNA PEQUEÑA AVENTURA</small><strong>{chapter.title}</strong><i>← MOVER · APUNTAR →</i></div></div>:chapter.kind==='question'?<div className="question-art"><span>?</span><i>✳</i><small>UN MOMENTO<br/>PARA RECORDAR</small></div>:<div className="letter-art"><span>♡</span><i>PARA VALENTINA</i><b>✿</b></div>}</aside></div>
   <footer className="chapter-footer"><span>✿ &nbsp; EL JARDÍN DE LOS DESEOS</span><span>CON CARIÑO, PARA TI</span></footer>
  </main>}
 </div>;
}
