// Generated coat albedo only: the private reference photographs are never shipped.
export const EMY_COAT_URL=new URL('./assets/emy/coat-v2.jpg',import.meta.url).href;
export function createEmyCoatTexture(gl){
 const texture=gl.createTexture(),image=new Image();let started=false,disposed=false;
 const state={texture,ready:false,failed:false};
 const bind=()=>{gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,texture);};
 bind();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([139,142,145,255]));
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.generateMipmap(gl.TEXTURE_2D);gl.activeTexture(gl.TEXTURE0);
 image.onload=()=>{
  if(disposed||gl.isContextLost?.())return;
  const active=gl.getParameter(gl.ACTIVE_TEXTURE),flip=gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
  try{bind();gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);state.ready=true;}
  catch(error){state.failed=true;state.error=String(error);}
  finally{gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);gl.activeTexture(active);}
 };
 image.onerror=()=>{state.failed=true;};
 state.enable=()=>{if(!started&&!disposed){started=true;image.src=EMY_COAT_URL;}};
 state.destroy=()=>{disposed=true;image.onload=image.onerror=null;gl.deleteTexture(texture);};
 return state;
}
