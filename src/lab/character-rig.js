// Rigid articulated skeleton, in metres. Parents precede children; no renderer/DOM dependency.
export const JOINTS=[
 ['root',null,[0,0,0]],['body','root',[0,.53,0]],['head','body',[0,1.02,0]],
 ['leftArm','body',[-.32,.86,.005]],['leftForearm','leftArm',[-.35,.66,.025]],['leftHand','leftForearm',[-.37,.54,.045]],
 ['rightArm','body',[.32,.86,.005]],['rightForearm','rightArm',[.35,1.01,.13]],['rightHand','rightForearm',[.365,1.145,.25]],
 ['leftLeg','root',[-.16,.43,.005]],['leftKnee','leftLeg',[-.16,.27,.005]],['leftFoot','leftKnee',[-.16,.11,.005]],
 ['rightLeg','root',[.16,.43,.005]],['rightKnee','rightLeg',[.16,.27,.005]],['rightFoot','rightKnee',[.16,.11,.005]]
].map(([name,parent,pivot])=>({name,parent,pivot}));
export const JOINT_INDEX=Object.fromEntries(JOINTS.map((j,i)=>[j.name,i]));
export const createPose=()=>new Float32Array(JOINTS.length*6);
export function setJoint(pose,name,rx=0,ry=0,rz=0,x=0,y=0,z=0){const i=JOINT_INDEX[name]*6;pose[i]=rx;pose[i+1]=ry;pose[i+2]=rz;pose[i+3]=x;pose[i+4]=y;pose[i+5]=z;}
export function axisJoint(pose,name,angle,forward,side){
 const a=-forward,c=side,C=Math.cos(angle),S=Math.sin(angle),v=1-C;
 setJoint(pose,name,Math.atan2(a*S,c*c*v+C),Math.asin(Math.max(-1,Math.min(1,-a*c*v))),Math.atan2(c*S,a*a*v+C));
}
export function createRigBinding(groups){
 return {groups:groups.map(g=>{const joint=JOINT_INDEX[g.joint||'root'];if(joint===undefined)throw Error('Unknown character joint: '+g.joint);return {...g,joint};}),matrices:new Float32Array(JOINTS.length*12),evaluations:0};
}
export function evaluateRig(binding,pose){
 const m=binding.matrices;
 for(let i=0;i<JOINTS.length;i++){
  const joint=JOINTS[i],j=i*6,o=i*12,p=joint.parent===null?-1:JOINT_INDEX[joint.parent]*12;
  const [rx,ry,rz]=pose.subarray(j,j+3),cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);
  // Rz * Ry * Rx, row-major affine 3x4 matrices.
  const r=[cz*cy,cz*sy*sx-sz*cx,cz*sy*cx+sz*sx,sz*cy,sz*sy*sx+cz*cx,sz*sy*cx-cz*sx,-sy,cy*sx,cy*cx];
  const parentPivot=joint.parent===null?[0,0,0]:JOINTS[JOINT_INDEX[joint.parent]].pivot;
  const t=joint.pivot.map((v,k)=>v-parentPivot[k]+pose[j+3+k]);
  for(let row=0;row<3;row++){
   for(let col=0;col<3;col++)m[o+row*4+col]=p<0?r[row*3+col]:m[p+row*4]*r[col]+m[p+row*4+1]*r[3+col]+m[p+row*4+2]*r[6+col];
   m[o+row*4+3]=p<0?t[row]:m[p+row*4]*t[0]+m[p+row*4+1]*t[1]+m[p+row*4+2]*t[2]+m[p+row*4+3];
  }
 }
 binding.evaluations++;return m;
}
export function skinCharacter(base,out,binding,blink=0){
 out.set(base);const m=binding.matrices;
 for(const g of binding.groups){
  const o=g.joint*12,p=JOINTS[g.joint].pivot;
  const closure=g.blinkY===undefined?0:blink,eyeScale=1-closure*.90;
  for(let i=g.start*16;i<g.end*16;i+=16){
   const eyeY=closure?g.blinkY+(base[i+1]-g.blinkY)*eyeScale-.016*closure:base[i+1];
   const x=base[i]-p[0],y=eyeY-p[1],z=base[i+2]-p[2];
   out[i]=m[o]*x+m[o+1]*y+m[o+2]*z+m[o+3];out[i+1]=m[o+4]*x+m[o+5]*y+m[o+6]*z+m[o+7];out[i+2]=m[o+8]*x+m[o+9]*y+m[o+10]*z+m[o+11];
   for(const k of [6,13]){
    const nx=base[i+k],ny=k===6?base[i+k+1]/eyeScale:base[i+k+1]*eyeScale,nz=base[i+k+2];
    const norm=closure?Math.hypot(nx,ny,nz)||1:1;
    out[i+k]=(m[o]*nx+m[o+1]*ny+m[o+2]*nz)/norm;out[i+k+1]=(m[o+4]*nx+m[o+5]*ny+m[o+6]*nz)/norm;out[i+k+2]=(m[o+8]*nx+m[o+9]*ny+m[o+10]*nz)/norm;
   }
  }
 }
 return out;
}
export function jointPosition(binding,name){const i=JOINT_INDEX[name]*12;return [binding.matrices[i+3],binding.matrices[i+7],binding.matrices[i+11]];}
