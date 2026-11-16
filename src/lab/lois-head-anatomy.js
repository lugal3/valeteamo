// Dedicated Photo-A head sculpt. The old surface was a deformed oval sphere;
// this is a sequence of anatomical front/back rings with an angular mandible,
// an actual chin underside, temporal planes and a separate nasal bridge.
// Geometry remains ONE closed, single-atlas, 21-bone head: no detached mask,
// sculpted eye spheres, external model download or per-frame tessellation.
//
// Coordinates are normalized to the existing face box and the approved
// photographic UV projection. All positions are in metres at runtime.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const bell=(x,y,cx,cy,sx,sy)=>{
 const dx=(x-cx)/sx,dy=(y-cy)/sy;
 return Math.exp(-.5*(dx*dx+dy*dy));
};
const signedPower=(v,p)=>Math.sign(v)*Math.pow(Math.abs(v),p);

// y, transverse width, face depth, rear cranium depth, depth shift.
// These are actual cross-section dimensions rather than a spherical
// scale factor. Broader upper cheeks + angular rear jaw corners follow
// the user's approved frontal/3/4 bust reference.
export const LOIS_HEAD_ANATOMY_RINGS=Object.freeze([
 [-1.000,0,0,0,.065],
 [-.970,.30,.28,.38,.050],
 [-.900,.51,.54,.63,.025],
 [-.820,.65,.74,.81,.015],
 [-.720,.72,.910,.89,.009],
 [-.600,.845,.970,.98,.003],
 [-.470,.855,.98,1.04,.000],
 [-.300,.915,1.02,1.08,-.003],
 [-.140,1.000,1.06,1.11,-.004],
 [ .080,1.070,1.075,1.12,-.004],
 [ .320,1.080,1.03,1.15,-.008],
 [ .560,.995,.965,1.17,-.013],
 [ .770,.840,.830,1.07,-.023],
 [ .900,.575,.610,.79,-.029],
 [ .972,.250,.260,.38,-.028],
 [1.000,0,0,0,-.027]
].map(row=>Object.freeze(row)));

export function loisHeadRingProfile(height){
 const y=clamp(height,-1,1);
 for(let i=1;i<LOIS_HEAD_ANATOMY_RINGS.length;i++){
  const upper=LOIS_HEAD_ANATOMY_RINGS[i],lower=LOIS_HEAD_ANATOMY_RINGS[i-1];
  if(y<=upper[0]){
   const t=(y-lower[0])/(upper[0]-lower[0]);
   return lower.map((n,k)=>n+(upper[k]-n)*t);
  }
 }
 return [...LOIS_HEAD_ANATOMY_RINGS.at(-1)];
}

export function loisAnatomicalHeadPoint(box,u,v){
 const theta=(u-.5)*2*Math.PI;
 const phi=(v-.5)*Math.PI;
 const vertical=Math.sin(phi),yLocal=vertical*box.h*.5;
 const ring=loisHeadRingProfile(vertical);
 const sin=Math.sin(theta),cos=Math.cos(theta);
 // Superelliptic cheek and jaw cross-sections produce broad planar cheek
 // transitions rather than the same ellipse at every level of the skull.
 const crossX=signedPower(sin,.84);
 const crossZ=signedPower(cos,.89);
 const x=ring[1]*box.w*.5*crossX;
 const y=yLocal;
 const faceHalf=box.d*.5*ring[2];
 const skullHalf=box.d*.5*ring[3];
 const zBase=(crossZ>=0?crossZ*faceHalf:crossZ*skullHalf)+ring[4];
 const towardFront=Math.pow(Math.max(0,cos),1.7);

 // Purpose-built facial planes, all part of the same watertight skin:
 // z relief is strongest at nose tip, bridge and alar wings.
 const socket=-.0085*(bell(x,y,-.079,.064,.043,.035)+bell(x,y,.079,.064,.043,.035));
 const brow=.0048*(bell(x,y,-.080,.103,.051,.027)+bell(x,y,.080,.103,.051,.027));
 const noseBridge=.016*bell(x,y,0,-.017,.024,.083);
 const noseTip=.035*bell(x,y,0,-.073,.035,.030);
 const noseWings=.009*(bell(x,y,-.035,-.085,.022,.026)+bell(x,y,.035,-.085,.022,.026));
 const cheekbones=.0135*(bell(x,y,-.107,-.024,.060,.066)+bell(x,y,.107,-.024,.060,.066));
 const temples=-.007*(bell(x,y,-.145,.066,.037,.068)+bell(x,y,.145,.066,.037,.068));
 const philtrum=.003*bell(x,y,0,-.124,.021,.023);
 const lips=.0088*bell(x,y,0,-.145,.058,.023);
 const underlip=-.004*bell(x,y,0,-.168,.060,.014);
 const chin=.020*bell(x,y,0,-.190,.067,.044);
 const jawCorners=.011*(bell(x,y,-.119,-.124,.048,.069)+bell(x,y,.119,-.124,.048,.069));
 // The jaw bone forms a real edge toward the ears, not an isolated blob.
 const mandibularShelf=.007*bell(Math.abs(x),y,.116,-.158,.065,.043);

 const relief=socket+brow+noseBridge+noseTip+noseWings+
  cheekbones+temples+philtrum+lips+underlip+chin+jawCorners+mandibularShelf;
 // Every longitudinal meridian must converge at the same pole. Without a
 // pole mask, the chin Gaussian produced a tiny split at the bottom cap.
 const pole=clamp((1-Math.abs(vertical))/.10,0,1);
 const poleMask=pole*pole*(3-2*pole);
 return [box.x+x,box.y+y,box.z+zBase+towardFront*poleMask*relief];
}
