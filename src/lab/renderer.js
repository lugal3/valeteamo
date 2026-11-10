import {createRigBinding,evaluateRig} from './character-rig.js';
import {smoothSurface,torusSurface,roundedBoxSurface} from './chibi-geometry.js';
import {BATH_MIRROR,mirrorVisible,kittyMirrorPieces,reflectedBathroom,reflectMesh,poseReflectedKitty} from './mirror.js';
import {ART_COUNT,createArtworkCanvas} from './artwork.js';
import {climbingHandPieces} from './first-person.js';
import {drawViewModel} from './viewmodel.js';
import {pursuerPieces} from './pursuer-model.js';
import {VERTEX_SHADER as VS,FRAGMENT_SHADER as FS} from './material-shaders.js';
// Minimal WebGL1 3D renderer: real perspective, depth buffer, world geometry and spotlight.
// No additional packages, CDNs, runtime downloads or concurrent Phaser loops.
import {MATERIAL,lineBlocked} from './world.js';
import {materialPixels,materialStyle,surfaceFrame,ATLAS_SIZE,TILE_SIZE,GUTTER,INNER,ATLAS_SIZE_MED,TILE_SIZE_MED,GUTTER_MED,INNER_MED} from './materials.js';
import {lightDepthField,LIGHT_DEPTH_SIZE,LIGHT_REACH,LIGHT_SPREAD} from './lighting.js';
function shader(gl,kind,source){const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error('Shader: '+msg);}return s;}
function program(gl,low=false){const source=low?FS.replace('uniform float uFlash,uOcclude;','uniform float uFlash; const float uOcclude=0.0;'):FS;const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,VS),f=shader(gl,gl.FRAGMENT_SHADER,source);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p)||'Shader linkage');return p;}
function createAtlas(gl){
 const canvas=createArtworkCanvas();
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 return tex;
}
const faces=[
 // right, left, top, bottom, south, north; each face has an explicit outward normal.
 {normal:[1,0,0],corners:[[1,-1,-1],[1,-1,1],[1,1,1],[1,1,-1]],dir:'east'},
 {normal:[-1,0,0],corners:[[-1,-1,1],[-1,-1,-1],[-1,1,-1],[-1,1,1]],dir:'west'},
 {normal:[0,1,0],corners:[[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]],dir:'top'},
 {normal:[0,-1,0],corners:[[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1]],dir:'bottom'},
 {normal:[0,0,1],corners:[[1,-1,1],[-1,-1,1],[-1,1,1],[1,1,1]],dir:'south'},
 {normal:[0,0,-1],corners:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1]],dir:'north'}
];
function createMaterials(gl,quality='medium'){
 const pixels=materialPixels(quality),textures=[];
 const size=quality==='low'?ATLAS_SIZE:ATLAS_SIZE_MED;
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 for(const [i,data] of [pixels.color].entries()){
  const texture=gl.createTexture();textures.push(texture);gl.activeTexture(gl.TEXTURE2+i);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
  // Tile-local repeat uses gutters. Linear filtering avoids cross-tile mip bleed.
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 }
 return textures;
}
export function geometry(boxes){
 const vertices=[],indices=[],groups=[],ranges=[],colors=MATERIAL;let offset=0;
 for(const box of boxes){
  const baseColor=box.color||colors[box.mat]||colors.cream;
  const color=box.ao?[baseColor[0]*box.ao,baseColor[1]*box.ao,baseColor[2]*box.ao]:baseColor;
  const style=materialStyle(box)+(box.chibi?(box.emissive?96:64):(box.glow?32:0)),first=vertices.length;
  const range={start:first,end:first};ranges.push(range);
  const rotateMesh=()=>{
   range.end=vertices.length;
   if(!box.yaw&&!box.pitch&&!box.roll)return;const c=Math.cos(box.yaw||0),s=Math.sin(box.yaw||0),cp=Math.cos(box.pitch||0),sp=Math.sin(box.pitch||0),cr=Math.cos(box.roll||0),sr=Math.sin(box.roll||0);
   for(let i=first;i<vertices.length;i+=16){const dx=vertices[i]-box.x,dy=vertices[i+1]-box.y,x=dx*cr-dy*sr,y=dx*sr+dy*cr,z=vertices[i+2]-box.z,pz=y*sp+z*cp;vertices[i]=box.x+x*c-pz*s;vertices[i+1]=box.y+y*cp-z*sp;vertices[i+2]=box.z+x*s+pz*c;for(const offset of [6,13]){const ax=vertices[i+offset],ay=vertices[i+offset+1],nx=ax*cr-ay*sr,ny=ax*sr+ay*cr,nz=vertices[i+offset+2],rz=ny*sp+nz*cp;vertices[i+offset]=nx*c-rz*s;vertices[i+offset+1]=ny*cp-nz*sp;vertices[i+offset+2]=nx*s+rz*c;}}
  };
  if(box.shape==='lathe'||box.smooth){
   const mesh=smoothSurface(box,color,style);
   for(const n of mesh.vertices)vertices.push(n);
   for(const i of mesh.indices)indices.push(offset+i);
   groups.push({start:offset,end:offset+mesh.vertices.length/16,joint:box.joint||'root'});offset+=mesh.vertices.length/16;rotateMesh();continue;
  }
  if(box.shape==='torus'){
   const mesh=torusSurface(box,color,style);
   for(const n of mesh.vertices)vertices.push(n);
   for(const i of mesh.indices)indices.push(offset+i);
   groups.push({start:offset,end:offset+mesh.vertices.length/16,joint:box.joint||'root'});offset+=mesh.vertices.length/16;rotateMesh();continue;
  }
  if(box.shape==='rounded-box'||box.shape==='cushion'){
   const mesh=roundedBoxSurface(box,color,style);
   for(const n of mesh.vertices)vertices.push(n);
   for(const i of mesh.indices)indices.push(offset+i);
   groups.push({start:offset,end:offset+mesh.vertices.length/16,joint:box.joint||'root'});offset+=mesh.vertices.length/16;rotateMesh();continue;
  }
  if(box.shape==='gable'){
   const w=box.w/2,h=box.h/2,d=box.d/2;
   const p=[[-w,-h,-d],[w,-h,-d],[0,h,-d],[-w,-h,d],[w,-h,d],[0,h,d]];
   for(const face of [[0,2,1],[3,4,5],[0,3,5,2],[1,2,5,4],[0,1,4,3]]){
    const [a,b,c]=face.map(i=>p[i]),u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const center=face.reduce((sum,i)=>sum.map((x,k)=>x+p[i][k]/face.length),[0,0,0]),sign=n.reduce((sum,x,k)=>sum+x*center[k],0)>=0?1:-1,length=Math.hypot(...n),normal=n.map(x=>x/length*sign),frame=surfaceFrame(box,normal,style);
    for(const i of face){const point=p[i],uv=[frame.tangent,frame.bitangent].map(axis=>axis.reduce((sum,x,k)=>sum+x*point[k],0));vertices.push(box.x+point[0],box.y+point[1],box.z+point[2],...color,...normal,...uv,0,style,...frame.tangent);}
    for(let i=1;i<face.length-1;i++)if(sign>0)indices.push(offset,offset+i+1,offset+i);else indices.push(offset,offset+i,offset+i+1);offset+=face.length;
   }
   rotateMesh();continue;
  }
  if(box.shape==='round'||box.shape==='cylinder'){
   const maxDim=Math.max(box.w,box.h,box.d),segments=box.segments||(maxDim<.25?6:10),rings=box.shape==='round'?(box.rings||(maxDim<.25?3:5)):1;
   const point=(u,v)=>{
    const angle=u*Math.PI*2;
    if(box.shape==='round'){const lat=(v-.5)*Math.PI;return [Math.cos(angle)*Math.cos(lat),Math.sin(lat),Math.sin(angle)*Math.cos(lat)];}
    return [Math.cos(angle),Math.sin(angle),v*2-1];
   };
   for(let row=0;row<rings;row++)for(let column=0;column<segments;column++){
    const coords=[[column/segments,row/rings],[(column+1)/segments,row/rings],[(column+1)/segments,(row+1)/rings],[column/segments,(row+1)/rings]];
    for(const [u,v] of coords){
     const p=point(u,v),n=box.shape==='round'?[p[0]/box.w,p[1]/box.h,p[2]/box.d]:[p[0],p[1],0],length=Math.hypot(...n)||1;
     const tangent=box.shape==='round'?[-Math.sin(u*Math.PI*2),0,Math.cos(u*Math.PI*2)]:[-p[1],p[0],0];
     vertices.push(box.x+p[0]*box.w/2,box.y+p[1]*box.h/2,box.z+p[2]*box.d/2,...color,...n.map(x=>x/length),u,v,0,style,...tangent);
    }
    if(box.shape==='cylinder')indices.push(offset,offset+2,offset+1,offset,offset+3,offset+2);
    else indices.push(offset,offset+1,offset+2,offset,offset+2,offset+3);offset+=4;
   }
   if(box.shape==='cylinder')for(const sign of [-1,1])for(let i=0;i<segments;i++){
    for(const angle of [null,i*Math.PI*2/segments,(i+1)*Math.PI*2/segments]){
     const x=angle===null?0:Math.cos(angle),y=angle===null?0:Math.sin(angle);
     vertices.push(box.x+x*box.w/2,box.y+y*box.h/2,box.z+sign*box.d/2,...color,0,0,sign,x*.5+.5,y*.5+.5,0,style,1,0,0);
    }
    if(sign>0)indices.push(offset,offset+2,offset+1);else indices.push(offset,offset+1,offset+2);offset+=3;
   }
   rotateMesh();continue;
  }
  if(box.shape==='leaf'){
   // Tapered, faceted leaves with actual depth; no alpha quads or blocking foliage.
   const points=[[0,-.5,0],[-.5,-.08,0],[0,.5,0],[.5,-.08,0],[0,0,.5],[0,0,-.5]];
   const transformed=points.map(([x,y,z])=>{
    const px=x*box.w+(y+.5)*(box.lean||0),pz=z*box.d;
    return [box.x+px,box.y+y*box.h,box.z+pz];
   });
   for(const triangle of [[0,1,4],[1,2,4],[2,3,4],[3,0,4],[1,0,5],[2,1,5],[3,2,5],[0,3,5]]){
    const [a,b,c]=triangle.map(i=>transformed[i]),ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]);
    const normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    const length=Math.hypot(...normal)||1;
    const n=normal.map(v=>-v/length),frame=surfaceFrame(box,n,style);
    for(const index of triangle){const p=transformed[index],uv=points[index];vertices.push(...p,...color,...n,uv[0]+.5,uv[1]+.5,0,style,...frame.tangent);}
    indices.push(offset,offset+1,offset+2);offset+=3;
   }
   rotateMesh();continue;
  }
  for(const face of faces){
   const art=box.art!==undefined&&box.front===face.dir?box.art+1:0;
   const frame=surfaceFrame(box,face.normal,style);
   face.corners.forEach(([dx,dy,dz],i)=>{
    const u=(i===0||i===3)?0:1,v=i<2?0:1;
    const position=[dx*box.w/2,dy*box.h/2,dz*box.d/2];
    if(box.mat==='floor'||box.id.startsWith('floor-up-')){position[0]+=box.x;position[2]+=box.z;}
    const uv=[frame.tangent,frame.bitangent].map((axis,j)=>axis.reduce((sum,a,k)=>sum+a*position[k],0)*frame.scale[j]);
    vertices.push(box.x+dx*box.w/2,box.y+dy*box.h/2,box.z+dz*box.d/2,
     color[0],color[1],color[2],...face.normal,art?((art-1)+u)/ART_COUNT:uv[0],art?v:uv[1],art?1:0,style,...frame.tangent);
   });
   indices.push(offset,offset+1,offset+2,offset,offset+2,offset+3);offset+=4;
  }
  rotateMesh();
 }
 return {vertices:new Float32Array(vertices),indices:new Uint16Array(indices),groups,ranges};
}
export class HouseRenderer {
 constructor(canvas,quality='medium'){
  this.canvas=canvas;this.quality=quality;
  const gl=canvas.getContext('webgl',{alpha:false,stencil:true,antialias:false,powerPreference:'low-power',preserveDrawingBuffer:false});
  if(!gl)throw Error('El navegador no permite WebGL. Activa aceleración gráfica o prueba otro navegador.');
  this.gl=gl;this.programs={medium:program(gl),low:program(gl,true)};this.program=this.programs[quality==='low'?'low':'medium'];this.texture=createAtlas(gl);this.materialQuality=quality;this.materialTextures=createMaterials(gl,quality);
  this.mirrorSupported=gl.getContextAttributes().stencil;this.mirrorBuffers=Array.from({length:8},()=>gl.createBuffer());this.mirrorDrawn=false;
  this.vbo=gl.createBuffer();this.ibo=gl.createBuffer();this.count=0;
  this.dynamicVbo=gl.createBuffer();this.dynamicIbo=gl.createBuffer();this.dynamicCount=0;this.dynamicBoxes=[];
  this.handVbo=gl.createBuffer();this.handIbo=gl.createBuffer();this.handGeometry={};this.handVertices=null;this.handIndexReady=false;
  this.lightPixels=new Uint8Array(LIGHT_DEPTH_SIZE*LIGHT_DEPTH_SIZE);this.occluders=[];this.lightPose='';
  this.lightTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.lightTexture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,LIGHT_DEPTH_SIZE,LIGHT_DEPTH_SIZE,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,this.lightPixels);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  this.locations={};
  for(const [quality,p] of Object.entries(this.programs)){
   const atrib={},uniform={};for(const key of ['aPos','aCol','aNormal','aUV','aArt','aStyle','aTangent'])atrib[key]=gl.getAttribLocation(p,key);
   for(const key of ['uEye','uLightEye','uRight','uUp','uForward','uProjection','uNear','uFar','uAtlas','uFlash','uTime','uLightDepth','uOcclude','uMaterials','uAtlasSize','uTileSize','uGutter','uInner','uMirrorPass'])uniform[key]=gl.getUniformLocation(p,key);
   this.locations[quality]={atrib,uniform};
  }
  Object.assign(this,this.locations[quality==='low'?'low':'medium']);
  gl.useProgram(this.program);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.disable(gl.BLEND);gl.clearColor(.045,.065,.11,1);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.uniform.uAtlas,0);
  gl.uniform1i(this.uniform.uLightDepth,1);
  gl.uniform1i(this.uniform.uMaterials,2);
 }
 rebuild(boxes){
  // Opaque room walls write depth before furniture and the large exterior slabs.
  // This avoids shading the garden and neighboring houses behind interior walls.
  const order=b=>/^(west-|east-|north-|south-|music-west|music-south|kitchen-divider|bath-divider|stairwell-side)/.test(b.id)?0:/^(garden-|neighbor-|distant-|tree-|car-|moon|road|pavement|front-path)/.test(b.id)?4:/^(base|floor-up-|ceiling|roof)/.test(b.id)?3:1;
  const gl=this.gl,{vertices,indices}=geometry(boxes.filter(b=>!b.dynamic).sort((a,b)=>order(a)-order(b)));this.count=indices.length;
  this.dynamicBoxes=boxes.filter(b=>b.dynamic);
  const dynamic=geometry(this.dynamicBoxes);this.dynamicCount=dynamic.indices.length;
  this.dynamicTemplate=dynamic.vertices;this.dynamicVertices=new Float32Array(dynamic.vertices);this.dynamicRanges=dynamic.ranges;
  this.dynamicOrigins=this.dynamicBoxes.map(b=>[b.x,b.y,b.z,b.yaw||0]);this.dynamicPositions=new Float32Array(this.dynamicBoxes.length*4);this.dynamicPositions.fill(Infinity);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamicVbo);gl.bufferData(gl.ARRAY_BUFFER,this.dynamicVertices,gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.dynamicIbo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,dynamic.indices,gl.STATIC_DRAW);
  this.vertexCount=(vertices.length+dynamic.vertices.length)/16;this.triangleCount=(indices.length+dynamic.indices.length)/3;
  this.occluders=boxes.filter(b=>b.solid);this.lightPose='';
  if(vertices.length/16>65530)throw Error('Demasiada geometría para WebGL1');
  gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  this.bind(this.vbo,this.ibo);
  this.prepareMirror(boxes);
 }
 prepareMirror(boxes){
  const gl=this.gl;
  this.mirrorBoxes=boxes;this.mirrorEquipment='flashlight';
  this.mirrorMeshes=[geometry([{...BATH_MIRROR,x:BATH_MIRROR.x-.0005}]),geometry(boxes.filter(b=>!b.dynamic&&!b.id.includes('mirror'))),geometry(kittyMirrorPieces()),{vertices:new Float32Array(this.dynamicVertices.length),indices:geometry(this.dynamicBoxes).indices}];
  reflectMesh(this.mirrorMeshes[1].vertices);
  this.kittyVertices=new Float32Array(this.mirrorMeshes[2].vertices.length);this.mirrorPose=null;this.mirrorUploads=0;this.characterBinding=createRigBinding(this.mirrorMeshes[2].groups);
  this.mirrorMeshes.forEach((mesh,i)=>{gl.bindBuffer(gl.ARRAY_BUFFER,this.mirrorBuffers[i*2]);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,i===2?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.mirrorBuffers[i*2+1]);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);});
 }
 drawMirror(camera,motion){
  const gl=this.gl;this.mirrorDrawn=false;
  if(!this.mirrorSupported||!mirrorVisible(camera,motion.bathDoorAmount||0))return;
  if(![0,-.6,.6].some(dz=>!lineBlocked(this.occluders,camera,{x:BATH_MIRROR.x-.03,y:BATH_MIRROR.y,z:BATH_MIRROR.z+dz})))return;
  const equipment=motion.animator?.performing?'empty':motion.equipment||'flashlight';
  if(equipment!==this.mirrorEquipment){this.mirrorEquipment=equipment;this.mirrorMeshes[2]=geometry(kittyMirrorPieces(equipment));this.kittyVertices=new Float32Array(this.mirrorMeshes[2].vertices.length);this.characterBinding=createRigBinding(this.mirrorMeshes[2].groups);this.mirrorPose=null;gl.bindBuffer(gl.ARRAY_BUFFER,this.mirrorBuffers[4]);gl.bufferData(gl.ARRAY_BUFFER,this.kittyVertices,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.mirrorBuffers[5]);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,this.mirrorMeshes[2].indices,gl.STATIC_DRAW);}
  const draw=i=>{this.bind(this.mirrorBuffers[i*2],this.mirrorBuffers[i*2+1]);gl.drawElements(gl.TRIANGLES,this.mirrorMeshes[i].indices.length,gl.UNSIGNED_SHORT,0);};
  // Mark only visible mirror fragments. Walls/door/furniture still occlude it.
  gl.enable(gl.STENCIL_TEST);gl.stencilMask(0xff);gl.stencilFunc(gl.ALWAYS,1,0xff);gl.stencilOp(gl.KEEP,gl.KEEP,gl.REPLACE);
  gl.colorMask(false,false,false,false);gl.depthMask(false);gl.depthFunc(gl.LEQUAL);draw(0);
  gl.stencilFunc(gl.EQUAL,1,0xff);gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);gl.stencilMask(0);
  // Reset depth only inside the aperture, leaving the rest of the house intact.
  gl.depthMask(true);gl.depthFunc(gl.ALWAYS);gl.depthRange(1,1);draw(0);
  gl.depthRange(0,1);gl.depthFunc(gl.LESS);gl.colorMask(true,true,true,true);
  gl.uniform1f(this.uniform.uFlash,0);gl.uniform1f(this.uniform.uOcclude,0);
  gl.uniform1f(this.uniform.uMirrorPass,1);gl.frontFace(gl.CW);draw(1);
  this.mirrorMeshes[3].vertices.set(this.dynamicVertices);reflectMesh(this.mirrorMeshes[3].vertices);gl.bindBuffer(gl.ARRAY_BUFFER,this.mirrorBuffers[6]);gl.bufferData(gl.ARRAY_BUFFER,this.mirrorMeshes[3].vertices,gl.DYNAMIC_DRAW);draw(3);
  const animator=motion.animator;
  const pose=[camera.x,camera.y,camera.z,camera.yaw,motion.feetY,!!motion.crouched,animator?.reduced&&animator?.weight===0&&!animator?.performing?0:animator?.time,animator?.distance,animator?.weight,equipment,animator?.emote,animator?.emoteTime,animator?.transition?.age];
  if(!this.mirrorPose||pose.some((v,i)=>v!==this.mirrorPose[i])){
   if(animator)evaluateRig(this.characterBinding,animator.sample(motion.crouched?'crouch':motion.equipment==='phone'?'hold-phone':'locomotion'));
   poseReflectedKitty(this.mirrorMeshes[2].vertices,this.kittyVertices,camera,motion,animator?this.characterBinding:null);
   gl.bindBuffer(gl.ARRAY_BUFFER,this.mirrorBuffers[4]);gl.bufferSubData(gl.ARRAY_BUFFER,0,this.kittyVertices);this.mirrorPose=pose;this.mirrorUploads++;
  }
  draw(2);
  if(motion.pursuer?.active)this.drawPursuer(motion.pursuer,true);
  gl.uniform1f(this.uniform.uMirrorPass,0);gl.frontFace(gl.CCW);gl.colorMask(false,false,false,false);gl.depthFunc(gl.ALWAYS);draw(0);
  gl.colorMask(true,true,true,true);gl.depthFunc(gl.LESS);gl.stencilMask(0xff);gl.disable(gl.STENCIL_TEST);this.mirrorDrawn=true;
 }
 updateDynamic(time=0,motion={}){
  const gl=this.gl;let changed=false;
  gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamicVbo);
  const reduced=motion.reduced||false;
  const bobAmp=reduced?0:0.012,swayAmp=reduced?0:0.14;
  for(let i=0;i<this.dynamicBoxes.length;i++){
   const box=this.dynamicBoxes[i],source=box.source;
   if(source){
    const offset=box.sourceOffset||[0,0,0];
    const bob=box.id.startsWith('pickup-')?Math.sin(time*3.2+(source.x+source.z)*2.5)*bobAmp:0;
    const sway=(box.id.includes('bow-left')||box.id.includes('bow-right'))?Math.sin(time*4.2)*swayAmp:0;
    box.x=source.x+offset[0];
    box.y=source.concealed?-100:source.y+offset[1]+bob;
    box.z=source.z+offset[2];
    if(sway)box.yaw=(box.baseYaw||0)+sway;
   } else if(box.ambient==='curtain'){
    const orig=this.dynamicOrigins[i];
    box.x=orig[0]+(reduced?0:Math.sin(time*1.8+(orig[0]+orig[2])*1.5)*0.014);
   } else if(box.ambient==='pendulum'){
    const orig=this.dynamicOrigins[i];
    const swing=reduced?0:Math.sin(time*1.6+(orig[0]+orig[2]))*0.018;
    box.x=orig[0]+swing;box.z=orig[2]+swing*0.6;
   }
   const o4=i*4,bx=box.x,by=box.y,bz=box.z,byaw=box.yaw||0;
   if(Math.fround(bx)===this.dynamicPositions[o4]&&Math.fround(by)===this.dynamicPositions[o4+1]&&Math.fround(bz)===this.dynamicPositions[o4+2]&&Math.fround(byaw)===this.dynamicPositions[o4+3])continue;
   this.dynamicPositions[o4]=bx;this.dynamicPositions[o4+1]=by;this.dynamicPositions[o4+2]=bz;this.dynamicPositions[o4+3]=byaw;
   const {start,end}=this.dynamicRanges[i],origin=this.dynamicOrigins[i];
   const angle=byaw-origin[3],c=Math.cos(angle),s=Math.sin(angle);
   for(let v=start;v<end;v+=16){
    const x=this.dynamicTemplate[v]-origin[0],z=this.dynamicTemplate[v+2]-origin[2];
    this.dynamicVertices[v]=bx+x*c-z*s;
    this.dynamicVertices[v+1]=this.dynamicTemplate[v+1]+by-origin[1];
    this.dynamicVertices[v+2]=bz+x*s+z*c;
    for(const offset of [6,13]){
     const nx=this.dynamicTemplate[v+offset],nz=this.dynamicTemplate[v+offset+2];
     this.dynamicVertices[v+offset]=nx*c-nz*s;
     this.dynamicVertices[v+offset+2]=nx*s+nz*c;
    }
   }
   gl.bufferSubData(gl.ARRAY_BUFFER,start*4,this.dynamicVertices.subarray(start,end));changed=true;
  }
  if(changed)this.lightPose='';
 }
 bind(vertexBuffer,indexBuffer){
  const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
  const stride=16*4,layout=[['aPos',3,0],['aCol',3,3],['aNormal',3,6],['aUV',2,9],['aArt',1,11],['aStyle',1,12],['aTangent',3,13]];
  for(const [name,size,start] of layout){const at=this.atrib[name];if(at<0)continue;gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,size,gl.FLOAT,false,stride,start*4);}
 }
 drawFirstPerson(camera,right,up,forward,time,flash,motion={}){
  drawViewModel(this,motion.equipment||'flashlight',{camera,right,up,forward,time,flash,motion});
 }
 drawClimbingHands(hands){
  const gl=this.gl;gl.uniform1f(this.uniform.uFlash,0);
  for(let side=0;side<2;side++){
   const model=this.handGeometry['climb'+side]??=geometry(climbingHandPieces(side?-1:1));
   const vertices=this.climbVertices??=new Float32Array(model.vertices.length);vertices.set(model.vertices);
   for(let i=0;i<vertices.length;i+=16){vertices[i]+=hands[side].x;vertices[i+1]+=hands[side].y;vertices[i+2]+=hands[side].z;}
   gl.bindBuffer(gl.ARRAY_BUFFER,this.handVbo);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.handIbo);if(this.handIndexKind!=='climb'){gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,model.indices,gl.STATIC_DRAW);this.handIndexKind='climb';}
   this.bind(this.handVbo,this.handIbo);gl.drawElements(gl.TRIANGLES,model.indices.length,gl.UNSIGNED_SHORT,0);
  }
 }
 drawActor(subject,motion){
  const equipment=motion.equipment||'flashlight',gl=this.gl;
  if(this.actorEquipment!==equipment){this.actorEquipment=equipment;this.actorMesh=geometry(kittyMirrorPieces(equipment));this.actorVertices=new Float32Array(this.actorMesh.vertices.length);this.actorBinding=createRigBinding(this.actorMesh.groups);}
  if(motion.animator)evaluateRig(this.actorBinding,motion.animator.sample('look-behind',.5));
  poseReflectedKitty(this.actorMesh.vertices,this.actorVertices,subject,{feetY:motion.feetY},this.actorBinding);reflectMesh(this.actorVertices);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.handVbo);gl.bufferData(gl.ARRAY_BUFFER,this.actorVertices,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.handIbo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,this.actorMesh.indices,gl.STATIC_DRAW);this.handIndexKind='actor';this.bind(this.handVbo,this.handIbo);gl.drawElements(gl.TRIANGLES,this.actorMesh.indices.length,gl.UNSIGNED_SHORT,0);
 }
 drawPursuer(actor,mirrored=false){
  const gl=this.gl;if(!this.pursuerMesh){const parts=pursuerPieces();this.pursuerMesh=geometry(parts);this.pursuerGroups=parts.map((p,i)=>({id:p.id,start:this.pursuerMesh.ranges[i].start/16,end:this.pursuerMesh.ranges[i].end/16}));this.pursuerVertices=new Float32Array(this.pursuerMesh.vertices.length);this.pursuerVbo=gl.createBuffer();this.pursuerIbo=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.pursuerIbo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,this.pursuerMesh.indices,gl.STATIC_DRAW);}
  const base=this.pursuerMesh.vertices,out=this.pursuerVertices,c=Math.cos(actor.yaw),s=Math.sin(actor.yaw),stride=Math.sin(actor.walk*7)*.30;
  out.set(base);
  for(const group of this.pursuerGroups){const limb=/^(leg|shoe|arm|hand)/.test(group.id),side=group.id.endsWith('-1')?-1:1,arm=/^(arm|hand)/.test(group.id),angle=limb?stride*side*(arm?-1:1):0,ca=Math.cos(angle),sa=Math.sin(angle),pivot=arm?1.35:.53;
   for(let i=group.start*16;i<group.end*16;i+=16){const lx=base[i],dy=base[i+1]-pivot,lz=base[i+2],y=limb?pivot+dy*ca-lz*sa:base[i+1],z=limb?dy*sa+lz*ca:lz;out[i]=actor.x+lx*c+z*s;out[i+1]=actor.y+y;out[i+2]=actor.z-lx*s+z*c;for(const k of [6,13]){const nx=base[i+k],ny=base[i+k+1]*ca-base[i+k+2]*sa,nz=base[i+k+1]*sa+base[i+k+2]*ca;out[i+k]=nx*c+nz*s;out[i+k+1]=ny;out[i+k+2]=-nx*s+nz*c;}}
  }
  if(mirrored)reflectMesh(out);gl.bindBuffer(gl.ARRAY_BUFFER,this.pursuerVbo);gl.bufferData(gl.ARRAY_BUFFER,out,gl.DYNAMIC_DRAW);this.bind(this.pursuerVbo,this.pursuerIbo);gl.drawElements(gl.TRIANGLES,this.pursuerMesh.indices.length,gl.UNSIGNED_SHORT,0);
 }
 resize(){
  const scale=this.quality==='low'?.55:.80;
  const dpr=Math.min(window.devicePixelRatio||1,1.7)*scale;
  const w=Math.min(1200,Math.max(1,Math.round(this.canvas.clientWidth*dpr)));
  const h=Math.min(760,Math.max(1,Math.round(this.canvas.clientHeight*dpr)));
  if(w!==this.canvas.width||h!==this.canvas.height){this.canvas.width=w;this.canvas.height=h;this.gl.viewport(0,0,w,h);}
 }
 render(camera,flash,time,showHand=false,motion={}){
  this.lastShowHand=showHand;
  this.resize();const gl=this.gl,quality=this.quality==='low'?'low':'medium';
  if(this.materialQuality!==quality){
   this.materialQuality=quality;
   for(const t of this.materialTextures)gl.deleteTexture(t);
   this.materialTextures=createMaterials(gl,quality);
  }
  this.program=this.programs[quality];Object.assign(this,this.locations[quality]);gl.useProgram(this.program);
  gl.uniform1i(this.uniform.uAtlas,0);gl.uniform1i(this.uniform.uLightDepth,1);gl.uniform1i(this.uniform.uMaterials,2);
  const isLow=quality==='low';
  gl.uniform1f(this.uniform.uAtlasSize,isLow?ATLAS_SIZE:ATLAS_SIZE_MED);
  gl.uniform1f(this.uniform.uTileSize,isLow?TILE_SIZE:TILE_SIZE_MED);
  gl.uniform1f(this.uniform.uGutter,isLow?GUTTER:GUTTER_MED);
  gl.uniform1f(this.uniform.uInner,isLow?INNER:INNER_MED);
  gl.uniform1f(this.uniform.uMirrorPass,0);this.updateDynamic(time,motion);
  const cy=Math.cos(camera.yaw),sy=Math.sin(camera.yaw),cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch);
  const right=[cy,0,-sy],forward=[sy*cp,sp,cy*cp],up=[-sy*sp,cp,-cy*sp];
  // Keep the light source inside the player's collision radius near walls.
  const light={x:camera.x+right[0]*.07+forward[0]*.06-up[0]*.04,y:camera.y+forward[1]*.06-up[1]*.04,z:camera.z+right[2]*.07+forward[2]*.06-up[2]*.04};
  gl.uniform3f(this.uniform.uEye,camera.x,camera.y,camera.z);
  gl.uniform3f(this.uniform.uLightEye,light.x,light.y,light.z);
  gl.uniform3fv(this.uniform.uRight,right);gl.uniform3fv(this.uniform.uUp,up);gl.uniform3fv(this.uniform.uForward,forward);
  gl.uniform2f(this.uniform.uProjection,1.30*this.canvas.height/this.canvas.width,1.30);
  gl.uniform1f(this.uniform.uNear,.07);gl.uniform1f(this.uniform.uFar,45);
  gl.uniform1f(this.uniform.uFlash,flash?1:0);gl.uniform1f(this.uniform.uTime,time);
  gl.uniform1f(this.uniform.uOcclude,this.quality==='low'?0:1);
  // Update only when the camera or collision geometry changes. One tiny texture
  // lookup replaces multiple ray/box tests in every illuminated pixel.
  if(flash&&this.quality!=='low'){
   const pose=[camera.x,camera.y,camera.z,camera.yaw,camera.pitch].join(',');
   if(pose!==this.lightPose){
    lightDepthField(this.occluders,light,right,up,forward,this.lightPixels);this.lightPose=pose;
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.lightTexture);
    gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,LIGHT_DEPTH_SIZE,LIGHT_DEPTH_SIZE,gl.LUMINANCE,gl.UNSIGNED_BYTE,this.lightPixels);
    gl.activeTexture(gl.TEXTURE0);
   }
  }
  gl.stencilMask(0xff);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
  // Closed doors are useful depth occluders too. All these surfaces are opaque.
  if(this.dynamicCount){this.bind(this.dynamicVbo,this.dynamicIbo);gl.drawElements(gl.TRIANGLES,this.dynamicCount,gl.UNSIGNED_SHORT,0);}
  this.bind(this.vbo,this.ibo);
  gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);
  if(motion.pursuer?.active)this.drawPursuer(motion.pursuer);
  if(!motion.thirdPerson)this.drawMirror(camera,motion);else this.drawActor(motion.thirdPerson,motion);
  if(motion.introHands)this.drawClimbingHands(motion.introHands);
  if(showHand)this.drawFirstPerson(camera,right,up,forward,time,flash,motion);
 }
 destroy(){const gl=this.gl;if(this.pursuerVbo)gl.deleteBuffer(this.pursuerVbo);if(this.pursuerIbo)gl.deleteBuffer(this.pursuerIbo);for(const b of this.mirrorBuffers)gl.deleteBuffer(b);gl.deleteTexture(this.texture);gl.deleteTexture(this.lightTexture);for(const texture of this.materialTextures)gl.deleteTexture(texture);gl.deleteBuffer(this.vbo);gl.deleteBuffer(this.ibo);gl.deleteBuffer(this.dynamicVbo);gl.deleteBuffer(this.dynamicIbo);gl.deleteBuffer(this.handVbo);gl.deleteBuffer(this.handIbo);for(const p of Object.values(this.programs))gl.deleteProgram(p);this.canvas.width=1;this.canvas.height=1;}
}
export function pickupGeometry(objects){
 return objects.filter(o=>!o.taken&&(!o.concealed||o.dynamic)&&['battery','note','key'].includes(o.kind)).flatMap(o=>{
  if(o.kind==='key'){
   const pieces=[];
   const piece=(id,dx,dy,dz,w,h,d,mat='brass',extra={})=>({id:'pickup-'+o.id+'-'+id,x:o.x+dx,y:o.y+dy,z:o.z+dz,w,h,d,mat,solid:false,dynamic:true,source:o,sourceOffset:[dx,dy,dz],glow:true,...extra});
   for(let i=0;i<8;i++){const angle=i*Math.PI/4;pieces.push(piece('ring-'+i,Math.cos(angle)*.065,0,Math.sin(angle)*.065-.055,.045,.025,.045));}
   pieces.push(piece('shaft',0,0,.08,.035,.025,.18),piece('tooth',.028,0,.13,.07,.025,.025),piece('bow-left',-.045,.025,-.055,.065,.035,.04,'pink',{baseYaw:-.15}),piece('bow-right',.045,.025,-.055,.065,.035,.04,'pink',{baseYaw:.15}));
   return pieces;
  }
  return [{
   id:'pickup-'+o.id,x:o.x,y:o.y,z:o.z,w:o.kind==='note'?.32:.21,h:o.kind==='note'?.10:.25,d:.22,
   mat:o.kind==='note'?'paper':'brass',solid:false,dynamic:true,source:o,glow:true
  }];
 });
}
