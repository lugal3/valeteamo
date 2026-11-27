/// <reference types="vite/client" />
import {useCallback,useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import {StoryGame} from '../StoryGame';
import {Sound} from '../audio';
import catSound from '../lab/audio/preview-cat.wav';
import churuSound from '../lab/audio/preview-churu.wav';
import vanDoorSound from '../lab/audio/preview-van-door.wav';
import vanAwaySound from '../lab/audio/preview-van-away.wav';
import userSpriteUrl from '../lab/audio/user-sprite.ogg';
import userSpriteMP3Url from '../lab/audio/user-sprite.mp3';
import {toScreen} from '../isometric';
import {VAN_NIGHT_POSITION} from './abduction-van';
import type {IsoAdventure,IsoStoryBridge,IsoStoryStage,StoryMoment} from '../iso-game';
import {GardenPostcard,makeGardenPostcard} from './GardenPostcard';
import {RESCUE_SCENES,type RescueMapId,type RouteArea} from './rescue-overworld';
import {valeTexture} from './rescue-intro-art';
import {prologueProgress,HOUSE_HANDOFF_MS} from './prologue-beats.js';
import {
 PROLOGUE_START,PROLOGUE_DIALOGUES,PROLOGUE_OBJECTIVES,
 advancePrologue,loadPrologue,openPrologueSave,recordPrologueDiscovery,
 type PrologueState,type PrologueEvent,type PrologueLine
} from './prologue-story.js';
import {dialogueGlyphs,dialogueDelay,dialogueVoice,dialogueWords} from './dialogue-feel.js';
import './garden-prologue.css';
import {EmyFeeding} from './EmyFeeding';

type Dialog={lines:PrologueLine[];index:number};
type Feeding='offer'|'eating';
const RESCUE_SAMPLES={cat:catSound,churu:churuSound,'van-door':vanDoorSound,'van-away':vanAwaySound};
type HouseNavigation={distance:number;heading:number;guided:boolean;near:boolean;vanInspected:boolean;vanDistance:number};
export type PrologueCheckpoint='intro'|'feed-cat'|'walk-together'|'ribbon';
const initial=(test:boolean,checkpoint:PrologueCheckpoint):PrologueState=>
 test?{...PROLOGUE_START,stage:checkpoint,fedGreyCat:checkpoint==='walk-together'||checkpoint==='ribbon',metCouple:checkpoint==='walk-together'||checkpoint==='ribbon'}:loadPrologue();

const label=(speaker:string)=>speaker;

export function GardenPrologue({test=false,checkpoint='intro',onExit,onEnterHouse,onPrepareHouse,muted=false,onMute,onSaveWarning,onRememberJourney}:{
 test?:boolean;checkpoint?:PrologueCheckpoint;onExit:()=>void;onEnterHouse:()=>void;onPrepareHouse?:()=>void;muted?:boolean;onMute?:(muted:boolean)=>void;onSaveWarning?:()=>void;onRememberJourney?:(state:PrologueState)=>void;
}){
 const [prologueStore]=useState(()=>test?undefined:openPrologueSave());
 const [run,setRun]=useState<PrologueState>(()=>prologueStore?.state??initial(test,checkpoint));
 const persist=useCallback((state:PrologueState)=>{if(!test&&!prologueStore?.save(state))onSaveWarning?.();},[test,prologueStore,onSaveWarning]);
 const [dialog,setDialog]=useState<Dialog|null>(null),[letters,setLetters]=useState(0);
 const [feeding,setFeeding]=useState<Feeding|null>(null);
 const [near,setNear]=useState('');
 const [houseNav,setHouseNav]=useState<HouseNavigation|null>(null);
 const [guide,setGuide]=useState(''),[dusk,setDusk]=useState(0),[area,setArea]=useState<RouteArea>('sendero');
 const [map,setMap]=useState<RescueMapId>('morning_garden');
 const [transition,setTransition]=useState<null|{target:RescueMapId;phase:'out'|'in'}>(null);
 const [houseHandoff,setHouseHandoff]=useState(false);
 const [portraits,setPortraits]=useState<Record<string,string>>({});
 const [restartKey,setRestartKey]=useState(0);
 const [moment,setMoment]=useState<StoryMoment|null>(null);
 const [postcard,setPostcard]=useState<null|{title:string;image:string;error:boolean}>(null);
 const postcardRequest=useRef(0),postcardTimer=useRef(0),postcardOpen=useRef(false);

 const sceneRef=useRef<IsoAdventure|null>(null),phaseRef=useRef(run);
 const dialogRef=useRef<Dialog|null>(null),dialogDone=useRef<null|(()=>void)>(null);
 const lettersRef=useRef(0),portraitRef=useRef<HTMLImageElement|null>(null);
 const [speechPulse,setSpeechPulse]=useState(0);
 const [portraitClock,setPortraitClock]=useState(0);
 useEffect(()=>{
  if(!dialog)return;setPortraitClock(0);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const started=performance.now();
  const timer=window.setInterval(()=>{if(!document.hidden)setPortraitClock(Math.floor((performance.now()-started)/120)*120);},120);
  return()=>window.clearInterval(timer);
 },[dialog]);
 const reveal=useCallback((n:number)=>{lettersRef.current=n;setLetters(n);},[]);
 const feedingRef=useRef<Feeding|null>(null);
 const lockedRef=useRef(false),enteringRef=useRef(false),nextDialogRef=useRef<()=>void>(()=>{});
 const travelingRef=useRef(false),travelTimers=useRef<number[]>([]);
 const [audio]=useState(()=>{const sound=new Sound(RESCUE_SAMPLES,userSpriteUrl,userSpriteMP3Url);sound.muted=muted;return sound;});
 useEffect(()=>{audio.muted=muted;},[audio,muted]);
 const showFeeding=useCallback((phase:Feeding|null)=>{
  feedingRef.current=phase;lockedRef.current=phase!==null;setFeeding(phase);
 },[]);

 const changed=useCallback((event:PrologueEvent)=>{
  const current=phaseRef.current,next=advancePrologue(current,event);
  if(next.stage===current.stage)return current;
  phaseRef.current=next;setRun(next);persist(next);
  sceneRef.current?.setStoryStage(next.stage);
  return next;
 },[persist]);

 const showDialog=useCallback((lines:PrologueLine[],done?:()=>void)=>{
  if(!lines.length){done?.();return;}
  lockedRef.current=true;dialogDone.current=done??null;
  const next={lines,index:0};dialogRef.current=next;setDialog(next);reveal(0);setSpeechPulse(0);
 },[reveal]);
 const offerChuru=()=>{
  const scene=sceneRef.current;
  if(feedingRef.current!=='offer'||!scene)return;
  showFeeding('eating');
  scene.playStoryFeeding(()=>{
   showFeeding(null);changed('fed');
  });
 };

 const nextDialog=useCallback(()=>{
  const current=dialogRef.current;if(!current)return;
  const length=dialogueGlyphs(current.lines[current.index].text).length;
  if(lettersRef.current<length){reveal(length);return;}
  if(current.index+1<current.lines.length){
   const next={...current,index:current.index+1};
   dialogRef.current=next;setDialog(next);reveal(0);setSpeechPulse(0);return;
  }
  dialogRef.current=null;setDialog(null);reveal(0);setSpeechPulse(0);
  lockedRef.current=false;
  const done=dialogDone.current;dialogDone.current=null;done?.();
 },[reveal]);
 nextDialogRef.current=nextDialog;

 useEffect(()=>{
  if(!dialog)return;
  const line=dialog.lines[dialog.index],glyphs=dialogueGlyphs(line.text),tone=line.tone??'calm';
  if(letters>=glyphs.length)return;
  const timer=window.setTimeout(()=>{
   // A skip, restart or unmount may have happened before the timer fired.
   if(dialogRef.current!==dialog||lettersRef.current!==letters)return;
   const voice=dialogueVoice(glyphs,letters,line.speaker,tone);
   if(voice){
    audio.tone(voice.frequency,voice.duration,voice.volume,'triangle');
    setSpeechPulse(n=>n+1);
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
     const img=portraitRef.current;
     img?.getAnimations().forEach(animation=>animation.cancel());
     img?.animate([{transform:'scale(1)'},{transform:'scale(1.055,.98)'},{transform:'scale(1)'}],{duration:135,easing:'ease-out'});
    }
   }
   reveal(letters+1);
  },dialogueDelay(glyphs,letters,tone));
  return()=>window.clearTimeout(timer);
 },[dialog,letters,audio,reveal]);
 useEffect(()=>{
  const handler=(e:KeyboardEvent)=>{
   if(feedingRef.current==='eating'&&e.key==='Escape'){
    e.preventDefault();e.stopImmediatePropagation();
    return;
   }
   if(!dialogRef.current)return;
   if(['Enter',' ','e','E'].includes(e.key)){
    e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)nextDialogRef.current();
   }
  };
  window.addEventListener('keydown',handler,true);
  return()=>window.removeEventListener('keydown',handler,true);
 },[showFeeding]);

 const actions=useRef({
  ready:()=>{},interact:(_stage:IsoStoryStage)=>{},clearing:()=>{},
  victory:()=>{},health:(_hp:number)=>{},retry:()=>{},
  arrive:()=>{},guide:(_message:string)=>{},dusk:(_value:number)=>{},area:(_zone:RouteArea)=>{},
  map:(_id:RescueMapId)=>{},travel:(_id:RescueMapId,_commit:()=>void)=>{}
 });
 actions.current={
  ready:()=>{
   // Las imágenes provienen de las texturas reales del mismo Phaser de Corazones.
   const scene=sceneRef.current;
   if(scene){
    const avatars:Record<string,string>={};
    for(const [person,key] of [
     ['kitty','chibi-kitty-down-0'],['kitty-blink','chibi-kitty-down-5'],
     ['louis','chibi-louis-down-0'],['louis-blink','chibi-louis-down-5'],
     ['louis-talk-1','chibi-louis-down-6'],['louis-talk-2','chibi-louis-down-7'],
     ['luis','story-person-luis'],['luis-blink','story-person-luis-down-idle-3'],
     ['luis-talk-1','story-person-luis-down-talk-1'],['luis-talk-2','story-person-luis-down-talk-2'],
     ['vale',valeTexture(false,0)],['vale-blink',valeTexture(false,3)],
     ['vale-talk-1','rescue-vale-talk-1'],['vale-talk-2','rescue-vale-talk-2']
    ]){
     if(!scene.textures.exists(key))continue;
     const source=scene.textures.get(key).getSourceImage();
     if(source instanceof HTMLCanvasElement||source instanceof HTMLImageElement){
      // Close-up of the real in-world sprite, not a different character asset.
      const canvas=document.createElement('canvas');
      const w=source.width,h=Math.max(1,Math.round(source.height*(person.startsWith('luis')?.72:.66)));
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');
      if(ctx){ctx.imageSmoothingEnabled=false;ctx.drawImage(source,0,0,w,h,0,0,w,h);avatars[person]=canvas.toDataURL('image/png');}
     }
    }
    setPortraits(avatars);
    if(test&&checkpoint==='feed-cat')scene.storyTeleportForTest(0);
   }
   if(phaseRef.current.stage==='intro')setGuide('Camina por el sendero · WASD o joystick izquierdo');
   // El inicio no tiene NPC ni diálogos bloqueantes. La aventura comienza al andar.
  },
  arrive:()=>{
   if(phaseRef.current.stage==='cat-fed')changed('arrived');
  },
  guide:(message)=>setGuide(message),
  dusk:(value)=>setDusk(value),
  area:(zone)=>setArea(zone),
  map:(zone)=>setMap(zone),
  travel:(target,commit)=>{
   if(travelingRef.current||dialogRef.current)return;
   travelingRef.current=true;
   setNear('');setGuide('');
   setTransition({target,phase:'out'});
   // CSS full-viewport black fade; the world is exchanged only at full black.
   const first=window.setTimeout(()=>{
    commit();
    setTransition({target,phase:'in'});
    const second=window.setTimeout(()=>{
     travelingRef.current=false;setTransition(null);
    },680);
    travelTimers.current.push(second);
   },680);
   travelTimers.current.push(first);
  },
  victory:()=>{changed('victory');setGuide('¡Bien! Sigue el camino para encontrar a Louis.');audio.tone(880,.19,.03);},
  clearing:()=>{
   if(phaseRef.current.stage!=='walk-together')return;
   changed('clearing');
   showDialog(PROLOGUE_DIALOGUES.warning,()=>{
    sceneRef.current?.playStoryAbduction(()=>{
     showDialog(PROLOGUE_DIALOGUES.abducted,()=>changed('abducted'));
    });
   });
  },
  interact:(stage)=>{
   if(dialogRef.current||lockedRef.current||enteringRef.current)return;
   if(stage==='intro'){
    changed('churu');audio.ui();
   }
   if(stage==='feed-cat')showFeeding('offer');
   if(stage==='meet-couple')showDialog(PROLOGUE_DIALOGUES.couple,()=>{
    const scene=sceneRef.current;
    if(scene)scene.playStoryLuisFarewell(()=>changed('met'));
    else changed('met');
   });
   if(stage==='talk-louis')showDialog(PROLOGUE_DIALOGUES.victory,()=>changed('louis'));
   if(stage==='talk-luis')showDialog(PROLOGUE_DIALOGUES.luis,()=>{
    // Dialogue closes, but the next chapter only begins once Luis has waved
    // goodbye and walked back down the side path. No instantaneous despawn.
    const scene=sceneRef.current;
    if(scene)scene.playStoryLuisFarewell(()=>changed('luis'));
    else changed('luis');
   });
   if(stage==='ribbon')showDialog(PROLOGUE_DIALOGUES.ribbon,()=>changed('ribbon'));
   if(stage==='petals')showDialog(PROLOGUE_DIALOGUES.petals,()=>changed('petals'));
   if(stage==='wheel')showDialog(PROLOGUE_DIALOGUES.wheel,()=>changed('wheel'));
   if(stage==='door')showDialog(PROLOGUE_DIALOGUES.locked,()=>changed('locked'));
   if(stage==='window'){
    showDialog(PROLOGUE_DIALOGUES.window,()=>{
     if(enteringRef.current)return;
     enteringRef.current=true;changed('enter');setHouseHandoff(true);
     onRememberJourney?.(phaseRef.current);
     // Begin loading only once the player has committed to the window entry.
     onPrepareHouse?.();
      // Finish the 2D window transition before mounting the 3D scene.
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reduced)onEnterHouse();
      else travelTimers.current.push(window.setTimeout(onEnterHouse,HOUSE_HANDOFF_MS));
    });
   }
  },
  health:(hp)=>{
   if(phaseRef.current.hp===hp)return;
   const next={...phaseRef.current,hp};phaseRef.current=next;setRun(next);
   // Vida de combate temporal; el checkpoint narrativo guarda solo etapas.
  },
  retry:()=>showDialog([
   {speaker:'Kitty',tone:'alarm',text:'¡Me quedé sin corazones! Voy a intentarlo otra vez. Louis me necesita.'}
  ])
 };

 // StoryGame e IsoAdventure son LOS MISMOS componentes de 2D Corazones.
 // La extensión solo da objetivos/diálogos, no crea un motor ni un mundo aparte.
 const lineLengthCache=useRef<{text:string;count:number}>({text:'',count:0});
 const story=useMemo<IsoStoryBridge>(()=>({
  stage:()=>phaseRef.current.stage as IsoStoryStage,
  objective:(stage)=>PROLOGUE_OBJECTIVES[stage]??'Sigue la historia',
  locked:()=>lockedRef.current||enteringRef.current||travelingRef.current||postcardOpen.current,
  moment:setMoment,
  near:(value)=>setNear(current=>current===value?current:value),
  discoveries:()=>phaseRef.current.discoveries??[],
  speaker:()=>{const current=dialogRef.current;return current?.lines[current.index]?.speaker;},
  speaking:()=>{const current=dialogRef.current;if(!current)return false;
   const text=current.lines[current.index].text;
   if(lineLengthCache.current.text!==text)lineLengthCache.current={text,count:dialogueGlyphs(text).length};
   return lettersRef.current<lineLengthCache.current.count;},
  discover:(id)=>{
   const current=phaseRef.current,next=recordPrologueDiscovery(current,id);
   if(current===next)return;
   phaseRef.current=next;setRun(next);persist(next);
  },
  ready:()=>actions.current.ready(),
  interact:(stage)=>actions.current.interact(stage),
  victory:()=>actions.current.victory(),
  clearing:()=>actions.current.clearing(),
  health:(hp)=>actions.current.health(hp),
  retry:()=>actions.current.retry(),
  arrive:()=>actions.current.arrive(),
  guide:(message)=>actions.current.guide(message),
  dusk:(value)=>actions.current.dusk(value),
  area:(zone)=>actions.current.area(zone),
  map:(zone)=>actions.current.map(zone),
  travel:(zone,commit)=>actions.current.travel(zone,commit)
 }),[]);

 const closePostcard=useCallback(()=>{
  postcardRequest.current++;window.clearTimeout(postcardTimer.current);
  postcardOpen.current=false;setPostcard(null);sceneRef.current?.endStoryPhoto();
 },[]);
 const openPostcard=()=>{
  const scene=sceneRef.current,memory=scene?.availableStoryMoment();
  if(!scene||!memory||postcardOpen.current||!scene.beginStoryPhoto(memory))return;
  postcardOpen.current=true;scene.clearInput();
  const request=++postcardRequest.current;
  setPostcard({title:memory.title,image:'',error:false});
  const finish=(image:string,error=false)=>{
   if(postcardRequest.current!==request)return;
   postcardRequest.current++;
   window.clearTimeout(postcardTimer.current);
   setPostcard({title:memory.title,image,error});
  };
  postcardTimer.current=window.setTimeout(()=>finish('',true),1800);
  // Phaser snapshots after the next render, so WebGL's cleared buffer is
  // never read with a direct canvas.toDataURL call.
  try{
   const renderer=scene.game.renderer;
   if(!renderer){finish('',true);return;}
   renderer.snapshot(result=>{
    if(postcardRequest.current!==request)return;
    if(!(result instanceof HTMLImageElement)){finish('',true);return;}
    try{finish(makeGardenPostcard(result,memory.title));}
    catch{finish('',true);}
   });
  }catch{finish('',true);}
 };
 const toggleAudio=()=>{
  const next=!muted;audio.muted=next;onMute?.(next);
  if(!next)void audio.start();
 };
 const restart=()=>{
  closePostcard();setMoment(null);
  for(const timer of travelTimers.current)window.clearTimeout(timer);
  travelTimers.current=[];travelingRef.current=false;setTransition(null);setHouseHandoff(false);
  if(!test&&!prologueStore?.reset())onSaveWarning?.();
  const next=test?initial(true,checkpoint):{...PROLOGUE_START};
  phaseRef.current=next;setRun(next);setDialog(null);reveal(0);setSpeechPulse(0);
  showFeeding(null);
  dialogRef.current=null;dialogDone.current=null;lockedRef.current=false;enteringRef.current=false;
  setNear('');setGuide('');setDusk(0);setArea('sendero');setMap('morning_garden');setHouseNav(null);
  setRestartKey(value=>value+1);
 };
 useEffect(()=>()=>{for(const timer of travelTimers.current)window.clearTimeout(timer);
  postcardRequest.current++;window.clearTimeout(postcardTimer.current);
  sceneRef.current?.endStoryPhoto();
  audio.destroy();
  if(import.meta.env.DEV)delete (window as Window&{__valePrologue?:unknown}).__valePrologue;
 },[]);
 useEffect(()=>{
  if(run.stage==='house'&&!test&&!enteringRef.current){
   enteringRef.current=true;onRememberJourney?.(phaseRef.current);onEnterHouse();
  }
 },[run.stage,test,onEnterHouse,onRememberJourney]);
 useEffect(()=>{
  const update=()=>{
   const scene=sceneRef.current,stage=phaseRef.current.stage;
   if(!scene||scene.storyMap!=='night_neighborhood'||
    !['door','window'].includes(stage)){setHouseNav(previous=>previous?null:previous);return;}
   const a=toScreen(scene.p),b=toScreen(scene.storyTarget);
   const distance=Math.hypot(scene.p.u-scene.storyTarget.u,scene.p.v-scene.storyTarget.v);
   const next:HouseNavigation={distance:Math.ceil(distance*2)/2,
    heading:Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI,
    guided:scene.houseRoute.length>0,near:distance<(stage==='window'?1.35:1.75),
    vanInspected:scene.storyVanInspected,
    vanDistance:Math.ceil(Math.hypot(scene.p.u-VAN_NIGHT_POSITION.u,
     scene.p.v-VAN_NIGHT_POSITION.v)*2)/2};
   setHouseNav(previous=>previous&&previous.distance===next.distance&&
    previous.guided===next.guided&&previous.near===next.near&&
    previous.vanInspected===next.vanInspected&&
    previous.vanDistance===next.vanDistance&&
    Math.abs(previous.heading-next.heading)<4?previous:next);
  };
  update();
  if(map!=='night_neighborhood'||!['door','window'].includes(run.stage))return;
  const interval=window.setInterval(()=>{if(!document.hidden)update();},220);
  return()=>window.clearInterval(interval);
 },[restartKey,map,run.stage]);

 const currentLine=dialog?.lines[dialog.index];
 
 const glyphs=useMemo(()=>dialogueGlyphs(currentLine?.text??''),[currentLine]);
 const words=useMemo(()=>dialogueWords(glyphs),[glyphs]);
 const lineComplete=letters>=glyphs.length;
 const person=currentLine?.speaker.toLowerCase()??'';
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const mouth=!lineComplete&&!reduce?Math.floor(portraitClock/120)%3:0;
 const phase=person==='vale'?710:person==='louis'?1570:person==='kitty'?2330:0;
 const blink=!reduce&&(portraitClock+phase)%4320>=4080;
 const portrait=(blink?portraits[person+'-blink']:mouth?portraits[person+'-talk-'+mouth]??portraits[person+'-talk-1']:undefined)??portraits[person];
 const chapter=prologueProgress(run.stage);

 return <main className="story-prologue" aria-label="Rescate con el motor original de Corazones"
  data-prologue-stage={run.stage} data-rescue-map={map} data-transition={transition?.phase??'none'}
   data-story-act={chapter.id} data-house-handoff={houseHandoff}
  data-fed-grey-cat={run.fedGreyCat} data-feeding={feeding??'none'} data-conversation={!!dialog} data-postcard={!!postcard}
  onClickCapture={event=>{
   if(!muted&&event.target instanceof Element&&!event.target.closest('.adventure-wrap')){
    void audio.start();
   }
  }}>
  <StoryGame key={restartKey} level={2} character="kitty"
   story={story} audio={audio} muted={muted} audioNotice=""
   onUnlockAudio={()=>{void audio.start();}}
   onToggleAudio={toggleAudio} onExit={onExit} onComplete={()=>{}}
   onSceneReady={scene=>{
    sceneRef.current=scene;
    if(import.meta.env.DEV&&scene){
     (window as Window&{__valePrologue?:unknown}).__valePrologue={
      stage:()=>phaseRef.current.stage,
      position:()=>scene.p.u,
      teleport:(x:number)=>scene.storyTeleportForTest(x),
      defeatShadows:()=>{for(const e of [...scene.enemies])scene.hitEnemy(e,99);},
      interact:()=>scene.storyInteract(),
      advanceDialog:()=>nextDialogRef.current(),
      health:()=>scene.hp,
      dusk:()=>({alpha:scene.storyDusk,fillAlpha:1}),
      area:()=>scene.storyWorld?.area(scene.p.u),
      map:()=>scene.storyMap,
      exit:()=>scene.storyExitForTest(),
      changing:()=>travelingRef.current,
      world:()=>({map:scene.storyMap,tiles:scene.storyWorld?.tiles,progress:scene.p.u}),
      luisBeat:()=>scene.storyLuisMotion?.kind??(scene.storyLuisReady?'ready':'waiting'),
      luisReady:()=>scene.storyLuisReady,
      luisPosition:()=>scene.storyLuis?{x:scene.storyLuis.x,y:scene.storyLuis.y,
       texture:scene.storyLuis.texture.key,visible:scene.storyLuis.visible}:null,
      houseGuide:()=>scene.startHouseGuide(),
      houseRoute:()=>({active:scene.houseRoute.length>0,remaining:scene.houseRoute.length,
       distance:Math.hypot(scene.p.u-scene.storyTarget.u,scene.p.v-scene.storyTarget.v)}),
      vanGuide:()=>scene.startVanGuide(),
      van:()=>({inspected:scene.storyVanInspected,near:scene.storyVanNear,
       parked:!!scene.storyWorld?.parkedVan?.active}),
      abduction:()=>({phase:scene.storyAbduction?.phase??'none',
       elapsed:scene.storyAbduction?.elapsed??0,
       van:scene.storyAbduction?{x:scene.storyAbduction.van.x,
        y:scene.storyAbduction.van.y,visible:scene.storyAbduction.van.visible}:null,
       captors:scene.storyAbduction?{
        fox:scene.storyAbduction.fox.visible,rabbit:scene.storyAbduction.rabbit.visible}:null,
       louis:scene.storyLouis?{x:scene.storyLouis.x,y:scene.storyLouis.y,
        visible:scene.storyLouis.visible}:null}),
      scene:()=>scene
     };
    }
   }}/>
  <div className="prologue-night" data-map={map} style={{opacity:dusk}} aria-hidden="true"/>
   {houseHandoff&&<div className="prologue-3d-handoff" role="status" aria-live="polite">
     <span>✧ CAPÍTULO V ✧</span><strong>La casa</strong>
     <small>Kitty entra por la ventana…</small>
    </div>}
  <div className={'prologue-curtain'+(transition?.phase==='out'?' is-dark':'')}
   data-fade={transition?.phase??'none'} aria-hidden="true"/>
  {transition&&<div className="prologue-curtain-title" role="status">
    <span>{RESCUE_SCENES[transition.target].time}</span>
    <strong>{RESCUE_SCENES[transition.target].label}</strong>
    <i className="prologue-transition-ornament" aria-hidden="true">✧</i>
   </div>}
  <span className="prologue-act" aria-label={`${chapter.label}: ${chapter.title}`}>
    <strong>{chapter.label}</strong><small>{chapter.title}</small>
   </span>
   <span className="prologue-area" aria-live="polite">
   ✿ {RESCUE_SCENES[map].time} · {{
    sendero:'Sendero de los recuerdos',puente:'Río de los pétalos',
    jardin:'Jardín de cerezos',bosque:'Bosque del crepúsculo',
    vecindario:'Villa de los faroles',casa:'La casa de dos pisos'
   }[area]}
  </span>
  {!dialog&&houseNav&&<aside className="prologue-house-nav" aria-label="Guía para llegar a la casa">
   <div className="prologue-house-heading">
    <span className="prologue-house-arrow" aria-hidden="true"
     style={{transform:`rotate(${houseNav.heading}deg)`}}>➜</span>
    <span><strong>{run.stage==='door'?'Puerta principal':'Ventana abierta'}</strong>
     <small>{houseNav.near?'¡Ya puedes interactuar!':
      `A ${houseNav.distance.toFixed(1)} pasos · patio frontal`}</small></span>
   </div>
   {houseNav.vanInspected&&<span className="prologue-van-clue" role="status">
    ☾ Pista encontrada: LUNA-07 · misma furgoneta
   </span>}
   {!houseNav.vanInspected&&!houseNav.guided&&houseNav.vanDistance>2&&
    <button className="prologue-house-route-button prologue-van-route-button"
     type="button" onClick={()=>{
      const scene=sceneRef.current;if(!scene)return;
      const guided=scene.startVanGuide();
      setHouseNav(previous=>previous?{...previous,guided}:previous);
     }}>☾ Investigar furgoneta</button>}
   {(!houseNav.near||houseNav.guided)&&<button className="prologue-house-route-button" type="button"
    onClick={()=>{
     const scene=sceneRef.current;if(!scene)return;
     const started=scene.startHouseGuide();
     setHouseNav(previous=>previous?{...previous,guided:started}:previous);
    }}>{houseNav.guided?'✕ Detener guía':'♡ Guiarme caminando'}</button>}
  </aside>}
  {!dialog&&!feeding&&!houseNav&&guide&&<div className="prologue-guide" role="status">{guide}</div>}
  {!dialog&&!feeding&&near&&<button type="button" className="prologue-interact"
   onClick={()=>sceneRef.current?.storyInteract()}>{near} · E</button>}
  {moment&&!dialog&&!feeding&&!transition&&!houseHandoff&&!postcard&&<div className="prologue-moment" aria-label="Momentos opcionales">
   <button type="button" onClick={()=>sceneRef.current?.enjoyStoryMoment()}>{moment.label}</button>
   <button type="button" className="prologue-photo-button" aria-label="Crear postal del jardín" onClick={openPostcard}>▣ Postal</button>
  </div>}
  {postcard&&<GardenPostcard title={postcard.title} image={postcard.image} error={postcard.error} onClose={closePostcard}/>}
  {feeding==='offer'&&<EmyFeeding audio={audio} onComplete={offerChuru} onCancel={()=>showFeeding(null)}/>}
  {currentLine&&<div className="prologue-dialog-backdrop" role="dialog"
   aria-modal="true" aria-label="Conversación" data-tone={currentLine.tone??'calm'}
   data-complete={lineComplete} data-revealed={letters} data-pulse={speechPulse}
   data-speaker={currentLine.speaker} data-line={dialog!.index}
   onClick={event=>{event.stopPropagation();nextDialog();}}>
   <div className="prologue-dialog">
    <div className="prologue-portrait" aria-hidden="true">
     {portrait?<img ref={portraitRef} src={portrait} alt=""/>:<span className="prologue-kitty-portrait">♡</span>}
    </div>
    <div className="prologue-dialog-copy">
     <div className="prologue-speaker">{label(currentLine.speaker)}</div>
     <p key={dialog!.index} className="prologue-live-text">
      <span className="prologue-sr-only">{currentLine.text}</span>
      <span aria-hidden="true">{words.map((word,i)=>word.length===1&&/\s/u.test(word[0].glyph)?' ':
       <span className="prologue-word" key={i}>{word.map(({glyph,index})=>
        <span key={index} className={'prologue-glyph'+(index<letters?' is-revealed':'')+(lineComplete?' is-settled':'')}
         style={{'--glyph-i':index} as CSSProperties}>{glyph}</span>)}</span>)}</span>
     </p>
     <div className="prologue-dialog-counter"><span>{dialog!.index+1} / {dialog!.lines.length}</span>
      <span>{lineComplete?'Toca para continuar':'Toca para mostrar todo'}</span></div>
    </div>
    <button type="button" className="prologue-next" onClick={event=>{event.stopPropagation();nextDialog();}} aria-label="Continuar diálogo">
     <span>{lineComplete?'Continuar':'Mostrar todo'}</span> <span className="prologue-next-arrow" aria-hidden="true">▾</span>
    </button>
   </div>
  </div>}
  {test&&<button type="button" className="prologue-restart" onClick={restart}>↻ Reiniciar prólogo</button>}
 </main>;
}
