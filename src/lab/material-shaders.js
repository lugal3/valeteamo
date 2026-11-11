import {FLASH_REACH,FLASH_SPREAD,LAMP_REACH,LAMP_SPREAD,SHADOW_ATLAS,SHADOW_GRID,SHADOW_TILE,VISIBLE_LAMPS} from './lighting.js';
import {ATLAS_SIZE,TILE_SIZE,GUTTER,INNER} from './materials.js';
import {MIRROR_PLANE} from './mirror.js';
export const VERTEX_SHADER=`
precision mediump float;
attribute vec3 aPos,aCol,aNormal,aTangent;
attribute vec2 aUV;
attribute float aArt,aStyle;
uniform vec3 uEye,uRight,uUp,uForward;
uniform vec2 uProjection;
uniform float uNear,uFar;
varying vec3 vColor,vNormal,vWorld,vTangent;
varying vec2 vUV;
varying float vArt,vStyle,vDistance;
void main(){
 vec3 diff=aPos-uEye;float z=dot(diff,uForward);
 gl_Position=vec4(dot(diff,uRight)*uProjection.x,dot(diff,uUp)*uProjection.y,z*(uFar+uNear)/(uFar-uNear)-2.0*uFar*uNear/(uFar-uNear),z);
 vColor=aCol;vNormal=aNormal;vTangent=aTangent;vWorld=aPos;vUV=aUV;vArt=aArt;vStyle=aStyle;vDistance=length(diff);
}`;
export const FRAGMENT_SHADER=`
precision mediump float;
varying vec3 vColor,vNormal,vWorld,vTangent;
varying vec2 vUV;
varying float vArt,vStyle,vDistance;
uniform vec3 uEye,uLightEye,uForward,uRight,uUp;
uniform sampler2D uAtlas,uLightDepth,uMaterials;
uniform float uFlash,uOcclude;
uniform float uHasShadows;
uniform vec4 uLamps[${VISIBLE_LAMPS}];
uniform float uTime;
uniform float uMirrorPass;
uniform float uAtlasSize,uTileSize,uGutter,uInner;
float depthAt(vec2 pixel,vec2 corner,float reach){
 vec2 uv=(corner+clamp(pixel,vec2(.5),vec2(${(SHADOW_TILE-.5).toFixed(1)})))/${SHADOW_ATLAS.toFixed(1)};
 vec2 depth=texture2D(uLightDepth,uv).rg;
 return (depth.r+depth.g/255.0)*reach;
}
float shadowTap(vec2 pixel,vec2 corner,float reach,float depth){
 return 1.0-smoothstep(0.0,.035,depth-depthAt(pixel,corner,reach));
}
float visibility(float tile,vec2 uv,float depth,float reach,float slope){
 if(uHasShadows<.5)return 1.0;
 vec2 corner=vec2(mod(tile,${SHADOW_GRID.toFixed(1)}),floor(tile/${SHADOW_GRID.toFixed(1)}))*${SHADOW_TILE.toFixed(1)};
 vec2 pixel=uv*${SHADOW_TILE.toFixed(1)};
 // Compare each tap before averaging. Interpolating depth leaks light across silhouettes.
 float z=depth-(.016+.045*(1.0-slope)+.002*depth);
 float soft=uOcclude>.5?1.35:.85;
 return .25*(shadowTap(pixel+vec2(-soft,-soft),corner,reach,z)+shadowTap(pixel+vec2(soft,-soft),corner,reach,z)
  +shadowTap(pixel+vec2(-soft,soft),corner,reach,z)+shadowTap(pixel+vec2(soft,soft),corner,reach,z));
}
float lampLight(vec4 lamp,vec3 world,vec3 normal,vec3 surfaceNormal){
 if(lamp.w<.5)return 0.0;
 vec3 delta=lamp.xyz-world;float depth=delta.y;
 float d2=dot(delta,delta);
 // A short bounce around the shade lights the mounting surface and stays inside the room.
 float bounce=.44*(1.0-smoothstep(.12,.82,d2))*smoothstep(-.57,-.28,depth);
 if(depth<=.035||d2>${(LAMP_REACH**2).toFixed(1)})return bounce;
 vec2 projected=-delta.xz/(depth*${LAMP_SPREAD.toFixed(1)});
 float coverage=1.0-smoothstep(.16,.99,length(projected));
 if(coverage<.001)return bounce;
 vec3 direction=delta*inversesqrt(max(.02,d2));
 float facing=max(0.0,dot(normal,direction));
 float falloff=(1.0-smoothstep(36.0,64.0,d2))/(1.0+.23*d2);
 return bounce+2.1*falloff*coverage*(.22+.78*facing)*
  visibility(lamp.w,projected*.5+.5,depth,${LAMP_REACH.toFixed(1)},max(0.0,dot(surfaceNormal,direction)));
}
void main(){
 if(uMirrorPass>.5&&vWorld.x<9.8375)discard;
 float tile=mod(floor(vStyle+.01),16.0);
 float aSize=uAtlasSize>0.0?uAtlasSize:${ATLAS_SIZE.toFixed(1)};
 float tSize=uTileSize>0.0?uTileSize:${TILE_SIZE.toFixed(1)};
 float gSize=uGutter>0.0?uGutter:${GUTTER.toFixed(1)};
 float iSize=uInner>0.0?uInner:${INNER.toFixed(1)};
 vec2 atlasUV=(vec2(mod(tile,4.0),floor(tile/4.0))*tSize+gSize+fract(vUV)*iSize)/aSize;
 vec4 material=texture2D(uMaterials,atlasUV);
 vec3 surfaceNormal=normalize(vNormal),N=surfaceNormal,T=vTangent;
 if(uOcclude>.5 && vArt<.5 && vDistance<5.0 && vStyle<63.5){
  vec2 xy=material.gb*2.0-1.0;vec3 detail=vec3(xy,1.0-.5*dot(xy,xy));
  vec3 B=cross(N,T);
  N=normalize(T*detail.x+B*detail.y+N*detail.z);
 }
 // Chibi surfaces use interpolated analytic normals and a broad studio key.
 // This keeps white paws readable in the dark without changing the house lighting.
 if(vStyle>63.5){
  vec3 viewDir=normalize(uEye-vWorld);
  float key=dot(N,normalize(vec3(-.45,.8,.6)))*.5+.5;
  float wrap=smoothstep(.05,.95,key);
  float rim=pow(1.0-max(0.0,dot(N,viewDir)),3.0);
  float spec=pow(max(0.0,dot(N,normalize(viewDir+vec3(-.4,.8,.6)))),28.0);
  vec3 soft=vColor*(.69+.32*wrap)+vec3(1.0,.89,.84)*rim*.065+vec3(1.0,.96,.90)*spec*.055;
  if(vStyle>95.5)soft=mix(soft,vColor,.78);
  gl_FragColor=vec4(clamp(soft,0.0,1.0),1.0);return;
 }
 vec3 world=vWorld;
 if(uMirrorPass>.5){world.x=${(2*MIRROR_PLANE).toFixed(4)}-world.x;N.x=-N.x;surfaceNormal.x=-surfaceNormal.x;}
 vec3 delta=world-uLightEye;float d=max(length(delta),.1);
 vec3 direction=delta/d;float cone=dot(direction,uForward);
 float wide=smoothstep(.63,.94,cone);float hotspot=pow(smoothstep(.84,.994,cone),2.0);
 float beam=(wide*.82+hotspot*.51)*uFlash/(1.0+.053*d*d);
 if(beam>.001){
  float depth=dot(delta,uForward);
  vec2 lightUV=vec2(dot(delta,uRight),dot(delta,uUp))/max(.001,depth);
  beam*=(1.0-smoothstep(14.0,${FLASH_REACH.toFixed(1)},depth))*
   visibility(0.0,lightUV/${(2*FLASH_SPREAD).toFixed(2)}+.5,depth,${FLASH_REACH.toFixed(1)},max(0.0,dot(surfaceNormal,-direction)));
 }
 beam*=.38+.62*max(0.0,dot(N,-direction));
 float motes=0.0;
 if(uFlash>.5 && d<3.2 && wide>.65){
  vec3 mPos=world*6.0+vec3(sin(uTime*.35),cos(uTime*.28),sin(uTime*.42));
  float mRand=fract(sin(dot(floor(mPos),vec3(12.9898,78.233,45.5432)))*43758.5453);
  if(mRand>.965)motes=smoothstep(.35,0.0,length(fract(mPos)-.5))*.22;
 }
 float warmth=0.0;
 for(int i=0;i<${VISIBLE_LAMPS};i++)warmth+=lampLight(uLamps[i],world,N,surfaceNormal);
 float facing=.86+.14*max(0.0,dot(N,normalize(vec3(.3,.8,.4))));
 vec3 lighting=vec3(.46,.45,.49)*facing+vec3(.94,.97,1.0)*(beam+motes*.50)+vec3(1.0,.82,.60)*warmth;
 vec3 color=vColor*material.rrr*1.075;
 if(vArt>.5){vec4 painted=texture2D(uAtlas,vUV);color=mix(color,painted.rgb,painted.a*.96);}
 float rough=material.a,shine=0.0;
 if(uOcclude>.5 && rough<.8){
  float h=max(0.0,dot(N,-direction)),s2=h*h,s4=s2*s2,s8=s4*s4;
  shine=mix(s8*s8,s4,rough)*(1.0-rough)*beam*.14;
 }
 color=color*lighting/(1.0+.24*lighting)+vec3(1.0,.91,.79)*shine;
 if(vStyle>31.5)color=mix(color,vColor*.90,.82);
 float fog=clamp((vDistance-6.0)/25.0,0.0,.32);
 color=mix(color,vec3(.19,.16,.22),fog);
 gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}`;
