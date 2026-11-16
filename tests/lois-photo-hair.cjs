const assert=require('node:assert/strict');
(async()=>{
 const {buildLoisPs2Model}=await import('../src/lab/lois-ps2-model.js');
 const {geometry,pickupGeometry}=await import('../src/lab/renderer.js');
 const {LOIS_VISUAL_ID}=await import('../src/lab/lois-ps2-profile.js');
 const {loisFacePoint}=await import('../src/lab/lois-ps2-face.js');
 const piece=(id,x,y,z,w,h,d,mat,props={})=>({id,x,y,z,w,h,d,mat,...props,dynamic:true,solid:false});
 const photo=buildLoisPs2Model(piece,{photoMode:true});
 const defaultPhoto=buildLoisPs2Model(piece);
 const hairs=photo.filter(b=>b.shape==='lois-photo-hair');
 assert.equal(hairs.length,4,'four depth-separated photo-sampled hair layers');
 assert(hairs.every(b=>b.rigBone==='head'&&b.photoMapped),'all layers follow existing head rig');
 assert(hairs.every(b=>b.photoPolygon.length>=7),'no degenerate flat hair sprites');
 // Keep every hair card inside the original crop, and ensure the silhouette
 // contains the short uneven crown/temple steps rather than a round helmet.
 assert(hairs.every(b=>b.photoPolygon.every(([x,y])=>x>=110&&x<=760&&y>=0&&y<=850)),
  'hair outline must stay inside the approved reference crop');
 const outer=hairs.find(b=>b.id==='hair-photo-mass');
 assert(outer.photoPolygon.length>=30,'crown outline is explicitly broken into smaller tufts');
 const crown=outer.photoPolygon.filter(([,y])=>y<110);
 assert(crown.length>=10,'crown contour contains several independent peaks');
 assert(hairs.some(b=>b.id==='hair-photo-fringe-right'&&b.photoPolygon.length>=12),
  'right fringe uses a tapered, less abrupt silhouette');
 assert(photo.some(b=>b.id==='face'&&b.photoMapped),'photographic face is untouched');
 // Stage 3: photo-only jaw/cheek volume. Sample the same dimensions in both
 // modes so the classic silhouette remains the known geometry baseline.
 const faceBox=photo.find(b=>b.id==='face');
 const photoJawPoint=loisFacePoint(faceBox,.67,.20);
 const classicJawPoint=loisFacePoint({...faceBox,photoMapped:false},.67,.20);
 assert(photoJawPoint[0]>classicJawPoint[0],
  'photo jaw is gently fuller than the original narrow PS2 chin');
 const cheekU=.64,cheekV=.47;
 const photoCheekPoint=loisFacePoint(faceBox,cheekU,cheekV);
 const theta=(cheekU-.5)*Math.PI*2,phi=(cheekV-.5)*Math.PI;
 const baseZ=faceBox.z+Math.cos(theta)*Math.cos(phi)*faceBox.d*.5;
 assert(photoCheekPoint[2]>baseZ,
  'photo cheek geometry has measured depth without separate facial primitives');
 assert(photoCheekPoint.every(Number.isFinite)&&photoJawPoint.every(Number.isFinite),
  'photo-only cheek/jaw adjustment must remain finite');
 const neck=photo.find(b=>b.id==='neck');
 assert(neck?.shape==='lois-neck-lowpoly'&&neck.photoMapped,
  'the neck now shares only the clean cheek-skin portion of Photo-A, never stretched beard');
 assert(neck.rings===6&&neck.segments>=16,
  'neck has six curved, low-poly rings supporting the reconstructed jaw');
 const face=photo.find(b=>b.id==='face');
 const shirt=photo.find(b=>b.id==='shirt');
 const torso=photo.find(b=>b.id==='torso');
 assert(torso?.shape==='lois-tee-torso'&&torso.segments>=12,
  'photo torso must be a tapered T-shirt shell, not a rectangle');
 assert(!shirt,'Photo-A must NOT render the floating shirt rectangle');
 assert(defaultPhoto.find(b=>b.id==='torso')?.shape==='lois-tee-torso'&&
  !defaultPhoto.some(b=>b.id==='shirt'),
  'only the fitted Photo-A torso is constructed; illustrated shirt is retired');
 assert(neck.y+neck.h*.5>face.y-face.h*.5+.10,
  'upper neck overlaps the jaw, preventing a visible floating-head gap');
 assert(neck.y-neck.h*.5<torso.y+torso.h*.5-.015,
  'lower neck enters the sculpted torso instead of ending above its neckline');
 assert(defaultPhoto.some(b=>b.shape==='lois-photo-hair')&&defaultPhoto.some(b=>b.shape==='lois-face'&&b.photoMapped),
  'even the default constructor must use only Photo-A');
 const mesh=geometry(photo);
 assert(mesh.vertices.every(Number.isFinite));
 assert(mesh.indices.every(Number.isFinite));
 assert(mesh.indices.length/3<=3500,'mobile triangle budget unchanged');
 for(let i=0;i<mesh.vertices.length;i+=16)assert(mesh.vertices[i+9]>=0&&mesh.vertices[i+9]<=1&&mesh.vertices[i+10]>=0&&mesh.vertices[i+10]<=1,'UV range');
 // Hair cards are curved spatially but must sample the same exact source
 // pixels, not inadvertently stretch the approved photo with the new curve.
 const hairIdx=photo.findIndex(b=>b.id==='hair-photo-mass');
 const firstRange=mesh.ranges[hairIdx];
 const outerHair=photo[hairIdx],source=outerHair.photoPolygon[0];
 const vOffset=firstRange.start+16; // second point in the first triangle
 const expectedU=(source[0]-110)/650,expectedV=1-source[1]/850;
 assert(Math.abs(mesh.vertices[vOffset+9]-expectedU)<1e-6&&
  Math.abs(mesh.vertices[vOffset+10]-expectedV)<1e-6,
  'curved outer hair must retain exact photographic UVs');
 const centerZ=mesh.vertices[firstRange.start+2],sideZ=mesh.vertices[vOffset+2];
 assert(sideZ<centerZ-.012,'side fringe is tucked back into the scalp, not a flat cutout');
 const topIndex=outerHair.photoPolygon.reduce((best,point,i,arr)=>point[1]<arr[best][1]?i:best,0);
 const topOffset=firstRange.start+(topIndex*3+1)*16;
 const highestRawY=outerHair.y+1.656+(470-outerHair.photoPolygon[topIndex][1])/1327;
 assert(mesh.vertices[topOffset+1]<highestRawY-.05,
  'floating top of hair is drawn down into supporting hair shell');
 for(const {start,end} of mesh.ranges.slice(photo.findIndex(b=>b.shape==='lois-photo-hair'),photo.findIndex(b=>b.shape==='lois-photo-hair')+hairs.length)){
  assert(end>start,'hair card generated actual geometry');
  for(let j=start;j<end;j+=16)assert.equal(mesh.vertices[j+11],4,'hair uses photo sampler, not painted material');
 }
 const actor={kind:'louis-companion',id:'louis-escape',visualPreset:LOIS_VISUAL_ID,visualVariant:'photo-a',
 x:0,y:0,z:0,yaw:0,phase:'follow',age:1,walk:0,speed:0,crouch:0,blink:0};
 for(const phase of ['untying','climb','hide','hidden','follow']){
  const m=geometry(pickupGeometry([{...actor,phase}]));
  assert(m.vertices.every(Number.isFinite),'rig mesh stable in '+phase);
 }
 console.log('PASS LOIS HAIR: '+JSON.stringify({layers:hairs.length,photoTriangles:mesh.indices.length/3,vertices:mesh.vertices.length/16,defaultParts:defaultPhoto.length,photoParts:photo.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
