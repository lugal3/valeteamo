import {Component,type ErrorInfo,type ReactNode} from 'react';

// Every route shares this recovery path, including the cosmic previews, 2D
// rescue and 3D house. Safari may retain an old entry bundle after a Firebase
// release while the corresponding lazy scene chunk is no longer deployed.
const staleModule=/dynamically imported module|importing a module script failed|failed to fetch|load failed|loading chunk|chunkloaderror|expected a javascript module script|mime type.*text\/html|unable to load.*module/i;
const getMessage=(cause:unknown):string=>{
 if(cause instanceof Error)return cause.message;
 if(typeof cause==='string')return cause;
 if(cause&&typeof cause==='object'&&'message'in cause)return String((cause as {message:unknown}).message);
 return String(cause??'');
};
export const isSceneModuleError=(error:unknown)=>staleModule.test(getMessage(error));

export function forceFreshSceneReload(){
 const url=new URL(window.location.href);
 url.searchParams.delete('_sceneRetry');
 url.searchParams.set('_sceneFresh',Date.now().toString(36));
 window.location.replace(url.href);
}

// Automatic recovery happens at most once. The query marker is used alongside
// normal no-store HTML headers so private browsing / blocked sessionStorage
// cannot cause a reload loop. Gameplay data in localStorage is never touched.
export function retrySceneBundleOnce():boolean{
 const url=new URL(window.location.href);
 if(url.searchParams.has('_sceneRetry'))return false;
 url.searchParams.set('_sceneRetry','1');
 url.searchParams.set('_sceneFresh',Date.now().toString(36));
 window.location.replace(url.href);
 return true;
}
function showGlobalRecovery(){
 if(document.getElementById('vale-crash-recovery'))return;
 const card=document.createElement('section');
 card.id='vale-crash-recovery';
 card.setAttribute('role','alert');
 card.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#240e1c;color:#f8ebf1;padding:28px;box-sizing:border-box;font:16px/1.5 system-ui,sans-serif;text-align:center;';
 const inner=document.createElement('div');
 inner.style.cssText='max-width:450px;width:100%;padding:28px;border:1px solid #70516a;border-radius:18px;background:#2f1c2b;';
 const heading=document.createElement('h1');heading.textContent='No se pudo cargar esta escena';heading.style.cssText='font-size:24px;margin:0 0 12px;';
 const description=document.createElement('p');description.textContent='Safari puede tener archivos de una versión anterior. Puedes actualizar sin perder tus partidas ni recuerdos.';
 const action=document.createElement('button');action.type='button';action.textContent='Actualizar la aplicación';action.style.cssText='font:inherit;padding:12px 18px;border:0;border-radius:10px;background:#f3bcd9;color:#291523;font-weight:700;';
 action.addEventListener('click',forceFreshSceneReload);
 inner.append(heading,description,action);card.appendChild(inner);document.body.appendChild(card);
}
let recoveryInstalled=false;
export function installSceneRecovery(){
 if(recoveryInstalled||typeof window==='undefined')return;
 recoveryInstalled=true;
 const handle=(error:unknown)=>{
  if(!isSceneModuleError(error))return;
  if(!retrySceneBundleOnce())showGlobalRecovery();
 };
 window.addEventListener('vite:preloadError',event=>{
  // Vite only emits this for a failed hashed JS/CSS dependency. WebKit uses
  // a generic "Load failed" error that Chromium's patterns do not cover.
  event.preventDefault();
  if(!retrySceneBundleOnce())showGlobalRecovery();
 });
 window.addEventListener('unhandledrejection',event=>{
  if(isSceneModuleError(event.reason)){event.preventDefault();handle(event.reason);}
 });
 window.addEventListener('error',event=>{
  if(isSceneModuleError(event.error??event.message))handle(event.error??event.message);
 });
}

type State={error:Error|null};
export class SceneRecoveryBoundary extends Component<{children:ReactNode},State>{
 state:State={error:null};
 static getDerivedStateFromError(error:Error):State{return {error};}
 componentDidCatch(error:Error,_info:ErrorInfo){
  console.error('[ValeTeAmo] Error al abrir una escena:',error);
  // WebKit may surface a missing lazy module as a React-internal
  // "undefined is not an object (evaluating 'd._result.default')" rather
  // than "Load failed". An uncaught render error would otherwise unmount
  // the entire game. Retry the document once, regardless of wording.
  retrySceneBundleOnce();
 }
 render(){
  if(!this.state.error)return this.props.children;
  return <main data-scene-recovery role="alert" style={{
   background:'#240e1c',color:'#f8ebf1',minHeight:'100dvh',padding:'24px',
   display:'grid',placeItems:'center',fontFamily:'system-ui, sans-serif'
  }}>
   <section style={{maxWidth:460,width:'100%',textAlign:'center',padding:24,border:'1px solid #70516a',borderRadius:18,background:'#2f1c2b'}}>
    <h1 style={{fontSize:24}}>No se pudo abrir esta escena</h1>
    <p>La aplicación encontró un problema al cargar. Puedes actualizar sin borrar el avance del juego.</p>
    <button type="button" onClick={forceFreshSceneReload} style={{
     padding:'12px 18px',background:'#f3bcd9',color:'#291523',border:0,
     borderRadius:10,fontWeight:700,fontSize:16
    }}>Actualizar sin perder mi partida</button>
    <p style={{fontSize:12,opacity:.8}}>Si vuelve a ocurrir, envíanos una captura de esta pantalla.</p>
   </section>
  </main>;
 }
}
