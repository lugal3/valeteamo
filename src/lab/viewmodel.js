import {chibiPiece,placePieces,torchModel,grippingPaw} from './chibi-model.js';
import {geometry} from './renderer.js';
import {phonePieces} from './equipment.js';

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

export function dustPieces(flash=true){
 return [0,1,2,3].map(i=>{
  const angle = i * 1.57;
  const rad = 0.04 + (i%2)*0.03;
  return chibiPiece('dust-'+i, Math.cos(angle)*rad, Math.sin(angle)*rad, 0.45 + i*0.18, flash?0.007:0.0001, flash?0.007:0.0001, flash?0.007:0.0001, [1,.96,.82], {segments:6,rings:3,emissive:flash});
 });
}

export function viewModelPieces(kind='flashlight', flash=true){
 if(kind==='phone')return placePieces(phonePieces(),{x:.37,y:-.25,z:.85,scale:1,prefix:'view-phone-'});
 const cfg = VIEWMODEL_CONFIG[kind] || VIEWMODEL_CONFIG.flashlight;
 const base = [...torchModel(flash), ...grippingPaw(), ...dustPieces(flash)];
 return placePieces(base, {x: cfg.x, y: cfg.y, z: cfg.z, scale: cfg.scale, prefix: 'view-'});
}

const cache = {};
export function flashlightPieces(flash=true){
 return cache[flash?'on':'off'] ??= viewModelPieces('flashlight', flash);
}

export function drawViewModel(renderer, kind='flashlight', state={}){
 const {camera, right, up, forward, time=0, flash=true, motion={}} = state;
 const gl = renderer.gl;

 if(kind==='empty')return;
 const cacheKey=kind==='phone'?'phone':flash?'on':'off';
 const pieces = kind==='phone'?(cache.phone??=viewModelPieces('phone')):flashlightPieces(flash);
 const {vertices: base, indices} = renderer.handGeometry[cacheKey] ??= geometry(pieces);
 const vertices = (renderer.viewVertices??={})[cacheKey] ??= new Float32Array(base.length);
 vertices.set(base);

 const reduced = !!motion.reduced;

 // 1. Breathing: gentle continuous rhythm
 const breathY = reduced ? 0 : Math.sin(time * 2.1) * 0.0022;
 const breathX = reduced ? 0 : Math.cos(time * 1.05) * 0.0012;

 // 2. Walking bob & sway: scaled by movement speed
 const speed = motion.speed !== undefined ? Math.min(1.4, motion.speed) : (motion.bob ? 1 : 0);
 const walkBobY = reduced ? 0 : Math.abs(Math.sin(motion.bob || 0)) * 0.009 * speed;
 const walkSwayX = reduced ? 0 : Math.cos((motion.bob || 0) * 0.5) * 0.007 * speed;

 // 3. Turning inertia with damped spring
 const driftX = reduced ? 0 : (motion.swayX || 0);
 const driftY = reduced ? 0 : (motion.swayY || 0);

 // 4. Recoil on interaction
 const act = Math.min(1, Math.max(0, motion.action || 0));
 const recoil = reduced ? 0 : Math.sin(Math.PI * act) * 0.035;

 // 5. Tactile click dip on flashlight toggle
 const clk = Math.min(1, Math.max(0, motion.clickAction || 0));
 const clickJolt = reduced ? 0 : Math.sin(Math.PI * clk) * 0.015;

 // 6. Lowering when crouched
 const crouchDrop = motion.crouched ? -0.040 : 0;

 const totalOffsetX = breathX + walkSwayX + driftX;
 const totalOffsetY = breathY + walkBobY + driftY - recoil * 0.35 - clickJolt + crouchDrop + (motion.equipLift||0);
 const totalOffsetZ = -recoil * 0.75;

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

  const x = px + totalOffsetX + dustDx;
  const y = py + totalOffsetY + dustDy;
  const z = pz + totalOffsetZ + dustDz;

  vertices[i]   = camera.x + x*right[0] + y*up[0] + z*forward[0];
  vertices[i+1] = camera.y + x*right[1] + y*up[1] + z*forward[1];
  vertices[i+2] = camera.z + x*right[2] + y*up[2] + z*forward[2];

  const nx = vertices[i+6], ny = vertices[i+7], nz = vertices[i+8];
  vertices[i+6] = nx*right[0] + ny*up[0] + nz*forward[0];
  vertices[i+7] = nx*right[1] + ny*up[1] + nz*forward[1];
  vertices[i+8] = nx*right[2] + ny*up[2] + nz*forward[2];

  const tx = vertices[i+13], ty = vertices[i+14], tz = vertices[i+15];
  vertices[i+13] = tx*right[0] + ty*up[0] + tz*forward[0];
  vertices[i+14] = tx*right[1] + ty*up[1] + tz*forward[1];
  vertices[i+15] = tx*right[2] + ty*up[2] + tz*forward[2];
 }

 gl.bindBuffer(gl.ARRAY_BUFFER, renderer.handVbo);
 gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderer.handIbo);
 if(renderer.handIndexKind !== kind){
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  renderer.handIndexKind = kind;
 }
 renderer.bind(renderer.handVbo, renderer.handIbo);
 gl.clear(gl.DEPTH_BUFFER_BIT);
 gl.uniform1f(renderer.uniform.uFlash, 0);
 gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

