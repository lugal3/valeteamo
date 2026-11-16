// Fase A: anatomical Photo-A head, same atlas/rig with extra geometry only
// around cheek, jaw, chin and rear cranium; no per-frame re-tessellation.
const assert=require('node:assert/strict');
(async()=>{
 const {loisFacePoint,loisFaceSurface}=await import('../src/lab/lois-ps2-face.js');
 const {buildLoisPs2Model}=await import('../src/lab/lois-ps2-model.js');
 const {geometry,pickupGeometry}=await import('../src/lab/renderer.js');
 const {LOIS_VISUAL_ID}=await import('../src/lab/lois-ps2-profile.js');
 const make=(id,x,y,z,w,h,d,mat,props={})=>({id,x,y,z,w,h,d,mat,...props,solid:false,dynamic:true});
 const photo=buildLoisPs2Model(make),face=photo.find(x=>x.id==='face'),neck=photo.find(x=>x.id==='neck');
 assert(face&&face.photoMapped&&face.segments>=28&&face.rings>=18,
  'mobile mesh has enough rings for smooth mandible/cheek curvature');
 assert(neck?.shape==='lois-neck-lowpoly','same tapered neck and rig');
 const baseline={...face,photoMapped:false};
 const xJaw=Math.abs(loisFacePoint(face,.75,.32)[0]-face.x);
 const xOld=Math.abs(loisFacePoint(baseline,.75,.32)[0]-face.x);
 assert(xJaw>xOld+.002,'mandibular side is fuller than the old oval silhouette');
 const v=.27,front=loisFacePoint(face,.5,v);
 const ellipseDepth=face.z+Math.cos((v-.5)*Math.PI)*face.d/2;
 assert(front[2]>ellipseDepth+.008,'chin has an actual supported shelf below the mouth');
 const back=loisFacePoint(face,0,.5);
 assert(back[2]<face.z-face.d*.5-.01,
  'rear cranial volume extends beyond a round photo-projection sphere');
 const southern=loisFacePoint(face,.5,0);
 assert(Math.abs(southern[1]-(face.y-face.h*.5))<1e-8,
  'chin lower pole stays attached to existing rig height');
 assert(neck.y+neck.h*.5>southern[1]+.07,
  'upper neck overlaps and supports lower jaw without a floating gap');
 const mesh=loisFaceSurface(face,face.color,9);
 assert.equal(mesh.indices.length/3,face.segments*face.rings*2,
  'only intentional new face triangles; no secondary facial shells');
 assert(mesh.vertices.length/16<(face.segments+2)*(face.rings+2));
 for(let k=0;k<mesh.vertices.length;k+=16){
  const v=mesh.vertices,normal=[v[k+6],v[k+7],v[k+8]];
  assert(normal.every(Number.isFinite),'finite normals at all photo head vertices');
  assert(Math.abs(Math.hypot(...normal)-1)<.02,'normals remain unit-length');
  assert(v[k+9]>=0&&v[k+9]<=1&&v[k+10]>=0&&v[k+10]<=1,
   'head UV stays inside one approved atlas');
 }
 const whole=geometry(photo);
 assert(whole.indices.length/3<=3500,'mobile triangle budget remains within previous cap');
 const actor={kind:'louis-companion',id:'louis-escape',visualPreset:LOIS_VISUAL_ID,
  x:0,y:0,z:0,yaw:0,phase:'untying',age:1,walk:0,speed:0,crouch:.45,blink:0};
 for(const phase of ['untying','climb','hide','hidden','follow']){
  const parts=pickupGeometry([{...actor,phase}]);
  assert(parts.filter(p=>p.shape==='lois-face').length===1,
   'one Photo-A head and one rig in '+phase);
  assert(parts.find(p=>p.shape==='lois-face')?.segments===face.segments);
  assert(geometry(parts).vertices.every(Number.isFinite),'finite '+phase+' head geometry');
 }
 console.log('PASS PHOTO-A ANATOMY',JSON.stringify({
  mobileFaceTriangles:mesh.indices.length/3,
  totalMobileTriangles:whole.indices.length/3,
  jawWidthIncrease:Number((xJaw-xOld).toFixed(4)),
  chinRelief:Number((front[2]-ellipseDepth).toFixed(4))
 }));
})().catch(e=>{console.error(e);process.exitCode=1;});
