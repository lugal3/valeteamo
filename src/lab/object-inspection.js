import {geometry} from './renderer.js';
import {pickupGeometry} from './pickup-models.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const INSPECTABLE_KINDS=Object.freeze(['note','key','battery','flashlight','screwdriver','rc-car']);
export function inspectionMesh(object){
 // The mirrored clue has its own existing paper/mirror interaction. Do not
 // generate an independently rotatable readable copy of its digits.
 if(!object||object.mirrored||!INSPECTABLE_KINDS.includes(object.kind))return null;
 const source={...object,x:0,y:0,z:0,taken:false,concealed:false,mode:object.kind==='rc-car'?'packed':object.mode};
 const parts=pickupGeometry([source]);if(!parts.length)return null;
 return geometry(parts);
}
export function inspectionBounds(vertices){
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<vertices.length;i+=16)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],vertices[i+k]);hi[k]=Math.max(hi[k],vertices[i+k]);}
 const center=lo.map((v,i)=>(v+hi[i])*.5);
 let radius=.001;
 for(let i=0;i<vertices.length;i+=16)radius=Math.max(radius,Math.hypot(vertices[i]-center[0],vertices[i+1]-center[1],vertices[i+2]-center[2]));
 return {center,radius};
}
export const inspectionDefault=()=>({yaw:-.34,pitch:1.04,zoom:1});
export function changeInspection(view,{dx=0,dy=0,ratio=1}={}){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||!Number.isFinite(ratio)||ratio<=0)return {...view};
 const yaw=view.yaw+dx*.012;
 return {yaw:Math.atan2(Math.sin(yaw),Math.cos(yaw)),pitch:clamp(view.pitch+dy*.012,-Math.PI,Math.PI),zoom:clamp(view.zoom*ratio,.75,1.65)};
}
// A small CPU-rendered preview of the existing mesh. No second WebGL context,
// animated world renderer, duplicated asset, or continuous preview render loop.
export function projectInspection(mesh,bounds,view,width,height){
 const {vertices,indices}=mesh,{center,radius}=bounds;
 const cy=Math.cos(view.yaw),sy=Math.sin(view.yaw),cp=Math.cos(view.pitch),sp=Math.sin(view.pitch);
 const scale=Math.min(width,height)*.39*view.zoom/radius;
 const pts=new Float32Array(vertices.length/16*3);
 for(let i=0,j=0;i<vertices.length;i+=16,j+=3){
  const x=vertices[i]-center[0],y=vertices[i+1]-center[1],z=vertices[i+2]-center[2];
  const xx=x*cy+z*sy,zz=z*cy-x*sy,yy=y*cp-zz*sp,depth=y*sp+zz*cp;
  pts[j]=width*.5+xx*scale;pts[j+1]=height*.5-yy*scale;pts[j+2]=depth;
 }
 const faces=[];
 for(let i=0;i<indices.length;i+=3){
  const ia=indices[i],ib=indices[i+1],ic=indices[i+2],a=ia*3,b=ib*3,c=ic*3;
  const ux=pts[b]-pts[a],uy=pts[b+1]-pts[a+1],uz=(pts[b+2]-pts[a+2])*scale;
  const vx=pts[c]-pts[a],vy=pts[c+1]-pts[a+1],vz=(pts[c+2]-pts[a+2])*scale;
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  if(Math.abs(nz)<.005)continue;
  const norm=Math.hypot(nx,ny,nz)||1,shade=.50+.48*Math.abs((nx*-.28+ny*-.50+nz*.82)/norm);
  const color=[3,4,5].map(k=>Math.round(clamp((vertices[ia*16+k]+vertices[ib*16+k]+vertices[ic*16+k])/3*shade*255,0,255)));
  faces.push({a,b,c,z:(pts[a+2]+pts[b+2]+pts[c+2])/3,color});
 }
 faces.sort((a,b)=>a.z-b.z);return {pts,faces};
}
export function inspectionHTML(touch=false){
 return '<section class="inspect-object"><canvas class="inspect-preview" tabindex="0" aria-label="Modelo del objeto. Flechas para girar; más y menos para acercar."></canvas><div class="inspect-toolbar"><button type="button" data-inspect="out" aria-label="Alejar">−</button><button type="button" data-inspect="reset">Centrar</button><button type="button" data-inspect="in" aria-label="Acercar">+</button></div><p class="inspect-hint">'+(touch?'Arrastra para girar · pellizca para acercar':'Arrastra para girar · rueda para acercar')+'</p></section>';
}
export function mountInspection(host,mesh){
 const canvas=host.querySelector('.inspect-preview'),ctx=canvas?.getContext('2d');if(!ctx||!mesh)return null;
 const bounds=inspectionBounds(mesh.vertices),controller=new AbortController(),{signal}=controller;
 let view=inspectionDefault(),frame=0,dead=false;const pointers=new Map();
 function draw(){
  frame=0;if(dead||!canvas.isConnected)return;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  ctx.clearRect(0,0,w,h);
  const {pts,faces}=projectInspection(mesh,bounds,view,w,h);
  for(const {a,b,c,color} of faces){
   ctx.fillStyle='rgb('+color.join(',')+')';ctx.beginPath();ctx.moveTo(pts[a],pts[a+1]);ctx.lineTo(pts[b],pts[b+1]);ctx.lineTo(pts[c],pts[c+1]);ctx.closePath();ctx.fill();
  }
 }
 function schedule(){if(!frame&&!dead)frame=requestAnimationFrame(draw);}
 function adjust(change){view=changeInspection(view,change);schedule();}
 function distance(){const [a,b]=pointers.values();return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;}
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0||pointers.size>=2)return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});try{canvas.setPointerCapture(e.pointerId);}catch{}},{signal});
 canvas.addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;const before=distance();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const after=distance();if(pointers.size===2){if(before>8&&after>8)adjust({ratio:after/before});}else adjust({dx:e.clientX-old.x,dy:e.clientY-old.y});},{signal});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>pointers.delete(e.pointerId),{signal});
 canvas.addEventListener('wheel',e=>{e.preventDefault();adjust({ratio:Math.exp(clamp(-e.deltaY*.001,-.24,.24))});},{signal,passive:false});
 canvas.addEventListener('keydown',e=>{
  const change={ArrowLeft:{dx:-12},ArrowRight:{dx:12},ArrowUp:{dy:-12},ArrowDown:{dy:12},'+':{ratio:1.12},'=':{ratio:1.12},'-':{ratio:1/1.12}}[e.key];
  if(change){e.preventDefault();e.stopPropagation();adjust(change);}
 },{signal});
 host.addEventListener('click',e=>{const action=e.target.closest('[data-inspect]')?.dataset.inspect;if(!action)return;if(action==='reset'){view=inspectionDefault();schedule();}else adjust({ratio:action==='in'?1.15:1/1.15});},{signal});
 const resize=typeof ResizeObserver!=='undefined'?new ResizeObserver(schedule):null;resize?.observe(canvas);window.addEventListener('resize',schedule,{signal});
 window.addEventListener('blur',()=>pointers.clear(),{signal});
 draw();
 return {snapshot:()=>({...view,pointers:pointers.size,triangles:mesh.indices.length/3}),dispose(){dead=true;controller.abort();resize?.disconnect();if(frame)cancelAnimationFrame(frame);pointers.clear();}};
}
