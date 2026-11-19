import {FLASH_REACH,FLASH_SPREAD,LAMP_REACH,LAMP_SPREAD,SHADOW_ATLAS,SHADOW_GRID,SHADOW_TILE,VISIBLE_LAMPS} from './lighting.js';
import {ATLAS_SIZE,TILE_SIZE,GUTTER,INNER} from './materials.js';
import {MIRROR_PLANE} from './mirror.js';
import {HOUSE} from './house-layout.js';
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
uniform vec3 uEye,uLightEye,uForward,uRight,uUp,uPursuerKey;
uniform sampler2D uAtlas,uLightDepth,uMaterials,uTV,uLoisFace,uFascia;
uniform float uFlash,uOcclude;
uniform float uShot,uFasciaReady;
uniform float uHasShadows;
uniform vec4 uLamps[${VISIBLE_LAMPS}];
uniform float uTime;
uniform float uTVSignal;
uniform float uMirrorPass,uHeld;
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
vec3 captureEye(vec2 uv,vec3 irisTint,vec3 normal,vec3 viewDir,vec3 key){
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
 return albedo*(.18+uShot*(.22+.70*overhead))*(1.0-.42*hood)
  +vec3(.72,.82,.79)*(cornea*.61+pin*.33)*uShot+vec3(.38,.52,.50)*crescent*uShot*.10;
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
 if(vArt>4.5){
  // Layered pore, fibre and vascular detail in the model's own UV space.
  // Broad shadowing comes from the sculpted forms. Wet highlights are narrow.
  vec3 viewDir=normalize(uEye-vWorld);
  vec3 key=normalize(dot(uPursuerKey,uPursuerKey)>.01?uPursuerKey:-uForward*.61-uRight*.40+uUp*.74);
  if(vArt>15.5&&vArt<16.5){
   gl_FragColor=vec4(clamp(captureEye(vUV,vColor,surfaceNormal,viewDir,key),0.0,1.0),1.0);
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
  float blood=step(16.5,vArt);
  float wet=max(max(tissue,optical),tentacle+tendon+saliva+blood);
  float ripple=pow(abs(sin(vUV.x*368.0+6.0*soft+vUV.y*17.0)),8.0);
  vec3 across=cross(surfaceNormal,normalize(T+vec3(.0001)));
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
   color*=.86+.22*groove-.28*fracture-.25*enamelPit;
   color=mix(color,color*vec3(.74,.49,.38),rootStain*.81);
   color+=vec3(.033,.031,.024)*smoothstep(.28,.91,vUV.y)*(1.0-groove);
   fineNormal=normalize(fineNormal+T*(groove-.5)*.15);
  }
  if(hair>.5){
   float sweep=surfaceNoise(vec2(vUV.x*30.0,vUV.y*3.1));
   float strands=.5+.5*sin(vUV.x*389.0+vUV.y*9.0+7.0*sweep);
   color*=.56+.28*sweep+.14*strands;
   fineNormal=normalize(fineNormal+T*(strands-.5)*.19);
  }
  float gloss=.79;
  float organic=tissue+tendon+tentacle+blood;
  if(organic>.5&&uFasciaReady>.5){
   vec2 uv=mix(vUV,vUV.yx,tentacle)*mix(vec2(1.93,1.28),vec2(1.25,.74),tendon);
   uv+=vec2(vColor.g*5.9,vColor.r*4.3);
   vec3 fibres=texture2D(uFascia,uv).rgb;
   float marbled=dot(fibres,vec3(.53,.34,.13));
   float relief=texture2D(uFascia,uv+vec2(.011,0.0)).r-fibres.r;
   float ridges=texture2D(uFascia,uv+vec2(0.0,.014)).r-fibres.r;
   fineNormal=normalize(fineNormal+T*relief*.85+across*ridges*.39);
   vec3 pigment=vec3(.032,.008,.012)+fibres*vec3(.75,.53,.51);
   color=mix(color*(.50+marbled*.78),pigment,.71-.19*tendon);
   color=mix(color,vec3(.092,.009,.013)+fibres*vec3(.30,.11,.12),blood*.72);
   gloss=mix(.20,.90,smoothstep(.15,.50,marbled+mottling*.09));
  }
  float lit=pow(max(0.0,dot(fineNormal,key)),1.26);
  float wrapped=max(0.0,dot(fineNormal,normalize(uRight*.72+uUp*.15-uForward*.46)));
  vec3 light=vec3(.082,.090,.108)+vec3(.97,.85,.77)*uShot*(.11+1.28*lit)
   +vec3(.42,.50,.57)*wrapped*uShot*.41+vec3(.34,.52,.62)*rim*(.10+.47*uShot);
  light+=vec3(.94,.99,1.0)*beam+vec3(.88,.72,.55)*warmth*.45;
  float facingSpec=max(0.0,dot(fineNormal,halfVector));
  float shine=(pow(facingSpec,mix(24.0,57.0,wet))*(.018+.32*wet*gloss+.15*dentin)+.046*wet*gloss*pow(facingSpec,12.0))
   *uShot*(.43+.57*mottling);
  vec3 spec=shine*mix(vec3(.87,.74,.69),vec3(.65,.83,.85),tentacle*.70+steel*.25);
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
 float fog=clamp((vDistance-6.0)/25.0,0.0,.32);
 color=mix(color,vec3(.024,.030,.054),fog);
 gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}`;
