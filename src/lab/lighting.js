import {circuitPowered} from './house-lights.js';

export const SHADOW_GRID=4;
export const SHADOW_TILE=256;
export const SHADOW_ATLAS=SHADOW_TILE*SHADOW_GRID;
export const FLASH_REACH=18;
export const FLASH_SPREAD=1.36;
export const LAMP_REACH=8;
export const LAMP_SPREAD=3.2;
export const VISIBLE_LAMPS=4;
export const NIGHT_SKY=[.018,.024,.046];

const DEPTH_VERTEX=`
precision mediump float;
attribute vec3 aPos;
uniform vec3 uOrigin,uRight,uUp,uForward;
uniform float uSpread,uReach;
varying float vDepth;
void main(){
 vec3 delta=aPos-uOrigin;
 float z=dot(delta,uForward),near=.045;
 // Keep vertices exactly on the light plane out of the perspective divide.
 if(z==0.0)z=-.001;
 gl_Position=vec4(dot(delta,uRight)/uSpread,dot(delta,uUp)/uSpread,
  (z*(uReach+near)-2.0*uReach*near)/(uReach-near),z);
 vDepth=z/uReach;
}`;
const DEPTH_FRAGMENT=`
precision mediump float;
varying float vDepth;
void main(){
 float depth=clamp(vDepth,0.0,1.0)*255.0;
 gl_FragColor=vec4(floor(depth)/255.0,fract(depth),0.0,1.0);
}`;
const LAMP_BASIS={right:[1,0,0],up:[0,0,1],forward:[0,-1,0]};

export function castsShadow(box){
 return box.solid||box.castShadow||/^(step-\d+$|basement-step-\d+$|upper-mattress$|sofa-pillow-|wardrobe-louver-)/.test(box.id);
}

export function nearbyLights(fixtures,camera){
 return fixtures.filter(light=>circuitPowered(light.circuit)&&!!light.underground===(camera.y<-.30))
  .map(light=>({light,distance:Math.hypot(camera.x-light.x,camera.y-light.y,camera.z-light.z)}))
  .filter(({distance})=>distance<LAMP_REACH+2)
  .sort((a,b)=>a.distance-b.distance)
  .slice(0,VISIBLE_LAMPS).map(({light})=>light);
}

export class HouseShadows{
 constructor(gl){
  this.gl=gl;
  this.texture=gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,SHADOW_ATLAS,SHADOW_ATLAS,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  this.depth=gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER,this.depth);
  gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,SHADOW_ATLAS,SHADOW_ATLAS);
  this.target=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.target);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.texture,0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.depth);
  this.available=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.bindRenderbuffer(gl.RENDERBUFFER,null);
  gl.activeTexture(gl.TEXTURE0);
  if(!this.available)return;

  this.program=gl.createProgram();
  for(const [type,source] of [[gl.VERTEX_SHADER,DEPTH_VERTEX],[gl.FRAGMENT_SHADER,DEPTH_FRAGMENT]]){
   const shader=gl.createShader(type);
   gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
   gl.attachShader(this.program,shader);gl.deleteShader(shader);
  }
  gl.linkProgram(this.program);
  if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
  this.position=gl.getAttribLocation(this.program,'aPos');
  this.uniform=Object.fromEntries(['uOrigin','uRight','uUp','uForward','uSpread','uReach'].map(name=>[name,gl.getUniformLocation(this.program,name)]));
 }
 begin(){
  const gl=this.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.target);gl.useProgram(this.program);
  gl.enable(gl.SCISSOR_TEST);gl.disable(gl.CULL_FACE);
  gl.clearColor(1,0,0,1);
 }
 draw(tile,origin,meshes,basis=LAMP_BASIS,reach=LAMP_REACH,spread=LAMP_SPREAD){
  const gl=this.gl,u=this.uniform,x=tile%SHADOW_GRID*SHADOW_TILE,y=Math.floor(tile/SHADOW_GRID)*SHADOW_TILE;
  gl.scissor(x,y,SHADOW_TILE,SHADOW_TILE);gl.viewport(x,y,SHADOW_TILE,SHADOW_TILE);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.uniform3f(u.uOrigin,origin.x,origin.y,origin.z);
  gl.uniform3fv(u.uRight,basis.right);gl.uniform3fv(u.uUp,basis.up);gl.uniform3fv(u.uForward,basis.forward);
  gl.uniform1f(u.uSpread,spread);gl.uniform1f(u.uReach,reach);
  for(const {vertices,indices,count} of meshes){
   if(!count)continue;
   gl.bindBuffer(gl.ARRAY_BUFFER,vertices);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);
   gl.enableVertexAttribArray(this.position);gl.vertexAttribPointer(this.position,3,gl.FLOAT,false,16*4,0);
   gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_SHORT,0);
  }
 }
 end(width,height){
  const gl=this.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.SCISSOR_TEST);gl.enable(gl.CULL_FACE);
  gl.viewport(0,0,width,height);gl.clearColor(...NIGHT_SKY,1);
 }
 destroy(){
  const gl=this.gl;
  gl.deleteProgram(this.program??null);gl.deleteFramebuffer(this.target);
  gl.deleteRenderbuffer(this.depth);gl.deleteTexture(this.texture);
 }
}
