import {useEffect,useRef,useState} from 'react';
import {GardenPrologue,type PrologueCheckpoint} from './GardenPrologue';
import {GardenEpilogue} from './GardenEpilogue';
import {EPILOGUE_START,advanceEpilogue,openEpilogueSave,type EpilogueState,type EpilogueStage} from './epilogue-progress.js';
import {resetPrologue} from './prologue-story.js';
import {START,advanceRescue,loadRescue,saveRescue,resetRescue,openRescueHouseSave,type RescueState} from './progression.js';
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
 const [progress]=useState(()=>initial(entry,test));
 const [epilogueStore]=useState(()=>({current:!test&&progress.rescued?openEpilogueSave():undefined}));
 const [epilogue,setEpilogue]=useState<EpilogueState>(()=>epilogueStore.current?.state??{...EPILOGUE_START,stage:test&&epilogueEntry?epilogueEntry:EPILOGUE_START.stage});
 const [mode,setMode]=useState<'garden'|'house'|'epilogue'|'end'>(test&&epilogueEntry?'epilogue':progress.rescued?(epilogue.stage==='complete'?'end':'epilogue'):progress.house?'house':'garden');
 const [error,setError]=useState(''),[saveWarning,setSaveWarning]=useState(false);
 const phaseRef=useRef(progress),entering=useRef(false),finishing=useRef(false),epilogueRef=useRef(epilogue);
 const completeEpilogue=(next:EpilogueStage)=>{
  const current=epilogueRef.current,advanced=advanceEpilogue(current,next);
  if(advanced===current)return;
  if(!test&&!epilogueStore.current?.advance(next))setSaveWarning(true);
  epilogueRef.current=advanced;setEpilogue(advanced);
  if(next==='complete')setMode('end');
 };

 const enterHouse=()=>{
  if(entering.current)return;
  entering.current=true;
  // Mantiene la clave histórica del rescate sincronizada con el nuevo
  // prólogo; la clave y los guardados del arcade original no se tocan.
  const events:RescueEvent[]=['heart','abduction','trail','house'];
  phaseRef.current=events.reduce(advanceRescue,phaseRef.current);
  if(!test)saveRescue(phaseRef.current);
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
    const checkpointStore=test?undefined:openRescueHouseSave();
    teardown=launchHouse(onExit,checkpoint,{
     demo:true,trial:test&&entry!=='garden',fieldTutorials:true,entry,
     checkpointStore,
     onRescue:()=>{
      if(cancelled||finishing.current)return;
      finishing.current=true;phaseRef.current=advanceRescue(phaseRef.current,'rescue');
      checkpointStore?.finish();
      // Only the existing successful 3D finish event can open the epilogue.
      // If storage is blocked or the lease is stale, keep this session playable
      // without overwriting the other tab's record.
      epilogueStore.current=test?undefined:openEpilogueSave();
      if(!test&&!epilogueStore.current)setSaveWarning(true);
      const next=epilogueStore.current?.state??{...EPILOGUE_START};
      epilogueRef.current=next;setEpilogue(next);setMode(next.stage==='complete'?'end':'epilogue');
     }
    });
   }catch(e){if(!cancelled)setError(String(e));}
  };
  void boot();
  return()=>{cancelled=true;teardown?.();};
 // Se lanza solo al cambiar de mundo, no cuando React actualiza el HUD.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[mode]);

 const reset=()=>{
  if(!test){resetRescue();resetPrologue();}
  phaseRef.current={...START};epilogueStore.current=undefined;epilogueRef.current={...EPILOGUE_START};setEpilogue(epilogueRef.current);
  entering.current=false;finishing.current=false;setSaveWarning(false);setError('');setMode('garden');
 };

 return <div className="rescue-demo" aria-label="Demo jugable de rescate">
  {mode==='garden'&&<GardenPrologue key={entry+(test?'-trial':'-story')}
   test={test} checkpoint={checkpointFor(entry)} onExit={onExit} onEnterHouse={enterHouse}/>}
  {mode==='epilogue'&&epilogue.stage!=='complete'&&<GardenEpilogue key={epilogue.stage} stage={epilogue.stage} onAdvance={completeEpilogue} onExit={onExit}/>}
  {mode==='end'&&<div className="rescue-transition rescue-final" data-epilogue-stage="complete">
   <span>♥ ✿ ♥</span><h1>Feliz cumpleaños, <em>Vale</em></h1>
   <p>Louis está a salvo. Emy, Kitty, Luis y Vale vuelven a estar juntos. Gracias por recorrer esta pequeña aventura.</p>
   <button onClick={onComplete}>{returnToUniverse?'Regresar al universo':'Volver a pruebas'}</button>
   <button className="secondary" onClick={()=>{if(test||window.confirm('¿Volver a jugar desde el principio? Se reiniciará el progreso del rescate.'))reset();}}>Volver a jugar</button>
  </div>}
  {saveWarning&&<p className="rescue-save-warning" role="status">Puedes continuar, pero el avance de esta sesión no pudo guardarse.</p>}
  {mode==='house'&&<div className="rescue-under-house" aria-live="polite">Exploración en primera persona</div>}
  {error&&<div className="rescue-error" role="alert">{error}<button onClick={onExit}>Volver</button></div>}
 </div>;
}
