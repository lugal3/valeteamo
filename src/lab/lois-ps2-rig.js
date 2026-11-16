// CPU hierarchical rigid rig for Lois (21 parented pivots).
// Rendered by the existing WebGL1 dynamic VBO; no second renderer, GPU skinning
// dependency or new gameplay state. The same mesh/UV atlas follows each bone.
import {LOIS_RIG,sampleLoisVisual} from './lois-ps2-profile.js';
import {sampleLoisReaction} from './lois-ps2-reactions.js';

const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
const identity=[1,0,0,0,1,0,0,0,1];
const mul=(a,b)=>[
 a[0]*b[0]+a[1]*b[3]+a[2]*b[6],a[0]*b[1]+a[1]*b[4]+a[2]*b[7],a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
 a[3]*b[0]+a[4]*b[3]+a[5]*b[6],a[3]*b[1]+a[4]*b[4]+a[5]*b[7],a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
 a[6]*b[0]+a[7]*b[3]+a[8]*b[6],a[6]*b[1]+a[7]*b[4]+a[8]*b[7],a[6]*b[2]+a[7]*b[5]+a[8]*b[8]
];
const mv=(m,x,y,z)=>[
 m[0]*x+m[1]*y+m[2]*z,
 m[3]*x+m[4]*y+m[5]*z,
 m[6]*x+m[7]*y+m[8]*z
];
const rotation=(yaw=0,pitch=0,roll=0)=>{
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const cr=Math.cos(roll),sr=Math.sin(roll);
 // Identical axis order to the house renderer: roll XY, pitch YZ, yaw XZ.
 const R=[cr,-sr,0,sr,cr,0,0,0,1];
 const P=[1,0,0,0,cp,-sp,0,sp,cp];
 const Y=[cy,0,-sy,0,1,0,sy,0,cy];
 return mul(Y,mul(P,R));
};
const p3=(v)=>[v[0],v[1],v[2]];
const boneDefs=LOIS_RIG;
const rigNames=new Set(boneDefs.map(b=>b.name));

export function loisBoneForPart(id){
 if(/^lid--1$/.test(id))return 'leftEyelid';
 if(/^lid-1$/.test(id))return 'rightEyelid';
 if(/^(upper-lip|lower-lip|under-lip)$/.test(id))return 'jaw';
 if(/^(upper-arm|forearm|hand)-/.test(id)){
  const side=id.endsWith('--1')?'left':'right';
  return side+(id.startsWith('upper-arm')?'Shoulder':id.startsWith('forearm')?'Elbow':'Wrist');
 }
 if(/^(thigh|leg|shoe|sole)-/.test(id)){
  const side=id.endsWith('--1')?'left':'right';
  return side+(id.startsWith('thigh')?'Hip':id.startsWith('leg')?'Knee':'Ankle');
 }
 if(id==='hips'||id==='jacket-button')return 'pelvis';
 if(id==='neck')return 'neck';
 if(/^(torso|shirt|collar|blazer-panel|lapel|lapel-line|pocket)/.test(id))return 'chest';
 return 'head';
}

export function sampleLoisRig(source={},reduced=false){
 const visual=sampleLoisVisual(source,reduced);
 const reaction=sampleLoisReaction(source,reduced);
 const phase=visual.phase;
 const t=visual.elapsed,crouch=clamp(source.crouch,0,1);
 const speed=clamp(source.speed,0,4);
 const isMoving=(phase==='climb'||phase==='follow')&&speed>.05;
 const weight=isMoving?clamp(speed/1.75,0,1)*(reduced?.55:1):0;
 const travel=clamp(source.walk,0,1e9)*7.2,step=Math.sin(travel)*weight;
 const liftedLeft=Math.max(0,step),liftedRight=Math.max(0,-step);
 const hiding=phase==='hide'||phase==='hidden',untying=phase==='untying';
 // A normal 18cm crouch left Louis' head poking above the stone bar.
 // Fold the torso below the screen while the feet stay planted. Continue
 // the same fold into 'follow' and release it as crouch reaches zero.
 const lowCover=(hiding||phase==='follow')?crouch:0;
 const fear=visual.face.fear;
 const blink=clamp(visual.face.blink,0,1);
 const breath=visual.chest.breath;
 const gazeYaw=(reduced?0:hiding?Math.sin(t*.78)*.38:phase==='climb'?Math.sin(t*.52)*.10:Math.sin(t*.32)*.07)+reaction.gazeYaw;
 const gazePitch=(untying?-.22:hiding?-.10:0)+reaction.gazePitch;
 const jawOpen=clamp((untying?.12+Math.sin(t*2.5)*.025:
  phase==='climb'?.075:
  hiding?.06:.018+Math.max(0,Math.sin(t*1.7))*.016)+reaction.jawOpen,0,.45);
 const browLift=clamp(fear*.22+reaction.browLift,0,.40);
 const f={blink,gazeYaw,gazePitch,jawOpen,browLift,fear,relief:visual.face.relief,reaction:reaction.type};
 const angles=Object.create(null),shifts=Object.create(null);
 const angle=(name,roll=0,pitch=0,yaw=0)=>{angles[name]={yaw,pitch,roll};};
 const shift=(name,x=0,y=0,z=0)=>{shifts[name]=[x,y,z];};
 shift('root',0,-.18*crouch+(isMoving&&!reduced?Math.abs(step)*.007:0),0);
 shift('pelvis',0,0,crouch*.065);
 angle('pelvis',0,crouch*.13);
 // Lower the upper-body skeletal branch; unlike a global mesh offset, the
 // hips and ankles are retained, giving a crouch instead of a teleport.
 shift('spine',0,-.72*lowCover,0);
 angle('spine',0,(hiding?.26:untying?.055:phase==='climb'?.09:0),0);
 angle('chest',reduced?0:Math.sin(t*1.04)*.012,0,reduced?0:Math.sin(t*.45)*.017);
 shift('chest',0,breath,0);
 angle('neck',0,0,0);
 angle('head',reduced?0:Math.sin(t*.73)*.008,(untying?-.09:gazePitch*.28)+reaction.headPitch,gazeYaw*.42+reaction.headYaw);
 shift('jaw',0,-jawOpen*.015,jawOpen*.006);
 angle('jaw',0,-jawOpen*.15,0);
 shift('leftEyelid',0,-blink*.034,0);
 shift('rightEyelid',0,-blink*.034,0);
 for(const [name,side,lift,legPhase] of [
  ['left',-1,liftedLeft,step],['right',1,liftedRight,-step]
 ]){
  const reach=(untying?-.49:hiding?-.64:-(legPhase*.36))-reaction.reach*.24;
  angle(name+'Shoulder',side*.025,reach,side*(hiding?.19:untying?.13:.02));
  angle(name+'Elbow',0,untying?-.41:hiding?-.31:.12+lift*.09,0);
  angle(name+'Wrist',0,untying?-.13:hiding?.14:0,side*.055);
  angle(name+'Hip',0,hiding?-.37:untying?-.22:legPhase*.33,0);
  angle(name+'Knee',0,hiding?.71:untying?.34:lift*.41,0);
  angle(name+'Ankle',0,hiding?-.22:untying?-.12:-legPhase*.18-lift*.17,0);
  if(crouch)shift(name+'Hip',0,crouch*.055,crouch*.045);
 }
 const bones=Object.create(null);
 for(const bone of boneDefs){
  const parent=bone.parent?bones[bone.parent]:{rotation:identity,translation:[0,0,0]};
  const e=angles[bone.name]||{},R=rotation(e.yaw||0,e.pitch||0,e.roll||0);
  const pivot=p3(bone.pivot),Rp=mv(R,...pivot),t=shifts[bone.name]||[0,0,0];
  const around=[pivot[0]-Rp[0]+t[0],pivot[1]-Rp[1]+t[1],pivot[2]-Rp[2]+t[2]];
  const delta=mv(parent.rotation,...around);
  bones[bone.name]={
   rotation:mul(parent.rotation,R),
   translation:[parent.translation[0]+delta[0],parent.translation[1]+delta[1],parent.translation[2]+delta[2]],
   pivot
  };
 }
 // Maintain ankle height through crouch and simple strides. Neither correction
 // changes physics, actor position or collision volume.
 for(const [name,lift] of [['leftAnkle',liftedLeft],['rightAnkle',liftedRight]]){
  const b=bones[name],actual=mv(b.rotation,...b.pivot)[1]+b.translation[1];
  const desired=b.pivot[1]+(isMoving?lift*.045:0);
  b.translation[1]+=clamp(desired-actual,-.22,.22);
 }
 return {phase,visual,bones,face:f,weight,crouch,posture:visual.posture,reducedMotion:!!reduced};
}

// In-place CPU deformation on the same dynamic mesh buffer already used by the
// house. Each part moves rigidly with its parented bone, while the continuous
// face receives a small jaw/cheek morph. No GPU texture upload per animation frame.
export function writeLoisRigPart(target,rest,start,end,box,bindActor,actor,rig){
 const joint=rig.bones[box.rigBone];
 if(!joint||!rigNames.has(box.rigBone))return;
 const M=joint.rotation,T=joint.translation,f=rig.face;
 const heading=-(Number.isFinite(actor.yaw)?actor.yaw:0);
 const cos=Math.cos(heading),sin=Math.sin(heading);
 const eye=/^(eye|iris|pupil|glint)-/.test(box.rigPart||'');
 const looking=/^(iris|pupil|glint)-/.test(box.rigPart||'');
 const isBrow=/^brow-/.test(box.rigPart||'');
 // Preserve actual photographed eyes, mouth and jaw without animated mesh warping.
 const faceMesh=box.shape==='lois-face'&&!box.photoMapped;
 const blinkScale=eye?1-f.blink*.89:1;
 for(let v=start;v<end;v+=16){
  let x=rest[v]-bindActor[0],y=rest[v+1]-bindActor[1],z=rest[v+2]-bindActor[2];
  if(eye)y=box.y-bindActor[1]+(y-(box.y-bindActor[1]))*blinkScale;
  if(looking){x+=f.gazeYaw*.024;y+=f.gazePitch*.024;}
  if(isBrow)y+=f.browLift*.031;
  if(faceMesh){
   // Chin and lips stay connected to the UV-covered head; a tiny morph prevents
   // a rigid mouth sticker while keeping the silhouette and texture coherent.
   const localY=y-1.61,localZ=z-.006;
   const chin=Math.max(0,Math.min(1,(-localY-.02)/.15));
   const front=Math.max(0,Math.min(1,(localZ-.08)/.10));
   y-=chin*front*f.jawOpen*.019;
   z+=chin*front*f.jawOpen*.006;
  }
  const nx=M[0]*x+M[1]*y+M[2]*z+T[0];
  const ny=M[3]*x+M[4]*y+M[5]*z+T[1];
  const nz=M[6]*x+M[7]*y+M[8]*z+T[2];
  target[v]=actor.x+nx*cos-nz*sin;
  target[v+1]=actor.y+ny;
  target[v+2]=actor.z+nx*sin+nz*cos;
  target[v+12]=rest[v+12];
  for(const k of [6,13]){
   const tx=rest[v+k],ty=rest[v+k+1],tz=rest[v+k+2];
   const ax=M[0]*tx+M[1]*ty+M[2]*tz;
   const ay=M[3]*tx+M[4]*ty+M[5]*tz;
   const az=M[6]*tx+M[7]*ty+M[8]*tz;
   target[v+k]=ax*cos-az*sin;
   target[v+k+1]=ay;
   target[v+k+2]=ax*sin+az*cos;
  }
 }
}
