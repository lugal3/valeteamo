import {useEffect,useMemo,useRef,useState} from 'react';
import {StoryGame} from '../StoryGame';
import {Sound} from '../audio';
import type {IsoAdventure,IsoStoryBridge} from '../iso-game';
import type {EpilogueStage} from './epilogue-progress.js';
import {EPILOGUE_CHAPTERS} from './epilogue-route';
import './garden-epilogue.css';

type Props={stage:Exclude<EpilogueStage,'complete'>;onAdvance:(next:EpilogueStage)=>void;onExit:()=>void};
// Parent keys by stage; only one StoryGame/Phaser instance exists at a time.
// Persistence and public handoff will be wired in the integration phase.
export function GardenEpilogue({stage,onAdvance,onExit}:Props){
 const chapter=EPILOGUE_CHAPTERS[stage];
 const [audio]=useState(()=>new Sound());
 const [near,setNear]=useState(''),[muted,setMuted]=useState(false),[leaving,setLeaving]=useState(false);
 const scene=useRef<IsoAdventure|null>(null),locked=useRef(false),timer=useRef<number>(0);
 const advance=useRef(onAdvance);advance.current=onAdvance;
 const leave=()=>{
  if(locked.current||!scene.current?.storyNear)return;
  locked.current=true;scene.current.clearInput();setLeaving(true);
  timer.current=window.setTimeout(()=>advance.current(chapter.next),window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:680);
 };
 const leaveRef=useRef(leave);leaveRef.current=leave;
 const story=useMemo<IsoStoryBridge>(()=>({
  stage:()=> 'house',epilogue:chapter,objective:()=>chapter.objective,locked:()=>locked.current,near:setNear,
  ready:()=>{},interact:()=>leaveRef.current(),victory:()=>{},clearing:()=>{},health:()=>{},retry:()=>{},arrive:()=>{},
  guide:()=>{},dusk:()=>{},area:()=>{},map:()=>{},travel:()=>{}
 }),[chapter]);
 useEffect(()=>()=>{window.clearTimeout(timer.current);audio.destroy();},[audio]);
 return <main className="garden-epilogue" data-epilogue-stage={stage} data-epilogue-leaving={leaving}>
  <StoryGame level={1} character="kitty" story={story} audio={audio} muted={muted} audioNotice=""
   onUnlockAudio={()=>{void audio.start();}} onToggleAudio={()=>{audio.muted=!muted;setMuted(!muted);if(muted)void audio.start();}}
   onExit={onExit} onComplete={()=>{}} onSceneReady={value=>{scene.current=value;}}/>
  <div className="epilogue-sunlight" aria-hidden="true"/>
  <div className="epilogue-location"><span>ACTO IV · DE VUELTA A CASA</span><h1>{chapter.title}</h1><p>{chapter.objective}</p></div>
  {near&&!leaving&&<button className="epilogue-action" onClick={()=>scene.current?.storyInteract()}>{near} ♡</button>}
  <div className="epilogue-fade" aria-hidden="true"/>
 </main>;
}
