// Original illustrated face albedo (not downloaded photographs).
// One GPU texture for the whole Lois face; never reload on each rendered frame.
// 512 mobile / 1024 desktop; WebGL1-safe POT dimensions without mipmaps.
import {LOIS_PS2_PROFILE} from './lois-ps2-profile.js';
export const LOIS_FACE_SOURCE=new URL('./assets/lois-ps2-face.svg',import.meta.url).href;
export const faceTextureSize=quality=>quality==='low'?
 LOIS_PS2_PROFILE.atlas.face.mobile:LOIS_PS2_PROFILE.atlas.face.desktop;

export function createLoisFaceTexture(gl,quality='medium'){
 const tex=gl.createTexture();
 const state={texture:tex,ready:false,failed:false,uploads:0,size:0,quality,disposed:false,source:LOIS_FACE_SOURCE};
 const image=new Image();
 let resolveReady;
 state.readyPromise=new Promise(resolve=>{resolveReady=resolve;});
 const upload=(size)=>{
  if(state.disposed||!image.complete||!image.naturalWidth||gl.isContextLost?.())return false;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d',{alpha:true,willReadFrequently:false});
  if(!ctx){state.failed=true;return false;}
  ctx.drawImage(image,0,0,size,size);
  const active=gl.getParameter(gl.ACTIVE_TEXTURE),flip=gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
  try{
   gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,tex);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
   state.size=size;state.ready=true;state.uploads++;
  }finally{
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);
   gl.activeTexture(active);
   canvas.width=canvas.height=1;
  }
  return true;
 };
 gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.activeTexture(gl.TEXTURE0);
 image.onload=()=>{try{upload(faceTextureSize(state.quality));}catch(e){state.failed=true;state.error=String(e);}resolveReady(state.ready);};
 image.onerror=()=>{state.failed=true;resolveReady(false);};
 image.src=LOIS_FACE_SOURCE;
 state.setQuality=next=>{
  if(next!=='low'&&next!=='medium')next='medium';
  const size=faceTextureSize(next);
  state.quality=next;
  if(state.ready&&size!==state.size)upload(size);
 };
 state.destroy=()=>{
  state.disposed=true;image.onload=null;image.onerror=null;
  gl.deleteTexture(tex);resolveReady(false);
 };
 return state;
}
