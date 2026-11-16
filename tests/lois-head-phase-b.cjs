// Phase B: targeted facial topology (NOT a second face or illustration).
const assert=require('node:assert/strict');
(async()=>{
 const {buildLoisPs2Model}=await import('../src/lab/lois-ps2-model.js');
 const {loisFaceRingV,loisFaceColumnU,loisFacePoint,loisFaceSurface,
  LOIS_FACE_HEIGHT_BANDS}=await import('../src/lab/lois-ps2-face.js');
 const {geometry}=await import('../src/lab/renderer.js');
 const {LOIS_PS2_PROFILE}=await import('../src/lab/lois-ps2-profile.js');
 const piece=(id,x,y,z,w,h,d,mat,props={})=>({id,x,y,z,w,h,d,mat,...props,dynamic:true,solid:false});
 const parts=buildLoisPs2Model(piece),face=parts.find(part=>part.shape==='lois-face');
 assert(face&&face.photoMapped&&face.segments===32&&face.rings===24,
  'the mobile Photo-A face gets 32 radial and 24 anatomical horizontal segments');
 const bands=LOIS_FACE_HEIGHT_BANDS;
 assert.equal(bands.length,25,'24 face bands with real lip/eye/chin landmarks');
 assert.equal(bands[0],0);assert.equal(bands.at(-1),1);
 assert(bands.every((v,i)=>i===0||v>bands[i-1]),
  'landmark rings must be strictly monotonic (no folded face)');
 for(const rings of [14,24,28]){
  let prev=-1;
  for(let row=0;row<=rings;row++){
   const v=loisFaceRingV(row,rings);
   assert(v>=0&&v<=1&&v>prev,'resampled rings never cross each other');
   prev=v;
  }
  assert.equal(loisFaceRingV(0,rings),0);
  assert.equal(loisFaceRingV(rings,rings),1);
 }
 const sampled=Array.from({length:face.rings+1},(_,row)=>loisFaceRingV(row,face.rings));
 const numberBetween=(a,b)=>sampled.filter(v=>v>=a&&v<=b).length;
 assert(numberBetween(.235,.36)>=5,'several contiguous loops follow mouth and underlip');
 assert(numberBetween(.36,.51)>=5,'several loops follow nose and alar region');
 assert(numberBetween(.52,.66)>=4,'several loops follow eye socket and brow');
 assert(numberBetween(.12,.31)>=6,'chin and jaw have enough contour transitions');
 for(const segments of [24,32,40]){
  assert.equal(loisFaceColumnU(0,segments),0);
  assert.equal(loisFaceColumnU(segments,segments),1);
  assert.equal(loisFaceColumnU(segments/2,segments),.5);
  for(let col=1;col<segments;col++)
   assert(loisFaceColumnU(col,segments)>loisFaceColumnU(col-1,segments),
    'radial loops have strictly increasing angles');
 }
 const head=loisFaceSurface(face,face.color,9);
 assert.equal(head.indices.length/3,2*face.segments*face.rings);
 assert(head.vertices.every(Number.isFinite),'relief and UVs must remain finite');
 for(let i=0;i<head.vertices.length;i+=16){
  const v=head.vertices;
  assert(Math.abs(Math.hypot(v[i+6],v[i+7],v[i+8])-1)<.02,
   'anatomical bands have normalized vertex normals');
  assert(v[i+9]>=0&&v[i+9]<=1&&v[i+10]>=0&&v[i+10]<=1,
   'approved photograph retains valid UV domain');
 }
 // A photographed eye and mouth should be held on one contiguous mesh:
 // local geometry must be finite and no physical iris/lip spheres may return.
 for(const [u,v] of [[.5,.50],[.56,.59],[.50,.42],[.50,.30],[.65,.25]]){
  assert(loisFacePoint(face,u,v).every(Number.isFinite),'stable landmark '+u+','+v);
 }
 assert(!parts.some(p=>/^(iris|pupil|nose-tip|upper-lip|lower-lip)/.test(p.id)),
  'photographic details must not be reintroduced as separate geometry');
 const mesh=geometry(parts),tris=mesh.indices.length/3;
 assert(tris<=LOIS_PS2_PROFILE.meshLimits.mobileTriangles,
  'mobile total must remain below 3500 triangles');
 const desktop=buildLoisPs2Model(piece,{quality:'desktop'});
 const desktopMesh=geometry(desktop);
 assert(desktopMesh.indices.length/3<=LOIS_PS2_PROFILE.meshLimits.desktopTriangles,
  'desktop model stays within original budget');
 console.log('PASS LOIS FACE PHASE B',JSON.stringify({
  rings:face.rings,radial:face.segments,faceTriangles:head.indices.length/3,
  mobileTriangles:tris,desktopTriangles:desktopMesh.indices.length/3
 }));
})().catch(e=>{console.error(e);process.exitCode=1;});
