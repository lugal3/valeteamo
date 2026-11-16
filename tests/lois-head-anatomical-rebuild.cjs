// Anatomical rewrite regression: one genuinely re-proportioned Photo-A head,
// NOT a denser oval or a second photographic mask floating above the skull.
const assert=require('node:assert/strict');
(async()=>{
 const {LOIS_HEAD_ANATOMY_RINGS,loisHeadRingProfile,
  loisAnatomicalHeadPoint}=await import('../src/lab/lois-head-anatomy.js');
 const {buildLoisPs2Model}=await import('../src/lab/lois-ps2-model.js');
 const {loisFacePoint,loisFaceSurface}=await import('../src/lab/lois-ps2-face.js');
 const {geometry,pickupGeometry}=await import('../src/lab/renderer.js');
 const {LOIS_PS2_PROFILE,LOIS_VISUAL_ID}=await import('../src/lab/lois-ps2-profile.js');
 const piece=(id,x,y,z,w,h,d,mat,extras={})=>({id,x,y,z,w,h,d,mat,...extras,solid:false,dynamic:true});
 const mobile=buildLoisPs2Model(piece),face=mobile.find(p=>p.id==='face');
 const leftEar=mobile.find(p=>p.id==='ear--1'),rightEar=mobile.find(p=>p.id==='ear-1');
 assert(face?.shape==='lois-face'&&face.photoMapped,'only approved Photo-A head is shipped');
 assert.equal(mobile.filter(p=>p.shape==='lois-face').length,1,'one continuous head only');
 assert(LOIS_HEAD_ANATOMY_RINGS.length>=14,'multiple hand-sculpted cranial profiles');
 assert(LOIS_HEAD_ANATOMY_RINGS.every((x,i,a)=>i===0||x[0]>a[i-1][0]),
  'cranial rings ordered vertically');
 const cheek=loisHeadRingProfile(.24),jaw=loisHeadRingProfile(-.55),
  chin=loisHeadRingProfile(-.89),crown=loisHeadRingProfile(.91);
 assert(cheek[1]>jaw[1]+.20,'cheeks visibly broader than angular mandibular edge');
 assert(jaw[1]>chin[1]+.18,'jaw narrows into a real chin contour');
 assert(crown[1]<cheek[1]-.30,'temples slope into the hairline');
 const at=(u,v)=>loisAnatomicalHeadPoint(face,u,v);
 const baseline=(u,v)=>loisFacePoint({...face,photoMapped:false},u,v);
 const pointWide=at(.75,.32),oldWide=baseline(.75,.32);
 assert(pointWide[0]>oldWide[0]+.02,
  'jawline changes at least 2cm from original spherical profile');
 const nose=at(.5,.40),underEye=at(.585,.40);
 assert(nose[2]-underEye[2]>.035,
  'nose bridge and tip have independent projected 3D volume');
 const chinPole=at(.5,0);
 assert(chinPole[2]>face.z+.023,
  'the lower pole sits forward to support an actual under-chin');
 const sideFront=at(.5,.27),sideOld=baseline(.5,.27);
 assert(sideFront[2]>sideOld[2]+.012,
  'chin shelf and anterior jaw now project beyond the oval');
 const rear=at(0,.64),oldRear=baseline(0,.64);
 assert(rear[2]<oldRear[2]-.022,
  'posterior cranium has significant depth, not a spherical cap');
 for(const v of [0,1]){
  const endpoints=[0,.17,.50,.83,1].map(u=>at(u,v));
  for(const p of endpoints)for(const [i,n] of p.entries())
   assert(Math.abs(n-endpoints[0][i])<1e-6,'closed, single-vertex pole at '+v);
 }
 for(const ear of [leftEar,rightEar]){
  assert(ear?.rigBone==='head','ears preserve head rig motion');
  assert(ear.w<=.047&&ear.h<=.085,'ear no longer oversize and detached');
 }
 assert.equal(leftEar.x,-rightEar.x);
 const mesh=geometry(mobile);
 assert(mesh.indices.length/3<=LOIS_PS2_PROFILE.meshLimits.mobileTriangles,
  'mobile triangle budget preserved under 3500');
 const surface=loisFaceSurface(face,face.color,9);
 assert(surface.vertices.every(Number.isFinite),'sculpt has finite positions/normals/UVs');
 assert.equal(surface.indices.length/3,face.segments*face.rings*2);
 for(let i=0;i<surface.vertices.length;i+=16){
  const V=surface.vertices,n=[V[i+6],V[i+7],V[i+8]];
  assert(Math.abs(Math.hypot(...n)-1)<.025,'head sculpt uses smooth unit vertex normals');
  assert(V[i+9]>=0&&V[i+9]<=1&&V[i+10]>=0&&V[i+10]<=1,
   'same approved photograph remains UV valid');
 }
 const actor={kind:'louis-companion',id:'louis-escape',visualPreset:LOIS_VISUAL_ID,
  x:0,y:0,z:0,yaw:0,phase:'untying',age:1,walk:0,speed:0,crouch:.5,blink:0};
 for(const phase of ['untying','climb','hide','follow']){
  const parts=pickupGeometry([{...actor,phase}]);
  assert(parts.filter(p=>p.shape==='lois-face'&&p.photoMapped).length===1,
   'all rescue phases share same anatomical photo head');
 }
 const desktop=buildLoisPs2Model(piece,{quality:'desktop'});
 assert(geometry(desktop).indices.length/3<=LOIS_PS2_PROFILE.meshLimits.desktopTriangles,
  'desktop triangle budget preserved');
 console.log('PASS ANATOMICAL HEAD REBUILD',JSON.stringify({
  cheekWidth:cheek[1],jawWidth:jaw[1],chinWidth:chin[1],
  jawDifference:Number((pointWide[0]-oldWide[0]).toFixed(4)),
  noseProjection:Number((nose[2]-underEye[2]).toFixed(4)),
  rearDifference:Number((oldRear[2]-rear[2]).toFixed(4)),
  mobileTris:mesh.indices.length/3
 }));
})().catch(e=>{console.error(e);process.exitCode=1;});
