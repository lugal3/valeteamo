// Development-only adapter. Production never imports candidate data.
import {installEmyModel,poseEmy} from '../emy-cat.js';
import {sculptSurface} from '../emy-sculpt.js';
import {emySurface,writeEmySurface} from '../emy-surface.js';
import {candidateFace} from './face-anatomy.js';
export const poses=['idle','walk','sit','groom','stretch','sleep','purr','alert','crouch','jump'];
export function reviewCat(variant='original',low=false){
 const add=(id,x,y,z,w,h,d,material,solid,extra)=>({id,x,y,z,w,h,d,material,solid,...extra});
 const cat={parts:installEmyModel(add,{hidden:low}),x:0,y:0,z:0,yaw:0,age:.7};
 if(variant!=='original'){
  const box=cat.parts.find(p=>p.id==='head').box;
  box.emyMesh=sculptSurface(box.emySpec,candidateFace(box.emySpec.asset,variant));
 }
 return cat;
}
export function sampleReview(cat,{mode='idle',phase=.7,alarm=0,blink=false,headYaw=0}={}){
 Object.assign(cat,{age:blink?4.5:phase,alarm,earTurn:alarm*.45,earFlatten:alarm*.5,lastFootRoot:null,footContacts:null,walkTravel:phase*.55});
 poseEmy(cat,{mode,phase,walking:mode==='walk',reduced:false,headYaw,blend:1});
 const parts=cat.parts.map(({id,box})=>{
  const mesh=box.emyTailMesh||emySurface(box),vertices=new Float32Array(mesh.vertices.length);
  writeEmySurface(vertices,0,box);return {id,vertices,indices:mesh.indices};
 });
 const count=parts.reduce((a,p)=>a+p.vertices.length/16,0),indexCount=parts.reduce((a,p)=>a+p.indices.length,0);
 if(count>65530)throw Error('WebGL1 index budget');
 const vertices=new Float32Array(count*16),indices=new Uint16Array(indexCount);
 let at=0,ii=0;
 for(const p of parts){vertices.set(p.vertices,at*16);for(const i of p.indices)indices[ii++]=i+at;at+=p.vertices.length/16;}
 return {parts,vertices,indices,count,triangles:indexCount/3,head:cat.landmarks.head};
}
