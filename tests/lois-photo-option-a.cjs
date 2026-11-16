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
 assert(boxes.filter(x=>x.photoMapped).length>=5,'face plus four photographic hair cards remain mapped');
 assert(boxes.filter(x=>x.shape==='lois-photo-hair').length===4,'photo hair retains four curved front cards');
 assert(!boxes.some(x=>/ear-|hair-back|hair-cap|temple-|crown/.test(x.rigPart||'')&&x.photoMapped),
  'no photographic eyes, ears or stripes on scalp backing meshes');
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
 let count=0;for(let i=0;i<mesh.vertices.length;i+=16){
  if(mesh.vertices[i+11]===4){count++;
   assert(mesh.vertices[i+9]>=0&&mesh.vertices[i+9]<=1);
   assert(mesh.vertices[i+10]>=0&&mesh.vertices[i+10]<=1);
  }
 }
 assert(count>350,'photographic samples must be projected into actual renderer UVs');
 const old=pickupGeometry([{...actor,visualVariant:'ps2-b'}]);
 assert(old.some(x=>x.id.endsWith('-iris--1')),'illustrated variant remains reversible');
 assert(old.some(x=>x.shape==='lois-face'&&!x.photoMapped));
 const legacy=pickupGeometry([{...actor,visualVariant:'legacy'}]);
 assert(!legacy.some(x=>x.shape==='lois-face'),'original low-poly fallback preserved');
 const rescued=createLouisEscape(createHouse());
 assert.equal(rescued.visualVariant,'photo-a','real game launches photo variant');
 assert.equal(rescued.phase,'untying');
 console.log('PASS PHOTO OPTION A',JSON.stringify({parts:boxes.length,texturedVertices:count,triangles:mesh.indices.length/3,legacyFallback:true,illustratedFallback:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
