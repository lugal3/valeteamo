import {useEffect,useRef,useState} from 'react';
import {GardenPrologue,type PrologueCheckpoint} from './GardenPrologue';
import {resetPrologue} from './prologue-story.js';
import {START,advanceRescue,loadRescue,saveRescue,resetRescue,openRescueHouseSave,type RescueState} from './progression.js';
import '../lab/lab.css';
import './rescue.css';

type Entry='garden'|'abduction'|'trail'|'house'|'drawer'|'lock'|'rescue'|'mirror';
type RescueEvent='heart'|'abduction'|'trail'|'house'|'rescue';

// Los checkpoints antiguos siguen disponibles para las pruebas. Todos los
// tramos jugables 2D usan el mismo prólogo isométrico (no otra escena plana).
const initial=(entry:Entry,test:boolean):RescueState=>{
 if(entry==='garden')return test?{...START}:loadRescue();
 if(!test)return loadRescue();
 let s={...START};
 s=advanceRescue(s,'heart');
 if(entry!=='abduction')s=advanceRescue(s,'abduction');
 if(['trail','house','drawer','lock','rescue','mirror'].includes(entry))s=advanceRescue(s,'trail');
 if(['house','drawer','lock','rescue','mirror'].includes(entry))s=advanceRescue(s,'house');
 return s;
};

const checkpointFor=(entry:Entry):PrologueCheckpoint=>
 entry==='abduction'?'walk-together':entry==='trail'?'ribbon':'intro';

export function RescueDemo({onExit,entry='garden',test=false}:{onExit:()=>void;entry?:Entry;test?:boolean}){
 const [progress]=useState(()=>initial(entry,test));
 const [mode,setMode]=useState<'garden'|'house'|'end'>(progress.rescued?'end':progress.house?'house':'garden');
 const [error,setError]=useState('');
 const phaseRef=useRef(progress),entering=useRef(false);

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
     demo:true,trial:test&&entry!=='garden',entry,
     checkpointStore,
     onRescue:()=>{checkpointStore?.finish();setMode('end');}
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
  phaseRef.current={...START};
  entering.current=false;setError('');setMode('garden');
 };

 return <div className="rescue-demo" aria-label="Demo jugable de rescate">
  {mode==='garden'&&<GardenPrologue key={entry+(test?'-trial':'-story')}
   test={test} checkpoint={checkpointFor(entry)} onExit={onExit} onEnterHouse={enterHouse}/>}
  {mode==='end'&&<div className="rescue-transition">
   <span>♥ ✿ ♥</span><h1>¡Louis está a salvo!</h1>
   <p>Has seguido las pistas, abierto la habitación y completado la aventura. El jardín vuelve a brillar.</p>
   <button onClick={reset}>Volver a jugar</button>
   <button className="secondary" onClick={onExit}>Regresar a Feliz cumpleaños</button>
  </div>}
  {mode==='house'&&<div className="rescue-under-house" aria-live="polite">Exploración en primera persona</div>}
  {error&&<div className="rescue-error" role="alert">{error}<button onClick={onExit}>Volver</button></div>}
 </div>;
}
