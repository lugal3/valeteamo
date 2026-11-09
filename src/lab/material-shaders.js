import {LIGHT_REACH,LIGHT_SPREAD} from './lighting.js';
import {ATLAS_SIZE,TILE_SIZE,GUTTER,INNER} from './materials.js';
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
void main(){
 float tile=mod(floor(vStyle+.01),16.0);
 vec2 atlasUV=(vec2(mod(tile,4.0),floor(tile/4.0))*${TILE_SIZE.toFixed(1)}+${GUTTER.toFixed(1)}+fract(vUV)*${INNER.toFixed(1)})/${ATLAS_SIZE.toFixed(1)};
 vec4 material=texture2D(uMaterials,atlasUV);
 vec3 N=normalize(vNormal),T=vTangent;
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
 vec3 delta=vWorld-uLightEye;float d=max(length(delta),.1);
 vec3 direction=delta/d;float cone=dot(direction,uForward);
 float beam=smoothstep(.66,.96,cone)*uFlash*1.45/(1.0+.055*d*d);
 if(beam>.01 && uOcclude>.5){
  vec2 lightUV=vec2(dot(delta,uRight),dot(delta,uUp))/max(.001,dot(delta,uForward));
  float wall=texture2D(uLightDepth,lightUV/${2*LIGHT_SPREAD}+.5).r*${LIGHT_REACH.toFixed(1)};
  beam*=1.0-smoothstep(wall+.07,wall+.22,d);
 }
 beam*=.72+.28*max(0.0,dot(N,-direction));
 vec3 l1=vWorld-vec3(2.2,1.25,8.1),l2=vWorld-vec3(2.5,4.35,7.5),l3=vWorld-vec3(11.15,1.25,2.8);
 float upper=step(3.15,vWorld.y);
 float warmth=(1.0-upper)*(.32/(1.0+.17*dot(l1,l1))*(1.0-step(4.4,vWorld.x))+.27/(1.0+.12*dot(l3,l3))*step(7.5,vWorld.x))+upper*.34/(1.0+.15*dot(l2,l2));
 float facing=.80+.20*max(0.0,dot(N,normalize(vec3(.3,.8,.4))));
 float lighting=(.60+warmth+beam)*facing;
 vec3 color=vColor*material.rrr*1.075;
 if(vArt>.5){vec4 painted=texture2D(uAtlas,vUV);color=mix(color,painted.rgb,painted.a*.96);}
 float rough=material.a,shine=0.0;
 if(uOcclude>.5 && rough<.8){
  float h=max(0.0,dot(N,-direction)),s2=h*h,s4=s2*s2,s8=s4*s4;
  shine=mix(s8*s8,s4,rough)*(1.0-rough)*(.08+beam*.14);
 }
 color=color*lighting/(1.0+.30*lighting)+vec3(1.0,.91,.79)*shine;
 if(vStyle>31.5)color=mix(color,vColor*.90,.82);
 float fog=clamp((vDistance-6.0)/25.0,0.0,.32);
 color=mix(color,vec3(.19,.16,.22),fog);
 gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}`;
