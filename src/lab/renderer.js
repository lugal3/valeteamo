import {VERTEX_SHADER as VS,FRAGMENT_SHADER as FS} from './material-shaders.js';
// Minimal WebGL1 3D renderer: real perspective, depth buffer, world geometry and spotlight.
// No additional packages, CDNs, runtime downloads or concurrent Phaser loops.
import {MATERIAL} from './world.js';
import {materialPixels,materialStyle,surfaceFrame,ATLAS_SIZE} from './materials.js';
import {lightDepthField,LIGHT_DEPTH_SIZE,LIGHT_REACH,LIGHT_SPREAD} from './lighting.js';
function shader(gl,kind,source){const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error('Shader: '+msg);}return s;}
function program(gl,low=false){const source=low?FS.replace('uniform float uFlash,uOcclude;','uniform float uFlash; const float uOcclude=0.0;'):FS;const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,VS),f=shader(gl,gl.FRAGMENT_SHADER,source);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p)||'Shader linkage');return p;}
function createAtlas(gl){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
 const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
 const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
 for(let a=0;a<4;a++){
  const X=a*64;
  rect(X,0,64,64,a===3?'#303048':a===1?'#b49ca3':'#e1c5ca');
  rect(X+5,5,54,54,a===3?'#3c3049':'#f7d9d2');
  rect(X+11,10,42,42,a===3?'#55506a':'#fff3e5');
  rect(X+12,12,13,14,'#fff9f0');rect(X+39,12,13,14,'#fff9f0');
  rect(X+14,21,36,31,'#fff9f0');
  rect(X+22,35,4,5,'#222638');rect(X+39,35,4,5,'#222638');
  rect(X+30,42,5,3,'#e5ab48');
  rect(X+12,42,12,2,'#90707a');rect(X+42,42,10,2,'#90707a');
  rect(X+12,46,12,2,'#90707a');rect(X+42,46,10,2,'#90707a');
  rect(X+15,14,18,9,a===3?'#bd859d':'#c75378');
  rect(X+23,11,6,16,a===3?'#dba1c1':'#ff7594');
  rect(X+22,17,5,4,'#f5c6d2');
  if(a===1){rect(X+46,47,5,7,'#8b283c');rect(X+40,51,12,3,'#9b3447');}
  if(a===2){rect(X+22,35,6,2,'#343044');rect(X+39,35,6,2,'#343044');}
  if(a===3){rect(X+24,27,20,2,'#7f607b');rect(X+46,48,3,6,'#d06a85');}
 }
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
function createMaterials(gl){
 const pixels=materialPixels(),textures=[];
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 for(const [i,data] of [pixels.color].entries()){
  const texture=gl.createTexture();textures.push(texture);gl.activeTexture(gl.TEXTURE2+i);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,ATLAS_SIZE,ATLAS_SIZE,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
  // Tile-local repeat uses gutters. Linear filtering avoids cross-tile mip bleed.
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 }
 return textures;
}
function geometry(boxes){
 const vertices=[],indices=[],colors=MATERIAL;let offset=0;
 for(const box of boxes){
  const color=colors[box.mat]||colors.cream;
  const style=materialStyle(box);
  if(box.shape==='round'||box.shape==='cylinder'){
   const segments=10,rings=box.shape==='round'?5:1;
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
   continue;
  }
  if(box.shape==='leaf'){
   // Tapered, faceted leaves with actual depth; no alpha quads or blocking foliage.
   const points=[[0,-.5,0],[-.5,-.08,0],[0,.5,0],[.5,-.08,0],[0,0,.5],[0,0,-.5]];
   const transformed=points.map(([x,y,z])=>{
    const px=x*box.w+(y+.5)*(box.lean||0),pz=z*box.d,angle=box.yaw||0;
    return [box.x+px*Math.cos(angle)-pz*Math.sin(angle),box.y+y*box.h,box.z+px*Math.sin(angle)+pz*Math.cos(angle)];
   });
   for(const triangle of [[0,1,4],[1,2,4],[2,3,4],[3,0,4],[1,0,5],[2,1,5],[3,2,5],[0,3,5]]){
    const [a,b,c]=triangle.map(i=>transformed[i]),ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]);
    const normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    const length=Math.hypot(...normal)||1;
    const n=normal.map(v=>-v/length),frame=surfaceFrame(box,n,style);
    for(const index of triangle){const p=transformed[index],uv=points[index];vertices.push(...p,...color,...n,uv[0]+.5,uv[1]+.5,0,style,...frame.tangent);}
    indices.push(offset,offset+1,offset+2);offset+=3;
   }
   continue;
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
     color[0],color[1],color[2],...face.normal,art?((art-1)+u)/4:uv[0],art?v:uv[1],art?1:0,style,...frame.tangent);
   });
   indices.push(offset,offset+1,offset+2,offset,offset+2,offset+3);offset+=4;
  }
 }
 return {vertices:new Float32Array(vertices),indices:new Uint16Array(indices)};
}
export class HouseRenderer {
 constructor(canvas,quality='medium'){
  this.canvas=canvas;this.quality=quality;
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power',preserveDrawingBuffer:false});
  if(!gl)throw Error('El navegador no permite WebGL. Activa aceleración gráfica o prueba otro navegador.');
  this.gl=gl;this.programs={medium:program(gl),low:program(gl,true)};this.program=this.programs[quality==='low'?'low':'medium'];this.texture=createAtlas(gl);this.materialTextures=createMaterials(gl);
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
   for(const key of ['uEye','uLightEye','uRight','uUp','uForward','uProjection','uNear','uFar','uAtlas','uFlash','uTime','uLightDepth','uOcclude','uMaterials'])uniform[key]=gl.getUniformLocation(p,key);
   this.locations[quality]={atrib,uniform};
  }
  Object.assign(this,this.locations[quality==='low'?'low':'medium']);
  gl.useProgram(this.program);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.disable(gl.BLEND);gl.clearColor(.14,.11,.19,1);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.uniform.uAtlas,0);
  gl.uniform1i(this.uniform.uLightDepth,1);
  gl.uniform1i(this.uniform.uMaterials,2);
 }
 rebuild(boxes){
  const gl=this.gl,{vertices,indices}=geometry(boxes.filter(b=>!b.dynamic));this.count=indices.length;
  this.dynamicBoxes=boxes.filter(b=>b.dynamic);
  const dynamic=geometry(this.dynamicBoxes);this.dynamicCount=dynamic.indices.length;
  this.dynamicTemplate=dynamic.vertices;this.dynamicVertices=new Float32Array(dynamic.vertices);
  this.dynamicOrigins=this.dynamicBoxes.map(b=>[b.x,b.y,b.z]);this.dynamicPositions=this.dynamicOrigins.map(()=>[Infinity,Infinity,Infinity]);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamicVbo);gl.bufferData(gl.ARRAY_BUFFER,this.dynamicVertices,gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.dynamicIbo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,dynamic.indices,gl.STATIC_DRAW);
  this.vertexCount=(vertices.length+dynamic.vertices.length)/16;this.triangleCount=(indices.length+dynamic.indices.length)/3;
  this.occluders=boxes.filter(b=>b.solid);this.lightPose='';
  if(vertices.length/16>65530)throw Error('Demasiada geometría para WebGL1');
  gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  this.bind(this.vbo,this.ibo);
 }
 updateDynamic(){
  const gl=this.gl;let changed=false;
  gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamicVbo);
  for(let i=0;i<this.dynamicBoxes.length;i++){
   const box=this.dynamicBoxes[i],source=box.source;
   if(source){const offset=box.sourceOffset||[0,0,0];box.x=source.x+offset[0];box.y=source.concealed?-100:source.y+offset[1];box.z=source.z+offset[2];}
   const position=[box.x,box.y,box.z],old=this.dynamicPositions[i];
   if(position.every((v,k)=>v===old[k]))continue;
   const start=i*24*16,end=start+24*16,origin=this.dynamicOrigins[i];
   for(let v=start;v<end;v+=16)for(let axis=0;axis<3;axis++)this.dynamicVertices[v+axis]=this.dynamicTemplate[v+axis]+position[axis]-origin[axis];
   gl.bufferSubData(gl.ARRAY_BUFFER,start*4,this.dynamicVertices.subarray(start,end));this.dynamicPositions[i]=position;changed=true;
  }
  if(changed)this.lightPose='';
 }
 bind(vertexBuffer,indexBuffer){
  const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
  const stride=16*4,layout=[['aPos',3,0],['aCol',3,3],['aNormal',3,6],['aUV',2,9],['aArt',1,11],['aStyle',1,12],['aTangent',3,13]];
  for(const [name,size,start] of layout){const at=this.atrib[name];if(at<0)continue;gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,size,gl.FLOAT,false,stride,start*4);}
 }
 drawFirstPerson(camera,right,up,forward,time,flash,motion={}){
  // Camera-space mitt/paw and real flashlight silhouette. Soft pads, rounded
  // approximated fingers, cuff, grip switch, reflector and luminous glass.
  const bob=0; // The base mesh is cached; walking/action motion is applied below.
  const pieces=[
   {id:'sleeve',x:.41,y:-.51+bob,z:.66,w:.37,h:.22,d:.23,mat:'bow'},
   {id:'cuff',x:.40,y:-.46+bob,z:.71,w:.36,h:.13,d:.25,mat:'glove'},
   {id:'paw-palm',x:.38,y:-.37+bob,z:.79,w:.39,h:.27,d:.34,mat:'glove'},
   {id:'paw-finger-l',x:.235,y:-.255+bob,z:.80,w:.14,h:.18,d:.22,mat:'glove'},
   {id:'paw-finger-m',x:.37,y:-.225+bob,z:.82,w:.15,h:.20,d:.24,mat:'glove'},
   {id:'paw-finger-r',x:.51,y:-.265+bob,z:.80,w:.14,h:.18,d:.22,mat:'glove'},
   {id:'paw-thumb',x:.19,y:-.38+bob,z:.88,w:.17,h:.18,d:.22,mat:'glove'},
   {id:'pad-main',x:.365,y:-.38+bob,z:.598,w:.18,h:.11,d:.019,mat:'pawpad'},
   {id:'pad-l',x:.25,y:-.282+bob,z:.683,w:.077,h:.062,d:.02,mat:'pawpad'},
   {id:'pad-m',x:.375,y:-.267+bob,z:.682,w:.075,h:.062,d:.02,mat:'pawpad'},
   {id:'pad-r',x:.50,y:-.283+bob,z:.685,w:.077,h:.062,d:.02,mat:'pawpad'},
   {id:'torch-body',x:.54,y:-.31+bob,z:.94,w:.20,h:.21,d:.48,mat:'torchmetal'},
   {id:'torch-grip',x:.54,y:-.31+bob,z:.86,w:.23,h:.23,d:.17,mat:'dark'},
   {id:'torch-switch',x:.54,y:-.18+bob,z:.85,w:.10,h:.045,d:.11,mat:'bow'},
   {id:'torch-neck',x:.54,y:-.31+bob,z:1.18,w:.24,h:.24,d:.11,mat:'brass'},
   {id:'torch-reflector',x:.54,y:-.31+bob,z:1.255,w:.31,h:.31,d:.06,mat:'dark'},
   {id:'torch-lens-ring',x:.54,y:-.31+bob,z:1.289,w:.27,h:.27,d:.045,mat:'brass'},
   {id:'torch-lens',x:.54,y:-.31+bob,z:1.317,w:.225,h:.225,d:.030,mat:flash?'torchglass':'glass'}
  ];
  const {vertices:base,indices}=this.handGeometry[flash?'on':'off']??=geometry(pieces.map(piece=>({...piece,shape:['glove','pawpad'].includes(piece.mat)?'round':piece.id.startsWith('torch-')&&piece.id!=='torch-switch'?'cylinder':undefined})));
  const vertices=this.handVertices??=new Float32Array(base.length);vertices.set(base);
  const sway=motion.reduced?0:Math.sin(motion.bob||0)*.008;
  const action=motion.reduced?0:Math.sin(Math.PI*(motion.action||0))*.025;
  for(let i=0;i<vertices.length;i+=16){
   const px=vertices[i],py=vertices[i+1],pz=vertices[i+2];
   // Keep the paw at the lower-right, without covering the centre reticle.
   // Smaller camera-space geometry remains steady on mobile portrait/landscape.
   const x=.50+(px-.4)*.70+sway,y=-.43+(py+.35)*.70+Math.abs(sway)-action,z=1.65+(pz-.83)*.70-action;
   vertices[i]=camera.x+x*right[0]+y*up[0]+z*forward[0];
   vertices[i+1]=camera.y+x*right[1]+y*up[1]+z*forward[1];
   vertices[i+2]=camera.z+x*right[2]+y*up[2]+z*forward[2];
   const nx=vertices[i+6],ny=vertices[i+7],nz=vertices[i+8];
   vertices[i+6]=nx*right[0]+ny*up[0]+nz*forward[0];
   vertices[i+7]=nx*right[1]+ny*up[1]+nz*forward[1];
   vertices[i+8]=nx*right[2]+ny*up[2]+nz*forward[2];
   const tx=vertices[i+13],ty=vertices[i+14],tz=vertices[i+15];
   vertices[i+13]=tx*right[0]+ty*up[0]+tz*forward[0];vertices[i+14]=tx*right[1]+ty*up[1]+tz*forward[1];vertices[i+15]=tx*right[2]+ty*up[2]+tz*forward[2];
  }
  const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.handVbo);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.handIbo);if(!this.handIndexReady){gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);this.handIndexReady=true;}
  this.bind(this.handVbo,this.handIbo);gl.clear(gl.DEPTH_BUFFER_BIT);
  // The torch illuminates the world, not its own reflective lens and mitten.
  gl.uniform1f(this.uniform.uFlash,0);
  gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
 }
 resize(){
  const scale=this.quality==='low'?.55:.80;
  const dpr=Math.min(window.devicePixelRatio||1,1.7)*scale;
  const w=Math.min(1200,Math.max(1,Math.round(this.canvas.clientWidth*dpr)));
  const h=Math.min(760,Math.max(1,Math.round(this.canvas.clientHeight*dpr)));
  if(w!==this.canvas.width||h!==this.canvas.height){this.canvas.width=w;this.canvas.height=h;this.gl.viewport(0,0,w,h);}
 }
 render(camera,flash,time,showHand=false,motion={}){
  this.resize();const gl=this.gl,quality=this.quality==='low'?'low':'medium';
  this.program=this.programs[quality];Object.assign(this,this.locations[quality]);gl.useProgram(this.program);
  gl.uniform1i(this.uniform.uAtlas,0);gl.uniform1i(this.uniform.uLightDepth,1);gl.uniform1i(this.uniform.uMaterials,2);
  this.updateDynamic();
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
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  this.bind(this.vbo,this.ibo);
  gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);
  if(this.dynamicCount){this.bind(this.dynamicVbo,this.dynamicIbo);gl.drawElements(gl.TRIANGLES,this.dynamicCount,gl.UNSIGNED_SHORT,0);}
  if(showHand)this.drawFirstPerson(camera,right,up,forward,time,flash,motion);
 }
 destroy(){const gl=this.gl;gl.deleteTexture(this.texture);gl.deleteTexture(this.lightTexture);for(const texture of this.materialTextures)gl.deleteTexture(texture);gl.deleteBuffer(this.vbo);gl.deleteBuffer(this.ibo);gl.deleteBuffer(this.dynamicVbo);gl.deleteBuffer(this.dynamicIbo);gl.deleteBuffer(this.handVbo);gl.deleteBuffer(this.handIbo);for(const p of Object.values(this.programs))gl.deleteProgram(p);this.canvas.width=1;this.canvas.height=1;}
}
export function pickupGeometry(objects){
 return objects.filter(o=>!o.taken&&(!o.concealed||o.dynamic)&&['battery','note','key'].includes(o.kind)).flatMap(o=>{
  if(o.kind==='key'){
   const pieces=[];
   const piece=(id,dx,dy,dz,w,h,d,mat='brass')=>({id:'pickup-'+o.id+'-'+id,x:o.x+dx,y:o.y+dy,z:o.z+dz,w,h,d,mat,solid:false,dynamic:!!o.dynamic,source:o,sourceOffset:[dx,dy,dz]});
   for(let i=0;i<8;i++){const angle=i*Math.PI/4;pieces.push(piece('ring-'+i,Math.cos(angle)*.065,0,Math.sin(angle)*.065-.055,.045,.025,.045));}
   pieces.push(piece('shaft',0,0,.08,.035,.025,.18),piece('tooth',.028,0,.13,.07,.025,.025),piece('bow-left',-.045,.025,-.055,.065,.035,.04,'pink'),piece('bow-right',.045,.025,-.055,.065,.035,.04,'pink'));
   return pieces;
  }
  return [{
  id:'pickup-'+o.id,x:o.x,y:o.y,z:o.z,w:o.kind==='note'?.32:.21,h:o.kind==='note'?.10:.25,d:.22,
  mat:o.kind==='note'?'paper':'brass',solid:false,dynamic:!!o.dynamic,source:o
  }];
 });
}
