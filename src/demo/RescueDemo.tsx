import {useEffect,useRef,useState} from 'react';
import {GardenPrologue,type PrologueCheckpoint} from './GardenPrologue';
import {GardenEpilogue} from './GardenEpilogue';
import {Sound} from '../audio';
import {readCampaignMute,writeCampaignMute} from './campaign-audio';
import {EPILOGUE_START,advanceEpilogue,openEpilogueSave,type EpilogueState,type EpilogueStage} from './epilogue-progress.js';
import {resetPrologue,loadPrologue,journeyMemory,type JourneyMemory} from './prologue-story.js';
import {START,advanceRescue,loadRescue,resetRescue,openRescueEntrySave,type RescueState} from './progression.js';
import '../lab/lab.css';
import './rescue.css';

type Entry='garden'|'feeding'|'abduction'|'trail'|'house'|'drawer'|'lock'|'rescue'|'mirror';
type RescueEvent='heart'|'abduction'|'trail'|'house'|'rescue';

// Los checkpoints antiguos siguen disponibles para las pruebas. Todos los
// tramos jugables 2D usan el mismo prólogo isométrico (no otra escena plana).
const initial=(entry:Entry,test:boolean):RescueState=>{
 if(entry==='garden'||entry==='feeding')return test?{...START}:loadRescue();
 if(!test)return loadRescue();
 let s={...START};
 s=advanceRescue(s,'heart');
 if(entry!=='abduction')s=advanceRescue(s,'abduction');
 if(['trail','house','drawer','lock','rescue','mirror'].includes(entry))s=advanceRescue(s,'trail');
 if(['house','drawer','lock','rescue','mirror'].includes(entry))s=advanceRescue(s,'house');
 return s;
};

const checkpointFor=(entry:Entry):PrologueCheckpoint=>
 entry==='feeding'?'feed-cat':entry==='abduction'?'walk-together':entry==='trail'?'ribbon':'intro';

export function RescueDemo({onExit,onComplete=onExit,entry='garden',test=false,epilogueEntry,returnToUniverse=!test}:{onExit:()=>void;onComplete?:()=>void;entry?:Entry;test?:boolean;epilogueEntry?:Exclude<EpilogueStage,'complete'>;returnToUniverse?:boolean}){
 const [entryStore]=useState(()=>({current:test?undefined:openRescueEntrySave()}));
 const [progress]=useState(()=>entryStore.current?.state??initial(entry,test));
 const [memory,setMemory]=useState<JourneyMemory>(()=>journeyMemory(test?undefined:loadPrologue()));
 const [epilogueStore]=useState(()=>({current:!test&&progress.rescued?openEpilogueSave():undefined}));
 const [epilogue,setEpilogue]=useState<EpilogueState>(()=>epilogueStore.current?.state??{...EPILOGUE_START,stage:test&&epilogueEntry?epilogueEntry:EPILOGUE_START.stage});
 const [mode,setMode]=useState<'garden'|'house'|'epilogue'|'end'>(test&&epilogueEntry?'epilogue':progress.rescued?'epilogue':progress.house?'house':'garden');
 const [houseReady,setHouseReady]=useState(false);
 const [error,setError]=useState(''),[saveWarning,setSaveWarning]=useState(false),[campaignMuted,setCampaignMuted]=useState(()=>test?false:readCampaignMute());
 const muteRef=useRef(campaignMuted);
 const [epilogueAudio,setEpilogueAudio]=useState(()=>{const sound=new Sound();sound.muted=campaignMuted;return sound;});
 const updateMuted=(value:boolean)=>{
  muteRef.current=value;setCampaignMuted(value);epilogueAudio.muted=value;
  if(!test)writeCampaignMute(value);
 };
 // The same audio context and musical phrase continue through all four maps.
 // Shut it down only when the epilogue itself is left.
 useEffect(()=>{if(mode!=='epilogue')return;return()=>epilogueAudio.destroy();},[mode,epilogueAudio]);
 const phaseRef=useRef(progress),entering=useRef(false),finishing=useRef(false),epilogueRef=useRef(epilogue);
 const completeEpilogue=(next:EpilogueStage)=>{
  const current=epilogueRef.current,advanced=advanceEpilogue(current,next);
  if(advanced===current)return;
  if(!test&&!epilogueStore.current?.advance(next))setSaveWarning(true);
  epilogueRef.current=advanced;setEpilogue(advanced);
  // The completed save stays in the live celebration scene.
 };

 const enterHouse=()=>{
  if(entering.current)return;
  entering.current=true;setHouseReady(false);
  // Mantiene la clave histórica del rescate sincronizada con el nuevo
  // prólogo; la clave y los guardados del arcade original no se tocan.
  const events:RescueEvent[]=['heart','abduction','trail','house'];
  phaseRef.current=events.reduce(advanceRescue,phaseRef.current);
  if(!test&&!entryStore.current?.enter())setSaveWarning(true);
  setMode('house');
 };

 useEffect(()=>{
  if(mode!=='house')return;
  let cancelled=false;
  let teardown:(()=>void)|undefined;
  const boot=async()=>{
   try{
    const {launchHouse}=await import('../lab/house.js');
    if(cancelled)return;
    const checkpoint=entry==='mirror'?'mirror':
      entry==='drawer'?'interactions':
      entry==='lock'||entry==='rescue'?'upstairs':'ground';
    const checkpointStore=test?undefined:entryStore.current?.openHouse();
    if(!test&&!checkpointStore)setSaveWarning(true);
    teardown=launchHouse(onExit,checkpoint,{
     demo:true,trial:test&&entry!=='garden',fieldTutorials:true,entry,
     checkpointStore,
     initialMuted:test?undefined:muteRef.current,
     campaignHandoff:entry==='garden',
     onRescue:(houseMuted?:boolean)=>{
      if(cancelled||finishing.current)return;
      finishing.current=true;
      if(typeof houseMuted==='boolean')updateMuted(houseMuted);
      phaseRef.current=advanceRescue(phaseRef.current,'rescue');
      const committed=checkpointStore?.finish()===true;
      // Only the existing successful 3D finish event can open the epilogue.
      // If storage is blocked or the lease is stale, keep this session playable
      // without overwriting the other tab's record.
      epilogueStore.current=!test&&committed?openEpilogueSave():undefined;
      if(!test&&!epilogueStore.current)setSaveWarning(true);
      const next=epilogueStore.current?.state??{...EPILOGUE_START};
      epilogueRef.current=next;setEpilogue(next);setMode('epilogue');
     }
    });
    if(!cancelled)setHouseReady(true);
   }catch(e){if(!cancelled)setError(String(e));}
  };
  void boot();
  return()=>{cancelled=true;teardown?.();};
 // Se lanza solo al cambiar de mundo, no cuando React actualiza el HUD.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[mode]);

 const reset=()=>{
  const nextAudio=new Sound();nextAudio.muted=muteRef.current;setEpilogueAudio(nextAudio);
  if(!test){resetRescue();resetPrologue();entryStore.current=openRescueEntrySave();}
  setMemory(journeyMemory());phaseRef.current={...START};epilogueStore.current=undefined;epilogueRef.current={...EPILOGUE_START};setEpilogue(epilogueRef.current);
  entering.current=false;finishing.current=false;setSaveWarning(false);setError('');setHouseReady(false);setMode('garden');
 };

 return <div className="rescue-demo" aria-label="Demo jugable de rescate">
  {mode==='garden'&&<GardenPrologue key={entry+(test?'-trial':'-story')}
   test={test} checkpoint={checkpointFor(entry)} onExit={onExit} onEnterHouse={enterHouse} muted={campaignMuted} onMute={updateMuted} onSaveWarning={()=>setSaveWarning(true)} onRememberJourney={state=>setMemory(journeyMemory(state))} onPrepareHouse={()=>{void import('../lab/house.js').catch(()=>{});}}/>}
  {mode==='epilogue'&&<GardenEpilogue key={epilogue.stage==='complete'?'celebration':epilogue.stage} stage={epilogue.stage==='complete'?'celebration':epilogue.stage} completed={epilogue.stage==='complete'} onAdvance={completeEpilogue} onExit={onExit} onReturn={onComplete} returnLabel={returnToUniverse?'Regresar al universo':'Volver a pruebas'} onReplay={()=>{if(test||window.confirm('¿Volver a jugar desde el principio? Se reiniciará el progreso del rescate.'))reset();}} muted={campaignMuted} onMute={updateMuted} audio={epilogueAudio} memory={memory}/>}
  {mode==='end'&&<div className="rescue-transition rescue-final" data-epilogue-stage="complete">
   <span>♥ ✿ ♥</span><h1>Feliz cumpleaños, <em>Vale</em></h1>
   <p>Louis está a salvo. Emy, Kitty, Luis y Vale vuelven a estar juntos. Gracias por recorrer esta pequeña aventura.</p>
   <button onClick={onComplete}>{returnToUniverse?'Regresar al universo':'Volver a pruebas'}</button>
   <button className="secondary" onClick={()=>{if(test||window.confirm('¿Volver a jugar desde el principio? Se reiniciará el progreso del rescate.'))reset();}}>Volver a jugar</button>
  </div>}
  {saveWarning&&<p className="rescue-save-warning" role="status">Puedes continuar, pero el avance de esta sesión no pudo guardarse.</p>}
  {mode==='house'&&!houseReady&&!error&&<div className="rescue-transition rescue-house-loading" role="status" aria-live="polite">
   <span aria-hidden="true">✧</span><p>La casa</p><small>Kitty se acerca a la ventana…</small><button className="secondary" onClick={onExit}>Volver</button>
  </div>}
  {error&&<div className="rescue-error" role="alert">{error}<button onClick={onExit}>Volver</button></div>}
 </div>;
}
