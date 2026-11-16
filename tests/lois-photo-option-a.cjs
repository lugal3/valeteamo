const assert=require('node:assert/strict');
(async()=>{
 const {createLouisEscape}=await import('../src/lab/louis-escape.js');
 const {createHouse}=await import('../src/lab/world.js');
 const {pickupGeometry,geometry}=await import('../src/lab/renderer.js');
 const {LOIS_VISUAL_ID}=await import('../src/lab/lois-ps2-profile.js');
 const actor={kind:'louis-companion',id:'louis-escape',visualPreset:LOIS_VISUAL_ID,
  visualVariant:'photo-a',x:0,y:0,z:0,phase:'follow',yaw:0,walk:0,speed:0,blink:0,age:.3};
 const boxes=pickupGeometry([actor]);
 const face=boxes.find(x=>x.shape==='lois-face');
 assert(face&&face.photoMapped,'single continuous photo-mapped face');
 assert(boxes.filter(x=>x.photoMapped).length>=8,'face and textured scalp plus four photographic hair cards are mapped');
 assert(boxes.filter(x=>x.shape==='lois-photo-hair').length===4,'photo hair retains four curved front cards');
 assert(boxes.some(x=>x.rigPart==='hair-back'&&x.photoMapped)&&
  boxes.some(x=>x.rigPart==='hair-cap'&&x.photoMapped),
  'photo hair shell must retain the approved texture in three-quarter view');
 assert(!boxes.some(x=>/^ear-/.test(x.rigPart||'')&&x.photoMapped),
  'no photographic stripes over the ears');
 assert(!boxes.some(x=>/pickup-louis-escape-(iris|eye|pupil|lid|upper-lip|lower-lip|brow|nostril)/.test(x.id)),
  'photo supplies original eyes, eyebrows and lips: no double emoji-style features');
 const mesh=geometry(boxes);
 // A real profile must not show another pair of eyes on the rear head.
 // Rear UVs are redirected to a constant cheek-skin patch in the SAME image;
 // the side blends toward the original face UVs without a hard material seam.
 const faceRange=mesh.ranges[boxes.findIndex(x=>x.shape==='lois-face')];
 let rearHead=0;
 for(let i=faceRange.start;i<faceRange.end;i+=16){
  if(mesh.vertices[i+8]<-.65){
   rearHead++;
   assert.equal(mesh.vertices[i+11],4,'rear skin samples the same approved atlas');
   assert(Math.abs(mesh.vertices[i+9]-(540-110)/650)<.025,
    'rear skin UV must avoid the eyes and mouth of the front portrait');
  }
 }
 assert(rearHead>20,'closed photo head includes skin-only rear vertices');
 // A rounded photo hair backing can NEVER sample the image's eyebrows or
 // eyes. Front hair cutouts have separate exact UVs, so constrain shell only.
 const scalp=boxes.filter(part=>part.rigPart==='hair-back'||
  part.rigPart==='hair-cap'||part.rigPart==='crown'||
  part.rigPart?.startsWith('temple-'));
 assert(scalp.length>=4,'textured backing covers scalp and temples');
 for(const part of scalp){
  const range=mesh.ranges[boxes.indexOf(part)];
  for(let i=range.start;i<range.end;i+=16){
   const sourceY=(1-mesh.vertices[i+10])*850;
   assert(sourceY<=311,'scalp UV may sample hair, never a second eye');
  }
 }
 let count=0;for(let i=0;i<mesh.vertices.length;i+=16){
  if(mesh.vertices[i+11]===4){count++;
   assert(mesh.vertices[i+9]>=0&&mesh.vertices[i+9]<=1);
   assert(mesh.vertices[i+10]>=0&&mesh.vertices[i+10]<=1);
  }
 }
 assert(count>350,'photographic samples must be projected into actual renderer UVs');
 for(const variant of ['legacy','ps2-b','photo-a']){
  const selected=pickupGeometry([{...actor,visualVariant:variant}]);
  assert(selected.some(x=>x.shape==='lois-face'&&x.photoMapped),
   'every old or new save loads the approved photographic model');
  assert(!selected.some(x=>x.id.endsWith('-iris--1')||x.id.endsWith('-nose-tip')),
   'old illustrated face never appears');
 }
 const rescued=createLouisEscape(createHouse());
 assert.equal(rescued.visualVariant,'photo-a','real game launches photo variant');
 assert.equal(rescued.phase,'untying');
 console.log('PASS PHOTO OPTION A',JSON.stringify({parts:boxes.length,texturedVertices:count,triangles:mesh.indices.length/3,singleModel:true,legacyMigrates:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
