// CPU hierarchical rigid rig for Lois (21 parented pivots).
// Rendered by the existing WebGL1 dynamic VBO; no second renderer, GPU skinning
// dependency or new gameplay state. The same mesh/UV atlas follows each bone.
import {LOIS_RIG,sampleLoisVisual} from './lois-ps2-profile.js';
import {sampleLoisReaction} from './lois-ps2-reactions.js';
import {sampleLoisMotion} from './lois-motion.js';
import {sampleLoisUntie} from './lois-untie.js';

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
 const brace=reaction.brace||0,resist=reaction.resist||0,recoil=reaction.recoil||0,recover=reaction.recover||0,pulse=reaction.pulse||0;
 const phase=visual.phase;
 const t=visual.elapsed,crouch=clamp(source.crouch,0,1);
 const gait=sampleLoisMotion(source,reduced),speed=gait.speed;
 const weight=gait.weight,isMoving=weight>.001,step=gait.stride;
 const liftedLeft=gait.leftLift,liftedRight=gait.rightLift;
 const hiding=phase==='hide'||phase==='hidden',untying=phase==='untying';
 // A normal 18cm crouch left Louis' head poking above the stone bar.
 // Fold the torso below the screen while the feet stay planted. Continue
 // the same fold into 'follow' and release it as crouch reaches zero.
 const lowCover=(hiding||phase==='follow')?crouch:0;
 const rescue=untying&&source.rescuePerformance?sampleLoisUntie(t):null;
 const fear=visual.face.fear;
 const blink=clamp(visual.face.blink,0,1);
 const breath=visual.chest.breath;
 const gazeYaw=(hiding?(reduced?0:Math.sin(t*.78)*.38):gait.lookYaw)+reaction.gazeYaw;
 const gazePitch=(untying?-.22:hiding?-.10:gait.lookPitch)+reaction.gazePitch;
 const jawOpen=clamp((untying?.12+Math.sin(t*2.5)*.025:
  phase==='climb'?.075:
  hiding?.06:.018+Math.max(0,Math.sin(t*1.7))*.016)+reaction.jawOpen,0,.45);
 const browLift=clamp(fear*.22+reaction.browLift,0,.40);
 const f={blink,gazeYaw,gazePitch,jawOpen,browLift,fear,relief:visual.face.relief,reaction:reaction.type};
 const angles=Object.create(null),shifts=Object.create(null);
 const angle=(name,roll=0,pitch=0,yaw=0)=>{angles[name]={yaw,pitch,roll};};
 const shift=(name,x=0,y=0,z=0)=>{shifts[name]=[x,y,z];};
 shift('root',gait.sway,rescue?-.37*rescue.seated:-.25*crouch+gait.bob,rescue?rescue.lean*.12:0);
 shift('pelvis',0,0,rescue?0:crouch*.065);
 angle('pelvis',isMoving?gait.sway*.65:0,rescue?rescue.lean*.15:crouch*.30,gait.counterTwist*.48);
 // Lower the upper-body skeletal branch; unlike a global mesh offset, the
 // hips and ankles are retained, giving a crouch instead of a teleport.
 // Split the fold between pelvis, knees and torso; the former 72cm spine
 // slide folded the entire chest through the lap when Louis squatted.
 shift('spine',0,-.38*lowCover,0);
 angle('spine',-.07*resist+.035*pulse,(rescue?(.07*rescue.seated+.42*rescue.lean):hiding?.26:untying?.055:phase==='climb'?.09+Math.max(0,gait.slope)*.16:weight*.075)+.13*brace-.21*recoil+.05*recover,0);
 angle('chest',(reduced?0:Math.sin(t*1.04)*.012)+.09*resist+.035*pulse,-.12*recoil,(reduced?0:Math.sin(t*.45)*.017)+.12*resist-gait.counterTwist*.83);
 shift('chest',0,breath,0);
 // A compact neck duck tucks the photographed head UNDER the 1.10 m
 // counter while keeping the chest above the pelvis and legs bent naturally.
 shift('neck',0,-.265*lowCover,0);
 angle('neck',0,hiding||untying?0:gazePitch*.18,hiding||untying?0:gazeYaw*.22);
 angle('head',reduced?0:Math.sin(t*.73)*.008,(untying?-.09:gazePitch*.42)+reaction.headPitch,gazeYaw*.63+reaction.headYaw);
 shift('jaw',0,-jawOpen*.015,jawOpen*.006);
 angle('jaw',0,-jawOpen*.15,0);
 shift('leftEyelid',0,-blink*.034,0);
 shift('rightEyelid',0,-blink*.034,0);
 for(const [name,side,lift,legPhase] of [
  ['left',-1,liftedLeft,step],['right',1,liftedRight,-step]
 ]){
  const reach=(untying?-.49:hiding?-.64:(legPhase*.34))-reaction.reach*.24;
  const near=side===-1?1:.72;
  angle(name+'Shoulder',side*(.025+.20*brace+.12*recoil),reach-near*(.68*brace+.34*resist)+.10*side*pulse-.25*recover,side*(hiding?.19:untying?.13:.02)+side*.24*resist);
  angle(name+'Elbow',0,(untying?-.41:hiding?-.31:-.18-lift*.24)-near*(.82*brace+.28*resist)-.22*recoil-.22*recover,0);
  angle(name+'Wrist',0,(untying?-.13:hiding?.14:0)-.14*resist+.08*side*pulse,side*(.055+.12*brace));
  angle(name+'Hip',0,(hiding?-.72:untying?-.22:-legPhase*.49)-.22*brace+.12*side*recoil,0);
  angle(name+'Knee',0,(hiding?1.16:untying?.34:.08*weight+lift*(.68+Math.max(0,gait.slope)*.17))+.34*brace+.12*recoil,0);
  angle(name+'Ankle',0,(hiding?-.49:untying?-.12:legPhase*.25-lift*.31)-.12*brace,0);
  if(rescue){
   angle(name+'Shoulder',-side*.28*rescue.tied,-.68*rescue.seated,side*.10*rescue.tied);
   angle(name+'Elbow',-side*.26*rescue.tied,-.58*rescue.seated-.20*(1-rescue.tied),0);
   angle(name+'Wrist',side*.10*rescue.tied,-.16*rescue.tied,0);
   angle(name+'Hip',0,-1.35*rescue.seated-.12*rescue.lean,0);
   angle(name+'Knee',0,1.40*rescue.seated+.18*rescue.lean,0);
   angle(name+'Ankle',0,-.05*rescue.seated,0);
  }else if(crouch)shift(name+'Hip',0,crouch*.09,crouch*.16);
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
  const desired=b.pivot[1]+(isMoving?lift*(.075+Math.max(0,gait.slope)*.045):0);
  b.translation[1]+=clamp(desired-actual,-.22,.22);
 }
 return {phase,visual,bones,face:f,weight,crouch,posture:visual.posture,motionState:gait.state,gait,reducedMotion:!!reduced};
}

// Exact skinning transform for physical wrist contact, including actor yaw.
export function loisJointPoint(actor,rig,name,offset=[0,0,0]){
 const bone=rig.bones[name],local=bone.pivot.map((n,i)=>n+offset[i]);
 const p=mv(bone.rotation,...local).map((n,i)=>n+bone.translation[i]);
 const h=-(actor.yaw||0),c=Math.cos(h),s=Math.sin(h);
 return {x:actor.x+p[0]*c-p[2]*s,y:actor.y+p[1],z:actor.z+p[0]*s+p[2]*c};
}
export function loisWristAnchors(actor,reduced=false){
 const rig=sampleLoisRig(actor,reduced);
 return ['leftWrist','rightWrist'].map(name=>loisJointPoint(actor,rig,name,[0,-.035,.018]));
}
export function poseLoisRopes(actor,boxes){
 const shot=sampleLoisUntie(actor.age),[a,b]=loisWristAnchors(actor);
 const middle={x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2},yaw=-Math.atan2(b.z-a.z,b.x-a.x);
 for(const box of boxes){
  if(!box.id.startsWith('captive-rope-'))continue;
  const i=Number(box.id.split('-').at(-1)),side=i-1,fall=shot.fall;
  box.x=middle.x+side*.025*fall;box.y=middle.y*(1-fall)+(actor.y+.035+side*.006)*fall+side*.020*(1-fall);
  box.z=middle.z+Math.cos(actor.yaw)*(.022+side*.015)*(1-fall)-.12*fall;
  box.yaw=yaw;box.roll=(i===1?.06:-.035)+side*.45*fall;
 }
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
