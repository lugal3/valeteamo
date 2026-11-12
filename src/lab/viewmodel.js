import {CHIBI,chibiPiece,placePieces,torchModel,grippingPaw} from './chibi-model.js';
import {geometry} from './renderer.js';
import {notePieces,phonePieces,keyPieces} from './equipment.js';
import {curve,ease} from './animations/pose-tools.js';

export const BATTERY_SWAP_SECONDS=1.35;

// V4 View-Model configuration. Variant C (compact, clear reticle on mobile & desktop).
export const VIEWMODEL_CONFIG = Object.freeze({
 flashlight: Object.freeze({
  x: 0.38,
  y: -0.36,
  z: 1.10,
  scale: 0.72,
  tiltY: 0
 })
});
const noteGrip={x:.48,y:-.53,z:.92};

export function dustPieces(flash=true){
 return [0,1,2,3].map(i=>{
  const angle = i * 1.57;
  const rad = 0.04 + (i%2)*0.03;
  return chibiPiece('dust-'+i, Math.cos(angle)*rad, Math.sin(angle)*rad, 0.45 + i*0.18, flash?0.007:0.0001, flash?0.007:0.0001, flash?0.007:0.0001, [1,.96,.82], {segments:6,rings:3,emissive:flash});
 });
}

export function viewModelPieces(kind='flashlight', flash=true){
 if(kind==='phone')return placePieces(phonePieces(),{x:.37,y:-.25,z:.85,scale:1,prefix:'view-phone-'});
 if(kind==='note')return placePieces(notePieces(),{...noteGrip,prefix:'view-note-'});
 if(kind==='paper')return placePieces(notePieces(.9,false),{...noteGrip,prefix:'view-paper-'});
 if(kind==='key'||kind==='red-key')return placePieces(keyPieces(kind==='red-key'),{...noteGrip,prefix:'view-key-'});
 const cfg = VIEWMODEL_CONFIG[kind] || VIEWMODEL_CONFIG.flashlight;
 const base = [...torchModel(flash), ...grippingPaw(), ...dustPieces(flash)];
 return placePieces(base, {x: cfg.x, y: cfg.y, z: cfg.z, scale: cfg.scale, prefix: 'view-'});
}

const cache = {};
export function flashlightPieces(flash=true){
 return cache[flash?'on':'off'] ??= viewModelPieces('flashlight', flash);
}

function batterySwapPieces(){
 const cell=[
  chibiPiece('replacement-cell',0,0,-.145,.092,.092,.163,[.25,.39,.56],{joint:'cell',shape:'cylinder',segments:10}),
  chibiPiece('replacement-copper',0,0,-.072,.092,.092,.037,[.85,.52,.29],{joint:'cell',shape:'cylinder',segments:10}),
  chibiPiece('replacement-contact',0,0,-.052,.04,.04,.018,CHIBI.metal,{joint:'cell',shape:'cylinder',segments:8})
 ];
 const torch=torchModel(false).map(piece=>piece.id==='torch-end-cap'?{...piece,joint:'cap'}:piece);
 return placePieces([...torch,...grippingPaw(),...cell],{...VIEWMODEL_CONFIG.flashlight,prefix:'swap-'});
}

function animateBatterySwap(vertices,groups,offset,elapsed,reduced){
 const t=elapsed/BATTERY_SWAP_SECONDS;
 const opening=ease((t-.11)/.22)*ease((.95-t)/.19);
 const offsets={
  cap:[.15*opening,.076*opening,-.14*opening],
  cell:[
   curve([[0,0],[.32,0],[.47,-.18],[.52,-.24],[.61,-.06],[.78,0]],t),
   curve([[0,0],[.37,0],[.49,-.23],[.58,-.17],[.68,0]],t),
   curve([[0,0],[.30,0],[.45,-.28],[.57,-.31],[.76,0]],t)
  ]
 };
 for(const {joint,start,end} of groups){
  const displacement=offsets[joint];
  if(!displacement)continue;
  for(let i=start*16;i<end*16;i+=16){
   vertices[i]+=displacement[0];vertices[i+1]+=displacement[1];vertices[i+2]+=displacement[2];
  }
 }
 offset.x-=.10*opening;offset.y+=.115*opening;
 if(!reduced){offset.pitch+=.42*opening;offset.roll-=.64*opening;}
}

export function viewModelOffsets(time,motion={}){
 const act=Math.min(1,Math.max(0,motion.action||0)),click=Math.min(1,Math.max(0,motion.clickAction||0)),drop=(motion.crouched?-.040:0)+(motion.equipLift||0);
 if(motion.reduced)return {x:0,y:drop,z:0,pitch:0,roll:0};
 const speed=Math.max(0,Math.min(1.4,motion.speed||0)),weight=Math.max(0,Math.min(1,motion.walkWeight??1)),phase=motion.bob||0,brake=Math.max(-1,Math.min(1,motion.acceleration||0)),recoil=Math.sin(Math.PI*act)*.035;
 return {x:Math.cos(time*1.05)*.0012+Math.cos(phase*.5)*.007*speed*weight+(motion.swayX||0),
  y:Math.sin(time*2.1)*.0022+(1-Math.cos(phase*2))*.0045*speed*weight+(motion.swayY||0)-recoil*.35-Math.sin(Math.PI*click)*.015+drop,
  z:-recoil*.75-brake*.006,pitch:brake*.018+Math.sin(phase)*.006*weight,roll:Math.sin(phase*.5)*.009*weight};
}

export function drawViewModel(renderer, kind='flashlight', state={}){
 const {camera, right, up, forward, time=0, flash=true, motion={}} = state;
 const gl = renderer.gl;

 if(kind==='empty')return;
 const swapping=kind==='flashlight'&&Number.isFinite(motion.batterySwap);
 const cacheKey=swapping?'battery-swap':kind!=='flashlight'?kind:flash?'on':'off';
 const pieces=swapping?(cache[cacheKey]??=batterySwapPieces()):kind!=='flashlight'?(cache[kind]??=viewModelPieces(kind)):flashlightPieces(flash);
 const {vertices: base,indices,groups}=renderer.handGeometry[cacheKey]??=geometry(pieces);
 const vertices = (renderer.viewVertices??={})[cacheKey] ??= new Float32Array(base.length);
 vertices.set(base);

 const reduced = !!motion.reduced;

 // Smoothed actual speed and a small grip rotation settle naturally after a stop.
 const offset=viewModelOffsets(time,motion);
 if(swapping)animateBatterySwap(vertices,groups,offset,motion.batterySwap,reduced);
 const cp=Math.cos(offset.pitch),sp=Math.sin(offset.pitch),cr=Math.cos(offset.roll),sr=Math.sin(offset.roll);
 const grip=kind==='phone'?{x:.37,y:-.25,z:.85}:kind==='flashlight'?VIEWMODEL_CONFIG.flashlight:noteGrip;

 // Transform vertices into camera-oriented world space
 for(let i=0; i<vertices.length; i+=16){
  const px = vertices[i], py = vertices[i+1], pz = vertices[i+2];

  // Optional subtle dust mote floating in the flashlight beam near the front
  let dustDx = 0, dustDy = 0, dustDz = 0;
  if(flash && !reduced && pz > 1.35){
   const idx = i / 16;
   dustDx = Math.sin(time * 0.7 + idx) * 0.015;
   dustDy = Math.cos(time * 0.9 + idx) * 0.012;
   dustDz = Math.sin(time * 0.4 + idx * 0.5) * 0.020;
  }

  const lx=px-grip.x,ly=(py-grip.y)*cp-(pz-grip.z)*sp,lz=(py-grip.y)*sp+(pz-grip.z)*cp;
  const x=grip.x+lx*cr-ly*sr+offset.x+dustDx,y=grip.y+lx*sr+ly*cr+offset.y+dustDy,z=grip.z+lz+offset.z+dustDz;

  vertices[i]   = camera.x + x*right[0] + y*up[0] + z*forward[0];
  vertices[i+1] = camera.y + x*right[1] + y*up[1] + z*forward[1];
  vertices[i+2] = camera.z + x*right[2] + y*up[2] + z*forward[2];

  const baseNx=vertices[i+6],rotNy=vertices[i+7]*cp-vertices[i+8]*sp;
  const nx=baseNx*cr-rotNy*sr,ny=baseNx*sr+rotNy*cr,nz=vertices[i+7]*sp+vertices[i+8]*cp;
  vertices[i+6] = nx*right[0] + ny*up[0] + nz*forward[0];
  vertices[i+7] = nx*right[1] + ny*up[1] + nz*forward[1];
  vertices[i+8] = nx*right[2] + ny*up[2] + nz*forward[2];

  const baseTx=vertices[i+13],rotTy=vertices[i+14]*cp-vertices[i+15]*sp;
  const tx=baseTx*cr-rotTy*sr,ty=baseTx*sr+rotTy*cr,tz=vertices[i+14]*sp+vertices[i+15]*cp;
  vertices[i+13] = tx*right[0] + ty*up[0] + tz*forward[0];
  vertices[i+14] = tx*right[1] + ty*up[1] + tz*forward[1];
  vertices[i+15] = tx*right[2] + ty*up[2] + tz*forward[2];
 }

 gl.bindBuffer(gl.ARRAY_BUFFER, renderer.handVbo);
 gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderer.handIbo);
 if(renderer.handIndexKind !== cacheKey){
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  renderer.handIndexKind = cacheKey;
 }
 renderer.bind(renderer.handVbo, renderer.handIbo);
 gl.clear(gl.DEPTH_BUFFER_BIT);
 gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

