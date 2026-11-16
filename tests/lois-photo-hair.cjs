const assert=require('node:assert/strict');
(async()=>{
 const {buildLoisPs2Model}=await import('../src/lab/lois-ps2-model.js');
 const {geometry,pickupGeometry}=await import('../src/lab/renderer.js');
 const {LOIS_VISUAL_ID}=await import('../src/lab/lois-ps2-profile.js');
 const piece=(id,x,y,z,w,h,d,mat,props={})=>({id,x,y,z,w,h,d,mat,...props,dynamic:true,solid:false});
 const photo=buildLoisPs2Model(piece,{photoMode:true});
 const classic=buildLoisPs2Model(piece);
 const hairs=photo.filter(b=>b.shape==='lois-photo-hair');
 assert.equal(hairs.length,4,'four depth-separated photo-sampled hair layers');
 assert(hairs.every(b=>b.rigBone==='head'&&b.photoMapped),'all layers follow existing head rig');
 assert(hairs.every(b=>b.photoPolygon.length>=7),'no degenerate flat hair sprites');
 assert(photo.some(b=>b.id==='face'&&b.photoMapped),'photographic face is untouched');
 const neck=photo.find(b=>b.id==='neck');
 assert(neck?.shape==='lois-neck-lowpoly'&&!neck.photoMapped,
  'the PS2 neck is faceted skin geometry, not a stretched photo map');
 assert(!classic.some(b=>b.shape==='lois-photo-hair'),'legacy PS2-B has no added layer');
 const mesh=geometry(photo);
 assert(mesh.vertices.every(Number.isFinite));
 assert(mesh.indices.every(Number.isFinite));
 assert(mesh.indices.length/3<=3500,'mobile triangle budget unchanged');
 for(let i=0;i<mesh.vertices.length;i+=16)assert(mesh.vertices[i+9]>=0&&mesh.vertices[i+9]<=1&&mesh.vertices[i+10]>=0&&mesh.vertices[i+10]<=1,'UV range');
 for(const {start,end} of mesh.ranges.slice(photo.findIndex(b=>b.shape==='lois-photo-hair'),photo.findIndex(b=>b.shape==='lois-photo-hair')+5)){
  assert(end>start,'hair card generated actual geometry');
  for(let j=start;j<end;j+=16)assert.equal(mesh.vertices[j+11],4,'hair uses photo sampler, not painted material');
 }
 const actor={kind:'louis-companion',id:'louis-escape',visualPreset:LOIS_VISUAL_ID,visualVariant:'photo-a',
 x:0,y:0,z:0,yaw:0,phase:'follow',age:1,walk:0,speed:0,crouch:0,blink:0};
 for(const phase of ['untying','climb','hide','hidden','follow']){
  const m=geometry(pickupGeometry([{...actor,phase}]));
  assert(m.vertices.every(Number.isFinite),'rig mesh stable in '+phase);
 }
 console.log('PASS LOIS HAIR: '+JSON.stringify({layers:hairs.length,photoTriangles:mesh.indices.length/3,vertices:mesh.vertices.length/16,classicParts:classic.length,photoParts:photo.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
