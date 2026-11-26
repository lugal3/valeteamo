import {FLASH_REACH,FLASH_SPREAD,LAMP_REACH,LAMP_SPREAD,SHADOW_ATLAS,SHADOW_GRID,SHADOW_TILE,VISIBLE_LAMPS} from './lighting.js';
import {ATLAS_SIZE,TILE_SIZE,GUTTER,INNER} from './materials.js';
import {MIRROR_PLANE} from './mirror.js';
import {HOUSE} from './house-layout.js';
export const VERTEX_SHADER=`
precision highp float;
attribute vec3 aPos,aCol,aNormal,aTangent;
attribute vec2 aUV;
attribute float aArt,aStyle;
uniform mediump vec3 uEye,uRight,uUp,uForward;
uniform vec2 uProjection;
uniform float uNear,uFar;
varying mediump vec3 vColor,vNormal,vWorld,vTangent;
varying mediump vec2 vUV;
varying mediump float vArt,vStyle,vDistance;
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
uniform vec3 uEye,uLightEye,uForward,uRight,uUp,uPursuerKey;
uniform sampler2D uAtlas,uLightDepth,uMaterials,uTV,uLoisFace,uFascia,uPursuerSkin,uEmyCoat;
uniform float uFlash,uOcclude;
uniform float uShot,uFasciaReady,uPursuerSkinReady;
uniform float uHasShadows;
uniform vec4 uLamps[${VISIBLE_LAMPS}];
uniform float uTime,uHolidayMotion;
uniform float uTVSignal;
uniform float uMirrorPass,uHeld,uScanOutline;
uniform float uAtlasSize,uTileSize,uGutter,uInner;
float depthAt(vec2 pixel,vec2 corner,float reach){
 vec2 uv=(corner+clamp(pixel,vec2(.5),vec2(${(SHADOW_TILE-.5).toFixed(1)})))/${SHADOW_ATLAS.toFixed(1)};
 vec2 depth=texture2D(uLightDepth,uv).rg;
 return (depth.r+depth.g/255.0)*reach;
}
float surfaceHash(vec2 p){
 return fract(sin(dot(p,vec2(12.73,6.17)))*761.3);
}
float surfaceNoise(vec2 p){
 vec2 cell=floor(p),f=fract(p);
 f=f*f*(3.0-2.0*f);
 return mix(mix(surfaceHash(cell),surfaceHash(cell+vec2(1.0,0.0)),f.x),
  mix(surfaceHash(cell+vec2(0.0,1.0)),surfaceHash(cell+1.0),f.x),f.y);
}
float materialHeight(vec3 sampleColor){
 return dot(sampleColor,vec3(.59,.30,.11));
}
vec3 captureEye(vec2 uv,vec3 irisTint,vec3 normal,vec3 viewDir,vec3 key,float exposure){
 vec2 eye=(uv-vec2(.5))*2.0;
 float radius=length(eye),angle=atan(eye.y,eye.x+.0001)/6.2831853+.5;
 float iris=1.0-smoothstep(.55,.61,radius);
 float pupilRadius=.225+.025*irisTint.b;
 float pupil=1.0-smoothstep(pupilRadius,pupilRadius+.035,radius);
 float collar=smoothstep(.33,.40,radius)*(1.0-smoothstep(.42,.57,radius));
 float threads=surfaceNoise(vec2(angle*67.0+radius*3.0,radius*8.0));
 float radial=sin(6.2831853*angle*43.0+threads*4.3+radius*9.0);
 float ridge=radial*.26+.34*threads+.58;
 float vessels=pow(1.0-abs(sin(angle*66.0+5.0*radius+threads*2.7)),14.0);
 float edge=smoothstep(.59,1.08,radius);
 vec3 sclera=mix(vec3(.62,.53,.44),vec3(.36,.20,.18),edge*.75);
 sclera=mix(sclera,vec3(.34,.12,.13),vessels*smoothstep(.63,1.06,radius)*.84);
 vec3 stroma=irisTint*ridge*(.42+.58*(1.0-smoothstep(.48,.61,radius)));
 stroma+=vec3(.19,.113,.052)*collar*(threads*.7+.12);
 vec3 albedo=mix(mix(sclera,stroma,iris),vec3(.018,.011,.010),pupil);
 float overhead=pow(max(0.0,dot(normal,key)),1.2);
 float hood=smoothstep(-.19,.83,eye.y)*smoothstep(.28,.91,radius);
 float cornea=pow(max(0.0,dot(normal,normalize(key+viewDir))),91.0);
 float crescent=pow(max(0.0,dot(normal,normalize(key+viewDir+uRight*.13))),34.0);
 float pin=1.0-smoothstep(.025,.073,length((eye-vec2(-.23,.37))*vec2(1.0,1.33)));
 return albedo*(.14+exposure*(.21+.71*overhead))*(1.0-.52*hood)
  +vec3(.72,.82,.79)*(cornea*.61+pin*.33)*exposure+vec3(.38,.52,.50)*crescent*exposure*.10;
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
 float strength=fract(lamp.w);if(strength<.01)strength=1.0;
 vec3 delta=lamp.xyz-world;float depth=delta.y;
 float d2=dot(delta,delta);
 // A short bounce around the shade lights the mounting surface and stays inside the room.
 float bounce=.44*strength*(1.0-smoothstep(.12,.82,d2))*smoothstep(-.57,-.28,depth);
 if(depth<=.035||d2>${(LAMP_REACH**2).toFixed(1)})return bounce;
 vec2 projected=-delta.xz/(depth*${LAMP_SPREAD.toFixed(1)});
 float coverage=1.0-smoothstep(.16,.99,length(projected));
 if(coverage<.001)return bounce;
 vec3 direction=delta*inversesqrt(max(.02,d2));
 float facing=max(0.0,dot(normal,direction));
 float falloff=(1.0-smoothstep(36.0,64.0,d2))/(1.0+.23*d2);
 return bounce+2.1*strength*falloff*coverage*(.22+.78*facing)*
  visibility(floor(lamp.w),projected*.5+.5,depth,${LAMP_REACH.toFixed(1)},max(0.0,dot(surfaceNormal,direction)));
}
void main(){
 if(uScanOutline>.5){gl_FragColor=uScanOutline>1.5?vec4(.19,.82,.67,.28):vec4(.66,1.0,.88,.96);return;}
 if(uMirrorPass>.5&&vWorld.x<9.8375)discard;
 if(vArt>1.5&&vArt<2.5&&uTVSignal>.5){
  vec2 grid=floor(vUV*vec2(256.0,144.0));
  float grain=fract(sin(dot(grid,vec2(3.4,7.3)))*419.3);
  float scan=.88+.12*mod(grid.y,2.0);
  vec3 signal=uTVSignal>1.5?texture2D(uTV,vUV).rgb:vec3(.18+grain*.35);
  float edge=smoothstep(0.0,.37,min(min(vUV.x,1.0-vUV.x),min(vUV.y,1.0-vUV.y)));
  gl_FragColor=vec4(signal*vec3(.86,.95,1.0)*scan*(.77+.23*edge),1.0);return;
 }
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
 if(vArt>19.5&&vArt<21.5){
  vec3 viewDir=normalize(uEye-vWorld);
  vec3 key=normalize(vec3(-.45,.8,.6));
  float wrap=dot(surfaceNormal,key)*.5+.5;
  float rim=pow(1.0-max(0.0,dot(surfaceNormal,viewDir)),3.0);
  vec3 color;
  float shine=0.0;
  if(vArt<20.5){
   vec3 coat=texture2D(uEmyCoat,vUV).rgb;
   float grey=dot(coat,vec3(.30,.59,.11));
   color=mix(vec3(grey),coat,.18)*vColor;
   // Fine fibre relief is restricted to the coat; highlights follow hair flow.
   float fibres=surfaceNoise(vUV*vec2(410.0,88.0));
   color*=.93+.13*fibres;
   shine=.045*rim;
  }else{
   vec2 eye=(vUV-.5)*2.0;
   float radius=length(eye),angle=atan(eye.y,eye.x);
   float iris=.75+.14*sin(angle*61.0+radius*14.0)+.08*sin(angle*113.0-radius*21.0);
   float pupil=1.0-smoothstep(.61,.69,length(eye*vec2(6.8,1.0)));
   float outer=smoothstep(.64,1.02,radius);
   color=mix(vColor*iris,vec3(.15,.21,.12),outer*.67);
   color=mix(color,vec3(.018,.026,.021),pupil);
   float glint=1.0-smoothstep(.025,.10,length((eye-vec2(-.27,.34))*vec2(1.0,1.35)));
   shine=glint*.48+pow(max(0.0,dot(surfaceNormal,normalize(key+viewDir))),80.0)*.20;
  }
  float exposure=clamp(.30+beam+.78*warmth+uShot,.30,1.4);
  vec3 light=vec3(.71+.30*wrap)*exposure;
  gl_FragColor=vec4(clamp(color*light+vec3(.80,.87,.86)*shine*exposure,0.0,1.0),1.0);return;
 }
 if(vArt>4.5){
  // Layered pore, fibre and vascular detail in the model's own UV space.
  // Broad shadowing comes from the sculpted forms. Wet highlights are narrow.
  vec3 viewDir=normalize(uEye-vWorld);
  vec3 key=normalize(dot(uPursuerKey,uPursuerKey)>.01?uPursuerKey:-uForward*.61-uRight*.40+uUp*.74);
  if(vArt>15.5&&vArt<16.5){
   gl_FragColor=vec4(clamp(captureEye(vUV,vColor,surfaceNormal,viewDir,key,uShot+.48*beam+.22*warmth),0.0,1.0),1.0);
   return;
  }
  vec3 halfVector=normalize(key+viewDir);
  float rim=pow(1.0-clamp(dot(surfaceNormal,viewDir),0.0,1.0),2.5);
  float soft=surfaceNoise(vUV*vec2(9.0,18.0));
  float mottling=surfaceNoise(vUV*41.0+vec2(soft,soft*3.0));
  float pores=surfaceNoise(vUV*vec2(238.0,271.0));
  float strand=sin(vUV.x*120.0+vUV.y*43.0+soft*12.0+mottling*2.1);
  float vein=pow(1.0-abs(strand),7.0)*smoothstep(.30,.79,soft);
  float skin=1.0-step(5.5,vArt);
  float tissue=step(5.5,vArt)*(1.0-step(6.5,vArt));
  float steel=step(6.5,vArt)*(1.0-step(7.5,vArt));
  float optical=step(7.5,vArt)*(1.0-step(8.5,vArt));
  float hair=step(9.5,vArt)*(1.0-step(10.5,vArt));
  float voidMat=step(10.5,vArt)*(1.0-step(11.5,vArt));
  float tentacle=step(11.5,vArt)*(1.0-step(12.5,vArt));
  float dentin=step(12.5,vArt)*(1.0-step(13.5,vArt));
  float tendon=step(13.5,vArt)*(1.0-step(14.5,vArt));
  float saliva=step(14.5,vArt)*(1.0-step(15.5,vArt));
  float blood=step(16.5,vArt)*(1.0-step(17.5,vArt));
  float membrane=step(17.5,vArt)*(1.0-step(18.5,vArt));
  float fabric=step(18.5,vArt);
  float wet=max(max(tissue,optical),tentacle+tendon+saliva+blood);
  float ripple=pow(abs(sin(vUV.x*368.0+6.0*soft+vUV.y*17.0)),8.0);
  T=normalize(T-surfaceNormal*dot(T,surfaceNormal)+vec3(.0001));
  vec3 across=cross(surfaceNormal,T);
  vec3 fineNormal=normalize(surfaceNormal+across*(mottling-.5)*(.13+wet*.20)
   +T*(pores-.5)*(.039+wet*.05));
  vec3 color=vColor*(.63+.31*soft+.18*mottling+.09*pores-.36*vein*wet+steel*.19*ripple);
  color=mix(color,color*vec3(1.13,.67,.73),vein*(.24+.12*skin));
  color*=1.0-tentacle*.17*ripple;
  if(tendon>.5){
   // U wraps around each bundle. V follows its length as the jaw stretches.
   float bands=surfaceNoise(vec2(vUV.x*26.0,vUV.y*5.0));
   float thread=sin(vUV.x*289.0+vUV.y*6.0+bands*4.9+mottling*1.7)*.5+.5;
   float furrow=pow(thread,5.0);
   float threadLight=surfaceNoise(vec2(vUV.x*65.0,vUV.y*12.0));
   fineNormal=normalize(fineNormal+T*(thread-.5)*(.18+.19*bands));
   color*=.62+.39*threadLight+.35*bands;
   color+=vec3(.10,.037,.043)*furrow*(.42+.58*bands);
  }
  if(dentin>.5){
   float groove=surfaceNoise(vec2(vUV.x*38.0,vUV.y*5.0));
   float crack=sin(vUV.x*66.0+vUV.y*.9+groove*3.3);
   float fracture=pow(1.0-abs(crack),11.0)*smoothstep(.20,.74,mottling);
   float rootStain=(1.0-smoothstep(.05,.47,vUV.y))*(.50+.50*soft);
   float enamelPit=smoothstep(.64,.9,pores)*smoothstep(.2,.79,mottling);
   float bands=surfaceNoise(vec2(vUV.x*12.0,vUV.y*34.0));
   float recession=pow(1.0-vUV.y,2.5)*(.32+.68*mottling);
   color*=.80+.22*groove+.14*bands-.32*fracture-.24*enamelPit;
   color=mix(color,color*vec3(.59,.32,.26),rootStain*.91);
   color=mix(color,color*vec3(.68,.57,.43),recession*.52);
   color+=vec3(.044,.040,.031)*smoothstep(.28,.91,vUV.y)*(1.0-groove);
   fineNormal=normalize(fineNormal+T*((groove-.5)*.15-.095*fracture)+across*(bands-.5)*.11);
  }
  if(hair>.5){
   float sweep=surfaceNoise(vec2(vUV.x*30.0,vUV.y*3.1));
   float strands=.5+.5*sin(vUV.x*389.0+vUV.y*9.0+7.0*sweep);
   float silvers=smoothstep(.46,.76,surfaceNoise(vec2(vUV.x*106.0,vUV.y*3.0)));
   color*=.49+.24*sweep+.20*strands+.13*silvers;
   fineNormal=normalize(fineNormal+T*(strands-.5)*.14);
  }
  if(fabric>.5){
   float wool=surfaceNoise(vUV*vec2(197.0,143.0));
   float weave=sin(vUV.x*426.0+vUV.y*422.0)*sin(vUV.x*422.0-vUV.y*426.0);
   color=vColor*(.68+.22*wool+.029*weave);
   fineNormal=normalize(surfaceNormal+T*(wool-.5)*.16);
  }
  if(skin>.5){
   color=vColor*(.68+.095*mottling+.028*pores);
   float closeDetail=1.0-smoothstep(.82,1.75,vDistance);
   if(uPursuerSkinReady>.5&&closeDetail>.001){
    vec2 uv=vUV*vec2(1.12,1.06)+vec2(.152,.07);
    vec3 skinTile=texture2D(uPursuerSkin,uv).rgb;
    float height=materialHeight(skinTile);
    vec2 slope=vec2(materialHeight(texture2D(uPursuerSkin,uv+vec2(.0029,0.0)).rgb)-height,
     materialHeight(texture2D(uPursuerSkin,uv+vec2(0.0,.0029)).rgb)-height);
    fineNormal=normalize(fineNormal-(T*slope.x+across*slope.y)*closeDetail*1.55);
    vec3 tint=clamp(skinTile/vec3(.692,.556,.470),.57,1.24);
    color*=mix(vec3(1.0),tint,.72*closeDetail);
   }
  }
  float gloss=.36;
  float organic=tissue+tendon+tentacle+blood;
  if(organic>.5&&uFasciaReady>.5){
   vec2 uv=mix(vUV,vUV.yx,tentacle)*mix(vec2(1.93,1.28),vec2(1.25,.74),tendon);
   uv+=vec2(vColor.g*5.9,vColor.r*4.3);
   vec3 fibres=texture2D(uFascia,uv).rgb;
   float marbled=materialHeight(fibres);
   vec2 slope=vec2(materialHeight(texture2D(uFascia,uv+vec2(.0034,0.0)).rgb)-marbled,
    materialHeight(texture2D(uFascia,uv+vec2(0.0,.0041)).rgb)-marbled);
   vec3 du=mix(T,-across,tentacle),dv=mix(across,T,tentacle);
   fineNormal=normalize(fineNormal-1.48*du*slope.x-.82*dv*slope.y);
   float grooves=smoothstep(.047,.235,marbled);
   vec3 pigment=vec3(.025,.012,.017)+fibres*vec3(.84,.80,.78);
   color=mix(color*(.51+grooves*.50),pigment,.65-.17*tendon);
   color*=.72+.34*grooves;
   // V on the pharynx mesh carries depth into the mouth.
   if(tissue>.5&&vColor.r<.11)color*=smoothstep(.014,.11,vColor.r);
   color=mix(color,vec3(.092,.009,.013)+fibres*vec3(.30,.11,.12),blood*.72);
   gloss=mix(.12,.77,smoothstep(.19,.36,marbled+mottling*.09)*(1.0-.57*vein));
  }
  if(membrane>.5){
   // Thin webbing stays attached at its edge. Load stretches the veins
   // and opens the small gaps between the supporting fibres.
   float grain=surfaceNoise(vUV*vec2(62.0,18.0));
   float fan=sin(vUV.x*(112.0+14.0*vStyle)+vUV.y*15.0+grain*2.4);
   float vessels=pow(1.0-abs(fan),12.0)*smoothstep(.05,.28,vUV.y);
   float transmission=.21+.42*abs(dot(surfaceNormal,key))+.22*vStyle;
   vec3 sheet=mix(vec3(.18,.074,.064),vec3(.49,.26,.18),transmission);
   color=sheet*(.65+.32*grain-.46*vessels);
   fineNormal=normalize(surfaceNormal+T*(grain-.5)*.38);
  }
  // Raised ridges around the joints read as dull hard plates over muscle.
  float plate=tentacle*smoothstep(.39,.80,vStyle)*smoothstep(.31,.59,pores+.26*mottling);
  color=mix(color,color*vec3(.66,.72,.69)+vec3(.037,.025,.024),plate);
  float lit=pow(max(0.0,dot(fineNormal,key)),1.26);
  float wrapped=max(0.0,dot(fineNormal,normalize(uRight*.72+uUp*.15-uForward*.46)));
  vec3 light=vec3(.082,.091,.099)+vec3(.99,.88,.76)*uShot*(.16+1.04*lit)
   +vec3(.44,.57,.57)*wrapped*uShot*.58+vec3(.38,.58,.60)*rim*(.11+.58*uShot);
  light+=fabric*uHeld*vec3(.19,.22,.24);
  light+=vec3(.94,.99,1.0)*beam+vec3(.88,.72,.55)*warmth*.45;
  float facingSpec=max(0.0,dot(fineNormal,halfVector));
  float wetHighlight=wet*(1.0-.53*tendon-.38*tentacle-.44*plate)+saliva*.55;
  float enamel=smoothstep(.30,.81,vUV.y)*dentin;
  float shine=(pow(facingSpec,mix(16.0,84.0,gloss*wet+enamel*.45))*(.010+.29*wetHighlight*gloss+.072*enamel)
   +.025*wetHighlight*gloss*pow(facingSpec,13.0))
   *uShot*(.39+.61*mottling);
  vec3 spec=shine*mix(vec3(.87,.74,.69),vec3(.65,.83,.85),tentacle*.70+steel*.25);
  light+=membrane*uShot*vec3(.16,.098,.065)*abs(dot(surfaceNormal,key));
  color=color*light*(1.0-.61*voidMat-.31*saliva)+spec*(1.0-voidMat)+color*optical*.52;
  gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);return;
 }
 if(vStyle>63.5){
  // Keep the grip legible close to the camera, and light the reflected body in the room.
  vec3 viewDir=normalize(uEye-vWorld);
  float key=dot(surfaceNormal,normalize(vec3(-.45,.8,.6)))*.5+.5;
  float wrap=smoothstep(.05,.95,key);
  float rim=pow(1.0-max(0.0,dot(normalize(vNormal),viewDir)),3.0);
  vec3 soft=vColor*(.72+.29*wrap)+vec3(1.0,.89,.84)*rim*.065;
  if(tile==9.0)soft*=material.r*1.05;
  float spill=uMirrorPass>.5?.28*uFlash:0.0;
  float exposure=uHeld>.5?.62+.33*uFlash:clamp(.19+spill+beam+.78*warmth,.19,1.0);
  if(vStyle>95.5)exposure=max(exposure,.85);
  gl_FragColor=vec4(clamp(soft*exposure,0.0,1.0),1.0);return;
 }
 float facing=.86+.14*max(0.0,dot(N,normalize(vec3(.3,.8,.4))));
 float boundary=max(max(-world.x,world.x-${HOUSE.width.toFixed(1)}),max(-world.z,world.z-${HOUSE.depth.toFixed(1)}));
 vec3 ambient=mix(vec3(.071,.076,.107),vec3(.20,.22,.32),smoothstep(.06,.48,boundary));
 ambient=mix(ambient,vec3(.056,.048,.047),smoothstep(.18,1.1,-world.y));
 vec3 lighting=(ambient+uShot*vec3(.75,.83,1.0))*facing+vec3(.94,.97,1.0)*(beam+motes*.50)+vec3(1.0,.82,.60)*warmth;
 // Retro character artwork carries a subtle baked fill light. Without it the
 // skin nearly disappears in shadow while the separate eyes remain bright.
 // Lighting is still dynamic above this floor; no lighting changes to the room.
 if(vArt>2.5&&vArt<3.5)lighting=max(lighting,vec3(.56,.52,.48));
 if(vArt>3.5&&vArt<4.5)lighting=max(lighting,vec3(.88,.84,.82));
 vec3 color=vColor*material.rrr*1.075;
 if(vArt>.5&&vArt<1.5){vec4 painted=texture2D(uAtlas,vUV);color=mix(color,painted.rgb,painted.a*.96);}
 if(vArt>2.5&&vArt<3.5){
  // Reversible illustrated PS2 texture, unchanged.
  vec4 painted=texture2D(uLoisFace,vUV);
  color=mix(color,painted.rgb*material.r,painted.a);
 }
 if(vArt>3.5&&vArt<4.5){
  // Option A: actual source pixels projected over the head and hair, with
  // eyes/nose/lips part of the texture (no extra procedural facial pieces).
  color=texture2D(uLoisFace,clamp(vUV,vec2(.003),vec2(.997))).rgb;
 }
 float rough=material.a,shine=0.0;
 if(uOcclude>.5 && rough<.8){
  float h=max(0.0,dot(N,-direction)),s2=h*h,s4=s2*s2,s8=s4*s4;
  shine=mix(s8*s8,s4,rough)*(1.0-rough)*beam*.14;
 }
 color=color*lighting/(1.0+.24*lighting)+vec3(1.0,.91,.79)*shine;
 if(vStyle>31.5)color=mix(color,vColor*(.55+material.r*.40),.82);
 // Styles 48–63 are reserved for the little static holiday bulbs. Slow,
 // low-contrast emission modulation; no shadow or point-light allocation.
 if(vStyle>47.5&&vStyle<63.5){
  float pulse=.94+uHolidayMotion*.07*sin(uTime*.75+vWorld.x*1.7+vWorld.y*2.1+vWorld.z);
  color*=pulse;
 }
 float fog=clamp((vDistance-6.0)/25.0,0.0,.32);
 color=mix(color,vec3(.024,.030,.054),fog);
 gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}`;
