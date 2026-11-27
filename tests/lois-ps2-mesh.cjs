// Regression: there is exactly one shipped 3D Louis, the approved Photo-A.
const assert=require('node:assert/strict');
(async()=>{
 const {buildLoisPs2Model}=await import('../src/lab/lois-ps2-model.js');
 const {loisFacePoint,loisFaceSurface,loisPhotoFaceUV}=await import('../src/lab/lois-ps2-face.js');
 const fs=require('node:fs'),shader=fs.readFileSync('src/lab/material-shaders.js','utf8');
 assert(shader.includes('bool photoLois')&&shader.includes('if(!photoLois && uOcclude')&&!shader.includes('vec3(.88,.84,.82)'),'Matte photograph follows environmental light');
 assert.deepEqual(loisPhotoFaceUV(0,1.656,-1,0),loisPhotoFaceUV(0,1.656,-1),'Rear UV unchanged');
 const {LOIS_VISUAL_ID,LOIS_PS2_PROFILE}=await import('../src/lab/lois-ps2-profile.js');
 const {louisModel}=await import('../src/lab/louis-escape.js');
 const {pickupGeometry,geometry}=await import('../src/lab/renderer.js');
 const piece=(id,x,y,z,w,h,d,mat,extra={})=>({id,x,y,z,w,h,d,mat,...extra,dynamic:true,solid:false});
 const actor={kind:'louis-companion',id:'louis-escape',visualPreset:LOIS_VISUAL_ID,
  x:0,y:0,z:0,yaw:0,phase:'follow',age:0,walk:0,speed:0,crouch:0,blink:0};
 const expected=louisModel(piece);
 assert(expected.some(p=>p.id==='face'&&p.photoMapped),'single photographic face is mandatory');
 assert(!expected.some(p=>p.id==='nose-tip'||p.id.startsWith('iris-')),'illustrated face primitives removed');
 const newBoxes=pickupGeometry([actor]);
 assert(newBoxes.length>20&&newBoxes.every(p=>p.rigBone));
 for(const legacy of ['legacy','ps2-b','unknown']){
  const restored=pickupGeometry([{...actor,visualVariant:legacy}]);
  assert.equal(restored.length,newBoxes.length,'stale saved variant cannot load old model');
  assert(restored.some(p=>p.shape==='lois-face'&&p.photoMapped),'legacy never reappears');
 }
 for(const quality of ['mobile','desktop']){
  const boxes=buildLoisPs2Model(piece,{quality,photoMode:true});
  const mesh=geometry(boxes),tris=mesh.indices.length/3,verts=mesh.vertices.length/16;
  assert(tris<=LOIS_PS2_PROFILE.meshLimits[quality+'Triangles'],'triangle budget exceeded');
  assert(verts<65535&&mesh.indices.every(i=>i<verts),'WebGL1 index budget');
  assert(mesh.vertices.every(Number.isFinite),'finite photographic mesh');
  const face=boxes.find(p=>p.id==='face');
  const surf=loisFaceSurface(face,face.color,9);
  assert.equal(surf.indices.length/3,2*face.segments*face.rings);
  assert(loisFacePoint(face,.5,.48).every(Number.isFinite),'finite sculpted face');
  console.log('PASS single-photo mesh',JSON.stringify({quality,parts:boxes.length,triangles:tris,vertices:verts}));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
