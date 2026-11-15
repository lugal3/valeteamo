const assert=require('node:assert/strict');
(async()=>{
 const {buildLoisPs2Model}=await import('../src/lab/lois-ps2-model.js');
 const {loisFacePoint,loisFaceSurface}=await import('../src/lab/lois-ps2-face.js');
 const {LOIS_VISUAL_ID,LOIS_PS2_PROFILE}=await import('../src/lab/lois-ps2-profile.js');
 const {louisModel,louisPartPose}=await import('../src/lab/louis-escape.js');
 const {pickupGeometry,geometry}=await import('../src/lab/renderer.js');
 const piece=(id,x,y,z,w,h,d,mat,extra={})=>({id,x,y,z,w,h,d,mat,...extra,dynamic:true,solid:false});
 const old=louisModel(piece);
 assert(old.some(part=>part.id==='nose-tip')&&old.some(part=>part.id==='beard-chin'),'legacy fallback preserved');
 const actor={kind:'louis-companion',id:'louis-escape',label:'Louis rescatado',visualPreset:LOIS_VISUAL_ID,
  x:0,y:0,z:0,yaw:0,phase:'follow',age:0,walk:0,speed:0,crouch:0,blink:0};
 const sample={...actor};
 const newBoxes=pickupGeometry([actor]);
 const oldBoxes=pickupGeometry([{...actor,visualVariant:'legacy'}]);
 assert(newBoxes.length>35&&oldBoxes.length>50,'both model variants contain a complete body');
 assert(newBoxes.some(part=>part.shape==='lois-face'),'actor preset selects the sculpted face');
 assert(oldBoxes.some(part=>part.id==='pickup-louis-escape-nose-tip'),'reversible explicit fallback exists');
 assert(!newBoxes.some(part=>part.id.endsWith('-nose-tip')),'nose is part of a single head mesh, not a layered ball');
 assert(newBoxes.some(part=>part.id.endsWith('-lapel--1')),'tailored blazer has distinct lapels');
 assert(newBoxes.some(part=>part.id.endsWith('-fringe-4')),'asymmetrical swept hair preserved');
 assert(newBoxes.some(part=>part.id.endsWith('-iris--1')),'both blue irises retained');
 const face=newBoxes.find(part=>part.shape==='lois-face');
 assert.equal(newBoxes.filter(part=>part.shape==='lois-face').length,1,'one continuous facial surface');
 const front=loisFacePoint(face,.5,.45),lateral=loisFacePoint(face,.75,.45);
 assert(front.every(Number.isFinite)&&lateral.every(Number.isFinite));
 const bridge=loisFacePoint(face,.5,.47),chin=loisFacePoint(face,.5,.20);
 assert(bridge[2]>face.z+face.d*.5,'nose bridge protrudes from the same continuous mesh');
 assert(chin[0]===face.x,'chin sits on the face centerline');
 const surf=loisFaceSurface(face,face.color,9);
 assert.equal(surf.vertices.length%16,0);
 assert.equal(surf.indices.length%3,0);
 assert(surf.vertices.every(Number.isFinite)&&surf.indices.every(Number.isFinite));
 assert.equal(surf.indices.length/3,2*face.segments*face.rings);
 for(let i=0;i<surf.vertices.length;i+=16){
  const n=surf.vertices.slice(i+6,i+9),t=surf.vertices.slice(i+13,i+16);
  assert(Math.abs(Math.hypot(...n)-1)<.005,'head smooth normals normalized');
  assert(Math.abs(Math.hypot(...t)-1)<.005,'head UV tangents normalized');
  assert(surf.vertices[i+9]>=0&&surf.vertices[i+9]<=1,'valid face UV U');
  assert(surf.vertices[i+10]>=0&&surf.vertices[i+10]<=1,'valid face UV V');
 }
 const steps=[
  {phase:'untying',age:1.2,walk:0,speed:0,crouch:.33,blink:0},
  {phase:'climb',age:1.7,walk:1.2,speed:2,crouch:0,blink:.7},
  {phase:'hide',age:.4,walk:0,speed:0,crouch:.6,blink:0},
  {phase:'hidden',age:1,walk:0,speed:0,crouch:1,blink:1},
  {phase:'follow',age:1.1,walk:1,speed:2,crouch:0,blink:0}
 ];
 for(const p of newBoxes){
  for(const state of steps){
   const pose=louisPartPose({...sample,...state},p,p.sourceOffset,false);
   assert([pose.x,pose.y,pose.z,pose.yaw,pose.roll,pose.pitch,pose.eyeScale].every(Number.isFinite),p.id+' finite pose');
  }
 }
 for(const quality of ['mobile','desktop']){
  const boxes=buildLoisPs2Model(piece,{quality});
  const mesh=geometry(boxes);
  const triangles=mesh.indices.length/3,verts=mesh.vertices.length/16;
  const budget=LOIS_PS2_PROFILE.meshLimits[quality+'Triangles'];
  assert(triangles<=budget,quality+' triangle budget '+triangles+' > '+budget);
  assert(verts<65535,'WebGL1 16-bit vertex range');
  assert(mesh.indices.every(i=>i<verts),'indices in allocated mesh');
  assert(mesh.vertices.every(Number.isFinite),'no NaNs in 3D mesh');
  console.log('PASS mesh',JSON.stringify({quality,parts:boxes.length,triangles,vertices:verts,headTriangles:2*boxes.find(p=>p.id==='face').segments*boxes.find(p=>p.id==='face').rings}));
 }
 // Still no photo assets, skinning or new WebGL loops in phase 2.
 console.log('PASS: reversible option B/legacy selection, unified 3D face, hair and blazer, finite poses in all rescue phases.');
})().catch(e=>{console.error(e);process.exitCode=1;});
