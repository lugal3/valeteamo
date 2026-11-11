import {JOINTS,JOINT_INDEX,setJoint} from '../character-rig.js';

export const ease=v=>{const t=Math.max(0,Math.min(1,v));return t*t*t*(t*(t*6-15)+10);};
export function curve(keys,time){
 if(time<=keys[0][0])return keys[0][1];
 for(let i=1;i<keys.length;i++)if(time<=keys[i][0]){const [a,x]=keys[i-1],[b,y]=keys[i];return x+(y-x)*ease((time-a)/(b-a));}
 return keys.at(-1)[1];
}
function quaternion(p,i){
 const sx=Math.sin(p[i]/2),cx=Math.cos(p[i]/2),sy=Math.sin(p[i+1]/2),cy=Math.cos(p[i+1]/2),sz=Math.sin(p[i+2]/2),cz=Math.cos(p[i+2]/2);
 return [sx*cy*cz-cx*sy*sz,cx*sy*cz+sx*cy*sz,cx*cy*sz-sx*sy*cz,cx*cy*cz+sx*sy*sz];
}
// Shortest-arc quaternion blending avoids full wrist turns across the ±π seam.
export function blendPose(from,to,weight,out){
 if(weight<=0){out.set(from);return out;}if(weight>=1){out.set(to);return out;}
 for(let i=0;i<out.length;i+=6){
  const a=quaternion(from,i),b=quaternion(to,i),sign=a.reduce((s,v,k)=>s+v*b[k],0)<0?-1:1,q=a.map((v,k)=>v*(1-weight)+b[k]*weight*sign),n=Math.hypot(...q),[x,y,z,w]=q.map(v=>v/n);
  out[i]=Math.atan2(2*(w*x+y*z),1-2*(x*x+y*y));out[i+1]=Math.asin(Math.max(-1,Math.min(1,2*(w*y-z*x))));out[i+2]=Math.atan2(2*(w*z+x*y),1-2*(y*y+z*z));
  for(let k=i+3;k<i+6;k++)out[k]=from[k]*(1-weight)+to[k]*weight;
 }
 return out;
}
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const unit=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const transpose=a=>[a[0],a[3],a[6],a[1],a[4],a[7],a[2],a[5],a[8]];
const apply=(m,v)=>[dot(m.slice(0,3),v),dot(m.slice(3,6),v),dot(m.slice(6,9),v)];
const multiply=(a,b)=>a.map((_,i)=>a[Math.floor(i/3)*3]*b[i%3]+a[Math.floor(i/3)*3+1]*b[i%3+3]+a[Math.floor(i/3)*3+2]*b[i%3+6]);
function between(a,b){
 a=unit(a);b=unit(b);let v=cross(a,b),w=1+dot(a,b);
 if(w<1e-6){v=unit(cross(a,Math.abs(a[0])<.8?[1,0,0]:[0,1,0]));w=0;}
 const n=Math.hypot(...v,w),[x,y,z]=v.map(k=>k/n);w/=n;
 return [1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w),2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w),2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)];
}
function rotation([x=0,y=0,z=0]){
 const cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
 return [cz*cy,cz*sy*sx-sz*cx,cz*sy*cx+sz*sx,sz*cy,sz*sy*sx+cz*cx,sz*sy*cx-cz*sx,-sy,cy*sx,cy*cx];
}
function jointRotation(out,name,r){setJoint(out,name,Math.atan2(r[7],r[8]),Math.asin(Math.max(-1,Math.min(1,-r[6]))),Math.atan2(r[3],r[0]));}

// Two-bone IK respects the actual asymmetric arm bind pose and fixed limb lengths.
// Targets are in character space; root translation is removed for planted feet.
export function limb(out,upper,lower,tip,target,bend,tipRotation=[0,0,0],offset=[0,0,0]){
 const pivot=name=>JOINTS[JOINT_INDEX[name]].pivot,p=pivot(upper),u=sub(pivot(lower),p),v=sub(pivot(tip),pivot(lower));
 const goal=sub(sub(target,offset),p),dir=unit(goal),a=Math.hypot(...u),b=Math.hypot(...v),d=Math.max(Math.abs(a-b)+1e-5,Math.min(a+b-1e-5,Math.hypot(...goal)));
 const cosine=Math.max(-1,Math.min(1,(a*a+d*d-b*b)/(2*a*d))),projection=dot(bend,dir);
 let pole=sub(bend,dir.map(n=>n*projection));if(Math.hypot(...pole)<1e-5)pole=cross(dir,[1,0,0]);pole=unit(pole);
 const elbow=dir.map((n,i)=>n*a*cosine+pole[i]*a*Math.sqrt(1-cosine*cosine)),forearm=dir.map((n,i)=>n*d-elbow[i]);
 const r=between(u,elbow),q=between(v,apply(transpose(r),forearm));
 jointRotation(out,upper,r);jointRotation(out,lower,q);jointRotation(out,tip,multiply(transpose(multiply(r,q)),rotation(tipRotation)));
}
export function arm(out,side,target,palm=[0,0,0],reach=0){
 const shift=[(side==='left'?1:-1)*.09*reach,0,.06*reach];
 limb(out,side+'Arm',side+'Forearm',side+'Hand',target,[side==='left'?-1:1,-.6,.1],palm,shift);
 const i=JOINT_INDEX[side+'Arm']*6;for(let k=0;k<3;k++)out[i+3+k]=shift[k];
}
export function feet(out,{x=0,y=0,z=0,left=[-.16,.11,.005],right=[.16,.11,.005],leftTilt=0,rightTilt=0}={}){
 setJoint(out,'root',0,0,0,x,y,z);
 for(const [side,target,tilt] of [['left',left,leftTilt],['right',right,rightTilt]])limb(out,side+'Leg',side+'Knee',side+'Foot',target,[0,0,1],[tilt,0,0],[x,y,z]);
}
