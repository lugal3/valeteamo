// Phase 5 - stage directions are camera-only. No movement/physics changes,
// no new story triggers, and no second animation loop.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
const ease=t=>{const x=clamp(t,0,1);return x*x*(3-2*x)};
const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const CAMERA_KEYS=['x','y','z','yaw','pitch'];
const safeView=(view,otherwise=null)=>{
 if(!view||CAMERA_KEYS.some(k=>!Number.isFinite(view[k])))return otherwise?{...otherwise}:null;
 return Object.fromEntries(CAMERA_KEYS.map(k=>[k,view[k]]));
};
function blend(a,b,t){
 const v={};
 for(const k of CAMERA_KEYS)v[k]=k==='yaw'?a[k]+angleDelta(a[k],b[k])*t:a[k]+(b[k]-a[k])*t;
 return v;
}
export const LOIS_SCENE_TIMING=Object.freeze({
 untying:.12,climb:.64,hide:.78,hidden:.60,follow:.58,return:.64
});
export function createLoisShotDirector(){
 return {phase:null,from:null,view:null,elapsed:0,returnElapsed:0,returnFrom:null,returning:false};
}
export function advanceLoisShot(director,phase,target,delta=0,reduced=false){
 if(!director)return safeView(target);
 const desired=safeView(target,director.view);
 if(!desired)return null;
 if(director.phase!==phase){
  // Start the first shot at a safe hand-placed camera, not by flying through
  // a wall from Kitty's gameplay camera.
  director.from=director.view?{...director.view}:{...desired};
  director.phase=phase;
  director.elapsed=0;
  director.returning=false;director.returnFrom=null;
 }
 director.elapsed+=clamp(delta,0,.12);
 const duration=LOIS_SCENE_TIMING[phase]??.5;
 const progress=reduced?1:ease(director.elapsed/duration);
 director.view=blend(director.from,desired,progress);
 return {...director.view};
}
export function finishLoisShot(director,target,delta=0,reduced=false){
 const desired=safeView(target);
 if(!desired)return {view:null,complete:true};
 if(!director||!director.view||reduced)return {view:desired,complete:true};
 if(!director.returning){
  director.returning=true;director.returnElapsed=0;director.returnFrom={...director.view};
 }
 director.returnElapsed+=clamp(delta,0,.12);
 const progress=ease(director.returnElapsed/LOIS_SCENE_TIMING.return);
 director.view=blend(director.returnFrom,desired,progress);
 return {view:{...director.view},complete:progress>=1};
}
export function loisShotLabel(phase){
 return ({untying:'Desatar cuerdas',climb:'Subida del sótano',
  hide:'Cocina americana',hidden:'Tras la barra',follow:'Siguiendo a Kitty'})[phase]||'';
}
