const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const {loisFaceSurface}=await import('../src/lab/lois-ps2-face.js');
 const {LOIS_FACE_SOURCE,faceTextureSize}=await import('../src/lab/lois-ps2-texture.js');
 const {LOIS_PS2_PROFILE}=await import('../src/lab/lois-ps2-profile.js');
 const {FRAGMENT_SHADER}=await import('../src/lab/material-shaders.js');
 assert.equal(faceTextureSize('low'),512);
 assert.equal(faceTextureSize('medium'),1024);
 assert(LOIS_FACE_SOURCE.endsWith('/assets/lois-ps2-face.svg'));
 const src=fs.readFileSync(path.join(__dirname,'../src/lab/assets/lois-ps2-face.svg'),'utf8');
 assert(src.startsWith('<svg')&&src.includes('viewBox="0 0 1024 1024"'));
 assert(src.includes('Seam lies at the back'));
 assert(src.includes('skin')&&src.includes('beard')&&src.includes('eyeshadow'));
 assert(!src.includes('<image')&&!src.includes('href='),'UV art must not hotlink any photo');
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
 for(let row=0;row<=box.rings;row++){
  const l=row*(box.segments+1)*16,r=(row*(box.segments+1)+box.segments)*16;
  assert(Math.abs(textured.vertices[l]-textured.vertices[r])<.00001,'cylindrical seam X continuous');
  assert(Math.abs(textured.vertices[l+2]-textured.vertices[r+2])<.00001,'cylindrical seam Z continuous');
  assert.equal(textured.vertices[l+9],0);assert.equal(textured.vertices[r+9],1);
 }
 console.log('PASS: original UV atlas, seam closure, texture/material isolation and reversible fallback.');
})().catch(e=>{console.error(e);process.exitCode=1;});
