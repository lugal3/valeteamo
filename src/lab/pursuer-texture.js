const fasciaUrl=new URL('./media/pursuer-fascia-detail.webp',import.meta.url).href;
const legacyFasciaUrl=new URL('./media/pursuer-fascia.webp',import.meta.url).href;
const skinUrl=new URL('./media/pursuer-skin-detail.webp',import.meta.url).href;

function loadDetailTexture(gl,unit,url,placeholder,fallback=null){
 const texture=gl.createTexture();
 const image=new Image();
 function bind(upload){
  const previous=gl.getParameter(gl.ACTIVE_TEXTURE);
  const flip=gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
  gl.activeTexture(unit);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  upload();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);
  gl.activeTexture(previous);
 }
 bind(()=>{
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(placeholder));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 });
 const material={ready:false,destroy(){image.onload=null;image.onerror=null;gl.deleteTexture(texture);}};
 image.onload=()=>{
  bind(()=>{
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
   const width=image.naturalWidth,height=image.naturalHeight;
   if((width&(width-1))===0&&(height&(height-1))===0){
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    const anisotropy=gl.getExtension('EXT_texture_filter_anisotropic');
    if(anisotropy)gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,
     Math.min(4,gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
   }
  });
  material.ready=true;
 };
 if(fallback)image.onerror=()=>{image.onerror=null;image.src=fallback;};
 image.src=url;
 return material;
}

export function createPursuerTexture(gl){
 const fascia=loadDetailTexture(gl,gl.TEXTURE5,fasciaUrl,[139,71,63,255],legacyFasciaUrl);
 const skin=loadDetailTexture(gl,gl.TEXTURE6,skinUrl,[176,142,120,255]);
 return {get ready(){return fascia.ready;},get skinReady(){return skin.ready;},
  destroy(){fascia.destroy();skin.destroy();}};
}
