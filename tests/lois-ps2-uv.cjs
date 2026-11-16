const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const {loisFaceSurface}=await import('../src/lab/lois-ps2-face.js');
 const {LOIS_PHOTO_SOURCE,faceTextureSize}=await import('../src/lab/lois-ps2-texture.js');
 const {LOIS_PS2_PROFILE}=await import('../src/lab/lois-ps2-profile.js');
 const {FRAGMENT_SHADER}=await import('../src/lab/material-shaders.js');
 assert.equal(faceTextureSize('low'),512);
 assert.equal(faceTextureSize('medium'),1024);
 assert(LOIS_PHOTO_SOURCE.includes('lois-option-a-reference.jpg'));
 const picture=fs.readFileSync(path.join(__dirname,'../src/lab/assets/lois-option-a-reference.jpg'));
 assert(picture.length>10000&&picture[0]===255&&picture[1]===216,
  'the one production photo atlas is a real JPEG');
 assert.equal(LOIS_PS2_PROFILE.atlas.colorSpace,'sRGB');
 assert(FRAGMENT_SHADER.includes('uniform sampler2D uAtlas,uLightDepth,uMaterials,uTV,uLoisFace;'));
 assert(FRAGMENT_SHADER.includes('vArt>1.5&&vArt<2.5'),'TV sampler must not override Lois face');
 assert(FRAGMENT_SHADER.includes('vArt>2.5&&vArt<3.5'),'Lois face uses dedicated UV texture');
 const box={x:0,y:1.61,z:0,w:.326,h:.425,d:.318,segments:24,rings:14};
 const textured=loisFaceSurface(box,[.85,.68,.57],9);
 const flat=loisFaceSurface({...box,faceTexture:false},[.85,.68,.57],9);
 const stride=16,offset=11;
 for(let i=0;i<textured.vertices.length;i+=stride){
  assert.equal(textured.vertices[i+offset],3,'painted face selects UV material');
  assert.equal(flat.vertices[i+offset],0,'fallback uses vertex skin material');
  const u=textured.vertices[i+9],v=textured.vertices[i+10];
  assert(u>=0&&u<=1&&v>=0&&v<=1,'valid UV');
 }
 // Regression for the renderer's nonstandard camera winding convention:
 // if the face triangles are reversed, its front disappears behind the dark
 // rear hemisphere even though the UV and texture tests still pass.
 const n=box.segments,mid=Math.floor(box.rings/2)*n+Math.floor(n/2);
 const tri=textured.indices.slice(mid*6,mid*6+3),vtx=i=>[
  textured.vertices[i*16],textured.vertices[i*16+1],textured.vertices[i*16+2]
 ];
 const [a,b,c]=Array.from(tri,vtx);
 const ab=[b[0]-a[0],b[1]-a[1]],ac=[c[0]-a[0],c[1]-a[1]];
 assert(ab[0]*ac[1]-ab[1]*ac[0]<-1e-9,
  'Lois front polygons must have the same winding as existing WebGL character surfaces');
 for(let row=0;row<=box.rings;row++){
  const l=row*(box.segments+1)*16,r=(row*(box.segments+1)+box.segments)*16;
  assert(Math.abs(textured.vertices[l]-textured.vertices[r])<.00001,'cylindrical seam X continuous');
  assert(Math.abs(textured.vertices[l+2]-textured.vertices[r+2])<.00001,'cylindrical seam Z continuous');
  assert.equal(textured.vertices[l+9],0);assert.equal(textured.vertices[r+9],1);
 }
 console.log('PASS: Photo-A UV atlas, seam closure and texture/material isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
