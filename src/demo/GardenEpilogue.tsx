import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {StoryGame} from '../StoryGame';
import type {Sound} from '../audio';
import type {IsoAdventure,IsoStoryBridge} from '../iso-game';
import type {EpilogueStage} from './epilogue-progress.js';
import {EPILOGUE_CHAPTERS} from './epilogue-route';
import {epilogueDialogue,EPILOGUE_LETTER} from './epilogue-content';
import type {JourneyMemory} from './prologue-story.js';
import {dialogueGlyphs,dialogueDelay,dialogueVoice} from './dialogue-feel.js';
import {GardenPostcard,makeGardenPostcard} from './GardenPostcard';
import {valeTexture} from './rescue-intro-art';
import './garden-epilogue.css';

type Props={stage:Exclude<EpilogueStage,'complete'>;onAdvance:(next:EpilogueStage)=>void;onExit:()=>void;muted:boolean;onMute:(muted:boolean)=>void;audio:Sound;memory?:JourneyMemory;completed?:boolean;onReturn?:()=>void;onReplay?:()=>void;returnLabel?:string};
// Parent keys by stage; one StoryGame/Phaser instance at a time.
export function GardenEpilogue({stage,onAdvance,onExit,muted,onMute,audio,memory,completed=false,onReturn,onReplay,returnLabel='Regresar al universo'}:Props){
 const revisiting=useRef(completed);
 const chapter=useMemo(()=>{const base=EPILOGUE_CHAPTERS[stage];return revisiting.current&&stage==='celebration'?{...base,spawn:{u:base.target.u+.72,v:base.target.v+.25}}:base;},[stage]);
 const lines=useMemo(()=>epilogueDialogue(stage,memory),[stage,memory]);
 const [near,setNear]=useState(''),[leaving,setLeaving]=useState(false);
 const [line,setLine]=useState(-1),[letters,setLetters]=useState(0),[portraits,setPortraits]=useState<Record<string,string>>({});
 const [celebrating,setCelebrating]=useState(completed),[candlesOut,setCandlesOut]=useState(completed),[letterOpen,setLetterOpen]=useState(false);
 const picnicStarted=useRef(candlesOut);picnicStarted.current=candlesOut;
 const [postcard,setPostcard]=useState<null|{image:string;error:boolean}>(null);
 const scene=useRef<IsoAdventure|null>(null),locked=useRef(false),finishing=useRef(false),timer=useRef<number>(0);
 const captureTimer=useRef(0),captureToken=useRef(0);
 const current=lines[line],glyphs=useMemo(()=>current?dialogueGlyphs(current.text):[],[current]);
 const activeLine=useRef(current),speaking=useRef(false);activeLine.current=current;speaking.current=!!current&&letters<glyphs.length;
 const advance=useRef(onAdvance);advance.current=onAdvance;
 const finish=()=>{
  if(finishing.current)return;
  if(stage==='celebration'){finishing.current=true;advance.current('complete');return;}
  finishing.current=true;locked.current=true;scene.current?.clearInput();setLeaving(true);
  timer.current=window.setTimeout(()=>advance.current(chapter.next),window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:680);
 };
 const begin=()=>{
  if(locked.current||!scene.current?.storyNear||celebrating)return;
  locked.current=true;scene.current.clearInput();setLine(0);setLetters(0);
 };
 const next=()=>{
  if(!current)return;
  if(letters<glyphs.length){setLetters(glyphs.length);return;}
  if(line+1<lines.length){setLine(line+1);setLetters(0);return;}
  setLine(-1);
  if(stage==='celebration')setCelebrating(true);else finish();
 };
 const beginRef=useRef(begin);beginRef.current=begin;
 const story=useMemo<IsoStoryBridge>(()=>({
  stage:()=> 'house',epilogue:chapter,objective:()=>chapter.objective,locked:()=>locked.current,near:setNear,
  speaker:()=>activeLine.current?.speaker,speaking:()=>speaking.current,
  ready:()=>{
   const s=scene.current;if(!s)return;
   const result:Record<string,string>={};
   for(const [person,key] of Object.entries({Kitty:'chibi-kitty-down-0',Louis:'chibi-louis-down-0',Luis:'story-person-luis',Vale:valeTexture(false,0)})){
    if(!s.textures.exists(key))continue;
    const source=s.textures.get(key).getSourceImage();
    if(!(source instanceof HTMLImageElement||source instanceof HTMLCanvasElement))continue;
    const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=Math.round(source.height*.7);
    const ctx=canvas.getContext('2d');if(ctx){ctx.drawImage(source,0,0,canvas.width,canvas.height,0,0,canvas.width,canvas.height);result[person]=canvas.toDataURL();}
   }
   setPortraits(result);
   if(picnicStarted.current)s.startEpiloguePicnic(false);
  },interact:()=>beginRef.current(),victory:()=>{},clearing:()=>{},health:()=>{},retry:()=>{},arrive:()=>{},
  guide:()=>{},dusk:()=>{},area:()=>{},map:()=>{},travel:()=>{}
 }),[chapter]);
 useEffect(()=>{
  if(!current||letters>=glyphs.length)return;
  const timeout=window.setTimeout(()=>{
   const voice=dialogueVoice(glyphs,letters,current.speaker,current.tone);
   if(voice)audio.tone(voice.frequency,voice.duration,voice.volume,'triangle');
   setLetters(v=>v+1);
  },dialogueDelay(glyphs,letters,current.tone));
  return()=>window.clearTimeout(timeout);
 },[current,letters,glyphs,audio]);
 useEffect(()=>{
  if(!current)return;
  const handle=(e:KeyboardEvent)=>{if(['Enter',' ','e','E'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)next();}};
  window.addEventListener('keydown',handle,true);return()=>window.removeEventListener('keydown',handle,true);
 },[current,letters,line]);
 const closePostcard=useCallback(()=>{
  captureToken.current++;window.clearTimeout(captureTimer.current);scene.current?.endStoryPhoto();setPostcard(null);
 },[]);
 const takePhoto=()=>{
  const s=scene.current;if(!s||postcard||!s.beginStoryPhoto({id:'couple',label:'Foto grupal',title:'Feliz cumpleaños, Vale',point:s.storyTarget}))return;
  const token=++captureToken.current;setPostcard({image:'',error:false});
  const done=(image:string,error=false)=>{if(captureToken.current!==token)return;captureToken.current++;window.clearTimeout(captureTimer.current);setPostcard({image,error});};
  captureTimer.current=window.setTimeout(()=>done('',true),2200);
  try{const renderer=s.game.renderer;if(!renderer){done('',true);return;}renderer.snapshot(result=>{if(!(result instanceof HTMLImageElement)){done('',true);return;}try{done(makeGardenPostcard(result,'Feliz cumpleaños, Vale',true));}catch{done('',true);}});}catch{done('',true);}
 };
 useEffect(()=>()=>{captureToken.current++;window.clearTimeout(captureTimer.current);window.clearTimeout(timer.current);},[]);
 return <main className="garden-epilogue" data-epilogue-stage={completed?'complete':stage} data-epilogue-leaving={leaving} data-picnic-live={candlesOut}>
  <StoryGame level={1} character="kitty" story={story} audio={audio} muted={muted} audioNotice=""
   onUnlockAudio={()=>{void audio.start();}} onToggleAudio={()=>{audio.muted=!muted;onMute(!muted);if(muted)void audio.start();}}
   onExit={completed?(onReturn??onExit):onExit} onComplete={()=>{}} onSceneReady={value=>{
    scene.current=value;
    // Development-only read telemetry: no teleport, stage advance or save mutation.
    if(import.meta.env.DEV){
     const target=window as Window&{__valeEpilogue?:()=>unknown};
     if(value)target.__valeEpilogue=()=>({p:{...value.p},target:{...value.storyTarget},map:value.storyMap,clock:value.clock,near:value.storyNear,texture:value.player?.texture?.key,velocity:{...value.storyVelocity},enemies:value.enemies.length,companions:[value.storyLouis,value.storyCat].map(actor=>!!actor?.active&&actor.visible),ready:!!value.player?.texture});
     else delete target.__valeEpilogue;
    }
   }} epilogueUI={<>
  <div className="epilogue-sunlight" aria-hidden="true"/>
  <div className="epilogue-location"><span>{candlesOut?'UN DÍA PARA RECORDAR':'ACTO IV · DE VUELTA A CASA'}</span><h1>{candlesOut?'Feliz cumpleaños, Vale':chapter.title}</h1><p>{candlesOut?'Ya están todos a salvo. Quédate cuanto quieras.':chapter.objective}</p></div>
  {near&&!leaving&&!current&&!celebrating&&<button className="epilogue-action" style={{pointerEvents:'auto'}} onClick={()=>scene.current?.storyInteract()}>{near}<span className="input-key-hint"> · E</span><span className="input-pad-hint"> · ✕</span></button>}
  {current&&<section className="epilogue-dialog" style={{pointerEvents:'auto'}} aria-label={'Diálogo de '+current.speaker}>
   {portraits[current.speaker]&&<img src={portraits[current.speaker]} alt=""/>}
   <div><strong>{current.speaker}</strong><p aria-label={current.text}>{glyphs.slice(0,letters).join('')}</p><small>{line+1} / {lines.length}</small></div>
   <button onClick={next}>{letters<glyphs.length?'Mostrar todo':'Continuar'}</button>
  </section>}
  {celebrating&&!postcard&&!leaving&&<section className="epilogue-celebration" style={{pointerEvents:'auto'}} aria-label="Celebración de cumpleaños">
   <span aria-hidden="true">♡ ✦ ♡</span><h2>Feliz cumpleaños, Vale</h2>
   {!candlesOut?<button onClick={()=>{picnicStarted.current=true;setCandlesOut(true);scene.current?.startEpiloguePicnic(true);locked.current=false;scene.current?.clearInput();}}>Pide un deseo y sopla las velas</button>:<>
    <div className="epilogue-confetti" aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i} style={{left:(i*37%100)+'%',animationDelay:i%5*.14+'s'}}/>)}</div>
    {letterOpen&&<p className="epilogue-letter">{EPILOGUE_LETTER}</p>}
    <div className="epilogue-celebration-actions"><button onClick={()=>setLetterOpen(v=>!v)}>{letterOpen?'Cerrar carta':'Leer carta'}</button><button onClick={takePhoto} disabled={!near}>Foto grupal</button>{!completed?<button onClick={finish}>Terminar aventura</button>:<button onClick={onReturn??onExit}>{returnLabel}</button>}</div>
   </>}
  </section>}
  {candlesOut&&!postcard&&!letterOpen&&<div className="epilogue-picnic-tools" style={{pointerEvents:'auto'}}><button onClick={()=>scene.current?.picnicRest()}>Sentarse</button><button onClick={()=>scene.current?.picnicPet()} disabled={!near}>Acariciar a Emy</button>{completed&&onReplay&&<button onClick={onReplay}>Volver a jugar</button>}</div>}
  {postcard&&<GardenPostcard title="Feliz cumpleaños, Vale" image={postcard.image} error={postcard.error} onClose={closePostcard}/>}
  <div className="epilogue-fade" aria-hidden="true"/>
  </>}/>

 </main>;
}
