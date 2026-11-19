const fasciaUrl=new URL('./media/pursuer-fascia.webp',import.meta.url).href;

export function createPursuerTexture(gl){
 const texture=gl.createTexture();
 const image=new Image();
 function bind(upload){
  const previous=gl.getParameter(gl.ACTIVE_TEXTURE);
  const flip=gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  upload();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);
  gl.activeTexture(previous);
 }
 bind(()=>{
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([139,71,63,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 });
 const material={ready:false,destroy(){image.onload=null;gl.deleteTexture(texture);}};
 image.onload=()=>{
  bind(()=>{
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
   const width=image.naturalWidth,height=image.naturalHeight;
   if((width&(width-1))===0&&(height&(height-1))===0){
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
   }
  });
  material.ready=true;
 };
 image.src=fasciaUrl;
 return material;
}
