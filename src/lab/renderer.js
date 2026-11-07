// Minimal WebGL1 3D renderer: real perspective, depth buffer, world geometry and spotlight.
// No additional packages, CDNs, runtime downloads or concurrent Phaser loops.
import {MATERIAL} from './world.js';
const VS = `
precision mediump float;
attribute vec3 aPos, aCol, aNormal;
attribute vec2 aUV;
attribute float aArt, aStyle;
uniform vec3 uEye,uRight,uUp,uForward;
uniform vec2 uProjection;
uniform float uNear,uFar;
varying vec3 vColor,vNormal,vWorld;
varying vec2 vUV;
varying float vArt,vStyle,vDistance;
void main(){
 vec3 diff=aPos-uEye;
 float z=dot(diff,uForward);
 gl_Position=vec4(dot(diff,uRight)*uProjection.x,dot(diff,uUp)*uProjection.y,
  z*(uFar+uNear)/(uFar-uNear)-2.0*uFar*uNear/(uFar-uNear),z);
 vColor=aCol;vNormal=aNormal;vWorld=aPos;vUV=aUV;vArt=aArt;vStyle=aStyle;vDistance=length(diff);
}`;
const FS = `
precision mediump float;
varying vec3 vColor,vNormal,vWorld;
varying vec2 vUV;
varying float vArt,vStyle,vDistance;
uniform vec3 uEye,uForward;
uniform sampler2D uAtlas;
uniform float uFlash,uTime;
void main(){
 vec3 delta=vWorld-uEye;
 float d=max(length(delta),.1);
 vec3 direction=delta/d;
 float cone=dot(direction,uForward);
 float beam=pow(smoothstep(.65,.96,cone),1.3)*uFlash*2.4/(1.0+.055*d*d);
 // A few room-local lamps, softened by distance rather than costly dynamic shadows.
 vec3 lamp1=vec3(10.9,1.5,1.1), lamp2=vec3(6.1,4.7,4.1), lamp3=vec3(2.0,1.7,6.1);
 float warmth=.40/(1.0+.17*pow(distance(vWorld,lamp1),2.0))
   + .33/(1.0+.15*pow(distance(vWorld,lamp2),2.0))
   + .24/(1.0+.12*pow(distance(vWorld,lamp3),2.0));
 float facing=.75+.25*max(0.0,dot(normalize(vNormal),normalize(vec3(.3,.8,.4))));
 float lighting=(.32+warmth+beam)*facing;
 vec3 color=vColor;
 if(vStyle>1.5 && vStyle<2.5){
   float seam=step(.95,fract(vWorld.x*1.6+vWorld.z*.37));
   color*=1.0-seam*.18;
 }else if(vStyle>.5 && vStyle<1.5){
   vec2 uv=abs(vNormal.y)>.5?vWorld.xz:vWorld.xy+vWorld.zy*.16;
   float dotPattern=step(.94,fract(uv.x*2.4))*step(.88,fract(uv.y*2.2));
   color=mix(color,vec3(.93,.73,.76),dotPattern*.23);
 }
 if(vArt>.5) {
   vec4 painted=texture2D(uAtlas,vUV);
   color=mix(color,painted.rgb,painted.a*.96);
 }
 color*=lighting;
 // Coherent low-color-count pixel appearance even on ordinary 3D geometry.
 color=floor(color*24.0+.5)/24.0;
 float fog=clamp((vDistance-5.0)/17.0,0.0,.64);
 color=mix(color,vec3(.16,.13,.21),fog);
 gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}`;
function shader(gl,kind,source){const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error('Shader: '+msg);}return s;}
function program(gl){const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,VS),f=shader(gl,gl.FRAGMENT_SHADER,FS);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p)||'Shader linkage');return p;}
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
function geometry(boxes){
 const vertices=[],indices=[],colors=MATERIAL;let offset=0;
 for(const box of boxes){
  const color=colors[box.mat]||colors.cream;
  const style=box.mat==='wallpaper'||box.mat==='wall2'?1:box.mat==='wood'||box.mat==='floor'?2:0;
  for(const face of faces){
   const art=box.art!==undefined&&box.front===face.dir?box.art+1:0;
   face.corners.forEach(([dx,dy,dz],i)=>{
    const u=(i===0||i===3)?0:1,v=i<2?0:1;
    vertices.push(box.x+dx*box.w/2,box.y+dy*box.h/2,box.z+dz*box.d/2,
     color[0],color[1],color[2],...face.normal,art?((art-1)+u)/4:0,v,art?1:0,style);
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
  this.gl=gl;this.program=program(gl);this.texture=createAtlas(gl);
  this.vbo=gl.createBuffer();this.ibo=gl.createBuffer();this.count=0;
  this.handVbo=gl.createBuffer();this.handIbo=gl.createBuffer();
  this.atrib={};for(const key of ['aPos','aCol','aNormal','aUV','aArt','aStyle'])this.atrib[key]=gl.getAttribLocation(this.program,key);
  this.uniform={};for(const key of ['uEye','uRight','uUp','uForward','uProjection','uNear','uFar','uAtlas','uFlash','uTime'])this.uniform[key]=gl.getUniformLocation(this.program,key);
  gl.useProgram(this.program);gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.clearColor(.14,.11,.19,1);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.uniform.uAtlas,0);
 }
 rebuild(boxes){
  const gl=this.gl,{vertices,indices}=geometry(boxes);this.count=indices.length;
  if(vertices.length/13>65530)throw Error('Demasiada geometría para WebGL1');
  gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  this.bind(this.vbo,this.ibo);
 }
 bind(vertexBuffer,indexBuffer){
  const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
  const stride=13*4,layout=[['aPos',3,0],['aCol',3,3],['aNormal',3,6],['aUV',2,9],['aArt',1,11],['aStyle',1,12]];
  for(const [name,size,start] of layout){const at=this.atrib[name];if(at<0)continue;gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,size,gl.FLOAT,false,stride,start*4);}
 }
 drawFirstPerson(camera,right,up,forward,time){
  // Real mesh in camera space, separate depth pass so the torch/paw do not clip into walls.
  const bob=matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.sin(time*5)*.009;
  const pieces=[
   {id:'sleeve',x:.47,y:-.47+bob,z:.71,w:.3,h:.22,d:.25,mat:'wall2'},
   {id:'paw',x:.39,y:-.35+bob,z:.82,w:.27,h:.25,d:.28,mat:'cream'},
   {id:'thumb',x:.22,y:-.32+bob,z:.88,w:.12,h:.16,d:.13,mat:'pink'},
   {id:'torch',x:.43,y:-.22+bob,z:.83,w:.12,h:.28,d:.14,mat:'brass'},
   {id:'torch-ring',x:.43,y:-.07+bob,z:.84,w:.17,h:.09,d:.19,mat:'dark'},
   {id:'torch-light',x:.43,y:-.015+bob,z:.84,w:.12,h:.04,d:.14,mat:'cream'}
  ];
  const {vertices,indices}=geometry(pieces);
  for(let i=0;i<vertices.length;i+=13){
   const x=vertices[i],y=vertices[i+1],z=vertices[i+2];
   vertices[i]=camera.x+x*right[0]+y*up[0]+z*forward[0];
   vertices[i+1]=camera.y+x*right[1]+y*up[1]+z*forward[1];
   vertices[i+2]=camera.z+x*right[2]+y*up[2]+z*forward[2];
   const nx=vertices[i+6],ny=vertices[i+7],nz=vertices[i+8];
   vertices[i+6]=nx*right[0]+ny*up[0]+nz*forward[0];
   vertices[i+7]=nx*right[1]+ny*up[1]+nz*forward[1];
   vertices[i+8]=nx*right[2]+ny*up[2]+nz*forward[2];
  }
  const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.handVbo);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.handIbo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.DYNAMIC_DRAW);
  this.bind(this.handVbo,this.handIbo);gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
 }
 resize(){
  const scale=this.quality==='low'?.55:.80;
  const dpr=Math.min(window.devicePixelRatio||1,1.7)*scale;
  const w=Math.min(1200,Math.max(1,Math.round(this.canvas.clientWidth*dpr)));
  const h=Math.min(760,Math.max(1,Math.round(this.canvas.clientHeight*dpr)));
  if(w!==this.canvas.width||h!==this.canvas.height){this.canvas.width=w;this.canvas.height=h;this.gl.viewport(0,0,w,h);}
 }
 render(camera,flash,time,showHand=false){
  this.resize();const gl=this.gl;gl.useProgram(this.program);
  const cy=Math.cos(camera.yaw),sy=Math.sin(camera.yaw),cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch);
  const right=[cy,0,-sy],forward=[sy*cp,sp,cy*cp],up=[-sy*sp,cp,-cy*sp];
  gl.uniform3f(this.uniform.uEye,camera.x,camera.y,camera.z);
  gl.uniform3fv(this.uniform.uRight,right);gl.uniform3fv(this.uniform.uUp,up);gl.uniform3fv(this.uniform.uForward,forward);
  gl.uniform2f(this.uniform.uProjection,1.30*this.canvas.height/this.canvas.width,1.30);
  gl.uniform1f(this.uniform.uNear,.07);gl.uniform1f(this.uniform.uFar,45);
  gl.uniform1f(this.uniform.uFlash,flash?1:0);gl.uniform1f(this.uniform.uTime,time);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  this.bind(this.vbo,this.ibo);
  gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);
  if(showHand)this.drawFirstPerson(camera,right,up,forward,time);
 }
 destroy(){const gl=this.gl;gl.deleteTexture(this.texture);gl.deleteBuffer(this.vbo);gl.deleteBuffer(this.ibo);gl.deleteBuffer(this.handVbo);gl.deleteBuffer(this.handIbo);gl.deleteProgram(this.program);this.canvas.width=1;this.canvas.height=1;}
}
export function pickupGeometry(objects){
 return objects.filter(o=>!o.taken&&['battery','note','key'].includes(o.kind)).map(o=>({
  id:'pickup-'+o.id,x:o.x,y:o.y,z:o.z,w:o.kind==='note'?.32:.21,h:o.kind==='note'?.10:.25,d:.22,
  mat:o.kind==='note'?'paper':'brass',solid:false
 }));
}
